---
title: Python 学习路径
description: 按阶段整理 Python 学习路径，从语法基础、函数模块、对象模型到工程化、并发，以及数据库、爬虫、数据处理和 AI 工程方向进阶。
---

# Python 学习路径

这页不替代主文档，而是把 Python 的学习顺序拆成更容易执行的阶段。  
如果你还没有系统学过 Python，建议先把 [Python 必备知识：由浅入深](/python/essential-knowledge) 通读一遍，再回来按阶段推进。

## 总体原则

- 先把语言基础和对象模型学扎实，再谈框架
- 先能写对，再追求写快、写优雅
- 每个阶段都要有可运行的小项目，不要只看概念
- Python 学习一定要同时补工程化，不然后面项目会越来越乱

## 阶段总览

| 阶段 | 目标 | 你至少应该完成什么 |
| --- | --- | --- |
| 阶段 1 | 语法与数据结构入门 | 能独立写脚本，理解 `list / dict / set / tuple`、切片、推导式、基础控制流 |
| 阶段 2 | 函数、模块与对象模型 | 理解参数传递、作用域、闭包、可变性、浅拷贝和深拷贝 |
| 阶段 3 | 类、异常、文件与标准库 | 能写结构清晰的模块，知道 `with`、异常链、`pathlib`、`logging` 的基本用法 |
| 阶段 4 | 工程化与测试 | 会用虚拟环境、依赖管理、`pytest`、类型标注、格式化和 lint |
| 阶段 5 | 并发、异步与性能 | 分清线程、进程、协程和 GIL，知道 `asyncio` 的使用边界 |
| 阶段 6 | 方向深化 | 根据目标进入 Web、数据库、自动化、爬虫、数据处理、AI 工程等具体方向 |

## 阶段 1：语法与数据结构

### 学习目标

- 看懂并写出基础 Python 代码
- 熟悉常见内置类型和常用操作
- 形成“变量绑定对象”的基本认知

### 必学内容

- 变量、缩进、注释、表达式
- 数字、字符串、布尔值、`None`
- `list`、`tuple`、`dict`、`set`
- `if / for / while / break / continue`
- 切片、解包、推导式
- 真值判断和短路逻辑

### 阶段练习

- 写一个命令行记账脚本
- 写一个统计文本词频的小工具
- 写一个学生成绩录入和排序程序

### 过关标准

- 能解释 `list` 和 `tuple` 的差异
- 能说清 `dict` 和 `set` 的典型使用场景
- 能独立写出包含循环、条件、函数的小脚本

## 阶段 2：函数、模块与对象模型

### 学习目标

- 明白 Python 不只是“脚本语法”，而是有一套清晰的数据模型
- 避免最常见的参数、闭包和可变对象陷阱

### 必学内容

- 函数定义、返回值、文档字符串
- 位置参数、关键字参数、默认参数、`*args`、`**kwargs`
- LEGB 作用域规则
- 闭包、匿名函数、装饰器的基本概念
- `id / type / value`
- `==` 和 `is`
- 可变对象与不可变对象
- 浅拷贝与深拷贝
- 模块、包、导入路径、`__name__ == "__main__"`

### 阶段练习

- 把阶段 1 的脚本拆成模块
- 写一个带装饰器的执行时间统计器
- 写一个支持配置文件读取的小工具

### 过关标准

- 能解释“为什么默认参数不能随便用空列表”
- 能解释闭包里的延迟绑定问题
- 能组织一个至少 3 个模块的小项目

推荐补充：

- [Python 数据模型与常见陷阱](/python/data-model-and-common-pitfalls)
- [Python 函数、模块与装饰器](/python/functions-modules-and-decorators)

## 阶段 3：类、异常、文件与标准库

### 学习目标

- 会写更像工程代码的 Python，而不是把所有逻辑塞进一个文件
- 理解资源管理和错误处理

### 必学内容

- 类、实例、类属性、实例属性
- `@classmethod`、`@staticmethod`、`@property`
- 继承、组合、`dataclass`
- `try / except / else / finally`
- 自定义异常
- `with` 和上下文管理器
- 文件读写、编码、`pathlib`
- `json`、`csv`、`logging`
- `collections`、`itertools`、`functools`

### 阶段练习

- 写一个日志分析器
- 写一个配置加载器，支持 JSON 或 YAML
- 写一个简单的待办事项命令行程序

### 过关标准

- 知道什么时候该用类，什么时候该直接用函数和数据结构
- 知道如何保证文件、网络连接、锁在异常时也能正确释放
- 能使用标准库解决大部分基础脚本需求

推荐补充：

- [Python 标准库与 typing 必修清单](/python/standard-library-and-typing)
- [Python 面向对象、类设计与 dataclass](/python/object-oriented-programming-and-dataclass)
- [Python 异常、文件处理与上下文管理](/python/exceptions-files-and-context-managers)

## 阶段 4：工程化与测试

### 学习目标

- 建立“项目可以交给别人继续维护”的意识
- 用工具提升一致性和可维护性

### 必学内容

- `venv` 或其他虚拟环境方案
- `pip` 和 `pyproject.toml`
- 依赖锁定和环境隔离
- `pytest`
- 类型标注与静态检查
- 代码格式化、lint、导入排序
- 日志、配置、环境变量

### 阶段练习

- 把前面的脚本整理成一个可安装项目
- 给核心逻辑补单元测试
- 配一套最基本的格式化和 lint 检查

### 过关标准

- 新机器能快速搭起开发环境
- 代码提交前可以自动检查格式和基础问题
- 核心函数有测试保护，不靠手工回归

推荐补充：

- [Python 测试、项目结构与工程化](/python/testing-and-project-engineering)
- [Python Pydantic、配置管理与数据校验](/python/pydantic-and-settings-management)
- [Python pytest 进阶与测试替身](/python/pytest-advanced-and-test-doubles)

## 阶段 5：并发、异步与性能

### 学习目标

- 不再把“并发”混成一个词
- 能根据 IO 密集或 CPU 密集场景选对方案

### 必学内容

- GIL 的基本影响
- `threading` 的适用范围
- `multiprocessing` 的适用范围
- `asyncio`、`async / await`
- 任务调度、阻塞调用、协程取消
- `timeit`、`cProfile`、基础性能分析

### 阶段练习

- 写一个并发请求多个接口的异步脚本
- 写一个多进程版的批量文本处理工具
- 对一个低效脚本做 profile 并优化

### 过关标准

- 能说明线程、进程、协程分别解决什么问题
- 能解释为什么 `async def` 里不能随便放阻塞 IO
- 会用最基本的性能分析工具定位热点

推荐补充：

- [Python 并发、GIL 与 asyncio](/python/concurrency-and-asyncio)
- [Python 性能、内存与调试排障](/python/performance-debugging-and-memory)

## 阶段 6：方向深化

### 如果你想走 Web / 后端

- 继续学 HTTP、数据库、ORM、事务、Web 框架、中间件、认证和部署
- 建议练习一个带登录、权限、事务和接口测试的 CRUD 服务，再补缓存、任务队列和后台任务

推荐补充：

- [Python FastAPI 与 Web 后端实践](/python/fastapi-and-web-backend-practice)
- [Python 数据库、事务与 ORM 实践](/python/database-and-orm-practice)
- [Python Pydantic、配置管理与数据校验](/python/pydantic-and-settings-management)
- [Python pytest 进阶与测试替身](/python/pytest-advanced-and-test-doubles)

### 如果你想走自动化 / 平台工具

- 继续学命令行参数、子进程、文件系统、模板渲染、日志和告警
- 建议写一个可以被团队复用的内部工具

推荐补充：

- [Python CLI 自动化与 subprocess 实践](/python/automation-cli-and-subprocess-practice)
- [Python Pydantic、配置管理与数据校验](/python/pydantic-and-settings-management)
- [Python pytest 进阶与测试替身](/python/pytest-advanced-and-test-doubles)

### 如果你想走爬虫 / 数据采集

- 继续学 HTTP 客户端、HTML 解析、限流重试、增量抓取、去重、入库和任务调度
- 建议写一个可断点续跑的数据采集任务，再补状态记录、失败回放和并发治理

推荐补充：

- [Python 爬虫、HTTP 抓取与异步采集实践](/python/web-scraping-and-async-fetching-practice)
- [Python CLI 自动化与 subprocess 实践](/python/automation-cli-and-subprocess-practice)
- [Python 并发、GIL 与 asyncio](/python/concurrency-and-asyncio)

### 如果你想走数据处理 / 分析

- 继续学 `numpy`、`pandas`、可视化、数据清洗和 Notebook 到工程化的迁移
- 建议把一次分析流程封装成可重跑脚本，而不只停留在 Notebook

推荐补充：

- [Python NumPy、pandas 与数据处理实践](/python/numpy-pandas-and-data-processing-practice)
- [Python 性能、内存与调试排障](/python/performance-debugging-and-memory)

### 如果你想走 AI 工程 / RAG

- 继续学模型调用封装、结构化输入输出、RAG、Tool 调用、评测、观测和服务化
- 建议先做一个带检索、来源展示和基础评测的问答系统，再补 workflow、权限和成本治理

推荐补充：

- [Python AI 工程、RAG 与服务化实践](/python/ai-engineering-and-rag-practice)
- [Python Pydantic、配置管理与数据校验](/python/pydantic-and-settings-management)
- [Python 并发、GIL 与 asyncio](/python/concurrency-and-asyncio)

## 一个更实用的执行建议

不要把 Python 学成“只会背语法”的语言。  
比较稳的节奏是：

1. 每学一个主题，就写一个小程序验证
2. 每完成一个阶段，就把旧代码重构一次
3. 每周至少做一次“解释自己代码为什么这样写”的复盘

## 推荐的最小阶段产出

- 第一阶段结束：3 个基础脚本
- 第二阶段结束：1 个多模块小项目
- 第三阶段结束：1 个带日志和异常处理的工具程序
- 第四阶段结束：1 个带测试和依赖管理的项目模板
- 第五阶段结束：1 个异步工具或并发处理脚本

如果你只能先记住一个入口，就先读 [Python 必备知识：由浅入深](./essential-knowledge.md)。
