---
title: Eino Document：文档加载与切分
description: 精读 eino v0.8.10 components/document：Loader/Transformer 接口、Source 结构、schema.Document 的 MetaData 协议与 typed accessor，以及 RAG 离线 Pipeline 的装配。
---

# Eino Document：文档加载与切分

> 源码路径：
> - [`components/document/interface.go`](https://github.com/cloudwego/eino/blob/v0.8.10/components/document/interface.go)
> - [`components/document/parser/`](https://github.com/cloudwego/eino/tree/v0.8.10/components/document/parser)（Parser 子包）
> - [`schema/document.go`](https://github.com/cloudwego/eino/blob/v0.8.10/schema/document.go)

`components/document` 定义了 RAG 离线 Pipeline 的两个关键接口：**Loader**（从外部拉原文）和 **Transformer**（对已有文档做变换）。加上 Schema 里的 `Document` 本体，构成文档层的完整抽象。

## 一、两个接口 + 一个 Source

### 1.1 Source（`interface.go:27-29`）

```go
type Source struct {
    URI string
}
```

标识外部位置：

- 本地文件：`"/data/docs.pdf"` 或 `"file:///data/docs.pdf"`
- 远程 URL：`"https://example.com/docs"`
- 云存储：`"s3://bucket/key"` / `"gs://..."`（具体方案由 Loader 决定）

### 1.2 Loader（`interface.go:43-45`）

```go
type Loader interface {
    Load(ctx context.Context, src Source, opts ...LoaderOption) ([]*schema.Document, error)
}
```

从 Source 读原始字节，**可选用 parser 解析格式**，返回 `[]*Document`。注释（`interface.go:36-39`）：

> "The loader is responsible for fetching the raw bytes; actual format parsing is typically delegated to a parser.Parser configured on the loader via WithParserOptions."

所以 Loader 内部通常是 **fetch + parse** 两步：

1. 按 URI scheme 拉字节（HTTP / File / S3 / ...）
2. 用 parser 把字节变成 `[]*Document`

### 1.3 Transformer（`interface.go:53-55`）

```go
type Transformer interface {
    Transform(ctx context.Context, src []*schema.Document, opts ...TransformerOption) ([]*schema.Document, error)
}
```

文档到文档的变换——**切分、过滤、合并、重排、翻译**都在这一层。注释（`interface.go:50-52`）：

> "Implementations should preserve existing MetaData keys and merge rather than replace when adding their own metadata."

这是一条**工程纪律**：Transformer 不能丢失上游的 MetaData，只能**追加**自己的 key。因为下游（Indexer、Retriever）可能依赖前序 stage 的 metadata。

## 二、Document 本体（`schema/document.go:40-47`）

```go
type Document struct {
    ID       string         `json:"id"`
    Content  string         `json:"content"`
    MetaData map[string]any `json:"meta_data"`
}
```

就三个字段。注释（`schema/document.go:28-35`）定位它：

> "Document is a piece of text with a metadata map. It is the **shared currency** between Loader, Transformer, Indexer, and Retriever components."

这是 RAG 全管道的**通用货币**——每个组件都只认这种类型。

## 三、MetaData 的典型用法

MetaData 是 `map[string]any`——开放的键值对。但 eino 约定了一组**保留键**，全部以 `_` 前缀（`schema/document.go:19-26`）：

```go
const (
    docMetaDataKeySubIndexes   = "_sub_indexes"
    docMetaDataKeyScore        = "_score"
    docMetaDataKeyExtraInfo    = "_extra_info"
    docMetaDataKeyDSL          = "_dsl"
    docMetaDataKeyDenseVector  = "_dense_vector"
    docMetaDataKeySparseVector = "_sparse_vector"
)
```

这些 key 对应 6 对 typed accessor。**业务 meta 不要用下划线前缀**，否则可能与框架保留冲突。

### 3.1 典型业务 meta

```go
doc := &schema.Document{
    ID:      "doc_001",
    Content: "...",
    MetaData: map[string]any{
        // 业务字段（用正常命名）
        "source_url":  "https://example.com/article",
        "author":      "Alice",
        "category":    "tech",
        "published":   "2026-04-15",
        "chunk_index": 3,
    },
}

// 框架字段（用 typed accessor）
doc.WithScore(0.87).
    WithSubIndexes([]string{"tech", "v1"}).
    WithExtraInfo("Summary: ...")
```

## 四、离线 RAG Pipeline 装配

典型的**索引 Pipeline**（离线）：

```
Source ─ Loader ─ Transformer(split) ─ Transformer(clean) ─ Indexer ─ (ids)
原始源  拉 + 解析    切块                  清洗/去重          存向量库
```

用 Chain：

```go
ingestChain := compose.NewChain[document.Source, []string]().
    AppendLoader(loader).
    AppendDocumentTransformer(splitter).
    AppendDocumentTransformer(cleaner).
    AppendIndexer(idx)

r, _ := ingestChain.Compile(ctx)
ids, _ := r.Invoke(ctx, document.Source{URI: "s3://corpus/batch-001"})
```

### 4.1 Transformer 可以串联

多个 Transformer 组成流水线：

```
Loader → Splitter → Deduper → Translator → Indexer
```

每一步都传递 `[]*Document`。

### 4.2 Transformer 可以并行

扇出 + 扇入的场景：

```
          ┌─ ExtractTables ──┐
Loader ──┤                  ├── Merger ── Indexer
          └─ ExtractImages ──┘
```

用 Graph 的并行节点 + Lambda 合并。

## 五、Parser 子包

`components/document/parser` 下有 Parser 抽象（本页不展开）：

```go
// 大致形态
type Parser interface {
    Parse(ctx context.Context, reader io.Reader, opts ...Option) ([]*schema.Document, error)
}
```

Parser 专注**从字节到 Document** —— 通常按 MIME 类型分派（PDF / DOCX / HTML / Markdown / CSV）。Loader 通过 `WithParserOptions` 注入 Parser。

## 六、eino-ext 的 Loader / Transformer

[`eino-ext/components/document/`](https://github.com/cloudwego/eino-ext/tree/v0.8.10/components/document) 提供：

### 6.1 Loaders

| 实现 | 场景 |
| --- | --- |
| `file` | 本地文件（PDF / TXT / Markdown / ...） |
| `url` | HTTP(S) URL |
| `s3` | AWS S3 |

### 6.2 Parsers

| 实现 | 输入格式 |
| --- | --- |
| `pdf` | PDF |
| `html` | HTML |
| `docx` | Word |

### 6.3 Transformers

| 实现 | 作用 |
| --- | --- |
| `markdown/splitter` | 按 Markdown 标题切 |
| `recursive` | 递归字符切分（LangChain 风格） |
| `size` | 固定大小切分 |

## 七、自定义 Loader 模板

```go
type MyLoader struct {
    httpClient *http.Client
    parser     parser.Parser
}

func (l *MyLoader) Load(ctx context.Context, src document.Source, opts ...document.LoaderOption) ([]*schema.Document, error) {
    // 1. 按 URI scheme 拉字节
    req, _ := http.NewRequestWithContext(ctx, "GET", src.URI, nil)
    resp, err := l.httpClient.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()

    // 2. Parser 解析
    docs, err := l.parser.Parse(ctx, resp.Body)
    if err != nil { return nil, err }

    // 3. 回填 source URI 到每个 doc 的 MetaData
    for _, d := range docs {
        if d.MetaData == nil { d.MetaData = map[string]any{} }
        d.MetaData["source_uri"] = src.URI
    }
    return docs, nil
}

func (l *MyLoader) GetType() string { return "HTTPLoader" }
```

注释（`interface.go:41-42`）提醒：

> "Document metadata (schema.Document.MetaData) should be populated with at least the source URI so that downstream nodes can trace document provenance."

**每个文档都应该知道自己的来源** —— 否则 RAG 回答时没法附引用。

## 八、自定义 Transformer 模板：按段落切分

```go
type ParagraphSplitter struct {
    maxLen int
}

func (s *ParagraphSplitter) Transform(ctx context.Context, docs []*schema.Document, opts ...document.TransformerOption) ([]*schema.Document, error) {
    out := make([]*schema.Document, 0, len(docs))
    for _, d := range docs {
        paragraphs := strings.Split(d.Content, "\n\n")
        for i, p := range paragraphs {
            if len(strings.TrimSpace(p)) == 0 { continue }
            chunk := &schema.Document{
                ID:      fmt.Sprintf("%s#p%d", d.ID, i),
                Content: p,
                // 合并上游 meta，不是替换
                MetaData: mergeMeta(d.MetaData, map[string]any{
                    "chunk_index": i,
                    "chunk_total": len(paragraphs),
                }),
            }
            out = append(out, chunk)
        }
    }
    return out, nil
}

func mergeMeta(a, b map[string]any) map[string]any {
    out := make(map[string]any, len(a)+len(b))
    for k, v := range a { out[k] = v }
    for k, v := range b { out[k] = v }  // b 覆盖 a
    return out
}

func (s *ParagraphSplitter) GetType() string { return "ParagraphSplitter" }
```

注意 `mergeMeta`——这是 Transformer 的规范：**合并而非替换**。

## 九、分块策略的权衡

| 策略 | 优点 | 缺点 |
| --- | --- | --- |
| 固定字符数 | 实现简单 | 可能切断语义 |
| 固定 token 数 | 与模型配合好 | 需要 tokenizer |
| 按段落 | 语义边界 | 长度不均 |
| 按 Markdown 标题 | 结构化文档友好 | 纯文本不适用 |
| 语义切分（LLM 辅助） | 效果最好 | 昂贵、慢 |
| 递归字符（LangChain 式） | 平衡效果和复杂度 | 实现略复杂 |

工程默认：**递归字符 + overlap**（相邻块重叠若干字符）—— 大多数场景够用。

## 十、边界与陷阱

### 10.1 Content 为空

Loader 或 Transformer 可能产出 `Content == ""` 的 Document。**规范**：过滤掉空内容（空 doc 被 embed 时会报错）。

### 10.2 ID 重复

两个 doc 用同一个 ID 进 Indexer 会被后端 upsert 成一条。**规范**：分块时 ID 带 `#chunkN` 后缀。

### 10.3 MetaData 被覆盖

Transformer 写 `d.MetaData = map[string]any{...}` 会**完全覆盖**。必须 merge。违反这条会丢失 `source_uri`、`chunk_index` 等关键字段。

### 10.4 大文件内存溢出

整个 PDF 加载到内存 → Parser 一次解析完 → 可能几 GB。**规范**：Loader + Parser 支持 streaming 接口（虽然当前公开接口都是批量）。

### 10.5 并发问题

Loader 可能起多个 goroutine 并发拉取多个 URI。`*http.Client` 本身线程安全，但**自定义的 client 状态**（如 cookie jar）需要注意。

### 10.6 编码问题

PDF/Word 的文本编码有时是 CP1252、GB2312 等——Parser 必须明确转到 UTF-8。eino 所有下游（Embedder、ChatModel）默认 UTF-8。

## 十一、最佳实践

1. **每个 Document 都带 `source_uri` 或等价字段** —— RAG 引用的基础
2. **分块时 ID 带 `#chunkN` 后缀** —— 保证唯一
3. **Transformer 必须 merge 上游 MetaData** —— 不要替换
4. **Loader 内部分层**：fetch + parse 解耦
5. **大文件用 streaming** —— 内存安全
6. **分块策略有选择性** —— 默认递归字符，结构化内容用专用 splitter
7. **保留原始 Content 的若干特征**（长度、hash）进 MetaData —— 方便调试 / 幂等 / 重索引
8. **离线 Pipeline 独立图**——与在线 RAG 查询图分开，降低复杂度

## 延伸阅读

- [Retriever：检索器](./retriever.md)
- [Indexer：索引器](./indexer.md)
- [Embedding：向量化](./embedding.md)
- [schema：消息与流](./schema.md)（Document MetaData 协议）
- [ext-adapters：eino-ext 适配器模式](./ext-adapters.md)
