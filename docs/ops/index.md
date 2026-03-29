---
layout: page
title: false
description: 运维方向学习入口，聚合 Linux 磁盘清理、用户权限和后续运维专题规划。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'ops')!
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

## 图例速览

运维方向最容易先散掉的，通常不是单个命令，而是三条主线没同时建立：线上问题怎么排、日志与指标怎么配合看、服务收到信号后怎么优雅处理。下面三张 SVG 图例先把这层骨架搭起来。

### 1. 线上故障处理主线

<GoPerformanceDiagram kind="incident-workflow" />

### 2. 指标、日志与链路的协同关系

<GoPerformanceDiagram kind="telemetry-triad" />

### 3. 服务信号与优雅退出

<GoCloudNativeDiagram kind="signal-lifecycle" />

## 快速导航

- [图例速览](#图例速览)
- [运维主线](#运维主线)
- [当前专题入口](#当前专题入口)
- [建议阅读顺序](#建议阅读顺序)

## 运维主线

- 先会看磁盘、日志、进程和权限，建立最基础的 Linux 排障能力
- 再把 Nginx 的入口治理、反向代理、HTTPS 和排障路径补齐
- 最后把日常运维动作沉淀成固定 SOP，包括变更前检查、变更后验证和故障回滚

## 当前专题入口

- [Linux 磁盘清理与进程管理](./linux-disk-cleanup.md)：磁盘排查、日志清理、缓存治理、进程管理
- [Linux 用户管理与权限](./linux-user-permissions.md)：用户、组、`chmod`、`chown`、`umask` 和目录权限
- [Nginx 专题](/nginx/)：配置、反向代理、HTTPS、性能优化与日常排障
- [待补主题清单](./todo-topics.md)：后续准备补齐的运维专题

## 建议阅读顺序

1. 先看 [Linux 磁盘清理与进程管理](./linux-disk-cleanup.md)，把最常见的磁盘、日志、缓存和进程问题处理顺序固定下来
2. 再看 [Linux 用户管理与权限](./linux-user-permissions.md)，把线上最容易踩坑的权限链路补齐
3. 然后进入 [Nginx 专题](/nginx/)，把入口层的配置、代理、证书和排障能力建立起来
4. 最后回看 [待补主题清单](./todo-topics.md)，决定下一步要继续扩展的运维方向
