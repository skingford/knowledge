---
title: Harness Engineering 实践指南
description: 面向 Agent / LLM 系统的 Harness Engineering 指南，覆盖演进、作用、与 workflow 的关系、运行时组成与工程化实践。
---

# Harness Engineering 实践指南

## 适合人群

- 已经能做出单次回答，但多步 Agent 一上线就不稳定的人
- 正在处理工具权限、重试、超时、回放、评测、人工接管等运行时问题的人
- 想理解 Agent 为什么不能只靠 Prompt 和 RAG 落地的人

## 学习目标

- 理解 Harness Engineering 在 Agent 系统里的位置
- 搞清它和 Workflow / Orchestration 的区别
- 建立对运行循环、状态、权限、观测、评测这层“执行底座”的整体认识

## 快速导航

- [Harness Engineering 是什么](#harness-engineering-是什么)
- [它在 Agent 系统里的位置](#它在-agent-系统里的位置)
- [演进过程](#演进过程)
- [主要作用](#主要作用)
- [和 Workflow / Orchestration 的关系](#和-workflow--orchestration-的关系)
- [常见组成](#常见组成)
- [工程实践](#工程实践)
- [什么时候会暴露 Harness 问题](#什么时候会暴露-harness-问题)

## Harness Engineering 是什么

Harness Engineering 可以理解成 Agent 的“运行时工程”或“执行底座工程”。

它关心的不是模型说了什么，而是：**模型、工具、状态、权限和评测如何被组织成一个可运行、可恢复、可观测的系统**。

## 它在 Agent 系统里的位置

如果把 Agent 看成一条完整链路：

1. `Prompt` 决定模型应该怎么做
2. `Context` 决定模型能看到什么
3. `Harness` 决定整套系统怎么安全、稳定、可回放地运行

所以 Harness Engineering 回答的是：**模型和工具如何稳定地跑起来**。

## 演进过程

- **最早期**：应用只是 `用户输入 -> LLM -> 文本输出`，几乎没有单独的 Harness 概念
- **工具调用阶段**：开始出现 `LLM 决策 -> 调工具 -> 追加结果 -> 再次决策` 的循环，需要最基本的执行器
- **Workflow 阶段**：引入状态机、节点路由、重试和失败兜底，Harness 不再只是一个 while loop
- **生产化阶段**：增加会话状态、权限边界、超时控制、人工审批、可观测性、回放、评测回归，Harness 变成独立的一层工程系统
- **当前阶段**：很多成熟 Agent 系统会把 Harness 抽成 runtime 层，Prompt、Context、Tools、Memory、Evals 都挂在这层之上运行

## 主要作用

- 控制一次 Agent 任务如何启动、推进、暂停、结束
- 决定工具调用的权限、超时、重试、回退和降级
- 维护多步任务中的状态、记忆、预算和步骤边界
- 记录日志、Trace、指标和中间产物，支持调试与回放
- 把评测、安全检查、人工接管嵌入运行链路，而不是事后补救

## 和 Workflow / Orchestration 的关系

- **Workflow / Orchestration** 更偏业务路径设计：先做什么、后做什么、何时分支
- **Harness Engineering** 更偏运行时控制：这条路径由谁执行、如何限流、失败后怎么恢复、结果怎么观测

可以把 Workflow 看成“路线图”，把 Harness 看成“车、仪表盘、刹车系统和黑匣子”。

## 常见组成

- **运行循环**：step budget、停止条件、递归深度控制
- **工具层**：工具注册、参数校验、权限边界、幂等和重试
- **状态层**：对话状态、任务状态、记忆摘要、检查点
- **安全层**：注入防护、敏感操作审批、沙箱隔离
- **观测层**：日志、Trace、成本统计、失败样本沉淀
- **评测层**：回归测试、A/B 对比、线上抽样复盘

## 工程实践

- 先把 Agent 做成可回放的状态机，再追求更强自治
- 每一步都要有明确输入、输出和失败处理
- 为工具调用设置预算、超时和权限，而不是默认放开
- 把 Prompt、Context、Tool 结果都纳入 Trace，方便定位失败根因
- 把评测集接进 Harness，让每次修改都能自动回归

## 什么时候会暴露 Harness 问题

当你遇到下面这些问题时，通常就不是单纯的 Prompt 问题了：

- 模型能做出正确决策，但工具调用经常失败或超时
- 多轮任务中状态丢失，或者重复执行相同步骤
- 出错后不能恢复现场，也很难复盘根因
- 生产环境需要人工审批、权限隔离、预算控制，但系统没有合适挂点
- 改了 Prompt 或模型之后，不知道对整体链路造成了什么副作用

相关专题：

- [Prompt Engineering 实践指南](./prompt-engineering.md)
- [Context Engineering 实践指南](./context-engineering.md)
- [Agent 学习综合指南](./agent-learning-guide.md)
