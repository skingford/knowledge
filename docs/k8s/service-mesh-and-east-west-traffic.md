---
title: Service Mesh 与东西向流量实战
description: 系统讲清 Kubernetes 中南北向与东西向流量的区别，以及 Service Mesh、Sidecar、mTLS、重试、熔断、灰度与 Egress Gateway 的边界。
---

# Service Mesh 与东西向流量实战

很多团队把入口流量讲清了，但一到集群内部调用，边界又开始混：

- `Service` 已经能服务发现了，为什么还要 Service Mesh
- Ingress / Gateway API 管入口，Mesh 又在管什么
- mTLS、重试、熔断、灰度到底该写在应用里，还是写在网格里
- Sidecar 到底是网络层、应用层，还是平台层
- 只是想固定出口 IP，值不值得为了 `Egress Gateway` 上整套 Mesh

如果这些问题不拆开，最后很容易出现两种极端：

- 明明只需要 `Service + Ingress + OpenTelemetry`，却把整套 Mesh 引进来
- 明明已经到了几十上百个服务，却还在每个应用里各自维护超时、重试、证书和调用观测

这篇重点不是讲某个产品的安装命令，而是先把：

- 南北向和东西向
- K8s 原生能力和 Mesh 能力
- mTLS、治理、观测、出口控制

这几条线讲清楚。

<K8sDiagram kind="east-west-mesh-chain" />

## 1. 先分清两个方向：南北向和东西向

这是理解 Service Mesh 的第一步。

### 1.1 南北向流量

也就是：

- 外部用户访问集群内部服务
- 第三方系统调用我方开放接口

这条线更关心：

- 公网入口
- 域名
- TLS 证书
- WAF / API Gateway
- Host / Path 路由

它通常对应：

- `LoadBalancer`
- Ingress
- Gateway API

### 1.2 东西向流量

也就是：

- 集群内部服务 A 调用服务 B
- 微服务之间跨 Namespace、跨节点、跨版本的调用
- 服务到外部第三方的受控出站访问

这条线更关心：

- 服务间身份
- mTLS
- 超时、重试、熔断
- 灰度和流量切分
- 调用链观测
- 统一出站治理

一句话记忆：

> Ingress / Gateway 主要解决南北向入口；Service Mesh 主要解决东西向治理。

## 2. K8s 原生已经有 Service 了，为什么还会需要 Mesh

先承认一件事：

- 很多系统根本不需要 Mesh

因为 K8s 原生已经能解决不少问题：

- `Service`：稳定服务发现和后端抽象
- CoreDNS：名字解析
- CNI：Pod 之间网络连通
- `NetworkPolicy`：L3 / L4 隔离
- Ingress / Gateway：入口治理

但这些能力并不天然解决下面这些东西：

- 服务间双向身份认证
- 统一 mTLS 证书分发与轮换
- 每条服务调用统一超时、重试、熔断策略
- 不改应用代码就能拿到统一调用指标、日志、Trace
- 按服务维度做细粒度灰度和流量镜像
- 集中治理外部出站流量

所以标准口径不是：

> 有了 Service，Mesh 就没意义。

而是：

> Service 解决“能稳定找到后端”，Mesh 解决“找到之后怎样更安全、更可控、更可观测地调用”。

## 3. Service Mesh 到底是什么

如果只用一句话说：

> Service Mesh 是加在服务调用路径上的一层治理面，它不替代业务服务，而是在调用链两端补上身份、策略和观测。

主流实现通常有两部分：

- **数据面**：每个 Pod 旁边的代理，常见是 Sidecar 代理
- **控制面**：下发路由、证书、策略和配置

最典型的链路通常像这样：

1. 应用容器发起请求
2. 请求先被本地 Sidecar 拦截
3. Sidecar 根据控制面下发的规则做路由、mTLS、重试、观测
4. 到达目标 Pod 的 Sidecar
5. 目标 Sidecar 再把流量转给真正的业务容器

你可以把它理解成：

- 应用代码不直接和远端服务裸连
- 而是把“调用治理”外包给了代理层

### 3.1 为什么主流 Mesh 常见是 Sidecar

因为 Sidecar 最大的好处是：

- 对应用侵入小
- 不要求每种语言都实现同一套治理逻辑
- 能统一处理 HTTP、gRPC、部分 TCP 能力

但它也有代价：

- 每个 Pod 多一个代理容器
- 资源占用增加
- 启动时序和排障路径更复杂

所以现在也有一些 Mesh 在探索：

- ambient / sidecarless 模式

但对大多数团队来说，先把 Sidecar 模型理解透最重要。

## 4. 它和 Service、CNI、Ingress、Gateway API 的边界

<K8sDiagram kind="mesh-boundary-map" />

这是最容易面试答混的一题。

### 4.1 Mesh 不是 Service 替代品

`Service` 仍然负责：

- 稳定服务名
- 后端 Pod 选择
- 集群内访问入口

Mesh 不是把这些都推翻，而是在其上补一层：

- 调用治理和身份治理

### 4.2 Mesh 不是 CNI 替代品

CNI 负责的是：

- Pod IP 分配
- 跨节点连通
- 基础网络数据面

如果连通性本身就有问题，Mesh 也无能为力。

### 4.3 Mesh 不是 Ingress / Gateway 的替代品

Ingress / Gateway 主要管：

- 外部入口
- 域名
- 证书
- 南北向七层路由

Mesh 主要管：

- 服务内部调用
- 东西向身份、策略和观测

### 4.4 Mesh 也不是业务协议和容错代码的完全替代品

Mesh 可以统一一部分调用治理，但它不理解你的全部业务语义。

例如这些事仍然要在应用层想清楚：

- 哪些请求允许重试
- 哪些接口必须幂等
- 哪些错误该熔断，哪些错误该直接失败
- 业务鉴权和业务权限模型

所以正确姿势不是“全丢给 Mesh”，而是：

- 基础流量治理放 Mesh
- 业务语义留在应用

## 5. Service Mesh 常见解决哪些问题

### 5.1 服务身份和 mTLS

这是 Mesh 最常被提到的价值。

它解决的是：

- 服务和服务之间如何互相证明身份
- 内部链路如何默认加密
- 证书如何自动签发和轮换

在很多实现里，服务身份通常会和：

- ServiceAccount
- 证书
- 信任域

这些概念绑定。

### 5.2 超时、重试、熔断、限流

这类能力最大价值在于：

- 不需要每个语言、每个团队都各写一套
- 平台可以把基础调用策略统一下来

典型能力包括：

- timeout
- retry
- connection pool
- outlier detection
- circuit breaking

### 5.3 灰度发布和流量切分

Mesh 很适合做：

- 90% 流量走 v1，10% 流量走 v2
- 按 Header / Cookie / 权重做流量切分
- 流量镜像

这类能力和入口侧灰度不同：

- 入口侧灰度偏外部请求入口
- Mesh 灰度更偏服务间调用路径

### 5.4 统一观测

这也是它在大规模微服务里很重要的原因。

Mesh 可以较统一地采集：

- 请求量
- 延迟
- 错误率
- 上下游拓扑
- 调用链 Trace

这样可以减少：

- 每个服务都重复打相同埋点

但要注意，它也不是完全替代应用指标。

因为业务指标和业务日志仍然在应用里。

### 5.5 统一出站治理

这条线和前面白名单那篇能接上。

Mesh 常见还会提供：

- `Egress Gateway`
- `ServiceEntry`
- 出站域名白名单
- 对外调用的统一监控与审计

但要记住一个很重要的取舍：

> 如果你本来没有 Mesh，只是为了固定一个出口 IP，通常优先 NAT Gateway 或 CNI Egress Gateway，会比整套 Mesh 更轻。

## 6. mTLS 为什么值得单独讲

很多人一提 Mesh，就只剩一句“它能做 mTLS”。

但 mTLS 只是开始，不是全部。

### 6.1 mTLS 真正解决什么

它主要解决：

- 链路加密
- 双向身份认证

也就是：

- 客户端要证明自己是谁
- 服务端也要证明自己是谁

### 6.2 mTLS 不解决什么

它不自动解决：

- 业务鉴权
- 业务角色权限
- 接口级幂等和风控
- 应用自身漏洞

所以标准口径应该是：

> mTLS 解决的是“服务是谁”和“链路是否加密”；它不等于“业务权限模型已经设计好了”。

### 6.3 mTLS 也会带来新排障点

常见新问题包括：

- 证书过期或轮换异常
- 信任域不一致
- 某些服务没注入 Sidecar
- 某些流量被策略要求加密，但目标端并没有按同样模式工作

## 7. 一个比较稳的配置骨架

下面示例用 Istio 的对象名来表达，因为它最常见。  
不同 Mesh 产品命名不同，但核心思路差不多。

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-api
spec:
  host: order-api.default.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-api
spec:
  hosts:
    - order-api.default.svc.cluster.local
  http:
    - timeout: 2s
      retries:
        attempts: 2
        perTryTimeout: 800ms
      route:
        - destination:
            host: order-api.default.svc.cluster.local
            subset: v1
          weight: 90
        - destination:
            host: order-api.default.svc.cluster.local
            subset: v2
          weight: 10
```

这段配置表达的是：

- 同一个 Service 后面有 v1 / v2 两个版本
- 调用链默认走 Mesh mTLS
- 对异常实例做剔除
- 调用超时时间和重试次数统一治理
- 把 10% 内部流量切到 v2

## 8. 最容易踩的坑

### 坑 1：为了一个小需求引入整套 Mesh

例如只是想：

- 固定出口 IP
- 做一个简单入口灰度
- 统一 TLS 终止

这些很多时候并不需要 Mesh。

### 坑 2：应用和 Mesh 双重重试，形成重试风暴

如果应用自己重试，SDK 也重试，Mesh 还重试，故障时很容易放大流量。

### 坑 3：忽略 Sidecar 的资源和启动时序

常见后果：

- Pod 资源预估不足
- 探针和代理启动时序打架
- 业务容器起来了，但代理还没完全就绪

### 坑 4：把所有问题都归咎给 Mesh

很多“Mesh 不通”其实先要回到更底层检查：

- Service selector 对不对
- EndpointSlice 有没有后端
- Pod 本身有没有监听端口
- CNI 连通性是不是就有问题

### 坑 5：以为 mTLS 开了就万事大吉

链路加密了，不代表：

- 接口权限设计对了
- 敏感操作鉴权对了
- 出站访问边界就安全了

### 坑 6：没有先做调用超时和幂等设计

Mesh 能帮你统一超时和重试，但接口本身如果不幂等，重试策略仍然可能把业务打坏。

## 9. 一个实用排查顺序

如果现场现象是：

- 服务间调用偶发超时
- 某些 Pod 调得通，某些调不通
- mTLS 开启后部分链路失败
- 引入 Sidecar 后排障路径变复杂

建议优先这样查：

1. 先确认不带 Mesh 的基础链路是否成立：Pod、Service、EndpointSlice、DNS、CNI
2. 再确认目标 Pod 是否真的注入了 Sidecar 或运行在预期模式
3. 再看控制面下发的路由、超时、重试、mTLS、鉴权策略是否一致
4. 看证书、身份、信任域是否匹配
5. 如果是出站问题，再查 `ServiceEntry`、`Egress Gateway` 或出口策略
6. 如果是性能问题，再看 Sidecar 资源、连接池、重试放大和 Trace

经验上：

- 越是怀疑 Mesh，越要先把 Mesh 之外那层基础面排干净

## 10. 一套面试答法

如果面试官问：

> Kubernetes 里为什么会用 Service Mesh？它和 Service、Ingress 有什么关系？

你可以这样答：

> 我会先分南北向和东西向。  
> Service 和 CoreDNS 解决的是集群内稳定服务发现，Ingress / Gateway 更偏外部入口治理；  
> Service Mesh 主要解决的是服务之间调用的统一治理，比如 mTLS、超时、重试、熔断、流量切分和统一观测；  
> 它不替代 Service，也不替代 CNI 或 Ingress，而是叠加在服务调用路径上的一层代理治理面；  
> 如果服务规模不大，很多场景用 K8s 原生能力加应用侧观测就够了；只有当服务很多、跨团队治理成本高、零信任和统一观测要求更高时，Mesh 的收益才会明显。  

## 11. 最后记住这句话

> Service Mesh 最核心的价值，不是“再加一层代理”，而是把服务间调用里的身份、策略和观测从每个应用里抽出来，统一下沉到平台层。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Pod 内多容器协作实战](./pod-multi-container-collaboration.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [NetworkPolicy 与东西向访问控制实战](./networkpolicy-and-east-west-access-control.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [crypto/tls：TLS 握手与 mTLS](/golang/guide/source-reading/crypto-tls)
