---
title: 高并发支付系统专题整理：PostgreSQL 篇
description: 聚焦支付系统里的 PostgreSQL 高频考点，覆盖 MVCC、索引、锁与事务、批量写入、分区表与高可用治理。
---

# 高并发支付系统专题整理：PostgreSQL 篇

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [上一篇：MySQL 篇](./high-concurrency-payment-mysql.md)
- [下一篇：Redis 篇](./high-concurrency-payment-redis.md)

## 适合谁看

- 已经熟悉 MySQL，但准备切到 PostgreSQL 或同时维护两套数据库
- 面试里需要回答 PostgreSQL 的 MVCC、锁、分区表、批量写入、高可用
- 想把支付场景里的账务、流水、审计类表结构和 PostgreSQL 能力对应起来

## 你会得到什么

- 一套围绕 PostgreSQL 特性的支付场景答题框架
- 从 MVCC、索引、事务到分区和高可用的系统复习路径
- `pgx`、`CopyFrom`、`LISTEN/NOTIFY` 这些 PostgreSQL 特色能力的实战入口

## 建议复习顺序

1. 先看 MVCC、索引、锁，补数据库基本盘
2. 再看批量写入和分区表，补大规模数据处理能力
3. 最后看高可用、复制延迟、故障恢复，补生产治理视角

## 对应资料导航

- [pgx：PostgreSQL 原生驱动](/golang/guide/source-reading/pgx-driver)
- [PostgreSQL 高可用集群整理](/architecture/postgresql-ha-cluster)
- [database/sql：高级事务与批量插入](/golang/guide/source-reading/database-sql-advanced)

## PostgreSQL 高频问题总览

建议先用表格快速区分：

| 题目 | 核心矛盾 | 典型风险 | 首先要答什么 |
| --- | --- | --- | --- |
| MVCC 与可见性 | 并发读写不阻塞，但版本增多 | 膨胀、VACUUM 压力 | 可见性 + 版本回收 |
| 索引与查询计划 | 索引类型选错 | 顺序扫描、随机 IO 高 | B-Tree/GIN/BRIN 适用场景 |
| 锁与事务 | 长事务、锁冲突 | 阻塞、死锁、RT 抖动 | 锁粒度 + 事务边界 |
| 批量写入 | 单条 INSERT 往返多 | 吞吐低、延迟高 | `CopyFrom` / Batch |
| 分区表 | 单表数据量过大 | 索引膨胀、归档慢 | 按时间/商户分区 |
| 高可用与复制 | 主从切换、复制延迟 | RPO/RTO 风险 | WAL、流复制、Patroni |

## PostgreSQL 高频考点

> 这几个问题可以按“MVCC -> 索引 -> 锁事务 -> 批量写入 -> 分区扩容 -> 高可用”的顺序准备，先把单机能力讲清，再讲集群治理。

### **MVCC 和可见性怎么答**

<details>
<summary><strong>MVCC 和可见性怎么答？</strong></summary>

> PostgreSQL 的 MVCC 核心是：每条记录可能存在多个版本，读请求根据事务快照决定能看到哪个版本，因此读写不必互相阻塞。

回答时建议固定三步：

1. 先讲事务快照：每个事务启动后拿到一个可见性视图
2. 再讲记录版本：更新不会原地覆盖，而是生成新版本
3. 最后讲版本回收：老版本需要靠 `VACUUM` 清理，否则会表膨胀

支付场景里要特别强调：

- 订单表、流水表更新频繁，长事务会拖慢老版本回收
- 如果对账查询、报表查询跑成长事务，容易放大膨胀和 autovacuum 压力

一句话总结：

> PostgreSQL 的 MVCC 让读写并发更友好，但代价是必须认真治理长事务和版本回收。

</details>

### **索引与查询计划怎么答**

<details>
<summary><strong>索引与查询计划怎么答？</strong></summary>

> PostgreSQL 不只有 B-Tree。面试里最好能讲出“不同索引类型对应不同查询形态”，而不是只会说建索引能加速查询。

建议先记这张表：

| 索引类型 | 适用场景 | 支付系统例子 |
| --- | --- | --- |
| B-Tree | 等值、范围、排序 | 订单号、商户号、创建时间 |
| GIN | 数组、JSONB、全文检索 | 风控标签、扩展属性 JSONB |
| BRIN | 超大表按时间顺序写入 | 按时间增长的流水归档表 |

回答时可按这个顺序：

1. 高频 OLTP 查询优先 B-Tree
2. JSONB 检索不要硬套 B-Tree，考虑 GIN
3. 超大时间序列表可以用 BRIN 降低索引体积
4. 查询计划必须靠 `EXPLAIN ANALYZE` 验证，不靠感觉

</details>

### **锁与事务怎么答**

<details>
<summary><strong>锁与事务怎么答？</strong></summary>

> PostgreSQL 的并发控制虽然依赖 MVCC，但更新、删除、`SELECT ... FOR UPDATE` 这类操作依然会遇到锁冲突。支付系统里最怕的是长事务、热点行、跨表顺序不一致。

答题顺序建议固定：

1. 先讲现象：接口 RT 抖动、锁等待高、死锁回滚
2. 再讲根因：长事务、热点账户、更新顺序不一致、缺少合适索引
3. 最后讲治理：缩短事务、统一更新顺序、补索引、幂等重试

如果要落到 PostgreSQL 特色，可以补：

- `FOR UPDATE` / `FOR NO KEY UPDATE` 的区别
- 死锁排查可看 `pg_locks`、`pg_stat_activity`
- 长事务会拖慢 VACUUM，副作用往往比单次锁冲突更大

</details>

### **批量写入怎么答**

<details>
<summary><strong>批量写入怎么答？</strong></summary>

> PostgreSQL 的批量写入不要只会循环 `INSERT`。在高并发支付场景里，流水归档、审计日志、离线回填这类场景更适合 `COPY` 协议。

建议对比：

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| 单条 INSERT | 简单直观 | 往返多，吞吐低 |
| Batch | 减少网络往返 | 仍是 SQL 逐条执行 |
| `CopyFrom` / COPY | 吞吐最高 | 适合批量导入，不适合复杂单条业务逻辑 |

支付场景可这样答：

- 实时主链路还是短事务单笔写入
- 离线回填、流水归档、补偿重放优先走 `CopyFrom`
- 如果需要“写库 + 发消息”原子性，仍然以事务和 outbox 为主，不要把 COPY 混到强事务主链路里

</details>

### **分区表怎么答**

<details>
<summary><strong>分区表怎么答？</strong></summary>

> PostgreSQL 的分区表特别适合支付流水、审计日志、账务明细这类按时间增长且保留周期长的数据。

建议固定讲这三点：

1. 为什么分：单表过大，索引膨胀，归档和清理成本高
2. 怎么分：常见按月、按日、按商户维度拆分
3. 代价是什么：跨分区查询复杂度提升，主键/唯一约束设计更难

支付系统里比较稳的表述是：

- 交易订单：更偏 OLTP，可按商户或业务维度拆
- 支付流水：更偏时间序列，优先按月/按日分区
- 历史归档：热冷分离，冷数据迁入归档库或对象存储

</details>

### **高可用与复制怎么答**

<details>
<summary><strong>高可用与复制怎么答？</strong></summary>

> PostgreSQL 高可用的核心是 WAL + 流复制 + 自动故障切换。面试里不要只说主从，而要把 RPO、RTO、同步策略一起讲出来。

建议按这个框架回答：

1. WAL 流复制是基础
2. Patroni + etcd + HAProxy 是常见生产方案
3. 同步复制更稳，但吞吐更低；异步复制性能更好，但可能丢最近提交的数据
4. 复制延迟、旧主回收、`pg_rewind`、备份恢复都要提前设计

一句话总结：

> PostgreSQL 高可用不是只解决切主，而是要同时考虑复制延迟、脑裂防护、备份恢复和连接切换。

</details>

## 支付语境下的典型追问

建议先用追问表快速过一遍：

| 追问 | 本质 | 常见答案方向 |
| --- | --- | --- |
| 为什么 PostgreSQL 长事务问题很重 | 老版本回收被拖住 | MVCC + VACUUM |
| 流水表为什么适合分区 | 单表太大、归档困难 | 时间分区 + 热冷分离 |
| 什么时候用 `CopyFrom` | 批量回填、归档导入 | 高吞吐离线写入 |
| 如何看复制延迟 | 主从同步滞后 | WAL lag、监控、只读流量控制 |

### **为什么 PostgreSQL 长事务问题很重**

<details>
<summary><strong>为什么 PostgreSQL 长事务问题很重？</strong></summary>

> 因为 PostgreSQL 的 MVCC 需要保留旧版本给老事务看。如果事务长时间不结束，旧版本就回收不了，表膨胀和 VACUUM 压力都会放大。

支付场景里最典型的问题是：

- 长时间跑报表
- 对账任务事务范围过大
- 连接没正确提交/回滚，事务一直挂着

</details>

### **流水表为什么适合分区**

<details>
<summary><strong>流水表为什么适合分区？</strong></summary>

> 流水表天然按时间增长，查询也常常带时间范围条件，所以非常适合做时间分区。这样可以降低单分区索引体积，也方便归档和清理。

</details>

### **什么时候用 `CopyFrom`**

<details>
<summary><strong>什么时候用 `CopyFrom`？</strong></summary>

> 当场景是批量导入、历史回填、离线迁移、流水归档时，`CopyFrom` 往往比逐条 `INSERT` 快得多。实时主交易链路不一定适合它，但离线链路非常适合。

</details>

### **如何看复制延迟**

<details>
<summary><strong>如何看复制延迟？</strong></summary>

> 核心是看主从 WAL 差距和回放延迟。延迟高时，读流量不要盲目打到从库，否则容易读到过旧数据，影响订单与账务查询一致性。

</details>

---

## 继续阅读

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [上一篇：MySQL 篇](./high-concurrency-payment-mysql.md)
- [下一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [案例总览](./index.md)
