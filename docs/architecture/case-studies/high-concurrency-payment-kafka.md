---
title: 高并发支付系统专题整理：Kafka 篇
description: Kafka 篇内容已迁移至独立的 Kafka 专题，本页提供快捷导航。
---

# 高并发支付系统专题整理：Kafka 篇

Kafka 篇内容已迁移至独立的 [Kafka 专题](/kafka/)，方便按主题查阅和持续更新。

<KafkaDiagram kind="case-study-bridge" />

## 从案例跳到专题，怎么读最快

- 如果你现在卡在“Kafka 为啥能抗住高并发”，先看 [核心概念](/kafka/core-concepts)
- 如果你更关心支付链路里的补偿、死信、重试和延迟治理，直接看 [支付实战](/kafka/payment-practice)
- 如果你是在准备面试，想把“消息不丢、不乱、不堵”压缩成标准答法，再看 [深入追问与词汇](/kafka/interview-questions)

## 快捷导航

| 主题 | 核心内容 | 链接 |
| --- | --- | --- |
| 核心概念 | Producer/Consumer/Broker、Topic/Partition、Consumer Group、高可用机制、性能原理 | [进入](/kafka/core-concepts) |
| 支付实战 | TCC+Kafka、本地消息表、Offset 补偿、全链路闭环、延迟队列、生产治理 | [进入](/kafka/payment-practice) |
| 深入追问与词汇 | 消息不丢失、顺序性、积压处理、重试与死信、幂等与事务、英语术语速查 | [进入](/kafka/interview-questions) |

## 继续阅读

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [上一篇：Redis 篇](/redis/payment-practice)
- [案例总览](./index.md)
