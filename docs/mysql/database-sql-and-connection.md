---
title: database/sql 与连接池（已迁移）
description: 该页面已迁移到 Go 专题，当前路径仅保留兼容访问入口。
search: false
---

# database/sql 与连接池（已迁移）

这篇已经迁移到 Go 专题，原因是 `database/sql` 属于 Go 标准库，连接池、`Rows` 生命周期、`Stmt` 复用和 `Stats()` 监控这些内容更适合放在 Go 主线里维护。

## 当前应该去哪里

- 新的正式入口：[database/sql 与连接池](/golang/guide/06-database-sql-and-connection)
- 源码精读版：[database/sql：连接池与事务（源码精读）](/golang/guide/source-reading/database-sql)
- MySQL 相关继续阅读：[事务处理与 SQL 优化](./transaction-and-optimization.md)
- MySQL 相关继续阅读：[ORM 使用经验（GORM）](./orm-gorm.md)

如果你是从旧链接进入这里，后续请优先使用 Go 专题下的新路径。
