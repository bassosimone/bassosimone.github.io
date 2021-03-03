onmessage = function (ev) {
  const wsproto = "net.measurementlab.ndt.v7"
  const zero = new Date().getTime()

  const log = (...message) => {
    const t = new Date().getTime()
    console.log(t - zero, ...message)
  }

  const doUpload = (url, callback) => {
    let isclosed = false
    const sock = new WebSocket(url, wsproto)

    sock.onclose = () => {
      log("upload onclose")
      if (!isclosed) {
        isclosed = true
        callback()
      }
    }

    function uploader(data, start, previous, total) {
      if (isclosed) {
        // socket.send() with too much buffering causes socket.close(). We only
        // observed this behaviour with pre-Chromium Edge.
        return
      }
      let now = new Date().getTime()
      const duration = 10000  // millisecond
      if (now - start > duration) {
        log("upload enough")
        sock.close()
        return
      }
      const maxMessageSize = 16777216
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
        const speed = (total - sock.bufferedAmount) * 8 / ((now - start) * 1000)
        log("upload", speed)
        previous = now
      }
      setTimeout(() => { uploader(data, start, previous, total) }, 0)
    }

    sock.onopen = function () {
      log("upload onopen")
      const initialMessageSize = 8192
      // TODO(bassosimone): fill this message - see above comment
      const data = new Uint8Array(initialMessageSize)
      sock.binarytype = "arraybuffer"
      const start = new Date().getTime()
      uploader(data, start, start, 0)
    }
  }

  doUpload(ev.data.url, () => postMessage(null))
}