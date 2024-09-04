# Papers

<!--
SPDX-License-Identifier: GPL-2.0-only
Adapted from: https://github.com/NullHypothesis/censorbib
-->

<style>
.icon {
    height: 0.8em;
}
</style>

This is the list of papers I published, last updated on 2024-09-04.

## 2021

<div id="basso2021measuring">
    <p>
        <a href="#basso2021measuring">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="basso2021measuring.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Measuring DoT/DoH Blocking Using OONI Probe: a Preliminary Study</strong>
    </p>
    <p>Simone Basso</p>
    <p>In Proc. of: NDSS DNS Privacy Workshop</p>
    <details>
        <summary>Abstract</summary>
        <p>We designed DNSCheck, an active network experiment to detect the blocking
        of DoT/DoH services. We implemented DNSCheck into OONI Probe, the network-interference
        measurement tool we develop since 2012. We compiled a list of popular DoT/DoH
        services and ran DNSCheck measurements with help from volunteer OONI Probe
        users. We present preliminary results from measurements in Kazakhstan (AS48716),
        Iran (AS197207), and China (AS45090). We tested 123 DoT/DoH services,
        corresponding to 461 TCP/QUIC endpoints. We found endpoints to fail
        or succeed consistently. In AS197207 (Iran), 50% of the DoT endpoints
        seem blocked. Otherwise, we found that more than 80% of the tested
        endpoints were always reachable. The most frequently blocked services are
        Cloudflare’s and Google’s. In most cases, attempting to reach blocked
        endpoints failed with a timeout. We observed timeouts connecting, during,
        and after the TLS handshake. TLS blocking depends on either the SNI
        or the destination endpoint.</p>
    </details>
</div>

<div id="kelmenhorst2021web">
    <p>
        <a href="#kelmenhorst2021web">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="kelmenhorst2021web.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Web censorship measurements of HTTP/3 over QUIC</strong>
    </p>
    <p>Kathrin Elmenhorst, Bertram Schütz, Nils Aschenbruck, Simone Basso</p>
    <p>In Proc. of: 21st ACM Internet Measurement Conference</p>
    <details>
        <summary>Abstract</summary>
        <p>Web traffic censorship limits the free access to information, making
        it a global human rights issue. The introduction of HTTP/3 (HTTP over QUIC)
        yields promising expectations to counteract such interference, due to its
        novelty, build-in encryption, and faster connection establishment. To evaluate
        this hypothesis and analyze the current state of HTTP/3 blocking, we extended
        the open-source censorship measurement-tool OONI with an HTTP/3 module. Using an
        input list of possibly-blocked websites, real-world measurements with HTTPS
        and HTTP/3 were conducted in selected Autonomous Systems in China, Iran, India,
        and Kazakhstan. The presented evaluation assesses the different blocking
        methodologies employed for TCP/TLS versus the ones employed for QUIC. The
        results reveal dedicated UDP blocking in Iran and major IP blocklisting
        affecting QUIC in China and India.</p>
    </details>
</div>

<div id="xue2021throttling">
    <p>
        <a href="#xue2021throttling">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="xue2021throttling.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Throttling Twitter: an emerging censorship technique in Russia</strong>
    </p>
    <p>Diwen Xue, Reethika Ramesh, Leonid Evdokimov, Andrey Viktorov, Arham Jain, Eric Wustrow, Simone Basso, Roya Ensafi</p>
    <p>In Proc. of: 21st ACM Internet Measurement Conference</p>
    <details>
        <summary>Abstract</summary>
        <p>In March 2021, the Russian government started to throttle Twitter
        on a national level, marking the first ever use of large-scale, targeted
        throttling for censorship purposes. The slowdown was intended
        to pressure Twitter to comply with content removal requests from
        the Russian government.</p>
        <p>In this paper, we take a first look at this emerging censorship
        technique. We work with local activists in Russia to detect and
        measure the throttling and reverse engineer the throttler from in-country
        vantage points. We find that the throttling is triggered
        by Twitter domains in the TLS SNI extension, and the throttling
        limits both upstream and downstream traffic to a value between
        130 kbps and 150 kbps by dropping packets that exceed this rate.
        We also find that the throttling devices appear to be located close
        to end-users, and that the throttling behaviors are consistent across
        different ISPs suggesting that they are centrally coordinated. No-
        tably, this deployment marks a departure from Russia’s previously
        decentralized model to a more centralized one that gives significant
        power to the authority to impose desired restrictions unilaterally.
        Russia’s throttling of Twitter serves as a wake-up call to censorship
        researchers, and we hope to encourage future work in detecting
        and circumventing this emerging censorship technique.</p>
    </details>
</div>

## 2014

<div id="basso2014measuring">
    <p>
        <a href="#basso2014measuring">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="basso2014measuring.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
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

<div id="basso2014neubot">
    <p>
        <a href="#basso2014neubot">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="basso2014neubot.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Neubot: A Software Tool Performing Distributed Network Measurements to Increase Network Transparency</strong>
    </p>
    <p>Simone Basso</p>
    <p>PhD Thesis, Politecnico di Torino</p>
    <details>
        <summary>Abstract</summary>
        <p>We present Neubot (the network neutrality bot), a network-measurement platform designed to
        run network-performance experiments from the network edges. The data produced by Neubot is useful
        to increase network transparency and to study network neutrality. We describe the Neubot architecture
        (based on plugins that emulate several protocols and are able to run client-server and peer-to-peer
        tests), which is one of the main contributions of this thesis. We describe the current Neubot
        implementation (Neubot 0.4.16.9), we provide up-to-date data concerning Neubot deployment, and we
        show how we used Neubot to run four diverse large-scale measurements campaigns involving more
        than 1,000 Neubot instances each. Such measurements campaign, which were only possible because the
        Neubot architecture was already flexible enough to allow us to deploy new network experiments on
        the already installed Neubot instances, were concerned with, respectively: the measurement of broadband speed using the HTTP protocol; the study of the link between application-level measurements and the packet-loss
        rate experienced by TCP (which is the other main contribution of this thesis); the study of
        rate adaptation algorithms for the dynamic adaptive streaming over HTTP streaming technology
        (DASH); emulating the BitTorrent protocol. We conclude the thesis with the description of
        Neuviz (the Neubot visualizer), a prototype data-visualization architecture that loads Neubot
        data and allows to navigate the data looking for potential deviations from network
        neutrality. Despite being still in beta stage, Neuviz already allowed to spot
        three anomalies in the median speeds measured by the Neubot ‘HTTP Speedtest’ and BitTorrent tests.</p>
    </details>
</div>

<div id="futia2014neuviz">
    <p>
        <a href="#futia2014neuviz">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="futia2014neuviz.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>The NeuViz Data Visualization Tool for Visualizing Internet-Measurements Data</strong>
    </p>
    <p>Giuseppe Futia, Enrico Zimuel, Simone Basso, Juan Carlos De Martin</p>
    <p>In: Mondo Digitale, 2014</p>
    <details>
        <summary>Abstract</summary>
        <p>In this paper we present NeuViz, a data processing and visualization architecture for
        network measurement experiments. NeuViz has been tailored to work on the data produced by
        Neubot (Net Neutrality Bot), an Internet bot that performs periodic, active network
        performance tests. We show that NeuViz is an effective tool to navigate Neubot data to
        identify cases (to be investigated with more specific network tests) in which a protocol
        seems discriminated. Also, we suggest how the information provided by the NeuViz Web
        API can help to automatically detect cases in which a protocol seems discriminated, to
        raise warnings or trigger more specific tests.</p>
    </details>
</div>

<div id="masala2014challenges">
    <p>
        <a href="#masala2014challenges">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="masala2014challenges.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Challenges and Issues on Collecting and Analyzing Large Volumes of Network Data Measurements</strong>
    </p>
    <p>Enrico Masala, Antonio Servetti, Simone Basso, Juan Carlos De Martin</p>
    <p>In Proc. of: New Trends in Databases and Information Systems: 17th East European Conference on Advances in Databases and Information Systems</p>
    <details>
        <summary>Abstract</summary>
        <p>This paper presents the main challenges and issues faced when collecting and
        analyzing a large volume of network data measure- ments. We refer in particular to
        data collected by means of Neubot, an open source project that uses active probes
        on the client side to measure the evolution of key network parameters over time to
        better understand the performance of end-users’ Internet connections. The
        measured data are already freely accessible and stored on Measurement
        Lab (M-Lab), an organization that provides dedicated resources to perform
        network measurements and diagnostics in the Internet. Given the ever increasing
        amount of data collected by the Neubot project as well as other similar
        projects hosted by M-Lab, it is necessary to improve the platform to
        efficiently handle the huge amount of data that is expected to come in
        the very near future, so that it can be used by researchers and end-users
        themselves to gain a better understanding of network behavior.</p>
    </details>
</div>

<div id="oppici2014universities">
    <p>
        <a href="#oppici2014universities">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="oppici2014universities.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>How Do Universities Use Social Media? An Empirical Survey of Italian Academic Institutions</strong>
    </p>
    <p>Fiorenza Oppici, Simone Basso, Juan Carlos De Martin</p>
    <p>In Proc. of: Conference for E-Democracy and Open Governement</p>
    <details>
        <summary>Abstract</summary>
        <p>This work describes how Italian universities use social media, with a focus on
        Facebook and Twitter. Empirical data about the online features and behaviour of the social
        media accounts of Italian universities was gathered using several qualitative and quantitative
        data collection techniques, including automatic data collection, ad-hoc Application
        Programming Interface (API) queries and information obtained from the university personnel
        managing the accounts. The results of the ‘SocialUniversity’ project show that most Italian
        universities have active social network accounts; that Facebook is the platform of choice to
        answer the students’ questions, while Twitter serves mostly as an online news channel; that
        Italian universities on average use social media platforms generally better than the Italian
        public administration; that in the specific subset of technical universities, a few Italian
        institutions have an online footprint comparable to some of the top European technical
        universities (e.g., the Swiss Federal Institute of Technology in Zurich).</p>
    </details>
</div>

## 2013

<div id="basso2013strengthening">
    <p>
        <a href="#basso2013strengthening">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="basso2013strengthening.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
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

<div id="futia2013visualizing">
    <p>
        <a href="#futia2013visualizing">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="futia2013visualizing.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Visualizing Internet-Measurements Data for Research Purposes: the NeuViz Data Visualization Tool</strong>
    </p>
    <p>Giuseppe Futia, Enrico Zimuel, Simone Basso, Juan Carlos De Martin</p>
    <p>In Proc. of: Congresso Nazionale AICA 2013</p>
    <details>
        <summary>Abstract</summary>
        <p>In this paper we present NeuViz, a data processing and visualization architecture for network
        measurement experiments. NeuViz has been tailored to work on the data produced by Neubot (Net Neutrality
        Bot), an Internet bot that performs periodic, active network performance tests. We show that NeuViz
        is an effective tool to navigate Neubot data to identify cases (to be investigated with more specific
        network tests) in which a protocol seems discriminated. Also, we suggest how the information
        provided by the NeuViz Web API can help to automatically detect cases in which a protocol seems
        discriminated, to raise warnings or trigger more specific tests.</p>
    </details>
</div>

<div id="morando2013free">
    <p>
        <a href="#morando2013free">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="morando2013free.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
        </a>
        <strong>Is there such a thing as free government data?</strong>
    </p>
    <p>Federico Morando, Raimondo Iemma, Simone Basso</p>
    <p>In: Internet Policy Review, 2013</p>
    <details>
        <summary>Abstract</summary>
        <p>The recently-amended European public sector information (PSI) directive (Directive 2013/37/EU, PDF,
        hereinafter “the directive”) rests on the assumption that “[d]ocuments produced by public sector bodies
        of the Member States constitute a vast, diverse and valuable pool of resources that can benefit the
        knowledge economy” (recital 1).</p>
        <p>More specifically, European policy-makers submit that “[o]pen data policies which encourage
        the wide availability and re-use of public sector information for private or commercial purposes,
        with minimal or no legal, technical or financial constraints [...] can play an important role
        in kick-starting the development of new services [...], stimulate economic growth and
        promote social engagement” (recital 3).</p>
        <p>Therefore, to keep financial constraints on re-use as low as possible, the directive provides
        that, “where charges are made by public sector bodies for the re-use of documents, those
        charges should in principle be limited to the marginal costs”. In practice, this should imply
        that most (natively digital) government data are free to re-use for any (lawful) purpose.</p>
        <p>This article provides a brief review of the of the public-sector-information pricing issues. It then
        discusses the terms under which the ongoing consultation on the implementation guidelines of the PSI
        directive addresses pricing. In particular, this article discusses the calculation criteria
        for marginal costs.</p>
    </details>
</div>

## 2012

<div id="basso2012estimating">
    <p>
        <a href="#basso2012estimating">
            <img src="/assets/link-icon.svg" class="icon" alt="[#]">
        </a>
        <a href="basso2012estimating.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
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
        <a href="basso2011hitchhiker.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
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
        <a href="basso2011network.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
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
        <a href="basso2010rationale.pdf">
            <img src="/assets/pdf-icon.svg" class="icon" alt="[pdf]">
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
