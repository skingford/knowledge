<script setup lang="ts">
type DiagramKind =
  | 'east-west-mesh-chain'
  | 'mesh-boundary-map'
  | 'node-execution-chain'
  | 'sandbox-runtime-network-storage'
  | 'service-dataplane-chain'
  | 'iptables-vs-ipvs-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'east-west-mesh-chain'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Service Mesh 东西向链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-mesh-eastwest" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 28 - 东西向流量里，Service 负责稳定目标，Mesh 在两端代理之间补上身份、策略和观测
      </text>

      <rect x="34" y="102" width="174" height="112" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="121" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pod A</text>
      <rect x="52" y="144" width="64" height="44" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="84" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">App</text>
      <rect x="126" y="144" width="64" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="158" y="171" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Sidecar</text>

      <rect x="256" y="116" width="132" height="84" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="322" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Service</text>
      <text x="322" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">稳定服务名</text>
      <text x="322" y="178" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">后端选择</text>

      <rect x="436" y="102" width="174" height="112" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="523" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod B</text>
      <rect x="454" y="144" width="64" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="486" y="171" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Sidecar</text>
      <rect x="528" y="144" width="64" height="44" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="560" y="171" text-anchor="middle" font-size="10" fill="var(--d-text)">App</text>

      <line x1="190" y1="166" x2="256" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-mesh-eastwest)" />
      <line x1="388" y1="158" x2="454" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-mesh-eastwest)" />

      <rect x="206" y="248" width="448" height="72" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="274" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Mesh 叠加的能力</text>
      <text x="430" y="294" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">mTLS / timeout / retry / circuit breaking / telemetry / traffic split</text>

      <rect x="294" y="48" width="272" height="40" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="430" y="72" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Control Plane：下发路由、证书、策略与观测配置</text>

      <line x1="382" y1="88" x2="158" y2="144" stroke="var(--d-arrow)" stroke-width="1.3" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-mesh-eastwest)" />
      <line x1="478" y1="88" x2="486" y2="144" stroke="var(--d-arrow)" stroke-width="1.3" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-mesh-eastwest)" />
    </svg>

    <svg
      v-else-if="kind === 'mesh-boundary-map'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Service Mesh 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-mesh-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 29 - K8s 各层职责不要混：CNI 管连通，Service 管稳定目标，Ingress/Gateway 管南北向，Mesh 管东西向治理
      </text>

      <rect x="30" y="104" width="184" height="156" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="122" y="132" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">CNI</text>
      <text x="122" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod IP</text>
      <text x="122" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">跨节点连通</text>
      <text x="122" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">基础网络数据面</text>

      <rect x="234" y="104" width="184" height="156" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="326" y="132" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Service</text>
      <text x="326" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">稳定服务名</text>
      <text x="326" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">后端 Pod 抽象</text>
      <text x="326" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">基础负载分发</text>

      <rect x="438" y="104" width="184" height="156" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="530" y="132" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Ingress / Gateway</text>
      <text x="530" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">南北向入口</text>
      <text x="530" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Host / Path / TLS</text>
      <text x="530" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">公网暴露与入口治理</text>

      <rect x="642" y="104" width="188" height="156" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="132" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">Service Mesh</text>
      <text x="736" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">东西向治理</text>
      <text x="736" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">mTLS / retry / timeout</text>
      <text x="736" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">telemetry / egress</text>

      <line x1="214" y1="182" x2="234" y2="182" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-mesh-boundary)" />
      <line x1="418" y1="182" x2="438" y2="182" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-mesh-boundary)" />
      <line x1="622" y1="182" x2="642" y2="182" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-mesh-boundary)" />

      <rect x="128" y="290" width="604" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="309" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        Mesh 不是替换前面三层，而是叠加在它们之上；越底层的问题，越不该直接甩锅给 Mesh
      </text>
    </svg>

    <svg
      v-else-if="kind === 'node-execution-chain'"
      viewBox="0 0 860 368"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 节点执行链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-node-exec" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 30 - Pod 被调度到节点后，真正把它跑起来的是节点执行链路：kubelet 协调 runtime、CNI、CSI、镜像和探针
      </text>

      <rect x="26" y="118" width="116" height="62" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="84" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Bound Pod</text>
      <text x="84" y="162" text-anchor="middle" font-size="9" fill="var(--d-client-text)">已带 nodeName</text>

      <rect x="170" y="104" width="132" height="90" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="236" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">kubelet</text>
      <text x="236" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">syncPod 协调执行</text>
      <text x="236" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">拉配置、起探针、回写状态</text>

      <rect x="330" y="104" width="116" height="90" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="388" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">CRI</text>
      <text x="388" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">统一调用接口</text>
      <text x="388" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">连接 kubelet 与 runtime</text>

      <rect x="474" y="104" width="134" height="90" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="541" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">container runtime</text>
      <text x="541" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">sandbox / image / container</text>
      <text x="541" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">如 containerd / CRI-O</text>

      <rect x="636" y="90" width="188" height="56" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="730" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">CNI</text>
      <text x="730" y="134" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">配 Pod 网络和 IP</text>

      <rect x="636" y="158" width="188" height="56" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="730" y="184" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">CSI / volume manager</text>
      <text x="730" y="202" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">attach / mount 卷</text>

      <line x1="142" y1="149" x2="170" y2="149" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-exec)" />
      <line x1="302" y1="149" x2="330" y2="149" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-exec)" />
      <line x1="446" y1="149" x2="474" y2="149" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-exec)" />
      <line x1="608" y1="128" x2="636" y2="118" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-exec)" />
      <line x1="608" y1="170" x2="636" y2="186" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-exec)" />

      <rect x="162" y="250" width="536" height="74" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="276" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">结果阶段</text>
      <text x="430" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">init containers → app containers → startup/readiness/liveness → 状态回写 apiserver</text>
    </svg>

    <svg
      v-else-if="kind === 'sandbox-runtime-network-storage'"
      viewBox="0 0 860 372"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s sandbox runtime network storage 关系图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-sandbox-map" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 31 - 节点执行最容易卡的不是“应用逻辑”，而是 sandbox、配网、挂卷、镜像和 init 容器这几个前置阶段
      </text>

      <rect x="58" y="102" width="144" height="86" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="130" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pod sandbox</text>
      <text x="130" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">pause / netns</text>
      <text x="130" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod 级基础环境</text>

      <rect x="236" y="102" width="144" height="86" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="308" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">CNI 配网</text>
      <text x="308" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">IP / route / overlay</text>
      <text x="308" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">失败就可能卡在 Creating</text>

      <rect x="414" y="102" width="144" height="86" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="486" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">CSI 挂卷</text>
      <text x="486" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">attach / mount</text>
      <text x="486" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">卷没好主容器可能还没开始</text>

      <rect x="592" y="102" width="210" height="86" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="697" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">拉镜像 / init / 主容器启动</text>
      <text x="697" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ErrImagePull / RunContainerError / CrashLoopBackOff</text>
      <text x="697" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">已经比前面更靠近业务进程</text>

      <line x1="202" y1="145" x2="236" y2="145" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sandbox-map)" />
      <line x1="380" y1="145" x2="414" y2="145" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sandbox-map)" />
      <line x1="558" y1="145" x2="592" y2="145" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sandbox-map)" />

      <rect x="94" y="244" width="672" height="76" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="270" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">排障顺序</text>
      <text x="430" y="290" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先看 events 判断卡在前置基础环境还是应用启动，再决定去查 CNI、CSI、registry 还是应用日志</text>
    </svg>

    <svg
      v-else-if="kind === 'service-dataplane-chain'"
      viewBox="0 0 860 372"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Service 数据面链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-service-dp" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 32 - Service 不是直接“绑某个 Pod IP”，而是控制面维护后端集合，节点数据面把 VIP / NodePort 真正转到当前 Pod
      </text>

      <rect x="34" y="68" width="792" height="94" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="430" y="96" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">控制面对象</text>

      <rect x="86" y="108" width="148" height="36" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="160" y="131" text-anchor="middle" font-size="11" fill="var(--d-text)">Service</text>

      <rect x="286" y="108" width="164" height="36" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="368" y="131" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">EndpointSlice</text>

      <rect x="502" y="108" width="272" height="36" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="638" y="131" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">kube-proxy watch Service + EndpointSlice</text>

      <line x1="234" y1="126" x2="286" y2="126" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-service-dp)" />
      <line x1="450" y1="126" x2="502" y2="126" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-service-dp)" />

      <rect x="30" y="212" width="122" height="62" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="91" y="238" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="91" y="256" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Pod / Node / LB</text>

      <rect x="186" y="198" width="144" height="90" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="258" y="226" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Service VIP / NodePort</text>
      <text x="258" y="246" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定入口</text>
      <text x="258" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不是固定 Pod IP</text>

      <rect x="364" y="198" width="148" height="90" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="438" y="226" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">本机 kube-proxy</text>
      <text x="438" y="246" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">iptables / IPVS</text>
      <text x="438" y="262" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">把请求导向后端</text>

      <rect x="546" y="198" width="126" height="90" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="609" y="226" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">CNI / 路由</text>
      <text x="609" y="246" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">同节点直达</text>
      <text x="609" y="262" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">跨节点继续转发</text>

      <rect x="706" y="212" width="124" height="62" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="768" y="238" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod</text>
      <text x="768" y="256" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">真正监听端口</text>

      <line x1="152" y1="243" x2="186" y2="243" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-service-dp)" />
      <line x1="330" y1="243" x2="364" y2="243" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-service-dp)" />
      <line x1="512" y1="243" x2="546" y2="243" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-service-dp)" />
      <line x1="672" y1="243" x2="706" y2="243" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-service-dp)" />

      <rect x="108" y="318" width="644" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="337" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        心智模型：Service 管稳定入口，EndpointSlice 管后端集合，kube-proxy 管节点转发表，CNI 管真正连通
      </text>
    </svg>

    <svg
      v-else-if="kind === 'iptables-vs-ipvs-map'"
      viewBox="0 0 860 356"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s iptables 与 IPVS 心智模型对比图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-iptables-ipvs" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 33 - `iptables` 更像规则链，`IPVS` 更像虚拟服务表；两者的上游真相都还是 Service 和 EndpointSlice
      </text>

      <rect x="48" y="82" width="340" height="202" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="218" y="110" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">iptables</text>
      <text x="218" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">规则链匹配</text>

      <rect x="104" y="150" width="228" height="28" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="218" y="169" text-anchor="middle" font-size="9" fill="var(--d-text)">KUBE-SVC-xxx</text>
      <line x1="218" y1="178" x2="218" y2="198" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-iptables-ipvs)" />

      <rect x="86" y="202" width="118" height="28" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="145" y="221" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">KUBE-SEP-a</text>

      <rect x="232" y="202" width="118" height="28" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="291" y="221" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">KUBE-SEP-b</text>

      <line x1="145" y1="230" x2="145" y2="248" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-iptables-ipvs)" />
      <line x1="291" y1="230" x2="291" y2="248" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-iptables-ipvs)" />

      <text x="145" y="266" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod A:Port</text>
      <text x="291" y="266" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod B:Port</text>

      <rect x="474" y="82" width="340" height="202" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="644" y="110" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">IPVS</text>
      <text x="644" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">虚拟服务表</text>

      <rect x="554" y="150" width="180" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="644" y="172" text-anchor="middle" font-size="9" fill="var(--d-text)">VIP:Port</text>

      <line x1="644" y1="184" x2="644" y2="206" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-iptables-ipvs)" />

      <rect x="516" y="212" width="116" height="28" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="574" y="231" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Real Server A</text>

      <rect x="656" y="212" width="116" height="28" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="714" y="231" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Real Server B</text>

      <line x1="574" y1="240" x2="574" y2="258" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-iptables-ipvs)" />
      <line x1="714" y1="240" x2="714" y2="258" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-iptables-ipvs)" />

      <text x="574" y="276" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod A:Port</text>
      <text x="714" y="276" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod B:Port</text>

      <line x1="388" y1="184" x2="474" y2="184" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-iptables-ipvs)" />
      <text x="430" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">区别在节点实现方式，不在 Service 抽象本身</text>

      <rect x="122" y="314" width="616" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="331" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        回答时先讲“规则链 vs 虚拟服务表”，再补一句“上游都来自 EndpointSlice”，就够用了
      </text>
    </svg>
  </div>
</template>
