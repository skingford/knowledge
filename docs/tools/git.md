---
title: Git 常用技巧
description: Git 常用技巧与工作流指南，覆盖分支协作、rebase、撤销回滚和疑难排查场景。
---

# Git 常用技巧

覆盖日常工作流、分支策略、Rebase 实战、撤销回滚和疑难排查，面向实际开发场景。

## 日常工作流

### 基础操作

```bash
# 查看工作区状态
git status

# 暂存文件
git add file.go              # 暂存单个文件
git add src/                  # 暂存整个目录
git add -p                    # 交互式暂存（按 hunk 选择）

# 提交
git commit -m "feat: add user login"
git commit -am "fix: typo"   # 跳过 add，提交所有已跟踪文件的修改

# 推送与拉取
git push origin main
git pull origin main          # fetch + merge
git pull --rebase origin main # fetch + rebase（推荐，保持线性历史）
```

### 查看变更与日志

```bash
# 查看未暂存的修改
git diff

# 查看已暂存的修改
git diff --staged

# 查看提交日志
git log --oneline -20                  # 简洁单行，最近 20 条
git log --oneline --graph --all        # 图形化分支历史
git log --author="kingford" --since="2 weeks ago"

# 查看某个文件的修改历史
git log -p -- path/to/file.go

# 查看某一行的修改记录
git blame path/to/file.go
```

### 暂存与恢复

```bash
# 暂存当前修改（含未跟踪文件）
git stash -u
git stash save "wip: refactor auth"

# 查看暂存列表
git stash list

# 恢复暂存
git stash pop                # 恢复并删除该条 stash
git stash apply stash@{1}   # 恢复但保留 stash（可指定编号）

# 部分暂存
git stash -p                 # 交互式选择 hunk 暂存

# 删除暂存
git stash drop stash@{0}
git stash clear              # 清空全部
```

## 分支管理

### 分支操作

```bash
# 创建并切换
git switch -c feature/login   # 推荐（Git 2.23+）
git checkout -b feature/login # 传统方式

# 切换分支
git switch main
git checkout main

# 查看分支
git branch                   # 本地分支
git branch -r                # 远程分支
git branch -a                # 全部

# 删除分支
git branch -d feature/login         # 安全删除（已合并才允许）
git branch -D feature/login         # 强制删除
git push origin --delete feature/login  # 删除远程分支

# 清理已删除的远程分支引用
git fetch --prune
```

### 分支策略对比

| 策略 | 主要分支 | 适用场景 | 特点 |
|------|---------|---------|------|
| Git Flow | main + develop + feature/release/hotfix | 版本发布型项目 | 流程完整，分支多 |
| GitHub Flow | main + feature | 持续部署型项目 | 简单，PR 驱动 |
| Trunk-Based | main + 短命 feature | 高频发布、CI/CD 成熟团队 | 分支生命周期短 |

## Rebase vs Merge

### 核心区别

| 对比项 | Merge | Rebase |
|--------|-------|--------|
| 历史 | 保留完整分支拓扑，产生 merge commit | 线性历史，无额外 merge commit |
| 安全性 | 不改写历史，安全 | 改写 commit hash，公共分支慎用 |
| 适用场景 | 合并长期分支、发布分支 | 整理本地 feature 分支、同步上游 |

### Rebase 实战

```bash
# 将 feature 分支变基到 main 最新
git switch feature/login
git rebase main

# 交互式 rebase：整理最近 3 个 commit
git rebase -i HEAD~3
```

交互式 rebase 操作：

| 命令 | 用途 |
|------|------|
| `pick` | 保留该 commit |
| `reword` | 保留但修改 commit message |
| `squash` | 合并到前一个 commit，保留 message |
| `fixup` | 合并到前一个 commit，丢弃 message |
| `drop` | 删除该 commit |

::: warning 注意
已推送到远程的分支慎用 rebase，会导致 commit hash 变化。如果必须推送，使用 `--force-with-lease`（比 `--force` 安全，会检查远程是否有新提交）：

```bash
git push --force-with-lease origin feature/login
```
:::

## 撤销与回滚

| 场景 | 命令 | 说明 |
|------|------|------|
| 撤销工作区修改 | `git restore file.go` | 丢弃未暂存的修改 |
| 撤销暂存 | `git restore --staged file.go` | 从暂存区移出，保留修改 |
| 撤销最近一次 commit（保留修改） | `git reset --soft HEAD~1` | 回到暂存状态 |
| 撤销最近一次 commit（保留在工作区） | `git reset --mixed HEAD~1` | 默认模式 |
| 彻底撤销最近一次 commit | `git reset --hard HEAD~1` | 修改全部丢弃 |
| 撤销已推送的 commit | `git revert <commit-hash>` | 生成一个反向 commit，安全 |

::: tip reset 三种模式
- `--soft`：只回退 commit，修改保留在暂存区
- `--mixed`（默认）：回退 commit + 暂存区，修改保留在工作区
- `--hard`：回退 commit + 暂存区 + 工作区，修改全部丢弃
:::

## 冲突解决

### 解决流程

```bash
# 1. merge 或 rebase 时出现冲突
git merge feature/login
# CONFLICT (content): Merge conflict in src/auth.go

# 2. 查看冲突文件
git status

# 3. 编辑文件，解决冲突标记
# <<<<<<< HEAD
# 当前分支的内容
# =======
# 合并进来的内容
# >>>>>>> feature/login

# 4. 标记为已解决并继续
git add src/auth.go
git merge --continue       # merge 场景
# 或
git rebase --continue      # rebase 场景

# 5. 放弃本次操作
git merge --abort
git rebase --abort
```

### 使用工具辅助

```bash
# 配置 diff 工具
git config --global merge.tool vimdiff

# 启动合并工具
git mergetool
```

## Git 别名配置

在 `~/.gitconfig` 中添加：

```ini
[alias]
    co = checkout
    sw = switch
    br = branch
    ci = commit
    st = status
    unstage = restore --staged
    last = log -1 HEAD
    lg = log --oneline --graph --all --decorate -20
    amend = commit --amend --no-edit
    wip = stash save "wip"
    undo = reset --soft HEAD~1
```

## 实用技巧

### cherry-pick：摘取指定 commit

```bash
# 将某个 commit 应用到当前分支
git cherry-pick <commit-hash>

# 摘取多个 commit
git cherry-pick <hash1> <hash2>

# 只应用修改，不自动提交
git cherry-pick --no-commit <hash>
```

### bisect：二分查找 Bug

```bash
# 开始二分
git bisect start
git bisect bad                    # 当前版本有 Bug
git bisect good <known-good-hash> # 已知正常的版本

# Git 会自动切换到中间的 commit，测试后标记
git bisect good   # 这个版本没问题
git bisect bad    # 这个版本有问题

# 找到后退出
git bisect reset
```

### reflog：找回丢失的 commit

```bash
# 查看所有操作记录（包括已删除的 commit）
git reflog

# 恢复到某个操作点
git reset --hard HEAD@{3}

# 从 reflog 中 cherry-pick 找回的 commit
git cherry-pick <lost-commit-hash>
```

::: tip
`git reflog` 是最后的救命稻草——即使 `reset --hard` 丢失了代码，90 天内都能通过 reflog 找回。
:::

### .gitignore 常用模板

```txt
# 编译输出
*.exe
*.o
bin/
dist/

# 依赖目录
node_modules/
vendor/

# IDE 配置
.idea/
.vscode/
*.swp

# 环境变量
.env
.env.local

# 系统文件
.DS_Store
Thumbs.db

# 日志
*.log
logs/
```
