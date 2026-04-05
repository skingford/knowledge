import type { SectionConfig } from './types'

export const vueSection: SectionConfig = {
  key: 'vue',
  base: '/vue/',
  navText: 'Vue',
  overviewDescription:
    '系统整理 Vue 3 主线，并补充 Vite、plugin-vue、Pinia、Axios、Alova 等生态工具，覆盖响应式系统、组件通信、高频问题、性能优化和工程配套。',
  landing: {
    eyebrow: 'Vue',
    title: 'Vue 专题',
    intro:
      '围绕 Vue 3 的组合式 API、模板系统和细粒度响应式，把组件拆分、状态组织、watch 边界、常见问题、性能优化以及常用生态工具整理成一组适合长期回查的文档。重点不是背指令和库 API，而是建立稳定的工程判断。',
    primary: { title: '专题总览', href: '/vue/', description: '先看 Vue 主线和阅读顺序。' },
    secondary: { title: 'Vue 技术指南', href: '/vue/technical-guide', description: '先建立响应式系统和组件边界。' },
    scope: [
      'script setup 与单文件组件',
      'ref、reactive 与 computed',
      'watch 与 watchEffect 边界',
      'props、emits、slots 与 provide/inject',
      'composable 组织方式',
      '模板、列表与表单',
      '生命周期与工程建议',
      '高频问题排查',
      '性能分析与优化',
      '异步组件与 KeepAlive',
      '列表渲染与虚拟化',
      'Vite、plugin-vue、Pinia、Axios 与 Alova 生态工具链',
    ],
    docs: [
      { title: 'Vue 专题总览', href: '/vue/', description: '先看当前专题范围、阅读顺序和练习建议。' },
      { title: 'Vue 技术指南：组合式 API、响应式系统与组件边界', href: '/vue/technical-guide', description: '系统整理 Vue 3 组件思维、响应式系统、组件通信和工程边界。' },
      { title: 'Vue 高频问题：响应式、组件通信与模板陷阱排错清单', href: '/vue/common-questions', description: '集中整理 Vue 开发中最常见的问题、误区和排查方法。' },
      { title: 'Vue 性能优化指南：更新机制、异步组件与列表性能', href: '/vue/performance-optimization', description: '围绕更新成本、组件边界、异步组件和大列表治理整理 Vue 性能主线。' },
      { title: 'Vite 与 Vue 工程化指南：脚手架、环境变量与构建边界', href: '/vue/vite-build-and-env-guide', description: '围绕 create-vite、模式环境变量、构建拆包和类型检查整理 Vue 工程化主线。' },
      { title: '@vitejs/plugin-vue 指南：SFC 编译、资源处理与编译选项', href: '/vue/vite-plugin-vue-guide', description: '系统整理 plugin-vue 在 Vue SFC 编译、资源 URL 处理和编译选项上的职责与边界。' },
      { title: 'Pinia 状态管理指南：Store 设计、插件扩展与 SSR 边界', href: '/vue/pinia-state-management-guide', description: '围绕 store 设计、setup store、storeToRefs、插件和 SSR 组织 Pinia 主线。' },
      { title: 'Axios 指南：实例、拦截器、取消请求与错误处理', href: '/vue/axios-http-client-guide', description: '围绕实例封装、拦截器、AbortController、错误归一和 Vue 集成整理 Axios 主线。' },
      { title: 'Alova 指南：请求策略、缓存与跨组件数据协作', href: '/vue/alova-request-strategy-guide', description: '围绕 useRequest、缓存、请求策略、适配器和跨组件协作整理 Alova 主线。' },
    ],
    order: [
      'Vue 专题总览',
      'Vue 技术指南：组合式 API、响应式系统与组件边界',
      'Vue 高频问题：响应式、组件通信与模板陷阱排错清单',
      'Vue 性能优化指南：更新机制、异步组件与列表性能',
      'Vite 与 Vue 工程化指南：脚手架、环境变量与构建边界',
      '@vitejs/plugin-vue 指南：SFC 编译、资源处理与编译选项',
      'Pinia 状态管理指南：Store 设计、插件扩展与 SSR 边界',
      'Axios 指南：实例、拦截器、取消请求与错误处理',
      'Alova 指南：请求策略、缓存与跨组件数据协作',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/vue/' },
        { text: '技术指南', link: '/vue/technical-guide' },
        { text: '高频问题', link: '/vue/common-questions' },
        { text: '性能优化', link: '/vue/performance-optimization' },
      ],
    },
    {
      text: '生态工具',
      collapsed: true,
      items: [
        { text: 'Vite', link: '/vue/vite-build-and-env-guide' },
        { text: 'plugin-vue', link: '/vue/vite-plugin-vue-guide' },
        { text: 'Pinia', link: '/vue/pinia-state-management-guide' },
        { text: 'Axios', link: '/vue/axios-http-client-guide' },
        { text: 'Alova', link: '/vue/alova-request-strategy-guide' },
      ],
    },
  ],
}
