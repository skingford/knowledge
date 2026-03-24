---
title: 节点心跳、Lease 与失联驱逐边界实战
description: 系统讲清 Kubernetes 中节点心跳、NodeStatus、Lease、Ready False/Unknown、node monitor、not-ready/unreachable taints、NoExecute、tolerationSeconds、taint-eviction-controller、网络分区与 API 发起驱逐边界，以及为什么节点失联后 Pod 不会立刻彻底消失。
---

# 节点心跳、Lease 与失联驱逐边界实战

很多团队在排查节点故障时，常见说法只有一句：

- 节点挂了，Pod 被迁走了

这句话在 Kubernetes 里通常是不够准确的。

真实生产里更常见的追问是这些：

- kubelet 到底靠什么告诉控制面“我还活着”
- 为什么有时节点断联几十秒就 `Unknown` 了，但 Pod 还没马上消失
- `Ready=False` 和 `Ready=Unknown` 到底差在哪
- `node.kubernetes.io/not-ready`、`node.kubernetes.io/unreachable`、`NoExecute`、`tolerationSeconds` 怎么串起来
- 为什么 Pod 在 API 里已经 `Terminating` 或 `Unknown`，分区节点上的进程却可能还在跑
- `cordon/drain` 和节点失联驱逐到底是不是一回事

这条线真正要讲清的是：

> Kubernetes 处理节点故障不是“发现节点挂了就立刻把 Pod 搬走”，而是沿着“心跳 -> 节点条件 -> 自动 taint -> Pod toleration -> API 发起驱逐”一层层收敛。只少看其中一层，就很容易把节点故障答成一句“Pod 会自动迁移”。

<K8sDiagram kind="node-heartbeat-eviction-chain" />

## 1. 先回答：节点故障不是哪一种单点现象

更稳的回答方式是先拆几层：

1. **节点心跳**：kubelet 通过 `Node.status` 和 `Lease` 告诉控制面自己是否还活着
2. **节点判断**：node controller 根据心跳把 `Ready` 变成 `True / False / Unknown`
3. **调度收敛**：控制面把节点问题映射成 taint，让 scheduler 不再往坏节点放新 Pod
4. **存量处理**：`NoExecute` 配合 `tolerationSeconds` 决定原有 Pod 何时被驱逐
5. **分区边界**：API 发起驱逐，不等于分区节点上的进程已经真的停了

所以一句话记住：

> 节点失联链路里，控制面先判断、再限流、再驱逐；真正的难点不是“节点坏了”，而是“控制面判断坏了之后，旧进程是不是还在另一边继续跑”。

## 2. kubelet 到底怎么发心跳

Kubernetes 官方节点状态文档明确说：

- 节点有两种 heartbeat
- 一种是 `Node` 对象的 `.status` 更新
- 另一种是 `kube-node-lease` 命名空间下对应的 `Lease` 对象

### 2.1 为什么要有 `Lease`

官方文档明确说明：

- 相比频繁更新 `Node.status`
- `Lease` 是更轻量的资源
- 在大集群里，用 `Lease` 做心跳能降低性能开销

这意味着：

- 你不能把“心跳”只理解成 kubelet 不断 patch `Node.status`
- 在现代集群里，Lease 才是更轻、更频繁的那条活性信号

### 2.2 `Node.status` 和 `Lease` 的默认更新节奏并不一样

官方节点状态文档给了很清楚的默认值：

- kubelet 默认每 **10 秒**更新一次 `Lease`
- `Node.status` 默认更新周期则长得多，默认是 **5 分钟**

所以更稳的理解是：

- **Lease**：偏活性探测，更新频率高
- **Node.status**：偏状态快照，更新频率低，但包含更丰富信息

这也是为什么生产里判断节点“活不活”时，不能只盯 `Node.status` 的时间戳。

## 3. `Ready=False` 和 `Ready=Unknown` 到底差在哪

Kubernetes 官方节点状态文档把 `Ready` 条件定义得很清楚：

- `True`：节点健康，可以接收 Pod
- `False`：节点不健康，不能接收 Pod
- `Unknown`：node controller 在最近 `node-monitor-grace-period` 内没听到节点消息

### 3.1 `Unknown` 更像“控制面听不见你了”

这通常对应：

- 网络分区
- kubelet 完全断联
- apiserver 到节点这条控制链断掉

官方文档明确写了：

- `node-monitor-grace-period` 默认是 **50 秒**

也就是说，默认大约几十秒没收到节点消息后，控制面就可能把 `Ready` 改成 `Unknown`。

### 3.2 `False` 更像“节点自己还在回话，但明确说自己不健康”

这通常更接近：

- kubelet 还能上报状态
- 但节点已经不适合继续接收工作负载

所以最稳的区分方式是：

> `False` 更像“我还能说话，但我不行了”；`Unknown` 更像“控制面已经听不见我了”。

## 4. node controller 在这条链路里到底做什么

Kubernetes 官方 `Nodes` 文档明确说：

- node controller 默认每 **5 秒**检查一次节点状态
- 如果节点变得 unreachable，会把 `Ready` 改成 `Unknown`
- 如果节点持续 unreachable，默认会在把节点标记为 `Unknown` 后等待 **5 分钟**，再提交第一次 API-initiated eviction 请求

这三条非常关键。

### 4.1 为什么 Pod 不会在节点一失联就立刻被“彻底迁走”

因为控制面本身就有节奏：

1. 先发现心跳异常
2. 再把 `Ready` 改成 `Unknown`
3. 再加 taint
4. 再根据 toleration 决定何时驱逐
5. 驱逐请求提交后，还要面对 kubelet 可能已经听不见控制面的现实

所以“节点挂了 -> Pod 秒迁走”通常是错误口径。

### 4.2 大规模故障时为什么不会疯狂一口气全驱

官方文档还明确说：

- node controller 会限制 eviction 速率
- 当某个 zone 大量节点同时不健康时，还会进一步降速甚至停止

这背后的逻辑非常现实：

- 如果是整个可用区或网络面在抖
- 一把把工作负载全驱逐掉，可能会造成更大的雪崩

所以节点故障下的驱逐，本质上也是“有节奏的自保收敛”，不是无脑清场。

## 5. 节点问题为什么最后会表现成 taint，而不是 scheduler 直接读 condition

Kubernetes 官方 taints 文档明确说：

- 控制面会根据 node conditions 自动给节点打 taint
- scheduler 做调度判断时，看的不是 node conditions 本身，而是 taints

这点很容易被答错。

更稳的理解是：

- node condition 更像“状态事实”
- taint 更像“调度和驱逐真正会用到的约束信号”

最关键的两个内建 taint 是：

- `node.kubernetes.io/not-ready`
- `node.kubernetes.io/unreachable`

它们分别对应：

- `Ready=False`
- `Ready=Unknown`

## 6. `NoExecute` 和 `tolerationSeconds` 到底怎么决定存量 Pod 何时走

官方 taints 文档明确说：

- `not-ready` 和 `unreachable` 这两个 taint 默认会带上 `NoExecute`
- Pod 可以通过 `tolerationSeconds` 指定，在节点失联后还能在这个节点上“绑定多久”

### 6.1 为什么很多业务默认是 300 秒

官方文档明确写了：

- Kubernetes 会自动给 Pod 加上 `node.kubernetes.io/not-ready` 和 `node.kubernetes.io/unreachable` 的 toleration
- 默认 `tolerationSeconds=300`

这意味着：

- 大多数普通 Pod 默认会在节点问题被检测到后，再额外容忍 **5 分钟**
- 不是说一出问题就立刻从 API 里删掉

### 6.2 DaemonSet 为什么经常不会因为这类问题被自动赶走

官方文档明确写了：

- DaemonSet Pod 会自动带上 `not-ready` 和 `unreachable` 的 `NoExecute` toleration
- 并且**没有 `tolerationSeconds`**

也就是说：

- 这类 Pod 会一直忍着
- 目的就是保证节点级代理、日志采集、网络组件这类守护进程别因为短暂节点问题全掉光

### 6.3 为什么现在文档里经常单独提 `taint-eviction-controller`

Kubernetes 官方 taints 文档明确说明：

- 从 **v1.29** 开始
- 基于 taint 的 eviction 逻辑已经从 node controller 里拆出来
- 由独立的 `taint-eviction-controller` 负责

这意味着：

- “节点状态判断”和“基于 taint 的 Pod 驱逐”在实现上已经不是同一个控制器
- 某些集群会单独调整甚至关闭这部分行为

所以更稳的口径应该是：

> node controller 更偏“判断节点出了什么问题”，而 `taint-eviction-controller` 更偏“基于这些 taint 什么时候开始驱逐 Pod”。

### 6.4 `tolerationSeconds` 不是“越长越稳”

更长的 `tolerationSeconds` 代表：

- 你更愿意等节点恢复

但它也代表：

- 业务副本在控制面眼里更久都还“挂”在坏节点上
- 如果这是强状态组件，还要考虑分区恢复和双活风险

所以这不是一个单纯的“稳定性”开关，而是一个**恢复速度与状态风险的权衡**。

## 7. 为什么 Pod 在 API 里已经不对了，分区节点上的进程却可能还在跑

这是节点故障里最关键、也最危险的一层。

官方 taints 文档明确提醒：

- 某些 unreachable 场景下，API server 无法把删除 Pod 的决定及时传给节点上的 kubelet
- 在通信恢复前，被安排删除的 Pod 可能仍继续在分区节点上运行

Kubernetes 官方 StatefulSet 强制删除文档也明确说：

- 运行在 unreachable 节点上的 Pod，在超时后可能进入 `Terminating` 或 `Unknown`
- 这并不代表分区节点上的进程已经真的停掉

所以必须记住：

> API 发起驱逐，不等于节点侧已经执行删除；网络分区场景下，控制面和节点对“Pod 还在不在”可能短时间内并不一致。

如果想专门把 `Terminating`、finalizer 和 delete 收敛链路讲透，要继续看 [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)。

这也是为什么对 StatefulSet、数据库、选主系统来说：

- 节点失联处理不能只看 API 对象变化
- 还要考虑 fencing、节点确认死亡、卷摘挂和成员身份一致性

## 8. `cordon`、`drain`、`NotReady`、`Unknown` 到底有什么本质区别

<K8sDiagram kind="node-condition-taint-eviction-boundary-map" />

这是另一组高频混淆点。

### 8.1 `cordon`

官方节点文档明确说：

- `cordon` 是把节点标成 unschedulable
- 它只影响**新 Pod 调度**
- 不会直接影响节点上**已经存在的 Pod**

所以：

- `cordon` 是维护准备动作
- 不是健康故障

### 8.2 `drain`

`drain` 更像：

- 在 `cordon` 基础上，主动通过 eviction / delete 把工作负载迁走

所以它是：

- **人为维护动作**

而不是：

- 节点控制面自动故障处理

如果想把 `PDB`、`Eviction API`、`429` 和 `drain` 为什么会卡住单独讲透，可以继续看 [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)。

### 8.3 `Ready=False / Unknown`

这属于：

- **控制面对节点健康的判断**

它可能进一步触发：

- taint
- 调度收敛
- API 发起驱逐

所以最稳的区分方式是：

> `cordon/drain` 是人工维护流程；`False/Unknown` 是健康状态判断；`NoExecute + tolerationSeconds` 才是存量 Pod 何时被驱逐的核心边界。

## 9. 一个比较稳的 toleration 骨架

如果你确实希望某类 Pod 在短时网络分区里多等一会儿，可以显式写出 toleration：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: local-cache
spec:
  replicas: 2
  template:
    spec:
      tolerations:
        - key: node.kubernetes.io/unreachable
          operator: Exists
          effect: NoExecute
          tolerationSeconds: 600
        - key: node.kubernetes.io/not-ready
          operator: Exists
          effect: NoExecute
          tolerationSeconds: 600
      containers:
        - name: app
          image: registry.example.com/cache:v1
```

这段配置表达的是：

- 节点失联或不健康后，这个 Pod 最多再等 10 分钟
- 等待窗口结束后，如果 taint 还在，控制面才会继续发起驱逐

它适合：

- 更希望等节点短暂恢复

它不天然适合：

- 需要更快腾挪副本的无状态在线服务

## 10. 最常见的坑

### 坑 1：把 `Unknown` 理解成“节点已经彻底死了”

它更准确的含义是：

- 控制面没听到节点消息了

### 坑 2：看到 Pod 被驱逐，就以为原节点上的进程已经停了

网络分区场景下，这两件事不一定同时成立。

### 坑 3：把 `cordon` 当成“已经迁走业务”

`cordon` 只是不再接新 Pod，不负责把旧 Pod 赶走。

### 坑 4：看到 `Ready=False/Unknown`，却忘了看自动 taint 和 toleration

真正决定存量 Pod 什么时候走的，往往是 `NoExecute + tolerationSeconds`。

### 坑 5：把 `tolerationSeconds` 配得很长，却没评估状态型服务的分区风险

这会让“等恢复”变成“更长时间的不一致窗口”。

### 坑 6：把 DaemonSet 的行为套到普通工作负载上

DaemonSet 对 `not-ready/unreachable` 的容忍是特殊处理，不代表普通 Pod 也会一直留下。

## 11. 排障时建议按这条顺序看

如果怀疑是节点失联或故障驱逐问题，建议按这条顺序排：

1. 先看 Node 的 `Ready` 条件到底是 `False` 还是 `Unknown`
2. 再看 `Lease` 和 `Node.status` 最近更新时间，确认是 kubelet 还在上报，还是控制面已经听不见了
3. 再看节点上有没有 `node.kubernetes.io/not-ready` 或 `node.kubernetes.io/unreachable` taint
4. 再看目标 Pod 的 toleration，尤其是 `NoExecute` 和 `tolerationSeconds`
5. 如果 Pod 一直不消失，再区分是 API 已经发起驱逐，但 kubelet 还没收到，还是节点对象本身仍未清理
6. 如果是 StatefulSet 或强状态服务，进一步确认原节点上的进程、卷和成员身份有没有真正退出
7. 最后再看是不是人为 `cordon/drain`、节点关机、云主机丢失或网络分区，把不同场景分开处理

## 12. 面试里怎么把这题答顺

如果面试官问：

> Kubernetes 里节点失联后 Pod 会怎么处理？为什么不是立刻迁走？

可以这样答：

> 我会先把它拆成一条节点失联收敛链路。  
> kubelet 会通过 `Node.status` 和 `Lease` 两条心跳告诉控制面自己还活着，其中 Lease 更轻量、默认更新更频繁；  
> node controller 默认每几秒检查一次节点状态，如果超过 `node-monitor-grace-period` 还没听到消息，就会把 `Ready` 改成 `Unknown`，并通过 `node.kubernetes.io/unreachable` 之类的 taint 影响调度和驱逐；  
> 对存量 Pod 来说，真正决定何时走的不是节点一失联的那一刻，而是 `NoExecute` taint 加上 Pod 的 `tolerationSeconds`，普通 Pod 默认大多会再容忍 300 秒；  
> 而且即便 API 已经发起驱逐，网络分区时原节点上的进程仍可能继续跑，所以这不是一句“Pod 自动迁移”就能解释完的，尤其 StatefulSet 还要考虑分区和双活风险。  

## 13. 最后记住这句话

> 节点故障真正要同时看六件事：心跳有没有断、`Ready` 变成了什么、自动 taint 是什么、Pod 忍多久、API 有没有发起驱逐、原节点上的进程到底停没停；只讲“节点挂了 Pod 会自动迁走”，最后一定会把问题答浅。

## 关联阅读

- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [控制面主线实战](./control-plane-mainline.md)
- [节点执行链路实战](./node-execution-chain.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [etcd 专题](/etcd/)
