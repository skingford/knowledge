---
title: MySQL 专题
description: 系统整理 MySQL 核心知识，涵盖 database/sql 使用、连接池、事务、SQL 优化、ORM，以及高并发场景下的索引设计、大事务拆分、死锁治理、热点更新与分库分表。
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

从 Go 标准库和 ORM 的角度切入，掌握日常开发中操作 MySQL 的核心模式。

| 文档 | 覆盖内容 |
| --- | --- |
| [database/sql 与连接池](./database-sql-and-connection.md) | `database/sql` 基础用法、Prepared Statements、连接池参数配置与监控 |
| [事务处理与 SQL 优化](./transaction-and-optimization.md) | 事务模式、隔离级别、EXPLAIN 分析、批量操作、游标分页 |
| [ORM 使用经验（GORM）](./orm-gorm.md) | GORM 基础 CRUD、N+1 问题、何时用原生 SQL |

### 高并发场景

从支付系统实战角度整理的 MySQL 高频考点，适合补强索引、事务、锁和扩容方面的理解。

| 文档 | 核心矛盾 |
| --- | --- |
| [B+ 树索引与最左前缀](./index-design.md) | 索引设计不合理 → 查询慢、扫描多 |
| [大事务拆分](./large-transaction-splitting.md) | 事务范围过大 → 锁持有长、回滚成本高 |
| [死锁检测与回滚重试](./deadlock-and-retry.md) | 并发锁顺序冲突 → 回滚、超时、RT 抖动 |
| [热点账户更新](./hot-account-update.md) | 同一行并发修改 → 行锁排队、TPS 下降 |
| [分库分表与迁移](./sharding-and-migration.md) | 单表/单库到瓶颈 → 查询、DDL、扩容复杂 |
| [高频追问](./high-frequency-questions.md) | 落地细节补充：SELECT *、深分页、锁持有时间、热点行锁 |

### MySQL 实战 45 讲

整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），按主题合并为 8 个模块，覆盖 MySQL 核心原理。

| 文档 | 包含讲次 | 关键主题 |
| --- | --- | --- |
| [基础架构与日志](./mysql45-basics.md) | 开篇词、01、02、15 | SQL 执行流程、redo log、binlog |
| [索引原理与优化](./mysql45-index.md) | 03-05、09-11 | B+ 树、覆盖索引、索引选择、字符串索引 |
| [锁与事务](./mysql45-lock-transaction.md) | 06-08、19-21、30 | 全局锁、表锁、行锁、MVCC、幻读、加锁规则 |
| [数据页与 IO](./mysql45-flush-io.md) | 12-13、23 | flush 机制、表空间回收、数据不丢保证 |
| [SQL 查询优化](./mysql45-query-optimization.md) | 14、16-18、33-37 | count、order by、join、临时表 |
| [高可用与主从复制](./mysql45-high-availability.md) | 22、24-29 | 主备同步、binlog 格式、读写分离 |
| [运维与故障处理](./mysql45-operation-maintenance.md) | 31-32 | 误删恢复、kill 机制 |
| [引擎与进阶](./mysql45-engine-advanced.md) | 38-45、结束语 | Memory 引擎、自增主键、分区表、grant |

## 建议阅读顺序

1. **先看基础**：database/sql → 事务与优化 → ORM，建立日常开发的基本盘
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
