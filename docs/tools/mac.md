---
title: Mac 效率工具
description: Mac 开发效率工具清单与配置建议，帮助优化日常开发环境与系统操作流畅度。
---

# Mac 效率工具

覆盖包管理、开发环境搭建、效率应用和系统优化，打造高效开发工作站。

## Homebrew 包管理

### 安装

```bash
# 官方安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装后将 brew 加入 PATH（Apple Silicon）
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 常用命令

| 命令 | 用途 |
|------|------|
| `brew install <pkg>` | 安装命令行工具 |
| `brew install --cask <app>` | 安装 GUI 应用 |
| `brew uninstall <pkg>` | 卸载 |
| `brew upgrade` | 升级所有已安装包 |
| `brew upgrade <pkg>` | 升级指定包 |
| `brew search <keyword>` | 搜索 |
| `brew list` | 查看已安装 |
| `brew info <pkg>` | 查看包信息 |
| `brew cleanup` | 清理旧版本缓存 |
| `brew doctor` | 检查环境问题 |
| `brew autoremove` | 删除不再需要的依赖 |

### Brewfile 批量管理

用 Brewfile 记录所有安装的工具，方便迁移到新机器：

```bash
# 导出当前安装到 Brewfile
brew bundle dump --file=~/Brewfile

# 从 Brewfile 安装
brew bundle --file=~/Brewfile
```

Brewfile 示例：

```ruby
# 命令行工具
brew "git"
brew "go"
brew "node"
brew "ripgrep"
brew "fd"
brew "jq"
brew "lazygit"
brew "bat"

# GUI 应用
cask "iterm2"
cask "visual-studio-code"
cask "raycast"
cask "docker"
cask "google-chrome"
```

## 开发环境搭建

### Node.js

```bash
# 安装 nvm（Node 版本管理）
brew install nvm
mkdir ~/.nvm

# 在 ~/.zshrc 中添加
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"

# 安装和切换版本
nvm install 20            # 安装 Node 20
nvm install --lts         # 安装最新 LTS
nvm use 20                # 切换到 Node 20
nvm alias default 20      # 设置默认版本

# 推荐全局工具
npm install -g pnpm       # 更快的包管理器
npm install -g tsx         # 直接运行 TypeScript
npm install -g ni          # 自动检测包管理器
```

### Go

```bash
# Homebrew 安装
brew install go

# 配置环境变量（~/.zshrc）
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# 配置 Go 代理（加速依赖下载）
go env -w GOPROXY=https://goproxy.cn,direct
go env -w GOPRIVATE=github.com/yourorg/*

# 推荐工具
go install golang.org/x/tools/gopls@latest          # LSP
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest  # Linter
go install github.com/air-verse/air@latest           # 热重载
```

### Python

```bash
# 安装 pyenv
brew install pyenv

# 在 ~/.zshrc 中添加
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# 安装和切换版本
pyenv install 3.12
pyenv global 3.12

# 虚拟环境
python -m venv .venv
source .venv/bin/activate

# pip 镜像配置
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

## 效率工具推荐

### 启动器

| 对比项 | Raycast | Alfred |
|--------|---------|--------|
| 价格 | 基础免费 | 免费 + Powerpack 付费 |
| 内置功能 | 剪贴板、窗口管理、代码片段 | 搜索、Workflow |
| 扩展 | Store 丰富，社区活跃 | Workflow 生态成熟 |
| 推荐 | 新用户优先选择 | Alfred 老用户继续使用 |

Raycast 推荐扩展：

```bash
# 通过 Raycast Store 安装
- Clipboard History      # 剪贴板历史
- Window Management      # 窗口管理（替代 Rectangle）
- Kill Process           # 快速结束进程
- Brew                   # Homebrew 管理
- GitHub                 # GitHub PR/Issue 快速访问
- Translate              # 翻译
```

### 窗口管理

如果不使用 Raycast 内置窗口管理，推荐 Rectangle：

```bash
brew install --cask rectangle
```

常用快捷键：

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Option + ←` | 左半屏 |
| `Ctrl + Option + →` | 右半屏 |
| `Ctrl + Option + ↑` | 上半屏 |
| `Ctrl + Option + ↓` | 下半屏 |
| `Ctrl + Option + Enter` | 全屏 |
| `Ctrl + Option + C` | 居中 |

### 开发辅助工具

| 工具 | 用途 | 安装方式 |
|------|------|---------|
| [Ghostty](./ghostty.md) | 现代终端 | `brew install --cask ghostty` |
| Warp | AI 终端 | `brew install --cask warp` |
| Dash / DevDocs | 离线文档查阅 | `brew install --cask dash` |
| Bruno | API 调试（开源替代 Postman） | `brew install --cask bruno` |
| Sourcetree | Git GUI 客户端 | `brew install --cask sourcetree` |
| CleanShot X | 截图/录屏（付费） | `brew install --cask cleanshot` |
| Keka | 压缩/解压 | `brew install --cask keka` |
| Stats | 菜单栏系统监控 | `brew install --cask stats` |

## 系统配置与优化

### defaults write 常用配置

以下命令修改 macOS 系统行为，可直接复制执行：

```bash
# Finder：显示隐藏文件
defaults write com.apple.finder AppleShowAllFiles -bool true

# Finder：显示文件扩展名
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# Finder：显示路径栏
defaults write com.apple.finder ShowPathbar -bool true

# 截图：保存格式改为 PNG（默认即 PNG，也可改为 jpg）
defaults write com.apple.screencapture type png

# 截图：去除阴影
defaults write com.apple.screencapture disable-shadow -bool true

# Dock：自动隐藏并加速动画
defaults write com.apple.dock autohide -bool true
defaults write com.apple.dock autohide-delay -float 0
defaults write com.apple.dock autohide-time-modifier -float 0.3

# Dock：最小化动画改为缩放
defaults write com.apple.dock mineffect -string scale

# 重启相关服务使配置生效
killall Finder
killall Dock
killall SystemUIServer
```

### Xcode Command Line Tools

大部分开发工具的前置依赖：

```bash
xcode-select --install
```

### DNS 优化

使用更快的公共 DNS：

```bash
# 设置 DNS（Wi-Fi 接口）
networksetup -setdnsservers Wi-Fi 1.1.1.1 8.8.8.8

# 刷新 DNS 缓存
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### 磁盘空间清理

```bash
# 查看磁盘用量
df -h

# 清理 Homebrew 缓存
brew cleanup --prune=all

# 清理 npm 缓存
npm cache clean --force

# 清理 Go 模块缓存
go clean -modcache

# 清理 Docker（谨慎）
docker system prune -a

# 查看大文件目录（推荐用 ncdu）
brew install ncdu
ncdu /
```

## 常用快捷键汇总

### 系统级

| 快捷键 | 功能 |
|--------|------|
| `Cmd + Space` | Spotlight / Raycast |
| `Cmd + Tab` | 切换应用 |
| `Cmd + Q` | 退出应用 |
| `Cmd + W` | 关闭窗口 |
| `Cmd + ,` | 打开偏好设置 |
| `Cmd + Ctrl + Q` | 锁屏 |
| `Cmd + Shift + .` | 显示/隐藏隐藏文件 |

### 截图

| 快捷键 | 功能 |
|--------|------|
| `Cmd + Shift + 3` | 全屏截图 |
| `Cmd + Shift + 4` | 区域截图 |
| `Cmd + Shift + 4 + Space` | 窗口截图 |
| `Cmd + Shift + 5` | 截图/录屏工具栏 |

### Finder

| 快捷键 | 功能 |
|--------|------|
| `Cmd + Shift + G` | 前往路径 |
| `Cmd + Shift + N` | 新建文件夹 |
| `Cmd + Delete` | 移到废纸篓 |
| `Space` | 快速预览 |
| `Cmd + I` | 查看文件信息 |
