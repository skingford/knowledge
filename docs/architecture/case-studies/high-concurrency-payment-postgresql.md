---
title: 高并发支付系统专题整理：PostgreSQL 篇
description: PostgreSQL 篇内容已迁移至独立的 PostgreSQL 专题，本页提供快捷导航。
---

# 高并发支付系统专题整理：PostgreSQL 篇

PostgreSQL 篇内容已迁移至独立的 [PostgreSQL 专题](/postgresql/)，方便按主题查阅和持续更新。

## 快捷导航

| 主题 | 核心内容 | 链接 |
| --- | --- | --- |
| 核心概念与高频考点 | MVCC、索引类型、锁与事务、批量写入、分区表、高可用与复制 | [进入](/postgresql/core-concepts) |
| 支付场景追问 | 长事务问题、流水表分区、CopyFrom 使用时机、复制延迟监控 | [进入](/postgresql/payment-practice) |
| 高可用集群整理 | Patroni + etcd + HAProxy 部署、WAL 流复制、同步策略、故障恢复 | [进入](/postgresql/ha-cluster) |

## 继续阅读

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [上一篇：MySQL 篇](./high-concurrency-payment-mysql.md)
- [下一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [案例总览](./index.md)
