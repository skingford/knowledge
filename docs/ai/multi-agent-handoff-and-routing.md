---
title: Multi-Agent、Handoff 与路由边界
description: 面向 Agent / LLM 系统的 Multi-Agent 指南，覆盖 single-agent 与 multi-agent 的分界、handoff、路由模式、状态传递和常见失败点。
---

# Multi-Agent、Handoff 与路由边界

## 适合人群

- 已经把单 Agent 跑起来，开始纠结是否要拆成多个 Agent 的工程师
- 正在设计 router、specialist、reviewer、supervisor 等协作结构的人
- 想分清 handoff、tool calling、workflow 到底谁该解决什么问题的人

## 学习目标

- 建立什么时候需要 Multi-Agent、什么时候不需要的判断标准
- 理解 handoff、路由和工具调用的边界
- 知道多 Agent 系统里上下文、权限、模型和状态该怎么切分

## 快速导航

- [先别默认需要 Multi-Agent](#先别默认需要-multi-agent)
- [什么时候单 Agent 已经不够](#什么时候单-agent-已经不够)
- [Handoff 和 Tool Calling 有什么区别](#handoff-和-tool-calling-有什么区别)
- [常见协作模式](#常见协作模式)
- [状态和上下文怎么传递](#状态和上下文怎么传递)
- [模型、工具、权限怎么切分](#模型工具权限怎么切分)
- [什么时候应该回到单 Agent](#什么时候应该回到单-agent)
- [常见失败点](#常见失败点)

## 先别默认需要 Multi-Agent

很多团队上来就把系统拆成“规划 Agent、执行 Agent、校验 Agent、总结 Agent”，结果复杂度迅速失控。

大多数业务的正确起点仍然是：

- 一个主 Agent
- 少量清晰工具
- 必要时加工作流节点和人工接管

只有当单 Agent 的边界已经明显失真时，Multi-Agent 才值得引入。

## 什么时候单 Agent 已经不够

下面几类信号比较典型：

- **角色冲突明显**：同一个 prompt 里既要“调研”，又要“写作”，又要“审校”，结果风格和目标互相干扰
- **上下文污染严重**：某个子任务只需要局部上下文，但被迫继承整包历史
- **模型需求不同**：规划要强模型，执行要快模型，审校要更保守的模型
- **工具权限差异大**：某些子任务只该读数据，另一些子任务才允许写数据

这时拆 Agent 往往不是为了“更聪明”，而是为了**把职责、上下文和权限拆干净**。

## Handoff 和 Tool Calling 有什么区别

这两个概念经常混。

| 机制 | 本质 | 适合什么 |
| --- | --- | --- |
| **Tool Calling** | 当前 Agent 借助外部能力完成任务 | 搜索、数据库、脚本、浏览器、发消息 |
| **Handoff** | 当前 Agent 把主导权切给另一个 Agent | 角色切换、职责切换、上下文切换 |

一个简化理解是：

- **Tool** 更像“我自己做，但我借个工具”
- **Handoff** 更像“这部分该你来主导了”

如果你只是需要查数据、跑脚本、读网页，通常优先考虑 Tool Calling。

如果你需要切换角色边界、模型配置、上下文包或权限域，才更像 handoff。

## 常见协作模式

### 1. Router -> Specialist

- 先由路由器判断任务类型
- 再把任务交给对应专业 Agent

适合：客服分流、研发问答分流、文档/代码/数据多模态路由。

### 2. Supervisor -> Worker

- 主管 Agent 负责拆任务和监控进度
- Worker Agent 负责具体执行

适合：复杂任务拆解、长链路执行、批量子任务。

### 3. Writer -> Reviewer

- 写作者先产出初稿
- 审核者负责挑错、压格式、查遗漏

适合：内容生成、SQL 生成、代码建议、报告整理。

### 4. Parallel Specialists

- 多个 Agent 并行处理不同维度
- 最后由汇总器归并结果

适合：多源调研、风险分析、竞品分析。

## 状态和上下文怎么传递

多 Agent 不是把完整历史无脑广播给所有角色。

更稳的做法通常是：

- **共享最小公共状态**：任务 ID、目标、约束、阶段结果
- **局部上下文局部传递**：只把当前子任务需要的信息传给对应 Agent
- **handoff 时保留交接摘要**：当前 Agent 为什么交接、希望下一个 Agent 做什么、已完成什么

如果没有交接摘要，handoff 往往会退化成“把一大坨上下文继续往后丢”，复杂度只会越来越高。

## 模型、工具、权限怎么切分

多 Agent 真正有价值的地方，常常在于切分运行边界，而不只是切 prompt。

### 模型切分

- 规划 / 审核 Agent：更强模型
- 批量执行 / 抽取 Agent：更快更便宜模型

### 工具切分

- 路由 Agent 不要直接拥有危险写工具
- 只读 Agent 不要继承写权限
- 审核 Agent 往往不需要真实执行工具

### 权限切分

- 高风险写操作应只在特定 Agent 或人工审批节点出现
- 不同 Agent 可以绑定不同预算、超时、并发和审计规则

## 什么时候应该回到单 Agent

如果你发现下面这些现象，通常意味着拆得过度了：

- 单个任务要在多个 Agent 间反复来回
- 交接信息越来越长，handoff 本身开始成为主要成本
- 调试时很难说清哪一步到底该谁负责
- 最终效果没有变好，只是调用次数和延迟更高

这时不要犹豫，应该回退到单 Agent + 清晰 workflow。

## 常见失败点

- 为了“高级感”而堆很多 Agent
- handoff 条件模糊，导致路由抖动
- 所有 Agent 共用同一整包上下文，拆了等于没拆
- 工具和权限没有隔离，多 Agent 只是多层风险放大器
- 没有 Trace 和回放，出问题后不知道是哪次 handoff 把状态传坏了

相关专题：

- [Harness Engineering 实践指南](./harness-engineering.md)
- [Agent Memory 设计与状态管理](./memory-design-and-state-management.md)
- [Agent 可观测性、回放与故障复盘](./observability-replay-and-incident-review.md)
- [Agent 学习综合指南](./agent-learning-guide.md)
