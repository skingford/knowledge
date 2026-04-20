---
title: Eino Retriever：检索器
description: 精读 eino v0.8.10 components/retriever：Retriever 接口、TopK/ScoreThreshold/Embedding 选项、与 Indexer 共享 embedder 的约束、schema.Document 的 score/vector 元信息。
---

# Eino Retriever：检索器

> 源码路径：[`components/retriever/interface.go`](https://github.com/cloudwego/eino/blob/v0.8.10/components/retriever/interface.go)
>
> 相关：[`schema/document.go`](https://github.com/cloudwego/eino/blob/v0.8.10/schema/document.go)

Retriever 是 RAG（检索增强生成）场景里的**第一环**：给定查询，从向量库或全文索引里捞回**相关文档**。eino 把它抽象成一个**只有一个方法**的接口。

## 一、接口（`components/retriever/interface.go:48-50`）

```go
type Retriever interface {
    Retrieve(ctx context.Context, query string, opts ...Option) ([]*schema.Document, error)
}
```

签名极简：

- 输入：自然语言 `query`
- 输出：`[]*schema.Document`，**按相关性降序**
- 没有 Stream/Collect/Transform——检索是**批量取**，流式没有对应语义

## 二、Options 的三大关键（来自 `option.go` + interface 注释）

### 2.1 `WithEmbedding(embedder)` —— 查询向量化

注释（`interface.go:34-36`）：

> "When Options.Embedding is set, the implementation converts the query to a vector before searching. **The embedder must be the same model used at index time** — see indexer.Options.Embedding."

这是 **RAG 工程中最容易踩的坑**：查询侧 embedder 与索引侧不一致，余弦距离就失去意义——语义相似度计算的前提是两个向量在**同一空间**。

### 2.2 `WithTopK(n)` —— 结果数量上限

返回最多 n 条。**先 TopK 再 ScoreThreshold**——实现通常：取 TopK → 按分数过滤。

### 2.3 `WithScoreThreshold(threshold)` —— 相关性门槛

注释（`interface.go:38-40`）强调了一个关键语义：

> "Options.ScoreThreshold is **a filter, not a sort**: documents scoring below the threshold are excluded entirely."

它**不是排序阈值**——所有低于 threshold 的文档**被完全剔除**，最终返回的数组不会含这些文档。与 "只返回高分但仍返回" 的语义不同。

## 三、返回的 Document 形态

Retrieve 返回的 `[]*schema.Document` 每条通常带有：

- `Content` — 文本主体
- `MetaData["_score"]` — 相关性分数，通过 `doc.Score()` / `doc.WithScore()` 访问（`schema/document.go:83-110`）
- Provider 特定的 meta（如 OpenSearch 的 `_index`、Milvus 的 `_pk` 等）

### 3.1 Document 的 typed accessor

`schema/document.go` 提供了 6 对 typed 访问器，帮你避免手写 meta key 字符串：

| Getter | Setter | 底层 meta key |
| --- | --- | --- |
| `Score()` | `WithScore(float64)` | `_score` |
| `SubIndexes()` | `WithSubIndexes([]string)` | `_sub_indexes` |
| `ExtraInfo()` | `WithExtraInfo(string)` | `_extra_info` |
| `DSLInfo()` | `WithDSLInfo(map[string]any)` | `_dsl` |
| `DenseVector()` | `WithDenseVector([]float64)` | `_dense_vector` |
| `SparseVector()` | `WithSparseVector(map[int]float64)` | `_sparse_vector` |

**`_` 前缀是 eino 的约定**——标示 "框架保留 key"，你自己的业务 meta 不要用下划线开头。

## 四、在 Graph 中的典型位置

```
START ─ Retriever ─ ChatTemplate ─ ChatModel ─ END
        （query→docs）（把 docs 塞 context）（生成回答）
```

或字段级编排用 Workflow：

```go
wf.AddRetrieverNode("retrieve", r).
    AddInput(compose.START,
        compose.MapFields("", "Query"),  // START 整个输入 → Retriever 的 query
    )

wf.AddChatModelNode("answer", m).
    AddInput("retrieve",
        compose.MapFields("Documents", "Context"),  // Retriever 输出 → ChatModel 输入
    ).
    AddInput(compose.START,
        compose.MapFields("", "Question"),
    )
```

## 五、Retriever 实现清单（来自 `eino-ext`）

eino 主仓库只有接口。实际 Retriever 在 [`eino-ext/components/retriever/`](https://github.com/cloudwego/eino-ext/tree/v0.8.10/components/retriever) 里：

| 实现 | 后端 |
| --- | --- |
| `volc_vikingdb` | 火山引擎 VikingDB |
| `es8` | Elasticsearch 8.x |
| `milvus` | Milvus 向量库 |
| `redis` | Redis + RediSearch |
| `tencentvectordb` | 腾讯云向量数据库 |
| `volc_knowledge` | 火山引擎知识库 |

这些适配器的共同套路：

1. 构造期注入 embedder
2. `Retrieve` 内部：`embedder.EmbedStrings([]string{query})` → 得到查询向量 → 调向量库 search API → 返回 `[]*Document`
3. 每个 Document 上 `WithScore` 写入相似度

## 六、自定义 Retriever 模板

```go
type MyRetriever struct {
    client  *myVectorDB
    embed   embedding.Embedder  // 必须与 Indexer 共享
    defaultK int
}

func (r *MyRetriever) Retrieve(ctx context.Context, query string, opts ...retriever.Option) ([]*schema.Document, error) {
    o := retriever.GetCommonOptions(&retriever.Options{
        TopK:       &r.defaultK,
        Embedding:  r.embed,  // 默认嵌入器
    }, opts...)

    // 1. 查询向量化
    vecs, err := o.Embedding.EmbedStrings(ctx, []string{query})
    if err != nil { return nil, err }

    // 2. 向量库搜索
    results, err := r.client.Search(ctx, vecs[0], *o.TopK)
    if err != nil { return nil, err }

    // 3. 转 Document + 分数过滤
    docs := make([]*schema.Document, 0, len(results))
    for _, res := range results {
        if o.ScoreThreshold != nil && res.Score < *o.ScoreThreshold {
            continue
        }
        docs = append(docs,
            (&schema.Document{ID: res.ID, Content: res.Content}).
                WithScore(res.Score),
        )
    }
    return docs, nil
}

// 可选：Typer
func (r *MyRetriever) GetType() string { return "MyVectorDB" }
```

## 七、边界与陷阱

### 7.1 embedder 不一致

索引时用 `text-embedding-ada-002`，检索时用 `text-embedding-3-small` —— 完全不可比。**规范**：Retriever 构造期接收 embedder，并在代码注释里约束 "必须与 Indexer 使用相同的 embedder"。

### 7.2 ScoreThreshold 设太高

`>0.95` 可能过滤掉所有结果。不同模型的分数分布不同——要先看实际数据的分布。

### 7.3 TopK 过大

向量库查 TopK=1000 非常慢，且对 LLM 也没意义（塞不进 context）。常见 5-20。

### 7.4 对中文查询的分词

大多数 dense embedding 对中文友好，不用担心。但**稀疏检索**（BM25）需要中文分词器——实现时要明确。

### 7.5 多语言混合

跨语言检索对 embedder 有要求（要是多语言模型）。`text-embedding-3-small` / 阿里云 `text-embedding-v2` 都支持跨语言，其他模型不一定。

### 7.6 返回文档超长

单个 Document 的 `Content` 可能很长（如一篇文章）。**规范**：上游 Indexer 阶段就做分块，Retrieve 返回的是**chunks** 而非原文——见 [document](./document.md) 的 Transformer。

## 八、性能建议

1. **向量化查询是热路径**——如果 embedder 走远程 API，加本地 cache（同一 query 向量不变）
2. **TopK 尽量小**——向量库查询的延迟对 K 敏感
3. **SubIndexes 预过滤**比通用查询快——见下一节
4. **Retriever 可并发**——多个 retriever（混合检索）用 Workflow 并行然后 rerank

## 九、SubIndexes：逻辑分区

索引时通过 `doc.WithSubIndexes([]string{"product_a", "docs_v2"})` 把文档写入子分区；检索时通过 Retriever option 指定子分区——后端用这个做**预过滤**而不是 post-filter。

**何时用**：

- 按租户分 — `SubIndexes = [userID]`
- 按版本分 — `SubIndexes = [docVersion]`
- 按类别分 — `SubIndexes = [category]`

**何时不用**：分区数不固定或很多（10k+）—— 会拖慢索引。

## 十、混合检索（hybrid search）模式

真实 RAG 通常需要 dense + sparse 双路检索：

```
              ┌─ DenseRetriever ─┐
START ─ query ┤                  ├─ Reranker ─ ChatModel
              └─ SparseRetriever ┘
```

用 Workflow 把两个 Retriever 并行、用 Lambda 合并 + rerank。eino 没有内置 rerank 组件——写成 Lambda 或独立 Retriever（包装一层）。

## 延伸阅读

- [Embedding：向量化](./embedding.md)
- [Indexer：索引器](./indexer.md)
- [Document：文档加载与切分](./document.md)
- [Workflow：字段级编排](./workflow.md)
- [ext-adapters：eino-ext 适配器模式](./ext-adapters.md)
