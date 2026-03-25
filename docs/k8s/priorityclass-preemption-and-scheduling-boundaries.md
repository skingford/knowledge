---
title: PriorityClass、Preemption 与调度让路边界实战
description: 系统讲清 Kubernetes 中 PriorityClass、调度队列顺序、scheduler preemption、nominatedNodeName、非抢占优先级、PDB best effort、QoS 与节点压力驱逐的边界。
---

# PriorityClass、Preemption 与调度让路边界实战

很多团队一讲到优先级，就会把下面几件事混成一句：

- 优先级高，是不是就一定能调度成功
- 抢占是不是就是“把别人干掉给我腾地方”
- `PDB` 能不能挡住 preemption
- `QoS` 和 `PriorityClass` 到底谁更重要
- 高优先级 Pod 为什么还是会 `Pending`
- `preemptionPolicy: Never` 有什么实际意义

这条线真正要讲清的是：

> `PriorityClass` 解决的是“资源紧张时谁更值得先排、先让路”，不是“给 Pod 发一张万能通行证”。

<K8sDiagram kind="priority-preemption-scheduling-chain" />

如果你想先把 `Pending / OOMKilled / Evicted / taints / QoS` 这条基础链路走顺，再回来看这一篇，会更容易对上号，可以先看 [调度与驱逐链路实战](./scheduling-and-eviction.md)。

如果你想把 `PDB`、`Eviction API` 和 `kubectl drain` 这条“维护窗口驱逐预算”单独讲透，可以继续看 [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)。

## 1. 先回答：PriorityClass 到底解决什么

最实用的理解方式是：

- 它表达 Pod 的相对重要性
- 它影响 pending Pod 在调度队列里的顺序
- 在资源不够时，它还可能触发 scheduler preemption

但它不直接保证：

- Pod 一定能调度成功
- Pod 一定不会被驱逐
- Pod 一定比别人更稳

所以第一句就要答准：

> 高优先级更像“排队靠前、必要时更可能让别人让路”，不是“无视约束直接进场”。

## 2. PriorityClass 这个对象本身有哪些边界

Kubernetes 官方文档对 `PriorityClass` 的定义有几条非常重要的边界。

### 2.1 它是集群级对象，不是 namespace 级对象

也就是说：

- `PriorityClass` 是 cluster-scoped
- 不是每个 namespace 自己定义一套

这意味着它天然带治理属性：

- 一旦你定义一套优先级体系，整个集群都会共用这套语义

### 2.2 它本质上是“名字 -> 整数值”的映射

例如：

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: prod-high
value: 1000000
globalDefault: false
description: "核心在线服务使用"
```

它表达的是：

- `prod-high` 这个名字，对应优先级整数 `1000000`
- 数值越大，优先级越高

### 2.3 没配、配错、配默认，各自语义不一样

官方文档里这三件事是明确分开的：

- Pod 没写 `priorityClassName`
  - 如果集群有 `globalDefault=true` 的 `PriorityClass`，会吃这个默认值
  - 如果没有默认类，优先级就是 `0`
- Pod 写了一个不存在的 `priorityClassName`
  - Pod 会被拒绝创建

所以：

> “没写”和“写错”不是一个结果；前者是走默认或 0，后者是 admission 直接拒绝。

### 2.4 `globalDefault` 不该随手开

`globalDefault` 的危险点在于：

- 它会影响之后所有没写 `priorityClassName` 的新 Pod

这很容易让团队产生错觉：

- 我只是给某一类 Pod 提权

实际却变成：

- 整个集群默认优先级都被抬高了

### 2.5 系统内置优先级不要乱碰

官方文档明确说 Kubernetes 自带两个内置类：

- `system-cluster-critical`
- `system-node-critical`

同时，用户自定义 `PriorityClass` 名称：

- 不能以 `system-` 开头

这条线的工程建议很简单：

- 业务 Pod 不要冒充系统关键级

## 3. 为什么高优先级 Pod 还是可能一直 `Pending`

这是面试和线上都非常高频的追问。

因为 scheduler 真正的顺序是：

1. 先看这个 Pod 有没有满足调度前提
2. 再看它在 pending 队列里谁先排
3. 如果还是没地方放，才考虑要不要 preemption

也就是说，优先级绕不过这些硬约束：

- `requests` 太大，节点根本放不下
- `nodeSelector` / `nodeAffinity` 太苛刻
- `taints` 没有被 toleration 覆盖
- PVC、卷绑定、拓扑约束不满足
- Pod 反亲和、拓扑分布要求太紧

所以：

> 高优先级 Pod 也可能一直 `Pending`，因为优先级只影响“在可行前提下谁更先被处理”，不负责让不可能变成可能。

<K8sDiagram kind="priority-preemption-boundary-map" />

## 4. scheduler preemption 这条链到底怎么跑

这条链路如果只答一句“高优先级 Pod 会抢低优先级 Pod 的资源”，通常太浅。

更准确的主线是：

1. 一个高优先级 Pod 进入调度队列
2. scheduler 先尝试正常找可放置节点
3. 如果所有节点都不满足，再进入 preemption 逻辑
4. scheduler 尝试找一个节点
5. 在这个节点上，如果移走一部分更低优先级 Pod，是否能让当前 Pod 落下
6. 如果能，就选出 victim Pods
7. victim Pods 进入终止流程
8. 当前高优先级 Pod 等待真正可落位

这里最重要的几个关键词是：

- **单节点判断**
- **只挑比它优先级低的 victim**
- **victim 会先进入终止，不是瞬间蒸发**

### 4.1 `nominatedNodeName` 到底是什么

官方文档明确提到：

- 当 Pod P 在节点 N 上触发了 preemption
- Pod P 的状态里会写入 `nominatedNodeName=N`

这个字段更像：

- scheduler 给这个 Pod 暂时记下的“候选让路节点”

它不是：

- 最终一定绑定成功的承诺

所以线上看到 `nominatedNodeName` 时，正确理解是：

- scheduler 认为这个节点很有希望
- 但 victim 退出、资源真正空出来、最终绑定成功，还没完全结束

### 4.2 为什么 victim 已经被抢了，preemptor 还是没上去

官方文档专门提醒了这个边界。

因为 preemption 不是：

- victim 一删，preemptor 立刻原地出现

中间还隔着 victim 的优雅终止时间。

这就会造成一个时间窗：

- scheduler 已经决定让谁让路
- 但资源还没真正空干净

而在这段时间里，可能发生两件事：

- 另一个更高优先级 Pod 先来了
- 其他节点先空出来了

所以：

- `nominatedNodeName` 不一定等于最终 `nodeName`
- preemptor 也不保证一定吃到自己“看中的”那个节点

## 5. preemption 最容易答错的几条边界

### 5.1 它不是“跨集群全局腾挪”，而是单节点让路

官方文档明确说：

- scheduler 不做 cross-node preemption

这句话很关键。

它表达的是：

- 当前正在评估的，是某一个节点上删掉部分低优先级 Pod 后，能不能让高优先级 Pod 落下
- 不是删 A 节点上的 Pod，去成全 B 节点上的调度结果

所以如果一个 Pod 只有“跨节点一起调整”才能满足拓扑条件，scheduler 也不会这样做。

### 5.2 它绕不过硬约束

这是最常见误解。

即便你优先级再高，preemption 也绕不过：

- 节点亲和
- `taints / tolerations`
- PVC 绑定条件
- 拓扑反亲和
- 其他必须满足的 filter 条件

尤其官方文档单独提醒了一种容易踩坑的情况：

- 如果 pending Pod 对某些更低优先级 Pod 还有 inter-pod affinity
- 那你把这些低优先级 Pod 删掉后，亲和条件反而不成立

这时 scheduler 不会为了它去抢这个节点。

### 5.3 它不一定要把所有低优先级 Pod 都清掉

官方文档明确说：

- 如果只需要清掉一部分低优先级 Pod 就够让路
- scheduler 不会把所有低优先级 Pod 都删光

也就是说：

- preemption 的目标是“够用”
- 不是“清场”

### 5.4 `PDB` 在 preemption 里只是 best effort

这是和 `Eviction API` 最容易混淆的一条边界。

在 [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md) 那条线里：

- `Eviction API` 会显式检查 `PDB`

但在 scheduler preemption 里，官方文档明确写的是：

- preemption 会尽量找不违反 `PDB` 的 victim
- 但这只是 best effort，不是硬保证

所以更准确的口径是：

> `PDB` 在 `drain / Eviction API` 里更像硬预算；在 scheduler preemption 里只是尽力考虑，不是绝对挡板。

## 6. `preemptionPolicy: Never` 到底有什么用

这是比较深但很实用的一层。

官方文档把它叫：

- Non-preempting PriorityClass

典型写法是：

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-vip-nonpreempting
value: 100000
preemptionPolicy: Never
globalDefault: false
description: "高优先级排队，但不主动抢别人"
```

它的语义是：

- 这个 Pod 在 pending 队列里仍然比低优先级 Pod 更靠前
- 但它自己不会去 preempt 低优先级 Pod

### 6.1 它适合什么场景

官方文档给的典型例子很实用：

- 某些高优先级批处理 / 数据科学任务

你希望它：

- 比普通批任务更早拿到资源

但你又不希望它：

- 为了赶紧跑，把现在线上或已有任务直接打掉

### 6.2 但它不是“不会被抢”

官方文档明确提醒：

- non-preempting Pod 仍然可能被更高优先级 Pod 抢掉

所以 `Never` 只表达：

- 我不主动抢别人

不表达：

- 别人永远不能抢我

## 7. `PriorityClass`、`QoS`、节点压力驱逐为什么总被混

因为它们都看起来像：

- 资源紧张时谁先吃亏

但实际上处在不同阶段。

### 7.1 `PriorityClass`

更偏：

- scheduler 阶段
- pending 队列顺序
- preemption 时谁更可能让路

### 7.2 `QoS`

更偏：

- 节点资源压力场景下的受保护程度估计

### 7.3 节点压力驱逐

这是 kubelet 的逻辑，不是 scheduler 的 preemption 逻辑。

Kubernetes 官方文档明确说：

- Pod priority 和 QoS 是两个正交特性
- scheduler 在选择 preemption victims 时不看 QoS

同时官方 node-pressure eviction 文档又明确说：

- kubelet 在节点压力驱逐时，会看 Pod 是否超出 requests、Pod Priority、以及相对 requests 的超额程度

所以更准确的理解是：

> scheduler preemption 主要看优先级和调度可行性；kubelet 节点压力驱逐主要看是否超 requests、Priority 和资源压力；QoS 更像对驱逐顺序的经验近似，不是 scheduler preemption 的决策主轴。

这也是为什么线上会出现一种反直觉现场：

- 一个低优先级 Pod 没超 requests
- 一个更高优先级 Pod 反而超了 requests

节点压力时：

- 高优先级 Pod 也可能先被 kubelet 选中驱逐

所以别把“优先级高”答成“所有驱逐里都最安全”。

## 8. 最常见的误区和反模式

### 误区 1：给所有业务都配高优先级

这样最后等于：

- 谁都不高

你只是把优先级系统做成了：

- 新的一层默认值噪音

### 误区 2：把高优先级当成容量替代品

优先级不能替代：

- 足够的节点容量
- 合理的 requests
- 健康的扩缩容策略

如果底层容量就是不够，你只是把“大家都不够”变成：

- 某些业务先活，某些业务先死

### 误区 3：把 preemption 和 `drain` / `Eviction API` 混为一谈

这是两条完全不同的控制线：

- preemption：scheduler 为调度高优先级 Pod 主动让路
- eviction / drain：维护窗口里的主动驱逐

### 误区 4：以为 `PDB` 一定能挡住 preemption

不对。

- 在 `drain / Eviction API` 里，`PDB` 更像硬门槛
- 在 preemption 里，官方语义就是 best effort

### 误区 5：随手把 `globalDefault` 打开

这很容易让：

- 大量原本应该是 `0` 的普通 Pod
- 突然全部获得一个更高默认优先级

最后影响整条调度队列语义。

### 误区 6：不做限额，任由租户自己提权

官方文档明确建议：

- 可以用 `ResourceQuota` 限制高优先级 Pod 的使用

否则在多团队集群里很容易出现：

- 谁都想把自己配成最高优先级

## 9. 一套更稳的配置骨架

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: online-critical
value: 1000000
globalDefault: false
description: "核心在线服务"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-vip-nonpreempting
value: 100000
preemptionPolicy: Never
globalDefault: false
description: "高优先级批处理，但不主动抢占"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-api
  template:
    metadata:
      labels:
        app: payment-api
    spec:
      priorityClassName: online-critical
      containers:
        - name: app
          image: registry.example.com/payment-api:v1
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
```

这套骨架表达的是：

- 核心在线服务可以更优先被调度、必要时更可能触发让路
- 高优先级批任务可以更靠前排队，但不主动抢别人
- 优先级和资源规格一起配，不要只配其一

## 10. 排障时建议按这条顺序看

如果你怀疑是 `PriorityClass / preemption` 问题，建议按这条顺序排：

1. 先确认 Pod 是不是还在 `Pending`
2. 再看 `kubectl describe pod` 的调度事件，先分清是纯硬约束不满足，还是进入了 preemption 逻辑
3. 再看 `priorityClassName` 是否存在、是否被 admission 正确解析
4. 再看 `requests`、节点亲和、污点容忍、PVC、拓扑约束是不是根本不满足
5. 如果看到 `nominatedNodeName`，说明 scheduler 正在尝试让路，但还没最终绑定
6. 再看 victim Pods 的事件和优雅终止时间，确认是不是 victim 退得太慢
7. 再区分这是 scheduler preemption，还是 `drain / Eviction API`、节点压力驱逐
8. 最后再回头看是不是优先级体系本身设计失衡，例如所有服务都被抬成高优先级

## 11. 面试里怎么把这题答顺

如果面试官问：

> Kubernetes 里的 `PriorityClass` 和 preemption 是怎么工作的？为什么高优先级 Pod 还是可能调度不上？

可以这样答：

> `PriorityClass` 解决的是资源紧张时谁更重要，它先影响 pending Pod 在调度队列里的顺序；如果 Pod 还是调度不上，scheduler 才可能考虑 preemption，也就是在某个节点上移走更低优先级的 Pod，为高优先级 Pod 让路。  
> 但它不是万能通行证，因为 preemption 绕不过 `requests`、node affinity、taints、PVC、拓扑反亲和这些硬约束，所以高优先级 Pod 也完全可能一直 `Pending`。  
> 另外 scheduler preemption 和 `kubectl drain` 不是一回事，前者是调度器让路，后者是维护窗口主动驱逐；`PDB` 在 `Eviction API` 里更像硬预算，但在 scheduler preemption 里只是 best effort。  
> 还有一个比较深的点是 `preemptionPolicy: Never`，它表示这个 Pod 排队可以更靠前，但不会主动抢别人。  

## 12. 最后记住这句话

> `PriorityClass` 决定的是“谁更值得先排、先让路”，不是“谁可以无视约束”；preemption 是 scheduler 的让路机制，不是容量本身，也不是维护驱逐。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
