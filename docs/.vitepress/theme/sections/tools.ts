import type { SectionConfig } from './types'

export const toolsSection: SectionConfig = {
    key: 'tools',
    base: '/tools/',
    navText: '工具',
    overviewDescription:
      '收录 Claude Code、Codex、Gemini CLI、Cursor、Vim、iTerm2、Mac 等日常开发工具的实用配置和技巧。',
    landing: {
      eyebrow: 'Tools',
      title: '工具方向',
      intro: '收录 Claude Code、Codex、Gemini CLI、Cursor、Vim、iTerm2、Mac 等日常开发工具的实用配置和技巧，提升开发效率。',
      primary: { title: 'Claude Code 使用指南', href: '/tools/claude-code', description: '整理安装、权限模式、CLAUDE.md、MCP、Hooks 与 VS Code 工作流。' },
      secondary: { title: 'Codex 使用指南', href: '/tools/codex', description: '整理 CLI、IDE、App、Cloud、AGENTS.md、MCP、skills 与自动化用法。' },
      scope: [
        'Claude Code CLI / IDE / 自动化',
        'OpenAI Codex CLI / IDE / Cloud',
        'Gemini CLI / MCP / GEMINI.md / 自动化',
        'Cursor / Agent / Rules / MCP / Background Agents',
        'Vim 编辑器配置与技巧',
        'iTerm2 终端美化与效率',
        'Mac 开发环境与效率工具',
      ],
      docs: [
        { title: 'Claude Code 使用指南', href: '/tools/claude-code', description: '整理安装、权限模式、CLAUDE.md、MCP、Hooks 与 VS Code 工作流。' },
        { title: 'Codex 使用指南', href: '/tools/codex', description: '整理 CLI、IDE、App、Cloud、AGENTS.md、MCP、skills 与自动化用法。' },
        { title: 'Gemini CLI 使用指南', href: '/tools/gemini-cli', description: '整理安装、认证、settings.json、GEMINI.md、MCP、skills、subagents 与自动化用法。' },
        { title: 'Cursor 使用指南', href: '/tools/cursor', description: '整理安装、Tab、Inline Edit、Agent、Rules、MCP、Background Agents、Bugbot 与 CLI 用法。' },
        { title: 'Vim 实用方案', href: '/tools/vim', description: 'Vim 编辑器的实用配置、快捷键和插件推荐。' },
        { title: 'iTerm2 配置指南', href: '/tools/iterm2', description: 'iTerm2 终端的美化配置、快捷操作和效率提升。' },
        { title: 'Mac 效率工具', href: '/tools/mac', description: 'Mac 开发环境搭建和效率工具推荐。' },
      ],
      order: ['Claude Code 使用指南', 'Codex 使用指南', 'Gemini CLI 使用指南', 'Cursor 使用指南', 'Vim 实用方案', 'iTerm2 配置指南', 'Mac 效率工具'],
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
          { text: 'Mac 工具', link: '/tools/mac' },
        ],
      },
    ],
  }
