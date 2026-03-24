---
title: K8s 专题
description: 系统整理 Kubernetes 必备知识，按由浅入深梳理核心对象、调度与资源、网络与存储、发布治理、安全与控制面原理。
---

# K8s 专题

这个专题把 Kubernetes 从“会写 YAML”提升到“能解释机制、能定位问题、能回答高频追问”的层面。重点不是把 API 列全，而是先抓住最常被问、最容易踩坑、最能拉开理解深度的主线。

<K8sDiagram kind="overview" />

## 适合谁看

- 已经在用 Docker 和容器，但对 Kubernetes 还停留在 Deployment + Service 的表层
- 面试里经常被追问 Pod、调度、探针、滚动发布、网络、存储，但回答不成体系
- 需要把 Go 或其他后端服务落到 K8s 上，想把发布、扩缩容和故障排查讲清楚
- 正在从传统运维或单机部署转向云原生平台，需要先建立统一对象模型

## 你会得到什么

- 一套从控制面到工作负载、从网络存储到发布治理的统一认知框架
- 一份按由浅入深整理的 K8s 必备问题清单，适合面试和日常复盘
- 一组“说原理 + 说场景 + 说取舍”的答题模板，避免只会背名词

<K8sDiagram kind="depth-map" />

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [核心概念与对象模型](./core-concepts.md) | K8s 解决什么问题、控制面与节点组件、Pod/Deployment/StatefulSet/Service/Ingress、调度与资源、存储与生命周期 |
| [必备问题清单](./essential-questions.md) | 按由浅入深整理高频问题，覆盖工作负载、发布、调度、网络、存储、安全、排障与控制面机制 |
| [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md) | 系统讲清 Pod phase、`Running`/`Ready`、`CrashLoopBackOff` 与 `startup/readiness/liveness` 三类探针的边界 |
| [Pod 内多容器协作实战](./pod-multi-container-collaboration.md) | 系统讲清为什么 Pod 是最小调度单元，以及主容器、Init Container、Sidecar、临时容器、共享网络与共享卷的边界 |
| [Job 与 CronJob 批处理链路实战](./job-and-cronjob-batch-workloads.md) | 系统讲清 Job、CronJob、重试、补跑、并发策略、历史清理与幂等性边界，以及为什么一次性任务不该用 Deployment |
| [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md) | 系统讲清 ConfigMap、Secret、`env`、`envFrom`、`volume`、`projected volume`、`subPath`、热更新传播与安全边界 |
| [调度与驱逐链路实战](./scheduling-and-eviction.md) | 把 Pending、OOMKilled、Evicted 以及 requests、QoS、优先级、污点容忍放回同一条链路里 |
| [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md) | 系统讲清 PriorityClass、调度队列顺序、scheduler preemption、`nominatedNodeName`、非抢占优先级、PDB best effort、QoS 与节点压力驱逐的边界 |
| [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md) | 系统讲清 requests、limits、QoS、CPU throttling、OOMKilled 和节点压力之间的关系，以及为什么“能调度”不等于“跑得稳” |
| [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md) | 系统讲清 HPA、VPA、Cluster Autoscaler 如何围绕 requests、Pending、节点容量和 Ready 收敛协同工作 |
| [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md) | 系统讲清 podAntiAffinity、topologySpreadConstraints、PodDisruptionBudget、drain 如何围绕节点、可用区和维护窗口共同保障高可用 |
| [零停机发布链路实战](./zero-downtime-rollout.md) | 把 readiness、preStop、SIGTERM、grace period、PDB 串成一条真正可用的发布链路 |
| [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md) | 系统讲清 voluntary/involuntary disruption、PodDisruptionBudget、Eviction API、`kubectl drain`、`429 Too Many Requests` 与 `unhealthyPodEvictionPolicy` |
| [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md) | 讲清稳定实例身份、成员级 DNS、独立 PVC，以及为什么它解决的不是固定 Pod IP |
| [存储与数据链路实战](./storage-and-data-lifecycle.md) | 拆清 PV、PVC、StorageClass、CSI、扩容、回收策略和常见挂载故障 |
| [认证、授权与隔离链路实战](./authn-authz-and-isolation.md) | 拆清 ServiceAccount、RBAC、Admission、Secret、NetworkPolicy 的边界与协作关系 |
| [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md) | 系统讲清 ServiceAccount、自动挂载 token、projected serviceAccountToken、TokenRequest、audience、自动轮转与 Pod 身份边界 |
| [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md) | 系统讲清 Role、ClusterRole、RoleBinding、ClusterRoleBinding、resourceNames、subresource、serviceaccounts/token、bind、escalate、impersonate 与最小权限设计边界 |
| [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md) | 系统讲清 SecurityContext、Pod Security Admission、Pod Security Standards、runAsNonRoot、allowPrivilegeEscalation、privileged、capabilities、seccomp、host namespaces 与 hostPath 的安全边界 |
| [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md) | 系统讲清内建 Admission Controllers、Mutating/Validating Webhook、ValidatingAdmissionPolicy、Pod Security Admission、OPA Gatekeeper、Kyverno 的职责边界与选型 |
| [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md) | 系统讲清镜像 tag 与 digest、imagePullPolicy、imagePullSecrets、AlwaysPullImages、镜像来源限制、签名校验、attestation、SBOM 与供应链治理边界 |
| [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md) | 系统讲清 Secret 的 base64 与真正加密、etcd at-rest encryption、KMS、RBAC 边界、节点分发、ESO、Secrets Store CSI Driver 与轮转收敛 |
| [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md) | 系统讲清 API Audit 的执行位置、Audit Policy、规则顺序、级别、阶段、log 与 webhook backend、admission webhook audit annotations 与审计日志边界 |
| [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md) | 系统讲清 Namespace、LimitRange、ResourceQuota 如何围绕默认值、单对象边界、命名空间总预算和对象数量配额共同做资源治理 |
| [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md) | 讲清 controller、reconcile loop、Deployment、HPA、CRD、Operator 如何协同工作 |
| [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md) | 系统讲清 delete、`deletionTimestamp`、`finalizers`、`ownerReferences`、垃圾回收、`Foreground/Background/Orphan`、Pod `Terminating` 与控制面对象删除边界 |
| [控制面主线实战](./control-plane-mainline.md) | 系统讲清 `kube-apiserver`、`etcd`、`kube-scheduler`、`kube-controller-manager` 如何把声明变成真正运行的 Pod |
| [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md) | 系统讲清节点心跳、Lease、Ready `False/Unknown`、自动 taint、`NoExecute`、`tolerationSeconds`、失联驱逐与网络分区边界 |
| [节点执行链路实战](./node-execution-chain.md) | 系统讲清 `kubelet`、`CRI`、`container runtime`、Pod sandbox、`CNI`、`CSI` 如何把一个已调度的 Pod 真正跑起来 |
| [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md) | 拆清 ClusterIP、NodePort、LoadBalancer、Ingress、Gateway API、TLS 终止与真实源地址 |
| [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md) | 系统讲清 Ingress、IngressClass、GatewayClass、Gateway、HTTPRoute 背后的控制器接管、路由下发、地址分配与常见排障方法 |
| [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md) | 系统讲清服务名解析、CoreDNS、普通 Service DNS、Headless Service DNS、dnsPolicy、ndots 与常见服务发现排障方法 |
| [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md) | 系统讲清 EndpointSlice、Service selector、`ready/serving/terminating`、`publishNotReadyAddresses`、滚动发布摘流量，以及为什么 Pod `Running` 了也不一定已经进后端池 |
| [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md) | 系统讲清 Service VIP、EndpointSlice、kube-proxy、iptables、IPVS、NodePort 与 externalTrafficPolicy 的数据面实现和排障方法 |
| [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md) | 系统讲清 NetworkPolicy 的默认拒绝、Ingress/Egress、生效前提、selector 语义、DNS 放行、ipBlock 边界与常见排障方法 |
| [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md) | 系统讲清南北向与东西向边界，以及 Service Mesh、Sidecar、mTLS、重试、熔断、灰度与 Egress Gateway |
| [K8s 网络排障手册](./network-troubleshooting.md) | 按 Service、EndpointSlice、kube-proxy、CNI、Pod 五层链路系统排查网络问题 |
| [固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md) | Pod 动态 IP、固定入口 IP、固定出口 IP、第三方白名单、真实客户端 IP 保留与常见反模式 |
| [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md) | `Cluster` 与 `Local` 的差异、为什么能保留源地址、副作用、健康检查、滚动发布与适用边界 |
| [容器化与云原生实践](/golang/guide/10-containerization-cloud-native) | 从 Go 服务视角看 Docker、探针、优雅终止、配置注入与 K8s 部署 |
| [etcd 专题](/etcd/) | 理解 etcd 在 Kubernetes 控制面中的角色，以及一致性、Lease、Watch 等关键能力 |

## 建议阅读顺序

1. 先看 [核心概念与对象模型](./core-concepts.md)，建立 K8s 的统一框架
2. 再看 [必备问题清单](./essential-questions.md)，按由浅入深过一遍高频题
3. 再看 [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)，把 `Pending / ContainerCreating / Running / Ready / CrashLoopBackOff / Terminating` 和 `startup / readiness / liveness` 这条线讲清楚
4. 再看 [Pod 内多容器协作实战](./pod-multi-container-collaboration.md)，把“为什么 Pod 不是容器”“Init / Sidecar / 临时容器分别解决什么”“共享网络和共享卷意味着什么”这条协作边界讲清楚
5. 再看 [Job 与 CronJob 批处理链路实战](./job-and-cronjob-batch-workloads.md)，把“持续在线”和“成功完成”彻底区分开，再把 `重试 / 补跑 / 并发策略 / 幂等性` 这条批处理主线讲顺
6. 再看 [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)，把 `env / envFrom / volume / projected volume / subPath / 热更新 / Secret 暴露面` 这条配置传播主线讲顺
7. 再看 [调度与驱逐链路实战](./scheduling-and-eviction.md)，把 `Pending / OOMKilled / Evicted` 和 `requests / QoS / PriorityClass / taints` 这条线讲清楚
8. 再看 [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)，把 `PriorityClass / queue order / preemption / nominatedNodeName / PDB best effort / non-preempting` 这条调度让路线讲顺
9. 再看 [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)，把 `requests / limits / QoS / throttling / OOMKilled` 这条运行时边界链路讲顺
10. 再看 [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)，把 `HPA / VPA / Cluster Autoscaler / requests / Pending / Ready` 这条容量协同链路讲顺
11. 再看 [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)，把 `podAntiAffinity / topologySpreadConstraints / PDB / drain / zone` 这条高可用分布链路讲顺
12. 再看 [零停机发布链路实战](./zero-downtime-rollout.md)，把 `readiness -> preStop -> SIGTERM -> grace period -> PDB` 这条链路串起来
13. 再看 [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)，把 `voluntary disruption / Eviction API / 429 / drain / unhealthyPodEvictionPolicy` 这条维护预算链路讲顺
14. 再看 [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)，把“稳定身份、稳定 DNS、稳定 PVC”和“固定 Pod IP”彻底区分开
15. 再看 [存储与数据链路实战](./storage-and-data-lifecycle.md)，把 `PVC / PV / StorageClass / CSI / reclaimPolicy` 这条线讲清楚
16. 再看 [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)，把 `ServiceAccount / RBAC / Admission / Secret / NetworkPolicy` 的边界彻底拆开
17. 再看 [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)，把 `默认 token 自动挂载 / automountServiceAccountToken / projected serviceAccountToken / audience / TokenRequest / 轮转` 这条身份凭证主线讲顺
18. 再看 [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)，把 `Role / ClusterRole / RoleBinding / ClusterRoleBinding / resourceNames / bind / escalate / impersonate / serviceaccounts/token` 这条权限边界主线讲顺
19. 再看 [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)，把 `runAsNonRoot / allowPrivilegeEscalation / privileged / capabilities / seccomp / hostPath / host namespaces / Pod Security Admission` 这条运行权限主线讲顺
20. 再看 [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)，把 `内建 admission / webhook / ValidatingAdmissionPolicy / Gatekeeper / Kyverno / mutation vs validation` 这条治理主线讲顺
21. 再看 [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)，把 `tag / digest / imagePullPolicy / imagePullSecrets / AlwaysPullImages / 签名 / attestation / SBOM` 这条镜像治理主线讲顺
22. 再看 [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)，把 `at-rest encryption / RBAC / Pod create / ESO / CSI Driver / rotation` 这条 Secret 治理主线讲顺
23. 再看 [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)，把 `audit stages / levels / first match wins / log vs webhook / audit vs event` 这条证据链主线讲顺
24. 再看 [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)，把 `Namespace / LimitRange / ResourceQuota / 对象数量配额 / PVC 配额` 这条多团队资源治理链路讲顺
25. 再看 [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)，把 `controller / reconcile / Deployment / HPA / CRD / Operator` 这条主线讲清楚
26. 再看 [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)，把 `delete / deletionTimestamp / finalizers / ownerReferences / Foreground / Background / Orphan / Pod Terminating` 这条删除收敛链路讲顺
27. 再看 [控制面主线实战](./control-plane-mainline.md)，把 `apiserver / etcd / scheduler / controller-manager / kubelet` 这条链路讲顺
28. 再看 [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)，把 `Lease / Ready False / Unknown / auto taint / NoExecute / tolerationSeconds / 网络分区` 这条节点故障收敛链路讲顺
29. 再看 [节点执行链路实战](./node-execution-chain.md)，把 `kubelet / CRI / runtime / sandbox / CNI / CSI / probe` 这条线讲顺
30. 再看 [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)，把 `ClusterIP / NodePort / LoadBalancer / Ingress / Gateway API / TLS` 的边界拆开
31. 再看 [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)，把 `IngressClass / GatewayClass / controller / address pending / route attachment` 这条控制器接管链路讲顺
32. 再看 [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)，把 `service name / CoreDNS / Headless Service / dnsPolicy / ndots` 这条解析链路讲顺
33. 再看 [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)，把 `Service selector / EndpointSlice / ready / serving / terminating / publishNotReadyAddresses / 流量摘入池` 这条后端收敛链路讲顺
34. 再看 [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)，把 `Service VIP / EndpointSlice / kube-proxy / iptables / IPVS / NodePort` 这条数据面链路讲顺
35. 再看 [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md)，把 `default deny / ingress / egress / selector / DNS 放行` 这条访问控制链路讲顺
36. 再看 [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)，把 `Service / Ingress / Mesh / mTLS / retry / egress` 的边界拆开
37. 再看 [K8s 网络排障手册](./network-troubleshooting.md)，把 `Service -> EndpointSlice -> kube-proxy -> CNI -> Pod` 这条排障链路走顺
38. 再看 [固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)，把动态 IP、白名单和真实客户端 IP 的问题彻底拆开
39. 再看 [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)，把入口侧的源地址保留和流量分布权衡讲透
40. 然后结合 [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)，把探针、优雅关闭、配置和发布放回服务部署场景
41. 最后补 [etcd 专题](/etcd/)，理解控制面的底层一致性基础

## 建议怎么用这个专题

- 如果你是第一次系统学 K8s：按“对象模型 -> 问题清单 -> 实战部署”的顺序走
- 如果你在准备面试：优先看 [必备问题清单](./essential-questions.md)，再回跳 [核心概念与对象模型](./core-concepts.md) 补底层逻辑
- 如果你在排查线上问题：重点回看 Pod 生命周期、探针、滚动发布、调度、网络、存储和优雅终止几个章节

## 关联资料

- [架构师学习路线](/architecture/architect-learning-roadmap)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
- [etcd 专题](/etcd/)
- [运维方向待补主题](/ops/todo-topics)
