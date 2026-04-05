---
title: Rust gRPC 与 Tonic 实践
description: 基于 tonic 的 Rust gRPC 实践主线，覆盖 proto 定义、代码生成、服务端与客户端、流式 RPC、拦截器、健康检查与工程治理。
search: false
---

# Rust gRPC 与 Tonic 实践

> 本页按 tonic 生态的工程主线整理，重点不是列 API，而是帮你把 proto 定义、代码生成、服务端、客户端、流式 RPC、拦截器和健康检查串成一条可落地的工程链路。

做后端服务间通信时，REST + JSON 是最常见的选择，但并不总是最合适的。一旦你的场景满足以下几个条件中的大部分，gRPC 就值得认真考虑：

- 服务间调用频繁、延迟敏感
- 接口契约需要强类型保证
- 有流式需求（进度推送、日志流、双向通信）
- 需要跨语言互操作（Go、Java、Python 等共用同一份 proto）
- 需要 HTTP/2 的多路复用和头部压缩

反过来，如果你的场景是面向浏览器的公开 API、需要人类可读性、或调用方不方便引入 proto 工具链，REST 仍然是更务实的选择。

## tonic 在 Rust gRPC 生态中的位置

Rust 的 gRPC 生态目前以 tonic 为核心：

| 角色 | crate | 说明 |
| --- | --- | --- |
| gRPC 框架 | `tonic` | 基于 hyper + tower 的 gRPC 实现 |
| proto 编解码 | `prost` | 纯 Rust 的 Protocol Buffers 实现 |
| 构建时代码生成 | `tonic-build` | 在 build.rs 中生成 Rust 代码 |
| 健康检查 | `tonic-health` | gRPC Health Checking Protocol |
| 反射 | `tonic-reflection` | 支持 grpcurl 等工具动态查询服务 |
| 中间件 | `tower` | tonic 底层就是 tower Service |

tonic 最大的特点是：它不是一个独立封闭的框架，而是深度融入 tower 生态。这意味着你在 axum 中积累的 tower layer 经验，在 tonic 中同样适用。

## Proto 定义与代码生成

### proto 文件组织

典型目录结构：`proto/greeter/v1/greeter.proto`，用目录分服务，用 `v1/` 显式标记版本，`package` 和目录结构保持对应。

最小 proto 文件：

```protobuf
syntax = "proto3";

package greeter.v1;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

### tonic-build 与 prost 的关系

`prost` 负责把 proto message 编译成 Rust struct 并处理序列化；`tonic-build` 在 prost 之上额外生成 service trait 和 client struct。`tonic-build` 依赖 `prost`，你通常不需要直接调用 `prost`。

### build.rs 配置

在 `Cargo.toml` 中：

```toml
[dependencies]
tonic = "0.12"
prost = "0.13"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }

[build-dependencies]
tonic-build = "0.12"
```

在 `build.rs` 中：

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &["proto/greeter/v1/greeter.proto"],
            &["proto"],
        )?;
    Ok(())
}
```

这里最重要的是第二个参数 `&["proto"]`，它指定了 proto 的 include 路径，确保 import 能正确解析。

### 生成代码的引用方式

tonic-build 默认输出到 `OUT_DIR`，用宏引用：

```rust
pub mod greeter {
    pub mod v1 {
        tonic::include_proto!("greeter.v1");
    }
}
```

如果想让生成代码可见、方便 code review 和 IDE 跳转，可以配置 `.out_dir("src/pb")` 输出到固定目录，然后用普通 `mod` 引入。

## 服务端实现

### 实现 proto 生成的 trait

tonic-build 会为每个 service 生成一个 trait。实现它就是写服务端的核心逻辑：

```rust
use tonic::{Request, Response, Status};
use crate::greeter::v1::{
    greeter_server::Greeter,
    HelloRequest, HelloReply,
};

pub struct GreeterService {
    // 业务依赖注入到这里
    db: PgPool,
}

#[tonic::async_trait]
impl Greeter for GreeterService {
    async fn say_hello(
        &self,
        request: Request<HelloRequest>,
    ) -> Result<Response<HelloReply>, Status> {
        let name = request.into_inner().name;
        let reply = HelloReply {
            message: format!("Hello, {}!", name),
        };
        Ok(Response::new(reply))
    }
}
```

关键设计：`Request<T>` 封装消息体和 metadata（类似 HTTP header），错误统一用 `Status` 表达，服务本身是普通 struct，依赖注入就是给字段赋值。

### Server 构建与启动

```rust
use tonic::transport::Server;
use crate::greeter::v1::greeter_server::GreeterServer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "0.0.0.0:50051".parse()?;

    Server::builder()
        .add_service(GreeterServer::new(GreeterService { db: pool }))
        .serve(addr)
        .await?;

    Ok(())
}
```

### 与 Axum 共存：共享同一个端口

实际项目中常需要同时暴露 gRPC 和 HTTP 接口。tonic 和 axum 都基于 hyper，可以共享端口：

```rust
let app = axum::Router::new()
    .route("/health", axum::routing::get(|| async { "ok" }))
    .fallback_service(
        tonic::transport::Server::builder()
            .add_service(GreeterServer::new(greeter))
            .into_router()
    );

let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
axum::serve(listener, app).await?;
```

关键点：tonic 0.12+ 的 `into_router()` 返回 axum 兼容的 Router，可以直接组合，不需要开两个端口。

### 依赖注入

gRPC 服务的依赖注入很直接——服务就是普通 struct，创建时传入依赖。如果需要跨多个 service 共享，用 `Arc` 包装。

## 客户端实现

### Channel 与连接管理

```rust
use crate::greeter::v1::greeter_client::GreeterClient;
use tonic::transport::Channel;

let channel = Channel::from_static("http://127.0.0.1:50051")
    .connect()
    .await?;

let mut client = GreeterClient::new(channel);
```

`Channel` 内部管理连接池和 HTTP/2 多路复用，通常只需创建一个并复用。

### 超时与重试

```rust
let channel = Channel::from_static("http://127.0.0.1:50051")
    .timeout(Duration::from_secs(5))
    .connect_timeout(Duration::from_secs(3))
    .connect()
    .await?;
```

tonic 不内置重试。需要重试时，要么业务层封装，要么使用 tower 的 `RetryLayer` 并自定义 `Policy` 来决定哪些 Status code 可重试。

### 拦截器添加认证 header

客户端拦截器最常见的用途是注入认证信息：

```rust
use tonic::{Request, Status};

fn auth_interceptor(mut req: Request<()>) -> Result<Request<()>, Status> {
    req.metadata_mut().insert(
        "authorization",
        "Bearer my-token".parse().unwrap(),
    );
    Ok(req)
}

let client = GreeterClient::with_interceptor(channel, auth_interceptor);
```

这比手动在每个调用里设置 metadata 干净得多。

## 流式 RPC

流式 RPC 是 gRPC 相比 REST 最显著的能力差异。有三种流式模式：

### Server streaming

服务端返回一个流，客户端逐条接收。典型场景：日志流、进度推送、查询结果分批返回。

proto 定义：

```protobuf
rpc ListOrders (ListOrdersRequest) returns (stream Order);
```

服务端实现：

```rust
use tokio_stream::wrappers::ReceiverStream;

async fn list_orders(
    &self,
    request: Request<ListOrdersRequest>,
) -> Result<Response<Self::ListOrdersStream>, Status> {
    let (tx, rx) = tokio::sync::mpsc::channel(32);

    tokio::spawn(async move {
        for order in fetch_orders().await {
            if tx.send(Ok(order)).await.is_err() {
                break; // 客户端已断开
            }
        }
    });

    Ok(Response::new(ReceiverStream::new(rx)))
}
```

### Client streaming

客户端发送一个流，服务端最终返回一个结果。典型场景：文件上传、批量数据导入。

```protobuf
rpc UploadData (stream DataChunk) returns (UploadResult);
```

```rust
async fn upload_data(
    &self,
    request: Request<tonic::Streaming<DataChunk>>,
) -> Result<Response<UploadResult>, Status> {
    let mut stream = request.into_inner();
    let mut total_bytes = 0;

    while let Some(chunk) = stream.message().await? {
        total_bytes += chunk.data.len();
        // 处理每个 chunk
    }

    Ok(Response::new(UploadResult { total_bytes: total_bytes as u64 }))
}
```

### Bidirectional streaming

双向流。典型场景：聊天、实时协作、双向命令流。

```protobuf
rpc Chat (stream ChatMessage) returns (stream ChatMessage);
```

双向流的实现核心是同时处理输入流和输出流，通常用 `tokio::select!` 或 spawn 独立任务来并行处理。

### 背压和取消

流式 RPC 中两个关键的工程问题：

- **背压**：用有界 channel（如 `mpsc::channel(32)`）。当消费者跟不上时，发送端会自然阻塞。不要用无界 channel，否则慢消费者会把内存拖爆。
- **取消**：当客户端断开时，`tx.send()` 会返回 `Err`，你应该据此停止生产。配合 `CancellationToken` 可以实现更精细的取消传播。

## 拦截器与中间件

### tonic 的 Interceptor

Interceptor 签名是 `fn(Request<()>) -> Result<Request<()>, Status>`，在请求到达 handler 之前执行，可以读取/修改 metadata、做认证检查、注入上下文：

```rust
fn auth_check(req: Request<()>) -> Result<Request<()>, Status> {
    match req.metadata().get("authorization") {
        Some(token) if token == "Bearer valid-token" => Ok(req),
        _ => Err(Status::unauthenticated("invalid token")),
    }
}

let service = GreeterServer::with_interceptor(greeter, auth_check);
```

### 与 tower layer 的关系

Interceptor 适合简单场景。如果你需要更复杂的中间件逻辑（比如访问响应、做耗时统计、异步操作），应该用 tower layer：

```rust
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;
use std::time::Duration;

Server::builder()
    .layer(
        ServiceBuilder::new()
            .timeout(Duration::from_secs(30))
            .layer(TraceLayer::new_for_grpc())
            .into_inner(),
    )
    .add_service(GreeterServer::new(greeter))
    .serve(addr)
    .await?;
```

记住：tonic 服务本身就是 tower `Service`，所以 tower 生态的所有 layer 都可以直接用。

`TraceLayer::new_for_grpc()` 会自动为每个 RPC 调用创建 span，记录方法名、状态码和耗时。配合 `tracing-opentelemetry` 可以直接接入分布式追踪系统。

## 健康检查与反射

### tonic-health

gRPC 有标准的健康检查协议（`grpc.health.v1.Health`），tonic-health 直接实现了它：

```rust
use tonic_health::server::health_reporter;

let (mut health_reporter, health_service) = health_reporter();

// 设置服务状态
health_reporter.set_serving::<GreeterServer<GreeterService>>().await;

Server::builder()
    .add_service(health_service)
    .add_service(GreeterServer::new(greeter))
    .serve(addr)
    .await?;
```

健康检查服务可以被 Kubernetes 的 gRPC 探针和负载均衡器直接消费。

### tonic-reflection

反射让 grpcurl 等工具能动态发现服务，不需要提前拿到 proto 文件。使用时需要在 build.rs 中配置 `file_descriptor_set_path`，然后在服务端注册：

```rust
let reflection_service = tonic_reflection::server::Builder::configure()
    .register_encoded_file_descriptor_set(
        tonic::include_file_descriptor_set!("greeter_descriptor"),
    )
    .build_v1()?;

Server::builder()
    .add_service(reflection_service)
    .add_service(GreeterServer::new(greeter))
    .serve(addr)
    .await?;
```

有了反射后可以直接用 grpcurl 调试：

```bash
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext -d '{"name": "world"}' localhost:50051 greeter.v1.Greeter/SayHello
```

## 错误处理

### tonic::Status 的设计

`tonic::Status` 包含 code（标准 gRPC 状态码）、message（人类可读描述）和可选的 details。常用状态码映射：

| 场景 | gRPC Status | 对应 HTTP 概念 |
| --- | --- | --- |
| 参数校验失败 | `InvalidArgument` | 400 |
| 未认证 | `Unauthenticated` | 401 |
| 无权限 | `PermissionDenied` | 403 |
| 资源不存在 | `NotFound` | 404 |
| 已存在 / 冲突 | `AlreadyExists` | 409 |
| 服务内部错误 | `Internal` | 500 |
| 服务不可用 | `Unavailable` | 503 |

### 从业务错误到 Status

推荐的模式是定义业务错误类型，然后实现 `From<BusinessError> for Status`：

```rust
pub enum AppError {
    NotFound(String),
    Validation(String),
    Internal(anyhow::Error),
}

impl From<AppError> for Status {
    fn from(err: AppError) -> Self {
        match err {
            AppError::NotFound(msg) => Status::not_found(msg),
            AppError::Validation(msg) => Status::invalid_argument(msg),
            AppError::Internal(e) => {
                tracing::error!(error = %e, "internal error");
                Status::internal("internal error")
            }
        }
    }
}
```

注意：`Internal` 错误不要把原始错误信息暴露给客户端，只记录日志，返回通用消息。

## 工程实践

### proto 文件管理

**单 repo**：proto 和服务代码同仓库，适合团队小、改 proto 和代码在同一 PR。**独立 proto repo**：集中管理，适合多语言多团队协作。无论哪种，都建议用 `buf` 做 lint 和 breaking change 检测，并加入 CI。

### 版本兼容策略

proto3 的兼容规则核心：

- **安全**：新增字段、新增 RPC 方法、新增 enum 值
- **不安全**：删除字段、修改字段类型、修改字段编号、重命名 package

实际操作建议：

- 新增字段用新编号，永远不复用已删除的编号
- 需要大改时，用新 package 版本（`v2`）而不是修改现有定义
- 在 CI 中用 `buf breaking` 自动检测

### 性能调优

几个最常见的调优点：

**压缩**：tonic 支持 gzip 压缩，适合 payload 较大的场景：

```rust
// 服务端接受压缩请求
let service = GreeterServer::new(greeter)
    .accept_compressed(CompressionEncoding::Gzip)
    .send_compressed(CompressionEncoding::Gzip);

// 客户端发送压缩请求
let client = GreeterClient::new(channel)
    .accept_compressed(CompressionEncoding::Gzip)
    .send_compressed(CompressionEncoding::Gzip);
```

**连接池**：Channel 内部已做 HTTP/2 多路复用，大多数场景一个 Channel 就够。**消息大小**：默认最大 4MB，用 `.max_decoding_message_size()` 按需调整。

### 与 tracing/metrics 集成

- `TraceLayer::new_for_grpc()` 自动生成 RPC span
- handler 内用 `tracing::instrument` 标记关键操作
- `metrics` crate 记录 RPC 计数和延迟分布
- 配合 OpenTelemetry 输出到 Jaeger / Grafana Tempo

更多参考 [Tracing 与可观测性实践](./tracing-and-observability-practice.md)。

## 常见误区

### 误区 1："gRPC 一定比 REST 快"

gRPC 的性能优势来自 protobuf 二进制编码和 HTTP/2 多路复用，但这不意味着"一定更快"。如果你的 payload 很小、调用频率不高、没有流式需求，REST + JSON 的性能完全足够。gRPC 的真正价值在于强类型契约和流式能力，不只是速度。

### 误区 2："所有内部服务都该用 gRPC"

gRPC 带来的额外复杂度包括：proto 工具链、代码生成流程、调试工具链（不能直接用浏览器或 curl 测试）。如果你的内部服务只有两三个、团队不大、没有跨语言需求，REST 可能更务实。

### 误区 3："proto 向后兼容很容易"

proto3 的兼容规则看似简单，但实践中很容易踩坑：不小心复用了已删除的字段编号、enum 加了新值但老客户端不认识、required 语义的隐式假设被打破。一定要在 CI 中用 `buf breaking` 做自动检测。

### 误区 4：忽略 proto lint 和 breaking change 检测

很多团队在 proto 文件少的时候靠 review 来保证质量，但随着服务和字段增长，人工 review 很快跟不上。`buf lint` 可以检查命名规范、字段编号间隔等，`buf breaking` 可以检查向后兼容性。这些应该从项目初期就加入 CI。

### 误区 5：把 gRPC 错误码当 HTTP 状态码用

gRPC 有自己的状态码语义，不要试图一一映射到 HTTP。比如 `Unavailable` 在 gRPC 中通常意味着"可以重试"，而 HTTP 503 的语义更模糊。理解每个 gRPC 状态码的重试语义是工程中的必修课。

## 自检

你至少应该能回答：

1. 什么场景下 gRPC 比 REST 更合适？选型的关键考量有哪些？
2. tonic-build 和 prost 各自负责什么？build.rs 中的两个路径参数分别是什么意思？
3. tonic 的 Interceptor 和 tower Layer 分别适合什么复杂度的中间件需求？
4. 流式 RPC 中，如何通过有界 channel 实现背压？客户端断开时服务端怎么感知？
5. proto 的向后兼容规则中，哪些操作是安全的，哪些会导致兼容性问题？
6. tonic 和 axum 如何共享同一个端口？这么做的前提条件是什么？
7. tonic-health 和 tonic-reflection 分别解决什么问题？在什么阶段应该引入？

这些问题理顺后，你对 Rust gRPC 的理解就不只是"能跑通一个 hello world"，而是能在真实项目中做出合理的技术决策了。

## 相关阅读

- [Axum Web 服务实践](./axum-web-service-practice.md)
- [Rust Web 框架选型](./rust-web-framework-landscape.md)
- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
