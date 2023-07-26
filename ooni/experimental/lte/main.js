// (experimental) Utility functions to show a measurement's features.

"use strict"

//
// Cache
//
// We cache measurements in the sessionStorage. We fetch them
// from api.ooni.io using explorer URLs as the input.
//

// Gets a raw JSON from the localStorage cache or from the OONI API.
async function __cacheGetRawJSON(measurementID) {
    const value = sessionStorage.getItem(measurementID)
    if (value !== null) {
        console.log(`using previously cached measurement value: ${measurementID}`)
        return value
    }
    const url = new URL("https://api.ooni.io/api/v1/measurement_meta")
    url.searchParams.append("measurement_uid", measurementID)
    url.searchParams.append("full", true)
    const response = await fetch(url)
    const data = await response.text()
    console.log(`storing entry into the cache: ${measurementID}`)
    sessionStorage.setItem(measurementID, data)
    return data
}

// Returns a parsed measurement meta given the measurementID.
async function cacheGetMeasurementMeta(measurementID) {
    const data = await __cacheGetRawJSON(measurementID)
    return JSON.parse(data)
}

//
// DNS observations
//
// Contains code for analyzing DNS observations.
//

// Creates the table for DNS lookups
function __dnsObservationsNewTable() {
    let firstRow = new Array()
    firstRow.push("origin")
    firstRow.push("transaction_id")
    firstRow.push("engine")
    firstRow.push("query_domain")
    firstRow.push("query_type")
    firstRow.push("resolver_address")
    firstRow.push("failure")
    firstRow.push("answer_type")
    firstRow.push("answer_value")
    firstRow.push("answer_asn")
    firstRow.push("asn_org")
    let table = new Array()
    table.push(firstRow)
    return table
}

// Fills the table for DNS observations
function __dnsObservationsFillTable(table, tk, origin) {
    const queries = tk[origin] || []
    for (let i = 0; i < queries.length; i += 1) {
        const query = queries[i]
        const answers = query["answers"] || [{}]
        for (let j = 0; j < answers.length; j += 1) {
            const answer = answers[j]
            let row = Array()
            row.push(origin)
            row.push(query["transaction_id"] || 0)
            row.push(query["engine"])
            row.push(query["hostname"])
            row.push(query["query_type"])
            row.push(query["resolver_address"])
            row.push(query["failure"])
            const answer_type = answer["answer_type"] || null
            row.push(answer_type)
            switch (answer_type) {
                case "A":
                    row.push(answer["ipv4"] || undefined)
                    row.push(answer["asn"] || undefined)
                    row.push(answer["as_org_name"] || undefined)
                    break
                case "AAAA":
                    row.push(answer["ipv6"] || undefined)
                    row.push(answer["asn"] || undefined)
                    row.push(answer["as_org_name"] || undefined)
                    break
                case "CNAME":
                    row.push(answer["hostname"] || undefined)
                    row.push(undefined)
                    row.push(undefined)
                    break
                default:
                    row.push(undefined)
                    row.push(undefined)
                    row.push(undefined)
                    break
            }
            table.push(row)
        }
    }
}

// Reads the TH response and formats it into the given table
function __dnsObservationsReadTHResponse(table, parsedInputURL, tk) {
    const control = tk["control"] || {}
    const dns = control["dns"] || {}
    const failure = dns["failure"]
    const addrs = dns["addrs"] || []
    for (let i = 0; i < addrs.length; i += 1) {
        const addr = addrs[i]
        let row = Array()
        row.push("control")
        row.push(0)
        row.push("th")
        row.push(parsedInputURL.hostname)
        row.push("ANY")
        row.push("")
        row.push(failure)
        row.push("")
        row.push(addr)
        row.push("")
        row.push("")
        table.push(row)
    }
}

// Dumps all DNS lookups as observations
function dnsObservationsAnalyzeAndDump(parsedInputURL, tk, analysis) {
    let table = __dnsObservationsNewTable()
    __dnsObservationsFillTable(table, tk, "queries")
    __dnsObservationsFillTable(table, tk, "x_dns_late_replies")
    __dnsObservationsReadTHResponse(table, parsedInputURL, tk)
    analysisAppendTable(analysis, table, "DNS observations")
    const probeObservations = [
        ...(tk["queries"] || []),
        ...(tk["x_dns_late_replies"] || []),
    ]
    analysisSerializeToJSONAndAppend(analysis, probeObservations, "Raw probe observations")
    const thObservations = (tk["control"] || {})["dns"]
    analysisSerializeToJSONAndAppend(analysis, thObservations, "Raw TH observations")
}

//
// Discovered endpoints
//
// Builds the list of discovered endpoints
//

const discoveredVia = 1 << 0
const discoveredViaLateResponse = 1 << 1
const discoveredViaTH = 1 << 2

function discoverAddresses(tk) {
}

//
// Discovered addresses
//
// Contains the list of discovered addresses
//

// Fills the table for the discovered addresses
function __discoveredAddrsFillTable(mapping, tk, origin) {
    const queries = tk[origin] || []
    for (let i = 0; i < queries.length; i += 1) {
        const query = queries[i]
        const answers = query["answers"] || []
        for (let j = 0; j < answers.length; j += 1) {
            const answer = answers[j]
            const answer_type = answer["answer_type"]
            let addr = null
            switch (answer_type) {
                case "A":
                    addr = answer["ipv4"]
                    break
                case "AAAA":
                    addr = answer["ipv6"]
                    break
                default:
                // nothing
            }
            if (!addr) {
                continue
            }
            const entry = mapping.get(addr)
            if (!entry) {
                mapping.set(addr, [])
            }
            mapping.get(addr).push(origin)
        }
    }
}

// Reads the TH response and records which IP addrs it resolved
function __discoveredAddrsReadTHResponse(mapping, tk) {
    const control = tk["control"] || {}
    const dns = control["dns"] || {}
    const addrs = dns["addrs"] || []
    for (let i = 0; i < addrs.length; i += 1) {
        const addr = addrs[i]
        const entry = mapping.get(addr)
        if (!entry) {
            mapping.set(addr, [])
        }
        mapping.get(addr).push("control")
    }
}

function discoveredAddrsAnalyzeAndDump(tk, analysis) {
    let mapping = new Map()
    __discoveredAddrsFillTable(mapping, tk, "queries")
    __discoveredAddrsFillTable(mapping, tk, "x_dns_late_replies")
    __discoveredAddrsReadTHResponse(mapping, tk)
    const table = new Array()
    table.push(["address", "queries?", "x_dns_late_replies?", "control?"])
    for (const [key, values] of mapping) {
        const row = new Array()
        row.push(key)
        row.push(values.includes("queries") ? "yes" : "")
        row.push(values.includes("x_dns_late_replies") ? "yes" : "")
        row.push(values.includes("control") ? "yes" : "")
        table.push(row)
    }
    analysisAppendTable(analysis, table, "Discovered addrs")
}

//
// TCP observations
//
// Contains code for TCP analyzing observations
//

// Creates the table for TCP
function __tcpObservationsNewTable() {
    let firstRow = new Array()
    firstRow.push("origin")
    firstRow.push("transaction_id")
    firstRow.push("address")
    firstRow.push("failure")
    let table = new Array()
    table.push(firstRow)
    return table
}

// Fills the table for TCP observations
function __tcpObservationsFillTable(table, tk, origin) {
    const tcpconnect = tk[origin] || []
    for (let i = 0; i < tcpconnect.length; i += 1) {
        const entry = tcpconnect[i]
        let row = Array()
        row.push(origin)
        row.push(entry["transaction_id"] || 0)
        let ip = entry["ip"] || ""
        const port = entry["port"] || 0
        ip = (ip.includes(":")) ? `[${ip}]` : ip
        const endpoint = `${ip}:${port}`
        row.push(endpoint)
        row.push((entry["status"] || {})["failure"])
        table.push(row)
    }
}

// Dumps all TCP observations
function tcpObservationsAnalyzeAndDump(tk, analysis) {
    let table = __tcpObservationsNewTable()
    __tcpObservationsFillTable(table, tk, "tcp_connect")
    analysisAppendTable(analysis, table, "TCP observations")
    let observations = [
        ...(tk["tcp_connect"] || []),
    ]
    analysisSerializeToJSONAndAppend(analysis, observations, "Raw observations")
}

//
// TLS observations
//
// Code to analyze TLS observations
//

// Creates the table for TLS
function __tlsObservationsNewTable() {
    let firstRow = new Array()
    firstRow.push("origin")
    firstRow.push("transaction_id")
    firstRow.push("network")
    firstRow.push("address")
    firstRow.push("failure")
    firstRow.push("tls_version")
    firstRow.push("cipher_suite")
    firstRow.push("negotiated_protocol")
    let table = new Array()
    table.push(firstRow)
    return table
}

// Fills the table for TLS observations
function __tlsObservationsFillTable(table, tk, origin) {
    const handshakes = tk[origin] || []
    for (let i = 0; i < handshakes.length; i += 1) {
        const entry = handshakes[i]
        let row = new Array()
        row.push(origin)
        row.push(entry["transaction_id"])
        row.push(entry["network"])
        row.push(entry["address"])
        row.push(entry["failure"])
        row.push(entry["tls_version"])
        row.push(entry["cipher_suite"])
        row.push(entry["negotiated_protocol"])
        table.push(row)
    }
}

// Dumps all TLS observations
function tlsObservationsAnalyzeAndDump(tk, analysis) {
    let table = __tlsObservationsNewTable()
    __tlsObservationsFillTable(table, tk, "tls_handshakes")
    analysisAppendTable(analysis, table, "TLS observations")
    let observations = [
        ...(tk["tls_handshakes"] || []),
    ]
    analysisSerializeToJSONAndAppend(analysis, observations, "Raw observations")
}

//
// HTTP observations
//
// Code to generate and analyze HTTP observations
//

// Creates the table for HTTP
function __httpObservationsNewTable() {
    let firstRow = new Array()
    firstRow.push("origin")
    firstRow.push("transaction_id")
    firstRow.push("network")
    firstRow.push("address")
    firstRow.push("alpn")
    firstRow.push("failure")
    firstRow.push("request_url")
    firstRow.push("response_status")
    firstRow.push("response_body_length")
    let table = new Array()
    table.push(firstRow)
    return table
}

// Fills the table for HTTP observations
function __httpObservationsFillTable(table, tk, origin) {
    const requests = tk[origin] || []
    for (let i = 0; i < requests.length; i += 1) {
        const entry = requests[i]
        let row = new Array()
        row.push(origin)
        row.push(entry["transaction_id"])
        row.push(entry["network"])
        row.push(entry["address"])
        row.push(entry["alpn"])
        row.push(entry["failure"])
        const request = entry["request"] || {}
        row.push(request["url"])
        const response = entry["response"] || {}
        row.push(response["code"])
        row.push((response["body"] || "").length)
        table.push(row)
    }
}

// Dumps all HTTP observations
function httpObservationsAnalyzeAndDump(tk, analysis) {
    let table = __httpObservationsNewTable()
    __httpObservationsFillTable(table, tk, "requests")
    analysisAppendTable(analysis, table, "HTTP observations")
    let observations = [
        ...(tk["requests"] || []),
    ]
    analysisSerializeToJSONAndAppend(analysis, observations, "Raw observations")
}

//
// Core analysis
//
// Core implementation of the analysis algorithms.
//

// Convenience function to dump a JSON
function analysisSerializeToJSONAndAppend(analysis, something, summary) {
    let detailsSummary = document.createElement("summary")
    detailsSummary.textContent = summary
    let details = document.createElement("details")
    details.appendChild(detailsSummary)
    const pre = document.createElement("pre")
    pre.textContent = JSON.stringify(something, null, 2)
    details.appendChild(pre)
    analysis.appendChild(details)
}

// Convenience function for appending a table to the test keys
function analysisAppendTable(analysis, table, title) {
    const h2 = document.createElement("h2")
    h2.textContent = title
    analysis.appendChild(h2)
    const htmlTable = document.createElement("table")
    htmlTable.setAttribute("class", "styled-table")
    const thead = document.createElement("thead")
    for (let i = 0; i < table.length && i < 1; i += 1) {
        const tr = document.createElement("tr")
        for (let j = 0; j < table[i].length; j += 1) {
            const th = document.createElement("th")
            th.textContent = table[i][j]
            tr.appendChild(th)
        }
        thead.appendChild(tr)
    }
    htmlTable.appendChild(thead)
    const tbody = document.createElement("tbody")
    for (let i = 1; i < table.length; i += 1) {
        const tr = document.createElement("tr")
        for (let j = 0; j < table[i].length; j += 1) {
            const td = document.createElement("td")
            td.textContent = table[i][j]
            tr.appendChild(td)
        }
        tbody.appendChild(tr)
    }
    htmlTable.appendChild(tbody)
    analysis.appendChild(htmlTable)
}

// Convenience function for appending a "key: value" string to the analysis div
function analysisAppendKeyValue(analysis, key, value) {
    analysisAppendP(analysis, `${key}: ${value}`)
}

// Convenience function for appending a sanitized PRE to the analysis div.
function analysisAppendPRE(analysis, string) {
    const pre = document.createElement("pre")
    pre.textContent = string
    analysis.appendChild(pre)
}

// Convenience function for appending a sanitized P to the analysis div.
function analysisAppendP(analysis, string) {
    const p = document.createElement("p")
    p.textContent = string
    analysis.appendChild(p)
}

// Explains x_dns_flags.
function __explainDNSFlags(tk) {
    const mapping = {
        1: "resolved-bogon-addr",
        2: "unexpected-lookup-failure",
        4: "unexpected-resolved-addr",
    }
    const flags = tk["x_dns_flags"] || 0
    let explanation = "["
    if (flags !== 0) {
        for (const [key, value] of Object.entries(mapping)) {
            if ((flags & key) !== 0) {
                explanation += " "
                explanation += value
            }
        }
    }
    explanation += " ]"
    return explanation
}

// Explains x_blocking_flags.
function __explainBlockingFlags(tk) {
    const mapping = {
        1: "dns-blocking",
        2: "tcpip-blocking",
        4: "tls-blocking",
        8: "http-blocking",
        16: "http-diff",
        32: "success",
    }
    let explanation = "["
    const flags = tk["x_blocking_flags"] || 0
    if (flags !== 0) {
        for (const [key, value] of Object.entries(mapping)) {
            if ((flags & key) !== 0) {
                explanation += " "
                explanation += value
            }
        }
    }
    explanation += " ]"
    return explanation
}

// Processes the web connectivity test keys
function analysisProcessWebConnectivityTestKeys(measurement, tk, analysis) {

    const table = new Array()
    table.push(["origin", "variable", "value", "details"])
    table.push(["probe", "control_failure", tk["control_failure"], ""])
    table.push(["probe", "x_dns_flags", tk["x_dns_flags"], __explainDNSFlags(tk)])
    table.push(["probe", "dns_consistency", tk["dns_consistency"], ""])
    table.push(["probe", "body_length_match", tk["body_length_match"], ""])
    table.push(["probe", "headers_match", tk["headers_match"], ""])
    table.push(["probe", "status_code_match", tk["status_code_match"], ""])
    table.push(["probe", "title_match", tk["title_match"], ""])
    table.push(["probe", "x_blocking_flags", tk["x_blocking_flags"], __explainBlockingFlags(tk)])
    table.push(["probe", "accessible", tk["accessible"], ""])
    table.push(["probe", "blocking", tk["blocking"], ""])
    table.push(["probe", "measurement_runtime", measurement["test_runtime"], ""]) // historic misnomer
    analysisAppendTable(analysis, table, "Probe Verdict")

    const parsedInputURL = new URL(measurement["input"])

    dnsObservationsAnalyzeAndDump(parsedInputURL, tk, analysis)
    discoveredAddrsAnalyzeAndDump(tk, analysis)
    tcpObservationsAnalyzeAndDump(tk, analysis)
    tlsObservationsAnalyzeAndDump(tk, analysis)
    httpObservationsAnalyzeAndDump(tk, analysis)
}

// Processes a raw OONI measurement
function analysisProcessWebConnectivity(rawMeasurement, analysis) {
    const measurement = JSON.parse(rawMeasurement)
    if (measurement["data_format_version"] !== "0.2.0") {
        analysisAppendP(analysis, "FATAL: invalid data_format_version")
        return
    }
    if (measurement["test_name"] !== "web_connectivity") {
        analysisAppendP(analysis, "FATAL: not web_connectivity")
        return
    }
    analysisProcessWebConnectivityTestKeys(
        measurement,
        measurement["test_keys"] || {},
        analysis,
    )
}

// Pushes the pipeline scores to the table.
function analysisPushPipelineScores(table, mmeta) {
    const rawScores = mmeta["scores"] || "{}"
    const scores = JSON.parse(rawScores)
    for (const [key, value] of Object.entries(scores)) {
        if (key === "analysis") {
            for (const [k, v] of Object.entries(value)) {
                table.push(["pipeline", "scores.analysis." + k, v, ""])
            }
            continue
        }
        table.push(["pipeline", "scores." + key, value, ""])
    }
}

// Processes the measurement meta
function analysisProcessMeasurementMeta(mmeta, analysis) {
    
    const table = new Array()
    table.push(["origin", "variable", "value", "details"])
    table.push(["pipeline", "anomaly", mmeta["anomaly"], ""])
    table.push(["pipeline", "failure", mmeta["failure"], ""])
    table.push(["pipeline", "confirmed", mmeta["confirmed"], ""])
    analysisPushPipelineScores(table, mmeta)
    analysisAppendTable(analysis, table, "Pipeline verdict")
    
    switch (mmeta["test_name"]) {
        case "web_connectivity":
            analysisProcessWebConnectivity(
                mmeta["raw_measurement"] || "{}",
                analysis,
            )
            break
        default:
            analysisAppendP(analysis, "FATAL: not web_connectivity")
            break
    }
}

// Parses an OONI Explorer URL returning the measurementID.
function parseExplorerURL(explorerURL) {
    const url = new URL(explorerURL)
    if (url.protocol !== "https:") {
        throw "URL scheme must be https"
    }
    if (url.host !== "explorer.ooni.org") {
        throw "URL host must be explorer.ooni.org"
    }
    const prefix = "/m/"
    if (!url.pathname.startsWith(prefix)) {
        throw `URL path must start with ${prefix}`
    }
    return url.pathname.substring(prefix.length)
}

// Top-level analysis algorithm
async function analysisMain(explorerURL, analysis) {
    try {
        const measurementID = parseExplorerURL(explorerURL)
        const measurementMeta = await cacheGetMeasurementMeta(measurementID)
        analysisProcessMeasurementMeta(
            measurementMeta,
            analysis,
        )
    } catch (err) {
        console.log(err)
        return
    }
}

//
// Main entry point
//
// Register event handlers.
//

function mainMakeTableSortable() {
    const allTables = document.querySelectorAll("table")

    for (let table of allTables) {
        const tBody = table.tBodies[0]
        const rows = Array.from(tBody.rows)
        const headerCells = table.tHead.rows[0].cells

        for (let th of headerCells) {
            const cellIndex = th.cellIndex

            th.addEventListener("click", () => {
                rows.sort((tr1, tr2) => {
                    const tr1Text = tr1.cells[cellIndex].textContent
                    const tr2Text = tr2.cells[cellIndex].textContent
                    return tr1Text.localeCompare(tr2Text)
                })

                tBody.append(...rows)
            })
        }
    }
}

document.getElementById("analyzeURL").addEventListener("click", async function (_) {
    const explorerURL = document.getElementById("explorerURL").value
    const analysis = document.getElementById("analysis")
    analysis.innerHTML = ""
    await analysisMain(explorerURL, analysis)
    mainMakeTableSortable()
})
