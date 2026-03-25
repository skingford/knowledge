---
title: DaemonSet、节点驻留与滚动更新边界实战
description: 系统讲清 Kubernetes 中 DaemonSet 的节点驻留语义、自动 toleration、与 cordon/drain 的关系、RollingUpdate/OnDelete、maxUnavailable/maxSurge，以及为什么它不是 Deployment 的替代品。
---

# DaemonSet、节点驻留与滚动更新边界实战

很多团队第一次接触 `DaemonSet`，脑子里通常只有一句话：

- 每个节点跑一个 Pod

这句话不算错，但远远不够。

真正容易在生产和面试里被追问的是这些：

- “每个节点一个”到底是所有节点，还是某些节点
- 为什么 `kubectl drain` 默认不删 DaemonSet Pod
- 为什么 DaemonSet Pod 经常在节点 `NotReady` / `Unknown` 时还留着
- `RollingUpdate` 和 `OnDelete` 到底怎么选
- 它和 Deployment、StatefulSet 的本质边界是什么

这条线真正要讲清的是：

> `DaemonSet` 解决的是节点驻留型能力分发，不是服务副本数管理。

<K8sDiagram kind="daemonset-node-resident-chain" />

如果你想先把 `Pending / OOMKilled / Evicted / taints / PriorityClass` 这条基础链路走顺，再回来看这篇会更容易对上号，可以先看 [调度与驱逐链路实战](./scheduling-and-eviction.md)。

如果你想把 `cordon / drain`、节点失联、`NoExecute`、`tolerationSeconds` 这条节点故障收敛线单独讲透，可以继续看 [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)。

## 1. 先回答：DaemonSet 到底解决什么

Kubernetes 官方对 DaemonSet 的定义很明确：

- 它描述一类提供 node-local facilities 的 Pod
- 典型就是每个节点或某类节点都应该有一份

最常见场景有：

- 日志采集 agent
- 节点监控 agent
- CNI / 网络组件
- CSI 节点插件
- 节点上的本地代理
- 某些入口控制器

一句话概括：

> 如果你关心的是“整个集群要有 N 个副本”，优先想 Deployment；如果你关心的是“每个节点都得有一个”，优先想 DaemonSet。

## 2. “每个节点一个”里的“节点”到底是谁

这是 DaemonSet 第一层容易答浅的地方。

它不是死板地对全体节点都上一份。

更准确地说：

- 对所有**符合条件的节点**各跑一个 Pod

这些条件通常来自：

- `nodeSelector`
- `nodeAffinity`
- `taints / tolerations`

所以更稳的说法不是：

- DaemonSet = 集群所有节点一个

而是：

- DaemonSet = 每个**可选中节点**一个

### 2.1 节点集合会动态变化

官方 DaemonSet 文档明确提到：

- 节点新增时，会自动补 Pod
- 节点删除时，对应 Pod 会被回收
- 节点 label 变化后，如果从不匹配变成匹配，会补 Pod；反过来则会删掉

这意味着它的本质不是：

- 现在静态有几台机，就创建几份

而是：

- 持续维护“所有符合条件的节点上都有一份”

## 3. DaemonSet 的调度链路和 Deployment 不完全一样

这层很多人平时不会细想，但一讲机制深度就会拉开。

官方文档明确说：

- DaemonSet controller 会先评估哪些节点是 eligible nodes
- 然后为目标节点创建 Pod
- 创建出来的 Pod 上，controller 会把 node affinity 改成直接匹配目标节点名
- 默认 scheduler 再完成最终绑定

最实用的理解方式是：

1. 你在 DaemonSet 模板里写的是“想去哪类节点”
2. DaemonSet controller 先算出“现在具体是哪几台”
3. 再为每一台目标节点创建对应 Pod
4. 每个 Pod 实际上会被约束到那个目标节点上

所以：

> DaemonSet 不是“先有一堆 Pod 再随机挑节点”，而更像“先找目标节点，再为每个目标节点补那一份 Pod”。

## 4. 为什么 DaemonSet Pod 经常对节点问题更“能忍”

这条线和普通 Pod 非常不一样。

官方 DaemonSet 文档明确写了：

- controller 会自动给 DaemonSet Pod 加一组 toleration

其中最关键的是这些：

- `node.kubernetes.io/not-ready:NoExecute`
- `node.kubernetes.io/unreachable:NoExecute`
- `node.kubernetes.io/disk-pressure:NoSchedule`
- `node.kubernetes.io/memory-pressure:NoSchedule`
- `node.kubernetes.io/pid-pressure:NoSchedule`
- `node.kubernetes.io/unschedulable:NoSchedule`
- 如果 `hostNetwork: true`，还会自动带 `node.kubernetes.io/network-unavailable:NoSchedule`

### 4.1 最关键的差异：`not-ready / unreachable` 没有 `tolerationSeconds`

这点官方文档和现有节点失联专题已经对上了。

对普通 Pod 来说：

- `not-ready / unreachable` 的 `NoExecute` 通常会有默认容忍窗口

但对 DaemonSet Pod 来说：

- 这两个容忍是自动加上的
- 而且没有 `tolerationSeconds`

这意味着：

- 它们会一直忍着
- 不会像普通 Pod 那样等几分钟后就被自动赶走

### 4.2 为什么要这样设计

官方文档给的理由很现实：

- 某些节点级功能必须在节点还没完全 Ready 时就先起来

最典型就是：

- 网络插件本身

否则很容易进入死锁：

- 节点没网络，所以还不 Ready
- 但网络插件又因为节点不 Ready 而起不来

## 5. 为什么 `cordon` / `drain` 对 DaemonSet 的表现这么特殊

这也是生产里最容易误判的一层。

### 5.1 `cordon` 不会挡住 DaemonSet

官方 DaemonSet 文档明确提到：

- 因为 controller 自动加了 `node.kubernetes.io/unschedulable:NoSchedule` toleration

所以即使节点被标成：

- unschedulable

DaemonSet Pod 仍然可以落到这类节点上。

这也是为什么：

- `cordon` 是挡普通工作负载的
- 不是挡节点守护进程的

### 5.2 `drain` 为什么默认不删 DaemonSet Pod

这条线在官方 `kubectl drain` 文档里说得非常清楚：

- 如果节点上有 DaemonSet 管理的 Pod，`drain` 若没有 `--ignore-daemonsets` 就不会继续
- 而且无论如何，`drain` 都不会删除 DaemonSet Pod

原因也非常直接：

- 你删了，它会立刻被 DaemonSet controller 补回来
- 因为 DaemonSet 本身就忽略 unschedulable 标记

所以这里要记住的不是命令，而是机制：

> `drain` 的目标是把业务工作负载迁走，不是把节点守护进程也一起清空。

<K8sDiagram kind="daemonset-update-and-drain-boundary-map" />

### 5.3 这也解释了一个常见现场

运维在维护节点时会看到：

- 普通 Deployment Pod 都迁走了
- 但日志 agent、CNI、节点监控、某些 ingress agent 还在

这通常不是漏删，而是：

- DaemonSet 就该这么表现

## 6. DaemonSet 的更新策略为什么也要单独讲

因为很多人以为：

- DaemonSet 反正每台机器一个，改镜像它自己会滚

这又说浅了。

官方滚动更新文档明确说：

- DaemonSet 主要有两种更新策略
- `RollingUpdate`
- `OnDelete`

### 6.1 `RollingUpdate`

这是默认策略。

语义是：

- 改模板后，controller 自动逐步替换旧 Pod

常见会一起配置：

- `.spec.updateStrategy.rollingUpdate.maxUnavailable`
- `.spec.updateStrategy.rollingUpdate.maxSurge`
- `.spec.minReadySeconds`

它更适合：

- 常规节点代理、日志、监控、入口等需要自动滚动升级的组件

### 6.2 `OnDelete`

官方文档对它的定义也很直接：

- 模板改了之后，不会自动把旧 Pod 替换掉
- 只有你手动删旧 Pod，新模板的 Pod 才会起来

它更适合：

- 你需要严格人工控批次
- 或者节点上组件升级风险很高，不能让 controller 自己推进

### 6.3 `maxUnavailable` 和 `maxSurge` 各解决什么

在 DaemonSet 里，这两个值要按“节点数”理解，不是按 Deployment 那种副本总数心智去理解。

- `maxUnavailable`
  - 升级过程中，最多允许多少目标节点暂时没有可用 DaemonSet Pod
- `maxSurge`
  - 升级时允许临时多起一些新 Pod，再把旧 Pod 退掉

这条线真正要注意的是：

- 你改的是节点级能力
- 不是普通业务副本

所以一旦 `maxUnavailable` 配太大，影响的不是：

- 某个服务少几个副本

而可能是：

- 一批节点同时少掉日志、监控、网络、入口代理这类能力

### 6.4 什么情况下不要随便开 `maxSurge`

这点是 DaemonSet 比 Deployment 更容易踩坑的地方。

`maxSurge` 的真实含义不是：

- 整个集群临时多几个副本

而是：

- 某些节点在升级窗口里，可能短时间同时存在旧 Pod 和新 Pod

这在下面这些场景里很容易直接冲突：

- Pod 使用了 `hostPort`
- Pod 绑定本地 Unix Socket
- Pod 独占某块本地设备或目录
- Pod 用 `hostPath` 挂了某个只能单写的宿主机路径
- 某个节点上逻辑上就只允许一个实例存在

所以更稳的经验通常是：

- 需要节点上短时双实例预热，才考虑 `maxSurge`
- 如果节点级组件天然只能单实例，优先用 `maxUnavailable` 控节奏
- 再激进一点，就直接用 `OnDelete` 做人工批次推进

## 7. DaemonSet 滚动更新为什么经常会卡住

官方滚动更新文档专门列了几个高频原因。

最常见的是：

- 某些节点资源不够，新 DaemonSet Pod 起不来
- 新模板本身坏了，比如镜像不存在或启动后 CrashLoop
- 配了 `minReadySeconds`，但就绪收敛很慢

这类卡住和 Deployment 很像，但更危险，因为它影响的是：

- 节点级公共能力

官方文档还专门提醒：

- 为了给新 DaemonSet Pod 腾位置去删其他普通 Pod，会带来服务中断
- 而且这不尊重 `PodDisruptionBudget`

所以这里真正该怕的不是“卡”，而是：

- 为了赶更新，误删业务 Pod 去给节点代理让路

## 8. 如果客户端要访问 DaemonSet，常见有哪几种方式

官方 DaemonSet 文档也把这一层讲得很清楚。

常见模式有这些：

- Push 模式
  - DaemonSet Pod 主动把数据推走，例如日志、指标上报
- `NodeIP + hostPort`
  - 客户端知道节点 IP 和固定端口
- Headless Service
  - 通过成员记录发现一组节点守护进程
- 普通 Service
  - 随机打到某一个节点上的 DaemonSet Pod
  - 需要本地优先时再结合 `internalTrafficPolicy: Local`

所以不要默认把 DaemonSet 理解成：

- 只能本机自己访问

它能怎么被访问，还是要看你的通信模型。

## 9. 为什么 DaemonSet 经常和 `hostNetwork` / `hostPort` 一起出现

这在入口代理、节点本地转发器、采集 agent 里非常常见。

原因通常不是“这样更高级”，而是这些组件本来就需要：

- 直接看到节点网络栈
- 监听节点上的固定端口
- 感知节点 IP
- 少走一层转发链路

### 9.1 `hostNetwork: true` 的真正含义

它表达的是：

- Pod 直接加入宿主机网络命名空间

这会带来两个直接后果：

- 端口冲突风险更高，因为你用的就是节点自己的网络栈
- 网络隔离边界更薄，不应该把它当普通业务 Pod 的默认配置

如果这类 Pod 还要解析集群内 Service 名称，通常要配套：

- `dnsPolicy: ClusterFirstWithHostNet`

否则你很可能看到：

- Pod 虽然开了 `hostNetwork`
- 但 DNS 解析走的不是你预期的集群路径

如果想把这条解析链单独讲透，继续看 [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)。

### 9.2 `hostPort` 的边界和 `maxSurge` 是联动的

`hostPort` 和 `hostNetwork` 不完全一样。

它更像是：

- Pod 仍然保留自己的网络命名空间
- 但额外在节点上占一个固定端口

这意味着：

- 同一个节点上，同一个端口通常只能被一个 Pod 占住

所以如果你的 DaemonSet：

- 监听固定 `hostPort`
- 同时又开了 `maxSurge`

那升级时同节点新旧 Pod 并存，往往就会直接撞端口。

### 9.3 别把 `hostNetwork` 当成固定 IP 或白名单方案

很多人一看到“节点网络栈”就会往这个方向走偏：

- 既然 Pod 跑在 host network 上，是不是就相当于固定节点 IP 了

这不是一个稳妥的常规方案。

更稳的原则还是：

- 入口固定地址，优先在 `LoadBalancer` / Ingress / LB 层解决
- 出口固定地址，优先在 `NAT Gateway` / `Egress Gateway` / 代理层解决
- `hostNetwork` 更适合节点基础设施组件，不适合拿来兜普通白名单问题

如果想把固定入口、固定出口和白名单链路单独讲透，继续看 [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)。

### 9.4 这类 DaemonSet 往往还有更高的权限面

现实里和 `hostNetwork`、`hostPort` 一起出现的，常常还有：

- `hostPath`
- `privileged`
- 额外 capabilities

所以它们往往不是“普通工作负载”，而是：

- 节点基础设施组件

也正因为这样，安全边界要单独评估。

如果想把 `hostNetwork`、`hostPath`、`privileged` 这些运行权限风险单独讲透，继续看 [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)。

## 10. 最常见的误区和反模式

### 误区 1：把 DaemonSet 当成“不能扩缩容的 Deployment”

不对。

- Deployment 管的是副本数
- DaemonSet 管的是节点覆盖面

### 误区 2：把普通无状态 API 跑成 DaemonSet

如果你的真实诉求只是：

- 多副本在线服务

那通常应该用：

- Deployment

不是：

- 为了“每个节点都来一个”硬上 DaemonSet

### 误区 3：把数据库、Kafka 这类成员型服务跑成 DaemonSet

这类组件通常关心的是：

- 成员身份
- 独立卷
- 有序升级

更适合的是：

- StatefulSet

### 误区 4：以为 `drain` 会像删 Deployment Pod 一样把 DaemonSet 也清掉

不会。

这不是特例，而是设计目标。

### 误区 5：忽略自动 toleration 带来的行为差异

如果你把 DaemonSet Pod 当成普通 Pod 去推演：

- 节点失联
- cordon
- 压力 taint

很多结论都会错。

### 误区 6：只为拿节点 IP 就给普通业务开 `hostNetwork`

这通常会同时把：

- 网络隔离
- 端口规划
- 调度灵活性
- 安全边界

一起搞复杂。

如果你的真实问题只是：

- 固定入口
- 固定出口
- 白名单
- 保留客户端真实源地址

那通常都有更正交、更稳的办法，不该先把业务 Pod 推到 `hostNetwork` 上。

## 11. 一套更稳的配置骨架

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-log-agent
spec:
  selector:
    matchLabels:
      app: node-log-agent
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 10%
  minReadySeconds: 10
  template:
    metadata:
      labels:
        app: node-log-agent
    spec:
      nodeSelector:
        kubernetes.io/os: linux
      containers:
        - name: agent
          image: registry.example.com/node-log-agent:v1
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          volumeMounts:
            - name: varlog
              mountPath: /var/log
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
```

这套骨架表达的是：

- 在所有 Linux 节点上驻留一个日志 agent
- 升级时按 RollingUpdate 逐步替换
- 用 `maxUnavailable` 控升级期同时缺席节点数

## 12. 排障时建议按这条顺序看

如果你怀疑是 DaemonSet 问题，建议按这条顺序排：

1. 先确认真实诉求是不是节点驻留，而不是普通副本服务
2. 再看哪些节点是应该匹配的，哪些节点是不该匹配的
3. 再看 `nodeSelector / nodeAffinity / tolerations` 有没有把目标节点集合算错
4. 再看 DaemonSet Pod 是没创建、没调度、没就绪，还是更新卡住
5. 如果和节点维护相关，再区分是 `cordon`、`drain` 还是节点失联
6. 如果 `drain` 卡着，再先确认是不是 DaemonSet Pod 没被 `--ignore-daemonsets`
7. 如果滚动更新卡住，再看节点资源、镜像、启动错误、`minReadySeconds`
8. 最后再看是不是把 DaemonSet 当普通业务工作负载用了

## 13. 面试里怎么把这题答顺

如果面试官问：

> DaemonSet 适合什么场景？为什么 `kubectl drain` 默认不会删除 DaemonSet Pod？

可以这样答：

> `DaemonSet` 更适合节点级驻留能力，比如日志采集、监控 agent、CNI、CSI 节点插件、某些入口控制器。  
> 它管的不是“总共有几个副本”，而是“每个符合条件的节点都要有一份”；节点新增会补，节点删除会回收，节点标签变化也会跟着收敛。  
> 另外 DaemonSet controller 会自动给这类 Pod 加一组 toleration，包括 `unschedulable` 以及 `not-ready / unreachable` 等，所以它们在 `cordon` 或节点问题场景下的行为和普通 Pod 不一样。  
> `kubectl drain` 默认不会删除 DaemonSet Pod，是因为删了也会立刻被 controller 补回来，而且 DaemonSet 本来就忽略 unschedulable 标记；`drain` 的目标是迁走业务工作负载，不是把节点守护进程也一起清空。  

## 14. 最后记住这句话

> DaemonSet 解决的是“节点覆盖面”，不是“服务副本数”；它和 Deployment、StatefulSet 的分界线，一定要按“副本语义、成员语义、节点驻留语义”三件事来拆。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [PriorityClass、Preemption 与调度让路边界实战](./priorityclass-preemption-and-scheduling-boundaries.md)
- [PDB、Eviction API 与 drain 边界实战](./pdb-eviction-api-and-drain-boundaries.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
