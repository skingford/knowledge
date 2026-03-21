<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'dbsql-lifecycle'
  | 'prepared-statement'
  | 'sql-pool-stats'
  | 'pgx-driver-flow'
  | 'redis-client-types'
  | 'redis-pipeline'
  | 'redis-distributed-lock'
  | 'redis-watch-tx'
  | 'redis-pubsub'
  | 'cache-penetration'
  | 'cache-breakdown'
  | 'cache-avalanche'
  | 'cache-aside'
  | 'double-delete'
  | 'mq-invalidation'
  | 'sharding-route'
  | 'snowflake-id'
  | 'cross-shard-query'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'dbsql-lifecycle': '760px',
  'prepared-statement': '760px',
  'sql-pool-stats': '760px',
  'pgx-driver-flow': '760px',
  'redis-client-types': '760px',
  'redis-pipeline': '760px',
  'redis-distributed-lock': '760px',
  'redis-watch-tx': '760px',
  'redis-pubsub': '760px',
  'cache-penetration': '760px',
  'cache-breakdown': '760px',
  'cache-avalanche': '760px',
  'cache-aside': '760px',
  'double-delete': '760px',
  'mq-invalidation': '760px',
  'sharding-route': '760px',
  'snowflake-id': '760px',
  'cross-shard-query': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="数据库与缓存专题概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">数据库与缓存主线：先把 Go 对数据库和 Redis 的连接模型搞清，再处理缓存异常、一致性和分片复杂度</text>

      <rect x="22" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="136" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">database/sql</text>
      <text x="136" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Open / Ping / Query / Scan</text>
      <text x="136" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">Rows.Close</text>
      <text x="136" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Prepare / Stats / pool 参数</text>
      <text x="136" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是连接生命周期和资源释放</text>

      <rect x="266" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Redis 与缓存异常</text>
      <text x="380" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">go-redis client / pool</text>
      <text x="380" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">Pipeline / PubSub</text>
      <text x="380" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">穿透 / 击穿 / 雪崩</text>
      <text x="380" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是减少 RTT、避免缓存失效时把 DB 打爆</text>

      <rect x="510" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="624" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">一致性与分片</text>
      <text x="624" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Cache Aside / 双删 / CDC</text>
      <text x="624" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">分片路由</text>
      <text x="624" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Snowflake / 跨分片查询</text>
      <text x="624" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是控制复杂度，不轻易走到自研分库分表</text>
    </svg>

    <svg
      v-else-if="kind === 'dbsql-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="database/sql 生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`sql.DB` 不是单连接，而是连接池入口；真正危险的是 Rows 持有连接却忘记 Close</text>

      <rect x="28" y="98" width="92" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="74" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">sql.Open</text>
      <text x="74" y="134" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">只建池，不建连</text>

      <line x1="120" y1="122" x2="214" y2="122" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="214" y="74" width="152" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="290" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">sql.DB pool</text>
      <text x="290" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Ping 真正建连</text>
      <text x="290" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Query / Exec 时借连接</text>
      <text x="290" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">用完要归还到池</text>

      <line x1="366" y1="122" x2="452" y2="122" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="452" y="82" width="112" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="508" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Exec / QueryRow</text>
      <rect x="452" y="122" width="112" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="508" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Query -> Rows</text>

      <rect x="602" y="74" width="126" height="88" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="665" y="96" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Rows.Close()</text>
      <text x="665" y="114" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不调就不归还连接</text>
      <text x="665" y="130" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">连接池会被耗尽</text>
      <text x="665" y="146" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">rows.Err() 收尾检查</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`QueryRow` 会在 Scan 时隐式消费并释放；`Query` 返回的 Rows 生命周期由你负责，错误路径也必须 Close</text>
    </svg>

    <svg
      v-else-if="kind === 'prepared-statement'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Prepared Statement 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Prepare 的价值在于“同一条 SQL 反复执行时少解析、少拼接”，不是所有查询都该先 Prepare 一遍</text>

      <rect x="38" y="88" width="118" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">db.Prepare</text>
      <text x="97" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">SQL 模板</text>

      <line x1="156" y1="110" x2="248" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="72" width="152" height="76" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="324" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">Stmt</text>
      <text x="324" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">预编译后的语句句柄</text>
      <text x="324" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">defer stmt.Close()</text>

      <line x1="400" y1="110" x2="494" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="400" y1="110" x2="494" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="494" y="72" width="108" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="548" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Exec(name1, email1)</text>
      <rect x="494" y="114" width="108" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="548" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Exec(name2, email2)</text>

      <rect x="630" y="72" width="96" height="76" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="678" y="94" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适合</text>
      <text x="678" y="112" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">批量重复执行</text>
      <text x="678" y="128" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">单次查询没必要</text>

      <text x="380" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">参数化查询本身就能防注入；Prepare 主要解决复用成本，而不是安全性本身</text>
    </svg>

    <svg
      v-else-if="kind === 'sql-pool-stats'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="database/sql 连接池指标图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">看 `db.Stats()` 时，核心是判断：连接是不是用满了、有没有排队、以及旧连接是不是被频繁回收</text>

      <rect x="34" y="82" width="168" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="118" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">pool 配置</text>
      <text x="118" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MaxOpenConns = 100</text>
      <text x="118" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MaxIdleConns = 25</text>
      <text x="118" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ConnMaxLifetime / IdleTime</text>
      <text x="118" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">决定池的容量与老化策略</text>

      <line x1="202" y1="136" x2="308" y2="136" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="308" y="72" width="152" height="128" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="384" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Stats()</text>
      <text x="384" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Open / InUse / Idle</text>
      <text x="384" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">WaitCount / WaitDuration</text>
      <text x="384" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">MaxIdleClosed</text>
      <text x="384" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">MaxLifetimeClosed</text>
      <text x="384" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">用来判断瓶颈点</text>

      <line x1="460" y1="136" x2="572" y2="110" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="460" y1="136" x2="572" y2="162" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="572" y="82" width="156" height="52" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="650" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">WaitCount 持续增长</text>
      <text x="650" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">说明请求在排队等连接</text>
      <rect x="572" y="144" width="156" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="650" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">InUse 高位不降</text>
      <text x="650" y="182" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">说明慢查询或连接没释放</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`ConnMaxLifetime` 不设通常迟早踩到数据库端断开老连接的问题；设得过短又会造成频繁重建，需结合服务端超时一起看</text>
    </svg>

    <svg
      v-else-if="kind === 'pgx-driver-flow'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="pgx 驱动与连接池能力图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`pgx` 的优势不是“又一个 SQL 客户端”，而是在 PostgreSQL 原生协议上把连接池、批量写入、COPY 和通知机制直接暴露出来</text>

      <rect x="26" y="94" width="126" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="116" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">业务代码</text>
      <text x="89" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Query / Exec / Tx</text>

      <line x1="152" y1="124" x2="266" y2="124" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="266" y="58" width="186" height="132" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="359" y="80" text-anchor="middle" font-size="11" fill="var(--d-text)">pgxpool / pgx.Conn</text>
      <text x="359" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Acquire -> 查询/事务 -> Release</text>
      <text x="359" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">AfterConnect 初始化 session</text>
      <text x="359" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">HealthCheck / Lifetime / IdleTime 管池</text>
      <text x="359" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">类型系统直接贴近 PostgreSQL</text>
      <text x="359" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不是经 `database/sql` 再包一层</text>

      <line x1="452" y1="124" x2="560" y2="84" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="452" y1="124" x2="560" y2="124" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="452" y1="124" x2="560" y2="164" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="560" y="64" width="172" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="646" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Batch：多条语句排队，1 次网络往返</text>

      <rect x="560" y="106" width="172" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="646" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">CopyFrom：走 COPY 协议，批量导入比循环 INSERT 更快</text>

      <rect x="560" y="148" width="172" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="646" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">LISTEN / NOTIFY：要专用连接，别混进通用连接池</text>

      <text x="380" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以读 `pgx` 时先把“池、批量、COPY、通知”当成四条主能力线；它们都建立在同一套 PostgreSQL 原生连接语义上</text>
    </svg>

    <svg
      v-else-if="kind === 'redis-client-types'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="go-redis 与常见数据结构图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`go-redis` 的关键心智模型是：一个并发安全客户端 + 内部连接池 + 不同数据结构对应不同业务模式</text>

      <rect x="24" y="94" width="146" height="82" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="116" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">redis.Client</text>
      <text x="97" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">PoolSize / MinIdleConns</text>
      <text x="97" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Dial / Read / Write timeout</text>
      <text x="97" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Ping 验证连接</text>

      <line x1="170" y1="135" x2="274" y2="135" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="274" y="72" width="164" height="126" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="356" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">Redis server</text>
      <text x="356" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GET / SET</text>
      <text x="356" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">HGETALL / HSET</text>
      <text x="356" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ZADD / ZREVRANGE</text>
      <text x="356" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不同命令就是不同数据模型</text>
      <text x="356" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`redis.Nil` = key 不存在，不是系统异常</text>

      <line x1="438" y1="135" x2="532" y2="102" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="438" y1="135" x2="532" y2="135" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="438" y1="135" x2="532" y2="168" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="532" y="82" width="180" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="622" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">String：简单 KV / 计数 / 缓存 JSON</text>
      <rect x="532" y="118" width="180" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="622" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Hash：对象字段集合</text>
      <rect x="532" y="154" width="180" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="622" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">ZSet：排行榜 / 延迟队列索引</text>

      <text x="380" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">连接池大小要看并发和命令耗时；不是盲目越大越好。`redis.Nil` 和超时、网络错误要分开处理</text>
    </svg>

    <svg
      v-else-if="kind === 'redis-pipeline'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis Pipeline 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Pipeline 的收益不是服务器更快，而是把多次命令压成一次网络往返</text>

      <rect x="36" y="86" width="122" height="54" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">批量 GET user:1</text>
      <text x="97" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">GET user:2 ...</text>

      <line x1="158" y1="113" x2="258" y2="113" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="74" width="152" height="78" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="334" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">pipe := rdb.Pipeline()</text>
      <text x="334" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先把命令都排进去</text>
      <text x="334" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最后一次 Exec(ctx)</text>

      <line x1="410" y1="113" x2="506" y2="113" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="506" y="74" width="92" height="78" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="552" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">1 次 RTT</text>
      <text x="552" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">命令批量过去</text>
      <text x="552" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">结果批量回来</text>

      <rect x="628" y="74" width="96" height="78" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="676" y="96" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">没有 Pipeline</text>
      <text x="676" y="114" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">N 条命令</text>
      <text x="676" y="130" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">N 次往返</text>

      <text x="380" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">适合批量读写；执行错误要在每个 cmd.Result() 上分别检查。它不是事务，除非显式用 TxPipeline</text>
    </svg>

    <svg
      v-else-if="kind === 'redis-pubsub'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis PubSub 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Pub/Sub 是“在线广播”模型：发布时谁在线谁收到，不负责离线补偿和持久化</text>

      <rect x="44" y="88" width="122" height="46" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="105" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">publisher</text>
      <text x="105" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Publish(notifications)</text>

      <line x1="166" y1="111" x2="284" y2="111" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="284" y="72" width="180" height="78" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="374" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">channel: notifications</text>
      <text x="374" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消息不会长期存着等你上线</text>
      <text x="374" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">订阅者在线时收到</text>

      <line x1="464" y1="111" x2="572" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="464" y1="111" x2="572" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="572" y="72" width="144" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="644" y="94" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">subscriber A</text>
      <rect x="572" y="114" width="144" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="644" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">subscriber B</text>

      <text x="380" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">需要持久消费、重试、确认时，更适合 Stream / MQ；Pub/Sub 适合在线通知、广播事件、低可靠性实时消息</text>
    </svg>

    <svg
      v-else-if="kind === 'redis-distributed-lock'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis 分布式锁图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Redis 分布式锁最关键的不是“能不能加锁”，而是“释放时不能删掉别人后来拿到的新锁”</text>

      <rect x="28" y="88" width="126" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="91" y="109" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">client A</text>
      <text x="91" y="125" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">SET key val NX PX ttl</text>

      <line x1="154" y1="113" x2="260" y2="113" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="260" y="70" width="174" height="86" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="347" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">Redis key: lock:order</text>
      <text x="347" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">value = uuid-A</text>
      <text x="347" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ttl 倒计时保护死锁</text>
      <text x="347" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只有 key 不存在才成功</text>

      <line x1="434" y1="113" x2="528" y2="113" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="528" y="78" width="198" height="70" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="627" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">临界区业务</text>
      <text x="627" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">持锁期间处理订单 / 扣库存</text>
      <text x="627" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">超时要靠 TTL 自动释放</text>

      <rect x="76" y="184" width="252" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="202" y="204" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">正确解锁：Lua = `if GET == value then DEL end`</text>

      <rect x="392" y="176" width="304" height="48" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="544" y="196" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">错误做法：业务超时后直接 DEL</text>
      <text x="544" y="212" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">A 的锁过期后 B 已重拿锁，A 再删会把 B 的锁误删掉</text>
    </svg>

    <svg
      v-else-if="kind === 'redis-watch-tx'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Redis Watch 与 TxPipeline 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`Watch + TxPipeline` 是乐观锁：先读当前值，再在 `MULTI/EXEC` 提交；若监视 key 被别人改过，`EXEC` 直接失败并重试</text>

      <rect x="34" y="98" width="110" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">GET stock:123</text>
      <text x="89" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">当前库存 = 10</text>

      <line x1="144" y1="120" x2="252" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="252" y="72" width="188" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="346" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">WATCH stock:123</text>
      <text x="346" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">业务逻辑检查库存是否足够</text>
      <text x="346" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">TxPipeline 中准备 DecrBy</text>
      <text x="346" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等待 EXEC 提交</text>

      <line x1="440" y1="120" x2="548" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="440" y1="120" x2="548" y2="148" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="548" y="72" width="166" height="42" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="631" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">没人改动 key -> EXEC 成功</text>
      <rect x="548" y="128" width="166" height="42" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="631" y="146" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">别人先改了 key -> TxFailedErr</text>
      <text x="631" y="162" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">回到起点重读再试</text>

      <rect x="222" y="196" width="316" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="215" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">它不是阻塞其他客户端，而是用冲突检测换重试成本，适合库存扣减这类短事务</text>
    </svg>

    <svg
      v-else-if="kind === 'cache-penetration'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="缓存穿透图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存穿透是“查根本不存在的数据”，所以关键是尽早在缓存层或入口层拦掉无效 key</text>

      <rect x="34" y="104" width="94" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="81" y="129" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">bad key</text>

      <line x1="128" y1="125" x2="218" y2="96" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="128" y1="125" x2="218" y2="154" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="218" y="74" width="148" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="292" y="94" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">布隆过滤器</text>
      <text x="292" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">判定一定不存在 -> 直接返回</text>

      <rect x="218" y="132" width="148" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="292" y="152" text-anchor="middle" font-size="10" fill="var(--d-text)">缓存空值</text>
      <text x="292" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DB 查无此人后写入短 TTL 空结果</text>

      <line x1="366" y1="154" x2="472" y2="154" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="472" y="132" width="116" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="530" y="152" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">没有防护时</text>
      <text x="530" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">每次都打 DB</text>

      <rect x="622" y="132" width="104" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="674" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">DB 被拖垮</text>
      <text x="674" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">缓存失去价值</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">空值缓存简单直接但占内存；布隆过滤器能挡住大部分无效流量，但会有少量“误判为可能存在”的假阳性</text>
    </svg>

    <svg
      v-else-if="kind === 'cache-breakdown'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="缓存击穿图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存击穿发生在“热点 key 刚过期的那一瞬间”，所以要把并发查库压缩成一次</text>

      <rect x="34" y="94" width="108" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="88" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">hot key 过期</text>
      <text x="88" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">product:123</text>

      <line x1="142" y1="118" x2="238" y2="98" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="142" y1="118" x2="238" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="142" y1="118" x2="238" y2="138" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="238" y="82" width="108" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="292" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">req A</text>
      <rect x="238" y="118" width="108" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="292" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">req B</text>

      <line x1="346" y1="118" x2="442" y2="118" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="442" y="74" width="150" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="517" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">singleflight / 锁</text>
      <text x="517" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同一 key 只放一个请求去 DB</text>
      <text x="517" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">其余等待共享结果</text>
      <text x="517" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">查完后统一回填缓存</text>

      <line x1="592" y1="118" x2="684" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="684" y="96" width="42" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="705" y="113" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">DB</text>
      <text x="705" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">1 次</text>

      <text x="380" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">热点 key 场景最怕瞬时并发放大。单机上 singleflight 最轻量；分布式多实例场景才考虑分布式锁或热点永不过期方案</text>
    </svg>

    <svg
      v-else-if="kind === 'cache-avalanche'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="缓存雪崩图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">缓存雪崩不是某一个 key 的问题，而是大量 key 同时失效或整个 Redis 层挂掉，流量整体冲向下游</text>

      <rect x="36" y="82" width="172" height="108" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="122" y="104" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">风险源</text>
      <text x="122" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">大量 key 同时到期</text>
      <text x="122" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Redis 整体不可用</text>
      <text x="122" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">所有请求直接打 DB</text>
      <text x="122" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">形成级联故障</text>

      <line x1="208" y1="136" x2="320" y2="100" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <line x1="208" y1="136" x2="320" y2="136" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <line x1="208" y1="136" x2="320" y2="172" stroke="var(--d-warn-border)" stroke-width="1.4" />

      <rect x="320" y="82" width="160" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="400" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">TTL + 随机抖动，打散过期时间</text>
      <rect x="320" y="120" width="160" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="400" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">本地缓存 + Redis + DB 多级降级</text>
      <rect x="320" y="158" width="160" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="400" y="180" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">异步回填，不阻塞主链路</text>

      <line x1="480" y1="136" x2="592" y2="136" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="592" y="104" width="132" height="64" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="658" y="126" text-anchor="middle" font-size="10" fill="var(--d-text)">目标</text>
      <text x="658" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不要让峰值同时落到 DB</text>
      <text x="658" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">系统能降级而不是崩溃</text>

      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">雪崩的防护思路不是“消除故障”，而是“把故障局部化并削峰”，多级缓存和 jitter 是最便宜的工程手段</text>
    </svg>

    <svg
      v-else-if="kind === 'cache-aside'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cache Aside 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Cache Aside 的精髓是：读 miss 再查库回填；写时更新 DB 后删缓存，而不是尝试直接把缓存改对</text>

      <rect x="24" y="54" width="340" height="188" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="194" y="78" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">读路径</text>
      <text x="194" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">request -> cache get</text>
      <text x="194" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">命中直接返回</text>
      <text x="194" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">未命中 -> DB 查询</text>
      <text x="194" y="168" text-anchor="middle" font-size="10" fill="var(--d-text)">查到后 set cache 再返回</text>
      <text x="194" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">缓存是加速层，不是事实来源</text>

      <rect x="396" y="54" width="340" height="188" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="566" y="78" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">写路径</text>
      <text x="566" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">request -> update DB</text>
      <text x="566" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">成功后 delete cache</text>
      <text x="566" y="148" text-anchor="middle" font-size="10" fill="var(--d-text)">下次读再重新回填</text>
      <text x="566" y="168" text-anchor="middle" font-size="10" fill="var(--d-text)">不要直接 update cache</text>
      <text x="566" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">写缓存容易在并发下把旧值覆盖回来</text>
    </svg>

    <svg
      v-else-if="kind === 'double-delete'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="延迟双删图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">延迟双删是在 Cache Aside 基础上补第二次删除，用来覆盖“旧读把脏数据重新回填”的窗口</text>

      <line x1="56" y1="154" x2="706" y2="154" stroke="var(--d-text-muted)" stroke-width="1.2" />
      <rect x="70" y="92" width="102" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="121" y="113" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">1. delete cache</text>
      <rect x="212" y="92" width="102" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="263" y="113" text-anchor="middle" font-size="9" fill="var(--d-text)">2. update DB</text>
      <rect x="356" y="82" width="144" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="428" y="104" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">风险窗口</text>
      <text x="428" y="120" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">并发读可能把旧值又写回缓存</text>
      <rect x="554" y="92" width="124" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="616" y="113" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">3. sleep 后再删一次</text>

      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这不是强一致方案，只是缩小不一致窗口。延迟时间要大于一次典型读链路耗时，否则第二次删除可能太早执行</text>
    </svg>

    <svg
      v-else-if="kind === 'mq-invalidation'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="基于消息或 CDC 的缓存失效图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">规模再大一点时，缓存一致性通常不靠应用代码自己补，而是靠 CDC 或消息流统一失效相关 key</text>

      <rect x="40" y="88" width="108" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="94" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">DB update</text>
      <text x="94" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">users/products</text>

      <line x1="148" y1="112" x2="256" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="256" y="76" width="144" height="72" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="328" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">binlog / MQ event</text>
      <text x="328" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">table / action / pk / data</text>
      <text x="328" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Canal / Debezium / 业务事件</text>

      <line x1="400" y1="112" x2="502" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="502" y="76" width="122" height="72" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="563" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">invalidator</text>
      <text x="563" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">根据表和主键</text>
      <text x="563" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">算出该删哪些 key</text>

      <line x1="624" y1="112" x2="720" y2="96" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="624" y1="112" x2="720" y2="128" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="720" y="80" width="4" height="32" rx="2" fill="var(--d-rv-a-border)" />
      <text x="712" y="92" text-anchor="end" font-size="9" fill="var(--d-rv-a-text)">user:123</text>
      <text x="712" y="126" text-anchor="end" font-size="9" fill="var(--d-rv-a-text)">user:list:page:*</text>

      <text x="380" y="200" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这种做法把一致性从“每个业务点都手写删除逻辑”提升成统一事件流，通常比应用层补偿更可靠，也更适合多服务共享缓存场景</text>
    </svg>

    <svg
      v-else-if="kind === 'sharding-route'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="分片路由图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">分片路由真正重要的是：同一个 key 总能落到同一个分片；策略不同，扩容、迁移和查询代价也不同</text>

      <rect x="34" y="104" width="104" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">userID / orderID</text>
      <text x="86" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">分片键</text>

      <line x1="138" y1="126" x2="246" y2="92" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="138" y1="126" x2="246" y2="126" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="138" y1="126" x2="246" y2="160" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="246" y="72" width="162" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="327" y="94" text-anchor="middle" font-size="9" fill="var(--d-text)">哈希取模：分布均匀，最常见</text>
      <rect x="246" y="110" width="162" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="327" y="132" text-anchor="middle" font-size="9" fill="var(--d-text)">范围分片：按时间 / ID 区间</text>
      <rect x="246" y="148" width="162" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="327" y="170" text-anchor="middle" font-size="9" fill="var(--d-text)">一致性哈希：扩容迁移更少</text>

      <line x1="408" y1="128" x2="520" y2="128" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="520" y="82" width="86" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="563" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">db_00</text>
      <rect x="620" y="82" width="86" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="663" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">db_01</text>
      <rect x="520" y="142" width="86" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="563" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">orders_0000</text>
      <rect x="620" y="142" width="86" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="663" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">orders_0001</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">路由策略本身决定了后续查询能力。能用分片键命中的单分片查询最便宜，跨分片查询永远是高成本例外路径</text>
    </svg>

    <svg
      v-else-if="kind === 'snowflake-id'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Snowflake ID 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Snowflake 的价值是：多节点也能生成全局唯一、趋势递增的 ID，不再依赖单库自增主键</text>

      <rect x="56" y="86" width="30" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="71" y="104" text-anchor="middle" font-size="8" fill="var(--d-text)">1b</text>
      <text x="71" y="118" text-anchor="middle" font-size="8" fill="var(--d-text)">sign</text>

      <rect x="90" y="86" width="250" height="44" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="215" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">41bit timestamp</text>
      <text x="215" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">相对 epoch 的毫秒时间</text>

      <rect x="344" y="86" width="140" height="44" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="414" y="104" text-anchor="middle" font-size="9" fill="var(--d-text)">10bit machineID</text>
      <text x="414" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">0 ~ 1023</text>

      <rect x="488" y="86" width="154" height="44" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="565" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">12bit sequence</text>
      <text x="565" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">同毫秒内自增</text>

      <rect x="648" y="86" width="70" height="44" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="683" y="104" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">趋势递增</text>
      <text x="683" y="118" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">非绝对连续</text>

      <text x="380" y="176" text-anchor="middle" font-size="10" fill="var(--d-text)">同一毫秒序列耗尽要等下一毫秒；机器时钟回拨则必须处理，否则会生成冲突 ID</text>
      <text x="380" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">相比 UUID 更利于索引局部性，但实现上要管理机器号和时钟健康</text>
    </svg>

    <svg
      v-else-if="kind === 'cross-shard-query'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="跨分片查询图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">跨分片查询的成本主要花在“扇出到所有分片 + 拉回结果再聚合排序”，不是 SQL 本身</text>

      <rect x="30" y="96" width="120" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">query all shards</text>
      <text x="90" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">没有分片键条件</text>

      <line x1="150" y1="118" x2="258" y2="90" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="150" y1="118" x2="258" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="150" y1="118" x2="258" y2="146" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="72" width="94" height="32" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="305" y="92" text-anchor="middle" font-size="9" fill="var(--d-text)">db0.tbl0</text>
      <rect x="258" y="110" width="94" height="32" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="305" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">db0.tbl1</text>
      <rect x="258" y="148" width="94" height="32" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="305" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">db1.tbl0 ...</text>

      <line x1="352" y1="126" x2="476" y2="126" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="476" y="82" width="140" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="546" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">merge</text>
      <text x="546" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">收集所有分片结果</text>
      <text x="546" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">内存排序 / 去重 / 分页</text>
      <text x="546" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">最后再返回</text>

      <line x1="616" y1="126" x2="714" y2="126" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="714" y="104" width="18" height="44" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="706" y="96" text-anchor="end" font-size="9" fill="var(--d-warn-text)">慢、贵</text>

      <text x="380" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最优路径永远是“按分片键直达单分片”。跨分片查询只能作为少量后台报表或低频管理功能，而不该成为主链路常态</text>
    </svg>
  </DiagramFrame>
</template>
