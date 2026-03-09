# 7 天 Agent 学习路线

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [7 天学习安排](#7-天学习安排)
- [核心知识地图](#核心知识地图)
- [推荐实践项目](#推荐实践项目)
- [推荐学习资料](#推荐学习资料)
- [推荐框架](#推荐框架)
- [常见误区](#常见误区)
- [推荐整理模板](#推荐整理模板)

## 适合人群

- 已经会基础编程，想快速入门 Agent 开发
- 想从“会调模型”进阶到“能做可运行 Agent”
- 需要一个短周期、偏实战的学习安排

## 学习目标

- 理解 Agent 的基本组成与边界
- 能独立做一个单 Agent + 多工具的小项目
- 知道后续该怎么补 RAG、Eval、Observability

## 7 天学习安排

### Day 1：理解 Agent 是什么

目标：分清 LLM、Bot、Workflow、Agent。

学习内容：

- 什么是大模型
- 什么是 Prompt
- 什么是 Tool Calling
- Agent 和普通问答助手的区别

产出：

- 能用自己的话解释 `Agent = LLM + Tools + Memory + Workflow`

### Day 2：学会调用 LLM API

目标：把模型真正用起来。

学习内容：

- API Key、Request、Response
- System Prompt / User Prompt
- Temperature、Max Tokens、结构化输出

实操：

- 写一个最简单的聊天脚本

建议：

- 先用 Python 或 TypeScript 二选一

### Day 3：学会 Tool Calling

目标：让模型不仅会说，还会“做事”。

学习内容：

- Function Calling
- 工具描述怎么写
- 模型如何选择调用工具

实操：

- 做一个能调用天气、搜索、时间三个工具的小助手

关键理解：

- Agent 的核心不是会聊天，而是会在合适的时候调用能力

### Day 4：学习 Workflow，而不是一开始就追求自治

目标：理解可控 Agent 的真实工程形态。

学习内容：

- Step-by-step Workflow
- 状态机
- 重试、失败处理、人工兜底

实操：

- 实现一个固定流程：理解问题 -> 判断是否查资料 -> 调工具 -> 汇总答案

### Day 5：学习 RAG 和 Memory

目标：让 Agent 能利用外部知识。

学习内容：

- Embedding
- Chunking
- Retrieval
- Rerank
- 短期记忆 vs 长期记忆

实操：

- 给 Agent 接一个简单知识库，例如几篇 Markdown 或 PDF

注意：

- 很多“智能”不是模型更强，而是检索更准

### Day 6：学习评测与安全

目标：不要把 Demo 当产品。

学习内容：

- 如何评估答案质量
- 幻觉问题
- Prompt Injection
- 工具权限边界
- 成本、延迟、稳定性

实操：

- 设计 10 个测试问题
- 记录成功率和失败原因

### Day 7：做一个完整小项目

目标：把前 6 天内容串起来。

推荐项目：

- 文档问答 Agent
- 联网搜索 Agent
- 个人办公 Agent（天气、日程、提醒）

最终要求：

- 能回答问题
- 能调用至少 2 个工具
- 有基本错误处理
- 有简单日志
- 最好能展示完整工作流

## 一周后应达到的水平

- 知道 Agent 不是“套壳聊天”
- 能独立做一个单 Agent + 多工具的小项目
- 理解为什么 Workflow 比“完全自治”更适合落地
- 知道下一步该补 RAG、Eval、Observability、Multi-agent

## 核心知识地图

### 模型基础

- Transformer 基础：注意力机制、Token、上下文窗口
- Prompt 基础：System Prompt、Few-shot、约束输出
- 结构化输出：JSON Schema、Tool 参数约束

### Agent 核心

- Tool Calling：让模型调用搜索、数据库、API、脚本
- Workflow：固定流程、状态机、人工兜底
- Planning：把复杂任务拆成多步
- Memory：短期上下文、长期记忆、用户画像

### 外部知识

- RAG：检索、切块、Embedding、Rerank
- 知识库构建：Markdown、PDF、数据库
- 召回与重排：提高命中率，减少幻觉

### 工程化能力

- Eval：评估效果，而不是只看 Demo
- 安全：Prompt Injection、工具权限边界
- 观测：日志、成本、延迟、失败率
- 错误处理：重试、回退、人工介入

## 推荐实践项目

- 搜索 Agent：用户提问 -> 联网搜索 -> 总结答案
- RAG Agent：读取本地文档或 PDF -> 检索 -> 回答
- 办公 Agent：天气、日历、提醒、消息发送
- 数据 Agent：查表、汇总、输出日报

## 推荐学习资料

官方文档：

- OpenAI Docs
- Anthropic Docs
- LangGraph Docs

视频或课程：

- DeepLearning.AI 的 LLM / Agent 课程
- Hugging Face 教程
- Andrej Karpathy 的 LLM 相关视频

实战建议：

- 找 GitHub 上最小可运行 Demo，自己改一遍，比只看文章有效

## 推荐资料方向

- OpenAI API Docs：重点看 Tool Calling、Structured Outputs、Responses
- Anthropic Docs：重点看 Tool Use、Agent Design、Context Engineering
- LangChain / LangGraph Docs：重点看 Agent 与 Workflow 编排
- DeepLearning.AI 的 LLM / Agent 课程
- Hugging Face 的 NLP / Transformer 教程
- Andrej Karpathy 的 LLM、Tokenizer、Transformer 公开视频

## 初学者建议顺序

1. 先懂 LLM 基础概念
2. 再学 API 调用和 Prompt
3. 再学 Function Calling
4. 再做一个带工具的单 Agent
5. 再补 RAG、Eval、Memory

## 推荐框架

- LangGraph：最适合工程化入门
- LangChain：生态广，但不要一开始学太杂
- CrewAI / AutoGen：适合了解多 Agent，但不建议开局就上
- 原生 SDK：如果偏实战，直接手写一个小 Agent，更容易理解本质

## 常见误区

- 只学 Prompt，不学系统设计
- 只追求多 Agent，不做单 Agent 落地
- 不做评测，靠感觉判断效果
- 把所有问题都交给模型，不做规则和边界控制
- 一上来就学 Multi-agent
- 只会写 Prompt，不会做流程控制
- 不做测试，不知道 Agent 为什么失败
- 把 Agent 当“万能自动人”，不给权限边界
