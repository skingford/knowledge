---
title: API 审计、Audit Policy 与审计日志边界实战
description: 系统讲清 Kubernetes 中 API Audit 的执行位置、Audit Event、Audit Policy、规则匹配顺序、审计级别、阶段、log 与 webhook backend、admission webhook audit annotations、审计日志与 Event 的边界，以及为什么审计是证据链而不是准入门禁。
---

# API 审计、Audit Policy 与审计日志边界实战

很多团队提到 Kubernetes 审计时，常见回答就两句：

- 开 audit log
- 关键操作打到 SIEM

这当然不算错，但还是太浅。

真实生产里更常见的问题其实是：

- Audit 到底发生在 `kube-apiserver` 哪一层
- 审计和 Admission、RBAC、Event 到底什么关系
- `Metadata`、`Request`、`RequestResponse` 到底该怎么选
- 为什么 `watch` 请求会看到 `ResponseStarted`
- 为什么给 `secrets` 打 `RequestResponse` 反而可能制造二次泄露
- log backend 和 webhook backend 到底怎么选
- Admission webhook 的 mutation 细节为什么能出现在 audit 里

这条线真正要讲清的是：

> Kubernetes 审计不是“顺手打一份日志”，而是 `kube-apiserver` 在请求执行各阶段生成的一组安全事件。它回答的是“谁、什么时候、从哪里、对哪个资源做了什么”，不是“该不该放行”。

<K8sDiagram kind="api-audit-event-chain" />

## 1. 先回答：Audit 到底解决什么，不解决什么

更稳的回答方式是先拆三层：

1. **认证与授权**：解决“你是谁、你能不能做”
2. **准入控制**：解决“这个对象能不能进集群”
3. **审计**：解决“这次请求发生了什么、落下什么证据”

所以一句话记住：

> Audit 是证据链，不是门禁；Admission 是门禁，不是证据链。把这两层混了，整个安全治理口径就会乱。

Kubernetes 官方审计文档明确说：

- audit records begin their lifecycle inside `kube-apiserver`
- 每个请求在执行的不同 stage 上生成 audit event
- 后面再按 policy 过滤、再写到 backend

也就是说：

- 审计不是 `etcd` 做的
- 不是 `kubelet` 做的
- 也不是日志代理补出来的

它从一开始就是 API 请求链路的一部分。

## 2. Audit Event 到底长在哪条请求链路上

Kubernetes 官方文档给出的顺序很清楚：

- request 进入 `kube-apiserver`
- audit handler 在各阶段生成 event
- event 经过 audit policy 过滤
- 最后写到 log 或 webhook backend

更稳的心智模型是：

> 审计和认证、授权、准入都围绕同一个 API 请求发生，但它关注的是“把证据留下来”，不是“替你做访问控制决策”。

这也是为什么生产里要特别分清：

- 请求被拒绝了，也仍然可能有 audit 记录
- 请求成功了，不代表 audit 就一定记录了全部请求体
- 要看最终命中的 audit policy level 和 stage

## 3. Audit 的 stages 到底怎么理解

Kubernetes 官方审计文档定义了 4 个 stage：

- `RequestReceived`
- `ResponseStarted`
- `ResponseComplete`
- `Panic`

### 3.1 最容易被答错的是 `ResponseStarted`

官方文档明确说：

- `ResponseStarted` 只会给**长时间运行的请求**生成，例如 `watch`

这意味着：

- 普通 `get/list/create/update/delete` 请求，通常不会让你看到 `ResponseStarted`
- 如果你在分析 watch 流量、exec、proxy 这类长连接请求，才更容易碰到它

### 3.2 为什么很多团队喜欢全局省掉 `RequestReceived`

官方示例 policy 里就给出了：

- 在 policy 级别 `omitStages: ["RequestReceived"]`

原因很直接：

- 这个 stage 最早出现
- 流量大时会额外放大事件量
- 对很多分析场景来说，`ResponseComplete` 已经足够

所以生产里更稳的做法通常是：

- 默认全局省掉 `RequestReceived`
- 只有在少量高价值规则里才考虑保留

## 4. Audit levels 到底该怎么选

官方文档定义了四个 level：

- `None`
- `Metadata`
- `Request`
- `RequestResponse`

### 4.1 `Metadata` 为什么常常是默认主力

因为它记录：

- 用户
- 时间
- verb
- resource
- namespace
- source IP

但不带 request/response body。

这通常已经足够回答：

- 谁删了某个 Deployment
- 谁改了某个 RoleBinding
- 谁在某个时间段频繁访问某个 API

而且对性能、存储和敏感信息泄露的压力更小。

### 4.2 `Request` 和 `RequestResponse` 真正的风险是什么

官方文档明确说：

- `Request` 会记录请求体
- `RequestResponse` 会记录请求体和响应体

这也是生产里最容易犯的大错：

- 把高等级 audit 打到 `secrets`
- 或者打到带 token、证书、补丁内容的高敏对象

这样做的结果通常是：

- 审计日志本身变成新的敏感数据仓库
- SIEM、日志平台、对象存储里出现二次泄露面

所以更稳的原则是：

- 默认以 `Metadata` 为主
- `Request` / `RequestResponse` 只打到少量高价值、低敏对象
- `secrets`、token、认证材料相关对象通常只保留 `Metadata`

## 5. Audit Policy 最关键的边界是什么

官方文档明确说：

- 请求事件会和 `rules` 列表**按顺序比较**
- **第一个匹配规则**决定最终 level

这是 Audit Policy 最容易被答错、也最容易配错的点。

### 5.1 “规则多”不等于“更稳”

如果你把 catch-all 的大规则写在前面：

- 后面更细粒度的规则根本命不中

所以这条线最稳的口径是：

> Audit Policy 是“首个命中生效”，不是“所有命中规则叠加合并”。

### 5.2 `omitStages` 和 `omitManagedFields` 也有全局与局部边界

Kubernetes 的 audit config reference 明确写了：

- `omitStages` 可以在 policy 级别写，也可以在 rule 级别写
- 最终会取两边的并集
- `omitManagedFields` 也可以有全局默认值，再被单规则覆盖

这意味着：

- 你不能只看某条 rule，就以为它一定会产出某个 stage
- 还要回头看 policy 级别是不是已经把这个 stage 删掉了

## 6. log backend 和 webhook backend 到底怎么选

Kubernetes 官方文档说明：

- 当前 backend 实现包括 **log files** 和 **webhooks**

### 6.1 log backend 更像什么

更像：

- `kube-apiserver` 本地落盘

它的优点是：

- 路径最短
- 依赖更少
- 排障时最直接

它的边界是：

- 要考虑日志轮转
- apiserver 如果是 Pod，还要把 policy 文件和 log 路径通过 `hostPath` 等方式真正持久化
- 后续再怎么汇聚、清洗、告警，是第二段链路

### 6.2 webhook backend 更像什么

更像：

- `kube-apiserver` 实时把 audit event 发到外部审计 API

它适合：

- 需要统一送 SIEM / 审计平台
- 希望跨集群集中汇聚
- 需要后端做进一步清洗与富化

但它的边界也非常强：

- backend 故障会影响 audit 导出
- mode 不同，对 API 请求本身的耦合强度不同

官方文档明确给出了 mode：

- `batch`
- `blocking`
- `blocking-strict`

其中最容易被误用的是：

- `blocking-strict`

官方文档明确说：

- 在 `RequestReceived` stage 审计失败时，整个请求到 apiserver 都会失败

所以一句话记住：

> webhook backend 如果选得太“硬”，审计系统本身可能反过来变成业务写 API 的可用性风险。

<K8sDiagram kind="audit-policy-boundary-map" />

## 7. Admission webhook 的改动为什么能在 audit 里看出来

这部分特别适合拿来解释“为什么 audit 不只是普通 access log”。

Kubernetes 官方 Dynamic Admission Control 文档明确说明：

- 在 `Metadata` audit level 及以上，会记录 `mutation.webhook.admission.k8s.io/...` 注解
- 在 `Request` audit level 及以上，会记录 `patch.webhook.admission.k8s.io/...` 注解

这意味着：

- 你可以知道哪个 mutating webhook 被调用了
- 还能知道它是否修改了对象
- 如果 level 足够高，甚至能看到它打了什么 patch

这对排查很关键：

- 某个字段到底是用户自己写的
- 还是某个 mutating webhook 自动加上的

但同样别忘边界：

- patch 本身可能也包含敏感信息
- 不该为了“想看得更细”就把所有高敏请求都提到 `Request`

## 8. Audit 和 Event 到底有什么区别

这是另一个高频误区。

更稳的区分方式是：

- **Audit**：API 请求证据链
- **Event**：对象运行期状态提示

比如：

- `kubectl apply deployment` 会产生 audit event
- Pod `FailedMount`、`ImagePullBackOff` 会产生 K8s Event

所以你不能指望：

- 用 Event 还原“谁改了 RBAC”
- 也不能指望只用 audit 去解释“为什么容器没起来”

## 9. 一个比较稳的 policy 设计顺序

生产里更稳的顺序通常是：

1. 先全局打一层 `Metadata`
2. 再对高价值对象补更细粒度规则
3. 对 `secrets`、token、认证材料显式降级
4. 再决定哪些长连接或高频请求要省掉 `RequestReceived`
5. 最后再决定是本地 log 还是集中 webhook

原因很简单：

- 如果上来就到处打 `RequestResponse`
- 很快就会在性能、存储和敏感信息暴露面上同时出问题

## 10. 一个比较稳的 policy 骨架

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
omitStages:
  - RequestReceived
omitManagedFields: true
rules:
  - level: Metadata
    resources:
      - group: ""
        resources: ["secrets"]

  - level: Request
    resources:
      - group: "rbac.authorization.k8s.io"
        resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]

  - level: Metadata
```

这段配置表达的是：

- 全局先省掉 `RequestReceived`
- 默认不把 managed fields 打进去
- `secrets` 只留元数据
- RBAC 相关变更打到 `Request`
- 其余请求走兜底的 `Metadata`

## 11. 最常见的坑

### 坑 1：把 Audit 当成 Admission

Audit 只能留痕，不负责拦截。

### 坑 2：把 catch-all 规则写在前面

这样后面的细规则几乎都会失效。

### 坑 3：对 `secrets`、token、认证材料打 `RequestResponse`

这通常会把审计日志本身变成新的高敏系统。

### 坑 4：只开 log backend，不做轮转和后续汇聚

最后常见结果是：

- 本地磁盘堆满
- 真出事时检索链路又不完整

### 坑 5：把 webhook backend 设得太“硬”

审计后端故障时，反过来影响业务 API 请求成功率。

### 坑 6：拿 Event 当审计证据

Event 更偏运行期状态，不是 API 操作留痕。

### 坑 7：以为 audit 级别越高越专业

很多时候越高只意味着：

- 成本更高
- 泄露面更大
- 真正可用的分析信号反而被噪声淹没

## 12. 排障时建议按这条顺序看

如果你发现 audit 不对、缺日志或字段不符合预期，建议按这条顺序排：

1. 先确认 `kube-apiserver` 是否真的启用了 `--audit-policy-file` 和对应 backend 参数
2. 再确认 policy 规则顺序是不是被 catch-all 提前截胡
3. 再看是不是被全局或单规则 `omitStages` 干掉了你期待的 stage
4. 如果 webhook 相关注解没出现，检查 audit level 是否至少到 `Metadata` 或 `Request`
5. 如果是 webhook backend，继续看 mode、目标服务可用性、重试和缓冲参数
6. 如果日志量和内存压力异常，再回头看是不是打了过多 `Request` / `RequestResponse`
7. 最后别忘区分你需要的是 audit log 还是 K8s Event，别在错误的数据源上浪费时间

## 13. 面试里怎么把这题答顺

如果面试官问：

> Kubernetes 的 API Audit 怎么做？Audit Policy 怎么配才比较稳？

可以这样答：

> 我会先把 Audit 放回 `kube-apiserver` 请求链路里，它是在 API 请求各阶段生成审计事件，再按 policy 过滤后写到 log 或 webhook backend。  
> 它解决的是证据链，不是门禁，所以要和 RBAC、Admission 分开说。  
> 配 policy 时最关键的边界是规则首个命中生效，因此一般先给 `secrets` 这类高敏对象降到 `Metadata`，再对 RBAC、命名空间治理之类高价值对象提高到 `Request`，最后用兜底规则收尾；  
> stage 上通常会全局省掉 `RequestReceived`，而 `ResponseStarted` 只在 watch 这类长连接请求里才常见；  
> backend 选择上，本地 log 更简单直接，webhook 更适合集中汇聚，但如果 mode 选得太硬，审计后端故障可能反过来影响 API 请求成功率。  

## 14. 最后记住这句话

> Audit 真正要回答的是“谁在什么时候从哪里对哪个对象做了什么”，而不是“该不该让他做”；先把证据链和门禁分开，再用 `Metadata` 为主、细规则补强的方式去配 policy，审计系统才会既有用又不会反噬集群。

## 关联阅读

- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [控制面主线实战](./control-plane-mainline.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
