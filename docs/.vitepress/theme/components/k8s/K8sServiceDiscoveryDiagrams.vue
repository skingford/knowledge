<script setup lang="ts">
type DiagramKind =
  | 'service-discovery-chain'
  | 'service-dns-answer-map'
  | 'endpointslice-reconcile-chain'
  | 'endpoint-conditions-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'service-discovery-chain'"
      viewBox="0 0 860 374"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 服务发现链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-discovery" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 34 - 业务访问服务名时，中间先过的是 DNS 与服务发现链路：Pod 的 resolv.conf → CoreDNS → Service VIP 或成员记录
      </text>

      <rect x="28" y="108" width="118" height="66" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">App / Pod</text>
      <text x="87" y="154" text-anchor="middle" font-size="9" fill="var(--d-client-text)">访问 service name</text>

      <rect x="174" y="94" width="152" height="94" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="250" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">/etc/resolv.conf</text>
      <text x="250" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">search domains</text>
      <text x="250" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">cluster DNS server</text>
      <text x="250" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ndots / dnsPolicy</text>

      <rect x="354" y="94" width="150" height="94" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="429" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">CoreDNS</text>
      <text x="429" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">名字解析</text>
      <text x="429" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">普通 Service / Headless</text>
      <text x="429" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">外部域名再转上游 DNS</text>

      <rect x="532" y="94" width="144" height="94" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="604" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">普通 Service</text>
      <text x="604" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">返回 ClusterIP</text>
      <text x="604" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">后续交给 kube-proxy</text>
      <text x="604" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">做数据面转发</text>

      <rect x="704" y="94" width="128" height="94" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="768" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Headless</text>
      <text x="768" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">返回成员记录</text>
      <text x="768" y="158" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">更偏成员发现</text>
      <text x="768" y="174" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">常配 StatefulSet</text>

      <line x1="146" y1="141" x2="174" y2="141" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-discovery)" />
      <line x1="326" y1="141" x2="354" y2="141" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-discovery)" />
      <line x1="504" y1="128" x2="532" y2="128" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-discovery)" />
      <line x1="504" y1="154" x2="704" y2="154" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-discovery)" />

      <rect x="92" y="238" width="676" height="82" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="264" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">关键边界</text>
      <text x="430" y="284" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">CoreDNS 负责把名字翻译成稳定目标，不负责真正转发流量</text>
      <text x="430" y="300" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">普通 Service 更像统一入口，Headless Service 更像成员发现入口</text>
    </svg>

    <svg
      v-else-if="kind === 'service-dns-answer-map'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 普通 Service 与 Headless Service DNS 返回差异图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-dns-map" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 35 - 同样是访问服务名，普通 Service 和 Headless Service 的 DNS 返回结果完全不是一个心智模型
      </text>

      <rect x="48" y="92" width="344" height="198" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="220" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">普通 Service</text>
      <text x="220" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`service.namespace.svc.cluster.local`</text>

      <rect x="120" y="164" width="200" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="220" y="186" text-anchor="middle" font-size="10" fill="var(--d-text)">DNS 返回：ClusterIP</text>

      <line x1="220" y1="198" x2="220" y2="220" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-dns-map)" />

      <rect x="120" y="228" width="200" height="34" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="220" y="250" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">后续由 kube-proxy 选 Pod</text>

      <rect x="468" y="92" width="344" height="198" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="640" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Headless Service</text>
      <text x="640" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">`clusterIP: None`</text>

      <rect x="536" y="164" width="208" height="34" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="640" y="186" text-anchor="middle" font-size="10" fill="var(--d-text)">DNS 返回：成员记录 / Pod 地址</text>

      <line x1="640" y1="198" x2="640" y2="220" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-dns-map)" />

      <rect x="520" y="228" width="102" height="34" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="571" y="250" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">mysql-0</text>

      <rect x="629" y="228" width="102" height="34" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="680" y="250" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">mysql-1</text>

      <line x1="392" y1="186" x2="468" y2="186" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-dns-map)" />
      <text x="430" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">左边解决统一入口，右边解决成员发现</text>

      <rect x="108" y="320" width="644" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="337" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        只要你在脑子里把两者都想成“DNS 到一个 IP”，后面的 StatefulSet、kube-proxy、排障都容易答乱
      </text>
    </svg>

    <svg
      v-else-if="kind === 'endpointslice-reconcile-chain'"
      viewBox="0 0 860 388"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s EndpointSlice 后端收敛链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-endpointslice-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 70 - Service 不直接保存后端；真正决定当前后端集合的，是 selector、Pod 状态和 EndpointSlice controller 收敛出来的 EndpointSlice
      </text>

      <rect x="24" y="112" width="136" height="98" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="92" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Service</text>
      <text x="92" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">selector</text>
      <text x="92" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ports</text>
      <text x="92" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定入口，不是后端明细</text>

      <rect x="190" y="94" width="162" height="134" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="271" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">匹配中的 Pod</text>
      <text x="271" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">selector 命中</text>
      <text x="271" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">readiness 变化</text>
      <text x="271" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">删除 / terminating 变化</text>
      <rect x="223" y="188" width="96" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="271" y="204" text-anchor="middle" font-size="9" fill="var(--d-text)">输入事实</text>

      <rect x="382" y="94" width="166" height="134" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="465" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">EndpointSlice controller</text>
      <text x="465" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">根据 selector 和 Pod 状态</text>
      <text x="465" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">生成 / 更新 EndpointSlice</text>
      <text x="465" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">一个 Service 可能对应多个 slice</text>
      <rect x="417" y="188" width="96" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="465" y="204" text-anchor="middle" font-size="9" fill="var(--d-text)">控制面收敛</text>

      <rect x="578" y="80" width="258" height="162" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="707" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">EndpointSlice 集合</text>
      <text x="707" y="128" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">slice A / slice B / slice C</text>
      <text x="707" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">记录地址、端口、zone、targetRef</text>
      <text x="707" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">以及 `ready / serving / terminating`</text>
      <rect x="636" y="176" width="142" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="707" y="192" text-anchor="middle" font-size="9" fill="var(--d-text)">当前后端真相</text>
      <text x="707" y="220" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">被 kube-proxy / Ingress / Gateway / DNS 等消费者 watch</text>

      <line x1="160" y1="161" x2="190" y2="161" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-endpointslice-chain)" />
      <line x1="352" y1="161" x2="382" y2="161" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-endpointslice-chain)" />
      <line x1="548" y1="161" x2="578" y2="161" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-endpointslice-chain)" />

      <rect x="118" y="286" width="624" height="62" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="314" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">排障顺序</text>
      <text x="430" y="334" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        先看 Service 有没有选中，再看 EndpointSlice 有没有收敛成可用后端，最后才去看 kube-proxy 和节点规则
      </text>
    </svg>

    <svg
      v-else-if="kind === 'endpoint-conditions-boundary-map'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s EndpointSlice 条件边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-endpoint-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 71 - 讲 EndpointSlice 时，要先分清 Pod 运行状态、后端可用性、终止中连接处理和 `publishNotReadyAddresses` 这四层边界
      </text>

      <rect x="30" y="86" width="188" height="246" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">`Running` vs `Ready`</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`Running` 只是进程起来</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`Ready` 才更接近可接业务流量</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">别只看 Pod phase</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Pod 起来了，是否已算后端</text>
      <rect x="76" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">别只看 Running</text>

      <rect x="234" y="86" width="188" height="246" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Endpoint conditions</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`ready`: 常规流量可用性</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`serving`: 是否仍在真实响应</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`terminating`: 已进入终止流程</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">后端是不是该继续接新流量</text>
      <rect x="280" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">别混条件语义</text>

      <rect x="438" y="86" width="188" height="246" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">`publishNotReadyAddresses`</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">故意打破“Ready 才发布”默认语义</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">常见于 Headless / 成员发现</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不适合普通无状态服务乱开</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">是不是要提前暴露未就绪地址</text>
      <rect x="484" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">这是例外，不是默认</text>

      <rect x="642" y="86" width="188" height="246" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">发布期摘流量</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">终止中的 endpoint 通常 `ready=false`</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">但 `serving` 可能仍然是 `true`</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">这给连接 drain 留出空间</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">终止中的 Pod 是否已彻底不能服务</text>
      <rect x="688" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">区分新流量与尾部连接</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-endpoint-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-endpoint-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-endpoint-boundary)" />

      <rect x="116" y="352" width="628" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="371" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先分 `Running / Ready`，再分 `ready / serving / terminating`，最后再看是不是人为开启了 `publishNotReadyAddresses`
      </text>
    </svg>
  </div>
</template>
