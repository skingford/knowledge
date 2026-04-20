---
title: Skill 类型模板速查
description: 按 review、发布、排障、文档、工具、多 Agent 6 类常见任务给出可直接改名复用的 skill 模板。
---

# Skill 类型模板速查

实际写 skill 时，最大的困难通常不是「不会写 Markdown」，而是不知道不同任务类型到底该强调哪一部分。下面给 6 类最常见的 skill 模板，可以直接改名后使用。

> 本页是 [Agent Skill 设计与实践](./skill-design-and-practice.md) 的附录。如果还不熟悉 skill 的结构和组成部分，建议先读主文档。

## 速查表

| 第一产出 | 推荐模板 | 强调字段 |
|---|---|---|
| 问题列表 | [Review 类](#_1-review-类-skill) | Inputs / Workflow / Do Not / Outputs |
| 执行检查结果 | [发布 / 上线类](#_2-发布-上线类-skill) | Use When / Workflow / Guardrails / Edge Cases |
| 原因分析和下一步验证 | [排障 / Troubleshooting 类](#_3-排障-troubleshooting-类-skill) | Inputs / Workflow / Do Not / Edge Cases |
| 结构化说明文档 | [文档 / 知识沉淀类](#_4-文档-知识沉淀类-skill) | Use When / Inputs / Outputs / Templates |
| 基于外部工具整理后的证据结论 | [工具型 / MCP 协作型](#_5-工具型-mcp-协作型-skill) | Use When / Inputs / Workflow / Guardrails / Outputs |
| 角色清晰的任务拆分与整合结果 | [多 Agent / Subagent 协作型](#_6-多-agent-subagent-协作型-skill) | Use When / Workflow / Outputs / Edge Cases |

## 1. Review 类 skill

适合场景：

- 代码评审
- 设计评审
- 文档评审
- 变更风险检查

这类 skill 的重点不是「把内容讲全」，而是「优先识别问题并按严重程度输出」。

模板：

```md
---
name: review-checklist
description: 在用户请求 review、风险检查、设计评审时使用
---

# Review Checklist

## Use When

- 用户要求 review、检查风险、指出问题
- 需要优先识别 bug、回归、安全问题、缺失测试

## Inputs

- 当前改动
- 相关上下文文件
- 测试、配置、文档变更

## Workflow

1. 先读改动，再补足相关上下文
2. 优先检查 correctness、security、regression
3. 记录问题位置、触发条件、影响范围
4. 按严重程度输出 findings

## Do Not

- 不要先写长篇概述
- 不要把纯风格问题当成核心结论
- 不要在证据不足时下确定性判断

## Outputs

- 先列 findings
- 每条 finding 包含位置、问题、影响
- 如无 findings，明确说明并补充残余风险
```

## 2. 发布 / 上线类 skill

适合场景：

- 发版检查
- 上线前核对
- 发布说明生成
- 变更窗口执行

这类 skill 的重点是「顺序不能乱、检查不能漏、风险要前置暴露」。

模板：

```md
---
name: deploy-checklist
description: 在发布前检查、上线窗口准备、生成发布说明时使用
---

# Deploy Checklist

## Use When

- 用户要求准备发版、发布前检查、上线核对
- 需要输出发布说明或检查上线风险

## Inputs

- 本次版本改动范围
- 相关 PR / issue / migration
- 构建、测试、部署结果

## Workflow

1. 确认本次发布范围和影响面
2. 检查测试、构建、迁移、配置变更
3. 汇总高风险项、回退点和发布注意事项
4. 输出发布说明和上线建议

## Guardrails

- 不要默认测试已经通过，必须核对结果
- 不要忽略数据库迁移和配置变更
- 不要在缺失关键信息时给出「可直接上线」结论

## Edge Cases

- 如果测试结果缺失，明确标记阻塞项
- 如果存在不可回退变更，单独高亮风险
- 如果发现跨服务依赖，补充联动检查项

## Outputs

- 发布范围
- 风险项
- 回退要点
- 发布说明
```

## 3. 排障 / Troubleshooting 类 skill

适合场景：

- 线上故障排查
- CI 失败定位
- Agent 调用失败分析
- 性能问题初步诊断

这类 skill 的重点是「先收集证据，再缩小范围，再给结论」，不能一上来就猜根因。

模板：

```md
---
name: troubleshooting-guide
description: 在排查错误、定位失败原因、分析异常行为时使用
---

# Troubleshooting Guide

## Use When

- 用户要求排查报错、定位失败原因、分析异常行为
- 需要先缩小问题范围，再提出修复建议

## Inputs

- 错误信息
- 日志、trace、命令输出
- 最近相关改动
- 运行环境信息

## Workflow

1. 先提取可验证的现象和错误信号
2. 按组件、链路或时间线缩小问题范围
3. 区分已确认事实、推测原因、待验证项
4. 给出下一步验证建议或修复方向

## Do Not

- 不要只凭单条报错直接断言根因
- 不要跳过复现和证据收集
- 不要把多个猜测混成一个确定结论

## Edge Cases

- 如果无法复现，明确说明依赖的缺失条件
- 如果日志不足，优先指出需要补采的信息
- 如果有多个高概率原因，按优先级列出验证顺序

## Outputs

- 已确认现象
- 高概率原因
- 待验证项
- 下一步建议
```

## 4. 文档 / 知识沉淀类 skill

适合场景：

- 生成 README
- 产出复盘
- 写技术方案摘要
- 整理学习笔记或知识库条目

这类 skill 的重点是「结构稳定、信息完整、读者导向明确」。

模板：

```md
---
name: doc-writer
description: 在生成说明文档、复盘、README 或知识沉淀内容时使用
---

# Doc Writer

## Use When

- 用户要求写 README、总结、复盘、方案说明
- 需要把零散信息整理成结构化文档

## Inputs

- 原始资料
- 目标读者
- 文档用途
- 已知约束和上下文

## Workflow

1. 先确认文档目标、读者和用途
2. 提取核心信息并分组
3. 按固定结构组织正文
4. 检查是否缺少前提、风险或结论

## Templates

- 背景
- 目标
- 方案 / 步骤
- 风险 / 注意事项
- 结论 / 下一步

## Outputs

- 文档结构清晰，面向目标读者
- 先给结论，再补背景和细节
- 避免空泛描述，尽量给出可执行信息
```

## 5. 工具型 / MCP 协作型 skill

适合场景：

- 需要调用搜索、浏览器、设计工具、知识库等外部能力
- 需要把工具结果整理后再交给模型使用
- 需要约束工具使用顺序、输入质量和结果筛选方式

这类 skill 的重点不是「工具能不能用」，而是「什么时候用、先用哪个、结果怎么过滤和落地」。

模板：

```md
---
name: research-with-tools
description: 在需要借助搜索、文档检索、浏览器或其他 MCP 工具完成研究和资料收集时使用
---

# Research With Tools

## Use When

- 用户要求查资料、验证事实、收集外部证据
- 任务依赖搜索、MCP 文档检索、浏览器或其他外部工具

## Inputs

- 用户问题
- 需要验证的关键点
- 可用工具列表
- 输出要求

## Workflow

1. 先明确要验证的问题和证据类型
2. 选择最合适的工具，而不是默认全用
3. 对工具结果做筛选、去重、归类
4. 基于证据输出结论，并保留来源

## Guardrails

- 不要为了显得全面而无差别调用所有工具
- 不要把未经筛选的原始结果直接当结论
- 不要丢失来源、时间和上下文

## Outputs

- 先给结论
- 再给证据和来源
- 明确哪些是事实，哪些是推断
```

## 6. 多 Agent / Subagent 协作型 skill

适合场景：

- 任务可以拆成多个角色并行推进
- 需要把研究、实现、验证、review 分给不同代理
- 需要明确子任务边界和交付格式

这类 skill 的重点是「如何拆分任务、避免重复劳动、明确交接边界」，而不是简单地「多开几个 agent」。

模板：

```md
---
name: multi-agent-orchestrator
description: 在任务可拆分为多个并行子任务、且需要明确角色分工时使用
---

# Multi Agent Orchestrator

## Use When

- 任务存在多个相对独立的子问题
- 不同子任务可以并行推进
- 需要明确研究、实现、验证、review 的责任边界

## Inputs

- 总任务目标
- 可以拆分的子任务
- 每个子任务的交付物
- 是否存在共享写入范围

## Workflow

1. 先识别主链路和可并行的旁路任务
2. 只把非阻塞、边界清晰的子任务交给 subagent
3. 为每个子任务定义责任范围和交付格式
4. 主代理负责整合结果、检查冲突并收口

## Edge Cases

- 如果子任务高度耦合，不要强行拆分
- 如果多个子任务会改同一块内容，先重新划分边界
- 如果子代理结果冲突，主代理负责统一判断和取舍

## Outputs

- 每个子任务的目标和 owner
- 需要等待的阻塞结果
- 最终整合后的统一结论或变更方案
```

## 选模板时最容易犯的错

- 把 review 类 skill 写成文档类，结果只有概述没有 findings
- 把排障类 skill 写成发布类，结果流程很完整但缺少证据链
- 把发布类 skill 写成通用清单，结果没有风险升级和回退关注点
- 把文档类 skill 写得像操作手册，结果结构僵硬、不面向读者
- 把工具型 skill 写成「工具列表说明」，结果没有选择策略和证据收口
- 把多 Agent skill 写成「随便拆几个子任务」，结果出现重复劳动和边界冲突

一个简单判断方式是：先问自己这类 skill 的「第一产出」到底是什么，然后查页首速查表选对应模板。

如果任务复杂，再按需增加：

- 参考资料入口
- 脚本调用方式
- 模板文件位置
- 风险和回退说明

## 延伸阅读

- [Agent Skill 设计与实践](./skill-design-and-practice.md)：主文档，覆盖原则、目录、组成部分
- [Skill 案例研究：review-checklist](./skill-case-review-checklist.md)：把上面的 Review 模板从 0 到 1 落地的全过程
