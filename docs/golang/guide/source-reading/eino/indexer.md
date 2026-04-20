---
title: Eino Indexer：索引器
description: 精读 eino v0.8.10 components/indexer：Indexer 单方法接口、ids 返回约定、WithEmbedding/WithSubIndexes 选项、索引与检索的对称性约束。
---

# Eino Indexer：索引器

> 源码路径：[`components/indexer/interface.go`](https://github.com/cloudwego/eino/blob/v0.8.10/components/indexer/interface.go)

Indexer 是 Retriever 的对偶——**把文档连同向量写入后端**。RAG 管道里它几乎总是与 Embedder 配对出现。

## 一、接口（`components/indexer/interface.go:36-38`）

```go
type Indexer interface {
    Store(ctx context.Context, docs []*schema.Document, opts ...Option) (ids []string, err error)
}
```

签名的几个关键：

- 输入 `[]*schema.Document` 带内容 + 可选 `DenseVector` / `SparseVector`
- 返回 **每个文档的后端 ID**，顺序与输入对齐
- 没有 Stream——索引是**批量一次性**写入

## 二、Options 两大关键

### 2.1 `WithEmbedding(embedder)` —— 生成向量

注释（`interface.go:28-30`）：

> "When Options.Embedding is provided, the implementation generates vectors before storing — **the same embedder must be used by the paired retriever.Retriever**."

两种模式：

1. **Indexer 自己嵌入**：Store 内部调 `embedder.EmbedStrings(contents)` 得到向量
2. **Document 已带向量**：上游 Pipeline 先 embed 再 index（跳过 Indexer 的向量化）

后者常见于"分阶段索引"——embedding 与存储解耦，便于重试。

### 2.2 `WithSubIndexes([]string)` —— 逻辑分区

注释（`interface.go:32-33`）：

> "Use Options.SubIndexes to write documents into logical sub-partitions within the same store."

子分区是**检索的预过滤器**。见 [Retriever](./retriever.md#九subindexes逻辑分区)。

## 三、返回 IDs 的语义

`ids[i]` 对应 `docs[i]`——后端分配的主键。这个 ID **后续用于更新/删除**。实现的选择：

| 策略 | 说明 |
| --- | --- |
| Provider 生成 | 多数向量库（Milvus、Qdrant）自动生成 UUID |
| 用 Document.ID | 如果文档预先有 ID，Indexer 可能直接用它做主键 |
| hash(Content) | 某些实现用内容 hash 保证幂等 |

**一致性约束**：同一批 Store 调用，返回的 ids 长度必须等于输入长度——全成功或全失败。部分成功在接口上无法表达（除非自定义 option）。

## 四、Document 的向量字段

`schema/document.go` 定义了两种向量的 typed accessor：

```go
func (d *Document) DenseVector() []float64
func (d *Document) WithDenseVector(vector []float64) *Document

func (d *Document) SparseVector() map[int]float64
func (d *Document) WithSparseVector(sparse map[int]float64) *Document
```

- **Dense** — 连续稠密向量，如 `text-embedding-3-small` 的 1536 维
- **Sparse** — 稀疏向量（稀疏的 idx → value map），常见于 BM25、SPLADE

**混合检索**需要同时存两种向量。后端要支持（如 OpenSearch / Weaviate / Qdrant 的 hybrid search）。

## 五、在 Graph 中的定位

索引 Pipeline 的典型结构：

```
Source → Loader → Transformer(chunks) → Indexer → (ids)
         原始文档    分块 / 清洗           向量化 + 存储
```

用 Chain：

```go
indexChain := compose.NewChain[document.Source, []string]().
    AppendLoader(loader).              // Source → []*Document
    AppendDocumentTransformer(split).  // []*Document → []*Document (chunks)
    AppendIndexer(idx)                 // []*Document → []string (ids)

r, _ := indexChain.Compile(ctx)
ids, _ := r.Invoke(ctx, document.Source{URI: "file:///data/docs.pdf"})
```

这是典型的"**索引离线、检索在线**"分离：索引 Pipeline 与 RAG Pipeline 是**两个不同的 Graph**。

## 六、Indexer 实现清单（eino-ext）

[`eino-ext/components/indexer/`](https://github.com/cloudwego/eino-ext/tree/v0.8.10/components/indexer) 提供：

| 实现 | 后端 |
| --- | --- |
| `milvus` | Milvus |
| `es8` | Elasticsearch 8.x |
| `redis` | Redis + RediSearch |
| `volc_vikingdb` | 火山 VikingDB |
| `tencentvectordb` | 腾讯云向量库 |
| `volc_knowledge` | 火山知识库 |

适配器共同套路：

1. 构造期注入 embedder（与 Retriever 同一个）
2. `Store` 内部：若 docs 没带向量，调 `embedder.EmbedStrings(...)` 批量嵌入
3. 调用后端 upsert API → 收集 ids
4. 可选：把向量写回 `doc.WithDenseVector(...)` 以便 caller 复用

## 七、自定义 Indexer 模板

```go
type MyIndexer struct {
    client *myVectorDB
    embed  embedding.Embedder
}

func (idx *MyIndexer) Store(ctx context.Context, docs []*schema.Document, opts ...indexer.Option) ([]string, error) {
    o := indexer.GetCommonOptions(&indexer.Options{
        Embedding: idx.embed,
    }, opts...)

    // 1. 取出需要嵌入的文档
    texts := make([]string, 0, len(docs))
    toEmbedIdx := make([]int, 0, len(docs))
    for i, d := range docs {
        if d.DenseVector() == nil {
            texts = append(texts, d.Content)
            toEmbedIdx = append(toEmbedIdx, i)
        }
    }

    // 2. 批量嵌入
    if len(texts) > 0 {
        vecs, err := o.Embedding.EmbedStrings(ctx, texts)
        if err != nil { return nil, err }
        for i, idxInDocs := range toEmbedIdx {
            docs[idxInDocs].WithDenseVector(vecs[i])
        }
    }

    // 3. 批量写后端
    ids, err := idx.client.Upsert(ctx, docs, o.SubIndexes)
    if err != nil { return nil, err }
    return ids, nil
}

func (idx *MyIndexer) GetType() string { return "MyVectorDB" }
```

## 八、幂等性

索引是**容易重复触发**的操作：

- 离线 Pipeline 因失败重跑
- 同一文档被多次上传

**三种实现方式**：

1. **用 `Document.ID` 做主键**（upsert 语义）— 重复 ID 就更新
2. **用 `hash(Content)` 做主键** — 内容相同则跳过
3. **上游做去重** — 索引前先过滤

绝大多数生产 Indexer 应选 1 或 2。

## 九、批处理的注意点

### 9.1 单批大小

向量库 upsert 通常每批 100-1000 条。过大会超时或触发限流。

### 9.2 失败的回滚

Upsert 一批 1000 条，第 500 条失败怎么办？三种策略：

- **全或无**：依赖后端事务（少数向量库不支持）
- **尽量多**：按小批切，失败的批标记 + 下次重试
- **先写后删**：先全部 Insert，失败就批量 Delete——代价大

实现时明确文档约定，避免调用方猜。

### 9.3 重索引（reindex）

模型换了（比如从 ada-002 换到 3-small）要全量重新 embed + 重索引。**工程上**：

- 用 `SubIndexes = [version]` 分版本写入
- 检索侧切流量到新版本
- 旧版本定期清理

这种"蓝绿索引"是生产环境必备。

## 十、边界与陷阱

### 10.1 Indexer 与 Retriever 的 embedder 不一致

上文反复强调。**规范**：把 embedder 放到**配置中心**，一处定义、两处引用。

### 10.2 部分失败静默吞下

Indexer 只返回 `error` + 已成功的 IDs——实现若返回部分 IDs + `nil` error，调用方无从知道哪些失败。**规范**：要么全成功，要么返回 error + 空 ids。

### 10.3 空文档

`docs = []` 或 `doc.Content == ""` 的行为要明确。通常：空批返回空 IDs + nil error；空内容跳过或报错。

### 10.4 大文档超限

向量库对单条 payload 有大小限制（Milvus 默认 16 MB）。**规范**：Indexer 前一定有 Transformer 分块。

### 10.5 SubIndexes 数量膨胀

按用户 ID 分区——1M 用户 → 1M 子分区。多数向量库不支持这种规模。**规范**：低基数（<1k）才用 SubIndexes，否则用 meta 字段 + post-filter。

### 10.6 没处理稀疏向量

如果 Document 带 `SparseVector` 但 Indexer 的后端不支持，不能静默丢弃——要明确报错或忽略。

## 十一、最佳实践

1. **Indexer 与 Retriever 成对构造**，embedder 用同一实例
2. **幂等 ID 策略**（Document.ID 或 hash）
3. **批量 + 并发**，但有限流
4. **返回 IDs 有序**——对齐 docs 顺序
5. **监控索引延迟**：embed 耗时 + 向量库写入耗时分开观察
6. **蓝绿索引**应对模型升级

## 延伸阅读

- [Retriever：检索器](./retriever.md)
- [Embedding：向量化](./embedding.md)
- [Document：文档加载与切分](./document.md)
- [ext-adapters：eino-ext 适配器模式](./ext-adapters.md)
