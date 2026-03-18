---
title: Git 常用技巧
description: Git 与 GitHub 协作实战手册，覆盖日常命令、分支对比、PR / Review、Actions CI/CD、发布回滚与多人协作排障。
---

# Git 常用技巧

这是一份偏实战的 Git / GitHub 协作手册，不只讲命令，还把团队开发里最常见的 PR、Review、CI/CD、发布、回滚和事故处理串到了一起。

本页重点覆盖：

- **日常命令**：状态查看、提交、stash、分支切换、历史整理
- **协作流程**：PR、Code Review、分支保护、合并策略
- **工程交付**：GitHub Actions、CI/CD、版本发布、Tag 管理
- **故障处理**：误操作恢复、冲突解决、误发版、紧急回滚

如果你想把它当速查页来用，优先看“Git 命令场景索引”和“Git 常用命令速查卡”；如果你想把团队流程补完整，就从“按角色阅读路线”往后看。

## 怎么使用这篇文档

这篇文档已经不只是 Git 命令清单，更像一份团队协作手册。推荐按你的当前目标来读：

- **只想立刻找命令**：先看“Git 命令场景索引”和“Git 常用命令速查卡”
- **想补日常协作能力**：看“分支管理” + “GitHub 协作与 PR”
- **想补 Code Review、CI/CD、发布流程**：看中间几章的 GitHub 与发布相关内容
- **想处理线上事故或误操作**：直接看“撤销与回滚”“多人协作排障”“误操作恢复速查表”
- **想给团队落规则**：看“团队 Git 规范模板”

## 按角色阅读路线

### 角色一：日常开发者

优先看这些章节：

1. Git 命令场景索引
2. Git 常用命令速查卡
3. 日常工作流
4. 分支管理
5. GitHub 协作与 PR
6. 撤销与回滚

适合：平时主要写代码、提 PR、修冲突、处理 review 的同学。

### 角色二：Reviewer / 模块负责人

优先看这些章节：

1. GitHub 协作与 PR
2. 多人协作中的 Code Review 处理
3. Review 代码审核操作
4. PR 最佳实践
5. 多人协作排障

适合：经常审代码、推动协作规范、处理争议和合并风险的人。

### 角色三：发布维护者 / Tech Lead

优先看这些章节：

1. GitHub Actions / CI/CD
2. GitHub Actions 故障排查手册
3. Commit 规范与发版流程
4. 发布分支实战流程
5. 团队 Git 规范模板
6. 多人协作排障

适合：要对 CI、发版、回滚、团队规范和事故处理负责的人。

## Git 命令场景索引

如果你不是想系统学习，而是想“现在遇到一个问题，马上知道该敲什么命令”，先看这一节。

| 我现在想做什么 | 优先命令 | 去哪一节看 |
|----------------|----------|------------|
| 看当前工作区改了什么 | `git status` / `git diff` | 日常工作流 |
| 暂存部分改动 | `git add -p` | 日常工作流 |
| 临时收起现场 | `git stash -u` | 日常工作流 |
| 新建并切到功能分支 | `git switch -c feature/x` | 分支管理 |
| 看 `dev` 和 `master/main` 差异 | `git diff master...dev` | 分支快速对比 |
| 只看某个文件在两个分支的差异 | `git diff master...dev -- path/to/file` | 分支快速对比 |
| 临时切分支查看后恢复现场 | `git switch -` / `git stash pop` | 分支快速对比 |
| 从 `dev` 挑一个提交到 `master/main` | `git cherry-pick <hash>` | 分支快速对比 |
| 提交 PR | `gh pr create --fill` | GitHub 协作与 PR |
| 查看 PR 评论和检查状态 | `gh pr view --comments` / `gh pr checks --watch` | Code Review 处理 |
| 做代码审核 | `gh pr checkout` / `gh pr review` | Review 代码审核操作 |
| 修复 review 意见后更新 PR | `git commit` / `git push` | GitHub 协作与 PR |
| 整理提交历史 | `git rebase -i` / `git commit --fixup` | Rebase vs Merge |
| 本地撤回最近一次提交 | `git reset --soft HEAD~1` | 撤销与回滚 |
| 安全回滚已推送的提交 | `git revert <hash>` | 撤销与回滚 |
| merge / rebase 冲突不想继续 | `git merge --abort` / `git rebase --abort` | 冲突解决 |
| 分支删了、提交找不到了 | `git reflog` | 多人协作排障 |
| 看 CI 为什么没跑 / 跑挂了 | `gh run list` / `gh run view --log` | GitHub Actions 故障排查 |
| 发布一个版本 | `git tag -a v1.2.0` | Commit 规范与发版流程 |
| 线上出问题想快速止血 | `git revert` / hotfix 流程 | 多人协作排障 / 发布分支实战 |

::: tip
如果你只记一个原则：**公共分支优先 `revert`，找不回先看 `reflog`，临时切换前先 `stash`。**
:::

## Git 常用命令速查卡

这一节只保留最常用、最值得记住的一组命令，适合日常快速翻看。

### 查看现场

```bash
git status -sb                 # 精简查看当前分支和工作区状态
git diff                       # 查看未暂存改动
git diff --staged              # 查看已暂存改动
git log --oneline --graph -20  # 看最近提交历史
```

### 提交代码

```bash
git add -p                             # 按 hunk 暂存
git commit -m "feat(auth): add OTP"   # 标准提交
git commit --amend                     # 修改最近一次提交
git push -u origin feature/login-otp   # 首次推送分支并建立跟踪
```

### 临时切换与恢复

```bash
git stash -u       # 临时收起当前现场
git switch dev     # 切到目标分支
git switch -       # 切回上一个分支
git stash pop      # 恢复刚才收起的现场
```

### 分支对比

```bash
git fetch origin
git diff master...dev                    # 看 dev 相对 master/main 的改动
git diff --name-status master...dev      # 只看改动文件列表
git log --oneline --left-right master...dev
git diff master...dev -- path/to/file    # 只看某个文件差异
```

### PR 与 Review

```bash
gh pr create --fill                      # 创建 PR
gh pr view 123 --comments                # 看 PR 和评论
gh pr checks 123 --watch                 # 看 PR 检查状态
gh pr checkout 123                       # 拉 PR 到本地审核
gh pr review 123 --approve -b "LGTM"     # 通过 review
```

### 回滚与恢复

```bash
git restore path/to/file         # 丢弃未暂存改动
git restore --staged path/to/file
git reset --soft HEAD~1          # 撤回最近一次提交，保留暂存
git revert <commit-hash>         # 安全回滚已推送提交
git reflog                       # 找回误删分支 / 丢失提交
```

### 冲突与中止

```bash
git rebase origin/main
git rebase --continue
git rebase --abort
git merge --abort
git cherry-pick --abort
```

::: tip
如果你只想记一套最小组合：`status`、`diff`、`add -p`、`commit`、`stash`、`switch -`、`revert`、`reflog`。
:::

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
git stash push -m "wip: refactor auth"

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

### 快速对比分支改动与恢复现场

很多时候你只是想快速回答这几个问题：

- `dev` 比 `master` 多了哪些提交
- 两个分支到底改了哪些文件
- 某个文件在两个分支里的内容差在哪
- 看完之后怎么快速回到原来的工作现场

::: tip
很多仓库已经把默认分支从 `master` 改成了 `main`。如果你的仓库用的是 `main`，把下面命令里的 `master` 换成 `main` 即可。
:::

#### 方式一：不切换分支，直接对比

这是最快、也最不容易打断当前工作的方式。

```bash
# 先同步远程引用
git fetch origin

# 看 dev 和 master 的差异文件
git diff --name-status master...dev

# 看具体代码差异
git diff master...dev

# 只看某个文件
git diff master...dev -- internal/auth/service.go

# 看两个分支各自多出来哪些提交
git log --oneline --left-right master...dev

# 看图形化提交关系
git log --oneline --graph --decorate master dev
```

几个常用命令的区别：

| 命令 | 用途 |
|------|------|
| `git diff master..dev` | 对比 `master` 和 `dev` 最终快照差异 |
| `git diff master...dev` | 从共同祖先出发看 `dev` 引入了哪些改动，适合评审分支 |
| `git log master..dev` | 看 `dev` 比 `master` 多出的提交 |
| `git log dev..master` | 看 `master` 比 `dev` 多出的提交 |

如果你只是想直接看某个文件在另一个分支里的内容：

```bash
# 看 dev 分支里的某个文件内容
git show dev:internal/auth/service.go

# 看 master 分支里的某个文件内容
git show master:internal/auth/service.go
```

#### 方式二：临时切分支查看，然后快速恢复

如果你确实需要切到 `dev` 或 `master` 本地运行、打断点、搜索代码，可以这样做：

```bash
# 1. 先确认当前是否有未提交改动
git status -sb

# 2. 如果有，先暂存，避免切分支失败或污染现场
git stash -u

# 3. 切到目标分支查看
git switch dev

# ...查看代码、运行命令、排查问题...

# 4. 一键切回刚才的分支
git switch -

# 5. 恢复刚才暂存的现场
git stash pop
```

这里最实用的就是：

- `git switch -`：返回上一个分支
- `git stash pop`：恢复你刚才临时收起来的改动

如果你只是临时看一下，不想留下额外提交，这是最顺手的一套流程。

#### 方式三：用 worktree 并排查看，最稳妥

如果你经常要在 `dev` 和 `master` 之间来回对比，`git worktree` 会比频繁切分支更舒服。

```bash
# 在当前仓库旁边拉出一个 dev 的工作目录
git worktree add ../repo-dev dev

# 如果还想再拉一个 master
git worktree add ../repo-master master
```

这样你会得到两个独立目录：

- 一个看 `dev`
- 一个看 `master`
- 当前目录完全不受影响

对比完后直接清理：

```bash
git worktree remove ../repo-dev
git worktree remove ../repo-master
```

适合这些场景：

- 用 IDE 并排对比两套代码
- 一边跑 `dev`，一边看 `master`
- 排查“这个问题到底是哪次分支改动引入的”

#### 一套最常用的对比流程

如果你只是想快速看 `dev` 相对 `master` 改了什么，推荐这一套：

```bash
git fetch origin
git diff --name-status master...dev
git log --oneline --left-right master...dev
git diff master...dev -- path/to/file
```

如果你还想临时切过去跑一下：

```bash
git stash -u
git switch dev
# 运行、排查、验证
git switch -
git stash pop
```

#### 对比完怎么快速恢复

按你使用的方式恢复：

| 方式 | 恢复动作 |
|------|----------|
| 只用 `git diff` / `git log` | 不需要恢复，当前现场没被改动 |
| 临时切分支 | `git switch -` |
| 切分支前做了 stash | `git stash pop` |
| 用 `worktree` | `git worktree remove <path>` |

最容易出问题的情况是“对比时顺手改了点代码，结果忘了自己本来在哪个分支”。所以正式操作前先跑一次 `git status -sb`，通常能避免很多低级失误。

#### 更细粒度地对比目录 / 单文件 / 单个提交

如果你不想看整个分支，只想聚焦某一小块改动，可以这样做：

```bash
# 只看某个目录在 dev 相对 master 的变化
git diff master...dev -- internal/auth/

# 只看某个文件的差异
git diff master...dev -- internal/auth/service.go

# 只看文件名，不展开代码
git diff --name-only master...dev -- internal/auth/

# 只看某个提交改了哪些文件
git show --stat <commit-hash>

# 只看某个提交里某个文件的改动
git show <commit-hash> -- internal/auth/service.go
```

如果你已经知道某个提交大概有问题，但不确定影响范围，推荐先看：

```bash
git show --stat <commit-hash>
git show <commit-hash>
```

这样通常比一上来翻完整个分支更快定位。

#### 从一个分支挑代码到另一个分支

很多团队都会遇到这种情况：

- `dev` 上已经修好了 bug
- 但你只想把其中 1 个 commit 带到 `master`
- 不想把 `dev` 上其他未发布改动一起带过去

这时最常用的就是 `cherry-pick`。

##### 最常见流程：把 `dev` 的一个提交挑到 `master`

```bash
# 1. 找到 dev 上要挑的提交
git log --oneline dev

# 2. 切到目标分支
git switch master
git pull --rebase origin master

# 3. 挑这个提交过来
git cherry-pick <commit-hash>
```

如果挑完只是想看结果、不急着提交到远程：

```bash
git diff origin/master...HEAD
```

##### 一次挑多个提交

```bash
# 按顺序挑多个提交
git cherry-pick <hash1> <hash2> <hash3>

# 或挑一个连续区间
git cherry-pick <oldest-hash>^..<newest-hash>
```

##### 只拿改动，不立即生成提交

```bash
git cherry-pick --no-commit <commit-hash>
```

适合这些场景：

- 想先人工调整一下代码
- 想把多个提交整理成一个更干净的 commit
- 想先跑测试再决定是否提交

##### 挑完后怎么快速恢复

如果只是试着挑一下，发现不合适，可以直接撤掉：

```bash
# cherry-pick 过程中冲突太多，直接放弃
git cherry-pick --abort

# 已经挑完但还没推送，想撤回最近一次提交
git reset --hard HEAD~1
```

更稳妥一点的做法是先在临时分支上操作：

```bash
git switch -c temp/cherry-pick-check
git cherry-pick <commit-hash>
# 看完没问题再决定是否合并或推送
```

##### cherry-pick 的注意点

- 只挑“独立、边界清晰”的提交，成功率最高
- 如果一个功能拆散在多个 commit 里，单挑一个很容易漏依赖
- 涉及数据库迁移、配置、接口联动时，挑代码前先确认上下游依赖
- 挑完后一定要重新跑测试，不要觉得“原分支能跑，这里就一定能跑”

## GitHub 协作与 PR

为了让这篇总手册更聚焦 Git 主线，PR、Code Review 与多人协作处理已经拆到独立页面：

- [GitHub PR 与 Code Review](./github-pr-review.md)

如果你只想先记住最小协作主线，可以先抓这几步：

1. 从最新 `main` / `master` 拉出功能分支
2. 提交前先自审，确认改动范围、测试和风险说明
3. 用 PR 合并，不直接推主分支
4. Review 优先看正确性、风险和测试，不先纠结风格
5. 改完 review 后逐条回复，再决定是追加提交还是整理历史

最常见的协作主题包括：

- PR 提交流程与描述模板
- Code Review 处理方式
- reviewer 的本地审核操作
- 合并策略与分支保护规则
- 多人协作中的评论、分歧与跟进方式

需要完整命令、模板和处理细节时，直接进入独立专题页即可。

## GitHub Actions / CI/CD

### CI 和 CD 是什么

| 缩写 | 含义 | 常见动作 |
|------|------|----------|
| CI | Continuous Integration，持续集成 | lint、test、build、安全扫描 |
| CD | Continuous Delivery / Deployment，持续交付 / 部署 | 发版、推镜像、部署测试/生产环境 |

最常见的做法是：

- **PR 阶段跑 CI**：保证代码能检查、能测试、能构建
- **合并到 main 后跑 CD**：自动部署文档站、服务或制品

### 最小可用 CI 工作流

下面是一个常见的 GitHub Actions 示例，以 Node 项目为例；如果你是 Go、Python、Java 项目，把安装和测试命令替换掉即可。

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### Go 项目常用 CI 示例

如果你的仓库是 Go 项目，最常见的一套检查通常是：格式、`go vet`、测试、构建。

```yaml
name: go-ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true

      - name: Download dependencies
        run: go mod download

      - name: Check formatting
        run: test -z "$(gofmt -l .)"

      - name: Vet
        run: go vet ./...

      - name: Test
        run: go test ./... -race -cover

      - name: Build
        run: go build ./...
```

适合大多数中小型 Go 服务、CLI、库项目。项目再大一点时，可以继续拆成：

- `lint`
- `unit-test`
- `integration-test`
- `build`
- `release`

这样失败定位会比所有步骤堆在一个 job 里更清楚。

### 典型 CD 场景

#### 场景 1：合并到 `main` 后自动部署

```yaml
name: deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh
```

适合文档站点、静态页面、小型服务等“合并即发布”的项目。

#### 场景 2：打 Tag 后发布版本

```bash
git tag v1.2.0
git push origin v1.2.0
```

```yaml
on:
  push:
    tags:
      - "v*"
```

适合 SDK、CLI、二进制程序、镜像发布等场景。

### GitHub Actions 常用操作

```bash
# 查看最近 workflow 运行
gh run list

# 查看指定运行详情
gh run view <run-id>

# 实时看日志
gh run watch <run-id>

# 查看完整日志
gh run view <run-id> --log

# 重跑失败任务
gh run rerun <run-id>

# 手动触发 workflow
gh workflow run deploy.yml
```

### GitHub Actions 进阶用法

#### Matrix 构建

适合需要同时验证多个版本、多个系统的项目。

```yaml
jobs:
  test:
    runs-on: $&#123;&#123; matrix.os &#125;&#125;
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        go: ['1.23', '1.24']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: $&#123;&#123; matrix.go &#125;&#125;
      - run: go test ./...
```

这样可以尽早发现“只在某个 Go 版本 / 某个平台才会失败”的问题。

#### 上传构建产物

适合把测试报告、构建二进制、前端产物保存到 Actions 里供下载。

```yaml
- name: Build
  run: npm run build

- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: web-dist
    path: dist/
```

#### 手动触发并带参数

适合“手工部署测试环境”“按需执行一次数据修复脚本”这类操作。

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: Deploy target
        required: true
        default: staging
```

触发方式：

```bash
gh workflow run deploy.yml -f environment=staging
```

#### 并发控制

如果你的部署任务不能同时执行，建议加 `concurrency`：

```yaml
concurrency:
  group: deploy-production
  cancel-in-progress: false
```

这样可以避免前一个部署还没结束，后一个部署又把环境覆盖掉。

#### 环境审批

对于生产部署，推荐配合 GitHub Environments 使用：

- `staging` 环境自动部署
- `production` 环境需要审批后部署

这样能在不牺牲自动化的前提下，加一道上线闸门。

#### Secrets 使用建议

- 优先使用 GitHub Actions Secrets / Variables，不要把密钥写进仓库
- 将不同环境的密钥拆开，比如 `STAGING_*`、`PROD_*`
- 尽量给 Token 最小权限
- 对外部云厂商优先考虑 OIDC，而不是长期静态密钥

::: warning
不要在 workflow 里直接 `echo` 敏感变量，也不要把 `.env` 文件上传成 artifact。
:::

### PR 合并前建议检查

- CI 是否全部通过
- 是否和 `main` 同步，没有隐藏冲突
- 是否补了必要测试
- 是否更新了文档、配置或迁移说明
- 是否确认了发布方式：合并即发版，还是打 Tag 再发布

### 常见问题

| 问题 | 常见原因 | 处理方式 |
|------|----------|----------|
| PR 一直不能合并 | 分支落后于 `main` 或检查未通过 | `git fetch origin && git rebase origin/main` 后重新推送 |
| Actions 缓存没生效 | 没配置 `cache` 或 lockfile 变化 | 检查 `setup-*` action 的缓存参数 |
| 本地能过，CI 失败 | Node/Go 版本不同、环境变量缺失、脚本依赖 shell 行为 | 对齐版本，补齐 CI 配置 |
| CD 发布错版本 | 用了 `latest`、分支条件过宽、Tag 规则不严谨 | 收紧触发条件，固定版本号 |

## GitHub Actions 故障排查手册

为了让这篇总手册更聚焦 Git / GitHub 协作主线，GitHub Actions 的详细排障已经拆到独立页面：

- [GitHub Actions 故障排查](./github-actions-troubleshooting.md)

如果你只想先记住最小排查顺序，优先看这 5 件事：

1. 触发条件对不对
2. 运行环境对不对
3. 权限够不够
4. Secrets / Variables 对不对
5. 日志里第一处报错在哪

最常见的问题集中在这些场景：

- workflow 没触发
- 本地能过，CI 失败
- `GITHUB_TOKEN` 权限不足
- Secrets / Variables 不生效
- 缓存、Artifact、Release、Environment 配置异常

需要完整示例、排查路径和故障模板时，直接进入独立专题页即可。

## Commit 规范与发版流程

### 常见 Commit 前缀

推荐使用 Conventional Commits 风格，后续做 changelog、自动发版、PR 审查都会更顺。

| 前缀 | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): support OTP login` |
| `fix` | 修复问题 | `fix(api): handle empty user agent` |
| `docs` | 文档更新 | `docs(git): add GitHub Actions examples` |
| `refactor` | 重构，不改变外部行为 | `refactor(user): simplify service wiring` |
| `test` | 测试相关 | `test(cache): add eviction cases` |
| `chore` | 杂项、依赖、脚本 | `chore(ci): bump actions/checkout to v4` |
| `perf` | 性能优化 | `perf(parser): reduce allocations` |
| `build` | 构建、打包、依赖工具链 | `build(go): upgrade to 1.24` |
| `ci` | CI/CD 配置 | `ci(actions): split lint and test jobs` |

### 提交信息建议

- 第一行尽量控制在 50~72 个字符内
- 先写“做了什么”，再写“为什么”
- 一个 commit 只表达一件事，方便 review 和回滚
- 不要把“格式化 + 重构 + 修 bug”混在一个 commit 里

推荐写法：

```txt
feat(auth): support OTP login
fix(payment): avoid duplicate callback handling
docs(git): add PR workflow and CI/CD notes
ci(go): add race test to GitHub Actions
```

不推荐写法：

```txt
update
fix bug
misc changes
final version
```

### 提交前自检

在执行 `git commit` 之前，建议至少过一遍：

- `git diff --staged` 确认暂存区内容是不是你真想提交的
- 本地测试是否跑过
- 是否混入了日志、调试代码、临时注释、`.env`
- 是否应该拆成两个 commit，而不是一个大杂烩提交

### 整理提交历史

```bash
# 修改最近一次提交说明
git commit --amend

# 把新修改补进最近一次提交，不改 message
git add .
git commit --amend --no-edit

# 整理最近 4 个提交
git rebase -i HEAD~4
```

如果你的团队要求合并前历史干净，通常会在 PR 合并前做一次 squash 或 interactive rebase。

### 常见发版流程

一个比较稳妥的发布流程如下：

```bash
# 1. 同步主分支
git fetch origin
git switch main
git pull --rebase origin main

# 2. 确认工作区干净
git status

# 3. 打 tag
git tag -a v1.2.0 -m "release v1.2.0"

# 4. 推送 tag
git push origin v1.2.0
```

很多团队会让 GitHub Actions 在 tag 推送后自动做这些事：

- 生成 GitHub Release
- 构建二进制文件
- 推送 Docker 镜像
- 上传制品到对象存储或包仓库

### 什么时候发 Patch / Minor / Major

| 版本 | 适用场景 | 示例 |
|------|----------|------|
| `v1.2.1` | 向后兼容的问题修复 | 修复崩溃、修复错误逻辑 |
| `v1.3.0` | 向后兼容的新功能 | 新增接口、新增命令、新增配置项 |
| `v2.0.0` | 不兼容变更 | 删除字段、修改 API 行为、修改默认语义 |

### 发版前检查清单

- 当前 `main` 是否就是准备发布的版本
- 是否已经补齐 changelog / release note
- 数据库迁移、配置项变更是否有说明
- 回滚方案是否明确
- CI 是否全绿
- Tag 是否符合团队约定，比如 `v1.2.0`

### 回滚思路

如果版本已经发布，优先考虑：

```bash
# 回滚某个错误提交
git revert <commit-hash>

# 回滚一个 merge commit
git revert -m 1 <merge-commit-hash>
```

如果只是 tag 打错了，但外部还没消费，才考虑删除并重打；一旦已经被外部依赖，优先发新版本修复，而不是强改历史。

### 发布分支实战流程

如果你的团队不是“合并到 `main` 立即上线”，而是有 `dev -> release -> main/master -> tag` 这种流程，可以参考下面这套实战步骤。

#### 常见分支职责

| 分支 | 作用 |
|------|------|
| `dev` | 日常开发集成分支 |
| `release/*` | 发布预备分支，只接收修复与发布相关改动 |
| `main` / `master` | 已发布或准备发布到生产的稳定分支 |
| `hotfix/*` | 线上紧急修复 |

#### 一次标准发布流程

```bash
# 1. 从 dev 拉出发布分支
git fetch origin
git switch dev
git pull --rebase origin dev
git switch -c release/1.2.0

# 2. 推送发布分支
git push -u origin release/1.2.0
```

之后通常会发生这些事：

- 测试在 `release/1.2.0` 上做回归
- 只允许合并 bugfix、配置修正、文档补充
- 不再往发布分支塞新功能

#### 发布前修 bug

如果测试阶段发现问题，建议在单独分支修好后，再合回 `release/*` 和 `dev`，避免“发布修复丢回主开发线”。

```bash
# 从 release 分支拉出修复分支
git switch release/1.2.0
git switch -c fix/release-login-timeout

# 修完后提交
git add .
git commit -m "fix(auth): handle login timeout on release branch"
git push -u origin fix/release-login-timeout
```

合并顺序通常是：

1. `fix/*` -> `release/1.2.0`
2. 同一个修复再回灌到 `dev`

这样可以避免“发布分支修过了，但开发主线忘了同步”。

#### 发布上线

当 `release/1.2.0` 验证通过后：

```bash
# 1. 合并到生产分支
git switch main
git pull --rebase origin main
git merge --no-ff release/1.2.0

# 2. 打 tag
git tag -a v1.2.0 -m "release v1.2.0"

# 3. 推送主分支和 tag
git push origin main
git push origin v1.2.0
```

如果团队用 GitHub PR 流程，就把这一步改成：

- 提一个 `release/1.2.0 -> main`
- 合并后由 CI/CD 发版

#### 发布后回灌

如果 `release/*` 上做过任何修复，发布后别忘了把它回灌回 `dev`：

```bash
git switch dev
git pull --rebase origin dev
git merge --no-ff release/1.2.0
git push origin dev
```

这是发布流程里最容易遗漏、也最容易导致“下个版本又把老 bug 带回来”的一步。

#### 紧急修复流程

如果线上已经发了 `v1.2.0`，但生产突然出问题：

```bash
# 从 main 拉 hotfix 分支
git fetch origin
git switch main
git pull --rebase origin main
git switch -c hotfix/1.2.1-login-timeout
```

修复完成后，通常要做三件事：

1. 合回 `main`
2. 打 `v1.2.1`
3. 回灌到 `dev`

#### 一张简化流程图

```txt
feature/* --> dev --> release/1.2.0 --> main --> tag v1.2.0
                 \           |
                  \-> fix/* -+

hotfix/* --------> main --> tag v1.2.1
       \------------------> dev
```

#### 发布分支模式的注意点

- `release/*` 进入测试后，尽量不要再塞新功能
- 发布修复要记得回灌到 `dev`
- 发布与 hotfix 最怕“只修一边”，导致后续分支再度分叉
- 如果团队规模不大、发布频率高，也可以直接简化成 GitHub Flow，不必强上复杂分支模型

## 团队 Git 规范模板

如果你们团队还没有统一约定，可以先从下面这份最小模板开始。

### 1. 分支约定

- 主分支：`main`
- 功能分支：`feature/*`
- 修复分支：`fix/*`
- 杂项分支：`chore/*`
- 紧急修复：`hotfix/*`
- 发布分支：按需启用 `release/*`

示例：

```txt
feature/user-profile
fix/payment-timeout
hotfix/login-null-pointer
chore/upgrade-actions
```

### 2. Commit 约定

- 使用 Conventional Commits
- 一个 commit 只做一件事
- 不允许提交调试代码、临时文件、敏感配置

示例：

```txt
feat(user): add profile page
fix(auth): handle expired token
docs(git): add troubleshooting guide
```

### 3. PR 约定

- 所有代码变更通过 PR 合并，不直接推 `main`
- PR 必须写背景、改动、风险、验证
- 至少 1 人 review
- CI 全绿才能合并
- 默认使用 `Squash and merge`

### 4. 分支保护建议

- `main` 禁止直接 push
- 合并前必须通过 CI
- 合并前必须至少一个 approval
- 分支落后时要求先同步再合并
- 生产发布相关 workflow 需要 environment 审批

### 5. 发布约定

- 版本号遵循语义化版本
- 使用 annotated tag
- 由 CI/CD 基于 tag 自动发版
- 发版前检查 changelog、迁移说明、回滚方案

### 6. 回滚约定

- 公共分支优先 `git revert`，不直接改写历史
- 线上事故先止血，再决定 revert 或 hotfix
- 所有回滚动作必须在 PR / Issue / 事故记录里可追踪

### 7. 一个可直接复制的团队约定示例

```md
## Git 工作流约定

- 主分支为 `main`，禁止直接 push
- 所有开发从 `main` 拉出 feature/fix 分支
- 提交信息使用 Conventional Commits
- 所有变更必须通过 PR 合并
- PR 需要写清背景、改动、风险、验证
- 合并前必须通过 CI 并至少获得 1 个 approval
- 默认使用 Squash and merge
- 发布使用 annotated tag，例如 `v1.2.0`
- 线上问题优先 revert，不直接强推改历史
```

这份模板的目标不是“绝对完美”，而是先把团队最容易踩坑的协作行为统一起来。

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

### 误操作恢复速查表

很多时候你不是不会 Git，而是事故来了时想不起“现在该用哪个命令”。下面这张表可以直接当现场速查。

| 现象 | 优先命令 | 说明 |
|------|----------|------|
| 工作区改乱了，还没暂存 | `git restore <file>` | 丢弃未暂存改动 |
| 文件已经 add 了，想撤出暂存区 | `git restore --staged <file>` | 保留工作区改动 |
| 刚提交了，但想重新整理 | `git reset --soft HEAD~1` | 提交撤回到暂存区 |
| 刚提交了，只想回到工作区再改 | `git reset --mixed HEAD~1` | 提交撤回到工作区 |
| 本地彻底想回退到上一个提交 | `git reset --hard HEAD~1` | 会丢工作区改动 |
| 已推送提交想安全回滚 | `git revert <hash>` | 生成反向提交 |
| rebase 搞乱了 | `git rebase --abort` | 放弃本次 rebase |
| merge 冲突不想继续了 | `git merge --abort` | 放弃本次 merge |
| cherry-pick 发现挑错了 | `git cherry-pick --abort` | 放弃本次挑选 |
| 分支 / 提交找不到了 | `git reflog` | 通过历史操作找回 |
| 临时切分支前存了改动，想恢复 | `git stash pop` | 取回现场 |

#### 两条恢复原则

- **公共分支优先 `revert`，少用 `reset --hard` + 强推**
- **找不回时先看 `git reflog`，别急着乱操作**

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

## 多人协作排障

这一节专门处理团队协作里最常见的“事故现场”：PR 冲突、误删分支、误发版、Tag 打错，以及上线后需要快速回滚的情况。

### 场景一：PR 冲突

#### 典型现象

- GitHub 页面提示 `This branch has conflicts that must be resolved`
- 本地 `git rebase origin/main` 时出现 `CONFLICT`
- 同一个文件被多人同时修改，尤其是路由、配置、锁文件、SQL 迁移文件

#### 推荐处理流程

```bash
# 1. 拉取远程最新代码
git fetch origin

# 2. 切到自己的功能分支
git switch feature/login-otp

# 3. 变基到 main 最新提交
git rebase origin/main

# 4. 解决冲突后继续
git add .
git rebase --continue

# 5. 更新远程 PR 分支
git push --force-with-lease origin feature/login-otp
```

如果你们团队不希望改写分支历史，也可以用 merge：

```bash
git fetch origin
git merge origin/main
git add .
git commit
git push origin feature/login-otp
```

#### 实战建议

- **自己分支自己解决**：不要把冲突甩给 reviewer
- **优先保留业务语义**：别只为了消除标记，结果把逻辑拼错
- **锁文件单独确认**：`package-lock.json`、`go.sum`、迁移文件经常“看起来能合，实际有坑”
- **冲突解决后重跑测试**：尤其是接口、配置、数据结构变更

### 场景二：误删分支

#### 误删本地分支

如果本地分支删了，但远程还在：

```bash
git fetch origin
git switch -c feature/login-otp origin/feature/login-otp
```

如果本地和远程都删了，但之前提交过 commit，可以从 `reflog` 找回：

```bash
# 查找历史操作记录
git reflog

# 找到丢失分支对应的 commit 后，重新建分支
git switch -c feature/login-otp <commit-hash>
```

#### 误删远程分支

如果只是远程分支被删了，而你本地还在：

```bash
git switch feature/login-otp
git push -u origin feature/login-otp
```

如果本地也没了，就先用 `reflog` 或 PR 页面找到最后一个 commit，再重新推：

```bash
git switch -c feature/login-otp <commit-hash>
git push -u origin feature/login-otp
```

#### 预防建议

- 关键分支开启保护规则
- 合并后自动删功能分支可以开，但不要对 `release/*`、`hotfix/*` 乱删
- 大版本发布前，给关键点打 tag，避免只能靠分支名回忆

### 场景三：误发版

“误发版”一般分三种：

| 情况 | 风险 | 建议处理 |
|------|------|----------|
| 发布了错误代码到生产 | 高 | 立即回滚或发 hotfix |
| 发布流程触发错环境 | 高 | 先停自动化，再确认影响范围 |
| 发布了不该发布的制品 | 中 | 撤掉制品入口，补发正确版本 |

#### 推荐处理流程

1. **先止血**：暂停自动部署、冻结后续发布
2. **确认范围**：影响的是生产、测试还是仅 release 页面
3. **决定策略**：
   - 能快速回滚，就先回滚
   - 不能回滚，就发 hotfix
4. **补记录**：在 PR、Issue、事故群里同步时间点、影响范围、处理人

#### 常见操作

如果发布就是把某个错误 merge commit 合进了 `main`，通常优先：

```bash
git revert -m 1 <merge-commit-hash>
git push origin main
```

如果你们必须走 PR 流程：

```bash
git switch -c revert/bad-release
git revert -m 1 <merge-commit-hash>
git push -u origin revert/bad-release
gh pr create --base main --head revert/bad-release --fill
```

::: warning
已经公开发布出去的版本，优先“追加一个修复版本”或“revert 一个错误提交”，不要直接改写 `main` 历史。
:::

### 场景四：Tag 打错

#### 情况 1：本地刚打错，还没推送

```bash
git tag -d v1.2.0
git tag -a v1.2.1 -m "release v1.2.1"
```

#### 情况 2：已经推到远程，但还没人使用

```bash
# 删除本地 tag
git tag -d v1.2.0

# 删除远程 tag
git push origin :refs/tags/v1.2.0

# 重新打正确的 tag
git tag -a v1.2.1 -m "release v1.2.1"
git push origin v1.2.1
```

#### 情况 3：已经被外部消费

这时不要偷偷重打同名 tag。更稳妥的方式是：

- 保留错误 tag 作为历史事实
- 重新发布正确版本，比如 `v1.2.1`
- 在 Release Note 里说明 `v1.2.0` 有问题，不建议使用

#### Tag 事故预防

- 发布前执行 `git rev-parse <tag>` 或确认 tag 指向 commit
- 使用 annotated tag：`git tag -a`
- 把“谁负责打 tag、谁负责确认版本号”写进发布流程

### 场景五：回滚事故处理流程

#### 先判断该回滚什么

| 回滚对象 | 常见场景 | 推荐方式 |
|----------|----------|----------|
| 单个 commit | 某次小改动引入问题 | `git revert <hash>` |
| merge commit | 某个 PR 合入后出问题 | `git revert -m 1 <merge-hash>` |
| 整个版本 | 版本发布后出现系统性问题 | 回滚部署 + 补 revert / hotfix |
| 数据变更 | 代码和数据库同时有问题 | 代码回滚 + 数据修复脚本 + 人工确认 |

#### 标准处理步骤

1. **确认是否需要立即止血**
   - 下线入口
   - 暂停 CI/CD 自动部署
   - 切流 / 回切老版本
2. **选回滚方式**
   - 代码层面：`revert`
   - 部署层面：回退镜像 / 回退制品 / 回退 Helm release
3. **验证回滚结果**
   - 核心接口
   - 关键页面
   - 错误率 / 延迟 / 监控指标
4. **补后续动作**
   - 发 hotfix
   - 写事故复盘
   - 给流程补保护措施

#### 常用回滚命令

```bash
# 回滚单个 commit
git revert <commit-hash>

# 回滚 merge commit
git revert -m 1 <merge-commit-hash>

# 一次回滚多个连续提交
git revert <oldest-hash>^..<newest-hash>
```

#### 不建议的做法

- 直接对公共分支 `reset --hard` 后强推
- 没确认数据库状态就只回滚代码
- 还没止血就继续合并新 PR
- 没通知团队就私自删 tag、删 release、改历史

### 事故处理最小清单

多人协作时，出事故后至少同步这几件事：

- **发生时间**：从哪个版本 / 哪次 PR 开始异常
- **影响范围**：生产、预发、单个租户还是全量用户
- **当前动作**：已回滚、正在修复、已暂停发布
- **负责人**：谁在处理、谁在验证、谁负责沟通
- **恢复标准**：哪些检查通过后才算恢复

很多团队技术问题不一定最难，最难的是“没人知道现在到底谁在处理、处理到哪一步了”。这份清单就是为了解决这个问题。

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
    wip = stash push -u -m wip
    undo = reset --soft HEAD~1
```

## 补充技巧

上文已经把 `cherry-pick`、`reflog`、分支对比、回滚恢复这些高频场景展开写过了；这里保留几个前面没重点展开、但也很实用的补充项。

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

### worktree：并排开两个工作目录

如果你经常要同时看 `dev` 和 `main/master`，或者一边修 bug、一边保留当前现场，`worktree` 会比频繁切分支更舒服。

```bash
# 拉一个新的工作目录出来看 dev
git worktree add ../repo-dev dev

# 看完后清理
git worktree remove ../repo-dev
```

适合这些场景：

- 一边保留当前开发现场，一边去另一个分支排查
- 同时打开两个 IDE 窗口并排比代码
- 不想反复 `stash` / `switch`

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

## 延伸阅读

- 想优化终端工作流：读 [iTerm2 配置指南](./iterm2.md)
- 想提升编辑效率：读 [Vim 实用方案](./vim.md)
- 想补全本机开发环境：读 [Mac 效率工具](./mac.md)
