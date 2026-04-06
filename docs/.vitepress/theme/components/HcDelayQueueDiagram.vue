<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="延迟队列与定时任务"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc24-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">延迟队列与定时任务</text>

      <!-- Redis ZSet flow -->
      <text x="430" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Redis ZSet 延迟队列流程</text>

      <rect x="40" y="70" width="140" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="110" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">业务触发</text>
      <text x="110" y="102" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">订单创建</text>

      <line x1="180" y1="90" x2="220" y2="90" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc24-arr)" />

      <rect x="224" y="70" width="180" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="314" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">ZADD delay_queue</text>
      <text x="314" y="102" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">score = 执行时间戳</text>

      <line x1="404" y1="90" x2="444" y2="90" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc24-arr)" />
      <text x="424" y="82" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">30 分钟后</text>

      <rect x="448" y="70" width="180" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="538" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">ZRANGEBYSCORE</text>
      <text x="538" y="102" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">轮询取到期任务</text>

      <line x1="628" y1="90" x2="668" y2="90" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc24-arr)" />

      <rect x="672" y="70" width="160" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="752" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-b-text)">执行取消逻辑</text>
      <text x="752" y="102" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Lua 原子取出+删除</text>

      <!-- Four solutions comparison -->
      <text x="430" y="140" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">四种延迟方案对比</text>

      <rect x="30" y="154" width="190" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="125" y="174" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">Redis ZSet</text>
      <text x="125" y="192" text-anchor="middle" font-size="9" fill="var(--d-text)">秒级精度 · 吞吐高</text>
      <text x="125" y="208" text-anchor="middle" font-size="9" fill="var(--d-text)">需自行保障可靠性</text>
      <text x="125" y="226" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">轻量延迟任务</text>

      <rect x="240" y="154" width="190" height="80" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="335" y="174" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">RocketMQ 延迟消息</text>
      <text x="335" y="192" text-anchor="middle" font-size="9" fill="var(--d-text)">固定级别 · 可靠性高</text>
      <text x="335" y="208" text-anchor="middle" font-size="9" fill="var(--d-text)">与 MQ 生态集成</text>
      <text x="335" y="226" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">MQ 技术栈首选</text>

      <rect x="450" y="154" width="190" height="80" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="545" y="174" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">RabbitMQ DLX</text>
      <text x="545" y="192" text-anchor="middle" font-size="9" fill="var(--d-text)">消息级精度 · 可靠</text>
      <text x="545" y="208" text-anchor="middle" font-size="9" fill="var(--d-text)">死信队列机制</text>
      <text x="545" y="226" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">RabbitMQ 技术栈</text>

      <rect x="660" y="154" width="190" height="80" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="755" y="174" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">时间轮</text>
      <text x="755" y="192" text-anchor="middle" font-size="9" fill="var(--d-text)">毫秒级 · 极高吞吐</text>
      <text x="755" y="208" text-anchor="middle" font-size="9" fill="var(--d-text)">内存级 · 进程内定时器</text>
      <text x="755" y="226" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">Netty / Kafka 内部</text>

      <!-- Scheduler frameworks -->
      <rect x="140" y="250" width="580" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="430" y="266" text-anchor="middle" font-size="9" fill="var(--d-text)">分布式调度框架：XXL-JOB（轻量 Web 控制台）· Elastic-Job（ZK 弹性扩缩）· PowerJob（DAG 工作流）</text>
    </svg>
  </DiagramFrame>
</template>
