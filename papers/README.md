# Papers

<style>
.icon {
    height: 0.8em;
}
</style>

## 2014

<div id="basso2014measuring">
    <p>
        <a href="#basso2014measuring">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <strong>Measuring DASH Streaming Performance from the End Users Perspective using Neubot</strong>
    </p>
    <p>Simone Basso, Antonio Servetti, Enrico Masala, Juan Carlos De Martin</p>
    <p>In Proc. of: 5th ACM Multimedia Systems Conference</p>
    <details>
        <summary>Abstract</summary>
        <p>The popularity of DASH streaming is rapidly increasing and a number of commercial streaming
        services are adopting this new standard. While the benefits of building streaming services on top
        of the HTTP protocol are clear, further work is still necessary to evaluate and enhance the
        system performance from the perspective of the end user. Here we present a novel framework to
        evaluate the performance of rate-adaptation algorithms for DASH streaming using network
        measurements collected from more than a thousand Internet clients. Data, which have been
        made publicly available, are collected by a DASH module built on top of Neubot, an open source
        tool for the collection of network measurements. Some examples about the possible usage of
        the collected data are given, ranging from simple analysis and performance comparisons
        of download speeds to the performance simulation of alternative adaptation strategies using,
        e.g., the instantaneous available bandwidth values.</p>
    </details>
</div>

## 2013

<div id="basso2013strengthening">
    <p>
        <a href="#basso2013strengthening">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <strong>Strengthening Measurements from the Edges: Application-Level Packet Loss Rate Estimation</strong>
    </p>
    <p>Simone Basso, Michela Meo, Juan Carlos De Martin</p>
    <p>In: ACM SIGCOMM Computer Communication Review</p>
    <details>
        <summary>Abstract</summary>
        <p>Network users know much less than ISPs, Internet exchanges and content providers about what
        happens inside the network. Consequently users cannot either easily detect network neutrality
        violations or readily exercise their market power by knowledgeably switching ISPs.</p>
        <p>This paper contributes to the ongoing efforts to empower users by proposing two models to
        estimate – via application-level measurements – a key network indicator, i.e., the packet loss
        rate (PLR) experienced by FTP-like TCP downloads.</p>
        <p>Controlled, testbed, and large-scale experiments show that the Inverse Mathis model is
        simpler and more consistent across the whole PLR range, but less accurate than the more advanced
        Likely Rexmit model for landline connections and moderate PLR.</p>
    </details>
</div>

## 2012

<div id="basso2012estimating">
    <p>
        <a href="#basso2012estimating">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <strong>Estimating Packet Loss Rate in the Access Through Application-Level Measurements</strong>
    </p>
    <p>Simone Basso, Michela Meo, Antonio Servetti, Juan Carlos De Martin</p>
    <p>In Proc. of: 2012 ACM SIGCOMM Workshop on Measurements Up and Down the Stack</p>
    <details>
        <summary>Abstract</summary>
        <p>End user monitoring of quality of experience is one of the necessary steps to achieve an
        effective and winning control over network neutrality. The involvement of the end user,
        however, requires the development of light and user-friendly tools that can be easily run
        at the application level with limited effort and network resources usage. In this paper,
        we propose a simple model to estimate packet loss rate perceived by a connection, by round
        trip time and TCP goodput samples collected at the application level. The model is
        derived from the well-known Mathis equation, which predicts the bandwidth of a steady-state
        TCP connection under random losses and delayed ACKs and it is evaluated in a testbed
        environment under a wide range of different conditions. Experiments are also run on real
        access networks. We plan to use the model to analyze the results collected by the "network
        neutrality bot" (Neubot), a research tool that performs application-level network-performance
        measurements. However, the methodology is easily portable and can be interesting for
        basically any user application that performs large downloads or uploads and requires to
        estimate access network quality and its variations.</p>
    </details>
</div>

## 2011

<div id="basso2011hitchhiker">
    <p>
        <a href="#basso2011hitchhiker">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <strong>The hitchhiker's guide to the Network Neutrality Bot test methodology</strong>
    </p>
    <p>Simone Basso, Antonio Servetti, Juan Carlos De Martin</p>
    <p>In Proc. of: Congresso Nazionale AICA 2011</p>
    <details>
        <summary>Abstract</summary>
        <p>The Neubot project is based on an open-source computer program, the Neubot, that, downloaded
        and installed by Internet users, performs quality of service measurements and collects data at
        a central server. The raw results are published on the web under the terms and conditions of
        the Creative Commons Zero license. This paper is the guide for researchers and individuals that
        aims to study, build on and analyze Neubot methodology and results. We provide an exhaustive
        documentation of Neubot’s HTTP test behavior, along with a discussion of the methodology. Besides
        that, the article shows an analysis of the Turin-area results (in the May-September time
        interval) and explains the rationale behind the privacy policy, which allows us to publish
        results as raw data.</p>
    </details>
</div>

<div id="basso2011network">
    <p>
        <a href="#basso2011network">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <strong>The network neutrality bot architecture: a preliminary approach for self-monitoring
        of Internet access QoS</strong>
    </p>
    <p>Simone Basso, Antonio Servetti, Juan Carlos De Martin</p>
    <p>In Proc. of: 2011 IEEE Symposium on Computers and Communications</p>
    <details>
        <summary>Abstract</summary>
        <p>The "network neutrality bot" (Neubot) is an evolving software architecture for distributed Internet
        access quality and network neutrality measurements. The core of this architecture is an open-source agent
        that ordinary users may install on their computers to gain a deeper understanding of their Internet
        connections. The agent periodically monitors the quality of service provided to the user, running
        background active transmission tests that emulate different application-level protocols. The results
        are then collected on a central server and made publicly available to allow constant monitoring of
        the state of the Internet by interested parties.</p>
        <p>In this article we describe how we enhanced Neubot architec- ture both to deploy a distributed
        broadband speed test and to allow the development of plug-in transmission tests. In addition, we start
        a preliminary discussion on the results we have collected in the first three months after the first
        public release of the software.</p>
    </details>
</div>

## 2010

<div id="basso2010rationale">
    <p>
        <a href="#basso2010rationale">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <strong>Rationale, Design, and Implementation of the Network Neutrality Bot</strong>
    </p>
    <p>Simone Basso, Antonio Servetti, Juan Carlos De Martin</p>
    <p>In Proc. of: Congresso Nazionale AICA 2010</p>
    <details>
        <summary>Abstract</summary>
        <p>The "Network Neutrality Bot" (Neubot) is a software application that measures, in a distributed way,
        Internet access quality of service with a specific emphasis on detection of potential network neutrality
        violations (such as peer-to-peer traffic discrimination). It is based on a light- weight, open-source
        computer program that can be downloaded and installed by ordinary Internet users. The program performs
        background tests: the results are sent to a centralized server (or collection of servers), which publishes
        them, thus rebalancing, at least in part, the current deep information asymmetry between Internet Service
        Providers and users. The collected data will allow constant monitoring of the state of the Internet,
        enabling a deeper understanding of such crucial infrastructure, as well as a more reliable basis for
        discussing network neutrality policies.</p>
    </details>
</div>
