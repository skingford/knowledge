---
layout: page
title: false
description: 工具方向入口，收录 AI 编码工具、Vim、iTerm2、Ghostty 和 Mac 开发效率工具的实用配置与技巧。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'tools')!
</script>

<SectionLanding
  :eyebrow="landing.eyebrow"
  :title="landing.title"
  :intro="landing.intro"
  :primary="landing.primary"
  :secondary="landing.secondary"
  :scope="landing.scope"
  :docs="landing.docs"
  :order="landing.order"
/>

## 图例速览

工具方向最容易先散掉的，通常不是某个软件怎么装，而是三条效率主线没连起来：AI 编码工具怎么接到代码仓库、终端和编辑器怎么形成闭环、长期上下文和自动化怎么稳定沉淀。下面三张 SVG 图先把这层骨架搭起来。

### 1. AI 编码工具栈

<ToolsDiagram kind="ai-coding-stack" />

### 2. 终端与编辑器效率闭环

<ToolsDiagram kind="terminal-editor-loop" />

### 3. 自动化与长期上下文

<ToolsDiagram kind="automation-context" />

## 快速导航

- [图例速览](#图例速览)
- [工具使用主线](#工具使用主线)
- [当前专题入口](#当前专题入口)
- [建议阅读顺序](#建议阅读顺序)

## 工具使用主线

- 先把 Claude Code、Codex、Gemini CLI、Cursor 这类 AI 工具的入口形态和项目上下文方式分清楚
- 再把 Vim、iTerm2 和 Mac 环境调成稳定高频可用的本地工作台
- 最后把规则文件、MCP、skills、hooks 和自动化任务接起来，减少重复操作

## 当前专题入口

- [Claude Code 使用指南](./claude-code.md)：CLI、权限模式、CLAUDE.md、skills、subagents、MCP、hooks
- [Codex 使用指南](./codex.md)：CLI、IDE、App、Cloud、AGENTS.md、MCP、skills 与自动化
- [Gemini CLI 使用指南](./gemini-cli.md)：安装、认证、settings.json、GEMINI.md、MCP、skills、subagents
- [Cursor 使用指南](./cursor.md)：编辑器能力、Agent、Rules、Memories、MCP、Background Agents、Bugbot
- [Vim 实用方案](./vim.md)：编辑习惯、快捷键、配置和插件
- [iTerm2 配置指南](./iterm2.md)：终端外观、快捷操作、Shell 集成和效率优化
- [Ghostty 使用指南](./ghostty.md)：安装、配置文件、主题、Shell Integration、Quick Terminal、AppleScript
- [Mac 效率工具](./mac.md)：包管理、开发环境和系统级效率工具

## 建议阅读顺序

1. 先看 [Claude Code 使用指南](./claude-code.md) 和 [Codex 使用指南](./codex.md)，把终端型 AI 编码工作流和项目级上下文建立起来
2. 再读 [Gemini CLI 使用指南](./gemini-cli.md) 和 [Cursor 使用指南](./cursor.md)，补齐另一类 CLI / 编辑器 Agent 的使用方式
3. 然后进入 [Vim 实用方案](./vim.md)、[iTerm2 配置指南](./iterm2.md) 和 [Ghostty 使用指南](./ghostty.md)，把本地编辑器和终端工作台打磨顺手
4. 最后用 [Mac 效率工具](./mac.md) 把开发机环境和系统级效率工具补齐
