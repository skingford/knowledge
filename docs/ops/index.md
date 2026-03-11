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
import { sections } from '../.vitepress/theme/content-data'

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
