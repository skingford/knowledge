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

详细内容见 [Prompt Engineering 实践指南](./prompt-engineering.md)。

---

## PromptOps / 实验管理

| 知识点 | 说明 |
|--------|------|
| Prompt 版本化 | 把 prompt、few-shot、上下文模板当成可追踪资产 |
| A/B 实验 | 在真实流量中比较不同版本 |
| 影子流量 | 不影响用户输出地验证新版本行为 |
| 回滚策略 | 让失败实验能快速撤回 |

详细内容见 [Prompt 版本化、实验与回滚](./prompt-versioning-experiments-and-rollbacks.md)。

---

## Context Engineering

| 知识点 | 说明 |
|--------|------|
| 上下文选择 | 决定哪些信息应该进入当前推理链路 |
| 上下文排序 | 重要信息优先放在模型更容易关注的位置 |
| Token 预算 | 给系统指令、历史记录、检索结果分配窗口预算 |
| 动态组装 | 根据任务意图拼接 RAG、工具结果、记忆摘要 |
| Grounding | 让回答尽量基于外部证据，而不是参数记忆猜测 |

详细内容见 [Context Engineering 实践指南](./context-engineering.md)。

---

## Harness Engineering

| 知识点 | 说明 |
|--------|------|
| 运行循环 | 控制 Agent 何时继续、停止、回退或交给人工 |
| 工具运行时 | 处理工具注册、参数校验、超时、重试和权限 |
| 状态管理 | 保存任务状态、对话状态、摘要和检查点 |
| 安全边界 | 注入防护、审批流、沙箱和最小权限控制 |
| 可观测性 | 记录日志、Trace、成本、失败样本和回放信息 |

详细内容见 [Harness Engineering 实践指南](./harness-engineering.md)。

---

## Memory / 状态管理

| 知识点 | 说明 |
|--------|------|
| 工作记忆 | 当前一步推理或当前阶段的临时状态 |
| 会话摘要 | 压缩本轮对话历史，保留目标、约束、待办 |
| 用户记忆 | 用户偏好、角色、长期稳定信息 |
| 任务状态 | 步骤进度、检查点、产物引用、失败原因 |
| 遗忘策略 | TTL、更新时间、覆盖规则、纠错机制 |

详细内容见 [Agent Memory 设计与状态管理](./memory-design-and-state-management.md)。

---

## Multi-Agent / 路由

| 知识点 | 说明 |
|--------|------|
| Router | 根据任务类型把请求分给不同 specialist |
| Handoff | 在 Agent 之间切换主导权，而不是只调用工具 |
| Supervisor-Worker | 一个主管负责任务拆解与调度，多个执行者负责落地 |
| Reviewer-Writer | 生成与审校分离，减少一个 Agent 身兼多职 |
| 权限切分 | 不同 Agent 绑定不同工具、预算、审批边界 |

详细内容见 [Multi-Agent、Handoff 与路由边界](./multi-agent-handoff-and-routing.md)。

---

## Skills / 可复用能力沉淀

| 知识点 | 说明 |
|--------|------|
| Skill 定义 | 把高频任务的经验、步骤、模板和约束沉淀成可复用资产 |
| 触发条件 | 明确什么场景该启用 skill，避免“有 skill 但用不上” |
| 目录结构 | `SKILL.md`、参考资料、模板、脚本的职责边界 |
| 与 Prompt / Tool 的区别 | Skill 复用方法，Prompt 约束当前任务，Tool 负责真正执行 |
| 团队沉淀 | 把 review、发布、排障等 SOP 版本化进仓库 |

详细内容见 [Agent Skill 设计与实践](./skill-design-and-practice.md)。

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

## 协议与接入

| 知识点 | 说明 |
|--------|------|
| MCP | 标准化工具和资源接入方式 |
| Client / Server | 宿主与能力提供方的边界 |
| Resource vs Tool | 读上下文和执行动作的区分 |
| 接入标准化 | 让工具定义更容易跨宿主复用 |

详细内容见 [MCP 协议与工具接入](./mcp-protocol-and-tool-integration.md)。

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

## 知识系统协同

| 知识点 | 说明 |
|--------|------|
| 模型职责 | 负责理解、归纳、选择和生成 |
| 工具职责 | 负责读取实时世界、执行动作、写入外部系统 |
| 知识库职责 | 负责提供外部事实、文档依据、组织知识 |
| 工作流职责 | 负责步骤控制、失败恢复、审批和预算 |
| 协同边界 | 什么时候该直接回答，什么时候该检索或调工具 |

详细内容见 [模型、工具与知识库协同设计](./model-tool-knowledge-collaboration.md)。

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

进一步阅读：

- [Agent 框架选型对比：LangGraph、LangChain、LlamaIndex、AutoGen、原生 SDK](./framework-selection-and-comparison.md)
- [Agent横向对比：OpenClaw、Hermes-Agent、Claude Code、Codex](./coding-agents-comparison.md)

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

进一步阅读：

- [向量数据库选型：pgvector、Milvus、Weaviate、Qdrant](./vector-database-selection.md)

---

## 模型调优边界

| 知识点 | 说明 |
|--------|------|
| Prompt 优先 | 很多问题应先通过 Prompt 与约束解决 |
| Context / RAG 优先 | 缺知识和依据通常不是微调问题 |
| Tool / Workflow 优先 | 工具执行和多步稳定性更像系统问题 |
| Fine-tuning 适用 | 稳定格式、风格、分类、抽取等任务 |
| 风险与成本 | 数据准备、版本管理、回归与漂移监控 |

详细内容见 [Fine-tuning 边界与适用场景](./fine-tuning-boundaries.md)。

---

## Guardrails / 治理

| 知识点 | 说明 |
|--------|------|
| 拒答 / 阻断 | 某些请求不应继续进入危险路径 |
| 审批 / 确认 | 高风险动作需要人或规则确认 |
| 权限隔离 | 只读、可写、高风险工具分层 |
| 沙箱执行 | 代码、文件、命令等危险能力在隔离环境中跑 |

详细内容见 [Guardrails、审批与沙箱边界](./guardrails-approvals-and-sandboxing.md)。

---

## 模型路由 / 成本控制

| 知识点 | 说明 |
|--------|------|
| 任务分级 | 路由、抽取、规划、审核适合不同模型层级 |
| 预算控制 | 每任务、每路径、每工具预算上限 |
| 降级策略 | 超预算或高延迟时如何切换模型或转人工 |
| 成本回归 | 改路由后同时看质量、延迟和成本 |

详细内容见 [模型路由与成本控制](./model-routing-and-cost-control.md)。

---

## Human-in-the-loop

| 知识点 | 说明 |
|--------|------|
| 人工接管 | 系统不应继续主导时交给人处理 |
| 人工审批 | 动作可以做，但必须先确认 |
| 人工校对 | 先机器产出，再由人审阅 |
| 交接包 | 把任务目标、状态、失败点和证据交给人 |

详细内容见 [Human-in-the-loop、人工接管与升级策略](./human-in-the-loop-and-escalation.md)。

---

## 性能优化

| 知识点 | 说明 |
|--------|------|
| 响应缓存 | 复用高频稳定结果 |
| 语义缓存 | 近似问题命中近似结果 |
| 上下文压缩 | 缩短 token、减少噪音、提升稳定性 |
| 并发控制 | 给工具、模型和长任务分级限流 |
| 流式输出 | 优化用户体感，不只优化总耗时 |

详细内容见 [Agent 缓存、延迟与吞吐优化](./caching-latency-and-throughput-optimization.md)。

---

## 评估与监控

| 工具 | 用途 |
|------|------|
| **promptfoo** | Prompt 评测与回归测试 |
| **LangSmith** | LangChain 生态的 Trace、评测与监控 |
| **Weights & Biases (W&B)** | 实验追踪、模型评估、可视化 |
| **日志追踪** | 自定义日志 + OpenTelemetry，记录 Tool 调用、Token 消耗、延迟 |

进一步可以继续补：

- [Agent Eval 设计与回归实践](./eval-design-and-regression.md)
- [Agent 可观测性、回放与故障复盘](./observability-replay-and-incident-review.md)

---

## 数据集 / 合成数据

| 知识点 | 说明 |
|--------|------|
| 失败样本沉淀 | 把线上失败、人工接管和异常轨迹收回数据集 |
| 标注规范 | 明确预期行为、通过规则、风险等级和引用依据 |
| 合成扩样 | 用真实样本做种子补覆盖、补扰动、补长尾 |
| 数据版本 | 管理样本来源、标注口径和关联系统版本 |

详细内容见 [Agent 数据集构建、标注与合成数据](./dataset-curation-labeling-and-synthetic-data.md)。

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

进一步阅读：

- [Agent 产品化 Checklist](./agent-productization-checklist.md)

---

## 长任务 / 队列执行

| 知识点 | 说明 |
|--------|------|
| 异步执行 | 长任务不应继续塞在单次请求里 |
| 队列与 worker | 解耦入口请求和实际执行 |
| 检查点恢复 | 从中间步骤续跑，而不是失败后整条重来 |
| 幂等与补偿 | 避免重复副作用，控制失败后的恢复动作 |

详细内容见 [Agent 长任务、队列与检查点恢复](./long-running-agents-queues-and-checkpointing.md)。

---

## 发布治理 / 灰度回滚

| 知识点 | 说明 |
|--------|------|
| 变更包 | Prompt、模型、工具、知识库和 workflow 一起管理 |
| 影子流量 | 先看真实行为偏差，不直接影响用户输出 |
| 灰度策略 | 先低风险场景，再逐步扩大流量 |
| 回滚闸门 | 提前定义回滚阈值和整包回退方式 |

详细内容见 [Agent 灰度发布、变更管理与回滚](./release-strategies-change-management-and-rollbacks.md)。

---

## 本地知识库工程

| 知识点 | 说明 |
|--------|------|
| 数据清洗 | 去噪、统一格式、保留结构信息 |
| 切块策略 | 结构切块、窗口切块、混合切块 |
| 元信息设计 | 标题路径、来源、时间、文档类型 |
| 索引更新 | 增量更新、替换旧块、版本管理 |
| 召回评测 | 看是否命中正确块，而不是只看最终回答 |

详细内容见 [本地知识库构建实践](./local-knowledge-base-practice.md)。

---

## 复盘与自检

| 知识点 | 说明 |
|--------|------|
| 失败分类 | Prompt、Context、Tool、Workflow、权限、Eval 六类常见问题 |
| 复盘模板 | 现象、归因、修复、回归样本沉淀 |
| 自检题 | 用真实判断题检查自己是否真的会做取舍 |
| 能力分层 | 入门、进阶、工程化、可带人 |

进一步阅读：

- [Agent 常见失败案例复盘](./agent-failure-postmortems.md)
- [Agent 能力自检题与案例](./agent-self-check-and-cases.md)

---

## 参考

- 完整学习路径：[Agent 学习综合指南](./agent-learning-guide.md)
- 7 天实操计划：[7 天 Agent 学习路线](./agent-learning-roadmap.md)
- Tool Calling 设计：[Tool Calling 设计清单](./tool-calling-design-checklist.md)
- RAG 详解：[RAG 基础与工作流](./rag-basics-and-workflow.md)
- 协同设计：[模型、工具与知识库协同设计](./model-tool-knowledge-collaboration.md)
- Fine-tuning 边界：[Fine-tuning 边界与适用场景](./fine-tuning-boundaries.md)
- Memory 设计：[Agent Memory 设计与状态管理](./memory-design-and-state-management.md)
- Multi-Agent 设计：[Multi-Agent、Handoff 与路由边界](./multi-agent-handoff-and-routing.md)
- 评测与回归：[Agent Eval 设计与回归实践](./eval-design-and-regression.md)
- 观测与回放：[Agent 可观测性、回放与故障复盘](./observability-replay-and-incident-review.md)
- 向量数据库选型：[向量数据库选型：pgvector、Milvus、Weaviate、Qdrant](./vector-database-selection.md)
- MCP 协议：[MCP 协议与工具接入](./mcp-protocol-and-tool-integration.md)
- Guardrails：[Guardrails、审批与沙箱边界](./guardrails-approvals-and-sandboxing.md)
- 模型路由：[模型路由与成本控制](./model-routing-and-cost-control.md)
- Prompt 实验：[Prompt 版本化、实验与回滚](./prompt-versioning-experiments-and-rollbacks.md)
- 人工接管：[Human-in-the-loop、人工接管与升级策略](./human-in-the-loop-and-escalation.md)
- 性能优化：[Agent 缓存、延迟与吞吐优化](./caching-latency-and-throughput-optimization.md)
- 数据集构建：[Agent 数据集构建、标注与合成数据](./dataset-curation-labeling-and-synthetic-data.md)
- 长任务执行：[Agent 长任务、队列与检查点恢复](./long-running-agents-queues-and-checkpointing.md)
- 灰度发布：[Agent 灰度发布、变更管理与回滚](./release-strategies-change-management-and-rollbacks.md)
- 框架选型：[Agent 框架选型对比：LangGraph、LangChain、LlamaIndex、AutoGen、原生 SDK](./framework-selection-and-comparison.md)
- Agent对比：[Agent横向对比：OpenClaw、Hermes-Agent、Claude Code、Codex](./coding-agents-comparison.md)
- 产品化清单：[Agent 产品化 Checklist](./agent-productization-checklist.md)
- 本地知识库：[本地知识库构建实践](./local-knowledge-base-practice.md)
- 失败复盘：[Agent 常见失败案例复盘](./agent-failure-postmortems.md)
- 能力自检：[Agent 能力自检题与案例](./agent-self-check-and-cases.md)
