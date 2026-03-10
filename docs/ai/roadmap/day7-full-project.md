# Day 7：完整项目 —— 文档问答 Agent

> 这是 7 天 Agent 学习路线的最后一天。我们将把 [Day 1](./day1-what-is-agent.md) 到 [Day 6](./day6-eval-safety.md) 学到的所有内容整合成一个完整的、可运行的项目。

## 项目概述

我们要构建一个**文档问答 Agent**，它能够：

- 加载并索引本地文档（[Day 5](./day5-rag-memory.md) RAG 技术）
- 根据检索到的上下文回答问题
- 调用工具：搜索知识库、获取当前时间、摘要文本（[Day 3](./day3-tool-calling.md) Tool Calling）
- 遵循结构化工作流（[Day 4](./day4-workflow.md) Workflow）
- 具备基本评测能力（[Day 6](./day6-eval-safety.md) Eval）
- 包含错误处理和日志记录

这个项目不是 Demo，而是一个具备工程基本素养的小型 Agent 系统。

## 项目结构

```
doc-qa-agent/
├── main.py           # 入口文件，交互式 CLI
├── agent.py          # 核心 Agent 循环
├── tools.py          # 工具定义与实现
├── rag.py            # RAG 管线（嵌入、索引、检索）
├── eval.py           # 评测框架
├── config.py         # 配置管理
├── documents/        # 待索引的示例文档
│   ├── sample1.md
│   └── sample2.md
└── requirements.txt  # 依赖
```

每个文件各司其职，职责清晰。下面逐一实现。

---

## 1. config.py —— 配置管理

所有可调参数集中管理，避免硬编码散落各处。

```python
"""配置管理：集中管理所有可调参数。"""

import os
from dataclasses import dataclass, field


@dataclass
class Config:
    """Agent 配置项。"""

    # OpenAI
    openai_api_key: str = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    openai_base_url: str = field(
        default_factory=lambda: os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    )
    model: str = "gpt-4o-mini"

    # RAG
    documents_dir: str = "./documents"
    collection_name: str = "doc_qa"
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k: int = 3

    # Agent
    max_tool_rounds: int = 5          # 单次对话最多工具调用轮数
    memory_window: int = 20           # 滑动窗口保留最近消息数
    system_prompt: str = (
        "你是一个文档问答助手。你可以调用工具来搜索知识库、获取时间、摘要文本。"
        "请根据检索到的上下文回答用户问题，如果不确定请如实说明。"
    )

    # Retry
    max_retries: int = 3
    retry_delay: float = 1.0          # 秒


config = Config()
```

### 讲解重点

- 使用 `dataclass` 让配置结构化、类型明确
- 通过 `os.getenv` 支持环境变量覆盖，避免将密钥写入代码
- `config` 单例在各模块中直接导入使用

---

## 2. tools.py —— 工具定义与实现

回顾 [Day 3](./day3-tool-calling.md)：工具的核心是**描述清楚**让模型知道何时调用，以及**实现可靠**保证调用后返回有用结果。

```python
"""工具定义与实现。

每个工具包含两部分：
1. OpenAI function schema（告诉模型工具长什么样）
2. Python 实现函数（真正执行逻辑）
"""

import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# 工具 schema（供 OpenAI API 使用）
# ──────────────────────────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "在知识库中搜索与查询相关的文档片段，返回最相关的结果。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索查询内容",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "获取当前日期和时间。",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_text",
            "description": "对一段较长的文本进行摘要，返回简洁的总结。",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "需要摘要的文本内容",
                    },
                    "max_length": {
                        "type": "integer",
                        "description": "摘要的最大字数，默认 200",
                    },
                },
                "required": ["text"],
            },
        },
    },
]


# ──────────────────────────────────────────────
# 工具实现
# ──────────────────────────────────────────────

# rag_search_fn 由 agent 初始化时注入，避免循环依赖
_rag_search_fn = None
# summarize_fn 由 agent 初始化时注入（需要调用 LLM）
_summarize_fn = None


def register_rag_search(fn):
    """注册 RAG 搜索函数。"""
    global _rag_search_fn
    _rag_search_fn = fn


def register_summarize(fn):
    """注册摘要函数。"""
    global _summarize_fn
    _summarize_fn = fn


def search_knowledge_base(query: str) -> str:
    """搜索知识库。"""
    logger.info(f"[Tool] search_knowledge_base: query={query!r}")
    if _rag_search_fn is None:
        return "知识库尚未初始化。"
    results = _rag_search_fn(query)
    if not results:
        return "未找到相关文档。"
    # 拼接检索结果
    output = []
    for i, doc in enumerate(results, 1):
        output.append(f"[片段 {i}]\n{doc}")
    return "\n\n".join(output)


def get_current_time() -> str:
    """获取当前时间。"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"[Tool] get_current_time: {now}")
    return f"当前时间：{now}"


def summarize_text(text: str, max_length: int = 200) -> str:
    """摘要文本。"""
    logger.info(f"[Tool] summarize_text: len={len(text)}, max_length={max_length}")
    if _summarize_fn is None:
        # 降级：简单截断
        return text[:max_length] + "..." if len(text) > max_length else text
    return _summarize_fn(text, max_length)


# 工具名 -> 实现函数的映射
TOOL_MAP = {
    "search_knowledge_base": search_knowledge_base,
    "get_current_time": get_current_time,
    "summarize_text": summarize_text,
}


def execute_tool(name: str, arguments: str) -> str:
    """统一工具执行入口。

    Args:
        name: 工具名
        arguments: JSON 字符串格式的参数

    Returns:
        工具执行结果字符串
    """
    fn = TOOL_MAP.get(name)
    if fn is None:
        logger.warning(f"[Tool] 未知工具: {name}")
        return f"错误：未知工具 '{name}'"

    try:
        args = json.loads(arguments) if arguments else {}
        result = fn(**args)
        logger.info(f"[Tool] {name} 执行成功")
        return result
    except Exception as e:
        logger.error(f"[Tool] {name} 执行失败: {e}")
        return f"工具执行出错：{e}"
```

### 讲解重点

- **Schema 和实现分离**：Schema 给模型看，实现给程序用，二者通过 `TOOL_MAP` 关联
- **依赖注入**：`register_rag_search` / `register_summarize` 避免循环导入
- **统一入口**：`execute_tool` 处理 JSON 解析、异常捕获，调用方无需关心细节
- **日志**：每次工具调用都记录，方便排查问题

---

## 3. rag.py —— RAG 管线

回顾 [Day 5](./day5-rag-memory.md)：RAG 的核心流程是**加载 → 切分 → 嵌入 → 检索**。

```python
"""RAG 管线：文档加载、切分、嵌入、检索。

使用 ChromaDB 作为向量数据库，OpenAI Embeddings 做嵌入。
"""

import logging
import os
from pathlib import Path

import chromadb
from openai import OpenAI

from config import config

logger = logging.getLogger(__name__)


class RAGPipeline:
    """RAG 管线：负责文档索引和检索。"""

    def __init__(self):
        self.client = OpenAI(
            api_key=config.openai_api_key,
            base_url=config.openai_base_url,
        )
        # ChromaDB 使用内存模式，重启后需重新索引
        self.chroma_client = chromadb.Client()
        self.collection = self.chroma_client.get_or_create_collection(
            name=config.collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        self._indexed = False

    # ──────────────────────────────
    # 文档加载
    # ──────────────────────────────

    def load_documents(self, directory: str | None = None) -> list[dict]:
        """加载目录下所有 .md 和 .txt 文件。

        Returns:
            [{"path": str, "content": str}, ...]
        """
        doc_dir = Path(directory or config.documents_dir)
        if not doc_dir.exists():
            logger.warning(f"文档目录不存在: {doc_dir}")
            return []

        documents = []
        for ext in ("*.md", "*.txt"):
            for filepath in doc_dir.glob(ext):
                content = filepath.read_text(encoding="utf-8")
                if content.strip():
                    documents.append({"path": str(filepath), "content": content})
                    logger.info(f"已加载文档: {filepath.name} ({len(content)} 字符)")

        logger.info(f"共加载 {len(documents)} 个文档")
        return documents

    # ──────────────────────────────
    # 文档切分
    # ──────────────────────────────

    def chunk_text(self, text: str) -> list[str]:
        """将文本按固定大小切分，带重叠。

        这是最简单的切分策略。生产环境可考虑按段落、
        标题等语义边界切分。
        """
        chunks = []
        start = 0
        while start < len(text):
            end = start + config.chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk)
            start += config.chunk_size - config.chunk_overlap
        return chunks

    # ──────────────────────────────
    # 嵌入
    # ──────────────────────────────

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """调用 OpenAI Embeddings API 获取向量。"""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [item.embedding for item in response.data]

    # ──────────────────────────────
    # 索引
    # ──────────────────────────────

    def index_documents(self, directory: str | None = None):
        """加载文档 → 切分 → 嵌入 → 存入 ChromaDB。"""
        documents = self.load_documents(directory)
        if not documents:
            logger.warning("没有文档可索引")
            return

        all_chunks = []
        all_ids = []
        all_metadatas = []

        for doc in documents:
            chunks = self.chunk_text(doc["content"])
            for i, chunk in enumerate(chunks):
                chunk_id = f"{Path(doc['path']).stem}_chunk_{i}"
                all_chunks.append(chunk)
                all_ids.append(chunk_id)
                all_metadatas.append({"source": doc["path"]})

        logger.info(f"共切分 {len(all_chunks)} 个片段，开始嵌入...")

        # 分批嵌入，避免超过 API 限制
        batch_size = 100
        all_embeddings = []
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i : i + batch_size]
            embeddings = self.get_embeddings(batch)
            all_embeddings.extend(embeddings)

        # 存入 ChromaDB
        self.collection.add(
            ids=all_ids,
            documents=all_chunks,
            embeddings=all_embeddings,
            metadatas=all_metadatas,
        )

        self._indexed = True
        logger.info(f"索引完成：{len(all_chunks)} 个片段已入库")

    # ──────────────────────────────
    # 检索
    # ──────────────────────────────

    def search(self, query: str, top_k: int | None = None) -> list[str]:
        """根据查询检索最相关的文档片段。"""
        if not self._indexed:
            logger.warning("知识库尚未索引")
            return []

        k = top_k or config.top_k
        query_embedding = self.get_embeddings([query])[0]

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
        )

        documents = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]

        logger.info(
            f"检索到 {len(documents)} 个片段，"
            f"最佳距离: {distances[0]:.4f}" if distances else "无结果"
        )

        return documents
```

### 讲解重点

- **加载**：支持 `.md` 和 `.txt` 文件，遍历指定目录
- **切分**：固定窗口 + 重叠，简单但有效。生产环境建议按语义边界切分
- **嵌入**：使用 `text-embedding-3-small`，分批处理防止超限
- **检索**：使用余弦相似度（`cosine`），返回 top_k 个最相关片段
- **ChromaDB 内存模式**：适合学习和原型验证，生产环境可改为持久化模式

---

## 4. agent.py —— 核心 Agent

这是整个项目的核心。回顾 [Day 1](./day1-what-is-agent.md) 的公式：**Agent = LLM + Tools + Memory + Workflow**。

这个文件把所有能力串联起来：

- [Day 2](./day2-llm-api.md) 的 LLM 调用
- [Day 3](./day3-tool-calling.md) 的工具调用循环
- [Day 4](./day4-workflow.md) 的结构化工作流
- [Day 5](./day5-rag-memory.md) 的 RAG 检索与记忆
- [Day 6](./day6-eval-safety.md) 的日志与可观测性

```python
"""核心 Agent：整合 LLM、工具、RAG、工作流。

工作流程：
1. classify_intent  —— 判断用户意图（问答 / 闲聊 / 工具调用）
2. retrieve_context —— 如果是问答，先检索知识库
3. generate_answer  —— 调用 LLM 生成回答（可能触发工具调用）
4. validate         —— 简单校验回答质量
"""

import json
import logging
import time
from typing import Optional

from openai import OpenAI

from config import config
from rag import RAGPipeline
from tools import (
    TOOL_SCHEMAS,
    execute_tool,
    register_rag_search,
    register_summarize,
)

logger = logging.getLogger(__name__)


class DocQAAgent:
    """文档问答 Agent。"""

    def __init__(self):
        # LLM 客户端
        self.client = OpenAI(
            api_key=config.openai_api_key,
            base_url=config.openai_base_url,
        )

        # RAG 管线
        self.rag = RAGPipeline()

        # 对话记忆（滑动窗口）
        self.messages: list[dict] = [
            {"role": "system", "content": config.system_prompt}
        ]

        # 注册工具依赖
        register_rag_search(self.rag.search)
        register_summarize(self._summarize_with_llm)

        logger.info("Agent 初始化完成")

    # ──────────────────────────────
    # 初始化：索引文档
    # ──────────────────────────────

    def index_documents(self, directory: str | None = None):
        """索引文档到知识库。"""
        self.rag.index_documents(directory)

    # ──────────────────────────────
    # 工作流步骤
    # ──────────────────────────────

    def _classify_intent(self, user_input: str) -> str:
        """Step 1: 判断用户意图。

        Returns:
            "qa" | "chat" | "tool"
        """
        classification_prompt = (
            "请判断以下用户输入的意图类型，只返回一个词：\n"
            "- qa：用户在问一个需要查阅资料才能回答的问题\n"
            "- chat：用户在闲聊或打招呼\n"
            "- tool：用户明确要求使用某个工具（如查时间）\n\n"
            f"用户输入：{user_input}\n\n"
            "意图类型："
        )

        response = self.client.chat.completions.create(
            model=config.model,
            messages=[{"role": "user", "content": classification_prompt}],
            max_tokens=10,
            temperature=0,
        )

        intent = response.choices[0].message.content.strip().lower()
        # 规范化
        if intent not in ("qa", "chat", "tool"):
            intent = "qa"  # 默认当作问答

        logger.info(f"[Workflow] 意图分类: {intent}")
        return intent

    def _retrieve_context(self, query: str) -> str:
        """Step 2: 检索知识库获取上下文。"""
        logger.info("[Workflow] 检索知识库...")
        results = self.rag.search(query)
        if not results:
            logger.info("[Workflow] 未检索到相关内容")
            return ""

        context = "\n\n---\n\n".join(results)
        logger.info(f"[Workflow] 检索到 {len(results)} 个相关片段")
        return context

    def _generate_answer(self, user_input: str, context: str = "") -> str:
        """Step 3: 调用 LLM 生成回答，支持工具调用循环。"""
        # 如果有检索上下文，注入到消息中
        if context:
            augmented_input = (
                f"请根据以下参考资料回答用户问题。如果参考资料不足以回答，请如实说明。\n\n"
                f"## 参考资料\n{context}\n\n"
                f"## 用户问题\n{user_input}"
            )
        else:
            augmented_input = user_input

        # 添加到对话记忆
        self.messages.append({"role": "user", "content": augmented_input})

        # 工具调用循环
        for round_num in range(config.max_tool_rounds):
            logger.info(f"[Workflow] 生成回答（第 {round_num + 1} 轮）")

            response = self._call_llm_with_retry()

            message = response.choices[0].message

            # 如果没有工具调用，直接返回
            if not message.tool_calls:
                assistant_content = message.content or ""
                self.messages.append(
                    {"role": "assistant", "content": assistant_content}
                )
                return assistant_content

            # 处理工具调用
            self.messages.append(message.model_dump())

            for tool_call in message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = tool_call.function.arguments
                logger.info(f"[Workflow] 调用工具: {fn_name}({fn_args})")

                result = execute_tool(fn_name, fn_args)

                self.messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": result,
                    }
                )

        # 超过最大轮数
        logger.warning("[Workflow] 达到最大工具调用轮数")
        return "抱歉，处理过程中调用了太多工具，请简化您的问题。"

    def _validate(self, answer: str) -> tuple[bool, str]:
        """Step 4: 简单校验回答质量。

        Returns:
            (is_valid, reason)
        """
        # 基础检查
        if not answer or len(answer.strip()) < 5:
            return False, "回答过短"

        if answer.count("抱歉") > 2:
            return False, "回答中包含过多道歉用语，可能未真正回答问题"

        logger.info("[Workflow] 回答校验通过")
        return True, "OK"

    # ──────────────────────────────
    # 主入口
    # ──────────────────────────────

    def chat(self, user_input: str) -> str:
        """处理用户输入，返回回答。

        完整工作流：分类意图 → 检索上下文 → 生成回答 → 校验
        """
        logger.info(f"[Agent] 收到输入: {user_input!r}")

        # Step 1: 分类意图
        intent = self._classify_intent(user_input)

        # Step 2: 按意图决定是否检索
        context = ""
        if intent == "qa":
            context = self._retrieve_context(user_input)

        # Step 3: 生成回答
        answer = self._generate_answer(user_input, context)

        # Step 4: 校验
        is_valid, reason = self._validate(answer)
        if not is_valid:
            logger.warning(f"[Agent] 回答校验未通过: {reason}")
            # 可以在此处做重试或降级处理

        # 记忆管理：保持滑动窗口
        self._trim_memory()

        logger.info(f"[Agent] 回答完成 (长度={len(answer)})")
        return answer

    # ──────────────────────────────
    # 内部辅助
    # ──────────────────────────────

    def _call_llm_with_retry(self):
        """带重试的 LLM 调用。"""
        for attempt in range(config.max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=config.model,
                    messages=self.messages,
                    tools=TOOL_SCHEMAS,
                    temperature=0.7,
                )
                return response
            except Exception as e:
                logger.error(
                    f"[Agent] LLM 调用失败 (第 {attempt + 1} 次): {e}"
                )
                if attempt < config.max_retries - 1:
                    time.sleep(config.retry_delay * (attempt + 1))
                else:
                    raise

    def _trim_memory(self):
        """滑动窗口：只保留最近 N 条消息。

        始终保留 system prompt（第一条）。
        """
        if len(self.messages) > config.memory_window + 1:
            # 保留 system + 最近 memory_window 条
            self.messages = [self.messages[0]] + self.messages[-(config.memory_window):]
            logger.info(
                f"[Agent] 记忆裁剪，当前保留 {len(self.messages)} 条消息"
            )

    def _summarize_with_llm(self, text: str, max_length: int = 200) -> str:
        """使用 LLM 做摘要（供 summarize_text 工具调用）。"""
        response = self.client.chat.completions.create(
            model=config.model,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"请将以下文本摘要为不超过 {max_length} 字的简洁总结：\n\n"
                        f"{text}"
                    ),
                }
            ],
            max_tokens=max_length * 2,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()

    def reset(self):
        """重置对话记忆。"""
        self.messages = [{"role": "system", "content": config.system_prompt}]
        logger.info("[Agent] 对话记忆已重置")
```

### 讲解重点

- **工作流四步走**：`classify_intent → retrieve_context → generate_answer → validate`，体现 [Day 4](./day4-workflow.md) 的结构化思想
- **工具调用循环**：模型可以在一轮对话中连续调用多个工具，但设有 `max_tool_rounds` 上限防止死循环
- **滑动窗口记忆**：始终保留 system prompt + 最近 N 条消息，控制上下文长度和成本
- **重试机制**：LLM 调用失败时指数退避重试，增强稳定性
- **日志贯穿全流程**：每个步骤都有日志，出了问题能快速定位

---

## 5. eval.py —— 评测框架

回顾 [Day 6](./day6-eval-safety.md)：不评测就不知道 Agent 是否真的好用。

```python
"""评测框架：测试 Agent 的回答质量。

提供预定义测试用例和自动评测能力。
"""

import json
import logging
import time
from dataclasses import dataclass

from openai import OpenAI

from agent import DocQAAgent
from config import config

logger = logging.getLogger(__name__)


@dataclass
class TestCase:
    """单个测试用例。"""
    question: str
    expected_keywords: list[str]   # 回答中应包含的关键词
    category: str = "general"      # 分类标签
    description: str = ""          # 用例描述


@dataclass
class TestResult:
    """单个测试结果。"""
    test_case: TestCase
    answer: str
    passed: bool
    score: float                   # 0.0 ~ 1.0
    latency: float                 # 秒
    reason: str = ""


# ──────────────────────────────
# 预定义测试用例
# ──────────────────────────────

DEFAULT_TEST_CASES = [
    TestCase(
        question="什么是 Agent？",
        expected_keywords=["LLM", "工具", "记忆"],
        category="概念",
        description="测试基本概念理解",
    ),
    TestCase(
        question="RAG 的核心流程是什么？",
        expected_keywords=["检索", "嵌入", "生成"],
        category="RAG",
        description="测试 RAG 知识",
    ),
    TestCase(
        question="现在几点了？",
        expected_keywords=["时间", ":"],
        category="工具调用",
        description="测试是否能调用时间工具",
    ),
    TestCase(
        question="你好",
        expected_keywords=[],
        category="闲聊",
        description="测试闲聊场景，不应报错",
    ),
    TestCase(
        question="请帮我总结一下：机器学习是人工智能的一个分支，"
                 "它通过数据驱动的方式让计算机学习模式并做出预测。"
                 "主要方法包括监督学习、无监督学习和强化学习。",
        expected_keywords=["机器学习", "学习"],
        category="工具调用",
        description="测试摘要工具",
    ),
]


# ──────────────────────────────
# 评测运行器
# ──────────────────────────────

class EvalRunner:
    """评测运行器。"""

    def __init__(self, agent: DocQAAgent):
        self.agent = agent

    def evaluate_single(self, test_case: TestCase) -> TestResult:
        """执行单个测试用例。"""
        logger.info(f"[Eval] 测试: {test_case.description}")

        # 每个测试用例使用干净的对话
        self.agent.reset()

        start = time.time()
        try:
            answer = self.agent.chat(test_case.question)
        except Exception as e:
            return TestResult(
                test_case=test_case,
                answer=f"ERROR: {e}",
                passed=False,
                score=0.0,
                latency=time.time() - start,
                reason=f"执行异常: {e}",
            )
        latency = time.time() - start

        # 关键词匹配评分
        if not test_case.expected_keywords:
            # 没有关键词要求，只要不报错就算通过
            score = 1.0 if answer and "ERROR" not in answer else 0.0
        else:
            matched = sum(
                1 for kw in test_case.expected_keywords
                if kw.lower() in answer.lower()
            )
            score = matched / len(test_case.expected_keywords)

        passed = score >= 0.5
        reason = (
            f"关键词匹配: {score:.0%}"
            if test_case.expected_keywords
            else "无关键词要求"
        )

        return TestResult(
            test_case=test_case,
            answer=answer,
            passed=passed,
            score=score,
            latency=latency,
            reason=reason,
        )

    def run_all(
        self, test_cases: list[TestCase] | None = None
    ) -> list[TestResult]:
        """运行所有测试用例。"""
        cases = test_cases or DEFAULT_TEST_CASES
        results = []

        print(f"\n{'='*60}")
        print(f"开始评测，共 {len(cases)} 个用例")
        print(f"{'='*60}\n")

        for i, tc in enumerate(cases, 1):
            print(f"[{i}/{len(cases)}] {tc.description}...")
            result = self.evaluate_single(tc)
            results.append(result)

            status = "PASS" if result.passed else "FAIL"
            print(
                f"  {status} | 得分: {result.score:.0%} | "
                f"耗时: {result.latency:.1f}s | {result.reason}"
            )
            if not result.passed:
                print(f"  回答: {result.answer[:100]}...")
            print()

        # 汇总
        self._print_summary(results)
        return results

    def _print_summary(self, results: list[TestResult]):
        """打印评测汇总。"""
        total = len(results)
        passed = sum(1 for r in results if r.passed)
        avg_score = sum(r.score for r in results) / total if total else 0
        avg_latency = sum(r.latency for r in results) / total if total else 0

        print(f"\n{'='*60}")
        print(f"评测汇总")
        print(f"{'='*60}")
        print(f"  通过率: {passed}/{total} ({passed/total:.0%})")
        print(f"  平均得分: {avg_score:.2f}")
        print(f"  平均耗时: {avg_latency:.1f}s")

        # 按类别统计
        categories = set(r.test_case.category for r in results)
        for cat in sorted(categories):
            cat_results = [r for r in results if r.test_case.category == cat]
            cat_passed = sum(1 for r in cat_results if r.passed)
            print(f"  [{cat}] {cat_passed}/{len(cat_results)}")

        print(f"{'='*60}\n")
```

### 讲解重点

- **测试用例结构化**：`TestCase` 包含问题、期望关键词、分类、描述，方便管理
- **关键词匹配评分**：简单但实用的评估方式，生产环境可升级为 LLM-as-Judge
- **每轮重置对话**：保证测试用例之间互不干扰
- **分类汇总**：按类别统计通过率，能快速发现薄弱环节

---

## 6. main.py —— 交互式 CLI 入口

```python
"""文档问答 Agent —— 交互式入口。

支持的命令：
  /help     显示帮助
  /eval     运行评测
  /reset    重置对话
  /index    重新索引文档
  /quit     退出
"""

import logging
import sys

from agent import DocQAAgent
from eval import EvalRunner


def setup_logging():
    """配置日志。"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
        handlers=[
            logging.FileHandler("agent.log", encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


def print_banner():
    """打印启动信息。"""
    print()
    print("=" * 50)
    print("  文档问答 Agent")
    print("  输入问题开始对话，输入 /help 查看命令")
    print("=" * 50)
    print()


def main():
    setup_logging()
    logger = logging.getLogger(__name__)

    print_banner()

    # 初始化 Agent
    print("正在初始化 Agent...")
    agent = DocQAAgent()

    # 索引文档
    print("正在索引文档...")
    try:
        agent.index_documents()
        print("文档索引完成！\n")
    except Exception as e:
        logger.warning(f"文档索引失败: {e}")
        print(f"文档索引失败: {e}")
        print("Agent 仍可使用，但知识库搜索可能无结果。\n")

    # 交互循环
    while True:
        try:
            user_input = input("你: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n再见！")
            break

        if not user_input:
            continue

        # 处理命令
        if user_input.startswith("/"):
            cmd = user_input.lower()

            if cmd == "/help":
                print(
                    "\n可用命令：\n"
                    "  /help   显示帮助\n"
                    "  /eval   运行评测\n"
                    "  /reset  重置对话\n"
                    "  /index  重新索引文档\n"
                    "  /quit   退出\n"
                )
            elif cmd == "/eval":
                runner = EvalRunner(agent)
                runner.run_all()
            elif cmd == "/reset":
                agent.reset()
                print("对话已重置。\n")
            elif cmd == "/index":
                print("正在重新索引...")
                agent.index_documents()
                print("索引完成！\n")
            elif cmd in ("/quit", "/exit", "/q"):
                print("再见！")
                break
            else:
                print(f"未知命令: {user_input}，输入 /help 查看帮助\n")
            continue

        # 正常对话
        try:
            answer = agent.chat(user_input)
            print(f"\nAgent: {answer}\n")
        except Exception as e:
            logger.error(f"Agent 处理异常: {e}")
            print(f"\n出错了: {e}\n")


if __name__ == "__main__":
    main()
```

### 讲解重点

- **日志双输出**：同时写入文件（`agent.log`）和终端，方便事后排查
- **命令系统**：`/eval`、`/reset` 等斜杠命令让交互更方便
- **异常兜底**：索引失败不影响 Agent 启动，对话异常不导致程序崩溃

---

## 7. requirements.txt —— 依赖

```txt
openai==1.82.0
chromadb==0.6.3
```

> 只需要两个核心依赖。`chromadb` 会自动安装嵌入相关的底层库。

---

## 示例文档

为了让项目开箱即用，在 `documents/` 目录下放两个示例文档。

### documents/sample1.md

```markdown
# Agent 基础概念

Agent 是一种能够自主感知环境、做出决策并执行行动的智能系统。

在大模型时代，Agent 通常由以下部分组成：

- **LLM（大语言模型）**：作为 Agent 的"大脑"，负责理解和推理
- **Tools（工具）**：Agent 可以调用的外部能力，如搜索、计算、API 调用
- **Memory（记忆）**：短期记忆保存对话上下文，长期记忆存储知识
- **Workflow（工作流）**：定义 Agent 的行为流程和决策逻辑

Agent 和普通聊天机器人的区别在于：Agent 能在合适的时候主动调用工具来完成任务，
而不只是生成文本回复。

## Tool Calling

Tool Calling 是 Agent 的核心能力之一。模型通过分析用户意图，
决定是否需要调用工具以及调用哪个工具。

常见的工具类型包括：
- 搜索工具：在知识库或网络上查找信息
- 计算工具：执行数学运算
- API 工具：调用外部服务
```

### documents/sample2.md

```markdown
# RAG 技术介绍

RAG（Retrieval-Augmented Generation，检索增强生成）是一种将检索和生成结合的技术。

## 核心流程

1. **文档加载**：将文档读入系统
2. **文档切分（Chunking）**：将长文档切分为小的片段
3. **嵌入（Embedding）**：将文本片段转换为向量表示
4. **索引（Indexing）**：将向量存入向量数据库
5. **检索（Retrieval）**：根据用户查询找到最相关的片段
6. **生成（Generation）**：将检索到的片段作为上下文，让 LLM 生成回答

## 为什么需要 RAG？

- LLM 的训练数据有截止日期，无法获取最新信息
- LLM 可能产生幻觉（Hallucination），检索可以提供事实依据
- 企业内部知识不在公开训练数据中

## 关键指标

- 检索准确率：找到的片段是否真正相关
- 回答忠实度：回答是否忠实于检索到的内容
- 延迟：从提问到回答的时间
```

---

## 运行方式

### 环境准备

```bash
# 1. 创建项目目录
mkdir doc-qa-agent && cd doc-qa-agent

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 设置环境变量
export OPENAI_API_KEY="your-api-key-here"
# 如果使用代理：
# export OPENAI_BASE_URL="https://your-proxy.com/v1"

# 5. 准备文档
mkdir documents
# 将 sample1.md 和 sample2.md 放入 documents/ 目录

# 6. 运行
python main.py
```

### 交互示例

```
==================================================
  文档问答 Agent
  输入问题开始对话，输入 /help 查看命令
==================================================

正在初始化 Agent...
正在索引文档...
文档索引完成！

你: 什么是 Agent？

Agent: Agent 是一种能够自主感知环境、做出决策并执行行动的智能系统。
在大模型时代，Agent 通常由以下部分组成：
- LLM（大语言模型）：作为 Agent 的"大脑"
- Tools（工具）：可调用的外部能力
- Memory（记忆）：保存上下文和知识
- Workflow（工作流）：定义行为流程

你: 现在几点了？

Agent: 当前时间是 2025-06-15 14:30:22。

你: RAG 的核心流程有哪些步骤？

Agent: RAG 的核心流程包括六个步骤：
1. 文档加载
2. 文档切分（Chunking）
3. 嵌入（Embedding）
4. 索引（Indexing）
5. 检索（Retrieval）
6. 生成（Generation）

你: /eval
[开始运行评测...]

你: /quit
再见！
```

---

## 架构回顾

```
用户输入
  │
  ▼
┌─────────────────────────────────────────┐
│  agent.py - DocQAAgent                  │
│                                         │
│  1. classify_intent() ── 意图分类       │
│          │                              │
│  2. retrieve_context() ── RAG 检索      │
│          │               (rag.py)       │
│  3. generate_answer() ── LLM + 工具     │
│          │               (tools.py)     │
│  4. validate() ── 回答校验              │
│                                         │
│  记忆管理（滑动窗口）                     │
│  错误处理（重试 + 日志）                  │
└─────────────────────────────────────────┘
  │
  ▼
回答输出
```

每一步对应前几天学到的内容：

| 步骤 | 对应知识 | 来源 |
|------|---------|------|
| 意图分类 | LLM 调用 | [Day 2](./day2-llm-api.md) |
| RAG 检索 | 嵌入 + 向量检索 | [Day 5](./day5-rag-memory.md) |
| 工具调用循环 | Tool Calling | [Day 3](./day3-tool-calling.md) |
| 结构化工作流 | Workflow | [Day 4](./day4-workflow.md) |
| 回答校验 | 评测思维 | [Day 6](./day6-eval-safety.md) |
| 滑动窗口 | Memory | [Day 5](./day5-rag-memory.md) |

---

## 扩展建议

完成基础版本后，可以尝试以下方向继续提升：

### 1. 添加联网搜索工具

```python
# tools.py 中新增
{
    "type": "function",
    "function": {
        "name": "web_search",
        "description": "在互联网上搜索信息",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "搜索关键词"}
            },
            "required": ["query"],
        },
    },
}
```

可以接入 Tavily、SerpAPI 或 DuckDuckGo 搜索 API。

### 2. 添加流式输出

```python
# agent.py 中修改 _call_llm_with_retry
response = self.client.chat.completions.create(
    model=config.model,
    messages=self.messages,
    tools=TOOL_SCHEMAS,
    stream=True,  # 开启流式
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

流式输出能显著提升用户体验，让用户不用等到完整回答生成完毕。

### 3. 添加持久化记忆

```python
# 使用 SQLite 或 JSON 文件保存对话历史
import json
from pathlib import Path

class PersistentMemory:
    def __init__(self, filepath="memory.json"):
        self.filepath = Path(filepath)
        self.history = self._load()

    def _load(self):
        if self.filepath.exists():
            return json.loads(self.filepath.read_text())
        return []

    def save(self, messages):
        self.filepath.write_text(
            json.dumps(messages, ensure_ascii=False, indent=2)
        )
```

### 4. 部署为 API（FastAPI）

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Doc QA Agent API")
agent = DocQAAgent()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    answer = agent.chat(request.message)
    return ChatResponse(answer=answer)
```

运行：`uvicorn api:app --reload`

---

## 总结

通过 7 天的学习，我们完成了从概念到实践的全过程：

| 天数 | 主题 | 在本项目中的体现 |
|------|------|-----------------|
| [Day 1](./day1-what-is-agent.md) | Agent 是什么 | 整体架构设计 |
| [Day 2](./day2-llm-api.md) | LLM API 调用 | `agent.py` 中的 LLM 调用 |
| [Day 3](./day3-tool-calling.md) | Tool Calling | `tools.py` 三个工具 |
| [Day 4](./day4-workflow.md) | Workflow | 四步工作流 |
| [Day 5](./day5-rag-memory.md) | RAG 与 Memory | `rag.py` + 滑动窗口 |
| [Day 6](./day6-eval-safety.md) | 评测与安全 | `eval.py` 评测框架 |
| **Day 7** | **完整项目** | **本文** |

这个项目虽然简单，但包含了一个生产级 Agent 的基本骨架。在此基础上，你可以：

- 增加更多工具来扩展 Agent 的能力
- 优化 RAG 管线（语义切分、Rerank、混合检索）
- 接入可观测性平台（LangSmith、Langfuse）
- 升级为 Multi-Agent 架构
- 部署为线上服务

**记住**：好的 Agent 不是"能聊天"，而是"能可靠地完成任务"。工程化能力比模型能力更决定最终效果。
