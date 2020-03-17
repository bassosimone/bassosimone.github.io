/* jshint esversion: 6, asi: true */
const ndt7core = (function () {
  "use strict"

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
    let worker = new Worker("ndt7-" + config.testName + ".js")
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
    config.locate(function (url) {
      config.onserverurl(url)
      startTest(config, url, "download", function () {
        startTest(config, url, "upload", config.oncomplete)
      })
    })
  }

  return {
    start: start,
  }
})()