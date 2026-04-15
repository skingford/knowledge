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
- [TCP 与 UDP](./tcp-and-udp.md)：TCP/UDP 对比、三次握手、四次挥手、滑动窗口与拥塞控制
- [HTTP 与 HTTPS](./http-and-https.md)：HTTP 版本演进、TLS 握手与 HTTPS 排障
- [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)：域名解析、边缘缓存、回源和 L4/L7 负载均衡
- [NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)：地址转换、访问控制、内外网打通和远程接入
- [网络排障与常用命令](./troubleshooting-and-commands.md)：ping、dig、curl、ss、tcpdump 等命令的排障场景

## 建议阅读顺序

1. 先读 [网络学习 Checklist](./learning-checklist.md)，把学习目标和阶段顺序固定下来
2. 再读 [网络必备知识](./essential-knowledge.md)，建立分层模型和请求链路全景图
3. 按层深入：[IP 与路由](./ip-and-routing.md) → [TCP 与 UDP](./tcp-and-udp.md) → [HTTP 与 HTTPS](./http-and-https.md)
4. 补线上基础设施：[DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)
5. 补网络边界：[NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)
6. 最后把知识转成排查动作：[网络排障与常用命令](./troubleshooting-and-commands.md)
