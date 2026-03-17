#!/usr/bin/env python3
"""
Batch optimize MySQL 45 lecture Markdown files.
Transformations:
1. Convert indented code blocks to fenced code blocks (```sql, ```bash, ```)
2. Replace <!-- image: --> placeholders with contextual descriptions
3. Fix heading hierarchy (# → ## for sub-sections)
4. Add inline code backticks for technical terms
5. Clean up formatting
"""

import re
import os
import sys

# Technical terms that should be wrapped in backticks
STORAGE_ENGINES = [
    'InnoDB', 'MyISAM', 'Memory', 'TokuDB', 'RocksDB', 'NDB', 'Archive',
    'CSV', 'Blackhole', 'Federated', 'MERGE', 'NDB Cluster',
]

LOG_TYPES = [
    'redo log', 'binlog', 'undo log', 'relay log', 'slow log',
    'general log', 'error log',
]

MYSQL_CONCEPTS = [
    'crash-safe', 'Write-Ahead Logging', 'WAL',
    'change buffer', 'buffer pool', 'log buffer',
    'doublewrite', 'insert buffer', 'adaptive hash index',
    'Using filesort', 'Using temporary', 'Using index',
    'Using index condition', 'Using where', 'Using join buffer',
    'Full table scan', 'Index Nested-Loop Join', 'Block Nested-Loop Join',
    'Batched Key Access', 'Multi-Range Read', 'MRR',
    'MVCC', 'Next-Key Lock', 'Gap Lock', 'Record Lock',
    'MDL', 'metadata lock',
    'read view', 'consistent read',
    'dirty page', 'clean page',
    'B+ tree', 'B+树',
    'LSN',
    'GTID',
    'semi-sync', 'async',
]

# System variables (snake_case patterns commonly seen in MySQL)
SYSTEM_VARIABLES = [
    'wait_timeout', 'interactive_timeout',
    'query_cache_type', 'query_cache_size',
    'innodb_flush_log_at_trx_commit', 'sync_binlog',
    'innodb_buffer_pool_size', 'innodb_log_file_size',
    'innodb_io_capacity', 'innodb_io_capacity_max',
    'innodb_max_dirty_pages_pct',
    'innodb_change_buffer_max_size',
    'innodb_lock_wait_timeout',
    'long_query_time',
    'sort_buffer_size', 'join_buffer_size', 'read_buffer_size',
    'tmp_table_size', 'max_heap_table_size',
    'max_connections', 'max_allowed_packet',
    'binlog_format', 'binlog_row_image',
    'transaction_isolation', 'transaction-isolation',
    'autocommit',
    'innodb_file_per_table',
    'innodb_stats_persistent',
    'innodb_online_alter_log_max_size',
    'slave_parallel_workers', 'slave_parallel_type',
    'binlog_group_commit_sync_delay', 'binlog_group_commit_sync_no_delay_count',
    'innodb_thread_concurrency',
    'innodb_flush_neighbors',
    'net_write_timeout', 'net_read_timeout',
    'slave_rows_search_algorithms',
    'binlog_cache_size',
    'max_binlog_size',
    'expire_logs_days',
    'server_id', 'server-id',
    'log_bin', 'log-bin',
    'relay_log', 'relay-log',
    'read_only', 'super_read_only',
    'innodb_force_recovery',
    'sql_safe_updates',
    'rows_examined', 'rows_affected',
    'Rows_examined',
    'mysql_reset_connection',
    'innodb_deadlock_detect',
    'innodb_lock_wait_timeout',
    'auto_increment_offset', 'auto_increment_increment',
    'thread_id',
]

SQL_KEYWORDS_IN_PROSE = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE TABLE', 'ALTER TABLE',
    'DROP TABLE', 'CREATE INDEX', 'DROP INDEX',
    'SHOW PROCESSLIST', 'SHOW VARIABLES', 'SHOW STATUS',
    'EXPLAIN', 'ANALYZE', 'OPTIMIZE',
    'FLUSH PRIVILEGES', 'FLUSH TABLES', 'FLUSH LOGS',
    'GRANT', 'REVOKE',
    'LOCK TABLES', 'UNLOCK TABLES',
    'START TRANSACTION', 'BEGIN', 'COMMIT', 'ROLLBACK',
    'SAVEPOINT',
    'KILL',
    'SQL_CACHE', 'SQL_NO_CACHE',
    'ENGINE=InnoDB', 'ENGINE=MyISAM', 'ENGINE=MEMORY',
    'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE KEY',
    'AUTO_INCREMENT',
    'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN',
    'WHERE', 'ON', 'USING',
    'FORCE INDEX', 'USE INDEX', 'IGNORE INDEX',
    'FOR UPDATE', 'LOCK IN SHARE MODE',
    'PARTITION BY',
]

MYSQL_COMMANDS = [
    'mysqldump', 'mysqlbinlog', 'mysql_upgrade',
    'CHANGE MASTER', 'START SLAVE', 'STOP SLAVE',
    'SHOW SLAVE STATUS', 'SHOW MASTER STATUS',
    'SET GLOBAL', 'SET SESSION',
    'PURGE BINARY LOGS',
]

DATA_TYPES = [
    'varchar', 'char', 'int', 'bigint', 'tinyint', 'smallint',
    'mediumint', 'float', 'double', 'decimal',
    'timestamp', 'datetime', 'date', 'time',
    'text', 'blob', 'mediumtext', 'longtext',
    'enum', 'set', 'json', 'boolean',
]

FUNCTIONS_AND_STATUS = [
    'count(*)', 'count(1)', 'count(id)',
    'now()', 'sleep()',
    'point-in-time recovery',
    'prepare', 'commit',
    'read committed', 'read uncommitted',
    'repeatable read', 'serializable',
    'READ-COMMITTED', 'REPEATABLE-READ', 'READ-UNCOMMITTED', 'SERIALIZABLE',
]


def detect_code_language(line):
    """Detect the language of an indented code line."""
    stripped = line.strip()
    if stripped.startswith('mysql>') or stripped.startswith('MySQL>'):
        return 'sql'
    if stripped.startswith('$') or stripped.startswith('#') and not stripped.startswith('# '):
        return 'bash'
    # SQL keywords at start
    sql_starts = ['select ', 'insert ', 'update ', 'delete ', 'create ', 'alter ',
                  'drop ', 'show ', 'explain ', 'set ', 'grant ', 'flush ',
                  'lock ', 'unlock ', 'start ', 'begin', 'commit', 'rollback',
                  'replace ', 'call ', 'desc ', 'describe ', 'use ',
                  'load ', 'prepare ', 'execute ', 'deallocate ',
                  'analyze ', 'optimize ', 'check ', 'repair ',
                  'rename ', 'truncate ', 'revoke ', 'kill ',
                  'change master', 'start slave', 'stop slave',
                  'purge ', 'reset ', 'with ']
    lower = stripped.lower()
    for kw in sql_starts:
        if lower.startswith(kw):
            return 'sql'
    # SQL result table patterns
    if stripped.startswith('+--') or stripped.startswith('|'):
        return 'sql'
    # Error messages
    if stripped.startswith('ERROR ') or stripped.startswith('Warning'):
        return 'sql'
    # Numbers only (row counts etc)
    if re.match(r'^\d+ rows? in set', stripped):
        return 'sql'
    return None


def convert_indented_code_blocks(content):
    """Convert 4-space indented code blocks to fenced code blocks."""
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this line is indented code (4+ spaces)
        if re.match(r'^    \S', line) or (re.match(r'^    $', line) and i + 1 < len(lines) and re.match(r'^    \S', lines[i + 1])):
            # Collect all consecutive indented lines (including blank lines between them)
            code_lines = []
            lang = None

            while i < len(lines):
                if re.match(r'^    ', lines[i]) or (lines[i].strip() == '' and i + 1 < len(lines) and re.match(r'^    ', lines[i + 1])):
                    actual_line = lines[i][4:] if lines[i].startswith('    ') else ''
                    code_lines.append(actual_line)
                    if lang is None:
                        detected = detect_code_language(actual_line)
                        if detected:
                            lang = detected
                    i += 1
                else:
                    break

            # Remove leading/trailing empty lines from code block
            while code_lines and code_lines[0].strip() == '':
                code_lines.pop(0)
            while code_lines and code_lines[-1].strip() == '':
                code_lines.pop()

            if code_lines:
                if lang is None:
                    lang = ''
                # Remove trailing blank line before fence if present
                while result and result[-1].strip() == '':
                    result.pop()
                result.append('')
                result.append(f'```{lang}')
                result.extend(code_lines)
                result.append('```')
                result.append('')
        else:
            result.append(line)
            i += 1

    return '\n'.join(result)


def fix_image_placeholders(content):
    """Replace <!-- image: --> with contextual descriptions."""
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        if '<!-- image:' in line and '-->' in line:
            # Look at context: the line after the image placeholder often has a description
            desc = None

            # Check if next non-empty line looks like a caption (short, no period pattern)
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1

            if j < len(lines):
                next_line = lines[j].strip()
                # Caption must be short (< 40 chars), not start with common paragraph patterns,
                # and not contain sentence-ending punctuation (which indicates a paragraph)
                is_caption = (
                    next_line and len(next_line) < 40 and
                    not next_line.startswith('#') and
                    not next_line.startswith('-') and
                    not next_line.startswith('*') and
                    not next_line.startswith('>') and
                    not next_line.startswith('```') and
                    not next_line.startswith('|') and
                    not next_line.startswith('<!--') and
                    not any(next_line.endswith(c) for c in ['。', '？', '！', '.', '?', '!']) and
                    # Must not start with common paragraph starters
                    not any(next_line.startswith(w) for w in [
                        '我们', '你', '其中', '如果', '比如', '所以', '因为', '这',
                        '在', '对于', '由于', '但是', '而', '假设', '可以', '需要',
                        '注意', '首先', '前面', '接下来', '具体', '简单',
                    ])
                )
                if is_caption:
                    # Check if the line after caption is empty or different content
                    k = j + 1
                    while k < len(lines) and lines[k].strip() == '':
                        k += 1
                    if k >= len(lines) or (k < len(lines) and lines[k].strip() != next_line):
                        desc = next_line
                        i_skip_to = j + 1
                    else:
                        i_skip_to = None
                else:
                    i_skip_to = None
            else:
                i_skip_to = None

            # Check previous context for description if no caption found
            if desc is None:
                # Look at previous lines for context
                prev_text = ''
                for p in range(max(0, len(result) - 3), len(result)):
                    if result[p].strip():
                        prev_text = result[p].strip()

                if '如下' in prev_text or '下面' in prev_text or '下图' in prev_text or '如图' in prev_text:
                    desc = '相关示意图'
                elif '架构' in prev_text:
                    desc = '架构示意图'
                elif '流程' in prev_text:
                    desc = '执行流程图'
                elif '结果' in prev_text or '输出' in prev_text:
                    desc = '执行结果'
                else:
                    desc = '示意图'
                i_skip_to = None

            # Remove preceding blank lines
            while result and result[-1].strip() == '':
                result.pop()
            result.append('')
            result.append(f'> **[图：{desc}]**')
            result.append('')

            if i_skip_to is not None:
                i = i_skip_to
            else:
                i += 1
        else:
            result.append(line)
            i += 1

    return '\n'.join(result)


def fix_heading_hierarchy(content):
    """Change # headings to ## for sub-sections (keep first # as title)."""
    lines = content.split('\n')
    result = []
    found_title = False

    for line in lines:
        if re.match(r'^# ', line) and not re.match(r'^##', line):
            if not found_title:
                found_title = True
                result.append(line)
            else:
                result.append('#' + line)
        else:
            result.append(line)

    return '\n'.join(result)


def add_inline_code(content):
    """Add backticks around technical terms in prose text."""

    # Skip lines that are inside code blocks or are headings/frontmatter
    lines = content.split('\n')
    result_lines = []
    in_code_block = False
    in_frontmatter = False

    for idx, line in enumerate(lines):
        if idx == 0 and line.strip() == '---':
            in_frontmatter = True
            result_lines.append(line)
            continue
        if in_frontmatter:
            if line.strip() == '---':
                in_frontmatter = False
            result_lines.append(line)
            continue
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            result_lines.append(line)
            continue
        if in_code_block:
            result_lines.append(line)
            continue
        # Skip headings - don't add backticks to heading text
        if line.startswith('#'):
            result_lines.append(line)
            continue
        if line.startswith('>') or line.startswith('|'):
            result_lines.append(_add_backticks_to_line(line))
            continue

        result_lines.append(_add_backticks_to_line(line))

    return '\n'.join(result_lines)


def _add_backticks_to_line(line):
    """Add backticks to technical terms in a single line."""
    # Don't process lines that are already mostly code or links
    if line.count('`') > 4:
        return line

    # System variables (snake_case with specific known names)
    for var in SYSTEM_VARIABLES:
        # Match the variable not already in backticks
        pattern = r'(?<!`)(?<![`\w])' + re.escape(var) + r'(?![`\w])(?!`)'
        if re.search(pattern, line):
            line = re.sub(pattern, f'`{var}`', line)

    # Storage engines - only when standing alone as words
    for engine in STORAGE_ENGINES:
        pattern = r'(?<!`)(?<![`\w/])' + re.escape(engine) + r'(?![`\w])(?!`)'
        if re.search(pattern, line):
            line = re.sub(pattern, f'`{engine}`', line)

    # Log types
    for log in LOG_TYPES:
        pattern = r'(?<!`)(?<![`\w])' + re.escape(log) + r'(?![`\w])(?!`)'
        if re.search(pattern, line):
            line = re.sub(pattern, f'`{log}`', line)

    # MySQL concepts
    for concept in MYSQL_CONCEPTS:
        pattern = r'(?<!`)(?<![`\w])' + re.escape(concept) + r'(?![`\w])(?!`)'
        if re.search(pattern, line):
            line = re.sub(pattern, f'`{concept}`', line)

    # Data types - be more careful, only when clearly used as type names
    for dt in DATA_TYPES:
        # Only match if surrounded by non-word chars and not in a regular word
        pattern = r'(?<!`)(?<![`\w])' + re.escape(dt) + r'(?![`\w])(?!`)'
        if re.search(pattern, line):
            # Be extra careful with common words that could be data type names
            if dt in ['set', 'date', 'time', 'text', 'json', 'float', 'double']:
                continue  # Skip ambiguous ones in prose
            line = re.sub(pattern, f'`{dt}`', line)

    return line


def clean_extra_blank_lines(content):
    """Remove excessive blank lines (max 2 consecutive)."""
    return re.sub(r'\n{4,}', '\n\n\n', content)


def clean_list_formatting(content):
    """Convert  * items to - items for consistency."""
    lines = content.split('\n')
    result = []
    in_code = False

    for line in lines:
        if line.strip().startswith('```'):
            in_code = not in_code
        if not in_code and re.match(r'^  \* ', line):
            line = re.sub(r'^  \* ', '- ', line)
        result.append(line)

    return '\n'.join(result)


def optimize_file(filepath):
    """Apply all optimizations to a single file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip file 01 (already manually optimized)
    basename = os.path.basename(filepath)
    if basename == '01-sql-query-execution.md':
        print(f'  SKIP (already optimized): {basename}')
        return False

    # Skip non-lecture files
    if not re.match(r'^\d{2}-', basename):
        print(f'  SKIP (not a lecture file): {basename}')
        return False

    original = content

    # Apply transformations in order
    content = convert_indented_code_blocks(content)
    content = remove_decorative_opening_image(content)
    content = fix_image_placeholders(content)
    content = fix_heading_hierarchy(content)
    content = add_inline_code(content)
    content = clean_list_formatting(content)
    content = clean_extra_blank_lines(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  UPDATED: {basename}')
        return True
    else:
        print(f'  NO CHANGE: {basename}')
        return False


def main():
    if len(sys.argv) < 2:
        print('Usage: python optimize-mysql45-md.py <docs/mysql directory>')
        sys.exit(1)

    mysql_dir = sys.argv[1]
    if not os.path.isdir(mysql_dir):
        print(f'Error: {mysql_dir} is not a directory')
        sys.exit(1)

    files = sorted(f for f in os.listdir(mysql_dir) if f.endswith('.md'))
    updated = 0
    total = 0

    for f in files:
        filepath = os.path.join(mysql_dir, f)
        total += 1
        if optimize_file(filepath):
            updated += 1

    print(f'\nDone. Updated {updated}/{total} files.')


if __name__ == '__main__':
    main()
