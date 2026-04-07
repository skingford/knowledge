<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="940px">
    <svg
      viewBox="0 0 920 760"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 加 EMQX 百万长连接平台系统架构图"
      role="img"
    >
      <defs>
        <marker id="emqx-overview-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="460" y="24" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        百万长连接平台分层：EMQX 负责连接与路由，Go 服务负责业务与数据闭环
      </text>

      <rect x="30" y="40" width="860" height="96" rx="20" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="460" y="64" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Client Layer</text>

      <rect x="58" y="78" width="176" height="40" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.2" />
      <text x="146" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-client-text)">Mobile App</text>
      <text x="146" y="111" text-anchor="middle" font-size="9.5" fill="var(--d-client-text)">MQTT over TCP/TLS</text>

      <rect x="266" y="78" width="176" height="40" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.2" />
      <text x="354" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-client-text)">Web Browser</text>
      <text x="354" y="111" text-anchor="middle" font-size="9.5" fill="var(--d-client-text)">WebSocket / WSS</text>

      <rect x="474" y="78" width="176" height="40" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.2" />
      <text x="562" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-client-text)">IoT Device</text>
      <text x="562" y="111" text-anchor="middle" font-size="9.5" fill="var(--d-client-text)">MQTT / telemetry</text>

      <rect x="682" y="78" width="176" height="40" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.2" />
      <text x="770" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-client-text)">Desktop Client</text>
      <text x="770" y="111" text-anchor="middle" font-size="9.5" fill="var(--d-client-text)">MQTT / multi-session</text>

      <line x1="146" y1="118" x2="460" y2="160" stroke="var(--d-arrow)" stroke-width="1.3" />
      <line x1="354" y1="118" x2="460" y2="160" stroke="var(--d-arrow)" stroke-width="1.3" />
      <line x1="562" y1="118" x2="460" y2="160" stroke="var(--d-arrow)" stroke-width="1.3" />
      <line x1="770" y1="118" x2="460" y2="160" stroke="var(--d-arrow)" stroke-width="1.3" />

      <rect x="270" y="160" width="380" height="58" rx="16" fill="var(--d-blue-light)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="460" y="184" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Load Balancer</text>
      <text x="460" y="201" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">L4 TCP/TLS · HAProxy / NLB / MetalLB</text>

      <line x1="460" y1="218" x2="460" y2="252" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#emqx-overview-arrow)" />

      <rect x="60" y="252" width="800" height="248" rx="22" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="460" y="278" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">EMQX Cluster Layer</text>
      <text x="460" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Core 写路由与元数据，Replicant 承载海量连接与订阅流量</text>

      <line x1="460" y1="252" x2="195" y2="316" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="460" y1="252" x2="460" y2="316" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="460" y1="252" x2="725" y2="316" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />

      <rect x="110" y="316" width="170" height="58" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="195" y="339" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">EMQX Core 1</text>
      <text x="195" y="357" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">Mria / ACID metadata</text>

      <rect x="375" y="316" width="170" height="58" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="460" y="339" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">EMQX Core 2</text>
      <text x="460" y="357" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">routing / session metadata</text>

      <rect x="640" y="316" width="170" height="58" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="725" y="339" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">EMQX Core 3</text>
      <text x="725" y="357" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">cluster quorum / config</text>

      <line x1="280" y1="345" x2="375" y2="345" stroke="var(--d-blue-border)" stroke-width="1.6" marker-end="url(#emqx-overview-arrow)" />
      <line x1="545" y1="345" x2="640" y2="345" stroke="var(--d-blue-border)" stroke-width="1.6" marker-end="url(#emqx-overview-arrow)" />
      <line x1="725" y1="316" x2="195" y2="316" stroke="var(--d-blue-border)" stroke-width="1.2" opacity="0.55" />
      <text x="460" y="312" text-anchor="middle" font-size="9.5" fill="var(--d-text-muted)">Full Mesh for Core metadata replication</text>

      <line x1="195" y1="374" x2="195" y2="406" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="6 5" marker-end="url(#emqx-overview-arrow)" />
      <line x1="460" y1="374" x2="460" y2="406" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="6 5" marker-end="url(#emqx-overview-arrow)" />
      <line x1="725" y1="374" x2="725" y2="406" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="6 5" marker-end="url(#emqx-overview-arrow)" />
      <text x="195" y="396" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">RLOG async</text>
      <text x="460" y="396" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">RLOG async</text>
      <text x="725" y="396" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">RLOG async</text>

      <rect x="110" y="406" width="170" height="62" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="195" y="430" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">Replicant 1</text>
      <text x="195" y="449" text-anchor="middle" font-size="9.5" fill="var(--d-rv-a-text)">Read-only / client traffic</text>

      <rect x="375" y="406" width="170" height="62" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="460" y="430" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">Replicant 2</text>
      <text x="460" y="449" text-anchor="middle" font-size="9.5" fill="var(--d-rv-a-text)">Read-only / scale-out</text>

      <rect x="640" y="406" width="170" height="62" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="725" y="430" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">Replicant N</text>
      <text x="725" y="449" text-anchor="middle" font-size="9.5" fill="var(--d-rv-a-text)">Read-only / burst absorb</text>

      <line x1="195" y1="468" x2="460" y2="488" stroke="var(--d-rv-a-border)" stroke-width="1.2" opacity="0.5" />
      <line x1="725" y1="468" x2="460" y2="488" stroke="var(--d-rv-a-border)" stroke-width="1.2" opacity="0.5" />
      <text x="460" y="486" text-anchor="middle" font-size="9.5" fill="var(--d-text-muted)">Star topology for connection scale-out</text>

      <line x1="460" y1="500" x2="460" y2="528" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="185" y1="528" x2="735" y2="528" stroke="var(--d-arrow)" stroke-width="1.3" />
      <line x1="185" y1="528" x2="185" y2="548" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="460" y1="528" x2="460" y2="548" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="735" y1="528" x2="735" y2="548" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <text x="460" y="522" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">事件分流与扩展点</text>

      <rect x="110" y="548" width="150" height="64" rx="16" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.4" />
      <text x="185" y="572" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-engine-text)">Rule Engine</text>
      <text x="185" y="591" text-anchor="middle" font-size="9.5" fill="var(--d-engine-sub)">SQL filter / Connector</text>

      <rect x="385" y="548" width="150" height="64" rx="16" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.4" />
      <text x="460" y="572" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-engine-text)">ExHook</text>
      <text x="460" y="591" text-anchor="middle" font-size="9.5" fill="var(--d-engine-sub)">gRPC auth / ACL / intercept</text>

      <rect x="660" y="548" width="150" height="64" rx="16" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.4" />
      <text x="735" y="572" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-engine-text)">WebHook</text>
      <text x="735" y="591" text-anchor="middle" font-size="9.5" fill="var(--d-engine-sub)">HTTP events / notifications</text>

      <rect x="60" y="640" width="370" height="92" rx="18" fill="var(--d-blue-light)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="245" y="664" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Go Microservices Layer</text>
      <rect x="88" y="678" width="148" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="162" y="692" text-anchor="middle" font-size="9.5" fill="var(--d-text)">API Server</text>
      <rect x="252" y="678" width="148" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="326" y="692" text-anchor="middle" font-size="9.5" fill="var(--d-text)">ExHook Server</text>
      <rect x="88" y="706" width="148" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="162" y="720" text-anchor="middle" font-size="9.5" fill="var(--d-text)">Consumer Service</text>
      <rect x="252" y="706" width="148" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="326" y="720" text-anchor="middle" font-size="9.5" fill="var(--d-text)">Push Service</text>

      <rect x="490" y="640" width="370" height="92" rx="18" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="675" y="664" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Infrastructure Layer</text>
      <rect x="516" y="678" width="80" height="20" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="556" y="692" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Kafka</text>
      <rect x="608" y="678" width="80" height="20" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="648" y="692" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Redis</text>
      <rect x="700" y="678" width="134" height="20" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="767" y="692" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">MySQL / PostgreSQL</text>
      <rect x="548" y="706" width="146" height="20" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="621" y="720" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ClickHouse / InfluxDB</text>
      <rect x="710" y="706" width="124" height="20" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="772" y="720" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Prometheus</text>

      <line x1="460" y1="612" x2="326" y2="640" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="735" y1="612" x2="326" y2="640" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="185" y1="612" x2="675" y2="640" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#emqx-overview-arrow)" />
      <line x1="430" y1="686" x2="490" y2="686" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="6 5" marker-end="url(#emqx-overview-arrow)" />
      <text x="460" y="678" text-anchor="middle" font-size="9.5" fill="var(--d-text-muted)">业务落库 / 缓存 / 指标</text>
    </svg>
  </DiagramFrame>
</template>
