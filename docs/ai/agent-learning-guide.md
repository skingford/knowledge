---
title: Agent 学习综合指南
description: 面向工程师的 Agent 学习主线，覆盖 LLM、Tool Calling、RAG、Workflow、Eval 与实践路径。
---

# Agent 学习综合指南

## 适合人群

- 想系统入门 AI 应用开发，但概念容易混在一起的初学者
- 已经知道 LLM、Agent、RAG 这些词，但不清楚先后顺序的人
- 需要一条从"懂模型"到"做系统"的学习主线
- 已经会调用 LLM API，但不清楚下一步该补什么的人

## 学习目标

- 把学习路径拆成 LLM 和 Agent 两部分来理解
- 先懂模型能力边界，再懂如何把模型接成可工作的系统
- 建立从概念、框架到实战的完整学习顺序

## 快速导航

- [LLM Agent 工程师的核心工作](#llm-agent-工程师的核心工作)
- [为什么分成 LLM 和 Agent 两部分学](#为什么分成-llm-和-agent-两部分学)
- [第一阶段：LLM 基础](#第一阶段llm-基础)
- [第二阶段：Agent 核心 5 个概念](#第二阶段agent-核心-5-个概念)
- [为什么先学工作流型 Agent](#为什么先学工作流型-agent)
- [第三阶段：工程化能力](#第三阶段工程化能力)
- [三者的演进关系](#三者的演进关系)
- [三个专题入口](#三个专题入口)
- [Eval 评测基本方法](#eval-评测基本方法)
- [推荐学习顺序](#推荐学习顺序)
- [推荐学习资料](#推荐学习资料)
- [推荐技术栈](#推荐技术栈)
- [推荐框架](#推荐框架)
- [练手项目建议](#练手项目建议)
- [Multi-Agent 入门](#multi-agent-入门)
- [判断是否真正入门](#判断是否真正入门)
- [常见误区](#常见误区)
- [实用建议](#实用建议)

---

## LLM Agent 工程师的核心工作

**核心定位**：LLM Agent 工程师的核心不是"训练大模型"，而是"让大模型稳定地完成任务"。

**典型工作内容**：

- 提示词设计（Prompt Engineering）
- 上下文工程（Context Engineering）
- 工具调用设计（Tool Calling）
- 工作流编排（Workflow Orchestration）
- 运行底座设计（Harness Engineering）
- 记忆与检索（Memory / RAG）
- 评测与改进（Evaluation）
- 上线部署（Deployment）
- 成本与安全控制（Cost / Guardrails）

**通俗理解**：你是在做"大模型驱动的软件系统"，而不只是聊天机器人。

**关键词速览**：`Prompt` · `Context` · `Tool Use` · `RAG` · `Agent Loop` · `Workflow` · `Runtime` · `Evaluation` · `Guardrails` · `Observability`

---

## 为什么分成 LLM 和 Agent 两部分学

先学 LLM，再学 Agent。原因很直接：

- 不懂模型能力边界，就很难设计对的 Agent 工作流
- 不懂上下文窗口、结构化输出、工具调用，就容易把问题都归因于 Prompt
- Agent 不是单纯"套壳聊天"，而是把模型接进工具、状态、记忆、流程里的系统

因此更稳的方式是：先懂模型，再懂怎么把模型接成可工作的系统。

---

## 第一阶段：LLM 基础

### 前置技能

- **实现语言**：Python 或 TypeScript 二选一，不要一开始两门都学
- **HTTP / API 调用**：理解请求、响应、鉴权、超时、重试，会调用 REST API 或 SDK

### Transformer 基础

- 注意力机制
- Token
- 上下文窗口

### Prompting

- System Prompt、User Prompt
- Zero-shot、Few-shot
- Chain-of-thought 的使用边界
- 约束输出格式

### Function Calling / Structured Output

- 这是做 Agent 的关键基础
- 重点理解模型如何输出结构化数据，而不是只吐自然语言
- JSON Schema、Tool 参数约束

### RAG 基础

- 检索、切块、Embedding、Rerank
- 让 Agent 结合外部知识工作

### Fine-tuning 基础

- 先知道适用场景即可
- 一开始不必急着训练模型

---

## 第二阶段：Agent 核心 5 个概念

### 1. LLM（模型）

- 模型负责理解输入、生成输出、决定是否调用能力
- 需要知道模型的上下文窗口、输出约束、成本和延迟边界

### 2. Tools（工具调用）

- Tool Calling / Function Calling 是 Agent 真正"能做事"的基础
- 工具让模型可以搜索、查天气、访问数据库、调用脚本
- 模型怎么决定何时调 API、搜索、数据库、脚本

### 3. Memory（记忆与上下文）

- 短期上下文解决当前会话连续性
- 长期记忆解决用户偏好、历史事实、跨任务信息复用
- 很多所谓"记忆"问题，本质上是上下文管理问题

### 4. Planning（任务规划）

- 把复杂任务拆成多步
- 让 Agent 从"单次回答"变成"分步骤执行"

### 5. Workflow（工作流与状态机）

- 把步骤放进稳定可控的流程里
- 用于控制状态、路由、重试、失败兜底和人工接管
- 固定流程、状态机、人工兜底

### 工程师视角：最核心的 5 件技能

从"要学会做什么"的角度看，第二阶段对应 5 项工程能力：

| 技能 | 核心目标 |
|------|----------|
| **Prompt Engineering** | 写出稳定、可控、可测试的提示词 |
| **Tool Calling** | 让模型调用搜索、数据库、代码执行、浏览器等工具 |
| **RAG** | 让模型基于外部知识回答，而不是纯靠参数记忆 |
| **Workflow / Orchestration** | 多步骤任务编排，控制状态、路由、重试与兜底 |
| **Evaluation** | 量化判断 Agent 效果是否真的变好了 |

进入实际工程阶段后，很多团队还会把 **Context Engineering** 和 **Harness Engineering** 单独拎出来看，因为这两者分别负责"信息怎么进模型"和"系统怎么把任务跑稳"。后文会单独展开。

---

## 为什么先学工作流型 Agent

入门最好先学工作流型 Agent，先做"调用模型 -> 调工具 -> 解析结果 -> 决策下一步"这类确定性流程。先把单 Agent + 多工具做稳定，再碰多代理自治。

这样做的原因：

- 更容易调试
- 更容易加日志和失败兜底
- 更容易做评测
- 更接近真实工程落地

::: tip 建议
真正能落地的 Agent，通常不是"超级自治体"。更常见、也更可靠的形态是：LLM + 工具 + 工作流 + 人工兜底。这比"完全放养式自治"更容易调试、评测、上线和控制风险。
:::

---

## 第三阶段：工程化能力

### RAG 进阶

- 切块策略
- 召回与重排：提高命中率，减少幻觉
- 上下文拼接
- 知识库构建：Markdown、PDF、数据库

### 评测 / Evals

- 正确率、稳定性、幻觉率、工具成功率
- 详见 [Eval 评测基本方法](#eval-评测基本方法)

### 可观测性

- 日志、Trace、Token / 成本统计
- 失败率、延迟监控

### 安全

- Prompt Injection
- 工具权限边界
- 数据泄露风险

---

## 三者的演进关系

很多人会把 Prompt Engineering、Context Engineering、Harness Engineering 看成三个并列概念，但更准确的理解是：它们代表了 Agent 工程控制面的逐层外移。

- **Prompt Engineering**：先解决"模型怎么理解指令、按什么格式输出"
- **Context Engineering**：再解决"模型做决定前，到底看到了什么信息"
- **Harness Engineering**：最后解决"模型和工具如何在一个可控运行时里稳定执行"

它们不是相互替代，而是逐层叠加。

| 阶段 | 大致演进时间 | 工程关注点 | 主要痛点 |
|------|--------------|------------|----------|
| **Prompt Engineering 为主** | 2022-2023 | 让模型听懂任务、遵守格式、稳定回答 | 模型不按要求输出、风格飘、格式不稳 |
| **Context Engineering 抬头** | 2023-2024 | 给模型补足外部知识、工具结果、历史状态 | 模型不是"不会说"，而是"没看到对的信息" |
| **Harness Engineering 成为落地点** | 2024-至今 | 把工具、状态、重试、权限、评测、观测接成运行底座 | 单轮回答可用，但多步执行不稳定、不可控、难调试 |

### 一个更工程化的理解

如果把 Agent 看成一条运行链路：

1. **Prompt** 定义行为规则
2. **Context** 提供任务所需事实和状态
3. **Harness** 负责执行、监督和收敛整条链路

因此在真实项目里，三者分别回答的是三个不同问题：

| 问题 | 对应能力 |
|------|----------|
| 模型应该怎么做 | **Prompt Engineering** |
| 模型做决定时应该看到什么 | **Context Engineering** |
| 模型和工具如何稳定、安全、可观测地跑起来 | **Harness Engineering** |

### 为什么会出现这条演进线

- **早期 LLM 应用**多是单轮问答，Prompt 写得好不好几乎决定了效果，所以大家先卷 Prompt
- **RAG、Function Calling、长上下文**起来后，很多问题暴露成检索、裁剪、排序和状态传递问题，于是 Context Engineering 变成核心
- **Agent 产品化**之后，真正卡住上线的往往不是 Prompt 本身，而是重试、超时、权限、并发、回放、评测、人工接管等运行问题，所以 Harness Engineering 被单独强调出来

> 说明：Harness Engineering 不是一个像 Prompt Engineering 那样完全标准化的官方术语，但在 Agent 工程实践里，通常就是指模型运行时外面的那层"执行底座"。

---

## 三个专题入口

这篇综合指南保留主学习主线，不再在这里展开 Prompt、Context、Harness 的长篇正文。详细内容已拆成单独页面：

| 专题 | 核心问题 | 适合什么时候读 |
|------|----------|----------------|
| [Prompt Engineering 实践指南](./prompt-engineering.md) | 模型应该怎么做 | 刚开始写 System Prompt、Few-shot、结构化输出规则时 |
| [Context Engineering 实践指南](./context-engineering.md) | 模型应该看到什么 | 开始接 RAG、记忆、工具结果和多轮状态时 |
| [Harness Engineering 实践指南](./harness-engineering.md) | 系统应该怎么稳定跑 | 开始做多步 Agent、重试、权限、观测和回放时 |
| [Agent Skill 设计与实践](./skill-design-and-practice.md) | 团队经验怎么复用 | 开始把高频任务沉淀成 SOP、模板和可复用工作流时 |

推荐阅读顺序：

1. 先读 [Prompt Engineering 实践指南](./prompt-engineering.md)
2. 再读 [Context Engineering 实践指南](./context-engineering.md)
3. 最后读 [Harness Engineering 实践指南](./harness-engineering.md)
4. 需要沉淀团队专长时，再读 [Agent Skill 设计与实践](./skill-design-and-practice.md)

---

## Eval 评测基本方法

### 为什么需要 Eval

- Demo 效果好不代表生产可用
- 没有评测就无法知道改了 Prompt 或模型后效果变好还是变差
- 评测是 Agent 从原型到产品的必经之路

### 核心评测维度

- **正确率**：回答是否准确
- **稳定性**：多次调用结果是否一致
- **幻觉率**：是否编造不存在的信息
- **工具调用成功率**：是否正确选择和调用了工具
- **延迟与成本**：响应时间和 Token 消耗是否可控

### 最小可行评测流程

1. 准备 10-50 个测试问题，覆盖典型场景和边界场景
2. 记录每个问题的预期答案或预期行为
3. 运行 Agent，记录实际输出
4. 对比预期与实际，统计通过率
5. 记录失败原因，归类为 Prompt 问题、工具问题或模型问题

### 进阶方向

- 自动化评测脚本
- LLM-as-Judge：用另一个模型评判输出质量
- A/B 测试：对比不同 Prompt 或模型版本的效果
- 回归测试：每次修改后自动跑测试集

---

## 推荐学习顺序

1. 先学一门实现语言，补 HTTP / API 基础
2. 学 LLM 基础概念（Token、上下文窗口、Temperature）
3. 学 API 调用和 Prompt
4. 学 Function Calling / Structured Output
5. 做一个带工具的单 Agent
6. 学 Workflow / 状态机
7. 补 RAG
8. 补 Eval、Memory
9. 最后看 Multi-agent

### 两周冲刺版

> 如果你只有一周时间，推荐直接使用 [7 天 Agent 学习路线](./agent-learning-roadmap.md)。以下两周版本是一个更宽松的节奏安排，内容与 7 天版有重叠但顺序不同，二者选一即可。

| 时间 | 任务 |
|------|------|
| 第 1-2 天 | 理解 LLM、Prompt、Tool Calling 基础 |
| 第 3-4 天 | 调 API，做结构化输出 |
| 第 5-7 天 | 做一个最小 RAG demo |
| 第 8-10 天 | 加工具调用，做简单 Agent Loop |
| 第 11-12 天 | 加日志、评估、错误处理 |
| 第 13-14 天 | 整理成一个能展示的项目，写 README 和架构图 |

---

## 推荐学习资料

### 官方文档

- **OpenAI Docs**：重点看 Tool Calling、Structured Outputs、Responses、Agent Patterns
- **OpenAI Cookbook**：实战示例，覆盖 RAG、Agent、评测等典型场景
- **Anthropic Docs**：重点看 Tool Use、Building Effective Agents、Context Engineering、Prompt Engineering 文档
- **LangGraph Docs**：很适合学习工作流型 Agent，理解状态、节点、路由、人工介入
- **LlamaIndex Docs**：偏 RAG / 知识库方向，检索生态完整
- **Microsoft AutoGen Docs**：多 Agent 协作框架，适合了解 multi-agent 编排模式
- **Hugging Face**：适合补 Transformer、NLP、Embeddings、RAG 基础

### RAG 与检索资源

- **Pinecone / Weaviate / Qdrant 官方博客和教程**：向量数据库选型与使用实践
- 重点不是背概念，而是知道**检索效果差通常出在哪**：切分、召回、重排、上下文拼接
- 搜索关键词：`RAG chunking`、`reranking`、`hybrid search`、`RAG evaluation`

### 评估与工程化工具

- **promptfoo**：做 Prompt 和输出评测很实用，支持批量测试和版本对比
- **LangSmith**：查看 Agent 调用链路、定位失败点，可观测性强
- **Arize / Humanloop / Braintrust**：LLM eval 评测体系，适合进阶了解

### 视频与课程

- DeepLearning.AI 的 LLM / Agent 相关短课
- Andrej Karpathy 的 LLM / Tokenizer / Transformer 视频：适合建立整体认知，理解底层原理
- Jay Alammar 的图解 Transformer / Embedding 文章：适合补原理，图示清晰易懂
- YouTube 搜索：`build ai agent from scratch`、`langgraph tutorial`、`tool calling tutorial`

### 实战建议

- 找 GitHub 上最小可运行 Demo，自己改一遍，比只看文章有效
- 看官方 Quickstart、Cookbook / Examples
- "How to build agents" 类技术博客

---

## 推荐技术栈

> 如果你想最快找到工作，根据自己的语言偏好选一条路线深入，不要两条并行。

### 路线 A：Python 栈

- Python + FastAPI
- LangGraph / LlamaIndex
- PostgreSQL + Redis
- pgvector 或 Qdrant
- Docker

### 路线 B：TypeScript 栈

- TypeScript + Node.js
- Next.js / Express / NestJS
- Vercel AI SDK 或 OpenAI SDK
- LangChain JS
- PostgreSQL + Redis
- Docker

> 如果你偏"Agent 工程"而不是"算法研究"，重点是：API 调用能力、工作流编排、检索增强、评估与调试、产品落地能力。

---

## 推荐框架

### LangGraph

- 最适合工程化入门
- 非常适合理解有状态 Agent 和节点编排

### LangChain

- 生态广，但不要一开始学太杂

### LlamaIndex

- 偏 RAG / 知识库方向
- 检索生态完整，适合文档问答类 Agent

### CrewAI / AutoGen

- 适合了解多 Agent 协作
- 先知道即可，不建议开局重度依赖

### OpenAI Agents SDK

- OpenAI 官方 Agent 框架，轻量，深度整合 OpenAI 工具生态
- 支持 Handoff（Agent 间切换）模式和内置 Tracing
- 适合已在 OpenAI 生态的项目

### Anthropic SDK / Agent SDK

- Anthropic 官方 Python/TypeScript SDK，原生支持 Tool Use 和 Extended Thinking
- Agent SDK 提供了 Agent Loop、工具管理等高层抽象
- 适合直接使用 Claude 系列模型的项目

### Vercel AI SDK

- TypeScript 生态中最流行的 AI 开发工具包
- 支持多家模型提供商（OpenAI、Anthropic、Google 等），统一 API
- 内置流式 UI 组件，特别适合 Next.js / React 项目
- 如果你走 TypeScript 路线，这是首选

### DSPy

- 适合理解"把 Prompt 当程序优化"

### 原生 SDK

- 如果偏实战，可以直接用各家原生 SDK 手写一个小 Agent
- 往往更容易理解本质

---

## 练手项目建议

::: tip 建议
做 3 个小项目，比看 30 篇文章更有效。每做一个项目，都主动补一块短板（提示词、检索、工具、评测、部署）。
:::

### 搜索 Agent（补：Prompt + Tool Calling）

- 用户提问 -> 联网搜索 -> 总结答案

### RAG Agent（补：RAG + 知识库构建）

- 读取本地文档或 PDF -> 检索 -> 回答

### 办公 Agent（补：Workflow + 错误处理）

- 天气、日历、提醒、消息发送

### 数据 Agent（补：结构化输出 + 评测）

- 查表、汇总、输出日报

### 进阶项目

- 一个带长期记忆的个人助理（补：Memory 设计）
- 一个能自己分解任务并调用脚本执行的 Coding / Task Agent（补：Planning + Observability）

---

## Multi-Agent 入门

路线图建议先把单 Agent 做稳定，再碰多 Agent。但在进阶阶段，了解 Multi-Agent 的基本模式是很有价值的。

### 什么时候需要 Multi-Agent？

- 单个 Agent 的 system prompt 太长、角色太多、能力边界模糊
- 任务天然分为多个独立阶段（如"调研 → 写作 → 审核"）
- 需要不同的模型或参数配置处理不同子任务

### 常见协作模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **顺序传递（Sequential）** | Agent A 的输出作为 Agent B 的输入 | 流水线任务（调研→写作→校审） |
| **并行执行（Parallel）** | 多个 Agent 同时处理不同子任务，结果汇总 | 多维度分析、多源搜索 |
| **主管-工人（Supervisor-Worker）** | 一个主管 Agent 分配任务给多个工人 Agent | 复杂任务拆解与调度 |

### 代码：最小 Multi-Agent 示例

```python
from openai import OpenAI

client = OpenAI()


def run_agent(role: str, system_prompt: str, user_input: str) -> str: // [!code highlight]
    """运行一个独立 Agent"""
    print(f"\n[{role}] 正在处理...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
    )
    result = response.choices[0].message.content
    print(f"[{role}] 完成")
    return result


def multi_agent_pipeline(topic: str) -> str:
    """顺序传递模式：调研员 → 写作者"""

    # Agent 1：调研员 — 收集要点
    research = run_agent( // [!code highlight]
        role="调研员",
        system_prompt="你是一个技术调研员。列出给定主题的 3-5 个关键要点，每个要点一句话。",
        user_input=f"请调研以下主题：{topic}",
    )

    # Agent 2：写作者 — 基于调研结果写文章
    article = run_agent( // [!code highlight]
        role="写作者",
        system_prompt="你是一个技术写作者。根据提供的调研要点，写一篇 200 字的简短介绍文章。",
        user_input=f"调研要点：\n{research}\n\n请根据这些要点写一篇介绍文章。",
    )

    return article


# 使用
result = multi_agent_pipeline("RAG 技术的核心原理")
print(f"\n最终文章：\n{result}")
```

### 讲解重点

- 这是最简单的 **顺序传递** 模式：Agent A 的输出直接作为 Agent B 的输入
- 每个 Agent 有独立的 system prompt 和角色定位，职责清晰
- 实际项目中，可以给每个 Agent 配不同的模型（主管用强模型，工人用快模型）
::: warning 注意
不要为了"Multi-Agent"而 Multi-Agent，大多数任务单 Agent 就够了。
:::

### 推荐框架

- **CrewAI**：Python，多 Agent 协作框架，角色定义清晰
- **AutoGen**：Microsoft 开源，支持多 Agent 对话
- **OpenAI Agents SDK**：支持 handoff（Agent 间切换）模式
- **LangGraph**：用图结构编排多 Agent 工作流

---

## 判断是否真正入门

如果你能独立完成下面几件事，就算入门了：

- [ ] 能调用大模型 API，并稳定输出 JSON
- [ ] 能接一个搜索 / 数据库 / 网页工具给模型用
- [ ] 能做一个基础 RAG 系统
- [ ] 能记录 Agent 每一步调用日志
- [ ] 能设计至少 3 组评测样例验证效果
- [ ] 能说清楚"为什么这个 Agent 会失败"

---

## 常见误区

- 只学 Prompt，不学工程化
- 只追求多 Agent，不做单 Agent 落地
- 不做评测，靠感觉判断效果
- 把所有问题都交给模型，不做规则和边界控制
- 一上来就追求"全自动自治"
- 把 Prompt 堆很长，当成系统设计

::: danger 警告
工具权限不给边界、没有失败兜底和人工接管、不做测试不知道 Agent 为什么失败 -- 这三个问题是 Agent 上线后最常见的事故根因。
:::
- 迷信复杂 Agent，忽略简单工作流往往更稳定
- 一上来就追最新框架，结果没做出东西
- 只看 demo，不做评估
- 把"模型变聪明"和"系统更可靠"混为一谈

---

## 实用建议

::: tip 建议
- 先做能跑的小系统，再追求复杂架构
- 优先学"可观测性 + 评估"，这是工程师和玩票用户的分水岭
- 多看官方文档，少看搬运二手总结
- 每学一个概念，都要落到项目里验证
- 招聘里最加分的不是"懂多少名词"，而是"做过能展示的 Agent 项目"
:::

---

## 延伸阅读

- 想按短周期快速起步：读 [7 天 Agent 学习路线](./agent-learning-roadmap.md)
- 想先建立主题全景：读 [LLM Agent 工程师必学知识地图](./knowledge-map.md)
- 想把 Prompt 写稳：读 [Prompt Engineering 实践指南](./prompt-engineering.md)
- 想把上下文组织稳：读 [Context Engineering 实践指南](./context-engineering.md)
- 想把运行时做稳：读 [Harness Engineering 实践指南](./harness-engineering.md)
- 想把高频任务沉淀成可复用能力：读 [Agent Skill 设计与实践](./skill-design-and-practice.md)
- 想把工具调用做稳：读 [Tool Calling 设计清单](./tool-calling-design-checklist.md)
- 想把知识库接进系统：读 [RAG 基础与工作流](./rag-basics-and-workflow.md)
- 想深入理解 Agent 架构：读 [Anthropic: Building Effective Agents](https://docs.anthropic.com/en/docs/build-with-claude/agent)
- 想了解工具标准化协议：读 [MCP 官方文档](https://modelcontextprotocol.io/)
