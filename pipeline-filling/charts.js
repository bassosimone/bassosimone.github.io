// SPDX-License-Identifier: GPL-3.0-or-later

"use strict";

class ChartsView {
  #container;
  #statusEl;
  #chartArea;
  #perspectiveButtons;
  #allPackets = [];
  #traceUrl = "";
  #currentPerspective = "";
  #charts = [];

  static #PERSPECTIVES = [
    { label: "Server", addr: "104.18.26.120" },
    { label: "Client", addr: "130.192.91.211" },
  ];

  constructor(container) {
    this.#container = container;
    container.classList.add("charts-widget");

    const controls = document.createElement("div");
    controls.className = "charts-controls";
    container.appendChild(controls);

    const label = document.createElement("span");
    label.textContent = "Perspective:";
    label.style.fontSize = "14px";
    label.style.color = "#555";
    controls.appendChild(label);

    this.#perspectiveButtons = [];
    for (const p of ChartsView.#PERSPECTIVES) {
      const btn = document.createElement("button");
      btn.textContent = p.label;
      btn.dataset.addr = p.addr;
      btn.addEventListener("click", () => this.#onPerspective(btn));
      controls.appendChild(btn);
      this.#perspectiveButtons.push(btn);
    }

    const sep = document.createElement("span");
    sep.className = "charts-separator";
    controls.appendChild(sep);

    this.#statusEl = document.createElement("span");
    this.#statusEl.className = "charts-status";
    controls.appendChild(this.#statusEl);

    this.#chartArea = document.createElement("div");
    container.appendChild(this.#chartArea);

    this.#showEmpty("Load a trace and select a perspective.");
  }

  loadTrace(url) {
    this.#traceUrl = url;
    this.#fetchTrace();
  }

  async #fetchTrace() {
    if (!this.#traceUrl) {
      this.#allPackets = [];
      this.#statusEl.textContent = "no trace loaded";
      return;
    }

    const resp = await fetch(this.#traceUrl).catch(() => null);
    if (!resp || !resp.ok) {
      this.#allPackets = [];
      this.#statusEl.textContent = resp ? "Error: " + resp.statusText : "Failed to load trace";
      return;
    }

    const data = await resp.json();
    this.#allPackets = data.packets || [];
    this.#statusEl.textContent = this.#allPackets.length + " packets loaded";

    // Auto-select client perspective once visible.
    if (!this.#currentPerspective) {
      this.#selectWhenVisible(this.#perspectiveButtons[0]);
    }
  }

  #selectWhenVisible(btn) {
    if (this.#container.clientWidth > 0) {
      this.#onPerspective(btn);
      return;
    }
    const observer = new MutationObserver(() => {
      if (this.#container.clientWidth > 0) {
        observer.disconnect();
        this.#onPerspective(btn);
      }
    });
    observer.observe(this.#container.closest(".tab-content") || document.body, {
      attributes: true, attributeFilter: ["class"],
    });
  }

  #onPerspective(btn) {
    this.#currentPerspective = btn.dataset.addr;
    for (const b of this.#perspectiveButtons) {
      b.classList.toggle("active", b === btn);
    }
    this.#rebuildCharts();
  }

  #rebuildCharts() {
    for (const c of this.#charts) {
      c.destroy();
    }
    this.#charts = [];
    this.#chartArea.innerHTML = "";

    if (this.#allPackets.length === 0) {
      this.#showEmpty("No packets loaded.");
      return;
    }

    const addr = this.#currentPerspective;
    if (!addr) {
      this.#showEmpty("Select a perspective.");
      return;
    }

    const tcp = this.#allPackets.filter(p => p.protocol === "TCP");
    const samples = this.#computeRTTSamples(tcp, addr);

    if (samples.length === 0) {
      this.#showEmpty("No RTT samples could be computed for this perspective.");
      return;
    }

    const smoothed = this.#computeSmoothedRTT(samples);
    this.#statusEl.textContent = samples.length + " RTT samples";

    const t0 = smoothed[0].timeUs;
    const elapsedMs = smoothed.map(s => (s.timeUs - t0) / 1000);
    const srttMs = smoothed.map(s => s.srtt / 1000);
    const rttvarMs = smoothed.map(s => s.rttvar / 1000);
    const rawRttMs = smoothed.map(s => s.rtt / 1000);

    this.#buildRTTChart(elapsedMs, rawRttMs, srttMs, rttvarMs);

    const flight = this.#computeBytesInFlight(tcp, addr);
    if (flight.length > 0) {
      const ft0 = flight[0].timeUs;
      const fElapsed = flight.map(s => (s.timeUs - ft0) / 1000);
      const fBytes = flight.map(s => s.inFlight / 1024);
      const fAvg = this.#computeEWMA(fBytes, 1 / 8);
      this.#buildFlightChart(fElapsed, fBytes, fAvg);
    }
  }

  // Compute RTT samples from a given observer's perspective.
  //
  // From the observer (addr):
  // - "entered" packets where src=addr are packets we sent
  // - "delivered" packets where dst=addr are packets that arrived to us
  //
  // An RTT sample is: time we receive an ACK that advances the ack sequence
  // minus the time we sent the data segment being acknowledged.
  #computeRTTSamples(tcpPackets, addr) {
    const sent = [];
    for (const p of tcpPackets) {
      if (p.event !== "entered" || p.src !== addr) continue;
      const t = p.detail.tcp;
      const effectiveLen = t.payload_length > 0
        ? t.payload_length
        : (t.flag_syn || t.flag_fin ? 1 : 0);
      if (effectiveLen === 0) continue;
      sent.push({
        timeUs: this.#parseTimeMicros(p.time),
        seqEnd: t.seq + effectiveLen,
      });
    }

    // Sort by time (should already be, but be safe).
    sent.sort((a, b) => a.timeUs - b.timeUs);

    // Track the highest ACK number seen so far; only produce a sample
    // when a new ACK advances past data we sent.
    let highAck = 0;
    let sentIdx = 0;
    const samples = [];

    for (const p of tcpPackets) {
      if (p.event !== "delivered" || p.dst !== addr) continue;
      const t = p.detail.tcp;
      if (!t.flag_ack) continue;

      const ackNum = t.ack;
      if (ackNum <= highAck) continue;
      highAck = ackNum;

      const ackTimeUs = this.#parseTimeMicros(p.time);

      // Find the latest sent segment whose seqEnd <= ackNum.
      // This is the segment that triggered this ACK.
      // Advance sentIdx past segments already fully acknowledged.
      while (sentIdx < sent.length && sent[sentIdx].seqEnd <= highAck) {
        sentIdx++;
      }

      // The segment just before sentIdx is the one being acknowledged.
      if (sentIdx > 0) {
        const seg = sent[sentIdx - 1];
        const rttUs = ackTimeUs - seg.timeUs;
        if (rttUs > 0) {
          samples.push({ timeUs: ackTimeUs, rttUs: rttUs });
        }
      }
    }

    return samples;
  }

  // RFC 6298 smoothed RTT / RTTVar computation.
  #computeSmoothedRTT(samples) {
    if (samples.length === 0) return [];

    const ALPHA = 1 / 8;
    const BETA = 1 / 4;
    const G = 1000; // clock granularity: 1ms in microseconds

    const first = samples[0];
    let srtt = first.rttUs;
    let rttvar = first.rttUs / 2;

    const result = [{
      timeUs: first.timeUs,
      rtt: first.rttUs,
      srtt: srtt,
      rttvar: rttvar,
    }];

    for (let i = 1; i < samples.length; i++) {
      const r = samples[i].rttUs;
      rttvar = (1 - BETA) * rttvar + BETA * Math.abs(srtt - r);
      srtt = (1 - ALPHA) * srtt + ALPHA * r;
      result.push({
        timeUs: samples[i].timeUs,
        rtt: r,
        srtt: srtt,
        rttvar: rttvar,
      });
    }

    return result;
  }

  #buildRTTChart(timestamps, rawRtt, srtt, rttvar) {
    const section = document.createElement("div");
    section.className = "charts-section";

    const heading = document.createElement("h3");
    heading.textContent = "Round-Trip Time";
    section.appendChild(heading);

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "About this chart";
    details.appendChild(summary);

    const p1 = document.createElement("p");
    p1.innerHTML =
      "<strong>RTT (raw)</strong> — each sample is measured by matching " +
      "a data segment we sent to the ACK that acknowledges it. " +
      "RTT = time(ACK arrived) − time(data sent).";
    details.appendChild(p1);

    const p2 = document.createElement("p");
    p2.innerHTML =
      "<strong>Smoothed RTT</strong> — exponentially weighted moving average " +
      "of the raw RTT samples, computed per RFC 6298: " +
      "SRTT = (1 − α) × SRTT + α × R, where α = 1/8.";
    details.appendChild(p2);

    const p3 = document.createElement("p");
    p3.innerHTML =
      "<strong>RTTVar</strong> — the RTT variance estimate, also per RFC 6298: " +
      "RTTVAR = (1 − β) × RTTVAR + β × |SRTT − R|, where β = 1/4.";
    details.appendChild(p3);

    const p4 = document.createElement("p");
    p4.innerHTML =
      "Together, Smoothed RTT and RTTVar drive the retransmission timeout: " +
      "RTO = SRTT + max(G, 4 × RTTVAR).";
    details.appendChild(p4);

    section.appendChild(details);

    const chartDiv = document.createElement("div");
    section.appendChild(chartDiv);
    this.#chartArea.appendChild(section);

    const width = this.#container.clientWidth - 40;

    const opts = {
      width: width > 400 ? width : 400,
      height: 300,
      title: "RTT",
      cursor: { sync: { key: "pipeline-charts" } },
      scales: {
        x: { time: false },
      },
      axes: [
        { label: "elapsed (ms)" },
        { label: "delay (ms)" },
      ],
      series: [
        {},
        {
          label: "RTT (raw)",
          stroke: "#ca8a04",
          width: 1,
          dash: [2, 2],
          points: { show: true, size: 3 },
        },
        {
          label: "Smoothed RTT",
          stroke: "#e63946",
          width: 2,
          points: { show: true, size: 3 },
        },
        {
          label: "RTTVar",
          stroke: "#0891b2",
          width: 2,
          dash: [4, 4],
          points: { show: true, size: 3 },
        },
      ],
    };

    const chart = new uPlot(opts, [timestamps, rawRtt, srtt, rttvar], chartDiv);
    this.#charts.push(chart);
  }

  // Bytes in flight from the observer's perspective: the amount of
  // unacknowledged data at each point in time.
  #computeBytesInFlight(tcpPackets, addr) {
    // highSeq tracks the highest byte offset sent (relative to ISN).
    // highAck tracks the highest byte offset acknowledged.
    let highSeq = 0;
    let highAck = 0;
    let isn = 0;
    let initialized = false;
    const result = [];

    for (const p of tcpPackets) {
      const t = p.detail.tcp;

      if (p.event === "entered" && p.src === addr) {
        const effectiveLen = t.payload_length > 0
          ? t.payload_length
          : (t.flag_syn || t.flag_fin ? 1 : 0);
        if (effectiveLen === 0) continue;

        if (!initialized) {
          isn = t.seq;
          initialized = true;
        }
        const seqEnd = t.seq + effectiveLen - isn;
        if (seqEnd > highSeq) {
          highSeq = seqEnd;
          result.push({
            timeUs: this.#parseTimeMicros(p.time),
            inFlight: Math.max(0, highSeq - highAck),
          });
        }
        continue;
      }

      if (p.event === "delivered" && p.dst === addr && t.flag_ack) {
        if (!initialized) continue;
        const acked = t.ack - isn;
        if (acked > highAck) {
          highAck = acked;
          result.push({
            timeUs: this.#parseTimeMicros(p.time),
            inFlight: Math.max(0, highSeq - highAck),
          });
        }
      }
    }

    return result;
  }

  #buildFlightChart(timestamps, inFlight, avgFlight) {
    const section = document.createElement("div");
    section.className = "charts-section";

    const heading = document.createElement("h3");
    heading.textContent = "Bytes in Flight";
    section.appendChild(heading);

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "About this chart";
    details.appendChild(summary);

    const p1 = document.createElement("p");
    p1.innerHTML =
      "<strong>In Flight (raw)</strong> — the amount of data sent but not " +
      "yet acknowledged, computed as the difference between the highest " +
      "sequence number sent and the highest ACK received.";
    details.appendChild(p1);

    const p2 = document.createElement("p");
    p2.innerHTML =
      "<strong>Avg in Flight</strong> — exponentially weighted moving " +
      "average (EWMA, α = 1/8) of the raw in-flight values, smoothing " +
      "out per-packet fluctuations to show the overall trend.";
    details.appendChild(p2);

    const p3 = document.createElement("p");
    p3.innerHTML =
      "This is the metric that shows the pipe filling: during slow start " +
      "it ramps up exponentially, then stabilizes once the congestion " +
      "window or the network capacity is reached.";
    details.appendChild(p3);

    section.appendChild(details);

    const chartDiv = document.createElement("div");
    section.appendChild(chartDiv);
    this.#chartArea.appendChild(section);

    const width = this.#container.clientWidth - 40;

    const opts = {
      width: width > 400 ? width : 400,
      height: 300,
      title: "Bytes in Flight",
      cursor: { sync: { key: "pipeline-charts" } },
      scales: {
        x: { time: false },
      },
      axes: [
        { label: "elapsed (ms)" },
        { label: "KB" },
      ],
      series: [
        {},
        {
          label: "In Flight (raw)",
          stroke: "#f97316",
          width: 1,
          dash: [2, 2],
          points: { show: true, size: 3 },
        },
        {
          label: "Avg in Flight",
          stroke: "#7c3aed",
          width: 2,
          fill: "rgba(124, 58, 237, 0.08)",
          points: { show: true, size: 3 },
        },
      ],
    };

    const chart = new uPlot(opts, [timestamps, inFlight, avgFlight], chartDiv);
    this.#charts.push(chart);
  }

  #computeEWMA(values, alpha) {
    if (values.length === 0) return [];
    const result = [values[0]];
    for (let i = 1; i < values.length; i++) {
      result.push((1 - alpha) * result[i - 1] + alpha * values[i]);
    }
    return result;
  }

  #showEmpty(msg) {
    this.#chartArea.innerHTML = "";
    const div = document.createElement("div");
    div.className = "charts-empty";
    div.textContent = msg;
    this.#chartArea.appendChild(div);
  }

  #parseTimeMicros(timeStr) {
    const [hms, us] = timeStr.split(".");
    const [h, m, s] = hms.split(":").map(Number);
    return ((h * 3600 + m * 60 + s) * 1000000) + Number(us);
  }
}
