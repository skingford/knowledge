---
title: Nginx HTTPS、性能优化与安全基线
description: 系统整理 Nginx 的 HTTPS 配置、TLS 终止、缓存头、压缩、静态资源优化、限流与常见安全基线。
---

# Nginx HTTPS、性能优化与安全基线

> 很多人把 Nginx 用在生产环境里，真正踩坑往往不在“站点能不能打开”，而在“HTTPS 是否完整、缓存策略是否合理、性能和安全配置是否够稳”。这页讲上线前必须补齐的基础盘。

## 1. HTTPS 先理解 4 个对象

| 对象 | 作用 |
| --- | --- |
| 证书文件 | 对外证明服务端身份 |
| 私钥文件 | 和证书配套，不能泄露 |
| 完整证书链 | 让客户端能正确验证证书链条 |
| 域名/SNI | 客户端根据域名选择正确证书 |

最容易犯的错：

- 证书和私钥不匹配
- 没配完整链，部分客户端报证书不完整
- 域名不对，导致证书校验失败

## 2. 一份基础 HTTPS 配置

```nginx
server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com www.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location / {
    proxy_pass http://app_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

这份配置的核心动作只有两个：

- 把 80 统一跳到 HTTPS
- 在 443 上完成 TLS 终止，再把请求转给上游

## 3. TLS 终止到底是什么意思

TLS 终止的意思是：

- 客户端和 Nginx 之间走 HTTPS
- Nginx 解密后，再决定向上游转发 HTTP 还是 HTTPS

这带来两个直接影响：

- 证书管理集中在 Nginx
- 上游服务需要通过 `X-Forwarded-Proto` 才知道原始请求是不是 HTTPS

如果上游要生成回调地址、重定向地址、绝对 URL，这个头通常不能少。

## 4. HTTP 跳转和 HSTS 要分开理解

### HTTP 跳转

作用是把用户从 `http://` 拉到 `https://`。

```nginx
return 301 https://$host$request_uri;
```

### HSTS

作用是告诉浏览器：

- 之后一段时间内，直接用 HTTPS 访问，不要再试 HTTP

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

但 HSTS 不要随手开得太猛。只有在下面条件都确认稳定后再上：

- 站点已长期稳定支持 HTTPS
- 子域名也都能正确支持 HTTPS
- 已确认没有必须保留 HTTP 的旧入口

## 5. 静态资源缓存怎么配更合理

最稳的实践不是“所有东西都缓存一年”，而是区分资源类型。

### 适合长期缓存的

- 带 hash 的 JS/CSS
- 指纹化图片和字体

```nginx
location /assets/ {
  alias /srv/www/app/assets/;
  expires 30d;
  add_header Cache-Control "public, max-age=2592000, immutable";
}
```

### 不适合长期缓存的

- HTML 页面
- 接口响应
- 经常变化但没有版本指纹的资源

一个经验法则：

> 有版本指纹的资源可以长缓存；没有指纹的资源要更保守。

## 6. 压缩和传输优化先做这些基础项

```nginx
gzip on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript application/xml;

sendfile on;
keepalive_timeout 65;
```

各自作用：

- `gzip`：压缩文本类响应，减少传输体积
- `sendfile`：静态文件传输更高效
- `keepalive_timeout`：减少连接反复建立成本

注意点：

- 图片、视频、zip 这类已压缩内容通常不必再 gzip
- 压缩和缓存要一起考虑，不要只盯一个方向

## 7. 代理性能常见基线

### 上游长连接

```nginx
upstream app_backend {
  server 127.0.0.1:8080;
  keepalive 64;
}
```

作用：

- 减少 Nginx 到上游反复建连的开销

### 超时设置

```nginx
proxy_connect_timeout 3s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
```

作用：

- 防止异常连接长期占着资源
- 让 504 暴露得更明确，而不是无限等待

### 上传体积限制

```nginx
client_max_body_size 20m;
```

作用：

- 明确限制上传大小，避免默认值不符合业务预期

## 8. 基础安全配置至少补这些

### 隐藏版本信息

```nginx
server_tokens off;
```

作用：

- 减少对外暴露 Nginx 版本细节

### 限流和连接限制

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
  location /api/ {
    limit_req zone=api_limit burst=40 nodelay;
    limit_conn conn_limit 50;
    proxy_pass http://app_backend;
  }
}
```

作用：

- 对接口做基础突发控制
- 防止单个来源占满连接

### 真实 IP 的信任边界

如果 Nginx 前面还有 LB 或 CDN，千万不要直接相信任意 `X-Forwarded-For`。

核心原则是：

- 只信任你明确控制的上一跳代理
- 真实 IP 配置要和网络拓扑一致

否则很容易出现：

- 日志里客户端 IP 可伪造
- 风控、审计、限流失真

## 9. 不要一开始就乱调 `worker_connections`

性能优化最容易犯的错，是看到高并发就开始把数字调大。

更稳的顺序应该是：

1. 先确认瓶颈在 Nginx，还是上游应用
2. 先做缓存头、压缩、长连接、静态资源直出这些低风险优化
3. 再看连接数、文件句柄、系统参数是否真的需要联动调整

一句话：

> 基础性能优化先做传输和缓存，再做连接与系统参数调优。

## 10. 上线前的最小检查清单

- 证书文件、私钥和完整链路径都正确
- HTTP 已正确跳转到 HTTPS
- 上游收到了 `Host`、`X-Forwarded-For`、`X-Forwarded-Proto`
- 静态资源缓存策略和 HTML 区分开了
- 压缩只作用在适合压缩的内容上
- 上传大小、超时、限流都有明确边界
- 配置改动前后都做了 `nginx -t`

## 关联资料

- [Nginx 专题总览](./index.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md)
- [Nginx + Let's Encrypt / certbot 自动续期实战](./lets-encrypt-and-certbot-renewal-practice.md)
- [Nginx 限流、黑白名单与基础安全防护实战](./rate-limit-allowlist-and-security-hardening.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [必备问题与自检清单](./essential-questions.md)
