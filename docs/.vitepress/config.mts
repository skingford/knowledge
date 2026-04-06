import { defineConfig } from 'vitepress'
import { MermaidMarkdown } from 'vitepress-plugin-mermaid'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import * as vueCompilerSfc from 'vue/compiler-sfc'
import { localSearchOptions } from './config/search'
import docsViteConfig from './config/vite'
import { quickNavLink, sections } from './theme/content-data'

const siteUrl = 'https://skingford.github.io/knowledge/'
const siteBase = process.env.VITEPRESS_BASE || (process.env.GITHUB_ACTIONS === 'true' ? '/knowledge/' : '/')
const voidHtmlTagPattern = /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^<>]*?)?\s*(\/?)>/gi

function normalizeVoidHtmlTags(html: string) {
  return html.replace(voidHtmlTagPattern, (_, tagName: string, attrs = '', selfClosing = '') => {
    if (selfClosing === '/') {
      return `<${tagName}${attrs} />`
    }

    return `<${tagName}${attrs} />`
  })
}

const sidebar = Object.fromEntries(
  [...sections]
    .sort((a, b) => b.base.length - a.base.length)
    .map((section) => [section.base, section.sidebar]),
)

const sectionsByKey = Object.fromEntries(
  sections.map((s) => [s.key, s]),
)

function navItem(key: string) {
  const s = sectionsByKey[key]
  return { text: s.navText, link: s.base, activeMatch: `^${s.base}` }
}


export default defineConfig({
  lang: 'zh-CN',
  title: '学习知识库',
  titleTemplate: ':title | 学习知识库',
  description: '涵盖 AI / Agent、架构设计、网络、React、Vue、Svelte、Golang、Python、Node.js、Rust、Git、运维与工具的学习资料、路线图与专题索引',

  base: siteBase,
  srcExclude: ['README.md', 'TEMPLATE.md'],
  rewrites: {
    'golang/legacy/golang-advanced-learning-guide.md': 'golang/golang-advanced-learning-guide.md',
    'golang/legacy/golang-recommended-resources.md': 'golang/golang-recommended-resources.md',
    'golang/guide/legacy/09-runtime-source.md': 'golang/guide/09-runtime-source.md',
    'architecture/high-concurrency-system-design-core-points.md': 'architecture/architecture.md',
  },
  lastUpdated: true,
  appearance: true,
  sitemap: {
    hostname: siteUrl,
  },
  router: {
    prefetchLinks: false,
  },
  // Keep the SFC compiler available during dev server restarts so Markdown/Vue HMR
  // does not hit plugin-vue's transient `compiler: null` state.
  vue: {
    compiler: vueCompilerSfc,
  },
  vite: docsViteConfig,
  shouldPreload(link) {
    if (link.includes('@localSearchIndexroot')) {
      return false
    }

    if (/\/assets\/.+\.md\.[A-Za-z0-9_-]+(?:\.lean)?\.js$/.test(link)) {
      return false
    }

    // Skip preloading heavy vendor chunks — they are lazy-loaded only on pages that use them.
    if (/vendor-(?:mermaid|katex)/.test(link)) {
      return false
    }

    return link.endsWith('.css') || link.endsWith('.woff2') || /\/assets\/(?:app|chunks\/(?:theme|framework))\./.test(link)
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${siteBase}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#d46f4d' }],
    ['meta', { property: 'og:site_name', content: '学习知识库' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'og:image', content: `${siteUrl}og-image.svg` }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}og-image.svg` }],
  ],

  markdown: {
    xhtmlOut: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    config(md) {
      const defaultHtmlBlock =
        md.renderer.rules.html_block ??
        ((tokens, idx) => tokens[idx].content)
      const defaultHtmlInline =
        md.renderer.rules.html_inline ??
        ((tokens, idx) => tokens[idx].content)

      md.renderer.rules.html_block = (tokens, idx, options, env, self) => normalizeVoidHtmlTags(
        defaultHtmlBlock(tokens, idx, options, env, self),
      )
      md.renderer.rules.html_inline = (tokens, idx, options, env, self) => normalizeVoidHtmlTags(
        defaultHtmlInline(tokens, idx, options, env, self),
      )
      MermaidMarkdown(md, {})
      md.use(tabsMarkdownPlugin)
    },
  },

  transformHead(context) {
    const route = context.page
      ? `/${context.page}`
          .replace(/\/index\.md$/, '/')
          .replace(/^\/index\.md$/, '/')
          .replace(/\.md$/, '')
      : '/'
    const path = route === '/' ? '' : route.slice(1)
    const canonical = new URL(path, siteUrl).toString()
    const description = context.pageData.description || context.siteData.description
    const title = context.title || context.siteData.title

    return [
      ['link', { rel: 'canonical', href: canonical }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:image', content: `${siteUrl}og-image.svg` }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: `${siteUrl}og-image.svg` }],
    ]
  },

  themeConfig: {
    nav: [
      quickNavLink,
      {
        text: 'AI/架构',
        items: [
          { text: '学习导航总览', link: '/learning-overview' },
          navItem('ai'),
          navItem('architecture'),
          navItem('network'),
          navItem('algorithm'),
        ],
      },
      {
        text: '编程语言',
        items: [
          { text: '后端', items: [navItem('golang'), navItem('rust'), navItem('python'), navItem('nodejs')] },
          { text: '前端', items: [navItem('react'), navItem('vue'), navItem('svelte'), navItem('frontend-ecosystem')] },
        ],
      },
      {
        text: '数据与中间件',
        items: [navItem('mysql'), navItem('postgresql'), navItem('redis'), navItem('kafka'), navItem('etcd')],
      },
      {
        text: '基础设施',
        items: [navItem('docker'), navItem('nginx'), navItem('k8s'), navItem('ops'), navItem('git')],
      },
      {
        text: '工具',
        items: [
          { text: 'Claude Code', link: '/tools/claude-code' },
          { text: 'Codex', link: '/tools/codex' },
          { text: 'Gemini', link: '/tools/gemini-cli' },
          { text: 'Cursor', link: '/tools/cursor' },
          { text: 'Vim', link: '/tools/vim' },
          { text: 'iTerm2', link: '/tools/iterm2' },
          { text: 'Ghostty', link: '/tools/ghostty' },
          { text: 'Mac', link: '/tools/mac' },
        ]
      }
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/skingford/knowledge' },
    ],

    search: {
      provider: 'local',
      options: localSearchOptions,
    },

    outline: {
      level: [2, 4],
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
