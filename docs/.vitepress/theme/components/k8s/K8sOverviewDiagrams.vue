<script setup lang="ts">
type DiagramKind =
  | 'overview'
  | 'depth-map'
  | 'control-plane'
  | 'workload-map'
  | 'interview-ladder'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 专题总览图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-overview" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 1 - K8s 专题总览：先建对象模型，再补发布治理，最后把控制面机制和排障思路讲清楚
      </text>

      <rect x="28" y="72" width="240" height="176" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="148" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">核心概念与对象模型</text>
      <text x="148" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Control Plane / Node</text>
      <text x="148" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Pod / Deployment / StatefulSet</text>
      <text x="148" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Service / Ingress / PVC</text>
      <text x="148" y="180" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先把 K8s 的骨架搭起来</text>
      <rect x="68" y="198" width="160" height="34" rx="17" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="148" y="220" text-anchor="middle" font-size="10" fill="var(--d-text)">回答“这些对象各管什么”</text>

      <rect x="310" y="56" width="240" height="208" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="84" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">必备问题清单</text>
      <text x="430" y="110" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">探针 / 滚动更新 / 优雅终止</text>
      <text x="430" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">requests / limits / HPA</text>
      <text x="430" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">CNI / kube-proxy / PVC</text>
      <text x="430" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">RBAC / NetworkPolicy / 排障</text>
      <rect x="350" y="188" width="160" height="46" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="430" y="207" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">从会用对象</text>
      <text x="430" y="223" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">推进到会做治理与排障</text>

      <rect x="592" y="72" width="240" height="176" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="712" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">实战与底层桥接</text>
      <text x="712" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Go 服务部署与探针</text>
      <text x="712" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优雅关闭 / 配置注入 / 发布</text>
      <text x="712" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">etcd / controller / reconcile</text>
      <text x="712" y="180" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">把平台机制放回业务链路里</text>
      <rect x="632" y="198" width="160" height="34" rx="17" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="712" y="220" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">最后形成完整口径</text>

      <line x1="268" y1="160" x2="310" y2="160" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-overview)" />
      <line x1="550" y1="160" x2="592" y2="160" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-overview)" />

      <rect x="304" y="276" width="252" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2" />
      <text x="430" y="295" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">阅读顺序：对象模型 → 日常治理 → 控制面机制与排障</text>
    </svg>

    <svg
      v-else-if="kind === 'depth-map'"
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 由浅入深学习阶梯图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-depth" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 2 - K8s 真正的学习顺序通常不是背 API，而是沿着“会用 → 会稳 → 会排 → 会讲机制”逐层推进
      </text>

      <rect x="46" y="212" width="176" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="134" y="238" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">第 1 层：会用对象</text>
      <text x="134" y="258" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Pod / Deployment / Service</text>
      <text x="134" y="276" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">先能部署、暴露、更新服务</text>

      <rect x="250" y="156" width="176" height="82" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="338" y="182" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">第 2 层：会做治理</text>
      <text x="338" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Probe / Rollout / Graceful Shutdown</text>
      <text x="338" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">资源限制、弹性和发布稳定性</text>

      <rect x="454" y="100" width="176" height="82" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="542" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">第 3 层：会定位问题</text>
      <text x="542" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Pending / CrashLoop / 网络不通</text>
      <text x="542" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">存储挂载、权限和流量异常</text>

      <rect x="658" y="44" width="176" height="82" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="746" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">第 4 层：会讲机制</text>
      <text x="746" y="90" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">apiserver / etcd / scheduler</text>
      <text x="746" y="108" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">controller / reconcile / Operator</text>

      <line x1="222" y1="244" x2="250" y2="198" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-depth)" />
      <line x1="426" y1="188" x2="454" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-depth)" />
      <line x1="630" y1="132" x2="658" y2="86" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-depth)" />

      <rect x="108" y="46" width="468" height="30" rx="15" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="342" y="66" text-anchor="middle" font-size="10" fill="var(--d-text)">
        面试和生产都一样：只会写 YAML 不够，关键是能解释为什么这样配、错了会怎么坏
      </text>
    </svg>

    <svg
      v-else-if="kind === 'control-plane'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 控制面与节点关系图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-control" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 3 - 控制面负责“决定应该怎样”，节点负责“真的把 Pod 跑起来”
      </text>

      <rect x="36" y="126" width="126" height="58" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="99" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubectl / CI</text>
      <text x="99" y="168" text-anchor="middle" font-size="10" fill="var(--d-client-text)">提交期望状态</text>

      <rect x="286" y="118" width="288" height="116" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="430" y="146" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">Control Plane</text>

      <rect x="312" y="164" width="120" height="44" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="372" y="191" text-anchor="middle" font-size="11" fill="var(--d-text)">kube-apiserver</text>

      <rect x="446" y="164" width="102" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="497" y="191" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">etcd</text>

      <rect x="300" y="60" width="124" height="40" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="362" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">scheduler</text>

      <rect x="438" y="60" width="160" height="40" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="518" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">controller-manager</text>

      <line x1="162" y1="155" x2="286" y2="155" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-control)" />
      <line x1="372" y1="100" x2="372" y2="164" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-control)" />
      <line x1="518" y1="100" x2="518" y2="164" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-control)" />
      <line x1="432" y1="186" x2="446" y2="186" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-control)" />

      <rect x="74" y="288" width="298" height="48" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="223" y="308" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Node A</text>
      <text x="144" y="327" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">kubelet</text>
      <text x="223" y="327" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">container runtime</text>
      <text x="308" y="327" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">kube-proxy / CNI</text>

      <rect x="488" y="288" width="298" height="48" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="637" y="308" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Node B</text>
      <text x="558" y="327" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">kubelet</text>
      <text x="637" y="327" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">container runtime</text>
      <text x="722" y="327" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">kube-proxy / CNI</text>

      <line x1="372" y1="234" x2="223" y2="288" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-control)" />
      <line x1="518" y1="234" x2="637" y2="288" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-control)" />

      <rect x="264" y="252" width="332" height="22" rx="11" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.1" />
      <text x="430" y="267" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">
        关键链路：声明提交到 apiserver → 状态落 etcd → scheduler/controller 决策 → kubelet 在节点执行
      </text>
    </svg>

    <svg
      v-else-if="kind === 'workload-map'"
      viewBox="0 0 860 370"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 工作负载与对象关系图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-workload" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 4 - 最常用对象关系：入口先到 Service，工作负载再决定 Pod 怎么被创建、更新和持久化
      </text>

      <rect x="340" y="56" width="180" height="42" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="430" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Ingress / Gateway</text>

      <rect x="340" y="128" width="180" height="46" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="430" y="156" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Service</text>

      <line x1="430" y1="98" x2="430" y2="128" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-workload)" />

      <rect x="86" y="216" width="286" height="112" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="229" y="242" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Deployment → ReplicaSet → Pod</text>
      <rect x="112" y="258" width="112" height="44" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="168" y="285" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Deployment</text>
      <rect x="246" y="258" width="100" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="296" y="285" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">ReplicaSet</text>
      <text x="229" y="316" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合无状态服务，重点是副本数、滚动更新和回滚</text>

      <rect x="488" y="216" width="286" height="112" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="631" y="242" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">StatefulSet → Pod + PVC</text>
      <rect x="516" y="258" width="108" height="44" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="570" y="285" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">StatefulSet</text>
      <rect x="646" y="258" width="100" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="696" y="285" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">PVC / Volume</text>
      <text x="631" y="316" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合数据库和有状态组件，重点是稳定身份与持久化</text>

      <line x1="392" y1="174" x2="264" y2="216" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-workload)" />
      <line x1="468" y1="174" x2="596" y2="216" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-workload)" />

      <rect x="40" y="96" width="148" height="52" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="114" y="118" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">ConfigMap / Secret</text>
      <text x="114" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">把配置和敏感信息注入 Pod</text>

      <rect x="668" y="96" width="148" height="52" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.3" />
      <text x="742" y="118" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">DaemonSet</text>
      <text x="742" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">日志、监控、CNI 常见形态</text>

      <line x1="188" y1="122" x2="340" y2="150" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-workload)" />
      <line x1="668" y1="122" x2="520" y2="150" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-workload)" />
    </svg>

    <svg
      v-else-if="kind === 'interview-ladder'"
      viewBox="0 0 860 336"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 必备问题阶梯图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-interview" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 5 - 必备问题的答题顺序：先说对象，再说治理，再说资源网络存储，最后回到底层机制
      </text>

      <rect x="34" y="92" width="188" height="154" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="128" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">第 1 组：对象定位</text>
      <text x="128" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">1 - 6 题</text>
      <text x="128" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">K8s 做什么</text>
      <text x="128" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Pod / Deployment / Service</text>
      <text x="128" y="200" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Ingress / Secret</text>
      <rect x="60" y="216" width="136" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="128" y="230" text-anchor="middle" font-size="9" fill="var(--d-text)">先回答“它们各管什么”</text>

      <rect x="238" y="72" width="188" height="174" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="332" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">第 2 组：日常治理</text>
      <text x="332" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">7 - 12 题</text>
      <text x="332" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">滚动更新 / 回滚</text>
      <text x="332" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Probe / Graceful Shutdown</text>
      <text x="332" y="180" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">配置更新为什么不立刻生效</text>
      <rect x="264" y="206" width="136" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="332" y="220" text-anchor="middle" font-size="9" fill="var(--d-text)">开始回答“为什么发布会出问题”</text>

      <rect x="442" y="52" width="188" height="194" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="536" y="80" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">第 3 组：资源与数据面</text>
      <text x="536" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">13 - 29 题</text>
      <text x="536" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Pending / requests / limits / HPA</text>
      <text x="536" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">CNI / kube-proxy / Service</text>
      <text x="536" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">动态 IP / 白名单 / 固定出口</text>
      <text x="536" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">PV / PVC / StatefulSet / RBAC</text>
      <rect x="468" y="206" width="136" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="536" y="220" text-anchor="middle" font-size="9" fill="var(--d-text)">扩展到“为什么会 Pending、网络不通、卷挂不上”</text>

      <rect x="646" y="32" width="180" height="214" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="736" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">第 4 组：控制面机制</text>
      <text x="736" y="84" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">30 - 36 题</text>
      <text x="736" y="104" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">声明式 / apply / etcd</text>
      <text x="736" y="122" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">controller / reconcile</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">CRD / Operator</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">完整排障链路</text>
      <rect x="668" y="206" width="136" height="20" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="220" text-anchor="middle" font-size="9" fill="var(--d-text)">最后回答“系统为什么会这样工作”</text>

      <line x1="222" y1="170" x2="238" y2="158" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-interview)" />
      <line x1="426" y1="158" x2="442" y2="148" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-interview)" />
      <line x1="630" y1="148" x2="646" y2="138" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#k8s-arrow-interview)" />

      <rect x="180" y="286" width="500" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.1" />
      <text x="430" y="302" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        如果只能准备一遍，优先吃透每组的“为什么”，比单背对象定义更有用
      </text>
    </svg>
  </div>
</template>
