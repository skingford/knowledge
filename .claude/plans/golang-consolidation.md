# Golang Section Consolidation Plan

## Summary of Findings

Analysis of `docs/.vitepress/theme/content-data.ts` reveals **3 categories** of issues in the Golang section:

1. **Duplicate sidebar links** -- the same URL appears in both "先读这几篇" and the detailed collapsed groups
2. **Duplicate/overlapping content files** -- separate .md files covering the same topic with different names
3. **Landing page inconsistencies** -- `order` array has a title that does not match any `docs` entry
4. **Orphan files on disk** -- .md files that exist but are not referenced in any sidebar

---

## Issue 1: Duplicate Links in golangSourceReadingSidebar

Six links appear in the "先读这几篇" (Priority Reading) group AND again in the collapsed detail groups ("运行时与并发", "I/O、系统与网络", "数据、编码与模板"). This is by design (the priority group is a curated shortcut), but it inflates the sidebar.

| Link | Appears in "先读这几篇" (line) | Also appears in (line) |
|---|---|---|
| `/golang/guide/source-reading/runtime-scheduler` | L47 | L68 "运行时与并发" |
| `/golang/guide/source-reading/runtime-gc` | L48 | L69 "运行时与并发" |
| `/golang/guide/source-reading/channel` | L49 | L64 "运行时与并发" |
| `/golang/guide/source-reading/map` | L50 | L65 "运行时与并发" |
| `/golang/guide/source-reading/net-http` | L51 | L120 "I/O、系统与网络" |
| `/golang/guide/source-reading/database-sql` | L52 | L163 "数据、编码与模板" |

### Recommended Action

**Option A (Keep as-is)**: The "先读这几篇" group serves as a curated entry point. Duplication is intentional. No change needed.

**Option B (Remove "先读这几篇" group entirely)**: Eliminate the 6-item shortcut group since the collapsed groups already contain all items. This simplifies the sidebar.

**Option C (Keep "先读这几篇" but remove duplicates from detail groups)**: Remove the 4 duplicated items from "运行时与并发" (channel, map, runtime-scheduler, runtime-gc) and remove net-http/database-sql from their respective detail groups. Downside: the detail groups become incomplete as reference lists.

**Recommended: Option A** -- keep the intentional duplication. The "先读这几篇" group is a UX feature, not a bug.

---

## Issue 2: Duplicate/Overlapping Content Files

These are the real problems requiring merge or removal.

### 2.1 unsafe: Two files covering the same package

| Sidebar Entry | Link | File |
|---|---|---|
| `unsafe：内存操作` (L93) | `/golang/guide/source-reading/unsafe` | `unsafe.md` |
| `unsafe：底层指针操作` (L94) | `/golang/guide/source-reading/unsafe-pkg` | `unsafe-pkg.md` |

Both files cover the **exact same package** (`src/unsafe/unsafe.go`), with highly overlapping structure (package overview, 6 conversion rules, Sizeof/Alignof/Offsetof). The `unsafe-pkg.md` adds sync/atomic internals.

**Action**: Merge `unsafe-pkg.md` content into `unsafe.md`, then:
- Remove `unsafe-pkg.md` file
- Remove sidebar entry at L94: `{ text: 'unsafe：底层指针操作', link: '/golang/guide/source-reading/unsafe-pkg' }`
- Keep sidebar entry at L93: `{ text: 'unsafe：内存操作', link: '/golang/guide/source-reading/unsafe' }`

### 2.2 maps/cmp/slices: Two files covering the same packages

| Sidebar Entry | Link | File |
|---|---|---|
| `maps/cmp/slices：泛型工具` (L98) | `/golang/guide/source-reading/maps-cmp` | `maps-cmp.md` |
| `slices/maps/cmp：泛型标准库` (L99) | `/golang/guide/source-reading/slices-maps-cmp` | `slices-maps-cmp.md` |

Both cover the same three Go 1.21+ packages (`slices`, `maps`, `cmp`). `maps-cmp.md` focuses more on maps/cmp; `slices-maps-cmp.md` focuses more on slices. Together they form a complete picture.

**Action**: Merge into a single file `slices-maps-cmp.md` (the more comprehensive name), then:
- Merge unique content from `maps-cmp.md` into `slices-maps-cmp.md`
- Remove `maps-cmp.md` file
- Remove sidebar entry at L98: `{ text: 'maps/cmp/slices：泛型工具', link: '/golang/guide/source-reading/maps-cmp' }`
- Keep sidebar entry at L99: `{ text: 'slices/maps/cmp：泛型标准库', link: '/golang/guide/source-reading/slices-maps-cmp' }`

### 2.3 log/slog: Two files covering the same package

| Sidebar Entry | Link | File |
|---|---|---|
| `log/slog：结构化日志` (L188) | `/golang/guide/source-reading/log-slog` | `log-slog.md` |
| `log/slog：深度解析` (L189) | `/golang/guide/source-reading/log-slog-deep` | `log-slog-deep.md` |

Both have the same title in frontmatter ("log/slog 源码精读") and cover the Handler interface, Attr/Record system, and Level filtering. The "deep" version adds more on production patterns.

**Action**: Merge `log-slog-deep.md` content into `log-slog.md`, then:
- Remove `log-slog-deep.md` file
- Remove sidebar entry at L189: `{ text: 'log/slog：深度解析', link: '/golang/guide/source-reading/log-slog-deep' }`
- Keep sidebar entry at L188: `{ text: 'log/slog：结构化日志', link: '/golang/guide/source-reading/log-slog' }`

---

## Issue 3: Additional Duplicate Links in Main Sidebar

### 3.1 Main sidebar links duplicated with source-reading sidebar

| Main Sidebar Entry | Source Reading Entry |
|---|---|
| `Go 源码精读模块` (L395) link: `/golang/guide/source-reading/` | `模块总览` (L39) link: `/golang/guide/source-reading/` |
| `九、源码与 Runtime` (L410) link: `/golang/guide/09-runtime-source` | `源码与 Runtime 大纲` (L41) link: `/golang/guide/09-runtime-source` |
| `方向概览` (L387) link: `/golang/` | `Go 主方向入口` (L40) link: `/golang/` |

**Action**: Remove the "源码阅读入口" group (lines 36-43) from `golangSourceReadingSidebar` entirely. Its 3 items are all already present in the main Golang sidebar:
- `/golang/guide/source-reading/` is at L395
- `/golang/` is at L387
- `/golang/guide/09-runtime-source` is at L410

This removes the redundant "源码阅读入口" group header and 3 duplicate links.

---

## Issue 4: Landing Page `order` Array Mismatch

In the Golang landing `order` array (line 376):
```
'Go 推荐书单、博客与视频资料',
```

But in the `docs` array (line 369), the matching entry title is:
```
'Go 推荐书单与资料'
```

These do not match. The `order` array entry will not correspond to any `docs` entry.

**Action**: Change line 376 from `'Go 推荐书单、博客与视频资料'` to `'Go 推荐书单与资料'` to match the docs array title.

---

## Issue 5: Orphan Files (on disk but not in sidebar)

These files exist in `docs/golang/guide/source-reading/` but have no sidebar entry:

| File | Topic | Action |
|---|---|---|
| `go-fuzzing.md` | Go fuzzing testing | Add to "工程实践与工具链" group |
| `hash-crc32.md` | hash/crc32 package | Add to "安全与密码学" group |
| `mime-multipart.md` | mime/multipart package | Add to "I/O、系统与网络" group |
| `zap.md` | Uber zap logger | Add to "工程实践与工具链" group |
| `index.md` | Source reading landing page | Already linked as `/golang/guide/source-reading/` (trailing slash) -- no action needed |

**Action**: Add 4 new sidebar entries to appropriate groups in `golangSourceReadingSidebar`.

---

## Execution Checklist

All changes are in a single file: `docs/.vitepress/theme/content-data.ts`
Plus content merges in `docs/golang/guide/source-reading/` markdown files.

### Step 1: Content File Merges (3 merges)

- [ ] Merge `unsafe-pkg.md` unique content into `unsafe.md`, delete `unsafe-pkg.md`
- [ ] Merge `maps-cmp.md` unique content into `slices-maps-cmp.md`, delete `maps-cmp.md`
- [ ] Merge `log-slog-deep.md` unique content into `log-slog.md`, delete `log-slog-deep.md`

### Step 2: Sidebar Cleanup in content-data.ts

- [ ] Remove the entire "源码阅读入口" group (lines 36-43)
- [ ] Remove `{ text: 'unsafe：底层指针操作', link: '/golang/guide/source-reading/unsafe-pkg' }` from "标准库基础" (L94)
- [ ] Remove `{ text: 'maps/cmp/slices：泛型工具', link: '/golang/guide/source-reading/maps-cmp' }` from "标准库基础" (L98)
- [ ] Remove `{ text: 'log/slog：深度解析', link: '/golang/guide/source-reading/log-slog-deep' }` from "工程实践与工具链" (L189)

### Step 3: Add Orphan Files to Sidebar

- [ ] Add `{ text: 'testing/fuzzing：模糊测试', link: '/golang/guide/source-reading/go-fuzzing' }` to "工程实践与工具链" group (after testing-fstest)
- [ ] Add `{ text: 'hash/crc32：校验和', link: '/golang/guide/source-reading/hash-crc32' }` to "安全与密码学" group
- [ ] Add `{ text: 'mime/multipart：表单上传', link: '/golang/guide/source-reading/mime-multipart' }` to "I/O、系统与网络" group
- [ ] Add `{ text: 'zap：高性能日志库', link: '/golang/guide/source-reading/zap' }` to "工程实践与工具链" group (after log entries)

### Step 4: Fix Landing Page

- [ ] Change `order` entry from `'Go 推荐书单、博客与视频资料'` to `'Go 推荐书单与资料'` (line 376)

---

## Summary of Net Changes

| Metric | Before | After |
|---|---|---|
| golangSourceReadingSidebar groups | 9 | 8 (removed "源码阅读入口") |
| Duplicate links removed | -- | 3 (from removed group) + 3 (merged files) = 6 |
| Orphan files brought into sidebar | 0 | 4 |
| Content files deleted (after merge) | 0 | 3 (unsafe-pkg.md, maps-cmp.md, log-slog-deep.md) |
| Landing page fixes | 0 | 1 (order title mismatch) |
