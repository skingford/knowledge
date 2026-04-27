---
title: 网络必备知识
description: 从分层模型到一次完整请求链路，建立网络知识全景图，再按主题深入各专题文章。
---

<script setup>
import InlineSvg from '@docs-components/common/InlineSvg.vue'
</script>

# 网络必备知识

## 适合谁看

- 想系统补齐网络基础，不再把 TCP、HTTP、DNS、CDN 当成零散名词来背的工程师
- 做后端、基础设施、云原生或系统设计时，发现很多性能和故障问题都绕不开网络的人
- 面试里经常被问三次握手、HTTPS、DNS、负载均衡，但回答容易只停在单点概念的人
- 已经知道 TCP、HTTP、HTTPS 是什么，但还没把它们串成一条访问链路的人

## 学习目标

- 建立一张从链路层到应用层的统一网络知识地图
- 讲清 IP、TCP、TLS、HTTP 分别负责什么，以及它们怎么串成一次完整请求
- 理解一次请求从输入域名到拿到响应，中间到底发生了什么
- 看到慢请求、重传、握手失败时，知道大致可能卡在哪里
- 知道网络排障时如何按层定位，而不是一上来就盲猜问题点

## 快速导航

- [先建立一张网络全景图](#先建立一张网络全景图)
- [一次请求到底经过哪些环节](#一次请求到底经过哪些环节)
- [IP 与路由](/network/ip-and-routing)
- [Socket、端口与连接状态](/network/socket-and-connection-state)
- [TCP 与 UDP](/network/tcp-and-udp)
- [HTTP 与 HTTPS](/network/http-and-https)
- [TLS、证书与 mTLS](/network/tls-and-certificates)
- [代理、反向代理、网关与隧道](/network/proxy-gateway-and-tunnel)
- [DNS、CDN 与负载均衡](/network/dns-cdn-and-load-balancing)
- [NAT、防火墙、内网穿透与 VPN](/network/nat-firewall-and-vpn)
- [网络排障与常用命令](/network/troubleshooting-and-commands)
- [抓包、tcpdump 与 Wireshark](/network/packet-capture-and-tcpdump)
- [高频自检题](#高频自检题)

## 先建立一张网络全景图

<InlineSvg src="/images/network/network-layers.svg" alt="TCP/IP 四层网络模型" />

最值得先记住的不是单个协议，而是网络问题可以按层拆：

| 层次 | 你最该先掌握什么 | 典型问题 |
| --- | --- | --- |
| 物理 / 链路层 | 网卡、MAC、交换、ARP、MTU | 同网段通信异常、丢包、ARP 冲突 |
| 网络层 | IP、子网、路由、NAT、ICMP | 路由不通、跨网段访问失败、Traceroute 中断 |
| 传输层 | TCP、UDP、端口、连接状态 | 建连超时、RST、丢包重传、连接堆积 |
| 应用层 | HTTP、HTTPS、DNS、WebSocket、gRPC | 502/504、证书错误、域名解析异常、跨层代理问题 |

工程里最常见的误区是：

- 把所有问题都当成应用问题
- 或者一看到超时就只盯着代码

更稳的思路通常是：

1. 先确认问题发生在哪一层
2. 再看这一层最关键的状态、指标和日志
3. 最后再判断是否要往上层或下层继续追

::: tip OSI 七层和 TCP/IP 四层怎么讲
不必死背教科书映射，重点是知道每层大概负责什么。TCP/IP 四层在工程实践里更常用：链路层、网络层、传输层、应用层。回答时最好结合真实协议：IP、TCP、UDP、HTTP、DNS、TLS。
:::

## 一次请求到底经过哪些环节

<InlineSvg src="/images/network/request-lifecycle.svg" alt="一次 HTTPS 请求完整链路" />

假设浏览器访问 `https://example.com/api/orders`，大致会经过：

1. DNS 解析域名：先查本地缓存，没命中再去递归解析拿到目标 IP
2. 选定目标 IP，按路由规则决定走哪个网关
3. 发起 TCP 建连（三次握手）
4. 完成 TLS 握手：协商加密套件、校验证书、生成会话密钥
5. 发送 HTTP 请求
6. 请求经过 CDN / WAF / 负载均衡 / 网关，再到应用服务
7. 应用服务处理请求
8. 返回响应
9. 客户端决定是否复用连接、缓存内容或继续请求资源

所以很多"接口慢"其实可能卡在完全不同的位置：

- DNS 慢
- TCP 建连慢 / 重传多
- TLS 握手慢 / 失败
- HTTP 头过大被拒绝
- 网关转发慢 / 错误
- 上游服务处理慢
- 下游数据库或缓存慢

## 按层拆开，你该学哪些专题

如果你不想把网络学成零散名词，最稳的方式是把它重新挂回分层和链路：

| 层次 / 视角 | 更值得先读什么 | 为什么 |
| --- | --- | --- |
| 网络层 | [IP 与路由](./ip-and-routing.md) | 先搞清“包为什么到不了” |
| 传输层连接视角 | [Socket、端口与连接状态](./socket-and-connection-state.md) | 先搞清监听、建连、关闭和状态异常 |
| 传输层协议视角 | [TCP 与 UDP](./tcp-and-udp.md) | 再理解可靠传输、重传、窗口和拥塞控制 |
| 应用层协议 | [HTTP 与 HTTPS](./http-and-https.md) | 把请求响应语义、版本差异和入口错误码串起来 |
| 信任与加密 | [TLS、证书与 mTLS](./tls-and-certificates.md) | 把证书、SNI、ALPN、握手失败放回 HTTPS 链路 |
| 代理与治理入口 | [代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md) | 把 502/504、真实 IP、Upgrade、代理分层讲顺 |
| 基础设施入口 | [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md) | 把域名解析、边缘缓存和流量入口讲顺 |
| 边界访问控制 | [NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md) | 把地址转换、访问边界和远程接入补上 |
| 实战定位 | [网络排障与常用命令](./troubleshooting-and-commands.md) | 把命令和观察顺序固定下来 |
| 证据采集 | [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md) | 把抓包从“最后手段”变成可复用动作 |

## 高频自检题

在你说自己"网络基础已经够用了"之前，至少先问自己这些问题：

::: details 自检清单
- 能不能把一次 HTTPS 请求从 DNS 到响应完整讲顺
- 能不能解释三次握手、四次挥手、TIME_WAIT 的工程意义
- 能不能说清 HTTP/2 为什么仍可能受到 TCP 丢包影响
- 能不能解释 TLS 握手至少在做哪些事
- 能不能说出 DNS 的缓存层次和 TTL 的影响
- 能不能区分 CDN、四层 LB、七层 LB 分别在解决什么问题
- 能不能在故障时快速决定先用 `dig`、`curl`、`ss` 还是 `tcpdump`
- 能不能把"协议原理"和"线上排障动作"讲成一条线
:::

建议回答统一用这三步：先说它解决什么问题，再说关键机制或实现路径，最后补一句工程场景、风险点或常见误区。

## 建议阅读顺序

1. 先把"分层模型 + 一次请求链路"讲顺（本文）
2. 再补网络层基础：[IP 与路由](./ip-and-routing.md)
3. 补连接生命周期：[Socket、端口与连接状态](./socket-and-connection-state.md)
4. 再补传输层协议：[TCP 与 UDP](./tcp-and-udp.md)
5. 补应用层协议：[HTTP 与 HTTPS](./http-and-https.md)
6. 补 TLS 深水区：[TLS、证书与 mTLS](./tls-and-certificates.md)
7. 补代理和入口治理：[代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md)
8. 补线上基础设施链路：[DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)
9. 补网络边界：[NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)
10. 最后把排障命令和抓包思路转成固定动作：[网络排障与常用命令](./troubleshooting-and-commands.md) → [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md)
