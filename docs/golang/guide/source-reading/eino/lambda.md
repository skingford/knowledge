---
title: Eino Lambda：函数式组件
description: 精读 eino v0.8.10 compose/types_lambda.go：Lambda 结构、四个构造器 InvokableLambda/StreamableLambda/CollectableLambda/TransformableLambda、WithOpts 变体、LambdaOpt 配置。
---

# Eino Lambda：函数式组件

> 源码路径：[`compose/types_lambda.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/types_lambda.go)（10 KB）

Lambda 是 eino 中**最轻**的扩展机制：把一个 Go 函数直接升级为可编排的节点。不需要定义 struct、不需要实现组件接口——写完函数、裹一层 `InvokableLambda(fn)` 就能用。

## 一、Lambda 结构（`types_lambda.go:54-57`）

```go
type Lambda struct {
    executor *composableRunnable
}
```

外层就这一个字段：内部的 `composableRunnable` 是所有节点的公共底层类型（`compose/runnable.go` 里定义）——Lambda 就是**最薄的一层包装**，把用户函数转成 `composableRunnable` 并暴露出来。

## 二、四个构造器 + 四个 WithOpts 变体

对应 `Runnable[I, O]` 的四种模式，共 **8 个构造函数**（4 × 2 = "是否带 option"）：

| 构造器 | 函数签名类型 | 用途 |
| --- | --- | --- |
| `InvokableLambda` | `InvokeWOOpt[I, O]` | `I → O` |
| `StreamableLambda` | `StreamWOOpt[I, O]` | `I → *StreamReader[O]` |
| `CollectableLambda` | `CollectWOOpt[I, O]` | `*StreamReader[I] → O` |
| `TransformableLambda` | `TransformWOOpts[I, O]` | `*StreamReader[I] → *StreamReader[O]` |
| `InvokableLambdaWithOption` | `Invoke[I, O, TOption]` | 带调用级 option |
| `StreamableLambdaWithOption` | `Stream[I, O, TOption]` | 带调用级 option |
| `CollectableLambdaWithOption` | `Collect[I, O, TOption]` | 带调用级 option |
| `TransformableLambdaWithOption` | `Transform[I, O, TOption]` | 带调用级 option |

不带 option 的四个签名（`types_lambda.go:109-160`）：

```go
func InvokableLambda[I, O any](i InvokeWOOpt[I, O],   opts ...LambdaOpt) *Lambda
func StreamableLambda[I, O any](s StreamWOOpt[I, O],  opts ...LambdaOpt) *Lambda
func CollectableLambda[I, O any](c CollectWOOpt[I, O], opts ...LambdaOpt) *Lambda
func TransformableLambda[I, O any](t TransformWOOpts[I, O], opts ...LambdaOpt) *Lambda
```

## 三、InvokeWOOpt 家族：函数签名

这些类型别名是 `Runnable` 四个方法的"简化函数"形式：

```go
// 无 option 版（WOOpt = Without Option）
type InvokeWOOpt[I, O any]   func(ctx context.Context, input I) (output O, err error)
type StreamWOOpt[I, O any]   func(ctx context.Context, input I) (output *schema.StreamReader[O], err error)
type CollectWOOpt[I, O any]  func(ctx context.Context, input *schema.StreamReader[I]) (output O, err error)
type TransformWOOpts[I, O any] func(ctx context.Context, input *schema.StreamReader[I]) (output *schema.StreamReader[O], err error)

// 带 option 版
type Invoke[I, O, TOption any]   func(ctx context.Context, input I,                          opts ...TOption) (output O, err error)
type Stream[I, O, TOption any]   func(ctx context.Context, input I,                          opts ...TOption) (output *schema.StreamReader[O], err error)
type Collect[I, O, TOption any]  func(ctx context.Context, input *schema.StreamReader[I],    opts ...TOption) (output O, err error)
type Transform[I, O, TOption any] func(ctx context.Context, input *schema.StreamReader[I],   opts ...TOption) (output *schema.StreamReader[O], err error)
```

**TOption 泛型参数**：调用级 option 的类型由用户定义。通常每种 Lambda 需要一套自己的 option type。

## 四、最小示例

```go
// Invokable：最常见
extract := compose.InvokableLambda[*schema.Message, string](
    func(ctx context.Context, msg *schema.Message) (string, error) {
        return msg.Content, nil
    },
)

// Streamable：单入流出（如 tokenizer）
split := compose.StreamableLambda[string, string](
    func(ctx context.Context, text string) (*schema.StreamReader[string], error) {
        r, w := schema.Pipe[string](8)
        go func() {
            defer w.Close()
            for _, token := range strings.Fields(text) {
                if closed := w.Send(token, nil); closed { return }
            }
        }()
        return r, nil
    },
)

// Collectable：流入单出（如聚合）
concat := compose.CollectableLambda[string, string](
    func(ctx context.Context, r *schema.StreamReader[string]) (string, error) {
        defer r.Close()
        var sb strings.Builder
        for {
            chunk, err := r.Recv()
            if errors.Is(err, io.EOF) { break }
            if err != nil { return "", err }
            sb.WriteString(chunk)
        }
        return sb.String(), nil
    },
)

// Transformable：流入流出（如过滤或映射）
upper := compose.TransformableLambda[string, string](
    func(ctx context.Context, in *schema.StreamReader[string]) (*schema.StreamReader[string], error) {
        return schema.StreamReaderWithConvert(in, func(s string) (string, error) {
            return strings.ToUpper(s), nil
        }), nil
    },
)
```

## 五、在 Graph/Chain 中使用

```go
// Chain 里
chain.AppendLambda(extract)

// Graph 里
g.AddLambdaNode("extract", extract)
g.AddEdge("model", "extract")
```

Lambda 在 Graph 中的组件类型是 `ComponentOfLambda`（`compose/types.go:34`）。

## 六、LambdaOpt：构造期配置

Lambda 的 opts 参数是 `LambdaOpt`（不同于调用级 option）。主要配置项：

- `WithLambdaType(string)` — 给 Lambda 起类型名（在 DevOps 里显示）
- `WithLambdaCallbackEnable(bool)` — 是否启用自动 callback（对标 `Checker` 行为）
- 一些内部用的推断 hook

```go
extract := compose.InvokableLambda[I, O](fn,
    compose.WithLambdaType("ExtractContent"),
)
```

## 七、带 Option 的 Lambda 示例

```go
type MyLambdaOpt struct { Prefix string }

func WithPrefix(p string) MyLambdaOpt { return MyLambdaOpt{Prefix: p} }

addPrefix := compose.InvokableLambdaWithOption[string, string, MyLambdaOpt](
    func(ctx context.Context, in string, opts ...MyLambdaOpt) (string, error) {
        prefix := ""
        for _, o := range opts { prefix = o.Prefix }
        return prefix + in, nil
    },
)

// 调用期传入
r.Invoke(ctx, "hello",
    compose.WithLambdaOption(WithPrefix(">>>")).DesignateNode("prefix-node"),
)
```

## 八、AnyLambda：特殊能力

除了四个标准构造器，还有一个特殊的 `AnyLambda` —— 同时提供多种模式的实现：

```go
lambda, _ := compose.AnyLambda[I, O](
    invokableFunc,    // Invoke 实现
    streamableFunc,   // Stream 实现
    collectableFunc,  // Collect 实现
    transformableFunc,// Transform 实现
)
```

用途：如果你的逻辑**在不同模式下性能差异很大**，可以为每种模式专门实现，避免框架自动补齐的额外开销。

## 九、Lambda 的"类型擦除"边界

Lambda 允许输入输出类型是 `any`：

```go
router := compose.InvokableLambda[any, any](
    func(ctx context.Context, in any) (any, error) {
        // 根据 in 的类型分发
        switch v := in.(type) {
        case *schema.Message: return v.Content, nil
        case string:          return v, nil
        default:              return fmt.Sprintf("%v", v), nil
        }
    },
)
```

代价：**类型检查降级到运行期**——边上游下游的类型也失去校验（`any` 对一切可赋值，见 [type-check](./type-check.md#七any-类型的特殊地位)）。高级场景才用。

## 十、什么时候该用 Lambda，什么时候该写独立组件

| 决策 | 用 Lambda | 写独立组件 |
| --- | --- | --- |
| 只在一个图里用一次 | ✅ | |
| 多处复用 | | ✅ |
| 代码 ≤ 20 行 | ✅ | |
| 需要可配置参数 | | ✅（放进 struct 字段） |
| 需要自定义 callback 时机 | | ✅（实现 Checker 更自然） |
| 需要 Typer 的稳定名 | 可以用 `WithLambdaType` | ✅（实现 Typer） |
| 要对接外部依赖（client、db） | 用**闭包捕获**可以，但别太复杂 | ✅ |
| 单元测试驱动 | | ✅（组件能独立测） |

## 十一、性能注意

### 11.1 闭包捕获

```go
func buildLambda(db *sql.DB) *compose.Lambda {
    return compose.InvokableLambda[string, string](func(ctx context.Context, in string) (string, error) {
        // db 通过闭包捕获
        return queryDB(ctx, db, in)
    })
}
```

没有问题，但不如组件清晰。

### 11.2 Lambda 里阻塞

Lambda 是**单线程**执行——Invokable Lambda 里做重 I/O 会阻塞整条链。流式场景更敏感：一个 token 阻塞整个流。

### 11.3 Lambda 里起 goroutine

**Stream / Transform Lambda** 里通常要起 goroutine（见上面 split 的示例）。规范：

- 用 `schema.Pipe` 造流
- goroutine 里 `defer writer.Close()`
- 检查 `Send` 的返回值（下游已关就退出）
- 监听 ctx.Done

### 11.4 类型擦除的代价

`any`-based Lambda 每次调用要 type assertion——量级小可忽略，热路径上明显。

## 十二、边界与陷阱

### 12.1 忘记 Close 流

Stream/Transform Lambda 里起的 goroutine 若不 Close writer，消费者收不到 EOF。**规范**：`defer w.Close()`。

### 12.2 panic 不自动转 error

Lambda 里 panic 会被 Graph 的节点执行器 recover，但 recover 的行为是"变成一个通用 error"——细节可能丢失。**规范**：在 Lambda 里自己 `defer recover + 转 error`，保留堆栈。

### 12.3 Option 传错地方

调用级 `WithLambdaOption` 默认作用到所有 Lambda 节点。若图里有多个 Lambda，必须 `DesignateNode(key)` 限定。

### 12.4 泛型类型推导失败

```go
// ❌ Go 编译器推不出 I = string
lambda := compose.InvokableLambda(func(ctx context.Context, in string) (string, error) { ... })
// ✅ 显式指定
lambda := compose.InvokableLambda[string, string](func(...){ ... })
```

尤其在 `any` 作为返回类型时，必须显式指定类型参数。

### 12.5 流式 Lambda 的 back-pressure

`Pipe(cap=1)` 会让 Send 几乎永远阻塞等消费；`Pipe(cap=很大)` 又可能内存爆。**经验**：生产数据的速率若为 X chunks/sec，消费速率 Y chunks/sec，cap 取 `max(1, 0.5 * X/Y)`。

## 十三、最佳实践

1. **短逻辑才用 Lambda**——超过 30 行就拆成函数再包
2. **给每个 Lambda 加 `WithLambdaType`**——DevOps 里才好定位
3. **有状态的 Lambda 用 `ProcessState`** 而非闭包变量——避免跨请求污染
4. **流式 Lambda 必定 `defer w.Close()`**
5. **性能敏感路径考虑 AnyLambda**，手动提供所有四种模式

## 延伸阅读

- [components：组件抽象总览](./components-overview.md)（四种模式与 12 个适配器）
- [Graph：图编排核心](./graph.md)（AddLambdaNode）
- [Chain：链式编排](./chain.md)（AppendLambda）
- [Stream：流处理内部](./stream.md)
- [State：图内共享状态](./state.md)
