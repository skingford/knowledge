<script setup lang="ts">
type DiagramKind =
  | 'scheduling-decision-chain'
  | 'resource-pressure-outcomes'
  | 'resource-enforcement-chain'
  | 'requests-limits-qos-boundary-map'
  | 'namespace-resource-governance-chain'
  | 'limitrange-resourcequota-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'scheduling-decision-chain'"
      viewBox="0 0 860 332"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 调度决策链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-scheduling" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 15 - Pod 能不能被调度，不是只看有没有机器，而是要依次过资源、约束、污点和优先级几层判断
      </text>

      <rect x="34" y="106" width="150" height="82" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="109" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">PodSpec</text>
      <text x="109" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">requests / limits</text>
      <text x="109" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">nodeSelector / affinity</text>

      <rect x="214" y="106" width="150" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="289" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Scheduler Filter</text>
      <text x="289" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">requests 能否放下</text>
      <text x="289" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">节点约束是否满足</text>

      <rect x="394" y="106" width="150" height="82" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="469" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Taints / Priority</text>
      <text x="469" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">有没有 toleration</text>
      <text x="469" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">是否可能触发抢占</text>

      <rect x="574" y="106" width="112" height="82" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="630" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Bind</text>
      <text x="630" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">选定 Node</text>
      <text x="630" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">交给 kubelet 落地</text>

      <rect x="716" y="106" width="110" height="82" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="771" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Running</text>
      <text x="771" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">资源检查通过</text>
      <text x="771" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">容器启动</text>

      <line x1="184" y1="147" x2="214" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-scheduling)" />
      <line x1="364" y1="147" x2="394" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-scheduling)" />
      <line x1="544" y1="147" x2="574" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-scheduling)" />
      <line x1="686" y1="147" x2="716" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-scheduling)" />

      <rect x="114" y="228" width="632" height="62" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="250" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">排障提示</text>
      <text x="430" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`Pending` 先查 requests、亲和性、污点容忍和 PVC，不要一上来就怀疑 kubelet</text>
    </svg>

    <svg
      v-else-if="kind === 'resource-pressure-outcomes'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 资源压力结果图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pressure" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 16 - 资源问题至少要分清三类：调度不上是 Pending，容器超内存是 OOMKilled，节点扛不住是 Evicted
      </text>

      <rect x="46" y="108" width="176" height="82" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="134" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pending</text>
      <text x="134" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">调度前就卡住</text>
      <text x="134" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">requests / 约束不满足</text>

      <rect x="248" y="108" width="176" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="336" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">OOMKilled</text>
      <text x="336" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">容器运行中超内存 limits</text>
      <text x="336" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">通常是进程被内核杀掉</text>

      <rect x="450" y="108" width="176" height="82" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="538" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Evicted</text>
      <text x="538" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">节点内存 / 磁盘压力</text>
      <text x="538" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">kubelet 触发驱逐</text>

      <rect x="652" y="108" width="164" height="82" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="734" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">QoS / Priority</text>
      <text x="734" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">BestEffort 更先被驱逐</text>
      <text x="734" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">高优先级更不容易让路</text>

      <line x1="222" y1="149" x2="248" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-pressure)" />
      <line x1="424" y1="149" x2="450" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-pressure)" />
      <line x1="626" y1="149" x2="652" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-pressure)" />

      <rect x="118" y="232" width="624" height="84" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">QoS 记忆法</text>
      <text x="430" y="276" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Guaranteed：每个容器 requests = limits，最稳</text>
      <text x="430" y="292" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Burstable：设了 requests 或 limits，但不完全相等，最常见</text>
      <text x="430" y="308" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">BestEffort：啥都没设，最先在压力下吃亏</text>
    </svg>

    <svg
      v-else-if="kind === 'resource-enforcement-chain'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 资源规格到运行时执行链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-resource-enforcement" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 46 - 资源规格真正变成线上现象，要经过“声明 -> 调度 -> cgroups -> 节点压力”这条链；`Pending`、throttling、`OOMKilled` 分别卡在不同层
      </text>

      <rect x="28" y="102" width="128" height="66" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="92" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Pod YAML</text>
      <text x="92" y="148" text-anchor="middle" font-size="9" fill="var(--d-client-text)">`requests` / `limits`</text>

      <rect x="188" y="88" width="144" height="94" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="260" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">scheduler</text>
      <text x="260" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">主要看 `requests`</text>
      <text x="260" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">放不下就 `Pending`</text>

      <rect x="364" y="88" width="144" height="94" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="436" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">kubelet + runtime</text>
      <text x="436" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">把边界下发给 cgroups</text>
      <text x="436" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">真正开始运行时限制</text>

      <rect x="540" y="88" width="144" height="94" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="612" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">CPU Path</text>
      <text x="612" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">request 更像权重</text>
      <text x="612" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">limit 更像 throttling ceiling</text>

      <rect x="716" y="88" width="116" height="94" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="774" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Memory Path</text>
      <text x="774" y="136" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">limit 更像硬天花板</text>
      <text x="774" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">超限更常见 `OOMKilled`</text>

      <line x1="156" y1="135" x2="188" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-resource-enforcement)" />
      <line x1="332" y1="135" x2="364" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-resource-enforcement)" />
      <line x1="508" y1="135" x2="540" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-resource-enforcement)" />
      <line x1="684" y1="135" x2="716" y2="135" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-resource-enforcement)" />

      <rect x="118" y="252" width="180" height="82" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="208" y="280" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">CPU Throttling</text>
      <text x="208" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">进程还活着</text>
      <text x="208" y="316" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">但延迟、超时和尾延迟变差</text>

      <rect x="340" y="252" width="180" height="82" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="430" y="280" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">`OOMKilled`</text>
      <text x="430" y="300" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">容器自己打穿 memory limit</text>
      <text x="430" y="316" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">更像单容器边界问题</text>

      <rect x="562" y="252" width="180" height="82" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="652" y="280" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">`Evicted`</text>
      <text x="652" y="300" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">节点整体压力太大</text>
      <text x="652" y="316" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">更像节点自保和 QoS 问题</text>

      <path d="M612 182 C612 220, 240 220, 208 252" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-resource-enforcement)" />
      <path d="M774 182 C774 220, 462 220, 430 252" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-resource-enforcement)" />
      <path d="M436 182 C436 220, 620 220, 652 252" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-resource-enforcement)" />

      <rect x="148" y="352" width="564" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        最常见误判：`Pending`、CPU 慢、`OOMKilled`、`Evicted` 都叫“资源问题”，但责任边界和排障顺序完全不同
      </text>
    </svg>

    <svg
      v-else-if="kind === 'requests-limits-qos-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s requests limits QoS 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-resource-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 47 - 资源问题最容易答散的根因，是把 `requests`、`limits` 和 QoS 混成同一层；更稳的答法是先拆“调度依据”“运行时硬边界”“节点压力下的受保护程度”
      </text>

      <rect x="42" y="92" width="238" height="206" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="161" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">`requests`</text>
      <rect x="91" y="136" width="140" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="161" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：至少按多大算你</text>
      <text x="161" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">scheduler 看它决定能不能放下</text>
      <text x="161" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">CPU 争用时也更像权重</text>
      <text x="161" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不是运行时硬天花板</text>
      <rect x="77" y="248" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="161" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：排位与份额</text>

      <rect x="311" y="92" width="238" height="206" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="430" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">`limits`</text>
      <rect x="360" y="136" width="140" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：最多能冲多高</text>
      <text x="430" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">CPU 超限更常见 throttling</text>
      <text x="430" y="204" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Memory 超限更常见 `OOMKilled`</text>
      <text x="430" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不是 scheduler 的主要依据</text>
      <rect x="346" y="248" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：运行时硬边界</text>

      <rect x="580" y="92" width="238" height="206" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="699" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">QoS</text>
      <rect x="629" y="136" width="140" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="699" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：节点压力下谁先吃亏</text>
      <text x="699" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Guaranteed / Burstable / BestEffort</text>
      <text x="699" y="204" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">更像受保护程度</text>
      <text x="699" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不是性能档位，也不改 cgroup 原理</text>
      <rect x="615" y="248" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="699" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：驱逐优先级语义</text>

      <line x1="280" y1="190" x2="311" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-resource-boundary)" />
      <line x1="549" y1="190" x2="580" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-resource-boundary)" />

      <rect x="126" y="326" width="608" height="30" rx="15" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="346" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        更稳的资源心智模型：先看 `requests` 是否让你放得下，再看 `limits` 会把你压慢还是打死，最后看 QoS 在节点压力下会不会让你先被牺牲
      </text>
    </svg>

    <svg
      v-else-if="kind === 'namespace-resource-governance-chain'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Namespace 资源治理链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-namespace-governance" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 44 - Namespace 资源治理真正发生在准入链路上：先校验单对象和总预算，过关后对象才会进入调度阶段
      </text>

      <rect x="38" y="104" width="126" height="66" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="101" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Apply Pod / PVC</text>
      <text x="101" y="150" text-anchor="middle" font-size="9" fill="var(--d-client-text)">提交到某个 namespace</text>

      <rect x="198" y="90" width="132" height="94" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="264" y="118" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Namespace</text>
      <text x="264" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只提供归属边界</text>
      <text x="264" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不自带资源预算</text>

      <rect x="364" y="78" width="142" height="118" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="435" y="106" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">LimitRange</text>
      <text x="435" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">默认 `requests/limits`</text>
      <text x="435" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">单对象最小值 / 最大值</text>
      <text x="435" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">也可管 PVC 大小边界</text>

      <rect x="540" y="78" width="142" height="118" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="611" y="106" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">ResourceQuota</text>
      <text x="611" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">检查 namespace 总预算</text>
      <text x="611" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">compute / storage / object count</text>
      <text x="611" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不负责真实容量预留</text>

      <rect x="716" y="104" width="106" height="66" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="769" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Admitted</text>
      <text x="769" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">对象写入集群</text>

      <line x1="164" y1="137" x2="198" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-namespace-governance)" />
      <line x1="330" y1="137" x2="364" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-namespace-governance)" />
      <line x1="506" y1="137" x2="540" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-namespace-governance)" />
      <line x1="682" y1="137" x2="716" y2="137" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-namespace-governance)" />

      <rect x="138" y="250" width="214" height="84" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="245" y="278" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">Rejected: 403</text>
      <text x="245" y="298" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">没写 `requests/limits`</text>
      <text x="245" y="314" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">或 namespace 总预算已超</text>

      <rect x="508" y="250" width="214" height="84" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="615" y="278" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">scheduler / kubelet</text>
      <text x="615" y="298" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">真正通过后，才进入调度</text>
      <text x="615" y="314" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">这时才谈 `Pending` 和节点容量</text>

      <path d="M435 196 C435 234, 310 234, 245 250" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-namespace-governance)" />
      <path d="M611 196 C611 234, 245 234, 245 250" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-namespace-governance)" />
      <path d="M769 170 C769 214, 690 214, 615 250" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-namespace-governance)" />

      <rect x="142" y="352" width="576" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        最常见误判：Quota 拒绝创建是准入问题，不是 scheduler 问题；对象都没建成，就谈不上 `Pending`
      </text>
    </svg>

    <svg
      v-else-if="kind === 'limitrange-resourcequota-boundary-map'"
      viewBox="0 0 860 388"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s LimitRange 与 ResourceQuota 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-quota-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 45 - 回答资源治理问题时，先分清“单对象别乱来”和“整个团队别超账”，不要把 `LimitRange` 和 `ResourceQuota` 混成同一层
      </text>

      <rect x="56" y="92" width="226" height="206" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="169" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Namespace</text>
      <rect x="105" y="136" width="128" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="169" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：资源归属</text>
      <text x="169" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">逻辑隔离边界</text>
      <text x="169" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不是预算，不是默认值</text>
      <text x="169" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">通常还要配 RBAC / NetworkPolicy / Quota</text>
      <rect x="85" y="248" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="169" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：归属边界</text>

      <rect x="316" y="92" width="226" height="206" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="429" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">LimitRange</text>
      <rect x="365" y="136" width="128" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="429" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：单对象边界</text>
      <text x="429" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">默认 `requests/limits`</text>
      <text x="429" y="204" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">min / max / ratio / PVC size</text>
      <text x="429" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不是 namespace 总账</text>
      <rect x="345" y="248" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="429" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：默认值与单笔规则</text>

      <rect x="576" y="92" width="226" height="206" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="689" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">ResourceQuota</text>
      <rect x="625" y="136" width="128" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="689" y="155" text-anchor="middle" font-size="10" fill="var(--d-text)">关心：namespace 总账</text>
      <text x="689" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">compute / storage / object count</text>
      <text x="689" y="204" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">常见结果：超账就 403</text>
      <text x="689" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不是容量预留，也不影响存量对象</text>
      <rect x="605" y="248" width="168" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="689" y="267" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">关键词：累计预算</text>

      <line x1="282" y1="190" x2="316" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-quota-boundary)" />
      <line x1="542" y1="190" x2="576" y2="190" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-quota-boundary)" />

      <rect x="126" y="326" width="608" height="30" rx="15" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="346" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        更稳的最小组合：Namespace 划边界，LimitRange 补默认值和上下限，ResourceQuota 控总预算，再配 RBAC 与 NetworkPolicy 做完整治理
      </text>
    </svg>
  </div>
</template>
