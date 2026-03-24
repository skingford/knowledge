---
title: 零停机发布链路实战
description: 系统讲清 Kubernetes 中 readiness、preStop、SIGTERM、terminationGracePeriodSeconds、PDB 如何协同实现真正可用的零停机发布。
---

# 零停机发布链路实战

很多团队以为只要 Deployment 开了滚动更新，发布天然就是零停机。

这基本不成立。

真实线上里，发布时出现短暂 502、连接重置、少量超时，通常都不是 Deployment “不会滚动”，而是下面几件事没有配合好：

- 新 Pod 还没准备好就接流量
- 旧 Pod 还没摘流量就开始退出
- 应用收到 `SIGTERM` 后立即停进程
- `terminationGracePeriodSeconds` 小于真实收尾时间
- 节点维护或驱逐时，副本被同时打掉太多

真正的零停机，是一条完整链路。

<K8sDiagram kind="zero-downtime-rollout-chain" />

如果想把这里反复出现的 `EndpointSlice` 摘流量、`ready / serving / terminating` 状态和 Pod 终止时的后端收敛边界单独讲透，可以继续看 [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)。

如果想把这里反复出现的 `PDB`、`Eviction API`、`kubectl drain` 和维护窗口预算边界单独讲透，可以继续看 [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)。

## 1. 先回答零停机到底依赖什么

如果只用一句话说：

> 新 Pod 要在真正准备好之后再进流量，旧 Pod 要在彻底摘流量之后再退出，同时发布和驱逐过程里还要始终保住足够副本。

这背后至少有五个关键点：

- `Deployment` 的滚动更新策略
- `readinessProbe` 和 `EndpointSlice` 收敛
- `preStop` 和应用内部 graceful shutdown
- `terminationGracePeriodSeconds`
- `PodDisruptionBudget`

它们分别管的不是一回事。

## 2. Deployment 只负责“节奏”，不负责“无损”

Deployment 里的这几个参数很关键：

- `maxSurge`
- `maxUnavailable`

它们决定的是：

- 一次可以多创建多少新 Pod
- 更新期间最多允许多少旧 Pod 不可用

这能控制发布节奏，但它并不能保证：

- 新 Pod 一定真的能接业务流量
- 旧 Pod 一定已经处理完存量请求

所以标准认知应该是：

> Deployment 解决的是“怎么逐步换版本”，不是“为什么一定零停机”。

## 3. 新 Pod 什么时候才能接流量

真正决定“新 Pod 能不能进流量”的，通常不是 Pod 进入 `Running`，而是 `readinessProbe`。

你必须分清：

- `Running`：容器进程启动了
- `Ready`：它可以安全接业务流量了

如果 readiness 配得过早，典型后果就是：

- 进程刚起来但缓存、连接池、配置还没热好
- Service 已经把流量打过去
- 首批请求就开始超时或失败

所以 readiness 的标准不是“进程活着”，而是：

- 关键依赖准备完成
- 服务自身已经能处理真实请求
- 启动期的预热已经结束

## 4. 旧 Pod 为什么不能一收到 SIGTERM 就立刻退出

因为 K8s 的流量摘除和进程退出不是同一个瞬间完成的。

常见链路是：

1. Pod 被标记删除
2. `preStop` 执行
3. K8s 发送 `SIGTERM`
4. `EndpointSlice` / Service / LB 收敛，把旧 Pod 从流量面摘掉
5. 应用处理完存量请求后退出

如果你在第 3 步一收到 `SIGTERM` 就立刻关进程，问题就来了：

- 外部流量面可能还没来得及完全摘掉它
- 这时仍然可能有新请求打进来
- 请求会直接收到连接重置或 502

<K8sDiagram kind="pod-termination-timeline" />

所以 `preStop` 的价值，本质上是给流量面一点收敛时间，而不是“优雅关闭本身”。

## 5. `preStop`、`SIGTERM`、grace period 各自管什么

### 5.1 `preStop`

常见作用：

- 先留一点时间给 Service / LB 摘流量
- 或先通知应用进入 drain 模式

它不是用来替代应用 graceful shutdown 的。

### 5.2 `SIGTERM`

这是应用真正开始“停止接新请求、处理存量请求、释放资源”的信号。

如果应用没有正确处理 `SIGTERM`，那 K8s 配再多 YAML 也没用。

### 5.3 `terminationGracePeriodSeconds`

这表示：

- K8s 愿意等你多久完成优雅退出

如果业务实际收尾需要 25 秒，但你只给 10 秒，最后仍然会被强杀。

一个简单原则：

- 应用 graceful shutdown 的最长耗时
- 必须小于 `terminationGracePeriodSeconds`
- 同时还要预留一点余量给 `preStop`

## 6. `PDB` 为什么也属于零停机链路

很多人只在滚动更新时谈零停机，但生产里的可用性下降不止发生在发布时。

例如这些场景也会影响副本数：

- 节点升级
- 节点排空
- 集群维护
- 某些自愿驱逐

这时 `PodDisruptionBudget` 的作用是：

- 限制自愿中断时，最多能同时少掉多少副本

它不能解决：

- 节点突然宕机
- 应用自己崩溃

但它能避免：

- 维护窗口里把关键服务一次性清空太多副本

所以它属于“发布和运维时的可用性兜底”，不是探针替代品。

## 7. 一套比较稳的配置骨架

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
      maxUnavailable: 0
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
          image: my-api:v2
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]
---
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

这段配置表达的是：

- 一次只多起 1 个新 Pod
- 更新期间不允许出现 0 可用窗口
- 新 Pod 必须通过 readiness 才能进流量
- 旧 Pod 下线前先等一小段时间给流量面收敛
- 自愿驱逐时至少保住 2 个副本

## 8. 最容易踩的坑

### 坑 1：readiness 只是端口探活

如果 `/readyz` 只代表“进程活着”，那它就不是真正的 readiness。

### 坑 2：没有 `preStop`

应用优雅退出做得再好，如果流量面还没摘干净，仍然会有尾部错误。

### 坑 3：grace period 太短

这是最隐蔽也最常见的问题之一。

日志里你以为应用在做 graceful shutdown，实际上还没做完就被 `SIGKILL` 了。

### 坑 4：`maxUnavailable` 配得太激进

副本本来就不多时，这很容易把更新窗口压成真实可用性风险。

### 坑 5：只看 Deployment，不看外部 LB 收敛

特别是入口侧有云 LB、Ingress、网关时，外部健康检查收敛速度也会影响尾部请求。

### 坑 6：把 `PDB` 当成万能高可用工具

它只能约束自愿中断，不能对抗突发故障。

## 9. 一个实用排查顺序

如果你在发布后看到少量 502 / reset / timeout，建议优先按这个顺序查：

1. 新 Pod 的 readiness 是否过早成功
2. 旧 Pod 是否配置了 `preStop`
3. 应用是否真正处理了 `SIGTERM`
4. `terminationGracePeriodSeconds` 是否小于真实关闭耗时
5. `maxSurge / maxUnavailable` 是否过于激进
6. 外部 LB / Ingress 健康检查是否比 Pod 摘流量更慢

经验上，前 4 步能覆盖掉大多数发布期闪断问题。

## 10. 一套面试答法

如果面试官问：

> Kubernetes 里怎么实现真正的零停机发布？

你可以这样答：

> 关键不是只开 RollingUpdate，而是让新旧 Pod 的流量切换和应用退出时序配对。  
> 新 Pod 侧要靠 readiness 保证“真准备好”之后才进 Service 后端池；  
> 旧 Pod 侧要先通过 preStop 给流量面收敛时间，再由应用处理 SIGTERM 做 graceful shutdown；  
> 同时 terminationGracePeriodSeconds 要大于真实收尾时间，避免还没处理完就被强杀；  
> 如果还涉及节点维护或驱逐，再配 PodDisruptionBudget 保证至少保住足够副本。  
> 所以真正的零停机是一条链路，不是 Deployment 的单个参数。  

## 11. 最后记住这句话

> 零停机发布的核心，不是“新版本滚起来了”，而是“新版本进流量之前真的准备好了，旧版本退流量之后才真正退出”。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
