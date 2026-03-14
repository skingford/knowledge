# 文档模板

## Frontmatter 参考

如果文档要展示词汇卡，统一使用下面的字段：

```yaml
---
title: 文档标题
description: 文档描述
vocabulary:
  - scheduler
---
```

约定：

- 文档 frontmatter 里的 `vocabulary` 只写词典 key，例如 `scheduler`
- 词条详情统一维护在 `docs/.vitepress/theme/vocabulary-dictionary.json`
- 词典项里 `phoneticUs` 为必填，`phoneticUk` 选填
- 词典项里 `phoneticSource` 为必填，允许值：`oxford`、`cambridge`、`merriam-webster`、`collins`、`official-docs`、`manual-review`
- 当 `phoneticSource` 不是 `manual-review` 时，`phoneticSourceUrl` 为必填，必须指向具体词典条目或官方文档页面
- `official-docs` 用于 `goroutine`、`mutex`、`syscall` 这类更适合引用语言/标准库官方文档的技术术语
- 页面展示的音标只允许来自共享词典中人工确认过的字段，不再运行时自动补全

## 适合人群

- 这篇文档适合谁
- 适合什么阶段
- 解决什么问题

## 学习目标

- 目标 1
- 目标 2
- 目标 3

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [学习路线](#学习路线)
- [核心知识地图](#核心知识地图)
- [推荐实践项目](#推荐实践项目)
- [推荐资料](#推荐资料)
- [高频问题](#高频问题)

## 学习路线

### 阶段一

学习内容：

- 内容 1
- 内容 2

产出：

- 产出 1
- 产出 2

### 阶段二

学习内容：

- 内容 1
- 内容 2

产出：

- 产出 1
- 产出 2

## 核心知识地图

### 模块一

- 知识点 1
- 知识点 2

### 模块二

- 知识点 1
- 知识点 2

## 推荐实践项目

- 项目 1：重点练什么
- 项目 2：重点练什么

## 推荐资料

书籍：

- 资料 1
- 资料 2

视频或课程：

- 资料 1
- 资料 2

## 高频问题

- 问题 1
- 问题 2
- 问题 3
