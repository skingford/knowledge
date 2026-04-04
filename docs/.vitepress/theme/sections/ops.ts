import type { SectionConfig } from './types'

export const opsSection: SectionConfig = {
    key: 'ops',
    base: '/ops/',
    navText: '运维',
    overviewDescription:
      '适合需要日常运维能力的开发和运维工程师，重点覆盖磁盘排查、日志管理、进程管理、权限管理与 Nginx 入口治理等实操技能。',
    landing: {
      eyebrow: 'Ops',
      title: '运维方向',
      intro:
        '将日常运维中反复用到的排障命令、清理流程和管理技巧，从零散笔记整理成可复用的操作指南。',
      primary: {
        title: 'Linux 磁盘清理与进程管理',
        href: '/ops/linux-disk-cleanup',
        description: '从磁盘排查到进程管理的实战指南。',
      },
      secondary: {
        title: 'Nginx 专题',
        href: '/nginx/',
        description: '把 Nginx 的配置、代理、HTTPS 和排障主线补齐。',
      },
      scope: [
        '磁盘空间排查与清理',
        '日志管理与轮转',
        '缓存清理（Go / Node / Docker）',
        'PM2 进程管理',
        '用户管理与权限（chmod / chown / umask）',
        'Nginx 配置、反向代理与 HTTPS',
        '常用运维工具',
      ],
      docs: [
        { title: 'Linux 磁盘清理与进程管理', href: '/ops/linux-disk-cleanup', description: '磁盘排查、日志清理、缓存管理、PM2 进程管理的实战操作指南。' },
        { title: 'Linux 用户管理与权限', href: '/ops/linux-user-permissions', description: '用户切换、chmod、chown、umask、用户目录管理的实战指南。' },
        { title: 'Nginx 专题', href: '/nginx/', description: '系统整理 Nginx 配置、反向代理、HTTPS、性能优化与常见排障。' },
        { title: '待补主题清单', href: '/ops/todo-topics', description: '查看运维方向后续计划补充的主题。' },
      ],
      order: ['Linux 磁盘清理与进程管理', 'Linux 用户管理与权限', 'Nginx 专题'],
    },
    sidebar: [
      {
        text: '运维',
        items: [
          { text: '方向概览', link: '/ops/' },
          { text: '磁盘进程', link: '/ops/linux-disk-cleanup' },
          { text: '用户权限', link: '/ops/linux-user-permissions' },
          { text: 'Nginx', link: '/nginx/' },
          { text: '待补清单', link: '/ops/todo-topics' },
        ],
      },
    ],
  }
