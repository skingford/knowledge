---
title: 可观测性与监控实战
description: 系统讲清 K8s 可观测性三大支柱（指标、日志、链路追踪）的落地方式，以及 Metrics Server、Prometheus、Fluent Bit、OpenTelemetry 在集群中的角色边界。
---

# 可观测性与监控实战

K8s 让应用跑起来之后，排障难度比传统部署高了一个量级：

- Pod 随时被调度到不同节点，日志散落在多台机器上
- 一个请求可能经过 Ingress → Service → Sidecar → 应用，任一环节都可能出问题
- HPA 扩缩容、节点驱逐、滚动发布都在后台自动执行，肉眼很难跟踪

如果没有可观测性体系，团队只能靠 kubectl describe 和 logs 逐个排查，效率极低。

这篇不讲每个工具的安装教程，而是拆清"指标、日志、链路追踪"三条线分别解决什么、怎么落地、边界在哪。

<K8sDiagram kind="observability-stack" />

## 1. 可观测性三大支柱

| 支柱 | 回答的问题 | 典型工具 |
| --- | --- | --- |
| **指标（Metrics）** | 系统现在怎么样？趋势如何？ | Metrics Server、Prometheus、Grafana |
| **日志（Logs）** | 刚才发生了什么？ | Fluent Bit、Fluentd、Loki、ELK |
| **链路追踪（Traces）** | 这个请求经过了哪些环节？哪里慢？ | OpenTelemetry、Jaeger、Tempo |

三者互补，不是替代关系：

- 指标告诉你"哪里出了问题"
- 日志告诉你"问题的具体现场"
- 链路追踪告诉你"请求卡在哪个环节"

## 2. 指标：从 Metrics Server 到 Prometheus

### 2.1 Metrics Server：最基础的资源指标

Metrics Server 是集群内建的轻量指标服务，提供：

- `kubectl top node` — 节点 CPU/内存用量
- `kubectl top pod` — Pod CPU/内存用量
- HPA 自动扩缩容的指标来源

它只保存最近几分钟的数据，不支持历史查询，不支持自定义指标。

**定位**：HPA 的数据源 + 快速查看实时用量，不是监控系统。

### 2.2 Prometheus：K8s 监控的事实标准

Prometheus 是 CNCF 毕业项目，几乎是 K8s 监控的标配。

核心架构：

```
应用/组件 暴露 /metrics 端口
       ↓
Prometheus Server 定时拉取（Pull）
       ↓
TSDB 存储时序数据
       ↓
PromQL 查询 → Grafana 展示
       ↓
AlertManager → 告警通知
```

### 2.3 K8s 内建暴露的指标

| 来源 | 暴露方式 | 包含什么 |
| --- | --- | --- |
| kubelet | `/metrics` 和 `/metrics/cadvisor` | 节点和容器级 CPU/内存/网络/磁盘 |
| kube-apiserver | `/metrics` | API 请求延迟、QPS、错误率 |
| kube-scheduler | `/metrics` | 调度延迟、调度失败次数 |
| kube-controller-manager | `/metrics` | 各控制器 reconcile 延迟、队列深度 |
| etcd | `/metrics` | 读写延迟、WAL 同步耗时 |
| CoreDNS | `/metrics` | DNS 查询 QPS、延迟、缓存命中率 |

### 2.4 ServiceMonitor：声明式的采集配置

用了 prometheus-operator 后，不需要手动改 Prometheus 配置文件，而是通过 CRD 声明采集目标：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

### 2.5 常用告警规则

| 场景 | PromQL 示例 |
| --- | --- |
| Pod 持续重启 | `increase(kube_pod_container_status_restarts_total[1h]) > 3` |
| 节点 CPU 持续高 | `node_cpu_seconds_total` idle 占比 < 10% |
| API 5xx 飙升 | `rate(apiserver_request_total{code=~"5.."}[5m])` |
| PVC 接近满 | `kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.85` |

## 3. 日志：采集、聚合与查询

### 3.1 K8s 日志架构

Pod 日志的标准路径：

```
容器 stdout/stderr
       ↓
容器运行时写入节点目录（/var/log/containers/）
       ↓
日志采集 Agent（DaemonSet）读取
       ↓
发送到后端（Loki / Elasticsearch / S3）
       ↓
查询界面（Grafana / Kibana）
```

### 3.2 采集方案对比

| 方案 | 特点 | 适合场景 |
| --- | --- | --- |
| **Fluent Bit** | 轻量、低资源、Go+C 实现 | 首选，适合大多数集群 |
| **Fluentd** | 插件丰富、Ruby 实现 | 需要复杂解析和路由 |
| **Promtail** | Loki 配套采集器 | 全 Grafana 栈 |
| **Vector** | Rust 实现、高性能 | 高吞吐场景 |

### 3.3 Fluent Bit 典型部署

以 DaemonSet 部署，每个节点一个采集 Pod：

- 挂载 `/var/log/containers/` 读取容器日志
- 自动附加 K8s 元数据（Pod 名、namespace、labels）
- 按规则过滤、解析后发送到后端

### 3.4 日志分级策略

| 级别 | 保留策略 | 用途 |
| --- | --- | --- |
| 应用错误日志 | 30-90 天 | 排障、复盘 |
| 应用普通日志 | 7-14 天 | 日常观察 |
| 系统组件日志 | 14-30 天 | 控制面排障 |
| 审计日志 | 90-365 天 | 合规、安全审计 |

## 4. 链路追踪：OpenTelemetry

### 4.1 解决什么问题

一个用户请求从入口到返回，可能经过：

```
LB → Ingress → Service A → Service B → DB
```

链路追踪记录每一跳的耗时和状态，帮助定位：

- 哪个服务耗时最长
- 错误发生在哪一跳
- 上下游依赖关系

### 4.2 OpenTelemetry 在 K8s 中的角色

OpenTelemetry（OTel）是 CNCF 项目，提供统一的可观测性数据采集标准：

| 组件 | 职责 |
| --- | --- |
| **SDK** | 应用内埋点，生成 trace/metrics/logs |
| **Collector** | 接收、处理、导出遥测数据 |
| **Exporter** | 将数据发送到后端（Jaeger、Tempo、Prometheus） |

### 4.3 典型部署模式

```
应用（集成 OTel SDK）
       ↓ OTLP 协议
OTel Collector（DaemonSet 或 Deployment）
       ↓
Jaeger / Tempo / Zipkin（存储与查询）
       ↓
Grafana（展示）
```

### 4.4 自动注入（无侵入方案）

OTel Operator 支持通过 annotation 自动注入 instrumentation：

```yaml
metadata:
  annotations:
    instrumentation.opentelemetry.io/inject-java: "true"
```

支持 Java、Python、Node.js、.NET、Go 等语言，降低应用改造成本。

## 5. 常见监控架构组合

### 5.1 轻量方案

```
Metrics Server + Prometheus + Grafana + Fluent Bit + Loki
```

适合中小集群，全 Grafana 栈，运维成本低。

### 5.2 全功能方案

```
Prometheus + Grafana + Fluent Bit + Elasticsearch + Kibana + Jaeger + OTel Collector
```

适合大规模生产环境，指标/日志/追踪分别用专业后端。

### 5.3 云托管方案

各云厂商通常提供托管的 Prometheus、日志服务和链路追踪，减少自运维负担。

## 6. 最容易踩的坑

**坑 1：只看 Pod 日志，不看 Events**

很多 K8s 层面的问题（调度失败、挂载失败、探针失败）不会出现在应用日志里，只在 Events 中。

**坑 2：Prometheus 吃掉大量内存**

高基数标签（如 Pod IP、request ID）会导致时序数据爆炸。标签设计要控制基数。

**坑 3：日志采集 Agent 影响业务 Pod**

DaemonSet 的 Agent 如果没设 resource limits，可能在日志突增时抢占节点资源。

**坑 4：链路追踪只接了一半**

如果调用链中有一个服务没接 OTel，trace 会断裂，排障时看到的链路不完整。

**坑 5：告警太多导致 alert fatigue**

告警规则应该对应"需要人介入的场景"，不是"任何指标偏离正常值"。

## 7. 面试答法

被问"K8s 可观测性怎么做"时：

1. **三大支柱** — 指标（Prometheus）告诉你"有问题"，日志（Fluent Bit + Loki/ES）告诉你"现场"，链路追踪（OTel + Jaeger）告诉你"卡在哪"
2. **Metrics Server 和 Prometheus 的区别** — Metrics Server 是实时快照，给 HPA 和 kubectl top 用；Prometheus 是完整时序数据库，支持历史查询和告警
3. **采集架构** — 指标靠 Prometheus Pull，日志靠 DaemonSet Agent 从节点读取，追踪靠应用 SDK 主动上报
4. **落地要点** — 标签基数控制、日志分级保留、告警收敛，避免数据爆炸和 alert fatigue

> 可观测性不是"装了 Grafana 就有了"，而是指标、日志、链路追踪三条线各自到位，并且在排障时能快速从一条线跳转到另一条线。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [弹性扩缩容与容量协同实战](./autoscaling-and-capacity-control-chain.md)
- [资源规格与运行时压力实战](./resource-specs-and-runtime-pressure.md)
- [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [CRD、Operator 与扩展机制实战](./crd-operator-and-extension.md)
- [API 审计、Audit Policy 与审计日志边界实战](./api-auditing-and-audit-policy-boundary.md)
