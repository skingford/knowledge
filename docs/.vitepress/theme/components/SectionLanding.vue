<script setup lang="ts">
import { withBase } from 'vitepress'

interface LinkItem {
  title: string
  description: string
  href: string
}

defineProps<{
  eyebrow: string
  title: string
  intro: string
  primary: LinkItem
  secondary?: LinkItem
  scope: string[]
  docs: LinkItem[]
  order: string[]
}>()
</script>

<template>
  <div class="section-landing">
    <section class="section-landing__hero">
      <div class="section-landing__copy">
        <p class="section-landing__eyebrow">{{ eyebrow }}</p>
        <h1 class="section-landing__title">{{ title }}</h1>
        <p class="section-landing__intro">{{ intro }}</p>
        <div class="section-landing__actions">
          <a class="claude-home__button claude-home__button--primary" :href="withBase(primary.href)">
            {{ primary.title }}
          </a>
          <a
            v-if="secondary"
            class="claude-home__button claude-home__button--secondary"
            :href="withBase(secondary.href)"
          >
            {{ secondary.title }}
          </a>
        </div>
      </div>

      <div class="section-landing__panel">
        <p class="section-landing__panel-label">收纳范围</p>
        <ul class="section-landing__scope">
          <li v-for="item in scope" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <section class="section-landing__docs">
      <div class="section-landing__heading">
        <p class="section-landing__eyebrow">Current documents</p>
        <h2>先从一篇核心入口开始，再展开到专题。</h2>
      </div>

      <div class="section-landing__grid">
        <a
          v-for="item in docs"
          :key="item.title"
          :href="withBase(item.href)"
          class="section-landing__card"
        >
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </a>
      </div>
    </section>

    <section class="section-landing__order">
      <div class="section-landing__heading">
        <p class="section-landing__eyebrow">Suggested order</p>
        <h2>推荐阅读顺序</h2>
      </div>

      <ol class="section-landing__timeline">
        <li v-for="item in order" :key="item">{{ item }}</li>
      </ol>
    </section>
  </div>
</template>
