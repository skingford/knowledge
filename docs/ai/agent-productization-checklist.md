---
title: Agent 产品化 Checklist
description: 面向 Agent / LLM 系统上线落地的产品化清单，覆盖目标定义、风险边界、评测、观测、权限、成本和灰度发布。
---

# Agent 产品化 Checklist

## 适合人群

- 已经有一个能跑的 Agent Demo，准备进入试点、灰度或正式上线的人
- 需要把“看起来能用”变成“线上能守住”的工程师或负责人
- 想系统检查目标、权限、评测、回放、预算和发布策略是否齐全的团队

## 学习目标

- 建立 Agent 从 Demo 到产品的最小上线清单
- 知道上线前该补哪些控制面，而不是只盯模型效果
- 学会从目标、风险、评测、运行时和运营反馈几层做验收

## 快速导航

- [先确认是不是值得产品化](#先确认是不是值得产品化)
- [目标和边界 checklist](#目标和边界-checklist)
- [Prompt 与上下文 checklist](#prompt-与上下文-checklist)
- [工具与权限 checklist](#工具与权限-checklist)
- [评测与回归 checklist](#评测与回归-checklist)
- [观测与回放 checklist](#观测与回放-checklist)
- [成本与容量 checklist](#成本与容量-checklist)
- [灰度发布 checklist](#灰度发布-checklist)
- [运营反馈 checklist](#运营反馈-checklist)

## 先确认是不是值得产品化

不是所有 Agent Demo 都值得产品化。先问 3 个问题：

1. 这个系统是否真的解决高频且重复的问题？
2. 人工流程是否已经足够清晰，能被系统化表达？
3. 失败一次的代价是否在可控范围内？

如果这些问题都答不清，先别急着上线，先把场景打磨清楚。

## 目标和边界 checklist

- [ ] 任务目标是否明确，不是泛泛地“让 Agent 更聪明”
- [ ] 成功标准是否可量化，例如完成率、节省时间、人工接管率
- [ ] 失败边界是否明确，例如哪些场景必须拒答或转人工
- [ ] 责任边界是否明确，例如模型负责建议，系统负责执行，人工负责最终审批

## Prompt 与上下文 checklist

- [ ] System Prompt 是否有清晰角色、目标、禁止项和输出约束
- [ ] 上下文是否做了裁剪、排序和来源标注
- [ ] 长会话是否已有摘要和状态压缩策略
- [ ] 关键回答是否能引用知识依据，而不是纯靠模型猜

## 工具与权限 checklist

- [ ] 每个工具是否有最小权限边界
- [ ] 高风险写操作是否需要审批、确认或二次校验
- [ ] 工具失败后是否有重试、降级或转人工逻辑
- [ ] tool schema 是否稳定，参数是否可校验

## 评测与回归 checklist

- [ ] 是否有覆盖主路径、边界样本和对抗样本的评测集
- [ ] 每次改 Prompt、模型、工具或检索配置后是否会自动回归
- [ ] 是否区分了任务完成率、工具成功率、结构合法率、人工接管率
- [ ] 失败样本是否会沉淀回评测集

## 观测与回放 checklist

- [ ] 是否有完整 trace，而不是只看最终回答
- [ ] 是否记录 prompt/context/tool/workflow 的版本号
- [ ] 是否能回放关键失败任务
- [ ] 是否能把失败归类到 Prompt / Context / Tool / Workflow

## 成本与容量 checklist

- [ ] 每任务 token 成本是否可估算
- [ ] 工具调用次数和外部依赖成本是否可控
- [ ] 峰值流量下的延迟、并发、限流是否有预案
- [ ] 是否能根据任务风险分配不同模型和预算

## 灰度发布 checklist

- [ ] 是否先从低风险场景和小流量开始
- [ ] 是否有 A/B 或影子模式，而不是直接全量切换
- [ ] 是否设置回滚条件和回滚手段
- [ ] 是否有人工兜底通道

## 运营反馈 checklist

- [ ] 是否能收集用户纠错、人工补救和失败原因
- [ ] 是否能把高价值失败样本拉回评测体系
- [ ] 是否能周期性复盘“哪些问题不该由 Agent 解决”
- [ ] 是否有明确 owner 维护 Prompt、工具、知识库和评测集

相关专题：

- [Agent Eval 设计与回归实践](./eval-design-and-regression.md)
- [Agent 可观测性、回放与故障复盘](./observability-replay-and-incident-review.md)
- [Harness Engineering 实践指南](./harness-engineering.md)
- [模型、工具与知识库协同设计](./model-tool-knowledge-collaboration.md)
