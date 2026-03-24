---
title: 调度与驱逐链路实战
description: 系统讲清 Kubernetes 中 requests、limits、QoS、PriorityClass、taints/tolerations、OOMKilled、Evicted 如何串成一条调度与驱逐链路。
---

# 调度与驱逐链路实战

很多团队在 K8s 里看到 Pod 出问题，第一反应都是一句话：

- 资源不够了

但这句话太粗了。

至少有三种常见现象，根本不是一回事：

- Pod 一直起不来，状态是 `Pending`
- Pod 跑着跑着挂了，状态里写 `OOMKilled`
- Pod 不是自己挂的，而是被标记成 `Evicted`

如果这三类问题不先拆开，后面的调优很容易全部做反。

<K8sDiagram kind="scheduling-decision-chain" />

## 1. 先拆三类现象：Pending、OOMKilled、Evicted

最实用的第一步，不是上来背 QoS，而是先区分故障发生在哪个阶段。

| 现象 | 发生阶段 | 最先怀疑什么 |
| --- | --- | --- |
| `Pending` | 调度前 | requests 太大、约束太苛刻、PVC/污点/亲和性不满足 |
| `OOMKilled` | 运行中 | 容器内存超 `limits`，进程被杀 |
| `Evicted` | 节点压力时 | 节点内存或磁盘压力，kubelet 主动驱逐 |

一句话记忆：

> `Pending` 是还没找到地方住，`OOMKilled` 是住进去了但自己把房子撑爆了，`Evicted` 是房东发现整栋楼快扛不住了先把你请出去。

## 2. 调度器到底先看什么

K8s 调度器最先关心的，不是你的 Pod 峰值可能跑多大，而是：

- 你至少要占多少资源
- 你允许被放到哪些节点
- 这些节点愿不愿意接你

### 2.1 `requests` 决定调度，不是 `limits`

这是最常见的误区之一。

- `requests`：调度时保底要给你的资源
- `limits`：运行时你最多能用到多少

调度器会主要根据 `requests` 判断：

- 这台节点还有没有空间放下你

所以如果一个 Pod：

- `requests.memory=4Gi`
- `limits.memory=8Gi`

那调度器优先看的还是 4Gi，不是 8Gi。

### 2.2 为什么没配 `requests` 也会出事

如果根本不配 `requests`，常见后果是：

- Pod 看上去很好调度
- 实际节点资源被过度挤压
- 运行期更容易出现节点压力、抖动和驱逐

所以“没配 requests 更灵活”通常不是什么优点，而是在透支调度可预测性。

## 3. 调度约束是怎么一层层加上去的

调度不是单看资源，还会叠加很多约束。

### 3.1 `nodeSelector`

这是最直接的硬约束：

- 只允许去指定标签节点

简单，但表达力有限。

### 3.2 `nodeAffinity`

这是更灵活的节点亲和机制，能表达：

- 必须满足
- 尽量满足

如果 Pod 一直 `Pending`，而你最近刚加了节点亲和，优先怀疑这里。

### 3.3 `taints / tolerations`

这套机制表达的是：

- 节点默认不欢迎你
- 除非你明确声明自己可以容忍

它不是“我想去哪都行”的筛选器，而更像“节点侧的拒绝策略”。

典型场景：

- GPU 节点
- 出口节点
- 专用中间件节点
- 系统保留节点

### 3.4 `PriorityClass`

这个机制不是决定“调度得更快”，而是决定：

- 资源紧张时谁更重要
- 必要时是否值得为它腾位置

所以优先级高，不等于一定能调度成功；它只是更有机会在竞争里不吃亏。

## 4. 抢占和优先级到底解决什么

当高优先级 Pod 进来，而现有资源又不够时，调度器可能考虑：

- 是否驱逐一些更低优先级 Pod
- 为高优先级 Pod 腾出位置

这就是 preemption 的核心价值。

但要记住几个边界：

- 不是所有情况都会触发抢占
- 抢占也不能绕过节点选择、亲和性、污点等硬约束
- 低优先级 Pod 被抢掉后，业务可能真的抖动

所以 `PriorityClass` 不该乱配。否则你只是把“资源不足”变成“谁先受伤”的问题。

如果想把这里的 `PriorityClass`、scheduler preemption、`nominatedNodeName`、`preemptionPolicy: Never`，以及它和 `PDB / drain / 节点压力驱逐` 的边界单独讲透，可以继续看 [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)。

## 5. QoS 为什么和驱逐关系这么大

QoS 不是你手工指定的字段，而是 Pod 根据资源配置推导出的类别。

<K8sDiagram kind="resource-pressure-outcomes" />

### 5.1 Guaranteed

通常要求每个容器的：

- CPU `requests = limits`
- Memory `requests = limits`

这种 Pod 在节点压力下通常最稳。

### 5.2 Burstable

最常见的一类。

特点是：

- 配了 requests 或 limits
- 但不完全相等

这类 Pod 有一定保障，但没有 Guaranteed 那么硬。

### 5.3 BestEffort

什么都没配。

这类 Pod：

- 调度看起来最容易
- 真到节点压力时，通常也最先吃亏

标准理解：

> QoS 不是性能档位，而是资源竞争和驱逐压力下的“受保护程度”。

## 6. `OOMKilled` 和 `Evicted` 为什么一定要分清

很多线上复盘把这两个词混着说，这是不对的。

### 6.1 `OOMKilled`

通常表示：

- 容器运行中内存用量冲过了 `limits`
- Linux 内核把进程杀掉

这更像：

- 单 Pod / 单容器自己的资源边界没管住

优先排查：

- 内存 limit 是否太小
- 应用是否有内存泄漏
- GC、缓存、批处理峰值是否估错

### 6.2 `Evicted`

通常表示：

- 节点整体内存、磁盘或 inode 压力过高
- kubelet 为保护节点，主动驱逐一部分 Pod

这更像：

- 节点层面的自我保护

优先排查：

- 节点是否整体超卖
- BestEffort / Burstable Pod 是否过多
- requests 是否长期低估
- 临时文件、镜像、日志是否把磁盘顶满

## 7. 一个比较稳的资源配置骨架

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
      priorityClassName: business-critical
      tolerations:
        - key: "workload"
          operator: "Equal"
          value: "business"
          effect: "NoSchedule"
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-pool
                    operator: In
                    values:
                      - biz
      containers:
        - name: api
          image: my-api:v1
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
```

这段配置表达的是：

- 调度时至少给我半核和 512Mi
- 运行时最多用到 1 核和 1Gi
- 我只能去 `biz` 节点池
- 只有容忍了指定污点，才允许进对应节点
- 业务优先级高于普通批处理

## 8. 最容易踩的坑

### 坑 1：只配 limits，不配 requests

这样调度看上去轻松，运行时却可能把节点挤爆。

### 坑 2：给所有服务都上高优先级

最后等于谁都不高，抢占策略也失去意义。

### 坑 3：把 `Pending` 当成节点坏了

很多 `Pending` 根因其实是：

- requests 太大
- 亲和性过死
- 忘了 toleration
- PVC 根本没绑定好

### 坑 4：把 `OOMKilled` 当成节点驱逐

这两者的修法完全不同。

### 坑 5：BestEffort 跑核心服务

这种配置在压力下往往最先出事。

### 坑 6：只盯 CPU，不看内存和磁盘

生产里更容易出大事的，通常是内存和磁盘压力。

## 9. 一个实用排查顺序

如果线上出现 Pod 起不来或频繁被杀，建议优先这样查：

1. 先看状态到底是 `Pending`、`OOMKilled` 还是 `Evicted`
2. 如果是 `Pending`，先查 `kubectl describe pod` 里的调度事件
3. 如果是 `OOMKilled`，先回看容器内存 limit 和应用峰值
4. 如果是 `Evicted`，先看节点压力和同节点其他 Pod 的资源画像
5. 再查 QoS、PriorityClass、污点容忍和亲和性是否设计失衡

经验上，第一步分型做对，后面能少走很多弯路。

## 10. 一套面试答法

如果面试官问：

> Kubernetes 里 Pod 为什么会 Pending、OOMKilled 或 Evicted？你怎么区分？

你可以这样答：

> 我会先按阶段分。  
> `Pending` 说明 Pod 还没调度成功，优先看 requests、节点约束、污点容忍、PVC 和优先级；  
> `OOMKilled` 说明 Pod 已经跑起来了，但容器运行时把内存 limit 打穿了，这是容器级内存边界问题；  
> `Evicted` 则通常是节点整体资源压力过高，kubelet 为保护节点主动驱逐 Pod，这时要结合 QoS、requests 是否低估以及节点压力看。  
> 所以这三类问题虽然都和资源有关，但发生阶段、责任边界和排查方法都不一样。  

## 11. 最后记住这句话

> K8s 里的资源问题，最怕混着看。先分清它是调度不上、自己超限，还是节点在自保，再谈怎么改 requests、limits、QoS 和调度策略。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
