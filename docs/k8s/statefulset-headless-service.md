---
title: StatefulSet 与 Headless Service 实战
description: 系统讲清 Kubernetes 中 StatefulSet 和 Headless Service 如何提供稳定实例身份、稳定 DNS 名称和稳定持久卷，而不是固定 Pod IP。
---

# StatefulSet 与 Headless Service 实战

很多人第一次接触这组组合时，脑子里的翻译是：

- 我要给 Pod 固定 IP
- 我要像虚拟机那样固定住某台实例
- 我要让某个数据库节点永远不变

这几个理解都不准确。

在 Kubernetes 里，`StatefulSet + Headless Service` 真正解决的不是“固定 Pod IP”，而是：

- 稳定实例身份
- 稳定 DNS 名称
- 稳定持久卷绑定

<K8sDiagram kind="statefulset-stable-identity" />

## 1. 先回答它到底解决什么问题

无状态服务最常见的诉求是：

- 服务整体可访问
- 后端副本可以随时扩缩
- 某个具体 Pod 换掉也没关系

所以这类场景通常直接用：

- `Deployment`
- `Service`

但有状态组件关心的往往不是“一组副本”，而是“第几个成员是谁”。

例如：

- MySQL 主从节点
- Kafka broker
- ZooKeeper / etcd 成员
- Redis Sentinel
- 需要按序号表达分片或角色的业务实例

这些系统更关心：

- `mysql-0` 和 `mysql-1` 不是同一个成员
- 一个成员重建后，身份还得延续
- 原来绑定的数据卷还要挂回原成员

一句话概括：

> `StatefulSet + Headless Service` 解决的是“稳定成员身份与成员发现”，不是“给 Pod 锁死一个 IP”。

## 2. 为什么普通 Service 不够

普通 `Service` 很适合做“稳定入口”，但它抽象的是一组 Pod，而不是某个确定成员。

它更适合：

- `api.default.svc` 这种服务级访问
- 负载均衡到任意可用副本
- 调用方不关心后面到底是哪一个 Pod

但有状态场景经常需要：

- 精确访问某个成员
- 让成员之间彼此知道对方是谁
- 让节点重建后还能接回自己的存储和身份

这时如果还用普通 Service 的思路，就容易出现两个问题：

- 只能访问“某个可用 Pod”，但无法稳定访问“某个具体成员”
- Pod 一重建，原先硬编码的 IP 就彻底失效

## 3. StatefulSet 到底稳定了哪三件事

### 3.1 稳定 Pod 名称

StatefulSet 会按 ordinal 给成员编号，例如：

- `mysql-0`
- `mysql-1`
- `mysql-2`

这些名字不是一次性的临时命名，而是成员身份的一部分。

即使某个 Pod 被删除重建，只要它仍是那个 ordinal，它还是原来的名字。

### 3.2 稳定 DNS 名称

如果 StatefulSet 配合 Headless Service 使用，每个成员都能拿到稳定 DNS 名称，例如：

- `mysql-0.mysql.default.svc.cluster.local`
- `mysql-1.mysql.default.svc.cluster.local`
- `mysql-2.mysql.default.svc.cluster.local`

注意这里稳定的是名称，不是 IP。

成员当前 Pod IP 可以变化，但这个 DNS 名称始终代表对应 ordinal 的实例。

### 3.3 稳定 PVC 绑定

StatefulSet 通常还会通过 `volumeClaimTemplates` 为每个成员创建独立 PVC，例如：

- `data-mysql-0`
- `data-mysql-1`
- `data-mysql-2`

这样某个成员重建后，挂回的仍然是它自己的卷，而不是别人的卷。

这对数据库和消息队列这类组件非常关键。

## 4. Headless Service 真正做了什么

Headless Service 的关键配置是：

```yaml
spec:
  clusterIP: None
```

它和普通 Service 的区别在于：

- 普通 Service 会给你一个虚拟 VIP
- Headless Service 不提供 VIP
- 它更像“成员发现入口”，让 DNS 直接返回 Pod 记录

<K8sDiagram kind="headless-service-dns" />

所以它的重点不是负载均衡，而是发现。

一句话区分：

- 普通 Service 稳定的是“一组服务入口”
- Headless Service 稳定的是“成员解析方式”

## 5. 这套组合怎么连起来

最关键的连接点有两个：

- Headless Service
- StatefulSet 里的 `serviceName`

一个典型骨架如下：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
    - name: mysql
      port: 3306
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.4
          ports:
            - containerPort: 3306
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 20Gi
```

这里的关键点是：

- `clusterIP: None` 让 Service 变成 Headless Service
- `serviceName: mysql` 让 StatefulSet 成员挂到这个 DNS 域下
- `volumeClaimTemplates` 让每个成员拥有自己的卷

## 6. 最适合哪些场景

这套组合通常适合以下类型：

### 场景 1：需要稳定成员身份的数据库

例如：

- MySQL 主从
- PostgreSQL 主备
- MongoDB 副本集

原因不是数据库“不能跑在 K8s”，而是它们往往需要：

- 固定成员名
- 独立持久卷
- 较保守的更新和重建节奏

### 场景 2：需要成员间互相发现的中间件

例如：

- Kafka broker
- ZooKeeper
- etcd

这类系统的成员之间往往不是“随便来一个都一样”，而是明确区分节点角色和编号。

### 场景 3：业务上真的有“实例语义”

例如：

- 固定分片实例
- 有主备角色的业务节点
- 需要按实例编号分配任务的服务

## 7. 它和 Deployment + Service 的本质差别

| 维度 | Deployment + Service | StatefulSet + Headless Service |
| --- | --- | --- |
| 核心目标 | 稳定服务入口 | 稳定成员身份 |
| 调用粒度 | 一组副本 | 某个具体成员 |
| 实例名称 | 通常不稳定 | 按 ordinal 稳定 |
| 网络发现 | Service VIP / DNS | 成员级 DNS |
| 存储绑定 | 常共享或无状态 | 每个成员独立 PVC |
| 更新与缩容 | 更偏弹性和批量治理 | 更偏保守和顺序控制 |

所以一个很实用的判断标准是：

> 如果你关心“这个服务能不能访问”，优先想 Service；如果你关心“第几个成员是谁”，优先想 StatefulSet。

## 8. 再深入一点：为什么它更适合有状态系统

StatefulSet 之所以常和数据库、中间件绑定，不只是因为名字更稳定，还因为它的操作语义更保守。

默认理解下，你应该记住：

- 成员通常按顺序创建
- 缩容时通常按逆序删除
- 更新比 Deployment 更强调有序和稳定

这类语义更适合：

- 集群初始化
- 主从切换
- 分片成员恢复
- 避免多个关键成员同时被动到

如果你拿这套机制去跑纯无状态 Web 服务，通常就是“能跑，但不划算”。

## 9. 最容易踩的坑

### 坑 1：把它理解成固定 Pod IP

这是最常见误解。

StatefulSet 稳定的是：

- Pod 名
- DNS 名
- PVC 绑定

不是 Pod IP。

### 坑 2：只上 StatefulSet，不配 Headless Service

如果没有 Headless Service，你通常拿不到成员级稳定 DNS 发现能力，这套组合就只完成了一半。

### 坑 3：把普通业务服务都改成 StatefulSet

很多业务只是无状态 API，并不需要成员身份、独立卷和保守更新。

这时上 StatefulSet 往往只会增加复杂度。

### 坑 4：以为 Headless Service 还能像普通 Service 一样做 VIP 负载均衡

它的重点是解析，不是统一 VIP 转发。

### 坑 5：成员启动顺序和 readiness 没配好

即使用了 StatefulSet，如果：

- readiness 不准确
- 初始化脚本没处理好
- 集群 bootstrap 逻辑有竞态

一样会在启动或滚动更新时出问题。

## 10. 一套面试答法

如果面试官问：

> 为什么数据库、Kafka 这类组件更常用 StatefulSet，而不是 Deployment？

你可以这样答：

> 因为这类组件很多时候需要稳定成员身份，而不是只要一组可用副本。  
> Deployment 更适合无状态服务，它解决的是副本数和滚动发布；  
> StatefulSet 则更适合有状态系统，因为它能提供稳定的 Pod 名称、配合 Headless Service 提供稳定成员 DNS，再配合 volumeClaimTemplates 提供成员级独立 PVC。  
> 所以稳定的不是 Pod IP，而是实例身份、成员发现方式和卷绑定关系。  
> 对数据库、消息队列、协调服务这类需要区分成员角色的系统，这种语义会更合适。  

## 11. 最后记住这句话

> `StatefulSet + Headless Service` 的核心不是“固定住一个 IP”，而是让同一个成员即使重建，也还能以原来的名字、原来的发现方式和原来的卷继续回来。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [etcd 专题](/etcd/)
