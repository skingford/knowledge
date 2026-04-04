import type { SectionConfig } from './types'

export const nodejsSection: SectionConfig = {
  key: 'nodejs',
  base: '/nodejs/',
  navText: 'Node.js',
  overviewDescription:
    '适合希望系统补齐 Node.js 服务端能力的工程师，重点覆盖事件循环、模块系统、配置治理、可观测性、数据库边界、测试工程化，以及 NestJS 与后台任务实践。',
  landing: {
    eyebrow: 'Node.js',
    title: 'Node.js 专题',
    intro:
      '把 Node.js 从“会跑一个脚本”提升到“能解释运行时、能定位性能问题、能设计服务边界、能落地 NestJS 与后台任务工程实践”的层面，先建立服务端对象模型，再进入模块拆分、测试治理、异步任务和部署主线。',
    primary: { title: '专题总览', href: '/nodejs/', description: '先看 Node.js 服务端能力地图和阅读顺序。' },
    secondary: { title: 'NestJS 实战指南', href: '/nodejs/nestjs-practice-guide', description: '从模块分层到测试部署，系统补齐 NestJS 工程落地方法。' },
    scope: [
      'Node.js 运行时与事件循环',
      'CommonJS / ESM 与模块边界',
      'npm / pnpm / monorepo 工程化',
      '配置管理与环境变量治理',
      '日志、追踪与性能排障',
      'HTTP 服务分层与错误处理',
      'NestJS Module / Controller / Provider',
      'DTO、校验、鉴权与数据库事务',
      '队列、定时任务与异步处理',
      '测试、发布与优雅退出',
    ],
    docs: [
      { title: 'Node.js 专题总览', href: '/nodejs/', description: '先看 Node.js 服务端主线、适合人群和推荐阅读顺序。' },
      { title: 'Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界', href: '/nodejs/module-system-esm-commonjs-and-monorepo-boundaries', description: '把 import/export、require、包导出、workspace 和 monorepo 边界讲成一条工程主线。' },
      { title: 'Node.js 运行时、事件循环与性能排障', href: '/nodejs/runtime-event-loop-and-performance-troubleshooting', description: '把事件循环、microtask、流、内存、CPU 和线上排障顺序整理成一条线。' },
      { title: 'Node.js 测试、Mock 与工程化实践', href: '/nodejs/testing-mock-and-engineering-practice', description: '系统整理项目结构、依赖管理、测试分层、Mock 策略、日志配置与发布基线。' },
      { title: 'Node.js 配置管理、日志、Tracing 与可观测性实践', href: '/nodejs/config-logging-tracing-and-observability-practice', description: '把配置收口、结构化日志、request id、trace、指标和线上观测边界整理成一条线。' },
      { title: 'Node.js 数据库、事务与 ORM/Query Builder 实践', href: '/nodejs/database-transaction-and-orm-practice', description: '系统整理连接管理、事务边界、Repository 分层、ORM 取舍和 Query Builder 使用边界。' },
      { title: 'Node.js 队列、定时任务与 Worker 实战', href: '/nodejs/queue-scheduler-and-worker-practice', description: '把异步任务、重试、幂等、死信、定时调度和优雅关闭的工程边界收成一页。' },
      { title: 'Express / Fastify Web 服务实践', href: '/nodejs/express-fastify-web-service-practice', description: '围绕路由、中间件、请求上下文、错误处理、分层和部署边界整理 Node.js Web 服务主线。' },
      { title: 'NestJS 实战指南', href: '/nodejs/nestjs-practice-guide', description: '系统整理 NestJS 项目结构、请求链路、数据边界、可观测性、测试与部署实践。' },
    ],
    order: [
      'Node.js 专题总览',
      'Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界',
      'Node.js 运行时、事件循环与性能排障',
      'Node.js 测试、Mock 与工程化实践',
      'Node.js 配置管理、日志、Tracing 与可观测性实践',
      'Node.js 数据库、事务与 ORM/Query Builder 实践',
      'Node.js 队列、定时任务与 Worker 实战',
      'Express / Fastify Web 服务实践',
      'NestJS 实战指南',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/nodejs/' },
        { text: '模块系统、ESM/CommonJS 与 monorepo', link: '/nodejs/module-system-esm-commonjs-and-monorepo-boundaries' },
        { text: '运行时、事件循环与性能排障', link: '/nodejs/runtime-event-loop-and-performance-troubleshooting' },
        { text: '测试、Mock 与工程化实践', link: '/nodejs/testing-mock-and-engineering-practice' },
        { text: '配置、日志、Tracing 与可观测性', link: '/nodejs/config-logging-tracing-and-observability-practice' },
        { text: '数据库、事务与 ORM/Query Builder', link: '/nodejs/database-transaction-and-orm-practice' },
        { text: '队列、定时任务与 Worker 实战', link: '/nodejs/queue-scheduler-and-worker-practice' },
        { text: 'Express / Fastify Web 服务实践', link: '/nodejs/express-fastify-web-service-practice' },
        { text: 'NestJS 实战指南', link: '/nodejs/nestjs-practice-guide' },
      ],
    },
  ],
}
