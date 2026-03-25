<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type FigureKind =
  | 'simplekv-modules'
  | 'simplekv-to-redis'
  | 'io-throughput-threads'
  | 'io-lock-contention'
  | 'io-single-thread-path'
  | 'io-socket-types'
  | 'io-epoll-loop'
  | 'aof-write-after'
  | 'aof-command-format'
  | 'aof-fsync-policies'
  | 'aof-rewrite-compression'
  | 'aof-rewrite-two-logs'
  | 'rdb-cow-snapshot'
  | 'rdb-snapshot-interval'
  | 'rdb-incremental-metadata'
  | 'rdb-aof-hybrid'
  | 'replication-read-write-split'
  | 'replication-full-sync-stages'
  | 'replication-cascade'
  | 'replication-backlog-offsets'
  | 'replication-incremental-resync'
  | 'sentinel-master-down'
  | 'sentinel-three-tasks'
  | 'sentinel-quorum'
  | 'sentinel-filter-score'
  | 'sentinel-offset-score'
  | 'cluster-shard-splitting'
  | 'cluster-scale-up-out'
  | 'cluster-slot-mapping'
  | 'cluster-moved'
  | 'cluster-ask'
  | 'lock-compete'
  | 'lock-release'
  | 'split-brain-unsynced-loss'
  | 'split-brain-formation'
  | 'split-brain-resync-loss'

const props = defineProps<{
  kind: FigureKind
}>()

const maxWidthByKind: Record<FigureKind, string> = {
  'simplekv-modules': '860px',
  'simplekv-to-redis': '920px',
  'io-throughput-threads': '780px',
  'io-lock-contention': '820px',
  'io-single-thread-path': '920px',
  'io-socket-types': '820px',
  'io-epoll-loop': '920px',
  'aof-write-after': '760px',
  'aof-command-format': '760px',
  'aof-fsync-policies': '860px',
  'aof-rewrite-compression': '760px',
  'aof-rewrite-two-logs': '820px',
  'rdb-cow-snapshot': '780px',
  'rdb-snapshot-interval': '760px',
  'rdb-incremental-metadata': '760px',
  'rdb-aof-hybrid': '760px',
  'replication-read-write-split': '760px',
  'replication-full-sync-stages': '860px',
  'replication-cascade': '760px',
  'replication-backlog-offsets': '780px',
  'replication-incremental-resync': '780px',
  'sentinel-master-down': '760px',
  'sentinel-three-tasks': '820px',
  'sentinel-quorum': '820px',
  'sentinel-filter-score': '820px',
  'sentinel-offset-score': '760px',
  'cluster-shard-splitting': '760px',
  'cluster-scale-up-out': '760px',
  'cluster-slot-mapping': '820px',
  'cluster-moved': '820px',
  'cluster-ask': '820px',
  'lock-compete': '780px',
  'lock-release': '780px',
  'split-brain-unsynced-loss': '840px',
  'split-brain-formation': '900px',
  'split-brain-resync-loss': '900px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'simplekv-modules'"
      viewBox="0 0 860 310"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SimpleKV 基本组件图"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">一个最小可用的键值数据库，通常由访问框架、索引模块、操作模块和存储模块四部分组成</text>

      <rect x="316" y="56" width="228" height="94" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">访问框架</text>
      <rect x="338" y="98" width="90" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="383" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">libsimplekv.so</text>
      <rect x="434" y="98" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="478" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Socket Server</text>
      <text x="478" y="124" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">协议解析</text>

      <rect x="58" y="192" width="208" height="86" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="162" y="218" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">索引模块</text>
      <text x="162" y="242" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">负责根据 key 快速定位数据</text>
      <text x="162" y="260" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">常见实现：哈希表 / 跳表 / B+ 树</text>

      <rect x="326" y="192" width="208" height="86" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="430" y="218" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">操作模块</text>
      <text x="430" y="242" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">解析并执行读 / 写 / 删除等命令</text>
      <text x="430" y="260" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">把访问请求转成真正的数据操作</text>

      <rect x="594" y="192" width="208" height="86" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="698" y="218" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">存储模块</text>
      <text x="698" y="242" text-anchor="middle" font-size="10" fill="var(--d-text)">保存键值数据</text>
      <text x="698" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">可在内存、SSD 或磁盘中落地</text>

      <line x1="430" y1="150" x2="162" y2="192" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <line x1="430" y1="150" x2="430" y2="192" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <line x1="430" y1="150" x2="698" y2="192" stroke="var(--d-blue-border)" stroke-width="1.5" />

      <text x="430" y="298" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Redis 可以把它看成是在这四部分上持续做工程化增强的“富豪版 SimpleKV”</text>
    </svg>

    <svg
      v-else-if="kind === 'simplekv-to-redis'"
      viewBox="0 0 920 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SimpleKV 演进到 Redis 图"
      role="img"
    >
      <text x="460" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">从 SimpleKV 走到 Redis，本质上是把同一套组件做成了更完整的网络服务、数据引擎和高可用系统</text>

      <rect x="42" y="62" width="310" height="178" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="197" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">SimpleKV</text>
      <rect x="72" y="112" width="250" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="197" y="134" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">动态库 / 简单 Socket 接入</text>
      <rect x="72" y="156" width="250" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="197" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">基础键值索引与读写操作</text>
      <rect x="72" y="200" width="250" height="24" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.1" />
      <text x="197" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适合理解 KV 数据库最小骨架</text>

      <line x1="388" y1="150" x2="532" y2="150" stroke="var(--d-blue-border)" stroke-width="2" />
      <polygon points="532,150 516,142 516,158" fill="var(--d-blue-border)" />
      <text x="460" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">功能扩展 + 性能优化 + 高可用能力</text>

      <rect x="568" y="42" width="310" height="218" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="723" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-a-text)">Redis</text>
      <rect x="598" y="92" width="250" height="30" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="723" y="112" text-anchor="middle" font-size="9" fill="var(--d-text)">高性能网络框架 + 单线程事件循环</text>
      <rect x="598" y="130" width="250" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.1" />
      <text x="723" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">String / List / Hash / Set / ZSet 等丰富结构</text>
      <rect x="598" y="168" width="250" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="723" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">AOF / RDB 持久化与 Lua、事务、异步机制</text>
      <rect x="598" y="206" width="250" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="723" y="226" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">主从复制、哨兵、Cluster 组成完整服务体系</text>

      <text x="460" y="280" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">理解这张演进图后，后续每一讲其实都在解释 Redis 是如何把这套骨架补强到生产级的</text>
    </svg>

    <svg
      v-else-if="kind === 'io-throughput-threads'"
      viewBox="0 0 780 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="线程数与吞吐率关系图"
      role="img"
    >
      <text x="390" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">多线程并不保证吞吐率一直上涨：理想曲线持续上升，现实曲线常常在锁竞争和调度开销下变平甚至下滑</text>

      <line x1="84" y1="212" x2="706" y2="212" stroke="var(--d-border)" stroke-width="1.5" />
      <line x1="84" y1="212" x2="84" y2="48" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="706" y="232" text-anchor="end" font-size="10" fill="var(--d-text-muted)">线程数</text>
      <text x="58" y="58" text-anchor="middle" font-size="10" fill="var(--d-text-muted)" transform="rotate(-90 58 58)">吞吐率</text>

      <polyline points="96,198 184,168 280,138 382,110 494,80 640,58" fill="none" stroke="var(--d-rv-a-border)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <text x="606" y="74" font-size="10" fill="var(--d-rv-a-text)">理想情况</text>
      <text x="606" y="88" font-size="9" fill="var(--d-rv-a-text)">线程更多，吞吐继续涨</text>

      <polyline points="96,198 184,164 280,136 382,126 494,128 606,142 670,160" fill="none" stroke="var(--d-blue-border)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <text x="536" y="156" font-size="10" fill="var(--d-text)">真实系统</text>
      <text x="536" y="170" font-size="9" fill="var(--d-text-sub)">共享资源竞争后增益变小</text>

      <circle cx="494" cy="128" r="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="512" y="122" font-size="9" fill="var(--d-warn-text)">锁竞争、线程切换</text>
      <text x="512" y="136" font-size="9" fill="var(--d-warn-text)">缓存失效等开销开始吞噬收益</text>

      <text x="390" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Redis 选择单线程执行命令，核心就是主动避开这类共享状态并发控制成本</text>
    </svg>

    <svg
      v-else-if="kind === 'io-lock-contention'"
      viewBox="0 0 820 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="多线程访问共享 List 的锁竞争图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">如果多个线程同时改同一个 List，真正难的不是命令本身，而是要额外保证共享状态例如队列长度的一致性</text>

      <rect x="42" y="86" width="148" height="90" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="116" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">线程 A</text>
      <text x="116" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">LPUSH user:list v1</text>
      <text x="116" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">长度 +1</text>

      <rect x="630" y="86" width="148" height="90" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="704" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">线程 B</text>
      <text x="704" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">LPOP user:list</text>
      <text x="704" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">长度 -1</text>

      <rect x="286" y="84" width="248" height="98" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="410" y="110" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">共享资源</text>
      <text x="410" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">List 内容</text>
      <text x="410" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">队列长度 length</text>

      <circle cx="410" cy="224" r="42" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="410" y="218" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">互斥锁 /</text>
      <text x="410" y="234" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">并发控制</text>

      <line x1="190" y1="132" x2="286" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="534" y1="132" x2="630" y2="132" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <line x1="116" y1="176" x2="376" y2="218" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="704" y1="176" x2="444" y2="218" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />

      <text x="410" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">线程越多，并发控制越重；这正是 Redis 偏向单线程命令执行的重要原因</text>
    </svg>

    <svg
      v-else-if="kind === 'io-single-thread-path'"
      viewBox="0 0 920 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="单线程处理请求路径图"
      role="img"
    >
      <text x="460" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">在最朴素的实现里，单线程会沿着 bind/listen → accept → recv → parse → get → send 这条路径串行处理一次请求</text>

      <rect x="30" y="82" width="890" height="96" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <rect x="48" y="100" width="120" height="58" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="108" y="125" text-anchor="middle" font-size="10" fill="var(--d-text)">bind / listen</text>
      <text x="108" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">监听连接</text>

      <rect x="188" y="100" width="120" height="58" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="248" y="125" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">accept</text>
      <text x="248" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">建立连接</text>

      <rect x="328" y="100" width="120" height="58" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="388" y="125" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">recv</text>
      <text x="388" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">读取请求</text>

      <rect x="468" y="100" width="120" height="58" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="528" y="125" text-anchor="middle" font-size="10" fill="var(--d-text)">parse</text>
      <text x="528" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">解析命令</text>

      <rect x="608" y="100" width="120" height="58" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="668" y="125" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">get</text>
      <text x="668" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">查索引 / 取数据</text>

      <rect x="748" y="100" width="120" height="58" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="808" y="125" text-anchor="middle" font-size="10" fill="var(--d-text)">send</text>
      <text x="808" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">返回结果</text>

      <line x1="168" y1="129" x2="188" y2="129" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="308" y1="129" x2="328" y2="129" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="448" y1="129" x2="468" y2="129" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="588" y1="129" x2="608" y2="129" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="728" y1="129" x2="748" y2="129" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <text x="458" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">其中 accept 和 recv 最容易把线程卡住，所以 Redis 需要非阻塞 socket 和 IO 多路复用来避免“一处等待，全局停摆”</text>
    </svg>

    <svg
      v-else-if="kind === 'io-socket-types'"
      viewBox="0 0 820 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="socket 不同阶段返回的套接字类型图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">socket 模型里，主动套接字经过 listen 变成监听套接字，再由 accept 产出已连接套接字</text>

      <rect x="40" y="92" width="180" height="94" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="130" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">socket()</text>
      <text x="130" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">主动套接字</text>
      <text x="130" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">还不能监听客户端连接</text>

      <rect x="320" y="72" width="180" height="134" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="410" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">listen()</text>
      <text x="410" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">监听套接字</text>
      <text x="410" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">等待连接请求到达</text>
      <text x="410" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">这里常配合非阻塞模式</text>
      <text x="410" y="180" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">并交给 epoll 统一监听</text>

      <rect x="600" y="92" width="180" height="94" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="690" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">accept()</text>
      <text x="690" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">已连接套接字</text>
      <text x="690" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">后续 recv / send 都在这里进行</text>

      <line x1="220" y1="138" x2="320" y2="138" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="270" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">listen</text>
      <line x1="500" y1="138" x2="600" y2="138" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="550" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">accept</text>

      <text x="410" y="244" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">理解这三类 socket 的职责分工后，就更容易明白 Redis 为什么能用一个线程同时盯住很多连接</text>
    </svg>

    <svg
      v-else-if="kind === 'io-epoll-loop'"
      viewBox="0 0 920 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="epoll 驱动的 Redis 单线程 IO 模型图"
      role="img"
    >
      <text x="460" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">IO 多路复用把“很多 socket 的等待”挪到内核里，Redis 线程只在有事件就绪时被唤醒处理</text>

      <rect x="34" y="76" width="140" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="104" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端 A</text>
      <rect x="34" y="136" width="140" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="104" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端 B</text>
      <rect x="34" y="196" width="140" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="104" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端 C</text>

      <rect x="250" y="52" width="264" height="196" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="382" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">内核中的 epoll / select</text>
      <rect x="278" y="102" width="208" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="382" y="124" text-anchor="middle" font-size="9" fill="var(--d-text)">监听 FD</text>
      <rect x="278" y="146" width="208" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="382" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">已连接 FD-1</text>
      <rect x="278" y="190" width="208" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="382" y="212" text-anchor="middle" font-size="9" fill="var(--d-text)">已连接 FD-2 ... FD-N</text>

      <rect x="596" y="72" width="290" height="156" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="741" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">Redis 单线程事件循环</text>
      <rect x="626" y="118" width="230" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="741" y="136" text-anchor="middle" font-size="9" fill="var(--d-text)">acceptHandler: 处理新连接</text>
      <rect x="626" y="154" width="230" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="741" y="172" text-anchor="middle" font-size="9" fill="var(--d-text)">readHandler: 读取并解析请求</text>
      <rect x="626" y="190" width="230" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="741" y="208" text-anchor="middle" font-size="9" fill="var(--d-text)">writeHandler: 回写结果</text>

      <line x1="174" y1="100" x2="250" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="174" y1="160" x2="250" y2="162" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="174" y1="220" x2="250" y2="214" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="514" y1="150" x2="596" y2="150" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="555" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">事件就绪后唤醒</text>

      <text x="460" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以 Redis 不是“只有一个连接”，而是“一个线程顺序处理很多已就绪连接上的事件”</text>
    </svg>

    <svg
      v-else-if="kind === 'aof-write-after'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AOF 写后日志流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AOF 是写后日志：先执行命令改内存，再把命令追加到 AOF 文件</text>

      <rect x="30" y="98" width="112" height="46" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="86" y="125" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端写命令</text>

      <rect x="190" y="68" width="164" height="108" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="272" y="92" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">Redis 主线程</text>
      <text x="272" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">1. 解析命令</text>
      <text x="272" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">2. 修改内存数据</text>
      <text x="272" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">3. 生成 AOF 追加内容</text>

      <rect x="410" y="98" width="124" height="46" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="472" y="125" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">内存最新状态</text>

      <rect x="582" y="78" width="148" height="86" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="656" y="102" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">AOF 文件</text>
      <text x="656" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">记录命令文本</text>
      <text x="656" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不是内存页镜像</text>

      <line x1="142" y1="121" x2="190" y2="121" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="354" y1="121" x2="410" y2="121" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="354" y1="146" x2="582" y2="146" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">好处是不会把错误命令先写进日志；代价是命令执行成功但日志还没落盘时，仍可能丢最近的数据</text>
    </svg>

    <svg
      v-else-if="kind === 'aof-command-format'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AOF 命令记录格式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AOF 存的是 Redis 命令协议内容，恢复时本质上是把这些命令重新执行一遍</text>

      <rect x="34" y="82" width="692" height="110" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="90" y="114" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--d-text)">*</text>
      <text x="118" y="114" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">3</text>

      <rect x="166" y="94" width="128" height="64" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="230" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">$3</text>
      <text x="230" y="138" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">SET</text>

      <rect x="318" y="94" width="128" height="64" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="382" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">$7</text>
      <text x="382" y="138" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">testkey</text>

      <rect x="470" y="94" width="180" height="64" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="560" y="118" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">$9</text>
      <text x="560" y="138" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">testvalue</text>

      <text x="230" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">命令部分</text>
      <text x="382" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">键</text>
      <text x="560" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">值</text>

      <text x="380" y="216" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">前面的数字描述后续字节长度，所以 AOF 既容易追加，也方便恢复时按协议重新解析</text>
    </svg>

    <svg
      v-else-if="kind === 'aof-fsync-policies'"
      viewBox="0 0 860 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AOF 写回策略对比图"
      role="img"
    >
      <text x="430" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">appendfsync 的三种策略，本质上是在“更少丢数据”和“更少卡主线程”之间做取舍</text>

      <rect x="24" y="58" width="250" height="186" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="149" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">Always</text>
      <text x="149" y="112" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">每条写命令后都同步刷盘</text>
      <text x="149" y="138" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">优点：可靠性最高</text>
      <text x="149" y="156" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险：每次写都容易拖慢主线程</text>
      <text x="149" y="196" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适合：极度怕丢数据</text>

      <rect x="304" y="58" width="250" height="186" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="429" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">Everysec</text>
      <text x="429" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">先写缓冲区，每秒刷盘一次</text>
      <text x="429" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">优点：性能与可靠性的折中</text>
      <text x="429" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">风险：宕机时最多丢 1 秒数据</text>
      <text x="429" y="196" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">适合：大多数线上默认选择</text>

      <rect x="584" y="58" width="250" height="186" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="709" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">No</text>
      <text x="709" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">交给操作系统决定何时刷盘</text>
      <text x="709" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：主线程性能压力最小</text>
      <text x="709" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">风险：未刷盘窗口更大</text>
      <text x="709" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：能接受更多丢失风险</text>

      <text x="430" y="268" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">记忆方式：可靠性 Always > Everysec > No；性能则正好反过来</text>
    </svg>

    <svg
      v-else-if="kind === 'aof-rewrite-compression'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AOF 重写压缩图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AOF 重写不是把旧文件压缩一下，而是按“当前最终状态”重新生成更短的新命令集合</text>

      <rect x="32" y="62" width="250" height="142" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="157" y="88" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">旧 AOF</text>
      <text x="157" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">LPUSH u:list A</text>
      <text x="157" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">LPUSH u:list B</text>
      <text x="157" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">LPOP u:list</text>
      <text x="157" y="168" text-anchor="middle" font-size="10" fill="var(--d-text)">LPUSH u:list C</text>
      <text x="157" y="186" text-anchor="middle" font-size="10" fill="var(--d-text)">LPUSH u:list D</text>

      <line x1="282" y1="132" x2="474" y2="132" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <text x="378" y="122" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">按最终结果重写</text>

      <rect x="474" y="86" width="254" height="92" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="601" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">新 AOF</text>
      <text x="601" y="138" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">LPUSH u:list N C D</text>
      <text x="601" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">一条命令直接还原最终状态</text>

      <text x="380" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这就是“多变一”：不是保留历史过程，而是保留恢复当前数据所需的最短命令表达</text>
    </svg>

    <svg
      v-else-if="kind === 'aof-rewrite-two-logs'"
      viewBox="0 0 820 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AOF 重写一份拷贝两处日志图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AOF 重写的关键心智模型：一个数据拷贝，两处日志同时接收新增写入</text>

      <rect x="28" y="88" width="176" height="104" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="116" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">主进程内存</text>
      <text x="116" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">继续处理新请求</text>
      <text x="116" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">fork 后仍保持可写</text>

      <rect x="256" y="72" width="146" height="136" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="329" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">bgrewriteaof 子进程</text>
      <text x="329" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">基于 fork 时的内存视图</text>
      <text x="329" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">重写新的 AOF 文件</text>
      <text x="329" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不阻塞主线程执行业务</text>

      <rect x="468" y="64" width="142" height="66" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="539" y="90" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">旧 AOF</text>
      <text x="539" y="110" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">线上仍在追加写命令</text>

      <rect x="468" y="146" width="142" height="66" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="539" y="172" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">重写缓冲区 / 新 AOF</text>
      <text x="539" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">也要补上重写期间的新命令</text>

      <rect x="660" y="106" width="132" height="64" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="726" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">重写结束后</text>
      <text x="726" y="150" text-anchor="middle" font-size="9" fill="var(--d-text)">新 AOF 替换旧 AOF</text>

      <line x1="204" y1="140" x2="256" y2="140" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="204" y1="114" x2="468" y2="96" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="204" y1="166" x2="468" y2="178" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="610" y1="178" x2="660" y2="138" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <text x="410" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以重写期间主线程还能服务请求，但新写入既要进入旧 AOF 保证可恢复，也要补进新文件保证切换后状态完整</text>
    </svg>

    <svg
      v-else-if="kind === 'rdb-cow-snapshot'"
      viewBox="0 0 780 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RDB 写时复制图"
      role="img"
    >
      <text x="390" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">bgsave 能边服务写请求边做快照，靠的是 fork 后的写时复制，而不是所有写入都被冻结</text>

      <rect x="32" y="84" width="184" height="118" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="124" y="108" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">主进程内存</text>
      <rect x="60" y="126" width="34" height="34" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <rect x="106" y="126" width="34" height="34" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <rect x="152" y="126" width="34" height="34" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="77" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">A</text>
      <text x="123" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">B</text>
      <text x="169" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">C</text>
      <text x="124" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">主线程继续处理读写</text>

      <rect x="294" y="70" width="184" height="146" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="386" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">bgsave 子进程</text>
      <text x="386" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">先共享原内存页视图</text>
      <text x="386" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">按快照时刻把数据写入 RDB</text>
      <text x="386" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">A、B 直接复用</text>
      <text x="386" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">C 在主进程改写时触发复制</text>

      <rect x="560" y="96" width="176" height="92" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="648" y="120" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">RDB 文件</text>
      <text x="648" y="144" text-anchor="middle" font-size="10" fill="var(--d-text)">保存快照时刻的 A/B/C</text>
      <text x="648" y="162" text-anchor="middle" font-size="10" fill="var(--d-text)">不是修改后的新 C</text>

      <line x1="216" y1="142" x2="294" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="478" y1="142" x2="560" y2="142" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="170" y1="160" x2="330" y2="196" stroke="var(--d-warn-border)" stroke-width="1.4" />

      <text x="390" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">代价是如果写很多，COW 会让额外内存占用升高，所以大实例、高写入时做快照会更吃资源</text>
    </svg>

    <svg
      v-else-if="kind === 'rdb-snapshot-interval'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RDB 快照间隔图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">快照不是连续录像，T0 和 T0+t 之间发生的修改，只有下一次快照完成后才真正被纳入快照恢复点</text>

      <line x1="90" y1="132" x2="676" y2="132" stroke="var(--d-border)" stroke-width="1.5" />
      <circle cx="150" cy="132" r="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <circle cx="620" cy="132" r="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="150" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">T0</text>
      <text x="620" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">T0+t</text>

      <rect x="112" y="72" width="76" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="150" y="94" text-anchor="middle" font-size="9" fill="var(--d-text)">快照 1</text>

      <rect x="582" y="72" width="76" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="620" y="94" text-anchor="middle" font-size="9" fill="var(--d-text)">快照 2</text>

      <rect x="250" y="152" width="88" height="38" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="294" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">数据块 5 改动</text>

      <rect x="382" y="152" width="88" height="38" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="426" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">数据块 9 改动</text>

      <rect x="500" y="148" width="90" height="46" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="545" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">如果此时宕机</text>
      <text x="545" y="186" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只能恢复到 T0</text>

      <text x="380" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此快照越稀疏，恢复越快但 RPO 越大；快照越频繁，RPO 变小但 fork 和磁盘开销都会上来</text>
    </svg>

    <svg
      v-else-if="kind === 'rdb-incremental-metadata'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="增量快照元数据开销图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">增量快照看起来节省 I/O，但前提是你得额外维护“哪些数据改过”的元信息</text>

      <rect x="34" y="72" width="190" height="136" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="129" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">第一次全量快照</text>
      <text x="129" y="122" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">数据块 1..N 全部进入 RDB</text>
      <text x="129" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">恢复简单</text>

      <rect x="284" y="72" width="190" height="136" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="379" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">后续增量快照</text>
      <text x="379" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">只写数据块 5、9</text>
      <text x="379" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">磁盘量变小</text>
      <text x="379" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">但要知道谁被改过</text>

      <rect x="534" y="72" width="190" height="136" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="629" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">元数据账本</text>
      <text x="629" y="122" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">记录块 5 已修改</text>
      <text x="629" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">记录块 9 已修改</text>
      <text x="629" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">数据越小，元信息占比越显眼</text>

      <text x="380" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这就是课程里说 Redis 没直接走增量快照的原因：节省下的写盘量，可能被“追踪改动”的内存和复杂度成本吃掉</text>
    </svg>

    <svg
      v-else-if="kind === 'rdb-aof-hybrid'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RDB 与 AOF 混合持久化图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">混合持久化的思路是：用 RDB 扛恢复速度，用两次快照之间的 AOF 扛最近增量</text>

      <line x1="74" y1="128" x2="686" y2="128" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="110" y="78" width="90" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="155" y="100" text-anchor="middle" font-size="9" fill="var(--d-text)">RDB 快照 1</text>
      <rect x="540" y="78" width="90" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="585" y="100" text-anchor="middle" font-size="9" fill="var(--d-text)">RDB 快照 2</text>

      <rect x="236" y="146" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="280" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">T1 命令</text>
      <rect x="346" y="146" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">T2 命令</text>
      <rect x="456" y="146" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="500" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">T3 命令</text>

      <rect x="236" y="62" width="308" height="24" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="390" y="78" text-anchor="middle" font-size="9" fill="var(--d-text)">这段时间内的写操作进入 AOF，直到下一次快照完成再截断</text>

      <text x="380" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">恢复时先用最近 RDB 快速装载主体数据，再回放这小段 AOF 补齐尾部增量，兼顾恢复速度和数据新鲜度</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-read-write-split'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="主从读写分离图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">主从复制先用读写分离把“一致性维护成本”压到可接受范围：写只进主库，读可以分摊到从库</text>

      <rect x="56" y="94" width="116" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="114" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端写请求</text>
      <rect x="56" y="158" width="116" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="114" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端读请求</text>

      <rect x="278" y="84" width="152" height="132" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="354" y="110" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">主库</text>
      <text x="354" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">接收所有写操作</text>
      <text x="354" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">把命令复制给从库</text>

      <rect x="540" y="64" width="144" height="64" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="612" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">从库 A</text>
      <text x="612" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">可承担读请求</text>

      <rect x="540" y="152" width="144" height="64" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="612" y="176" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">从库 B</text>
      <text x="612" y="194" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">可承担读请求</text>

      <line x1="172" y1="118" x2="278" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="172" y1="182" x2="278" y2="170" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="430" y1="118" x2="540" y2="96" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="430" y1="170" x2="540" y2="184" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <text x="380" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">如果主从都能随便接写，请求顺序和版本协调会立刻复杂化，所以复制体系先用“主写从读”换来可控的一致性模型</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-full-sync-stages'"
      viewBox="0 0 860 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="主从全量同步三阶段图"
      role="img"
    >
      <text x="430" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">第一次全量同步可以拆成三段：协商、传 RDB、再补齐 RDB 期间产生的新写命令</text>

      <rect x="40" y="92" width="150" height="120" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="115" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">阶段 1</text>
      <text x="115" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">从库发 psync ? -1</text>
      <text x="115" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">主库回 FULLRESYNC</text>
      <text x="115" y="178" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">协商本次全量复制</text>

      <rect x="244" y="92" width="172" height="120" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="330" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">阶段 2</text>
      <text x="330" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">主库 bgsave 生成 RDB</text>
      <text x="330" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">把 RDB 传给从库</text>
      <text x="330" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">从库清空并加载</text>

      <rect x="470" y="92" width="172" height="120" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="556" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">阶段 3</text>
      <text x="556" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">主库把 replication buffer</text>
      <text x="556" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">中积累的新命令再发一遍</text>
      <text x="556" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">从库回放补齐差值</text>

      <rect x="696" y="92" width="124" height="120" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="758" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">结果</text>
      <text x="758" y="142" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">从库数据追平主库</text>
      <text x="758" y="160" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">进入长连接命令传播</text>

      <line x1="190" y1="152" x2="244" y2="152" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="416" y1="152" x2="470" y2="152" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <line x1="642" y1="152" x2="696" y2="152" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <text x="430" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">注意第二阶段生成 RDB 时主库并没停写，所以第三阶段补命令是必需的，不然从库只能回到“快照时刻”而不是“当前时刻”</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-cascade'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="主从级联复制图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">主从级联的目的不是层级更复杂，而是让主库少扛几轮 RDB 生成和网络传输压力</text>

      <rect x="40" y="98" width="120" height="52" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="126" text-anchor="middle" font-size="11" fill="var(--d-text)">主库</text>

      <rect x="264" y="98" width="136" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="332" y="126" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">一级从库</text>

      <rect x="520" y="54" width="136" height="52" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="588" y="82" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">二级从库 A</text>

      <rect x="520" y="142" width="136" height="52" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="588" y="170" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">二级从库 B</text>

      <line x1="160" y1="124" x2="264" y2="124" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="400" y1="124" x2="520" y2="80" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="400" y1="124" x2="520" y2="168" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <rect x="182" y="188" width="312" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="338" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">主库只和一级从库做全量同步，后面的从库改由一级从库继续分发，减轻主库 fork 和传输压力</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-backlog-offsets'"
      viewBox="0 0 780 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="复制积压缓冲区偏移图"
      role="img"
    >
      <text x="390" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">增量复制能成立，靠的是主库把最近一段写命令放进环形 backlog，从库带着自己的 offset 来追差额</text>

      <rect x="78" y="94" width="624" height="64" rx="32" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">repl_backlog_buffer（环形缓冲区）</text>

      <circle cx="248" cy="126" r="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="248" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">slave_repl_offset</text>

      <circle cx="512" cy="126" r="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="512" y="182" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">master_repl_offset</text>

      <line x1="248" y1="134" x2="248" y2="166" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <line x1="512" y1="134" x2="512" y2="166" stroke="var(--d-warn-border)" stroke-width="1.3" />

      <rect x="278" y="76" width="194" height="24" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.1" />
      <text x="375" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">这段差值就是断线期间主库新增命令</text>

      <text x="390" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">如果从库太慢，主库继续写会把环形缓冲区旧命令覆盖掉；这时差值追不上，就只能退化回全量复制</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-incremental-resync'"
      viewBox="0 0 780 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="增量复制恢复图"
      role="img"
    >
      <text x="390" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">网络恢复后，从库带着自己的 offset 回来要缺失段，主库只补中间差额而不是整库重来</text>

      <rect x="58" y="94" width="142" height="82" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="129" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">从库重连</text>
      <text x="129" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">psync runid offset=950</text>

      <rect x="318" y="78" width="154" height="114" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="395" y="104" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">主库 backlog</text>
      <text x="395" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">950 之后还有 put d e</text>
      <text x="395" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">和 put d f</text>
      <text x="395" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">于是直接补这两条</text>

      <rect x="590" y="94" width="136" height="82" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="658" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">从库追平</text>
      <text x="658" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">执行缺失命令</text>
      <text x="658" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">恢复长连接传播</text>

      <line x1="200" y1="134" x2="318" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="472" y1="134" x2="590" y2="134" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <text x="390" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此 backlog 够不够大，直接决定了网络抖动后是“轻量补差值”还是“再来一轮昂贵的全量复制”</text>
    </svg>

    <svg
      v-else-if="kind === 'sentinel-master-down'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="主库下线影响图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">主库一旦下线，问题不只是“少一台机器”，而是整个写路径会立即断掉，从库复制也没了源头</text>

      <rect x="72" y="90" width="142" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="143" y="122" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">主库不可用</text>

      <rect x="322" y="52" width="142" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="393" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">从库 A</text>
      <rect x="322" y="134" width="142" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="393" y="166" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">从库 B</text>

      <rect x="574" y="72" width="128" height="96" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="638" y="98" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">对外影响</text>
      <text x="638" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">写请求没地方落</text>
      <text x="638" y="140" text-anchor="middle" font-size="10" fill="var(--d-text)">从库也停止同步</text>

      <line x1="214" y1="118" x2="322" y2="80" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="214" y1="118" x2="322" y2="162" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="464" y1="98" x2="574" y2="112" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <line x1="464" y1="162" x2="574" y2="140" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'sentinel-three-tasks'"
      viewBox="0 0 820 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="哨兵三大任务图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">哨兵做的三件事可以分开记：监控是否真的挂了、决定谁接班、再把新主信息通知出去</text>

      <rect x="34" y="70" width="220" height="138" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="144" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">监控</text>
      <text x="144" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">周期性发送 PING</text>
      <text x="144" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">判断主从是否在线</text>

      <rect x="300" y="70" width="220" height="138" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="410" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">选主</text>
      <text x="410" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">筛掉不合格从库</text>
      <text x="410" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">按优先级、复制进度等打分</text>

      <rect x="566" y="70" width="220" height="138" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="676" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">通知</text>
      <text x="676" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">让从库 replicaof 新主</text>
      <text x="676" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">让客户端切到新主地址</text>

      <line x1="254" y1="138" x2="300" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="520" y1="138" x2="566" y2="138" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'sentinel-quorum'"
      viewBox="0 0 820 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="哨兵主观下线与客观下线图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">一个哨兵觉得主库挂了，还只能叫主观下线；多数派都同意，才升级成客观下线并触发切换</text>

      <rect x="44" y="76" width="330" height="146" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="209" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">只有 1 个哨兵主观下线</text>
      <rect x="76" y="126" width="76" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="114" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Sentinel 1: SDOWN</text>
      <rect x="170" y="126" width="76" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="208" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Sentinel 2: UP</text>
      <rect x="264" y="126" width="76" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="302" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Sentinel 3: UP</text>
      <text x="209" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">结论：还不能切，可能只是单个哨兵误判</text>

      <rect x="446" y="76" width="330" height="146" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="611" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">2 of 3 达成一致</text>
      <rect x="478" y="126" width="76" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="516" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Sentinel 1: SDOWN</text>
      <rect x="572" y="126" width="76" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="610" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Sentinel 2: SDOWN</text>
      <rect x="666" y="126" width="76" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="704" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Sentinel 3: UP</text>
      <text x="611" y="196" text-anchor="middle" font-size="10" fill="var(--d-text)">结论：ODOWN，进入切换流程</text>
    </svg>

    <svg
      v-else-if="kind === 'sentinel-filter-score'"
      viewBox="0 0 820 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="哨兵筛选与打分图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">哨兵选主不是随便挑一个从库，而是先筛条件，再按优先级、复制进度和实例 ID 逐轮比较</text>

      <rect x="44" y="92" width="170" height="114" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="129" y="116" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">候选从库集合</text>
      <text x="129" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">A / B / C / D</text>
      <text x="129" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先别急着打分</text>

      <rect x="264" y="92" width="170" height="114" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="349" y="116" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">筛选</text>
      <text x="349" y="142" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不在线的剔除</text>
      <text x="349" y="160" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">断连过多的剔除</text>

      <rect x="484" y="92" width="140" height="114" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="554" y="116" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">打分 1</text>
      <text x="554" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">优先级高者胜</text>

      <rect x="654" y="92" width="122" height="114" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="715" y="116" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">打分 2/3</text>
      <text x="715" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">复制进度更近</text>
      <text x="715" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">再比实例 ID</text>

      <line x1="214" y1="148" x2="264" y2="148" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="434" y1="148" x2="484" y2="148" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <line x1="624" y1="148" x2="654" y2="148" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'sentinel-offset-score'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="按复制偏移量选择新主图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">如果优先级相同，最该接班的是复制进度最接近旧主的从库，因为它丢的数据最少</text>

      <rect x="78" y="84" width="138" height="88" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="147" y="110" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">旧主</text>
      <text x="147" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">master offset = 1000</text>

      <rect x="292" y="58" width="122" height="52" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="353" y="88" text-anchor="middle" font-size="10" fill="var(--d-text)">从库 A = 950</text>

      <rect x="292" y="120" width="122" height="52" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="353" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">从库 B = 990</text>

      <rect x="292" y="182" width="122" height="52" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="353" y="212" text-anchor="middle" font-size="10" fill="var(--d-text)">从库 C = 900</text>

      <rect x="520" y="104" width="164" height="66" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="602" y="130" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">最接近 1000 的是 990</text>
      <text x="602" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">所以从库 B 优先被选中</text>

      <line x1="216" y1="128" x2="292" y2="84" stroke="var(--d-border-dash)" stroke-width="1.3" stroke-dasharray="6 4" />
      <line x1="216" y1="128" x2="292" y2="146" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <line x1="216" y1="128" x2="292" y2="208" stroke="var(--d-border-dash)" stroke-width="1.3" stroke-dasharray="6 4" />
      <line x1="414" y1="146" x2="520" y2="136" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'cluster-shard-splitting'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="切片集群分摊大数据量图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">把 25GB 数据压在一台实例上，fork 和持久化都更重；拆成 5 片后，每片只背 5GB 压力</text>

      <rect x="46" y="86" width="164" height="72" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="128" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">单实例</text>
      <text x="128" y="136" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">25GB 全压一台</text>

      <line x1="210" y1="122" x2="322" y2="122" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />

      <rect x="322" y="58" width="78" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="361" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 1</text>
      <rect x="416" y="58" width="78" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="455" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 2</text>
      <rect x="510" y="58" width="78" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="549" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 3</text>
      <rect x="369" y="130" width="78" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="408" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 4</text>
      <rect x="463" y="130" width="78" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="502" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 5</text>

      <text x="455" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">每片约 5GB，单实例 fork 和持久化开销都显著下降</text>
    </svg>

    <svg
      v-else-if="kind === 'cluster-scale-up-out'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="纵向扩容与横向扩容对比图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">纵向扩展是把单机做大，横向扩展是把实例做多；切片集群真正走的是后者</text>

      <rect x="38" y="64" width="300" height="148" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="188" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">纵向扩展 scale up</text>
      <rect x="116" y="118" width="144" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="188" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">单实例从 8GB 到 24GB</text>
      <text x="188" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">做法直接，但会更靠近单机瓶颈</text>

      <rect x="422" y="64" width="300" height="148" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="572" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">横向扩展 scale out</text>
      <rect x="468" y="118" width="62" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <rect x="541" y="118" width="62" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <rect x="614" y="118" width="62" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="499" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">实例 1</text>
      <text x="572" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">实例 2</text>
      <text x="645" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">实例 3</text>
      <text x="572" y="188" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">扩展性更强，但需要路由和迁移机制</text>
    </svg>

    <svg
      v-else-if="kind === 'cluster-slot-mapping'"
      viewBox="0 0 820 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="哈希槽映射图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis Cluster 用“key 先映射到 slot，再由 slot 映射到实例”的两段式模型来统一路由和迁移</text>

      <rect x="40" y="98" width="120" height="46" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="100" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">key1 / key2</text>

      <rect x="224" y="72" width="148" height="98" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="298" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">CRC16 取模</text>
      <text x="298" y="122" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">key1 -> slot 1</text>
      <text x="298" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">key2 -> slot 4</text>

      <rect x="438" y="72" width="144" height="98" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="510" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">哈希槽</text>
      <text x="510" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">slot 0,1 -> 实例 1</text>
      <text x="510" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">slot 2,3 -> 实例 2</text>

      <rect x="646" y="52" width="132" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="712" y="82" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 1</text>
      <rect x="646" y="116" width="132" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="712" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 2</text>

      <line x1="160" y1="121" x2="224" y2="121" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="372" y1="121" x2="438" y2="121" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="582" y1="104" x2="646" y2="78" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="582" y1="138" x2="646" y2="141" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'cluster-moved'"
      viewBox="0 0 820 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MOVED 重定向图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">MOVED 表示槽位已经稳定迁走了，客户端不仅要重试，还应该更新自己的本地槽位缓存</text>

      <rect x="42" y="100" width="148" height="64" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="116" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端本地缓存</text>
      <text x="116" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">误以为 slot 2 在实例 2</text>

      <rect x="304" y="66" width="142" height="58" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="375" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">实例 2</text>
      <rect x="304" y="150" width="142" height="58" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="375" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 3</text>

      <rect x="528" y="84" width="248" height="108" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="652" y="110" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">MOVED 13320 172.16.19.5:6379</text>
      <text x="652" y="136" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">客户端改向实例 3 重试</text>
      <text x="652" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">并把 slot 2 的本地映射更新掉</text>

      <line x1="190" y1="132" x2="304" y2="96" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="446" y1="96" x2="528" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="652" y1="192" x2="446" y2="180" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'cluster-ask'"
      viewBox="0 0 820 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ASK 重定向图"
      role="img"
    >
      <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">ASK 说明槽位还在迁移中：这次请求去新实例前要先发 ASKING，但本地缓存先别改死</text>

      <rect x="42" y="100" width="148" height="64" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="116" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端</text>
      <text x="116" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">仍按旧缓存访问实例 2</text>

      <rect x="304" y="62" width="154" height="64" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="381" y="88" text-anchor="middle" font-size="10" fill="var(--d-text)">实例 2</text>
      <text x="381" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">slot 2 还剩部分 key</text>

      <rect x="304" y="154" width="154" height="64" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="381" y="180" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实例 3</text>
      <text x="381" y="198" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">slot 2 已迁来部分 key</text>

      <rect x="528" y="74" width="248" height="132" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="652" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">ASK 13320 172.16.19.5:6379</text>
      <text x="652" y="124" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">1. 客户端先给实例 3 发 ASKING</text>
      <text x="652" y="142" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">2. 再把这次真正的 GET/SET 发过去</text>
      <text x="652" y="160" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">3. 但本地 slot 缓存暂时别整体改写</text>

      <line x1="190" y1="132" x2="304" y2="94" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="458" y1="94" x2="528" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="652" y1="206" x2="458" y2="186" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'lock-compete'"
      viewBox="0 0 780 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 分布式锁竞争图"
      role="img"
    >
      <text x="390" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">把锁保存在 Redis 键值对里后，多个客户端争抢的核心就变成了“谁先把 lock_key 从未持有状态改成已持有”</text>

      <rect x="42" y="92" width="148" height="86" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="116" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">客户端 A</text>
      <text x="116" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">请求加锁</text>
      <text x="116" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">先到达 Redis</text>

      <rect x="295" y="74" width="190" height="124" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="390" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Redis</text>
      <rect x="328" y="118" width="124" height="44" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="390" y="136" text-anchor="middle" font-size="10" fill="var(--d-text)">lock_key</text>
      <text x="390" y="152" text-anchor="middle" font-size="10" fill="var(--d-text)">0 -> 1</text>
      <text x="390" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">0 表示未持有，1 表示已持有</text>

      <rect x="590" y="92" width="148" height="86" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="664" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">客户端 B</text>
      <text x="664" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">也请求加锁</text>
      <text x="664" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">但看到锁已被占用</text>

      <line x1="190" y1="135" x2="295" y2="135" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="590" y1="135" x2="485" y2="135" stroke="var(--d-rv-a-border)" stroke-width="1.5" />

      <rect x="286" y="214" width="208" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="390" y="236" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">同一时刻只能有一个客户端把锁状态改成功</text>
    </svg>

    <svg
      v-else-if="kind === 'lock-release'"
      viewBox="0 0 780 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 分布式锁释放图"
      role="img"
    >
      <text x="390" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">释放锁就是把锁状态从“已持有”恢复成“未持有”，这样后续等待者才能重新竞争</text>

      <rect x="48" y="92" width="154" height="88" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="125" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">客户端 A</text>
      <text x="125" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">当前持有锁</text>
      <text x="125" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">执行释放操作</text>

      <rect x="292" y="72" width="196" height="128" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="390" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Redis 锁变量</text>
      <rect x="326" y="116" width="128" height="36" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="390" y="138" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">lock_key = 1</text>
      <line x1="390" y1="152" x2="390" y2="170" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <rect x="326" y="170" width="128" height="36" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="390" y="192" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">lock_key = 0</text>

      <rect x="578" y="92" width="154" height="88" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="655" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">客户端 B</text>
      <text x="655" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">看到锁已释放</text>
      <text x="655" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">可以重新发起加锁</text>

      <line x1="202" y1="136" x2="292" y2="136" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="488" y1="188" x2="578" y2="136" stroke="var(--d-rv-b-border)" stroke-width="1.5" />

      <text x="390" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正上线时通常还要把“锁值是不是我自己的”一起校验，避免误删别人的锁</text>
    </svg>

    <svg
      v-else-if="kind === 'split-brain-unsynced-loss'"
      viewBox="0 0 840 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="主从未同步完成导致数据丢失图"
      role="img"
    >
      <text x="420" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">最常见的数据丢失场景是：新写入还没复制到从库，主库就先故障了，从库提升后只能带着旧数据继续服务</text>

      <rect x="48" y="98" width="146" height="84" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="121" y="124" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">客户端</text>
      <text x="121" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">写入 a:1、b:3</text>

      <rect x="274" y="72" width="184" height="132" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="366" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">原主库</text>
      <text x="366" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">已接收 a:1、b:3</text>
      <text x="366" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">master_repl_offset 更大</text>
      <text x="366" y="174" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">故障发生在复制完成之前</text>

      <rect x="588" y="72" width="184" height="132" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="680" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">从库 / 新主库</text>
      <text x="680" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">还没收到 a:1、b:3</text>
      <text x="680" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">slave_repl_offset 更小</text>
      <text x="680" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">升级后只能保留旧状态</text>

      <line x1="194" y1="140" x2="274" y2="140" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="458" y1="130" x2="588" y2="130" stroke="var(--d-border-dash)" stroke-width="1.6" stroke-dasharray="6 4" />
      <text x="523" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">复制还没追平</text>

      <circle cx="470" cy="182" r="20" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="470" y="187" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">故障</text>

      <text x="420" y="258" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这类丢失通常可以通过比较主从复制进度差值定位出来</text>
    </svg>

    <svg
      v-else-if="kind === 'split-brain-formation'"
      viewBox="0 0 900 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="脑裂形成过程图"
      role="img"
    >
      <text x="450" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">脑裂的本质是：原主库并没真正宕机，只是和哨兵 / 从库失联，于是集群里短时间同时出现两个主库</text>

      <rect x="86" y="106" width="180" height="104" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="176" y="132" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">原主库</text>
      <text x="176" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">其实仍然存活</text>
      <text x="176" y="174" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">还能继续接收客户端写入</text>

      <rect x="360" y="54" width="180" height="84" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="450" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">哨兵集群</text>
      <text x="450" y="104" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">误以为原主库已下线</text>
      <text x="450" y="122" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">发起故障转移</text>

      <rect x="634" y="106" width="180" height="104" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="724" y="132" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">从库 -> 新主库</text>
      <text x="724" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">被哨兵提升</text>
      <text x="724" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">开始接收新的客户端流量</text>

      <rect x="90" y="248" width="170" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="175" y="271" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">客户端 1 仍连原主库</text>
      <rect x="640" y="248" width="170" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.1" />
      <text x="725" y="271" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">客户端 2 已切到新主库</text>

      <line x1="450" y1="138" x2="724" y2="106" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <line x1="175" y1="248" x2="176" y2="210" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="725" y1="248" x2="724" y2="210" stroke="var(--d-rv-b-border)" stroke-width="1.5" />

      <line x1="266" y1="126" x2="360" y2="96" stroke="var(--d-border-dash)" stroke-width="1.6" stroke-dasharray="7 5" />
      <text x="314" y="92" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">网络分区</text>
      <line x1="266" y1="146" x2="360" y2="112" stroke="var(--d-border-dash)" stroke-width="1.6" stroke-dasharray="7 5" />

      <rect x="348" y="246" width="204" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="450" y="269" text-anchor="middle" font-size="9" fill="var(--d-text)">结果：同一业务窗口内出现两个都像“主库”的节点</text>
    </svg>

    <svg
      v-else-if="kind === 'split-brain-resync-loss'"
      viewBox="0 0 900 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="脑裂后全量同步导致原主库数据丢失图"
      role="img"
    >
      <text x="450" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">脑裂真正致命的地方在于恢复阶段：原主库回归后会被改造成从库，全量同步会把它在分裂期间写入的数据直接冲掉</text>

      <rect x="52" y="86" width="220" height="138" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="162" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">原主库（分裂期间）</text>
      <text x="162" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">继续收到客户端写入</text>
      <text x="162" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">例如新增 order:9 / cart:3</text>
      <text x="162" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">这些数据只存在它自己本地</text>

      <rect x="340" y="86" width="220" height="138" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="450" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">故障转移完成后</text>
      <text x="450" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">哨兵让原主库执行 replicaof</text>
      <text x="450" y="160" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">随后触发一次全量同步</text>
      <text x="450" y="188" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">先清空本地数据，再加载新主库 RDB</text>

      <rect x="628" y="86" width="220" height="138" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="738" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">新主库</text>
      <text x="738" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">保存的是另一条时间线上的数据</text>
      <text x="738" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">并不知道原主库本地新增的键</text>
      <text x="738" y="188" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">RDB 会覆盖回原主库</text>

      <line x1="272" y1="155" x2="340" y2="155" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <line x1="560" y1="155" x2="628" y2="155" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="594" y="145" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">RDB 全量同步</text>

      <rect x="308" y="248" width="284" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="450" y="270" text-anchor="middle" font-size="9" fill="var(--d-text)">于是原主库在脑裂窗口写入的数据会在重新同步时被清空，形成“看起来很诡异”的数据丢失</text>
    </svg>
  </DiagramFrame>
</template>
