<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="异步与削峰"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc4-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">异步与削峰 · 同步 vs 异步对比</text>

      <!-- Sync path -->
      <text x="430" y="62" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">同步调用（高延迟 · 强耦合）</text>

      <rect x="60" y="74" width="100" height="32" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="110" y="95" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">用户请求</text>

      <line x1="160" y1="90" x2="200" y2="90" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc4-arr)" />

      <rect x="204" y="74" width="100" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="254" y="95" text-anchor="middle" font-size="10" fill="var(--d-text)">订单服务</text>

      <line x1="304" y1="90" x2="344" y2="90" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc4-arr)" />

      <rect x="348" y="74" width="100" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="398" y="95" text-anchor="middle" font-size="10" fill="var(--d-text)">库存服务</text>

      <line x1="448" y1="90" x2="488" y2="90" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc4-arr)" />

      <rect x="492" y="74" width="100" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="542" y="95" text-anchor="middle" font-size="10" fill="var(--d-text)">支付服务</text>

      <line x1="592" y1="90" x2="632" y2="90" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc4-arr)" />

      <rect x="636" y="74" width="100" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="686" y="95" text-anchor="middle" font-size="10" fill="var(--d-text)">通知服务</text>

      <text x="770" y="95" font-size="9" fill="var(--d-rv-c-text)" font-weight="600">总延迟 = 4次串行</text>

      <!-- Async path -->
      <text x="430" y="148" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-green)">异步调用（低延迟 · 解耦 · 削峰填谷）</text>

      <rect x="60" y="162" width="100" height="32" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="110" y="183" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">用户请求</text>

      <line x1="160" y1="178" x2="200" y2="178" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc4-arr)" />

      <rect x="204" y="162" width="100" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="254" y="183" text-anchor="middle" font-size="10" fill="var(--d-text)">订单服务</text>

      <line x1="304" y1="178" x2="360" y2="178" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc4-arr)" />
      <text x="332" y="170" text-anchor="middle" font-size="8" fill="var(--d-green)">发消息</text>

      <!-- MQ -->
      <rect x="364" y="158" width="140" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <text x="434" y="176" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">消息队列</text>
      <text x="434" y="191" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Kafka / RocketMQ</text>

      <!-- Return -->
      <path d="M254,162 L254,150 L110,150 L110,106" stroke="var(--d-green)" stroke-width="1.2" fill="none" marker-end="url(#hc4-arr)" />
      <text x="180" y="146" text-anchor="middle" font-size="8" fill="var(--d-green)">快速返回</text>

      <!-- Consumers -->
      <line x1="504" y1="168" x2="560" y2="168" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc4-arr)" />
      <line x1="504" y1="178" x2="560" y2="192" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc4-arr)" />
      <line x1="504" y1="188" x2="560" y2="216" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc4-arr)" />

      <rect x="564" y="154" width="100" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="614" y="173" text-anchor="middle" font-size="9" fill="var(--d-text)">库存消费者</text>

      <rect x="564" y="186" width="100" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="614" y="205" text-anchor="middle" font-size="9" fill="var(--d-text)">支付消费者</text>

      <rect x="564" y="218" width="100" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="614" y="237" text-anchor="middle" font-size="9" fill="var(--d-text)">通知消费者</text>

      <text x="710" y="205" font-size="9" fill="var(--d-green)" font-weight="600">按能力消费</text>

      <!-- Thread pool isolation -->
      <text x="430" y="278" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">线程池隔离 · 防止慢任务拖垮整体</text>

      <rect x="100" y="292" width="200" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="200" y="312" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">订单线程池</text>
      <text x="200" y="328" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">core=20 max=50 queue=200</text>

      <rect x="330" y="292" width="200" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="430" y="312" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">支付线程池</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">core=10 max=30 queue=100</text>

      <rect x="560" y="292" width="200" height="48" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="660" y="312" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">通知线程池</text>
      <text x="660" y="328" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">core=5 max=20 queue=500</text>

      <text x="430" y="356" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Hystrix / Resilience4j — 不同业务独立线程池，互不影响</text>
    </svg>
  </DiagramFrame>
</template>
