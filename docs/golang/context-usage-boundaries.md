---
title: Context 使用边界
description: 作为并发专题的深度补充页，聚焦 context 的边界、反模式、代码评审清单与治理建议，减少与主线并发文档的重复。
search: false
---

# Context 使用边界

这页不再重复讲 `context` 的基础概念，而是作为 [并发编程](./guide/03-concurrency.md) 的深度补充页，专门回答三个问题：

- 什么场景应该传 `context`
- 什么场景不应该把问题都塞给 `context`
- 代码评审时如何快速判断 `context` 用得对不对

## 先看主线，再看这页

- 并发主线：[并发编程](./guide/03-concurrency.md)
- Context 源码：[context 包源码精读](./guide/source-reading/context.md)

如果你还在补“`context` 是什么、怎么取消、怎么超时”，先看主线；如果你已经会用，但总觉得边界不稳，再看这页。

## 一句话判断标准

`context` 适合表达**请求生命周期**，不适合表达**业务领域状态**。

可以把它理解成两类信息：

- **该取消吗**：请求结束了、超时了、上游不等了
- **谁发起的请求**：trace id、request id、auth claims 这类少量跨层协作信息

不应该放进去的，是用户对象、订单聚合、数据库连接、配置集合、缓存句柄这类“业务或依赖本体”。

## 什么时候该用

### 1. 请求链路透传

典型场景：

- HTTP Handler 调服务层
- gRPC / RPC Handler 调下游客户端
- 服务层调数据库、缓存、消息队列、第三方 HTTP API

判断标准：

- 这段逻辑是否受上游请求生命周期约束
- 上游取消后，下游是否应该尽快停下来

如果答案是“应该”，就继续透传上游 `ctx`，而不是偷偷换成 `context.Background()`。

### 2. 外部调用超时控制

适合用 `WithTimeout` / `WithDeadline` 的地方：

- 数据库查询
- Redis / MQ / RPC / HTTP 调用
- 可能阻塞的锁等待或异步结果等待

边界提醒：

- 超时应该尽量贴近外部调用边界设置
- 不要在非常靠上的入口给整条链路套一个粗暴超时，导致局部问题难诊断

### 3. 与请求强绑定的 Goroutine

如果你起了一个协程专门服务当前请求，比如：

- 聚合多个下游并发请求
- 做请求内的异步预取
- 等待下游结果后回填响应

那它就应该监听 `ctx.Done()`，否则请求早就超时了，后台 Goroutine 还在跑。

### 4. 认清 `net/http` 里的请求生命周期边界

在服务端，`r.Context()` 不是一个“可以长期拿走复用”的上下文。

对传入服务端的 HTTP 请求来说，`r.Context()` 会在下面几种情况被取消：

- 客户端连接关闭
- HTTP/2 请求被取消
- `ServeHTTP` 返回

这意味着一个非常重要的结论：

- **只要任务属于当前请求的一部分，就继续透传 `r.Context()`**
- **只要任务要在请求结束后继续跑，就别再直接用 `r.Context()`**

如果你想把这件事从源码层看清楚，可以继续读 [context 包源码精读](./guide/source-reading/context.md)。

## 什么时候不该用

### 1. 不要把它当参数袋

下面这些都不适合塞进 `context`：

- `*User`
- `*Order`
- `*sql.DB`
- `*redis.Client`
- 大型配置对象
- 任意“为了少写一个参数”的业务对象

原因不是“语法不允许”，而是会带来三个问题：

- 依赖关系隐藏，函数签名看不出真实输入
- 测试困难，调用方不知道要塞哪些值
- 维护困难，跨层取值逐渐演变成隐式耦合

### 2. 不要用它替代显式依赖

错误思路：

- “日志器放进 `ctx`，这样不用传 logger 了”
- “租户信息放进 `ctx`，所有地方自己取”
- “配置放 `ctx`，这样函数签名更短”

更稳妥的做法是：

- 依赖对象通过结构体字段或参数显式注入
- 请求级元数据才通过 `context` 传递

### 3. 不要滥用 `WithValue`

`WithValue` 不是禁用，而是要克制。

适合放的内容：

- trace id
- request id
- 认证后的小型 claims
- 跨中间件协作所需的少量元数据

不适合放的内容：

- 大对象
- 高频业务字段
- 下游核心依赖
- 本该在函数参数里出现的业务输入

### 4. 不要把请求 `ctx` 传给“离线任务”

最常见的误用之一，是在 Handler 里启动 goroutine，然后把 `r.Context()` 直接传给它做：

- 审计日志
- 推送通知
- 临时文件清理
- 异步埋点
- 非关键链路补偿

问题在于：这类任务往往希望在请求返回后继续执行，但 `r.Context()` 会在 `ServeHTTP` 返回后很快取消。

更稳妥的做法有两种：

- **边界最清晰**：`context.Background()` + 手动复制必要元数据
- **保留 Value 更方便**：Go 1.21+ 使用 `context.WithoutCancel(r.Context())`

无论哪种做法，都应该再额外加上自己的超时控制，而不是让异步任务无限运行。

### 5. 不要在请求结束后继续依赖 `*http.Request`

即使你已经把 `ctx` 剥离了，也不代表可以继续在后台 goroutine 里随意使用原始请求对象。

更安全的实践是：

- 在启动 goroutine 前，把需要的 `userID`、`traceID`、业务参数先提取出来
- 不要在后台 goroutine 里继续读 `Request.Body`
- 不要在后台 goroutine 里继续使用 `ResponseWriter`

请求对象里的数据，应该在请求阶段内完成读取，再以显式参数形式传给后台任务。

## 常见反模式速查表

| 反模式 | 表现 | 风险 | 更好的做法 |
| --- | --- | --- | --- |
| 用 `Background()` 兜底 | 中途切断上游 `ctx` | 取消和超时失效 | 优先透传上游 `ctx` |
| 把业务对象塞进 `ctx` | `ctx.Value("user")` 到处飞 | 依赖隐式、难测试 | 显式参数或结构体依赖 |
| 字符串 key 到处乱用 | `"traceId"`、`"uid"` 分散定义 | key 冲突、可读性差 | 定义私有 key 类型 |
| 起 Goroutine 不监听 `Done()` | 请求结束后后台任务继续跑 | Goroutine 泄漏 | 在 select 中监听 `ctx.Done()` |
| 把 `r.Context()` 传给离线任务 | Handler 一返回任务就 `context canceled` | 后台任务被误杀 | 用 `Background()` 或 `WithoutCancel()` 重建边界 |
| 统一超时过大或过小 | 整条链路一刀切 | 难定位、误伤正常请求 | 在边界处设置局部超时 |

## 代码评审检查清单

看到 `context.Context` 时，可以快速过一遍下面这些问题：

### 传递层面

- `ctx` 是否放在第一个参数
- 是否从入口一路向下透传，而不是中途换 `Background()`
- 是否给外部调用设置了合理超时

### 退出层面

- 新起的 Goroutine 是否有退出条件
- 阻塞等待是否监听了 `ctx.Done()`
- 请求结束后是否还会继续占用下游资源
- 如果是离线任务，是否错误复用了 `r.Context()`
- 是否给离线任务重新设置了自己的超时

### 传值层面

- `WithValue` 里存的是不是少量请求级元数据
- key 是否是自定义私有类型
- 是否把本该显式出现的业务依赖塞进了 `ctx`

## 一个更实用的决策问题

当你犹豫某个值该不该放进 `context` 时，问自己：

> 如果去掉 `context`，这个值还应不应该作为函数的明确输入存在？

如果答案是“应该”，那它大概率就不该放进 `context`。

## 治理建议

### 团队约定

- `ctx` 一律作为第一个参数
- 业务对象不得通过 `context` 传递
- `WithValue` 只允许放请求级元数据
- 外部调用默认显式设置超时
- 请求结束后继续执行的任务，不得直接复用 `r.Context()`

### 工程治理

- code review 固定检查 `ctx` 透传和取消路径
- 对 Goroutine 泄漏、超时失效类事故做复盘归因
- 给公共库设计明确的 `ctx` 约定，而不是让调用方猜

## 一个高频场景的推荐写法

```go
func AuditHandler(w http.ResponseWriter, r *http.Request) {
    userID := UserIDFromContext(r.Context())
    traceID := TraceIDFromContext(r.Context())

    base := context.WithoutCancel(r.Context())

    go func(userID, traceID string, base context.Context) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Printf("audit panic: %v", rec)
            }
        }()

        ctx, cancel := context.WithTimeout(base, 5*time.Second)
        defer cancel()

        if err := writeAuditLog(ctx, userID, traceID); err != nil {
            log.Printf("write audit log failed: %v", err)
        }
    }(userID, traceID, base)

    w.WriteHeader(http.StatusAccepted)
}
```

这段代码的重点不是语法，而是边界：

- 请求内先把必要数据提取出来
- 异步任务不再直接依赖请求取消信号
- 异步任务自己拥有独立的超时上限
- goroutine 内统一做 `recover`

## 延伸阅读

- 并发主线：[并发编程](./guide/03-concurrency.md)
- Context 源码：[context 包源码精读](./guide/source-reading/context.md)
- 版本特性：[Go 1.21 的 `WithoutCancel` 与 `AfterFunc`](./go-version-features.md)
- 高频题：[30+ 高频 Golang 能力自检题](./go-top-30-interview-questions.md)
