---
title: Rust 认证、授权与请求上下文实践
description: 从 Axum middleware、route_layer、Extension、State 到 request id、当前用户、权限判断和 WebSocket upgrade 前鉴权，整理 Rust 服务的认证与上下文主线。
---

# Rust 认证、授权与请求上下文实践

Rust 服务一旦进入真实业务，HTTP handler 很快就不再只是“收请求、查库、回响应”。

你还要处理：

- 请求有没有带身份凭证
- 当前用户是谁
- 当前租户是谁
- 这个用户有没有权限做这件事
- request id、trace id 和审计字段怎么往下传

这几件事如果边界没理清，常见结果就是：

- handler 里到处手拆 header
- 当前用户上下文散落
- 认证和授权混在一起
- 404 被中间件误打成 401
- WebSocket upgrade 后才发现其实没鉴权

这页补的就是 Rust 服务里的认证、授权和请求上下文主线。

## 先分清三件不同的事

### 1. 认证 Authentication

回答的是：

- 你是谁
- 你有没有带合法凭证

例如：

- Bearer token
- Session cookie
- API key
- mTLS / 代理注入身份

### 2. 授权 Authorization

回答的是：

- 你能不能做这件事
- 你能不能访问这个资源

例如：

- 当前用户能不能读这个订单
- 当前用户是不是管理员
- 当前租户是不是这条数据的拥有者

### 3. 请求上下文 Request Context

回答的是：

- 这一请求沿链路要共享哪些元信息

例如：

- request id
- current user
- tenant id
- 角色 / claims
- 审计字段

这三件事经常一起出现，但职责不同，最好别混着设计。

## 一个务实结论

更稳的边界通常是：

- middleware / extractor：做认证和上下文注入
- handler：只消费已经解析好的上下文
- service：做真正的业务授权判断

不要把所有权限判断都塞进 middleware，也不要把身份解析散在每个 handler 里。

## Axum 里几种相关工具分别适合什么

官方主线里，最常见的是这些：

- `middleware::from_fn`
- `middleware::from_fn_with_state`
- `middleware::from_extractor`
- `State<T>`
- `Extension<T>`
- `Router::route_layer`

### `from_fn`

根据 `axum::middleware::from_fn` 官方文档：

- 它适合写 async middleware
- 可以用 `FromRequestParts` extractors
- 不支持直接提取 `State`

所以如果你的 middleware 不需要应用状态，这是最直接的入口。

### `from_fn_with_state`

官方文档明确说明：

- 它就是“带 state 的 middleware”

适合：

- 认证需要访问密钥配置
- 需要数据库 / cache / user service
- 需要 tenant / issuer / jwk 配置

### `from_extractor`

官方文档明确说明：

- 如果 extractor 成功，值会被丢弃，只是允许请求继续
- 如果 extractor 失败，就直接返回 rejection

这非常适合：

- “只是做验证，不需要把结果显式传给 handler”
- 某些路由统一要求已登录
- 某些路由统一要求 header / claims 合法

## `State` 和 `Extension` 不要混职责

Axum 官方文档的区分很重要：

- `State`：全局共享状态
- `Extension`：更适合请求级数据

所以更稳的做法通常是：

### 放进 `State`

- 配置
- 密钥集 / verifier
- user service / repo
- 权限服务
- request id 生成器

### 放进 `Extension`

- 当前用户
- 当前租户
- 当前 request id
- 当前 claims

不要把每个请求独有的用户身份直接塞进全局 `AppState`。

## 一个更接近真实项目的认证 middleware

一个很常见的结构是：

1. 从 `Authorization` header 取凭证
2. 校验 token / session
3. 解析出 `CurrentUser`
4. 写进 request extensions
5. 交给下游 handler / service

例如：

```rust
use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};

#[derive(Clone)]
struct AppState {
    auth: AuthService,
}

#[derive(Clone)]
struct CurrentUser {
    user_id: i64,
    tenant_id: String,
}

async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    let Some(value) = request.headers().get(axum::http::header::AUTHORIZATION) else {
        return StatusCode::UNAUTHORIZED.into_response();
    };

    let Ok(token) = value.to_str() else {
        return StatusCode::UNAUTHORIZED.into_response();
    };

    let Ok(current_user) = state.auth.authenticate_bearer(token).await else {
        return StatusCode::UNAUTHORIZED.into_response();
    };

    request.extensions_mut().insert(current_user);
    next.run(request).await
}
```

这段代码里最重要的不是 token API，而是职责：

- middleware 只负责认证和上下文注入
- handler 不再自己拆 header
- 下游拿到的是语义化的 `CurrentUser`

## 当前用户注入后，handler 应该拿“类型”，不要再拿原始 header

更稳的 handler 通常像这样：

```rust
use axum::{Extension, Json};

#[derive(serde::Serialize)]
struct ProfileResponse {
    user_id: i64,
}

async fn profile(
    Extension(current_user): Extension<CurrentUser>,
) -> Json<ProfileResponse> {
    Json(ProfileResponse {
        user_id: current_user.user_id,
    })
}
```

这比在每个 handler 里都去：

- 读 header
- 解析 token
- 查当前用户

要稳得多。

## 但直接提 `Extension<T>` 有一个风险

Axum 文档也明确提醒过：

- 如果你提取了一个不存在的 `Extension<T>`，会变成运行时错误，最终返回 `500 Internal Server Error`

这意味着：

- 如果你忘了加 middleware
- 或写错了 extension 类型

问题不会在编译期发现。

所以更稳的做法通常是：

- 对核心身份上下文写自定义 extractor
- 或确保对应路由一定先套上认证 middleware
- 或在早期阶段用 `Option<Extension<T>>` 做更明确的兜底

## `route_layer` 对认证尤其重要

Axum 官方 `route_layer` 文档有一个很实用的提醒：

- 对“会提前返回”的 middleware，例如 authorization，更适合 `route_layer`
- 否则本来应该是 `404 Not Found` 的请求，可能被中间件变成 `401 Unauthorized`

这是服务里很常见的坑。

更稳的做法通常是：

```rust
use axum::{middleware, routing::get, Router};

let protected = Router::new()
    .route("/me", get(profile))
    .route_layer(middleware::from_fn_with_state(state.clone(), auth_middleware));
```

这样：

- 已存在的受保护路由才会走 auth middleware
- 不存在的路径仍然保持 404 语义

## middleware 做认证，service 做授权

很多项目一开始会把“你是谁”和“你能不能做这件事”都放进 middleware。

这在简单场景能跑，但很容易走偏。

更稳的拆法通常是：

### middleware / extractor

负责：

- 解析 token / session
- 识别当前用户
- 注入上下文

### service

负责：

- 这个用户能不能看这条订单
- 这个租户能不能操作这个资源
- 当前角色是否允许执行某用例

原因很直接：

- 授权判断往往依赖业务数据
- 业务数据通常在 service / repo 层才拿得到

如果把所有授权都提前放进 middleware，最后很容易出现：

- 需要在 middleware 里查数据库
- 权限规则和业务规则缠在一起
- 很难测试资源级权限

## 一个更务实的授权边界

可以这样理解：

- middleware：把“当前调用者是谁”讲清楚
- service：把“当前调用者能不能做这件事”讲清楚

例如：

```rust
pub async fn cancel_order(
    current_user: &CurrentUser,
    order_id: i64,
    repo: &OrderRepo,
) -> Result<(), CancelOrderError> {
    let order = repo.find(order_id).await?.ok_or(CancelOrderError::NotFound)?;

    if order.user_id != current_user.user_id && !current_user.is_admin() {
        return Err(CancelOrderError::Forbidden);
    }

    repo.cancel(order_id).await?;
    Ok(())
}
```

这样资源级权限会更清楚，也更容易单测。

## `ValidateRequestHeaderLayer` 适合简单校验，不适合复杂真实认证

`tower-http` 官方文档提供了 `validate_request` 模块和 `ValidateRequestHeaderLayer`。

它适合：

- 某些固定 header 的存在性校验
- 很简单的 bearer / basic demo 保护

但官方文档也已经明确把：

- `ValidateRequestHeader::basic`
- `ValidateRequestHeader::bearer`

标成“too basic to be useful in real applications”。

这意味着真实项目里更稳的做法通常还是：

- 自己写 middleware / extractor
- 接自己的 verifier / user service / session store

不要把 demo 级 bearer 校验直接等同于完整认证系统。

## request id 要先生成，再进 trace

`tower-http::request_id` 官方文档明确给了一个很实用的顺序建议：

- 先 set request id
- 再进 `TraceLayer`
- 再把 request id propagate 到 response

原因是：

- 这样 request id 才能正确出现在 tracing 日志里
- 并且响应头也能带回同一个 id

这一点对排障非常关键。

一个常见顺序通常是：

```rust
use tower::ServiceBuilder;
use tower_http::{
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer},
    trace::TraceLayer,
};

let app = Router::new()
    .route("/me", get(profile))
    .layer(
        ServiceBuilder::new()
            .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
            .layer(TraceLayer::new_for_http())
            .layer(PropagateRequestIdLayer::x_request_id())
    );
```

## 请求上下文不要无限膨胀

请求上下文里最常见的反模式是：

- 什么都往 extension 塞

更稳的原则通常是：

- 只放真正跨层共享的请求元信息
- 不放大型可变对象
- 不放可以在局部重新计算的小值

比较典型的上下文字段：

- `CurrentUser`
- `RequestId`
- `TenantId`
- `PermissionsSnapshot`

不太适合放进去的：

- 大块响应缓存
- 可随处修改的临时中间状态
- 纯业务过程变量

## WebSocket upgrade 前就该完成认证

如果你的服务还有 WebSocket，认证边界更要提前。

更稳的主线通常是：

1. 在普通 HTTP handler / middleware 阶段完成认证
2. 把 `CurrentUser` 或最小身份信息 move 进 `on_upgrade`
3. 升级后只做连接生命周期管理

不要等连接已经 upgrade 成功，再在 socket 任务里补“你到底是谁”的第一道校验。

如果你正在补这条线，继续看：

- [Rust WebSocket 与 SSE 实践](./websocket-and-sse-practice.md)

## 测试怎么做

认证与上下文这条线，至少建议拆三层测试：

### 1. 纯认证逻辑测试

例如：

- token 解析
- claims 校验
- 角色映射
- 过期时间判断

这层最好尽量不依赖 Axum。

### 2. middleware / extractor 集成测试

验证：

- 缺 header 返回 401
- 非法 token 返回 401
- 合法 token 会注入 `CurrentUser`
- request id 会正确生成和透传

### 3. service 授权测试

验证：

- 当前用户是否能访问某资源
- 管理员与普通用户差异
- 跨租户拒绝

授权测试最好独立于具体 HTTP 框架。

## 常见误区

### 误区 1：每个 handler 自己拆认证 header

这会让认证逻辑和错误语义到处散落。

### 误区 2：把授权全塞进 middleware

资源级权限很多时候必须依赖业务数据，强塞 middleware 会让边界越来越乱。

### 误区 3：受保护路由直接用 `layer`，忽略 `route_layer`

很容易把本来应该返回 404 的路径改成 401。

### 误区 4：当前用户直接塞进全局 `AppState`

请求级数据和全局共享状态职责完全不同。

### 误区 5：request id 顺序放错，导致 tracing 里看不到正确 id

这会直接降低排障效率。

## 推荐回查入口

- Web 服务主线：[Axum Web 服务实践](./axum-web-service-practice.md)
- API 错误边界：[Rust API 错误响应与响应体设计实践](./api-error-and-response-design-practice.md)
- 多租户隔离：[Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)
- 审计记录边界：[Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)
- Secrets 与轮换：[Rust Secrets、密钥与凭证轮换实践](./secret-management-and-credential-rotation-practice.md)
- 运行时开关治理：[Rust Feature Flag、运行时开关与灰度治理实践](./feature-flag-and-runtime-governance-practice.md)
- 回调验签边界：[Rust Webhook、回调与签名校验实践](./webhook-and-callback-practice.md)
- 外部调用边界：[Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)
- 实时连接鉴权：[Rust WebSocket 与 SSE 实践](./websocket-and-sse-practice.md)
- 项目骨架：[Rust 后端项目骨架](./backend-project-skeleton.md)
- 结构化观测：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)

## 推荐资料

- [axum middleware](https://docs.rs/axum/latest/axum/middleware/)
- [axum `from_fn`](https://docs.rs/axum/latest/axum/middleware/fn.from_fn.html)
- [axum `from_fn_with_state`](https://docs.rs/axum/latest/axum/middleware/fn.from_fn_with_state.html)
- [axum `from_extractor`](https://docs.rs/axum/latest/axum/middleware/fn.from_extractor.html)
- [axum `route_layer`](https://docs.rs/axum/latest/axum/struct.Router.html#method.route_layer)
- [tower-http request_id](https://docs.rs/tower-http/latest/tower_http/request_id/)
- [tower-http validate_request](https://docs.rs/tower-http/latest/tower_http/validate_request/)

## 自检

你至少应该能回答：

1. 认证、授权和请求上下文为什么是三件不同的事？
2. 什么时候更适合 middleware，什么时候更适合 extractor？
3. 为什么资源级授权判断通常更适合放在 service 层？
4. 为什么受保护路由更应该优先考虑 `route_layer`？
5. 为什么 request id 必须先生成，再进入 `TraceLayer`？

这些问题理顺后，Rust 服务里的认证链路才会从“能过 token”进入“边界清楚、可扩展、可排障”的状态。
