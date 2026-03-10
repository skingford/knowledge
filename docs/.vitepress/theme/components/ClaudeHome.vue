<script setup lang="ts">
const tracks = [
  {
    title: 'AI / Agent',
    description: '从 Agent 模式、Tool Calling 到 RAG 与 workflow，把概念、设计和可落地实现串成完整路径。',
    href: '/ai/',
  },
  {
    title: '架构设计',
    description: '围绕系统设计、高并发与分布式治理，构建能复用到真实业务的判断框架与清单。',
    href: '/architecture/',
  },
  {
    title: 'Golang',
    description: '覆盖语言机制、并发、性能与工程实践，把 Go 进阶学习从点状资料整理成面。',
    href: '/golang/',
  },
]

const highlights = [
  {
    eyebrow: 'Start here',
    title: '学习导航总览',
    description: '先看总览，再决定从路线、专题还是自检开始，避免在目录里来回跳转。',
    href: '/learning-overview',
  },
  {
    eyebrow: 'AI focus',
    title: 'Agent 学习综合指南',
    description: '适合先搭整体地图，再逐步展开 Tool Calling、RAG 和 workflow 细节。',
    href: '/ai/agent-learning-guide',
  },
  {
    eyebrow: 'System thinking',
    title: '架构能力自检准备清单',
    description: '把架构问题拆到能力项和判断项，适合准备面试或做阶段性复盘。',
    href: '/architecture/architect-interview-prep-checklist',
  },
  {
    eyebrow: 'Go depth',
    title: '30+ 高频能力自检题',
    description: '用题目拉通语言细节、并发模型和工程经验，快速发现知识盲区。',
    href: '/golang/go-top-30-interview-questions',
  },
]

const principles = [
  '按主题组织，不把知识堆成时间线式日志。',
  '优先给出路线和框架，再补专题和资料。',
  '兼顾系统学习、实践落地与能力自检。',
]
</script>

<template>
  <div class="claude-home">
    <section class="claude-home__hero">
      <div class="claude-home__hero-copy">
        <p class="claude-home__eyebrow">A focused knowledge base</p>
        <h1 class="claude-home__title">学习知识库</h1>
        <p class="claude-home__subtitle">
          AI、架构、Golang 三条主线，按长期学习更自然的方式重组资料、路线图和自检清单。
        </p>
        <div class="claude-home__actions">
          <a class="claude-home__button claude-home__button--primary" href="/learning-overview">
            开始浏览
          </a>
          <a class="claude-home__button claude-home__button--secondary" href="/nav">
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
        :href="track.href"
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
          :href="item.href"
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
