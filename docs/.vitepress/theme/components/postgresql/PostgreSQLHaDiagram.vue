<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'patroni-overview'
  | 'async-replication'
  | 'sync-replication'
  | 'streaming-flow'
  | 'multi-standby-streams'
  | 'three-node-write-path'
  | 'lsn-compare'
  | 'commit-visibility'
  | 'replica-lagging'
  | 'replica-down-any1'
  | 'worst-case-failover'
  | 'recovery-wal-available'
  | 'recovery-wal-missing'
  | 'patronictl-list-output'
  | 'wal-example-log'
  | 'replication-status-output'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'patroni-overview': '860px',
  'async-replication': '760px',
  'sync-replication': '820px',
  'streaming-flow': '820px',
  'multi-standby-streams': '760px',
  'three-node-write-path': '860px',
  'lsn-compare': '760px',
  'commit-visibility': '760px',
  'replica-lagging': '760px',
  'replica-down-any1': '760px',
  'worst-case-failover': '760px',
  'recovery-wal-available': '760px',
  'recovery-wal-missing': '760px',
  'patronictl-list-output': '760px',
  'wal-example-log': '760px',
  'replication-status-output': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'patroni-overview'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Patroni 推荐架构图"
    >
      <defs>
        <marker id="pg-ha-arrow-overview" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
        <marker id="pg-ha-arrow-wal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-orange)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        PostgreSQL HA 推荐架构：业务访问稳定入口，Patroni / etcd 负责控制面，WAL 负责数据面复制
      </text>

      <rect x="340" y="48" width="180" height="42" rx="16" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="430" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">Client / App</text>

      <rect x="320" y="110" width="220" height="50" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="133" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">HAProxy / VIP / 云 LB</text>
      <text x="430" y="151" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">业务永远连稳定入口，而不是当前主库 IP</text>

      <line x1="430" y1="90" x2="430" y2="110" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-overview)" />

      <rect x="40" y="208" width="230" height="96" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="155" y="234" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">PG Node1</text>
      <text x="155" y="256" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">PostgreSQL Primary</text>
      <text x="155" y="274" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Patroni</text>
      <rect x="93" y="282" width="124" height="18" rx="9" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" />
      <text x="155" y="295" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">写请求入口</text>

      <rect x="315" y="208" width="230" height="96" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="234" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">PG Node2</text>
      <text x="430" y="256" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">PostgreSQL Replica</text>
      <text x="430" y="274" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">Patroni</text>
      <rect x="373" y="282" width="114" height="18" rx="9" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="430" y="295" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读副本 / 候选主</text>

      <rect x="590" y="208" width="230" height="96" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="705" y="234" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">PG Node3</text>
      <text x="705" y="256" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">PostgreSQL Replica</text>
      <text x="705" y="274" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">Patroni</text>
      <rect x="648" y="282" width="114" height="18" rx="9" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="705" y="295" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读副本 / 候选主</text>

      <line x1="390" y1="160" x2="190" y2="206" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-overview)" />
      <line x1="430" y1="160" x2="430" y2="206" stroke="var(--d-arrow)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#pg-ha-arrow-overview)" />
      <line x1="470" y1="160" x2="670" y2="206" stroke="var(--d-arrow)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#pg-ha-arrow-overview)" />
      <text x="255" y="175" font-size="10" fill="var(--d-text-sub)">写流量</text>
      <text x="560" y="175" font-size="10" fill="var(--d-text-sub)">读流量</text>

      <line x1="270" y1="242" x2="315" y2="242" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-wal)" />
      <line x1="270" y1="268" x2="590" y2="268" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-wal)" />
      <text x="292" y="236" font-size="10" fill="var(--d-orange)">WAL</text>
      <text x="438" y="286" font-size="10" fill="var(--d-orange)">WAL</text>

      <rect x="215" y="316" width="430" height="30" rx="15" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="336" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        控制面：每个 Patroni 都向 etcd 保持心跳并争抢 leader 锁；数据面：只有 Primary 向副本发送 WAL
      </text>
    </svg>

    <svg
      v-else-if="kind === 'async-replication'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="异步复制流程图"
    >
      <defs>
        <marker id="pg-ha-arrow-async" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
        <marker id="pg-ha-arrow-async-wal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-orange)" />
        </marker>
      </defs>

      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        异步复制：主库本地写完 WAL 就先返回成功，从库随后再追上
      </text>

      <rect x="40" y="88" width="120" height="46" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="100" y="117" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">Client</text>

      <rect x="240" y="74" width="180" height="74" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="330" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Primary</text>
      <text x="330" y="120" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">写事务 -> 生成 WAL</text>
      <text x="330" y="137" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">本地 fsync 后即可返回</text>

      <rect x="520" y="74" width="180" height="74" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="610" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Standby</text>
      <text x="610" y="120" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">后台接收 WAL</text>
      <text x="610" y="137" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">稍后回放追平</text>

      <line x1="160" y1="111" x2="240" y2="111" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-async)" />
      <line x1="420" y1="98" x2="520" y2="98" stroke="var(--d-orange)" stroke-width="2" stroke-dasharray="7 5" marker-end="url(#pg-ha-arrow-async-wal)" />
      <line x1="420" y1="126" x2="160" y2="126" stroke="var(--d-green)" stroke-width="2" marker-end="url(#pg-ha-arrow-async)" />

      <text x="468" y="88" text-anchor="middle" font-size="10" fill="var(--d-orange)">异步发送 WAL</text>
      <text x="288" y="150" text-anchor="middle" font-size="10" fill="var(--d-green)">先返回客户端成功</text>

      <rect x="162" y="174" width="436" height="26" rx="13" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        优点是写延迟低；代价是主库异常时，最近尚未传到副本的 WAL 可能丢失
      </text>
    </svg>

    <svg
      v-else-if="kind === 'sync-replication'"
      viewBox="0 0 820 260"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="同步复制流程图"
    >
      <defs>
        <marker id="pg-ha-arrow-sync" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
        <marker id="pg-ha-arrow-sync-wal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-orange)" />
        </marker>
      </defs>

      <text x="410" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        同步复制：主库要等副本确认后，事务才会对客户端提交成功
      </text>

      <rect x="34" y="96" width="120" height="46" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="94" y="125" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">Client</text>

      <rect x="220" y="72" width="176" height="94" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="308" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Primary</text>
      <text x="308" y="120" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">写事务 + 本地 WAL</text>
      <text x="308" y="138" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">并发发给同步副本</text>
      <text x="308" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">未收到确认前不向客户端返回</text>

      <rect x="472" y="58" width="144" height="76" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="544" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Replica node2</text>
      <text x="544" y="103" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">同步候选</text>
      <text x="544" y="119" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">确认后可计入提交</text>

      <rect x="642" y="58" width="144" height="76" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="714" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Replica node3</text>
      <text x="714" y="103" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">同步候选</text>
      <text x="714" y="119" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">可与 node2 共同参与</text>

      <line x1="154" y1="119" x2="220" y2="119" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-sync)" />
      <line x1="396" y1="90" x2="472" y2="90" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-sync-wal)" />
      <line x1="396" y1="126" x2="642" y2="126" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-sync-wal)" />
      <line x1="472" y1="152" x2="396" y2="152" stroke="var(--d-green)" stroke-width="2" marker-end="url(#pg-ha-arrow-sync)" />
      <line x1="642" y1="168" x2="396" y2="168" stroke="var(--d-green)" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#pg-ha-arrow-sync)" />
      <line x1="308" y1="196" x2="154" y2="196" stroke="var(--d-green)" stroke-width="2" marker-end="url(#pg-ha-arrow-sync)" />

      <text x="434" y="82" text-anchor="middle" font-size="10" fill="var(--d-orange)">WAL</text>
      <text x="520" y="146" text-anchor="middle" font-size="10" fill="var(--d-green)">ACK</text>
      <text x="554" y="186" text-anchor="middle" font-size="10" fill="var(--d-green)">收到满足策略的 ACK 后提交</text>

      <rect x="184" y="216" width="452" height="28" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="410" y="235" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        三节点常见折中是 ANY 1：只要 node2 或 node3 任意一个先确认，主库就可以向客户端返回成功
      </text>
    </svg>

    <svg
      v-else-if="kind === 'streaming-flow'"
      viewBox="0 0 820 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="流复制完整流程图"
    >
      <defs>
        <marker id="pg-ha-arrow-flow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="410" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        流复制完整流程：Primary 产生 WAL，Standby 接收 WAL，再按顺序回放到数据页
      </text>

      <rect x="52" y="52" width="310" height="272" rx="18" fill="var(--d-rv-c-bg)" fill-opacity="0.28" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="207" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-c-text)">Primary</text>

      <rect x="458" y="52" width="310" height="272" rx="18" fill="var(--d-blue-bg)" fill-opacity="0.5" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="613" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">Standby</text>

      <rect x="92" y="102" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" />
      <text x="207" y="124" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">① 客户端提交写请求</text>
      <rect x="92" y="146" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" />
      <text x="207" y="168" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">② WAL 写入 WAL Buffer</text>
      <rect x="92" y="190" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" />
      <text x="207" y="212" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">③ fsync 到 pg_wal/</text>
      <rect x="92" y="234" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" />
      <text x="207" y="256" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">④ WAL Sender 持续发送 WAL</text>

      <rect x="498" y="124" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="613" y="146" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">⑤ WAL Receiver 接收 WAL</text>
      <rect x="498" y="168" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="613" y="190" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">⑥ 写入本地 pg_wal/</text>
      <rect x="498" y="212" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="613" y="234" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">⑦ Startup 进程回放 WAL</text>
      <rect x="498" y="256" width="230" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-blue-border)" />
      <text x="613" y="278" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">⑧ hot_standby=on 时可读</text>

      <line x1="207" y1="136" x2="207" y2="146" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-flow)" />
      <line x1="207" y1="180" x2="207" y2="190" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-flow)" />
      <line x1="207" y1="224" x2="207" y2="234" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-flow)" />
      <line x1="322" y1="251" x2="498" y2="141" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-flow)" />
      <line x1="613" y1="158" x2="613" y2="168" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-flow)" />
      <line x1="613" y1="202" x2="613" y2="212" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-flow)" />
      <line x1="613" y1="246" x2="613" y2="256" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-flow)" />

      <text x="410" y="186" text-anchor="middle" font-size="11" fill="var(--d-orange)">持续流式传输 WAL</text>
    </svg>

    <svg
      v-else-if="kind === 'multi-standby-streams'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="主库同时同步多个从库图"
    >
      <defs>
        <marker id="pg-ha-arrow-multi" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
        <marker id="pg-ha-arrow-multi-wal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-orange)" />
        </marker>
      </defs>

      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        主库不是轮流发 WAL，而是为每个从库维护独立发送流、独立接收位置和独立 ACK
      </text>

      <rect x="58" y="96" width="186" height="84" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="151" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Primary</text>
      <text x="151" y="142" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">WAL Buffer / pg_wal</text>
      <text x="151" y="160" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">同时维护多个 WAL Sender</text>

      <rect x="322" y="64" width="150" height="68" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="397" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node2</text>
      <text x="397" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">独立 TCP / 接收点 / ACK</text>

      <rect x="322" y="150" width="150" height="68" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="397" y="176" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node3</text>
      <text x="397" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">独立 TCP / 接收点 / ACK</text>

      <rect x="556" y="64" width="150" height="68" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="631" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">WAL Sender 1</text>
      <text x="631" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">发送给 node2</text>

      <rect x="556" y="150" width="150" height="68" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="631" y="176" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">WAL Sender 2</text>
      <text x="631" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">发送给 node3</text>

      <line x1="244" y1="112" x2="322" y2="98" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-multi-wal)" />
      <line x1="244" y1="164" x2="322" y2="184" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-multi-wal)" />
      <line x1="472" y1="98" x2="556" y2="98" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-multi)" />
      <line x1="472" y1="184" x2="556" y2="184" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#pg-ha-arrow-multi)" />

      <line x1="556" y1="122" x2="472" y2="122" stroke="var(--d-green)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-multi)" />
      <line x1="556" y1="208" x2="472" y2="208" stroke="var(--d-green)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-multi)" />
      <text x="514" y="116" text-anchor="middle" font-size="10" fill="var(--d-green)">ACK</text>
      <text x="514" y="202" text-anchor="middle" font-size="10" fill="var(--d-green)">ACK</text>

      <rect x="142" y="230" width="476" height="26" rx="13" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="380" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        关键点：不是“轮流同步”，而是一个主库对多个副本并行流式复制
      </text>
    </svg>

    <svg
      v-else-if="kind === 'three-node-write-path'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="三节点写入同步路径图"
    >
      <defs>
        <marker id="pg-ha-arrow-write" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
        <marker id="pg-ha-arrow-write-wal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-orange)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        三节点下一次写入的真实路径：数据从 Primary 直接同步到副本，Patroni / etcd 只负责控制面
      </text>

      <rect x="34" y="114" width="130" height="48" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="99" y="144" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">Client</text>

      <rect x="214" y="88" width="214" height="100" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="321" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Primary</text>
      <text x="321" y="136" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">1. 写事务</text>
      <text x="321" y="154" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">2. 本地写 WAL</text>
      <text x="321" y="172" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">3. 并发发送给 node2 / node3</text>

      <rect x="506" y="54" width="140" height="70" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="576" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node2</text>
      <text x="576" y="98" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">接收 WAL</text>
      <text x="576" y="114" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">返回 ACK</text>

      <rect x="506" y="152" width="140" height="70" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="576" y="178" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node3</text>
      <text x="576" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">接收 WAL</text>
      <text x="576" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">返回 ACK</text>

      <rect x="698" y="82" width="126" height="112" rx="18" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="761" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">提交条件</text>
      <text x="761" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">异步：本地 WAL 后就返回</text>
      <text x="761" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">ANY 1：任意一个 ACK</text>
      <text x="761" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">ANY 2：两个 ACK 都到齐</text>
      <text x="761" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">决定何时向客户端提交</text>

      <line x1="164" y1="138" x2="214" y2="138" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-write)" />
      <line x1="428" y1="104" x2="506" y2="90" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-write-wal)" />
      <line x1="428" y1="172" x2="506" y2="186" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#pg-ha-arrow-write-wal)" />
      <line x1="646" y1="104" x2="698" y2="118" stroke="var(--d-green)" stroke-width="2" marker-end="url(#pg-ha-arrow-write)" />
      <line x1="646" y1="186" x2="698" y2="158" stroke="var(--d-green)" stroke-width="2" marker-end="url(#pg-ha-arrow-write)" />
      <line x1="698" y1="188" x2="164" y2="188" stroke="var(--d-green)" stroke-width="2" marker-end="url(#pg-ha-arrow-write)" />

      <rect x="214" y="232" width="610" height="34" rx="17" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="519" y="254" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">
        旁边的 Patroni / etcd 只负责 leader 锁、健康检查和故障切换，不参与 WAL 数据分发
      </text>
    </svg>

    <svg
      v-else-if="kind === 'lsn-compare'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="LSN 对比图"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        LSN 可以看成 WAL 流的位置坐标：位置越靠后，副本通常越新
      </text>

      <line x1="90" y1="120" x2="670" y2="120" stroke="var(--d-border)" stroke-width="3" />
      <line x1="140" y1="108" x2="140" y2="132" stroke="var(--d-border)" stroke-width="2" />
      <line x1="356" y1="108" x2="356" y2="132" stroke="var(--d-blue)" stroke-width="3" />
      <line x1="610" y1="104" x2="610" y2="136" stroke="var(--d-rv-c-border)" stroke-width="3" />

      <rect x="70" y="64" width="140" height="34" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="140" y="86" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">node3: 0/16B4A100</text>

      <rect x="286" y="152" width="140" height="34" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="356" y="174" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">node2: 0/16B4A2F8</text>

      <rect x="540" y="64" width="140" height="34" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="610" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">primary: 0/16B4A2F8</text>

      <text x="140" y="147" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">更早</text>
      <text x="610" y="147" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">更晚</text>

      <rect x="110" y="204" width="540" height="26" rx="13" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        这时通常说明 node2 已追平主库，而 node3 还落后一点，failover 时应优先选择更靠后的副本
      </text>
    </svg>

    <svg
      v-else-if="kind === 'commit-visibility'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="COMMIT 可见性图"
    >
      <defs>
        <marker id="pg-ha-arrow-commit" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        WAL 回放不会乱序：从库在看到 COMMIT 之前，不会把事务结果暴露给查询
      </text>

      <rect x="90" y="72" width="130" height="34" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="155" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">LSN 100: BEGIN</text>

      <rect x="250" y="72" width="130" height="34" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="315" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">LSN 101: INSERT</text>

      <rect x="410" y="72" width="130" height="34" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="475" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">LSN 102: UPDATE</text>

      <rect x="570" y="72" width="130" height="34" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="635" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">LSN 103: COMMIT</text>

      <line x1="220" y1="89" x2="250" y2="89" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-commit)" />
      <line x1="380" y1="89" x2="410" y2="89" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-commit)" />
      <line x1="540" y1="89" x2="570" y2="89" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-ha-arrow-commit)" />

      <rect x="96" y="152" width="268" height="34" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="230" y="174" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">只看到 BEGIN / INSERT / UPDATE，还不能对外可见</text>

      <rect x="396" y="152" width="268" height="34" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="530" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">看到 COMMIT 之后，这笔事务结果才算真正生效</text>
    </svg>

    <svg
      v-else-if="kind === 'replica-lagging'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="副本暂时落后图"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        副本暂时落后不一定是故障，只要 WAL 还在，慢副本通常会继续追平
      </text>

      <rect x="60" y="72" width="640" height="42" rx="12" fill="var(--d-rv-c-bg)" fill-opacity="0.22" stroke="var(--d-rv-c-border)" />
      <text x="120" y="98" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">主库</text>
      <g fill="var(--d-rv-c-text)">
        <rect x="170" y="82" width="42" height="22" rx="6" /><rect x="220" y="82" width="42" height="22" rx="6" />
        <rect x="270" y="82" width="42" height="22" rx="6" /><rect x="320" y="82" width="42" height="22" rx="6" />
        <rect x="370" y="82" width="42" height="22" rx="6" /><rect x="420" y="82" width="42" height="22" rx="6" />
      </g>
      <g font-size="11" fill="#fff" text-anchor="middle">
        <text x="191" y="97">1</text><text x="241" y="97">2</text><text x="291" y="97">3</text>
        <text x="341" y="97">4</text><text x="391" y="97">5</text><text x="441" y="97">6</text>
      </g>

      <rect x="60" y="124" width="640" height="42" rx="12" fill="var(--d-blue-bg)" fill-opacity="0.5" stroke="var(--d-blue-border)" />
      <text x="118" y="150" font-size="12" font-weight="700" fill="var(--d-text)">node2</text>
      <g fill="var(--d-blue)">
        <rect x="170" y="134" width="42" height="22" rx="6" /><rect x="220" y="134" width="42" height="22" rx="6" />
        <rect x="270" y="134" width="42" height="22" rx="6" /><rect x="320" y="134" width="42" height="22" rx="6" />
        <rect x="370" y="134" width="42" height="22" rx="6" /><rect x="420" y="134" width="42" height="22" rx="6" />
      </g>
      <g font-size="11" fill="#fff" text-anchor="middle">
        <text x="191" y="149">1</text><text x="241" y="149">2</text><text x="291" y="149">3</text>
        <text x="341" y="149">4</text><text x="391" y="149">5</text><text x="441" y="149">6</text>
      </g>

      <rect x="60" y="176" width="640" height="42" rx="12" fill="var(--d-blue-bg)" fill-opacity="0.5" stroke="var(--d-blue-border)" />
      <text x="118" y="202" font-size="12" font-weight="700" fill="var(--d-text)">node3</text>
      <g fill="var(--d-blue)">
        <rect x="170" y="186" width="42" height="22" rx="6" /><rect x="220" y="186" width="42" height="22" rx="6" />
        <rect x="270" y="186" width="42" height="22" rx="6" /><rect x="320" y="186" width="42" height="22" rx="6" />
      </g>
      <g font-size="11" fill="#fff" text-anchor="middle">
        <text x="191" y="201">1</text><text x="241" y="201">2</text><text x="291" y="201">3</text><text x="341" y="201">4</text>
      </g>
      <text x="420" y="202" font-size="10" fill="var(--d-text-muted)">5、6 还没追上</text>
    </svg>

    <svg
      v-else-if="kind === 'replica-down-any1'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="从库宕机但 ANY 1 仍可继续写图"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        node3 宕机时，如果使用 ANY 1，主库仍可依赖 node2 的确认继续对外写入
      </text>

      <rect x="60" y="72" width="640" height="42" rx="12" fill="var(--d-rv-c-bg)" fill-opacity="0.22" stroke="var(--d-rv-c-border)" />
      <text x="120" y="98" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">主库</text>
      <g fill="var(--d-rv-c-text)">
        <rect x="170" y="82" width="42" height="22" rx="6" /><rect x="220" y="82" width="42" height="22" rx="6" />
        <rect x="270" y="82" width="42" height="22" rx="6" /><rect x="320" y="82" width="42" height="22" rx="6" />
        <rect x="370" y="82" width="42" height="22" rx="6" /><rect x="420" y="82" width="42" height="22" rx="6" />
      </g>
      <g font-size="11" fill="#fff" text-anchor="middle">
        <text x="191" y="97">1</text><text x="241" y="97">2</text><text x="291" y="97">3</text>
        <text x="341" y="97">4</text><text x="391" y="97">5</text><text x="441" y="97">6</text>
      </g>

      <rect x="60" y="124" width="640" height="42" rx="12" fill="var(--d-blue-bg)" fill-opacity="0.5" stroke="var(--d-blue-border)" />
      <text x="118" y="150" font-size="12" font-weight="700" fill="var(--d-text)">node2</text>
      <g fill="var(--d-blue)">
        <rect x="170" y="134" width="42" height="22" rx="6" /><rect x="220" y="134" width="42" height="22" rx="6" />
        <rect x="270" y="134" width="42" height="22" rx="6" /><rect x="320" y="134" width="42" height="22" rx="6" />
        <rect x="370" y="134" width="42" height="22" rx="6" /><rect x="420" y="134" width="42" height="22" rx="6" />
      </g>
      <g font-size="11" fill="#fff" text-anchor="middle">
        <text x="191" y="149">1</text><text x="241" y="149">2</text><text x="291" y="149">3</text>
        <text x="341" y="149">4</text><text x="391" y="149">5</text><text x="441" y="149">6</text>
      </g>
      <text x="515" y="150" font-size="10" fill="var(--d-green)">仍可提供同步确认</text>

      <rect x="60" y="176" width="640" height="42" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="6 4" />
      <text x="118" y="202" font-size="12" font-weight="700" fill="var(--d-orange)">node3</text>
      <g fill="var(--d-text-dim)">
        <rect x="170" y="186" width="42" height="22" rx="6" /><rect x="220" y="186" width="42" height="22" rx="6" />
        <rect x="270" y="186" width="42" height="22" rx="6" />
      </g>
      <g font-size="11" fill="#fff" text-anchor="middle">
        <text x="191" y="201">1</text><text x="241" y="201">2</text><text x="291" y="201">3</text>
      </g>
      <text x="438" y="202" font-size="10" fill="var(--d-orange)">节点宕机，恢复后再继续追 WAL</text>
    </svg>

    <svg
      v-else-if="kind === 'worst-case-failover'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="最坏情况 failover 图"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        最坏情况：主库和唯一同步副本一起故障，只剩落后的异步副本可接管
      </text>

      <rect x="80" y="88" width="160" height="70" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="6 4" />
      <text x="160" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-orange)">node1</text>
      <text x="160" y="132" text-anchor="middle" font-size="10" fill="var(--d-orange)">主库故障</text>

      <rect x="300" y="88" width="160" height="70" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="6 4" />
      <text x="380" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-orange)">node2</text>
      <text x="380" y="132" text-anchor="middle" font-size="10" fill="var(--d-orange)">唯一同步副本也故障</text>

      <rect x="520" y="74" width="160" height="98" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="600" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node3</text>
      <text x="600" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">仅剩可接管副本</text>
      <text x="600" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">但只追到更早 LSN</text>
      <text x="600" y="154" text-anchor="middle" font-size="10" fill="var(--d-orange)">最近一小段 WAL 可能丢失</text>

      <rect x="154" y="198" width="452" height="28" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="380" y="217" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">
        想避免这个窗口，要把策略提高到 ANY 2，但代价是任一副本异常都会拖慢甚至阻塞写入
      </text>
    </svg>

    <svg
      v-else-if="kind === 'recovery-wal-available'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WAL 还在时的副本恢复图"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        副本恢复最理想的情况：复制槽还在、主库也还保留着需要的 WAL
      </text>

      <rect x="88" y="76" width="220" height="58" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="198" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node3 挂之前</text>
      <text x="198" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">[1] [2] [3] [4]</text>

      <rect x="452" y="64" width="220" height="82" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="562" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">主库现在</text>
      <text x="562" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">[1] [2] [3] [4] [5] [6] [7] [8]</text>
      <text x="562" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">旧 WAL 还在，可从断点继续追</text>

      <rect x="180" y="172" width="400" height="28" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="380" y="191" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">
        node3 恢复后：WAL Receiver 自动重连，从断开的 LSN 位置继续追，最终自动追平
      </text>
    </svg>

    <svg
      v-else-if="kind === 'recovery-wal-missing'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WAL 丢失时的副本恢复失败图"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        如果复制槽被删、主库又清掉了旧 WAL，副本就无法从原断点自动追平
      </text>

      <rect x="104" y="74" width="252" height="80" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="230" y="102" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">node3 恢复时的诉求</text>
      <text x="230" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">我要从较早的 LSN 开始接收</text>
      <text x="230" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">比如从 LSN 5 继续追</text>

      <rect x="404" y="74" width="252" height="80" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.5" />
      <text x="530" y="102" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-orange)">主库的现实状态</text>
      <text x="530" y="124" text-anchor="middle" font-size="10" fill="var(--d-orange)">对应旧 WAL 已被清理</text>
      <text x="530" y="142" text-anchor="middle" font-size="10" fill="var(--d-orange)">自动追平失败</text>

      <rect x="170" y="176" width="420" height="24" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="380" y="193" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">这时只能重新做基础备份或执行 Patroni reinit</text>
    </svg>

    <svg
      v-else-if="kind === 'patronictl-list-output'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="patronictl list 输出示例"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Patroni 集群状态示例：可以一眼看出当前 Leader、各副本角色和流复制状态
      </text>

      <rect x="60" y="54" width="640" height="180" rx="18" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <rect x="84" y="78" width="592" height="34" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />

      <text x="132" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Member</text>
      <text x="270" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Host</text>
      <text x="400" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Role</text>
      <text x="500" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">TL</text>
      <text x="610" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">State</text>

      <rect x="84" y="122" width="592" height="30" rx="8" fill="var(--d-rv-c-bg)" fill-opacity="0.28" stroke="var(--d-rv-c-border)" />
      <rect x="84" y="160" width="592" height="30" rx="8" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <rect x="84" y="198" width="592" height="30" rx="8" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />

      <text x="132" y="142" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">node1</text>
      <text x="270" y="142" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">192.168.1.11</text>
      <text x="400" y="142" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">Leader</text>
      <text x="500" y="142" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">1</text>
      <text x="610" y="142" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">running</text>

      <text x="132" y="180" text-anchor="middle" font-size="11" fill="var(--d-text)">node2</text>
      <text x="270" y="180" text-anchor="middle" font-size="11" fill="var(--d-text)">192.168.1.12</text>
      <text x="400" y="180" text-anchor="middle" font-size="11" fill="var(--d-text)">Replica</text>
      <text x="500" y="180" text-anchor="middle" font-size="11" fill="var(--d-text)">1</text>
      <text x="610" y="180" text-anchor="middle" font-size="11" fill="var(--d-text)">streaming</text>

      <text x="132" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">node3</text>
      <text x="270" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">192.168.1.13</text>
      <text x="400" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">Replica</text>
      <text x="500" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">1</text>
      <text x="610" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">streaming</text>
    </svg>

    <svg
      v-else-if="kind === 'wal-example-log'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WAL 记录样例"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        WAL 可以理解为按 LSN 递增排列的变更日志流，副本同步本质上就是持续接收并回放这条日志流
      </text>

      <line x1="94" y1="116" x2="666" y2="116" stroke="var(--d-border)" stroke-width="3" />

      <rect x="94" y="78" width="172" height="56" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="180" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">LSN 0/3000028</text>
      <text x="180" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">INSERT into users</text>

      <rect x="294" y="78" width="172" height="56" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="380" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">LSN 0/3000060</text>
      <text x="380" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">UPDATE orders set status='paid'</text>

      <rect x="494" y="78" width="172" height="56" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="580" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">LSN 0/3000098</text>
      <text x="580" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">DELETE from logs where id &lt; 1000</text>

      <text x="180" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">更早的 WAL</text>
      <text x="580" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">更晚的 WAL</text>

      <rect x="126" y="188" width="508" height="24" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="380" y="205" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">LSN 单调递增，副本只要按顺序接收和回放，就能逐步逼近主库状态</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-status-output'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="pg_stat_replication 输出示例"
    >
      <text x="380" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        pg_stat_replication 示例：既能看同步角色，也能看副本的回放延迟
      </text>

      <rect x="50" y="58" width="660" height="154" rx="18" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <rect x="74" y="82" width="612" height="34" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />

      <text x="170" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">client_addr</text>
      <text x="308" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">state</text>
      <text x="448" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">sync_state</text>
      <text x="610" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">replay_lag_bytes</text>

      <rect x="74" y="126" width="612" height="30" rx="8" fill="var(--d-rv-a-bg)" fill-opacity="0.2" stroke="var(--d-rv-a-border)" />
      <rect x="74" y="164" width="612" height="30" rx="8" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />

      <text x="170" y="146" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">192.168.1.12</text>
      <text x="308" y="146" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">streaming</text>
      <text x="448" y="146" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">sync</text>
      <text x="610" y="146" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">0</text>

      <text x="170" y="184" text-anchor="middle" font-size="11" fill="var(--d-text)">192.168.1.13</text>
      <text x="308" y="184" text-anchor="middle" font-size="11" fill="var(--d-text)">streaming</text>
      <text x="448" y="184" text-anchor="middle" font-size="11" fill="var(--d-text)">async</text>
      <text x="610" y="184" text-anchor="middle" font-size="11" fill="var(--d-text)">1024</text>
    </svg>
  </DiagramFrame>
</template>
