---
title: 高并发支付系统专题整理：MySQL 篇
description: MySQL 篇内容已迁移至独立的 MySQL 专题，本页提供快捷导航。
---

# 高并发支付系统专题整理：MySQL 篇

MySQL 篇内容已迁移至独立的 [MySQL 专题](/mysql/)，方便按主题查阅和持续更新。

## 快捷导航

### 高并发场景

| 主题 | 核心矛盾 | 链接 |
| --- | --- | --- |
| B+ 树索引与最左前缀 | 索引设计不合理 → 查询慢、扫描多 | [进入](/mysql/index-design) |
| 大事务拆分 | 事务范围过大 → 锁持有长、回滚成本高 | [进入](/mysql/transaction-and-optimization#大事务拆分) |
| 死锁检测与回滚重试 | 并发锁顺序冲突 → 回滚、超时、RT 抖动 | [进入](/mysql/deadlock-and-retry) |
| 热点账户更新 | 同一行并发修改 → 行锁排队、TPS 下降 | [进入](/mysql/hot-account-update) |
| 分库分表与迁移 | 单表/单库到瓶颈 → 查询、DDL、扩容复杂 | [进入](/mysql/sharding-and-migration) |
| 高频追问 | SELECT *、深分页、锁持有时间、热点行锁 | [进入](/mysql/high-frequency-questions) |

### Go 与 MySQL 基础

| 主题 | 链接 |
| --- | --- |
| database/sql 与连接池 | [进入](/golang/guide/06-database-sql-and-connection) |
| 事务处理 | [进入](/mysql/transaction-and-optimization) |
| SQL 优化 | [进入](/mysql/sql-optimization) |
| ORM 使用经验（GORM） | [进入](/mysql/orm-gorm) |

## 继续阅读

- [返回专题总览](./high-concurrency-notes.md)
- [下一篇：Redis 篇](/redis/payment-practice)
- [延伸：Kafka 篇](/kafka/)
- [支付总览](./index.md)
