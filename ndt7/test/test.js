"use strict"

// WebSocketMocks contains mocks for a WebSocket
function WebSocketMocks() {
  let vars = {
    instance: undefined,
    out: [],
    realURL: undefined,
    realProtocol: undefined,
  }
  vars.newWebSocket = function (url, protocol) {
    if (vars.instance !== undefined) {
      throw new Error("too many new WebSocket calls")
    }
    vars.realURL = url
    vars.realProtocol = protocol
    this.onclose = undefined
    this.onopen = undefined
    this.onmessage = undefined
    this.close = function () {
      this.onclose()
    }
    this.bufferedAmount = 0
    this.send = function (msg) {
      vars.out.push(msg)
    }
    vars.instance = this
  }
  vars.open = function () {
    vars.instance.onopen()
  }
  vars.send = function (msg) {
    vars.instance.onmessage(msg)
  }
  return vars
}

// BlobMocks contains mocks for Blob
function BlobMocks(array) {
  this.size = array.length
}

// DateMocks contains mocks for Date
function DateMocks() {
  let times = []
  return {
    newDate: function () {
      this.getTime = function () {
        return times.pop()
      }
    },
    pushTime: function (now) {
      times.push(now)
    },
    size: function () {
      return times.length
    }
  }
}

// PostMessageMocks contains mocks for postMessage
function PostMessageMocks() {
  let messages = []
  return {
    postMessage: function (msg) {
      messages.push(msg)
    },
    pop: function () {
      return messages.pop()
    },
    size: function () {
      return messages.length
    }
  }
}

describe("ndt7core.startDownload", function () {
  it("should work as intended", function (done) {
    // create the mocks
    let datemocks = DateMocks()
    let postmessagemocks = PostMessageMocks()
    let wsmocks = WebSocketMocks()
    // start download
    ndt7core.startDownload({
      Blob: BlobMocks,
      Date: datemocks.newDate,
      WebSocket: wsmocks.newWebSocket,
      baseURL: "https://www.example.com/",
      postMessage: postmessagemocks.postMessage,
    })
    // we open the connection
    datemocks.pushTime(10)
    wsmocks.open()
    if (datemocks.size() !== 0) {
      throw new Error("the code did not get the test start time")
    }
    chai.assert(wsmocks.realURL === "wss://www.example.com/ndt/v7/download")
    chai.assert(wsmocks.realProtocol === "net.measurementlab.ndt.v7")
    // we receive a binary messages
    datemocks.pushTime(100)
    wsmocks.send({
      data: new BlobMocks(new Uint8Array(4096))
    })
    if (postmessagemocks.size() !== 0) {
      throw new Error("the code did fire postMessage too early")
    }
    if (datemocks.size() !== 0) {
      throw new Error("the code did not get the current time")
    }
    // we receive a server measurement
    datemocks.pushTime(150)
    wsmocks.send({
      data: `{"TCPInfo": {"RTT": 100}}`
    })
    if (postmessagemocks.size() !== 1) {
      throw new Error("unexpected number of posted messages")
    }
    chai.assert(_.isEqual(postmessagemocks.pop(), {
      Origin: "server",
      TCPInfo: {
        RTT: 100,
      },
      Test: "download"
    }))
    if (datemocks.size() !== 0) {
      throw new Error("the code did not get the current time")
    }
    // we receive more data after more than 250 ms from previous beginning
    datemocks.pushTime(350)
    wsmocks.send({
      data: new BlobMocks(new Uint8Array(4096))
    })
    if (postmessagemocks.size() !== 1) {
      throw new Error("unexpected number of posted messages")
    }
    chai.assert(_.isEqual(postmessagemocks.pop(), {
      AppInfo: {
        ElapsedTime: 340000,
        NumBytes: 8217,
      },
      Origin: "client",
      Test: "download"
    }))
    if (datemocks.size() !== 0) {
      throw new Error("the code did not get the current time")
    }
    done()
  })
})

describe("ndt7core.startUpload", function () {
  it("should work as intended", function (done) {
    // create the mocks
    let datemocks = DateMocks()
    let wsmocks = WebSocketMocks()
    let lastNumBytes = 0
    let lastElapsedTime = 0
    // start download
    ndt7core.startUpload({
      Date: datemocks.newDate,
      WebSocket: wsmocks.newWebSocket,
      baseURL: "https://www.example.com/",
      postMessage: function (ev) {
        if (ev === null) {
          if (wsmocks.out.length != 22) {
            throw new Error("unexpected number of queued messages")
          }
          if (wsmocks.out[17].length != 16384) {
            throw new Error("messages were not scaled")
          }
          done()
          return
        }
        if (ev.Origin !== "client") {
          throw new Error("unexpected message Origin")
        }
        if (ev.Test !== "upload") {
          throw new Error("unexpected message Test")
        }
        if (ev.AppInfo.NumBytes <= lastNumBytes) {
          throw new Error("NumBytes didn't increment")
        }
        if (ev.AppInfo.ElapsedTime <= lastElapsedTime) {
          throw new Error("ElapsedTime didn't increment")
        }
        lastElapsedTime = ev.AppInfo.ElapsedTime
        lastNumBytes = ev.AppInfo.NumBytes
      }
    })
    // we open the connection
    for (let t = 11000; t > 0; t -= 440) { // reverse order since we push
      datemocks.pushTime(t)
    }
    wsmocks.open()
    chai.assert(wsmocks.realURL === "wss://www.example.com/ndt/v7/upload")
    chai.assert(wsmocks.realProtocol === "net.measurementlab.ndt.v7")
  })
})

function Mocks(config) {
  let state = {
    workerMain: config.workerMain,
    workerTerminated: 0,
  }
  state.Worker = function () {
    this.onerror = undefined
    this.onmessage = undefined
    this.terminate = function () {
      state.workerTerminated++
    }
    this.postMessage = function (ev) {
      state.workerMain(this, ev)
    }
  }
  return state
}

describe("ndt7core.start", function () {
  it("should throw if there is no config", function () {
    chai.assert.throws(function () {
      ndt7core.start()
    }, Error)
  })

  it("should throw if there is no userAcceptDataPolicy field", function () {
    chai.assert.throws(function () {
      ndt7core.start({})
    }, Error)
  })

  it("should throw if user did not accept data policy", function () {
    chai.assert.throws(function () {
      ndt7core.start({userAcceptedDataPolicy: false})
    }, Error, "fatal: user must accept data policy first")
  })

  it("should work as intended without optional callbacks", function (done) {
    const expectedURL = "https://www.example.com/"
    ndt7core.start({
      doStartWorker: function (config, url, name, callback) {
        chai.assert(typeof config === "object")
        chai.assert(url === expectedURL)
        chai.assert(name === "download" || name === "upload")
        callback()
      },
      locate: function (callback) {
        callback(expectedURL)
      },
      oncomplete: done,
      onstarting: function () {},
      userAcceptedDataPolicy: true,
    })
  })

  it("should work as intended with optional callbacks", function (done) {
    let calledOnStarting = false
    let calledOnServerURL = false
    const expectedURL = "https://www.example.com/"
    ndt7core.start({
      doStartWorker: function (config, url, name, callback) {
        chai.assert(typeof config === "object")
        chai.assert(url === expectedURL)
        chai.assert(name === "download" || name === "upload")
        chai.assert(calledOnServerURL == true)
        chai.assert(calledOnStarting == true)
        callback()
      },
      locate: function (callback) {
        callback(expectedURL)
      },
      oncomplete: done,
      onstarting: function () {
        calledOnStarting = true
      },
      onserverurl: function (url) {
        calledOnServerURL = true
        chai.assert(url === expectedURL)
      },
      userAcceptedDataPolicy: true,
    })
  })

  it("should behave correctly when the worker is killed", function (done) {
    let complete = []
    let mocks = Mocks({
      workerMain: function () {}
    })
    ndt7core.start({
      Worker: mocks.Worker,
      killAfter: 7,
      locate: function (callback) {
        callback("https://www.example.com/")
      },
      oncomplete: function () {
        chai.assert(mocks.workerTerminated === 2)
        chai.assert(complete.length === 2)
        chai.assert(complete[0].Origin === "client")
        chai.assert(complete[0].Test === "download")
        chai.assert(complete[0].WorkerInfo.ElapsedTime > 0)
        chai.assert(complete[0].WorkerInfo.Error === "Terminated with timeout")
        chai.assert(complete[1].Origin === "client")
        chai.assert(complete[1].Test === "upload")
        chai.assert(complete[1].WorkerInfo.ElapsedTime > 0)
        chai.assert(complete[1].WorkerInfo.Error === "Terminated with timeout")
        done()
      },
      ontestcomplete: function (ev) {
        complete.push(ev)
      },
      userAcceptedDataPolicy: true,
    })
  })

  it("should behave correctly when the worker throws", function (done) {
    let complete = []
    let mocks = Mocks({
      workerMain: function (worker) {
        setTimeout(function () {
          worker.onerror({})
        }, 10)
      }
    })
    ndt7core.start({
      Worker: mocks.Worker,
      locate: function (callback) {
        callback("https://www.example.com/")
      },
      oncomplete: function () {
        chai.assert(complete.length === 2)
        chai.assert(complete[0].Origin === "client")
        chai.assert(complete[0].Test === "download")
        chai.assert(complete[0].WorkerInfo.ElapsedTime > 0)
        chai.assert(complete[0].WorkerInfo.Error === "Terminated with exception")
        chai.assert(complete[1].Origin === "client")
        chai.assert(complete[1].Test === "upload")
        chai.assert(complete[1].WorkerInfo.ElapsedTime > 0)
        chai.assert(complete[1].WorkerInfo.Error === "Terminated with exception")
        done()
      },
      ontestcomplete: function (ev) {
        complete.push(ev)
      },
      userAcceptedDataPolicy: true,
    })
  })

  it("should behave correctly when the worker works as intended", function (done) {
    let complete = []
    let mocks = Mocks({
      workerMain: function (worker) {
        setTimeout(function () {
          worker.onmessage({data: {antani: 1}})
          worker.onmessage({data: null})
        }, 7)
      }
    })
    let msgs = []
    ndt7core.start({
      Worker: mocks.Worker,
      locate: function (callback) {
        callback("https://www.example.com/")
      },
      oncomplete: function () {
        chai.assert(msgs.length === 2)
        chai.assert(msgs[0].antani === 1)
        chai.assert(msgs[1].antani === 1)
        chai.assert(complete.length === 2)
        chai.assert(complete[0].Origin === "client")
        chai.assert(complete[0].Test === "download")
        chai.assert(complete[0].WorkerInfo.ElapsedTime > 0)
        chai.assert(complete[0].WorkerInfo.Error === null)
        chai.assert(complete[1].Origin === "client")
        chai.assert(complete[1].Test === "upload")
        chai.assert(complete[1].WorkerInfo.ElapsedTime > 0)
        chai.assert(complete[1].WorkerInfo.Error === null)
        done()
      },
      ontestcomplete: function (ev) {
        complete.push(ev)
      },
      ontestmeasurement: function (ev) {
        msgs.push(ev)
      },
      userAcceptedDataPolicy: true,
    })
  })
})