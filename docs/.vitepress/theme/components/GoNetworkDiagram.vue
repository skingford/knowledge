<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'http-server-flow'
  | 'graceful-shutdown'
  | 'http-client-pool'
  | 'netpoller-flow'
  | 'tcp-dial-flow'
  | 'tcp-vs-udp'
  | 'connection-pool'
  | 'timeout-layers'
  | 'retry-backoff'
  | 'rate-limit-modes'
  | 'middleware-chain'
  | 'json-struct-tags'
  | 'json-stream-decoder'
  | 'io-primitives'
  | 'io-pipe-stream'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'http-server-flow': '760px',
  'graceful-shutdown': '760px',
  'http-client-pool': '760px',
  'netpoller-flow': '760px',
  'tcp-dial-flow': '760px',
  'tcp-vs-udp': '760px',
  'connection-pool': '760px',
  'timeout-layers': '760px',
  'retry-backoff': '760px',
  'rate-limit-modes': '760px',
  'middleware-chain': '760px',
  'json-struct-tags': '760px',
  'json-stream-decoder': '760px',
  'io-primitives': '760px',
  'io-pipe-stream': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 网络编程专题概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">网络主线：服务端接请求，客户端复用连接，治理超时重试，最后落到中间件与 IO 组合</text>

      <rect x="18" y="44" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="103" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">服务端</text>
      <text x="103" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">listener.Accept</text>
      <text x="103" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">每个连接一个 goroutine</text>
      <text x="103" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">ServeMux -> Handler</text>
      <text x="103" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是请求怎么进来、怎么优雅退出</text>

      <rect x="202" y="44" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="287" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">客户端</text>
      <text x="287" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Client + Transport</text>
      <text x="287" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">连接池复用</text>
      <text x="287" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Body close + drain</text>
      <text x="287" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是别把连接池用废了</text>

      <rect x="386" y="44" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="471" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">治理</text>
      <text x="471" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">连接池上限</text>
      <text x="471" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">超时分层</text>
      <text x="471" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">退避重试 + 限流</text>
      <text x="471" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是让故障止损，而不是放大</text>

      <rect x="570" y="44" width="172" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="656" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">工程层</text>
      <text x="656" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">中间件链</text>
      <text x="656" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">JSON Decoder / Encoder</text>
      <text x="656" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Reader / Writer / Pipe</text>
      <text x="656" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点是把网络和 IO 拼成稳定流程</text>
    </svg>

    <svg
      v-else-if="kind === 'http-server-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="net/http 服务端处理流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">net/http 服务端主线：监听端口，接收连接，为连接起 goroutine，再把请求交给 mux 和 handler</text>

      <rect x="24" y="88" width="110" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="79" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">net.Listen</text>
      <text x="79" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">:8080</text>

      <line x1="134" y1="112" x2="200" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="200" y="88" width="116" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="258" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">Accept loop</text>
      <text x="258" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不断接新连接</text>

      <line x1="316" y1="112" x2="384" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="384" y="60" width="132" height="104" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="450" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">conn goroutine</text>
      <text x="450" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">读请求行 / header</text>
      <text x="450" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">解析 Request</text>
      <text x="450" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">准备 ResponseWriter</text>

      <line x1="516" y1="112" x2="594" y2="112" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="594" y="88" width="126" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="657" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">ServeMux</text>
      <text x="657" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">匹配路由 -> Handler</text>

      <rect x="594" y="168" width="126" height="46" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="657" y="188" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">写响应</text>
      <text x="657" y="204" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">keep-alive 复用连接</text>

      <line x1="657" y1="136" x2="657" y2="168" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">DefaultServeMux 只是一个全局 mux；生产里更推荐显式 new 一个 ServeMux，避免全局状态</text>
    </svg>

    <svg
      v-else-if="kind === 'graceful-shutdown'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Graceful Shutdown 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Graceful Shutdown 不是“马上退出”，而是“先停接新流量，再给在途请求一个收尾窗口”</text>

      <rect x="34" y="78" width="124" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="96" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">收到 SIGTERM</text>
      <text x="96" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">开始关闭流程</text>

      <line x1="158" y1="102" x2="248" y2="102" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="78" width="132" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="314" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">Shutdown(ctx)</text>
      <text x="314" y="116" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先停 Accept 新连接</text>

      <line x1="380" y1="102" x2="476" y2="102" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="476" y="54" width="122" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="537" y="74" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">请求 A</text>
      <text x="537" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">收尾中</text>
      <rect x="476" y="108" width="122" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="537" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">请求 B</text>
      <text x="537" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">收尾中</text>

      <line x1="598" y1="102" x2="690" y2="102" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="690" y="78" width="44" height="48" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="712" y="100" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">ctx</text>
      <text x="712" y="116" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">30s</text>

      <text x="380" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">ctx 内完成则平滑退出；超时未完成则强制关闭。没有 Shutdown 的进程重启，会直接切断还没写完的响应</text>
    </svg>

    <svg
      v-else-if="kind === 'http-client-pool'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="http.Client 与 Transport 连接池图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">http.Client 真正关键的是复用同一个 Transport，让连接回到池里，而不是每次都重新建连</text>

      <rect x="24" y="98" width="112" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="80" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务代码</text>
      <text x="80" y="134" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">client.Do(req)</text>

      <line x1="136" y1="122" x2="228" y2="122" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="228" y="86" width="160" height="72" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="308" y="108" text-anchor="middle" font-size="11" fill="var(--d-text)">shared Transport</text>
      <text x="308" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Dial / TLS / MaxIdleConnsPerHost</text>
      <text x="308" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">每次新建 Transport = 连接池重置</text>

      <line x1="388" y1="122" x2="480" y2="122" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="480" y="62" width="148" height="120" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="554" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">per-host pool</text>
      <rect x="504" y="98" width="30" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <rect x="540" y="98" width="30" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <rect x="576" y="98" width="30" height="18" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1" />
      <text x="555" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">空闲连接等待复用</text>
      <text x="555" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Body 关掉并读完才会归还</text>

      <rect x="480" y="202" width="122" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="541" y="222" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">正确</text>
      <text x="541" y="238" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Close + drain -> 回池</text>

      <rect x="614" y="202" width="122" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="675" y="222" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">错误</text>
      <text x="675" y="238" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不关 Body -> 连接泄漏</text>
    </svg>

    <svg
      v-else-if="kind === 'netpoller-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="netpoller 异步 IO 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">netpoller 的关键是“fd 非阻塞 + goroutine 挂起”，真正等 IO 的不是系统线程，而是运行时里的等待队列</text>

      <rect x="28" y="90" width="118" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">goroutine</text>
      <text x="87" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">conn.Read()</text>

      <line x1="146" y1="115" x2="236" y2="115" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="236" y="70" width="160" height="90" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="316" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">poll.FD.Read</text>
      <text x="316" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">syscall.Read -> EAGAIN</text>
      <text x="316" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">waitRead / gopark</text>
      <text x="316" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">当前 G 挂起，不占住 M</text>

      <line x1="396" y1="115" x2="502" y2="115" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="502" y="58" width="132" height="114" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="568" y="80" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">runtime netpoll</text>
      <text x="568" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">epoll_wait / kqueue</text>
      <text x="568" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">fd 就绪事件</text>
      <text x="568" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">unblock 对应 goroutine</text>
      <text x="568" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">放回 runnable 队列</text>

      <rect x="278" y="194" width="204" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="215" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">IO 未就绪时，M 还能继续跑别的 goroutine</text>
    </svg>

    <svg
      v-else-if="kind === 'tcp-dial-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TCP 建连流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">DialContext 的主线是：解析地址，尝试建连，把 fd 设为非阻塞，然后等“可写”事件确认连接真正完成</text>

      <rect x="22" y="98" width="108" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="76" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">DialContext</text>
      <text x="76" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">tcp host:port</text>

      <line x1="130" y1="120" x2="214" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="214" y="76" width="132" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="280" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">resolver</text>
      <text x="280" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DNS 解析</text>
      <text x="280" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">A / AAAA</text>
      <text x="280" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Happy Eyeballs</text>

      <line x1="346" y1="120" x2="432" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="432" y="66" width="148" height="108" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="506" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">socket + connect</text>
      <text x="506" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">setNonblock(fd)</text>
      <text x="506" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">connect 立即返回</text>
      <text x="506" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">注册到 netpoller</text>
      <text x="506" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">waitWrite 等完成</text>

      <line x1="580" y1="120" x2="654" y2="120" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="654" y="98" width="84" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="696" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">TCPConn</text>
      <text x="696" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">返回上层</text>

      <rect x="248" y="194" width="264" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="215" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Go 里“连接建立中”也是走非阻塞 fd + 就绪事件，不会把整个线程卡死在 connect 上</text>
    </svg>

    <svg
      v-else-if="kind === 'tcp-vs-udp'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TCP 与 UDP 对比图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">TCP 关心“连接和顺序”，UDP 关心“尽快发一个报文出去”</text>

      <rect x="18" y="46" width="352" height="206" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="194" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">TCP</text>
      <rect x="42" y="92" width="120" height="38" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="102" y="115" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">client</text>
      <rect x="206" y="92" width="120" height="38" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="266" y="115" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">server</text>
      <line x1="162" y1="102" x2="206" y2="102" stroke="var(--d-green)" stroke-width="1.4" />
      <line x1="162" y1="110" x2="206" y2="110" stroke="var(--d-green)" stroke-width="1.4" />
      <line x1="162" y1="118" x2="206" y2="118" stroke="var(--d-green)" stroke-width="1.4" />
      <text x="184" y="90" text-anchor="middle" font-size="9" fill="var(--d-green)">先建立连接</text>
      <text x="194" y="158" text-anchor="middle" font-size="10" fill="var(--d-text)">字节流，没有消息边界</text>
      <text x="194" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">通常要自己做分隔：换行、长度前缀</text>
      <text x="194" y="198" text-anchor="middle" font-size="10" fill="var(--d-text)">可靠、按序、适合 HTTP / DB / RPC</text>

      <rect x="390" y="46" width="352" height="206" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="566" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">UDP</text>
      <rect x="414" y="92" width="120" height="38" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="474" y="115" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">client</text>
      <rect x="580" y="92" width="120" height="38" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="640" y="115" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">server</text>
      <line x1="534" y1="111" x2="580" y2="111" stroke="var(--d-orange)" stroke-width="1.4" />
      <text x="556" y="90" text-anchor="middle" font-size="9" fill="var(--d-orange)">直接发 datagram</text>
      <text x="566" y="158" text-anchor="middle" font-size="10" fill="var(--d-text)">每次 ReadFromUDP 就是一整个报文</text>
      <text x="566" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">无连接、不保证到达、不保证顺序</text>
      <text x="566" y="198" text-anchor="middle" font-size="10" fill="var(--d-text)">适合 DNS、监控、实时性优先的小包</text>
    </svg>

    <svg
      v-else-if="kind === 'connection-pool'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="连接池图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">连接池的核心不是“保存连接”这么简单，而是限制上限、复用空闲、让超出的请求等待</text>

      <rect x="24" y="88" width="112" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="80" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">worker A/B/C</text>
      <text x="80" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Get()</text>

      <line x1="136" y1="112" x2="240" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="240" y="60" width="182" height="104" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="331" y="82" text-anchor="middle" font-size="11" fill="var(--d-text)">pool</text>
      <text x="331" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">idle queue + max open + wait</text>
      <rect x="272" y="118" width="34" height="20" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <rect x="312" y="118" width="34" height="20" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <rect x="352" y="118" width="34" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1" />

      <line x1="422" y1="112" x2="530" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="530" y="60" width="206" height="104" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="633" y="82" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">状态变化</text>
      <text x="633" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">空闲有连接 -> 直接复用</text>
      <text x="633" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">空闲没有且没到上限 -> factory 新建</text>
      <text x="633" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">达到上限 -> 等待别人 Put 回来</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">database/sql、http.Transport、本页自定义 Pool 的抽象都一样：借、用、还；上限之外要么等待，要么失败</text>
    </svg>

    <svg
      v-else-if="kind === 'timeout-layers'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="网络超时分层图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">超时要按层分开看：外层是整条调用链，内层是拨号、握手、等响应头、读写 deadline</text>

      <rect x="34" y="46" width="692" height="208" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="58" y="78" width="644" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务 context.WithTimeout(5s)：控制整条请求链，子调用不能超过父 deadline</text>

      <rect x="88" y="128" width="584" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">http.Client.Timeout(30s)：整次 Do，包括连接、头、Body 读取</text>

      <rect x="118" y="176" width="118" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="177" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">DialTimeout</text>
      <text x="177" y="212" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">建 TCP 连接</text>

      <rect x="250" y="176" width="118" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="309" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">TLSHandshake</text>
      <text x="309" y="212" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">握手阶段</text>

      <rect x="382" y="176" width="136" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="450" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ResponseHeaderTimeout</text>
      <text x="450" y="212" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">等首字节 / 头</text>

      <rect x="532" y="176" width="140" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="602" y="196" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">conn deadline</text>
      <text x="602" y="212" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">绝对时间点，续期要重设</text>

      <text x="380" y="242" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">经验上：业务层优先用 context，总时长压在外层；Transport 上再细分拨号、握手、响应头这些更底层的等待点</text>
    </svg>

    <svg
      v-else-if="kind === 'retry-backoff'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="指数退避重试图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">重试的关键不是“多试几次”，而是失败后越等越久，再加一点抖动，把流量错开</text>

      <line x1="60" y1="150" x2="708" y2="150" stroke="var(--d-text-muted)" stroke-width="1.2" />
      <rect x="72" y="96" width="72" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="108" y="117" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">attempt 0</text>
      <text x="108" y="170" text-anchor="middle" font-size="9" fill="var(--d-text)">失败</text>

      <rect x="186" y="114" width="88" height="18" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="230" y="127" text-anchor="middle" font-size="8" fill="var(--d-text)">100ms +/- jitter</text>
      <rect x="300" y="88" width="72" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="336" y="109" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">attempt 1</text>

      <rect x="414" y="108" width="92" height="18" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="460" y="121" text-anchor="middle" font-size="8" fill="var(--d-text)">200ms +/- jitter</text>
      <rect x="538" y="82" width="72" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="574" y="103" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">attempt 2</text>

      <rect x="644" y="102" width="72" height="18" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="680" y="115" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">到 max / ctx</text>

      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">只重试网络错误和 5xx；4xx 通常不该重试。每次重试都要受整体 context 约束，避免无限磨损下游</text>
    </svg>

    <svg
      v-else-if="kind === 'rate-limit-modes'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="限流方式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">限流要先分清两件事：简单匀速放行，还是带 burst 的令牌桶；调用侧再决定 Wait、Allow 还是 Reserve</text>

      <rect x="18" y="46" width="340" height="206" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="188" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Ticker 匀速限流</text>
      <line x1="54" y1="172" x2="320" y2="172" stroke="var(--d-text-muted)" stroke-width="1.2" />
      <line x1="86" y1="120" x2="86" y2="172" stroke="var(--d-rv-c-border)" stroke-width="2" />
      <line x1="142" y1="120" x2="142" y2="172" stroke="var(--d-rv-c-border)" stroke-width="2" />
      <line x1="198" y1="120" x2="198" y2="172" stroke="var(--d-rv-c-border)" stroke-width="2" />
      <line x1="254" y1="120" x2="254" y2="172" stroke="var(--d-rv-c-border)" stroke-width="2" />
      <text x="188" y="198" text-anchor="middle" font-size="10" fill="var(--d-text)">节拍很均匀，实现简单</text>
      <text x="188" y="216" text-anchor="middle" font-size="10" fill="var(--d-text)">但没有 burst，表达能力有限</text>

      <rect x="402" y="46" width="340" height="206" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="572" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Token Bucket</text>
      <rect x="454" y="96" width="128" height="72" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="518" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">bucket</text>
      <text x="518" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按速率补充令牌</text>
      <text x="518" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可存 burst</text>
      <rect x="612" y="90" width="92" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="658" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Wait：阻塞等</text>
      <rect x="612" y="126" width="92" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="658" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Allow：立刻判</text>
      <rect x="612" y="162" width="92" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="658" y="180" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Reserve：拿等待时长</text>
      <text x="572" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">HTTP 中间件常用 Allow，后台任务常用 Wait，需要排队信息时再用 Reserve</text>
    </svg>

    <svg
      v-else-if="kind === 'middleware-chain'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HTTP 中间件链图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">中间件链本质上就是一层层包 Handler：请求进去时从外到内，响应回来时从内到外</text>

      <rect x="26" y="116" width="88" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="70" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">request</text>
      <text x="70" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">进入</text>

      <line x1="114" y1="138" x2="184" y2="138" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="184" y="92" width="112" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="240" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Recovery</text>
      <text x="240" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">最外层兜底 panic</text>
      <text x="240" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">返回 500</text>

      <line x1="296" y1="138" x2="366" y2="138" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="366" y="92" width="112" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="422" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">Logging</text>
      <text x="422" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">包装 ResponseWriter</text>
      <text x="422" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">记录 status / duration</text>

      <line x1="478" y1="138" x2="548" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="548" y="92" width="112" height="92" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="604" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Auth / CORS</text>
      <text x="604" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">可提前 return</text>
      <text x="604" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">不调 next 就终止链路</text>

      <line x1="660" y1="138" x2="716" y2="138" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="716" y="116" width="20" height="44" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="706" y="108" text-anchor="end" font-size="9" fill="var(--d-warn-text)">Handler</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text)">Chain 从后往前包裹，写代码时第一个 middleware 最终会处在最外层</text>
      <text x="380" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">经验上：Recovery / Logging 在外，鉴权 / 限流 / 超时在中间，业务 Handler 最内层</text>
    </svg>

    <svg
      v-else-if="kind === 'json-struct-tags'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JSON struct tags 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">encoding/json 默认按字段名工作，真正决定线上行为的通常是 tags、指针语义和自定义序列化接口</text>

      <rect x="24" y="46" width="320" height="214" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="184" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">struct</text>
      <text x="184" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">Name `json:\"name\"` -> 改输出键名</text>
      <text x="184" y="124" text-anchor="middle" font-size="10" fill="var(--d-text)">Email `json:\"email,omitempty\"` -> 空值时省略</text>
      <text x="184" y="146" text-anchor="middle" font-size="10" fill="var(--d-text)">Password `json:\"-\"` -> 永不输出</text>
      <text x="184" y="168" text-anchor="middle" font-size="10" fill="var(--d-text)">*bool / *float64 -> 区分“零值”和“没传”</text>
      <text x="184" y="190" text-anchor="middle" font-size="10" fill="var(--d-text)">匿名嵌入字段会提升到外层</text>

      <line x1="344" y1="154" x2="412" y2="154" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="412" y="46" width="324" height="214" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="574" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">JSON / 自定义接口</text>
      <rect x="446" y="92" width="256" height="76" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="574" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">{ "name": "Alice", "score": 95.5 }</text>
      <text x="574" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">omitempty 会省掉空字段；`-` 字段不会出现</text>
      <text x="574" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">unknown field 默认在 Unmarshal 时静默忽略</text>
      <text x="574" y="198" text-anchor="middle" font-size="10" fill="var(--d-text)">MarshalJSON / UnmarshalJSON</text>
      <text x="574" y="218" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">用来做 Unix 时间、自定义枚举、脱敏字段等特殊表示</text>
    </svg>

    <svg
      v-else-if="kind === 'json-stream-decoder'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JSON Decoder 流式解码图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">大 JSON 或 HTTP Body 不要一口气全读进内存，Decoder 可以边读边解码</text>

      <rect x="22" y="82" width="140" height="72" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="92" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Reader / r.Body</text>
      <text x="92" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">[ {...}, {...}, ... ]</text>

      <line x1="162" y1="118" x2="252" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="252" y="70" width="150" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="327" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">json.Decoder</text>
      <text x="327" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Token() -> [</text>
      <text x="327" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">More() -> 还有元素吗</text>
      <text x="327" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Decode(&item) -> 一个一个读</text>

      <line x1="402" y1="118" x2="480" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="480" y="82" width="104" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="532" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">record #1</text>
      <rect x="480" y="122" width="104" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="532" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">record #2</text>
      <rect x="602" y="102" width="132" height="52" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="668" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">DisallowUnknownFields</text>
      <text x="668" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">API 入参常建议开启</text>

      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Decoder 适合流式处理；Unmarshal 适合体量小、一次性载入的数据</text>
    </svg>

    <svg
      v-else-if="kind === 'io-primitives'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go IO 组合图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go IO 的核心不是函数名，而是 Reader / Writer 接口能像积木一样组合</text>

      <rect x="28" y="110" width="104" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="80" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Reader</text>
      <text x="80" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">file / conn / body</text>

      <line x1="132" y1="132" x2="236" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="236" y="92" width="148" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="310" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">io.Copy / wrappers</text>
      <text x="310" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MultiReader</text>
      <text x="310" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">TeeReader</text>
      <text x="310" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">LimitReader</text>

      <line x1="384" y1="132" x2="488" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="488" y="110" width="108" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="542" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Writer</text>
      <text x="542" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">stdout / file / buffer</text>

      <rect x="620" y="86" width="108" height="80" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="674" y="108" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">bufio</text>
      <text x="674" y="126" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">减少系统调用</text>
      <text x="674" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Writer 记得 Flush</text>

      <text x="380" y="216" text-anchor="middle" font-size="10" fill="var(--d-text)">bytes.Buffer 同时实现 Reader 和 Writer，所以经常是网络、JSON、压缩、文件处理里的中转站</text>
      <text x="380" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">理解接口之后，文件、HTTP Body、TCP 连接在代码层都会变成同一类东西</text>
    </svg>

    <svg
      v-else-if="kind === 'io-pipe-stream'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="io.Pipe 流式处理图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">io.Pipe 是零缓冲同步通道：左边写多少，右边就得及时读多少</text>

      <rect x="42" y="86" width="166" height="72" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="125" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">producer goroutine</text>
      <text x="125" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">json.NewEncoder(pw)</text>
      <text x="125" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">逐条 Encode(entry)</text>

      <line x1="208" y1="122" x2="330" y2="122" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="330" y="76" width="110" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="385" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">io.Pipe</text>
      <text x="385" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">pw -> pr</text>
      <text x="385" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">无缓冲，同步交接</text>
      <text x="385" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Close / CloseWithError</text>

      <line x1="440" y1="122" x2="564" y2="122" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="564" y="86" width="154" height="72" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="641" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">consumer</text>
      <text x="641" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">json.NewDecoder(pr)</text>
      <text x="641" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">逐条 Decode + 输出</text>

      <text x="380" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">常见用法：流式 JSON、multipart 上传、边压缩边上传。它很像内存里的同步管道，而不是可积压数据的缓冲队列</text>
    </svg>
  </DiagramFrame>
</template>
