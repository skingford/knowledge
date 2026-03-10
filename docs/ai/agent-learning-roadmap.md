# 7 天 Agent 学习路线

> 概念、资料、框架等完整内容见 [Agent 学习综合指南](./agent-learning-guide.md)，本文聚焦 7 天实操安排。

## 适合人群

- 已经会基础编程，想快速入门 Agent 开发
- 想从"会调模型"进阶到"能做可运行 Agent"
- 需要一个短周期、偏实战的学习安排

## 学习目标

- 理解 Agent 的基本组成与边界
- 能独立做一个单 Agent + 多工具的小项目
- 知道后续该怎么补 RAG、Eval、Observability

## 7 天学习安排

### Day 1：理解 Agent 是什么 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [Day 1 详解](./roadmap/day1-what-is-agent.md)

目标：分清 LLM、Bot、Workflow、Agent。

学习内容：

- 什么是大模型
- 什么是 Prompt
- 什么是 Tool Calling
- Agent 和普通问答助手的区别

产出：

- 能用自己的话解释 `Agent = LLM + Tools + Memory + Workflow`

### Day 2：学会调用 LLM API <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [Day 2 详解](./roadmap/day2-llm-api.md)

目标：把模型真正用起来。

学习内容：

- API Key、Request、Response
- System Prompt / User Prompt
- Temperature、Max Tokens、结构化输出

实操：

- 写一个最简单的聊天脚本

建议：

- 先用 Python 或 TypeScript 二选一

### Day 3：学会 Tool Calling <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [Day 3 详解](./roadmap/day3-tool-calling.md)

目标：让模型不仅会说，还会"做事"。

学习内容：

- Function Calling
- 工具描述怎么写
- 模型如何选择调用工具

实操：

- 做一个能调用天气、搜索、时间三个工具的小助手

关键理解：

- Agent 的核心不是会聊天，而是会在合适的时候调用能力

### Day 4：学习 Workflow，而不是一开始就追求自治 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [Day 4 详解](./roadmap/day4-workflow.md)

目标：理解可控 Agent 的真实工程形态。

学习内容：

- Step-by-step Workflow
- 状态机
- 重试、失败处理、人工兜底

实操：

- 实现一个固定流程：理解问题 -> 判断是否查资料 -> 调工具 -> 汇总答案

### Day 5：学习 RAG 和 Memory <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [Day 5 详解](./roadmap/day5-rag-memory.md)

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

- 很多"智能"不是模型更强，而是检索更准

### Day 6：学习评测与安全 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [Day 6 详解](./roadmap/day6-eval-safety.md)

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

### Day 7：做一个完整小项目 <Badge type="tip" text="详解" />

> 完整项目代码见 [Day 7 详解](./roadmap/day7-full-project.md)

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

- 知道 Agent 不是"套壳聊天"
- 能独立做一个单 Agent + 多工具的小项目
- 理解为什么 Workflow 比"完全自治"更适合落地
- 知道下一步该补 RAG、Eval、Observability、Multi-agent

## 下一步

完成 7 天学习后，建议阅读 [Agent 学习综合指南](./agent-learning-guide.md) 中的进阶内容，包括：

- 工程化能力（RAG 进阶、可观测性、安全）
- Prompt Engineering 实践要点
- Eval 评测方法
- 更多练手项目
