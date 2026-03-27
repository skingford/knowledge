---
title: Nginx 上游、负载均衡与失败处理
description: 系统整理 Nginx upstream、负载均衡、keepalive、超时、失败重试、会话粘性与常见生产边界。
---

# Nginx 上游、负载均衡与失败处理

> Nginx 真正进入生产环境后，最容易出问题的不是“能不能代理”，而是“后端一慢、一抖、一部分节点挂了之后会怎样”。这页重点补齐 `upstream`、负载均衡、超时、失败重试和连接复用这条主线。

## 1. `upstream` 到底解决什么问题

`upstream` 的核心价值，是把多个后端节点收成一个统一的上游池。

这样做的好处：

- 对前面的 `location` 来说，只要代理到一个逻辑名字
- 节点扩缩容时，不用把代理规则写散
- 负载均衡、连接复用、失败重试可以在一处集中配置

最稳的口径：

> `upstream` 是 Nginx 对后端服务池的抽象，用来定义后端节点、分发策略和部分连接行为。

## 2. 一份最常见的 `upstream` 配置

```nginx
upstream app_backend {
  least_conn;
  server 10.0.0.11:8080 max_fails=3 fail_timeout=10s;
  server 10.0.0.12:8080 max_fails=3 fail_timeout=10s;
  keepalive 64;
}

server {
  listen 80;
  server_name example.com;

  location /api/ {
    proxy_pass http://app_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 3s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
  }
}
```

## 3. 常见负载均衡策略怎么区分

### 默认轮询

特点：

- 新请求按顺序分给各节点
- 简单直接，适合大多数无状态服务

### `least_conn`

特点：

- 优先把新请求分配给当前活动连接更少的节点
- 适合请求处理时长差异较大的场景

### `ip_hash`

特点：

- 尽量让同一客户端 IP 落到同一节点
- 适合简单会话粘性场景

但要注意：

- 客户端 IP 经过 NAT、CDN、LB 后可能不稳定
- 它不是完整的会话治理方案

一个很实用的选择原则：

- 无状态 API：先用默认轮询或 `least_conn`
- 简单粘性需求：再考虑 `ip_hash`
- 真正依赖会话状态：优先把状态外置到 Redis、数据库或独立 Session 存储

## 4. `keepalive` 为什么重要

Nginx 和上游之间如果每次都重新建连，开销会很高。

```nginx
upstream app_backend {
  server 10.0.0.11:8080;
  server 10.0.0.12:8080;
  keepalive 64;
}
```

这能带来两个直接收益：

- 降低 TCP 建连和 TLS 建连开销
- 提高代理链路吞吐

不过要搭配下面这种写法一起理解：

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```

否则上游长连接未必能真正复用起来。

## 5. `max_fails` 和 `fail_timeout` 是什么

```nginx
server 10.0.0.11:8080 max_fails=3 fail_timeout=10s;
```

可以把它理解成：

- 在一定时间窗口里，连续达到失败阈值
- 这个节点会被临时认为不可用一段时间

但要特别注意：

- 这更接近被动失败判断，不是主动健康检查
- Nginx 开源版对主动健康检查支持有限
- 它不能替代应用探针、服务注册发现或更上层的治理

一句话：

> `max_fails` + `fail_timeout` 只能做基础被动摘流量，不等于完整健康检查系统。

## 6. 超时要拆成三段，不要一起调大

### `proxy_connect_timeout`

表示：

- Nginx 连接上游的超时

适合发现：

- 上游端口不通
- 网络异常
- 节点不可达

### `proxy_send_timeout`

表示：

- Nginx 把请求发送给上游的超时

### `proxy_read_timeout`

表示：

- Nginx 等待上游响应的超时

最常见的线上情况是：

- `502` 更像连接失败或协议异常
- `504` 更像等待上游太久

一个很实用的原则：

> 先分清连接慢、发送慢还是处理慢，再调对应超时，不要把所有超时一起放大。

## 7. `proxy_next_upstream` 是什么

它控制的是：

- 当前上游失败时，是否允许切到下一个节点重试

常见写法：

```nginx
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 5s;
```

这套配置要谨慎使用，因为它涉及幂等性。

### 适合重试的情况

- GET、HEAD 这类幂等请求
- 明确允许幂等重试的读操作

### 不适合轻易重试的情况

- 已经进入业务执行阶段的写请求
- 非幂等接口
- 支付、库存扣减、状态推进类请求

一句话：

> Nginx 代理重试不是免费午餐，读请求相对安全，写请求一定要先确认幂等性边界。

## 8. 会话粘性不要只靠 Nginx 硬扛

很多人第一反应是：

- 登录态不稳
- 某些请求必须打到同一台
- 那就上 `ip_hash`

这在小系统里可以临时缓解问题，但长期看有几个风险：

- 节点扩缩容后，映射可能变化
- 一台节点热点更集中
- 会话状态绑在单机上，不利于弹性和故障恢复

更稳的方案通常是：

- 登录态外置
- 服务无状态化
- 粘性仅作为过渡手段，而不是长期设计基础

## 9. WebSocket 和长连接场景要注意什么

WebSocket、SSE、长轮询这类场景里，负载均衡策略和超时会更敏感。

重点注意：

- 连接会占用更久
- `least_conn` 往往比简单轮询更合理
- `proxy_read_timeout` 要符合长连接业务特征
- 上游和 Nginx 的连接数、文件句柄、worker 容量要一起评估

## 10. 一份偏生产的 API 代理配置

```nginx
upstream api_backend {
  least_conn;
  server 10.0.0.11:8080 max_fails=3 fail_timeout=10s;
  server 10.0.0.12:8080 max_fails=3 fail_timeout=10s;
  keepalive 128;
}

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
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 2s;
    proxy_send_timeout 15s;
    proxy_read_timeout 15s;

    proxy_next_upstream error timeout http_502 http_503 http_504;
    proxy_next_upstream_tries 2;
    proxy_next_upstream_timeout 3s;
  }
}
```

## 11. 判断问题到底在 Nginx 还是上游的一条主线

### 更像 Nginx 层问题

- 配置语法错误
- `location` 匹配错
- 代理头缺失
- 超时和重试策略明显不合理

### 更像上游问题

- 端口没监听
- 应用处理太慢
- 应用崩溃
- 依赖数据库、Redis、第三方接口过慢

最实用的一句话：

> Nginx 更常暴露问题，而不是制造问题本身。出现 502/504 时，配置和链路要查，但上游健康度往往才是根因。

## 12. 学完这页至少要形成的判断

- `upstream` 是后端服务池，不只是一个别名
- 默认轮询、`least_conn`、`ip_hash` 各有边界
- `keepalive` 能明显改善代理性能，但要配合 HTTP/1.1 头部一起看
- `max_fails` / `fail_timeout` 只是基础被动失败处理
- 代理重试必须考虑请求幂等性
- 502 和 504 多数时候是上游治理问题，不只是 Nginx 问题

## 关联资料

- [Nginx 专题总览](./index.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [Nginx gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)
- [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
