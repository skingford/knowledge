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

- 先把 `分层模型 -> IP/TCP -> HTTP/HTTPS -> DNS/CDN/LB` 这条主线串起来，不要把知识拆成孤立名词
- 再把一次请求的完整访问链路讲清楚：域名解析、建连、TLS、协议传输、缓存命中、回源和负载均衡
- 最后补排障顺序和常用命令，做到出问题时知道先看哪一层、该抓哪些证据

## 当前专题入口

- [网络必备知识](./essential-knowledge.md)：先建立统一认知框架，知道必须掌握哪些层、哪些协议、哪些链路
- [TCP/IP、HTTP 与 HTTPS 主线](./tcp-ip-http-and-https.md)：把 IP、TCP、TLS、HTTP 版本演进和一次请求链路讲成一条线
- [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)：把解析、缓存、边缘加速、回源和 L4/L7 转发统一收口
- [网络排障与常用命令](./troubleshooting-and-commands.md)：把 ping、dig、curl、ss、tcpdump 等命令放回真实排障场景里使用
- [网络高频问题与自检清单](./essential-questions.md)：把最常被问的网络问题和答题口径整理成一份复习清单

## 建议阅读顺序

1. 先读 [网络必备知识](./essential-knowledge.md)，把整体框架和高频概念建立起来
2. 再读 [TCP/IP、HTTP 与 HTTPS 主线](./tcp-ip-http-and-https.md)，把协议细节和链路过程讲扎实
3. 接着读 [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)，补齐真实线上访问路径里的基础设施认知
4. 再读 [网络排障与常用命令](./troubleshooting-and-commands.md)，把知识转成可执行的排查动作
5. 最后用 [网络高频问题与自检清单](./essential-questions.md) 做一轮复习和查漏补缺
