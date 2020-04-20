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
      throw "too many new WebSocket calls"
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

describe('ndt7core.startDownload', function () {
  it('should work as intended', function (done) {
    // create the mocks
    let datemocks = DateMocks()
    let postmessagemocks = PostMessageMocks()
    let wsmocks = WebSocketMocks()
    // start download
    ndt7core.startDownload({
      Blob: BlobMocks,
      Date: datemocks.newDate,
      JSON: JSON,
      WebSocket: wsmocks.newWebSocket,
      baseURL: "https://www.example.com/",
      postMessage: postmessagemocks.postMessage,
    })
    // we open the connection
    datemocks.pushTime(10)
    wsmocks.open()
    if (datemocks.size() !== 0) {
      throw "the code did not get the test start time"
    }
    chai.assert(wsmocks.realURL === "wss://www.example.com/ndt/v7/download")
    chai.assert(wsmocks.realProtocol === "net.measurementlab.ndt.v7")
    // we receive a binary messages
    datemocks.pushTime(100)
    wsmocks.send({
      data: new BlobMocks(new Uint8Array(4096))
    })
    if (postmessagemocks.size() !== 0) {
      throw "the code did fire postMessage too early"
    }
    if (datemocks.size() !== 0) {
      throw "the code did not get the current time"
    }
    // we receive a server measurement
    datemocks.pushTime(150)
    wsmocks.send({
      data: `{"TCPInfo": {"RTT": 100}}`
    })
    if (postmessagemocks.size() !== 1) {
      throw "unexpected number of posted messages"
    }
    chai.assert(_.isEqual(postmessagemocks.pop(), {
      Origin: "server",
      TCPInfo: {
        RTT: 100,
      },
      Test: "download"
    }))
    if (datemocks.size() !== 0) {
      throw "the code did not get the current time"
    }
    // we receive more data after more than 250 ms from previous beginning
    datemocks.pushTime(350)
    wsmocks.send({
      data: new BlobMocks(new Uint8Array(4096))
    })
    if (postmessagemocks.size() !== 1) {
      throw "unexpected number of posted messages"
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
      throw "the code did not get the current time"
    }
    done()
  })
})

describe('ndt7core.startUpload', function () {
  it('should work as intended', function (done) {
    // create the mocks
    let datemocks = DateMocks()
    let wsmocks = WebSocketMocks()
    let lastNumBytes = 0
    let lastElapsedTime = 0
    // start download
    ndt7core.startUpload({
      Date: datemocks.newDate,
      JSON: JSON,
      WebSocket: wsmocks.newWebSocket,
      baseURL: "https://www.example.com/",
      postMessage: function (ev) {
        if (ev === null) {
          if (wsmocks.out.length != 22) {
            throw "unexpected number of queued messages"
          }
          if (wsmocks.out[17].length != 16384) {
            throw "messages were not scaled"
          }
          done()
          return
        }
        if (ev.Origin !== "client") {
          throw "unexpected message Origin"
        }
        if (ev.Test !== "upload") {
          throw "unexpected message Test"
        }
        if (ev.AppInfo.NumBytes <= lastNumBytes) {
          throw "NumBytes didn't increment"
        }
        if (ev.AppInfo.ElapsedTime <= lastElapsedTime) {
          throw "ElapsedTime didn't increment"
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
