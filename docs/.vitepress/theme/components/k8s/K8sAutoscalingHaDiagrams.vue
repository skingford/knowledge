<script setup lang="ts">
type DiagramKind =
  | 'autoscaling-control-chain'
  | 'hpa-vpa-ca-boundary-map'
  | 'replica-spread-ha-chain'
  | 'spread-constraint-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'autoscaling-control-chain'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 弹性扩缩容协同链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-autoscale-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 40 - 真正的弹性不是“开了 HPA 就结束”，而是指标、`requests`、调度、`Pending`、节点扩容和 `Ready` 一整条链路的接力
      </text>

      <rect x="32" y="98" width="114" height="64" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="89" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Load Spike</text>
      <text x="89" y="142" text-anchor="middle" font-size="9" fill="var(--d-client-text)">请求量 / 队列上升</text>

      <rect x="176" y="98" width="122" height="64" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="237" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Metrics</text>
      <text x="237" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CPU / Memory / QPS</text>

      <rect x="328" y="84" width="148" height="92" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="402" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">HPA</text>
      <text x="402" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">根据指标算目标副本数</text>
      <text x="402" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">修改 `scale` 子资源</text>

      <rect x="506" y="98" width="146" height="64" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="579" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Deployment / RS</text>
      <text x="579" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">创建新 Pod</text>

      <rect x="682" y="98" width="146" height="64" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="755" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">New Pods</text>
      <text x="755" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">等待调度与启动</text>

      <line x1="146" y1="130" x2="176" y2="130" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="298" y1="130" x2="328" y2="130" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="476" y1="130" x2="506" y2="130" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="652" y1="130" x2="682" y2="130" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-autoscale-chain)" />

      <rect x="248" y="226" width="148" height="70" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="322" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">scheduler</text>
      <text x="322" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 `requests` 和约束</text>
      <text x="322" y="286" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">尝试给 Pod 找节点</text>

      <rect x="42" y="226" width="164" height="70" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="124" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">Started + Ready</text>
      <text x="124" y="270" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">启动、探针通过</text>
      <text x="124" y="286" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">EndpointSlice 收敛后接流量</text>

      <rect x="438" y="226" width="138" height="70" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="507" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pending Pod</text>
      <text x="507" y="270" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">现有节点放不下</text>
      <text x="507" y="286" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">才轮到 CA 看见</text>

      <rect x="606" y="212" width="126" height="98" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="669" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Cluster Autoscaler</text>
      <text x="669" y="260" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">看不可调度 Pod</text>
      <text x="669" y="276" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">和节点组是否能扩</text>

      <rect x="762" y="226" width="82" height="70" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="803" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Node</text>
      <text x="803" y="270" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">新节点加入</text>
      <text x="803" y="286" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">集群后重试调度</text>

      <line x1="755" y1="162" x2="755" y2="196" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="682" y1="196" x2="322" y2="226" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="248" y1="261" x2="206" y2="261" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="396" y1="261" x2="438" y2="261" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="576" y1="261" x2="606" y2="261" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <line x1="732" y1="261" x2="762" y2="261" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-autoscale-chain)" />
      <path d="M803 226 C803 178, 560 182, 322 226" fill="none" stroke="var(--d-arrow)" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-autoscale-chain)" />

      <text x="213" y="218" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能放下</text>
      <text x="506" y="218" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">放不下</text>

      <rect x="164" y="336" width="532" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="355" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        VPA 更像旁路慢变量：持续校准 `requests`，让后续 HPA、调度和 CA 的判断更接近真实容量
      </text>
    </svg>

    <svg
      v-else-if="kind === 'hpa-vpa-ca-boundary-map'"
      viewBox="0 0 860 384"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s HPA VPA CA 边界分工图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-autoscale-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 41 - 回答弹性问题时，先分清是“副本数量”“单 Pod 规格”还是“集群容量”这三个层次，不要把它们混成一句“资源不够了”
      </text>

      <rect x="44" y="92" width="232" height="196" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="160" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">HPA</text>
      <rect x="96" y="134" width="128" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="160" y="153" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：副本够不够</text>
      <text x="160" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">输入：CPU / Memory / QPS / 外部指标</text>
      <text x="160" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">动作：改 `replicas` / `scale`</text>
      <text x="160" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不解决：加节点、慢启动、下游瓶颈</text>
      <rect x="76" y="242" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="160" y="261" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：实例数量</text>

      <rect x="314" y="92" width="232" height="196" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="430" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">VPA</text>
      <rect x="366" y="134" width="128" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="153" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：每个 Pod 该多大</text>
      <text x="430" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">输入：历史使用、推荐算法</text>
      <text x="430" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">动作：调 `requests` / 建议重建</text>
      <text x="430" y="222" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不解决：秒级突刺、即时横向扩容</text>
      <rect x="346" y="242" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="261" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：单实例规格</text>

      <rect x="584" y="92" width="232" height="196" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="700" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Cluster Autoscaler</text>
      <rect x="636" y="134" width="128" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="700" y="153" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：节点够不够</text>
      <text x="700" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">输入：`Pending` Pod + 约束 + 节点组</text>
      <text x="700" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">动作：改 node count</text>
      <text x="700" y="222" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不解决：OOM、探针失败、PVC 卡住</text>
      <rect x="616" y="242" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="700" y="261" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：集群容量</text>

      <line x1="276" y1="190" x2="314" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-autoscale-boundary)" />
      <line x1="546" y1="190" x2="584" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-autoscale-boundary)" />

      <rect x="116" y="318" width="628" height="30" rx="15" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="338" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        共同地基：`requests` 既影响 HPA 的资源利用率分母，也影响调度器和 CA 对“能不能放下”的判断
      </text>
    </svg>

    <svg
      v-else-if="kind === 'replica-spread-ha-chain'"
      viewBox="0 0 860 398"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 副本打散与拓扑高可用链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-replica-ha" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 42 - 高可用不是把 `replicas` 调大，而是让副本跨节点、跨可用区分布，并在 `drain` 或维护时控制一次最多少掉多少
      </text>

      <rect x="48" y="100" width="134" height="70" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="115" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Deployment / HPA</text>
      <text x="115" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先决定副本数</text>

      <rect x="214" y="86" width="176" height="98" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="302" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">scheduler</text>
      <text x="302" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">看 `requests`、节点约束</text>
      <text x="302" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">再看打散与拓扑规则</text>

      <rect x="430" y="86" width="170" height="98" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="515" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Spread Rules</text>
      <text x="515" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`podAntiAffinity`</text>
      <text x="515" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`topologySpreadConstraints`</text>

      <rect x="640" y="86" width="172" height="98" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="726" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Placement Result</text>
      <text x="726" y="134" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Node / Zone 分布</text>
      <text x="726" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">决定会不会一起受伤</text>

      <line x1="182" y1="135" x2="214" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-replica-ha)" />
      <line x1="390" y1="135" x2="430" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-replica-ha)" />
      <line x1="600" y1="135" x2="640" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-replica-ha)" />

      <rect x="110" y="248" width="204" height="86" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="212" y="276" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Node Failure / Zone Failure</text>
      <text x="212" y="296" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">如果副本集中，可能整组一起丢</text>
      <text x="212" y="312" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">如果已打散，通常只损失局部容量</text>

      <rect x="354" y="236" width="152" height="110" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="430" y="264" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">PDB</text>
      <text x="430" y="284" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">限制 voluntary disruption</text>
      <text x="430" y="300" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">时一次最多少掉多少副本</text>
      <text x="430" y="316" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">不防突然宕机</text>

      <rect x="546" y="248" width="204" height="86" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="648" y="276" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">`kubectl drain`</text>
      <text x="648" y="296" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">节点维护、升级、迁移</text>
      <text x="648" y="312" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">应尊重 eviction 与 PDB</text>

      <path d="M726 184 C726 224, 648 224, 648 248" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-replica-ha)" />
      <path d="M648 248 C648 220, 468 220, 430 236" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-replica-ha)" />
      <path d="M726 184 C726 224, 250 224, 212 248" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-replica-ha)" />

      <rect x="162" y="358" width="536" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="375" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        关键顺序：先有多个副本，再把它们打散到不同故障域，最后用 PDB 约束维护期的中断预算
      </text>
    </svg>

    <svg
      v-else-if="kind === 'spread-constraint-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 副本打散与高可用边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-spread-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 43 - 回答高可用分布问题时，先分清“别贴太近”“尽量分均匀”“维护时别一下少太多”这三层边界
      </text>

      <rect x="42" y="92" width="238" height="204" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="161" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">`podAntiAffinity`</text>
      <rect x="92" y="136" width="138" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="161" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：别贴太近</text>
      <text x="161" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">表达：不要同节点 / 同 zone</text>
      <text x="161" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优势：直观、容易起步</text>
      <text x="161" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">风险：硬约束容易把 Pod 卡成 Pending</text>
      <rect x="78" y="248" width="166" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="161" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：防共置</text>

      <rect x="310" y="92" width="238" height="204" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="429" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">`topologySpreadConstraints`</text>
      <rect x="360" y="136" width="138" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="429" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：整体分布均匀</text>
      <text x="429" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">表达：`maxSkew`、`topologyKey`</text>
      <text x="429" y="204" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优势：更适合 node / zone 双层打散</text>
      <text x="429" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">风险：标签不全或约束太硬也会卡调度</text>
      <rect x="346" y="248" width="166" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="429" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：控偏斜</text>

      <rect x="578" y="92" width="238" height="204" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="697" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">PDB</text>
      <rect x="628" y="136" width="138" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="697" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：维护期别少太多</text>
      <text x="697" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">表达：`minAvailable` / `maxUnavailable`</text>
      <text x="697" y="204" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优势：约束 voluntary disruption</text>
      <text x="697" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">风险：不是防宕机，也不是 rollout 节奏器</text>
      <rect x="614" y="248" width="166" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="697" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：中断预算</text>

      <line x1="280" y1="190" x2="310" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-spread-boundary)" />
      <line x1="548" y1="190" x2="578" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-spread-boundary)" />

      <rect x="122" y="326" width="616" height="30" rx="15" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="346" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        更稳的心智模型：先靠调度策略把副本散开，再靠 PDB 约束维护窗口，而不是把所有高可用问题都压到 replicas 上
      </text>
    </svg>
  </div>
</template>
