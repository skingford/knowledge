<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="典型指标参考"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">典型指标参考 · 心中有数</text>

      <!-- Card 1: Redis -->
      <rect x="40" y="48" width="180" height="130" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="130" y="78" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">Redis 单机 QPS</text>
      <text x="130" y="120" text-anchor="middle" font-size="32" font-weight="700" fill="var(--d-rv-c-text)">10万+</text>
      <text x="130" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GET/SET 简单操作</text>
      <text x="130" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Lua 脚本稍低</text>

      <!-- Card 2: Nginx -->
      <rect x="245" y="48" width="180" height="130" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="335" y="78" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">Nginx 单机并发</text>
      <text x="335" y="120" text-anchor="middle" font-size="32" font-weight="700" fill="var(--d-blue)">数万</text>
      <text x="335" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">epoll 事件驱动</text>
      <text x="335" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">C10K 早已不是问题</text>

      <!-- Card 3: MySQL -->
      <rect x="450" y="48" width="180" height="130" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="540" y="78" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">MySQL 单表行数</text>
      <text x="540" y="120" text-anchor="middle" font-size="28" font-weight="700" fill="var(--d-rv-a-text)">&lt;1000万</text>
      <text x="540" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">超过则考虑分表</text>
      <text x="540" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">索引深度影响查询</text>

      <!-- Card 4: P99 -->
      <rect x="655" y="48" width="180" height="130" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="745" y="78" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">接口 P99 目标</text>
      <text x="745" y="120" text-anchor="middle" font-size="28" font-weight="700" fill="var(--d-rv-b-text)">&lt;500ms</text>
      <text x="745" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">核心接口 &lt;200ms</text>
      <text x="745" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">超过需优化链路</text>

      <!-- Bottom note -->
      <text x="430" y="198" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">以上为经验值参考，实际需结合硬件配置和业务场景进行压测验证</text>
    </svg>
  </DiagramFrame>
</template>
