import type { SectionConfig } from './types'

export const gitSection: SectionConfig = {
    key: 'git',
    base: '/git/',
    navText: 'Git',
    overviewDescription:
      '集中整理 Git 工作流、分支对比、PR 与 Code Review、GitHub Actions 排障、发布与回滚实践。',
    landing: {
      eyebrow: 'Git',
      title: 'Git 主题',
      intro: '把 Git 基础、GitHub 协作、Code Review、GitHub Actions 排障、发布与回滚拆成更清晰的主题入口，方便后续持续扩展。',
      primary: { title: 'Git 常用技巧', href: '/git/common-tips', description: 'Git 与 GitHub 协作总手册，覆盖分支、对比、发布、回滚和团队规范。' },
      secondary: { title: 'GitHub PR 与 Code Review', href: '/git/github-pr-review', description: '集中处理 PR 提交、审核、评论回复、合并策略与多人协作实践。' },
      scope: [
        'Git 日常工作流与常用命令',
        '分支对比、cherry-pick 与恢复现场',
        'PR 提交与 Code Review 协作',
        'GitHub Actions CI/CD 与故障排查',
        '发布分支、回滚与多人协作排障',
      ],
      docs: [
        { title: 'Git 常用技巧', href: '/git/common-tips', description: 'Git 与 GitHub 协作总手册，覆盖分支、PR、Review、发布与回滚。' },
        { title: 'GitHub PR 与 Code Review', href: '/git/github-pr-review', description: '集中处理 PR 提交、Code Review、评论回复、审核操作与协作规范。' },
        { title: 'GitHub Actions 故障排查', href: '/git/github-actions-troubleshooting', description: '集中排查 workflow 不触发、权限不足、Secrets、缓存、Artifact 与 Environment 问题。' },
      ],
      order: ['Git 常用技巧', 'GitHub PR 与 Code Review', 'GitHub Actions 故障排查'],
    },
    sidebar: [
      {
        text: 'Git',
        items: [
          { text: '主题概览', link: '/git/' },
          { text: 'Git 常用技巧', link: '/git/common-tips' },
          { text: 'GitHub PR 与 Code Review', link: '/git/github-pr-review' },
          { text: 'GitHub Actions 故障排查', link: '/git/github-actions-troubleshooting' },
        ],
      },
    ],
  }
