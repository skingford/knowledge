---
title: MySQL 专题
description: 系统整理 MySQL 核心知识，聚焦事务、查询优化、GORM、索引设计以及高并发场景下的锁、热点更新与分库迁移。
---

# MySQL 专题

这个专题把散落在 Go 学习大纲和高并发支付系统案例中的 MySQL 相关内容统一收敛，方便按主题查阅和持续更新。

## 适合谁看

- 正在使用 Go 开发后端服务，需要和 MySQL 打交道的工程师
- 想系统掌握数据库连接池、事务、查询优化等生产级实践的开发者
- 准备技术面试，需要理清索引设计、死锁、热点更新等高频话题的人
- 希望从"能用"提升到"用好" MySQL 的后端工程师

## 内容结构

### 基础专题

从 Go 与 MySQL 的集成视角切入，掌握事务、查询优化和 ORM 的核心模式。`database/sql` 与连接池已经迁移到 Go 专题维护。

| 文档 | 覆盖内容 |
| --- | --- |
| [database/sql 与连接池（Go 专题）](/golang/guide/06-database-sql-and-connection) | `database/sql` 基础用法、Prepared Statements、连接池参数配置与监控 |
| [事务处理](./transaction-and-optimization.md) | 事务模式、隔离级别、悲观锁与乐观锁、大事务拆分与长事务治理 |
| [查询优化](./sql-optimization.md) | EXPLAIN 分析、索引使用、批量操作、游标分页 |
| [GORM实战](./orm-gorm.md) | GORM 基础 CRUD、N+1 问题、何时用原生 SQL |

### 并发专题

从支付系统实战角度整理的 MySQL 高频考点，适合补强索引、事务、锁和扩容方面的理解。

| 文档 | 核心矛盾 |
| --- | --- |
| [索引设计](./index-design.md) | 索引设计不合理 → 查询慢、扫描多 |
| [大事务拆分](./transaction-and-optimization.md#大事务拆分) | 事务范围过大 → 锁持有长、回滚成本高 |
| [死锁重试](./deadlock-and-retry.md) | 并发锁顺序冲突 → 回滚、超时、RT 抖动 |
| [热点更新](./hot-account-update.md) | 同一行并发修改 → 行锁排队、TPS 下降 |
| [分库迁移](./sharding-and-migration.md) | 单表/单库到瓶颈 → 查询、DDL、扩容复杂 |
| [高频追问](./high-frequency-questions.md) | 落地细节补充：SELECT *、深分页、锁持有时间、热点行锁 |

### MySQL 实战 45 讲

整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），每讲独立一篇，共 47 篇。

#### 基础八讲

| # | 标题 |
| --- | --- |
| 00 | [开篇导读](./00-preface.md) |
| 01 | [查询执行](./01-sql-query-execution.md) |
| 02 | [更新链路](./02-sql-update-log-system.md) |
| 03 | [事务隔离](./03-transaction-isolation.md) |
| 04 | [索引上篇](./04-index-part1.md) |
| 05 | [索引下篇](./05-index-part2.md) |
| 06 | [全局表锁](./06-global-table-lock.md) |
| 07 | [行锁机制](./07-row-lock.md) |
| 08 | [隔离细节](./08-transaction-isolation-detail.md) |

#### 索引七讲

| # | 标题 |
| --- | --- |
| 09 | [索引选型](./09-normal-vs-unique-index.md) |
| 10 | [误选索引](./10-wrong-index-selection.md) |
| 11 | [字符索引](./11-string-index.md) |
| 12 | [抖动分析](./12-mysql-flush.md) |
| 13 | [空间回收](./13-table-space-reclaim.md) |
| 14 | [计数优化](./14-count-slow.md) |
| 15 | [日志索引](./15-qa-log-and-index.md) |

#### 查询六讲

| # | 标题 |
| --- | --- |
| 16 | [排序原理](./16-order-by.md) |
| 17 | [随机查询](./17-random-message.md) |
| 18 | [逻辑性能](./18-sql-same-logic-diff-perf.md) |
| 19 | [单行慢查](./19-single-row-query-slow.md) |
| 20 | [幻读问题](./20-phantom-read.md) |
| 21 | [更新加锁](./21-single-row-update-many-locks.md) |

#### 高可用篇（22-30）

| # | 标题 |
| --- | --- |
| 22 | [应急提速](./22-emergency-perf-boost.md) |
| 23 | [数据持久](./23-data-durability.md) |
| 24 | [主备一致](./24-master-slave-consistency.md) |
| 25 | [高可用性](./25-high-availability.md) |
| 26 | [备库延迟](./26-slave-delay.md) |
| 27 | [主库故障](./27-master-failure.md) |
| 28 | [读写分离](./28-read-write-split-pitfalls.md) |
| 29 | [健康检查](./29-database-health-check.md) |
| 30 | [动态加锁](./30-qa-dynamic-locking.md) |

#### 运维进阶

| # | 标题 |
| --- | --- |
| 31 | [误删恢复](./31-data-recovery.md) |
| 32 | [语句终止](./32-unkillable-query.md) |
| 33 | [查询内存](./33-large-query-memory.md) |
| 34 | [关联使用](./34-join-usage.md) |
| 35 | [关联优化](./35-join-optimization.md) |
| 36 | [临表重名](./36-temp-table-rename.md) |
| 37 | [内部临表](./37-internal-temp-table.md) |
| 38 | [引擎对比](./38-innodb-vs-memory-engine.md) |
| 39 | [自增间隙](./39-auto-increment-gaps.md) |
| 40 | [插入加锁](./40-insert-locks.md) |
| 41 | [快速拷表](./41-fastest-table-copy.md) |
| 42 | [权限刷新](./42-grant-flush-privileges.md) |
| 43 | [分区设计](./43-partition-table.md) |
| 44 | [问题答疑](./44-qa-good-questions.md) |
| 45 | [自增溢出](./45-auto-increment-overflow.md) |
| 46 | [收官总结](./46-conclusion.md) |

## 建议阅读顺序

1. **先看基础**：database/sql（Go 专题） → 事务处理 → 查询优化 → GORM 实战，建立日常开发的基本盘
2. **再看索引与事务**：索引设计 → 大事务拆分，补理论基础
3. **然后看并发问题**：死锁 → 热点更新，补高并发问题处理
4. **最后看架构演进**：分库迁移，补扩展视角
5. **深入原理**：MySQL 实战 45 讲，按基础八讲 → 索引七讲 → 查询六讲 → 高可用篇 → 运维进阶的顺序系统精读

## 关联资料

- [database/sql：连接池与事务（源码精读）](/golang/guide/source-reading/database-sql)
- [database/sql：高级事务与批量插入（源码精读）](/golang/guide/source-reading/database-sql-advanced)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [Redis 专题](/redis/)
- [Kafka 专题](/kafka/)
