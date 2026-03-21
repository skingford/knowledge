---
title: Kafka 专题
description: 系统整理 Kafka 核心知识，涵盖消息模型、可靠性机制、支付系统实战与高频深入追问。
---

# Kafka 专题

这个专题把支付系统案例中的 Kafka 相关内容独立收敛，方便按主题查阅和持续更新。

## 适合谁看

- 对消息系统的可靠性、顺序性、消费治理答得还不够完整
- 想把支付系统里的异步链路、削峰填谷、失败补偿讲清楚
- 需要一套更偏实战的 Kafka 高频题模板

## 你会得到什么

- 一套围绕消息不丢、不乱、不堵的答题框架
- Producer、Broker、Consumer 三层视角的可靠性梳理
- 面向支付系统的积压、重试、死信治理思路

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [核心概念](./core-concepts.md) | Producer/Consumer/Broker、Topic/Partition/Offset、Consumer Group、高可用机制、高性能秘籍 |
| [支付实战](./payment-practice.md) | TCC+Kafka、本地消息表、全链路可靠性、补偿机制、延迟队列、生产治理 |
| [深入追问与词汇](./interview-questions.md) | 六组高频追问 + 英语词汇速查 |

## 建议阅读顺序

1. 先看 [核心概念](./core-concepts.md)，建立基本盘
2. 再看 [支付实战](./payment-practice.md)，把知识落到业务链路
3. 最后看 [深入追问与词汇](./interview-questions.md)，快速过高频题

## 关联资料

- [Go 代码实现：消息队列、事务、治理与高可用](/golang/guide/08-mq-transaction-governance-ha)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [Redis 专题](/redis/)
- [MySQL 专题](/mysql/)
- [PostgreSQL 专题](/postgresql/)
