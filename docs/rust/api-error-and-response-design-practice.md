---
title: Rust API 错误响应与响应体设计实践
description: 从 axum IntoResponse、状态码分层、统一错误体、请求级错误到内部错误边界，整理 Rust HTTP API 的错误响应与响应体设计主线。
search: false
---

# Rust API 错误响应与响应体设计实践

Rust 服务做到一定阶段，接口问题通常不再是“能不能返回 JSON”，而是：

- 为什么同类错误有时返回 400，有时返回 500
- 为什么错误体结构每个接口都不一样
- 为什么有的 handler 直接 `(StatusCode, String)`，有的返回自定义错误
- 为什么超时、限流、认证失败和业务失败看起来像四套风格

这些问题的共同点是：

**HTTP 响应边界没有被统一设计。**

这页补的就是 Rust 服务里 API 错误响应与响应体设计主线。

## 先分清：业务错误类型，不等于 HTTP 错误响应

很多项目最早会把这两件事混在一起：

- service 层错误
- HTTP 层状态码和错误体

更稳的拆法通常是：

1. 业务层表达业务语义
2. HTTP 边界层决定状态码和响应体

也就是说：

- `OrderNotFound`
- `PermissionDenied`
- `ValidationFailed`
- `DbConflict`

这些首先是业务或基础设施语义，不是 HTTP 协议本身。

HTTP 边界要做的是：

- 把这些语义映射成一致、稳定、可消费的响应

## 一个务实原则：成功响应和错误响应都要像“契约”，不是临时拼接

如果成功体是结构化的，但错误体是随手返回：

- `"bad request"`
- `"invalid parameter"`
- `"internal error"`

调用方很快就会遇到两个问题：

- 不知道哪些字段稳定
- 不知道哪些错误能被程序化处理

所以更稳的方向通常是：

- 成功响应有稳定结构
- 错误响应也有稳定结构

## 错误响应至少要回答 3 件事

一个够用的错误体，至少应该能表达：

1. 发生了什么类型的问题
2. 给调用方看的说明
3. 排障时怎么关联到日志或 trace

一个很常见的最小结构是：

```json
{
  "code": "validation_error",
  "message": "email is invalid",
  "request_id": "req_123"
}
```

这里最重要的不是字段名必须长什么样，而是：

- `code` 稳定、适合程序判断
- `message` 面向人类阅读
- `request_id` 负责和日志链路对齐

## `code` 比 `message` 更适合作为稳定契约

`message` 很容易因为：

- 文案优化
- 多语言
- 更详细的解释

而发生变化。

所以更稳的约定通常是：

- `message` 可以调整
- `code` 应该稳定

例如：

- `bad_request`
- `validation_error`
- `unauthorized`
- `forbidden`
- `not_found`
- `conflict`
- `rate_limited`
- `internal_error`

## 状态码分层不要靠感觉

一个更稳的映射思路通常是：

### 400 Bad Request

更适合：

- 请求结构不合法
- query/path/body 解析失败
- 缺少必填协议字段

### 401 Unauthorized

更适合：

- 没带合法凭证
- token 无效
- session 无效

### 403 Forbidden

更适合：

- 身份合法，但没有权限

### 404 Not Found

更适合：

- 资源不存在

### 409 Conflict

更适合：

- 状态冲突
- 幂等冲突
- 唯一约束冲突

### 422 Unprocessable Entity

更适合：

- 结构能解析
- 但业务上不合法

### 429 Too Many Requests

更适合：

- 被 rate limit 或配额策略拒绝

### 500 Internal Server Error

更适合：

- 你不希望把具体内部细节暴露给调用方

重点不是所有团队必须一字不差，而是：

- 同类问题的映射要一致

## 解析错误、校验错误、业务错误、基础设施错误要分层

一个很务实的顺序是：

1. 解析错误：请求根本不成形
2. 输入校验错误：字段不满足基础约束
3. 业务错误：业务规则不允许
4. 基础设施错误：数据库、外部 API、消息系统等失败

如果这四类错误混在一起，最后通常会变成：

- 调用方只看到一堆 500
- 业务方只看到一堆 `"invalid request"`

如果你想把 DTO、`serde`、`TryFrom` 和领域不变量的输入边界单独理顺，继续看：

- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)

## `IntoResponse` 是 HTTP 边界收口点，不是所有层都该知道的东西

在 `axum` 里，`IntoResponse` 很适合承接：

- 统一错误类型
- 成功/失败响应结构
- 状态码映射

但更稳的原则通常是：

- 只有 HTTP 边界层需要关心 `IntoResponse`
- repo / service 不要直接返回 `StatusCode`

否则很快就会出现：

- service 层开始知道 HTTP
- repo 层开始拼 JSON 错误体
- 测试边界和职责边界一起变糊

## 一个最小错误响应骨架

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde::Serialize;

#[derive(Debug)]
pub enum ApiError {
    BadRequest(&'static str),
    Validation(String),
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict(String),
    Internal,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    code: &'static str,
    message: String,
    request_id: Option<String>,
}

impl ApiError {
    fn into_body(self) -> (StatusCode, ErrorResponse) {
        match self {
            ApiError::BadRequest(message) => (
                StatusCode::BAD_REQUEST,
                ErrorResponse {
                    code: "bad_request",
                    message: message.to_string(),
                    request_id: None,
                },
            ),
            ApiError::Validation(message) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                ErrorResponse {
                    code: "validation_error",
                    message,
                    request_id: None,
                },
            ),
            ApiError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                ErrorResponse {
                    code: "unauthorized",
                    message: "authentication required".into(),
                    request_id: None,
                },
            ),
            ApiError::Forbidden => (
                StatusCode::FORBIDDEN,
                ErrorResponse {
                    code: "forbidden",
                    message: "permission denied".into(),
                    request_id: None,
                },
            ),
            ApiError::NotFound => (
                StatusCode::NOT_FOUND,
                ErrorResponse {
                    code: "not_found",
                    message: "resource not found".into(),
                    request_id: None,
                },
            ),
            ApiError::Conflict(message) => (
                StatusCode::CONFLICT,
                ErrorResponse {
                    code: "conflict",
                    message,
                    request_id: None,
                },
            ),
            ApiError::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorResponse {
                    code: "internal_error",
                    message: "internal server error".into(),
                    request_id: None,
                },
            ),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, body) = self.into_body();
        (status, Json(body)).into_response()
    }
}
```

这段代码里最重要的不是枚举长什么样，而是：

- HTTP 错误已经收敛到单点
- `code` 和状态码都变成稳定契约
- handler 不必重复拼错误 JSON

## `request_id` 应该进入错误响应，但不要污染所有业务错误类型

一个高频问题是：

- request id 到底放哪

更稳的做法通常是：

- 在 HTTP 边界层拿到 request id
- 写进统一错误体
- 不要求业务层错误自己携带 request id

否则很容易变成：

- 每层错误都被迫带一份 trace 元信息

如果你想把 request id、认证、中间件顺序和响应透传单独理顺，继续看：

- [Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)

## 成功响应也要考虑一致性，但不要过度包装

很多团队会把所有成功响应包成：

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

这不一定错，但更稳的判断应该是：

- 这是统一契约的需要
- 还是只是沿用了别的语言里的历史格式

如果接口主要给前端或外部系统消费，一个更务实的原则通常是：

- 错误响应统一优先级更高
- 成功响应按资源语义组织即可

不要为了“看起来统一”，把所有成功体都套进一层低信息量壳子。

## 内部错误要稳定对外“收口”，不要原样暴露

下面这些信息通常只适合打日志，不适合直接返回给调用方：

- SQL 语句
- 数据库连接串细节
- 下游原始错误栈
- 内部文件路径
- 正则、parser 或框架底层细节

更稳的做法通常是：

- 对外返回稳定 `code` + 通用 `message`
- 对内在日志和 trace 里保留详细原因

## 认证、鉴权、限流、超时错误也要进入同一响应风格

这是一类很容易被漏掉的问题。

很多服务业务错误体做得很整齐，但：

- 401 是纯字符串
- 429 是默认文本
- timeout 是另一套错误体

最后调用方看到的还是碎片化协议。

更稳的方向通常是：

- auth middleware
- rate limit / timeout layer
- handler 业务错误

最终都收口到同一套错误体风格。

如果你想把 timeout、rate limit、load shed 的边界单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## `HandleErrorLayer` 解决的是“中间件错误也要进统一响应边界”

这点非常关键。

因为在 `axum` + `tower` 里，超时、限流、load shed 这类 layer 可能自己报错。

如果你不显式处理，最终就会出现：

- 业务错误一套风格
- 中间件错误另一套风格

所以更稳的思路通常是：

- 让 layer 错误也映射到统一错误响应

## 业务层错误不要太早扁平成 HTTP

例如：

- `OrderAlreadyPaid`
- `CouponExpired`
- `InventoryNotEnough`

这些在 service 层更适合先保留业务语义。

等到了 HTTP 边界，再决定映射成：

- 409
- 422
- 404

这样做的价值是：

- 业务层不会被协议绑定
- CLI、worker、HTTP 三种入口也更容易共用同一批 service

## 数据库冲突和业务冲突不要混成同一个 500

一个高频坏味道是：

- unique constraint 冲突
- 条件更新失败
- 幂等重复提交

最后都变成：

- `INTERNAL_SERVER_ERROR`

这对调用方和排障都很差。

更稳的原则通常是：

- 资源不存在：404
- 状态冲突 / 唯一键冲突 / 幂等冲突：409
- 输入值本身不合法：400 或 422

如果你正在处理条件更新、幂等和 Outbox，一并继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 文档和测试要围绕错误契约写

错误响应如果没有测试，很容易慢慢漂。

至少值得覆盖：

### handler / 集成测试

- 非法输入返回什么状态码
- 找不到资源返回什么结构
- 权限不足返回什么结构
- 超时 / 限流是否仍然走统一错误体

### 回归测试

- 某次线上新增错误体字段后是否破坏兼容
- 某类错误是否被错误地改成了 500

如果你想把路径 / header 版本策略、错误契约兼容性和弃用窗口单独理顺，继续看：

- [Rust API Versioning、兼容演进与弃用治理实践](./api-versioning-and-compatibility-governance-practice.md)

### 文档约定

- 哪些 `code` 是稳定契约
- 哪些 `message` 只是展示文案
- `request_id` 是否总是存在

如果你想把输入校验和回归测试单独理顺，继续看：

- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)
- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)
- [Rust Webhook、回调与签名校验实践](./webhook-and-callback-practice.md)
- [测试与质量实践](./testing-and-quality-practice.md)

## 常见误区

### 误区 1：handler 到处手写 `(StatusCode, String)`

短期快，后面错误风格几乎必然失控。

### 误区 2：把 service / repo 层直接绑到 HTTP 状态码

这会让复用能力和测试边界明显变差。

### 误区 3：把底层错误原样暴露给外部

这既不安全，也不稳定。

### 误区 4：业务错误统一得很好，但中间件错误漏了

最后 401 / 429 / timeout 还是另一套风格。

### 误区 5：只有 `message`，没有稳定 `code`

调用方很难做可靠判断。

## 一组很实用的落地原则

1. 业务错误和 HTTP 错误响应要分层。
2. 统一错误体比统一成功包装更优先。
3. `code` 负责稳定契约，`message` 负责人类可读。
4. 内部错误细节进日志和 trace，不直接裸露给调用方。
5. 中间件错误也要进入同一响应风格。
6. `request_id` 应该帮助排障，但不必污染每一层业务错误类型。

## 自检问题

你至少应该能回答：

1. 为什么业务错误类型不能直接等同于 HTTP 状态码？
2. 为什么稳定 `code` 往往比 `message` 更重要？
3. 为什么中间件错误也必须进入统一错误边界？
4. 哪些错误适合 400/401/403/404/409/422/429/500？
5. 为什么不该把数据库或下游底层错误原样返回给调用方？

把这些问题讲清楚，你才算真正把 Rust HTTP API 的错误响应边界收住了，而不是“能回一个状态码”。
