onmessage = (ev) => {
  const wsproto = "net.measurementlab.ndt.v7"

  const doDownload = (url, callback) => {
    const sock = new WebSocket(url, wsproto)

    sock.onopen = function () {
      postMessage({m: "download onopen"})
      const start = new Date().getTime()
      let previous = start
      let total = 0
      sock.onmessage = function (ev) {
        total += (ev.data instanceof Blob) ? ev.data.size : ev.data.length
        let now = new Date().getTime()
        const every = 250  // ms
        if (now - previous > every) {
          const speed = total * 8 / ((now - start) * 1000)
          postMessage({m: "download", v: speed})
          previous = now
        }
      }
    }

    sock.onclose = () => {
      postMessage({m: "download onclose"})
      callback()
    }
  }

  doDownload(ev.data.url, () => postMessage({m: null}))
}