<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="热点数据处理"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc12-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">热点数据处理 · 读热点与写热点</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">一个爆款商品就可能打崩单个 Redis 节点或数据库行</text>

      <!-- Hot key detection -->
      <rect x="300" y="56" width="260" height="28" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="430" y="75" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">热点识别：实时统计访问频次 · HotKey 框架</text>

      <!-- Left: Read hotspot -->
      <rect x="30" y="100" width="390" height="220" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="140" y="108" width="170" height="22" rx="11" fill="var(--d-blue-border)" />
      <text x="225" y="123" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">读热点方案</text>

      <!-- Solution 1: Local cache -->
      <text x="225" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">方案一：本地缓存兜底</text>

      <rect x="56" y="162" width="100" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="106" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">热点请求</text>

      <line x1="156" y1="177" x2="190" y2="177" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc12-arr)" />

      <rect x="194" y="162" width="110" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="249" y="175" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">JVM Caffeine</text>
      <text x="249" y="188" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">本地缓存直接返回</text>

      <text x="330" y="180" font-size="8" fill="var(--d-green)" font-weight="600">绕过 Redis</text>

      <!-- Solution 2: Multi-replica -->
      <text x="225" y="214" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">方案二：多副本分散</text>

      <rect x="56" y="226" width="76" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="94" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">product:123:r0</text>

      <rect x="140" y="226" width="76" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="178" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">product:123:r1</text>

      <rect x="224" y="226" width="76" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="262" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">product:123:r2</text>

      <text x="320" y="244" font-size="10" fill="var(--d-text-sub)">…</text>

      <rect x="340" y="226" width="64" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="372" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">:r7</text>

      <text x="225" y="272" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同一 key 加随机后缀 → 分散到多个 slot</text>

      <text x="225" y="306" text-anchor="middle" font-size="9" fill="var(--d-blue)" font-weight="600">读时随机选一个副本</text>

      <!-- Right: Write hotspot -->
      <rect x="440" y="100" width="390" height="220" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <rect x="550" y="108" width="170" height="22" rx="11" fill="var(--d-rv-a-border)" />
      <text x="635" y="123" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">写热点方案</text>

      <!-- Solution 1: Merge write -->
      <text x="635" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">方案一：合并写入</text>

      <rect x="466" y="162" width="100" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="516" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">写请求 x N</text>

      <line x1="566" y1="177" x2="600" y2="177" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc12-arr)" />

      <rect x="604" y="162" width="110" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="659" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">Redis 累加</text>
      <text x="659" y="188" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">INCRBY</text>

      <line x1="714" y1="177" x2="740" y2="177" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc12-arr)" />

      <rect x="744" y="166" width="70" height="22" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="779" y="181" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">定期刷 DB</text>

      <!-- Solution 2: Bucket split -->
      <text x="635" y="214" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">方案二：分桶计数</text>

      <rect x="466" y="226" width="76" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="504" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">stock:123:b0</text>

      <rect x="550" y="226" width="76" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="588" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">stock:123:b1</text>

      <rect x="634" y="226" width="76" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="672" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">stock:123:b2</text>

      <text x="730" y="244" font-size="10" fill="var(--d-text-sub)">…</text>

      <rect x="750" y="226" width="64" height="26" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="782" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">:b7</text>

      <text x="635" y="272" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">每桶分配部分库存 · 写请求随机落桶</text>

      <text x="635" y="306" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">大幅降低单点压力 · 读时汇总</text>

      <!-- Bottom: Seckill example -->
      <rect x="200" y="328" width="460" height="10" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0" />
      <text x="430" y="336" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-warn-text)">典型案例：秒杀库存用分桶扣减，每个桶分配部分库存</text>
    </svg>
  </DiagramFrame>
</template>
