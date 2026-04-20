---
title: Eino Callback：回调机制
description: 精读 eino v0.8.10 callbacks 包：5 个 CallbackTiming、Handler 接口、TimingChecker 性能优化、全局 vs 调用级 Handler、流式回调的流 Copy 与 Close 契约。
---

# Eino Callback：回调机制

> 源码路径：[`github.com/cloudwego/eino/callbacks@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/callbacks)
>
> 主要文件：
> - `interface.go`（7 KB）—— 公共 API 与 Handler 接口
> - `aspect_inject.go`（7 KB）—— 框架把 callback 注入执行路径
> - `handler_builder.go`（6 KB）—— 声明式构造 Handler
> - `doc.go`（5 KB）—— 详细文档

Callback 是 eino 贯穿组件与编排层的**观测入口**。本页回答四个问题：

1. 什么时候触发？ → 5 个 `CallbackTiming`
2. 触发什么？ → 一个或多个 `Handler`
3. 怎么减少开销？ → `TimingChecker`
4. 流式场景有哪些坑？ → 流必须 `Copy` 并 `Close`

## 一、包结构

```
callbacks/
├── doc.go               5 KB  详细使用文档
├── interface.go         7 KB  Handler / RunInfo / 5 个 Timing 常量
├── handler_builder.go   6 KB  NewHandlerBuilder
├── aspect_inject.go     7 KB  框架如何把 callback 注入组件调用路径
└── interface_test.go    2 KB
```

大多数业务类型实际来自 `internal/callbacks`，`callbacks` 只是用 `type X = internal.X` 做 re-export。这种设计让**外部包看到稳定 API**，内部可以演进实现。

## 二、5 个 CallbackTiming（`interface.go:114-134`）

```go
const (
    TimingOnStart CallbackTiming = iota
    TimingOnEnd
    TimingOnError
    TimingOnStartWithStreamInput
    TimingOnEndWithStreamOutput
)
```

对应 Handler 的 5 个方法：

| 常量 | 方法 | 触发时机 | 携带 |
| --- | --- | --- | --- |
| `TimingOnStart` | `OnStart` | 组件开始处理（非流输入） | `CallbackInput` |
| `TimingOnEnd` | `OnEnd` | 成功完成 | `CallbackOutput` |
| `TimingOnError` | `OnError` | 非 nil error 返回 | `error` |
| `TimingOnStartWithStreamInput` | `OnStartWithStreamInput` | 流式输入开始（Collect/Transform） | `*StreamReader[...]`（已 Copy） |
| `TimingOnEndWithStreamOutput` | `OnEndWithStreamOutput` | 流式输出开始（Stream/Transform） | `*StreamReader[...]`（已 Copy） |

**非常重要的两条注释**（`interface.go:117-124`）：

- `TimingOnEnd` **只在成功时** fire——出错时走 OnError，不走 OnEnd
- `TimingOnError` **不覆盖流中途的错误**——流式组件里 Recv 返回的 err 不会自动走 OnError，只在**返回阶段的 err** 触发

## 三、RunInfo：触发源的身份（`interface.go:23-41`）

```go
type RunInfo struct {
    Name      string  // 业务名：compose.WithNodeName 或 InitCallbacks 指定
    Type      string  // 实现身份："OpenAI" / "Ark" 等，来自 components.Typer
    Component Component  // 类别："ChatModel" / "Tool" / "Graph" / "Lambda" 等
}
```

注释里的细节：

- `Name` 对 Graph 节点默认是节点名；对独立组件必须显式设置（否则为空）
- `Type` 来自 `components.Typer.GetType()`；未实现则框架反射取 struct/func 名
- `Type` 对 Graph 本身是空（Graph 不是一个具体实现）
- `Component` 对 Lambda 固定 `"Lambda"`，对三种编排器是 `"Graph"/"Chain"/"Workflow"`

**Handler 应按 RunInfo 过滤**——而不是假设某个事件顺序到达（`interface.go:39-40`）。

## 四、Handler 接口（`interface.go:85`）

```go
type Handler = callbacks.Handler  // 指向 internal 的真实定义
```

真实接口（通过使用推断）：

```go
type Handler interface {
    OnStart(ctx context.Context, info *RunInfo, input CallbackInput) context.Context
    OnEnd(ctx context.Context, info *RunInfo, output CallbackOutput) context.Context
    OnError(ctx context.Context, info *RunInfo, err error) context.Context
    OnStartWithStreamInput(ctx context.Context, info *RunInfo, input *schema.StreamReader[CallbackInput]) context.Context
    OnEndWithStreamOutput(ctx context.Context, info *RunInfo, output *schema.StreamReader[CallbackOutput]) context.Context
}
```

### 4.1 返回的 context 做什么用

每个方法返回的 ctx 会被**下一个时机**（**同一个 Handler 的**）使用。这让一个 Handler 能在 OnStart 里把 `trace.StartSpan` 的 span 写进 ctx，再在 OnEnd 里从 ctx 取出来 End——这是典型的 tracing 集成方式。

**注意**：ctx 链**不跨 Handler 传递**（`interface.go:69-71`）。每个 Handler 得到的是上游传进来的原始 ctx。

### 4.2 不同 Handler 之间无序

> "There is NO guaranteed execution order between DIFFERENT handlers."

Handler 不能互相依赖——A 的 OnEnd 可能在 B 的 OnEnd 之前或之后，这是由框架调度决定的。

## 五、CallbackInput / CallbackOutput 的类型擦除

`interface.go:43-60`：这两个都是 `any` 的别名，具体类型由组件定义。使用规范：

```go
func (h *MyHandler) OnStart(ctx context.Context, info *RunInfo, in CallbackInput) context.Context {
    // 按组件类型解包（框架提供了各组件的 ConvCallbackInput helper）
    modelInput := model.ConvCallbackInput(in)
    if modelInput == nil {
        return ctx  // 不是 ChatModel 的调用，跳过
    }
    log.Printf("prompt: %v", modelInput.Messages)
    return ctx
}
```

**不要**把 `in` 当作已知具体类型 —— 同一个 Handler 可能被所有类型的组件触发。

## 六、TimingChecker：性能优化（`interface.go:136-145`）

```go
type TimingChecker interface {
    Needed(ctx context.Context, info *RunInfo, timing CallbackTiming) bool
}
```

- Handler 可选实现
- 框架每次组件调用前问一遍：`timingX, needed?`
- 返回 `false` → 框架**跳过 stream 复制与 goroutine 分配**
- 用 `NewHandlerBuilder` 创建的 Handler 自动根据 "用户设置了哪些回调" 生成 Needed 实现

**这是必须做的优化**——默认框架会为每次组件调用给流 `Copy(n)`，n = handler 数量。若 handler 声明不关心流，就能省掉一次 Copy 与一次 goroutine。

## 七、流式回调的 Copy + Close 契约

`interface.go:77-80`：

> "Stream handlers receive a [*schema.StreamReader] that has already been copied; they MUST close their copy after reading. If any handler's copy is not closed, the original stream cannot be freed, causing a goroutine/memory leak for the entire pipeline."

**关键点**：

1. 流式 Handler 拿到的是**已 Copy 过的流**——框架用 `StreamReader.Copy(n)` 派发
2. **必须** Close —— 否则原始流无法释放，整条流水线泄漏
3. 读流的速度会**限制下游消费速度**（因为 Copy 是链表缓冲，最慢的孩子决定 GC 点）

规范模板：

```go
func (h *MyHandler) OnEndWithStreamOutput(
    ctx context.Context, info *RunInfo, out *schema.StreamReader[callbacks.CallbackOutput],
) context.Context {
    go func() {
        defer out.Close()  // 必须
        for {
            chunk, err := out.Recv()
            if errors.Is(err, io.EOF) { break }
            if err != nil { log.Println(err); break }
            h.record(info, chunk)
        }
    }()
    return ctx
}
```

## 八、不可变约束

`interface.go:82-84`：

> "Do NOT mutate the Input or Output values. All downstream nodes and handlers share the same pointer (direct assignment, not a deep copy). Mutations cause data races in concurrent graph execution."

即：Handler 拿到的 input/output 是**共享指针**，任何修改都会污染下游。需要修改就 clone 一份。

## 九、全局 Handler vs 调用级 Handler

### 9.1 全局 Handler（`interface.go:95-105`）

```go
func AppendGlobalHandlers(handlers ...Handler) {
    callbacks.GlobalHandlers = append(callbacks.GlobalHandlers, handlers...)
}
```

- **进程级**
- **每次组件调用都触发**
- 适用场景：分布式 trace、统一 metrics
- **非线程安全**——只在 `main()` / `TestMain()` 里初始化期调用
- 全局 Handler 的优先级**高于**调用级 Handler（先跑）

### 9.2 调用级 Handler

```go
r.Invoke(ctx, input, compose.WithCallbacks(myHandler))
```

- 只对本次调用生效
- 可以用 `DesignateNode("node-id")` 限定到某个节点
- 适合单次调试、特定请求的详细 log

### 9.3 已废弃的 `InitCallbackHandlers`

`interface.go:87-93`：会**覆盖**已注册的 Handler（不是 append）。使用 `AppendGlobalHandlers` 替代。

## 十、HandlerBuilder：声明式构造

`handler_builder.go` 提供的声明式 Handler 构造器：

```go
h := callbacks.NewHandlerBuilder().
    OnStartFn(func(ctx context.Context, info *RunInfo, in CallbackInput) context.Context {
        log.Printf("[%s:%s] start", info.Component, info.Name)
        return ctx
    }).
    OnEndFn(func(ctx context.Context, info *RunInfo, out CallbackOutput) context.Context {
        log.Printf("[%s:%s] end", info.Component, info.Name)
        return ctx
    }).
    Build()
```

好处：

- **只设置关心的时机**——其他时机返回的 Needed 自动是 `false`（免 stream 复制）
- 类型安全
- 声明式代码比实现整个 interface 清爽

## 十一、aspect_inject：框架注入 callback 的位置

`aspect_inject.go`（7 KB）是连接用户组件与 callback 系统的胶水。大致做三件事：

1. **包装组件调用**：在节点执行前后插入 `OnStart` / `OnEnd` / `OnError`
2. **处理流**：当输出是流时 `Copy(n+1)`（n 个 handler + 1 个原始下游），每份交给一个 handler
3. **聚合 ctx**：多个 handler 返回的 ctx 合并（用 addressSegment 区分）

当组件实现 `components.Checker.IsCallbacksEnabled() = true` 时，框架**跳过自动注入**——把控制权完全交给组件。见 [components-overview](./components-overview.md#八checker接管-callback-时机componentstypesgo50-52)。

## 十二、典型集成

### 12.1 Tracing

```go
type tracingHandler struct{}

func (h *tracingHandler) OnStart(ctx context.Context, info *RunInfo, in CallbackInput) context.Context {
    span, spanCtx := tracer.StartSpan(ctx, fmt.Sprintf("%s.%s", info.Component, info.Name))
    span.SetTag("type", info.Type)
    return spanCtx
}

func (h *tracingHandler) OnEnd(ctx context.Context, info *RunInfo, out CallbackOutput) context.Context {
    if span := SpanFromContext(ctx); span != nil { span.Finish() }
    return ctx
}

func (h *tracingHandler) OnError(ctx context.Context, info *RunInfo, err error) context.Context {
    if span := SpanFromContext(ctx); span != nil { span.SetTag("error", err.Error()); span.Finish() }
    return ctx
}

func (h *tracingHandler) Needed(_ context.Context, _ *RunInfo, t CallbackTiming) bool {
    return t == TimingOnStart || t == TimingOnEnd || t == TimingOnError
}
```

### 12.2 Metrics（流式）

```go
func (h *metricsHandler) OnEndWithStreamOutput(ctx context.Context, info *RunInfo, out *schema.StreamReader[CallbackOutput]) context.Context {
    go func() {
        defer out.Close()
        start := time.Now()
        var tokens int
        for {
            chunk, err := out.Recv()
            if errors.Is(err, io.EOF) { break }
            if err != nil { break }
            tokens++
            if tokens == 1 {
                metrics.FirstTokenLatency(info.Name, time.Since(start))
            }
        }
        metrics.TotalTokens(info.Name, tokens)
        metrics.StreamDuration(info.Name, time.Since(start))
    }()
    return ctx
}

func (h *metricsHandler) Needed(_ context.Context, _ *RunInfo, t CallbackTiming) bool {
    return t == TimingOnEndWithStreamOutput
}
```

## 十三、陷阱清单

1. **忘记 Close 流** → 整条流水线泄漏
2. **修改 Input/Output** → 下游 race
3. **依赖 Handler 间顺序** → 行为不稳定
4. **没实现 TimingChecker** → 即使不需要流回调也付出 Copy 成本
5. **在非 main 的地方调 `AppendGlobalHandlers`** → race condition
6. **用 `InitCallbackHandlers`** → 覆盖而非 append，删别人已注册的
7. **假设 Input 一定是某类型** → 不同组件类型都会经过同一个 Handler
8. **在流式组件里没实现 Checker** → `OnStart/OnEnd` 的时机不对（是"方法返回"，不是"流开始/结束"）

## 延伸阅读

- [components：组件抽象总览](./components-overview.md)（Checker 的作用）
- [Stream：流处理内部](./stream.md)
- [ChatModel：模型调用](./chatmodel.md)（典型的流式组件）
- [Graph：图编排核心](./graph.md)
