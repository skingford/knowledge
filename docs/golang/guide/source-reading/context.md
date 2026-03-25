---
title: context 包源码精读
description: 精读 context.Context 接口、取消树、timerCtx / valueCtx / withoutCancelCtx 以及 net/http 请求中的生命周期边界。
---

# context 包：上下文传播源码精读

> 源码路径：`src/context/context.go`（约 800 行，随 Go 版本略有变化）
>
> 图例参考：复用 [Channel、Select 与 Context](../03-channel-select-context.md) 里的取消树图例，先看 `cancelCtx` 的父子传播关系，再回头理解 `propagateCancel` 和 `Done()`。

## 包结构图

<GoChannelDiagram kind="context-tree" />

```
context 包结构
══════════════════════════════════════════════════════════════

  Context（接口）
  ├── emptyCtx        ← Background() / TODO() 返回值
  ├── cancelCtx       ← WithCancel() / WithCancelCause() 返回值
  │   ├── timerCtx    ← WithDeadline() / WithTimeout() 返回值
  │   └── afterFuncCtx← AfterFunc() 内部使用
  ├── valueCtx        ← WithValue() 返回值
  └── withoutCancelCtx← WithoutCancel() 返回值（Go 1.21+）

  取消树结构（cancelCtx / timerCtx / afterFuncCtx 形成树）：
        Background
            │
       cancelCtx(A)
       ╱     │      ╲
  cancelCtx(B) valueCtx(D) timerCtx(C)
       │
  withoutCancelCtx(E)

  注：
  - valueCtx / withoutCancelCtx 会沿父链取值
  - withoutCancelCtx 会切断取消和 deadline

══════════════════════════════════════════════════════════════
```

---

## 一、Context 接口

```go
// src/context/context.go
type Context interface {
    // 返回截止时间（ok=false 表示无截止时间）
    Deadline() (deadline time.Time, ok bool)

    // 取消时关闭的 channel（不可取消则返回 nil）
    Done() <-chan struct{}

    // 取消原因：context.Canceled 或 context.DeadlineExceeded
    Err() error

    // 获取绑定的值（key 用自定义类型防止碰撞）
    Value(key any) any
}
```

---

## 二、核心实现与派生类型

```
┌──────────────────────────────────────────────────────────────────┐
│              Context 核心实现与派生类型                           │
│                                                                  │
│  emptyCtx   ─── 空实现，Deadline/Done/Err 均返回零值            │
│               └─ Background()、TODO() 底层类型                   │
│                                                                  │
│  cancelCtx  ─── 核心实现，维护子节点引用、done channel          │
│  ┌─────────────────────────────────────────┐                     │
│  │  Context   ← 父节点引用                 │                     │
│  │  mu        Mutex                        │                     │
│  │  done      atomic.Value (chan struct{}) │                     │
│  │  children  map[canceler]struct{}        │← 子节点集合         │
│  │  err       error                        │                     │
│  │  cause     error                        │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
│  timerCtx   ─── 嵌入 cancelCtx，额外含 timer 和 deadline        │
│  ┌─────────────────────────────────────────┐                     │
│  │  cancelCtx ← 继承取消能力              │                     │
│  │  timer     *time.Timer                  │← 到期自动取消       │
│  │  deadline  time.Time                    │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
│  valueCtx   ─── 链表节点，Value() 沿链向上查找                  │
│  ┌─────────────────────────────────────────┐                     │
│  │  Context   ← 父节点                    │                     │
│  │  key, val  any                          │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
│  withoutCancelCtx ─ 保留 Value 链，但 Done=nil / Err=nil         │
│                   └─ 用于剥离父 ctx 的取消与 deadline            │
│                                                                  │
│  afterFuncCtx / stopCtx ─ AfterFunc 的内部辅助类型               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

> 现在再把 `context` 简化成“只有四种实现”已经不完全准确了。工程里最常直接接触的仍然是 `emptyCtx`、`cancelCtx`、`timerCtx`、`valueCtx`，但从 Go 1.21 起，`withoutCancelCtx` 也已经是标准库里的正式类型。

---

## 三、取消传播机制

```
WithCancel 创建流程
══════════════════════════════════════════════════════

  WithCancel(parent)
       │
       ▼
  创建 cancelCtx{Context: parent}
       │
       ▼
  propagateCancel(parent, child)
       │
       ├── parent 已取消 → 立即取消 child
       │
       ├── parent 是 cancelCtx → 直接注册到 parent.children
       │
       └── parent 是其他类型 → 启动 goroutine 监听 parent.Done()

  cancel() 调用时：
       │
       ▼
  关闭 done channel（原子操作，只关闭一次）
       │
       ▼
  遍历 children → 递归 cancel() 所有子节点
       │
       ▼
  从 parent.children 移除自身

══════════════════════════════════════════════════════
```

### Value 查找路径

```
valueCtx.Value(key) 查找链
══════════════════════════════════════════════

  valueCtx(D, key="traceID")
      │  Value("userID") → 不匹配，向上
      ▼
  valueCtx(C, key="userID")
      │  Value("userID") → 匹配，返回值
      ▼
  （不继续向上）

  时间复杂度：O(n)，n 为链深度
  → 避免将大量值存 context，影响查找性能

══════════════════════════════════════════════
```

### 从取消树直接读出的结论

- 取消只会从父节点向子节点传播；子节点取消不会反向影响父节点。
- `cancelCtx` 才是真正维护 `children` 集合的核心节点，`valueCtx` 更像是“值链表节点”。
- `WithoutCancel` 会保留 `Value` 查找链，但 `Done()` 为 `nil`、`Err()` 恒为 `nil`、`Deadline()` 不再继承父级。
- `CancelFunc` 只是发出取消信号，不会等待工作真正停下；任务本身仍然要通过 `select` 监听 `ctx.Done()` 并主动返回。

---

## 四、从源码推导出的工程规则

### 1. `cancel()` 必须调用

`context` 包注释里写得很明确：`CancelFunc` 不只是通知退出，它还会做两件事：

- 把当前 child 从父节点的 `children` 集合里移除
- 停掉 `timerCtx` 关联的定时器

这就是为什么下面这种写法必须保留：

```go
ctx, cancel := context.WithTimeout(parent, time.Second)
defer cancel()
```

如果不调用 `cancel()`：

- 对 `WithTimeout` / `WithDeadline` 来说，定时器会继续存活到超时触发
- child context 也会继续挂在父节点上，直到父节点被取消或超时到达
- `go vet` 也会专门检查 `CancelFunc` 是否在所有路径上都被使用

### 2. `Context` 应该作为第一个参数，而不是塞进结构体

这条规则其实直接写在 `context` 包注释里：

- `ctx` 作为第一个参数，通常命名为 `ctx`
- 不要传 `nil`，不确定时用 `context.TODO()`
- 不要把 `Context` 当成结构体字段长期持有

原因并不神秘，本质上是为了让取消边界和依赖关系保持显式，方便静态分析工具检查 `ctx` 的透传路径。

### 3. `WithValue` 只放少量请求级元数据

从实现上看，`valueCtx` 的查找是沿父链逐层向上找，时间复杂度是 O(n)。

所以它适合放：

- trace id
- request id
- 认证后的小型 claims
- 跨中间件协作所需的少量元数据

不适合放：

- 大对象
- 业务实体
- 数据库、缓存、MQ 客户端
- 本该成为函数显式参数的业务输入

### 4. `WithValue` 的 key 不要用普通字符串

推荐模式是定义私有类型作为 key，避免不同包之间碰撞：

```go
type authKey struct{}

func WithAuthToken(ctx context.Context, token string) context.Context {
    return context.WithValue(ctx, authKey{}, token)
}
```

### 5. 收到 `Done()` 后尽快返回，不要在取消分支里做重活

`Done()` 的设计目标是让阻塞中的逻辑尽快收敛退出，而不是把耗时清理逻辑塞进取消分支。

更稳妥的模式是：

- 在 `select` 里监听 `ctx.Done()`
- 一旦收到取消信号，尽快 return
- 真正耗时的清理、补偿、日志上报交给独立流程或专门的后台任务

---

## 五、`net/http` 请求里的 Context 生命周期

服务端的 `r.Context()` 不是一个“可以长期带走”的上下文，而是一个严格绑定在请求处理过程中的上下文。

按 `net/http` 文档，对**服务端收到的请求**来说，`r.Context()` 会在下面几种情况被取消：

- 客户端连接关闭
- HTTP/2 请求被取消
- `ServeHTTP` 返回

这条规则带来两个非常重要的工程结论：

- 请求内的数据库、Redis、RPC、HTTP 下游调用，应该继续透传 `r.Context()`
- 需要在请求结束后继续执行的离线任务，不应该继续使用 `r.Context()`

同时，`net/http` 还要求：

- `ServeHTTP` 返回后，不能再使用 `ResponseWriter`
- `ServeHTTP` 完成后，也不应该继续读取 `Request.Body`

因此，后台 goroutine 如果要在请求结束后继续工作，应该先把需要的数据从 `*http.Request` 中提取出来，再启动异步任务。

### 一个最容易踩坑的例子

```go
func MyHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    go func() {
        <-ctx.Done()
        log.Println("request done:", ctx.Err())
    }()

    _, _ = w.Write([]byte("ok"))
    // 这里一旦 return，ctx 很快就会进入取消状态
}
```

上面这段代码没问题，但它准确揭示了请求上下文的边界：**Handler 返回，就是服务端请求生命周期的硬边界。**

---

## 六、请求结束后还要继续跑：怎么“剥离”取消信号

如果异步任务属于“离线任务”，比如：

- 发送审计日志
- 清理临时文件
- 补发通知
- 异步埋点或指标落库

那就不要再直接把 `r.Context()` 传进去。

### 方案 A：`context.Background()` + 显式复制必要值

如果你只需要少量元数据，这是边界最清晰的方式：

- 先从请求里提取 `userID`、`traceID` 等必要值
- 用 `context.Background()` 新建上下文
- 按需把这些值重新塞回去

优点是边界明确；缺点是要手动复制值。

### 方案 B：`context.WithoutCancel()`（Go 1.21+）

如果你希望保留原有 `Value` 链，但不继承父请求的取消和 deadline，标准库已经给了官方方案：

```go
func MyHandler(w http.ResponseWriter, r *http.Request) {
    userID := UserIDFromContext(r.Context()) // 先把必要数据取出来
    base := context.WithoutCancel(r.Context())

    go func(userID string, base context.Context) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Printf("async task panic: %v", rec)
            }
        }()

        ctx, cancel := context.WithTimeout(base, 10*time.Second)
        defer cancel()

        if err := doSlowTask(ctx, userID); err != nil {
            log.Printf("async task failed: %v", err)
        }
    }(userID, base)

    w.WriteHeader(http.StatusAccepted)
}
```

这里有 4 个关键点：

- `WithoutCancel` 会保留 `Value` 链
- 它不会继承父请求的取消信号
- 它也不会继承父请求的 deadline
- 所以异步任务必须重新设置自己的超时，否则就可能演变成新的 goroutine 泄漏

### 异步任务的额外注意点

- 不要在后台 goroutine 里继续使用 `ResponseWriter`
- 不要在后台 goroutine 里继续读取 `Request.Body`
- 不要无边界地 `go func()`；高并发场景下应使用 worker pool、任务队列或限流
- 后台 goroutine 最好统一做 `recover`，避免未捕获 panic 影响整个进程

---

## 七、代码示例

### 基本取消

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel() // 确保资源释放

    go worker(ctx)

    time.Sleep(2 * time.Second)
    cancel() // 通知 worker 停止
}

func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("stopped:", ctx.Err())
            return
        default:
            fmt.Println("working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}
```

### 超时控制

```go
func queryDB(ctx context.Context) error {
    // 贴近外部调用边界设置超时
    ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
    defer cancel()

    done := make(chan error, 1)
    go func() {
        done <- db.Query(ctx) // 传 ctx 给 DB 驱动
    }()

    select {
    case err := <-done:
        return err
    case <-ctx.Done():
        return ctx.Err() // context.DeadlineExceeded
    }
}
```

### 安全传值（避免 key 碰撞）

```go
// 用私有类型作 key，防止不同包之间 key 碰撞
type ctxKey string

const traceIDKey ctxKey = "traceID"

func WithTraceID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, traceIDKey, id)
}

func TraceID(ctx context.Context) string {
    v, _ := ctx.Value(traceIDKey).(string)
    return v
}
```

---

## 八、核心要点

| 问题 | 要点 |
|------|------|
| 父 ctx 取消，子会取消吗？ | 会，cancelCtx.cancel() 递归取消所有子节点 |
| 子 ctx 取消，父会取消吗？ | 不会，取消只向下传播 |
| 为什么 `cancel()` 不能省？ | 它不仅发信号，还会移除父引用并停止关联 timer |
| context 可以存大对象吗？ | 不建议，Value 查找是 O(n) 链表遍历 |
| Done() 为什么是 channel 而非回调？ | 支持 select 多路复用，Go 的惯用法 |
| context 线程安全吗？ | 是，cancelCtx 内部有 mutex 保护 |
| WithTimeout vs WithDeadline？ | Timeout=当前时间+duration，Deadline=绝对时间点 |
| `WithoutCancel` 的语义是什么？ | 保留 `Value` 链，但 `Done=nil`、`Err=nil`、无 deadline |
| `r.Context()` 什么时候会失效？ | 客户端断开、HTTP/2 取消，或 `ServeHTTP` 返回 |

## 延伸阅读

- 工程边界专题：[Context 使用边界](../../context-usage-boundaries.md)
- 并发主线：[Channel、Select 与 Context](../03-channel-select-context.md)
- Go 版本特性：[Go 1.21 的 `WithoutCancel` 与 `AfterFunc`](../../go-version-features.md)
