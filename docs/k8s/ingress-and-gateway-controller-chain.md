---
title: Ingress Controller 与 Gateway Controller 实现链路
description: 系统讲清 Kubernetes 中 Ingress、IngressClass、GatewayClass、Gateway、HTTPRoute 背后的控制器接管、路由下发、地址分配与常见排障方法。
---

# Ingress Controller 与 Gateway Controller 实现链路

很多人讲 K8s 入口时，会停在对象层：

- 有 `Ingress`
- 有 `Gateway`
- 有 `HTTPRoute`
- 有 `IngressClass`
- 有 `GatewayClass`

但如果你追问一句：

- 谁真正去监听 80/443
- 谁去更新代理配置
- 谁给入口分配地址
- 为什么对象已经创建了，地址还是一直 `<pending>`

回答就容易散。

这条线真正要讲清的不是“对象叫什么”，而是：

> 入口对象只负责声明期望，真正让入口生效的是对应实现的 controller 和它背后的数据面代理或外部基础设施。

<K8sDiagram kind="ingress-controller-chain" />

## 1. 先回答：为什么只创建 Ingress / Gateway 对象还不够

这是入口实现里最核心的一句。

`Ingress`、`Gateway`、`HTTPRoute` 本身都只是：

- API 对象
- 声明式配置
- 对“想要怎样接流量”的描述

它们自己不会：

- 监听端口
- 创建代理配置
- 拉起负载均衡器
- 下发证书
- 更新外部地址

所以：

- 只创建 `Ingress`，如果没有 Ingress Controller，通常不会生效
- 只创建 Gateway API 相关对象，如果没有对应 Gateway Controller，通常也不会生效

工程上最实用的口径是：

> `Ingress` / `Gateway API` 负责表达入口意图，controller 负责把这份意图翻译成真正运行的入口设施。

## 2. Ingress 这条实现链路到底怎么跑

### 2.1 `Ingress`

`Ingress` 负责声明：

- Host
- Path
- 后端 Service
- TLS Secret

它表达的是：

- “我想让这些 HTTP/HTTPS 请求按这些规则进来”

### 2.2 `IngressClass`

`IngressClass` 的价值不是再加一层名词，而是回答：

- 这个 Ingress 应该交给哪个实现来接管

它本质上像：

- 对某类 Ingress Controller 的绑定入口

### 2.3 Ingress Controller

真正工作的通常是 controller：

- watch `Ingress`、`Service`、`EndpointSlice`、`Secret`
- 根据规则生成代理配置
- 把配置下发给 NGINX、Envoy、HAProxy 或云厂商入口实现
- 更新对象状态，例如入口地址

### 2.4 数据面代理 / 外部入口设施

最终真的接收流量的，可能是：

- 集群内 NGINX / Envoy 代理 Pod
- 云负载均衡器
- 边缘网关

所以一个完整链路更像：

```text
Ingress -> IngressClass -> Ingress Controller -> Proxy / LB -> Service -> Pod
```

## 3. Gateway API 为什么更像“入口资源模型 + 控制器框架”

官方入口方向已经逐步把新增能力放到 Gateway API 上了，它和 Ingress 的差别，不只是字段更多。

更关键的是：

- 它把角色拆得更清楚
- 它让“谁提供入口设施”和“谁声明路由规则”更容易分离
- 它天然更适合多团队、多租户、跨 namespace 入口治理

<K8sDiagram kind="gateway-controller-attachment-map" />

## 4. Gateway API 里几类对象怎么协作

### 4.1 `GatewayClass`

`GatewayClass` 最重要的字段是：

- `spec.controllerName`

它回答的是：

- 哪个 controller 负责这类 Gateway

可以理解成：

- Gateway 世界里的“实现归属”

### 4.2 `Gateway`

`Gateway` 描述的是一个入口实例：

- 监听哪些端口
- 使用什么协议
- 是否允许跨 namespace 路由附着
- 入口地址由谁来分配

它更像：

- 一台被声明出来的“流量处理入口”

### 4.3 `HTTPRoute` / 其他 Route

Route 对象描述的是：

- 具体流量怎么匹配
- 匹配后转到哪个后端 Service

它更像：

- 绑定到某个 Gateway listener 上的路由规则

### 4.4 这套链路怎么串起来

最常见的心智模型是：

```text
GatewayClass -> Gateway -> HTTPRoute -> Service -> Pod
```

但工程上还要补两个关键点：

- `GatewayClass` 决定谁来实现
- `parentRefs` 和 `allowedRoutes` 决定 Route 能不能真的附着上去

## 5. `IngressClass` 和 `GatewayClass` 怎么区分

这两个对象很像，但不是一回事。

### 5.1 `IngressClass`

它更偏：

- 把 `Ingress` 交给某个 Ingress Controller

### 5.2 `GatewayClass`

它更偏：

- 定义某类 Gateway 实现由哪个 controller 管理
- 再由这个实现去管理一个或多个 Gateway 实例

一句话区分：

- `IngressClass` 更像经典入口实现归属
- `GatewayClass` 更像网关实现类别与 controller 归属

## 6. 为什么地址会一直 `<pending>`

这是入口实现里最常见的线上现象之一。

常见根因通常有这些：

### 6.1 没有对应 controller 在接管

例如：

- 只创建了 `Ingress`
- 但集群里没有对应 Ingress Controller

或者：

- `gatewayClassName` 指到了一个没人实现的 `GatewayClass`

### 6.2 class 不匹配

例如：

- `ingressClassName` 写错
- `IngressClass.spec.controller` 不匹配实际 controller
- `GatewayClass.spec.controllerName` 和实际实现不匹配

### 6.3 controller 自己不健康

例如：

- controller Pod 不健康
- watch / reconcile 失败
- 配置生成失败
- 代理 reload 失败

### 6.4 外部基础设施没创建成功

例如：

- 云负载均衡器权限不足
- 子网、安全组、EIP 或配额有问题
- 云控制器或实现控制器无法成功创建外部地址

所以入口地址 `<pending>` 这题，最好的第一反应不是怀疑 API，而是：

- 先查到底有没有 controller 真正在接这类对象

## 7. 为什么 Route / 规则明明写了，却不生效

这也是 Gateway API 里最容易卡住的一题。

常见原因：

- `parentRefs` 指向错 Gateway 或 listener
- `allowedRoutes` 不允许来自这个 namespace 的 Route
- Route kind 不被该实现支持
- 后端 Service 不存在或端口不匹配
- controller 已接管，但状态条件里已经标记为未附着或未编程

一个非常实用的认识是：

> Gateway API 不是“写了 Route 就自动接上”，而是一个带信任边界和附着关系校验的模型。

## 8. 多 controller 并存时，为什么 class 尤其关键

生产里并不一定只有一个入口实现。

你可能同时有：

- 一套 Ingress-NGINX
- 一套云厂商 ALB Controller
- 一套 Gateway API 的 Envoy / Istio / Cilium 实现

这时如果不把 class 讲清：

- 对象可能没人接
- 也可能被错误实现接管
- 结果就是行为和预期完全不一样

所以很实用的工程纪律是：

- 明确写 `ingressClassName`
- 明确写 `gatewayClassName`
- 不依赖“也许有默认 class”

## 9. 一个 Ingress 的最小骨架

```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
spec:
  controller: k8s.io/ingress-nginx
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
spec:
  ingressClassName: nginx
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

这段配置真正表达的是：

- 用名为 `nginx` 的实现类别
- 由对应 controller 接管这个 Ingress
- 再把流量转给后端 `api` Service

## 10. 一个 Gateway API 的最小骨架

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: example
spec:
  controllerName: example.com/gateway-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: public-gw
  namespace: infra
spec:
  gatewayClassName: example
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api
  namespace: infra
spec:
  parentRefs:
    - name: public-gw
  rules:
    - backendRefs:
        - name: api
          port: 80
```

这段配置真正表达的是：

- `example.com/gateway-controller` 这类实现来接管
- 它创建或编程一个 `public-gw` 入口实例
- `HTTPRoute` 再通过 `parentRefs` 附着上去

## 11. 最短排障顺序

如果线上现象是：

- Ingress / Gateway 地址一直没有
- 路由对象创建了但不生效
- 某个 controller 下的入口正常，另一个实现不正常

建议顺序是：

1. 先看对象是否引用了正确的 class
2. 再看对应 controller 是否真的存在且健康
3. 看 controller 日志里有没有接管、生成配置、下发失败等信息
4. 对 Ingress 看 `IngressClass` 和对象状态
5. 对 Gateway API 看 `GatewayClass`、`Gateway`、`Route` 的 conditions 和附着关系
6. 如果地址分配失败，再查云 LB / 网络 / 权限 / 配额
7. 最后才回到后端 Service、EndpointSlice 和 Pod

常用命令：

```bash
kubectl get ingressclass
kubectl get ingress -A
kubectl describe ingress <name> -n <namespace>

kubectl get gatewayclass
kubectl get gateway -A
kubectl get httproute -A
kubectl describe gateway <name> -n <namespace>
kubectl describe httproute <name> -n <namespace>

kubectl get pods -A | rg 'ingress|gateway'
kubectl logs -n <controller-namespace> <controller-pod>
```

## 12. 一套面试答法

如果面试官问：

> Ingress 和 Gateway API 背后是谁真正让它生效的？为什么有时对象建好了却没有入口地址？

你可以这样答：

> `Ingress` 和 `Gateway API` 本身都只是声明式对象，真正让入口生效的是对应实现的 controller。  
> Ingress 这条链路通常是 `Ingress -> IngressClass -> Ingress Controller -> 代理或外部 LB -> Service`；  
> Gateway API 则更结构化，通常是 `GatewayClass -> Gateway -> Route -> Service`，其中 `GatewayClass.spec.controllerName` 决定由哪个实现接管。  
> 所以对象创建成功不等于入口已经生效，如果没有匹配的 controller、class 写错、controller 不健康，或者外部 LB/权限/配额有问题，地址就可能一直 `<pending>`。  
> 这类问题的排查重点不是先看后端 Pod，而是先看 class、controller、status 和外部基础设施收敛。  

## 13. 最后记住这句话

> 入口对象负责“声明我要什么入口”，controller 负责“把这份声明变成真的入口设施”。不把这两层拆开，`Ingress` 和 `Gateway` 这条线就永远讲不透。

## 关联阅读

- [服务暴露与流量入口链路实战](./service-exposure-and-traffic-entry.md)
- [控制器与 Reconcile 链路实战](./controllers-and-reconcile.md)
- [控制面主线实战](./control-plane-mainline.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
- [K8s 固定入口、固定出口与白名单实战](./fixed-ip-and-whitelist.md)
