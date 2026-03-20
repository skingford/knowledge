---
title: 源码与 Runtime（已归档）
description: 原源码与 runtime 入口已并入 guide/source-reading，当前页面仅保留历史访问路径。
search: false
---

# 源码与 Runtime（已归档）

这个入口原来承担“runtime 导读 + 源码阅读方法 + 文章索引”的混合职责。为了避免 `docs/golang` 下继续维护两套并行入口，相关内容已经统一收口到 `guide/source-reading/`。

<GoSourceReadingDiagram kind="archive-redirect" />

## 当前应该去哪里

- 源码阅读主入口：[Go 源码阅读学习主线](/golang/guide/source-reading/learning-path)
- 包级索引总览：[Go 源码精读总览](/golang/guide/source-reading/)
- 调度主线：[GMP 调度器](/golang/guide/source-reading/runtime-scheduler)
- 内存与 GC：[内存分配器](/golang/guide/source-reading/runtime-memory)、[GC 垃圾回收](/golang/guide/source-reading/runtime-gc)
- 排障与观测：[runtime/pprof](/golang/guide/source-reading/runtime-pprof)、[runtime/trace](/golang/guide/source-reading/runtime-trace)

## 这页为什么保留

- 兼容旧链接、收藏和历史引用
- 明确告诉读者新的主入口在哪里
- 避免旧页面继续被当作主文档维护

## 重构后的分工

- `guide/source-reading/learning-path`：路线、方法、资料
- `guide/source-reading/index`：主题索引
- `guide/source-reading/*.md`：单个包或主题的深度文章

如果你是第一次来这里，直接跳到 [Go 源码阅读学习主线](/golang/guide/source-reading/learning-path) 即可。
