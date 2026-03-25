---
title: 节点执行链路实战
description: 系统讲清 Kubernetes 中 kubelet、CRI、container runtime、Pod sandbox、CNI、CSI 如何把一个已调度的 Pod 真正跑起来。
---

# 节点执行链路实战

很多人把控制面主线讲到：

- `apiserver`
- `etcd`
- `scheduler`
- `controller-manager`

就停了。

但真正线上里，很多问题已经不在控制面，而是在节点执行这一层：

- Pod 明明已经绑定节点，为什么还卡在 `ContainerCreating`
- `ImagePullBackOff`、`CreateContainerConfigError`、`RunContainerError` 到底应该先查谁
- kubelet 和 container runtime 到底谁负责什么
- `CRI`、CNI、CSI 是什么关系
- 为什么卷、网络、镜像、探针问题最后都可能表现成“Pod 起不来”

如果这条线不单独拆开，排障时就很容易把：

- 控制面决策问题
- 节点执行问题
- 应用启动问题

混成一坨。

这篇专门讲一句话：

> Pod 被调度到节点之后，kubelet 会通过 CRI 驱动 runtime 建立 Pod sandbox、拉镜像、起容器，并配合 CNI、CSI、探针和状态回写，把它真正变成一个可运行的服务实例。

<K8sDiagram kind="node-execution-chain" />

## 1. 先分清几个角色：谁在节点上干什么

### 1.1 `kubelet`

`kubelet` 是节点代理。

它主要负责：

- 监听分配到本节点的 PodSpec
- 驱动 Pod 的同步过程
- 调用 runtime 创建 Pod sandbox 和容器
- 协调卷挂载、镜像拉取、探针和状态上报

它是：

- 节点执行面的总协调者

不是：

- 真正实现容器创建的 runtime 本身

### 1.2 `CRI`

`CRI` 是 kubelet 和容器运行时之间的标准接口。

你可以把它理解成：

- kubelet 对 runtime 的统一调用协议

这样 kubelet 不需要绑死某个具体 runtime。

### 1.3 `container runtime`

真正负责容器执行的通常是：

- `containerd`
- `CRI-O`

它们负责：

- 拉镜像
- 创建 sandbox
- 创建和启动容器
- 返回容器状态

### 1.4 `CNI`

CNI 负责：

- 给 Pod 配网络
- 分配 Pod IP
- 配跨节点网络和路由

### 1.5 `CSI`

CSI 负责：

- 把卷 attach / mount 到节点
- 再把卷挂到 Pod 可见路径

所以节点执行链路最稳的理解是：

> kubelet 负责协调，runtime 负责跑容器，CNI 负责网络，CSI 负责存储。

## 2. 一条已调度 Pod 的执行链路怎么走

<K8sDiagram kind="sandbox-runtime-network-storage" />

如果一个 Pod 已经被 scheduler 绑定到某台节点，典型链路大致是：

1. kubelet 通过 `apiserver` 观察到本节点新增了一个 Pod
2. kubelet 开始执行一轮 `syncPod`
3. kubelet 先准备本地配置、Secret、ConfigMap、卷信息
4. 通过 CRI 调 runtime 创建 Pod sandbox
5. 由 CNI 给 sandbox 配网络
6. 由 CSI / volume manager 把卷 attach / mount 好
7. runtime 拉业务镜像
8. 先启动 init containers
9. 再启动主容器
10. kubelet 开始执行 startup / readiness / liveness probe
11. 容器状态和探针结果持续回写 `apiserver`

这里最关键的一句是：

> `Pending` 到 `Running` 中间，不是“起一个进程”这么简单，而是要同时满足 sandbox、网络、卷、镜像、容器启动和探针几个阶段。

## 3. 什么是 Pod sandbox，为什么它值得单独讲

很多人第一次接触这个概念会有点抽象。

最实用的理解方式是：

- sandbox 是 Pod 级运行环境的基础壳

它通常承担：

- Pod 级网络命名空间
- 一组容器共享的基础运行上下文

在很多实现里，它和：

- `pause` 容器

这类概念会关联在一起。

这也是为什么常见执行顺序不是“直接起业务容器”，而是：

1. 先建 Pod sandbox
2. 再在这个 sandbox 里启动 Pod 内各个容器

所以如果 sandbox 建不起来，后面：

- 镜像拉取
- init container
- 业务容器启动

都无从谈起。

## 4. kubelet 真正做的不是一次动作，而是持续 `syncPod`

这点和控制器的 reconcile 很像。

kubelet 的核心不是：

- 执行一条启动命令就结束

而是：

- 持续把节点上的实际 Pod 状态拉向 PodSpec 定义的目标状态

所以你会看到：

- 容器退出后 kubelet 还会继续尝试按策略重建
- 探针失败后 kubelet 会继续做摘流量或重启动作
- Pod 删除时 kubelet 会继续走优雅终止和清理流程

这也是为什么节点执行面的问题很多都不是“一次失败”，而是：

- 反复同步
- 反复拉镜像
- 反复重启
- 反复挂载失败

## 5. `ContainerCreating` 这几个字背后到底可能卡在哪

这是现场里最常见的误判之一。

`ContainerCreating` 不是一个单独根因，它只是一个阶段性现场表现。

常见可能卡住的点包括：

- sandbox 创建失败
- CNI 配网失败
- CSI 挂卷失败
- 镜像拉取慢或失败
- Secret / ConfigMap / 环境变量准备失败
- init container 还没跑完

所以看到 `ContainerCreating` 时，最不该做的事就是：

- 直接猜应用有 bug

因为很多时候业务容器甚至还没真正开始执行。

## 6. 最常见的几类状态，分别更该先怀疑谁

| 现象 | 优先怀疑谁 | 常见解释 |
| --- | --- | --- |
| `Pending` 且没绑定节点 | scheduler | 资源、亲和性、污点、PVC 等调度前问题 |
| 已绑定节点但卡 `ContainerCreating` | kubelet / runtime / CNI / CSI | 节点执行面还没把基础环境准备好 |
| `ImagePullBackOff` / `ErrImagePull` | runtime / registry / 镜像配置 | 镜像地址、凭证、网络、仓库可用性 |
| `CreateContainerConfigError` | kubelet / Pod 配置 | Secret、ConfigMap、环境变量、挂载配置有问题 |
| `RunContainerError` | runtime / 启动命令 | 容器创建后启动命令、参数或权限不对 |
| `CrashLoopBackOff` | 应用进程 / probe / 启动时序 | 容器能起，但反复退出或被误杀 |

这张表最重要的价值是：

- 不要把所有起不来的 Pod 都统一归因成“应用挂了”

## 7. 镜像拉取链路里，kubelet 和 runtime 怎么分工

这一层经常答混。

更准确的说法是：

- kubelet 决定“需要这个镜像”
- runtime 真正执行“去拉这个镜像”

所以 `ImagePullBackOff` 常见要看：

- 镜像名和 tag 是否正确
- 镜像仓库凭证是否正确
- 节点到镜像仓库网络是否可达
- 镜像是否太大、拉取太慢
- 是否触发了 registry 限流

这里更偏：

- 节点执行面 + 外部仓库依赖

不是：

- scheduler 问题

## 8. 网络为什么会卡住 Pod 启动

因为 Pod 不是先有容器再谈网络，而是：

- sandbox 建好后，CNI 要先把网络配进来

如果 CNI 失败，常见后果就是：

- Pod IP 分不到
- sandbox 建立失败
- 后续容器无法进入正常运行阶段

这一层高频问题包括：

- 节点上的 CNI 插件异常
- IP 池耗尽
- 路由 / overlay 异常
- 节点局部网络配置损坏

所以有些 `ContainerCreating` 本质上其实是：

- 网络没配好

而不是：

- 业务进程没起来

## 9. 存储为什么也会卡住 Pod 启动

如果 Pod 用到了卷，执行链路里通常还要过 CSI。

典型链路是：

- kubelet 发现 Pod 需要卷
- volume manager / CSI 开始 attach 和 mount
- 卷挂好后容器才能按预期看到挂载路径

如果这一层失败，常见现象是：

- Pod 迟迟起不来
- events 里反复 mount failed
- 业务容器根本没真正启动

这类问题更应该优先回看：

- [存储与数据链路实战](./storage-and-data-lifecycle.md)

## 10. init containers 为什么也常让人误判

很多人看到主容器没起来，就开始看主容器日志。

但真实情况可能是：

- init container 还没成功完成

而在 K8s 里：

- init containers 不完成，主容器就不会开始

所以如果启动阶段卡住，一定要先确认：

- 是不是 init container 自己失败了

否则你会在一个根本还没开始运行的主容器上浪费很多时间。

## 11. 一个比较稳的执行链路骨架

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      imagePullSecrets:
        - name: registry-cred
      initContainers:
        - name: init-config
          image: busybox:1.36
          command: ["sh", "-c", "echo init ok"]
      containers:
        - name: api
          image: registry.example.com/api:v1
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: data
              mountPath: /data
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: data-api
```

这段配置表达的是：

- Pod 要先拿到镜像仓库凭证
- 先执行一个 init container
- 再启动主容器
- 同时还依赖一个 PVC 卷挂载
- readiness 通过后才能正式接流量

这也意味着任何一个环节坏掉，最终都可能表现成：

- Pod 没起来

## 12. 一个实用排查顺序

如果现场现象是“Pod 已经调度到节点，但还是起不来”，建议按这个顺序查：

1. 先看 `kubectl describe pod` 的 events
2. 先判断是卡在镜像、卷、网络、init container，还是主容器启动
3. 如果是 `ImagePullBackOff`，优先查镜像地址、仓库凭证和节点到 registry 的连通性
4. 如果是 mount failed，优先查 CSI 和卷状态
5. 如果是 sandbox / CNI 失败，优先查节点上的 CNI 组件和网络状态
6. 如果容器已经起来再退出，再看启动命令、应用日志和 probe
7. 如果是节点局部现象，再对比同工作负载在别的节点是否正常

经验上：

- 先分阶段，再分责任人，比一上来盯某一类日志更有效

## 13. 一套面试答法

如果面试官问：

> Kubernetes 里 kubelet、CRI、container runtime、CNI、CSI 分别是什么关系？Pod 调度到节点后怎么真正跑起来？

你可以这样答：

> 我会先把它分成节点执行链路。  
> Pod 被 scheduler 绑定到节点后，kubelet 会观察到这个 Pod，并开始一轮 sync；  
> kubelet 通过 CRI 调 container runtime 去创建 Pod sandbox、拉镜像、启动 init container 和业务容器；  
> 同时 CNI 负责给 Pod 配网络，CSI 负责把卷 attach 和 mount 好；  
> 这些基础环境都准备好后，容器才真正起来，kubelet 再继续执行 startup、readiness、liveness probe，并把状态回写控制面；  
> 所以节点侧最核心的分工是：kubelet 负责协调，runtime 负责跑容器，CNI 负责网络，CSI 负责存储。  

## 14. 最后记住这句话

> Pod 已经被调度到节点，不代表它已经“快好了”；真正让 Pod 变成可运行实例的，是 kubelet 协调 runtime、CNI、CSI、镜像、卷和探针完成的一整条节点执行链路。

## 关联阅读

- [控制面主线实战](./control-plane-mainline.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [Pod 内多容器协作实战](./pod-multi-container-collaboration.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
