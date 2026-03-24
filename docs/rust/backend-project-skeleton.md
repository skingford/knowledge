---
title: Rust 后端项目骨架
description: 从目录结构、启动装配、状态管理、路由、服务、仓储、配置、观测到关闭流程，整理一个可持续演进的 Rust 后端项目骨架。
---

# Rust 后端项目骨架

当 Rust 语言基础、`axum`、`sqlx`、`tracing`、配置和关闭流程都零散补完后，下一步通常就是一个问题：

这些东西在真实项目里应该怎么拼起来？

这页给的是一个“足够务实”的骨架，不追求绝对标准答案，但强调边界清晰、方便扩展和便于测试。

## 先给一个目标

一个可持续演进的 Rust 后端项目，至少应该做到：

- 启动路径清晰
- 配置统一收口
- tracing 统一初始化
- 路由、业务、数据访问分层
- 共享状态明确
- 关闭流程可控

## 一个常见目录结构

```text
src/
├── main.rs
├── app.rs
├── state.rs
├── config.rs
├── error.rs
├── observability.rs
├── shutdown.rs
├── dto/
│   └── mod.rs
├── routes/
│   ├── mod.rs
│   ├── health.rs
│   └── users.rs
├── service/
│   ├── mod.rs
│   └── user_service.rs
└── repo/
    ├── mod.rs
    └── user_repo.rs
```

这个结构不是为了“看起来高级”，而是为了让每层职责尽量明确。

## 每层分别放什么

### `main.rs`

只负责：

- 读取配置
- 初始化 tracing
- 初始化依赖
- 构造应用
- 启动服务
- 进入关闭流程

它应该尽量薄。

### `app.rs`

负责把：

- Router
- middleware
- state
- route nesting

拼成完整应用。

如果你要把认证、授权、request id、当前用户上下文和 middleware 顺序单独理顺，继续看：

- [Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)

### `state.rs`

负责定义 `AppState`，放共享依赖，例如：

- 配置
- 数据库池
- 本地缓存 / Redis 客户端
- HTTP client
- service 对象

如果你想把 `reqwest` client、超时、认证、错误和 tracing 的外部调用边界单独理顺，继续看：

- [Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)

如果你想把本地缓存、Redis、TTL 和 cache-aside 的边界单独理顺，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)

### `routes/*`

只关心：

- HTTP 输入输出
- extractor
- DTO 映射
- 调用 service

不要在这里写大量业务规则和 SQL。

### `service/*`

负责：

- 用例编排
- 业务规则
- 事务边界
- 调用多个 repo 或外部依赖

### `repo/*`

负责：

- SQL
- 持久化映射
- 数据访问错误边界

### `config.rs`

负责配置结构体、读取和校验逻辑。

配置来源分层、覆盖顺序和显式校验的展开说明，直接看：

- [Rust 配置管理实践](./configuration-management-practice.md)

### `observability.rs`

负责 tracing 初始化、过滤器和观测基础装配。

### `shutdown.rs`

负责 Ctrl+C、任务协调、超时和优雅关闭主线。

如果你要把进程内 worker、队列消费者和统一收尾机制单独理顺，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)

## 一个更接近真实项目的启动顺序

`main.rs` 的逻辑通常可以按下面顺序走：

1. 读配置
2. 初始化 tracing
3. 初始化数据库池和外部依赖
4. 组装 `AppState`
5. 构造 `Router`
6. 绑定 listener
7. 启动服务
8. 等待关闭信号
9. 执行优雅关闭

这条顺序的价值在于：服务生命周期从一开始就很清楚。

## `AppState` 应该怎么控制

一个常见问题是：`AppState` 会不会越长越像“全局垃圾桶”？

会，所以要控制边界。

比较稳的原则：

- 只放真正共享、长期存在的依赖
- 不放请求级数据
- 不把所有临时对象都塞进去

如果某块依赖开始变得太重，可以继续拆 service 或子状态对象。

## DTO、领域模型、存储模型分层

比较清晰的分工通常是：

- DTO：HTTP 输入输出
- 领域模型：业务语义
- 存储模型：数据库映射

它们可以小项目里先局部复用，但不要默认永远混成一个结构体。

如果你想把请求 DTO、领域对象、数据库 row、外部 API DTO 和映射责任系统理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

## 错误边界建议

一个很实用的分层是：

- repo 层保留基础设施错误
- service 层补业务语义
- route 层做 HTTP 映射

这样：

- 数据库约束冲突
- 配置错误
- 资源不存在
- 权限不足

这些问题更容易在边界层被准确表达。

## `axum`、`sqlx`、`tracing` 在骨架里的位置

可以这样理解：

- `axum`：承载 HTTP 接入层
- `sqlx`：承载数据访问层
- `tracing`：贯穿整个生命周期和调用链

它们不是平铺并列的几个库，而是在不同层次各管一段边界。

## 一个务实的依赖关系

更稳的依赖方向通常是：

- `routes` 依赖 `service`
- `service` 依赖 `repo`
- `repo` 依赖数据库池和底层客户端

尽量避免反向依赖和跨层直接互调。

## 什么时候拆 workspace

如果项目已经出现下面信号，就值得考虑：

- HTTP 服务和 CLI/worker 共享一批核心 crate
- 领域模型或公共能力开始复用
- 想把应用入口和公共库拆开

如果还没到这个阶段，单 crate 保持清楚也完全可以。

如果你想系统整理 workspace 的拆分时机、`workspace.dependencies`、`default-members` 和依赖治理，继续看：

- [Rust Workspace 与 Monorepo 实践](./workspace-and-monorepo-practice.md)

## 一个最小可上线骨架清单

至少应该包括：

1. 配置加载与校验
2. tracing 初始化
3. 健康检查接口
4. 统一错误映射
5. 数据库池初始化
6. 至少一个 service + repo 纵向切片
7. Ctrl+C 关闭流程
8. fmt / clippy / test 基础闭环

## 常见误区

### 误区 1：所有代码都堆在 `main.rs`

这种写法短期快，后面几乎必然重构。

### 误区 2：HTTP 层直接写 SQL

会导致事务边界、测试边界和业务边界全部混乱。

### 误区 3：为了“架构感”过早拆很多 crate

过早拆分会放大协调成本，不一定有收益。

### 误区 4：项目骨架只管目录，不管生命周期

真正决定服务质量的往往不是目录名，而是启动、观测、配置和关闭是不是同一条清晰主线。

## 自检

你至少应该能回答：

1. 为什么 `main.rs` 应该尽量薄？
2. 为什么 route、service、repo 三层分工有助于长期维护？
3. `AppState` 为什么既必要又必须控制体积？
4. 为什么项目骨架必须把 tracing、配置和关闭流程一起考虑？
5. 什么信号说明项目已经值得拆成 workspace？

这些问题理顺后，你就不只是“会写几个 Rust 模块”，而是在组织一个能长期演进的后端项目。
