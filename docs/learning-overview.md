---
layout: page
title: false
aside: false
outline: false
pageClass: claude-home-page
---

<OverviewLanding
  :tracks="[
    { title: '架构方向', href: '/architecture/', description: '适合后端开发、技术负责人候选人和架构岗准备，主线是系统设计、治理和分布式能力。' },
    { title: 'AI / Agent 方向', href: '/ai/', description: '适合希望系统入门 Agent 和 LLM 应用开发的工程师，重点是 Agent、Tool Calling、RAG 与 workflow。' },
    { title: 'Golang 方向', href: '/golang/', description: '适合 Go 后端和高级开发，重点覆盖语言机制、并发、性能和工程实践。' },
    { title: '运维方向', href: '/ops/', description: '适合需要日常运维能力的开发和运维工程师，重点覆盖磁盘排查、日志管理、进程管理等实操技能。' }
  ]"
  :goals="[
    { title: '想先看路线图', href: '/architecture/architect-learning-roadmap', description: '先从架构路线开始，再延伸到 AI 或 Go 的专题。' },
    { title: '想快速入门 Agent 开发', href: '/ai/agent-learning-guide', description: '先建立 Agent 全局认知，再展开 Tool Calling 和 RAG。' },
    { title: '想强化 Go 高级能力', href: '/golang/golang-advanced-learning-guide', description: '从主线资料切入，再补性能、排障和高频题。' },
    { title: '想做能力自检准备', href: '/architecture/architect-interview-prep-checklist', description: '架构和 Go 都提供适合阶段复盘或面试准备的清单和题目。' }
  ]"
/>
