import type { SectionConfig } from './types'

export const frontendEcosystemSection: SectionConfig = {
  key: 'frontend-ecosystem',
  base: '/frontend-ecosystem/',
  navText: '前端公共生态',
  overviewDescription:
    '整理 React、Vue、Svelte 共用的前端基础设施——Vite 构建、Axios HTTP 客户端、Alova 请求策略，帮你建立跨框架通用的工程判断。',
  landing: {
    eyebrow: '前端公共生态',
    title: '前端公共生态',
    intro:
      '前端框架各有主张，但构建工具、HTTP 客户端和请求策略层是跨框架共用的基础设施。这组文档把 Vite、Axios、Alova 从具体框架中抽离出来，聚焦它们作为通用工具的职责边界和工程实践。',
    primary: { title: 'Vite 构建指南', href: '/frontend-ecosystem/vite-build-and-env-guide', description: '先理解构建工具的职责边界。' },
    secondary: { title: 'Axios 客户端指南', href: '/frontend-ecosystem/axios-http-client-guide', description: '再建立 HTTP 客户端的统一约定。' },
    scope: [
      'Vite 构建与工程化',
      '环境变量与模式',
      '静态资源与拆包',
      '依赖预构建',
      'Axios 实例与拦截器',
      '取消请求与错误归一',
      'Alova 请求策略',
      '缓存与跨组件协作',
      '多框架适配',
      'Vite 插件生态与选型',
      'unplugin 统一抽象层',
      '构建优化插件',
      'UnoCSS / Tailwind CSS',
    ],
    docs: [
      { title: 'Vite 构建与工程化指南', href: '/frontend-ecosystem/vite-build-and-env-guide', description: '围绕脚手架、环境变量、构建边界和拆包策略，整理跨框架通用的 Vite 工程主线。' },
      { title: 'Axios HTTP 客户端指南', href: '/frontend-ecosystem/axios-http-client-guide', description: '围绕实例封装、拦截器、取消请求和错误归一，整理跨框架通用的 Axios 主线。' },
      { title: 'Alova 请求策略指南', href: '/frontend-ecosystem/alova-request-strategy-guide', description: '围绕 useRequest、缓存、请求策略和跨组件协作，整理跨框架通用的 Alova 主线。' },
      { title: 'Vite 插件生态指南', href: '/frontend-ecosystem/vite-plugin-ecosystem-guide', description: '围绕 unplugin、构建优化、开发体验和 CSS 方案，整理高频 Vite 插件的选型判断与工程边界。' },
    ],
    order: [
      'Vite 构建与工程化指南',
      'Axios HTTP 客户端指南',
      'Alova 请求策略指南',
      'Vite 插件生态指南',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/frontend-ecosystem/' },
        { text: 'Vite 构建', link: '/frontend-ecosystem/vite-build-and-env-guide' },
        { text: 'Axios 客户端', link: '/frontend-ecosystem/axios-http-client-guide' },
        { text: 'Alova 策略', link: '/frontend-ecosystem/alova-request-strategy-guide' },
        { text: 'Vite 插件生态', link: '/frontend-ecosystem/vite-plugin-ecosystem-guide' },
      ],
    },
  ],
}
