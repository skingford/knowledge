---
search: false
---

# Day 2：学会调用 LLM API

> 7 天 Agent 学习路线 — 第 2 天 | [返回总览](../agent-learning-roadmap.md)

## 学习目标

- 理解 API Key 认证机制与请求/响应结构
- 掌握 System Prompt、User Prompt、Assistant 三种角色的用法
- 学会控制 Temperature、Max Tokens 等生成参数
- 能够让模型返回结构化 JSON 数据
- 完成一个可交互的多轮聊天脚本
- 了解流式输出的原理与实现

## 前置准备

```bash
pip install openai anthropic
```

设置环境变量（推荐写入 `.env` 或 shell profile）：

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

## 快速导航

- [1. API Key、Request、Response](#_1-api-key、request、response)
- [2. System Prompt / User Prompt](#_2-system-prompt-user-prompt)
- [3. Temperature、Max Tokens](#_3-temperature、max-tokens)
- [4. 结构化输出](#_4-结构化输出)
- [5. 实操：写一个最简单的聊天脚本](#_5-实操-写一个最简单的聊天脚本)
- [6. 流式输出](#_6-流式输出)

---

## 1. API Key、Request、Response

### 什么是 API Key？

API Key 是你调用 LLM 服务的身份凭证。每次请求都需要在 HTTP Header 中携带它，服务端据此识别调用者并计费。

核心原则：**永远不要把 API Key 硬编码在代码里**，应该通过环境变量读取。

### 一次完整的请求流程

```
你的代码 → HTTP POST 请求(携带 API Key + 消息) → LLM 服务端 → 返回 JSON 响应
```

### 代码：基础聊天请求

```python
import os
from openai import OpenAI

# 从环境变量读取 API Key（SDK 默认读取 OPENAI_API_KEY）
client = OpenAI()

# 发送一次聊天请求
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "用一句话解释什么是 API"}
    ],
)

# 解析响应
message = response.choices[0].message
print(f"模型回复: {message.content}")
print(f"角色: {message.role}")
print(f"Token 用量: {response.usage}")
# → CompletionUsage(completion_tokens=29, prompt_tokens=15, total_tokens=44)
```

### 响应结构拆解

```python
# response 对象的关键字段
response.id                        # 请求唯一标识
response.model                     # 实际使用的模型
response.choices[0].message        # 模型的回复消息
response.choices[0].finish_reason  # 停止原因: "stop" | "length" | "tool_calls"
response.usage.prompt_tokens       # 输入消耗的 token 数
response.usage.completion_tokens   # 输出消耗的 token 数
response.usage.total_tokens        # 总 token 数（与费用直接相关）
```

### 讲解重点

- `choices` 是一个列表，通常只有一个元素（`n=1` 时）
- `finish_reason` 为 `"stop"` 表示模型自然结束，为 `"length"` 表示触及了 `max_tokens` 上限被截断
- `usage` 用来跟踪成本——每次请求都应该关注

---

## 2. System Prompt / User Prompt

### 三种角色

LLM 对话中有三个角色，各有分工：

| 角色 | 作用 | 典型内容 |
|------|------|----------|
| `system` | 设定模型的身份和行为规则 | "你是一个专业的翻译助手，只回复翻译结果" |
| `user` | 用户的输入 | "把这段话翻译成英文：……" |
| `assistant` | 模型之前的回复（用于多轮上下文） | 上一次模型的输出 |

### 代码：多轮对话中的角色管理

```python
import os
from openai import OpenAI

client = OpenAI()

def chat_with_history():
    """演示多轮对话中如何管理消息历史"""
    messages = [
        {
            "role": "system",
            "content": (
                "你是一个 Python 编程助手。"
                "回答要简洁，代码要带注释。"
                "如果用户问的不是编程问题，礼貌地引导回编程话题。"
            ),
        }
    ]

    # 第一轮
    messages.append({"role": "user", "content": "怎么读取一个 JSON 文件？"})
    resp1 = client.chat.completions.create(model="gpt-4o", messages=messages)
    assistant_msg1 = resp1.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_msg1})
    print(f"助手: {assistant_msg1}\n")

    # 第二轮——模型能记住上下文
    messages.append({"role": "user", "content": "如果文件不存在怎么处理？"})
    resp2 = client.chat.completions.create(model="gpt-4o", messages=messages)
    assistant_msg2 = resp2.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_msg2})
    print(f"助手: {assistant_msg2}\n")

    # 查看完整消息历史
    print(f"消息历史共 {len(messages)} 条")
    for msg in messages:
        print(f"  [{msg['role']}] {msg['content'][:50]}...")

chat_with_history()
```

### 讲解重点

- **System Prompt 是最重要的控制手段**：它决定了模型的"人设"和行为边界，优先级高于 User 消息
- **多轮对话的本质**：每次请求都把完整的历史消息列表发给模型，模型本身没有记忆
- **消息列表会越来越长**：实际项目中需要做截断或摘要，否则会超出上下文窗口并增加成本
- 尽量把 System Prompt 写得具体、明确，避免模糊指令

---

## 3. Temperature、Max Tokens

### Temperature 是什么？

Temperature 控制模型输出的**随机性**：

| 值 | 效果 | 适用场景 |
|----|------|----------|
| `0` | 几乎确定性输出，每次结果一致 | 数据提取、分类、代码生成 |
| `0.3-0.7` | 平衡创造性和一致性 | 一般对话、问答 |
| `1.0+` | 高随机性，输出更有创意 | 创意写作、头脑风暴 |

### Max Tokens 是什么？

`max_tokens` 限制模型**输出**的最大 token 数。注意它不影响输入——输入长度由模型的上下文窗口决定。

### 代码：对比不同 Temperature 的输出

```python
import os
from openai import OpenAI

client = OpenAI()

def compare_temperatures(prompt: str, temperatures: list[float], n_runs: int = 3):
    """对比不同 temperature 下同一 prompt 的输出差异"""
    for temp in temperatures:
        print(f"\n{'='*50}")
        print(f"Temperature = {temp}")
        print('='*50)

        for i in range(n_runs):
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=temp,
                max_tokens=100,   # 限制输出长度，方便对比
            )
            text = response.choices[0].message.content
            print(f"  第 {i+1} 次: {text}")

# 试试看
compare_temperatures(
    prompt="用一个比喻解释什么是递归",
    temperatures=[0, 0.5, 1.0],
    n_runs=3,
)
```

运行后你会发现：
- `temperature=0` 时，三次输出几乎完全相同
- `temperature=1.0` 时，三次输出的比喻各不相同

### 讲解重点

- **做 Agent 开发时，通常设 `temperature=0`**，因为你希望模型的行为稳定、可预测
- `max_tokens` 设太小会导致输出被截断（`finish_reason="length"`），设太大会浪费成本预算
- 还有一个参数 `top_p`（核采样），和 Temperature 类似但机制不同，一般二选一调节即可

---

## 4. 结构化输出

### 为什么需要结构化输出？

模型默认返回自然语言文本，但在 Agent 开发中，我们经常需要模型返回**可解析的 JSON**，比如：
- 从一段文字中提取实体
- 让模型输出一个工具调用的参数
- 将非结构化数据转为结构化数据

### 方法：使用 `response_format`

OpenAI 支持通过 `response_format` 参数强制模型输出 JSON。最可靠的方式是使用 JSON Schema 约束。

### 代码：从文本中提取结构化数据

```python
import os
import json
from openai import OpenAI

client = OpenAI()

def extract_person_info(text: str) -> dict:
    """从自然语言文本中提取人物信息，返回结构化 JSON"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "你是一个信息提取助手。从用户提供的文本中提取人物信息。",
            },
            {
                "role": "user",
                "content": f"请从以下文本中提取人物信息：\n\n{text}",
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "person_info",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "人物姓名",
                        },
                        "age": {
                            "type": ["integer", "null"],
                            "description": "年龄，未知则为 null",
                        },
                        "occupation": {
                            "type": ["string", "null"],
                            "description": "职业",
                        },
                        "skills": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "技能列表",
                        },
                    },
                    "required": ["name", "age", "occupation", "skills"],
                    "additionalProperties": False,
                },
            },
        },
    )

    result = json.loads(response.choices[0].message.content)
    return result


# 测试
text = "张三今年 28 岁，是一名后端工程师，擅长 Python、Go 和 Kubernetes。"
info = extract_person_info(text)
print(json.dumps(info, ensure_ascii=False, indent=2))
# 输出:
# {
#   "name": "张三",
#   "age": 28,
#   "occupation": "后端工程师",
#   "skills": ["Python", "Go", "Kubernetes"]
# }
```

### 讲解重点

- `"strict": True` 会让模型严格遵循你定义的 JSON Schema，字段不会多也不会少
- `response_format` 与 System Prompt 中写"请返回 JSON"不同：前者是引擎级别的保证，后者只是提示
- 结构化输出是 Agent 开发的基础——Tool Calling 本质上就是让模型输出结构化的函数调用参数

---

## 5. 实操：写一个最简单的聊天脚本

### OpenAI 版本

```python
import os
from openai import OpenAI

def main():
    client = OpenAI()

    messages = [
        {
            "role": "system",
            "content": "你是一个友好的 AI 助手。回答要简洁清晰。",
        }
    ]

    print("聊天已开始（输入 'quit' 退出）")
    print("-" * 40)

    while True:
        user_input = input("\n你: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            print("再见！")
            break

        # 将用户输入加入历史
        messages.append({"role": "user", "content": user_input})

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            assistant_content = response.choices[0].message.content

            # 将助手回复加入历史，维持多轮上下文
            messages.append({"role": "assistant", "content": assistant_content})

            print(f"\n助手: {assistant_content}")
            print(f"  (tokens: {response.usage.total_tokens})")

        except Exception as e:
            print(f"\n请求出错: {e}")
            # 出错时移除刚刚加入的 user 消息，避免污染历史
            messages.pop()

if __name__ == "__main__":
    main()
```

### Anthropic 版本

```python
import os
from anthropic import Anthropic

def main():
    client = Anthropic()

    # Anthropic 的 system prompt 不在 messages 列表里，而是单独的参数
    system_prompt = "你是一个友好的 AI 助手。回答要简洁清晰。"
    messages = []

    print("聊天已开始（输入 'quit' 退出）")
    print("-" * 40)

    while True:
        user_input = input("\n你: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            print("再见！")
            break

        messages.append({"role": "user", "content": user_input})

        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=system_prompt,    # system prompt 单独传
                messages=messages,
                temperature=0.7,
            )
            assistant_content = response.content[0].text

            messages.append({"role": "assistant", "content": assistant_content})

            print(f"\n助手: {assistant_content}")
            print(f"  (input tokens: {response.usage.input_tokens}, "
                  f"output tokens: {response.usage.output_tokens})")

        except Exception as e:
            print(f"\n请求出错: {e}")
            messages.pop()

if __name__ == "__main__":
    main()
```

### OpenAI vs Anthropic 对比

| 维度 | OpenAI | Anthropic |
|------|--------|-----------|
| System Prompt | 放在 `messages` 列表中 | 作为 `system` 参数单独传 |
| 响应内容 | `response.choices[0].message.content` | `response.content[0].text` |
| Token 用量 | `response.usage.total_tokens` | `response.usage.input_tokens` + `output_tokens` |
| 模型名称 | `gpt-4o` | `claude-sonnet-4-20250514` |

### 讲解重点

- **对话历史管理是核心**：`messages` 列表就是模型的全部记忆，你不传就没有上下文
- **错误处理很重要**：网络超时、API 限流、余额不足都可能发生，要做好异常捕获
- 这个脚本虽然简单，但已经具备了 Agent 的雏形——接下来加上 Tool Calling 就更像了

---

## 6. 流式输出

### 为什么需要流式输出？

标准请求需要等模型**完整生成**后才返回，用户可能等 5-10 秒看不到任何内容。流式输出（Streaming）让模型**边生成边返回**，每产生一个 token 就立刻推送给客户端，体验类似 ChatGPT 的逐字打印效果。

### 代码：流式聊天

```python
import os
from openai import OpenAI

client = OpenAI()

def stream_chat(prompt: str):
    """流式输出演示"""
    print("助手: ", end="", flush=True)

    # 关键：加上 stream=True
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "你是一个友好的助手。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        stream=True,    # 开启流式
    )

    collected_content = ""
    for chunk in stream:
        # 每个 chunk 包含一小段增量内容
        delta = chunk.choices[0].delta
        if delta.content:
            print(delta.content, end="", flush=True)
            collected_content += delta.content

    print()  # 换行
    return collected_content

# 使用
result = stream_chat("用 100 字介绍 Python 的 GIL")
print(f"\n完整回复长度: {len(result)} 字符")
```

### 流式输出的数据结构

```python
# 非流式：一次性返回完整 message
response.choices[0].message.content  # "完整的回复文本"

# 流式：逐块返回 delta
chunk.choices[0].delta.content       # "一小" → "段文" → "本" → ...
chunk.choices[0].finish_reason       # 最后一个 chunk 才有值 "stop"
```

### 讲解重点

- 流式和非流式的**最终结果完全一样**，区别只在传输方式
- 流式模式下需要自己拼接 `delta.content` 来得到完整回复
- Agent 场景中，流式输出让用户感知到"模型正在思考"，体验更好
- 注意 `flush=True`，否则 Python 的输出缓冲可能导致文字不是逐字显示

---

## 今日小结

| 知识点 | 关键理解 |
|--------|----------|
| API Key | 通过环境变量管理，永远不硬编码 |
| 消息角色 | system 定规则、user 提问题、assistant 存历史 |
| Temperature | Agent 开发通常用 0，创意任务用更高值 |
| 结构化输出 | `response_format` + JSON Schema = 可靠的结构化数据 |
| 多轮对话 | 本质就是维护一个 messages 列表 |
| 流式输出 | `stream=True` + 遍历 chunk，提升用户体验 |

## 明日预告

**Day 3：学会 Tool Calling** — 让模型不仅会说，还会"做事"。模型自主决定调用哪个函数、传什么参数，你来执行并返回结果。
