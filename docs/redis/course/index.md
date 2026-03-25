---
title: Redis 核心技术与实战
description: 极客时间《Redis 核心技术与实战》按讲整理，覆盖基础篇、实践篇、未来篇、加餐篇与期中测试。
---

# Redis 核心技术与实战

> 整理自极客时间《Redis 核心技术与实战》（蒋德钧），按章节收敛到 `Redis` 专题，方便和缓存治理、客户端源码、高并发案例一起串读。

<RedisCourseDiagram kind="course-map" />

## 这套课程解决什么问题

- 用一条清晰主线把 Redis 的基础架构、持久化、复制、高可用、缓存治理和工程实践串起来
- 把“会用 Redis”推进到“知道为什么这样设计、出了问题该怎么排查”
- 让 `Redis` 专题里的通用实践文档和极客时间课程笔记形成互补

## 内容结构


### 开篇词

| # | 标题 |
| --- | --- |
| 开篇词 | [这样学Redis，才能技高一筹](./00-preface.md) |

### 基础篇（01-10）

| # | 标题 |
| --- | --- |
| 01 | [基本架构：一个键值数据库包含什么？](./01-basic-architecture.md) |
| 02 | [数据结构：快速的Redis有哪些慢操作？](./02-slow-operations.md) |
| 03 | [高性能IO模型：为什么单线程Redis能那么快？](./03-high-performance-io.md) |
| 04 | [AOF日志：宕机了，Redis如何避免数据丢失？](./04-aof-log.md) |
| 05 | [内存快照：宕机后，Redis如何实现快速恢复？](./05-rdb-snapshot.md) |
| 06 | [数据同步：主从库如何实现数据一致？](./06-replication-consistency.md) |
| 07 | [哨兵机制：主库挂了，如何不间断服务？](./07-sentinel-mechanism.md) |
| 08 | [哨兵集群：哨兵挂了，主从库还能切换吗？](./08-sentinel-cluster.md) |
| 09 | [切片集群：数据增多了，是该加内存还是加实例？](./09-cluster-sharding.md) |
| 10 | [第1～9讲课后思考题答案及常见问题答疑](./10-foundation-qa.md) |

### 实践篇（11-38）

| # | 标题 |
| --- | --- |
| 11 | [“万金油”的String，为什么不好用了？](./11-string-pitfalls.md) |
| 12 | [有一亿个keys要统计，应该用哪种集合？](./12-billion-keys-set-selection.md) |
| 13 | [GEO是什么？还可以定义新的数据类型吗？](./13-geo-and-custom-types.md) |
| 14 | [如何在Redis中保存时间序列数据？](./14-time-series-data.md) |
| 15 | [消息队列的考验：Redis有哪些解决方案？](./15-message-queue-solutions.md) |
| 16 | [异步机制：如何避免单线程模型的阻塞？](./16-async-mechanism.md) |
| 17 | [为什么CPU结构也会影响Redis的性能？](./17-cpu-architecture-impact.md) |
| 18 | [波动的响应延迟：如何应对变慢的Redis？（上）](./18-latency-spike-part1.md) |
| 19 | [波动的响应延迟：如何应对变慢的Redis？（下）](./19-latency-spike-part2.md) |
| 20 | [删除数据后，为什么内存占用率还是很高？](./20-memory-after-delete.md) |
| 21 | [缓冲区：一个可能引发“惨案”的地方](./21-buffer-risks.md) |
| 22 | [第11～21讲课后思考题答案及常见问题答疑](./22-practice-qa-1.md) |
| 23 | [旁路缓存：Redis是如何工作的？](./23-cache-aside.md) |
| 24 | [替换策略：缓存满了怎么办？](./24-eviction-policy.md) |
| 25 | [缓存异常（上）：如何解决缓存和数据库的数据不一致问题？](./25-cache-consistency.md) |
| 26 | [缓存异常（下）：如何解决缓存雪崩、击穿、穿透难题？](./26-cache-anomalies.md) |
| 27 | [缓存被污染了，该怎么办？](./27-cache-pollution.md) |
| 28 | [Pika: 如何基于SSD实现大容量Redis？](./28-pika-ssd.md) |
| 29 | [无锁的原子操作：Redis如何应对并发访问？](./29-atomic-operations.md) |
| 30 | [如何使用Redis实现分布式锁？](./30-distributed-lock.md) |
| 31 | [事务机制：Redis能实现ACID属性吗？](./31-transaction-acid.md) |
| 32 | [Redis主从同步与故障切换，有哪些坑？](./32-replication-failover-pitfalls.md) |
| 33 | [脑裂：一次奇怪的数据丢失](./33-split-brain-data-loss.md) |
| 34 | [第23~33讲课后思考题答案及常见问题答疑](./34-practice-qa-2.md) |
| 35 | [Codis VS Redis Cluster：我该选择哪一个集群方案？](./35-codis-vs-redis-cluster.md) |
| 36 | [Redis支撑秒杀场景的关键技术和实践都有哪些？](./36-seckill-practice.md) |
| 37 | [数据分布优化：如何应对数据倾斜？](./37-data-skew.md) |
| 38 | [通信开销：限制Redis Cluster规模的关键因素](./38-cluster-communication-overhead.md) |

### 未来篇（39-41）

| # | 标题 |
| --- | --- |
| 39 | [Redis 6.0的新特性：多线程、客户端缓存与安全](./39-redis6-new-features.md) |
| 40 | [Redis的下一步：基于NVM内存的实践](./40-nvm-practice.md) |
| 41 | [第35～40讲课后思考题答案及常见问题答疑](./41-future-qa.md) |

### 加餐篇（42-48）

| # | 标题 |
| --- | --- |
| 加餐（一） | [经典的Redis学习资料有哪些？](./42-extra-learning-resources.md) |
| 加餐（二） | [Kaito：我是如何学习Redis的？](./43-extra-learning-method.md) |
| 加餐（三） | [Kaito：我希望成为在压力中成长的人](./44-extra-growth-under-pressure.md) |
| 加餐（四） | [Redis客户端如何与服务器端交换命令和数据？](./45-extra-client-server-protocol.md) |
| 加餐（五） | [Redis有哪些好用的运维工具？](./46-extra-ops-tools.md) |
| 加餐（六） | [Redis的使用规范小建议](./47-extra-usage-guidelines.md) |
| 加餐（七） | [从微博的Redis实践中，我们可以学到哪些经验？](./48-extra-weibo-practice.md) |

### 期中测试（49-50）

| # | 标题 |
| --- | --- |
| 期中测试题 | [一套习题，测出你的掌握程度](./49-midterm-quiz.md) |
| 期中测试题答案 | [这些问题，你都答对了吗？](./50-midterm-quiz-answers.md) |

### 结束语

| # | 标题 |
| --- | --- |
| 结束语 | [从学习Redis到向Redis学习](./51-conclusion.md) |


## 建议阅读顺序

1. 先看开篇词和基础篇 `01-09`，把 Redis 的整体架构、IO 模型、持久化、复制和哨兵体系搭起来。
2. 再看实践篇 `11-21`，理解不同数据类型、异步机制、CPU 结构和延迟抖动这些“为什么会慢”的根因。
3. 然后读 `23-33`，把缓存治理、分布式锁、事务、故障切换和脑裂这些生产问题串起来。
4. 最后补 `35-40` 和加餐篇，把集群选型、秒杀实践、Redis 6.0、新硬件方向与运维经验补齐。

## 结合本专题一起看

- [Redis 专题总览](../index.md)
- [Redis 实践与缓存穿透/击穿/雪崩](../redis-and-cache-patterns.md)
- [Redis 高并发、集群部署与分布式锁](../high-concurrency-cluster-locks.md)
- [go-redis 客户端源码精读](/golang/guide/source-reading/go-redis)
- [支付系统 Redis 实战](../payment-practice.md)
