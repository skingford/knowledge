---
title: Eino ChatModel：模型调用
description: 精读 eino v0.8.10 components/model 接口：BaseChatModel、ToolCallingChatModel（推荐）、已废弃的 ChatModel（为什么？），以及流式 ChatModel 与 Checker 的配合。
---

# Eino ChatModel：模型调用

> 源码路径：[`github.com/cloudwego/eino/components/model@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/components/model)

ChatModel 是所有 LLM 适配器必须实现的核心接口。v0.8.10 的实际接口有**三个**：`BaseChatModel`、`ChatModel`（已废弃）、`ToolCallingChatModel`（推荐）。这个演化过程很值得读——它展示了 eino 对**并发安全**的态度变化。

## 一、BaseChatModel：最小契约（`components/model/interface.go:53-57`）

```go
type BaseChatModel interface {
    Generate(ctx context.Context, input []*schema.Message, opts ...Option) (*schema.Message, error)
    Stream(ctx context.Context, input []*schema.Message, opts ...Option) (
        *schema.StreamReader[*schema.Message], error)
}
```

两个方法覆盖两种模式：

- `Generate` — 阻塞直到完整响应
- `Stream` — 返回一个 `*schema.StreamReader[*schema.Message]`，chunk 形式返回

**注意**：没有 `Collect` / `Transform`。因为 ChatModel 的输入必然是 "一条完整的消息历史"——模型没法流式接收用户消息。所以 2×2 矩阵在这里自然退化成 2 种（Invoke + Stream）。

## 二、流式使用契约（注释里的规范，`interface.go:37-50`）

官方在接口注释里写明了流式使用的正确姿势：

```go
reader, err := m.Stream(ctx, messages)
if err != nil { /* ... */ }
defer reader.Close()
for {
    chunk, err := reader.Recv()
    if errors.Is(err, io.EOF) { break }
    if err != nil { /* ... */ }
    // handle chunk
}
```

以及一条重要约束：

> **a [schema.StreamReader] can only be read once. If multiple consumers need the stream, it must be copied before reading.**

流**不可复读**。如果要多路消费必须先 `reader.Copy(n)`。

## 三、为什么有三个接口？——并发安全演化

### 3.1 已废弃的 ChatModel（`interface.go:66-73`）

```go
// Deprecated: Use [ToolCallingChatModel] instead.
type ChatModel interface {
    BaseChatModel
    BindTools(tools []*schema.ToolInfo) error
}
```

问题来自 `BindTools`：它**就地修改**当前实例。当多个 goroutine 共享同一个 ChatModel（典型场景：服务级的 ChatModel 单例），一个 goroutine 调 `BindTools(A)` 然后 `Generate`、另一个调 `BindTools(B)` 然后 `Generate`——两者的工具列表会互相覆盖，出现**调用期数据竞争**。

注释明确地警告：

> "this causes a race condition when the same instance is used concurrently: one goroutine's tool list can overwrite another's."

### 3.2 推荐的 ToolCallingChatModel（`interface.go:85-91`）

```go
type ToolCallingChatModel interface {
    BaseChatModel
    WithTools(tools []*schema.ToolInfo) (ToolCallingChatModel, error)
}
```

`WithTools` **不修改当前实例**，而是返回一个**新实例**。这样：

```go
base, _       := openai.NewChatModel(ctx, cfg)       // 共享、无工具
withSearch, _ := base.WithTools([]*schema.ToolInfo{searchTool})
withCalc, _   := base.WithTools([]*schema.ToolInfo{calcTool})
// 多 goroutine 可以放心各用各的派生实例
```

这是**函数式风格的 builder**——不可变基类 + 派生新实例，彻底规避竞态。

### 3.3 迁移建议

- **新代码**：一律实现 `ToolCallingChatModel`
- **旧代码**：仍然能用 `ChatModel`，但要么每个 goroutine 独立一个实例，要么在 `BindTools → Generate` 之间加显式互斥

## 四、ChatModel 与 Tool 的协作

当 ChatModel 被绑定了 tools，它返回的 `*schema.Message`（角色 `Assistant`）可能携带 `ToolCalls`：

```go
msg := &schema.Message{
    Role: schema.Assistant,
    ToolCalls: []schema.ToolCall{
        {
            ID:   "call_123",
            Type: "function",
            Function: schema.FunctionCall{
                Name:      "search",
                Arguments: `{"query":"Go 1.26"}`,
            },
        },
    },
}
```

典型 agent 循环在 Graph 里表现为：

```
START → ChatTemplate → ChatModel →┬→ ToolsNode → ChatModel（下一轮）
                                  └→ END（无 ToolCall 时）
```

`compose/tool_node.go`（38 KB）专门封装了 ToolsNode——收到带 ToolCall 的消息后**并行调用**所有 tool 并以 `Role=Tool` 的消息回传。见 [Tool](./tool.md)。

## 五、流式场景下的 ToolCall 拼接

流式返回时，单个 ToolCall 会被拆成多个 chunk：

```
chunk#1: { ToolCalls: [{Index: *0, ID: "call_123", Function: {Name: "search"}}] }
chunk#2: { ToolCalls: [{Index: *0,                Function: {Arguments: `{"query":"Go`}}] }
chunk#3: { ToolCalls: [{Index: *0,                Function: {Arguments: ` 1.26"}`}}] }
```

`schema.ConcatMessages` 按 `Index` 聚合，最终合成：

```go
{ToolCalls: [{ID: "call_123", Function: {Name: "search", Arguments: `{"query":"Go 1.26"}`}}]}
```

这个规则在 [schema](./schema.md#五-concatmessages-跨文件协作) 有展开。

## 六、调用级 Option

`model.Option` 是 ChatModel 的调用级 option（注意与组件级 option 的区别）：

- `WithTemperature(float32)`
- `WithMaxTokens(int)`
- `WithStop([]string)`
- `WithTopP(float32)`
- `WithToolChoice(ToolChoice)` — forced / auto / none
- `WithModel(string)` — 少数 Provider 支持运行时切模型

**通过 compose.Option 透传时**要记得 `WithNodes("model-node-id")` 限定作用域，否则全图所有节点都会收到这份 option。

## 七、Checker：流式 Callback 的必要补丁

流式 ChatModel **应当**实现 `components.Checker`（见 [components-overview](./components-overview.md) 第八节）：

```go
func (m *MyChatModel) IsCallbacksEnabled() bool { return true }
```

原因：默认的 `OnStart / OnEnd` 只在 "Stream 方法返回" 前后触发，而流式场景下：

- 真正的 `OnStart` 应当是**首 token 到达**
- 每个 chunk 也可能要触发 `OnNewToken` 之类事件
- `OnEnd` 应当是**流的 EOF**，不是 Stream 方法返回

所以流式组件实现 Checker 后，自己在合适时机调用 `callbacks.OnStartWithStreamInput / OnEndWithStreamOutput`。

## 八、自定义 ChatModel 的起手模板

```go
type MyChatModel struct {
    client *myClient
    tools  []*schema.ToolInfo  // 不可变
    temp   float32
}

// 可选但强烈推荐
func (m *MyChatModel) GetType() string { return "MyProvider" }

// 流式组件推荐接管 callback 时机
func (m *MyChatModel) IsCallbacksEnabled() bool { return true }

// BaseChatModel 契约
func (m *MyChatModel) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error) {
    o := model.GetCommonOptions(&model.Options{Temperature: &m.temp}, opts...)
    req := m.buildRequest(input, o, m.tools)
    resp, err := m.client.Call(ctx, req)
    if err != nil { return nil, err }
    return m.toMessage(resp), nil
}

func (m *MyChatModel) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) {
    reader, writer := schema.Pipe[*schema.Message](16)
    go func() {
        defer writer.Close()
        // 自行处理 OnStart / OnEnd / OnError / 每 chunk 的 callback
        err := m.client.Stream(ctx, req, func(chunk *myChunk) {
            msg := m.chunkToMessage(chunk)
            if closed := writer.Send(msg, nil); closed { return }
        })
        if err != nil {
            writer.Send(nil, err) // 把 error 塞进流，让下游以 error 形式收到
        }
    }()
    return reader, nil
}

// ToolCallingChatModel 契约
func (m *MyChatModel) WithTools(tools []*schema.ToolInfo) (model.ToolCallingChatModel, error) {
    // 返回新实例，不修改 m
    newM := *m
    newM.tools = tools
    return &newM, nil
}
```

## 九、边界与错误处理

| 场景 | 推荐处理 |
| --- | --- |
| 上游 ctx 取消 | 立即关闭流、退出 goroutine，返回 `ctx.Err()` |
| Provider 限流 (429) | 封装为可识别的 error 类型，便于上层重试 |
| Token 超限 | 明确 error，上层决定截断或报错 |
| 流中途 Provider 出错 | `writer.Send(nil, err)` 把 err 塞进流 |
| BindTools 风格（Deprecated） | 在实现里加 mutex 或**彻底弃用**，迁移到 WithTools |
| Stream 方法返回 nil reader | 不合规——至少返回一个立刻 EOF 的空流 |

## 十、推荐阅读顺序

1. 本页
2. [Tool：工具调用](./tool.md)
3. [ChatTemplate：提示模板](./chattemplate.md)
4. [Stream：流处理内部](./stream.md)
5. [Callback：回调机制](./callback.md)
6. [eino-ext 适配器模式](./ext-adapters.md)（看 OpenAI/Ark 真实实现）

## 延伸阅读

- [components：组件抽象总览](./components-overview.md)
- [schema：消息与流](./schema.md)
- [Graph：图编排核心](./graph.md)
