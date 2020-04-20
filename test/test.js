"use strict"

// WebSocketMocks contains mocks for a WebSocket
function WebSocketMocks() {
  let vars = {
    instance: undefined,
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
    setTime: function (now) {
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
    datemocks.setTime(10)
    wsmocks.open()
    if (datemocks.size() !== 0) {
      throw "the code did not get the test start time"
    }
    chai.assert(wsmocks.realURL === "wss://www.example.com/ndt/v7/download")
    chai.assert(wsmocks.realProtocol === "net.measurementlab.ndt.v7")
    // we receive a binary messages
    datemocks.setTime(100)
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
    datemocks.setTime(150)
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
    datemocks.setTime(350)
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
