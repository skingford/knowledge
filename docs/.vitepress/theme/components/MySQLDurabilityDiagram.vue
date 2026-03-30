<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind = 'binlog-cache' | 'redo-state' | 'group-commit' | 'two-phase-commit' | 'two-phase-detail'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'binlog-cache': '580px',
  'redo-state': '580px',
  'group-commit': '580px',
  'two-phase-commit': '580px',
  'two-phase-detail': '580px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'binlog-cache'" class="diagram-mysql-23-binlog-cache" viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:system-ui,sans-serif">
      <defs><marker id="ah1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--d-text-sub)"/></marker></defs>
      <text x="260" y="20" text-anchor="middle" class="title">图 1 &nbsp; binlog 写盘状态</text>
      <!-- Thread caches -->
      <rect x="20" y="40" width="90" height="50" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="65" y="60" text-anchor="middle" class="label">Thread 1</text>
      <text x="65" y="76" text-anchor="middle" class="sub">binlog cache</text>
      <rect x="20" y="100" width="90" height="50" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="65" y="120" text-anchor="middle" class="label">Thread 2</text>
      <text x="65" y="136" text-anchor="middle" class="sub">binlog cache</text>
      <rect x="20" y="160" width="90" height="50" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="65" y="180" text-anchor="middle" class="label">Thread N</text>
      <text x="65" y="196" text-anchor="middle" class="sub">binlog cache</text>
      <!-- Arrows to binlog files -->
      <line x1="110" y1="65" x2="190" y2="120" class="arrow"/>
      <line x1="110" y1="125" x2="190" y2="125" class="arrow"/>
      <line x1="110" y1="185" x2="190" y2="135" class="arrow"/>
      <!-- Binlog files (page cache) -->
      <rect x="195" y="90" width="120" height="70" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="255" y="116" text-anchor="middle" class="label">binlog files</text>
      <text x="255" y="132" text-anchor="middle" class="sub">(page cache)</text>
      <text x="255" y="148" text-anchor="middle" class="sub">write</text>
      <!-- Arrow to disk -->
      <line x1="315" y1="125" x2="390" y2="125" class="arrow"/>
      <text x="352" y="118" text-anchor="middle" class="sub">fsync</text>
      <!-- Disk -->
      <rect x="395" y="95" width="105" height="60" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="447" y="122" text-anchor="middle" class="label">Disk</text>
      <text x="447" y="138" text-anchor="middle" class="sub">(持久化)</text>
    </svg>

    <svg
          v-else-if="kind === 'redo-state'" class="diagram-mysql-23-redo-prepare" viewBox="0 0 520 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:system-ui,sans-serif">
      <defs><marker id="ah2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--d-text-sub)"/></marker></defs>
      <text x="260" y="20" text-anchor="middle" class="t2">图 2 &nbsp; MySQL redo log 存储状态</text>
      <!-- MySQL process memory (red) -->
      <rect x="15" y="45" width="145" height="65" rx="5" fill="#fce4e4" stroke="#e57373" stroke-width="1.5"/>
      <text x="87" y="68" text-anchor="middle" class="lb2" fill="#c62828">redo log buffer</text>
      <text x="87" y="84" text-anchor="middle" class="sb2" fill="#c62828">MySQL 进程内存</text>
      <text x="87" y="100" text-anchor="middle" style="font-size:10px;fill:#e57373;font-weight:600">&#9632; 红色</text>
      <!-- FS page cache (yellow) -->
      <rect x="190" y="45" width="145" height="65" rx="5" fill="#fff8e1" stroke="#ffb74d" stroke-width="1.5"/>
      <text x="262" y="68" text-anchor="middle" class="lb2" fill="#e65100">FS page cache</text>
      <text x="262" y="84" text-anchor="middle" class="sb2" fill="#e65100">write 但未 fsync</text>
      <text x="262" y="100" text-anchor="middle" style="font-size:10px;fill:#ffb74d;font-weight:600">&#9632; 黄色</text>
      <!-- Hard disk (green) -->
      <rect x="365" y="45" width="140" height="65" rx="5" fill="#e8f5e9" stroke="#66bb6a" stroke-width="1.5"/>
      <text x="435" y="68" text-anchor="middle" class="lb2" fill="#2e7d32">Hard Disk</text>
      <text x="435" y="84" text-anchor="middle" class="sb2" fill="#2e7d32">持久化到磁盘</text>
      <text x="435" y="100" text-anchor="middle" style="font-size:10px;fill:#66bb6a;font-weight:600">&#9632; 绿色</text>
      <!-- Arrows -->
      <line x1="160" y1="77" x2="188" y2="77" class="ar2"/>
      <text x="174" y="72" text-anchor="middle" class="sb2">write</text>
      <line x1="335" y1="77" x2="363" y2="77" class="ar2"/>
      <text x="349" y="72" text-anchor="middle" class="sb2">fsync</text>
      <!-- Labels below -->
      <text x="87" y="135" text-anchor="middle" class="sb2">innodb_flush_log_at_trx_commit=0</text>
      <text x="87" y="148" text-anchor="middle" class="sb2">留在 buffer</text>
      <text x="262" y="135" text-anchor="middle" class="sb2">innodb_flush_log_at_trx_commit=2</text>
      <text x="262" y="148" text-anchor="middle" class="sb2">写到 page cache</text>
      <text x="435" y="135" text-anchor="middle" class="sb2">innodb_flush_log_at_trx_commit=1</text>
      <text x="435" y="148" text-anchor="middle" class="sb2">持久化到磁盘</text>
    </svg>

    <svg
          v-else-if="kind === 'group-commit'" class="diagram-mysql-23-binlog-write" viewBox="0 0 480 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:system-ui,sans-serif">
      <defs><marker id="ah3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--d-text-sub)"/></marker></defs>
      <text x="240" y="20" text-anchor="middle" class="t3">图 3 &nbsp; redo log 组提交</text>
      <!-- Timeline -->
      <line x1="30" y1="50" x2="450" y2="50" stroke="var(--d-border)" stroke-width="1"/>
      <text x="30" y="44" class="sb3">时间 →</text>
      <!-- trx1 -->
      <rect x="50" y="60" width="100" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="100" y="79" text-anchor="middle" class="lb3">trx1 LSN=50</text>
      <!-- trx2 -->
      <rect x="110" y="95" width="100" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="160" y="114" text-anchor="middle" class="lb3">trx2 LSN=120</text>
      <!-- trx3 -->
      <rect x="140" y="130" width="100" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="190" y="149" text-anchor="middle" class="lb3">trx3 LSN=160</text>
      <!-- Leader bracket -->
      <text x="55" y="56" class="sb3" fill="var(--d-orange)">leader</text>
      <!-- Group write -->
      <line x1="155" y1="74" x2="280" y2="74" class="ar3"/>
      <rect x="280" y="60" width="150" height="50" rx="5" fill="#e8f5e9" stroke="#66bb6a" stroke-width="1.5"/>
      <text x="355" y="82" text-anchor="middle" class="lb3" fill="#2e7d32">fsync LSN=160</text>
      <text x="355" y="98" text-anchor="middle" class="sb3" fill="#2e7d32">一次刷盘，三个事务</text>
      <!-- Return arrows -->
      <line x1="430" y1="80" x2="455" y2="80" stroke="var(--d-green)" stroke-width="1.5"/>
      <text x="455" y="75" class="sb3" fill="var(--d-green)">done</text>
      <!-- Legend -->
      <text x="50" y="190" class="sb3">trx1 是 leader，写盘时带上 trx2、trx3</text>
      <text x="50" y="206" class="sb3">LSN &le; 160 的 redo log 全部持久化，trx2/trx3 直接返回</text>
    </svg>

    <svg
          v-else-if="kind === 'two-phase-commit'" class="diagram-mysql-23-redo-commit" viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:system-ui,sans-serif">
      <defs><marker id="ah4" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--d-text-sub)"/></marker></defs>
      <text x="210" y="22" text-anchor="middle" class="t4">图 4 &nbsp; 两阶段提交</text>
      <!-- Step 1: redo log prepare -->
      <rect x="40" y="45" width="150" height="40" rx="5" fill="#fff8e1" stroke="#ffb74d" stroke-width="1.5"/>
      <text x="115" y="62" text-anchor="middle" class="lb4">redo log</text>
      <text x="115" y="77" text-anchor="middle" class="sb4" fill="#e65100">prepare</text>
      <!-- Arrow down -->
      <line x1="115" y1="85" x2="115" y2="105" class="ar4"/>
      <!-- Step 2: write binlog -->
      <rect x="40" y="108" width="150" height="40" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="115" y="125" text-anchor="middle" class="lb4">写 binlog</text>
      <text x="115" y="140" text-anchor="middle" class="sb4">持久化到磁盘</text>
      <!-- Arrow down -->
      <line x1="115" y1="148" x2="115" y2="168" class="ar4"/>
      <!-- Step 3: redo log commit -->
      <rect x="40" y="171" width="150" height="40" rx="5" fill="#e8f5e9" stroke="#66bb6a" stroke-width="1.5"/>
      <text x="115" y="188" text-anchor="middle" class="lb4">redo log</text>
      <text x="115" y="203" text-anchor="middle" class="sb4" fill="#2e7d32">commit</text>
      <!-- Side labels -->
      <text x="210" y="68" class="sb4">① prepare 阶段</text>
      <text x="210" y="132" class="sb4">② 写 binlog</text>
      <text x="210" y="194" class="sb4">③ commit 阶段</text>
    </svg>

    <svg
          v-else-if="kind === 'two-phase-detail'" class="diagram-mysql-23-crash-recovery" viewBox="0 0 440 310" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:system-ui,sans-serif">
      <defs><marker id="ah5" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--d-text-sub)"/></marker></defs>
      <text x="220" y="22" text-anchor="middle" class="t5">图 5 &nbsp; 两阶段提交细化</text>
      <!-- Step 1: redo log prepare -->
      <rect x="40" y="40" width="170" height="36" rx="5" fill="#fff8e1" stroke="#ffb74d" stroke-width="1.5"/>
      <text x="125" y="63" text-anchor="middle" class="lb5">1. redo log prepare</text>
      <line x1="125" y1="76" x2="125" y2="92" class="ar5"/>
      <!-- Step 2: binlog write to page cache -->
      <rect x="40" y="95" width="170" height="36" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="125" y="118" text-anchor="middle" class="lb5">2. redo log fsync</text>
      <line x1="125" y1="131" x2="125" y2="147" class="ar5"/>
      <!-- Step 3: binlog write -->
      <rect x="40" y="150" width="170" height="36" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="125" y="173" text-anchor="middle" class="lb5">3. binlog write</text>
      <line x1="125" y1="186" x2="125" y2="202" class="ar5"/>
      <!-- Step 4: binlog fsync -->
      <rect x="40" y="205" width="170" height="36" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="125" y="228" text-anchor="middle" class="lb5">4. binlog fsync</text>
      <line x1="125" y1="241" x2="125" y2="257" class="ar5"/>
      <!-- Step 5: redo log commit -->
      <rect x="40" y="260" width="170" height="36" rx="5" fill="#e8f5e9" stroke="#66bb6a" stroke-width="1.5"/>
      <text x="125" y="283" text-anchor="middle" class="lb5">5. redo log commit</text>
      <!-- Side annotations -->
      <text x="230" y="62" class="sb5">← redo log 组提交的时机</text>
      <text x="230" y="118" class="sb5">← fsync 拖到 binlog write 之后</text>
      <text x="230" y="173" class="sb5">← binlog 写入 page cache</text>
      <text x="230" y="228" class="sb5">← binlog 组提交的时机</text>
      <text x="230" y="283" class="sb5">← write only（不需要 fsync）</text>
    </svg>
  </DiagramFrame>
</template>
