<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type FigureKind =
  | 'preface-knowledge-map'
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
  | 'ds-type-encoding-map'
  | 'ds-global-hashtable'
  | 'ds-hash-collision-chain'
  | 'ds-progressive-rehash'
  | 'ds-ziplist-structure'
  | 'ds-skiplist-index'
  | 'ds-complexity-summary'
  | 'qa1-simplekv-vs-redis'
  | 'qa1-ziplist-memory-layout'
  | 'qa1-thread-process-relation'
  | 'qa1-cow-mechanism'
  | 'qa1-repl-buffers'
  | 'string-sds-structure'
  | 'string-redisobject-ptr'
  | 'string-encoding-modes'
  | 'string-dictentry-overhead'
  | 'string-ziplist-saving'
  | 'billion-set-cumulative'
  | 'billion-set-daily'
  | 'billion-bitmap-and'
  | 'billion-collection-summary'
  | 'geo-hash-approach'
  | 'geo-sortedset-approach'
  | 'geo-longitude-encoding'
  | 'geo-latitude-encoding'
  | 'geo-interleave-encoding'
  | 'geo-grid-mapping'
  | 'geo-edge-case'
  | 'geo-redisobject-ptr'
  | 'geo-newtype-steps'
  | 'timeseries-hash-query'
  | 'timeseries-sortedset-range'
  | 'timeseries-multi-exec'
  | 'mq-list-basic'
  | 'mq-brpoplpush'
  | 'mq-list-rpop'
  | 'mq-list-backup'
  | 'mq-comparison-table'
  | 'async-blocking-points'
  | 'async-client-operations'
  | 'async-lazy-free'
  | 'async-threaded-io'
  | 'cpu-physical-core'
  | 'cpu-logical-cores'
  | 'cpu-multi-socket-numa'
  | 'cpu-bindcore-latency'
  | 'cpu-nic-interrupt-data'
  | 'cpu-cross-socket-access'
  | 'cpu-same-socket-binding'
  | 'latency-baseline'
  | 'latency-slow-causes'
  | 'latency2-aof-fsync'
  | 'latency2-swap'
  | 'latency2-transparent-hugepage'
  | 'latency2-overview'
  | 'mem-delete-not-freed'
  | 'mem-fragmentation'
  | 'mem-fragmentation-ratio'
  | 'mem-defrag-config'
  | 'buffer-client-types'
  | 'buffer-repl-backlog'
  | 'buffer-overflow-risk'
  | 'consistency-readonly-flow'
  | 'consistency-delete-first-fail'
  | 'consistency-update-first-fail'
  | 'consistency-failure-summary'
  | 'consistency-retry-mq'
  | 'consistency-concurrent-stale'
  | 'consistency-update-first-race'
  | 'consistency-solution-summary'
  | 'anomaly-snowfall-expire'
  | 'anomaly-degradation'
  | 'anomaly-circuit-breaker'
  | 'anomaly-rate-limiting'
  | 'anomaly-breakdown'
  | 'anomaly-penetration'
  | 'anomaly-bloom-filter'
  | 'anomaly-summary-table'
  | 'cache-storage-layers'
  | 'cache-llc-pagecache'
  | 'cache-hit-miss-flow'
  | 'cache-readonly-flow'
  | 'cache-readwrite-strategies'
  | 'eviction-maxmemory'
  | 'eviction-8-policies'
  | 'eviction-lru-approx'
  | 'eviction-lfu-counters'
  | 'pollution-what-is'
  | 'pollution-lru-problem'
  | 'pollution-lfu-solution'
  | 'preface-problem-portrait'
  | 'preface-course-structure'
  | 'sentinel-pub-sub'
  | 'sentinel-client-update'
  | 'sentinel-deployment-tips'
  | 'sentinel-network-partition'
  | 'sentinel-min-slaves'
  | 'redis6-multithreaded-io'
  | 'redis6-io-read-phase'
  | 'redis6-acl-users'
  | 'redis6-client-cache'
  | 'future-qa-nvm-vs-dram'
  | 'future-qa-persistence-stack'
  | 'extra-source-code-map'
  | 'extra-learning-roadmap'
  | 'extra-resp-protocol'
  | 'extra-pipeline-batch'
  | 'extra-info-command'
  | 'extra-monitoring-dashboard'
  | 'extra-key-naming'
  | 'extra-usage-checklist'
  | 'extra-weibo-timeline'
  | 'extra-weibo-counter'
  | 'midterm-quiz-diagram'
  | 'conclusion-knowledge-map'
  | 'pika-architecture'
  | 'pika-thread-model'
  | 'pika-rocksdb-write'
  | 'pika-rocksdb-read'
  | 'pika-list-kv-mapping'
  | 'pika-set-kv-mapping'
  | 'pika-hash-kv-mapping'
  | 'pika-zset-kv-mapping'
  | 'pika-performance-table'
  | 'atomic-rw-race'
  | 'atomic-lua-incr'
  | 'tx-multi-exec-flow'
  | 'tx-command-error'
  | 'tx-exec-error'
  | 'tx-watch-optimistic'
  | 'failover-repl-timeout'
  | 'failover-repl-storm'
  | 'failover-cascade-fix'
  | 'qa2-practice-summary'
  | 'codis-architecture'
  | 'codis-request-flow'
  | 'codis-slot-mapping'
  | 'codis-routing-table'
  | 'codis-data-migration'
  | 'codis-add-proxy'
  | 'codis-server-group'
  | 'codis-vs-cluster-table'
  | 'seckill-redis-flow'
  | 'skew-data-volume'
  | 'skew-hotspot-key'
  | 'skew-slot-rebalance'
  | 'skew-hotspot-solution'
  | 'cluster-gossip-overhead'

const props = defineProps<{
  kind: FigureKind
}>()

const maxWidthByKind: Record<FigureKind, string> = {
  'preface-knowledge-map': '860px',
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
  'ds-type-encoding-map': '820px',
  'ds-global-hashtable': '780px',
  'ds-hash-collision-chain': '780px',
  'ds-progressive-rehash': '820px',
  'ds-ziplist-structure': '780px',
  'ds-skiplist-index': '820px',
  'ds-complexity-summary': '780px',
  'qa1-simplekv-vs-redis': '860px',
  'qa1-ziplist-memory-layout': '780px',
  'qa1-thread-process-relation': '820px',
  'qa1-cow-mechanism': '860px',
  'qa1-repl-buffers': '820px',
  'string-sds-structure': '700px',
  'string-redisobject-ptr': '780px',
  'string-encoding-modes': '860px',
  'string-dictentry-overhead': '760px',
  'string-ziplist-saving': '780px',
  'billion-set-cumulative': '700px',
  'billion-set-daily': '760px',
  'billion-bitmap-and': '780px',
  'billion-collection-summary': '860px',
  'geo-hash-approach': '700px',
  'geo-sortedset-approach': '760px',
  'geo-longitude-encoding': '780px',
  'geo-latitude-encoding': '780px',
  'geo-interleave-encoding': '760px',
  'geo-grid-mapping': '760px',
  'geo-edge-case': '760px',
  'geo-redisobject-ptr': '760px',
  'geo-newtype-steps': '820px',
  'timeseries-hash-query': '700px',
  'timeseries-sortedset-range': '760px',
  'timeseries-multi-exec': '700px',
  'mq-list-basic': '760px',
  'mq-brpoplpush': '700px',
  'mq-list-rpop': '760px',
  'mq-list-backup': '820px',
  'mq-comparison-table': '860px',
  'async-blocking-points': '820px',
  'async-client-operations': '780px',
  'async-lazy-free': '780px',
  'async-threaded-io': '820px',
  'cpu-physical-core': '700px',
  'cpu-logical-cores': '760px',
  'cpu-multi-socket-numa': '860px',
  'cpu-bindcore-latency': '780px',
  'cpu-nic-interrupt-data': '780px',
  'cpu-cross-socket-access': '820px',
  'cpu-same-socket-binding': '820px',
  'latency-baseline': '780px',
  'latency-slow-causes': '820px',
  'latency2-aof-fsync': '780px',
  'latency2-swap': '780px',
  'latency2-transparent-hugepage': '780px',
  'latency2-overview': '820px',
  'mem-delete-not-freed': '780px',
  'mem-fragmentation': '780px',
  'mem-fragmentation-ratio': '780px',
  'mem-defrag-config': '780px',
  'buffer-client-types': '780px',
  'buffer-repl-backlog': '820px',
  'buffer-overflow-risk': '780px',
  'consistency-readonly-flow': '780px',
  'consistency-delete-first-fail': '780px',
  'consistency-update-first-fail': '780px',
  'consistency-failure-summary': '780px',
  'consistency-retry-mq': '780px',
  'consistency-concurrent-stale': '820px',
  'consistency-update-first-race': '820px',
  'consistency-solution-summary': '860px',
  'anomaly-snowfall-expire': '780px',
  'anomaly-degradation': '780px',
  'anomaly-circuit-breaker': '780px',
  'anomaly-rate-limiting': '780px',
  'anomaly-breakdown': '780px',
  'anomaly-penetration': '780px',
  'anomaly-bloom-filter': '820px',
  'anomaly-summary-table': '860px',
  'cache-storage-layers': '780px',
  'cache-llc-pagecache': '780px',
  'cache-hit-miss-flow': '780px',
  'cache-readonly-flow': '780px',
  'cache-readwrite-strategies': '780px',
  'eviction-maxmemory': '780px',
  'eviction-8-policies': '780px',
  'eviction-lru-approx': '780px',
  'eviction-lfu-counters': '780px',
  'pollution-what-is': '780px',
  'pollution-lru-problem': '780px',
  'pollution-lfu-solution': '780px',
  'preface-problem-portrait': '820px',
  'preface-course-structure': '780px',
  'sentinel-pub-sub': '780px',
  'sentinel-client-update': '780px',
  'sentinel-deployment-tips': '780px',
  'sentinel-network-partition': '780px',
  'sentinel-min-slaves': '780px',
  'redis6-multithreaded-io': '780px',
  'redis6-io-read-phase': '780px',
  'redis6-acl-users': '780px',
  'redis6-client-cache': '780px',
  'future-qa-nvm-vs-dram': '780px',
  'future-qa-persistence-stack': '780px',
  'extra-source-code-map': '780px',
  'extra-learning-roadmap': '780px',
  'extra-resp-protocol': '780px',
  'extra-pipeline-batch': '780px',
  'extra-info-command': '780px',
  'extra-monitoring-dashboard': '780px',
  'extra-key-naming': '780px',
  'extra-usage-checklist': '780px',
  'extra-weibo-timeline': '780px',
  'extra-weibo-counter': '780px',
  'midterm-quiz-diagram': '780px',
  'conclusion-knowledge-map': '820px',
  'pika-architecture': '780px',
  'pika-thread-model': '780px',
  'pika-rocksdb-write': '780px',
  'pika-rocksdb-read': '780px',
  'pika-list-kv-mapping': '780px',
  'pika-set-kv-mapping': '780px',
  'pika-hash-kv-mapping': '780px',
  'pika-zset-kv-mapping': '780px',
  'pika-performance-table': '780px',
  'atomic-rw-race': '780px',
  'atomic-lua-incr': '780px',
  'tx-multi-exec-flow': '780px',
  'tx-command-error': '780px',
  'tx-exec-error': '780px',
  'tx-watch-optimistic': '780px',
  'failover-repl-timeout': '780px',
  'failover-repl-storm': '780px',
  'failover-cascade-fix': '780px',
  'qa2-practice-summary': '780px',
  'codis-architecture': '820px',
  'codis-request-flow': '780px',
  'codis-slot-mapping': '780px',
  'codis-routing-table': '780px',
  'codis-data-migration': '780px',
  'codis-add-proxy': '780px',
  'codis-server-group': '780px',
  'codis-vs-cluster-table': '820px',
  'seckill-redis-flow': '780px',
  'skew-data-volume': '780px',
  'skew-hotspot-key': '780px',
  'skew-slot-rebalance': '780px',
  'skew-hotspot-solution': '780px',
  'cluster-gossip-overhead': '780px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'preface-knowledge-map'"
      viewBox="0 0 860 430"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 两大维度三大主线知识全景图"
      role="img"
    >
      <rect x="16" y="16" width="828" height="398" rx="18" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="430" y="58" text-anchor="middle" font-size="18" font-weight="700" fill="var(--d-text)">Redis 的“两大维度，三大主线”</text>

      <text x="112" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">
        <tspan x="112" dy="0">应用</tspan>
        <tspan x="112" dy="22">维度</tspan>
      </text>

      <text x="112" y="244" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">
        <tspan x="112" dy="0">系统</tspan>
        <tspan x="112" dy="22">维度</tspan>
      </text>

      <line x1="164" y1="166" x2="744" y2="166" stroke="var(--d-border)" stroke-width="1.4" />
      <line x1="398" y1="182" x2="398" y2="372" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 6" />
      <line x1="594" y1="182" x2="594" y2="372" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 6" />

      <rect x="186" y="92" width="126" height="48" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="249" y="122" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">缓存应用</text>
      <rect x="360" y="92" width="126" height="48" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="423" y="122" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">集群应用</text>
      <rect x="534" y="92" width="144" height="48" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="606" y="122" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">数据结构应用</text>

      <text x="176" y="208" text-anchor="end" font-size="12" font-weight="600" fill="var(--d-text)">处理层</text>
      <text x="176" y="260" text-anchor="end" font-size="12" font-weight="600" fill="var(--d-text)">内存层</text>
      <text x="176" y="314" text-anchor="end" font-size="12" font-weight="600" fill="var(--d-text)">存储层</text>
      <text x="176" y="366" text-anchor="end" font-size="12" font-weight="600" fill="var(--d-text)">网络层</text>

      <rect x="194" y="186" width="138" height="36" rx="9" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="263" y="209" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">线程模型</text>
      <rect x="194" y="238" width="138" height="36" rx="9" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="263" y="261" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">数据结构</text>
      <rect x="194" y="342" width="154" height="36" rx="9" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="271" y="365" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">epoll 网络框架</text>

      <rect x="410" y="186" width="112" height="36" rx="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="466" y="209" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">主从复制</text>
      <rect x="410" y="238" width="112" height="36" rx="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="466" y="261" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">哨兵机制</text>

      <rect x="618" y="186" width="112" height="36" rx="9" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="674" y="209" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">数据分片</text>
      <rect x="618" y="290" width="112" height="36" rx="9" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="674" y="313" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">负载均衡</text>

      <rect
        x="258"
        y="290"
        width="280"
        height="46"
        rx="12"
        fill="none"
        stroke="var(--d-text-sub)"
        stroke-width="1.8"
        stroke-dasharray="7 5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect x="270" y="296" width="96" height="34" rx="9" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="318" y="318" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">AOF</text>
      <rect x="430" y="296" width="96" height="34" rx="9" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="478" y="318" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">RDB</text>

      <text x="272" y="396" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">高性能主线</text>
      <text x="496" y="396" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">高可靠主线</text>
      <text x="676" y="396" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">高可扩展主线</text>
    </svg>

    <svg
      v-else-if="kind === 'simplekv-modules'"
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

    <!-- ==================== 02-slow-operations ==================== -->

    <svg
      v-else-if="kind === 'ds-type-encoding-map'"
      viewBox="0 0 820 370"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 数据类型与底层数据结构对应关系"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 5 种数据类型与底层数据结构的对应关系</text>

      <!-- 左列：数据类型 -->
      <text x="120" y="68" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">数据类型</text>
      <rect x="52" y="84" width="136" height="38" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="120" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">String</text>
      <rect x="52" y="136" width="136" height="38" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="120" y="160" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">List</text>
      <rect x="52" y="188" width="136" height="38" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="120" y="212" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Hash</text>
      <rect x="52" y="240" width="136" height="38" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="120" y="264" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Set</text>
      <rect x="52" y="292" width="136" height="38" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="120" y="316" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Sorted Set</text>

      <!-- 右列：底层数据结构 -->
      <text x="620" y="68" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">底层数据结构</text>
      <rect x="520" y="84" width="200" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="620" y="108" text-anchor="middle" font-size="12" fill="var(--d-text)">简单动态字符串 (SDS)</text>
      <rect x="520" y="136" width="200" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="620" y="160" text-anchor="middle" font-size="12" fill="var(--d-text)">双向链表</text>
      <rect x="520" y="188" width="200" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="620" y="212" text-anchor="middle" font-size="12" fill="var(--d-text)">压缩列表 (ziplist)</text>
      <rect x="520" y="240" width="200" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="620" y="264" text-anchor="middle" font-size="12" fill="var(--d-text)">哈希表</text>
      <rect x="520" y="292" width="200" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="620" y="316" text-anchor="middle" font-size="12" fill="var(--d-text)">跳表 / 整数数组</text>

      <!-- 连接线 -->
      <line x1="188" y1="103" x2="520" y2="103" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <line x1="188" y1="155" x2="520" y2="155" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <line x1="188" y1="155" x2="520" y2="207" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4 3" />
      <line x1="188" y1="207" x2="520" y2="207" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <line x1="188" y1="207" x2="520" y2="259" stroke="var(--d-warn-border)" stroke-width="1.2" stroke-dasharray="4 3" />
      <line x1="188" y1="259" x2="520" y2="259" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <line x1="188" y1="259" x2="520" y2="207" stroke="var(--d-rv-b-border)" stroke-width="1.2" stroke-dasharray="4 3" />
      <line x1="188" y1="311" x2="520" y2="311" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="188" y1="311" x2="520" y2="207" stroke="var(--d-rv-c-border)" stroke-width="1.2" stroke-dasharray="4 3" />

      <text x="410" y="356" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">集合类型都有两种底层实现，元素少时用压缩列表节省内存，元素多时切换到更高效的结构</text>
    </svg>

    <svg
      v-else-if="kind === 'ds-global-hashtable'"
      viewBox="0 0 780 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="全局哈希表结构图"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">全局哈希表：通过哈希桶中的 entry 指针指向实际的键和值</text>

      <rect x="60" y="56" width="660" height="240" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">全局哈希表</text>

      <!-- 哈希桶数组 -->
      <rect x="100" y="100" width="100" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="150" y="127" text-anchor="middle" font-size="11" fill="var(--d-text)">哈希桶 0</text>
      <rect x="100" y="152" width="100" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="150" y="179" text-anchor="middle" font-size="11" fill="var(--d-text)">哈希桶 1</text>
      <rect x="100" y="204" width="100" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="150" y="231" text-anchor="middle" font-size="11" fill="var(--d-text)">哈希桶 2</text>
      <text x="150" y="270" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">……</text>

      <!-- entry 结构 -->
      <rect x="310" y="100" width="180" height="80" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="400" y="122" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">entry</text>
      <text x="400" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">*key → 实际键</text>
      <text x="400" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">*value → 实际值</text>

      <!-- 指向键值 -->
      <rect x="570" y="100" width="120" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="630" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">key: "user:1"</text>
      <rect x="570" y="148" width="120" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="630" y="170" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">value: {name:…}</text>

      <line x1="200" y1="122" x2="310" y2="140" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <line x1="490" y1="134" x2="570" y2="117" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <line x1="490" y1="152" x2="570" y2="165" stroke="var(--d-rv-a-border)" stroke-width="1.2" />

      <text x="390" y="316" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">哈希桶中保存的是指向键值对的指针，通过哈希计算即可 O(1) 定位</text>
    </svg>

    <svg
      v-else-if="kind === 'ds-hash-collision-chain'"
      viewBox="0 0 780 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="哈希冲突链示意图"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">哈希冲突：同一个哈希桶中的多个 entry 通过 *next 指针形成链表</text>

      <!-- 哈希桶 -->
      <rect x="40" y="100" width="120" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="130" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">哈希桶 3</text>
      <text x="100" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">hash(key) % N</text>
      <text x="100" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">= 3</text>

      <!-- entry1 -->
      <rect x="220" y="80" width="140" height="60" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="290" y="104" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">entry1</text>
      <text x="290" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">*key / *value / *next</text>

      <!-- entry2 -->
      <rect x="420" y="80" width="140" height="60" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="490" y="104" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">entry2</text>
      <text x="490" y="124" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">*key / *value / *next</text>

      <!-- entry3 -->
      <rect x="620" y="80" width="140" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="690" y="104" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">entry3</text>
      <text x="690" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">*key / *value / NULL</text>

      <!-- 连接线 -->
      <line x1="160" y1="150" x2="220" y2="110" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <polygon points="220,110 210,120 218,122" fill="var(--d-blue-border)" />
      <line x1="360" y1="110" x2="420" y2="110" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <polygon points="420,110 408,104 408,116" fill="var(--d-rv-a-border)" />
      <text x="390" y="76" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">*next</text>
      <line x1="560" y1="110" x2="620" y2="110" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <polygon points="620,110 608,104 608,116" fill="var(--d-warn-border)" />
      <text x="590" y="76" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">*next</text>

      <!-- 问题说明 -->
      <rect x="190" y="190" width="400" height="42" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.1" />
      <text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text)">链越长，查找越慢：需要逐个遍历 O(N)</text>
      <text x="390" y="224" text-anchor="middle" font-size="10" fill="var(--d-text)">解决方案：rehash 扩大哈希桶数量</text>

      <text x="390" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">哈希冲突不可避免，但链表过长会拖慢查找，因此 Redis 需要 rehash</text>
    </svg>

    <svg
      v-else-if="kind === 'ds-progressive-rehash'"
      viewBox="0 0 820 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="渐进式 rehash 示意图"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">渐进式 rehash：每处理一个请求，顺带迁移一个索引位置的 entry 到新哈希表</text>

      <!-- 哈希表 1 -->
      <rect x="40" y="60" width="320" height="240" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="200" y="88" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">哈希表 1（旧）</text>

      <rect x="70" y="106" width="260" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="127" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">索引 0 — 已迁移 ✓</text>
      <rect x="70" y="146" width="260" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="167" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">索引 1 — 已迁移 ✓</text>
      <rect x="70" y="186" width="260" height="32" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="200" y="207" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">索引 2 — 正在迁移 →</text>
      <rect x="70" y="226" width="260" height="32" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="200" y="247" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">索引 3 — 待迁移</text>
      <rect x="70" y="266" width="260" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="200" y="283" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">……</text>

      <!-- 箭头 -->
      <line x1="360" y1="200" x2="460" y2="200" stroke="var(--d-rv-a-border)" stroke-width="2.5" />
      <polygon points="460,200 446,192 446,208" fill="var(--d-rv-a-border)" />
      <text x="410" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">逐步迁移</text>

      <!-- 哈希表 2 -->
      <rect x="460" y="60" width="320" height="240" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="620" y="88" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">哈希表 2（新，2x 容量）</text>

      <rect x="490" y="106" width="260" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="620" y="127" text-anchor="middle" font-size="10" fill="var(--d-text)">索引 0 ← 已接收</text>
      <rect x="490" y="146" width="260" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="620" y="167" text-anchor="middle" font-size="10" fill="var(--d-text)">索引 1 ← 已接收</text>
      <rect x="490" y="186" width="260" height="32" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="620" y="207" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">索引 2 ← 正在写入</text>
      <rect x="490" y="226" width="260" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" opacity="0.5" />
      <text x="620" y="247" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">索引 3 — 空</text>
      <rect x="490" y="266" width="260" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" opacity="0.5" />
      <text x="620" y="283" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">……</text>

      <text x="410" y="340" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">把一次性大量拷贝的开销分摊到了多次请求处理中，避免阻塞主线程</text>
    </svg>

    <svg
      v-else-if="kind === 'ds-ziplist-structure'"
      viewBox="0 0 780 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="压缩列表内部结构图"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">压缩列表：类似数组的紧凑结构，表头记录元信息，表尾用 zlend 标记结束</text>

      <!-- 整体容器 -->
      <rect x="40" y="56" width="700" height="80" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />

      <!-- zlbytes -->
      <rect x="52" y="66" width="80" height="58" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="92" y="90" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">zlbytes</text>
      <text x="92" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">列表长度</text>

      <!-- zltail -->
      <rect x="140" y="66" width="80" height="58" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="180" y="90" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">zltail</text>
      <text x="180" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">尾偏移量</text>

      <!-- zllen -->
      <rect x="228" y="66" width="70" height="58" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="263" y="90" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">zllen</text>
      <text x="263" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">entry 数</text>

      <!-- entries -->
      <rect x="306" y="66" width="80" height="58" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="346" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">entry 1</text>
      <rect x="394" y="66" width="80" height="58" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="434" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">entry 2</text>
      <rect x="482" y="66" width="80" height="58" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="522" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">entry N</text>

      <!-- 省略号 -->
      <text x="570" y="100" text-anchor="middle" font-size="14" fill="var(--d-text-muted)">…</text>

      <!-- zlend -->
      <rect x="598" y="66" width="70" height="58" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="633" y="90" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">zlend</text>
      <text x="633" y="108" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">0xFF</text>

      <!-- 复杂度标注 -->
      <text x="180" y="168" text-anchor="middle" font-size="10" fill="var(--d-blue-border)">← 查找首尾元素 O(1) →</text>
      <line x1="80" y1="164" x2="80" y2="138" stroke="var(--d-blue-border)" stroke-width="1" />
      <line x1="280" y1="164" x2="280" y2="138" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="434" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-a-border)">查找中间元素需逐个遍历 O(N)</text>

      <text x="390" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">压缩列表用连续内存保存数据，省去了指针开销，适合元素少的场景</text>
    </svg>

    <svg
      v-else-if="kind === 'ds-skiplist-index'"
      viewBox="0 0 820 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="跳表多级索引查找示意图"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">跳表：在链表上增加多级索引，实现 O(logN) 的快速查找</text>

      <!-- 二级索引 -->
      <text x="50" y="76" text-anchor="end" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">二级索引</text>
      <rect x="80" y="60" width="56" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="108" y="80" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">1</text>
      <line x1="136" y1="75" x2="300" y2="75" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <rect x="300" y="60" width="56" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="328" y="80" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">27</text>
      <line x1="356" y1="75" x2="630" y2="75" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <rect x="630" y="60" width="56" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="658" y="80" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">100</text>

      <!-- 一级索引 -->
      <text x="50" y="146" text-anchor="end" font-size="11" font-weight="600" fill="var(--d-blue-border)">一级索引</text>
      <rect x="80" y="130" width="56" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="108" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">1</text>
      <line x1="136" y1="145" x2="190" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <rect x="190" y="130" width="56" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="218" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">11</text>
      <line x1="246" y1="145" x2="300" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <rect x="300" y="130" width="56" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">27</text>
      <line x1="356" y1="145" x2="410" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <rect x="410" y="130" width="56" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="438" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">33</text>
      <line x1="466" y1="145" x2="520" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <rect x="520" y="130" width="56" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="548" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">55</text>
      <line x1="576" y1="145" x2="630" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <rect x="630" y="130" width="56" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="658" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">100</text>

      <!-- 原始链表 -->
      <text x="50" y="226" text-anchor="end" font-size="11" font-weight="600" fill="var(--d-rv-a-border)">原始链表</text>
      <rect x="80" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="103" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">1</text>
      <rect x="134" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="157" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">5</text>
      <rect x="188" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="211" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">11</text>
      <rect x="242" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="265" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">22</text>
      <rect x="296" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="319" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">27</text>
      <rect x="350" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="373" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">29</text>
      <rect x="404" y="210" width="46" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="427" y="230" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">33</text>
      <rect x="458" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="481" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">44</text>
      <rect x="512" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="535" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">55</text>
      <rect x="566" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="589" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">78</text>
      <rect x="620" y="210" width="46" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="643" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">100</text>

      <!-- 垂直连接线 -->
      <line x1="108" y1="90" x2="108" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="328" y1="90" x2="328" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="658" y1="90" x2="658" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="108" y1="160" x2="103" y2="210" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="218" y1="160" x2="211" y2="210" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="328" y1="160" x2="319" y2="210" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="438" y1="160" x2="427" y2="210" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="548" y1="160" x2="535" y2="210" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="658" y1="160" x2="643" y2="210" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3 3" />

      <!-- 查找路径 -->
      <text x="410" y="278" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">查找 33：二级索引 1→27 → 一级索引 27→33 → 原始链表命中，仅 3 次跳转</text>

      <text x="410" y="324" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">跳表用空间换时间，数据量大时查找复杂度为 O(logN)，Redis Sorted Set 的核心实现</text>
    </svg>

    <svg
      v-else-if="kind === 'ds-complexity-summary'"
      viewBox="0 0 780 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="数据结构时间复杂度分类表"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">不同底层数据结构的操作复杂度</text>

      <!-- O(1) -->
      <rect x="40" y="56" width="220" height="168" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="150" y="82" text-anchor="middle" font-size="16" font-weight="700" fill="var(--d-rv-c-text)">O(1)</text>
      <rect x="64" y="100" width="172" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="150" y="121" text-anchor="middle" font-size="11" fill="var(--d-text)">哈希表</text>
      <text x="150" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按 key 直接定位</text>
      <text x="150" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">String / Hash / Set</text>
      <text x="150" y="196" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">压缩列表查首尾也是 O(1)</text>

      <!-- O(logN) -->
      <rect x="290" y="56" width="200" height="168" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="390" y="82" text-anchor="middle" font-size="16" font-weight="700" fill="var(--d-text)">O(logN)</text>
      <rect x="314" y="100" width="152" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="121" text-anchor="middle" font-size="11" fill="var(--d-text)">跳表</text>
      <text x="390" y="156" text-anchor="middle" font-size="10" fill="var(--d-text)">多级索引跳转查找</text>
      <text x="390" y="174" text-anchor="middle" font-size="10" fill="var(--d-text)">Sorted Set</text>

      <!-- O(N) -->
      <rect x="520" y="56" width="220" height="168" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="630" y="82" text-anchor="middle" font-size="16" font-weight="700" fill="var(--d-warn-text)">O(N)</text>
      <rect x="544" y="100" width="172" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="630" y="121" text-anchor="middle" font-size="11" fill="var(--d-text)">双向链表 / 压缩列表 / 整数数组</text>
      <text x="630" y="156" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">需要逐个遍历</text>
      <text x="630" y="174" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">List 的 LRANGE 等</text>
      <text x="630" y="196" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">范围操作应尽量避免</text>

      <text x="390" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">掌握数据结构基本原理，就能从原理上推断不同操作的复杂度</text>
    </svg>

    <svg
      v-else-if="kind === 'qa1-simplekv-vs-redis'"
      viewBox="0 0 860 380"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SimpleKV 与 Redis 功能对比表"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">SimpleKV vs Redis 功能对比</text>

      <!-- 表头 -->
      <rect x="40" y="42" width="160" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="120" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">模块</text>
      <rect x="210" y="42" width="260" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="340" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">SimpleKV</text>
      <rect x="480" y="42" width="340" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="650" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Redis</text>

      <!-- 行1: 访问框架 -->
      <rect x="40" y="88" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="112" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">访问框架</text>
      <rect x="210" y="88" width="260" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">动态库 / 简单 Socket</text>
      <rect x="480" y="88" width="340" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">高性能网络框架 + RESP 协议</text>

      <!-- 行2: 索引模块 -->
      <rect x="40" y="136" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="160" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">索引模块</text>
      <rect x="210" y="136" width="260" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">哈希表</text>
      <rect x="480" y="136" width="340" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">哈希表（全局）</text>

      <!-- 行3: 操作模块 -->
      <rect x="40" y="184" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="208" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">操作模块</text>
      <rect x="210" y="184" width="260" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">GET / PUT / DELETE</text>
      <rect x="480" y="184" width="340" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">丰富命令 + Lua + 事务</text>

      <!-- 行4: 存储模块 -->
      <rect x="40" y="232" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="256" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">存储模块</text>
      <rect x="210" y="232" width="260" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="256" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">内存</text>
      <rect x="480" y="232" width="340" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="256" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">内存 + AOF / RDB 持久化</text>

      <!-- 行5: 高可用 -->
      <rect x="40" y="280" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="304" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">高可用</text>
      <rect x="210" y="280" width="260" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="304" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">无</text>
      <rect x="480" y="280" width="340" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="304" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">主从复制 + 哨兵</text>

      <!-- 行6: 高可扩展 -->
      <rect x="40" y="328" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="352" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">高可扩展</text>
      <rect x="210" y="328" width="260" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="352" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">无</text>
      <rect x="480" y="328" width="340" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="352" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Cluster 分片</text>

      <text x="430" y="376" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">SimpleKV 仅实现了基本的键值存取，Redis 在每个模块上都做了大幅增强</text>
    </svg>

    <svg
      v-else-if="kind === 'qa1-ziplist-memory-layout'"
      viewBox="0 0 780 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="整数数组和压缩列表连续内存布局"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">整数数组与压缩列表的连续内存布局</text>

      <!-- 整数数组 -->
      <text x="40" y="68" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">整数数组</text>
      <rect x="130" y="50" width="80" height="32" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="170" y="71" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">elem 1</text>
      <rect x="210" y="50" width="80" height="32" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="250" y="71" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">elem 2</text>
      <rect x="290" y="50" width="80" height="32" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="330" y="71" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">elem 3</text>
      <text x="388" y="71" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">...</text>
      <rect x="406" y="50" width="80" height="32" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="446" y="71" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">elem N</text>
      <text x="530" y="71" font-size="9" fill="var(--d-rv-c-text)">连续内存，无指针开销</text>

      <!-- 压缩列表 -->
      <text x="40" y="128" font-size="11" font-weight="600" fill="var(--d-blue-border)">压缩列表</text>
      <rect x="130" y="110" width="80" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="170" y="131" text-anchor="middle" font-size="10" fill="var(--d-text)">entry 1</text>
      <rect x="210" y="110" width="80" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="250" y="131" text-anchor="middle" font-size="10" fill="var(--d-text)">entry 2</text>
      <rect x="290" y="110" width="80" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="330" y="131" text-anchor="middle" font-size="10" fill="var(--d-text)">entry 3</text>
      <text x="388" y="131" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">...</text>
      <rect x="406" y="110" width="80" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="446" y="131" text-anchor="middle" font-size="10" fill="var(--d-text)">entry N</text>
      <text x="530" y="131" font-size="9" fill="var(--d-rv-c-text)">每个 entry 紧凑排列</text>

      <!-- 连续内存标注线 -->
      <line x1="130" y1="152" x2="486" y2="152" stroke="var(--d-rv-c-border)" stroke-width="1.2" stroke-dasharray="4 3" />
      <polygon points="130,149 130,155 122,152" fill="var(--d-rv-c-border)" />
      <polygon points="486,149 486,155 494,152" fill="var(--d-rv-c-border)" />
      <text x="308" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">地址连续</text>

      <text x="390" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">整数数组和压缩列表用连续内存保存数据，省去了指针开销，适合元素少的场景</text>
    </svg>

    <svg
      v-else-if="kind === 'qa1-thread-process-relation'"
      viewBox="0 0 820 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 主线程、子进程和后台线程的关系"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 主线程、子进程和后台线程的关系</text>

      <!-- 主进程大框 -->
      <rect x="40" y="46" width="320" height="180" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="200" y="72" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Redis 主进程（主线程）</text>

      <!-- 内部：接收请求+处理读写 -->
      <rect x="66" y="88" width="268" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="200" y="112" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">接收客户端请求</text>
      <text x="200" y="130" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">处理读写命令</text>

      <!-- 内部标注 -->
      <text x="200" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">核心命令执行，单线程串行</text>

      <!-- fork 箭头 → 子进程 -->
      <line x1="360" y1="100" x2="460" y2="100" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <polygon points="460,96 460,104 472,100" fill="var(--d-rv-c-border)" />
      <text x="410" y="92" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">fork</text>

      <!-- 子进程框 -->
      <rect x="476" y="60" width="300" height="80" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="626" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">子进程</text>
      <text x="626" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">bgsave / bgrewriteaof</text>
      <text x="626" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">独立地址空间，不阻塞主线程</text>

      <!-- pthread_create 箭头 → 后台线程 -->
      <line x1="360" y1="180" x2="460" y2="180" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="460,176 460,184 472,180" fill="var(--d-warn-border)" />
      <text x="396" y="172" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">pthread_create</text>

      <!-- 后台线程框 -->
      <rect x="476" y="156" width="300" height="80" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="626" y="186" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">后台线程</text>
      <text x="626" y="208" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">异步删除 / AOF 刷盘 / 文件关闭</text>
      <text x="626" y="224" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">共享主进程地址空间</text>

      <text x="410" y="304" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">主线程负责核心命令执行，子进程和后台线程负责耗时操作，避免阻塞主线程</text>
    </svg>

    <svg
      v-else-if="kind === 'qa1-cow-mechanism'"
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="写时复制底层机制示意图"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">写时复制（Copy-On-Write）底层机制</text>

      <!-- 左侧：修改前 -->
      <rect x="30" y="50" width="240" height="140" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="150" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">修改前（共享状态）</text>
      <rect x="54" y="92" width="192" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="150" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">主线程页表：虚页 7 → 物理页 33</text>
      <rect x="54" y="136" width="192" height="32" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="150" y="157" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">bgsave 页表：虚页 7 → 物理页 33</text>

      <!-- 中间箭头 -->
      <line x1="280" y1="120" x2="360" y2="120" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="360,116 360,124 372,120" fill="var(--d-warn-border)" />
      <text x="320" y="110" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">主线程修改</text>
      <text x="320" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">虚页 7</text>

      <!-- 右上：主线程新页表 -->
      <rect x="386" y="50" width="440" height="80" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="606" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">主线程（修改后）</text>
      <rect x="410" y="92" width="200" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="510" y="111" text-anchor="middle" font-size="10" fill="var(--d-text)">虚页 7 → 物理页 53</text>
      <text x="720" y="111" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">新数据</text>

      <!-- 右下：bgsave 子进程页表 -->
      <rect x="386" y="150" width="440" height="80" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="606" y="176" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">bgsave 子进程（不受影响）</text>
      <rect x="410" y="192" width="200" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="510" y="211" text-anchor="middle" font-size="10" fill="var(--d-text)">虚页 7 → 物理页 33</text>
      <text x="720" y="211" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">原始数据</text>

      <!-- 物理内存标注 -->
      <rect x="130" y="250" width="180" height="44" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="220" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">物理页 33（原始数据）</text>
      <text x="220" y="285" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">bgsave 仍可读取</text>
      <rect x="530" y="250" width="180" height="44" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="620" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">物理页 53（新写数据）</text>
      <text x="620" y="285" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">主线程使用新页</text>

      <text x="430" y="330" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">fork 后子进程复制页表，主线程写时分配新物理页，子进程仍读原始数据</text>
    </svg>

    <svg
      v-else-if="kind === 'qa1-repl-buffers'"
      viewBox="0 0 820 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="replication buffer 与 repl_backlog_buffer 区别"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">replication buffer vs repl_backlog_buffer</text>

      <!-- 主库 -->
      <rect x="40" y="60" width="160" height="160" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="120" y="96" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">主库</text>
      <text x="120" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">接收写命令</text>
      <text x="120" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">分发给从库</text>

      <!-- 从库 A + replication buffer -->
      <line x1="200" y1="100" x2="340" y2="80" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <polygon points="340,76 340,84 352,80" fill="var(--d-rv-a-border)" />
      <rect x="356" y="46" width="200" height="68" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="456" y="70" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">从库 A</text>
      <text x="456" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">replication buffer（独享）</text>
      <text x="456" y="104" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">全量复制期间传增量命令</text>

      <!-- 从库 B + replication buffer -->
      <line x1="200" y1="160" x2="340" y2="160" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="340,156 340,164 352,160" fill="var(--d-rv-c-border)" />
      <rect x="356" y="130" width="200" height="68" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="456" y="154" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">从库 B</text>
      <text x="456" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">replication buffer（独享）</text>
      <text x="456" y="188" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">全量复制期间传增量命令</text>

      <!-- repl_backlog_buffer 共享环形 -->
      <rect x="620" y="56" width="170" height="150" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="705" y="84" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">repl_backlog</text>
      <text x="705" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">_buffer</text>
      <!-- 环形示意 -->
      <ellipse cx="705" cy="148" rx="46" ry="30" fill="none" stroke="var(--d-warn-border)" stroke-width="1.4" stroke-dasharray="6 3" />
      <text x="705" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">环形</text>
      <text x="705" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">所有从库共享</text>

      <!-- 连接线 -->
      <line x1="556" y1="80" x2="620" y2="120" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="4 3" />
      <line x1="556" y1="160" x2="620" y2="140" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="4 3" />

      <!-- 关键区别标注 -->
      <rect x="140" y="238" width="540" height="38" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="410" y="256" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">replication buffer：每个从库独享，全量复制期间使用</text>
      <text x="410" y="270" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">repl_backlog_buffer：所有从库共享，环形缓冲区，用于增量复制</text>

      <text x="410" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">两者用途不同，replication buffer 按从库分配，repl_backlog_buffer 全局唯一</text>
    </svg>

    <!-- ====== 11. String 类型内存分析 ====== -->

    <!-- SVG: string-sds-structure — SDS 结构体 -->
    <svg
      v-else-if="kind === 'string-sds-structure'"
      viewBox="0 0 700 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SDS 简单动态字符串结构体"
      role="img"
    >
      <text x="350" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">SDS（Simple Dynamic String）结构体</text>

      <!-- len 字段 -->
      <rect x="40" y="60" width="120" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="100" y="84" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-rv-a-text)">len</text>
      <text x="100" y="104" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">4 字节 · 已用长度</text>

      <!-- alloc 字段 -->
      <rect x="180" y="60" width="120" height="56" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="240" y="84" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-rv-b-text)">alloc</text>
      <text x="240" y="104" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">4 字节 · 分配长度</text>

      <!-- buf 字段 -->
      <rect x="320" y="60" width="340" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="490" y="80" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">buf[ ]</text>
      <!-- 字节小方格 -->
      <rect x="340" y="92" width="28" height="18" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="354" y="105" text-anchor="middle" font-size="9" fill="var(--d-text)">H</text>
      <rect x="374" y="92" width="28" height="18" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="388" y="105" text-anchor="middle" font-size="9" fill="var(--d-text)">e</text>
      <rect x="408" y="92" width="28" height="18" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="422" y="105" text-anchor="middle" font-size="9" fill="var(--d-text)">l</text>
      <rect x="442" y="92" width="28" height="18" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="456" y="105" text-anchor="middle" font-size="9" fill="var(--d-text)">l</text>
      <rect x="476" y="92" width="28" height="18" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="490" y="105" text-anchor="middle" font-size="9" fill="var(--d-text)">o</text>
      <text x="516" y="105" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">...</text>
      <rect x="534" y="92" width="28" height="18" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="548" y="105" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">\0</text>

      <!-- 箭头连接 -->
      <line x1="160" y1="88" x2="180" y2="88" stroke="var(--d-border)" stroke-width="1.2" />
      <line x1="300" y1="88" x2="320" y2="88" stroke="var(--d-border)" stroke-width="1.2" />

      <!-- 额外开销标注 -->
      <line x1="40" y1="140" x2="300" y2="140" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="4 3" />
      <line x1="40" y1="136" x2="40" y2="144" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <line x1="300" y1="136" x2="300" y2="144" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="170" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">len + alloc = SDS 额外开销（8 字节）</text>

      <text x="490" y="145" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">buf 保存实际数据 + 自动追加 '\0'</text>
      <text x="350" y="185" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">SDS 通过 len 字段实现 O(1) 获取字符串长度，通过 alloc 预分配减少内存重分配次数</text>
    </svg>

    <!-- SVG: string-redisobject-ptr — RedisObject 指向 SDS -->
    <svg
      v-else-if="kind === 'string-redisobject-ptr'"
      viewBox="0 0 780 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RedisObject 结构指向 SDS"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">RedisObject 结构指向 SDS</text>

      <!-- RedisObject 框 -->
      <rect x="40" y="50" width="260" height="100" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="170" y="72" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">RedisObject</text>
      <!-- 元数据 -->
      <rect x="60" y="84" width="108" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="114" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">元数据</text>
      <text x="114" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">8 字节</text>
      <!-- *ptr -->
      <rect x="180" y="84" width="108" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="234" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">*ptr</text>
      <text x="234" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">8 字节</text>

      <!-- 箭头 -->
      <defs><marker id="robj-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--d-text)" /></marker></defs>
      <line x1="300" y1="102" x2="440" y2="102" stroke="var(--d-text)" stroke-width="1.6" marker-end="url(#robj-arrow)" />
      <text x="370" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">指向</text>

      <!-- SDS 框 -->
      <rect x="450" y="50" width="290" height="100" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="595" y="72" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">SDS</text>
      <rect x="466" y="84" width="60" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="496" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">len</text>
      <text x="496" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">4B</text>
      <rect x="534" y="84" width="60" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="564" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">alloc</text>
      <text x="564" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">4B</text>
      <rect x="602" y="84" width="126" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="665" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">buf[ ]</text>
      <text x="665" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">字节数组</text>

      <!-- 总开销标注 -->
      <text x="170" y="175" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">RedisObject 占 16 字节</text>
      <text x="170" y="193" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">（元数据 8B + 指针 8B）</text>
      <text x="595" y="175" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">SDS 额外开销 8 字节 + 实际数据</text>
    </svg>

    <!-- SVG: string-encoding-modes — int/embstr/raw 三种编码 -->
    <svg
      v-else-if="kind === 'string-encoding-modes'"
      viewBox="0 0 860 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="int / embstr / raw 三种编码模式对比"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">String 三种编码模式对比</text>

      <!-- 列1: int -->
      <rect x="30" y="50" width="240" height="190" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="150" y="74" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-c-text)">int 编码</text>
      <rect x="55" y="90" width="190" height="60" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="150" y="112" text-anchor="middle" font-size="11" fill="var(--d-text)">RedisObject</text>
      <text x="150" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">ptr 直接存整数值</text>
      <text x="150" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">适用：64位有符号整数</text>
      <text x="150" y="190" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优势：无额外分配</text>
      <text x="150" y="225" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">仅 16 字节</text>

      <!-- 列2: embstr -->
      <rect x="310" y="50" width="240" height="190" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="430" y="74" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">embstr 编码</text>
      <rect x="330" y="90" width="200" height="60" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="430" y="108" text-anchor="middle" font-size="11" fill="var(--d-text)">RedisObject + SDS</text>
      <text x="430" y="125" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">连续内存，一次分配</text>
      <!-- 连续内存示意线 -->
      <line x1="340" y1="138" x2="520" y2="138" stroke="var(--d-blue-border)" stroke-width="2" stroke-linecap="round" />
      <text x="430" y="172" text-anchor="middle" font-size="10" fill="var(--d-text)">适用：字符串 ≤ 44 字节</text>
      <text x="430" y="190" text-anchor="middle" font-size="10" fill="var(--d-text)">优势：减少内存碎片</text>
      <text x="430" y="225" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">一次分配 64 字节</text>

      <!-- 列3: raw -->
      <rect x="590" y="50" width="240" height="190" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="710" y="74" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-warn-text)">raw 编码</text>
      <rect x="610" y="90" width="80" height="40" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="115" text-anchor="middle" font-size="10" fill="var(--d-text)">RObj</text>
      <!-- 箭头 -->
      <defs><marker id="raw-arrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><path d="M0,0 L7,2.5 L0,5" fill="var(--d-warn-text)" /></marker></defs>
      <line x1="690" y1="110" x2="720" y2="110" stroke="var(--d-warn-text)" stroke-width="1.2" marker-end="url(#raw-arrow)" />
      <rect x="724" y="90" width="80" height="40" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="764" y="115" text-anchor="middle" font-size="10" fill="var(--d-text)">SDS</text>
      <text x="710" y="155" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">独立分配，ptr 指向 SDS</text>
      <text x="710" y="178" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适用：字符串 > 44 字节</text>
      <text x="710" y="196" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">两次内存分配</text>
      <text x="710" y="225" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">开销 > 64 字节</text>

      <text x="430" y="268" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Redis 根据值的类型和大小自动选择最优编码方式</text>
    </svg>

    <!-- SVG: string-dictentry-overhead — dictEntry 结构开销 -->
    <svg
      v-else-if="kind === 'string-dictentry-overhead'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="dictEntry 结构开销分析"
      role="img"
    >
      <text x="380" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">dictEntry 结构与内存开销</text>

      <!-- dictEntry 主框 -->
      <rect x="40" y="48" width="300" height="120" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="190" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">dictEntry</text>

      <!-- 三个指针 -->
      <rect x="56" y="82" width="84" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="98" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">*key</text>
      <text x="98" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">8B</text>

      <rect x="148" y="82" width="84" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="190" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">*value</text>
      <text x="190" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">8B</text>

      <rect x="240" y="82" width="84" height="36" rx="8" fill="var(--d-border)" stroke="var(--d-border)" stroke-width="1" />
      <text x="282" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">*next</text>
      <text x="282" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">8B</text>

      <text x="190" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">3 指针 = 24B → jemalloc 分配 32B</text>

      <!-- 箭头指向 key/value RedisObject -->
      <defs><marker id="de-arrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><path d="M0,0 L7,2.5 L0,5" fill="var(--d-text)" /></marker></defs>

      <!-- key RedisObject -->
      <line x1="98" y1="118" x2="98" y2="178" stroke="var(--d-text)" stroke-width="1.2" marker-end="url(#de-arrow)" />
      <rect x="50" y="182" width="96" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="98" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">RObj(key) 16B</text>

      <!-- value RedisObject -->
      <line x1="190" y1="118" x2="190" y2="178" stroke="var(--d-text)" stroke-width="1.2" marker-end="url(#de-arrow)" />
      <rect x="142" y="182" width="96" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="190" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">RObj(val) 16B</text>

      <!-- 右侧总结 -->
      <rect x="400" y="52" width="320" height="116" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="560" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">总元数据开销</text>
      <text x="560" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">dictEntry(32B)</text>
      <text x="560" y="118" text-anchor="middle" font-size="11" fill="var(--d-text)">+ key RedisObject(16B)</text>
      <text x="560" y="136" text-anchor="middle" font-size="11" fill="var(--d-text)">+ value RedisObject(16B)</text>
      <line x1="440" y1="146" x2="680" y2="146" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="560" y="162" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-warn-text)">= 64 字节</text>

      <text x="560" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">有效数据仅 16B，额外开销 48B（占 75%）</text>
      <text x="380" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">jemalloc 按 2 的幂次分配：申请 24B → 实际分配 32B</text>
    </svg>

    <!-- SVG: string-ziplist-saving — 压缩列表 entry 节省内存 -->
    <svg
      v-else-if="kind === 'string-ziplist-saving'"
      viewBox="0 0 780 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="压缩列表 entry 节省内存对比"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">压缩列表 entry vs dictEntry 内存对比</text>

      <!-- entry 结构 -->
      <rect x="40" y="48" width="440" height="100" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="260" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">ziplist entry 内部结构</text>

      <rect x="58" y="84" width="72" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="94" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">prev_len</text>
      <text x="94" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">1B</text>

      <rect x="138" y="84" width="56" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="166" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">len</text>
      <text x="166" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">4B</text>

      <rect x="202" y="84" width="72" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="238" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">encoding</text>
      <text x="238" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">1B</text>

      <rect x="282" y="84" width="180" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="372" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">content（实际数据）</text>
      <text x="372" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">8B</text>

      <text x="260" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">1 + 4 + 1 + 8 = 14B → jemalloc 分配 16B</text>

      <!-- 对比框 -->
      <rect x="520" y="48" width="220" height="100" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="630" y="72" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">dictEntry 方式</text>
      <text x="630" y="96" text-anchor="middle" font-size="20" font-weight="700" fill="var(--d-warn-text)">64B</text>
      <text x="630" y="118" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">dictEntry + 2x RedisObject</text>
      <text x="630" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">有效数据同样 16B</text>

      <!-- 对比 VS -->
      <text x="497" y="102" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">vs</text>

      <!-- 底部总结 -->
      <rect x="140" y="166" width="500" height="36" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="390" y="184" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">ziplist entry 仅需 16B，比 dictEntry 的 64B 节省 75% 内存</text>
      <text x="390" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">压缩列表用连续内存存储 entry，省去了指针和独立分配的开销</text>
    </svg>

    <!-- ===== 12. 集合类型统计 ===== -->

    <!-- billion-set-cumulative: 累计用户 Set 示意图 -->
    <svg
      v-else-if="kind === 'billion-set-cumulative'"
      viewBox="0 0 700 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="累计用户 Set 示意图"
      role="img"
    >
      <rect x="16" y="16" width="668" height="168" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />

      <!-- Set 容器 -->
      <rect x="60" y="40" width="380" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="80" y="68" font-size="13" font-weight="700" fill="var(--d-text)">Set</text>
      <text x="120" y="68" font-size="12" fill="var(--d-text-sub)">key = "user:id"</text>

      <!-- 用户 ID 元素 -->
      <rect x="80" y="82" width="72" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="116" y="101" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">user1</text>
      <rect x="164" y="82" width="72" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="200" y="101" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">user2</text>
      <rect x="248" y="82" width="72" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="284" y="101" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">user3</text>
      <rect x="332" y="82" width="88" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="376" y="101" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">user4 ...</text>

      <text x="250" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">value = { user1, user2, user3, user4, ... }</text>

      <!-- 标注 -->
      <text x="490" y="90" font-size="11" fill="var(--d-text-sub)">所有登录过 App</text>
      <text x="490" y="108" font-size="11" fill="var(--d-text-sub)">的用户 ID 集合</text>
      <line x1="460" y1="96" x2="444" y2="96" stroke="var(--d-text-muted)" stroke-width="1.2" />
      <polygon points="444,96 452,92 452,100" fill="var(--d-text-muted)" />
    </svg>

    <!-- billion-set-daily: 每日用户 Set 示意图 -->
    <svg
      v-else-if="kind === 'billion-set-daily'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="每日用户 Set 示意图"
      role="img"
    >
      <rect x="16" y="16" width="728" height="208" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />

      <!-- 左侧 Set: 20200803 -->
      <rect x="40" y="40" width="300" height="120" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="60" y="66" font-size="12" font-weight="700" fill="var(--d-text)">Set</text>
      <text x="96" y="66" font-size="11" fill="var(--d-rv-b-text)">key = "user:id:20200803"</text>

      <rect x="60" y="80" width="68" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="94" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">user1</text>
      <rect x="140" y="80" width="68" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="174" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">user4</text>
      <rect x="220" y="80" width="68" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="254" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">user5</text>

      <text x="190" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">8 月 3 日登录的用户</text>

      <!-- 右侧 Set: 20200804 -->
      <rect x="400" y="40" width="310" height="120" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="420" y="66" font-size="12" font-weight="700" fill="var(--d-text)">Set</text>
      <text x="456" y="66" font-size="11" fill="var(--d-rv-c-text)">key = "user:id:20200804"</text>

      <rect x="420" y="80" width="68" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="454" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">user1</text>
      <rect x="500" y="80" width="68" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="534" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">user2</text>
      <rect x="580" y="80" width="68" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="614" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">user7</text>

      <text x="555" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">8 月 4 日登录的用户</text>

      <!-- 底部说明 -->
      <text x="380" y="194" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">每天的登录用户放入独立 Set，配合差集 / 交集统计新增和留存</text>
    </svg>

    <!-- billion-bitmap-and: Bitmap 按位与操作 -->
    <svg
      v-else-if="kind === 'billion-bitmap-and'"
      viewBox="0 0 780 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bitmap 按位与操作"
      role="img"
    >
      <rect x="16" y="16" width="748" height="228" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />

      <!-- bm1 -->
      <text x="50" y="58" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">bm1</text>
      <rect x="100" y="40" width="32" height="28" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="116" y="59" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">1</text>
      <rect x="136" y="40" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="152" y="59" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="172" y="40" width="32" height="28" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="188" y="59" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">1</text>
      <rect x="208" y="40" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="224" y="59" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="244" y="40" width="32" height="28" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="260" y="59" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">1</text>
      <rect x="280" y="40" width="32" height="28" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="296" y="59" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">1</text>
      <rect x="316" y="40" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="332" y="59" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="352" y="40" width="32" height="28" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="368" y="59" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">1</text>

      <!-- bm2 -->
      <text x="50" y="98" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">bm2</text>
      <rect x="100" y="80" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="116" y="99" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="136" y="80" width="32" height="28" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="152" y="99" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-b-text)">1</text>
      <rect x="172" y="80" width="32" height="28" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="188" y="99" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-b-text)">1</text>
      <rect x="208" y="80" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="224" y="99" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="244" y="80" width="32" height="28" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="260" y="99" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-b-text)">1</text>
      <rect x="280" y="80" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="296" y="99" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="316" y="80" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="332" y="99" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="352" y="80" width="32" height="28" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="368" y="99" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-b-text)">1</text>

      <!-- bm3 -->
      <text x="50" y="138" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">bm3</text>
      <rect x="100" y="120" width="32" height="28" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="116" y="139" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">1</text>
      <rect x="136" y="120" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="152" y="139" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="172" y="120" width="32" height="28" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="188" y="139" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">1</text>
      <rect x="208" y="120" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="224" y="139" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="244" y="120" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="260" y="139" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="280" y="120" width="32" height="28" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="296" y="139" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">1</text>
      <rect x="316" y="120" width="32" height="28" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="332" y="139" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">1</text>
      <rect x="352" y="120" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="368" y="139" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>

      <!-- AND 操作符 -->
      <text x="440" y="100" font-size="14" font-weight="700" fill="var(--d-text)">BITOP AND</text>
      <line x1="400" y1="54" x2="400" y2="148" stroke="var(--d-border)" stroke-width="1.2" stroke-dasharray="4 4" />
      <polygon points="400,160 394,150 406,150" fill="var(--d-text-muted)" />

      <!-- 右侧标注 -->
      <text x="530" y="58" font-size="10" fill="var(--d-text-sub)">三个 Bitmap 做按位与</text>
      <text x="530" y="76" font-size="10" fill="var(--d-text-sub)">结果只有全部为 1 的位才是 1</text>

      <!-- resmap 结果 -->
      <text x="50" y="184" font-size="12" font-weight="700" fill="var(--d-warn-text)">resmap</text>
      <rect x="100" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="116" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="136" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="152" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="172" y="166" width="32" height="28" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="188" y="185" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">1</text>
      <rect x="208" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="224" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="244" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="260" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="280" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="296" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="316" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="332" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>
      <rect x="352" y="166" width="32" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="368" y="185" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">0</text>

      <!-- 底部说明 -->
      <text x="530" y="184" font-size="11" fill="var(--d-text-sub)">用于统计连续多天都签到的用户</text>

      <!-- 竖线标注第3位 -->
      <line x1="188" y1="152" x2="188" y2="164" stroke="var(--d-warn-border)" stroke-width="1.6" />
    </svg>

    <!-- billion-collection-summary: 集合类型统计模式总结表 -->
    <svg
      v-else-if="kind === 'billion-collection-summary'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="集合类型统计模式总结表"
      role="img"
    >
      <rect x="16" y="16" width="828" height="288" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />

      <!-- 表头 -->
      <rect x="40" y="36" width="800" height="36" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="160" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">统计模式</text>
      <text x="380" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">推荐类型</text>
      <text x="640" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">特点</text>

      <!-- 分隔线 -->
      <line x1="270" y1="36" x2="270" y2="288" stroke="var(--d-border)" stroke-width="1" />
      <line x1="490" y1="36" x2="490" y2="288" stroke="var(--d-border)" stroke-width="1" />

      <!-- 行 1: 聚合统计 -->
      <text x="160" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">聚合统计（交/差/并集）</text>
      <rect x="350" y="90" width="60" height="26" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.1" />
      <text x="380" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">Set</text>
      <text x="640" y="102" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">支持交差并集运算</text>
      <text x="640" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">注意复杂度，可在从库执行</text>
      <line x1="40" y1="128" x2="840" y2="128" stroke="var(--d-border)" stroke-width="0.8" />

      <!-- 行 2: 排序统计 -->
      <text x="160" y="156" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">排序统计</text>
      <rect x="330" y="138" width="100" height="26" rx="7" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.1" />
      <text x="380" y="156" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-b-text)">Sorted Set</text>
      <text x="640" y="150" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">按权重排序，分页不会错乱</text>
      <text x="640" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">优于 List 的位置排序</text>
      <line x1="40" y1="176" x2="840" y2="176" stroke="var(--d-border)" stroke-width="0.8" />

      <!-- 行 3: 二值状态统计 -->
      <text x="160" y="204" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">二值状态统计</text>
      <rect x="340" y="186" width="80" height="26" rx="7" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="380" y="204" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">Bitmap</text>
      <text x="640" y="198" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">1 bit / 元素，内存极省</text>
      <text x="640" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">支持 BITOP 按位运算</text>
      <line x1="40" y1="224" x2="840" y2="224" stroke="var(--d-border)" stroke-width="0.8" />

      <!-- 行 4: 基数统计 -->
      <text x="160" y="256" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">基数统计</text>
      <rect x="320" y="240" width="120" height="26" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="380" y="258" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">HyperLogLog</text>
      <text x="640" y="248" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">12KB 统计 2^64 基数</text>
      <text x="640" y="266" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">有 0.81% 标准误差</text>
    </svg>

    <!-- ======================== 第 14 章 — 时间序列 ======================== -->

    <svg
      v-else-if="kind === 'timeseries-hash-query'"
      viewBox="0 0 700 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Hash 存储时间序列数据 — 支持单点查询"
      role="img"
    >
      <rect x="12" y="12" width="676" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="350" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">Hash 存储时间序列数据</text>

      <!-- Key -->
      <rect x="40" y="62" width="200" height="36" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="140" y="85" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-blue-text)">Key: device:temperature</text>

      <!-- 箭头 -->
      <line x1="244" y1="80" x2="274" y2="80" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#ts-arrow)" />
      <defs><marker id="ts-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)" /></marker></defs>

      <!-- Field-Value 对 -->
      <rect x="280" y="56" width="160" height="48" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="360" y="75" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">field: 202008030905</text>
      <text x="360" y="93" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">value: 25.1</text>

      <rect x="460" y="56" width="160" height="48" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="540" y="75" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">field: 202008030907</text>
      <text x="540" y="93" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">value: 25.9</text>

      <!-- HGET 命令 -->
      <rect x="80" y="120" width="200" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="180" y="140" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">HGET 单点查询 ✓</text>

      <rect x="340" y="120" width="240" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="460" y="140" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">范围查询 ✗ (需全表扫描)</text>

      <text x="350" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">支持 HGET 单点查询，不支持范围查询</text>
    </svg>

    <svg
      v-else-if="kind === 'timeseries-sortedset-range'"
      viewBox="0 0 760 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sorted Set 存储时间序列数据 — 支持范围查询"
      role="img"
    >
      <rect x="12" y="12" width="736" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">Sorted Set 存储时间序列数据</text>

      <!-- 标题行 -->
      <text x="140" y="72" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text-sub)">member (温度值)</text>
      <text x="340" y="72" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text-sub)">score (时间戳)</text>

      <!-- 数据行 -->
      <rect x="50" y="82" width="180" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="140" y="101" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">25.1</text>
      <rect x="250" y="82" width="180" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="340" y="101" text-anchor="middle" font-size="11" fill="var(--d-blue-text)">202008030905</text>

      <rect x="50" y="114" width="180" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="140" y="133" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">25.9</text>
      <rect x="250" y="114" width="180" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="340" y="133" text-anchor="middle" font-size="11" fill="var(--d-blue-text)">202008030907</text>

      <rect x="50" y="146" width="180" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="140" y="165" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">24.9</text>
      <rect x="250" y="146" width="180" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="340" y="165" text-anchor="middle" font-size="11" fill="var(--d-blue-text)">202008030908</text>

      <!-- ZRANGEBYSCORE 命令 -->
      <rect x="480" y="90" width="250" height="70" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="605" y="115" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">ZRANGEBYSCORE</text>
      <text x="605" y="133" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按 score 范围查询 ✓</text>
      <text x="605" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">高效有序索引</text>

      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">支持 ZRANGEBYSCORE 范围查询</text>
    </svg>

    <svg
      v-else-if="kind === 'timeseries-multi-exec'"
      viewBox="0 0 700 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MULTI/EXEC 保证 Hash 与 Sorted Set 原子写入"
      role="img"
    >
      <rect x="12" y="12" width="676" height="196" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="350" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">MULTI / EXEC 原子性写入</text>

      <!-- MULTI -->
      <rect x="40" y="60" width="120" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="85" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-blue-text)">MULTI</text>

      <!-- 箭头 MULTI → 命令队列 -->
      <line x1="164" y1="80" x2="194" y2="80" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#me-arrow)" />
      <defs><marker id="me-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)" /></marker></defs>

      <!-- 命令队列 -->
      <rect x="200" y="56" width="280" height="90" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="340" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">命令队列 (QUEUED)</text>

      <rect x="220" y="86" width="240" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="340" y="103" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">HSET device:temperature 202008030911 26.8</text>

      <rect x="220" y="114" width="240" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="340" y="131" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">ZADD device:temperature 202008030911 26.8</text>

      <!-- 箭头 命令队列 → EXEC -->
      <line x1="484" y1="100" x2="514" y2="100" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#me-arrow)" />

      <!-- EXEC -->
      <rect x="520" y="60" width="140" height="86" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="590" y="85" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">EXEC</text>
      <text x="590" y="105" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">同时执行</text>
      <text x="590" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">→ (integer) 1</text>
      <text x="590" y="135" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">→ (integer) 1</text>

      <!-- 底部标注 -->
      <rect x="140" y="160" width="420" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="350" y="181" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">确保 Hash 和 Sorted Set 同时写入成功</text>
    </svg>

    <!-- ======================== 第 15 章 — 消息队列 ======================== -->

    <svg
      v-else-if="kind === 'mq-list-basic'"
      viewBox="0 0 760 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="List 做消息队列 — LPUSH/RPOP 先进先出"
      role="img"
    >
      <rect x="12" y="12" width="736" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">List 实现消息队列（LPUSH / RPOP）</text>

      <!-- 生产者 -->
      <rect x="40" y="70" width="130" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="105" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-blue-text)">生产者</text>
      <text x="105" y="108" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">LPUSH</text>

      <!-- 箭头 生产者 → List -->
      <line x1="174" y1="95" x2="224" y2="95" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#mq-arrow)" />
      <defs><marker id="mq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)" /></marker></defs>

      <!-- List 队列 -->
      <rect x="230" y="64" width="300" height="62" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="380" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">List (消息队列)</text>

      <!-- 消息格子 -->
      <rect x="254" y="92" width="56" height="26" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="282" y="110" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">5</text>
      <rect x="318" y="92" width="56" height="26" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="346" y="110" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">3</text>
      <rect x="382" y="92" width="56" height="26" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="410" y="110" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">…</text>

      <text x="258" y="88" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">← 左</text>
      <text x="510" y="88" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">右 →</text>

      <!-- 箭头 List → 消费者 -->
      <line x1="534" y1="95" x2="584" y2="95" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#mq-arrow)" />

      <!-- 消费者 -->
      <rect x="590" y="70" width="130" height="50" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="655" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">消费者</text>
      <text x="655" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">RPOP</text>

      <text x="380" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先进先出保证消息有序</text>
    </svg>

    <svg
      v-else-if="kind === 'mq-brpoplpush'"
      viewBox="0 0 700 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BRPOP 阻塞式读取 vs RPOP 轮询"
      role="img"
    >
      <rect x="12" y="12" width="676" height="156" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="350" y="40" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">BRPOP 阻塞式读取</text>

      <!-- RPOP 轮询 (左侧) -->
      <rect x="40" y="56" width="280" height="90" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="180" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">RPOP 轮询方式</text>
      <text x="180" y="97" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">while(1) { RPOP queue }</text>
      <text x="180" y="113" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">队列为空时持续轮询</text>
      <text x="180" y="129" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">浪费 CPU 资源 ✗</text>

      <!-- VS -->
      <text x="350" y="105" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text-muted)">VS</text>

      <!-- BRPOP 阻塞 (右侧) -->
      <rect x="380" y="56" width="280" height="90" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="520" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">BRPOP 阻塞方式</text>
      <text x="520" y="97" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">BRPOP queue timeout</text>
      <text x="520" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">队列为空时自动阻塞等待</text>
      <text x="520" y="129" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">节省 CPU 开销 ✓</text>

      <text x="350" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">BRPOP 在队列为空时自动阻塞，有新消息时立刻读取</text>
    </svg>

    <svg
      v-else-if="kind === 'mq-list-rpop'"
      viewBox="0 0 760 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pub/Sub 发布订阅 — 一对多消息分发"
      role="img"
    >
      <rect x="12" y="12" width="736" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">Pub/Sub 发布订阅模式</text>

      <!-- 发布者 -->
      <rect x="40" y="70" width="130" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="105" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-blue-text)">发布者</text>
      <text x="105" y="108" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">PUBLISH</text>

      <!-- 箭头 发布者 → channel -->
      <line x1="174" y1="95" x2="234" y2="95" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#ps-arrow)" />
      <defs><marker id="ps-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)" /></marker></defs>

      <!-- Channel -->
      <rect x="240" y="64" width="190" height="62" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="335" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Channel</text>
      <text x="335" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">news.updates</text>

      <!-- 箭头 channel → 订阅者们 -->
      <line x1="434" y1="80" x2="504" y2="62" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#ps-arrow)" />
      <line x1="434" y1="95" x2="504" y2="95" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#ps-arrow)" />
      <line x1="434" y1="110" x2="504" y2="128" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#ps-arrow)" />

      <!-- 订阅者 1 -->
      <rect x="510" y="40" width="120" height="36" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="570" y="63" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">订阅者 1</text>

      <!-- 订阅者 2 -->
      <rect x="510" y="80" width="120" height="36" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="570" y="103" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">订阅者 2</text>

      <!-- 订阅者 3 -->
      <rect x="510" y="120" width="120" height="36" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="570" y="143" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">订阅者 3</text>

      <!-- SUBSCRIBE 标注 -->
      <text x="660" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">SUBSCRIBE</text>

      <text x="380" y="170" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">一条消息可被多个消费者接收</text>
    </svg>

    <svg
      v-else-if="kind === 'mq-list-backup'"
      viewBox="0 0 820 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BRPOPLPUSH 消息备份机制"
      role="img"
    >
      <rect x="12" y="12" width="796" height="216" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="410" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">BRPOPLPUSH 消息备份</text>

      <!-- 生产者 -->
      <rect x="40" y="70" width="120" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-blue-text)">生产者</text>
      <text x="100" y="108" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">LPUSH</text>

      <!-- 箭头 生产者 → mq -->
      <line x1="164" y1="95" x2="214" y2="95" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#bk-arrow)" />
      <defs><marker id="bk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)" /></marker></defs>

      <!-- mq 队列 -->
      <rect x="220" y="64" width="200" height="62" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="320" y="86" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">mq (消息队列)</text>
      <rect x="240" y="96" width="46" height="22" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="263" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">5</text>
      <rect x="294" y="96" width="46" height="22" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="317" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">3</text>
      <rect x="348" y="96" width="46" height="22" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="371" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">…</text>

      <!-- 箭头 mq → 消费者 (BRPOPLPUSH) -->
      <line x1="424" y1="95" x2="494" y2="95" stroke="var(--d-text-muted)" stroke-width="1.4" marker-end="url(#bk-arrow)" />
      <text x="459" y="86" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">BRPOPLPUSH</text>

      <!-- 消费者 -->
      <rect x="500" y="70" width="120" height="50" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="560" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">消费者</text>
      <text x="560" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">处理消息</text>

      <!-- 箭头 mq → mqback (复制) -->
      <path d="M320 130 L320 160 L520 160" fill="none" stroke="var(--d-warn-border)" stroke-width="1.4" marker-end="url(#bk-arrow)" stroke-dasharray="5 3" />
      <text x="420" y="153" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">同时复制</text>

      <!-- mqback 备份队列 -->
      <rect x="526" y="140" width="220" height="50" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="636" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">mqback (备份队列)</text>
      <text x="636" y="178" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">消费者宕机后可重新读取</text>

      <!-- 宕机恢复箭头 -->
      <path d="M560 124 L560 136 L636 136" fill="none" stroke="var(--d-warn-border)" stroke-width="1.2" stroke-dasharray="4 3" />

      <text x="410" y="215" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">BRPOPLPUSH 读取消息的同时备份到 mqback，消费者宕机后可从 mqback 重新读取</text>
    </svg>

    <svg
      v-else-if="kind === 'mq-comparison-table'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="List vs Streams 消息队列方案对比"
      role="img"
    >
      <rect x="12" y="12" width="836" height="276" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="430" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">List vs Streams 消息队列方案对比</text>

      <!-- 表头 -->
      <rect x="40" y="56" width="180" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="130" y="77" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">对比维度</text>
      <rect x="230" y="56" width="280" height="32" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="370" y="77" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-blue-text)">List</text>
      <rect x="520" y="56" width="300" height="32" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="670" y="77" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Streams</text>

      <!-- 行1: 消息保序 -->
      <rect x="40" y="96" width="180" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="117" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">消息保序</text>
      <rect x="230" y="96" width="280" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="370" y="117" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">LPUSH / RPOP 保序</text>
      <rect x="520" y="96" width="300" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="670" y="117" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">XADD / XREAD 保序</text>

      <!-- 行2: 阻塞读取 -->
      <rect x="40" y="136" width="180" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="157" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">阻塞读取</text>
      <rect x="230" y="136" width="280" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="370" y="157" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">BRPOP</text>
      <rect x="520" y="136" width="300" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="670" y="157" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">XREAD block</text>

      <!-- 行3: 重复消息处理 -->
      <rect x="40" y="176" width="180" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="197" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">重复消息处理</text>
      <rect x="230" y="176" width="280" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="370" y="197" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">生产者自行生成全局 ID</text>
      <rect x="520" y="176" width="300" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="670" y="197" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">自动生成全局唯一 ID</text>

      <!-- 行4: 消息可靠性 -->
      <rect x="40" y="216" width="180" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="237" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">消息可靠性</text>
      <rect x="230" y="216" width="280" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="370" y="237" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">BRPOPLPUSH</text>
      <rect x="520" y="216" width="300" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="670" y="237" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">PENDING List + XACK</text>

      <!-- 行5: 消费组 -->
      <rect x="40" y="256" width="180" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="277" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">消费组</text>
      <rect x="230" y="256" width="280" height="32" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="370" y="277" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不支持</text>
      <rect x="520" y="256" width="300" height="32" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="670" y="277" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">XREADGROUP 支持</text>
    </svg>


    <!-- ==================== geo-hash-approach ==================== -->
    <svg
      v-else-if="kind === 'geo-hash-approach'"
      viewBox="0 0 700 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Hash 存储车辆经纬度信息"
      role="img"
    >
      <rect x="12" y="12" width="676" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="350" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">Hash 类型存储车辆经纬度</text>

      <!-- Key -->
      <rect x="40" y="62" width="140" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="110" y="78" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text-sub)">Key</text>
      <text x="110" y="94" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">cars:info</text>

      <!-- Arrow -->
      <line x1="185" y1="82" x2="215" y2="82" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#geo-arrow)" />

      <!-- Hash Table -->
      <rect x="220" y="56" width="440" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="290" y="76" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">field</text>
      <text x="290" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">车辆ID: 33</text>
      <line x1="360" y1="62" x2="360" y2="102" stroke="var(--d-rv-a-border)" stroke-width="0.8" />
      <text x="500" y="76" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">value</text>
      <text x="500" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">(116.034579, 39.000452)</text>

      <!-- Note -->
      <rect x="130" y="126" width="440" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-border)" stroke-width="1" />
      <text x="350" y="149" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">Hash 支持快速查找，但不支持范围查询</text>

      <defs>
        <marker id="geo-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-border)" /></marker>
      </defs>
    </svg>

    <!-- ==================== geo-sortedset-approach ==================== -->
    <svg
      v-else-if="kind === 'geo-sortedset-approach'"
      viewBox="0 0 760 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sorted Set 存储车辆经纬度信息"
      role="img"
    >
      <rect x="12" y="12" width="736" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">Sorted Set 类型存储车辆经纬度</text>

      <rect x="40" y="62" width="160" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="120" y="80" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text-sub)">元素 (member)</text>
      <text x="120" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">车辆ID: 33</text>

      <line x1="205" y1="84" x2="240" y2="84" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#geo-ss-arrow)" />

      <rect x="245" y="62" width="280" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="385" y="80" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">权重分数 (score)</text>
      <text x="385" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">GeoHash 编码后的经纬度值</text>

      <rect x="560" y="62" width="170" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="645" y="80" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">集合 Key</text>
      <text x="645" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">cars:locations</text>

      <rect x="200" y="126" width="360" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="380" y="149" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Sorted Set 有序，支持范围查询</text>

      <defs>
        <marker id="geo-ss-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-border)" /></marker>
      </defs>
    </svg>

    <!-- ==================== geo-longitude-encoding ==================== -->
    <svg
      v-else-if="kind === 'geo-longitude-encoding'"
      viewBox="0 0 780 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="经度 116.37 的 GeoHash 二分编码过程"
      role="img"
    >
      <rect x="12" y="12" width="756" height="256" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">经度编码：116.37 (N=5)</text>

      <rect x="40" y="58" width="700" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="90" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">次数</text>
      <text x="240" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">左分区</text>
      <text x="430" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">右分区</text>
      <text x="590" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">116.37 所属</text>
      <text x="690" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">编码</text>

      <rect x="40" y="88" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="107" text-anchor="middle" font-size="11" fill="var(--d-text)">1</text>
      <text x="240" y="107" text-anchor="middle" font-size="11" fill="var(--d-text)">[-180, 0)</text>
      <text x="430" y="107" text-anchor="middle" font-size="11" fill="var(--d-text)">[0, 180]</text>
      <text x="590" y="107" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [0, 180]</text>
      <text x="690" y="107" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="40" y="118" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="137" text-anchor="middle" font-size="11" fill="var(--d-text)">2</text>
      <text x="240" y="137" text-anchor="middle" font-size="11" fill="var(--d-text)">[0, 90)</text>
      <text x="430" y="137" text-anchor="middle" font-size="11" fill="var(--d-text)">[90, 180]</text>
      <text x="590" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [90, 180]</text>
      <text x="690" y="137" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="40" y="148" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="167" text-anchor="middle" font-size="11" fill="var(--d-text)">3</text>
      <text x="240" y="167" text-anchor="middle" font-size="11" fill="var(--d-text)">[90, 135)</text>
      <text x="430" y="167" text-anchor="middle" font-size="11" fill="var(--d-text)">[135, 180]</text>
      <text x="590" y="167" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">左 [90, 135)</text>
      <text x="690" y="167" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">0</text>

      <rect x="40" y="178" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">4</text>
      <text x="240" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">[90, 112.5)</text>
      <text x="430" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">[112.5, 135)</text>
      <text x="590" y="197" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [112.5, 135)</text>
      <text x="690" y="197" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="40" y="208" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="227" text-anchor="middle" font-size="11" fill="var(--d-text)">5</text>
      <text x="240" y="227" text-anchor="middle" font-size="11" fill="var(--d-text)">[112.5, 123.75)</text>
      <text x="430" y="227" text-anchor="middle" font-size="11" fill="var(--d-text)">[123.75, 135)</text>
      <text x="590" y="227" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">左 [112.5, 123.75)</text>
      <text x="690" y="227" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">0</text>

      <rect x="240" y="244" width="300" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="263" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">最终经度编码：1 1 0 1 0</text>
    </svg>

    <!-- ==================== geo-latitude-encoding ==================== -->
    <svg
      v-else-if="kind === 'geo-latitude-encoding'"
      viewBox="0 0 780 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="纬度 39.86 的 GeoHash 二分编码过程"
      role="img"
    >
      <rect x="12" y="12" width="756" height="256" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">纬度编码：39.86 (N=5)</text>

      <rect x="40" y="58" width="700" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="90" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">次数</text>
      <text x="240" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">左分区</text>
      <text x="430" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">右分区</text>
      <text x="590" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">39.86 所属</text>
      <text x="690" y="77" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">编码</text>

      <rect x="40" y="88" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="107" text-anchor="middle" font-size="11" fill="var(--d-text)">1</text>
      <text x="240" y="107" text-anchor="middle" font-size="11" fill="var(--d-text)">[-90, 0)</text>
      <text x="430" y="107" text-anchor="middle" font-size="11" fill="var(--d-text)">[0, 90]</text>
      <text x="590" y="107" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [0, 90]</text>
      <text x="690" y="107" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="40" y="118" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="137" text-anchor="middle" font-size="11" fill="var(--d-text)">2</text>
      <text x="240" y="137" text-anchor="middle" font-size="11" fill="var(--d-text)">[0, 45)</text>
      <text x="430" y="137" text-anchor="middle" font-size="11" fill="var(--d-text)">[45, 90]</text>
      <text x="590" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">左 [0, 45)</text>
      <text x="690" y="137" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">0</text>

      <rect x="40" y="148" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="167" text-anchor="middle" font-size="11" fill="var(--d-text)">3</text>
      <text x="240" y="167" text-anchor="middle" font-size="11" fill="var(--d-text)">[0, 22.5)</text>
      <text x="430" y="167" text-anchor="middle" font-size="11" fill="var(--d-text)">[22.5, 45)</text>
      <text x="590" y="167" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [22.5, 45)</text>
      <text x="690" y="167" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="40" y="178" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">4</text>
      <text x="240" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">[22.5, 33.75)</text>
      <text x="430" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">[33.75, 45)</text>
      <text x="590" y="197" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [33.75, 45)</text>
      <text x="690" y="197" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="40" y="208" width="700" height="28" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.6" />
      <text x="90" y="227" text-anchor="middle" font-size="11" fill="var(--d-text)">5</text>
      <text x="240" y="227" text-anchor="middle" font-size="11" fill="var(--d-text)">[33.75, 39.375)</text>
      <text x="430" y="227" text-anchor="middle" font-size="11" fill="var(--d-text)">[39.375, 45)</text>
      <text x="590" y="227" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">右 [39.375, 45)</text>
      <text x="690" y="227" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>

      <rect x="240" y="244" width="300" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="263" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">最终纬度编码：1 0 1 1 1</text>
    </svg>

    <!-- ==================== geo-interleave-encoding ==================== -->
    <svg
      v-else-if="kind === 'geo-interleave-encoding'"
      viewBox="0 0 760 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="经纬度编码交叉组合过程"
      role="img"
    >
      <rect x="12" y="12" width="736" height="176" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">经纬度编码交叉组合</text>

      <text x="60" y="76" font-size="12" font-weight="600" fill="var(--d-text-sub)">经度编码：</text>
      <g transform="translate(160, 62)">
        <rect x="0" y="0" width="28" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="14" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>
        <rect x="36" y="0" width="28" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="50" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>
        <rect x="72" y="0" width="28" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="86" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">0</text>
        <rect x="108" y="0" width="28" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="122" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">1</text>
        <rect x="144" y="0" width="28" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="158" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">0</text>
      </g>

      <text x="60" y="116" font-size="12" font-weight="600" fill="var(--d-text-sub)">纬度编码：</text>
      <g transform="translate(160, 102)">
        <rect x="0" y="0" width="28" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="14" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">1</text>
        <rect x="36" y="0" width="28" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="50" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">0</text>
        <rect x="72" y="0" width="28" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="86" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">1</text>
        <rect x="108" y="0" width="28" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="122" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">1</text>
        <rect x="144" y="0" width="28" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="158" y="17" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">1</text>
      </g>

      <text x="400" y="96" text-anchor="middle" font-size="18" fill="var(--d-text-muted)">&#8594;</text>

      <text x="440" y="68" font-size="11" font-weight="600" fill="var(--d-text-sub)">交叉组合结果：</text>
      <g transform="translate(440, 76)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="12" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">1</text>
        <rect x="26" y="0" width="24" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="38" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">1</text>
        <rect x="52" y="0" width="24" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="64" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">1</text>
        <rect x="78" y="0" width="24" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="90" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">0</text>
        <rect x="104" y="0" width="24" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="116" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">0</text>
        <rect x="130" y="0" width="24" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="142" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">1</text>
        <rect x="156" y="0" width="24" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="168" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">1</text>
        <rect x="182" y="0" width="24" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="194" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">1</text>
        <rect x="208" y="0" width="24" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" /><text x="220" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">0</text>
        <rect x="234" y="0" width="24" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" /><text x="246" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">1</text>
      </g>

      <g transform="translate(440, 108)">
        <text x="12" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">0</text>
        <text x="38" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">1</text>
        <text x="64" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">2</text>
        <text x="90" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">3</text>
        <text x="116" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">4</text>
        <text x="142" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">5</text>
        <text x="168" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">6</text>
        <text x="194" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">7</text>
        <text x="220" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">8</text>
        <text x="246" y="12" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">9</text>
      </g>

      <text x="580" y="134" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">偶数位 = 经度   奇数位 = 纬度</text>

      <rect x="240" y="158" width="280" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="177" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">最终编码值：1110011101</text>
    </svg>

    <!-- ==================== geo-grid-mapping ==================== -->
    <svg
      v-else-if="kind === 'geo-grid-mapping'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GeoHash 方格映射到一维空间"
      role="img"
    >
      <rect x="12" y="12" width="736" height="236" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">GeoHash 方格与一维空间映射</text>

      <text x="180" y="68" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text-sub)">二维地理空间 (经度 x 纬度 各 1 次二分)</text>

      <text x="58" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">纬度</text>
      <text x="58" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[0,90]</text>
      <text x="58" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[-90,0)</text>
      <text x="140" y="204" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[-180,0)</text>
      <text x="240" y="204" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[0,180]</text>
      <text x="190" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">经度</text>

      <rect x="90" y="86" width="100" height="50" fill="var(--d-rv-b-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-b-text)">01</text>
      <rect x="190" y="86" width="100" height="50" fill="var(--d-rv-a-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="240" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-a-text)">11</text>
      <rect x="90" y="136" width="100" height="50" fill="var(--d-rv-c-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="140" y="166" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-c-text)">00</text>
      <rect x="190" y="136" width="100" height="50" fill="var(--d-blue-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="240" y="166" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">10</text>

      <text x="370" y="146" text-anchor="middle" font-size="22" fill="var(--d-text-muted)">&#8594;</text>
      <text x="370" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">映射</text>

      <text x="570" y="68" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text-sub)">一维编码空间</text>
      <line x1="430" y1="130" x2="710" y2="130" stroke="var(--d-border)" stroke-width="1.4" />

      <rect x="430" y="104" width="66" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="463" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">00</text>
      <text x="463" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">0</text>
      <rect x="502" y="104" width="66" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="535" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">01</text>
      <text x="535" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">1</text>
      <rect x="574" y="104" width="66" height="24" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="607" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">10</text>
      <text x="607" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">2</text>
      <rect x="646" y="104" width="66" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="679" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">11</text>
      <text x="679" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">3</text>

      <text x="570" y="180" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">相邻方格的编码值也相近</text>
    </svg>

    <!-- ==================== geo-edge-case ==================== -->
    <svg
      v-else-if="kind === 'geo-edge-case'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GeoHash 边界问题示意"
      role="img"
    >
      <rect x="12" y="12" width="736" height="216" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">GeoHash 边界问题 (4 位编码)</text>
      <text x="200" y="68" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text-sub)">16 个方格 (经纬度各 2 次二分)</text>

      <g transform="translate(60, 78)">
        <text x="-8" y="22" text-anchor="end" font-size="9" fill="var(--d-text-muted)">11</text>
        <text x="-8" y="57" text-anchor="end" font-size="9" fill="var(--d-text-muted)">10</text>
        <text x="-8" y="92" text-anchor="end" font-size="9" fill="var(--d-text-muted)">01</text>
        <text x="-8" y="127" text-anchor="end" font-size="9" fill="var(--d-text-muted)">00</text>
        <text x="35" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">00</text>
        <text x="105" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">01</text>
        <text x="175" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">10</text>
        <text x="245" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">11</text>

        <rect x="0" y="6" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="35" y="26" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0011</text>
        <rect x="70" y="6" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="105" y="26" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0111</text>
        <rect x="140" y="6" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="175" y="26" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1011</text>
        <rect x="210" y="6" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="245" y="26" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1111</text>

        <rect x="0" y="36" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="35" y="56" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0010</text>
        <rect x="70" y="36" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="105" y="56" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0110</text>
        <rect x="140" y="36" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="175" y="56" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1010</text>
        <rect x="210" y="36" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="245" y="56" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1110</text>

        <rect x="0" y="66" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="35" y="86" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0001</text>
        <rect x="70" y="66" width="70" height="30" fill="var(--d-warn-bg)" stroke="var(--d-warn-text)" stroke-width="1.6" /><text x="105" y="86" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">0111</text>
        <rect x="140" y="66" width="70" height="30" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" /><text x="175" y="86" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">1000</text>
        <rect x="210" y="66" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="245" y="86" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1101</text>

        <rect x="0" y="96" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="35" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0000</text>
        <rect x="70" y="96" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="105" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0100</text>
        <rect x="140" y="96" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="175" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1000</text>
        <rect x="210" y="96" width="70" height="30" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" /><text x="245" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">1100</text>
      </g>

      <g transform="translate(400, 86)">
        <rect x="0" y="0" width="320" height="120" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-border)" stroke-width="1" />
        <text x="160" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">边界问题</text>
        <rect x="20" y="38" width="60" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-text)" stroke-width="1.2" /><text x="50" y="55" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">0111</text>
        <text x="100" y="55" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">与</text>
        <rect x="120" y="38" width="60" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" /><text x="150" y="55" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">1000</text>
        <text x="160" y="80" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">编码值相邻（差 1），但实际距离很远</text>
        <text x="160" y="104" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">解决：查询周围 4 或 8 个方格</text>
      </g>
    </svg>

    <!-- ==================== geo-redisobject-ptr ==================== -->
    <svg
      v-else-if="kind === 'geo-redisobject-ptr'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RedisObject 内部结构"
      role="img"
    >
      <rect x="12" y="12" width="736" height="196" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="380" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">RedisObject 内部结构</text>

      <rect x="60" y="62" width="640" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />

      <rect x="70" y="70" width="100" height="44" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="120" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">type</text>
      <text x="120" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">4 bit</text>

      <rect x="180" y="70" width="110" height="44" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="235" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">encoding</text>
      <text x="235" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">4 bit</text>

      <rect x="300" y="70" width="110" height="44" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="355" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">lru</text>
      <text x="355" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">24 bit</text>

      <rect x="420" y="70" width="110" height="44" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="475" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">refcount</text>
      <text x="475" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">4 byte</text>

      <rect x="540" y="70" width="150" height="44" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-border)" stroke-width="1" />
      <text x="615" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">*ptr</text>
      <text x="615" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">8 byte (指针)</text>

      <text x="120" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">值的类型</text>
      <text x="235" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">编码方式</text>
      <text x="355" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">最后访问时间</text>
      <text x="475" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">引用计数</text>
      <text x="615" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">指向数据的指针</text>

      <text x="380" y="180" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">元数据（type + encoding + lru + refcount）共 8 字节，*ptr 8 字节，共 16 字节</text>
    </svg>

    <!-- ==================== geo-newtype-steps ==================== -->
    <svg
      v-else-if="kind === 'geo-newtype-steps'"
      viewBox="0 0 820 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="自定义数据类型开发 4 步流程"
      role="img"
    >
      <rect x="12" y="12" width="796" height="256" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="410" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">开发自定义数据类型的 4 个步骤</text>

      <rect x="40" y="66" width="160" height="80" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <circle cx="66" cy="82" r="12" fill="var(--d-rv-a-border)" /><text x="66" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="white">1</text>
      <text x="120" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">定义底层结构</text>
      <text x="120" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">newtype.h</text>
      <text x="120" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">定义 NewTypeObject</text>

      <line x1="204" y1="106" x2="236" y2="106" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#geo-step-arrow)" />

      <rect x="240" y="66" width="160" height="80" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <circle cx="266" cy="82" r="12" fill="var(--d-rv-b-border)" /><text x="266" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="white">2</text>
      <text x="320" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">注册 type</text>
      <text x="320" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">server.h</text>
      <text x="320" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">#define OBJ_NEWTYPE</text>

      <line x1="404" y1="106" x2="436" y2="106" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#geo-step-arrow)" />

      <rect x="440" y="66" width="160" height="80" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <circle cx="466" cy="82" r="12" fill="var(--d-rv-c-border)" /><text x="466" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="white">3</text>
      <text x="520" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">实现创建/释放</text>
      <text x="520" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">object.c</text>
      <text x="520" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">createNewTypeObject()</text>

      <line x1="604" y1="106" x2="636" y2="106" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#geo-step-arrow)" />

      <rect x="640" y="66" width="150" height="80" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-border)" stroke-width="1.4" />
      <circle cx="666" cy="82" r="12" fill="var(--d-border)" /><text x="666" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="white">4</text>
      <text x="715" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">开发命令操作</text>
      <text x="715" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">t_newtype.c</text>
      <text x="715" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">ntinsertCommand()</text>

      <rect x="60" y="170" width="700" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="410" y="194" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">关键文件与操作</text>
      <text x="200" y="218" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">newtype.h -- 定义底层数据结构</text>
      <text x="200" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">server.h -- 宏定义 + 函数声明</text>
      <text x="560" y="218" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">object.c -- 创建/释放 RedisObject</text>
      <text x="560" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">t_newtype.c -- 命令实现 + server.c 注册</text>

      <defs>
        <marker id="geo-step-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-border)" /></marker>
      </defs>
    </svg>

    <!-- ==================== 第 16 章：异步机制 ==================== -->

    <svg
      v-else-if="kind === 'async-blocking-points'"
      viewBox="0 0 820 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 主线程可能阻塞的操作点"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 主线程的 5 大阻塞点</text>

      <!-- 中心：主线程 -->
      <rect x="320" y="100" width="180" height="60" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.8" />
      <text x="410" y="128" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">Redis 主线程</text>
      <text x="410" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">单线程处理请求</text>

      <!-- 阻塞点 1：左上 -->
      <rect x="30" y="44" width="200" height="42" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="130" y="62" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">1. 集合全量查询</text>
      <text x="130" y="78" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">HGETALL / SMEMBERS 等 O(N)</text>
      <line x1="230" y1="65" x2="320" y2="115" stroke="var(--d-rv-a-border)" stroke-width="1.2" />

      <!-- 阻塞点 2：右上 -->
      <rect x="590" y="44" width="200" height="42" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="690" y="62" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">2. bigkey 删除</text>
      <text x="690" y="78" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">释放大量内存，阻塞主线程</text>
      <line x1="590" y1="65" x2="500" y2="115" stroke="var(--d-rv-a-border)" stroke-width="1.2" />

      <!-- 阻塞点 3：左下 -->
      <rect x="30" y="194" width="200" height="42" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="130" y="212" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">3. 清空数据库</text>
      <text x="130" y="228" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">FLUSHDB / FLUSHALL</text>
      <line x1="230" y1="215" x2="320" y2="155" stroke="var(--d-warn-border)" stroke-width="1.2" />

      <!-- 阻塞点 4：正下方 -->
      <rect x="310" y="220" width="200" height="42" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="410" y="238" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">4. AOF 日志同步写</text>
      <text x="410" y="254" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">同步写磁盘 ~1-2ms</text>
      <line x1="410" y1="160" x2="410" y2="220" stroke="var(--d-warn-border)" stroke-width="1.2" />

      <!-- 阻塞点 5：右下 -->
      <rect x="590" y="194" width="200" height="42" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="690" y="212" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">5. 从库加载 RDB</text>
      <text x="690" y="228" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">RDB 越大加载越慢</text>
      <line x1="590" y1="215" x2="500" y2="155" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
    </svg>

    <svg
      v-else-if="kind === 'async-client-operations'"
      viewBox="0 0 780 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="客户端操作阻塞与非阻塞分类"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">客户端操作：阻塞 vs 非阻塞</text>

      <!-- 阻塞操作列 -->
      <rect x="40" y="50" width="320" height="170" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="200" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">阻塞操作（关键路径）</text>
      <rect x="70" y="94" width="260" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">集合全量查询 HGETALL / SMEMBERS</text>
      <rect x="70" y="132" width="260" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="152" text-anchor="middle" font-size="11" fill="var(--d-text)">集合聚合操作（交/并/差集）</text>
      <rect x="70" y="170" width="260" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="190" text-anchor="middle" font-size="11" fill="var(--d-text)">从库加载 RDB 文件</text>

      <!-- 非阻塞操作列 -->
      <rect x="420" y="50" width="320" height="170" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="580" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">非阻塞操作（可异步）</text>
      <rect x="450" y="94" width="260" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="580" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">bigkey 删除 (UNLINK)</text>
      <rect x="450" y="132" width="260" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="580" y="152" text-anchor="middle" font-size="11" fill="var(--d-text)">清空数据库 (FLUSHDB ASYNC)</text>
      <rect x="450" y="170" width="260" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="580" y="190" text-anchor="middle" font-size="11" fill="var(--d-text)">AOF 日志同步写 (everysec)</text>
    </svg>

    <svg
      v-else-if="kind === 'async-lazy-free'"
      viewBox="0 0 780 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="惰性删除（lazy free）机制"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">惰性删除（Lazy Free）机制</text>
      <rect x="30" y="60" width="140" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="100" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">主线程</text>
      <text x="100" y="98" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">收到 DEL 命令</text>
      <line x1="170" y1="85" x2="220" y2="85" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <polygon points="220,81 220,89 232,85" fill="var(--d-blue-border)" />
      <rect x="236" y="60" width="130" height="50" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="301" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">判断 key 大小</text>
      <text x="301" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">元素数量阈值</text>
      <line x1="301" y1="110" x2="301" y2="150" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="260" y="137" font-size="9" fill="var(--d-text-muted)">小 key</text>
      <rect x="226" y="154" width="150" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="301" y="179" text-anchor="middle" font-size="11" fill="var(--d-text)">主线程直接删除</text>
      <line x1="366" y1="85" x2="430" y2="85" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <polygon points="430,81 430,89 442,85" fill="var(--d-rv-a-border)" />
      <text x="398" y="78" font-size="9" fill="var(--d-text-muted)">大 key</text>
      <rect x="446" y="60" width="140" height="50" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="516" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">放入任务队列</text>
      <text x="516" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">返回客户端 OK</text>
      <line x1="586" y1="85" x2="630" y2="85" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="630,81 630,89 642,85" fill="var(--d-rv-c-border)" />
      <rect x="646" y="52" width="110" height="66" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="701" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">后台线程</text>
      <text x="701" y="94" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">异步释放内存</text>
      <text x="701" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">不阻塞主线程</text>
      <rect x="120" y="216" width="540" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Redis 4.0+ 通过 UNLINK 命令和 FLUSHDB ASYNC 选项启用惰性删除</text>
    </svg>

    <svg
      v-else-if="kind === 'async-threaded-io'"
      viewBox="0 0 820 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="异步子线程机制：AOF 刷盘与键值对删除"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 异步子线程机制</text>
      <rect x="30" y="60" width="180" height="100" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="120" y="90" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">主线程</text>
      <text x="120" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">处理客户端请求</text>
      <text x="120" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">封装异步任务</text>
      <text x="120" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">放入任务队列</text>
      <rect x="270" y="60" width="160" height="100" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="350" y="86" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">任务队列</text>
      <rect x="288" y="98" width="124" height="20" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="350" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">AOF 写日志任务</text>
      <rect x="288" y="124" width="124" height="20" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="350" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">键值对删除任务</text>
      <line x1="210" y1="110" x2="270" y2="110" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="266,106 266,114 278,110" fill="var(--d-warn-border)" />
      <rect x="500" y="44" width="140" height="46" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="570" y="64" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">AOF 写线程</text>
      <text x="570" y="80" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">fsync 刷盘</text>
      <rect x="500" y="102" width="140" height="46" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="570" y="122" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">删除线程</text>
      <text x="570" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">释放内存</text>
      <rect x="500" y="160" width="140" height="46" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="570" y="180" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">关闭文件线程</text>
      <text x="570" y="196" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">文件关闭</text>
      <line x1="430" y1="90" x2="500" y2="67" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <line x1="430" y1="110" x2="500" y2="125" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="430" y1="130" x2="500" y2="183" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <rect x="680" y="44" width="120" height="80" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="740" y="64" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">AOF 刷盘策略</text>
      <text x="740" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">always: 每次同步</text>
      <text x="740" y="96" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">everysec: 每秒</text>
      <text x="740" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">no: 由 OS 决定</text>
      <line x1="640" y1="67" x2="680" y2="84" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4 3" />
      <rect x="140" y="224" width="540" height="26" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="410" y="242" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">主线程通过任务队列与 3 个子线程交互，避免阻塞请求处理</text>
    </svg>

    <!-- ==================== 第 17 章：CPU 架构影响 ==================== -->

    <svg v-else-if="kind === 'cpu-physical-core'" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" aria-label="CPU 物理核结构" role="img">
      <text x="350" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CPU 物理核结构</text>
      <rect x="160" y="50" width="380" height="130" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="350" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">物理核（Physical Core）</text>
      <rect x="200" y="94" width="130" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="265" y="116" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">L1 Cache</text>
      <text x="265" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">指令缓存 + 数据缓存</text>
      <rect x="370" y="94" width="130" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="435" y="116" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">L2 Cache</text>
      <text x="435" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">KB 级别</text>
      <text x="350" y="202" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">L1、L2 为每个物理核的私有缓存，访问延迟 &lt; 10ns</text>
    </svg>

    <svg v-else-if="kind === 'cpu-logical-cores'" viewBox="0 0 760 220" xmlns="http://www.w3.org/2000/svg" aria-label="物理核与逻辑核的关系" role="img">
      <text x="380" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">物理核与逻辑核（超线程）</text>
      <rect x="140" y="48" width="480" height="130" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="380" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">1 个物理核</text>
      <rect x="170" y="90" width="140" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="240" y="112" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">逻辑核 0</text>
      <text x="240" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">超线程 0</text>
      <rect x="450" y="90" width="140" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="520" y="112" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">逻辑核 1</text>
      <text x="520" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">超线程 1</text>
      <line x1="310" y1="115" x2="450" y2="115" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 4" />
      <text x="380" y="155" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">共享 L1、L2 缓存</text>
      <text x="380" y="200" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">同一物理核的两个逻辑核通过超线程共享 L1/L2 私有缓存</text>
    </svg>

    <svg v-else-if="kind === 'cpu-multi-socket-numa'" viewBox="0 0 860 300" xmlns="http://www.w3.org/2000/svg" aria-label="NUMA 多 CPU Socket 架构" role="img">
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">多 CPU Socket（NUMA 架构）</text>
      <rect x="30" y="50" width="370" height="190" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="215" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">CPU Socket 0</text>
      <rect x="56" y="90" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="101" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Core 0</text>
      <rect x="160" y="90" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="205" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Core 1</text>
      <rect x="264" y="90" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="309" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Core ...</text>
      <rect x="56" y="142" width="298" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="205" y="162" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">L3 Cache（共享）</text>
      <rect x="56" y="184" width="298" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="205" y="206" text-anchor="middle" font-size="11" fill="var(--d-text)">本地内存</text>
      <rect x="460" y="50" width="370" height="190" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <text x="645" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">CPU Socket 1</text>
      <rect x="486" y="90" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="531" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Core 0</text>
      <rect x="590" y="90" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="635" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Core 1</text>
      <rect x="694" y="90" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="739" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Core ...</text>
      <rect x="486" y="142" width="298" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="635" y="162" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">L3 Cache（共享）</text>
      <rect x="486" y="184" width="298" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="635" y="206" text-anchor="middle" font-size="11" fill="var(--d-text)">本地内存</text>
      <line x1="400" y1="145" x2="460" y2="145" stroke="var(--d-rv-a-border)" stroke-width="2.4" />
      <text x="430" y="138" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">总线</text>
      <rect x="220" y="258" width="420" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="430" y="277" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">跨 Socket 访问远端内存延迟更高（NUMA 非统一内存访问）</text>
    </svg>

    <svg v-else-if="kind === 'cpu-bindcore-latency'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="绑核前后延迟对比" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">绑核前后 99% 尾延迟对比</text>
      <rect x="140" y="50" width="500" height="36" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="260" y="73" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">操作</text>
      <text x="420" y="73" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">未绑核</text>
      <text x="560" y="73" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">绑核后</text>
      <rect x="140" y="90" width="500" height="40" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="260" y="115" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">GET</text>
      <text x="420" y="115" text-anchor="middle" font-size="13" fill="var(--d-rv-a-text)">504 us</text>
      <text x="560" y="115" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-rv-c-text)">260 us</text>
      <rect x="140" y="134" width="500" height="40" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="260" y="159" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">PUT</text>
      <text x="420" y="159" text-anchor="middle" font-size="13" fill="var(--d-rv-a-text)">1175 us</text>
      <text x="560" y="159" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-rv-c-text)">482 us</text>
      <line x1="480" y1="112" x2="520" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="516,108 516,116 528,112" fill="var(--d-rv-c-border)" />
      <line x1="480" y1="156" x2="520" y2="156" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="516,152 516,160 528,156" fill="var(--d-rv-c-border)" />
      <text x="390" y="200" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">taskset -c 0 ./redis-server    绑定到 0 号核</text>
      <text x="390" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">绑核后避免 context switch，充分利用 L1/L2 缓存，尾延迟大幅下降</text>
    </svg>

    <svg v-else-if="kind === 'cpu-nic-interrupt-data'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="网络中断与 Redis 数据交互" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">网络中断处理与 Redis 实例数据交互</text>
      <rect x="30" y="80" width="130" height="60" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="95" y="106" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">网卡（NIC）</text>
      <text x="95" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">接收网络数据</text>
      <line x1="160" y1="110" x2="220" y2="110" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <polygon points="216,106 216,114 228,110" fill="var(--d-rv-a-border)" />
      <text x="190" y="100" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">中断</text>
      <rect x="230" y="70" width="180" height="80" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="320" y="98" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">网络中断处理程序</text>
      <text x="320" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">读取数据到内核缓冲区</text>
      <text x="320" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">运行在 CPU Core A</text>
      <line x1="410" y1="110" x2="470" y2="110" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="466,106 466,114 478,110" fill="var(--d-warn-border)" />
      <text x="440" y="100" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">epoll</text>
      <rect x="480" y="70" width="180" height="80" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="570" y="98" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Redis 实例</text>
      <text x="570" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">从缓冲区拷贝数据</text>
      <text x="570" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">运行在 CPU Core B</text>
      <rect x="120" y="180" width="540" height="40" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="200" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">网络中断处理和 Redis 实例运行在不同 CPU 核上</text>
      <text x="390" y="214" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">若两者不在同一 Socket，数据需跨总线访问，延迟增加</text>
    </svg>

    <svg v-else-if="kind === 'cpu-cross-socket-access'" viewBox="0 0 820 260" xmlns="http://www.w3.org/2000/svg" aria-label="跨 Socket 访问导致延迟增加" role="img">
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">跨 CPU Socket 访问（延迟增加）</text>
      <rect x="40" y="50" width="330" height="140" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <text x="205" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">CPU Socket 0</text>
      <rect x="70" y="90" width="140" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="140" y="110" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">网络中断处理</text>
      <text x="140" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">绑在 Core X</text>
      <rect x="70" y="144" width="270" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="205" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">本地内存（网络数据存放于此）</text>
      <rect x="450" y="50" width="330" height="140" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="615" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">CPU Socket 1</text>
      <rect x="610" y="90" width="140" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="680" y="110" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Redis 实例</text>
      <text x="680" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">绑在 Core Y</text>
      <line x1="370" y1="110" x2="450" y2="110" stroke="var(--d-rv-a-border)" stroke-width="2" />
      <polygon points="446,106 446,114 458,110" fill="var(--d-rv-a-border)" />
      <text x="410" y="100" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">跨总线</text>
      <path d="M 680 134 C 680 180 410 200 205 174" stroke="var(--d-rv-a-border)" stroke-width="1.4" stroke-dasharray="6 4" fill="none" />
      <text x="430" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">远端内存访问</text>
      <rect x="160" y="224" width="500" height="26" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="410" y="242" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Redis 读取网络数据需跨 Socket 访问内存，延迟增加约 18%</text>
    </svg>

    <svg v-else-if="kind === 'cpu-same-socket-binding'" viewBox="0 0 820 260" xmlns="http://www.w3.org/2000/svg" aria-label="同 Socket 绑定，本地内存访问" role="img">
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">同 CPU Socket 绑定（最优方案）</text>
      <rect x="160" y="50" width="500" height="160" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.8" />
      <text x="410" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">CPU Socket 1</text>
      <rect x="200" y="92" width="160" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="280" y="114" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">网络中断处理</text>
      <text x="280" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">绑在 Core A</text>
      <rect x="460" y="92" width="160" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="540" y="114" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Redis 实例</text>
      <text x="540" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">绑在 Core B</text>
      <rect x="220" y="158" width="380" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="410" y="180" text-anchor="middle" font-size="11" fill="var(--d-text)">本地内存（同一 Socket 内访问）</text>
      <line x1="360" y1="117" x2="460" y2="117" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <polygon points="456,113 456,121 468,117" fill="var(--d-rv-c-border)" />
      <text x="410" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">本地传输</text>
      <rect x="160" y="226" width="500" height="26" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="410" y="244" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">网络中断和 Redis 绑在同一 Socket 的不同核上，延迟最小</text>
    </svg>

    <!-- ============ Ch28: Pika ============ -->

    <svg v-else-if="kind === 'pika-architecture'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="Pika 整体架构五大组件" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Pika 整体架构</text>
      <!-- 网络框架 -->
      <rect x="20" y="50" width="130" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="85" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">网络框架</text>
      <text x="85" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">封装底层网络函数</text>
      <!-- Pika 线程 -->
      <rect x="170" y="50" width="130" height="60" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="235" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Pika 线程模块</text>
      <text x="235" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">多线程处理请求</text>
      <!-- Nemo -->
      <rect x="320" y="50" width="130" height="60" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="385" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Nemo 存储模块</text>
      <text x="385" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据类型兼容</text>
      <!-- RocksDB -->
      <rect x="470" y="50" width="130" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="535" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">RocksDB</text>
      <text x="535" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">基于 SSD 存储</text>
      <!-- Binlog -->
      <rect x="620" y="50" width="130" height="60" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="685" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Binlog 机制</text>
      <text x="685" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">增量命令同步</text>
      <!-- 箭头连线 -->
      <line x1="150" y1="80" x2="170" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="168,76 168,84 176,80" fill="var(--d-border)" />
      <line x1="300" y1="80" x2="320" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="318,76 318,84 326,80" fill="var(--d-border)" />
      <line x1="450" y1="80" x2="470" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="468,76 468,84 476,80" fill="var(--d-border)" />
      <line x1="600" y1="80" x2="620" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="618,76 618,84 626,80" fill="var(--d-border)" />
      <!-- 底部 SSD -->
      <rect x="170" y="140" width="440" height="50" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="170" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">SSD（大容量、低成本、高速读写）</text>
      <line x1="535" y1="110" x2="535" y2="140" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="531,138 539,138 535,146" fill="var(--d-rv-c-border)" />
      <line x1="685" y1="110" x2="685" y2="155" stroke="var(--d-warn-border)" stroke-width="1.4" stroke-dasharray="5 3" />
      <polygon points="681,153 689,153 685,161" fill="var(--d-warn-border)" />
      <!-- 说明 -->
      <rect x="100" y="210" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="229" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Pika = 网络框架 + 多线程 + Nemo（类型兼容）+ RocksDB（SSD）+ Binlog（同步）</text>
    </svg>

    <svg v-else-if="kind === 'pika-thread-model'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="Pika 多线程模型" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Pika 多线程模型</text>
      <!-- DispatchThread -->
      <rect x="40" y="60" width="160" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="120" y="86" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">DispatchThread</text>
      <text x="120" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">监听端口 / 分发连接</text>
      <!-- WorkerThread -->
      <rect x="280" y="46" width="160" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="360" y="70" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">WorkerThread 1</text>
      <rect x="280" y="90" width="160" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="360" y="114" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">WorkerThread N</text>
      <text x="360" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">接收命令 → 封装 Task</text>
      <!-- ThreadPool -->
      <rect x="540" y="50" width="190" height="80" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="635" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">ThreadPool</text>
      <text x="635" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">执行数据存取操作</text>
      <!-- 箭头 -->
      <line x1="200" y1="90" x2="280" y2="68" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="276,64 276,72 284,68" fill="var(--d-border)" />
      <line x1="200" y1="90" x2="280" y2="108" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="276,104 276,112 284,108" fill="var(--d-border)" />
      <text x="240" y="82" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">分发</text>
      <line x1="440" y1="68" x2="540" y2="82" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="536,78 536,86 544,82" fill="var(--d-border)" />
      <line x1="440" y1="108" x2="540" y2="96" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="536,92 536,100 544,96" fill="var(--d-border)" />
      <text x="490" y="82" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">Task</text>
      <!-- 说明 -->
      <rect x="100" y="170" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="189" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">DispatchThread 分发连接 → WorkerThread 处理命令 → ThreadPool 执行数据操作</text>
    </svg>

    <svg v-else-if="kind === 'pika-rocksdb-write'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="RocksDB 写入流程" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">RocksDB 写入数据流程</text>
      <!-- WAL -->
      <rect x="30" y="60" width="100" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="80" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">WAL</text>
      <text x="80" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">预写日志</text>
      <!-- Memtable 1 活跃 -->
      <rect x="190" y="50" width="130" height="70" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="255" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Memtable 1</text>
      <text x="255" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">活跃写入</text>
      <text x="255" y="112" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">几 MB ~ 几十 MB</text>
      <!-- Memtable 2 冻结 -->
      <rect x="370" y="50" width="130" height="70" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="435" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Memtable 2</text>
      <text x="435" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">冻结 → 落盘</text>
      <!-- SST 文件 -->
      <rect x="570" y="50" width="170" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="655" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">SST 文件</text>
      <text x="655" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">持久化到 SSD</text>
      <!-- 箭头 -->
      <line x1="130" y1="85" x2="190" y2="85" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="186,81 186,89 194,85" fill="var(--d-border)" />
      <path d="M320,85 Q345,85 345,85 L370,85" fill="none" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="366,81 366,89 374,85" fill="var(--d-border)" />
      <text x="345" y="78" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">交替</text>
      <line x1="500" y1="85" x2="570" y2="85" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="566,81 566,89 574,85" fill="var(--d-border)" />
      <text x="535" y="78" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">Flush</text>
      <!-- 说明 -->
      <rect x="100" y="148" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="167" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">写入 → WAL → 活跃 Memtable → 写满后冻结 → 批量落盘为 SST 文件到 SSD</text>
    </svg>

    <svg v-else-if="kind === 'pika-rocksdb-read'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="RocksDB 读取流程" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">RocksDB 读取数据流程</text>
      <!-- 查询入口 -->
      <rect x="30" y="70" width="100" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="80" y="92" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">GET 请求</text>
      <text x="80" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">读取数据</text>
      <!-- Memtable -->
      <rect x="190" y="60" width="140" height="70" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="260" y="88" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Memtable</text>
      <text x="260" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">先查内存（最新数据）</text>
      <!-- Block Cache -->
      <rect x="390" y="60" width="140" height="70" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="460" y="88" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Block Cache</text>
      <text x="460" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">缓存热点数据块</text>
      <!-- SST -->
      <rect x="590" y="60" width="150" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="665" y="88" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">SST 文件</text>
      <text x="665" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">SSD 上的数据文件</text>
      <!-- 箭头 -->
      <line x1="130" y1="95" x2="190" y2="95" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="186,91 186,99 194,95" fill="var(--d-border)" />
      <line x1="330" y1="95" x2="390" y2="95" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="386,91 386,99 394,95" fill="var(--d-border)" />
      <text x="360" y="88" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">未命中</text>
      <line x1="530" y1="95" x2="590" y2="95" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="586,91 586,99 594,95" fill="var(--d-border)" />
      <text x="560" y="88" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">未命中</text>
      <!-- 说明 -->
      <rect x="100" y="156" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="175" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">读取顺序：Memtable（内存）→ Block Cache（缓存）→ SST 文件（SSD）</text>
    </svg>

    <svg v-else-if="kind === 'pika-list-kv-mapping'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="List 类型 KV 映射" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">List → 单值 KV 映射</text>
      <!-- Key 部分 -->
      <text x="160" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Key</text>
      <rect x="20" y="60" width="40" height="32" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="40" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">"l"</text>
      <rect x="64" y="60" width="50" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="89" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">size</text>
      <rect x="118" y="60" width="80" height="32" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="158" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">key</text>
      <rect x="202" y="60" width="80" height="32" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="242" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">sequence</text>
      <!-- Value 部分 -->
      <text x="540" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Value</text>
      <rect x="380" y="60" width="60" height="32" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="410" y="81" text-anchor="middle" font-size="8" fill="var(--d-text)">prev seq</text>
      <rect x="444" y="60" width="60" height="32" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="474" y="81" text-anchor="middle" font-size="8" fill="var(--d-text)">next seq</text>
      <rect x="508" y="60" width="80" height="32" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="548" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">value</text>
      <rect x="592" y="60" width="60" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="622" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">version</text>
      <rect x="656" y="60" width="50" height="32" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="681" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">ttl</text>
      <!-- 分隔线 -->
      <line x1="320" y1="56" x2="320" y2="96" stroke="var(--d-border)" stroke-width="1.4" stroke-dasharray="4 3" />
      <!-- 说明 -->
      <rect x="100" y="116" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="135" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">key + sequence 作为 KV 键，value + prev/next + version + ttl 作为 KV 值</text>
    </svg>

    <svg v-else-if="kind === 'pika-set-kv-mapping'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="Set 类型 KV 映射" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Set → 单值 KV 映射</text>
      <!-- Key 部分 -->
      <text x="170" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Key</text>
      <rect x="30" y="60" width="40" height="32" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="50" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">"s"</text>
      <rect x="74" y="60" width="50" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="99" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">size</text>
      <rect x="128" y="60" width="80" height="32" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="168" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">key</text>
      <rect x="212" y="60" width="100" height="32" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="262" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">member</text>
      <!-- Value 部分 -->
      <text x="510" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Value</text>
      <rect x="430" y="60" width="80" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="470" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">version</text>
      <rect x="514" y="60" width="80" height="32" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="554" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">ttl</text>
      <!-- 分隔线 -->
      <line x1="360" y1="56" x2="360" y2="96" stroke="var(--d-border)" stroke-width="1.4" stroke-dasharray="4 3" />
      <!-- 说明 -->
      <rect x="100" y="116" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="135" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">key + member 作为 KV 键，仅保存 version 和 ttl 作为 KV 值</text>
    </svg>

    <svg v-else-if="kind === 'pika-hash-kv-mapping'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="Hash 类型 KV 映射" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Hash → 单值 KV 映射</text>
      <!-- Key 部分 -->
      <text x="170" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Key</text>
      <rect x="30" y="60" width="40" height="32" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="50" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">"h"</text>
      <rect x="74" y="60" width="50" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="99" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">size</text>
      <rect x="128" y="60" width="80" height="32" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="168" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">key</text>
      <rect x="212" y="60" width="80" height="32" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="252" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">field</text>
      <!-- Value 部分 -->
      <text x="510" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Value</text>
      <rect x="400" y="60" width="80" height="32" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="440" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">value</text>
      <rect x="484" y="60" width="70" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="519" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">version</text>
      <rect x="558" y="60" width="60" height="32" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="588" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">ttl</text>
      <!-- 分隔线 -->
      <line x1="340" y1="56" x2="340" y2="96" stroke="var(--d-border)" stroke-width="1.4" stroke-dasharray="4 3" />
      <!-- 说明 -->
      <rect x="100" y="116" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="135" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">key + field 作为 KV 键，value + version + ttl 作为 KV 值</text>
    </svg>

    <svg v-else-if="kind === 'pika-zset-kv-mapping'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="Sorted Set 类型 KV 映射" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Sorted Set → 单值 KV 映射</text>
      <!-- Key 部分 -->
      <text x="210" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Key</text>
      <rect x="30" y="60" width="40" height="32" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="50" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">"z"</text>
      <rect x="74" y="60" width="50" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="99" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">size</text>
      <rect x="128" y="60" width="80" height="32" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="168" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">key</text>
      <rect x="212" y="60" width="80" height="32" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="252" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">score</text>
      <rect x="296" y="60" width="100" height="32" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="346" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">member</text>
      <!-- Value 部分 -->
      <text x="540" y="52" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Value</text>
      <rect x="470" y="60" width="80" height="32" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="510" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">version</text>
      <rect x="554" y="60" width="60" height="32" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="584" y="81" text-anchor="middle" font-size="9" fill="var(--d-text)">ttl</text>
      <!-- 分隔线 -->
      <line x1="430" y1="56" x2="430" y2="96" stroke="var(--d-border)" stroke-width="1.4" stroke-dasharray="4 3" />
      <!-- 说明 -->
      <rect x="100" y="116" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="135" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">key + score + member 全部嵌入 KV 键，支持按 score 排序</text>
    </svg>

    <svg v-else-if="kind === 'pika-performance-table'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="Pika 性能测试数据" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Pika 3.2 性能测试数据（多线程）</text>
      <!-- 表头 -->
      <rect x="60" y="46" width="660" height="32" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="170" y="67" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">操作类型</text>
      <text x="370" y="67" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">不写 Binlog (OPS)</text>
      <text x="580" y="67" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">写 Binlog (OPS)</text>
      <line x1="270" y1="48" x2="270" y2="186" stroke="var(--d-blue-border)" stroke-width="1" />
      <line x1="480" y1="48" x2="480" y2="186" stroke="var(--d-blue-border)" stroke-width="1" />
      <!-- SET -->
      <rect x="60" y="80" width="660" height="26" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="170" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">SET (String)</text>
      <text x="370" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">~200K+</text>
      <text x="580" y="98" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">~120K</text>
      <!-- GET -->
      <rect x="60" y="108" width="660" height="26" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="170" y="126" text-anchor="middle" font-size="10" fill="var(--d-text)">GET (String)</text>
      <text x="370" y="126" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">~200K+</text>
      <text x="580" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">--</text>
      <!-- HSET -->
      <rect x="60" y="136" width="660" height="26" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="170" y="154" text-anchor="middle" font-size="10" fill="var(--d-text)">HSET (Hash)</text>
      <text x="370" y="154" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">~200K+</text>
      <text x="580" y="154" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">~120K</text>
      <!-- HGET -->
      <rect x="60" y="164" width="660" height="26" rx="0" fill="none" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="170" y="182" text-anchor="middle" font-size="10" fill="var(--d-text)">HGET (Hash)</text>
      <text x="370" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">~200K+</text>
      <text x="580" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">--</text>
      <!-- 说明 -->
      <rect x="100" y="204" width="580" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="223" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">写 Binlog 导致写操作性能下降约 41%，读操作不受影响</text>
    </svg>

    <!-- ============ Ch29: 原子操作 ============ -->

    <svg v-else-if="kind === 'atomic-rw-race'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="并发读写竞争导致数据错误" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">并发 RMW 操作竞争</text>
      <!-- 时间轴 -->
      <line x1="140" y1="58" x2="720" y2="58" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="100" y="62" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">时间 →</text>
      <text x="220" y="50" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">t1</text>
      <text x="380" y="50" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">t2</text>
      <text x="540" y="50" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">t3</text>
      <text x="680" y="50" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">t4</text>
      <line x1="220" y1="54" x2="220" y2="170" stroke="var(--d-border)" stroke-width="0.8" stroke-dasharray="4 3" />
      <line x1="380" y1="54" x2="380" y2="170" stroke="var(--d-border)" stroke-width="0.8" stroke-dasharray="4 3" />
      <line x1="540" y1="54" x2="540" y2="170" stroke="var(--d-border)" stroke-width="0.8" stroke-dasharray="4 3" />
      <line x1="680" y1="54" x2="680" y2="170" stroke="var(--d-border)" stroke-width="0.8" stroke-dasharray="4 3" />
      <!-- 客户端 A -->
      <text x="60" y="96" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">客户端 A</text>
      <rect x="180" y="78" width="80" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="220" y="97" text-anchor="middle" font-size="9" fill="var(--d-text)">读 x=10</text>
      <rect x="500" y="78" width="80" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="540" y="97" text-anchor="middle" font-size="9" fill="var(--d-text)">写 x=9</text>
      <!-- 客户端 B -->
      <text x="60" y="146" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">客户端 B</text>
      <rect x="340" y="128" width="80" height="28" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="147" text-anchor="middle" font-size="9" fill="var(--d-text)">读 x=10</text>
      <rect x="640" y="128" width="80" height="28" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="680" y="147" text-anchor="middle" font-size="9" fill="var(--d-text)">写 x=9</text>
      <!-- 结果 -->
      <rect x="140" y="180" width="240" height="28" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="260" y="199" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">预期结果：x = 8</text>
      <rect x="420" y="180" width="240" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="540" y="199" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">实际结果：x = 9 (错误!)</text>
    </svg>

    <svg v-else-if="kind === 'atomic-lua-incr'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="Lua 脚本原子执行" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Lua 脚本保证原子性</text>
      <!-- Redis 单线程 -->
      <rect x="40" y="50" width="700" height="100" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="72" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Redis 单线程串行执行</text>
      <!-- EVAL 脚本 -->
      <rect x="80" y="86" width="280" height="48" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="220" y="106" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">EVAL lua_script</text>
      <text x="220" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">INCR → 判断 → EXPIRE（原子执行）</text>
      <!-- 其他命令等待 -->
      <rect x="400" y="86" width="140" height="48" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="470" y="106" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">其他命令</text>
      <text x="470" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">排队等待中...</text>
      <!-- 箭头 -->
      <line x1="360" y1="110" x2="400" y2="110" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="396,106 396,114 404,110" fill="var(--d-border)" />
      <text x="380" y="102" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">阻塞</text>
      <!-- 客户端 -->
      <rect x="580" y="86" width="120" height="48" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="640" y="106" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">客户端 B</text>
      <text x="640" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">等待脚本完成</text>
      <!-- 说明 -->
      <rect x="100" y="170" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="189" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">EVAL 执行 Lua 脚本时，整个脚本作为原子操作，其他命令无法打断</text>
    </svg>

    <!-- ===== Ch 18: 延迟（上） ===== -->

    <svg v-else-if="kind === 'latency-baseline'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="Redis 基线性能判断" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 基线性能判断</text>
      <rect x="30" y="50" width="340" height="130" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="200" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">简单命令（GET / SET）</text>
      <text x="200" y="100" text-anchor="middle" font-size="12" fill="var(--d-text)">复杂度 O(1)</text>
      <text x="200" y="122" text-anchor="middle" font-size="12" fill="var(--d-text)">基线延迟 &lt; 1 ms</text>
      <text x="200" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">redis-cli --intrinsic-latency 120</text>
      <text x="200" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">运行时延迟 &gt; 2x 基线 → 变慢</text>
      <rect x="410" y="50" width="340" height="130" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="580" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">复杂命令（SORT / SUNION …）</text>
      <text x="580" y="100" text-anchor="middle" font-size="12" fill="var(--d-text)">复杂度 O(N) ~ O(N+M·logM)</text>
      <text x="580" y="122" text-anchor="middle" font-size="12" fill="var(--d-text)">延迟取决于数据量</text>
      <text x="580" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">N = 元素个数，M = 返回个数</text>
      <text x="580" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">可查 Redis 官方文档确认</text>
      <rect x="200" y="194" width="380" height="22" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="209" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">虚拟化环境基线更高（可达 ~10ms），需在服务端直接测量</text>
    </svg>

    <svg v-else-if="kind === 'latency-slow-causes'" viewBox="0 0 780 280" xmlns="http://www.w3.org/2000/svg" aria-label="延迟诊断全链路" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 延迟诊断全链路</text>
      <rect x="240" y="110" width="300" height="60" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="390" y="138" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">客户端请求 → Redis 处理</text>
      <text x="390" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">整体延迟 = 各环节之和</text>
      <rect x="30" y="50" width="160" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="110" y="70" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">慢查询命令</text>
      <text x="110" y="86" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">KEYS / SORT / SMEMBERS</text>
      <line x1="190" y1="72" x2="240" y2="120" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <rect x="590" y="50" width="160" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="670" y="70" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">bigkey 操作</text>
      <text x="670" y="86" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">大集合读写 / 删除</text>
      <line x1="590" y1="72" x2="540" y2="120" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <rect x="30" y="186" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="110" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">AOF 同步写</text>
      <text x="110" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">always / everysec</text>
      <line x1="190" y1="208" x2="240" y2="168" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <rect x="310" y="186" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="390" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">主从复制</text>
      <text x="390" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">全量同步 / RDB 传输</text>
      <line x1="390" y1="186" x2="390" y2="170" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <rect x="590" y="186" width="160" height="44" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="670" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-b-text)">内存 swap</text>
      <text x="670" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">磁盘读写替代内存</text>
      <line x1="590" y1="208" x2="540" y2="168" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <rect x="310" y="246" width="160" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="265" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">网络延迟（iPerf 检测）</text>
    </svg>

    <!-- ===== Ch 19: 延迟（下） ===== -->

    <svg v-else-if="kind === 'latency2-overview'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="影响延迟的关键因素" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">影响 Redis 延迟的关键因素</text>
      <rect x="30" y="50" width="340" height="180" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="200" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Redis 自身</text>
      <rect x="60" y="92" width="280" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="113" text-anchor="middle" font-size="11" fill="var(--d-text)">命令复杂度（慢查询 / KEYS）</text>
      <rect x="60" y="132" width="280" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="153" text-anchor="middle" font-size="11" fill="var(--d-text)">bigkey 操作（大集合读写删除）</text>
      <rect x="60" y="172" width="280" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="200" y="193" text-anchor="middle" font-size="11" fill="var(--d-text)">AOF 持久化（always / everysec）</text>
      <rect x="410" y="50" width="340" height="180" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="580" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">操作系统</text>
      <rect x="440" y="92" width="280" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="580" y="113" text-anchor="middle" font-size="11" fill="var(--d-text)">内存 swap（磁盘替代内存）</text>
      <rect x="440" y="132" width="280" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="580" y="153" text-anchor="middle" font-size="11" fill="var(--d-text)">透明大页 THP（fork COW 放大）</text>
      <rect x="440" y="172" width="280" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="580" y="193" text-anchor="middle" font-size="11" fill="var(--d-text)">网络拥塞 / 带宽不足</text>
      <rect x="200" y="240" width="380" height="16" rx="4" />
      <text x="390" y="252" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">排查思路：Redis 自身 → 文件系统 → 操作系统</text>
    </svg>

    <svg v-else-if="kind === 'latency2-aof-fsync'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="AOF 三种 fsync 策略对比" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AOF 三种 fsync 写回策略</text>
      <rect x="30" y="50" width="220" height="120" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="140" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">always</text>
      <text x="140" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">每次操作都 fsync</text>
      <text x="140" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">可靠性最高</text>
      <text x="140" y="140" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">性能最差</text>
      <text x="140" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">主线程同步执行</text>
      <rect x="280" y="50" width="220" height="120" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="390" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">everysec</text>
      <text x="390" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">每秒 fsync 一次</text>
      <text x="390" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">性能与可靠性平衡</text>
      <text x="390" y="140" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">推荐配置</text>
      <text x="390" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">后台子线程执行</text>
      <rect x="530" y="50" width="220" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="640" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">no</text>
      <text x="640" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">OS 控制刷盘</text>
      <text x="640" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">性能最好</text>
      <text x="640" y="140" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text-sub)">可靠性最低</text>
      <text x="640" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">仅 write 不 fsync</text>
      <rect x="100" y="186" width="580" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="205" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">AOF 重写时 fsync 可被阻塞 → 设 no-appendfsync-on-rewrite yes 缓解</text>
    </svg>

    <svg v-else-if="kind === 'latency2-swap'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="swap 导致延迟剧增" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">内存 swap 导致延迟剧增</text>
      <rect x="60" y="56" width="200" height="80" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="160" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">正常：内存访问</text>
      <text x="160" y="106" text-anchor="middle" font-size="12" fill="var(--d-text)">延迟 ~us 级</text>
      <text x="160" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">300s / 5000万 GET</text>
      <line x1="260" y1="96" x2="370" y2="96" stroke="var(--d-rv-a-border)" stroke-width="2" stroke-dasharray="6 4" />
      <text x="315" y="86" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">swap 触发</text>
      <polygon points="366,92 366,100 378,96" fill="var(--d-rv-a-border)" />
      <rect x="380" y="56" width="200" height="80" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="480" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">swap：磁盘访问</text>
      <text x="480" y="106" text-anchor="middle" font-size="12" fill="var(--d-text)">延迟 ~ms 级</text>
      <text x="480" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">~4 小时 / 5000万 GET</text>
      <rect x="620" y="60" width="130" height="72" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="685" y="82" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">触发原因</text>
      <text x="685" y="100" text-anchor="middle" font-size="9" fill="var(--d-text)">物理内存不足</text>
      <text x="685" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">其他进程占内存</text>
      <text x="685" y="128" text-anchor="middle" font-size="9" fill="var(--d-text)">Redis 实例过大</text>
      <rect x="120" y="156" width="540" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="175" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决：增加内存 / Redis 集群分摊 / 迁移到独立机器 / cat /proc/&lt;pid&gt;/smaps 排查</text>
    </svg>

    <svg v-else-if="kind === 'latency2-transparent-hugepage'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="THP 使 fork COW 放大" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">透明大页（THP）对 Redis 的影响</text>
      <rect x="60" y="56" width="240" height="80" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="180" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">常规内存页</text>
      <text x="180" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">页大小：4 KB</text>
      <text x="180" y="124" text-anchor="middle" font-size="11" fill="var(--d-text)">COW 拷贝单元：4 KB</text>
      <line x1="300" y1="96" x2="380" y2="96" stroke="var(--d-rv-a-border)" stroke-width="2" />
      <text x="340" y="86" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">对比</text>
      <rect x="390" y="56" width="240" height="80" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="510" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">THP 大页</text>
      <text x="510" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">页大小：2 MB</text>
      <text x="510" y="124" text-anchor="middle" font-size="11" fill="var(--d-text)">COW 拷贝单元：2 MB</text>
      <rect x="660" y="60" width="90" height="72" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="705" y="82" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">放大</text>
      <text x="705" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">512x</text>
      <text x="705" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">拷贝量</text>
      <rect x="120" y="156" width="540" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="175" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决：echo never &gt; /sys/kernel/mm/transparent_hugepage/enabled</text>
    </svg>

    <!-- ===== Ch 20: 内存碎片 ===== -->

    <svg v-else-if="kind === 'mem-delete-not-freed'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="删除后内存不下降" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">删除数据后内存为何不下降？</text>
      <rect x="60" y="56" width="200" height="70" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="160" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Redis 删除数据</text>
      <text x="160" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">释放内存给分配器</text>
      <line x1="260" y1="91" x2="320" y2="91" stroke="var(--d-border)" stroke-width="1.6" />
      <polygon points="316,87 316,95 328,91" fill="var(--d-border)" />
      <rect x="330" y="56" width="200" height="70" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="430" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">内存分配器</text>
      <text x="430" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">管理空闲空间</text>
      <line x1="530" y1="91" x2="590" y2="91" stroke="var(--d-border)" stroke-width="1.6" />
      <polygon points="586,87 586,95 598,91" fill="var(--d-border)" />
      <rect x="600" y="56" width="150" height="70" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="675" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">操作系统</text>
      <text x="675" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">仍显示大量内存</text>
      <rect x="140" y="146" width="500" height="56" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="168" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">内存碎片 = 分配器持有但无法有效利用的空闲内存</text>
      <text x="390" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">不连续的空间无法满足新的连续内存申请</text>
    </svg>

    <svg v-else-if="kind === 'mem-fragmentation'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="内存碎片示意" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">内存碎片示意</text>
      <rect x="60" y="52" width="660" height="50" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="44" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">操作系统分配给 Redis 的物理内存（used_memory_rss）</text>
      <rect x="62" y="54" width="160" height="46" rx="3" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="142" y="82" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">App A（已用）</text>
      <rect x="222" y="54" width="40" height="46" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="242" y="82" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">空闲</text>
      <rect x="262" y="54" width="120" height="46" rx="3" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="322" y="82" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">App C（已用）</text>
      <rect x="382" y="54" width="30" height="46" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="397" y="82" text-anchor="middle" font-size="7" fill="var(--d-warn-text)">空</text>
      <rect x="412" y="54" width="180" height="46" rx="3" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="502" y="82" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">App D（已用）</text>
      <rect x="592" y="54" width="126" height="46" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="655" y="82" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">空闲碎片</text>
      <rect x="120" y="118" width="250" height="32" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="245" y="139" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">used_memory（实际数据）</text>
      <rect x="420" y="118" width="250" height="32" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="545" y="139" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">碎片 = rss - used_memory</text>
      <text x="390" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">内因：分配器按固定大小分配（jemalloc 8/16/32/…）  外因：键值对大小不一 + 删改操作</text>
    </svg>

    <svg v-else-if="kind === 'mem-fragmentation-ratio'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="mem_fragmentation_ratio 含义" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">mem_fragmentation_ratio 含义</text>
      <text x="390" y="50" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">mem_fragmentation_ratio = used_memory_rss / used_memory</text>
      <rect x="40" y="68" width="210" height="60" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="145" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">1.0 ~ 1.5</text>
      <text x="145" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">合理范围，正常</text>
      <rect x="285" y="68" width="210" height="60" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="390" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">&gt; 1.5</text>
      <text x="390" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">碎片严重，需清理</text>
      <rect x="530" y="68" width="210" height="60" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="635" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">&lt; 1.0</text>
      <text x="635" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">发生了 swap</text>
      <rect x="200" y="146" width="380" height="26" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">使用 INFO memory 命令查看碎片率</text>
    </svg>

    <svg v-else-if="kind === 'mem-defrag-config'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="碎片自动清理配置" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">内存碎片自动清理配置</text>
      <rect x="40" y="50" width="340" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="60" y="72" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">启用</text>
      <text x="130" y="72" font-size="10" font-family="monospace" fill="var(--d-text)">activedefrag yes</text>
      <text x="60" y="86" font-size="9" fill="var(--d-text-muted)">开启自动碎片清理功能</text>
      <rect x="400" y="50" width="340" height="44" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="420" y="72" font-size="11" font-weight="600" fill="var(--d-text)">触发条件（同时满足）</text>
      <text x="420" y="86" font-size="9" fill="var(--d-text-muted)">碎片字节 >= 100MB 且 碎片比 >= 10%</text>
      <rect x="40" y="110" width="700" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="60" y="130" font-size="10" font-weight="600" fill="var(--d-warn-text)">active-defrag-ignore-bytes 100mb</text>
      <text x="470" y="130" font-size="10" fill="var(--d-text)">碎片字节阈值</text>
      <text x="60" y="146" font-size="10" font-weight="600" fill="var(--d-warn-text)">active-defrag-threshold-lower 10</text>
      <text x="470" y="146" font-size="10" fill="var(--d-text)">碎片比例阈值（%）</text>
      <rect x="40" y="170" width="700" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="60" y="190" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">active-defrag-cycle-min 25</text>
      <text x="470" y="190" font-size="10" fill="var(--d-text)">清理 CPU 时间下限（%）</text>
      <text x="60" y="206" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">active-defrag-cycle-max 75</text>
      <text x="470" y="206" font-size="10" fill="var(--d-text)">清理 CPU 时间上限（%），超过即停</text>
    </svg>

    <!-- ===== Ch 21: 缓冲区 ===== -->

    <svg v-else-if="kind === 'buffer-client-types'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="三种客户端缓冲区" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">三种客户端输出缓冲区</text>
      <rect x="30" y="56" width="220" height="120" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="140" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">普通客户端</text>
      <text x="140" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">阻塞式请求-响应</text>
      <text x="140" y="122" text-anchor="middle" font-size="9" font-family="monospace" fill="var(--d-text-muted)">normal 0 0 0</text>
      <text x="140" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">一般不限制大小</text>
      <text x="140" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">输入缓冲区上限 1GB</text>
      <rect x="280" y="56" width="220" height="120" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="390" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">订阅客户端</text>
      <text x="390" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">持续推送频道消息</text>
      <text x="390" y="122" text-anchor="middle" font-size="9" font-family="monospace" fill="var(--d-text-muted)">pubsub 8mb 2mb 60</text>
      <text x="390" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">上限 8MB / 持续 2MB·60s</text>
      <text x="390" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">超限断开连接</text>
      <rect x="530" y="56" width="220" height="120" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="640" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">从库客户端</text>
      <text x="640" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">全量复制传输命令</text>
      <text x="640" y="122" text-anchor="middle" font-size="9" font-family="monospace" fill="var(--d-text-muted)">slave 512mb 128mb 60</text>
      <text x="640" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">主节点为每从库维护</text>
      <text x="640" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">溢出关闭连接</text>
      <rect x="160" y="190" width="460" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="207" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">通过 client-output-buffer-limit 分别配置三类缓冲区</text>
    </svg>

    <svg v-else-if="kind === 'buffer-repl-backlog'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="复制积压缓冲区 vs 复制缓冲区" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">复制积压缓冲区 vs 复制缓冲区</text>
      <rect x="40" y="54" width="320" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="200" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">复制积压缓冲区</text>
      <text x="200" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">repl_backlog_buffer</text>
      <text x="200" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">所有从库共享（环形）</text>
      <text x="200" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">写满覆盖旧数据</text>
      <text x="200" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">用于增量复制</text>
      <rect x="420" y="54" width="320" height="120" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="580" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">复制缓冲区</text>
      <text x="580" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">client-output-buffer (slave)</text>
      <text x="580" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">每个从库独享一份</text>
      <text x="580" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">溢出关闭连接 → 全量复制</text>
      <text x="580" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">用于全量复制期间暂存</text>
      <rect x="140" y="188" width="500" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="207" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">积压缓冲区写满 → 全量复制；复制缓冲区溢出 → 连接断开 → 也触发全量复制</text>
    </svg>

    <svg v-else-if="kind === 'buffer-overflow-risk'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="缓冲区溢出风险与配置" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓冲区溢出风险与 client-output-buffer-limit</text>
      <rect x="40" y="54" width="340" height="110" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="210" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">溢出原因</text>
      <rect x="60" y="90" width="300" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="210" y="107" text-anchor="middle" font-size="10" fill="var(--d-text)">1. 发送过快过大（bigkey / 大 RDB）</text>
      <rect x="60" y="118" width="300" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="210" y="135" text-anchor="middle" font-size="10" fill="var(--d-text)">2. 处理较慢（主线程阻塞）</text>
      <rect x="60" y="146" width="300" height="14" rx="4" />
      <text x="210" y="157" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">3. 缓冲区空间设置过小</text>
      <rect x="420" y="54" width="320" height="110" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="580" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">配置格式</text>
      <text x="440" y="100" font-size="9" font-family="monospace" fill="var(--d-text)">client-output-buffer-limit</text>
      <text x="440" y="116" font-size="9" font-family="monospace" fill="var(--d-text)">  &lt;class&gt; &lt;hard&gt; &lt;soft&gt; &lt;seconds&gt;</text>
      <text x="440" y="138" font-size="9" fill="var(--d-text-muted)">class: normal / pubsub / slave</text>
      <text x="440" y="154" font-size="9" fill="var(--d-text-muted)">hard: 绝对上限  soft+seconds: 持续写入</text>
      <rect x="80" y="180" width="620" height="32" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="196" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">溢出后果：普通/订阅/从库 → 关闭连接；复制积压 → 覆盖旧数据 → 全量复制</text>
      <text x="390" y="208" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">避免 MONITOR 长期运行 · 避免 bigkey · 合理设置缓冲区大小</text>
    </svg>


    <!-- ===== Ch 23  旁路缓存 ===== -->

    <svg v-else-if="kind === 'cache-storage-layers'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="三层存储：CPU缓存 → 内存 → 磁盘" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">计算机系统三层存储结构</text>
      <rect x="60" y="50" width="180" height="56" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="150" y="74" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">CPU 处理器</text>
      <text x="150" y="94" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">几十 ns · MB 级</text>
      <rect x="300" y="50" width="180" height="56" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="390" y="74" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">内存</text>
      <text x="390" y="94" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">百 ns · GB 级</text>
      <rect x="540" y="50" width="180" height="56" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="630" y="74" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">磁盘</text>
      <text x="630" y="94" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">几 ms · TB 级</text>
      <line x1="240" y1="78" x2="300" y2="78" stroke="var(--d-border)" stroke-width="1.6" />
      <polygon points="296,74 296,82 306,78" fill="var(--d-border)" />
      <line x1="480" y1="78" x2="540" y2="78" stroke="var(--d-border)" stroke-width="1.6" />
      <polygon points="536,74 536,82 546,78" fill="var(--d-border)" />
      <rect x="100" y="130" width="580" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="150" text-anchor="middle" font-size="11" fill="var(--d-text)">速度逐级递减，容量逐级递增 → 需要「缓存」弥补速度差异</text>
      <rect x="100" y="168" width="580" height="26" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="390" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">缓存特征①：快速子系统暂存数据　缓存特征②：容量远小于后端</text>
    </svg>

    <svg v-else-if="kind === 'cache-llc-pagecache'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="LLC 与 page cache 缓存层次" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">计算机系统中的两级缓存</text>
      <rect x="40" y="54" width="100" height="42" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="90" y="80" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">L1</text>
      <rect x="170" y="54" width="100" height="42" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="220" y="80" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">L2</text>
      <rect x="300" y="54" width="100" height="42" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="350" y="80" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">LLC</text>
      <rect x="430" y="54" width="100" height="42" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="480" y="80" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">内存</text>
      <rect x="560" y="54" width="100" height="42" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="610" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">page</text>
      <text x="610" y="88" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">cache</text>
      <rect x="690" y="54" width="60" height="42" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="720" y="80" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">磁盘</text>
      <line x1="140" y1="75" x2="170" y2="75" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#arrowLLC)" />
      <line x1="270" y1="75" x2="300" y2="75" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#arrowLLC)" />
      <line x1="400" y1="75" x2="430" y2="75" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#arrowLLC)" />
      <line x1="530" y1="75" x2="560" y2="75" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#arrowLLC)" />
      <line x1="660" y1="75" x2="690" y2="75" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#arrowLLC)" />
      <defs><marker id="arrowLLC" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--d-border)" /></marker></defs>
      <rect x="80" y="116" width="260" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="210" y="135" text-anchor="middle" font-size="11" fill="var(--d-text)">LLC 缓存内存数据（CPU 端）</text>
      <rect x="440" y="116" width="260" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="570" y="135" text-anchor="middle" font-size="11" fill="var(--d-text)">page cache 缓存磁盘数据</text>
      <rect x="120" y="164" width="540" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="184" text-anchor="middle" font-size="11" fill="var(--d-text)">Redis 在互联网应用中扮演类似角色：快速子系统 → 缓存热数据</text>
    </svg>

    <svg v-else-if="kind === 'cache-hit-miss-flow'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="缓存命中与缓存缺失处理流程" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存命中 vs 缓存缺失</text>
      <rect x="40" y="60" width="120" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="87" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">业务应用</text>
      <rect x="260" y="60" width="140" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="330" y="87" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Redis 缓存</text>
      <rect x="520" y="60" width="140" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="590" y="87" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">后端数据库</text>
      <line x1="160" y1="82" x2="260" y2="82" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <polygon points="256,78 256,86 266,82" fill="var(--d-blue-border)" />
      <text x="210" y="74" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">① 查询</text>
      <rect x="230" y="126" width="200" height="32" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="330" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">命中 → 直接返回（快）</text>
      <rect x="230" y="172" width="200" height="32" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="330" y="193" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">缺失 → 查后端 DB</text>
      <line x1="430" y1="188" x2="520" y2="188" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="516,184 516,192 526,188" fill="var(--d-warn-border)" />
      <text x="475" y="180" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">② 读 DB</text>
      <line x1="520" y1="104" x2="400" y2="172" stroke="var(--d-rv-a-border)" stroke-width="1.4" stroke-dasharray="5 4" />
      <text x="480" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">③ 回填缓存</text>
      <rect x="200" y="214" width="380" height="22" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="229" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">缓存更新：缺失后将 DB 数据写入 Redis，后续请求可命中</text>
    </svg>

    <svg v-else-if="kind === 'cache-readonly-flow'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="只读缓存：写直通 DB + 删缓存，读缺失回填" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">只读缓存（Cache-Aside）</text>
      <rect x="40" y="56" width="120" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="83" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">业务应用</text>
      <rect x="260" y="56" width="140" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="330" y="83" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Redis 缓存</text>
      <rect x="520" y="56" width="140" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="590" y="83" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">数据库</text>
      <text x="60" y="130" font-size="12" font-weight="700" fill="var(--d-warn-text)">写路径</text>
      <line x1="160" y1="142" x2="520" y2="142" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="516,138 516,146 526,142" fill="var(--d-warn-border)" />
      <text x="340" y="137" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">① 直写 DB（增/删/改）</text>
      <line x1="160" y1="162" x2="260" y2="162" stroke="var(--d-rv-a-border)" stroke-width="1.4" stroke-dasharray="5 4" />
      <polygon points="256,158 256,166 266,162" fill="var(--d-rv-a-border)" />
      <text x="210" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">② 删缓存</text>
      <text x="60" y="196" font-size="12" font-weight="700" fill="var(--d-blue-text)">读路径</text>
      <line x1="160" y1="208" x2="260" y2="208" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <polygon points="256,204 256,212 266,208" fill="var(--d-blue-border)" />
      <text x="210" y="202" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">③ 查缓存</text>
      <text x="330" y="218" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">miss → 读 DB → 回填缓存</text>
    </svg>

    <svg v-else-if="kind === 'cache-readwrite-strategies'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="读写缓存两种策略：同步直写 vs 异步写回" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">读写缓存的两种写回策略</text>
      <rect x="30" y="52" width="340" height="172" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="200" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">同步直写（Write-Through）</text>
      <rect x="60" y="92" width="120" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="120" y="115" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">写缓存</text>
      <rect x="220" y="92" width="120" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="280" y="115" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">写 DB</text>
      <text x="200" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">同时</text>
      <rect x="60" y="142" width="280" height="26" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="200" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优先保证数据可靠性</text>
      <rect x="60" y="178" width="280" height="26" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="200" y="196" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">代价：需等 DB 完成，响应延迟较高</text>
      <rect x="410" y="52" width="340" height="172" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="580" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">异步写回（Write-Back）</text>
      <rect x="440" y="92" width="120" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="500" y="115" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">先写缓存</text>
      <rect x="600" y="92" width="120" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="660" y="115" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">淘汰时刷 DB</text>
      <line x1="560" y1="110" x2="600" y2="110" stroke="var(--d-border)" stroke-width="1.4" stroke-dasharray="5 4" />
      <polygon points="596,106 596,114 606,110" fill="var(--d-border)" />
      <rect x="440" y="142" width="280" height="26" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="580" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优先提供低延迟响应</text>
      <rect x="440" y="178" width="280" height="26" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="580" y="196" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险：掉电时未刷回的数据会丢失</text>
    </svg>

    <!-- ===== Ch 24  淘汰策略 ===== -->

    <svg v-else-if="kind === 'eviction-maxmemory'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="内存达到 maxmemory 上限触发淘汰" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存写满触发淘汰</text>
      <rect x="60" y="50" width="300" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="210" y="80" text-anchor="middle" font-size="13" font-weight="600" fill="var(--d-text)">已用内存</text>
      <rect x="360" y="50" width="180" height="50" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" stroke-dasharray="6 4" />
      <text x="450" y="80" text-anchor="middle" font-size="13" fill="var(--d-text-muted)">空闲空间</text>
      <line x1="540" y1="50" x2="540" y2="100" stroke="var(--d-warn-border)" stroke-width="2.4" />
      <text x="620" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">maxmemory</text>
      <rect x="120" y="118" width="540" height="32" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="139" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">已用内存 >= maxmemory → 按策略筛选并淘汰数据，为新数据腾出空间</text>
      <rect x="200" y="158" width="380" height="20" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="390" y="173" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">CONFIG SET maxmemory 4gb</text>
    </svg>

    <svg v-else-if="kind === 'eviction-8-policies'" viewBox="0 0 780 280" xmlns="http://www.w3.org/2000/svg" aria-label="Redis 8 种淘汰策略分类" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 8 种数据淘汰策略</text>
      <rect x="30" y="50" width="720" height="222" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="390" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">不淘汰</text>
      <rect x="310" y="84" width="160" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="390" y="104" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">noeviction</text>
      <text x="200" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">设置过期时间的键</text>
      <rect x="56" y="150" width="110" height="28" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="111" y="169" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">volatile-lru</text>
      <rect x="176" y="150" width="110" height="28" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="231" y="169" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">volatile-lfu</text>
      <rect x="56" y="186" width="110" height="28" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="111" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">volatile-random</text>
      <rect x="176" y="186" width="110" height="28" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.1" />
      <text x="231" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">volatile-ttl</text>
      <text x="570" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">所有键</text>
      <rect x="460" y="150" width="110" height="28" rx="7" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="515" y="169" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue-text)">allkeys-lru</text>
      <rect x="580" y="150" width="110" height="28" rx="7" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="635" y="169" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue-text)">allkeys-lfu</text>
      <rect x="500" y="186" width="140" height="28" rx="7" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.1" />
      <text x="570" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue-text)">allkeys-random</text>
      <rect x="80" y="232" width="620" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="251" text-anchor="middle" font-size="10" fill="var(--d-text)">建议：有冷热区分用 allkeys-lru；有置顶需求用 volatile-lru；访问均匀用 allkeys-random</text>
    </svg>

    <svg v-else-if="kind === 'eviction-lru-approx'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="Redis 近似 LRU：随机采样 + 淘汰池" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 近似 LRU 算法</text>
      <rect x="40" y="54" width="200" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="140" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">全部数据</text>
      <text x="140" y="94" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">每个键记录 lru 时间戳</text>
      <line x1="240" y1="79" x2="310" y2="79" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="306,75 306,83 316,79" fill="var(--d-border)" />
      <text x="275" y="72" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">随机选 N 个</text>
      <rect x="310" y="54" width="200" height="50" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="410" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">候选集合</text>
      <text x="410" y="94" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">maxmemory-samples 个</text>
      <line x1="510" y1="79" x2="580" y2="79" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="576,75 576,83 586,79" fill="var(--d-border)" />
      <text x="545" y="72" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">淘汰最旧</text>
      <rect x="580" y="54" width="160" height="50" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="660" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">淘汰 lru 最小</text>
      <text x="660" y="94" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">即最久未访问</text>
      <rect x="80" y="124" width="620" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="140" text-anchor="middle" font-size="11" fill="var(--d-text)">再次淘汰时：新数据的 lru 必须小于候选集合最小 lru 才能进入</text>
      <text x="390" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">候选集满时淘汰其中 lru 最小的数据</text>
      <rect x="120" y="178" width="540" height="28" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="390" y="197" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">无需全局链表、无需每次移动 → 保持高性能的同时近似 LRU 效果</text>
    </svg>

    <svg v-else-if="kind === 'eviction-lfu-counters'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="LFU 计数器衰减机制" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">LFU 策略：计数器与衰减机制</text>
      <rect x="40" y="50" width="320" height="82" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="200" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">lru 字段拆分（24 bit）</text>
      <rect x="60" y="84" width="140" height="32" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="130" y="105" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">ldt（16 bit 时间戳）</text>
      <rect x="210" y="84" width="130" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="275" y="105" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">counter（8 bit）</text>
      <rect x="410" y="50" width="340" height="82" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="580" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">非线性递增计数</text>
      <text x="580" y="94" text-anchor="middle" font-size="10" fill="var(--d-text)">p = 1 / (counter * lfu_log_factor + 1)</text>
      <text x="580" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">随机数 r 小于 p 时 counter 才 +1</text>
      <text x="580" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">初始值 5（LFU_INIT_VAL），最大 255</text>
      <rect x="40" y="150" width="340" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="210" y="172" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">衰减机制</text>
      <text x="210" y="192" text-anchor="middle" font-size="10" fill="var(--d-text)">衰减值 = (当前时间 - 最近访问) / lfu_decay_time</text>
      <rect x="410" y="150" width="340" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="580" y="172" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">筛选规则</text>
      <text x="580" y="192" text-anchor="middle" font-size="10" fill="var(--d-text)">先比 counter（低优先淘汰）→ 再比 ldt（旧优先淘汰）</text>
    </svg>

    <!-- ===== Ch 27  缓存污染 ===== -->

    <svg v-else-if="kind === 'pollution-what-is'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="缓存污染：低频数据占缓存挤走热数据" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">什么是缓存污染</text>
      <rect x="40" y="54" width="320" height="60" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="200" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">正常缓存</text>
      <text x="200" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">热数据留在缓存 → 命中率高</text>
      <rect x="420" y="54" width="320" height="60" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="580" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">缓存污染</text>
      <text x="580" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">低频/一次性数据占满缓存空间</text>
      <rect x="80" y="130" width="620" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="150" text-anchor="middle" font-size="11" fill="var(--d-text)">结果：热数据被挤出 → 缓存缺失增多 → 频繁访问后端 DB → 性能下降</text>
      <rect x="140" y="172" width="500" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="390" y="189" text-anchor="middle" font-size="10" fill="var(--d-text)">解决思路：识别并优先淘汰只访问一次或访问极少的数据</text>
    </svg>

    <svg v-else-if="kind === 'pollution-lru-problem'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="LRU 策略下全表扫描导致缓存污染" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">LRU 策略的污染问题</text>
      <rect x="40" y="56" width="220" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="150" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">缓存（LRU 排序）</text>
      <text x="150" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">按最近访问时间排列</text>
      <rect x="310" y="56" width="200" height="50" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="410" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">全表扫描</text>
      <text x="410" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">大量冷数据被读取一次</text>
      <line x1="510" y1="81" x2="260" y2="81" stroke="var(--d-warn-border)" stroke-width="1.4" stroke-dasharray="5 4" />
      <polygon points="264,77 264,85 254,81" fill="var(--d-warn-border)" />
      <text x="385" y="120" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">冷数据涌入 → lru 时间戳很新</text>
      <rect x="560" y="56" width="180" height="50" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="650" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">热数据被挤出</text>
      <text x="650" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">lru 较旧先被淘汰</text>
      <rect x="80" y="140" width="620" height="32" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="161" text-anchor="middle" font-size="11" fill="var(--d-text)">LRU 只看时间戳 → 刚访问的冷数据被误认为"热" → 长时间驻留缓存</text>
      <rect x="120" y="186" width="540" height="26" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="204" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">扫描式单次查询 = 缓存污染的典型场景</text>
    </svg>

    <svg v-else-if="kind === 'pollution-lfu-solution'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="LFU 策略按频次淘汰，不受扫描影响" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">LFU 策略解决缓存污染</text>
      <rect x="40" y="56" width="220" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="150" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">缓存（LFU 排序）</text>
      <text x="150" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">按访问次数 + 时间排列</text>
      <rect x="310" y="56" width="200" height="50" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="410" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">扫描数据</text>
      <text x="410" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">counter = 5（初始值）</text>
      <rect x="560" y="56" width="180" height="50" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="650" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">热数据保留</text>
      <text x="650" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">counter 远高于扫描数据</text>
      <rect x="80" y="124" width="620" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="140" text-anchor="middle" font-size="11" fill="var(--d-text)">扫描数据只被访问一次 → counter 不会增长 → LFU 优先淘汰它们</text>
      <text x="390" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">热数据 counter 高 → 不受扫描影响 → 留在缓存中</text>
      <rect x="120" y="176" width="540" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="390" y="196" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">建议：扫描场景用 LFU；短时高频数据设 lfu_decay_time=1 加速衰减</text>
    </svg>
    <!-- Ch31: 事务 MULTI/EXEC 流程 -->
    <svg v-else-if="kind === 'tx-multi-exec-flow'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="MULTI→命令入队→EXEC 批量执行" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 事务执行流程</text>
      <rect x="30" y="50" width="120" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="90" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">MULTI</text>
      <line x1="150" y1="72" x2="200" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="196,68 196,76 208,72" fill="var(--d-border)" />
      <rect x="210" y="50" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="290" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">命令入队</text>
      <text x="290" y="85" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">返回 QUEUED</text>
      <line x1="370" y1="72" x2="420" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="416,68 416,76 428,72" fill="var(--d-border)" />
      <rect x="430" y="50" width="120" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="490" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">EXEC</text>
      <line x1="550" y1="72" x2="600" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="596,68 596,76 608,72" fill="var(--d-border)" />
      <rect x="610" y="50" width="140" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="680" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">批量执行</text>
      <text x="680" y="85" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">返回结果数组</text>
      <rect x="210" y="110" width="540" height="44" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="480" y="130" text-anchor="middle" font-size="11" fill="var(--d-text)">命令队列：DECR a:stock → DECR b:stock → ...</text>
      <text x="480" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">所有命令暂存队列，EXEC 时一次性顺序执行</text>
      <text x="390" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">MULTI 开启事务 → 命令入队返回 QUEUED → EXEC 触发批量执行并返回结果</text>
    </svg>

    <!-- Ch31: 命令入队报错 → 事务不执行 -->
    <svg v-else-if="kind === 'tx-command-error'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="语法错误入队报错，整个事务拒绝执行" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">入队时命令语法错误 → 事务整体放弃</text>
      <rect x="30" y="50" width="120" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="90" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">MULTI</text>
      <line x1="150" y1="72" x2="200" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="196,68 196,76 208,72" fill="var(--d-border)" />
      <rect x="210" y="50" width="180" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="300" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">PUT a:stock 5</text>
      <text x="300" y="85" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">ERR unknown command</text>
      <line x1="390" y1="72" x2="430" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="426,68 426,76 438,72" fill="var(--d-border)" />
      <rect x="440" y="50" width="140" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="510" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">DECR b:stock</text>
      <text x="510" y="85" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">QUEUED</text>
      <line x1="580" y1="72" x2="620" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="616,68 616,76 628,72" fill="var(--d-border)" />
      <rect x="630" y="50" width="120" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="690" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">EXEC</text>
      <rect x="130" y="120" width="520" height="40" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="390" y="145" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">EXECABORT：事务因之前的错误被放弃，所有命令不执行</text>
      <text x="390" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">入队阶段检测到语法错误 → EXEC 时拒绝执行整个事务，保证原子性</text>
    </svg>

    <!-- Ch31: EXEC 执行时部分命令报错 -->
    <svg v-else-if="kind === 'tx-exec-error'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="执行时部分命令出错，其他正常执行（不回滚）" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">执行时类型错误 → 部分失败不回滚</text>
      <rect x="30" y="50" width="120" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="90" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">MULTI</text>
      <line x1="150" y1="72" x2="190" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="186,68 186,76 198,72" fill="var(--d-border)" />
      <rect x="200" y="50" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="280" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">LPOP a:stock</text>
      <text x="280" y="85" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">QUEUED (入队OK)</text>
      <line x1="360" y1="72" x2="400" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="396,68 396,76 408,72" fill="var(--d-border)" />
      <rect x="410" y="50" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="490" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">DECR b:stock</text>
      <text x="490" y="85" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">QUEUED (入队OK)</text>
      <line x1="570" y1="72" x2="610" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="606,68 606,76 618,72" fill="var(--d-border)" />
      <rect x="620" y="50" width="120" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="680" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">EXEC</text>
      <rect x="130" y="114" width="240" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="250" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">WRONGTYPE 类型不匹配</text>
      <rect x="410" y="114" width="240" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="530" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">成功：(integer) 8</text>
      <text x="390" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">入队时未检测到错误，执行时报错的命令失败，其余正常执行 → 不保证原子性</text>
    </svg>

    <!-- Ch31: WATCH 乐观锁 -->
    <svg v-else-if="kind === 'tx-watch-optimistic'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="WATCH 乐观锁：key 被修改则事务放弃" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">WATCH 乐观锁机制</text>
      <text x="100" y="58" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">客户端 X</text>
      <text x="580" y="58" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">客户端 Y</text>
      <line x1="100" y1="66" x2="100" y2="200" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="580" y1="66" x2="580" y2="200" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="140" y="72" width="180" height="28" rx="7" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="230" y="91" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">t1: WATCH a:stock</text>
      <rect x="140" y="108" width="180" height="28" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="230" y="127" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">t2: MULTI + DECR</text>
      <rect x="440" y="108" width="200" height="28" rx="7" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="540" y="127" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">t3: DECR a:stock (直接执行)</text>
      <rect x="140" y="148" width="300" height="28" rx="7" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="290" y="167" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">t4: EXEC → 检测到 a:stock 已被改 → 返回 nil</text>
      <rect x="140" y="188" width="500" height="28" rx="7" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="207" text-anchor="middle" font-size="10" fill="var(--d-text)">事务放弃执行，客户端可重试 → 实现乐观锁的隔离性保证</text>
      <text x="390" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">WATCH 监控 key → 若 key 在 EXEC 前被其他客户端修改 → 事务自动放弃</text>
    </svg>

    <!-- Ch32: 超时触发全量重新同步 -->
    <svg v-else-if="kind === 'failover-repl-timeout'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="复制超时导致全量重新同步" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">复制超时 → 全量重新同步</text>
      <rect x="60" y="56" width="140" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="130" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">主库</text>
      <text x="130" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">正常发送命令</text>
      <line x1="200" y1="81" x2="300" y2="81" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="296,77 296,85 308,81" fill="var(--d-border)" />
      <rect x="310" y="56" width="160" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="390" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">网络延迟/中断</text>
      <text x="390" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">超过 repl-timeout</text>
      <line x1="470" y1="81" x2="560" y2="81" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="556,77 556,85 568,81" fill="var(--d-border)" />
      <rect x="570" y="56" width="160" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="650" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">连接断开</text>
      <text x="650" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">触发全量同步</text>
      <rect x="130" y="130" width="520" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="153" text-anchor="middle" font-size="11" fill="var(--d-text)">全量同步 = 生成 RDB + 传输 RDB + 从库加载 → 占用大量 CPU、内存、带宽</text>
      <text x="390" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">合理设置 repl-timeout（如 60s），避免因短暂网络抖动触发不必要的全量同步</text>
    </svg>

    <!-- Ch32: 主库重启引发多从库同步风暴 -->
    <svg v-else-if="kind === 'failover-repl-storm'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="主库重启后多从库同时全量同步" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">主库重启 → 多从库同步风暴</text>
      <rect x="300" y="50" width="160" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="380" y="72" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">主库重启</text>
      <text x="380" y="90" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">runID 变化</text>
      <line x1="300" y1="100" x2="130" y2="130" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <line x1="380" y1="100" x2="380" y2="130" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <line x1="460" y1="100" x2="630" y2="130" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="50" y="130" width="140" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="120" y="155" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">从库 1 全量同步</text>
      <rect x="310" y="130" width="140" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="380" y="155" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">从库 2 全量同步</text>
      <rect x="570" y="130" width="140" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="640" y="155" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">从库 3 全量同步</text>
      <rect x="100" y="188" width="580" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="207" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">主库同时 fork 多次生成 RDB → CPU/内存/带宽瞬间飙升</text>
      <text x="390" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">风险：多从库并行全量同步造成主库压力过大，影响正常请求处理</text>
    </svg>

    <!-- Ch32: 级联复制降低主库压力 -->
    <svg v-else-if="kind === 'failover-cascade-fix'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="级联复制：从库 A→从库 B→从库 C" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">级联复制拓扑降低主库压力</text>
      <rect x="300" y="48" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="380" y="75" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">主库</text>
      <line x1="380" y1="92" x2="380" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <polygon points="376,114 384,114 380,126" fill="var(--d-blue-border)" />
      <rect x="300" y="126" width="160" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="380" y="151" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">从库 A</text>
      <line x1="320" y1="166" x2="200" y2="186" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="440" y1="166" x2="560" y2="186" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="120" y="176" width="140" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="190" y="198" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">从库 B</text>
      <rect x="500" y="176" width="140" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="570" y="198" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">从库 C</text>
      <text x="80" y="80" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">主库只需同步 1 个从库</text>
      <text x="680" y="151" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">从库 A 级联同步给 B、C</text>
    </svg>

    <!-- Ch34: 实践 QA 要点列表 -->
    <svg v-else-if="kind === 'qa2-practice-summary'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="第 23~33 讲实践 QA 关键要点" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">第 23~33 讲课后思考题核心要点</text>
      <rect x="40" y="44" width="700" height="196" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="70" y="72" font-size="11" fill="var(--d-text)">1. 只读缓存 vs 读写缓存：只读删缓存 + 写数据库；读写同时更新两者</text>
      <text x="70" y="96" font-size="11" fill="var(--d-text)">2. 缓存脏数据写回 → 对应异步写回策略的读写缓存模式</text>
      <text x="70" y="120" font-size="11" fill="var(--d-text)">3. 缓存穿透用布隆过滤器事前拦截；雪崩/击穿用熔断/降级/限流</text>
      <text x="70" y="144" font-size="11" fill="var(--d-text)">4. LFU 极端场景仍可能发生缓存污染（计数器短期飙高 + 衰减慢）</text>
      <text x="70" y="168" font-size="11" fill="var(--d-text)">5. SETNX + EXPIRE 非原子，需用 SET NX EX 保证加锁原子性</text>
      <text x="70" y="192" font-size="11" fill="var(--d-text)">6. 事务 RDB 恢复：已执行事务 + 已快照 → 可恢复；未快照 → 数据丢失</text>
      <text x="70" y="216" font-size="11" fill="var(--d-text)">7. 从库 slave-read-only=no 不可取：从库写入破坏主从一致性</text>
      <text x="70" y="232" font-size="11" fill="var(--d-text)">8. min-slaves-max-lag 设置不当 → 脑裂风险，原主库恢复后仍接收写请求</text>
      <text x="390" y="254" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">建议：学思结合，理解问题背后原理，动手实践验证</text>
    </svg>

    <!-- Ch35: Codis 整体架构 -->
    <svg v-else-if="kind === 'codis-architecture'" viewBox="0 0 820 280" xmlns="http://www.w3.org/2000/svg" aria-label="Codis 集群架构：server + proxy + ZK + dashboard" role="img">
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis 集群整体架构</text>
      <rect x="310" y="44" width="200" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="410" y="71" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">codis dashboard / fe</text>
      <line x1="410" y1="88" x2="410" y2="114" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <polygon points="406,110 414,110 410,122" fill="var(--d-blue-border)" />
      <rect x="290" y="122" width="240" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="410" y="147" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">Zookeeper 集群</text>
      <line x1="320" y1="162" x2="180" y2="190" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="500" y1="162" x2="640" y2="190" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="60" y="190" width="240" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="180" y="217" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">codis proxy（多个）</text>
      <rect x="520" y="190" width="240" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="640" y="217" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">codis server（多组）</text>
      <line x1="300" y1="212" x2="520" y2="212" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="516,208 516,216 528,212" fill="var(--d-border)" />
      <text x="410" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">请求转发</text>
      <text x="410" y="264" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">dashboard 管理集群；proxy 接收客户端请求并转发；ZK 存储元数据和路由表</text>
    </svg>

    <!-- Ch35: 客户端→proxy→slot→server -->
    <svg v-else-if="kind === 'codis-request-flow'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="Codis 请求处理流程" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis 请求处理流程</text>
      <rect x="30" y="70" width="120" height="50" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="90" y="100" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">客户端</text>
      <line x1="150" y1="95" x2="210" y2="95" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="206,91 206,99 218,95" fill="var(--d-border)" />
      <rect x="220" y="70" width="140" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="290" y="92" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">codis proxy</text>
      <text x="290" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">查路由表</text>
      <line x1="360" y1="95" x2="420" y2="95" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="416,91 416,99 428,95" fill="var(--d-border)" />
      <rect x="430" y="70" width="120" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="490" y="92" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">Slot</text>
      <text x="490" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">定位目标</text>
      <line x1="550" y1="95" x2="610" y2="95" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="606,91 606,99 618,95" fill="var(--d-border)" />
      <rect x="620" y="70" width="130" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="685" y="92" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">codis server</text>
      <text x="685" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">处理请求</text>
      <rect x="130" y="145" width="520" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">客户端使用 RESP 协议直连 proxy，无需修改客户端代码</text>
      <text x="390" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">proxy 根据路由表将请求转发到对应 codis server，server 处理后返回结果</text>
    </svg>

    <!-- Ch35: key→CRC32→slot(1024)→server -->
    <svg v-else-if="kind === 'codis-slot-mapping'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="Codis Slot 映射：key→CRC32→slot→server" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis 数据分布：key → Slot → Server</text>
      <rect x="40" y="60" width="120" height="40" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="100" y="85" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">key</text>
      <line x1="160" y1="80" x2="210" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="206,76 206,84 218,80" fill="var(--d-border)" />
      <rect x="220" y="60" width="160" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="300" y="85" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">CRC32(key) % 1024</text>
      <line x1="380" y1="80" x2="430" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="426,76 426,84 438,80" fill="var(--d-border)" />
      <rect x="440" y="60" width="120" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="500" y="85" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Slot (0~1023)</text>
      <line x1="560" y1="80" x2="610" y2="80" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="606,76 606,84 618,80" fill="var(--d-border)" />
      <rect x="620" y="60" width="130" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="685" y="85" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">codis server</text>
      <rect x="100" y="122" width="200" height="32" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="200" y="143" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">key1 → CRC32 % 1024 = 1</text>
      <rect x="340" y="122" width="200" height="32" rx="7" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="440" y="143" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Slot 0~1 → server 1</text>
      <rect x="100" y="162" width="200" height="32" rx="7" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="200" y="183" text-anchor="middle" font-size="10" fill="var(--d-text)">key2 → CRC32 % 1024 = 1022</text>
      <rect x="340" y="162" width="200" height="32" rx="7" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="440" y="183" text-anchor="middle" font-size="10" fill="var(--d-text)">Slot 1022~1023 → server 8</text>
      <text x="390" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Codis 共 1024 个 Slot，key 通过 CRC32 取模映射到 Slot，Slot 分配到 server</text>
    </svg>

    <!-- Ch35: 路由表同步 -->
    <svg v-else-if="kind === 'codis-routing-table'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="Codis 路由表：dashboard 设置 → ZK 保存 → proxy 缓存" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis 路由表分发流程</text>
      <rect x="260" y="50" width="260" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="390" y="77" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">codis dashboard（设置路由表）</text>
      <line x1="310" y1="94" x2="200" y2="124" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="470" y1="94" x2="580" y2="124" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="240" y="106" font-size="9" fill="var(--d-text-muted)">写入</text>
      <text x="540" y="106" font-size="9" fill="var(--d-text-muted)">推送</text>
      <rect x="80" y="124" width="220" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="190" y="149" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Zookeeper（持久化存储）</text>
      <rect x="480" y="124" width="220" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="590" y="149" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">codis proxy（本地缓存）</text>
      <line x1="300" y1="144" x2="480" y2="144" stroke="var(--d-border)" stroke-width="1.2" stroke-dasharray="6 4" />
      <text x="390" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">proxy 也可从 ZK 获取</text>
      <rect x="120" y="186" width="540" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="205" text-anchor="middle" font-size="10" fill="var(--d-text)">路由表变更 → dashboard 更新 ZK 并通知 proxy → proxy 刷新本地缓存</text>
      <text x="390" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">路由表记录 Slot 与 server 的对应关系，proxy 依据此表转发请求</text>
    </svg>

    <!-- Ch35: 数据迁移流程 -->
    <svg v-else-if="kind === 'codis-data-migration'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="Codis 数据迁移：源 server 逐条迁移到目标 server" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis Slot 数据迁移流程</text>
      <rect x="60" y="56" width="200" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="160" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">源 codis server</text>
      <text x="160" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Slot 300 的数据</text>
      <rect x="520" y="56" width="200" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="620" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">目标 codis server</text>
      <text x="620" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">接收迁移数据</text>
      <line x1="260" y1="76" x2="520" y2="76" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="516,72 516,80 528,76" fill="var(--d-warn-border)" />
      <text x="390" y="70" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">1. 发送数据</text>
      <line x1="520" y1="96" x2="260" y2="96" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <polygon points="264,92 264,100 252,96" fill="var(--d-rv-c-border)" />
      <text x="390" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">2. ACK 确认</text>
      <rect x="130" y="136" width="520" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">3. 源 server 删除已迁移数据 → 重复直到 Slot 内所有 key 迁移完成</text>
      <rect x="130" y="178" width="520" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="197" text-anchor="middle" font-size="10" fill="var(--d-text)">异步迁移：bigkey 拆分成单条指令逐一传输，避免阻塞源 server</text>
      <text x="390" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">迁移按 Slot 粒度进行，支持同步和异步两种模式</text>
    </svg>

    <!-- Ch35: 新增 proxy -->
    <svg v-else-if="kind === 'codis-add-proxy'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="新增 codis proxy：ZK 更新列表，客户端自动发现" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">新增 codis proxy 流程</text>
      <rect x="280" y="50" width="220" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="390" y="75" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Zookeeper（proxy 列表）</text>
      <line x1="310" y1="90" x2="180" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="470" y1="90" x2="600" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="80" y="116" width="160" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="160" y="141" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">proxy 1 (已有)</text>
      <rect x="530" y="116" width="160" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="610" y="141" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">proxy 2 (新增)</text>
      <rect x="180" y="170" width="420" height="24" rx="7" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="187" text-anchor="middle" font-size="10" fill="var(--d-text)">客户端从 ZK 读取最新 proxy 列表，自动发现新 proxy</text>
    </svg>

    <!-- Ch35: server group -->
    <svg v-else-if="kind === 'codis-server-group'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="Codis server group：一主多从 + 哨兵" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis Server Group（一主多从 + 哨兵）</text>
      <rect x="240" y="50" width="300" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="73" text-anchor="middle" font-size="11" fill="var(--d-text)">Server Group（Slot 按 group 粒度分配）</text>
      <rect x="300" y="100" width="160" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="380" y="125" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">主 server</text>
      <line x1="320" y1="140" x2="180" y2="168" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="440" y1="140" x2="580" y2="168" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="90" y="160" width="140" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="160" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">从 server 1</text>
      <rect x="520" y="160" width="140" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="590" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">从 server 2</text>
      <rect x="580" y="98" width="120" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="640" y="120" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">哨兵集群</text>
      <text x="390" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">每个 group 包含一主多从 + 哨兵监控，保障 codis server 可靠性</text>
    </svg>

    <!-- Ch35: Codis vs Redis Cluster 对比表 -->
    <svg v-else-if="kind === 'codis-vs-cluster-table'" viewBox="0 0 820 280" xmlns="http://www.w3.org/2000/svg" aria-label="Codis vs Redis Cluster 特性对比" role="img">
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Codis vs Redis Cluster 对比</text>
      <rect x="40" y="44" width="200" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="140" y="64" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">对比维度</text>
      <rect x="250" y="44" width="250" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="375" y="64" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Codis</text>
      <rect x="510" y="44" width="270" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="645" y="64" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Redis Cluster</text>
      <rect x="40" y="80" width="200" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="140" y="99" text-anchor="middle" font-size="10" fill="var(--d-text)">数据路由</text>
      <rect x="250" y="80" width="250" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="375" y="99" text-anchor="middle" font-size="10" fill="var(--d-text)">proxy 转发 + ZK 存储路由表</text>
      <rect x="510" y="80" width="270" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="645" y="99" text-anchor="middle" font-size="10" fill="var(--d-text)">实例间 Gossip 协议传播</text>
      <rect x="40" y="114" width="200" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="140" y="133" text-anchor="middle" font-size="10" fill="var(--d-text)">数据迁移</text>
      <rect x="250" y="114" width="250" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="375" y="133" text-anchor="middle" font-size="10" fill="var(--d-text)">同步 + 异步（bigkey 友好）</text>
      <rect x="510" y="114" width="270" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="645" y="133" text-anchor="middle" font-size="10" fill="var(--d-text)">同步迁移</text>
      <rect x="40" y="148" width="200" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="140" y="167" text-anchor="middle" font-size="10" fill="var(--d-text)">扩缩容</text>
      <rect x="250" y="148" width="250" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="375" y="167" text-anchor="middle" font-size="10" fill="var(--d-text)">dashboard 操作，对客户端透明</text>
      <rect x="510" y="148" width="270" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="645" y="167" text-anchor="middle" font-size="10" fill="var(--d-text)">需客户端配合 MOVED/ASK</text>
      <rect x="40" y="182" width="200" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="140" y="201" text-anchor="middle" font-size="10" fill="var(--d-text)">客户端兼容</text>
      <rect x="250" y="182" width="250" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="375" y="201" text-anchor="middle" font-size="10" fill="var(--d-text)">兼容单实例客户端</text>
      <rect x="510" y="182" width="270" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="645" y="201" text-anchor="middle" font-size="10" fill="var(--d-text)">需集群感知客户端</text>
      <rect x="40" y="216" width="200" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="140" y="235" text-anchor="middle" font-size="10" fill="var(--d-text)">Redis 新特性</text>
      <rect x="250" y="216" width="250" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="375" y="235" text-anchor="middle" font-size="10" fill="var(--d-text)">基于 3.2.8，不支持新版特性</text>
      <rect x="510" y="216" width="270" height="28" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="645" y="235" text-anchor="middle" font-size="10" fill="var(--d-text)">随官方版本更新</text>
      <text x="410" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">选型建议：成熟稳定选 Codis，需新特性选 Redis Cluster</text>
    </svg>

    <!-- Ch36: 秒杀 Redis 流程 -->
    <svg v-else-if="kind === 'seckill-redis-flow'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="秒杀场景：限流→DECR 扣库存→创建订单→异步" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">秒杀场景中 Redis 的作用</text>
      <rect x="30" y="56" width="140" height="50" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="100" y="78" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">大量请求</text>
      <text x="100" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">瞬时高并发</text>
      <line x1="170" y1="81" x2="210" y2="81" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="206,77 206,85 218,81" fill="var(--d-border)" />
      <rect x="220" y="56" width="140" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="290" y="78" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">接入层限流</text>
      <text x="290" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">拦截恶意请求</text>
      <line x1="360" y1="81" x2="400" y2="81" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="396,77 396,85 408,81" fill="var(--d-border)" />
      <rect x="410" y="50" width="160" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="490" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Redis</text>
      <text x="490" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">库存查验 + DECR 扣减</text>
      <text x="490" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Lua 脚本保证原子性</text>
      <line x1="570" y1="81" x2="610" y2="81" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="606,77 606,85 618,81" fill="var(--d-border)" />
      <rect x="620" y="56" width="130" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="685" y="78" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">数据库</text>
      <text x="685" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">订单处理</text>
      <rect x="100" y="130" width="580" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="148" text-anchor="middle" font-size="11" fill="var(--d-text)">秒杀前：CDN/浏览器缓存 | 秒杀中：Redis 查验+扣减 | 秒杀后：DB 订单处理</text>
      <text x="390" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">库存扣减不能放在 DB（速度慢 + 超售风险），必须在 Redis 原子操作</text>
      <rect x="100" y="180" width="580" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="199" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">两种方案：Lua 原子脚本 或 分布式锁（锁在独立实例，库存在另一实例）</text>
      <text x="390" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">秒杀商品库存单独存放，避免干扰日常业务</text>
    </svg>

    <!-- Ch37: bigkey 导致数据量倾斜 -->
    <svg v-else-if="kind === 'skew-data-volume'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="bigkey 导致实例内存不均" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">数据量倾斜：bigkey 导致实例内存不均</text>
      <rect x="60" y="56" width="120" height="80" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="120" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">实例 1</text>
      <rect x="80" y="92" width="80" height="34" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="120" y="114" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">bigkey !</text>
      <rect x="240" y="76" width="120" height="50" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="300" y="106" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">实例 2</text>
      <rect x="420" y="76" width="120" height="50" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="480" y="106" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">实例 3</text>
      <rect x="600" y="76" width="120" height="50" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="660" y="106" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">实例 4</text>
      <rect x="100" y="150" width="580" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="390" y="169" text-anchor="middle" font-size="10" fill="var(--d-text)">bigkey 占用大量内存，导致实例 1 负载远高于其他实例</text>
      <text x="390" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">解决：避免生成 bigkey，集合类型可拆分为多个小集合分散存储</text>
    </svg>

    <!-- Ch37: 热点 key 导致访问倾斜 -->
    <svg v-else-if="kind === 'skew-hotspot-key'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="热点 key 单实例过载" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">数据访问倾斜：热点 key 导致单实例过载</text>
      <rect x="280" y="50" width="220" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="390" y="72" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">实例 A（含热点 key）</text>
      <text x="390" y="90" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">请求量远超其他实例</text>
      <line x1="180" y1="75" x2="280" y2="75" stroke="var(--d-rv-a-border)" stroke-width="2" />
      <polygon points="276,71 276,79 288,75" fill="var(--d-rv-a-border)" />
      <line x1="130" y1="60" x2="280" y2="60" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <polygon points="276,56 276,64 288,60" fill="var(--d-rv-a-border)" />
      <line x1="160" y1="90" x2="280" y2="90" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <polygon points="276,86 276,94 288,90" fill="var(--d-rv-a-border)" />
      <text x="100" y="78" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">大量请求</text>
      <rect x="60" y="120" width="140" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="130" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">实例 B (正常)</text>
      <rect x="580" y="120" width="140" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="650" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">实例 C (正常)</text>
      <text x="390" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">热点 key 集中在单实例上，导致该实例压力过大甚至崩溃</text>
    </svg>

    <!-- Ch37: Slot 迁移再平衡 -->
    <svg v-else-if="kind === 'skew-slot-rebalance'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="迁移大 Slot 数据到低负载实例" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Slot 数据迁移再平衡</text>
      <rect x="60" y="60" width="200" height="60" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="160" y="86" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">高负载实例</text>
      <text x="160" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">过多 Slot / 数据量大</text>
      <rect x="520" y="60" width="200" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="620" y="86" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">低负载实例</text>
      <text x="620" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">有余量可接收</text>
      <line x1="260" y1="90" x2="520" y2="90" stroke="var(--d-warn-border)" stroke-width="1.8" />
      <polygon points="516,86 516,94 528,90" fill="var(--d-warn-border)" />
      <text x="390" y="82" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">迁移 Slot 数据</text>
      <rect x="100" y="140" width="580" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="157" text-anchor="middle" font-size="10" fill="var(--d-text)">Redis Cluster: CLUSTER SETSLOT + GETKEYSINSLOT + MIGRATE</text>
      <text x="390" y="173" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Codis: codis-admin --slot-action --create --sid=N --gid=M</text>
      <text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">运维发现 Slot 分配不均后，将部分 Slot 迁移到低负载实例以均衡数据</text>
    </svg>

    <!-- Ch37: 热点数据多副本分散读 -->
    <svg v-else-if="kind === 'skew-hotspot-solution'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="热点 key 加随机后缀多副本分散读" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">热点数据多副本分散方案</text>
      <rect x="260" y="50" width="260" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="390" y="75" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">热点 key: product:1001</text>
      <line x1="310" y1="90" x2="140" y2="120" stroke="var(--d-border)" stroke-width="1.4" />
      <line x1="390" y1="90" x2="390" y2="120" stroke="var(--d-border)" stroke-width="1.4" />
      <line x1="470" y1="90" x2="640" y2="120" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="40" y="120" width="180" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="130" y="137" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">13#product:1001</text>
      <text x="130" y="153" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">→ Slot A → 实例 1</text>
      <rect x="300" y="120" width="180" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="390" y="137" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">29#product:1001</text>
      <text x="390" y="153" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">→ Slot B → 实例 2</text>
      <rect x="560" y="120" width="180" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="650" y="137" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">57#product:1001</text>
      <text x="650" y="153" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">→ Slot C → 实例 3</text>
      <rect x="100" y="180" width="580" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="199" text-anchor="middle" font-size="10" fill="var(--d-text)">key 加随机前缀 → 映射到不同 Slot/实例 → 分散读压力</text>
      <text x="390" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">仅适用于只读热点数据；读写热点需增加实例配置来应对</text>
    </svg>

    <!-- Ch38: Gossip 通信开销随规模增长 -->
    <svg v-else-if="kind === 'cluster-gossip-overhead'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="集群规模增大，Gossip 消息量 O(N^2) 增长" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Gossip 通信开销与集群规模</text>
      <rect x="60" y="50" width="300" height="80" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="210" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">每个实例发送 PING 消息数</text>
      <text x="210" y="96" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">= 1 + 10 x (PONG 超时实例数)</text>
      <text x="210" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">每条 PING/PONG 约 12KB (含 N/10 实例信息)</text>
      <rect x="420" y="50" width="300" height="80" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="570" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">1000 实例集群示例</text>
      <text x="570" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">单实例每秒 101 条 PING ≈ 1.2MB/s</text>
      <text x="570" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">30 实例同时触发 → 占用 36MB/s 带宽</text>
      <rect x="100" y="148" width="580" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="164" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">优化手段：调大 cluster-node-timeout（如 20~25s）</text>
      <text x="390" y="180" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">减少 PONG 超时判断频率 → 降低心跳消息量 → 释放集群带宽</text>
      <text x="390" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">建议集群规模控制在 400~500 实例（200~250 主 x 8 万 QPS = 1600~2000 万 QPS）</text>
    </svg>


    <svg v-else-if="kind === 'preface-problem-portrait'" viewBox="0 0 820 280" xmlns="http://www.w3.org/2000/svg" aria-label="Redis 问题画像" role="img">
      <text x="410" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 问题画像（三大主线视角）</text>
      <rect x="20" y="50" width="240" height="190" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="140" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">高性能</text>
      <rect x="40" y="94" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="140" y="113" text-anchor="middle" font-size="11" fill="var(--d-text)">延迟抖动 / 尾延迟</text>
      <rect x="40" y="130" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="140" y="149" text-anchor="middle" font-size="11" fill="var(--d-text)">CPU 绑核 / NUMA 影响</text>
      <rect x="40" y="166" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="140" y="185" text-anchor="middle" font-size="11" fill="var(--d-text)">数据结构复杂度</text>
      <rect x="40" y="202" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="140" y="221" text-anchor="middle" font-size="11" fill="var(--d-text)">异步机制 / 阻塞点</text>
      <rect x="290" y="50" width="240" height="190" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="410" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">高可靠</text>
      <rect x="310" y="94" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="410" y="113" text-anchor="middle" font-size="11" fill="var(--d-text)">AOF / RDB 持久化</text>
      <rect x="310" y="130" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="410" y="149" text-anchor="middle" font-size="11" fill="var(--d-text)">主从复制 / 哨兵切换</text>
      <rect x="310" y="166" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="410" y="185" text-anchor="middle" font-size="11" fill="var(--d-text)">脑裂 / 数据丢失</text>
      <rect x="310" y="202" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="410" y="221" text-anchor="middle" font-size="11" fill="var(--d-text)">缓冲区溢出</text>
      <rect x="560" y="50" width="240" height="190" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="680" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">高可扩展</text>
      <rect x="580" y="94" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="680" y="113" text-anchor="middle" font-size="11" fill="var(--d-text)">数据分片 / Slot 映射</text>
      <rect x="580" y="130" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="680" y="149" text-anchor="middle" font-size="11" fill="var(--d-text)">数据倾斜 / 热点 Key</text>
      <rect x="580" y="166" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="680" y="185" text-anchor="middle" font-size="11" fill="var(--d-text)">集群通信开销</text>
      <rect x="580" y="202" width="200" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="680" y="221" text-anchor="middle" font-size="11" fill="var(--d-text)">Codis / Redis Cluster</text>
      <text x="410" y="268" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">遇到问题时，按问题 → 主线 → 技术点的路径快速定位</text>
    </svg>

    <svg v-else-if="kind === 'preface-course-structure'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="课程结构总览" role="img">
      <text x="390" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">课程结构总览</text>
      <rect x="30" y="60" width="160" height="100" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="110" y="90" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">基础篇</text><text x="110" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">数据结构 · 线程模型</text><text x="110" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">持久化 · 主从 · 集群</text>
      <line x1="194" y1="110" x2="226" y2="110" stroke="var(--d-text-sub)" stroke-width="1.6" />
      <rect x="230" y="60" width="160" height="100" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="310" y="90" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">实践篇</text><text x="310" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">缓存 · 集群方案</text><text x="310" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">场景驱动 · 案例驱动</text>
      <line x1="394" y1="110" x2="426" y2="110" stroke="var(--d-text-sub)" stroke-width="1.6" />
      <rect x="430" y="60" width="160" height="100" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="510" y="90" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">未来篇</text><text x="510" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Redis 6.0 新特性</text><text x="510" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">NVM 持久内存</text>
      <line x1="594" y1="110" x2="626" y2="110" stroke="var(--d-text-sub)" stroke-width="1.6" />
      <rect x="630" y="60" width="120" height="100" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" /><text x="690" y="90" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">加餐</text><text x="690" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">运维工具 · 协议</text><text x="690" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">使用规范 · 案例</text>
      <text x="390" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">按两大维度、三大主线组织，从原理到实战再到前瞻</text>
    </svg>

    <svg v-else-if="kind === 'sentinel-pub-sub'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="哨兵 pub/sub 发现" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">哨兵通过 pub/sub 互相发现</text><rect x="310" y="44" width="160" height="46" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="390" y="72" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">主库（Master）</text><rect x="270" y="104" width="240" height="30" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" /><text x="390" y="124" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">__sentinel__:hello 频道</text><rect x="60" y="152" width="120" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="120" y="177" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">哨兵 1</text><rect x="330" y="152" width="120" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="390" y="177" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">哨兵 2</text><rect x="600" y="152" width="120" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="660" y="177" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">哨兵 3</text><line x1="120" y1="152" x2="300" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" /><line x1="390" y1="152" x2="390" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" /><line x1="660" y1="152" x2="480" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="390" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">每个哨兵在频道中发布自己的 IP:Port，其他哨兵订阅后即可发现并建立连接</text></svg>

    <svg v-else-if="kind === 'sentinel-client-update'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="客户端获取新主库" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">客户端通过哨兵获取新主库信息</text><rect x="290" y="48" width="200" height="42" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="390" y="74" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">哨兵集群</text><rect x="60" y="130" width="160" height="42" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="140" y="156" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">客户端 App</text><rect x="560" y="130" width="160" height="42" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="640" y="156" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">新主库</text><path d="M 220 151 L 290 90" stroke="var(--d-rv-c-border)" stroke-width="1.4" fill="none" /><text x="230" y="110" font-size="9" fill="var(--d-rv-c-text)">SUBSCRIBE</text><path d="M 390 90 L 390 120" stroke="var(--d-warn-border)" stroke-width="1.4" stroke-dasharray="5 3" fill="none" /><text x="404" y="110" font-size="9" fill="var(--d-warn-text)">switch-master</text><path d="M 490 69 L 560 151" stroke="var(--d-blue-border)" stroke-width="1.4" fill="none" /><text x="540" y="110" font-size="9" fill="var(--d-blue-text)">通知新主库地址</text><text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">客户端订阅 +switch-master 频道，主从切换完成后自动获取新主库 IP:Port</text></svg>

    <svg v-else-if="kind === 'sentinel-deployment-tips'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="哨兵部署建议" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">哨兵部署最佳实践</text><rect x="40" y="54" width="200" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="140" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">机器 A</text><rect x="70" y="96" width="140" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="140" y="116" text-anchor="middle" font-size="11" fill="var(--d-text)">Sentinel-1</text><rect x="70" y="134" width="140" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" /><text x="140" y="154" text-anchor="middle" font-size="11" fill="var(--d-text)">Redis Master</text><rect x="290" y="54" width="200" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="390" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">机器 B</text><rect x="320" y="96" width="140" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="390" y="116" text-anchor="middle" font-size="11" fill="var(--d-text)">Sentinel-2</text><rect x="320" y="134" width="140" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="390" y="154" text-anchor="middle" font-size="11" fill="var(--d-text)">Redis Slave-1</text><rect x="540" y="54" width="200" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="640" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">机器 C</text><rect x="570" y="96" width="140" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="640" y="116" text-anchor="middle" font-size="11" fill="var(--d-text)">Sentinel-3</text><rect x="570" y="134" width="140" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="640" y="154" text-anchor="middle" font-size="11" fill="var(--d-text)">Redis Slave-2</text><rect x="180" y="190" width="420" height="24" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" /><text x="390" y="207" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">quorum = N/2 + 1（3 哨兵时 quorum = 2），分布在不同物理机器上</text></svg>

    <svg v-else-if="kind === 'sentinel-network-partition'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="网络分区" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">网络分区：无法达成多数共识</text><rect x="40" y="56" width="300" height="130" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="190" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">分区 A</text><rect x="70" y="96" width="110" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="125" y="119" text-anchor="middle" font-size="11" fill="var(--d-text)">Sentinel-1</text><rect x="200" y="96" width="110" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" /><text x="255" y="119" text-anchor="middle" font-size="11" fill="var(--d-text)">Master</text><text x="190" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">仅 1 票，不满足多数</text><rect x="440" y="56" width="300" height="130" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="590" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">分区 B</text><rect x="470" y="96" width="110" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="525" y="119" text-anchor="middle" font-size="11" fill="var(--d-text)">Sentinel-2</text><rect x="600" y="96" width="110" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="655" y="119" text-anchor="middle" font-size="11" fill="var(--d-text)">Sentinel-3</text><text x="590" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">2 票可达成多数</text><line x1="340" y1="120" x2="440" y2="120" stroke="var(--d-rv-a-border)" stroke-width="2" stroke-dasharray="8 4" /><text x="390" y="112" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">网络断开</text><text x="390" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">只有 2 个哨兵的集群在 1 个挂掉后无法选举 Leader，至少部署 3 个哨兵</text></svg>

    <svg v-else-if="kind === 'sentinel-min-slaves'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="min-slaves 配置" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">min-slaves 配置防止数据丢失</text><rect x="60" y="52" width="280" height="100" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="200" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">配置项</text><text x="200" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">min-slaves-to-write  1</text><text x="200" y="124" text-anchor="middle" font-size="11" fill="var(--d-text)">min-slaves-max-lag  10</text><text x="200" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">（至少 1 个从库、延迟 ≤ 10s）</text><rect x="440" y="52" width="280" height="100" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="580" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">效果</text><text x="580" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">不满足条件 → 主库拒绝写入</text><text x="580" y="124" text-anchor="middle" font-size="11" fill="var(--d-text)">防止脑裂时旧主库接受写入</text><text x="580" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">最多丢失 max-lag 秒的数据</text><line x1="340" y1="102" x2="440" y2="102" stroke="var(--d-text-sub)" stroke-width="1.4" /><text x="390" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">通过限制主库写入条件，将脑裂时的数据丢失控制在可接受范围内</text></svg>

    <svg v-else-if="kind === 'redis6-multithreaded-io'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="Redis 6.0 多 IO 线程" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 6.0 多 IO 线程模型</text><rect x="40" y="52" width="700" height="50" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="390" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">主线程：接收连接 → 分配 Socket → 执行命令（单线程）→ 等待回写完成</text><rect x="40" y="120" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="120" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">IO 线程 1</text><rect x="230" y="120" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="310" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">IO 线程 2</text><rect x="420" y="120" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="500" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">IO 线程 3</text><rect x="610" y="120" width="130" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="675" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">IO 线程 N</text><text x="120" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">并行读取</text><text x="310" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">并行解析</text><text x="500" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">并行回写</text><rect x="140" y="202" width="500" height="26" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" /><text x="390" y="220" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">网络 IO 并行处理，命令执行仍为单线程 → 无需多线程互斥</text></svg>

    <svg v-else-if="kind === 'redis6-io-read-phase'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="IO 线程协作" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">多 IO 线程协作流程</text><rect x="40" y="52" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="120" y="79" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">1. 分配 Socket</text><line x1="200" y1="74" x2="246" y2="74" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="250" y="52" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="330" y="79" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">2. IO 线程并行读</text><line x1="410" y1="74" x2="456" y2="74" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="460" y="52" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="540" y="79" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">3. 主线程执行</text><rect x="40" y="120" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="120" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">4. 写入缓冲区</text><line x1="200" y1="142" x2="246" y2="142" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="250" y="120" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="330" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">5. IO 线程回写</text><line x1="410" y1="142" x2="456" y2="142" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="460" y="120" width="160" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="540" y="147" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">6. 清空队列</text><text x="390" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">主线程在 IO 线程读/写期间阻塞等待，命令执行始终由主线程单线程完成</text></svg>

    <svg v-else-if="kind === 'redis6-acl-users'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="ACL 权限控制" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 6.0 ACL 权限控制</text><rect x="60" y="56" width="140" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="130" y="83" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">用户 A</text><rect x="60" y="120" width="140" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="130" y="147" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">用户 B</text><line x1="200" y1="78" x2="296" y2="78" stroke="var(--d-text-sub)" stroke-width="1.4" /><line x1="200" y1="142" x2="296" y2="142" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="300" y="50" width="200" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="400" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">允许: +@hash -@string</text><text x="400" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">ACL SETUSER 设定</text><rect x="300" y="114" width="200" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="400" y="138" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">允许: +@all</text><text x="400" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">拥有全部权限</text><line x1="500" y1="78" x2="566" y2="78" stroke="var(--d-text-sub)" stroke-width="1.4" /><line x1="500" y1="142" x2="566" y2="142" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="570" y="50" width="170" height="56" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" /><text x="655" y="74" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Key: ~user:*</text><rect x="570" y="114" width="170" height="56" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" /><text x="655" y="138" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Key: ~*</text><text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">以用户为粒度控制可执行的命令类型和可访问的 Key 前缀模式</text></svg>

    <svg v-else-if="kind === 'redis6-client-cache'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="客户端缓存 Tracking" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">客户端缓存：Tracking 失效通知</text><rect x="60" y="56" width="180" height="80" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="150" y="84" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">客户端</text><text x="150" y="104" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">本地缓存 key=user:1</text><text x="150" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">CLIENT TRACKING ON</text><rect x="540" y="56" width="180" height="80" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="630" y="84" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Redis 服务端</text><text x="630" y="104" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">记录客户端读取的 key</text><text x="630" y="120" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">监测 key 修改</text><line x1="240" y1="80" x2="540" y2="80" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="390" y="72" text-anchor="middle" font-size="9" fill="var(--d-blue-text)">GET user:1 → 服务端记录</text><line x1="540" y1="120" x2="240" y2="120" stroke="var(--d-rv-a-border)" stroke-width="1.4" /><text x="390" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">key 修改 → invalidate 消息</text><rect x="100" y="160" width="260" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="230" y="176" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">普通模式</text><text x="230" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">按读取的 key 精确跟踪</text><rect x="420" y="160" width="260" height="40" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" /><text x="550" y="176" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">广播模式（BCAST）</text><text x="550" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">按 key 前缀批量跟踪</text><text x="390" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">key 被修改时，服务端主动推送失效通知，客户端清除本地缓存</text></svg>

    <svg v-else-if="kind === 'future-qa-nvm-vs-dram'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="NVM vs DRAM" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">NVM 与 DRAM 对比</text><rect x="60" y="48" width="660" height="30" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" /><text x="192" y="68" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">指标</text><text x="390" y="68" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">DRAM</text><text x="588" y="68" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">NVM</text><line x1="324" y1="48" x2="324" y2="168" stroke="var(--d-border)" stroke-width="1" /><line x1="456" y1="48" x2="456" y2="168" stroke="var(--d-border)" stroke-width="1" /><rect x="60" y="78" width="660" height="30" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="192" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">速度</text><text x="390" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">纳秒级（最快）</text><text x="588" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">接近 DRAM</text><rect x="60" y="108" width="660" height="30" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="192" y="128" text-anchor="middle" font-size="11" fill="var(--d-text)">容量/成本</text><text x="390" y="128" text-anchor="middle" font-size="11" fill="var(--d-text)">小 / 高</text><text x="588" y="128" text-anchor="middle" font-size="11" fill="var(--d-text)">大 / 低</text><rect x="60" y="138" width="660" height="30" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="192" y="158" text-anchor="middle" font-size="11" fill="var(--d-text)">持久性</text><text x="390" y="158" text-anchor="middle" font-size="11" fill="var(--d-text)">断电丢失</text><text x="588" y="158" text-anchor="middle" font-size="11" fill="var(--d-text)">断电保持</text><text x="390" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">NVM 兼具 DRAM 的速度优势和 SSD 的持久化能力</text></svg>

    <svg v-else-if="kind === 'future-qa-persistence-stack'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="存储层级" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">存储介质层级（速度 ↓ 容量 ↑）</text><rect x="240" y="48" width="300" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="390" y="70" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">DRAM（纳秒级）</text><line x1="390" y1="82" x2="390" y2="98" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="220" y="100" width="340" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="390" y="122" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">NVM / 持久内存</text><line x1="390" y1="134" x2="390" y2="150" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="200" y="152" width="380" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="390" y="174" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">SSD（微秒级）</text><text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">自上而下：速度递减、容量递增、成本递减、持久性递增</text></svg>

    <svg v-else-if="kind === 'extra-source-code-map'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="源码模块" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 源码学习路径</text><rect x="280" y="50" width="220" height="40" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="390" y="75" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Redis 源码</text><line x1="190" y1="90" x2="590" y2="90" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="190" y1="90" x2="190" y2="110" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="390" y1="90" x2="390" y2="110" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="590" y1="90" x2="590" y2="110" stroke="var(--d-text-sub)" stroke-width="1.2" /><rect x="100" y="110" width="180" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="190" y="133" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">数据结构 (t_*.c)</text><rect x="300" y="110" width="180" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="390" y="133" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">网络 (ae.c)</text><rect x="500" y="110" width="180" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="590" y="133" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">持久化 (rdb/aof.c)</text><rect x="100" y="164" width="180" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" /><text x="190" y="187" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">复制 (replication.c)</text><rect x="300" y="164" width="180" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" /><text x="390" y="187" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">集群 (cluster.c)</text><rect x="500" y="164" width="180" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" /><text x="590" y="187" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">哨兵 (sentinel.c)</text><text x="390" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">建议顺序：数据结构 → 网络 → 持久化 → 复制/哨兵 → 集群</text></svg>

    <svg v-else-if="kind === 'extra-learning-roadmap'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="学习路径" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 高效学习路径</text><rect x="40" y="60" width="150" height="90" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="115" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">第一阶段</text><text x="115" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">基础数据类型</text><text x="115" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">扩展类型 · 缓存</text><line x1="194" y1="105" x2="226" y2="105" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="230" y="60" width="150" height="90" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="305" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">第二阶段</text><text x="305" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">高可靠 · 高性能</text><text x="305" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">持久化 · 集群</text><line x1="384" y1="105" x2="416" y2="105" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="420" y="60" width="150" height="90" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="495" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">第三阶段</text><text x="495" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">底层原理 · 源码</text><text x="495" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">定制化开发</text><line x1="574" y1="105" x2="606" y2="105" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="610" y="60" width="130" height="90" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" /><text x="675" y="90" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">持续成长</text><text x="675" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">社区参与</text><text x="675" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">新特性跟踪</text><text x="390" y="198" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先原理后代码，边学习边实践</text></svg>

    <svg v-else-if="kind === 'extra-resp-protocol'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="RESP 编码" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">RESP 2 协议编码格式</text><rect x="30" y="50" width="130" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="95" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">+ 简单字符串</text><text x="95" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">+OK
</text><rect x="180" y="50" width="130" height="60" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="245" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">- 错误</text><text x="245" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">-ERR ...
</text><rect x="330" y="50" width="130" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="395" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">: 整数</text><text x="395" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">:1
</text><rect x="480" y="50" width="130" height="60" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" /><text x="545" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">$ 长字符串</text><text x="545" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
foobar</text><rect x="630" y="50" width="120" height="60" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" /><text x="690" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">* 数组</text><text x="690" y="92" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">*2
...</text><rect x="100" y="134" width="580" height="44" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" /><text x="390" y="154" text-anchor="middle" font-size="11" fill="var(--d-text)">每种类型以不同首字符区分：+ - : $ *，以 
 结尾</text><text x="390" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">RESP 3（Redis 6.0）新增浮点数、布尔值、有序字典等类型</text></svg>

    <svg v-else-if="kind === 'extra-pipeline-batch'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="Pipeline" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Pipeline 批量发送 vs 逐条发送</text><rect x="40" y="50" width="320" height="110" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" /><text x="200" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">无 Pipeline</text><text x="200" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">CMD1 → RTT → CMD2 → RTT</text><text x="200" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">N 条命令 = N 次 RTT</text><text x="200" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">网络延迟成为瓶颈</text><rect x="420" y="50" width="320" height="110" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="580" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">有 Pipeline</text><text x="580" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">CMD1+...+CMDN 一次发送</text><text x="580" y="120" text-anchor="middle" font-size="11" fill="var(--d-text)">N 条命令 = 1 次 RTT</text><text x="580" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">大幅减少网络往返</text><text x="390" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Pipeline 将多条命令打包发送，显著降低网络延迟对吞吐量的影响</text></svg>

    <svg v-else-if="kind === 'extra-info-command'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="INFO 命令" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">INFO 命令监控信息分类</text><rect x="280" y="50" width="220" height="36" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="390" y="73" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">INFO [section]</text><line x1="130" y1="86" x2="650" y2="86" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="130" y1="86" x2="130" y2="106" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="280" y1="86" x2="280" y2="106" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="430" y1="86" x2="430" y2="106" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="580" y1="86" x2="580" y2="106" stroke="var(--d-text-sub)" stroke-width="1.2" /><rect x="60" y="106" width="140" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="130" y="128" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">server</text><rect x="210" y="106" width="140" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="280" y="128" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">clients</text><rect x="360" y="106" width="140" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="430" y="128" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">memory</text><rect x="510" y="106" width="140" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" /><text x="580" y="128" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">stats</text><rect x="135" y="160" width="140" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" /><text x="205" y="182" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">replication</text><rect x="285" y="160" width="140" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" /><text x="355" y="182" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">cpu</text><rect x="435" y="160" width="140" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" /><text x="505" y="182" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">keyspace</text><text x="390" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点关注: stats、memory、cpu；集群下关注 replication</text></svg>

    <svg v-else-if="kind === 'extra-monitoring-dashboard'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="监控指标" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 关键监控指标看板</text><rect x="40" y="52" width="200" height="70" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="140" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">内存</text><text x="140" y="98" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">used_memory / 碎片率</text><rect x="290" y="52" width="200" height="70" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="390" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">连接数</text><text x="390" y="98" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">connected_clients</text><rect x="540" y="52" width="200" height="70" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="640" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">命中率</text><text x="640" y="98" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">keyspace_hits / misses</text><rect x="140" y="142" width="200" height="56" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" /><text x="240" y="166" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">OPS</text><text x="240" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">ops_per_sec</text><rect x="440" y="142" width="200" height="56" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" /><text x="540" y="166" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">延迟</text><text x="540" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">latency / slowlog</text><text x="390" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">配合 Prometheus + Grafana + Redis-exporter 实现可视化监控与告警</text></svg>

    <svg v-else-if="kind === 'extra-key-naming'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="Key 命名" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Key 命名规范</text><rect x="120" y="50" width="540" height="50" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="390" y="72" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)" font-family="monospace">业务名 : 对象名 : ID</text><text x="390" y="90" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">用冒号分隔，层次清晰</text><rect x="80" y="118" width="200" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" /><text x="180" y="141" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)" font-family="monospace">user:profile:1001</text><rect x="300" y="118" width="200" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" /><text x="400" y="141" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)" font-family="monospace">order:detail:5678</text><rect x="520" y="118" width="200" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" /><text x="620" y="141" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)" font-family="monospace">uv:page:1024</text><text x="390" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">控制 key 长度、使用缩写；业务名前缀替代 SELECT 切换数据库</text></svg>

    <svg v-else-if="kind === 'extra-usage-checklist'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="使用规范" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 使用规范 Checklist</text><rect x="40" y="48" width="220" height="170" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" /><text x="150" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">强制</text><text x="150" y="94" text-anchor="middle" font-size="10" fill="var(--d-text)">禁用 KEYS / FLUSHALL</text><text x="150" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">避免 bigkey</text><text x="150" y="130" text-anchor="middle" font-size="10" fill="var(--d-text)">设置过期时间</text><text x="150" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">控制实例容量 2~6GB</text><rect x="280" y="48" width="220" height="170" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="390" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">推荐</text><text x="390" y="94" text-anchor="middle" font-size="10" fill="var(--d-text)">Key 命名规范</text><text x="390" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">高效序列化 (protobuf)</text><text x="390" y="130" text-anchor="middle" font-size="10" fill="var(--d-text)">SCAN 替代全量遍历</text><text x="390" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">整数对象共享池</text><rect x="520" y="48" width="220" height="170" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="630" y="72" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-blue-text)">建议</text><text x="630" y="94" text-anchor="middle" font-size="10" fill="var(--d-text)">只存热数据</text><text x="630" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">不同业务分实例</text><text x="630" y="130" text-anchor="middle" font-size="10" fill="var(--d-text)">慎用 MONITOR</text><text x="630" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">大集合拆分小集合</text><text x="390" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">遵循规范 → 高性能 + 省内存 + 安全稳定</text></svg>

    <svg v-else-if="kind === 'extra-weibo-timeline'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="微博 Timeline" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">微博 Timeline 数据方案</text><rect x="40" y="54" width="200" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="140" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">List</text><text x="140" y="100" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">存储 Timeline 消息 ID</text><text x="140" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">LPUSH / LRANGE 分页</text><text x="140" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">按时间倒序排列</text><line x1="240" y1="114" x2="316" y2="114" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="320" y="54" width="220" height="120" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="430" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Hash</text><text x="430" y="100" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">存储微博详情</text><text x="430" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">field: 作者/内容/时间</text><text x="430" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">key = weibo:detail:{id}</text><line x1="540" y1="114" x2="586" y2="114" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="590" y="54" width="150" height="120" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="665" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">展示层</text><text x="665" y="104" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">渲染 Timeline</text><text x="665" y="122" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">用户信息流</text><text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">List 存 ID 保持时间序 + Hash 存详情支持字段级查询</text><text x="390" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">冷数据通过 RocksDB 落盘，热数据留在 Redis 内存中</text></svg>

    <svg v-else-if="kind === 'extra-weibo-counter'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="微博计数器" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">微博计数器方案（Hash + HINCRBY）</text><rect x="80" y="54" width="260" height="100" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="210" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Hash: weibo:count:{id}</text><rect x="100" y="92" width="70" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="135" y="111" text-anchor="middle" font-size="10" fill="var(--d-text)">转发</text><rect x="180" y="92" width="70" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="215" y="111" text-anchor="middle" font-size="10" fill="var(--d-text)">评论</text><rect x="260" y="92" width="70" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="295" y="111" text-anchor="middle" font-size="10" fill="var(--d-text)">点赞</text><text x="210" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">HINCRBY 原子递增/递减</text><line x1="340" y1="104" x2="426" y2="104" stroke="var(--d-text-sub)" stroke-width="1.4" /><rect x="430" y="54" width="280" height="100" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="570" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">优势</text><text x="570" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">单 key 聚合所有计数</text><text x="570" y="120" text-anchor="middle" font-size="10" fill="var(--d-text)">原子操作无竞争</text><text x="570" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">HGETALL 一次获取全部</text><text x="390" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">利用 Hash 存多维度计数，HINCRBY 保证原子性</text></svg>

    <svg v-else-if="kind === 'midterm-quiz-diagram'" viewBox="0 0 780 180" xmlns="http://www.w3.org/2000/svg" aria-label="期中知识回顾" role="img"><text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">期中知识点回顾框架</text><rect x="40" y="50" width="140" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="110" y="77" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">数据结构</text><rect x="200" y="50" width="140" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" /><text x="270" y="77" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">持久化</text><rect x="360" y="50" width="140" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" /><text x="430" y="77" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">主从 / 哨兵</text><rect x="520" y="50" width="140" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="590" y="77" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">集群 / 分片</text><rect x="120" y="112" width="160" height="40" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" /><text x="200" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">缓存策略</text><rect x="320" y="112" width="140" height="40" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" /><text x="390" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">性能优化</text><rect x="500" y="112" width="160" height="40" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" /><text x="580" y="137" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">内存 / 缓冲区</text><text x="390" y="172" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">查漏补缺，巩固已学知识，为实践篇打好基础</text></svg>

    <svg v-else-if="kind === 'conclusion-knowledge-map'" viewBox="0 0 820 300" xmlns="http://www.w3.org/2000/svg" aria-label="知识全景" role="img"><text x="410" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 课程知识全景总结</text><rect x="310" y="46" width="200" height="40" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.6" /><text x="410" y="71" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">Redis</text><line x1="140" y1="86" x2="680" y2="86" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="140" y1="86" x2="140" y2="108" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="410" y1="86" x2="410" y2="108" stroke="var(--d-text-sub)" stroke-width="1.2" /><line x1="680" y1="86" x2="680" y2="108" stroke="var(--d-text-sub)" stroke-width="1.2" /><rect x="40" y="108" width="200" height="36" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" /><text x="140" y="131" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">高性能主线</text><rect x="310" y="108" width="200" height="36" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" /><text x="410" y="131" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">高可靠主线</text><rect x="580" y="108" width="200" height="36" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" /><text x="680" y="131" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">高可扩展主线</text><rect x="40" y="156" width="90" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="85" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">数据结构</text><rect x="140" y="156" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="190" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">单线程模型</text><rect x="40" y="192" width="90" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="85" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">epoll 网络</text><rect x="140" y="192" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="190" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">异步 / 多IO</text><rect x="40" y="228" width="200" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="140" y="247" text-anchor="middle" font-size="9" fill="var(--d-text)">缓存策略 / 性能优化</text><rect x="310" y="156" width="90" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="355" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">AOF</text><rect x="410" y="156" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="460" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">RDB</text><rect x="310" y="192" width="90" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="355" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">主从复制</text><rect x="410" y="192" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="460" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">哨兵机制</text><rect x="310" y="228" width="200" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="410" y="247" text-anchor="middle" font-size="9" fill="var(--d-text)">脑裂防护 / 缓冲区管理</text><rect x="580" y="156" width="90" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="625" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">数据分片</text><rect x="680" y="156" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="730" y="175" text-anchor="middle" font-size="9" fill="var(--d-text)">Slot 映射</text><rect x="580" y="192" width="90" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="625" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">Codis</text><rect x="680" y="192" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="730" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">Redis Cluster</text><rect x="580" y="228" width="200" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="680" y="247" text-anchor="middle" font-size="9" fill="var(--d-text)">负载均衡 / 数据迁移</text><text x="410" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">从学习 Redis 到向 Redis 学习：专注极致 · 可扩展能力 · 做成一件事</text></svg>


    <!-- ==================== Ch25: consistency-readonly-flow ==================== -->
    <svg v-else-if="kind === 'consistency-readonly-flow'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="只读缓存：增删改都先操作 DB 再删缓存" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">只读缓存的增删改操作流程</text>
      <rect x="40" y="60" width="120" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="100" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-blue-text)">应用 Tomcat</text>
      <text x="100" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Insert/Update/Delete</text>
      <rect x="310" y="60" width="120" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="370" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">数据库 MySQL</text>
      <text x="370" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">增删改数据 X</text>
      <rect x="580" y="60" width="140" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="650" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">Redis 缓存</text>
      <text x="650" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">删除缓存值 X</text>
      <line x1="160" y1="85" x2="305" y2="85" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <polygon points="303,81 303,89 313,85" fill="var(--d-blue-border)" />
      <text x="232" y="78" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">1. 写入 DB</text>
      <line x1="430" y1="85" x2="575" y2="85" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <polygon points="573,81 573,89 583,85" fill="var(--d-rv-c-border)" />
      <text x="502" y="78" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">2. 删除缓存</text>
      <rect x="40" y="140" width="120" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="100" y="163" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">读请求</text>
      <line x1="160" y1="158" x2="575" y2="158" stroke="var(--d-warn-border)" stroke-width="1.4" stroke-dasharray="6 4" />
      <polygon points="573,154 573,162 583,158" fill="var(--d-warn-border)" />
      <text x="370" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">先查缓存 → 缺失则从 DB 加载到缓存</text>
      <text x="390" y="205" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">新增直接写 DB；修改/删除先更新 DB，再删除缓存中的旧值</text>
    </svg>

    <!-- ==================== Ch25: consistency-delete-first-fail ==================== -->
    <svg v-else-if="kind === 'consistency-delete-first-fail'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="先删缓存再更新 DB，DB 更新失败导致旧值" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">先删缓存 → DB 更新失败 → 读到旧值</text>
      <rect x="30" y="50" width="150" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="105" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">1. 删除缓存 X</text>
      <text x="105" y="84" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">成功 ✓</text>
      <rect x="220" y="50" width="170" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="305" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">2. 更新 DB：X=10→3</text>
      <text x="305" y="84" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败 ✗</text>
      <line x1="180" y1="72" x2="215" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="213,68 213,76 223,72" fill="var(--d-border)" />
      <rect x="440" y="50" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="520" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">3. 其他请求读 X</text>
      <text x="520" y="84" text-anchor="middle" font-size="9" fill="var(--d-blue-text)">缓存缺失</text>
      <line x1="390" y1="72" x2="435" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="433,68 433,76 443,72" fill="var(--d-border)" />
      <rect x="640" y="50" width="110" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="695" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">4. 从 DB 读</text>
      <text x="695" y="84" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">X = 10 (旧值)</text>
      <line x1="600" y1="72" x2="635" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="633,68 633,76 643,72" fill="var(--d-border)" />
      <rect x="180" y="120" width="420" height="40" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="390" y="145" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">结果：缓存删了、DB 没改，后续读取全是旧值 10</text>
      <text x="390" y="195" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">DB 更新失败导致缓存和数据库短暂不一致，直到缓存再次被正确填充</text>
    </svg>

    <!-- ==================== Ch25: consistency-update-first-fail ==================== -->
    <svg v-else-if="kind === 'consistency-update-first-fail'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="先更新 DB 再删缓存，删缓存失败导致旧值" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">先更新 DB → 删缓存失败 → 读到旧值</text>
      <rect x="30" y="50" width="170" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="115" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">1. 更新 DB：X=10→3</text>
      <text x="115" y="84" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">成功 ✓</text>
      <rect x="240" y="50" width="150" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="315" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">2. 删除缓存 X</text>
      <text x="315" y="84" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败 ✗</text>
      <line x1="200" y1="72" x2="235" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="233,68 233,76 243,72" fill="var(--d-border)" />
      <rect x="430" y="50" width="160" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="510" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">3. 其他请求读 X</text>
      <text x="510" y="84" text-anchor="middle" font-size="9" fill="var(--d-blue-text)">缓存命中</text>
      <line x1="390" y1="72" x2="425" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="423,68 423,76 433,72" fill="var(--d-border)" />
      <rect x="630" y="50" width="120" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="690" y="68" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">4. 返回旧值</text>
      <text x="690" y="84" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">X = 10 (旧缓存)</text>
      <line x1="590" y1="72" x2="625" y2="72" stroke="var(--d-border)" stroke-width="1.4" />
      <polygon points="623,68 623,76 633,72" fill="var(--d-border)" />
      <rect x="180" y="120" width="420" height="40" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="390" y="145" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">结果：DB 已改为 3，缓存仍是 10，数据不一致</text>
      <text x="390" y="195" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">删缓存失败导致后续请求都命中旧的缓存值，直到缓存过期或被删除</text>
    </svg>

    <!-- ==================== Ch25: consistency-failure-summary ==================== -->
    <svg v-else-if="kind === 'consistency-failure-summary'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="两种顺序操作失败的对比" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">两种操作顺序失败场景对比</text>
      <rect x="30" y="46" width="200" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="130" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">操作顺序</text>
      <rect x="240" y="46" width="200" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="340" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">失败环节</text>
      <rect x="450" y="46" width="300" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="600" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">后果</text>
      <rect x="30" y="84" width="200" height="34" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="106" text-anchor="middle" font-size="10" fill="var(--d-text)">先删缓存，再更新 DB</text>
      <rect x="240" y="84" width="200" height="34" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="106" text-anchor="middle" font-size="10" fill="var(--d-text)">DB 更新失败</text>
      <rect x="450" y="84" width="300" height="34" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="600" y="106" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">缓存缺失 → 读 DB 旧值 → 回填旧缓存</text>
      <rect x="30" y="126" width="200" height="34" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="130" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">先更新 DB，再删缓存</text>
      <rect x="240" y="126" width="200" height="34" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="340" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">删缓存失败</text>
      <rect x="450" y="126" width="300" height="34" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="600" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">缓存命中 → 一直读到旧值</text>
      <text x="390" y="185" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">无论哪种顺序，只要有一步失败都会导致不一致，需要引入重试机制</text>
    </svg>

    <!-- ==================== Ch25: consistency-retry-mq ==================== -->
    <svg v-else-if="kind === 'consistency-retry-mq'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="通过消息队列重试保证一致性" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">消息队列重试机制</text>
      <rect x="30" y="60" width="120" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="90" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">应用</text>
      <text x="90" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">更新数据 X</text>
      <rect x="220" y="60" width="120" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="280" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">数据库</text>
      <text x="280" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">X = 3 ✓</text>
      <rect x="580" y="60" width="140" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="650" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Redis 缓存</text>
      <text x="650" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">删除 X</text>
      <rect x="380" y="140" width="160" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="460" y="162" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">消息队列 (Kafka)</text>
      <text x="460" y="178" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">暂存失败操作</text>
      <line x1="150" y1="85" x2="215" y2="85" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <polygon points="213,81 213,89 223,85" fill="var(--d-blue-border)" />
      <text x="182" y="78" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">1. 更新DB</text>
      <line x1="340" y1="85" x2="575" y2="85" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="573,81 573,89 583,85" fill="var(--d-rv-c-border)" />
      <text x="458" y="78" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">2. 删缓存（失败）</text>
      <text x="500" y="62" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">✗</text>
      <line x1="458" y1="110" x2="458" y2="135" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="454,133 462,133 458,143" fill="var(--d-warn-border)" />
      <text x="490" y="128" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">3. 放入MQ</text>
      <line x1="540" y1="165" x2="650" y2="115" stroke="var(--d-rv-c-border)" stroke-width="1.4" stroke-dasharray="5 3" />
      <polygon points="646,117 654,113 648,121" fill="var(--d-rv-c-border)" />
      <text x="610" y="148" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">4. 重试删除</text>
      <text x="390" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">失败操作暂存到消息队列，消费者重试直到成功，超过次数则报错</text>
    </svg>

    <!-- ==================== Ch25: consistency-concurrent-stale ==================== -->
    <svg v-else-if="kind === 'consistency-concurrent-stale'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="先删缓存再更新 DB 的并发问题" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">先删缓存 → 并发读回填旧值</text>
      <line x1="60" y1="56" x2="720" y2="56" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="50" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">时间轴 →</text>
      <rect x="30" y="70" width="60" height="24" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="60" y="86" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue-text)">线程 A</text>
      <rect x="110" y="70" width="120" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="170" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">1. 删除缓存 X</text>
      <rect x="540" y="70" width="140" height="30" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="610" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">4. 更新 DB: X=3</text>
      <rect x="30" y="120" width="60" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="60" y="136" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">线程 B</text>
      <rect x="260" y="120" width="130" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="325" y="140" text-anchor="middle" font-size="9" fill="var(--d-text)">2. 读 X，缓存缺失</text>
      <rect x="410" y="120" width="120" height="30" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="470" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">3. 读 DB: X=10</text>
      <line x1="470" y1="150" x2="470" y2="175" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <polygon points="466,173 474,173 470,183" fill="var(--d-warn-border)" />
      <rect x="400" y="180" width="140" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="470" y="200" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">回填缓存 X=10（旧值）</text>
      <rect x="140" y="220" width="500" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="239" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">最终：DB=3，缓存=10，数据不一致！解决方案→延迟双删</text>
    </svg>

    <!-- ==================== Ch25: consistency-update-first-race ==================== -->
    <svg v-else-if="kind === 'consistency-update-first-race'" viewBox="0 0 780 260" xmlns="http://www.w3.org/2000/svg" aria-label="先更新 DB 再删缓存的并发问题" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">先更新 DB → 缓存删除前被读到旧值</text>
      <line x1="60" y1="56" x2="720" y2="56" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="50" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">时间轴 →</text>
      <rect x="30" y="70" width="60" height="24" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="60" y="86" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue-text)">线程 A</text>
      <rect x="110" y="70" width="120" height="30" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="170" y="90" text-anchor="middle" font-size="9" fill="var(--d-text)">1. 读缓存 miss</text>
      <rect x="250" y="70" width="120" height="30" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="310" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">2. 读 DB: X=10</text>
      <rect x="590" y="70" width="130" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="655" y="90" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">5. 回填缓存 X=10</text>
      <rect x="30" y="120" width="60" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="60" y="136" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">线程 B</text>
      <rect x="400" y="120" width="130" height="30" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="465" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">3. 更新 DB: X=3</text>
      <rect x="550" y="120" width="120" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="610" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">4. 删除缓存 X</text>
      <rect x="130" y="170" width="520" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="390" y="190" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">A 回填的旧值覆盖了 B 的删除，缓存=10，DB=3，数据不一致</text>
      <text x="390" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">此场景概率较低：读 DB + 回填缓存通常比写 DB + 删缓存快，影响较小</text>
    </svg>

    <!-- ==================== Ch25: consistency-solution-summary ==================== -->
    <svg v-else-if="kind === 'consistency-solution-summary'" viewBox="0 0 820 260" xmlns="http://www.w3.org/2000/svg" aria-label="缓存一致性方案总结" role="img">
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存一致性问题与方案总结</text>
      <rect x="20" y="46" width="160" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="100" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">问题场景</text>
      <rect x="190" y="46" width="240" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="310" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">问题描述</text>
      <rect x="440" y="46" width="360" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="620" y="66" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">解决方案</text>
      <rect x="20" y="84" width="160" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="100" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">操作失败</text>
      <rect x="190" y="84" width="240" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="310" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">删缓存或更新DB失败</text>
      <text x="310" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">导致数据不一致</text>
      <rect x="440" y="84" width="360" height="38" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="620" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">消息队列重试机制</text>
      <rect x="20" y="130" width="160" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="100" y="152" text-anchor="middle" font-size="10" fill="var(--d-text)">先删缓存再更新DB</text>
      <text x="100" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">并发读</text>
      <rect x="190" y="130" width="240" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="310" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">线程B在A更新DB前</text>
      <text x="310" y="163" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读旧值并回填缓存</text>
      <rect x="440" y="130" width="360" height="50" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="620" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">延迟双删</text>
      <text x="620" y="168" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">sleep(N) + 二次删除缓存</text>
      <rect x="20" y="188" width="160" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="100" y="210" text-anchor="middle" font-size="10" fill="var(--d-text)">先更新DB再删缓存</text>
      <text x="100" y="226" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">并发读</text>
      <rect x="190" y="188" width="240" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="310" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">线程B直接读到缓存旧值</text>
      <text x="310" y="221" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">但A很快删除缓存，影响小</text>
      <rect x="440" y="188" width="360" height="50" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="620" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">推荐方案（影响较小）</text>
      <text x="620" y="226" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">必须强一致则加读写锁暂停并发读</text>
    </svg>

    <!-- ==================== Ch26: anomaly-snowfall-expire ==================== -->
    <svg v-else-if="kind === 'anomaly-snowfall-expire'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="缓存雪崩：大量 key 同时过期" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存雪崩：大量 Key 同时过期</text>
      <rect x="50" y="50" width="200" height="60" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="150" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">Redis 缓存</text>
      <text x="150" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">大量 Key 同时到期失效</text>
      <rect x="300" y="50" width="180" height="60" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="390" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">大量请求涌入</text>
      <text x="390" y="96" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">缓存全部 miss</text>
      <rect x="540" y="50" width="200" height="60" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="640" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">数据库</text>
      <text x="640" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">压力激增，可能宕机</text>
      <line x1="250" y1="80" x2="295" y2="80" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="293,76 293,84 303,80" fill="var(--d-warn-border)" />
      <line x1="480" y1="80" x2="535" y2="80" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="533,76 533,84 543,80" fill="var(--d-warn-border)" />
      <rect x="80" y="134" width="280" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="220" y="156" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">方案1：过期时间加随机值，错开失效</text>
      <rect x="400" y="134" width="300" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="550" y="156" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">方案2：服务降级，非核心数据返回预设值</text>
      <text x="390" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">若因 Redis 宕机导致雪崩：服务熔断 / 请求限流 / 搭建高可用集群</text>
    </svg>

    <!-- ==================== Ch26: anomaly-degradation ==================== -->
    <svg v-else-if="kind === 'anomaly-degradation'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="服务降级：非核心数据返回预设值" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">服务降级策略</text>
      <rect x="40" y="56" width="320" height="80" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="200" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">非核心数据（商品属性等）</text>
      <text x="200" y="104" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">缓存缺失 → 直接返回预定义值 / 空值</text>
      <text x="200" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">不查数据库，降低 DB 压力</text>
      <rect x="420" y="56" width="320" height="80" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="580" y="82" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">核心数据（库存等）</text>
      <text x="580" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">缓存缺失 → 仍允许查询数据库</text>
      <text x="580" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">保证关键业务正常运行</text>
      <text x="390" y="170" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">通过区分数据重要性来减少打到数据库的请求量，保护数据库稳定</text>
    </svg>

    <!-- ==================== Ch26: anomaly-circuit-breaker ==================== -->
    <svg v-else-if="kind === 'anomaly-circuit-breaker'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="服务熔断：Redis 宕机时暂停缓存访问" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">服务熔断机制</text>
      <rect x="40" y="60" width="140" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="110" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">业务应用</text>
      <text x="110" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">发起请求</text>
      <rect x="260" y="60" width="160" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="340" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">缓存客户端</text>
      <text x="340" y="98" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">熔断：直接返回错误</text>
      <rect x="520" y="60" width="140" height="50" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" stroke-dasharray="5 3" />
      <text x="590" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text-muted)">Redis (宕机)</text>
      <text x="590" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">不可用 ✗</text>
      <line x1="180" y1="85" x2="255" y2="85" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <polygon points="253,81 253,89 263,85" fill="var(--d-blue-border)" />
      <line x1="420" y1="85" x2="515" y2="85" stroke="var(--d-border)" stroke-width="1.4" stroke-dasharray="5 3" />
      <text x="470" y="78" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">不发送请求</text>
      <line x1="340" y1="110" x2="340" y2="130" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <polygon points="336,128 344,128 340,138" fill="var(--d-warn-border)" />
      <text x="390" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">直接返回，不访问缓存也不访问 DB</text>
      <text x="390" y="180" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">暂停缓存访问，等 Redis 恢复后再恢复服务，避免拖垮数据库</text>
    </svg>

    <!-- ==================== Ch26: anomaly-rate-limiting ==================== -->
    <svg v-else-if="kind === 'anomaly-rate-limiting'" viewBox="0 0 780 200" xmlns="http://www.w3.org/2000/svg" aria-label="请求限流：超阈值拒绝" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">请求限流机制</text>
      <rect x="30" y="56" width="140" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="100" y="78" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">大量请求</text>
      <text x="100" y="98" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">10,000/s</text>
      <rect x="230" y="56" width="160" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="310" y="78" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue-text)">入口限流器</text>
      <text x="310" y="98" text-anchor="middle" font-size="9" fill="var(--d-blue-text)">阈值：1,000/s</text>
      <rect x="460" y="46" width="130" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="525" y="68" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">1,000/s 通过</text>
      <rect x="460" y="88" width="130" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="525" y="110" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">9,000/s 拒绝</text>
      <rect x="640" y="46" width="110" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="695" y="68" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">数据库安全</text>
      <line x1="170" y1="84" x2="225" y2="84" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="223,80 223,88 233,84" fill="var(--d-warn-border)" />
      <line x1="390" y1="63" x2="455" y2="63" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <polygon points="453,59 453,67 463,63" fill="var(--d-rv-c-border)" />
      <line x1="390" y1="105" x2="455" y2="105" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="453,101 453,109 463,105" fill="var(--d-warn-border)" />
      <line x1="590" y1="63" x2="635" y2="63" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <polygon points="633,59 633,67 643,63" fill="var(--d-rv-a-border)" />
      <text x="390" y="155" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">在入口控制请求速率，超过阈值直接拒绝，避免全部压力传到数据库</text>
    </svg>

    <!-- ==================== Ch26: anomaly-breakdown ==================== -->
    <svg v-else-if="kind === 'anomaly-breakdown'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="缓存击穿：热点 key 过期" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存击穿：热点 Key 过期失效</text>
      <rect x="40" y="54" width="180" height="56" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="130" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-c-text)">热点 Key 过期</text>
      <text x="130" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">访问非常频繁的数据</text>
      <rect x="290" y="54" width="200" height="56" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="390" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-warn-text)">大量并发请求</text>
      <text x="390" y="96" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">全部缓存 miss</text>
      <rect x="560" y="54" width="180" height="56" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="650" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-rv-a-text)">数据库</text>
      <text x="650" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">压力激增</text>
      <line x1="220" y1="82" x2="285" y2="82" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="283,78 283,86 293,82" fill="var(--d-warn-border)" />
      <line x1="490" y1="82" x2="555" y2="82" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <polygon points="553,78 553,86 563,82" fill="var(--d-warn-border)" />
      <rect x="200" y="134" width="380" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="390" y="157" text-anchor="middle" font-size="11" fill="var(--d-blue-text)">解决方案：对热点数据不设置过期时间</text>
      <text x="390" y="198" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">与雪崩区别：击穿是单个热点 Key 失效，雪崩是大量 Key 同时失效</text>
    </svg>

    <!-- ==================== Ch26: anomaly-penetration ==================== -->
    <svg v-else-if="kind === 'anomaly-penetration'" viewBox="0 0 780 220" xmlns="http://www.w3.org/2000/svg" aria-label="缓存穿透：查不存在的数据" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存穿透：数据在缓存和 DB 中都不存在</text>
      <rect x="30" y="56" width="130" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="95" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">恶意/误操作</text>
      <text x="95" y="94" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">查询不存在数据</text>
      <rect x="220" y="56" width="150" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="295" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">Redis 缓存</text>
      <text x="295" y="94" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">miss（无数据）</text>
      <rect x="430" y="56" width="150" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="505" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-a-text)">数据库</text>
      <text x="505" y="94" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">也无数据</text>
      <rect x="630" y="56" width="120" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="690" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-warn-text)">无法缓存</text>
      <text x="690" y="94" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">每次都穿透</text>
      <line x1="160" y1="81" x2="215" y2="81" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="213,77 213,85 223,81" fill="var(--d-warn-border)" />
      <line x1="370" y1="81" x2="425" y2="81" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="423,77 423,85 433,81" fill="var(--d-warn-border)" />
      <line x1="580" y1="81" x2="625" y2="81" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <polygon points="623,77 623,85 633,81" fill="var(--d-warn-border)" />
      <rect x="30" y="130" width="230" height="30" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="145" y="150" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">方案1：缓存空值 / 缺省值</text>
      <rect x="280" y="130" width="230" height="30" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="395" y="150" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">方案2：布隆过滤器前置判断</text>
      <rect x="530" y="130" width="220" height="30" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="640" y="150" text-anchor="middle" font-size="10" fill="var(--d-blue-text)">方案3：前端恶意请求检测</text>
      <text x="390" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">穿透比雪崩和击穿更严重：缓存和 DB 同时承压，且无法通过缓存自愈</text>
    </svg>

    <!-- ==================== Ch26: anomaly-bloom-filter ==================== -->
    <svg v-else-if="kind === 'anomaly-bloom-filter'" viewBox="0 0 780 240" xmlns="http://www.w3.org/2000/svg" aria-label="布隆过滤器工作原理" role="img">
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">布隆过滤器（Bloom Filter）工作原理</text>
      <rect x="30" y="54" width="100" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <text x="80" y="79" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-blue-text)">数据 X</text>
      <rect x="180" y="44" width="100" height="26" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="230" y="62" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">哈希函数 H1</text>
      <rect x="180" y="76" width="100" height="26" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="230" y="94" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">哈希函数 H2</text>
      <rect x="180" y="108" width="100" height="26" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="230" y="126" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">哈希函数 H3</text>
      <line x1="130" y1="74" x2="175" y2="57" stroke="var(--d-border)" stroke-width="1.2" />
      <line x1="130" y1="74" x2="175" y2="89" stroke="var(--d-border)" stroke-width="1.2" />
      <line x1="130" y1="74" x2="175" y2="121" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="540" y="46" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Bit 数组（长度 10）</text>
      <g transform="translate(350, 58)">
        <rect x="0" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="17" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="17" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">0</text>
        <rect x="38" y="0" width="34" height="30" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="55" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">1</text><text x="55" y="-4" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">1</text>
        <rect x="76" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="93" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="93" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">2</text>
        <rect x="114" y="0" width="34" height="30" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="131" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">1</text><text x="131" y="-4" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">3</text>
        <rect x="152" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="169" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="169" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">4</text>
        <rect x="190" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="207" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="207" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">5</text>
        <rect x="228" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="245" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="245" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">6</text>
        <rect x="266" y="0" width="34" height="30" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" /><text x="283" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">1</text><text x="283" y="-4" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">7</text>
        <rect x="304" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="321" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="321" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">8</text>
        <rect x="342" y="0" width="34" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="359" y="20" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">0</text><text x="359" y="-4" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">9</text>
      </g>
      <line x1="280" y1="57" x2="388" y2="60" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="280" y1="89" x2="464" y2="72" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="280" y1="121" x2="616" y2="80" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="340" y="118" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">位1</text>
      <text x="378" y="108" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">位3</text>
      <text x="460" y="108" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">位7</text>
      <rect x="80" y="150" width="620" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="390" y="172" text-anchor="middle" font-size="10" fill="var(--d-text)">查询时：计算 3 次哈希，若任一对应位为 0，则数据一定不存在</text>
      <text x="390" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">布隆过滤器前置于 DB 查询，快速拦截不存在的数据请求，避免穿透到数据库</text>
    </svg>

    <!-- ==================== Ch26: anomaly-summary-table ==================== -->
    <svg v-else-if="kind === 'anomaly-summary-table'" viewBox="0 0 820 260" xmlns="http://www.w3.org/2000/svg" aria-label="缓存雪崩、击穿、穿透对比表" role="img">
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存雪崩 / 击穿 / 穿透 对比总结</text>
      <rect x="20" y="44" width="120" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" /><text x="80" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">维度</text>
      <rect x="150" y="44" width="200" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" /><text x="250" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">缓存雪崩</text>
      <rect x="360" y="44" width="200" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" /><text x="460" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">缓存击穿</text>
      <rect x="570" y="44" width="230" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" /><text x="685" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">缓存穿透</text>
      <rect x="20" y="82" width="120" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="80" y="106" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">原因</text>
      <rect x="150" y="82" width="200" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="250" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">大量 Key 同时过期</text><text x="250" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或 Redis 宕机</text>
      <rect x="360" y="82" width="200" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="460" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">热点 Key 过期失效</text>
      <rect x="570" y="82" width="230" height="38" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="685" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">数据在缓存和 DB</text><text x="685" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">中都不存在</text>
      <rect x="20" y="128" width="120" height="34" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="80" y="150" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">影响范围</text>
      <rect x="150" y="128" width="200" height="34" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" /><text x="250" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">大量数据</text>
      <rect x="360" y="128" width="200" height="34" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="460" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">单个热点数据</text>
      <rect x="570" y="128" width="230" height="34" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" /><text x="685" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">缓存和 DB 同时承压</text>
      <rect x="20" y="170" width="120" height="70" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" /><text x="80" y="210" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">解决方案</text>
      <rect x="150" y="170" width="200" height="70" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="250" y="190" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">过期时间加随机数</text><text x="250" y="206" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">服务降级 / 熔断</text><text x="250" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">请求限流 / 高可用集群</text>
      <rect x="360" y="170" width="200" height="70" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="460" y="210" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">热点数据不设过期时间</text>
      <rect x="570" y="170" width="230" height="70" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" /><text x="685" y="190" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">缓存空值 / 缺省值</text><text x="685" y="206" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">布隆过滤器</text><text x="685" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">前端恶意请求检测</text>
    </svg>
  </DiagramFrame>
</template>
