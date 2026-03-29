<script setup lang="ts">
type DiagramKind =
  | 'storage-data-chain'
  | 'volume-failure-playbook'
  | 'reconcile-loop-chain'
  | 'controller-family-map'
  | 'control-plane-mainline-chain'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'storage-data-chain'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 存储与数据链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-storage" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 19 - 存储链路要按申请、供给、绑定、挂载四步看：PVC 不是磁盘，StorageClass 也不是卷本身
      </text>

      <rect x="36" y="112" width="124" height="72" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="98" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Pod</text>
      <text x="98" y="158" text-anchor="middle" font-size="9" fill="var(--d-client-text)">通过 volume 使用数据</text>

      <rect x="192" y="112" width="124" height="72" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="254" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">PVC</text>
      <text x="254" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">应用对存储的申请单</text>

      <rect x="348" y="112" width="132" height="72" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="414" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">StorageClass</text>
      <text x="414" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">动态供给模板 / 策略</text>

      <rect x="512" y="112" width="120" height="72" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="572" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">CSI</text>
      <text x="572" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">创建 / attach / mount</text>

      <rect x="664" y="112" width="160" height="72" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="744" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">PV / Backend Disk</text>
      <text x="744" y="158" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">真实卷资源与回收策略</text>

      <line x1="160" y1="148" x2="192" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-storage)" />
      <line x1="316" y1="148" x2="348" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-storage)" />
      <line x1="480" y1="148" x2="512" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-storage)" />
      <line x1="632" y1="148" x2="664" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-storage)" />

      <rect x="122" y="230" width="616" height="68" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="254" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">关键区分</text>
      <text x="430" y="274" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">PVC 是申请，PV 是卷，StorageClass 是供给模板，CSI 是真正把卷做出来并挂上去的驱动层</text>
    </svg>

    <svg
      v-else-if="kind === 'volume-failure-playbook'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 存储故障排查图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-volume-playbook" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 20 - 存储问题先按现象分型：PVC Pending、挂载失败、Multi-Attach、删除后数据不见，根因并不一样
      </text>

      <rect x="40" y="98" width="178" height="82" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="129" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">PVC Pending</text>
      <text x="129" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">StorageClass 不存在</text>
      <text x="129" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">容量 / access mode 不匹配</text>

      <rect x="242" y="98" width="178" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="331" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Mount Failed</text>
      <text x="331" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">CSI / 节点插件异常</text>
      <text x="331" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">设备 attach / mount 失败</text>

      <rect x="444" y="98" width="178" height="82" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="533" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Multi-Attach</text>
      <text x="533" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">RWO 卷被多节点同时占用</text>
      <text x="533" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">旧实例未完全解绑</text>

      <rect x="646" y="98" width="174" height="82" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="733" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Data Lost</text>
      <text x="733" y="146" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">reclaimPolicy = Delete</text>
      <text x="733" y="162" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">误删 PVC / 后端卷</text>

      <line x1="218" y1="139" x2="242" y2="139" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-volume-playbook)" />
      <line x1="420" y1="139" x2="444" y2="139" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-volume-playbook)" />
      <line x1="622" y1="139" x2="646" y2="139" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-volume-playbook)" />

      <rect x="112" y="226" width="636" height="84" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="250" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">排障顺序</text>
      <text x="430" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先看 PVC/PV 状态和事件，再看 StorageClass / CSI，再回到具体节点挂载日志</text>
      <text x="430" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">如果是数据丢失，第一时间先确认 reclaimPolicy 和后端卷是否已被真正删除</text>
    </svg>

    <svg
      v-else-if="kind === 'reconcile-loop-chain'"
      viewBox="0 0 860 356"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Reconcile 控制循环图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-reconcile" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 21 - K8s 真正的“自动化”来自控制循环：声明进来后，控制器会反复把实际状态拉回期望状态
      </text>

      <rect x="34" y="116" width="124" height="74" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="96" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubectl / CI</text>
      <text x="96" y="162" text-anchor="middle" font-size="9" fill="var(--d-client-text)">提交 YAML / patch</text>

      <rect x="190" y="116" width="130" height="74" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="255" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">apiserver + etcd</text>
      <text x="255" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保存期望状态</text>

      <rect x="352" y="116" width="142" height="74" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="423" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Controller Watch</text>
      <text x="423" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">监听对象变化</text>

      <rect x="526" y="116" width="138" height="74" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="595" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Reconcile</text>
      <text x="595" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">创建 / 更新 / 删除</text>

      <rect x="696" y="116" width="130" height="74" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="761" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Scheduler / kubelet</text>
      <text x="761" y="162" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">把对象真的落到节点</text>

      <line x1="158" y1="153" x2="190" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-reconcile)" />
      <line x1="320" y1="153" x2="352" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-reconcile)" />
      <line x1="494" y1="153" x2="526" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-reconcile)" />
      <line x1="664" y1="153" x2="696" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-reconcile)" />

      <path d="M760 190 C760 264, 214 264, 214 190" fill="none" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-reconcile)" />
      <text x="488" y="274" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">实际状态变化后，控制器还会继续观察，如果仍不一致，就继续 reconcile</text>

      <rect x="152" y="300" width="556" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="317" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        删除 Pod 会自动恢复，不是因为 Pod 特殊，而是上层控制器还在持续维持目标状态
      </text>
    </svg>

    <svg
      v-else-if="kind === 'controller-family-map'"
      viewBox="0 0 860 364"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 控制器家族图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-controller-map" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 22 - 常见控制器不是各自孤立：Deployment、HPA、Operator 都是在围绕某个期望状态反复调谐
      </text>

      <rect x="74" y="92" width="188" height="96" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="168" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Deployment Controller</text>
      <text x="168" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">目标：副本数、版本、发布策略</text>
      <text x="168" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">动作：管理 ReplicaSet</text>
      <text x="168" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">再由 ReplicaSet 维持 Pod</text>

      <rect x="336" y="92" width="188" height="96" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="430" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">HPA Controller</text>
      <text x="430" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">目标：根据指标改副本数</text>
      <text x="430" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">动作：修改 scale 子资源</text>
      <text x="430" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不直接创建 Pod</text>

      <rect x="598" y="92" width="188" height="96" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="692" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">CRD + Operator</text>
      <text x="692" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">目标：自定义资源的声明式运维</text>
      <text x="692" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">动作：把 CR 转成实际资源</text>
      <text x="692" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">如 DB、队列、平台组件</text>

      <rect x="196" y="248" width="468" height="70" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="274" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">共同模式</text>
      <text x="430" y="294" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Watch 对象变化 → 比对期望与实际 → 执行动作 → 再观察结果</text>

      <line x1="262" y1="188" x2="300" y2="248" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-controller-map)" />
      <line x1="430" y1="188" x2="430" y2="248" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-controller-map)" />
      <line x1="598" y1="188" x2="560" y2="248" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-controller-map)" />
    </svg>

    <svg
      v-else-if="kind === 'control-plane-mainline-chain'"
      viewBox="0 0 860 372"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 控制面主线链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-control-mainline" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 23 - 控制面主线不是“谁都能改集群”，而是声明先入 apiserver，状态落 etcd，再由 controller 和 scheduler 驱动节点执行
      </text>

      <rect x="28" y="116" width="114" height="64" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="85" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubectl / CI</text>
      <text x="85" y="160" text-anchor="middle" font-size="9" fill="var(--d-client-text)">提交期望状态</text>

      <rect x="170" y="96" width="170" height="104" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="255" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">kube-apiserver</text>
      <text x="255" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">authn / authz / admission</text>
      <text x="255" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">validation / defaulting</text>
      <text x="255" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">list / watch / write 入口</text>

      <rect x="368" y="110" width="124" height="76" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="430" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">etcd</text>
      <text x="430" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">状态持久化</text>
      <text x="430" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">source of truth</text>

      <rect x="520" y="74" width="144" height="68" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="592" y="100" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">controller-manager</text>
      <text x="592" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">watch + reconcile</text>

      <rect x="520" y="154" width="144" height="68" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="592" y="180" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">scheduler</text>
      <text x="592" y="198" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">filter / score / bind</text>

      <rect x="692" y="116" width="140" height="64" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="762" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">kubelet / Node</text>
      <text x="762" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">真正拉镜像并启动 Pod</text>

      <line x1="142" y1="148" x2="170" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-control-mainline)" />
      <line x1="340" y1="148" x2="368" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-control-mainline)" />
      <line x1="492" y1="126" x2="520" y2="108" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-control-mainline)" />
      <line x1="492" y1="170" x2="520" y2="188" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-control-mainline)" />
      <line x1="664" y1="188" x2="692" y2="148" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-control-mainline)" />

      <path d="M762 180 C762 254, 255 254, 255 200" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-control-mainline)" />
      <text x="430" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">节点执行结果、Pod 状态与健康信息最终还会再经 apiserver 回到控制面</text>

      <rect x="102" y="304" width="656" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="323" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        关键边界：apiserver 管入口，etcd 管真相，controller / scheduler 管决策，kubelet 管执行
      </text>
    </svg>
  </div>
</template>
