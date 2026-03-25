---
title: K8s 必备问题清单
description: 按由浅入深整理 Kubernetes 高频必备问题，覆盖对象模型、调度、网络、存储、发布、安全、排障与控制面机制。
---

# K8s 必备问题清单

这页不追求“面面俱到”，而是把最常被问、最能区分理解深度的问题按由浅入深排好。建议的回答方式是：

- 先说这个对象或机制**解决什么问题**
- 再说它在 K8s 里的**实现路径**
- 最后补一句**适用场景、风险或常见误区**

如果你回答 K8s 问题总是只剩名词，这个顺序很重要。

<K8sDiagram kind="interview-ladder" />

## 1. 入门必答：先把对象和定位说对

**1. Kubernetes 到底解决什么问题？**

- 它是容器编排平台，解决大量容器在多节点上的部署、扩容、故障恢复、服务发现和发布治理
- 核心是声明式 API + 控制循环，而不是脚本式运维
- 真正价值在“持续维持期望状态”，不是“帮你执行一次命令”

**2. K8s 控制面有哪些核心组件？**

- `kube-apiserver`：集群 API 入口
- `etcd`：保存集群状态
- `kube-scheduler`：给 Pod 选节点
- `kube-controller-manager`：运行各种控制器，持续把实际状态拉回期望状态

**3. 为什么 K8s 以 Pod 为基本调度单位，而不是容器？**

- Pod 表达的是一个共同运行单元，容器之间可以共享网络和卷
- sidecar、init container 这些模式都依赖 Pod 这个封装层
- K8s 关心的是“一个服务实例如何被调度和治理”，不是单独某个容器进程

**4. Deployment、StatefulSet、DaemonSet、Job、CronJob 怎么区分？**

- Deployment：无状态服务，关注副本数和滚动更新
- StatefulSet：有状态实例，关注稳定身份、顺序和持久卷
- DaemonSet：每个节点或某类节点跑一个
- Job：一次性任务
- CronJob：定时触发任务

**5. Service、Ingress、LoadBalancer 是什么关系？**

- Service 先把一组 Pod 抽象成稳定访问入口
- `LoadBalancer` 是 Service 的一种暴露方式，依赖云厂商或外部实现
- Ingress 更偏七层 HTTP 路由和统一入口治理，通常流量先进 Ingress Controller，再转到 Service
- 只创建 Ingress / Gateway 对象本身通常不会自动生效，还需要对应 controller 真正接管实现

**6. ConfigMap 和 Secret 的区别是什么？**

- 两者都是配置注入方式
- ConfigMap 放普通配置，Secret 放敏感信息
- Secret 不是“天然安全”，还要配合加密存储、RBAC、外部密钥管理等策略

## 2. 工作负载与发布：面试最常追问的日常操作题

**7. Deployment 为什么能滚动更新和回滚？**

- Deployment 不是直接改 Pod，而是创建新 ReplicaSet、逐步切流、缩旧 ReplicaSet
- 回滚本质是把目标版本重新切回旧 ReplicaSet
- `maxSurge` 和 `maxUnavailable` 决定更新节奏和可用性边界

**8. readiness、liveness、startup probe 有什么区别？**

- readiness 失败通常是摘流量，不一定重启
- liveness 失败更像“进程坏了，要重启”
- startup probe 用于启动慢的应用，避免还没启动完就被 liveness/readiness 误伤

**9. K8s 中如何实现优雅终止？**

- Pod 终止时会先收到 `SIGTERM`
- 应用要先停止接新流量，再处理完存量请求，最后释放资源
- `preStop`、`terminationGracePeriodSeconds` 和 readiness 配置要协同，否则容易出现请求被打断

**10. 为什么发布后服务还会出现短暂 502/连接重置？**

- readiness 配错，Pod 还没真准备好就接流量
- 服务摘流量和应用退出之间有竞态，没有做好 preStop / graceful shutdown
- 外部连接、数据库连接池、长连接没有平稳关闭

**11. 为什么改了 ConfigMap / Secret，Pod 不一定立刻生效？**

- 如果配置以环境变量注入，通常需要重建 Pod 才能生效
- 挂载成文件时会有同步延迟
- 应用本身如果不支持热加载，即便文件更新了也未必会重新读取

**12. 为什么不建议直接管理裸 Pod？**

- Pod 天生易失，挂了后不会自己恢复到目标副本数
- 发布、回滚、扩缩容都缺乏控制器支撑
- 生产上通常用 Deployment / StatefulSet / Job 等控制器表达期望状态

## 3. 调度、资源与弹性：从“能跑”到“跑得稳”

**13. Pod 一直是 Pending，最常见原因有哪些？**

- 节点资源不够，尤其是 `requests` 无法满足
- 亲和性、污点容忍、节点选择条件太苛刻
- PVC 没绑上、镜像拉取策略或准入限制导致无法落地
- 集群本身没有足够节点或自动扩容未生效

**14. requests 和 limits 到底怎么影响调度和运行？**

- requests 决定调度时是否能放下
- limits 决定运行时最多能用多少
- 内存超 limits 常见结果是 OOMKilled，CPU 超 limits 更常见的是被限流

**15. nodeSelector、affinity、taints/tolerations 各管什么？**

- nodeSelector 是最简单的“只去这些节点”
- affinity 提供更灵活的软硬约束和拓扑偏好
- taint/toleration 表达“默认不接收，除非你声明自己能容忍”

**16. PriorityClass 和 preemption 到底解决什么？**

- PriorityClass 先影响 pending Pod 的排队顺序，必要时 scheduler 才可能考虑 preemption
- preemption 只能在单个节点上移走更低优先级 Pod，为高优先级 Pod 让路，绕不过亲和性、污点、PVC 这些硬约束
- 它和 `drain / Eviction API`、节点压力驱逐不是一回事；`PDB` 在 preemption 里也只是 best effort

**17. HPA 是怎么工作的？**

- HPA 根据指标调整副本数，常见是 CPU、内存或自定义指标
- 它调的是副本，不是单 Pod 资源大小
- 真正想让集群多出机器，还要结合 Cluster Autoscaler

**18. HPA、VPA、Cluster Autoscaler 的区别是什么？**

- HPA：横向调副本
- VPA：纵向调单 Pod 资源
- Cluster Autoscaler：调节点数

**19. 为什么有时候副本数够了，系统还是扛不住？**

- 副本扩起来了，但下游数据库、缓存、队列没跟上
- readiness 太慢、冷启动太久，扩容不能及时接流量
- 单 Pod 自身被锁竞争、GC、外部依赖卡住，扩容效果有限

## 4. 网络与存储：K8s 最容易被问深的两条线

**20. Kubernetes 的网络模型是什么？**

- 每个 Pod 有独立 IP
- Pod 之间默认能互通
- 不依赖容器端口映射做内部通信

**21. Service 为什么能在 Pod IP 变化时还保持稳定访问？**

- Service 绑定的是 label selector 选中的一组后端 Pod，而不是某个固定 IP
- EndpointSlice 会维护后端地址集合
- kube-proxy 或相关数据面组件把 Service 地址转发到当前可用 Pod

**22. Pod IP 一直在变，为什么业务通常不直接受影响？**

- 因为业务大多数时候不是直连 Pod IP，而是连 `Service` 名称或 VIP
- K8s 用 Service、EndpointSlice 和 DNS 把易变的 Pod 地址藏在后面
- 真正要稳定的通常是“服务入口”，不是某个 Pod 本身

**23. 外部系统要求加白名单，Pod 动态 IP 怎么办？**

- 先分清方向：是外部访问我方，还是我方访问第三方
- 如果是外部访问我方，对方应该白名单 `LoadBalancer` / Ingress 的固定入口 IP，而不是 Pod IP
- 如果是我方访问第三方，对方应该白名单我方固定出口 IP，例如 `NAT Gateway`、`Cloud NAT`、`Egress Gateway` 的地址
- 如果只是集群内要稳定访问单实例，用 `StatefulSet + Headless Service` 稳定实例 DNS，不要试图固定 Pod IP

**24. kube-proxy、CNI、CoreDNS 分别做什么？**

- Service VIP 是稳定虚拟入口，不等于某个真实 Pod 或某张真实网卡
- kube-proxy：根据 Service 和 EndpointSlice 在节点维护 Service 转发表
- CNI：提供 Pod 网络能力，包括 IP 分配和跨节点通信
- CoreDNS：把服务名解析到 Service VIP，或在 Headless Service 场景下解析到成员记录

**25. 为什么 Pod 明明 Running 了，Service 后面还是没后端？**

- `Running` 只说明进程起来了，不代表已经是服务可用后端
- Service 后端集合通常收敛在 EndpointSlice 里，核心还要看 Pod 是否 Ready
- Pod 终止时还要区分 EndpointSlice 的 `ready / serving / terminating` 条件
- 所以这类问题先看 EndpointSlice，再看 kube-proxy，通常比先抓包更快

**26. PV、PVC、StorageClass 怎么配合理解？**

- PVC 是应用对存储的申请
- PV 是集群中的卷资源
- StorageClass 决定如何动态创建存储、用什么性能和回收策略

**27. 为什么数据库、消息队列这类组件更常用 StatefulSet？**

- 需要稳定实例身份，例如固定主从成员名
- 常常绑定独立持久卷
- 对启动、停止、升级顺序更敏感

**28. DaemonSet 适合什么场景，为什么 `drain` 时通常要忽略它？**

- DaemonSet 解决的是节点驻留能力分发，不是“我要固定跑几个副本”
- 它更适合日志采集、监控 Agent、CNI、存储插件、节点入口代理这类“每个节点都要有”的组件
- DaemonSet Pod 通常会自动容忍 `unschedulable`、`not-ready`、`unreachable` 等节点状态，所以 `kubectl drain` 默认不会直接替你删它们，常见做法是显式带 `--ignore-daemonsets`
- 这不是 DaemonSet 更高级，而是它要保证节点级守护进程在维护和短暂故障期间别被一把清空

## 5. 稳定性、安全与治理：从开发视角进到生产视角

**29. Pod 经常 CrashLoopBackOff，应该先看什么？**

- 先看容器日志和上一次退出原因
- 再看探针是否误杀、配置是否缺失、依赖是否不可达
- 最后看镜像、启动命令、权限和端口冲突等基础问题

**30. K8s 中最基本的权限模型是什么？**

- 身份常见由 ServiceAccount 承载
- 授权通过 RBAC 规则控制
- 最小权限原则很关键，不要让业务 Pod 随便访问整个集群 API

**31. NetworkPolicy 能解决什么问题，为什么有时“配了没效果”？**

- 它用于限制 Pod 之间以及到外部的网络访问
- 但前提是底层 CNI 实现支持并启用了 NetworkPolicy
- 真正一条连接能否打通，通常还要同时看源 egress 和目标 ingress
- 如果没有默认拒绝策略，或者选错了 selector，也可能看起来像没生效

**32. Secret 管理有哪些常见误区？**

- 把 Secret 当成普通配置随意打印到日志
- 把云账号、数据库密码直接写进镜像或 Git 仓库
- 只依赖 K8s Secret，不配合加密、审计和轮换策略

**33. 多租户或多团队隔离最基本靠什么？**

- Namespace 做资源逻辑隔离
- RBAC 做权限隔离
- ResourceQuota 控 namespace 总预算，LimitRange 控单对象默认值与上下限
- NetworkPolicy 做网络隔离

**34. `PDB`、`Eviction API` 和 `kubectl drain` 是什么关系？**

- `PDB` 约束的是 voluntary disruption 的并发预算，不是防节点故障按钮
- `Eviction API` 是尊重预算的驱逐入口，预算不够时常见表现就是 `429`
- `kubectl drain` 默认优先走 eviction；如果 `--disable-eviction`，就会绕过 `PDB`

## 6. 深入机制：决定你回答是“会用”还是“理解”

**35. K8s 为什么总说自己是声明式系统？**

- 因为你提交的是期望状态，不是一次性执行脚本
- 控制器会持续比对实际状态并重复修正
- 删除 Pod 能自动拉起、本质是控制器仍在维持期望状态

**36. kubectl apply 到底做了什么？**

- 把资源定义提交给 apiserver
- apiserver 做鉴权、准入、校验并写入 etcd
- 各控制器观察到对象变化后，分别执行后续动作，比如创建 ReplicaSet、调度 Pod、更新 EndpointSlice

**37. etcd 在 K8s 里为什么这么关键？**

- 它保存控制面的关键状态，是集群真相来源
- 控制器、调度器、apiserver 的决策都依赖这里的数据
- etcd 出问题时，集群管理能力会明显受影响，所以备份、恢复和延迟都很关键

**38. Controller / Reconcile loop 是什么？**

- 控制器会监听对象变化
- 一旦发现实际状态和期望状态不一致，就执行修正动作
- Deployment、Job、HPA、Operator 本质上都遵循这个模式

**39. CRD 和 Operator 分别是什么，什么时候需要它们？**

- CRD 让你定义新的资源类型
- Operator 是围绕自定义资源编写的控制器
- 当某类中间件或平台能力需要“声明式运维”时，Operator 特别有价值

**40. 为什么对象 delete 之后还会一直是 `Terminating`？**

- delete 通常不是立刻物理删除，而是先给对象写 `deletionTimestamp`
- 如果对象上还有 `finalizers`，控制器要先完成清理并移除 finalizer
- 如果对象和下游资源有 `ownerReferences`，垃圾回收还会按 `Foreground / Background / Orphan` 决定 dependents 怎么收敛
- Pod 的 `Terminating` 还要额外区分 `preStop`、`SIGTERM`、卷卸载和节点失联，不能和普通控制面对象混着答

**41. K8s 中“服务访问失败”通常怎么排？**

- 先分层：Service 是否正确、EndpointSlice 是否有后端、Pod 是否监听、kube-proxy 是否把规则下发到了节点
- 再查 DNS、kube-proxy / CNI、NetworkPolicy、Ingress 路由和证书
- 最后再看应用自身端口、协议和依赖问题，不要一上来就怀疑 K8s

**42. 什么叫真正的零停机发布？**

- 不只是 Deployment 滚动一下
- 需要应用支持优雅终止、readiness 正确、流量摘除及时、连接平滑迁移
- 对状态依赖强或启动慢的服务，还要结合预热、灰度和回滚策略

## 面试前至少要背下来的结论

- K8s 的核心不是 YAML，而是声明式控制循环
- Pod 是最小调度单元，但生产治理依赖控制器
- Deployment 适合无状态，StatefulSet 适合有状态
- DaemonSet 适合节点驻留，不要把它当固定副本数控制器
- Service 解决稳定访问，Ingress 解决 HTTP 入口
- requests 决定调度，limits 决定运行上限
- readiness 摘流量，liveness 偏重启，startup 保护慢启动
- Priority 决定谁更值得先排、先让路，但绕不过硬约束，也不等于不会被节点压力驱逐
- Pod 网络靠 CNI，服务转发靠 kube-proxy，服务发现靠 DNS
- PVC 是应用申请，PV 是卷资源，StorageClass 负责动态供给
- 安全至少要看 ServiceAccount、RBAC、Secret、NetworkPolicy
- `PDB` 管维护预算，`drain` 默认尊重 eviction，不要把 `delete pod` 和节点故障驱逐混成一句
- delete 不是立刻消失，真正删除时机还要看 finalizers 和垃圾回收
- 深入机制的主线是 apiserver、etcd、controller、scheduler、reconcile loop

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [Pod 内多容器协作实战](./pod-multi-container-collaboration.md)
- [Job 与 CronJob 批处理链路实战](./job-and-cronjob-batch-workloads.md)
- [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [DaemonSet 节点驻留与更新边界实战](./daemonset-node-resident-and-update-boundaries.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [控制面主线实战](./control-plane-mainline.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [节点执行链路实战](./node-execution-chain.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md)
- [CRD、Operator 与扩展机制实战](./crd-operator-and-extension.md)
- [Helm 与包管理实战](./helm-and-package-management.md)
- [可观测性与监控实战](./observability-and-monitoring.md)
- [GitOps 与持续交付实战](./gitops-and-delivery.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
- [etcd 专题](/etcd/)
