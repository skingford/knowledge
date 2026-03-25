---
layout: page
title: false
description: Python 学习入口，覆盖必备知识、函数模块、面向对象、异常处理、标准库、并发、性能、工程化，以及数据库、配置、爬虫、数据处理与 AI 工程主线。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'python')!
</script>

<SectionLanding
  :eyebrow="landing.eyebrow"
  :title="landing.title"
  :intro="landing.intro"
  :primary="landing.primary"
  :secondary="landing.secondary"
  :scope="landing.scope"
  :docs="landing.docs"
  :order="landing.order"
/>

## 适合谁看

- 已经会写一点 Python 脚本，但知识点还是碎的，很多地方靠经验和搜索在补
- 要做自动化、后端、爬虫、数据处理或 AI 应用开发，想把 Python 基本盘补扎实
- 面试里能写代码，但说不清可变对象、闭包、装饰器、GIL、包管理和工程化边界
- 需要一条从“会用”走到“能稳定维护项目”的学习顺序

## 建议阅读顺序

1. 先看 [Python 必备知识：由浅入深](/python/essential-knowledge)，建立整体框架
2. 再看 [Python 数据模型与常见陷阱](/python/data-model-and-common-pitfalls)，把“能写”提升到“知道为什么”
3. 接着看 [Python 标准库与 typing 必修清单](/python/standard-library-and-typing)，补工具箱和接口边界
4. 然后补 [Python 函数、模块与装饰器](/python/functions-modules-and-decorators)、[Python 面向对象、类设计与 dataclass](/python/object-oriented-programming-and-dataclass)、[Python 异常、文件处理与上下文管理](/python/exceptions-files-and-context-managers)
5. 再看 [Python 并发、GIL 与 asyncio](/python/concurrency-and-asyncio)、[Python 性能、内存与调试排障](/python/performance-debugging-and-memory)、[Python 测试、项目结构与工程化](/python/testing-and-project-engineering)
6. 最后看 [Python 学习路径](/python/learning-path)，再按方向选择 [FastAPI 与 Web 后端实践](/python/fastapi-and-web-backend-practice)、[数据库、事务与 ORM 实践](/python/database-and-orm-practice)、[Pydantic、配置管理与数据校验](/python/pydantic-and-settings-management)、[pytest 进阶与测试替身](/python/pytest-advanced-and-test-doubles)、[CLI 自动化与 subprocess 实践](/python/automation-cli-and-subprocess-practice)、[爬虫、HTTP 抓取与异步采集实践](/python/web-scraping-and-async-fetching-practice)、[NumPy、pandas 与数据处理实践](/python/numpy-pandas-and-data-processing-practice)、[AI 工程、RAG 与服务化实践](/python/ai-engineering-and-rag-practice)

## 这个专题的重点

- 不追求把 Python 所有语法角落一次讲完，而是优先覆盖工程里最常反复出现的核心知识
- 不只讲“怎么写”，也讲“为什么这么写”“什么时候会踩坑”
- 先打语言与工程基础，再进入并发、性能、项目组织和方向分化

## 当前内容结构

| 文档 | 重点 |
| --- | --- |
| [Python 必备知识：由浅入深](/python/essential-knowledge) | 总览全局地图，先建立统一认知框架 |
| [Python 数据模型与常见陷阱](/python/data-model-and-common-pitfalls) | 重点补名字绑定、可变性、拷贝、闭包、哈希和高频坑 |
| [Python 标准库与 typing 必修清单](/python/standard-library-and-typing) | 重点补标准库工具箱、接口边界和类型标注 |
| [Python 函数、模块与装饰器](/python/functions-modules-and-decorators) | 重点补参数设计、模块拆分、导入边界和装饰器本质 |
| [Python 面向对象、类设计与 dataclass](/python/object-oriented-programming-and-dataclass) | 重点补类、组合与继承、属性管理和数据类建模 |
| [Python 异常、文件处理与上下文管理](/python/exceptions-files-and-context-managers) | 重点补错误表达、资源释放、`with` 和上下文管理器 |
| [Python 并发、GIL 与 asyncio](/python/concurrency-and-asyncio) | 重点补线程、进程、协程和事件循环边界 |
| [Python 性能、内存与调试排障](/python/performance-debugging-and-memory) | 重点补 profile、内存、热点定位和优化顺序 |
| [Python 测试、项目结构与工程化](/python/testing-and-project-engineering) | 重点补项目结构、依赖管理、测试、日志和 CI |
| [Python 学习路径](/python/learning-path) | 重点把知识点拆成阶段任务和练习顺序 |
| [Python FastAPI 与 Web 后端实践](/python/fastapi-and-web-backend-practice) | 重点补路由分层、依赖注入、事务、鉴权和接口边界 |
| [Python 数据库、事务与 ORM 实践](/python/database-and-orm-practice) | 重点补事务边界、session 生命周期、迁移、索引和 ORM 常见坑 |
| [Python Pydantic、配置管理与数据校验](/python/pydantic-and-settings-management) | 重点补请求/响应模型、配置收口、结构化校验和序列化边界 |
| [Python pytest 进阶与测试替身](/python/pytest-advanced-and-test-doubles) | 重点补 fixture、monkeypatch、mock、fake 和异步测试 |
| [Python CLI 自动化与 subprocess 实践](/python/automation-cli-and-subprocess-practice) | 重点补参数设计、子进程、日志、退出码和可重跑性 |
| [Python 爬虫、HTTP 抓取与异步采集实践](/python/web-scraping-and-async-fetching-practice) | 重点补采集流水线、超时重试、限流、解析、去重和断点续跑 |
| [Python NumPy、pandas 与数据处理实践](/python/numpy-pandas-and-data-processing-practice) | 重点补数组/表格心智模型、清洗聚合和数据任务工程化 |
| [Python AI 工程、RAG 与服务化实践](/python/ai-engineering-and-rag-practice) | 重点补模型调用收口、RAG、Tool 边界、评测、观测和服务化 |
