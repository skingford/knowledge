<script setup lang="ts">
type DiagramKind =
  | 'traffic-entry-chain'
  | 'l4-l7-termination-map'
  | 'ingress-controller-chain'
  | 'gateway-controller-attachment-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'traffic-entry-chain'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 服务暴露与流量入口链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-entry" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 24 - 入口链路通常不是“Client 直接打 Pod”，而是要分清外层入口、L7 路由、Service 和后端 Pod 各自的职责
      </text>

      <rect x="30" y="124" width="112" height="64" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="86" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="86" y="168" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Browser / App / Partner</text>

      <rect x="170" y="112" width="146" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="243" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">外层入口</text>
      <text x="243" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">LB / WAF / API Gateway</text>
      <text x="243" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">公网 IP、DDoS、防护</text>

      <rect x="344" y="112" width="154" height="88" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="421" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Ingress / Gateway API</text>
      <text x="421" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Host / Path / TLS / Header</text>
      <text x="421" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">七层规则汇聚</text>

      <rect x="526" y="112" width="132" height="88" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="592" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Service</text>
      <text x="592" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ClusterIP / NodePort / LB</text>
      <text x="592" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">稳定后端入口</text>

      <rect x="686" y="124" width="144" height="64" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="758" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod</text>
      <text x="758" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">业务容器真正处理请求</text>

      <line x1="142" y1="156" x2="170" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-entry)" />
      <line x1="316" y1="156" x2="344" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-entry)" />
      <line x1="498" y1="156" x2="526" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-entry)" />
      <line x1="658" y1="156" x2="686" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-entry)" />

      <rect x="118" y="242" width="624" height="60" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="266" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">最常见误区</text>
      <text x="430" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Ingress / Gateway 不是 Service 替代品；Service 也不是公网入口治理层；真实源地址和 TLS 终止位置要单独讨论</text>
    </svg>

    <svg
      v-else-if="kind === 'l4-l7-termination-map'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 四层七层与 TLS 终止图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-l4l7" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 25 - 四层和七层入口的重点不一样：L4 更关注透传，L7 更关注路由、TLS 终止和头部治理
      </text>

      <rect x="54" y="98" width="332" height="178" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="220" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">L4 链路</text>
      <text x="220" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Service.type=LoadBalancer / NodePort</text>
      <text x="220" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">更偏四层转发、TCP/UDP、较少改写应用语义</text>
      <text x="220" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">配合 externalTrafficPolicy: Local 时更容易保留源地址</text>
      <text x="220" y="208" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">TLS 可能在后端应用或专用代理层终止</text>
      <rect x="132" y="228" width="176" height="26" rx="13" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="220" y="246" text-anchor="middle" font-size="9" fill="var(--d-text)">适合 TCP、gRPC、需更强透传的场景</text>

      <rect x="474" y="98" width="332" height="178" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="640" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">L7 链路</text>
      <text x="640" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Ingress / Gateway API HTTPRoute</text>
      <text x="640" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Host / Path / Header / TLS / Redirect</text>
      <text x="640" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">更常在入口处终止 TLS，并通过 X-Forwarded-For / Proxy Protocol 传递来源信息</text>
      <text x="640" y="208" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">适合统一证书、路由、灰度和鉴权治理</text>
      <rect x="548" y="228" width="184" height="26" rx="13" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="640" y="246" text-anchor="middle" font-size="9" fill="var(--d-text)">适合大多数 HTTP / HTTPS 网关场景</text>

      <line x1="386" y1="186" x2="474" y2="186" stroke="var(--d-arrow)" stroke-width="1.7" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-l4l7)" />
      <text x="430" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">核心差别不是“谁更高级”，而是谁负责更多七层语义</text>

      <rect x="118" y="308" width="624" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="325" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        真实客户端地址、TLS 终止、证书治理、路径路由，最好不要放在同一句里混着答
      </text>
    </svg>

    <svg
      v-else-if="kind === 'ingress-controller-chain'"
      viewBox="0 0 860 376"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Ingress Controller 实现链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-ingress-controller" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 38 - `Ingress` 不会自己变成可用入口，真正让它生效的是 `IngressClass` 绑定的 controller，以及它背后的代理和外部地址分配
      </text>

      <rect x="32" y="124" width="118" height="64" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="91" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Ingress</text>
      <text x="91" y="168" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Host / Path / TLS</text>

      <rect x="180" y="110" width="132" height="92" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="246" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">IngressClass</text>
      <text x="246" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">spec.controller</text>
      <text x="246" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">决定由谁接管</text>

      <rect x="342" y="96" width="156" height="120" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="420" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Ingress Controller</text>
      <text x="420" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">watch Ingress / Service</text>
      <text x="420" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">EndpointSlice / Secret</text>
      <text x="420" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">生成并下发代理配置</text>

      <rect x="528" y="110" width="140" height="92" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="598" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Proxy / LB</text>
      <text x="598" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">NGINX / Envoy / Cloud LB</text>
      <text x="598" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">真正接收公网流量</text>

      <rect x="698" y="124" width="130" height="64" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="763" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Service</text>
      <text x="763" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">稳定后端目标</text>

      <line x1="150" y1="156" x2="180" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-ingress-controller)" />
      <line x1="312" y1="156" x2="342" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-ingress-controller)" />
      <line x1="498" y1="156" x2="528" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-ingress-controller)" />
      <line x1="668" y1="156" x2="698" y2="156" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-ingress-controller)" />

      <path d="M598 202 C598 256, 420 256, 420 216" fill="none" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-ingress-controller)" />
      <text x="604" y="236" text-anchor="start" font-size="9" fill="var(--d-text-sub)">地址分配、状态回写</text>

      <rect x="122" y="282" width="616" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="301" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        `Ingress` 没地址、规则不生效，先查 class 和 controller，不要一上来先怀疑后端 Pod
      </text>
    </svg>

    <svg
      v-else-if="kind === 'gateway-controller-attachment-map'"
      viewBox="0 0 860 386"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Gateway Controller 附着关系图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-gateway-controller" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 39 - Gateway API 更像“实现类别 + 入口实例 + 路由附着关系”的模型，是否真的生效要看 `GatewayClass` 接管和 Route 附着是否成功
      </text>

      <rect x="44" y="100" width="156" height="102" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="122" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">GatewayClass</text>
      <text x="122" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">spec.controllerName</text>
      <text x="122" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">决定谁来实现</text>

      <rect x="236" y="88" width="160" height="126" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="316" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Gateway Controller</text>
      <text x="316" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">接管 GatewayClass</text>
      <text x="316" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">管理地址、监听器、数据面</text>
      <text x="316" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">更新 conditions / addresses</text>

      <rect x="432" y="100" width="152" height="102" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="508" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Gateway</text>
      <text x="508" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">listeners / addresses</text>
      <text x="508" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">allowedRoutes</text>

      <rect x="620" y="88" width="196" height="126" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="718" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">HTTPRoute / Route</text>
      <text x="718" y="136" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">parentRefs 指向 Gateway</text>
      <text x="718" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">匹配规则 -> backend Service</text>
      <text x="718" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">能否附着取决于信任边界</text>

      <line x1="200" y1="151" x2="236" y2="151" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-gateway-controller)" />
      <line x1="396" y1="151" x2="432" y2="151" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-gateway-controller)" />
      <line x1="584" y1="151" x2="620" y2="151" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-gateway-controller)" />

      <path d="M508 202 C508 254, 718 254, 718 214" fill="none" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-gateway-controller)" />
      <text x="610" y="240" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Route 附着后，controller 才会真正编程入口</text>

      <rect x="142" y="286" width="576" height="60" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="312" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">最常见卡点</text>
      <text x="430" y="332" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`gatewayClassName` 不匹配、controller 不健康、`parentRefs` 写错、`allowedRoutes` 不允许、后端 Service 不存在</text>
    </svg>
  </div>
</template>
