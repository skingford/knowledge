---
layout: page
title: false
description: 网络专题入口，覆盖分层模型、TCP/IP、HTTP/HTTPS、DNS、CDN、负载均衡与常见排障主线。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'network')!
</script>

<SectionLanding
  :eyebrow="landing.eyebrow"
  :title="landing.title"
  :intro="landing.intro"
  :primary="landing.primary"
  :secondary="landing.secondary"
  :scope="landing.scope"
  :docs="landing.docs"
  :order="landing.order"
/>

## 快速导航

- [网络知识主线](#网络知识主线)
- [当前专题入口](#当前专题入口)
- [按问题入口找文章](#按问题入口找文章)
- [建议阅读顺序](#建议阅读顺序)

## 网络知识主线

- 如果你是按 Go 后端 / 线上排障目标来学，先走一遍 [网络学习 Checklist](./learning-checklist.md)，把主线和练习顺序固定下来
- 先把 `分层模型 -> IP/TCP -> HTTP/HTTPS -> DNS/CDN/LB` 这条主线串起来，不要把知识拆成孤立名词
- 再把一次请求的完整访问链路讲清楚：域名解析、建连、TLS、协议传输、缓存命中、回源和负载均衡
- 最后补排障顺序和常用命令，做到出问题时知道先看哪一层、该抓哪些证据

## 当前专题入口

- [网络学习 Checklist](./learning-checklist.md)：按 Go 后端和实战排障目标，把学习顺序、实操检查和故障排查清单收成一页
- [网络必备知识](./essential-knowledge.md)：从分层模型到一次完整请求链路，建立网络知识全景图
- [IP 与路由](./ip-and-routing.md)：IP 层寻路、子网掩码、路由表、NAT 和 TTL
- [Socket、端口与连接状态](./socket-and-connection-state.md)：监听、连接生命周期、`TIME_WAIT`、`CLOSE_WAIT` 和常见建连错误
- [TCP 与 UDP](./tcp-and-udp.md)：TCP/UDP 对比、三次握手、四次挥手、滑动窗口与拥塞控制
- [HTTP 与 HTTPS](./http-and-https.md)：HTTP 版本演进、TLS 握手与 HTTPS 排障
- [TLS、证书与 mTLS](./tls-and-certificates.md)：证书链、SNI、ALPN、双向认证和常见 `x509` / 握手报错
- [代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md)：正向代理、反向代理、网关、CONNECT、Upgrade 和常见 `502` / `504`
- [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)：域名解析、边缘缓存、回源和 L4/L7 负载均衡
- [NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)：地址转换、访问控制、内外网打通和远程接入
- [网络排障与常用命令](./troubleshooting-and-commands.md)：ping、dig、curl、ss、tcpdump 等命令的排障场景
- [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md)：从三次握手、RST、重传到 TLS 握手，系统看懂包有没有发出去、有没有回来

## 按问题入口找文章

- 如果你总在“包为什么到不了”上卡住，先读 [IP 与路由](./ip-and-routing.md)
- 如果你经常被 `connection refused`、`TIME_WAIT`、`CLOSE_WAIT` 绕晕，先读 [Socket、端口与连接状态](./socket-and-connection-state.md)
- 如果你会背三次握手，但对重传、窗口、拥塞控制不稳，先读 [TCP 与 UDP](./tcp-and-udp.md)
- 如果你分不清 HTTP/1.1、HTTP/2、HTTP/3 和 HTTPS 的关系，先读 [HTTP 与 HTTPS](./http-and-https.md)
- 如果你常被证书、SNI、`x509`、mTLS 报错卡住，先读 [TLS、证书与 mTLS](./tls-and-certificates.md)
- 如果你总被 `502`、`503`、`504`、真实 IP 丢失、WebSocket 升级失败困住，先读 [代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md)
- 如果你更常遇到域名解析、边缘缓存、回源和入口流量问题，先读 [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)
- 如果你经常碰到“能解析但访问不通”，先读 [NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)
- 如果你已经怀疑是握手、重传、RST、TLS Alert 这类底层问题，先读 [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md)
- 如果你想把命令和排障动作固定成 SOP，先读 [网络排障与常用命令](./troubleshooting-and-commands.md)

## 建议阅读顺序

1. 先读 [网络学习 Checklist](./learning-checklist.md)，把学习目标和阶段顺序固定下来
2. 再读 [网络必备知识](./essential-knowledge.md)，建立分层模型和请求链路全景图
3. 先补网络与连接基础：[IP 与路由](./ip-and-routing.md) → [Socket、端口与连接状态](./socket-and-connection-state.md) → [TCP 与 UDP](./tcp-and-udp.md)
4. 再补应用与信任链路：[HTTP 与 HTTPS](./http-and-https.md) → [TLS、证书与 mTLS](./tls-and-certificates.md)
5. 再补代理与入口治理：[代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md) → [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)
6. 补网络边界：[NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)
7. 最后把知识转成排查动作：[网络排障与常用命令](./troubleshooting-and-commands.md) → [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md)
