---
title: Admission、策略治理与 Policy Engine 边界实战
description: 系统讲清 Kubernetes 中内建 Admission Controllers、MutatingAdmissionWebhook、ValidatingAdmissionWebhook、ValidatingAdmissionPolicy、Pod Security Admission、OPA Gatekeeper、Kyverno 的职责边界、执行顺序与工程落地取舍。
---

# Admission、策略治理与 Policy Engine 边界实战

很多团队开始做 Kubernetes 治理时，最容易遇到一类问题：

- 为什么 RBAC 都放过了，请求还是被拒绝
- 为什么有的策略能自动补字段，有的只能拦
- 为什么 Pod Security Admission、ValidatingAdmissionPolicy、Gatekeeper、Kyverno 都像是在“拦 YAML”
- 这些能力到底谁更底层，谁更适合平台治理

如果这几层不拆开，最后就会出现两种常见结果：

- 能力选型全靠印象
- 一出问题就只会说“Admission 把它拦了”

这条线真正要讲清的是：

> Admission 是 API 请求在认证和授权之后、真正写入存储之前的最后一道治理入口。内建 admission plugins 解决平台级通用治理，webhook 和 policy engine 解决可扩展策略，ValidatingAdmissionPolicy 解决内建声明式校验。真正稳的做法不是“工具越多越好”，而是先分清哪一层在变更对象，哪一层只做验证，哪一层需要额外运行控制器和运维成本。

<K8sDiagram kind="admission-policy-chain" />

## 1. 先把 Admission 放回 API 请求主线里

Kubernetes API 请求至少要过三层：

1. 认证：你是谁
2. 授权：你能不能做这个动作
3. 准入：就算你能做，这个对象内容本身允不允许、要不要被默认改写

所以最实用的一句话是：

> RBAC 管“你有没有资格”，Admission 管“这次提交的对象长得合不合规”。

这也是为什么一个请求会出现这种现象：

- 认证没问题
- RBAC 也放行
- 但对象还是被拒绝

因为 Admission 看的不是身份，而是：

- 对象内容
- 请求上下文
- 以及策略是否要求修改或拒绝

## 2. 内建 Admission Controllers 到底解决什么

官方文档说明：

- Admission controllers 编译进 `kube-apiserver`
- 只能由集群管理员配置

也就是说，它们是：

- 控制面内建能力
- 不是后面随便起个 Pod 就等价替代的东西

### 2.1 最常见的几类内建治理器

真正最常碰到的不是完整列表，而是这些高频角色：

- `NamespaceLifecycle`
- `ServiceAccount`
- `LimitRanger`
- `ResourceQuota`
- `PodSecurity`
- `MutatingAdmissionWebhook`
- `ValidatingAdmissionWebhook`
- `ValidatingAdmissionPolicy`

可以先这样记：

| 能力 | 更像什么 |
| --- | --- |
| `ServiceAccount` | 默认补身份相关字段 |
| `LimitRanger` | 单对象资源边界和默认值 |
| `ResourceQuota` | namespace 总预算控制 |
| `PodSecurity` | 按安全标准做内建安全门禁 |
| webhook / policy | 可扩展治理入口 |

### 2.2 为什么很多资源问题其实卡在 Admission，不是调度

例如：

- `LimitRanger`
- `ResourceQuota`

都发生在准入阶段。

这意味着一个 Pod：

- 可能还没进入 scheduler
- 就已经在 API 入口被 403 或拒绝

这也是之前那些专题一再强调的点：

- 不是所有“创建失败”都该先看调度器

## 3. Admission 的两阶段：Mutating 和 Validating

官方文档明确说：

- mutating admission controllers 先运行
- validating admission controllers 后运行

所以标准答法应该先分两类：

- **Mutating**：可以改对象
- **Validating**：只能判断放不放行

### 3.1 Mutating 更像“默认注入 / 自动修正”

典型场景：

- 注入 sidecar
- 自动补标签、注解
- 补默认安全字段
- 给工作负载加平台约束

### 3.2 Validating 更像“守门”

典型场景：

- 禁止使用 `:latest`
- 禁止特权容器
- 限制镜像来源
- 校验资源规格、命名规范、标签规范

一句话记住：

> 能改的是 mutating，最终拍板的是 validating。

## 4. Dynamic Admission Webhook 到底是什么，为什么它既强大又危险

官方 Dynamic Admission Control 文档里把它说得很直接：

- webhook 是运行在 API server 外部的扩展
- 通过 HTTP 回调参与 admission

这意味着它的价值很明显：

- 扩展性强
- 能做复杂逻辑
- 能接外部策略系统

但代价也很直接：

- 有额外控制器要运维
- 会增加 API 请求链路延迟
- webhook 不可用可能直接影响整个集群创建和更新请求

### 4.1 MutatingAdmissionWebhook 的工程边界

官方 good practices 文档特别强调：

- 不要依赖 mutating webhook 的执行顺序
- 整体上要保证幂等
- 尽量 fail open，再用 validating 检查最终状态

这句话非常关键：

> mutating 适合“补”，但不适合承担最终安全拍板。

### 4.2 ValidatingAdmissionWebhook 的工程边界

官方文档也强调：

- 如果策略要基于对象最终状态做判断
- 更适合放到 validating 侧

所以最稳的设计通常是：

- mutating 只做必要补丁
- validating 做最终约束校验

### 4.3 Webhook 设计里最容易踩的坑

官方 good practices 给了几个高频建议：

- `timeout` 要小
- backend 要高可用
- 避免自触发
- 不要依赖执行顺序
- 不要改 immutable 对象
- 升级前要做兼容测试

这些看起来像运维细节，但本质都在回答一个问题：

- 这个 webhook 会不会把 API server 入口变成新单点

## 5. ValidatingAdmissionPolicy 为什么越来越值得优先考虑

官方 Validating Admission Policy 文档说明：

- 它允许把声明式校验逻辑直接内嵌到 API 里
- 不依赖外部 HTTP callout

这句话非常关键。

因为它意味着：

- 不用自己养一个 validating webhook 服务
- 少一跳网络调用
- 少一套证书、可用性和超时问题

### 5.1 它更适合什么场景

最适合的是：

- 规则是“只校验，不改对象”
- 规则可以用 CEL 表达
- 不需要复杂外部依赖

典型例子：

- label 是否存在
- replicas 是否超范围
- 镜像 tag 是否满足规范
- 某字段之间的组合约束是否合法

### 5.2 它不适合什么场景

不适合的是：

- 需要 mutation
- 需要复杂外部数据
- 需要很重的策略语言和策略复用体系

一句话记住：

> 只做校验、又能用 CEL 说清的规则，优先考虑 ValidatingAdmissionPolicy，而不是先上 webhook。

### 5.3 一个比较稳的 VAP 骨架

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: deployment-replicas-limit
spec:
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
      - apiGroups: ["apps"]
        apiVersions: ["v1"]
        operations: ["CREATE", "UPDATE"]
        resources: ["deployments"]
  validations:
    - expression: "object.spec.replicas <= 20"
      message: "deployment replicas must be <= 20"
---
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicyBinding
metadata:
  name: deployment-replicas-limit-binding
spec:
  policyName: deployment-replicas-limit
  validationActions: [Deny]
```

这段配置表达的是：

- 这是一条内建 validating policy
- 它只校验 Deployment
- 规则是副本数不能超过 20
- 不需要外部 webhook 服务

## 6. Pod Security Admission 在这条线里处于什么位置

这也是最常被讲混的点之一。

Pod Security Admission：

- 是 Kubernetes 内建 admission controller
- 专门针对 Pod Security Standards 做准入治理

它不是：

- 通用策略引擎
- 也不是任意资源的规则平台

所以更稳的理解是：

- Pod Security Admission 解决“Pod 安全标准”这一类通用安全门禁
- 不是替代所有 admission 策略工具

## 7. Gatekeeper 和 Kyverno 到底各自更像什么

这两个名字经常一起出现，但定位并不完全一样。

<K8sDiagram kind="policy-engine-boundary-map" />

### 7.1 Gatekeeper

官方 Gatekeeper 文档说明：

- 它是 validating 和 mutating webhook
- 基于 OPA 执行 CRD 化策略
- 还有 audit 功能

它的典型心智模型是：

- 用 `ConstraintTemplate` 定义策略模板
- 用 `Constraint` 实例化规则
- admission 时拦请求
- audit 时扫现有资源

它更适合：

- 已经熟悉 OPA / Rego
- 想做强约束、模板化策略治理
- 需要对现存资源做一致性审计

### 7.2 Kyverno

官方 Kyverno 文档说明：

- 它作为 dynamic admission controller 运行
- 会接收 validating 和 mutating admission 回调
- 还有额外控制器做 runtime scans

Kyverno 的典型特点是：

- 策略更贴近 Kubernetes 资源写法
- 不只 validate / mutate
- 还支持 generate、报告、后台扫描等治理能力

它更适合：

- 围绕 K8s 资源原生语义做策略
- 想把 admission 和后台治理、报告放在一套体系里

### 7.3 两者和 VAP 的关系

最稳的选型顺序不是：

- 谁更流行就选谁

而是：

1. 这条规则是不是内建 admission plugin 就能解决
2. 如果只是 validating，能不能用 VAP + CEL 解决
3. 如果要复杂策略、mutation、审计、生成、背景治理，再考虑 Gatekeeper / Kyverno

## 8. 一个比较稳的选型顺序

生产上更推荐这样的优先级：

### 8.1 能用内建的，先用内建的

例如：

- `LimitRanger`
- `ResourceQuota`
- `PodSecurity`

原因是：

- 成本最低
- 行为最稳定
- 和控制面集成最好

### 8.2 只做声明式校验，优先考虑 VAP

如果规则是：

- 纯 validating
- CEL 就能写清

那通常优先 VAP。

### 8.3 真要扩展，才上 webhook / policy engine

当你需要：

- mutation
- 背景审计
- 策略模板复用
- 外部数据
- 生成资源

再考虑：

- Gatekeeper
- Kyverno
- 或自定义 webhook

## 9. 最常见的坑

### 坑 1：把 Admission 当 RBAC

Admission 管对象内容，不管身份有没有权限。

### 坑 2：什么都上自定义 webhook

很多规则其实：

- 内建 plugin 已经够用
- 或 VAP 已经够用

没必要先给自己加一套高可用和证书维护负担。

### 坑 3：让 mutating webhook 承担最终安全判断

官方 good practices 已经明确建议：

- fail open
- validate final state

也就是说最终兜底更适合在 validating 侧。

### 坑 4：依赖 mutating webhook 顺序

顺序不稳定，这是设计层面的坑，不是偶发现象。

### 坑 5：webhook timeout 太长，或高可用没做好

最后会变成：

- 集群 API 请求普遍变慢
- webhook 挂了，整个创建更新链路都受影响

### 坑 6：把 Gatekeeper / Kyverno 写成“安全银弹”

它们都是 admission / policy engine，不会自动替你：

- 修镜像
- 修应用
- 修组织治理流程

## 10. 排障时建议按这条顺序看

如果一个对象“明明有权限却创建失败”，建议按这条顺序排：

1. 先确认是不是认证或 RBAC 问题，而不是先喊 admission
2. 再看是不是内建 admission plugin 拒绝，例如 `ResourceQuota`、`PodSecurity`
3. 如果用了 VAP，检查对应 `ValidatingAdmissionPolicy` 和 binding 是否匹配到这个请求
4. 如果用了 webhook，看 `MutatingWebhookConfiguration` / `ValidatingWebhookConfiguration`、超时、`failurePolicy` 和后端健康
5. 如果用了 Gatekeeper / Kyverno，再回头看具体 policy、audit / reports 和控制器状态
6. 最后再反问设计：这条规则是不是本来就该用更低成本的实现方式

## 11. 面试里怎么把这题答顺

如果面试官问：

> Admission Controller、ValidatingAdmissionPolicy、Gatekeeper、Kyverno 怎么选？

可以这样答：

> 我会先把 Admission 放回 API 请求链路里，它发生在认证和授权之后、对象真正写入前。  
> 内建 admission plugins 适合通用平台治理，比如 `LimitRanger`、`ResourceQuota`、`PodSecurity`；  
> 如果只是做 validating，而且规则能用 CEL 表达，我会优先考虑 `ValidatingAdmissionPolicy`，因为它不需要额外跑 webhook 服务；  
> 如果需要 mutation、背景审计、策略模板化、生成资源或更复杂策略体系，再考虑 Gatekeeper、Kyverno 或自定义 webhook。  
> 同时工程上会特别注意 mutating 和 validating 的职责分离、webhook 的 timeout / failurePolicy / 高可用，以及不要依赖 mutating 顺序。  

## 12. 最后记住这句话

> Admission 治理最怕的不是“少一条规则”，而是“明明只需要内建校验，却先上了一整套 webhook 平台”。先分清内建能力、声明式 validating、外部 policy engine 三层，再决定工具，治理成本和稳定性才会一起收住。

## 关联阅读

- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [控制面主线实战](./control-plane-mainline.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
