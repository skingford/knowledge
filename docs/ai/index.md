---
layout: page
title: false
description: AI / Agent 学习入口，覆盖知识地图、综合指南、7 天路线、Tool Calling 与 RAG 工作流。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '../.vitepress/theme/content-data'

const { landing } = sections.find((section) => section.key === 'ai')!
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
