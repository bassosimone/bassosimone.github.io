/* jshint esversion: 6, asi: true */
const ndt7core = (function () {
  "use strict"

  // download implement the download Web Worker.
  function download(ev, WebSocket, postMessage) {
    let url = new URL(ev.data.baseURL)
    url.protocol = (url.protocol === "https:") ? "wss:" : "ws:"
    url.pathname = "/ndt/v7/download"
    const sock = new WebSocket(url.toString(), "net.measurementlab.ndt.v7")
    sock.onclose = function () {
      postMessage(null)
    }
    sock.onopen = function () {
      const start = new Date().getTime()
      let previous = start
      let total = 0
      sock.onmessage = function (ev) {
        total += (ev.data instanceof Blob) ? ev.data.size : ev.data.length
        let now = new Date().getTime()
        const every = 250  // ms
        if (now - previous > every) {
          postMessage({
            "AppInfo": {
              "ElapsedTime": (now - start) * 1000,  // us
              "NumBytes": total,
            },
            "Origin": "client",
            "Test": "download",
          })
          previous = now
        }
        if (!(ev.data instanceof Blob)) {
          let m = JSON.parse(ev.data)
          m.Origin = "server"
          m.Test = "download"
          postMessage(m)
        }
      }
    }
  }

  // upload implements the upload WebWorker.
  function upload(ev, WebSocket, postMessage) {
    let url = new URL(ev.data.baseURL)
    url.protocol = (url.protocol === "https:") ? "wss:" : "ws:"
    const wsproto = "net.measurementlab.ndt.v7"
    url.pathname = "/ndt/v7/upload"
    const sock = new WebSocket(url.toString(), wsproto)
    let closed = false
    sock.onclose = function () {
      closed = true
      postMessage(null)
    }
    function uploader(socket, data, start, previous, total) {
      if (closed) {
        return // socket.send() with too much buffering causes socket.close()
      }
      let now = new Date().getTime()
      const duration = 10000  // millisecond
      if (now - start > duration) {
        sock.close()
        return
      }
      const maxMessageSize = 16777216 /* = (1<<24) = 16MB */
      if (data.length < maxMessageSize && data.length < (total - sock.bufferedAmount) / 16) {
        data = new Uint8Array(data.length * 2) // TODO(bassosimone): fill this message
      }
      const underbuffered = 7 * data.length
      if (sock.bufferedAmount < underbuffered) {
        sock.send(data)
        total += data.length
      }
      const every = 250  // millisecond
      if (now - previous > every) {
        postMessage({
          "AppInfo": {
            "ElapsedTime": (now - start) * 1000,  // us
            "NumBytes": (total - sock.bufferedAmount),
          },
          "Origin": "client",
          "Test": "upload",
        })
        previous = now
      }
      setTimeout(
        function () { uploader(sock, data, start, previous, total) },
        0)
    }
    sock.onopen = function () {
      const initialMessageSize = 8192 /* (1<<13) */
      const data = new Uint8Array(initialMessageSize) // TODO(bassosimone): fill this message
      sock.binarytype = "arraybuffer"
      const start = new Date().getTime()
      uploader(sock, data, start, start, 0)
    }
  }

  function startWorker(config) {
    if (config.testName !== "download" && config.testName !== "upload") {
      throw "fatal: testName is neither download nor upload"
    }
    if (config.baseURL === undefined || config.baseURL === "") {
      throw "fatal: baseURL not provided"
    }
    if (config.onteststarting !== undefined) {
      config.onteststarting({
        "Origin": "client",
        "Test": config.testName,
      })
    }
    const start = new Date().getTime()
    let done = false
    let worker = config.newWorker("ndt7-" + config.testName + ".js")
    function finish(error) {
      if (!done) {
        done = true
        const stop = new Date().getTime()
        if (config.ontestcomplete !== undefined) {
          config.ontestcomplete({
            "Origin": "client",
            "Test": config.testName,
            "WorkerInfo": {
              "ElapsedTime": (stop - start) * 1000, // us
              "Error": error,
            },
          })
        }
      }
    }
    worker.onerror = function (ev) {
      finish(ev.message || "Terminated with exception")
    }
    worker.onmessage = function (ev) {
      if (ev.data === null) {
        finish(null)
        return
      }
      if (config.ontestmeasurement !== undefined) {
        config.ontestmeasurement(ev.data)
      }
    }
    // Kill the worker after the timeout. This forces the browser to
    // close the WebSockets and prevents too-long tests.
    const killAfter = 10000 // ms
    setTimeout(function () {
      worker.terminate()
      finish("Terminated with timeout")
    }, killAfter)
    worker.postMessage({
      baseURL: config.baseURL,
    })
  }

  function startTest(config, url, testName, callback) {
    startWorker({
      baseURL: url,
      newWorker: config.newWorker,
      onteststarting: config.onteststarting,
      ontestmeasurement: config.ontestmeasurement,
      ontestcomplete: function (ev) {
        if (config.ontestcomplete !== undefined) {
          config.ontestcomplete(ev)
        }
        callback()
      },
      testName: testName,
      userAcceptedDataPolicy: config.userAcceptedDataPolicy,
    })
  }

  // start starts the ndt7 test suite. The config object structure is:
  //
  //     {
  //       locate: function (callback) {},
  //       oncomplete: function () {},
  //       onstarting: function () {},
  //       ontestcomplete: function (testSpec) {},
  //       ontestmeasurement: function (measurement) {},
  //       onteststarting: function (testSpec) {},
  //       userAcceptedDataPolicy: true
  //     }
  //
  // where
  //
  // - `locate` (`function(function(err, url))`) is the function that finds
  //   out the server with which to run the ndt7 test suite.
  //
  // - `oncomplete` (`function(testSpec)`) is the optional callback called
  //   when the whole test suite has finished.
  //
  // - `onstarting` is like `oncomplete` but called at startup.
  //
  // - `onserverurl` (`function(string)`) is called when we have located
  //   the server URL, or immediately if you provided a baseURL.
  //
  // - `ontestcomplete` (`function(testSpec)`) is the optional callback called
  //   when done (see below for the testSpec structure).
  //
  // - `ontestmeasurement` (`function(measurement)`) is the optional callback
  //   called when a new measurement object is emitted (see below).
  //
  // - `onteststarting` is like `ontestcomplete` but called at startup.
  //
  // - `userAcceptedDataPolicy` MUST be present and set to true otherwise
  //   this function will immediately throw an exception.
  //
  // The measurement object is described by the ndt7 specification. See
  // https://github.com/m-lab/ndt-server/blob/master/spec/ndt7-protocol.md.
  //
  // The testSpec structure is like:
  //
  //     {
  //       "Origin": "client",
  //       "Test": ""
  //     }
  //
  // where Origin is always "client" and Test is "download" or "upload".
  function start(config) {
    if (config === undefined || config.userAcceptedDataPolicy !== true) {
      throw "fatal: user must accept data policy first"
    }
    if (config.locate === undefined) {
      throw "fatal: locate must be specified"
    }
    if (config.onstarting !== undefined) {
      config.onstarting()
    }
    if (config.newWorker === undefined) {
      config.newWorker = function (filepath) {
        return new Worker(filepath)
      }
    }
    config.locate(function (url) {
      config.onserverurl(url)
      startTest(config, url, "download", function () {
        startTest(config, url, "upload", config.oncomplete)
      })
    })
  }

  return {
    download: download,
    start: start,
    upload: upload,
  }
})()
if (typeof exports !== "undefined") {
  exports.download = ndt7core.download
  exports.start = ndt7core.start
  exports.upload = ndt7core.upload
}