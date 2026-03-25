---
title: CRD、Operator 与扩展机制实战
description: 系统讲清 CRD 定义与校验、Operator 模式、controller-runtime 核心概念、常见 Operator 案例，以及为什么"自定义资源"不等于"自定义控制器"。
---

# CRD、Operator 与扩展机制实战

K8s 内建的资源（Deployment、Service、ConfigMap）能覆盖大部分通用场景，但业务越复杂，越容易遇到几类问题：

- 数据库集群的主从切换、备份、恢复，Deployment 管不了
- 中间件的配置热更新、版本升级，靠手动 kubectl 不可控
- 团队想把自己的运维逻辑沉淀成平台能力，不想每次都写脚本

CRD + Operator 就是 K8s 提供的标准扩展路径：用 CRD 定义"你想管什么对象"，用 Operator 实现"这个对象怎么被管"。

<K8sDiagram kind="crd-operator-chain" />

## 1. CRD 是什么：给 K8s 加一种新对象

### 1.1 CRD 解决的问题

`CustomResourceDefinition` 让你在不改 K8s 源码的前提下，注册一种新的 API 资源。

注册完之后，这个资源就和内建资源一样：

- 能用 kubectl 创建、查看、删除
- 存在 etcd 里
- 有 namespace 和集群级别的区分
- 支持 RBAC 权限控制

### 1.2 一个最简 CRD 示例

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.app.example.com
spec:
  group: app.example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                engine:
                  type: string
                  enum: ["mysql", "postgresql"]
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 7
              required: ["engine", "replicas"]
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
    shortNames:
      - db
```

注册后就可以：

```bash
kubectl apply -f my-database.yaml   # 创建一个 Database 对象
kubectl get db                       # 用 shortName 查看
kubectl describe db my-db            # 查看详情
```

### 1.3 CRD 本身不包含任何逻辑

这是最容易混淆的一点：

- CRD 只是"API 注册"，告诉 apiserver "我有一种叫 Database 的对象"
- CRD 不会自动创建数据库实例，不会自动做主从切换
- 真正的逻辑需要一个控制器（Controller）来实现

> CRD 是名词定义，Controller 是动词执行。两者缺一不可。

## 2. Operator 模式：CRD + 自定义控制器

### 2.1 Operator 解决的问题

Operator 把"领域运维知识"编码成 K8s 控制器：

- **运维人员**知道数据库主从切换的步骤
- **Operator** 把这些步骤写成 reconcile 逻辑
- **K8s 控制循环**保证这些逻辑持续执行

所以 Operator 的标准定义是：

> Operator = CRD（自定义资源） + Controller（自定义控制器） + 领域运维逻辑

### 2.2 Operator 与普通控制器的区别

| 维度 | 内建控制器 | Operator |
| --- | --- | --- |
| 管理对象 | Deployment、ReplicaSet 等内建资源 | 自定义资源（CRD） |
| 运维逻辑 | 通用（副本数、滚动更新） | 领域特定（备份、切主、升级） |
| 谁来写 | K8s 社区 | 业务团队或中间件团队 |
| 交付方式 | 内建于 controller-manager | 独立部署为 Pod |

### 2.3 Operator 的 reconcile 循环

核心思路和内建控制器完全一样：

1. Watch CRD 对象的变化
2. 比较期望状态和实际状态
3. 执行动作让实际状态趋近期望状态
4. 更新 status 子资源
5. 循环

```
用户创建 Database CR
       ↓
Operator Watch 到事件
       ↓
读取 CR spec（engine=mysql, replicas=3）
       ↓
检查实际状态（当前 0 个实例）
       ↓
创建 StatefulSet + Service + ConfigMap
       ↓
等待 Pod Ready
       ↓
配置主从复制
       ↓
更新 CR status（phase=Running, master=db-0）
```

## 3. controller-runtime 核心概念

大部分 Go 语言 Operator 基于 [controller-runtime](https://github.com/kubernetes-sigs/controller-runtime) 构建，它是 Kubebuilder 和 Operator SDK 的底层框架。

### 3.1 核心组件

| 组件 | 职责 |
| --- | --- |
| **Manager** | 管理所有 Controller 的生命周期，负责启动、选主、健康检查 |
| **Controller** | 绑定一个 reconcile 函数到一种资源 |
| **Reconciler** | 用户实现的核心逻辑，接收一个 Request（name + namespace），返回 Result |
| **Client** | 对 apiserver 的封装，用来 Get/List/Create/Update/Delete 资源 |
| **Cache** | 基于 Informer 的本地缓存，减少对 apiserver 的直接请求 |

### 3.2 Reconciler 的标准写法

```go
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. 获取 CR
    var db appv1.Database
    if err := r.Get(ctx, req.NamespacedName, &db); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // 2. 检查是否正在删除
    if !db.DeletionTimestamp.IsZero() {
        // 执行清理逻辑
        return ctrl.Result{}, r.handleDeletion(ctx, &db)
    }

    // 3. 确保 finalizer
    if !controllerutil.ContainsFinalizer(&db, "app.example.com/cleanup") {
        controllerutil.AddFinalizer(&db, "app.example.com/cleanup")
        return ctrl.Result{}, r.Update(ctx, &db)
    }

    // 4. 核心 reconcile：确保实际状态匹配期望
    if err := r.ensureStatefulSet(ctx, &db); err != nil {
        return ctrl.Result{}, err
    }

    // 5. 更新 status
    db.Status.Phase = "Running"
    return ctrl.Result{}, r.Status().Update(ctx, &db)
}
```

### 3.3 关键设计原则

- **幂等性**：同一个 Reconcile 调用多次，结果应该一样
- **level-triggered**：不依赖事件顺序，只看当前状态和期望状态的差距
- **不要在 Reconcile 里做长时间阻塞操作**：用 `RequeueAfter` 代替 sleep
- **用 status 子资源反映真实状态**：让用户能通过 `kubectl get` 了解进度

## 4. CRD 进阶能力

### 4.1 校验

除了 OpenAPI v3 Schema 的基础校验，还可以用：

- **CEL 校验规则**（K8s 1.25+）：在 CRD 定义里直接写验证表达式
- **Validating Webhook**：自定义 HTTP 服务做更复杂的校验

```yaml
# CEL 校验示例
x-kubernetes-validations:
  - rule: "self.replicas <= 7"
    message: "replicas must be <= 7"
  - rule: "self.engine == oldSelf.engine"
    message: "engine is immutable once set"
```

### 4.2 版本管理

CRD 支持多版本（v1alpha1 → v1beta1 → v1），通过 Conversion Webhook 做版本转换。

### 4.3 Printer Columns

让 `kubectl get` 显示自定义列：

```yaml
additionalPrinterColumns:
  - name: Engine
    type: string
    jsonPath: .spec.engine
  - name: Replicas
    type: integer
    jsonPath: .spec.replicas
  - name: Phase
    type: string
    jsonPath: .status.phase
  - name: Age
    type: date
    jsonPath: .metadata.creationTimestamp
```

### 4.4 Status 子资源

启用后 spec 和 status 走不同的 API 路径，RBAC 可以分开控制：

```yaml
subresources:
  status: {}
```

## 5. 开发 Operator 的常用工具

| 工具 | 特点 |
| --- | --- |
| **Kubebuilder** | 官方推荐，生成项目脚手架，基于 controller-runtime |
| **Operator SDK** | Red Hat 维护，支持 Go / Ansible / Helm 三种方式 |
| **Helm Operator** | 用 Helm Chart 实现简单 Operator，不需要写代码 |
| **KUDO** | 声明式 Operator 开发，通过 YAML 定义生命周期步骤 |

对于 Go 开发者，推荐路径是：**Kubebuilder 脚手架 + controller-runtime 手写逻辑**。

## 6. 常见 Operator 案例

| Operator | 管理对象 | 核心能力 |
| --- | --- | --- |
| **prometheus-operator** | Prometheus、AlertManager | 自动发现 ServiceMonitor、管理告警规则 |
| **cert-manager** | Certificate、Issuer | 自动申请和续期 TLS 证书 |
| **mysql-operator** | MySQLCluster | 主从搭建、自动故障切换、备份恢复 |
| **strimzi** | Kafka | Kafka 集群管理、Topic 管理、用户认证 |
| **crossplane** | 云资源 | 用 K8s API 管理云厂商资源（RDS、S3） |
| **ArgoCD** | Application | GitOps 持续交付 |

## 7. 最容易踩的坑

**坑 1：CRD 注册了但没有控制器**

创建了 CR 对象但什么也不会发生。CRD 只是注册 API，不包含任何执行逻辑。

**坑 2：Reconcile 不是幂等的**

如果 Reconcile 每次执行都创建新资源而不检查已存在的，会导致资源无限增长。

**坑 3：忘记处理删除（finalizer）**

如果 Operator 创建了外部资源（数据库、云盘），不加 finalizer 的话，CR 被删除时外部资源会残留。

**坑 4：没用 status 子资源**

直接更新整个 CR 对象可能覆盖 spec 变更，应该用 `Status().Update()` 单独更新 status。

**坑 5：Watch 范围太大**

不加 namespace filter 的 Watch 会消耗大量 apiserver 资源，多租户场景下尤其明显。

## 8. 面试答法

被问"CRD 和 Operator 是什么"时，一套回答模板：

1. **CRD 是什么** — 让 K8s 支持自定义资源类型，注册后和内建资源一样用 kubectl 操作、存在 etcd、受 RBAC 管控
2. **Operator 是什么** — CRD + 自定义控制器 + 领域运维逻辑，把运维知识编码成自动化的 reconcile 循环
3. **Reconcile 怎么工作** — Watch 资源变化，比较期望和实际状态，执行动作拉齐，更新 status
4. **和内建控制器的关系** — 思路完全一致（声明式 + 控制循环），只是管理的是自定义资源而非内建资源

> CRD 解决"K8s 能认识什么对象"，Operator 解决"这个对象该怎么运维"。两者合在一起，就是 K8s 的标准扩展范式。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [删除、Finalizers 与 Terminating 边界实战](./deletion-finalizers-and-terminating-boundaries.md)
- [控制面主线实战](./control-plane-mainline.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Helm 与包管理实战](./helm-and-package-management.md)
- [GitOps 与持续交付实战](./gitops-and-delivery.md)
