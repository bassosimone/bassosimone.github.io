/* jshint esversion: 6, asi: true, worker: true */
// WebWorker that runs the ndt7 download test
importScripts("ndt7-core.js")
onmessage = function (ev) {
  ndt7core.download(ev, WebSocket, postMessage)
}