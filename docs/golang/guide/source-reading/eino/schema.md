---
title: Eino schema：消息与流
description: 精读 eino v0.8.10 schema 包：Message / RoleType / ToolCall 的消息模型，以及 StreamReader/StreamWriter 基于 channel 的流式实现。
---

# Eino schema：消息与流

> 源码路径：[`github.com/cloudwego/eino/schema@v0.8.10`](https://github.com/cloudwego/eino/tree/v0.8.10/schema)

`schema` 是 eino 依赖树的**最底层**：它不依赖任何其他 eino 包（除 `internal/`），所有上层（`components` / `compose` / `flow`）都直接或间接使用它。读懂 schema，是理解 eino 的第一块拼图。

## 一、包结构

```
schema/
├── doc.go              包注释与示例
├── document.go         Document 类型（RAG 语料抽象）
├── message.go          65 KB —— 消息模型、多模态、模板、流拼接
├── message_parser.go   响应体解析（把 LLM 原始输出塞回 Message）
├── select.go           Select：从 []*Message 选一个（给 ChatTemplate 用）
├── serialization.go    自定义 gob/json 适配
├── stream.go           23 KB —— StreamReader / StreamWriter / Pipe / Copy / Merge
└── tool.go             ToolInfo / ParamsOneOf（工具元信息）
```

> 注意 `message.go` 是整个仓库里**最大的单一文件**（65 KB），因为消息模型要覆盖：文本 / 图像 / 音频 / 视频 / 文件 / 推理内容 / 工具调用 / 流式片段拼接 / 三种模板语法（FString / GoTemplate / Jinja2）。

## 二、RoleType 与 Message

### 2.1 RoleType（`schema/message.go:63-74`）

```go
type RoleType string

const (
    Assistant RoleType = "assistant"
    User      RoleType = "user"
    System    RoleType = "system"
    Tool      RoleType = "tool"
)
```

四种角色对齐 OpenAI Chat Completions 风格，是所有 ChatModel 适配器都必须遵守的约定。

### 2.2 FunctionCall 与 ToolCall（`schema/message.go:76-99`）

```go
type FunctionCall struct {
    Name      string `json:"name,omitempty"`
    Arguments string `json:"arguments,omitempty"` // JSON 字符串
}

type ToolCall struct {
    Index    *int           `json:"index,omitempty"` // 流式拼接用
    ID       string         `json:"id"`
    Type     string         `json:"type"`            // 默认 "function"
    Function FunctionCall   `json:"function"`
    Extra    map[string]any `json:"extra,omitempty"`
}
```

**关键设计**：`Index` 是指针类型且可空。流式场景下 LLM 会把一个 ToolCall 拆成多个 chunk 返回，`Index` 用来把**同一个工具调用的碎片重新聚合**——非流式场景这个字段没用，因此用 `*int` 允许缺省。

### 2.3 多模态输入输出

`message.go` 用一组结构体统一描述多模态部件（`MessagePartCommon` 作为基类）：

```go
type MessagePartCommon struct {
    URL        *string        `json:"url,omitempty"`         // HTTP(S) 或 data URL
    Base64Data *string        `json:"base64data,omitempty"`  // 推荐：与 URL 二选一
    MIMEType   string         `json:"mime_type,omitempty"`
    Extra      map[string]any `json:"extra,omitempty"`        // Deprecated
}
```

在此之上派生：

- 输入侧：`MessageInputImage` / `MessageInputAudio` / `MessageInputVideo` / `MessageInputFile`
- 输出侧：`MessageOutputImage` / `MessageOutputAudio` / `MessageOutputVideo`
- 推理侧：`MessageOutputReasoning`（带 `Signature` 加密推理令牌，o1/Claude 反射推理模型要求回传）

### 2.4 流式元信息

`MessageStreamingMeta`（`message.go:191-196`）用一个 `Index` 字段解决**同一个流返回多段内容**时的重组问题——与 `ToolCall.Index` 语义一致。

## 三、三种模板语法

`message.go:49-61` 定义了 `FormatType`：

```go
const (
    FString    FormatType = 0 // Python 风格：{name}
    GoTemplate FormatType = 1 // text/template：{{.Name}}
    Jinja2     FormatType = 2 // Jinja2：{{ name | upper }}
)
```

对应的外部依赖：

- `FString` → `github.com/slongfield/pyfmt`
- `GoTemplate` → 标准库 `text/template`
- `Jinja2` → `github.com/nikolalohinski/gonja`

**工程意义**：Eino 不强制统一模板方言，可以直接迁移已有的 LangChain（Python 侧惯用 FString/Jinja）或 Go 原生项目的模板资产。

## 四、StreamReader / StreamWriter 详解

流式处理是 eino 的命脉。`schema/stream.go`（23 KB）实现了整套机制。

### 4.1 整体类型概览（`schema/stream.go` 行号分布）

```
  1- 19   License
 20- 27   package schema + 必要 import
 28- 42   ErrNoValue  （跨模式转换时用作 "过滤掉此元素" 的哨兵）
 43- 46   ErrRecvAfterClosed
 47- 69   SourceEOF   （命名源的 EOF 信号，多流合并用）
 70-102   Pipe[T](cap int) → (*StreamReader[T], *StreamWriter[T])
103-139   StreamWriter[T]：Send / Close
140-185   StreamReader[T]：Recv （按 readerType 分派）
186-217   StreamReader.Close
218-244   StreamReader.Copy（产 n 个独立副本）
245-275   StreamReader.SetAutomaticClose（GC finalizer 兜底）
276-330   内部 stream[T]：channel 实现
331-355   StreamReaderFromArray + arrayReader
356-420   multiStreamReader[T]  合并多路
421-468   streamReaderWithConvert[T] + StreamReaderWithConvert
469-510   copyStreamReaders[T]  扇出实现
511-570   parentStreamReader / childStreamReader  链表缓冲
571-606   MergeStreamReaders  无标签合并
607-650   MergeNamedStreamReaders  带命名 EOF 合并
651-669   InternalMergeNamedStreamReaders
```

### 4.2 Pipe：最基础的工厂

```go
func Pipe[T any](cap int) (*StreamReader[T], *StreamWriter[T])
```

内部造一个 buffered channel（容量 `cap`），Reader 与 Writer 共享。典型用法：

```go
r, w := schema.Pipe[string](8)
go func() {
    defer w.Close()
    for _, chunk := range chunks {
        if closed := w.Send(chunk, nil); closed {
            return // 下游已关
        }
    }
}()
for {
    v, err := r.Recv()
    if err == io.EOF { break }
    // ...
}
r.Close()
```

**关键约定**：

- `w.Send` 返回 bool 表示 reader 是否已关闭（早停信号）
- `r.Recv` 在 channel 关闭后返回 `io.EOF`
- **Reader 必须显式 Close**，否则生产侧 goroutine 会被永久阻塞

### 4.3 按 readerType 分派

`StreamReader[T]` 内部有一个 `typ` 字段，`Recv` 根据 type 分派到不同底层实现：

| readerType | 场景 | 底层 |
| --- | --- | --- |
| `readerTypeStream` | `Pipe` 产生的 | channel |
| `readerTypeArray` | `StreamReaderFromArray` | 切片游标 |
| `readerTypeMultiStream` | `MergeStreamReaders` | goroutine 抢 + 公共 channel |
| `readerTypeWithConvert` | `StreamReaderWithConvert` | 包一层 convert 函数 |
| `readerTypeChild` | `Copy` 产出 | 链表缓冲（见下） |

这种 **typ + switch** 的派发是为了避免接口调用在热路径的开销——流的 Recv 会被调用 N 次，少一次虚调用就少一次开销。

### 4.4 Copy 与 ErrNoValue

**Copy**（`stream.go:218-244`）创建 N 个独立消费者共享同一个上游，底层用**链表缓冲**（`parentStreamReader` → 多个 `childStreamReader`）——每个孩子维护自己的游标，已被所有孩子消费完的节点由 GC 回收。

**ErrNoValue**（`stream.go:28-42`）是一个 sentinel error。`StreamReaderWithConvert` 的 convert 函数返回 `ErrNoValue` 时，这个元素被**丢弃但不终止流**——这是 eino 流式过滤的唯一官方机制。

### 4.5 Merge 的两个版本

- `MergeStreamReaders(readers ...)`：多路合并，顺序不定，先到先出
- `MergeNamedStreamReaders(named map[string]*StreamReader[T])`：合并时保留每个源的名字，当某路结束会发一个 `SourceEOF{Source: name}`；所有源都结束才真正 EOF

**工程价值**：`MergeNamedStreamReaders` 是 **Graph 扇入节点**的底层实现。当多个上游并发产流汇入同一个下游，下游需要知道 "哪个源已经完了"，`SourceEOF` 正是这个信号。

### 4.6 ConcatMessages（跨文件协作）

`schema/message.go` 在 init 里注册了三个拼接函数到 `internal`：

```go
internal.RegisterStreamChunkConcatFunc(ConcatMessages)
internal.RegisterStreamChunkConcatFunc(ConcatMessageArray)
internal.RegisterStreamChunkConcatFunc(ConcatToolResults)
```

这使得 `compose` 在做 "把 Stream 收成一整条 Message" 时，能自动找到对应类型的拼接器。**这是 eino 对 "流式结构化数据如何聚合" 这个问题的内置答案**——对每种数据类型预先定义好 concat 行为，运行时反射取用。

## 五、边界与陷阱

### 5.1 谁负责 Close

- **`Pipe` 出来的 Reader 和 Writer**：两端都要显式 Close
- **由框架生成的 Reader**（Graph 执行时的中间流）：框架自动 Close
- **`Copy` 的子流**：每个子流都要 Close；全部关闭后父流自动关
- **`SetAutomaticClose`**：GC finalizer 兜底，但**不要依赖**——属于忘关的最后防线

### 5.2 `ErrRecvAfterClosed`

Reader 关闭后再 `Recv` 会返回这个 error。上层应该在 `io.EOF` 就退出读循环，正常代码不会触发。

### 5.3 Close 的幂等性

`StreamReader.Close` 用 `sync.Once`（见 `stream.go:186-217`）保证多次调用安全——因为 Copy 场景下子流可能同时关闭。

### 5.4 panic 传播

生产者 goroutine 若 panic，**不会**自动传到消费者。规范做法是在 goroutine 里 `defer recover` 然后通过 `w.Send(zero, err)` 把错误塞进流，让 `r.Recv` 以普通 error 形式暴露出来。

## 六、小结：schema 是怎么被使用的

| 上层 | 如何使用 schema |
| --- | --- |
| `components/model` | 输入 `[]*schema.Message`，输出 `*schema.Message` 或 `*schema.StreamReader[*schema.Message]` |
| `components/prompt` | 用 `FormatType` 渲染 `[]*schema.Message` |
| `components/tool` | 声明 `*schema.ToolInfo` |
| `compose` | 用 `schema.Pipe` / `Copy` / `Merge` 做节点间的流连接；用 `internal` 注册表做流→值的聚合 |
| `callbacks` | `CallbackInput / CallbackOutput` 里常见 `schema.Message` 与 `StreamReader` |

## 延伸阅读

- [Stream：流处理内部（聚焦 compose 中的流）](./stream.md)
- [components：组件抽象总览](./components-overview.md)
- [Graph：图编排核心](./graph.md)
- [ChatModel：模型调用](./chatmodel.md)
