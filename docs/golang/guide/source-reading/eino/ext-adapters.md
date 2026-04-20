---
title: Eino-ext 适配器模式
description: 精读 eino-ext 仓库布局、独立 go.mod 策略、典型适配器的文件分层（openai 为例），提炼为新 Provider 编写适配器的模板。
---

# Eino-ext 适配器模式

> 仓库：[`github.com/cloudwego/eino-ext`](https://github.com/cloudwego/eino-ext)
>
> 注：eino-ext 采用 **monorepo + 每个 adapter 独立 go.mod** 的结构。没有统一版本标签，每个 adapter 独立发版。

eino 主仓库只定义接口，所有 Provider 实现都在 eino-ext。本页回答三个问题：

1. eino-ext 的仓库组织是什么？
2. 典型适配器长什么样？
3. 怎么给一个新 Provider 写适配器？

## 一、仓库布局

```
eino-ext/
├── callbacks/             可插拔的 callback 实现（apmplus / cozeloop / langsmith 等）
├── components/            主要的组件适配器（按类型组织）
│   ├── document/          Loader / Transformer / Parser
│   ├── embedding/         ark / cache / dashscope / gemini / ollama / openai / qianfan / tencentcloud
│   ├── indexer/           es8 / milvus / redis / volc_vikingdb / ...
│   ├── model/             ark / arkbot / claude / deepseek / gemini / ollama / openai / openrouter / qianfan / qwen
│   ├── prompt/            自定义 ChatTemplate（如 DevOps 调试支持）
│   ├── retriever/         dify / es7 / es8 / es9 / milvus / qdrant / redis / volc_knowledge / ...
│   └── tool/              搜索 / 命令行 / 浏览器 / MCP 集成等
├── devops/                DevOps 工具（调试 UI）
└── libs/                  跨 adapter 共享的 utility
```

**每个 adapter 是独立 Go module**——有自己的 `go.mod`、`go.sum`、README。这带来：

- ✅ 用户只拉自己需要的 Provider，不背其他 SDK
- ✅ 每个 adapter 独立发版（如 `eino-ext/components/model/openai@v0.1.3`）
- ❌ 仓库内 adapter 要同步升级 eino 主仓库版本时繁琐

## 二、现有实现清单

### 2.1 `components/model`（ChatModel）

| Provider | 模块路径 | 适用 |
| --- | --- | --- |
| `openai` | `eino-ext/components/model/openai` | OpenAI + 兼容 API（如 Azure / Groq） |
| `claude` | `.../claude` | Anthropic Claude |
| `gemini` | `.../gemini` | Google Gemini |
| `ark` | `.../ark` | 字节火山引擎 |
| `arkbot` | `.../arkbot` | 火山 Bot 平台 |
| `qwen` | `.../qwen` | 阿里通义千问（DashScope） |
| `qianfan` | `.../qianfan` | 百度千帆 |
| `deepseek` | `.../deepseek` | DeepSeek |
| `openrouter` | `.../openrouter` | OpenRouter 聚合 |
| `ollama` | `.../ollama` | 本地 Ollama |

### 2.2 `components/embedding`（Embedder）

`ark`、`cache`（装饰器）、`dashscope`、`gemini`、`ollama`、`openai`、`qianfan`、`tencentcloud`

### 2.3 `components/retriever`

`dify`、`es7`、`es8`、`es9`（三版 ES）、`milvus`、`milvus2`、`opensearch2`、`opensearch3`、`qdrant`、`redis`、`volc_knowledge`、`volc_vikingdb`

### 2.4 `components/indexer`

与 retriever 大致对偶：`milvus` / `es8` / `redis` / `volc_vikingdb` / `tencentvectordb` 等

### 2.5 `components/document`

Loader（`file`、`url`、`s3`）、Parser（`pdf`、`html`、`docx`）、Transformer（`markdown`、`recursive`、`size`）

### 2.6 `components/tool`

典型工具：`duckduckgo`、`googlesearch`、`wikipedia`、`bash`、`browseruse`（浏览器自动化）、`mcp`（连 MCP Server）、`sequentialthinking` 等

### 2.7 `components/prompt`

基本为空——主仓库的 `DefaultChatTemplate` 已足够，少数场景才需要扩展（如 DevOps 集成）。

## 三、典型 adapter 的文件分层（以 openai 为例）

```
components/model/openai/
├── README.md              英文说明
├── README_zh.md           中文说明
├── go.mod / go.sum        独立模块
├── types.go       1.9 KB  Config 结构、类型定义
├── option.go      3.0 KB  调用级 Option 定义
├── chatmodel.go  10.5 KB  ChatModel 实现主体
├── chatmodel_test.go      单元测试
```

四块清晰分离：

### 3.1 `types.go`：Config

```go
type Config struct {
    APIKey   string
    BaseURL  string
    Model    string
    // ... 其他构造期配置
}
```

### 3.2 `option.go`：调用级选项

```go
type option struct {
    topP *float32
    // ...
}

func WithTopP(p float32) model.Option { /* ... */ }
```

### 3.3 `chatmodel.go`：核心实现

```go
type ChatModel struct {
    client *openai.Client
    cfg    Config
    tools  []*schema.ToolInfo
}

func NewChatModel(ctx context.Context, cfg Config) (*ChatModel, error) { /* ... */ }

func (c *ChatModel) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error)
func (c *ChatModel) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error)
func (c *ChatModel) WithTools(tools []*schema.ToolInfo) (model.ToolCallingChatModel, error)  // 推荐
func (c *ChatModel) GetType() string { return "OpenAI" }
func (c *ChatModel) IsCallbacksEnabled() bool { return true }  // 流式场景通常接管
```

### 3.4 `chatmodel_test.go`

按 mock Provider 响应做单元测试。**这对用户有双重价值**：

- 可以跑 `go test ./...` 验证安装正确
- 作为**使用示例**比 README 权威

## 四、适配器的共同模式

### 4.1 ChatModel 适配器的六步套路

1. **Config + NewXxx 构造函数**
2. **Convert(input → Provider Request)**：把 `[]*schema.Message` 转 Provider 格式
3. **Generate**：调 Provider → Convert(response → `*schema.Message`)
4. **Stream**：调 Provider SSE → `schema.Pipe` → goroutine 消费 SSE，逐 chunk Send
5. **WithTools / BindTools**：前者推荐（返回新实例），后者 Deprecated
6. **可选**：GetType、IsCallbacksEnabled、自己触发 callback

### 4.2 Retriever 适配器的五步套路

1. Config + 构造
2. 注入 embedder（必须与 Indexer 共用）
3. `Retrieve`：query → `embedder.EmbedStrings([q])` → 后端 search → 转 `[]*Document`
4. 过滤：按 `WithScoreThreshold` 剔除
5. 每个 Document 调 `WithScore` 写入相关性

### 4.3 Indexer 适配器的五步套路

1. Config + 构造（含 embedder）
2. `Store`：遍历 docs，没向量的调 embedder 批量嵌入
3. 调后端 upsert
4. 收集后端分配的 IDs
5. 返回有序 ids（对齐 docs）

## 五、独立 go.mod 的好处与代价

### 5.1 好处

- **依赖隔离**：用户项目只引入需要的 Provider SDK
- **独立发版**：OpenAI 适配器有 bug fix 不影响其他 adapter
- **快速迭代**：改 ark 不必跑 openai 的测试

### 5.2 代价

- **版本对齐难**：所有 adapter 依赖 `cloudwego/eino v0.x`，主仓库升级时需要逐个升
- **monorepo 工具需适配**：`go test ./...` 不穿越子模块边界
- **文档分散**：每个 adapter 的 README 要单独维护

## 六、为新 Provider 写适配器：实操模板

以添加"某云 LLM"为例。步骤：

### 6.1 目录结构

```
eino-ext/components/model/somecloud/
├── go.mod
├── types.go
├── option.go
├── chatmodel.go
└── chatmodel_test.go
```

### 6.2 `go.mod`

```go
module github.com/cloudwego/eino-ext/components/model/somecloud

go 1.21

require (
    github.com/cloudwego/eino v0.8.10
    github.com/somecloud/sdk-go v1.2.3
)
```

### 6.3 `types.go`

```go
package somecloud

type Config struct {
    APIKey    string
    Endpoint  string
    Model     string  // 默认模型
    Timeout   time.Duration
}
```

### 6.4 `option.go`

```go
package somecloud

import "github.com/cloudwego/eino/components/model"

type options struct {
    topP *float32
}

func WithTopP(p float32) model.Option {
    return model.WrapImplSpecificOptFn[options](func(o *options) { o.topP = &p })
}

func GetImplSpecificOptions(base options, opts ...model.Option) options {
    return model.GetImplSpecificOptions(&base, opts...)
}
```

### 6.5 `chatmodel.go` 主体

```go
package somecloud

import (
    "context"
    "github.com/cloudwego/eino/components/model"
    "github.com/cloudwego/eino/schema"
    "github.com/somecloud/sdk-go"
)

type ChatModel struct {
    client *sdk.Client
    cfg    Config
    tools  []*schema.ToolInfo
}

func NewChatModel(ctx context.Context, cfg Config) (*ChatModel, error) {
    c, err := sdk.NewClient(cfg.APIKey, sdk.WithEndpoint(cfg.Endpoint))
    if err != nil { return nil, err }
    return &ChatModel{client: c, cfg: cfg}, nil
}

func (m *ChatModel) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error) {
    req := m.convertRequest(input, opts)
    resp, err := m.client.Chat(ctx, req)
    if err != nil { return nil, err }
    return m.convertResponse(resp), nil
}

func (m *ChatModel) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) {
    req := m.convertRequest(input, opts)
    reader, writer := schema.Pipe[*schema.Message](16)
    go func() {
        defer writer.Close()
        err := m.client.ChatStream(ctx, req, func(chunk *sdk.Chunk) bool {
            msg := m.convertChunk(chunk)
            return !writer.Send(msg, nil)  // writer.Send 返回 true 表示 closed
        })
        if err != nil { writer.Send(nil, err) }
    }()
    return reader, nil
}

func (m *ChatModel) WithTools(tools []*schema.ToolInfo) (model.ToolCallingChatModel, error) {
    newM := *m             // 浅拷贝
    newM.tools = tools
    return &newM, nil
}

func (m *ChatModel) GetType() string            { return "SomeCloud" }
func (m *ChatModel) IsCallbacksEnabled() bool   { return true }

// ---- 内部 ----

func (m *ChatModel) convertRequest(input []*schema.Message, opts []model.Option) *sdk.ChatRequest { /* ... */ }
func (m *ChatModel) convertResponse(resp *sdk.Response) *schema.Message { /* ... */ }
func (m *ChatModel) convertChunk(chunk *sdk.Chunk) *schema.Message { /* ... */ }
```

### 6.6 测试

- 对 `convertRequest` / `convertResponse` 做 **纯转换测试**——无需真调 Provider
- Mock 一个 `sdk.Client` 做**端到端测试**——覆盖流式、工具调用

## 七、Provider 能力差异的处理

不同 Provider 能力差异大：

| 能力 | OpenAI | Claude | Gemini | 国内 Provider |
| --- | --- | --- | --- | --- |
| 工具调用 | ✅ | ✅ | ✅ | 大多数 ✅ |
| JSON mode | ✅ | ❌ | ✅（schema） | 部分 |
| 图像输入 | ✅ | ✅ | ✅ | 部分 |
| 音频输入 | ✅ | ❌ | ✅ | 少数 |
| 结构化输出（`response_format.json_schema`） | ✅ | ❌ | ✅ | 部分 |
| 流式工具调用 | ✅ | 部分 | ✅ | 部分 |

**适配器实现策略**：

- **能力对齐**：Provider 支持 → eino 接口支持
- **能力缺失**：Provider 不支持的功能，在 `Generate`/`Stream` 开头就返回明确错误（而不是静默忽略）
- **能力增强**：Provider 独有能力通过自定义 `Option` 暴露（如 `openai.WithResponseFormat(...)`）

## 八、Rate Limit 与重试

eino 接口**不要求**适配器做重试。但生产实践里，**每个适配器自己内置**：

- 按 HTTP 429 / 超时做指数退避（3-5 次）
- 并发限制（`sync.Semaphore` 或 `golang.org/x/sync/semaphore`）
- Prometheus 埋点

这些都是 Provider SDK 或 adapter 层的职责，不要让用户写。

## 九、callback 的精细控制

ChatModel 适配器常实现 `IsCallbacksEnabled() = true`，自己管 callback 时机：

```go
func (m *ChatModel) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) {
    ctx = callbacks.EnsureRunInfo(ctx, m.GetType(), components.ComponentOfChatModel)
    ctx = callbacks.OnStart(ctx, &model.CallbackInput{Messages: input, Config: /* ... */})

    reader, writer := schema.Pipe[*schema.Message](16)
    go func() {
        defer writer.Close()
        // ... 调 Provider，拿到 chunks
        // 首 token 到达时：可以触发 "first token" 自定义 callback
        // 所有 chunks Send 完后：触发 OnEnd
        callbacks.OnEnd(ctx, &model.CallbackOutput{/* 汇总消息 */})
    }()
    return reader, nil
}
```

这让流式场景的 `OnEnd` 触发时机真正对应**流结束**，而非**方法返回**。

## 十、版本对齐策略

eino 主仓库发版（如 `v0.8.10`）后，eino-ext 里各个 adapter 需要：

1. 升级 `go.mod` 里的 `eino` 版本
2. 跑 test 确保没 break
3. Adapter 自己发新 tag（`components/model/openai/v0.1.4`）

**谁负责升级**：通常 CloudWeGo 团队会在主仓库发版时同步维护核心 adapter（openai / ark / claude）；社区贡献的 adapter（如某些小众 Provider）可能滞后几个版本。

## 十一、第三方贡献适配器的建议

若想贡献一个新 adapter：

1. **开独立分支**（不是 fork）
2. **起独立 Go module** — 不要碰其他 adapter
3. **README 中英双版** — 社区惯例
4. **测试覆盖** — 至少核心 convert 函数的单元测试
5. **示例可运行** — 在 README 里放一个最小示例 + 预期输出
6. **提 PR 前跑过 `go vet` / `golangci-lint`**

## 十二、自定义 adapter 的交付路径

不一定非要进 eino-ext 仓库——公司内部可以**自己维护 adapter**：

```
my-company/llm-providers-eino/
└── internal/
    └── someprivatellm/
        ├── go.mod   -- module my-company/.../someprivatellm
        │                require github.com/cloudwego/eino v0.8.10
        ├── chatmodel.go
        └── ...
```

用 Go module 的方式引入，跟公共 adapter 用法完全一致。

## 十三、最佳实践汇总

1. **每个 adapter 独立 go.mod**
2. **文件分层**：types.go / option.go / xxxmodel.go + 测试
3. **convertRequest / convertResponse 作为纯函数**——便于单测
4. **流式实现用 `schema.Pipe`**，goroutine 负责 `defer Close` + 监听 ctx
5. **WithTools 优先**，BindTools 仅保留兼容
6. **GetType / IsCallbacksEnabled 该实现就实现**
7. **Provider 能力不匹配 → 明确返回 error**
8. **重试与限流内置**，用户无感
9. **Provider 独有能力用自定义 Option 暴露**
10. **版本升级保持纪律**：eino 发版，adapter 跟进

## 延伸阅读

- [ChatModel：模型调用](./chatmodel.md)（三代接口演化、WithTools 模式）
- [Retriever：检索器](./retriever.md)
- [Indexer：索引器](./indexer.md)
- [Embedding：向量化](./embedding.md)
- [Document：文档加载与切分](./document.md)
- [Callback：回调机制](./callback.md)
- [Tool：工具调用](./tool.md)
