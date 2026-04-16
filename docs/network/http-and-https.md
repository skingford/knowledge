---
title: HTTP 与 HTTPS
description: 从 HTTP/1.1、HTTP/2、HTTP/3 版本演进到 HTTPS/TLS 握手与排障，系统梳理应用层协议核心知识。
---

<script setup>
import InlineSvg from '@docs-components/common/InlineSvg.vue'
</script>

# HTTP 与 HTTPS

## 适合谁看

- 知道 HTTP 和 HTTPS 的区别，但说不清各版本到底改了什么的人
- 线上遇到 502/504、TLS 握手失败、证书错误，想快速定位原因的人
- 面试被问 HTTP/2 多路复用、队头阻塞、TLS 握手，想系统讲清楚的人

## 学习目标

- 知道 HTTP/1.1、HTTP/2、HTTP/3 分别解决什么问题
- 能讲清 HTTPS 和 TLS 握手的主线流程
- 遇到 HTTPS 问题时知道排障方向

## 快速导航

- [HTTP 版本演进](#http-版本演进)
- [HTTPS 与 TLS](#https-与-tls)

## HTTP 版本演进

<InlineSvg src="/images/network/http-evolution.svg" alt="HTTP 版本演进对比" />

### HTTP/1.1

- Keep-Alive 连接复用
- 文本协议，易调试
- 同一连接上的并发能力有限，容易有队头阻塞

### HTTP/2

引入二进制分帧、Header 压缩、多路复用和 Stream 优先级。主要解决 HTTP/1.1 下多个请求并发效率差的问题。

::: warning 为什么 HTTP/2 多路复用了还会卡
HTTP/2 的多路复用发生在应用层，底层仍然是同一条 TCP 连接。一旦 TCP 层丢包，整个连接上的数据推进都会受到影响——这就是 TCP 层队头阻塞。
:::

### HTTP/3

基于 QUIC（运行在 UDP 之上），核心价值是：

- 把传输控制放到 UDP 之上
- 降低连接迁移成本
- 避免 TCP 层队头阻塞对整条连接的拖累

所以它在移动网络、弱网切换场景里通常更有优势。

| 版本 | 核心改进 | 你必须记住什么 |
| --- | --- | --- |
| HTTP/1.1 | Keep-Alive、管线化（实践中少用） | 容易有队头阻塞，一个连接串行语义更明显 |
| HTTP/2 | 多路复用、头部压缩、二进制分帧 | 同一个 TCP 连接里可并发多个 stream |
| HTTP/3 | 基于 QUIC（UDP） | 解决 TCP 层队头阻塞，移动网络场景更友好 |

## HTTPS 与 TLS

<InlineSvg src="/images/network/tls-handshake.svg" alt="TLS 握手流程" />

HTTPS 本质上就是 HTTP over TLS。

HTTP 负责请求方法、Header、Body、状态码、缓存与连接复用语义。TLS 负责身份认证、密钥协商、传输加密、报文完整性保护。

所以讲 HTTPS 时不要只讲"加了一层 SSL"——更应该讲出完整链路：先 DNS 解析，再 TCP 建连，再 TLS 握手，最后才是 HTTP 请求和响应。

### TLS 握手主线

至少要能讲到这几步：

1. **ClientHello**：客户端带上支持的 TLS 版本、加密套件等
2. **ServerHello**：服务端选择协议参数并返回证书
3. 客户端校验证书链和域名
4. 双方协商会话密钥
5. 后续 HTTP 报文通过会话密钥加密传输

### HTTPS 排障

很多 HTTPS 问题不只是证书过期，还可能是：

- 证书链不完整
- SNI 配置错误
- 仅支持旧 TLS 版本
- 证书和域名不匹配
- 中间代理把 TLS 终止位置改了

::: tip HTTPS 到底慢在哪
可能慢在 DNS、TCP、TLS、CDN、网关、应用或下游依赖。不能只凭"HTTPS 比 HTTP 多了一层加密"就断言问题在 TLS 本身。
:::

## 延伸阅读

- 想补传输层协议：读 [TCP 与 UDP](./tcp-and-udp.md)
- 想补线上基础设施链路：读 [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)
- 想看全局知识主线：读 [网络必备知识](./essential-knowledge.md)
