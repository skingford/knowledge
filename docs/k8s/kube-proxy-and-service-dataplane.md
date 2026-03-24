---
title: kube-proxy 与 Service 数据面实战
description: 系统讲清 Kubernetes 中 Service VIP、EndpointSlice、kube-proxy、iptables、IPVS、NodePort 与 externalTrafficPolicy 的数据面实现和排障方法。
---

# kube-proxy 与 Service 数据面实战

把入口对象背下来之后，下一层最容易被追问的是：

- Service VIP 到底是不是一个“真实 IP”
- kube-proxy 到底干了什么
- 为什么 Service 能稳定访问，但 Pod IP 明明一直在变
- `iptables` 和 `IPVS` 到底差在哪
- 为什么 `curl Service` 不通，不一定是 CNI 坏了
- 为什么有时只有某一台节点上的 Service / NodePort 不通

如果这些问题答不顺，通常说明你对 K8s 网络还停在“会用 Service”，还没真正进入数据面。

<K8sDiagram kind="service-dataplane-chain" />

## 1. 先回答：Service VIP 是什么，不是什么

`ClusterIP` 最容易被误解。

它是：

- Service 的稳定虚拟入口
- 调用方看到的统一目标地址
- 一组后端 Pod 的抽象，而不是某个具体 Pod

它不是：

- 某个 Pod 自己的 IP
- 外部负载均衡的公网 IP
- 一定真实绑在某张网卡上的“实体地址”

更准确地说：

> Service VIP 是一个由控制面对象定义、由节点数据面实现的虚拟访问入口。

也就是说，真正的后端地址并不写死在 Service 里，而是由 `EndpointSlice` 动态维护。

## 2. 一次 Service 访问到底经过了什么

标准模型下，一次 `Client -> Service -> Pod` 的访问，可以拆成两段：

### 2.1 控制面准备阶段

控制面负责准备这些对象：

- `Service`：定义 VIP、端口、selector
- `EndpointSlice`：记录当前可用后端 Pod 地址
- `kube-proxy`：watch 这些对象变化，并在每个节点安装转发表

### 2.2 节点数据面执行阶段

真正收包和转发的是节点：

1. 客户端请求打到 Service VIP 或 NodePort
2. 本机 `kube-proxy` 维护的规则命中该 Service
3. 节点根据当前后端集合选出一个 Pod
4. 如果后端 Pod 在远端节点，再交给 CNI 做实际跨节点转发
5. 最终请求进入目标 Pod

关键边界要记住：

- `EndpointSlice` 决定“后面有哪些 Pod”
- `kube-proxy` 决定“当前节点怎么把包导过去”
- `CNI` 决定“这些 Pod IP 之间怎么真的互通”

## 3. kube-proxy 做什么，不做什么

很多人把 `kube-proxy` 和 CNI、DNS、Ingress 混着讲，这是典型失分点。

`kube-proxy` 主要做的是：

- watch `Service` 和 `EndpointSlice`
- 在节点上维护 Service 的转发表
- 处理 `ClusterIP`、`NodePort`、部分 `LoadBalancer` 流量的本机转发入口
- 让“访问稳定虚拟地址”最终落到当前后端 Pod

`kube-proxy` 不做的是：

- 不负责给 Pod 分配 IP
- 不负责跨节点 Overlay / 路由打通
- 不负责服务名解析
- 不负责 Host / Path / TLS 这类七层路由
- 不负责决定 Pod 是否 Ready，它只是消费已经收敛好的后端列表

一句话：

> kube-proxy 解决的是 Service 转发表，不是整个 K8s 网络。

如果想把 kube-proxy 这条线的“上游真相”单独讲透，也就是 Service selector、EndpointSlice controller、`ready / serving / terminating` 和后端摘入池边界，要继续看 [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)。

## 4. EndpointSlice 为什么是数据面的上游真相

以前很多人只盯 `Endpoints`，现在更应该先看 `EndpointSlice`。

它的价值在于：

- 记录某个 Service 当前有哪些后端 Pod
- 标记这些后端是否 Ready / Serving / Terminating
- 把大规模后端拆分成多个 slice，减少单对象过大问题
- 作为 `kube-proxy` 同步规则的上游来源

所以这几个现象本质都先要看 `EndpointSlice`：

- Service 存在，但后端空了
- 滚动发布时后端短暂减少
- Pod Running 但不在流量池
- `externalTrafficPolicy: Local` 下各节点本地后端分布变化

一个很实用的判断：

> 只要 `EndpointSlice` 还没收敛好，节点上再研究 `iptables` / `IPVS` 也只是看到了错误结果。

## 5. `iptables` 和 `IPVS` 到底差在哪

<K8sDiagram kind="iptables-vs-ipvs-map" />

### 5.1 `iptables` 模式怎么理解

`iptables` 模式更像：

- 在节点上铺一串规则链
- 先匹配到 Service，再跳转到对应后端规则
- 最终做 DNAT，把目标改写成某个 Pod IP + Port

它的心智模型是：

- 规则驱动
- 匹配后改写
- Service 越多，规则链通常越长

### 5.2 `IPVS` 模式怎么理解

`IPVS` 模式更像：

- 内核里维护一张虚拟服务表
- `VIP:Port` 映射到一组真实后端
- 选后端这件事更接近“虚拟负载均衡器”

它的心智模型是：

- 虚拟服务表
- 后端成员池
- 在 Service 数量较大时通常更稳定，更适合大规模场景

### 5.3 别把它们讲成两个完全独立世界

工程上要记住两点：

- 两者的上游数据来源都是 `Service + EndpointSlice`
- 即使是 `IPVS` 模式，很多场景仍会配合 `iptables` 处理补充链路，例如部分 SNAT / 过滤规则

所以面试里更好的答法不是死背实现细节，而是先说边界：

> `iptables` 和 `IPVS` 都是在节点实现 Service 转发，只是一个更像规则链，一个更像虚拟服务表。

### 5.4 还有一条更深入的现实边界

在一些 eBPF 数据面里，Service 转发甚至可以不再依赖传统 `kube-proxy`。

这说明真正的抽象层次应该是：

- `Service / EndpointSlice` 是控制面抽象
- 具体由谁在节点上实现转发，是可替换的数据面实现

这也是为什么你不能把 `kube-proxy` 当成 K8s 网络的全部。

## 6. `ClusterIP`、`NodePort`、`LoadBalancer`、`externalTrafficPolicy` 怎么放回同一条线

这一组概念很适合一起讲，但不要混层。

### 6.1 `ClusterIP`

重点是：

- 集群内稳定访问入口
- 访问目标是 VIP，不是具体 Pod
- 数据面依赖 `kube-proxy` 把 VIP 转成后端 Pod

### 6.2 `NodePort`

重点是：

- 在每个节点上打开一个端口
- 外部流量先打到节点，再由节点转发到 Service 后端
- 所以它仍然是 Service 数据面的一部分，不是另一套体系

### 6.3 `LoadBalancer`

重点是：

- 外部 LB 把流量送到节点或 Service 暴露入口
- 它解决的是“怎么从集群外进来”
- 进到节点之后，是否还能跨节点转发、是否保留源地址，仍然回到 Service 数据面话题

### 6.4 `externalTrafficPolicy`

它只影响外部进入 `NodePort / LoadBalancer` 的流量：

- `Cluster`：可以再跨节点转发，更偏均衡
- `Local`：尽量只在本地有后端的节点接流量，更利于保留源地址

它不影响：

- Pod 到 ClusterIP 的集群内访问
- Service VIP 的基本存在方式
- CNI 的 Pod 网络实现

## 7. 为什么 “Service 不通” 不等于 “CNI 坏了”

这是最常见的误判之一。

出现 `curl Service` 失败时，常见根因优先级通常是：

1. Service selector / port / namespace 配错
2. `EndpointSlice` 里根本没有 Ready 后端
3. `kube-proxy` 规则没在某些节点收敛
4. NodePort / `externalTrafficPolicy` / 节点防火墙带来的局部入口异常
5. 最后才是 CNI、跨节点路由或 Pod 网络本身

也就是说：

> Service 访问失败，常常是“对象收敛问题”或“节点代理问题”，不一定是“底层网络全坏了”。

## 8. 高频现象怎么快速判断

### 8.1 只有某一台节点访问 Service 不通

优先怀疑：

- 该节点的 `kube-proxy` 异常
- 该节点规则未更新
- 该节点本地防火墙 / 路由异常
- 该节点上的 conntrack 残留状态异常

这种现象通常说明：

- 不是 Service 对象本身全局错了
- 更像节点局部数据面问题

### 8.2 NodePort 只有部分节点能通

优先怀疑：

- `externalTrafficPolicy: Local` 下这些节点没有本地后端
- 某些节点 `kube-proxy` 未同步
- 安全组 / ACL / 主机防火墙只放行了部分节点
- 云 LB 健康检查和节点本地后端分布不同步

这类问题非常适合先问一句：

> 失败的是所有节点，还是只有部分节点？

### 8.3 后端 Pod 明明变了，流量还像在打旧实例

优先怀疑：

- `EndpointSlice` 还没完全收敛
- `kube-proxy` watch / 同步有延迟
- 长连接或连接池还没重建
- conntrack 里的旧连接状态还没过期
- 发布时 readiness / preStop / 优雅终止没配顺

尤其要记住：

- 后端“对象列表变了”不等于“所有现存连接立刻切到新 Pod”
- 对长连接场景，数据面切换本来就不是瞬时无状态的

## 9. 最短排障顺序

如果你要排一个 `Service / NodePort` 问题，建议顺序是：

1. 看 `Service`
2. 看 `EndpointSlice`
3. 看目标 `Pod` 是否真的监听
4. 看出问题节点上的 `kube-proxy`
5. 看该节点的 `iptables` / `IPVS` 规则
6. 最后再看 CNI、跨节点路由、防火墙

常用命令：

```bash
kubectl get svc -n <namespace>
kubectl describe svc <service-name> -n <namespace>

kubectl get endpointslice -n <namespace> -l kubernetes.io/service-name=<service-name>
kubectl get endpointslice -n <namespace> -l kubernetes.io/service-name=<service-name> -o yaml

kubectl get pods -n kube-system -l k8s-app=kube-proxy -o wide
kubectl logs -n kube-system <kube-proxy-pod>

iptables-save | rg KUBE-SVC
ipvsadm -Ln  # IPVS 模式下查看
```

排障时最重要的不是把命令背全，而是先判断：

- 问题是全局还是单节点
- 后端是压根没有，还是规则没同步
- 是入口链路异常，还是 Pod 自己没监听

## 10. 一套面试答法

如果面试官问：

> Service 为什么能稳定访问？kube-proxy、EndpointSlice、CNI 分别干了什么？

你可以这样答：

> Service 提供的是稳定虚拟入口，不是固定 Pod IP。  
> 后端 Pod 列表由 EndpointSlice 维护，Pod 变化、readiness 变化都会收敛到这里；  
> kube-proxy 在每个节点 watch Service 和 EndpointSlice，然后用 iptables 或 IPVS 把访问 VIP / NodePort 的流量转到当前后端；  
> 如果后端在其他节点，再由 CNI 负责实际的 Pod 网络连通。  
> 所以 Service 稳定访问背后，本质是“控制面维护后端集合，节点数据面维护转发表”。  

## 11. 最后记住这句话

> Service 解决的是稳定入口，EndpointSlice 解决的是后端集合，kube-proxy 解决的是节点转发表，CNI 解决的才是真正的 Pod 网络连通。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [节点执行链路实战](./node-execution-chain.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
