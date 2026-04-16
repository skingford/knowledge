<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="720px">
    <svg
      viewBox="0 0 680 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EMQX 4 层内部架构图"
      role="img"
    >
      <defs>
        <marker id="emqx-arch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="340" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">
        EMQX 4 层内部架构
      </text>

      <!-- Layer 1: Connection -->
      <rect x="40" y="44" width="600" height="64" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="80" y="70" font-size="13" font-weight="700" fill="var(--d-text)">Connection Layer</text>
      <text x="80" y="92" font-size="10" fill="var(--d-text-sub)">TCP / TLS / WebSocket 接入，MQTT 报文编解码</text>
      <text x="580" y="80" text-anchor="end" font-size="9.5" fill="var(--d-text-muted)">Socket · Parser</text>

      <!-- Arrow 1→2 -->
      <line x1="340" y1="108" x2="340" y2="120" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#emqx-arch-arrow)" />

      <!-- Layer 2: Session -->
      <rect x="40" y="124" width="600" height="64" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="80" y="150" font-size="13" font-weight="700" fill="var(--d-text)">Session Layer</text>
      <text x="80" y="172" font-size="10" fill="var(--d-text-sub)">PUBLISH / SUBSCRIBE 处理，QoS 状态机</text>
      <text x="580" y="160" text-anchor="end" font-size="9.5" fill="var(--d-text-muted)">Inflight Queue · Message Queue</text>

      <!-- Arrow 2→3 -->
      <line x1="340" y1="188" x2="340" y2="200" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#emqx-arch-arrow)" />

      <!-- Layer 3: PubSub -->
      <rect x="40" y="204" width="600" height="64" rx="12" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.4" />
      <text x="80" y="230" font-size="13" font-weight="700" fill="var(--d-text)">PubSub Layer</text>
      <text x="80" y="252" font-size="10" fill="var(--d-text-sub)">本地订阅分发，Subscription Table 匹配</text>
      <text x="580" y="240" text-anchor="end" font-size="9.5" fill="var(--d-text-muted)">Subscription Table (ETS)</text>

      <!-- Arrow 3→4 -->
      <line x1="340" y1="268" x2="340" y2="280" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#emqx-arch-arrow)" />

      <!-- Layer 4: Router -->
      <rect x="40" y="284" width="600" height="64" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="80" y="310" font-size="13" font-weight="700" fill="var(--d-text)">Router Layer</text>
      <text x="80" y="332" font-size="10" fill="var(--d-text-sub)">集群级 Topic Trie + Route Table，跨节点消息转发</text>
      <text x="580" y="320" text-anchor="end" font-size="9.5" fill="var(--d-text-muted)">Topic Trie · Route Table (Mria)</text>
    </svg>
  </DiagramFrame>
</template>
