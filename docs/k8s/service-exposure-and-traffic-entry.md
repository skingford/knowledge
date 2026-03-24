---
title: 服务暴露与流量入口链路实战
description: 系统讲清 Kubernetes 中 ClusterIP、NodePort、LoadBalancer、Ingress、Gateway API、四层七层、TLS 终止与真实源地址保留的边界。
---

# 服务暴露与流量入口链路实战

K8s 的入口流量这条线，最常见的混淆通常是这些：

- `Service`、`Ingress`、`Gateway API` 到底谁是入口
- `LoadBalancer` 和 Ingress 是不是二选一
- `NodePort`、`ClusterIP`、`LoadBalancer` 到底差在哪
- 四层和七层到底分别解决什么
- TLS 应该在哪里终止
- 真实客户端 IP 到底应该看哪一层

如果这些问题混着讲，面试和设计都很容易答偏。

<K8sDiagram kind="traffic-entry-chain" />

## 1. 先拆三层：后端抽象、入口治理、外层暴露

最实用的第一步，不是先背对象名，而是先把职责分层。

### 1.1 Service：后端稳定抽象

`Service` 解决的是：

- 一组 Pod 的稳定访问入口
- Pod IP 漂移时仍能稳定访问

它更像：

- 集群内部或入口层之后的“稳定后端目标”

### 1.2 Ingress / Gateway API：七层入口治理

它们更关心：

- Host / Path 路由
- TLS 证书
- Header 重写
- 灰度、重定向、统一入口策略

所以它们不是后端 Pod 的替代品，而是：

- 在 Service 之前做七层流量治理

### 1.3 外层 LB / WAF / API Gateway：公网暴露和外部防护

这层通常更关心：

- 固定公网 IP
- DDoS / WAF
- 统一域名入口
- 与外部网络打通

所以一个更完整的心智模型通常是：

> 外层入口暴露公网，Ingress / Gateway 负责七层规则，Service 负责稳定后端抽象，Pod 只负责真正处理请求。

## 2. Service 三种最常见暴露方式怎么理解

### 2.1 `ClusterIP`

默认类型，重点是：

- 集群内部稳定访问
- 对外不可直接暴露

它最适合：

- 服务间调用
- 作为 Ingress / Gateway 的后端目标

### 2.2 `NodePort`

它的本质是：

- 在每个节点上开放一个固定端口

适合：

- 比较简单的四层暴露
- 某些自建环境里的外部 LB 回源

但它通常不是大规模生产对外暴露的最佳入口抽象。

### 2.3 `LoadBalancer`

它更像：

- 让外部负载均衡器把流量接进来

它常见解决的是：

- 给服务分配固定公网入口
- 提供更直接的外网暴露方式

标准理解：

- `LoadBalancer` 是 Service 的一种暴露方式
- 它不等于 Ingress，也不等于七层网关

## 3. Ingress 和 Gateway API 到底是什么关系

### 3.1 Ingress

Ingress 更偏：

- 经典的 HTTP / HTTPS 七层入口模型

它的强项通常是：

- Host / Path 路由
- TLS 证书管理
- 入口规则统一治理

### 3.2 Gateway API

Gateway API 可以理解成：

- 比 Ingress 更结构化、表达力更强的新一代入口 API 模型

它常见的优势是：

- 职责拆分更清楚
- 更好表达入口、监听器、路由和后端的关系
- 更适合多团队、多网关、细粒度治理

如果只讲一句：

- Ingress 更像经典统一入口对象
- Gateway API 更像可扩展的网关资源模型

## 4. 四层和七层到底差在哪

很多人把四层和七层说成“一个简单一个高级”，这不准确。

<K8sDiagram kind="l4-l7-termination-map" />

### 4.1 四层更关注什么

四层链路更关心：

- TCP / UDP 转发
- 连接级别透传
- 较少引入 HTTP 语义改写

典型场景：

- 原生 TCP 服务
- 某些 gRPC / 自定义协议
- 更强调源地址透传的入口

### 4.2 七层更关注什么

七层链路更关心：

- Host / Path / Header / Method
- TLS 证书终止
- 重定向、鉴权、灰度、Header 注入

典型场景：

- 大多数 HTTP / HTTPS API 服务
- 多域名、多路径统一入口
- 统一证书和流量治理

所以标准口径应该是：

> 四层和七层不是谁更高级，而是谁承担更多应用层语义。

## 5. TLS 终止位置为什么一定要单独讲

入口设计里，TLS 终止是一个独立问题，不应该和 Service 类型混在一起讲。

常见终止位置有：

- 外层 LB / WAF / API Gateway
- Ingress Controller / Gateway
- 后端应用自己终止

不同位置意味着不同权衡：

- 证书统一管理难度
- 七层能力是否可见
- 后端是否还能拿到明文 HTTP 语义
- 性能和信任边界放在哪里

工程上最常见的是：

- 在七层入口层统一终止 TLS

这样更利于：

- 证书治理
- 路由规则
- Header 注入
- 统一日志和审计

## 6. 真实客户端 IP 为什么又是另一件事

这也是最容易和“固定入口”“TLS 终止”混在一起的一题。

真实客户端地址能不能拿到，取决于：

- 是四层还是七层入口
- 有没有额外代理层
- 代理是否透传 `X-Forwarded-For` / `X-Real-IP`
- 是否启用了 Proxy Protocol
- `externalTrafficPolicy: Local` 是否合适

所以这道题最好分开回答：

- **入口地址固定** 是一回事
- **真实客户端地址保留** 是另一回事

如果入口是典型 HTTP 网关，应用通常更应该理解：

- 哪些代理头是可信的

而不是简单地盲信所有 `X-Forwarded-For`。

## 7. 一张表把常见对象彻底拆开

| 能力 | 它解决什么 | 它不解决什么 |
| --- | --- | --- |
| `ClusterIP` Service | 集群内稳定访问 | 不直接对公网暴露 |
| `NodePort` Service | 节点端口暴露 | 不等于完整公网入口治理 |
| `LoadBalancer` Service | 通过外部 LB 对外暴露 | 不自动提供七层路由能力 |
| Ingress | 经典 HTTP/HTTPS 七层入口 | 不替代 Service 后端抽象 |
| Gateway API | 更结构化的网关入口模型 | 不是“没有后端也能工作”的对象 |

## 8. 一个比较稳的入口骨架

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-example-com
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

这段配置表达的是：

- 业务后端先通过 Service 稳定暴露
- 七层入口再把域名和 TLS 规则路由到这个 Service

也就是：

- Ingress 站在 Service 前面
- 不是直接站在 Pod 前面

## 9. 最容易踩的坑

### 坑 1：把 Ingress 当成 Service 替代品

它们不是同层能力。

### 坑 2：把 `LoadBalancer` 当成七层网关

它常常只是把流量接进来的方式，不自动等于有 Host / Path 规则。

### 坑 3：固定入口 IP、真实源地址、TLS 终止混成一题

这三件事经常相关，但不是同一件事。

### 坑 4：默认盲信 `X-Forwarded-For`

如果没有可信代理边界，这很容易被伪造。

### 坑 5：一上来就选最复杂的 Gateway 模型

如果团队还没把 Service、Ingress、真实源地址和证书终止这些基础边界讲清楚，先把对象堆复杂没有意义。

## 10. 一套面试答法

如果面试官问：

> K8s 里 Service、LoadBalancer、Ingress、Gateway API 怎么理解？四层七层怎么选？

你可以这样答：

> 我会先按职责分层。  
> Service 负责给一组 Pod 提供稳定后端入口，`ClusterIP` 主要是集群内访问，`NodePort` 和 `LoadBalancer` 是 Service 的不同暴露方式；  
> Ingress 和 Gateway API 更偏七层入口治理，解决的是 Host、Path、TLS、Header 这些 HTTP 语义，不是替代 Service；  
> 四层更适合 TCP/UDP 和更强透传场景，七层更适合大多数 HTTP/HTTPS 服务的统一路由和证书治理；  
> 真实客户端 IP、TLS 终止位置、固定公网入口最好单独讨论，不要混成一个概念。  

## 11. 最后记住这句话

> 入口链路最怕把“公网暴露、七层治理、稳定后端、真实源地址、TLS 终止”讲成同一个层。分层讲清楚，方案才不会乱。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
- [externalTrafficPolicy Local 实战与边界](./external-traffic-policy-local.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
