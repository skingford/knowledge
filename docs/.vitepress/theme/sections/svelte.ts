import type { SectionConfig } from './types'

export const svelteSection: SectionConfig = {
  key: 'svelte',
  base: '/svelte/',
  navText: 'Svelte',
  overviewDescription:
    '系统整理 Svelte 5 主线，覆盖 runes、组件通信、状态组织、高频问题和性能优化。',
  landing: {
    eyebrow: 'Svelte',
    title: 'Svelte 专题',
    intro:
      '围绕 Svelte 5 的 runes、编译期思维和细粒度更新模型，把组件结构、状态组织、组件通信、常见问题和性能优化整理成一组适合长期回查的文档。重点不是背语法糖，而是建立稳定的工程判断。',
    primary: { title: '专题总览', href: '/svelte/', description: '先看 Svelte 主线和阅读顺序。' },
    secondary: { title: 'Svelte 技术指南', href: '/svelte/technical-guide', description: '先建立 runes、组件边界和状态组织。' },
    scope: [
      'Svelte 5 runes 与组件结构',
      '$state、$derived 与 $effect',
      '$props、bind: 与回调 props',
      'snippet 与 {@render}',
      'context、store 与逻辑复用',
      '条件渲染、列表与表单',
      '生命周期与副作用清理',
      '高频问题排查',
      '懒加载与代码分割',
      'keyed each 与列表性能',
    ],
    docs: [
      { title: 'Svelte 专题总览', href: '/svelte/', description: '先看当前专题范围、阅读顺序和练习建议。' },
      { title: 'Svelte 技术指南：runes、组件边界与状态组织', href: '/svelte/technical-guide', description: '系统整理 Svelte 5 的 runes、组件通信、snippet、context 和工程边界。' },
      { title: 'Svelte 高频问题：响应式、组件通信与模板陷阱排错清单', href: '/svelte/common-questions', description: '集中整理 Svelte 开发中最常见的问题、误区和排查方法。' },
      { title: 'Svelte 性能优化指南：更新粒度、懒加载与列表性能', href: '/svelte/performance-optimization', description: '围绕细粒度更新、列表渲染、懒加载和 SvelteKit 加载策略整理性能主线。' },
    ],
    order: [
      'Svelte 专题总览',
      'Svelte 技术指南：runes、组件边界与状态组织',
      'Svelte 高频问题：响应式、组件通信与模板陷阱排错清单',
      'Svelte 性能优化指南：更新粒度、懒加载与列表性能',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/svelte/' },
        { text: '技术指南', link: '/svelte/technical-guide' },
        { text: '高频问题', link: '/svelte/common-questions' },
        { text: '性能优化', link: '/svelte/performance-optimization' },
      ],
    },
  ],
}
