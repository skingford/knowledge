---
layout: page
title: false
description: Golang 学习入口，覆盖语言机制、并发、性能、工程实践、排障与能力自检内容。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '../.vitepress/theme/content-data'

const { landing } = sections.find((section) => section.key === 'golang')!
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
