---
title: Eino Workflow：字段级编排
description: 精读 eino v0.8.10 compose 中 Workflow 的字段映射机制：AddInput/AddDependency/SetStaticValue 三种连接方式、三种 dependencyType，以及它解决了 Graph 无法解决的什么问题。
---

# Eino Workflow：字段级编排

> 源码路径：
> - [`compose/workflow.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/workflow.go)（18 KB）
> - [`compose/field_mapping.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/field_mapping.go)（22 KB）
> - [`compose/values_merge.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/values_merge.go)

Workflow 解决的是 Graph 回答不了的一个具体问题：**"上游的某几个字段要去下游，另外几个字段要去旁路"**。

## 一、问题背景：Graph 的粒度限制

在 Graph 里，一条 edge 传递的是**整个值**：

```go
// 节点 A 输出 *Result，Result 有 Data/Meta/Raw 三个字段
g.AddEdge("A", "B") // B 收到完整的 *Result
g.AddEdge("A", "C") // C 也收到完整的 *Result
```

如果 B 只需要 `Data`、C 只需要 `Meta`，你有两条路：

1. 在 A 后面加一个 Lambda 负责拆字段——代码啰嗦
2. 让 B、C 自己从 `*Result` 里取——节点间耦合

Workflow 引入**字段级数据流**：直接声明 "A.Data → B"、"A.Meta → C"。

## 二、Workflow 的数据结构

### 2.1 Workflow 与 WorkflowNode（`compose/workflow.go:30-45`）

```go
type WorkflowNode struct {
    graph            *graph
    key              string
    inputFuncs       []func(any) (any, error)
    staticValues     map[string]any
    dependencySetter func() error
    mappedFieldPaths map[string][]*FieldPath
}

type Workflow[I, O any] struct {
    // 内部持有 graph（non-public）
    workflowNodes    map[string]*WorkflowNode
    workflowBranches []*GraphBranch
    dependencies     map[string]map[string]dependencyType
}
```

字段意义：

- `inputFuncs` — 每个节点可以有多个输入映射函数（每个 `AddInput` 调用追加一个）
- `staticValues` — 编译期常量，注入到指定字段
- `dependencySetter` — 延迟执行的依赖注册函数（队列化到 Compile 时消解）
- `mappedFieldPaths` — 目标字段路径表，用于冲突检查
- `dependencies` — 全局依赖邻接表，key 是下游节点、value 是 `{上游: dependencyType}`

### 2.2 三种 dependencyType（`compose/workflow.go:49`）

```go
const (
    normalDependency    dependencyType = iota // 数据 + 执行 双依赖
    noDirectDependency                        // 仅数据（字段由别处注入）
    branchDependency                          // 分支条件控制的依赖
)
```

对应 Graph 的**控制边 / 数据边分离**（见 [graph](./graph.md#二graph-结构体composegraphgo59-90)）：

| dependencyType | 控制边 | 数据边 | 场景 |
| --- | --- | --- | --- |
| `normalDependency` | ✅ | ✅ | 最常见——B 需要等 A 完成，B 的字段也要 A 的字段 |
| `noDirectDependency` | ❌ | ✅ | B 的某字段来自 A，但 B 不必等 A（因为数据本就是静态的或走其他路径） |
| `branchDependency` | ✅（受分支控制） | ✅ | A 后面是条件分支，分支到 B 时才激活依赖 |

这种三分法是 Workflow 的核心设计：**依赖的"执行"维度与"数据"维度解耦**。

## 三、三种连接方式

### 3.1 AddInput：数据 + 执行双依赖（`compose/workflow.go:148-164`）

```go
node.AddInput(fromNodeKey string, mappings ...*FieldMapping) *WorkflowNode
```

建立 **数据流 + 执行依赖**。典型用法：

```go
wf.AddChatModelNode("summarize", model).
    AddInput("retrieve",
        compose.MapFields("Documents", "Context"),  // retrieve.Documents → summarize.Context
    )
```

两层含义：

1. **控制依赖**：`summarize` 必须等 `retrieve` 完成
2. **数据流**：`retrieve` 输出的 `Documents` 字段会被复制到 `summarize` 输入的 `Context` 字段

### 3.2 AddDependency：仅执行依赖（`compose/workflow.go:189-202`）

```go
node.AddDependency(fromNodeKey string) *WorkflowNode
```

只建立**执行依赖**，不传数据。典型用法：

```go
// log_audit 必须在 save_result 之后跑，但 log_audit 不用 save_result 的数据
wf.AddLambdaNode("log_audit", auditFn).
    AddDependency("save_result")
```

### 3.3 SetStaticValue：编译期常量（`compose/workflow.go:204-213`）

```go
node.SetStaticValue(fieldPath string, value any) *WorkflowNode
```

把常量写入输入结构体的指定字段：

```go
wf.AddRetrieverNode("retrieve", r).
    SetStaticValue("TopK", 10).
    SetStaticValue("ScoreThreshold", 0.7)
```

用于**不需要来自其他节点**但要配置的字段。

## 四、FieldMapping：字段映射详解（`compose/field_mapping.go`）

22 KB 的 `field_mapping.go` 是 Workflow 的灵魂。关键类型：

### 4.1 `FieldPath`

```go
type FieldPath []string
```

用字符串切片表示嵌套字段访问。例：`["Data", "Items", "[0]", "Name"]` 对应 Go 的 `x.Data.Items[0].Name`。

### 4.2 FieldMapping

```go
type FieldMapping struct {
    From FieldPath   // 上游输出中的路径
    To   FieldPath   // 下游输入中的路径
}
```

`MapFields("Data.Items", "Input")` 就是创建一个 `FieldMapping{From: ["Data","Items"], To: ["Input"]}`。

### 4.3 编译期验证

`addDependencyRelation`（`workflow.go:223-264`）在 Compile 时：

1. 检查 `From` 在上游输出类型里**真的有这条路径**
2. 检查 `To` 在下游输入类型里**真的有这条路径**
3. 检查 **路径上的类型可赋值**
4. 检查**同一 `To` 字段不能被多个源写入**（除非是 `append` 语义的 slice/map）
5. 所有通过后，编译出一个 closure 用 reflect 做 O(1) 读写

## 五、Workflow 的执行模型

Workflow **强制 DAG 模式**。这是字段映射的数学前提：

- 每个节点在所有字段依赖满足时触发
- 每个字段只会被写入一次（非 append 场景）
- 循环在字段依赖图中必然构成 "鸡生蛋" 问题

## 六、典型使用模板

```go
type RetrieveResult struct {
    Documents []*schema.Document
    Query     string
}

type SummarizeInput struct {
    Context  []*schema.Document  // 来自 Retrieve
    Question string              // 来自 原始 input
    MaxWords int                 // 静态值
}

wf := compose.NewWorkflow[string, string](  // I = 用户问题, O = 摘要
    compose.WithGenLocalState(...),
)

// ① 把用户问题传给 Retrieve.Query
wf.AddRetrieverNode("retrieve", r).
    AddInput(compose.START,
        compose.MapFields("", "Query"), // 整个 input 映射到 Query
    )

// ② 把 Retrieve.Documents 映射到 Summarize.Context
//   把原始 input 映射到 Summarize.Question
//   Summarize.MaxWords 设为静态值
wf.AddChatModelNode("summarize", chatModel).
    AddInput("retrieve",
        compose.MapFields("Documents", "Context"),
    ).
    AddInput(compose.START,
        compose.MapFields("", "Question"),
    ).
    SetStaticValue("MaxWords", 200)

// ③ 连到 END
wf.End().AddInput("summarize")

r, err := wf.Compile(ctx)
```

等价的 Graph 版本要多写一层 Lambda 来拆/拼字段，代码量多一倍。

## 七、与 Graph 对比

| 维度 | Workflow | Graph |
| --- | --- | --- |
| 粒度 | 字段级 | 整值级 |
| 模式 | 强制 DAG | DAG 或 Pregel |
| 循环 | 不支持 | Pregel 支持 |
| 类型校验时机 | 编译期（含字段路径） | 编译期（整值） |
| 代码量 | 中等（声明多条 AddInput） | 小（一条 AddEdge）+ 需 Lambda 拆字段 |
| 适用场景 | 结构体驱动的数据流 | 控制流驱动的编排 |

## 八、边界与陷阱

### 8.1 字段不存在

`AddInput("A", MapFields("NotExist", "B"))` 在 Compile 时报错，不是运行时。

### 8.2 类型不可赋值

`From` 类型与 `To` 类型不兼容（比如 `string` → `int`）在 Compile 时报错。

### 8.3 同一字段被多源写入

```go
wf.AddChatModelNode("B", m).
    AddInput("X", MapFields("Out", "Input")).
    AddInput("Y", MapFields("Out", "Input"))  // ❌ Input 被写两次
```

除非 `Input` 是 slice/map 且你用 append/merge 语义（见 `values_merge.go`），否则报错。

### 8.4 START 的输入怎么映射

`START` 代表 Workflow 的整体输入 `I`。要把它的字段映射到某个节点，用 `AddInput(compose.START, MapFields("SomeField", "TargetField"))`。如果直接把整个 input 传过去，`From = ""` 或 `"[root]"`（看 API 约定）。

### 8.5 END 的输出

Workflow 的输出是 "连到 END 的节点的字段聚合"。典型写法：

```go
wf.End().
    AddInput("summarize", MapFields("Content", "")) // Content 字段作为整体输出
```

### 8.6 循环依赖

`A 依赖 B、B 依赖 A` 在 Compile 时被检测——不会运行到死锁。

## 九、最佳实践

- **输入输出类型用 struct**，才能享受字段级映射；基础类型退化为整值
- **字段路径单一职责**：一个 `AddInput` 映射一个字段，别塞多个映射
- **静态值用 `SetStaticValue`**，别用 Lambda 造常量——前者在编译期固化，后者每次执行
- **大 struct 考虑拆分**——Workflow 的 reflect 代价与字段数成正比
- **嵌套 Workflow**：复杂场景把子流程抽成独立 Workflow 再用 `AddWorkflowNode`

## 十、什么时候**不要**用 Workflow

- 需要循环（agent 的 Think-Act-Observe 回路）→ 用 Graph Pregel
- 数据本身就是 `string` / `[]*Message` 这种不可分字段 → 用 Chain / Graph
- 逻辑核心在控制流而不是数据流 → 用 Graph

## 延伸阅读

- [compose：编排总览](./compose-overview.md)
- [Graph：图编排核心](./graph.md) ⭐
- [Chain：链式编排](./chain.md)
- [类型检查与编译期校验](./type-check.md)
- [Lambda：函数式组件](./lambda.md)
