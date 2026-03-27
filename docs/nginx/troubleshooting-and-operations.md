---
title: Nginx 排障与日常运维
description: 系统整理 Nginx 的日常运维与排障方法，覆盖配置校验、平滑 reload、访问日志、错误日志、403/404/499/502/504 与上线检查清单。
---

# Nginx 排障与日常运维

> Nginx 出问题时，不要上来就改配置碰运气。最有效的路径通常是：先校验配置，再看日志，再看端口和上游连通性，最后才去怀疑更深层的系统问题。

## 1. 先会用这些命令

| 命令 | 用途 |
| --- | --- |
| `nginx -t` | 校验配置语法和基础可用性 |
| `nginx -T` | 打印完整展开后的配置，适合查 `include` |
| `nginx -s reload` | 平滑重载配置 |
| `nginx -s quit` | 优雅退出 |
| `systemctl status nginx` | 看服务状态 |
| `journalctl -u nginx -n 200` | 看 systemd 服务日志 |
| `tail -f /var/log/nginx/access.log` | 看访问日志 |
| `tail -f /var/log/nginx/error.log` | 看错误日志 |
| `ss -lntp` | 看端口监听 |
| `curl -I` / `curl -v` | 直接验证请求行为 |

## 2. reload 为什么通常不会中断请求

平滑 reload 的本质是：

- `master` 读入新配置
- 拉起新的 worker
- 旧 worker 继续把手头请求处理完
- 旧 worker 再退出

所以正确动作一定是：

```bash
nginx -t && nginx -s reload
```

不要在没校验前直接 reload，更不要为了改一份配置就粗暴重启。

## 3. access log 和 error log 怎么配合看

### access log 关注什么

- 请求有没有进来
- 状态码是多少
- URI、Host、来源 IP 是什么
- 请求耗时大概多少

### error log 关注什么

- 配置文件路径和语法错误
- 权限问题
- 上游连接失败
- SSL 握手异常
- 文件不存在、连接被拒绝、超时等运行错误

最稳的经验：

> 先用 access log 确认“请求到了没有、结果是什么”，再用 error log 查“为什么失败”。

## 4. 404 先看路径映射，不要先怀疑应用

Nginx 的 404 常见来自三类问题：

- `location` 没匹配到预期规则
- `root` / `alias` 路径拼接错了
- `try_files` 兜底路径不对

排查顺序：

1. 用 `curl -v` 看请求路径和返回头
2. 用 `nginx -T` 确认实际生效配置
3. 检查 `location` 和 `root` / `alias` 的组合
4. 到磁盘上确认目标文件到底在不在

## 5. 403 常见是权限问题，不一定是业务拒绝

Nginx 返回 403 时，先想这几个方向：

- 文件权限不足
- 目录可读不可遍历
- 没有 `index` 文件，又不允许列目录
- 显式写了访问控制规则，例如 `deny all`

常见检查项：

- Nginx 运行用户是谁
- 目标目录是否对这个用户可读
- 目录本身是否可进入

## 6. 499、502、504 的排查方向要分开

### 499

表示：

- 客户端先断开连接了

常见场景：

- 用户取消请求
- 前置 LB、浏览器或调用方先超时

### 502

表示：

- Nginx 作为代理时，上游返回异常或连接失败

常见原因：

- 上游服务没启动
- 端口写错
- Unix socket 路径不对
- 上游直接崩溃或拒绝连接

### 504

表示：

- Nginx 等上游响应超时

常见原因：

- 应用处理太慢
- 数据库或下游依赖过慢
- 超时配置过小，不符合业务时延

可以直接记成一句：

> 499 看客户端，502 看上游可达性和协议错误，504 看上游处理时延和超时配置。

## 7. 502 的一条实用排查路径

1. 看 `error.log` 有没有 `connect() failed`、`upstream prematurely closed connection`
2. 用 `ss -lntp` 确认上游端口是否真的在监听
3. 在 Nginx 所在机器上直接 `curl` 上游地址
4. 检查 `proxy_pass` 指向、端口、协议和路径是否一致
5. 如果用 Unix socket，检查 socket 文件存在和权限

## 8. 504 的一条实用排查路径

1. 看 access log 的请求耗时是不是接近超时阈值
2. 看 error log 是否提示 upstream timed out
3. 直接测上游接口的真实响应时间
4. 区分是连接慢，还是应用处理慢
5. 再决定是否调整 `proxy_read_timeout` 或优化业务链路

## 9. HTTPS 相关故障先看这几类

常见问题：

- 证书链不完整
- 私钥和证书不匹配
- 域名和证书不匹配
- 443 没监听成功
- 上游或前置代理的 HTTPS/HTTP 协议关系搞错了

排查动作：

```bash
nginx -t
ss -lntp | rg ':443'
curl -vk https://example.com
openssl s_client -connect example.com:443 -servername example.com
```

## 10. 站点能访问，但客户端真实 IP 不对怎么办

这是生产环境非常高频的问题。

先确认流量路径：

- 客户端 -> CDN/LB -> Nginx
- 客户端 -> Nginx

如果前面还有代理：

- 要确认上一跳是否转发了客户端 IP 头
- 要确认 Nginx 是否正确处理真实 IP
- 不要盲信任任意来源的 `X-Forwarded-For`

否则常见后果是：

- 日志里全是 LB 内网 IP
- 限流和审计全部失真

## 11. 上线改配置前后的固定动作

### 改前

- 先导出当前配置或保留版本
- 用 `nginx -T` 看完整配置，确认包含链路

### 改后

- 先 `nginx -t`
- 再 `nginx -s reload`
- 再 `curl -I`、`curl -v` 做冒烟验证
- 再观察 access log 和 error log

## 12. 一条通用排障顺序

1. 先确认 Nginx 配置能不能通过 `nginx -t`
2. 再确认请求有没有进 access log
3. 再看 error log 有没有直接错误
4. 如果是代理问题，直接测上游地址和端口
5. 如果是静态资源问题，检查 `location`、`root`、`alias` 和实际文件路径
6. 如果是 HTTPS 问题，检查 443 监听、证书链和域名匹配

## 13. 日常运维最常用的一组命令

```bash
nginx -t
nginx -T | less
nginx -s reload
systemctl status nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
ss -lntp
curl -I http://example.com
curl -vk https://example.com
```

## 关联资料

- [Nginx 专题总览](./index.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [Nginx gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [Nginx + Let's Encrypt / certbot 自动续期实战](./lets-encrypt-and-certbot-renewal-practice.md)
- [Nginx 限流、黑白名单与基础安全防护实战](./rate-limit-allowlist-and-security-hardening.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [Linux 磁盘清理与进程管理](../ops/linux-disk-cleanup.md)
