---
title: 数据库与缓存
description: Go 数据库与缓存专题，收纳 database/sql 与连接池这类 Go 集成能力，并关联 MySQL 与 Redis 实践。
search: false
---

# 数据库与缓存

## Go 与数据库集成

与 Go 强绑定的数据库访问能力保留在本专题，例如 `database/sql` 的连接池配置、`Rows` 生命周期、资源释放和监控方式。

| 主题 | 链接 |
| --- | --- |
| database/sql 与连接池 | [查看](./06-database-sql-and-connection.md) |
| database/sql：连接池与事务（源码精读） | [查看](./source-reading/database-sql.md) |

## MySQL 部分

MySQL 本体相关内容仍然在独立的 [MySQL 专题](/mysql/) 中维护，涵盖以下主题：

| 主题 | 链接 |
| --- | --- |
| 事务处理 | [查看](/mysql/transaction-and-optimization) |
| SQL 优化 | [查看](/mysql/sql-optimization) |
| ORM 使用经验（GORM） | [查看](/mysql/orm-gorm) |
| B+ 树索引与最左前缀 | [查看](/mysql/index-design) |
| 大事务拆分 | [查看](/mysql/transaction-and-optimization#大事务拆分) |
| 死锁检测与回滚重试 | [查看](/mysql/deadlock-and-retry) |
| 热点账户更新 | [查看](/mysql/hot-account-update) |
| 分库分表与迁移 | [查看](/mysql/sharding-and-migration) |

## 快速导航

| 专题 | 内容 |
| --- | --- |
| [Redis 实践与缓存穿透/击穿/雪崩](./06-redis-and-cache-patterns.md) | go-redis 客户端、Pipeline、Pub/Sub、穿透/击穿/雪崩解决方案 |
| [缓存一致性与分库分表](./06-cache-consistency-and-sharding.md) | Cache Aside Pattern、延迟双删、binlog 最终一致、分片路由、Snowflake ID |
| [database/sql 与连接池](./06-database-sql-and-connection.md) | 连接池配置、Rows 生命周期、事务与资源释放 |
