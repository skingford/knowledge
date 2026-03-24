---
layout: page
title: false
description: Rust 方向入口，覆盖所有权、借用、生命周期、Trait、泛型、错误处理、Cargo 工程化与并发 async 基础。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '../.vitepress/theme/content-data'

const { landing } = sections.find((section) => section.key === 'rust')!
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
