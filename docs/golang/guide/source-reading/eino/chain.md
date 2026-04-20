---
title: Eino Chain：链式编排
description: 精读 eino v0.8.10 compose 中 Chain 的线性编排实现——它如何以 Graph 为底座，通过 AppendXxx 模式提供更简洁的语法。
---

# Eino Chain：链式编排

> 源码路径：[`compose/chain.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/chain.go)（17 KB）
>
> 相关文件：`chain_branch.go`、`chain_parallel.go`、`component_to_graph_node.go`

Chain 是 eino 中**最简单的编排器**。所有 Chain 逻辑本质都是 Graph 的语法糖：内部持有一个 `Graph[I, O]`，每次 `AppendXxx` 都把它转成 Graph 节点 + 相邻边。读 Chain 就是读 "怎么在 Graph 之上造一层 DSL"。

## 一、Chain 的定位

| 维度 | Chain | Graph |
| --- | --- | --- |
| 拓扑 | 线性（可带分支/并行） | 任意 DAG / 含环 |
| 节点 key | 自动生成（node_0、node_1 …） | 用户自定义 |
| 边 | 自动连相邻节点 | 用户显式 `AddEdge` |
| 是否支持循环 | 否（到 END 就终止） | 是（Pregel 模式） |
| 代码量 | 最少 | 灵活但繁琐 |

**何时选 Chain**：请求是明确的 "A → B → C" 流水线，偶尔加分支或并行。一旦出现 "C 的结果要回跳到 A" 这种需求，就必须切到 Graph + Pregel。

## 二、Chain 结构（`compose/chain.go:1-150`）

```go
type Chain[I, O any] struct {
    err         error
    gg          *Graph[I, O]
    nodeIdx     int
    preNodeKeys []string
    hasEnd      bool
}
```

逐字段拆解：

### 2.1 `err` —— 延迟错误

Chain 的构建是**流式调用**风格。为了让用户能连写 `.AppendA().AppendB().AppendC()` 而不用每步检查 err，所有中间错误都暂存在 `c.err`，在 `Compile` 时统一抛出。

### 2.2 `gg *Graph[I, O]` —— 底层 Graph

Chain 只是代理，实际数据结构都在 `gg` 里。`NewChain` 内部创建 Graph 时传的 `component` 是 `ComponentOfChain`（见 [graph](./graph.md)），只改标签不改结构。

### 2.3 `nodeIdx` —— 自增计数器

每次 `AppendXxx` 自动产出 node key：`node_0`、`node_1`、`node_2` …。用户**不能**自定义 key（除非用 `nodeKey` option——这是 Chain 专属，见 `compose/graph.go:175`）。

### 2.4 `preNodeKeys []string` —— 上一步的节点列表

通常只有 1 个元素。用到 `AppendParallel` 时会并行扩展——这个 slice 记录**下一次 AppendXxx 要从哪些节点连过来**。

### 2.5 `hasEnd bool` —— 是否已经显式结束

防止在 Compile 时重复给尾节点连 END。

## 三、`NewChain[I, O]()`

```go
func NewChain[I, O any](opts ...NewGraphOption) *Chain[I, O] {
    c := &Chain[I, O]{
        gg: NewGraph[I, O](opts...),  // 传入 ComponentOfChain
    }
    c.preNodeKeys = []string{START}
    return c
}
```

初始 `preNodeKeys = [START]`——第一个 `AppendXxx` 会从 START 连到新节点。

## 四、AppendXxx 家族

每种组件都有对应的 Append 方法：

- `AppendChatTemplate(tpl prompt.ChatTemplate) *Chain[I, O]`
- `AppendChatModel(m model.BaseChatModel)`
- `AppendEmbedding(e embedding.Embedder)`
- `AppendIndexer(i indexer.Indexer)`
- `AppendRetriever(r retriever.Retriever)`
- `AppendLoader(l document.Loader)`
- `AppendDocumentTransformer(t document.Transformer)`
- `AppendLambda(lambda *Lambda)` — 任意函数
- `AppendToolsNode(tn *ToolsNode)` — Tool 批处理

每一个内部都做三件事：

```go
// 伪代码
func (c *Chain[I, O]) AppendXxx(component XxxComponent, opts ...GraphAddNodeOpt) *Chain[I, O] {
    if c.err != nil { return c }                    // 有错就直接返回
    key := fmt.Sprintf("node_%d", c.nodeIdx)
    c.nodeIdx++
    // 1. 把 component 转成 graphNode
    if err := c.gg.AddXxxNode(key, component, opts...); err != nil {
        c.err = err
        return c
    }
    // 2. 把 preNodeKeys 的每一个节点连到新节点
    for _, prev := range c.preNodeKeys {
        if err := c.gg.AddEdge(prev, key); err != nil {
            c.err = err
            return c
        }
    }
    // 3. 更新 preNodeKeys 为当前节点
    c.preNodeKeys = []string{key}
    return c
}
```

## 五、结构化扩展：Branch、Parallel、Graph

### 5.1 AppendBranch（`compose/chain_branch.go`）

```go
c.AppendBranch(NewChainBranch(condFunc).
    AddChatModel(modelA).
    AddChatModel(modelB))
```

- `condFunc` 返回下一个 node key
- 每个分支都是一个独立 graph node
- Chain 自动把条件节点连到所有分支头，分支尾都连到分支节点后的下一步

### 5.2 AppendParallel（`compose/chain_parallel.go`）

```go
c.AppendParallel(NewParallel().
    AddChatModel("a", modelA).
    AddChatModel("b", modelB))
```

- 所有并行节点从同一前驱触发
- 并行节点的输出被**以命名聚合**汇入下一步（`map[string]any`）
- 下一步必须接受这个 map 作为输入

### 5.3 AppendGraph

允许把已有的 Graph 作为一个节点塞进 Chain，便于复用已有子图。

## 六、Compile 前的 `addEndIfNeeded`

Chain 的 Compile 多做了一步：

```go
func (c *Chain[I, O]) Compile(ctx context.Context, opts ...GraphCompileOption) (Runnable[I, O], error) {
    if c.err != nil { return nil, c.err }
    if err := c.addEndIfNeeded(); err != nil { return nil, err }
    return c.gg.Compile(ctx, opts...)
}

func (c *Chain[I, O]) addEndIfNeeded() error {
    if c.hasEnd { return nil }
    for _, prev := range c.preNodeKeys {
        if err := c.gg.AddEdge(prev, END); err != nil { return err }
    }
    c.hasEnd = true
    return nil
}
```

**这是 Chain 与 Graph 最核心的易用性差别**：Chain 不要求用户手动 `AddEdge(lastNode, END)`；Graph 必须。

## 七、Chain 专属：nodeKey option

`compose/graph.go:175-177`：

```go
if options.nodeOptions.nodeKey != "" {
    if !isChain(g.cmp) {
        return errors.New("only chain support node key option")
    }
}
```

Chain 可以用 `WithNodeKey("my-key")` 给某个节点起**有意义的名字**——通常用于后续在调用期用 `Option.DesignateNode("my-key")` 精准传入组件 option。Graph 不支持这个（Graph 里 key 本来就是用户自定义的）。

## 八、Compile 后的行为

Chain 产出的 Runnable 与 Graph 完全等价——调用 `Invoke / Stream / Collect / Transform` 没有区别。这也意味着**Chain 的运行期开销与同结构的 Graph 相等**：没有额外包装、没有性能损失。

## 九、边界与陷阱

### 9.1 "chain has ended"

一旦 `hasEnd = true`（手动或自动），再调 `AppendXxx` 会报错。Chain 是**一次性构造**，不能中途回退。

### 9.2 类型不匹配

`AppendA().AppendB()` 中若 A 的输出类型 ≠ B 的输入类型，错误在 `AppendB` 时写入 `c.err`，Compile 时暴露。不像 Graph 可以延后（因为 Chain 的边立刻就加了）。

### 9.3 Parallel 的输入类型

并行块所有子节点必须接受**同一份输入**（与前驱输出类型一致）。输出被聚合成 `map[string]any`，下一节点必须能消费这个 map。

### 9.4 Branch 的类型

分支节点本身接受一个值，内部的 `condFunc` 返回 key。所有分支子节点的输出必须能**合一**到下一步的输入——通常用 Lambda 做合一。

### 9.5 嵌套 Chain 的边界

子 Chain 的 state 与父 Chain **独立**。共享 state 需要用父级的 State API 手动传递。

## 十、最佳实践

- **快速原型用 Chain**，复杂 agent 直接上 Graph
- **给关键节点加 `WithNodeKey`**——调用期 Option 才能精准定位
- **先把请求画成流程图再写**——能画成 "一条线 + 少量分支/并行" 才适合 Chain
- **避免在 AppendLambda 里做耗时操作**——Lambda 是单线程执行，会阻塞整条链
- **Parallel 并发数别太大**——每个分支都起一个 goroutine，百级并发容易把下游 API 打满

## 延伸阅读

- [compose：编排总览](./compose-overview.md)
- [Graph：图编排核心](./graph.md) ⭐
- [Workflow：字段级编排](./workflow.md)
- [Lambda：函数式组件](./lambda.md)
