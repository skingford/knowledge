# iTerm2 配置指南

从安装配色到 Shell 集成，打造高效美观的终端工作环境。

## 安装与基础配置

### 安装

```bash
brew install --cask iterm2
```

### 推荐首次设置

打开 iTerm2 → Preferences（`Cmd + ,`）：

- **General → Closing**：取消勾选 "Confirm closing multiple sessions"
- **General → Selection**：勾选 "Copy to pasteboard on selection"
- **Profiles → General**：Working Directory 选 "Reuse previous session's directory"
- **Profiles → Terminal**：Scrollback Lines 设为 10000 或 Unlimited
- **Profiles → Keys → Key Mappings**：Presets 选 "Natural Text Editing"（使 Option+← → 按单词移动）

设为默认终端：iTerm2 → Make iTerm2 Default Term。

## 主题与配色

### 配色方案

iTerm2 支持导入 `.itermcolors` 配色文件。推荐配色：

| 主题 | 风格 | 获取方式 |
|------|------|---------|
| Catppuccin | 柔和暖色 | [github.com/catppuccin/iterm](https://github.com/catppuccin/iterm) |
| Dracula | 暗色高对比 | [draculatheme.com](https://draculatheme.com/iterm) |
| Tokyo Night | 蓝紫暗色 | [github.com/enkia/tokyo-night-vscode-theme](https://github.com/enkia/tokyo-night-vscode-theme) |
| Solarized Dark | 经典暗色 | iTerm2 内置 |

导入步骤：Profiles → Colors → Color Presets → Import → 选择下载的 `.itermcolors` 文件。

### 字体推荐

使用 Nerd Font 系列（支持图标字符，配合 Oh My Zsh 主题）：

```bash
# 安装推荐字体
brew install --cask font-meslo-lg-nerd-font
brew install --cask font-fira-code-nerd-font
brew install --cask font-jetbrains-mono-nerd-font
```

设置路径：Profiles → Text → Font → 选择安装的 Nerd Font，推荐字号 14-16。

## 快捷键与分屏

### 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd + T` | 新建 Tab |
| `Cmd + W` | 关闭当前面板 |
| `Cmd + 数字` | 切换到第 N 个 Tab |
| `Cmd + D` | 垂直分屏 |
| `Cmd + Shift + D` | 水平分屏 |
| `Cmd + [` / `Cmd + ]` | 切换分屏面板 |
| `Cmd + Shift + Enter` | 最大化/还原当前面板 |
| `Cmd + F` | 搜索 |
| `Cmd + ;` | 自动补全（基于历史） |
| `Cmd + Shift + H` | 粘贴历史 |
| `Cmd + Option + B` | Instant Replay（回放终端历史） |

### 热键窗口（Hotkey Window）

配置一个全局快捷键唤出的浮动终端：

Preferences → Keys → Hotkey → Create a Dedicated Hotkey Window

推荐设置：
- Hotkey：双击 `Ctrl` 或 `Option + Space`
- 勾选 "Floating window"
- 勾选 "Animate showing and hiding"

## Shell 集成

### Oh My Zsh

```bash
# 安装 Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 安装常用插件
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

编辑 `~/.zshrc`：

```bash
# 主题（推荐 powerlevel10k）
ZSH_THEME="powerlevel10k/powerlevel10k"

# 插件
plugins=(
  git                      # Git 别名和补全
  z                        # 目录快速跳转
  zsh-autosuggestions      # 历史命令建议
  zsh-syntax-highlighting  # 命令语法高亮
  docker                   # Docker 补全
  kubectl                  # K8s 补全
)

source $ZSH/oh-my-zsh.sh
```

安装 Powerlevel10k 主题：

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# 重新打开终端，自动进入配置向导
# 或手动执行：p10k configure
```

### Starship

```bash
# 安装
brew install starship

# 在 ~/.zshrc 末尾添加
eval "$(starship init zsh)"
```

创建 `~/.config/starship.toml`：

```toml
# 精简提示符配置
format = """
$directory\
$git_branch\
$git_status\
$golang\
$nodejs\
$python\
$character"""

[directory]
truncation_length = 3
style = "bold cyan"

[git_branch]
symbol = " "
style = "bold purple"

[character]
success_symbol = "[❯](bold green)"
error_symbol = "[❯](bold red)"
```

### Oh My Zsh vs Starship

| 对比项 | Oh My Zsh | Starship |
|--------|-----------|----------|
| 类型 | Zsh 框架（主题 + 插件） | 纯提示符工具 |
| 速度 | 插件多时较慢 | 极快（Rust 编写） |
| 配置 | `.zshrc` | `starship.toml` |
| 插件生态 | 丰富 | 无（仅管提示符） |
| 推荐场景 | 需要完整 Zsh 生态 | 只想美化提示符 |

::: tip
两者可以搭配使用：Oh My Zsh 管理插件，Starship 负责提示符。只需将 `ZSH_THEME=""` 置空，然后在 `.zshrc` 末尾加上 `eval "$(starship init zsh)"`。
:::

## Profile 配置技巧

### 按目录自动切换 Profile

为不同项目创建独立 Profile（不同配色/字体/环境变量），然后配置自动切换：

Profiles → Advanced → Automatic Profile Switching → 添加规则，例如：

- Path: `/Users/you/work/*` → Profile: Work
- Path: `/Users/you/personal/*` → Profile: Personal

### SSH 场景

为远程服务器创建专用 Profile：

1. 新建 Profile，Command 设为 `ssh user@server`
2. 配置不同配色以区分本地/远程
3. 设置 Badge：`\(session.name)` 在终端右上角显示标识

### Badge

在 Profiles → General → Badge 中输入标识文本，终端窗口右上角会浮现水印标记，方便区分多个会话。

## 实用功能

### Shell Integration

```bash
# 安装 iTerm2 Shell Integration
curl -L https://iterm2.com/shell_integration/zsh -o ~/.iterm2_shell_integration.zsh
source ~/.iterm2_shell_integration.zsh
```

启用后支持：
- `Cmd + Shift + ↑/↓`：在命令之间跳转
- 右键 → "Select Output of Last Command"：选择上一条命令的输出
- 命令状态标记（成功/失败在行首显示）

### Triggers

Profiles → Advanced → Triggers，可设置自动规则：

| 正则 | Action | 用途 |
|------|--------|------|
| `ERROR` | Highlight Text (Red) | 自动高亮错误日志 |
| `WARN` | Highlight Text (Yellow) | 自动高亮警告 |
| `password:` | Open Password Manager | 自动弹出密码输入 |

### tmux 集成

iTerm2 原生支持 tmux 集成模式，将 tmux 窗口映射为原生 Tab/Split：

```bash
# 以集成模式启动 tmux
tmux -CC

# 以集成模式连接已有 session
tmux -CC attach
```
