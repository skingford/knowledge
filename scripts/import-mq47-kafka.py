#!/usr/bin/env python3
"""Import GeekTime MQ 47 notes into the Kafka topic docs."""

from __future__ import annotations

import re
from pathlib import Path

SOURCE_DIR = Path("/Users/kingford/Documents/288-100552001-专栏课-徐文强-深入拆解消息队列47讲（完结）")
TARGET_DIR = Path("/Users/kingford/workspace/github.com/knowledge/docs/kafka")

SOURCE_NOTE = "> 本文整理自极客时间《深入拆解消息队列 47 讲》（徐文强），仅用于个人学习笔记。"
IMAGE_NOTE = "> 说明：原始章节中的位图示意已按需省略，关键 Kafka 章节补充为站内 SVG 图例，便于后续持续维护。"

AD_PATTERNS = [
    r"【[^】]*(?:cunlove|CunWork|cunWork|精挑细选|良心整理|耗时整理|花费时间|手动整理|持续更新|优质合集|资源精选|整理不易|公众号|更多精选|免费获取|免费开放|免费奉上|免费提供|解锁|关注)[^】]*】",
    r"cunlove\.cn",
    r"CunWorkNotes",
    r"cunWorknotes",
]

CHAPTERS = [
    {
        "num": "00",
        "source_prefix": "开篇词｜",
        "slug": "00-preface",
        "title": "开篇词：深度拆解核心原理，轻松掌握所有消息队列",
        "description": "极客时间《深入拆解消息队列 47 讲》开篇词笔记整理",
        "diagram": "overview",
    },
    {
        "num": "01",
        "source_prefix": "01｜",
        "slug": "01-mq-evolution",
        "title": "业界的主流消息队列是如何发展起来的？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 01 讲笔记整理",
    },
    {
        "num": "02",
        "source_prefix": "02｜",
        "slug": "02-mq-concepts",
        "title": "消息队列在架构和功能层面都包含哪些概念？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 02 讲笔记整理",
        "diagram": "core-concepts",
    },
    {
        "num": "03",
        "source_prefix": "03｜",
        "slug": "03-protocol-design",
        "title": "通信协议：如何设计一个好的通信协议？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 03 讲笔记整理",
    },
    {
        "num": "04",
        "source_prefix": "04｜",
        "slug": "04-network-module",
        "title": "网络：如何设计高性能的网络模块？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 04 讲笔记整理",
    },
    {
        "num": "05",
        "source_prefix": "05｜",
        "slug": "05-storage-model",
        "title": "存储：消息数据和元数据的存储是如何设计的？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 05 讲笔记整理",
    },
    {
        "num": "06",
        "source_prefix": "06｜",
        "slug": "06-storage-reliability",
        "title": "存储：如何提升存储模块的性能和可靠性？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 06 讲笔记整理",
    },
    {
        "num": "07",
        "source_prefix": "07｜",
        "slug": "07-producer-sdk",
        "title": "生产端：生产者客户端的 SDK 有哪些设计要点？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 07 讲笔记整理",
    },
    {
        "num": "08",
        "source_prefix": "08｜",
        "slug": "08-consumer-sdk-part1",
        "title": "消费端：消费者客户端的 SDK 有哪些设计要点？（上）",
        "description": "极客时间《深入拆解消息队列 47 讲》第 08 讲笔记整理",
        "diagram": "consumer-group-rebalance",
    },
    {
        "num": "09",
        "source_prefix": "09｜",
        "slug": "09-consumer-sdk-part2",
        "title": "消费端：消费者客户端的 SDK 有哪些设计要点？（下）",
        "description": "极客时间《深入拆解消息队列 47 讲》第 09 讲笔记整理",
    },
    {
        "num": "10",
        "source_prefix": "10｜",
        "slug": "10-rabbitmq-basic-architecture",
        "title": "从基础功能拆解 RabbitMQ 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 10 讲笔记整理",
    },
    {
        "num": "11",
        "source_prefix": "11｜",
        "slug": "11-rocketmq-basic-architecture",
        "title": "从基础功能拆解 RocketMQ 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 11 讲笔记整理",
    },
    {
        "num": "12",
        "source_prefix": "12｜",
        "slug": "12-kafka-basic-architecture",
        "title": "从基础功能拆解 Kafka 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 12 讲笔记整理",
        "diagram": "core-concepts",
    },
    {
        "num": "13",
        "source_prefix": "13｜",
        "slug": "13-pulsar-basic-architecture",
        "title": "从基础功能拆解 Pulsar 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 13 讲笔记整理",
    },
    {
        "num": "14",
        "source_prefix": "14｜",
        "slug": "14-cluster-bottlenecks",
        "title": "集群：哪些环节会存在性能瓶颈和数据可靠性风险？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 14 讲笔记整理",
    },
    {
        "num": "15",
        "source_prefix": "15｜",
        "slug": "15-cluster-construction-part1",
        "title": "集群：如何构建分布式的消息队列集群？（上）",
        "description": "极客时间《深入拆解消息队列 47 讲》第 15 讲笔记整理",
    },
    {
        "num": "16",
        "source_prefix": "16｜",
        "slug": "16-cluster-construction-part2",
        "title": "集群：如何构建分布式的消息队列集群？（下）",
        "description": "极客时间《深入拆解消息队列 47 讲》第 16 讲笔记整理",
    },
    {
        "num": "17",
        "source_prefix": "17｜",
        "slug": "17-consistency-patterns",
        "title": "可靠性：分布式集群的数据一致性都有哪些实现方案",
        "description": "极客时间《深入拆解消息队列 47 讲》第 17 讲笔记整理",
        "diagram": "replication-hw",
    },
    {
        "num": "18",
        "source_prefix": "18｜",
        "slug": "18-java-performance-techniques",
        "title": "性能：Java 开发分布式存储系统都有哪些常用的编码技巧？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 18 讲笔记整理",
    },
    {
        "num": "19",
        "source_prefix": "19｜",
        "slug": "19-auth-authz-encryption",
        "title": "安全：身份认证、资源鉴权和加密传输都是怎么实现的？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 19 讲笔记整理",
    },
    {
        "num": "20",
        "source_prefix": "20｜",
        "slug": "20-rate-limiting",
        "title": "安全：如何设计高吞吐和大流量分布式集群的限流方案？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 20 讲笔记整理",
    },
    {
        "num": "21",
        "source_prefix": "21｜",
        "slug": "21-monitoring-system",
        "title": "可观测性：如何设计实现一个好用的分布式监控体系？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 21 讲笔记整理",
    },
    {
        "num": "22",
        "source_prefix": "22｜",
        "slug": "22-message-trace",
        "title": "可观测性：如何设计实现消息轨迹功能？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 22 讲笔记整理",
    },
    {
        "num": "23",
        "source_prefix": "23｜",
        "slug": "23-rabbitmq-cluster-architecture",
        "title": "从集群角度拆解 RabbitMQ 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 23 讲笔记整理",
    },
    {
        "num": "24",
        "source_prefix": "24｜",
        "slug": "24-rocketmq-cluster-architecture",
        "title": "从集群角度拆解 RocketMQ 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 24 讲笔记整理",
    },
    {
        "num": "25",
        "source_prefix": "25｜",
        "slug": "25-kafka-cluster-architecture",
        "title": "从集群角度拆解 Kafka 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 25 讲笔记整理",
        "diagram": "replication-hw",
    },
    {
        "num": "26",
        "source_prefix": "26｜",
        "slug": "26-pulsar-cluster-architecture",
        "title": "从集群角度拆解 Pulsar 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 26 讲笔记整理",
    },
    {
        "num": "27",
        "source_prefix": "27｜",
        "slug": "27-topic-partition-subscription",
        "title": "基础功能：Topic、分区、订阅等基本功能是如何实现的？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 27 讲笔记整理",
        "diagram": "consumer-group-rebalance",
    },
    {
        "num": "28",
        "source_prefix": "28｜",
        "slug": "28-ordering-and-idempotency",
        "title": "顺序消息和幂等：如何实现顺序消息和数据幂等？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 28 讲笔记整理",
        "diagram": "partition-routing",
    },
    {
        "num": "29",
        "source_prefix": "29｜",
        "slug": "29-delay-messages",
        "title": "延时消息：如何实现高性能的定时-延时消息？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 29 讲笔记整理",
        "diagram": "delay-queue-patterns",
    },
    {
        "num": "30",
        "source_prefix": "30｜",
        "slug": "30-transaction-messages",
        "title": "事务消息：如何实现一个完整的事务消息模块？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 30 讲笔记整理",
        "diagram": "offset-transaction",
    },
    {
        "num": "31",
        "source_prefix": "31｜",
        "slug": "31-dlq-and-priority-queue",
        "title": "死信队列和优先级队列：如何实现死信队列和优先级队列？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 31 讲笔记整理",
        "diagram": "retry-dlq",
    },
    {
        "num": "32",
        "source_prefix": "32｜",
        "slug": "32-message-query",
        "title": "消息查询：如何实现消息查询功能？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 32 讲笔记整理",
    },
    {
        "num": "33",
        "source_prefix": "33｜",
        "slug": "33-schema-module",
        "title": "Schema：如何设计实现 Schema 模块？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 33 讲笔记整理",
    },
    {
        "num": "34",
        "source_prefix": "34｜",
        "slug": "34-websocket-support",
        "title": "WebSocket：如何在消息队列内核中支持 WebSocket？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 34 讲笔记整理",
    },
    {
        "num": "35",
        "source_prefix": "35｜",
        "slug": "35-advanced-features-comparison",
        "title": "从高级功能拆解 4 款主流 MQ 的架构设计与实现",
        "description": "极客时间《深入拆解消息队列 47 讲》第 35 讲笔记整理",
    },
    {
        "num": "36",
        "source_prefix": "36｜",
        "slug": "36-cloud-native-compute-storage-separation",
        "title": "云原生：业界 MQ 的计算存储分离是如何实现的？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 36 讲笔记整理",
    },
    {
        "num": "37",
        "source_prefix": "37｜",
        "slug": "37-tiered-storage",
        "title": "云原生：MQ 的分层存储架构都有哪些实现方案？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 37 讲笔记整理",
    },
    {
        "num": "38",
        "source_prefix": "38｜",
        "slug": "38-serverless-stream-processing",
        "title": "Serverless：如何基于 Serverless 架构实现流式数据处理？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 38 讲笔记整理",
    },
    {
        "num": "39",
        "source_prefix": "39｜",
        "slug": "39-serverless-event-driven",
        "title": "Serverless：如何基于 MQ 和 Serverless 设计事件驱动架构",
        "description": "极客时间《深入拆解消息队列 47 讲》第 39 讲笔记整理",
        "diagram": "case-study-bridge",
    },
    {
        "num": "40",
        "source_prefix": "40｜",
        "slug": "40-connectors-and-data-integration",
        "title": "连接器：如何以 MQ 为核心搭建数据集成架构？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 40 讲笔记整理",
    },
    {
        "num": "41",
        "source_prefix": "41｜",
        "slug": "41-cross-region-disaster-recovery",
        "title": "容灾：如何实现跨地域、跨可用区的容灾和同步？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 41 讲笔记整理",
        "diagram": "multi-active-dr",
    },
    {
        "num": "42",
        "source_prefix": "42｜",
        "slug": "42-message-platform",
        "title": "消息中台：如何搭建企业内部统一的消息服务？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 42 讲笔记整理",
    },
    {
        "num": "43",
        "source_prefix": "43｜",
        "slug": "43-future-architecture",
        "title": "未来：消息队列的技术架构会如何演进？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 43 讲笔记整理",
    },
    {
        "num": "44",
        "source_prefix": "44｜",
        "slug": "44-commercialization",
        "title": "商业化：消息队列的商业化应该怎么做？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 44 讲笔记整理",
    },
    {
        "num": "45",
        "source_prefix": "45｜",
        "slug": "45-becoming-a-domain-expert",
        "title": "研发经验：如何成为某个领域的专家？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 45 讲笔记整理",
    },
    {
        "num": "46",
        "source_prefix": "46｜",
        "slug": "46-product-mindset",
        "title": "客户成功：技术人如何打造产品思维？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 46 讲笔记整理",
    },
    {
        "num": "47",
        "source_prefix": "47｜",
        "slug": "47-large-scale-mq-operations",
        "title": "运维运营：如何运营好大规模商业化的消息队列集群？",
        "description": "极客时间《深入拆解消息队列 47 讲》第 47 讲笔记整理",
    },
    {
        "num": "48",
        "source_prefix": "结束语｜",
        "slug": "48-conclusion",
        "title": "结束语：尽最大的努力，做最好的自己",
        "description": "极客时间《深入拆解消息队列 47 讲》结束语笔记整理",
    },
]

NUMBER_TO_LINK = {item["num"]: f"./{item['slug']}.md" for item in CHAPTERS if item["num"].isdigit()}


def find_source(prefix: str) -> Path:
    matches = sorted(path for path in SOURCE_DIR.glob("*.md") if path.name.startswith(prefix))
    if not matches:
        raise FileNotFoundError(f"source file not found for prefix: {prefix}")
    return matches[0]


def clean_ads(text: str) -> str:
    for pattern in AD_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    return text


def strip_images(text: str) -> str:
    text = re.sub(r"^\s*!\[[^\]]*\]\((?:images|https?://)[^)]+\)\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"!\[[^\]]*\]\((?:images|https?://)[^)]+\)", "", text)
    return text


def rewrite_internal_links(text: str) -> str:
    def replace(match: re.Match[str]) -> str:
        label = match.group(1)
        number = match.group(2)
        target = NUMBER_TO_LINK.get(number)
        if not target:
            return match.group(0)
        return f"[{label}]({target})"

    return re.sub(r"\[(第(\d{2})[讲篇])\]\([^)]+\)", replace, text)


def normalize_heading(text: str, heading: str) -> str:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line.strip():
            if line.startswith("#"):
                lines[index] = f"# {heading}"
            else:
                lines.insert(index, f"# {heading}")
            break
    else:
        lines = [f"# {heading}"]
    return "\n".join(lines)


def normalize_spacing(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip() + "\n"


def build_document(item: dict[str, str], source_text: str) -> str:
    heading = item["title"] if item["num"] == "00" else f"{item['num']}. {item['title']}"
    text = clean_ads(source_text)
    text = strip_images(text)
    text = rewrite_internal_links(text)
    text = normalize_heading(text, heading)
    text = normalize_spacing(text)

    diagram = item.get("diagram")
    diagram_block = f"\n\n<KafkaDiagram kind=\"{diagram}\" />" if diagram else ""

    frontmatter = (
        "---\n"
        f"title: \"深入拆解消息队列 47 讲：{item['title']}\"\n"
        f"description: \"{item['description']}\"\n"
        "---\n\n"
    )

    intro = f"{SOURCE_NOTE}\n{IMAGE_NOTE}{diagram_block}\n"
    footer = "\n---\n\n## 继续阅读\n\n- [返回 Kafka 专题总览](./index.md)\n"
    lines = text.splitlines()
    assembled: list[str] = []
    intro_inserted = False
    for line in lines:
        assembled.append(line)
        if not intro_inserted and line.startswith("# "):
            assembled.append("")
            assembled.extend(intro.rstrip().splitlines())
            assembled.append("")
            intro_inserted = True

    if not intro_inserted:
        assembled = intro.rstrip().splitlines() + [""] + lines

    return frontmatter + "\n".join(assembled).rstrip() + footer


def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    for item in CHAPTERS:
        source_path = find_source(item["source_prefix"])
        output_path = TARGET_DIR / f"{item['slug']}.md"
        source_text = source_path.read_text(encoding="utf-8")
        document = build_document(item, source_text)
        output_path.write_text(document, encoding="utf-8")
        print(f"generated {output_path.name} <- {source_path.name}")


if __name__ == "__main__":
    main()
