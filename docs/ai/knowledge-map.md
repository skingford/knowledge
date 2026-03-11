---
title: LLM Agent 工程师必学知识地图
description: LLM 与 Agent 工程师知识地图，帮助快速建立模型、工具、RAG、评测与工程实践全局认知。
---

# LLM Agent 工程师必学知识地图

> 速查表：按类别列出核心概念与工具，适合入门时建立全局认知，也适合进阶时按类补缺。

---

## LLM 基础

| 知识点 | 说明 |
|--------|------|
| Transformer | 注意力机制、编码器/解码器结构 |
| 大模型能力边界 | 推理、幻觉、知识截止、上下文限制 |
| Token | 分词方式、Token 计数、成本计算 |
| Temperature | 输出随机性控制 |
| Context Window | 最大可处理 token 数，影响对话长度和 RAG 设计 |

---

## Prompt Engineering

| 知识点 | 说明 |
|--------|------|
| 角色设定 | 用 System Prompt 明确模型身份与能力边界 |
| 约束与负面约束 | 明确告知"不要做什么"往往比"要做什么"更稳定 |
| 输出格式控制 | JSON Schema、Markdown、表格 |
| Few-shot | 提供 2-3 个输入输出示例 |
| 思维链控制（CoT） | 让模型先分析再作答，适合复杂推理 |

---

## API 使用

| 工具 / 概念 | 说明 |
|-------------|------|
| OpenAI API | Tool Calling、Structured Outputs、Responses API |
| Anthropic API | Tool Use、Extended Thinking |
| 国产模型 API | 通义千问、DeepSeek、智谱 GLM 等 |
| 流式输出（Streaming） | SSE / WebSocket，适合实时返回结果 |
| 函数调用（Function Calling） | 模型选择并触发工具的核心机制 |
| JSON Schema | 约束结构化输出格式 |

---

## 向量检索（RAG 基础）

| 知识点 | 说明 |
|--------|------|
| Embedding | 文本转向量，用于语义检索 |
| Chunking | 文档切块策略，影响检索精度 |
| Rerank | 对召回结果二次排序，提升命中率 |
| Hybrid Search | 关键词检索 + 向量检索组合 |

详细内容见 [RAG 基础与工作流](./rag-basics-and-workflow.md)。

---

## Agent 框架

| 框架 | 定位 |
|------|------|
| **LangGraph** | 工程化入门首选，有状态 Agent、节点编排、人工介入 |
| **LangChain** | 生态广，组件丰富，适合快速原型 |
| **LlamaIndex** | 偏 RAG / 知识库方向，检索生态完整 |
| **AutoGen** | 多 Agent 协作，微软出品 |
| **OpenAI Agents SDK** | OpenAI 官方 Agent 框架，轻量，适合 OpenAI 生态 |
| **OpenClaw** | 开源 Agent 框架 |
| **原生 SDK** | 直接用各家 SDK 手写 Agent，更容易理解本质 |

---

## 后端基础

| 知识点 / 工具 | 说明 |
|---------------|------|
| Python / TypeScript | Agent 开发主流语言，二选一入门 |
| FastAPI | Python 异步 Web 框架，适合 Agent 服务接口 |
| Node.js | TypeScript 生态，适合前后端一体项目 |
| 异步编程 | async/await，Agent 中工具调用通常并发执行 |
| 消息队列 | 长任务异步处理（如 BullMQ、Celery） |
| 缓存 | 减少重复 LLM 调用成本（Redis、内存缓存） |

---

## 数据存储

| 类别 | 工具 |
|------|------|
| 关系型数据库 | PostgreSQL（可搭配 pgvector 做向量检索） |
| 缓存 | Redis |
| 向量数据库 | Milvus、Weaviate、Qdrant、pgvector |

**选型建议**：已有 Postgres 的项目优先考虑 pgvector；需要大规模向量检索再考虑 Milvus / Qdrant。

---

## 评估与监控

| 工具 | 用途 |
|------|------|
| **promptfoo** | Prompt 评测与回归测试 |
| **LangSmith** | LangChain 生态的 Trace、评测与监控 |
| **Weights & Biases (W&B)** | 实验追踪、模型评估、可视化 |
| **日志追踪** | 自定义日志 + OpenTelemetry，记录 Tool 调用、Token 消耗、延迟 |

评测方法详见 [Agent 学习综合指南 - Eval 评测基本方法](./agent-learning-guide.md#eval-评测基本方法)。

---

## 安全

| 风险点 | 说明 |
|--------|------|
| 提示注入（Prompt Injection） | 用户输入覆盖 System Prompt，操控模型行为 |
| 越权调用 | 工具权限未收紧，模型调用超出业务范围的操作 |
| 敏感信息泄露 | 上下文中包含 API Key、用户隐私数据等 |
| 工具权限控制 | 每个工具只授权最小必要权限，避免"万能工具" |

---

## 部署

| 知识点 / 工具 | 说明 |
|---------------|------|
| Docker | 容器化，保证环境一致性 |
| Vercel | 前端 + 轻量后端，适合快速上线 |
| Cloud Run | Google Cloud，按请求计费，适合 Agent 服务 |
| Fly.io | 轻量 PaaS，适合小规模部署 |
| CI/CD | GitHub Actions 等，自动化测试与部署 |
| 可观测性 | 日志、Trace、指标监控，生产环境必备 |

---

## 参考

- 完整学习路径：[Agent 学习综合指南](./agent-learning-guide.md)
- 7 天实操计划：[7 天 Agent 学习路线](./agent-learning-roadmap.md)
- Tool Calling 设计：[Tool Calling 设计清单](./tool-calling-design-checklist.md)
- RAG 详解：[RAG 基础与工作流](./rag-basics-and-workflow.md)
