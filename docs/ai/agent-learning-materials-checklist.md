# Agent 学习资料清单

## 适合人群

- 想按“先学什么、看什么、练什么”来系统入门 Agent 的初学者
- 已经看过零散文章，但缺一份可执行资料清单的人
- 希望把官方文档、课程、项目练习串成路线的人

## 学习目标

- 明确 Agent 入门必须先掌握的知识块
- 知道优先看哪些官方资料和课程
- 用更稳的学习顺序把资料转成实战能力

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [先学的核心知识](#先学的核心知识)
- [优先推荐的官方资料](#优先推荐的官方资料)
- [适合入门的视频与课程](#适合入门的视频与课程)
- [推荐学习框架](#推荐学习框架)
- [最适合练手的项目](#最适合练手的项目)
- [建议学习顺序](#建议学习顺序)
- [常见误区](#常见误区)

## 先学的核心知识

### LLM 基础

- Token
- 上下文窗口
- Temperature
- 结构化输出

### Prompt 基础

- System Prompt
- Few-shot
- 约束输出

### Tool Calling

- 让模型调用搜索、数据库、API、脚本

### Workflow

- 把 Agent 做成可控流程，而不是纯放养

### RAG

- 让 Agent 结合外部知识工作

### Eval

- 评估效果，而不是只看 Demo

## 优先推荐的官方资料

### OpenAI Docs

重点看：

- Function / Tool Calling
- Structured Outputs
- Agent / Responses 相关示例

### Anthropic Docs

重点看：

- Tool Use
- Building Effective Agents
- Context Engineering

### LangGraph Docs

- 很适合学习工作流型 Agent
- 能帮助理解状态、节点、路由、人工介入

### Hugging Face

- 适合补 Transformer、NLP、Embeddings、RAG 基础

## 适合入门的视频与课程

- DeepLearning.AI 的 LLM / Agent 相关短课
- Andrej Karpathy 的 LLM / Tokenizer / Transformer 视频

YouTube 可搜索：

- `build ai agent from scratch`
- `langgraph tutorial`
- `tool calling tutorial`

## 推荐学习框架

### LangGraph

- 最适合工程化入门

### LangChain

- 生态广
- 但一开始不要学太杂

### CrewAI / AutoGen

- 适合了解多 Agent
- 先知道即可，不要开局重度依赖

### 原生 SDK

- 如果偏实战，可以直接用各家原生 SDK 手写一个小 Agent
- 往往更容易理解本质

## 最适合练手的项目

### 搜索 Agent

- 用户提问 -> 联网搜索 -> 总结答案

### RAG Agent

- 读取本地文档或 PDF -> 检索 -> 回答

### 办公 Agent

- 天气、日历、提醒、消息发送

### 数据 Agent

- 查表、汇总、输出日报

## 建议学习顺序

1. 先学 LLM API
2. 再学 Prompt 和结构化输出
3. 再学 Tool Calling
4. 再学 Workflow
5. 再学 RAG
6. 最后看 Multi-agent

## 常见误区

- 一上来就学 Multi-agent
- 只会写 Prompt，不会做流程控制
- 不做测试，不知道 Agent 为什么失败
- 把 Agent 当“万能自动人”，不给权限边界

## 推荐整理模板

每类资料建议统一成 5 列：

- 主题
- 先学原因
- 推荐资料
- 最小练习
- 常见坑
