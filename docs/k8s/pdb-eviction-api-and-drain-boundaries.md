---
title: PDB、Eviction API 与 drain 边界实战
description: 系统讲清 Kubernetes 中 voluntary/involuntary disruption、PodDisruptionBudget、Eviction API、kubectl drain、429 Too Many Requests、unhealthyPodEvictionPolicy 与维护窗口边界。
---

# PDB、Eviction API 与 drain 边界实战

很多团队一讲到这条线，脑子里会把几件事混成一团：

- `PDB` 是不是“防宕机按钮”
- `kubectl drain` 为什么经常卡住
- `Eviction` 和直接 `DELETE Pod` 到底差在哪
- 为什么有时会返回 `429 Too Many Requests`
- Deployment 滚动发布到底受不受 `PDB` 控制
- 节点故障驱逐、节点压力驱逐、人工维护排空，是不是一回事

这条线真正要讲清的是：

> `PDB` 不是高可用本身，而是 voluntary disruption 的可用性预算；`Eviction API` 是预算入口；`kubectl drain` 是最常见的调用方。

<K8sDiagram kind="pdb-eviction-drain-chain" />

如果你想把节点失联、`Ready=False/Unknown`、`NoExecute` taint 和自动故障驱逐单独讲透，继续看 [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)。

如果你想把节点资源压力、`Evicted`、`OOMKilled` 和 kubelet 自保这条线讲透，继续看 [调度与驱逐链路实战](./scheduling-and-eviction.md)。

## 1. 先把 `Eviction` 这个词拆开

这是最容易混淆的起点。

在 Kubernetes 里，至少有两种完全不同的“驱逐”语境：

### 1.1 `Eviction API`

这是：

- apiserver 暴露的一个 subresource
- 面向“主动维护动作”的驱逐入口
- 常见调用方是 `kubectl drain`
- 会检查 `PDB`

你可以把它理解成：

- 我想优雅地把这个 Pod 迁走，但在迁走之前，要先确认有没有突破 disruption budget

### 1.2 节点压力下的 `Evicted`

这是：

- kubelet 为了保护节点做的资源压力驱逐
- 常见原因是内存、磁盘等压力
- 重点看 QoS、requests、节点压力阈值
- 不走 `PDB` 这条预算链路

所以第一句就要分清：

> 维护窗口里讲的 `Eviction API`，和资源压力场景里 Pod 状态显示的 `Evicted`，不是一回事。

## 2. disruption 先分 voluntary 和 involuntary

Kubernetes 官方把 disruption 分成两类：

- voluntary disruption
- involuntary disruption

最稳的理解方式是：

- voluntary：人或自动化系统“主动发起”的中断
- involuntary：故障自己发生了，你只能被动收敛

<K8sDiagram kind="disruption-budget-boundary-map" />

### 2.1 典型属于 voluntary disruption 的

- `kubectl drain`
- 集群节点维护、迁移、内核升级
- 某些自动化节点缩容流程
- 通过 `Eviction API` 主动迁走 Pod

这一类场景里：

- `PDB` 有机会发挥作用

### 2.2 典型属于 involuntary disruption 的

- 节点宕机
- 宿主机突然丢失
- 网络分区导致节点失联
- 底层硬件故障
- kubelet 自身不可达

这一类场景里：

- `PDB` 阻止不了故障发生
- 你真正要看的是节点心跳、taint、toleration、故障驱逐和应用自身容灾

### 2.3 还有两条高频边界必须单独记住

第一条：

- 工作负载自己的 rolling update 不直接受 `PDB` 控制

更准确地说：

- Deployment / StatefulSet 的发布节奏，主要看它们自己的 rollout 策略
- `PDB` 不是 rollout 的节奏控制器

第二条：

- 直接 `DELETE Pod` 会绕过 `PDB`

所以你不能把下面几件事混成一句：

- `drain`
- `eviction`
- `delete pod`
- 节点故障驱逐
- 节点压力驱逐

## 3. `PDB` 真正约束的不是“删不删”，而是“还能再少几个”

`PodDisruptionBudget` 的核心不是：

- 保证 Pod 永远不掉

而是：

- 对一组 Pod 设一个“主动中断预算”

也就是说，它真正回答的是：

- 在 voluntary disruption 场景下，这组 Pod 当前还能再被驱逐多少个

### 3.1 最常见的两种表达

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api
```

或者：

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: api
```

它们表达的是：

- `minAvailable`：至少要保住多少
- `maxUnavailable`：最多允许同时少掉多少

### 3.2 一个最实用的观察指标：`ALLOWED DISRUPTIONS`

生产里判断 `PDB` 有没有在生效，别只看 YAML。

更应该先看：

```bash
kubectl get pdb -A
kubectl describe pdb <name> -n <namespace>
```

重点看这些状态：

- `currentHealthy`
- `desiredHealthy`
- `disruptionsAllowed`

很多现场里真正关键信号就是：

- `ALLOWED DISRUPTIONS=0`

它往往说明：

- 预算已经打满了
- 这时候再发 eviction，请求就很可能被拒绝

### 3.3 这条预算只管“同时性”，不管“最终总量”

这是很多人容易答浅的一点。

`PDB` 约束的是：

- 某个时刻同时还能再少几个

它不直接负责：

- 一次 rollout 总共要换多少 Pod
- 版本多久能发完
- 节点故障时能不能自动恢复

所以更准确的口径是：

> `PDB` 是维护窗口里的并发预算，不是发布总控，也不是故障容灾本身。

## 4. `Eviction API` 和直接 `DELETE Pod` 到底差在哪

这道题最容易被说成一句空话：

- 一个优雅，一个不优雅

这不够。

真正该分清的是：

### 4.1 `Eviction API`

它的关键特征是：

- 面向 Pod 的驱逐入口
- 会检查是否违反 `PDB`
- 允许时，再进入 Pod 正常终止链路
- 不允许时，会直接拒绝请求

Kubernetes 官方文档明确提到：

- 如果 eviction 会违反 `PDB`，API 可能返回 `429 Too Many Requests`

所以这里的 `429` 不要只按 HTTP 限流理解。

它在这条场景里更像：

- 现在预算不够，你这个驱逐请求先别继续

### 4.2 直接 `DELETE Pod`

它的关键特征是：

- 直接删 Pod 对象
- 不会先检查 `PDB`
- 默认仍可能走正常优雅终止流程
- 但预算这道闸门已经被绕过去了

所以：

> `DELETE Pod` 不等于一定是 force kill，但它确实可以绕过 `PDB` 预算检查。

### 4.3 工程上最该怕的不是“删”，而是“绕过预算删”

很多事故不是因为 Pod 不能被删，而是因为：

- 维护窗口着急
- 人工为了快，直接删
- 最后一次少掉太多副本

## 5. `kubectl drain` 默认到底走哪条路

`kubectl drain` 本质上不是一个神秘黑盒。

它大致会做三件事：

1. 先把节点标成不可调度
2. 再把上面的工作负载 Pod 迁走
3. 等这些 Pod 终止完成后，再把节点空出来

在支持 eviction 的集群上，`kubectl drain` 默认会：

- 优先使用 `Eviction API`
- 因而默认会尊重 `PDB`

这也是为什么：

- `drain` 经常不是“删不动”
- 而是“预算不允许你这么删”

### 5.1 最关键的危险参数：`--disable-eviction`

官方 `kubectl drain` 参考文档明确说了：

- `--disable-eviction` 会强制使用 delete
- 这样会绕过 `PDB`

所以这不是“优化速度”的普通参数，而是：

- 明确切断预算保护

### 5.2 另外几个经常一起出现的参数

- `--ignore-daemonsets`
  - `drain` 不会替你删除 DaemonSet 管理的 Pod；通常要显式忽略它们
- `--delete-emptydir-data`
  - 节点上如果有 `emptyDir` 数据，默认会更保守；你要明确承担删除本地临时数据的后果
- `--force`
  - 对没被常规控制器接管的 Pod，`drain` 默认会更谨慎；强制删除前要先想清楚删了谁来补

### 5.3 `drain` 不是节点故障处理

这条边界必须死记：

- `drain` 是人工维护动作
- 节点失联是故障场景

一个是：

- 我主动迁走

另一个是：

- 我已经联系不上它了，只能被动收敛

## 6. 为什么 `drain` 经常会卡住

很多团队一看到 `drain` 卡住就觉得集群坏了。

这通常不对。

更常见的是：

- 保护机制正在生效

最常见的阻塞点有这些：

| 现象 | 背后边界 |
| --- | --- |
| `ALLOWED DISRUPTIONS=0` | `PDB` 预算已经打满 |
| Pod 不健康、readiness 长期失败 | 默认策略下，不健康 Pod 也可能阻塞 drain |
| 节点上有 DaemonSet Pod | `drain` 不会直接删它们，通常要 `--ignore-daemonsets` |
| 节点上有没被控制器接管的裸 Pod | 默认不会贸然删，通常要先确认再决定是否 `--force` |
| 有 `emptyDir` 本地数据 | 默认更保守，防止你误删节点本地临时数据 |
| `terminationGracePeriodSeconds` 很长 | eviction 已经允许了，但 Pod 终止链路还没走完 |
| `preStop`、卷卸载、应用收尾慢 | 卡在退出阶段，不是卡在预算检查 |

所以你要分两类“卡住”：

- 卡在**不能发起 eviction**
- 卡在**eviction 已经允许，但 Pod 还没真正退干净**

这两类问题的处理方式完全不同。

## 7. `unhealthyPodEvictionPolicy` 是专门解决“坏 Pod 卡 drain”的

这是比较深但非常实用的一层。

官方文档现在已经明确支持：

- `spec.unhealthyPodEvictionPolicy`

默认行为等价于：

- `IfHealthyBudget`

也就是：

- 一个 Pod 虽然在 `Running`
- 但它还不健康
- 这时是否允许驱逐，要看当前应用整体预算是不是还够

这会带来一个典型副作用：

- 应用本来就有坏 Pod
- `drain` 想清节点
- 结果这些不健康 Pod 反而把维护窗口卡住

### 7.1 `AlwaysAllow` 解决的就是这个问题

如果你这样配：

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  maxUnavailable: 1
  unhealthyPodEvictionPolicy: AlwaysAllow
  selector:
    matchLabels:
      app: api
```

语义就会变成：

- 对正在运行但不健康的 Pod
- 即使预算条件不满足，也允许把它驱逐掉

Kubernetes 官方关于 disruptions 和安全 drain 的文档都建议：

- 为了支持节点 drain 时迁走异常应用，通常推荐把 `unhealthyPodEvictionPolicy` 设成 `AlwaysAllow`

### 7.2 但它不是无脑全开

因为它的 trade-off 很直接：

- 好处：坏 Pod 不会一直卡住维护窗口
- 风险：这些 Pod 也失去了“先等它恢复健康再说”的机会

更实际的建议是：

- 对大多数无状态在线服务，`AlwaysAllow` 往往更合理
- 对极少数宁可等、不愿主动再动不健康实例的关键工作负载，要单独评估

## 8. 最常见的误区和反模式

### 误区 1：把 `PDB` 当成防节点故障工具

不对。

`PDB` 约束的是：

- voluntary disruption

它解决不了：

- 节点突然掉电
- 宿主机丢失
- 网络分区

### 误区 2：把 `PDB` 当成 rollout 节奏控制器

不对。

工作负载自己的滚动发布节奏，主要看：

- `maxSurge`
- `maxUnavailable`
- readiness 收敛
- 终止链路和流量摘除

### 误区 3：把 `delete pod` 当成 `eviction`

不对。

- `eviction` 会看预算
- `delete pod` 不看预算

### 误区 4：看到 `429 Too Many Requests` 就按网关限流思路排

在这条链路里，更应该先想：

- `PDB` 是不是不允许继续驱逐了

### 误区 5：单副本服务还配一个死死卡住的 `PDB`

比如：

- 只有 1 个副本
- `minAvailable: 1`

那结果通常就是：

- 任何 voluntary eviction 都不可能成功

这不一定叫“错”，但你必须接受它的工程后果：

- 节点维护前要先扩副本
- 或接受维护时短暂停机
- 而不是指望 `drain` 自己 magically 解决

### 误区 6：`policy/v1` 的空 selector 写错

这是比较容易忽略的坑。

在 `policy/v1` 里：

- 空的 selector `{}` 会匹配命名空间内所有 Pod

所以如果你 selector 写空，不是“谁也不管”，而可能是：

- 一下子给整个 namespace 都套上 disruption budget
- 最后把 drain 和维护窗口全卡死

## 9. 一套更稳的配置骨架

下面这套更适合多副本无状态服务：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: api
          image: registry.example.com/api:v1
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  maxUnavailable: 1
  unhealthyPodEvictionPolicy: AlwaysAllow
  selector:
    matchLabels:
      app: api
```

这套骨架表达的是：

- rollout 节奏由 Deployment 控
- 维护期驱逐预算由 `PDB` 控
- 异常 Pod 不至于把 drain 永久卡死

## 10. 排障时建议按这条顺序看

如果你怀疑是 `PDB / eviction / drain` 问题，建议按这个顺序排：

1. 先确认这是维护驱逐链路，还是节点故障驱逐、节点压力驱逐
2. 再看 `kubectl get pdb -A`，重点确认 `ALLOWED DISRUPTIONS`
3. 再看目标 Pod 是不是被这个 `PDB.selector` 选中了
4. 再看 Pod 当前是不是 `Ready`，有没有长期不健康导致预算算不动
5. 再看 `unhealthyPodEvictionPolicy` 是默认行为还是 `AlwaysAllow`
6. 如果是 `drain`，再看是不是 DaemonSet、裸 Pod、`emptyDir` 或 `--force` / `--ignore-daemonsets` / `--delete-emptydir-data` 问题
7. 如果 eviction 已经放行，再看是不是 `preStop`、`terminationGracePeriodSeconds`、卷卸载或应用收尾过慢
8. 最后再看是不是有人直接用了 `delete pod` 或 `--disable-eviction` 把预算绕过去了

## 11. 面试里怎么把这题答顺

如果面试官问：

> `PodDisruptionBudget`、`Eviction API` 和 `kubectl drain` 是什么关系？为什么 drain 会卡住？

可以这样答：

> 我会先把两类驱逐拆开：维护窗口里讲的是 `Eviction API`，节点压力下的 `Evicted` 是 kubelet 自保，两者不是一回事。  
> `PodDisruptionBudget` 解决的是 voluntary disruption 时一次最多能少掉多少 Pod，它本质上是驱逐预算，不是故障容灾本身。  
> `kubectl drain` 在支持 eviction 的集群里默认会走 `Eviction API`，所以会尊重 `PDB`；如果预算不够，eviction 会被拒绝，常见表现就是 `429 Too Many Requests` 或 drain 一直等。  
> 但如果直接 `delete pod`，或者 `drain --disable-eviction`，就会绕过 `PDB`。  
> 另外 rollout 也不直接受 `PDB` 控制，发布节奏主要看 Deployment 或 StatefulSet 自己的策略。  
> 所以我会把这条线总结成：`PDB` 管预算，`Eviction API` 管入口，`drain` 管维护动作，节点故障和节点压力是另外两条收敛链路。  

## 12. 最后记住这句话

> `PDB` 不是“别动我的 Pod”，而是“主动维护时一次最多能少多少”；`Eviction API` 是尊重这个预算的入口，`drain` 只是最常见的执行者。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
