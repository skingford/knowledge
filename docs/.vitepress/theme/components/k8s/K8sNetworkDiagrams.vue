<script setup lang="ts">
type DiagramKind =
  | 'ip-whitelist-patterns'
  | 'source-ip-preservation'
  | 'external-traffic-policy'
  | 'service-network-chain'
  | 'network-troubleshooting-playbook'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'ip-whitelist-patterns'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 动态 IP 与白名单处理图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-ip" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 6 - Pod IP 天生不稳定，真正要稳定的是“入口地址、服务名或出口 IP”，而不是 Pod 本身
      </text>

      <rect x="34" y="74" width="248" height="238" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="158" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">场景 A：集群内访问</text>
      <rect x="64" y="128" width="80" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="104" y="151" text-anchor="middle" font-size="10" fill="var(--d-text)">Client Pod</text>
      <rect x="170" y="128" width="76" height="38" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="208" y="151" text-anchor="middle" font-size="10" fill="var(--d-text)">Service</text>
      <line x1="144" y1="147" x2="170" y2="147" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-ip)" />
      <rect x="64" y="196" width="182" height="74" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="155" y="218" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">后端 Pod 集合</text>
      <text x="155" y="238" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">10.0.1.17</text>
      <text x="155" y="254" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">10.0.3.24</text>
      <text x="155" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">重建后 IP 会变，但 Service 名不变</text>
      <line x1="208" y1="166" x2="208" y2="196" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-ip)" />
      <text x="158" y="292" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">解决方式：用 Service DNS；如果要稳定到单实例，用 StatefulSet + Headless Service</text>

      <rect x="306" y="74" width="248" height="238" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">场景 B：外部系统访问我方服务</text>
      <rect x="334" y="128" width="88" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="378" y="151" text-anchor="middle" font-size="10" fill="var(--d-text)">合作方系统</text>
      <rect x="438" y="128" width="88" height="38" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="482" y="144" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">LB / Ingress</text>
      <text x="482" y="158" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">静态 IP / 域名</text>
      <line x1="422" y1="147" x2="438" y2="147" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-ip)" />
      <rect x="380" y="196" width="100" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="219" text-anchor="middle" font-size="10" fill="var(--d-text)">Service</text>
      <line x1="482" y1="166" x2="444" y2="196" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-ip)" />
      <text x="430" y="258" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">对方白名单应加 LoadBalancer / WAF / Ingress 的固定公网 IP</text>
      <text x="430" y="276" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不要让对方加 Pod IP，也不要默认加 Node IP</text>
      <text x="430" y="294" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">如果要保留客户端真实源地址，再考虑 `externalTrafficPolicy: Local` 等策略</text>

      <rect x="578" y="74" width="248" height="238" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="702" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">场景 C：我方服务访问第三方</text>
      <rect x="604" y="128" width="86" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="647" y="151" text-anchor="middle" font-size="10" fill="var(--d-text)">App Pod</text>
      <rect x="708" y="128" width="92" height="38" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="754" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">NAT / Egress</text>
      <text x="754" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">固定出口 IP</text>
      <line x1="690" y1="147" x2="708" y2="147" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-ip)" />
      <rect x="652" y="196" width="100" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="702" y="219" text-anchor="middle" font-size="10" fill="var(--d-text)">第三方系统</text>
      <line x1="754" y1="166" x2="728" y2="196" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-ip)" />
      <text x="702" y="258" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">第三方白名单应加固定出口 IP</text>
      <text x="702" y="276" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">常见做法：Cloud NAT、NAT Gateway、Egress Gateway、固定出口节点</text>
      <text x="702" y="294" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">外部看到的往往是 SNAT 后地址，不是 Pod IP</text>
    </svg>

    <svg
      v-else-if="kind === 'source-ip-preservation'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 真实客户端 IP 保留图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-source-ip" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 7 - “固定入口 IP” 和 “保留真实客户端 IP” 是两件事：一个解决白名单，一个解决审计和限流
      </text>

      <rect x="40" y="86" width="116" height="48" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.4" />
      <text x="98" y="115" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-client-text)">Client</text>

      <rect x="194" y="86" width="132" height="48" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="260" y="108" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">公网 LB / WAF</text>
      <text x="260" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">固定入口 IP</text>

      <rect x="364" y="86" width="132" height="48" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="430" y="108" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">Ingress / Gateway</text>
      <text x="430" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">HTTP 代理层</text>

      <rect x="534" y="86" width="104" height="48" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="586" y="115" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Service</text>

      <rect x="676" y="86" width="132" height="48" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="742" y="115" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Pod</text>

      <line x1="156" y1="110" x2="194" y2="110" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-source-ip)" />
      <line x1="326" y1="110" x2="364" y2="110" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-source-ip)" />
      <line x1="496" y1="110" x2="534" y2="110" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-source-ip)" />
      <line x1="638" y1="110" x2="676" y2="110" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-source-ip)" />

      <rect x="64" y="184" width="330" height="104" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="229" y="212" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">L7 代理路径：看 Header</text>
      <text x="229" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Ingress / Gateway 会把真实来源放进</text>
      <text x="229" y="254" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`X-Forwarded-For` / `X-Real-IP` / Proxy Protocol</text>
      <text x="229" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">应用侧必须只信任受控代理链，不能盲信任任意请求头</text>

      <rect x="466" y="184" width="330" height="104" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="631" y="212" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">L4 透传路径：看源地址</text>
      <text x="631" y="236" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">如果要尽量保留四层源地址，可看</text>
      <text x="631" y="254" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`externalTrafficPolicy: Local`、LB 透传能力、节点本地转发</text>
      <text x="631" y="272" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">代价是流量分布、健康检查和节点部署策略会更敏感</text>

      <line x1="430" y1="134" x2="250" y2="184" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-source-ip)" />
      <line x1="260" y1="134" x2="610" y2="184" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-source-ip)" />

      <rect x="188" y="306" width="484" height="22" rx="11" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.1" />
      <text x="430" y="321" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">
        固定入口 IP 解决“别人该连谁”；真实源地址保留解决“后端如何知道是谁发来的”
      </text>
    </svg>

    <svg
      v-else-if="kind === 'external-traffic-policy'"
      viewBox="0 0 860 376"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="externalTrafficPolicy Cluster 与 Local 对比图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-etp" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 8 - `externalTrafficPolicy` 解决的是外部流量怎么进 Service：`Cluster` 更均衡，`Local` 更保留源地址
      </text>

      <rect x="34" y="66" width="370" height="264" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="219" y="94" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">模式 A：`Cluster`</text>

      <rect x="66" y="120" width="94" height="38" rx="10" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="113" y="143" text-anchor="middle" font-size="10" fill="var(--d-client-text)">Client</text>
      <rect x="188" y="120" width="90" height="38" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="233" y="143" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">LB / Node</text>
      <rect x="308" y="120" width="66" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="341" y="143" text-anchor="middle" font-size="10" fill="var(--d-text)">kube-proxy</text>
      <line x1="160" y1="139" x2="188" y2="139" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-etp)" />
      <line x1="278" y1="139" x2="308" y2="139" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-etp)" />

      <rect x="84" y="206" width="116" height="52" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="142" y="228" text-anchor="middle" font-size="11" fill="var(--d-text)">Node A</text>
      <text x="142" y="244" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本机无 Pod 也可转发</text>

      <rect x="236" y="206" width="116" height="52" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="294" y="228" text-anchor="middle" font-size="11" fill="var(--d-text)">Node B</text>
      <text x="294" y="244" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可能跨节点转给 Pod</text>

      <line x1="341" y1="158" x2="160" y2="206" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#k8s-arrow-etp)" />
      <line x1="341" y1="158" x2="294" y2="206" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#k8s-arrow-etp)" />

      <rect x="92" y="282" width="254" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="219" y="301" text-anchor="middle" font-size="10" fill="var(--d-text)">优点：更均衡、更宽松；代价：源地址可能被二次 NAT 看不见真实客户端</text>

      <rect x="456" y="66" width="370" height="264" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="641" y="94" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-rv-b-text)">模式 B：`Local`</text>

      <rect x="490" y="120" width="94" height="38" rx="10" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="537" y="143" text-anchor="middle" font-size="10" fill="var(--d-client-text)">Client</text>
      <rect x="612" y="120" width="90" height="38" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="657" y="143" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">LB / Node</text>
      <rect x="730" y="120" width="66" height="38" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="763" y="143" text-anchor="middle" font-size="10" fill="var(--d-text)">本机 Pod</text>
      <line x1="584" y1="139" x2="612" y2="139" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-etp)" />
      <line x1="702" y1="139" x2="730" y2="139" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-etp)" />

      <rect x="486" y="206" width="126" height="52" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="549" y="228" text-anchor="middle" font-size="11" fill="var(--d-text)">Node A</text>
      <text x="549" y="244" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">有本地 Pod，能接流量</text>

      <rect x="670" y="206" width="126" height="52" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="733" y="228" text-anchor="middle" font-size="11" fill="var(--d-text)">Node B</text>
      <text x="733" y="244" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">无本地 Pod，不该接流量</text>

      <line x1="657" y1="158" x2="549" y2="206" stroke="var(--d-arrow)" stroke-width="1.3" marker-end="url(#k8s-arrow-etp)" />
      <line x1="657" y1="158" x2="733" y2="206" stroke="var(--d-arrow)" stroke-width="1.3" stroke-dasharray="5 4" />

      <rect x="496" y="282" width="290" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="641" y="301" text-anchor="middle" font-size="10" fill="var(--d-text)">优点：更容易保留源地址；代价：要保证每个接流量节点上真的有本地 Pod</text>

      <rect x="202" y="346" width="456" height="20" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="360" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">
        `Local` 不是更高级的默认值，它只是用更苛刻的流量分布约束，换源地址可见性
      </text>
    </svg>

    <svg
      v-else-if="kind === 'service-network-chain'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Service 到 Pod 网络链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-network-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 9 - K8s 网络排障别乱试命令，先沿着这条链路看：Service → EndpointSlice → kube-proxy → CNI → Pod
      </text>

      <rect x="30" y="110" width="120" height="54" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="90" y="133" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="90" y="149" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Pod / Node / LB</text>

      <rect x="174" y="110" width="112" height="54" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="230" y="133" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Service</text>
      <text x="230" y="149" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">VIP / Port / Selector</text>

      <rect x="310" y="110" width="126" height="54" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="373" y="133" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">EndpointSlice</text>
      <text x="373" y="149" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">后端 Pod 列表</text>

      <rect x="460" y="110" width="118" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="519" y="133" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">kube-proxy</text>
      <text x="519" y="149" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">iptables / IPVS</text>

      <rect x="602" y="110" width="98" height="54" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="651" y="133" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">CNI</text>
      <text x="651" y="149" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">路由 / Overlay</text>

      <rect x="724" y="110" width="106" height="54" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="777" y="133" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">Pod</text>
      <text x="777" y="149" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">容器监听端口</text>

      <line x1="150" y1="137" x2="174" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-chain)" />
      <line x1="286" y1="137" x2="310" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-chain)" />
      <line x1="436" y1="137" x2="460" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-chain)" />
      <line x1="578" y1="137" x2="602" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-chain)" />
      <line x1="700" y1="137" x2="724" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-chain)" />

      <rect x="62" y="214" width="736" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="233" text-anchor="middle" font-size="10" fill="var(--d-text)">
        任一环节都可能坏：Selector 选错、后端没进 EndpointSlice、代理规则没下发、CNI 不通、Pod 根本没监听
      </text>
    </svg>

    <svg
      v-else-if="kind === 'network-troubleshooting-playbook'"
      viewBox="0 0 860 352"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 网络排障流程图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-network-playbook" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 10 - 访问失败时的最短排障路径：先确认有没有后端，再确认有没有转发，最后再查网络与应用本身
      </text>

      <rect x="46" y="78" width="166" height="70" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="129" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">第一步：看 Service</text>
      <text x="129" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">名称、端口、selector</text>
      <text x="129" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">是不是指向对的工作负载</text>

      <rect x="248" y="78" width="166" height="70" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="331" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">第二步：看 EndpointSlice</text>
      <text x="331" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">后端有没有 Pod</text>
      <text x="331" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">readiness 失败会不会被摘掉</text>

      <rect x="450" y="78" width="166" height="70" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="533" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">第三步：看 kube-proxy</text>
      <text x="533" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">规则有没有下发</text>
      <text x="533" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">NodePort / ClusterIP 是否生效</text>

      <rect x="652" y="78" width="166" height="70" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="735" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">第四步：看 CNI / Pod</text>
      <text x="735" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">跨节点网络是否可达</text>
      <text x="735" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">容器端口是否真的在监听</text>

      <line x1="212" y1="113" x2="248" y2="113" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-playbook)" />
      <line x1="414" y1="113" x2="450" y2="113" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-playbook)" />
      <line x1="616" y1="113" x2="652" y2="113" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-network-playbook)" />

      <rect x="120" y="214" width="620" height="82" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">经验法则</text>
      <text x="430" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`curl Service 不通` 不等于一定是 CNI 问题</text>
      <text x="430" y="276" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">很多时候是 selector 错了、readiness 挂了、EndpointSlice 里根本没有后端</text>
      <text x="430" y="292" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">排障顺序越靠近控制面对象，越容易快速定位，不要一上来就抓包</text>
    </svg>
  </div>
</template>
