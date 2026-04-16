<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="微服务治理"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc22-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">微服务治理 · 服务注册发现与 API 网关</text>

      <!-- Service registration flow -->
      <!-- Registry center -->
      <rect x="310" y="48" width="240" height="50" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <text x="430" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">注册中心</text>
      <text x="430" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Nacos / Eureka / Consul</text>

      <!-- Services register -->
      <rect x="40" y="130" width="120" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="100" y="153" text-anchor="middle" font-size="9" fill="var(--d-text)">订单服务 ×3</text>

      <rect x="180" y="130" width="120" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="240" y="153" text-anchor="middle" font-size="9" fill="var(--d-text)">库存服务 ×2</text>

      <rect x="320" y="130" width="120" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="153" text-anchor="middle" font-size="9" fill="var(--d-text)">支付服务 ×2</text>

      <rect x="460" y="130" width="120" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="520" y="153" text-anchor="middle" font-size="9" fill="var(--d-text)">用户服务 ×3</text>

      <!-- Register arrows up -->
      <line x1="100" y1="130" x2="340" y2="98" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#hc22-arr)" />
      <line x1="240" y1="130" x2="380" y2="98" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="4,3" />
      <line x1="380" y1="130" x2="420" y2="98" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="4,3" />
      <line x1="520" y1="130" x2="480" y2="98" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="4,3" />

      <text x="200" y="118" font-size="7" fill="var(--d-rv-a-text)">注册 + 心跳</text>

      <!-- Consumer subscribes -->
      <rect x="640" y="48" width="180" height="50" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="730" y="70" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">消费者</text>
      <text x="730" y="86" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">订阅服务列表 + LB 调用</text>

      <line x1="550" y1="73" x2="640" y2="73" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc22-arr)" />
      <text x="595" y="66" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">推送变更</text>

      <!-- API Gateway section -->
      <text x="430" y="196" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">API 网关 · 统一入口</text>

      <rect x="40" y="210" width="780" height="76" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="52" y="218" width="100" height="20" rx="10" fill="var(--d-warn-border)" />
      <text x="102" y="232" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">API Gateway</text>

      <!-- Gateway responsibilities -->
      <rect x="56" y="246" width="100" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="106" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">路由转发</text>

      <rect x="168" y="246" width="100" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="218" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">全局限流</text>

      <rect x="280" y="246" width="100" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="330" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">鉴权 JWT</text>

      <rect x="392" y="246" width="100" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="442" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">熔断降级</text>

      <rect x="504" y="246" width="100" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="554" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">协议转换</text>

      <rect x="616" y="246" width="100" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="666" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">请求聚合</text>

      <rect x="728" y="246" width="80" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="768" y="264" text-anchor="middle" font-size="8" fill="var(--d-text)">日志审计</text>

      <!-- Gateway selection -->
      <text x="430" y="310" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">网关选型</text>

      <rect x="40" y="322" width="190" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="135" y="342" text-anchor="middle" font-size="9" fill="var(--d-text)">Kong — Lua · 插件丰富</text>

      <rect x="250" y="322" width="190" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="345" y="342" text-anchor="middle" font-size="9" fill="var(--d-text)">APISIX — 极高性能</text>

      <rect x="460" y="322" width="190" height="30" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="555" y="342" text-anchor="middle" font-size="9" fill="var(--d-text)">SCG — Spring 生态</text>

      <rect x="670" y="322" width="160" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="750" y="342" text-anchor="middle" font-size="9" fill="var(--d-text)">Envoy — Mesh 标配</text>
    </svg>
  </DiagramFrame>
</template>
