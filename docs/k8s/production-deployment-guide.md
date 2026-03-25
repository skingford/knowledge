---
title: 实战部署指南
description: 按集群规模给出两套生产部署方案——小集群够用省事，大集群高可用精细治理，覆盖搭建、网络、存储、发布、资源、安全、观测与容灾。
---

# 实战部署指南

前面的文章把 K8s 的每个机制都拆开讲了，但真正要把服务落到生产环境时，问题变成了：

- 我的集群该怎么搭
- 网络、存储、发布怎么选
- 安全基线做到什么程度够用
- 监控告警怎么配
- 多大的集群需要什么级别的治理

这篇不讲原理，只讲方案选型和落地清单。按集群规模分成两条线：

- **小集群**：< 50 节点，单团队或少量团队，SLA 要求 99.9%
- **大集群**：100+ 节点，多团队共享，SLA 要求 99.95%+

每个环节先给小集群的"够用方案"，再给大集群的"完整方案"，根据自己的规模取舍。

<K8sDiagram kind="production-deployment-overview" />

## 1. 先判断你的集群规模

不要只看节点数，还要看团队和业务复杂度：

| 维度 | 小集群 | 大集群 |
| --- | --- | --- |
| 节点数 | < 50 | 100+ |
| 团队数 | 1-3 个 | 5+ 个 |
| 服务数 | < 50 | 100+ |
| SLA | 99.9%（月停机 < 44 分钟） | 99.95%+（月停机 < 22 分钟） |
| 环境数 | dev + prod | dev + staging + prod（可能多区域） |
| 合规要求 | 基础 | 审计、等保、行业合规 |

一句话判断：

> 如果你觉得"一个人就能管整个集群"，那大概率是小集群；如果需要"平台团队"来管集群，那就是大集群。

## 2. 集群搭建

### 小集群方案

**推荐：云托管 K8s**（EKS / GKE / AKS / ACK）

- 控制面由云厂商维护，不需要管 etcd 和 apiserver
- 节点用托管节点池，自动修补和升级
- 单可用区就够用，成本最低

```
控制面：云托管（免运维）
节点池：1 个通用池，按需 + 预留混合
可用区：单 AZ 或双 AZ
K8s 版本：跟随云厂商推荐的稳定版
```

如果预算更紧或边缘场景，可以用 **k3s**（单 binary，内建 SQLite 替代 etcd）。

### 大集群方案

**推荐：多 AZ 托管 K8s + 节点池分组**

```
控制面：云托管（多 AZ 高可用）
节点池：
  - system 池：跑系统组件（CoreDNS、Ingress Controller、监控 Agent）
  - app 池：跑业务 Pod，按 CPU/内存密集型拆分
  - spot/抢占池：跑可中断任务（批处理、CI）
可用区：至少 3 AZ
K8s 版本：N-1 稳定版，先在 staging 升级验证
```

关键实践：

- system 池加 taint `node-role=system:NoSchedule`，避免业务 Pod 挤占系统资源
- spot 池加 taint `spot=true:NoSchedule`，只有配了 toleration 的 Pod 才会调度上去
- 节点池设置 `maxPods` 和 `maxNodeCount`，防止单池无限扩张

## 3. 网络方案

### 小集群方案

```
CNI：云厂商默认（AWS VPC CNI / GKE 默认 / Flannel）
Service 暴露：LoadBalancer 类型 Service
入口：一个 Ingress Controller（ingress-nginx）
NetworkPolicy：暂不需要（信任集群内流量）
```

够用标准：服务能被外部访问，内部 DNS 解析正常，不需要精细的东西向控制。

### 大集群方案

```
CNI：Cilium（推荐）或 Calico
  - 支持 NetworkPolicy、eBPF 加速、可观测性
Service 暴露：LoadBalancer + IngressClass 分组
入口：
  - 外部流量：ingress-nginx 或 Gateway API
  - 内部 API：独立 IngressClass 或 Service Mesh
NetworkPolicy：按 Namespace 默认拒绝 + 白名单放行
Service Mesh：按需引入 Istio / Linkerd（mTLS + 灰度 + 可观测）
```

关键实践：

- 每个 Namespace 下一条默认拒绝的 NetworkPolicy
- DNS：调整 `ndots` 避免不必要的搜索域查询
- 大流量场景评估 kube-proxy 切 IPVS 模式

## 4. 存储方案

### 小集群方案

```
StorageClass：云厂商默认（gp3 / pd-balanced）
动态供给：PVC 直接用默认 StorageClass
备份：云盘快照（手动或定时脚本）
```

### 大集群方案

```
StorageClass 分级：
  - standard：通用 SSD（大部分业务）
  - fast：高 IOPS SSD（数据库）
  - shared：NFS / EFS（多 Pod 共享读写）
备份：Velero 定时备份 PV + etcd
回收策略：Retain（生产环境），Delete 仅限非关键数据
跨 AZ：确保 PV 和 Pod 在同一 AZ，或用支持跨 AZ 的存储方案
```

关键实践：

- `reclaimPolicy: Retain` 避免误删数据
- StatefulSet 的 PVC 删除需要手动确认
- 定期验证备份恢复流程

## 5. 发布流程

### 小集群方案

```
打包：Helm Chart
CI：GitHub Actions / GitLab CI
部署：CI 流水线里 helm upgrade
回滚：helm rollback
```

典型流水线：

```
代码 push → CI 构建镜像 → push Registry → helm upgrade --install
```

够用标准：每次发布有记录，能一键回滚。

### 大集群方案

```
打包：Helm Chart + Kustomize overlay
GitOps：ArgoCD（推荐）
仓库：代码仓库 + 配置仓库分离
发布策略：
  - staging 自动同步
  - prod 手动 Sync 或 PR 审批触发
灰度：
  - Deployment 滚动更新（默认）
  - 需要流量灰度时接 Istio / Argo Rollouts
```

典型流水线：

```
代码 push → CI 构建镜像 → 更新配置仓库 image tag → ArgoCD 检测并同步
```

关键实践：

- 镜像用 digest 而非 tag 引用，防止 tag 被覆盖
- 配置仓库的 prod 目录变更必须走 PR review
- ArgoCD 开启 `selfHeal: true` 防止手动漂移

## 6. 资源与调度

### 小集群方案

```yaml
# 每个 Deployment 都配 requests 和 limits
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

- 所有 Pod 都配 requests（不配 requests 是集群不稳定的最大根源）
- 用 HPA 做基础弹性扩缩容
- 不需要 PriorityClass 和 Namespace 配额

### 大集群方案

```
Namespace 配额：每个团队一个 Namespace + ResourceQuota + LimitRange
PriorityClass：
  - system-critical（系统组件）
  - high（核心业务）
  - default（普通业务）
  - low（批处理、可抢占）
弹性：
  - HPA 按 CPU/内存/自定义指标
  - VPA 辅助推荐 requests
  - Cluster Autoscaler 管节点池扩缩
调度：
  - 关键服务配 podAntiAffinity 跨节点打散
  - topologySpreadConstraints 跨 AZ 分布
  - system 池和 spot 池用 taint/toleration 隔离
```

关键实践：

- `LimitRange` 设置默认 requests，兜底没配资源的 Pod
- 定期用 `kubectl top` 或 VPA 推荐值校准 requests

## 7. 安全基线

### 小集群方案

做到这 5 条就够用：

1. **RBAC**：不给 cluster-admin，按 Namespace 授权
2. **Pod Security**：Namespace 加 `pod-security.kubernetes.io/enforce: restricted`
3. **镜像**：只允许从可信仓库拉取
4. **Secret**：不在 Git 里明文存 Secret，用 CI 变量注入
5. **网络**：限制 apiserver 访问来源 IP

### 大集群方案

在小集群基础上加：

6. **准入策略**：OPA Gatekeeper 或 Kyverno 统一策略
7. **Secret 外部管理**：ESO + Vault / 云 KMS
8. **etcd 加密**：开启 at-rest encryption
9. **审计日志**：开启 API Audit，Warning 以上写日志
10. **镜像签名**：Cosign 签名 + Admission 校验
11. **NetworkPolicy**：Namespace 级默认拒绝
12. **ServiceAccount**：关闭自动挂载 token（`automountServiceAccountToken: false`）

安全基线检查清单：

```bash
# 检查是否有 cluster-admin 绑定给普通用户
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects'

# 检查 Namespace 是否设置了 Pod Security
kubectl get ns --show-labels | grep pod-security

# 检查是否有 Pod 以 root 运行
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name}: {.spec.securityContext.runAsNonRoot}{"\n"}{end}'
```

## 8. 可观测性

### 小集群方案

```
指标：Prometheus（kube-prometheus-stack 一键部署） + Grafana
日志：Fluent Bit → Loki（Grafana 查询）
告警：Prometheus AlertManager → Slack/钉钉
```

开箱即用仪表盘：

- Node Exporter 节点概览
- kube-state-metrics 集群对象状态
- CoreDNS 查询监控

### 大集群方案

```
指标：
  - Prometheus + Thanos（长期存储 + 全局查询）
  - 或云托管 Prometheus（省运维）
日志：
  - Fluent Bit → Elasticsearch（大量日志）或 Loki（轻量）
  - 日志分级：错误 90 天、普通 14 天、审计 365 天
链路追踪：
  - OpenTelemetry Collector → Jaeger / Tempo
告警：
  - 分级：P0（立即处理）/ P1（1 小时内）/ P2（工作时间）
  - 收敛：AlertManager 按 group/inhibit 去重
  - 值班：PagerDuty / 飞书机器人
```

关键实践：

- Prometheus 标签基数控制，禁止用 Pod IP、request ID 做标签
- 告警必须可操作，"CPU > 80% 持续 5 分钟"不如"请求延迟 P99 > 500ms 持续 3 分钟"
- 定期告警 review，删除无人处理的告警

## 9. 高可用与容灾

### 小集群方案

做到这 3 条：

1. **多副本**：核心服务 replicas >= 2
2. **PDB**：关键服务配 `minAvailable: 1`
3. **探针**：正确配置 readiness + liveness

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

### 大集群方案

在小集群基础上加：

4. **跨 AZ 打散**：`topologySpreadConstraints` 确保副本分布在不同可用区
5. **etcd 备份**：定时快照 + 异地存储
6. **Velero 集群备份**：定时备份资源定义 + PV 快照
7. **故障演练**：
   - 定期模拟节点故障（cordon + drain）
   - 模拟 AZ 故障（关闭一个 AZ 的节点）
   - 验证备份恢复流程
8. **多集群**：极高 SLA 场景考虑 active-active 双集群

```yaml
# 跨 AZ 打散
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: my-app
```

关键实践：

- 每季度做一次故障演练，验证 PDB、探针、自动迁移是否生效
- etcd 备份恢复流程至少演练过一次
- 记录 RTO（恢复时间目标）和 RPO（恢复点目标）

## 10. 部署清单速查

### 小集群启动清单

- [ ] 云托管 K8s 集群创建，节点池配置
- [ ] ingress-nginx 部署 + LoadBalancer
- [ ] kube-prometheus-stack 部署（Prometheus + Grafana）
- [ ] Fluent Bit + Loki 日志采集
- [ ] Namespace RBAC 配置
- [ ] Pod Security Standards restricted 启用
- [ ] 核心服务 Helm Chart + CI 流水线
- [ ] 核心服务 requests/limits + readiness/liveness 配置
- [ ] 核心服务 replicas >= 2 + PDB
- [ ] 镜像仓库 + 拉取凭证配置

### 大集群启动清单

在小集群清单基础上加：

- [ ] 多 AZ 节点池（system / app / spot）
- [ ] Cilium 或 Calico CNI + NetworkPolicy 默认拒绝
- [ ] ArgoCD 部署 + 配置仓库建立
- [ ] Namespace + ResourceQuota + LimitRange 规划
- [ ] PriorityClass 分级配置
- [ ] OPA Gatekeeper 或 Kyverno 策略部署
- [ ] ESO + Vault / 云 KMS Secret 管理
- [ ] API 审计日志开启
- [ ] Thanos 或托管 Prometheus 长期存储
- [ ] OpenTelemetry Collector 部署
- [ ] 告警分级 + 值班流程建立
- [ ] Velero 备份配置 + 恢复演练
- [ ] topologySpreadConstraints 跨 AZ 打散
- [ ] 镜像签名 + 准入校验

## 11. 最容易踩的坑

**坑 1：不配 requests 导致集群雪崩**

没有 requests 的 Pod 会被调度到任何节点，节点资源被透支后所有 Pod 一起抖。这是生产集群最常见的稳定性问题。

**坑 2：小集群上了太重的方案**

3 个节点的集群不需要 Istio + Thanos + ArgoCD + OPA，每个组件都消耗资源和运维精力。先做够用的，等规模上来再加。

**坑 3：大集群没做 Namespace 隔离**

多团队共享集群不设配额和网络策略，一个团队的 Pod 吃光资源或误访问另一个团队的服务，出了问题没法追责。

**坑 4：只做了部署没做回滚**

每次发布前确认 rollback 命令能跑通。Helm rollback、ArgoCD revert、kubectl rollout undo，至少熟练一种。

**坑 5：备份从来没恢复验证过**

备份不等于可恢复。etcd 快照、Velero 备份，至少在 staging 环境恢复过一次。

> 生产部署不是"跑起来了就行"，而是"跑起来之后，能扛住故障、能安全发布、能快速恢复、能持续观测"。小集群先做对基本面，大集群再叠加治理层。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md)
- [Pod 生命周期与探针实战](./pod-lifecycle-and-probes.md)
- [调度与驱逐链路实战](./scheduling-and-eviction.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [副本打散与拓扑高可用实战](./replica-spread-and-topology-ha.md)
- [零停机发布链路实战](./zero-downtime-rollout.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [Namespace 资源治理与配额边界实战](./namespace-resource-governance-and-quota.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md)
- [Helm 与包管理实战](./helm-and-package-management.md)
- [GitOps 与持续交付实战](./gitops-and-delivery.md)
- [可观测性与监控实战](./observability-and-monitoring.md)
- [CRD、Operator 与扩展机制实战](./crd-operator-and-extension.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
