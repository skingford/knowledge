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
- [网络必备知识](./essential-knowledge.md)：从分层模型、IP、TCP、HTTP/HTTPS、DNS/CDN/负载均衡到排障方法与高频自检题，建立统一认知框架
- [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)：把解析、缓存、边缘加速、回源和 L4/L7 转发统一收口
- [NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)：把地址转换、访问控制、内外网打通和远程接入统一起来理解
- [网络排障与常用命令](./troubleshooting-and-commands.md)：把 ping、dig、curl、ss、tcpdump 等命令放回真实排障场景里使用

## 建议阅读顺序

1. 先读 [网络学习 Checklist](./learning-checklist.md)，先把学习目标、阶段顺序和最少实操固定下来
2. 再读 [网络必备知识](./essential-knowledge.md)，把整体框架、协议细节和高频自检题一次建立起来
3. 接着读 [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)，补齐真实线上访问路径里的基础设施认知
4. 再读 [NAT、防火墙、内网穿透与 VPN](./nat-firewall-and-vpn.md)，把”为什么访问不通”这类问题补到网络边界层
5. 再读 [网络排障与常用命令](./troubleshooting-and-commands.md)，把知识转成可执行的排查动作
