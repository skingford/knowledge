---
title: kubectl 排障速查
description: 系统整理 kubectl 排障常用命令、Pod 状态判断流程、事件与日志定位方法，以及临时调试容器的使用边界。
---

# kubectl 排障速查

线上出问题时，很多人习惯直接去看应用日志或者 Dashboard。但大部分 K8s 层面的问题，用 kubectl 就能在 30 秒内定位到方向。

这篇不是 kubectl 命令大全，而是整理最常用的排障路径：

- Pod 起不来，先看什么
- Pod 在跑但服务不通，怎么查
- 节点异常，怎么快速确认
- 怎么进容器调试，什么时候用临时容器

<K8sDiagram kind="kubectl-troubleshooting-flow" />

## 1. Pod 起不来：第一步永远是 describe

Pod 状态不正常时，`kubectl get pod` 只能告诉你现象，`describe` 才能告诉你原因。

```bash
kubectl describe pod <pod-name> -n <namespace>
```

重点看最后的 **Events** 部分：

| 常见事件 | 说明 | 排查方向 |
| --- | --- | --- |
| `FailedScheduling` | 调度失败 | 资源不足、亲和性不满足、污点不容忍 |
| `FailedMount` | 卷挂载失败 | PVC 未绑定、CSI 异常、节点上卷已被占用 |
| `ImagePullBackOff` | 拉镜像失败 | 镜像名写错、私有仓库认证失败、网络不通 |
| `CrashLoopBackOff` | 容器反复崩溃重启 | 应用启动报错、探针配置过严、OOM |
| `Unhealthy` | 探针失败 | 路径错误、端口不对、应用还没就绪 |

一句话记忆：

> `get pod` 看现象，`describe pod` 看事件，事件指向的才是真正的排障入口。

## 2. 看日志：logs 的常用姿势

### 2.1 基础用法

```bash
# 看当前容器日志
kubectl logs <pod-name> -n <namespace>

# 看上一次崩溃的日志（CrashLoopBackOff 必用）
kubectl logs <pod-name> -n <namespace> --previous

# 多容器 Pod 指定容器
kubectl logs <pod-name> -c <container-name> -n <namespace>

# 持续跟踪
kubectl logs <pod-name> -n <namespace> -f

# 只看最近 100 行
kubectl logs <pod-name> -n <namespace> --tail=100

# 只看最近 5 分钟
kubectl logs <pod-name> -n <namespace> --since=5m
```

### 2.2 常见踩坑

- `--previous` 只能看到上一次容器退出的日志，再往前的看不到
- 如果容器一直在 `ContainerCreating`，它根本没有日志，应该看 events
- Init 容器的日志需要 `-c <init-container-name>` 指定

## 3. 进容器调试：exec 与临时容器

### 3.1 exec 进入运行中的容器

```bash
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh
```

适合：

- 检查容器内文件、环境变量、网络连通性
- 手动执行命令验证应用行为

不适合：

- 容器已经崩溃（exec 进不去）
- 镜像里没有 shell（distroless / scratch）

### 3.2 临时调试容器（ephemeral container）

当容器镜像没有 shell 或者容器已经出问题时：

```bash
kubectl debug -it <pod-name> -n <namespace> \
  --image=busybox:latest \
  --target=<container-name>
```

- `--target` 让调试容器共享目标容器的进程命名空间
- 调试容器有自己的文件系统，但能看到目标容器的进程
- 需要集群版本 >= 1.23 且启用了 `EphemeralContainers`

### 3.3 用节点调试容器排查节点问题

```bash
kubectl debug node/<node-name> -it --image=ubuntu
```

这会在目标节点上启动一个特权 Pod，挂载节点的根文件系统到 `/host`。

## 4. 网络不通：快速定位三板斧

### 4.1 确认 Pod 网络

```bash
# 看 Pod IP
kubectl get pod <pod-name> -n <namespace> -o wide

# 从一个临时 Pod 测连通性
kubectl run test-net --rm -it --image=busybox -- wget -qO- http://<service-name>.<namespace>.svc.cluster.local
```

### 4.2 确认 Service 后端

```bash
# 看 Service 的 selector 和端口
kubectl describe svc <service-name> -n <namespace>

# 看 EndpointSlice 有没有后端
kubectl get endpointslice -n <namespace> -l kubernetes.io/service-name=<service-name>
```

如果 Endpoints 为空，说明要么 selector 没匹配到 Pod，要么 Pod 的 readiness 没通过。

### 4.3 确认 DNS 解析

```bash
kubectl run test-dns --rm -it --image=busybox -- nslookup <service-name>.<namespace>.svc.cluster.local
```

## 5. 资源与状态速查

### 5.1 节点状态

```bash
# 看节点资源分配
kubectl describe node <node-name> | grep -A 10 "Allocated resources"

# 看节点条件（Ready、MemoryPressure、DiskPressure）
kubectl get node <node-name> -o jsonpath='{.status.conditions[*].type}'

# 看节点上的 Pod
kubectl get pod --field-selector spec.nodeName=<node-name> -A
```

### 5.2 资源用量

```bash
# Pod 实际用量（需要 Metrics Server）
kubectl top pod -n <namespace>

# 节点实际用量
kubectl top node
```

### 5.3 事件全局查看

```bash
# 按时间排序看命名空间事件
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# 只看 Warning 事件
kubectl get events -n <namespace> --field-selector type=Warning
```

## 6. 常见状态速查表

| STATUS | 含义 | 第一步排查 |
| --- | --- | --- |
| `Pending` | 等待调度或资源 | `describe pod` 看 Events |
| `ContainerCreating` | 正在拉镜像或挂卷 | `describe pod` 看 Events |
| `ImagePullBackOff` | 镜像拉取失败 | 检查镜像名、仓库认证、网络 |
| `CrashLoopBackOff` | 容器反复崩溃 | `logs --previous` 看退出原因 |
| `Running` 但不 Ready | 探针没通过 | 检查 readinessProbe 配置 |
| `OOMKilled` | 内存超限 | 加大 limits 或排查内存泄漏 |
| `Evicted` | 节点资源压力驱逐 | `describe node` 看 Conditions |
| `Terminating` | 删除中 | 检查 finalizers、preStop 钩子 |
| `Unknown` | 节点失联 | 检查节点状态和网络 |
| `Error` | 容器非零退出 | `logs --previous` 看退出原因 |

## 7. 实用组合命令

```bash
# 快速看某个 Deployment 下所有 Pod 的状态
kubectl get pod -n <namespace> -l app=<app-name> -o wide

# 看 Deployment 的滚动发布状态
kubectl rollout status deployment/<name> -n <namespace>

# 看 Deployment 历史版本
kubectl rollout history deployment/<name> -n <namespace>

# 回滚到上一个版本
kubectl rollout undo deployment/<name> -n <namespace>

# 导出当前对象的 YAML（排障时用来对比）
kubectl get deployment <name> -n <namespace> -o yaml

# 批量看某个命名空间所有资源
kubectl get all -n <namespace>

# 看资源的 API 字段说明
kubectl explain pod.spec.containers.livenessProbe
```

## 8. 排障决策树

遇到 Pod 问题时，按这个顺序走：

1. `kubectl get pod -n <ns>` — 先看 STATUS 和 RESTARTS
2. 如果 `Pending` → `describe pod` 看调度事件
3. 如果 `ImagePullBackOff` → 检查镜像名和拉取凭证
4. 如果 `CrashLoopBackOff` → `logs --previous` 看上次退出原因
5. 如果 `Running` 但不 Ready → 检查 readinessProbe
6. 如果 `Running` 且 Ready 但服务不通 → 查 Service、EndpointSlice、DNS
7. 如果 `OOMKilled` → 查 limits 配置和应用内存用量
8. 如果 `Evicted` → `describe node` 看节点压力

> 排障的核心不是背命令，而是先判断问题发生在哪一层：调度层、容器层、网络层还是节点层，再用对应的命令去确认。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [高频问题清单](./essential-questions.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
