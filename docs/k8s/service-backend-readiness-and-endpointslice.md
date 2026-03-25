---
title: EndpointSlice、Ready 与服务后端收敛边界实战
description: 系统讲清 Kubernetes 中 Service selector、EndpointSlice controller、ready/serving/terminating、publishNotReadyAddresses、滚动发布摘流量、一个 Service 对应多个 EndpointSlice，以及为什么 Pod Running 了也不一定已经进后端池。
---

# EndpointSlice、Ready 与服务后端收敛边界实战

很多团队平时会说：

- Service 后面挂着一组 Pod

这句话不算错，但通常还不够精确。

线上和面试里真正容易被追问的是这些：

- 为什么 Pod 明明是 `Running`，Service 后面却还是没后端
- 为什么 readiness 一失败，流量就马上少了
- 为什么滚动发布时旧 Pod 还在 `Terminating`，但 EndpointSlice 里状态已经变了
- `ready`、`serving`、`terminating` 三个条件到底怎么区分
- 一个 Service 为什么有时会对应多个 EndpointSlice，而不是一个
- 为什么很多网络问题，第一反应应该先看 EndpointSlice，而不是先抓包

这条线真正要讲清的是：

> Service 并不是直接把流量发给 Pod；真正决定“当前后端集合是谁”的上游对象，通常是 EndpointSlice。

<K8sDiagram kind="endpointslice-reconcile-chain" />

## 1. 先回答：EndpointSlice 到底解决什么问题

最实用的理解方式是：

- Service 负责定义稳定入口
- EndpointSlice 负责记录当前可用后端集合
- kube-proxy、Ingress Controller、Gateway Controller、各种流量代理再去消费这份后端集合

也就是说，Service 更像“壳”：

- 有 selector
- 有端口定义
- 有 VIP 或暴露方式

但它本身并不直接保存完整后端明细。

真正的后端信息会收敛成：

- 一个或多个 EndpointSlice 对象

这也是为什么 Kubernetes 官方文档会把 EndpointSlice 视为：

- Service 后端网络端点的主要 API
- 比旧 `Endpoints` 更适合大规模后端收敛的机制

## 2. 一次后端收敛链路到底怎么跑

最常见的链路可以拆成这样：

1. 用户创建一个带 selector 的 Service
2. 控制面根据 selector 找到匹配 Pod
3. 结合 Pod 的 readiness、删除状态、端口等信息
4. endpoint slice controller 生成或更新对应的 EndpointSlice
5. kube-proxy、入口控制器、其他消费者 watch 到 EndpointSlice 变化
6. 各自更新转发表、上游配置或连接状态
7. 流量才真正开始打到这些当前可用后端

一句话说透：

> Pod 有没有起来，是一回事；Pod 有没有被收敛进后端池，是另一回事；两者中间隔着的，就是 EndpointSlice 这层控制面对象。

## 3. 为什么 Pod `Running` 了，还是可能没进后端池

这类问题最容易在生产上误判。

因为很多人只看：

- `kubectl get pod`

但 Service 真正关心的是：

- 这个 Pod 现在是不是一个可用后端

默认场景下，这个判断最核心还是：

- Pod 是否 `Ready`

也就是说：

- `Running` 只说明进程起来了
- `Ready` 才更接近“可以作为服务后端”

所以常见现场会是：

- Pod 进程已经启动
- Pod phase 是 `Running`
- 但 readiness 还没通过
- EndpointSlice 里这个 endpoint 仍然不算可接正常流量

这也是为什么很多“网络不通”问题，本质上并不是：

- CNI 坏了

而是：

- 后端根本没进池

## 4. `ready`、`serving`、`terminating` 到底怎么区分

这是 EndpointSlice 最值得单独拆的边界。

Kubernetes 官方 EndpointSlice 文档现在明确给了三组 endpoint conditions：

- `ready`
- `serving`
- `terminating`

<K8sDiagram kind="endpoint-conditions-boundary-map" />

### 4.1 `ready`

最稳的理解是：

- 面向常规流量的“可用后端”快捷判断

官方文档的关键语义是：

- `ready` 基本可以理解成 `serving` 且 `not terminating`
- 但如果 Service 开了 `publishNotReadyAddresses=true`，那它会例外地始终是 `true`

所以大多数默认场景里，`ready` 最接近：

- 现在能不能作为普通流量后端

### 4.2 `serving`

它更像：

- 这个 endpoint 当前是不是还在真正处理响应

它和 `ready` 很像，但加它出来的目的，就是为了不打破老语义。

因为 Kubernetes 为了兼容性，终止中的 endpoint：

- `ready` 会被置成 `false`

这样传统消费者不会再把终止中的 Pod 当成普通后端。

但如果你在做：

- 更精细的连接摘流量
- termination draining
- 发布期尾部连接处理

就要看：

- `serving`

### 4.3 `terminating`

这个条件表达的是：

- endpoint 对应的 Pod 已经进入终止过程

对 Pod 来说，通常就是：

- 已经有 `deletionTimestamp`

但注意：

- 终止中不等于已经彻底退出
- 终止中也不等于一定完全不能处理现有连接

所以这三个条件不能混成一句：

| 条件 | 你该怎么理解 |
| --- | --- |
| `ready` | 常规流量是否应该把它当成可用后端 |
| `serving` | 它现在是不是还在实际提供响应 |
| `terminating` | 它是不是已经进入删除 / 终止过程 |

## 5. 为什么终止中的 Pod 在 EndpointSlice 里不会立刻完全消失

这是发布和摘流量里最容易答浅的一层。

Kubernetes 官方 Pod 生命周期和终止流教程都明确说明：

- Pod 开始优雅终止时
- 控制面不会立刻把它从 EndpointSlice 完全抹掉
- 而是先暴露出终止中的状态

典型表现是：

- `terminating=true`
- `ready=false`
- `serving` 可能仍然是 `true`

这背后的设计目的很现实：

- 让负载均衡器、代理、网关有机会做连接摘流量
- 不要在终止一开始就把状态信息全丢掉

更进一步，官方 EndpointSlice 文档还强调：

- Service 代理通常会忽略 terminating endpoints
- 但如果所有可用 endpoint 都处于 terminating，仍可能把流量路由给同时 `serving` 且 `terminating` 的 endpoint

这也是为什么滚动发布这题不能只讲：

- readiness
- `preStop`
- `SIGTERM`

还要补一句：

- EndpointSlice 的后端状态也在同步变化

## 6. `publishNotReadyAddresses` 为什么是一个危险但必要的例外

这是很多团队不小心踩进去的配置。

它表达的是：

- 即使 Pod 不 Ready，也把地址发布出去

这个配置最常见的合理场景是：

- 某些需要早期发现成员地址的组件
- 例如配合 Headless Service 做成员发现

但如果你把它用于普通无状态服务，很容易带来：

- 还没准备好的 Pod 被提前暴露
- 调用方误以为这些后端已经可用

所以这条边界一定要讲清：

> `publishNotReadyAddresses` 是有意打破“Ready 才进池”默认语义的例外配置，不是普通业务服务的默认优化手段。

## 7. 为什么一个 Service 不一定只有一个 EndpointSlice

这是另一个非常高频的认知误区。

很多人默认觉得：

- 一个 Service 对一个 EndpointSlice

这在真实集群里通常不成立。

Kubernetes 官方文档明确说：

- EndpointSlice 是“切片”
- 后端多了之后，一个 Service 会拆成多个 EndpointSlice

这样做的核心价值是：

- 避免单对象过大
- 提高大规模后端变化时的更新效率

所以更稳的口径是：

- 一个 Service 对应一组 EndpointSlice
- 消费方需要把这组切片合并起来，才能得到完整后端集合

这也是为什么你查某个 Service 的 EndpointSlice 时，最好用：

```bash
kubectl get endpointslice -n <namespace> \
  -l kubernetes.io/service-name=<service-name>
```

而不是先假设：

- 它只有一个固定名字的 EndpointSlice

## 8. EndpointSlice 还有一个容易被忽略的高级边界

大多数时候，EndpointSlice 都是控制面自动生成的。

官方文档给出的识别方式很重要：

- `kubernetes.io/service-name` label 用来标记它属于哪个 Service
- `endpointslice.kubernetes.io/managed-by` 用来标记是谁管理它

这意味着：

- 不是所有 EndpointSlice 都一定是 endpoint slice controller 生成的
- 某些 service mesh、网关、或者无 selector Service 的场景，也可能自己管理 EndpointSlice

所以标准口径不要答死成：

- EndpointSlice 只会由 Service selector 自动生成

更准确的说法是：

- 大多数带 selector 的 Service，EndpointSlice 由控制面自动维护
- 但 EndpointSlice 这个 API 自身也允许被其他控制器使用

## 9. 最常见的坑

### 坑 1：只看 Pod `Running`，不看它有没有进 EndpointSlice

这会把“后端没进池”误判成“网络不通”。

### 坑 2：把 `ready` 和 `serving` 当成同义词

默认时候它们看起来很像，但终止场景下差异就出来了。

### 坑 3：看到 terminating endpoint，就以为它已经完全不能处理连接

很多时候它只是不再该承接常规新流量，不代表现有连接已经完全消失。

### 坑 4：在普通业务服务上乱开 `publishNotReadyAddresses`

最后会把没准备好的 Pod 暴露给调用方。

### 坑 5：假设一个 Service 永远只对应一个 EndpointSlice

大规模后端或端口变化时，这个假设很容易直接错。

### 坑 6：排障一上来就盯 `iptables` / `IPVS`

如果 EndpointSlice 本身就没收敛对，后面看到的只是错的下游结果。

## 10. 排障时建议按这条顺序看

如果你怀疑是“服务没后端”或“发布时流量切换异常”，建议按这条顺序排：

1. 先看 Service selector 和 port 是否写对
2. 再用 `kubernetes.io/service-name=<service>` 把对应全部 EndpointSlice 查出来
3. 看 endpoint 地址是否齐全，再看 `ready / serving / terminating`
4. 再回到对应 Pod，看 readiness、删除状态、`preStop`、`SIGTERM`、grace period
5. 如果 EndpointSlice 已经正常，再看 kube-proxy、Ingress Controller、Gateway Controller 或外部 LB 的收敛
6. 最后才进入节点规则和抓包阶段

这条顺序的核心是：

- **先看控制面后端集合，再看节点数据面**

## 11. 面试里怎么把这题答顺

如果面试官问：

> 为什么 Pod 明明 Running 了，Service 后面还是没流量？EndpointSlice 在这里起什么作用？

可以这样答：

> 我会先区分 Pod 运行状态和服务后端状态。  
> Pod `Running` 只说明容器进程起来了，不代表它已经作为后端对外提供服务；  
> Kubernetes 里真正记录当前后端集合的通常是 EndpointSlice，控制面会根据 Service selector、Pod readiness、删除状态等信息去更新它；  
> 所以如果 Pod 还没 Ready，或者已经进入 terminating，EndpointSlice 里的条件就会变化，kube-proxy 和入口控制器再根据这些变化更新流量转发；  
> 默认情况下，常规流量主要看 `ready`，而连接摘流量场景还要区分 `serving` 和 `terminating`，这也是为什么发布和网络排障很多时候都要先看 EndpointSlice，而不是只看 Pod Running。  

## 12. 最后记住这句话

> 在 Kubernetes 里，Service 是稳定入口，EndpointSlice 才是当前后端集合；只看 Pod 有没有 Running，不看 EndpointSlice 有没有收敛，很多问题一定会查偏。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
