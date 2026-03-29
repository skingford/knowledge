---
title: Redis 专题
description: 系统整理 Redis 核心知识，并收录《Redis 核心技术与实战》课程笔记，覆盖缓存治理、客户端实践、分布式锁、集群与高并发场景。
---

# Redis 专题

这个专题把散落在 Go 学习大纲、源码精读、支付系统案例和极客时间课程中的 Redis 内容统一收敛，既能按问题查资料，也能沿着课程主线系统精读。

## 图例速览

Redis 入口页最适合先抓一条总路线，再往下拆缓存治理、分布式锁、集群和课程笔记。下面这张 SVG 图例先把整套课程和专题内容的骨架搭起来。

<RedisCourseDiagram kind="course-map" />

现在 `Redis` 目录里同时保留了两条阅读路径：

- 问题驱动：直接查缓存治理、分布式锁、集群部署和支付高并发实践
- 课程驱动：按《Redis 核心技术与实战》52 讲从基础架构一路读到 Redis 6.0、协议和运维工具

## 快速导航

- [图例速览](#图例速览)
- [适合谁看](#适合谁看)
- [内容结构](#内容结构)
- [建议阅读顺序](#建议阅读顺序)
- [你会得到什么](#你会得到什么)
- [关联资料](#关联资料)

## 适合谁看

- 正在使用 Go + Redis 开发后端服务，需要系统梳理缓存与并发控制能力的工程师
- 想把缓存穿透、击穿、雪崩、分布式锁、Lua、滑动窗口答得更工程化的人
- 面试中经常碰到 Redis 高频题，但回答还停留在概念层的开发者
- 希望把客户端用法、底层实现和业务场景串成一条完整主线的人

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [Redis 核心技术与实战课程精读](./course/index.md) | 按章节整理 52 讲，覆盖架构、IO、多种数据类型、缓存治理、持久化、复制、哨兵、集群、事务、脑裂、Redis 6.0 与加餐内容 |
| [Redis 实践与缓存穿透/击穿/雪崩](./redis-and-cache-patterns.md) | `go-redis` 基础用法、Pipeline、Pub/Sub、缓存穿透/击穿/雪崩、singleflight、布隆过滤器、多级缓存 |
| [Redis 高并发、集群部署与分布式锁](./high-concurrency-cluster-locks.md) | 热点 Key / 大 Key 治理、Sentinel / Cluster 选型、hash tag、分布式锁、Lua 原子脚本与高并发落地清单 |
| [go-redis 客户端源码精读](/golang/guide/source-reading/go-redis) | 连接池、Pipeline/TxPipeline、分布式锁、`Watch`、发布订阅、Cache-Aside 与客户端实现细节 |
| [支付系统 Redis 实战](./payment-practice.md) | 缓存治理、分布式锁、Lua 原子性、滑动窗口限流、请求级幂等与支付场景答题模板 |

## 建议阅读顺序

1. 想系统学 Redis，先看 [Redis 核心技术与实战课程精读](./course/index.md)，先把整体架构、持久化、复制、哨兵、集群和缓存主线搭起来
2. 想快速补工程实践，再看 [Redis 实践与缓存穿透/击穿/雪崩](./redis-and-cache-patterns.md)，把缓存异常和 `go-redis` 常用能力补齐
3. 然后读 [Redis 高并发、集群部署与分布式锁](./high-concurrency-cluster-locks.md)，把热点 Key、Cluster、Lua 和锁的生产视角串起来
4. 再配合 [go-redis 客户端源码精读](/golang/guide/source-reading/go-redis)，把连接池、Pipeline、TxPipeline 和 Watch 等实现细节吃透
5. 最后用 [支付系统 Redis 实战](./payment-practice.md) 把缓存、锁、限流、幂等和高并发落到具体业务场景

## 你会得到什么

- 一套围绕“快、稳、准”的 Redis 学习主线
- 一条“课程主线 + 工程专题”的双路径入口
- 从客户端 API 到生产问题的统一认知框架
- 从缓存治理到并发控制、从源码到业务场景的完整映射

## 关联资料

- [Go 数据库与缓存专题](/golang/guide/06-database-cache)
- [net/http 限流与熔断](/golang/guide/source-reading/net-http-ratelimit)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [MySQL 专题](/mysql/)
- [Kafka 专题](/kafka/)
- [PostgreSQL 专题](/postgresql/)
