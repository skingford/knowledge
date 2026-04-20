---
title: Eino ChatTemplate：提示模板
description: 精读 eino v0.8.10 components/prompt 包：ChatTemplate 接口、DefaultChatTemplate 实现、FromMessages 构造、三种模板语法（FString/GoTemplate/Jinja2）及其 callback 行为。
---

# Eino ChatTemplate：提示模板

> 源码路径：[`github.com/cloudwego/eino/components/prompt@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/components/prompt)
>
> 主要文件：`interface.go`、`chat_template.go`、`option.go`

ChatTemplate 是 LLM 应用中最朴素的组件：**把变量 map 渲染成一串消息**。本页要看清它的四件事：

1. 接口只有一个方法：`Format`
2. 默认实现（`DefaultChatTemplate`）支持三种模板语法
3. 它是**内置实现了 callback 的** ——与 ChatModel 不同
4. 在 Graph 中的位置与常见陷阱

## 一、接口（`components/prompt/interface.go:42-44`）

```go
type ChatTemplate interface {
    Format(ctx context.Context, vs map[string]any, opts ...Option) ([]*schema.Message, error)
}
```

就这一个方法：

- **输入**：`map[string]any`（变量集）
- **输出**：`[]*schema.Message`（渲染后的消息列表）
- 没有 `Stream` / `Collect` / `Transform`——模板渲染是纯 CPU 操作，流式没意义

注释里（`interface.go:33-35`）有一条重要约定：

> "Variable keys present in the template but absent from vs produce a runtime error — there is no compile-time safety."

变量**缺失**是运行时 error，不是编译时。这是模板语法的天然限制。

## 二、DefaultChatTemplate（`chat_template.go:27-32`）

```go
type DefaultChatTemplate struct {
    templates  []schema.MessagesTemplate
    formatType schema.FormatType
}
```

两个字段：

- `templates` — 消息模板列表（可能是纯消息、也可能是 `schema.MessagesPlaceholder` 占位符）
- `formatType` — 渲染语法（FString / GoTemplate / Jinja2）

构造时固定，后续不可变。

## 三、FromMessages：构造模板（`chat_template.go:41-46`）

```go
func FromMessages(
    formatType schema.FormatType,
    templates ...schema.MessagesTemplate,
) *DefaultChatTemplate {
    return &DefaultChatTemplate{
        templates:  templates,
        formatType: formatType,
    }
}
```

典型用法：

```go
tpl := prompt.FromMessages(schema.FString,
    schema.SystemMessage("You are a helpful assistant specialised in {domain}."),
    schema.MessagesPlaceholder("history", true),
    schema.UserMessage("{question}"),
)

msgs, err := tpl.Format(ctx, map[string]any{
    "domain":   "Go programming",
    "history":  []*schema.Message{ /* 历史对话 */ },
    "question": "What is goroutine leak?",
})
```

### 三种模板语法（回顾 schema）

详见 [schema](./schema.md#三三种模板语法)：

| 语法 | 占位符风格 | 引擎 |
| --- | --- | --- |
| `schema.FString` | `{name}` | `github.com/slongfield/pyfmt` |
| `schema.GoTemplate` | <code v-pre>{{.Name}}</code> | 标准库 `text/template` |
| `schema.Jinja2` | <code v-pre>{{ name \| upper }}</code> | `github.com/nikolalohinski/gonja` |

**选择建议**：

- 无过滤器、纯替换 → `FString`（最轻）
- 需要 if/range → `GoTemplate`（无外部依赖）
- 需要过滤器、已有 Python 模板资产 → `Jinja2`

## 四、MessagesPlaceholder：历史消息的占位

eino 的消息列表里允许混入**占位符节点**：

```go
schema.MessagesPlaceholder("history", true)
```

- 第一个参数是变量名
- 第二个是 `optional`：true 时若变量缺失就跳过、不报错

运行时 `vs["history"]` 必须是 `[]*schema.Message` 类型——占位符会被**展开成多个消息插入到这个位置**，而不是渲染为字符串。这是 Chain Chat 场景的关键：系统消息 + 历史消息 + 用户消息，三段式组装。

## 五、Format 方法内部（`chat_template.go:49-76`）

```go
func (t *DefaultChatTemplate) Format(
    ctx context.Context, vs map[string]any, _ ...Option,
) (result []*schema.Message, err error) {
    ctx = callbacks.EnsureRunInfo(ctx, t.GetType(), components.ComponentOfPrompt)
    ctx = callbacks.OnStart(ctx, &CallbackInput{Variables: vs, Templates: t.templates})
    defer func() {
        if err != nil { _ = callbacks.OnError(ctx, err) }
    }()

    result = make([]*schema.Message, 0, len(t.templates))
    for _, template := range t.templates {
        msgs, err := template.Format(ctx, vs, t.formatType)
        if err != nil { return nil, err }
        result = append(result, msgs...)
    }

    _ = callbacks.OnEnd(ctx, &CallbackOutput{Result: result, Templates: t.templates})
    return result, nil
}
```

### 5.1 自己触发 callback

注意 DefaultChatTemplate **自己调用** `callbacks.OnStart / OnEnd / OnError`——不依赖框架自动包装。这配合它的 Checker 实现：

```go
func (t *DefaultChatTemplate) IsCallbacksEnabled() bool { return true }
```

框架会 "放弃自动包装"（见 [components-overview](./components-overview.md#八checker接管-callback-时机)），由组件自己决定 callback 的时机。

### 5.2 为什么自己管？

因为模板渲染是**同步 + 确定性**的，但 CallbackInput 里需要 `Variables` 和 `Templates` 字段——这两个只有 DefaultChatTemplate 知道怎么填。若走框架自动包装，CallbackInput 会退化成通用的 "input any"，丢失业务语义。

### 5.3 一个小遗漏

源码里 `for _, template := range t.templates` 内部使用了 `err` 作为局部变量（`if err != nil { return nil, err }`），**而非 method 级**的 `err` ——所以 defer 里的 `OnError` 不会被触发。这里的 callback 路径只覆盖了 "Format 外层失败" 的情况。

## 六、GetType（`chat_template.go:79-81`）

```go
func (t *DefaultChatTemplate) GetType() string { return "Default" }
```

在 DevOps 工具里显示为 `"DefaultChatTemplate"`（组件类别是 `ChatTemplate`）。

## 七、在 Graph 里的定位

典型 Chain：

```
START ─ ChatTemplate ─ ChatModel ─ END
```

输入类型 `map[string]any`，输出类型 `[]*schema.Message` —— 正是 ChatModel 的输入。

### 7.1 上游不是 map 的情况

如果 Chain 的入口接受的不是 map，需要在 ChatTemplate 前加一个转换层：

- **Lambda**：`InvokableLambda[string, map[string]any](...)` 把 string 塞进 map
- **compose.WithOutputKey(key)**：把上游的标量输出包成 `{key: value}` map —— 见 `compose/graph_add_node_options.go`

## 八、自定义 ChatTemplate 的模板

多数场景 `DefaultChatTemplate` 就够用。真有特殊需求（外部模板引擎、数据库驱动的模板、多语言切换）才需要自定义：

```go
type DBTemplate struct {
    db      Repository
    tplName string
}

func (t *DBTemplate) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
    tpl, err := t.db.GetTemplate(ctx, t.tplName)
    if err != nil { return nil, err }
    return t.render(tpl, vs)
}

func (t *DBTemplate) GetType() string { return "DB" }
// 可选：实现 IsCallbacksEnabled 接管 callback 时机
```

## 九、Option（`components/prompt/option.go`）

Prompt 的 Option 相对简单（主要是拓展点占位）。调用级 option 通过 `compose.Option.WithPromptOption(...)` 透传。

## 十、边界与陷阱

### 10.1 缺失变量

`Format` 触发未定义变量的运行时 error。`FString` 是 `KeyError`，`GoTemplate` 是 `"map has no entry for key"`，`Jinja2` 是 `"variable undefined"`。**解决**：在上游 Lambda 里显式兜底，或用 Jinja2 的 `default` 过滤器。

### 10.2 Placeholder 变量类型错

`vs["history"]` 必须是 `[]*schema.Message`。如果传 string 或 nil（非 optional 占位符）会报错。

### 10.3 模板字符串里混淆语法

典型：在 `FString` 模板里写了 <code v-pre>{{.Name}}</code>（那是 GoTemplate 语法）——不会报错但也不会被渲染，原样留在输出里。**规范**：一个 Template 只用一种语法，跨语法需要多个 Template 拼接。

### 10.4 "safe" 过滤器的缺失

`Jinja2` 默认对 HTML 自动转义（如果用了 HTML 安全扩展）——LLM prompt 里一般不希望这行为。确保用 raw 输出。

### 10.5 历史消息过长

Placeholder 不做截断。超长 history 直接塞进 LLM 会超 token 限制。**规范**：在 ChatTemplate 前加一个 Lambda 做 history 截断/摘要。

### 10.6 模板每次都重新解析

当前实现（v0.8.10）每次 `Format` 都重新解析模板字符串。高 QPS 场景建议**包一层缓存**：解析后的 AST 用 `sync.Map` 存。

## 十一、最佳实践

1. **优先用 `FromMessages` + `FString`** —— 最简单、零依赖
2. **System/Placeholder/User 三段式**是 chat 场景的通用结构
3. **可选 placeholder**用 `true` 参数，避免首轮对话因无 history 而报错
4. **自定义实现 Typer**，DevOps 工具里好定位
5. **ChatTemplate 之后几乎都接 ChatModel** —— 这是标准模式，不必想复杂了

## 延伸阅读

- [ChatModel：模型调用](./chatmodel.md)
- [schema：消息与流](./schema.md)（FormatType / MessagesTemplate 细节）
- [components：组件抽象总览](./components-overview.md)
- [Chain：链式编排](./chain.md)
