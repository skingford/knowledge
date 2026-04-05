---
title: Vue 技术指南：组合式 API、响应式系统与组件边界
description: 系统整理 Vue 3 的 script setup、ref/reactive、computed、watch、组件通信、生命周期与 composable 组织方式。
---

# Vue 技术指南：组合式 API、响应式系统与组件边界

Vue 3 真正需要先立住的，不是指令列表，而是三件事：

1. 响应式数据该用 `ref` 还是 `reactive`
2. 派生值该用 `computed` 还是普通函数
3. 副作用该用 `watch`、`watchEffect`，还是根本不该监听

如果这三件事一开始就混，后面组件会越来越重，模板越来越乱，watch 也会越写越多。

## 适合谁看

- 已经会写一些 Vue 组件，但组合式 API 还没形成稳定口径
- 正在从 React 或旧版 Vue 迁移到 Vue 3
- 页面能跑，但对 `ref`、`reactive`、`computed`、`watch` 的职责还不够清晰

## 学习目标

- 建立 Vue 3 组件、模板和响应式系统的统一模型
- 分清 `ref`、`reactive`、`computed`、`watch`、`watchEffect` 的使用边界
- 掌握 `props`、`emits`、`slots`、`provide/inject` 和 composable 的常见取舍
- 理解 Vue 组件拆分、列表渲染、表单处理和生命周期的稳妥写法

## 快速导航

- [先立住 6 个判断](#先立住-6-个判断)
- [script setup 与单文件组件](#script-setup-与单文件组件)
- [响应式系统：ref、reactive、computed](#响应式系统refreactivecomputed)
- [副作用边界：watch 与 watchEffect](#副作用边界watch-与-watcheffect)
- [组件通信与逻辑复用](#组件通信与逻辑复用)
- [模板、列表与表单](#模板列表与表单)
- [生命周期与工程建议](#生命周期与工程建议)

## 先立住 6 个判断

### 1. 默认优先 `script setup`

Vue 3 官方文档把 `<script setup>` 作为组合式 API 最顺手的入口。它更贴近现代 Vue 写法，样板更少，也更适合把相关逻辑收在一起。

### 2. 单值或简单状态优先 `ref`

最常见场景：

- 数字、字符串、布尔值
- 当前选中项
- 输入值
- 加载态

### 3. 一组相关字段可以用 `reactive`

适合：

- 表单对象
- 查询条件对象
- 一组强相关配置

但不要因为“看起来像对象”就一股脑全塞进去。过大的 `reactive` 对象会让依赖关系变得不清晰。

### 4. 派生值优先 `computed`

如果一个值本质是从其他响应式状态推出来的，不要再手动维护一份副本。

适合：

- 过滤结果
- 排序结果
- 展示文案
- 校验状态

### 5. `watch` 只做副作用

例如：

- 发请求
- 同步外部系统
- 记录日志
- 执行清理和取消

不适合：

- 本地派生值计算
- “监听 A 再同步到 B”的重复状态维护

### 6. 逻辑复用优先 composable，不要堆 mixin 式思维

Vue 3 官方推荐用 composable 复用状态和逻辑。页面里重复出现的请求、分页、筛选、表单、订阅等逻辑，适合抽到 `useXxx`。

## script setup 与单文件组件

一个现代 Vue 3 组件，通常会按下面结构组织：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  title: string
  count?: number
}>()

const emit = defineEmits<{
  submit: [value: string]
}>()

const keyword = ref('')
const normalizedTitle = computed(() => props.title.trim())

function handleSubmit() {
  emit('submit', keyword.value)
}
</script>

<template>
  <section>
    <h2>{{ normalizedTitle }}</h2>
    <input v-model="keyword" />
    <button @click="handleSubmit">提交</button>
  </section>
</template>
```

工程上更稳的做法通常是：

- `props` 和 `emits` 放顶部
- 响应式状态和 `computed` 放中间
- 事件处理函数和副作用放后面
- 模板只负责表达，不把复杂逻辑塞进插值

## 响应式系统：ref、reactive、computed

### `ref`

特点：

- 在脚本里通过 `.value` 读写
- 在模板里自动解包
- 适合简单值，也能包对象

### `reactive`

特点：

- 返回响应式代理对象
- 适合一组相关字段
- 直接解构时需要格外小心响应性丢失

### `computed`

适合表达“值之间的关系”，而不是“事件之后的动作”。

```vue
<script setup>
import { reactive, computed } from 'vue'

const form = reactive({
  firstName: 'Ada',
  lastName: 'Lovelace',
})

const fullName = computed(() => `${form.firstName} ${form.lastName}`)
</script>
```

如果只是每次渲染都能直接算出来，而且不需要缓存，也可以保留为普通函数；但只要它表达的是明确的派生状态，`computed` 通常更清晰。

## 副作用边界：watch 与 watchEffect

### `watch`

适合：

- 你明确知道要监听哪个源
- 需要拿到新旧值
- 需要控制 `immediate`、`deep`、`once` 等选项

### `watchEffect`

适合：

- 想让 Vue 自动追踪依赖
- 效果依赖不止一个响应式源
- 更像“把这段副作用和当前依赖绑定起来”

### 一个务实判断

- 有明确源，用 `watch`
- 依赖自然收集，用 `watchEffect`
- 只是派生值，不要 watch

```vue
<script setup>
import { ref, watch } from 'vue'

const question = ref('')
const answer = ref('Questions usually contain a question mark.')

watch(question, async (value) => {
  if (!value.includes('?')) return
  answer.value = 'Thinking...'
  const res = await fetch('https://yesno.wtf/api')
  answer.value = (await res.json()).answer
})
</script>
```

如果 watch 里有请求、订阅、定时器，别忘了清理和取消。

## 组件通信与逻辑复用

### 1. 父传子：`props`

最基础，也最清晰。props 仍然是一条单向数据流，不要在子组件里直接改它。

### 2. 子传父：`emits`

Vue 的标准模式是：

- 父组件持有状态
- 子组件通过事件通知变化

### 3. 组件布局和插槽：`slots`

当一个组件想决定“壳子”，但把局部内容交给外部提供时，优先考虑插槽，而不是传一堆布尔开关。

### 4. 深层共享：`provide` / `inject`

适合：

- 表单上下文
- 主题、语言、只读模式
- 一小组深层共享能力

不适合：

- 把整个页面所有状态都塞进去

### 5. 逻辑复用：composable

适合抽成 `useXxx` 的信号：

- 分页与筛选
- 请求加载状态
- 表单提交
- 滚动、订阅、计时器

## 模板、列表与表单

### 列表一定要有稳定 `key`

不要把 `index` 当默认值。插入、删除、排序后，它会导致组件实例和局部状态错位。

### `v-if` 和 `v-show` 的取舍

- `v-if`：真的需要条件创建 / 销毁时用
- `v-show`：只是在显示和隐藏之间切换，且切换频繁时用

### 表单处理

Vue 的 `v-model` 很顺手，但工程上仍要注意：

- 复杂表单不要把所有逻辑都塞模板
- 校验结果优先做成 `computed`
- 提交、副作用、联动请求再用 `watch` 或事件处理函数

## 生命周期与工程建议

Vue 3 生命周期更适合围绕“副作用何时建立、何时清理”来理解：

- `onMounted`：依赖真实 DOM 或只想在挂载后做一次的副作用
- `onUnmounted`：清理订阅、监听器、定时器

工程上更稳的顺序通常是：

1. 先把状态结构设计干净
2. 再决定哪些值是 `computed`
3. 再决定是否真的需要 `watch`
4. 最后抽 composable 和拆组件

## 关联阅读

- [Vue 专题](./index.md)
- [Vue 高频问题：响应式、组件通信与模板陷阱排错清单](./common-questions.md)
- [Vue 性能优化指南：更新机制、异步组件与列表性能](./performance-optimization.md)
- [Vue 官方文档](https://vuejs.org/guide/introduction.html)
