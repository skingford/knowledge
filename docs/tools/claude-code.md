---
title: Claude Code 使用指南
description: Claude Code 的安装、核心命令、权限模式、CLAUDE.md、Skills、Subagents、MCP、Hooks 与 VS Code 集成实践。
---

# Claude Code 使用指南

这篇文档把 Claude Code 的常用能力按实际工作流整理成一份中文速查。内容基于 Claude Code 官方文档于 2026 年 3 月 17 日核对，重点覆盖终端 CLI、VS Code、权限控制、项目记忆和可扩展能力。

## Claude Code 是什么

Claude Code 可以理解为一个以代码仓库为工作上下文的 Agent 式编码助手：

- 你在项目目录里启动它，它会按需读取代码、执行命令、修改文件
- 默认会在关键操作前请求授权，适合真实仓库日常使用
- 除了终端 CLI，还支持 VS Code、JetBrains、Web、Slack、GitHub Actions 等入口

如果你主要在终端和编辑器里做开发，这几个能力最值得先掌握：

- `claude` 交互式会话
- `claude -p` 非交互式一次性任务
- `CLAUDE.md` 持久化项目约定
- `skills`、`subagents`、`MCP`、`hooks` 扩展能力

## 快速开始

### 1. 安装

官方当前推荐原生安装。

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash

# macOS Homebrew
brew install --cask claude-code

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Windows WinGet
winget install Anthropic.ClaudeCode
```

说明：

- 原生安装会自动后台更新
- Homebrew 和 WinGet 需要你自己定期升级
- Windows 需要先安装 Git for Windows

### 2. 登录

```bash
claude
```

首次启动会引导登录，也可以在会话内执行：

```text
/login
```

官方当前支持的账号来源包括：

- Claude Pro / Max / Teams / Enterprise
- Claude Console
- Amazon Bedrock / Google Vertex AI / Microsoft Foundry

### 3. 进入项目开始使用

```bash
cd /path/to/project
claude
```

第一次进仓库后，先做三件事最稳妥：

1. `what does this project do?`
2. `where is the main entry point?`
3. `explain the folder structure`

如果要看命令和会话管理：

```text
/help
/resume
```

## 最常用的命令

### 会话与 CLI

| 命令 | 用法 |
| --- | --- |
| `claude` | 启动交互式会话 |
| `claude "task"` | 带初始提示启动交互会话 |
| `claude -p "query"` | 执行一次性任务并退出 |
| `claude -c` | 继续当前目录最近一次会话 |
| `claude -r "<session>"` | 按会话 ID 或名称恢复 |
| `claude --permission-mode plan` | 直接以 Plan Mode 启动 |
| `claude --worktree feature-x` | 在隔离 worktree 中启动 |
| `claude update` | 更新 Claude Code |
| `claude auth status --text` | 查看登录状态 |

### 交互模式里最常用的快捷输入

| 写法 | 用途 |
| --- | --- |
| `/` | 打开内置命令和技能列表 |
| `!` | 直接运行 bash 命令，并把输出带回上下文，不经过 Claude 审批 |
| `@` | 快速引用文件、目录或资源 |
| `?` | 查看当前环境支持的快捷键 |

示例：

```text
@src/auth/login.ts explain this file
! npm test
/resume
```

### 适合直接复制的几个高频命令

```bash
# 一次性解释函数
claude -p "explain src/auth/service.ts"

# 把日志管道给 Claude
cat build-error.txt | claude -p "concisely explain the root cause"

# 继续最近会话并直接提问
claude -c -p "check for type errors"

# 以 plan 模式做只读分析
claude --permission-mode plan -p "analyze the auth flow and suggest improvements"
```

## 日常使用方式

### 1. 用自然语言驱动任务

Claude Code 的最佳使用方式不是背命令，而是直接描述目标。

适合直接说的话：

- `review my changes and suggest improvements`
- `add tests for the notification service`
- `refactor the authentication module to use async/await`
- `commit my changes with a descriptive message`
- `create a pr`

### 2. 交互会话里几个很实用的操作

| 操作 | 说明 |
| --- | --- |
| `Shift+Tab` | 在普通模式、Auto-Accept、Plan Mode 之间切换 |
| `Ctrl+O` | 打开详细输出，适合排查工具调用 |
| `Ctrl+B` | 把长时间 bash/agent 任务放到后台 |
| `Ctrl+R` | 搜索历史输入 |
| `Ctrl+G` | 在默认编辑器里编辑当前输入或计划 |

### 3. 推荐的对话节奏

实际开发里，推荐按这个顺序使用：

1. 先问结构和约束，不急着改代码
2. 让 Claude 给方案或定位文件
3. 复杂任务先切到 Plan Mode
4. 明确改动边界后再允许执行命令和编辑
5. 最后让它补测试、补文档、生成 commit / PR

## 权限模式与安全边界

Claude Code 不是默认“全自动”。官方当前的权限模型大致是：

- 只读操作通常不需要你确认
- Claude 主动发起 bash 工具调用时需要确认
- 修改文件需要确认

### 五种权限模式

| 模式 | 适用场景 |
| --- | --- |
| `default` | 默认模式，首次使用工具时请求授权 |
| `acceptEdits` | 自动接受编辑，适合熟悉仓库后的连续改动 |
| `plan` | 只读分析和出方案，不执行命令、不改文件 |
| `dontAsk` | 没有预授权就自动拒绝 |
| `bypassPermissions` | 跳过所有权限检查，只建议在隔离容器/VM 中使用 |

### 常用管理命令

```text
/permissions
/config
/status
```

- `/permissions`：看 allow / ask / deny 规则
- `/config`：打开设置界面
- `/status`：查看当前加载了哪些配置源

### 一个项目级 settings 示例

把下面内容放到 `.claude/settings.json`：

```json
{
  "permissions": {
    "defaultMode": "plan",
    "allow": [
      "Bash(git status)",
      "Bash(npm test)",
      "Bash(pnpm test *)"
    ],
    "deny": [
      "Bash(git push *)",
      "Read(./.env)"
    ]
  }
}
```

几个要点：

- 规则按 `deny -> ask -> allow` 顺序生效
- `Bash(...)` 支持通配符
- `Read(...)` 和 `Edit(...)` 使用类似 gitignore 的路径匹配
- 权限规则和 sandbox 是两层保护，不要只依赖其中一层

## 让 Claude 记住你的项目

Claude Code 有两种“长期记忆”机制：

- `CLAUDE.md`：你写给 Claude 的长期规则
- Auto memory：Claude 根据会话自动沉淀的记忆

### CLAUDE.md 应该放哪里

| 作用域 | 路径 |
| --- | --- |
| 项目共享 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` |
| 个人全局 | `~/.claude/CLAUDE.md` |
| 企业托管 | 系统级 `CLAUDE.md` |

### 最实用的做法

先执行：

```text
/init
```

它会为当前项目生成一个初始 `CLAUDE.md`，通常会包含：

- build / test 命令
- 项目结构
- 代码风格和约定
- 常见开发流程

然后你再手工补充 Claude 无法自动发现的内容，比如：

- 哪些目录不能碰
- 哪些脚本上线前必须跑
- PR 描述格式
- 哪些模块归哪个团队维护

### 写 `CLAUDE.md` 的建议

- 尽量短，官方建议单文件控制在 200 行以内
- 规则要具体，不要写空话
- 用标题和列表组织，不要堆长段落
- 多团队 monorepo 用 `.claude/rules/` 按目录或主题拆分
- 需要引用额外资料时，用 `@path/to/file` 导入

### `/memory` 有什么用

```text
/memory
```

这个命令可以：

- 查看当前会话到底加载了哪些 `CLAUDE.md` / rules
- 查看和编辑 auto memory
- 打开 memory 目录

官方当前的 auto memory 默认位置是：

```text
~/.claude/projects/<project>/memory/
```

其中：

- `MEMORY.md` 是索引文件
- 启动会话时只会自动加载 `MEMORY.md` 前 200 行
- 更细的笔记会拆到其它 markdown 文件里，按需读取

## Skills、Subagents、MCP、Hooks 怎么用

这四类能力可以理解成 Claude Code 的扩展层。

### 1. Skills：复用提示词和流程

当前官方已经把“自定义 slash commands”并入 skills。旧的 `.claude/commands/*.md` 仍兼容，但新写法建议直接用 skills。

目录位置：

- 项目级：`.claude/skills/<skill-name>/SKILL.md`
- 个人级：`~/.claude/skills/<skill-name>/SKILL.md`

最小示例：

```md
---
name: deploy-checklist
description: 发布前检查清单，适合上线前手动触发
disable-model-invocation: true
---

上线前执行：
1. 跑测试
2. 检查迁移脚本
3. 检查环境变量
4. 生成发布说明
```

然后在 Claude Code 里执行：

```text
/deploy-checklist
```

适合用 skill 的场景：

- 固定发布流程
- 代码审查清单
- 文档模板
- 特定语言/框架的团队规范

### 2. Subagents：把任务拆给专门代理

Subagent 适合“独立、边界清晰、输出很多”的任务，比如：

- 大仓库检索
- 长日志分析
- 大批量测试
- 专门的 code review

目录位置：

- 项目级：`.claude/agents/`
- 个人级：`~/.claude/agents/`

最小示例：

```md
---
name: code-reviewer
description: Reviews changed code for quality, risk, and missing tests
tools: Read, Glob, Grep
model: sonnet
---

Focus on regressions, edge cases, and missing test coverage.
```

使用方式：

```text
/agents
claude agents
```

几个关键点：

- 项目级 subagent 适合 check in 到仓库共享
- 如果省略 `tools` 字段，会继承主线程可用工具，包括 MCP tools

### 3. MCP：把外部系统接进来

MCP 是 Claude Code 最有价值的扩展点之一。它能把 GitHub、Jira、Sentry、数据库、设计工具、内部平台接到 Claude 的工具集里。

#### 常用添加方式

```bash
# 远程 HTTP MCP
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 本地 stdio MCP
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://readonly:***@localhost:5432/app"
```

#### 管理命令

```bash
claude mcp list
claude mcp get notion
claude mcp remove notion
```

会话内管理和认证：

```text
/mcp
```

#### 作用域怎么选

| 作用域 | 说明 |
| --- | --- |
| `local` | 默认，只对你当前项目生效 |
| `project` | 写入项目根目录 `.mcp.json`，适合团队共享 |
| `user` | 对你所有项目生效 |

项目级 MCP 会写入 `.mcp.json`，适合共享给团队，但使用时仍会要求确认。MCP 能力很强，也意味着风险更高，接入第三方 server 前先确认可信度。

### 4. Hooks：在关键事件上做自动化

Hooks 本质上是 Claude Code 的事件钩子，适合做策略校验和自动化。

典型事件：

- `UserPromptSubmit`
- `PreToolUse`
- `PermissionRequest`
- `PostToolUse`
- `PostToolUseFailure`
- `Notification`

最常见的两个用法：

- 在 `PreToolUse` 阶段拦截危险命令
- 在 `PostToolUse` 阶段跑格式化、静态检查、通知

配置示例：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-dangerous-bash.sh"
          }
        ]
      }
    ]
  }
}
```

官方当前约定里：

- 退出码 `0` 表示正常
- 退出码 `2` 表示阻断当前动作
- `PreToolUse` 可以 allow / deny / ask，也可以改写工具输入

如果你要在团队里落地 Claude Code，Hooks 往往比“纯提示词约束”更可靠。

## VS Code 里怎么用

如果你的主工作环境是 VS Code，官方当前推荐直接安装 Claude Code 扩展。

你可以这样分工：

- 图形交互、diff 审批、选区提问：用扩展
- 更重的 CLI 工作流、脚本化、`!` bash、完整 commands / skills：用终端里的 `claude`

几个实用点：

- 在 VS Code 集成终端里运行 `claude`，CLI 会自动与 IDE 集成，支持 diff 和诊断共享
- 如果你在外部终端运行 `claude`，可以执行 `/ide` 连接到 VS Code
- 扩展和 CLI 共享会话历史，可以用 `claude --resume` 接着聊
- 扩展里支持权限模式切换，Plan Mode 会把计划以 markdown 文档形式打开，便于你直接批注

## 自动化与脚本化

如果你想把 Claude Code 放进 shell 脚本、CI 或本地验证流程，核心是 `claude -p`。

### 最常见的几种写法

```bash
# 把 Claude 当一次性解释器
claude -p "summarize the changes in this branch"

# 管道输入输出
cat build-error.txt | claude -p "explain the root cause" > output.txt

# 限制预算和轮数
claude -p --max-budget-usd 3 --max-turns 5 "review the current diff"

# JSON 输出
claude -p --output-format json "summarize the current diff"
```

### 一个很实用的脚本思路

```json
{
  "scripts": {
    "lint:claude": "claude -p 'you are a code reviewer. inspect the diff vs main and report concrete issues with filename and line number.'"
  }
}
```

适合接入的场景：

- PR 前快速 review
- 构建失败原因解释
- 提交信息生成
- 变更摘要和发布说明

## 推荐落地方式

如果你是第一次在团队里系统用 Claude Code，建议按这个顺序推进：

1. 先只用 `claude`、`claude -p`、`/help`、`/resume`
2. 在仓库里建立基础版 `CLAUDE.md`
3. 用 `.claude/settings.json` 收紧权限和默认模式
4. 把重复动作沉淀成 skills
5. 把高风险校验沉淀成 hooks
6. 真正需要接系统时再接 MCP
7. 多任务并行再引入 `--worktree` 和 subagents

## 官方资料

建议直接收藏下面这些页面：

- [Quickstart](https://code.claude.com/docs/en/quickstart)
- [CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Interactive mode](https://code.claude.com/docs/en/interactive-mode)
- [How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [Configure permissions](https://code.claude.com/docs/en/permissions)
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Create custom subagents](https://docs.claude.com/en/docs/claude-code/subagents)
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Use Claude Code in VS Code](https://code.claude.com/docs/en/ide-integrations)
- [Common workflows](https://code.claude.com/docs/en/common-workflows)
