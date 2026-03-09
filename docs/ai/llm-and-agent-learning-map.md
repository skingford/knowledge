# LLM 与 Agent 学习地图

## 适合人群

- 想系统入门 AI 应用开发，但概念容易混在一起的初学者
- 已经知道 LLM、Agent、RAG 这些词，但不清楚先后顺序的人
- 需要一条从“懂模型”到“做系统”的学习主线

## 学习目标

- 把学习路径拆成 `LLM` 和 `Agent` 两部分来理解
- 先懂模型能力边界，再懂如何把模型接成可工作的系统
- 建立更清晰的学习顺序和练手方向

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [为什么分成两部分学](#为什么分成两部分学)
- [LLM 入门先看什么](#llm-入门先看什么)
- [Agent 入门重点学什么](#agent-入门重点学什么)
- [推荐资料方向](#推荐资料方向)
- [最实用的学习顺序](#最实用的学习顺序)
- [练手项目建议](#练手项目建议)
- [常见误区](#常见误区)

## 为什么分成两部分学

先学 LLM，再学 Agent。

原因很直接：

- 不懂模型能力边界，就很难设计对的 Agent 工作流
- 不懂上下文窗口、结构化输出、工具调用，就容易把问题都归因于 Prompt
- Agent 不是单纯“套壳聊天”，而是把模型接进工具、状态、记忆、流程里的系统

因此更稳的方式是：

- 先懂模型
- 再懂怎么把模型接成可工作的系统

## LLM 入门先看什么

### Transformer 基础

- 注意力机制
- Token
- 上下文窗口

### Prompting

- Zero-shot
- Few-shot
- Chain-of-thought 的使用边界

### Function Calling / Structured Output

- 这是做 Agent 的关键基础
- 重点理解模型如何输出结构化数据，而不是只吐自然语言

### RAG

- 检索
- 切块
- Embedding
- Rerank

### Fine-tuning 基础

- 先知道适用场景即可
- 一开始不必急着训练模型

## Agent 入门重点学什么

### 工具调用

- 模型怎么决定何时调 API、搜索、数据库、脚本

### 任务规划

- 如何把复杂任务拆成多步

### Memory

- 短期上下文
- 长期记忆
- 用户画像

### Workflow

- 固定流程
- 状态机
- 人工兜底

### Multi-agent

- 最后再学
- 不要开局就上

## 推荐资料方向

- OpenAI API Docs：重点看 Tool Calling、Structured Outputs、Responses
- Anthropic Docs：重点看 Tool Use、Agent Design、Context Engineering
- LangChain / LangGraph Docs：重点看 Agent 与 Workflow 编排
- DeepLearning.AI 上的 LLM / Agent 课程
- Hugging Face 的 NLP / Transformer 教程
- Andrej Karpathy 的 LLM、Tokenizer、Transformer 相关公开视频

## 最实用的学习顺序

1. 先懂 LLM 基础概念
2. 再学 API 调用和 Prompt
3. 再学 Function Calling
4. 再做一个带工具的单 Agent
5. 再补 RAG、Eval、Memory

## 练手项目建议

- 一个能联网搜索的问答助手
- 一个读取本地文档的 RAG 助手
- 一个能调用天气、地图、日历 API 的 Agent
- 一个简单的“自动拆任务并执行”的工作流 Agent

## 常见误区

- 只学 Prompt，不学系统设计
- 只追求多 Agent，不做单 Agent 落地
- 不做评测，靠感觉判断效果
- 把所有问题都交给模型，不做规则和边界控制

## 推荐整理模板

每个学习主题建议统一成 5 列：

- 概念
- 核心作用
- 关键边界
- 最小实践
- 继续深入方向
