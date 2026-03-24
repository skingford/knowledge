---
title: Namespace 资源治理与配额边界实战
description: 系统讲清 Kubernetes 中 Namespace、LimitRange、ResourceQuota 如何围绕默认值、单对象边界、命名空间总预算和对象数量配额共同做资源治理。
---

# Namespace 资源治理与配额边界实战

很多团队把 K8s 多团队治理理解成两件事：

- 建 Namespace
- 配 RBAC

但只做到这里，通常只解决了：

- 资源归谁管
- 谁能改什么

还没解决：

- 某个团队会不会把 CPU / 内存一次性吃穿
- 某个命名空间会不会疯狂建 PVC、Secret、LoadBalancer
- 某个 Pod 不配 `requests`，却把 Quota 这条线直接搞崩

这条线真正要讲清的是：

> `Namespace` 解决归属边界，`LimitRange` 解决单个 Pod / Container / PVC 的默认值与上下限，`ResourceQuota` 解决整个 namespace 的总预算和对象数量上限。三者不拆开，资源治理这题一定会答散。

<K8sDiagram kind="namespace-resource-governance-chain" />

## 1. 先回答：为什么光有 Namespace 还不够

`Namespace` 最重要的价值是：

- 资源逻辑归组
- 团队边界划分
- 配合 RBAC、NetworkPolicy、Quota 做治理

但它自己并不自动提供：

- CPU / 内存预算
- 单 Pod 最小最大规格
- PVC 总容量上限
- Secret / ConfigMap / Service 这类对象的数量约束

所以如果只有 Namespace，没有后面的治理策略，常见结果就是：

- 团队隔开了
- 资源却还是谁先抢到算谁的

## 2. 资源治理链路到底发生在哪一层

很多人会把 `ResourceQuota` 误以为是 scheduler 功能，这不对。

更准确地说：

- `LimitRange` 和 `ResourceQuota` 都属于 API 准入链路上的治理能力
- 它们发生在对象进入集群之前
- 真正通过准入之后，调度器才开始考虑“放哪台节点”

可以把这条线理解成：

1. 用户向某个 Namespace 提交 Pod / PVC / Service 等对象
2. API Server 先做认证、授权、准入
3. `LimitRange` 负责补默认值或校验单对象边界
4. `ResourceQuota` 负责检查这个 Namespace 的总预算是否会超
5. 只有请求通过后，对象才会持久化并进入后续调度 / 控制器链路

一句话记忆：

> Quota 先决定“让不让你建”，scheduler 再决定“把它放哪”。

## 3. `LimitRange` 解决什么，它为什么更像“单对象守门员”

官方文档对 `LimitRange` 的核心定位可以概括成：

- 给 Pod / Container / PVC 设最小值、最大值
- 设默认 `requests` / `limits`
- 约束 request 和 limit 的比例

这件事最实用的价值在于：

- 避免有人完全不写资源规格
- 避免单个 Pod 规格离谱
- 给 ResourceQuota 一条更稳定的计算基础

### 3.1 `LimitRange` 最常见管哪些东西

常见包括：

- Container 级 CPU / Memory 最小值
- Container 级 CPU / Memory 最大值
- 默认 `requests`
- 默认 `limits`
- `maxLimitRequestRatio`
- PVC 的最小 / 最大 `storage`

### 3.2 为什么它和 `requests` 关系这么大

如果命名空间开了 CPU / Memory 相关 Quota，但业务提交的 Pod 根本不写 `requests` / `limits`，集群很可能直接拒绝创建。

这也是官方 ResourceQuota 文档里专门提醒的点：

- 对 `cpu`、`memory` 这类 compute quota，通常需要 Pod 明确给出 request 或 limit
- 可以用 `LimitRange` 自动补默认值，避免每个团队手写得乱七八糟

### 3.3 一个常见的 `LimitRange` 骨架

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: team-a-defaults
  namespace: team-a
spec:
  limits:
    - type: Container
      defaultRequest:
        cpu: "250m"
        memory: "256Mi"
      default:
        cpu: "500m"
        memory: "512Mi"
      min:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "2"
        memory: "2Gi"
```

这段配置表达的是：

- 不写就给默认值
- 写得太离谱也不行

## 4. `ResourceQuota` 解决什么，它为什么更像“命名空间总账”

如果说 `LimitRange` 管的是：

- 单个对象别乱来

那 `ResourceQuota` 管的是：

- 整个 namespace 总共最多能用多少

官方文档里，ResourceQuota 的核心边界包括三类：

- 计算资源总量
- 存储资源总量
- 对象数量上限

### 4.1 计算资源总量

最常见的是：

- `requests.cpu`
- `requests.memory`
- `limits.cpu`
- `limits.memory`

这类配额控制的是：

- 这个 namespace 总共能申请多少

而不是：

- 真的给你预留了多少节点容量

这个区别非常关键。

### 4.2 存储资源总量

除了 CPU / 内存，Quota 还常用来管：

- `requests.storage`
- `persistentvolumeclaims`

也就是：

- PVC 总容量
- PVC 数量

这对多团队共享存储、控制成本非常重要。

### 4.3 对象数量上限

这是很多团队会漏掉的一层，但线上很实用。

Quota 还可以限制：

- `configmaps`
- `secrets`
- `services`
- `services.loadbalancers`
- `count/<resource>.<group>` 这类 namespaced API 对象数量

这类约束解决的不是节点资源，而是：

- 控制面对象膨胀
- 云资源成本失控
- 某些团队误建过多对象

### 4.4 一个常见的 `ResourceQuota` 骨架

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-budget
  namespace: team-a
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    persistentvolumeclaims: "10"
    requests.storage: "200Gi"
    services.loadbalancers: "2"
    secrets: "100"
```

这段配置表达的是：

- team-a 总共最多申请多少 compute
- 最多能有多少 PVC
- 最多能吃多少存储
- 最多建几个公网入口和 Secret

## 5. `LimitRange` 和 `ResourceQuota` 到底怎么配合

这是最容易被问散的一题。

<K8sDiagram kind="limitrange-resourcequota-boundary-map" />

最实用的口径是：

- `LimitRange`：管单个对象的默认值、最小值、最大值
- `ResourceQuota`：管整个 namespace 的累计上限

可以把它们理解成：

- `LimitRange` 是单笔规则
- `ResourceQuota` 是总账预算

### 5.1 为什么很多团队 Quota 一开就开始报 403

原因通常不是 Quota 坏了，而是：

- 业务 Pod 没写 `requests` / `limits`
- 命名空间又启用了 CPU / Memory 类 Quota

这时 API Server 很可能直接返回：

- `403 Forbidden`

也就是说，对象还没进入调度阶段就被挡住了。

更准确地说：

> 这不是 `Pending`，而是对象根本没被准入成功。

### 5.2 为什么只开 Quota 不开 LimitRange 很容易把使用体验做烂

因为最终效果会变成：

- 所有人都必须记住怎么写一套完全正确的 `requests` / `limits`
- 写错一个字段就直接创建失败

而更稳的做法通常是：

- 先用 `LimitRange` 给出合理默认值和上下限
- 再用 `ResourceQuota` 控 namespace 总预算

## 6. Quota 最容易讲错的边界

### 6.1 Quota 不是容量预留

官方文档明确提到：

- 即使多个 namespace 的 quota 总和超过了集群真实容量，也仍然可能发生争用
- 这更像 first-come-first-served

也就是说：

- Quota 是管理边界
- 不是资源预留系统

一句话记忆：

> Quota 控的是“允许你申请多少”，不是“保证你一定拿得到多少”。

### 6.2 改 Quota 不会回头影响已经存在的对象

这也是官方文档里强调的一点。

如果你把 quota 调小：

- 已经创建成功的对象不会因此立刻被驱逐或回收

真正受影响的通常是：

- 后续新建
- 后续更新

### 6.3 Quota 也不等于噪声邻居彻底消失

因为运行期真正的争抢还会受这些因素影响：

- `requests` 是否失真
- `limits` 是否合理
- HPA / VPA 是否在放大问题
- 节点本身是否已经过度挤压

所以：

- Quota 是治理的一层
- 不是运行时性能银弹

## 7. 存储和对象数量这两类配额，为什么特别值得单独记住

很多人一提 Quota 只想到 CPU / 内存，这太窄了。

### 7.1 存储配额

很实用的场景包括：

- 限制某个团队最多建多少 PVC
- 限制 namespace 总存储申请量
- 避免某个团队把昂贵存储类打爆

而 `LimitRange` 还能继续补一层：

- 单个 PVC 最小 / 最大容量

### 7.2 对象数量配额

也很实用，尤其是：

- `services.loadbalancers`
- `secrets`
- `configmaps`

这些对象要么对应真实成本，要么会给控制面带来负担。

所以生产里别把 quota 只理解成：

- CPU / 内存预算

它同样是：

- API 对象数量治理
- 存储成本治理

## 8. 一套更完整的 namespace 资源治理骨架

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
---
apiVersion: v1
kind: LimitRange
metadata:
  name: team-a-defaults
  namespace: team-a
spec:
  limits:
    - type: Container
      defaultRequest:
        cpu: "250m"
        memory: "256Mi"
      default:
        cpu: "500m"
        memory: "512Mi"
      min:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "2"
        memory: "2Gi"
    - type: PersistentVolumeClaim
      min:
        storage: "1Gi"
      max:
        storage: "50Gi"
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-budget
  namespace: team-a
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    persistentvolumeclaims: "10"
    requests.storage: "200Gi"
    services.loadbalancers: "2"
    configmaps: "200"
    secrets: "100"
```

这套骨架表达的是：

- 先把团队边界放到独立 namespace
- 再给单对象默认值和上下限
- 最后给 namespace 总预算和对象数量上限

## 9. 最容易踩的坑

### 坑 1：只开 ResourceQuota，不配 LimitRange

结果通常是：

- 开发提交 Pod 直接被 403
- 团队抱怨“平台太难用”

### 坑 2：LimitRange 默认值拍脑袋，结果全员 `Pending`

比如默认 `requests` 设得过大，会直接导致：

- 小服务也被迫按大规格调度
- 调度成功率下降
- HPA / CA 判断被放大扭曲

### 坑 3：把 Quota 当容量预留

然后看到：

- Quota 没超
- Pod 却还是 `Pending`

就误以为平台出问题。

其实根因往往只是：

- 集群没有真实空位

### 坑 4：只控 CPU / 内存，不控 PVC 和对象数量

这样经常会留下两个大洞：

- 存储成本失控
- `LoadBalancer`、Secret、ConfigMap 等对象膨胀

### 坑 5：以为 Namespace 隔离已经等于完整租户隔离

实际上多团队最小组合通常至少要一起看：

- Namespace
- RBAC
- ResourceQuota / LimitRange
- NetworkPolicy

## 10. 排障时建议按这条顺序看

如果你发现业务在某个 namespace 里“创建不了对象”或“资源治理看起来怪怪的”，建议按这条顺序排：

1. 先看对象是被 API 直接 403 拒绝了，还是已经创建成功但后续 `Pending`
2. 如果是 403，优先看 `LimitRange` 和 `ResourceQuota`，而不是先怀疑 scheduler
3. 如果是 compute quota 问题，继续看 Pod 是否没写 `requests` / `limits`
4. 如果是 PVC / 存储问题，继续看 PVC 的 `storage` 请求、PVC 数量和 namespace 存储 quota
5. 如果 quota 都没超但还是 `Pending`，再回到真实集群容量、节点约束和调度事件

## 11. 面试里怎么把这题答顺

如果面试官问：

> ResourceQuota 和 LimitRange 各管什么？为什么很多团队一开 Quota 就创建 Pod 失败？

可以这样答：

> 我会先把问题拆成 namespace 总预算和单对象边界两层。  
> `LimitRange` 管的是单个 Pod、Container 或 PVC 的默认值、最小值、最大值，核心作用是把 request/limit 的基线收敛起来；  
> `ResourceQuota` 管的是整个 namespace 的累计预算，比如总 CPU、总内存、PVC 数量、总存储，甚至 Secret、LoadBalancer 这类对象数量；  
> 很多团队一开 quota 就失败，通常不是 scheduler 问题，而是因为命名空间启用了 CPU/Memory 类 quota，但 Pod 又没写 requests/limits，结果在 API 准入阶段就被 403 拒绝了。  
> 所以工程上更稳的做法通常是先配 LimitRange 兜默认值，再配 ResourceQuota 控 namespace 总账。  

## 12. 最后记住这句话

> Namespace 解决“资源归谁”，LimitRange 解决“单个对象别乱来”，ResourceQuota 解决“整个团队总共别超账”；如果只建 Namespace 不做配额治理，多团队资源边界很快就会失真。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Admission、策略治理与 Policy Engine 边界实战](./admission-policy-and-governance.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
