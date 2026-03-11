---
title: 网络编程与标准库
description: Go 网络编程与标准库总览页，按 HTTP、连接治理、中间件与 IO 拆分为多个专题入口。
search: false
---

# 网络编程与标准库

这部分保留为总览入口，原本超长的内容已按主题拆成 3 个子专题，便于按需阅读，也能降低单页体积和搜索索引噪音。

## 建议阅读顺序

1. [HTTP 服务端、客户端与 TCP/UDP](./04-http-server-client-tcp-udp)
2. [连接池、超时、重试与限流](./04-connection-timeout-retry-rate-limit)
3. [中间件、JSON 编解码与文件 IO](./04-middleware-json-io)

## 你会学到什么

- 理解 `net/http` 服务端模型和 `http.Client` 的正确用法
- 掌握 TCP / UDP 基础、连接池、超时与重试这些生产环境常见模式
- 熟悉中间件组织方式、JSON 编解码细节，以及文件与 IO 相关标准库

## 拆分说明

- 原第 1-3 节 -> [HTTP 服务端、客户端与 TCP/UDP](./04-http-server-client-tcp-udp)
- 原第 4-7 节 -> [连接池、超时、重试与限流](./04-connection-timeout-retry-rate-limit)
- 原第 8-10 节 -> [中间件、JSON 编解码与文件 IO](./04-middleware-json-io)
