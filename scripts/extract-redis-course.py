#!/usr/bin/env python3
"""Extract GeekTime Redis course HTML files into Markdown for VitePress."""

from __future__ import annotations

import html as html_std
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from lxml import html


SRC_DIR = Path("/Users/kingford/Documents/极客时间-专栏课-蒋德钧-Redis核心技术与实战")
OUT_DIR = Path("/Users/kingford/workspace/github.com/knowledge/docs/redis/course")


@dataclass(frozen=True)
class LectureSpec:
    match_key: str
    slug: str
    group: str
    diagram_md: str = ""


GROUPS = [
    ("opening", "开篇词"),
    ("foundation", "基础篇（01-10）"),
    ("practice", "实践篇（11-38）"),
    ("future", "未来篇（39-41）"),
    ("extras", "加餐篇（42-48）"),
    ("exam", "期中测试（49-50）"),
    ("conclusion", "结束语"),
]


LECTURES: list[LectureSpec] = [
    LectureSpec("这样学Redis，才能技高一筹", "00-preface", "opening"),
    LectureSpec("基本架构：一个键值数据库包含什么", "01-basic-architecture", "foundation", '<RedisCourseDiagram kind="simplekv-overview" />'),
    LectureSpec("数据结构：快速的Redis有哪些慢操作", "02-slow-operations", "foundation"),
    LectureSpec("高性能IO模型：为什么单线程Redis能那么快", "03-high-performance-io", "foundation", '<RedisCourseDiagram kind="io-multiplexing" />'),
    LectureSpec("AOF日志：宕机了，Redis如何避免数据丢失", "04-aof-log", "foundation"),
    LectureSpec("内存快照：宕机后，Redis如何实现快速恢复", "05-rdb-snapshot", "foundation"),
    LectureSpec("数据同步：主从库如何实现数据一致", "06-replication-consistency", "foundation", '<RedisCourseDiagram kind="replication-flow" />'),
    LectureSpec("哨兵机制：主库挂了，如何不间断服务", "07-sentinel-mechanism", "foundation", '<RedisCourseDiagram kind="sentinel-failover" />'),
    LectureSpec("哨兵集群：哨兵挂了，主从库还能切换吗", "08-sentinel-cluster", "foundation"),
    LectureSpec("切片集群：数据增多了，是该加内存还是加实例", "09-cluster-sharding", "foundation", '<RedisCourseDiagram kind="cluster-sharding" />'),
    LectureSpec("第1～9讲课后思考题答案及常见问题答疑", "10-foundation-qa", "foundation"),
    LectureSpec("“万金油”的String，为什么不好用了", "11-string-pitfalls", "practice"),
    LectureSpec("有一亿个keys要统计，应该用哪种集合", "12-billion-keys-set-selection", "practice"),
    LectureSpec("GEO是什么？还可以定义新的数据类型吗", "13-geo-and-custom-types", "practice"),
    LectureSpec("如何在Redis中保存时间序列数据", "14-time-series-data", "practice"),
    LectureSpec("消息队列的考验：Redis有哪些解决方案", "15-message-queue-solutions", "practice", '<RedisCourseDiagram kind="message-queue-options" />'),
    LectureSpec("异步机制：如何避免单线程模型的阻塞", "16-async-mechanism", "practice"),
    LectureSpec("为什么CPU结构也会影响Redis的性能", "17-cpu-architecture-impact", "practice"),
    LectureSpec("波动的响应延迟：如何应对变慢的Redis？（上）", "18-latency-spike-part1", "practice"),
    LectureSpec("波动的响应延迟：如何应对变慢的Redis？（下）", "19-latency-spike-part2", "practice"),
    LectureSpec("删除数据后，为什么内存占用率还是很高", "20-memory-after-delete", "practice"),
    LectureSpec("缓冲区：一个可能引发“惨案”的地方", "21-buffer-risks", "practice"),
    LectureSpec("第11～21讲课后思考题答案及常见问题答疑", "22-practice-qa-1", "practice"),
    LectureSpec("旁路缓存：Redis是如何工作的", "23-cache-aside", "practice", '<GoDataCacheDiagram kind="cache-aside" />'),
    LectureSpec("替换策略：缓存满了怎么办", "24-eviction-policy", "practice"),
    LectureSpec("缓存异常（上）：如何解决缓存和数据库的数据不一致问题", "25-cache-consistency", "practice", '<GoDataCacheDiagram kind="double-delete" />'),
    LectureSpec("缓存异常（下）：如何解决缓存雪崩、击穿、穿透难题", "26-cache-anomalies", "practice", '<GoDataCacheDiagram kind="cache-avalanche" />'),
    LectureSpec("缓存被污染了，该怎么办", "27-cache-pollution", "practice"),
    LectureSpec("Pika如何基于SSD实现大容量Redis", "28-pika-ssd", "practice"),
    LectureSpec("无锁的原子操作：Redis如何应对并发访问", "29-atomic-operations", "practice"),
    LectureSpec("如何使用Redis实现分布式锁", "30-distributed-lock", "practice", '<GoDataCacheDiagram kind="redis-distributed-lock" />'),
    LectureSpec("事务机制：Redis能实现ACID属性吗", "31-transaction-acid", "practice", '<RedisCourseDiagram kind="transaction-semantics" />'),
    LectureSpec("Redis主从同步与故障切换，有哪些坑", "32-replication-failover-pitfalls", "practice"),
    LectureSpec("脑裂：一次奇怪的数据丢失", "33-split-brain-data-loss", "practice", '<RedisCourseDiagram kind="split-brain" />'),
    LectureSpec("第23~33讲课后思考题答案及常见问题答疑", "34-practice-qa-2", "practice"),
    LectureSpec("Codis VS Redis Cluster：我该选择哪一个集群方案", "35-codis-vs-redis-cluster", "practice"),
    LectureSpec("Redis支撑秒杀场景的关键技术和实践都有哪些", "36-seckill-practice", "practice"),
    LectureSpec("数据分布优化：如何应对数据倾斜", "37-data-skew", "practice"),
    LectureSpec("通信开销：限制Redis Cluster规模的关键因素", "38-cluster-communication-overhead", "practice"),
    LectureSpec("Redis 6.0的新特性：多线程、客户端缓存与安全", "39-redis6-new-features", "future", '<RedisCourseDiagram kind="redis6-features" />'),
    LectureSpec("Redis的下一步：基于NVM内存的实践", "40-nvm-practice", "future"),
    LectureSpec("第35～40讲课后思考题答案及常见问题答疑", "41-future-qa", "future"),
    LectureSpec("经典的Redis学习资料有哪些", "42-extra-learning-resources", "extras"),
    LectureSpec("Kaito：我是如何学习Redis的", "43-extra-learning-method", "extras"),
    LectureSpec("Kaito：我希望成为在压力中成长的人", "44-extra-growth-under-pressure", "extras"),
    LectureSpec("Redis客户端如何与服务器端交换命令和数据", "45-extra-client-server-protocol", "extras"),
    LectureSpec("Redis有哪些好用的运维工具", "46-extra-ops-tools", "extras"),
    LectureSpec("Redis的使用规范小建议", "47-extra-usage-guidelines", "extras"),
    LectureSpec("从微博的Redis实践中，我们可以学到哪些经验", "48-extra-weibo-practice", "extras"),
    LectureSpec("期中测试题丨一套习题，测出你的掌握程度", "49-midterm-quiz", "exam"),
    LectureSpec("期中测试题答案丨这些问题，你都答对了吗", "50-midterm-quiz-answers", "exam"),
    LectureSpec("结束语", "51-conclusion", "conclusion"),
]


AD_PATTERNS = [
    r"【[^】]*(?:cunlove|CunWork|cunWork|精挑细选|良心整理|耗时整理|花费时间|手动整理|持续更新|优质合集|资源精选|整理不易|公重号|更多精选|拼课微信)[^】]*】",
    r"加微信：\d+[^\n]*",
    r"1716143\s+665\s+拼课微信",
    r"cunlove\.cn",
    r"cunloVe\.cn",
    r"cunWorknotes",
    r"CunWorkNotes",
]


TITLE_SPLIT_RE = re.compile(r"\s*[|丨]\s*")
NUMERIC_TITLE_RE = re.compile(r"^(?P<num>\d{2})\s*[：:、.．]\s*(?P<rest>.+)$")


IMAGE_REPLACEMENTS: dict[str, dict[int, str]] = {
    "01-basic-architecture": {
        1: '<RedisCourseFigure kind="simplekv-modules" />',
        2: '<RedisCourseFigure kind="simplekv-to-redis" />',
    },
    "03-high-performance-io": {
        1: '<RedisCourseFigure kind="io-throughput-threads" />',
        2: '<RedisCourseFigure kind="io-lock-contention" />',
        3: '<RedisCourseFigure kind="io-single-thread-path" />',
        4: '<RedisCourseFigure kind="io-socket-types" />',
        5: '<RedisCourseFigure kind="io-epoll-loop" />',
    },
    "04-aof-log": {
        1: '<RedisCourseFigure kind="aof-write-after" />',
        2: '<RedisCourseFigure kind="aof-command-format" />',
        3: '<RedisCourseFigure kind="aof-fsync-policies" />',
        4: '<RedisCourseFigure kind="aof-rewrite-compression" />',
        5: '<RedisCourseFigure kind="aof-rewrite-two-logs" />',
    },
    "05-rdb-snapshot": {
        1: '<RedisCourseFigure kind="rdb-cow-snapshot" />',
        2: '<RedisCourseFigure kind="rdb-snapshot-interval" />',
        3: '<RedisCourseFigure kind="rdb-incremental-metadata" />',
        4: '<RedisCourseFigure kind="rdb-aof-hybrid" />',
    },
    "06-replication-consistency": {
        1: '<RedisCourseFigure kind="replication-read-write-split" />',
        2: '<RedisCourseFigure kind="replication-full-sync-stages" />',
        3: '<RedisCourseFigure kind="replication-cascade" />',
        4: '<RedisCourseFigure kind="replication-backlog-offsets" />',
        5: '<RedisCourseFigure kind="replication-incremental-resync" />',
    },
    "07-sentinel-mechanism": {
        1: '<RedisCourseFigure kind="sentinel-master-down" />',
        2: '<RedisCourseFigure kind="sentinel-three-tasks" />',
        3: '<RedisCourseFigure kind="sentinel-quorum" />',
        4: '<RedisCourseFigure kind="sentinel-filter-score" />',
        5: '<RedisCourseFigure kind="sentinel-offset-score" />',
    },
    "09-cluster-sharding": {
        1: '<RedisCourseFigure kind="cluster-shard-splitting" />',
        2: '<RedisCourseFigure kind="cluster-scale-up-out" />',
        3: '<RedisCourseFigure kind="cluster-slot-mapping" />',
        4: '<RedisCourseFigure kind="cluster-moved" />',
        5: '<RedisCourseFigure kind="cluster-ask" />',
    },
    "30-distributed-lock": {
        1: '<RedisCourseFigure kind="lock-compete" />',
        2: '<RedisCourseFigure kind="lock-release" />',
    },
    "33-split-brain-data-loss": {
        1: '<RedisCourseFigure kind="split-brain-unsynced-loss" />',
        2: '<RedisCourseFigure kind="split-brain-formation" />',
        3: '<RedisCourseFigure kind="split-brain-resync-loss" />',
    },
}


def normalize_space(text: str) -> str:
    text = html_std.unescape(text).replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def render_plain(node) -> str:
    parts: list[str] = []
    if node.text:
        parts.append(node.text)
    for child in node:
        parts.append(render_plain(child))
        if child.tail:
            parts.append(child.tail)
    return normalize_space("".join(parts))


def render_inline(node, code_mode: bool = False) -> str:
    parts: list[str] = []

    if node.text:
        parts.append(node.text)

    for child in node:
        child_type = child.attrib.get("data-slate-type")
        content = render_inline(child, code_mode=code_mode)

        if code_mode:
            parts.append(content)
        elif child_type == "bold":
            parts.append(f"**{content}**")
        elif child_type in {"code", "mark-class"}:
            parts.append(f"`{content}`")
        elif child_type == "primary":
            parts.append(f"**{content}**")
        elif child_type == "link":
            href = child.get("href") or child.get("data-savepage-href") or child.get("data-savepage-src")
            if href:
                parts.append(f"[{content}]({href})")
            else:
                parts.append(content)
        else:
            parts.append(content)

        if child.tail:
            parts.append(child.tail)

    return normalize_space("".join(parts))


def detect_code_language(lines: Iterable[str]) -> str:
    joined = "\n".join(lines).strip()
    lowered = joined.lower()

    if not joined:
        return ""
    if any(line.startswith(("redis>", "127.0.0.1:", "$", "#")) for line in joined.splitlines()):
        return "bash"
    if re.search(r"\b(?:put|get|delete|scan|set|mset|lpush|lpop|sadd|srem|zadd|xadd|hmset|hset|appendonly|save)\b", lowered):
        return "bash"
    if any(token in lowered for token in ("struct ", "typedef ", "malloc", "free(", "socket", "{", "}")):
        return "c"
    return ""


def render_list_block(node, quote: bool = False) -> str:
    lines: list[str] = []
    for item in node.xpath('./*[@data-slate-type="list-line"]'):
        content = render_inline(item)
        prefix = "> - " if quote else "- "
        lines.append(prefix + content)
    return "\n".join(line for line in lines if line.strip())


def render_blockquote(node) -> str:
    lines: list[str] = []
    for quote_line in node.xpath('./*[@data-slate-type="quote-line"]'):
        nested_list = quote_line.xpath('./*[@data-slate-type="list"]')
        if nested_list:
            for list_node in nested_list:
                list_block = render_list_block(list_node, quote=True)
                if list_block:
                    lines.extend(list_block.splitlines())
            continue
        text = render_inline(quote_line)
        if text:
            lines.append("> " + text)
    return "\n".join(line for line in lines if line.strip())


def render_pre(node) -> str:
    code_lines = [render_plain(line) for line in node.xpath('.//*[@data-slate-type="code-line"]')]
    code_lines = [line for line in code_lines if line]
    if not code_lines:
        text = render_plain(node)
        code_lines = [text] if text else []
    language = detect_code_language(code_lines)
    fence = "```" + language if language else "```"
    return "\n".join([fence, *code_lines, "```"])


def render_image(node, image_index: int, image_replacements: dict[int, str]) -> str:
    replacement = image_replacements.get(image_index)
    if replacement:
        return replacement

    img = node.xpath(".//img")
    if not img:
        return ""
    src = img[0].get("data-savepage-src") or img[0].get("src", "")
    if not src or src.startswith("data:image/"):
        return f"<!-- 原文配图 {image_index} -->"
    return f"![原文配图 {image_index}]({src})"


def render_blocks(article_root, image_replacements: dict[int, str]) -> str:
    rendered: list[str] = []
    image_index = 0

    for node in article_root.xpath(".//*[@data-slate-type]"):
        node_type = node.attrib.get("data-slate-type")
        parent_type = node.getparent().attrib.get("data-slate-type") if node.getparent() is not None else None

        if node_type == "paragraph":
            text = render_inline(node)
            if text:
                rendered.append(text)
        elif node_type == "heading":
            level = node.tag.lower()
            prefix = {"h2": "##", "h3": "###", "h4": "####"}.get(level, "##")
            text = render_inline(node)
            if text:
                rendered.append(f"{prefix} {text}")
        elif node_type == "pre":
            block = render_pre(node)
            if block:
                rendered.append(block)
        elif node_type == "list":
            if parent_type in {"quote-line", "block-quote"}:
                continue
            block = render_list_block(node)
            if block:
                rendered.append(block)
        elif node_type == "block-quote":
            block = render_blockquote(node)
            if block:
                rendered.append(block)
        elif node_type == "image":
            image_index += 1
            rendered.append(render_image(node, image_index, image_replacements))
        elif node_type == "hr":
            rendered.append("---")

    content = "\n\n".join(chunk for chunk in rendered if chunk.strip())
    return cleanup_markdown(content)


def cleanup_markdown(content: str) -> str:
    for pattern in AD_PATTERNS:
        content = re.sub(pattern, "", content, flags=re.IGNORECASE)

    content = re.sub(r"(?m)^\s*\*{4,}\s*$\n?", "", content)
    content = re.sub(r"\n{3,}", "\n\n", content)
    content = re.sub(r"[ \t]+\n", "\n", content)
    content = content.replace("RedisCluster", "Redis Cluster")
    content = content.replace("RRedis 6.0", "Redis 6.0")
    return content.strip() + "\n"


def clean_title(raw_title: str) -> str:
    title = normalize_space(raw_title)
    title = title.replace("RRedis 6.0", "Redis 6.0")
    title = title.replace("RedisCluster", "Redis Cluster")
    title = title.replace("  ", " ")
    return title


def split_title_parts(cleaned_title: str) -> tuple[str, str]:
    parts = TITLE_SPLIT_RE.split(cleaned_title, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()

    match = NUMERIC_TITLE_RE.match(cleaned_title)
    if match:
        return match.group("num"), match.group("rest").strip()

    return "", cleaned_title


def build_page_title(cleaned_title: str) -> str:
    left, right = split_title_parts(cleaned_title)
    if re.fullmatch(r"\d{2}", left):
        return f"{left}. {right}"
    if left:
        return f"{left}：{right}"
    return cleaned_title


def build_frontmatter_title(cleaned_title: str) -> str:
    page_title = build_page_title(cleaned_title)
    return f"Redis 核心技术与实战：{page_title}"


def build_description(cleaned_title: str) -> str:
    return f"极客时间《Redis 核心技术与实战》{build_page_title(cleaned_title)} 笔记整理"


def find_source_html(match_key: str, html_files: list[Path]) -> Path:
    for file in html_files:
        if match_key in file.name:
            return file
    raise FileNotFoundError(f"Could not find HTML file for: {match_key}")


def build_page(spec: LectureSpec, source_html: Path) -> tuple[str, str, str]:
    root = html.fromstring(source_html.read_text(encoding="utf-8", errors="ignore"))
    raw_title = root.xpath("string(//h1[1])")
    cleaned_title = clean_title(raw_title)
    page_h1 = build_page_title(cleaned_title)

    article_root = root.xpath('//*[@data-slate-type="paragraph"][1]/ancestor::div[contains(@class,"_1Bj6HN3x_0")][1]')[0]
    content = render_blocks(article_root, IMAGE_REPLACEMENTS.get(spec.slug, {}))

    note = "> 本文整理自极客时间《Redis 核心技术与实战》（蒋德钧），仅用于个人学习笔记。"
    lead_blocks = [note]
    if spec.diagram_md:
        lead_blocks.append(spec.diagram_md)
    lead = "\n\n".join(lead_blocks)

    body = (
        f"---\n"
        f'title: "{build_frontmatter_title(cleaned_title)}"\n'
        f'description: "{build_description(cleaned_title)}"\n'
        f"---\n\n"
        f"# {page_h1}\n\n"
        f"{lead}\n\n"
        f"{content}"
    )

    return cleaned_title, page_h1, body


def course_intro() -> str:
    return """---
title: Redis 核心技术与实战
description: 极客时间《Redis 核心技术与实战》按讲整理，覆盖基础篇、实践篇、未来篇、加餐篇与期中测试。
---

# Redis 核心技术与实战

> 整理自极客时间《Redis 核心技术与实战》（蒋德钧），按章节收敛到 `Redis` 专题，方便和缓存治理、客户端源码、高并发案例一起串读。

<RedisCourseDiagram kind="course-map" />

## 这套课程解决什么问题

- 用一条清晰主线把 Redis 的基础架构、持久化、复制、高可用、缓存治理和工程实践串起来
- 把“会用 Redis”推进到“知道为什么这样设计、出了问题该怎么排查”
- 让 `Redis` 专题里的通用实践文档和极客时间课程笔记形成互补

## 内容结构
"""


def build_course_index(lecture_rows: list[tuple[LectureSpec, str, str]]) -> str:
    lines = [course_intro()]
    rows_by_group: dict[str, list[tuple[LectureSpec, str, str]]] = {key: [] for key, _ in GROUPS}
    for spec, cleaned_title, page_h1 in lecture_rows:
        rows_by_group[spec.group].append((spec, cleaned_title, page_h1))

    for group_key, group_title in GROUPS:
        lines.append(f"\n### {group_title}\n")
        lines.append("| # | 标题 |")
        lines.append("| --- | --- |")
        for spec, cleaned_title, page_h1 in rows_by_group[group_key]:
            label, title = split_title_parts(cleaned_title)
            if not label:
                label = page_h1
                title = page_h1
            lines.append(f"| {label} | [{title}](./{spec.slug}.md) |")

    lines.append(
        """

## 建议阅读顺序

1. 先看开篇词和基础篇 `01-09`，把 Redis 的整体架构、IO 模型、持久化、复制和哨兵体系搭起来。
2. 再看实践篇 `11-21`，理解不同数据类型、异步机制、CPU 结构和延迟抖动这些“为什么会慢”的根因。
3. 然后读 `23-33`，把缓存治理、分布式锁、事务、故障切换和脑裂这些生产问题串起来。
4. 最后补 `35-40` 和加餐篇，把集群选型、秒杀实践、Redis 6.0、新硬件方向与运维经验补齐。

## 结合本专题一起看

- [Redis 专题总览](../index.md)
- [Redis 实践与缓存穿透/击穿/雪崩](../redis-and-cache-patterns.md)
- [Redis 高并发、集群部署与分布式锁](../high-concurrency-cluster-locks.md)
- [go-redis 客户端源码精读](/golang/guide/source-reading/go-redis)
- [支付系统 Redis 实战](../payment-practice.md)
"""
    )

    return "\n".join(lines).strip() + "\n"


def main() -> None:
    html_files = sorted(SRC_DIR.rglob("*.html"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    lecture_rows: list[tuple[LectureSpec, str, str]] = []

    for spec in LECTURES:
        source_html = find_source_html(spec.match_key, html_files)
        cleaned_title, page_h1, body = build_page(spec, source_html)
        lecture_rows.append((spec, cleaned_title, page_h1))
        output_path = OUT_DIR / f"{spec.slug}.md"
        output_path.write_text(body, encoding="utf-8")
        print(f"generated {output_path.relative_to(OUT_DIR.parent.parent)}")

    index_content = build_course_index(lecture_rows)
    (OUT_DIR / "index.md").write_text(index_content, encoding="utf-8")
    print(f"generated {OUT_DIR.relative_to(OUT_DIR.parent.parent) / 'index.md'}")


if __name__ == "__main__":
    main()
