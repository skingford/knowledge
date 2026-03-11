import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { quickNavLink, sections } from './theme/content-data'

const siteUrl = 'https://skingford.github.io/knowledge/'

const sectionNavItems = sections.map((section) => ({
  text: section.navText,
  link: section.base,
  activeMatch: `^${section.base}`,
}))

const sidebar = Object.fromEntries(
  sections.map((section) => [section.base, section.sidebar]),
)

export default defineConfig({
  lang: 'zh-CN',
  title: '学习知识库',
  titleTemplate: ':title | 学习知识库',
  description: '涵盖 AI / Agent、架构设计、Golang、运维、工具五个方向的学习资料与路线图',

  base: '/knowledge/',
  srcExclude: ['README.md', 'TEMPLATE.md'],
  lastUpdated: true,
  appearance: true,
  sitemap: {
    hostname: siteUrl,
  },
  router: {
    prefetchLinks: false,
  },
  shouldPreload(link) {
    if (link.includes('@localSearchIndexroot')) {
      return false
    }

    if (/\/assets\/.+\.md\.[A-Za-z0-9_-]+(?:\.lean)?\.js$/.test(link)) {
      return false
    }

    return link.endsWith('.css') || link.endsWith('.woff2') || /\/assets\/(?:app|chunks\/(?:theme|framework))\./.test(link)
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@500;600;700&display=swap',
      },
    ],
    ['meta', { name: 'theme-color', content: '#d46f4d' }],
    ['meta', { property: 'og:site_name', content: '学习知识库' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'og:image', content: `${siteUrl}og-image.svg` }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}og-image.svg` }],
  ],

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    config(md) {
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
        text: '学习方向',
        items: [{ text: '学习导航总览', link: '/learning-overview' }, ...sectionNavItems],
      },
      {
        text: '工具',
        items: [
          { text: 'Vim 实用方案', link: '/tools/vim' },
          { text: 'iTerm2 配置指南', link: '/tools/iterm2' },
          { text: 'Git 常用技巧', link: '/tools/git' },
          { text: 'Mac 效率工具', link: '/tools/mac' },
        ]
      }
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/skingford/knowledge' },
    ],

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
          },
        },
      },
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
