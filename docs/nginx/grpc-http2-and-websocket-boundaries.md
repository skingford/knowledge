---
title: Nginx gRPC、HTTP/2 与 WebSocket 边界实战
description: 系统讲清 Nginx 在 gRPC、HTTP/2 与 WebSocket 场景里的协议边界、配置方式、常见误区与排障重点。
---

# Nginx gRPC、HTTP/2 与 WebSocket 边界实战

> 这三类场景最容易混在一起，因为它们都和“长连接”“实时”“HTTP/2”有关，但 Nginx 处理它们的方式并不一样。真正要掌握的是：客户端到 Nginx 是什么协议，Nginx 到上游又是什么协议，应用层到底讲的是 REST、gRPC 还是 WebSocket。

## 1. 先把三条链路拆开看

| 场景 | 客户端到 Nginx | Nginx 到上游 | 常用指令 | 最容易写错 |
| --- | --- | --- | --- | --- |
| 普通 HTTP API | HTTP/1.1 或 HTTP/2 | 通常是 HTTP/1.1 | `proxy_pass` | 以为 `listen ... http2` 之后，上游也自动是 HTTP/2 |
| WebSocket | 握手基于 HTTP/1.1 Upgrade | HTTP/1.1 长连接 | `proxy_pass` + Upgrade 头 | 忘了 `proxy_http_version 1.1` 和升级头 |
| gRPC | gRPC 客户端通常走 HTTP/2 | HTTP/2 | `grpc_pass` | 用 `proxy_pass` 去代理 gRPC |

先记住一句最重要的话：

> `listen 443 ssl http2;` 只说明客户端这一跳可以用 HTTP/2，不等于 Nginx 到上游也自动变成 HTTP/2。

## 2. `listen ... http2` 解决的是哪一跳

最常见的 HTTPS 站点写法：

```nginx
server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location / {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
  }
}
```

这段配置表达的是：

- 浏览器或客户端可以和 Nginx 用 HTTP/2 通信
- Nginx 反向代理到普通上游时，仍然常见是 HTTP/1.1
- `proxy_http_version 2` 这种想当然的写法并不存在

生产里最常见的误解有两个：

- 站点开了 HTTP/2，不代表 WebSocket 就不用配 Upgrade
- 站点开了 HTTP/2，不代表 gRPC 可以继续走 `proxy_pass`

如果你的 Nginx 前面还有云 LB 或 CDN，还要额外确认：

- HTTP/2 是终止在最前面的 LB，还是终止在 Nginx
- Nginx 实际收到的是 HTTP/2 还是被前一跳降成了 HTTP/1.1

## 3. WebSocket 用的还是 `proxy_pass`，核心是 Upgrade

WebSocket 不是 `grpc_pass` 场景，它本质上还是从 HTTP/1.1 握手升级出来的长连接。

```nginx
upstream ws_backend {
  least_conn;
  server 127.0.0.1:7001;
  server 127.0.0.1:7002;
  keepalive 64;
}

server {
  listen 443 ssl http2;
  server_name ws.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location /ws/ {
    proxy_pass http://ws_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }
}
```

你至少要记住这几个点：

- WebSocket 代理仍然是 `proxy_pass`
- `proxy_http_version 1.1` 不能少
- `Upgrade` 和 `Connection` 头必须显式转发
- 长连接场景里，`proxy_read_timeout` 往往要明显大于普通 API
- 长连接数量大时，`least_conn` 往往比简单轮询更稳

如果前面还有 LB、CDN 或 WAF，还要确认它们本身支持 WebSocket 透传，否则 Nginx 配对了也会在前一跳被掐断。

## 4. gRPC 不能用 `proxy_pass`，要用 `grpc_pass`

gRPC 这条线要把两件事分清：

- gRPC 是应用协议，不是普通 REST API
- Nginx 代理 gRPC 时，走的是 `grpc_pass`，不是 `proxy_pass`

最小可用示例：

```nginx
upstream grpc_backend {
  server 127.0.0.1:50051;
  keepalive 64;
}

server {
  listen 443 ssl http2;
  server_name grpc.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location /helloworld.Greeter/ {
    grpc_pass grpc://grpc_backend;
    grpc_set_header Host $host;
    grpc_read_timeout 30s;
    grpc_send_timeout 30s;
  }
}
```

这份配置里最容易忽略的是：

- `grpc://` 表示上游是明文 HTTP/2，也就是常说的 h2c
- 如果上游本身启了 TLS，要改成 `grpcs://`
- gRPC 的 URI 不是随便写路径，而是类似 `/包名.服务名/方法名`
- gRPC 代理要求客户端这一跳也能正确走 HTTP/2，所以常见写法是 `listen 443 ssl http2;`

一条很实用的判断：

> 如果后端服务是普通 JSON/REST API，就想 `proxy_pass`；如果后端服务是 gRPC，就优先想 `grpc_pass`。

## 5. REST、WebSocket、gRPC 混在一台 Nginx 上怎么分

很多系统会在一台 Nginx 上同时接多种流量，这时最好主动把协议边界写清楚。

```nginx
upstream api_backend {
  server 127.0.0.1:8080;
}

upstream ws_backend {
  server 127.0.0.1:7001;
}

upstream grpc_backend {
  server 127.0.0.1:50051;
}

server {
  listen 443 ssl http2;
  server_name gateway.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location /api/ {
    proxy_pass http://api_backend/;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /ws/ {
    proxy_pass http://ws_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
  }

  location /helloworld.Greeter/ {
    grpc_pass grpc://grpc_backend;
    grpc_set_header Host $host;
    grpc_read_timeout 30s;
  }
}
```

这类混合入口最稳的工程建议是：

- REST、WebSocket、gRPC 分别用各自明确的 `location`
- 路径式拆分能用，但服务一多时，子域名拆分通常更清晰
- 不要把所有协议都塞进一个“万能 `/` 代理”里再靠猜

## 6. 最常见的线上误区

### 误区一：开了 HTTP/2，就以为上游自动也是 HTTP/2

错因：

- `listen ... http2` 只影响客户端到 Nginx

正确理解：

- 普通反向代理仍然优先按 `proxy_pass` + HTTP/1.1 来理解
- 只有 gRPC 这类明确需要 HTTP/2 的上游，才走 `grpc_pass`

### 误区二：把 gRPC 当普通 API 去配

常见现象：

- 直接 `proxy_pass http://grpc_backend;`
- 结果返回 502、协议错误、调用失败

正确做法：

- 先确认上游到底是 REST 还是 gRPC
- gRPC 用 `grpc_pass`
- 再确认上游是 `grpc://` 还是 `grpcs://`

### 误区三：WebSocket 只写 `proxy_pass`

常见现象：

- 普通接口正常
- 但实时连接握手失败或连上后马上断开

正确做法：

- 补齐 `proxy_http_version 1.1`
- 补齐 `Upgrade` 和 `Connection`
- 再根据业务调整长连接超时

### 误区四：路径匹配没对上协议入口

常见现象：

- gRPC 请求被普通 `/` 代理吞掉
- WebSocket 请求落到了静态资源或 API 规则

正确做法：

- 优先保证 `location` 设计清晰
- 用 `nginx -T` 看最终展开配置，不要只看单个片段

## 7. 遇到问题时怎么排

先按协议分工具：

- 普通 HTTP API：`curl -vk https://api.example.com/...`
- WebSocket：浏览器 Network 面板、`wscat` 或同类工具
- gRPC：`grpcurl` 检查连通性、服务列表和方法调用

再按这条顺序排：

1. `nginx -t` 和 `nginx -T`，先确认语法和最终生效配置
2. 看 `location` 是否真的命中了对应协议入口
3. 看上游端口是否真的在监听，而且协议类型一致
4. 看错误日志里是连接失败、超时，还是协议不匹配
5. 确认前置 LB/CDN 有没有把 WebSocket 或 HTTP/2 特性截断

最常见的根因并不神秘，通常就这几类：

- 路径没匹配对
- gRPC 写成了 `proxy_pass`
- WebSocket 少了升级头
- 明文 gRPC 和 TLS gRPC 写反了
- 超时照搬普通 API，导致长连接或流式请求异常

## 8. 学完这页至少要形成的稳定判断

- `listen 443 ssl http2;` 解决的是客户端到 Nginx 这一跳
- 普通 REST 代理优先想 `proxy_pass`
- WebSocket 还是 `proxy_pass`，但要补 Upgrade 头
- gRPC 不是普通 HTTP 代理，应该优先想 `grpc_pass`
- 路径设计、超时和前置 LB 能力，会直接决定这些协议是否稳定

## 关联资料

- [Nginx 专题总览](./index.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
- [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
