<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 460"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="多级缓存策略"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc2-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
        <marker id="hc2-arr-red" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-rv-c-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">多级缓存策略与双写一致性</text>

      <!-- Main flow: multi-level cache -->
      <text x="430" y="60" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">读请求链路（命中率层层递增）</text>

      <!-- Request -->
      <rect x="60" y="76" width="110" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="115" y="99" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">客户端请求</text>

      <line x1="170" y1="94" x2="210" y2="94" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc2-arr)" />

      <!-- L1 Cache -->
      <rect x="214" y="76" width="140" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="284" y="92" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">L1 本地缓存</text>
      <text x="284" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Caffeine / Guava</text>

      <line x1="354" y1="94" x2="394" y2="94" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc2-arr)" />
      <text x="374" y="86" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">miss</text>

      <!-- L2 Cache -->
      <rect x="398" y="76" width="140" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="468" y="92" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">L2 分布式缓存</text>
      <text x="468" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Redis Cluster</text>

      <line x1="538" y1="94" x2="578" y2="94" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc2-arr)" />
      <text x="558" y="86" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">miss</text>

      <!-- DB -->
      <rect x="582" y="76" width="140" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="652" y="92" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">数据库</text>
      <text x="652" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MySQL / PG</text>

      <!-- Return arrow -->
      <path d="M652,112 L652,126 L284,126 L284,112" stroke="var(--d-green)" stroke-width="1.2" fill="none" stroke-dasharray="5,3" marker-end="url(#hc2-arr)" />
      <text x="468" y="140" text-anchor="middle" font-size="8" fill="var(--d-green)">miss 后回填缓存</text>

      <!-- Three problems section -->
      <text x="430" y="176" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">缓存三大异常</text>

      <!-- Penetration -->
      <rect x="60" y="192" width="230" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="175" y="212" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">缓存穿透</text>
      <text x="175" y="230" text-anchor="middle" font-size="9" fill="var(--d-text)">查询不存在的数据</text>
      <text x="175" y="244" text-anchor="middle" font-size="9" fill="var(--d-text)">缓存和 DB 都 miss</text>
      <rect x="100" y="254" width="150" height="20" rx="10" fill="var(--d-blue-border)" />
      <text x="175" y="268" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">布隆过滤器拦截</text>

      <!-- Breakdown -->
      <rect x="315" y="192" width="230" height="90" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="430" y="212" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">缓存击穿</text>
      <text x="430" y="230" text-anchor="middle" font-size="9" fill="var(--d-text)">热点 key 过期</text>
      <text x="430" y="244" text-anchor="middle" font-size="9" fill="var(--d-text)">大量请求直达 DB</text>
      <rect x="355" y="254" width="150" height="20" rx="10" fill="var(--d-blue-border)" />
      <text x="430" y="268" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">互斥锁 / 永不过期</text>

      <!-- Avalanche -->
      <rect x="570" y="192" width="230" height="90" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="685" y="212" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">缓存雪崩</text>
      <text x="685" y="230" text-anchor="middle" font-size="9" fill="var(--d-text)">大批 key 同时过期</text>
      <text x="685" y="244" text-anchor="middle" font-size="9" fill="var(--d-text)">DB 被打崩</text>
      <rect x="610" y="254" width="150" height="20" rx="10" fill="var(--d-blue-border)" />
      <text x="685" y="268" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">过期时间加随机抖动</text>

      <!-- Write consistency section -->
      <text x="430" y="318" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">双写一致性 — Cache Aside Pattern（推荐）</text>

      <!-- Write flow -->
      <rect x="60" y="338" width="100" height="32" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="110" y="359" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">写请求</text>

      <line x1="160" y1="354" x2="200" y2="354" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc2-arr)" />
      <text x="180" y="346" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">1</text>

      <rect x="204" y="338" width="130" height="32" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="269" y="359" text-anchor="middle" font-size="10" fill="var(--d-text)">先更新 DB</text>

      <line x1="334" y1="354" x2="374" y2="354" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc2-arr)" />
      <text x="354" y="346" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">2</text>

      <rect x="378" y="338" width="130" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="443" y="359" text-anchor="middle" font-size="10" fill="var(--d-text)">再删缓存</text>

      <!-- Binlog path -->
      <line x1="530" y1="354" x2="560" y2="354" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc2-arr)" />

      <rect x="564" y="334" width="240" height="40" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="684" y="352" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">强一致方案：Binlog → Canal</text>
      <text x="684" y="366" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">异步更新 Redis，解耦业务代码</text>

      <!-- Delayed double delete -->
      <rect x="200" y="394" width="460" height="28" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="430" y="413" text-anchor="middle" font-size="9" fill="var(--d-text)">延迟双删：更新 DB → 删缓存 → 延迟 500ms → 再删一次（覆盖并发读回填的脏数据）</text>

      <!-- Bottom note -->
      <text x="430" y="450" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">一致性要求不高用 Cache Aside | 强一致用 Binlog 同步或加分布式锁</text>
    </svg>
  </DiagramFrame>
</template>
