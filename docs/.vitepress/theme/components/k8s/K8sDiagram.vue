<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

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
  | 'pdb-eviction-drain-chain'
  | 'disruption-budget-boundary-map'
  | 'priority-preemption-scheduling-chain'
  | 'priority-preemption-boundary-map'
  | 'daemonset-node-resident-chain'
  | 'daemonset-update-and-drain-boundary-map'
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
  'pdb-eviction-drain-chain': '860px',
  'disruption-budget-boundary-map': '860px',
  'priority-preemption-scheduling-chain': '860px',
  'priority-preemption-boundary-map': '860px',
  'daemonset-node-resident-chain': '860px',
  'daemonset-update-and-drain-boundary-map': '860px',
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

/* ── Lazy-loaded sub-components ── */

const K8sOverviewDiagrams = defineAsyncComponent(() => import('./K8sOverviewDiagrams.vue'))
const K8sNetworkDiagrams = defineAsyncComponent(() => import('./K8sNetworkDiagrams.vue'))
const K8sWorkloadDiagrams = defineAsyncComponent(() => import('./K8sWorkloadDiagrams.vue'))
const K8sSchedulingResourceDiagrams = defineAsyncComponent(() => import('./K8sSchedulingResourceDiagrams.vue'))
const K8sSecurityDiagrams = defineAsyncComponent(() => import('./K8sSecurityDiagrams.vue'))
const K8sStorageControlPlaneDiagrams = defineAsyncComponent(() => import('./K8sStorageControlPlaneDiagrams.vue'))
const K8sTrafficIngressDiagrams = defineAsyncComponent(() => import('./K8sTrafficIngressDiagrams.vue'))
const K8sConfigSecretAuditDiagrams = defineAsyncComponent(() => import('./K8sConfigSecretAuditDiagrams.vue'))
const K8sNodeLifecycleDiagrams = defineAsyncComponent(() => import('./K8sNodeLifecycleDiagrams.vue'))
const K8sServiceMeshRuntimeDiagrams = defineAsyncComponent(() => import('./K8sServiceMeshRuntimeDiagrams.vue'))
const K8sServiceDiscoveryDiagrams = defineAsyncComponent(() => import('./K8sServiceDiscoveryDiagrams.vue'))
const K8sDisruptionSchedulingDiagrams = defineAsyncComponent(() => import('./K8sDisruptionSchedulingDiagrams.vue'))
const K8sAutoscalingHaDiagrams = defineAsyncComponent(() => import('./K8sAutoscalingHaDiagrams.vue'))

/* ── Kind → sub-component routing ── */

const overviewKinds = new Set<DiagramKind>([
  'overview', 'depth-map', 'control-plane', 'workload-map', 'interview-ladder',
])
const networkKinds = new Set<DiagramKind>([
  'ip-whitelist-patterns', 'source-ip-preservation', 'external-traffic-policy',
  'service-network-chain', 'network-troubleshooting-playbook',
])
const workloadKinds = new Set<DiagramKind>([
  'statefulset-stable-identity', 'headless-service-dns',
  'zero-downtime-rollout-chain', 'pod-termination-timeline',
  'pod-lifecycle-state-flow', 'probe-gating-chain',
  'pod-collaboration-chain', 'pod-container-role-map',
  'job-cronjob-control-chain', 'workload-controller-boundary-map',
])
const schedulingResourceKinds = new Set<DiagramKind>([
  'scheduling-decision-chain', 'resource-pressure-outcomes',
  'resource-enforcement-chain', 'requests-limits-qos-boundary-map',
  'namespace-resource-governance-chain', 'limitrange-resourcequota-boundary-map',
])
const securityKinds = new Set<DiagramKind>([
  'api-security-chain', 'workload-isolation-boundary',
  'serviceaccount-token-identity-chain', 'serviceaccount-token-boundary-map',
  'rbac-evaluation-chain', 'rbac-binding-boundary-map',
  'pod-security-enforcement-chain', 'security-context-boundary-map',
  'admission-policy-chain', 'policy-engine-boundary-map',
])
const storageControlPlaneKinds = new Set<DiagramKind>([
  'storage-data-chain', 'volume-failure-playbook',
  'reconcile-loop-chain', 'controller-family-map',
  'control-plane-mainline-chain',
])
const trafficIngressKinds = new Set<DiagramKind>([
  'traffic-entry-chain', 'l4-l7-termination-map',
  'ingress-controller-chain', 'gateway-controller-attachment-map',
])
const configSecretAuditKinds = new Set<DiagramKind>([
  'config-injection-update-chain', 'config-consumption-boundary-map',
  'image-supply-chain-chain', 'image-trust-boundary-map',
  'secret-security-governance-chain', 'external-secret-delivery-boundary-map',
  'api-audit-event-chain', 'audit-policy-boundary-map',
])
const nodeLifecycleKinds = new Set<DiagramKind>([
  'node-heartbeat-eviction-chain', 'node-condition-taint-eviction-boundary-map',
  'deletion-finalizer-gc-chain', 'terminating-stuck-boundary-map',
])
const serviceMeshRuntimeKinds = new Set<DiagramKind>([
  'east-west-mesh-chain', 'mesh-boundary-map',
  'node-execution-chain', 'sandbox-runtime-network-storage',
  'service-dataplane-chain', 'iptables-vs-ipvs-map',
])
const serviceDiscoveryKinds = new Set<DiagramKind>([
  'service-discovery-chain', 'service-dns-answer-map',
  'endpointslice-reconcile-chain', 'endpoint-conditions-boundary-map',
])
const disruptionSchedulingKinds = new Set<DiagramKind>([
  'pdb-eviction-drain-chain', 'disruption-budget-boundary-map',
  'priority-preemption-scheduling-chain', 'priority-preemption-boundary-map',
  'daemonset-node-resident-chain', 'daemonset-update-and-drain-boundary-map',
  'networkpolicy-enforcement-chain', 'networkpolicy-selector-logic',
])
const autoscalingHaKinds = new Set<DiagramKind>([
  'autoscaling-control-chain', 'hpa-vpa-ca-boundary-map',
  'replica-spread-ha-chain', 'spread-constraint-boundary-map',
])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <K8sOverviewDiagrams v-if="overviewKinds.has(kind)" :kind="kind as any" />
    <K8sNetworkDiagrams v-else-if="networkKinds.has(kind)" :kind="kind as any" />
    <K8sWorkloadDiagrams v-else-if="workloadKinds.has(kind)" :kind="kind as any" />
    <K8sSchedulingResourceDiagrams v-else-if="schedulingResourceKinds.has(kind)" :kind="kind as any" />
    <K8sSecurityDiagrams v-else-if="securityKinds.has(kind)" :kind="kind as any" />
    <K8sStorageControlPlaneDiagrams v-else-if="storageControlPlaneKinds.has(kind)" :kind="kind as any" />
    <K8sTrafficIngressDiagrams v-else-if="trafficIngressKinds.has(kind)" :kind="kind as any" />
    <K8sConfigSecretAuditDiagrams v-else-if="configSecretAuditKinds.has(kind)" :kind="kind as any" />
    <K8sNodeLifecycleDiagrams v-else-if="nodeLifecycleKinds.has(kind)" :kind="kind as any" />
    <K8sServiceMeshRuntimeDiagrams v-else-if="serviceMeshRuntimeKinds.has(kind)" :kind="kind as any" />
    <K8sServiceDiscoveryDiagrams v-else-if="serviceDiscoveryKinds.has(kind)" :kind="kind as any" />
    <K8sDisruptionSchedulingDiagrams v-else-if="disruptionSchedulingKinds.has(kind)" :kind="kind as any" />
    <K8sAutoscalingHaDiagrams v-else-if="autoscalingHaKinds.has(kind)" :kind="kind as any" />
  </DiagramFrame>
</template>
