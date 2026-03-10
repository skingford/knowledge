<script setup lang="ts">
interface Entry {
  title: string
  description: string
  href: string
}

defineProps<{
  tracks: Entry[]
  goals: Entry[]
}>()
</script>

<template>
  <div class="overview-landing">
    <section class="overview-landing__hero">
      <div class="overview-landing__copy">
        <p class="section-landing__eyebrow">Learning overview</p>
        <h1 class="section-landing__title">学习导航总览</h1>
        <p class="section-landing__intro">
          先按方向选择，再按目标进入，尽量让每次阅读都落在一条清晰路径上，而不是在文档目录里反复搜索。
        </p>
      </div>
    </section>

    <section class="overview-landing__section">
      <div class="section-landing__heading">
        <p class="section-landing__eyebrow">By track</p>
        <h2>按方向进入</h2>
      </div>
      <div class="section-landing__grid">
        <a v-for="item in tracks" :key="item.title" :href="item.href" class="section-landing__card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </a>
      </div>
    </section>

    <section class="overview-landing__section">
      <div class="section-landing__heading">
        <p class="section-landing__eyebrow">By goal</p>
        <h2>按目标选择入口</h2>
      </div>
      <div class="section-landing__grid">
        <a v-for="item in goals" :key="item.title" :href="item.href" class="section-landing__card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </a>
      </div>
    </section>
  </div>
</template>
