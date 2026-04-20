---
title: Eino Embedding：向量化
description: 精读 eino v0.8.10 components/embedding：Embedder 单方法接口、批处理策略、维度约束，以及它如何串联 Retriever 与 Indexer。
---

# Eino Embedding：向量化

> 源码路径：[`components/embedding/interface.go`](https://github.com/cloudwego/eino/blob/v0.8.10/components/embedding/interface.go)

Embedder 是 RAG 的**枢纽**：索引端把文档转向量存入向量库，检索端把查询转向量去查询——两端必须**共用同一个 embedder**（同一模型、同一维度）。

## 一、接口（`interface.go:37-39`）

```go
type Embedder interface {
    EmbedStrings(ctx context.Context, texts []string, opts ...Option) ([][]float64, error)
}
```

这是整个 eino 里**最简单**的组件：

- 输入：`[]string`（一批待向量化的文本）
- 输出：`[][]float64`（对应的向量数组）
- 顺序保持：`embeddings[i]` 对应 `texts[i]`（注释明确规定）

## 二、维度约束（注释，`interface.go:27-34`）

```
embeddings[i]         → 第 i 个文本的向量
len(embeddings[i])    → 模型的 embedding 维度（如 ada-002 是 1536）
```

两条硬性约束：

1. **同一批输出的向量维度相同**（模型决定）
2. **Indexer 与 Retriever 必须使用同一 embedder**——维度或模型家族不同会破坏语义相似度

注释原文：

> "Both Indexer and Retriever use an Embedder to convert documents and queries into vectors. **They must share the exact same model** — mismatched dimensions or model families break semantic similarity."

## 三、为什么是 `[]string` 批量输入

两个原因：

### 3.1 Provider API 本身支持批处理

OpenAI `embeddings` API 接受 `input: array`，一次最多 2048 条；阿里云 DashScope、火山 Ark 都类似。**批量调用比单次循环便宜 10 倍**（按请求次数计费，不是按 token）。

### 3.2 eino 统一语义

接口统一成批量后，调用方不用担心 "我该传 string 还是 []string"——总是批量。单条查询传 `[]string{q}`，取 `result[0]` 即可。

## 四、在 Graph 中的两种使用

### 4.1 作为显式节点

```go
g.AddEmbeddingNode("embed", e)
g.AddEdge("split", "embed")  // split 输出 []string → embed
g.AddEdge("embed", "index")  // embed 输出 [][]float64 → index
```

但实际较少这样用——通常 embedder 作为**选项**被 Indexer / Retriever 持有（见下）。

### 4.2 作为 Indexer / Retriever 的内部组件

典型模式：

```go
indexer := milvus.NewIndexer(ctx, milvus.Config{
    Embedding: embedder,  // 注入到 indexer 内部
})

retriever := milvus.NewRetriever(ctx, milvus.Config{
    Embedding: embedder,  // 必须是同一个
})
```

这种组合让 Graph 只需要管 `Document` 和 `query`，向量化对外不可见。

## 五、Embedder 实现清单（eino-ext）

[`eino-ext/components/embedding/`](https://github.com/cloudwego/eino-ext/tree/v0.8.10/components/embedding) 提供：

| 实现 | Provider |
| --- | --- |
| `openai` | OpenAI `text-embedding-*` |
| `ark` | 火山 Ark |
| `dashscope` | 阿里云通义 |
| `gemini` | Google Gemini |
| `ollama` | 本地 Ollama |

典型实现结构：

```go
type OpenAIEmbedder struct {
    client *openai.Client
    model  string  // "text-embedding-3-small"
    dim    int     // 维度，用于输出验证
}

func (e *OpenAIEmbedder) EmbedStrings(ctx context.Context, texts []string, opts ...embedding.Option) ([][]float64, error) {
    resp, err := e.client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
        Input: texts,
        Model: e.model,
    })
    if err != nil { return nil, err }
    out := make([][]float64, len(resp.Data))
    for i, d := range resp.Data {
        out[i] = d.Embedding
    }
    return out, nil
}

func (e *OpenAIEmbedder) GetType() string { return "OpenAI" }
```

## 六、批处理的工程考量

### 6.1 上限

每个 Provider 有硬性上限：

| Provider | 单次最多条数 | 单条最多 token |
| --- | --- | --- |
| OpenAI `text-embedding-3-*` | 2048 | 8191 |
| Ark | 25（示例） | 视模型 |
| DashScope | 25（`text-embedding-v2`） | 2048 |

**实现策略**：Embedder 内部自动分批——超过上限就拆。

```go
func (e *MyEmbedder) EmbedStrings(ctx context.Context, texts []string, opts ...embedding.Option) ([][]float64, error) {
    const maxBatch = 25
    out := make([][]float64, len(texts))
    for i := 0; i < len(texts); i += maxBatch {
        end := i + maxBatch
        if end > len(texts) { end = len(texts) }
        batch, err := e.callProvider(ctx, texts[i:end])
        if err != nil { return nil, err }
        copy(out[i:], batch)
    }
    return out, nil
}
```

### 6.2 并发

对 Provider API 的**并发调用**通常能进一步提速：

```go
func (e *MyEmbedder) EmbedStrings(ctx context.Context, texts []string, opts ...embedding.Option) ([][]float64, error) {
    chunks := split(texts, maxBatch)
    out := make([][]float64, len(texts))
    eg, ctx := errgroup.WithContext(ctx)
    sem := make(chan struct{}, 8)  // 限制并发
    for i, c := range chunks {
        i, c := i, c
        eg.Go(func() error {
            sem <- struct{}{}; defer func() { <-sem }()
            r, err := e.callProvider(ctx, c)
            if err != nil { return err }
            copy(out[i*maxBatch:], r)
            return nil
        })
    }
    return out, eg.Wait()
}
```

### 6.3 缓存

相同文本 embed 结果相同——可以用 `sync.Map` 或 LRU 缓存。缓存 key 通常是 `model + text` 的 hash。对 **查询侧** 缓存尤其有用（同一查询可能被问多次）。

## 七、Option（`components/embedding/option.go`）

标准 option 相对少。常见：

- `WithModel(string)` — 运行时切模型（少数 Provider 支持）
- `WithDimensions(int)` — OpenAI `text-embedding-3-*` 支持的可变维度

## 八、Callback 的自动触发

Embedder 一般**不自己管 callback**——因为它是**非流式、确定性**的，框架自动包装足够了。默认 `OnStart/OnEnd/OnError` 在方法前后触发，携带 `CallbackInput{Texts: texts}` / `CallbackOutput{Embeddings: vectors}`。

## 九、边界与陷阱

### 9.1 维度切换

`text-embedding-3-small` 支持 `dimensions` 参数切维度（512 / 1024 / 1536）。**一旦切了，索引库里的旧向量也得重算**——否则维度不一致。

### 9.2 Provider 限流

所有 Provider 都有 RPM/TPM 限制。批量加并发容易打爆。**规范**：封装时内置 rate limiter。

### 9.3 空字符串

把空字符串传给 embedder 的行为取决于 Provider——OpenAI 会报错。**规范**：Embedder 实现里 filter 空字符串，或在上游 Transformer 阶段就过滤。

### 9.4 维度验证

生产代码应在返回前**断言**维度 = 期望值：

```go
if len(vec) != e.dim {
    return nil, fmt.Errorf("unexpected embedding dim: got %d, want %d", len(vec), e.dim)
}
```

防止 Provider 静默切换模型导致索引污染。

### 9.5 Token 超长

OpenAI ada-002 的 8191 token 上限——超长文本要**先在 Transformer 阶段切块**。Embedder 本身不负责截断。

### 9.6 多语言 + 领域自定义

通用 embedder 对特定领域（医学、法律）效果可能差。**解决**：要么 fine-tune，要么用混合检索（dense + BM25）。

## 十、最佳实践

1. **一个应用统一用一种 embedder** —— 避免跨组件的维度错位
2. **把 embedder 作为 Indexer/Retriever 的构造参数**，而非独立节点
3. **上限 + 并发 + 限流**封装到 Embedder 内部
4. **dim 在 Embedder struct 里显式持有**——用于 sanity check
5. **查询侧缓存** —— 短期内重复查询极多
6. **Provider 失败要重试**（408/429/500）——内置一层指数退避

## 延伸阅读

- [Retriever：检索器](./retriever.md)
- [Indexer：索引器](./indexer.md)
- [Document：文档加载与切分](./document.md)
- [ext-adapters：eino-ext 适配器模式](./ext-adapters.md)
