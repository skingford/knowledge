---
title: 语言基础深化
description: Go 语言基础深化专题，覆盖值传递、切片、Map、接口、反射、泛型与错误处理设计。
search: false
---

# 语言基础深化

## 适合人群

- 已有 Go 基础，想系统补齐语言核心机制的工程师
- 需要深入理解 Go 底层行为（值传递、接口、反射等）的开发者
- 准备能力自检或想建立完整 Go 知识体系的人

## 学习目标

- 掌握 Go 语言核心语法与惯用写法
- 理解值类型与引用语义的本质区别
- 熟练运用 defer/panic/recover、闭包、接口、反射、泛型
- 建立规范的错误处理思维

## 图例速览

语言基础里最容易混乱的，不是语法本身，而是“哪些赋值真的独立、哪些赋值还在共享底层数据”。下面这张图可以先建立总感觉，再按顺序进入每一篇细节页。

<GoLanguageDiagram kind="value-semantics" />

## 快速导航

| 专题 | 内容 |
| --- | --- |
| [变量、类型与值语义](./01-variables-types-and-semantics.md) | 变量声明、常量 iota、值类型 vs 引用语义、数组/Slice/Map、String 与 []byte |
| [defer、panic/recover 与函数闭包](./01-defer-panic-and-closures.md) | defer 执行顺序与参数求值、panic/recover 恢复、闭包捕获与循环变量陷阱 |
| [Interface、反射与泛型](./01-interface-reflect-generics.md) | Interface 底层（eface/iface）、nil 陷阱、reflect 反射、泛型类型参数与约束 |
| [错误处理设计](./01-error-handling-design.md) | sentinel error、自定义错误类型、errors.Is/As、%w 包装与分层处理 |
| [Slice 的坑与三指切片](./01-slice-append-pitfalls.md) | append 污染原底层数组、三下标切片隔离、深拷贝最佳实践 |
| [String 与 []byte 最佳实践](./01-string-byte-best-practices.md) | 转换开销、数据流设计、Builder 与零拷贝 |
