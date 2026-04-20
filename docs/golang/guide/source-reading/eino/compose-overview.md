---
title: Eino compose：编排总览
description: 从全局视角梳理 eino v0.8.10 compose 包：Graph / Chain / Workflow 三种编排模式的关系、公共 API、编译链路与选型建议。
---

# Eino compose：编排总览

> 源码路径：[`github.com/cloudwego/eino/compose@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/compose)

`compose` 是 eino 的**中枢**。整个包有 40+ 个 Go 文件、近 500 KB 源码，但对外暴露的抽象只有三种编排器 + 一个 `Runnable`。这篇是进入 `compose` 的地图，先认路，再钻细节。

## 一、三种编排器与它们的关系

```
┌─────────────────────────────────────────────────┐
│  面向用户的三种编排器                              │
├───────────────────────┬──────────┬──────────────┤
│ Graph[I,O]            │ 任意 DAG  │ 通用         │
│ Chain[I,O]            │ 线性      │ 降级为 Graph │
│ Workflow[I,O]         │ 字段级    │ 基于 Graph   │
└─────────┬─────────────┴──────────┴──────────────┘
          │ 三者最终都产出
          ▼
┌─────────────────────────────────────────────────┐
│  Runnable[I, O any]                             │
│  - Invoke / Stream / Collect / Transform        │
└─────────────────────────────────────────────────┘
```

- **Graph**：最底层、最灵活。任意 DAG（DAG 模式）或含环图（Pregel 模式）。
- **Chain**：线性流水线的语法糖。内部直接持有一个 `Graph[I, O]`，每个 `AppendXxx` 调用都转化成 `Graph.AddXxxNode` + `AddEdge`。
- **Workflow**：字段级编排。**解决 Graph 里 "整条结构体传递" 粒度太粗的问题**——允许把上游某个字段路由到下游的另一个字段。底层仍是 Graph，外加一套字段映射层。

## 二、用户 API 的三条入口

所有三种编排器都遵循同样的生命周期：**创建 → 加节点 → 加边/依赖 → Compile → 获得 Runnable**。

### 2.1 Graph：`NewGraph[I, O]()`

`compose/generic_graph.go:71-87` 定义了创建流程：

```go
func NewGraph[I, O any](opts ...NewGraphOption) *Graph[I, O] {
    options := &newGraphOptions{}
    for _, opt := range opts { opt(options) }

    return &Graph[I, O]{
        newGraphFromGeneric[I, O](
            ComponentOfGraph,
            options.withState,
            options.stateType,
            opts,
        ),
    }
}
```

注意 `Graph[I, O]` 只是一个外层的泛型 wrapper（`generic_graph.go:92-94`）：

```go
type Graph[I, O any] struct {
    *graph
}
```

内嵌的 `*graph` 是非泛型的底层结构（见 [graph](./graph.md#二graph-结构体composegraphgo59-90)），`Graph[I, O]` 只是把泛型类型参数包在外面方便构造。

### 2.2 Chain：`NewChain[I, O]()`

Chain 的底层同样是 Graph：

```go
type Chain[I, O any] struct {
    err         error
    gg          *Graph[I, O]
    nodeIdx     int
    preNodeKeys []string
    hasEnd      bool
}
```

- `gg` — 内部持有的 Graph，所有真实工作委托给它
- `nodeIdx` — 单调递增，用来给每个 `AppendXxx` 自动生成 node key
- `preNodeKeys` — 上一节点的 key 列表（AppendParallel 时多个）

详见 [chain](./chain.md)。

### 2.3 Workflow：`NewWorkflow[I, O]()`

Workflow 的结构更重，因为要追踪字段依赖：

```go
type WorkflowNode struct {
    graph          *graph
    key            string
    inputFuncs     []func(any) (any, error)
    staticValues   map[string]any
    dependencySetter func() error
    mappedFieldPaths map[string][]*FieldPath
}

type Workflow[I, O any] struct {
    // 嵌套 graph
    workflowNodes    map[string]*WorkflowNode
    workflowBranches []*GraphBranch
    dependencies     map[string]map[string]dependencyType
}
```

`dependencyType` 有三种（`compose/workflow.go:49`）：

- `normalDependency` — 数据流 + 执行依赖（相当于普通 edge）
- `noDirectDependency` — 只要数据流，不要执行依赖（编译时数据来自 static value 或其他路径）
- `branchDependency` — 受条件分支控制

详见 [workflow](./workflow.md)。

## 三、Compile：三种编排器统一的产出点

`generic_graph.go:122-124` 是 Graph 的 Compile 入口：

```go
func (g *Graph[I, O]) Compile(ctx context.Context, opts ...GraphCompileOption) (Runnable[I, O], error) {
    return compileAnyGraph[I, O](ctx, g, opts...)
}
```

Chain 与 Workflow 的 Compile 最终**都走到同一个** `compileAnyGraph`（`generic_graph.go:126-155`）。Chain 的 Compile 前会先调用 `addEndIfNeeded` 把最后一个节点连接到 `END`；Workflow 的 Compile 前会解析所有字段依赖、生成对应的 handler。

`compileAnyGraph` 做的事：

1. 合并全局编译 callback
2. 构造 `graphCompileOptions`
3. 调用 `graph.compile(ctx, option)` —— 真正的编译逻辑
4. 装配 `executorMeta`（组件类型、callback enabled flag）
5. 包装 context 注入函数（把图名加入 address segment 以便 trace）
6. `toGenericRunnable[I, O]` 把 non-generic 的 `composableRunnable` 转成强类型 `Runnable[I, O]`

## 四、编排器选型建议

| 你想要…… | 选 | 理由 |
| --- | --- | --- |
| 把一个请求顺序过 n 步 | **Chain** | 代码最短，可读性最好 |
| ReAct / agent 循环（需要回跳） | **Graph + Pregel** | 只有 Graph 允许环 |
| 结构体 A 的字段 X 要进 B、字段 Y 要进 C | **Workflow** | 字段级映射是它的专属能力 |
| 分支选路（if-else、switch） | **Graph 或 Chain 的 AddBranch** | 两者都支持 |
| 多个节点并行后再汇聚 | **Graph / Chain 的 AddParallel** | 两者都支持 |
| 仅做数据管道，无 LLM | 都可以，Chain 最轻 | Chain 的语法糖最合算 |

## 五、Graph 的两种运行模式（回顾）

见 [graph](./graph.md#十-两个保留节点与两种运行模式)：

- **Pregel**：允许环，节点 `AnyPredecessor` 触发（任一前驱完成）
- **DAG**：禁环，节点 `AllPredecessor` 触发（所有前驱完成）

**重要**：Chain 继承 Graph 的默认模式（Pregel）。Workflow **强制用 DAG**（字段映射暗含所有前驱必须完成）。

## 六、嵌套编排

所有三种编排器都实现了 `AnyGraph` 接口，可以**互相嵌套**：

- `Graph.AddGraphNode(g Graph)` — 子图
- `Graph.AddWorkflowNode(wf Workflow)` — 子 Workflow
- `Chain.AppendGraph(g Graph)` / `Chain.AppendChain(c Chain)`

嵌套时，子编排器的输入输出必须能匹配父级边的两端类型。子级的 callback、state 与父级**隔离**——state 在每层独立。

## 七、NewGraphOption：构造期配置

`generic_graph.go:26-43`：

```go
type NewGraphOption func(ngo *newGraphOptions)

func WithGenLocalState[S any](gls GenLocalState[S]) NewGraphOption {
    return func(ngo *newGraphOptions) {
        ngo.withState = func(ctx context.Context) any { return gls(ctx) }
        ngo.stateType = generic.TypeOf[S]()
    }
}
```

目前主要就这一个 option：**注册 state 工厂**。例：

```go
type MyState struct { History []string }

g := compose.NewGraph[string, string](
    compose.WithGenLocalState(func(ctx context.Context) *MyState {
        return &MyState{}
    }),
)
```

每次 `Invoke` / `Stream` 都会调用一次工厂，产生一个**本次执行私有**的 MyState。详见 [state](./state.md)。

## 八、GraphCompileOption：编译期配置

`Compile(ctx, opts...)` 可以传编译 option：

- `WithGraphName(name)` — 给图命名（影响 trace 的 address segment）
- `WithGraphCompileCallbacks(cb...)` — 编译过程 callback（用于编译期 tracing/debug）
- `WithMaxRunSteps(n)` — 防止 Pregel 无限循环
- `WithNodeTriggerMode(mode)` — 覆盖默认 `AnyPredecessor`/`AllPredecessor`
- `WithGraphKey(key)` — 可选唯一键，用于 checkpoint 恢复

## 九、调用期 Option：`Option`

Compile 产出的 Runnable 接受 `...Option` 可变参。每个 Option 可以：

1. 指定**作用哪些节点**：`Option.DesignateNode("node-id")` / `DesignateNodeWithPath(path)`
2. 携带**组件级 option**：`model.WithTemperature(...)`、`retriever.WithTopK(...)` 等
3. 携带**callback handler**

典型用法：

```go
r.Invoke(ctx, input,
    compose.WithCallbacks(myHandler),
    compose.WithModelOption(model.WithTemperature(0.3)).DesignateNode("model-node"),
)
```

## 十、Runnable：最终产物

Compile 产出的 `Runnable[I, O]` 是你真正调用的东西：

```go
type Runnable[I, O any] interface {
    Invoke(ctx context.Context, input I, opts ...Option) (output O, err error)
    Stream(ctx context.Context, input I, opts ...Option) (output *schema.StreamReader[O], err error)
    Collect(ctx context.Context, input *schema.StreamReader[I], opts ...Option) (output O, err error)
    Transform(ctx context.Context, input *schema.StreamReader[I], opts ...Option) (output *schema.StreamReader[O], err error)
}
```

详见 [components-overview](./components-overview.md)。

## 延伸阅读

- [Graph：图编排核心](./graph.md) ⭐
- [Chain：链式编排](./chain.md)
- [Workflow：字段级编排](./workflow.md)
- [State：图内共享状态](./state.md)
- [Callback：回调机制](./callback.md)
