/* jshint esversion: 6, asi: true */
const ndt7locate = (function () {
  "use strict"

  // newInstance creates a new instance of the locator using
  // the specified configuration, which is like:
  //
  //     {
  //       mockedResult: "<url>",
  //       url: "<url>",
  //     }
  //
  // where:
  //
  // - `mockedResult` is the optional mocked result of the location
  //   lookup, which must be a valid URL string.
  //
  // - `url` is the optional URL of the location service.
  function newInstance(config) {
    config = config || {}
    return {
      locate: function (cb) {
        if (config.mockedResult !== undefined && config.mockedResult !== "") {
          cb(config.mockedResult)
          return
        }
        fetch((config.url) ? config.url : "https://locate.measurementlab.net/ndt7")
          .then(function (response) {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
          })
          .then(function (doc) {
            cb("https://" + doc.fqdn + "/")
          })
      }
    }
  }

  return {
    newInstance: newInstance,
  }
})()