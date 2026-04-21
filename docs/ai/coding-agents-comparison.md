---
title: 编程 Agent 横向对比：OpenClaw、Hermes-Agent、Claude Code、Codex
description: 从运行形态、扩展机制、记忆与上下文、权限与沙箱、可观测性与适用场景六个维度，对比四种主流编程类 Agent 的工程取舍。
---

# 编程 Agent 横向对比：OpenClaw、Hermes-Agent、Claude Code、Codex

> **版本基线（截至 2026-04-21）**
>
> - **OpenClaw**: `v2026.4.15`（2026-04-16 发布）· [openclaw/openclaw](https://github.com/openclaw/openclaw)
> - **Hermes-Agent**: `v2026.4.16`（v0.10.0，2026-04-16 发布）· [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
> - **Claude Code**: `v2.1.116`（2026-04 月发布）· [anthropics/claude-code](https://github.com/anthropics/claude-code)
> - **Codex CLI**: 稳定 `rust-v0.122.0` / 最新 alpha `0.123.0-alpha.6`（2026-04-21）· [openai/codex](https://github.com/openai/codex)
>
> 后续版本若有破坏性变更，会在文末「变更记录」追加。

## 适合人群

- 已经试过 Claude Code 或 Codex，想知道 OpenClaw、Hermes-Agent 那类「自托管可进化 Agent」和「CLI 专职编程 Agent」的边界在哪里的工程师
- 需要在团队内做「选哪个 coding agent」决策、又不想站队的技术负责人
- 正在设计自研 Agent 运行时，想从成熟产品里抽取架构范式的系统设计者

## 学习目标

- 分清四者的**定位分层**：个人助手型（OpenClaw、Hermes-Agent）vs 编程 CLI 型（Claude Code、Codex）
- 看清四者的**扩展机制差异**：SOUL.md / skills / hooks / AGENTS.md 各自解决什么
- 知道**什么场景选谁**，而不是盲目追最新最火

## 快速导航

- [为什么要把这四者放到一起比](#为什么要把这四者放到一起比)
- [一句话定位](#一句话定位)
- [OpenClaw 架构解析](#openclaw-架构解析)
- [Hermes-Agent 架构解析](#hermes-agent-架构解析)
- [Claude Code 架构解析](#claude-code-架构解析)
- [Codex 架构解析](#codex-架构解析)
- [六维对比矩阵](#六维对比矩阵)
- [四者并列架构图](#四者并列架构图)
- [选型建议](#选型建议)
- [常见误用与失败点](#常见误用与失败点)

## 为什么要把这四者放到一起比

表面看，这四者好像不是一个赛道：

- OpenClaw 是「个人 AI 助手」，走多通道消息（WhatsApp、Telegram、iMessage…）
- Hermes-Agent 是 Nous Research 的「自进化 Agent」，主打学习闭环和记忆
- Claude Code、Codex 是「终端里写代码的 CLI Agent」

但实际落到工程团队手里，它们解决的都是同一件事：

> **把一个能力不稳定、上下文有限的模型，包成一个能长时间跑、能扩展、能观测、能审批的 Agent 运行时。**

只是四者从不同角度切入。要做选型，就得同时看它们把哪些问题打在了前台。

## 一句话定位

| 项目 | 一句话定位 |
|------|-----------|
| **OpenClaw** | 个人化 AI 助手平台，以「SOUL.md 人格 + 多消息通道 + skills 库」为核心，插件生态丰富 |
| **Hermes-Agent** | 自进化开源 Agent，核心卖点是「三层记忆 + 自动沉淀 skill 的学习闭环」 |
| **Claude Code** | Anthropic 官方终端 Agent，围绕「Tool Use + Hooks + Skills + Sub-agents + MCP」的工程化闭环 |
| **Codex CLI** | OpenAI 官方终端 Agent，以「沙箱执行 + 审批模式 + AGENTS.md 上下文」为核心安全位面 |

## OpenClaw 架构解析

<div class="mermaid-svg-wrapper">

<img class="mermaid-static" src="/mermaid/coding-agents-comparison-mermaid-1.svg" alt="OpenClaw 架构图：用户通过多消息通道接入 Gateway，Gateway 调度 Persona、Skills、Tools 与 Memory" />

</div>

核心组件：

- **Gateway**：控制面，统一接入 WhatsApp / Telegram / Slack / Discord / iMessage / Feishu 等 24+ 消息通道
- **Persona 层**：以 `SOUL.md`（灵魂描述）+ `IDENTITY.md`（身份边界）+ `AGENTS.md`（行为规则）定义一只「龙虾」的性格与底线
- **Skills 库**：文件系统存放，路径固定为 `~/.openclaw/workspace/skills/<skill>/SKILL.md`，社区沉淀 13K+ skill
- **Tools / Plugins**：Google 系（Gemini TTS）、Anthropic 系（Claude Opus 4.7 原生接入）、存储（memory-lancedb 支持云端对象存储）
- **模型无关**：Claude、GPT-4o、Gemini、Ollama 本地模型均可互换

设计取舍：

- **优点**：插件生态广、消息通道多、配置优先（不必写 Python）、强烈的「人格化」体验
- **代价**：2026-03 曾 4 天披露 9 个 CVE，安全面成熟度仍在追赶；对「严肃编程任务」支持弱于专职 coding CLI
- **适合**：个人/小团队的日常助理、多通道接入、跨设备场景

## Hermes-Agent 架构解析

<div class="mermaid-svg-wrapper">

<img class="mermaid-static" src="/mermaid/coding-agents-comparison-mermaid-2.svg" alt="Hermes-Agent 架构图：Planner、Executor、Tool Runner、Observation Loop 与三层记忆存储" />

</div>

核心组件：

- **Planner → Executor → Observation 闭环**：多步任务端到端执行（研究、写代码、API 调用、系统管理）
- **三层记忆 + Honcho**：
  - Session Archive（SQLite + 全文检索，按需摘要注入）
  - Skill Files（只默认加载名称+简介，按需拉全文）
  - Honcho（可选用户建模层，跨 session 积累偏好）
- **学习闭环**：任务完成后自动沉淀可复用 skill 文档，据官方 benchmark 后续同类任务耗时降低 40%
- **多平台网关**：CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Feishu、WeCom、iMessage bridge 等
- **模型灵活**：Nous Portal、OpenRouter（200+ 模型）、NVIDIA NIM、GLM、Kimi、MiniMax、HuggingFace 统一切换

设计取舍：

- **优点**：三层记忆把「context 成本」与「能力增长」解耦（skill 库从 40 涨到 200，context 成本几乎不变）；自动沉淀 skill 的学习闭环是结构性优势
- **代价**：生态年轻（2026-02 才发布），社区 skill 体量远不及 OpenClaw；学习闭环质量依赖模型能力，弱模型下沉淀噪声大
- **适合**：长期个人使用、对「越用越懂我」有期待的场景；重度研究型任务

## Claude Code 架构解析

<div class="mermaid-svg-wrapper">

<img class="mermaid-static" src="/mermaid/coding-agents-comparison-mermaid-3.svg" alt="Claude Code 架构图：CLI Shell、Tool Use、Hooks、Skills、Sub-agents、MCP、Settings" />

</div>

核心组件：

- **CLI Shell + TUI**：终端交互为主，支持 VS Code / Cursor / Windsurf 全屏嵌入
- **Tool Use**：Bash、Read/Write/Edit、Grep/Glob、Agent、WebFetch、WebSearch 等内置工具族
- **Hooks**：`SessionStart`、`PreToolUse`、`PostToolUse`、`UserPromptSubmit`、`Stop` 等生命周期钩子，通过 `settings.json` 配置 shell 命令
- **Skills**：用户可调用的领域技能（`/skill-name`），支持插件市场安装（ECC 等）
- **Sub-agents**：300+ 专业化 subagent（`Plan`、`Explore`、`Code Reviewer`、`Security Engineer`…）可并行派发
- **MCP Servers**：Model Context Protocol 连接 GitHub、Context7、Playwright、Memory Graph 等外部系统
- **Permissions**：`allow` / `ask` / `deny` 三级 + 通配符规则，运行时按需提示

设计取舍：

- **优点**：工程化闭环最完整（hooks + settings + plugins + MCP）；Plan Mode 强制先对齐方案再动手；Sub-agents 让并行调研成本极低
- **代价**：商业专有（不可自托管）；深度定制需学一套 ECC/插件生态；token 成本相对高
- **适合**：重度工程任务、需要审计与协同的团队、已经在 Anthropic 生态的场景

## Codex 架构解析

<div class="mermaid-svg-wrapper">

<img class="mermaid-static" src="/mermaid/coding-agents-comparison-mermaid-4.svg" alt="Codex 架构图：CLI、Approval Gate、Sandbox、Plan Mode、Plugin Marketplace、AGENTS.md" />

</div>

核心组件：

- **CLI + TUI**：Rust 实现，冷启动快；`0.122` 稳定、`0.123-alpha` 持续日更
- **Approval Gate**：`suggest` / `auto-edit` / `full-auto` 三档审批模式，任何写操作可强制进人工确认
- **Sandbox**：macOS `sandbox-exec` / Linux Landlock / Windows 新版沙箱；`v0.123` 起支持 **deny-read glob** 策略
- **Plan Mode**：从全新上下文开始规划，规划与实施上下文分离，可视化上下文占用
- **Plugin Marketplace**：`0.123` 起支持 tabbed 浏览、inline 开关、跨 repo 插件源
- **AGENTS.md**：约定的「项目 + Agent」层级说明文件，类似 CLAUDE.md 的作用
- **codex exec 隔离运行**：忽略用户级配置/规则的干净执行模式

设计取舍：

- **优点**：沙箱与权限模型是四者中最成体系的（尤其 deny-read 与跨平台沙箱）；开源（Apache 2.0），可自托管；Rust 实现性能好
- **代价**：生态起步晚于 Claude Code；alpha 通道迭代极快，版本稳定性需要自己把关
- **适合**：对安全/合规要求高的企业、希望完全掌控运行时的团队、偏好开源路线

## 六维对比矩阵

| 维度 | OpenClaw | Hermes-Agent | Claude Code | Codex |
|------|----------|--------------|-------------|-------|
| **运行形态** | 常驻 Gateway + 多消息通道 | 常驻进程 + 多通道 + CLI | 终端 CLI + IDE 嵌入 | 终端 CLI + IDE 嵌入 |
| **扩展机制** | SOUL.md + skills 目录 + 插件 | skills 文件 + 学习闭环沉淀 | Hooks + Skills + Sub-agents + MCP + 插件市场 | AGENTS.md + 插件市场 + MCP |
| **记忆 / 上下文** | memory-lancedb（本地/云） | 三层记忆 + Honcho 用户建模 | CLAUDE.md + memory MCP + 会话压缩 | AGENTS.md + 会话上下文 + Plan Mode 分离 |
| **权限 / 沙箱** | 按 skill 粒度配置，CVE 爬坡中 | 系统级权限管控较弱，依赖运行环境 | `allow/ask/deny` 三级 + 沙箱模式 | 审批模式 + 平台级沙箱 + deny-read glob |
| **可观测性** | Gateway 日志 + 插件监控 UI | 任务轨迹 + skill 沉淀记录 | 完整 trace + hooks 拦截 + 回放 | 执行日志 + Plan Mode 可视化 + 上下文指标 |
| **适合场景** | 个人/家用 AI 助理、跨通道日常 | 长期个人使用、研究型任务 | 团队协作编程、重度工程任务 | 合规要求高的企业、自托管路线 |

## 四者并列架构图

<div class="mermaid-svg-wrapper">

<img class="mermaid-static" src="/mermaid/coding-agents-comparison-mermaid-5.svg" alt="四者并列架构对比图：按扩展机制、权限模型、记忆层、观测性四行对比 OpenClaw / Hermes-Agent / Claude Code / Codex" />

</div>

这张图按 4 行扫视：

- **扩展**：OpenClaw/Hermes 走文件化 skill，Claude Code 走「Hooks + Skills + Sub-agents + MCP」多层，Codex 走 AGENTS.md + 插件市场
- **权限**：Claude Code 与 Codex 都有完整的三级审批；OpenClaw/Hermes 更多依赖运行时与 skill 自身约束
- **记忆**：Hermes 三层记忆最系统化；其他三者多是「文件 + 会话」混合
- **观测**：Claude Code 的 hooks + replay 最接近生产系统规范；Codex 的 Plan Mode 把「规划 vs 实施」上下文显式切开

## 选型建议

先回答 3 个问题：

1. **你要解决的是日常助理，还是编程任务？**
   - 日常助理 → OpenClaw 或 Hermes-Agent
   - 编程任务 → Claude Code 或 Codex

2. **你能接受商业 SaaS，还是必须自托管开源？**
   - 可接受商业 → Claude Code
   - 必须自托管 → Codex（开源编程）或 Hermes-Agent（开源 MIT，研究型）或 OpenClaw（开源，生态大）

3. **你的安全与审计需求高不高？**
   - 高 → Codex（沙箱 + 审批最完整） 或 Claude Code（hooks + 审计链成熟）
   - 中 → 任选
   - 低（个人用） → OpenClaw / Hermes-Agent

给一张「够用」的判断表：

| 主要目标 | 更稳的起点 |
|---------|-----------|
| **个人多通道 AI 助理** | OpenClaw |
| **长期用下去越用越懂我** | Hermes-Agent |
| **团队重度编程 + 协作审计** | Claude Code |
| **企业合规、必须自托管、偏好开源** | Codex |
| **做 Agent 运行时研究** | 同时拆 Claude Code + Codex，两者的设计取舍最成熟 |

## 常见误用与失败点

- **拿 OpenClaw 当编程 IDE agent 用**：skills 生态再大，也不是为严肃代码提交设计的
- **期待 Hermes-Agent 的学习闭环自动变强**：弱模型下沉淀出来的 skill 质量低，反而会污染上下文
- **Claude Code 里堆太多 hooks**：每条 hook 都是 PreToolUse 级别延迟，过度配置会让交互体验明显拖慢
- **Codex 关掉审批直接 `full-auto`**：沙箱能兜住文件破坏，但托管不了「语义错误的大规模重构」，代码层面的灾难仍可能发生
- **四者混用且不约束 AGENTS.md / CLAUDE.md / SOUL.md 的语义边界**：同一 repo 内三份「Agent 规则」会互相打架，必须显式指定哪份是主源

## 延伸阅读

- [Agent 框架选型对比：LangGraph、LangChain、LlamaIndex、AutoGen、原生 SDK](./framework-selection-and-comparison.md)
- [Harness Engineering 实践指南](./harness-engineering.md)
- [Guardrails、审批与沙箱边界](./guardrails-approvals-and-sandboxing.md)
- [Agent 可观测性、回放与故障复盘](./observability-replay-and-incident-review.md)
- [MCP 协议与工具接入](./mcp-protocol-and-tool-integration.md)

## 变更记录

- **2026-04-21**：首发。版本基线 OpenClaw v2026.4.15 / Hermes-Agent v0.10.0 / Claude Code v2.1.116 / Codex 稳定 v0.122.0。
