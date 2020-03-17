/* jshint esversion: 6, asi: true */
const ndt5core = (function () {
  "use strict"

  function startWorker(config, url) {
    let worker = new Worker("ndt-wrapper-ww.js")
    worker.onmessage = function (ev) {
      let msg = ev.data;
      switch (msg.cmd) {
        case "onprogress":
          if (config.ontestmeasurement !== undefined) {
            config.ontestmeasurement({
              AppInfo: {
                ElapsedTime: 1000 * 1000 * ((msg.state === "interval_c2s") ?
                  msg.results.c2sElapsed : msg.results.s2cElapsed),
                NumBytes: ((msg.state === "interval_c2s") ?
                  msg.results.c2sTotal : msg.results.s2cTotal),
              },
              Origin: "client",
              Test: (msg.state === "interval_c2s") ? "upload" : "download"
            })
          }
          break
        case "onstatechange":
          if (msg.state === "finished_s2c" && config.ontestmeasurement !== undefined) {
            const prefix = "TCPInfo."
            let ti = {
              ElapsedTime: msg.results.s2cElapsed * 1e06, /* s => us */
            }
            for (let [key, value] of Object.entries(msg.results)) {
              if (key.startsWith(prefix)) {
                key = key.substr(prefix.length)
                ti[key] = Number(value)
              }
            }
            config.ontestmeasurement({
              Origin: "server",
              TCPInfo: ti,
              Test: "download"
            })
          }
          break
        case "onfinish":
          if (config.oncomplete !== undefined) {
            config.oncomplete()
          }
          break
      }
      console.log(msg)
    }
    let parsed = new URL(url)
    worker.postMessage({
      cmd: "start",
      hostname: parsed.hostname,
      port: 3010,
      protocol: "wss",
      path: "/ndt_protocol",
      update_interval: 250,
    })
  }

  // start starts the ndt5 test suite. Its interface is exactly like
  // ndt7core.start except that here we run ndt5.
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
      startWorker(config, url)
    })
  }

  return {
    start: start,
  }
})()
