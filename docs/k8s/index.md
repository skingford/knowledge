---
title: K8s 专题
description: 系统整理 Kubernetes 必备知识，按由浅入深梳理核心对象、调度与资源、网络与存储、发布治理、安全与控制面原理。
---

# K8s 专题

这个专题把 Kubernetes 从"会写 YAML"提升到"能解释机制、能定位问题、能回答高频追问"的层面。重点不是把 API 列全，而是先抓住最常被问、最容易踩坑、最能拉开理解深度的主线。

<K8sDiagram kind="overview" />

## 适合谁看

- 已经在用 Docker 和容器，但对 Kubernetes 还停留在 Deployment + Service 的表层
- 面试里经常被追问 Pod、调度、探针、滚动发布、网络、存储，但回答不成体系
- 需要把 Go 或其他后端服务落到 K8s 上，想把发布、扩缩容和故障排查讲清楚
- 正在从传统运维或单机部署转向云原生平台，需要先建立统一对象模型

## 你会得到什么

- 一套从控制面到工作负载、从网络存储到发布治理的统一认知框架
- 一份按由浅入深整理的 K8s 必备问题清单，适合面试和日常复盘
- 一组"说原理 + 说场景 + 说取舍"的答题模板，避免只会背名词

<K8sDiagram kind="depth-map" />

## 内容结构

### 一、全局认知

> 先建框架，再填细节。这一层解决"K8s 到底是什么、怎么排障"。

| 文档 | 覆盖内容 |
| --- | --- |
| [核心概念与对象模型](./core-concepts.md) | K8s 解决什么问题、控制面与节点组件、声明式 + 控制循环、核心对象模型 |
| [必备问题清单](./essential-questions.md) | 按由浅入深整理高频问题，覆盖工作负载、发布、调度、网络、存储、安全与控制面 |
| [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md) | describe/logs/events/exec/debug 常用命令、Pod 状态判断流程、排障决策树 |

### 二、Pod 与工作负载

> 理解 K8s 最小调度单元和各类工作负载控制器的边界。

| 文档 | 覆盖内容 |
| --- | --- |
| [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md) | Pod phase、容器状态、startup/readiness/liveness 探针的职责边界 |
| [Pod 内多容器协作实战](./pod-multi-container-collaboration.md) | Init Container、Sidecar、临时容器、共享网络与共享卷 |
| [Job 与 CronJob 批处理链路实战](./job-and-cronjob-batch-workloads.md) | 重试、补跑、并发策略、历史清理与幂等性边界 |
| [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md) | env/envFrom/volume/projected volume/subPath、热更新与安全边界 |
| [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md) | 稳定身份、成员级 DNS、独立 PVC |
| [DaemonSet 节点驻留与更新边界实战](./daemonset-node-resident-and-update-boundaries.md) | 节点驻留语义、自动容忍、滚动更新、cordon/drain 边界 |

### 三、调度与资源

> 理解 Pod 怎么被放到节点上，以及运行时的资源边界。

| 文档 | 覆盖内容 |
| --- | --- |
| [调度与驱逐链路实战](./scheduling-and-eviction.md) | Pending/OOMKilled/Evicted、requests/QoS/PriorityClass/taints |
| [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md) | 调度队列、抢占、nominatedNodeName、PDB best effort |
| [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md) | requests/limits/QoS/throttling/OOMKilled 与节点压力 |
| [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md) | HPA/VPA/Cluster Autoscaler 协同工作 |

### 四、发布与高可用

> 理解怎么安全发布、安全维护、安全删除。

| 文档 | 覆盖内容 |
| --- | --- |
| [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md) | podAntiAffinity/topologySpreadConstraints/PDB/drain |
| [零停机发布链路实战](./zero-downtime-rollout.md) | readiness → preStop → SIGTERM → grace period → PDB |
| [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md) | voluntary disruption/Eviction API/429/drain |
| [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md) | deletionTimestamp/finalizers/ownerReferences/垃圾回收 |

### 五、存储

> 理解 Pod 的持久化数据怎么管理。

| 文档 | 覆盖内容 |
| --- | --- |
| [存储与数据链路实战](./storage-and-data-lifecycle.md) | PV/PVC/StorageClass/CSI、扩容、回收策略、挂载故障排查 |

### 六、网络与服务发现

> 理解流量怎么进集群、怎么找到 Pod、怎么做访问控制。

| 文档 | 覆盖内容 |
| --- | --- |
| [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md) | ClusterIP/NodePort/LoadBalancer/Ingress/Gateway API |
| [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md) | IngressClass/GatewayClass/controller 接管与路由下发 |
| [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md) | 服务名解析、Headless Service DNS、dnsPolicy/ndots |
| [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md) | Service selector/EndpointSlice/ready/serving/terminating |
| [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md) | Service VIP/iptables/IPVS/NodePort 数据面 |
| [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md) | 默认拒绝/Ingress/Egress/selector/DNS 放行 |
| [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md) | Sidecar/mTLS/重试/熔断/灰度/Egress Gateway |
| [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md) | 源地址保留、Cluster vs Local 权衡 |
| [固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md) | 固定 IP、白名单、真实客户端 IP |
| [K8s 网络排障手册](./network-troubleshooting.md) | Service → EndpointSlice → kube-proxy → CNI → Pod 五层排查 |

### 七、安全与权限

> 理解谁能做什么、Pod 能干什么、怎么治理。

| 文档 | 覆盖内容 |
| --- | --- |
| [认证、授权与隔离链路实战](./authn-authz-and-isolation.md) | ServiceAccount/RBAC/Admission/Secret/NetworkPolicy 边界 |
| [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md) | 自动挂载 token/projected token/TokenRequest/轮转 |
| [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md) | Role/ClusterRole/Binding/resourceNames/bind/escalate |
| [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md) | runAsNonRoot/privileged/capabilities/seccomp/Pod Security Admission |
| [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md) | Webhook/ValidatingAdmissionPolicy/Gatekeeper/Kyverno |
| [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md) | tag vs digest/imagePullPolicy/签名校验/SBOM |
| [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md) | at-rest encryption/KMS/ESO/Secrets Store CSI Driver |
| [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md) | Audit Policy/规则顺序/级别/阶段/log vs webhook |
| [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md) | LimitRange/ResourceQuota/对象数量配额 |

### 八、控制面与节点

> 理解 K8s 内部怎么把声明变成现实。

| 文档 | 覆盖内容 |
| --- | --- |
| [控制面主线实战](./control-plane-mainline.md) | apiserver/etcd/scheduler/controller-manager 协作链路 |
| [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md) | controller/reconcile loop/Deployment/HPA/CRD/Operator |
| [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md) | Lease/Ready False/Unknown/auto taint/NoExecute |
| [节点执行链路实战](./node-execution-chain.md) | kubelet/CRI/runtime/sandbox/CNI/CSI |

### 九、进阶与生态

> K8s 之上的扩展能力和工程实践。

| 文档 | 覆盖内容 |
| --- | --- |
| [CRD、Operator 与扩展机制实战](./crd-operator-and-extension.md) | CRD 定义与校验、Operator 模式、controller-runtime |
| [Helm 与包管理实战](./helm-and-package-management.md) | Chart 结构、values 管理、install/upgrade/rollback、仓库与依赖 |
| [可观测性与监控实战](./observability-and-monitoring.md) | Metrics Server/Prometheus/Fluent Bit/OpenTelemetry |
| [GitOps 与持续交付实战](./gitops-and-delivery.md) | GitOps 理念、ArgoCD/Flux、CI/CD 对接模式 |
| [实战部署指南](./production-deployment-guide.md) | 小集群/大集群两套方案：搭建、网络、存储、发布、安全、观测、容灾 |
| [内网离线集群搭建操作指南](./offline-cluster-setup-guide.md) | 离线资源准备、Harbor 私有仓库、kubeadm 单 Master/高可用、CNI/存储/运维 |
| [管理面板与可视化工具实战](./dashboard-and-management-ui.md) | k9s/Dashboard/Headlamp/Rancher/KubeSphere 选型、安装与安全实践 |
| [集群搭建实操](./cluster-setup-kubeadm-kubesphere.md) | kubeadm + containerd + Calico + KubeSphere + Helm + Nginx Ingress 从零到登录 |
| [容器化与云原生实践](/golang/guide/10-containerization-cloud-native) | 从 Go 服务视角看探针、优雅终止、配置注入与 K8s 部署 |
| [etcd 专题](/etcd/) | 理解 etcd 在 Kubernetes 控制面中的角色与一致性基础 |

## 建议阅读顺序

按分层递进阅读效果最好：

1. **全局认知**：先看核心概念建立框架 → 再用高频问题检验理解 → kubectl 排障速查随时备查
2. **Pod 与负载**：从 Pod 生命周期开始 → 多容器协作 → 各类工作负载控制器（Job/StatefulSet/DaemonSet） → 配置注入
3. **调度与资源**：调度驱逐 → 优先级抢占 → 资源压力 → 弹性扩缩容
4. **发布与高可用**：副本打散 → 零停机发布 → PDB 与 drain → 删除与终止
5. **存储**：PV/PVC/StorageClass/CSI 一条线讲清
6. **网络与发现**：服务暴露 → Ingress/Gateway → DNS → EndpointSlice → kube-proxy → NetworkPolicy → Service Mesh → 网络排障
7. **安全与权限**：认证授权总览 → SA/RBAC/Pod Security → Admission/镜像安全/Secret → 审计/配额
8. **控制面与节点**：控制面主线 → 控制器循环 → 节点心跳 → 节点执行
9. **进阶与生态**：CRD/Operator → Helm → 可观测性 → GitOps

## 建议怎么用这个专题

- 如果你是第一次系统学 K8s：按上面的分层顺序走，从"全局认知"开始
- 如果你在准备面试：优先看 [必备问题清单](./essential-questions.md)，再回跳 [核心概念与对象模型](./core-concepts.md) 补底层逻辑
- 如果你在排查线上问题：先看 [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md)，再按问题类型回看对应章节

## 关联资料

- [架构师学习路线](/architecture/architect-learning-roadmap)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
- [etcd 专题](/etcd/)
- [运维方向待补主题](/ops/todo-topics)
