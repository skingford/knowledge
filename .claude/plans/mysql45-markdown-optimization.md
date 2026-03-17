# Plan: Optimize MySQL 45 Lectures Markdown Quality

## Requirements

Improve the 47 MySQL 45 lecture Markdown files:
1. Fix code blocks — SQL/shell commands not properly fenced
2. Fix inline code — technical terms like `InnoDB`, `binlog`, `redo log`, system variables missing backticks
3. Reconstruct image descriptions — 915 `<!-- image: -->` placeholders need contextual descriptions based on surrounding text
4. General Markdown polish — consistent formatting

## Current Issues (from analysis of 8 sample files)

| Issue | Severity | Count |
|-------|----------|-------|
| Empty image placeholders `<!-- image: -->` | HIGH | ~915 across all files |
| SQL/code without proper ``` fences | MEDIUM | Scattered in ~10+ files |
| Technical terms without backticks | MEDIUM | Pervasive in all files |
| Heading hierarchy | OK | No issues |
| List/table formatting | OK | No issues |

## Approach: Enhanced Extraction Script

Rather than manually editing 47 files, **update the Python extraction script** to produce better output, then re-extract all files. This is the most reliable approach for 47 files.

### Phase 1: Improve Code Block Detection

Update `clean_markdown()` to:
- Detect indented SQL statements (SELECT, INSERT, UPDATE, CREATE, ALTER, DROP, SHOW, EXPLAIN, etc.) and wrap in ```sql fences
- Detect indented shell commands (mysql>, $) and wrap in ```bash fences
- Detect indented code output/results and wrap in ``` fences
- Preserve already-fenced code blocks

### Phase 2: Add Inline Code Formatting

Add post-processing to wrap these in backticks when they appear as bare words:
- Storage engines: InnoDB, MyISAM, Memory, TokuDB
- Log types: redo log, binlog, undo log, relay log, slow log
- MySQL components: Server, Executor, Optimizer, Parser, Connector
- System variables: sort_buffer_size, innodb_flush_log_at_trx_commit, etc. (pattern: snake_case words)
- SQL keywords in prose: SELECT, INSERT, WHERE, JOIN, ORDER BY, GROUP BY
- MySQL commands in prose: FLUSH, GRANT, KILL, LOCK, UNLOCK
- Data types: varchar, int, bigint, timestamp
- Status/concepts: Using filesort, Using temporary, Using index, change buffer, WAL

### Phase 3: Reconstruct Image Descriptions

For the 915 `<!-- image: -->` placeholders:
- Analyze the **surrounding text context** (2-3 lines before/after) to generate a descriptive caption
- Replace `<!-- image: -->` with a styled placeholder block like:
  ```
  > **[图示]** 描述内容（基于上下文推断）
  ```
- For images that appear right before/after a table/diagram discussion, generate ASCII art or Mermaid diagram where feasible (e.g., B+ tree, execution flow, lock wait graph)

### Phase 4: Re-extract and Validate

1. Run updated script to regenerate all 47 files
2. Spot-check 5+ files for quality
3. VitePress build verification

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Code block false positives (wrapping non-code text) | MEDIUM | Use conservative patterns, require 2+ SQL keywords |
| Inline code over-application | LOW | Only target well-known MySQL terms |
| Image description quality | MEDIUM | LLM-assisted context inference from surrounding text |
| Re-extraction overwrites any manual edits | LOW | No manual edits have been made |

## Estimated Complexity: MEDIUM-HIGH
- Phase 1 (Code blocks): Script update + regex patterns
- Phase 2 (Inline code): Pattern matching
- Phase 3 (Image descriptions): Most complex — context-aware generation for 915 images
- Phase 4 (Re-extract): Mechanical

**WAITING FOR CONFIRMATION**: Proceed with this plan?
