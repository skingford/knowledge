---
title: Nginx Ingress、K8s 网关映射与配置迁移实战
description: 系统讲清传统 Nginx 的 server、location、upstream、TLS 与超时等配置，如何映射到 Kubernetes Ingress、Gateway API 与控制器实现上。
---

# Nginx Ingress、K8s 网关映射与配置迁移实战

> 很多人从单机 Nginx 迁到 K8s 时，第一反应是把 `nginx.conf` 整份搬进 ConfigMap。真正的问题通常不是“能不能搬”，而是“哪些规则本来就是入口声明，适合迁到 Ingress / Gateway；哪些逻辑本来就依赖 Nginx 本地能力，不该硬塞进 K8s 入口对象”。

## 1. 先把传统 Nginx 和 K8s 入口对象对上

| 传统 Nginx 概念 | Ingress / Gateway 对应物 | 你真正要理解的映射 |
| --- | --- | --- |
| `server_name` | `spec.rules.host` / `hostnames` | 域名入口匹配 |
| `location` | `paths` / `HTTPRoute.matches` | URL 路径匹配与转发规则 |
| `upstream` | `Service` / `backendRefs` | 后端服务池不再手写 IP，而是交给 Service 抽象 |
| `proxy_pass` | 后端 Service 引用 | 七层路由后转发到 Service |
| `ssl_certificate` / `ssl_certificate_key` | `Secret` + `tls` / `certificateRefs` | 证书从本地文件变成集群资源引用 |
| `proxy_read_timeout` / `client_max_body_size` | annotation、policy、实现配置 | 很多行为不在对象规范本身，而在 controller 实现层 |
| `nginx -t` / reload | `kubectl apply` + controller reconcile | 不再是手工 reload，而是声明式变更由 controller 接管 |

先记住一句最关键的话：

> Ingress / Gateway 不是“另一种写法的 nginx.conf”，它们更像“把入口意图声明出来，再交给 controller 翻译成真正的代理配置”。

## 2. 什么最适合迁到 Ingress / Gateway

最适合直接迁移的，通常是这些“入口声明层”的内容：

- 按域名分站点
- 按路径路由到不同后端
- TLS 终止
- 基础超时、上传大小、简单 rewrite
- WebSocket、gRPC 这类协议入口声明

这类配置的共同点是：

- 本来就是在描述“请求怎么进来、怎么分流”
- 不强依赖某台 Nginx 主机的本地磁盘和本地目录结构
- 可以由 controller 稳定地翻译成数据面配置

## 3. 哪些东西不要强行做 1:1 迁移

最容易出事故的，就是把所有 Nginx 能力都想当然地往 Ingress 上套。

至少要对下面几类内容保持警惕：

- 复杂 `location` 正则优先级
- 大量 `if` / `map` / 自定义变量逻辑
- 本地静态资源目录直出
- `proxy_cache_path` 这类依赖本地磁盘的缓存布局
- `X-Accel-Redirect` 这类本地文件下载网关能力
- 自定义模块、Lua、复杂 snippet

最稳的判断是：

> K8s Ingress / Gateway 适合承接“声明式入口治理”，不适合承接所有依赖本地 Nginx 运行时细节的能力。

## 4. 一份传统 Nginx 配置怎么拆成 Ingress 心智

先看一份典型的单机入口配置：

```nginx
upstream api_backend {
  server 127.0.0.1:8080;
  keepalive 64;
}

server {
  listen 443 ssl http2;
  server_name app.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location /api/ {
    proxy_pass http://api_backend/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }

  location /ws/ {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
  }
}
```

迁移时别先看“语法怎么写”，先看它表达的意图：

- 域名：`app.example.com`
- 路由：`/api/` 和 `/ws/`
- 后端：同一个服务池
- TLS：对外 HTTPS
- 超时：普通 API 和长连接场景不同

只要先把这层“意图矩阵”抽出来，后面迁到 Ingress / Gateway 就不容易乱。

## 5. 把这份入口意图迁成 Ingress

一个最常见的 `ingress-nginx` 映射示例：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-body-size: "20m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: app-example-com-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 8080
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 8080
```

这里和传统 Nginx 最大的变化有三个：

- `upstream` 不再手写节点，改成引用 `Service`
- 证书改成 `Secret`，不再直接写本地文件路径
- 入口行为的很多细节，要通过 annotation 或 controller 配置表达

## 6. gRPC、WebSocket、真实 IP 在 Ingress 里怎么理解

这些问题最容易误以为“还是配那几行 Nginx 指令就好”，但在 K8s 里要先分清配置归属。

### WebSocket

在 `ingress-nginx` 场景里，WebSocket 多数时候不需要你再手写 `Upgrade` 头，而是由 controller 生成对应 Nginx 配置。

你更应该关注的是：

- 长连接超时够不够
- 前面 LB / CDN 是否支持 WebSocket 透传
- 应用和入口的空闲连接回收边界是否一致

### gRPC

gRPC 在 Ingress 里经常不是“路径迁过去就完了”，而是要显式告诉实现：

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
```

这背后表达的是：

- 后端协议不是普通 HTTP 代理
- controller 要生成 gRPC 对应的数据面配置

### 真实 IP

如果前面还有云 LB、WAF、CDN，真实 IP 通常是 controller 级或入口实现级问题，不是单个业务 Ingress 自己能彻底解决的。

最重要的判断是：

> WebSocket、gRPC、真实 IP 这些问题，在 K8s 里往往要同时看对象声明、controller 行为和前置入口设施，不要只盯单个 Ingress YAML。

## 7. Gateway API 怎么看这条映射链

Gateway API 更适合把“入口设施”和“路由规则”拆开。

一个最小骨架示例：

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: shared-gateway
spec:
  gatewayClassName: shared
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: app.example.com
      tls:
        mode: Terminate
        certificateRefs:
          - name: app-example-com-tls
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: app-route
spec:
  parentRefs:
    - name: shared-gateway
  hostnames:
    - app.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: app-service
          port: 8080
    - matches:
        - path:
            type: PathPrefix
            value: /ws
      backendRefs:
        - name: app-service
          port: 8080
```

你可以把它理解成：

- `Gateway` 更像“入口实例”
- `HTTPRoute` 更像“路由规则”
- `GatewayClass` 决定谁来实现这一切

和传统 Nginx 对照时，一个很实用的理解是：

- `server` 的入口实例感，更像 `Gateway`
- `location` 的路由匹配感，更像 `HTTPRoute`
- `upstream` 的后端抽象感，更像 `Service`

## 8. 最常见的迁移误区

### 误区一：把 `location` 匹配优先级想成和 Ingress 一模一样

问题在于：

- 传统 Nginx 有 `=`、`^~`、正则、最长前缀这些细粒度行为
- Ingress 常见只有 `Exact`、`Prefix`、`ImplementationSpecific`

所以不要假设：

- 正则匹配行为一定完全一致
- rewrite 语义一定和原来的 `proxy_pass` 斜杠组合一模一样

### 误区二：把 annotation 当成标准能力

要特别记住：

- annotation 往往是实现相关的
- `ingress-nginx` 能支持，不代表别的 Ingress Controller 也一样支持

### 误区三：把本地文件直出也往 Ingress 里迁

例如：

- 本地 `/srv/www/assets`
- 本地下载目录
- 本地缓存目录

这类能力往往更适合：

- 继续由专门 Nginx 源站承接
- 或迁到对象存储 / CDN

### 误区四：只改对象，不看 controller 和状态

Ingress / Gateway 不生效时，常见根因并不在 YAML 本身，而在：

- class 没对上
- controller 没接管
- Route 没附着
- 后端 Service 或端口没对上

## 9. 一条更稳的迁移步骤

### 第一步：先抽“入口意图矩阵”

把现有 Nginx 配置拆成：

- 域名
- 路径
- 后端服务
- TLS
- 超时 / 上传大小
- 特殊能力，如 rewrite、gRPC、WebSocket、静态文件、本地下载

### 第二步：把能力分成三类

- 可以直接迁到 Ingress / Gateway 的
- 需要 controller 特性或 annotation 才能迁的
- 不适合迁、应该交给对象存储 / CDN / 专门 Nginx 的

### 第三步：先迁入口声明，再迁特殊能力

最稳的顺序通常是：

1. 先跑通 Host / Path / TLS / Service
2. 再补超时、上传大小、rewrite
3. 最后再迁 gRPC、WebSocket、复杂路由或实现相关能力

### 第四步：迁移后按新的排障路径验证

在 K8s 里，验证方式也要一起变：

```bash
kubectl get ingress
kubectl describe ingress app
kubectl get gateway,httproute
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100
```

如果你用的是 `ingress-nginx`，很实用的一招是进入 controller Pod 看生成后的 Nginx 配置：

```bash
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- nginx -T
```

这相当于把“声明式对象”重新拉回到你熟悉的 Nginx 心智里核对一次。

## 10. 学完这页至少要形成的稳定判断

- Ingress / Gateway 不是原封不动替代 `nginx.conf`，而是声明式入口模型
- `server_name`、`location`、`upstream` 可以迁成 Host、Path、Service 心智
- gRPC、WebSocket、真实 IP 这些边界，要同时看对象、controller 和前置 LB / CDN
- 复杂本地能力不一定适合迁进 Ingress，很多时候更适合对象存储、CDN 或专门 Nginx
- 迁移成功的关键不是语法改写，而是“入口意图”和“实现归属”都对上

## 关联资料

- [Nginx 专题总览](./index.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [Nginx 与 OpenResty、Lua 扩展边界和适用场景实战](./openresty-lua-extension-boundaries-and-use-cases.md)
- [Nginx gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)
- [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
- [K8s：Ingress Controller 与 Gateway Controller 实现链路](../k8s/ingress-and-gateway-controller-chain.md)
