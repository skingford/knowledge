# Plan: 并发编程主题补充 SVG 图例

## Context

并发编程 5 篇指南目前使用 Mermaid 图和文字描述，需改为 inline SVG + CSS 变量（`var(--d-*)`）风格，与 MySQL 45 讲和刚完成的 Slice/Map/Channel 图例保持一致。

当前 Mermaid 图会**替换为 SVG**；纯文字描述的核心概念会**新增 SVG**。

## 修改文件与图例清单（5 个文件，共 12 张图）

### 文件 1: `03-goroutine-and-scheduler.md`（3 张）

| # | 图名 | 插入/替换位置 | 内容 |
|---|---|---|---|
| 图1 | Goroutine 状态机 | §1 生命周期描述后，替换现有 Mermaid stateDiagram | 四个状态节点（Runnable/Running/Waiting/Dead）+ 转换箭头 + 触发条件标注 |
| 图2 | GMP 调度模型 | §2 角色定义后，替换现有 Mermaid flowchart | 全局队列 + P0~P2 各带本地队列 + M0~M2 + G 在各处流转，颜色区分 G/M/P |
| 图3 | Work Stealing | §2 Work Stealing 说明后，替换现有文字描述 | 两个 P，P1 本地队列空 → 从 P0 偷取一半 G，虚线箭头 |

### 文件 2: `03-channel-select-context.md`（3 张）

| # | 图名 | 插入/替换位置 | 内容 |
|---|---|---|---|
| 图4 | 无缓冲 vs 有缓冲 Channel | §3 开头对比说明后，替换 Mermaid sequenceDiagram | 左右并排：无缓冲（sender↔receiver 直接握手）、有缓冲（sender→buf→receiver） |
| 图5 | Pipeline 模式 | §3 Pipeline 段落后，替换 Mermaid flowchart | gen → square → print 三级流水线，每级一个 goroutine + channel 连接 |
| 图6 | Context 取消传播树 | §5 传播链说明后，替换 Mermaid flowchart | 树状结构：Background → WithTimeout(API) → WithCancel(DB) + WithCancel(Cache)，cancel 波及子树 |

### 文件 3: `03-sync-primitives.md`（2 张）

| # | 图名 | 插入/替换位置 | 内容 |
|---|---|---|---|
| 图7 | Mutex vs RWMutex 对比 | §6 对比说明后，新增 | 左：Mutex（所有操作串行）、右：RWMutex（多读并行，写独占），用时间线展示 |
| 图8 | 同步原语选择决策树 | 文末决策树段落，替换 Mermaid flowchart | 判断节点（是否只读？原子够用？需要等待？）→ 叶节点（Atomic/Mutex/RWMutex/Channel/WaitGroup/sync.Map） |

### 文件 4: `03-goroutine-leak-and-data-race.md`（2 张）

| # | 图名 | 插入/替换位置 | 内容 |
|---|---|---|---|
| 图9 | 三种泄漏场景 | §10 三种原因说明后，替换 Mermaid flowchart | 三列：发送阻塞（无接收者）、接收阻塞（无发送者）、死循环，每列一个 goroutine 图标 + 红色 blocked 标记 |
| 图10 | Data Race 示意图 | §11 竞态说明后，新增 | 两个 goroutine 同时读写同一个 counter 变量，用时间线展示 read-modify-write 交叉导致丢失更新 |

### 文件 5: `03-advanced-concurrency-patterns.md`（2 张）

| # | 图名 | 插入/替换位置 | 内容 |
|---|---|---|---|
| 图11 | Worker Pool 架构 | §4 Worker Pool 模式开头，新增 | 左：Task Channel（队列）→ 中：Worker 1~N → 右：Result Channel，标注 Submit/Process/Collect |
| 图12 | Fan-Out / Fan-In | §7 进阶段落开头，替换 Mermaid flowchart（如有） | 上：1 个 source → 中：N 个 worker → 下：1 个 merged output，扇形展开再收拢 |

## Implementation Phases

### Phase 1: `03-goroutine-and-scheduler.md`（图1-3）
- 替换 Mermaid stateDiagram → SVG 状态机
- 替换 GMP Mermaid flowchart → SVG 架构图
- 替换 Work Stealing 文字 → SVG 示意图

### Phase 2: `03-channel-select-context.md`（图4-6）
- 替换 Channel 对比 Mermaid → SVG 并排对比
- 替换 Pipeline Mermaid → SVG 流水线
- 替换 Context 传播 Mermaid → SVG 树

### Phase 3: `03-sync-primitives.md`（图7-8）
- 新增 Mutex vs RWMutex SVG 对比
- 替换决策树 Mermaid → SVG

### Phase 4: `03-goroutine-leak-and-data-race.md`（图9-10）
- 替换泄漏场景 Mermaid → SVG 三列图
- 新增 Data Race 时间线 SVG

### Phase 5: `03-advanced-concurrency-patterns.md`（图11-12）
- 新增 Worker Pool SVG
- 新增/替换 Fan-Out/Fan-In SVG

### Phase 6: Build & Verify
- `npm run docs:build`

## Risks

- **MEDIUM**: 12 张图工作量较大，SVG 代码总量约 1500-2500 行
- **LOW**: 替换 Mermaid 时需确保不丢失原有信息
- **LOW**: 部分图（GMP、Worker Pool）结构较复杂，需合理控制 viewBox 尺寸

## Estimated Complexity: HIGH
- 5 个文件，12 张 SVG
- 每张约 80-150 行 SVG
- 总新增约 1500-2000 行
