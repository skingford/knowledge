---
title: Svelte 技术指南：runes、组件边界与状态组织
description: 系统整理 Svelte 5 的 $state、$derived、$effect、$props、回调 props、bind:、snippet、context 与 store 使用边界。
---

# Svelte 技术指南：runes、组件边界与状态组织

Svelte 5 真正需要先立住的，不是哪几个模板指令，而是三件事：

1. 什么值该放 `$state`
2. 什么值该用 `$derived`，而不是绕一圈写进 `$effect`
3. 组件之间到底该用回调 props、`bind:`、context，还是根本不该共享

如果这三件事一开始就混，组件虽然会显得“很轻”，但后面很容易变成 effect 串联、双向绑定泛滥和数据来源不清。

## 适合谁看

- 已经会写一些 Svelte 组件，但还没有形成 Svelte 5 的稳定口径
- 正在从 React 或 Vue 迁移到 Svelte，需要切换到编译期 + 细粒度更新心智模型
- 页面能跑，但对 `$state`、`$derived`、`$effect`、`$props` 和 `bind:` 的职责还不够清晰

## 学习目标

- 建立 Svelte 5 组件、模板和 runes 的统一模型
- 分清 `$state`、`$state.raw`、`$derived`、`$effect`、`$props` 的使用边界
- 掌握回调 props、`bind:`、snippet、context、store 的常见取舍
- 理解 Svelte 列表渲染、表单处理和副作用清理的稳妥写法

## 快速导航

- [先立住 6 个判断](#先立住-6-个判断)
- [组件结构与 `$props`](#组件结构与-props)
- [状态设计：`$state`、`$derived`、`$effect`](#状态设计state-derived-effect)
- [组件通信：回调 props、`bind:`、snippet、context](#组件通信回调-props-bind-snippet-context)
- [模板、列表与表单](#模板列表与表单)
- [一套务实的工程建议](#一套务实的工程建议)

## 先立住 6 个判断

### 1. 默认优先按 Svelte 5 runes 思维写新代码

Svelte 5 把响应式从“隐式规则”收敛成更显式的 runes。新代码优先围绕 `$state`、`$derived` 和 `$effect` 建立心智模型，比继续沿用旧的隐式反应式语法更稳定。

### 2. 会影响模板、derived 或 effect 的值，再放 `$state`

不要把所有变量都塞进 `$state`。只有会驱动界面、影响派生值或副作用的状态，才值得进入响应式系统。

### 3. 派生值优先 `$derived`

只要一个值本质是“根据别的状态算出来”，优先用 `$derived`，而不是先声明一个变量，再用 `$effect` 去同步它。

### 4. `$effect` 只是逃生舱

官方建议把 `$effect` 当成和外部世界同步的手段，而不是日常数据流中转站。它适合订阅、DOM、定时器和日志，不适合承担派生状态。

### 5. 组件通信优先显式

父子通信优先 `$props` + 回调 props。`bind:` 适合少量明确的双向协作，不适合把所有状态都做成双向绑定。

### 6. 逻辑复用先看普通模块，再看 context / store

Svelte 5 让很多组件内状态不再需要 store。先判断逻辑是否只是函数抽取；确实需要跨层共享时，再考虑 context 或 store。

## 组件结构与 `$props`

一个现代 Svelte 组件，通常会按下面结构组织：

```svelte
<script lang="ts">
  type Props = {
    title: string
    submit: (value: string) => void
  }

  let { title, submit }: Props = $props()

  let keyword = $state('')
  let normalizedTitle = $derived(title.trim())

  function handleSubmit() {
    submit(keyword)
  }
</script>

<section>
  <h2>{normalizedTitle}</h2>
  <input bind:value={keyword} />
  <button onclick={handleSubmit}>提交</button>
</section>
```

工程上更稳的做法通常是：

- `$props()` 放顶部，先明确组件依赖
- `$state` 和 `$derived` 放中间，先把数据流立住
- 事件处理和 `$effect` 放后面
- 模板只表达结构，不把复杂判断堆进花括号

## 状态设计：`$state`、`$derived`、`$effect`

### `$state`

适合：

- 输入值
- 展开收起
- 当前选中项
- 影响界面的请求结果

`$state` 默认是深响应的。如果你拿到的是很大的对象，而且更常见的模式是“整包替换”而不是“深层改字段”，可以考虑 `$state.raw` 减少代理开销。

### `$derived`

适合：

- 过滤结果
- 排序结果
- 展示文案
- 校验状态

复杂派生逻辑可以用 `$derived.by(() => ...)`，但原则不变：它表达的是“值之间的关系”，不是“变化后要做的动作”。

```svelte
<script lang="ts">
  let todos = $state([
    { id: 1, title: 'write', done: false },
    { id: 2, title: 'review', done: true }
  ])

  let filter = $state<'all' | 'done'>('all')
  let visibleTodos = $derived(
    filter === 'all' ? todos : todos.filter((todo) => todo.done)
  )
</script>
```

### `$effect`

适合：

- 订阅和清理
- DOM API 同步
- 定时器
- 外部库协作

不适合：

- 维护派生值
- 监听 A 再同步到 B 的重复状态
- 组件内一层套一层的数据流中转

```svelte
<script lang="ts">
  let online = $state(false)

  $effect(() => {
    function updateStatus() {
      online = navigator.onLine
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  })
</script>
```

## 组件通信：回调 props、`bind:`、snippet、context

### 1. 父传子：`$props`

这是最清晰的入口。组件先通过 `$props()` 显式声明它真正依赖什么。

### 2. 子传父：回调 props

Svelte 5 官方推荐用回调 props 表达组件事件协作，而不是继续依赖 `createEventDispatcher`。

适合：

- 提交
- 选择
- 删除
- 切换

### 3. 双向协作：`bind:`

适合：

- 输入控件
- 明确的一对一协作
- 小范围共享可编辑值

不适合：

- 页面级复杂状态
- 多层级穿透
- “反正方便就全绑起来”

### 4. 可渲染片段：snippet + `{@render}`

当你需要把一小段可定制的展示结构交给子组件时，snippet 通常比把模板逻辑全塞进 props 更清晰。

### 5. 深层共享：context / store

跨很多层的共享状态，可以用 context；当状态已经跨组件树、要和外部订阅源协作，或者需要独立模块化管理时，再考虑 store。

## 模板、列表与表单

### 列表优先 keyed each

只要列表项会插入、删除、排序或携带局部状态，就优先使用 keyed each：

```svelte
{#each items as item (item.id)}
  <Row {item} />
{/each}
```

没有稳定 key，列表更新和局部状态都更容易错位。

### 表单不要把所有逻辑都交给 `bind:`

`bind:` 很顺手，但复杂表单仍要注意：

- 校验结果优先写成 `$derived`
- 提交逻辑优先留在事件函数里
- DOM 协调或外部同步再用 `$effect`

### 模板表达尽量保持轻

如果模板里开始出现很多链式计算、判断分叉和内联函数，往往说明派生值和组件边界该回到脚本里重构。

## 一套务实的工程建议

1. 先确定哪些值真的需要响应式
2. 再把派生值收回 `$derived`
3. 再决定哪些地方必须用 `$effect`
4. 组件通信优先显式 props 和回调
5. 列表和表单先解决结构问题，再谈性能工具

## 关联阅读

- [Svelte 专题](./index.md)
- [Svelte 高频问题：响应式、组件通信与模板陷阱排错清单](./common-questions.md)
- [Svelte 性能优化指南：更新粒度、懒加载与列表性能](./performance-optimization.md)
- [Svelte 官方文档](https://svelte.dev/docs/svelte/overview)
