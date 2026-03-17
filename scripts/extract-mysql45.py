#!/usr/bin/env python3
"""Extract MySQL 45 Lectures HTML files to clean Markdown for VitePress."""

import os
import re
import sys
import html2text
from html.parser import HTMLParser

SRC_DIR = "/Users/kingford/Documents/极客时间-MySQL实战45讲"
OUT_DIR = "/Users/kingford/workspace/github.com/knowledge/docs/architecture/mysql45"

# Canonical lecture list (clean filenames, deduplicated)
CANONICAL = {
    "00": "开篇词.这一次，让我们一起来搞懂MySQL.html",
    "01": "01.基础架构：一条SQL查询语句是如何执行的？.html",
    "02": "02.日志系统：一条SQL更新语句是如何执行的？【更多精选‖公众号：CunWorknotes】  .html",
    "03": "03.事务隔离：为什么你改了我还看不见？.html",
    "04": "04.深入浅出索引（上）【精挑细选‖免费提供：cunlovE.cn】.html",
    "05": "05.深入浅出索引（下）【良心整理‖免费获取：cunloVe.cn】.html",
    "06": "06.全局锁和表锁 ：给表加个字段怎么有这么多阻碍？【更多精选‖公众号：CunWorknotes】  .html",
    "07": "07.行锁功过：怎么减少行锁对性能的影响？.html",
    "08": "08.事务到底是隔离的还是不隔离的？.html",
    "09": "09.普通索引和唯一索引，应该怎么选择？【花费时间‖免费获取：cunLove.cn】.html",
    "10": "10.MySQL为什么有时候会选错索引？.html",
    "11": "11.怎么给字符串字段加索引？【耗时整理‖免费分享：Cunlove.cn】.html",
    "12": '12.为什么我的MySQL会\u201c抖\u201d一下？.html',
    "13": "13.为什么表数据删掉一半，表文件大小不变？.html",
    "14": "14.count(×)这么慢，我该怎么办？.html",
    "15": "15.答疑文章（一）：日志和索引相关问题.html",
    "16": '16.\u201corder by\u201d是怎么工作的？.html',
    "17": "17.如何正确地显示随机消息？【优质合集‖免费获取：cunlove.cN】.html",
    "18": "18.为什么这些SQL语句逻辑相同，性能却差异巨大？.html",
    "19": "19.为什么我只查一行的语句，也执行这么慢？.html",
    "20": "20.幻读是什么幻读有什么问题？.html",
    "21": "21.为什么我只改一行的语句锁这么多？【耗时整理‖ cunlove.cn】.html",
    "22": '22.MySQL有哪些\u201c饮鸩止渴\u201d提高性能的方法？.html',
    "23": "23.MySQL是怎么保证数据不丢的？【手动整理‖：cunlove.Cn】.html",
    "24": "24.MySQL是怎么保证主备一致的？【耗时整理‖不易且全免费：cunlOve.cn】.html",
    "25": "25.MySQL是怎么保证高可用的？【持续更新‖免费提供：CunworknoteS】.html",
    "26": "26.备库为什么会延迟好几个小时？.html",
    "27": "27.主库出问题了从库怎么办？.html",
    "28": "28.读写分离有哪些坑？【资源精选‖更多关注：CunworkNotes】.html",
    "29": "29.如何判断一个数据库是不是出问题了？.html",
    "30": "30.答疑文章（二）：用动态的观点看加锁.html",
    "31": "31.误删数据后除了跑路还能怎么办？.html",
    "32": "32.为什么还有kill不掉的语句？【精挑细选‖免费提供：cunlovE.cn】.html",
    "33": "33.我查这么多数据会不会把数据库内存打爆？【耗时整理‖不易且全免费：cunlOve.cn】.html",
    "34": "34.到底可不可以使用join？.html",
    "35": "35.join语句怎么优化？.html",
    "36": "36.为什么临时表可以重名？.html",
    "37": "37.什么时候会使用内部临时表？【手动整理‖：cunlove.Cn】.html",
    "38": "38.都说InnoDB好那还要不要使用Memory引擎？【耗时整理‖不易且全免费：cunlOve.cn】.html",
    "39": "39.自增主键为什么不是连续的？【耗时整理‖ cunlove.cn】.html",
    "40": "40.insert语句的锁为什么这么多？【花费时间‖：cunLove.cn】.html",
    "41": "41.怎么最快地复制一张表？【持续更新‖免费提供：CunworknoteS】.html",
    "42": "42.grant之后要跟着flush privileges吗？.html",
    "43": "43.要不要使用分区表？【良心整理‖免费获取：cunloVe.cn】.html",
    "44": "44.答疑文章（三）：说一说这些好问题.html",
    "45": "45.自增id用完怎么办？.html",
    "46": "结束语.点线网面一起构建MySQL知识网络.html",
}

# Clean titles (without lecture number prefix and ad watermarks)
CLEAN_TITLES = {
    "00": "开篇词：这一次，让我们一起来搞懂 MySQL",
    "01": "基础架构：一条 SQL 查询语句是如何执行的？",
    "02": "日志系统：一条 SQL 更新语句是如何执行的？",
    "03": "事务隔离：为什么你改了我还看不见？",
    "04": "深入浅出索引（上）",
    "05": "深入浅出索引（下）",
    "06": "全局锁和表锁：给表加个字段怎么有这么多阻碍？",
    "07": "行锁功过：怎么减少行锁对性能的影响？",
    "08": "事务到底是隔离的还是不隔离的？",
    "09": "普通索引和唯一索引，应该怎么选择？",
    "10": "MySQL 为什么有时候会选错索引？",
    "11": "怎么给字符串字段加索引？",
    "12": '为什么我的 MySQL 会\u201c抖\u201d一下？',
    "13": "为什么表数据删掉一半，表文件大小不变？",
    "14": "count(*) 这么慢，我该怎么办？",
    "15": "答疑文章（一）：日志和索引相关问题",
    "16": "order by 是怎么工作的？",
    "17": "如何正确地显示随机消息？",
    "18": "为什么这些 SQL 语句逻辑相同，性能却差异巨大？",
    "19": "为什么我只查一行的语句，也执行这么慢？",
    "20": "幻读是什么，幻读有什么问题？",
    "21": "为什么我只改一行的语句，锁这么多？",
    "22": 'MySQL 有哪些\u201c饮鸩止渴\u201d提高性能的方法？',
    "23": "MySQL 是怎么保证数据不丢的？",
    "24": "MySQL 是怎么保证主备一致的？",
    "25": "MySQL 是怎么保证高可用的？",
    "26": "备库为什么会延迟好几个小时？",
    "27": "主库出问题了，从库怎么办？",
    "28": "读写分离有哪些坑？",
    "29": "如何判断一个数据库是不是出问题了？",
    "30": "答疑文章（二）：用动态的观点看加锁",
    "31": "误删数据后除了跑路，还能怎么办？",
    "32": "为什么还有 kill 不掉的语句？",
    "33": "我查这么多数据，会不会把数据库内存打爆？",
    "34": "到底可不可以使用 join？",
    "35": "join 语句怎么优化？",
    "36": "为什么临时表可以重名？",
    "37": "什么时候会使用内部临时表？",
    "38": "都说 InnoDB 好，那还要不要使用 Memory 引擎？",
    "39": "自增主键为什么不是连续的？",
    "40": "insert 语句的锁为什么这么多？",
    "41": "怎么最快地复制一张表？",
    "42": "grant 之后要跟着 flush privileges 吗？",
    "43": "要不要使用分区表？",
    "44": "答疑文章（三）：说一说这些好问题",
    "45": "自增 id 用完怎么办？",
    "46": "结束语：点线网面，一起构建 MySQL 知识网络",
}

# Thematic grouping: (group_slug, group_title, lecture_numbers)
GROUPS = [
    ("basics", "基础架构与日志", ["00", "01", "02", "15"]),
    ("index-chapter", "索引原理与优化", ["03", "04", "05", "09", "10", "11"]),
    ("lock-transaction", "锁与事务", ["06", "07", "08", "19", "20", "21", "30"]),
    ("flush-io", "数据页与 IO", ["12", "13", "23"]),
    ("query-optimization", "SQL 查询优化", ["14", "16", "17", "18", "33", "34", "35", "36", "37"]),
    ("high-availability", "高可用与主从复制", ["22", "24", "25", "26", "27", "28", "29"]),
    ("operation-maintenance", "运维与故障处理", ["31", "32"]),
    ("engine-advanced", "引擎与进阶", ["38", "39", "40", "41", "42", "43", "44", "45", "46"]),
]


class ArticleExtractor(HTMLParser):
    """Extract article-content div from Geek Time HTML."""

    def __init__(self):
        super().__init__()
        self.in_article = False
        self.depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get("class", "")
        if "article-content" in cls:
            self.in_article = True
            self.depth = 0
            return
        if self.in_article:
            self.depth += 1
            # Reconstruct HTML tag
            attr_str = ""
            for k, v in attrs:
                if v is not None:
                    attr_str += f' {k}="{v}"'
                else:
                    attr_str += f" {k}"
            self.parts.append(f"<{tag}{attr_str}>")

    def handle_endtag(self, tag):
        if self.in_article:
            if self.depth <= 0:
                self.in_article = False
            else:
                self.depth -= 1
                self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        if self.in_article:
            self.parts.append(data)

    def handle_entityref(self, name):
        if self.in_article:
            self.parts.append(f"&{name};")

    def handle_charref(self, name):
        if self.in_article:
            self.parts.append(f"&#{name};")

    def get_html(self):
        return "".join(self.parts)


def extract_article_html(filepath):
    """Extract inner HTML of the article-content div."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    parser = ArticleExtractor()
    parser.feed(content)
    return parser.get_html()


def html_to_markdown(html_content):
    """Convert HTML to clean Markdown."""
    h = html2text.HTML2Text()
    h.body_width = 0  # Don't wrap
    h.protect_links = True
    h.unicode_snob = True
    h.images_to_alt = False
    h.default_image_alt = ""
    h.skip_internal_links = False
    h.inline_links = True
    h.wrap_links = False
    h.wrap_list_items = False
    md = h.handle(html_content)
    return md


def clean_markdown(md, lecture_num):
    """Clean up converted Markdown."""
    # Remove ad watermark patterns
    ad_patterns = [
        r'【[^】]*(?:cunlove|CunWork|cunWork|精挑细选|良心整理|耗时整理|花费时间|手动整理|持续更新|优质合集|资源精选|整理不易|公重号|更多精选)[^】]*】',
        r'cunlove\.cn',
        r'CunWorkNotes',
        r'cunWorknotes',
    ]
    for pat in ad_patterns:
        md = re.sub(pat, '', md, flags=re.IGNORECASE)

    # Remove image links to geekbang CDN (they won't be accessible)
    # Keep the alt text if any
    md = re.sub(r'!\[([^\]]*)\]\(https?://static001\.geekbang\.org[^\)]+\)', r'<!-- image: \1 -->', md)

    # Clean up excessive blank lines
    md = re.sub(r'\n{4,}', '\n\n\n', md)

    # Clean up leading/trailing whitespace
    md = md.strip()

    # Remove lecture number prefix from content if it starts with it
    md = re.sub(r'^#+\s*\d+\s*\|\s*', '## ', md)

    return md


def process_single(lecture_num, dry_run=False):
    """Process a single lecture and return its Markdown content."""
    filename = CANONICAL.get(lecture_num)
    if not filename:
        print(f"  WARNING: No file for lecture {lecture_num}", file=sys.stderr)
        return None

    filepath = os.path.join(SRC_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  WARNING: File not found: {filepath}", file=sys.stderr)
        return None

    html = extract_article_html(filepath)
    if not html.strip():
        print(f"  WARNING: Empty article content for lecture {lecture_num}", file=sys.stderr)
        return None

    md = html_to_markdown(html)
    md = clean_markdown(md, lecture_num)

    title = CLEAN_TITLES.get(lecture_num, f"Lecture {lecture_num}")

    if dry_run:
        print(f"  Lecture {lecture_num}: {title}")
        print(f"    HTML length: {len(html)}, MD length: {len(md)}")
        print(f"    First 200 chars: {md[:200]}")
        print()

    return md


def build_group_file(group_slug, group_title, lecture_nums, dry_run=False):
    """Build a merged Markdown file for a thematic group."""
    parts = []

    for num in lecture_nums:
        title = CLEAN_TITLES.get(num, f"Lecture {num}")
        md = process_single(num, dry_run=False)
        if md:
            prefix = f"{num}. " if num not in ("00", "46") else ""
            parts.append(f"## {prefix}{title}\n\n{md}")

    if not parts:
        return None

    content = "\n\n---\n\n".join(parts)

    frontmatter = f"""---
title: "MySQL 实战 45 讲：{group_title}"
description: "极客时间《MySQL 实战 45 讲》—— {group_title}章节笔记整理"
---

# MySQL 实战 45 讲：{group_title}

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

"""

    return frontmatter + content


# File slug for each lecture (used in individual mode)
FILE_SLUGS = {
    "00": "00-preface",
    "01": "01-sql-query-execution",
    "02": "02-sql-update-log-system",
    "03": "03-transaction-isolation",
    "04": "04-index-part1",
    "05": "05-index-part2",
    "06": "06-global-table-lock",
    "07": "07-row-lock",
    "08": "08-transaction-isolation-detail",
    "09": "09-normal-vs-unique-index",
    "10": "10-wrong-index-selection",
    "11": "11-string-index",
    "12": "12-mysql-flush",
    "13": "13-table-space-reclaim",
    "14": "14-count-slow",
    "15": "15-qa-log-and-index",
    "16": "16-order-by",
    "17": "17-random-message",
    "18": "18-sql-same-logic-diff-perf",
    "19": "19-single-row-query-slow",
    "20": "20-phantom-read",
    "21": "21-single-row-update-many-locks",
    "22": "22-emergency-perf-boost",
    "23": "23-data-durability",
    "24": "24-master-slave-consistency",
    "25": "25-high-availability",
    "26": "26-slave-delay",
    "27": "27-master-failure",
    "28": "28-read-write-split-pitfalls",
    "29": "29-database-health-check",
    "30": "30-qa-dynamic-locking",
    "31": "31-data-recovery",
    "32": "32-unkillable-query",
    "33": "33-large-query-memory",
    "34": "34-join-usage",
    "35": "35-join-optimization",
    "36": "36-temp-table-rename",
    "37": "37-internal-temp-table",
    "38": "38-innodb-vs-memory-engine",
    "39": "39-auto-increment-gaps",
    "40": "40-insert-locks",
    "41": "41-fastest-table-copy",
    "42": "42-grant-flush-privileges",
    "43": "43-partition-table",
    "44": "44-qa-good-questions",
    "45": "45-auto-increment-overflow",
    "46": "46-conclusion",
}


def build_individual_file(lecture_num):
    """Build an individual Markdown file for a single lecture."""
    title = CLEAN_TITLES.get(lecture_num, f"Lecture {lecture_num}")
    md = process_single(lecture_num)
    if not md:
        return None

    prefix = f"{lecture_num}. " if lecture_num not in ("00", "46") else ""
    full_title = f"{prefix}{title}"

    frontmatter = f"""---
title: "MySQL 实战 45 讲：{full_title}"
description: "极客时间《MySQL 实战 45 讲》第 {lecture_num} 讲笔记整理"
---

# {full_title}

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

"""
    return frontmatter + md


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "split"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "/Users/kingford/workspace/github.com/knowledge/docs/mysql"

    if mode == "test":
        print("=== Testing extraction on lectures 01, 02, 03 ===\n")
        for num in ["01", "02", "03"]:
            process_single(num, dry_run=True)
        return

    if mode == "split":
        os.makedirs(out_dir, exist_ok=True)
        for num, slug in sorted(FILE_SLUGS.items()):
            title = CLEAN_TITLES.get(num, f"Lecture {num}")
            print(f"  [{num}] {title} -> {slug}.md ...")
            content = build_individual_file(num)
            if content:
                outpath = os.path.join(out_dir, f"{slug}.md")
                with open(outpath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"       OK ({len(content)} chars)")
            else:
                print(f"       SKIPPED")
        print(f"\nDone! {len(FILE_SLUGS)} files written to: {out_dir}")

    if mode == "build":
        os.makedirs(OUT_DIR, exist_ok=True)
        for group_slug, group_title, lecture_nums in GROUPS:
            print(f"Building {group_slug}: {group_title} ({len(lecture_nums)} lectures)...")
            content = build_group_file(group_slug, group_title, lecture_nums)
            if content:
                outpath = os.path.join(OUT_DIR, f"{group_slug}.md")
                with open(outpath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"  -> {outpath} ({len(content)} chars)")
            else:
                print(f"  -> SKIPPED (no content)")
        print("\nDone! All files written to:", OUT_DIR)


if __name__ == "__main__":
    main()
