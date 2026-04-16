<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'http-server-flow'
  | 'graceful-shutdown'
  | 'http-client-pool'
  | 'url-components'
  | 'cookiejar-flow'
  | 'circuit-breaker-states'
  | 'httptest-modes'
  | 'httptrace-events'
  | 'http2-multiplex'
  | 'reverse-proxy-flow'
  | 'netip-value-layout'
  | 'rpc-call-flow'
  | 'smtp-session-flow'
  | 'tcp-frame-lifecycle'
  | 'multipart-boundary-flow'
  | 'websocket-hub-flow'
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
  | 'fs-abstraction'
  | 'walkdir-flow'
  | 'tar-archive-layout'
  | 'zip-central-directory'
  | 'gzip-stream'
  | 'gzip-writer-pool'
  | 'embed-build-flow'
  | 'path-filepath-compare'
  | 'filepath-symlink'
  | 'base64-encoding-flow'
  | 'base64-streaming'
  | 'binary-byte-order'
  | 'binary-varint'
  | 'csv-reader-writer'
  | 'csv-streaming'
  | 'gob-type-stream'
  | 'gob-register'
  | 'hex-encode-dump'
  | 'xml-tag-mapping'
  | 'xml-token-stream'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'http-server-flow': '760px',
  'graceful-shutdown': '760px',
  'http-client-pool': '760px',
  'url-components': '760px',
  'cookiejar-flow': '760px',
  'circuit-breaker-states': '760px',
  'httptest-modes': '760px',
  'httptrace-events': '760px',
  'http2-multiplex': '760px',
  'reverse-proxy-flow': '760px',
  'netip-value-layout': '760px',
  'rpc-call-flow': '760px',
  'smtp-session-flow': '760px',
  'tcp-frame-lifecycle': '760px',
  'multipart-boundary-flow': '760px',
  'websocket-hub-flow': '760px',
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
  'fs-abstraction': '760px',
  'walkdir-flow': '760px',
  'tar-archive-layout': '760px',
  'zip-central-directory': '760px',
  'gzip-stream': '760px',
  'gzip-writer-pool': '760px',
  'embed-build-flow': '760px',
  'path-filepath-compare': '760px',
  'filepath-symlink': '760px',
  'base64-encoding-flow': '760px',
  'base64-streaming': '760px',
  'binary-byte-order': '760px',
  'binary-varint': '760px',
  'csv-reader-writer': '760px',
  'csv-streaming': '760px',
  'gob-type-stream': '760px',
  'gob-register': '760px',
  'hex-encode-dump': '760px',
  'xml-tag-mapping': '760px',
  'xml-token-stream': '760px',
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
      v-else-if="kind === 'url-components'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="net/url 组件与编码流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`net/url` 真正关键的是先把 URL 拆成结构化字段，再分别按 path 和 query 的规则编码，而不是拿整串字符串硬拼</text>
      <rect x="24" y="66" width="712" height="54" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">https://alice:secret@example.com:8443/search?q=go+lang#frag</text>
      <text x="380" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">scheme://userinfo@host/path?query#fragment</text>
      <line x1="380" y1="120" x2="380" y2="150" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="26" y="150" width="132" height="70" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="92" y="172" text-anchor="middle" font-size="11" fill="var(--d-text)">URL struct</text>
      <text x="92" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Scheme / Host</text>
      <text x="92" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Path / RawQuery</text>
      <rect x="172" y="150" width="132" height="70" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="238" y="172" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Userinfo</text>
      <text x="238" y="190" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Username()</text>
      <text x="238" y="206" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Password()</text>
      <rect x="318" y="150" width="132" height="70" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="384" y="172" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Values</text>
      <text x="384" y="190" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Query() -&gt; map[string][]string</text>
      <text x="384" y="206" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Encode() 稳定排序输出</text>
      <rect x="464" y="150" width="132" height="70" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="530" y="172" text-anchor="middle" font-size="11" fill="var(--d-text)">QueryEscape</text>
      <text x="530" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">空格 -&gt; +</text>
      <text x="530" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">适合表单 query</text>
      <rect x="610" y="150" width="126" height="70" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="673" y="172" text-anchor="middle" font-size="11" fill="var(--d-text)">PathEscape</text>
      <text x="673" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">空格 -&gt; %20</text>
      <text x="673" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">适合路径段</text>
      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`ResolveReference`、`String()`、`Encode()` 都建立在结构化字段之上；先 parse 成 `URL` 再改字段，通常比手工拼接稳得多</text>
    </svg>

    <svg
      v-else-if="kind === 'cookiejar-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CookieJar 存取流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`cookiejar` 的核心是把响应里的 `Set-Cookie` 先按域名、路径、Secure 和 PSL 规则过滤入库，再在后续请求里按目标 URL 精确挑回去</text>
      <rect x="28" y="92" width="122" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">响应头</text>
      <text x="89" y="131" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Set-Cookie: session=...</text>
      <line x1="150" y1="118" x2="248" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="64" width="202" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="349" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">Jar.SetCookies(url, cookies)</text>
      <text x="349" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">校验 Domain / Path</text>
      <text x="349" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Public Suffix List 防 `.com` 级别滥设</text>
      <text x="349" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 eTLD+1 -&gt; id 存到 entries</text>
      <text x="349" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">持久 Cookie 额外记录 Expires / MaxAge</text>
      <line x1="450" y1="118" x2="548" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="548" y="74" width="184" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="640" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Jar.Cookies(requestURL)</text>
      <text x="640" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">域名匹配 / 路径前缀 / Secure</text>
      <text x="640" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">过滤过期项并按路径长度排序</text>
      <text x="640" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">生成请求 Cookie 头</text>
      <rect x="236" y="194" width="288" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">所以 Jar 不是“无脑缓存 Cookie”，而是一个按 URL 规则动态裁剪的会话存储器</text>
    </svg>

    <svg
      v-else-if="kind === 'circuit-breaker-states'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="断路器状态机图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">断路器的核心不是“失败就拒绝”，而是让系统在连续失败时快速止损，并只用少量探测请求判断是否恢复</text>
      <rect x="42" y="84" width="170" height="64" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="127" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Closed</text>
      <text x="127" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">正常放行</text>
      <text x="127" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">累计失败计数</text>
      <line x1="212" y1="116" x2="328" y2="116" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="270" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">连续失败超阈值</text>
      <rect x="328" y="72" width="118" height="88" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="387" y="96" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">Open</text>
      <text x="387" y="114" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">快速失败</text>
      <text x="387" y="130" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">保护下游</text>
      <text x="387" y="146" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">等待 resetTimeout</text>
      <line x1="446" y1="116" x2="560" y2="116" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="503" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">超时后放少量探测流量</text>
      <rect x="560" y="72" width="160" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="640" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">HalfOpen</text>
      <text x="640" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只允许少量请求</text>
      <text x="640" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">成功则恢复</text>
      <text x="640" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">失败则重新断开</text>
      <path d="M640 160 C640 196 160 196 160 148" fill="none" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">关键参数不是越敏感越好；阈值、恢复窗口和 half-open 探测并发都决定了它是在止损，还是在抖动中来回拍门</text>
    </svg>

    <svg
      v-else-if="kind === 'httptest-modes'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="httptest 两种测试模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`httptest` 的价值在于把 HTTP 测试拆成两档：一档直接测 handler 行为，一档起真实测试服务器把网络和 TLS 也带上</text>
      <rect x="26" y="68" width="334" height="136" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="193" y="92" text-anchor="middle" font-size="12" fill="var(--d-text)">ResponseRecorder</text>
      <rect x="46" y="112" width="104" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="98" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NewRequest</text>
      <line x1="150" y1="132" x2="228" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="228" y="96" width="106" height="72" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="281" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">handler.ServeHTTP</text>
      <text x="281" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">recorder 记 Code/Header/Body</text>
      <text x="281" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Result() 断言结果</text>
      <text x="193" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">单元测试首选，快且定位准</text>
      <rect x="400" y="68" width="334" height="136" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="567" y="92" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">Test Server</text>
      <rect x="420" y="112" width="106" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="473" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NewServer / TLSServer</text>
      <line x1="526" y1="132" x2="606" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="606" y="96" width="104" height="72" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="658" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Client().Do()</text>
      <text x="658" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">真实端口 / TLS / 重定向</text>
      <text x="658" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">更接近集成测试</text>
      <text x="567" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适合测 Transport、中间件、连接复用</text>
      <text x="380" y="226" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">判断标准很简单：如果只关心 handler 输出，用 recorder；如果想把真正的 HTTP 栈也带进来，用 test server</text>
    </svg>

    <svg
      v-else-if="kind === 'httptrace-events'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="httptrace 事件流图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`httptrace` 的核心不是“打印更多日志”，而是把一次请求在拿连接、建连、写请求、收首字节这些关键节点上都挂成可编程钩子</text>
      <rect x="26" y="96" width="92" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="72" y="121" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">GetConn</text>
      <line x1="118" y1="118" x2="208" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="208" y="74" width="140" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="278" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">连接阶段</text>
      <text x="278" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DNSStart / DNSDone</text>
      <text x="278" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ConnectStart / Done</text>
      <text x="278" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">TLSHandshakeStart / Done</text>
      <line x1="348" y1="118" x2="442" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="442" y="86" width="118" height="64" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="501" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">GotConn</text>
      <text x="501" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Reused / IdleTime</text>
      <line x1="560" y1="118" x2="650" y2="118" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="650" y="74" width="84" height="88" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="692" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">写请求</text>
      <text x="692" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">WroteHeaderField</text>
      <text x="692" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">WroteHeaders</text>
      <text x="692" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">WroteRequest</text>
      <path d="M501 150 L501 196 L692 196 L692 162" fill="none" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <rect x="262" y="184" width="238" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="381" y="204" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">GotFirstResponseByte</text>
      <text x="381" y="220" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">TTFB 的观测锚点，后面才是读完整个响应体</text>
      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">如果请求直接命中连接池，DNS / TCP / TLS 钩子可能完全不会触发，这正是它诊断“为什么没复用上连接”的价值所在</text>
    </svg>

    <svg
      v-else-if="kind === 'http2-multiplex'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HTTP/2 多路复用图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">HTTP/2 的关键不是“更快的 HTTP”，而是把很多请求拆成独立 stream，在同一条 TCP 连接上用帧交错发送</text>

      <rect x="26" y="82" width="118" height="86" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="85" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">client</text>
      <text x="85" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">stream 1: /users</text>
      <text x="85" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">stream 3: /orders</text>
      <text x="85" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">stream 5: /events</text>

      <line x1="144" y1="125" x2="254" y2="125" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="254" y="58" width="252" height="134" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="82" text-anchor="middle" font-size="11" fill="var(--d-text)">一条 TCP + TLS 连接</text>
      <rect x="280" y="102" width="56" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="308" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">H1 S1</text>
      <rect x="344" y="102" width="56" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="372" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">D1 S1</text>
      <rect x="408" y="102" width="56" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="436" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">H1 S3</text>
      <rect x="472" y="102" width="56" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="500" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">D1 S5</text>
      <text x="380" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">HEADERS / DATA / WINDOW_UPDATE / SETTINGS 按帧交错</text>
      <text x="380" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">头部还会走 HPACK 压缩，避免重复发送大 header</text>

      <line x1="506" y1="125" x2="616" y2="125" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="616" y="82" width="118" height="86" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="675" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">server</text>
      <text x="675" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">同连接并发处理多流</text>
      <text x="675" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">优雅关闭用 GOAWAY</text>
      <text x="675" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不是每请求一连接</text>

      <text x="380" y="230" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">它消除了应用层的请求队头阻塞，但底层仍只有一条 TCP；一旦这条连接丢包，传输层的阻塞仍会影响其上的所有 stream</text>
    </svg>

    <svg
      v-else-if="kind === 'reverse-proxy-flow'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ReverseProxy 转发流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`ReverseProxy` 的核心不是简单转发，而是把“改请求、发后端、改响应、流式回写”这条链固定成一个可插拔流水线</text>

      <rect x="28" y="92" width="92" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="74" y="117" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">client</text>

      <line x1="120" y1="114" x2="220" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="220" y="60" width="188" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="314" y="84" text-anchor="middle" font-size="11" fill="var(--d-text)">ReverseProxy</text>
      <text x="314" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Director 改 URL / Host / Header</text>
      <text x="314" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">移除逐跳头 + 加 X-Forwarded-For</text>
      <text x="314" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Transport.RoundTrip 发后端</text>
      <text x="314" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ModifyResponse / ErrorHandler</text>

      <line x1="408" y1="114" x2="512" y2="114" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="512" y="92" width="100" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="562" y="117" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">backend</text>

      <path d="M562 136 L562 186 L314 186 L314 168" fill="none" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <rect x="214" y="196" width="200" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="314" y="214" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">copyResponse 流式写回客户端，SSE/大响应都能边读边回</text>

      <text x="380" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正容易踩坑的是 Host、逐跳头和错误处理；代理不是“再发一次请求”这么简单，而是处在两个 HTTP 语义之间做桥接</text>
    </svg>

    <svg
      v-else-if="kind === 'netip-value-layout'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="netip 值类型布局图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`netip` 真正解决的是旧 `net.IP` 的引用语义问题：地址、端口、前缀都变成可比较的值类型，适合做 map key 和热路径数据结构</text>

      <rect x="26" y="70" width="220" height="122" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="136" y="94" text-anchor="middle" font-size="12" fill="var(--d-text)">net.IP（旧）</text>
      <text x="136" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">[]byte，引用类型</text>
      <text x="136" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不能直接 `==`，也不能当 map key</text>
      <text x="136" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">nil / 16字节 / 4字节 语义容易混</text>
      <text x="136" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">热路径里常有额外分配和拷贝</text>

      <rect x="278" y="54" width="206" height="154" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="381" y="78" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">netip（新）</text>
      <text x="381" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Addr = 128bit address + zone</text>
      <text x="381" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">AddrPort = Addr + uint16 port</text>
      <text x="381" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Prefix = Addr + prefix bits</text>
      <text x="381" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">值类型、可比较、零值可用</text>
      <text x="381" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">IPv4 / IPv6 / mapped IPv4 统一处理</text>

      <rect x="516" y="70" width="218" height="122" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="625" y="94" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">直接收益</text>
      <text x="625" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">路由表：map[Prefix]Policy</text>
      <text x="625" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">去重：map[Addr]struct{}</text>
      <text x="625" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">解析后长期保留更省分配</text>
      <text x="625" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Contains / Unmap / Next 语义更清晰</text>

      <text x="380" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以 `netip` 不是语法糖，而是把“地址”从字节切片提升成真正的值对象；这对高频网络路径和路由类代码非常重要</text>
    </svg>

    <svg
      v-else-if="kind === 'rpc-call-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="net/rpc 调用流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`net/rpc` 的主线是：客户端给每次调用分配序列号挂进 pending，服务端按 `Service.Method` 反射分发，最后再靠同一个序列号把响应对回原调用</text>

      <rect x="24" y="74" width="176" height="112" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="112" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Client</text>
      <text x="112" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Call / Go</text>
      <text x="112" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">seq++</text>
      <text x="112" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">pending[seq] = *Call</text>
      <text x="112" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">codec 写 Request + Args</text>

      <line x1="200" y1="130" x2="296" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="296" y="96" width="168" height="68" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="118" text-anchor="middle" font-size="11" fill="var(--d-text)">连接 + codec</text>
      <text x="380" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">gob / jsonrpc / 自定义</text>
      <text x="380" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Request{ServiceMethod, Seq}</text>

      <line x1="464" y1="130" x2="560" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="560" y="74" width="176" height="112" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="648" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Server</text>
      <text x="648" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">serviceMap 找到 Service</text>
      <text x="648" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">method 表找 Method</text>
      <text x="648" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">反射调用 args, reply</text>
      <text x="648" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">回 Response{Seq, Error} + Reply</text>

      <path d="M648 186 L648 214 L112 214 L112 186" fill="none" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此它天然支持一条连接上并发多个调用，但代价是所有方法签名都要服从固定反射约束；这也是它后来被更强类型的 gRPC 取代的原因之一</text>
    </svg>

    <svg
      v-else-if="kind === 'smtp-session-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SMTP 会话流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">SMTP 发送不是一次 HTTP 式请求，而是一段长会话：先协商能力和安全，再声明发件人/收件人，最后才进入 DATA 阶段上传邮件正文</text>

      <rect x="44" y="64" width="136" height="132" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="112" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Client</text>
      <text x="112" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">EHLO</text>
      <text x="112" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">STARTTLS</text>
      <text x="112" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">AUTH</text>
      <text x="112" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">MAIL / RCPT / DATA</text>

      <line x1="180" y1="130" x2="306" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="306" y="52" width="148" height="156" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="76" text-anchor="middle" font-size="11" fill="var(--d-text)">smtp.Client</text>
      <text x="380" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Hello / Extension</text>
      <text x="380" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">StartTLS 升级连接</text>
      <text x="380" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Auth 认证</text>
      <text x="380" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Mail / Rcpt</text>
      <text x="380" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Data() 返回 writer 写正文</text>
      <text x="380" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Close data writer 发送终止点 `.`</text>

      <line x1="454" y1="130" x2="580" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="580" y="64" width="136" height="132" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="648" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">SMTP server</text>
      <text x="648" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">220 / 250 capability</text>
      <text x="648" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">250-STARTTLS</text>
      <text x="648" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">收 envelope</text>
      <text x="648" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">DATA 后收完整 MIME</text>

      <text x="380" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以发信时最常见的问题不是“请求失败”，而是协商能力、TLS、AUTH、单个 RCPT 或 DATA 阶段中的某一步被服务器拒绝</text>
    </svg>

    <svg
      v-else-if="kind === 'tcp-frame-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TCP 帧协议服务器流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">自定义 TCP 服务器真正要解决的是“字节流没有消息边界”，所以核心不是 `Read` 本身，而是先定帧协议，再围绕连接生命周期和超时来处理它</text>

      <rect x="24" y="92" width="110" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="79" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">listener.Accept</text>
      <text x="79" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">新连接</text>

      <line x1="134" y1="116" x2="232" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="232" y="60" width="170" height="112" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="317" y="84" text-anchor="middle" font-size="11" fill="var(--d-text)">conn goroutine</text>
      <text x="317" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">SetReadDeadline / idle timeout</text>
      <text x="317" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先读 Header：Magic / Type / Len</text>
      <text x="317" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">再按 Len 读 Payload</text>
      <text x="317" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">心跳 / 请求 / 错误分支</text>

      <line x1="402" y1="116" x2="500" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="500" y="74" width="122" height="84" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="561" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">handler</text>
      <text x="561" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">按 Type/子命令分发</text>
      <text x="561" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">返回响应 payload</text>

      <line x1="622" y1="116" x2="720" y2="116" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="618" y="184" width="118" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="677" y="206" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">encodeFrame + Write</text>

      <line x1="677" y1="158" x2="677" y2="184" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <rect x="172" y="184" width="264" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="304" y="206" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">优雅关闭时先停 Accept，再等连接 goroutine 收尾；否则半包、超时和写回中断都会变成线上噪音</text>
    </svg>

    <svg
      v-else-if="kind === 'multipart-boundary-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="multipart boundary 解析图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`multipart` 的关键不是“有很多字段”，而是每个 part 都靠 boundary 切开；Reader/Writer 只是把这个切分协议做成了可流式读写的抽象</text>

      <rect x="24" y="66" width="712" height="68" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="90" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">--boundary | headers | body | --boundary | headers | body | --boundary--</text>
      <text x="380" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">结束边界多两个 `--`，因此 Reader 才知道整份报文真的结束了</text>

      <line x1="380" y1="134" x2="380" y2="162" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="42" y="162" width="186" height="62" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="135" y="184" text-anchor="middle" font-size="11" fill="var(--d-text)">multipart.Reader</text>
      <text x="135" y="202" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">NextPart() 扫下一个 boundary</text>
      <text x="135" y="218" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Part.Read() 流式读内容</text>

      <rect x="288" y="162" width="186" height="62" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="381" y="184" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">ParseMultipartForm</text>
      <text x="381" y="202" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">小字段进内存</text>
      <text x="381" y="218" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">大文件可落临时文件</text>

      <rect x="534" y="162" width="186" height="62" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="627" y="184" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">multipart.Writer</text>
      <text x="627" y="202" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">CreatePart / CreateFormFile</text>
      <text x="627" y="218" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Close() 写结束 boundary</text>

      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以它特别适合文件上传和 MIME 组合体，但前提是别忘了 boundary 和 Close；缺任何一个，接收端都看不到一份完整报文</text>
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

    <svg
      v-else-if="kind === 'fs-abstraction'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="io/fs 文件系统抽象图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`io/fs` 的关键抽象是：只要实现 `Open`，真实磁盘、嵌入资源、测试内存文件系统都能被同一套工具函数消费</text>

      <rect x="24" y="58" width="164" height="146" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="106" y="82" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">实现侧</text>
      <text x="106" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">embed.FS</text>
      <text x="106" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">os.DirFS(".")</text>
      <text x="106" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">fstest.MapFS</text>
      <text x="106" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">生产 / 嵌入 / 测试</text>
      <text x="106" y="184" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">只换实现，不换调用者</text>

      <line x1="188" y1="132" x2="286" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="286" y="48" width="188" height="168" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="72" text-anchor="middle" font-size="11" fill="var(--d-text)">fs.FS</text>
      <text x="380" y="92" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最小接口：Open(name)</text>
      <text x="380" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按需扩展：</text>
      <text x="380" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ReadDirFS / ReadFileFS</text>
      <text x="380" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">StatFS / GlobFS / SubFS</text>
      <text x="380" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">路径统一用 `/`，根目录是 `.`</text>
      <text x="380" y="194" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">调用方不用关心底层来源</text>

      <line x1="474" y1="132" x2="572" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="572" y="58" width="164" height="146" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="654" y="82" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">消费侧</text>
      <text x="654" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">fs.ReadFile</text>
      <text x="654" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">fs.ReadDir / fs.Stat</text>
      <text x="654" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">fs.WalkDir / fs.Sub</text>
      <text x="654" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">loadConfig(fsys)</text>
      <text x="654" y="184" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">http.FileServer(http.FS(...))</text>
    </svg>

    <svg
      v-else-if="kind === 'walkdir-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="fs.WalkDir 递归流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`WalkDir` 的主线是：先 `Stat(root)`，再回调当前节点；若是目录则读取子项继续递归，回调返回值控制是否跳过</text>

      <rect x="28" y="94" width="124" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">fs.WalkDir</text>
      <text x="90" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">(fsys, root, fn)</text>

      <line x1="152" y1="118" x2="250" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="250" y="78" width="148" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="324" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">Stat(root)</text>
      <text x="324" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">失败也会回调 fn(path,nil,err)</text>
      <text x="324" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">成功后包装成 DirEntry</text>

      <line x1="398" y1="118" x2="494" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="494" y="66" width="156" height="104" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="572" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">fn(path, d, err)</text>
      <text x="572" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">文件：处理完返回</text>
      <text x="572" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">目录：决定是否继续向下</text>
      <text x="572" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">SkipDir / SkipAll 控制遍历</text>

      <line x1="572" y1="170" x2="572" y2="214" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="454" y="214" width="236" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="572" y="232" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">如果是目录，就 ReadDir 后对子节点重复同样流程</text>

      <rect x="88" y="190" width="246" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="211" y="212" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">隐藏目录过滤、错误短路、跳过分支，本质都靠回调返回值表达</text>
    </svg>

    <svg
      v-else-if="kind === 'tar-archive-layout'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="archive/tar 顺序归档图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">TAR 是严格顺序格式：`Header(512B) + Data` 一条一条排，Reader 只能从前往后扫，Writer 也必须按顺序写完</text>

      <rect x="24" y="70" width="120" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Header #1</text>
      <text x="84" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">name / mode / size</text>
      <rect x="144" y="70" width="98" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="193" y="90" text-anchor="middle" font-size="10" fill="var(--d-text)">Data #1</text>
      <text x="193" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">补齐到 512B</text>
      <rect x="260" y="70" width="120" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="320" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Header #2</text>
      <text x="320" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">目录 / 链接 / 文件</text>
      <rect x="380" y="70" width="98" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="429" y="90" text-anchor="middle" font-size="10" fill="var(--d-text)">Data #2</text>
      <text x="429" y="106" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">顺序写入</text>
      <rect x="496" y="70" width="152" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="572" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">两个全零 512B block</text>
      <text x="572" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">归档结束标记</text>

      <rect x="42" y="156" width="168" height="60" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="126" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">tar.Writer</text>
      <text x="126" y="196" text-anchor="middle" font-size="9" fill="var(--d-text)">WriteHeader -> Write(data)</text>

      <line x1="210" y1="186" x2="316" y2="186" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="316" y="156" width="128" height="60" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="178" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">gzip.Writer</text>
      <text x="380" y="196" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">tar.gz 时包在外层</text>

      <line x1="444" y1="186" x2="552" y2="186" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="552" y="156" width="166" height="60" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="635" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">tar.Reader</text>
      <text x="635" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Next() -> 读当前文件内容</text>
    </svg>

    <svg
      v-else-if="kind === 'zip-central-directory'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ZIP 中央目录图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">ZIP 和 TAR 最大的差别在末尾的中央目录：Reader 先从文件尾部定位目录，再反查每个文件的数据偏移</text>

      <rect x="24" y="78" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Local Header #1</text>
      <text x="83" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">+ Data #1</text>
      <rect x="152" y="78" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="211" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Local Header #2</text>
      <text x="211" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">+ Data #2</text>
      <rect x="290" y="68" width="204" height="68" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="392" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">Central Directory</text>
      <text x="392" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">文件名 / 方法 / CRC / 偏移量</text>
      <text x="392" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">汇总所有条目的元数据</text>
      <rect x="516" y="78" width="190" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="611" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">EOCD</text>
      <text x="611" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">记录中央目录位置和长度</text>

      <rect x="44" y="168" width="172" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="130" y="190" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">zip.NewReader</text>
      <text x="130" y="208" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">需要 ReaderAt + size</text>

      <line x1="216" y1="196" x2="344" y2="196" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="344" y="160" width="188" height="72" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="438" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">先从文件尾向前找 EOCD</text>
      <text x="438" y="200" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">再读中央目录，拿到每个文件偏移</text>
      <text x="438" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">最后 File.Open() 随机跳过去读</text>

      <text x="654" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以 ZIP 支持随机访问，TAR 不行</text>
    </svg>

    <svg
      v-else-if="kind === 'gzip-stream'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="gzip 流式压缩图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">gzip 的主线是：写入时边做 DEFLATE 边累计 CRC32，最后 `Close` 把 trailer 写出来；读时先解头，再流式解压</text>

      <rect x="24" y="82" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">src bytes</text>
      <text x="83" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">file / HTTP body</text>

      <line x1="142" y1="106" x2="246" y2="106" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="246" y="58" width="188" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="340" y="82" text-anchor="middle" font-size="11" fill="var(--d-text)">gzip.Writer</text>
      <text x="340" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">写 header</text>
      <text x="340" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Write -> flate.Writer 压缩</text>
      <text x="340" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同时累计 CRC32 和原始大小</text>

      <line x1="434" y1="106" x2="534" y2="106" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="534" y="66" width="186" height="80" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="627" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">gzip stream</text>
      <text x="627" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">header + deflate blocks</text>
      <text x="627" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Close 时再补 trailer</text>
      <text x="627" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">CRC32 + size</text>

      <rect x="160" y="180" width="440" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="201" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">`Flush` 只把当前压缩块往下游推，不结束流；`Close` 才真正把 trailer 写完整</text>
    </svg>

    <svg
      v-else-if="kind === 'gzip-writer-pool'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="gzip Writer 池化复用图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">高并发下复用 `gzip.Writer` 的重点不是省几行代码，而是避免每个请求都重新分配压缩器内部状态</text>

      <rect x="34" y="86" width="110" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">request</text>
      <text x="89" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">need gzip</text>

      <line x1="144" y1="110" x2="238" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="238" y="70" width="140" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="308" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">sync.Pool</text>
      <text x="308" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Get() 取已有 Writer</text>
      <text x="308" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">空时才 NewWriterLevel</text>

      <line x1="378" y1="110" x2="486" y2="110" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="486" y="60" width="142" height="100" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="557" y="82" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">gz.Reset(w)</text>
      <text x="557" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">绑定新目标</text>
      <text x="557" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Write / Close</text>
      <text x="557" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">完成一次压缩</text>

      <line x1="628" y1="110" x2="720" y2="110" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="600" y="176" width="132" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="666" y="194" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Reset(io.Discard) 后 Put()</text>

      <rect x="84" y="176" width="392" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="280" y="194" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">没 `Close` 就回池会丢 trailer；没 `Reset(io.Discard)` 就可能把旧目标留在内部状态里</text>
    </svg>

    <svg
      v-else-if="kind === 'embed-build-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="embed 编译时打包流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`embed` 的关键不是运行时读文件，而是编译时把匹配资源打进二进制的只读段，运行时只是在读内存</text>

      <rect x="26" y="88" width="142" height="62" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="110" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">//go:embed</text>
      <text x="97" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">static / templates/*.html</text>

      <line x1="168" y1="119" x2="266" y2="119" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="266" y="74" width="170" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="351" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">编译器阶段</text>
      <text x="351" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">扫描注释并匹配文件</text>
      <text x="351" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读取内容并生成初始化数据</text>
      <text x="351" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">写入可执行文件 `.rodata`</text>

      <line x1="436" y1="119" x2="540" y2="119" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="540" y="72" width="194" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="637" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">运行时变量</text>
      <text x="637" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">embed.FS / []byte / string</text>
      <text x="637" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">直接指向只读数据</text>
      <text x="637" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不需要额外磁盘 I/O</text>

      <rect x="176" y="196" width="408" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">所以部署时常见用法是：单二进制 + 内嵌静态资源，再通过 `http.FS` / `template.ParseFS` / `fs.Sub` 统一消费</text>
    </svg>

    <svg
      v-else-if="kind === 'path-filepath-compare'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="path 与 filepath 对比图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`path` 是纯斜杠字符串处理，`filepath` 才是操作系统感知路径处理；把两者混用，最容易踩在 Windows 和虚拟文件系统边界上</text>

      <rect x="26" y="56" width="210" height="150" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="131" y="80" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">path</text>
      <text x="131" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">始终用 `/`</text>
      <text x="131" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">适合 URL、路由、embed.FS</text>
      <text x="131" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不访问文件系统</text>
      <text x="131" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">path.Join("a", "b")</text>
      <text x="131" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">=> a/b</text>

      <rect x="274" y="56" width="212" height="150" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="80" text-anchor="middle" font-size="12" fill="var(--d-text)">filepath</text>
      <text x="380" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">感知 `Separator` / `ListSeparator`</text>
      <text x="380" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Join / Abs / Rel / EvalSymlinks</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">既做字符串规整，也会与 OS 语义互动</text>
      <text x="380" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">filepath.Join("a", "b")</text>
      <text x="380" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">=> Unix `a/b`，Windows `a\\b`</text>

      <rect x="524" y="56" width="210" height="150" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="629" y="80" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">经验法则</text>
      <text x="629" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">虚拟路径：`path`</text>
      <text x="629" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">真实磁盘路径：`filepath`</text>
      <text x="629" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`embed.FS` + URL 路径别用 `filepath`</text>
      <text x="629" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">跨平台工具链优先 `filepath`</text>
      <text x="629" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">规范化不等于安全校验</text>
    </svg>

    <svg
      v-else-if="kind === 'filepath-symlink'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="filepath 与符号链接图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`filepath.WalkDir` 默认不跟随目录符号链接，这不是缺陷，而是为了避免递归环和意外把遍历范围扩大</text>

      <rect x="38" y="84" width="138" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="107" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">root/link-to-data</text>
      <text x="107" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">目录符号链接</text>

      <line x1="176" y1="112" x2="282" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="282" y="68" width="170" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="367" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">filepath.WalkDir</text>
      <text x="367" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">底层先 `os.Lstat`</text>
      <text x="367" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">拿到“链接自身”而不是目标目录</text>
      <text x="367" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">因此不会自动深入该链接</text>

      <line x1="452" y1="112" x2="552" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="552" y="76" width="174" height="72" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="639" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">如果业务必须跟随链接</text>
      <text x="639" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">手动 `EvalSymlinks(path)`</text>
      <text x="639" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">并自行做去重 / 防环处理</text>

      <rect x="154" y="182" width="452" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="201" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">`Clean` 只做字符串规整；真正涉及链接解析、目录越权和循环引用时，必须进入 `Lstat / EvalSymlinks / Abs` 这一层</text>
    </svg>

    <svg
      v-else-if="kind === 'base64-encoding-flow'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Base64 3字节转4字符图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Base64 的核心动作只有一件事：把 24 bit 拆成 4 个 6 bit 索引，再按字母表换成可打印字符</text>

      <rect x="30" y="84" width="138" height="54" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="99" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">3 bytes</text>
      <text x="99" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">24 bits 原始数据</text>

      <line x1="168" y1="111" x2="278" y2="111" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="278" y="68" width="204" height="86" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">切成 4 组 6 bits</text>
      <text x="380" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">c0 c1 c2 c3</text>
      <text x="380" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">每组范围 0~63</text>
      <text x="380" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">再用 `Encoding.encode[64]` 查表</text>

      <line x1="482" y1="111" x2="586" y2="111" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="586" y="56" width="144" height="110" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="658" y="80" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">字母表差异</text>
      <text x="658" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Std: `+/` + `=`</text>
      <text x="658" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">URL: `-_` + `=`</text>
      <text x="658" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Raw: 无 padding</text>
      <text x="658" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">JWT 常用 RawURL</text>

      <rect x="170" y="186" width="420" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="205" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">尾部不足 3 字节时才需要 padding；Raw 编码只是把 `=` 去掉，字母表和 6 bit 拆分逻辑本身不变</text>
    </svg>

    <svg
      v-else-if="kind === 'base64-streaming'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Base64 流式编码图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">大文件场景里，Base64 最合适的用法不是 `EncodeToString`，而是把 `NewEncoder / NewDecoder` 当 IO wrapper 夹进拷贝链路里</text>

      <rect x="34" y="86" width="112" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">src Reader</text>
      <text x="90" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">file / body</text>

      <line x1="146" y1="110" x2="248" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="68" width="182" height="84" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="339" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">io.Copy(encoder, src)</text>
      <text x="339" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">encoder := base64.NewEncoder(...)</text>
      <text x="339" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内部缓存尾部 1~2 字节</text>
      <text x="339" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">凑满 3 字节再输出 4 字符</text>

      <line x1="430" y1="110" x2="534" y2="110" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="534" y="86" width="194" height="48" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="631" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">dst Writer / Reader</text>
      <text x="631" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">socket / file / HTTP response</text>

      <rect x="190" y="176" width="380" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="194" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">`NewEncoder` 必须 `Close`，否则最后那点没凑满 3 字节的尾巴不会刷出 padding；`NewDecoder` 则作为 Reader 直接消费即可</text>
    </svg>

    <svg
      v-else-if="kind === 'binary-byte-order'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="encoding/binary 字节序图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`encoding/binary` 真正解决的是“整数如何拆成字节序列”，而不是帮你猜协议格式；协议先定好大小端，代码才能正确读写</text>

      <rect x="40" y="62" width="300" height="128" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="190" y="86" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">BigEndian / Network Order</text>
      <text x="190" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">uint32(0x01020304)</text>
      <text x="190" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">[01] [02] [03] [04]</text>
      <text x="190" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">网络协议、文件头常见</text>
      <text x="190" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">高位字节先写</text>

      <rect x="420" y="62" width="300" height="128" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="570" y="86" text-anchor="middle" font-size="12" fill="var(--d-text)">LittleEndian</text>
      <text x="570" y="112" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">uint32(0x01020304)</text>
      <text x="570" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">[04] [03] [02] [01]</text>
      <text x="570" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CPU 内存布局常见</text>
      <text x="570" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">低位字节先写</text>

      <rect x="172" y="202" width="416" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="220" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">高性能场景优先 `PutUint32/Uint32` 直接处理字节；`binary.Read/Write` 更像反射版便利层，适合结构体原型，不适合热路径</text>
    </svg>

    <svg
      v-else-if="kind === 'binary-varint'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Varint 变长整数图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Varint 的核心是“每字节只拿 7 bit 存数据，最高位做 continuation 标记”，值越小，占字节越少</text>

      <rect x="42" y="86" width="122" height="50" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="103" y="107" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">uint64 value</text>
      <text x="103" y="123" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按 7 bit 切块</text>

      <line x1="164" y1="111" x2="276" y2="111" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="276" y="66" width="208" height="90" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="90" text-anchor="middle" font-size="11" fill="var(--d-text)">b0 b1 b2 ...</text>
      <text x="380" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">低 7 位存 payload</text>
      <text x="380" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最高位 1 = 后面还有字节</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最高位 0 = 结束</text>

      <line x1="484" y1="111" x2="588" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="484" y1="111" x2="588" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="588" y="74" width="138" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="657" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">小数值：1 byte 就够</text>
      <rect x="588" y="118" width="138" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="657" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">大数值：多 byte 继续拼</text>

      <rect x="148" y="180" width="464" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="198" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">`PutUvarint/Uvarint` 处理无符号；`PutVarint/Varint` 会对有符号值做额外编码以避免负数把长度拖到很大</text>
    </svg>

    <svg
      v-else-if="kind === 'csv-reader-writer'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CSV Reader Writer 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`encoding/csv` 的核心不是一次性读成二维数组，而是围绕 `Reader.Read` / `Writer.Write` 做逐行流式处理</text>

      <rect x="24" y="74" width="150" height="118" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="99" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">csv.Reader</text>
      <text x="99" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Read() -> []string</text>
      <text x="99" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Comma / Comment</text>
      <text x="99" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">FieldsPerRecord</text>
      <text x="99" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">LazyQuotes / TrimLeadingSpace</text>

      <line x1="174" y1="133" x2="292" y2="133" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="292" y="62" width="176" height="142" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">CSV 规则层</text>
      <text x="380" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">包含逗号 / 引号 / 换行时要加双引号</text>
      <text x="380" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">字段内 `\"` 要写成 `\"\"`</text>
      <text x="380" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Reader 逐字段切，Writer 负责转义</text>
      <text x="380" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本质还是文本流，不是数据库表</text>

      <line x1="468" y1="133" x2="586" y2="133" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="586" y="74" width="150" height="118" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="661" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">csv.Writer</text>
      <text x="661" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Write(record)</text>
      <text x="661" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">WriteAll(records)</text>
      <text x="661" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Flush() + Error()</text>
      <text x="661" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">可改 `Comma` 生成 TSV</text>

      <text x="380" y="226" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`ReadAll` / `WriteAll` 只是便利接口。数据量一大，真正安全的心智模型还是“逐行读，逐行处理，逐行写”</text>
    </svg>

    <svg
      v-else-if="kind === 'csv-streaming'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CSV 大文件流式处理图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CSV 大文件场景里最容易忽略的细节是 `ReuseRecord` 和 `Flush`：一个影响内存复用，一个决定写出的数据什么时候真正落到下游</text>

      <rect x="34" y="76" width="190" height="108" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="129" y="100" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">读取链路</text>
      <text x="129" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">bufio.Reader -> csv.Reader</text>
      <text x="129" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ReuseRecord = true</text>
      <text x="129" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">同一个 `[]string` 反复复用</text>
      <text x="129" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">要持久保存必须自己 copy</text>

      <rect x="286" y="76" width="188" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">处理层</text>
      <text x="380" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">逐行转换 / 校验 / 聚合</text>
      <text x="380" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">错误行决定跳过还是中断</text>
      <text x="380" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免 `ReadAll` 吃满内存</text>

      <rect x="536" y="76" width="190" height="108" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="631" y="100" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">输出链路</text>
      <text x="631" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">csv.Writer -> HTTP / file</text>
      <text x="631" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">逐行 Write</text>
      <text x="631" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">最后 Flush() + Error()</text>
      <text x="631" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">否则尾部可能还在缓冲里</text>
    </svg>

    <svg
      v-else-if="kind === 'gob-type-stream'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="gob 自描述流图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">gob 的关键特征是“自描述流”：首次发某种类型时，会先发类型描述，再发值；后续同类型值就只发数据本体</text>

      <rect x="34" y="88" width="130" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="99" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Encoder.Encode(v)</text>
      <text x="99" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">第一次见到类型</text>

      <line x1="164" y1="112" x2="280" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="280" y="64" width="200" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="88" text-anchor="middle" font-size="11" fill="var(--d-text)">gob stream</text>
      <text x="380" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">typeId -> wireType 描述</text>
      <text x="380" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">再跟 value payload</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">后续相同类型复用已有 typeId</text>

      <line x1="480" y1="112" x2="588" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="588" y="74" width="138" height="76" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="657" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Decoder</text>
      <text x="657" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">缓存 typeId -> 本地类型</text>
      <text x="657" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">按字段名匹配解码</text>

      <rect x="174" y="188" width="412" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="206" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">这也是 gob 适合 Go 内部 RPC / IPC 的原因：不用单独 schema 文件，但也因此不适合跨语言协议边界</text>
    </svg>

    <svg
      v-else-if="kind === 'gob-register'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="gob Register 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">接口值通过 gob 传输时，真正关键的是先 `Register` 具体实现类型，否则 Decoder 根本不知道该落到哪个 concrete type</text>

      <rect x="36" y="86" width="166" height="62" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="119" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Canvas{ Shapes []Shape }</text>
      <text x="119" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">里面放 Rect / Tri</text>

      <line x1="202" y1="117" x2="314" y2="117" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="314" y="68" width="132" height="98" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="90" text-anchor="middle" font-size="11" fill="var(--d-text)">gob.Register</text>
      <text x="380" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Rect{}</text>
      <text x="380" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Tri{}</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">建立名字 -> 类型映射</text>

      <line x1="446" y1="117" x2="558" y2="117" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="558" y="86" width="168" height="62" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="642" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">解码时恢复具体类型</text>
      <text x="642" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">再塞回接口字段</text>

      <rect x="178" y="184" width="404" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="202" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">没注册时，普通结构体字段仍能解，但接口字段常会直接失败，这也是 gob 在复杂接口模型里最容易被忘的前置条件</text>
    </svg>

    <svg
      v-else-if="kind === 'hex-encode-dump'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="hex 编码与 dump 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">十六进制编码的核心比 Base64 更直接：每个字节拆成高 4 位和低 4 位，各自查一次 16 进制字符表</text>

      <rect x="38" y="82" width="118" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="103" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">byte 0xAB</text>
      <text x="97" y="121" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">高4位 A / 低4位 B</text>

      <line x1="156" y1="108" x2="270" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="270" y="68" width="192" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="366" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">hextable</text>
      <text x="366" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">0123456789abcdef</text>
      <text x="366" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">1 byte -> 2 chars</text>

      <line x1="462" y1="108" x2="576" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="576" y="60" width="150" height="96" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="651" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">输出形态</text>
      <text x="651" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`deadbeef`</text>
      <text x="651" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`hex.Dump(data)`</text>
      <text x="651" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">地址 + hex + ASCII 预览</text>

      <rect x="160" y="182" width="440" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="200" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">解码时最常见的两个错误也最朴素：奇数长度和非 `[0-9a-fA-F]` 字符；`DecodeString` 在入口就会把它们拦下来</text>
    </svg>

    <svg
      v-else-if="kind === 'xml-tag-mapping'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="XML 标签映射图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">XML 标签映射比 JSON 更复杂，因为它不仅有“字段名”，还有属性、文本节点、嵌套路径和命名空间</text>

      <rect x="28" y="62" width="250" height="150" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="153" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">struct tags</text>
      <text x="153" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">xml:"person"</text>
      <text x="153" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">xml:"id,attr"</text>
      <text x="153" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">xml:",chardata"</text>
      <text x="153" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">xml:"contact>email"</text>
      <text x="153" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">xml:"ns name"</text>

      <line x1="278" y1="137" x2="384" y2="137" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="384" y="62" width="348" height="150" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="558" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">XML 结果形态</text>
      <text x="558" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">&lt;person id="1"&gt;</text>
      <text x="558" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">&lt;name&gt;Alice&lt;/name&gt;</text>
      <text x="558" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">&lt;contact&gt;&lt;email&gt;...&lt;/email&gt;&lt;/contact&gt;</text>
      <text x="558" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">属性、文本节点、子元素可以同时出现</text>
      <text x="558" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">命名空间通过 `xml.Name{Space, Local}` 体现</text>

      <text x="380" y="234" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这也是 XML 比 JSON 更适合文档和协议封装的原因，但反过来，标签语义也更容易复杂到需要直接下到 `Token()` 级别处理</text>
    </svg>

    <svg
      v-else-if="kind === 'xml-token-stream'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="XML Token 流图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">大 XML 文件场景里，真正可控的主线是 `Decoder.Token()`：边读边产出 token，命中目标元素后再选择手工处理或 `DecodeElement`</text>

      <rect x="30" y="86" width="126" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="93" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">io.Reader</text>
      <text x="93" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">XML stream</text>

      <line x1="156" y1="110" x2="266" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="266" y="64" width="202" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="367" y="88" text-anchor="middle" font-size="11" fill="var(--d-text)">xml.Decoder.Token()</text>
      <text x="367" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">StartElement / EndElement</text>
      <text x="367" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CharData / Comment / ProcInst</text>
      <text x="367" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">逐 token 前进，不必整文档入内存</text>

      <line x1="468" y1="110" x2="580" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="468" y1="110" x2="580" y2="128" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="580" y="74" width="148" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="654" y="95" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">手工 switch token 处理</text>
      <rect x="580" y="118" width="148" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="654" y="139" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">命中 StartElement 后 DecodeElement</text>

      <rect x="170" y="184" width="420" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="202" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">当输入不是 UTF-8 时，要先给 `CharsetReader`；否则 Token 流还没开始，解码就会在字符集阶段失败</text>
    </svg>

    <svg
      v-else-if="kind === 'websocket-hub-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="WebSocket Hub 并发模型图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">WebSocket 线上实现最关键的不是握手本身，而是读写并发模型：每个连接一读一写，广播统一交给 Hub，避免多人同时写同一条连接</text>

      <rect x="24" y="82" width="156" height="104" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="102" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Upgrader.Upgrade</text>
      <text x="102" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">HTTP 101 握手成功</text>
      <text x="102" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">得到 *websocket.Conn</text>
      <text x="102" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">register client 到 Hub</text>

      <line x1="180" y1="134" x2="286" y2="134" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="286" y="60" width="188" height="148" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="84" text-anchor="middle" font-size="11" fill="var(--d-text)">Hub</text>
      <text x="380" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">register / unregister / broadcast</text>
      <text x="380" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">单 goroutine 管 clients map</text>
      <text x="380" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">慢客户端 send 满了就踢掉</text>
      <text x="380" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免锁着一堆 conn 并发写</text>

      <line x1="474" y1="134" x2="580" y2="98" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="474" y1="134" x2="580" y2="170" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="580" y="74" width="156" height="56" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="658" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">readPump</text>
      <text x="658" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ReadMessage -> broadcast</text>
      <rect x="580" y="146" width="156" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="658" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">writePump</text>
      <text x="658" y="186" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">send chan 串行写 + ping/pong 保活</text>

      <text x="380" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">gorilla/websocket 明确要求同一连接写操作串行，所以“每 client 一个 writePump”不是风格选择，而是正确性前提</text>
    </svg>
  </DiagramFrame>
</template>
