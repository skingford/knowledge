---
title: 控制面主线实战
description: 系统讲清 Kubernetes 控制面里 kube-apiserver、etcd、kube-scheduler、kube-controller-manager 如何把声明变成真正运行的 Pod。
---

# 控制面主线实战

很多人会背 Kubernetes 控制面的四个名字：

- `kube-apiserver`
- `etcd`
- `kube-scheduler`
- `kube-controller-manager`

但如果追问一句：

- `kubectl apply` 之后，到底先发生什么，后发生什么
- 为什么 Pod 一直 `Pending` 要先看 scheduler，而不是先看 etcd
- 为什么 etcd 出问题后，已有 Pod 可能还在跑，但新变更已经进不去了
- 为什么控制器和调度器通常是 watch 对象变化，而不是自己直接改一堆容器

很多回答就会散掉。

这篇的目标不是把每个组件的源码细节一口气讲完，而是先把控制面的主线串顺：

- 声明怎样进入系统
- 状态怎样落盘
- 决策怎样被做出
- 动作怎样真正落到节点
- 故障时应该先怀疑哪一层

<K8sDiagram kind="control-plane-mainline-chain" />

## 1. 先把一句话讲清楚：控制面到底在干什么

如果只用一句话概括：

> 用户把期望状态提交给 `apiserver`，状态落进 `etcd`，调度器和控制器通过 `watch` 感知变化并做决策，最后由 `kubelet` 在节点上真正把 Pod 跑起来，再把结果回写控制面。

这句话里有三个关键点：

- **入口只有一个**：几乎所有对象变更都先经过 `apiserver`
- **真相来源只有一个**：集群关键状态最终落在 `etcd`
- **执行不是控制面亲自跑容器**：真正执行是在节点侧完成的

所以标准口径应该是：

> 控制面负责接收声明、保存状态、做决策和驱动收敛；节点负责真正执行。

## 2. `kube-apiserver`：它不只是“HTTP 网关”

很多人会把 `apiserver` 说成“一个 REST API 服务”，这太浅了。

它至少承担了几层职责：

- 集群唯一 API 入口
- 认证（Authentication）
- 授权（Authorization）
- 准入（Admission）
- 对象默认值填充与校验
- 持久化前的最后一道关口
- `list/watch` 读流量和状态分发入口

### 2.1 为什么它是控制面真正的入口

典型链路里：

- `kubectl`
- CI/CD
- Operator
- HPA
- kubelet
- 各类控制器

绝大多数都不是直接碰 `etcd`，而是先和 `apiserver` 交互。

这意味着：

- 控制面里的大多数组件是“围着 apiserver 转”
- 不是“大家都直接读写 etcd”

### 2.2 它不负责什么

`apiserver` 不负责：

- 给 Pod 选节点
- 直接启动容器
- 直接维持副本数

这些工作分别属于：

- `scheduler`
- `kubelet`
- 各类 controller

所以最稳的理解是：

> `apiserver` 负责“让声明合法进入系统，并把状态可靠暴露给其他组件”，但它不是“所有业务动作的执行者”。

## 3. `etcd`：控制面的真相来源，但不是万能数据库

在 Kubernetes 里，`etcd` 的定位非常明确：

- 保存关键集群状态
- 提供一致性读写基础
- 让控制器和调度器能基于同一份状态做判断

这也是为什么它常被叫作：

- source of truth

### 3.1 为什么它关键

因为这些对象最终都要落在这里：

- Pod
- Deployment
- Service
- ConfigMap
- Secret
- Node
- EndpointSlice

如果 `etcd` 不可用，最直接的结果通常不是“所有 Pod 瞬间消失”，而是：

- 新对象写不进去
- 更新和删除很难推进
- 控制面状态感知和收敛能力下降

已有工作负载很多时候可能还在节点上继续运行，但：

- 你对它们的管理、变更和收敛已经开始失真

### 3.2 为什么它不是“控制面里最会做计算的组件”

`etcd` 的价值在于：

- 一致性
- revision / watch 基础
- 小体量关键元数据持久化

它不适合：

- 存海量业务数据
- 做复杂查询
- 当消息队列

所以标准口径应该是：

> `etcd` 负责存真相，不负责做调度和治理决策。

更深入的 Raft、多数派、Lease、Watch、Txn 细节，放到 [etcd 专题](/etcd/) 去展开。

## 4. `kube-scheduler`：只给未绑定节点的 Pod 选机器

这是又一个特别容易答混的点。

调度器真正盯住的典型对象是：

- 还没有 `nodeName`
- 还没被绑定到节点
- 处于待调度状态的 Pod

它的核心工作不是“把应用跑起来”，而是：

- 从可选节点里筛掉不满足条件的
- 对剩余节点做打分
- 选择一个最合适的节点
- 完成绑定

最常见的判断依据包括：

- `requests`
- `nodeSelector`
- `nodeAffinity`
- `taints / tolerations`
- `podAffinity / podAntiAffinity`
- `priorityClass`

<K8sDiagram kind="scheduling-decision-chain" />

### 4.1 它不负责什么

调度器不负责：

- 拉镜像
- 挂卷
- 配置 CNI
- 启动容器
- 做 readiness / liveness 判断

这些属于：

- kubelet
- runtime
- CNI / CSI
- 探针与工作负载运行时

所以看到 Pod `Pending` 时，很可能先怀疑调度链路；  
但看到 `ContainerCreating`、`CrashLoopBackOff`、探针失败时，问题大多已经不在 scheduler 这一层。

## 5. `kube-controller-manager`：它不是一个控制器，而是一堆控制器

很多人会把它说成“控制器”，准确点说，它更像：

- 一组内建控制器的宿主进程

里面跑的典型控制器包括：

- Deployment controller
- ReplicaSet controller
- StatefulSet controller
- Job controller
- Node controller
- EndpointSlice controller

这些控制器的共同模式都是：

- `watch` 对象变化
- 入队
- reconcile
- 更新状态

所以当你看到下面这些现象时：

- 改了 Deployment 但新 ReplicaSet 迟迟不出来
- Pod readiness 过了，但流量面迟迟没更新
- 节点状态变化传播很慢

怀疑点往往就落在：

- controller watch / queue / reconcile 这条链路

如果想专门把 controller 和 reconcile 讲透，要看 [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)。

## 6. 把一条真实链路串起来：从 Deployment 到 Pod Running

如果你提交一个 Deployment，控制面大致会经历这条路径：

1. 用户把 Deployment YAML 提交给 `apiserver`
2. `apiserver` 完成认证、授权、准入、校验，并写入 `etcd`
3. Deployment controller 通过 `watch` 看见对象变化
4. Deployment controller 创建或更新 ReplicaSet
5. ReplicaSet controller 再创建 Pod
6. 新 Pod 写入 `etcd` 后，scheduler 看到一个未绑定节点的 Pod
7. scheduler 过滤、打分并执行 bind
8. 对应节点的 kubelet 看到自己被分配了这个 Pod，开始拉镜像、建 sandbox、挂卷、起容器
9. Pod 状态、容器状态、探针结果再回写 `apiserver`
10. readiness 通过后，相关控制器继续把 Pod 纳入 EndpointSlice / Service 后端池

这条链路里，每层都各管一段：

- `apiserver` 管入口和状态写入
- `etcd` 管状态持久化
- controller 管对象收敛
- scheduler 管节点选择
- kubelet 管节点执行

所以你不能把“Pod 没起来”都统一回答成：

- 控制面有问题

而应该继续细分：

- 是对象没创建出来
- 还是 Pod 没被绑定节点
- 还是节点根本没跑起来

## 7. 一张表把控制面组件的边界拆开

| 组件 | 它主要解决什么 | 它不主要解决什么 |
| --- | --- | --- |
| `kube-apiserver` | API 入口、认证、授权、准入、校验、持久化入口、list/watch 入口 | 不直接调度 Pod，不直接拉起容器 |
| `etcd` | 一致性状态存储、revision/watch 基础 | 不负责调度、扩缩容、业务计算 |
| `kube-scheduler` | 给待调度 Pod 选节点并 bind | 不直接执行容器创建，不处理探针 |
| `kube-controller-manager` | 各类控制器 watch + reconcile，维持期望状态 | 不替代 kubelet，不直接承担节点执行 |

## 8. 控制面出问题时，现场现象通常怎么对应

| 现象 | 优先怀疑谁 | 常见解释 |
| --- | --- | --- |
| `kubectl apply` 超时、对象更新很慢 | `apiserver` / `etcd` | 写请求进不去，或持久化链路慢 |
| 新 Pod 长时间 `Pending` 且无绑定节点 | `scheduler` | 资源、约束、污点容忍或调度流程异常 |
| Deployment 已改，但 ReplicaSet / Pod 没及时收敛 | controller | watch / queue / reconcile 延迟或失败 |
| 绑定节点后卡在 `ContainerCreating` | kubelet / runtime / CNI / CSI | 已过 scheduler，问题多半在节点执行面 |
| readiness 通过后流量迟迟不切 | EndpointSlice / Service 收敛链路 | 控制面对象更新与数据面收敛不同步 |

最实用的一句是：

> 先判断问题卡在“声明进入系统之前”“控制面决策阶段”，还是“节点执行阶段”，排障速度会快很多。

## 9. 最容易踩的坑

### 坑 1：把 `apiserver` 当成“只会转发 HTTP 的网关”

这样会低估它在认证、授权、准入、对象校验和状态分发里的核心作用。

### 坑 2：以为控制器、调度器都直接操作 `etcd`

在标准链路里，它们大多是通过 `apiserver` 观察和操作对象。

### 坑 3：把 scheduler 理解成“负责启动 Pod”

它只负责选节点和 bind，不负责真正把容器跑起来。

### 坑 4：etcd 一有问题，就以为所有服务立刻全挂

很多已有 Pod 可能还在跑，但集群管理、调度和收敛能力会明显受损。

### 坑 5：把控制面问题和节点问题混成一类

`Pending`、`ContainerCreating`、`CrashLoopBackOff` 分别对应的怀疑点完全不同。

## 10. 一个实用排查顺序

如果你遇到“资源提交了，但集群行为不对”，建议按这条顺序排：

1. 先看对象有没有成功进 `apiserver`
2. 再看对象状态是否已经被持久化并能被其他组件看到
3. 如果是 Pod 没落节点，查 scheduler 和 Pod events
4. 如果是对象没收敛，查对应 controller 的行为
5. 如果已经绑定节点，再回到 kubelet、runtime、CNI、CSI
6. 如果是控制面整体发慢，再看 `apiserver` 与 `etcd` 的延迟和健康

经验上：

- 越早把“控制面决策问题”和“节点执行问题”拆开，越不容易在错误方向上浪费时间

## 11. 一套面试答法

如果面试官问：

> Kubernetes 里 `apiserver`、`scheduler`、`controller-manager`、`etcd` 分别做什么？一份 YAML 提交之后会发生什么？

你可以这样答：

> 我会先按主线来讲。  
> 用户先把声明提交给 `apiserver`，它负责认证、授权、准入、校验，并把对象持久化到 `etcd`；  
> `etcd` 是控制面的真相来源，保存关键集群状态；  
> 之后各类 controller 通过 watch 感知变化并做 reconcile，比如 Deployment 会继续创建 ReplicaSet 和 Pod；  
> scheduler 则只负责给还没绑定节点的 Pod 选一个合适节点并 bind；  
> 真正把容器拉起来的是节点侧 kubelet，而不是控制面自己；  
> 所以控制面主线可以概括成：声明进入 apiserver，状态落 etcd，controller 和 scheduler 做决策，kubelet 在节点执行，状态再回写控制面。  

## 12. 最后记住这句话

> Kubernetes 控制面最核心的分工，不是谁“权力最大”，而是谁负责入口、谁负责存真相、谁负责决策、谁负责执行。把这四层拆开，很多问题自然就顺了。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [节点执行链路实战](./node-execution-chain.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [etcd 专题](/etcd/)
