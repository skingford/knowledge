---
search: false
---

# Day 4：Workflow 设计 — 用流程控制代替完全自治

> 目标：理解可控 Agent 的真实工程形态，掌握 Workflow、状态机、重试与兜底策略。

很多人一上来就想做"完全自治"的 Agent，但工程实践中，**固定流程 + 有限自主** 才是最可靠的落地方式。今天我们学习如何用 Workflow 把 Agent 的行为变得可控、可观测、可调试。

前置知识：请先完成 [Day 3: Tool Calling](./day3-tool-calling.md)。

---

## 1. Step-by-step Workflow

### 为什么固定流程比完全自治更可靠？

完全自治的 Agent 有几个现实问题：

- **不可预测**：同样的输入，可能走出完全不同的路径
- **难以调试**：出了问题不知道哪一步出错
- **成本失控**：模型可能陷入循环，无限消耗 token
- **安全风险**：不受约束的工具调用可能造成破坏

Workflow 模式的核心思想：**把 Agent 的行为拆成固定步骤，每一步都有明确的输入、输出和校验。**

### 基本模式

```
输入 → 分类 → 路由 → 执行 → 校验 → 输出
```

### 代码：简单线性 Workflow

```python
import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

client = OpenAI()

def step_classify(user_input: str) -> str:
    """第一步：对用户输入进行意图分类"""
    logger.info("Step 1: 分类用户意图")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "判断用户意图，只返回以下类别之一：问答、计算、查询、闲聊"},
            {"role": "user", "content": user_input},
        ],
    )
    intent = response.choices[0].message.content.strip()
    logger.info(f"  → 识别意图: {intent}")
    return intent

def step_execute(intent: str, user_input: str) -> str:
    """第二步：根据意图执行对应逻辑"""
    logger.info(f"Step 2: 执行 [{intent}] 逻辑")

    if intent == "计算":
        return f"计算结果：（此处调用计算工具处理 '{user_input}'）"
    elif intent == "查询":
        return f"查询结果：（此处调用搜索工具处理 '{user_input}'）"
    else:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": user_input}],
        )
        return response.choices[0].message.content

def step_validate(result: str) -> bool:
    """第三步：校验输出是否合理"""
    logger.info("Step 3: 校验输出")

    if not result or len(result.strip()) == 0:
        logger.warning("  → 校验失败: 输出为空")
        return False
    logger.info("  → 校验通过")
    return True

def run_workflow(user_input: str) -> str:
    """运行完整 Workflow"""
    logger.info(f"=== Workflow 开始 === 输入: {user_input}")

    # 步骤 1：分类
    intent = step_classify(user_input)
    # 步骤 2：执行
    result = step_execute(intent, user_input)
    # 步骤 3：校验
    if step_validate(result):
        logger.info("=== Workflow 完成 ===")
        return result
    else:
        logger.error("=== Workflow 失败: 输出校验未通过 ===")
        return "抱歉，处理出现问题，请稍后重试。"

# 使用示例
answer = run_workflow("帮我算一下 128 * 256 等于多少")
print(answer)
```

### 讲解重点

- 每一步都有 `logger.info` 记录，方便排查问题
- 步骤之间通过参数传递数据，不依赖全局状态
- `step_validate` 是最容易被忽略的一步 — 生产环境必须有输出校验

---

## 2. 状态机

### 为什么需要状态机？

线性 Workflow 只能走直线，但实际场景经常需要：

- 根据条件跳转到不同步骤
- 在某些步骤之间来回切换
- 出错时回退到上一个状态

状态机（State Machine）用 **状态 + 转移规则** 来描述这些复杂流程。

### 代码：用 Enum 和 Dict 实现状态机

```python
import logging
from enum import Enum

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class State(Enum):
    INIT = "init"
    ANALYZING = "analyzing"
    SEARCHING = "searching"
    ANSWERING = "answering"
    DONE = "done"
    ERROR = "error"


# 定义状态转移规则：当前状态 → 可能的下一状态列表
TRANSITIONS: dict[State, list[State]] = {
    State.INIT: [State.ANALYZING],
    State.ANALYZING: [State.SEARCHING, State.ANSWERING],  # 分析后可能需要搜索，也可能直接回答
    State.SEARCHING: [State.ANSWERING, State.ERROR],
    State.ANSWERING: [State.DONE, State.ERROR],
    State.ERROR: [State.INIT],  # 出错后可以重新开始
    State.DONE: [],
}


class AgentStateMachine:
    def __init__(self):
        self.state = State.INIT
        self.context: dict = {}  # 在状态之间传递的上下文数据
        logger.info(f"状态机初始化，当前状态: {self.state.value}")

    def transition(self, next_state: State):
        """执行状态转移"""
        allowed = TRANSITIONS.get(self.state, [])
        if next_state not in allowed:
            raise ValueError(
                f"非法状态转移: {self.state.value} → {next_state.value}，"
                f"允许的转移: {[s.value for s in allowed]}"
            )
        logger.info(f"状态转移: {self.state.value} → {next_state.value}")
        self.state = next_state

    def run(self, user_input: str) -> str:
        """运行状态机"""
        self.context["input"] = user_input

        # INIT → ANALYZING
        self.transition(State.ANALYZING)
        needs_search = self._analyze(user_input)

        if needs_search:
            # ANALYZING → SEARCHING
            self.transition(State.SEARCHING)
            search_result = self._search(user_input)
            self.context["search_result"] = search_result

        # → ANSWERING
        self.transition(State.ANSWERING)
        answer = self._answer()

        # ANSWERING → DONE
        self.transition(State.DONE)
        return answer

    def _analyze(self, user_input: str) -> bool:
        """分析是否需要搜索"""
        logger.info(f"  分析问题: {user_input}")
        keywords = ["最新", "今天", "查一下", "搜索", "新闻"]
        needs_search = any(kw in user_input for kw in keywords)
        logger.info(f"  是否需要搜索: {needs_search}")
        return needs_search

    def _search(self, query: str) -> str:
        """模拟搜索"""
        logger.info(f"  执行搜索: {query}")
        return f"搜索结果：关于 '{query}' 的相关信息..."

    def _answer(self) -> str:
        """生成回答"""
        search_result = self.context.get("search_result", "")
        user_input = self.context["input"]
        if search_result:
            answer = f"根据搜索结果回答：{search_result}"
        else:
            answer = f"直接回答：关于 '{user_input}' 的回答..."
        logger.info(f"  生成回答: {answer[:50]}...")
        return answer


# 使用示例
agent = AgentStateMachine()
result = agent.run("帮我查一下最新的 AI 新闻")
print(result)

# 非法转移会报错
try:
    agent2 = AgentStateMachine()
    agent2.transition(State.DONE)  # INIT 不能直接跳到 DONE
except ValueError as e:
    print(f"捕获到非法转移: {e}")
```

### 状态转移图

```
INIT → ANALYZING → SEARCHING → ANSWERING → DONE
                 ↘            ↗
                  → ANSWERING →
                       ↓
                     ERROR → INIT（重试）
```

### 讲解重点

- `TRANSITIONS` 字典定义了合法的状态转移，防止代码跳到不该去的状态
- `context` 字典在步骤之间传递数据，比全局变量更清晰
- 非法转移会抛出异常 — 这在调试时能帮你快速定位逻辑错误

---

## 3. 重试与失败处理

### 为什么需要重试？

调用 LLM API 和外部工具都可能失败：

- 网络超时
- API 限流（Rate Limit）
- 模型返回格式不符合预期
- 工具调用异常

### 代码：重试装饰器 + 降级策略

```python
import time
import random
import logging
import functools

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 30.0):
    """重试装饰器：指数退避 + 随机抖动"""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_retries + 1):
                try:
                    logger.info(f"  尝试 {attempt}/{max_retries}: {func.__name__}")
                    result = func(*args, **kwargs)
                    logger.info(f"  {func.__name__} 成功")
                    return result
                except Exception as e:
                    logger.warning(f"  {func.__name__} 失败 (第 {attempt} 次): {e}")
                    if attempt == max_retries:
                        logger.error(f"  {func.__name__} 已达最大重试次数")
                        raise
                    # 指数退避 + 随机抖动
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    jitter = random.uniform(0, delay * 0.1)
                    total_delay = delay + jitter
                    logger.info(f"  等待 {total_delay:.1f}s 后重试...")
                    time.sleep(total_delay)
        return wrapper
    return decorator


def with_fallback(primary_func, fallback_func):
    """降级策略：主函数失败时调用降级函数"""

    def wrapper(*args, **kwargs):
        try:
            return primary_func(*args, **kwargs)
        except Exception as e:
            logger.warning(f"主函数 {primary_func.__name__} 失败: {e}，启用降级策略")
            return fallback_func(*args, **kwargs)
    return wrapper


# ---- 使用示例 ----

@retry_with_backoff(max_retries=3, base_delay=1.0)
def call_gpt4(prompt: str) -> str:
    """调用 GPT-4（可能失败）"""
    # 模拟偶发失败
    if random.random() < 0.5:
        raise ConnectionError("API 连接超时")
    return f"GPT-4 回答: {prompt}"


def call_gpt_mini(prompt: str) -> str:
    """降级方案：使用更便宜的模型"""
    logger.info("  使用 gpt-4o-mini 降级回答")
    return f"GPT-4o-mini 回答: {prompt}"


# 组合：先重试 GPT-4，全部失败后降级到 GPT-4o-mini
smart_answer = with_fallback(call_gpt4, call_gpt_mini)

answer = smart_answer("什么是状态机？")
print(answer)
```

### 讲解重点

- **指数退避**：每次重试等待时间翻倍（1s → 2s → 4s），避免频繁重试加重服务压力
- **随机抖动（Jitter）**：防止多个客户端同时重试导致"惊群效应"
- **降级策略**：GPT-4 不可用时降级到 GPT-4o-mini，宁可质量低一点也不要完全失败
- 装饰器可以复用到任何需要重试的函数上

---

## 4. 人工兜底（Human-in-the-loop）

### 什么时候需要人工介入？

即使有重试和降级，有些情况仍然需要人来决策：

- 模型的置信度太低
- 涉及敏感操作（删除数据、发送邮件、金融交易）
- 多个工具返回冲突的结果
- 用户问题超出 Agent 能力范围

### 代码：基于置信度的人工确认

```python
import json
import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

client = OpenAI()

CONFIDENCE_THRESHOLD = 0.7  # 置信度阈值


def analyze_with_confidence(user_input: str) -> dict:
    """让模型同时返回回答和置信度"""
    logger.info("分析问题并评估置信度...")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "你是一个助手。请回答用户问题，并评估你对回答的置信度。\n"
                    "返回 JSON 格式：\n"
                    '{"answer": "你的回答", "confidence": 0.0到1.0之间的数字, "reason": "置信度理由"}'
                ),
            },
            {"role": "user", "content": user_input},
        ],
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    logger.info(f"  置信度: {result['confidence']}, 理由: {result['reason']}")
    return result


def request_human_review(question: str, draft_answer: dict) -> str:
    """请求人工审核"""
    logger.info("=== 需要人工审核 ===")
    print("\n" + "=" * 50)
    print("Agent 不确定，请人工审核")
    print(f"问题：{question}")
    print(f"初步回答：{draft_answer['answer']}")
    print(f"置信度：{draft_answer['confidence']}")
    print(f"理由：{draft_answer['reason']}")
    print("=" * 50)

    human_input = input("\n请选择：(a) 接受回答  (m) 修改回答  (r) 拒绝回答\n> ")

    if human_input.lower() == "a":
        logger.info("人工审核：接受原始回答")
        return draft_answer["answer"]
    elif human_input.lower() == "m":
        corrected = input("请输入修正后的回答：\n> ")
        logger.info("人工审核：已修改回答")
        return corrected
    else:
        logger.info("人工审核：拒绝回答")
        return "抱歉，该问题暂时无法回答。"


def agent_with_human_fallback(user_input: str) -> str:
    """带人工兜底的 Agent"""
    result = analyze_with_confidence(user_input)

    if result["confidence"] >= CONFIDENCE_THRESHOLD:
        logger.info(f"置信度 {result['confidence']} >= {CONFIDENCE_THRESHOLD}，自动回答")
        return result["answer"]
    else:
        logger.info(f"置信度 {result['confidence']} < {CONFIDENCE_THRESHOLD}，转人工")
        return request_human_review(user_input, result)


# 使用示例
answer = agent_with_human_fallback("量子纠缠能不能用来超光速通信？")
print(f"\n最终回答：{answer}")
```

### 讲解重点

- **置信度阈值**：`CONFIDENCE_THRESHOLD = 0.7`，低于这个值就转人工。阈值需要根据业务场景调整
- 人工审核有三种选项：接受、修改、拒绝 — 覆盖最常见的审核场景
- 生产环境中，"人工审核"可能是发送到审核队列、发送通知、或写入待办列表
- 让模型自评置信度并不完全可靠，但在实际使用中仍然有用

---

## 5. 实操：固定流程 Agent

现在把前面学到的内容整合起来，构建一个完整的固定流程 Agent：

```
理解问题 → 判断是否需要查资料 → 调工具 → 汇总答案
```

### 代码：完整实现

```python
import json
import time
import random
import logging
import functools
from enum import Enum
from openai import OpenAI

# ---- 日志配置 ----
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("workflow_agent")

client = OpenAI()


# ---- 重试装饰器 ----
def retry(max_retries: int = 3, base_delay: float = 1.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    logger.warning(f"[重试] {func.__name__} 第 {attempt} 次失败: {e}")
                    if attempt == max_retries:
                        raise
                    delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
                    time.sleep(delay)
        return wrapper
    return decorator


# ---- 状态定义 ----
class State(Enum):
    INIT = "init"
    UNDERSTANDING = "understanding"       # 理解问题
    DECIDING = "deciding"                 # 判断是否需要工具
    CALLING_TOOL = "calling_tool"         # 调用工具
    SUMMARIZING = "summarizing"           # 汇总答案
    DONE = "done"
    ERROR = "error"


TRANSITIONS = {
    State.INIT: [State.UNDERSTANDING],
    State.UNDERSTANDING: [State.DECIDING, State.ERROR],
    State.DECIDING: [State.CALLING_TOOL, State.SUMMARIZING, State.ERROR],
    State.CALLING_TOOL: [State.SUMMARIZING, State.ERROR],
    State.SUMMARIZING: [State.DONE, State.ERROR],
    State.ERROR: [State.INIT],
    State.DONE: [],
}


# ---- 工具定义（复用 Day 3 的模式） ----
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge",
            "description": "搜索知识库获取相关信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "执行数学计算",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "数学表达式"},
                },
                "required": ["expression"],
            },
        },
    },
]


def search_knowledge(query: str) -> str:
    """模拟知识库搜索"""
    logger.info(f"  [工具] 搜索知识库: {query}")
    return f"知识库搜索结果：关于 '{query}' 的信息 — Python 是一种解释型高级编程语言..."


def calculate(expression: str) -> str:
    """执行计算（生产环境请用 ast.literal_eval 或专用计算库替代）"""
    logger.info(f"  [工具] 计算: {expression}")
    try:
        # 注意：仅用于演示，生产环境应使用 asteval、sympy 等安全库
        allowed_chars = set("0123456789+-*/.() ")
        if not all(c in allowed_chars for c in expression):
            return f"计算错误: 表达式包含不允许的字符"
        result = float(expression.replace(" ", "").strip()) if expression.strip().replace(".", "").isdigit() else "需要安全计算库处理"
        return str(result)
    except Exception as e:
        return f"计算错误: {e}"


TOOL_MAP = {
    "search_knowledge": search_knowledge,
    "calculate": calculate,
}


# ---- Workflow Agent ----
class WorkflowAgent:
    def __init__(self):
        self.state = State.INIT
        self.context: dict = {}
        self.history: list[dict] = []  # 记录每一步的状态

    def _transition(self, next_state: State):
        allowed = TRANSITIONS.get(self.state, [])
        if next_state not in allowed:
            raise ValueError(f"非法状态转移: {self.state.value} → {next_state.value}")
        old = self.state
        self.state = next_state
        self.history.append({"from": old.value, "to": next_state.value, "time": time.time()})
        logger.info(f"[状态] {old.value} → {next_state.value}")

    @retry(max_retries=2)
    def _understand(self, user_input: str) -> dict:
        """理解用户问题"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "分析用户问题，返回 JSON：\n"
                        '{"summary": "问题摘要", "type": "factual|calculation|opinion|other"}'
                    ),
                },
                {"role": "user", "content": user_input},
            ],
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        logger.info(f"  问题理解: {result}")
        return result

    @retry(max_retries=2)
    def _decide_tool_use(self, understanding: dict, user_input: str) -> dict:
        """判断是否需要调用工具"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "根据问题分析，判断是否需要调用工具。\n"
                        "可用工具：search_knowledge（搜索资料）、calculate（数学计算）\n"
                        "返回 JSON：\n"
                        '{"need_tool": true/false, "tool_name": "工具名或null", "tool_args": {}}'
                    ),
                },
                {
                    "role": "user",
                    "content": f"问题：{user_input}\n分析：{json.dumps(understanding, ensure_ascii=False)}",
                },
            ],
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        logger.info(f"  工具决策: {result}")
        return result

    @retry(max_retries=3)
    def _call_tool(self, tool_name: str, tool_args: dict) -> str:
        """调用工具"""
        func = TOOL_MAP.get(tool_name)
        if not func:
            raise ValueError(f"未知工具: {tool_name}")
        return func(**tool_args)

    @retry(max_retries=2)
    def _summarize(self, user_input: str, tool_result: str | None) -> str:
        """汇总最终答案"""
        messages = [
            {
                "role": "system",
                "content": "根据用户问题和（可能的）工具返回结果，给出简洁的最终回答。",
            },
            {"role": "user", "content": f"问题：{user_input}"},
        ]
        if tool_result:
            messages.append({"role": "user", "content": f"工具返回结果：{tool_result}"})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )
        return response.choices[0].message.content

    def run(self, user_input: str) -> str:
        """运行完整 Workflow"""
        logger.info(f"{'='*50}")
        logger.info(f"Workflow 启动 | 输入: {user_input}")
        logger.info(f"{'='*50}")

        try:
            # 步骤 1：理解问题
            self._transition(State.UNDERSTANDING)
            understanding = self._understand(user_input)
            self.context["understanding"] = understanding

            # 步骤 2：判断是否需要查资料
            self._transition(State.DECIDING)
            decision = self._decide_tool_use(understanding, user_input)
            self.context["decision"] = decision

            tool_result = None
            if decision.get("need_tool"):
                # 步骤 3：调用工具
                self._transition(State.CALLING_TOOL)
                tool_name = decision["tool_name"]
                tool_args = decision.get("tool_args", {})
                tool_result = self._call_tool(tool_name, tool_args)
                self.context["tool_result"] = tool_result
                logger.info(f"  工具返回: {tool_result[:100]}...")

            # 步骤 4：汇总答案
            self._transition(State.SUMMARIZING)
            answer = self._summarize(user_input, tool_result)
            self.context["answer"] = answer

            # 完成
            self._transition(State.DONE)
            logger.info(f"{'='*50}")
            logger.info("Workflow 完成")
            logger.info(f"状态历史: {[h['from'] + ' → ' + h['to'] for h in self.history]}")
            logger.info(f"{'='*50}")
            return answer

        except Exception as e:
            self._transition(State.ERROR)
            logger.error(f"Workflow 出错: {e}")
            return f"处理失败: {e}"


# ---- 运行 ----
if __name__ == "__main__":
    agent = WorkflowAgent()

    # 测试 1：需要搜索的问题
    answer1 = agent.run("Python 的 GIL 是什么？")
    print(f"\n回答 1：{answer1}\n")

    # 测试 2：需要计算的问题
    agent2 = WorkflowAgent()
    answer2 = agent2.run("帮我算一下 1024 * 768")
    print(f"\n回答 2：{answer2}\n")
```

### 讲解重点

- **完整流程**：理解 → 决策 → 工具 → 汇总，每一步都可独立调试
- **状态跟踪**：`self.history` 记录了完整的状态转移路径，便于事后分析
- **重试复用**：`@retry` 装饰器用在每个可能失败的步骤上
- **工具复用**：工具定义和 `TOOL_MAP` 的模式来自 [Day 3: Tool Calling](./day3-tool-calling.md)
- **错误隔离**：任何步骤出错都会跳到 `ERROR` 状态，不会默默吞掉异常

---

## 6. Router 模式

### 什么是 Router 模式？

当 Agent 需要处理多种不同类型的请求时，用一个 LLM 做"路由器"，把请求分发到不同的处理流程。

```
用户输入 → LLM Router（意图分类） → 对应的 Workflow
```

这个模式的好处：

- 每个 Workflow 专注处理一种场景，逻辑简单
- 新增场景只需要加一个 handler，不影响现有逻辑
- 路由层和处理层解耦，便于独立测试

### 代码：意图分类 + 路由分发

```python
import json
import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

client = OpenAI()


# ---- 各场景 Handler ----
def handle_qa(user_input: str) -> str:
    """处理知识问答"""
    logger.info("[Handler] 知识问答流程")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "你是一个知识问答助手，请准确回答问题。"},
            {"role": "user", "content": user_input},
        ],
    )
    return response.choices[0].message.content


def handle_calculation(user_input: str) -> str:
    """处理计算请求"""
    logger.info("[Handler] 计算流程")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "你是一个计算助手。提取用户问题中的数学表达式并计算，只返回结果。",
            },
            {"role": "user", "content": user_input},
        ],
    )
    return response.choices[0].message.content


def handle_creative(user_input: str) -> str:
    """处理创意写作"""
    logger.info("[Handler] 创意写作流程")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "你是一个创意写作助手，风格生动有趣。"},
            {"role": "user", "content": user_input},
        ],
    )
    return response.choices[0].message.content


def handle_unknown(user_input: str) -> str:
    """兜底处理"""
    logger.info("[Handler] 兜底流程")
    return "抱歉，我暂时无法处理这类请求。请换一种方式提问。"


# ---- Handler 注册表 ----
HANDLERS = {
    "qa": handle_qa,
    "calculation": handle_calculation,
    "creative": handle_creative,
}


# ---- Router ----
def route(user_input: str) -> str:
    """用 LLM 进行意图分类并路由到对应 Handler"""
    logger.info(f"[Router] 输入: {user_input}")

    # 第一步：意图分类
    intents = list(HANDLERS.keys())
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    f"对用户输入进行意图分类。可选类别：{intents}\n"
                    "如果不确定，返回 unknown。\n"
                    '返回 JSON：{{"intent": "类别名", "confidence": 0.0到1.0}}'
                ),
            },
            {"role": "user", "content": user_input},
        ],
        response_format={"type": "json_object"},
    )

    classification = json.loads(response.choices[0].message.content)
    intent = classification["intent"]
    confidence = classification.get("confidence", 0)
    logger.info(f"[Router] 意图: {intent}, 置信度: {confidence}")

    # 第二步：路由分发
    if confidence < 0.5:
        logger.warning(f"[Router] 置信度过低 ({confidence})，使用兜底")
        return handle_unknown(user_input)

    handler = HANDLERS.get(intent, handle_unknown)
    return handler(user_input)


# ---- 使用示例 ----
if __name__ == "__main__":
    questions = [
        "Python 的装饰器是什么？",
        "帮我算一下 15% 的年利率，本金 10 万，3 年后是多少？",
        "帮我写一首关于编程的打油诗",
    ]

    for q in questions:
        print(f"\n问题：{q}")
        answer = route(q)
        print(f"回答：{answer}")
        print("-" * 40)
```

### 讲解重点

- **Handler 注册表**：`HANDLERS` 字典把意图名映射到处理函数，新增场景只需加一行
- **置信度兜底**：分类不确定时走 `handle_unknown`，而不是随便分配
- **解耦设计**：Router 只负责分类，Handler 只负责处理，各自可以独立修改和测试
- 生产环境中，每个 Handler 可以是一个完整的 `WorkflowAgent`（如第 5 节的实现）

---

## 今日总结

| 概念 | 核心要点 |
|------|----------|
| Workflow | 固定步骤比完全自治更可控、可调试 |
| 状态机 | 用状态 + 转移规则管理复杂流程 |
| 重试 | 指数退避 + 随机抖动，失败时降级 |
| 人工兜底 | 置信度低于阈值时转人工审核 |
| Router 模式 | LLM 分类意图，分发到专用 Handler |

### 关键原则

1. **先做 Workflow，再考虑自治** — 大多数场景不需要完全自治的 Agent
2. **每一步都要有日志** — 没有日志的 Agent 出了问题完全无法排查
3. **失败是正常的** — 设计时就要考虑重试、降级、兜底
4. **人在回路中** — 对于不确定的决策，让人来把关

### 明日预告

Day 5 我们将学习 RAG 和 Memory，让 Agent 能利用外部知识库来回答问题。
