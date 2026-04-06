<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="数据倾斜问题"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc25-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">数据倾斜 · 分布不均导致局部过载</text>

      <!-- Skewed bars visualization -->
      <text x="215" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">倾斜前（不均匀分片）</text>

      <rect x="60" y="66" width="60" height="100" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 0</text>
      <text x="90" y="80" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-c-text)">90%</text>

      <rect x="140" y="136" width="60" height="30" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="170" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 1</text>

      <rect x="220" y="146" width="60" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="250" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 2</text>

      <rect x="300" y="148" width="60" height="18" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="330" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 3</text>

      <!-- Arrow -->
      <line x1="400" y1="120" x2="450" y2="120" stroke="var(--d-green)" stroke-width="2" marker-end="url(#hc25-arr)" />
      <text x="425" y="112" text-anchor="middle" font-size="8" fill="var(--d-green)" font-weight="600">优化</text>

      <!-- Balanced bars -->
      <text x="645" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-green)">优化后（均匀分布）</text>

      <rect x="490" y="120" width="60" height="46" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="520" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 0</text>

      <rect x="570" y="116" width="60" height="50" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="600" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 1</text>

      <rect x="650" y="122" width="60" height="44" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="680" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 2</text>

      <rect x="730" y="118" width="60" height="48" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="760" y="176" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片 3</text>

      <!-- Solutions -->
      <text x="430" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">解决方案</text>

      <rect x="30" y="218" width="190" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="125" y="237" text-anchor="middle" font-size="9" fill="var(--d-text)">分片键优化（散列度高）</text>

      <rect x="240" y="218" width="160" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="320" y="237" text-anchor="middle" font-size="9" fill="var(--d-text)">二次哈希 + 随机后缀</text>

      <rect x="420" y="218" width="160" height="30" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="500" y="237" text-anchor="middle" font-size="9" fill="var(--d-text)">大 key 拆分多个小 Hash</text>

      <rect x="600" y="218" width="230" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="715" y="237" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">MQ rebalance / 增加 partition</text>
    </svg>
  </DiagramFrame>
</template>
