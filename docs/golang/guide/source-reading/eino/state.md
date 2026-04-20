---
title: Eino State：图内共享状态
description: 精读 eino v0.8.10 compose/state.go：ProcessState 并发安全访问、nested graph 的词法作用域查找、PreHandler/PostHandler 对 state 的利用。
---

# Eino State：图内共享状态

> 源码路径：[`compose/state.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/state.go)

State 是 eino **为一次图执行**提供的**线程安全共享上下文**。它解决 Graph 执行中一个常见问题：多个节点需要读写共享数据，又不能用全局变量（会跨请求污染），也不适合塞在 context.Value 里（要求可变 + 并发安全）。

## 一、State 不是什么

先消除几个误解：

| ❌ State 不是 | ✅ State 是 |
| --- | --- |
| 全局变量 | 每次 `Invoke/Stream` 独立实例 |
| `context.Value` 的替代（context 不可变） | 可变 + 线程安全 |
| 节点间传递数据的主通道 | 旁路存储（主数据流通过 edge） |
| 框架自带的业务模型（如 "聊天历史"） | 用户定义的任意类型 |

## 二、注册 State 工厂（`state.go:29-30`）

```go
type GenLocalState[S any] func(ctx context.Context) (state S)
```

构造 Graph 时通过 `WithGenLocalState` 注册：

```go
type MyState struct {
    History []string
    Metrics map[string]int
}

g := compose.NewGraph[string, string](
    compose.WithGenLocalState(func(ctx context.Context) *MyState {
        return &MyState{Metrics: map[string]int{}}
    }),
)
```

每次调用 `Runnable.Invoke/Stream/Collect/Transform`，框架调用一次工厂，产生**本次执行私有**的 State 实例。

## 三、internalState：运行时载体（`state.go:32-38`）

```go
type stateKey struct{}

type internalState struct {
    state  any
    mu     sync.Mutex
    parent *internalState
}
```

三个字段的设计意图：

- `state` — 真正的用户 State（`any`，内部）
- `mu` — 每个 State 独立一把锁
- `parent` — **支持嵌套图**：内层图可以访问外层图的 State

`internalState` 被放在 `ctx.Value(stateKey{})`——这是它走 context 传递的底层，但**对用户暴露的是 `ProcessState[S]` API**，避免用户直接碰锁。

## 四、ProcessState：推荐的访问方式（`state.go:164-172`）

```go
func ProcessState[S any](ctx context.Context, handler func(context.Context, S) error) error {
    s, pMu, err := getState[S](ctx)
    if err != nil { return fmt.Errorf("get state from context fail: %w", err) }
    pMu.Lock()
    defer pMu.Unlock()
    return handler(ctx, s)
}
```

三个要点：

1. **自动取锁** — 调用方不用碰 mutex
2. **类型参数 S** — 决定从 State 链里**找哪一层**
3. **handler 在锁保护下运行** — 确保访问 atomicity

使用规范：

```go
// ✅ 推荐
func myLambda(ctx context.Context, in string) (string, error) {
    err := compose.ProcessState[*MyState](ctx, func(ctx context.Context, s *MyState) error {
        s.History = append(s.History, in)
        s.Metrics["calls"]++
        return nil
    })
    if err != nil { return "", err }
    return in, nil
}

// ❌ 不要这样
func myLambda(ctx context.Context, in string) (string, error) {
    stateRaw := ctx.Value(...)  // 碰不到 stateKey{}，外部包用不了
    // 直接访问 + 手动加锁：出错概率高，且依赖内部实现
}
```

## 五、嵌套图的词法作用域（`state.go:174-193`）

`getState[S]` 的核心逻辑：

```go
func getState[S any](ctx context.Context) (S, *sync.Mutex, error) {
    state := ctx.Value(stateKey{})
    if state == nil {
        var s S
        return s, nil, fmt.Errorf("have not set state")
    }

    interState := state.(*internalState)
    for interState != nil {
        if cState, ok := interState.state.(S); ok {
            return cState, &interState.mu, nil
        }
        interState = interState.parent
    }

    var s S
    return s, nil, fmt.Errorf("cannot find state with type: %v in states chain, "+
        "current state type: %v",
        generic.TypeOf[S](), reflect.TypeOf(state.(*internalState).state))
}
```

**规则（`state.go:118-121`）**：

- 在当前图的 state 中找类型 S
- 找不到就沿 `parent` 链向上
- **内层同类型的 State shadow 外层同类型的 State**（词法作用域）

### 典型用法：跨层读写

```go
// 外层 Graph
type OuterState struct { UserID string; CallCount int }
outerGraph := compose.NewGraph[string, string](
    compose.WithGenLocalState(func(ctx context.Context) *OuterState {
        return &OuterState{UserID: "u_123"}
    }),
)

// 内层 Graph（作为节点塞进 outerGraph）
type InnerState struct { SubResult string }
innerGraph := compose.NewGraph[string, string](
    compose.WithGenLocalState(func(ctx context.Context) *InnerState {
        return &InnerState{}
    }),
)

// 在 innerGraph 的某个 Lambda 里
func innerNode(ctx context.Context, in string) (string, error) {
    // 读写自己这层
    _ = compose.ProcessState[*InnerState](ctx, func(ctx context.Context, s *InnerState) error {
        s.SubResult = "done"
        return nil
    })
    // 读写父层
    _ = compose.ProcessState[*OuterState](ctx, func(ctx context.Context, s *OuterState) error {
        s.CallCount++
        return nil
    })
    return in, nil
}
```

## 六、PreHandler / PostHandler（`state.go:40-52`）

四种 handler 类型：

```go
type StatePreHandler[I, S any]         func(ctx context.Context, in I,                     state S) (I, error)
type StatePostHandler[O, S any]        func(ctx context.Context, out O,                    state S) (O, error)
type StreamStatePreHandler[I, S any]   func(ctx context.Context, in *schema.StreamReader[I],  state S) (*schema.StreamReader[I], error)
type StreamStatePostHandler[O, S any]  func(ctx context.Context, out *schema.StreamReader[O], state S) (*schema.StreamReader[O], error)
```

通过 `compose.WithPreHandler(...)` / `WithPostHandler(...)` 挂到节点上：

```go
g.AddChatModelNode("model", m,
    compose.WithPreHandler(func(ctx context.Context, in []*schema.Message, s *MyState) ([]*schema.Message, error) {
        // 节点执行前：把 state.History 塞到消息列表前
        return append(s.History, in...), nil
    }),
    compose.WithPostHandler(func(ctx context.Context, out *schema.Message, s *MyState) (*schema.Message, error) {
        // 节点执行后：把响应存到 state.History
        s.History = append(s.History, out)
        return out, nil
    }),
)
```

### 6.1 为什么不用 Lambda 节点做同样的事？

- **PreHandler 的输入/输出类型就是节点的输入类型**——框架保证
- Lambda 额外占一个节点，边也多一条，图变胖
- PreHandler 被**特化编译**——无额外调度开销

### 6.2 流式场景的自动 merge

注释（`state.go:41-42, 45-46`）里的一段重要提示：

> "if user called Stream but with StatePreHandler, the StatePreHandler will read all stream chunks and merge them into a single object."

即：**非流式 Handler 遇到流式调用**时，框架会 `Recv` 直到 EOF 再用 `Concat` 合一——这是一个**自动但有代价**的操作。流式场景追求实时性时应该用 `StreamStatePreHandler` / `StreamStatePostHandler`。

## 七、Handler 的内部实现（`state.go:54-111`）

四个 `convertXxxHandler` 函数把业务 Handler 包装成 `composableRunnable`：

```go
func convertPreHandler[I, S any](handler StatePreHandler[I, S]) *composableRunnable {
    rf := func(ctx context.Context, in I, opts ...any) (I, error) {
        cState, pMu, err := getState[S](ctx)  // 找对应类型的 state
        if err != nil { return in, err }
        pMu.Lock()            // 自动加锁
        defer pMu.Unlock()
        return handler(ctx, in, cState)
    }
    return runnableLambda[I, I](rf, nil, nil, nil, false)
}
```

关键点：**框架替你加锁了**。PreHandler 函数体里**不要**再调 `ProcessState`（会死锁——同一把锁不可重入）。

## 八、State 与并发

### 8.1 扇出节点的并行访问

Pregel 模式下一个 superstep 的节点并行执行。如果它们都访问同一个 State，互斥锁会串行化写入——这是**正确性代价**，不是 bug。

### 8.2 细粒度锁

如果瓶颈真的在 State 锁，可以：

- 把 State 拆成多个独立类型（每种一把锁）
- 把读密集的字段做成 `atomic.Value` 或 `sync.Map`

但在大多数 LLM 应用里，节点执行时间是秒级，锁竞争相比模型调用时间可忽略。

### 8.3 扇入节点聚合

如果多个上游都要写入 State 的同一个字段，用一个**专门的合流 Lambda** 收集所有上游结果再一次性写入，比每个上游各写各的更安全。

## 九、addNode 阶段的 State 校验（`compose/graph.go:168-198`）

前面 [graph](./graph.md#三addnode节点注册验证) 提到：

```go
if options.needState {
    if g.stateGenerator == nil {
        return fmt.Errorf("node '%s' needs state but graph state is not enabled", key)
    }
}
```

加了 `WithPreHandler/WithPostHandler`（都隐含 `needState`）的节点要求 Graph 已注册 state 工厂——否则 `AddNode` 时立即报错。

handler 的 state 类型与图的 state 类型必须一致（`graph.go:181-198`）：

```go
if g.stateType != options.processor.preStateType {
    return fmt.Errorf("node[%s]'s pre handler state type[%v] is different from graph[%v]", ...)
}
```

这是编译期的**类型 sanity check**——避免运行时才 panic "类型断言失败"。

## 十、边界与陷阱

### 10.1 "have not set state"

`ProcessState[*MyState]` 在没有 `WithGenLocalState` 的 Graph 上调用会报此错。**解决**：构造 Graph 时必须注册工厂。

### 10.2 "cannot find state with type X in states chain"

用 `ProcessState[*Wrong]` 找不到类型。解决：核对 S 类型是否与注册的一致（注意指针 vs 值）。

### 10.3 在 PreHandler 里再次 ProcessState

```go
compose.WithPreHandler(func(ctx context.Context, in I, s *MyState) (I, error) {
    // ❌ 死锁：框架已经持有 s 的锁，这里要拿同一把锁
    compose.ProcessState[*MyState](ctx, func(ctx context.Context, s2 *MyState) error { ... })
})
```

**解决**：PreHandler 的第三个参数就是当前 state，直接用，别再 `ProcessState`。

### 10.4 长时间持有 State 锁

`ProcessState` 里做 I/O 会把其他 goroutine 全阻塞。**规范**：handler 里只做纯内存操作；重操作前后取快照。

### 10.5 跨请求污染

**绝对不要**把 State 实例存到工厂外层的闭包里：

```go
// ❌ 所有请求共享同一个 State
shared := &MyState{}
compose.WithGenLocalState(func(ctx context.Context) *MyState { return shared })

// ✅ 每次新建
compose.WithGenLocalState(func(ctx context.Context) *MyState { return &MyState{} })
```

### 10.6 嵌套图的类型重名

内外层 State 都叫 `*UserState`——内层会 shadow 外层。**规范**：给嵌套图的 State 起不同类型名（或不同包）。

## 十一、最佳实践

1. **State 的字段是"跨节点共享"的数据，不是"节点私有"的数据**——私有数据通过 edge
2. **State 是可变的**——不要试图让它不可变（那用 context.Value 就好）
3. **重操作前拷贝再离开锁**——`ProcessState` 里只做指针访问
4. **嵌套图用不同的 State 类型**——避免 shadow 混乱
5. **State 能不用就不用**——大部分编排通过 edge + map 传递就够了
6. **流式场景优先用 Stream 版 handler**——避免自动 merge 破坏流式体验

## 延伸阅读

- [Graph：图编排核心](./graph.md)（addNode 对 state 的校验）
- [compose：编排总览](./compose-overview.md)（WithGenLocalState）
- [Workflow：字段级编排](./workflow.md)
- [Callback：回调机制](./callback.md)
