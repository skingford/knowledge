---
title: K8s 固定入口、固定出口与白名单实战
description: 系统整理 Kubernetes 中 Pod 动态 IP、固定入口 IP、固定出口 IP、第三方白名单、真实客户端 IP 保留和常见反模式。
---

# K8s 固定入口、固定出口与白名单实战

这类问题在生产里很常见，但很多人会把几件完全不同的事混在一起：

- Pod IP 一直在变，服务怎么稳定访问
- 外部系统要访问我方服务，白名单该加谁
- 我方服务要访问第三方，第三方白名单该加谁
- 应用侧还想拿到真实客户端 IP，该怎么保留

如果这四件事没拆开，方案就很容易做错。

<K8sDiagram kind="ip-whitelist-patterns" />

## 1. 先拆方向：到底是谁访问谁

最重要的第一步不是选技术，而是先问清访问方向。

| 场景 | 真正要稳定的对象 | 第三方或调用方应该记住谁 |
| --- | --- | --- |
| 集群内服务 A 调服务 B | `Service` 名称 / VIP | `service-name.namespace.svc` |
| 集群内需要稳定访问单实例 | 实例身份 + DNS 名称 | `pod-ordinal.headless-svc.namespace.svc` |
| 外部系统访问我方服务 | 固定入口 IP / 域名 | `LoadBalancer`、WAF、API Gateway、Ingress 对外地址 |
| 我方服务访问第三方 | 固定出口 IP | `NAT Gateway` / `Cloud NAT` / `Egress Gateway` 的出口地址 |

一句话记忆：

> 集群内稳定靠 Service 或 StatefulSet DNS；外部入站白名单靠固定入口 IP；外部出站白名单靠固定出口 IP。

## 2. 为什么 Pod 动态 IP 通常不是问题

Pod 在 K8s 里默认就是易失的：

- 滚动更新会重建
- 节点故障会迁移
- HPA 扩缩容会增减副本
- 驱逐、重调度也会变更地址

因此问题不该被表述成“怎么把 Pod IP 固定住”，而应该表述成：

- 我要稳定访问的是**一组服务**
- 还是某个**固定实例**
- 还是某个**对外地址**
- 还是某个**固定出口**

如果只是集群内调用业务服务，直接用 Service 就够了。多数业务根本不需要知道某个 Pod 的真实地址。

## 3. 集群内稳定访问：Service 和 Headless Service 分别解决什么

### 3.1 无状态服务：直接用 Service

无状态服务的标准做法是：

- Deployment 维护副本
- Service 提供稳定入口
- CoreDNS 提供稳定名称解析

调用方应该访问：

```text
order-api.default.svc.cluster.local
```

而不是访问某个 Pod 地址。

这样 Pod 怎么扩容、滚动更新、漂移都不会影响调用方。

### 3.2 稳定到单实例：StatefulSet + Headless Service

有些系统确实要指向某个具体成员，例如：

- MySQL 主从节点
- Kafka broker
- ZooKeeper / etcd / Redis Sentinel 成员
- 有固定分片或固定序号语义的实例

这类场景真正需要稳定的是：

- Pod 名称
- DNS 名称
- 持久卷绑定

而不是 Pod IP。

典型配置骨架：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
    - port: 3306
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8
          ports:
            - containerPort: 3306
```

最终你获得的是稳定实例名：

- `mysql-0.mysql.default.svc.cluster.local`
- `mysql-1.mysql.default.svc.cluster.local`

## 4. 外部系统访问我方服务：白名单该加谁

这是“入站白名单”问题。

### 4.1 正确答案：加固定入口地址

如果合作方、Webhook 发送方、开放平台调用你的接口，对方白名单应该加的是：

- `LoadBalancer` 的固定公网 IP
- 或 Ingress / WAF / API Gateway 暴露出去的稳定地址

不应该加的是：

- Pod IP
- 会扩缩、替换的 Node 公网 IP

最稳的链路通常是：

```text
Third Party -> WAF / API Gateway / LoadBalancer -> Ingress -> Service -> Pod
```

调用方真正需要知道的是最左侧这层固定入口。

### 4.2 常见落地模式

#### 模式 A：直接用 `Service.type=LoadBalancer`

适合：

- 对外暴露 TCP/UDP 或简单 HTTP 服务
- 不需要复杂七层规则
- 希望直接拿一个稳定公网入口

示例：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-public
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local
  selector:
    app: api
  ports:
    - name: https
      port: 443
      targetPort: 8443
```

说明：

- `externalTrafficPolicy: Local` 主要用于尽量保留客户端真实源地址
- 它不是“固定 IP”本身的来源，固定 IP 仍来自外部负载均衡层

#### 模式 B：Ingress Controller 前挂固定公网入口

适合：

- 多个 HTTP 服务统一入口
- 需要 Host / Path 路由、TLS 证书、灰度、统一鉴权
- 需要把白名单、限流、WAF 和证书能力集中治理

链路通常是：

```text
Client -> LB / WAF / API Gateway -> Ingress Controller -> Service -> Pod
```

#### 模式 C：更前面再挂 CDN / WAF / API Gateway

适合：

- 安全要求更高
- 需要更强的 DDoS、WAF、鉴权、配额能力
- 多集群、多地域统一暴露入口

这时合作方白名单应该加的是最外层暴露给公网的地址，而不是 Ingress 后面的内部地址。

## 5. 我方访问第三方：白名单该加谁

这是“出站白名单”问题，和上面完全不是一个方向。

### 5.1 正确答案：加固定出口 IP

当你的 Pod 调第三方数据库、支付网关、企业内网 API、SaaS 平台时，第三方看到的通常不是 Pod IP，而是 SNAT 后的出口地址。

第三方白名单应该加的是：

- `NAT Gateway`
- `Cloud NAT`
- `Egress Gateway`
- 或专门的出口代理 / 出口节点公网地址

如果只记一句话，记这个：

> 外部系统看到的，通常是出网链路最后一跳做 SNAT 后的地址，而不是 Pod 自己的 IP。

### 5.2 为什么不能直接让第三方白名单 Pod IP

原因很直接：

- Pod 会重建，IP 会变
- Pod 数量会扩缩，IP 不止一个
- 跨节点、跨子网、跨可用区时地址更不稳定
- 对外看到的通常也是 NAT 后地址，不是 Pod 自己的地址

### 5.3 行业内主流方案：按推荐顺序怎么选

下面这几种方案基本覆盖了大多数场景，可以按推荐顺序理解：

| 方案 | 推荐度 | 适合场景 | 核心优点 | 主要代价 |
| --- | --- | --- | --- | --- |
| 公有云 `NAT Gateway` / `Cloud NAT` | 高 | 公有云集群统一出网 | 最稳、最省运维、和 K8s 解耦 | 依赖云厂商网络能力 |
| CNI `Egress Gateway` | 高 | 自建集群、裸金属、要按 Namespace / Pod 精细控出口 | 网络层能力强、粒度细 | 对 CNI 能力和网络理解要求高 |
| Istio `Egress Gateway` | 中高 | 已经在用 Service Mesh，且希望顺带拿到治理能力 | 统一观测、重试、熔断、审计 | 引入网格复杂度 |
| 正向代理 `Forward Proxy` | 中 | 主要是 HTTP/HTTPS 出站，且不想碰底层网络 | 最容易落地、应用侧可控 | 协议覆盖有限，需改代理配置 |
| 固定节点调度 + Node IP | 低到中 | 极小规模、静态集群、临时折中 | 方案简单，不依赖高级组件 | 高可用差、弹性差、维护成本高 |

### 5.4 方案一：公有云标准解法，用 NAT 网关

如果你在公有云上跑 Kubernetes，这通常是第一选择。

适合绝大多数场景：

- 出口统一
- 运维简单
- 对第三方白名单表达清晰
- 节点怎么扩缩都不影响外部看到的出口地址

原理可以这样理解：

1. Pod 发起外部请求
2. 流量先到所在 Node
3. Node 或底层网络先做一次源地址转换
4. 最终出网时由 `NAT Gateway` / `Cloud NAT` 统一改写成绑定的固定公网 IP

结果就是：

- 内部 Pod 怎么调度无所谓
- 外部第三方始终只看到固定出口 IP
- 第三方只需要维护很短的一份白名单

落地动作通常也很简单：

- 给集群所在 VPC 配置 `NAT Gateway`
- 绑定一个或多个固定 EIP
- 配好路由，让工作节点的出网流量统一走 NAT
- 把该公网出口 IP 提供给第三方加白

这也是为什么在云上场景里，优先推荐 NAT，而不是折腾 Pod 或 Node 本身。

### 5.5 方案二：CNI 插件提供的 Egress Gateway

适合：

- 自建集群或裸金属环境
- 需要按 Namespace、Pod 标签或业务线划分不同出口
- 不希望所有业务共用一个统一出口

典型能力来自：

- Calico Egress Gateway
- Cilium Egress Gateway

核心思路是：

- 指定几台固定的出口节点
- 通过 CNI 策略把某些 Pod 的流量先导向这些出口节点
- 再由出口节点统一出网

这样你可以做到：

- `payment` Namespace 走出口 A
- `risk` Namespace 走出口 B
- 某些核心应用使用更严格、更可审计的出口链路

这类方案的优点是“网络层原生、粒度细”，但代价也很明确：

- 配置复杂度更高
- 对 CNI 的实现细节要足够熟
- 出口节点本身也要做高可用设计

### 5.6 方案三：Istio Egress Gateway

如果你已经在用 Istio，这个方案很自然。

核心思路：

- Pod 发往外部域名的流量先被 Sidecar 拦截
- 通过 `ServiceEntry`、`VirtualService`、`DestinationRule` 等配置
- 强制这些流量先汇聚到 Istio 的 `Egress Gateway`
- 再由 Egress Gateway 统一出网

它除了固定出口 IP，还能顺手带来：

- 外部调用观测
- 统一 TLS 策略
- 重试、熔断、限流
- 更清楚的出站审计链路

但如果你本来没有 Service Mesh，只为了固定出口 IP 去上 Istio，通常不划算。

### 5.7 方案四：正向代理（Forward Proxy）

这是一个非常务实的应用层方案，尤其适合：

- 主要是 HTTP / HTTPS 出站
- 不想修改太多底层网络
- 团队对传统代理更熟，而不是对 CNI 很熟

常见做法：

- 在集群内或集群外部署固定 IP 的代理，如 Squid、Nginx、Envoy
- 给业务 Pod 注入 `HTTP_PROXY` / `HTTPS_PROXY`
- 应用的 HTTP Client 自动通过代理转发请求

优点：

- 好理解
- 好排查
- 不一定要动集群网络层

缺点：

- 只适合代理能覆盖的协议
- 对非 HTTP 协议不一定好用
- 代理本身要考虑性能、认证、审计和高可用

### 5.8 方案五：Node IP 折中方案

这是一种“简单粗暴，但有明显代价”的方案。

先说一个容易被忽视的事实：

在标准 K8s 网络模型里，Pod 主动访问外部网络时，流量到宿主机后通常会发生 SNAT。很多情况下，外部系统最终看到的源地址，本来就是 Node 的出口地址，而不是 Pod IP。

所以很多人会问：

> 那是不是直接把 Node IP 给第三方加白就行了？

答案是：**技术上可以，但架构上通常不优雅。**

#### 为什么直接白名单所有 Node IP 很痛苦

如果你的集群有很多工作节点，就会遇到几个现实问题：

- 白名单数量爆炸，第三方不一定愿意加几十个 IP
- 集群一扩容，新节点 IP 还要同步给第三方
- 节点替换、迁移后还要维护白名单
- 自动扩缩容的价值会被部分抵消

对接银行、支付渠道、核心外部系统时，这种维护方式尤其容易被拒绝。

#### 什么时候可以直接给 Node IP

只在下面这种场景里勉强算可接受：

- 集群非常小，例如 3 到 5 台 Worker
- 节点长期固定，不做自动扩缩容
- 这是内部系统对接，不是强监管或高敏业务链路

如果满足这些条件，直接把这些固定 Node IP 提给对方，是最低成本方案。

#### 更常见的折中：固定节点调度

如果不想引入 NAT Gateway 或 Egress Gateway，但又不希望第三方白名单全量节点 IP，可以做一个折中：

- 选 2 到 3 台固定节点作为“出口节点”
- 给这些节点打标签，例如 `egress-node=true`
- 把需要访问第三方白名单的工作负载固定调度到这些节点
- 第三方只对白名单这几个固定节点 IP

示例：

```bash
kubectl label nodes node-1 egress-node=true
kubectl label nodes node-2 egress-node=true
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-channel-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: payment-channel-service
  template:
    metadata:
      labels:
        app: payment-channel-service
    spec:
      nodeSelector:
        egress-node: "true"
      containers:
        - name: app
          image: your-golang-app:v1
```

这个方案的好处是：

- 不需要引入太多额外组件
- 第三方只要维护少量节点 IP

但风险也必须明确：

- 这几台节点挂了，相关 Pod 可能直接 `Pending`
- 全局调度能力被你主动削弱了
- 这几台节点会变成容量和可用性的热点
- 一旦业务规模上来，最终大概率还是要回到统一 NAT 或 Egress Gateway

#### 为什么不建议再往前走到 `hostNetwork: true`

有些人会继续往前走一步，想让 Pod 直接用宿主机网络。

这通常不值得：

- 容器端口容易和宿主机冲突
- 网络隔离能力变差
- 调度灵活性继续下降
- 你是在用“破坏 K8s 抽象”的方式换一个短期方便

除非是非常特殊的基础设施组件，否则不建议把 `hostNetwork` 当成解决白名单问题的常规手段。

### 5.9 怎么给出最终建议

如果让我给一个工程化建议顺序，会是：

1. 云上集群：优先 `NAT Gateway`
2. 自建 / 裸金属：优先 CNI `Egress Gateway`
3. 已经用了 Istio：优先复用 `Istio Egress Gateway`
4. 只需要 HTTP/HTTPS：正向代理是最务实的替代方案
5. 集群极小且稳定：才考虑固定 Node IP 或固定节点调度

## 6. 固定入口 IP 和真实客户端 IP 保留不是一回事

很多系统把这两个目标混成一个问题，结果配置一塌糊涂。

<K8sDiagram kind="source-ip-preservation" />

### 6.1 固定入口 IP 解决什么

它解决的是：

- 第三方该连谁
- 白名单该加谁
- 我方对外公布什么地址

### 6.2 真实客户端 IP 保留解决什么

它解决的是：

- 审计日志里看到的到底是谁
- 风控、限流、黑白名单按谁判断
- 应用层如何拿到最初发起者地址

### 6.3 常见做法

#### HTTP / L7 场景

通常依赖：

- `X-Forwarded-For`
- `X-Real-IP`
- Proxy Protocol

但这里的关键不是“拿到头”，而是：

- 只能信任受控代理链加的头
- 不能无条件信任任意客户端自己带来的 `X-Forwarded-For`

#### TCP / L4 场景

如果想尽量保留四层源地址，常见会用：

- `externalTrafficPolicy: Local`
- 负载均衡直达本地节点的能力
- 本地节点上必须有可用 Pod

代价是：

- 流量分布可能不均衡
- 节点上没有 Pod 就不能接流量
- 健康检查和调度策略要更仔细设计

## 7. 反模式：这些做法看起来省事，实际上很危险

### 反模式 1：让合作方白名单 Pod IP

这是最典型的错误。Pod IP 天生不稳定，等于把业务可用性绑在一次调度结果上。

### 反模式 2：只为拿固定地址就启用 `hostNetwork: true`

这会引入：

- 端口冲突
- 隔离变差
- 调度受限
- 网络策略复杂化

除非是极特殊基础设施组件，否则不该把它当作白名单方案。

### 反模式 3：第三方白名单直接加 Node IP

如果节点会自动扩缩、漂移、替换，这种方案很快就会失效。只有在你明确把少量节点设计成稳定出口池时，这件事才有成立空间。

### 反模式 4：以为 NetworkPolicy 能解决第三方白名单

NetworkPolicy 解决的是集群网络隔离，不解决公网固定入口 / 固定出口地址问题。

### 反模式 5：应用层盲目信任 `X-Forwarded-For`

如果没有 Trusted Proxy 概念，任何客户端都可以伪造这个头。

## 8. 一套面试答法

如果面试官问：

> K8s 里 Pod IP 会变，第三方要加白名单怎么办？

你可以直接按这套答：

> 我会先分场景。  
> 如果是集群内服务访问，不解决 Pod IP，本来就应该通过 Service 或 StatefulSet DNS 做稳定访问。  
> 如果是外部访问我方服务，白名单应该加固定入口 IP，比如 LoadBalancer、WAF 或 Ingress 前面的公网地址。  
> 如果是我方访问第三方，第三方白名单应该加固定出口 IP，比如 NAT Gateway 或 Egress Gateway。  
> 如果还要求后端识别真实客户端 IP，那是另一个问题，要看 L7 头透传还是 L4 源地址保留，比如 `X-Forwarded-For` 或 `externalTrafficPolicy: Local`。  
> 核心原则不是固定 Pod IP，而是按场景选择正确的稳定抽象层。

## 9. 最后记住这张表

| 目标 | 推荐方案 | 备选方案 | 不推荐 |
| --- | --- | --- | --- |
| 集群内稳定访问一组服务 | `Service + DNS` | 无 | 直连 Pod IP |
| 集群内稳定访问单实例 | `StatefulSet + Headless Service` | 无 | 手工记 Pod IP |
| 外部访问我方服务 | 固定公网入口：LB / WAF / Ingress | 统一 API Gateway | 白名单 Pod IP |
| 我方访问第三方 | `NAT Gateway` / `Cloud NAT` / `Egress Gateway` | 正向代理、固定出口节点 | 白名单全量漂移 Node IP |
| 获取真实客户端 IP | 可信代理头 / `externalTrafficPolicy: Local` | Proxy Protocol | 盲信任任意 `X-Forwarded-For` |

## 关联阅读

- [StatefulSet 与 Headless Service 实战](./statefulset-headless-service.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [容器化与云原生实践](/golang/guide/10-containerization-cloud-native)
- [net/netip：现代 IP 地址处理](/golang/guide/source-reading/net-netip)
- [net/http 限流与熔断](/golang/guide/source-reading/net-http-ratelimit)
- [net/http/httputil：反向代理](/golang/guide/source-reading/net-httputil)
