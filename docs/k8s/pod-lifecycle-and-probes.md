---
title: Pod 生命周期与探针实战
description: 系统讲清 Kubernetes 中 Pod 的生命周期、Pod phase 与 STATUS 的区别，以及 startup、readiness、liveness probe 的职责边界与排障顺序。
---

# Pod 生命周期与探针实战

很多团队对 Pod 的理解，停留在“容器起了就是好了”。

这会直接导致几类典型问题：

- Pod 明明是 `Running`，为什么服务还是不可用
- `CrashLoopBackOff` 到底算 Pod 状态、容器状态，还是报错现象
- `livenessProbe`、`readinessProbe`、`startupProbe` 为什么总是配错
- 应用启动慢时，为什么越加探针越容易被自己打死
- 发布时为什么新 Pod 看起来起来了，但一接流量就报错

如果这些边界不拆开，后面讲滚动发布、优雅终止、服务摘流量都会混。

这篇先把 Pod 从“被创建”到“能接流量”再到“异常重启或退出”的链路讲清。  
零停机发布那篇讲的是新旧 Pod 切换时序，这篇更基础，重点是单个 Pod 自己的生命周期。

<K8sDiagram kind="pod-lifecycle-state-flow" />

## 1. 先分清三件事：Pod phase、容器状态、`kubectl get pod` 里的 STATUS

这是最容易答混的一点。

### 1.1 Pod phase

Pod phase 是 Pod 对象层面的粗粒度阶段，常见只有：

- `Pending`
- `Running`
- `Succeeded`
- `Failed`
- `Unknown`

它是“官方抽象阶段”，不是你平时看到的全部现场信息。

### 1.2 容器状态

容器层面常见状态是：

- `Waiting`
- `Running`
- `Terminated`

很多现场问题其实发生在容器层，而不是 Pod phase 层。

### 1.3 `kubectl get pod` 里的 STATUS

你平时看到的：

- `ContainerCreating`
- `CrashLoopBackOff`
- `ImagePullBackOff`
- `ErrImagePull`
- `Terminating`

这些很多都不是 Pod phase 本身，而是 CLI 汇总出来的更具体现场状态。

所以标准口径应该是：

> `Running` 不等于 Ready；`CrashLoopBackOff` 也不是 Pod phase，而更像容器反复失败重启后的现场表现。

## 2. 一个 Pod 真正从创建到可用，会经过哪些环节

<K8sDiagram kind="probe-gating-chain" />

最常见的主链路可以这样理解：

1. 用户提交 PodSpec
2. scheduler 给 Pod 选节点
3. kubelet 在节点上拉镜像、准备网络、挂载卷
4. 先执行 init containers
5. 再启动主容器
6. 如果配置了 `startupProbe`，先等应用完成启动期
7. 通过 `readinessProbe` 后，Pod 才会进入后端池接流量
8. 运行期间用 `livenessProbe` 持续判断容器是否已经卡死
9. 删除 Pod 时，再进入 `Terminating`

这里的 `Terminating` 只是删除开始后的现场状态，背后既可能是 `preStop / SIGTERM / grace period`，也可能叠加 finalizer、卷卸载或节点失联；如果想把这条删除边界单独讲透，要继续看 [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)。

这里最关键的一句是：

> Pod 真正“可用”，通常不是从 `Running` 开始算，而是从 readiness 通过开始算。

如果想继续把“readiness 通过以后，Service 后端集合怎么更新”“为什么 Pod `Running` 了也可能还没进池”“终止中的 endpoint 为什么还会保留一段时间”讲透，可以继续看 [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)。

## 3. 为什么 `Running` 了，业务还是可能不可用

因为 `Running` 只说明：

- 容器进程已经启动

但这不代表：

- 应用配置已经加载完成
- 数据库连接池已经建立完成
- 缓存已经预热完成
- HTTP 服务已经能稳定响应真实请求

很多线上事故都是这样来的：

- 进程刚起来就返回 `200`
- readiness 立刻成功
- Service 很快把流量切过去
- 应用内部还没真正准备好，首批请求超时或报错

所以 readiness 的标准应该是：

- 服务现在已经可以安全接业务流量

而不是：

- 进程还活着

## 4. 三种探针到底分别解决什么

### 4.1 `startupProbe`

它解决的是：

- 启动慢的应用，在启动阶段不要被过早判死

典型场景：

- Java 应用启动慢
- 需要做大量 warmup
- 首次加载模型、规则、缓存很重

最关键的机制是：

- `startupProbe` 成功之前，`livenessProbe` 和 `readinessProbe` 不会正式接管判断

所以它本质上是：

- 给“慢启动”加一个保护罩

### 4.2 `readinessProbe`

它解决的是：

- 这个 Pod 现在能不能接流量

失败的典型结果通常是：

- 从 Service / EndpointSlice 后端池里摘掉

它更关注：

- 流量接入资格

而不是：

- 是否要重启容器

### 4.3 `livenessProbe`

它解决的是：

- 进程是不是已经卡死，虽然还活着但已经不值得继续留着

失败的典型结果通常是：

- kubelet 重启容器

它更像：

- 最后的自愈兜底

而不是：

- 常规依赖检查器

## 5. 一个常见误区：拿 liveness 去检查外部依赖

这是非常常见的误配。

比如把下面这些直接塞进 liveness：

- 数据库是否可连
- Redis 是否可连
- 下游 HTTP 接口是否成功

这会导致什么问题：

- 明明只是外部依赖短暂抖动
- 结果 K8s 开始不断重启你自己的应用
- 于是问题从“依赖抖动”升级成“我方服务雪崩”

更稳的做法通常是：

- `readiness` 用来决定是否继续接流量
- `liveness` 只检查进程自身是否真的坏死

所以很多场景下：

- 下游依赖异常更适合让 readiness 失败
- 不适合直接让 liveness 失败

## 6. 一张表把三种探针彻底拆开

| 探针 | 它回答的问题 | 失败后最常见结果 | 最适合放什么检查 |
| --- | --- | --- | --- |
| `startupProbe` | 应用启动期是否结束 | 启动期失败可触发重启，但重点是保护慢启动 | 启动是否真正完成 |
| `readinessProbe` | 现在能不能接流量 | 从后端池摘掉 | 是否具备接业务流量能力 |
| `livenessProbe` | 进程是不是已经坏死 | 重启容器 | 进程是否卡死、内部主循环是否失活 |

如果只记一句：

> `startup` 保护启动，`readiness` 管流量，`liveness` 管重启。

## 7. `CrashLoopBackOff` 为什么总和探针一起出现

因为很多 `CrashLoopBackOff` 根本不是“程序自己退出”这么简单，而是：

- 启动命令有问题
- 配置缺失导致进程直接退出
- 端口、权限、依赖没准备好
- `livenessProbe` 太激进，把应用反复打死
- 应用启动很慢，但没有 `startupProbe`

所以看到 `CrashLoopBackOff` 时，不要只问：

- 程序为什么退出了

还要同时问：

- 是程序自己退出的，还是 probe 误杀的

一个很典型的现场是：

- 应用真实启动要 80 秒
- `livenessProbe` 在第 20 秒就开始探测
- 连续失败后容器被重启
- 下一次又从头开始
- 最后就进入 `CrashLoopBackOff`

这类问题本质上不是“应用永远起不来”，而是：

- 你的探针时序根本没给它起完

## 8. 一套比较稳的配置骨架

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
          image: my-api:v1
          ports:
            - containerPort: 8080
          startupProbe:
            httpGet:
              path: /startupz
              port: 8080
            periodSeconds: 5
            failureThreshold: 24
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            periodSeconds: 10
            failureThreshold: 3
```

这段配置表达的是：

- 启动期最长给 24 x 5 = 120 秒
- 启动完成前，不急着让 liveness/readiness 接管
- readiness 只决定能不能进流量
- liveness 更低频地检查进程是否真的坏死

## 9. 最容易踩的坑

### 坑 1：把 readiness 写成“端口能连通”

这会让很多“刚起来但还不可用”的服务过早进流量。

### 坑 2：没有 `startupProbe`

慢启动应用最容易被这种配置误伤。

### 坑 3：`livenessProbe` 检查项过重

如果探针自己要查数据库、查多个依赖、做复杂逻辑，很容易把探针变成新的不稳定源。

### 坑 4：探针超时时间过短

应用偶发 GC、抖动、CPU 被限流时，很容易误判失败。

### 坑 5：所有接口都返回同一个 `200`

这样你其实没有区分启动完成、可接流量、进程活着这三种状态。

### 坑 6：把发布摘流量问题也怪到 probe 上

probe 负责单 Pod 健康判断；新旧 Pod 切换、`preStop`、`SIGTERM`、grace period 是另一条链路，要看 [零停机发布链路实战](./zero-downtime-rollout.md)。

## 10. 一套实用排查顺序

如果现场现象是：

- Pod 一直不 Ready
- 容器反复重启
- `CrashLoopBackOff`
- 发布后新 Pod 起来了但服务异常

建议按这个顺序排：

1. `kubectl describe pod` 看 events，先确认卡在调度、拉镜像、挂卷，还是探针失败
2. `kubectl logs --previous` 看上一次退出前日志
3. 区分是 `startup`、`readiness` 还是 `liveness` 在失败
4. 核对应用真实启动耗时，再回看 `periodSeconds`、`failureThreshold`、`timeoutSeconds`
5. 看 Pod 是否已经 `Running` 但 readiness 没通过
6. 看对应 Service / EndpointSlice 里这个 Pod 是否已经入池
7. 如果删除 Pod 时还有流量闪断，再去看 `preStop`、`SIGTERM` 和 graceful shutdown

很多人一上来就改探针路径，但真正的问题可能是：

- 镜像启动命令写错了
- 配置没挂进来
- 应用启动时间预估严重偏小

## 11. 一套面试答法

如果面试官问：

> Kubernetes 里 readiness、liveness、startup probe 怎么区分？为什么 Pod 是 Running 了还是不能用？

你可以这样答：

> 我会先区分 Running 和 Ready。  
> Running 只说明容器进程起来了，不代表已经能接业务流量；  
> readiness probe 管的是能不能进入 Service 后端池，失败通常是摘流量；  
> liveness probe 管的是进程是不是已经坏死，失败通常会触发重启；  
> startup probe 是给慢启动应用的保护，避免在启动阶段被 readiness 或 liveness 过早误判；  
> 所以一个 Pod 真正可用，通常要等 startup 通过、readiness 成功后才能算，而不是只看 Running。  

## 12. 最后记住这句话

> Pod 生命周期里最容易出错的地方，不是“容器有没有起来”，而是“起来之后什么时候才算真的能接流量，以及什么时候该摘流量或重启”。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [Pod 内多容器协作实战](./pod-multi-container-collaboration.md)
- [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [节点执行链路实战](./node-execution-chain.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
