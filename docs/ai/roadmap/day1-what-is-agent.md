---
search: false
---

# Day 1：什么是 Agent？

## 学习目标

- 理解大语言模型（LLM）的基本概念
- 区分 System Prompt 和 User Prompt 的作用
- 了解 Tool Calling 的核心思想
- 掌握 Agent 与普通问答助手的本质区别
- 能用自己的话解释：**Agent = LLM + Tools + Memory + Workflow**

## 前置准备

```bash
pip install openai
```

设置环境变量（请勿在代码中硬编码 API Key）：

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## 快速导航

| 章节 | 内容 |
|------|------|
| [1. 什么是大模型](#_1-什么是大模型) | LLM、Token、上下文窗口 |
| [2. 什么是 Prompt](#_2-什么是-prompt) | System Prompt vs User Prompt |
| [3. 什么是 Tool Calling](#_3-什么是-tool-calling) | 模型调用外部函数 |
| [4. Agent 和普通问答助手的区别](#_4-agent-和普通问答助手的区别) | 简单对话 vs Agent 循环 |
| [5. 产出](#_5-产出) | Agent = LLM + Tools + Memory + Workflow |

---

## 1. 什么是大模型

大语言模型（Large Language Model, LLM）是经过海量文本数据训练的神经网络。它的核心能力是**根据输入文本，预测下一个最合理的文本**。

几个关键概念：

- **Token**：模型处理文本的最小单位。一个中文字通常是 1-2 个 token，一个英文单词通常是 1-3 个 token。
- **上下文窗口（Context Window）**：模型一次能"看到"的最大 token 数量。例如 GPT-4o 的上下文窗口为 128K tokens。
- **推理（Inference）**：把输入交给模型，模型生成输出的过程。

### 代码示例：第一次调用大模型

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "用一句话解释什么是人工智能"}
    ],
)

print(response.choices[0].message.content)
```

### 讲解重点

- LLM 本质上是一个"文本接龙"引擎——给它一段文字，它续写下一段
- Token 是计费和上下文限制的基本单位，理解 token 对控制成本很重要
- 模型本身没有记忆，每次调用都是独立的——这一点在理解 Agent 时非常关键

---

## 2. 什么是 Prompt

Prompt 就是你发送给模型的文本指令。OpenAI API 中有两种核心角色：

- **System Prompt（`system`）**：设定模型的行为方式、角色和规则。模型会始终遵循这个"人设"。
- **User Prompt（`user`）**：用户的实际问题或请求。

System Prompt 就像给模型一个"剧本"，决定了它以什么身份、什么风格回答问题。

### 代码示例：不同 System Prompt 的效果

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def ask(system_prompt: str, user_question: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_question},
        ],
    )
    return response.choices[0].message.content

question = "Python 的 GIL 是什么？"

# 场景 1：技术专家
print("=== 技术专家 ===")
print(ask("你是一位资深 Python 技术专家，用专业术语回答问题。", question))

# 场景 2：幼儿园老师
print("\n=== 幼儿园老师 ===")
print(ask("你是一位幼儿园老师，用 5 岁小朋友能听懂的方式解释一切。", question))

# 场景 3：限定输出格式
print("\n=== JSON 格式 ===")
print(ask("你是一位技术顾问。始终用 JSON 格式回答，包含 term、definition、example 三个字段。", question))
```

### 讲解重点

- System Prompt 是控制模型行为的最重要手段——同样的问题，不同的 system prompt 会得到完全不同的回答
- 在 Agent 系统中，System Prompt 用来定义 Agent 的角色、能力范围和行为规则
- Prompt 工程（Prompt Engineering）是构建 Agent 的基础技能

---

## 3. 什么是 Tool Calling

Tool Calling（工具调用）是让模型能够"动手做事"的关键机制。

核心思想：**模型自己不执行任何操作，但它可以告诉你"我想调用某个函数，参数是什么"**。

流程如下：
1. 你告诉模型有哪些工具可用（通过 JSON Schema 描述函数）
2. 用户提出问题
3. 模型判断是否需要调用工具，如果需要，返回函数名和参数
4. 你的代码执行该函数，把结果返回给模型
5. 模型根据结果生成最终回答

### 代码示例：定义一个工具的 Schema

```python
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# 定义工具：获取天气信息
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的当前天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，例如：北京、上海",
                    },
                },
                "required": ["city"],
            },
        },
    }
]

# 发送请求，模型会决定是否调用工具
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "北京今天天气怎么样？"}
    ],
    tools=tools,
)

message = response.choices[0].message

# 检查模型是否想调用工具
if message.tool_calls:
    call = message.tool_calls[0]
    print(f"模型想调用函数: {call.function.name}")
    print(f"参数: {call.function.arguments}")
else:
    print(f"模型直接回答: {message.content}")
```

输出类似：

```
模型想调用函数: get_weather
参数: {"city": "北京"}
```

> **注意**：这里我们只展示了工具定义和模型的调用意图。完整的 Tool Calling 循环（调用函数 → 返回结果 → 模型生成回答）将在 Day 3 详细实现。

### 讲解重点

- Tool Calling 让模型从"只能说"变成"能做事"——这是 Agent 的核心突破
- 模型并不执行函数，它只是生成调用指令（函数名 + 参数），由你的代码负责执行
- 工具的定义用 JSON Schema 描述，模型通过 description 理解每个工具的用途

---

## 4. Agent 和普通问答助手的区别

| 维度 | 普通问答助手 | Agent |
|------|-------------|-------|
| 流程 | 用户提问 → 模型回答（一轮） | 用户提问 → 模型思考 → 调用工具 → 分析结果 → 继续思考… → 最终回答（多轮循环） |
| 能力 | 只能基于训练数据回答 | 可以查询实时数据、执行操作、调用 API |
| 记忆 | 没有跨会话记忆 | 可以维护对话历史和状态 |
| 决策 | 被动回答 | 主动规划、分步执行 |

### 代码示例：普通助手 vs Agent（对比）

```python
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


# ========== 普通问答助手 ==========
def simple_chatbot(question: str) -> str:
    """最简单的问答：一问一答，没有工具，没有记忆"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": question}],
    )
    return response.choices[0].message.content


# ========== 基础 Agent 循环 ==========
def fake_get_weather(city: str) -> str:
    """模拟天气 API"""
    return json.dumps({"city": city, "temp": "22°C", "condition": "晴"})


def basic_agent(question: str) -> str:
    """带工具调用的 Agent：能判断是否需要工具，执行后再回答"""
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "获取指定城市的当前天气",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "城市名称"},
                    },
                    "required": ["city"],
                },
            },
        }
    ]

    messages = [{"role": "user", "content": question}]

    # 第一轮：模型决定是否调用工具
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
    )
    message = response.choices[0].message

    # 如果模型不需要工具，直接返回
    if not message.tool_calls:
        return message.content

    # 执行工具调用
    messages.append(message)
    for call in message.tool_calls:
        if call.function.name == "get_weather":
            args = json.loads(call.function.arguments)
            result = fake_get_weather(args["city"])
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": result,
            })

    # 第二轮：模型根据工具结果生成最终回答
    final = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
    )
    return final.choices[0].message.content


# 测试对比
print("=== 普通助手 ===")
print(simple_chatbot("北京今天天气怎么样？"))
# 只能说"我无法获取实时天气"

print("\n=== 基础 Agent ===")
print(basic_agent("北京今天天气怎么样？"))
# 调用天气工具后，给出具体回答
```

### 讲解重点

- 普通助手是"一问一答"的单轮对话，Agent 是"思考—行动—观察"的多轮循环
- Agent 的关键能力是**自主决策**：它决定用不用工具、用哪个工具、什么时候结束
- 即使是最简单的 Agent，也比普通助手多了"调用工具"和"处理结果"两个步骤

---

## 5. 产出：Agent = LLM + Tools + Memory + Workflow

一句话总结：

> **Agent 不是一个更聪明的聊天机器人，而是一个能"思考—行动—反思"的自主系统。**

### 架构图

```
┌─────────────────────────────────────────────┐
│                   Agent                      │
│                                              │
│  ┌─────────┐   ┌─────────┐   ┌───────────┐ │
│  │   LLM   │   │  Tools  │   │  Memory   │ │
│  │  大脑    │   │  双手    │   │  记忆     │ │
│  │         │   │         │   │           │ │
│  │ 理解意图 │   │ 查天气   │   │ 对话历史  │ │
│  │ 生成计划 │   │ 查数据库 │   │ 用户偏好  │ │
│  │ 做出决策 │   │ 发邮件   │   │ 任务状态  │ │
│  └─────────┘   └─────────┘   └───────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │            Workflow 工作流            │   │
│  │                                      │   │
│  │  用户输入 → 理解 → 规划 → 执行 →     │   │
│  │  观察结果 → 决定下一步 → … → 输出    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 代码示例：Agent 骨架类

```python
import os
import json
from openai import OpenAI


class SimpleAgent:
    """最小化的 Agent 骨架，展示四大组成部分"""

    def __init__(self, system_prompt: str, tools: list):
        # LLM：大脑
        self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.model = "gpt-4o-mini"
        self.system_prompt = system_prompt

        # Tools：能力
        self.tools = tools
        self.tool_functions = {}

        # Memory：记忆（这里用最简单的消息列表）
        self.memory = [
            {"role": "system", "content": system_prompt}
        ]

    def register_tool(self, name: str, func):
        """注册一个可调用的工具函数"""
        self.tool_functions[name] = func

    def run(self, user_input: str) -> str:
        """Workflow：思考—行动—观察 循环"""
        self.memory.append({"role": "user", "content": user_input})

        while True:
            # 1. 思考：让 LLM 决定下一步
            response = self.client.chat.completions.create(
                model=self.model,
                messages=self.memory,
                tools=self.tools if self.tools else None,
            )
            message = response.choices[0].message

            # 2. 如果不需要工具，返回最终回答
            if not message.tool_calls:
                self.memory.append(message)
                return message.content

            # 3. 行动：执行工具调用
            self.memory.append(message)
            for call in message.tool_calls:
                func = self.tool_functions.get(call.function.name)
                if func:
                    args = json.loads(call.function.arguments)
                    result = func(**args)
                else:
                    result = f"未知工具: {call.function.name}"

                # 4. 观察：把结果存入记忆
                self.memory.append({
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": str(result),
                })

            # 循环继续，LLM 会根据工具结果决定下一步


# ========== 使用示例 ==========
if __name__ == "__main__":
    # 定义工具
    tools = [
        {
            "type": "function",
            "function": {
                "name": "calculate",
                "description": "计算数学表达式的结果",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "数学表达式，如 2+3*4",
                        },
                    },
                    "required": ["expression"],
                },
            },
        }
    ]

    def safe_calculate(expression: str) -> str:
        """简单的数学计算（仅用于演示）"""
        allowed_chars = set("0123456789+-*/().% ")
        if all(c in allowed_chars for c in expression):
            return str(eval(expression))  # noqa: S307
        return "不支持的表达式"

    # 创建 Agent
    agent = SimpleAgent(
        system_prompt="你是一个有用的助手，可以帮用户做数学计算。",
        tools=tools,
    )

    # 注册工具函数
    agent.register_tool("calculate", safe_calculate)

    # 运行
    answer = agent.run("请帮我算一下 (17 + 23) * 5 等于多少")
    print(answer)
```

### 讲解重点

- **LLM** 是大脑，负责理解、推理和决策
- **Tools** 是双手，让 Agent 能与外部世界交互
- **Memory** 是记忆，保存对话历史和状态，让 Agent 能进行多轮连贯的交互
- **Workflow** 是工作流，定义了"思考→行动→观察"的循环，这是 Agent 与普通助手的根本区别

---

## 今日回顾

完成 Day 1 后，你应该能回答以下问题：

1. LLM 的 token 和上下文窗口是什么意思？
2. System Prompt 和 User Prompt 分别起什么作用？
3. Tool Calling 的流程是怎样的？模型真的"执行"了函数吗？
4. Agent 和普通聊天机器人最本质的区别是什么？
5. Agent 的四大组成部分各自负责什么？

> **下一步**：Day 2 将深入学习 Prompt Engineering 和多轮对话管理，这是构建可靠 Agent 的基础。
