---
title: Axum Web 服务实践
description: 基于 axum 0.8 的 Rust Web 服务实践主线，覆盖 Router、State、Extractor、Middleware、错误处理与服务启动边界。
---

# Axum Web 服务实践

> 本页按 `axum 0.8` 官方文档思路整理，重点不是背 API，而是建立 Rust Web 服务的工程主线。

Rust 一旦进入服务端开发，常见落地点就是 Web 服务。

`axum` 之所以常被推荐，不是因为它“最魔法”，而是因为它比较贴近 Rust 的几条主线：

- 用类型表达请求和响应边界
- 用 extractor 显式声明输入依赖
- 用 state 明确共享应用状态
- 用 tower/tower-http 组合中间件

## 先理解 `axum` 在解决什么

一个最小 Web 服务通常要解决：

- 路由分发
- 请求解析
- 响应构造
- 应用状态注入
- 中间件
- 错误处理
- 服务启动和优雅关闭

`axum` 的思路是：把这些能力尽量组合在 `Router`、extractor、state 和 tower layer 这一套模型里。

如果你想把 WebSocketUpgrade、SSE、广播 channel、慢消费者和连接生命周期单独理顺，继续看：

- [Rust WebSocket 与 SSE 实践](./websocket-and-sse-practice.md)

如果你想把认证、授权、request id、当前用户上下文和 middleware / extractor 边界单独理顺，继续看：

- [Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)

如果你想把 DTO、输入校验、领域不变量和错误映射这条请求边界单独理顺，继续看：

- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)

## Router 是主入口

最小路由通常从 `Router::new()` 开始：

```rust
use axum::{routing::get, Router};

async fn health() -> &'static str {
    "ok"
}

let app = Router::new().route("/health", get(health));
```

这里最重要的不是语法，而是：

- 路由和 handler 绑定明确
- handler 本身就是 async 函数
- 路由组合通常保持声明式

## 服务启动的当前主流方式

`axum 0.8` 官方文档主线是：

```rust
use axum::{routing::get, Router};

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}
```

这比旧版本里更多依赖 `hyper::Server` 的写法更直接。

## State 是应用级共享状态主线

官方当前推荐用 `with_state` 提供全局应用状态，再用 `State<T>` 提取。

```rust
use axum::{extract::State, routing::get, Router};

#[derive(Clone)]
struct AppState {
    app_name: String,
}

async fn hello(State(state): State<AppState>) -> String {
    format!("hello from {}", state.app_name)
}

let app = Router::new()
    .route("/", get(hello))
    .with_state(AppState {
        app_name: "demo".to_string(),
    });
```

这里有两个关键点：

- state 通常需要 `Clone`
- state 更适合放应用级共享依赖，例如配置、数据库池、客户端、服务对象

## request-specific 数据不要和全局 State 混在一起

官方文档明确区分：

- `State`：应用级共享状态
- `Extension`：更适合请求级注入数据

工程上这点很重要。否则你会把：

- 配置
- 请求 ID
- 当前认证用户
- trace 上下文

全混进一个巨大的 `AppState`。

## Extractor 是 `axum` 的核心表达方式

extractor 的价值是：把 handler 依赖显式写到函数签名里。

常见 extractor 包括：

- `State<T>`
- `Path<T>`
- `Query<T>`
- `Json<T>`
- `HeaderMap`
- `Method`
- `Uri`

例如：

```rust
use axum::{extract::{Path, Query}, response::Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ListParams {
    page: Option<u32>,
}

#[derive(Serialize)]
struct User {
    id: u64,
}

async fn get_user(
    Path(id): Path<u64>,
    Query(params): Query<ListParams>,
) -> Json<User> {
    let _page = params.page.unwrap_or(1);
    Json(User { id })
}
```

这类签名的好处是：

- 输入依赖一眼能看懂
- 解析失败会落到框架错误处理链
- handler 内部逻辑更聚焦业务

如果你想把 `Query<T>`、过滤条件、排序白名单、offset / cursor 和列表响应契约单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

## `Json<T>` 适合承接 DTO，而不是所有内部模型

和 `serde` 那页的原则一样：

- 请求体/响应体更适合 DTO
- 领域模型和存储模型不一定直接暴露给 HTTP 层

不要让一个结构体同时承担：

- HTTP 输入
- 数据库存储
- 领域规则
- 对外响应

如果你想把请求 DTO、响应 DTO、领域模型和数据库模型的边界系统拆开，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

## Middleware 主线来自 tower / tower-http

`axum` 的中间件思路和 tower 生态绑定很深。当前官方常见组合方式是：

- 单层 `.layer(...)`
- 多层 `ServiceBuilder`
- `tower-http` 提供 trace、cors、compression 等通用 layer

例如官方文档常见的 `TraceLayer`：

```rust
use axum::{routing::get, Router};
use tower_http::trace::TraceLayer;

async fn handler() {}

let app = Router::new()
    .route("/", get(handler))
    .layer(TraceLayer::new_for_http());
```

如果中间件较多，通常更适合 `ServiceBuilder`。

如果你想把 timeout、并发限制、限流、load shed、buffer 和 `HandleErrorLayer` 的组合边界系统收成一页，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## 一般中间件顺序要怎么想

顺序不是纯样板，它影响行为边界。

常见考虑包括：

- trace / logging
- timeout
- request id
- auth
- cors
- compression

一个实用原则是：

- 越靠外层的中间件，越像全局基础设施
- 越靠内层的中间件，越贴近业务路由

## 错误处理不要只想“怎么不报错”

`axum` 的 handler 可以返回：

- 直接响应类型
- `(StatusCode, String)` 这类简单实现
- 自定义错误类型配合 `IntoResponse`

更稳的工程方式通常是：

1. handler 返回业务结果。
2. 业务错误映射成统一 HTTP 错误。
3. 在边界层决定状态码、错误消息和日志记录。

如果你想把 `IntoResponse`、统一错误体、状态码分层、request id 和中间件错误收口系统展开，继续看：

- [Rust API 错误响应与响应体设计实践](./api-error-and-response-design-practice.md)

## timeout 这类 layer 需要显式接错误

官方文档里给出的思路是：如果某个 layer 会产生错误，就用 `HandleErrorLayer` 显式处理。

这一点很关键，因为它提醒你：

- 中间件错误不是“自动就能转 HTTP 响应”
- timeout、限流、上游失败等都要进入统一错误边界

## 路由组织建议

项目稍大后，不要把所有路由都堆在 `main.rs`。

一个更稳的结构通常是：

```text
src/
├── main.rs
├── app.rs
├── state.rs
├── error.rs
├── routes/
│   ├── mod.rs
│   ├── health.rs
│   └── users.rs
└── dto/
    └── users.rs
```

常见分层：

- `main.rs`：启动和装配
- `app.rs`：拼 `Router`
- `state.rs`：应用状态
- `routes/*`：HTTP handler
- `service/*`：业务逻辑
- `repo/*`：数据库访问

## 一个更接近真实项目的最小主线

如果你要写一个最小 `axum` 服务，比较稳的顺序是：

1. 先定义 `AppState`。
2. 先写 `health` 和一个简单 JSON 接口。
3. 再加 tracing / timeout / request id 等基础 layer。
4. 再接数据库池和业务 service。
5. 最后补统一错误类型和优雅关闭。

## 常见误区

### 误区 1：把所有依赖都塞进巨型 `AppState`

短期方便，长期会让边界越来越糊。

### 误区 2：handler 里直接写一堆数据库和业务逻辑

这样很快会失去测试边界和复用能力。

### 误区 3：中间件顺序随便放

timeout、trace、auth、cors 的顺序会影响观测、错误和行为。

### 误区 4：只追求跑通，不设计统一错误返回

这样接口会很快出现状态码、错误体和日志风格不一致的问题。

## 自检

你至少应该能回答：

1. `Router`、extractor 和 `State` 在 `axum` 里各负责什么？
2. 为什么 `with_state` 更适合应用级共享状态？
3. 为什么 handler 签名能明显改善 Web 服务代码的可读性？
4. `tower-http` 中间件为什么要按顺序思考？
5. 为什么 timeout 这类 layer 需要显式进入错误处理链？

这些问题理顺后，`axum` 就不只是“能起一个 demo”，而是能开始承载真实服务。
