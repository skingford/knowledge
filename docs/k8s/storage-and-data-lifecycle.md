---
title: 存储与数据链路实战
description: 系统讲清 Kubernetes 中 PV、PVC、StorageClass、CSI、扩容、回收策略与常见挂载故障的排查方法。
---

# 存储与数据链路实战

K8s 存储这条线最容易把几件事混在一起：

- 谁在申请卷
- 谁真正创建卷
- 谁负责把卷挂到节点上
- 为什么 PVC 一直 Pending
- 为什么 Pod 明明起来了，卷还是挂不上
- 为什么删了对象之后，数据就没了

如果这些边界不先拆开，排查存储问题时很容易一头扎进应用日志，最后方向全错。

<K8sDiagram kind="storage-data-chain" />

## 1. 先把四个对象讲清楚

### 1.1 PVC：应用的申请单

`PersistentVolumeClaim` 解决的是：

- 应用需要多大的存储
- 需要什么访问模式
- 希望用哪类存储

PVC 表达的是“我要一个卷”，不是卷本身。

### 1.2 PV：真正的卷资源

`PersistentVolume` 更接近：

- 已存在或动态创建出来的卷资源

它代表的通常是：

- 云盘
- NFS
- Ceph 卷
- 其他后端存储

### 1.3 StorageClass：供给模板

`StorageClass` 解决的是：

- 用什么后端
- 用什么参数
- 回收策略是什么
- 是否允许扩容

它不是卷本身，而是“怎么造卷”的模板。

### 1.4 CSI：真正干活的驱动层

`CSI` 负责的是：

- 创建卷
- attach 到节点
- mount 到 Pod
- 扩容和卸载

所以如果你看到：

- PVC 已经绑定了
- 但 Pod 还是挂载失败

优先怀疑的通常不是 PVC 对象，而是 CSI 或节点挂载链路。

## 2. 一条完整链路到底怎么走

一次动态供给的标准链路，大致是：

1. Pod 引用一个 PVC
2. PVC 指向某个 `StorageClass`
3. 控制器根据 `StorageClass` 触发动态供给
4. CSI 创建真实卷，生成或绑定 PV
5. PV 和 PVC 完成绑定
6. Pod 被调度到节点后，CSI 再把卷 attach / mount 上去

这里最容易答错的点是：

> PVC 绑定成功，不等于卷已经成功挂到业务进程里。

绑定和挂载是两个阶段。

## 3. 为什么 StatefulSet 常和 PVC 绑在一起

你在有状态场景里几乎总会同时看到：

- `StatefulSet`
- `volumeClaimTemplates`

原因很简单：

- `StatefulSet` 给你稳定成员身份
- `volumeClaimTemplates` 给每个成员独立卷

例如：

- `mysql-0` 对应 `data-mysql-0`
- `mysql-1` 对应 `data-mysql-1`

这样成员重建时，数据可以跟着成员身份继续回来。

所以从设计上看：

- `StatefulSet` 稳定的是成员身份
- PVC / PV 稳定的是数据归属

## 4. 存储里最常见的几个关键字段

### 4.1 accessModes

最常见的有：

- `ReadWriteOnce`
- `ReadOnlyMany`
- `ReadWriteMany`

最容易踩坑的是 `ReadWriteOnce`。

很多人把它理解成：

- 只能一个 Pod 挂

更准确的理解是：

- 通常只能被一个节点以读写方式挂载

所以多节点切换、滚动迁移时更容易遇到 `Multi-Attach` 之类问题。

### 4.2 reclaimPolicy

这决定卷在释放后的处理方式，常见有：

- `Delete`
- `Retain`

这不是无关紧要的默认值，而是直接关系到：

- 删除 PVC 后，后端卷会不会跟着被删

如果你对数据保留有明确要求，这个字段必须在设计阶段就讲清楚。

### 4.3 allowVolumeExpansion

这决定这个存储类是否允许扩容。

如果业务容量增长很常见，但 `StorageClass` 不支持扩容，后面就只能靠迁移和重建兜底。

### 4.4 volumeBindingMode

一些存储类会使用：

- `Immediate`
- `WaitForFirstConsumer`

`WaitForFirstConsumer` 的价值在于：

- 先等 Pod 真正要被调度到哪里
- 再结合拓扑信息去创建卷

这对多可用区环境尤其重要。

## 5. 常见现象怎么分型

先不要上来就看 CSI 日志，先按现象分型。

<K8sDiagram kind="volume-failure-playbook" />

### 5.1 PVC 一直 Pending

优先怀疑：

- `StorageClass` 写错或不存在
- 没有可用 PV
- 容量或 access mode 对不上
- 动态供给没有成功

### 5.2 Pod 事件里出现挂载失败

优先怀疑：

- CSI 控制器或节点插件异常
- attach / mount 过程失败
- 节点上缺少依赖
- 凭证或后端存储权限有问题

### 5.3 Multi-Attach 报错

优先怀疑：

- 同一个 `ReadWriteOnce` 卷还在旧节点占用
- Pod 重调度太快，旧 attach 尚未释放
- 控制器切换和卷解绑有时序问题

### 5.4 删除后数据不见了

优先怀疑：

- `reclaimPolicy=Delete`
- 删除的是 PVC 还是后端卷
- 平台是否还做了自动清理

## 6. 一个比较稳的配置骨架

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: csi.example.com
reclaimPolicy: Retain
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-api
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 20Gi
```

这段配置表达的是：

- 用 `fast-ssd` 这类存储模板
- 卷删除后先保留，不自动删底层数据
- 支持后续扩容
- 等 Pod 真正落到节点再结合拓扑供给
- 当前应用需要一个 20Gi 的 RWO 卷

## 7. 一个实用排查顺序

如果线上出现“有状态服务起不来”或“卷挂不上”，建议优先按这个顺序查：

1. 先看 PVC 状态是不是 `Pending`
2. 再看 PV 是否已经绑定，以及两边 `storageClassName`、容量、access mode 是否匹配
3. 再看 `StorageClass` 的 provisioner、扩容能力、回收策略和绑定模式
4. 如果绑定没问题，再看 Pod 事件里的 mount / attach 报错
5. 最后才深入 CSI controller / node plugin 日志和节点级挂载问题

经验上，前 3 步能排掉大多数“卷根本没准备好”的问题。

## 8. 最容易踩的坑

### 坑 1：把 PVC 当成卷本身

PVC 只是申请，不是后端磁盘。

### 坑 2：只看绑定成功，不看挂载阶段

绑定成功后，CSI 还要真的把卷挂到节点和容器里。

### 坑 3：不了解 reclaimPolicy 就直接删 PVC

很多数据事故都发生在这一步。

### 坑 4：RWO 卷跨节点迁移想当然

在滚动更新、故障切换时，这类卷更容易碰到时序问题。

### 坑 5：把所有有状态组件都当成“卷一挂就行”

数据库、中间件还会涉及启动顺序、成员身份、拓扑和恢复时间，不只是挂载成功这么简单。

### 坑 6：扩容只改 PVC，不确认底层支持

不是所有 `StorageClass` 都支持在线扩容。

## 9. 一套面试答法

如果面试官问：

> Kubernetes 里 PV、PVC、StorageClass、CSI 分别做什么？卷挂不上怎么排？

你可以这样答：

> 我会先把角色拆开。  
> PVC 是应用对存储的申请，PV 是真实卷资源，StorageClass 是动态供给模板，CSI 是真正负责创建、attach、mount 和扩容的驱动层。  
> 所以卷问题要分阶段看：如果 PVC 一直 Pending，先查 StorageClass、容量、access mode 和是否成功供给；如果 PVC 已绑定但 Pod 挂载失败，再看 CSI 和节点挂载链路。  
> 另外要特别关注 reclaimPolicy、RWO 的多节点边界和是否支持扩容，因为这些字段会直接影响数据安全和故障恢复。  

## 10. 最后记住这句话

> 存储问题最怕把“申请、供给、绑定、挂载”四个阶段混成一团。先分阶段，再分对象，排查速度会快很多。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [节点执行链路实战](./node-execution-chain.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
