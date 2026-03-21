<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'core-concepts'
  | 'payment-practice'
  | 'interview-questions'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '860px',
  'core-concepts': '860px',
  'payment-practice': '860px',
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
