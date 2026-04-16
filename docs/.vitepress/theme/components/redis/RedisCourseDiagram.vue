<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'course-map'
  | 'simplekv-overview'
  | 'io-multiplexing'
  | 'replication-flow'
  | 'sentinel-failover'
  | 'cluster-sharding'
  | 'message-queue-options'
  | 'transaction-semantics'
  | 'split-brain'
  | 'redis6-features'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'course-map': '860px',
  'simplekv-overview': '760px',
  'io-multiplexing': '760px',
  'replication-flow': '780px',
  'sentinel-failover': '780px',
  'cluster-sharding': '820px',
  'message-queue-options': '860px',
  'transaction-semantics': '760px',
  'split-brain': '820px',
  'redis6-features': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'course-map'"
      viewBox="0 0 860 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 核心技术与实战课程地图"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 课程主线：先搭整体架构，再理解性能和缓存治理，最后进入高可用、集群与演进方向</text>

      <rect x="20" y="56" width="156" height="178" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="98" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">基础认知</text>
      <text x="98" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">01 基本架构</text>
      <text x="98" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">02 慢操作</text>
      <text x="98" y="146" text-anchor="middle" font-size="10" fill="var(--d-text)">03 IO 模型</text>
      <text x="98" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先建立“Redis 为什么快、</text>
      <text x="98" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">由哪些模块组成”的总图</text>

      <rect x="186" y="56" width="156" height="178" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="264" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">性能与数据结构</text>
      <text x="264" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">11-21 数据类型、异步、CPU、延迟</text>
      <text x="264" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">慢命令、大 key、缓冲区风险</text>
      <text x="264" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">理解“慢”到底慢在哪，</text>
      <text x="264" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">后续治理才不会只会调参数</text>

      <rect x="352" y="56" width="156" height="178" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="430" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">缓存治理</text>
      <text x="430" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">23-30 旁路缓存、淘汰、异常</text>
      <text x="430" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">一致性、污染、分布式锁</text>
      <text x="430" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">把 Redis 真正放回业务系统里，</text>
      <text x="430" y="192" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">思考穿透、击穿、雪崩和幂等</text>

      <rect x="518" y="56" width="156" height="178" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="596" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">高可用与集群</text>
      <text x="596" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">04-09 持久化、复制、哨兵、切片</text>
      <text x="596" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">31-38 事务、脑裂、Codis、秒杀</text>
      <text x="596" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">核心是“如何在故障和扩容时</text>
      <text x="596" y="192" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">仍然保证服务连续与数据正确”</text>

      <rect x="684" y="56" width="156" height="178" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="762" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">未来与加餐</text>
      <text x="762" y="110" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">39-41 Redis 6.0 与 NVM</text>
      <text x="762" y="128" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">42-48 学习方法、协议、工具、实践</text>
      <text x="762" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">把知识从“会背”推进到</text>
      <text x="762" y="192" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">“会持续学习、会排障、会取舍”</text>

      <line x1="176" y1="146" x2="186" y2="146" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="342" y1="146" x2="352" y2="146" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="508" y1="146" x2="518" y2="146" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="674" y1="146" x2="684" y2="146" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />

      <text x="430" y="262" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">建议读法：基础篇建立心智模型，实践篇连接业务问题，未来篇和加餐篇补协议、工具与演进判断</text>
    </svg>

    <svg
      v-else-if="kind === 'simplekv-overview'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SimpleKV 架构总览图"
      role="img"
    >
      <text x="380" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">理解 Redis 架构的最好入口，不是背命令，而是先把一个最小键值数据库拆成访问、索引、操作、存储四块</text>

      <rect x="26" y="98" width="100" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="76" y="120" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端请求</text>
      <text x="76" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">PUT / GET / DELETE</text>

      <line x1="126" y1="124" x2="214" y2="124" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="214" y="78" width="128" height="92" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="278" y="102" text-anchor="middle" font-size="11" fill="var(--d-text)">访问框架</text>
      <text x="278" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">网络连接</text>
      <text x="278" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">协议解析</text>
      <text x="278" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">请求分发</text>

      <line x1="342" y1="124" x2="432" y2="124" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="432" y="78" width="128" height="92" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="496" y="102" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">索引模块</text>
      <text x="496" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">key 到 value 定位</text>
      <text x="496" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">哈希表或其他结构</text>
      <text x="496" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">先找到，再操作</text>

      <line x1="560" y1="124" x2="646" y2="124" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="646" y="78" width="88" height="92" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="690" y="102" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">存储模块</text>
      <text x="690" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">内存</text>
      <text x="690" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">磁盘</text>
      <text x="690" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">持久化</text>

      <rect x="432" y="186" width="128" height="38" rx="9" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="496" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">操作模块：决定增删改查怎么执行</text>

      <text x="380" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">后面学 IO 模型、持久化、复制、哨兵、集群，其实都是在给这四块不断补“更快、更稳、更能扩”的能力</text>
    </svg>

    <svg
      v-else-if="kind === 'io-multiplexing'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis IO 多路复用图"
      role="img"
    >
      <text x="380" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 快，不是因为“命令执行很多线程一起跑”，而是因为主线程把网络事件、命令执行和内存访问都压到很短的临界路径里</text>

      <rect x="24" y="72" width="122" height="126" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="85" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">多个客户端</text>
      <rect x="42" y="112" width="86" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="85" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">client A</text>
      <rect x="42" y="144" width="86" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="85" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">client B</text>
      <rect x="42" y="176" width="86" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.1" />
      <text x="85" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">client C</text>

      <line x1="146" y1="136" x2="250" y2="136" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />
      <line x1="146" y1="168" x2="250" y2="168" stroke="var(--d-border-dash)" stroke-width="1.4" stroke-dasharray="6 4" />

      <rect x="250" y="56" width="206" height="158" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="353" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">事件循环主线程</text>
      <text x="353" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">select / epoll / kqueue 等待就绪事件</text>
      <text x="353" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">读取 socket</text>
      <text x="353" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解析命令</text>
      <text x="353" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">操作内存数据结构</text>
      <text x="353" y="180" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回写响应</text>

      <rect x="492" y="72" width="108" height="54" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="546" y="94" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">内存访问快</text>
      <text x="546" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">多数命令 O(1)</text>

      <rect x="492" y="142" width="108" height="54" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="546" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">少线程切换</text>
      <text x="546" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">少锁竞争</text>

      <line x1="456" y1="98" x2="492" y2="98" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="456" y1="168" x2="492" y2="168" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="626" y="88" width="108" height="92" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="680" y="110" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">后台线程</text>
      <text x="680" y="128" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">AOF fsync</text>
      <text x="680" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">惰性删除</text>
      <text x="680" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">大对象释放</text>

      <text x="380" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正拖慢 Redis 的，往往不是“单线程”三个字，而是慢命令、大 key、阻塞 I/O、频繁过期和缓冲区膨胀这些把主线程卡住的因素</text>
    </svg>

    <svg
      v-else-if="kind === 'replication-flow'"
      viewBox="0 0 780 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 主从复制流程图"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">复制的关键不是“把数据拷一份”这么简单，而是区分第一次全量同步和断线后的增量补数据</text>

      <rect x="46" y="88" width="150" height="108" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="121" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">主库</text>
      <text x="121" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">处理写请求</text>
      <text x="121" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">维护 repl backlog</text>
      <text x="121" y="172" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">生成 RDB / 发送命令流</text>

      <line x1="196" y1="122" x2="332" y2="122" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <rect x="332" y="82" width="122" height="46" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="393" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">PSYNC 命中 backlog</text>
      <text x="393" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">走部分重同步</text>

      <line x1="196" y1="164" x2="332" y2="164" stroke="var(--d-border-dash)" stroke-width="1.5" stroke-dasharray="6 4" />
      <rect x="332" y="144" width="122" height="62" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="393" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">backlog 不够</text>
      <text x="393" y="184" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">触发全量同步</text>
      <text x="393" y="200" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">RDB + 增量命令</text>

      <line x1="454" y1="104" x2="604" y2="104" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <line x1="454" y1="176" x2="604" y2="176" stroke="var(--d-warn-border)" stroke-width="1.5" />

      <rect x="604" y="72" width="138" height="168" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="673" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">从库</text>
      <text x="673" y="124" text-anchor="middle" font-size="10" fill="var(--d-text)">接收 offset 信息</text>
      <text x="673" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">加载 RDB</text>
      <text x="673" y="160" text-anchor="middle" font-size="10" fill="var(--d-text)">回放增量命令</text>
      <text x="673" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">持续追主库进度</text>
      <text x="673" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">网络抖动时，能不能部分同步</text>
      <text x="673" y="226" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">取决于 backlog 是否还保留了缺口</text>

      <text x="390" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以配置复制积压缓冲区，本质上是在给“短暂断线后快速追平”留空间；空间过小，就会更容易退化成昂贵的全量复制</text>
    </svg>

    <svg
      v-else-if="kind === 'sentinel-failover'"
      viewBox="0 0 780 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis Sentinel 故障转移图"
      role="img"
    >
      <text x="390" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">哨兵不是数据节点，而是一个“判断主库是否真的挂了，并协调选新主”的控制平面</text>

      <rect x="306" y="78" width="168" height="72" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="390" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">原主库</text>
      <text x="390" y="122" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">主观下线 SDOWN</text>
      <text x="390" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">客观下线 ODOWN 需多数票</text>

      <rect x="120" y="194" width="148" height="58" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="194" y="218" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">从库 A</text>
      <text x="194" y="236" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">复制偏移更靠前</text>

      <rect x="316" y="194" width="148" height="58" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="390" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">从库 B</text>
      <text x="390" y="236" text-anchor="middle" font-size="9" fill="var(--d-text)">作为候选</text>

      <rect x="512" y="194" width="148" height="58" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="586" y="218" text-anchor="middle" font-size="11" fill="var(--d-text)">从库 C</text>
      <text x="586" y="236" text-anchor="middle" font-size="9" fill="var(--d-text)">作为候选</text>

      <line x1="390" y1="150" x2="194" y2="194" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="390" y1="150" x2="390" y2="194" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="390" y1="150" x2="586" y2="194" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="64" y="66" width="112" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="120" y="88" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Sentinel 1</text>
      <text x="120" y="106" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">投票</text>

      <rect x="64" y="136" width="112" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="120" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Sentinel 2</text>
      <text x="120" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">投票</text>

      <rect x="604" y="102" width="112" height="74" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="660" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Leader Sentinel</text>
      <text x="660" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">选出新主</text>
      <text x="660" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">通知其余节点</text>

      <line x1="176" y1="92" x2="306" y2="100" stroke="var(--d-border-dash)" stroke-width="1.3" stroke-dasharray="6 4" />
      <line x1="176" y1="162" x2="306" y2="128" stroke="var(--d-border-dash)" stroke-width="1.3" stroke-dasharray="6 4" />
      <line x1="474" y1="114" x2="604" y2="136" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="604" y1="176" x2="250" y2="206" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <text x="390" y="276" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">故障转移成功的关键是：哨兵本身要部署成多数派，从库优先级和复制进度要合理，否则“会切换”不等于“切得对、切得快”</text>
    </svg>

    <svg
      v-else-if="kind === 'cluster-sharding'"
      viewBox="0 0 820 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis Cluster 切片与槽位图"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Cluster 的核心不是“多台机器”本身，而是 16384 个 hash slot 把路由和迁移统一成了一个可管理的抽象</text>

      <rect x="28" y="104" width="110" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.3" />
      <text x="83" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端</text>
      <text x="83" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">key -> CRC16</text>

      <line x1="138" y1="130" x2="266" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="266" y="78" width="166" height="104" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="349" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">16384 个槽位</text>
      <text x="349" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">slot 0-5460 -> Node A</text>
      <text x="349" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">slot 5461-10922 -> Node B</text>
      <text x="349" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">slot 10923-16383 -> Node C</text>

      <rect x="492" y="56" width="110" height="72" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.3" />
      <text x="547" y="80" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Node A</text>
      <text x="547" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">0-5460</text>
      <text x="547" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">主分片</text>

      <rect x="632" y="56" width="110" height="72" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="687" y="80" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Node B</text>
      <text x="687" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">5461-10922</text>
      <text x="687" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">主分片</text>

      <rect x="562" y="156" width="110" height="72" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="617" y="180" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">Node C</text>
      <text x="617" y="198" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">10923-16383</text>
      <text x="617" y="214" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">主分片</text>

      <line x1="432" y1="104" x2="492" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="432" y1="130" x2="632" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="432" y1="156" x2="562" y2="192" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="96" y="214" width="244" height="42" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="218" y="238" text-anchor="middle" font-size="9" fill="var(--d-text)">hash tag 允许把相关 key 固定到同一 slot，事务和 Lua 才有跨 key 的落点</text>

      <rect x="492" y="238" width="250" height="28" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="617" y="256" text-anchor="middle" font-size="9" fill="var(--d-text)">扩容时迁移的是“槽位范围”，不是暴力全量重分布所有 key</text>

      <text x="410" y="278" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这也是为什么 Redis Cluster 的思考重点总会回到路由、槽位迁移、跨槽限制和通信开销，而不只是“机器够不够多”</text>
    </svg>

    <svg
      v-else-if="kind === 'message-queue-options'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 消息队列方案对比图"
      role="img"
    >
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 能做消息队列，但重点不是“能不能发消息”，而是要先选清楚你需要的是简单排队、实时广播，还是可追溯消费</text>

      <rect x="24" y="58" width="250" height="194" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="149" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">List</text>
      <text x="149" y="110" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">LPUSH / BRPOP</text>
      <text x="149" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：简单、实现成本低</text>
      <text x="149" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">问题：消费确认与重试要自己补</text>
      <text x="149" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：轻量异步削峰</text>
      <rect x="70" y="194" width="158" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="149" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">如果你只需要“把任务先排起来”，它就够用</text>

      <rect x="304" y="58" width="250" height="194" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="429" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">Pub/Sub</text>
      <text x="429" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">PUBLISH / SUBSCRIBE</text>
      <text x="429" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：实时广播，延迟低</text>
      <text x="429" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">问题：离线消费者收不到旧消息</text>
      <text x="429" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">适合：在线通知、事件广播</text>
      <rect x="350" y="194" width="158" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="429" y="216" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">它不像传统 MQ 那样天然保存消费位点</text>

      <rect x="584" y="58" width="250" height="194" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="709" y="84" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Stream</text>
      <text x="709" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">XADD / XREADGROUP</text>
      <text x="709" y="130" text-anchor="middle" font-size="10" fill="var(--d-text)">优点：消费组、待确认列表、可回溯</text>
      <text x="709" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">问题：复杂度更高，运维也更重</text>
      <text x="709" y="166" text-anchor="middle" font-size="10" fill="var(--d-text)">适合：需要确认、重试、追消费进度</text>
      <rect x="630" y="194" width="158" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="709" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">更接近 MQ，但要接受 Redis 不是专业消息平台</text>

      <text x="430" y="282" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以第 15 讲真正要建立的判断是：Redis 可以解决一部分消息场景，但一旦需要强投递语义和大规模积压治理，就要考虑专门消息队列</text>
    </svg>

    <svg
      v-else-if="kind === 'transaction-semantics'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 事务语义图"
      role="img"
    >
      <text x="380" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 事务更像“把一组命令排队后连续执行”，而不是关系型数据库那种带回滚日志的 ACID 事务</text>

      <rect x="44" y="90" width="148" height="102" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="118" y="114" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">MULTI</text>
      <text x="118" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">命令先入队</text>
      <text x="118" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">还没真正执行</text>
      <text x="118" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">返回 QUEUED</text>

      <line x1="192" y1="142" x2="306" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="306" y="66" width="148" height="150" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="380" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">EXEC</text>
      <text x="380" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">按顺序连续执行队列</text>
      <text x="380" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">中间不会插入其他客户端命令</text>
      <text x="380" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">单条命令失败不会自动回滚前面结果</text>
      <text x="380" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">原子性主要来自单线程串行执行</text>

      <line x1="454" y1="142" x2="574" y2="142" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="574" y="82" width="142" height="60" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="645" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">WATCH</text>
      <text x="645" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">乐观锁，key 被改就放弃 EXEC</text>

      <rect x="574" y="156" width="142" height="60" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="645" y="180" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">没有 rollback</text>
      <text x="645" y="198" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">和数据库事务语义不同</text>

      <text x="380" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以问“Redis 能不能 ACID”时，最稳的回答是：隔离性和原子性部分具备，但持久性、一致性和回滚能力都不能直接按关系型数据库来理解</text>
    </svg>

    <svg
      v-else-if="kind === 'split-brain'"
      viewBox="0 0 820 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 脑裂图"
      role="img"
    >
      <text x="410" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">脑裂最危险的地方，不是“选主过程看起来混乱”，而是旧主在隔离期间可能还在接收写入，恢复后这些写入会被新主数据覆盖掉</text>

      <rect x="82" y="78" width="208" height="92" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="186" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">网络分区 A</text>
      <text x="186" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">旧主库仍对少量客户端可见</text>
      <text x="186" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">继续接收写请求</text>

      <rect x="530" y="78" width="208" height="118" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="634" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">网络分区 B</text>
      <text x="634" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">哨兵多数派在这里</text>
      <text x="634" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">把从库提升成新主</text>
      <text x="634" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">客户端切到新主继续写</text>

      <line x1="290" y1="124" x2="530" y2="124" stroke="var(--d-border-dash)" stroke-width="1.5" stroke-dasharray="8 6" />
      <text x="410" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">网络隔离</text>

      <rect x="118" y="208" width="136" height="54" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <text x="186" y="230" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">旧主恢复连通后</text>
      <text x="186" y="248" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">会被降为从库并覆盖数据</text>

      <rect x="530" y="220" width="208" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.3" />
      <text x="634" y="246" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">新主上的数据成为最终权威，旧主隔离期写入丢失</text>

      <line x1="186" y1="170" x2="186" y2="208" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <line x1="634" y1="196" x2="634" y2="220" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <text x="410" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">应对脑裂要靠降低旧主继续写入的窗口，比如 `min-replicas-to-write` 一类保护，以及合理的超时、部署拓扑和客户端故障切换策略</text>
    </svg>

    <svg
      v-else-if="kind === 'redis6-features'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 6.0 特性图"
      role="img"
    >
      <text x="380" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 6.0 不是“突然全面多线程”了，而是在保持核心执行模型稳定的同时，给网络 IO、缓存一致性和安全治理补了几块关键能力</text>

      <rect x="28" y="64" width="214" height="166" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="135" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">I/O 线程</text>
      <text x="135" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">把读写 socket 的部分工作并行化</text>
      <text x="135" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">减少网络收发成为瓶颈的概率</text>
      <text x="135" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">命令执行主路径仍主要由主线程串行处理</text>

      <rect x="272" y="64" width="214" height="166" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="379" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">客户端缓存</text>
      <text x="379" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">server 记录 key 与客户端关系</text>
      <text x="379" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">数据变更时发失效通知</text>
      <text x="379" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">适合热点只读数据进一步降 RTT</text>

      <rect x="516" y="64" width="214" height="166" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="623" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">ACL 安全模型</text>
      <text x="623" y="118" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">按用户、命令、key 模式授权</text>
      <text x="623" y="136" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不再只是一个全局密码</text>
      <text x="623" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">更适合多租户和精细化权限控制</text>

      <text x="380" y="262" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以读 Redis 6.0 时，别把关注点全压在“是不是多线程”上，更值得记住的是它如何在不推翻原模型的前提下，补出吞吐、一致性和安全这三条能力线</text>
    </svg>
  </DiagramFrame>
</template>
