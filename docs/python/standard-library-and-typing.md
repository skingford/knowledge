---
title: Python 标准库与 typing 必修清单
description: 系统整理 Python 标准库高频模块、typing 基础、接口边界建模与工程中最常见的使用建议。
---

# Python 标准库与 typing 必修清单

很多人写 Python 一段时间后，代码问题通常不是“语法不会”，而是：

- 明明标准库能解决，却重新造轮子
- 函数参数和返回值没有边界，读代码很累
- 项目越变越大后，调用关系开始模糊

这篇文档专门解决两个问题：

1. 哪些标准库是必须熟悉的
2. `typing` 到底该学到什么程度，才算足够支撑工程协作

## 一、先建立一个实用原则

### 1. 标准库优先

写 Python 时，默认顺序建议是：

1. 先看内置能力和标准库能不能解决
2. 再考虑第三方库
3. 最后才考虑自己实现

原因很实际：

- 标准库依赖少
- 可移植性强
- 团队更容易理解
- 维护成本通常更低

### 2. typing 的目标不是把 Python 变成静态语言

`typing` 更像一种工程协作工具，用来解决：

- 函数到底接收什么
- 返回值大概长什么样
- 某段数据结构有没有清晰边界
- 编辑器和静态分析工具能不能提前发现问题

## 二、必须熟悉的标准库模块

### 1. `pathlib`

路径处理建议尽快从字符串拼接迁移到 `Path`。

```python
from pathlib import Path

root = Path("data")
file_path = root / "users.json"
```

推荐原因：

- 路径拼接更清晰
- 代码可读性更高
- 文件操作接口更统一

必须掌握：

- 路径拼接
- 是否存在判断
- 创建目录
- 读写文本和二进制

### 2. `collections`

这是 Python 日常开发非常高频的一组工具。

最值得优先掌握的几个：

- `Counter`
- `defaultdict`
- `deque`
- `namedtuple`

#### `Counter`

适合计数、词频、状态汇总。

```python
from collections import Counter

counter = Counter(["ok", "ok", "fail"])
print(counter["ok"])  # 2
```

#### `defaultdict`

适合减少“键不存在就初始化”的重复代码。

```python
from collections import defaultdict

groups = defaultdict(list)
groups["a"].append(1)
```

#### `deque`

适合队列和双端操作，不要总拿 `list` 模拟所有队列场景。

### 3. `itertools`

如果你经常处理批量遍历、组合、流式管道，`itertools` 非常有用。

至少知道这些：

- `chain`
- `islice`
- `product`
- `groupby`
- `zip_longest`

它的价值在于：

- 减少中间列表创建
- 让“处理流”更自然

### 4. `functools`

这组工具会频繁出现在装饰器和函数式组合场景中。

最值得优先掌握：

- `wraps`
- `lru_cache`
- `partial`
- `reduce`

#### `wraps`

写装饰器时尽量都带上它，避免丢失函数名、签名和文档字符串。

#### `lru_cache`

适合纯函数、重复计算缓存。

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```

### 5. `json`

这是现代服务和工具开发的基础模块。

必须掌握：

- `loads` 和 `dumps`
- `load` 和 `dump`
- 编码问题
- 自定义对象不是天然可序列化

工程里要注意：

- JSON 适合交换数据，不等于领域模型
- 输入 JSON 时要做字段校验
- 精度敏感数据不要想当然用 `float`

### 6. `datetime`

时间处理是工程里非常高频、也非常容易出错的一类问题。

至少要理解：

- “时间点”和“格式化字符串”不是一回事
- naive datetime 和 aware datetime 的区别
- 时区问题不能长期模糊处理

更稳的原则：

- 统一存储策略
- 清晰区分展示时间和计算时间
- 在接口边界明确时区语义

### 7. `logging`

日志不是 `print` 的替代品，而是工程可观测性的基本能力。

必须掌握：

- 日志级别
- logger 命名
- 格式化输出
- 异常日志

更重要的是建立几个习惯：

- 不要把业务主流程写满 `print`
- 错误日志要有上下文
- 不要在日志里泄露敏感信息

### 8. `subprocess`

写工具脚本、平台任务和自动化时经常需要调外部命令。

至少要知道：

- 何时用 `run`
- 何时需要捕获输出
- 何时要设置超时
- 不要随便拼接不可信命令字符串

### 9. `re`

正则表达式很常用，但不要滥用。

更稳的原则：

- 简单字符串匹配优先用普通字符串方法
- 真正需要模式提取时再上正则
- 复杂表达式尽量写注释或拆开

## 三、typing 必须掌握到什么程度

### 1. 最低要求

如果你要写可维护的 Python 工程代码，至少应该能熟练写：

- 基础类型标注
- 容器类型标注
- 可选值标注
- 函数返回值标注

```python
def load_users(path: str) -> list[dict[str, str]]:
    ...
```

### 2. 最常见的高频类型

| 类型 | 典型用途 |
| --- | --- |
| `list[str]` | 一组字符串 |
| `dict[str, int]` | 键值结构 |
| `str | None` | 可空值 |
| `Any` | 暂时无法精确描述的边界 |
| `Callable[..., str]` | 回调函数 |
| `Iterable[str]` | 只要求可遍历 |
| `Sequence[str]` | 只读序列语义 |
| `Mapping[str, str]` | 只读映射语义 |

### 3. `list`、`Sequence`、`Iterable` 怎么选

这是非常实用的接口设计问题。

- 如果函数只需要遍历，优先标成 `Iterable`
- 如果函数需要长度和索引，但不修改，优先 `Sequence`
- 如果函数明确要列表语义或会原地修改，再用 `list`

这体现的是接口最小承诺原则：

- 参数边界越宽松，调用方越容易复用
- 返回值边界越清晰，使用者越容易理解

### 4. `dict`、`Mapping` 怎么选

和上面类似：

- 只读映射语义优先 `Mapping`
- 确实依赖可变字典行为再写 `dict`

## 四、几个值得尽早掌握的 typing 工具

### 1. `TypedDict`

当你处理“固定键结构的字典”时，`TypedDict` 很有用。

```python
from typing import TypedDict

class UserPayload(TypedDict):
    name: str
    age: int
```

适合场景：

- 接口请求体
- 配置项
- JSON 解析后的中间层结构

### 2. `Protocol`

如果你想表达“只要有某组方法就可以”，`Protocol` 很合适。

它体现的是结构化接口，而不是必须继承某个基类。

这在 Python 风格里非常自然，因为很多时候我们更关心：

- 这个对象会不会 `read`
- 会不会 `write`
- 会不会 `send`

而不是它继承了谁。

### 3. `Literal`

适合约束一组有限字符串值。

比如：

- 状态值
- 模式值
- 策略开关

这样可以减少“魔法字符串”带来的错误。

### 4. `TypeAlias`

复杂类型多次出现时，建议取别名，减少阅读负担。

```python
type UserMap = dict[str, list[tuple[str, int]]]
```

如果团队还没启用新语法，也可以用传统方式声明。

## 五、什么时候应该写类型标注

### 优先加标注的地方

- 公共函数
- 核心业务函数
- 模块导出接口
- 边界层：HTTP、消息、配置、文件读写
- 复杂数据结构

### 可以先放宽的地方

- 一次性脚本
- 正在快速试验的原型
- 内部很短且语义极明显的局部变量

### 一个更现实的建议

不要为了“全项目 100% 标注”而把代码写得更难看。  
先把最重要的边界标出来，收益通常最大。

## 六、常见类型设计误区

### 1. 动不动就用 `Any`

`Any` 不是不能用，但一旦滥用，类型系统基本等于没启用。

更稳的策略：

- 先在边界层收窄类型
- 对内部核心逻辑尽量精确
- 实在不清楚时短期用 `Any`，但不要长期放任

### 2. 参数类型过于具体

如果函数只是遍历输入，就不要强行要求 `list`。  
更抽象一点，通常更利于复用和测试。

### 3. 返回值过于模糊

例如返回一个“什么都可能有的 `dict`”，使用方就会非常痛苦。

更好的做法：

- 明确结构
- 用 `TypedDict`
- 用 `dataclass`
- 或者用更清晰的领域对象

## 七、标准库和 typing 怎么配合

这两者真正结合起来，才会形成稳定的工程代码。

举几个很常见的组合：

- `pathlib.Path` + 返回值类型标注：文件接口更清晰
- `collections.defaultdict` + 明确 value 类型：聚合逻辑更可读
- `json` + `TypedDict`：数据解析边界更清楚
- `logging` + 统一上下文结构：排障更稳定

## 八、一个更实用的优先级建议

如果你时间有限，先按下面顺序补：

1. `pathlib`
2. `collections`
3. `json`
4. `logging`
5. `functools`
6. `datetime`
7. `itertools`
8. 基础类型标注
9. `TypedDict`、`Protocol`、`Literal`

## 九、面试或 code review 中最值得说清的点

- 为什么优先用 `pathlib` 而不是到处拼路径字符串
- 为什么参数类型优先用 `Iterable` 或 `Sequence` 表达能力边界
- 为什么返回“结构明确”的对象比返回 `dict[str, Any]` 更稳
- 为什么 `typing` 的价值主要在协作、编辑器和静态检查，而不是运行时强制约束

## 关联阅读

- [Python 必备知识：由浅入深](./essential-knowledge.md)
- [Python 数据模型与常见陷阱](/python/data-model-and-common-pitfalls)
- [Python 测试、项目结构与工程化](/python/testing-and-project-engineering)
