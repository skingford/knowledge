---
title: GitOps 与持续交付实战
description: 系统讲清 GitOps 核心理念、ArgoCD 与 Flux 的工作机制、CI/CD 与 K8s 的对接模式，以及为什么"git push 触发部署"不等于 GitOps。
---

# GitOps 与持续交付实战

把应用部署到 K8s 的方式有很多：kubectl apply、Helm install、CI 管道里跑 deploy 脚本。但团队规模一大，几个问题就绑在一起了：

- 谁在什么时候改了什么配置，线上和仓库对不上
- 多个环境的配置散落在 CI 变量和脚本里，没有统一的版本记录
- 手动 kubectl 操作导致的漂移（drift）没人发现
- 出了问题回滚靠记忆和经验，不靠机制

GitOps 的核心主张是：**Git 仓库是集群期望状态的唯一真相来源，所有变更都通过 Git commit 触发，系统自动把集群拉到和 Git 一致的状态。**

<K8sDiagram kind="gitops-delivery-chain" />

## 1. GitOps 的核心原则

### 1.1 四条原则

| 原则 | 含义 |
| --- | --- |
| **声明式** | 所有配置以声明式 YAML/HCL 存储，不是脚本 |
| **版本化** | 所有变更通过 Git commit 记录，可追溯、可审计 |
| **自动拉取** | 系统主动检测 Git 变更并应用，不是 CI push 到集群 |
| **持续调谐** | 系统持续比对 Git 和集群状态，发现漂移自动修正 |

### 1.2 Push 模式 vs Pull 模式

| 模式 | 工作方式 | 典型代表 |
| --- | --- | --- |
| **Push** | CI 管道在构建后 kubectl apply 到集群 | Jenkins、GitHub Actions |
| **Pull** | 集群内 Agent 监听 Git 变更，主动拉取并应用 | ArgoCD、Flux |

GitOps 推荐 **Pull 模式**，原因：

- CI 不需要 kubeconfig 或集群凭证，安全性更高
- Agent 在集群内运行，能持续检测漂移
- 即使 CI 挂了，集群仍然能自动修复到 Git 状态

> "git push 触发 CI 脚本 kubectl apply" 是 CI/CD，不是 GitOps。GitOps 的关键是集群内有 Agent 持续把集群状态拉回 Git 描述的状态。

## 2. ArgoCD：最流行的 GitOps 引擎

### 2.1 核心概念

| 概念 | 说明 |
| --- | --- |
| **Application** | 一个 ArgoCD 应用，绑定一个 Git 仓库路径和一个目标集群/namespace |
| **Sync** | 将集群状态同步到 Git 仓库描述的状态 |
| **Sync Status** | `Synced`（一致）/ `OutOfSync`（有差异） |
| **Health Status** | `Healthy` / `Degraded` / `Progressing` / `Missing` |
| **Project** | 应用分组，控制权限和可访问的仓库、集群 |

### 2.2 工作流程

```
开发者 push 代码 → CI 构建镜像并推送 → 更新 Git 配置仓库里的 image tag
                                              ↓
                                    ArgoCD 检测到 Git 变更
                                              ↓
                                    对比 Git 期望状态 vs 集群实际状态
                                              ↓
                                    自动或手动 Sync → kubectl apply
                                              ↓
                                    持续监控 Health 和 Sync 状态
```

### 2.3 Application 示例

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/k8s-manifests.git
    targetRevision: main
    path: apps/my-app/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true       # 删除 Git 中已移除的资源
      selfHeal: true     # 检测到漂移时自动修正
    syncOptions:
      - CreateNamespace=true
```

### 2.4 Sync 策略

| 策略 | 说明 |
| --- | --- |
| `automated` | Git 变更后自动同步 |
| `prune` | 删除集群中存在但 Git 中已移除的资源 |
| `selfHeal` | 有人手动改了集群，自动恢复到 Git 状态 |
| 手动 Sync | 需要在 UI 或 CLI 手动触发 |

生产环境常见做法：**staging 开 automated，prod 用手动 Sync 或 PR 审批触发**。

## 3. Flux：轻量级 GitOps 方案

### 3.1 核心组件

Flux v2 是一组 K8s controller：

| 组件 | 职责 |
| --- | --- |
| **Source Controller** | 监听 Git/Helm/OCI 仓库变更 |
| **Kustomize Controller** | 用 Kustomize 渲染并 apply |
| **Helm Controller** | 管理 HelmRelease 生命周期 |
| **Notification Controller** | 发送/接收事件通知 |

### 3.2 Flux vs ArgoCD

| 维度 | ArgoCD | Flux |
| --- | --- | --- |
| 架构 | 单体应用 + Web UI | 微服务化 controller 组 |
| UI | 内建丰富 Web UI | 无内建 UI（可接 Weave GitOps） |
| 多集群 | 内建支持 | 需配合其他工具 |
| 配置管理 | Kustomize / Helm / 纯 YAML | Kustomize / Helm |
| 学习成本 | 较低（UI 直观） | 较高（CRD 驱动） |
| 适合场景 | 需要 UI 和多集群管理 | 偏好纯 CRD 声明式 |

## 4. Git 仓库结构设计

### 4.1 单仓库 vs 多仓库

| 模式 | 优点 | 缺点 |
| --- | --- | --- |
| **单仓库（monorepo）** | 集中管理、统一变更、容易全局搜索 | 权限粒度粗，大团队冲突多 |
| **多仓库** | 权限独立、变更互不影响 | 难以做全局视图，跨仓库变更复杂 |

常见折中：**一个应用代码仓库 + 一个配置仓库**，CI 更新配置仓库的镜像版本。

### 4.2 典型目录结构

```
k8s-manifests/
├── apps/
│   ├── my-app/
│   │   ├── base/                  # 基础 YAML
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── dev/               # dev 环境覆盖
│   │       │   ├── kustomization.yaml
│   │       │   └── patch-replicas.yaml
│   │       ├── staging/
│   │       └── prod/
│   └── another-app/
├── infrastructure/                # 基础设施组件
│   ├── monitoring/
│   ├── cert-manager/
│   └── ingress-nginx/
└── clusters/                      # 集群级配置
    ├── dev/
    ├── staging/
    └── prod/
```

## 5. CI/CD 与 GitOps 的对接

### 5.1 标准流程

```
1. 开发者 push 代码到应用仓库
2. CI 构建镜像 → 推送到 Registry → 打 tag（如 sha-abc123）
3. CI 更新配置仓库中对应环境的 image tag
4. ArgoCD/Flux 检测到配置仓库变更
5. 自动同步到集群
```

### 5.2 镜像更新自动化

Flux 的 Image Automation Controller 可以自动检测 Registry 中的新镜像版本，并自动更新 Git 仓库中的 tag，免去 CI 手动更新配置仓库的步骤。

ArgoCD 可以配合 ArgoCD Image Updater 实现类似能力。

## 6. 最容易踩的坑

**坑 1：把 CI 的 kubectl apply 当成 GitOps**

没有集群内 Agent 做持续调谐，手动改了集群不会被发现和修正，这不是 GitOps。

**坑 2：prune 不小心删了不该删的资源**

开启 `prune: true` 后，从 Git 中移除一个 YAML 文件，集群中对应的资源也会被删除。操作前要确认影响范围。

**坑 3：Secret 明文提交到 Git**

GitOps 要求所有配置存在 Git 里，但 Secret 不能明文。常见方案：
- **Sealed Secrets**：加密后存 Git，集群内解密
- **SOPS**：用 KMS 加密 values 文件
- **External Secrets Operator**：Git 里只存引用，运行时从 Vault/AWS SM 拉取

**坑 4：selfHeal 和手动调试冲突**

开了 selfHeal 后，手动 kubectl edit 的变更会被自动回滚。调试时需要临时关闭或用 annotation 排除。

**坑 5：配置仓库的 PR 审批成为瓶颈**

如果所有环境变更都走 PR 审批，发布速度会被 review 流程卡住。建议 dev 自动合并，staging/prod 需要审批。

## 7. 面试答法

被问"什么是 GitOps"时：

1. **核心理念** — Git 是集群期望状态的唯一真相来源，集群内 Agent 持续把实际状态拉回 Git 描述的状态
2. **和传统 CI/CD 的区别** — CI/CD 是 push 模式（CI 向集群推），GitOps 是 pull 模式（Agent 从 Git 拉），安全性和自愈能力更强
3. **工具选型** — ArgoCD 适合需要 UI 和多集群的场景，Flux 适合纯 CRD 声明式和轻量场景
4. **落地要点** — 配置仓库和代码仓库分离、Secret 加密、环境隔离、PR 审批流程

> GitOps 不是"用 Git 管 YAML"那么简单，它的核心是集群内有一个 Agent 持续做调谐，保证 Git 里写了什么，集群就是什么。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [Helm 与包管理实战](./helm-and-package-management.md)
- [CRD、Operator 与扩展机制实战](./crd-operator-and-extension.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [可观测性与监控实战](./observability-and-monitoring.md)
