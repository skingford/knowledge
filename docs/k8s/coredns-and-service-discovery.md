---
title: CoreDNS 与服务发现实战
description: 系统讲清 Kubernetes 中服务名解析、CoreDNS、普通 Service DNS、Headless Service DNS、dnsPolicy、ndots 与常见服务发现排障方法。
---

# CoreDNS 与服务发现实战

很多团队把 K8s 里的“服务访问”只理解成 `Service`，但真正写业务时，你看到的往往不是 VIP，而是这些名字：

- `order-api`
- `order-api.default`
- `order-api.default.svc.cluster.local`
- `mysql-0.mysql.default.svc.cluster.local`

这说明在 Service 数据面之前，还有一层经常被忽略的能力：

- 服务发现
- DNS 解析
- 名称到稳定目标的映射

如果这层没讲清，`CoreDNS`、普通 `Service`、Headless Service、StatefulSet、`kube-proxy` 很容易被混成一题。

<K8sDiagram kind="service-discovery-chain" />

## 1. 先回答：服务发现到底解决什么问题

在 K8s 里，Pod IP 天生就是易变的：

- 滚动发布会变
- 重调度会变
- 节点故障迁移会变
- 扩缩容也会变

所以应用真正该依赖的，通常不是地址本身，而是一个稳定名字。

服务发现解决的就是：

- 让调用方记住稳定服务名，而不是 Pod IP
- 让服务名在后端变化时仍能解析到当前可用目标
- 让“访问一组服务”和“访问某个稳定成员”这两种需求被拆开

一句话：

> Service 负责稳定抽象，CoreDNS 负责名字解析，kube-proxy 负责把解析出来的稳定目标真正转到后端。

如果想单独把“Service 后端集合是谁维护的”“Ready 与终止状态怎么体现在后端对象里”“为什么一个 Service 会拆成多个 EndpointSlice”讲透，要继续看 [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)。

## 2. Pod 里为什么可以直接访问服务名

这不是应用自己魔法识别出来的，而是 Pod 启动时就拿到了一套 DNS 配置。

典型链路是：

1. Pod 启动后，容器里会生成 `/etc/resolv.conf`
2. 其中会带上集群 DNS Server 地址
3. 同时带上搜索域，例如 `<namespace>.svc.cluster.local`、`svc.cluster.local`、`cluster.local`
4. 应用发起 DNS 查询时，先按这些搜索域扩展名字
5. 查询最终被发给 CoreDNS

所以你在 `default` 命名空间里的 Pod 里直接访问：

```text
order-api
```

往往就能被扩展成：

```text
order-api.default.svc.cluster.local
```

## 3. CoreDNS 做什么，不做什么

`CoreDNS` 在 K8s 里主要负责：

- 响应集群内 Service 和 Pod 相关 DNS 查询
- 把普通 Service 名称解析到 `ClusterIP`
- 把 Headless Service 名称解析到后端 Pod 记录
- 转发集群外域名查询到上游 DNS

它不做的是：

- 不负责真正流量转发
- 不负责维护 Service 后端转发表
- 不负责 Pod 跨节点网络打通
- 不负责七层路由、TLS、Ingress 规则

所以这几个对象的边界要分清：

- `CoreDNS`：把名字翻译成地址
- `Service`：定义稳定抽象和访问入口
- `kube-proxy`：把访问入口落到当前后端
- `CNI`：让这些地址之间真的能通

## 4. 普通 Service 的 DNS 解析是什么结果

普通 `Service` 的典型解析结果是：

- 服务名解析到 `ClusterIP`
- 调用方连的是一个稳定 VIP
- 后面再由 `kube-proxy` 和数据面把流量分发到当前 Pod

也就是说，对普通 Service 来说：

```text
service name -> ClusterIP -> kube-proxy -> Pod
```

这类方式最适合：

- 无状态服务
- 调用方不关心后端具体是哪个实例
- 只关心“这组服务可访问”

## 5. Headless Service 的 DNS 解析为什么不一样

Headless Service 的关键配置是：

```yaml
spec:
  clusterIP: None
```

它和普通 Service 的根本差别是：

- 普通 Service 返回稳定 VIP
- Headless Service 不提供 VIP
- 它更偏向直接返回成员记录，让调用方自己看到后端成员

<K8sDiagram kind="service-dns-answer-map" />

因此它常用于：

- 需要成员级发现的数据库或中间件
- StatefulSet 成员互相发现
- 需要区分 `mysql-0`、`mysql-1` 这类具体成员的场景

这也是为什么：

- 普通 Service 更像“统一入口”
- Headless Service 更像“成员发现入口”

## 6. 为什么 StatefulSet 经常和 Headless Service 绑在一起

`StatefulSet + Headless Service` 这组组合真正解决的是：

- 稳定成员名
- 稳定成员 DNS
- 稳定卷绑定

例如：

- `mysql.default.svc.cluster.local` 这种更偏服务级别
- `mysql-0.mysql.default.svc.cluster.local` 这种更偏成员级别

所以它不是为了“固定 Pod IP”，而是为了：

- 让调用方稳定找到某个成员
- 让成员间互相发现时有固定命名
- 让节点重建后仍能以原成员身份回来

## 7. 解析顺序、命名空间和 FQDN 为什么经常踩坑

很多“DNS 不通”不是 CoreDNS 挂了，而是名字写错了。

### 7.1 同命名空间短名

同命名空间里常见直接写：

```text
order-api
```

### 7.2 跨命名空间至少要带 namespace

如果调用方在 `payment`，目标服务在 `default`，只写：

```text
order-api
```

通常不会命中 `default` 里的 Service。

这时更稳的是：

```text
order-api.default
```

或者直接写全限定名：

```text
order-api.default.svc.cluster.local
```

### 7.3 FQDN 更适合排障和跨团队场景

工程上一个很实用的经验是：

- 业务代码里可以接受短名
- 文档、排障命令、跨 namespace 配置更建议写 FQDN

因为这样不容易把“搜索域自动补全”误判成“DNS 自己乱了”。

## 8. `dnsPolicy` 和 `hostNetwork` 为什么要单独讲

不是所有 Pod 都天然拿同一套 DNS 行为。

常见的 `dnsPolicy` 包括：

- `ClusterFirst`：大多数普通 Pod 默认方式，优先使用集群 DNS
- `ClusterFirstWithHostNet`：`hostNetwork: true` 时常见需要显式使用
- `Default`：更接近继承节点默认解析配置
- `None`：完全自定义 `dnsConfig`

所以一个典型坑是：

- Pod 开了 `hostNetwork: true`
- 但仍按普通 Pod 心智去理解 DNS 行为
- 结果名字解析和预期不一致

这种问题必须先回到 Pod 里看：

```bash
kubectl exec -it <pod-name> -n <namespace> -- cat /etc/resolv.conf
```

## 9. `ndots` 为什么会让外部域名查询变慢

K8s Pod 里常见会带：

```text
options ndots:5
```

它的影响是：

- 点号数量不足的名字，会先按搜索域尝试
- 某些外部域名在真正查上游前，可能先经历多次集群内后缀拼接查询

例如应用访问某个外部域名时，如果名字不是完整限定名风格，就可能出现：

- 额外 DNS 查询
- 解析延迟放大
- CoreDNS 查询量升高

所以这类现象很典型：

- 服务本身没问题
- 但外部依赖偶发解析慢
- CoreDNS QPS 偏高

这时除了看 CoreDNS，也要看应用传入的域名写法和 DNS 缓存策略。

## 10. 为什么有时 Service 在，但调用方还是报“找不到主机”

这类现象常见有几类原因：

### 10.1 名字写错或 namespace 理解错

最常见，也最容易忽略。

### 10.2 CoreDNS 自己异常

例如：

- CoreDNS Pod 不健康
- `kube-dns` Service 异常
- CoreDNS 后端 EndpointSlice 异常

### 10.3 `dnsPolicy` / `hostNetwork` 配置不符合预期

这类问题经常只影响部分 Pod，而不是全集群。

### 10.4 应用层自己缓存了旧解析结果

有些语言运行时、SDK、代理或长连接客户端会缓存 DNS 结果。

这时即使：

- Service 已更新
- CoreDNS 已能返回新结果

应用仍然可能还在用旧地址。

### 10.5 把服务发现问题误判成数据面问题

例如：

- 连服务名都解析不出来
- 却直接去查 `iptables` 或 `IPVS`

这时排障顺序就已经错了。

## 11. `publishNotReadyAddresses` 为什么偶尔会被追问

默认情况下，成员级 DNS 记录通常更希望只暴露“可被发现”的后端。

但某些分布式系统在 bootstrap 阶段需要：

- 成员先互相看见
- 即使还没完全 Ready，也要先被发现

这时就可能用到：

```yaml
publishNotReadyAddresses: true
```

它不是日常无状态服务的默认需求，而更像：

- 集群成员初始化
- 主从或副本集引导
- 需要更早暴露成员地址的中间件场景

## 12. 最短排障顺序

如果线上现象是：

- `curl service-name` 报找不到主机
- 某些 Pod 能解析，某些不能
- Headless Service 成员发现异常

建议顺序是：

1. 先看 Pod 内 `/etc/resolv.conf`
2. 再看名字是不是写对了 namespace / FQDN
3. 再看 `kube-system` 里的 CoreDNS Pod 和 `kube-dns` Service
4. 再看目标 Service / Headless Service 本身是否存在
5. 如果是 Headless Service，再看后端 Pod、readiness 和成员记录是否符合预期
6. 最后再看 `kube-proxy`、CNI 或应用自身 DNS 缓存

常用命令：

```bash
kubectl exec -it <pod-name> -n <namespace> -- cat /etc/resolv.conf
kubectl exec -it <pod-name> -n <namespace> -- nslookup kubernetes.default
kubectl exec -it <pod-name> -n <namespace> -- nslookup <service-name>.<namespace>.svc.cluster.local

kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get svc -n kube-system kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns

kubectl get svc -n <namespace>
kubectl get endpointslice -n <namespace> -l kubernetes.io/service-name=<service-name>
```

## 13. 一套面试答法

如果面试官问：

> K8s 里为什么大家访问的是服务名？CoreDNS、Service、Headless Service 分别干了什么？

你可以这样答：

> K8s 里 Pod IP 是动态的，所以业务通常不会直接记 Pod 地址，而是记服务名。  
> CoreDNS 负责把服务名解析成稳定目标；普通 Service 通常会解析到 ClusterIP，然后再由 kube-proxy 把流量转到当前 Pod；  
> Headless Service 则不提供 VIP，更偏向直接返回成员记录，所以常和 StatefulSet 配合做成员级发现；  
> 因此 Service 解决的是稳定抽象，CoreDNS 解决的是名字解析，Headless Service 解决的是成员发现方式，kube-proxy 解决的是后续数据面转发。  

## 14. 最后记住这句话

> 服务发现这层最重要的不是“DNS 能不能解析”，而是先分清：你要找的是一个稳定服务入口，还是某个稳定成员。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [EndpointSlice、Ready 与服务后端收敛边界实战](./service-backend-readiness-and-endpointslice.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
