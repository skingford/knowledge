---
title: Gemini CLI 使用指南
description: Google Gemini CLI 的安装、认证、常用命令、settings.json、GEMINI.md、MCP、skills、subagents、sandbox 与 headless 自动化实践。
---

# Gemini CLI 使用指南

这篇文档把 Gemini CLI 的常用能力按实际工作流整理成一份中文速查。内容基于 Gemini CLI 官方文档于 2026 年 3 月 18 日核对，重点覆盖终端 CLI、认证方式、模型选择、`settings.json`、`GEMINI.md`、MCP、skills、subagents、沙箱、安全模式和自动化。

## Gemini CLI 是什么

Gemini CLI 是 Google 提供的开源终端代理，直接把 Gemini 模型能力带进你的命令行。它既能做代码理解、编辑、调试和测试，也能处理脚本化任务、日志分析、Web 搜索和 MCP 扩展。

如果你主要在终端里做开发，这几个能力最值得先掌握：

- `gemini` 交互式会话
- `gemini -p` 非交互一次性执行
- `settings.json` 和审批模式
- `GEMINI.md` 项目上下文
- `MCP`、skills、subagents、custom commands

## 快速开始

### 1. 安装

官方当前推荐的常见安装方式如下：

```bash
# npm
npm install -g @google/gemini-cli

# Homebrew
brew install gemini-cli
```

补充：

- 官方文档当前支持 macOS 15+、Windows 11 24H2+、Ubuntu 20.04+
- 需要 Node.js 20+
- Cloud Shell 和 Cloud Workstations 已预装 Gemini CLI
- 也支持 `npx` 直接运行、MacPorts、Anaconda 和 Docker / Podman 沙箱运行

### 2. 认证

Gemini CLI 当前主要支持三类认证：

- `Sign in with Google`
- `Gemini API Key`
- `Vertex AI`

官方当前建议大多数本地开发者优先使用 Google 账号直接登录：

```bash
gemini
```

启动后按提示选择 `Sign in with Google`。

如果你想用 Gemini API key：

```bash
export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
gemini
```

启动后选择 `Use Gemini API key`。

如果你用 Vertex AI：

```bash
export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
export GOOGLE_CLOUD_LOCATION="YOUR_PROJECT_LOCATION"
gemini
```

几个关键点：

- 个人 Google 账号通常不需要设置 `GOOGLE_CLOUD_PROJECT`
- 公司、学校、Google Workspace 账号通常需要配置 Google Cloud Project
- Headless / CI 更适合使用 `Gemini API Key` 或 `Vertex AI`
- Vertex AI 的 `ADC`、service account JSON key、Google Cloud API key 都是官方支持路径

### 3. 进入项目开始使用

```bash
cd /path/to/project
gemini
```

第一次进入仓库，建议先做三件事：

1. `Explain this repository structure`
2. `What are the main entry points and risky modules?`
3. `Show me what GEMINI.md context is currently active`

## 最常用的命令

### CLI 高频命令

| 命令 | 用法 |
| --- | --- |
| `gemini` | 启动交互式 REPL |
| `gemini "query"` | 带初始任务启动并继续交互 |
| `gemini -p "query"` | 非交互执行并退出 |
| `gemini -i "query"` | 先执行再继续交互 |
| `gemini -r "latest"` | 继续最近一次会话 |
| `gemini -r "<session-id>" "query"` | 按 session ID 恢复 |
| `gemini -m flash` | 指定模型别名 |
| `gemini -s -p "query"` | 在沙箱中运行一次性任务 |
| `gemini mcp add ...` | 添加 MCP server |
| `gemini skills list` | 查看已发现的 skills |
| `gemini update` | 升级到最新版本 |

### 适合直接复制的几个例子

```bash
# 启动交互式会话
gemini

# 带任务启动
gemini "Explain this project and list the top 5 risky areas"

# 非交互模式
gemini -p "Summarize the repository structure"

# 继续最近会话
gemini -r "latest"

# 带新查询继续最近会话
gemini -r "latest" "Check for type errors"

# 引入更多目录
gemini --include-directories ../docs,../shared

# 使用更快模型
gemini -m flash -p "Convert this JSON to YAML"

# JSON 输出
gemini -p "Summarize this repo" --output-format json

# 流式 JSONL 输出
gemini -p "Run an audit and report findings" --output-format stream-json
```

## 交互式使用方式

### 1. REPL 是主工作流

Gemini CLI 的主工作流是交互式 REPL：

- 当前目录会自动成为工作区上下文
- 可以连续追问、修正和迭代
- 可以复用会话历史
- 可以和 `GEMINI.md`、skills、MCP、subagents 叠加使用

### 2. 常见交互命令

官方当前文档里，交互会话中至少有这些高频命令：

| 命令 | 用途 |
| --- | --- |
| `/help` | 查看帮助 |
| `/quit` | 退出 |
| `/model` | 切换模型 |
| `/settings` | 打开设置界面 |
| `/memory show` | 查看当前实际注入给模型的上下文 |
| `/memory reload` | 重新加载 `GEMINI.md` 和 memory |
| `/mcp list` | 查看 MCP servers 状态 |
| `/mcp reload` | 重载 MCP servers |
| `/skills list` | 查看已发现的 skills |
| `/skills reload` | 重新扫描 skills |
| `/agents reload` | 重新加载 subagent registry |
| `/commands reload` | 重新加载自定义命令 |

### 3. 推荐的对话节奏

实际开发里，推荐按这个顺序使用：

1. 先问结构、边界和约束
2. 再让 Gemini 给出计划
3. 复杂改动优先切到 `plan` 模式
4. 确认后再允许修改或执行工具
5. 最后让它做审查、总结和自动化收尾

## 模型怎么选

Gemini CLI 官方当前推荐优先使用 Auto 模式。

### `/model` 里的几个主要选项

| 选项 | 含义 |
| --- | --- |
| `Auto (Gemini 3)` | 自动在 Gemini 3 Pro / Flash Preview 之间选 |
| `Auto (Gemini 2.5)` | 自动在 Gemini 2.5 Pro / Flash 之间选 |
| `Manual` | 手动指定具体模型 |

CLI 别名也很实用：

| 别名 | 说明 |
| --- | --- |
| `auto` | 默认自动路由 |
| `pro` | 复杂推理、复杂任务 |
| `flash` | 快速、均衡 |
| `flash-lite` | 最快，适合简单任务 |

官方当前建议：

- 大多数人默认用 `auto`
- 复杂调试或多阶段任务时切到 `pro`
- 简单转换、轻量问答、快速反馈时切到 `flash` 或 `flash-lite`

示例：

```bash
gemini -m pro
gemini -m flash -p "Summarize this log"
```

## 审批、沙箱与安全模式

Gemini CLI 的安全控制主要靠三部分：

- `approval mode`
- `sandbox`
- `trusted folders`

### 审批模式

官方当前支持的主要审批模式包括：

- `default`：默认逐步确认
- `auto_edit`：自动批准编辑类工具
- `plan`：只读规划模式
- `yolo`：自动批准全部动作，只能通过命令行开启

CLI flags：

```bash
gemini --approval-mode default
gemini --approval-mode auto_edit
gemini --approval-mode yolo
```

### 沙箱

Gemini CLI 官方当前支持多种沙箱方式：

- `sandbox-exec` / macOS Seatbelt
- `docker`
- `podman`
- `runsc` / gVisor
- `lxc` / LXC-LXD

快速开启：

```bash
gemini -s -p "analyze the code structure"
```

或者：

```bash
export GEMINI_SANDBOX=true
gemini -p "run the test suite"
```

也可以在 `settings.json` 里配置：

```json
{
  "tools": {
    "sandbox": "docker"
  }
}
```

官方当前文档里给出的启用优先级是：

1. 命令行 `-s` / `--sandbox`
2. 环境变量 `GEMINI_SANDBOX`
3. `settings.json` 中的 `tools.sandbox`

### Trusted Folders

Trusted Folders 功能默认关闭。启用后，Gemini CLI 会在第一次进入目录时让你选择：

- `Trust folder`
- `Trust parent folder`
- `Don't trust`

不信任的目录会进入更受限的安全模式。

启用方式：

```json
{
  "security": {
    "folderTrust": {
      "enabled": true
    }
  }
}
```

信任记录会保存到：

```text
~/.gemini/trustedFolders.json
```

## settings.json 怎么用

Gemini CLI 的核心配置文件是 `settings.json`。

位置：

- 用户级：`~/.gemini/settings.json`
- 项目级：`<project>/.gemini/settings.json`

规则：

- 项目级覆盖用户级
- `/settings` 可以直接打开设置 UI
- 也可以手动编辑 JSON

### 一个实用示例

```json
{
  "general": {
    "defaultApprovalMode": "plan",
    "enableAutoUpdate": true
  },
  "tools": {
    "sandbox": "docker"
  },
  "security": {
    "folderTrust": {
      "enabled": true
    }
  },
  "experimental": {
    "enableAgents": true
  }
}
```

几个高频设置点：

- `general.defaultApprovalMode`
- `tools.sandbox`
- `experimental.enableAgents`
- UI 显示、Vim mode、notifications、session retention

## 用 GEMINI.md 管理项目上下文

Gemini CLI 使用 `GEMINI.md` 作为上下文文件。

### 为什么重要

官方当前文档明确指出，`GEMINI.md` 会在每次对话时自动加载，因此非常适合用来保存：

- 项目结构说明
- 代码规范
- 测试要求
- 不可触碰的目录
- 团队协作约束

### 上下文层级

Gemini CLI 的 `GEMINI.md` 当前按层级加载：

1. 全局：`~/.gemini/GEMINI.md`
2. workspace 级：工作区目录及其父目录中的 `GEMINI.md`
3. just-in-time：工具访问某个目录时，自动扫描该目录及祖先目录中的 `GEMINI.md`

这意味着：

- 全局文件适合放你的个人偏好
- 仓库根目录适合放团队规则
- 子模块目录适合放局部规则

### 一个推荐写法

```md
# Project Instructions

- Framework: We use React with Vite.
- Styling: Use Tailwind CSS for all styling.
- Testing: All new components must include tests.
- Tone: Be concise.
```

### 很实用的 memory 命令

```text
/memory show
/memory reload
```

- `/memory show`：查看当前真正注入给模型的上下文
- `/memory reload`：修改 `GEMINI.md` 后重新加载

官方当前建议：

- 保持聚焦，不要把整个 wiki 塞进去
- 写可执行规则，不要写空话
- 明确禁止项通常比模糊建议更有效

## MCP、Skills、Subagents、Custom Commands

这四类能力是 Gemini CLI 真正变成“可扩展工程代理”的关键。

### 1. MCP

Gemini CLI 原生支持 MCP servers。

最常见的方式有两种：

```bash
# stdio
gemini mcp add github npx -y @modelcontextprotocol/server-github

# HTTP
gemini mcp add api-server http://localhost:3000 --transport http
```

官方当前文档里，MCP 的配置核心是 `settings.json` 中的 `mcpServers`：

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "my-mcp-server:latest"],
      "env": {
        "API_KEY": "$EXTERNAL_SERVICE_TOKEN"
      },
      "trust": false
    }
  }
}
```

管理命令：

```bash
gemini mcp list
gemini mcp remove github
```

交互里：

```text
/mcp list
/mcp reload
```

几个要点：

- 支持 `stdio`、`SSE`、`Streamable HTTP`
- `gemini mcp add` 可写入用户级或项目级配置
- `trust: true` 的 server 可跳过部分确认流程，谨慎使用

### 2. Skills

Gemini CLI 的 skill 是“按需激活的专长包”，和全局上下文不同，它只在任务匹配时才被拉入上下文。

官方当前的技能发现层级：

- Workspace：`.gemini/skills/` 或 `.agents/skills/`
- User：`~/.gemini/skills/` 或 `~/.agents/skills/`
- Extension skills

优先级：

- Workspace > User > Extension
- 同一层里 `.agents/skills/` 优先于 `.gemini/skills/`

常见命令：

```text
/skills list
/skills reload
/skills enable my-skill
/skills disable my-skill --scope workspace
```

命令行也支持：

```bash
gemini skills list
gemini skills link /path/to/my-skills-repo
gemini skills install https://github.com/user/repo.git
gemini skills uninstall my-expertise --scope workspace
```

### 3. Subagents

Gemini CLI 的 subagents 当前还是 experimental。

内置 subagents 包括：

- `codebase_investigator`
- `CLI Help Agent`
- `Generalist Agent`
- `Browser Agent (experimental)`

使用方式：

- 自动委派
- 用 `@subagent_name` 强制指定

示例：

```text
@codebase_investigator Map out the relationship between the AgentRegistry and the LocalAgentExecutor.
```

自定义 subagent 位置：

- 项目级：`.gemini/agents/*.md`
- 用户级：`~/.gemini/agents/*.md`

文件格式是 Markdown + YAML frontmatter：

```md
---
name: security-auditor
description: Specialized in finding security vulnerabilities in code.
kind: local
tools:
  - read_file
  - grep_search
model: gemini-3-flash-preview
temperature: 0.2
max_turns: 10
---

You are a ruthless Security Auditor.
```

开启自定义 agents：

```json
{
  "experimental": {
    "enableAgents": true
  }
}
```

### 4. Custom Commands

Gemini CLI 支持把常用 prompt 做成可复用 slash commands。

位置：

- 用户级：`~/.gemini/commands/`
- 项目级：`<project>/.gemini/commands/`

命名规则：

- `~/.gemini/commands/test.toml` -> `/test`
- `<project>/.gemini/commands/git/commit.toml` -> `/git:commit`

最小示例：

```toml
description = "Generates a fix for a given issue."
prompt = "Please provide a code fix for the issue described here: {{args}}."
```

重载：

```text
/commands reload
```

官方当前文档还支持：

- `{{args}}` 注入参数
- `!{...}` 执行 shell 命令
- `@{...}` 注入文件内容

## IDE Integration

Gemini CLI 可以和 IDE 协同工作。

官方当前说明：

- 支持 Visual Studio Code
- 支持其它兼容 VS Code extension 的编辑器
- 还能通过 IDE integration 获得 workspace awareness 和原生 diff 能力

适合的使用方式：

- 在 IDE 里看 diff
- 在终端里跑 Gemini CLI 主流程
- 让 CLI 感知当前 workspace、诊断和编辑状态

## Headless 模式与自动化

Gemini CLI 的 headless mode 适合脚本、CI、批处理和自动化包装器。

### 什么时候触发

官方当前说明：

- 非 TTY 环境自动进入 headless
- 显式传 `-p` / `--prompt` 也会进入 headless

### 常见写法

```bash
# 非交互输出到 stdout
gemini -p "Write a summary for this repository"

# 管道输入
cat error.log | gemini -p "Explain why this failed"

# JSON 输出
gemini -p "Summarize this repo" --output-format json

# JSONL 事件流
gemini -p "Audit this codebase" --output-format stream-json
```

### 输出格式

`--output-format json`：

- 返回单个 JSON 对象
- 包含 `response`、`stats`、可选 `error`

`--output-format stream-json`：

- 返回 JSONL 事件流
- 事件类型包括 `init`、`message`、`tool_use`、`tool_result`、`error`、`result`

### 退出码

官方当前 headless mode 退出码：

- `0`：成功
- `1`：一般错误或 API 失败
- `42`：输入参数错误
- `53`：超过 turn limit

## 配额与计费

这部分变化频繁，所以这里明确以 2026 年 3 月 18 日官方文档为准。

官方当前文档写明：

- Google 登录免费额度：`1000 requests/day`、`60 requests/min`
- 未付费 Gemini API key 免费额度：`250 requests/day`、`10 requests/min`，且只限 Flash
- Vertex AI Express Mode：最多 90 天免开账单，额度按账户而定
- 个人固定订阅推荐：`Google AI Pro`、`Google AI Ultra`
- 组织固定订阅：`Gemini Code Assist Standard / Enterprise`
- 超额后更灵活的方式是 `Gemini API key` 或 `Vertex AI` 的 pay-as-you-go`

如果你是个人开发者，本地日常使用优先顺序通常是：

1. 先用 Google 登录
2. 需要精细控制或脚本化时再切 API key
3. 企业合规、配额、治理要求更高时用 Vertex AI

## 推荐落地顺序

如果你想在团队里把 Gemini CLI 真正用起来，建议按这个顺序推进：

1. 先把 `gemini`、`gemini -p`、`gemini -r "latest"` 用熟
2. 给仓库补一个清晰的 `GEMINI.md`
3. 用 `settings.json` 统一审批模式和 sandbox
4. 需要扩展工具时接 MCP
5. 把重复动作沉淀成 skills 和 custom commands
6. 需要复杂并行分析时再启用 subagents
7. 最后再把 headless 模式接进 CI 和自动化流程

## 官方资料

建议直接收藏这些官方页面：

- [Gemini CLI documentation](https://geminicli.com/docs/)
- [Installation](https://geminicli.com/docs/get-started/installation/)
- [Authentication](https://geminicli.com/docs/get-started/authentication/)
- [CLI cheatsheet](https://geminicli.com/docs/cli/cli-reference/)
- [Manage context and memory](https://geminicli.com/docs/cli/tutorials/memory-management/)
- [GEMINI.md](https://geminicli.com/docs/cli/gemini-md/)
- [Settings](https://geminicli.com/docs/cli/settings/)
- [Sandboxing](https://geminicli.com/docs/cli/sandbox/)
- [Trusted folders](https://geminicli.com/docs/cli/trusted-folders/)
- [Set up an MCP server](https://geminicli.com/docs/cli/tutorials/mcp-setup/)
- [MCP servers reference](https://geminicli.com/docs/tools/mcp-server/)
- [Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Subagents](https://geminicli.com/docs/core/subagents/)
- [Custom commands](https://geminicli.com/docs/cli/custom-commands/)
- [IDE integration](https://geminicli.com/docs/ide-integration/)
- [Headless mode](https://geminicli.com/docs/cli/headless/)
- [Automation tutorial](https://geminicli.com/docs/cli/tutorials/automation/)
- [Quota and pricing](https://geminicli.com/docs/resources/quota-and-pricing/)
