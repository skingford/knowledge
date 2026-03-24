---
title: 镜像安全、镜像准入与供应链边界实战
description: 系统讲清 Kubernetes 中镜像 tag 与 digest、imagePullPolicy、imagePullSecrets、AlwaysPullImages、镜像来源限制、签名校验、attestation、SBOM 与供应链治理边界，以及为什么镜像安全不只是“别用 latest”。
---

# 镜像安全、镜像准入与供应链边界实战

很多团队提到 Kubernetes 镜像安全时，第一反应往往只有两句话：

- 不要用 `latest`
- 用私有仓库

这当然不算错，但太浅了。

一旦进入真实生产环境，马上就会遇到更具体的问题：

- tag 和 digest 到底应该怎么选
- `imagePullPolicy` 为什么改了镜像 tag 后不一定自动变
- 私有镜像仓库凭证到底该放哪里
- `AlwaysPullImages` 解决什么，不解决什么
- 镜像扫描、签名校验、attestation、SBOM 和 admission 之间是什么关系
- 为什么“镜像来源可信”不等于“运行时就安全”

这条线真正要讲清的是：

> 镜像安全至少有四层：镜像引用是否稳定、镜像拉取凭证是否安全、镜像准入是否能验证来源与签名、运行时权限是否最小化。只讨论其中一层，最后很容易把供应链安全误答成“把 registry 换成私有的就完了”。

<K8sDiagram kind="image-supply-chain-chain" />

## 1. 先回答：镜像安全到底不是在解决哪一个单点问题

更稳的回答方式是先拆四层：

1. **引用稳定性**：你部署的到底是不是那一个固定镜像
2. **拉取认证**：节点拿什么凭证去拉这个镜像
3. **准入验证**：这个镜像来源、签名、attestation 是否满足策略
4. **运行时权限**：就算镜像可信，它跑起来时权限是不是仍然过大

所以一句话记住：

> 镜像安全不只是“镜像内容有没有漏洞”，还包括“拉的是不是同一个东西”“谁有资格拉”“入集群前是否验证过”“跑起来后权限是否仍然过大”。

## 2. tag 和 digest 到底怎么选，为什么 digest 更稳

Kubernetes 官方镜像文档说得很清楚：

- tag 可以移动，能指向不同镜像
- digest 是内容哈希，固定不变

这意味着：

- `myapp:v1.2.3` 看上去像一个版本，但理论上仍可被重新推送覆盖
- `myapp@sha256:...` 才是真正指向一个不可变内容

### 2.1 为什么生产里更推荐至少能落到 digest

因为它直接回答了最关键的问题：

- 这次部署的到底是不是那一份我扫描过、验证过、审核过的镜像

更稳的做法通常是：

- 开发、测试阶段可以先用语义化 tag
- 进入正式发布或准入校验时，最终落到 digest

### 2.2 为什么 `latest` 尤其危险

官方文档明确建议：

- 生产环境应避免使用 `:latest`

原因非常直接：

- 难以追踪当前到底跑的是哪版
- 回滚边界不清楚
- 配合缓存和拉取策略时更容易制造“同 YAML 不同结果”

## 3. `imagePullPolicy` 为什么不是“总会按你想的那样拉”

Kubernetes 官方镜像文档明确说：

- `imagePullPolicy` 会在对象首次创建时被设置
- 后续即便 tag 变化，这个字段也不会自动跟着改

这是一条很容易被忽略的边界。

### 3.1 默认值到底怎么来的

官方文档给出的默认逻辑是：

- 指定 digest 时，默认 `IfNotPresent`
- tag 是 `:latest` 时，默认 `Always`
- 没写 tag 时，也默认 `Always`
- 其他常见情况默认 `IfNotPresent`

### 3.2 为什么很多人会被它坑

最常见场景是：

- 第一次创建对象时用了非 `latest` tag
- 后来只改 image 字段成 `latest`
- 但没显式改 `imagePullPolicy`

此时系统不会自动替你切成 `Always`。

所以更稳的原则是：

- 不要把拉取行为寄托在隐式默认值上
- 关键工作负载显式写 `imagePullPolicy`

## 4. 私有仓库拉取凭证到底该怎么理解

Kubernetes 官方私有仓库拉取文档里说明：

- Pod 可以通过 `imagePullSecrets` 指定拉镜像凭证
- 一个 Pod 可以有多个 `imagePullSecrets`
- 每个 secret 也可以包含多个 registry 凭证

### 4.1 `imagePullSecrets` 解决什么

它解决的是：

- 节点或 kubelet 在替 Pod 拉镜像时，去哪里找 registry 凭证

它不解决的是：

- Pod 运行后访问 API 的身份认证

这也是一个高频误区：

> `imagePullSecrets` 和 ServiceAccount token 完全不是一类东西。前者解决拉镜像认证，后者解决工作负载身份认证。

### 4.2 为什么这份 Secret 也要按高危数据对待

因为它可能包含：

- registry 用户名密码
- 访问私有镜像仓库的 token

一旦泄露，攻击者可能直接：

- 拉到内部镜像
- 枚举私有仓库内容

所以这类 Secret 也应该纳入：

- 最小权限
- 审计
- 轮换

## 5. `AlwaysPullImages` 到底解决什么

Kubernetes admission controllers 文档说明：

- `AlwaysPullImages` 是一种同时带 mutating 和 validating 特性的 admission controller

它的核心作用是：

- 每次创建容器都强制尝试拉镜像

### 5.1 它适合解决什么

更适合回答的是：

- 避免节点复用本地缓存镜像而绕过仓库认证边界
- 强化“谁有资格拉这个镜像”这层控制

### 5.2 它不解决什么

它不解决：

- 镜像是否可信
- 镜像是否签过名
- 镜像是否有漏洞
- 这个 tag 是否被篡改过

所以一句话记住：

> `AlwaysPullImages` 更像“每次都重新过拉取认证”，不是“供应链真实性验证器”。

## 6. 镜像准入策略到底应该校验哪些东西

真正落到 admission 里，最常见会校验四类问题：

### 6.1 镜像来源

例如：

- 只能来自公司私有 registry
- 禁止直接用 `docker.io/library/*`
- 禁止未备案的第三方 registry

### 6.2 镜像引用形式

例如：

- 禁止 `latest`
- 要求固定 tag
- 更严格时要求必须使用 digest

### 6.3 签名与 attestation

这层才开始进入真正的供应链验证。

更稳的理解是：

- 签名解决“镜像是不是由受信主体产出”
- attestation 解决“它是不是带着特定构建、扫描、SBOM 等证明”

### 6.4 元数据和构建证明

例如：

- 是否有扫描结果
- 是否来自规定流水线
- 是否附带 SBOM 或其他证明材料

## 7. 签名校验通常不是 kubelet 自己做，而是 admission 层做

这点特别容易被说错。

Kubernetes 自己不会默认替你做：

- cosign 签名验证
- attestation 验证
- SBOM 可信性校验

真正常见的落地方式通常是：

- admission policy
- 外部 policy engine
- 或专门的签名校验 admission controller

### 7.1 Kyverno 的 `verifyImages`

Kyverno 官方文档说明：

- `verifyImages` 可以校验镜像签名、attestation 或镜像引用
- 默认还会把镜像引用变成 digest（`mutateDigest` 默认开启）

这背后的核心价值非常清楚：

- 一旦准入通过，最终落地对象里就是不可变引用
- 后续再配合扫描结果和签名，就能把“验证过的镜像”与“实际运行的镜像”对齐起来

### 7.2 Sigstore policy-controller

Sigstore 官方文档说明：

- `policy-controller` 是 Kubernetes admission controller
- 可以基于 cosign 的可验证供应链元数据做策略执行
- 还会把 tag 解析到最终镜像，避免 admitted 时和实际运行时不是同一个内容

这点非常关键，因为它直接回答了供应链治理里最难的一层：

- 验证时看的镜像，和最终跑起来的镜像，必须是同一个对象

## 8. 一个比较稳的镜像治理顺序

生产里更稳的顺序通常是：

1. 先限制镜像来源和引用规范
2. 再限制私有仓库凭证暴露面
3. 再逐步引入签名和 attestation 校验
4. 最后把镜像可信和运行时最小权限串起来

原因很简单：

- 如果连来源和引用形式都还没收敛
- 直接上复杂签名体系，治理成本会非常高

## 9. 一个比较稳的 Pod 骨架

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: app
      image: registry.example.com/order/api@sha256:3e5f0c2d...
      imagePullPolicy: IfNotPresent
      securityContext:
        runAsNonRoot: true
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
```

这段配置表达的是：

- 从私有 registry 拉镜像
- 镜像引用固定到 digest
- 显式声明拉取策略
- 运行时权限继续收紧，而不是把“镜像可信”误当成“运行就安全”

## 10. 一个比较稳的 admission 校验骨架

如果只是做简单 validating，内建 `ValidatingAdmissionPolicy` 就够：

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: disallow-latest-images
spec:
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
      - apiGroups: [""]
        apiVersions: ["v1"]
        operations: ["CREATE", "UPDATE"]
        resources: ["pods"]
  validations:
    - expression: "object.spec.containers.all(c, !c.image.endsWith(':latest'))"
      message: "latest tag is not allowed"
```

这类规则更适合：

- 镜像来源前缀限制
- 禁止 `latest`
- 强制某些命名规范

如果要做：

- 签名
- attestation
- SBOM 相关证明

通常就该上更强的 policy engine 或专门的 admission controller。

<K8sDiagram kind="image-trust-boundary-map" />

## 11. 最常见的坑

### 坑 1：以为私有仓库就等于供应链安全

私有仓库只解决：

- 镜像分发边界

不自动解决：

- 镜像是否被篡改
- 镜像是否签名
- 构建产物是否可信

### 坑 2：只禁 `latest`，却依然完全依赖 tag

tag 即便不是 `latest`，本质上仍可被移动。

### 坑 3：把 `AlwaysPullImages` 当成签名验证

它只是在拉取路径上更严格，不是供应链真实性证明。

### 坑 4：把 `imagePullSecrets` 和 ServiceAccount token 混为一谈

这两份凭证：

- 作用对象不同
- 生命周期不同
- 风险模型也不同

### 坑 5：以为镜像可信，运行时就可以放宽权限

这是另一类高频误区。

镜像供应链可信解决的是：

- 你跑的是不是受信构建产物

运行时权限最小化解决的是：

- 就算它是可信产物，进程还能不能横向影响宿主机和集群

### 坑 6：一次性把签名、attestation、SBOM、扫描、准入全堆上去

如果基础治理还没收敛，最后最常见结果是：

- 规则很多
- 但团队根本不知道失败是卡在来源、tag、签名，还是 attestation

## 12. 排障时建议按这条顺序看

如果一个 Pod 因为镜像问题起不来或被拒绝，建议按这条顺序排：

1. 先看是准入阶段被拒绝，还是已经到节点拉镜像阶段失败
2. 如果是准入拒绝，先分清是镜像来源、tag/digest、签名还是 attestation 规则没过
3. 如果是 `ImagePullBackOff`，优先检查镜像地址、registry 连通性和 `imagePullSecrets`
4. 如果镜像明明存在却拉取异常，再检查 `imagePullPolicy`、对象首次创建时的默认值和节点缓存行为
5. 如果签名校验相关策略不稳定，再看 admission webhook / policy engine 的健康、超时和缓存策略
6. 最后回到运行时安全：即便镜像通过了供应链校验，也别忽略容器运行权限是否仍然过大

## 13. 面试里怎么把这题答顺

如果面试官问：

> Kubernetes 里镜像安全怎么做？为什么说供应链安全不只是别用 `latest`？

可以这样答：

> 我会先把镜像安全拆成四层：引用稳定性、拉取认证、准入验证和运行时权限。  
> 在引用稳定性上，生产里更稳的是用 digest 而不是只靠 tag，因为 digest 是不可变内容哈希；  
> 在拉取认证上，`imagePullSecrets` 解决的是节点拉私有镜像的认证，不是工作负载身份；  
> 在准入验证上，简单规则可以用 admission policy 做来源限制和禁 `latest`，更进一步的签名、attestation 和 SBOM 校验通常要借助 Kyverno `verifyImages`、Sigstore policy-controller 之类的 admission 方案；  
> 最后我还会补一句，镜像可信不等于运行时就安全，仍然要配合 `securityContext` 和 Pod Security 去做最小权限。  

## 14. 最后记住这句话

> 镜像安全真正要同时回答四件事：拉的是不是固定内容、谁能拉、入集群前有没有验证过、跑起来后权限大不大；只讲其中一层，最后都很容易把供应链问题答成一句“别用 latest”。

## 关联阅读

- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [Pod Security 与 SecurityContext 运行权限边界实战](./pod-security-and-security-context.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
- [节点执行链路实战](./node-execution-chain.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
