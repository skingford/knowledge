---
title: Ghostty 使用指南
description: Ghostty 终端配置指南，整理安装、配置文件、主题、Shell Integration、Quick Terminal、AppleScript 与常见兼容问题。
---

# Ghostty 使用指南

如果你想要一个更接近原生应用、默认就足够快、同时又能继续深度定制的终端，Ghostty 很值得单列专题。它主打原生 UI、GPU 渲染、零配置可用，macOS 体验尤其完整；Linux 也已经可用，但安装分发更多依赖各发行版维护。

## 为什么值得用

- 原生 UI + GPU 渲染，窗口、Tab、Split 都更像系统应用，而不是自己画一层壳
- 默认配置已经很能打：内置 JetBrains Mono、内置 Nerd Font 支持、主题体系完整
- 既能做主力终端，也能做 Quick Terminal 和 macOS 自动化入口
- 对 SSH、sudo、Shell prompt、远程 terminfo 这些高频细节处理得比较认真

官方文档入口：

- [Ghostty Docs](https://ghostty.org/docs)
- [Features](https://ghostty.org/docs/features)
- [Download](https://ghostty.org/download)

## 最近值得注意的更新

如果你上次看 Ghostty 还停在 `1.2.x` 的印象里，当前官方公开 release notes 里已经有这些变化：

- `1.3.0`，发布于 `2026-03-09`：补上了 scrollback search、native scrollbars、shell prompt click-to-move-cursor 等高频能力
- `1.3.1`，发布于 `2026-03-13`：主要修复 `1.3.0` 在 macOS 上引入的焦点切换后鼠标事件回归问题

对应官方说明：

- [Ghostty 1.3.0 Release Notes](https://ghostty.org/docs/install/release-notes/1-3-0)
- [Ghostty 1.3.1 Release Notes](https://ghostty.org/docs/install/release-notes/1-3-1)

## 安装与平台定位

### macOS

Ghostty 官方当前直接提供 macOS 预编译包，并且提供签名、notarized 的通用二进制。下载页当前注明要求 `macOS 13+`。

两种最直接的安装方式：

```bash
# Homebrew cask
brew install --cask ghostty
```

- 图形安装：去 [Download](https://ghostty.org/download) 下载 `.dmg`，拖到 `Applications`
- 包管理安装：Homebrew 社区 cask 会重新打包官方 `.dmg`

### Linux

Ghostty 官方当前只正式分发 macOS 预编译二进制；Linux 更推荐优先走发行版包管理器，再考虑社区包或源码构建。

常见安装方式：

```bash
# Arch
sudo pacman -S ghostty

# Alpine
sudo apk add ghostty

# Gentoo
sudo emerge -av ghostty

# Snap
sudo snap install ghostty --classic
```

如果你用的是 Nix / NixOS、Fedora COPR、Ubuntu 社区包或 AppImage，直接看官方这页最稳：

- [Prebuilt Ghostty Binaries and Packages](https://ghostty.org/docs/install/binary)

## 配置文件、重载与参考文档

Ghostty 当前使用文本配置文件。当前文档里配置文件名是 `config.ghostty`；旧版本里常见的 `config` 仍然是兼容路径。

默认查找顺序：

- 通用 XDG 路径：`$XDG_CONFIG_HOME/ghostty/config.ghostty`
- 如果没定义 `XDG_CONFIG_HOME`，默认就是 `~/.config/ghostty/config.ghostty`
- macOS 额外路径：`~/Library/Application Support/com.mitchellh.ghostty/config.ghostty`

如果多个文件都存在，后加载的文件会覆盖前面的值。macOS 专用路径会在 XDG 路径之后加载。

配置格式很简单：

```text
key = value
```

几个高频命令：

```bash
# 查看默认配置和内置说明
ghostty +show-config --default --docs | less

# 查看所有内置主题
ghostty +list-themes | less

# 查看默认快捷键
ghostty +list-keybinds --default | less
```

重载配置的默认快捷键：

- macOS：`cmd + shift + ,`
- Linux / GTK：`ctrl + shift + ,`

如果你想把配置拆开维护，可以继续引用其它文件：

```text
config-file = theme.ghostty
config-file = ?local.ghostty
```

- `config-file` 支持重复写多次
- 相对路径是相对于当前配置文件
- 以 `?` 开头表示这个文件可选，不存在时不报错

## 一份实用起手配置

下面这份更偏 macOS 日常开发机，思路是先把主题、透明度、Quick Terminal、SSH 兼容和常用分屏配好，再留一个 `local.ghostty` 做机器级覆盖。

```text
# ~/.config/ghostty/config.ghostty

theme = dark:Catppuccin Frappe,light:Catppuccin Latte

font-size = 15
window-theme = system

background-opacity = 0.92
background-opacity-cells = true
background-blur = 20

copy-on-select = clipboard
clipboard-paste-protection = true

shell-integration-features = cursor,sudo,ssh-terminfo,ssh-env

quick-terminal-position = top
quick-terminal-size = 40%
quick-terminal-autohide = true

window-save-state = always

keybind = global:cmd+backquote=toggle_quick_terminal
keybind = cmd+d=new_split:right
keybind = cmd+shift+d=new_split:down
keybind = cmd+shift+j=jump_to_prompt:-1
keybind = cmd+shift+k=jump_to_prompt:1

config-file = ?local.ghostty
```

这份配置的几个注意点：

- `global:` 在 macOS 体验最完整，并且需要给 Ghostty 开 `Accessibility`
- Linux 上部分桌面环境也支持全局快捷键，但依赖 XDG Global Shortcuts 协议，KDE Plasma、GNOME 48 这类环境更容易直接可用
- `window-save-state` 目前也是 macOS 能力，Linux 下没有等价效果
- `background-opacity` 在 macOS 上改完通常要彻底重启 Ghostty 才会生效
- 如果你不希望 Ghostty 自动处理 SSH 或 sudo，可以删掉 `ssh-terminfo`、`ssh-env`、`sudo`

## 主题、快捷键与 Quick Terminal

Ghostty 自带数百个主题，可以一行切换：

```text
theme = Catppuccin Frappe
```

也可以直接做系统深浅色联动：

```text
theme = dark:Catppuccin Frappe,light:Catppuccin Latte
```

主题文件按名称查找时，主要会看这两个目录：

- `$XDG_CONFIG_HOME/ghostty/themes`
- `$PREFIX/share/ghostty/themes`

如果只是想快速试主题，先跑这个：

```bash
ghostty +list-themes
```

Quick Terminal 是 Ghostty 很值得用的一项能力，适合拿来做随叫随到的下拉终端：

```text
keybind = global:cmd+backquote=toggle_quick_terminal
quick-terminal-position = top
quick-terminal-size = 40%
quick-terminal-autohide = true
```

它的特点和限制：

- 状态会在显示和隐藏之间保留，不会每次重新开一个新终端
- 同一时间只会有一个 Quick Terminal 实例
- Quick Terminal 不会随着应用重启被恢复
- 全局快捷键方案最适合 macOS；Linux 一般需要桌面环境或外部热键工具配合

如果你要自定义更多动作，重点看这两页：

- [Custom Keybindings](https://ghostty.org/docs/config/keybind)
- [Keybind Action Reference](https://ghostty.org/docs/config/keybind/reference)

几个最实用的 action：

- `toggle_quick_terminal`
- `new_split:right`
- `new_split:down`
- `jump_to_prompt:-1`
- `jump_to_prompt:1`
- `reload_config`
- `toggle_command_palette`

## Shell Integration、SSH 与 sudo

Ghostty 的 shell integration 是很关键的一层。自动注入成功后，你能得到这些能力：

- 新开 Tab / Split 自动继承上一个终端的工作目录
- prompt 标记，配合 `jump_to_prompt` 在命令之间跳转
- prompt 复杂时窗口缩放更稳定
- 在 prompt 上支持 option/alt 点击定位光标
- 关闭窗口时能更准确判断当前是不是还停在 prompt
- 可以为 `sudo` 和 `ssh` 自动处理 terminfo 兼容

官方当前支持自动注入的 shell：

- `bash`
- `zsh`
- `fish`
- `elvish`

几个现实注意点：

- macOS 自带的 `/bin/bash` 不支持自动注入，通常要手工 source 脚本或换 Homebrew Bash
- 如果你是 Fish 4.x 或较新的 Nushell，一部分 prompt 能力本身就有原生支持
- 如果 Ghostty 不是从 app bundle 启动，或者 resources 目录不对，自动注入可能失效

最常见的两个兼容问题都在远程场景：

### 1. SSH / sudo 报 `xterm-ghostty` 相关错误

典型报错：

- `missing or unsuitable terminal: xterm-ghostty`
- `Error opening terminal: xterm-ghostty`

优先做法：

```text
shell-integration-features = sudo,ssh-terminfo,ssh-env
```

如果你想手工把 terminfo 推到远端，可以直接执行：

```bash
infocmp -x xterm-ghostty | ssh YOUR-SERVER -- tic -x -
```

如果远端环境很旧，也可以在 `~/.ssh/config` 里降级：

```text
Host example.com
  SetEnv TERM=xterm-256color
```

但这个回退方案会损失 Ghostty 的一部分高级终端能力。

### 2. Claude Code / Docker / Ollama 在 Ghostty 里闪屏或撕裂

这是官方文档明确列出来的常见问题。很多时候不是 Ghostty 自身渲染错了，而是这些 CLI/TUI 程序没有正确实现 synchronized output，导致 Ghostty 这种更快的终端把问题放大了。

先看这里：

- [Synchronized Output](https://ghostty.org/docs/help/synchronized-output)

## macOS 自动化：AppleScript

如果你在 macOS 上用 Raycast、Shortcuts、Hammerspoon、Keyboard Maestro 或编辑器脚本，Ghostty 的 AppleScript 很有用。官方从 `1.3.0` 开始提供原生 AppleScript dictionary。

先确认脚本接口可用：

```bash
osascript -e 'tell application "Ghostty" to get version'
```

查看字典：

```bash
sdef /Applications/Ghostty.app | less
```

一个非常实用的例子：把当前窗口分成右侧 split，并在新 split 里启动项目命令。

```applescript
tell application "Ghostty"
    set currentTerm to focused terminal of selected tab of front window
    set newTerm to split currentTerm direction right
    input text "cd ~/work/project && npm run dev\n" to newTerm
end tell
```

AppleScript 里你最常用的对象层级通常是：

```text
application -> windows -> tabs -> terminals
```

最常用的动作包括：

- `new window`
- `new tab`
- `split`
- `focus`
- `input text`
- `perform action`

官方文档：

- [AppleScript (macOS)](https://ghostty.org/docs/features/applescript)

## macOS Shell 行为注意点

Ghostty 在 macOS 上会遵循系统习惯，把 shell 作为 login shell 启动。这意味着：

- `zsh` 下通常每次新开终端都会同时跑 `.zprofile` 和 `.zshrc`
- 如果你把大量交互逻辑都写在 `.zprofile`，再在终端里手动起一个子 shell，行为可能会不一致

一个更稳的做法：

- 把一次性环境初始化尽量放 `.zprofile`
- 把交互式别名、提示符、补全、fzf、zoxide 之类放 `.zshrc`

详细说明直接看官方：

- [macOS Login Shells](https://ghostty.org/docs/help/macos-login-shells)

## 推荐的落地顺序

如果你准备从 iTerm2 或 Warp 迁移，建议顺序不要一上来就把配置堆满：

1. 先零配置直接用几天，确认字体、默认快捷键和窗口行为是不是已经够用
2. 再补主题、`font-size`、Quick Terminal
3. 然后加 `shell-integration-features = sudo,ssh-terminfo,ssh-env`
4. 最后再做 AppleScript、Raycast、Shortcuts 这类自动化

如果你还在终端方案里做选择，可以和 [iTerm2 配置指南](./iterm2.md) 对照看：iTerm2 胜在老牌和生态完整，Ghostty 胜在原生感、默认体验和现代能力。

## 官方参考入口

- [Docs 首页](https://ghostty.org/docs)
- [Download](https://ghostty.org/download)
- [Install: Binaries and Packages](https://ghostty.org/docs/install/binary)
- [Configuration](https://ghostty.org/docs/config)
- [Configuration Reference](https://ghostty.org/docs/config/reference)
- [Color Theme](https://ghostty.org/docs/features/theme)
- [Shell Integration](https://ghostty.org/docs/features/shell-integration)
- [Custom Keybindings](https://ghostty.org/docs/config/keybind)
- [Keybind Action Reference](https://ghostty.org/docs/config/keybind/reference)
- [AppleScript](https://ghostty.org/docs/features/applescript)
- [Help](https://ghostty.org/docs/help)
