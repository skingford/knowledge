---
layout: page
title: false
description: Git 主题入口，集中整理 Git 工作流、PR 与 Code Review、GitHub Actions 排障、发布与回滚实践。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'git')!
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

Git 入口页最容易先散掉的，通常不是单个命令，而是三条协作主线没连起来：分支怎么进入 PR、Review 怎么形成闭环、CI 出问题时先查哪里。下面三张 SVG 图先把这层骨架搭起来。

### 1. 分支到 PR 的主线

<GitDiagram kind="branch-pr-flow" />

### 2. Code Review 闭环

<GitDiagram kind="review-loop" />

### 3. GitHub Actions 排障主线

<GitDiagram kind="actions-troubleshooting" />

## 快速导航

- [图例速览](#图例速览)
- [Git 协作主线](#git-协作主线)
- [当前专题入口](#当前专题入口)
- [建议阅读顺序](#建议阅读顺序)

## Git 协作主线

- 先把 `feature branch -> PR -> review -> merge` 这条团队协作链路建立起来
- 再补 PR 描述、评论处理、审核操作和多人协作里的上下文同步方式
- 最后把 GitHub Actions、发布、回滚和事故现场处理收成固定动作

## 当前专题入口

- [Git 常用技巧](./common-tips.md)：日常命令、分支对比、发布回滚与多人协作速查
- [GitHub PR 与 Code Review](./github-pr-review.md)：PR 提交、评论处理、审核操作与协作规范
- [GitHub Actions 故障排查](./github-actions-troubleshooting.md)：workflow 触发、权限、Secrets、缓存、Artifact 与环境审批

## 建议阅读顺序

1. 先看 [Git 常用技巧](./common-tips.md)，把日常协作、发布和回滚的基本盘立住
2. 再读 [GitHub PR 与 Code Review](./github-pr-review.md)，把 PR 描述、评论回复和审核动作做成稳定流程
3. 最后读 [GitHub Actions 故障排查](./github-actions-troubleshooting.md)，把 CI/CD 触发、权限和部署问题的排查顺序补齐
