---
title: Prompt Engineering 实践指南
description: 面向 Agent / LLM 应用的 Prompt Engineering 指南，覆盖演进、作用、边界、常见 pattern 与工程实践。
---

# Prompt Engineering 实践指南

## 适合人群

- 刚开始做 LLM API 调用，不确定 System Prompt 和 User Prompt 应该怎么分工的人
- 已经在写提示词，但输出格式、风格和稳定性经常飘的人
- 想把 Prompt 从“试出来”变成“可管理、可测试、可回归”的工程实践的人

## 学习目标

- 理解 Prompt Engineering 在 Agent 系统里的准确位置
- 了解 Prompt Engineering 的演进过程，以及它最擅长解决什么问题
- 建立一套可复用的 Prompt 设计和工程化管理方法

## 快速导航

- [Prompt Engineering 是什么](#prompt-engineering-是什么)
- [它在 Agent 工程中的位置](#它在-agent-工程中的位置)
- [演进过程](#演进过程)
- [主要作用](#主要作用)
- [最擅长解决什么](#最擅长解决什么)
- [解决不了什么](#解决不了什么)
- [基本 Pattern](#基本-pattern)
- [常见技巧](#常见技巧)
- [工程实践](#工程实践)
- [和 Context / Harness 的边界](#和-context--harness-的边界)

## Prompt Engineering 是什么

Prompt Engineering 的核心不是“写一段很聪明的话”，而是把模型的行为约束成一个可重复的接口。

它关注的是：

- 模型应该扮演什么角色
- 模型要完成什么任务
- 输出要满足什么格式和边界
- 在多步任务里，模型该先思考、再行动，还是直接输出结构化结果

## 它在 Agent 工程中的位置

如果把 Agent 看成一条运行链路：

1. `Prompt` 定义行为规则
2. `Context` 提供任务事实和状态
3. `Harness` 负责执行、监督和收敛整个系统

所以 Prompt Engineering 回答的问题是：**模型应该怎么做**。

相关专题：

- [Context Engineering 实践指南](./context-engineering.md)
- [Harness Engineering 实践指南](./harness-engineering.md)
- [Agent 学习综合指南](./agent-learning-guide.md)

## 演进过程

- **第一阶段：角色和任务描述**。重点是让模型进入正确角色，理解任务目标，避免完全自由发挥
- **第二阶段：Few-shot 和格式约束**。开始用示例、模板、输出格式约束来提高稳定性
- **第三阶段：结构化输出和工具规则**。随着 Function Calling、JSON Schema、Tool Use 普及，Prompt 开始承担“决策协议”的作用
- **当前阶段：Prompt 代码化**。Prompt 被当作系统契约的一部分，进入版本控制、模板管理、回归测试和 A/B 实验

## 主要作用

- 定义模型身份、任务目标和行为边界
- 规定输出格式、拒答策略和异常处理原则
- 给复杂任务提供决策顺序或拆解框架
- 在工具调用前后，告诉模型何时该思考、何时该行动、何时该停止

## 最擅长解决什么

- 模型“听不懂要求”
- 输出格式不稳定
- 风格、语气、结构不一致
- 工具选择规则不清楚

## 解决不了什么

- 模型没有看到关键知识
- 检索结果质量差
- 多步运行中的重试、超时、权限、状态错乱
- 没有评测和观测导致的“看起来能跑，实际上不稳”

## 基本 Pattern

- **角色设定**：在 System Prompt 中明确角色、能力边界和输出格式
- **Few-shot 示例**：给出 2-3 个输入输出示例，比长篇描述更有效
- **思维链（CoT）**：对复杂推理任务，要求模型“先分析再回答”
- **约束输出**：用 JSON Schema 或明确格式要求减少自由发挥

## 常见技巧

- **分步指令**：把复杂任务拆成编号步骤，逐步引导模型
- **负面约束**：明确告诉模型“不要做什么”，比只说“要做什么”更稳定
- **提示词分层**：System Prompt 管规则，Developer / Tool 说明管协议，User Prompt 管具体任务
- **输出校验**：对结构化输出做 Schema 校验，不通过则重试

## 工程实践

- Prompt 作为代码管理：版本控制、变量化、可测试
- 分离关注点：System Prompt 管角色和规则，User Prompt 管具体任务
- 迭代优化：先写最简 Prompt，用测试用例驱动改进
- 用回归测试集验证 Prompt 变更，避免“改好了一个 case，打坏一片 case”

## 和 Context / Harness 的边界

| 维度 | Prompt Engineering | Context Engineering | Harness Engineering |
|------|-------------------|-------------------|-------------------|
| 核心问题 | 模型应该怎么做 | 模型应该看到什么 | 系统应该怎么跑 |
| 主要对象 | 指令、规则、格式 | 历史、检索、工具结果、记忆 | 运行循环、权限、状态、重试、观测 |
| 典型故障 | 不按格式输出、角色漂移 | 信息缺失、噪音过多、幻觉 | 多步执行不稳定、难回放、难恢复 |

很多团队一开始会把所有问题都归因于 Prompt，但到了 Agent 阶段，真正的瓶颈通常会逐步转向 Context 和 Harness。
