import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

export default defineConfig({
  lang: 'zh-CN',
  title: '学习知识库',
  description: '涵盖 AI / Agent、架构设计、Golang 三个方向的学习资料与路线图',

  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap',
      },
    ],
  ],

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
    },
  },

  themeConfig: {
    nav: [
      { text: '学习导航', link: '/learning-overview' },
      { text: 'AI / Agent', link: '/ai/' },
      { text: '架构', link: '/architecture/' },
      { text: 'Golang', link: '/golang/' },
    ],

    sidebar: {
      '/ai/': [
        {
          text: 'AI / Agent',
          items: [
            { text: '方向概览', link: '/ai/' },
            { text: 'Agent 学习综合指南', link: '/ai/agent-learning-guide' },
            { text: '7 天 Agent 学习路线', link: '/ai/agent-learning-roadmap' },
            { text: 'Tool Calling 设计清单', link: '/ai/tool-calling-design-checklist' },
            { text: 'RAG 基础与工作流', link: '/ai/rag-basics-and-workflow' },
            { text: '待补主题清单', link: '/ai/todo-topics' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: '架构',
          items: [
            { text: '方向概览', link: '/architecture/' },
            { text: '架构师学习路线', link: '/architecture/architect-learning-roadmap' },
            { text: '架构师分阶段书单', link: '/architecture/architect-booklist-by-level' },
            { text: '架构能力自检准备清单', link: '/architecture/architect-interview-prep-checklist' },
            { text: '高并发系统设计清单', link: '/architecture/high-concurrency-system-checklist' },
            { text: '分布式事务方案对比', link: '/architecture/distributed-transaction-comparison' },
            { text: '待补主题清单', link: '/architecture/todo-topics' },
          ],
        },
      ],
      '/golang/': [
        {
          text: 'Golang',
          items: [
            { text: '方向概览', link: '/golang/' },
            { text: '高级 Golang 学习资料', link: '/golang/golang-advanced-learning-guide' },
            { text: '30+ 高频能力自检题', link: '/golang/go-top-30-interview-questions' },
            { text: '源码与原理知识点', link: '/golang/go-source-and-principle-notes' },
            { text: '能力自检高频题代码片段', link: '/golang/go-interview-code-snippets' },
            { text: '推荐书单与资源', link: '/golang/golang-recommended-resources' },
            { text: 'Pprof 排障指南', link: '/golang/pprof-troubleshooting-guide' },
            { text: 'Context 使用边界', link: '/golang/context-usage-boundaries' },
            { text: '待补主题清单', link: '/golang/todo-topics' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/skingford/knowledge' },
    ],

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    editLink: {
      pattern: 'https://github.com/skingford/knowledge/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
})
