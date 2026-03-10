---
layout: page
title: false
aside: false
outline: false
pageClass: claude-home-page
---

<SectionLanding
  eyebrow="Golang"
  title="Golang 方向"
  intro="从语言机制、并发与性能，到服务端工程实践和能力自检，把 Go 进阶学习从零散资料整理成一条连续路径。"
  :primary="{ title: '高级资料', href: '/golang/golang-advanced-learning-guide', description: '先走主线。' }"
  :secondary="{ title: '高频题', href: '/golang/go-top-30-interview-questions', description: '再做自检。' }"
  :scope="[
    'Go 语言底层',
    '并发模型',
    '性能优化与排障',
    '服务端工程实践',
    '源码阅读与能力自检准备'
  ]"
  :docs="[
    { title: '高级 Golang 学习资料', href: '/golang/golang-advanced-learning-guide', description: '主入口文档，覆盖语言、并发、性能和工程实践。' },
    { title: '30+ 高频 Golang 能力自检题', href: '/golang/go-top-30-interview-questions', description: '用问题驱动回顾知识盲区和底层理解。' },
    { title: 'Golang 高频题代码片段', href: '/golang/go-interview-code-snippets', description: '配套示例代码，方便把抽象概念落到实现。' },
    { title: 'Go 推荐书单与资料', href: '/golang/golang-recommended-resources', description: '补充阅读清单，便于继续深挖。' },
    { title: 'Pprof 排障指南', href: '/golang/pprof-troubleshooting-guide', description: '针对性能定位和排障建立实操路径。' },
    { title: 'Context 使用边界', href: '/golang/context-usage-boundaries', description: '厘清在 Go 服务里使用 Context 的边界和误区。' },
    { title: '待补主题清单', href: '/golang/todo-topics', description: '查看计划补充的 Go 专题。' }
  ]"
  :order="[
    '高级 Golang 学习资料',
    'Go 推荐书单、博客与视频资料',
    '30+ 高频 Golang 能力自检题',
    'Golang 高频题代码片段',
    'Pprof 排障指南',
    'Context 使用边界'
  ]"
/>
