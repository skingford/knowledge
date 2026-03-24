---
title: 资源规格与运行时压力实战
description: 系统讲清 Kubernetes 中 requests、limits、QoS、CPU throttling、OOMKilled 和节点压力之间的关系，以及为什么“能调度”不等于“跑得稳”。
---

# 资源规格与运行时压力实战

很多团队在 K8s 里配资源时，脑子里只有两句话：

- `requests` 决定调度
- `limits` 决定上限

这两句话不算错，但太薄了。

一旦线上开始抖动，真正的问题通常会变成：

- 为什么 Pod 明明已经调度成功，接口还是变慢
- 为什么 CPU 飙高时没有重启，却延迟和超时都上来了
- 为什么内存看起来没打满节点，容器还是 `OOMKilled`
- 为什么同样是资源问题，有的是 `OOMKilled`，有的是 `Evicted`

这条线真正要讲清的不是字段名，而是：

> `requests` 决定的是“你至少要占多少”和“资源竞争时你大概排什么队”，`limits` 决定的是运行时硬边界；CPU 更常见的后果是被 throttling，内存更常见的后果是 OOM，而 QoS 则决定节点压力下谁更容易先吃亏。

<K8sDiagram kind="resource-enforcement-chain" />

## 1. 先拆两层：调度成功和运行稳定不是一回事

这是资源问题里最容易混淆的一层。

很多人看到 Pod 已经不是 `Pending` 了，就默认：

- 资源配置应该没问题

其实这只代表：

- 调度器根据 `requests` 判断，当前节点还能先把你放下

它完全不代表：

- 运行时不会被 CPU 限流
- 运行时不会打爆内存 limit
- 节点资源压力起来时不会被驱逐

所以资源问题至少要拆成两段来看：

| 阶段 | 主要看什么 | 最常见现象 |
| --- | --- | --- |
| 调度前 | `requests`、约束、节点空位 | `Pending` |
| 运行中 | cgroup 限制、节点压力、QoS | throttling、`OOMKilled`、`Evicted` |

一句话记忆：

> 能调度，只说明“先住进去了”；能不能跑稳，还要看运行时边界和节点压力。

## 2. 从 YAML 到运行时，资源边界到底是怎么生效的

官方资源管理文档给出的主线可以概括成：

1. 你在 Pod / Container 里声明 `requests` 和 `limits`
2. 调度器先基于 `requests` 判断节点是否放得下
3. kubelet 启动容器时，把这些资源边界传给 container runtime
4. 在 Linux 上，runtime 通常会配置 cgroups 来真正施加限制

本文默认以最常见的 container-level resources 为主来讲。如果你的集群已经在用 Pod-level resources，这只是把一部分边界上提到 Pod 层，不改变这条主线的核心理解。

### 2.1 `requests` 和 `limits` 到底各自代表什么

最实用的理解方式是：

- `requests`：调度和资源竞争时的基础承诺
- `limits`：运行时允许你冲到的硬边界

但还要再往前补一层：

- CPU 的 request 更像“权重 / 份额”
- Memory 的 limit 更像“硬天花板”

这也是为什么 CPU 和内存在超限后的表现完全不一样。

## 3. CPU 这条线：最常见的后果不是重启，而是 throttling

很多人第一次碰 CPU limit，会下意识把它想成：

- 超了就像内存一样直接挂

这通常不对。

官方资源管理文档对 CPU limit 的描述非常明确：

- CPU limit 是一个 hard ceiling
- 在每个调度时间片里，如果超出限制，内核会先让这个 cgroup 等一等

换句话说：

- 它更常见的表现是被限流
- 而不是直接被杀

### 3.1 CPU request 到底在运行时意味着什么

官方文档里也明确提到：

- CPU request 通常定义的是一种权重

也就是说，当节点 CPU 出现争用时：

- request 更大的 workload，通常能分到更多 CPU 时间
- request 很小的 workload，更容易在竞争里吃亏

所以 CPU request 不是：

- “保底一直给你这几个核”

更准确地说，它更像：

- 调度时的容量依据
- 争用时的相对份额依据

### 3.2 CPU limit 太紧时，线上通常怎么坏

最常见表现不是日志直接报错，而是：

- 接口 RT 上升
- 尾延迟变重
- 超时变多
- `kubectl top` 看到 CPU 接近 limit，但 Pod 没重启

这是因为：

- 进程还活着
- 只是被频繁限流

所以 CPU 这题最容易答错的地方是：

> CPU 超 limit，更常见的是慢，不是死。

### 3.3 什么时候要对 CPU limit 特别谨慎

对这类服务尤其要小心：

- 延迟敏感型 API
- GC 峰值明显的语言运行时
- 有突刺流量的服务
- 线程池或协程池会短时猛冲 CPU 的服务

因为 CPU limit 配得太死，常见副作用就是：

- 平时看着很节制
- 峰值一来开始被持续 throttling

## 4. 内存这条线：最常见的后果就是 OOMKilled

和 CPU 完全不同，内存更像硬边界。

官方资源管理文档对 memory limit 的描述也很直接：

- 如果容器试图分配超过这个 limit 的内存
- Linux 内核的 OOM 子系统通常会介入
- 往往会杀掉容器里的某个进程

如果被杀掉的是容器的 PID 1，而且容器可重启，那 Kubernetes 通常会重启这个容器。

### 4.1 内存 request 在运行时是不是保底

内存 request 最核心的作用仍然是：

- 调度依据

但官方文档同时提到，在使用 cgroups v2 的节点上：

- runtime 可能把 memory request 当成设置 `memory.min` / `memory.low` 的 hint

更稳的理解是：

- 它会影响调度和资源压力下的优先级
- 但它不是“超了 request 就立刻出事”的硬边界

真正的硬边界仍然是：

- memory limit

### 4.2 为什么容器会 `OOMKilled`

最常见原因通常就三类：

- 内存 limit 本来就太小
- 应用有明显内存泄漏
- 峰值分配被低估，例如缓存、批处理、反序列化、压缩解压、GC 辅助空间

所以你看到 `OOMKilled` 时，优先先想：

- 这是容器自己的 memory ceiling 打穿了

不要一上来先把它和节点驱逐混成一类。

### 4.3 一个经常被忽略的坑：memory-backed `emptyDir`

官方资源管理文档专门提到：

- 内存型 `emptyDir` 的使用会被算进容器内存

也就是说，如果你用了：

- `emptyDir.medium: Memory`

但没仔细控 `sizeLimit` 或 memory limit，就可能出现：

- 不是业务堆内存大
- 而是 tmpfs 文件也把 limit 顶穿了

## 5. 为什么 `limits` 不一样，CPU 和内存后果却完全不同

这是很高频的追问。

可以直接这样记：

- CPU 是可压缩资源，超限更常见是 throttling
- 内存不是可压缩资源，超限更常见是 OOM

所以线上表现通常是：

| 资源 | 超 limit 常见后果 | 更像什么问题 |
| --- | --- | --- |
| CPU | throttling、变慢、延迟抖动 | 性能被压 |
| Memory | `OOMKilled`、重启、进程消失 | 边界被打穿 |

## 6. QoS 到底在这条线上起什么作用

QoS 不是你单独配置出来的字段，而是 Pod 根据资源规格推导出来的类别。

<K8sDiagram kind="requests-limits-qos-boundary-map" />

### 6.1 Guaranteed

最常见判定条件是：

- 每个容器都同时配置了 CPU / Memory request 和 limit
- 且 CPU request = limit，Memory request = limit

这类 Pod：

- 调度上最可预测
- 节点压力时通常最不容易先被驱逐

但代价也很明显：

- 弹性空间最小
- 资源利用率可能更保守

### 6.2 Burstable

只要 Pod 不满足 Guaranteed，但至少有一部分 CPU / Memory request 或 limit，就通常会落到 Burstable。

这类 Pod：

- 最常见
- 有一定保障
- 也允许一定突发

很多业务服务实际都会在这个层级。

### 6.3 BestEffort

什么都不配时，就是 BestEffort。

这类 Pod：

- 调度看起来最容易
- 节点压力时通常也最先吃亏

所以 BestEffort 很适合：

- 实验性任务
- 临时工具 Pod

不适合：

- 核心业务服务

### 6.4 QoS 到底不是什么

QoS 最容易被误解成：

- 性能档位

实际上更准确的理解是：

- 资源竞争和驱逐压力下的“受保护程度”

官方 QoS 文档也明确指出一些行为其实和 QoS 无关，例如：

- 任何容器超出资源 limit，仍然可能被杀
- 超过 request 且节点整体资源紧张时，Pod 仍然可能成为 eviction 候选

## 7. `OOMKilled`、`Evicted`、CPU 慢，到底怎么区分

很多线上复盘会把这三种现象混成一句：

- 资源不够了

这非常不够用。

### 7.1 `OOMKilled`

更像：

- 单容器自己的内存边界被打穿

先看：

- memory limit
- 应用峰值
- 是否有内存泄漏
- 是否用了 memory-backed `emptyDir`

### 7.2 `Evicted`

更像：

- 节点整体压力太大，kubelet 为了保节点先请一部分 Pod 下车

先看：

- 节点内存 / 磁盘 / inode 压力
- QoS
- requests 是否长期低估

### 7.3 CPU 变慢但不重启

更像：

- 被 throttling

先看：

- CPU limit 是否太紧
- 节点是否有 CPU 争用
- 延迟峰值是否和 CPU 饱和同时出现

一句话：

> `OOMKilled` 是打穿内存天花板，`Evicted` 是节点在自保，CPU throttling 则是人还活着但被勒住了脖子。

## 8. 一些特别容易踩的坑

### 坑 1：只配 `limits`，不配 `requests`

这是最常见反模式之一。

官方 CPU 文档明确写到：

- 如果你配了 CPU limit，但没配 CPU request，Kubernetes 会自动把 request 设成和 limit 一样

内存也有类似行为。

这会带来一个经常被忽略的副作用：

- 你以为自己只是想“加个上限”
- 实际上调度请求也被一起抬高了

### 坑 2：把所有服务都配成 `request = limit`

这会让所有服务都更像 Guaranteed。

优点是：

- 更稳

缺点是：

- 突发空间少
- 成本更高
- 对很多普通 API 服务来说不一定划算

### 坑 3：CPU limit 配得过小，却拿延迟问题去怪应用

很多时候业务逻辑没变，真正变的是：

- 高峰期开始被持续限流

### 坑 4：把 `OOMKilled` 当成“节点内存不够”

它更常见的第一责任边界仍然是：

- 容器自己的 memory limit

### 坑 5：忽略 memory-backed `emptyDir`

这类问题很隐蔽，因为很多人只盯应用堆内存，不看：

- tmpfs
- 临时文件
- 缓冲区

## 9. 一套更稳的资源配置骨架

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
          volumeMounts:
            - name: cache
              mountPath: /tmp/cache
      volumes:
        - name: cache
          emptyDir:
            medium: Memory
            sizeLimit: 128Mi
```

这段配置表达的是：

- 调度时至少按 `500m / 512Mi` 算
- CPU 允许有一定突发，但上限到 1 core
- 内存打到 1Gi 就会进入危险区
- memory-backed `emptyDir` 也明确收上限

## 10. 真正排障时，建议按这条顺序看

如果线上出现“资源相关抖动”，建议按这条顺序排：

1. 先分现象是 `Pending`、CPU 变慢、`OOMKilled`，还是 `Evicted`
2. 如果已经调度成功但只是慢，优先怀疑 CPU throttling，而不是先怀疑调度器
3. 如果是 `OOMKilled`，优先回看 memory limit、应用峰值和 `emptyDir` 内存占用
4. 如果是 `Evicted`，回到节点整体压力、QoS 和 requests 失真问题
5. 如果是 HPA 效果差，再把这条线接回 [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)，继续看 requests 是否把判断带偏

## 11. 面试里怎么把这题答顺

如果面试官问：

> requests 和 limits 到底怎么影响运行？为什么 CPU 超限和内存超限表现不一样？

可以这样答：

> 我会先把调度和运行时拆开。  
> `requests` 首先决定调度时节点能不能放下 Pod，同时在 CPU 争用时也更像资源权重；  
> `limits` 才是运行时硬边界，kubelet 会把这些边界交给 runtime，由 Linux cgroups 真正施加限制。  
> CPU 是可压缩资源，所以超 limit 更常见的是被 throttling，表现为延迟升高但不一定重启；  
> 内存不是可压缩资源，超 limit 更常见的是触发 OOM，容器会被杀掉并出现 `OOMKilled`；  
> 而 QoS 则决定节点压力下谁更容易先被驱逐，所以它更像资源竞争里的受保护程度，不是性能档位。  

## 12. 最后记住这句话

> `requests` 解决“先按多大给你排位”，`limits` 解决“你最多能冲到多高”，CPU 超限更像被压慢，内存超限更像被打死；如果不把调度、运行时和 QoS 三层拆开，资源问题一定会越看越乱。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
