import type { SectionConfig } from './types'

export const toolsSection: SectionConfig = {
    key: 'tools',
    base: '/tools/',
    navText: '工具',
    overviewDescription:
      '收录 Claude Code、Codex、Gemini CLI、Cursor、Vim、iTerm2、Ghostty、Mac 等日常开发工具的实用配置和技巧。',
    landing: {
      eyebrow: 'Tools',
      title: '工具方向',
      intro: '收录 Claude Code、Codex、Gemini CLI、Cursor、Vim、iTerm2、Ghostty、Mac 等日常开发工具的实用配置和技巧，提升开发效率。',
      primary: { title: 'Claude Code 使用指南', href: '/tools/claude-code', description: '整理权限模式、CLAUDE.md、MCP 与工作流。' },
      secondary: { title: 'Codex 使用指南', href: '/tools/codex', description: '整理 CLI、Cloud、MCP 与 skills。' },
      scope: [
        'Claude Code CLI / IDE / 自动化',
        'OpenAI Codex CLI / IDE / Cloud',
        'Gemini CLI / MCP / GEMINI.md / 自动化',
        'Cursor / Agent / Rules / MCP / Background Agents',
        'Vim 编辑器配置与技巧',
        'iTerm2 终端美化与效率',
        'Ghostty 终端配置与自动化',
        'Mac 开发环境与效率工具',
      ],
      docs: [
        { title: 'Claude Code 使用指南', href: '/tools/claude-code', description: '整理权限模式、CLAUDE.md、MCP 与工作流。' },
        { title: 'Codex 使用指南', href: '/tools/codex', description: '整理 CLI、Cloud、MCP 与 skills。' },
        { title: 'Gemini CLI 使用指南', href: '/tools/gemini-cli', description: '整理认证、GEMINI.md、MCP 与自动化。' },
        { title: 'Cursor 使用指南', href: '/tools/cursor', description: '整理 Tab、Agent、Rules 与 MCP。' },
        { title: 'Vim 实用方案', href: '/tools/vim', description: '整理配置、快捷键与常用插件。' },
        { title: 'iTerm2 配置指南', href: '/tools/iterm2', description: '整理主题、快捷操作与效率技巧。' },
        { title: 'Ghostty 使用指南', href: '/tools/ghostty', description: '整理配置、主题与 Quick Terminal。' },
        { title: 'Mac 效率工具', href: '/tools/mac', description: '整理开发环境搭建与常用效率工具。' },
      ],
      order: ['Claude Code 使用指南', 'Codex 使用指南', 'Gemini CLI 使用指南', 'Cursor 使用指南', 'Vim 实用方案', 'iTerm2 配置指南', 'Ghostty 使用指南', 'Mac 效率工具'],
    },
    sidebar: [
      {
        text: '工具',
        items: [
          { text: '方向概览', link: '/tools/' },
          { text: 'Claude Code', link: '/tools/claude-code' },
          { text: 'Codex', link: '/tools/codex' },
          { text: 'Gemini CLI', link: '/tools/gemini-cli' },
          { text: 'Cursor', link: '/tools/cursor' },
          { text: 'Vim', link: '/tools/vim' },
          { text: 'iTerm2', link: '/tools/iterm2' },
          { text: 'Ghostty', link: '/tools/ghostty' },
          { text: 'Mac 工具', link: '/tools/mac' },
        ],
      },
    ],
  }
