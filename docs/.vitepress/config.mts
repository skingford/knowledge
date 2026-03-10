import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

export default defineConfig({
  lang: 'zh-CN',
  title: '学习知识库',
  description: '涵盖 AI / Agent、架构设计、Golang、运维、工具五个方向的学习资料与路线图',

  base: '/knowledge/',
  lastUpdated: true,
  appearance: true,

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@500;600;700&display=swap',
      },
    ],
    [
      'script',
      {},
      `(() => {
        const key = 'vitepress-theme-appearance'
        const saved = localStorage.getItem(key)
        if (!saved) {
          localStorage.setItem(key, 'dark')
          document.documentElement.classList.add('dark')
        }
      })();`,
    ],
  ],

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
    },
  },

  themeConfig: {
    nav: [
      { text: '快速导航', link: '/nav' },
      {
        text: '学习方向',
        items: [
          { text: '学习导航总览', link: '/learning-overview' },
          { text: 'AI / Agent', link: '/ai/' },
          { text: '架构', link: '/architecture/' },
          { text: 'Golang', link: '/golang/' },
          { text: '运维', link: '/ops/' },
        ]
      },
      {
        text: '工具',
        items: [
          { text: 'Vim 实用方案', link: '/tools/vim' },
          { text: 'iTerm2 配置指南', link: '/tools/iterm2' },
          { text: 'Git 常用技巧', link: '/tools/git' },
          { text: 'Mac 效率工具', link: '/tools/mac' },
        ]
      },
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
        {
          text: '7 天学习路线详解',
          collapsed: true,
          items: [
            { text: 'Day 1: 理解 Agent 是什么', link: '/ai/roadmap/day1-what-is-agent' },
            { text: 'Day 2: 学会调用 LLM API', link: '/ai/roadmap/day2-llm-api' },
            { text: 'Day 3: 学会 Tool Calling', link: '/ai/roadmap/day3-tool-calling' },
            { text: 'Day 4: 学习 Workflow', link: '/ai/roadmap/day4-workflow' },
            { text: 'Day 5: RAG 和 Memory', link: '/ai/roadmap/day5-rag-memory' },
            { text: 'Day 6: 评测与安全', link: '/ai/roadmap/day6-eval-safety' },
            { text: 'Day 7: 完整项目', link: '/ai/roadmap/day7-full-project' },
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
      '/ops/': [
        {
          text: '运维',
          items: [
            { text: '方向概览', link: '/ops/' },
            { text: 'Linux 磁盘清理与进程管理', link: '/ops/linux-disk-cleanup' },
            { text: 'Linux 用户管理与权限', link: '/ops/linux-user-permissions' },
            { text: '待补主题清单', link: '/ops/todo-topics' },
          ],
        },
      ],
      '/tools/': [
        {
          text: '工具',
          items: [
            { text: '方向概览', link: '/tools/' },
            { text: 'Vim 实用方案', link: '/tools/vim' },
            { text: 'iTerm2 配置指南', link: '/tools/iterm2' },
            { text: 'Git 常用技巧', link: '/tools/git' },
            { text: 'Mac 效率工具', link: '/tools/mac' },
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
            { text: '能力自检高频题代码片段', link: '/golang/go-interview-code-snippets' },
            { text: '推荐书单与资源', link: '/golang/golang-recommended-resources' },
            { text: 'Pprof 排障指南', link: '/golang/pprof-troubleshooting-guide' },
            { text: 'Context 使用边界', link: '/golang/context-usage-boundaries' },
            { text: '待补主题清单', link: '/golang/todo-topics' },
          ],
        },
        {
          text: '学习大纲详解',
          collapsed: true,
          items: [
            { text: '一、语言基础深化', link: '/golang/guide/01-language-fundamentals' },
            { text: '二、底层原理', link: '/golang/guide/02-underlying-principles' },
            { text: '三、并发编程', link: '/golang/guide/03-concurrency' },
            { text: '四、网络编程与标准库', link: '/golang/guide/04-network-stdlib' },
            { text: '五、工程实践', link: '/golang/guide/05-engineering-practices' },
            { text: '六、数据库与缓存', link: '/golang/guide/06-database-cache' },
            { text: '七、性能优化与排障', link: '/golang/guide/07-performance-troubleshooting' },
            { text: '八、微服务与分布式', link: '/golang/guide/08-microservices-distributed' },
            { text: '九、源码与 Runtime', link: '/golang/guide/09-runtime-source' },
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
