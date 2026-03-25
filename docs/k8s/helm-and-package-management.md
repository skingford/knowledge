---
title: Helm 与包管理实战
description: 系统讲清 Helm Chart 结构、values 管理、install/upgrade/rollback 生命周期、仓库与依赖，以及为什么 Helm 不等于"K8s 的 apt-get"。
---

# Helm 与包管理实战

直接用 kubectl apply 管理少量 YAML 没问题，但项目一旦超过 10 个资源对象，几类问题就会频繁出现：

- 多环境（dev/staging/prod）配置不同，手动改 YAML 容易漏
- 一次部署涉及 Deployment + Service + ConfigMap + Ingress，顺序和版本难管理
- 回滚只能靠 git revert + kubectl apply，缺少统一的版本概念
- 团队协作时，YAML 模板散落各处，缺少标准分发方式

Helm 就是 K8s 生态里最主流的包管理工具，解决的是"把一组相关 K8s 资源打包成可安装、可升级、可回滚的单元"。

<K8sDiagram kind="helm-lifecycle-chain" />

## 1. 核心概念：Chart、Release、Repository

### 1.1 Chart

Chart 是 Helm 的打包单元，本质是一个目录，包含：

```
mychart/
├── Chart.yaml          # Chart 元信息（名称、版本、描述）
├── values.yaml         # 默认配置值
├── templates/          # K8s 资源模板
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl    # 模板辅助函数
│   └── NOTES.txt       # 安装后提示信息
├── charts/             # 子 Chart（依赖）
└── templates/tests/    # 测试用 Pod
```

### 1.2 Release

每次 `helm install` 都会创建一个 Release：

- Release 是 Chart 的一次具体部署实例
- 同一个 Chart 可以安装多次，产生多个 Release
- 每个 Release 有独立的名字和版本历史

### 1.3 Repository

Chart 仓库是一个 HTTP 服务，存放打包好的 `.tgz` Chart 和索引文件：

```bash
# 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 搜索 Chart
helm search repo bitnami/nginx

# 更新仓库索引
helm repo update
```

常见公共仓库：Bitnami、Artifact Hub。私有仓库常用 Harbor、ChartMuseum 或 OCI Registry。

## 2. 模板引擎：values + Go template

### 2.1 values.yaml 是配置入口

```yaml
# values.yaml
replicaCount: 3
image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
```

### 2.2 模板里用 `{{ }}` 引用

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

### 2.3 多环境管理

```bash
# 用不同 values 文件覆盖默认值
helm install my-app ./mychart -f values-prod.yaml

# 命令行覆盖单个值
helm install my-app ./mychart --set replicaCount=5

# 优先级：--set > -f 文件 > values.yaml
```

## 3. 生命周期：install / upgrade / rollback / uninstall

### 3.1 安装

```bash
helm install my-release bitnami/nginx \
  -n my-namespace \
  --create-namespace \
  -f my-values.yaml
```

### 3.2 升级

```bash
# 升级到新版本或新配置
helm upgrade my-release bitnami/nginx \
  -n my-namespace \
  -f my-values.yaml

# 查看历史版本
helm history my-release -n my-namespace
```

每次 upgrade 都会创建一个新的 revision。

### 3.3 回滚

```bash
# 回滚到上一个版本
helm rollback my-release -n my-namespace

# 回滚到指定版本
helm rollback my-release 3 -n my-namespace
```

### 3.4 卸载

```bash
helm uninstall my-release -n my-namespace
```

默认会保留 Secret（存储 Release 历史），加 `--keep-history` 可以保留完整历史用于审计。

## 4. Chart 依赖管理

### 4.1 在 Chart.yaml 声明依赖

```yaml
# Chart.yaml
dependencies:
  - name: redis
    version: "17.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

### 4.2 依赖操作

```bash
# 下载依赖到 charts/ 目录
helm dependency update ./mychart

# 查看依赖树
helm dependency list ./mychart
```

### 4.3 子 Chart 的 values 传递

```yaml
# 父 Chart 的 values.yaml
redis:
  enabled: true
  architecture: standalone
  auth:
    password: "my-password"
```

父 Chart 通过 key 名（和依赖名一致）向子 Chart 传递 values。

## 5. Helm 与 Kustomize 的区别

| 维度 | Helm | Kustomize |
| --- | --- | --- |
| 核心思路 | 模板引擎 + 变量替换 | 基础 YAML + overlay patch |
| 打包分发 | Chart 仓库 | 无，依赖 Git |
| 版本管理 | Release + revision | 无内建版本概念 |
| 回滚 | `helm rollback` | 靠 git revert + kubectl apply |
| 学习成本 | Go template 语法 | 较低，纯 YAML |
| 适合场景 | 通用软件分发、复杂应用 | 团队内部多环境 overlay |

两者不互斥，很多团队用 Helm 打包 + Kustomize 做环境 overlay，或者用 ArgoCD 统一管理。

## 6. 常用排障命令

```bash
# 预览渲染结果（不实际安装）
helm template my-release ./mychart -f values-prod.yaml

# 试运行（检查权限和资源冲突）
helm install my-release ./mychart --dry-run --debug

# 查看已安装 Release 的 values
helm get values my-release -n my-namespace

# 查看已安装 Release 渲染出的 YAML
helm get manifest my-release -n my-namespace

# 查看 Release 状态
helm status my-release -n my-namespace

# 列出所有 Release
helm list -A
```

## 7. 最容易踩的坑

**坑 1：values 层级写错导致模板渲染空值**

Helm 不会在渲染时报"值不存在"的错，只会渲染成空字符串。用 `helm template` 预览是最好的检查手段。

**坑 2：upgrade 忘记带 values 文件**

`helm upgrade` 不会自动继承上次的 `-f` 文件，忘记带会导致配置回退到 `values.yaml` 默认值。加 `--reuse-values` 可以继承上次配置，但这也可能导致新增字段缺失。

**坑 3：把 Secret 明文写在 values.yaml 里提交到 Git**

Helm 本身不加密 values。敏感值应该通过 `--set` 从 CI/CD 变量注入，或者用 helm-secrets 插件加密。

**坑 4：Chart 版本和 appVersion 混淆**

- `version`：Chart 自身的版本，每次改模板或 values 都应该升
- `appVersion`：打包的应用版本，比如 nginx 1.25

**坑 5：Release 名字冲突**

同一个 namespace 下 Release 名必须唯一，跨 namespace 可以重名。

## 8. 面试答法

被问"为什么用 Helm"时：

1. **解决什么问题** — 把一组相关 K8s 资源打包成可安装、可升级、可回滚的单元，解决多环境配置和版本管理
2. **核心概念** — Chart 是包，Release 是一次安装实例，Repository 是分发渠道
3. **和 kubectl apply 的区别** — Helm 有版本历史和回滚，kubectl apply 只是"当前状态覆盖"
4. **和 Kustomize 的区别** — Helm 是模板 + 打包分发，Kustomize 是 overlay patch，两者互补

> Helm 解决的核心问题不是"怎么写 YAML"，而是"怎么把一组 YAML 当成一个整体来管理版本、配置和发布"。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [CRD、Operator 与扩展机制实战](./crd-operator-and-extension.md)
- [GitOps 与持续交付实战](./gitops-and-delivery.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
