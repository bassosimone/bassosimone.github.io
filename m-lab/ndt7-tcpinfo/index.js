"use strict";

// --- Data extraction ---

// Extract time series from ndt7 ServerMeasurements.
// Returns { timestamps: [unix seconds], tcpinfo: [TCPInfo], bbrinfo: [BBRInfo|null] }
// Absolute time = Download.StartTime + TCPInfo.ElapsedTime
function extractNdt7(data) {
  const startTime = new Date(data.raw.Download.StartTime).getTime() / 1000;
  const measurements = data.raw.Download.ServerMeasurements;
  const timestamps = [];
  const tcpinfo = [];
  const bbrinfo = [];
  for (const m of measurements) {
    timestamps.push(startTime + m.TCPInfo.ElapsedTime / 1e6);
    tcpinfo.push(m.TCPInfo);
    bbrinfo.push(m.BBRInfo);
  }
  return { timestamps, tcpinfo, bbrinfo };
}

// Extract time series from tcp-info sidecar Snapshots.
// Timestamps are already absolute.
function extractSidecar(sidecarData) {
  const snapshots = sidecarData.raw.Snapshots;
  const timestamps = [];
  const tcpinfo = [];
  const bbrinfo = [];
  for (const snap of snapshots) {
    timestamps.push(new Date(snap.Timestamp).getTime() / 1000);
    tcpinfo.push(snap.TCPInfo);
    bbrinfo.push(snap.BBRInfo);
  }
  return { timestamps, tcpinfo, bbrinfo };
}

// --- Chart helpers ---

// Palette: visually orthogonal colors assigned by series position.
// color[0] = series 1, color[1] = series 2, etc.
const color = ["#e63946", "#0891b2", "#ca8a04", "#16a34a"];

// Shared cursor sync key so all charts link on hover.
const cursorSync = { key: "ndt7viz" };

// Common options shared by all panels.
function commonOpts(title, width) {
  return {
    width: width,
    height: 300,
    title: title,
    cursor: { sync: cursorSync },
    axes: [
      {}, // X axis: uPlot auto-formats time when series[0] is unix timestamps
    ],
  };
}

// Register chart data for the "Download JSON" feature.
function addDownloadButton(container, title, seriesLabels, chartData) {
  const key = title.toLowerCase().replace(/\s+/g, "_");
  registerChartData(key, seriesLabels, chartData);
}

function buildSpeedChart(container, series) {
  const { timestamps, tcpinfo, bbrinfo } = series;

  // Cumulative average throughput: BytesAcked[i] / (t[i] - t[0]) in Mbps
  const t0 = timestamps[0];
  const avgThroughput = timestamps.map((t, i) => {
    const dt = t - t0;
    return dt > 0 ? (tcpinfo[i].BytesAcked * 8) / (dt * 1e6) : null;
  });

  // BBR bandwidth estimate in Mbps
  const bbrBW = bbrinfo.map(b => b ? (b.BW * 8) / 1e6 : null);

  // Delivery rate in Mbps
  const deliveryRate = tcpinfo.map(t => (t.DeliveryRate * 8) / 1e6);

  // Pacing rate in Mbps
  const pacingRate = tcpinfo.map(t => (t.PacingRate * 8) / 1e6);

  const opts = {
    ...commonOpts("Speed", container.clientWidth || 800),
    axes: [
      {},
      { label: "Mbps" },
    ],
    series: [
      {},
      { label: "Avg Throughput (BytesAcked)", stroke: color[0], width: 2 },
      { label: "BBR BW", stroke: color[1], width: 2 },
      { label: "Delivery Rate", stroke: color[2], width: 2, dash: [4, 4] },
      { label: "Pacing Rate", stroke: color[3], width: 2, dash: [8, 4] },
    ],
  };

  const chartData = [timestamps, avgThroughput, bbrBW, deliveryRate, pacingRate];
  const labels = ["timestamp", "Avg Throughput (BytesAcked) [Mbps]", "BBR BW [Mbps]", "Delivery Rate [Mbps]", "Pacing Rate [Mbps]"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "Speed", labels, chartData);
  return chart;
}

function buildRTTChart(container, series) {
  const { timestamps, tcpinfo, bbrinfo } = series;

  // All RTT values are in microseconds, convert to milliseconds
  const rtt = tcpinfo.map(t => t.RTT / 1000);
  const minRTT = tcpinfo.map(t => t.MinRTT / 1000);
  const rttVar = tcpinfo.map(t => t.RTTVar / 1000);
  const bbrMinRTT = bbrinfo.map(b => b ? b.MinRTT / 1000 : null);

  const opts = {
    ...commonOpts("RTT", container.clientWidth || 800),
    axes: [
      {},
      { label: "ms" },
    ],
    series: [
      {},
      { label: "RTT (smoothed)", stroke: color[0], width: 2 },
      { label: "MinRTT", stroke: color[1], width: 2 },
      { label: "RTTVar", stroke: color[2], width: 2, dash: [4, 4] },
      { label: "BBR MinRTT", stroke: color[3], width: 2, dash: [8, 4] },
    ],
  };

  const chartData = [timestamps, rtt, minRTT, rttVar, bbrMinRTT];
  const labels = ["timestamp", "RTT (smoothed) [ms]", "MinRTT [ms]", "RTTVar [ms]", "BBR MinRTT [ms]"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "RTT", labels, chartData);
  return chart;
}

function buildCAStateChart(container, series) {
  const { timestamps, tcpinfo } = series;

  const caState = tcpinfo.map(t => t.CAState);

  const opts = {
    ...commonOpts("Congestion Avoidance State", container.clientWidth || 800),
    axes: [
      {},
      { label: "state" },
    ],
    series: [
      {},
      { label: "CAState", stroke: color[0], width: 2 },
    ],
  };

  const chartData = [timestamps, caState];
  const labels = ["timestamp", "CAState"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "CA State", labels, chartData);
  return chart;
}

function buildBBRPhaseChart(container, series) {
  const { timestamps, bbrinfo } = series;

  // CwndGain and PacingGain are shifted left 8 bits; divide by 256 for multiplier
  const cwndGain = bbrinfo.map(b => b ? b.CwndGain / 256 : null);
  const pacingGain = bbrinfo.map(b => b ? b.PacingGain / 256 : null);

  const opts = {
    ...commonOpts("BBR Phase", container.clientWidth || 800),
    axes: [
      {},
      { label: "gain" },
    ],
    series: [
      {},
      { label: "CwndGain", stroke: color[0], width: 2 },
      { label: "PacingGain", stroke: color[1], width: 2 },
    ],
  };

  const chartData = [timestamps, cwndGain, pacingGain];
  const labels = ["timestamp", "CwndGain", "PacingGain"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "BBR Phase", labels, chartData);
  return chart;
}

function buildNotsentChart(container, series) {
  const { timestamps, tcpinfo } = series;

  const notsentBytes = tcpinfo.map(t => t.NotsentBytes / 1024);

  const opts = {
    ...commonOpts("Send Buffer", container.clientWidth || 800),
    axes: [
      {},
      { label: "KB" },
    ],
    series: [
      {},
      { label: "NotsentBytes", stroke: color[0], width: 2 },
    ],
  };

  const chartData = [timestamps, notsentBytes];
  const labels = ["timestamp", "NotsentBytes [KB]"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "Send Buffer", labels, chartData);
  return chart;
}

function buildStallsChart(container, series) {
  const { timestamps, tcpinfo } = series;

  // Cumulative stall times in milliseconds
  const busyTime = tcpinfo.map(t => t.BusyTime / 1000);
  const rwndLimited = tcpinfo.map(t => t.RWndLimited / 1000);
  const sndBufLimited = tcpinfo.map(t => t.SndBufLimited / 1000);

  const opts = {
    ...commonOpts("Stall Diagnostics", container.clientWidth || 800),
    axes: [
      {},
      { label: "ms (cumulative)" },
    ],
    series: [
      {},
      { label: "BusyTime", stroke: color[0], width: 2 },
      { label: "RWndLimited", stroke: color[1], width: 2 },
      { label: "SndBufLimited", stroke: color[2], width: 2, dash: [4, 4] },
    ],
  };

  const chartData = [timestamps, busyTime, rwndLimited, sndBufLimited];
  const labels = ["timestamp", "BusyTime [ms]", "RWndLimited [ms]", "SndBufLimited [ms]"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "Stalls", labels, chartData);
  return chart;
}

function buildBytesChart(container, series) {
  const { timestamps, tcpinfo } = series;

  // Cumulative bytes acknowledged in MB
  const bytesAcked = tcpinfo.map(t => t.BytesAcked / (1024 * 1024));

  const opts = {
    ...commonOpts("Cumulative BytesAcked", container.clientWidth || 800),
    axes: [
      {},
      { label: "MB" },
    ],
    series: [
      {},
      { label: "BytesAcked", stroke: color[0], width: 2 },
    ],
  };

  const chartData = [timestamps, bytesAcked];
  const labels = ["timestamp", "BytesAcked [MB]"];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "Bytes", labels, chartData);
  return chart;
}

function buildFlightSizeChart(container, series) {
  const { timestamps, tcpinfo } = series;

  // Kernel's tcp_packets_in_flight: (Unacked - Sacked - Lost + Retrans) * MSS in KB
  const kernelInflight = tcpinfo.map(t =>
    (t.Unacked - t.Sacked - t.Lost + t.Retrans) * t.SndMSS / 1024
  );

  // Congestion window in KB
  const cwndBytes = tcpinfo.map(t => (t.SndCwnd * t.SndMSS) / 1024);

  // Peer receive window in KB
  const sndWnd = tcpinfo.map(t => t.SndWnd / 1024);

  const opts = {
    ...commonOpts("Flight Size", container.clientWidth || 800),
    axes: [
      {},
      { label: "KB" },
    ],
    series: [
      {},
      { label: "Kernel inflight", stroke: color[0], width: 2 },
      { label: "SndCwnd * MSS", stroke: color[1], width: 2 },
      { label: "RWND", stroke: color[2], width: 2, dash: [8, 4] },
    ],
  };

  const chartData = [timestamps, kernelInflight, cwndBytes, sndWnd];
  const labels = [
    "timestamp",
    "Kernel inflight [KB]",
    "SndCwnd * MSS [KB]",
    "RWND [KB]",
  ];
  const chart = new uPlot(opts, chartData, container);
  addDownloadButton(container, "Flight Size", labels, chartData);
  return chart;
}

// --- Download all ---

// Registry of chart data populated by each builder.
let allChartData = {};
let currentNdt7Data = null;

function registerChartData(key, labels, data) {
  allChartData[key] = {
    series: labels.map((label, i) => ({
      label: label,
      values: data[i],
    })),
  };
}

function downloadAllData() {
  const uuid = document.getElementById("measurement-select").value;
  const source = document.getElementById("source-select").value;
  const client = currentNdt7Data.client;
  const server = currentNdt7Data.server;

  const obj = {
    metadata: {
      uuid: uuid,
      date: currentNdt7Data.date,
      source: source,
      client: {
        asn: client.Network.ASNumber,
        asName: client.Network.ASName,
      },
      server: {
        site: server.Site,
        machine: server.Machine,
        city: server.Geo.City,
        countryCode: server.Geo.CountryCode,
      },
    },
    charts: allChartData,
  };

  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ndt7-viz-${uuid}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Info panel ---

function updateInfo(ndt7Data) {
  const client = ndt7Data.client;
  const server = ndt7Data.server;
  const el = document.getElementById("info");
  el.innerHTML =
    `<strong>Client:</strong> AS${client.Network.ASNumber} (${client.Network.ASName})` +
    ` &mdash; <strong>Server:</strong> ${server.Site}-${server.Machine}, ` +
    `${server.Geo.City}, ${server.Geo.CountryCode}` +
    ` &mdash; <strong>Date:</strong> ${ndt7Data.date}`;
}

// --- Main ---

let currentCharts = [];

async function loadAndRender() {
  const uuid = document.getElementById("measurement-select").value;
  const source = document.getElementById("source-select").value;

  // Always load the ndt7 data (needed for StartTime and info)
  const ndt7Resp = await fetch(`data/${uuid}.json`);
  const ndt7Data = await ndt7Resp.json();

  currentNdt7Data = ndt7Data;
  allChartData = {};
  updateInfo(ndt7Data);

  let series;
  if (source === "ndt7") {
    series = extractNdt7(ndt7Data);
  } else {
    const sidecarResp = await fetch(`data/${uuid}.tcpinfo.json`);
    const sidecarData = await sidecarResp.json();
    series = extractSidecar(sidecarData);
  }

  // Destroy existing charts
  for (const chart of currentCharts) {
    chart.destroy();
  }
  currentCharts = [];

  // Clear containers
  const rttEl = document.getElementById("chart-rtt");
  const bbrEl = document.getElementById("chart-bbr");
  const castateEl = document.getElementById("chart-castate");
  const flightEl = document.getElementById("chart-flight");
  const notsentEl = document.getElementById("chart-notsent");
  const bytesEl = document.getElementById("chart-bytes");
  const speedEl = document.getElementById("chart-speed");
  rttEl.innerHTML = "";
  bbrEl.innerHTML = "";
  castateEl.innerHTML = "";
  flightEl.innerHTML = "";
  notsentEl.innerHTML = "";
  const stallsEl = document.getElementById("chart-stalls");
  stallsEl.innerHTML = "";
  bytesEl.innerHTML = "";
  speedEl.innerHTML = "";

  // Build charts
  currentCharts.push(buildRTTChart(rttEl, series));
  currentCharts.push(buildBBRPhaseChart(bbrEl, series));
  currentCharts.push(buildCAStateChart(castateEl, series));
  currentCharts.push(buildFlightSizeChart(flightEl, series));
  currentCharts.push(buildNotsentChart(notsentEl, series));
  currentCharts.push(buildStallsChart(stallsEl, series));
  currentCharts.push(buildBytesChart(bytesEl, series));
  currentCharts.push(buildSpeedChart(speedEl, series));
}

document.getElementById("measurement-select").addEventListener("change", loadAndRender);
document.getElementById("source-select").addEventListener("change", loadAndRender);

// Initial load
loadAndRender();
