/* jshint esversion: 6, asi: true, worker: true */
// WebWorker that runs the ndt7 download test
importScripts("ndt7-core.js")
onmessage = function (ev) {
  ndt7core.startDownload({
    Blob: Blob,
    Date: Date,
    JSON: JSON,
    WebSocket: WebSocket,
    baseURL: ev.data.baseURL,
    postMessage: self.postMessage.bind(self),
  })
}