---
title: RBAC 实战与最小权限设计
description: 系统讲清 Kubernetes 中 Role、ClusterRole、RoleBinding、ClusterRoleBinding、resourceNames、subresource、serviceaccounts/token、bind、escalate、impersonate 与最小权限设计边界。
---

# RBAC 实战与最小权限设计

很多人讲 Kubernetes 权限控制时，会先背四个对象：

- `Role`
- `ClusterRole`
- `RoleBinding`
- `ClusterRoleBinding`

但一到真实场景就容易乱：

- 为什么 `RoleBinding` 绑定 `ClusterRole` 后，权限还是只在 namespace 里生效
- 为什么只给了 `list secrets`，风险也一样很大
- 为什么有的人明明没有管理员权限，却还能通过 `bind`、`escalate`、`impersonate` 把事情搞得很危险
- 为什么给工作负载“读一点集群信息”最后常常会越给越大

这条线真正要讲清的是：

> RBAC 不是“把对象名字背下来”就结束，而是要围绕“谁、在哪个作用域、对什么资源、做什么动作”来设计权限边界。真正稳的设计目标不是“先跑通”，而是“最小权限、可验证、可审计、难升级成更高权限”。

<K8sDiagram kind="rbac-evaluation-chain" />

## 1. 先回答：RBAC 到底控制什么

RBAC 控制的是：

- 谁
- 对哪些 API 资源
- 在什么范围里
- 能执行哪些动作

更具体一点，就是围绕这些请求属性做授权判断：

- 身份是谁
- 动作是 `get`、`list`、`watch`、`create`、`update` 还是别的 verb
- 资源是什么
- 在哪个 API group
- 是不是某个 subresource
- 有没有 namespace
- 是否限定到某个具体名字

一句话记住：

> RBAC 解决的是 API 权限，不解决网络连通，不解决请求内容合不合规，也不替你做业务级鉴权。

## 2. 四个对象到底怎么分

先用最稳的表来记：

| 对象 | 解决什么 | 关键边界 |
| --- | --- | --- |
| `Role` | 定义 namespace 内权限规则 | 只能描述命名空间作用域资源 |
| `ClusterRole` | 定义集群级或可复用权限规则 | 可描述集群级资源，也可被 namespace 复用 |
| `RoleBinding` | 在某个 namespace 内把规则绑给主体 | 作用域仍是当前 namespace |
| `ClusterRoleBinding` | 在整个集群范围把规则绑给主体 | 影响全局 |

最常见的误区是：

- 以为 `ClusterRole` 一旦被绑定，就天然是全局权限

其实不是。

### 2.1 `RoleBinding` 绑定 `ClusterRole` 时，到底发生什么

官方 RBAC 文档明确说：

- `RoleBinding` 可以引用 `ClusterRole`
- 但绑定后的生效范围仍然是 `RoleBinding` 所在 namespace

所以更准确的说法是：

- `ClusterRole` 不只是一种“集群级权限对象”
- 它也可以是一份可复用的权限模板

一句话记住：

> 决定最终作用域的，不只是规则定义对象，更关键的是绑定对象。

### 2.2 `ClusterRoleBinding` 什么时候才应该上

只有当你真的需要：

- 跨 namespace
- 或集群级资源
- 或对所有 namespace 生效

才应该考虑 `ClusterRoleBinding`。

否则优先级更稳的通常是：

- `RoleBinding`

## 3. verbs 为什么不能只背 `get/list/watch`

很多人把 verb 理解得太粗，结果权限一放就放大了。

### 3.1 常见资源 verbs

最常见的包括：

- `get`
- `list`
- `watch`
- `create`
- `update`
- `patch`
- `delete`
- `deletecollection`

### 3.2 `get`、`list`、`watch` 的风险边界

官方授权文档专门提醒：

- `get`
- `list`
- `watch`

都可能返回资源完整内容。

也就是说：

- 如果资源是 `Secret`
- 那 `list secrets` 和 `watch secrets`

本质上一样能看到敏感数据。

这也是很多权限设计里最容易低估的地方：

> 在敏感资源上，“只给 list/watch 不给 get”通常不是什么真正的降权。

### 3.3 特殊 verbs 更危险

Kubernetes 里还有一些更敏感的特殊 verb：

- `bind`
- `escalate`
- `impersonate`

这些不能当成普通读写权限看。

后面会单独讲。

## 4. resources、subresources、API groups 为什么要一起看

如果只写资源名，不看 subresource，经常会权限不对或放大。

### 4.1 resource 和 subresource 不是一回事

比如：

- `pods`
- `pods/log`
- `pods/exec`
- `deployments/scale`

它们不是同一个权限点。

所以你不能想当然地以为：

- 能读 `pods`
- 就等于能拿日志、能 exec、能扩缩容

### 4.2 API group 也不能省略理解

比如：

- core API group 里的 `pods`、`secrets`
- `apps` 里的 `deployments`
- `rbac.authorization.k8s.io` 里的 `roles`

它们属于不同组。

设计 RBAC 时，真正要看的不是一句“给他 deployment 权限”，而是：

- 哪个 API group
- 哪个资源
- 哪个 subresource
- 哪个 verb

## 5. `resourceNames` 为什么看起来很细，实际也有边界

`resourceNames` 的价值是：

- 只让主体操作指定名字的资源

这在下面这些场景里很有用：

- 只允许读某一个 `ConfigMap`
- 只允许 patch 某一个 `Lease`

但官方文档也明确指出了边界：

- 对于 `list` / `watch`
- 如果要和 `resourceNames` 一起工作
- 客户端还得带对应 field selector

这意味着：

- 它不是一个“天然万能的细粒度过滤器”

更实用的理解是：

- 它更适合 `get/update/patch/delete` 这类指定单对象动作

## 6. 一套比较稳的最小权限思路

官方 RBAC good practices 文档最核心的原则其实就一句：

- least privilege

但工程上要把它落下来，至少要做这些：

### 6.1 先按工作负载和职责拆身份

不要：

- 所有 Pod 共用一个 ServiceAccount

要：

- 一个职责一份身份

### 6.2 优先从 namespace 内最小闭环开始

优先考虑：

- `Role`
- `RoleBinding`

只有确实需要时再上：

- `ClusterRole`
- `ClusterRoleBinding`

### 6.3 先给读，再评估写

而且读也要拆：

- 是否真的需要 `list/watch`
- 是否会读到敏感数据

### 6.4 避免通配符

像这样最容易留下后门：

- `resources: ["*"]`
- `verbs: ["*"]`

因为未来新资源、新 subresource 出来后，这种规则会自动把它们也一起放进去。

### 6.5 不要轻易碰高危权限

尤其是这些：

- `secrets`
- `roles`
- `clusterroles`
- `rolebindings`
- `clusterrolebindings`
- `serviceaccounts/token`
- `pods/exec`
- `pods/attach`
- `nodes/proxy`

这些权限里很多都可能形成：

- 凭证读取
- 横向移动
- 权限提升

## 7. YAML 到底应该怎么写才算稳

### 7.1 namespace 内只读 Pod 的最小例子

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: prod
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-reader-binding
  namespace: prod
subjects:
  - kind: ServiceAccount
    name: app-reader
    namespace: prod
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
```

这段配置表达的是：

- `app-reader` 只能在 `prod` namespace 内读 Pod
- 不代表它能读其他 namespace
- 也不代表它能看日志、exec 或操作 Deployment

### 7.2 用 `RoleBinding` 复用 `ClusterRole` 的例子

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: configmap-reader
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: configmap-reader-binding
  namespace: prod
subjects:
  - kind: ServiceAccount
    name: api
    namespace: prod
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: configmap-reader
```

这段配置表达的是：

- 规则定义放在 `ClusterRole`
- 但权限仍然只在 `prod` 生效

## 8. `kubectl auth can-i` 为什么很重要

官方文档推荐的最直接检查方式就是：

- `kubectl auth can-i`

它的价值不是替你设计权限，而是：

- 让你快速验证当前授权判断结果

例如：

```bash
kubectl auth can-i list pods -n prod --as system:serviceaccount:prod:api
kubectl auth can-i get secrets -n prod --as system:serviceaccount:prod:api
kubectl auth can-i create serviceaccounts/token -n prod --as system:serviceaccount:prod:api
```

这类检查特别适合：

- 发版前验证
- 线上排障时确认到底是认证失败还是授权失败

## 9. 进阶风险：`bind`、`escalate`、`impersonate`

这部分是 RBAC 真正容易被忽略的深水区。

<K8sDiagram kind="rbac-binding-boundary-map" />

### 9.1 `bind`

官方 RBAC 文档说明：

- 如果你想创建或更新一个绑定，把某个 Role / ClusterRole 绑给别人
- 你通常需要自己已经拥有那个角色里的权限
- 或者拥有对该角色执行 `bind` 的能力

这意味着：

- `bind` 本质上是“把某份权限发给别人”的能力

### 9.2 `escalate`

官方文档也明确说：

- 如果你想创建或更新一个包含更高权限的 Role / ClusterRole
- 你通常需要自己已经拥有那些权限
- 或者拥有 `escalate`

这意味着：

- `escalate` 本质上是“定义更高权限规则”的能力

### 9.3 `impersonate`

授权文档里也把它列为特殊 verb。

它解决的是：

- 以另一个 user / group / serviceaccount 的身份发请求

这类权限有它的运维价值，但风险也很直接：

- 你可以借别人的身份去试权限边界

如果再叠加高权限目标身份，风险会更大。

### 9.4 `serviceaccounts/token`

这是最近越来越该重视的一点。

如果某个主体拥有：

- 对 `serviceaccounts/token` 的 `create`

那它就可以为现有 `ServiceAccount` 申请 token。

这也是为什么：

- `serviceaccounts/token`

不该被当成普通写权限随手发出去。

## 10. 最常见的坑

### 坑 1：所有权限都做成 `ClusterRoleBinding`

结果通常是：

- 明明只想给某个 namespace 的能力
- 最后发成了全集群能力

### 坑 2：把 `ClusterRole` 和“全局生效”画等号

真正决定最终作用域的，还有绑定对象。

### 坑 3：低估 `list/watch secrets` 的风险

这两者在敏感数据暴露面上，和 `get secrets` 没本质安全差异。

### 坑 4：图省事直接上通配符

短期省事，长期最容易给未来资源和子资源自动放权。

### 坑 5：把认证失败、授权失败、准入失败混成一句“没权限”

真正排障时至少要拆三层：

- 身份对不对
- RBAC 放没放
- Admission 有没有拦

### 坑 6：忽略高危权限的组合效应

例如：

- 读 `secrets`
- `pods/exec`
- `bind`
- `escalate`
- `impersonate`
- `serviceaccounts/token`

这几类权限一旦组合起来，风险通常远大于单独看某一条规则。

## 11. 排障时建议按这条顺序看

如果一个请求被拒绝，建议按这条顺序排：

1. 先确认请求到底是谁发的，是 user、group 还是 `ServiceAccount`
2. 再确认动作是哪个 verb，资源是否带 subresource
3. 再看它发生在哪个 namespace，还是集群级资源
4. 再检查是通过 `RoleBinding` 还是 `ClusterRoleBinding` 获得权限
5. 如果看起来“明明绑了角色还是不行”，优先检查是否把 `ClusterRole` 误当成了全集群生效
6. 如果是敏感资源，再反过来审视这条权限是不是已经放得过大

## 12. 面试里怎么把这题答顺

如果面试官问：

> `Role`、`ClusterRole`、`RoleBinding`、`ClusterRoleBinding` 怎么区分？最小权限怎么做？

可以这样答：

> `Role` 定义 namespace 内规则，`ClusterRole` 定义集群级规则或可复用规则模板；  
> `RoleBinding` 只在当前 namespace 生效，哪怕它引用的是 `ClusterRole`；  
> `ClusterRoleBinding` 才是全集群生效。  
> 做最小权限时，我会先按职责拆 `ServiceAccount`，优先用 namespace 内的 `Role + RoleBinding`，只在必要时才上集群级绑定；  
> 同时避免 `*` 通配符，谨慎授予 `secrets`、`pods/exec`、`serviceaccounts/token`、`bind`、`escalate`、`impersonate` 这类高危权限，并用 `kubectl auth can-i` 验证结果。  

## 13. 最后记住这句话

> RBAC 设计最怕的不是“少给了一点权限”，而是“为了省事把作用域、资源和 verb 混着放大”。先把身份、作用域、资源、动作四层拆开，最小权限才真正站得住。

## 关联阅读

- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [控制面主线实战](./control-plane-mainline.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
