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

### 推荐分支命名

```txt
feature/login-otp
fix/payment-timeout
refactor/user-service
docs/git-github-actions
chore/upgrade-node20
```

分支名尽量体现“类型 + 主题”，这样在 PR 列表、CI 面板和发布记录里都更容易定位。

### PR 提交流程

```bash
# 1. 基于 main 最新代码创建功能分支
git fetch origin
git switch main
git pull --rebase origin main
git switch -c feature/login-otp

# 2. 开发并提交
git add -p
git commit -m "feat(auth): support OTP login"

# 3. 首次推送并建立远程跟踪
git push -u origin feature/login-otp

# 4. 使用 GitHub CLI 创建 PR
gh pr create --base main --head feature/login-otp --fill
```

如果你还没准备好合并，可以先建草稿 PR：

```bash
gh pr create --base main --head feature/login-otp --fill --draft
```

### PR 描述建议

建议至少写清这 4 部分：

- **背景**：为什么要改，修的是哪个问题
- **改动**：本次做了什么，没做什么
- **风险**：是否涉及数据库、接口、配置、权限、兼容性
- **验证**：本地怎么测、截图/日志/命令结果是什么

一个实用模板：

```md
## 背景
- 修复登录流程无法使用 OTP 的问题

## 改动
- 新增 OTP 登录入口
- 补充验证码校验逻辑
- 增加失败重试提示

## 风险与影响
- 涉及登录接口参数变更
- 不影响已有密码登录

## 验证
- [x] 本地登录成功
- [x] 验证码错误时提示正常
- [x] 相关单元测试通过
```

### Review 后继续修改

```bash
# 拉取最新 main，避免分支漂移太久
git fetch origin
git rebase origin/main

# 修复 review 意见后继续提交
git add .
git commit -m "fix(auth): address PR review comments"
git push origin feature/login-otp
```

如果你想把 review 修复整理进原来的 commit，可以用 `fixup`：

```bash
git commit --fixup <commit-hash>
git rebase -i --autosquash origin/main
git push --force-with-lease origin feature/login-otp
```

::: warning 什么时候可以 force push
- **自己独占的功能分支**：可以，用 `--force-with-lease`
- **多人共用分支**：慎用，先和同事确认
- **`main` / `release` / 已发布分支**：不要改写历史
:::

### GitHub CLI 常用命令

```bash
# 看我当前有哪些 PR
gh pr status

# 查看某个 PR
gh pr view 123
gh pr view 123 --web

# checkout 别人的 PR 到本地
gh pr checkout 123

# 将 Draft PR 标记为 Ready for review
gh pr ready 123

# 查看 PR 检查状态
gh pr checks 123 --watch
```

::: tip
如果团队启用了分支保护规则，通常要求：PR review 通过、CI 绿灯、分支与 `main` 同步后才能合并。
:::

### 多人协作中的 Code Review 处理

Code Review 的目标不是“挑刺”，而是尽早发现风险、同步上下文、降低合并后的返工成本。

#### 作为提交者，怎么提 Review 更高效

发起 review 前，建议先做到这几件事：

- PR 控制在 reviewer 能快速理解的范围内
- 描述里写清背景、改动、风险、验证方式
- 把明显无关的格式化、重命名、杂项改动剥离出去
- 对重点代码加注释或在 PR 描述里标注“建议重点看哪几处”

一个常见做法是直接在 PR 描述里补“Review 建议顺序”：

```md
## 建议阅读顺序
1. `internal/auth/service.go`
2. `internal/auth/handler.go`
3. `internal/auth/service_test.go`
```

这样 reviewer 不用先自己猜入口。

#### 作为 reviewer，主要看什么

review 时优先看高风险项，而不是先纠结代码风格：

- 行为是否正确，是否会引入回归
- 边界条件、空值、异常路径是否覆盖
- 接口、数据结构、配置是否兼容
- 并发、安全、权限、事务、资源释放是否有问题
- 测试是否覆盖关键路径

如果只是命名、格式、注释这类低风险问题，尽量放在后面集中提，避免淹没真正重要的问题。

#### Review 代码审核操作

实际审核代码时，建议按“先看全局，再看重点，最后给结论”的顺序来。

##### 1. 先拉下 PR 到本地

```bash
# checkout 某个 PR
gh pr checkout 123

# 看当前 PR 的基本信息
gh pr view 123

# 查看评论和上下文
gh pr view 123 --comments
```

如果 PR 比较复杂，本地看代码通常比只在网页里逐段看更高效。

##### 2. 先看改动全貌

```bash
# 看本次 PR 相对 main 的差异
git diff origin/main...HEAD

# 只看文件列表和改动量
git diff --stat origin/main...HEAD

# 图形化看提交历史
git log --oneline --graph origin/main..HEAD
```

这一轮主要回答 3 个问题：

- 改了哪些模块
- 改动规模大不大
- 有没有把无关改动混进来

##### 3. 再看重点文件

```bash
# 只审某个文件
git diff origin/main...HEAD -- internal/auth/service.go

# 看某个提交具体改了什么
git show <commit-hash>

# 对比 rebase / fixup 前后的提交变化
git range-diff origin/main...HEAD
```

适合优先看的文件一般是：

- handler / controller / router
- service / usecase
- repository / DAO / SQL / migration
- 配置、权限、中间件、并发控制相关代码
- 测试文件

##### 4. 本地运行关键验证

只看代码不跑验证，很容易漏掉“逻辑看起来对，但行为其实错了”的问题。

```bash
# 项目测试
npm test
go test ./...

# 看 PR 检查状态
gh pr checks 123 --watch
```

如果是前端或接口改动，最好额外确认：

- 页面 / 接口是否真的能跑通
- 失败路径是否有异常
- 回归点有没有被测到

##### 5. 给出 review 结论

常见的 3 种动作：

```bash
# 发表评论
gh pr review 123 --comment -b "整体思路没问题，建议补一个错误分支测试"

# 通过
gh pr review 123 --approve -b "本地验证通过，可以合并"

# 请求修改
gh pr review 123 --request-changes -b "存在空指针风险，请先修复再合并"
```

##### 6. 评论怎么写更有效

尽量避免这种模糊评论：

- `这里不太好`
- `建议优化一下`
- `感觉有问题`

更推荐这种写法：

```txt
问题：
- 当 user == nil 时这里会 panic

原因：
- 上游调用链里存在查不到用户直接返回 nil 的路径

建议：
- 先做 nil 判断，并补一个对应测试
```

这样提交者更容易快速理解并执行。

#### 常见 review 处理流程

```txt
提交者开 PR
-> reviewer 看代码并留言
-> 提交者逐条处理
-> 代码更新后回复处理结果
-> reviewer 再次确认
-> 通过后合并
```

多人协作时，最怕的是“评论堆着没人认领”或者“改完了但 reviewer 不知道哪里改了”。

#### 收到 review 意见后，推荐这样处理

1. **先分类**
   - 必改：真实 bug、风险、缺测试
   - 可讨论：方案选择、命名、实现方式
   - 可后续：不影响本次合并的优化项
2. **再批量处理**
   - 同类问题一起改
   - 改完后统一 push
3. **最后逐条回复**
   - 说明“已修改什么”
   - 如果没采纳，说明理由和权衡

一个好用的回复模板：

```md
已处理：
- 空指针分支已补保护
- 单元测试已补充超时场景

未直接采纳：
- 这里先不拆文件，原因是当前改动范围较小，拆分后反而增加跨文件跳转成本
- 如果后续这个模块继续扩展，再一起做结构调整
```

#### 改完 review 后怎么提交

如果只是普通追加修复：

```bash
git add .
git commit -m "fix(auth): address PR review comments"
git push origin feature/login-otp
```

如果你想保持历史整洁，可以在合并前再做一次整理：

```bash
git commit --fixup <commit-hash>
git rebase -i --autosquash origin/main
git push --force-with-lease origin feature/login-otp
```

#### GitHub CLI 处理 review

```bash
# 查看 PR 和评论
gh pr view 123 --comments

# 发表评论型 review
gh pr review 123 --comment -b "整体结构清楚，建议补一个超时场景测试"

# Approve
gh pr review 123 --approve -b "已验证通过"

# Request changes
gh pr review 123 --request-changes -b "请先修复空指针风险和缺失测试"
```

#### 遇到分歧怎么办

review 分歧很正常，关键是别把讨论变成“口味之争”。

建议按这个顺序处理：

1. 先回到目标：是为了正确性、可维护性，还是只是个人偏好
2. 先给证据：代码路径、性能数据、历史事故、团队约定
3. 达不成一致时，找模块 owner 或团队负责人拍板
4. 对本次发布不阻塞的问题，记录成 follow-up，不要无限拉扯

#### 什么时候应该 request changes

更适合直接 `request changes` 的情况：

- 明确存在 bug 或高风险缺陷
- 缺关键测试，无法确认正确性
- 改动违反团队明确约定
- 存在安全、权限、事务、数据一致性问题

不太建议因为这些就直接卡住 PR：

- 纯个人风格偏好
- 可读性优化但不影响正确性
- 可以后续独立处理的小重构

#### Code Review 最小共识

如果团队想先建立一套不过度复杂的 review 约定，可以从下面开始：

- 提交者先自审，再发 review
- reviewer 先看正确性和风险，再看风格
- 评论要具体，尽量说明“为什么”
- 提交者改完后逐条回复，不要只说“已改”
- 有争议的问题升级讨论，不在评论区无限往返
- 通过前至少确认：逻辑、风险、测试、回滚面

### PR 最佳实践

#### 尽量让 PR 小而清晰

比起一次提交 3000 行的大 PR，更推荐：

- 一个 PR 只解决一个明确问题
- 先拆基础重构，再提业务改动
- UI 改动附截图，接口改动附请求示例
- 数据库改动单独写迁移说明

一个简单经验：

| PR 类型 | 建议规模 |
|---------|----------|
| Bugfix | 尽量控制在 reviewer 10~15 分钟能看完 |
| 功能开发 | 可以稍大，但最好按阶段拆 PR |
| 重构 | 优先“无行为变化”的独立 PR |

#### 先自审，再发给别人看

提 PR 前建议先自己过一遍：

```bash
git diff origin/main...HEAD
gh pr diff --web
```

重点检查：

- 命名是否清楚
- 是否混入调试代码
- 是否存在无意义格式化噪音
- 是否有遗漏的测试 / 文档 / 配置变更

#### 常见合并策略

| 策略 | 适用场景 | 特点 |
|------|----------|------|
| Squash and merge | 最常见，适合功能分支 | 主分支历史干净，一个 PR 一个 commit |
| Rebase and merge | 团队强调线性历史 | 保留 commit 序列，不产生 merge commit |
| Create a merge commit | 长期分支、希望保留上下文 | 完整保留分支拓扑 |

如果团队没有特别要求，通常优先选 `Squash and merge`，因为回溯 PR 和回滚都更简单。

#### 分支保护规则建议

常见的 GitHub Branch Protection 可以开启：

- Require a pull request before merging
- Require approvals
- Require status checks to pass
- Require branches to be up to date before merging
- Restrict who can push to matching branches

这套规则最适合 `main`、`release/*`、`hotfix/*` 之类的关键分支。

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

这一节专门解决“workflow 明明写了，为什么就是不工作”的问题。

### 先看哪 5 件事

遇到 Actions 异常时，优先按这个顺序排查：

1. **触发条件对不对**：`push`、`pull_request`、`workflow_dispatch`、`tags`
2. **运行环境对不对**：Runner、语言版本、操作系统
3. **权限够不够**：`GITHUB_TOKEN`、repo 权限、environment 审批
4. **Secrets / Variables 对不对**：名字、作用域、环境绑定
5. **日志里第一处报错在哪**：不要只看最后一行失败信息

### 场景一：Workflow 没触发

#### 常见原因

- workflow 文件不在 `.github/workflows/` 下
- 分支条件写错，比如只监听了 `main`
- tag 规则不匹配
- PR 来源于 fork，某些权限 / secret 默认不可用

#### 排查示例

```yaml
on:
  push:
    branches: [main]
```

如果你在 `feature/login` 上推送，自然不会触发。

更通用的写法：

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

### 场景二：本地能过，CI 失败

#### 常见原因

- Node / Go / Python 版本不一致
- CI 缺环境变量
- 本地依赖缓存“掩盖了问题”
- shell、路径分隔符、文件权限在 Linux Runner 上不同

#### 建议处理

```bash
# 本地对齐版本
node -v
go version

# 尽量使用与 CI 一样的命令
npm ci
npm test
go test ./...
```

重点不是“在我电脑上能跑”，而是“在干净环境里也能稳定跑”。

### 场景三：权限不足

#### 典型报错

- `Resource not accessible by integration`
- `403 Forbidden`
- 无法创建 release / comment / deployment

#### 常见原因

- `GITHUB_TOKEN` 默认权限不够
- workflow 运行在 fork PR 上
- 目标仓库 / 环境需要额外审批

#### 处理方式

可以在 workflow 里显式声明权限：

```yaml
permissions:
  contents: write
  pull-requests: write
```

如果只是读取代码，不要给过大的权限；如果需要发 release、写评论、推制品，再按需放开。

### 场景四：Secrets 不生效

#### 常见原因

- secret 名写错
- 写在 repository secrets，但 workflow 用的是 environment secrets
- fork PR 默认拿不到敏感 secret

#### 检查方式

```yaml
env:
  API_BASE_URL: $&#123;&#123; vars.API_BASE_URL &#125;&#125;
  DEPLOY_TOKEN: $&#123;&#123; secrets.DEPLOY_TOKEN &#125;&#125;
```

排查时：

- 确认 secret 名大小写完全一致
- 确认当前 job 是否绑定了 environment
- 确认是不是从 fork 提交的 PR

::: warning
不要通过 `echo $&#123;&#123; secrets.DEPLOY_TOKEN &#125;&#125;` 这种方式排查 secret；即使 GitHub 会尝试 masking，也不该主动打印。
:::

### 场景五：缓存异常

#### 现象

- 明明开了缓存，但每次都重新下载依赖
- 改完依赖后还在吃旧缓存

#### 建议

- Node 用 `actions/setup-node` 的 `cache: npm`
- Go 用 `actions/setup-go` 的 `cache: true`
- 关注 lockfile / `go.sum` 是否变化

如果怀疑缓存污染，先接受一次“重新安装”，不要一开始就执着于缓存命中率。

### 场景六：Artifact / Release 不见了

#### 常见原因

- 上传路径写错
- 文件在上传前没生成
- release 触发条件没命中

#### 示例

```yaml
- name: Build
  run: mkdir -p dist && echo hello > dist/app.txt

- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: app-dist
    path: dist/
```

如果 `dist/` 根本不存在，artifact 自然不会上传成功。

### 场景七：部署重复执行 / 顺序错乱

#### 常见原因

- 多次 push 连续触发 deploy
- 同一环境没有并发控制
- staging / production 共用一套 workflow 但没隔离

#### 建议

```yaml
concurrency:
  group: deploy-$&#123;&#123; github.ref &#125;&#125;
  cancel-in-progress: true
```

对生产环境，很多时候更推荐 `cancel-in-progress: false`，避免前一个正式部署被新任务中途打断。

### 场景八：Environment 卡住不动

#### 常见原因

- 需要 reviewer 审批
- 环境保护规则还没放行
- 部署分支不满足环境规则

排查时去 GitHub 页面看：

- Environment protection rules
- Required reviewers
- 当前 job 是否真的绑定到了对应 environment

### 一份最小排障模板

出现 Actions 故障时，可以按这个格式记录：

```txt
现象：
- PR 上 CI 失败，只有 deploy job 没启动

触发条件：
- pull_request -> main

报错位置：
- deploy / setup step / Resource not accessible by integration

初步判断：
- GITHUB_TOKEN 权限不足，且 PR 来自 fork

处理动作：
- 给 deploy job 补 permissions
- 调整 fork PR 不执行 deploy
```

这能帮团队减少“每次都从头读日志”的重复沟通成本。

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
