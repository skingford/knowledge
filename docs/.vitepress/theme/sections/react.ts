import type { SectionConfig } from './types'

export const reactSection: SectionConfig = {
  key: 'react',
  base: '/react/',
  navText: 'React',
  overviewDescription:
    '系统整理 React 主线，覆盖组件思维、状态建模、副作用边界、常见问题和性能优化。',
  landing: {
    eyebrow: 'React',
    title: 'React 专题',
    intro:
      '围绕 React 的组件、状态、渲染、Effect、常见陷阱和性能优化，整理成一组适合长期回查的文档。重点不是 API 背诵，而是建立稳定的工程判断。',
    primary: { title: '专题总览', href: '/react/', description: '先看 React 主线和阅读顺序。' },
    secondary: { title: 'React 技术指南', href: '/react/react-technical-guide', description: '先建立组件、状态、Effect 与通信边界。' },
    scope: [
      '组件拆分与数据流',
      '状态建模与不可变更新',
      'Props、Context 与 Reducer 取舍',
      'Effect 边界与副作用清理',
      '条件渲染、列表与表单',
      '渲染与提交流程',
      '高频问题排查',
      '性能分析与优化',
      '列表渲染与虚拟化',
      'Suspense、lazy 与交互流畅性',
    ],
    docs: [
      { title: 'React 专题总览', href: '/react/', description: '先看当前专题范围、阅读顺序和练习建议。' },
      { title: 'React 技术指南：组件、状态、Effect 与工程边界', href: '/react/react-technical-guide', description: '系统整理 React 组件思维、状态设计、Effect 边界和组件通信。' },
      { title: 'React 高频问题：渲染、状态与副作用排错清单', href: '/react/react-common-questions', description: '集中整理 React 开发中最常见的问题、误区和排查方法。' },
      { title: 'React 性能优化指南：渲染分析、列表性能与稳定性优化', href: '/react/react-performance-optimization', description: '围绕渲染来源、测量方法、列表性能、代码分割和交互流畅性整理 React 性能主线。' },
    ],
    order: [
      'React 专题总览',
      'React 技术指南：组件、状态、Effect 与工程边界',
      'React 高频问题：渲染、状态与副作用排错清单',
      'React 性能优化指南：渲染分析、列表性能与稳定性优化',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/react/' },
        { text: '技术指南', link: '/react/react-technical-guide' },
        { text: '高频问题', link: '/react/react-common-questions' },
        { text: '性能优化', link: '/react/react-performance-optimization' },
      ],
    },
  ],
}
