---
layout: page
title: false
aside: false
outline: false
pageClass: claude-home-page
---

<SectionLanding
  eyebrow="Architecture"
  title="架构方向"
  intro="围绕系统设计、高并发、分布式事务与治理方法，把架构学习整理成适合长期复用的框架、清单和路线。"
  :primary="{ title: '学习路线', href: '/architecture/architect-learning-roadmap', description: '先搭主线。' }"
  :secondary="{ title: '能力自检', href: '/architecture/architect-interview-prep-checklist', description: '再用清单校验。' }"
  :scope="[
    '系统设计',
    '核心基础',
    '分布式系统',
    '微服务与中间件',
    '数据架构',
    '云原生与 DevOps',
    '高可用与稳定性治理',
    '架构方法论与技术规划'
  ]"
  :docs="[
    { title: '架构师学习路线', href: '/architecture/architect-learning-roadmap', description: '适合作为主入口，先看清楚各阶段该补什么。' },
    { title: '架构师分阶段书单', href: '/architecture/architect-booklist-by-level', description: '按成长阶段筛选更合适的资料。' },
    { title: '架构能力自检准备清单', href: '/architecture/architect-interview-prep-checklist', description: '用判断项梳理系统设计和架构治理能力。' },
    { title: '高并发系统设计清单', href: '/architecture/high-concurrency-system-checklist', description: '把常见高并发设计问题拆成一组可检查项。' },
    { title: '分布式事务方案对比', href: '/architecture/distributed-transaction-comparison', description: '快速对比常见事务方案的边界与取舍。' },
    { title: '待补主题清单', href: '/architecture/todo-topics', description: '查看后续计划补充的专题。' }
  ]"
  :order="[
    '架构师学习路线',
    '架构师分阶段书单',
    '高并发系统设计清单',
    '分布式事务方案对比',
    '架构能力自检准备清单'
  ]"
/>
