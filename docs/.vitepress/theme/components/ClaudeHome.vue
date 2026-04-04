<script setup lang="ts">
import { withBase } from 'vitepress'
import { homeHighlights as highlights, homePrinciples as principles, homeTracks as tracks } from '@docs-content'
</script>

<template>
  <div class="claude-home">
    <section class="claude-home__hero">
      <div class="claude-home__hero-copy">
        <p class="claude-home__eyebrow">A focused knowledge base</p>
        <h1 class="claude-home__title">学习知识库</h1>
        <p class="claude-home__subtitle">
          AI、架构、Golang、Python、Node.js、数据库、中间件、K8s、运维与工具多个方向，按长期学习更自然的方式重组资料、路线图和自检清单。
        </p>
        <div class="claude-home__actions">
          <a
            class="claude-home__button claude-home__button--primary"
            :href="withBase('/learning-overview')"
          >
            开始浏览
          </a>
          <a class="claude-home__button claude-home__button--secondary" :href="withBase('/nav')">
            快速导航
          </a>
        </div>
      </div>

      <div class="claude-home__hero-panel">
        <p class="claude-home__panel-label">What you will find</p>
        <div class="claude-home__panel-lines">
          <div v-for="item in principles" :key="item" class="claude-home__panel-line">
            <span class="claude-home__panel-dot" />
            <span>{{ item }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="claude-home__tracks">
        <a
          v-for="track in tracks"
          :key="track.title"
          :href="withBase(track.href)"
          class="claude-home__track"
        >
        <p class="claude-home__track-index">方向</p>
        <h2 class="claude-home__track-title">{{ track.title }}</h2>
        <p class="claude-home__track-description">{{ track.description }}</p>
        <span class="claude-home__track-link">进入专题</span>
      </a>
    </section>

    <section class="claude-home__highlights">
      <div class="claude-home__section-heading">
        <p class="claude-home__eyebrow">Recommended entry points</p>
        <h2>先走一条清晰路径，再看细节资料。</h2>
      </div>

      <div class="claude-home__highlight-grid">
        <a
          v-for="item in highlights"
          :key="item.title"
          :href="withBase(item.href)"
          class="claude-home__highlight"
        >
          <p class="claude-home__highlight-eyebrow">{{ item.eyebrow }}</p>
          <h3 class="claude-home__highlight-title">{{ item.title }}</h3>
          <p class="claude-home__highlight-description">{{ item.description }}</p>
        </a>
      </div>
    </section>
  </div>
</template>
