onmessage = (ev) => {
  const wsproto = "net.measurementlab.ndt.v7"
  const zero = new Date().getTime()

  const log = (...message) => {
    const t = new Date().getTime()
    console.log(t - zero, ...message)
  }

  const doDownload = (url, callback) => {
    const sock = new WebSocket(url, wsproto)

    sock.onopen = function () {
      log("download onopen")
      const start = new Date().getTime()
      let previous = start
      let total = 0
      sock.onmessage = function (ev) {
        total += (ev.data instanceof Blob) ? ev.data.size : ev.data.length
        let now = new Date().getTime()
        const every = 250  // ms
        if (now - previous > every) {
          const speed = total * 8 / ((now - start) * 1000)
          log("download", speed)
          previous = now
        }
      }
    }

    sock.onclose = () => {
      log("download onclose")
      callback()
    }
  }

  doDownload(ev.data.url, () => postMessage(null))
}