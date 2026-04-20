---
title: Eino 架构与仓库结构
description: 从顶层梳理 eino v0.8.10 仓库布局、包依赖关系、设计哲学与入口函数，为后续深入各子模块打底。
---

# Eino：架构与仓库结构

> 核心仓库：[`github.com/cloudwego/eino@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10)
>
> 扩展仓库：[`github.com/cloudwego/eino-ext@v0.8.10`](https://github.com/cloudwego/eino-ext/tree/v0.8.10)

## 一、仓库顶层布局

v0.8.10 的顶层目录共 10 个，拆分非常克制：

```
eino/
├── adk/          Agent Development Kit：智能体模板与运行时
├── callbacks/    回调机制（Handler 注册、分发、Span 化）
├── components/   组件接口层（ChatModel/Tool/Retriever 等）
│   ├── document/
│   ├── embedding/
│   ├── indexer/
│   ├── model/
│   ├── prompt/
│   ├── retriever/
│   ├── tool/
│   └── types.go         顶层共享类型（Typer/Checker/Component 枚举）
├── compose/      编排核心：Graph / Chain / Workflow / Runnable
├── flow/         高阶编排模式（如 ReAct、MultiAgent 等成品流程）
├── internal/     对外不可见的内部工具（generic、流拼接注册表等）
├── schema/       数据层：Message / Stream / Document / Tool 元信息
├── scripts/      CI 与构建脚本
├── utils/        可选工具（如 `InferTool` 从 Go 函数生成 Tool）
├── doc.go        包注释：“building blocks for agent workflows, tools, and composable graph utilities”
├── go.mod
└── llms.txt      项目能力摘要（给 LLM 读的自描述）
```

**关键观察**：eino 把最重的两块代码都收在 `schema/` 与 `compose/` 里：

- `schema/message.go` — 65 KB（几乎整个消息/多模态模型层）
- `schema/stream.go` — 23 KB（流的底层）
- `compose/graph.go` — 35 KB（图结构）
- `compose/graph_run.go` — 30 KB（图执行）
- `compose/workflow.go` — 18 KB
- `compose/chain.go` — 16 KB
- `compose/field_mapping.go` — 22 KB（字段级映射机制）
- `compose/tool_node.go` — 38 KB（ToolsNode，专门的工具调用节点）

> 如果要按体量估计阅读优先级，`graph.go`、`graph_run.go`、`message.go`、`stream.go` 是必读的 "四大文件"。

## 二、包依赖关系

```
┌──────────────────┐
│     flow         │  成品流程（ReAct、MultiAgent）
└────────┬─────────┘
         │
┌────────▼─────────┐
│       adk        │  Agent 开发套件
└────────┬─────────┘
         │
┌────────▼─────────┐
│    compose       │  Graph / Chain / Workflow / Runnable
└────────┬─────────┘
         │
┌────────▼─────────┐
│   components     │  各组件接口（ChatModel/Tool/...）
└────────┬─────────┘
         │
┌────────▼─────────┐
│     schema       │  Message / Stream / Document / Tool 元信息
└──────────────────┘
         │
┌────────▼─────────┐
│    internal      │  generic 反射工具 / 流拼接注册表
└──────────────────┘

  callbacks 横切：被 compose 在编排执行时调用，
  接口注入到 components 层（组件可自行决定是否触发）。
```

规则：

- **`schema` 不依赖任何 eino 内部包**（只依赖 `internal`）——是整棵依赖树的叶子
- **`components` 依赖 `schema` 和 `callbacks`**——定义接口，不做实现
- **`compose` 依赖 `components` 与 `schema`**——调度中心
- **`flow` / `adk` 位于最上层**——编排成品化

因此读源码的顺序应当从最底层往上：`schema` → `components` → `compose` → （感兴趣再看 `adk/flow`）。

## 三、设计哲学（从源码提炼）

### 3.1 强类型 + 泛型优先

整个编排体系以 `Runnable[I, O any]` 为顶层抽象（`compose/runnable.go:26-32`）：

```go
type Runnable[I, O any] interface {
    Invoke(ctx context.Context, input I, opts ...Option) (output O, err error)
    Stream(ctx context.Context, input I, opts ...Option) (output *schema.StreamReader[O], err error)
    Collect(ctx context.Context, input *schema.StreamReader[I], opts ...Option) (output O, err error)
    Transform(ctx context.Context, input *schema.StreamReader[I], opts ...Option) (output *schema.StreamReader[O], err error)
}
```

所有组件最终都被编译为 `Runnable[I, O]`，类型在编译期固化。

### 3.2 流作为一等公民

每个节点都必须同时能回答 "如果输入是流怎么办？如果输出是流怎么办？"。框架在 `compose/runnable.go` 中实现了 **12 个跨模式转换函数**：

- 三个填 `Invoke`：`invokeByStream` / `invokeByCollect` / `invokeByTransform`
- 三个填 `Stream`：`streamByTransform` / `streamByInvoke` / `streamByCollect`
- 三个填 `Collect`：`collectByTransform` / `collectByInvoke` / `collectByStream`
- 三个填 `Transform`：`transformByStream` / `transformByCollect` / `transformByInvoke`

这套机制让开发者**只实现自己擅长的那一种模式**，其他三种由框架自动补齐，不用手写 4 份实现。

### 3.3 组件即 Runnable

`components/` 下每一类组件（ChatModel、Tool、Retriever 等）都有明确的 `Component` 枚举（`components/types.go:66-83`）：

```go
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

这些枚举并非只做文档——它们在 callback 事件、DevOps 工具显示、图节点注册时被使用，属于**一等运行时元信息**。

### 3.4 可观测性通过 Checker 精细控制

`components/types.go:50-52` 定义的 `Checker` 接口允许组件**接管 callback 触发时机**：

```go
type Checker interface {
    IsCallbacksEnabled() bool
}
```

默认情况下框架会自动包裹 `OnStart / OnEnd`。当组件返回 `true`，框架会**跳过**自动包裹，把控制权交给组件自己——这对流式场景至关重要：真正有意义的 callback 时机是首 token 到达、每个 chunk、最终结束，而不是 "Stream 方法返回" 那一瞬间。

### 3.5 Typer 提供稳定的显示名

`components/types.go:29-40`：

```go
type Typer interface {
    GetType() string
}
```

实现后在 DevOps 工具（可视化调试器、IDE 插件、dashboards）里显示为 `"{GetType()}{ComponentKind}"`，如 `"OpenAIChatModel"`。这是框架对**运行时可观察性**的显式投资。

## 四、从 README 到第一个可运行示例

最小 Graph 的典型结构（概念草图）：

```go
// ① 造组件：ChatTemplate + ChatModel
tpl := prompt.FromMessages(schema.FString, /* ... */)
model := openai.NewChatModel(/* ... */)

// ② 造图
g := compose.NewGraph[map[string]any, *schema.Message]()
_ = g.AddChatTemplateNode("tpl", tpl)
_ = g.AddChatModelNode("model", model)
_ = g.AddEdge(compose.START, "tpl")
_ = g.AddEdge("tpl", "model")
_ = g.AddEdge("model", compose.END)

// ③ 编译为 Runnable
r, err := g.Compile(ctx)

// ④ 调用：四种模式任选
msg, err := r.Invoke(ctx, map[string]any{"topic": "Go"})
str, err := r.Stream(ctx, map[string]any{"topic": "Go"})
```

这段代码走过的源码路径：

1. `compose.NewGraph[I, O]()` → `compose/generic_graph.go` 造出泛型图
2. `AddChatTemplateNode` / `AddChatModelNode` → `compose/component_to_graph_node.go` 把组件包装成 `graphNode`
3. `AddEdge` → `compose/graph.go` 更新邻接表
4. `Compile` → `compose/graph.go` 做**拓扑排序 + 类型一致性检查 + 流兼容性推导**，产出一个实现了 `Runnable[I, O]` 的闭包
5. `Invoke` → `compose/graph_run.go` 按拓扑序执行每个节点，必要时用上文的 12 个转换器

## 五、adk 与 flow 是什么（本模块暂不展开）

- `adk/` = Agent Development Kit，提供预置的 agent 骨架、多轮状态机、与外部工具对接模板。定位接近 LangChain 的 Agent 子系统。
- `flow/` = 成品流程模板，如 ReAct、MultiAgent 协同。内部用 `compose` 搭起来，相当于官方演示 "典型场景应该这样拼图"。

本源码精读模块聚焦在 `schema / components / compose / callbacks / flow 里的基础件`，`adk` 与 `flow` 后续视需要补章。

## 六、阅读路线建议

| 目标 | 推荐顺序 |
| --- | --- |
| 只想把抽象看懂 | `schema` → `components-overview` → `compose-overview` → `graph` |
| 想写自定义组件 | `components-overview` → `chatmodel` → `tool` → `callback` |
| 想扩展 Provider | `ext-adapters` → `chatmodel` → `stream` |
| 想读图编译期怎么做 | `graph` → `type-check` → `state` |

## 延伸阅读

- [schema：消息与流](./schema.md)
- [components：组件抽象总览](./components-overview.md)
- [compose：编排总览](./compose-overview.md)
- [Graph：图编排核心](./graph.md) ⭐
