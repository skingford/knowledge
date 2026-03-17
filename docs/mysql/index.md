---
title: MySQL 专题
description: 系统整理 MySQL 核心知识，聚焦事务、SQL 优化、ORM、索引设计以及高并发场景下的锁、热点更新与分库分表。
---

# MySQL 专题

这个专题把散落在 Go 学习大纲和高并发支付系统案例中的 MySQL 相关内容统一收敛，方便按主题查阅和持续更新。

## 适合谁看

- 正在使用 Go 开发后端服务，需要和 MySQL 打交道的工程师
- 想系统掌握数据库连接池、事务、SQL 优化等生产级实践的开发者
- 准备技术面试，需要理清索引设计、死锁、热点更新等高频话题的人
- 希望从"能用"提升到"用好" MySQL 的后端工程师

## 内容结构

### Go 与 MySQL 基础

从 Go 与 MySQL 的集成视角切入，掌握事务、SQL 优化和 ORM 的核心模式。`database/sql` 与连接池已经迁移到 Go 专题维护。

| 文档 | 覆盖内容 |
| --- | --- |
| [database/sql 与连接池（Go 专题）](/golang/guide/06-database-sql-and-connection) | `database/sql` 基础用法、Prepared Statements、连接池参数配置与监控 |
| [事务处理](./transaction-and-optimization.md) | 事务模式、隔离级别、悲观锁与乐观锁、大事务拆分与长事务治理 |
| [SQL 优化](./sql-optimization.md) | EXPLAIN 分析、索引使用、批量操作、游标分页 |
| [ORM 使用经验（GORM）](./orm-gorm.md) | GORM 基础 CRUD、N+1 问题、何时用原生 SQL |

### 高并发场景

从支付系统实战角度整理的 MySQL 高频考点，适合补强索引、事务、锁和扩容方面的理解。

| 文档 | 核心矛盾 |
| --- | --- |
| [B+ 树索引与最左前缀](./index-design.md) | 索引设计不合理 → 查询慢、扫描多 |
| [大事务拆分](./transaction-and-optimization.md#大事务拆分) | 事务范围过大 → 锁持有长、回滚成本高 |
| [死锁检测与回滚重试](./deadlock-and-retry.md) | 并发锁顺序冲突 → 回滚、超时、RT 抖动 |
| [热点账户更新](./hot-account-update.md) | 同一行并发修改 → 行锁排队、TPS 下降 |
| [分库分表与迁移](./sharding-and-migration.md) | 单表/单库到瓶颈 → 查询、DDL、扩容复杂 |
| [高频追问](./high-frequency-questions.md) | 落地细节补充：SELECT *、深分页、锁持有时间、热点行锁 |

### MySQL 实战 45 讲

整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），每讲独立一篇，共 47 篇。

#### 基础篇（01-08）

| # | 标题 |
| --- | --- |
| - | [开篇词](./00-preface.md) |
| 01 | [基础架构：一条 SQL 查询语句是如何执行的？](./01-sql-query-execution.md) |
| 02 | [日志系统：一条 SQL 更新语句是如何执行的？](./02-sql-update-log-system.md) |
| 03 | [事务隔离：为什么你改了我还看不见？](./03-transaction-isolation.md) |
| 04 | [深入浅出索引（上）](./04-index-part1.md) |
| 05 | [深入浅出索引（下）](./05-index-part2.md) |
| 06 | [全局锁和表锁](./06-global-table-lock.md) |
| 07 | [行锁功过](./07-row-lock.md) |
| 08 | [事务到底是隔离的还是不隔离的？](./08-transaction-isolation-detail.md) |

#### 索引篇（09-15）

| # | 标题 |
| --- | --- |
| 09 | [普通索引和唯一索引，应该怎么选择？](./09-normal-vs-unique-index.md) |
| 10 | [MySQL 为什么有时候会选错索引？](./10-wrong-index-selection.md) |
| 11 | [怎么给字符串字段加索引？](./11-string-index.md) |
| 12 | [为什么我的 MySQL 会"抖"一下？](./12-mysql-flush.md) |
| 13 | [为什么表数据删掉一半，表文件大小不变？](./13-table-space-reclaim.md) |
| 14 | [count(*) 这么慢，我该怎么办？](./14-count-slow.md) |
| 15 | [答疑（一）：日志和索引相关问题](./15-qa-log-and-index.md) |

#### 查询篇（16-21）

| # | 标题 |
| --- | --- |
| 16 | [order by 是怎么工作的？](./16-order-by.md) |
| 17 | [如何正确地显示随机消息？](./17-random-message.md) |
| 18 | [为什么这些 SQL 语句逻辑相同，性能却差异巨大？](./18-sql-same-logic-diff-perf.md) |
| 19 | [为什么我只查一行的语句，也执行这么慢？](./19-single-row-query-slow.md) |
| 20 | [幻读是什么，幻读有什么问题？](./20-phantom-read.md) |
| 21 | [为什么我只改一行的语句，锁这么多？](./21-single-row-update-many-locks.md) |

#### 高可用篇（22-30）

| # | 标题 |
| --- | --- |
| 22 | [MySQL 有哪些"饮鸩止渴"提高性能的方法？](./22-emergency-perf-boost.md) |
| 23 | [MySQL 是怎么保证数据不丢的？](./23-data-durability.md) |
| 24 | [MySQL 是怎么保证主备一致的？](./24-master-slave-consistency.md) |
| 25 | [MySQL 是怎么保证高可用的？](./25-high-availability.md) |
| 26 | [备库为什么会延迟好几个小时？](./26-slave-delay.md) |
| 27 | [主库出问题了，从库怎么办？](./27-master-failure.md) |
| 28 | [读写分离有哪些坑？](./28-read-write-split-pitfalls.md) |
| 29 | [如何判断一个数据库是不是出问题了？](./29-database-health-check.md) |
| 30 | [答疑（二）：用动态的观点看加锁](./30-qa-dynamic-locking.md) |

#### 运维与进阶篇（31-45）

| # | 标题 |
| --- | --- |
| 31 | [误删数据后除了跑路，还能怎么办？](./31-data-recovery.md) |
| 32 | [为什么还有 kill 不掉的语句？](./32-unkillable-query.md) |
| 33 | [我查这么多数据，会不会把数据库内存打爆？](./33-large-query-memory.md) |
| 34 | [到底可不可以使用 join？](./34-join-usage.md) |
| 35 | [join 语句怎么优化？](./35-join-optimization.md) |
| 36 | [为什么临时表可以重名？](./36-temp-table-rename.md) |
| 37 | [什么时候会使用内部临时表？](./37-internal-temp-table.md) |
| 38 | [都说 InnoDB 好，那还要不要使用 Memory 引擎？](./38-innodb-vs-memory-engine.md) |
| 39 | [自增主键为什么不是连续的？](./39-auto-increment-gaps.md) |
| 40 | [insert 语句的锁为什么这么多？](./40-insert-locks.md) |
| 41 | [怎么最快地复制一张表？](./41-fastest-table-copy.md) |
| 42 | [grant 之后要跟着 flush privileges 吗？](./42-grant-flush-privileges.md) |
| 43 | [要不要使用分区表？](./43-partition-table.md) |
| 44 | [答疑（三）：说一说这些好问题](./44-qa-good-questions.md) |
| 45 | [自增 id 用完怎么办？](./45-auto-increment-overflow.md) |
| - | [结束语](./46-conclusion.md) |

## 建议阅读顺序

1. **先看基础**：database/sql（Go 专题） → 事务处理 → SQL 优化 → ORM，建立日常开发的基本盘
2. **再看索引与事务**：B+ 树索引 → 大事务拆分，补理论基础
3. **然后看并发问题**：死锁 → 热点更新，补高并发问题处理
4. **最后看架构演进**：分库分表与迁移，补扩展视角
5. **深入原理**：MySQL 实战 45 讲，按基础架构 → 索引 → 锁与事务 → IO → 查询优化 → 高可用 → 进阶的顺序系统精读

## 关联资料

- [database/sql：连接池与事务（源码精读）](/golang/guide/source-reading/database-sql)
- [database/sql：高级事务与批量插入（源码精读）](/golang/guide/source-reading/database-sql-advanced)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [高并发支付系统：Redis 篇](/architecture/case-studies/high-concurrency-payment-redis)
- [Kafka 专题](/kafka/)
