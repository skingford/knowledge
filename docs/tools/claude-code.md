---
title: Claude Code 使用指南
description: Claude Code 的安装、核心命令、权限模式、CLAUDE.md、Skills、Subagents、MCP、Hooks 与 VS Code 集成实践。
---

# Claude Code 使用指南

这篇文档把 Claude Code 的常用能力按实际工作流整理成一份中文速查。内容基于 Claude Code 官方文档于 2026 年 3 月 28 日再次核对，重点覆盖终端 CLI、VS Code、权限控制、项目记忆和可扩展能力。

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

## 命令与指令速查

先记一个原则：

- 启动参数和 CLI 子命令，用 `claude --help`
- 交互会话里的内置 `/` 指令，用 `/help`
- 不是所有命令都会对所有人可见，部分命令取决于平台、套餐、账号来源和当前环境

另外，官方当前会把一些 bundled skills 也显示在 `/` 菜单里，比如 `/simplify`、`/batch`、`/debug`、`/loop`。这些不是内置命令，而是官方随附的 skill。

### CLI 入口与子命令

| 命令 | 用途 |
| --- | --- |
| `claude` | 启动交互式会话 |
| `claude "task"` | 带初始提示启动交互式会话 |
| `claude -p "query"` | 非交互一次性执行并退出 |
| `claude -c` | 继续当前目录最近一次会话 |
| `claude -r "<session>"` | 按会话 ID 或名称恢复 |
| `claude --permission-mode plan` | 直接以 Plan Mode 启动 |
| `claude --worktree feature-x` | 在隔离 git worktree 中启动 |
| `claude auth login` | 登录 Anthropic 账号 |
| `claude auth logout` | 登出当前账号 |
| `claude auth status --text` | 查看登录状态 |
| `claude agents` | 列出当前可用 agents |
| `claude auto-mode config` | 查看生效中的 auto mode 配置 |
| `claude auto-mode defaults` | 查看 auto mode 默认规则 |
| `claude auto-mode critique` | 让 Claude 评审你的 auto mode 规则 |
| `claude mcp list` | 列出已配置 MCP server |
| `claude mcp add ...` | 添加 MCP server |
| `claude mcp get <name>` | 查看某个 MCP server 详情 |
| `claude mcp remove <name>` | 删除 MCP server |
| `claude plugin list` | 列出已安装插件 |
| `claude plugin install <plugin>` | 安装插件 |
| `claude plugin enable <plugin>` | 启用插件 |
| `claude plugin disable <plugin>` | 禁用插件 |
| `claude plugin uninstall <plugin>` | 卸载插件 |
| `claude plugin update <plugin>` | 更新插件 |
| `claude plugin marketplace list` | 查看 marketplace |
| `claude plugin marketplace add <source>` | 添加 marketplace |
| `claude plugin marketplace remove <name>` | 删除 marketplace |
| `claude plugin marketplace update [name]` | 更新 marketplace |
| `claude doctor` | 检查本地安装与运行状态 |
| `claude setup-token` | 配置长期 token |
| `claude install` | 安装或切换 Claude Code 版本 |
| `claude update` / `claude upgrade` | 检查并安装更新 |

### 常用启动参数

| 参数 | 用途 |
| --- | --- |
| `-p`, `--print` | 非交互输出，适合脚本、CI、管道 |
| `-c`, `--continue` | 继续最近一次会话 |
| `-r`, `--resume` | 按 ID 或名称恢复会话 |
| `--fork-session` | 恢复旧会话时另起一个新分支会话 |
| `--model <model>` | 指定模型 |
| `--effort <level>` | 指定推理强度 |
| `--permission-mode <mode>` | 指定权限模式 |
| `--add-dir <dir...>` | 给当前会话添加额外目录访问权限 |
| `--settings <file-or-json>` | 额外加载 settings |
| `--setting-sources <sources>` | 指定加载哪些 settings scope |
| `--mcp-config <configs...>` | 额外加载 MCP 配置 |
| `--strict-mcp-config` | 只使用 `--mcp-config` 指定的 MCP |
| `--allowed-tools <tools...>` | 预放行工具或工具模式 |
| `--disallowed-tools <tools...>` | 显式禁用某些工具 |
| `--tools <tools...>` | 限制 Claude 可用的 built-in tools 集合 |
| `--system-prompt <prompt>` | 替换系统提示词 |
| `--append-system-prompt <prompt>` | 追加系统提示词 |
| `--bare` | 极简模式，关闭大量自动发现与附加能力 |
| `--debug [filter]` | 打开调试输出 |
| `--debug-file <path>` | 把调试日志写入文件 |
| `--ide` | 启动时自动连接 IDE |
| `--chrome` | 启用 Claude in Chrome 集成 |
| `--worktree [name]` | 创建隔离 worktree |
| `--tmux` | 配合 `--worktree` 开 tmux 会话 |
| `--output-format <format>` | 指定 `-p` 模式输出格式 |
| `--input-format <format>` | 指定 `-p` 模式输入格式 |
| `--json-schema <schema>` | 约束结构化输出 |
| `--max-budget-usd <amount>` | 限制 `-p` 模式预算 |

说明：

- CLI 参数变化比内置 `/` 指令更快，最稳妥的做法仍是以当前版本 `claude --help` 为准
- 官方当前 CLI reference 还列出了一些扩展参数，比如 `--system-prompt-file`、`--append-system-prompt-file`、`--teleport`、`--channels`、`--teammate-mode`，但它们可能受版本、功能开关或账号能力影响，不一定在每台机器的 `--help` 里都出现

### 交互模式里的快捷输入

| 写法 | 用途 |
| --- | --- |
| `/` | 打开内置命令和技能列表 |
| `!` | 直接运行 bash 命令，并把输出带回上下文 |
| `@` | 引用文件、目录、终端输出或资源 |
| `?` | 查看当前环境支持的快捷键 |
| `\` + `Enter` | 强制换行输入 |
| `Shift+Tab` | 在权限模式之间切换 |
| `Ctrl+O` | 展开详细工具输出 |
| `Ctrl+B` | 后台化 bash / agent 长任务 |
| `Ctrl+R` | 搜索历史输入 |
| `Ctrl+G` | 在默认编辑器里编辑当前输入 |
| `Esc` + `Esc` | 打开 rewind / summarize 入口 |
| `/btw <question>` | 发起一个不进入主对话历史的 side question |

示例：

```text
@src/auth/login.ts explain this file
! npm test
/resume
/btw what was the config filename again?
```

### 内置 `/` 指令全量速查

以下是官方当前列出的 built-in commands。不同平台、套餐和环境下，可见命令可能不同。

#### 1. 会话与上下文

| 指令 | 用途 |
| --- | --- |
| `/add-dir <path>` | 给当前会话新增工作目录 |
| `/clear` | 清空当前会话历史，别名：`/reset`、`/new` |
| `/compact [instructions]` | 压缩上下文，可附带压缩重点 |
| `/context` | 查看当前上下文占用与优化建议 |
| `/copy [N]` | 复制最近一次或第 N 次 assistant 回复 |
| `/export [filename]` | 导出当前会话文本 |
| `/branch [name]` | 从当前节点分叉会话，别名：`/fork` |
| `/rename [name]` | 重命名当前会话 |
| `/resume [session]` | 恢复会话，别名：`/continue` |
| `/rewind` | 回退到之前的会话或代码状态，别名：`/checkpoint` |
| `/exit` | 退出 CLI，别名：`/quit` |

#### 2. 配置、模型与权限

| 指令 | 用途 |
| --- | --- |
| `/config` | 打开设置界面，别名：`/settings` |
| `/status` | 打开状态页，查看版本、模型、账号、连接状态 |
| `/permissions` | 查看或调整权限，别名：`/allowed-tools` |
| `/model [model]` | 切换模型 |
| `/effort [low|medium|high|max|auto]` | 调整推理强度 |
| `/plan [description]` | 直接进入 plan mode，可附带任务说明 |
| `/fast [on|off]` | 切换 fast mode |
| `/sandbox` | 切换 sandbox mode |
| `/theme` | 切换主题 |
| `/color [color\|default]` | 设置当前会话提示栏颜色 |
| `/keybindings` | 打开或创建 keybindings 配置 |
| `/terminal-setup` | 配置终端快捷键 |
| `/vim` | 切换 Vim / Normal 编辑模式 |
| `/statusline` | 配置状态栏 |
| `/hooks` | 查看 hooks 配置 |

#### 3. 账号、套餐与产品入口

| 指令 | 用途 |
| --- | --- |
| `/login` | 登录 Anthropic 账号 |
| `/logout` | 登出账号 |
| `/usage` | 查看套餐使用量与限流状态 |
| `/cost` | 查看 token / cost 使用统计 |
| `/extra-usage` | 配置额外 usage 以便限流后继续使用 |
| `/upgrade` | 打开升级页面 |
| `/privacy-settings` | 查看或修改隐私设置 |
| `/release-notes` | 查看更新日志 |
| `/mobile` | 显示移动端下载二维码，别名：`/ios`、`/android` |
| `/desktop` | 把当前会话继续到 Desktop App，别名：`/app` |
| `/voice` | 切换语音输入 |
| `/passes` | 赠送 Claude Code 试用周给他人 |
| `/stickers` | 申请 Claude Code 贴纸 |

#### 4. 项目、扩展与自动化

| 指令 | 用途 |
| --- | --- |
| `/init` | 为项目初始化 `CLAUDE.md` |
| `/memory` | 编辑 `CLAUDE.md` 和记忆相关内容 |
| `/skills` | 列出可用 skills |
| `/agents` | 管理 agents |
| `/plugin` | 管理插件 |
| `/reload-plugins` | 重载当前启用的插件 |
| `/mcp` | 管理 MCP server 与 OAuth |
| `/ide` | 管理 IDE 集成并查看状态 |
| `/chrome` | 配置 Claude in Chrome |
| `/remote-control` | 让当前会话可被 Claude Web 远程接管，别名：`/rc` |
| `/remote-env` | 配置远程 Web 会话默认环境 |
| `/schedule [description]` | 创建、更新、列出或运行云端定时任务 |
| `/tasks` | 查看和管理后台任务 |
| `/insights` | 生成 Claude Code 使用分析报告 |
| `/stats` | 查看使用统计、会话历史、模型偏好等 |

#### 5. 代码、Git 与评审

| 指令 | 用途 |
| --- | --- |
| `/diff` | 打开交互式 diff 查看器 |
| `/pr-comments [PR]` | 获取 GitHub PR 评论 |
| `/security-review` | 对当前分支待提交变更做安全审查 |
| `/install-github-app` | 为仓库安装 Claude GitHub Actions App |
| `/install-slack-app` | 安装 Claude Slack App |
| `/review` | 已废弃，官方建议改用 code-review plugin |

#### 6. 帮助、反馈与轻量交互

| 指令 | 用途 |
| --- | --- |
| `/help` | 查看帮助与命令列表 |
| `/btw <question>` | 发起 side question，不写入主对话历史 |
| `/feedback [report]` | 提交反馈，别名：`/bug` |

### 自定义命令、插件命令与 MCP 命令

- 官方当前把“自定义 slash commands”并入了 skills 体系，但老的 `.claude/commands/*.md` 仍兼容
- 插件可以提供命令，通常会出现在 `/` 菜单中；必要时可用 `/plugin-name:command-name` 调用
- MCP server 暴露的 prompts 会以 `/mcp__<server>__<prompt>` 的形式出现

### 按场景查命令

如果你不想先背命令名，可以直接按工作流来记。

#### 1. 第一次进入一个项目

| 目标 | 优先用什么 |
| --- | --- |
| 看有哪些命令 | `/help` |
| 看当前状态 | `/status` |
| 看当前模型 | `/model` |
| 给项目建立长期规则 | `/init` |
| 查看或编辑项目记忆 | `/memory` |
| 先用只读方式分析 | `/plan` 或 `claude --permission-mode plan` |
| 先确认权限边界 | `/permissions` |

#### 2. 想管理会话、压缩上下文、避免聊乱

| 目标 | 优先用什么 |
| --- | --- |
| 恢复之前的会话 | `/resume` 或 `claude -r` |
| 给当前会话重命名 | `/rename` |
| 清空当前上下文重新聊 | `/clear` |
| 压缩上下文继续做事 | `/compact` |
| 看上下文快满没 | `/context` |
| 回退到之前状态 | `/rewind` |
| 导出会话内容 | `/export` |

#### 3. 想先分析再改代码

| 目标 | 优先用什么 |
| --- | --- |
| 直接进入 plan mode | `/plan` |
| 启动时就只读分析 | `claude --permission-mode plan` |
| 在会话里切权限模式 | `Shift+Tab` |
| 问一个不污染主上下文的小问题 | `/btw <question>` |
| 看 Claude 当前能做什么 | `/permissions` |
| 看详细工具调用过程 | `Ctrl+O` |

#### 4. 想看 diff、做 review、处理 PR

| 目标 | 优先用什么 |
| --- | --- |
| 看当前未提交改动 | `/diff` |
| 拉取 PR 评论 | `/pr-comments [PR]` |
| 做安全审查 | `/security-review` |
| 隔离开一个并行任务 | `claude --worktree feature-x` |
| 继续某个 PR 关联的会话 | `claude --from-pr` |
| 让 Claude 帮你写 commit / PR | 直接自然语言提问 |

说明：

- `commit my changes with a descriptive message`
- `create a pr`
- `summarize the changes in this branch`

#### 5. 想接入扩展能力

| 目标 | 优先用什么 |
| --- | --- |
| 看项目里有哪些 skills | `/skills` |
| 管理 agents | `/agents` 或 `claude agents` |
| 管理插件 | `/plugin` 或 `claude plugin ...` |
| 管理 MCP server | `/mcp` 或 `claude mcp ...` |
| 看 IDE 集成状态 | `/ide` |
| 配置浏览器自动化 | `/chrome` |

#### 6. 想做脚本化、自动化、CI

| 目标 | 优先用什么 |
| --- | --- |
| 一次性执行任务并退出 | `claude -p` |
| 让输出变成 JSON | `claude -p --output-format json` |
| 约束结构化输出格式 | `--json-schema` |
| 控制预算 | `--max-budget-usd` |
| 限制会话工具集合 | `--tools` |
| 只预放行少量命令 | `--allowed-tools` |
| 加额外项目目录 | `--add-dir` |

#### 7. 想排障、升级、看本地状态

| 目标 | 优先用什么 |
| --- | --- |
| 检查安装和运行状态 | `/doctor` 或 `claude doctor` |
| 看登录状态 | `claude auth status --text` |
| 看版本 | `claude -v` |
| 更新 Claude Code | `claude update` |
| 看更新日志 | `/release-notes` |
| 提交问题反馈 | `/feedback` 或 `/bug` |

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

## 常见工作流示例

下面这些示例适合直接复制或稍作改写后使用。它们和上面的“命令速查”是两层东西：

- 上面解决“我该用哪个命令”
- 这里解决“我现在这类任务应该怎么开口”

### 1. 快速理解一个新项目

适合刚进入一个陌生仓库时使用。

```text
give me an overview of this codebase
```

然后继续追问：

```text
explain the main architecture patterns used here
what are the key data models?
how is authentication handled?
```

如果你想找具体功能对应的代码：

```text
find the files that handle user authentication
how do these authentication files work together?
trace the login process from front-end to database
```

使用建议：

- 先问全局结构，再问模块边界
- 尽量用项目里的业务词汇提问
- 如果仓库很大，先切到 `/plan` 再做梳理更稳

### 2. 定位并修复一个 bug

适合你已经有报错、失败测试或明确异常现象时使用。

```text
I'm seeing an error when I run npm test
```

继续让 Claude 给方案：

```text
suggest a few ways to fix the @ts-ignore in user.ts
```

确认方案后再落地：

```text
update user.ts to add the null check you suggested
run tests for the affected module and tell me whether the fix works
```

使用建议：

- 最好把复现命令、错误信息、堆栈一起给它
- 明确错误是稳定复现还是偶发
- 如果不想它直接改，先用 `/plan` 或明确说 `do not edit yet`

### 3. 做一次小范围重构

适合把旧写法迁到新模式，但又不想一下动太大。

```text
find deprecated API usage in our codebase
```

```text
suggest how to refactor utils.js to use modern JavaScript features
```

```text
refactor utils.js to use modern JavaScript features while maintaining the same behavior
run tests for the refactored code
```

使用建议：

- 明确“保持行为不变”
- 明确“分小步提交，不要大面积顺手改动”
- 重构前先让它列风险点，通常会更可控

### 4. 先规划复杂修改，再决定要不要执行

适合多文件改动、跨模块改动、权限敏感改动。

进入 plan mode：

```text
/plan refactor the auth flow and identify the safest migration path
```

或者直接从 CLI 启动：

```bash
claude --permission-mode plan
```

在 plan mode 里可以这样问：

```text
analyze the auth flow and propose a step-by-step refactor plan
list the files that would need to change
identify the highest-risk regression points
```

使用建议：

- 复杂任务先 plan，再执行，通常能明显减少返工
- 很适合 schema 变更、认证改造、支付链路改造这类任务
- 如果方案可以接受，再切回普通模式或 `acceptEdits`

### 5. 写测试、补测试、让测试驱动修改

适合已经知道改动范围，希望 Claude 顺手把验证补齐。

```text
add tests for the notification service
```

```text
write regression tests for this bug before changing the implementation
```

```text
run the relevant tests, fix failures, and summarize what changed
```

使用建议：

- 明确是单元测试、集成测试还是端到端测试
- 如果项目测试很慢，先让它只跑相关测试
- 可以直接说 `only run tests related to files changed`

### 6. 处理 diff、commit 和 PR

适合在编码完成后做收尾。

先看变更：

```text
/diff
```

然后让 Claude 帮你总结：

```text
summarize the changes in this branch
```

生成提交和 PR：

```text
commit my changes with a descriptive message
create a pr
```

如果你已经有 PR 想看评论：

```text
/pr-comments
```

使用建议：

- 先让它总结变更，再让它写 commit / PR，质量通常更高
- 如果团队对 PR 模板有要求，写进 `CLAUDE.md`
- 涉及安全风险时，可以先跑 `/security-review`

### 7. 把 Claude 当成 Unix 风格工具接进脚本

适合 shell、CI、批处理、小型自动化。

解释日志：

```bash
cat build-error.txt | claude -p "concisely explain the root cause"
```

输出 JSON：

```bash
cat code.py | claude -p "analyze this code for bugs" --output-format json > analysis.json
```

限制预算：

```bash
claude -p --max-budget-usd 3 --max-turns 5 "review the current diff"
```

在 `package.json` 里挂一个脚本：

```json
{
  "scripts": {
    "lint:claude": "claude -p 'you are a linter. inspect the diff vs main and report filename, line number, and issue only.'"
  }
}
```

使用建议：

- 简单集成用 `--output-format text`
- 需要机器处理结果时用 `json` 或 `stream-json`
- 自动化里最好配合 `--max-budget-usd`、`--tools`、`--allowed-tools`

### 8. 用并行 worktree 跑多个任务

适合一个任务很长，但你又不想停下手头工作。

```bash
claude --worktree feature-auth
```

或者手工创建 worktree：

```bash
git worktree add ../project-feature-a -b feature-a
cd ../project-feature-a
claude
```

常用管理命令：

```bash
git worktree list
git worktree remove ../project-feature-a
```

使用建议：

- 不同 worktree 适合跑不同 Claude 会话，避免互相覆盖文件
- 长任务、实验性重构、并行修 bug 都很适合
- 新 worktree 里别忘了补依赖、环境变量和项目初始化

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
      "Bash(git push *)", // [!code warning]
      "Read(./.env)" // [!code warning]
    ]
  }
}
```

几个要点：

- 规则按 `deny -> ask -> allow` 顺序生效
- `Bash(...)` 支持通配符
- `Read(...)` 和 `Edit(...)` 使用类似 gitignore 的路径匹配
- 权限规则和 sandbox 是两层保护，不要只依赖其中一层

::: warning 注意
规则按 `deny -> ask -> allow` 顺序生效，`deny` 优先级最高。配置错误可能导致意外放行或拦截。
:::

## 不同项目使用不同 API Key

如果你希望不同仓库走不同的 Claude API Key，比如按项目隔离额度、账单或权限，最稳妥的思路是让 `ANTHROPIC_API_KEY` 在“项目作用域”切换，而不是只放在全局 shell 配置里。

### 方案一：`.claude/settings.local.json`（最推荐）

这是 Claude Code 官方支持的本地项目级配置方式，适合“只在当前仓库生效、且不提交到 Git”的敏感配置。

在项目根目录创建：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-api-project-a-xxxxx"
  }
}
```

如果你不是直连 Anthropic 官方接口，而是通过本地代理、网关或兼容层转发，也可以写成一个更完整的本地配置，例如：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4433",
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx"
  },
  "model": "claude-opus-4-6",
  "permissions": {
    "allow": [],
    "deny": []
  },
  "skipDangerousModePermissionPrompt": true
}
```

这个例子适合：

- 你本地前面还有一层代理或 API gateway
- 你想在项目级固定模型
- 你希望把权限覆盖和本地认证一起放进 `.claude/settings.local.json`

字段含义：

- `env.ANTHROPIC_BASE_URL`：把请求指向自定义网关或兼容端点
- `env.ANTHROPIC_AUTH_TOKEN`：给这类网关传认证 token
- `model`：给当前项目固定默认模型
- `permissions`：补充本地项目级 allow / deny 规则
- `skipDangerousModePermissionPrompt`：表示本地已接受 bypass permissions 的确认提示，只建议保留在本地配置里

文件路径：

```text
.claude/settings.local.json
```

优点：

- 只对当前项目生效
- 默认不提交，适合放敏感信息
- 不依赖额外 shell 工具
- CLI、VS Code 扩展、JetBrains 集成都会读取

适合场景：

- 你本机上多个仓库需要绑定不同 key
- 你不想每次手工 `export`
- 你希望配置直接跟 Claude Code 的项目级设置放在一起

### 方案二：`.envrc` + `direnv`

如果你不只是 Claude Code 要切换 key，连同项目里的 SDK、脚本、`curl`、测试工具也都想自动切换环境变量，这个方案更通用。

先安装并启用 `direnv`：

```bash
brew install direnv
```

然后在 `~/.zshrc` 里加入：

```bash
eval "$(direnv hook zsh)"
```

在每个项目根目录创建 `.envrc`：

```bash
# 项目 A
export ANTHROPIC_API_KEY="sk-ant-api-project-a-xxxxx"
```

```bash
# 项目 B
export ANTHROPIC_API_KEY="sk-ant-api-project-b-xxxxx"
```

首次进入目录后执行：

```bash
direnv allow
```

这样你每次 `cd` 到不同项目目录时，`ANTHROPIC_API_KEY` 会自动切换，Claude Code 也会使用当前 shell 环境里的 key。

### 方案三：项目启动脚本

如果你不想引入 `direnv`，也不想把 key 写进 Claude Code 配置，可以给每个项目单独放一个启动脚本：

```bash
#!/bin/bash
ANTHROPIC_API_KEY="sk-ant-api-project-a-xxxxx" claude
```

比如保存为：

```text
./start-claude.sh
```

这个方式最轻量，但缺点也明显：

- 只能覆盖通过这个脚本启动的 `claude`
- 不会自动影响你同目录下的其他命令
- 多人协作时容易各自维护一套脚本

### 安全建议

::: danger 警告
- 不要把 API Key 写进共享的 `.claude/settings.json`
- 不要把 `.envrc`、启动脚本这类含密钥文件提交到 Git
- 建议把 `.envrc`、`start-claude.sh`、`.claude/settings.local.json` 纳入 `.gitignore`
- 如果仓库里本来就有 `.env`、`secrets/` 等敏感文件，继续用 `permissions.deny` 阻止 Claude 读取
:::

### 团队场景怎么选

如果你只是个人在多仓库间切换 key，优先用 `.claude/settings.local.json` 或 `direnv`。

如果你们团队本来就在 Anthropic Console 里按 workspace 管理 API 账单和权限，也可以按业务或项目拆分 workspace，再给不同项目分配对应的 API Key。这样“项目隔离”和“账单隔离”会更清晰。

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

::: tip 建议
- 尽量短，官方建议单文件控制在 200 行以内
- 规则要具体，不要写空话
- 用标题和列表组织，不要堆长段落
- 多团队 monorepo 用 `.claude/rules/` 按目录或主题拆分
- 需要引用额外资料时，用 `@path/to/file` 导入
:::

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

项目级 MCP 会写入 `.mcp.json`，适合共享给团队，但使用时仍会要求确认。::: warning 注意
MCP 能力很强，也意味着风险更高，接入第三方 server 前先确认可信度。
:::

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

::: tip 建议
如果你要在团队里落地 Claude Code，Hooks 往往比”纯提示词约束”更可靠。
:::

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
