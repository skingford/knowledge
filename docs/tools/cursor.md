---
title: Cursor 使用指南
description: Cursor 编辑器与 Cursor Agent CLI 的使用说明，覆盖安装、Tab、Inline Edit、Agent、Rules、Memories、MCP、Background Agents、Bugbot 与自动化。
---

# Cursor 使用指南

这篇文档把 Cursor 的常用能力按实际工作流整理成一份中文速查。内容基于 Cursor 官方文档于 2026 年 3 月 18 日核对，重点覆盖编辑器核心能力、Agent、Rules、Memories、MCP、Background Agents、Bugbot，以及 `cursor` / `cursor-agent` 两套命令行用法。

## Cursor 是什么

Cursor 是一个以代码编辑器为中心的 AI 编程工具。它在 VS Code 式编辑体验之上，叠加了：

- `Tab` 自动补全
- `Inline Edit` 就地编辑
- `Agent` 多文件任务代理
- `Rules` / `Memories` 持久上下文
- `MCP` 外部工具接入
- `Background Agents` 远程异步执行
- `Bugbot` PR 自动审查

如果你是第一次系统使用 Cursor，最值得先掌握的是：

- 安装与代码库索引
- `Tab`、`Ctrl+K`、`Ctrl+I`
- Agent 模式切换
- `.cursor/rules`
- `MCP`
- Background Agent 和 Bugbot

## 快速开始

### 1. 安装 Cursor 编辑器

官方当前推荐直接从官网下载安装：

1. 打开 `cursor.com`
2. 点击 `Download`
3. 安装并启动 Cursor

首次启动时，Cursor 会引导你完成：

- 键位方案选择
- 主题选择
- 终端偏好设置

如果想重新跑 onboarding：

```text
Ctrl+Shift+P
Cursor: Start Onboarding
```

### 2. 登录与账号

官方当前说明：

- 不登录也能使用 Cursor 编辑器本身
- 但 AI 功能需要登录账号后才能完整使用
- 账号可以在设置中管理，控制台在 `cursor.com/dashboard`

### 3. 打开项目并等待索引

当你第一次打开项目时，Cursor 会自动开始 `indexing`。

几个关键点：

- 索引会自动开始
- 通常需要 1 到 15 分钟，取决于仓库大小
- 新文件会增量索引
- 团队可共享索引
- 可以在 `Settings -> Indexing & Docs` 查看进度

你可以把这一步理解为：Cursor 先“学习”代码库，再让后续问答、编辑和搜索更准。

## 日常主工作流

Cursor 最核心的三条主线是：

1. `Tab` 自动补全
2. `Inline Edit` 就地编辑
3. `Agent` 多文件任务处理

### 1. Tab 自动补全

官方 Quickstart 把 `Tab` 视为最轻量、最容易上手的入口。

适合场景：

- 函数骨架补全
- 多行代码续写
- 参数和函数体自动补完
- 跨文件跟随上下文给建议

如果你不想一上来就用 Agent，大多数人先从 Tab 开始最稳。

### 2. Inline Edit

Cursor 的 `Inline Edit` 是非常高频的能力。

核心快捷键：

| 快捷键 | 用途 |
| --- | --- |
| `Ctrl+K` | 对选中代码进行就地编辑 |
| `Alt+Enter` | 对选中代码发起快速提问 |
| `Ctrl+Shift+Enter` | 对整个文件进行大范围编辑 |
| `Ctrl+L` | 把选中代码发送到 Chat / Agent |

几个高频点：

- 选中代码再按 `Ctrl+K`，是最稳妥的局部改法
- 不选中代码时，会在光标位置生成内容
- `Alt+Enter` 很适合先问“为什么”，再输入 `do it`
- 多文件编辑时，不要硬撑在 `Ctrl+K`，直接送去 Chat / Agent

### 3. Agent

`Agent` 是 Cursor 处理复杂编码任务的主入口。

打开方式：

```text
Ctrl+I
```

官方当前说明里，Agent 可以：

- 自主探索代码库
- 编辑多个文件
- 运行终端命令
- 修复错误
- 做更长链路的任务执行

## Agent 模式怎么选

Cursor 当前官方文档把 Agent 模式分成几类：

| 模式 | 适用场景 |
| --- | --- |
| `Agent` | 复杂功能、重构、多文件任务 |
| `Ask` | 只读学习、规划、问答 |
| `Manual` | 精准编辑指定文件 |
| `Custom` | 自定义工作流和工具组合 |

切换方式：

- 在 Agent 面板的模式下拉框切换
- 使用 `Ctrl+.` 快速切换

### 最实用的选择建议

- 不确定时先用 `Ask`
- 需要实现功能时切到 `Agent`
- 已经明确要改哪个文件时用 `Manual`
- 团队流程稳定后再做 `Custom`

官方当前对模式的描述里，`Ask` 是只读探索，`Agent` 会主动搜索、编辑和运行命令，`Custom` 还在 beta。

### 与模式相关的常用设置

官方当前文档里，各模式最常见的设置包括：

- `Model`
- 键盘快捷键
- `Auto-run`
- `Auto-fix Errors`
- `Search Codebase`
- 自定义工具与指令

## Agent 的工具能力

Cursor Agent 内置的工具大致分三类：

### 搜索类

- `Read File`
- `List Directory`
- `Codebase`
- `Grep`
- `Search Files`
- `Web`
- `Fetch Rules`

### 编辑类

- `Edit & Reapply`
- `Delete File`

### 执行类

- `Terminal`
- `MCP`

### 高级执行选项

官方当前文档里，还强调了这些自动化选项：

- `Auto-apply Edits`
- `Auto-run`
- `Guardrails`
- `Auto-fix Errors`

其中最值得注意的是：

- `Auto-run` 会自动执行终端命令
- `Guardrails` 可以用 allow list 限制自动化动作
- 这是安全边界，不建议一上来就全放开

## Rules、Memories 与项目长期上下文

Cursor 的持久上下文核心是 `Rules`。

### 1. Project Rules

项目规则放在：

```text
.cursor/rules
```

官方当前说明里：

- 每个规则文件都是 `.mdc`
- 可版本化
- 可按路径和文件类型作用
- 子目录里还能继续放 `.cursor/rules`

规则类型包括：

| 类型 | 用途 |
| --- | --- |
| `Always` | 总是附带 |
| `Auto Attached` | 命中文件模式时附带 |
| `Agent Requested` | 让 Agent 自己判断是否需要 |
| `Manual` | 只有显式 `@ruleName` 才附带 |

一个最小示例：

```md
---
description: Backend coding rules
globs: backend/**/*.ts
alwaysApply: false
---

- Prefer service layer boundaries.
- Add tests for every new endpoint.
```

### 2. User Rules

用户级规则在 `Cursor Settings -> Rules` 里配置。

特点：

- 对所有项目生效
- 总是带入上下文
- 只支持纯文本，不支持 MDC

适合放：

- 回复语言
- 代码风格偏好
- 个人工作习惯

### 3. Memories

官方当前说明里，`Memories` 是基于 Chat 对话自动生成的规则。

几个关键点：

- 作用域是当前 git 仓库
- 可以在 `Cursor Settings -> Rules` 里查看和删除
- 需要用户确认后才会保存
- 开启 `Privacy Mode` 时不可用

### 4. `.cursorrules`

根目录的 `.cursorrules` 仍然支持，但官方已经明确建议迁移到 `.cursor/rules`。

### 5. 从聊天生成规则

官方当前支持直接在聊天里生成规则：

```text
/Generate Cursor Rules
```

这很适合把你刚讨论好的规范直接沉淀下来。

## 索引、忽略文件与上下文引用

Cursor 的很多“聪明行为”都依赖上下文系统。

### 1. Codebase Indexing

官方当前说明：

- Cursor 会为每个文件计算 embedding
- 默认索引所有文件
- `.gitignore` 和 `.cursorignore` 会影响索引范围
- 大文件和无关目录建议排除

索引控制位置：

```text
Settings -> Indexing & Docs
```

### 2. Ignore Files

如果你不希望 AI 读到某些文件，使用：

```text
.cursorignore
```

官方当前说明里，`.cursorignore` 会阻止这些内容进入：

- Codebase indexing
- Tab / Agent / Inline Edit 可访问代码
- `@` 符号引用上下文

但有个边界要注意：

- Agent 发起的终端命令和 MCP server 仍然可能接触这些代码
- 所以 `.cursorignore` 不是绝对安全沙箱

### 3. `@` 上下文

Cursor 的 `@` 上下文很实用，常见的有：

- `@Files`
- `@Past Chats`
- `@Cursor Rules`
- `@Link`

几个高频场景：

- `@Files`：显式带文件上下文
- `@Past Chats`：把旧会话摘要带进新任务
- `@Link`：粘贴网页或 PDF 链接直接做上下文

## MCP 怎么用

Cursor 原生支持 `MCP`。

### 配置文件位置

官方当前说明的两个主要位置是：

- 项目级：`.cursor/mcp.json`
- 全局级：`~/.cursor/mcp.json`

### 支持的传输方式

| 方式 | 典型场景 |
| --- | --- |
| `stdio` | 本地单用户命令型服务 |
| `SSE` | 本地或远端多用户服务 |
| `Streamable HTTP` | 本地或远端多用户服务 |

### 最小示例

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

几个关键点：

- Cursor 支持 tools、prompts、roots、elicitation 等 MCP 能力
- 支持环境变量传认证信息
- 支持 OAuth 的远端 MCP
- Agent 默认会在需要时申请 MCP tool approval
- 开启 `Auto-run` 后，MCP tool 也可以自动执行

### CLI 里怎么用 MCP

官方当前说明里，`cursor-agent` 会自动复用编辑器的 `mcp.json` 配置。

常用命令：

```bash
cursor-agent mcp list
cursor-agent mcp list-tools playwright
cursor-agent mcp login <identifier>
cursor-agent mcp disable <identifier>
```

## Background Agents

Background Agents 是 Cursor 很有辨识度的能力。

### 核心能力

官方当前说明：

- 在远程隔离环境中异步执行任务
- 可以编辑代码并运行命令
- 你可以查看状态、发送 follow-up、随时接管

打开方式：

- Background Agent sidebar
- `Ctrl+E`

### 环境与安全

官方当前文档明确写到：

- 背景代理默认运行在隔离的 Ubuntu 机器上
- 代理有互联网访问能力
- 会自动运行终端命令
- 这和前台 Agent 的“逐条审批”不同
- 因为会自动执行命令，所以 prompt injection 风险更高

### GitHub 与环境配置

要让 Background Agent 改仓库代码，通常需要：

- 给 Cursor GitHub App 目标仓库的读写权限
- 让它克隆仓库、开分支、推送改动

环境配置可以通过 `environment.json` 指定，例如：

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS",
  "install": "npm install",
  "terminals": [
    {
      "name": "Run Next.js",
      "command": "npm run dev"
    }
  ]
}
```

### 什么时候适合用

- 任务跑得久
- 需要并行多个任务
- 需要远端环境隔离
- 需要从 Slack、PR、Issue 触发

## Bugbot

Bugbot 是 Cursor 的 PR 代码审查能力。

官方当前说明：

- 它会分析 PR diff
- 自动或手动触发评论
- 重点识别 bug、安全问题和代码质量问题

手动触发方式：

```text
cursor review
bugbot run
cursor run
```

### 项目级 Bugbot 规则

Bugbot 当前支持：

```text
.cursor/BUGBOT.md
```

而且会沿着变更文件路径向上查找附加的 `BUGBOT.md`。

这意味着你可以：

- 在项目根目录放总规则
- 在 `backend/`、`frontend/`、`api/` 再放局部规则

### 适合场景

- PR 自动体检
- 安全和行为回归检查
- 把 review 规范沉淀成项目规则

## `cursor` 与 `cursor-agent` 两套命令行

Cursor 有两套不同的终端能力，别混在一起。

### 1. `cursor`

这是打开编辑器文件/目录的 shell command。

官方当前安装方式是在 Cursor 里打开 Command Palette，然后运行：

- `Install 'cursor' to shell`
- `Install 'code' to shell`

安装后可以这样用：

```bash
cursor file.js
cursor ./my-project
cursor -n
cursor -w
```

这套命令本质上是“从终端打开 Cursor 编辑器”。

### 2. `cursor-agent`

这是 Agent CLI。

官方当前安装方式：

```bash
curl https://cursor.com/install -fsS | bash
```

验证：

```bash
cursor-agent --version
```

如果 `~/.local/bin` 不在 PATH，需要补到 shell 配置中。

升级：

```bash
cursor-agent update
cursor-agent upgrade
```

## Cursor Agent CLI 常用法

### 高频命令

| 命令 | 用法 |
| --- | --- |
| `cursor-agent` | 启动交互式 CLI |
| `cursor-agent --resume [chatId]` | 恢复某个会话 |
| `cursor-agent resume` | 恢复最近会话 |
| `cursor-agent ls` | 查看历史会话 |
| `cursor-agent -p "query"` | 非交互打印结果 |
| `cursor-agent -m <model>` | 指定模型 |
| `cursor-agent -a <key>` | 传 API key |
| `cursor-agent -f` | 强制允许命令，除非显式 deny |

### 最实用的几个点

官方当前说明里：

- CLI 支持 `@` 选择文件和目录上下文
- `Ctrl+R` 可 review 改动
- `/compress` 可压缩会话
- 运行终端命令前会要求 `Y/N` 审批
- `--print` 非交互模式支持脚本和 CI
- `--print` 模式默认支持全工具，包括写文件和 bash，风险比只读 CLI 更高

### 非交互输出格式

```bash
cursor-agent -p "summarize this repo" --output-format text
cursor-agent -p "summarize this repo" --output-format json
cursor-agent -p "summarize this repo" --output-format stream-json
```

官方当前说明：

- `json` 适合脚本解析最终结果
- `stream-json` 适合事件流跟踪
- 默认输出格式是 `stream-json`

### 与编辑器规则共享

CLI 会自动读取并复用：

- `.cursor/rules`
- 项目根目录的 `AGENTS.md`
- 项目根目录的 `CLAUDE.md`
- `mcp.json`

所以你完全可以让编辑器和 CLI 共用一套项目规范。

## 模型与使用建议

Cursor 当前支持多家模型提供商的前沿编码模型。

官方当前建议里，最稳妥的默认选项是：

- `Auto`

原因很简单：

- 会在当前负载下选择更可靠的 premium model
- 输出效果退化时会自动切换
- 对大多数日常任务足够稳

### Max Mode 什么时候开

官方当前说明：

- 默认上下文窗口通常是 200k tokens
- `Max Mode` 会把少数模型的上下文窗口拉到更大
- 更慢、更贵
- 只在超大仓库、超长上下文、复杂任务时才值得开

## 推荐落地顺序

如果你想把 Cursor 真正用顺手，建议按这个顺序推进：

1. 先用 `Tab`、`Ctrl+K`、`Ctrl+I`
2. 再学会 `Ask` 和 `Agent` 两种模式切换
3. 给项目补 `.cursor/rules`
4. 用 `.cursorignore` 清理不该读的内容
5. 再接 `MCP`
6. 需要异步重任务时再用 Background Agents
7. PR 审查稳定后接入 Bugbot
8. 最后再把 `cursor-agent` 接进自动化脚本

## 官方资料

建议直接收藏这些官方页面：

- [Welcome](https://docs.cursor.com/)
- [Installation](https://docs.cursor.com/get-started/installation)
- [Quickstart](https://docs.cursor.com/en/get-started/quickstart)
- [Modes](https://docs.cursor.com/agent/custom-modes)
- [Inline Edit](https://docs.cursor.com/cmdk)
- [Tools](https://docs.cursor.com/en/agent/tools)
- [Rules](https://docs.cursor.com/context/rules)
- [Memories](https://docs.cursor.com/en/context/memories)
- [Codebase Indexing](https://docs.cursor.com/context/codebase-indexing)
- [Ignore Files](https://docs.cursor.com/en/context/ignore-files)
- [Model Context Protocol (MCP)](https://docs.cursor.com/context/mcp)
- [MCP for CLI](https://docs.cursor.com/cli/mcp)
- [Background Agents](https://docs.cursor.com/en/background-agents)
- [GitHub Integration](https://docs.cursor.com/en/github)
- [Bugbot](https://docs.cursor.com/bugbot)
- [Shell Commands](https://docs.cursor.com/configuration/shell)
- [Cursor Agent CLI Installation](https://docs.cursor.com/en/cli/installation)
- [Using Agent in CLI](https://docs.cursor.com/en/cli/using)
- [CLI Parameters](https://docs.cursor.com/en/cli/reference/parameters)
- [CLI Output Format](https://docs.cursor.com/en/cli/reference/output-format)
- [Agent Security](https://docs.cursor.com/account/agent-security)
- [Models](https://docs.cursor.com/models)
- [Selecting Models](https://docs.cursor.com/en/guides/selecting-models)
