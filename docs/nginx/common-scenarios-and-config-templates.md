---
title: Nginx 常见场景与配置模板
description: 整理 Nginx 在 SPA、API、WebSocket、文件上传下载、维护页与真实 IP 处理中的常见配置模板和注意事项。
---

# Nginx 常见场景与配置模板

> 学完概念和规则后，最好再有几份“能直接套进去改”的模板。这页不追求覆盖所有花哨配置，只收最常见、最容易上线用到的几类场景。

## 1. SPA 静态站点 + API 反向代理

适合场景：

- 前端静态文件由 Nginx 直出
- `/api/` 转发到后端服务
- 前端路由由 `index.html` 兜底

```nginx
upstream app_backend {
  server 127.0.0.1:8080;
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
  }

  location / {
    root /srv/www/app;
    try_files $uri $uri/ /index.html;
  }
}
```

重点：

- `/assets/` 长缓存
- HTML 用 `try_files` 兜底，不要直接长缓存
- `/api/` 路径和 `proxy_pass` 斜杠组合要和后端接口实际路径对齐

## 2. 纯 API 服务入口

适合场景：

- Nginx 只作为统一入口
- 所有请求都代理到后端服务

```nginx
upstream api_backend {
  least_conn;
  server 127.0.0.1:9001;
  server 127.0.0.1:9002;
  keepalive 64;
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
    proxy_read_timeout 15s;
  }
}
```

重点：

- 记得把原始域名、IP、协议头传给上游
- `keepalive` 和超时一起考虑

## 3. WebSocket 代理

适合场景：

- 聊天、实时通知、终端、协作编辑

```nginx
upstream ws_backend {
  server 127.0.0.1:7001;
}

server {
  listen 80;
  server_name ws.example.com;

  location /ws/ {
    proxy_pass http://ws_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
  }
}
```

重点：

- 不能少 `Upgrade` 和 `Connection`
- 长连接场景下 `proxy_read_timeout` 通常要比普通 API 更长

## 4. 大文件上传

适合场景：

- 图片、音视频、文档上传

```nginx
upstream upload_backend {
  server 127.0.0.1:8080;
}

server {
  listen 80;
  server_name upload.example.com;

  location /upload/ {
    client_max_body_size 100m;
    proxy_request_buffering off;
    proxy_pass http://upload_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 300s;
  }
}
```

重点：

- 先确认 `client_max_body_size`
- 上传链路长时，`proxy_read_timeout` 往往也要一起看
- 是否关闭请求缓冲，要根据上游处理模式和资源消耗决定

## 5. 大文件下载或静态文件直出

适合场景：

- 安装包、报表、图片、视频下载

```nginx
server {
  listen 80;
  server_name download.example.com;

  location /files/ {
    alias /data/downloads/;
    sendfile on;
    tcp_nopush on;
    expires 1h;
  }
}
```

重点：

- 确认 `alias` 和真实目录关系
- 文件直出通常比应用层转发更省资源

## 6. 维护页或临时降级页

适合场景：

- 发版窗口
- 上游整体不可用
- 需要对外快速给出稳定提示页

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    root /srv/www/maintenance;
    try_files /maintenance.html =503;
  }

  error_page 503 /maintenance.html;
  location = /maintenance.html {
    root /srv/www/maintenance;
  }
}
```

更常见的工程做法是：

- 用独立维护页配置或开关控制
- 发布前先准备好兜底页，不要出事时临时手拼

## 7. 前面有 LB / CDN 时保留真实客户端 IP

适合场景：

- Nginx 不是第一跳
- 前面还有云负载均衡、反向代理或 CDN

```nginx
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

重点：

- 只信任你明确控制的上一跳地址段
- 不要无条件信任任意 `X-Forwarded-For`

## 8. HTTP 强制跳转 HTTPS

```nginx
server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://$host$request_uri;
}
```

重点：

- 跳转逻辑尽量简洁
- 先确保 443 配置已稳定可用，再强制全站跳转

## 9. 静态资源和 HTML 分开缓存

```nginx
location /assets/ {
  alias /srv/www/app/assets/;
  expires 30d;
  add_header Cache-Control "public, max-age=2592000, immutable";
}

location = /index.html {
  root /srv/www/app;
  add_header Cache-Control "no-cache";
}
```

重点：

- 带 hash 资源长缓存
- HTML 更保守，避免发版后用户一直拿旧入口页

## 10. 改模板时优先检查什么

每次套模板后，都先检查这几项：

- 域名和端口是否对应
- `root` / `alias` 是否映射到真实路径
- `location` 和 `proxy_pass` 的路径关系是否正确
- 上游服务是否真实可达
- 头部、超时、上传大小是否符合业务

## 11. 用模板，不要丢掉理解

模板的价值在于减少重复劳动，但不能替代理解。

至少要养成这两个习惯：

- 套完模板后，用 `nginx -T` 看最终生效配置
- 用 `curl -v` 真正验证 URL 行为，不要只看配置表面

## 关联资料

- [Nginx 专题总览](./index.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [Nginx gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)
- [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md)
- [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md)
- [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
