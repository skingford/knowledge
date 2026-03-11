---
title: Day 5：RAG 与记忆系统
description: Agent 学习路线第 5 天，理解 RAG、Embedding、Chunking、Retrieval 与短期长期记忆设计。
search: false
---

# Day 5：RAG 与记忆系统

> 7 天 Agent 学习路线 — 第 5 天
>
> 前置阅读：[RAG 基础与工作流](../rag-basics-and-workflow.md)

## 今日目标

- 理解 Embedding 的原理和用途
- 掌握文档切块（Chunking）的常见策略
- 用 ChromaDB 实现本地向量检索
- 了解 Rerank 如何提升检索质量
- 区分短期记忆与长期记忆，并实现对话记忆管理
- 动手给 Agent 接一个简单知识库

## 环境准备

```bash
pip install openai chromadb
```

设置 OpenAI API Key：

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

---

## 1. Embedding 基础

### 什么是 Embedding？

Embedding（向量嵌入）把文本转换为一组浮点数向量。语义相近的文本，向量距离也近。这是整个 RAG 流程的基石——我们靠向量距离来判断"哪些文档和用户问题最相关"。

**为什么重要：**

- 关键词匹配做不到语义理解（"怎么部署" vs "如何上线"）
- Embedding 能捕捉语义相似性，即使措辞完全不同
- 检索质量直接决定了最终生成答案的质量

### 代码：生成 Embedding 并计算相似度

```python
import numpy as np
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """调用 OpenAI 接口获取文本的 Embedding 向量"""
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """计算两个向量的余弦相似度"""
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# ---- 测试语义相似度 ----

texts = [
    "如何部署一个 Python 应用到服务器？",
    "怎么把 Python 项目上线？",
    "今天天气怎么样？",
]

embeddings = [get_embedding(t) for t in texts]

print("文本 0 vs 文本 1（语义相近）:", cosine_similarity(embeddings[0], embeddings[1]))
print("文本 0 vs 文本 2（语义无关）:", cosine_similarity(embeddings[0], embeddings[2]))
```

**预期输出：**

```
文本 0 vs 文本 1（语义相近）: 0.85+
文本 0 vs 文本 2（语义无关）: 0.3x
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| 模型选择 | `text-embedding-3-small` 性价比高，1536 维；`text-embedding-3-large` 精度更高，3072 维 |
| 余弦相似度 | 值域 [-1, 1]，越接近 1 越相似 |
| 批量调用 | `client.embeddings.create(input=[text1, text2, ...])` 支持批量，减少请求次数 |

---

## 2. Chunking 切块

### 为什么要切块？

LLM 的上下文窗口有限，一篇长文档塞不进去。更关键的是，检索时我们需要定位到**具体段落**，而不是整篇文档。切块粒度直接影响检索精度。

### 代码：常见切块策略

```python
def chunk_by_paragraph(text: str) -> list[str]:
    """按段落切块：以空行为分隔"""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return paragraphs

def chunk_by_size(text: str, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    """按固定大小切块，带重叠区域防止语义截断"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap  # 重叠部分保留上下文
    return chunks

# ---- 测试 ----

sample_doc = """RAG 是 Retrieval-Augmented Generation 的缩写。
它的核心思想是先检索外部知识，再让模型基于检索结果生成答案。

RAG 解决的核心问题是模型的知识过时或缺失。
比如公司内部文档、最新的产品手册，模型训练时并没有见过这些内容。

RAG 的基本流程分为三步：
第一步是索引，把文档切块并转成向量存入向量库。
第二步是检索，根据用户问题找到最相关的文档块。
第三步是生成，把检索到的内容和问题一起发给 LLM。"""

print("=== 按段落切块 ===")
for i, chunk in enumerate(chunk_by_paragraph(sample_doc)):
    print(f"[块 {i}] {chunk[:60]}...")

print("\n=== 按固定大小切块（300字符，50字符重叠）===")
for i, chunk in enumerate(chunk_by_size(sample_doc, 300, 50)):
    print(f"[块 {i}] 长度={len(chunk)}, 内容={chunk[:50]}...")
```

### 讲解重点

| 策略 | 优点 | 缺点 |
|------|------|------|
| 按段落 | 保留自然语义边界 | 段落长短不一，可能太长或太短 |
| 固定大小 + 重叠 | 块大小可控 | 可能从句子中间截断 |
| 按 Markdown 标题 | 适合结构化文档 | 依赖文档格式 |

**实际项目建议：** 优先按 Markdown 标题 / 段落切，再对过长的块做二次拆分。重叠 50-100 字符通常够用。

---

## 3. Retrieval 检索

### 向量相似度搜索

把文档块转成向量存入向量库，用户提问时也转成向量，然后做相似度搜索，返回最相关的 Top-K 块。

ChromaDB 是一个轻量级向量数据库，纯 Python，不需要额外启动服务，非常适合本地开发和学习。

### 代码：使用 ChromaDB 实现检索

```python
import chromadb
from openai import OpenAI

client = OpenAI()

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """批量获取 Embedding"""
    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    return [item.embedding for item in response.data]

# ---- 准备文档 ----

documents = [
    "Python 的 virtualenv 可以创建隔离的虚拟环境，避免包冲突。",
    "Docker 容器化部署可以保证开发和生产环境一致。",
    "FastAPI 是一个高性能的 Python Web 框架，支持自动生成 API 文档。",
    "Nginx 常用作反向代理服务器，可以做负载均衡和静态文件服务。",
    "GitHub Actions 可以实现 CI/CD 自动化，每次推送代码自动运行测试和部署。",
    "PostgreSQL 是一个强大的开源关系型数据库，支持 JSON 和全文搜索。",
]

# ---- 创建 ChromaDB 集合并索引 ----

chroma_client = chromadb.Client()  # 内存模式，无需服务器
collection = chroma_client.create_collection(
    name="demo_docs",
    metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
)

# 生成向量并存入
embeddings = get_embeddings(documents)
collection.add(
    ids=[f"doc_{i}" for i in range(len(documents))],
    documents=documents,
    embeddings=embeddings,
)

# ---- 查询 ----

query = "怎么把项目部署到线上？"
query_embedding = get_embeddings([query])[0]

results = collection.query(
    query_embeddings=[query_embedding],
    n_results=3  # 返回最相关的 3 条
)

print(f"查询：{query}\n")
print("检索结果（Top 3）：")
for doc, distance in zip(results["documents"][0], results["distances"][0]):
    print(f"  [{distance:.4f}] {doc}")
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| `chromadb.Client()` | 内存模式，数据不持久化；用 `PersistentClient(path="./db")` 可持久化 |
| `n_results` | 返回的 Top-K 数量，一般取 3-5 |
| `distances` | 使用余弦距离时，值越小越相似（0 = 完全相同） |
| 向量维度 | ChromaDB 自动适配，不需要手动指定 |

---

## 4. Rerank 重排

### 为什么需要 Rerank？

向量检索是"粗筛"，速度快但不够精确。Rerank 是"精排"，对粗筛结果做二次排序，提升最终返回给 LLM 的内容质量。

常见做法：

- 用专门的 Rerank 模型（如 Cohere Rerank、bge-reranker）
- 结合关键词匹配分数加权
- Cross-encoder 对 query-doc 对做精细打分

这里展示一个轻量方案：向量分数 + 关键词命中加权。

### 代码：简单 Rerank 实现

```python
import re

def keyword_score(query: str, document: str) -> float:
    """计算查询关键词在文档中的命中比例"""
    # 简单分词：按非中文/非字母数字字符切分
    keywords = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+', query)
    if not keywords:
        return 0.0
    hits = sum(1 for kw in keywords if kw.lower() in document.lower())
    return hits / len(keywords)

def rerank(query: str, documents: list[str], distances: list[float],
           vector_weight: float = 0.7, keyword_weight: float = 0.3) -> list[dict]:
    """
    结合向量距离分数和关键词命中分数重新排序
    - vector_score: 1 - distance（余弦距离转相似度）
    - keyword_score: 关键词命中比例
    """
    results = []
    for doc, dist in zip(documents, distances):
        v_score = 1 - dist  # 距离越小，相似度越高
        k_score = keyword_score(query, doc)
        combined = vector_weight * v_score + keyword_weight * k_score
        results.append({
            "document": doc,
            "vector_score": round(v_score, 4),
            "keyword_score": round(k_score, 4),
            "combined_score": round(combined, 4),
        })
    results.sort(key=lambda x: x["combined_score"], reverse=True)
    return results

# ---- 测试（接上一节的 collection）----

query = "Docker 部署"
query_embedding = get_embeddings([query])[0]

results = collection.query(query_embeddings=[query_embedding], n_results=5)

reranked = rerank(query, results["documents"][0], results["distances"][0])
print(f"查询：{query}\n")
print("重排后结果：")
for r in reranked:
    print(f"  [综合={r['combined_score']:.4f} | 向量={r['vector_score']:.4f} | 关键词={r['keyword_score']:.4f}]")
    print(f"    {r['document']}")
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| 权重分配 | `vector_weight=0.7, keyword_weight=0.3` 是常见起点，根据场景调整 |
| 关键词匹配的价值 | 向量检索可能漏掉精确术语匹配，关键词补位 |
| 生产级方案 | 推荐用 Cohere Rerank API 或开源的 `bge-reranker`，效果远超手写规则 |

---

## 5. 短期记忆 vs 长期记忆

### 概念对比

| 维度 | 短期记忆 | 长期记忆 |
|------|----------|----------|
| 内容 | 当前对话历史 | 用户偏好、历史摘要、知识库 |
| 生命周期 | 会话级别，对话结束就丢 | 持久化存储，跨会话可用 |
| 实现方式 | 消息列表（滑动窗口/摘要） | 数据库、向量库、文件 |
| 典型问题 | 上下文窗口溢出 | 信息过时、检索噪音 |

### 代码：对话记忆管理（滑动窗口 + 摘要）

```python
from openai import OpenAI

client = OpenAI()

class ConversationMemory:
    """
    对话记忆管理器
    - 保留最近 N 轮完整对话（滑动窗口）
    - 更早的对话压缩成摘要（长期记忆）
    """
    def __init__(self, window_size: int = 5, model: str = "gpt-4o-mini"):
        self.window_size = window_size
        self.model = model
        self.messages: list[dict] = []  # 全部历史
        self.summary: str = ""          # 早期对话的摘要

    def add_message(self, role: str, content: str):
        """添加一条消息"""
        self.messages.append({"role": role, "content": content})
        # 当消息数超过窗口大小的 2 倍时，压缩旧消息
        if len(self.messages) > self.window_size * 2:
            self._compress()

    def _compress(self):
        """把窗口外的旧消息压缩成摘要"""
        old_messages = self.messages[:-self.window_size]
        recent_messages = self.messages[-self.window_size:]

        # 用 LLM 生成摘要
        conversation_text = "\n".join(
            f"{m['role']}: {m['content']}" for m in old_messages
        )
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "请用 2-3 句话概括以下对话的要点："},
                {"role": "user", "content": conversation_text},
            ],
            max_tokens=200,
        )
        self.summary = response.choices[0].message.content
        self.messages = recent_messages
        print(f"[记忆压缩] 摘要：{self.summary}")

    def get_context_messages(self, system_prompt: str) -> list[dict]:
        """构建发给 LLM 的完整消息列表"""
        context = [{"role": "system", "content": system_prompt}]

        # 如果有摘要，注入为系统上下文
        if self.summary:
            context.append({
                "role": "system",
                "content": f"以下是之前对话的摘要：{self.summary}"
            })

        # 加上最近的消息
        context.extend(self.messages)
        return context

# ---- 使用示例 ----

memory = ConversationMemory(window_size=4)

# 模拟多轮对话
exchanges = [
    ("user", "我想学 Python"),
    ("assistant", "很好！你有编程基础吗？"),
    ("user", "有一些 JavaScript 基础"),
    ("assistant", "那上手会很快。建议从基础语法和数据结构开始。"),
    ("user", "有推荐的学习资源吗？"),
    ("assistant", "推荐《Python Crash Course》和官方教程。"),
    ("user", "我更想做 Web 开发"),
    ("assistant", "那可以学 FastAPI 或 Django。"),
    ("user", "FastAPI 和 Django 有什么区别？"),
    ("assistant", "FastAPI 轻量高性能，Django 全功能带 ORM 和 Admin。"),
]

for role, content in exchanges:
    memory.add_message(role, content)

# 查看构建的上下文
context = memory.get_context_messages("你是一个编程学习助手。")
print(f"\n最终上下文消息数：{len(context)}")
for msg in context:
    print(f"  [{msg['role']}] {msg['content'][:60]}...")
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| 滑动窗口 | 保留最近 N 条消息，简单有效 |
| 摘要压缩 | 用 LLM 把旧对话压成几句话，节省 token |
| 触发时机 | 消息数 > 窗口的 2 倍时自动压缩，避免频繁调用 |
| 长期记忆扩展 | 可以把摘要存到数据库或文件，下次会话加载回来 |

---

## 6. 实操：给 Agent 接一个简单知识库

把前面学到的所有模块串起来，实现一个完整的 RAG 问答 Agent。

### 完整代码

```python
"""
Day 5 实操：带知识库的 RAG Agent
流程：加载文档 → 切块 → Embedding → 存入向量库 → 检索 → 生成回答
"""
import re
import chromadb
from openai import OpenAI

client = OpenAI()

# ==============================
# 第一步：加载文档
# ==============================

# 模拟几篇 Markdown 文档的内容
MOCK_DOCUMENTS = {
    "fastapi-guide.md": """
# FastAPI 入门指南

FastAPI 是一个现代的 Python Web 框架，基于 Starlette 和 Pydantic 构建。
它的核心特点是高性能、自动生成 API 文档、以及对类型提示的原生支持。

## 安装

使用 pip 安装：
pip install fastapi uvicorn

## 快速开始

创建一个 main.py 文件：

from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

启动服务：uvicorn main:app --reload

## 路由和参数

FastAPI 支持路径参数、查询参数和请求体。
路径参数直接写在路由装饰器中，如 @app.get("/items/{item_id}")。
查询参数通过函数参数自动识别。
请求体使用 Pydantic 模型定义。

## 数据库集成

FastAPI 常配合 SQLAlchemy 或 Tortoise ORM 使用。
推荐使用异步 ORM 以发挥 FastAPI 的异步性能优势。
""",
    "docker-basics.md": """
# Docker 基础教程

Docker 是一个容器化平台，可以将应用及其依赖打包成容器运行。

## 核心概念

镜像（Image）：应用的只读模板，包含代码和运行环境。
容器（Container）：镜像的运行实例，可以启动、停止、删除。
Dockerfile：定义如何构建镜像的文本文件。

## 常用命令

docker build -t myapp .    # 构建镜像
docker run -p 8000:8000 myapp  # 运行容器
docker ps                  # 查看运行中的容器
docker stop <container_id> # 停止容器

## Dockerfile 编写

一个 Python 项目的 Dockerfile 示例：
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]

## Docker Compose

多容器编排使用 docker-compose.yml。
可以同时定义 Web 服务、数据库、Redis 等。
""",
    "deployment-guide.md": """
# 部署指南

将应用部署到生产环境需要考虑多个方面。

## 部署方式对比

传统部署：直接在服务器上安装依赖运行，简单但难以复现环境。
容器化部署：用 Docker 打包，环境一致性好。
Serverless：适合轻量接口，按调用计费。
PaaS 平台：如 Railway、Fly.io，简化运维。

## CI/CD 流程

推荐使用 GitHub Actions 实现自动化部署：
1. 代码推送到 main 分支触发流水线
2. 自动运行测试
3. 构建 Docker 镜像
4. 推送到镜像仓库
5. 部署到服务器

## 监控和日志

生产环境必须配置：
- 日志收集（如 ELK、Loki）
- 性能监控（如 Prometheus + Grafana）
- 错误告警（如 Sentry）
- 健康检查端点
""",
}


# ==============================
# 第二步：切块
# ==============================

def chunk_document(name: str, content: str, chunk_size: int = 300, overlap: int = 50) -> list[dict]:
    """
    对文档进行切块
    策略：先按段落切，再对过长段落做二次拆分
    """
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    chunks = []

    for para in paragraphs:
        if len(para) <= chunk_size:
            chunks.append({"source": name, "content": para})
        else:
            # 对过长段落做固定大小拆分
            start = 0
            while start < len(para):
                end = start + chunk_size
                chunk_text = para[start:end]
                chunks.append({"source": name, "content": chunk_text})
                start = end - overlap

    return chunks


# 对所有文档切块
all_chunks = []
for name, content in MOCK_DOCUMENTS.items():
    all_chunks.extend(chunk_document(name, content))

print(f"共生成 {len(all_chunks)} 个文档块")


# ==============================
# 第三步：Embedding + 存入向量库
# ==============================

def get_embeddings(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(input=texts, model="text-embedding-3-small")
    return [item.embedding for item in response.data]


# 创建 ChromaDB 集合
chroma_client = chromadb.Client()
collection = chroma_client.create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"}
)

# 批量索引
chunk_texts = [c["content"] for c in all_chunks]
chunk_sources = [c["source"] for c in all_chunks]
embeddings = get_embeddings(chunk_texts)

collection.add(
    ids=[f"chunk_{i}" for i in range(len(all_chunks))],
    documents=chunk_texts,
    embeddings=embeddings,
    metadatas=[{"source": s} for s in chunk_sources],
)

print(f"已索引 {len(all_chunks)} 个文档块到向量库")


# ==============================
# 第四步：检索 + Rerank
# ==============================

def keyword_score(query: str, document: str) -> float:
    keywords = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+', query)
    if not keywords:
        return 0.0
    hits = sum(1 for kw in keywords if kw.lower() in document.lower())
    return hits / len(keywords)


def retrieve(query: str, top_k: int = 3) -> list[dict]:
    """检索最相关的文档块，带 Rerank"""
    query_embedding = get_embeddings([query])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k * 2,  # 多取一些，留给 rerank 筛选
        include=["documents", "distances", "metadatas"],
    )

    # Rerank
    ranked = []
    for doc, dist, meta in zip(
        results["documents"][0],
        results["distances"][0],
        results["metadatas"][0],
    ):
        v_score = 1 - dist
        k_score = keyword_score(query, doc)
        combined = 0.7 * v_score + 0.3 * k_score
        ranked.append({
            "content": doc,
            "source": meta["source"],
            "score": combined,
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked[:top_k]


# ==============================
# 第五步：生成回答
# ==============================

def answer_question(question: str) -> str:
    """完整的 RAG 问答流程"""
    # 检索相关文档
    relevant_chunks = retrieve(question, top_k=3)

    # 构建上下文
    context = "\n\n---\n\n".join(
        f"[来源: {c['source']}]\n{c['content']}" for c in relevant_chunks
    )

    # 调用 LLM 生成回答
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "你是一个技术文档助手。根据提供的参考资料回答用户问题。\n"
                    "规则：\n"
                    "1. 只基于参考资料回答，不要编造信息\n"
                    "2. 如果参考资料不足以回答，明确告知用户\n"
                    "3. 回答要简洁清晰，可以使用要点列表\n"
                    "4. 在回答末尾注明信息来源"
                ),
            },
            {
                "role": "user",
                "content": f"参考资料：\n{context}\n\n问题：{question}",
            },
        ],
        max_tokens=500,
    )

    return response.choices[0].message.content


# ==============================
# 第六步：运行测试
# ==============================

if __name__ == "__main__":
    test_questions = [
        "FastAPI 怎么安装和启动？",
        "Docker 有哪些常用命令？",
        "怎么实现自动化部署？",
    ]

    for q in test_questions:
        print(f"\n{'='*60}")
        print(f"问题：{q}")
        print(f"{'='*60}")

        # 展示检索结果
        chunks = retrieve(q)
        print("\n检索到的相关文档块：")
        for i, c in enumerate(chunks):
            print(f"  [{i+1}] [{c['source']}] (分数: {c['score']:.4f})")
            print(f"      {c['content'][:80]}...")

        # 生成回答
        answer = answer_question(q)
        print(f"\n回答：\n{answer}")
```

### 代码流程图

```
用户提问
  │
  ▼
生成 Query Embedding
  │
  ▼
ChromaDB 向量检索 (Top-K×2)
  │
  ▼
Rerank 重排 (向量分 + 关键词分)
  │
  ▼
取 Top-K 结果构建上下文
  │
  ▼
System Prompt + 上下文 + 问题 → LLM
  │
  ▼
返回回答
```

### 讲解重点

| 模块 | 关键设计决策 |
|------|-------------|
| 切块 | 先按段落，再对长段落二次拆分，保留语义完整性 |
| 检索 | 多取 2 倍候选，给 Rerank 留空间 |
| Rerank | 向量 0.7 + 关键词 0.3 的简单加权 |
| Prompt | 明确要求"只基于参考资料"，减少幻觉 |
| 来源追溯 | 每个 chunk 带 `source` 元数据，方便溯源 |

---

## 今日总结

| 模块 | 核心要点 |
|------|----------|
| Embedding | 文本转向量，语义搜索的基础 |
| Chunking | 粒度决定检索质量，段落切 + 大小兜底 |
| Retrieval | ChromaDB 本地向量库，Top-K 召回 |
| Rerank | 向量粗筛 + 关键词精排，提升准确率 |
| 记忆管理 | 滑动窗口保近期，摘要存远期 |
| RAG 流程 | 索引 → 检索 → Rerank → 注入上下文 → 生成 |

## 下一步

- Day 6 将学习 Agent 工具调用与规划能力
- 深入了解 RAG 理论请阅读：[RAG 基础与工作流](../rag-basics-and-workflow.md)
