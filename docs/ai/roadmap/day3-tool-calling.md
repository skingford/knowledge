---
title: Day 3：Tool Calling / Function Calling
description: Agent 学习路线第 3 天，系统理解 Tool Calling 原理、工具描述方式与函数调用流程。
search: false
---

# Day 3：Tool Calling / Function Calling

## 今日目标

- 理解 Tool Calling 的工作原理：模型不直接执行函数，而是返回"我想调用哪个函数、传什么参数"
- 掌握工具描述的写法（JSON Schema）
- 实现完整的 Tool Calling 循环
- 构建一个包含三个工具的小助手

> 进阶设计原则请参考 [Tool Calling 设计清单](../tool-calling-design-checklist.md)

---

## 1. Function Calling 基础

### 核心概念

传统对话中，模型返回的是文本内容（`content`）。而在 Tool Calling 模式下，模型可以返回一个 **`tool_calls`** 字段，告诉你：

- 我想调用哪个函数（`function.name`）
- 我想传什么参数（`function.arguments`）

**关键认知：模型本身不执行任何函数。** 它只是告诉你"我觉得应该调用这个工具"，真正的执行由你的代码完成。

### 请求-响应周期

```
用户消息 → 模型判断 → 返回 tool_calls → 你执行函数 → 把结果喂回模型 → 模型生成最终回答
```

用一个简单的例子来说明：

```python
from openai import OpenAI

client = OpenAI()

# 第一步：发送带工具定义的请求
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的当前天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如：北京、上海"
                    }
                },
                "required": ["city"]
            }
        }
    }]
)

message = response.choices[0].message

# 第二步：检查模型是否想调用工具
if message.tool_calls:
    tool_call = message.tool_calls[0]
    print(f"模型想调用: {tool_call.function.name}")
    print(f"参数: {tool_call.function.arguments}")
    # 输出: 模型想调用: get_weather
    # 输出: 参数: {"city": "北京"}
else:
    print(f"模型直接回答: {message.content}")
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| `tools` 参数 | 告诉模型有哪些工具可用 |
| `tool_calls` | 模型返回的工具调用请求，可能为 `None` |
| `function.arguments` | JSON 字符串，需要用 `json.loads()` 解析 |
| 模型不执行函数 | 模型只做决策，执行在你的代码里 |

---

## 2. 工具描述怎么写

工具描述的质量直接决定模型能不能正确调用工具。核心格式是 **JSON Schema**。

### 完整的工具定义结构

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "函数名",           # 简短、明确的动词短语
            "description": "函数描述",   # 告诉模型什么时候该用这个工具
            "parameters": {              # JSON Schema 格式
                "type": "object",
                "properties": {
                    "参数名": {
                        "type": "类型",
                        "description": "参数描述"
                    }
                },
                "required": ["必填参数"]
            }
        }
    }
]
```

### 好的描述 vs 坏的描述

```python
# ❌ 坏的描述：模糊、缺少上下文
bad_tool = {
    "type": "function",
    "function": {
        "name": "search",
        "description": "搜索",
        "parameters": {
            "type": "object",
            "properties": {
                "q": {"type": "string"}
            }
        }
    }
}

# ✅ 好的描述：明确、具体、有边界
good_tool = {
    "type": "function",
    "function": {
        "name": "search_web",
        "description": "使用搜索引擎查找实时信息。适用于用户询问最新新闻、实时数据、或模型训练数据之后发生的事件。不要用于常识性问题。",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词，应简洁且有针对性，如：'2024年奥运会金牌榜'"
                }
            },
            "required": ["query"]
        }
    }
}
```

### 实操：定义天气、搜索、时间三个工具

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的当前天气信息，包括温度、天气状况和湿度。当用户询问某个城市的天气时调用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如：北京、上海、广州"
                    }
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "使用搜索引擎查找实时信息。适用于用户询问最新新闻、实时数据、或需要联网才能获得的信息。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词，应简洁有针对性"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "获取当前的日期和时间。当用户询问现在几点、今天日期时调用。不需要任何参数。",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| `name` | 用动词短语，如 `get_weather`、`search_web`，不要用 `weather`、`search` |
| `description` | 写清楚**什么时候该调用**和**什么时候不该调用** |
| `parameters.description` | 给出示例值，帮助模型理解参数格式 |
| `required` | 明确标注必填字段，减少模型遗漏参数 |

---

## 3. 模型如何选择调用工具

### tool_choice 参数

你可以通过 `tool_choice` 控制模型的工具调用行为：

```python
# auto（默认）：模型自行决定是否调用工具
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools,
    tool_choice="auto"       # 模型自己判断
)

# required：强制模型必须调用至少一个工具
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools,
    tool_choice="required"   # 必须调用工具
)

# none：禁止模型调用工具，只能用文本回答
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools,
    tool_choice="none"       # 禁止调用工具
)

# 指定某个工具：强制调用特定工具
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools,
    tool_choice={            # 强制调用 get_weather
        "type": "function",
        "function": {"name": "get_weather"}
    }
)
```

### 模型的决策逻辑

模型根据以下信息决定是否调用工具：

1. **用户消息内容** — "北京天气怎么样" → 匹配 `get_weather`
2. **工具的 description** — 模型把用户意图和工具描述做匹配
3. **对话历史** — 上下文会影响模型的判断

```python
# 示例：不同输入 → 不同决策
test_messages = [
    "北京今天天气怎么样？",       # → 调用 get_weather
    "帮我搜一下最新的AI新闻",     # → 调用 search_web
    "现在几点了？",               # → 调用 get_current_time
    "你好，介绍一下你自己",        # → 不调用工具，直接文本回答
]
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| `auto` | 最常用，让模型自己判断。大多数场景用这个 |
| `required` | 适合必须走工具的场景，如表单填充 |
| `none` | 临时禁用工具，用于调试或特定流程 |
| 指定工具 | 当你已经知道该调用哪个工具时使用 |

---

## 4. 完整 Tool Calling 循环

这是 Tool Calling 最核心的部分：**完整的调用循环**。

### 流程图

```
用户输入
   ↓
发送消息 + 工具定义给模型
   ↓
模型返回 ─── 有 tool_calls? ─── 否 → 输出 content，结束
                  │
                  是
                  ↓
            执行对应函数
                  ↓
        把函数结果作为 tool message 追加到消息列表
                  ↓
        再次发送给模型（带上完整对话历史）
                  ↓
        模型返回 ─── 继续循环直到模型不再调用工具
```

### 完整代码实现

```python
import json
from openai import OpenAI

client = OpenAI()


# ---- 定义工具函数 ----
def get_weather(city: str) -> str:
    """模拟天气查询"""
    weather_data = {
        "北京": {"temp": "22°C", "condition": "晴", "humidity": "45%"},
        "上海": {"temp": "26°C", "condition": "多云", "humidity": "72%"},
        "广州": {"temp": "30°C", "condition": "雷阵雨", "humidity": "85%"},
    }
    data = weather_data.get(city, {"temp": "25°C", "condition": "晴", "humidity": "50%"})
    return json.dumps(data, ensure_ascii=False)


def search_web(query: str) -> str:
    """模拟搜索引擎"""
    return json.dumps({
        "results": [
            {"title": f"关于「{query}」的最新报道", "snippet": f"这是关于{query}的模拟搜索结果..."},
            {"title": f"{query} - 详细解读", "snippet": f"深入分析{query}的相关信息..."},
        ]
    }, ensure_ascii=False)


def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    now = datetime.now()
    return json.dumps({
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "weekday": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][now.weekday()]
    }, ensure_ascii=False)


# ---- 工具注册表：名称 → 函数 ----
TOOL_REGISTRY = {
    "get_weather": get_weather,
    "search_web": search_web,
    "get_current_time": get_current_time,
}


# ---- 执行工具调用 ----
def execute_tool_call(tool_call) -> str:
    """根据模型返回的 tool_call 执行对应函数"""
    func_name = tool_call.function.name
    func_args = json.loads(tool_call.function.arguments)

    func = TOOL_REGISTRY.get(func_name)
    if func is None:
        return json.dumps({"error": f"未知工具: {func_name}"})

    print(f"  🔧 执行工具: {func_name}({func_args})")
    return func(**func_args)


# ---- 核心：Tool Calling 循环 ----
def chat_with_tools(user_input: str, tools: list, messages: list = None):
    """完整的 Tool Calling 循环"""
    if messages is None:
        messages = []

    messages.append({"role": "user", "content": user_input})

    while True:
        # 发送请求
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
        )
        message = response.choices[0].message

        # 把 assistant 消息加入历史
        messages.append(message)

        # 如果没有 tool_calls，说明模型已经给出最终回答
        if not message.tool_calls:
            print(f"助手: {message.content}")
            return message.content

        # 执行每个 tool_call，并把结果追加到消息列表
        for tool_call in message.tool_calls:
            result = execute_tool_call(tool_call)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

        # 循环继续：带着工具结果再次请求模型
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| `while True` 循环 | 模型可能连续多次调用工具，直到它认为信息够了才给出文本回答 |
| `messages.append(message)` | 必须把 assistant 消息（含 tool_calls）原样加入历史 |
| `role: "tool"` | 工具结果必须用 `tool` 角色，并带上 `tool_call_id` |
| `tool_call_id` | 每个 tool_call 都有唯一 ID，结果必须和 ID 对应 |

---

## 5. 实操：天气、搜索、时间三工具小助手

把上面的代码组合成一个完整可运行的 Agent。

### 完整代码

```python
import json
from datetime import datetime
from openai import OpenAI

client = OpenAI()

# ============================================================
# 工具定义
# ============================================================
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的当前天气信息，包括温度、天气状况和湿度。当用户询问某个城市的天气时调用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如：北京、上海、广州"
                    }
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "使用搜索引擎查找实时信息。适用于最新新闻、实时数据等需要联网才能获得的信息。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词，应简洁有针对性"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "获取当前的日期和时间。当用户询问现在几点、今天日期、星期几时调用。不需要任何参数。",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

# ============================================================
# 工具实现
# ============================================================
def get_weather(city: str) -> str:
    """模拟天气 API，返回 mock 数据"""
    mock_data = {
        "北京": {"temp": "22°C", "condition": "晴", "humidity": "45%"},
        "上海": {"temp": "26°C", "condition": "多云", "humidity": "72%"},
        "广州": {"temp": "30°C", "condition": "雷阵雨", "humidity": "85%"},
        "深圳": {"temp": "29°C", "condition": "阴", "humidity": "78%"},
        "杭州": {"temp": "24°C", "condition": "小雨", "humidity": "80%"},
    }
    data = mock_data.get(city, {"temp": "25°C", "condition": "晴", "humidity": "60%"})
    data["city"] = city
    return json.dumps(data, ensure_ascii=False)


def search_web(query: str) -> str:
    """模拟搜索引擎，返回 mock 结果"""
    return json.dumps({
        "results": [
            {"title": f"关于「{query}」的最新报道", "snippet": f"这是关于 {query} 的搜索结果摘要。"},
            {"title": f"{query} - 深度解读", "snippet": f"专家对 {query} 进行了详细分析..."},
        ]
    }, ensure_ascii=False)


def get_current_time() -> str:
    """返回真实的当前时间"""
    now = datetime.now()
    return json.dumps({
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "weekday": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][now.weekday()]
    }, ensure_ascii=False)


# 工具注册表
TOOL_REGISTRY = {
    "get_weather": get_weather,
    "search_web": search_web,
    "get_current_time": get_current_time,
}

# ============================================================
# Agent 核心循环
# ============================================================
SYSTEM_PROMPT = "你是一个有用的助手，可以查询天气、搜索网页和告诉用户当前时间。请用中文回答。"


def execute_tool_call(tool_call) -> str:
    """执行单个工具调用"""
    name = tool_call.function.name
    args = json.loads(tool_call.function.arguments)
    func = TOOL_REGISTRY.get(name)
    if func is None:
        return json.dumps({"error": f"未知工具: {name}"}, ensure_ascii=False)
    print(f"  [工具调用] {name}({args})")
    return func(**args)


def agent_loop(user_input: str, messages: list):
    """Agent 主循环：处理用户输入，自动完成所有工具调用"""
    messages.append({"role": "user", "content": user_input})
    print(f"\n用户: {user_input}")

    while True:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
        )
        msg = response.choices[0].message
        messages.append(msg)

        # 没有工具调用 → 最终回答
        if not msg.tool_calls:
            print(f"助手: {msg.content}")
            return msg.content

        # 执行所有工具调用
        for tc in msg.tool_calls:
            result = execute_tool_call(tc)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })


def main():
    """交互式对话入口"""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    print("三工具小助手已启动！输入 'quit' 退出。\n")

    while True:
        user_input = input("你: ").strip()
        if user_input.lower() in ("quit", "exit", "q"):
            print("再见！")
            break
        if not user_input:
            continue
        agent_loop(user_input, messages)


if __name__ == "__main__":
    main()
```

### 运行效果示例

```
三工具小助手已启动！输入 'quit' 退出。

你: 北京天气怎么样？
  [工具调用] get_weather({"city": "北京"})
助手: 北京今天天气晴朗，气温 22°C，湿度 45%，非常适合户外活动！

你: 现在几点了？
  [工具调用] get_current_time({})
助手: 现在是 2024-12-10 15:30:22，星期二。

你: 帮我搜一下最新的大模型新闻
  [工具调用] search_web({"query": "最新大模型新闻"})
助手: 以下是搜索到的结果：
1. 关于「最新大模型新闻」的最新报道 - 这是关于最新大模型新闻的搜索结果摘要。
2. 最新大模型新闻 - 深度解读 - 专家对最新大模型新闻进行了详细分析...
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| `TOOL_REGISTRY` | 用字典做函数映射，避免 if-else 链 |
| `messages` 持久化 | 对话历史在多轮对话间保持，模型能记住上下文 |
| `while True` | Agent 循环直到模型不再调用工具 |
| mock 实现 | 学习阶段用 mock 数据，生产环境替换为真实 API |

---

## 6. 并行工具调用 (Parallel Tool Calls)

当用户的问题涉及多个工具时，模型可以在**一次响应中返回多个 tool_calls**，即并行调用。

### 什么时候会触发

```python
# 用户同时问了两个问题 → 模型可能同时调用两个工具
user_input = "北京和上海今天天气怎么样？"

# 模型可能返回：
# tool_calls = [
#   { name: "get_weather", arguments: {"city": "北京"} },
#   { name: "get_weather", arguments: {"city": "上海"} },
# ]
```

### 处理并行调用的代码

我们在第 4 节的循环中已经处理了这种情况（`for tc in msg.tool_calls` 遍历所有调用）。这里单独演示以加深理解：

```python
import json
from openai import OpenAI

client = OpenAI()


def handle_parallel_tool_calls():
    """演示并行工具调用的处理"""
    messages = [
        {"role": "system", "content": "你是一个有用的助手。"},
        {"role": "user", "content": "北京和上海今天天气怎么样？顺便告诉我现在几点。"},
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,  # 复用前面定义的 tools
    )
    msg = response.choices[0].message

    print(f"模型返回了 {len(msg.tool_calls)} 个工具调用：")
    for i, tc in enumerate(msg.tool_calls):
        print(f"  [{i+1}] {tc.function.name}({tc.function.arguments})")

    # 关键：每个 tool_call 的结果都必须单独返回，并带上对应的 tool_call_id
    messages.append(msg)
    for tc in msg.tool_calls:
        result = execute_tool_call(tc)
        messages.append({
            "role": "tool",
            "tool_call_id": tc.id,   # 必须和 tool_call 的 id 对应
            "content": result,
        })

    # 带着所有工具结果，再次请求模型
    final_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
    )
    print(f"\n助手: {final_response.choices[0].message.content}")


handle_parallel_tool_calls()
```

### 输出示例

```
模型返回了 3 个工具调用：
  [1] get_weather({"city": "北京"})
  [2] get_weather({"city": "上海"})
  [3] get_current_time({})

助手: 这是目前的信息：

🌤 **北京**：晴，气温 22°C，湿度 45%
☁️ **上海**：多云，气温 26°C，湿度 72%

🕐 当前时间：2024-12-10 15:30:22，星期二
```

### 禁用并行调用

如果你不希望模型一次调用多个工具，可以设置 `parallel_tool_calls=False`：

```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools,
    parallel_tool_calls=False,  # 禁用并行，模型每次只调用一个工具
)
```

### 讲解重点

| 要点 | 说明 |
|------|------|
| 并行调用 | 模型可以在一次响应中返回多个 `tool_calls` |
| `tool_call_id` | 每个结果必须通过 `tool_call_id` 和请求一一对应 |
| 遍历处理 | 用 `for tc in msg.tool_calls` 处理所有调用 |
| `parallel_tool_calls` | 设为 `False` 可以强制每次只调一个工具 |

---

## 今日小结

| 概念 | 要记住的 |
|------|----------|
| Tool Calling 本质 | 模型不执行函数，只返回"我想调用什么" |
| 工具描述 | `name` 用动词，`description` 写清使用场景 |
| `tool_choice` | `auto` 最常用，`required` 强制调用 |
| 完整循环 | `while True` → 请求 → 检查 tool_calls → 执行 → 喂回结果 → 再请求 |
| 并行调用 | 一次响应可能有多个 tool_calls，用 `tool_call_id` 一一对应 |

## 明日预告

**Day 4** 我们将学习 **ReAct 模式与多步推理**，让 Agent 具备"思考-行动-观察"的能力循环，处理更复杂的任务。
