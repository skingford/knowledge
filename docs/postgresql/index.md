---
title: PostgreSQL 专题
description: 系统整理 PostgreSQL 核心知识，涵盖 MVCC、索引、锁与事务、批量写入、分区表、高可用集群部署与故障恢复。
---

# PostgreSQL 专题

这个专题把散落在支付系统案例和架构文档中的 PostgreSQL 相关内容统一收敛，方便按主题查阅和持续更新。

## 适合谁看

- 已经熟悉 MySQL，但准备切到 PostgreSQL 或同时维护两套数据库
- 面试里需要回答 PostgreSQL 的 MVCC、锁、分区表、批量写入、高可用
- 想把支付场景里的账务、流水、审计类表结构和 PostgreSQL 能力对应起来
- 需要搭建或维护 PostgreSQL 高可用集群的后端工程师和 DBA

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [核心概念与高频考点](./core-concepts.md) | MVCC 与可见性、索引与查询计划、锁与事务、批量写入、分区表、高可用与复制 |
| [支付场景追问](./payment-practice.md) | 长事务问题、流水表分区、CopyFrom 使用时机、复制延迟监控 |
| [高可用集群整理](./ha-cluster.md) | Patroni + etcd + HAProxy 部署、WAL 流复制、同步策略、故障恢复 |

## 建议阅读顺序

1. 先看 [核心概念](./core-concepts.md)，补 MVCC、索引、锁的基本盘
2. 再看 [支付场景追问](./payment-practice.md)，把知识落到业务场景
3. 最后看 [高可用集群](./ha-cluster.md)，补生产治理和运维视角

## 关联资料

- [pgx：PostgreSQL 原生驱动（源码精读）](/golang/guide/source-reading/pgx-driver)
- [database/sql：高级事务与批量插入（源码精读）](/golang/guide/source-reading/database-sql-advanced)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [etcd 专题](/etcd/)
- [Redis 专题](/redis/)
- [MySQL 专题](/mysql/)
- [Kafka 专题](/kafka/)
