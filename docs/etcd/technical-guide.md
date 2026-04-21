---
title: Etcd 核心机制：Raft、Revision、Lease 与 Watch
description: 从一致性定位出发，系统整理 etcd 的 Raft 多数派、MVCC revision、Lease / TTL / KeepAlive、Watch / compaction 和线性一致性读。
---

# Etcd 核心机制：Raft、Revision、Lease 与 Watch

这页解决一个核心问题：etcd 为什么能承担“关键元数据存储”这个角色。只要把 Raft、多数派、revision、Lease、Watch 和一致性读串起来，etcd 的大部分工程判断都会自然落位。

## 适合谁看

- 想把 etcd 从“会用命令”提升到“能解释设计逻辑”的人
- 面试中经常被问到 revision、Lease、Watch、强一致读的人
- 需要维护 K8s、服务注册发现、配置中心等依赖 etcd 的系统

## 快速导航

- [先立住 etcd 的定位](#先立住-etcd-的定位)
- [Raft、Leader 与多数派](#raftleader-与多数派)
- [MVCC、revision 与版本元数据](#mvccrevision-与版本元数据)
- [Lease、TTL 与 KeepAlive](#leasettl-与-keepalive)
- [Watch、事件顺序与 compaction](#watch事件顺序与-compaction)
- [读一致性：linearizable 与 serializable](#读一致性linearizable-与-serializable)
- [常见误区](#常见误区)

## 先立住 etcd 的定位

etcd 本质上是一个**强一致的分布式 KV 存储**。它特别适合下面这类数据：

- 服务实例注册信息
- 配置项与配置版本
- Leader 身份与锁状态
- 集群成员信息
- 调度任务的元数据和状态

这些数据有两个共性：

1. 数据量不大
2. 一旦读错、写乱、顺序错，就会引发更大的系统问题

所以 etcd 的目标从来不是替代 MySQL、Redis 或消息队列，而是把“少量但关键”的元数据一致性守住。

## Raft、Leader 与多数派

etcd 的一致性基础来自 **Raft**。理解 etcd，至少要先把这条写入主线说顺：

1. 集群同一时刻只有一个 Leader 负责处理写请求
2. Leader 把写操作封装成日志条目复制给 Follower
3. 只有当日志被**多数派**确认后，这次写入才算提交成功
4. 提交后的变更再应用到状态机，形成用户能看到的 KV 数据

### 多数派到底意味着什么

如果集群一共有 `N` 个节点，可提交写入至少需要：

`floor(N/2) + 1`

这就是 quorum，也叫多数派。

| 节点数 | 多数派 | 最多容忍故障数 |
| --- | --- | --- |
| 1 | 1 | 0 |
| 2 | 2 | 0 |
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 3 | 2 |

由这个表直接能推出两个高频结论：

- **2 节点并不比 1 节点更高可用**
- **4 节点并不比 3 节点更能抗故障**

所以 etcd 生产集群通常部署 3 节点或 5 节点，而不是 2 节点或 4 节点。

### Leader 切换意味着什么

Leader 掉线、网络隔离或无法维持多数派时，会触发重新选举。重新选举期间：

- 已提交数据不会丢
- 未提交写入可能失败或回滚
- 线性一致性读写会短暂受影响

这也是为什么 etcd 对**磁盘延迟、网络抖动、跨机房 RTT** 都很敏感。你看到的往往不是“etcd 挂了”，而是 Leader 因为环境抖动变得不稳定。

## MVCC、revision 与版本元数据

etcd 不是一个简单的 `key -> value` 哈希表，它内部采用 **MVCC** 模型。理解 etcd 的读写、Watch 和 CAS，关键就在理解 revision。

### 四个必须分清的字段

| 字段 | 含义 | 常见用途 |
| --- | --- | --- |
| `revision` | 全局递增版本号，每次成功写入都会推进 | Watch 从某个 revision 继续追事件 |
| `create_revision` | 当前 Key 首次创建时的 revision | 判断谁先创建，常用于锁和选主 |
| `mod_revision` | 当前 Key 最近一次修改时的 revision | CAS 更新、防并发覆盖 |
| `version` | 当前 Key 被修改过的次数 | 判断是否首次写入 |

### 先看一个小例子

假设初始 revision 为 100。

1. `put /svc/a = v1` 成功后，全局 revision 变成 101
2. `put /svc/b = v1` 成功后，全局 revision 变成 102
3. `put /svc/a = v2` 成功后，全局 revision 变成 103

这时：

- `/svc/a`
  - `create_revision = 101`
  - `mod_revision = 103`
  - `version = 2`
- `/svc/b`
  - `create_revision = 102`
  - `mod_revision = 102`
  - `version = 1`

要注意两点：

- `revision` 是**全局序列**，不是单个 Key 自己增长
- 不同 Key 的变更可以通过 revision 放进同一条时间线上

这正是 Watch、配置增量推送、本地缓存重建能成立的基础。

## Lease、TTL 与 KeepAlive

Lease 是 etcd 里最值得优先掌握的能力之一。它解决的是“这个 Key 的生命周期由谁负责”的问题。

### Lease 的核心语义

- Lease 有 TTL
- 一个 Lease 可以绑定多个 Key
- TTL 到期后，绑定的 Key 会自动删除
- 客户端通过 KeepAlive 续租，证明自己仍然活着

### 为什么服务注册必须靠 Lease

服务注册并不是简单写一个 `/services/user/instance-1` 的 Key，而是：

1. 申请一个 Lease
2. 把实例 Key 绑定到这个 Lease
3. 持续 KeepAlive

这样当实例进程崩溃、节点网络隔离、探活线程退出时：

- KeepAlive 停止
- Lease 超时
- Key 自动被删除
- Watch 该前缀的消费者能感知实例下线

这其实是一种“基于生命周期的被动健康检查”。

### TTL 怎么看更合理

TTL 不是越短越好，也不是越长越安全。

- 太短：网络轻微抖动就可能误删实例
- 太长：实例真挂了却很久不摘除

工程上更重要的是根据业务故障感知时间来定，而不是只盯续租开销。

## Watch、事件顺序与 compaction

Watch 是 etcd 能支撑服务发现、配置热更新和本地缓存同步的关键能力。

### Watch 的本质

Watch 不是“订阅字符串变化”，而是：

- 从一个指定 revision 开始
- 按 revision 顺序消费后续事件
- 用事件流把本地状态追到最新

所以 etcd 的 Watch 更接近“可恢复的有序增量流”，而不是传统 pub/sub。

### 一个稳定的消费模型

客户端一般会按下面的方式维护本地缓存：

1. 先 `Get(prefix)` 拉全量
2. 记住返回头里的最新 revision
3. 从 `revision + 1` 开始 Watch
4. 按事件顺序把本地缓存增量更新

这个模型的优点是：

- 启动时能构造完整初始状态
- 断线后能尝试从旧 revision 补事件
- 事件没丢时，不需要每次全量拉取

### compaction 为什么会让 Watch 失败

etcd 不会无限保存历史版本。为了控制存储体积，会做 compaction，把较老 revision 的历史版本裁掉。

如果客户端断线太久，重新追的 revision 已经被压缩掉，就会收到 **compacted** 错误。此时正确处理方式通常是：

1. 放弃旧 revision 的增量追赶
2. 重新全量 `Get`
3. 记录新的 revision
4. 再从新 revision 继续 Watch

所以一个成熟的 Watch 客户端必须天然支持“全量重建 + 增量续追”。

## 读一致性：linearizable 与 serializable

理解 etcd，不只要看写一致性，也要看读语义。

### Linearizable Read

特点：

- 读到的是当前全局一致视图
- 适合读取锁状态、Leader 身份、关键配置、核心元数据
- 一致性最强，但延迟和协调成本更高

### Serializable Read

特点：

- 允许读到稍旧的数据
- 更快，但不保证一定是最新值
- 适合对实时性没那么敏感的场景，比如非关键列表查询或容忍短暂旧值的状态观察

### 最稳妥的工程判断

- 只要这个值会影响决策正确性，就按 **linearizable** 理解
- 只有在明确能接受旧值时，才考虑 **serializable**

不要为了追求一点点读性能，把锁状态、选主身份或关键配置读成旧值。

## 常见误区

### 1. 把 etcd 当缓存或数据库用

错误点：

- 想把大量业务对象直接放 etcd
- 想做高频写入或大范围扫描

更稳的理解：

- etcd 负责关键元数据
- 业务数据仍然应由数据库、缓存或对象存储承担

### 2. 只知道 Watch，不知道 revision

错误点：

- 把 Watch 当简单订阅
- 不记 revision
- 断线后不会补偿

后果：

- 本地缓存很容易和真实状态漂移

### 3. 锁不绑定 Lease

错误点：

- 只做条件写入，不做自动过期

后果：

- 客户端死掉后，锁永远留在系统里

### 4. 以为节点多就等于高可用

错误点：

- 只盯着“还有几台机器活着”

更准确的说法：

- etcd 高可用看的是 quorum，不是活节点总数

## 小结

etcd 这条主线可以压缩成一句话：

> etcd 用 Raft 保证写入经多数派提交，用 MVCC revision 给所有变更排出全局顺序，再用 Lease、Watch 和一致性读把服务注册、配置推送、选主和锁这些关键元数据场景稳住。

如果你已经把这页吃顺，下一步最适合去看 [场景与模式：注册发现、配置中心、选主与分布式锁](./scenarios-patterns.md)，把机制转成工程用法。最后再用 [Etcd 必备问题与自检清单](./essential-questions.md) 把这些概念压缩成稳定口径。想继续往实现里下钻时，再看 [Etcd 源码阅读入口与实现链路](./source-reading-guide.md)。
