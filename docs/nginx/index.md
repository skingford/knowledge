---
title: Nginx 专题
description: 系统整理 Nginx 必须掌握的核心知识，覆盖对象模型、配置匹配、反向代理、配置治理、OpenResty / Lua 扩展边界、gRPC / HTTP/2 / WebSocket 边界、HTTPS、性能优化、安全基线与常见排障。
---

# Nginx 专题

这个专题的目标，不是把 Nginx 配置项堆满，而是把你真正要反复用到的主线讲清楚：请求是怎么被匹配的，反向代理是怎么转发的，HTTPS 和静态资源该怎么配，线上出 403 / 404 / 502 / 504 时应该先看哪里。

很多人对 Nginx 的理解停在“会改一份配置”。但到了生产环境，真正拉开差距的是下面这些能力：

- 能解释 `server` / `location` / `upstream` 的职责
- 能说明 `location` 匹配优先级和 `proxy_pass` 尾部斜杠的差异
- 能把静态资源、反向代理、WebSocket、gRPC、TLS 终止串成一条完整链路
- 能分清 499、502、504、证书错误、权限错误分别该查哪里
- 能在上线前做 `nginx -t`、平滑 reload、日志回查和基础性能检查
- 能判断什么时候原生 Nginx 已经够用，什么时候才该引入 OpenResty / Lua

## 适合谁看

- 需要维护 Web 服务入口、静态站点、反向代理或 API 网关的后端和运维工程师
- 已经会照着示例改配置，但对匹配规则、请求流向和常见坑理解还不稳
- 面试里经常被问到 `location`、`proxy_pass`、HTTPS、负载均衡和排障
- 正在用 Docker Compose、K8s Ingress 或传统虚机部署 Nginx，希望把底层逻辑讲清楚

## 图例速览

Nginx 专题最容易先散掉的，通常不是某条配置，而是三条主线没连起来：请求到底怎么被选路、反向代理到底帮你做了什么、线上出错时该按什么顺序排。下面三张 SVG 图先把这层骨架搭起来。

### 1. 请求路由主线

<NginxDiagram kind="request-routing" />

### 2. 反向代理链路

<NginxDiagram kind="reverse-proxy-chain" />

### 3. 排障顺序

<NginxDiagram kind="troubleshooting-flow" />

## 快速导航

- [图例速览](#图例速览)
- [你至少要掌握什么](#你至少要掌握什么)
- [内容结构](#内容结构)
- [建议阅读顺序](#建议阅读顺序)
- [学完后建议能独立完成的事](#学完后建议能独立完成的事)
- [关联资料](#关联资料)

## 你至少要掌握什么

- Nginx 的角色：反向代理、静态资源服务、负载均衡、TLS 终止
- 进程模型：`master` / `worker`、事件驱动、reload 机制
- 配置结构：`main`、`events`、`http`、`server`、`location`、`upstream`
- 匹配规则：`server_name`、`location =`、前缀匹配、`^~`、正则匹配
- 代理链路：`proxy_pass`、`grpc_pass`、转发头、超时、缓冲、WebSocket 升级
- 配置治理：`include`、配置拆分、环境差异、`nginx -T`、版本化与回滚
- 扩展边界：OpenResty、Lua 执行阶段、`shared dict`、cosocket、入口逻辑与业务逻辑分界
- 云原生入口：`server_name` / `location` / `upstream` 到 Ingress / Gateway / Service 的映射
- HTTPS 与性能：证书链、HTTP 跳转、缓存头、代理缓存、压缩、静态文件缓存
- 运维排障：`nginx -t`、`nginx -T`、访问日志、错误日志、状态码定位路径

## 内容结构

| 文档 | 覆盖内容 |
| --- | --- |
| [核心概念与请求处理模型](./core-concepts.md) | Nginx 到底做什么、对象模型、`master` / `worker`、请求处理主线、`server` / `location` / `upstream` 的职责 |
| [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md) | 配置结构、`server_name`、`location` 优先级、`root` 与 `alias`、`try_files`、`proxy_pass`、WebSocket、负载均衡 |
| [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md) | `upstream`、轮询、`least_conn`、`ip_hash`、`keepalive`、超时、失败重试、会话粘性与常见生产边界 |
| [gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md) | client 侧 HTTP/2、`grpc_pass`、WebSocket Upgrade、h2 / h2c / TLS 区别与最常见误区 |
| [HTTPS、性能优化与安全基线](./https-performance-and-security.md) | 证书链、HTTP 跳转、TLS 终止、缓存头、压缩、静态资源优化、限流与安全边界 |
| [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md) | 浏览器缓存、`proxy_cache`、回源条件、旧缓存兜底、缓存 key 与静态资源加速主线 |
| [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md) | CDN 回源、对象存储直链、签名下载、`X-Accel-Redirect`、真实 IP 与大文件断点续传检查 |
| [Nginx Ingress、K8s 网关映射与配置迁移实战](./ingress-k8s-gateway-mapping-and-config-migration.md) | `server_name` / `location` / `upstream` 到 Ingress / Gateway / Service 的映射、controller 边界与迁移步骤 |
| [Nginx 多环境配置治理、配置拆分与变更发布实战](./multi-environment-config-governance-and-change-release.md) | `include` 骨架、环境差异收口、配置拆分、发布校验、平滑 reload 与回滚动作主线 |
| [Nginx 与 OpenResty、Lua 扩展边界和适用场景实战](./openresty-lua-extension-boundaries-and-use-cases.md) | OpenResty 与 Nginx 的关系、Lua 执行阶段、适用场景、性能边界与常见误区 |
| [Nginx + Let's Encrypt / certbot 自动续期实战](./lets-encrypt-and-certbot-renewal-practice.md) | HTTP-01、`webroot`、`standalone`、证书路径、自动续期、deploy hook 与续期后 reload |
| [Nginx 限流、黑白名单与基础安全防护实战](./rate-limit-allowlist-and-security-hardening.md) | `limit_req`、`limit_conn`、白名单、Basic Auth、方法限制、上传限制与敏感路径收口 |
| [排障与日常运维](./troubleshooting-and-operations.md) | `nginx -t`、reload、日志分析、403 / 404 / 499 / 502 / 504 排查、上线检查清单 |
| [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md) | `log_format`、访问日志分析、`stub_status`、基础指标、Prometheus / Grafana 思路与告警分级 |
| [常见场景与配置模板](./common-scenarios-and-config-templates.md) | SPA、API、WebSocket、上传下载、维护页、真实客户端 IP 等高频配置模板 |
| [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md) | 单机部署目录结构、compose 编排、配置挂载、HTTPS、发布回滚与 Compose + Nginx 协作方式 |
| [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md) | Host/Header 灰度、`split_clients`、蓝绿切换、维护页开关、切流观察与快速回滚 |
| [必备问题与自检清单](./essential-questions.md) | 高频问题、回答口径和复习路线，适合面试与阶段复盘 |

## 建议阅读顺序

1. 先看 [核心概念与请求处理模型](./core-concepts.md)，把 Nginx 的对象和请求流向建立起来
2. 再看 [配置、Location 匹配与反向代理](./config-and-reverse-proxy.md)，把最容易写错的配置规则讲清楚
3. 再读 [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)，把生产上最常见的超时、重试和失败摘流量逻辑补齐
4. 接着读 [gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)，把最容易混淆的协议边界和配置分工补齐
5. 再读 [HTTPS、性能优化与安全基线](./https-performance-and-security.md)，把上线必备能力补齐
6. 再读 [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md)，把浏览器缓存、代理缓存和回源策略补齐
7. 再读 [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md)，把静态资源分发、签名下载和大文件链路补齐
8. 再读 [Nginx Ingress、K8s 网关映射与配置迁移实战](./ingress-k8s-gateway-mapping-and-config-migration.md)，把传统 `nginx.conf` 到 Ingress / Gateway 的迁移边界补齐
9. 再读 [Nginx 多环境配置治理、配置拆分与变更发布实战](./multi-environment-config-governance-and-change-release.md)，把 `include`、环境差异、发布校验和回滚动作补齐
10. 再读 [Nginx 与 OpenResty、Lua 扩展边界和适用场景实战](./openresty-lua-extension-boundaries-and-use-cases.md)，把 Lua 执行阶段、入口逻辑边界和引入时机补齐
11. 再读 [Nginx + Let's Encrypt / certbot 自动续期实战](./lets-encrypt-and-certbot-renewal-practice.md)，把证书签发和自动续期链路补齐
12. 再读 [Nginx 限流、黑白名单与基础安全防护实战](./rate-limit-allowlist-and-security-hardening.md)，把入口层基础防线补齐
13. 再读 [排障与日常运维](./troubleshooting-and-operations.md)，把线上常见故障的排查顺序固定下来
14. 然后读 [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)，把观测和值班主线补齐
15. 再把 [常见场景与配置模板](./common-scenarios-and-config-templates.md) 当作实际落地时的速查手册
16. 如果涉及发布治理，再读 [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
17. 如果是单机或小规模部署，再读 [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
18. 最后用 [必备问题与自检清单](./essential-questions.md) 压缩成稳定口径

## 学完后建议能独立完成的事

### 1. 给单站点写一份可上线配置

目标：

- 正确区分静态资源和 API 反向代理
- 能解释 `server_name`、`location`、`root`、`proxy_pass`
- 具备 `nginx -t` 后平滑 reload 的习惯

### 2. 把一个后端服务挂到 Nginx 后面

目标：

- 正确转发 `Host`、客户端真实 IP 和协议头
- 配好超时和 WebSocket 升级
- 能分清 REST、WebSocket、gRPC 分别该用哪套代理方式
- 能定位 502 / 504 是 Nginx 还是上游服务的问题

### 3. 给站点补 HTTPS 和缓存头

目标：

- 能区分证书文件、私钥、完整链
- 能做 HTTP 到 HTTPS 跳转
- 能给静态资源加长期缓存，不影响 HTML 动态更新
- 能分清浏览器缓存、代理缓存和缓存失效后的回源行为
- 能判断哪些文件该走 CDN、哪些下载该走对象存储或签名 URL

### 4. 能按固定顺序排障

目标：

- 先做配置校验，再看日志，再看端口监听和上游连通性
- 能根据状态码快速定位排查方向
- 知道什么时候要查 Nginx，什么时候该回到应用本身

### 5. 能把基础入口迁到 K8s

目标：

- 能把 `server_name`、`location`、`upstream` 映射到 Host、Path、Service
- 能分清哪些能力适合迁到 Ingress / Gateway，哪些更适合保留给对象存储、CDN 或专门 Nginx
- 能按 controller 和对象状态排 K8s 入口问题

### 6. 能做一次安全的配置发布

目标：

- 能按职责拆分 `include`，把环境差异收口到少量文件
- 能在发布前做 `nginx -t` 和 `nginx -T` 双重确认
- 能把回滚动作压缩成明确可执行的一组步骤

### 7. 能判断什么时候该用 OpenResty / Lua

目标：

- 能分清原生 Nginx 能解决的固定规则，和必须用动态逻辑补的入口能力
- 能说清 `rewrite`、`access`、`balancer`、`log` 这些阶段各适合做什么
- 能识别哪些逻辑已经越过入口边界，应该回到应用服务

## 关联资料

- [运维方向入口](/ops/)
- [Docker Compose 部署实践](/docker/compose-deployment-practice)
- [Nginx + Let's Encrypt / certbot 自动续期实战](./lets-encrypt-and-certbot-renewal-practice.md)
- [Nginx 限流、黑白名单与基础安全防护实战](./rate-limit-allowlist-and-security-hardening.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [Nginx gRPC、HTTP/2 与 WebSocket 边界实战](./grpc-http2-and-websocket-boundaries.md)
- [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md)
- [Nginx 与 CDN、对象存储和大文件分发协同实战](./cdn-object-storage-and-large-file-distribution-practice.md)
- [Nginx Ingress、K8s 网关映射与配置迁移实战](./ingress-k8s-gateway-mapping-and-config-migration.md)
- [Nginx 多环境配置治理、配置拆分与变更发布实战](./multi-environment-config-governance-and-change-release.md)
- [Nginx 与 OpenResty、Lua 扩展边界和适用场景实战](./openresty-lua-extension-boundaries-and-use-cases.md)
- [Nginx 灰度发布、蓝绿切换与维护页切流实战](./gray-release-blue-green-and-maintenance-switching.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [K8s：Ingress Controller 与 Gateway Controller 实现链路](/k8s/ingress-and-gateway-controller-chain)
- [Linux 磁盘清理与进程管理](/ops/linux-disk-cleanup)
- [Linux 用户管理与权限](/ops/linux-user-permissions)
