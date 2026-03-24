<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'depth-map'
  | 'control-plane'
  | 'workload-map'
  | 'interview-ladder'
  | 'ip-whitelist-patterns'
  | 'source-ip-preservation'
  | 'external-traffic-policy'
  | 'service-network-chain'
  | 'network-troubleshooting-playbook'
  | 'statefulset-stable-identity'
  | 'headless-service-dns'
  | 'zero-downtime-rollout-chain'
  | 'pod-termination-timeline'
  | 'pod-lifecycle-state-flow'
  | 'pod-collaboration-chain'
  | 'pod-container-role-map'
  | 'job-cronjob-control-chain'
  | 'workload-controller-boundary-map'
  | 'config-injection-update-chain'
  | 'config-consumption-boundary-map'
  | 'serviceaccount-token-identity-chain'
  | 'serviceaccount-token-boundary-map'
  | 'rbac-evaluation-chain'
  | 'rbac-binding-boundary-map'
  | 'pod-security-enforcement-chain'
  | 'security-context-boundary-map'
  | 'admission-policy-chain'
  | 'policy-engine-boundary-map'
  | 'image-supply-chain-chain'
  | 'image-trust-boundary-map'
  | 'secret-security-governance-chain'
  | 'external-secret-delivery-boundary-map'
  | 'api-audit-event-chain'
  | 'audit-policy-boundary-map'
  | 'node-heartbeat-eviction-chain'
  | 'node-condition-taint-eviction-boundary-map'
  | 'deletion-finalizer-gc-chain'
  | 'terminating-stuck-boundary-map'
  | 'probe-gating-chain'
  | 'scheduling-decision-chain'
  | 'resource-pressure-outcomes'
  | 'api-security-chain'
  | 'workload-isolation-boundary'
  | 'storage-data-chain'
  | 'volume-failure-playbook'
  | 'reconcile-loop-chain'
  | 'controller-family-map'
  | 'control-plane-mainline-chain'
  | 'traffic-entry-chain'
  | 'l4-l7-termination-map'
  | 'ingress-controller-chain'
  | 'gateway-controller-attachment-map'
  | 'autoscaling-control-chain'
  | 'hpa-vpa-ca-boundary-map'
  | 'replica-spread-ha-chain'
  | 'spread-constraint-boundary-map'
  | 'namespace-resource-governance-chain'
  | 'limitrange-resourcequota-boundary-map'
  | 'resource-enforcement-chain'
  | 'requests-limits-qos-boundary-map'
  | 'service-discovery-chain'
  | 'service-dns-answer-map'
  | 'endpointslice-reconcile-chain'
  | 'endpoint-conditions-boundary-map'
  | 'service-dataplane-chain'
  | 'iptables-vs-ipvs-map'
  | 'networkpolicy-enforcement-chain'
  | 'networkpolicy-selector-logic'
  | 'east-west-mesh-chain'
  | 'mesh-boundary-map'
  | 'node-execution-chain'
  | 'sandbox-runtime-network-storage'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '860px',
  'depth-map': '860px',
  'control-plane': '860px',
  'workload-map': '860px',
  'interview-ladder': '860px',
  'ip-whitelist-patterns': '860px',
  'source-ip-preservation': '860px',
  'external-traffic-policy': '860px',
  'service-network-chain': '860px',
  'network-troubleshooting-playbook': '860px',
  'statefulset-stable-identity': '860px',
  'headless-service-dns': '860px',
  'zero-downtime-rollout-chain': '860px',
  'pod-termination-timeline': '860px',
  'pod-lifecycle-state-flow': '860px',
  'pod-collaboration-chain': '860px',
  'pod-container-role-map': '860px',
  'job-cronjob-control-chain': '860px',
  'workload-controller-boundary-map': '860px',
  'config-injection-update-chain': '860px',
  'config-consumption-boundary-map': '860px',
  'serviceaccount-token-identity-chain': '860px',
  'serviceaccount-token-boundary-map': '860px',
  'rbac-evaluation-chain': '860px',
  'rbac-binding-boundary-map': '860px',
  'pod-security-enforcement-chain': '860px',
  'security-context-boundary-map': '860px',
  'admission-policy-chain': '860px',
  'policy-engine-boundary-map': '860px',
  'image-supply-chain-chain': '860px',
  'image-trust-boundary-map': '860px',
  'secret-security-governance-chain': '860px',
  'external-secret-delivery-boundary-map': '860px',
  'api-audit-event-chain': '860px',
  'audit-policy-boundary-map': '860px',
  'node-heartbeat-eviction-chain': '860px',
  'node-condition-taint-eviction-boundary-map': '860px',
  'deletion-finalizer-gc-chain': '860px',
  'terminating-stuck-boundary-map': '860px',
  'probe-gating-chain': '860px',
  'scheduling-decision-chain': '860px',
  'resource-pressure-outcomes': '860px',
  'api-security-chain': '860px',
  'workload-isolation-boundary': '860px',
  'storage-data-chain': '860px',
  'volume-failure-playbook': '860px',
  'reconcile-loop-chain': '860px',
  'controller-family-map': '860px',
  'control-plane-mainline-chain': '860px',
  'traffic-entry-chain': '860px',
  'l4-l7-termination-map': '860px',
  'ingress-controller-chain': '860px',
  'gateway-controller-attachment-map': '860px',
  'autoscaling-control-chain': '860px',
  'hpa-vpa-ca-boundary-map': '860px',
  'replica-spread-ha-chain': '860px',
  'spread-constraint-boundary-map': '860px',
  'namespace-resource-governance-chain': '860px',
  'limitrange-resourcequota-boundary-map': '860px',
  'resource-enforcement-chain': '860px',
  'requests-limits-qos-boundary-map': '860px',
  'service-discovery-chain': '860px',
  'service-dns-answer-map': '860px',
  'endpointslice-reconcile-chain': '860px',
  'endpoint-conditions-boundary-map': '860px',
  'service-dataplane-chain': '860px',
  'iptables-vs-ipvs-map': '860px',
  'networkpolicy-enforcement-chain': '860px',
  'networkpolicy-selector-logic': '860px',
  'east-west-mesh-chain': '860px',
  'mesh-boundary-map': '860px',
  'node-execution-chain': '860px',
  'sandbox-runtime-network-storage': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
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

    <svg
      v-else-if="kind === 'ip-whitelist-patterns'"
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

    <svg
      v-else-if="kind === 'statefulset-stable-identity'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="StatefulSet 稳定身份图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-stateful" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 11 - StatefulSet 稳定的不是 Pod IP，而是实例身份、DNS 名称和 PVC 绑定
      </text>

      <rect x="48" y="108" width="172" height="86" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="134" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">StatefulSet</text>
      <text x="134" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">按 ordinal 管理成员</text>
      <text x="134" y="174" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">创建和删除更保守</text>

      <rect x="274" y="108" width="168" height="86" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="358" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Headless Service</text>
      <text x="358" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">clusterIP: None</text>
      <text x="358" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">负责成员 DNS 发现</text>

      <line x1="220" y1="151" x2="274" y2="151" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-stateful)" />

      <rect x="506" y="58" width="124" height="66" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="568" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">mysql-0</text>
      <text x="568" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定实例名</text>
      <text x="568" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">IP 可变，名字不变</text>

      <rect x="506" y="138" width="124" height="66" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="568" y="164" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">mysql-1</text>
      <text x="568" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定实例名</text>
      <text x="568" y="196" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">成员身份可复用</text>

      <rect x="506" y="218" width="124" height="66" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="568" y="244" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">mysql-2</text>
      <text x="568" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定实例名</text>
      <text x="568" y="276" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">适合主从 / 分片成员</text>

      <line x1="442" y1="151" x2="506" y2="91" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="442" y1="151" x2="506" y2="171" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="442" y1="151" x2="506" y2="251" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-stateful)" />

      <rect x="668" y="58" width="150" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="743" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">PVC: data-mysql-0</text>
      <rect x="668" y="138" width="150" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="743" y="164" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">PVC: data-mysql-1</text>
      <rect x="668" y="218" width="150" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="743" y="244" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">PVC: data-mysql-2</text>

      <line x1="630" y1="91" x2="668" y2="79" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="630" y1="171" x2="668" y2="159" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="630" y1="251" x2="668" y2="239" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-stateful)" />

      <rect x="118" y="298" width="624" height="26" rx="13" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="316" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        关键结论：实例身份稳定靠名称、DNS 和卷绑定，Pod IP 本身仍然可能变化
      </text>
    </svg>

    <svg
      v-else-if="kind === 'headless-service-dns'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Headless Service DNS 解析图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-headless" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 12 - Headless Service 不给你虚拟 VIP，而是把 DNS 解析直接指向具体成员记录
      </text>

      <rect x="56" y="114" width="170" height="62" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="141" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Client / Peer</text>
      <text x="141" y="158" text-anchor="middle" font-size="9" fill="var(--d-client-text)">查询 mysql.default.svc</text>

      <rect x="280" y="96" width="176" height="96" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="368" y="124" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">CoreDNS + Headless Service</text>
      <text x="368" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">clusterIP: None</text>
      <text x="368" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">返回成员记录，不做 VIP 转发</text>
      <text x="368" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">例如 mysql-0 / mysql-1 / mysql-2</text>

      <line x1="226" y1="145" x2="280" y2="145" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-headless)" />

      <rect x="516" y="58" width="268" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="650" y="82" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">mysql-0.mysql.default.svc.cluster.local</text>
      <text x="650" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">指向 mysql-0 当前 Pod IP</text>

      <rect x="516" y="132" width="268" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="650" y="156" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">mysql-1.mysql.default.svc.cluster.local</text>
      <text x="650" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">指向 mysql-1 当前 Pod IP</text>

      <rect x="516" y="206" width="268" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="650" y="230" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">mysql-2.mysql.default.svc.cluster.local</text>
      <text x="650" y="248" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">指向 mysql-2 当前 Pod IP</text>

      <line x1="456" y1="145" x2="516" y2="87" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-headless)" />
      <line x1="456" y1="145" x2="516" y2="161" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-headless)" />
      <line x1="456" y1="145" x2="516" y2="235" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-headless)" />

      <rect x="116" y="280" width="628" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="297" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        普通 Service 稳定的是一组 Pod 的入口；Headless Service 稳定的是成员发现方式
      </text>
    </svg>

    <svg
      v-else-if="kind === 'zero-downtime-rollout-chain'"
      viewBox="0 0 860 334"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 零停机发布链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-rollout-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 13 - 真正的零停机不是一个开关，而是发布控制、流量切换和应用退出时序共同配合
      </text>

      <rect x="42" y="104" width="162" height="78" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="123" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Deployment</text>
      <text x="123" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">maxSurge / maxUnavailable</text>
      <text x="123" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">控制新旧 Pod 切换节奏</text>

      <rect x="242" y="104" width="166" height="78" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="325" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Readiness / EndpointSlice</text>
      <text x="325" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">新 Pod 通过后才进后端池</text>
      <text x="325" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">旧 Pod 失败后先摘流量</text>

      <rect x="446" y="104" width="166" height="78" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="529" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">preStop + SIGTERM</text>
      <text x="529" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">先等流量摘除</text>
      <text x="529" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">再处理存量请求并退出</text>

      <rect x="650" y="104" width="166" height="78" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="733" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">PDB + 调度冗余</text>
      <text x="733" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">避免自愿驱逐同时清空副本</text>
      <text x="733" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">兜底发布与维护期可用性</text>

      <line x1="204" y1="143" x2="242" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rollout-chain)" />
      <line x1="408" y1="143" x2="446" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rollout-chain)" />
      <line x1="612" y1="143" x2="650" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rollout-chain)" />

      <rect x="84" y="226" width="692" height="68" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="250" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">关键判断</text>
      <text x="430" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">新 Pod 没准备好不能提前接流量，旧 Pod 没摘流量不能立即退出</text>
      <text x="430" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">只配 Deployment 策略不够，应用、探针、Service 收敛和终止时序必须一起正确</text>
    </svg>

    <svg
      v-else-if="kind === 'pod-termination-timeline'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pod 终止时序图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-termination" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 14 - 旧 Pod 正确下线的顺序应是：先摘流量，再收尾，再退出，最后才可能被强杀
      </text>

      <line x1="88" y1="174" x2="788" y2="174" stroke="var(--d-border)" stroke-width="2" />

      <rect x="92" y="130" width="112" height="38" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="148" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">DeletionTimestamp</text>

      <rect x="230" y="118" width="116" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="288" y="140" text-anchor="middle" font-size="10" fill="var(--d-text)">preStop</text>
      <text x="288" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等待 LB / Service 收敛</text>

      <rect x="382" y="118" width="124" height="50" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="444" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">SIGTERM</text>
      <text x="444" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">停止接新请求，处理存量</text>

      <rect x="544" y="118" width="132" height="50" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="610" y="140" text-anchor="middle" font-size="10" fill="var(--d-text)">Grace Period</text>
      <text x="610" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">terminationGracePeriodSeconds</text>

      <rect x="712" y="130" width="88" height="38" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="756" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">SIGKILL</text>

      <line x1="204" y1="149" x2="230" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />
      <line x1="346" y1="149" x2="382" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />
      <line x1="506" y1="149" x2="544" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />
      <line x1="676" y1="149" x2="712" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />

      <rect x="156" y="234" width="548" height="54" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="256" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">如果 preStop 太短、readiness 摘流量太慢，SIGTERM 后仍可能有新流量打进来</text>
      <text x="430" y="274" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">如果 graceful shutdown 超过 grace period，最终会被 SIGKILL，请求仍然会中断</text>
    </svg>

    <svg
      v-else-if="kind === 'scheduling-decision-chain'"
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
      v-else-if="kind === 'api-security-chain'"
      viewBox="0 0 860 338"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s API 安全链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-api-security" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 17 - 访问集群 API 的安全链路是：身份先被认证，再做授权，最后再经过准入控制
      </text>

      <rect x="36" y="112" width="140" height="70" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="106" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubectl / CI / Pod</text>
      <text x="106" y="156" text-anchor="middle" font-size="9" fill="var(--d-client-text)">用户证书 / OIDC / SA Token</text>

      <rect x="212" y="112" width="138" height="70" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="281" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Authentication</text>
      <text x="281" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先回答“你是谁”</text>

      <rect x="386" y="112" width="138" height="70" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="455" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Authorization</text>
      <text x="455" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">RBAC 回答“你能做什么”</text>

      <rect x="560" y="112" width="138" height="70" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="629" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Admission</text>
      <text x="629" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">校验 / 变更请求内容</text>

      <rect x="724" y="112" width="100" height="70" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="774" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">etcd</text>
      <text x="774" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">状态落盘</text>

      <line x1="176" y1="147" x2="212" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />
      <line x1="350" y1="147" x2="386" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />
      <line x1="524" y1="147" x2="560" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />
      <line x1="698" y1="147" x2="724" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />

      <rect x="96" y="228" width="668" height="68" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">关键区分</text>
      <text x="430" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">ServiceAccount 提供身份，不直接提供权限；RBAC 提供 API 权限；Admission 提供策略兜底</text>
    </svg>

    <svg
      v-else-if="kind === 'workload-isolation-boundary'"
      viewBox="0 0 860 352"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 工作负载隔离边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-workload-security" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 18 - 工作负载侧要把 API 权限、敏感数据和网络连通性看成三条不同边界
      </text>

      <rect x="312" y="118" width="236" height="100" rx="18" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="430" y="146" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Workload Pod</text>
      <text x="430" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">运行应用容器</text>
      <text x="430" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">挂 ServiceAccount Token / Secret</text>
      <text x="430" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">受 NetworkPolicy 和命名空间边界影响</text>

      <rect x="76" y="86" width="168" height="72" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="160" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">ServiceAccount + RBAC</text>
      <text x="160" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">控制 Pod 调 API 时能做什么</text>

      <rect x="76" y="212" width="168" height="72" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="160" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Secret</text>
      <text x="160" y="258" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">注入敏感数据</text>

      <rect x="616" y="86" width="168" height="72" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="700" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">NetworkPolicy</text>
      <text x="700" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">控制 Pod 与 Pod / 外部的流量</text>

      <rect x="616" y="212" width="168" height="72" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="700" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Admission / Policy</text>
      <text x="700" y="258" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">限制镜像、标签、SecurityContext</text>

      <line x1="244" y1="122" x2="312" y2="150" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />
      <line x1="244" y1="248" x2="312" y2="186" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />
      <line x1="548" y1="150" x2="616" y2="122" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />
      <line x1="548" y1="186" x2="616" y2="248" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />

      <rect x="112" y="308" width="636" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="325" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        RBAC 不是网络隔离，NetworkPolicy 也不是 API 权限控制，Secret 更不是天然加密保险箱
      </text>
    </svg>

    <svg
      v-else-if="kind === 'storage-data-chain'"
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

    <svg
      v-else-if="kind === 'traffic-entry-chain'"
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
      v-else-if="kind === 'pod-collaboration-chain'"
      viewBox="0 0 860 388"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 多容器协作链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pod-collab" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 25A - Pod 之所以是最小调度单元，不是因为“能装多个容器”，而是因为它定义了共享网络、共享卷和共同调度的协作边界
      </text>

      <rect x="34" y="140" width="118" height="70" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="93" y="166" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">调度 / 绑定</text>
      <text x="93" y="184" text-anchor="middle" font-size="9" fill="var(--d-client-text)">scheduler 选节点</text>
      <text x="93" y="198" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Pod 整体上节点</text>

      <rect x="190" y="74" width="496" height="236" rx="20" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.6" />
      <text x="438" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Pod 边界</text>
      <text x="438" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同一个 Pod IP、同一个 localhost、同一个端口空间、同一组卷挂载上下文</text>

      <rect x="224" y="144" width="170" height="58" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="309" y="168" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Init Container</text>
      <text x="309" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">启动前顺序执行</text>

      <rect x="246" y="232" width="150" height="64" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="321" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">主容器</text>
      <text x="321" y="274" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">真正承载业务流量</text>

      <rect x="464" y="232" width="150" height="64" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="539" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Sidecar</text>
      <text x="539" y="274" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">日志 / 代理 / 同步 / 治理</text>

      <rect x="424" y="144" width="224" height="58" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="536" y="168" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">共享资源面</text>
      <text x="536" y="186" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">localhost 通信 + emptyDir / config / socket / log</text>

      <rect x="706" y="116" width="122" height="78" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="767" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">临时容器</text>
      <text x="767" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">已有 Pod 注入</text>
      <text x="767" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只用于排障</text>

      <line x1="152" y1="175" x2="190" y2="175" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-collab)" />
      <line x1="309" y1="202" x2="309" y2="232" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-collab)" />
      <line x1="394" y1="264" x2="464" y2="264" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-collab)" />
      <path d="M706 194 C676 220, 646 228, 614 240" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-pod-collab)" />

      <rect x="224" y="320" width="462" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="455" y="339" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        一旦需要独立扩缩容、独立发布节奏、独立故障域或独立 Service 暴露，通常就应该拆成独立工作负载
      </text>
    </svg>

    <svg
      v-else-if="kind === 'pod-container-role-map'"
      viewBox="0 0 860 390"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 容器角色边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 25B - 多容器 Pod 真正要分清的不是“都在一个 YAML 里”，而是它们在 Pod 生命周期里的职责边界完全不同
      </text>

      <rect x="30" y="72" width="188" height="230" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">主容器</text>
      <text x="124" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">启动时机：业务正式开始时</text>
      <text x="124" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">生命周期：贯穿 Pod 运行期</text>
      <text x="124" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">职责：真正承载请求或任务</text>
      <text x="124" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">误区：把日志、代理、同步全塞进来</text>
      <rect x="56" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">它负责业务本身，不负责把一切伴生能力都吞进去</text>

      <rect x="234" y="72" width="188" height="230" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Init Container</text>
      <text x="328" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">启动时机：主容器之前</text>
      <text x="328" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">生命周期：顺序执行，成功后退出</text>
      <text x="328" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">职责：依赖检查、配置生成、一次性准备</text>
      <text x="328" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">误区：拿它做长期同步或日志采集</text>
      <rect x="260" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只解决启动前阻塞条件，不解决运行期伴生能力</text>

      <rect x="438" y="72" width="188" height="230" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="532" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">Sidecar</text>
      <text x="532" y="126" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">启动时机：伴随主容器前后接入</text>
      <text x="532" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">生命周期：与主容器并行常驻</text>
      <text x="532" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">职责：日志、代理、证书/配置热同步</text>
      <text x="532" y="186" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">误区：把独立业务硬塞成第二主服务</text>
      <rect x="464" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">长期伴生，不等于能替代独立 Deployment / Service</text>

      <rect x="642" y="72" width="188" height="230" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="736" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">临时容器</text>
      <text x="736" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">启动时机：Pod 运行后人工注入</text>
      <text x="736" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">生命周期：临时存在，不是正式发布物</text>
      <text x="736" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">职责：线上调试、观察、排障</text>
      <text x="736" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">误区：把排障容器写成正式架构组成部分</text>
      <rect x="668" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">它解决“怎么查”，不解决“怎么跑”</text>

      <rect x="78" y="328" width="704" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="347" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：启动前一次性任务用 Init，运行期伴生能力用 Sidecar，正式流量归主容器，线上排障才用临时容器
      </text>
    </svg>

    <svg
      v-else-if="kind === 'job-cronjob-control-chain'"
      viewBox="0 0 860 382"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Job 与 CronJob 控制链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-job-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 48 - CronJob 自己不直接跑 Pod，它只负责按计划创建 Job；真正决定任务完成、重试和失败收敛的还是 Job 控制链路
      </text>

      <rect x="30" y="128" width="124" height="72" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="92" y="154" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">schedule</text>
      <text x="92" y="172" text-anchor="middle" font-size="9" fill="var(--d-client-text)">cron 表达式</text>
      <text x="92" y="186" text-anchor="middle" font-size="9" fill="var(--d-client-text)">timeZone</text>

      <rect x="184" y="112" width="152" height="104" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="260" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">CronJob</text>
      <text x="260" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">concurrencyPolicy</text>
      <text x="260" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">startingDeadlineSeconds</text>
      <text x="260" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">suspend / historyLimit</text>

      <rect x="366" y="112" width="138" height="104" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="435" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Job</text>
      <text x="435" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">parallelism / completions</text>
      <text x="435" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">backoffLimit</text>
      <text x="435" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">deadline / TTL</text>

      <rect x="534" y="112" width="138" height="104" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="603" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Pod</text>
      <text x="603" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">调度 / 拉镜像 / 执行任务</text>
      <text x="603" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">退出码与日志</text>
      <text x="603" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Succeeded / Failed</text>

      <rect x="702" y="112" width="128" height="104" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="766" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">结果</text>
      <text x="766" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">成功完成</text>
      <text x="766" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">继续重试</text>
      <text x="766" y="192" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">达到失败上限</text>

      <line x1="154" y1="164" x2="184" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />
      <line x1="336" y1="164" x2="366" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />
      <line x1="504" y1="164" x2="534" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />
      <line x1="672" y1="164" x2="702" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />

      <path d="M603 216 C603 270, 435 270, 435 216" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-job-chain)" />
      <text x="519" y="286" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod 的退出结果会回流到 Job 状态，Job 再决定是否继续补 Pod、重试或结束</text>

      <rect x="114" y="322" width="632" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="341" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        排障顺序也该按这条链路看：CronJob 是否触发 -> Job 是否生成 -> Pod 为什么失败 -> 业务是否幂等
      </text>
    </svg>

    <svg
      v-else-if="kind === 'workload-controller-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 工作负载控制器边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 49 - 同样都叫“工作负载”，但五类控制器关心的根本不是同一个目标：在线、稳定身份、每节点驻留、一次性完成、按计划触发
      </text>

      <rect x="34" y="76" width="154" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="111" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Deployment</text>
      <text x="111" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">目标：持续在线</text>
      <text x="111" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">对象：无状态服务</text>
      <text x="111" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">能力：副本、滚动更新、回滚</text>
      <text x="111" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不适合：一次性任务</text>
      <rect x="54" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="111" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="111" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">API 服务</text>
      <text x="111" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Web 服务</text>

      <rect x="198" y="76" width="154" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="275" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">StatefulSet</text>
      <text x="275" y="130" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">目标：稳定身份</text>
      <text x="275" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">对象：有状态副本</text>
      <text x="275" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">能力：固定名称、稳定 PVC</text>
      <text x="275" y="184" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不适合：短命批处理</text>
      <rect x="218" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="275" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="275" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">数据库</text>
      <text x="275" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消息队列成员节点</text>

      <rect x="362" y="76" width="154" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="439" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">DaemonSet</text>
      <text x="439" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">目标：每节点驻留</text>
      <text x="439" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">对象：节点级代理</text>
      <text x="439" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">能力：跟节点数量变化联动</text>
      <text x="439" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不适合：按时间调度任务</text>
      <rect x="382" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="439" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="439" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">日志 Agent</text>
      <text x="439" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">监控 Agent</text>

      <rect x="526" y="76" width="154" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="603" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Job</text>
      <text x="603" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">目标：成功完成</text>
      <text x="603" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">对象：一次性批处理</text>
      <text x="603" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">能力：重试、并发、完成数</text>
      <text x="603" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不适合：长期常驻服务</text>
      <rect x="546" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="603" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="603" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">数据修复</text>
      <text x="603" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">离线导出 / 对账</text>

      <rect x="690" y="76" width="140" height="244" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="760" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">CronJob</text>
      <text x="760" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">目标：按计划触发</text>
      <text x="760" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">对象：周期性 Job</text>
      <text x="760" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">能力：并发策略、补跑窗口</text>
      <text x="760" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">不适合：严格一次且绝不重入</text>
      <rect x="703" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="760" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="760" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">定时汇总</text>
      <text x="760" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">周期清理</text>

      <rect x="82" y="342" width="696" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="361" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选型口诀：在线服务看 Deployment，稳定身份看 StatefulSet，每节点驻留看 DaemonSet，一次性完成看 Job，周期触发看 CronJob
      </text>
    </svg>

    <svg
      v-else-if="kind === 'config-injection-update-chain'"
      viewBox="0 0 860 386"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 配置注入与更新传播链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-config-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 50 - 改了 `ConfigMap` / `Secret` 不等于应用立刻吃到新配置；真正要分清的是注入路径、更新传播路径和应用加载模型
      </text>

      <rect x="38" y="118" width="148" height="90" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="112" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">ConfigMap / Secret</text>
      <text x="112" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">对象被更新</text>
      <text x="112" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">apiserver / kubelet watch</text>

      <rect x="220" y="88" width="176" height="66" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="308" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">env / envFrom</text>
      <text x="308" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">容器启动时注入进程环境</text>

      <rect x="220" y="176" width="176" height="66" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="308" y="202" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">volume / projected</text>
      <text x="308" y="220" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">kubelet 逐步同步文件</text>

      <rect x="440" y="88" width="176" height="66" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="528" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod 不重建</text>
      <text x="528" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">环境变量通常仍是旧值</text>

      <rect x="440" y="176" width="176" height="66" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="528" y="202" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">文件可能已更新</text>
      <text x="528" y="220" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">但应用未必重新加载</text>

      <rect x="660" y="88" width="156" height="66" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="738" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">需要 rollout</text>
      <text x="738" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">重建 Pod 才拿到新 env</text>

      <rect x="660" y="176" width="156" height="66" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="738" y="202" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">需要 reload</text>
      <text x="738" y="220" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或应用主动 watch 文件</text>

      <line x1="186" y1="136" x2="220" y2="121" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="186" y1="190" x2="220" y2="209" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="396" y1="121" x2="440" y2="121" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="396" y1="209" x2="440" y2="209" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="616" y1="121" x2="660" y2="121" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="616" y1="209" x2="660" y2="209" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />

      <rect x="170" y="286" width="520" height="56" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">真正的边界不是“配置对象改了没有”，而是“新值走哪条路径进入进程，以及应用会不会重新读它”</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">另一个常见断点是 `subPath`：它会打断普通目录挂载的后续更新传播</text>
    </svg>

    <svg
      v-else-if="kind === 'config-consumption-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 配置消费方式边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 51 - 配置消费方式的重点不是“哪种更方便”，而是“更新传播、暴露面、可读性和是否适合热更新”这几条边界
      </text>

      <rect x="30" y="76" width="188" height="238" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">env</text>
      <text x="124" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优点：显式、代码读取简单</text>
      <text x="124" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">更新：通常要重建 Pod</text>
      <text x="124" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">适合：少量开关、连接串</text>
      <text x="124" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">注意：敏感值暴露面较大</text>

      <rect x="234" y="76" width="188" height="238" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">envFrom</text>
      <text x="328" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：批量导入省事</text>
      <text x="328" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">更新：同样通常要重建 Pod</text>
      <text x="328" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：简单环境变量集合</text>
      <text x="328" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">注意：最小暴露面和可读性较弱</text>

      <rect x="438" y="76" width="188" height="238" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">volume</text>
      <text x="532" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：适合配置文件和证书</text>
      <text x="532" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">更新：文件会逐步同步</text>
      <text x="532" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">适合：文件式配置、TLS 密钥</text>
      <text x="532" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">注意：应用自己决定是否 reload</text>

      <rect x="642" y="76" width="188" height="238" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">projected / subPath</text>
      <text x="736" y="130" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">projected：组合多来源挂载</text>
      <text x="736" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">subPath：挂单文件很方便</text>
      <text x="736" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适合：汇总目录、固定路径挂载</text>
      <text x="736" y="184" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">注意：`subPath` 常打断后续更新</text>

      <rect x="86" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="145" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="145" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">进程环境更像启动时快照</text>

      <rect x="290" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="349" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="349" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">方便，但容易一把梭过量注入</text>

      <rect x="494" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="553" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="553" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">文件进来了，不代表服务已生效</text>

      <rect x="698" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="757" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="757" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`projected` 是组合，`subPath` 是断点</text>

      <rect x="96" y="340" width="668" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="359" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：少量显式配置用 `env`，批量简化用 `envFrom`，文件和证书用 `volume`，多来源汇总用 `projected`，一旦用了 `subPath` 就别默认它还能热更新
      </text>
    </svg>

    <svg
      v-else-if="kind === 'serviceaccount-token-identity-chain'"
      viewBox="0 0 860 390"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s ServiceAccount token 身份链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-sa-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 52 - Pod 能访问 `kube-apiserver`，不是因为它“天然有权限”，而是因为它绑定了 `ServiceAccount`，Kubernetes 再把对应身份凭证投射进容器
      </text>

      <rect x="34" y="118" width="134" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="101" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pod spec</text>
      <text x="101" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">serviceAccountName</text>
      <text x="101" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">automountServiceAccountToken</text>

      <rect x="200" y="118" width="148" height="88" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="274" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">ServiceAccount</text>
      <text x="274" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">身份对象</text>
      <text x="274" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不直接等于权限</text>

      <rect x="380" y="118" width="156" height="88" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="458" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">TokenRequest / kubelet</text>
      <text x="458" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">申请短期 token</text>
      <text x="458" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">投射进 Pod</text>

      <rect x="568" y="118" width="136" height="88" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="636" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">projected token</text>
      <text x="636" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">短期 / 可轮转</text>
      <text x="636" y="182" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">可指定 audience</text>

      <rect x="736" y="118" width="94" height="88" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="783" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">API 调用</text>
      <text x="783" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">apiserver</text>
      <text x="783" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或目标受众系统</text>

      <line x1="168" y1="162" x2="200" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />
      <line x1="348" y1="162" x2="380" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />
      <line x1="536" y1="162" x2="568" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />
      <line x1="704" y1="162" x2="736" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />

      <rect x="160" y="264" width="540" height="64" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="290" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">关键边界：`ServiceAccount` 是身份对象，token 是认证凭证，RBAC 才决定这个身份到底能做什么</text>
      <text x="430" y="310" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">如果 Pod 根本不需要调 API，最稳的做法通常是显式关闭自动挂载，而不是默认把凭证发进去</text>
    </svg>

    <svg
      v-else-if="kind === 'serviceaccount-token-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s ServiceAccount token 边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 53 - 回答 Pod 身份问题时，先分清“身份对象”“是否自动挂凭证”“凭证长什么样”“权限是谁给的”，不要把这几层混成一句“SA 就是权限”
      </text>

      <rect x="30" y="78" width="188" height="236" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">ServiceAccount</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">解决：Pod 以谁的身份出现</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不解决：具体能做哪些动作</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">误区：把它直接当权限</text>

      <rect x="234" y="78" width="188" height="236" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">automount</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决：默认是否自动挂 API 凭证</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不解决：Pod 是否有 `serviceAccountName`</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">误区：关掉自动挂载就等于没身份</text>

      <rect x="438" y="78" width="188" height="236" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">projected token</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">解决：短期、可轮转、可指定 audience</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不解决：应用是否会 reload 新 token</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">误区：以为 kubelet 轮转后应用自然无感</text>

      <rect x="642" y="78" width="188" height="236" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">RBAC / serviceaccounts/token</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">解决：身份具体拥有什么权限</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">敏感点：可为 SA 申请 token 的权限</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">误区：把认证失败和授权失败混一起</text>

      <rect x="78" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">身份名片</text>

      <rect x="282" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">是否发凭证</text>

      <rect x="486" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">短期工作负载 token</text>

      <rect x="690" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最终权限边界</text>

      <rect x="102" y="340" width="656" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="359" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：先问 Pod 要不要 API 凭证，再问凭证该不该默认挂、受众是谁、会不会轮转，最后才看 RBAC 是否放对
      </text>
    </svg>

    <svg
      v-else-if="kind === 'rbac-evaluation-chain'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s RBAC 授权判断链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-rbac-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 54 - RBAC 真正判断的不是“你是不是开发”，而是“这个身份在这个作用域里，对这个资源和动作有没有被某条绑定规则放行”
      </text>

      <rect x="34" y="122" width="128" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="98" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">请求属性</text>
      <text x="98" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">subject / verb</text>
      <text x="98" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">resource / subresource / namespace</text>

      <rect x="194" y="108" width="156" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="272" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Binding 查找</text>
      <text x="272" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">RoleBinding</text>
      <text x="272" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ClusterRoleBinding</text>
      <text x="272" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">找到主体关联的规则集</text>

      <rect x="382" y="108" width="156" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="460" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">规则匹配</text>
      <text x="460" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">apiGroup / resource</text>
      <text x="460" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">verb / subresource</text>
      <text x="460" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">resourceNames / nonResourceURLs</text>

      <rect x="570" y="108" width="120" height="116" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="630" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">授权结果</text>
      <text x="630" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">allow / no opinion</text>
      <text x="630" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">没有显式 deny</text>

      <rect x="722" y="122" width="108" height="88" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="776" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Admission</text>
      <text x="776" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">授权通过后</text>
      <text x="776" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">还可能再被策略拦</text>

      <line x1="162" y1="166" x2="194" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />
      <line x1="350" y1="166" x2="382" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />
      <line x1="538" y1="166" x2="570" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />
      <line x1="690" y1="166" x2="722" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />

      <rect x="138" y="286" width="584" height="58" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">重点别答错：RBAC 关注的是 allow 判断，不是全功能策略引擎；真正排障时还得继续区分认证、授权和准入三层</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">`RoleBinding` 引用 `ClusterRole` 不会自动变成全集群授权，作用域仍受绑定位置约束</text>
    </svg>

    <svg
      v-else-if="kind === 'rbac-binding-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s RBAC 绑定与高危权限边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 55 - RBAC 最容易出事故的，不是字段写错，而是把“规则模板”“最终作用域”和“高危特殊 verb”混成一层
      </text>

      <rect x="30" y="78" width="188" height="238" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Role / ClusterRole</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">解决：定义权限规则</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">误区：把 `ClusterRole` 等同全集群权限</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">关键：它也可以只是复用模板</text>

      <rect x="234" y="78" width="188" height="238" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">RoleBinding / ClusterRoleBinding</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决：把规则绑给主体</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">关键：最终作用域由绑定决定</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">误区：忽略 namespace 与 cluster 的差别</text>

      <rect x="438" y="78" width="188" height="238" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">高危资源与规则</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`secrets`、`pods/exec`、`roles`</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`rolebindings`、`serviceaccounts/token`</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">风险：横向移动与提权</text>

      <rect x="642" y="78" width="188" height="238" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">特殊 verbs</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`bind`：把权限发给别人</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`escalate`：定义更高权限规则</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`impersonate`：借别的身份发请求</text>

      <rect x="74" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">规则长什么样</text>

      <rect x="278" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">到底给到谁、多大范围</text>

      <rect x="482" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">高风险资源别轻放</text>

      <rect x="686" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">特殊 verb 更像提权手柄</text>

      <rect x="94" y="340" width="672" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="359" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：规则先做小，绑定先做窄，高危资源先质疑，`bind / escalate / impersonate` 先默认高危，再决定是否必须存在
      </text>
    </svg>

    <svg
      v-else-if="kind === 'pod-security-enforcement-chain'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod Security 与 SecurityContext 执行链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pod-security" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 56 - 容器运行权限真正要分两层：Pod spec 里声明怎么跑，Namespace 侧 Pod Security Admission 决定这样的 spec 能不能被放进集群
      </text>

      <rect x="30" y="124" width="132" height="92" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="96" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pod spec</text>
      <text x="96" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">securityContext</text>
      <text x="96" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">hostNetwork / hostPID / hostPath</text>

      <rect x="196" y="124" width="154" height="92" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="273" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Pod Security Admission</text>
      <text x="273" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">namespace labels</text>
      <text x="273" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">enforce / audit / warn</text>

      <rect x="384" y="124" width="148" height="92" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="458" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">准入结果</text>
      <text x="458" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">允许 / 告警 / 审计 / 拒绝</text>
      <text x="458" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不会自动修复 spec</text>

      <rect x="566" y="124" width="124" height="92" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="628" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">kubelet / runtime</text>
      <text x="628" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">runAs / seccomp</text>
      <text x="628" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">capabilities / no_new_privs</text>

      <rect x="724" y="124" width="106" height="92" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="777" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">容器进程</text>
      <text x="777" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最终以什么权限跑</text>
      <text x="777" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">真正落在这里</text>

      <line x1="162" y1="170" x2="196" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />
      <line x1="350" y1="170" x2="384" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />
      <line x1="532" y1="170" x2="566" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />
      <line x1="690" y1="170" x2="724" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />

      <rect x="150" y="286" width="560" height="62" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">关键边界：PSA 决定能不能进，`securityContext` 决定进来后怎么跑；两者都不替应用修镜像、修目录权限或自动补安全字段</text>
      <text x="430" y="330" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">所以真正的落地顺序通常是镜像先支持，再写 spec，最后再在 namespace 维度逐步收紧准入</text>
    </svg>

    <svg
      v-else-if="kind === 'security-context-boundary-map'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s SecurityContext 边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 57 - 回答运行权限问题时，先分清“进程身份”“提权能力”“内核约束”“宿主机接触面”四层，不要只背一条 `runAsNonRoot`
      </text>

      <rect x="30" y="78" width="188" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">进程身份</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`runAsNonRoot`</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`runAsUser` / `runAsGroup`</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`fsGroup`</text>
      <text x="124" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">风险：镜像与卷权限不匹配</text>

      <rect x="234" y="78" width="188" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">提权能力</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`allowPrivilegeEscalation`</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`privileged`</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`capabilities`</text>
      <text x="328" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">风险：一旦 `privileged`，很多约束直接失效</text>

      <rect x="438" y="78" width="188" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">内核约束</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`seccompProfile`</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`appArmorProfile`</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`seLinuxOptions`</text>
      <text x="532" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">风险：只在 Linux 且受 runtime 支持影响</text>

      <rect x="642" y="78" width="188" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">宿主机接触面</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`hostNetwork` / `hostPID` / `hostIPC`</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`hostPath`</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险：隔离边界直接变薄</text>
      <text x="736" y="186" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">PSA Restricted 会重点限制这里</text>

      <rect x="84" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="124" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">谁在跑</text>

      <rect x="288" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="328" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能不能变强</text>

      <rect x="492" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="532" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内核兜底</text>

      <rect x="696" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="736" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">离宿主机多近</text>

      <rect x="88" y="342" width="684" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="361" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：先让进程非 root，再禁提权、减能力、开内核约束，最后尽量远离宿主机；宿主机相关字段通常要先假定为高风险
      </text>
    </svg>

    <svg
      v-else-if="kind === 'admission-policy-chain'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Admission 与策略治理链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-admission" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 58 - Admission 发生在认证和授权之后、对象真正落库之前；内建插件、VAP、webhook 和策略引擎都在争夺这条入口，但职责并不一样
      </text>

      <rect x="24" y="126" width="118" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="83" y="154" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Authn / Authz</text>
      <text x="83" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">你是谁</text>
      <text x="83" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能不能做</text>

      <rect x="172" y="112" width="136" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="240" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">内建 admission</text>
      <text x="240" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">LimitRanger</text>
      <text x="240" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ResourceQuota / PodSecurity</text>
      <text x="240" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ServiceAccount</text>

      <rect x="338" y="112" width="136" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="406" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Mutating</text>
      <text x="406" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">内建 mutating</text>
      <text x="406" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">MutatingAdmissionWebhook</text>
      <text x="406" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自动补字段</text>

      <rect x="504" y="112" width="136" height="116" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="572" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Validating</text>
      <text x="572" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ValidatingAdmissionPolicy</text>
      <text x="572" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ValidatingAdmissionWebhook</text>
      <text x="572" y="192" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">最终拍板</text>

      <rect x="670" y="112" width="166" height="116" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="753" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">落库 / 控制循环</text>
      <text x="753" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">对象写入 etcd</text>
      <text x="753" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">controller 再继续 watch / reconcile</text>
      <text x="753" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">没过准入就到不了这一步</text>

      <line x1="142" y1="170" x2="172" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />
      <line x1="308" y1="170" x2="338" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />
      <line x1="474" y1="170" x2="504" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />
      <line x1="640" y1="170" x2="670" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />

      <rect x="142" y="286" width="576" height="58" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">关键边界：mutating 先执行、validating 后拍板；对象一旦进不了 Admission，调度、运行时、控制器这几层都无从谈起</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">如果只是声明式校验，优先考虑内建 validating；真要 mutation、外部依赖或策略平台化，再考虑 webhook / policy engine</text>
    </svg>

    <svg
      v-else-if="kind === 'policy-engine-boundary-map'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 策略引擎边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 59 - 选治理工具时，先分清内建能力、内建 validating、外部 webhook 和完整策略平台，不要把 Gatekeeper、Kyverno、VAP 混成同一层
      </text>

      <rect x="30" y="78" width="188" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">内建 admission plugins</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">LimitRanger / ResourceQuota / PodSecurity</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优点：最稳定、无额外组件</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">边界：只覆盖内建能力</text>

      <rect x="234" y="78" width="188" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">ValidatingAdmissionPolicy</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：CEL、内建 validating、无外部 callout</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">边界：只能校验，不能 mutation</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：简单到中等复杂度约束</text>

      <rect x="438" y="78" width="188" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Webhook / Gatekeeper</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：扩展强、可模板化、可审计</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">边界：要养 webhook、高可用、超时治理</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">适合：复杂策略、OPA/Rego 体系</text>

      <rect x="642" y="78" width="188" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">Kyverno / 策略平台</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">优点：validate / mutate / generate / scan</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">边界：组件更多、治理面更大</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适合：平台统一治理与后台报告</text>

      <rect x="74" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先看内建是否够用</text>

      <rect x="278" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只校验就优先 VAP</text>

      <rect x="482" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">复杂约束才上 OPA 体系</text>

      <rect x="686" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">需要治理平台时再上</text>

      <rect x="94" y="342" width="672" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="361" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：先内建、再 VAP、后 webhook、最后策略平台；能力越强，治理面和运维成本通常也越大
      </text>
    </svg>

    <svg
      v-else-if="kind === 'image-supply-chain-chain'"
      viewBox="0 0 860 398"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 镜像供应链主线图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-image-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 60 - 镜像供应链治理不是只盯着 registry，而是从构建、签名、准入验证到节点拉取和运行时最小权限串成一条链
      </text>

      <rect x="34" y="110" width="110" height="88" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="89" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">开发 / CI</text>
      <text x="89" y="158" text-anchor="middle" font-size="9" fill="var(--d-client-text)">提交代码</text>
      <text x="89" y="174" text-anchor="middle" font-size="9" fill="var(--d-client-text)">触发构建流水线</text>

      <rect x="172" y="96" width="132" height="116" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="238" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">构建镜像</text>
      <text x="238" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Dockerfile / base image</text>
      <text x="238" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">产出 tag 与 digest</text>
      <rect x="198" y="176" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="238" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">固定引用</text>

      <rect x="332" y="96" width="148" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="406" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">签名 / Attestation</text>
      <text x="406" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">cosign / provenance</text>
      <text x="406" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">扫描结果 / SBOM</text>
      <rect x="362" y="176" width="88" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="406" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">可信证明</text>

      <rect x="508" y="96" width="124" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="570" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Registry</text>
      <text x="570" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">私有仓库</text>
      <text x="570" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">tag / digest 存放点</text>
      <rect x="530" y="176" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="570" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">谁能拉</text>

      <rect x="660" y="84" width="166" height="140" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="743" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Admission 验证</text>
      <text x="743" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">来源限制 / 禁 `latest`</text>
      <text x="743" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">digest / 签名 / attestation</text>
      <text x="743" y="164" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">SBOM / 流水线证明</text>
      <rect x="690" y="182" width="106" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="743" y="198" text-anchor="middle" font-size="9" fill="var(--d-text)">能不能进集群</text>

      <line x1="144" y1="154" x2="172" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="304" y1="154" x2="332" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="480" y1="154" x2="508" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="632" y1="154" x2="660" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />

      <rect x="220" y="266" width="176" height="88" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="308" y="294" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">kubelet / runtime 拉取</text>
      <text x="308" y="314" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 `imagePullPolicy` 判断</text>
      <text x="308" y="330" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读取 `imagePullSecrets`</text>

      <rect x="464" y="254" width="176" height="112" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="552" y="282" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">容器真正运行</text>
      <text x="552" y="302" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`securityContext`</text>
      <text x="552" y="318" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Pod Security / 最小权限</text>
      <rect x="490" y="332" width="124" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="552" y="347" text-anchor="middle" font-size="9" fill="var(--d-text)">跑起来后权限多大</text>

      <path d="M743 224 C743 256, 382 244, 308 266" fill="none" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="396" y1="310" x2="464" y2="310" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />

      <rect x="92" y="334" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="140" y="350" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">引用稳定性</text>

      <rect x="92" y="364" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="140" y="380" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">拉取认证</text>

      <rect x="668" y="334" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="716" y="350" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">准入验证</text>

      <rect x="668" y="364" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="716" y="380" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">运行时权限</text>
    </svg>

    <svg
      v-else-if="kind === 'image-trust-boundary-map'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 镜像治理边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-image-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 61 - 回答镜像治理时，先把引用、拉取认证、准入验证、运行时权限四层边界拆开，别把所有问题都塞给私有仓库
      </text>

      <rect x="30" y="84" width="188" height="236" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">引用稳定性</text>
      <text x="124" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">tag vs digest</text>
      <text x="124" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">禁 `latest`</text>
      <text x="124" y="174" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">显式写 `imagePullPolicy`</text>
      <text x="124" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">拉的是不是固定内容</text>
      <rect x="74" y="266" width="100" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">先收口引用</text>

      <rect x="234" y="84" width="188" height="236" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">拉取认证</text>
      <text x="328" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`imagePullSecrets`</text>
      <text x="328" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">私有 registry 凭证</text>
      <text x="328" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`AlwaysPullImages`</text>
      <text x="328" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">谁有资格拉这个镜像</text>
      <rect x="278" y="266" width="100" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">再收口凭证</text>

      <rect x="438" y="84" width="188" height="236" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">准入验证</text>
      <text x="532" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">来源前缀 / registry 白名单</text>
      <text x="532" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">签名 / attestation / SBOM</text>
      <text x="532" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">VAP / Kyverno / Sigstore</text>
      <text x="532" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">这个镜像能不能进集群</text>
      <rect x="482" y="266" width="100" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">最后做验证</text>

      <rect x="642" y="84" width="188" height="236" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">运行时权限</text>
      <text x="736" y="138" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`securityContext`</text>
      <text x="736" y="156" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Pod Security</text>
      <text x="736" y="174" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">non-root / no privilege escalation</text>
      <text x="736" y="206" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="224" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">就算可信也别超权</text>
      <rect x="674" y="266" width="124" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">别忘最小权限</text>

      <line x1="218" y1="202" x2="234" y2="202" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-image-boundary)" />
      <line x1="422" y1="202" x2="438" y2="202" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-image-boundary)" />
      <line x1="626" y1="202" x2="642" y2="202" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-image-boundary)" />

      <rect x="114" y="344" width="632" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="363" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先固定引用，再收敛来源，再做验证，最后别忘运行时最小权限
      </text>
    </svg>

    <svg
      v-else-if="kind === 'secret-security-governance-chain'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Secret 安全治理链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-secret-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 62 - Secret 安全不是“放进 Secret 对象”就结束，而是要把对象表达、etcd 加密、RBAC、节点分发和应用消费串成一整条链
      </text>

      <rect x="26" y="112" width="122" height="86" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Secret 真源</text>
      <text x="87" y="160" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Git / 外部 Manager</text>
      <text x="87" y="176" text-anchor="middle" font-size="9" fill="var(--d-client-text)">真正的密码来源</text>

      <rect x="176" y="98" width="132" height="114" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="242" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">apiserver</text>
      <text x="242" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RBAC / Admission</text>
      <text x="242" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">谁能读</text>
      <text x="242" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">谁能创建引用 Secret 的 Pod</text>

      <rect x="336" y="98" width="136" height="114" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="404" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">etcd</text>
      <text x="404" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">at-rest encryption</text>
      <text x="404" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">provider 顺序</text>
      <text x="404" y="178" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">旧数据要 rewrite</text>

      <rect x="500" y="98" width="136" height="114" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="568" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">kubelet / 节点</text>
      <text x="568" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只拿本节点使用到的 Secret</text>
      <text x="568" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">tmpfs 挂载</text>
      <text x="568" y="178" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">仍怕高权限容器</text>

      <rect x="664" y="86" width="170" height="138" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="749" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod / 应用进程</text>
      <text x="749" y="134" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">env / volume / projected</text>
      <text x="749" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">应用是否 reload</text>
      <text x="749" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">日志 / debug 是否泄露</text>
      <rect x="706" y="184" width="86" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="749" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">真正暴露面</text>

      <line x1="148" y1="155" x2="176" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />
      <line x1="308" y1="155" x2="336" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />
      <line x1="472" y1="155" x2="500" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />
      <line x1="636" y1="155" x2="664" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />

      <rect x="68" y="276" width="206" height="86" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="171" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">控制面边界</text>
      <text x="171" y="324" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`Secret` 不等于加密</text>
      <text x="171" y="340" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RBAC 和 Pod create 都会影响读取边界</text>

      <rect x="326" y="276" width="206" height="86" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="429" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">节点执行边界</text>
      <text x="429" y="324" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">kubelet 分发只是中间环节</text>
      <text x="429" y="340" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`privileged` 容器会打穿收益</text>

      <rect x="584" y="276" width="208" height="86" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="688" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">应用消费边界</text>
      <text x="688" y="324" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">平台完成同步，不等于业务完成收敛</text>
      <text x="688" y="340" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">是否 reload 才决定轮转是否真正生效</text>
    </svg>

    <svg
      v-else-if="kind === 'external-secret-delivery-boundary-map'"
      viewBox="0 0 860 398"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 原生 Secret ESO 与 Secrets Store CSI Driver 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-secret-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 63 - 选 Secret 交付方案时，先分清谁是真源、Secret 会不会落回 API、应用是读环境变量还是读文件
      </text>

      <rect x="34" y="86" width="188" height="246" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="128" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">原生 Secret</text>
      <text x="128" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">真源常在 Git / CI / 人工脚本</text>
      <text x="128" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">直接写进 apiserver / etcd</text>
      <text x="128" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">env / volume 都兼容</text>
      <text x="128" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：</text>
      <text x="128" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">最简单、最通用</text>
      <text x="128" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">边界：</text>
      <text x="128" y="268" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">真源和轮转体系通常比较弱</text>
      <rect x="74" y="292" width="108" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="128" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：最兼容</text>

      <rect x="248" y="86" width="188" height="246" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="342" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">ESO</text>
      <text x="342" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">外部 Secret Manager 为真源</text>
      <text x="342" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">controller 同步成 K8s Secret</text>
      <text x="342" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">现有工作负载几乎无感接入</text>
      <text x="342" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优点：</text>
      <text x="342" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">轮转与审计可回外部系统</text>
      <text x="342" y="250" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">边界：</text>
      <text x="342" y="268" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Secret 仍会落回 API / etcd</text>
      <rect x="288" y="292" width="108" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="342" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：真源外置</text>

      <rect x="462" y="86" width="188" height="246" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="556" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Secrets Store CSI Driver</text>
      <text x="556" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">外部 Secret Manager 为真源</text>
      <text x="556" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">通过 CSI volume 直接挂文件</text>
      <text x="556" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">可选 sync 回 K8s Secret</text>
      <text x="556" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：</text>
      <text x="556" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">可以减少 API / etcd 落地</text>
      <text x="556" y="250" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">边界：</text>
      <text x="556" y="268" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">应用最好支持文件读取与 reload</text>
      <rect x="502" y="292" width="108" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="556" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：文件交付</text>

      <rect x="676" y="86" width="150" height="246" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="751" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">真正的选择题</text>
      <text x="751" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">应用只会读 env</text>
      <text x="751" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">还是能读文件</text>
      <text x="751" y="184" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">是否一定要避免</text>
      <text x="751" y="202" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Secret 落回 API / etcd</text>
      <text x="751" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">轮转后业务能不能</text>
      <text x="751" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">自动 reload</text>
      <rect x="703" y="292" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="751" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：消费模型</text>

      <line x1="222" y1="208" x2="248" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-secret-boundary)" />
      <line x1="436" y1="208" x2="462" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-secret-boundary)" />
      <line x1="650" y1="208" x2="676" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-secret-boundary)" />

      <rect x="144" y="350" width="572" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先决定真源，再决定 Secret 是否必须落回 K8s，最后决定应用走 env 还是文件
      </text>
    </svg>

    <svg
      v-else-if="kind === 'api-audit-event-chain'"
      viewBox="0 0 860 402"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s API 审计事件链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-audit-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 64 - Audit 是 `kube-apiserver` 在请求执行各阶段生成的证据链，不是替 RBAC 或 Admission 做放行决策
      </text>

      <rect x="26" y="116" width="110" height="84" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="81" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="81" y="164" text-anchor="middle" font-size="9" fill="var(--d-client-text)">kubectl / CI / Controller</text>

      <rect x="164" y="102" width="128" height="112" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="228" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Authn / Authz</text>
      <text x="228" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">你是谁</text>
      <text x="228" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能不能做</text>

      <rect x="320" y="102" width="128" height="112" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="384" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Admission</text>
      <text x="384" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">mutation / validation</text>
      <text x="384" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">决定能否进集群</text>

      <rect x="476" y="88" width="164" height="140" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="558" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Audit Event</text>
      <text x="558" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`RequestReceived`</text>
      <text x="558" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`ResponseStarted` for long-running</text>
      <text x="558" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`ResponseComplete` / `Panic`</text>
      <rect x="516" y="184" width="84" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="558" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">留证据</text>

      <rect x="668" y="102" width="166" height="112" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="751" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Audit Policy</text>
      <text x="751" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">first match wins</text>
      <text x="751" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Metadata / Request / RequestResponse</text>

      <line x1="136" y1="158" x2="164" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />
      <line x1="292" y1="158" x2="320" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />
      <line x1="448" y1="158" x2="476" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />
      <line x1="640" y1="158" x2="668" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />

      <rect x="172" y="274" width="186" height="90" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="265" y="302" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">log backend</text>
      <text x="265" y="322" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本地文件</text>
      <text x="265" y="338" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">后续再汇聚到日志系统</text>

      <rect x="502" y="260" width="186" height="118" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="595" y="288" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">webhook backend</text>
      <text x="595" y="308" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">实时送外部审计 API</text>
      <text x="595" y="324" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">`batch / blocking / blocking-strict`</text>
      <text x="595" y="340" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">模式越硬，可用性耦合越强</text>

      <path d="M751 214 C751 244, 265 242, 265 274" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-chain)" />
      <path d="M751 214 C751 244, 595 228, 595 260" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-chain)" />

      <rect x="142" y="382" width="576" height="22" rx="11" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="397" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">关键边界：Audit 解决“留下什么证据”，Admission 解决“让不让过”，Event 解决“对象后来怎么样”</text>
    </svg>

    <svg
      v-else-if="kind === 'audit-policy-boundary-map'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Audit Policy 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-audit-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 65 - 设计 Audit Policy 时，先分清规则顺序、级别成本、后端耦合和数据源边界，不要把所有请求都提到 `RequestResponse`
      </text>

      <rect x="30" y="86" width="188" height="240" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">规则匹配</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`rules` 按顺序匹配</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">首个命中生效</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">catch-all 别放太前面</text>
      <text x="124" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">附加边界：</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`omitStages` 全局 + 局部并集</text>
      <text x="124" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`omitManagedFields` 也有全局默认</text>
      <rect x="76" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">先看顺序</text>

      <rect x="234" y="86" width="188" height="240" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">审计级别</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Metadata` 最常用</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Request` 带请求体</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`RequestResponse` 带请求体和响应体</text>
      <text x="328" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">风险：</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`secrets`、token、patch 容易二次泄露</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">级别越高，成本和暴露面越大</text>
      <rect x="280" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">默认 Metadata</text>

      <rect x="438" y="86" width="188" height="240" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">后端选择</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">log backend: 简单直接</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">webhook backend: 便于集中汇聚</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`blocking-strict` 会放大耦合</text>
      <text x="532" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">排障关键词：</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">轮转、缓冲、重试、后端 SLA</text>
      <text x="532" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">别让审计反噬 API 可用性</text>
      <rect x="484" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">再看耦合</text>

      <rect x="642" y="86" width="188" height="240" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">边界辨析</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Audit != Admission</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Audit != Event</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Webhook mutation 可带 audit annotations</text>
      <text x="736" y="210" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">谁做了什么</text>
      <text x="736" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不回答对象后来是否运行异常</text>
      <rect x="688" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">别混数据源</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-boundary)" />

      <rect x="116" y="350" width="628" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先分证据链和门禁，再用 Metadata 为主，最后只对少量高价值对象谨慎提高级别
      </text>
    </svg>

    <svg
      v-else-if="kind === 'node-heartbeat-eviction-chain'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 节点心跳到失联驱逐链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-node-heartbeat" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 66 - 节点失联后不是“立刻迁走”，而是沿着心跳、Lease、节点条件、自动 taint、Pod 容忍时间和 API 发起驱逐逐层收敛
      </text>

      <rect x="24" y="114" width="126" height="88" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubelet</text>
      <text x="87" y="162" text-anchor="middle" font-size="9" fill="var(--d-client-text)">发节点心跳</text>
      <text x="87" y="178" text-anchor="middle" font-size="9" fill="var(--d-client-text)">状态和 Lease</text>

      <rect x="178" y="100" width="148" height="116" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="252" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">NodeStatus + Lease</text>
      <text x="252" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`Lease` 默认更频繁</text>
      <text x="252" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`Node.status` 更像状态快照</text>
      <rect x="210" y="180" width="84" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="252" y="195" text-anchor="middle" font-size="9" fill="var(--d-text)">控制面听心跳</text>

      <rect x="354" y="88" width="150" height="140" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="429" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">node controller</text>
      <text x="429" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">判断 `Ready=True/False/Unknown`</text>
      <text x="429" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">默认几十秒听不到会变 `Unknown`</text>
      <text x="429" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不会一失联就立刻清场</text>
      <rect x="389" y="184" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="429" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">状态判断</text>

      <rect x="532" y="88" width="150" height="140" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="607" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">自动 taint</text>
      <text x="607" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`not-ready` / `unreachable`</text>
      <text x="607" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">scheduler 不再往坏节点放新 Pod</text>
      <text x="607" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`NoExecute` 参与存量处理</text>
      <rect x="567" y="184" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="607" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">调度收口</text>

      <rect x="710" y="74" width="126" height="168" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="773" y="102" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod toleration</text>
      <text x="773" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">默认多为 300s</text>
      <text x="773" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">DaemonSet 常常无限忍</text>
      <text x="773" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">等到时间到了才继续驱逐</text>
      <rect x="731" y="184" width="84" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="773" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">忍多久</text>

      <line x1="150" y1="158" x2="178" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="326" y1="158" x2="354" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="504" y1="158" x2="532" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="682" y1="158" x2="710" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />

      <rect x="208" y="278" width="186" height="86" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="301" y="306" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">API 发起驱逐</text>
      <text x="301" y="326" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">时间到了才会继续提交 eviction</text>
      <text x="301" y="342" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">而且控制器本身也会限速</text>

      <rect x="466" y="264" width="218" height="114" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="575" y="292" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">最难的边界</text>
      <text x="575" y="312" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">API 已经想删，不等于旧节点进程已停</text>
      <text x="575" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">网络分区时原进程可能还在跑</text>
      <text x="575" y="344" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Stateful 服务还要考虑 fencing / 双活风险</text>

      <path d="M773 242 C773 272, 338 248, 301 278" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="394" y1="321" x2="466" y2="321" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
    </svg>

    <svg
      v-else-if="kind === 'node-condition-taint-eviction-boundary-map'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 节点条件 taint 与失联驱逐边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-node-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 67 - 回答节点故障时，先分清人工维护、健康判断、调度约束和存量驱逐四层边界，不要把 `cordon`、`Unknown`、`NoExecute` 混成一句话
      </text>

      <rect x="30" y="86" width="188" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">`cordon / drain`</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">人工维护流程</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`cordon`: 只禁止新调度</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`drain`: 主动迁走旧 Pod</text>
      <text x="124" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">运维是不是在做维护</text>
      <rect x="76" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">人工动作</text>

      <rect x="234" y="86" width="188" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Node Condition</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Ready=False`</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Ready=Unknown`</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">是健康判断，不是迁移动作</text>
      <text x="328" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">控制面怎么看节点</text>
      <rect x="280" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">健康事实</text>

      <rect x="438" y="86" width="188" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">自动 taint</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`not-ready` / `unreachable`</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">让 scheduler 不再继续放新 Pod</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`NoExecute` 影响存量去留</text>
      <text x="532" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">调度和驱逐的约束信号是什么</text>
      <rect x="484" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">约束信号</text>

      <rect x="642" y="86" width="188" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">`NoExecute` + toleration</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">默认普通 Pod 常见 300 秒</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">DaemonSet 常常无限容忍</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">控制存量 Pod 何时被驱逐</text>
      <text x="736" y="210" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">存量什么时候才走</text>
      <rect x="688" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">走得多快</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-boundary)" />

      <rect x="120" y="350" width="620" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先分维护动作、健康事实、约束信号、驱逐时机，再去判断原节点上的进程是否真的停了
      </text>
    </svg>

    <svg
      v-else-if="kind === 'deletion-finalizer-gc-chain'"
      viewBox="0 0 860 390"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 删除 finalizer 与垃圾回收链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-delete-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 68 - K8s 的 delete 不是立刻物理删除，而是沿着 `deletionTimestamp`、finalizer、优雅退出和垃圾回收逐步收敛
      </text>

      <rect x="24" y="126" width="126" height="82" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="154" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">DELETE 请求</text>
      <text x="87" y="174" text-anchor="middle" font-size="9" fill="var(--d-client-text)">`kubectl delete`</text>
      <text x="87" y="190" text-anchor="middle" font-size="9" fill="var(--d-client-text)">或 API DELETE</text>

      <rect x="180" y="104" width="164" height="126" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="262" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">apiserver 标记删除</text>
      <text x="262" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">写 `deletionTimestamp`</text>
      <text x="262" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">对象进入删除中</text>
      <text x="262" y="184" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">很多 CLI 会显示 `Terminating`</text>
      <rect x="218" y="196" width="88" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="262" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">先打标记</text>

      <rect x="374" y="84" width="190" height="166" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="469" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">删除阻塞层</text>
      <text x="469" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">`metadata.finalizers` 还没清空</text>
      <text x="469" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">controller 先做外部资源清理</text>
      <text x="469" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Pod 还可能要走 `preStop / SIGTERM / grace`</text>
      <text x="469" y="180" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">节点失联时，API 和节点进程不一定同步</text>
      <rect x="421" y="204" width="96" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="469" y="219" text-anchor="middle" font-size="9" fill="var(--d-text)">先收尾</text>

      <rect x="594" y="104" width="166" height="126" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="677" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">GC + ownerReferences</text>
      <text x="677" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看 dependents 怎么收敛</text>
      <text x="677" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`Background / Foreground / Orphan`</text>
      <text x="677" y="184" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">前台删除时 owner 会继续等 child</text>
      <rect x="633" y="196" width="88" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="677" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">再级联</text>

      <line x1="150" y1="167" x2="180" y2="167" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-delete-chain)" />
      <line x1="344" y1="167" x2="374" y2="167" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-delete-chain)" />
      <line x1="564" y1="167" x2="594" y2="167" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-delete-chain)" />

      <rect x="268" y="286" width="324" height="74" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="314" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">真正删除</text>
      <text x="430" y="334" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">`finalizers` 为空、阻塞依赖已清、删除流程收口</text>
      <text x="430" y="350" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">对象这时才会真正从 API 里消失</text>

      <path d="M677 230 C677 266, 548 286, 592 323" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-delete-chain)" />
      <path d="M469 250 C469 274, 408 278, 356 286" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-delete-chain)" />
      <rect x="110" y="334" width="112" height="26" rx="13" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="166" y="351" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">别把 delete 当瞬时动作</text>
    </svg>

    <svg
      v-else-if="kind === 'terminating-stuck-boundary-map'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Terminating 卡死边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-terminating-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 69 - 资源卡 `Terminating` 时，先分清 Pod 退出、Finalizer、GC 级联和人工强删四层边界，不要把所有现场混成一句话
      </text>

      <rect x="30" y="86" width="188" height="246" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Pod 退出链路</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`preStop`</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`SIGTERM`</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`terminationGracePeriodSeconds`</text>
      <text x="124" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">卷卸载、kubelet、节点可达性</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">进程和节点侧到底退干净没有</text>
      <rect x="76" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">退出没走完？</text>

      <rect x="234" y="86" width="188" height="246" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Finalizer 清理</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`deletionTimestamp` 已写入</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`metadata.finalizers` 还不为空</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Operator / controller 在清外部资源</text>
      <text x="328" y="194" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">也可能是 controller 已下线</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">是不是还有人声明“先别删完”</text>
      <rect x="280" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">谁在拦删除？</text>

      <rect x="438" y="86" width="188" height="246" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">GC / ownerReferences</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`Foreground / Background / Orphan`</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">owner 在等 child，还是 child 被保留</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">child 自己也可能卡着 finalizer</text>
      <text x="532" y="194" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">别只盯 owner 本身</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">下游依赖是不是还没收口</text>
      <rect x="484" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">是谁在等谁</text>

      <rect x="642" y="86" width="188" height="246" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">人工强删</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`--force --grace-period=0`</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">patch 清空 `finalizers`</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">能清现场，不等于清后果</text>
      <text x="736" y="194" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险是 orphan、漏清理、双活</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">你是不是只在消症状</text>
      <rect x="688" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">风险自负</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-terminating-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-terminating-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-terminating-boundary)" />

      <rect x="116" y="352" width="628" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="371" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先看 `deletionTimestamp`，再看 `finalizers`、`ownerReferences`、节点与 kubelet，最后才考虑强删
      </text>
    </svg>

    <svg
      v-else-if="kind === 'pod-lifecycle-state-flow'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 生命周期状态流转图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pod-life" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 26 - Pod 生命周期里最关键的边界不是“进程起来了”，而是“什么时候 Ready、什么时候异常重启、什么时候开始退出”
      </text>

      <rect x="32" y="104" width="124" height="78" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="94" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pending</text>
      <text x="94" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等调度 / 等卷 / 等镜像</text>
      <text x="94" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod phase</text>

      <rect x="190" y="104" width="136" height="78" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="258" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">ContainerCreating</text>
      <text x="258" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">网络、卷、镜像、init</text>
      <text x="258" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">CLI 现场状态</text>

      <rect x="360" y="104" width="124" height="78" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="422" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Running</text>
      <text x="422" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">进程已启动</text>
      <text x="422" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">但不一定能接流量</text>

      <rect x="518" y="104" width="124" height="78" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="580" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Ready</text>
      <text x="580" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">readiness 通过</text>
      <text x="580" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">允许进入后端池</text>

      <rect x="690" y="104" width="138" height="78" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="759" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Terminating</text>
      <text x="759" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DeletionTimestamp</text>
      <text x="759" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">preStop / SIGTERM / grace</text>

      <line x1="156" y1="143" x2="190" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />
      <line x1="326" y1="143" x2="360" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />
      <line x1="484" y1="143" x2="518" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />
      <line x1="642" y1="143" x2="690" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />

      <rect x="276" y="236" width="292" height="82" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="422" y="264" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">CrashLoopBackOff</text>
      <text x="422" y="284" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">常见原因：进程退出、配置错误、端口冲突</text>
      <text x="422" y="300" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">或 liveness 太激进、慢启动却没配 startupProbe</text>

      <line x1="422" y1="182" x2="422" y2="236" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />

      <rect x="88" y="324" width="684" height="22" rx="11" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="339" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        重点区分：Pod phase 很粗，容器状态更细，kubectl STATUS 还会把现场现象像 CrashLoopBackOff、ContainerCreating 直接展示出来
      </text>
    </svg>

    <svg
      v-else-if="kind === 'probe-gating-chain'"
      viewBox="0 0 860 356"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 探针接管链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-probe-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 27 - 三类探针不是并列关系：通常先保护启动，再决定能不能接流量，最后才长期检查是否要重启
      </text>

      <rect x="38" y="112" width="150" height="82" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="113" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">startupProbe</text>
      <text x="113" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保护慢启动</text>
      <text x="113" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">没成功前别急着判死</text>

      <rect x="236" y="112" width="154" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="313" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">应用启动完成</text>
      <text x="313" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">配置、缓存、连接池</text>
      <text x="313" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">预热完成</text>

      <rect x="438" y="112" width="154" height="82" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="515" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">readinessProbe</text>
      <text x="515" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">判断能否接流量</text>
      <text x="515" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">失败时摘出 EndpointSlice</text>

      <rect x="640" y="112" width="182" height="82" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="731" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">livenessProbe</text>
      <text x="731" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">运行期长期检查</text>
      <text x="731" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败时触发容器重启</text>

      <line x1="188" y1="153" x2="236" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-probe-chain)" />
      <line x1="390" y1="153" x2="438" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-probe-chain)" />
      <line x1="592" y1="153" x2="640" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-probe-chain)" />

      <rect x="90" y="242" width="266" height="66" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="223" y="268" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">readiness 失败</text>
      <text x="223" y="288" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">通常是摘流量，不一定重启</text>

      <rect x="504" y="242" width="266" height="66" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="637" y="268" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">liveness 失败</text>
      <text x="637" y="288" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">通常会重启容器，误配会制造 CrashLoop</text>

      <line x1="515" y1="194" x2="278" y2="242" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-probe-chain)" />
      <line x1="731" y1="194" x2="637" y2="242" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-probe-chain)" />
    </svg>

    <svg
      v-else-if="kind === 'east-west-mesh-chain'"
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

    <svg
      v-else-if="kind === 'service-discovery-chain'"
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

    <svg
      v-else-if="kind === 'autoscaling-control-chain'"
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
  </DiagramFrame>
</template>
