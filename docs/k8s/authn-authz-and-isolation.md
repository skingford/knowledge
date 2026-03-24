---
title: 认证、授权与隔离链路实战
description: 系统讲清 Kubernetes 中 ServiceAccount、RBAC、Admission、Secret、NetworkPolicy 的边界与协作关系。
---

# 认证、授权与隔离链路实战

K8s 里最容易被讲混的几组概念，通常是这些：

- `ServiceAccount` 是不是权限
- RBAC 和 `NetworkPolicy` 到底谁管什么
- `Admission` 和授权是不是一回事
- `Secret` 放进集群是不是就天然安全了

如果这几件事混着理解，设计权限模型时就很容易出问题。

<K8sDiagram kind="api-security-chain" />

## 1. 先分两条线：API 权限链路和工作负载隔离边界

K8s 里的安全至少要分两条主线来看：

- **API 权限链路**：谁在访问 `kube-apiserver`，他能不能做这个动作
- **工作负载隔离边界**：Pod 能访问谁、能拿到什么敏感数据、能不能被策略拦住

如果只记一句话，记这个：

> `ServiceAccount + RBAC + Admission` 更偏控制面 API 安全；`Secret + NetworkPolicy` 更偏工作负载运行边界。

## 2. 一次 API 请求到底怎么过关

无论请求来自：

- `kubectl`
- CI/CD
- 集群内某个 Pod

访问 `kube-apiserver` 时，核心链路大致都是：

1. 先带着某种身份凭证来
2. apiserver 先做认证（Authentication）
3. 再做授权（Authorization）
4. 再过准入控制（Admission）
5. 最后才可能写进 etcd 或触发控制器动作

这里必须分清三件事：

- 认证：你是谁
- 授权：你能做什么
- 准入：即使你能做，这个请求内容本身合不合规

## 3. `ServiceAccount` 到底是什么

`ServiceAccount` 本质上是 **Pod 在集群里的身份载体**。

它解决的是：

- 集群内工作负载以什么身份访问 K8s API

它不直接解决的是：

- 这个身份具体能做哪些事

标准口径：

> `ServiceAccount` 提供身份，RBAC 提供权限。

常见理解误区：

- 以为创建了 `ServiceAccount` 就自动有了权限
- 所有 Pod 都共用默认 `default` ServiceAccount
- 把业务 Pod 直接绑成高权限账号

实际工程里，更稳的做法通常是：

- 每类工作负载用独立 `ServiceAccount`
- 只给它完成本职工作所需的最小权限
- 不让普通业务 Pod 拿到集群级读写能力

## 4. RBAC 真正控制什么

RBAC 控制的是：

- 哪个身份
- 对哪些资源
- 能执行哪些 API 动作

常见对象包括：

- `Role`
- `ClusterRole`
- `RoleBinding`
- `ClusterRoleBinding`

一个很实用的区分是：

- `Role`：命名空间内权限
- `ClusterRole`：集群范围或可复用权限模板
- `RoleBinding` / `ClusterRoleBinding`：把权限绑定给身份

RBAC 的重点不是“能不能部署成功”，而是：

- 你是不是把权限边界收得足够小

工程上最重要的原则仍然是：

- 最小权限原则

## 5. Admission 为什么不是授权的替代品

很多团队只配 RBAC，不配准入策略；也有团队反过来，想靠 Admission 兜住所有权限问题。

这两种都不对。

Admission 更像：

- 请求进入控制面前的最后一道策略门

它常做的事包括：

- 校验标签、注解、命名规范
- 限制镜像来源
- 强制安全上下文
- 自动注入 sidecar 或默认配置

所以它回答的是：

- 这个请求内容合不合规

而不是：

- 这个身份本来有没有权力做这件事

一句话区分：

- RBAC 管“你有没有资格”
- Admission 管“你这次提交得像不像样”

## 6. `Secret` 为什么不等于天然安全

K8s 的 `Secret` 只是：

- 一个专门表示敏感数据的对象

它带来的好处是：

- 语义更明确
- 比把密钥直接写进镜像或 Git 仓库好得多

但它不是自动高安全方案。至少要记住这些边界：

- `Secret` 默认是 base64 编码，不是强加密
- 是否启用 etcd at-rest encryption 很关键
- 谁能读 `Secret`，仍然受 RBAC 影响
- 如果应用把 `Secret` 打进日志，再多配置也白搭

更稳的工程实践通常是：

- 启用加密存储
- 收紧 RBAC
- 优先用外部 Secret Manager / Vault / SealedSecret 一类方案
- 做轮换、审计和最小暴露面控制

## 7. `NetworkPolicy` 到底管什么，不管什么

`NetworkPolicy` 控制的是：

- Pod 到 Pod
- Pod 到外部
- 外部到 Pod

这些 **数据面流量边界**。

它不控制的是：

- 谁能调用 K8s API
- 谁能读写某个资源对象
- 第三方白名单里的公网固定 IP

这也是很高频的误区：

- 把 `NetworkPolicy` 当成 RBAC
- 把 `NetworkPolicy` 当成第三方系统白名单

实际上它更像：

- 运行时网络隔离策略

而且还要补一个前提：

- 底层 CNI 必须真的支持 `NetworkPolicy`

<K8sDiagram kind="workload-isolation-boundary" />

## 8. 一张表把五个概念彻底拆开

| 能力 | 它解决什么 | 它不解决什么 |
| --- | --- | --- |
| `ServiceAccount` | 工作负载以什么身份访问 K8s API | 不直接授予权限 |
| RBAC | 这个身份能对哪些 API 资源做哪些动作 | 不控制网络流量 |
| Admission | 请求内容是否符合策略，必要时自动变更 | 不替代身份认证和授权 |
| `Secret` | 表达和分发敏感数据 | 不等于天然加密或完整密钥管理 |
| `NetworkPolicy` | 控制 Pod 之间及对外网络连通性 | 不控制 API 权限，也不解决公网白名单 |

## 9. 一套比较稳的权限骨架

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-api
  namespace: prod
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: order-api-reader
  namespace: prod
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: order-api-reader-binding
  namespace: prod
subjects:
  - kind: ServiceAccount
    name: order-api
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: order-api-reader
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: order-api-ingress
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: order-api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-gateway
```

这段配置表达的是：

- `order-api` 这个 Pod 身份是独立的
- 它在 `prod` 命名空间里只拿读取少数对象的权限
- 网络层面只允许特定入口流量进来

身份、权限、网络边界分别独立。

## 10. 最容易踩的坑

### 坑 1：所有 Pod 都用默认 `ServiceAccount`

这通常意味着身份模型从一开始就是糊的。

### 坑 2：给业务 Pod 绑过大的 `ClusterRole`

这类配置短期省事，长期风险极高。

### 坑 3：把 RBAC 当成网络隔离

RBAC 只能拦 API，请求流量还是得靠 `NetworkPolicy`。

### 坑 4：把 `NetworkPolicy` 当成第三方白名单

它不解决公网固定入口、固定出口问题。

### 坑 5：以为 `Secret` 放进 K8s 就安全了

如果没有加密、审计、轮换和最小暴露面，风险依然很大。

### 坑 6：只靠 Admission，忽略最小权限

Admission 可以兜底策略，但不能替你设计健康的身份和授权模型。

## 11. 一套面试答法

如果面试官问：

> K8s 里 `ServiceAccount`、RBAC、Admission、Secret、NetworkPolicy 分别做什么？

你可以这样答：

> 我会先把它们分成控制面 API 安全和工作负载运行边界两类。  
> `ServiceAccount` 解决的是 Pod 以什么身份访问 K8s API，本身不直接提供权限；  
> RBAC 解决的是这个身份能对哪些资源做哪些动作；  
> Admission 解决的是请求内容本身是否符合策略，以及是否需要默认注入或校验；  
> `Secret` 是敏感数据对象，但不等于天然高安全，还要配合加密、RBAC 和外部密钥管理；  
> `NetworkPolicy` 则是运行时网络隔离，控制 Pod 之间和对外的流量边界，不控制 API 权限。  
> 所以这几者不是替代关系，而是分层协作关系。  

## 12. 最后记住这句话

> K8s 安全设计最怕把身份、权限、准入、敏感数据和网络隔离混成一层。先把边界拆开，权限模型才会稳。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
