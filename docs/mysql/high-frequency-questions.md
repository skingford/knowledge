---
title: 高频追问
description: MySQL 高频追问合集：SELECT *、深分页优化、缩短锁持有时间、热点账户行锁竞争。
---

# 高频追问

> 这组追问更偏落地细节，适合在讲完主方案后补一句，体现你不只懂原理，也考虑到了真实 SQL 和事务成本。

| 追问 | 本质 | 常见答案方向 |
| --- | --- | --- |
| 为什么不能 `SELECT *` | 回表和缓存污染 | 覆盖索引 |
| 深分页如何优化 | OFFSET 扫描成本高 | 游标分页、延迟关联 |
| 如何缩短锁持有时间 | 事务中混入耗时操作 | 把锁操作放到事务后段 |
| 如何避免热点账户行锁竞争 | 同一行并发写入 | 乐观锁、排队合并、子账户拆分 |

## 为什么支付流水表不能 `SELECT *`

> 流水表字段多、行数大，`SELECT *` 导致回表次数增多、Buffer Pool 污染（大量不需要的冷数据被加载进内存）。正确做法是只查需要的列，建立覆盖索引，在索引层完成查询。

```sql
-- ❌ 反例：全列扫描，触发回表，污染 Buffer Pool
SELECT * FROM payment_flow WHERE merchant_id = ? AND created_at > ?;

-- ✅ 正例：覆盖索引，无需回表
SELECT order_id, amount, status FROM payment_flow
WHERE merchant_id = ? AND created_at > ?;
```

## 深分页如何优化

> `OFFSET 100000, 20` 实际要扫描前 100020 行再丢弃，性能极差。核心思路是用游标分页替代 OFFSET。

```sql
-- ❌ 反例：深分页，扫描大量无用行
SELECT * FROM payment_flow ORDER BY id LIMIT 100000, 20;

-- ✅ 正例：游标分页，从上次最大 id 开始
SELECT * FROM payment_flow WHERE id > #{lastMaxId} ORDER BY id LIMIT 20;
```

必须跳页时用延迟关联：

```sql
-- ✅ 延迟关联：先在索引上定位 ID，再回表取数据
SELECT f.* FROM payment_flow f
INNER JOIN (SELECT id FROM payment_flow ORDER BY id LIMIT 100000, 20) t
ON f.id = t.id;
```

## 如何缩短锁持有时间

> 事务越长，行锁持有越久，并发冲突越严重。核心原则：把锁操作（UPDATE/SELECT FOR UPDATE）放在事务最后，事务越短越好。

```go
// ❌ 反例：SELECT FOR UPDATE 之后做了耗时操作，锁一直被持有
tx.Begin()
tx.Exec("SELECT ... FOR UPDATE")
callChannel(ctx)      // 耗时 200ms，锁被持有 200ms+
tx.Exec("UPDATE ...")
tx.Commit()

// ✅ 正例：把耗时操作移到事务外，事务只做最后的写操作
result := callChannel(ctx)   // 事务外先做
tx.Begin()
tx.Exec("UPDATE ... WHERE ... AND status = 'INIT'")   // 短事务写入
tx.Commit()
```

## 如何避免热点账户导致行锁竞争

> 热点账户并发更新同一行，行锁排队导致吞吐骤降。从轻到重依次是乐观锁、排队合并、子账户拆分。

| 方案 | 适用场景 | 核心思路 |
| --- | --- | --- |
| 乐观锁 | 中低并发 | `WHERE version = ?` 冲突重试 |
| 内存排队合并 | 高并发 | 攒批 10ms，多笔合并为一次 UPDATE |
| 子账户拆分 | 极高并发 | 拆 N 个影子账户分散写入，查询时 SUM |

```sql
-- 乐观锁
UPDATE account SET balance = balance - 100, version = version + 1
WHERE id = ? AND version = ? AND balance >= 100;

-- 子账户写入
UPDATE account_sub SET balance = balance - 100
WHERE parent_id = ? AND sub_index = #{random(0, N)} AND balance >= 100;

-- 查询总余额
SELECT SUM(balance) FROM account_sub WHERE parent_id = ?;
```

---

## 继续阅读

- [B+ 树索引与最左前缀](./index-design.md)
- [分库分表与迁移](./sharding-and-migration.md)
- [返回 MySQL 专题总览](./index.md)
