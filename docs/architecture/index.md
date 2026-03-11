---
layout: page
title: false
description: 架构方向学习入口，覆盖系统设计路线、书单、自检清单、高并发与分布式事务专题。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '../.vitepress/theme/content-data'

const { landing } = sections.find((section) => section.key === 'architecture')!
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
