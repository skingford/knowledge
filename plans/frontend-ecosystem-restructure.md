# 前端生态重组计划

## 需求重述

1. **导航分组**：将"编程语言"下拉菜单从扁平列表改为按**后端**和**前端**分类
2. **公共生态抽离**：将 Vite、Axios、Alova 等跨框架通用工具从 Vue 目录提取到一个独立的"前端公共生态"章节

---

## 现状分析

### 当前导航结构
```
编程语言 ▼
  Golang | Rust | Python | Node.js | React | Vue | Svelte
```

### 当前生态工具归属
| 工具 | 当前位置 | 是否框架通用 |
|------|---------|------------|
| vite-build-and-env-guide.md | Vue | 是（Vite 支持所有前端框架） |
| vite-plugin-vue-guide.md | Vue | 否（Vue 专属插件） |
| axios-http-client-guide.md | Vue | 是（Axios 框架无关） |
| alova-request-strategy-guide.md | Vue | 是（Alova 支持 React/Vue/Svelte） |
| pinia-state-management-guide.md | Vue | 否（Vue 专属状态管理） |

**问题**：三篇通用工具文章虽然内容本身有价值，但标题和上下文都写的是"Vue 项目里"，框架耦合较深。

---

## 计划

### Phase 1：重组导航菜单

修改 `config.mts`，将"编程语言"下拉菜单改为分组展示：

```
编程语言 ▼
  ── 后端 ──
  Golang
  Rust
  Python
  Node.js
  ── 前端 ──
  React
  Vue
  Svelte
  前端公共生态
```

VitePress nav 支持 items 内嵌带 text 的分组头，无需拆成两个菜单。

**改动文件**：`docs/.vitepress/config.mts`（1 处）

### Phase 2：创建前端公共生态章节

1. 创建 `docs/frontend-ecosystem/` 目录
2. 创建 section 配置文件 `sections/frontend-ecosystem.ts`
3. 在 `sections/index.ts` 注册新 section
4. 创建 `docs/frontend-ecosystem/index.md` 入口页

**新文章列表**（从 Vue 迁移并改写为框架无关版本）：

| 文件名 | 标题 | 说明 |
|--------|------|------|
| `vite-build-and-env-guide.md` | Vite 构建与工程化指南 | 去掉 Vue 耦合，补充 React/Svelte 差异 |
| `axios-http-client-guide.md` | Axios HTTP 客户端指南 | 去掉 Vue 限定，强调框架无关用法 |
| `alova-request-strategy-guide.md` | Alova 请求策略指南 | 去掉 Vue 限定，展示多框架 statesHook |

注意：`vite-plugin-vue-guide.md` 和 `pinia-state-management-guide.md` 保留在 Vue 目录（它们确实是 Vue 专属）。

### Phase 3：处理 Vue 目录的原文章

**方案**：将 Vue 下的 3 篇文章（vite、axios、alova）替换为简短的**引导页**，指向公共生态章节，避免内容重复。

同时更新 Vue section 的 sidebar 配置：
- "生态工具"分组中移除 vite/axios/alova，改为链接到公共生态
- 保留 vite-plugin-vue 和 pinia

### Phase 4：更新 home.ts 和相关入口

- 在 `home.ts` 的 `homeTracks` 和 `learningOverviewTracks` 中添加前端公共生态条目

---

## 风险与应对

| 风险 | 级别 | 应对 |
|------|------|------|
| 现有 Vue 文章链接会 break | 中 | 保留原文件路径作为引导页，不删除 |
| 新文章需要重写而非简单搬运 | 中 | 保留核心内容结构，只修改框架限定语境 |
| 导航分组展示效果可能不理想 | 低 | VitePress 默认支持，先实现再调整 |

---

## 复杂度评估

- **导航重组**：低（config.mts 一处修改）
- **新 section 创建**：中（配置 + 入口页 + 3 篇文章改写）
- **Vue 目录清理**：低（sidebar 配置调整 + 引导页）
- **整体**：中

**等待确认后执行。**
