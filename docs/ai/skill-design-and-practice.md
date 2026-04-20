---
title: Agent Skill 设计与实践
description: 面向 Agent / LLM 应用的 Skill 指南，覆盖定义、边界、适用场景、设计原则、目录结构与落地方法。
---

# Agent Skill 设计与实践

## 适合人群

- 已经会写 Prompt 和调工具，但还没有把重复工作沉淀成可复用能力的人
- 在做 Codex、Claude Code、Gemini CLI、内部 Agent 平台，希望建立团队 skill 体系的人
- 想搞清 skill 和 Prompt、Tool、MCP、Subagent 分别负责什么的人

## 学习目标

- 理解 skill 在 Agent 工程中的准确位置
- 知道什么时候该把经验写成 skill，而不是继续堆在系统提示词里
- 掌握 skill 的最小结构、设计原则和团队落地方式

## 快速导航

- [Skill 是什么](#skill-是什么)
- [它在 Agent 工程中的位置](#它在-agent-工程中的位置)
- [和 Prompt、Tool、MCP、Subagent 的区别](#和-prompt-tool-mcp-subagent-的区别)
- [什么时候应该抽成 skill](#什么时候应该抽成-skill)
- [核心五要素总览](#核心五要素总览)
- [设计原则](#设计原则)
- [目录结构与命名规范](#目录结构与命名规范)
- [写作模板与组成部分](#写作模板与组成部分)
- [Skill 评审 Checklist](#skill-评审-checklist)
- [工程落地建议](#工程落地建议)
- [常见失败点](#常见失败点)
- [延伸阅读](#延伸阅读)

附录：

- [Skill 类型模板速查](./skill-templates-by-type.md)：6 类常见 skill 的可复用模板
- [Skill 案例研究：review-checklist](./skill-case-review-checklist.md)：从 0 到 1 设计一个真实 skill 的全过程

## Skill 是什么

在 Agent 场景里，skill 可以理解成一份「按需注入的专长包」。

它不是模型参数本身的能力，也不是单次对话里临时写的一段提示词，而是把某类任务的做法固化成可复用资产。常见内容包括：

- 任务说明
- 操作步骤
- 约束条件
- 示例输入输出
- 参考资料
- 辅助脚本或模板

如果说 Prompt 更像一次请求里的「即时指令」，那么 skill 更像团队长期沉淀下来的「可复用工作手册」。

## 它在 Agent 工程中的位置

如果把 Agent 看成一条运行链路：

1. `Prompt` 定义当前任务的行为规则
2. `Context` 提供这次推理要看的事实和状态
3. `Tools / MCP` 提供可调用能力
4. `Harness` 负责把任务稳定跑起来
5. `Skills` 负责把特定任务域的经验和流程复用起来

所以 skill 回答的问题是：**这类任务有没有一套已经验证过的做法，可以按需拿来复用。**

相关专题：

- [Prompt Engineering 实践指南](./prompt-engineering.md)
- [Context Engineering 实践指南](./context-engineering.md)
- [Harness Engineering 实践指南](./harness-engineering.md)
- [Tool Calling 设计清单](./tool-calling-design-checklist.md)

## 和 Prompt、Tool、MCP、Subagent 的区别

| 概念 | 核心作用 | 更像什么 | 典型产物 |
|------|----------|----------|----------|
| **Prompt** | 约束模型本次怎么回答或决策 | 当前会话指令 | system prompt、few-shot、输出格式 |
| **Skill** | 复用某类任务的方法论和流程 | 专项 SOP / playbook | `SKILL.md`、模板、脚本、参考资料 |
| **Tool** | 提供可执行动作 | 函数 / API | 搜索、数据库查询、代码执行 |
| **MCP** | 把外部工具和上下文接入 Agent | 工具接入协议 | 文档检索、浏览器、设计工具 |
| **Subagent** | 把子任务拆给另一个代理执行 | 协作角色 | reviewer、researcher、worker |

一个常见误区是把这些东西混在一起：

- skill 不是工具。skill 通常告诉 Agent 「该怎么做」，工具负责「真的去做」
- skill 不是 MCP。MCP 解决接入问题，skill 解决经验复用问题
- skill 也不是 subagent。subagent 解决并行分工，skill 解决知识和流程沉淀

## 什么时候应该抽成 skill

判断一段经验要不要做成 skill，可以问 3 个问题：

1. 这类任务未来还会不会重复出现？
2. 有没有一套相对稳定的步骤和输出标准？
3. 写成 skill 之后，能不能让新同学或 Agent 明显少走弯路？

如果这 3 个问题大多都能回答「是」，通常就值得沉淀成 skill。常见适合场景：

- 同一类任务会重复出现，比如发版检查、PR review、事故复盘、文档生成
- 任务有明确步骤和质量标准，不希望每次都重新解释
- 新同学接手时容易漏步骤，需要一份稳定 SOP
- 需要绑定模板、脚本、参考资料，而不是只有一段自然语言说明
- 团队希望把经验沉淀成可持续演进的资产

反过来，如果只是一次性需求、没有复用价值、依赖大量临场判断，通常还不必上升为 skill。

## 核心五要素总览

最小可用 skill 往往至少包含一份清晰的说明文档。更完整的 skill 通常按这 5 层组织：

| 层 | 回答的问题 | 是否必须 |
|---|---|---|
| **任务定义** | 解决什么问题？什么时候触发？不适合什么？ | 必须 |
| **执行步骤** | 输入要检查什么？推荐顺序？产出长什么样？ | 必须 |
| **约束和边界** | 哪些目录/命令/操作不能动或需要确认？ | 必须 |
| **示例和模板** | 示例输入、示例输出、文件模板 | 推荐 |
| **辅助资源** | 参考文档、检查清单、可复用脚本 | 可选 |

更细的字段拆解（10 个组成部分：Metadata / Use When / Workflow / Do Not / Inputs / Outputs / References / Templates / Scripts / Edge Cases）见下文「[写作模板与组成部分](#写作模板与组成部分)」。

## 设计原则

### 1. 一招鲜，而不是大杂烩

一个 skill 最好只解决一类清晰问题，例如：

- `deploy-checklist`
- `gh-address-comments`
- `skill-vetter`
- `ppt-outline-writer`

不要把「前端开发全流程」「所有研发动作合集」都塞进一个 skill，否则触发条件模糊、说明过长、上下文成本也会失控。

### 2. 写触发条件，不只写内容

skill 不只是「知识库条目」，更应该写清：

- 什么用户意图会触发它
- 哪些关键词或场景最相关
- 哪些相近场景不要误触发

这样才能减少「明明有 skill，却一直没被正确用上」的问题。

### 3. 先给流程，再给背景

大多数执行类 skill，最有价值的部分不是长篇背景介绍，而是：

1. 先做什么
2. 再做什么
3. 遇到异常怎么办
4. 最终产出长什么样

背景知识可以保留，但应该服务于执行，而不是淹没执行路径。

### 4. 让产出可检查

skill 最好明确结果标准，例如：

- 必须给出文件路径和修改点
- review 必须先报 findings，再给总结
- 文档必须包含目标、步骤、风险、结论

没有验收标准的 skill，最后常常只是「多了一段漂亮话」。

### 5. 降低上下文成本

skill 不是越长越好。真正好用的做法通常是：

- 主说明文档只写关键规则
- 长参考资料按需再读
- 示例只保留最典型的 1-3 个
- 脚本能自动化的部分就不要全靠文字描述

## 目录结构与命名规范

skill 真正开始变多之后，最容易先乱掉的不是内容质量，而是命名和目录组织。一旦命名风格不统一，后面就会出现：

- 看名字不知道 skill 是干什么的
- 一个 skill 越写越大，没人知道该不该拆
- 不同 skill 的模板、脚本、参考资料互相污染

所以建议尽早定下命名、目录和拆分规则。

### 1. 命名公式与风格

推荐使用：

- 全小写、连字符分隔
- 名称直接表达**「场景 / 任务类型 + 动作 / 产物」**

| 推荐 | 不推荐 | 原因 |
|---|---|---|
| `review-checklist` | `mySkill` | 看不出用途 |
| `deploy-checklist` | `general-helper` | 太宽泛，容易越长越大 |
| `troubleshooting-guide` | `all-in-one-agent` | 不利于团队共享 |
| `pr-summary-writer` | `misc-tools` | 抽象到没法复用 |
| `research-with-tools` | `final-final.md` | 维护成本高 |

如果 skill 明显依赖工具或角色，也可以在名字里体现：`research-with-tools`、`github-pr-review`、`subagent-task-splitter`。

**名字够表达用途就停。** 更细的适用范围应写进 `description`、`Use When` 或子目录说明，而不是塞进名字。例如 `review-checklist` 比 `backend-pr-security-and-regression-review-checklist` 更稳。

### 2. 标准目录结构

```text
review-checklist/
├── SKILL.md              # 入口和主流程
├── references/           # 扩展知识，按需读
│   ├── severity-levels.md
│   └── common-regressions.md
├── templates/            # 固定产物格式
│   └── review-output.md
└── scripts/              # 可执行动作
    └── check-diff.sh
```

职责分配：

- `SKILL.md`：告诉 Agent 何时使用、怎么执行、最终输出什么
- `references/`：放严重级别定义、常见回归等长期沉淀的扩展知识
- `templates/`：固定输出模板，减少格式漂移
- `scripts/`：可复用的辅助动作（预检查、收集信息、报告生成）

文件命名建议：

- 主入口固定为 `SKILL.md`
- 参考资料文件名表达主题（`severity-levels.md`，不要 `note1.md`）
- 模板文件名表达用途（`review-output.md`）
- 脚本文件名表达动作（`check-diff.sh`、`collect-logs.sh`）

避免 `temp.md`、`test.sh`、`new-template.md`、`final-final.md` 这类短期省事、长期失控的命名。

### 3. 拆分时机

一个 skill 刚开始通常只需要一个 `SKILL.md`。**当出现下面情况时再拆：**

- 主文件已经同时承担说明、背景、模板、脚本说明，读起来太长
- 参考资料很多，但每次只用其中一小部分
- 输出格式有固定模板，单独放更清楚
- 有脚本或命令需要复用，不想埋在正文里

推荐演进顺序：先只有 `SKILL.md` → 再补 `templates/` → 再补 `references/` → 最后才补 `scripts/`。也就是：先把说明写清，再抽模板，再沉淀知识，最后把高频动作自动化。

### 4. 不该拆太细

拆分不是越多越好。拆太细会带来：

- 入口文档只剩一句话，真正要点散落各处
- Agent 每次都要跳很多文件，反而增加上下文成本
- 小文件过多，维护时不容易发现哪些已经过期

通常下面这种规模还不必急着拆：主文件不到几百行、没有独立模板、没有脚本、参考资料只有 1-2 条。这时一个 `SKILL.md` 往往就够了。

### 5. 团队协作的隐含约定

如果是团队共用 skill，建议再补一条规则：**一个 skill 只负责一类主要任务**。

- 新需求优先判断「扩展现有 skill」还是「新建一个 skill」
- 如果新增内容已经改变了 skill 的核心职责，就新建目录，而不是继续往原 skill 里堆

例如：

- `review-checklist` 不应该顺手长成「上线检查 + 发布说明 + 复盘模板」合集
- `research-with-tools` 不应该演变成通用浏览器操作百科

## 写作模板与组成部分

### 最小模板

下面是一个适合作为起点的最小模板：

```md
---
name: review-checklist
description: 代码评审清单，在用户请求 review 或检查改动风险时使用
---

# Review Checklist

## Use When

- 用户要求 review、code review、检查风险
- 需要优先找 bug、回归、缺少测试

## Do

1. 先读改动和相关上下文
2. 优先找 correctness、security、regression
3. 按严重程度输出 findings
4. 最后再给简短总结

## Do Not

- 不要先写大段概述再找问题
- 不要把代码风格问题当成主要结论

## Output

- 每条 finding 需要包含位置、问题、影响
```

如果任务复杂，建议补成下面的「完整结构」。

### 10 个组成部分详解

| # | 字段 | 作用 | 何时必填 |
|---|---|---|---|
| 1 | **Metadata** (`name` / `description`) | 让系统知道这是谁、什么时候触发 | 必填 |
| 2 | **Use When** | 明确触发场景，避免误用或漏用 | 必填 |
| 3 | **Workflow / Do** | 给出执行顺序：先做什么、再做什么 | 必填 |
| 4 | **Do Not / Guardrails** | 告诉 Agent 哪些做法不能做，防止跑偏 | 必填 |
| 5 | **Inputs** | 执行前要收集哪些文件 / 上下文 / 配置 | 执行型 skill 必填 |
| 6 | **Outputs** | 最终产出格式、顺序、必含字段 | 必填 |
| 7 | **References** | 补充知识入口，避免主文件过长 | 团队级 skill 推荐 |
| 8 | **Templates** | 固定格式的产出模板 | 输出有稳定格式时推荐 |
| 9 | **Scripts** | 把高频动作自动化 | 有重复操作时推荐 |
| 10 | **Edge Cases** | 信息不足、命令失败、结果冲突时怎么办 | 真实生产环境必填 |

> Do Not / Guardrails 这一节非常重要：很多 skill 失效不是「不会做」，而是「做过头了」。

### 完整骨架示例

```md
---
name: review-checklist
description: 代码评审清单，在用户请求 review 或检查改动风险时使用
---

# Review Checklist

## Use When

- 用户要求 review、code review、检查改动风险
- 需要优先关注正确性、回归、安全、缺失测试

## Inputs

- 当前分支改动
- 相关文件上下文
- 测试和配置变更

## Workflow

1. 先阅读改动和相关上下文
2. 优先检查 correctness、security、regression
3. 记录可复现的问题和影响范围
4. 按严重程度输出 findings

## Do Not

- 不要先写大段概述再找问题
- 不要把纯风格问题当成主要结论
- 不要在证据不足时下确定性结论

## Outputs

- 先列 findings
- 每条 finding 包含位置、问题、影响
- 没有 findings 时明确说明，并补充残余风险或测试缺口

## Edge Cases

- 如果缺少上下文，先补读相关文件
- 如果无法验证，明确说明未验证项

## References

- references/review-severity.md
- templates/review-output.md

## Scripts

- scripts/check-diff.sh
```

### 怎么判断哪些部分必须写

最小判断法：

- **说明型 skill**：至少写 `Use When`、`Do`、`Do Not`、`Outputs`
- **执行型 skill**：再补 `Inputs`、`Workflow`、`Edge Cases`
- **团队级 skill**：再补 `References`、`Templates`、`Scripts`

换句话说，skill 越接近真实生产流程，越需要把「输入、边界、输出、异常处理」写完整。

### 按 skill 类型选模板

不同任务类型该强调的字段不一样。先问自己「第一产出是什么」，再到 [Skill 类型模板速查](./skill-templates-by-type.md) 查对应模板：

| 第一产出 | 对应模板 |
|---|---|
| 问题列表 | Review 类 |
| 执行检查结果 | 发布 / 上线类 |
| 原因分析和下一步验证 | 排障 / Troubleshooting 类 |
| 结构化说明文档 | 文档 / 知识沉淀类 |
| 基于外部工具整理后的证据结论 | 工具型 / MCP 协作型 |
| 角色清晰的任务拆分与整合结果 | 多 Agent / Subagent 协作型 |

想看完整端到端例子，参考 [Skill 案例研究：review-checklist](./skill-case-review-checklist.md)。

## Skill 评审 Checklist

写完一个 skill，或者准备 review 别人的 skill 时，可以直接用下面这份 checklist 做快速判断。

### 1. 名字是否清楚

- 看到名字就能大致猜到用途
- 名字没有过度宽泛，也没有塞进太多细节
- 目录名和 skill 名保持一致

如果名字像 `general-helper`、`misc-tools` 这种，看起来就已经有失控风险。

### 2. 职责是否单一

- 只解决一类主要问题
- 没把多个不相干任务硬塞在一起
- 读完 `Use When` 后能清楚知道它负责什么、不负责什么

常见坏味道：同一个 skill 既想做 review，又想做发布检查，还想顺手生成文档。

### 3. 触发条件是否明确

- `Use When` 写清了用户会怎么表达这类需求
- 能看出最匹配的任务意图
- 能区分相近但不应该误触发的场景

如果触发条件写得太模糊，skill 往往会出现「该用时没用，不该用时乱用」。

### 4. 执行流程是否清晰

- `Workflow` 或 `Do` 是按顺序写的
- 能看出先做什么、后做什么
- 遇到异常时至少有基本处理方式

如果只写背景知识不写流程，这个 skill 通常很难真正落地。

### 5. 边界和禁区是否写清

- 明确写了 `Do Not` 或 `Guardrails`
- 能看出哪些事情不能做
- 高风险操作是否要求确认

没有边界的 skill，最常见的问题不是能力不够，而是越界和跑偏。

### 6. 输出标准是否可检查

- `Outputs` 写清了最终产出格式
- 能看出先输出什么、后输出什么
- 结果里是否必须包含位置、风险、来源、结论等关键信息

如果输出标准不明确，skill 很容易沦为「每次都看运气」的提示词。

### 7. 结构是否和复杂度匹配

- 简单 skill 没有过度拆分
- 复杂 skill 已经把模板、参考资料、脚本分开
- `SKILL.md` 仍然保持入口清晰，不需要读很多文件才能理解主流程

判断重点不是「文件越多越专业」，而是「信息组织是否刚刚好」。

### 8. 是否沉淀了真正可复用的资产

- 是否有可复用模板
- 是否有常见案例或参考资料
- 是否把高频动作抽成脚本或固定步骤

如果一个 skill 只有一段泛泛而谈的说明，通常还谈不上「沉淀」。

### 9. 是否考虑了真实使用后的演进

- 是否容易补充新案例、新模板、新脚本
- 是否有 owner 或维护责任
- 是否能在真实使用后持续更新，而不是写完就放着

真正好的 skill，不是第一次写得多完美，而是能随着团队实践变得越来越稳。

### 10. 一句话总判断

如果你只想用一句话判断一个 skill 值不值得留下，可以问：

**它能不能让下一个接手的人，比不使用它时明显少走弯路？**

如果答案是「不能」，通常说明这个 skill 还没写到位。

### 简版打勾清单

```text
[ ] 名字清楚，看名字就知道用途
[ ] 职责单一，没有把多个任务混在一起
[ ] Use When 明确，不容易误触发
[ ] Workflow 清楚，执行顺序稳定
[ ] Do Not / Guardrails 写清边界
[ ] Outputs 可检查，结果格式明确
[ ] 结构和复杂度匹配，没有过度拆分或过度堆积
[ ] 模板 / 参考资料 / 脚本中至少有一类真正可复用资产
[ ] 能在真实使用后持续更新
[ ] 这个 skill 确实能减少漏项、返工或判断漂移
```

## 工程落地建议

### 个人使用

- 先把自己每周都会重复做的事整理成 3-5 个 skill
- 优先沉淀最容易忘步骤、最容易返工的任务
- 每次真实使用后再回头修文档，而不是一开始写得过于宏大

### 团队使用

- 把 skill 当作团队 SOP，而不是个人灵感收藏
- 让 skill 和代码仓库一起版本化，随流程演进更新
- 在 PR review、发版、故障处理后回收经验，反补到 skill
- 给 skill 指定 owner，避免长期无人维护

### 和 Agent 系统配合

- skill 负责沉淀经验
- Prompt 负责当前任务约束
- Tool / MCP 负责执行能力
- Harness 负责权限、观测、回放和稳定性

这几层分清之后，系统会明显更容易演进。

## 常见失败点

### 1. 什么都想放进 skill

结果是文档很长，但没有明确触发点，也没有稳定执行路径。

### 2. 只有背景，没有步骤

这种 skill 看起来知识很多，但真正做任务时帮不上忙。

### 3. 只有步骤，没有边界

不写「不该做什么」，很容易导致误用、越权或产出跑偏。

### 4. 不和真实工作流绑定

如果没有模板、脚本、目录约定、输出规范，skill 往往停留在概念层。

### 5. 长期不维护

skill 一旦脱离真实流程更新，很快就会变成过期说明，反而降低团队信任度。

## 延伸阅读

本系列内附录：

- [Skill 类型模板速查](./skill-templates-by-type.md)：6 类常见 skill 的可复用模板
- [Skill 案例研究：review-checklist](./skill-case-review-checklist.md)：从 0 到 1 的完整演进过程

相关专题：

- [Prompt Engineering 实践指南](./prompt-engineering.md)：模型行为约束
- [Context Engineering 实践指南](./context-engineering.md)：信息怎么进模型
- [Harness Engineering 实践指南](./harness-engineering.md)：运行时怎么把任务跑稳
- [Tool Calling 设计清单](./tool-calling-design-checklist.md)：工具接口怎么设计
- [Codex 使用指南](../tools/codex.md)：Codex 里 skills、MCP、subagents 放在哪里
