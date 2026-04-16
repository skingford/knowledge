<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="容器化与弹性伸缩"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc27-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">容器化与弹性伸缩 · K8s HPA 流程</text>

      <!-- HPA flow -->
      <rect x="40" y="48" width="130" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="105" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">流量增长</text>
      <text x="105" y="84" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">CPU / QPS 上升</text>

      <line x1="170" y1="70" x2="210" y2="70" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc27-arr)" />

      <rect x="214" y="48" width="130" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="279" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">Metrics 采集</text>
      <text x="279" y="84" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Prometheus</text>

      <line x1="344" y1="70" x2="384" y2="70" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc27-arr)" />

      <rect x="388" y="48" width="130" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="453" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">HPA 决策</text>
      <text x="453" y="84" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">超阈值 → 扩容</text>

      <line x1="518" y1="70" x2="558" y2="70" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc27-arr)" />

      <rect x="562" y="48" width="130" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="627" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-b-text)">创建新 Pod</text>
      <text x="627" y="84" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">秒级启动</text>

      <line x1="692" y1="70" x2="732" y2="70" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc27-arr)" />

      <rect x="736" y="48" width="100" height="44" rx="8" fill="var(--d-green)" />
      <text x="786" y="68" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">预热接流</text>
      <text x="786" y="84" text-anchor="middle" font-size="8" fill="#fff">Readiness</text>

      <!-- Scaling strategies -->
      <text x="430" y="118" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">弹性伸缩策略</text>

      <rect x="30" y="132" width="190" height="66" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="125" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">HPA</text>
      <text x="125" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">CPU / 内存 / 自定义指标</text>
      <text x="125" y="184" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分钟级响应 · 常规波动</text>

      <rect x="240" y="132" width="190" height="66" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="335" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">CronHPA</text>
      <text x="335" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">预设时间点提前扩容</text>
      <text x="335" y="184" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">可预期高峰 · 大促前</text>

      <rect x="450" y="132" width="190" height="66" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="545" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">KEDA</text>
      <text x="545" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">事件驱动（MQ 堆积量）</text>
      <text x="545" y="184" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">消费者按队列深度伸缩</text>

      <rect x="660" y="132" width="190" height="66" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="755" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">Serverless</text>
      <text x="755" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">按调用计费 · 天然弹性</text>
      <text x="755" y="184" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">突发 / 低频 / 事件驱动</text>

      <!-- Cold start -->
      <rect x="30" y="216" width="400" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="230" y="236" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">冷启动问题</text>
      <text x="230" y="254" text-anchor="middle" font-size="9" fill="var(--d-text)">JVM 预热 · 连接池初始化 · 缓存加载</text>
      <text x="230" y="268" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Readiness Probe 就绪前不接流量 · 启动后逐步增加权重</text>

      <!-- Cost optimization -->
      <rect x="450" y="216" width="380" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="640" y="236" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-blue)">成本优化</text>
      <text x="640" y="254" text-anchor="middle" font-size="9" fill="var(--d-text)">基线用预留实例 · 峰值用 Spot 竞价（降 60~80%）</text>
      <text x="640" y="268" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">设置 request/limit · 低谷缩到最小副本 · 避免浪费</text>

      <!-- Bottom -->
      <rect x="140" y="290" width="580" height="24" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="430" y="306" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">大促前按预估量提前扩好，而非等流量来了再扩 — CronHPA + 手动预留</text>
    </svg>
  </DiagramFrame>
</template>
