<script setup lang="ts">
type DiagramKind =
  | 'pdb-eviction-drain-chain'
  | 'disruption-budget-boundary-map'
  | 'priority-preemption-scheduling-chain'
  | 'priority-preemption-boundary-map'
  | 'daemonset-node-resident-chain'
  | 'daemonset-update-and-drain-boundary-map'
  | 'networkpolicy-enforcement-chain'
  | 'networkpolicy-selector-logic'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'pdb-eviction-drain-chain'"
      viewBox="0 0 860 402"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s PDB Eviction API drain 维护链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pdb-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 72 - `PDB` 不直接迁 Pod；真正的维护链路通常是 `kubectl drain` 发起 eviction，由 apiserver 按 budget 决定放行还是拒绝
      </text>

      <rect x="28" y="106" width="138" height="96" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="97" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">维护发起方</text>
      <text x="97" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">平台运维</text>
      <text x="97" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">节点升级 / 迁移</text>
      <text x="97" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">人工或自动化维护</text>

      <rect x="198" y="92" width="166" height="124" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="281" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">`kubectl drain`</text>
      <text x="281" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">先 cordon</text>
      <text x="281" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">再尝试迁走节点上的 Pod</text>
      <text x="281" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">默认优先走 eviction</text>
      <rect x="229" y="188" width="104" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="281" y="202" text-anchor="middle" font-size="9" fill="var(--d-text)">默认尊重预算</text>

      <rect x="396" y="92" width="168" height="124" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="480" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Eviction API</text>
      <text x="480" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">apiserver 收到 eviction 请求</text>
      <text x="480" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">检查目标 Pod 命中的 `PDB`</text>
      <text x="480" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看 `disruptionsAllowed` 是否够</text>
      <rect x="428" y="188" width="104" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="480" y="202" text-anchor="middle" font-size="9" fill="var(--d-text)">预算闸门</text>

      <rect x="596" y="92" width="236" height="124" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="714" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">`PDB` 当前状态</text>
      <text x="714" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">`currentHealthy / desiredHealthy`</text>
      <text x="714" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">`disruptionsAllowed`</text>
      <text x="714" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">决定这次驱逐是放行还是拒绝</text>
      <rect x="661" y="188" width="106" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="714" y="202" text-anchor="middle" font-size="9" fill="var(--d-text)">别只看 YAML</text>

      <line x1="166" y1="154" x2="198" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pdb-chain)" />
      <line x1="364" y1="154" x2="396" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pdb-chain)" />
      <line x1="564" y1="154" x2="596" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pdb-chain)" />

      <rect x="112" y="270" width="286" height="84" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="255" y="298" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">预算允许</text>
      <text x="255" y="318" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">eviction 被接受</text>
      <text x="255" y="336" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">Pod 进入正常终止链路</text>

      <rect x="462" y="270" width="286" height="84" rx="16" fill="var(--d-danger-bg)" stroke="var(--d-danger-border)" />
      <text x="605" y="298" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-danger-text)">预算不允许</text>
      <text x="605" y="318" text-anchor="middle" font-size="10" fill="var(--d-danger-text)">常见表现：`429 Too Many Requests`</text>
      <text x="605" y="336" text-anchor="middle" font-size="10" fill="var(--d-danger-text)">`drain` 重试 / 等待，不是集群一定坏了</text>

      <line x1="650" y1="216" x2="308" y2="270" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-pdb-chain)" />
      <line x1="778" y1="216" x2="552" y2="270" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-pdb-chain)" />

      <path d="M281 216 C281 244, 424 244, 424 320" fill="none" stroke="var(--d-danger-text)" stroke-width="1.5" stroke-dasharray="6 4" marker-end="url(#k8s-arrow-pdb-chain)" />
      <text x="368" y="246" text-anchor="middle" font-size="9" fill="var(--d-danger-text)">`--disable-eviction` / 直接 `delete pod` 会绕过 PDB</text>
    </svg>

    <svg
      v-else-if="kind === 'disruption-budget-boundary-map'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s disruption budget 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-disruption-map" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 73 - 讲 `PDB` 时要先分清四类场景：维护驱逐、故障中断、工作负载 rollout、直接 delete；它们不是一条控制线
      </text>

      <rect x="28" y="92" width="188" height="246" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="122" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">维护驱逐</text>
      <text x="122" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`kubectl drain`</text>
      <text x="122" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Eviction API</text>
      <text x="122" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">节点迁移 / 缩容</text>
      <text x="122" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`PDB` 有效</text>
      <text x="122" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">核心问题：预算是否允许</text>
      <rect x="74" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="122" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">预算主场</text>

      <rect x="234" y="92" width="188" height="246" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">故障中断</text>
      <text x="328" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">节点宕机</text>
      <text x="328" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">宿主机丢失</text>
      <text x="328" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">网络分区 / 节点失联</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`PDB` 无法阻止</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">核心问题：故障收敛与容灾</text>
      <rect x="280" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">不是预算线</text>

      <rect x="440" y="92" width="188" height="246" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="534" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">工作负载 rollout</text>
      <text x="534" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Deployment 更新</text>
      <text x="534" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">StatefulSet 逐个替换</text>
      <text x="534" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">看策略和 readiness 收敛</text>
      <text x="534" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不由 `PDB` 直接控节奏</text>
      <text x="534" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">核心问题：发布速度与零停机</text>
      <rect x="486" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="534" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">不是 rollout 控制器</text>

      <rect x="646" y="92" width="188" height="246" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="740" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">直接 delete / 绕过</text>
      <text x="740" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`kubectl delete pod`</text>
      <text x="740" y="164" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`drain --disable-eviction`</text>
      <text x="740" y="182" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">预算闸门不参与</text>
      <text x="740" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险：一次少掉太多副本</text>
      <text x="740" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">核心问题：是不是绕过保护</text>
      <rect x="692" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="740" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">最危险的快路径</text>

      <line x1="216" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-disruption-map)" />
      <line x1="422" y1="206" x2="440" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-disruption-map)" />
      <line x1="628" y1="206" x2="646" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-disruption-map)" />

      <rect x="96" y="356" width="668" height="26" rx="13" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="374" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先分场景，再谈预算；节点压力下的 `Evicted` 也不走这条 `PDB -> Eviction API -> drain` 维护链
      </text>
    </svg>

    <svg
      v-else-if="kind === 'priority-preemption-scheduling-chain'"
      viewBox="0 0 860 408"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s PriorityClass 与 Preemption 调度让路链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-priority-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 74 - 优先级先影响排队顺序；只有正常调度失败后，scheduler 才可能进入 preemption，在单个节点上选择低优先级 victim 为更高优先级 Pod 让路
      </text>

      <rect x="20" y="112" width="148" height="100" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="94" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pending Pod P</text>
      <text x="94" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`priorityClassName`</text>
      <text x="94" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">高优先级只是先排</text>
      <text x="94" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不是直接落地</text>

      <rect x="194" y="96" width="170" height="132" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="279" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Scheduler 正常调度</text>
      <text x="279" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">先按优先级排队</text>
      <text x="279" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">再跑 Filter / Score</text>
      <text x="279" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">看 requests、亲和、污点、PVC</text>
      <rect x="236" y="192" width="86" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="279" y="206" text-anchor="middle" font-size="9" fill="var(--d-text)">先看可行性</text>

      <rect x="390" y="96" width="170" height="132" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="475" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">PostFilter / Preemption</text>
      <text x="475" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">所有节点都放不下</text>
      <text x="475" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">才尝试在某个节点上</text>
      <text x="475" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">移走更低优先级 victim</text>
      <rect x="432" y="192" width="86" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="475" y="206" text-anchor="middle" font-size="9" fill="var(--d-text)">不是默认必走</text>

      <rect x="586" y="84" width="248" height="156" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="710" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">候选节点 N</text>
      <text x="710" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">挑出比 P 更低优先级的 victim</text>
      <text x="710" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">victim 先终止，不是瞬间消失</text>
      <text x="710" y="164" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Pod P 可能写入 `nominatedNodeName`</text>
      <rect x="642" y="182" width="136" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="710" y="196" text-anchor="middle" font-size="9" fill="var(--d-text)">只是候选，不是承诺</text>

      <line x1="168" y1="162" x2="194" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-priority-chain)" />
      <line x1="364" y1="162" x2="390" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-priority-chain)" />
      <line x1="560" y1="162" x2="586" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-priority-chain)" />

      <rect x="90" y="286" width="312" height="82" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="246" y="314" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">成功路径</text>
      <text x="246" y="334" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">victim 退出后资源真正空出来</text>
      <text x="246" y="352" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">Pod P 才有机会最终绑定节点</text>

      <rect x="454" y="286" width="316" height="82" rx="16" fill="var(--d-danger-bg)" stroke="var(--d-danger-border)" />
      <text x="612" y="314" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-danger-text)">失败或变化路径</text>
      <text x="612" y="334" text-anchor="middle" font-size="10" fill="var(--d-danger-text)">硬约束仍不满足、victim 退太慢</text>
      <text x="612" y="352" text-anchor="middle" font-size="10" fill="var(--d-danger-text)">或更高优先级 Pod 抢先来到，P 仍可能继续 Pending</text>

      <line x1="664" y1="240" x2="332" y2="286" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-priority-chain)" />
      <line x1="760" y1="240" x2="552" y2="286" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-priority-chain)" />
    </svg>

    <svg
      v-else-if="kind === 'priority-preemption-boundary-map'"
      viewBox="0 0 860 408"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s PriorityClass 与 Preemption 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-priority-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 75 - 讲优先级时要先分清四层边界：排队顺序、单节点让路、硬约束不可绕、以及它和 `PDB` / 节点压力驱逐根本不是一条控制线
      </text>

      <rect x="28" y="92" width="188" height="248" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="122" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">PriorityClass</text>
      <text x="122" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">表达相对重要性</text>
      <text x="122" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">影响 pending 队列顺序</text>
      <text x="122" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不等于直接调度成功</text>
      <text x="122" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">核心问题：</text>
      <text x="122" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">谁更值得先排</text>
      <rect x="74" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="122" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">先排，不是直通</text>

      <rect x="234" y="92" width="188" height="248" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Preemption</text>
      <text x="328" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">只在正常调度失败后考虑</text>
      <text x="328" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">只在单个节点上找 victim</text>
      <text x="328" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`nominatedNodeName` 只是候选</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">核心问题：</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">谁该为谁让路</text>
      <rect x="280" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">单节点让路</text>

      <rect x="440" y="92" width="188" height="248" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="534" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">硬约束</text>
      <text x="534" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`requests`、节点亲和</text>
      <text x="534" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`taints/tolerations`、PVC</text>
      <text x="534" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">拓扑与 Pod 亲和/反亲和</text>
      <text x="534" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">核心问题：</text>
      <text x="534" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">这件事到底可能吗</text>
      <rect x="486" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="534" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">绕不过硬约束</text>

      <rect x="646" y="92" width="188" height="248" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="740" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">其他控制线</text>
      <text x="740" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`PDB` 在 preemption 里是 best effort</text>
      <text x="740" y="164" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`drain` 是维护驱逐</text>
      <text x="740" y="182" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">节点压力驱逐是 kubelet 自保</text>
      <text x="740" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">核心问题：</text>
      <text x="740" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">别把多条线混成一条</text>
      <rect x="692" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="740" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">不是同一机制</text>

      <line x1="216" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-priority-boundary)" />
      <line x1="422" y1="206" x2="440" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-priority-boundary)" />
      <line x1="628" y1="206" x2="646" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-priority-boundary)" />

      <rect x="120" y="360" width="620" height="26" rx="13" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="378" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先问能不能放，再问谁先排；放不下才谈让路，别把 preemption、drain、节点压力驱逐混成一句
      </text>
    </svg>

    <svg
      v-else-if="kind === 'daemonset-node-resident-chain'"
      viewBox="0 0 860 402"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s DaemonSet 节点驻留收敛链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-daemonset-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 76 - DaemonSet 真正管的不是“总副本数”，而是“所有符合条件的节点上都得有一份”；节点变化、标签变化后，controller 会持续补齐或回收
      </text>

      <rect x="26" y="106" width="156" height="104" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="104" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">DaemonSet 模板</text>
      <text x="104" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`nodeSelector`</text>
      <text x="104" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`nodeAffinity`</text>
      <text x="104" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`tolerations`</text>

      <rect x="214" y="92" width="182" height="132" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="305" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">DaemonSet controller</text>
      <text x="305" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">先计算 eligible nodes</text>
      <text x="305" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">为每个目标节点创建一份 Pod</text>
      <text x="305" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">节点新增/删除/标签变化后继续收敛</text>
      <rect x="258" y="188" width="94" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="305" y="202" text-anchor="middle" font-size="9" fill="var(--d-text)">节点覆盖面控制</text>

      <rect x="428" y="84" width="182" height="148" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="519" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">目标节点集合</text>
      <text x="519" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">node-a</text>
      <text x="519" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">node-b</text>
      <text x="519" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">node-c</text>
      <text x="519" y="180" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只看符合条件的节点</text>
      <rect x="469" y="196" width="100" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="519" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">不是固定副本数</text>

      <rect x="642" y="84" width="192" height="148" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="738" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">每节点一份 Pod</text>
      <text x="738" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">agent@node-a</text>
      <text x="738" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">agent@node-b</text>
      <text x="738" y="164" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">agent@node-c</text>
      <text x="738" y="180" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">节点守护进程、日志、监控、CNI、CSI</text>
      <rect x="693" y="196" width="90" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="738" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">节点驻留语义</text>

      <line x1="182" y1="158" x2="214" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-daemonset-chain)" />
      <line x1="396" y1="158" x2="428" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-daemonset-chain)" />
      <line x1="610" y1="158" x2="642" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-daemonset-chain)" />

      <rect x="100" y="276" width="662" height="78" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="431" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">排障时先别问“现在总共有几份”，要先问“哪些节点本来就该有，哪些节点本来就不该有”</text>
      <text x="431" y="326" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">Node 集合变化、label 变化、taint 变化，都会改变 DaemonSet 最终应该覆盖到的节点面</text>
    </svg>

    <svg
      v-else-if="kind === 'daemonset-update-and-drain-boundary-map'"
      viewBox="0 0 860 408"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s DaemonSet 更新与 drain 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-daemonset-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 77 - 讲 DaemonSet 时要先分清四层边界：节点覆盖面、自动 toleration、drain 忽略、更新策略；它不是普通副本服务的另一种写法
      </text>

      <rect x="28" y="92" width="188" height="248" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="122" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">节点覆盖面</text>
      <text x="122" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">每个符合条件的节点一份</text>
      <text x="122" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不是固定副本数</text>
      <text x="122" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Node 变化会触发补齐/回收</text>
      <text x="122" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">核心问题：</text>
      <text x="122" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">哪些节点本来就该有</text>
      <rect x="74" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="122" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">先分节点集合</text>

      <rect x="234" y="92" width="188" height="248" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">自动 toleration</text>
      <text x="328" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`unschedulable`</text>
      <text x="328" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`not-ready / unreachable`</text>
      <text x="328" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">压力 taint 与 `hostNetwork` 特例</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">核心问题：</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">为什么它比普通 Pod 更能忍</text>
      <rect x="280" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">别按普通 Pod 推演</text>

      <rect x="440" y="92" width="188" height="248" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="534" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">`drain` 边界</text>
      <text x="534" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`drain` 默认不删 DaemonSet Pod</text>
      <text x="534" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">通常要 `--ignore-daemonsets` 才继续</text>
      <text x="534" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">删了也会被 controller 补回</text>
      <text x="534" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">核心问题：</text>
      <text x="534" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">维护迁谁，不迁谁</text>
      <rect x="486" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="534" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">不是漏删，是设计如此</text>

      <rect x="646" y="92" width="188" height="248" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="740" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">更新策略</text>
      <text x="740" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`RollingUpdate` 自动替换</text>
      <text x="740" y="164" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`OnDelete` 手动删才升级</text>
      <text x="740" y="182" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`maxUnavailable / maxSurge / minReadySeconds`</text>
      <text x="740" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">核心问题：</text>
      <text x="740" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">节点级能力怎么滚更安全</text>
      <rect x="692" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="740" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">按节点而不是按服务副本去想</text>

      <line x1="216" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-daemonset-boundary)" />
      <line x1="422" y1="206" x2="440" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-daemonset-boundary)" />
      <line x1="628" y1="206" x2="646" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-daemonset-boundary)" />

      <rect x="116" y="360" width="628" height="26" rx="13" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="378" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：Deployment 管副本数，StatefulSet 管成员身份，DaemonSet 管节点覆盖面；这三条工作负载语义不能混
      </text>
    </svg>

    <svg
      v-else-if="kind === 'networkpolicy-enforcement-chain'"
      viewBox="0 0 860 370"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s NetworkPolicy 生效链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-np-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 36 - 东西向连接能否打通，不只看目标让不让进，还要看源能不能出；真正执行隔离的是底层 CNI
      </text>

      <rect x="28" y="124" width="124" height="66" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="90" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Source Pod</text>
      <text x="90" y="170" text-anchor="middle" font-size="9" fill="var(--d-client-text)">发起调用</text>

      <rect x="178" y="110" width="144" height="94" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="250" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Egress Policy</text>
      <text x="250" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">源 Pod 是否允许出</text>
      <text x="250" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">default deny 后必须显式放行</text>

      <rect x="358" y="110" width="144" height="94" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="430" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">CNI Enforcer</text>
      <text x="430" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">真正执行策略</text>
      <text x="430" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不支持就不会生效</text>

      <rect x="538" y="110" width="144" height="94" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="610" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Ingress Policy</text>
      <text x="610" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">目标 Pod 是否允许进</text>
      <text x="610" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">selector 决定来源集合</text>

      <rect x="708" y="124" width="124" height="66" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="770" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Dest Pod</text>
      <text x="770" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">真正接收流量</text>

      <line x1="152" y1="157" x2="178" y2="157" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-np-chain)" />
      <line x1="322" y1="157" x2="358" y2="157" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-np-chain)" />
      <line x1="502" y1="157" x2="538" y2="157" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-np-chain)" />
      <line x1="682" y1="157" x2="708" y2="157" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-np-chain)" />

      <rect x="110" y="248" width="640" height="82" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="274" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">最常见误判</text>
      <text x="430" y="294" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">DNS 能解析、Service 正常，不代表连接一定能建立</text>
      <text x="430" y="310" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">真正要同时看：源 egress、目标 ingress、CNI 是否支持策略、DNS 是否也被一起挡了</text>
    </svg>

    <svg
      v-else-if="kind === 'networkpolicy-selector-logic'"
      viewBox="0 0 860 382"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s NetworkPolicy selector 语义图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-np-selector" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 37 - `podSelector`、`namespaceSelector` 最容易写错的不是字段名，而是你脑子里到底想的是同 namespace、跨 namespace 的 AND，还是多个条件的 OR
      </text>

      <rect x="36" y="92" width="182" height="116" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="127" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">`podSelector`</text>
      <text x="127" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">默认更像当前 namespace 内</text>
      <text x="127" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 Pod label 选目标</text>

      <rect x="238" y="92" width="182" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="329" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">`namespaceSelector`</text>
      <text x="329" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">先选 namespace</text>
      <text x="329" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">再决定范围</text>

      <rect x="440" y="92" width="182" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="531" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">同一条目里同时写</text>
      <text x="531" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`namespaceSelector + podSelector`</text>
      <text x="531" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">更像 AND</text>

      <rect x="642" y="92" width="182" height="116" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="733" y="120" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">拆成两个列表项</text>
      <text x="733" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">一项 namespaceSelector</text>
      <text x="733" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">一项 podSelector，更像 OR</text>

      <line x1="218" y1="150" x2="238" y2="150" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-np-selector)" />
      <line x1="420" y1="150" x2="440" y2="150" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-np-selector)" />
      <line x1="622" y1="150" x2="642" y2="150" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-np-selector)" />

      <rect x="116" y="246" width="628" height="96" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="272" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">经验法则</text>
      <text x="430" y="292" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">集群内身份优先用 label selector，不要优先想到 `ipBlock`</text>
      <text x="430" y="308" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">跨 namespace 访问先想 namespaceSelector；需要更精确时再叠 podSelector</text>
      <text x="430" y="324" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">如果 policy 行为和你预期相反，先回头检查自己写出来的是 AND 还是 OR</text>
    </svg>
  </div>
</template>
