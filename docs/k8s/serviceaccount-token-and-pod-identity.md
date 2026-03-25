---
title: ServiceAccount Token 与 Pod 身份边界实战
description: 系统讲清 Kubernetes 中 ServiceAccount、自动挂载 token、projected serviceAccountToken、TokenRequest、audience、自动轮转与 Pod 身份边界，以及为什么不该默认让所有 Pod 都拿到 API 凭证。
---

# ServiceAccount Token 与 Pod 身份边界实战

很多人第一次学 K8s 安全，会先记住几句话：

- Pod 用 `ServiceAccount` 访问集群 API
- RBAC 控制权限
- `Secret` 放敏感信息

但如果继续追问：

- Pod 里的身份凭证到底是怎么进去的
- 为什么没写任何 token，应用却能直接访问 `kube-apiserver`
- `automountServiceAccountToken: false` 到底会关掉什么
- projected token 和以前那种长期 token 差在哪
- token 会不会自动过期、自动轮转

回答就很容易散。

这条线真正要讲清的是：

> `ServiceAccount` 只是 Pod 的身份对象，真正让容器能拿着身份去请求 API 的，是注入进容器文件系统里的 ServiceAccount token。现代 Kubernetes 默认给 Pod 注入的是短期、可轮转的 projected token，而不是长期静态 Secret；如果工作负载根本不需要访问 API，就不该默认自动挂载这份凭证。

<K8sDiagram kind="serviceaccount-token-identity-chain" />

## 1. 先回答：`ServiceAccount` 和 token 不是一回事

这是最关键的一层。

可以先拆成两部分：

- `ServiceAccount`：身份对象
- ServiceAccount token：让这个身份真正参与认证的凭证

也就是说：

- `ServiceAccount` 解决“你是谁”
- token 解决“你拿什么证明你是谁”

所以更准确的口径是：

> Pod 绑定 `ServiceAccount` 之后，Kubernetes 才可能再把对应身份凭证注入给这个 Pod 使用。

## 2. Pod 为什么不写用户名密码，也能访问 `kube-apiserver`

因为 Kubernetes 会在 Pod 里自动提供这个 Pod 的 API 凭证。

官方文档给出的现代默认行为是：

- 给 Pod 指定 `serviceAccountName`
- kubelet 通过 `TokenRequest` API 请求一个短期 token
- 再把这个 token 以 projected volume 的方式挂进 Pod

最常见的默认路径通常类似：

- `/var/run/secrets/kubernetes.io/serviceaccount`

所以很多应用没有显式写认证逻辑，也能在集群内调 API，是因为：

- 集群已经把身份凭证放进容器里了

## 3. 默认 `default` ServiceAccount 为什么是个风险点

每个 namespace 都会自动有一个：

- `default` ServiceAccount

如果你创建 Pod 时没有显式指定 `serviceAccountName`，通常就会落到它上面。

这会带来两个很常见的问题：

### 3.1 身份不清晰

你很难从设计上区分：

- 哪个工作负载到底以什么身份访问集群

### 3.2 容易配成“默认有 token，默认还有点权限”

很多团队一开始为了方便，会：

- 让大量 Pod 共用 `default`
- 再把一些读权限绑给它

短期省事，长期常见结果是：

- 权限边界变脏
- 排障很难确认到底是谁在调 API
- 任意能拿到该 Pod 的人，也更容易拿到这份 API 凭证

## 4. `automountServiceAccountToken: false` 到底关掉了什么

这是很高频的一道题。

官方文档说明得很明确：

- 可以在 `ServiceAccount` 上设置
- 也可以在 Pod 上设置

如果两边都配了：

- Pod spec 优先级更高

它真正关掉的是：

- kubelet 为该 Pod 自动挂载 API 凭证这件事

它并不代表：

- 这个 Pod 就没有 `serviceAccountName`
- 这个 Pod 就失去身份概念

更准确的理解是：

> 你可以让 Pod 仍然绑定某个 `ServiceAccount`，但不自动把 API token 塞进容器里。

这特别适合：

- 根本不需要访问 K8s API 的普通业务 Pod

## 5. 现代推荐的 token 模型为什么是 projected token

Kubernetes 官方现在推荐的是：

- 短期
- 自动轮转
- 通过 projected volume 注入

而不是：

- 长期静态 ServiceAccount token Secret

### 5.1 projected token 的核心价值

它至少解决了三件事：

- token 有有效期，不是无限期长期凭证
- kubelet 会在过期前主动轮转
- 可以指定 `audience` 和挂载路径

### 5.2 以前那种长期 token 为什么不推荐

官方文档已经明确不推荐：

- 以 Secret 形式长期保存 ServiceAccount token

原因很直接：

- 不过期
- 不轮转
- 一旦泄露，风险窗口很大

所以更稳的理解是：

> 现代 K8s 下，ServiceAccount token 更像“短期、与 Pod 生命周期绑定的工作负载凭证”，而不是“长期写死的一串密钥”。

## 6. projected `serviceAccountToken` 到底怎么用

它本质上是 projected volume 的一种 source。

最常见的三个字段是：

- `path`
- `audience`
- `expirationSeconds`

### 6.1 `path`

就是把 token 写到挂载点下的哪个相对路径。

### 6.2 `audience`

这决定：

- 这个 token 是发给谁用的

如果接收方不是这个 audience，就应该拒绝它。

默认情况下，audience 通常是：

- API server

但如果你的工作负载是拿它去对接别的系统，比如：

- Vault
- 自建身份代理

那就应该显式声明合适的 audience，而不是默认混用。

### 6.3 `expirationSeconds`

它决定这个 token 预期的有效期。

官方文档说明：

- 默认一般是 1 小时
- 至少 600 秒
- 最大值还可能被 apiserver 参数限制

## 7. token 会自动轮转，但应用未必会自动用上新 token

这是和 `ConfigMap` / `Secret` 文件更新很像的一层。

官方文档明确说：

- kubelet 会在 token 接近过期时主动刷新

但应用层仍然要自己处理：

- 如何重新读取这个文件

一句话记住：

> kubelet 负责换新 token，应用负责重新读它。

这意味着：

- 如果你的客户端库只在启动时把 token 读进内存
- 后续永远不再重新加载

那 token 即使已经轮转，应用也可能继续拿旧 token 去请求，最后表现为：

- 认证失败
- 间歇性 401

## 8. `TokenRequest` API 解决什么

官方文档推荐的另一条主线是：

- 直接使用 `TokenRequest` API 申请短期 token

这适合：

- 你想自定义获取流程
- 你不想用默认路径
- 你要给非标准消费者发 token

但也要注意另一层安全边界：

RBAC 最佳实践文档明确指出：

- 拥有 `serviceaccounts/token` 的 `create` 权限，就可以为已有 `ServiceAccount` 申请 token

这是一类敏感权限，不能乱给。

## 9. 一套比较稳的配置骨架

### 9.1 普通业务 Pod：不需要访问 API，就显式关掉自动挂载

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: public-api
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: false
  containers:
    - name: app
      image: example/api:v1
```

这段配置表达的是：

- 这个 Pod 身份仍然是 `app-sa`
- 但不自动给它挂 API token

### 9.2 需要指定 audience 的 projected token

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vault-client
spec:
  serviceAccountName: vault-reader
  automountServiceAccountToken: false
  containers:
    - name: app
      image: example/client:v1
      volumeMounts:
        - name: sa-token
          mountPath: /var/run/secrets/tokens
          readOnly: true
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              path: vault-token
              audience: vault
              expirationSeconds: 7200
```

这段配置表达的是：

- 不使用默认自动挂载
- 手工声明一个 projected token
- token 的受众是 `vault`
- 路径和有效期都显式可控

## 10. 最常见的坑

### 坑 1：所有 Pod 都让它自动挂默认 token

这会导致：

- 不需要 API 权限的 Pod 也平白多一份凭证
- 攻击面扩大

### 坑 2：把 `ServiceAccount` 和权限混成一层

更准确的说法永远是：

- `ServiceAccount` 提供身份
- RBAC 决定权限
- token 才是实际认证凭证

### 坑 3：还在依赖长期静态 token Secret

这类凭证：

- 不过期
- 不轮转
- 泄露后风险窗口很长

### 坑 4：用了 projected token，却假设应用会自动 reload

如果应用不重新读文件，轮转价值就打折了。

### 坑 5：给别人发了 `serviceaccounts/token` 的创建权限

这本质上是在授予：

- 为现有 `ServiceAccount` 申请凭证的能力

必须非常谨慎。

### 坑 6：把 `imagePullSecrets` 和 ServiceAccount token 混成一回事

它们不是一类东西：

- `imagePullSecrets` 解决拉镜像认证
- ServiceAccount token 解决工作负载对 API 或受众系统的身份认证

## 11. 排障时建议按这条顺序看

如果一个 Pod 访问 API 报认证问题，建议按这条顺序排：

1. 先看 Pod 绑定的是哪个 `serviceAccountName`
2. 再看有没有被 `automountServiceAccountToken: false` 显式关掉默认挂载
3. 如果用了 projected token，确认 `audience`、路径和有效期是否符合预期
4. 进容器检查 token 文件是否真实存在、路径是否对
5. 如果 token 已轮转但请求仍失败，再检查应用是否重新读取了文件
6. 最后回到 RBAC，看身份有没有对应权限，而不是把认证失败和授权失败混成一句“没权限”

## 12. 面试里怎么把这题答顺

如果面试官问：

> Pod 为什么能访问 `kube-apiserver`？`automountServiceAccountToken`、projected token 和长期 token 有什么区别？

可以这样答：

> Pod 能访问 `kube-apiserver`，不是因为它天然有权限，而是因为它绑定了某个 `ServiceAccount`，Kubernetes 又把对应身份凭证注入进了容器。  
> 在现代 Kubernetes 里，默认注入的通常是通过 `TokenRequest` API 获取的短期、可轮转 projected token，而不是长期静态 Secret。  
> `automountServiceAccountToken: false` 关掉的是默认 API 凭证自动挂载，不等于 Pod 没有 `ServiceAccount` 身份。  
> 如果工作负载根本不需要访问 API，应该显式关掉自动挂载；如果需要面向特定系统使用 token，则更适合手工声明 projected `serviceAccountToken`，并明确 `audience`、路径和过期时间。  

## 13. 最后记住这句话

> `ServiceAccount` 是身份对象，token 是身份凭证，RBAC 是权限边界；现代 K8s 推荐短期、可轮转、按需投射的 token，而不是让所有 Pod 都默认带着一份长期 API 凭证到处跑。

## 关联阅读

- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [ConfigMap、Secret 与配置注入边界实战](./configmap-secret-and-config-injection.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [节点执行链路实战](./node-execution-chain.md)
- [控制面主线实战](./control-plane-mainline.md)
