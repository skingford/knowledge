---
title: 弹性扩缩容与容量协同实战
description: 系统讲清 Kubernetes 中 HPA、VPA、Cluster Autoscaler 如何围绕 requests、指标、Pending 和节点容量协同工作，以及为什么扩了副本也未必立刻扛住流量。
---

# 弹性扩缩容与容量协同实战

很多团队一提到 K8s 弹性，第一反应就是：

- 开 HPA

但只要再追问几句，回答就很容易散：

- 为什么 HPA 扩了副本，系统还是扛不住
- 为什么副本数已经涨上去了，Pod 还是 `Pending`
- 为什么 Cluster Autoscaler 没有加节点
- 为什么 VPA 一开，HPA 反而更容易抖

这条线真正要讲清的，不是“有几个 autoscaler”，而是：

> HPA 决定要几个 Pod，VPA 决定每个 Pod 至少申请多大资源，Cluster Autoscaler 决定集群有没有足够节点把这些 Pod 放下；三者能不能协同，关键看 `requests`、指标链路和 Pod 是否真的进入 `Ready`。

<K8sDiagram kind="autoscaling-control-chain" />

## 1. 先把三类能力拆开：它们分别解决什么

先记最重要的一句：

> 本文里提到的 Cluster Autoscaler，代表最常见的“节点自动扩缩容”实现；如果你的集群用的是其他 Node Autoscaler，也可以沿同一条分析链路理解。

| 组件 | 主要动作 | 核心输入 | 它不解决什么 |
| --- | --- | --- | --- |
| HPA | 改副本数 | 资源指标、自定义指标、外部指标 | 不直接加节点、不直接改单 Pod 规格 |
| VPA | 改 Pod 的资源请求/限制建议，必要时推动重建 | 历史资源使用、推荐算法 | 不负责秒级抗流量峰值、不直接解决入口慢启动 |
| Cluster Autoscaler | 改节点数 | `Pending` Pod 的资源请求与调度约束、节点组配置 | 不直接看运行中 Pod 的真实 CPU 曲线，不修应用 Bug |

最容易混淆的点有两个：

- HPA 关心的是“副本够不够”
- CA 关心的是“有没有地方放下这些副本”

这不是同一层问题。

## 2. 为什么 `requests` 是三者协同的共同地基

很多团队弹性做不稳，根因并不是 controller 不够多，而是 `requests` 从一开始就配假了。

### 2.1 对 HPA 来说，`requests` 决定利用率怎么算

如果 HPA 用的是 CPU / Memory utilization 这类指标，本质上算的是：

```text
当前使用量 / requests
```

所以：

- `requests` 配太小，利用率会虚高，HPA 容易过度扩容
- `requests` 配太大，利用率会偏低，HPA 反应会变钝
- 没有合理 `requests`，CPU / Memory utilization 这类目标本身就容易失真

### 2.2 对调度器和 CA 来说，`requests` 决定能不能放得下

调度器和节点自动扩缩容，看的是：

- 这个 Pod 至少要占多少 CPU / Memory
- 它有哪些 `nodeAffinity`、污点容忍、拓扑或卷约束
- 现有节点能不能放
- 节点组里有没有一种机器能放

也就是说：

- `requests` 低估，Pod 可能勉强调度成功，但运行中更容易抖、更容易 OOM
- `requests` 高估，Pod 更容易 `Pending`，CA 也更容易被迫加大机器

### 2.3 对 VPA 来说，它的核心价值就是把 `requests` 拉回真实世界

VPA 最有价值的场景，不是“救火扛尖峰”，而是：

- 你根本不知道业务该给多少 `requests`
- 目前的 `requests` 长期拍脑袋
- 资源长期严重高估或低估

所以一句话说透：

> `requests` 不是一个普通 YAML 字段，而是 HPA、调度器、CA、VPA 之间共享的“容量语言”。

## 3. HPA 真正在做什么，为什么它扩了副本却不一定马上见效

HPA 的正确定位不是“它会自动扩 Pod”，而是：

- 它根据观测到的指标，算出目标副本数
- 再去修改工作负载的 `scale` 子资源
- 真正创建 Pod 的，还是 Deployment / StatefulSet 这类下游控制器

如果用最实用的口径来说，HPA 主线通常是：

```text
Metrics -> HPA -> scale 子资源 -> Deployment/StatefulSet -> Pod
```

### 3.1 HPA 怎么算目标副本数

如果是最常见的平均指标目标，HPA 的思路可以近似理解成：

```text
desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)
```

例如：

- 当前 4 个副本
- 实际平均 CPU 利用率 120%
- 目标 CPU 利用率 60%

那它会倾向于把副本数拉到接近 8。

### 3.2 HPA 生效前要先满足哪些前提

最常见前提有这些：

- 集群里有可用的指标链路，例如 `metrics-server` 或自定义指标适配器
- 目标对象本身支持伸缩，例如 Deployment、StatefulSet
- 指标定义合理，不要用一个和业务容量无关的噪声指标
- `requests` 不是明显失真

### 3.3 为什么 HPA 扩了副本，业务还可能继续报错

因为副本数变大，不等于新容量已经对外可用。

中间还隔着一整条链路：

1. HPA 感知到指标变化需要时间
2. Deployment/StatefulSet 创建新 Pod 需要时间
3. 调度成功需要节点有空位
4. 镜像拉取、容器启动、初始化需要时间
5. `startupProbe` / `readinessProbe` 通过需要时间
6. Service / EndpointSlice 收敛后，流量才会真正打进来

所以 HPA 本质上解决的是：

- “目标副本数要不要增加”

它不直接解决：

- 冷启动慢
- `readiness` 太慢
- 下游数据库、缓存、队列扛不住
- 节点根本没空间

## 4. VPA 真正解决什么，为什么它更像“校准器”

VPA 最适合回答的问题不是：

- “我现在流量来了，要不要立刻多扛一点”

而是：

- “这个服务到底该申请多少 CPU / Memory 才更接近真实负载”

它更像一个持续学习和回写建议的资源校准器。

### 4.1 VPA 常见能力边界

VPA 常见会做几件事：

- 根据历史使用情况给出推荐值
- 在 Pod 创建时注入更合理的资源请求
- 在需要时通过重建或更新，让新的资源规格生效

实践里常见模式通常是：

- `Off`：只给建议，不自动改
- `Initial`：只在新 Pod 创建时注入建议
- `Recreate`：推荐值变化足够大时，推动 Pod 重建后生效

### 4.2 为什么 VPA 不能替代 HPA

因为它们解决的是两类不同问题：

- HPA 解决“实例数量”
- VPA 解决“单实例规格”

如果你的瓶颈是：

- 单实例规格明显配小了

那 VPA 有价值。

但如果你的瓶颈是：

- 并发上来了，需要更多实例一起扛

那还是 HPA 更对路。

### 4.3 VPA 更适合哪些场景

更常见的适用场景是：

- 长期稳定运行，但资源基线拿不准的服务
- 批处理、离线任务、后台 worker
- 想先把 `requests` 估准，再谈 HPA / CA 的服务

不太适合作为第一手手段的，是：

- 秒级突刺流量场景
- 对重建特别敏感、但你又没有充分发布窗口控制的核心服务

<K8sDiagram kind="hpa-vpa-ca-boundary-map" />

## 5. Cluster Autoscaler 到底看什么，为什么不是“CPU 高了就自动加机器”

很多人会把 Cluster Autoscaler 理解成：

- 节点 CPU 高了，它就会自动加节点

这通常不准确。

更稳的理解是：

- 节点自动扩缩容主要是响应“有 Pod 因为放不下而不可调度”

也就是：

- HPA 先让副本数变大
- 新 Pod 出来后，如果现有节点放不下，它们会进入 `Pending`
- 这时 CA 才有机会介入，看能不能补节点

### 5.1 CA 典型关心的条件

它通常会看：

- 有没有 unschedulable / `Pending` 的 Pod
- 这些 Pod 的 `requests` 和调度约束是什么
- 现有节点组里，有没有一种可扩出来的节点能满足这些 Pod
- 节点组是否触达上限、配额是否允许、云侧资源是否可用

### 5.2 哪些情况 CA 也帮不了你

下面这些情况，就算开了 CA 也未必有用：

- Pod 不是因为资源不够，而是因为 PVC、亲和性、污点、镜像、准入等问题卡住
- 节点组没有合适规格能满足 Pod 的约束
- 云账号配额不足、节点组扩容上限已到
- Pod 已经调度成功，但运行后 OOM 或被探针反复打死

所以一句话记：

> CA 解决的是“有合适机器时，帮你把机器补出来”，不是“凡是 Pod 起不来都替你兜底”。

## 6. 三者真正协同时，完整时序应该怎么讲

如果把一条最常见的线上链路串起来，通常是这样：

1. 请求量、队列长度或业务负载上升
2. 指标系统开始反映 CPU、内存、QPS 或外部指标变化
3. HPA 计算新的目标副本数，修改工作负载的 `scale`
4. Deployment / StatefulSet 开始创建新的 Pod
5. 如果节点还有余量，一部分 Pod 直接调度成功
6. 如果节点余量不足，剩余 Pod 进入 `Pending`
7. Cluster Autoscaler 观察到不可调度 Pod，判断是否可以扩某个节点组
8. 新节点创建、注册、`Ready`
9. 调度器把 `Pending` Pod 重新绑定到新节点
10. 容器启动、探针通过、Pod 进入 `Ready`
11. Service / EndpointSlice 收敛，流量才开始真正打到这些新副本

而 VPA 更像是这条链路旁边的一条慢变量：

- 它持续学习资源使用情况
- 把 `requests` 往更真实的方向拉
- 让后续的 HPA 计算、调度和 CA 扩容更接近真实需要

## 7. 为什么“副本数已经上去了”仍然可能扛不住

这是最常见的线上误判之一。

如果你只盯着：

- `kubectl get hpa`
- 看到副本数涨了

就断言“弹性已经生效”，通常还太早。

常见真正根因往往是这些：

### 7.1 指标有延迟，控制回路也有延迟

HPA 不是毫秒级反应，它天然就有：

- 指标采样延迟
- 控制器计算周期
- Pod 启动周期

所以如果你的流量尖峰非常陡，HPA 往往是“追着流量跑”，不是提前预知。

### 7.2 冷启动和 `readiness` 太慢

新副本即使已经创建出来，也可能因为下面这些原因很久接不到流量：

- 镜像太大
- 应用启动慢
- 预热太久
- `startupProbe` / `readinessProbe` 太保守

### 7.3 扩的是应用层，卡的是依赖层

如果真正瓶颈在：

- 数据库连接池
- Redis
- 下游 RPC
- 外部支付、风控、搜索服务

那应用副本扩再多，也只是更快把压力打到下游。

### 7.4 `requests` 低估，导致扩容判断整体失真

这类问题更隐蔽。

表现通常是：

- HPA 看起来在扩
- 调度器也看起来还能放
- 但节点实际很快出现争用、抖动、OOM、Evicted

本质上是：

- 调度和扩容依据的是假 `requests`
- 运行期暴露的是真资源压力

## 8. HPA 和 VPA 为什么经常互相打架

这是面试和生产里都非常高频的一道追问。

问题核心在于：

- HPA 如果根据 CPU / Memory utilization 决策，本质上依赖 `requests`
- VPA 恰好又在动态调整 `requests`

于是就会出现一个反馈回路：

1. VPA 把 `requests` 调大
2. HPA 看到利用率分母变大
3. 利用率数值下降
4. HPA 可能又觉得副本数不用那么多

反过来，如果 VPA 把 `requests` 调小，也可能把 HPA 推向更激进扩容。

所以工程上更稳的做法通常是：

- HPA 优先看 QPS、延迟、队列长度这类业务指标
- VPA 先跑在建议模式，先把 `requests` 校准出来
- 如果一定同时启用，尽量不要让两者同时控制同一维度的 CPU / Memory 利用率

一句话概括：

> HPA 和 VPA 不是绝对不能一起用，而是不能在同一条反馈链上互相改对方的输入。

## 9. 一套更稳的最小配置骨架

真正能把 HPA 用稳，通常至少要先把三件事配对：

- 合理的 `requests`
- 能真实表达“可接流量”的 `readinessProbe`
- 不要过于粗糙的扩缩容行为

下面是一个最小骨架：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: example/api:v1
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            periodSeconds: 5
            failureThreshold: 2
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
    scaleDown:
      stabilizationWindowSeconds: 300
```

这个骨架至少表达了三件事：

- HPA 的 CPU 利用率目标有合理 `requests` 作为基线
- 新副本只有在真正可接流量时才会 `Ready`
- scale down 不会因为短暂抖动立刻来回缩放

而 CA 不在业务 YAML 里配置，它属于集群层能力。你要单独确认：

- 节点组能扩
- 配额够
- Pod 约束真的能被某种节点满足

## 10. 真正排障时，建议按这条顺序走

如果线上出现“明明开了弹性却还是不稳”，建议按这条顺序排：

1. 先看 HPA 有没有真的改目标副本数，而不是先猜测 controller 没工作
2. 再看新副本是卡在 `Pending`，还是已经 Running 但迟迟不 `Ready`
3. 如果是 `Pending`，优先看 `requests`、亲和性、污点、PVC、Quota 和调度事件
4. 如果 `Pending` 很久，再看 CA 是否真的在管理对应节点组，以及节点组有没有扩容空间
5. 如果副本已经 Running 但效果差，优先看镜像拉取、启动耗时、探针、预热和依赖瓶颈
6. 如果副本数上下抖动，再回头看 HPA 指标选型、VPA 是否改了 `requests`、scale down 策略是否太激进

最怕的排障方式是：

- 一看扛不住就说“把 HPA maxReplicas 再调大”

因为如果真正卡点是：

- 节点放不下
- 新副本起不来
- 依赖层扛不住

你只是把症状放大，不是在解决问题。

## 11. 面试里怎么把这题答顺

如果面试官问：

> HPA、VPA、Cluster Autoscaler 有什么区别？它们怎么协同？

可以这样回答：

> 这三者分别处在不同层。  
> HPA 负责根据指标调副本数，解决的是横向扩容问题；  
> VPA 负责调整单个 Pod 的资源请求，让 `requests` 更接近真实使用；  
> Cluster Autoscaler 负责在 Pod 因为资源放不下而 `Pending` 时补节点，解决的是集群容量问题。  
> 三者协同的关键是 `requests`。因为 HPA 的资源利用率、调度器的放置决策、CA 的节点扩容判断都离不开它。  
> 所以线上如果出现“副本扩了还是扛不住”，我会继续往后看 Pod 有没有 `Pending`、有没有真正 `Ready`、下游依赖是不是瓶颈，而不会把 HPA 当成性能银弹。  

## 12. 最后记住这句话

> HPA 解决“要几个”，VPA 解决“每个至少多大”，CA 解决“集群有没有地方放下它们”；如果 `requests`、探针和容量边界没讲清，弹性这条线就一定会答散。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [控制面主线实战](./control-plane-mainline.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
