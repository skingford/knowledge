---
title: Eino Graph：图编排核心
description: 精读 eino v0.8.10 compose 包中 Graph 的数据结构、节点/边/分支、Pregel vs DAG 运行模式、NodeTriggerMode 与编译流程。Eino 源码阅读系列的核心一页。
---

# Eino Graph：图编排核心 ⭐

> 源码路径：[`github.com/cloudwego/eino/compose@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/compose)
>
> 本文聚焦：`graph.go`（35 KB）、`graph_run.go`（30 KB）、`graph_manager.go`、`graph_node.go`、`dag.go`、`pregel.go`、`types.go`

Graph 是 eino 的**心脏**。本页要回答的核心问题：

1. Graph 的数据结构长什么样？
2. 怎么加节点、加边、加分支？
3. 两种运行模式 Pregel 和 DAG 有什么区别？
4. Compile 到底做了什么？
5. 类型一致性、控制依赖、数据依赖是怎么区分的？

## 一、两个保留节点与两种运行模式

### 1.1 START / END（`compose/graph.go:36-40`）

```go
const (
    START = "start"
    END   = "end"
)
```

这是两个**预占的节点名**，不能被 `AddXxxNode` 手动使用。任何图必须有且仅有这两个虚拟节点作为入口与出口——`AddEdge(START, "someNode")` 表示 "这个节点是起点之一"，`AddEdge("someNode", END)` 表示 "这个节点是终点之一"。

`compose/graph.go:162-164` 验证了这条规则：

```go
if key == END || key == START {
    return fmt.Errorf("node '%s' is reserved, cannot add manually", key)
}
```

### 1.2 Pregel vs DAG（`compose/graph.go:42-52`）

```go
type graphRunType string

const (
    runTypePregel graphRunType = "Pregel"
    runTypeDAG    graphRunType = "DAG"
)
```

两种执行模式对应不同的触发语义：

| 运行模式 | 允许有环 | 默认触发 | 对应文件 |
| --- | --- | --- | --- |
| **Pregel** | 是 | `AnyPredecessor`（任一前驱完成即触发） | `compose/pregel.go` |
| **DAG** | 否 | `AllPredecessor`（所有前驱完成才触发） | `compose/dag.go` |

Pregel 模式来自 Google Pregel 论文的 superstep 思路：在每一轮超级步里，所有可触发的节点并行执行；下一轮看谁的输入就绪。这种模型**天然支持循环**——比如 ReAct 里 "Think → Act → Observe" 不断回跳。

DAG 模式更直接：只要所有上游完成就跑，不允许回环。

### 1.3 NodeTriggerMode（`compose/types.go:37-46`）

```go
type NodeTriggerMode string

const (
    AnyPredecessor NodeTriggerMode = "any_predecessor"
    AllPredecessor NodeTriggerMode = "all_predecessor"
)
```

单个节点也可以**覆盖运行模式的默认触发语义**——比如在 Pregel 图里把某个汇聚节点强制设为 `AllPredecessor`，等所有分支都到齐才跑。

## 二、graph 结构体（`compose/graph.go:59-90`）

```go
type graph struct {
    nodes        map[string]*graphNode
    controlEdges map[string][]string
    dataEdges    map[string][]string
    branches     map[string][]*GraphBranch
    startNodes   []string
    endNodes     []string

    toValidateMap map[string][]struct {
        endNode  string
        mappings []*FieldMapping
    }

    stateType      reflect.Type
    stateGenerator func(ctx context.Context) any
    newOpts        []NewGraphOption

    expectedInputType, expectedOutputType reflect.Type

    *genericHelper

    fieldMappingRecords map[string][]*FieldMapping

    buildError error

    cmp component

    compiled bool

    handlerOnEdges   map[string]map[string][]handlerPair
    handlerPreNode   map[string][]handlerPair
    handlerPreBranch map[string][][]handlerPair
}
```

每个字段对应一个设计决策：

### 2.1 控制边 vs 数据边（`controlEdges` / `dataEdges`）

eino 把一条 "边" 拆成了**两种正交的维度**：

- **控制边（controlEdges）**：决定触发顺序 / 依赖关系
- **数据边（dataEdges）**：决定数据流向 / 字段映射

默认 `AddEdge(A, B)` 两种都建。但在 Workflow 模式下你可以只要数据流不要控制流，或只要控制流不要数据流——这是字段级编排的基础：

`compose/graph.go:214-215`：

```go
if noControl && noData {
    return fmt.Errorf("edge[%s]-[%s] cannot be both noDirectDependency and noDataFlow", startNode, endNode)
}
```

### 2.2 `branches`：条件分支表

每个节点可以有多条分支（`GraphBranch` 定义在 `compose/branch.go`），分支由一个谓词函数返回**下一个节点名**。这是 agent 循环与条件路由的关键：

```go
// 伪代码
g.AddBranch("agent", func(ctx, out) (string, error) {
    if hasToolCall(out) { return "tools", nil }
    return compose.END, nil
})
```

### 2.3 `toValidateMap` 与 `fieldMappingRecords`：字段映射待校验

Workflow 允许 "把 A.Field1 映射到 B.Field2"，这些映射不能在 `AddEdge` 时立即校验（因为对面节点可能还没加进来），所以用一个 map 记着**延后校验**。`updateToValidateMap()` 每次 addEdge 都会试一把，能校验就确定，不能就继续挂着，直到 `Compile` 时必须全部消解。

### 2.4 `stateType` / `stateGenerator`：图级共享状态

Graph 可以开启一个**每次执行独立的本地 state**：

- `stateGenerator`：工厂函数，每次 `Invoke/Stream` 被调用时创建一个新实例
- `stateType`：状态的 reflect.Type，用来校验 `ProcessState[T]` 的类型断言

详见 [State：图内共享状态](./state.md)。

### 2.5 `handlerPreNode` / `handlerPreBranch` / `handlerOnEdges`：字段映射 & 类型转换钩子

每个节点、边、分支前都可以插入一个 handler，框架在编排流水线里按位置触发。这套机制支撑了：

- State 的 pre/post handler
- Workflow 字段拷贝
- 自动流化 / 去流化（跨模式转换）

### 2.6 `compiled` + `ErrGraphCompiled`（`compose/graph.go:147-148`）

```go
var ErrGraphCompiled = errors.New("graph has been compiled, cannot be modified")
```

图**编译一次后不可变**。这是性能与正确性的关键约束：Compile 阶段做了大量类型推导并固化成闭包，后续改图就意味着要重新推导。

## 三、addNode：节点注册验证

`compose/graph.go:150-204` 的 `addNode` 是注册新节点的公共路径。它做了这些校验：

1. **图是否已编译** → 已编译则 `ErrGraphCompiled`
2. **保留名冲突** → 不能叫 `START` 或 `END`
3. **节点是否重复**
4. **state 依赖校验** — `options.needState` 要求 `stateGenerator` 已设置
5. **node key option 只允许在 Chain** — `options.nodeOptions.nodeKey != ""` 必须 `isChain(g.cmp)`
6. **pre/post handler 类型校验**：
   - state type 必须一致
   - handler 的输入/输出类型必须等于节点的输入/输出类型
   - 特殊处理 Passthrough 节点：此时节点类型是 `any`，handler 类型也必须是 `any`

所有错误都写回 `g.buildError`，让**批量 AddXxxNode** 时不必每次检查返回值——在 `Compile` 时统一报错。

## 四、addEdgeWithMappings：加边验证（`compose/graph.go:206-250`）

```go
func (g *graph) addEdgeWithMappings(
    startNode, endNode string,
    noControl bool, noData bool,
    mappings ...*FieldMapping,
) error
```

关键检查顺序：

1. 图是否已编译
2. `noControl && noData` → 禁止
3. `startNode != END`、`endNode != START`
4. 两端节点都必须已经存在（除非是 START/END）
5. 重复边检测（控制边与数据边分别查）
6. **若加数据边**：
   - 登记到 `toValidateMap`
   - 立即触发 `updateToValidateMap()`，把能校验的字段映射定下来
7. 更新邻接表、`startNodes` / `endNodes` 列表

## 五、节点体系（简述）

完整讨论见 [`graph_node.go`、`component_to_graph_node.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/component_to_graph_node.go) 与后续各组件专题。几种常见 `AddXxxNode`：

| API | 内部组件类型 | 典型输入/输出 |
| --- | --- | --- |
| `AddChatModelNode` | `components.ComponentOfChatModel` | `[]*Message` → `*Message` |
| `AddChatTemplateNode` | `components.ComponentOfPrompt` | `map[string]any` → `[]*Message` |
| `AddToolsNode` | `ComponentOfToolsNode` | `*Message` → `[]*Message` |
| `AddRetrieverNode` | `components.ComponentOfRetriever` | `string` → `[]*Document` |
| `AddEmbeddingNode` | `components.ComponentOfEmbedding` | `[]string` → `[][]float64` |
| `AddIndexerNode` | `components.ComponentOfIndexer` | `[]*Document` → `[]string` |
| `AddLoaderNode` | `components.ComponentOfLoader` | — |
| `AddDocumentTransformerNode` | `components.ComponentOfTransformer` | `[]*Document` → `[]*Document` |
| `AddLambdaNode` | `ComponentOfLambda` | 任意 `I` → `O` |
| `AddGraphNode` | `ComponentOfGraph` | 子图嵌套 |
| `AddWorkflowNode` | `ComponentOfWorkflow` | 嵌套 Workflow |
| `AddPassthroughNode` | `ComponentOfPassthrough` | `any` → `any`（原样转发） |
| `AddBranch` | （不是节点） | 加条件分支 |

`ComponentOfToolsNode` 是一种内置的**特化节点**——见 `compose/tool_node.go`（38 KB，仓库中最大的单文件之一），它封装了 "收到带 ToolCall 的 Message → 并行调用 N 个 Tool → 汇总结果" 这一典型 agent 循环步。

## 六、Compile 过程（概览）

`Compile(ctx)` 是整个 Graph 的**最重要入口**。它做了五件事：

### 6.1 拓扑排序与环检测

- DAG 模式下必须无环
- Pregel 模式允许环，但每个节点有最大迭代次数保护

### 6.2 类型一致性检查

- 每条**数据边**的上游输出类型必须与下游输入类型兼容（可能通过接口、可能通过 `FieldMapping`）
- 每个**分支**的输入类型必须与节点输出一致
- 每个 **pre/post handler** 的类型必须与节点匹配
- 图的输入/输出类型（`expectedInputType` / `expectedOutputType`）必须与 `START` 的所有 follower 和 `END` 的所有 predecessor 一致

类型比较大量用 `reflect.Type`。细节见 [类型检查与编译期校验](./type-check.md)。

### 6.3 流兼容性推导

对每条边，根据上下游实现的交互模式（Invoke/Stream/Collect/Transform）决定**这条边上要不要插入一个流适配器**。如果上游只会 Invoke、下游只会 Transform，框架就插入一个 "把 Invoke 输出包成单元素流" 的转换器——这就是 [components-overview](./components-overview.md) 里提到的 12 个转换器的实际落地点。

### 6.4 字段映射固化

Workflow 场景下，所有 `FieldMapping` 在此时计算出**具体的 reflect.Field 访问路径**，编译出高效的取值/写入 closure。

### 6.5 产出 Runnable

Compile 返回的是一个实现了 `Runnable[I, O]` 的结构体（由 `compose/graph_run.go` 定义）。它的 Invoke / Stream / Collect / Transform 方法内部：

1. 用 `stateGenerator` 新建一份本次执行的 state
2. 初始化 channel 布设（给每条边配一个 stream）
3. 按 Pregel 或 DAG 策略调度节点
4. 收集 END 节点的输出
5. 回调贯穿全程

## 七、运行时执行要点（`compose/graph_run.go`）

### 7.1 Channel 拓扑

每条数据边底层是一个 `schema.StreamReader` + `StreamWriter`。扇出时用 `StreamReader.Copy(n)`，扇入时用 `MergeNamedStreamReaders`。

### 7.2 节点并发

Pregel 的一个 superstep 内，所有可触发节点**并行跑**（各自 goroutine）。步与步之间用 sync 对齐。

### 7.3 取消传播

ctx 被取消会立即把所有流 Close，goroutine 退出。

### 7.4 panic 隔离

每个节点内部 panic 被 recover 并变成 error 返回，图不会整体崩溃。

## 八、边界与常见陷阱

### 8.1 "edge already present"

重复 `AddEdge(A, B)` 会报错。注意：控制边与数据边分开计数。

### 8.2 "cannot be both noDirectDependency and noDataFlow"

至少要保留一种边类型——既没控制依赖也没数据流等于没边。

### 8.3 "node X needs state but graph state is not enabled"

使用 `WithPreHandler` / `WithPostHandler` 或 `ProcessState[T]` 要求 Graph 用 `NewGraphWithState`（或等价 API）创建。

### 8.4 Chain 专属选项错用

`nodeKey` option 只有 Chain 接受。Graph 直接用就会 `only chain support node key option`。

### 8.5 修改已编译图

`ErrGraphCompiled` 是硬错误，重编译必须重新 `NewGraph`。

## 九、可视化与调试

- `compose/introspect.go` 提供了反射图结构的 API
- DevOps 工具 `eino-debug` 可以可视化编译后的节点与边
- Callback 可以打印每次节点触发与输入输出

## 十、推荐阅读顺序

1. 本页（`graph.go` 数据结构）
2. [compose：编排总览](./compose-overview.md)（Graph vs Chain vs Workflow 对比）
3. [Chain](./chain.md) / [Workflow](./workflow.md)（降级为 Graph 的两种语法糖）
4. [Stream：流处理内部](./stream.md)（Compile 里的流兼容性推导）
5. [类型检查与编译期校验](./type-check.md)（Compile 里的类型系统）
6. [State：图内共享状态](./state.md)
7. [Callback：回调机制](./callback.md)

## 延伸阅读

- [compose：编排总览](./compose-overview.md)
- [schema：消息与流](./schema.md)
- [components：组件抽象总览](./components-overview.md)
- [Stream：流处理内部](./stream.md)
