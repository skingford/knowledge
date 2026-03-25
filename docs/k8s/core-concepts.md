---
title: K8s 核心概念与对象模型
description: 从 Kubernetes 的定位、控制面、核心对象到调度与服务发现，建立回答 K8s 问题的统一框架。
---

# K8s 核心概念与对象模型

很多人学 K8s 卡住，不是因为 API 太多，而是没有先建立“对象模型 + 控制循环 + 运行时”的统一框架。这个页面先不追求全，而是把最核心的骨架搭起来。

<K8sDiagram kind="control-plane" />

## 1. 先回答 Kubernetes 到底解决什么问题

Kubernetes 本质上是一个**容器编排平台**。它解决的不是“如何把程序跑起来”，而是“如何让大量容器在多台机器上持续、稳定、可控地运行”。

它主要解决几类问题：

- **部署标准化**：把镜像、端口、配置、资源限制、探针、滚动更新统一成声明式配置
- **自动修复**：Pod 挂了自动拉起，节点不可用自动迁移，副本数自动维持
- **服务发现与流量接入**：通过 Service、Ingress、DNS 把不稳定的 Pod IP 抽象成稳定入口
- **弹性扩缩容**：根据副本数、资源指标、节点资源做扩容和缩容
- **统一治理**：把发布、配置、权限、隔离、观测、持久化接到同一平台上

一句话标准口径：

> Kubernetes 是面向大规模容器运行的声明式编排系统，它用统一 API 管理工作负载、网络、存储和生命周期，并通过控制循环持续把“实际状态”拉回“期望状态”。

## 2. 整体架构：控制面与工作节点

先把 K8s 看成两部分：

- **控制面（Control Plane）**：负责接收声明、存储状态、做调度和控制决策
- **工作节点（Worker Node）**：负责真正运行 Pod、挂载存储、转发流量

### 控制面关键组件

| 组件 | 作用 | 必须理解的点 |
| --- | --- | --- |
| `kube-apiserver` | 集群唯一 API 入口 | 所有对象变更几乎都先过它；权限、准入、校验也在这里发生 |
| `etcd` | 保存集群状态 | 控制面的“真相来源”；Pod、Deployment、Service 等对象最终都落在这里 |
| `kube-scheduler` | 给未绑定节点的 Pod 选节点 | 核心依据是资源、约束、亲和性、污点容忍、优先级 |
| `kube-controller-manager` | 运行各种控制器 | 典型如 Deployment、ReplicaSet、Node、EndpointSlice 控制器 |

### 节点关键组件

| 组件 | 作用 | 必须理解的点 |
| --- | --- | --- |
| `kubelet` | 节点代理，负责 Pod 生命周期 | 从 apiserver 拉取 PodSpec，调用容器运行时执行 |
| `container runtime` | 实际运行容器 | 常见实现走 CRI 接口 |
| `kube-proxy` | Service 转发规则维护 | 常见是基于 iptables / IPVS 维护转发表 |
| `CNI` 插件 | Pod 网络 | 决定 Pod IP 分配、跨节点通信、网络策略能力 |
| `CSI` 插件 | 存储卷接入 | 负责持久卷创建、挂载、卸载 |

## 3. 为什么 K8s 的核心思想是“声明式 + 控制循环”

K8s 和手写脚本部署最大的区别，不是命令多少，而是范式不同。

在 K8s 里，你不是命令系统“现在立刻启动 3 个进程”，而是声明：

- 我需要一个 Deployment
- 它应该有 3 个副本
- 每个副本用这个镜像
- 暴露这些端口
- 带这些探针和资源限制

控制器会不断比较：

- **期望状态**：对象里定义的内容
- **实际状态**：集群现在真的跑成了什么样

只要两者不一致，控制器就会继续 reconcile。

这也是为什么面试里经常会问：

- 为什么删掉 Pod 会自动恢复
- 为什么改 Deployment 镜像会触发滚动更新
- 为什么手工改容器进程不算真正改集群状态

答案都指向同一个核心：**K8s 不是命令式执行器，而是声明式控制系统。**

## 4. 核心对象模型：必须先分清这些对象

<K8sDiagram kind="workload-map" />

### Pod

Pod 是 K8s 最小的调度单元，但不是最小的部署治理单元。

必须掌握的点：

- 一个 Pod 可以有一个或多个容器
- 同一个 Pod 内的容器共享网络命名空间和部分存储卷
- Pod IP 会变化，所以一般不直接依赖 Pod 地址做稳定访问
- Pod 适合表达“一个紧密协作的运行单元”，例如主容器 + sidecar

常见误区：

- 把 Pod 当成“长期稳定实例”
- 直接手工创建裸 Pod 跑生产服务
- 用 Pod 名称表达业务身份，而不是通过控制器维护

### Deployment 与 ReplicaSet

Deployment 是最常见的无状态工作负载控制器。

关系要说清：

- Deployment 负责声明式发布策略
- ReplicaSet 负责维持指定数量的 Pod 副本
- Deployment 通常通过创建和切换 ReplicaSet 来完成滚动更新与回滚

适合场景：

- Web 服务
- API 服务
- 无状态任务处理器

### StatefulSet

StatefulSet 解决的不是“能不能跑”，而是“实例身份和存储要不要稳定”。

必须掌握的点：

- Pod 名称稳定，如 `mysql-0`、`mysql-1`
- 网络标识稳定，适合需要固定成员身份的组件
- 常和 PVC 绑定，便于有状态数据保留
- 更新、删除顺序更可控

适合场景：

- 数据库
- 消息队列节点
- 强依赖稳定节点身份的分布式系统

### DaemonSet

每个节点跑一个，或者某类节点跑一个。

典型场景：

- 日志采集 Agent
- 监控 Agent
- CNI / 存储插件

它的重点不是副本数管理，而是把某种节点级能力分发到所有符合条件的节点上。

如果想把 `eligible nodes`、自动 toleration、滚动更新和 `cordon/drain` 边界单独讲透，继续看 [DaemonSet 节点驻留与更新边界实战](./daemonset-node-resident-and-update-boundaries.md)。

### Job 与 CronJob

- `Job`：一次性任务，目标是“成功完成”
- `CronJob`：按计划触发的周期性 Job

适合：

- 数据修复
- 离线批处理
- 定时清理或汇总任务

### Service 与 Ingress

这两个对象经常被混着说，必须分清职责。

| 对象 | 解决的问题 | 常见类型 / 能力 |
| --- | --- | --- |
| `Service` | 给一组 Pod 提供稳定访问入口 | `ClusterIP`、`NodePort`、`LoadBalancer` |
| `Ingress` | 做七层 HTTP 路由入口 | Host / Path 路由、TLS、统一入口治理 |

一句话区分：

- Service 更像“集群内部稳定服务抽象”
- Ingress 更像“集群外 HTTP 入口和路由规则”
- 但 `Ingress` / `Gateway` 自己不会自动生效，必须有对应 controller 来接管实现

### ConfigMap 与 Secret

两者都用于配置注入，但语义不同：

- `ConfigMap`：普通配置
- `Secret`：敏感信息

必须补一句：

- Secret 并不等于天然高安全，只是专门的敏感数据对象；真正安全还依赖加密、权限和外部密钥管理

### Namespace、Label、Selector

这三个是 K8s 组织资源和建立关联的基础。

- `Namespace`：逻辑隔离边界
- `Label`：给对象打标签，便于分组和选择
- `Selector`：控制器或 Service 用来选择目标对象

如果 Label 设计混乱，会直接导致：

- Service 选错 Pod
- Deployment 接管错资源
- 观测和治理维度失真

## 5. 调度与资源：为什么 Pod 能跑上去，为什么又会跑不上去

调度器最核心关心的是：“这个 Pod 该放到哪台节点上？”

### 资源请求与限制

必须区分：

- `requests`：调度时的保底资源承诺
- `limits`：运行时可使用的上限

典型后果：

- 没有足够 `requests`，Pod 可能一直 `Pending`
- 内存超出 `limits`，可能被 OOMKilled
- CPU 超出 `limits`，通常是被 throttling，而不是直接杀掉

### 调度常见约束

- `nodeSelector`：最简单的节点选择
- `nodeAffinity`：更灵活的节点亲和规则
- `podAffinity / podAntiAffinity`：控制 Pod 之间靠近或分散
- `taints / tolerations`：表达“默认不让来，除非你能容忍”
- `priorityClass`：资源紧张时谁更重要

标准理解：

> 调度不是单纯“挑一台有资源的机器”，而是在资源、拓扑、隔离、优先级和策略之间做综合选择。

## 6. 网络与存储：K8s 为什么不是只会拉容器

### 网络模型

K8s 的一个核心约定是：

- 每个 Pod 都有自己的 IP
- Pod 之间默认可以直接通信
- 不需要 NAT 就能用 Pod IP 互通

这套能力通常由 CNI 提供。

必须掌握：

- Pod IP 不稳定
- Service IP 稳定
- DNS 负责把服务名解析到 Service
- kube-proxy 负责把流量转到后端 Pod

### Pod 动态 IP 和外部白名单怎么处理

这是 K8s 很高频、也很容易答偏的一道题。关键不是“怎么让 Pod IP 不变”，而是先分清你真正想稳定的到底是什么。

<K8sDiagram kind="ip-whitelist-patterns" />

先记住一个总原则：

> 在 Kubernetes 里，Pod IP 默认就是易失的。真正应该稳定的是服务入口、服务名、实例身份，或者对外的出口 IP，而不是 Pod 地址本身。

典型要拆成三种场景：

| 场景 | 正确稳定对象 | 常见方案 |
| --- | --- | --- |
| 集群内调用某个服务 | 服务名 / Service VIP | `Service` + DNS |
| 集群内要稳定访问某个具体实例 | 实例身份 + DNS 名称 | `StatefulSet` + Headless Service |
| 外部系统要加白名单 | 固定入口 IP 或固定出口 IP | `LoadBalancer` / `Ingress` 静态 IP，或 `NAT Gateway` / `Egress Gateway` |

#### 场景 1：集群内访问，别直接依赖 Pod IP

如果只是服务之间调用，正确做法通常是：

- 用 `Service` 暴露稳定虚拟地址
- 用集群 DNS 名称访问，例如 `order-api.default.svc.cluster.local`
- 让后端 Pod 怎么扩缩、怎么漂移都不影响调用方

如果你硬编码 Pod IP，会出现：

- Pod 重建后地址变化，配置立刻失效
- 滚动发布期间指向旧实例
- 扩容后完全绕开新副本，负载分担失真

#### 场景 2：必须稳定到单实例，用 StatefulSet + Headless Service

有些组件确实需要“固定成员身份”，例如：

- MySQL、Redis Sentinel、Kafka、ZooKeeper 一类集群成员
- 主从或分片节点之间要按实例名互相发现
- 某些协议层直接依赖稳定节点名

这时不是追求固定 Pod IP，而是追求：

- 稳定 Pod 名
- 稳定 DNS 名
- 稳定卷绑定

典型组合：

- `StatefulSet`
- `Headless Service`（`clusterIP: None`）

这样你拿到的是类似：

- `mysql-0.mysql.default.svc.cluster.local`
- `mysql-1.mysql.default.svc.cluster.local`

即使具体 IP 变了，这个实例身份仍然稳定。

#### 场景 3：外部系统要求加白名单，先问清是入站还是出站

这是最容易混淆的地方。

##### 3.1 外部系统访问我方服务

比如合作方要调你的回调接口、开放 API、Webhook。

这时对方白名单应该加的是：

- `LoadBalancer` 的固定公网 IP
- 或 Ingress / WAF / API Gateway 前面的固定入口地址

不应该加的是：

- Pod IP
- 默认会漂移的 Node 公网 IP

标准做法：

- 云上用带静态公网 IP 的 `LoadBalancer`
- 或给 Ingress Controller 绑定固定 EIP
- 对外统一暴露域名，底层还是走稳定入口 IP

如果你还要求后端保留真实客户端源地址，再去看：

- `externalTrafficPolicy: Local`
- 负载均衡器透传源地址能力
- `X-Forwarded-For` / Proxy Protocol

但这解决的是“保留真实来源”，不是“固定入口地址”本身。

##### 3.2 我方服务访问第三方，第三方要求白名单

这是另一种方向。此时第三方看到的通常不是 Pod IP，而是 SNAT 之后的地址。

外部真正看到的，常见是：

- 节点出口 IP
- NAT Gateway / Cloud NAT 的固定公网 IP
- Egress Gateway 的出口 IP

因此第三方白名单应该加的是**固定出口 IP**，而不是某个 Pod 地址。

常见方案：

- 云厂商 `NAT Gateway` / `Cloud NAT`
- 服务网格或 CNI 提供的 `Egress Gateway`
- 独立出口节点池，通过路由和 SNAT 统一出口
- 必要时通过专用代理统一出网

#### 常见误区

- 想办法让合作方直接白名单 Pod IP
- 用 `hostNetwork: true` 只为拿节点 IP，结果把隔离和调度灵活性都破坏了
- 让第三方白名单 Node IP，却没考虑节点扩缩容和替换
- 把 NetworkPolicy 当成“第三方系统白名单”方案，它解决的是集群网络隔离，不是公网固定地址问题

一句话总结：

> Pod 动态 IP 不需要“修掉”，需要的是在不同场景下换一个稳定抽象层。集群内靠 Service 或 StatefulSet DNS，外部入站靠固定入口 IP，外部出站靠固定出口 IP。

### 存储模型

K8s 不是只适合无状态应用。它通过 `PV / PVC / StorageClass` 把存储抽象统一起来。

| 对象 | 作用 |
| --- | --- |
| `PV` | 集群中的持久卷资源 |
| `PVC` | 应用对存储的申请 |
| `StorageClass` | 动态供给存储的模板和策略 |

必须能说清的点：

- 应用通常申请的是 PVC，不是直接绑底层磁盘
- StatefulSet 常和 PVC 配合使用
- 存储卷生命周期可能独立于 Pod

## 7. 生命周期、探针与发布：为什么看起来“发布了”，但流量还是出问题

### 探针

三种探针一定要分清：

- `livenessProbe`：进程是不是卡死了，需要不需要重启
- `readinessProbe`：现在能不能接流量
- `startupProbe`：启动特别慢时，先放宽启动阶段判断

最容易说错的是：

- readiness 失败通常是摘流量，不一定重启
- liveness 失败更接近“认为这个进程不健康，要重启”

### 优雅终止

K8s 终止 Pod 时，常见流程是：

1. 发送 `SIGTERM`
2. 等待 `terminationGracePeriodSeconds`
3. 超时后再 `SIGKILL`

所以应用侧必须做好：

- 停止接新流量
- 等待存量请求完成
- 关闭连接和后台任务

### 滚动发布

Deployment 的滚动更新核心是：

- 逐步创建新 Pod
- 逐步缩旧 Pod
- 通过 `maxSurge` 和 `maxUnavailable` 控制节奏

真正能否无损，关键不只在 Deployment，还在：

- readiness 是否正确
- preStop 是否合理
- 服务摘流量是否及时
- 应用本身是否支持优雅关闭

## 8. 先背下来的统一框架

如果你需要快速建立 K8s 的答题骨架，至少先把这 8 条吃透：

- K8s 是声明式容器编排平台，核心是控制循环
- 控制面负责存状态、调度和控制，节点负责真正运行
- Pod 是最小调度单元，但生产上通常通过控制器管理
- 无状态常用 Deployment，有状态常用 StatefulSet，节点驻留常用 DaemonSet
- Service 解决稳定访问，Ingress 解决 HTTP 入口治理
- 调度核心看 requests/limits、亲和性、污点容忍和优先级
- 网络核心看 Pod IP、Service VIP、EndpointSlice、DNS、kube-proxy、CNI
- 发布稳定性核心看探针、滚动更新、优雅终止、资源与观测

## 关联阅读

- [K8s 必备问题清单](./essential-questions.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [Pod 内多容器协作实战](./pod-multi-container-collaboration.md)
- [Job 与 CronJob 批处理链路实战](./job-and-cronjob-batch-workloads.md)
- [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [DaemonSet 节点驻留与更新边界实战](./daemonset-node-resident-and-update-boundaries.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [控制面主线实战](./control-plane-mainline.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [节点执行链路实战](./node-execution-chain.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [os/signal：K8s Pod 终止流程](/golang/guide/source-reading/os-signal)
- [etcd 专题](/etcd/)
