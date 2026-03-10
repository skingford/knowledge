---
layout: page
title: false
aside: false
outline: false
pageClass: claude-home-page
---

<SectionLanding
  eyebrow="Ops"
  title="运维方向"
  intro="将日常运维中反复用到的排障命令、清理流程和管理技巧，从零散笔记整理成可复用的操作指南。"
  :primary="{ title: 'Linux 磁盘清理与进程管理', href: '/ops/linux-disk-cleanup', description: '从磁盘排查到进程管理的实战指南。' }"
  :scope="[
    '磁盘空间排查与清理',
    '日志管理与轮转',
    '缓存清理（Go / Node / Docker）',
    'PM2 进程管理',
    '用户管理与权限（chmod / chown / umask）',
    '常用运维工具'
  ]"
  :docs="[
    { title: 'Linux 磁盘清理与进程管理', href: '/ops/linux-disk-cleanup', description: '磁盘排查、日志清理、缓存管理、PM2 进程管理的实战操作指南。' },
    { title: 'Linux 用户管理与权限', href: '/ops/linux-user-permissions', description: '用户切换、chmod、chown、umask、用户目录管理的实战指南。' },
    { title: '待补主题清单', href: '/ops/todo-topics', description: '查看运维方向后续计划补充的主题。' }
  ]"
  :order="[
    'Linux 磁盘清理与进程管理',
    'Linux 用户管理与权限'
  ]"
/>
