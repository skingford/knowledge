# 实施计划：大文件整理优化 & 加载响应速度提升

## 需求重述

对 VitePress 知识库项目进行**大文件拆分整理**和**加载响应速度优化**。当前项目有 587 个 Markdown 文件，总构建产物 141MB。主要瓶颈：

| 瓶颈 | 现状 | 影响 |
|---|---|---|
| 搜索索引 `@localSearchIndexroot` | **4.2 MB** 单文件 JS | 首次搜索时阻塞主线程 |
| `content-data.ts` | **2178 行** 单文件 | 维护困难，修改一处全量重编译 |
| `custom.css` | **1880 行** 单文件 | 样式混杂：布局/组件/图表/微信弹窗/词汇卡片 |
| `K8sDiagram.vue` | **4817 行** 单文件 | 即使已 async，chunk 仍 389KB |
| 超大 Markdown 页面 | Top5 页面 60-110KB 源文件 | 构建出的页面 JS 300-458KB，首屏渲染慢 |
| Mermaid 相关 chunks | treemap 454KB + core 497KB + 多个子图表 | 仅部分页面需要，但 chunk 体积大 |

## 风险评估

| 风险 | 等级 | 应对 |
|---|---|---|
| 拆分 content-data.ts 后导入路径变化导致构建失败 | 🔴 高 | 每步拆分后执行 `docs:build` 验证 |
| CSS 拆分后样式优先级或变量作用域变化 | 🟡 中 | 拆分时保持相同选择器，不改变 import 顺序 |
| 搜索索引优化可能影响搜索质量 | 🟡 中 | 只调参数不改逻辑，优化前后对比搜索结果 |
| 大 Markdown 拆分涉及内容重组 | 🟡 中 | **本次不拆分 Markdown 内容**，只从构建配置侧优化 |
| K8sDiagram 拆分可能破坏组件内部逻辑 | 🟡 中 | 按视觉区块拆分为子组件，保持接口不变 |

## 实施阶段

---

### Phase 1: 拆分 `content-data.ts`（2178 行 → 多文件）

**目标**：将单体配置文件按 section 拆分，降低维护成本和增量编译范围。

**步骤**：
1. 创建 `docs/.vitepress/theme/sections/` 目录
2. 提取公共类型定义到 `sections/types.ts`
3. 按 section key 拆分为独立文件：
   - `sections/ai.ts` — AI / Agent section 配置
   - `sections/architecture.ts` — 架构 section 配置
   - `sections/golang.ts` — Golang section 配置（含 `golangSourceReadingSidebar`）
   - `sections/mysql.ts` — MySQL section 配置
   - `sections/redis.ts` — Redis section 配置
   - `sections/k8s.ts` — K8s section 配置
   - `sections/postgresql.ts` — PostgreSQL section 配置
   - `sections/ops.ts` — 运维 section 配置
   - `sections/git.ts` — Git section 配置
   - `sections/tools.ts` — 工具 section 配置（如有）
4. 在 `sections/index.ts` 中聚合导出 `sections` 数组
5. 将 `homeHighlights`、`homePrinciples`、`homeTracks` 等首页数据提取到 `sections/home.ts`
6. 重构 `content-data.ts` 为只做 re-export 的入口文件（保持对外 API 不变）
7. 验证构建通过

**预计效果**：每个 section 文件 100-200 行，维护时只需修改对应文件。

---

### Phase 2: 拆分 `custom.css`（1880 行 → 多文件）

**目标**：按职责拆分样式，便于维护，减少心智负担。

**步骤**：
1. 创建 `docs/.vitepress/theme/styles/` 目录
2. 按职责拆分：
   - `styles/variables.css` — CSS 变量（light + dark，约 150 行）
   - `styles/base.css` — html/body/selection/focus 等基础样式（约 50 行）
   - `styles/vitepress-overrides.css` — VPNavBar/VPSidebar/VPDoc 等框架覆盖（约 350 行）
   - `styles/home.css` — `.claude-home__*` 首页样式（约 300 行）
   - `styles/section-landing.css` — `.section-landing__*` / `.overview-landing__*`（约 250 行）
   - `styles/wechat-qr.css` — `.wechat-qr-notice__*` 微信二维码弹窗（约 200 行）
   - `styles/vocabulary.css` — `.vocab-*` 词汇卡片样式（约 270 行）
   - `styles/diagrams.css` — `svg.diagram-mysql-*` 等 SVG 图表样式（约 110 行）
3. 将 `custom.css` 改为只做 `@import` 的入口文件
4. 验证构建和样式一致性

**预计效果**：每个文件职责单一，修改图表样式不用在 1880 行里搜索。

---

### Phase 3: 搜索索引优化（4.2 MB → 目标 < 2 MB）

**目标**：缩小本地搜索索引体积，加快首次搜索响应。

**步骤**：
1. 在 `search.ts` 中调整参数：
   - 将 `maxSectionTextLength` 从 `800` 降到 `400`（每个搜索 section 的索引文本量减半）
   - 保持 `maxIndexedHeadingDepth = 1` 不变
2. 在 `config.mts` 的 `srcExclude` 中排除不需要搜索的目录/文件：
   - 添加 `'**/todo-topics.md'`（待补主题页无搜索价值）
3. 验证搜索功能正常，对比索引文件大小

**预计效果**：索引体积减少 30-50%，搜索质量基本无影响。

---

### Phase 4: Vite 构建配置优化

**目标**：通过 Rollup 手动分包策略，优化 chunk 粒度，减少不必要加载。

**步骤**：
1. 在 `vite.ts` 中添加 `build.rollupOptions.output.manualChunks`：
   ```ts
   manualChunks(id) {
     if (id.includes('mermaid')) return 'vendor-mermaid'
     if (id.includes('cytoscape')) return 'vendor-cytoscape'
     if (id.includes('katex')) return 'vendor-katex'
   }
   ```
2. 在 `config.mts` 的 `shouldPreload` 中进一步排除大 chunk 的预加载：
   - 排除 vendor-mermaid、vendor-cytoscape、vendor-katex chunk 的预加载
3. 验证构建产物分包是否符合预期

**预计效果**：首页和普通页面不再预加载 mermaid (497KB)、cytoscape (442KB) 等大 chunk。

---

### Phase 5: K8sDiagram.vue 拆分（4817 行 → 子组件）

**目标**：将超大组件拆分为子组件，减少单 chunk 体积（当前 389KB）。

**步骤**：
1. 阅读 K8sDiagram.vue 结构，识别可拆分的视觉区块
2. 创建 `docs/.vitepress/theme/components/k8s/` 目录
3. 将各区块提取为独立子组件（如 `K8sCore.vue`、`K8sScheduling.vue`、`K8sNetworking.vue` 等）
4. 在 K8sDiagram.vue 中以 `defineAsyncComponent` 按需加载子组件
5. 验证功能和展示一致性

**预计效果**：单 chunk 从 389KB 拆分为多个 50-100KB 的子 chunk，按需加载。

---

## 实施顺序与依赖

```
Phase 1 (content-data 拆分) ──┐
                               ├── Phase 3 (搜索优化) ── Phase 4 (Vite 构建) ── Phase 5 (K8s 拆分)
Phase 2 (CSS 拆分) ───────────┘
```

Phase 1-2 为**代码组织优化**（主要提升维护体验）
Phase 3-5 为**加载性能优化**（主要提升用户体验）

## 不在本次范围

- ❌ 拆分大 Markdown 文件内容（涉及内容重组，需要人工判断章节边界）
- ❌ 更换搜索方案（如 Algolia）
- ❌ CDN / 图片优化（不在当前代码层面）
- ❌ SSR / ISR 配置变更

## 预估复杂度：MEDIUM

- Phase 1: ~1.5h（机械拆分，但需仔细核对导入路径）
- Phase 2: ~1h（纯搬移 CSS，无逻辑变化）
- Phase 3: ~0.5h（改几个参数）
- Phase 4: ~0.5h（加构建配置）
- Phase 5: ~1.5h（需理解组件结构后拆分）
- **总计: ~5h**

---

**等待确认**: 是否按此计划执行？可调整任意阶段的优先级或跳过某些阶段。
