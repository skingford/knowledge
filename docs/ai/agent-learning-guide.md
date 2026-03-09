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

- [为什么分成 LLM 和 Agent 两部分学](#为什么分成-llm-和-agent-两部分学)
- [第一阶段：LLM 基础](#第一阶段llm-基础)
- [第二阶段：Agent 核心 5 个概念](#第二阶段agent-核心-5-个概念)
- [为什么先学工作流型 Agent](#为什么先学工作流型-agent)
- [第三阶段：工程化能力](#第三阶段工程化能力)
- [Prompt Engineering 实践要点](#prompt-engineering-实践要点)
- [Eval 评测基本方法](#eval-评测基本方法)
- [推荐学习顺序](#推荐学习顺序)
- [推荐学习资料](#推荐学习资料)
- [推荐框架](#推荐框架)
- [练手项目建议](#练手项目建议)
- [常见误区](#常见误区)

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

---

## 为什么先学工作流型 Agent

入门最好先学工作流型 Agent，先做"调用模型 -> 调工具 -> 解析结果 -> 决策下一步"这类确定性流程。先把单 Agent + 多工具做稳定，再碰多代理自治。

这样做的原因：

- 更容易调试
- 更容易加日志和失败兜底
- 更容易做评测
- 更接近真实工程落地

真正能落地的 Agent，通常不是"超级自治体"。更常见、也更可靠的形态是：LLM + 工具 + 工作流 + 人工兜底。这比"完全放养式自治"更容易调试、评测、上线和控制风险。

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

## Prompt Engineering 实践要点

### 基本 Pattern

- **角色设定**：在 System Prompt 中明确角色、能力边界和输出格式
- **Few-shot 示例**：给出 2-3 个输入输出示例，比长篇描述更有效
- **思维链（CoT）**：对复杂推理任务，要求模型"先分析再回答"
- **约束输出**：用 JSON Schema 或明确格式要求减少自由发挥

### 常见技巧

- **分步指令**：把复杂任务拆成编号步骤，逐步引导模型
- **负面约束**：明确告诉模型"不要做什么"，比只说"要做什么"更稳定
- **上下文裁剪**：只传入与当前任务相关的上下文，减少噪音
- **输出校验**：对结构化输出做 Schema 校验，不通过则重试

### 工程实践

- Prompt 作为代码管理：版本控制、变量化、可测试
- 分离关注点：System Prompt 管角色和规则，User Prompt 管具体任务
- 迭代优化：先写最简 Prompt，用测试用例驱动改进

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

---

## 推荐学习资料

### 官方文档

- **OpenAI Docs**：重点看 Tool Calling、Structured Outputs、Responses、Agent Patterns
- **Anthropic Docs**：重点看 Tool Use、Building Effective Agents、Context Engineering
- **LangGraph Docs**：很适合学习工作流型 Agent，理解状态、节点、路由、人工介入
- **Hugging Face**：适合补 Transformer、NLP、Embeddings、RAG 基础

### 视频与课程

- DeepLearning.AI 的 LLM / Agent 相关短课
- Andrej Karpathy 的 LLM / Tokenizer / Transformer 视频
- YouTube 搜索：`build ai agent from scratch`、`langgraph tutorial`、`tool calling tutorial`

### 实战建议

- 找 GitHub 上最小可运行 Demo，自己改一遍，比只看文章有效
- 看官方 Quickstart、Cookbook / Examples
- "How to build agents" 类技术博客

---

## 推荐框架

### LangGraph

- 最适合工程化入门
- 非常适合理解有状态 Agent 和节点编排

### LangChain

- 生态广，但不要一开始学太杂

### CrewAI / AutoGen

- 适合了解多 Agent 协作
- 先知道即可，不建议开局重度依赖

### DSPy

- 适合理解"把 Prompt 当程序优化"

### 原生 SDK

- 如果偏实战，可以直接用各家原生 SDK 手写一个小 Agent
- 往往更容易理解本质

---

## 练手项目建议

### 搜索 Agent

- 用户提问 -> 联网搜索 -> 总结答案

### RAG Agent

- 读取本地文档或 PDF -> 检索 -> 回答

### 办公 Agent

- 天气、日历、提醒、消息发送

### 数据 Agent

- 查表、汇总、输出日报

### 进阶项目

- 一个带长期记忆的个人助理
- 一个能自己分解任务并调用脚本执行的 Coding / Task Agent

---

## 常见误区

- 只学 Prompt，不学系统设计
- 只追求多 Agent，不做单 Agent 落地
- 不做评测，靠感觉判断效果
- 把所有问题都交给模型，不做规则和边界控制
- 一上来就追求"全自动自治"
- 把 Prompt 堆很长，当成系统设计
- 工具权限不给边界
- 没有失败兜底和人工接管
- 不做测试，不知道 Agent 为什么失败

---

## 推荐整理模板

每个学习主题建议统一成 5 列：

- 概念
- 核心作用 / 解决什么问题
- 关键边界 / 工程风险
- 最小实践
- 继续深入方向
