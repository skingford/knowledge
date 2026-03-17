---
title: Codex 使用指南
description: OpenAI Codex 的 CLI、IDE、App、Cloud 使用说明，覆盖安装、认证、模型、AGENTS.md、MCP、skills、subagents、审批与自动化。
---

# Codex 使用指南

这篇文档把 OpenAI Codex 的常用能力按实际工作流整理成一份中文速查。内容基于 OpenAI 官方 Codex 文档于 2026 年 3 月 18 日核对，重点覆盖 CLI、IDE Extension、Codex App、Codex Cloud、认证、模型选择、配置、项目指令和自动化。

## Codex 是什么

Codex 是 OpenAI 的编码代理，能阅读代码、修改文件、运行命令、做代码审查，并在本地或云端完成较长链路的软件工程任务。

当前官方把 Codex 拆成几种主要使用形态：

- `Codex CLI`：在终端里本地协作，适合日常开发
- `Codex IDE extension`：在 VS Code、Cursor、Windsurf、JetBrains 里使用
- `Codex app`：桌面工作台，适合并行线程、worktree 和内建 Git 流程
- `Codex web / cloud`：把任务委托到云端后台执行

如果你主要是工程师日常编码，最值得先掌握的是：

- `codex` 交互式终端工作流
- `codex exec` 非交互自动化
- `AGENTS.md` 项目级长期指令
- `config.toml`、审批模式、sandbox
- `MCP`、skills、subagents 扩展能力

## 快速开始

### 1. 安装 CLI

官方当前文档明确给出的安装方式是 npm 全局安装：

```bash
npm i -g @openai/codex
```

升级：

```bash
npm i -g @openai/codex@latest
```

说明：

- 官方文档当前说明 CLI 支持 macOS 和 Linux
- Windows 支持仍是 experimental
- Windows 最佳体验仍建议在 WSL workspace 中使用

### 2. 登录

Codex 支持两种 OpenAI 登录方式：

- 用 ChatGPT 账号登录，走订阅额度
- 用 API Key 登录，走 OpenAI Platform 按量计费

首次启动：

```bash
codex
```

或者显式登录：

```bash
codex login
```

如果你要在脚本或 CI 中登录 API Key，官方当前推荐这样做：

```bash
printenv OPENAI_API_KEY | codex login --with-api-key
```

检查登录状态：

```bash
codex login status
```

如果你在远程机、无头环境或浏览器回调不可用的环境里登录，官方当前还支持：

```bash
codex login --device-auth
```

几个关键点：

- `Codex cloud` 必须使用 ChatGPT 登录
- `CLI` 和 `IDE extension` 同时支持 ChatGPT 和 API Key
- API Key 更适合程序化工作流，比如 CI/CD
- 登录缓存默认会保存在 `~/.codex/auth.json` 或系统凭据存储里，要把它当密码文件处理

### 3. 进入项目开始使用

```bash
cd /path/to/project
codex
```

第一次进入仓库，建议先让 Codex 做三件事：

1. `Explain this codebase to me`
2. `Summarize the repository structure and the main entry points`
3. `Review the current AGENTS.md and tell me the key working rules`

## 最常用的命令

### CLI 高频命令

| 命令 | 用法 |
| --- | --- |
| `codex` | 启动交互式终端会话 |
| `codex "task"` | 带初始提示启动交互会话 |
| `codex -m gpt-5.4` | 指定模型启动 |
| `codex --full-auto "task"` | 以 `workspace-write + on-request` 快速本地执行 |
| `codex --sandbox read-only -a never "task"` | 只读模式运行 |
| `codex resume --last` | 继续当前目录最近一次会话 |
| `codex fork --last` | 基于最近一次会话分叉新线程 |
| `codex exec "task"` | 非交互执行，适合脚本和 CI |
| `codex login` | 登录 |
| `codex logout` | 登出 |
| `codex mcp --help` | 查看 MCP 管理命令 |

### 适合直接复制的几个例子

```bash
# 启动交互式会话
codex

# 带初始任务启动
codex "Explain this repository and point out the riskiest modules"

# 指定模型
codex -m gpt-5.4

# 继续最近一次会话
codex resume --last

# 分叉最近一次会话
codex fork --last

# 非交互总结仓库结构
codex exec "summarize the repository structure and list the top 5 risky areas"

# 非交互生成发布说明
codex exec "generate release notes for the last 10 commits" | tee release-notes.md

# CI 里临时放宽到可编辑工作区
codex exec --full-auto "fix the failing lint errors"

# 需要 JSONL 事件流时
codex exec --json "summarize the repo structure" | jq
```

## 终端里的日常工作流

### 1. 交互式模式适合什么

官方文档把 `codex` 交互会话定位为主工作流：

- 可以直接读取当前目录代码
- 可以边解释边给出计划
- 可以实时展示 diff、代码块和执行过程
- 适合你和 Codex 一起迭代改代码

会话里最常见的操作包括：

- 直接输入自然语言任务
- 附加截图或设计稿
- 看到计划后逐步批准或拒绝动作
- 用 `/clear`、`/compact`、`/review` 等命令整理会话

### 2. 很实用的 slash commands

| 命令 | 用途 |
| --- | --- |
| `/model` | 切换模型 |
| `/personality` | 切换交流风格 |
| `/permissions` | 切换审批/权限模式 |
| `/status` | 查看当前会话配置和 token 使用情况 |
| `/clear` | 清屏并开始一个新对话 |
| `/new` | 新建对话但不清屏 |
| `/copy` | 复制最近一次完成输出 |
| `/compact` | 压缩长会话，节省上下文 |
| `/diff` | 查看当前 Git diff |
| `/review` | 让 Codex 审查当前工作区 |
| `/init` | 生成 `AGENTS.md` 模板 |
| `/mcp` | 查看当前可用 MCP servers 和 tools |
| `/logout` | 清除本地登录凭据 |
| `/quit` / `/exit` | 退出 CLI |

几个高频点：

- `/permissions` 适合在“只读分析”和“开始改代码”之间快速切换
- `/review` 默认聚焦行为变化和缺失测试，不是纯风格检查
- `/compact` 适合长线程中途瘦身
- `/diff` 和 `/review` 搭配使用很高效

### 3. 推荐的对话节奏

实际开发里，推荐按这个节奏用：

1. 先让 Codex 解释结构、风险和约束
2. 再让它提出方案而不是直接动手
3. 审核清楚之后再放开编辑和命令执行
4. 改完后让它 `/review`
5. 最后再让它补测试、整理提交信息、生成发布说明

## 模型怎么选

官方当前的 Codex 模型文档把下面几类模型列为主要推荐：

- `gpt-5.4`：官方当前建议大多数任务先从它开始
- `gpt-5.3-codex`：复杂软件工程任务的强编码模型
- `gpt-5.3-codex-spark`：研究预览，偏实时、近即时迭代，文本-only

官方当前建议是：

- 对大多数 Codex 任务，先用 `gpt-5.4`
- 想要更纯粹的复杂工程编码能力，可以选 `gpt-5.3-codex`
- 追求极低延迟的快速 coding iteration，再考虑 `gpt-5.3-codex-spark`

### 设置默认模型

`CLI` 和 `IDE extension` 共享同一个 `config.toml`，可以直接指定默认模型：

```toml
model = "gpt-5.4"
```

临时切换：

```bash
codex -m gpt-5.4
```

或者在会话里：

```text
/model
```

## 审批、sandbox 与安全边界

Codex 的核心安全模型是：

- sandbox 限制它能碰什么
- approval 控制它什么时候需要你确认

### 三种常用 sandbox 模式

| 模式 | 说明 |
| --- | --- |
| `read-only` | 只能读文件，适合分析和 CI 只读检查 |
| `workspace-write` | 可改当前工作区，适合本地开发主流程 |
| `danger-full-access` | 高风险全访问，不建议日常直接用 |

### 三种审批参数

| 参数 | 说明 |
| --- | --- |
| `untrusted` | 对不可信命令要求审批 |
| `on-request` | 需要时申请审批 |
| `never` | 不弹审批 |

### 官方文档里的常见组合

| 场景 | 推荐组合 |
| --- | --- |
| 默认自动模式 | `--full-auto` |
| 安全只读浏览 | `--sandbox read-only --ask-for-approval on-request` |
| CI 只读运行 | `--sandbox read-only --ask-for-approval never` |
| 可编辑但命令谨慎 | `--sandbox workspace-write --ask-for-approval untrusted` |

补充：

- `--full-auto` 本质上等价于 `--sandbox workspace-write --ask-for-approval on-request`
- `--dangerously-bypass-approvals-and-sandbox` 或 `--yolo` 风险最高，只适合外部已经隔离好的容器或 runner
- 官方文档明确建议不要轻易把无审批和无 sandbox 叠在真实机器上

### 一个实用的本地配置示例

放到 `~/.codex/config.toml`：

```toml
model = "gpt-5.4"
approval_policy = "untrusted"
sandbox_mode = "workspace-write"
allow_login_shell = false

[sandbox_workspace_write]
network_access = false
```

## 配置文件怎么组织

官方当前的配置主文件是 `config.toml`。

常见位置：

- 用户级：`~/.codex/config.toml`
- 项目级：`.codex/config.toml`

### 配置优先级

官方当前文档给出的优先级从高到低是：

1. CLI flags 和 `--config`
2. `--profile <name>` 对应的 profile
3. 项目级 `.codex/config.toml`
4. 用户级 `~/.codex/config.toml`
5. 系统级 `/etc/codex/config.toml`
6. 内置默认值

注意：

- 项目级 `.codex/config.toml` 只有在你信任该项目时才会加载
- `CLI` 和 `IDE extension` 共用配置
- profile 适合区分不同使用习惯，比如 `safe`、`review`、`ci`

## 用 AGENTS.md 让 Codex 记住项目约定

Codex 当前会在工作前读取 `AGENTS.md`。

### 最实用的做法

直接在项目里执行：

```text
/init
```

它会生成一个 `AGENTS.md` 草稿，适合你继续补充：

- 构建和测试命令
- lint 和 PR 规则
- 哪些目录不能动
- 哪些模块必须跑特定测试
- 代码风格和提交规范

### 搜索顺序和覆盖规则

官方当前文档里的规则很重要：

- 全局层：优先读 `~/.codex/AGENTS.override.md`，否则读 `~/.codex/AGENTS.md`
- 项目层：从仓库根目录一路走到你当前目录
- 每一层优先找 `AGENTS.override.md`，再找 `AGENTS.md`
- 越靠近当前目录的文件越“后加载”，因此覆盖更前面的规则

### 一个推荐组织方式

| 作用域 | 建议位置 |
| --- | --- |
| 全局工作习惯 | `~/.codex/AGENTS.md` |
| 仓库通用规则 | `<repo>/AGENTS.md` |
| 子目录专项规则 | `<repo>/some/module/AGENTS.override.md` |

如果项目已经有别的指令文件名，也可以在 `config.toml` 里配置 fallback 文件名。

## Skills、MCP、Subagents

这三类能力决定了 Codex 能不能真正进入“可扩展工程代理”阶段。

### 1. Skills

官方当前定义里，skill 是一组可复用的说明、资源和可选脚本。

适合做成 skill 的场景：

- 固定发布流程
- 代码审查清单
- 文档模板
- 特定框架的团队规范
- 某类操作的标准 SOP

最简单的 skill 可以只包含一个 `SKILL.md`：

```md
---
name: deploy-checklist
description: 发布前检查清单，只在准备上线时触发
---

1. 跑测试
2. 检查迁移脚本
3. 生成发布说明
```

### skills 存放位置

官方当前文档给出的 repository scope 技能目录是 `.agents/skills`，并且会从当前目录一路向上扫到仓库根：

- 当前目录：`$CWD/.agents/skills`
- 父目录：`$CWD/../.agents/skills`
- 仓库根：`$REPO_ROOT/.agents/skills`
- 用户级：`$HOME/.agents/skills`
- 管理员级：`/etc/codex/skills`

如果你想快速创建 skill，官方当前建议先用：

```text
$skill-creator
```

### 2. MCP

MCP 用来把第三方工具和上下文接给 Codex。官方文档明确说明 CLI 和 IDE extension 都支持 MCP。

最常见的用法：

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

管理思路：

- 用户级 MCP 配到 `~/.codex/config.toml`
- 项目级 MCP 配到 `.codex/config.toml`
- 在交互会话里用 `/mcp` 看当前可用 tools

适合接入的系统：

- 文档检索
- 浏览器工具
- 设计工具
- 内部平台
- GitHub / issue / 监控 / 知识库

### 3. Subagents

Codex 支持把复杂任务拆给子代理并行执行。

内置 agent 当前包括：

- `default`
- `worker`
- `explorer`

自定义 agent 位置：

- 用户级：`~/.codex/agents/*.toml`
- 项目级：`.codex/agents/*.toml`

每个 agent 文件至少要定义：

- `name`
- `description`
- `developer_instructions`

常见可选字段：

- `model`
- `model_reasoning_effort`
- `sandbox_mode`
- `mcp_servers`
- `skills.config`

一个极简示例：

```toml
name = "reviewer"
description = "PR reviewer focused on correctness and missing tests"
developer_instructions = """
Review code like an owner.
Prioritize correctness, regressions, security, and missing tests.
"""
model = "gpt-5.4"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
```

## IDE Extension、App、Cloud 怎么分工

### IDE Extension

如果你主要在 VS Code 或 Cursor 里工作，Codex IDE extension 是最自然的入口。

官方当前说明：

- 支持 VS Code 及其 forks，比如 Cursor、Windsurf
- 也提供 JetBrains 下载入口
- macOS / Linux 支持成熟
- Windows 支持仍是 experimental，最佳体验建议 WSL

适合用在：

- 边看代码边问问题
- 在 IDE 里直接发起任务
- 从编辑器委托 cloud task

### Codex App

Codex App 更像一个“任务工作台”，不是单纯聊天窗口。

官方当前文档强调的能力包括：

- 多项目并行线程
- skills 支持
- automations
- Local / Worktree / Cloud 三种线程模式
- 内建 Git diff、commit、push、PR
- 内建 terminal
- 与 IDE extension 同步

如果你要同时盯多个仓库、多个任务、多个 worktree，App 比 CLI 更合适。

### Codex Cloud / Web

Codex Cloud 适合把任务丢到后台跑。

官方当前说明里，Cloud 的特点是：

- 在云端环境中后台执行
- 支持并行任务
- 通过连接 GitHub 直接处理仓库和 PR
- 可配置 environment、setup script、env vars、secrets
- agent phase 默认不允许访问互联网

Cloud 入口：

- 打开 `https://chatgpt.com/codex`
- 连接 GitHub
- 选择仓库、环境和任务

## Cloud Environments 与联网控制

如果你用 Codex Cloud，这部分很关键。

### environments 能做什么

官方当前支持在 cloud task 环境里配置：

- 依赖安装
- lint / format / test 等工具
- 环境变量
- secrets
- setup script / maintenance script

要点：

- 环境变量在整个 task 周期可用
- secrets 只在 setup script 阶段可用，agent phase 前会被移除
- 容器缓存最多可保留 12 小时
- 修改 setup script、maintenance script、环境变量或 secrets 会触发缓存失效

### 联网默认是关闭的

官方当前文档明确说明：

- `setup script` 阶段默认可以联网安装依赖
- `agent phase` 默认禁止互联网访问
- 需要时可以按 environment 维度开启

官方同时明确提醒：

- 互联网内容可能带 prompt injection
- 只应指向可信资源
- 能不开就不开，能缩小范围就缩小范围

## 用 codex exec 做自动化

`codex exec` 是把 Codex 接进脚本和 CI 的核心命令。

### 什么时候用

官方当前推荐在这些场景使用：

- CI / pipeline
- pre-merge checks
- 定时任务
- 生成 changelog、release notes、summary
- 需要把输出接到其它工具

### 最常见的写法

```bash
# 生成摘要
codex exec "summarize the repository structure and list the top 5 risky areas"

# 单次运行使用 API key
CODEX_API_KEY=<api-key> codex exec --json "triage open bug reports"

# 输出到文件
codex exec "generate release notes for the last 10 commits" | tee release-notes.md

# 不保留 session rollout 文件
codex exec --ephemeral "triage this repository and suggest next steps"

# 需要编辑权限
codex exec --full-auto "fix the failing lint errors"

# JSONL 事件流
codex exec --json "summarize the repo structure" | jq
```

几个关键点：

- 运行期间进度写到 `stderr`
- 最终 agent 消息写到 `stdout`
- 默认是只读 sandbox
- 如果需要改代码，显式加 `--full-auto` 或更高权限
- 在自动化环境里应坚持最小权限原则

## 推荐落地顺序

如果你想在团队里真正把 Codex 用起来，建议按这个顺序推进：

1. 先把 `codex` 和 `codex exec` 用熟
2. 给仓库补一个清晰的 `AGENTS.md`
3. 用 `config.toml` 统一默认模型、审批和 sandbox
4. 把重复动作沉淀成 skills
5. 真要接系统时再上 MCP
6. 需要并行任务时再引入 subagents
7. 需要后台长任务时再引入 Cloud / App / automations

## 官方资料

建议直接收藏这些官方页面：

- [Codex CLI](https://developers.openai.com/codex/cli)
- [Codex CLI features](https://developers.openai.com/codex/cli/features)
- [Command line options](https://developers.openai.com/codex/cli/reference)
- [Slash commands in Codex CLI](https://developers.openai.com/codex/cli/slash-commands)
- [Codex Models](https://developers.openai.com/codex/models)
- [Codex IDE extension](https://developers.openai.com/codex/ide)
- [Codex app](https://developers.openai.com/codex/app)
- [Codex app features](https://developers.openai.com/codex/app/features)
- [Codex web](https://developers.openai.com/codex/cloud)
- [Cloud environments](https://developers.openai.com/codex/cloud/environments)
- [Agent internet access](https://developers.openai.com/codex/cloud/internet-access)
- [Config basics](https://developers.openai.com/codex/config-basic)
- [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Model Context Protocol](https://developers.openai.com/codex/mcp)
- [Agent Skills](https://developers.openai.com/codex/skills)
- [Subagents](https://developers.openai.com/codex/subagents)
- [Authentication](https://developers.openai.com/codex/auth)
- [Agent approvals & security](https://developers.openai.com/codex/agent-approvals-security)
- [Non-interactive mode](https://developers.openai.com/codex/noninteractive)
