---
title: Skill 案例研究：从 0 到 1 设计 review-checklist
description: 用一个真实例子完整演示从问题识别、命名、目录、最小版到团队级 skill 的演进过程。
---

# Skill 案例研究：从 0 到 1 设计 review-checklist

前面的文章讲的是原则、模板和分类。本文给一个完整示例，演示怎么从「一个反复出现的问题」出发，逐步设计出可用的 skill。

这里选一个最典型、也最适合团队沉淀的场景：`review-checklist`。

> 本页是 [Agent Skill 设计与实践](./skill-design-and-practice.md) 的附录。如果还不熟悉 skill 的概念、组成和命名规范，建议先读主文档。

## 第 1 步：先确认它值不值得做成 skill

先看 3 个判断问题（详见主文档「[什么时候应该抽成 skill](./skill-design-and-practice.md#什么时候应该抽成-skill)」）：

1. 这类任务会不会反复出现？
2. 有没有相对稳定的步骤和输出标准？
3. 写成 skill 后，能不能明显减少漏项和返工？

对 code review 来说，这 3 个问题通常都是「是」：

- 每个仓库、每个 PR 都会遇到 review
- review 的主目标相对稳定，就是优先找 bug、回归、安全和缺失测试
- 如果没有统一方法，大家很容易一会儿写总结、一会儿找问题，质量不一致

所以这类任务非常适合沉淀成 skill。

## 第 2 步：给它起一个稳定名字

按主文档的命名规则：

- 任务类型：`review`
- 目标产物：`checklist`

于是得到：

```text
review-checklist
```

这个名字的好处是：

- 一眼能看出是评审类 skill
- 不绑定某个语言、框架或个人习惯
- 后面如果需要扩展到设计评审、文档评审，也还有空间

## 第 3 步：确定它的核心职责

这个 skill 不应该包办所有事情，它只负责一件主任务：

**在用户请求 review 时，优先识别问题并按严重程度输出。**

它不负责：

- 自动修复所有问题
- 代替完整测试流程
- 生成冗长的改动总结
- 变成通用代码助手

这一步很关键。很多 skill 写坏，就是因为没有先收紧职责。

## 第 4 步：确定目录结构

根据主文档的拆分规则，一个比较合适的目录会是：

```text
review-checklist/
├── SKILL.md
├── references/
│   ├── severity-levels.md
│   └── common-regressions.md
├── templates/
│   └── review-output.md
└── scripts/
    └── check-diff.sh
```

为什么这样拆：

- `SKILL.md` 放触发条件、执行流程、边界和输出要求
- `references/severity-levels.md` 放严重程度定义，避免主文件过长
- `references/common-regressions.md` 放常见回归类型，方便长期沉淀
- `templates/review-output.md` 放统一输出格式
- `scripts/check-diff.sh` 放辅助检查动作，而不是把命令埋在正文里

## 第 5 步：先写最小版 SKILL.md

不要一上来就写特别大。先把最小主流程写清：

```md
---
name: review-checklist
description: 在用户请求 review、风险检查、设计评审时使用
---

# Review Checklist

## Use When

- 用户要求 review、检查风险、指出问题
- 需要优先识别 bug、回归、安全问题、缺失测试

## Workflow

1. 先读改动和相关上下文
2. 优先检查 correctness、security、regression
3. 记录问题位置、触发条件和影响范围
4. 按严重程度输出 findings

## Do Not

- 不要先写大段概述
- 不要把纯风格问题当成主要结论
- 不要在证据不足时下确定性判断

## Outputs

- 先列 findings
- 每条 finding 包含位置、问题、影响
- 没有 findings 时明确说明，并补充残余风险
```

这个版本已经能用，因为最重要的 4 件事都在：

- 什么时候用
- 怎么做
- 不该怎么做
- 最后输出什么

## 第 6 步：补团队真正会复用的部分

当这个 skill 开始重复使用后，再逐步补下面几层。

### 1. 严重级别定义

例如在 `references/severity-levels.md` 里写：

```md
# Severity Levels

- P0：阻断发布或会造成严重故障
- P1：高风险 correctness / security 问题
- P2：中等风险回归或稳定性问题
- P3：低风险问题或改进建议
```

这样做的好处是，不同 reviewer 和 Agent 不会各自定义「严重」。

### 2. 常见回归清单

例如在 `references/common-regressions.md` 里写：

- 配置项默认值变化
- 缺少空值处理
- 超时 / 重试逻辑被破坏
- 缓存键或数据结构不兼容
- 测试未覆盖关键分支

这类内容特别适合长期积累，因为它反映的是团队真实踩过的坑。

### 3. 输出模板

例如在 `templates/review-output.md` 里写：

```md
## Findings

- [Severity] file:line
  问题：
  影响：

## Open Questions

- 如有未验证项，列在这里

## Summary

- 简要总结整体风险
```

这样做以后，review 风格就会明显稳定。

### 4. 辅助脚本

例如 `scripts/check-diff.sh` 可以负责：

- 收集 diff 范围
- 列出改动文件
- 提示是否涉及配置、测试、迁移

脚本不一定复杂，关键是把重复动作自动化。

## 第 7 步：把它从「能用」升级成「团队可维护」

一个真实 skill 写到这一步，还不算结束。最好再补 3 个维护动作：

### 1. 给它一个 owner

否则过几周之后，没人知道谁该更新严重级别和回归清单。

### 2. 在真实 review 后回收经验

每次遇到下面这些情况，就应该反补 skill：

- 出现新的高频回归类型
- 大家对严重级别判断不一致
- 输出格式越来越飘
- 某些检查项总被漏掉

### 3. 控制它的边界

如果你发现有人开始把这些内容往 `review-checklist` 里塞：

- 发布检查
- PR 描述生成
- 故障排障
- 架构设计总结

那就说明它该拆了，而不是继续往里堆。

## 第 8 步：看看最终成品应该长什么样

一个比较成熟的 `review-checklist` skill，最后通常会具备下面这些特征：

- 名字稳定，目录清晰
- `SKILL.md` 只负责入口和主流程
- 严重级别、回归案例、输出模板各自独立
- 能约束 Agent 先报 findings 再总结
- 能随着团队 review 经验持续更新

换句话说，它已经不再只是「一段提示词」，而是一份真正可演进的团队资产。

## 抽象成通用方法

如果把这个例子总结成一条通用方法，其实就是：

1. 先找一个高频、稳定、有明显产出标准的任务
2. 用简单清晰的名字把它单独收口
3. 先写最小版 `SKILL.md`
4. 再把可复用的知识、模板、脚本逐步拆出去
5. 最后通过真实使用不断修正边界和内容

这也是从 0 到 1 设计 skill 最稳的一条路。

## 延伸阅读

- [Agent Skill 设计与实践](./skill-design-and-practice.md)：主文档，覆盖原则、目录、组成部分、评审 checklist
- [Skill 类型模板速查](./skill-templates-by-type.md)：6 类常见 skill 的可复用模板
