---
title: GitHub PR 与 Code Review
description: GitHub PR 与 Code Review 实战指南，覆盖提交流程、评论处理、审核操作、合并策略与多人协作实践。
---

# GitHub PR 与 Code Review

这页专门整理 GitHub 协作中的高频环节：PR 提交、Review、评论处理、审核操作与多人协作最佳实践。

如果你想先补 Git 基础、分支对比、回滚恢复，再回到协作流程，可以先看 [Git 常用技巧](./common-tips.md)。如果你当前正准备提 PR 或审代码，直接从下面开始。

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
