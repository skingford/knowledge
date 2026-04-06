<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="高并发设计四大原则"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">高并发设计四大原则</text>

      <!-- Principle 1: Async -->
      <rect x="30" y="48" width="190" height="110" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="80" y="56" width="90" height="22" rx="11" fill="var(--d-blue-border)" />
      <text x="125" y="71" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">能异步就异步</text>
      <text x="125" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">同步是性能的天敌</text>
      <text x="125" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MQ 异步削峰</text>
      <text x="125" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">线程池隔离</text>
      <text x="125" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">事件驱动</text>

      <!-- Principle 2: Cache -->
      <rect x="235" y="48" width="190" height="110" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <rect x="285" y="56" width="90" height="22" rx="11" fill="var(--d-rv-a-border)" />
      <text x="330" y="71" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">能缓存就缓存</text>
      <text x="330" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">减少计算和 IO</text>
      <text x="330" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">多级缓存</text>
      <text x="330" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CDN + 本地 + 分布式</text>
      <text x="330" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">预计算</text>

      <!-- Principle 3: Reject -->
      <rect x="440" y="48" width="190" height="110" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.6" />
      <rect x="490" y="56" width="90" height="22" rx="11" fill="var(--d-rv-b-border)" />
      <text x="535" y="71" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">能拒绝就拒绝</text>
      <text x="535" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">限流保护比崩溃好</text>
      <text x="535" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">多层限流</text>
      <text x="535" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">熔断快速失败</text>
      <text x="535" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">优雅拒绝</text>

      <!-- Principle 4: Degrade -->
      <rect x="645" y="48" width="190" height="110" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <rect x="695" y="56" width="90" height="22" rx="11" fill="var(--d-warn-border)" />
      <text x="740" y="71" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">做好降级预案</text>
      <text x="740" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">核心链路优先保障</text>
      <text x="740" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">非核心功能可关</text>
      <text x="740" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">兜底数据 / 静态页</text>
      <text x="740" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">预案平台一键切换</text>

      <!-- Bottom -->
      <text x="430" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">四大原则贯穿全文，每个技术选型都可以用这四条检验</text>
    </svg>
  </DiagramFrame>
</template>
