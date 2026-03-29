---
title: Nginx + Docker Compose 部署实战
description: 系统整理 Nginx 与 Docker Compose 的单机部署实践，覆盖目录结构、compose 编排、配置挂载、HTTPS、发布回滚与日常运维。
---

# Nginx + Docker Compose 部署实战

> 很多团队实际落地 Nginx，不是在裸机手工安装，而是在单机或小规模环境里和 Docker Compose 一起用。这页重点讲一条最常见的落地路径：Nginx 作为统一入口，前面接 80/443，后面挂应用容器和静态资源。

## 1. 先回答：为什么常把 Nginx 和 Compose 放在一起

因为这两个东西的职责很互补：

- Compose 负责把多个容器稳定编排起来
- Nginx 负责统一接流量、做反向代理、TLS 终止和静态资源分发

最典型的组合就是：

- `nginx`：外部入口
- `app`：业务服务
- `db` / `redis`：内部依赖

可以直接记住一句：

> Compose 解决“服务怎么一起跑”，Nginx 解决“流量怎么统一进来”。

## 2. 适合什么场景，不适合什么场景

### 适合

- 单机部署
- 中小型内部系统
- 预发环境、测试环境
- 对多节点编排没有硬性需求的业务

### 不适合

- 多机高可用入口治理
- 自动扩缩容
- 复杂灰度、金丝雀、流量切分
- 多节点统一配置治理

如果你已经进入多机治理阶段，这条主线更适合交给 K8s Ingress、Gateway 或专门网关体系。

## 3. 推荐目录结构

```text
deploy/
├── compose.yml
├── .env
├── nginx/
│   ├── default.conf
│   ├── conf.d/
│   └── certs/
├── app/
│   └── .env
├── logs/
└── scripts/
    ├── deploy.sh
    ├── reload-nginx.sh
    └── rollback.sh
```

建议这样分：

- `compose.yml` 只管容器编排
- `nginx/` 单独放代理配置和证书
- `scripts/` 放部署和回滚动作
- `.env` 不要提交到 Git

## 4. 一个最小可用的 Compose 示例

```yaml
services:
  nginx:
    image: nginx:1.27
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - ./dist:/srv/www/app:ro
    depends_on:
      app:
        condition: service_started
    restart: unless-stopped
    networks:
      - edge
      - app

  app:
    image: registry.example.com/team/app:1.0.0
    env_file:
      - .env
    expose:
      - "8080"
    restart: unless-stopped
    networks:
      - app

networks:
  edge:
  app:
```

这份配置里最重要的点：

- `nginx` 是唯一对外暴露端口的容器
- `app` 只在内部网络暴露 `8080`
- 静态资源和证书通过只读挂载交给 Nginx

## 5. 对应的 Nginx 配置怎么写

```nginx
upstream app_backend {
  server app:8080;
  keepalive 32;
}

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

  location /assets/ {
    alias /srv/www/app/assets/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }

  location /api/ {
    proxy_pass http://app_backend/;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
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

这个组合里最关键的理解是：

- Compose 网络里可以直接用服务名 `app`
- Nginx 负责站点入口，应用只关心内部监听端口

## 6. 为什么 `app:8080` 可以直接访问

因为 Compose 会为同一网络里的服务提供内部 DNS。

也就是说：

- `app` 这个服务名会在 `app` 网络里被解析
- Nginx 不需要知道容器 IP
- 重建容器后，只要服务名不变，配置通常不用改

这是 Compose 比手工 `docker run` 更稳的一点。

## 7. 静态资源应该谁来提供

在这类部署里，通常建议：

- 构建产物挂到 Nginx
- 静态资源由 Nginx 直接返回
- API 请求再反向代理到应用

这样做的好处：

- 应用容器压力更小
- 静态资源缓存头更好控
- 前后端职责更清晰

## 8. HTTPS 证书怎么放更稳

最基本的要求：

- 证书和私钥不要写进镜像
- 通过挂载方式提供给容器
- 路径固定，权限最小化

一个常见做法是：

- `./nginx/certs/fullchain.pem`
- `./nginx/certs/privkey.pem`

再通过只读 volume 挂进去：

```yaml
- ./nginx/certs:/etc/nginx/certs:ro
```

如果你用自动签发工具，也要把“证书续期后如何 reload Nginx”这件事考虑进去。

## 9. 发布流程怎么做更稳

一条最小发布主线：

1. 先更新应用镜像版本
2. 如果 Nginx 配置变了，先本地 `nginx -t`
3. 执行 `docker compose pull`
4. 执行 `docker compose up -d`
5. 做 HTTP/HTTPS 冒烟验证
6. 看 Nginx 日志和应用日志

常用命令：

```bash
docker compose pull
docker compose config
docker compose up -d
docker compose ps
docker compose logs -f nginx
docker compose logs -f app
```

## 10. 配置改了，为什么不一定要重建整个栈

如果只是 Nginx 配置改了，很多时候没必要整套重启。

更稳的动作是：

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

这样做的好处：

- 风险更小
- 不影响应用容器生命周期
- 更符合 Nginx 平滑 reload 的使用方式

## 11. 排障时先看哪几层

### 第一层：Compose 服务状态

```bash
docker compose ps
```

看：

- 容器是否在运行
- 是否在重启循环

### 第二层：Nginx 配置和日志

```bash
docker compose exec nginx nginx -t
docker compose logs -f nginx
```

看：

- 配置语法
- 证书路径
- 上游连接失败

### 第三层：应用容器连通性

```bash
docker compose exec nginx sh
curl -v http://app:8080/health
```

看：

- Nginx 到应用容器是否能通
- 应用是否真的监听了预期端口

## 12. 最常见的坑

- `proxy_pass` 路径和应用实际路由不一致
- 证书路径挂载错了
- 容器里静态资源路径和 `root` / `alias` 映射不上
- 应用只监听 `127.0.0.1`，导致其他容器访问不到
- 改了配置但没有 reload
- 直接暴露应用端口到公网，绕过了 Nginx

尤其要记住这一点：

> 容器内服务如果只监听 `127.0.0.1`，其他容器通常访问不到，应该监听 `0.0.0.0`。

## 13. 回滚怎么做

单机 Compose 回滚的核心，不在平台，而在版本管理。

你至少要做到：

- 应用镜像不用漂移的 `latest`
- 保留上一个稳定版本号
- Nginx 配置有版本记录

回滚动作通常就是：

- 把镜像版本切回旧版本
- 如果配置有问题，把配置文件切回上一版
- 再执行 `docker compose up -d`

## 14. 一份最小上线检查清单

- `docker compose config` 可正常展开
- `docker compose ps` 所有关键服务都在运行
- `docker compose exec nginx nginx -t` 通过
- HTTP 到 HTTPS 跳转正常
- 静态资源返回正常
- `/api/health` 可正常代理
- 证书路径和域名匹配正确
- 应用没有直接对公网暴露多余端口

## 15. 学完这页后你应该形成的稳定口径

- Compose 管服务编排，Nginx 管入口流量
- Nginx 通常是唯一对外暴露 80/443 的容器
- 应用容器只暴露内部端口，通过服务名让 Nginx 访问
- 证书、配置、静态资源更适合只读挂载，不要写死进镜像
- 改 Nginx 配置优先走 `nginx -t` + reload，而不是整栈重启

## 关联资料

- [Nginx 专题总览](./index.md)
- [Nginx + Let's Encrypt / certbot 自动续期实战](./lets-encrypt-and-certbot-renewal-practice.md)
- [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md)
- [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md)
- [Nginx Ingress、K8s 网关映射与配置迁移实战](./ingress-k8s-gateway-mapping-and-config-migration.md)
- [Nginx 多环境配置治理、配置拆分与变更发布实战](./multi-environment-config-governance-and-change-release.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
- [Docker Compose 部署实践](../docker/compose-deployment-practice.md)
