# 英语词汇卡片功能实施计划

## 需求重述

在每篇文章底部展示文章中出现的英语关键词，包含:
- 单词本身
- 音标 (phonetic transcription)
- 中文释义
- 点击发音功能 (Web Speech API)

## 实现方案

### 方案选择: Frontmatter + Vue 组件 + Layout 自动注入

**为什么不选自动提取?** 自动从文章中提取英文单词会非常嘈杂（代码术语、专有名词、常见介词等都会被提取），质量无法保证。手动策划的词汇列表更有学习价值。

### 实现步骤

#### Phase 1: 创建 VocabularyCard.vue 组件

**文件**: `docs/.vitepress/theme/components/VocabularyCard.vue`

功能:
- 接收词汇列表 (从 frontmatter 读取)
- 展示: 单词 | 音标 | 中文释义 | 发音按钮
- 点击发音按钮使用 **Web Speech API (SpeechSynthesis)** 朗读单词 — 零依赖，浏览器原生支持
- 如果 frontmatter 中未提供音标，通过 **Free Dictionary API** (`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`) 自动获取，结果缓存到 localStorage
- 卡片样式与站点现有设计系统一致 (暖棕色调)
- 支持 light/dark 主题

数据格式 (frontmatter):
```yaml
vocabulary:
  - word: "concurrency"
    meaning: "并发"
  - word: "goroutine"
    meaning: "Go 协程"
    phonetic: "/ɡoʊruːˈtiːn/"   # 可选，不提供则自动获取
```

#### Phase 2: 在 Layout 中自动注入组件

**文件**: `docs/.vitepress/theme/index.ts`

- 创建一个 Layout wrapper 组件，在文章内容后 (`doc-after` slot) 自动渲染 VocabularyCard
- 只在 frontmatter 包含 `vocabulary` 字段时显示
- 无需修改任何现有文章 — 只有添加了 vocabulary 字段的文章才会展示

#### Phase 3: 添加样式

**文件**: `docs/.vitepress/theme/custom.css`

- 词汇卡片区域样式
- 响应式布局 (桌面端 2-3 列网格，移动端单列)
- 发音按钮动画效果
- 与现有设计 token 一致

#### Phase 4: 为 2-3 篇示例文章添加词汇

选取几篇典型文章添加 vocabulary frontmatter 数据作为演示:
- `docs/golang/golang-advanced-learning-guide.md`
- `docs/architecture/case-studies/high-concurrency-payment-system-practice-notes.md`

## 技术细节

### 发音方案: Web Speech API
```js
const speak = (word) => {
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.8
  speechSynthesis.speak(utterance)
}
```
- 浏览器原生支持，零依赖
- 兼容性: Chrome, Firefox, Safari, Edge 全部支持

### 音标获取: Free Dictionary API
- 地址: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- 免费，无需 API key
- 结果缓存到 localStorage 避免重复请求
- 如果 frontmatter 已提供 phonetic 则跳过 API 调用

### 不需要新增依赖
- 全部使用浏览器原生 API + Vue 3 Composition API
- 无需安装任何 npm 包

## 风险评估

- **低风险**: Web Speech API 在极少数旧浏览器上不支持 → 优雅降级，隐藏发音按钮
- **低风险**: Free Dictionary API 偶尔不可用 → 音标显示 fallback 为空，不影响其他功能
- **无风险**: 不修改现有文章，纯增量功能

## 复杂度: 低-中

涉及文件:
1. 新建 `VocabularyCard.vue` (核心组件)
2. 修改 `index.ts` (注册组件 + Layout slot)
3. 修改 `custom.css` (样式)
4. 修改 2-3 篇 .md 文章 (添加示例数据)
