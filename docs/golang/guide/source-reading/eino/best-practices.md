---
title: Eino 从源码提炼的最佳实践
description: 综合整个 eino v0.8.10 源码精读系列，沉淀为可复用的使用与扩展决策清单。
---

# Eino：从源码提炼的最佳实践

> 综合本系列前 20 篇（[索引见总览](./index.md)），按**决策点**组织——遇到设计选择时，这里提供一条参考答案与它背后的源码依据。

## 一、编排模式选型

### 1.1 三种编排器怎么选

| 需求 | 选 | 源码依据 |
| --- | --- | --- |
| 请求顺序过 n 步 | **Chain** | `compose/chain.go` 通过 `AppendXxx` 线性构图 |
| ReAct / agent 循环 | **Graph + Pregel** | `graph.go` 只有 Pregel 允许环 |
| 需要把结构体某几个字段分发到不同节点 | **Workflow** | `field_mapping.go`（22 KB）专门解决字段级路由 |
| 多路并行然后汇聚 | **Graph + Branch/Parallel** 或 **Chain.AppendParallel** | 两者均支持 |
| 仅数据管道、无 LLM | **Chain** | 最轻量 |

### 1.2 嵌套 vs 扁平

- 单图节点数 ≤ 15：扁平
- 15-30：按阶段拆子 Graph
- 30+：考虑重构

嵌套图的 **state 相互隔离**（见 `state.go:184-188` 的 parent 链）——只有显式通过类型匹配才能跨层访问。

## 二、流式处理纪律

### 2.1 组件实现几种模式

| 场景 | 建议实现 |
| --- | --- |
| LLM ChatModel | Invoke + Stream（跟 Provider 能力走） |
| Tool（短响应） | Invoke |
| Tool（大结果集） | Stream |
| Retriever/Embedding/Indexer | Invoke（天然批量，无流） |
| Transformer（数据管道） | Transform |
| 聚合节点 | Collect |
| 自定义业务逻辑 | 按需——至少一种 |

框架提供 12 个跨模式转换器（`compose/runnable.go` 的 `invokeByStream` 等，见 [components-overview](./components-overview.md#四12-个跨模式转换器)），**只实现一种**就能用。但热路径上为了避开转换开销应该实现多种。

### 2.2 Close 责任 SOP

- **用户 `Pipe()` 产出的流**：两端都 `defer Close`
- **组件返回的流**：调用方 `defer Close`
- **Graph 执行内部流**：框架自动管
- **Copy(n) 的子流**：每个子流必须 Close
- **Callback 收到的流**：**必须** Close——不然整条流水线泄漏（`callbacks/interface.go:77-80`）

### 2.3 流的生产侧规范

```go
reader, writer := schema.Pipe[T](cap)
go func() {
    defer writer.Close()
    for /* 生产循环 */ {
        if closed := writer.Send(chunk, nil); closed { return }  // 检查下游是否已关
    }
    // 错误传播：把 error 塞进流
    if err != nil { writer.Send(zero, err) }
}()
return reader, nil
```

## 三、组件设计

### 3.1 Lambda vs 独立 Component

| 决策点 | Lambda | 独立 Component |
| --- | --- | --- |
| 只一处用 | ✅ | |
| 多图复用 | | ✅ |
| 需要配置参数 | | ✅ |
| 代码 ≤ 20 行 | ✅ | |
| 精细 callback 时机 | | ✅（实现 Checker） |
| 单元测试驱动 | | ✅ |

### 3.2 实现协议的优先级

所有自定义组件都应考虑：

1. **必选**：组件接口（如 `model.BaseChatModel`）
2. **强烈推荐**：`components.Typer.GetType()` —— DevOps 工具里的稳定名
3. **流式组件推荐**：`components.Checker.IsCallbacksEnabled()` —— 接管 callback 时机
4. **ChatModel 推荐**：`model.ToolCallingChatModel.WithTools()` —— 并发安全（见 [chatmodel](./chatmodel.md#三为什么有三个接口并发安全演化)）

### 3.3 Option 作用域

调用级 option **默认作用于所有节点**。大图里一定要用 `compose.Option.DesignateNode("node-id")` 限定——否则 `WithTemperature(0.3)` 会被传给 Retriever 引发错误。

## 四、类型与错误边界

### 4.1 能编译期抓的就编译期抓

eino 把四类错误放到 Compile 期：

- 边两端类型不一致
- 分支谓词输入类型不对
- pre/post handler 类型不匹配节点
- Workflow 字段路径不存在

**规范**：Graph 构造代码放到应用**启动阶段**——failing early 比 runtime panic 好得多。

### 4.2 弱类型（`any`）的使用边界

`InvokableLambda[any, any](...)` 会**降级编译期检查**到运行时。**慎用**：

- 需要动态路由时用
- 快速原型时用
- 生产代码应尽量具体类型

### 4.3 错误分类

| 类别 | 处理 |
| --- | --- |
| Context 取消 | 立即返回 `ctx.Err()` |
| Provider 限流 | 内置退避重试，不冒泡 |
| 参数非法 | 返回明确 error |
| Tool 调用错误 | **写回 tool message**（让 LLM 自纠）而非 bubble |
| 框架 panic | 自动 recover 转 error（但可能丢堆栈——建议自己 `defer recover + errors.WithStack`） |
| 流中途错误 | `writer.Send(zero, err)` —— 而非 close + 外层 return |

## 五、State 使用边界

### 5.1 什么时候该用 State

- **跨节点共享可变数据**（如对话历史累加、全局 metrics）
- **需要并发安全**（State 自带每层锁）
- **嵌套图需要访问外层数据**（利用 parent 链词法作用域）

### 5.2 什么时候**不**用

- 节点间单向传递 → 用 edge
- 只在一个节点内用 → 用局部变量
- 配置型数据 → Config 或 Option
- **跨请求共享** ❌ 绝对不要——会跨请求污染

### 5.3 规范

1. `ProcessState[S]` 而非手动 ctx.Value
2. handler 里只做内存操作，不做 I/O
3. 重操作前拷贝后离开锁
4. 嵌套图用不同 State 类型名避免 shadow

## 六、RAG Pipeline 模式

### 6.1 离线索引 Pipeline

```
Source → Loader → Transformer(split) → Transformer(clean) → Indexer → (ids)
```

- **独立的 Graph**，与在线查询 Graph 分开
- **幂等 ID 策略**：`Document.ID` 或 `hash(Content)`
- **Embedder 在 Indexer 和 Retriever 间共享**（同一实例最好）
- **失败分批重试**

### 6.2 在线检索 Pipeline

```
query → [Retriever] → [ChatTemplate + docs] → ChatModel → answer
```

或字段级用 Workflow：

```go
wf.AddRetrieverNode("r", retriever).AddInput(START, MapFields("", "Query"))
wf.AddChatModelNode("m", model).
    AddInput("r", MapFields("Documents", "Context")).
    AddInput(START, MapFields("", "Question"))
```

### 6.3 混合检索

```
          ┌─ DenseRetriever ─┐
query ─ ─ ┤                  ├ Rerank(Lambda) ─ ChatModel
          └─ SparseRetriever ┘
```

- Dense 和 Sparse 后端分别用不同 Indexer
- Rerank 可以是 Lambda 也可以是专门的 Retriever（包装）
- Document 可以同时持有 `DenseVector` 和 `SparseVector`（`schema/document.go:168-220`）

### 6.4 离线/在线参数要一致

| 参数 | 索引 | 检索 | 必须一致 |
| --- | --- | --- | --- |
| Embedder 模型 | ✅ | ✅ | ⚠️ |
| Embedder 维度 | ✅ | ✅ | ⚠️ |
| 分块策略 | ✅ | 不直接影响 | |
| SubIndexes | ✅ | ✅ | ⚠️ |

**规范**：embedder 放**配置中心**，一处定义、两处引用。

## 七、Agent 循环（ReAct 样式）

典型结构：

```
START ─ Prompt ─ ChatModel ─┬─ ToolsNode ─ ChatModel（下一轮）
                            └─ END
```

- `ChatModel` 后面用 `AddBranch` 判断有没有 ToolCall
- `ToolsNode` 并行执行所有 tool（见 [tool](./tool.md#八toolsnode并行执行--结果回写)）
- 最大迭代次数：`compose.WithMaxRunSteps(n)`——防无限循环
- state 里累积 `History` 以便下一轮复用

## 八、Tool 设计

### 8.1 使用 `utils.InferTool`

```go
type Args struct {
    City string `json:"city" jsonschema:"required,description=City name"`
}
func impl(ctx context.Context, a *Args) (string, error) { /* ... */ }
tool, _ := utils.InferTool("get_weather", "Query weather", impl)
```

避免手写 ToolInfo + 手写 JSON 反序列化。

### 8.2 Desc 里写 few-shot

`schema/tool.go:64-65` 明确建议：

> "Desc should explain when and why to use the tool; **few-shot examples** in Desc significantly improve model accuracy."

这是提升模型 tool 选择准确率的**最大杠杆**。

### 8.3 副作用型 Tool 幂等

用 `ToolCall.ID` 作为 dedup key—— LLM 可能在同一会话里重复调用同一 tool。

### 8.4 错误回写给 LLM

```go
func (t *MyTool) InvokableRun(ctx context.Context, args string, opts ...tool.Option) (string, error) {
    result, err := t.call(ctx, args)
    if err != nil {
        // 让 LLM 看到错误，有机会自纠
        return fmt.Sprintf("Error calling tool: %v. Please reconsider.", err), nil
    }
    return result, nil
}
```

`return nil, err` 会让 agent 循环中断——很多时候你想给模型**改错机会**。

## 九、Callback 纪律

### 9.1 实现 `TimingChecker`

```go
func (h *MyHandler) Needed(_ context.Context, _ *RunInfo, t CallbackTiming) bool {
    return t == TimingOnStart || t == TimingOnEnd
}
```

不实现的话，框架会为**每次组件调用**都 Copy 所有流——这是 callback 开销的大头。

### 9.2 流式 Handler 必须 Close

```go
func (h *MyHandler) OnEndWithStreamOutput(ctx context.Context, info *RunInfo, out *StreamReader[CallbackOutput]) context.Context {
    go func() {
        defer out.Close()  // ⚠️
        for { /* Recv 到 EOF */ }
    }()
    return ctx
}
```

不 Close 会泄漏——原始流无法回收。

### 9.3 不要修改 Input/Output

所有下游共享同一个指针（`callbacks/interface.go:82-84`）。要改必须 deep clone。

### 9.4 Handler 间无序

不要依赖 A.OnEnd 一定在 B.OnEnd 之前或之后。每个 Handler 独立。

### 9.5 全局 Handler 在 main 里注册

`AppendGlobalHandlers` **非线程安全**（`interface.go:100-102`）——只能在程序启动阶段调用。

## 十、性能优化路径

遇到性能问题按优先级排查：

1. **LLM 调用**：比所有其他开销都大。优化 prompt、用更小的模型、用缓存
2. **Retriever 调用**：向量库的 TopK 是否合理？索引维度是否过高？
3. **Embedder 调用**：同查询的 embedding 是否缓存了？
4. **Stream Copy**：有多少个 callback？实现 TimingChecker 了吗？
5. **State 锁**：是否在 handler 里做了 I/O？
6. **Lambda**：用 `any` 导致的 type assertion？
7. **自动模式转换**：组件只实现了一种模式，被框架反复 Concat/Pipe？

## 十一、可观测性落地

### 11.1 分布式 trace

```go
type traceHandler struct{}

func (h *traceHandler) OnStart(ctx context.Context, info *RunInfo, in CallbackInput) context.Context {
    span, ctx := tracer.StartSpanFromContext(ctx, fmt.Sprintf("%s.%s", info.Component, info.Name))
    span.SetTag("type", info.Type)
    return ctx
}
// OnEnd/OnError 从 ctx 里取 span，Finish()
```

### 11.2 LLM 指标

流式 ChatModel 的关键指标：

- **首 token 延迟**（TTFT）— 从 OnStartWithStreamInput 到第一个 chunk
- **平均 token 间隔**
- **总 token 数 / 总耗时**
- **tool 调用率 / tool 失败率**

### 11.3 RAG 指标

- 向量库 query 延迟分布
- Retrieve 命中的分数分布（低分比例高说明索引质量差）
- 重写 query 前后的检索结果变化（如果有 query rewrite）

## 十二、版本升级纪律

### 12.1 什么时候升

- eino 主仓库发 PATCH（`v0.8.x → v0.8.y`）：可无脑升
- 发 MINOR（`v0.8 → v0.9`）：看 CHANGELOG，通常要改少量代码
- 发 MAJOR（`v0 → v1`）：谨慎，阅读迁移指南

### 12.2 多 adapter 升级顺序

1. 先升 eino 主仓库
2. 升 ChatModel adapter（最关键路径）
3. 升 Embedder / Retriever / Indexer
4. 升 tool adapter

每升一层跑一遍 `go test ./...`。

### 12.3 源码阅读材料自身的维护

本系列所有源码引用都钉在 **v0.8.10**。eino 升级时：

1. 在 `index.md` 更新钉版本标签
2. 用 GitHub 的 "compare" 视图看 v0.8.10 → 新版本的差异
3. 对每个受影响文件更新行号引用
4. 新增的文件/API 补章节

## 十三、不要做的事

汇总本系列里反复强调的"地雷"：

1. ❌ 修改 Callback 的 Input/Output（数据竞争）
2. ❌ `BindTools` 并发使用（已废弃，用 `WithTools`）
3. ❌ 流式组件用默认 callback 时机（实现 `Checker`）
4. ❌ 忘记 Close 流（goroutine 泄漏）
5. ❌ 在 PreHandler 里再次调 `ProcessState`（死锁）
6. ❌ 把 State 存到工厂外的闭包（跨请求污染）
7. ❌ Transformer 里 `d.MetaData = ...`（应 merge）
8. ❌ `InitCallbackHandlers`（覆盖式——用 `AppendGlobalHandlers`）
9. ❌ 用 `_` 前缀的 MetaData key（框架保留）
10. ❌ 在 Tool 里 `return nil, err`（应回写错误给 LLM）
11. ❌ 在 Graph 里用 `"start"` / `"end"` 作节点名（保留名）
12. ❌ 依赖 Callback Handler 间的顺序
13. ❌ Indexer 与 Retriever 用不同 embedder
14. ❌ 空流式组件不实现 `TimingChecker`（每次调用都 Copy 流）

## 十四、推荐的代码风格

### 14.1 Graph 构造代码放在一个文件

```go
// agent/graph.go
func buildAgentGraph(deps Dependencies) (compose.Runnable[Input, Output], error) {
    g := compose.NewGraph[Input, Output](...)
    g.AddChatModelNode("llm", deps.Model)
    g.AddToolsNode("tools", deps.Tools)
    g.AddEdge(compose.START, "llm")
    g.AddBranch("llm", shouldCallTools)
    g.AddEdge("tools", "llm")
    g.AddEdge("llm", compose.END)
    return g.Compile(context.Background())
}
```

### 14.2 启动时 Compile，运行时复用

Compile 昂贵。生产代码应该：

- 启动时 compile 所有 Graph
- 把 Runnable 存到 struct field
- 每个请求直接调 `Invoke / Stream`

### 14.3 测试编排层：用 mock 组件

组件层是 IO 密集——测试图结构时**不要**连真模型。用 mock ChatModel（`internal/mock/` 里有 mock 生成的示例）让测试聚焦在 **"图的逻辑是否正确"**。

### 14.4 观察 Graph 的行为

- 使用 DevOps 工具（eino-debug）可视化
- 打印节点 RunInfo — 调试路由问题
- 实现 tracing handler 观察全链路
- `compose/introspect.go` 提供反射图结构的 API

## 十五、学习路径建议

如果你刚开始用 eino：

1. **跑通最小示例**：README 里的 ChatModel Invoke
2. **加一个 Chain**：Prompt + ChatModel
3. **升级到 Graph**：加 Tool、写一个 ReAct 循环
4. **接入 RAG**：Loader + Transformer + Indexer + Retriever
5. **可观测性**：加 tracing handler、metrics handler
6. **生产化**：State 管理、重试、限流、监控

每一步卡住时查对应的精读章节：

- 不懂 `Runnable` → [components-overview](./components-overview.md)
- 不懂流 → [stream](./stream.md)
- 不懂 Compile → [graph](./graph.md)
- 不懂 callback → [callback](./callback.md)
- 不懂字段映射 → [workflow](./workflow.md)

## 延伸阅读

- [Eino 源码阅读总览](./index.md)（入口）
- [架构与仓库结构](./architecture.md)（地图）
- [Graph：图编排核心](./graph.md) ⭐（最重要单篇）
- [Stream：流处理内部](./stream.md)（第二重要）
- [ext-adapters：eino-ext 适配器模式](./ext-adapters.md)
