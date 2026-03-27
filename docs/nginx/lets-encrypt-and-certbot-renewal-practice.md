---
title: Nginx + Let's Encrypt / certbot 自动续期实战
description: 系统整理 Nginx 使用 Let's Encrypt 与 certbot 签发和自动续期 HTTPS 证书的实践，覆盖 HTTP-01、webroot、standalone、续期 reload 与常见排障。
---

# Nginx + Let's Encrypt / certbot 自动续期实战

> 把 HTTPS 跑起来不难，真正容易出问题的是证书怎么签、怎么续、续期后怎么平滑生效。这页重点讲一条最常见、最适合中小系统的主线：Nginx + Let's Encrypt + certbot。

## 1. 先回答：Let's Encrypt 和 certbot 分别是什么

- Let's Encrypt：证书签发机构，负责给你签证书
- certbot：常见的 ACME 客户端，用来向 Let's Encrypt 申请和续期证书

一句话记忆：

> Let's Encrypt 是发证的人，certbot 是帮你申请和续期的工具。

## 2. 这条方案最适合什么场景

### 适合

- 公网可访问的域名站点
- 单机或少量机器的 HTTPS 落地
- 已经用 Nginx 做统一入口
- 希望把续期过程自动化

### 不适合

- 完全内网、域名无法公网校验的环境
- 复杂多节点边缘入口，证书需要集中分发
- 只能通过 DNS 验证，且没有自动化 DNS API 能力的环境

如果你是单机或小规模部署，这条线通常是最省心的。

## 3. 先理解 ACME 验证方式

最常见的是这三种：

| 方式 | 适合场景 | 你要记住什么 |
| --- | --- | --- |
| HTTP-01 | 常规 Web 站点 | 域名必须能从公网通过 80 访问到验证文件 |
| TLS-ALPN-01 | 较少直接手工用 | 需要 443 上特定握手验证 |
| DNS-01 | 泛域名、无公网 80/443 校验 | 通过 DNS TXT 记录完成验证 |

对于大多数 Nginx 场景，优先理解 HTTP-01 就够用了。

## 4. HTTP-01 为什么最常见

因为它最符合常规 Web 站点链路：

- 域名已经解析到你的 Nginx
- 80 端口通常对外开放
- certbot 只要把验证文件放到指定目录
- Let's Encrypt 从公网访问这个 URL 验证通过即可

验证 URL 通常长这样：

```text
http://example.com/.well-known/acme-challenge/<token>
```

## 5. `webroot` 和 `standalone` 怎么选

### `webroot`

特点：

- 复用现有 Nginx
- certbot 把验证文件写到某个目录
- Nginx 负责把这个目录对外暴露出去

适合：

- 你已经有 Nginx 在跑
- 想尽量少打断线上流量

### `standalone`

特点：

- certbot 自己临时起一个服务监听 80
- 验证完成后退出

适合：

- 机器上没有现成 Nginx 在占用 80
- 或你愿意在签发时临时停 Nginx

最稳的经验：

> 已经有 Nginx 在线运行时，优先用 `webroot`；只有在没有现成 Web 服务时，再考虑 `standalone`。

## 6. 一份适合 `webroot` 的 Nginx 配置

先准备一个目录，例如：

```bash
mkdir -p /var/www/certbot
```

然后在 Nginx 里加一段：

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}
```

这里最关键的是：

- ACME 验证路径不能被 HTTPS 跳转逻辑截断
- Let's Encrypt 需要能直接通过 HTTP 读到验证文件

## 7. 首次签发证书的常见命令

### `webroot` 方式

```bash
certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d example.com \
  -d www.example.com
```

### `standalone` 方式

```bash
systemctl stop nginx

certbot certonly \
  --standalone \
  -d example.com \
  -d www.example.com

systemctl start nginx
```

如果你只是第一次验证流程，建议先用 staging 环境，避免撞到生产限额：

```bash
certbot certonly \
  --test-cert \
  --webroot \
  -w /var/www/certbot \
  -d example.com
```

## 8. 证书签发后 Nginx 应该怎么引用

证书常见路径类似：

```text
/etc/letsencrypt/live/example.com/fullchain.pem
/etc/letsencrypt/live/example.com/privkey.pem
```

Nginx 配置示例：

```nginx
server {
  listen 443 ssl http2;
  server_name example.com www.example.com;

  ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  location / {
    proxy_pass http://app_backend;
  }
}
```

最稳的习惯是：

- 用 `live/` 下的符号链接路径
- 不要去写 `archive/` 里的具体版本号文件

## 9. 自动续期真正要解决两件事

很多人以为加个 `certbot renew` 就结束了，其实还差一步：

1. 定期执行续期
2. 续期成功后 reload Nginx

如果只续了证书，不 reload：

- Nginx 进程可能还在用旧证书

## 10. 最常见的自动续期方式

### systemd timer / cron

很多系统安装 certbot 后，已经自带 timer。

先检查：

```bash
systemctl list-timers | rg certbot
systemctl status certbot.timer
```

如果没有，也可以自己加 cron：

```bash
0 3 * * * certbot renew --quiet && nginx -s reload
```

不过更稳一点的做法是用 deploy hook，只在续期成功时 reload。

## 11. 推荐的 deploy hook 方式

```bash
certbot renew --deploy-hook "nginx -s reload"
```

这样做的好处：

- 只有证书真的更新了，才 reload Nginx
- 避免每天都做无意义 reload

如果你是 systemd 管 Nginx，也可以写成：

```bash
certbot renew --deploy-hook "systemctl reload nginx"
```

## 12. Docker Compose 场景下怎么做续期

如果 Nginx 在容器里，关键问题有两个：

- 证书目录要持久化或挂载
- 续期后要 reload 容器里的 Nginx

一个常见思路是：

- 在宿主机跑 certbot
- 把 `/etc/letsencrypt` 挂进 Nginx 容器
- 续期成功后执行容器内 reload

例如 Compose volume：

```yaml
services:
  nginx:
    image: nginx:1.27
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
```

续期后 reload：

```bash
certbot renew --deploy-hook "docker compose exec -T nginx nginx -s reload"
```

## 13. 一条更完整的单机落地顺序

1. 域名先解析到 Nginx 所在机器
2. 80 端口先确保可公网访问
3. 在 Nginx 中加好 `/.well-known/acme-challenge/` 路径
4. 先用 staging 做一次验证
5. 再申请正式证书
6. 配置 Nginx 使用 `live/` 下证书路径
7. `nginx -t` 后 reload
8. 再配置 `certbot renew --deploy-hook ...`

## 14. 最常见的失败点

### 80 端口没通

常见原因：

- 安全组没放行
- 防火墙没放行
- 云负载均衡没转发

### ACME 路径被跳转或代理掉了

常见原因：

- 所有 HTTP 请求都被直接 301 到 HTTPS
- `location /.well-known/acme-challenge/` 没有优先匹配到

### 证书申请成功，但 Nginx 没生效

常见原因：

- Nginx 没 reload
- 写错了证书路径
- 引用了旧文件而不是 `live/` 路径

### 域名没解析到当前机器

这时 Let's Encrypt 验证请求根本到不了你这台机器。

## 15. 排障时先做哪些检查

### 看 ACME 验证文件能不能被访问

可以先手动放一个测试文件：

```bash
mkdir -p /var/www/certbot/.well-known/acme-challenge
echo ok > /var/www/certbot/.well-known/acme-challenge/test
curl -v http://example.com/.well-known/acme-challenge/test
```

### 看证书路径是否正确

```bash
ls -l /etc/letsencrypt/live/example.com/
nginx -t
```

### 看线上证书是不是新证书

```bash
openssl s_client -connect example.com:443 -servername example.com
```

## 16. 关于泛域名要记住什么

如果你需要的是：

- `*.example.com`

通常就不是 HTTP-01 了，而要走 DNS-01。

这意味着：

- 需要 DNS 提供商 API 或手动 TXT 记录
- 自动化复杂度更高

所以普通站点先别把思路带偏，先把 HTTP-01 主线跑通。

## 17. 上线前的最小检查清单

- 域名已正确解析
- 80 端口公网可达
- `/.well-known/acme-challenge/` 可被直接访问
- 正式证书路径写的是 `live/`，不是历史版本文件
- `nginx -t` 已通过
- 续期命令只在成功时 reload
- 至少手工演练过一次续期链路

## 18. 学完这页后你应该形成的稳定口径

- Let's Encrypt 负责签证书，certbot 负责申请和续期
- 已有 Nginx 在线运行时，优先用 `webroot`
- 自动续期不是只有 `renew`，还要考虑成功后的 reload
- Compose 场景下关键是证书挂载和容器内 reload
- ACME 验证最常见的问题是 80 端口不通和 challenge 路径被错误处理

## 关联资料

- [Nginx 专题总览](./index.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
