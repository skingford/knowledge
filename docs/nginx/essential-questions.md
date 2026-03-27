---
title: Nginx 必备问题与自检清单
description: 按由浅入深整理 Nginx 高频问题与回答主线，覆盖对象模型、匹配规则、反向代理、HTTPS、性能优化与排障。
---

# Nginx 必备问题与自检清单

> 这页适合最后复习。目标不是把每个配置项背下来，而是把 Nginx 最常被追问的问题压缩成稳定口径。

## 1. Nginx 到底是做什么的

推荐回答：

> Nginx 是一个高性能事件驱动的 Web 服务器和反向代理服务器，常用于静态资源服务、反向代理、负载均衡和 HTTPS 终止。

## 2. 为什么 Nginx 并发能力强

推荐回答：

> 它采用 `master` / `worker` 模型，worker 基于事件驱动和非阻塞 I/O 处理大量连接，不是传统的一请求一线程模型。

## 3. `master` 和 `worker` 分别做什么

推荐回答：

> `master` 负责读取配置、管理 worker 和处理信号；真正处理请求的是 worker。平滑 reload 也是由 master 拉起新 worker、旧 worker 处理完再退出。

## 4. 一个请求进入 Nginx 后会怎么走

推荐回答：

> 先按端口和 `Host` 选中 `server`，再按 URI 匹配 `location`，最后决定返回静态文件、做重写还是代理到 `upstream`。

## 5. `server`、`location`、`upstream` 各自职责是什么

推荐回答：

- `server` 负责站点级匹配
- `location` 负责路径级处理规则
- `upstream` 负责后端节点池和转发策略

## 6. `location` 匹配优先级怎么说

推荐回答：

> 先看精确匹配 `=`，再看最长前缀；如果前缀命中的是 `^~`，就不再继续正则；否则再按配置顺序尝试正则；最后回到最长前缀。

## 7. `root` 和 `alias` 的区别是什么

推荐回答：

> `root` 会把请求 URI 追加到目录后面；`alias` 会用指定目录替换掉当前 `location` 匹配部分。静态资源 404 很多时候就出在这两者混用。

## 8. `proxy_pass` 尾部斜杠为什么重要

推荐回答：

> 它会影响转发给上游的 URI。带尾部斜杠时，匹配到的前缀通常会被替换掉；不带时，请求路径更容易按原样带给上游。

## 9. 反向代理时哪些头必须考虑

推荐回答：

- `Host`
- `X-Real-IP`
- `X-Forwarded-For`
- `X-Forwarded-Proto`

一句话：

> 这些头决定上游能不能知道原始域名、客户端 IP 和原始协议。

## 10. WebSocket 为什么不能只写 `proxy_pass`

推荐回答：

> 因为 WebSocket 需要 HTTP 协议升级，必须额外转发 `Upgrade` 和 `Connection` 相关头，并通常要求 `proxy_http_version 1.1`。

## 11. Nginx 常见负载均衡方式有哪些

推荐回答：

- 默认轮询
- `least_conn`
- `ip_hash`

补一句：

> 开源版更适合基础负载均衡，复杂健康检查和流量治理常常还需要其他组件配合。

## 12. `keepalive` 在 upstream 里为什么重要

推荐回答：

> 它能复用 Nginx 到上游的连接，减少频繁建连开销，提升代理性能，但通常要配合 `proxy_http_version 1.1` 和合适的连接头一起理解。

## 13. 为什么不能随便给代理请求做重试

推荐回答：

> 因为重试会影响幂等性。读请求相对更安全，写请求如果没有幂等保证，可能造成重复执行。

## 14. TLS 终止是什么意思

推荐回答：

> 客户端和 Nginx 之间走 HTTPS，由 Nginx 完成握手和解密，再把请求转给上游。这样证书集中管理，但要记得把原始协议通过头传给上游。

## 15. HSTS 是什么，为什么不能随手开

推荐回答：

> HSTS 会要求浏览器在一段时间内强制走 HTTPS。只有当站点和相关子域名都稳定支持 HTTPS 时才适合开启，否则回滚成本很高。

## 16. 静态资源缓存应该怎么讲

推荐回答：

> 带 hash 的资源适合长期缓存并配 `immutable`；HTML 和无版本指纹资源应更保守，不能一刀切缓存一年。

## 17. 499、502、504 分别代表什么

推荐回答：

- `499`：客户端提前断开
- `502`：上游连接失败或返回异常
- `504`：Nginx 等待上游响应超时

## 18. Nginx 排障第一步应该做什么

推荐回答：

> 先 `nginx -t`，确认配置没问题；再看 access log 和 error log；如果是代理问题，再直接验证上游服务和端口。

## 19. 为什么不要改完配置就直接重启

推荐回答：

> 因为 Nginx 支持平滑 reload。正确做法是先校验，再 reload，尽量避免无意义中断。

## 20. 什么时候应该优先怀疑应用，而不是 Nginx

推荐回答：

> 当 Nginx 配置无误、端口监听正常、代理链路也通，但上游处理慢、崩溃、返回异常或依赖不可用时，问题往往在应用或下游系统，不在 Nginx 本身。

## 21. 你至少要能手写的一份基础配置

自检要求：

- 一个 80 到 443 的跳转 `server`
- 一个 443 HTTPS 站点
- 一个静态资源 `location`
- 一个 `/api/` 反向代理 `location`
- 一组基础代理头
- 一套配置校验和 reload 操作

## 22. 学完 Nginx 后你应该形成的稳定口径

- Nginx 先按域名选 `server`，再按 URI 选 `location`
- `location` 优先级和 `proxy_pass` 斜杠行为是高频坑
- `upstream`、超时、keepalive 和重试决定生产上的稳定性体验
- 静态资源、API 代理、HTTPS、缓存和日志最好放在同一条请求链路里理解
- 499、502、504 各有不同排查方向
- 任何配置变更前都先 `nginx -t`

## 关联资料

- [Nginx 专题总览](./index.md)
- [核心概念与请求处理模型](./core-concepts.md)
- [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
