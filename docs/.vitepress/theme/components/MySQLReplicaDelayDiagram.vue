<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind = 'replication-flow' | 'parallel-model' | 'table-dispatch' | 'unique-key-conflict' | 'master-overlap' | 'mariadb-wait' | 'prepare-window'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'replication-flow': '580px',
  'parallel-model': '580px',
  'table-dispatch': '580px',
  'unique-key-conflict': '580px',
  'master-overlap': '580px',
  'mariadb-wait': '580px',
  'prepare-window': '580px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'replication-flow'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="arr1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-text-sub)"/></marker>
      </defs>
      <!-- Master -->
      <rect x="30" y="20" width="200" height="280" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="130" y="46" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-blue)">主库 Master</text>
      <rect x="60" y="60" width="140" height="36" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="130" y="83" text-anchor="middle" font-size="12" fill="var(--d-text)">客户端写入</text>
      <line x1="130" y1="96" x2="130" y2="130" stroke="var(--d-text-sub)" stroke-width="2.5" marker-end="url(#arr1)"/>
      <rect x="60" y="130" width="140" height="36" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="130" y="153" text-anchor="middle" font-size="12" fill="var(--d-text)">事务提交 (DATA)</text>
      <line x1="130" y1="166" x2="130" y2="200" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr1)"/>
      <rect x="60" y="200" width="140" height="36" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="130" y="223" text-anchor="middle" font-size="12" fill="var(--d-text)">写 binlog</text>
      <line x1="130" y1="236" x2="130" y2="265" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr1)"/>
      <rect x="60" y="265" width="140" height="28" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="130" y="284" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">dump_thread</text>
      <!-- Arrow master to slave -->
      <line x1="230" y1="278" x2="290" y2="278" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr1)"/>
      <text x="260" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">binlog</text>
      <!-- Slave -->
      <rect x="290" y="20" width="200" height="280" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="390" y="46" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-orange)">备库 Slave</text>
      <rect x="320" y="60" width="140" height="36" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="390" y="83" text-anchor="middle" font-size="12" fill="var(--d-text)">io_thread</text>
      <line x1="390" y1="96" x2="390" y2="130" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr1)"/>
      <rect x="320" y="130" width="140" height="36" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="390" y="153" text-anchor="middle" font-size="12" fill="var(--d-text)">relay log</text>
      <line x1="390" y1="166" x2="390" y2="200" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr1)"/>
      <rect x="320" y="200" width="140" height="36" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="390" y="223" text-anchor="middle" font-size="12" fill="var(--d-text)">sql_thread</text>
      <line x1="390" y1="236" x2="390" y2="265" stroke="var(--d-text-sub)" stroke-width="2.5" marker-end="url(#arr1)"/>
      <rect x="320" y="265" width="140" height="28" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="390" y="284" text-anchor="middle" font-size="12" fill="var(--d-text)">更新数据 (DATA)</text>
    </svg>

    <svg
          v-else-if="kind === 'parallel-model'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="arr2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-text-sub)"/></marker>
      </defs>
      <!-- Relay log -->
      <rect x="20" y="100" width="110" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="75" y="125" text-anchor="middle" font-size="12" fill="var(--d-text)">relay log</text>
      <!-- Arrow to coordinator -->
      <line x1="130" y1="120" x2="170" y2="120" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr2)"/>
      <!-- Coordinator -->
      <rect x="170" y="90" width="120" height="60" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="230" y="116" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">coordinator</text>
      <text x="230" y="134" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">(原 sql_thread)</text>
      <!-- Workers -->
      <line x1="290" y1="100" x2="340" y2="40" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr2)"/>
      <line x1="290" y1="115" x2="340" y2="90" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr2)"/>
      <line x1="290" y1="120" x2="340" y2="140" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr2)"/>
      <line x1="290" y1="135" x2="340" y2="190" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr2)"/>
      <rect x="340" y="20" width="120" height="36" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="400" y="43" text-anchor="middle" font-size="12" fill="var(--d-text)">worker_1</text>
      <rect x="340" y="70" width="120" height="36" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="400" y="93" text-anchor="middle" font-size="12" fill="var(--d-text)">worker_2</text>
      <rect x="340" y="120" width="120" height="36" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="400" y="143" text-anchor="middle" font-size="12" fill="var(--d-text)">worker_3</text>
      <rect x="340" y="170" width="120" height="36" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="400" y="193" text-anchor="middle" font-size="12" fill="var(--d-text)">worker_4</text>
      <text x="400" y="230" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">...</text>
      <text x="400" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-dim)">slave_parallel_workers</text>
    </svg>

    <svg
          v-else-if="kind === 'table-dispatch'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="arr3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-text-sub)"/></marker>
      </defs>
      <!-- Coordinator -->
      <rect x="20" y="110" width="120" height="50" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="80" y="140" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">coordinator</text>
      <!-- Arrows -->
      <line x1="140" y1="125" x2="190" y2="75" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr3)"/>
      <line x1="140" y1="145" x2="190" y2="195" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#arr3)"/>
      <!-- Worker 1 -->
      <rect x="190" y="20" width="110" height="40" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="245" y="45" text-anchor="middle" font-size="12" fill="var(--d-text)">worker_1</text>
      <!-- Hash table 1 -->
      <rect x="320" y="10" width="180" height="80" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3"/>
      <text x="410" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">hash_table_1</text>
      <text x="335" y="48" font-size="10" fill="var(--d-text-muted)" dominant-baseline="middle">db1.t1</text>
      <text x="465" y="48" text-anchor="end" font-size="11" font-weight="bold" fill="var(--d-orange)">4</text>
      <line x1="330" y1="55" x2="490" y2="55" stroke="var(--d-border)" stroke-width="0.5"/>
      <text x="335" y="70" font-size="10" fill="var(--d-text-muted)" dominant-baseline="middle">db2.t2</text>
      <text x="465" y="70" text-anchor="end" font-size="11" font-weight="bold" fill="var(--d-orange)">1</text>
      <line x1="300" y1="55" x2="320" y2="55" stroke="var(--d-text-sub)" stroke-width="1" marker-end="url(#arr3)"/>
      <!-- Worker 2 -->
      <rect x="190" y="170" width="110" height="40" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="245" y="195" text-anchor="middle" font-size="12" fill="var(--d-text)">worker_2</text>
      <!-- Hash table 2 -->
      <rect x="320" y="160" width="180" height="55" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3"/>
      <text x="410" y="180" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">hash_table_2</text>
      <text x="335" y="200" font-size="10" fill="var(--d-text-muted)" dominant-baseline="middle">db1.t3</text>
      <text x="465" y="200" text-anchor="end" font-size="11" font-weight="bold" fill="var(--d-orange)">1</text>
      <line x1="300" y1="190" x2="320" y2="190" stroke="var(--d-text-sub)" stroke-width="1" marker-end="url(#arr3)"/>
      <!-- New transaction T -->
      <rect x="20" y="240" width="180" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="5,3"/>
      <text x="110" y="264" text-anchor="middle" font-size="12" fill="var(--d-blue)">事务 T：修改 t1, t3</text>
      <text x="110" y="280" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">→ 冲突 worker_1 &amp; worker_2 → 等待</text>
    </svg>

    <svg
          v-else-if="kind === 'unique-key-conflict'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 200" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <!-- Header -->
      <rect x="0" y="0" width="440" height="30" rx="0" fill="var(--d-th-bg)"/>
      <text x="110" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-th-text)">Session A</text>
      <text x="330" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-th-text)">Session B</text>
      <line x1="220" y1="0" x2="220" y2="200" stroke="var(--d-th-border)" stroke-width="1"/>
      <!-- Timeline -->
      <line x1="20" y1="30" x2="20" y2="200" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,3"/>
      <text x="10" y="60" font-size="10" fill="var(--d-text-muted)">T1</text>
      <text x="10" y="110" font-size="10" fill="var(--d-text-muted)">T2</text>
      <text x="10" y="160" font-size="10" fill="var(--d-text-muted)">T3</text>
      <!-- Session A -->
      <rect x="40" y="45" width="170" height="30" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="125" y="65" text-anchor="middle" font-size="10" fill="var(--d-text)">update t1 set a=6</text>
      <text x="125" y="78" font-size="9" fill="var(--d-text-muted)" text-anchor="middle">where id=1; (a: 1→6)</text>
      <!-- Session B -->
      <rect x="240" y="95" width="180" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="330" y="115" text-anchor="middle" font-size="10" fill="var(--d-text)">update t1 set a=1</text>
      <text x="330" y="128" font-size="9" fill="var(--d-text-muted)" text-anchor="middle">where id=2; (a: 2→1)</text>
      <!-- Conflict note -->
      <rect x="100" y="155" width="240" height="30" rx="4" fill="var(--d-bg)" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="220" y="174" text-anchor="middle" font-size="10" fill="var(--d-orange)">若 B 先执行 → a=1 冲突 (唯一键)</text>
    </svg>

    <svg
          v-else-if="kind === 'master-overlap'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <!-- Time axis -->
      <line x1="80" y1="180" x2="480" y2="180" stroke="var(--d-text-sub)" stroke-width="1.5"/>
      <text x="490" y="184" font-size="10" fill="var(--d-text-muted)">时间 →</text>
      <!-- Group labels -->
      <text x="40" y="55" text-anchor="middle" font-size="11" fill="var(--d-text-sub)" font-weight="bold">组1</text>
      <text x="40" y="105" text-anchor="middle" font-size="11" fill="var(--d-text-sub)" font-weight="bold">组2</text>
      <text x="40" y="155" text-anchor="middle" font-size="11" fill="var(--d-text-sub)" font-weight="bold">组3</text>
      <!-- Group 1 transactions -->
      <rect x="80" y="30" width="120" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="140" y="44" text-anchor="middle" font-size="10" fill="var(--d-blue)">trx1</text>
      <rect x="100" y="52" width="130" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="165" y="66" text-anchor="middle" font-size="10" fill="var(--d-blue)">trx2</text>
      <rect x="90" y="74" width="100" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="140" y="88" text-anchor="middle" font-size="10" fill="var(--d-blue)">trx3</text>
      <!-- Commit line group 1 -->
      <line x1="200" y1="25" x2="200" y2="100" stroke="var(--d-green)" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="200" y="18" text-anchor="middle" font-size="9" fill="var(--d-green)">commit</text>
      <!-- Group 2 transactions (overlapping) -->
      <rect x="170" y="96" width="140" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="240" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">trx4</text>
      <rect x="180" y="118" width="120" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="240" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">trx5</text>
      <rect x="175" y="140" width="150" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="250" y="154" text-anchor="middle" font-size="10" fill="var(--d-text)">trx6</text>
      <!-- Commit line group 2 -->
      <line x1="330" y1="91" x2="330" y2="165" stroke="var(--d-green)" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="330" y="85" text-anchor="middle" font-size="9" fill="var(--d-green)">commit</text>
      <!-- Group 3 hint -->
      <rect x="300" y="168" width="100" height="10" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.5"/>
      <text x="400" y="176" font-size="9" fill="var(--d-text-muted)">trx7 ...</text>
    </svg>

    <svg
          v-else-if="kind === 'mariadb-wait'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 180" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <!-- Time axis -->
      <line x1="80" y1="160" x2="460" y2="160" stroke="var(--d-text-sub)" stroke-width="1.5"/>
      <text x="468" y="164" font-size="10" fill="var(--d-text-muted)">时间 →</text>
      <text x="40" y="25" text-anchor="middle" font-size="11" fill="var(--d-text-sub)" font-weight="bold">备库</text>
      <!-- Group 1 - parallel -->
      <rect x="80" y="30" width="100" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="130" y="44" text-anchor="middle" font-size="10" fill="var(--d-blue)">trx1</text>
      <rect x="80" y="55" width="140" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="150" y="69" text-anchor="middle" font-size="10" fill="var(--d-blue)">trx2 (大事务)</text>
      <rect x="80" y="80" width="90" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="125" y="94" text-anchor="middle" font-size="10" fill="var(--d-blue)">trx3</text>
      <!-- Wait barrier -->
      <line x1="220" y1="25" x2="220" y2="110" stroke="var(--d-orange)" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="225" y="118" font-size="9" fill="var(--d-orange)">等待组1完成</text>
      <!-- Group 2 - must wait -->
      <rect x="230" y="30" width="90" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="275" y="44" text-anchor="middle" font-size="10" fill="var(--d-text)">trx4</text>
      <rect x="230" y="55" width="80" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="270" y="69" text-anchor="middle" font-size="10" fill="var(--d-text)">trx5</text>
      <rect x="230" y="80" width="100" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="280" y="94" text-anchor="middle" font-size="10" fill="var(--d-text)">trx6</text>
      <!-- Idle gap annotation -->
      <rect x="180" y="135" width="120" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-orange)" stroke-width="1" stroke-dasharray="4,3"/>
      <text x="240" y="149" text-anchor="middle" font-size="9" fill="var(--d-orange)">空闲等待 (浪费)</text>
    </svg>

    <svg
          v-else-if="kind === 'prepare-window'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 340" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="arr7" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-text-sub)"/></marker>
      </defs>
      <!-- Title areas -->
      <rect x="20" y="10" width="180" height="28" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="29" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">redo log</text>
      <rect x="240" y="10" width="180" height="28" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="330" y="29" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">binlog</text>
      <!-- Step 1: redo prepare write -->
      <rect x="20" y="55" width="180" height="30" rx="5" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="74" text-anchor="middle" font-size="11" fill="var(--d-text)">① prepare write</text>
      <line x1="110" y1="85" x2="110" y2="100" stroke="var(--d-text-sub)" stroke-width="1" marker-end="url(#arr7)"/>
      <!-- Step 2: binlog write -->
      <line x1="200" y1="70" x2="240" y2="110" stroke="var(--d-text-muted)" stroke-width="1" stroke-dasharray="3,3"/>
      <rect x="240" y="100" width="180" height="30" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="330" y="119" text-anchor="middle" font-size="11" fill="var(--d-text)">② binlog write</text>
      <!-- Step 3: redo prepare fsync -->
      <rect x="20" y="105" width="180" height="30" rx="5" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="124" text-anchor="middle" font-size="11" fill="var(--d-text)">③ prepare fsync</text>
      <!-- Prepare group bracket -->
      <line x1="8" y1="50" x2="8" y2="140" stroke="var(--d-green)" stroke-width="2"/>
      <text x="5" y="95" text-anchor="end" font-size="9" fill="var(--d-green)" transform="rotate(-90 5 95)">prepare 组</text>
      <!-- Step 4: binlog fsync -->
      <line x1="330" y1="130" x2="330" y2="155" stroke="var(--d-text-sub)" stroke-width="1" marker-end="url(#arr7)"/>
      <rect x="240" y="155" width="180" height="30" rx="5" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="330" y="174" text-anchor="middle" font-size="11" fill="var(--d-text)">④ binlog fsync</text>
      <!-- Commit group bracket -->
      <line x1="432" y1="145" x2="432" y2="240" stroke="var(--d-orange)" stroke-width="2"/>
      <text x="435" y="195" font-size="9" fill="var(--d-orange)" transform="rotate(90 435 195)">commit 组</text>
      <!-- Step 5: redo commit write -->
      <line x1="240" y1="185" x2="200" y2="215" stroke="var(--d-text-muted)" stroke-width="1" stroke-dasharray="3,3"/>
      <rect x="20" y="205" width="180" height="30" rx="5" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="224" text-anchor="middle" font-size="11" fill="var(--d-text)">⑤ commit write</text>
      <!-- Key insight -->
      <rect x="40" y="265" width="360" height="55" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="220" y="287" text-anchor="middle" font-size="11" fill="var(--d-deep-blue)" font-weight="bold">MySQL 5.7 并行策略：</text>
      <text x="220" y="305" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">到达 prepare 阶段即可并行，无需等到 commit</text>
    </svg>
  </DiagramFrame>
</template>
