---
title: 架构案例实战
description: 收录偏业务落地的架构案例，覆盖组织架构设计、PostgreSQL 高可用、支付系统专题整理与运动 App 出海架构实践。
---

# 架构案例实战

这里收纳偏业务落地的案例型内容，适合在学习完方法论和清单后，用完整案例补齐设计取舍与工程实现。

## 当前案例

- [组织架构与业务系统设计方案](./organization-structure-and-business-system-design.md)
- [PostgreSQL 高可用集群整理](/postgresql/ha-cluster)
- [高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [高并发支付系统：MySQL 篇](./high-concurrency-payment-mysql.md)
- [高并发支付系统：PostgreSQL 篇](./high-concurrency-payment-postgresql.md)
- [高并发支付系统：Redis 篇](./high-concurrency-payment-redis.md)
- [高并发支付系统：Kafka 篇](./high-concurrency-payment-kafka.md)
- [运动 APP 出海架构与管理完全指南](./global-fitness-app-architecture-and-management-guide.md)

## 支付系统中间件专题速览

| 专题 | 适合解决的问题 | 入口 |
| --- | --- | --- |
| MySQL 篇 | 索引设计、事务拆分、死锁治理、热点更新、分库分表 | [进入 MySQL 专题](/mysql/) |
| PostgreSQL 篇 | MVCC、索引类型、批量写入、分区表、高可用复制 | [进入 PostgreSQL 专题](/postgresql/) |
| Redis 篇 | 缓存治理、分布式锁、Lua 原子性、滑动窗口、幂等控制 | [进入 Redis 篇](./high-concurrency-payment-redis.md) |
| Kafka 篇 | 消息可靠性、顺序性、积压处理、重试与死信 | [进入 Kafka 专题](/kafka/) |
