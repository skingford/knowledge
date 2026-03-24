---
title: Pod Security 与 SecurityContext 运行权限边界实战
description: 系统讲清 Kubernetes 中 SecurityContext、Pod Security Admission、Pod Security Standards、runAsNonRoot、allowPrivilegeEscalation、privileged、capabilities、seccomp、AppArmor、host namespaces、hostPath 与最小运行权限边界。
---

# Pod Security 与 SecurityContext 运行权限边界实战

很多团队开始做 K8s 安全加固时，第一反应通常是往 YAML 里补几行：

- `runAsNonRoot: true`
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true`

但如果继续追问：

- Pod 里到底哪些字段是真正限制运行时权限的
- `SecurityContext` 和 Pod Security Admission 到底谁负责什么
- 为什么设了 `runAsNonRoot` 还是起不来
- `privileged` 为什么会把很多加固手段直接冲掉
- `hostPath`、`hostNetwork`、`hostPID` 这类字段为什么风险这么高

回答就很容易散。

这条线真正要讲清的是：

> `securityContext` 解决的是“Pod / Container 运行时以什么权限和隔离参数运行”；Pod Security Admission 解决的是“哪些高风险字段在准入阶段就不允许出现”。前者更像运行参数，后者更像集群级门禁。两层一起看，才能把容器运行权限边界答稳。

<K8sDiagram kind="pod-security-enforcement-chain" />

## 1. 先分两层：运行时安全参数 vs 准入门禁

最稳的理解方式是先拆两层：

- **SecurityContext**：Pod 或容器运行时的权限和隔离参数
- **Pod Security Admission**：集群在准入阶段按安全标准校验 Pod 规范

一句话记住：

> `securityContext` 回答“怎么跑”，Pod Security Admission 回答“这样的 Pod 允不允许进集群”。

这两层如果混了，常见结果就是：

- 只会背几个字段，不知道谁在执行
- 只会说“Restricted 更安全”，却说不出具体限制落在什么字段上

## 2. `securityContext` 到底管什么

官方 SecurityContext 文档给的范围很清楚，它管的是这类事情：

- 用什么 UID / GID 跑进程
- 是否允许提权
- 是否是 `privileged`
- Linux capabilities 怎么加减
- `seccomp`、`AppArmor`、`SELinux` 这类内核约束
- 根文件系统是否只读
- 卷的文件属组和访问边界

### 2.1 Pod 级和容器级都能配，但语义不完全一样

这是最容易答错的地方之一。

- Pod 级 `securityContext` 更像默认值或公共约束
- 容器级 `securityContext` 更像具体容器的局部覆盖

官方文档明确说：

- 容器级设置在有重叠时会覆盖 Pod 级设置

比如：

- Pod 级设了 `runAsUser: 1000`
- 某个容器级又设了 `runAsUser: 2000`

那该容器最终按 2000 跑。

### 2.2 不是所有字段都适合放 Pod 级

例如：

- `runAsUser`
- `runAsGroup`
- `fsGroup`
- `supplementalGroups`

更偏 Pod 级公共运行身份和卷访问边界；

而：

- `allowPrivilegeEscalation`
- `privileged`
- `capabilities`
- `readOnlyRootFilesystem`

更常是容器级差异化配置。

<K8sDiagram kind="security-context-boundary-map" />

## 3. 最常用的运行权限字段，到底各自限制什么

### 3.1 `runAsNonRoot`

它表达的是：

- 容器必须以非 root 身份运行

这通常是最基础、最值得优先开启的一层。

但它不是魔法开关。常见失败场景包括：

- 镜像默认用户本来就是 root
- 应用或镜像文件权限根本不支持非 root 运行

所以更稳的理解是：

> `runAsNonRoot` 是声明约束，不会自动把一个只能 root 运行的镜像变成安全镜像。

### 3.2 `runAsUser` / `runAsGroup`

它们解决的是：

- 进程到底以哪个 UID / GID 跑

这对下面这些问题很关键：

- 文件读写权限
- 卷挂载后的权限匹配
- 应用是否还能写日志、缓存、临时目录

### 3.3 `fsGroup`

这是很多人只听过但没真正理解的字段。

官方文档说明：

- 对支持所有权管理的卷，Kubernetes 会让这些卷按 `fsGroup` 对应的 GID 做访问边界处理

最实用的理解是：

- 它更偏“卷访问组”问题
- 不是简单的进程主组替代品

如果应用一改成非 root 就报：

- 目录不可写
- 挂载卷没有权限

`fsGroup` 往往是要优先排查的一层。

### 3.4 `allowPrivilegeEscalation`

它解决的是：

- 进程是否还能在运行过程中获得更高权限

官方文档明确提到：

- 这个字段直接影响 `no_new_privs`
- 但如果容器是 `privileged`
- 或者拥有 `CAP_SYS_ADMIN`

那它实际上总是 `true`

所以一句话记住：

> 你不能一边给容器很高权限，一边再指望 `allowPrivilegeEscalation: false` 帮你兜住一切。

### 3.5 `privileged`

这是运行权限里最重的一把锤子。

官方 Linux kernel security constraints 文档明确说：

- `privileged` 会覆盖或抵消很多 Linux 安全约束
- 包括 seccomp、AppArmor、SELinux
- 而且会拿到所有 Linux capabilities

所以更稳的原则是：

- 除非真的没有替代方案，否则不要用 `privileged`

### 3.6 `capabilities`

Linux capabilities 的价值是：

- 给进程一些特权
- 但不是 root 的全部特权

这意味着更稳的做法通常不是：

- 直接 `privileged: true`

而是：

- 先 `drop: ["ALL"]`
- 再按需 `add` 极少数必须能力

### 3.7 `readOnlyRootFilesystem`

它解决的是：

- 容器根文件系统是否可写

它的价值主要在于：

- 降低运行时被篡改面
- 把真正需要写的路径显式收敛到卷或临时目录

但也要注意：

- 很多老镜像默认会往根文件系统写日志、缓存、PID 文件

所以开了它之后起不来，不一定是字段错，而可能是镜像和应用本身没准备好。

### 3.8 `seccompProfile`

官方文档说明：

- `seccomp` 用来限制系统调用

最稳的生产口径通常是：

- 优先用运行时默认的 `RuntimeDefault`
- 真有细粒度需求再用 `Localhost`

### 3.9 `appArmorProfile` / `seLinuxOptions`

这两者都属于更底层的 Linux 安全机制。

要点不是背细节，而是先分清：

- AppArmor 更偏基于 profile 的程序访问限制
- SELinux 更偏基于 label 的访问控制

官方文档也明确说：

- `privileged` 容器会忽略或冲掉很多这类约束

## 4. `securityContext` 和 host 级字段为什么一定要一起看

很多运行权限风险不只在 `securityContext` 里，还在 Pod 规范其他地方。

例如：

- `hostNetwork`
- `hostPID`
- `hostIPC`
- `hostPath`

这些字段共同表达的是：

- 容器到底离宿主机有多近

### 4.1 `hostNetwork` / `hostPID` / `hostIPC`

官方 Pod Security Standards 文档把这些都归到 host namespaces 风险里。

最实用的理解是：

- `hostNetwork`：直接贴近主机网络栈
- `hostPID`：能看到宿主机 PID 空间
- `hostIPC`：共享宿主机 IPC

这类能力一旦给出去，隔离边界就明显变薄。

### 4.2 `hostPath`

这通常是另一类高风险字段。

因为它表达的是：

- 把宿主机某个真实路径直接挂进容器

这意味着风险不再只是“容器里文件能不能写”，而是：

- 它是不是能碰到宿主机真实文件系统内容

所以官方 Restricted 标准明确要求：

- 禁止 `hostPath`

## 5. Pod Security Standards 和 Pod Security Admission 到底是什么关系

这是这条线的另一半。

先拆两层：

- Pod Security Standards：安全标准定义
- Pod Security Admission：内建准入控制器，按这些标准执行校验

### 5.1 三个安全级别

官方标准给了三层：

- `privileged`：几乎不限制
- `baseline`：阻止已知明显提权路径
- `restricted`：更接近当前最佳硬化实践

标准口径可以这样说：

> `baseline` 更像“别做明显危险的事”，`restricted` 更像“默认按更严格的最佳实践运行”。

### 5.2 Namespace labels 才是最常见落地方式

官方 Pod Security Admission 文档说明：

- PSA 一般通过 namespace labels 配置

最常见标签是：

- `pod-security.kubernetes.io/enforce`
- `pod-security.kubernetes.io/audit`
- `pod-security.kubernetes.io/warn`

以及可选版本标签：

- `pod-security.kubernetes.io/<MODE>-version`

### 5.3 `enforce / audit / warn` 要怎么区分

- `enforce`：不符合直接拒绝
- `audit`：允许通过，但写审计注解
- `warn`：允许通过，但给用户告警

生产里更稳的迁移姿势通常是：

- 先 `warn` / `audit`
- 再逐步收紧到 `enforce`

### 5.4 PSA 不是直接改你的 Pod

这点很重要。

PSA 的职责是：

- 校验是否允许

它不是：

- 自动帮你补 `runAsNonRoot`
- 自动帮你补 seccomp

也就是说：

- 真正怎么跑，还是靠你的 Pod spec
- PSA 只是决定这样的 spec 能不能进来

## 6. Restricted 到底在收哪些关键边界

官方标准里和生产最相关、最值得记的几项包括：

- 禁止 `privileged`
- 禁止 host namespaces
- 禁止 `hostPath`
- 要求 `allowPrivilegeEscalation: false`
- 要求 `runAsNonRoot: true`
- `runAsUser` 不能是 0
- `seccompProfile.type` 只能是 `RuntimeDefault` 或 `Localhost`
- Linux capabilities 要 `drop ALL`，只允许加回极少数能力，例如 `NET_BIND_SERVICE`

这几项背后的逻辑其实很统一：

- 先远离宿主机
- 再减少进程本身的特权
- 再用内核约束兜住剩余攻击面

## 7. Pod 级约束和 Namespace 级准入，应该怎么一起用

一个比较稳的实践顺序通常是：

1. 应用和镜像先改到支持非 root 运行
2. Pod / Container 明确写好 `securityContext`
3. Namespace 侧用 PSA label 先做 `warn` / `audit`
4. 观察兼容性后，再切到 `enforce`

这样做的好处是：

- 开发能先知道不合规点
- 平台不会一上来就把大量现网 workload 拦死

## 8. 一个比较稳的安全骨架

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened-api
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: example/api:v1
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

这段配置表达的是：

- 进程按非 root 身份运行
- seccomp 用运行时默认配置
- 禁止权限提升
- 根文件系统只读
- capabilities 先全部丢掉，再只加回一个低位端口绑定能力

## 9. 最常见的坑

### 坑 1：只写 `runAsNonRoot: true`，但镜像根本不支持

结果通常是：

- Pod 起不来
- 或一启动就因为文件权限、目录权限问题异常

### 坑 2：开了 `readOnlyRootFilesystem`，却没给应用预留可写目录

这类问题很常表现为：

- 日志写不了
- 缓存目录报错
- PID 文件写不了

### 坑 3：以为 `allowPrivilegeEscalation: false` 可以兜住 `privileged`

官方文档已经明确：

- `privileged`
- 或带 `CAP_SYS_ADMIN`

时，这条线并不能按你想象的方式收住。

### 坑 4：为了省事直接上 `privileged`

短期看最省事，长期看通常是：

- seccomp、AppArmor、SELinux 这些加固几乎都白做

### 坑 5：把 PSA 当成自动修复器

它不会自动给你补安全字段，只会：

- 允许
- 警告
- 拒绝

### 坑 6：忽略 host namespaces 和 `hostPath`

很多团队盯着 `runAsUser`，却忘了：

- 一旦贴近宿主机网络、PID、IPC 或直接挂宿主机路径

风险面会立刻变一个层级。

## 10. 排障时建议按这条顺序看

如果一个 Pod 因为安全设置起不来，建议按这条顺序排：

1. 先看是准入阶段被拒绝，还是已经进到节点运行阶段才失败
2. 如果是准入失败，优先看 namespace 的 PSA label 和报错内容
3. 如果已经进入运行阶段，再看 Pod / Container 的 `securityContext` 是否和镜像能力匹配
4. 如果是文件权限问题，重点看 `runAsUser`、`runAsGroup`、`fsGroup` 和挂载卷访问边界
5. 如果是低层约束问题，再检查 `seccomp`、`AppArmor`、`SELinux` 或 `privileged`
6. 如果使用了宿主机相关字段，再回头质疑设计：这些能力是否真的必须存在

## 11. 面试里怎么把这题答顺

如果面试官问：

> `securityContext` 和 Pod Security Admission 有什么区别？生产里怎么做容器最小运行权限？

可以这样答：

> `securityContext` 是 Pod 或容器运行时的权限参数，比如 `runAsNonRoot`、`allowPrivilegeEscalation`、`capabilities`、`seccomp`；  
> Pod Security Admission 则是集群在准入阶段按 Pod Security Standards 去校验 Pod 规范，比如 namespace 打了 `restricted` 后，高风险字段会被直接拦掉。  
> 生产里我会先让镜像支持非 root 运行，再在 Pod spec 里显式设置 `runAsNonRoot`、`allowPrivilegeEscalation: false`、`seccompProfile: RuntimeDefault`、尽量 `drop ALL capabilities`，避免 `privileged`、`hostPath`、`hostNetwork/hostPID/hostIPC` 这类高风险能力；  
> 最后再用 Pod Security Admission 在 namespace 维度逐步从 `warn/audit` 收紧到 `enforce`。  

## 12. 最后记住这句话

> `securityContext` 管的是容器“带着多大权限跑起来”，Pod Security Admission 管的是“这样的 Pod 允不允许进集群”；真正稳的最小运行权限，不是只背几个字段，而是把运行身份、提权能力、宿主机接触面和准入门禁一起收紧。

## 关联阅读

- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [RBAC 实战与最小权限设计](./rbac-and-least-privilege.md)
- [ServiceAccount Token 与 Pod 身份边界实战](./serviceaccount-token-and-pod-identity.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [镜像安全、镜像准入与供应链边界实战](./image-security-and-supply-chain-governance.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [节点执行链路实战](./node-execution-chain.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
