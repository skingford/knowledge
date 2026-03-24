---
title: NetworkPolicy 与东西向访问控制实战
description: 系统讲清 Kubernetes 中 NetworkPolicy 的默认拒绝、Ingress/Egress、生效前提、selector 语义、DNS 放行、ipBlock 边界与常见排障方法。
---

# NetworkPolicy 与东西向访问控制实战

很多人第一次配 `NetworkPolicy`，表面上是在做“网络隔离”，实际踩坑通常集中在这几类：

- Service 名能解析，但就是连不上
- 一开默认拒绝，连 DNS 都一起挂了
- `podSelector`、`namespaceSelector` 写了半天，结果匹配错了
- 明明放了入口，调用还是被拒
- 以为 `NetworkPolicy` 能替代 RBAC、WAF 或第三方白名单

这些问题的核心，不是 YAML 难写，而是没把它放回正确的链路里。

<K8sDiagram kind="networkpolicy-enforcement-chain" />

## 1. 先回答：NetworkPolicy 到底解决什么问题

`NetworkPolicy` 解决的是：

- Pod 和 Pod 之间能不能通信
- Pod 能不能主动访问外部
- 哪些入口流量可以进某类 Pod

它不解决的是：

- 谁能调用 `kube-apiserver`
- 谁能读哪个资源对象
- HTTP Header、URL、用户身份、业务权限
- 固定公网入口、固定出口 IP、第三方白名单

一句话：

> `NetworkPolicy` 是运行时 L3/L4 流量边界，不是 API 权限系统，也不是七层安全网关。

## 2. 生效前提：不是写了就一定有用

这是最容易被忽略的前提。

`NetworkPolicy` 真正能不能生效，取决于：

- 底层 CNI 是否支持 `NetworkPolicy`
- 该 CNI 是否真的启用了策略能力
- 你的集群发行版有没有额外限制

所以“配了没效果”的第一问不该是：

- YAML 对不对

而应该先问：

- 这个集群的 CNI 到底支不支持并启用了 `NetworkPolicy`

## 3. 两个方向一定要拆开：Ingress 和 Egress

`NetworkPolicy` 最核心的第一层，不是 selector，而是方向。

### 3.1 Ingress

控制的是：

- 谁能进来访问我

### 3.2 Egress

控制的是：

- 我能主动访问谁

### 3.3 一条连接要真正放通，通常要两边都允许

这点非常关键：

- 目标 Pod 的 `Ingress` 要允许来源
- 源 Pod 的 `Egress` 也要允许目标
- 已被允许连接的返回流量通常会被隐式放行，不需要你再反向写一遍对称规则

工程上更实用的记忆方式是：

> 东西向调用要打通，不只看“对方让不让我进”，还要看“我自己让不让我出”。

## 4. 什么时候 Pod 会进入“隔离”状态

这也是一个高频误区。

并不是所有 Pod 默认都被策略隔离。

更准确地说：

- 如果某个方向上没有任何 `NetworkPolicy` 选中这个 Pod
- 那么这个 Pod 在这个方向上通常还是非隔离的

但一旦：

- 有某个 `Ingress` policy 选中了它

那么它在入口方向上就进入“默认拒绝，按规则放行”的模式。

同理：

- 有某个 `Egress` policy 选中了它

那么它在出口方向上也会进入“默认拒绝，按规则放行”的模式。

这就是为什么很多团队一加“默认拒绝”后，感觉整个 namespace 都突然像断网了一样。

## 5. 规则不是覆盖关系，而是并集关系

这是官方语义里非常重要的一点。

`NetworkPolicy` 不是“后写的覆盖前写的”，而是：

- 多条策略的允许结果做并集
- 只要有一条规则允许，这部分流量就可以通过

所以更准确的心智模型是：

- policy 之间不是互斥覆盖
- 它们一起定义允许集合

但要注意：

- 连接是否最终能通，仍然要结合源的 egress 和目标的 ingress 两边一起看

## 6. `podSelector`、`namespaceSelector`、`ipBlock` 到底怎么理解

<K8sDiagram kind="networkpolicy-selector-logic" />

### 6.1 `podSelector`

它最容易记成：

- 选中同命名空间里的某类 Pod

也就是说，单独一个 `podSelector`，默认语义通常是：

- 当前 namespace 内
- 满足这些 label 的 Pod

### 6.2 `namespaceSelector`

它解决的是：

- 选中某些 namespace

常见做法是：

- 用 `kubernetes.io/metadata.name` 这种标签选中特定 namespace

### 6.3 `namespaceSelector + podSelector`

这里最容易写错。

如果它们写在**同一个条目里**，语义通常是：

- 选中这些 namespace 中
- 满足这些 label 的 Pod

也就是：

- AND 关系

### 6.4 分成两个列表项时，通常是 OR

如果你写成：

- 一项只带 `namespaceSelector`
- 另一项只带 `podSelector`

那语义通常更接近：

- 满足其中任意一项即可

也就是：

- OR 关系

这类错误非常隐蔽，也是很多“明明 policy 看起来差不多，结果行为完全不同”的根源。

### 6.5 `ipBlock`

`ipBlock` 更适合：

- 集群外部固定网段
- 外部系统或办公网段

通常不建议把它拿来表达：

- Pod IP 白名单
- 集群内成员身份

因为：

- Pod IP 本身易变
- 某些场景会经历 SNAT / DNAT
- Service / Node / 外部 LB 经过数据面转换后，看到的地址不一定是你以为的那个

更稳的经验是：

> 集群内成员身份优先用 label selector；`ipBlock` 更适合表达集群外网络边界。

## 7. 最实用的起手式：默认拒绝 + 明确放行

很多团队最终会落成这个模式：

1. 先给 namespace 做默认拒绝
2. 再按调用链逐步放行真正需要的入口和出口
3. 把 DNS、监控、日志、配置等基础依赖单独补出来

最小的默认拒绝骨架通常长这样：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
    - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
spec:
  podSelector: {}
  policyTypes:
    - Egress
```

含义是：

- 这个 namespace 下所有 Pod
- 入口和出口都先默认不放行

## 8. DNS 为什么经常在第一天就被一起挡死

因为应用大多不是直接访问 IP，而是先解析名字。

一旦你做了 `default deny egress`，但没额外放行 DNS，常见现象就是：

- `curl service-name` 报解析失败
- 外部域名解析失败
- 应用日志里全是 `no such host`

一个常见放行骨架大概是：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

这类配置有两个注意点：

- `kube-dns` 的 label 在不同发行版里可能不完全一样，要按实际集群调整
- 如果你的 DNS 不是走这组 Pod，也要按真实链路放行

## 9. 一个更像生产的最小放行示例

假设链路是：

- `frontend` 调 `api`
- `api` 调 `mysql`

那思路通常不是“放开所有”，而是按链路逐跳声明。

例如只允许 `frontend` 访问 `api`：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-frontend
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
```

这表达的是：

- 被选中的目标是 `api` Pod
- 只允许同 namespace 下 label 为 `frontend` 的 Pod
- 访问 `8080`

接下来如果 `api` 还要访问数据库，你还得单独补：

- `api` 的 egress
- `mysql` 的 ingress

## 10. 为什么 Service 正常、DNS 正常，但调用还是不通

这是 `NetworkPolicy` 最典型的迷惑现象。

因为这三件事不是一回事：

- DNS 正常：说明名字能解析
- Service 正常：说明稳定入口和后端对象看起来没坏
- 连接能建立：还要看 `NetworkPolicy` 有没有放行

所以一个特别容易误判的现象是：

- `nslookup api.default.svc.cluster.local` 正常
- `curl api.default.svc.cluster.local:8080` 超时

这时就应该立刻把怀疑范围拉到：

- 目标 Pod 的 ingress policy
- 源 Pod 的 egress policy
- DNS 放行和业务放行是不是只做了一半

## 11. 最容易踩的坑

### 坑 1：只做了 default deny，忘了 DNS

最常见。

### 坑 2：只放目标 ingress，没放源 egress

这类问题在线上非常像“对方服务抽风”，其实是自己根本出不去。

### 坑 3：把 `podSelector` 误当成跨 namespace 选择器

单独 `podSelector` 通常不是跨命名空间。

### 坑 4：把同一个条目里的 `namespaceSelector + podSelector` 和分成两个条目混为一谈

前者更像 AND，后者更像 OR。

### 坑 5：以为 `ipBlock` 适合描述 Pod 身份

大多数时候并不稳。

### 坑 6：底层 CNI 不支持或没启用 `NetworkPolicy`

这时你改再多 YAML，现象都像“没效果”。

### 坑 7：把 `NetworkPolicy` 当成 Service Mesh 或 WAF

它不看：

- URL
- Header
- JWT
- 用户身份
- 业务方法级权限

它更底层，也更简单。

## 12. 最短排障顺序

如果线上现象是：

- DNS 正常，但连接超时
- 只有某些 namespace 之间调不通
- 开了默认拒绝后部分服务全挂

建议顺序是：

1. 先确认 CNI 是否支持并启用了 `NetworkPolicy`
2. 再看源 Pod 和目标 Pod 分别被哪些 policy 选中
3. 先拆方向：源 egress 有没有放，目标 ingress 有没有放
4. 检查 DNS egress 是否被一起挡了
5. 再看 selector 是否写错 namespace / label / AND / OR
6. 最后再看是不是应用端口、Service 或 CNI 本身问题

常用命令：

```bash
kubectl get networkpolicy -A
kubectl describe networkpolicy <policy-name> -n <namespace>

kubectl get pod -n <namespace> --show-labels
kubectl get ns --show-labels

kubectl exec -it <src-pod> -n <namespace> -- nslookup kubernetes.default
kubectl exec -it <src-pod> -n <namespace> -- nc -vz <service-name> <port>
kubectl logs -n kube-system <cni-pod>
```

## 13. 一套面试答法

如果面试官问：

> `NetworkPolicy` 是怎么工作的？为什么有时 Service 正常但还是连不上？

你可以这样答：

> `NetworkPolicy` 控制的是 Pod 级别的 L3/L4 访问边界，前提是底层 CNI 支持并实现了策略能力。  
> 一旦某个方向上有 policy 选中了 Pod，它在这个方向上就会进入“默认拒绝，按规则放行”的模式；多条 policy 的允许结果是并集。  
> 真正一条东西向连接能否打通，通常要同时满足源 Pod 的 egress 和目标 Pod 的 ingress。  
> 所以即使 Service 对象正常、DNS 正常，连接仍然可能被 `NetworkPolicy` 挡住。  
> 工程上最常见的做法是 default deny 再按链路显式放行，同时别忘了先把 DNS egress 放出来。  

## 14. 最后记住这句话

> `NetworkPolicy` 最容易答错的不是 YAML 语法，而是没先拆方向、没先分清 selector 语义、也没意识到 DNS 只是“能找到”，不是“能连上”。

## 关联阅读

- [K8s 核心概念与对象模型](./core-concepts.md)
- [K8s 必备问题清单](./essential-questions.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [CoreDNS 与服务发现实战](./coredns-and-service-discovery.md)
- [kube-proxy 与 Service 数据面实战](./kube-proxy-and-service-dataplane.md)
- [Service Mesh 与东西向流量实战](./service-mesh-and-east-west-traffic.md)
- [K8s 网络排障手册](./network-troubleshooting.md)
