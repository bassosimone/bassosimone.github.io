/* jshint esversion: 6, asi: true, worker: true */
// WebWorker that runs the ndt7 upload test
importScripts("ndt7-core.js")
onmessage = function (ev) {
  ndt7core.startUpload({
    baseURL: ev.data.baseURL,
    postMessage: self.postMessage.bind(self),
  })
}