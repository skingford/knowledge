<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind = 'mvcc-chain' | 'visibility-rules' | 'query-visibility' | 'current-read' | 'locking-update'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'mvcc-chain': '580px',
  'visibility-rules': '580px',
  'query-visibility': '580px',
  'current-read': '580px',
  'locking-update': '580px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'mvcc-chain'" class="diagram-mysql-08-mvcc-chain" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 220" style="max-width:580px;width:100%;font-family:system-ui,sans-serif;">
      <defs><marker id="mv-ah" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-text-muted)"/></marker></defs>
      <text x="290" y="18" class="mv-title">图2 行状态变更图 (MVCC版本链)</text>
      <!-- V4: current -->
      <rect x="440" y="50" width="110" height="60" class="mv-cur"/>
      <text x="495" y="70" class="mv-txt" style="font-weight:600">V4 (当前版本)</text>
      <text x="495" y="85" class="mv-txt">k = 22</text>
      <text x="495" y="100" class="mv-id">row trx_id = 25</text>
      <!-- V3 -->
      <rect x="300" y="50" width="100" height="60" class="mv-ver"/>
      <text x="350" y="70" class="mv-txt" style="font-weight:600">V3</text>
      <text x="350" y="85" class="mv-txt">k = 11</text>
      <text x="350" y="100" class="mv-id">row trx_id = 20</text>
      <!-- V2 -->
      <rect x="160" y="50" width="100" height="60" class="mv-ver"/>
      <text x="210" y="70" class="mv-txt" style="font-weight:600">V2</text>
      <text x="210" y="85" class="mv-txt">k = 8</text>
      <text x="210" y="100" class="mv-id">row trx_id = 15</text>
      <!-- V1 -->
      <rect x="30" y="50" width="90" height="60" class="mv-ver"/>
      <text x="75" y="70" class="mv-txt" style="font-weight:600">V1</text>
      <text x="75" y="85" class="mv-txt">k = 5</text>
      <text x="75" y="100" class="mv-id">row trx_id = 10</text>
      <!-- Undo log arrows (right to left) -->
      <line x1="440" y1="80" x2="405" y2="80" class="mv-arr"/>
      <text x="422" y="130" class="mv-undo">U3</text>
      <line x1="300" y1="80" x2="265" y2="80" class="mv-arr"/>
      <text x="282" y="130" class="mv-undo">U2</text>
      <line x1="160" y1="80" x2="125" y2="80" class="mv-arr"/>
      <text x="142" y="130" class="mv-undo">U1</text>
      <!-- Labels -->
      <text x="290" y="155" class="mv-lbl" style="font-size:10px">虚线箭头表示 undo log，通过当前版本 + undo log 可计算出历史版本</text>
      <!-- Legend -->
      <rect x="160" y="175" width="14" height="14" rx="3" class="mv-cur"/>
      <text x="182" y="186" class="mv-lbl" style="text-anchor:start">当前版本</text>
      <rect x="240" y="175" width="14" height="14" rx="3" class="mv-ver"/>
      <text x="262" y="186" class="mv-lbl" style="text-anchor:start">历史版本</text>
      <line x1="330" y1="182" x2="360" y2="182" class="mv-arr"/>
      <text x="380" y="186" class="mv-lbl" style="text-anchor:start">undo log</text>
    </svg>

    <svg
          v-else-if="kind === 'visibility-rules'" class="diagram-mysql-08-visibility-rules" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 200" style="max-width:580px;width:100%;font-family:system-ui,sans-serif;">
      <text x="290" y="18" class="vr-title">图3 数据版本可见性规则</text>
      <!-- Number line -->
      <line x1="30" y1="90" x2="550" y2="90" stroke="var(--d-text-muted)" stroke-width="1.5"/>
      <!-- Green zone: committed (left) -->
      <rect x="30" y="60" width="170" height="60" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="115" y="82" class="vr-lbl" style="fill:var(--d-rv-a-text)">已提交事务</text>
      <text x="115" y="100" class="vr-stxt" style="fill:var(--d-rv-a-text)">(可见)</text>
      <!-- Yellow zone: active (middle) -->
      <rect x="200" y="60" width="180" height="60" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1"/>
      <text x="290" y="78" class="vr-lbl" style="fill:var(--d-rv-b-text)">活跃事务数组</text>
      <text x="290" y="94" class="vr-stxt" style="fill:var(--d-rv-b-text)">在数组中 → 不可见</text>
      <text x="290" y="108" class="vr-stxt" style="fill:var(--d-rv-b-text)">不在数组中 → 可见</text>
      <!-- Red zone: not started (right) -->
      <rect x="380" y="60" width="170" height="60" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
      <text x="465" y="82" class="vr-lbl" style="fill:var(--d-rv-c-text)">未开始事务</text>
      <text x="465" y="100" class="vr-stxt" style="fill:var(--d-rv-c-text)">(不可见)</text>
      <!-- Markers -->
      <line x1="200" y1="55" x2="200" y2="130" stroke="var(--d-text)" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="200" y="148" class="vr-txt" style="font-weight:600;fill:var(--d-text)">低水位</text>
      <text x="200" y="162" class="vr-stxt">(活跃事务最小 ID)</text>
      <line x1="380" y1="55" x2="380" y2="130" stroke="var(--d-text)" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="380" y="148" class="vr-txt" style="font-weight:600;fill:var(--d-text)">高水位</text>
      <text x="380" y="162" class="vr-stxt">(已创建最大 ID + 1)</text>
      <!-- Axis labels -->
      <text x="30" y="140" class="vr-stxt" style="text-anchor:start">trx_id 小</text>
      <text x="550" y="140" class="vr-stxt" style="text-anchor:end">trx_id 大</text>
    </svg>

    <svg
          v-else-if="kind === 'query-visibility'" class="diagram-mysql-08-query-visibility" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 310" style="max-width:580px;width:100%;font-family:system-ui,sans-serif;">
      <defs><marker id="q-ah" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-text-muted)"/></marker></defs>
      <text x="290" y="18" class="q-title">图4 事务A查询数据逻辑图</text>
      <!-- Info box -->
      <rect x="30" y="30" width="520" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="290" y="45" class="q-txt">事务A 视图数组: [99, 100]，低水位 = 99，高水位 = 101</text>
      <text x="290" y="58" class="q-id">事务A (trx_id=100) | 事务B (trx_id=101) | 事务C (trx_id=102)</text>
      <!-- Version chain -->
      <!-- V3: k=3, trx_id=101 (B) - invisible -->
      <rect x="380" y="90" width="120" height="60" class="q-invis"/>
      <text x="440" y="108" class="q-txt" style="font-weight:600">(1, 3)</text>
      <text x="440" y="122" class="q-id">row trx_id = 101</text>
      <text x="440" y="136" class="q-id">事务B 更新</text>
      <text x="440" y="165" class="q-tag" style="fill:var(--d-rv-c-text)">101 >= 101 (高水位)</text>
      <text x="440" y="178" class="q-tag" style="fill:var(--d-rv-c-text)">不可见</text>
      <!-- V2: k=2, trx_id=102 (C) - invisible -->
      <rect x="210" y="90" width="120" height="60" class="q-invis"/>
      <text x="270" y="108" class="q-txt" style="font-weight:600">(1, 2)</text>
      <text x="270" y="122" class="q-id">row trx_id = 102</text>
      <text x="270" y="136" class="q-id">事务C 更新</text>
      <text x="270" y="165" class="q-tag" style="fill:var(--d-rv-c-text)">102 >= 101 (高水位)</text>
      <text x="270" y="178" class="q-tag" style="fill:var(--d-rv-c-text)">不可见</text>
      <!-- V1: k=1, trx_id=90 - visible -->
      <rect x="50" y="90" width="120" height="60" class="q-vis"/>
      <text x="110" y="108" class="q-txt" style="font-weight:600">(1, 1)</text>
      <text x="110" y="122" class="q-id">row trx_id = 90</text>
      <text x="110" y="136" class="q-id">初始值</text>
      <text x="110" y="165" class="q-tag" style="fill:var(--d-rv-a-text)">90 < 99 (低水位)</text>
      <text x="110" y="178" class="q-tag" style="fill:var(--d-rv-a-text)">可见!</text>
      <!-- Arrows: undo chain -->
      <line x1="380" y1="120" x2="335" y2="120" class="q-arr"/>
      <line x1="210" y1="120" x2="175" y2="120" class="q-arr"/>
      <!-- Query path arrow -->
      <path d="M440,190 Q440,210 350,220 Q270,230 270,210" stroke="var(--d-orange)" stroke-width="1.5" fill="none" marker-end="url(#q-ah2)" stroke-dasharray="4,3"/>
      <path d="M270,210 Q270,230 190,240 Q110,250 110,230" stroke="var(--d-orange)" stroke-width="1.5" fill="none" marker-end="url(#q-ah2)" stroke-dasharray="4,3"/>
      <defs><marker id="q-ah2" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-orange)"/></marker></defs>
      <!-- Result -->
      <rect x="160" y="260" width="260" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="290" y="280" class="q-txt" style="font-weight:600;fill:var(--d-rv-a-text)">事务A 查询结果: k = 1 (一致性读)</text>
    </svg>

    <svg
          v-else-if="kind === 'current-read'" class="diagram-mysql-08-current-read" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 290" style="max-width:580px;width:100%;font-family:system-ui,sans-serif;">
      <defs>
        <marker id="u-ah" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-text-muted)"/></marker>
        <marker id="u-ah2" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-orange)"/></marker>
      </defs>
      <text x="290" y="18" class="u-title">图5 事务B更新逻辑图 (当前读)</text>
      <!-- Step 1: Original -->
      <rect x="30" y="50" width="110" height="55" class="u-box"/>
      <text x="85" y="68" class="u-txt" style="font-weight:600">(1, 1)</text>
      <text x="85" y="82" class="u-id">row trx_id = 90</text>
      <text x="85" y="95" class="u-id">初始值</text>
      <!-- Step 2: C updates -->
      <rect x="230" y="50" width="110" height="55" class="u-cur"/>
      <text x="285" y="68" class="u-txt" style="font-weight:600">(1, 2)</text>
      <text x="285" y="82" class="u-id">row trx_id = 102</text>
      <text x="285" y="95" class="u-id">事务C 已提交</text>
      <!-- Arrow 1->2 -->
      <line x1="140" y1="77" x2="225" y2="77" class="u-arr"/>
      <text x="182" y="45" class="u-note">事务C: k=k+1</text>
      <!-- Step 3: B current read + update -->
      <rect x="430" y="50" width="120" height="55" class="u-new"/>
      <text x="490" y="68" class="u-txt" style="font-weight:600">(1, 3)</text>
      <text x="490" y="82" class="u-id">row trx_id = 101</text>
      <text x="490" y="95" class="u-id">事务B 更新</text>
      <!-- Arrow 2->3 -->
      <line x1="340" y1="77" x2="425" y2="77" class="u-darr"/>
      <text x="382" y="45" class="u-note" style="fill:var(--d-orange);font-weight:600">事务B: k=k+1</text>
      <!-- Current read explanation -->
      <rect x="90" y="140" width="400" height="70" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="290" y="160" class="u-txt" style="font-weight:600;fill:var(--d-warn-text)">当前读 (Current Read)</text>
      <text x="290" y="178" class="u-id" style="fill:var(--d-warn-text)">UPDATE 先读后写 — 读的是"当前值"（最新已提交版本）</text>
      <text x="290" y="192" class="u-id" style="fill:var(--d-warn-text)">事务B 读到 k=2（事务C已提交），在此基础上 +1 得 k=3</text>
      <!-- Query result -->
      <rect x="90" y="230" width="400" height="36" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="290" y="245" class="u-txt" style="fill:var(--d-rv-a-text)">事务B 随后 SELECT → trx_id=101 是自己 → 可见 →</text>
      <text x="290" y="258" class="u-txt" style="font-weight:600;fill:var(--d-rv-a-text)">返回 k = 3</text>
    </svg>

    <svg
          v-else-if="kind === 'locking-update'" class="diagram-mysql-08-locking-update" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 280" style="max-width:580px;width:100%;font-family:system-ui,sans-serif;">
      <defs><marker id="u7-ah" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-text-muted)"/></marker></defs>
      <text x="290" y="18" class="u7-title">图7 事务B更新逻辑图 (配合事务C')</text>
      <!-- Timeline -->
      <!-- Step 1: C' updates but NOT committed -->
      <rect x="30" y="50" width="140" height="65" class="u7-lock"/>
      <text x="100" y="68" class="u7-txt" style="font-weight:600;fill:var(--d-warn-text)">事务C' 更新未提交</text>
      <text x="100" y="82" class="u7-txt">(1, 2) trx_id=102</text>
      <text x="100" y="96" class="u7-id" style="fill:var(--d-warn-text)">持有 id=1 行锁</text>
      <!-- Step 2: B blocked -->
      <rect x="210" y="50" width="140" height="65" class="u7-lock"/>
      <text x="280" y="68" class="u7-txt" style="font-weight:600;fill:var(--d-warn-text)">事务B 被阻塞</text>
      <text x="280" y="82" class="u7-txt">等待 id=1 行锁...</text>
      <text x="280" y="96" class="u7-id" style="fill:var(--d-warn-text)">两阶段锁协议</text>
      <!-- Arrow -->
      <line x1="170" y1="82" x2="205" y2="82" class="u7-arr"/>
      <!-- Step 3: C' commits, B unblocks -->
      <rect x="390" y="50" width="160" height="65" class="u7-done"/>
      <text x="470" y="68" class="u7-txt" style="font-weight:600;fill:var(--d-rv-a-text)">C' 提交 → B 解除阻塞</text>
      <text x="470" y="82" class="u7-txt">当前读 k=2</text>
      <text x="470" y="96" class="u7-id" style="fill:var(--d-rv-a-text)">B 执行 k=k+1 → k=3</text>
      <!-- Arrow -->
      <line x1="350" y1="82" x2="385" y2="82" class="u7-arr"/>
      <!-- Process summary -->
      <rect x="40" y="145" width="500" height="55" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="290" y="163" class="u7-txt" style="font-weight:600">执行过程</text>
      <text x="290" y="178" class="u7-id">1. 事务C' 执行 UPDATE 但未提交 → 持有行锁</text>
      <text x="290" y="190" class="u7-id">2. 事务B 执行 UPDATE → 需要当前读 → 等待行锁 → 被阻塞</text>
      <!-- Result -->
      <rect x="40" y="220" width="500" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="290" y="238" class="u7-txt" style="font-weight:600;fill:var(--d-warn-text)">关键: 事务B 必须等 C' 提交释放锁后，才能执行当前读</text>
      <text x="290" y="252" class="u7-id" style="fill:var(--d-warn-text)">此时 C' 已提交，当前读拿到 k=2 → 更新为 k=3，结果与图5一致</text>
    </svg>
  </DiagramFrame>
</template>
