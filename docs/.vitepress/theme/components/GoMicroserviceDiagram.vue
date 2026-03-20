<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'grpc-request-lifecycle'
  | 'protobuf-codegen'
  | 'service-registry'
  | 'service-discovery-watch'
  | 'config-hot-reload'
  | 'otel-trace'
  | 'circuit-breaker'
  | 'rate-limiter'
  | 'degradation-fallback'
  | 'idempotency-key'
  | 'retry-budget'
  | 'kafka-producer'
  | 'kafka-consumer'
  | 'saga-compensation'
  | 'outbox-pattern'
  | 'load-balancing'
  | 'health-check'
  | 'graceful-shutdown'
  | 'zone-failover'
  | 'bulkhead-isolation'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'grpc-request-lifecycle': '760px',
  'protobuf-codegen': '760px',
  'service-registry': '760px',
  'service-discovery-watch': '760px',
  'config-hot-reload': '760px',
  'otel-trace': '760px',
  'circuit-breaker': '760px',
  'rate-limiter': '760px',
  'degradation-fallback': '760px',
  'idempotency-key': '760px',
  'retry-budget': '760px',
  'kafka-producer': '760px',
  'kafka-consumer': '760px',
  'saga-compensation': '760px',
  'outbox-pattern': '760px',
  'load-balancing': '760px',
  'health-check': '760px',
  'graceful-shutdown': '760px',
  'zone-failover': '760px',
  'bulkhead-isolation': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="微服务与分布式概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">微服务主线：先让服务能通信和发现，再补可观测与容错，最后处理消息协作、治理和高可用</text>

      <rect x="22" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="136" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">通信基础</text>
      <text x="136" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">gRPC / Protobuf</text>
      <text x="136" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">etcd 注册发现</text>
      <text x="136" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">配置中心热更新</text>
      <text x="136" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先解决“服务怎么找到彼此并稳定通信”</text>

      <rect x="266" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">稳定性</text>
      <text x="380" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">OpenTelemetry</text>
      <text x="380" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">熔断 / 限流 / 降级</text>
      <text x="380" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">幂等 / 重试预算</text>
      <text x="380" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">再控制故障半径，避免小问题放大成雪崩</text>

      <rect x="510" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="624" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">协作与治理</text>
      <text x="624" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Kafka / Saga / Outbox</text>
      <text x="624" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">负载均衡 / 健康检查</text>
      <text x="624" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">优雅启停 / 多 AZ / Bulkhead</text>
      <text x="624" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最后让系统在故障和发布期间仍能持续提供服务</text>
    </svg>

    <svg
      v-else-if="kind === 'grpc-request-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="gRPC 请求生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">gRPC 的核心链路是：客户端 stub 序列化请求，经 HTTP/2 发到服务端，再由 handler 反序列化执行业务并返回 status code</text>

      <rect x="26" y="92" width="112" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="82" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">client stub</text>
      <text x="82" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">GetUser()</text>

      <line x1="138" y1="118" x2="248" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="70" width="176" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="336" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">HTTP/2 + Protobuf</text>
      <text x="336" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">grpc.Dial 复用连接</text>
      <text x="336" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">metadata / deadline / context</text>
      <text x="336" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可经过 unary / stream interceptor</text>

      <line x1="424" y1="118" x2="524" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="524" y="70" width="126" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="587" y="92" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">server handler</text>
      <text x="587" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">参数校验</text>
      <text x="587" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">业务逻辑</text>
      <text x="587" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">返回 pb + status</text>

      <rect x="676" y="70" width="58" height="96" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="705" y="92" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">codes</text>
      <text x="705" y="110" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">OK</text>
      <text x="705" y="126" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Invalid</text>
      <text x="705" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">NotFound</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">gRPC 的错误不是普通 error 字符串，而是 `status + code`。deadline 和 metadata 也要跟请求一起传过去</text>
    </svg>

    <svg
      v-else-if="kind === 'protobuf-codegen'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Protobuf 代码生成图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Protobuf 的关键不是语法本身，而是把协议定义、代码生成和兼容性规则固定下来</text>

      <rect x="26" y="90" width="126" height="60" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">order.proto</text>
      <text x="89" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">message / enum / oneof</text>

      <line x1="152" y1="120" x2="264" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="264" y="72" width="162" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="345" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">protoc</text>
      <text x="345" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">protoc-gen-go</text>
      <text x="345" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">protoc-gen-go-grpc</text>
      <text x="345" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 source_relative 生成</text>

      <line x1="426" y1="120" x2="522" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="426" y1="120" x2="522" y2="148" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="522" y="72" width="102" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="573" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">order.pb.go</text>
      <text x="573" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">message types</text>
      <rect x="522" y="124" width="102" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="573" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">order_grpc.pb.go</text>
      <text x="573" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">client / server stubs</text>

      <rect x="648" y="72" width="88" height="96" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="692" y="94" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">兼容规则</text>
      <text x="692" y="112" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">field number</text>
      <text x="692" y="128" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不可复用</text>
      <text x="692" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">删字段用 reserved</text>

      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正容易踩坑的是协议演进，而不是生成命令。编号复用会直接破坏线上兼容性</text>
    </svg>

    <svg
      v-else-if="kind === 'service-registry'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="服务注册图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">注册中心的核心价值是把“服务地址是配置”改成“服务实例是动态目录”，并用租约自动清理死亡节点</text>

      <rect x="24" y="84" width="132" height="96" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Provider</text>
      <text x="90" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">user-service :8081</text>
      <text x="90" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Grant lease TTL</text>
      <text x="90" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Put key with lease</text>

      <line x1="156" y1="132" x2="270" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="270" y="64" width="196" height="136" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="368" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">etcd registry</text>
      <text x="368" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">/services/user-service/10.0.0.1:8081</text>
      <text x="368" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">value = addr</text>
      <text x="368" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">lease 续约存活</text>
      <text x="368" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">lease 过期自动删 key</text>
      <text x="368" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Deregister 主动下线</text>

      <line x1="466" y1="132" x2="580" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="580" y="84" width="152" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="656" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Consumer</text>
      <text x="656" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Discover user-service</text>
      <text x="656" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">拿到实例地址列表</text>
      <text x="656" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">再交给负载均衡选择</text>

      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">lease + TTL 解决“实例挂了谁来删地址”的问题；KeepAlive channel 不消费会卡住续约链路</text>
    </svg>

    <svg
      v-else-if="kind === 'service-discovery-watch'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="服务发现 Watch 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">发现不仅是 Get 一次，更重要的是 Watch 变更，把本地地址缓存跟着注册中心动态刷新</text>

      <rect x="26" y="90" width="118" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="85" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">启动时 Get</text>
      <text x="85" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">拉一遍全量实例</text>

      <line x1="144" y1="116" x2="254" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="254" y="70" width="180" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="344" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">local cache</text>
      <text x="344" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">services[serviceName] = []addr</text>
      <text x="344" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Discover() 更新全量列表</text>
      <text x="344" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pick() 从缓存选 endpoint</text>

      <line x1="434" y1="116" x2="534" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="534" y="70" width="200" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="634" y="92" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Watch events</text>
      <text x="634" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">PUT: 实例上线</text>
      <text x="634" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">DELETE: 实例下线</text>
      <text x="634" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">事件后再拉全量，避免局部漂移</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Watch 负责实时感知，Discover 负责状态收敛。只做 Watch 不做全量刷新，缓存迟早会飘</text>
    </svg>

    <svg
      v-else-if="kind === 'config-hot-reload'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="配置中心热更新图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">配置热更新的核心不是 Watch 本身，而是“整份替换、并发安全读取、只热更适合热更的项”</text>

      <rect x="24" y="90" width="124" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">etcd config key</text>
      <text x="86" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">JSON blob</text>

      <line x1="148" y1="116" x2="258" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="66" width="172" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="344" y="88" text-anchor="middle" font-size="11" fill="var(--d-text)">ConfigCenter</text>
      <text x="344" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Load() 首次拉取</text>
      <text x="344" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Watch() 监听 PUT</text>
      <text x="344" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RWMutex + 整体替换指针</text>

      <line x1="430" y1="116" x2="530" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="430" y1="116" x2="530" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="530" y="70" width="96" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="578" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">业务读取</text>
      <text x="578" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Get() 当前配置</text>
      <rect x="530" y="122" width="96" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="578" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">OnChange</text>
      <text x="578" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">重建连接池等</text>

      <rect x="648" y="70" width="88" height="96" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="692" y="92" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">边界</text>
      <text x="692" y="110" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">端口号</text>
      <text x="692" y="126" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">监听地址</text>
      <text x="692" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">通常不能热更</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">更新时替换整份配置比逐字段改安全得多，否则读线程可能看到半更新状态</text>
    </svg>

    <svg
      v-else-if="kind === 'otel-trace'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OpenTelemetry 链路图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">链路追踪的关键不是多打几个 span，而是让 trace context 随 HTTP Header / gRPC metadata 一路传过去</text>

      <rect x="22" y="84" width="126" height="96" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="85" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">入口请求</text>
      <text x="85" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Extract traceparent</text>
      <text x="85" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Start root span</text>
      <text x="85" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">attributes / status</text>

      <line x1="148" y1="132" x2="264" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="264" y="64" width="176" height="136" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="352" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">service spans</text>
      <text x="352" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CreateOrder</text>
      <text x="352" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CheckInventory</text>
      <text x="352" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DeductInventory</text>
      <text x="352" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CreatePayment</text>
      <text x="352" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">otelgrpc 自动打 gRPC span</text>

      <line x1="440" y1="132" x2="548" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="548" y="84" width="184" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="640" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">OTLP exporter</text>
      <text x="640" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">batch export</text>
      <text x="640" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Jaeger / Tempo / Collector</text>
      <text x="640" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">采样决定是否上报</text>

      <text x="380" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">context 丢了就断链，采样过高会有成本。span 名称写操作语义，动态值放 attribute，不放在名字里</text>
    </svg>

    <svg
      v-else-if="kind === 'circuit-breaker'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="熔断器状态机图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">熔断器本质上是一个状态机，用失败计数和冷却窗口控制“什么时候直接拒绝请求”</text>

      <rect x="64" y="92" width="144" height="84" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="136" y="114" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Closed</text>
      <text x="136" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">正常放行</text>
      <text x="136" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">连续失败累计</text>

      <rect x="308" y="68" width="144" height="132" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="90" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">Open</text>
      <text x="380" y="108" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">直接 fail-fast</text>
      <text x="380" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不再打下游</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">等待 timeout</text>
      <text x="380" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">保护线程和连接资源</text>

      <rect x="552" y="92" width="144" height="84" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="624" y="114" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">HalfOpen</text>
      <text x="624" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">少量试探请求</text>
      <text x="624" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">连续成功才恢复</text>

      <line x1="208" y1="134" x2="308" y2="134" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="258" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">失败超阈值</text>

      <line x1="452" y1="110" x2="552" y2="110" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="502" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">冷却超时</text>

      <line x1="552" y1="152" x2="452" y2="152" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="502" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">试探失败回 Open</text>

      <line x1="552" y1="134" x2="208" y2="134" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="380" y="194" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">试探连续成功达到阈值后关闭熔断</text>

      <text x="380" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">熔断不是重试的替代，而是让下游故障时别把上游线程、连接池和超时预算一起拖死</text>
    </svg>

    <svg
      v-else-if="kind === 'rate-limiter'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="令牌桶限流图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">令牌桶限流的关键是“平时按固定速率补令牌，高峰时允许有限突发”，多余请求直接在入口被挡住</text>

      <rect x="26" y="92" width="112" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="82" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端请求</text>
      <text x="82" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">user / IP / app</text>

      <line x1="138" y1="114" x2="246" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="246" y="64" width="176" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="334" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">rate.Limiter</text>
      <text x="334" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">rps = 100</text>
      <text x="334" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">burst = 200</text>
      <text x="334" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Allow() 取令牌</text>
      <text x="334" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可按 clientID 细分 limiter</text>

      <line x1="422" y1="114" x2="522" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="422" y1="114" x2="522" y2="140" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="522" y="68" width="96" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="570" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">有令牌</text>
      <text x="570" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">请求放行</text>
      <rect x="522" y="120" width="96" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="570" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">无令牌</text>
      <text x="570" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">429 / 拒绝</text>

      <rect x="648" y="68" width="88" height="92" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="692" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">附加点</text>
      <text x="692" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">定期清理</text>
      <text x="692" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">per-client map</text>
      <text x="692" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">防内存泄漏</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">入口限流保护自己，分用户限流保护公平性。限流不是为了完全挡流量，而是为了让系统在高峰下保持可控退化</text>
    </svg>

    <svg
      v-else-if="kind === 'degradation-fallback'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="降级兜底图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">降级的核心不是“报错更优雅”，而是在非核心依赖不可用时，主链路还能返回可接受的兜底结果</text>

      <rect x="30" y="86" width="126" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="93" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">主链路请求</text>
      <text x="93" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">GetRecommendations</text>

      <line x1="156" y1="110" x2="264" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="264" y="64" width="174" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="351" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">推荐服务调用</text>
      <text x="351" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">走熔断器 Execute()</text>
      <text x="351" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">成功则返回个性化结果</text>
      <text x="351" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">失败则进入 fallback</text>

      <line x1="438" y1="110" x2="536" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="438" y1="110" x2="536" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="536" y="66" width="88" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="580" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">成功</text>
      <text x="580" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">个性化推荐</text>
      <rect x="536" y="118" width="88" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="580" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败</text>
      <text x="580" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">热门商品兜底</text>

      <rect x="650" y="66" width="86" height="92" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="693" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">前提</text>
      <text x="693" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">热点数据</text>
      <text x="693" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">要提前预热</text>
      <text x="693" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">别临时算</text>

      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正的降级是业务决策，不是技术自动魔法。核心链路一般不能降级，非核心功能才适合兜底</text>
    </svg>

    <svg
      v-else-if="kind === 'idempotency-key'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="幂等 Key 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">幂等不是只有一种实现，关键是先给业务操作一个稳定身份，再选状态表、一次性 Token 或唯一约束来兜住重复请求</text>

      <rect x="24" y="92" width="126" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">同一业务请求</text>
      <text x="87" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">key / token / bizKey</text>

      <line x1="150" y1="118" x2="262" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="262" y="70" width="166" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="345" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">统一目标</text>
      <text x="345" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">第一次执行业务</text>
      <text x="345" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">重复请求识别出来</text>
      <text x="345" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">效果保持不变</text>

      <line x1="428" y1="118" x2="528" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="428" y1="118" x2="528" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="428" y1="118" x2="528" y2="150" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="528" y="64" width="204" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="630" y="86" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">状态表：pending / success / response</text>

      <rect x="528" y="106" width="204" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="630" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Redis Token：生成一次，提交时原子消费一次</text>

      <rect x="528" y="148" width="204" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="630" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">唯一索引：业务唯一键冲突视为已成功</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">幂等不是“永远不重复执行”，而是“重复到来时效果不变”。key 要有过期和清理策略，不能无限堆积</text>
    </svg>

    <svg
      v-else-if="kind === 'retry-budget'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="重试预算图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">指数退避解决“怎么重试”，重试预算解决“什么时候该停止重试”，避免把下游直接压垮</text>

      <rect x="22" y="92" width="126" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="85" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">调用失败</text>
      <text x="85" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">先判 IsRetryable</text>

      <line x1="148" y1="116" x2="256" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="256" y="64" width="180" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="346" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">exponential backoff</text>
      <text x="346" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">100ms -> 200ms -> 400ms</text>
      <text x="346" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">加 jitter 防 thundering herd</text>
      <text x="346" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">受 context deadline 约束</text>
      <text x="346" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最多 N 次</text>

      <line x1="436" y1="116" x2="536" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="536" y="64" width="198" height="108" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="635" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">retry budget</text>
      <text x="635" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">记录 totalRequests / retryRequests</text>
      <text x="635" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ratio &lt; 20% 才允许继续</text>
      <text x="635" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">窗口到期重置计数</text>
      <text x="635" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">把重试风暴顶住</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">没有预算的重试在下游故障时会比原始流量更可怕，所以预算和退避应一起设计，而不是二选一</text>
    </svg>

    <svg
      v-else-if="kind === 'kafka-producer'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 生产者图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">生产者最重要的两件事是：用 key 控制分区内顺序，用 batch 和 acks 控制吞吐与可靠性</text>

      <rect x="26" y="92" width="120" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">OrderEvent</text>
      <text x="86" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">marshal JSON</text>

      <line x1="146" y1="116" x2="262" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="262" y="64" width="188" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="356" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">kafka.Writer</text>
      <text x="356" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Key = OrderID</text>
      <text x="356" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">LeastBytes / BatchSize / BatchTimeout</text>
      <text x="356" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RequiredAcks = all</text>
      <text x="356" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同步或异步发送</text>

      <line x1="450" y1="116" x2="548" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="548" y="64" width="184" height="108" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="640" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Kafka topic</text>
      <text x="640" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">同一 key -> 同一 partition</text>
      <text x="640" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">保证单订单事件顺序</text>
      <text x="640" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">分区之间无全局顺序</text>
      <text x="640" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">acks 决定写入确认级别</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Kafka 只能保证分区内有序，所以业务主键怎么选，直接决定你有没有顺序语义可用</text>
    </svg>

    <svg
      v-else-if="kind === 'kafka-consumer'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kafka 消费者图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">消费者的核心语义是 at-least-once，所以真正的难点不是读消息，而是处理失败后如何幂等重试和隔离毒消息</text>

      <rect x="24" y="92" width="118" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">reader.ReadMessage</text>
      <text x="83" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">取 offset N</text>

      <line x1="142" y1="116" x2="248" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="64" width="176" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="336" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">handler</text>
      <text x="336" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">unmarshal</text>
      <text x="336" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">业务处理</text>
      <text x="336" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">依赖幂等保证重复消费可接受</text>
      <text x="336" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">必要时走 DLQ</text>

      <line x1="424" y1="116" x2="526" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="424" y1="116" x2="526" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="526" y="70" width="96" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="574" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">处理成功</text>
      <text x="574" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">提交 offset</text>
      <rect x="526" y="122" width="96" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="574" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">处理失败</text>
      <text x="574" y="158" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不提交，后续重试</text>

      <rect x="648" y="70" width="88" height="96" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="692" y="92" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">补充措施</text>
      <text x="692" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">重试上限</text>
      <text x="692" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">死信队列</text>
      <text x="692" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">告警介入</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">只要可能重复消费，消费端就必须幂等。否则“处理成功但提交失败”的窗口一定会在生产里出现</text>
    </svg>

    <svg
      v-else-if="kind === 'saga-compensation'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Saga 补偿图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Saga 的核心不是跨服务强事务，而是“顺序执行正向动作，失败时按相反顺序做补偿”</text>

      <rect x="28" y="96" width="94" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="75" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">CreateOrder</text>
      <text x="75" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">成功</text>

      <rect x="154" y="96" width="108" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="208" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">DeductInventory</text>
      <text x="208" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">成功</text>

      <rect x="294" y="96" width="108" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="348" y="116" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">DeductBalance</text>
      <text x="348" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败</text>

      <rect x="434" y="96" width="112" height="44" rx="8" fill="var(--d-bg-soft)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="490" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">SendNotification</text>
      <text x="490" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">未执行</text>

      <line x1="122" y1="118" x2="154" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="262" y1="118" x2="294" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="402" y1="118" x2="434" y2="118" stroke="var(--d-warn-border)" stroke-width="1.4" />

      <rect x="450" y="176" width="124" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="512" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">RestoreInventory</text>
      <text x="512" y="212" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">补偿</text>

      <rect x="296" y="176" width="124" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="358" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">CancelOrder</text>
      <text x="358" y="212" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">补偿</text>

      <line x1="348" y1="140" x2="512" y2="176" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <line x1="348" y1="140" x2="358" y2="176" stroke="var(--d-warn-border)" stroke-width="1.4" />

      <text x="380" y="242" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">补偿动作本身也必须幂等，因为补偿过程也可能中断并被再次执行</text>
    </svg>

    <svg
      v-else-if="kind === 'outbox-pattern'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Outbox Pattern 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Outbox 解决的是“写业务库和发 MQ 不是同一个原子动作”，所以先把消息写进同一个事务，再异步转发出去</text>

      <rect x="24" y="90" width="118" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务请求</text>
      <text x="83" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">创建订单</text>

      <line x1="142" y1="116" x2="254" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="254" y="66" width="188" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="348" y="88" text-anchor="middle" font-size="11" fill="var(--d-text)">DB transaction</text>
      <text x="348" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">1. 写 orders</text>
      <text x="348" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">2. 写 outbox_messages pending</text>
      <text x="348" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">3. 同一事务 commit</text>
      <text x="348" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保证要么都成功要么都失败</text>

      <line x1="442" y1="116" x2="540" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="442" y1="116" x2="540" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="540" y="70" width="92" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="586" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">poller</text>
      <text x="586" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">扫描 pending</text>
      <rect x="540" y="122" width="92" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="586" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">publisher</text>
      <text x="586" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">发 Kafka 后标 published</text>

      <rect x="656" y="70" width="80" height="96" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="696" y="92" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">效果</text>
      <text x="696" y="110" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不再出现</text>
      <text x="696" y="126" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">写库成功</text>
      <text x="696" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">但消息丢失</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Outbox 不是没有重复，而是把重复控制到“消息可能多发，但不会凭空丢失”，所以消费端仍要幂等</text>
    </svg>

    <svg
      v-else-if="kind === 'load-balancing'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="负载均衡策略图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">负载均衡的本质不是随机选一个地址，而是按实例能力和业务特性，把请求分配到最合适的节点上</text>

      <rect x="28" y="92" width="112" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">endpoints[]</text>
      <text x="84" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">来自发现缓存</text>

      <line x1="140" y1="114" x2="250" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="250" y="64" width="182" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="341" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">Balancer</text>
      <text x="341" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RoundRobin</text>
      <text x="341" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">WeightedRoundRobin</text>
      <text x="341" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Random</text>
      <text x="341" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按权重或轮询选 endpoint</text>

      <line x1="432" y1="114" x2="536" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="432" y1="114" x2="536" y2="140" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="536" y="68" width="196" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="634" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">实例性能接近时，用轮询最简单</text>
      <text x="634" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适合无状态服务</text>
      <rect x="536" y="120" width="196" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="634" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">实例能力不等时，用加权轮询</text>
      <text x="634" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">状态亲和场景常要一致性哈希</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">均衡策略要和服务性质绑定，不存在“通吃所有场景”的 Pick 算法</text>
    </svg>

    <svg
      v-else-if="kind === 'health-check'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="健康检查图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">健康检查真正有价值的是分层表达：进程活着不代表服务就绪，readiness 和 liveness 不能混为一谈</text>

      <rect x="24" y="90" width="120" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">/health request</text>
      <text x="84" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">5s timeout</text>

      <line x1="144" y1="116" x2="252" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="252" y="64" width="186" height="104" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="345" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">HealthEndpoint</text>
      <text x="345" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">遍历 registered checkers</text>
      <text x="345" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DB PingContext</text>
      <text x="345" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Redis Ping</text>
      <text x="345" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">聚合成 JSON status</text>

      <line x1="438" y1="116" x2="540" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="438" y1="116" x2="540" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="540" y="68" width="88" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="584" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">StatusUp</text>
      <text x="584" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">200 OK</text>
      <rect x="540" y="120" width="88" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="584" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">StatusDown</text>
      <text x="584" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">503</text>

      <rect x="654" y="68" width="82" height="96" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="695" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">实践点</text>
      <text x="695" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">liveness</text>
      <text x="695" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">readiness</text>
      <text x="695" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">分开做</text>

      <text x="380" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">K8s 看到 readiness 失败通常会摘流量，而不是重启进程；liveness 失败才更接近“该重启了”</text>
    </svg>

    <svg
      v-else-if="kind === 'graceful-shutdown'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="优雅启停图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">优雅关闭最容易做错的是顺序，核心原则是：先停止接新流量，再等在途请求处理完，最后关连接和后台任务</text>

      <rect x="52" y="70" width="132" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="118" y="95" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">收到 SIGTERM</text>

      <line x1="118" y1="112" x2="118" y2="136" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="52" y="136" width="132" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="118" y="161" text-anchor="middle" font-size="10" fill="var(--d-text)">注册中心下线</text>

      <line x1="118" y1="178" x2="118" y2="202" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="52" y="202" width="132" height="42" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="118" y="227" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">等待流量切走</text>

      <rect x="314" y="70" width="132" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="95" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">HTTP Shutdown</text>

      <line x1="380" y1="112" x2="380" y2="136" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="314" y="136" width="132" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="161" text-anchor="middle" font-size="10" fill="var(--d-text)">gRPC GracefulStop</text>

      <line x1="380" y1="178" x2="380" y2="202" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="314" y="202" width="132" height="42" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="227" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">等待在途请求结束</text>

      <rect x="576" y="70" width="132" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="642" y="95" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">执行 onStop hooks</text>

      <line x1="642" y1="112" x2="642" y2="136" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="576" y="136" width="132" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="642" y="161" text-anchor="middle" font-size="10" fill="var(--d-text)">关闭 DB / buffer / worker</text>

      <line x1="642" y1="178" x2="642" y2="202" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="576" y="202" width="132" height="42" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="642" y="227" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">进程退出</text>

      <text x="380" y="258" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先关服务再摘流量会直接制造 5xx，所以顺序不能反。30 秒 shutdown budget 也要纳入整体超时设计</text>
    </svg>

    <svg
      v-else-if="kind === 'zone-failover'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="多可用区故障转移图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">多可用区设计的关键不是“能跨区”，而是优先本区低延迟访问，只有本区失效时才切到远端</text>

      <rect x="40" y="72" width="240" height="124" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="160" y="96" text-anchor="middle" font-size="12" fill="var(--d-text)">AZ-A（本区）</text>
      <rect x="74" y="116" width="70" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="109" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ep-1</text>
      <rect x="176" y="116" width="70" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="211" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ep-2 down</text>

      <rect x="480" y="72" width="240" height="124" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="600" y="96" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">AZ-B（远端）</text>
      <rect x="514" y="116" width="70" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="549" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ep-3</text>
      <rect x="616" y="116" width="70" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="651" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ep-4</text>

      <rect x="314" y="98" width="132" height="72" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="380" y="120" text-anchor="middle" font-size="10" fill="var(--d-text)">ZoneAwareBalancer</text>
      <text x="380" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">先 localZone</text>
      <text x="380" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">再 remote zones</text>

      <line x1="280" y1="134" x2="314" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="446" y1="134" x2="480" y2="134" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">本区优先是为了低时延和低跨区成本；跨区只是容灾手段，不该成为常态路径</text>
    </svg>

    <svg
      v-else-if="kind === 'bulkhead-isolation'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bulkhead 舱壁隔离图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">舱壁隔离的核心是给不同下游独立资源池，避免一个慢服务把整个调用方线程、连接和超时预算都吃光</text>

      <rect x="26" y="92" width="116" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">入口请求</text>
      <text x="84" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">多种下游调用</text>

      <line x1="142" y1="114" x2="250" y2="88" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="142" y1="114" x2="250" y2="140" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="250" y="68" width="176" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="338" y="88" text-anchor="middle" font-size="10" fill="var(--d-text)">payment bulkhead</text>
      <text x="338" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">max concurrent = 20</text>

      <rect x="250" y="120" width="176" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="338" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">recommend bulkhead</text>
      <text x="338" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">max concurrent = 50</text>

      <line x1="426" y1="90" x2="536" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="426" y1="142" x2="536" y2="142" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <rect x="536" y="68" width="98" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="585" y="88" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">payment slow</text>
      <text x="585" y="104" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">队列打满</text>

      <rect x="536" y="120" width="98" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="585" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">recommend 正常</text>
      <text x="585" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不受牵连</text>

      <rect x="658" y="68" width="78" height="96" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="697" y="90" text-anchor="middle" font-size="10" fill="var(--d-text)">结果</text>
      <text x="697" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">局部故障</text>
      <text x="697" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">局部扩散</text>
      <text x="697" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">而不是全盘拖死</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">舱壁隔离本质上是资源配额。没有独立配额，超时、熔断、重试再好也可能一起堵在同一个池子里</text>
    </svg>
  </DiagramFrame>
</template>
