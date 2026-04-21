---
title: etcd 专题
description: 系统整理 etcd 必须掌握的核心知识，覆盖一致性定位、Raft 多数派、MVCC revision、Lease / Watch、Txn / CAS、etcdctl 实操、部署与 TLS、线性一致性读和生产运维排障。
---

# etcd 专题

这个专题不想把 etcd 写成一堆孤立 API 笔记，而是想把它整理成一条能反复复用的主线：它为什么存在、靠什么保证一致性、为什么特别适合做注册中心和选主、线上出问题时又该怎么排。

很多人对 etcd 的理解停在“会 `put/get/watch`”。但真正拉开差距的，往往是下面这些能力：

- 能说明 etcd 解决的是哪类元数据一致性问题，而不是把它当万能数据库
- 能讲清楚 Raft、Leader、多数派、奇数节点和故障容忍之间的关系
- 能把 `revision`、`create_revision`、`mod_revision`、`version` 说成一套统一模型
- 能解释 Lease、KeepAlive、Watch、Compaction 为什么正好支撑服务注册、配置推送和本地缓存增量更新
- 能把分布式锁、Leader 选举、CAS 更新讲成 `Txn + Lease + revision` 的组合问题
- 能知道 snapshot、compact、defrag、quota、member replace 这些生产边界到底影响什么

## 适合谁看

- 正在用 Go、Kubernetes、Patroni 或服务治理系统，需要系统补齐 etcd 基础的人
- 已经接触过 etcd，但还停留在“知道能做注册中心”层面的人
- 面试里经常被追问一致性、Lease、Watch、分布式锁、线性一致性读的人
- 需要维护依赖 etcd 的基础设施，希望从“会用”升级到“会判断、会排障”的工程师

## 图例速览

etcd 最容易先混掉的，是“它是一个强一致 KV”这层定位，和“它怎么支撑注册发现、配置推送、选主与锁”这层落地。下面两张图先把使用主线立住，再往下读 revision、Lease、Watch 和 Txn 会顺很多。

### 1. 服务注册与 Lease 生命周期

<GoMicroserviceDiagram kind="service-registry" />

### 2. 服务发现与 Watch 增量更新

<GoMicroserviceDiagram kind="service-discovery-watch" />

## 快速导航

- [图例速览](#图例速览)
- [你至少要先立住什么](#你至少要先立住什么)
- [内容结构](#内容结构)
- [建议阅读顺序](#建议阅读顺序)
- [学完后建议能独立答清的问题](#学完后建议能独立答清的问题)
- [关联资料](#关联资料)

## 你至少要先立住什么

- etcd 是**强一致分布式 KV**，适合保存少量但非常关键的元数据
- etcd 的核心价值是**一致性与有序变更**，不是“海量数据吞吐”或“缓存命中性能”
- etcd 的高可用前提是**多数派还活着**，不是“还有机器没死”
- etcd 的 Watch 不是简单 pub/sub，而是**基于 revision 的增量同步**
- etcd 的服务注册、锁、选主，本质上都离不开 **Lease + Txn/CAS**
- etcd 的线上稳定性，不只取决于 API 用得对不对，还取决于快照、压缩、磁盘、成员变更和恢复流程

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [专题总览](./index.md) | etcd 的定位、学习主线、能力边界、阅读顺序和关联资料 |
| [核心机制：Raft、Revision、Lease 与 Watch](./technical-guide.md) | Leader / quorum、MVCC、revision 元数据、Lease、KeepAlive、Watch、compaction、线性一致性读 |
| [场景与模式：注册发现、配置中心、选主与分布式锁](./scenarios-patterns.md) | etcd 在服务治理中的典型落地方式，包含 Txn / CAS、幂等更新、本地缓存重建和常见误区 |
| [Etcdctl 常用命令与实验手册](./etcdctl-commands-and-lab.md) | 连接模板、KV / Watch / Lease / Txn、endpoint / member / snapshot 命令和一套可自测的小实验 |
| [Etcd 单机 / 3 节点部署与 TLS 证书实战](./deployment-and-tls-practice.md) | Linux 服务器上的目录规划、TLS 自签证书、配置文件、systemd、验证顺序和常见部署坑 |
| [Etcd 故障场景演练与排障实验手册](./failure-drills-and-troubleshooting-lab.md) | 单节点故障、Leader 切换、网络分区、NOSPACE、Watch compacted、成员替换与快照恢复演练 |
| [Etcd 必备问题与自检清单](./essential-questions.md) | 按由浅入深整理高频问题与稳定回答口径，适合面试准备和阶段复盘 |
| [Etcd 源码阅读入口与实现链路](./source-reading-guide.md) | 源码模块地图、推荐阅读顺序，以及从请求入口到 Raft、MVCC、Watch、WAL 的实现链路 |
| [运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md) | snapshot、restore、compact、defrag、quota、磁盘与网络敏感性、member replace 和值班排障顺序 |
| [RPC、注册发现与配置](/golang/guide/08-rpc-discovery-config) | 从 Go 服务视角看 etcd 的注册发现、Watch 和配置热更新 |
| [PostgreSQL 高可用集群整理](/postgresql/ha-cluster) | 从 Patroni 视角理解 etcd 作为一致性元数据存储的角色 |
| [Raft 共识算法详解](/algorithm/raft) | 如果要继续下钻一致性原理，可以单独系统补齐 Raft |

## 建议阅读顺序

1. 先读 [核心机制：Raft、Revision、Lease 与 Watch](./technical-guide.md)，把 etcd 的统一认知模型搭起来
2. 再读 [场景与模式：注册发现、配置中心、选主与分布式锁](./scenarios-patterns.md)，把 API 背后的工程用法讲成场景
3. 然后读 [Etcdctl 常用命令与实验手册](./etcdctl-commands-and-lab.md)，把 revision、Lease、Txn、snapshot 真正亲手跑一遍
4. 如果你要自己搭测试或正式集群，再读 [Etcd 单机 / 3 节点部署与 TLS 证书实战](./deployment-and-tls-practice.md)，把目录、证书、配置和验证顺序真正跑通
5. 接着读 [运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md)，把生产边界和排障主线补齐
6. 然后用 [Etcd 故障场景演练与排障实验手册](./failure-drills-and-troubleshooting-lab.md) 把单节点故障、选主、NOSPACE、compacted 和恢复演练真正做一遍
7. 如果你准备面试或阶段复盘，最后用 [Etcd 必备问题与自检清单](./essential-questions.md) 把口径压缩稳定
8. 如果你要深入实现，再读 [Etcd 源码阅读入口与实现链路](./source-reading-guide.md)，把 client、v3rpc、etcdserver、MVCC、WAL 和 Raft 的边界真正串起来
9. 再看 [RPC、注册发现与配置](/golang/guide/08-rpc-discovery-config)，把 Lease / Watch 放回 Go 微服务治理链路
10. 如果你要深入一致性原理，再读 [Raft 共识算法详解](/algorithm/raft)
11. 如果你关心数据库高可用，再读 [PostgreSQL 高可用集群整理](/postgresql/ha-cluster)，理解 etcd 在 Patroni 方案里的定位

## 学完后建议能独立答清的问题

### 1. 为什么 etcd 适合元数据，不适合业务主库

目标：

- 能说明 etcd 的强项是强一致和有序变更
- 能解释为什么大对象、长列表扫描和高频业务写入不适合放 etcd

### 2. 为什么 etcd 集群通常部署成 3 或 5 个节点

目标：

- 能把 quorum、多数派、故障容忍和奇数节点讲顺
- 能解释为什么 2 节点并不是高可用方案

### 3. 服务注册为什么一定要绑 Lease

目标：

- 能说明 TTL、KeepAlive 和自动摘除的关系
- 能解释实例宕机、网络断连和心跳线程退出时会发生什么

### 4. Watch 为什么不是简单订阅

目标：

- 能说明 Watch 是从 revision 追增量
- 能解释 compaction 之后为什么要全量重建再继续追

### 5. 分布式锁和选主为什么本质是同一类问题

目标：

- 能把 `Txn + Compare + Lease` 讲成一套统一模式
- 能解释为什么不绑 Lease 的锁会留下死锁风险

### 6. etcd 出现 no space、leader 频繁切换、watch 落后时先看什么

目标：

- 能按 snapshot、quota、磁盘延迟、网络抖动、compaction、成员状态组织排查顺序
- 能知道哪些问题是客户端误用，哪些问题是集群层面故障

### 7. 哪些 etcdctl 命令适合实验，哪些命令要慎上生产

目标：

- 能区分 `put/get/watch/lease/txn` 这类学习命令与 `member/compact/defrag` 这类运维命令
- 能知道 snapshot 后至少要做 status 校验，成员变更前先确认 quorum

### 8. 单机和 3 节点部署时，哪些配置最容易写错

目标：

- 能分清 `listen-*` 和 `advertise-*` 的职责
- 能知道证书 SAN、`initial-cluster-token`、`data-dir` 和 peer 端口互通为什么会影响集群能否真正起来

### 9. 如果开始读源码，应该先从哪几层包和哪条链路入手

目标：

- 能分清 `client/api`、`v3rpc`、`etcdserver`、`mvcc`、`backend/wal`、`raft` 这几层职责
- 能把一次 `put` 请求的实现主线和 `etcd` / `etcd/raft` 的边界讲清楚

### 10. 如果真要做故障演练，最值得先练哪几组场景

目标：

- 能把单节点故障、Leader 故障、quorum 丢失、NOSPACE、Watch compacted、snapshot restore 区分成不同问题类型
- 能知道每类故障该先看 `endpoint status/health/hashkv`、`member list`、日志还是恢复动作

## 关联资料

- [核心机制：Raft、Revision、Lease 与 Watch](./technical-guide.md)
- [场景与模式：注册发现、配置中心、选主与分布式锁](./scenarios-patterns.md)
- [Etcdctl 常用命令与实验手册](./etcdctl-commands-and-lab.md)
- [Etcd 单机 / 3 节点部署与 TLS 证书实战](./deployment-and-tls-practice.md)
- [运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md)
- [Etcd 故障场景演练与排障实验手册](./failure-drills-and-troubleshooting-lab.md)
- [Etcd 必备问题与自检清单](./essential-questions.md)
- [Etcd 源码阅读入口与实现链路](./source-reading-guide.md)
- [RPC、注册发现与配置](/golang/guide/08-rpc-discovery-config)
- [微服务与分布式总览](/golang/guide/08-microservices-distributed)
- [Raft 共识算法详解](/algorithm/raft)
- [PostgreSQL 高可用集群整理](/postgresql/ha-cluster)
- [Kubernetes 专题](/k8s/)
- [架构师学习路线](/architecture/architect-learning-roadmap)
