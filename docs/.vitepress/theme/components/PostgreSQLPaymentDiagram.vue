<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'long-transaction-pressure'
  | 'partition-archive-flow'
  | 'replica-lag-read-path'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'long-transaction-pressure': '860px',
  'partition-archive-flow': '860px',
  'replica-lag-read-path': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'long-transaction-pressure'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="长事务放大版本回收压力图"
    >
      <defs>
        <marker id="pg-pay-arrow-long" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        支付场景里长事务最麻烦的不是“慢一次”，而是它会把旧版本回收、VACUUM 和整张热表都拖住
      </text>

      <rect x="52" y="92" width="196" height="108" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="150" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">长事务</text>
      <text x="150" y="144" text-anchor="middle" font-size="10" fill="var(--d-client-text)">报表 / 对账 / 未及时提交连接</text>
      <text x="150" y="162" text-anchor="middle" font-size="10" fill="var(--d-client-text)">长时间持有旧快照</text>

      <rect x="332" y="92" width="196" height="108" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">旧版本回收不了</text>
      <text x="430" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">UPDATE 产生的新旧版本并存</text>
      <text x="430" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">VACUUM 不能安全清理</text>

      <rect x="612" y="92" width="196" height="108" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="710" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">放大业务风险</text>
      <text x="710" y="144" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">表膨胀、索引膨胀</text>
      <text x="710" y="162" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">VACUUM 压力、RT 抖动</text>

      <line x1="248" y1="146" x2="332" y2="146" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-pay-arrow-long)" />
      <line x1="528" y1="146" x2="612" y2="146" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-pay-arrow-long)" />

      <rect x="176" y="228" width="508" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        所以支付表最怕“查询事务开太久”，治理重点通常是缩事务、拆报表、避免跨大范围长时间持有快照
      </text>
    </svg>

    <svg
      v-else-if="kind === 'partition-archive-flow'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="流水表分区与归档流图"
    >
      <defs>
        <marker id="pg-pay-arrow-partition" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        流水表适合按时间分区：热数据留在当前分区，旧分区更容易归档、清理和冷热分离
      </text>

      <rect x="48" y="92" width="216" height="116" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="156" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">支付流水主表</text>
      <text x="156" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按时间持续增长</text>
      <text x="156" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">查询常带时间范围条件</text>
      <text x="156" y="180" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">非常适合时间分区</text>

      <rect x="324" y="82" width="212" height="136" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">按月 / 按日分区</text>
      <rect x="356" y="128" width="148" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="430" y="145" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">p_2026_01</text>
      <rect x="356" y="160" width="148" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="430" y="177" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">p_2026_02</text>
      <rect x="356" y="192" width="148" height="24" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="430" y="209" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">p_2026_03 (热点分区)</text>

      <rect x="596" y="92" width="216" height="116" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="704" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">归档 / 冷热分离</text>
      <text x="704" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">旧分区可直接归档</text>
      <text x="704" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">冷热数据分层管理</text>
      <text x="704" y="180" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">避免单表无限膨胀</text>

      <line x1="264" y1="150" x2="324" y2="150" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-pay-arrow-partition)" />
      <line x1="536" y1="150" x2="596" y2="150" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-pay-arrow-partition)" />
    </svg>

    <svg
      v-else-if="kind === 'replica-lag-read-path'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="复制延迟与读路径控制图"
    >
      <defs>
        <marker id="pg-pay-arrow-lag" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        复制延迟最怕的是“写刚成功，读却落到滞后副本”，所以支付查询必须区分主库读和副本读
      </text>

      <rect x="56" y="104" width="156" height="80" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="134" y="132" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="134" y="152" text-anchor="middle" font-size="10" fill="var(--d-client-text)">先写订单 / 流水</text>

      <rect x="284" y="86" width="174" height="116" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="371" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Primary</text>
      <text x="371" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">写入成功</text>
      <text x="371" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">WAL 已提交</text>
      <text x="371" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">但副本可能尚未追平</text>

      <rect x="536" y="86" width="174" height="116" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="623" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Replica</text>
      <text x="623" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">存在 replay lag</text>
      <text x="623" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">立刻读取可能看到旧数据</text>

      <line x1="212" y1="144" x2="284" y2="144" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-pay-arrow-lag)" />
      <line x1="458" y1="144" x2="536" y2="144" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-pay-arrow-lag)" />

      <rect x="164" y="236" width="248" height="40" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="288" y="252" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">刚写完立刻读</text>
      <text x="288" y="268" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">资金类查询 / 对账关键读：走主库</text>

      <rect x="448" y="236" width="248" height="40" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="572" y="252" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">报表 / 搜索 / 普通列表</text>
      <text x="572" y="268" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">可走从库，但要配延迟摘除策略</text>
    </svg>
  </DiagramFrame>
</template>
