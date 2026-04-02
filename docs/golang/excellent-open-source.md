---
title: Go 优秀第三方库专题
description: 面向 Go 工程实践的第三方库导航页，按并发、Web、数据访问、CLI、日志与测试分类整理，并提供直达链接。
---

# Go 优秀第三方库专题

这页只收录 **第三方库**。标准库、官方包和 Go 团队维护扩展不混进主清单，统一放在文末做边界对照。

如果你只是想先记一套常用组合：

- **API 服务**：[`chi`](https://github.com/go-chi/chi) + [`zap`](https://github.com/uber-go/zap) + [`go-redis`](https://github.com/redis/go-redis) + [`pgx`](https://github.com/jackc/pgx)
- **异步后台任务**：[`ants`](https://github.com/panjf2000/ants) + [`asynq`](https://github.com/hibiken/asynq) + [`goleak`](https://github.com/uber-go/goleak)
- **CLI 工具**：[`cobra`](https://github.com/spf13/cobra) + [`viper`](https://github.com/spf13/viper) + [`zap`](https://github.com/uber-go/zap)
- **测试保障**：[`go-cmp`](https://github.com/google/go-cmp) + [`go-sqlmock`](https://github.com/DATA-DOG/go-sqlmock) + [`goleak`](https://github.com/uber-go/goleak)

## 集合与数据处理

| 库 | 用途 | 直达链接 |
| --- | --- | --- |
| `pie` | slice / map 的过滤、映射、分组、聚合 | [elliotchance/pie](https://github.com/elliotchance/pie) |

## 并发控制与后台任务

| 库 | 用途 | 直达链接 |
| --- | --- | --- |
| `ants` | worker pool、goroutine 数量控制、并发收敛 | [panjf2000/ants](https://github.com/panjf2000/ants) |
| `asynq` | Redis 驱动的异步任务、延迟任务、重试队列 | [hibiken/asynq](https://github.com/hibiken/asynq) |

## Web 服务与 HTTP API

| 库 | 用途 | 直达链接 |
| --- | --- | --- |
| `chi` | 轻量 HTTP 路由与中间件组织 | [go-chi/chi](https://github.com/go-chi/chi) |

## 数据访问与基础设施

| 库 | 用途 | 直达链接 |
| --- | --- | --- |
| `go-redis` | Redis 客户端、缓存、锁、消息队列 | [redis/go-redis](https://github.com/redis/go-redis) |
| `pgx` | PostgreSQL 驱动、批量写入、事务、Copy 协议 | [jackc/pgx](https://github.com/jackc/pgx) |

## CLI、配置与日志

| 库 | 用途 | 直达链接 |
| --- | --- | --- |
| `cobra` | CLI 子命令组织与命令行框架 | [spf13/cobra](https://github.com/spf13/cobra) |
| `viper` | 配置文件、环境变量、多环境配置加载 | [spf13/viper](https://github.com/spf13/viper) |
| `zap` | 高性能结构化日志 | [uber-go/zap](https://github.com/uber-go/zap) |

## 测试与质量保障

| 库 | 用途 | 直达链接 |
| --- | --- | --- |
| `go-cmp` | 测试场景下的对象比较 | [google/go-cmp](https://github.com/google/go-cmp) |
| `go-sqlmock` | 数据库访问层单测、DAO 层 SQL 交互验证 | [DATA-DOG/go-sqlmock](https://github.com/DATA-DOG/go-sqlmock) |
| `goleak` | goroutine 泄漏检测 | [uber-go/goleak](https://github.com/uber-go/goleak) |

## 官方能力边界

下面这些不是第三方库，但在选型时常被拿来对照：

| 场景 | 官方能力 | 什么时候先用它 |
| --- | --- | --- |
| 简单集合处理 | `slices` / `maps` | 只是做少量过滤、查找、裁剪 |
| 少量并发编排 | goroutine + channel + `context` | 并发规模不大、逻辑简单 |
| 错误聚合 | `golang.org/x/sync/errgroup` | 重点是取消传播和错误收束 |
| 轻量 HTTP 路由 | `net/http` + `ServeMux` | 接口少、想减少抽象层 |
| 简单结构化日志 | `log/slog` | 不追求极致性能，想贴近标准库 |

## 使用原则

- 标准库先够用，再考虑第三方库。
- 一次只引入解决当前问题的最小依赖集合。
- 团队已经有统一方案时，优先保持一致。
- 先看维护状态、文档质量、社区使用广度，再决定是否长期采用。
