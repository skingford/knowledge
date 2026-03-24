---
title: 控制器与 Reconcile 链路实战
description: 讲清 Kubernetes 中 controller、reconcile loop、Deployment、HPA、CRD、Operator 如何围绕期望状态协同工作。
---

# 控制器与 Reconcile 链路实战

很多人学 Kubernetes 时，会记住一堆对象：

- Pod
- Deployment
- StatefulSet
- HPA
- CRD
- Operator

但如果你问一句：

- 为什么删掉 Pod 会自动恢复？
- 为什么改 Deployment 镜像会触发滚动更新？
- 为什么 HPA 改副本数，不需要直接创建 Pod？
- 为什么一个自定义数据库 Operator 也能“像原生对象一样”工作？

很多回答就会开始散。

这些现象背后，其实都指向同一个核心机制：

> Kubernetes 不是“执行一次命令就结束”的系统，而是一个持续运行的控制系统。控制器会不断比较期望状态和实际状态，再通过 reconcile 把系统拉回目标状态。

<K8sDiagram kind="reconcile-loop-chain" />

## 1. 先把一句话讲清楚：什么是 Controller，什么是 Reconcile

可以先用最实用的口径记住：

- `Controller`：负责盯住某类资源，确保它持续满足某个目标
- `Reconcile`：当实际状态和期望状态不一致时，控制器执行的“纠偏动作”

也就是说：

- Controller 是“谁在管”
- Reconcile 是“怎么改回来”

例如 Deployment 控制器的目标不是“创建一个 Pod 就算完成”，而是：

- 始终维持目标副本数
- 按发布策略推进新旧版本切换
- 在 Pod 丢失、节点故障、用户改配置时继续收敛到目标状态

所以 Kubernetes 的自动化并不是“脚本写得多”，而是“控制循环一直在跑”。

## 2. 为什么 K8s 的核心不是命令式，而是控制循环

命令式系统的思路通常是：

- 现在执行一次动作
- 动作结束就算完

而 K8s 的思路是：

- 先写下期望状态
- 控制器持续观察系统
- 只要实际状态偏离，就反复做调整

这就是为什么在 Kubernetes 里：

- 删除 Pod，不会导致服务永久少一个实例
- 改副本数，不需要你自己写循环去启动进程
- 发布失败后，还能继续通过上层对象回滚或重新收敛

一句话说透：

> 你真正提交给 Kubernetes 的，不是“动作”，而是“目标”。

## 3. Reconcile 链路到底怎么跑

如果把一条最常见的链路拆开，大致会是这样：

1. 用户或 CI 通过 `kubectl apply`、API 调用或 GitOps 提交对象
2. `apiserver` 完成校验、准入和持久化，把期望状态写入 `etcd`
3. 对应控制器通过 `watch` 监听到对象变化
4. 控制器把待处理对象放入 work queue
5. worker 取出对象执行 reconcile
6. reconcile 比较期望状态和实际状态，决定创建、更新、删除或等待
7. 对象状态变化后，控制器继续 watch；如果仍未收敛，就继续下一轮

可以把它理解成一个持续工作的闭环：

- `Observe`
- `Compare`
- `Act`
- `Observe again`

## 4. 一段最小化的 Reconcile 心智模型

不管是原生控制器，还是自定义 Operator，脑子里都可以先装一版很朴素的伪代码：

```text
while true:
    obj = queue.get()
    desired = readSpec(obj)
    actual = queryCurrentState(obj)

    diff = compare(desired, actual)

    if diff.needCreate:
        createResources(diff)
    if diff.needUpdate:
        updateResources(diff)
    if diff.needDelete:
        deleteResources(diff)

    updateStatus(obj)
    requeueIfNecessary(obj)
```

真正工程实现会复杂得多，但核心思想就这几步：

- 读期望
- 看现状
- 找差异
- 做动作
- 更新状态
- 必要时重试

## 5. 为什么删掉 Pod 会自动恢复

这是理解控制器最好的切入口。

假设你有这样一条链路：

- Deployment 期望副本数是 3
- Deployment 管理一个 ReplicaSet
- ReplicaSet 负责维持 3 个 Pod

此时你手工删掉其中一个 Pod，看起来像是“资源被删除了”，但对系统来说，真正的期望并没有变：

- Deployment 仍然期望有 3 个副本
- ReplicaSet 也仍然期望有 3 个 Pod

于是控制器下一次观察时会发现：

- 期望：3
- 实际：2

差异成立，于是再补一个 Pod 出来。

所以标准回答应该是：

> Pod 被删后会自动恢复，不是因为 Pod 自己有自愈能力，而是因为上层控制器仍然在持续维持期望状态。

## 6. Deployment、ReplicaSet、Pod 这条链路要怎么讲

很多人会把 Deployment 说成“直接管理 Pod”，这不够准确。

更完整的关系是：

- Deployment 负责发布策略、版本切换、回滚
- ReplicaSet 负责维持指定数量的 Pod
- Pod 是最终被调度运行到节点上的实例

也就是说，Deployment 更像“发布层控制器”，ReplicaSet 更像“副本维持层控制器”。

当你更新 Deployment 的镜像版本时，真实发生的不是“直接替换 Pod”，而通常是：

1. Deployment 创建新的 ReplicaSet
2. 新 ReplicaSet 逐步扩容
3. 旧 ReplicaSet 逐步缩容
4. 整个过程按 `maxSurge`、`maxUnavailable` 等策略推进

这也是为什么要把 [零停机发布链路实战](./zero-downtime-rollout.md) 和控制器机制一起看：发布能力本质上也是一个持续 reconcile 的结果。

## 7. HPA 为什么不直接创建 Pod

很多人第一次看 HPA，会以为它“负责自动扩容 Pod”。这个理解不算错，但不够精确。

更准确地说：

- HPA 的职责是根据指标计算“目标副本数”
- 它通常通过修改 `scale` 子资源来改变目标工作负载的副本数
- 真正创建或删除 Pod 的，仍然是下游工作负载控制器，例如 Deployment / ReplicaSet

所以 HPA 的正确定位是：

- 它是“调节目标值的控制器”
- 不是“直接管 Pod 生命周期的控制器”

把关系串起来就是：

- Metrics 提供当前负载
- HPA 计算想要多少副本
- Deployment / ReplicaSet 根据新副本数继续 reconcile
- kube-scheduler / kubelet 再把 Pod 真正落到节点上

## 8. CRD、Controller、Operator 到底是什么关系

这是 K8s 里最容易越学越混的一组概念。

### 8.1 CRD 是什么

CRD（CustomResourceDefinition）本质上是在 Kubernetes API 里注册一种新的资源类型。

例如你可以注册一个：

- `MySQLCluster`
- `MessageQueue`
- `AppRelease`

这样用户就可以像写 Deployment 一样去写这些自定义资源。

但要注意：

- 有了 CRD，只是“API 里认识了这种对象”
- 不代表系统已经知道“看到这个对象后应该怎么做”

### 8.2 Controller 是什么

Controller 才是真正把这些对象变成行为的执行者。

例如你定义了 `MySQLCluster` 之后，还需要有一个控制器去负责：

- 创建 StatefulSet
- 创建 Service
- 分配 PVC
- 初始化配置
- 处理扩容、升级、故障恢复

### 8.3 Operator 是什么

Operator 可以理解为：

- `CRD + 自定义控制器 + 某类复杂运维知识`

它不是单独一种底层机制，而是一种设计模式：

- 把人类运维知识编码进控制器
- 让数据库、消息队列、中间件也能以声明式方式运维

所以：

- `CRD` 定义“这个资源长什么样”
- `Controller` 负责“看到它之后怎么调谐”
- `Operator` 强调“把复杂领域运维能力封装成声明式控制器”

<K8sDiagram kind="controller-family-map" />

## 9. 控制器家族其实都在干同一类事

虽然 Deployment、HPA、StatefulSet、DaemonSet、Job、Operator 看起来差很多，但它们的共同模式其实很统一：

- Watch 某类对象变化
- 比较期望状态与实际状态
- 执行创建、更新、删除等动作
- 再继续观察，直到收敛

差别主要在于“管什么目标”和“怎么纠偏”。

| 控制器 | 目标 | 典型动作 |
| --- | --- | --- |
| Deployment | 维持版本和副本数，控制滚动发布 | 管理 ReplicaSet，推进滚动更新与回滚 |
| ReplicaSet | 维持 Pod 数量 | 创建或删除 Pod |
| StatefulSet | 维持稳定身份、有序发布和存储关系 | 顺序创建/删除 Pod，绑定稳定 PVC |
| DaemonSet | 每个节点或某类节点都有实例 | 在节点变化时补齐或回收 Pod |
| Job / CronJob | 确保任务完成或按计划触发 | 创建 Job / Pod，跟踪完成状态 |
| HPA | 调整目标副本数 | 修改 scale 子资源 |
| Operator | 维持自定义资源的声明式运维目标 | 管理下游原生资源和外部依赖 |

## 10. 一个好用的 Reconcile 设计原则清单

如果你在做自定义控制器或 Operator，下面这些原则非常重要。

### 10.1 幂等

Reconcile 必须允许被重复执行。

因为在真实系统里：

- 事件会重复
- 重试会发生
- watch 可能抖动
- 同一个对象可能被多次入队

所以你的逻辑必须满足：

- 多执行一次不会把状态搞坏
- 已经存在的资源不会盲目重复创建
- 已经完成的步骤再次运行也能安全返回

### 10.2 以当前状态为准，而不是以事件为准

控制器更适合写成“level-triggered”的思路，而不是“edge-triggered”。

也就是说：

- 不要假设“这次收到的是某个关键事件，所以我只要顺着事件处理”
- 而应该每次都重新读取当前对象和实际资源，再决定下一步动作

因为你真正要回答的问题不是：

- “刚才发生了什么？”

而是：

- “现在系统状态和目标状态相比，还差什么？”

### 10.3 区分 `spec` 和 `status`

一个成熟控制器通常会区分：

- `spec`：用户声明的目标
- `status`：控制器观测到的当前进展

例如：

- 当前可用副本数是多少
- 最近一次调谐是否成功
- 正在升级还是已经就绪
- 是否出现了某种故障状态

这对排障非常重要，否则用户只能看日志猜系统现在进行到哪一步。

### 10.4 正确处理删除：Finalizer 很关键

删除对象不一定意味着“立刻从 API 里消失”。

很多自定义控制器会使用 Finalizer 来保证：

- 外部资源先清理干净
- 依赖关系先解除
- 观测、备份或审计动作先完成

然后才真正让对象完成删除。

如果不处理好这一点，常见结果是：

- 云资源泄漏
- 外部账号、磁盘、DNS 记录残留
- 资源在 API 里一直卡在 `Terminating`

这条删除边界如果想单独讲透，可以继续看 [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)。

### 10.5 状态更新和错误重试要清晰

控制器失败并不可怕，可怕的是：

- 失败了但没人知道
- 状态没写清楚
- 反复重试却没有退避

所以工程上通常需要：

- 明确的 `status.conditions`
- 可观测的错误日志和指标
- 带退避的重试机制

## 11. 最常见的认知误区

### 11.1 误区一：Deployment 直接管理 Pod

更准确的说法是：

- Deployment 管 ReplicaSet
- ReplicaSet 再管 Pod

### 11.2 误区二：HPA 直接扩 Pod

更准确的说法是：

- HPA 改的是目标副本数
- 真正创建 Pod 的仍是工作负载控制器

### 11.3 误区三：CRD 一加上，平台就会自动运维

CRD 只是定义资源类型。

如果没有对应控制器：

- 资源能创建
- 但不会产生任何业务动作

### 11.4 误区四：Reconcile 只会在资源变更时跑一次

真实情况通常是：

- 会多次触发
- 会重试
- 会因为依赖资源变化再次触发
- 会在未收敛时继续入队

所以它从来不是“一次执行完就结束”的脚本。

## 12. 面试里怎么把这题说顺

如果面试官问“什么是 Controller 和 Reconcile”，一个比较稳的回答可以这样组织：

1. 先说 K8s 是声明式系统，不是命令式脚本系统
2. 再说 Controller 持续 watch 对象，目标是维持期望状态
3. 再说 Reconcile 是比较期望与实际、执行纠偏动作的过程
4. 用 Deployment -> ReplicaSet -> Pod 举一个最常见例子
5. 再补 HPA、CRD、Operator，说明它们本质上也是控制循环

可以直接用一句话收尾：

> Kubernetes 的自动化能力，本质上来自一组持续运行的控制器；它们通过 reconcile 循环，不断把实际状态拉回声明的期望状态。

## 13. 建议和这些专题一起看

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [Job 与 CronJob 批处理链路实战](./job-and-cronjob-batch-workloads.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [控制面主线实战](./control-plane-mainline.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [etcd 专题](/etcd/)
