<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'request-routing'
  | 'reverse-proxy-chain'
  | 'troubleshooting-flow'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'request-routing': '860px',
  'reverse-proxy-chain': '860px',
  'troubleshooting-flow': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'request-routing'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nginx 请求路由主线图"
    >
      <defs>
        <marker id="nginx-route-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        理解 Nginx 的第一步不是背配置项，而是看清一次请求先选 server，再选 location，最后决定本地返回还是转给上游
      </text>

      <rect x="46" y="98" width="126" height="88" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="109" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="109" y="148" text-anchor="middle" font-size="10" fill="var(--d-client-text)">Host + URI</text>
      <text x="109" y="164" text-anchor="middle" font-size="10" fill="var(--d-client-text)">HTTP / HTTPS</text>

      <rect x="232" y="88" width="154" height="108" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="309" y="118" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">listen / server_name</text>
      <text x="309" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先按端口和域名</text>
      <text x="309" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">选中一个 server</text>

      <rect x="446" y="88" width="154" height="108" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="523" y="118" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">location 匹配</text>
      <text x="523" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">`=` / 前缀 / `^~` / 正则</text>
      <text x="523" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">决定处理规则</text>

      <rect x="680" y="76" width="136" height="60" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="748" y="101" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">静态资源</text>
      <text x="748" y="119" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">root / alias / try_files</text>

      <rect x="680" y="150" width="136" height="60" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="748" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">反向代理</text>
      <text x="748" y="193" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">proxy_pass / upstream</text>

      <line x1="172" y1="142" x2="232" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-route-arrow)" />
      <line x1="386" y1="142" x2="446" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-route-arrow)" />
      <line x1="600" y1="132" x2="680" y2="106" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-route-arrow)" />
      <line x1="600" y1="152" x2="680" y2="180" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-route-arrow)" />

      <rect x="198" y="232" width="464" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="254" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        一句话记法：先按端口和域名选站点，再按 URI 选规则，最后才谈静态返回、重写还是反向代理
      </text>
    </svg>

    <svg
      v-else-if="kind === 'reverse-proxy-chain'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nginx 反向代理链路图"
    >
      <defs>
        <marker id="nginx-proxy-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        反向代理的核心不是“把请求转一下”，而是把 TLS 终止、头部透传、超时和 upstream 池一起放到入口层统一治理
      </text>

      <rect x="38" y="106" width="128" height="82" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="102" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">浏览器 / 客户端</text>
      <text x="102" y="156" text-anchor="middle" font-size="10" fill="var(--d-client-text)">HTTPS / WebSocket</text>

      <rect x="238" y="82" width="220" height="130" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="348" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Nginx 入口层</text>
      <text x="348" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">TLS termination / redirect</text>
      <text x="348" y="154" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Host / X-Forwarded-* / Real-IP</text>
      <text x="348" y="172" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">timeout / buffering / upgrade</text>

      <rect x="530" y="82" width="140" height="130" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="600" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">upstream 池</text>
      <text x="600" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">round robin</text>
      <text x="600" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">least_conn / ip_hash</text>
      <text x="600" y="172" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">keepalive</text>

      <rect x="726" y="82" width="92" height="54" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="772" y="106" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">app-1</text>
      <text x="772" y="123" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">8080</text>

      <rect x="726" y="158" width="92" height="54" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="772" y="182" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">app-2</text>
      <text x="772" y="199" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">8080</text>

      <line x1="166" y1="148" x2="238" y2="148" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-proxy-arrow)" />
      <line x1="458" y1="148" x2="530" y2="148" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-proxy-arrow)" />
      <line x1="670" y1="132" x2="726" y2="109" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-proxy-arrow)" />
      <line x1="670" y1="162" x2="726" y2="185" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-proxy-arrow)" />

      <rect x="174" y="236" width="512" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="258" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        面试里最稳的说法：Nginx 统一对外接流量，对内补协议、头部和超时治理，再把请求分发给一组可替换的上游实例
      </text>
    </svg>

    <svg
      v-else-if="kind === 'troubleshooting-flow'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nginx 排障顺序图"
    >
      <defs>
        <marker id="nginx-ops-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        排障不要先改配置碰运气，最稳的路径通常是：先校验配置，再看日志，再测连通性，最后才回到上游业务代码
      </text>

      <rect x="42" y="108" width="148" height="72" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="116" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">1. 配置校验</text>
      <text x="116" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`nginx -t` / `nginx -T`</text>

      <rect x="246" y="108" width="148" height="72" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="320" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">2. 日志定位</text>
      <text x="320" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">access log / error log</text>

      <rect x="450" y="108" width="148" height="72" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="524" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">3. 连通性验证</text>
      <text x="524" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">`curl` / `ss -lntp` / upstream</text>

      <rect x="654" y="108" width="164" height="72" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="736" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">4. 回到业务侧</text>
      <text x="736" y="156" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">慢 SQL / 超时 / 上游异常</text>

      <line x1="190" y1="144" x2="246" y2="144" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-ops-arrow)" />
      <line x1="394" y1="144" x2="450" y2="144" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-ops-arrow)" />
      <line x1="598" y1="144" x2="654" y2="144" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#nginx-ops-arrow)" />

      <rect x="174" y="222" width="512" height="40" rx="20" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="239" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">状态码记法：403 看权限和访问控制，404 看路径映射，502 看上游可达性，504 看上游处理时延</text>
      <text x="430" y="255" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正稳定的值班动作不是背命令，而是固定排查顺序和证据链</text>
    </svg>
  </DiagramFrame>
</template>
