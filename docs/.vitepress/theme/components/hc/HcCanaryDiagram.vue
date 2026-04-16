<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="灰度发布与流量调度"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc17-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
        <marker id="hc17-arr-red" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-rv-c-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">灰度发布与流量调度</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">最怕的不是 bug，而是一次性把 bug 推给所有用户</text>

      <!-- Canary flow -->
      <text x="430" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">金丝雀发布核心流程</text>

      <!-- Step 1 -->
      <rect x="30" y="82" width="130" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="95" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="var(--d-blue)">1. 部署新版</text>
      <text x="95" y="116" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">不接流量</text>

      <line x1="160" y1="104" x2="186" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc17-arr)" />

      <!-- Step 2 -->
      <rect x="190" y="82" width="130" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="255" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="var(--d-rv-a-text)">2. 切入 1~5%</text>
      <text x="255" y="116" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">小比例流量</text>

      <line x1="320" y1="104" x2="346" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc17-arr)" />

      <!-- Step 3 -->
      <rect x="350" y="82" width="130" height="44" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="415" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="var(--d-rv-b-text)">3. 观察 10~30m</text>
      <text x="415" y="116" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Metrics / 日志 / 告警</text>

      <line x1="480" y1="104" x2="506" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc17-arr)" />

      <!-- Step 4 -->
      <rect x="510" y="82" width="130" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="575" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="var(--d-warn-text)">4. 逐步放量</text>
      <text x="575" y="116" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">10% → 50% → 100%</text>

      <line x1="640" y1="104" x2="666" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc17-arr)" />

      <!-- Step 5 -->
      <rect x="670" y="82" width="160" height="44" rx="10" fill="var(--d-green)" />
      <text x="750" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">5. 全量上线</text>
      <text x="750" y="116" text-anchor="middle" font-size="8" fill="#fff">发布完成</text>

      <!-- Rollback path -->
      <path d="M415,126 L415,146 L750,146 L750,126" stroke="var(--d-rv-c-border)" stroke-width="1.4" fill="none" stroke-dasharray="5,3" marker-end="url(#hc17-arr-red)" />
      <text x="582" y="160" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">发现问题 → 立即回滚（流量切回旧版本）</text>

      <!-- Traffic bar visualization -->
      <rect x="100" y="176" width="660" height="14" rx="7" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <rect x="100" y="176" width="33" height="14" rx="7" fill="var(--d-rv-a-border)" />
      <text x="116" y="187" text-anchor="middle" font-size="7" fill="#fff">5%</text>
      <rect x="200" y="176" width="66" height="14" rx="7" fill="var(--d-rv-a-border)" opacity="0.8" />
      <text x="233" y="187" text-anchor="middle" font-size="7" fill="#fff">10%</text>
      <rect x="360" y="176" width="200" height="14" rx="7" fill="var(--d-rv-a-border)" opacity="0.6" />
      <text x="460" y="187" text-anchor="middle" font-size="7" fill="#fff">50%</text>
      <rect x="620" y="176" width="140" height="14" rx="7" fill="var(--d-green)" opacity="0.8" />
      <text x="690" y="187" text-anchor="middle" font-size="7" fill="#fff">100%</text>

      <!-- Four strategies -->
      <text x="430" y="216" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">发布策略对比</text>

      <rect x="30" y="230" width="190" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="125" y="250" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">金丝雀发布</text>
      <text x="125" y="266" text-anchor="middle" font-size="9" fill="var(--d-text)">小流量验证 → 逐步放量</text>
      <text x="125" y="282" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">常规迭代发布</text>

      <rect x="240" y="230" width="190" height="60" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="335" y="250" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">蓝绿部署</text>
      <text x="335" y="266" text-anchor="middle" font-size="9" fill="var(--d-text)">新旧并行 · 一键切换</text>
      <text x="335" y="282" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">需要快速回滚</text>

      <rect x="450" y="230" width="190" height="60" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="545" y="250" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">AB 测试</text>
      <text x="545" y="266" text-anchor="middle" font-size="9" fill="var(--d-text)">按用户特征分流</text>
      <text x="545" y="282" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">功能实验 · 算法优化</text>

      <rect x="660" y="230" width="190" height="60" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="755" y="250" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">滚动更新</text>
      <text x="755" y="266" text-anchor="middle" font-size="9" fill="var(--d-text)">逐台替换实例</text>
      <text x="755" y="282" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">K8s 默认策略</text>

      <!-- Principle -->
      <text x="430" y="316" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">任何变更都应该：可灰度 · 可监控 · 可回滚</text>
    </svg>
  </DiagramFrame>
</template>
