---
title: Rust HTTP Client 与外部 API 实践
description: 从 reqwest 的同步与异步 Client，到超时、重试、认证、错误分层、幂等性、tracing 和测试，整理 Rust 外部 API 调用的工程主线。
search: false
---

# Rust HTTP Client 与外部 API 实践

Rust 服务和 CLI 一旦走到真实工程，很快就会碰到另一条主线：

- 调第三方 HTTP API
- 调公司内部服务
- 处理超时、认证、重试和降级
- 把外部错误和本地业务错误分开

这件事看起来只是“发个请求”，但工程里真正难的通常不是 API 调不调得通，而是：

- Client 怎么建
- 超时怎么设
- 哪些错误能重试
- 哪些请求必须幂等
- 日志和 tracing 应该记什么

这页专门讲 Rust 里外部 HTTP 调用的工程边界。

## 先分清：这是“调用边界”，不是“框架细节”

无论你是在：

- CLI 里调一个 REST API
- `axum` 服务里调下游服务
- worker 里批量访问外部系统

本质上都在做同一件事：

- 从本地进程边界跨到外部系统边界

这意味着你必须显式处理：

- 网络不可靠
- 上游状态码不是你能控制的
- 协议可能漂移
- 重试可能带来副作用

## sync 还是 async，先判断场景

一个最简单也最容易做错的选择就是：

- CLI 到底用 blocking client 还是 async client
- 服务里到底什么时候该上 async

### CLI 更适合什么

如果你的工具是：

- 单次请求
- 少量串行请求
- 主要工作不是高并发等待

那通常优先：

- `reqwest::blocking::Client`

这能避免把整个 CLI 无端带进 Tokio runtime。

### 服务和 worker 更适合什么

如果你的程序是：

- `axum` 服务
- 异步 worker
- 会并发等待多个上游 I/O

那通常优先：

- 异步 `reqwest::Client`

不要为了一个请求就把 CLI 全改 async；也不要在 async 服务里偷偷塞 blocking HTTP。

## `Client` 要复用，不要每次请求都新建

reqwest 官方文档明确说明：

- `Client` 内部持有连接池
- 建议创建一个并复用
- 不需要额外用 `Arc` 再包一层来复用

这点非常关键。很多项目的第一个反模式就是：

```rust
async fn fetch(url: &str) -> Result<String, reqwest::Error> {
    let client = reqwest::Client::new();
    client.get(url).send().await?.text().await
}
```

这种写法的问题不是“不能用”，而是：

- 连接池复用价值被丢掉
- 配置散落
- 超时、认证和 headers 没法统一

更稳的做法通常是：

```rust
use std::time::Duration;

#[derive(Clone)]
pub struct ApiClient {
    http: reqwest::Client,
    base_url: String,
    token: String,
}

impl ApiClient {
    pub fn new(base_url: String, token: String) -> Result<Self, reqwest::Error> {
        let http = reqwest::Client::builder()
            .user_agent(concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION")))
            .connect_timeout(Duration::from_secs(2))
            .timeout(Duration::from_secs(10))
            .build()?;

        Ok(Self { http, base_url, token })
    }
}
```

## 把 reqwest 停在边界层

很多 Rust 项目一开始都会这样写：

- handler 里直接 `reqwest::get(...)`
- service 里直接拼 URL
- 各处手工塞 header

这会导致：

- URL 规则散落
- 认证逻辑散落
- 错误边界散落
- tracing 和超时策略散落

更稳的方式是：

- 定义一个外部 API client / gateway
- 由它负责 URL、认证、超时、状态码映射
- 业务层只调用语义化方法

例如：

```rust
pub struct GithubClient {
    http: reqwest::Client,
    base_url: String,
}

impl GithubClient {
    pub async fn get_repo(&self, owner: &str, repo: &str) -> Result<RepoDto, ApiError> {
        let url = format!("{}/repos/{owner}/{repo}", self.base_url);

        let response = self
            .http
            .get(url)
            .send()
            .await
            .map_err(ApiError::Transport)?;

        let response = response.error_for_status().map_err(ApiError::HttpStatus)?;

        response.json::<RepoDto>().await.map_err(ApiError::Decode)
    }
}
```

这样做的价值是：

- 上游协议变更只改一处
- 认证和 header 策略只改一处
- 测试也更容易集中

## timeout 必须显式设计

reqwest 官方文档明确区分了几类 timeout：

- `ClientBuilder::timeout()`：总请求超时
- `ClientBuilder::connect_timeout()`：连接阶段超时
- `RequestBuilder::timeout()`：单请求覆盖超时

这几个边界不要混着理解。

### 更稳的默认思路

至少先有两层：

1. client 级默认 timeout
2. 个别慢接口按请求覆盖 timeout

例如：

```rust
use std::time::Duration;

let response = client
    .get(url)
    .timeout(Duration::from_secs(30))
    .send()
    .await?;
```

如果你完全不设 timeout，外部 API 卡住时，本地资源会被一直占着。

## 错误要分层，不要都抹平成一种

外部 API 错误通常至少有四层：

1. 传输层错误
2. HTTP 状态码错误
3. 响应反序列化错误
4. 上游业务错误

把这四层混成一个 `anyhow!("request failed")`，排障会很痛苦。

一个比较稳的错误枚举：

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("transport error: {0}")]
    Transport(#[from] reqwest::Error),

    #[error("upstream returned error status: {0}")]
    HttpStatus(reqwest::Error),

    #[error("failed to decode upstream response: {0}")]
    Decode(reqwest::Error),

    #[error("upstream business error: {0}")]
    Upstream(String),
}
```

重点不是错误类型长什么样，而是你能不能回答：

- 是没连上
- 还是上游返回了 500
- 还是 200 但 body 不符合预期
- 还是上游自己说业务失败

## `error_for_status()` 很值得默认接上

reqwest 的 `Response::error_for_status()` 会把 4xx/5xx 状态转成错误。

它很适合做默认入口，因为大多数工程代码并不希望：

- 200 和 500 都继续按成功路径往下走

但要注意：

- 如果你需要保留错误响应体做进一步解析
- 就先别立刻把 `Response` 消耗掉

这时更适合先看：

- `status()`
- `text()` / `json()`

再决定映射方式。

## retry 不是默认安全动作

retry 最常见的误区是：

- 只要失败就重试

这在外部 API 场景里很危险，因为很多请求不是天然幂等的。

### 更稳的判断顺序

先问三件事：

1. 这个请求是不是幂等？
2. 失败是不是暂时性错误？
3. 上游能不能接受同一个请求被执行多次？

### 通常更适合 retry 的场景

- GET
- HEAD
- 幂等查询
- 明确支持幂等键的写请求
- 网络抖动、临时 502/503/504 这类暂时性错误

### 不该默认 retry 的场景

- 创建订单
- 扣款
- 发货
- 发送短信
- 任何可能造成副作用重复执行的请求

reqwest 当前最新文档里已经有 `retry` 模块，但官方文档也明确强调：

- retry 策略必须基于“安全可重试”的判断
- 是否能重试，需要了解目标服务行为

所以真正重点不是“有没有 retry API”，而是你的重试分类是否正确。

## 幂等不是服务端才需要想

只要你调用外部写操作，就必须考虑幂等。

典型策略包括：

- 请求方法天然幂等
- 使用 `Idempotency-Key`
- 本地请求 ID 去重
- 上游提供事务号 / 幂等 token

如果你没有明确幂等策略，就不要轻易给写请求自动重试。

如果你想把请求级幂等、状态推进、数据库唯一约束和 Outbox 一起理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 认证、header 和 URL 不要散在业务里

reqwest 的 `RequestBuilder` 提供了：

- `bearer_auth`
- `basic_auth`
- `header`
- `json`
- `query`

这些能力应该集中在 client/gateway 边界层里，而不是到处手写。

例如：

```rust
let response = self
    .http
    .get(format!("{}/v1/items", self.base_url))
    .bearer_auth(&self.token)
    .query(&params)
    .send()
    .await?;
```

工程上更重要的是：

- token 不要打日志
- header 不要在多个函数里重复组装
- base URL 不要在代码各处拼字符串

如果你想把 token 注入、脱敏和凭证轮换边界单独理顺，继续看：

- [Rust Secrets、密钥与凭证轮换实践](./secret-management-and-credential-rotation-practice.md)

## tracing 要覆盖外部依赖调用边界

外部 API 是最该加 tracing 的位置之一。

至少建议带这些字段：

- upstream 名称
- method
- path 或目标操作
- status code
- latency
- retry_count
- request_id / trace_id

不要记录：

- bearer token
- 完整敏感响应体
- 含隐私数据的完整 query string

如果你想把 DTO 暴露、日志 / trace / audit 脱敏、导出和对象存储交付里的敏感字段边界单独理顺，继续看：

- [Rust 数据脱敏、隐私字段与日志安全实践](./data-masking-privacy-and-log-safety-practice.md)

一个很实用的模式是：

```rust
use tracing::instrument;

#[instrument(skip(self), fields(upstream = "github", owner, repo))]
pub async fn get_repo(&self, owner: &str, repo: &str) -> Result<RepoDto, ApiError> {
    // ...
}
```

## 配置层要收住 base URL、timeout、认证信息

外部 API 相关配置通常至少包括：

- base URL
- connect timeout
- request timeout
- token / basic auth
- 重试上限
- user agent

这些字段应该收敛到配置结构体里，而不是散在业务代码常量里。

更稳的模式通常是：

- `ExternalApiConfig`
- `GithubConfig`
- `PaymentGatewayConfig`

这样测试和环境切换都更可控。

## 测试不要直连真实外部 API

外部 HTTP 调用至少建议补三层测试：

### 1. 纯映射测试

测试：

- DTO 解析
- 错误映射
- 配置加载

### 2. 本地 HTTP server 测试

例如在测试里启动一个本地 `axum` 或 hyper server，验证：

- 认证头是否带上
- 状态码映射是否正确
- timeout 是否生效
- malformed JSON 是否按预期失败

如果你想把本地 HTTP server、fake / stub、mock 框架和 Tokio 异步测试这条隔离主线单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

### 3. 少量集成联调测试

如果必须打真实环境，也要：

- 单独隔离
- 控制频率
- 不放进高频单测链路

## 一个够用的 client 分层

比较稳的组织方式通常是：

1. `config.rs`：外部 API 配置
2. `client.rs`：reqwest client 构造
3. `gateway.rs` / `github_client.rs`：语义化调用方法
4. `dto.rs`：上游请求/响应 DTO
5. `error.rs`：外部依赖错误分层

这样：

- URL
- headers
- timeout
- tracing
- decode

都能停在同一条边界上。

如果你想把外部 API DTO、内部领域模型和数据库模型之间的映射边界单独理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

## 常见误区

### 1. 每个请求都新建 `Client`

会丢掉连接池复用价值，也让配置和观测散落。

### 2. 不设 timeout

这是最典型的“本地资源被上游拖死”的起点。

### 3. 把所有失败都重试

很容易把非幂等写请求放大成重复副作用。

### 4. 业务层直接拼 URL 和 header

后面一改认证或版本路径，影响面会很大。

### 5. 把上游 4xx/5xx 和 transport error 混成一种

排障时会很难判断问题到底在网络、协议还是业务。

## 一个够用的外部 API 清单

每次准备接一个新外部 API，先过一遍：

1. 这是 sync 还是 async 场景？
2. `Client` 是否会被复用？
3. timeout 是否显式配置了？
4. 错误是否分清 transport / status / decode / upstream 业务错误？
5. retry 是否只作用在安全可重试请求上？
6. tracing 是否带了上游名、状态码和耗时？

这 6 个问题答清楚，外部 API 边界通常就不会太乱。

## 推荐回查入口

- CLI 工具实践：[Rust CLI 工具实践](./cli-tool-practice.md)
- 配置管理：[Rust 配置管理实践](./configuration-management-practice.md)
- 依赖治理：[Rust 常用 crate 选型与工程边界](./crate-selection-and-boundaries.md)
- 回调验签：[Rust Webhook、回调与签名校验实践](./webhook-and-callback-practice.md)
- Tokio 主线：[Tokio 与 Async 工程实践](./tokio-and-async-practice.md)
- 可观测性：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 数据脱敏与日志安全：[Rust 数据脱敏、隐私字段与日志安全实践](./data-masking-privacy-and-log-safety-practice.md)

如果你已经会写 Rust，但每次一接外部 HTTP API 就开始在超时、认证、重试和错误边界上反复返工，这页应该放进服务工程主线的必读列表。
