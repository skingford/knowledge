<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'topic-goals-map'
  | 'case-study-bridge'
  | 'core-concepts'
  | 'partition-routing'
  | 'consumer-group-rebalance'
  | 'replication-hw'
  | 'payment-practice'
  | 'outbox-flow'
  | 'offset-transaction'
  | 'reliability-chain'
  | 'retry-dlq'
  | 'rollback-window'
  | 'delay-queue-patterns'
  | 'multi-active-dr'
  | 'interview-backlog-playbook'
  | 'interview-lost-vs-duplicate'
  | 'interview-idempotency-vs-transaction'
  | 'interview-questions'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '860px',
  'topic-goals-map': '860px',
  'case-study-bridge': '860px',
  'core-concepts': '860px',
  'partition-routing': '860px',
  'consumer-group-rebalance': '860px',
  'replication-hw': '860px',
  'payment-practice': '860px',
  'outbox-flow': '860px',
  'offset-transaction': '860px',
  'reliability-chain': '860px',
  'retry-dlq': '860px',
  'rollback-window': '860px',
  'delay-queue-patterns': '860px',
  'multi-active-dr': '860px',
  'interview-backlog-playbook': '860px',
  'interview-lost-vs-duplicate': '860px',
  'interview-idempotency-vs-transaction': '860px',
  'interview-questions': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 专题总览图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-overview" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Kafka 学习主线不是背概念，而是围绕“不丢、不乱、不堵”把消息模型、业务闭环和面试表达串起来
      </text>

      <rect x="28" y="70" width="240" height="180" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="148" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">核心概念</text>
      <text x="148" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Producer / Consumer / Broker</text>
      <text x="148" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Topic / Partition / Offset</text>
      <text x="148" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Consumer Group / Rebalance</text>
      <text x="148" y="178" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">ISR / ACK / 高性能原理</text>
      <rect x="68" y="198" width="160" height="34" rx="17" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="148" y="220" text-anchor="middle" font-size="10" fill="var(--d-text)">先把消息系统的骨架搭起来</text>

      <rect x="310" y="54" width="240" height="212" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">支付实战</text>
      <text x="430" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">TCC + Kafka / 本地消息表</text>
      <text x="430" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Offset 补偿 / 幂等 / 对账</text>
      <text x="430" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Retry Topic / DLQ / 延迟队列</text>
      <text x="430" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Backpressure / Rebalance / 多活</text>
      <rect x="350" y="186" width="160" height="46" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="430" y="205" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">业务主线</text>
      <text x="430" y="221" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">把 MQ 答到支付闭环里</text>

      <rect x="592" y="70" width="240" height="180" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="712" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">深入追问与词汇</text>
      <text x="712" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">消息不丢失 / 顺序性</text>
      <text x="712" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">积压治理 / 重试与死信</text>
      <text x="712" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">幂等性 / 事务 / 英语术语</text>
      <rect x="632" y="198" width="160" height="34" rx="17" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="712" y="220" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">最后把表达压缩成口径</text>

      <line x1="268" y1="160" x2="310" y2="160" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-overview)" />
      <line x1="550" y1="160" x2="592" y2="160" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-overview)" />

      <rect x="332" y="272" width="196" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2" />
      <text x="430" y="291" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">阅读顺序：概念建模 → 业务落地 → 高频追问</text>
    </svg>

    <svg
      v-else-if="kind === 'topic-goals-map'"
      viewBox="0 0 860 330"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 专题三条主线图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-goals" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Kafka 专题首页其实就在帮你搭三条主线：不丢、不乱、不堵，每条主线都能回到具体章节去展开
      </text>

      <rect x="34" y="76" width="246" height="170" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="157" y="104" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-c-text)">不丢</text>
      <text x="157" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">ACK / ISR / HW</text>
      <text x="157" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">手动提交 offset</text>
      <text x="157" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">幂等、补偿、对账</text>
      <rect x="74" y="188" width="166" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="157" y="210" text-anchor="middle" font-size="10" fill="var(--d-text)">优先看：核心概念 + 支付实战</text>

      <rect x="307" y="76" width="246" height="170" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="104" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">不乱</text>
      <text x="430" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Partition Key</text>
      <text x="430" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">同单局部有序</text>
      <text x="430" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">状态机 + TCC 防乱序</text>
      <rect x="347" y="188" width="166" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="210" text-anchor="middle" font-size="10" fill="var(--d-text)">优先看：核心概念 + 追问页</text>

      <rect x="580" y="76" width="246" height="170" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="703" y="104" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-a-text)">不堵</text>
      <text x="703" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">积压治理</text>
      <text x="703" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Rebalance 优化</text>
      <text x="703" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Backpressure / Retry Topic</text>
      <rect x="620" y="188" width="166" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="703" y="210" text-anchor="middle" font-size="10" fill="var(--d-text)">优先看：支付实战 + 追问页</text>

      <rect x="164" y="276" width="532" height="28" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="295" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        推荐读法：先用核心概念搭骨架，再用支付实战补闭环，最后把追问页压缩成答题口径
      </text>
    </svg>

    <svg
      v-else-if="kind === 'case-study-bridge'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="支付系统 Kafka 章节桥接图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-case-bridge" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        支付系统里的 Kafka 问题，往往都能收敛成三类：基础模型、业务闭环、面试追问
      </text>

      <rect x="34" y="74" width="212" height="176" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="140" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">支付系统里的典型问题</text>
      <text x="140" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">异步通知怎么不丢？</text>
      <text x="140" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">同一订单怎么保证顺序？</text>
      <text x="140" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">积压和重试怎么治理？</text>
      <text x="140" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">补偿和对账放在哪里？</text>
      <rect x="66" y="206" width="148" height="28" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="140" y="224" text-anchor="middle" font-size="9" fill="var(--d-text)">先从业务问题出发</text>

      <line x1="246" y1="162" x2="324" y2="162" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-case-bridge)" />

      <rect x="324" y="60" width="212" height="204" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="88" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Kafka 在支付中的角色</text>
      <text x="430" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">消息缓冲层</text>
      <text x="430" y="134" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">异步补偿驱动器</text>
      <text x="430" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">顺序与位点管理器</text>
      <text x="430" y="170" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">重试 / 死信 / 延迟编排器</text>
      <rect x="360" y="192" width="140" height="44" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="430" y="210" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">别只把 Kafka 当队列</text>
      <text x="430" y="226" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">要把它放进业务闭环</text>

      <line x1="536" y1="110" x2="610" y2="98" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#kafka-arrow-case-bridge)" />
      <line x1="536" y1="162" x2="610" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#kafka-arrow-case-bridge)" />
      <line x1="536" y1="214" x2="610" y2="226" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#kafka-arrow-case-bridge)" />

      <rect x="610" y="64" width="216" height="56" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="718" y="86" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">核心概念</text>
      <text x="718" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Producer / Partition / Group / ISR</text>

      <rect x="610" y="134" width="216" height="56" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="718" y="156" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">支付实战</text>
      <text x="718" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Outbox / Offset / Retry / Rebalance</text>

      <rect x="610" y="204" width="216" height="56" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="718" y="226" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">深入追问与词汇</text>
      <text x="718" y="244" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不丢 / 不乱 / 不堵的答题模板</text>
    </svg>

    <svg
      v-else-if="kind === 'core-concepts'"
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 核心概念关系图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-core" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="24" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        核心概念要一口气讲清四件事：谁在写、数据怎么分、谁在读、为什么不容易丢
      </text>

      <rect x="28" y="104" width="120" height="92" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="88" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Producer</text>
      <text x="88" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按 key 路由</text>
      <text x="88" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">写入 Leader</text>

      <line x1="148" y1="150" x2="226" y2="150" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-core)" />

      <rect x="226" y="64" width="256" height="172" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="354" y="92" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Topic: payment-events</text>
      <rect x="252" y="112" width="60" height="92" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="282" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">P0</text>
      <text x="282" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 41</text>
      <text x="282" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 42</text>
      <text x="282" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 43</text>
      <rect x="324" y="112" width="60" height="92" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="354" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">P1</text>
      <text x="354" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 18</text>
      <text x="354" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 19</text>
      <text x="354" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 20</text>
      <rect x="396" y="112" width="60" height="92" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="426" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">P2</text>
      <text x="426" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 77</text>
      <text x="426" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 78</text>
      <text x="426" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">offset 79</text>

      <rect x="520" y="52" width="146" height="92" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="593" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Broker / Replica</text>
      <text x="593" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Leader 处理读写</text>
      <text x="593" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Follower 进入 ISR</text>
      <line x1="482" y1="118" x2="520" y2="98" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-core)" />

      <rect x="520" y="158" width="146" height="94" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="593" y="184" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">ACK / HW</text>
      <text x="593" y="204" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">acks=all</text>
      <text x="593" y="222" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">消费者最多读到 HW</text>
      <text x="593" y="240" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">防止读到未同步数据</text>
      <line x1="482" y1="184" x2="520" y2="206" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-core)" />

      <line x1="666" y1="150" x2="742" y2="150" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-core)" />

      <rect x="742" y="92" width="92" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="788" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Consumer A</text>
      <text x="788" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">P0 / P2</text>
      <rect x="742" y="160" width="92" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="788" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Consumer B</text>
      <text x="788" y="198" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">P1</text>
      <text x="788" y="244" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">同组内一个分区只给一个实例</text>

      <rect x="72" y="264" width="716" height="40" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="289" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        面试回答顺序：Producer 路由到 Partition，Consumer Group 按分区并发消费，副本 + ISR + ACK 解释可靠性，HW 解释可见性边界
      </text>
    </svg>

    <svg
      v-else-if="kind === 'partition-routing'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 分区路由与顺序示意图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-routing" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        只要路由 key 稳定，同一个订单就会持续落到同一 Partition，顺序也就跟着被锁在这个分区里
      </text>

      <rect x="34" y="88" width="176" height="132" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="122" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Producer</text>
      <text x="122" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务 key = order_9527</text>
      <rect x="62" y="154" width="120" height="18" rx="9" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="122" y="167" text-anchor="middle" font-size="9" fill="var(--d-text)">支付创建 #1</text>
      <rect x="62" y="178" width="120" height="18" rx="9" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="122" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">支付确认 #2</text>
      <rect x="62" y="202" width="120" height="18" rx="9" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="122" y="215" text-anchor="middle" font-size="9" fill="var(--d-text)">退款回调 #3</text>

      <rect x="252" y="132" width="110" height="44" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="307" y="150" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">分区器</text>
      <text x="307" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">hash(order_id)</text>

      <line x1="210" y1="154" x2="252" y2="154" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-routing)" />
      <line x1="362" y1="154" x2="408" y2="154" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-routing)" />

      <rect x="408" y="64" width="234" height="178" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="525" y="92" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Topic: payment-events</text>

      <rect x="434" y="114" width="56" height="100" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="462" y="136" text-anchor="middle" font-size="10" fill="var(--d-text)">P0</text>
      <text x="462" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">order_1001</text>
      <text x="462" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">order_2038</text>

      <rect x="497" y="106" width="56" height="116" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="525" y="128" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">P1</text>
      <text x="525" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">offset 120</text>
      <text x="525" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">9527 #1</text>
      <text x="525" y="184" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">offset 121</text>
      <text x="525" y="200" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">9527 #2</text>
      <text x="525" y="218" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">9527 #3</text>

      <rect x="560" y="114" width="56" height="100" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="588" y="136" text-anchor="middle" font-size="10" fill="var(--d-text)">P2</text>
      <text x="588" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">order_8765</text>
      <text x="588" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">order_8888</text>

      <rect x="680" y="88" width="146" height="132" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="753" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">Consumer Group</text>
      <rect x="704" y="138" width="98" height="28" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="753" y="156" text-anchor="middle" font-size="9" fill="var(--d-text)">Worker A ← P1</text>
      <rect x="704" y="176" width="98" height="28" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="753" y="194" text-anchor="middle" font-size="9" fill="var(--d-text)">Worker B ← P0 / P2</text>
      <text x="753" y="218" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">顺序边界 = Partition</text>

      <line x1="553" y1="164" x2="680" y2="152" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-routing)" />

      <rect x="78" y="252" width="704" height="28" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="271" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        结论：同 key → 同 partition → 分区内有序；不同 key 才能真正并行扩展
      </text>
    </svg>

    <svg
      v-else-if="kind === 'consumer-group-rebalance'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka Consumer Group Rebalance 示意图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-rebalance" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Rebalance 的本质是“分区重新分配”，它不是免费扩容，而是一段会让消费暂停的重组过程
      </text>

      <rect x="28" y="58" width="332" height="214" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="194" y="84" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">变更前</text>
      <text x="194" y="102" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">2 个消费者处理 4 个分区</text>
      <rect x="58" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <rect x="124" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <rect x="190" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <rect x="256" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="84" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P0</text>
      <text x="150" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P1</text>
      <text x="216" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P2</text>
      <text x="282" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P3</text>
      <rect x="84" y="208" width="88" height="36" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="216" y="208" width="88" height="36" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="128" y="230" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Consumer C1</text>
      <text x="260" y="230" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Consumer C2</text>
      <line x1="84" y1="152" x2="128" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="150" y1="152" x2="128" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="216" y1="152" x2="260" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="282" y1="152" x2="260" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />

      <rect x="384" y="102" width="92" height="126" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="430" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">触发源</text>
      <text x="430" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">实例加入 / 离开</text>
      <text x="430" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">心跳超时</text>
      <text x="430" y="186" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">扩分区</text>
      <text x="430" y="210" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">短暂暂停消费</text>
      <line x1="360" y1="166" x2="384" y2="166" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-rebalance)" />
      <line x1="476" y1="166" x2="500" y2="166" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-rebalance)" />

      <rect x="500" y="58" width="332" height="214" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="666" y="84" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">实例变更后</text>
      <text x="666" y="102" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">新增 C3，分区重新分配</text>
      <rect x="530" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <rect x="596" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <rect x="662" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <rect x="728" y="122" width="52" height="30" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="556" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P0</text>
      <text x="622" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P1</text>
      <text x="688" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P2</text>
      <text x="754" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">P3</text>
      <rect x="520" y="208" width="78" height="36" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="627" y="208" width="78" height="36" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="734" y="208" width="78" height="36" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="559" y="230" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">C1</text>
      <text x="666" y="230" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">C2</text>
      <text x="773" y="230" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">C3</text>
      <line x1="556" y1="152" x2="559" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="622" y1="152" x2="666" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="688" y1="152" x2="773" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" />
      <line x1="754" y1="152" x2="559" y2="208" stroke="var(--d-arrow-light)" stroke-width="1.5" stroke-dasharray="5 4" />

      <rect x="116" y="284" width="628" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="301" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        优化抓手：Static Membership 减少重建，Incremental Cooperative Rebalancing 缩小迁移范围
      </text>
    </svg>

    <svg
      v-else-if="kind === 'replication-hw'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 副本同步与 HW 推进示意图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-hw" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        新消息先写到 Leader，只有 ISR 全部跟上，HW 才前移，Producer 才能拿到更可靠的确认
      </text>

      <rect x="28" y="102" width="122" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="89" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Producer</text>
      <text x="89" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">发送消息 M108</text>
      <text x="89" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">等待 ACK</text>

      <line x1="150" y1="143" x2="220" y2="143" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-hw)" />

      <rect x="220" y="68" width="212" height="150" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="326" y="94" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Leader Partition</text>
      <rect x="246" y="114" width="160" height="24" rx="8" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="326" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">LEO = 108（最新消息已写入）</text>
      <rect x="246" y="146" width="160" height="24" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="326" y="162" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">当前 HW = 107（尚未全部确认）</text>
      <text x="326" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Leader 先接收，随后把 M108 复制给 ISR</text>

      <line x1="432" y1="112" x2="518" y2="92" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-hw)" />
      <line x1="432" y1="174" x2="518" y2="194" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-hw)" />

      <rect x="518" y="56" width="140" height="78" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="588" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Follower A</text>
      <text x="588" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">同步到 108</text>
      <text x="588" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">仍在 ISR</text>

      <rect x="518" y="168" width="140" height="78" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="588" y="194" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Follower B</text>
      <text x="588" y="214" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">同步到 108</text>
      <text x="588" y="230" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">参与确认</text>

      <rect x="688" y="70" width="140" height="54" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="758" y="91" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">ISR 全部到 108</text>
      <text x="758" y="108" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">HW 前移到 108</text>

      <line x1="658" y1="95" x2="688" y2="97" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-hw)" />
      <line x1="658" y1="206" x2="688" y2="112" stroke="var(--d-arrow-light)" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#kafka-arrow-hw)" />

      <rect x="688" y="148" width="140" height="52" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="758" y="169" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-a-text)">Producer 得到 ACK</text>
      <text x="758" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Consumer 才能稳定读到 108</text>

      <rect x="176" y="252" width="508" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="269" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        `acks=all` 解释的是确认时机，HW 解释的是消费者可见边界，这两个概念最好一起讲
      </text>
    </svg>

    <svg
      v-else-if="kind === 'payment-practice'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 支付实战闭环图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-payment" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="24" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        支付场景里 Kafka 不是单独存在，它要和事务日志、幂等、补偿、重试和对账一起组成一个闭环
      </text>

      <rect x="28" y="82" width="126" height="88" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="91" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">支付服务</text>
      <text x="91" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Try / 扣款</text>
      <text x="91" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">写业务表</text>

      <rect x="192" y="68" width="156" height="116" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="270" y="94" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">本地事务区</text>
      <text x="270" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">业务数据 + outbox</text>
      <text x="270" y="134" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">status = PENDING</text>
      <text x="270" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">事务提交后再投递</text>

      <rect x="388" y="82" width="132" height="88" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="454" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Kafka Topic</text>
      <text x="454" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">confirm / cancel</text>
      <text x="454" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">重试与积压缓冲</text>

      <rect x="560" y="68" width="150" height="116" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="635" y="94" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">Consumer</text>
      <text x="635" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">幂等校验</text>
      <text x="635" y="134" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">业务执行</text>
      <text x="635" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">成功后提交 offset</text>

      <rect x="748" y="82" width="84" height="88" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="790" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">结果</text>
      <text x="790" y="128" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Confirm</text>
      <text x="790" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Cancel</text>

      <line x1="154" y1="126" x2="192" y2="126" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-payment)" />
      <line x1="348" y1="126" x2="388" y2="126" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-payment)" />
      <line x1="520" y1="126" x2="560" y2="126" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-payment)" />
      <line x1="710" y1="126" x2="748" y2="126" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-payment)" />

      <rect x="88" y="232" width="184" height="80" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="180" y="258" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">补偿与对账</text>
      <text x="180" y="278" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">长时间 TRYING 扫描</text>
      <text x="180" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">补发消息或直接补偿</text>

      <rect x="338" y="232" width="184" height="80" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="430" y="258" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Offset 管理</text>
      <text x="430" y="278" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">业务结果和 offset 一起落库</text>
      <text x="430" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">重启后 seek 到可信位点</text>

      <rect x="588" y="232" width="184" height="80" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="680" y="258" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">重试与死信</text>
      <text x="680" y="278" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Retry Topic 退避重试</text>
      <text x="680" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">超过阈值进入 DLQ 告警</text>

      <line x1="635" y1="184" x2="430" y2="232" stroke="var(--d-arrow-light)" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#kafka-arrow-payment)" />
      <line x1="635" y1="184" x2="680" y2="232" stroke="var(--d-arrow-light)" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#kafka-arrow-payment)" />
      <line x1="790" y1="170" x2="180" y2="232" stroke="var(--d-arrow-light)" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#kafka-arrow-payment)" />
    </svg>

    <svg
      v-else-if="kind === 'outbox-flow'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 本地消息表 Outbox 流程图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-outbox" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        本地消息表要解决的核心不是“怎么发消息”，而是“业务成功”和“待发消息入库”必须一起成功
      </text>

      <rect x="34" y="78" width="272" height="156" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="170" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">数据库事务边界</text>
      <rect x="58" y="126" width="98" height="74" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="107" y="148" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">业务表</text>
      <text x="107" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">冻结余额</text>
      <text x="107" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">订单改 TRYING</text>
      <rect x="180" y="126" width="102" height="74" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="231" y="148" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">outbox 表</text>
      <text x="231" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">topic = PAY_CONFIRM</text>
      <text x="231" y="182" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">status = PENDING</text>
      <text x="170" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">业务操作 + 写待发消息，必须原子提交</text>

      <line x1="306" y1="156" x2="386" y2="156" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-outbox)" />

      <rect x="386" y="118" width="120" height="76" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="446" y="142" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">投递任务</text>
      <text x="446" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">扫描 PENDING</text>
      <text x="446" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">失败可重试</text>

      <line x1="506" y1="156" x2="586" y2="156" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-outbox)" />

      <rect x="586" y="118" width="110" height="76" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="641" y="142" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">Kafka Topic</text>
      <text x="641" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">异步缓冲</text>
      <text x="641" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">削峰 / 重试</text>

      <line x1="696" y1="156" x2="780" y2="156" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-outbox)" />

      <rect x="724" y="88" width="108" height="64" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="778" y="111" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">Consumer</text>
      <text x="778" y="129" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">执行 Confirm</text>
      <text x="778" y="143" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或 Cancel</text>

      <rect x="724" y="168" width="108" height="64" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.4" />
      <text x="778" y="191" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-cur-text)">状态回写</text>
      <text x="778" y="209" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">SENT / CONFIRMED</text>
      <text x="778" y="223" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">对账补尾</text>

      <rect x="86" y="264" width="688" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="281" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        重点口径：数据库事务解决“要不要发”，Kafka 负责“怎么可靠地异步发出去”
      </text>
    </svg>

    <svg
      v-else-if="kind === 'offset-transaction'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka Offset 与业务事务绑定示意图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-offset" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        想把消费语义尽量逼近 Exactly-Once，关键不是魔法配置，而是把业务结果和 offset 绑进同一个事务
      </text>

      <rect x="34" y="116" width="126" height="72" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="97" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Consumer</text>
      <text x="97" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">poll 到消息</text>
      <text x="97" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">topic / partition / offset</text>

      <line x1="160" y1="152" x2="226" y2="152" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-offset)" />

      <rect x="226" y="76" width="284" height="154" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="368" y="102" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">数据库事务</text>
      <rect x="252" y="128" width="112" height="74" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="308" y="150" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">业务表</text>
      <text x="308" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">扣款 / 入账</text>
      <text x="308" y="184" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">状态机流转</text>
      <rect x="382" y="128" width="102" height="74" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="433" y="150" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">offset_manager</text>
      <text x="433" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">payment-events</text>
      <text x="433" y="184" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">P1 / 128</text>
      <text x="368" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">业务结果 + offset，要么一起提交，要么一起回滚</text>

      <line x1="510" y1="152" x2="588" y2="152" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-offset)" />

      <rect x="588" y="96" width="120" height="56" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="648" y="118" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-a-text)">事务提交成功</text>
      <text x="648" y="135" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">随后再 commit offset</text>

      <rect x="588" y="168" width="240" height="74" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="708" y="192" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">重启恢复</text>
      <text x="708" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">读取 offset_manager 中的可信位点</text>
      <text x="708" y="226" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">使用 `consumer.seek()` 回到正确位置</text>

      <line x1="648" y1="152" x2="708" y2="168" stroke="var(--d-arrow-light)" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#kafka-arrow-offset)" />

      <rect x="148" y="272" width="564" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="289" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        真正稳定的“补偿位点”通常不在 Kafka 自己，而在你能和业务结果一起提交的那份外部状态里
      </text>
    </svg>

    <svg
      v-else-if="kind === 'reliability-chain'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 全链路可靠性示意图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-reliability" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        “消息不丢”必须拆成四层：Producer 送达、Broker 持久、Consumer 处理、业务幂等兜底
      </text>

      <rect x="34" y="86" width="174" height="154" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="121" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Producer</text>
      <text x="121" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`acks=all`</text>
      <text x="121" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`retries` 足够大</text>
      <text x="121" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Callback 检查结果</text>
      <text x="121" y="190" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">失败进入补偿队列</text>

      <line x1="208" y1="163" x2="258" y2="163" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-reliability)" />

      <rect x="258" y="86" width="174" height="154" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="345" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Broker</text>
      <text x="345" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`replication.factor >= 3`</text>
      <text x="345" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`min.insync.replicas >= 2`</text>
      <text x="345" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">禁用脏 Leader 选举</text>
      <text x="345" y="190" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">拒绝不安全写入</text>

      <line x1="432" y1="163" x2="482" y2="163" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-reliability)" />

      <rect x="482" y="86" width="174" height="154" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="569" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">Consumer</text>
      <text x="569" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">`enable.auto.commit=false`</text>
      <text x="569" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">业务成功后再提交 offset</text>
      <text x="569" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">失败不提交，允许重试</text>
      <text x="569" y="190" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">至少一次优先</text>

      <line x1="656" y1="163" x2="706" y2="163" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-reliability)" />

      <rect x="706" y="86" width="120" height="154" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="766" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">业务兜底</text>
      <text x="766" y="136" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">唯一索引</text>
      <text x="766" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">状态机校验</text>
      <text x="766" y="172" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">幂等更新</text>
      <text x="766" y="190" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">对账补偿</text>

      <rect x="142" y="266" width="576" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="283" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        Kafka 负责“尽量不丢”，真正挡住重复扣款和资损的最后一道墙仍然是业务幂等和对账
      </text>
    </svg>

    <svg
      v-else-if="kind === 'retry-dlq'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka Retry Topic 与 DLQ 示意图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-retry" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Retry Topic 不是为了无限重试，而是为了把瞬时故障、恢复窗口和最终人工介入切成几层处理
      </text>

      <rect x="36" y="116" width="116" height="62" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="94" y="140" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">主 Topic</text>
      <text x="94" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">payment-events</text>

      <line x1="152" y1="147" x2="220" y2="147" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-retry)" />

      <rect x="220" y="102" width="126" height="90" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="283" y="128" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Consumer</text>
      <text x="283" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">处理业务</text>
      <text x="283" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">失败则不提交 offset</text>

      <line x1="346" y1="147" x2="420" y2="147" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-retry)" />

      <rect x="420" y="88" width="88" height="58" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="464" y="111" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">retry-1s</text>
      <text x="464" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">快速兜瞬时抖动</text>

      <rect x="542" y="88" width="88" height="58" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="586" y="111" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">retry-10s</text>
      <text x="586" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等待短恢复窗口</text>

      <rect x="664" y="88" width="88" height="58" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="708" y="111" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">retry-60s</text>
      <text x="708" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等待长恢复窗口</text>

      <line x1="508" y1="117" x2="542" y2="117" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-retry)" />
      <line x1="630" y1="117" x2="664" y2="117" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-retry)" />
      <line x1="752" y1="117" x2="808" y2="117" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-retry)" />

      <rect x="764" y="170" width="84" height="62" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="806" y="193" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">DLQ</text>
      <text x="806" y="211" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">人工 / 定时任务</text>
      <text x="806" y="227" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">告警介入</text>

      <line x1="708" y1="146" x2="806" y2="170" stroke="var(--d-arrow-light)" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#kafka-arrow-retry)" />

      <rect x="430" y="208" width="250" height="52" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="555" y="229" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-a-text)">任一层重试成功</text>
      <text x="555" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">执行业务并提交 offset，消息闭环结束</text>

      <line x1="464" y1="146" x2="486" y2="208" stroke="var(--d-arrow-light)" stroke-width="1.5" stroke-dasharray="5 4" />
      <line x1="586" y1="146" x2="560" y2="208" stroke="var(--d-arrow-light)" stroke-width="1.5" stroke-dasharray="5 4" />
      <line x1="708" y1="146" x2="634" y2="208" stroke="var(--d-arrow-light)" stroke-width="1.5" stroke-dasharray="5 4" />

      <rect x="128" y="276" width="604" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="293" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        最佳实践通常是“有限重试 + 退避 + DLQ + 告警”，而不是让同一条消息无限自旋
      </text>
    </svg>

    <svg
      v-else-if="kind === 'rollback-window'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 已确认但新 Leader 看不到的窗口图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-rollback" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        “已确认但新 Leader 看不到”发生在 ACK 返回和 HW 全量传播之间的那段极短窗口里，本质是切主时的日志截断
      </text>

      <line x1="110" y1="78" x2="770" y2="78" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="770" y="68" text-anchor="end" font-size="10" fill="var(--d-text-sub)">时间 →</text>

      <rect x="132" y="104" width="126" height="34" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="195" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">1. Producer 收到 `acks=all`</text>

      <rect x="310" y="104" width="146" height="34" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="383" y="126" text-anchor="middle" font-size="10" fill="var(--d-text)">2. Leader 正准备传播新 HW</text>

      <rect x="510" y="96" width="98" height="50" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="559" y="118" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">3. Leader 宕机</text>
      <text x="559" y="134" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">窗口暴露</text>

      <rect x="648" y="104" width="126" height="34" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="711" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">4. 新 Leader LEO 更低</text>

      <line x1="258" y1="121" x2="310" y2="121" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-rollback)" />
      <line x1="456" y1="121" x2="510" y2="121" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-rollback)" />
      <line x1="608" y1="121" x2="648" y2="121" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-rollback)" />

      <rect x="98" y="180" width="296" height="90" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="246" y="206" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">旧 Leader 视角</text>
      <text x="246" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">LEO = 108</text>
      <text x="246" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Producer 已拿到 ACK</text>
      <text x="246" y="264" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">但 HW 传播还没完成</text>

      <rect x="466" y="180" width="296" height="90" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="614" y="206" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">新 Leader 视角</text>
      <text x="614" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">LEO = 107</text>
      <text x="614" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">消息 108 被截断</text>
      <text x="614" y="264" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">需要靠事务日志 / 补偿表闭环</text>
    </svg>

    <svg
      v-else-if="kind === 'delay-queue-patterns'"
      viewBox="0 0 860 330"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 延迟队列实现对比图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-delay" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        延迟队列常见有两条路：多级 Retry Topic 更稳，时间轮更灵活，选型看延迟精度和恢复复杂度
      </text>

      <rect x="38" y="78" width="360" height="188" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="218" y="106" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">方案 A：多级 Retry Topic</text>
      <rect x="70" y="136" width="78" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <rect x="176" y="136" width="78" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <rect x="282" y="136" width="78" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="109" y="158" text-anchor="middle" font-size="10" fill="var(--d-text)">retry-1s</text>
      <text x="215" y="158" text-anchor="middle" font-size="10" fill="var(--d-text)">retry-10s</text>
      <text x="321" y="158" text-anchor="middle" font-size="10" fill="var(--d-text)">retry-60s</text>
      <line x1="148" y1="153" x2="176" y2="153" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#kafka-arrow-delay)" />
      <line x1="254" y1="153" x2="282" y2="153" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#kafka-arrow-delay)" />
      <text x="218" y="198" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：模型简单、恢复天然依赖 Kafka</text>
      <text x="218" y="216" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">缺点：Topic 多，延迟粒度不够细</text>
      <text x="218" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：重试退避、通知延迟、恢复窗口管理</text>

      <rect x="462" y="78" width="360" height="188" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="642" y="106" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-a-text)">方案 B：时间轮</text>
      <rect x="608" y="136" width="68" height="68" rx="34" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <circle cx="642" cy="170" r="18" fill="none" stroke="var(--d-rv-a-border)" stroke-width="2" stroke-dasharray="3 3" />
      <line x1="642" y1="170" x2="642" y2="144" stroke="var(--d-rv-a-border)" stroke-width="2" />
      <line x1="642" y1="170" x2="660" y2="180" stroke="var(--d-rv-a-border)" stroke-width="2" />
      <text x="642" y="222" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">进程内到期触发</text>
      <text x="642" y="240" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">精度高，流程灵活</text>
      <text x="642" y="258" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">但重启恢复更复杂</text>

      <rect x="166" y="288" width="528" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="305" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        经验上：延迟精度要求一般时优先 Retry Topic；精确到秒且链路短时再考虑时间轮
      </text>
    </svg>

    <svg
      v-else-if="kind === 'multi-active-dr'"
      viewBox="0 0 860 330"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 灾备与多活图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-dr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        灾备切换时最容易踩坑的不是“消息有没有复制过去”，而是“新集群里 offset 已经不再是旧语义了”
      </text>

      <rect x="44" y="84" width="276" height="178" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="182" y="112" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">Active-Passive</text>
      <rect x="82" y="140" width="84" height="42" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <rect x="198" y="140" width="84" height="42" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="166" text-anchor="middle" font-size="10" fill="var(--d-text)">主集群</text>
      <text x="240" y="166" text-anchor="middle" font-size="10" fill="var(--d-text)">备集群</text>
      <line x1="166" y1="161" x2="198" y2="161" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-dr)" />
      <text x="182" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">主写入，从集群热备</text>
      <text x="182" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">切换逻辑简单</text>
      <text x="182" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合金融核心链路</text>

      <rect x="394" y="84" width="276" height="178" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="532" y="112" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-a-text)">Active-Active</text>
      <rect x="432" y="140" width="84" height="42" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <rect x="548" y="140" width="84" height="42" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="474" y="166" text-anchor="middle" font-size="10" fill="var(--d-text)">集群 A</text>
      <text x="590" y="166" text-anchor="middle" font-size="10" fill="var(--d-text)">集群 B</text>
      <line x1="516" y1="148" x2="548" y2="148" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-dr)" />
      <line x1="548" y1="174" x2="516" y2="174" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#kafka-arrow-dr)" />
      <text x="532" y="196" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">双向写入更复杂</text>
      <text x="532" y="214" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">冲突、幂等、回放都更难</text>
      <text x="532" y="232" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">通常不作为首选</text>

      <rect x="706" y="102" width="118" height="144" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="765" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">切换锚点</text>
      <text x="765" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不要只信 offset</text>
      <text x="765" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">要靠业务 ID</text>
      <text x="765" y="186" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">时间戳 / Header</text>
      <text x="765" y="204" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">重新定位消费起点</text>

      <rect x="168" y="288" width="524" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="305" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        单集群靠 offset 管消费位点，跨集群切换更可信的锚点通常是业务 ID 和业务时间
      </text>
    </svg>

    <svg
      v-else-if="kind === 'interview-backlog-playbook'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 消息积压处理打法图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-backlog" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        回答“消息积压怎么办”最好分三层：先止血、再定位慢点、最后再做结构治理
      </text>

      <rect x="42" y="90" width="230" height="154" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="157" y="118" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">第一层：紧急止血</text>
      <text x="157" y="144" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">扩容 Consumer 到分区上限</text>
      <text x="157" y="162" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">临时降级非核心链路</text>
      <text x="157" y="180" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">避免应用线程先 OOM</text>
      <rect x="78" y="198" width="158" height="26" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="157" y="215" text-anchor="middle" font-size="9" fill="var(--d-text)">目标：先把积压斜率压平</text>

      <line x1="272" y1="167" x2="320" y2="167" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-backlog)" />

      <rect x="320" y="90" width="220" height="154" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="118" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">第二层：短期定位</text>
      <text x="430" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">找 DB 慢查询 / RPC 超时</text>
      <text x="430" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">定位热点 Partition</text>
      <text x="430" y="180" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">逐条改批量、减少同步等待</text>
      <rect x="350" y="198" width="160" height="26" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="215" text-anchor="middle" font-size="9" fill="var(--d-text)">目标：找出真正慢点</text>

      <line x1="540" y1="167" x2="588" y2="167" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-backlog)" />

      <rect x="588" y="90" width="230" height="154" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="703" y="118" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">第三层：长期治理</text>
      <text x="703" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">拆热点 Topic / 分组隔离</text>
      <text x="703" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">调整 key 打散热点</text>
      <text x="703" y="180" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">按优先级治理消费链路</text>
      <rect x="624" y="198" width="158" height="26" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="703" y="215" text-anchor="middle" font-size="9" fill="var(--d-text)">目标：减少下次再堵</text>

      <rect x="150" y="276" width="560" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="293" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        面试里别只说“扩容消费者”，要顺带补一句：超过分区数后再扩就没有收益了
      </text>
    </svg>

    <svg
      v-else-if="kind === 'interview-lost-vs-duplicate'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 消息丢失与重复消费对比图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        “消息丢失”和“重复消费”不是一回事：一个是没到达，一个是到了两次，治理手段也完全不同
      </text>

      <rect x="42" y="82" width="360" height="176" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="222" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-warn-text)">消息丢失</text>
      <text x="222" y="136" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">典型成因：`acks=1` 时 Leader 宕机</text>
      <text x="222" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">或先提交 offset，后执行业务失败</text>
      <rect x="92" y="176" width="260" height="32" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="222" y="196" text-anchor="middle" font-size="10" fill="var(--d-text)">治理：金融级配置 + 成功后再 commit offset</text>
      <text x="222" y="232" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">关键词：ACK、ISR、提交时机</text>

      <rect x="458" y="82" width="360" height="176" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="638" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-a-text)">重复消费</text>
      <text x="638" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">典型成因：业务已成功，但 commit offset 前宕机</text>
      <text x="638" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">重启后同一条消息再次被拉到</text>
      <rect x="508" y="176" width="260" height="32" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="638" y="196" text-anchor="middle" font-size="10" fill="var(--d-text)">治理：唯一索引 + 幂等更新 + 状态机校验</text>
      <text x="638" y="232" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">关键词：幂等、去重、合法流转</text>

      <rect x="256" y="276" width="348" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.3" />
      <text x="430" y="293" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        支付系统里更怕“重复扣款”，所以答到最后一定要回到业务幂等
      </text>
    </svg>

    <svg
      v-else-if="kind === 'interview-idempotency-vs-transaction'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 幂等性与事务区别图"
      role="img"
    >
      <defs>
        <marker id="kafka-arrow-compare" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        幂等性回答的是“别重复写”，事务回答的是“多条写入要么一起可见，要么一起不可见”
      </text>

      <rect x="52" y="84" width="318" height="174" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="211" y="112" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">幂等性</text>
      <text x="211" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">目标：Producer 重试时别重复写入</text>
      <text x="211" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">更偏单条消息 / 单分区语义</text>
      <rect x="106" y="178" width="210" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="211" y="199" text-anchor="middle" font-size="10" fill="var(--d-text)">关键词：sequence number / de-dup</text>
      <text x="211" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">典型表达：别把同一条消息写两次</text>

      <line x1="370" y1="170" x2="474" y2="170" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#kafka-arrow-compare)" />

      <rect x="474" y="84" width="334" height="174" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="641" y="112" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-a-text)">事务</text>
      <text x="641" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">目标：跨 Partition / Topic 的原子可见性</text>
      <text x="641" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">消费者配合 `read_committed` 才能生效</text>
      <rect x="532" y="178" width="218" height="34" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="641" y="199" text-anchor="middle" font-size="10" fill="var(--d-text)">关键词：all-or-nothing / atomic visibility</text>
      <text x="641" y="234" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">典型表达：多条消息要么都提交，要么都别被看到</text>

      <rect x="190" y="278" width="480" height="22" rx="11" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="293" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        最稳的答法：幂等先兜重复，事务再补原子性，它们不是互斥关系
      </text>
    </svg>

    <svg
      v-else-if="kind === 'interview-questions'"
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 深入追问答题框架图"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        高频追问本质上都能收敛到一个答题框架：先定目标，再按 Producer / Broker / Consumer / 业务兜底分层展开
      </text>

      <circle cx="430" cy="176" r="78" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="430" y="156" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Kafka 面试口径</text>
      <text x="430" y="176" text-anchor="middle" font-size="11" fill="var(--d-text)">不丢</text>
      <text x="430" y="194" text-anchor="middle" font-size="11" fill="var(--d-text)">不乱</text>
      <text x="430" y="212" text-anchor="middle" font-size="11" fill="var(--d-text)">不堵</text>

      <rect x="58" y="82" width="170" height="62" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="143" y="106" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">消息如何尽量不丢</text>
      <text x="143" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">acks / ISR / 手动提交</text>

      <rect x="58" y="198" width="170" height="62" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="143" y="222" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">如何保证顺序</text>
      <text x="143" y="242" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Partition Key + 状态机</text>

      <rect x="632" y="82" width="170" height="62" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="717" y="106" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">如何处理积压</text>
      <text x="717" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">止血、扩容、长期治理</text>

      <rect x="632" y="198" width="170" height="62" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="717" y="222" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">重试和死信</text>
      <text x="717" y="242" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">有限重试 + DLQ 闭环</text>

      <rect x="324" y="266" width="212" height="46" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="430" y="285" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">表达压缩法</text>
      <text x="430" y="302" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">结论先行，再补配置、位点和业务兜底</text>

      <line x1="228" y1="113" x2="352" y2="150" stroke="var(--d-arrow)" stroke-width="1.6" />
      <line x1="228" y1="229" x2="352" y2="202" stroke="var(--d-arrow)" stroke-width="1.6" />
      <line x1="632" y1="113" x2="508" y2="150" stroke="var(--d-arrow)" stroke-width="1.6" />
      <line x1="632" y1="229" x2="508" y2="202" stroke="var(--d-arrow)" stroke-width="1.6" />
    </svg>
  </DiagramFrame>
</template>
