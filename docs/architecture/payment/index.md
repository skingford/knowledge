---
title: 支付系统总览
description: 收录支付系统相关架构文章，覆盖回调幂等、高并发实践、交易风控、反欺诈与中间件桥接导航。
---

# 支付系统总览

支付系统是后端架构中资金安全要求最高的领域，这里收纳所有支付相关的架构设计与实践材料。

## 核心文章

- [支付回调幂等与补偿设计](./callback-idempotency.md) — 围绕验签、状态机收口、主动查询与对账补偿展开
- [高并发支付系统专题整理](./high-concurrency-notes.md) — 围绕 Go 性能、分布式事务、资金安全与清结算做系统梳理
- [支付交易风控设计](./risk-control.md) — 围绕规则引擎、限额限频、KYC/AML 与风控决策链路展开
- [支付交易反欺诈设计](./fraud-detection.md) — 围绕欺诈识别、特征工程、拒付争议与反欺诈运营展开

## 中间件专题导航

| 专题 | 适合解决的问题 | 入口 |
| --- | --- | --- |
| MySQL 篇 | 索引设计、事务拆分、死锁治理、热点更新、分库分表 | [进入](/mysql/) |
| PostgreSQL 篇 | MVCC、索引类型、批量写入、分区表、高可用复制 | [进入](/postgresql/) |
| Redis 篇 | 缓存治理、分布式锁、Lua 原子性、滑动窗口、幂等控制 | [进入](/redis/) |
| Kafka 篇 | 消息可靠性、顺序性、积压处理、重试与死信 | [进入](/kafka/) |

## 桥接页面

- [MySQL 篇导航](./mysql-bridge.md)
- [PostgreSQL 篇导航](./postgresql-bridge.md)
- [Redis 篇导航](./redis-bridge.md)
- [Kafka 篇导航](./kafka-bridge.md)

## 相关阅读

- [交易系统一致性设计总览](/architecture/transaction-system-consistency-overview)
- [订单状态机设计实战](/architecture/order-state-machine-design)
- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
