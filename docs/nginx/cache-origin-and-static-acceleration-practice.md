---
title: Nginx 缓存、回源与静态资源加速实战
description: 系统讲清 Nginx 的浏览器缓存、代理缓存、回源策略、旧缓存兜底、静态资源直出与常见误区。
---

# Nginx 缓存、回源与静态资源加速实战

> 很多人一提 Nginx 缓存，只想到 `expires 30d`。但生产里的缓存至少有三层：浏览器缓存、Nginx 直出静态资源、Nginx 代理缓存。真正要掌握的是：哪些内容应该直接缓存，哪些请求应该跳过缓存，缓存失效时怎么回源，回源失败时能不能用旧缓存兜底。

## 1. 先把三类缓存分开理解

| 类型 | 缓存放在哪里 | 适合什么内容 | 关键能力 | 最容易写错 |
| --- | --- | --- | --- | --- |
| 浏览器缓存 | 用户浏览器 | 带 hash 的 JS/CSS、图片、字体 | `Cache-Control`、`expires` | 把 HTML 和静态资源一刀切长期缓存 |
| Nginx 静态资源直出 | Nginx 本机磁盘 | 前端构建产物、下载文件、图片 | `root` / `alias`、`sendfile`、`etag` | 路径映射错、缓存头策略不区分 |
| Nginx 代理缓存 | Nginx 缓存目录 | 公共 GET / HEAD 响应、公共内容接口 | `proxy_cache`、`proxy_cache_key`、`proxy_cache_use_stale` | 把带登录态或个性化响应也缓存了 |

先记一句最重要的话：

> 静态资源缓存解决的是“文件怎么更快返回”，代理缓存解决的是“上游不用每次都算一遍”，它们不是一回事。

## 2. 静态资源加速，先把浏览器缓存和 HTML 分开

最稳的前端站点写法，通常是：

```nginx
server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  sendfile on;
  etag on;

  location /assets/ {
    alias /srv/www/app/assets/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }

  location = /index.html {
    root /srv/www/app;
    add_header Cache-Control "no-cache";
  }

  location / {
    root /srv/www/app;
    try_files $uri $uri/ /index.html;
  }
}
```

这里真正重要的不是 `30d` 这个数字，而是下面这层分工：

- 带 hash 的构建产物适合长缓存
- HTML 入口页要更保守，避免发版后用户一直拿旧入口
- 静态文件能由 Nginx 直接返回，就不要每次回应用容器

一个最稳的工程习惯是：

- 前端资源文件名带版本指纹
- HTML 不靠“手工清缓存”，而是靠较保守的缓存策略

## 3. 代理缓存到底解决什么问题

`proxy_cache` 解决的是公共内容回源成本。

最典型的适用场景：

- 公共文章页、商品详情页的只读接口
- 搜索结果页里可接受短 TTL 的公共数据
- 上游计算开销较高、但短时间内容相对稳定的响应

最不适合直接缓存的场景：

- 登录后的个人信息、订单、购物车
- 带权限差异的响应
- 强实时写操作和状态推进类接口

一句话：

> 代理缓存优先服务“公共、可重复、可短暂过期”的读流量，不要把它当成所有 API 的默认配置。

## 4. 一份最常见的 `proxy_cache` 配置

先在 `http` 块定义缓存目录和缓存区：

```nginx
proxy_cache_path /var/cache/nginx/content levels=1:2 keys_zone=content_cache:100m
                 max_size=5g inactive=60m use_temp_path=off;

map $request_method $skip_cache_method {
  default 1;
  GET 0;
  HEAD 0;
}

map $http_authorization $skip_cache_auth {
  default 1;
  "" 0;
}

map $cookie_session $skip_cache_session {
  default 1;
  "" 0;
}
```

再在具体 `location` 里使用：

```nginx
upstream content_backend {
  server 127.0.0.1:8080;
  keepalive 64;
}

server {
  listen 443 ssl http2;
  server_name content.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location /articles/ {
    proxy_cache content_cache;
    proxy_cache_methods GET HEAD;
    proxy_cache_key $scheme$proxy_host$request_uri;
    proxy_cache_valid 200 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_revalidate on;
    proxy_cache_background_update on;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;

    proxy_cache_bypass $skip_cache_method $skip_cache_auth $skip_cache_session;
    proxy_no_cache $skip_cache_method $skip_cache_auth $skip_cache_session;

    add_header X-Cache-Status $upstream_cache_status always;

    proxy_pass http://content_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

这套配置里最值得先背熟的是：

- `proxy_cache_path`：缓存文件放哪、缓存区多大、多久不用就清理
- `proxy_cache_key`：哪些请求算同一份缓存
- `proxy_cache_valid`：不同状态码缓存多久
- `proxy_cache_bypass`：这次请求要不要绕过缓存
- `proxy_no_cache`：这次响应要不要写进缓存
- `proxy_cache_use_stale`：上游出错时能不能先用旧缓存顶住

## 5. “回源”到底发生在什么时候

可以把回源理解成：

- Nginx 本地没有可用缓存
- 或缓存已过期，需要去上游重新拿
- 或这次请求被明确标记为不走缓存

最常见的几种状态可以这样记：

| 状态 | 说明 |
| --- | --- |
| `MISS` | 本地没命中缓存，回源到上游 |
| `HIT` | 直接命中缓存，没有回源 |
| `BYPASS` | 这次请求被规则要求跳过缓存 |
| `EXPIRED` | 旧缓存已过期，需要重新向上游获取 |
| `STALE` | 上游异常时用了旧缓存顶住 |
| `UPDATING` | 有请求在更新缓存，其它请求先拿旧缓存 |
| `REVALIDATED` | 回源校验后确认缓存仍然可用 |

这里最容易产生价值的两个配置是：

- `proxy_cache_revalidate on;`
- `proxy_cache_background_update on;`

前者适合让过期缓存带条件请求回上游做校验，后者适合让一个请求去更新缓存时，其他请求先继续吃旧缓存，不至于一起打爆上游。

## 6. 哪些响应一定要谨慎缓存

代理缓存最怕的不是“没命中”，而是“命中了不该命中的东西”。

至少要对下面几类内容格外谨慎：

- 带 `Authorization` 的请求
- 带登录态 Cookie 的请求
- 个性化首页、购物车、订单、库存、价格等用户态响应
- 会返回 `Set-Cookie` 的响应
- 明确标记为 `private`、`no-store`、`no-cache` 的响应

很实用的一条原则：

> 只要你不能很确定这份响应对所有用户都一样，就先不要缓存。

## 7. 发布时不要把“清缓存”当唯一方案

缓存发布治理里最稳的思路通常是：

- 静态资源用带 hash 的文件名
- HTML 保守缓存，必要时 `no-cache`
- 公共 API 用短 TTL，而不是无限期缓存
- 接口结构变化时，用版本化路径或参数，而不是指望线上手工清一堆缓存

很多团队一出问题就想到“去删缓存目录”，但这通常不是最好的一线方案。更稳的是：

- 先确认资源命名是否有版本指纹
- 先确认缓存 key 有没有把不同版本混在一起
- 先确认响应头有没有表达正确的缓存意图

## 8. 观测和排障怎么做

如果不上观测，缓存很容易变成“以为开了，但其实没命中”。

最实用的两个动作：

### 给响应加缓存状态头

```nginx
add_header X-Cache-Status $upstream_cache_status always;
```

这样用 `curl -I` 就能快速看到当前是 `HIT`、`MISS` 还是 `BYPASS`。

### 在 access log 里带上缓存状态

```nginx
log_format main '$remote_addr "$request" $status '
                'cache=$upstream_cache_status rt=$request_time urt=$upstream_response_time';
```

排障时优先看这几件事：

1. 这次请求是不是被 `Authorization`、Cookie、方法规则绕过了缓存
2. `proxy_cache_key` 是否把不该混在一起的请求算成了一份
3. 上游是否通过响应头明确要求不要缓存
4. 缓存失效后，是否有 `use_stale` 和后台更新帮你削峰
5. 静态资源问题到底是缓存头、路径映射，还是根本没由 Nginx 直出

## 9. 学完这页至少要形成的稳定判断

- 浏览器缓存、静态资源直出、代理缓存是三套不同问题
- 带 hash 的静态资源适合长缓存，HTML 入口页要更保守
- `proxy_cache` 优先服务公共 GET / HEAD 读流量
- `proxy_cache_bypass` 和 `proxy_no_cache` 是防止错缓存的关键闸门
- `proxy_cache_use_stale` 和后台更新能在上游抖动时明显稳住入口层

## 关联资料

- [Nginx 专题总览](./index.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
