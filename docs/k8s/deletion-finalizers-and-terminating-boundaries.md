---
title: 删除、Finalizers 与 Terminating 边界实战
description: 系统讲清 Kubernetes 中 delete、deletionTimestamp、finalizers、ownerReferences、garbage collection、Foreground/Background/Orphan、Pod Terminating 与控制面对象删除边界，以及资源为什么会卡在 Terminating。
---

# 删除、Finalizers 与 Terminating 边界实战

很多团队一说到删除资源，只剩一句话：

- `kubectl delete` 之后对象就没了

这句话在 Kubernetes 里通常不够用。

线上和面试里更常见的追问其实是这些：

- 为什么对象明明执行了 `delete`，还一直能查到，而且状态是 `Terminating`
- 为什么删 Deployment 时，有时 owner 先消失，有时 owner 会卡着不走
- 为什么删 Pod 时，看起来是 `Terminating`，但问题根本不在 probe，而在节点、卷或 finalizer
- `metadata.finalizers` 到底是什么，为什么手工删掉它资源就“突然好了”
- `ownerReferences`、垃圾回收、`Foreground / Background / Orphan` 到底怎么串
- 什么情况下可以强拆 finalizer，什么情况下千万别动

这条线真正要讲清的是：

> Kubernetes 的删除不是“立刻物理删除”，而是“先打删除标记，再按 grace period、finalizer、ownerReferences 和垃圾回收规则逐步收敛”。

<K8sDiagram kind="deletion-finalizer-gc-chain" />

## 1. 先把一句话讲清楚：`delete` 不是“立刻从 API 消失”

更准确的理解是：

1. 你发起 `DELETE` 请求
2. `apiserver` 给对象写上 `metadata.deletionTimestamp`
3. 如果对象还有 `finalizers`，或者本身还在走退出链路，就先进入删除进行中状态
4. 等控制器完成清理、`finalizers` 清空，垃圾回收链路也走完后，对象才真正从 API 里消失

所以很多资源看到的：

- `Terminating`

本质上都不是“还没开始删”，而是：

- 已经开始删了，但还没删完

这也是为什么 Kubernetes 官方文档会把 delete 解释成：

- 先标记删除
- 再等待控制器和系统收尾
- 最后才真正删除对象

## 2. delete 之后对象上到底多了什么

排这类问题时，脑子里优先看四个字段：

- `metadata.deletionTimestamp`
- `metadata.finalizers`
- `metadata.ownerReferences`
- `metadata.deletionGracePeriodSeconds`

可以先用最实用的口径记住：

| 字段 | 你该怎么理解 |
| --- | --- |
| `deletionTimestamp` | 删除请求已经被接受，对象进入“删除中” |
| `finalizers` | 还有谁没完成收尾，导致对象不能真正删掉 |
| `ownerReferences` | 这个对象是谁的下游，GC 是否会级联清理它 |
| `deletionGracePeriodSeconds` | 主要是 Pod 这类对象的优雅退出窗口，不是 finalizer 本身 |

一句话说透：

> `Terminating` 不是一个单独的底层机制，而是 delete 之后多条收敛链路尚未结束时，对外表现出来的现场状态。

## 3. Finalizer 到底是什么，不是什么

Finalizer 最容易被误解成：

- 一段自动执行的脚本

这不准确。

更准确地说：

- Finalizer 是写在 `metadata.finalizers` 里的一个 key
- 它告诉 Kubernetes：这个对象在真正删除前，必须先满足某个清理条件
- 真正做清理动作的，不是 finalizer 这个字符串本身，而是认识这个 finalizer 的控制器

也就是说：

- finalizer 表达“先别删完”
- controller 才负责“为什么不能删完、什么时候可以删完”

例如最典型的场景：

- `PersistentVolume` / `PersistentVolumeClaim` 保护
- 自定义 Operator 在删 CR 时先清理云资源、DNS、账号、快照或外部注册信息

这里再补一个很关键的边界：

- delete 已经发起后，你可以删除已有 finalizer
- 但不能再往对象上新增 finalizer

所以如果一个对象已经进入删除流程，很多“我现在再补一个 finalizer 来兜底”的想法，本身就是错的。

## 4. 为什么 Pod 的 `Terminating` 和控制面对象的 `Terminating` 不能混着答

这是最容易答混的一层。

Pod 进入 `Terminating`，通常至少可能叠了两条线：

- **退出线**：`preStop -> SIGTERM -> grace period -> kubelet 停容器 -> 卷和网络清理`
- **对象删除线**：`deletionTimestamp -> finalizers -> 真删除`

而 Deployment、CR、PVC 这类控制面对象，更常见的是：

- `deletionTimestamp -> finalizers / garbage collection -> 真删除`

也就是说：

- Pod 的 `Terminating` 既可能是“应用还没退干净”
- 也可能是“finalizer 还没清掉”
- 还可能是“节点根本联不上，控制面删不干净”

但一个 CR、Deployment、PVC 的 `Terminating`，通常不该拿 `SIGTERM` 和探针去解释。

<K8sDiagram kind="terminating-stuck-boundary-map" />

## 5. `ownerReferences` 和垃圾回收到底怎么串

很多人能说出 label selector，却说不清删除时真正起作用的关系字段是什么。

删除链路里更关键的是：

- `ownerReferences`

它表达的是：

- 这个对象是谁创建和拥有的
- owner 被删时，这个 dependent 要不要一起被清理

例如常见链路：

- Deployment 拥有 ReplicaSet
- ReplicaSet 拥有 Pod

所以你删一个上层 owner 时，Kubernetes 会根据 `ownerReferences` 决定要不要级联处理 dependents。

### 5.1 三种常见传播策略

#### `Background`

这是最常见、也通常是默认的级联删除模式。

特点是：

- owner 对象会先从 API 里消失
- dependents 由垃圾回收控制器在后台继续删除

适合：

- 你更关心 owner 尽快删掉
- 不需要在 API 里一直看着 owner 等依赖全清完

#### `Foreground`

前台级联删除时，owner 不会立刻消失。

更准确地说：

- owner 会先写上 `deletionTimestamp`
- `apiserver` 会在 owner 上加 `foregroundDeletion` finalizer
- 只有阻塞 owner 删除的 dependents 被清完，owner 才会真正消失

这就是为什么你删某些对象时会看到：

- owner 一直挂在 API 里 `Terminating`

因为它在等下游对象先走完。

#### `Orphan`

这种模式下：

- owner 被删
- dependents 被保留下来，变成 orphan

适合极少数你明确要“拆掉上层控制，但保留现有实例”的场景。

如果没想清楚就用，很容易留下：

- 没人继续管的 Pod
- 残留的 ReplicaSet
- 失去 owner 的对象树

### 5.2 一眼看懂这三种模式

| 模式 | owner 是否先消失 | dependents 会怎样 | 最容易踩的坑 |
| --- | --- | --- | --- |
| `Background` | 通常先消失 | 后台继续删 dependents | 以为 owner 已没，整条链路就已经收干净了 |
| `Foreground` | 不会，先卡在删除中 | 先删 blocking dependents，再删 owner | 把 owner 卡 `Terminating` 误判成 apiserver 卡死 |
| `Orphan` | 会 | 保留 dependents | 残留一堆没人接管的对象 |

如果你要显式指定，可以这样做：

```bash
kubectl delete deployment demo --cascade=foreground
kubectl delete deployment demo --cascade=background
kubectl delete deployment demo --cascade=orphan
```

## 6. 什么情况最容易把资源卡在 `Terminating`

### 6.1 Finalizer 没人处理

这是最常见的一类。

典型场景：

- Operator 已经被卸载，但它加过的 finalizer 还留在 CR 上
- controller 代码有 bug，清理完成后忘了 remove finalizer
- 外部 API 一直失败，控制器清理动作始终重试不成功
- 清理逻辑不是幂等的，重试几次后把自己卡死

表象通常是：

- `deletionTimestamp` 已经有了
- `metadata.finalizers` 一直不为空
- 对象长期卡在 `Terminating`

### 6.2 Pod 退出链路没走完

这类经常被误判成 finalizer 问题。

更常见的根因其实是：

- `preStop` 钩子阻塞太久
- 应用不处理 `SIGTERM`
- `terminationGracePeriodSeconds` 太长或始终耗尽
- 卷卸载卡住
- 节点或 kubelet 不可达，控制面想删但节点侧没完成执行

所以看到 Pod `Terminating` 时，不要第一反应就去 patch finalizers。

先分清：

- 是**退出没走完**
- 还是**对象删除没走完**

### 6.3 前台删除在等下游对象

如果你用的是 `Foreground`，或者系统因为 owner/dependent 关系在做前台级联删除，就会出现：

- owner 卡着不消失

这时应该优先去看：

- dependents 是否仍然存在
- dependents 上是否自己也有 finalizer
- 是否有 child 对象本身已经卡住

真正阻塞 owner 删除的，常常不是 owner 自己，而是：

- 下游没删完

### 6.4 节点失联或网络分区

这类在 Pod 删除时尤其常见。

控制面已经看到：

- 对象有 `deletionTimestamp`

但节点一侧可能仍然是：

- kubelet 没收到删除
- 容器进程还在跑
- 卷和网络清理没有执行完成

这时 API 里的 `Terminating`，不等于节点侧的进程已经停掉。  
这也是为什么节点失联问题要和删除边界一起看。

### 6.5 手工强拆留下半截现场

例如：

- 直接 `--force --grace-period=0`
- 没看清 finalizer 作用就强行清空
- 删了 owner，却没处理 orphan dependents

结果往往是：

- API 看起来干净了
- 外部资源、卷、DNS、云账号、负载均衡规则却还残着

## 7. 什么时候可以手工移除 finalizers，什么时候别动

官方文档对这件事的态度很明确：

- 不要把“手工删 finalizer”当成常规修复手段

更稳的判断标准是：

### 7.1 可以考虑动手的前提

1. 你已经明确知道这个 finalizer 是谁加的、负责清什么
2. 对应控制器已经永久下线，或者短期内不可能恢复
3. 该清理动作已经人工完成，或者你明确接受残留风险
4. 这是测试环境、一次性环境，资源残留代价可接受

### 7.2 明显不该直接动手的场景

1. 你不知道 finalizer 的语义，只是因为对象删不掉
2. 资源背后还连着真实云资源、磁盘、LB、DNS、账号
3. 这是 StatefulSet、数据库、消息队列、选主系统等状态型组件
4. 节点失联尚未排清，无法确认原进程是否真的停掉

### 7.3 真要人工处理，顺序应该是

1. 先确认控制器职责和外部资源清理项
2. 先人工完成必要收尾
3. 再 patch 掉 finalizers
4. 最后复核有没有遗留 dependents 或外部资源

例如：

```bash
kubectl patch myresource demo \
  --type=merge \
  -p '{"metadata":{"finalizers":[]}}'
```

这条命令能解决的是：

- “别再等了，直接放行删除”

它解决不了的是：

- 那些本来应该被清理、但你现在跳过了的真实资源后果

## 8. Operator / CRD 里 Finalizer 的正确工程实践

如果你在写自定义控制器，Finalizer 这块是典型高风险点。

一个比较稳的原则清单是：

### 8.1 只有在“确实有删除前置动作”时才加 finalizer

不要因为“看起来专业”就给所有 CR 都加 finalizer。

更合理的使用场景是：

- 要删外部云资源
- 要摘 DNS / 注册中心 / 账号权限
- 要做有顺序要求的清理动作

如果只是：

- 单纯删掉一堆 K8s 下游对象

很多场景直接靠：

- `ownerReferences + garbage collection`

就够了。

### 8.2 删除分支必须幂等

因为 delete 状态下的 reconcile 会反复执行。

所以清理逻辑必须满足：

- 多执行几次不会出错
- 外部资源已经不存在时也能安全返回
- 失败可重试，不会越重试越乱

### 8.3 状态要写清楚

如果 finalizer 卡住，用户至少应该能从 `status.conditions` 或事件里看出来：

- 卡在清理哪一步
- 最近一次失败原因是什么
- 是否还在重试

否则现场只会看到一个：

- `Terminating`

但谁也不知道卡在哪。

### 8.4 卸载 Operator 之前，先处理它管理的 CR

这是非常高频的生产坑。

错误顺序是：

1. 先删 Operator / controller
2. 再删 CR

结果就是：

- CR 上 finalizer 永远没人清

正确顺序通常应该是：

1. 先让 controller 正常清完 CR
2. 再下线 Operator

## 9. 最常见的坑

### 坑 1：把 delete 理解成瞬时动作

在 Kubernetes 里，delete 更像“启动删除流程”，不是“立即物理删完”。

### 坑 2：看到 `Terminating` 就一律怪 finalizer

Pod 的 `Terminating` 很多时候卡在：

- 应用退出
- 卷卸载
- 节点失联

不是 finalizer。

### 坑 3：所有自定义资源都默认加 finalizer

没有真实删除前置动作的 finalizer，只是在制造未来的卡死点。

### 坑 4：删除 owner 时，不知道默认级联和传播策略

最后会把：

- owner 先消失
- owner 卡着等 child
- child 被 orphan 留下

这三种完全不同的现场混成一句话。

### 坑 5：先卸载 Operator，再删它的 CR

这是自定义资源卡 `Terminating` 的经典根因。

### 坑 6：把“手工删 finalizer”当成标准运维动作

短期看像是修好了，长期看很容易留下：

- 孤儿资源
- 漏清理
- 账单资源残留
- 状态不一致

## 10. 排障时建议按这条顺序看

如果一个对象长期卡在 `Terminating`，建议按这个顺序排：

1. 先 `kubectl get -o yaml`，确认 `deletionTimestamp`、`finalizers`、`ownerReferences`、`deletionGracePeriodSeconds`
2. 先分清这是 Pod 还是控制面对象，不要拿同一套口径解释
3. 如果 `finalizers` 不为空，先找是谁加的，再查对应 controller / operator 是否还活着、日志是否在报清理失败
4. 如果是 owner 删除，继续看 dependents 是否还在，是否用了 `Foreground`，child 上是否也有 finalizer
5. 如果是 Pod，继续查 `preStop`、应用是否处理 `SIGTERM`、卷卸载、kubelet 和节点状态
6. 如果节点失联，额外确认 API 对象删除和节点侧进程退出是否已经一致
7. 只有在职责已搞清、收尾已确认的前提下，才考虑手工移除 finalizer 或 force delete

这条顺序的核心不是命令顺序，而是：

- **先分边界，再找阻塞点**

## 11. 面试里怎么把这题答顺

如果面试官问：

> 为什么 Kubernetes 里对象 delete 之后还会卡在 `Terminating`？Finalizer 和垃圾回收是什么关系？

可以这样答：

> 我会先说明，Kubernetes 的 delete 不是立刻物理删除，而是先给对象写 `deletionTimestamp`，对象进入删除进行中状态；  
> 如果对象上有 `metadata.finalizers`，对应控制器要先完成清理，再把 finalizer 去掉，对象才能真正删掉；  
> 同时如果对象和下游资源之间有 `ownerReferences`，垃圾回收器还会根据 `Background / Foreground / Orphan` 传播策略决定 dependents 怎么处理；  
> 所以资源卡在 `Terminating`，常见不是 apiserver 卡死，而是 finalizer 没清、下游对象没删完，或者 Pod 自己的退出链路还没走完；  
> 其中 Pod 的 `Terminating` 还要额外区分 `preStop`、`SIGTERM`、卷卸载和节点失联，不能和普通控制面对象混着答。  

## 12. 最后记住这句话

> 在 Kubernetes 里，删除不是一个瞬时动作，而是一条收敛链路：先打删除标记，再处理退出和清理，最后才真正从 API 里消失。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [控制面主线实战](./control-plane-mainline.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [etcd 专题](/etcd/)
