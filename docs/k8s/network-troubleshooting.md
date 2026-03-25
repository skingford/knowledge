---
title: K8s 网络排障手册
description: 按 Service、EndpointSlice、kube-proxy、CNI、Pod 五层链路系统整理 Kubernetes 网络排障方法和高频故障定位思路。
---

# K8s 网络排障手册

K8s 网络问题最容易让人乱，因为现象通常都差不多：

- `curl Service` 超时
- Pod 能 ping 网关，但访问其他 Pod 不通
- Ingress 正常，Service 不通
- Pod 本身活着，但流量就是打不过去

真正高效的排障方式，不是先抓包，而是先把调用链分层。

<K8sDiagram kind="service-network-chain" />

## 1. 先记住这条链路

一次典型的 Service 访问，大致会经过：

1. 调用方访问 `Service`
2. `Service` 通过 selector 找到后端
3. 控制面把后端整理进 `EndpointSlice`
4. `kube-proxy` 把转发表下发到节点
5. `CNI` 负责实际网络转发和跨节点连通
6. 最终请求进入目标 `Pod`

所以任何“访问失败”问题，本质都可以沿着这条链路一层层排：

- 是不是压根没后端
- 是不是有后端但没转发表
- 是不是有转发表但网络不通
- 还是网络通了，但 Pod 本身没监听

## 2. 第一层：先看 Service 自己是不是配对了

很多故障在第一层就能定位。

优先检查：

- Service 名称和命名空间对不对
- `port` / `targetPort` 对不对
- selector 是否能选中正确的 Pod
- 访问的是 `ClusterIP`、`NodePort`、`LoadBalancer` 还是 Headless Service

先看对象：

```bash
kubectl get svc -A
kubectl describe svc <service-name> -n <namespace>
```

最常见错误：

- selector 标签写错，根本没选到 Pod
- `targetPort` 写错，转到了容器没监听的端口
- 访问错了命名空间里的同名 Service
- Headless Service 被当成普通 Service 来理解

经验上：

> 如果 Service 自己就没配对，后面看再多 kube-proxy 和 CNI 都是浪费时间。

## 3. 第二层：看 EndpointSlice 有没有后端

如果 Service 没问题，下一步就看它后面有没有真实后端。

```bash
kubectl get endpointslice -n <namespace>
kubectl describe endpointslice <name> -n <namespace>
```

这里最关键的不是“Pod 活没活着”，而是：

- Pod 有没有被选中
- Pod readiness 是否通过
- 后端是否已经被摘掉

常见现象：

- Service 存在，但 EndpointSlice 里没有地址
- 只有部分 Pod 进入后端池
- 滚动发布时后端短暂为空

高频原因：

- selector 选错
- readiness probe 失败
- Pod 虽然 Running，但不 Ready
- 控制器还没来得及收敛

一个非常实用的结论：

> `curl Service` 不通，最常见的根因之一不是网络，而是 EndpointSlice 里根本没有可用后端。

如果想把这里的 EndpointSlice 收敛语义单独讲透，包括 `ready / serving / terminating`、`publishNotReadyAddresses` 和发布期摘流量边界，要继续看 [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)。

## 4. 第三层：看 kube-proxy 有没有把规则下发到节点

当 EndpointSlice 正常，但访问还是不通，就要看节点上的转发规则是否生效。

`kube-proxy` 常见负责：

- `ClusterIP` 的转发规则
- `NodePort` 的节点端口规则
- 把 Service VIP 映射到后端 Pod

这里的重点不是背 iptables / IPVS 命令，而是先确认：

- kube-proxy 自己是不是正常
- 节点有没有拿到最新规则
- 访问失败是不是只发生在个别节点

先看 kube-proxy 状态：

```bash
kubectl get pods -n kube-system -l k8s-app=kube-proxy
kubectl logs -n kube-system <kube-proxy-pod>
```

典型故障：

- 某个节点的 kube-proxy 异常，导致这个节点访问 Service 不通
- NodePort 只有部分节点能通
- EndpointSlice 已更新，但规则还没及时同步

如果问题只在单节点出现，而不是全集群出现，优先怀疑：

- 节点上的 kube-proxy
- 节点网络配置
- 节点上的 CNI 状态

## 5. 第四层：看 CNI 和跨节点网络

如果 Service、EndpointSlice、kube-proxy 都像是正常的，但跨节点就是不通，才真正进入 CNI 层。

这一层通常负责：

- Pod IP 分配
- 节点间路由 / 隧道
- 跨节点转发
- NetworkPolicy 的实际执行

常见问题：

- 同节点 Pod 可通，跨节点 Pod 不通
- Pod 有 IP，但出不了本节点
- 某些节点上的 Pod 全部网络异常
- 开了 NetworkPolicy 之后部分流量被挡住

这时重点看：

- CNI Pod 是否健康
- 节点间路由是否正常
- Overlay / Underlay 是否断
- NetworkPolicy 是否误杀

通常先查：

```bash
kubectl get pods -n kube-system
kubectl logs -n kube-system <cni-pod>
```

如果你的现象是：

- 访问 ClusterIP 失败
- 但仅限跨节点

那大概率比起应用问题，更值得先查 CNI。

## 6. 第五层：别忘了 Pod 和应用自己也会出错

很多所谓“K8s 网络问题”，最后根本不是网络，而是应用没准备好。

你至少要确认：

- 容器端口真的在监听
- 应用没有只监听 `127.0.0.1`
- readiness 没把自己摘掉
- 应用层协议没写错

常见误判：

- Pod Running，但业务进程没起来
- 容器对外声明 8080，应用实际监听 9090
- 应用只绑定本地回环地址，导致 Pod IP 访问失败
- HTTP 正常，gRPC / TCP 协议却根本不是同一个端口

排到这一步时，通常要回到 Pod 内部看：

```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
kubectl exec -it <pod-name> -n <namespace> -- sh
```

## 7. 最短排障顺序

如果线上真的有一个“Service 访问不通”的告警，建议先按下面顺序走。

<K8sDiagram kind="network-troubleshooting-playbook" />

### 第 1 步：看 Service

- Service 名称、命名空间、端口、selector 是否正确

### 第 2 步：看 EndpointSlice

- 有没有后端
- 后端是不是 Ready

### 第 3 步：看 Pod

- 目标 Pod 是否存活
- 应用端口是否监听
- readiness 是否异常

### 第 4 步：看 kube-proxy

- 节点规则是否同步
- 问题是否只在某些节点发生

### 第 5 步：看 CNI / NetworkPolicy

- 是否只有跨节点不通
- 是否有策略拦截

经验上，前 3 步能覆盖掉大多数问题。

## 8. 把常见现象和根因对应起来

| 现象 | 最先怀疑什么 | 原因解释 |
| --- | --- | --- |
| Service 存在，但请求超时 | EndpointSlice 空、readiness 失败 | Service 有壳，后面没后端 |
| 同节点能通，跨节点不通 | CNI / 路由 / Overlay | 数据面跨节点异常 |
| 只有某个节点访问 Service 不通 | kube-proxy / 节点网络 | 节点局部规则或网络有问题 |
| Pod Running，但 Service 访问失败 | 端口没监听 / 只监听 127.0.0.1 | 应用层问题伪装成网络问题 |
| 开了 NetworkPolicy 后部分不通 | Policy selector 写错 | 不是网络坏了，是被策略挡了 |
| 发布期间偶发失败 | readiness / EndpointSlice 收敛 / preStop | 控制面和流量面切换不同步 |

## 9. 一个面试里的标准答法

如果面试官问：

> K8s 里 Service 不通，你怎么排查？

你可以按这套答：

> 我会按控制面对象到数据面的顺序排。  
> 先看 Service 的 selector、端口和命名空间是否正确；  
> 再看 EndpointSlice 里有没有 Ready 后端，因为很多问题本质上是后端没进池；  
> 然后看目标 Pod 本身是否真的监听了端口；  
> 如果对象都没问题，再去查节点上的 kube-proxy 规则和 CNI 跨节点网络；  
> 如果现象只在某些节点上出现，优先怀疑节点局部问题；如果是跨节点才不通，优先怀疑 CNI 或路由；  
> 排障顺序越靠近 Service 和 EndpointSlice，通常越快定位，不会一上来就陷进抓包。  

## 10. 最后记住这句话

> K8s 网络排障不要先把锅甩给 CNI。很多“网络不通”其实是 Service selector 配错、EndpointSlice 没后端、readiness 失败，或者 Pod 根本没监听端口。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [节点执行链路实战](./node-execution-chain.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
