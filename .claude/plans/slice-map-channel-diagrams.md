# Plan: Slice、Map、Channel 底层实现 — 补充图例

## Requirements Restatement

为 `docs/golang/guide/02-slice-map-channel-internals.md` 添加结构图（inline SVG），风格与 MySQL 45 讲保持一致：
- 使用 inline SVG + CSS 变量 (`var(--d-*)`) 适配 light/dark 主题
- 外层包裹 `<div style="display:flex;justify-content:center;padding:20px 0;">`
- 每张图带标题（如"图1 SliceHeader 与底层数组"）
- 颜色使用已有 CSS 变量：`--d-blue-bg/border`、`--d-orange`、`--d-green`、`--d-cur-*`、`--d-warn-*` 等
- 箭头使用 SVG `<marker>` + `<defs>`

## Diagrams to Add (5 张)

### 图1：SliceHeader 与底层数组
- 位置：第1节 "Slice 底层结构与扩容机制" 文字说明之后、代码块之前（line 26 后）
- 内容：
  - 左侧：SliceHeader 结构体框（Data 指针、Len=3、Cap=5）
  - 右侧：底层数组 5 格，前 3 格蓝色高亮（已用），后 2 格灰色（未用空间）
  - Data 指针箭头 → 数组起始位置
  - 标注 Len 覆盖范围和 Cap 覆盖范围

### 图2：Slice 共享底层数组陷阱
- 位置：图1 之后（仍在代码块之前）
- 内容：
  - 顶部：原始数组 `[1,2,3,4,5]`
  - 左下：`a` 的 SliceHeader 指向整个数组
  - 右下：`b := a[1:3]` 的 SliceHeader 指向同一数组的偏移位置
  - 高亮 b 覆盖的 `[2,3]` 区域为 orange，说明修改 b 会影响 a

### 图3：Map hmap 结构与桶
- 位置：第2节 "Map 底层实现原理" 文字说明之后、代码块之前（line 82 后）
- 内容：
  - 左侧：hmap 结构体（count、B、buckets 指针、oldbuckets 指针、hash0）
  - 右侧：buckets 数组（2^B 个桶），每个桶展示 tophash[8] + key-value 对
  - 一个桶有 overflow 指针 → 溢出桶
  - 标注"低位定位桶"和"高8位 tophash 快速比对"

### 图4：Map 渐进式扩容搬迁
- 位置：图3 之后
- 内容：
  - 左侧：oldbuckets（旧桶数组，部分灰色表示已搬迁）
  - 右侧：buckets（新桶数组，2倍大小）
  - 搬迁箭头从旧桶 → 新桶
  - 标注"每次写操作搬迁 1-2 个旧桶"

### 图5：Channel hchan 结构与收发流程
- 位置：第3节 "Channel 底层实现" 文字说明之后、代码块之前（line 148 后）
- 内容：
  - 中间：hchan 结构体（buf 环形缓冲区、sendx/recvx 索引、lock）
  - 左侧：sendq 队列（sudog 链表，阻塞的 sender goroutine）
  - 右侧：recvq 队列（sudog 链表，阻塞的 receiver goroutine）
  - 环形缓冲区用圆弧或方格表示，标注 sendx 和 recvx 位置
  - 三条路径标注：① 直接拷贝给等待者 ② 入队 buf ③ 挂 sendq 阻塞

## Implementation Steps

### Phase 1: 图1 + 图2（Slice 部分）
1. 在 line 26 之后（`多个 Slice 可以共享同一个底层数组` 之后、代码块 `\`\`\`go` 之前）插入图1 和图2 的 SVG

### Phase 2: 图3 + 图4（Map 部分）
2. 在 line 82（`扩容采用渐进式搬迁...避免一次性停顿。` 之后、代码块之前）插入图3 和图4

### Phase 3: 图5（Channel 部分）
3. 在 line 148（`无缓冲 Channel...天然提供同步语义。` 之后、代码块之前）插入图5

### Phase 4: Verify
4. `npm run docs:build` 验证构建通过
5. 本地预览确认图表在 light/dark 主题下均正常显示

## Risks

- **LOW**: SVG viewBox 尺寸需要手动调整以适配不同屏幕宽度（用 `width:100%;height:auto` + `viewBox` 可解决）
- **LOW**: CSS 变量在非 VitePress 环境下不生效（仅影响 raw markdown 预览，正式站点正常）
- **MEDIUM**: 图比较复杂（特别是 Map 桶结构和 Channel 环形缓冲区），SVG 代码量较大，需注意保持可维护性

## Estimated Complexity: MEDIUM
- 5 张 SVG 图，每张约 50-100 行 SVG
- 总新增约 300-500 行
- 仅修改 1 个文件
