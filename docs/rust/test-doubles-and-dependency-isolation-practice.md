---
title: Rust 测试替身与依赖隔离实践
description: 从 fake、stub、mock 到本地 HTTP server、trait 边界、Tokio 异步测试和外部依赖隔离，整理 Rust 工程里更稳的测试替身主线。
---

# Rust 测试替身与依赖隔离实践

Rust 项目做测试时，经常会碰到一个现实问题：

- 业务逻辑本身不复杂
- 但它依赖数据库、HTTP、文件系统、时钟、消息队列
- 一旦都接真实依赖，测试就变慢、变脆、变难排查

很多人这时会立刻想到“要不要上 mock 框架”，但真正更重要的问题其实是：

**你要隔离的到底是哪个边界，而不是先选哪种工具。**

这页讲的就是 Rust 里更稳的测试替身主线。

## 先给一个结论

更稳的测试优先级通常是：

1. 先把纯逻辑和 I/O 边界拆开
2. 能用 fake / stub，就先别急着上严格 mock
3. HTTP 边界优先用本地测试 server
4. 真正需要验证交互约束时，再上 mock 框架
5. 少量关键路径保留真实集成测试

不要把“测试替身”理解成“所有依赖都要 mock 掉”。

## 先分清 4 种常见替身

### 1. fake

fake 更像“可工作的轻量实现”。

例如：

- 内存版 repository
- 内存版队列
- 固定时钟实现
- 简化版存储网关

它的优点通常是：

- 语义接近真实依赖
- 测试可读性高
- 对重构更稳

### 2. stub

stub 更像“给定输入，返回预设结果”。

例如：

- 固定返回某个用户
- 固定返回超时错误
- 固定返回空列表

它更适合：

- 覆盖成功 / 失败分支
- 构造边界条件
- 降低测试准备成本

### 3. mock

mock 更强调“验证交互”。

例如：

- 某方法必须被调用一次
- 必须按顺序调用
- 参数必须满足某个条件

这类能力很适合：

- 回调风格交互
- 编排逻辑
- 副作用验证

但也最容易把测试写得脆。

### 4. 本地测试 server

当依赖是 HTTP 服务时，很多场景下它比 trait mock 更自然。

因为你真正想验证的通常不是“某个方法有没有被调用”，而是：

- URL 对不对
- header 有没有带上
- body 编码对不对
- timeout / 重试 / 错误映射对不对

这类测试更像协议层测试，本地 HTTP server 通常更贴边界。

## 不要为了 mock 才抽 trait

Rust 项目里一个常见误区是：

- 只要想测试，就先把所有实现都抽成 trait

这经常会带来：

- trait 数量越来越多
- 接口开始变虚
- 代码为了测试形状而不是业务边界而设计

更稳的原则通常是：

- 先问这个边界在生产里是否本来就值得抽象
- 如果答案是是，再顺手让测试收益一起拿到

比较值得抽象成 trait 的边界通常包括：

- repository
- 外部 HTTP gateway
- 文件系统适配层
- 消息发布接口
- 时钟 / ID 生成器

不太值得为了测试单独抽象的通常包括：

- 纯函数工具方法
- 只在一个地方使用的小辅助对象
- 没有独立边界语义的内部 helper

## 一个最常见的拆法：service 依赖 boundary trait

```rust
#[derive(Debug, Clone)]
pub struct User {
    pub id: i64,
    pub email: String,
}

pub trait UserRepo {
    fn find_by_id(&self, id: i64) -> Result<Option<User>, RepoError>;
}

pub struct UserService<R> {
    repo: R,
}

impl<R: UserRepo> UserService<R> {
    pub fn new(repo: R) -> Self {
        Self { repo }
    }

    pub fn load_user_email(&self, id: i64) -> Result<String, LoadUserError> {
        let user = self
            .repo
            .find_by_id(id)?
            .ok_or(LoadUserError::NotFound)?;

        Ok(user.email)
    }
}
```

这里的价值不只是“方便测试”，而是：

- service 只依赖语义化边界
- 持久化细节被压在 repo 后面
- 业务测试不用真的起数据库

## fake 往往是第一优先级

对 repository 这类边界，fake 往往比 mock 更稳：

```rust
use std::collections::HashMap;

pub struct InMemoryUserRepo {
    users: HashMap<i64, User>,
}

impl UserRepo for InMemoryUserRepo {
    fn find_by_id(&self, id: i64) -> Result<Option<User>, RepoError> {
        Ok(self.users.get(&id).cloned())
    }
}
```

fake 的好处通常是：

- 不需要设置一堆 expectation
- 测试更像“给数据，看结果”
- 重构调用顺序时不容易整片测试一起碎掉

如果你测的是业务规则和状态流转，优先 fake 往往更划算。

如果你正在补幂等、状态机和 Outbox 链路，这类 fake 也特别适合承接重复提交、状态推进和事件重放测试，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 什么时候 mock 更值

mock 更适合这些问题：

1. 某个副作用必须发生。
2. 必须验证调用次数。
3. 必须验证调用顺序。
4. 需要断言特定参数被传出。

例如：

- 成功下单后必须发布一次事件
- 失败时绝不能发通知
- 重试逻辑必须最多调用 3 次

这时“有没有调用、调用了几次、参数是什么”本身就是业务要求，mock 就更合理。

## `mockall` 在 Rust 里适合做什么

`mockall` 官方文档把它定位成通用 mock object library，并说明最常见入口是 `#[automock]`。

它适合：

- mock trait
- mock 单个 `impl` block 的 struct
- 设置参数匹配、调用次数、调用顺序
- async trait

一个最小例子：

```rust
use mockall::automock;

#[automock]
trait Mailer {
    fn send(&self, to: &str) -> Result<(), String>;
}

fn send_welcome(mailer: &dyn Mailer, email: &str) -> Result<(), String> {
    mailer.send(email)
}

#[test]
fn sends_welcome_once() {
    let mut mailer = MockMailer::new();
    mailer
        .expect_send()
        .times(1)
        .returning(|_| Ok(()));

    send_welcome(&mailer, "user@example.com").unwrap();
}
```

但也要注意 `mockall` 官方文档明确提到的一些边界：

- static 方法和模块函数的 expectation 是全局的
- async trait 有使用顺序和宏位置要求
- expectation 过多时，测试会很容易脆

所以 mock 框架应该是“有必要时用”，不是默认第一选择。

## HTTP 边界优先测协议，不要优先 mock `reqwest`

如果你要测的是外部 API 客户端，更稳的方式通常不是 mock `reqwest::Client`，而是起一个本地 HTTP server。

原因很直接：

- 你真正关心的是协议边界
- 不是某个具体客户端方法有没有被调用

更适合验证的是：

- method / path / query 对不对
- body 编码对不对
- header / auth 对不对
- timeout / retry / 错误映射对不对

`wiremock` 官方文档把自己定位成黑盒 HTTP mocking 工具，并强调：

- 每个 `MockServer` 实例都用随机端口，测试之间天然隔离
- mock server 在超出作用域时会自动关闭
- 不建议跨测试共享同一个 `MockServer`

所以在 Rust 里测 HTTP gateway，`wiremock` 或本地 `axum` server 往往比 trait mock 更贴边界。

## 一个更务实的测试分层

### 1. 纯映射 / 纯逻辑

优先测试：

- DTO 转换
- 错误映射
- 状态流转
- 校验规则

这层通常不需要任何替身。

### 2. service + fake / stub

优先测试：

- 用例编排
- 分支逻辑
- 业务约束

这层通常用内存 fake 最稳。

### 3. 边界协议测试

优先测试：

- HTTP client
- 文件系统
- 消息序列化
- SQL 查询映射

这层更适合本地 server、临时目录、测试数据库或轻量容器。

### 4. 少量真实集成测试

最终保留少量关键链路：

- 真实数据库
- 真实迁移
- 真实网络协议

这层不需要很多，但不能完全没有。

## Tokio 异步测试要注意什么

Tokio 官方 `#[tokio::test]` 文档明确说明：

- 默认是单线程 current-thread runtime
- 也可以用 `flavor = "multi_thread"`
- 可以设置 `worker_threads`
- `start_paused = true` 可以让测试从暂停时间开始

这几个选项很适合这些场景：

- 单线程下更稳定地测 async 逻辑
- 多线程下覆盖并发行为
- 测 timeout、retry、sleep 时减少真实等待

一个经验原则是：

- 普通 async 单测优先默认 current-thread
- 真要覆盖并发调度，再切 multi-thread
- 涉及时间推进的测试，优先用 paused time

## 后台任务和重试测试怎么隔离

后台任务测试最容易踩坑的是：

- 一边测业务，一边真的 sleep
- 一边测重试，一边真的等网络超时

更稳的做法通常是：

- 把重试策略拆成可注入边界
- 把外部 gateway 换成本地 stub / server
- 用 Tokio 的时间控制减少真实等待

如果你正在补后台任务和重试边界，也可以继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- [Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)

## 不要直接 mock 数据库驱动

对 `sqlx` 这类数据库访问，直接 mock 低层驱动通常不是最优路径。

更稳的选择通常是：

- 业务层测 fake repo
- 查询映射测测试数据库
- 事务边界测真实集成测试

原因是：

- 你真正关心的往往是 SQL 和数据结果
- 不是某个底层 API 被调用了几次

## 文件系统边界也值得抽一层

如果业务依赖文件读写，更稳的拆法通常是：

- 核心逻辑只依赖“读取配置文本”“写出结果内容”这类边界
- 真实文件系统实现放外层
- 单测用内存 fake 或临时目录

不要让所有业务测试都依赖固定路径和真实磁盘状态。

## 常见误区

### 误区 1：为了测试，把所有东西都抽成 trait

这通常会把设计重心从业务边界带偏到测试技巧。

### 误区 2：所有依赖都用严格 mock

这样测试会越来越像“验证实现细节”，而不是验证业务结果。

### 误区 3：HTTP 边界只 mock 方法，不测协议

最后 URL、header、body、超时这些真正会出错的地方反而没被覆盖。

### 误区 4：跨测试共享同一个 mock server

这很容易带来并行测试干扰和状态泄漏。

### 误区 5：异步测试里大量真实 sleep

会让测试变慢、变脆，还更难稳定复现时序问题。

## 推荐回查入口

- 质量主线：[测试与质量实践](./testing-and-quality-practice.md)
- HTTP 边界测试：[Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)
- 后台任务测试：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 消息消费测试：[Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)
- 通知与消息触达：[Rust 通知、邮件、短信与消息触达实践](./notification-email-sms-and-delivery-practice.md)
- 对象存储边界：[Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- 回调协议边界：[Rust Webhook、回调与签名校验实践](./webhook-and-callback-practice.md)
- 数据访问分层：[SQLx 数据库访问实践](./sqlx-database-practice.md)
- 工程边界设计：[项目结构、crate 组织与 API 设计](./project-structure-and-api-design.md)

## 推荐资料

- [mockall](https://docs.rs/mockall/latest/mockall/)
- [wiremock](https://docs.rs/wiremock/latest/wiremock/)
- [tokio `#[test]`](https://docs.rs/tokio/latest/tokio/attr.test.html)
- [tokio-test](https://docs.rs/tokio-test/latest/tokio_test/)

## 自检

你至少应该能回答：

1. fake、stub、mock 和本地测试 server 各自更适合什么问题？
2. 为什么不该为了测试把所有实现都先抽成 trait？
3. 为什么测 HTTP gateway 时，本地 server 往往比 mock `reqwest` 更稳？
4. 为什么直接 mock 数据库驱动通常不如 fake repo + 真实集成测试？
5. Tokio async 测试里，什么时候该用默认 current-thread，什么时候该用 multi-thread 或 paused time？

这些问题理顺后，Rust 测试通常会更快、更稳，也更贴近真实边界。
