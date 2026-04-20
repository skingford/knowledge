---
title: Eino Tool：工具调用
description: 精读 eino v0.8.10 components/tool：BaseTool/InvokableTool/StreamableTool/EnhancedInvokableTool/EnhancedStreamableTool 五种接口，schema.ToolInfo/ParamsOneOf/ToolChoice 元信息。
---

# Eino Tool：工具调用

> 源码路径：
> - [`components/tool/interface.go`](https://github.com/cloudwego/eino/blob/v0.8.10/components/tool/interface.go)
> - [`schema/tool.go`](https://github.com/cloudwego/eino/blob/v0.8.10/schema/tool.go)
> - [`compose/tool_node.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/tool_node.go)（38 KB —— ToolsNode 是**仓库最大单文件**）

Tool 是 agent 与真实世界交互的接口。eino v0.8.10 一共提供 **五种** Tool 接口，覆盖 "是否流式 / 是否多模态" 两个维度。

## 一、五种接口总览

```
                  纯文本              多模态（ToolArgument / ToolResult）
 同步（阻塞）       InvokableTool       EnhancedInvokableTool
 流式              StreamableTool      EnhancedStreamableTool
                  ── 所有都继承 ──
                    BaseTool （只暴露 Info）
```

选择指南：

| 场景 | 选 |
| --- | --- |
| 传统 API 调用（返回 JSON 字符串） | `InvokableTool` |
| 返回大量数据（如 DB 查询）需流式 | `StreamableTool` |
| 返回图片/音频/文件（多模态） | `EnhancedInvokableTool` |
| 多模态 + 流式（如实时视频帧分析） | `EnhancedStreamableTool` |
| 只暴露给 ChatModel 让它决定怎么调，自己不执行 | `BaseTool` |

## 二、BaseTool（`interface.go:32-34`）

```go
type BaseTool interface {
    Info(ctx context.Context) (*schema.ToolInfo, error)
}
```

只返回元信息。注释（`interface.go:29-31`）：

> "BaseTool alone is sufficient when passing tool definitions to a ChatModel via WithTools — the model only needs the schema to generate tool calls."

典型场景：把 tool 定义给 ChatModel **仅用于提示模型**，实际调用你自己在业务层做。

## 三、InvokableTool（`interface.go:42-47`）

```go
type InvokableTool interface {
    BaseTool
    InvokableRun(ctx context.Context, argumentsInJSON string, opts ...Option) (string, error)
}
```

**输入输出全是 string**——其中 `argumentsInJSON` 是 LLM 生成的**原始 JSON 字符串**（还没反序列化），返回值是回给 LLM 的 tool message 内容。

### 3.1 为什么是 JSON string 而非强类型？

这是与 OpenAI Chat Completions 协议对齐的结果：模型生成的 `ToolCall.Function.Arguments` 就是 JSON 字符串。框架不强制 tool 作者怎么反序列化：

- 直接 `json.Unmarshal` 到自定义 struct → 灵活
- 用 `utils.InferTool` → 框架自动反序列化 + 类型约束

### 3.2 `utils.InferTool`（仓库的 `utils/tool_utils.go`）

可以把 Go 函数直接升级成 Tool：

```go
type SearchArgs struct {
    Query string `json:"query" jsonschema:"required,description=search query"`
    TopK  int    `json:"top_k" jsonschema:"minimum=1,maximum=20"`
}

func searchImpl(ctx context.Context, args *SearchArgs) (string, error) {
    // 业务逻辑
}

tool, _ := utils.InferTool("search", "Search knowledge base", searchImpl)
// tool 是 InvokableTool，自动：
// - Info 来自 jsonschema struct tag
// - InvokableRun 内部 json.Unmarshal 到 SearchArgs
```

这是**日常首选**——避免手写 Info + 手写反序列化。

## 四、StreamableTool（`interface.go:53-57`）

```go
type StreamableTool interface {
    BaseTool
    StreamableRun(ctx context.Context, argumentsInJSON string, opts ...Option) (
        *schema.StreamReader[string], error)
}
```

差别：返回 `*StreamReader[string]`。chunk 也是字符串。

注释（`interface.go:51-52`）：

> "The caller (ToolsNode) is responsible for closing the reader."

ToolsNode（下面第八节）帮忙 Close；若在 Lambda 里直接调用就要自己 Close。

## 五、EnhancedInvokableTool（`interface.go:67-70`）

```go
type EnhancedInvokableTool interface {
    BaseTool
    InvokableRun(ctx context.Context,
        toolArgument *schema.ToolArgument,
        opts ...Option,
    ) (*schema.ToolResult, error)
}
```

**两个差别**：

- 输入 `*schema.ToolArgument`（不是 JSON 字符串）
- 输出 `*schema.ToolResult` —— 可以携带 text / image / audio / video / file

当**同时实现**标准接口与 Enhanced 接口时，注释（`interface.go:65-66`）：

> "ToolsNode prioritises the enhanced interface."

ToolsNode 优先走 Enhanced 路径。

## 六、EnhancedStreamableTool（`interface.go:76-79`）

```go
type EnhancedStreamableTool interface {
    BaseTool
    StreamableRun(ctx context.Context,
        toolArgument *schema.ToolArgument,
        opts ...Option,
    ) (*schema.StreamReader[*schema.ToolResult], error)
}
```

流 + 多模态的组合，真实用例：实时生成图片的每帧、音频的每段。

## 七、ToolInfo：给 ChatModel 的元信息（`schema/tool.go:66-81`）

```go
type ToolInfo struct {
    Name  string
    Desc  string
    Extra map[string]any
    *ParamsOneOf
}
```

### 7.1 Name 与 Desc 的重要性

- **Name**：在 tool set 里唯一；模型用它来 "声明我要调这个工具"
- **Desc**：告诉模型**何时、为什么**用这个工具——注释里直接建议加 few-shot 示例：

> "Desc should explain when and why to use the tool; few-shot examples in Desc significantly improve model accuracy."

### 7.2 ParamsOneOf（`schema/tool.go:100-120`）

```go
type ParamsOneOf struct {
    params     map[string]*ParameterInfo
    jsonschema *jsonschema.Schema
}
```

参数 schema **二选一**：

1. **`NewParamsOneOfByParams`** — 轻量 map，覆盖标量 / 数组 / 嵌套对象 / enum / required
2. **`NewParamsOneOfByJSONSchema`** — 完整 `*jsonschema.Schema`（JSON Schema 2020-12）；需要 anyOf / oneOf / $defs 时必须

**`utils.InferTool`** 从 struct tag 生成的是第二种。

### 7.3 ParameterInfo（`schema/tool.go:85-98`）

```go
type ParameterInfo struct {
    Type      DataType
    ElemInfo  *ParameterInfo  // 只对 array 有效
    SubParams map[string]*ParameterInfo  // 只对 object 有效
    Desc      string
    Enum      []string  // 只对 string 有效
    Required  bool
}
```

树形结构，可嵌套。

### 7.4 `DataType`（`schema/tool.go:28-38`）

```go
const (
    Object  DataType = "object"
    Number  DataType = "number"
    Integer DataType = "integer"
    String  DataType = "string"
    Array   DataType = "array"
    Null    DataType = "null"
    Boolean DataType = "boolean"
)
```

七种 JSONSchema 类型。`Null` 少用，通常只在 `nullable` 场景。

## 八、ToolsNode：并行执行 + 结果回写

`compose/tool_node.go`（38 KB —— 仓库最大单文件）封装 "收到 LLM 的 ToolCall 列表 → 并行调用多个 tool → 返回 N 条 `Role=Tool` 消息" 这一整套逻辑。

### 8.1 典型 agent 循环

```
START ─ ChatTemplate ─ ChatModel ─┬─ ToolsNode ─ ChatModel（下一轮）
                                  │
                                  └─ END（无 ToolCall 时）
```

`AddToolsNode("tools", toolsNode)` 加入 Graph，用 `AddBranch` 在 ChatModel 后面判断 "有没有 ToolCall"。

### 8.2 并行调用

ToolsNode 对 LLM 返回的**每个** ToolCall 并发执行——每个 tool 一个 goroutine。成功的结果被 wrap 成 `*schema.Message{Role: Tool, ToolCallID: "call_xxx", Content: "..."}`。

### 8.3 流式场景

若某个 tool 是 `StreamableTool`，ToolsNode 会把该 tool 的 StreamReader **打包进 Message 的 Content**——下游 ChatModel 可能需要先聚合。

### 8.4 错误处理

一个 tool 失败不影响其他 tool。失败的结果被写入 `Content` 作为 error message 回给 LLM，让模型决定重试或换方案。

## 九、ToolChoice（`schema/tool.go:44-59`）

通过 `model.WithToolChoice(...)` 传给 ChatModel：

```go
const (
    ToolChoiceForbidden ToolChoice = "forbidden"  // 禁止调用任何 tool（等同"none"）
    ToolChoiceAllowed   ToolChoice = "allowed"    // 由模型决定（默认，等同"auto"）
    ToolChoiceForced    ToolChoice = "forced"     // 必须调用至少一个 tool（等同"required"）
)
```

**`Forced` 的主要用法**：强制 LLM 用工具做**结构化输出**——把一个 Tool 设计成 "接受结构化字段"，迫使模型返回结构化数据。

## 十、自定义 Tool 的两条路径

### 10.1 快速：`utils.InferTool`

```go
type WeatherArgs struct {
    City string `json:"city" jsonschema:"required,description=City name"`
    Unit string `json:"unit,omitempty" jsonschema:"enum=C,enum=F,default=C"`
}

func getWeather(ctx context.Context, args *WeatherArgs) (string, error) {
    data, err := weatherAPI.Query(ctx, args.City, args.Unit)
    if err != nil { return "", err }
    return fmt.Sprintf("Weather in %s: %s, %d°%s", args.City, data.Summary, data.Temp, args.Unit), nil
}

tool, _ := utils.InferTool("get_weather", "Query current weather for a city", getWeather)
```

好处：省掉 Info 声明、省掉 JSON 反序列化、类型安全。

### 10.2 手写：实现 InvokableTool 接口

```go
type WeatherTool struct{ apiKey string }

func (t *WeatherTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
    return &schema.ToolInfo{
        Name: "get_weather",
        Desc: "Query current weather for a city",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "city": {Type: schema.String, Desc: "City name", Required: true},
            "unit": {Type: schema.String, Desc: "Temperature unit", Enum: []string{"C", "F"}},
        }),
    }, nil
}

func (t *WeatherTool) InvokableRun(ctx context.Context, arguments string, _ ...tool.Option) (string, error) {
    var args struct{ City, Unit string }
    if err := json.Unmarshal([]byte(arguments), &args); err != nil { return "", err }
    // 业务调用
    return result, nil
}

func (t *WeatherTool) GetType() string { return "Weather" }  // 可选
```

**何时手写**：需要动态 schema（非编译期）、需要在 Info 里做鉴权检查、或框架 jsonschema 推导不支持你的类型。

## 十一、边界与陷阱

### 11.1 `arguments` 解析失败

LLM 偶尔返回**非法 JSON**（语法错误或字段类型不符）。解决：在 `InvokableRun` 里 `json.Unmarshal` 失败时返回 "Error: invalid arguments" 作为 tool message —— LLM 下一轮会自动纠正。

### 11.2 Tool 名字冲突

同一 ToolsNode 里两个 tool 同名 → ToolsNode 会报错。解决：**命名空间前缀**（如 `db.query`、`http.get`）。

### 11.3 无参数 Tool

`ParamsOneOf == nil` 表示 tool 不接受参数。LLM 会生成空 arguments JSON `{}`。

### 11.4 Tool 调用超时

默认 ToolsNode **不加超时**。必须自己在 ctx 上加 deadline，或在 tool 内部用 `context.WithTimeout` 保护下游调用。

### 11.5 副作用型 Tool 的幂等性

LLM 可能在同一轮对话里**重复调用**同一个 tool（幻觉）。写数据库、发邮件等副作用型 tool 要自己做幂等 —— 通常用 `ToolCall.ID` 作为 dedup key。

### 11.6 Enhanced 接口与 OpenAI 兼容性

Enhanced 接口用的 `ToolResult` 是 eino 自定义结构。Provider 端（OpenAI / Ark）的适配器需要能把 `ToolResult` 转成 Provider 协议。v0.8.10 阶段建议：**在 Enhanced 之前，确认你的 Provider 适配器支持**。

## 十二、最佳实践

1. **能用 `utils.InferTool` 就用**——手写 Info 容易出错
2. **Desc 里写 few-shot**——这是提升模型 tool 选择准确率的最大杠杆
3. **参数用 `required` 明确**——否则 LLM 可能遗漏
4. **返回值简洁**——tool message 会塞进下一轮 prompt，过长会吃 token
5. **错误回写到 tool message**，别直接 return error —— 让 LLM 有机会自我纠错
6. **多模态用 Enhanced 系列**，但先核对 Provider 支持
7. **超时 + 重试**放在 tool 内部，ToolsNode 只负责并发调度

## 延伸阅读

- [ChatModel：模型调用](./chatmodel.md)
- [schema：消息与流](./schema.md)（ToolCall / FunctionCall）
- [Graph：图编排核心](./graph.md)（AddToolsNode）
- [eino-ext 适配器模式](./ext-adapters.md)
