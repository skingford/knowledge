# Golang Consolidation Round 2: Deeper Overlap Analysis

## Context

Round 1 (see `golang-consolidation.md`) merged 3 pairs of duplicate files:
- `unsafe-pkg.md` into `unsafe.md`
- `maps-cmp.md` into `slices-maps-cmp.md`
- `log-slog-deep.md` into `log-slog.md`

This round performs a deeper analysis across ALL golang files to find remaining overlaps.

---

## Analysis Summary

### Overlap Categories

After thorough comparison, findings fall into three categories:

1. **REAL OVERLAP -- Action Recommended** (3 items)
2. **STRUCTURAL OVERLAP -- Acceptable by design** (4 items)
3. **NO REAL OVERLAP -- False positives** (6 items)

---

## Category 1: REAL OVERLAP -- Action Recommended

### 1.1 `math-rand.md` vs `math-rand-v2.md` (source-reading)

**Files:**
- `docs/golang/guide/source-reading/math-rand.md` (292 lines)
- `docs/golang/guide/source-reading/math-rand-v2.md` (313 lines)

**Overlap Evidence:**
- `math-rand.md` title says "math/rand" but its description says "精读 Go math/rand/v2（Go 1.22+）" -- it already covers v2 extensively
- Both files explain ChaCha8 and PCG algorithms in detail (23 mentions in math-rand.md, 20 in math-rand-v2.md)
- Both have "加权随机选择" (weighted random selection) code examples
- Both have "基础使用" examples for v2 API
- `math-rand.md` covers: ChaCha8 algorithm, PCG algorithm, global Rand concurrency safety, basic v2 usage, reproducible sequences, sync.Pool reuse, weighted random, normal distribution, crypto/rand vs math/rand
- `math-rand-v2.md` covers: PCG/ChaCha8 comparison, basic rand.N, reproducible sequences, Shuffle, weighted random, exponential backoff jitter, test data generation, v1 to v2 migration guide

**Assessment:** ~60% content overlap. Both teach the same v2 API and algorithms. The main unique content is: `math-rand.md` has normal distribution + crypto/rand comparison; `math-rand-v2.md` has Shuffle + exponential backoff + migration guide.

**Recommended Action:** Merge into a single `math-rand.md`. Keep the v1/v2 comparison table (which is in math-rand.md already), consolidate the algorithm explanations, and bring in the unique examples from math-rand-v2.md (Shuffle, exponential backoff, migration guide). Delete `math-rand-v2.md`.

**Sidebar change:** Remove `{ text: 'math/rand/v2：现代随机数', link: '/golang/guide/source-reading/math-rand-v2' }` from "标准库基础". Update math-rand entry text to `'math/rand：随机数生成（含 v2）'`.

---

### 1.2 `bufio.md` vs `bufio-advanced.md` (source-reading)

**Files:**
- `docs/golang/guide/source-reading/bufio.md` (333 lines)
- `docs/golang/guide/source-reading/bufio-advanced.md` (407 lines)

**Overlap Evidence:**
- Both have "自定义 SplitFunc（按逗号分割 CSV）" -- nearly identical CSV parsing examples (`scanCSVFields` in bufio.md, `scanCSVField` in bufio-advanced.md)
- Both have Scanner usage examples
- Both have Peek examples for protocol detection
- Both have Writer + Flush examples
- Both describe bufio.Reader internal structure (buf, r/w pointers, 4096 default)
- `bufio.md` package structure diagram already lists Scanner, SplitFunc, Peek, ReadLine, ReadString -- all of which are "advanced" topics covered in bufio-advanced.md

**Unique to bufio.md:** countLines example, ReadString vs Scanner comparison
**Unique to bufio-advanced.md:** Fixed-byte SplitFunc, ReadLine vs ReadString detailed comparison, ReadWriter for network protocols, word scanner

**Assessment:** ~50% content overlap. The "basic" file already covers Scanner and SplitFunc in depth, making the split between basic/advanced somewhat arbitrary.

**Recommended Action:** Merge into a single `bufio.md`. The combined file would have a clear flow: Reader internals -> Scanner + SplitFunc -> Writer -> Peek -> ReadLine vs ReadString -> advanced patterns (ReadWriter, fixed-byte split). Delete `bufio-advanced.md`.

**Sidebar change:** Remove `{ text: 'bufio 高级模式：Scanner/ReadLine', link: '/golang/guide/source-reading/bufio-advanced' }` from "I/O、系统与网络". Update bufio entry text to `'bufio：缓冲 I/O 与 Scanner'`.

---

### 1.3 `testing.md` vs `testing-advanced.md` (source-reading)

**Files:**
- `docs/golang/guide/source-reading/testing.md` (372 lines)
- `docs/golang/guide/source-reading/testing-advanced.md` (483 lines)

**Overlap Evidence:**
- Both have `t.Helper()` examples (testing.md line 229, testing-advanced.md line 85)
- Both have `t.Cleanup` examples (testing.md line 245 with setupTestDB, testing-advanced.md line 85 with setupTestDB -- strikingly similar patterns)
- Both have `TestMain` examples (testing.md line 326, testing-advanced.md line 332)
- Both have Benchmark examples (testing.md line 269, testing-advanced.md line 249)
- `testing.md` already covers: table-driven, Helper, Cleanup, Benchmark, Fuzz, TestMain, coverage + cpuprofile

**Unique to testing-advanced.md:** Golden File testing, parallel sub-tests with detailed race avoidance, Benchmark sub-benchmarks with AllocsPerOp, t.Setenv + t.TempDir, custom assert library

**Assessment:** ~45% content overlap on t.Helper, t.Cleanup, Benchmark, TestMain. The "basic" file is already quite comprehensive.

**Recommended Action:** Merge into a single `testing.md`. The unique advanced content (Golden File, parallel sub-tests, custom assert) adds value but does not justify a separate file given the significant overlap in shared examples. Delete `testing-advanced.md`.

**Sidebar change:** Remove `{ text: 'testing 高级模式', link: '/golang/guide/source-reading/testing-advanced' }` from "工程实践与工具链". Update testing entry text to `'testing：测试框架与高级模式'`.

---

## Category 2: STRUCTURAL OVERLAP -- Acceptable by Design

These are cases where content intentionally overlaps because the files serve different purposes (overview vs deep-dive, usage guide vs source code analysis, main guide vs source-reading reference).

### 2.1 Main guide `09-runtime-source.md` vs source-reading files

**Files:**
- `docs/golang/guide/09-runtime-source.md` (1053 lines) -- main learning guide
- `docs/golang/guide/source-reading/runtime-scheduler.md` -- deep source reading
- `docs/golang/guide/source-reading/channel.md` -- deep source reading
- `docs/golang/guide/source-reading/runtime-gc.md` -- deep source reading
- `docs/golang/guide/source-reading/map.md` -- deep source reading
- `docs/golang/guide/source-reading/sync-primitives.md` -- deep source reading
- `docs/golang/guide/source-reading/context.md` -- deep source reading

**Assessment:** `09-runtime-source.md` is a **learning roadmap** that covers GMP scheduling, Channel, Map, sync, net/http, Context, and GC at a survey level (~120 lines each), with guidance on "how to read Go source code". The source-reading files are **deep dives** into each topic with full source code analysis, data structures, and production examples.

**Verdict: NO ACTION NEEDED.** The guide file serves as an entry point and reading companion, while the source-reading files are the reference material. Cross-references between them would be beneficial but are not strictly necessary.

### 2.2 Main guide `03-concurrency.md` vs source-reading sync/channel/goroutine

**Files:**
- `docs/golang/guide/03-concurrency.md` (1568 lines) -- practical concurrency guide
- `docs/golang/guide/source-reading/sync-primitives.md` -- Mutex/RWMutex/WaitGroup/Once/sync.Map source
- `docs/golang/guide/source-reading/channel.md` -- channel implementation source
- `docs/golang/guide/source-reading/goroutine.md` -- goroutine lifecycle source

**Assessment:** The guide file teaches *how to use* concurrency primitives with practical patterns and anti-patterns. The source-reading files explain *how they are implemented* at the runtime level. Different audience intent.

**Verdict: NO ACTION NEEDED.** Intentional separation of "usage guide" vs "implementation deep-dive".

### 2.3 `03-advanced-concurrency-patterns.md` vs `golang-x-sync.md`

**Files:**
- `docs/golang/guide/03-advanced-concurrency-patterns.md` (1607 lines)
- `docs/golang/guide/source-reading/golang-x-sync.md` (346 lines)

**Assessment:** Both cover errgroup, singleflight, and semaphore. However, the guide file covers them as part of a broader patterns document (also covering Worker Pool, Pipeline, Fan-Out/Fan-In, Rate Limiter, Context cascade) while the source-reading file focuses on the x/sync package's internal implementation. The guide file has more extensive usage examples; the source-reading file has more implementation detail.

**Verdict: NO ACTION NEEDED but consider adding a cross-reference.** The guide could link to the source-reading file for implementation details, and vice versa.

### 2.4 `net-http.md` (source-reading) as overview vs child files

**Files:**
- `docs/golang/guide/source-reading/net-http.md` (252 lines) -- overview
- `docs/golang/guide/source-reading/net-http-server.md` (366 lines) -- server deep dive
- `docs/golang/guide/source-reading/net-http-transport.md` (359 lines) -- transport deep dive
- `docs/golang/guide/source-reading/net-http-api.md` (394 lines) -- RESTful patterns
- Plus 6 more net-http-* files

**Assessment:** `net-http.md` is an intentional overview that briefly covers Server, ServeMux, Transport, and middleware in ~250 lines. Each child file then goes deep into one specific area. The overview duplicates the high-level structure diagrams but not the detailed code examples.

**Verdict: NO ACTION NEEDED.** This is a well-designed overview-plus-detail hierarchy.

---

## Category 3: NO REAL OVERLAP -- False Positives

### 3.1 `io-interfaces.md` vs `io-advanced.md`

- `io-interfaces.md`: Covers Reader/Writer/Closer/Seeker interface hierarchy, bufio.Reader structure overview, io.Copy/ReadAll/LimitReader/TeeReader utility function listing, interface composition philosophy
- `io-advanced.md`: Deep dives into TeeReader, LimitReader, SectionReader, MultiReader, MultiWriter, io.Pipe with full code examples

**Verdict: No real overlap.** `io-interfaces.md` lists the utilities briefly (3-4 lines each); `io-advanced.md` provides full implementation analysis and examples for each. They complement each other well.

Note: `io-interfaces.md` has a short section on bufio.Reader internals (~25 lines) which also appears in `bufio.md`. This is minor and serves as context for the io interface discussion.

### 3.2 `database-sql.md` vs `database-sql-advanced.md` (source-reading)

- `database-sql.md`: Connection pool internals, basic Query/Scan, connection pool config, simple transaction defer pattern, prepared statements, custom Scanner, pool monitoring
- `database-sql-advanced.md`: withTx helper with panic recovery, Savepoint nested transactions, bulk insert optimization, RETURNING clause, prepared statement cache, pool tuning, row scan helpers

**Verdict: No real overlap.** Both have a transaction example, but the patterns are different (simple `defer tx.Rollback()` vs full `withTx` helper with panic recovery). The files are properly split into basic vs genuinely advanced topics.

### 3.3 `database-sql.md` (source-reading) vs `database-sql-and-connection.md` (MySQL section)

- Source-reading file: Go standard library internal implementation focus (connection pool data structures, freeConn slice, connRequests map)
- MySQL section file: Practical MySQL usage focus (driver registration, DSN format, CRUD examples, connection pool parameter tuning for MySQL specifically)

**Verdict: No real overlap.** Different focus: implementation internals vs practical MySQL-specific usage.

### 3.4 `context-usage-boundaries.md` (top-level) vs `context.md` (source-reading)

- `context-usage-boundaries.md`: 101-line practical guide on when to use/not use context, common mistakes, no code examples
- `context.md` (source-reading): 230-line source code analysis of Context interface, 4 implementations, cancel propagation mechanism, with code examples

**Verdict: No real overlap.** One is a usage guideline, the other is implementation analysis.

### 3.5 `pprof-troubleshooting-guide.md` (top-level) vs `runtime-pprof.md` (source-reading) vs `07-performance-troubleshooting.md` (guide)

- `pprof-troubleshooting-guide.md`: 1057-line practical troubleshooting guide with end-to-end case studies, fgprof, automated monitoring
- `runtime-pprof.md`: 270-line source code analysis of the pprof package internals
- `07-performance-troubleshooting.md`: 1180-line guide covering pprof + trace + benchmark + GC tuning + sync.Pool + lock contention + slow request diagnosis + goroutine leak detection

**Verdict: No real overlap requiring action.** The pprof guide is a standalone operational handbook; the source-reading file analyzes the package implementation; the performance guide covers pprof as one tool among many. Some surface-level duplication in "how to use pprof" but each serves a different depth and purpose.

### 3.6 `text-template.md` vs `html-template.md`

- `text-template.md`: text/template engine internals (AST parsing, Pipeline execution, FuncMap)
- `html-template.md`: html/template security features (context-aware auto-escaping, XSS prevention)

**Verdict: No real overlap.** Different packages with different purposes. `text-template.md` briefly mentions html/template's relationship but does not duplicate its content.

---

## Execution Checklist

### Step 1: Merge `math-rand-v2.md` into `math-rand.md`

- [ ] Read both files fully
- [ ] Identify unique content in `math-rand-v2.md`: Shuffle (Fisher-Yates), exponential backoff jitter, test data generation, v1->v2 migration guide
- [ ] Add unique sections to `math-rand.md` after existing content
- [ ] Remove duplicate sections from merged content (ChaCha8/PCG explanation, basic usage, weighted random, reproducible sequences)
- [ ] Update frontmatter title/description to reflect combined scope
- [ ] Delete `math-rand-v2.md`
- [ ] Update sidebar: remove math-rand-v2 entry, update math-rand entry text

### Step 2: Merge `bufio-advanced.md` into `bufio.md`

- [ ] Read both files fully
- [ ] Identify unique content in `bufio-advanced.md`: fixed-byte SplitFunc, ReadLine vs ReadString detailed analysis, ReadWriter for network protocols, word scanner example
- [ ] Add unique sections to `bufio.md` after existing content
- [ ] Remove duplicate sections (CSV SplitFunc, Scanner basic usage, Peek, Writer+Flush)
- [ ] Update frontmatter
- [ ] Delete `bufio-advanced.md`
- [ ] Update sidebar: remove bufio-advanced entry, update bufio entry text

### Step 3: Merge `testing-advanced.md` into `testing.md`

- [ ] Read both files fully
- [ ] Identify unique content in `testing-advanced.md`: Golden File testing, parallel sub-tests with race avoidance detail, Benchmark sub-benchmarks + AllocsPerOp, t.Setenv + t.TempDir, custom assert library
- [ ] Add unique sections to `testing.md` after existing content
- [ ] Remove duplicate sections (t.Helper, t.Cleanup/setupTestDB, TestMain, basic Benchmark)
- [ ] Update frontmatter
- [ ] Delete `testing-advanced.md`
- [ ] Update sidebar: remove testing-advanced entry, update testing entry text

### Step 4: Update sidebar in `content-data.ts`

All in `docs/.vitepress/theme/content-data.ts`:

- [ ] In "标准库基础" group: remove `{ text: 'math/rand/v2：现代随机数', link: '/golang/guide/source-reading/math-rand-v2' }`
- [ ] In "标准库基础" group: update math-rand text to `'math/rand：随机数生成（含 v2）'`
- [ ] In "I/O、系统与网络" group: remove `{ text: 'bufio 高级模式：Scanner/ReadLine', link: '/golang/guide/source-reading/bufio-advanced' }`
- [ ] In "I/O、系统与网络" group: update bufio text to `'bufio：缓冲 I/O 与 Scanner'`
- [ ] In "工程实践与工具链" group: remove `{ text: 'testing 高级模式', link: '/golang/guide/source-reading/testing-advanced' }`
- [ ] In "工程实践与工具链" group: update testing text to `'testing：测试框架与高级模式'`

---

## Summary of Net Changes

| Metric | Before | After |
|---|---|---|
| Files to merge and delete | 0 | 3 (`math-rand-v2.md`, `bufio-advanced.md`, `testing-advanced.md`) |
| Sidebar entries removed | 0 | 3 |
| Sidebar entries updated (text only) | 0 | 3 |
| Structural overlaps acknowledged (no action) | -- | 4 |
| False positives dismissed | -- | 6 |

---

## Optional Future Improvements (Not Blocking)

1. **Cross-references:** Add "See also" links between:
   - `03-advanced-concurrency-patterns.md` <-> `golang-x-sync.md`
   - `09-runtime-source.md` <-> individual source-reading files (runtime-scheduler, channel, etc.)
   - `07-performance-troubleshooting.md` <-> `pprof-troubleshooting-guide.md` <-> `runtime-pprof.md`

2. **io-interfaces.md bufio section:** The ~25-line bufio.Reader overview in `io-interfaces.md` could be replaced with a brief mention and a link to `bufio.md`, reducing minor duplication.
