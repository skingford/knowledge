---
title: '@vitejs/plugin-vue 指南：SFC 编译、资源处理与编译选项'
description: 系统整理 @vitejs/plugin-vue 在 Vue SFC 编译、资源 URL 转换、编译选项、custom element 和 custom block 处理上的职责与边界。
---

# @vitejs/plugin-vue 指南：SFC 编译、资源处理与编译选项

Vue 项目里经常把 Vite 和 `@vitejs/plugin-vue` 混成一个东西。实际上更准确的理解是：

- Vite 提供插件容器、开发服务器和构建能力
- `@vitejs/plugin-vue` 负责把 Vue SFC 接进这条链路

如果这一层没看清楚，后面遇到 `.vue` 编译、资源路径、`customElement` 或编译选项问题时，就很容易不知道该查哪边。

## 适合谁看

- 已经在用 Vue + Vite，但对 plugin-vue 的职责和可配置项还不够清晰
- 遇到过 SFC 编译、资源 URL、custom block、custom element 一类问题
- 想把“会用模板”提升到“知道 SFC 是怎么接进构建链的”

## 学习目标

- 分清 Vite 与 `@vitejs/plugin-vue` 的职责边界
- 掌握 SFC 编译、模板资源 URL 处理和常见编译选项
- 理解 `customElement`、`optionsAPI`、`propsDestructure`、custom block 的适用边界

## 快速导航

- [plugin-vue 到底负责什么](#plugin-vue-到底负责什么)
- [最小配置和常见选项](#最小配置和常见选项)
- [模板资源 URL 处理](#模板资源-url-处理)
- [custom element 与编译器选项](#custom-element-与编译器选项)
- [custom block 的边界](#custom-block-的边界)
- [一套务实的工程建议](#一套务实的工程建议)

## plugin-vue 到底负责什么

最小配置其实很简单：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

它核心处理的是：

- `.vue` 单文件组件编译
- Vue SFC 的 HMR 集成
- 模板中的静态资源 URL 转换
- 向 `vue/compiler-sfc` 透传底层编译选项

如果项目还用了 TSX / JSX，需要额外接 `@vitejs/plugin-vue-jsx`，这和 `plugin-vue` 不是同一件事。

## 最小配置和常见选项

### `include` / `exclude`

适合你只想让某些文件走 Vue SFC 处理，或者显式排除特殊目录。

### `features`

官方 README 当前列出的高频项主要包括：

- `propsDestructure`
- `customElement`
- `optionsAPI`
- `prodDevtools`
- `prodHydrationMismatchDetails`
- `componentIdGenerator`

### 一个务实判断

- 没有明确需求，先用默认值
- 只有当你知道某个 feature 解决的就是当前问题时，再打开

## 模板资源 URL 处理

plugin-vue 会把模板中的静态资源 URL 转成 ESM 导入，这是 Vue + Vite 里图片、视频等资源能够被构建系统接管的关键。

常见影响范围包括：

- `<img src>`
- `<video src>` / `poster`
- `<source src>`
- SVG `image` / `use` 引用

这层转换只对静态字符串路径有效。动态路径如果太复杂，就应该自己显式导入：

```ts
import logoUrl from '../assets/logo.png'
```

### 什么时候需要配 `transformAssetUrls`

- 你用了自定义组件并希望某些 prop 也走资源转换
- 你接了特殊模板编译链
- 你在迁移旧项目，需要兼容原有资源书写习惯

没有这些场景，不建议为“看起来更灵活”去改默认规则。

## custom element 与编译器选项

### `customElement`

适合你明确要把一部分 `.vue` 组件编译成自定义元素时使用。它不是普通业务组件的默认模式。

### `optionsAPI`

如果项目已经纯组合式 API，且团队确定不再依赖 Options API，可以考虑关闭以帮助生产构建做更多 dead-code elimination。但这类收益通常不该优先于代码一致性。

### 透传给 `vue/compiler-sfc` 的选项

plugin-vue 允许把 `script`、`template`、`style` 相关低层配置透传给 SFC 编译器。务实建议是：

- 先只在确有编译需求时使用
- 不要把普通业务规则下沉成一堆编译期魔法

## custom block 的边界

plugin-vue 也支持配合自定义插件处理 SFC custom block，例如国际化、文档元数据、实验性 DSL。

但更稳的口径是：

- custom block 适合少量、稳定、明确的编译期约定
- 不适合把大量业务逻辑藏进模板以外的魔法块

## 一套务实的工程建议

1. 先把 plugin-vue 理解成 Vue SFC 接入 Vite 的桥，而不是另一个打包器
2. 默认配置优先，只有明确需求再启用高级 feature
3. 资源 URL 规则保持简单，动态资源显式导入
4. custom block 和编译选项只服务确定场景，不要泛化

## 关联阅读

- [Vue 专题](./index.md)
- [Vite 与 Vue 工程化指南：脚手架、环境变量与构建边界](./vite-build-and-env-guide.md)
- [Vue 技术指南：组合式 API、响应式系统与组件边界](./technical-guide.md)
- [@vitejs/plugin-vue README](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue)
