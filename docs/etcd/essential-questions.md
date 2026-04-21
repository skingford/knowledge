---
title: Etcd 必备问题与自检清单
description: 按由浅入深整理 Etcd 高频问题与稳定回答口径，覆盖定位、Raft、多数派、revision、Lease、Watch、Txn、读一致性与运维边界。
---

# Etcd 必备问题与自检清单

这页适合最后复习。目标不是把所有命令和概念都背成定义，而是把 etcd 最常被追问的问题压缩成一套稳定口径。

比较稳的回答顺序通常是：

- 先说 etcd **解决什么问题**
- 再说它依赖的 **一致性机制**
- 最后补一句 **适用场景、边界或常见误区**

如果你回答 etcd 总是在“Raft、Lease、Watch、锁”这些词之间来回跳，但讲不成一条线，这页就是为这个问题准备的。

## 1. 定位与边界：先把 etcd 说对

**1. Etcd 到底是什么？**

- 它是一个强一致的分布式 KV 存储
- 更准确地说，它是为关键元数据设计的一致性存储，而不是通用业务数据库
- 它最擅长的是“数据量不大，但错了后果很重”的场景

**2. Etcd 最常解决哪些问题？**

- 服务注册与发现
- 配置中心
- Leader 选举
- 分布式锁
- 集群状态、调度元数据、协调信息保存

一句话：

> etcd 不是为了存大量业务数据，而是为了把关键元数据的一致性守住。

**3. 为什么 etcd 适合元数据，不适合业务主库？**

- etcd 的强项是强一致和有序变更，不是海量数据吞吐
- 大对象、高频业务写入、长列表扫描都会让它偏离设计目标
- 业务主库更适合 MySQL / PostgreSQL，缓存更适合 Redis，这样职责边界更清晰

**4. Etcd 和 Redis 最大的区别怎么讲？**

- Redis 更偏性能、缓存和丰富数据结构，不默认等于强一致协调系统
- etcd 更偏强一致元数据存储，核心价值在 quorum、revision、Lease、Watch
- 面试里最稳的说法不是“谁更快”，而是“它们解决的问题不是一类”

**5. 为什么说 etcd 不是消息队列？**

- Watch 提供的是状态变更流，不是业务消息队列语义
- 它不适合承载海量消息堆积、逐条确认、复杂消费组这种模式
- 把 Watch 当 MQ，用着用着就会碰到 compaction、回补和存储压力问题

## 2. 一致性与版本模型：把 Raft 和 revision 串起来

**6. Etcd 为什么能保证强一致？**

- 因为它依赖 Raft 共识协议
- 同一时刻只有一个 Leader 负责处理写请求
- 写入只有在被多数派确认后才算提交成功

一句话：

> etcd 的强一致不是“某个节点说了算”，而是“Leader 提案并经 quorum 提交”。

**7. 为什么 etcd 集群通常部署 3 个或 5 个节点？**

- 因为 etcd 依赖多数派工作，高可用关键是 quorum 是否还在
- 3 节点可以容忍 1 节点故障，5 节点可以容忍 2 节点故障
- 2 节点并不比 1 节点更高可用，4 节点也不比 3 节点更能抗故障

**8. Leader 挂掉后会发生什么？**

- Follower 在选举超时后会发起新一轮选举
- 重新形成多数派后，会产生新的 Leader
- 已提交数据不会丢，未提交写入可能失败或被放弃

**9. 什么叫 quorum，多数派为什么这么重要？**

- quorum 就是可达成提交或选举的最小多数节点集合
- etcd 真正关心的不是“还有多少台机器活着”，而是“剩下的节点还能不能组成多数派”
- 一旦失去 quorum，写入和很多一致性语义都会受影响

**10. `revision`、`create_revision`、`mod_revision`、`version` 分别是什么？**

- `revision`：全局递增版本号，每次成功写入都会推进
- `create_revision`：Key 首次创建时的 revision
- `mod_revision`：Key 最近一次修改时的 revision
- `version`：当前 Key 被修改过多少次

**11. 为什么说 `revision` 是 etcd 的核心概念？**

- 因为它把所有写入排成了一条全局顺序
- Watch、CAS、本地缓存重建都依赖这条顺序
- 不理解 revision，就很容易把 etcd 误解成一个普通 KV 哈希表

**12. Watch 为什么不是简单 pub/sub？**

- Watch 依赖 revision，不是只订阅“以后发生的变化”
- 客户端可以从某个 revision 开始追后续事件
- 这使得它天然适合本地缓存增量同步，而不只是临时消息通知

**13. 遇到 compaction 导致 watch 追不上，该怎么答？**

- etcd 会清理旧 revision 的历史版本
- 如果客户端要追的 revision 已经被压缩掉，就会遇到 compacted
- 正确处理方式通常是：重新全量拉取，再从新的 revision 继续 Watch

## 3. 生命周期与条件写：把 Lease、Txn、锁、选主说成一套模型

**14. Lease 到底解决什么问题？**

- Lease 负责 Key 的生命周期管理
- TTL 到期后，绑定的 Key 会自动删除
- KeepAlive 让客户端能够持续续租，证明自己仍然活着

**15. 为什么服务注册一定要绑 Lease？**

- 因为服务实例可能宕机、断网或心跳线程退出
- 如果注册 Key 不绑定 Lease，实例死了以后注册信息不会自动清理
- 绑定 Lease 后，TTL 到期能自动摘除脏实例

**16. TTL 应该怎么理解，为什么不是越大越好？**

- TTL 太短，轻微抖动就可能误删实例
- TTL 太长，真实故障会被感知得很慢
- TTL 的本质是故障感知窗口，不只是“续租频率设置”

**17. Etcd 的事务能力主要用来做什么？**

- 主要用来做条件写入，而不是复杂业务事务
- 高频模式是 Compare-And-Swap
- 常见用法包括幂等创建、乐观并发控制、分布式锁和 Leader 选举

**18. 为什么分布式锁和 Leader 选举本质上是同一类问题？**

- 它们都在解决“同一时刻只能有一个拥有者”的问题
- 都依赖原子竞争和自动失效
- 所以本质上都是 `Txn + Compare + Lease`

**19. 为什么锁一定要和 Lease 绑定？**

- 如果进程挂了但锁还留着，其他客户端就可能永远拿不到锁
- 绑定 Lease 后，持有者失联时锁可以自动释放
- 所以 etcd 锁真正可靠的前提不是“抢到了”，而是“持有生命周期能自动结束”

**20. CAS 更新为什么常用 `mod_revision`？**

- 因为它能表达“只有这个 Key 从我读取后没被别人改过，才允许我写”
- 这本质上是乐观锁
- 配置发布、防覆盖更新、抢占式更新都很常见

## 4. 读语义与生产边界：别只会 API

**21. `linearizable read` 和 `serializable read` 怎么区分？**

- `linearizable`：读到当前全局一致视图，适合关键状态
- `serializable`：可能读到稍旧值，但延迟更低
- 锁状态、Leader 身份、关键配置这类信息，默认应该优先按 `linearizable` 理解

**22. 为什么 etcd 对磁盘和网络这么敏感？**

- 因为 Raft 写入依赖日志复制和落盘
- 磁盘 fsync 慢会拉高写延迟，网络抖动会影响心跳和复制
- 所以很多 etcd 故障表面上像“切主”，本质上是磁盘或网络不稳

**23. `snapshot`、`compact`、`defrag` 分别是干什么的？**

- `snapshot`：做备份和恢复准备
- `compact`：清理旧 revision 的历史版本
- `defrag`：整理底层存储文件，回收物理空间

一句话：

> `compact` 解决历史版本逻辑膨胀，`defrag` 解决底层空间整理，它们不是一回事。

**24. 为什么不能把 etcd 备份恢复理解成“拷贝 data dir”？**

- 因为恢复不仅是文件问题，还涉及 cluster 元数据和成员关系
- 尤其是重建新集群时，member 和 peer 配置都可能变化
- 更稳的理解是：snapshot 是恢复入口，恢复流程要和成员关系一起看

**25. 看到 no space、写入失败时第一反应应该是什么？**

- 先看是不是 etcd 后端空间接近 quota
- 再看 compaction / defrag 是否长期没做
- 同时排查是否写入了不合理的大对象或近期变更异常增加

**26. member add / remove 为什么不能随便做？**

- 因为这会直接改变集群成员关系
- 做之前必须先确认当前仍有 quorum
- 如果误删成员或在错误时机替换节点，问题会从单节点故障升级成集群故障

## 5. 场景延伸：把 etcd 放回真实系统里

**27. Etcd 在 Kubernetes 控制面里扮演什么角色？**

- 它保存集群期望状态和关键对象状态
- `kube-apiserver` 负责写入和读取入口
- controller、scheduler 等组件通过 watch 感知变化，再做各自决策

**28. Etcd 在 Patroni 这类高可用方案里扮演什么角色？**

- 它保存数据库实例状态、Leader 身份和协调信息
- Patroni 利用 etcd 的强一致和租约能力避免双主
- 这里 etcd 存的不是业务数据，而是高可用控制面的元数据

## 6. 学完 etcd 后你应该形成的稳定口径

- etcd 是强一致分布式 KV，重点是关键元数据，不是业务大数据
- 高可用看的不是“活节点数”，而是 quorum 是否还在
- revision 是全局顺序，Lease 是生命周期，Watch 是增量同步，Txn 是条件写
- 服务注册、锁、选主本质上都能压成 `Lease + Watch + Txn/CAS`
- 关键状态优先按 `linearizable` 理解，不要随便接受旧值
- 生产上必须知道 snapshot、compact、defrag、quota、member replace 这些边界
- 真正的 etcd 能力不只是“会命令”，而是“能把原理、场景和排障讲成一条线”

## 关联资料

- [Etcd 专题总览](./index.md)
- [Etcd 核心机制：Raft、Revision、Lease 与 Watch](./technical-guide.md)
- [Etcd 场景与模式：注册发现、配置中心、选主与分布式锁](./scenarios-patterns.md)
- [Etcdctl 常用命令与实验手册](./etcdctl-commands-and-lab.md)
- [Etcd 运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md)
- [Etcd 故障场景演练与排障实验手册](./failure-drills-and-troubleshooting-lab.md)
- [Etcd 源码阅读入口与实现链路](./source-reading-guide.md)
- [RPC、注册发现与配置](/golang/guide/08-rpc-discovery-config)
- [Raft 共识算法详解](/algorithm/raft)
- [PostgreSQL 高可用集群整理](/postgresql/ha-cluster)
- [Kubernetes 专题](/k8s/)
