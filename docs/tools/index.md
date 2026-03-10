---
layout: page
title: false
aside: false
outline: false
pageClass: claude-home-page
---

<SectionLanding
  eyebrow="Tools"
  title="工具方向"
  intro="收录 Vim、iTerm2、Git、Mac 等日常开发工具的实用配置和技巧，提升开发效率。"
  :primary="{ title: 'Vim 实用方案', href: '/tools/vim', description: '从基础操作到进阶配置的 Vim 实用指南。' }"
  :scope="[
    'Vim 编辑器配置与技巧',
    'iTerm2 终端美化与效率',
    'Git 工作流与常用命令',
    'Mac 开发环境与效率工具'
  ]"
  :docs="[
    { title: 'Vim 实用方案', href: '/tools/vim', description: 'Vim 编辑器的实用配置、快捷键和插件推荐。' },
    { title: 'iTerm2 配置指南', href: '/tools/iterm2', description: 'iTerm2 终端的美化配置、快捷操作和效率提升。' },
    { title: 'Git 常用技巧', href: '/tools/git', description: 'Git 日常工作流、分支管理和常用命令速查。' },
    { title: 'Mac 效率工具', href: '/tools/mac', description: 'Mac 开发环境搭建和效率工具推荐。' }
  ]"
  :order="[
    'Vim 实用方案',
    'iTerm2 配置指南',
    'Git 常用技巧',
    'Mac 效率工具'
  ]"
/>
