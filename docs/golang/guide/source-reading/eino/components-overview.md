---
title: Eino components：组件抽象总览
description: 精读 eino v0.8.10 的 components 包：Runnable 泛型接口、四种交互模式、12 个跨模式转换器，以及 Typer/Checker 这两个可选协议的作用。
---

# Eino components：组件抽象总览

> 源码路径：
> - [`github.com/cloudwego/eino/components@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/components)
> - [`github.com/cloudwego/eino/compose/runnable.go@v0.8.10`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/runnable.go)

`components` 只定义**接口与契约**，不做实现。具体实现放在 `eino-ext` 仓库。理解这一层要回答三个问题：

1. 所有组件最终要变成什么？→ `Runnable[I, O]`
2. 一个组件要覆盖几种交互模式？→ 至少 1 种，另外 3 种框架可自动补齐
3. 组件有哪些**可选**协议可以被框架发现？→ `Typer`、`Checker`

## 一、包结构

```
components/
├── types.go                顶层协议：Typer / Checker / Component 枚举
├── document/               Loader / Parser / Transformer
├── embedding/              Embedder
├── indexer/                Indexer
├── model/                  ChatModel / ToolCallingChatModel
├── prompt/                 ChatTemplate
├── retriever/              Retriever
└── tool/                   BaseTool / InvokableTool / StreamableTool
```

每个子包只有一份接口定义 + 共享的 option 类型。文件都很薄，真正的实现都在 `eino-ext`。

## 二、Component 枚举（`components/types.go:63-83`）

```go
type Component string

const (
    ComponentOfPrompt      Component = "ChatTemplate"
    ComponentOfChatModel   Component = "ChatModel"
    ComponentOfEmbedding   Component = "Embedding"
    ComponentOfIndexer     Component = "Indexer"
    ComponentOfRetriever   Component = "Retriever"
    ComponentOfLoader      Component = "Loader"
    ComponentOfTransformer Component = "DocumentTransformer"
    ComponentOfTool        Component = "Tool"
)
```

**这些枚举不是文档**——它们在运行时被使用：

- Callback 事件用它标记来源类型
- DevOps 可视化工具（如 `eino-debug`）用它渲染节点图标
- 图节点注册时用它做一轮 sanity check

## 三、Runnable：一切组件的归宿

### 3.1 接口定义（`compose/runnable.go:26-32`）

```go
type Runnable[I, O any] interface {
    Invoke(ctx context.Context, input I, opts ...Option) (output O, err error)
    Stream(ctx context.Context, input I, opts ...Option) (output *schema.StreamReader[O], err error)
    Collect(ctx context.Context, input *schema.StreamReader[I], opts ...Option) (output O, err error)
    Transform(ctx context.Context, input *schema.StreamReader[I], opts ...Option) (output *schema.StreamReader[O], err error)
}
```

四个方法覆盖 2×2 矩阵：

```
输出\输入    单值 (I)              流 (*StreamReader[I])
单值 (O)     Invoke               Collect
流 (*S[O])   Stream               Transform
```

### 3.2 为什么是四个方法而不是一个？

一个 LLM 应用里，各类交互天然是不同模式的：

| 组件 | 典型模式 |
| --- | --- |
| ChatModel（非流式） | Invoke |
| ChatModel（流式） | Stream |
| Retriever | Invoke |
| Embedding | Invoke |
| ChatTemplate | Invoke |
| Tool（普通） | Invoke |
| Tool（流式输出） | Stream |
| 下游收集 chunk | Collect |
| 中间件（流进流出） | Transform |

框架承诺：只要**实现其中任意一种**，另外三种可以自动补齐。

## 四、12 个跨模式转换器

`compose/runnable.go` 提供了 **12 个** "用 X 补 Y" 的转换函数，构成 4×3 的补齐矩阵：

```
填 Invoke      ←   invokeByStream      invokeByCollect     invokeByTransform
填 Stream      ←   streamByTransform   streamByInvoke      streamByCollect
填 Collect     ←   collectByTransform  collectByInvoke     collectByStream
填 Transform   ←   transformByStream   transformByCollect  transformByInvoke
```

补齐思路：

- **输入缺流 → 从 Invoke 构流**：把单值包一层 `StreamReaderFromArray`
- **输出缺流 → Stream 转 Invoke**：不停 `Recv` 然后 `ConcatMessages` 合一
- **输入缺单值 → Collect 转 Invoke**：把单值包成单元素流再 Collect
- **输出缺单值 → Invoke 转 Stream**：把单值塞进一个 1 元素流返回

由此产生的收益：**自定义组件只需要实现 1 个方法**，代价是框架会在自动补齐路径上做额外的流化/去流化工作。性能敏感的场景应直接把两端都实现。

## 五、组件如何变成 Runnable

### 5.1 路径一：注册时自动包装

`compose.Graph.AddChatModelNode(name, m ChatModel)` 内部调用 `compose/component_to_graph_node.go` 的 `toComponentNode` 把一个 ChatModel 适配成 `graphNode`，`graphNode` 内部再造 `Runnable[[]*schema.Message, *schema.Message]`。

### 5.2 路径二：Lambda 包装函数

对于没有对应组件类型的业务逻辑，用 `compose.InvokableLambda` / `StreamableLambda` / `CollectableLambda` / `TransformableLambda` 直接把 Go 函数提升为 Runnable。这些类型定义在 `compose/types_lambda.go`。

### 5.3 路径三：手写实现 Runnable

高级用例可以直接实现 `Runnable[I, O]`，相当于造一个自定义节点类型。代价是要自己处理 option、callback、stream close 语义。

## 六、Option 模式

每个组件包下都有自己的 `Option` 类型。以 `components/model` 为例：

- 组件级 Option：创建 ChatModel 时用（如 `WithTemperature(0.7)`）
- 调用级 Option：每次调用单独传（如 `WithStop([]string{"\n"})`）——通过 `...Option` 可变参透传到 Runnable

注意：调用级 Option 经过 `compose.Option` 的通用包装，支持 **指定节点生效**（`Option.WithNodes("model-node-id")`）——只有匹配的节点才收这份 option。

## 七、Typer：稳定的显示名（`components/types.go:29-40`）

```go
type Typer interface {
    GetType() string
}
```

实现后，DevOps 工具里这个组件的显示名变成 `"{GetType()}{ComponentKind}"`。示例：

| 实现 | GetType() | ComponentKind | 显示为 |
| --- | --- | --- | --- |
| OpenAI 的 ChatModel | `"OpenAI"` | `"ChatModel"` | `"OpenAIChatModel"` |
| 火山 Ark 的 ChatModel | `"Ark"` | `"ChatModel"` | `"ArkChatModel"` |
| 自定义工具 | `"MyWeather"` | `"Tool"` | `"MyWeatherTool"` |

`utils.InferTool`（把 Go 函数转 Tool）也会用它产生 Tool 名。

## 八、Checker：接管 callback 时机（`components/types.go:50-52`）

```go
type Checker interface {
    IsCallbacksEnabled() bool
}
```

- 默认行为：框架在调用组件方法前后自动触发 `OnStart/OnEnd`
- 实现 Checker 且返回 `true`：框架**放弃自动触发**，由组件自己在合适时机调用
- 典型场景：流式 ChatModel 需要在每个 chunk、首 token、最终结束分别触发 callback，这些细粒度时机框架无从得知

## 九、最佳实践（从源码读出来的）

### 9.1 自定义组件起步

```go
type MyChatModel struct { /* ... */ }

// 1. 实现组件接口（以 ChatModel 为例，至少实现 Generate）
func (m *MyChatModel) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error) { /* ... */ }
// 如果要支持流式：
func (m *MyChatModel) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) { /* ... */ }

// 2. 可选：实现 Typer，让 DevOps 工具显示友好的名字
func (m *MyChatModel) GetType() string { return "MyProvider" }

// 3. 可选：实现 Checker，接管流式场景的 callback 时机
func (m *MyChatModel) IsCallbacksEnabled() bool { return true }
```

### 9.2 什么时候不该实现 Checker

如果你的组件只实现了非流式 `Invoke`，**不要**实现 Checker——把 callback 时机完全交给框架就好。只有**流式或自定义观测语义**才需要接管。

### 9.3 Lambda vs 独立组件

| 决策 | 用 Lambda | 写独立组件 |
| --- | --- | --- |
| 只在一个图里用 | ✅ | |
| 需要多处复用 | | ✅ |
| 需要参数化配置 | | ✅ |
| 需要精细 callback 时机 | | ✅ |
| 只是把几行代码串进流水线 | ✅ | |

### 9.4 让 option 传到对的地方

调用级 option 的默认作用域是 "所有节点"。在大图里**一定要**用 `compose.Option.WithNodes(nodeName...)` 限定作用域，否则 `WithStop(...)` 可能被传到 Retriever 上面，引发运行期奇怪报错。

## 延伸阅读

- [ChatModel：模型调用](./chatmodel.md)
- [Lambda：函数式组件](./lambda.md)
- [Graph：图编排核心](./graph.md)
- [Callback：回调机制](./callback.md)
- [Stream：流处理内部](./stream.md)
