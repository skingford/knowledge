---
layout: page
title: false
description: 学习知识库总览页，按方向和学习目标组织 AI、架构、Golang、运维与工具内容入口。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { learningOverviewGoals, learningOverviewTracks } from './.vitepress/theme/content-data'
</script>

<OverviewLanding
  :tracks="learningOverviewTracks"
  :goals="learningOverviewGoals"
/>
