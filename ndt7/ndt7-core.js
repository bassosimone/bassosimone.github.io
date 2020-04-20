/* jshint esversion: 6, asi: true */

// ndt7core contains the core ndt7 client functionality. Please, refer
// to the ndt7 spec available at the following URL:
//
// https://github.com/m-lab/ndt-server/blob/master/spec/ndt7-protocol.md
//
// This implementation uses v0.9.0 of the spec.
const ndt7core = (function () {
  "use strict"

  function maybeCall(f, msg) {
    f ? f(msg) : null
  }

  function funcOrDefault(f, df) {
    return f ? f : df
  }

  const wsproto = "net.measurementlab.ndt.v7"

  function startDownload(config) {
    let url = new URL(config.baseURL)
    url.protocol = (url.protocol === "https:") ? "wss:" : "ws:"
    url.pathname = "/ndt/v7/download"
    const sock = new (config.WebSocket || WebSocket)(url.toString(), wsproto)
    sock.onclose = function () {
      postMessage(null)
    }
    const DateType = config.Date || Date
    const BlobType = config.Blob || Blob
    sock.onopen = function () {
      const start = new DateType().getTime()
      let previous = start
      let total = 0
      sock.onmessage = function (ev) {
        total += (ev.data instanceof BlobType) ? ev.data.size : ev.data.length
        let now = new DateType().getTime()
        const every = 250  // ms
        if (now - previous > every) {
          config.postMessage({
            AppInfo: {
              ElapsedTime: (now - start) * 1000,  // us
              NumBytes: total,
            },
            Origin: "client",
            Test: "download",
          })
          previous = now
        }
        if ((ev.data instanceof BlobType) === false) {
          let m = JSON.parse(ev.data)
          m.Origin = "server"
          m.Test = "download"
          config.postMessage(m)
        }
      }
    }
  }

  function startUpload(config) {
    let url = new URL(config.baseURL)
    url.protocol = (url.protocol === "https:") ? "wss:" : "ws:"
    url.pathname = "/ndt/v7/upload"
    const sock = new (config.WebSocket || WebSocket)(url.toString(), wsproto)
    let closed = false
    sock.onclose = function () {
      closed = true
      config.postMessage(null)
    }
    const DateType = config.Date || Date
    function uploader(data, start, previous, total) {
      if (closed) {
        // socket.send() with too much buffering causes socket.close(). We only
        // observed this behaviour with pre-Chromium Edge.
        return
      }
      let now = new DateType().getTime()
      const duration = 10000  // millisecond
      if (now - start > duration) {
        sock.close()
        return
      }
      const maxMessageSize = 16777216 /* = (1<<24) = 16MB */
      if (data.length < maxMessageSize && data.length < (total - sock.bufferedAmount) / 16) {
        // TODO(bassosimone): fill this message. Filling the message is not a
        // concern when we're using secure WebSockets.
        data = new Uint8Array(data.length * 2)
      }
      const underbuffered = 7 * data.length
      if (sock.bufferedAmount < underbuffered) {
        sock.send(data)
        total += data.length
      }
      const every = 250  // millisecond
      if (now - previous > every) {
        config.postMessage({
          AppInfo: {
            ElapsedTime: (now - start) * 1000,  // us
            NumBytes: (total - sock.bufferedAmount),
          },
          Origin: "client",
          Test: "upload",
        })
        previous = now
      }
      setTimeout(
        function () { uploader(data, start, previous, total) },
        0)
    }
    sock.onopen = function () {
      const initialMessageSize = 8192 /* (1<<13) */
      // TODO(bassosimone): fill this message - see above comment
      const data = new Uint8Array(initialMessageSize)
      sock.binarytype = "arraybuffer"
      const start = new DateType().getTime()
      uploader(data, start, start, 0)
    }
  }

  function startWorker(config, baseURL, testName, callback) {
    maybeCall(config.onteststarting, {Origin: "client", Test: testName})
    const DateType = config.Date || Date
    const start = new DateType().getTime()
    let done = false
    let worker = new (config.Worker || Worker)("ndt7-" + testName + ".js")
    function finish(error) {
      if (!done) {
        done = true
        maybeCall(config.ontestcomplete, {
          Origin: "client",
          Test: testName,
          WorkerInfo: {
            ElapsedTime: (new DateType().getTime() - start) * 1000, // us
            Error: error,
          },
        })
        callback()
      }
    }
    worker.onerror = function (ev) {
      finish(ev.message || "Terminated with exception")
    }
    worker.onmessage = function (ev) {
      ev.data === null ? finish(null) : maybeCall(config.ontestmeasurement, ev.data)
    }
    // Kill the worker after the timeout. This forces the browser to
    // close the WebSockets and prevents too-long tests.
    const killAfter = config.killAfter || 10000 // ms
    setTimeout(function () {
      worker.terminate()
      finish("Terminated with timeout")
    }, killAfter)
    worker.postMessage({baseURL: baseURL})
  }

  function start(config) {
    if (config.userAcceptedDataPolicy !== true) {
      throw new Error("fatal: user must accept data policy first")
    }
    maybeCall(config.onstarting)
    const doStartWorker = funcOrDefault(config.doStartWorker, startWorker)
    config.locate(function (url) {
      maybeCall(config.onserverurl, url)
      doStartWorker(config, url, "download", function () {
        doStartWorker(config, url, "upload", config.oncomplete)
      })
    })
  }

  return {
    startDownload: startDownload,
    startUpload: startUpload,
    start: start,
  }
})()

if (typeof exports !== "undefined") {
  exports.startDownload = ndt7core.startDownload
  exports.startUpload = ndt7core.startUpload
  exports.start = ndt7core.start
}