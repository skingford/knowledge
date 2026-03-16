---
title: MySQL 实战 45 讲
description: 极客时间《MySQL 实战 45 讲》（林晓斌/丁奇）学习笔记整理，按主题分类组织
---

# MySQL 实战 45 讲

> 本专题整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

## 专题概览

本专题将 45 讲内容按主题重新组织为 8 个模块，方便按知识点系统复习。

## 建议阅读顺序

1. **基础架构与日志** — 先理解 MySQL 整体架构和日志系统
2. **索引原理与优化** — 搞懂 B+ 树索引、覆盖索引、索引选择
3. **锁与事务** — 全局锁、表锁、行锁、幻读、加锁规则
4. **数据页与 IO** — 理解 flush、数据页管理、数据可靠性
5. **SQL 查询优化** — count、order by、join、临时表等实战优化
6. **高可用与主从复制** — 主备一致、高可用、读写分离
7. **运维与故障处理** — 误删恢复、kill 语句
8. **引擎与进阶** — Memory 引擎、自增主键、分区表等进阶话题

## 模块目录

| 模块 | 包含讲次 | 关键主题 |
| --- | --- | --- |
| [基础架构与日志](./basics) | 开篇词、01、02、15 | SQL 执行流程、redo log、binlog |
| [索引原理与优化](./index-chapter) | 03-05、09-11 | B+ 树、覆盖索引、索引选择、字符串索引 |
| [锁与事务](./lock-transaction) | 06-08、19-21、30 | 全局锁、表锁、行锁、MVCC、幻读、加锁规则 |
| [数据页与 IO](./flush-io) | 12-13、23 | flush 机制、表空间回收、数据不丢保证 |
| [SQL 查询优化](./query-optimization) | 14、16-18、33-37 | count、order by、join、临时表 |
| [高可用与主从复制](./high-availability) | 22、24-29 | 主备同步、binlog 格式、读写分离 |
| [运维与故障处理](./operation-maintenance) | 31-32 | 误删恢复、kill 机制 |
| [引擎与进阶](./engine-advanced) | 38-45、结束语 | Memory 引擎、自增主键、分区表、grant |

## 关联资料

- [高并发支付系统：MySQL 篇](../case-studies/high-concurrency-payment-mysql) — 支付场景下的 MySQL 高频考点
- [database/sql：连接池与事务](/golang/guide/source-reading/database-sql) — Go 标准库数据库连接池
