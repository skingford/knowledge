---
title: Rust WebSocket 与 SSE 实践
description: 围绕 axum 中的 WebSocketUpgrade、SSE、broadcast/watch、慢消费者和长连接生命周期，梳理 Rust 实时推送主线。
---

# Rust WebSocket 与 SSE 实践

Rust 做 Web 服务时，HTTP 请求响应模型通常只是第一层。只要业务里出现：

- 实时通知
- 日志流式输出
- 任务进度推送
- 聊天、协作、订阅广播

就会很快遇到两类长连接问题：

- WebSocket
- SSE（Server-Sent Events）

这页的重点不是把 API 全列一遍，而是把几条最常用的工程主线讲清楚：

- 什么时候选 WebSocket，什么时候选 SSE
- 连接和广播通道怎么组织
- 慢消费者怎么处理
- 优雅关闭时长连接怎么收尾

## 先分清 WebSocket 和 SSE 分别适合什么

最实用的第一步，不是先写代码，而是先分清两者的能力边界。

| 方案 | 方向 | 典型适用场景 | 优点 | 边界 |
| --- | --- | --- | --- | --- |
| WebSocket | 双向通信 | 聊天、协作、游戏、双向命令流 | 支持客户端和服务端双向交互 | 生命周期和背压处理更复杂 |
| SSE | 服务端单向推送 | 任务进度、状态更新、事件通知、流式输出 | 基于 HTTP，模型更简单，前端接入轻 | 不适合双向高互动场景 |

一句话记忆：

- 需要双向互动时，优先考虑 `WebSocket`
- 只需要服务端不断往前端推事件时，优先考虑 `SSE`

## 为什么长连接不能只看“能连上”

很多长连接实现第一版都能“工作”，但很快会遇到下面这些问题：

- 客户端断开了，任务还在跑
- 广播太快，慢消费者把内存拖爆
- 服务要关闭了，连接没有统一收尾
- 一个消息要广播给很多连接，但状态和通道散落在各处

所以长连接真正难的地方，不是握手，而是生命周期和流量治理。

## WebSocket 在 axum 里的主入口

`axum` 中最常见的 WebSocket 入口是 `WebSocketUpgrade`。

最小形态通常像这样：

```rust
use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    while let Some(msg) = socket.recv().await {
        let Ok(msg) = msg else { break };

        if let Message::Text(text) = msg {
            let _ = socket.send(Message::Text(text)).await;
        }
    }
}
```

这里最重要的不是 echo 行为，而是两点：

- HTTP handler 只负责升级
- 真正的长连接生命周期在 `on_upgrade` 之后的异步任务里

如果你想把 upgrade 之前的认证、当前用户上下文、request id 和 middleware / extractor 边界单独理顺，继续看：

- [Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)

## SSE 的主入口比 WebSocket 更像“流式响应”

SSE 更贴近普通 HTTP handler 的心智模型。通常你需要返回一个事件流。

在 `axum` 里，最常见的是：

- 生成一个 `Stream`
- 用 `Sse::new(stream)` 返回

思路上要记住：

- SSE 更像“持续不断地产生响应项”
- 而不是“单次请求马上给完结果”

如果你的业务只是：

- 后端不断推状态
- 前端不需要回发消息

那 SSE 往往比 WebSocket 更省心。

## 广播模型通常先想清楚：一对一还是一对多

实时推送的后端模型，一般可以先拆成两类：

### 1. 一对一通道

适合：

- 每个连接只关心自己的任务
- 每个用户只看自己的会话

这类场景更适合：

- 每连接独立 channel
- 或者业务 ID 到 sender 的映射

### 2. 一对多广播

适合：

- 一个事件要推给多个订阅者
- 聊天室、订阅频道、系统广播

这类场景更常见的基础设施是：

- `tokio::sync::broadcast`
- 或 `watch`

## `broadcast` 和 `watch` 的边界要分清

这是 Rust 里做推送时非常高频的一个取舍点。

### `broadcast`

更适合：

- 一条条离散事件
- 多个订阅者都想收到每个事件

例如：

- 聊天消息
- 系统通知
- 日志流

### `watch`

更适合：

- 关注“最新状态”
- 不在乎中间每一次变化

例如：

- 当前任务进度百分比
- 某个资源最新状态
- 最近一次配置版本

一句话记忆：

- `broadcast`：更像事件总线
- `watch`：更像状态快照

## 慢消费者为什么是长连接里最容易出问题的点

一旦开始广播，就一定会遇到一个现实：

- 有的客户端很快
- 有的客户端很慢

如果你不处理慢消费者，常见后果是：

- channel backlog 越堆越大
- 内存持续上涨
- 整个广播链路被个别连接拖慢

### 常见应对思路

#### 1. 有界缓冲

不要给每个连接无限缓冲。

#### 2. 丢弃策略

如果业务允许，可以只保留最新状态，旧消息丢掉。

#### 3. 超时和断开

如果某个连接长期跟不上，直接断开比把整个系统拖慢更稳。

#### 4. 区分事件和状态

很多场景里真正需要的不是“每条都不能丢”，而只是“最终最新状态要到达”。这时候用 `watch` 往往更合适。

## 连接状态不要散落在每个 handler 里

长连接做大后，很容易出现一种坏味道：

- 连接集合存在全局变量里
- 广播 sender 放在另一个模块
- 清理逻辑写在第三处

更稳的做法通常是把长连接相关状态收敛到明确的应用状态里，例如：

- 连接注册表
- 频道 sender
- 用户与会话映射
- 关闭信号

这和普通 `axum` 的 `State` 思路是一致的：

- 应用级共享依赖集中管理
- handler 只做边界转换和业务协调

## 关闭流程一定要纳入服务生命周期

长连接如果不纳入统一关闭流程，服务退出时很容易出现：

- listener 停了，但连接任务还在
- 后台广播任务结束了，但连接还在等消息
- 连接任务直接被 runtime 粗暴取消

所以比较稳的思路通常是：

1. 收到关闭信号
2. 停止接受新连接
3. 通知广播任务停止生产新消息
4. 让现有连接尽量优雅结束
5. 超时后再统一终止

如果你想把这条关闭主线再完整串起来，继续看：

- [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)

## WebSocket、SSE 和后台任务通常是同一组问题

很多时候长连接本身并不直接产出消息，真正的消息来源反而是：

- 后台 worker
- 定时任务
- 队列消费者
- 外部 API 轮询

所以 WebSocket / SSE 很少是“独立模块”，它通常要和后台任务一起设计：

- 后台任务产出事件
- 广播层负责分发
- 长连接层负责送到客户端

如果你想把后台任务、worker、取消和重试边界一起理顺，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)

## 一个稳妥的工程心智模型

做 Rust 实时推送时，可以优先用下面这套心智模型：

- HTTP handler 负责升级或返回流式响应
- 应用状态里集中管理广播通道和连接相关依赖
- `broadcast` 用于事件，`watch` 用于最新状态
- 有界缓冲 + 慢消费者处理是必备项
- 连接生命周期必须纳入统一关闭流程

## 自检

你至少应该能回答：

1. 什么场景下应该选 WebSocket，什么场景下应该选 SSE？
2. `broadcast` 和 `watch` 分别更适合什么？
3. 为什么慢消费者会成为长连接系统里的关键风险点？
4. 为什么连接和广播通道不应该散落在各处？
5. 为什么长连接必须纳入优雅关闭主线？

这些问题理顺后，你对 Rust 实时推送的理解就不再只是“会调用 API”，而是真正进入工程层面了。

## 相关阅读

- [Axum Web 服务实践](./axum-web-service-practice.md)
- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)
