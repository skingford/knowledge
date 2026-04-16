<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 420"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="分布式事务与数据一致性"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc11-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">分布式事务 · 五种方案对比与本地消息表流程</text>

      <!-- CAP/BASE -->
      <rect x="260" y="44" width="340" height="28" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="430" y="63" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-b-text)">CAP 权衡：大多数业务选择 BASE（最终一致性）· 90% 场景不需要强一致</text>

      <!-- Five solutions comparison -->
      <!-- 2PC -->
      <rect x="30" y="86" width="150" height="90" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="55" y="94" width="100" height="20" rx="10" fill="var(--d-border)" />
      <text x="105" y="108" text-anchor="middle" font-size="9" font-weight="700" fill="var(--d-bg-alt)">2PC / XA</text>
      <text x="105" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">强一致 · 性能低</text>
      <text x="105" y="144" text-anchor="middle" font-size="9" fill="var(--d-text)">协调者单点</text>
      <text x="105" y="162" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">传统跨库事务</text>

      <!-- TCC -->
      <rect x="198" y="86" width="150" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="223" y="94" width="100" height="20" rx="10" fill="var(--d-rv-c-border)" />
      <text x="273" y="108" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">TCC</text>
      <text x="273" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">强一致 · 性能中</text>
      <text x="273" y="144" text-anchor="middle" font-size="9" fill="var(--d-text)">Try-Confirm-Cancel</text>
      <text x="273" y="162" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">资金交易</text>

      <!-- SAGA -->
      <rect x="366" y="86" width="150" height="90" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="391" y="94" width="100" height="20" rx="10" fill="var(--d-rv-a-border)" />
      <text x="441" y="108" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">SAGA</text>
      <text x="441" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">最终一致 · 性能高</text>
      <text x="441" y="144" text-anchor="middle" font-size="9" fill="var(--d-text)">补偿事务回滚</text>
      <text x="441" y="162" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">长事务 · 编排型</text>

      <!-- Local Message Table -->
      <rect x="534" y="86" width="150" height="90" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="549" y="94" width="120" height="20" rx="10" fill="var(--d-blue-border)" />
      <text x="609" y="108" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">本地消息表</text>
      <text x="609" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">最终一致 · 性能高</text>
      <text x="609" y="144" text-anchor="middle" font-size="9" fill="var(--d-text)">业务+消息同事务</text>
      <text x="609" y="162" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">跨服务异步通知</text>

      <!-- RocketMQ TX -->
      <rect x="702" y="86" width="150" height="90" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="717" y="94" width="120" height="20" rx="10" fill="var(--d-warn-border)" />
      <text x="777" y="108" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">事务消息</text>
      <text x="777" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">最终一致 · 性能高</text>
      <text x="777" y="144" text-anchor="middle" font-size="9" fill="var(--d-text)">RocketMQ 半消息</text>
      <text x="777" y="162" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">异步场景首选</text>

      <!-- Local Message Table flow (detailed) -->
      <text x="430" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue)">本地消息表 · 详细流程</text>

      <!-- Step 1 -->
      <rect x="40" y="224" width="160" height="50" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="120" y="244" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">本地事务</text>
      <text x="120" y="262" text-anchor="middle" font-size="8" fill="var(--d-text)">业务操作 + 写消息表</text>

      <line x1="200" y1="249" x2="240" y2="249" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc11-arr)" />
      <text x="220" y="240" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">同一事务</text>

      <!-- Step 2 -->
      <rect x="244" y="224" width="140" height="50" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="314" y="244" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">消息表</text>
      <text x="314" y="262" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">status=PENDING</text>

      <line x1="384" y1="249" x2="424" y2="249" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc11-arr)" />
      <text x="404" y="240" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">定时扫描</text>

      <!-- Step 3 -->
      <rect x="428" y="224" width="140" height="50" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="498" y="244" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">发送 MQ</text>
      <text x="498" y="262" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">成功后标记 SENT</text>

      <line x1="568" y1="249" x2="608" y2="249" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc11-arr)" />

      <!-- Step 4 -->
      <rect x="612" y="224" width="140" height="50" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="682" y="244" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">消费端</text>
      <text x="682" y="262" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">幂等消费 · 确认</text>

      <!-- Retry loop -->
      <path d="M498,274 L498,296 L314,296 L314,274" stroke="var(--d-rv-c-border)" stroke-width="1.2" fill="none" stroke-dasharray="5,3" marker-end="url(#hc11-arr)" />
      <text x="406" y="310" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">发送失败 → 重试（有上限）</text>

      <!-- TCC note -->
      <text x="430" y="344" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">TCC 注意事项</text>

      <rect x="80" y="358" width="320" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="240" y="378" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">空回滚</text>
      <text x="240" y="396" text-anchor="middle" font-size="9" fill="var(--d-text)">Cancel 在 Try 之前到达 → 需识别并跳过</text>

      <rect x="460" y="358" width="320" height="48" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="620" y="378" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">悬挂</text>
      <text x="620" y="396" text-anchor="middle" font-size="9" fill="var(--d-text)">Try 在 Cancel 之后到达 → 需拒绝执行</text>
    </svg>
  </DiagramFrame>
</template>
