---
title: Axum + SQLx 服务落地模板
description: 把 axum、sqlx、tracing、配置管理与优雅关闭串成一套 Rust 后端服务从 0 到 1 的最小落地模板。
---

# Axum + SQLx 服务落地模板

这页不是再补一个单点专题，而是把前面已经拆开的几条主线收成一份可以直接照着搭项目的最小模板。

目标很明确：

- 能快速起一个 Rust 后端服务
- 项目结构不乱
- 配置、观测、数据库、关闭流程一开始就有位置
- 后面能继续往真实业务扩

## 这份模板适合什么场景

- 想用 Rust 起一个 API 服务
- 不想从一堆零散示例里自己拼目录结构
- 想避免 demo 一开始就写成不可维护的 `main.rs`
- 希望服务从第一天起就带上 `tracing`、`sqlx` 和优雅关闭意识

## 这份模板的技术主线

- HTTP：`axum`
- Runtime：`tokio`
- 数据库：`sqlx`
- 观测：`tracing` + `tracing-subscriber`
- 配置：显式配置结构体
- 关闭：`tokio::signal::ctrl_c()` + 服务收尾流程

## 推荐目录结构

```text
src/
├── main.rs
├── app.rs
├── config.rs
├── state.rs
├── error.rs
├── observability.rs
├── shutdown.rs
├── dto/
│   ├── mod.rs
│   └── user.rs
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

这套结构的核心目的不是“分层看起来漂亮”，而是把职责切清：

- `routes` 只做 HTTP
- `service` 只做业务编排
- `repo` 只做数据库访问
- `main` 只做装配和生命周期

## 最小 `Cargo.toml` 思路

下面这个依赖集合已经够起一个像样的服务了：

```toml
[dependencies]
anyhow = "1"
axum = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "macros", "migrate"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
thiserror = "2"
```

如果你一开始不需要迁移功能或特定数据库，可以再减。

## 启动顺序不要乱

一个最小可维护服务，启动顺序建议固定成：

1. 读取配置
2. 初始化 tracing
3. 初始化数据库池
4. 构造 service / state
5. 构造 Router
6. 绑定 listener
7. 启动服务
8. 等待关闭信号
9. 做优雅关闭

## `main.rs` 的最小职责

`main.rs` 应该尽量薄：

```rust
mod app;
mod config;
mod observability;
mod state;
mod shutdown;

use anyhow::Result;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<()> {
    let config = config::load()?;
    observability::init(&config)?;

    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    let state = state::AppState::new(config.clone(), pool);
    let app = app::build_router(state.clone());

    let listener = TcpListener::bind(&config.server.addr).await?;
    tracing::info!(addr = %config.server.addr, "server starting");

    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            shutdown::wait_for_signal().await;
        })
        .await?;

    Ok(())
}
```

这段代码最重要的不是具体 API，而是：

- 先配置，后依赖，后 app，后启动
- 生命周期入口集中在一处
- 不把业务逻辑塞进 `main`

## `config.rs` 先只做一件事：把配置收敛成结构体

```rust
#[derive(Clone, Debug)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub observability: ObservabilityConfig,
}

#[derive(Clone, Debug)]
pub struct ServerConfig {
    pub addr: String,
}

#[derive(Clone, Debug)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Clone, Debug)]
pub struct ObservabilityConfig {
    pub rust_log: String,
}
```

即使配置一开始来自环境变量，进入业务前也应该先变成明确结构体。

## `observability.rs` 要尽早初始化

```rust
use tracing_subscriber::EnvFilter;

pub fn init(config: &crate::config::Config) -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_new(config.observability.rust_log.clone())
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    Ok(())
}
```

初始化位置越早越好，这样启动期报错也能落进统一日志链路。

## `AppState` 只放共享依赖

```rust
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub config: crate::config::Config,
    pub pool: PgPool,
}

impl AppState {
    pub fn new(config: crate::config::Config, pool: PgPool) -> Self {
        Self { config, pool }
    }
}
```

一开始不要把请求级数据、临时对象和业务中间状态都塞进来。

## `app.rs` 负责把 Router 收起来

```rust
use axum::{routing::get, Router};

pub fn build_router(state: crate::state::AppState) -> Router {
    Router::new()
        .merge(crate::routes::health::router())
        .merge(crate::routes::users::router())
        .with_state(state)
}
```

Router 组装要集中，别把路由到处散落。

## `routes` 层只做 HTTP 映射

例如 `routes/health.rs`：

```rust
use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

pub fn router() -> Router<crate::state::AppState> {
    Router::new().route("/health", get(health))
}
```

例如 `routes/users.rs`：

```rust
use axum::{extract::{Path, State}, routing::get, Json, Router};

async fn get_user(
    State(state): State<crate::state::AppState>,
    Path(id): Path<i64>,
) -> Result<Json<crate::dto::user::UserResponse>, crate::error::AppError> {
    let service = crate::service::user_service::UserService::new(state.pool.clone());
    let user = service.get_user(id).await?;
    Ok(Json(user))
}

pub fn router() -> Router<crate::state::AppState> {
    Router::new().route("/users/{id}", get(get_user))
}
```

重点是：

- handler 负责提取输入
- handler 调 service
- handler 不直接写 SQL

## `service` 层负责业务编排

```rust
pub struct UserService {
    pool: sqlx::PgPool,
}

impl UserService {
    pub fn new(pool: sqlx::PgPool) -> Self {
        Self { pool }
    }

    #[tracing::instrument(skip(self))]
    pub async fn get_user(
        &self,
        id: i64,
    ) -> Result<crate::dto::user::UserResponse, crate::error::AppError> {
        let user = crate::repo::user_repo::find_by_id(&self.pool, id).await?;
        Ok(user)
    }
}
```

service 层是最适合放：

- 业务规则
- 事务边界
- 多 repo 协调
- tracing span

## `repo` 层只关心 SQL

```rust
pub async fn find_by_id(
    pool: &sqlx::PgPool,
    id: i64,
) -> Result<crate::dto::user::UserResponse, sqlx::Error> {
    let user = sqlx::query_as!(
        crate::dto::user::UserResponse,
        r#"
        SELECT id, name
        FROM users
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}
```

repo 层不要掺进 HTTP 响应语义，也不要掺进复杂业务决策。

## `error.rs` 统一边界

一开始不需要设计得过分复杂，但至少应该统一：

- 资源不存在
- 参数非法
- 数据库错误
- 内部错误

一个简单思路：

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("resource not found")]
    NotFound,
    #[error("database error: {0}")]
    Db(#[from] sqlx::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()).into_response(),
            AppError::Db(_) => (StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response(),
        }
    }
}
```

这比到处 `unwrap` 或在 handler 里临时拼状态码稳得多。

如果你想把统一错误体、状态码分层、request id 透传和中间件错误边界单独理顺，继续看：

- [Rust API 错误响应与响应体设计实践](./api-error-and-response-design-practice.md)

## `shutdown.rs` 把关闭逻辑集中

最小版本甚至只需要：

```rust
pub async fn wait_for_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install ctrl+c handler");

    tracing::info!("shutdown signal received");
}
```

后面如果有：

- 后台任务
- 队列消费者
- 定时任务

再把它扩成统一关闭协调器。

如果你要把后台任务、worker、重试、背压和关闭协调系统展开，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)

## 一个最小请求链路应该长什么样

建议按下面的调用链思考：

1. `main` 启动应用
2. `Router` 收请求
3. `route handler` 提取参数
4. `service` 做业务
5. `repo` 做 SQL
6. 错误统一映射成响应
7. `tracing` 贯穿整条链路

如果你的代码已经明显偏离这条线，大概率说明边界开始乱了。

## 第一阶段不要急着加什么

先别急着加：

- 复杂 DI 容器
- 多 workspace
- 一堆自定义宏
- 过度抽象的 repository trait

先把最小服务主线做清楚，再扩。

## 第一版上线前至少要有的东西

1. `GET /health`
2. 一个最小业务接口
3. 数据库池初始化
4. 一个 migration
5. tracing 初始化
6. 统一错误映射
7. Ctrl+C 优雅关闭
8. `cargo fmt`、`cargo clippy`、`cargo test`

## 推荐你怎么用这页

如果你要新起一个 Rust 服务，最稳的用法是：

1. 先按这页搭目录和启动骨架
2. 再回看 [Axum Web 服务实践](./axum-web-service-practice.md)
3. 再回看 [SQLx 数据库访问实践](./sqlx-database-practice.md)
4. 再补 [Rust 事务、锁与并发更新实践](./transaction-locking-and-concurrent-update-practice.md)
5. 再补 [Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)
6. 再接 [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
7. 再补 [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
8. 最后补 [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)

## 自检

你至少应该能回答：

1. 为什么 `main.rs` 只应该负责装配和生命周期？
2. 为什么 route、service、repo 三层要明确分工？
3. 为什么 `AppState` 只应该放共享依赖？
4. 为什么 tracing、数据库池和关闭流程应该在第一版模板里就出现？
5. 为什么 Rust 服务模板最重要的不是“文件名”，而是边界和顺序？

如果这些问题都能说清，这套模板就不只是“抄目录”，而是真能落地。
