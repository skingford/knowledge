<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 420"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="水平扩展与分层架构"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc1-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">水平扩展与分层架构</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">无状态化设计 + 接入层 / 业务层 / 数据层独立扩展</text>

      <!-- Users -->
      <rect x="340" y="60" width="180" height="32" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="430" y="81" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">用户请求</text>

      <line x1="430" y1="92" x2="430" y2="112" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- Layer 1: Access -->
      <rect x="60" y="116" width="740" height="72" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="72" y="124" width="100" height="20" rx="10" fill="var(--d-blue-border)" />
      <text x="122" y="138" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">接入层</text>

      <rect x="80" y="152" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="140" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">Nginx / LB</text>

      <rect x="220" y="152" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="280" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">API Gateway</text>

      <rect x="360" y="152" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="420" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">限流 / 鉴权</text>

      <rect x="500" y="152" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="560" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">CDN / 静态化</text>

      <rect x="640" y="152" width="140" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="710" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">WAF / 黑名单</text>

      <line x1="200" y1="166" x2="220" y2="166" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc1-arr)" />
      <line x1="340" y1="166" x2="360" y2="166" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc1-arr)" />

      <line x1="430" y1="188" x2="430" y2="210" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- Layer 2: Business -->
      <rect x="60" y="214" width="740" height="72" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="72" y="222" width="100" height="20" rx="10" fill="var(--d-rv-a-border)" />
      <text x="122" y="236" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">业务层</text>

      <!-- Stateless service instances -->
      <rect x="80" y="250" width="96" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="128" y="269" text-anchor="middle" font-size="10" fill="var(--d-text)">Service A-1</text>

      <rect x="190" y="250" width="96" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="238" y="269" text-anchor="middle" font-size="10" fill="var(--d-text)">Service A-2</text>

      <rect x="300" y="250" width="96" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="348" y="269" text-anchor="middle" font-size="10" fill="var(--d-text)">Service A-3</text>

      <text x="420" y="269" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">…</text>

      <rect x="450" y="250" width="96" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="498" y="269" text-anchor="middle" font-size="10" fill="var(--d-text)">Service B-1</text>

      <rect x="560" y="250" width="96" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="608" y="269" text-anchor="middle" font-size="10" fill="var(--d-text)">Service B-2</text>

      <!-- Scale out annotation -->
      <text x="720" y="260" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">无状态</text>
      <text x="720" y="274" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">任意扩缩</text>

      <line x1="430" y1="286" x2="430" y2="308" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- Layer 3: Data -->
      <rect x="60" y="312" width="740" height="72" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="72" y="320" width="100" height="20" rx="10" fill="var(--d-rv-b-border)" />
      <text x="122" y="334" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">数据层</text>

      <rect x="80" y="348" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="140" y="367" text-anchor="middle" font-size="10" fill="var(--d-text)">MySQL 主从</text>

      <rect x="220" y="348" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="280" y="367" text-anchor="middle" font-size="10" fill="var(--d-text)">Redis Cluster</text>

      <rect x="360" y="348" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="420" y="367" text-anchor="middle" font-size="10" fill="var(--d-text)">MQ Broker</text>

      <rect x="500" y="348" width="120" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="560" y="367" text-anchor="middle" font-size="10" fill="var(--d-text)">ES / 搜索</text>

      <rect x="640" y="348" width="140" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="710" y="367" text-anchor="middle" font-size="10" fill="var(--d-text)">对象存储 / OSS</text>

      <!-- Session callout -->
      <rect x="200" y="394" width="460" height="22" rx="11" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="430" y="409" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">Session 外置到 Redis — 服务无状态化的前提</text>
    </svg>
  </DiagramFrame>
</template>
