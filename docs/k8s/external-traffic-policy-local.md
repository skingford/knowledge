---
title: externalTrafficPolicy Local 实战与边界
description: 深入整理 Kubernetes 中 externalTrafficPolicy 的 Cluster 与 Local 差异、源地址保留机制、副作用、健康检查、滚动发布与适用边界。
---

# externalTrafficPolicy Local 实战与边界

很多团队第一次接触 `externalTrafficPolicy: Local`，通常是因为一个很实际的需求：

- 后端必须看到真实客户端 IP
- 入口侧要做按 IP 的风控、限流或审计
- 第三方回调或安全设备要求保留源地址

于是很多人会直接把它打开。但这类配置不是“性能优化开关”，而是一个典型的**流量分布换源地址可见性**的权衡项。

<K8sDiagram kind="external-traffic-policy" />

## 1. 先回答它到底解决什么问题

`externalTrafficPolicy` 只和**外部进入集群的流量**有关，重点影响的是：

- `NodePort`
- `LoadBalancer`
- 某些场景下的 `externalIPs`

它不解决：

- Pod 出站固定出口 IP
- 集群内 Service 到 Service 的访问策略
- Ingress 的七层头透传问题本身

一句话定义：

> `externalTrafficPolicy` 决定外部流量到达节点后，是不是允许再跨节点转发到其他 Pod。`Cluster` 更关注流量均衡，`Local` 更关注源地址保留。

## 2. `Cluster` 和 `Local` 的核心差别

### 2.1 `Cluster`

默认值通常是 `Cluster`。

它的行为可以概括成：

- 外部流量打到任意一个节点
- 该节点即使本机没有后端 Pod，也可以继续把流量转发到其他节点上的 Pod
- 对调用方来说，更容易做到“打到任意节点都能被服务住”

优点：

- 更容易均衡流量
- 对 Pod 分布要求低
- 滚动发布、扩缩容期间更平滑

代价：

- 经过额外转发和可能的 SNAT 后，业务 Pod 往往看不到最初客户端的真实源地址

### 2.2 `Local`

`Local` 的核心约束是：

- 外部流量打到某个节点后
- 只有该节点本地有后端 Pod 时，流量才应该继续被接收和处理
- 没有本地 Pod 的节点，不应该替你跨节点转发这类外部流量

优点：

- 更容易保留真实客户端源地址
- 后端按 IP 做审计、风控、限流时更直接

代价：

- 对 Pod 分布和节点健康更敏感
- 节点上没本地 Pod，就不该接流量
- 如果外部 LB 还在往这类节点打流量，就会出现丢流量、探针失败或流量不均

## 3. 为什么 `Local` 更容易保留真实客户端 IP

核心原因不是它“做了什么增强”，而是它**少做了一步跨节点转发**。

当外部流量进入集群时：

- 如果节点再把流量转给别的节点上的 Pod
- 中间通常会经历额外的 NAT 或转发链路
- 后端看到的源地址可能就变成了中间节点地址，而不再是原始客户端地址

而 `Local` 的约束是：

- 本地接流量，本地落 Pod
- 少一层跨节点转发
- 更容易保住最初来源

但这并不等于：

- “只要开了 `Local` 就 100% 拿到真实 IP”

你最终能不能拿到，还取决于：

- 云负载均衡的实现方式
- 有没有 L7 代理层
- 代理层是否透传 `X-Forwarded-For` / `X-Real-IP`
- 是否启用了 Proxy Protocol

所以更准确的说法是：

> `Local` 是保留真实客户端地址的常用前提条件之一，但不是唯一条件，也不是充分条件。

## 4. 最典型的适用场景

### 场景 1：L4 入口，后端必须按真实源地址做风控

例如：

- IP 级别黑白名单
- 按源地址限流
- 安全审计必须记录客户端真实来源

这时 `Local` 很常见。

### 场景 2：不想完全依赖 L7 代理头

如果你不是只跑 HTTP，而是跑：

- TCP 协议
- 自定义二进制协议
- gRPC / 四层代理场景

那单纯靠 `X-Forwarded-For` 并不总是适用，`Local` 的价值就会更大。

### 场景 3：节点和业务实例分布本来就能严格控制

例如：

- 入口控制器本身就是 DaemonSet
- 每个接流量节点都确保至少有一个本地 Pod
- 你能控制 LB 只把流量打给健康且有本地 Pod 的节点

这种情况下 `Local` 会比较稳。

## 5. 最容易踩坑的副作用

### 5.1 流量不均衡

如果 10 个 Pod 只分布在 2 台节点上，但外部 LB 把流量分配到 6 台节点，你会得到：

- 有本地 Pod 的节点压力很大
- 没本地 Pod 的节点理论上不该接流量
- 最终表现为流量倾斜、不均衡甚至部分请求失败

### 5.2 滚动发布期间短暂黑洞

当你做滚动更新时，如果某个节点上的本地 Pod 正在重建：

- 该节点临时没有本地后端
- 但外部 LB 还没来得及把它摘掉
- 这段窗口里请求就可能失败

所以 `Local` 对以下配置特别敏感：

- readiness probe
- preStop hook
- terminationGracePeriodSeconds
- LB 健康检查收敛速度

### 5.3 HPA 和调度打散后，入口稳定性变差

HPA 只关心副本数，不保证每台接流量节点上都有本地 Pod。

如果调度结果是：

- 新副本全堆在少量节点
- 某些节点没有 Pod

而 LB 仍认为这些节点可接流量，就会出现入口不稳定。

### 5.4 健康检查变复杂

`Local` 模式下，外部 LB 需要更精确判断：

- 哪些节点可以接流量
- 哪些节点虽然活着，但没有本地后端，不该接流量

很多云实现会通过专门的健康检查逻辑或 `healthCheckNodePort` 来辅助完成这件事。

你不一定需要记住所有云厂商细节，但要记住这个原理：

> `Local` 不是让所有健康节点都接流量，而是让“有本地后端的健康节点”接流量。

## 6. 什么情况下应该优先保留 `Cluster`

很多业务并不适合默认上 `Local`。

以下情况通常更适合继续用 `Cluster`：

- 你只是需要服务可用，不强依赖真实客户端 IP
- 入口本身已经有 L7 代理头透传，应用可以安全读取 `X-Forwarded-For`
- 业务副本分布很动态，节点和 Pod 的映射关系不稳定
- 你更看重入口层的平滑、均衡和弹性，而不是源地址可见性

一句话：

> 如果真实源地址不是刚需，默认保留 `Cluster` 通常更稳。

## 7. 一个最常见的配置示例

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-public
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local
  selector:
    app: api
  ports:
    - name: https
      port: 443
      targetPort: 8443
```

这个配置表达的不是“固定公网 IP”，而是：

- 外部流量进来后
- 尽量只交给本地有后端 Pod 的节点处理
- 从而减少跨节点转发，更利于保留源地址

## 8. 工程上怎么把它用稳

如果你决定使用 `Local`，通常还要配合这些策略：

### 8.1 确保接流量节点上有本地 Pod

常见思路：

- 入口类服务用 DaemonSet
- 或通过亲和性 / 反亲和性把副本更均匀打散到节点
- 或控制 LB 只面向一小组稳定节点

如果你想单独把入口类 DaemonSet 为什么更容易配合 `Local`，以及它在 `cordon/drain` 下的特殊边界讲透，继续看 [DaemonSet 节点驻留与更新边界实战](./daemonset-node-resident-and-update-boundaries.md)。

### 8.2 把 readiness 和摘流量时序调顺

要点是：

- Pod 不健康要尽快从流量面摘掉
- Pod 终止前要先让 LB 停止再发新流量
- 业务应用要支持优雅关闭

### 8.3 结合 PodDisruptionBudget

否则你可能在：

- 节点维护
- 自动驱逐
- 滚动升级

时把某些关键节点上的本地后端一下子都清空。

### 8.4 配套可观测性

至少要能看到：

- 哪些节点正在接流量
- 哪些节点没有本地后端
- 入口层 4xx / 5xx / reset 是否在某些节点集中出现
- 发布期间健康检查和摘流量的收敛速度

## 9. 一套面试答法

如果面试官问：

> `externalTrafficPolicy: Local` 有什么用？为什么能保留真实客户端 IP？

你可以这样答：

> 它控制的是外部流量进入 NodePort 或 LoadBalancer Service 后，节点是否允许再跨节点转发到别的节点上的 Pod。  
> 默认 `Cluster` 更偏向可用性和均衡，打到任意节点都能被转发处理；`Local` 则要求节点本地必须有后端 Pod，尽量不跨节点转发，所以更容易保留真实客户端源地址。  
> 但代价是对 Pod 分布、健康检查和滚动发布更敏感。如果节点上没有本地 Pod，理论上就不该接流量。  
> 所以它不是默认更高级，而是在“入口均衡性”和“源地址可见性”之间做权衡。  
> 如果业务只是普通 HTTP 服务，而且已经能通过可信代理头拿到真实 IP，很多时候继续用 `Cluster` 会更稳。

## 10. 最后记住这张表

| 问题 | `Cluster` | `Local` |
| --- | --- | --- |
| 是否允许跨节点转发 | 是 | 否，或尽量不允许 |
| 是否更容易保留真实客户端 IP | 否 | 是 |
| 对流量均衡是否更友好 | 是 | 否 |
| 对 Pod 分布和健康检查是否更敏感 | 否 | 是 |
| 默认更适合大多数普通服务吗 | 是 | 不一定 |

## 关联阅读

- [零停机发布链路实战](./zero-downtime-rollout.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [DaemonSet 节点驻留与更新边界实战](./daemonset-node-resident-and-update-boundaries.md)
- [K8s 必备问题清单](./essential-questions.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
