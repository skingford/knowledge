---
title: React 技术指南：组件、状态、Effect 与工程边界
description: 系统整理 React 组件拆分、状态设计、组件通信、Effect 边界、列表与表单处理，建立一套可长期复用的工程判断。
---

# React 技术指南：组件、状态、Effect 与工程边界

React 真正难的部分，通常不是某个 Hook 的名字，而是三个判断：

1. 这段数据到底该不该进 state
2. 这段逻辑到底该不该进 effect
3. 这个组件到底该不该拆、该怎么通信

如果这三件事做错，页面一开始也许能跑，但后面会越来越难改，问题也会越来越像“随机冒出来”。这篇文档的目标，就是把 React 最核心的工程边界整理成一条稳定主线。

## 适合谁看

- 已经会写函数组件和 Hook，但缺少稳定的设计判断
- 经常把派生值、请求、事件逻辑和副作用混在一起
- 页面越来越大后，开始出现 state 分散、组件难拆和调试困难的问题

## 学习目标

- 建立组件拆分、数据流和状态归属的统一判断
- 分清 `state`、`ref`、普通变量和派生值各自的职责
- 理解 effect 的真正边界，减少不必要的副作用代码
- 掌握列表、表单和组件通信这些高频场景的稳妥写法

## 快速导航

- [先建立 6 个核心判断](#先建立-6-个核心判断)
- [组件拆分与数据流](#组件拆分与数据流)
- [状态设计：先少、再准、再局部](#状态设计先少再准再局部)
- [组件通信：props、提升、context、reducer 怎么选](#组件通信props提升contextreducer-怎么选)
- [Effect 的边界：只为同步外部系统](#effect-的边界只为同步外部系统)
- [列表、条件渲染与表单](#列表条件渲染与表单)
- [渲染与提交流程](#渲染与提交流程)
- [一套务实的工程落地建议](#一套务实的工程落地建议)

## 先建立 6 个核心判断

### 1. 能在渲染阶段直接算出来的值，不要再存一份 state

典型例子：

- `fullName = firstName + ' ' + lastName`
- `visibleTodos = todos.filter(...)`
- `isEmpty = list.length === 0`

这些值如果再单独进 state，后面就得处理同步问题。React 官方文档一直强调，优先保留“最小状态”，把派生值留在渲染阶段计算。

```tsx
function Profile({ firstName, lastName }: { firstName: string; lastName: string }) {
  const fullName = `${firstName} ${lastName}`
  return <h1>{fullName}</h1>
}
```

### 2. 事件导致的业务逻辑，优先写在事件处理函数里，不要绕一圈放到 effect

例如：

- 点击按钮后提交表单
- 输入变化后本地校验
- 选择标签后切换页签

这些都是用户动作驱动，不是“渲染后要和外部系统同步”的问题。把它们放进 effect，常常会引出依赖数组、重复执行和状态回滚等连锁问题。

### 3. Effect 只负责“把 React 世界和外部系统对齐”

适合进 effect 的场景通常是：

- 发起网络订阅或建立连接
- 订阅浏览器事件
- 操作 DOM API
- 和第三方组件、图表、播放器同步

不适合进 effect 的场景通常是：

- 派生数据
- 响应用户点击后直接执行业务逻辑
- 仅仅为了同步两个 state

### 4. State 尽量放近使用它的地方

很多 React 性能和复杂度问题，本质不是“没加缓存”，而是把 state 提得太高。只在局部用到的 state，应尽量局部保存，不要为了“以后可能会用到”提前上提。

### 5. 单一事实来源比“看起来方便”更重要

同一份业务事实最好只有一个权威来源。比如：

- 当前输入值要么由父组件控制，要么由子组件自己控制
- 当前选中项要么来自 URL，要么来自页面 state
- 当前表单默认值不要既在 props 里又在本地 state 里各存一份

### 6. 先把组件写纯，再谈缓存和优化

如果一个组件在相同输入下输出不稳定，或者内部偷偷改对象、改数组、读写外部变量，后面再加 `memo`、`useMemo`、`useCallback` 都只是把问题藏起来。

## 组件拆分与数据流

React 最稳的主线仍然是：

- 数据从上往下传
- 事件从下往上传
- 父组件负责拥有共享状态
- 子组件尽量只关心展示和局部交互

### 一个务实的拆分标准

可以按下面四种职责拆：

- 页面容器：拿数据、拼装状态、做路由级协调
- 领域组件：承载一块明确业务，例如筛选区、商品卡片列表、结算面板
- 通用组件：按钮、输入框、弹层、表格壳子
- 纯展示组件：只根据 props 渲染，不持有业务状态

### Props 不是“麻烦”，而是边界

很多人一开始想绕过 props drilling，于是过早使用 Context。但 props 传递本身恰恰是在表达依赖关系。

只有当下面两种情况出现时，才更适合升级为 Context：

- 很多中间层只是“转发”
- 一组状态和更新函数要被深层多个分支共同消费

## 状态设计：先少、再准、再局部

### 先区分四种“值”

#### 1. 普通变量

每次渲染都会重新计算，不会触发重新渲染。

适合：

- 临时中间值
- 渲染内拼接结果

#### 2. State

会跨渲染保留，并在更新后触发重新渲染。

适合：

- 影响界面的交互状态
- 用户输入
- 请求结果
- 展开收起、选中态、加载态

#### 3. Ref

会跨渲染保留，但更新它不会触发重新渲染。

适合：

- DOM 引用
- 定时器 ID
- 上一次值
- 不影响 UI 的可变值

#### 4. 派生值

根据 props 或 state 直接计算得到。

适合：

- 过滤结果
- 排序结果
- 聚合结果
- 展示文案

### 保持不可变更新

对象和数组更新时，不要直接改原值，而是创建新值。这样 React 才更容易判断变化，也更符合组件纯函数思路。

```tsx
type Todo = { id: number; title: string; done: boolean }

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])

  function toggleTodo(id: number) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    )
  }

  return null
}
```

### 什么时候从 `useState` 升级到 `useReducer`

当你同时出现下面几种信号时，可以考虑 `useReducer`：

- 一个页面有很多相关 state，更新规则分散
- 同一块状态会被多个事件修改
- 更新逻辑已经开始出现“先判断，再组合，再回滚”的分支
- 你想把“状态变化规则”从组件里抽离出来

经验上：

- 简单输入、开关、局部选择态，用 `useState`
- 复杂表单、编辑器、任务流、购物车，用 `useReducer`

## 组件通信：props、提升、Context、Reducer 怎么选

### 1. 父子之间，优先 props

这是最清晰、最容易追踪的方式。

### 2. 多个兄弟组件共享状态，用状态提升

把共享状态提到最近公共父组件，让兄弟组件都从它读。

### 3. 深层共享但更新逻辑不复杂，用 Context

典型场景：

- 当前主题
- 当前登录用户
- 表单只读模式
- 国际化配置

### 4. 深层共享且更新逻辑复杂，用 Context + Reducer

例如复杂任务看板、表单编辑器、购物车。把 state 和 dispatch 分开提供，比一层层传回调更稳。

```tsx
type Task = { id: number; text: string; done: boolean }
type Action =
  | { type: 'added'; id: number; text: string }
  | { type: 'changed'; task: Task }
  | { type: 'deleted'; id: number }

function tasksReducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'added':
      return [...tasks, { id: action.id, text: action.text, done: false }]
    case 'changed':
      return tasks.map((task) => (task.id === action.task.id ? action.task : task))
    case 'deleted':
      return tasks.filter((task) => task.id !== action.id)
  }
}
```

## Effect 的边界：只为同步外部系统

官方文档对 effect 的建议非常明确：如果不是在同步外部系统，通常不需要 effect。

### 适合写 effect 的情况

- 组件挂载后订阅外部事件
- 监听某个值后发起请求或取消请求
- 渲染后把值同步到图表、播放器、地图等非 React 控件
- 注册和清理定时器、`resize`、`visibilitychange` 等浏览器事件

### 不该写 effect 的情况

- 计算派生数据
- 在 effect 里根据 props 再 `setState`
- 在 effect 里处理按钮点击后的业务流程
- 在 effect 里“监听 A 再同步到 B”，结果维护两份状态

### 一个常见反模式

```tsx
function UserCard({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    setFullName(`${firstName} ${lastName}`)
  }, [firstName, lastName])

  return <h1>{fullName}</h1>
}
```

这里 `fullName` 完全可以在渲染阶段计算，不需要额外的 state 和 effect。

### 清理逻辑必须和 setup 成对出现

如果 effect 里创建了连接、订阅、监听器、定时器，就应该返回清理函数。这样组件卸载或依赖变更时，资源才能正确回收。

## 列表、条件渲染与表单

### 列表的核心是稳定 key

`key` 不是给 React “消除警告”用的，而是告诉 React：这一项在前后两次渲染里是不是同一个实体。

优先使用：

- 数据库 ID
- 后端返回的稳定唯一 ID
- 本地创建时生成的稳定 ID

尽量避免：

- `index`
- `Math.random()`
- 每次渲染都重新生成的临时值

### 条件渲染要意识到“位置决定 state”

React 会根据组件在树里的位置保存 state。看起来是“同一个组件”，只要位置变了，state 也可能跟着重置；反过来，看起来“切换了内容”，如果位置没变，state 可能继续沿用。

### 表单先分清受控和非受控

受控组件：

- 值由 React state 驱动
- 适合复杂表单、联动校验、提交前统一处理

非受控组件：

- 值主要留在 DOM
- 适合简单表单、一次性获取输入、和第三方库集成

默认建议：

- 复杂业务表单优先受控
- 文件上传、部分低频输入、富文本编辑器可考虑非受控或半受控

## 渲染与提交流程

理解 React 的性能和行为，至少要分清两个阶段：

### 1. Render

React 调用组件函数，计算新的 UI 结果。

这个阶段应该保持纯净：

- 不修改外部变量
- 不直接操作 DOM
- 不发请求
- 不做需要清理的副作用

### 2. Commit

React 把变化提交到真实 DOM，并在必要时运行 effect。

很多“为什么 effect 晚一点才执行”的问题，本质上都和这两个阶段有关。

## 一套务实的工程落地建议

### 1. 页面 state 先按作用域分层

- 路由级：URL、筛选参数、分页
- 页面级：请求结果、全局加载态、弹层开关
- 区块级：局部表单、折叠、排序方式
- 行级：hover、编辑态、输入草稿

### 2. 先让数据结构干净，再考虑组件怎么拆

很多“组件不好拆”的根源，其实是 state 本身已经重复、混乱或来源不清。

### 3. effect 数量越少，后续越稳

如果一个页面里 effect 越来越多，优先复查：

- 有没有派生 state
- 有没有把事件逻辑放错地方
- 有没有为了“自动同步”而维护两份真相

### 4. Context 不要一股脑塞所有东西

Context value 变化会让消费它的组件重新读取。实践上更稳的做法通常是：

- 按主题拆多个 Context
- 尽量避免把高频变化的大对象整包塞进去
- 复杂更新逻辑搭配 reducer，避免到处散落匿名回调

### 5. 性能优化从结构开始，而不是从缓存开始

先优化：

- state 位置
- effect 设计
- key 稳定性
- 列表拆分
- 组件纯度

再考虑：

- `memo`
- `useMemo`
- `useCallback`

## 练习建议

- 用一个 Todo 或任务看板练习状态提升、不可变更新和 Context + Reducer
- 用一个筛选列表练习派生值、稳定 key、局部 state 和列表拆分
- 用一个多步骤表单练习受控输入、草稿保存、状态重置和组件复用

## 关联阅读

- [React 高频问题：渲染、状态与副作用排错清单](./react-common-questions.md)
- [React 性能优化指南：渲染分析、列表性能与稳定性优化](./react-performance-optimization.md)
- [React 官方学习文档](https://react.dev/learn)
