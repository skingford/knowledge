---
title: Agent 框架选型对比：LangGraph、LangChain、LlamaIndex、AutoGen、原生 SDK
description: 面向 Agent / LLM 系统的框架选型指南，比较 LangGraph、LangChain、LlamaIndex、AutoGen、OpenAI Agents SDK 与原生 SDK 的边界和适用场景。
---

# Agent 框架选型对比：LangGraph、LangChain、LlamaIndex、AutoGen、原生 SDK

## 适合人群

- 已经决定做 Agent 系统，但不知道应该从哪个框架起步的人
- 需要向团队解释为什么选 LangGraph、LlamaIndex 或原生 SDK 的工程师
- 想从“适不适合当前任务”而不是“谁最火”角度做判断的人

## 学习目标

- 分清主流 Agent / RAG 框架各自擅长什么
- 理解框架选型不是站队，而是贴合问题形状
- 知道什么时候该用原生 SDK，而不是一上来就上重框架

## 快速导航

- [先别把框架选型当宗教问题](#先别把框架选型当宗教问题)
- [5 个核心判断维度](#5-个核心判断维度)
- [LangGraph 更适合什么](#langgraph-更适合什么)
- [LangChain 更适合什么](#langchain-更适合什么)
- [LlamaIndex 更适合什么](#llamaindex-更适合什么)
- [AutoGen / CrewAI 更适合什么](#autogen--crewai-更适合什么)
- [OpenAI Agents SDK 和原生 SDK 怎么看](#openai-agents-sdk-和原生-sdk-怎么看)
- [一个够用的选择建议](#一个够用的选择建议)
- [常见失败点](#常见失败点)

## 先别把框架选型当宗教问题

很多讨论会不自觉变成：

- “LangGraph 才是正统”
- “LangChain 太重”
- “原生 SDK 才最本质”

这些说法都只讲对了一部分。真正更重要的是：

- 你当前在解什么问题
- 团队能接受多高的抽象层
- 是否需要复杂状态机、多步运行和人工介入
- 是否核心痛点其实在 RAG，而不是 Agent Loop

## 5 个核心判断维度

| 维度 | 你要问的问题 |
| --- | --- |
| **任务形状** | 是单轮工具调用、RAG 问答，还是复杂多步工作流 |
| **状态复杂度** | 是否需要显式状态、节点编排、恢复和人工接管 |
| **RAG 比重** | 你的核心是不是知识库构建和检索质量 |
| **多 Agent 需求** | 是否真的需要多角色协作 |
| **团队可控性** | 团队更偏好高抽象还是自己掌控细节 |

## LangGraph 更适合什么

`LangGraph` 更适合有状态、多步、需要清晰节点和边界的系统。

适合：

- 工作流型 Agent
- 明确的状态机、路由和人工介入
- 希望把复杂链路画清楚、追踪清楚

优点：

- 状态和节点边界比较清晰
- 更适合工程化和复杂控制流
- 对“跑稳”这件事支持更自然

代价：

- 对简单任务来说会显得偏重
- 理解成本高于直接调用 SDK

## LangChain 更适合什么

`LangChain` 的优势在于生态广、组件多、原型快。

适合：

- 快速拼装 demo
- 需要接很多现成组件
- 团队愿意接受一定抽象和生态复杂度

优点：

- 组件多、生态丰富
- 入门时容易找到现成例子

代价：

- 对复杂系统来说，抽象层有时会让调试变绕
- 如果只需要少量能力，可能显得过度

## LlamaIndex 更适合什么

如果问题核心在知识系统，`LlamaIndex` 往往更顺手。

适合：

- 文档问答
- 知识库构建
- 检索、索引、数据接入是主战场

优点：

- 对 RAG 相关能力支持自然
- 更适合把文档、数据源和索引接起来

代价：

- 如果你主要在做复杂 Agent runtime，而不是知识系统，未必是第一选择

## AutoGen / CrewAI 更适合什么

这些框架更容易被用来做多 Agent 协作。

适合：

- 角色协作演示
- 多 agent 实验
- 主管-工人、写作-审校等模式探索

优点：

- 多 Agent 语义更直接
- 适合演示和试验不同协作模式

代价：

- 如果基础的单 Agent / workflow 还没收住，容易把复杂度放大
- 很多场景其实可以用单 Agent + workflow 更稳地解决

## OpenAI Agents SDK 和原生 SDK 怎么看

### OpenAI Agents SDK

适合：

- 已经在 OpenAI 生态里
- 想更快获得 Agent Loop、handoff、tracing 等高层能力

### 原生 SDK

适合：

- 想真正理解系统本质
- 想完全掌控 prompt、tool schema、状态和日志
- 任务还不复杂，不想过早引抽象

很多时候，一个很稳的路线其实是：

1. 先用原生 SDK 或很薄的封装做最小系统
2. 等复杂度真的上来，再引更强框架

## 一个够用的选择建议

| 主要目标 | 更稳的起点 |
| --- | --- |
| **先理解 Agent 本质** | 原生 SDK |
| **做有状态 workflow** | LangGraph |
| **做知识库 / RAG 系统** | LlamaIndex 或原生 SDK + 自建 RAG |
| **快速原型和拼装组件** | LangChain |
| **做多 Agent 实验** | AutoGen / CrewAI |

一句话版：

- **系统复杂度不高时，优先简单**
- **知识问题优先看 RAG 框架**
- **控制流问题优先看 workflow 框架**

## 常见失败点

- 框架还没选清，就开始大规模重构
- 用重框架解决一个很轻的问题
- 为了“支持多 Agent”而放弃更稳的单 Agent + workflow
- 把框架能力当成系统设计能力，忽略 Prompt、Context、Tool、Eval 才是本体

相关专题：

- [Harness Engineering 实践指南](./harness-engineering.md)
- [Multi-Agent、Handoff 与路由边界](./multi-agent-handoff-and-routing.md)
- [RAG 基础与工作流](./rag-basics-and-workflow.md)
- [Agent 产品化 Checklist](./agent-productization-checklist.md)
