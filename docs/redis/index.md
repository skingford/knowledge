---
title: Redis 专题
description: 系统整理 Redis 核心知识，覆盖缓存治理、go-redis 客户端实践、分布式锁、Lua 原子性、滑动窗口与支付系统场景。
---

# Redis 专题

这个专题把散落在 Go 学习大纲、源码精读和支付系统案例中的 Redis 相关内容统一收敛，方便按主题查阅和持续更新。

当前已经开始把 Redis 文章逐步迁入 `docs/redis/` 目录统一维护；仍然保留部分跨专题引用，方便从 Go 与架构视角回查。

## 适合谁看

- 正在使用 Go + Redis 开发后端服务，需要系统梳理缓存与并发控制能力的工程师
- 想把缓存穿透、击穿、雪崩、分布式锁、Lua、滑动窗口答得更工程化的人
- 面试中经常碰到 Redis 高频题，但回答还停留在概念层的开发者
- 希望把客户端用法、底层实现和业务场景串成一条完整主线的人

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [Redis 实践与缓存穿透/击穿/雪崩](./redis-and-cache-patterns.md) | `go-redis` 基础用法、Pipeline、Pub/Sub、缓存穿透/击穿/雪崩、singleflight、布隆过滤器、多级缓存 |
| [Redis 高并发、集群部署与分布式锁](./high-concurrency-cluster-locks.md) | 热点 Key / 大 Key 治理、Sentinel / Cluster 选型、hash tag、分布式锁、Lua 原子脚本与高并发落地清单 |
| [go-redis 客户端源码精读](/golang/guide/source-reading/go-redis) | 连接池、Pipeline/TxPipeline、分布式锁、`Watch`、发布订阅、Cache-Aside 与客户端实现细节 |
| [支付系统 Redis 实战](./payment-practice.md) | 缓存治理、分布式锁、Lua 原子性、滑动窗口限流、请求级幂等与支付场景答题模板 |

## 建议阅读顺序

1. 先看 [Redis 实践与缓存穿透/击穿/雪崩](./redis-and-cache-patterns.md)，补日常开发和缓存治理基本盘
2. 再看 [Redis 高并发、集群部署与分布式锁](./high-concurrency-cluster-locks.md)，补齐热点 Key、集群部署、分布式锁和 Lua 的生产视角
3. 然后看 [go-redis 客户端源码精读](/golang/guide/source-reading/go-redis)，把连接池、RTT、Pipeline 和一致性细节串起来
4. 最后看 [支付系统 Redis 实战](./payment-practice.md)，把知识落到幂等、锁、限流和高并发治理场景

## 你会得到什么

- 一套围绕“快、稳、准”的 Redis 学习主线
- 从客户端 API 到生产问题的统一认知框架
- 从缓存治理到并发控制、从源码到业务场景的完整映射

## 关联资料

- [Go 数据库与缓存专题](/golang/guide/06-database-cache)
- [net/http 限流与熔断](/golang/guide/source-reading/net-http-ratelimit)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [MySQL 专题](/mysql/)
- [Kafka 专题](/kafka/)
- [PostgreSQL 专题](/postgresql/)
