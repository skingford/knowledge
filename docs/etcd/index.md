---
title: etcd 专题
description: 系统整理 etcd 必须掌握的核心知识，涵盖 Raft、多数派、MVCC revision、Lease/Watch、Txn/CAS、读一致性与生产运维边界。
---

# etcd 专题

这个专题先不追求“大而全”，而是把 etcd 从“知道能做注册中心”提升到“理解一致性存储系统”的层面，先收敛必须掌握的知识点，后续再继续扩展源码、部署和故障排查。

## 适合谁看

- 正在使用 Go 做微服务，需要把服务注册发现、配置中心和选主机制答清楚
- 已经接触过 `etcd`，但还停留在“会 `put/get/watch`”层面
- 需要维护 Patroni、Kubernetes、服务治理系统等依赖 etcd 的基础设施
- 面试里经常被追问一致性、Lease、Watch、分布式锁，但回答还不成体系

## 先建立定位

etcd 本质上是一个**强一致的分布式 KV 存储**，适合保存体量小但一致性要求高的元数据。

典型场景：

- 服务注册与发现
- 配置中心
- Leader 选举
- 分布式锁
- 集群成员信息、调度元数据、任务状态

不适合直接拿 etcd 干的事：

- 存大对象、海量业务数据
- 当消息队列使用
- 当 OLTP 数据库使用
- 高频写入、长列表扫描类业务数据

> 面试里先把定位说对：etcd 不是“高性能缓存”，也不是“万能数据库”，它解决的是少量关键元数据的一致性问题。

## 必须掌握知识点

### 1. etcd 到底解决什么问题

| 场景 | etcd 提供的核心能力 | 典型结果 |
| --- | --- | --- |
| 服务注册 | Key + Lease + Watch | 实例上下线自动感知 |
| 配置中心 | KV + Revision + Watch | 配置可追版本并实时推送 |
| Leader 选举 | Txn + Lease | 同时只有一个节点拿到领导权 |
| 分布式锁 | Compare-And-Swap + Lease | 拿锁和自动释放都可控 |
| 集群元数据 | 强一致写入 | 避免多节点看见不同状态 |

必须能说出的结论：

- etcd 适合存**少量关键元数据**
- etcd 的核心价值是**一致性**，不是单纯“快”
- 用 etcd 的场景通常都是“错了会出大事”的场景

### 2. Raft、多数派与为什么一定要奇数节点

etcd 的一致性基础是 **Raft**。至少要掌握下面这条主线：

- 集群同一时刻只有一个 Leader 负责处理写请求
- 写请求必须复制到**多数派**节点后，才算提交成功
- Leader 挂掉后，Follower 会发起新一轮选举
- 选举和日志复制都依赖 `term`、日志索引和多数派确认

必须能答出来的点：

- **3 节点集群可容忍 1 节点故障**
- **5 节点集群可容忍 2 节点故障**
- **2 节点并不比 1 节点更高可用**，因为它仍然需要多数派
- **偶数节点没有优势**，只会增加同步成本，不会提高容错上限

标准口径：

> etcd 依赖多数派工作，真正的高可用不是“还有机器活着”，而是“还能凑出 quorum”。所以生产上通常部署 3 或 5 个节点，而不是 2 或 4 个节点。

### 3. MVCC、Revision 和版本元数据

etcd 不是简单的 `key -> value` 映射，它内部是 **MVCC** 模型。这个点不懂，后面 Lease、Watch、Txn 都讲不深。

必须掌握的几个字段：

| 字段 | 含义 | 典型用途 |
| --- | --- | --- |
| `revision` | 全局递增版本号，每次成功写入都会推进 | Watch 从某个版本继续追 |
| `create_revision` | 这个 Key 第一次创建时的 revision | 判断谁先创建 |
| `mod_revision` | 这个 Key 最近一次修改时的 revision | CAS、幂等更新 |
| `version` | 这个 Key 被修改过多少次 | 判断是否首次写入 |

必须理解的结论：

- `revision` 是**全局**的，不是单个 Key 私有的
- Watch 的本质不是“监听字符串”，而是“从某个 revision 开始追增量事件”
- 历史版本不是无限保存，后面会被 compaction 清理

### 4. Lease、TTL 与 KeepAlive

Lease 是 etcd 里非常核心的生命周期管理机制。

- 一个 Lease 可以绑定多个 Key
- Lease 有 TTL，到期后绑定 Key 会自动删除
- 客户端通过 KeepAlive 持续续租，证明自己还活着

这正是 etcd 适合做服务注册和临时节点的原因。

<GoMicroserviceDiagram kind="service-registry" />

必须掌握的结论：

- 服务实例注册时，不是简单 `put` 一个 Key，而是**把 Key 绑定到 Lease**
- 进程崩溃、网络断开或 KeepAlive 停止后，Lease 到期，Key 会自动清理
- 租约是 etcd 里“谁还活着”的统一判断单元

常见误区：

- 只 `put` 不绑定 Lease，实例宕机后注册信息变脏
- KeepAlive 线程退出但业务线程还活着，导致实例被误删
- 一个超大 TTL 试图“减少续租成本”，结果把故障感知时间拉得很长

### 5. Watch、Revision 与 Compaction

Watch 是 etcd 最常见、也最容易答浅的能力。

<GoMicroserviceDiagram kind="service-discovery-watch" />

必须掌握的点：

- Watch 不是从“现在”开始听，而是可以从**指定 revision** 开始追
- etcd 按 revision 顺序推送事件，适合本地缓存增量更新
- 如果你要追的 revision 已经被压缩掉，就会遇到 **compacted**
- 遇到 compaction 后，正确做法通常是：**先全量拉取，再从新的 revision 继续 Watch**

标准口径：

> etcd 的 Watch 依赖 revision，所以它不是简单的 pub/sub。它能保证事件顺序，但前提是客户端要处理好断线重连和 compaction 回跳。

### 6. Txn、CAS 与分布式锁/选主

etcd 的事务能力通常不是拿来做复杂业务事务，而是做**条件更新**。

核心模式是 Compare-And-Swap：

- 如果某个 Key 不存在，则创建
- 如果 `mod_revision` 还是旧值，则更新
- 如果 `version == 0`，则说明这是首次写入

这类能力能直接支撑：

- 分布式锁
- Leader 选举
- 幂等发布
- 配置抢占式更新

常见答法：

| 需求 | etcd 的实现思路 |
| --- | --- |
| 分布式锁 | `Txn(compare create_revision == 0)` + Lease |
| Leader 选举 | 谁先成功写入选举 Key，谁持有领导权；Lease 失效后重新选 |
| 防止覆盖更新 | 比较 `mod_revision`，只有版本没变才允许写 |

必须强调的一点：

- **锁必须和 Lease 绑定**

否则进程死了，锁不会自动释放，系统很快就会卡死在“拿不到锁但锁主已不存在”的状态。

### 7. 读一致性：Linearizable 与 Serializable

这部分是 etcd 和很多“普通 KV”真正拉开差距的地方。

必须分清：

- **写请求**：本质上走 Raft 提交，保证强一致
- **Linearizable Read**：读到的是当前全局一致视图，代价更高
- **Serializable Read**：允许读取稍旧的数据，延迟更低，但可能不是最新值

面试里最稳的说法：

> etcd 的强项是线性一致性。配置发布、选主、锁状态、关键元数据读写，都应该优先按 linearizable 语义理解；只有在明确能接受旧值时，才考虑 serializable 读来换延迟。

### 8. 生产里必须知道的运维边界

如果只会 API，不懂运维边界，生产上一出问题就会很被动。

必须掌握的点：

- **快照与恢复**：etcd 需要定期做 `snapshot save`，恢复时要清楚是“原地恢复”还是“新集群 restore”
- **Compaction / Defrag**：历史版本清理后要结合整理磁盘空间，否则空间不会自动回收干净
- **磁盘延迟很关键**：Raft 日志落盘慢，会直接拉高写延迟和选举抖动
- **告警要看 quota/no space**：空间打满时会影响写入
- **成员变更要按流程做**：坏节点替换、扩缩容不能直接暴力改配置

必须能答出来的结论：

- etcd 对磁盘和网络延迟都敏感
- etcd 挂一个节点不一定有事，**失去多数派一定有事**
- etcd 的备份恢复不是“拷贝 data dir”这么简单，必须按快照和成员关系处理

## 面试前至少要背下来的清单

- etcd 是强一致分布式 KV，适合元数据，不适合业务大数据
- 高可用关键不是“节点多”，而是“多数派还在”
- 3 节点容 1 故障，5 节点容 2 故障；2 节点不是高可用方案
- 理解 `revision / create_revision / mod_revision / version`
- Lease = 临时 Key 生命周期管理；服务注册、锁、选主都离不开它
- Watch 依赖 revision，遇到 compaction 要全量重建本地状态
- 分布式锁和选主本质是 `Txn + Lease`
- 关键状态默认按 linearizable 理解，不能随便接受陈旧读
- 生产一定要知道 snapshot、compact、defrag、quota、member replace

## 建议阅读顺序

1. 先把本页完整读完，建立 etcd 的统一框架
2. 再看 [RPC、注册发现与配置](/golang/guide/08-rpc-discovery-config)，把 Lease/Watch 放回 Go 服务治理场景
3. 最后看 [PostgreSQL 高可用集群整理](/postgresql/ha-cluster)，理解 etcd 在 Patroni 方案里的角色

## 关联资料

- [RPC、注册发现与配置](/golang/guide/08-rpc-discovery-config)
- [微服务与分布式总览](/golang/guide/08-microservices-distributed)
- [PostgreSQL 高可用集群整理](/postgresql/ha-cluster)
- [架构师学习路线](/architecture/architect-learning-roadmap)
