---
title: GitHub Actions 故障排查
description: GitHub Actions 故障排查手册，覆盖 workflow 不触发、权限不足、Secrets、缓存、Artifact、Environment 审批等高频问题。
---

# GitHub Actions 故障排查

这页专门解决“workflow 明明写了，为什么就是不工作”的问题。适合在 CI/CD 卡住、部署没触发、权限报错、Secrets 不生效时快速查阅。

如果你想先补完整的 Git / GitHub 协作上下文，可以先看 [Git 常用技巧](./git.md)；如果你已经在排查具体 CI 故障，直接从下面开始。

## 先看哪 5 件事

遇到 Actions 异常时，优先按这个顺序排查：

1. **触发条件对不对**：`push`、`pull_request`、`workflow_dispatch`、`tags`
2. **运行环境对不对**：Runner、语言版本、操作系统
3. **权限够不够**：`GITHUB_TOKEN`、repo 权限、environment 审批
4. **Secrets / Variables 对不对**：名字、作用域、环境绑定
5. **日志里第一处报错在哪**：不要只看最后一行失败信息

## 场景一：Workflow 没触发

### 常见原因

- workflow 文件不在 `.github/workflows/` 下
- 分支条件写错，比如只监听了 `main`
- tag 规则不匹配
- PR 来源于 fork，某些权限 / secret 默认不可用

### 排查示例

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

## 场景二：本地能过，CI 失败

### 常见原因

- Node / Go / Python 版本不一致
- CI 缺环境变量
- 本地依赖缓存“掩盖了问题”
- shell、路径分隔符、文件权限在 Linux Runner 上不同

### 建议处理

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

## 场景三：权限不足

### 典型报错

- `Resource not accessible by integration`
- `403 Forbidden`
- 无法创建 release / comment / deployment

### 常见原因

- `GITHUB_TOKEN` 默认权限不够
- workflow 运行在 fork PR 上
- 目标仓库 / 环境需要额外审批

### 处理方式

可以在 workflow 里显式声明权限：

```yaml
permissions:
  contents: write
  pull-requests: write
```

如果只是读取代码，不要给过大的权限；如果需要发 release、写评论、推制品，再按需放开。

## 场景四：Secrets 不生效

### 常见原因

- secret 名写错
- 写在 repository secrets，但 workflow 用的是 environment secrets
- fork PR 默认拿不到敏感 secret

### 检查方式

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

## 场景五：缓存异常

### 现象

- 明明开了缓存，但每次都重新下载依赖
- 改完依赖后还在吃旧缓存

### 建议

- Node 用 `actions/setup-node` 的 `cache: npm`
- Go 用 `actions/setup-go` 的 `cache: true`
- 关注 lockfile / `go.sum` 是否变化

如果怀疑缓存污染，先接受一次“重新安装”，不要一开始就执着于缓存命中率。

## 场景六：Artifact / Release 不见了

### 常见原因

- 上传路径写错
- 文件在上传前没生成
- release 触发条件没命中

### 示例

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

## 场景七：部署重复执行 / 顺序错乱

### 常见原因

- 多次 push 连续触发 deploy
- 同一环境没有并发控制
- staging / production 共用一套 workflow 但没隔离

### 建议

```yaml
concurrency:
  group: deploy-$&#123;&#123; github.ref &#125;&#125;
  cancel-in-progress: true
```

对生产环境，很多时候更推荐 `cancel-in-progress: false`，避免前一个正式部署被新任务中途打断。

## 场景八：Environment 卡住不动

### 常见原因

- 需要 reviewer 审批
- 环境保护规则还没放行
- 部署分支不满足环境规则

排查时去 GitHub 页面看：

- Environment protection rules
- Required reviewers
- 当前 job 是否真的绑定到了对应 environment

## 一份最小排障模板

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
