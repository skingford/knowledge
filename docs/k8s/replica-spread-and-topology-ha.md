---
title: 副本打散与拓扑高可用实战
description: 系统讲清 Kubernetes 中 podAntiAffinity、topologySpreadConstraints、PodDisruptionBudget、kubectl drain 如何围绕节点、可用区和维护窗口共同保障高可用。
---

# 副本打散与拓扑高可用实战

很多团队做 K8s 高可用时，脑子里只有一句话：

- 副本数开大一点

但线上真正出事时，往往不是“副本不够多”，而是：

- 3 个副本全在同一台节点上
- 6 个副本其实都在同一个可用区
- 节点维护时被同时赶下线太多
- HPA 把副本扩起来了，但没有打散，入口流量还是偏在少数节点

所以高可用这条线真正要先讲清的是：

> 副本数解决“有没有多个实例”，副本打散解决“这些实例会不会一起受伤”，PDB 和 drain 解决“维护时能不能一次少掉太多实例”。

<K8sDiagram kind="replica-spread-ha-chain" />

## 1. 先回答：为什么副本数够了，服务还是可能一起挂

最常见的误区是把：

- 多副本

直接等价成：

- 高可用

这两者差得很远。

如果 3 个 Pod：

- 都在同一台节点
- 或都在同一可用区

那下面任何一个事件都可能把它们一起带走：

- 节点宕机
- 节点重启
- 节点维护和 `drain`
- 单可用区故障

所以高可用至少要分三层看：

| 层次 | 典型问题 | 典型手段 |
| --- | --- | --- |
| 节点级 | 副本全堆一台节点 | `podAntiAffinity`、`topologySpreadConstraints` |
| 可用区级 | 副本全堆一个 zone | `topologySpreadConstraints`、zone 标签 |
| 维护窗口级 | 节点排空时少太多副本 | `PodDisruptionBudget`、规范 `drain` 流程 |

## 2. 高可用分布最怕的不是“少”，而是“集中”

很多线上事故的本质并不是资源不足，而是集中化：

- 调度器为了尽快放下 Pod，把副本贴得太近
- 集群规模小，节点标签不全，结果“看起来有多个副本”，实际上集中在同一故障域
- HPA 只关心副本数，不关心这些副本是不是均匀分散

一句话记忆：

> 调度成功不代表分布合理，Running 更多不代表故障域已经被隔开。

## 3. `podAntiAffinity` 解决什么，它的边界在哪

最直观的需求通常是：

- 不要把同一个服务的副本放在同一台机器上

这正是 `podAntiAffinity` 最擅长表达的事情。

### 3.1 它真正表达的是什么

官方文档里，inter-pod affinity / anti-affinity 的语义本质上是：

- 如果某些已存在 Pod 满足某个选择条件
- 那新 Pod 应该或不应该落在同一个拓扑域里

这个拓扑域可以是：

- `kubernetes.io/hostname`
- `topology.kubernetes.io/zone`
- 其他你自己维护的一致性标签

### 3.2 最常见用法：不要同机

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: api
          topologyKey: kubernetes.io/hostname
```

这段配置表达的是：

- 调度器尽量不要把同标签的 Pod 放到同一台节点

### 3.3 `required` 和 `preferred` 的区别

这是面试特别爱追问的一点。

- `requiredDuringSchedulingIgnoredDuringExecution`：硬约束，放不下就宁可 `Pending`
- `preferredDuringSchedulingIgnoredDuringExecution`：软约束，尽量满足，但放不下时可以退而求其次

高可用场景里最常见的经验是：

- 集群规模不大时，优先从 `preferred` 开始
- 只有当你非常确认节点数量、容量和标签都稳定时，再考虑 `required`

因为很多团队一上来就写硬反亲和，最后得到的不是高可用，而是：

- 发布卡住
- 扩容卡住
- Pod 大量 `Pending`

### 3.4 它的局限是什么

`podAntiAffinity` 很适合表达：

- 别和同类 Pod 贴太近

但它不擅长精确表达：

- 每个 zone 应该尽量均匀分几份
- 节点间偏斜最多允许多大

这就是 `topologySpreadConstraints` 要补上的部分。

## 4. `topologySpreadConstraints` 解决什么，为什么它更适合“均匀打散”

如果说 `podAntiAffinity` 更像：

- 不要挤在一起

那 `topologySpreadConstraints` 更像：

- 尽量在各个拓扑域里分得均匀一些

这是它和 anti-affinity 的核心差别。

### 4.1 它最关键的几个字段

官方文档里最核心的几个字段是：

- `topologyKey`：按哪个拓扑域分，例如节点或可用区
- `maxSkew`：允许的最大倾斜差
- `whenUnsatisfiable`：放不平衡时，是直接不调度，还是先调度再尽量优化
- `labelSelector`：哪些 Pod 算同一组，需要一起参与分布计算

一个最小骨架通常长这样：

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: api
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: api
```

这表达的是：

- 节点级别尽量均衡
- 可用区级别也尽量均衡
- 一旦偏差超过允许范围，就宁可先不调度

### 4.2 `DoNotSchedule` 和 `ScheduleAnyway` 怎么理解

- `DoNotSchedule`：把均匀分布当硬约束
- `ScheduleAnyway`：先尽量放下，再在评分里偏向更均匀的位置

实践里可以这样理解：

- 高可用要求很硬，且集群基础设施稳定时，可以考虑 `DoNotSchedule`
- 如果你更怕扩容或发布卡死，通常 `ScheduleAnyway` 更稳

### 4.3 它比 anti-affinity 更适合哪些场景

更适合：

- 想同时控制 node 和 zone 两层分布
- 想表达“尽量均匀”，而不是只表达“不要同机”
- HPA 扩容后，希望新副本也能沿同样分布逻辑打散

## 5. `podAntiAffinity` 和 `topologySpreadConstraints` 到底怎么选

这两个对象很像，但不是一回事。

<K8sDiagram kind="spread-constraint-boundary-map" />

### 5.1 用 `podAntiAffinity` 的典型场景

适合表达：

- 同一服务副本尽量别在同一节点
- 两类 Pod 尽量不要共置

它更像：

- 防止贴得太近

### 5.2 用 `topologySpreadConstraints` 的典型场景

适合表达：

- 希望副本在 node / zone 维度更均衡
- 希望把“最大偏斜”说清楚

它更像：

- 控制整体分布形状

### 5.3 工程上更实用的经验

如果你只需要最低成本地把副本分开：

- 先上 `preferred` 的 `podAntiAffinity`

如果你已经开始认真做：

- 跨节点
- 跨可用区
- 扩缩容后的均匀性

那通常 `topologySpreadConstraints` 更适合作为主表达手段。

## 6. `PDB` 解决什么，它为什么不是“防宕机按钮”

这也是高可用问题里最容易说错的一句。

`PodDisruptionBudget` 真正解决的是：

- 自愿中断时，一次最多能少掉多少 Pod

官方文档把 disruption 分成：

- voluntary disruptions
- involuntary disruptions

所以 `PDB` 的边界一定要讲清：

- 它能约束很多“人为或控制面发起的驱逐”
- 它不能阻止节点突然宕机这类 involuntary disruption

### 6.1 `minAvailable` 和 `maxUnavailable` 怎么选

常见两种表达方式：

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

- 至少要保住多少
- 或最多允许同时少掉多少

### 6.2 PDB 最常见的误解

误解一：

- 配了 PDB，节点故障时我就安全了

不对。节点突然挂掉属于 involuntary disruption，PDB 阻止不了。

误解二：

- 配了 PDB，Deployment 滚动更新就会自动按它来控节奏

也不准确。官方文档明确说明，工作负载自己的 rolling update 不受 PDB 直接限制，发布节奏还是看 Deployment / StatefulSet 自己的策略。

更准确的说法是：

> PDB 更像维护期和驱逐期的可用性预算，不是 rollout 的节奏控制器。

## 7. `kubectl drain` 这条线为什么必须和 PDB 一起讲

生产里非常常见的一条链路是：

- 节点升级
- 节点维修
- 节点迁移

这时运维通常会执行：

```bash
kubectl drain <node-name>
```

这条命令背后的本质是：

- 先让节点不可调度
- 再驱逐上面的 Pod
- 等它们迁走

而 `drain` 和 PDB 的关系是高频考点：

- 正常情况下，`drain` 会尊重 eviction 机制
- 也就会受到 PDB 约束

官方 `kubectl drain` 参考文档还明确提到：

- 如果你强制用 delete 而不是 eviction，会绕过 PDB

这就是为什么工程上很怕：

- 为了图快，乱用会绕过 budget 的参数

### 7.1 `drain` 为什么经常会“卡住”

最常见原因通常是：

- PDB 太严格
- 剩余副本数本来就不够
- 应用 `terminationGracePeriodSeconds` 很长
- 某些 Pod 根本没有被合适控制器接管

所以 `drain` 卡住不一定是坏事，它常常意味着：

- 你的可用性预算正在生效

### 7.2 真正该避免的不是“慢”，而是“绕过”

如果维护窗口紧张，很多团队第一反应是：

- 想办法把 Pod 赶快删掉

但更危险的往往是：

- 直接绕过 budget
- 一次性把关键副本清太多

## 8. 为什么这条线会和 HPA、入口流量、外部 LB 纠缠在一起

副本打散不是独立存在的，它会直接影响别的章节里的稳定性。

### 8.1 和 HPA 的关系

HPA 只保证：

- 副本数增加

不保证：

- 每个接流量节点上都有本地 Pod
- 每个 zone 都有足够副本

所以如果只开 HPA，不做分布控制，最后很可能是：

- 副本更多了
- 但集中化问题还在

### 8.2 和 `externalTrafficPolicy: Local` 的关系

`Local` 模式下，入口对本地 Pod 分布更敏感。

如果流量打到某些节点，但这些节点没有本地 Pod，就会更容易出现：

- 流量倾斜
- 局部节点打满
- 发布期间短暂黑洞

所以这条线里，分布策略不是“调度美学”，而是入口稳定性的前提条件之一。

### 8.3 和零停机发布的关系

如果你只把滚动更新节奏配得很漂亮，但副本始终集中在少数节点上，那么：

- 节点维护
- zone 波动
- 本地入口节点失衡

都仍然可能让你一次少掉太多容量。

## 9. 一套更稳的配置骨架

下面是一套面向“多副本 API 服务”的最小高可用骨架：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 4
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api
                topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: api
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: api
      containers:
        - name: api
          image: example/api:v1
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
---
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

这套骨架表达的是：

- 副本尽量不要同机
- 节点和可用区都尽量均匀
- 维护或驱逐时一次最多少 1 个副本

## 10. 最容易踩的坑

### 坑 1：只配 `replicas`，不配任何分布约束

这通常只能保证：

- 实例有多个

不能保证：

- 故障域被隔开

### 坑 2：一上来就写硬反亲和，结果扩容和发布都 `Pending`

特别是在：

- 集群节点少
- 节点标签不完整
- 资源本来就紧

的情况下，非常常见。

### 坑 3：想做 zone 级打散，但节点根本没打对 zone 标签

无论是 anti-affinity 还是 topology spread，本质上都依赖：

- 拓扑标签真实、完整、一致

标签不一致时，策略看起来“写对了”，结果可能完全不符合预期。

### 坑 4：把 PDB 当成防节点故障工具

PDB 约束的是 voluntary disruption，不是突然宕机。

### 坑 5：维护时为了图快，直接绕过 eviction

这类操作短期看起来省事，长期最容易把高可用设计打回原形。

## 11. 排障时建议按这条顺序看

如果你发现服务明明多副本，维护或故障时还是掉得很厉害，建议按这条顺序排：

1. 先看副本是不是集中在少数 node / zone，而不是先盯 HPA
2. 再看 Pod 上有没有 anti-affinity 或 topology spread，以及它们到底是软约束还是硬约束
3. 再看节点标签是否真实完整，尤其是 `hostname`、`topology.kubernetes.io/zone`
4. 如果是维护窗口问题，再看 PDB 配置是否合理，以及 `drain` 是否在尊重 eviction
5. 如果入口流量异常，再结合 `externalTrafficPolicy: Local`、LB 健康检查和本地 Pod 分布一起看

## 12. 面试里怎么把这题答顺

如果面试官问：

> Kubernetes 里怎么避免多个副本一起受伤？`podAntiAffinity`、`topologySpreadConstraints`、PDB 分别解决什么？

可以这样答：

> 我会先把问题拆成三层。  
> 第一层是调度分布，高可用不能只看副本数，还要看这些副本是不是被打散到了不同节点甚至不同可用区；  
> `podAntiAffinity` 更像防止副本贴得太近，`topologySpreadConstraints` 更像控制在 node / zone 维度的整体均匀分布；  
> 第二层是维护窗口，`PodDisruptionBudget` 解决的是 voluntary disruption 时一次最多能少多少副本，它不是防节点突然宕机的；  
> 第三层是运维动作，像 `kubectl drain` 这种节点排空流程应该尊重 eviction 和 PDB，而不是为了快直接绕过去。  
> 所以真正的高可用不是把 replicas 调大，而是把副本分布和中断预算一起设计好。  

## 13. 最后记住这句话

> 副本数解决“有没有多个实例”，副本打散解决“它们会不会一起挂”，PDB 解决“维护时一次能少多少”；这三层不拆开，高可用这题就一定会答散。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [K8s 必备问题清单](./essential-questions.md)
