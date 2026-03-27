---
title: Nginx 配置、Location 匹配与反向代理
description: 系统整理 Nginx 的配置结构、server_name 与 location 匹配规则、root 与 alias、try_files、proxy_pass、负载均衡与 WebSocket 配置。
---

# Nginx 配置、Location 匹配与反向代理

> Nginx 最容易踩坑的地方，不是“不会写配置”，而是“配置看起来差不多，实际行为完全不一样”。这页重点讲最容易出线上事故的几处：`location` 匹配、`root` 与 `alias`、`proxy_pass` 尾部斜杠、真实客户端头和 WebSocket。

## 1. 先看一份最小可用结构

```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include       mime.types;
  default_type  application/octet-stream;

  log_format main '$remote_addr - $host "$request" $status $body_bytes_sent '
                  '"$http_referer" "$http_user_agent" $request_time';

  access_log /var/log/nginx/access.log main;
  error_log  /var/log/nginx/error.log warn;

  upstream app_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    keepalive 32;
  }

  server {
    listen 80;
    server_name example.com www.example.com;

    location /assets/ {
      root /srv/www/app;
      expires 30d;
    }

    location /api/ {
      proxy_pass http://app_backend;
    }
  }
}
```

这份结构里最重要的是分层意识：

- `http` 放全局 HTTP 行为
- `upstream` 放后端池
- `server` 选站点
- `location` 选路径处理规则

## 2. `server_name` 是怎么选中的

当请求进来时，Nginx 会先基于监听端口找 `server`，再结合 `Host` 头去匹配 `server_name`。

你至少要知道下面几种形式：

- 精确域名：`server_name example.com;`
- 多域名：`server_name example.com www.example.com;`
- 通配符：`server_name *.example.com;`
- 默认站点：没匹配到更具体规则时，落到默认 `server`

最实用的工程建议：

- 明确写出主域名和常用别名
- 把默认站点做成一个可识别、可控的兜底
- 不要把不相关站点混在一个 `server` 里硬分支

## 3. `location` 匹配优先级必须背熟

这部分是 Nginx 高频坑点。

### 常见写法

| 写法 | 含义 |
| --- | --- |
| `location = /foo` | 精确匹配 |
| `location /foo` | 普通前缀匹配 |
| `location ^~ /foo/` | 前缀匹配且命中后不再走正则 |
| `location ~ \.php$` | 区分大小写的正则匹配 |
| `location ~* \.(jpg|png)$` | 不区分大小写的正则匹配 |

### 一个稳定记忆顺序

1. 先看精确匹配 `=`
2. 再看最长前缀匹配
3. 如果命中的前缀是 `^~`，直接用它
4. 否则继续尝试正则匹配
5. 如果正则都没命中，回到最长前缀匹配

可以直接记成一句：

> `=` 最强，`^~` 会截断正则，正则按出现顺序匹配，最后兜底最长前缀。

## 4. `root` 和 `alias` 不要混着用

这是静态资源 404 的高频根因。

### `root`

`root` 会把请求 URI 追加到目录后面。

```nginx
location /images/ {
  root /data/www;
}
```

请求 `/images/logo.png` 时，实际文件路径通常会变成：

```text
/data/www/images/logo.png
```

### `alias`

`alias` 会用指定目录替换掉当前 `location` 匹配部分。

```nginx
location /images/ {
  alias /data/assets/;
}
```

请求 `/images/logo.png` 时，实际文件路径通常会变成：

```text
/data/assets/logo.png
```

最稳的使用建议：

- 目录映射整段替换，用 `alias`
- 以站点根目录为基准拼接路径，用 `root`
- 写完后一定实际 `curl` 或浏览器验证，不要只靠想象

## 5. `try_files` 是做什么的

`try_files` 的价值是按顺序检查文件是否存在，再决定回哪个结果。

最典型的 SPA 配法：

```nginx
location / {
  root /srv/www/app;
  try_files $uri $uri/ /index.html;
}
```

这条规则的语义是：

- 先找真实文件
- 再找目录
- 都没有时，交给 `/index.html`

很适合前端路由场景。

## 6. `proxy_pass` 的尾部斜杠差异一定要会

这是反向代理里最经典的坑之一。

### 场景一：不带尾部斜杠

```nginx
location /api/ {
  proxy_pass http://backend;
}
```

请求 `/api/users` 时，转发后的 URI 通常仍然带 `/api/users`。

### 场景二：带尾部斜杠

```nginx
location /api/ {
  proxy_pass http://backend/;
}
```

请求 `/api/users` 时，匹配到的 `/api/` 前缀会被替换成 `/`，上游常看到的是 `/users`。

最稳的实践是：

- 设计代理规则前先想清楚上游到底期望收到什么路径
- 路径一旦不对，先检查 `location` 和 `proxy_pass` 的斜杠组合

## 7. 代理上游时哪些头一定要带

至少要掌握这一组：

```nginx
location /api/ {
  proxy_pass http://app_backend;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

各自作用：

- `Host`：让上游知道原始域名
- `X-Real-IP`：传单个客户端 IP
- `X-Forwarded-For`：传代理链路 IP 列表
- `X-Forwarded-Proto`：告诉上游原始协议是 HTTP 还是 HTTPS

如果上游业务要做：

- 域名路由
- 回调地址拼装
- 客户端 IP 审计
- HTTPS 判断

这些头通常都很关键。

## 8. WebSocket 不能只写 `proxy_pass`

WebSocket 是升级协议，请求头必须显式转发。

```nginx
location /ws/ {
  proxy_pass http://app_backend;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

如果忘了这些配置，常见现象是：

- 握手失败
- 连接直接断开
- HTTP 请求看似正常，但 WebSocket 连不上

## 9. `upstream` 怎么理解

`upstream` 本质上是后端节点池。

```nginx
upstream app_backend {
  least_conn;
  server 10.0.0.11:8080;
  server 10.0.0.12:8080;
  keepalive 64;
}
```

常见能力：

- 轮询：默认行为
- `least_conn`：把新请求优先分给当前连接更少的节点
- `ip_hash`：尽量按客户端 IP 做稳定分发
- `keepalive`：保持到上游的长连接，减少反复建连开销

要注意：

- Nginx 开源版健康检查能力有限，很多场景需要依赖被动失败判断或外部治理
- `ip_hash` 适合简单会话粘性，但不适合复杂状态治理

## 10. 常用代理超时别乱配

最常见的几类超时：

| 指令 | 作用 |
| --- | --- |
| `proxy_connect_timeout` | 连接上游的超时 |
| `proxy_send_timeout` | 向上游发送请求的超时 |
| `proxy_read_timeout` | 等待上游响应的超时 |
| `send_timeout` | 向客户端发送响应的超时 |

一个常见误区是：

- 后端慢，就把所有超时一股脑调很大

更好的做法是：

- 先分清是连接慢、应用处理慢，还是客户端读得慢
- 再只调整对应环节

## 11. 一份更接近生产的常用配置

```nginx
upstream app_backend {
  least_conn;
  server 127.0.0.1:8080;
  server 127.0.0.1:8081;
  keepalive 32;
}

server {
  listen 80;
  server_name example.com;

  location /assets/ {
    alias /srv/www/app/assets/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }

  location /api/ {
    proxy_pass http://app_backend/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 3s;
    proxy_read_timeout 30s;
  }

  location / {
    root /srv/www/app;
    try_files $uri $uri/ /index.html;
  }
}
```

## 12. 改配置前后的基本动作

改完配置后，至少做这三步：

```bash
nginx -t
nginx -T | less
nginx -s reload
```

其中：

- `nginx -t` 看语法和基本校验
- `nginx -T` 把完整生效配置展开出来，适合查 `include`
- `reload` 前先确认校验通过

## 关联资料

- [Nginx 专题总览](./index.md)
- [核心概念与请求处理模型](./core-concepts.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [Nginx gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
