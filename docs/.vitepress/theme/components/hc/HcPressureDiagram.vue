<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="全链路压测与容量规划"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc15-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">全链路压测与容量规划</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不做压测就上大促，等于蒙眼开车</text>

      <!-- Flow -->
      <text x="430" y="70" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">全链路压测流程</text>

      <!-- Step 1 -->
      <rect x="30" y="84" width="140" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="100" y="104" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">流量构造</text>
      <text x="100" y="120" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">日志回放 / 仿真</text>

      <line x1="170" y1="109" x2="196" y2="109" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc15-arr)" />

      <!-- Step 2 -->
      <rect x="200" y="84" width="140" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="270" y="104" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">流量染色</text>
      <text x="270" y="120" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Header 打标 · 全链路透传</text>

      <line x1="340" y1="109" x2="366" y2="109" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc15-arr)" />

      <!-- Step 3 -->
      <rect x="370" y="84" width="140" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="440" y="104" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">影子库/表</text>
      <text x="440" y="120" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">不污染线上数据</text>

      <line x1="510" y1="109" x2="536" y2="109" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc15-arr)" />

      <!-- Step 4 -->
      <rect x="540" y="84" width="140" height="50" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="610" y="104" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">Mock 外部</text>
      <text x="610" y="120" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">支付/短信用 Mock</text>

      <line x1="680" y1="109" x2="706" y2="109" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc15-arr)" />

      <!-- Step 5 -->
      <rect x="710" y="84" width="140" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="780" y="104" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">阶梯加压</text>
      <text x="780" y="120" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">找到系统极限点</text>

      <!-- Capacity formula -->
      <rect x="140" y="154" width="580" height="48" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="430" y="174" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-blue)">容量规划公式</text>
      <text x="430" y="194" text-anchor="middle" font-size="10" fill="var(--d-text)">所需机器数 = 峰值 QPS / 单机极限 QPS × 冗余系数（1.5~2）</text>

      <!-- Key metrics -->
      <text x="430" y="228" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">压测必看指标</text>

      <rect x="40" y="242" width="140" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="110" y="262" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">QPS / TPS</text>
      <text x="110" y="278" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">系统吞吐量</text>

      <rect x="200" y="242" width="140" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="270" y="262" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">P99 响应时间</text>
      <text x="270" y="278" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">尾部延迟</text>

      <rect x="360" y="242" width="140" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="430" y="262" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">错误率</text>
      <text x="430" y="278" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">HTTP 5xx / 超时</text>

      <rect x="520" y="242" width="140" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="590" y="262" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">CPU / 内存</text>
      <text x="590" y="278" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">资源使用率</text>

      <rect x="680" y="242" width="140" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="750" y="262" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">GC 频率</text>
      <text x="750" y="278" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">Full GC 耗时</text>

      <!-- Principle -->
      <rect x="120" y="304" width="620" height="28" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="430" y="323" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">上线前必须压测 · 扩容后必须回归压测 · 大促前全链路压测至少一轮</text>
    </svg>
  </DiagramFrame>
</template>
