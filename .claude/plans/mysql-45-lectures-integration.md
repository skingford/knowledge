# Implementation Plan: Integrate MySQL 45 Lectures into Knowledge Base

## Requirements Restatement

Integrate content from "极客时间 - MySQL实战45讲" (林晓斌/丁奇) HTML files located at `/Users/kingford/Documents/极客时间-MySQL实战45讲/` into the MySQL topic of the VitePress knowledge base.

**Source**: 48 HTML files (45 lectures + opening + ending + live review), some with duplicate filenames containing ad watermarks.

**Target**: VitePress knowledge base at `/Users/kingford/workspace/github.com/knowledge/docs/`

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| HTML content extraction quality (images, code blocks, tables) | HIGH | Use pandoc + post-processing script; sample-validate first 3 files before batch |
| Duplicate files (same lecture with/without ad text in filename) | MEDIUM | Select clean filenames, skip duplicates |
| Content volume overwhelming sidebar navigation | MEDIUM | Group 45 lectures into 6-7 thematic sections with collapsible sidebar |
| Cross-linking with existing MySQL payment content | LOW | Add bidirectional links in index pages |
| Copyright/attribution | LOW | Add proper attribution to 极客时间/林晓斌 in index page |

---

## Architecture Decision: Where to Place

**Option A (Recommended)**: Create a new top-level section `docs/mysql/` as a dedicated MySQL direction, similar to how AI, Golang, Architecture are separate sections.

- Pros: Clean separation, scalable, won't clutter architecture section
- Cons: Needs new section config in content-data.ts

**Option B**: Add under `docs/architecture/mysql-45/` as a subsection of architecture.

- Pros: Keeps architecture as the parent for all DB topics
- Cons: Architecture sidebar becomes very long, MySQL 45 lectures is its own complete course

**Decision**: Go with **Option A** — new `docs/mysql/` section.

---

## Implementation Phases

### Phase 1: Content Extraction & Cleanup Script
**Files**: Create a Node.js/Python script to batch-convert HTML → Markdown

1. List all HTML files, deduplicate (prefer filenames without ad watermarks)
2. For each HTML file:
   - Extract article body (the `<div class="article-content">` or similar container)
   - Convert to Markdown using `pandoc` or `turndown`
   - Clean up: remove ad watermarks, fix image references, preserve code blocks
   - Add VitePress frontmatter (title, description)
   - Name output file as `XX-slug.md` (e.g., `01-sql-query-execution.md`)
3. Validate output quality on 3 sample files before batch

### Phase 2: Directory & File Structure
**Target structure**:
```
docs/mysql/
├── index.md                          # Section landing page / overview
├── 01-sql-query-execution.md         # 01.基础架构
├── 02-sql-update-execution.md        # 02.日志系统
├── 03-transaction-isolation.md       # 03.事务隔离
├── ...
├── 45-auto-increment-id-overflow.md  # 45.自增id用完
└── appendix.md                       # 结束语 + 直播回顾 (optional)
```

### Phase 3: Thematic Grouping for Sidebar
Group the 45 lectures into collapsible sidebar sections:

| Group | Lectures | Theme |
|-------|----------|-------|
| 基础架构篇 | 01-02 | SQL 执行流程、日志系统 |
| 索引篇 | 03-11, 15 | 事务隔离、索引原理、索引选择、字符串索引 |
| 锁与事务篇 | 06-08, 19-21, 30 | 全局锁、表锁、行锁、幻读、加锁规则 |
| 日志与可靠性篇 | 12-13, 23 | flush、数据页、数据不丢 |
| SQL 优化篇 | 14, 16-18, 33-37 | count、order by、随机消息、join、临时表 |
| 高可用篇 | 22, 24-29, 31-32 | 主备一致、高可用、读写分离、误删恢复 |
| 引擎与进阶篇 | 38-45, 44 | Memory引擎、自增主键、insert锁、分区表、grant |

### Phase 4: VitePress Configuration
**File**: `docs/.vitepress/theme/content-data.ts`

1. Add new `SectionConfig` for `mysql` section
2. Configure sidebar with thematic groups (collapsed by default)
3. Add landing page content
4. Wire into navigation

### Phase 5: Index Page & Cross-linking
1. Create `docs/mysql/index.md` with:
   - Course overview and attribution
   - Reading order recommendation
   - Thematic grouping links
   - Cross-links to existing payment MySQL content
2. Add cross-links from `high-concurrency-payment-mysql.md` → new MySQL section
3. Update architecture case-studies index if needed

### Phase 6: Validation
1. Run `npm run dev` to verify all pages render correctly
2. Check sidebar navigation
3. Spot-check 5+ articles for content quality (code blocks, formatting)
4. Verify cross-links work

---

## Estimated Complexity: HIGH

- Phase 1 (Script): Main effort — HTML parsing and Markdown cleanup
- Phase 2-3 (Structure): Straightforward file organization
- Phase 4 (Config): Moderate — follows existing patterns in content-data.ts
- Phase 5-6 (Polish): Light cleanup and validation

---

## Dependencies

- `pandoc` (for HTML → Markdown conversion) — check if installed, or use JS-based alternative
- Existing VitePress dev server for validation

---

**WAITING FOR CONFIRMATION**: Proceed with this plan? Any preferences on:
1. Option A (new `docs/mysql/` section) vs Option B (under architecture)?
2. Keep all 45 lectures as individual files, or merge smaller ones?
3. Any specific lectures to prioritize or skip?
