---
title: 高并发支付系统专题整理：MySQL 篇
description: 聚焦支付系统里的 MySQL 高频考点，覆盖索引、事务、死锁、热点更新、分库分表与高频追问。
---

# 高并发支付系统专题整理：MySQL 篇

适合把支付场景里的 MySQL 高频考点单独拉出来复习。答题时建议始终按原理 -> 支付场景问题 -> 落地方案的顺序组织。

- [返回高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [Redis 篇](./high-concurrency-payment-redis.md)
- [Kafka 篇](./high-concurrency-payment-kafka.md)

## 适合谁看

- 对索引、事务、锁机制理解还不够扎实
- 面试里经常答不清大事务、死锁、热点更新
- 想把支付场景下的数据库问题和真实治理方案串起来

## 你会得到什么

- 一套围绕支付链路的 MySQL 高频题答题框架
- 从索引设计到事务治理的系统复习路径
- 面向高并发场景的热点更新与分库分表思路

## 建议复习顺序

1. 先看索引与事务，补基本盘
2. 再看死锁、热点更新，补高并发问题处理
3. 最后看分库分表与迁移，补架构演进视角

## 对应资料导航

- [database/sql：连接池与事务](/golang/guide/source-reading/database-sql)
- [database/sql：高级事务与批量插入](/golang/guide/source-reading/database-sql-advanced)

热点账户是支付场景里的典型难题，例如大商户、直播间、平台主账户。

## 常见挑战

- 大量并发更新同一行
- 行锁竞争严重
- 长事务导致锁持有时间过长
- 死锁和回滚重试频繁

## 常见答法

可以按以下逻辑组织：

- 把余额更新放在事务后段，缩短锁持有时间
- 中低并发场景下用乐观锁
- 极高并发场景下引入热点拆分
- 通过分库分表和冷热分离降低单表压力

## MySQL 高频考点

<details>
<summary><strong>B+ 树索引和最左前缀匹配</strong></summary>

> MySQL InnoDB 的主键索引和二级索引底层都是 B+ 树。B+ 树适合磁盘场景，因为高度低、范围查询稳定，叶子节点有序，天然支持区间扫描。支付系统里大量查询都是按商户、订单号、时间范围过滤，这正是 B+ 树擅长的场景。

标准答法可以拆成三层：

1. B+ 树非叶子节点只存键和指针，所以单页能放更多索引项，树更矮，IO 次数更少
2. 叶子节点按 key 有序，范围查询和排序效率高
3. 联合索引必须遵守最左前缀匹配，例如 `(merchant_id, created_at, status)` 可以命中 `merchant_id`、`merchant_id + created_at`，但不能跳过 `merchant_id` 直接用 `created_at`

```sql
CREATE INDEX idx_mch_time_status
ON payment_order (merchant_id, created_at, status);

SELECT order_id, status
FROM payment_order
WHERE merchant_id = ? AND created_at >= ?;

SELECT order_id, status
FROM payment_order
WHERE created_at >= ? AND status = ?;
```

</details>

<details>
<summary><strong>大事务拆分</strong></summary>

> 大事务的问题不只是慢，而是它会长时间占用锁、膨胀 Undo/Redo、拖慢主从复制，还会放大回滚成本。支付系统高峰期最怕大事务加热点行，因为这会直接把后续请求都堵住。

- 先识别大事务来源：批量更新、循环逐笔处理、事务内 RPC、事务内远程调用
- 再说明拆分原则：事务里只保留必要的本地原子操作，网络调用和计算逻辑放到事务外
- 最后给方案：批处理分段提交、流水和余额拆阶段、异步化非核心逻辑

```go
tx.Begin()
tx.Exec("UPDATE payment_order SET status = 'PAYING' WHERE order_id = ?", orderID)
callChannel(ctx)
tx.Exec("INSERT INTO payment_flow(order_id, status) VALUES(?, ?)", orderID, "PAYING")
tx.Commit()
```

</details>

<details>
<summary><strong>死锁检测与回滚重试</strong></summary>

> 死锁本质是两个或多个事务互相等待资源。支付系统里常见于更新顺序不一致、范围更新、同一事务跨多张表锁资源。

```go
func withDeadlockRetry(fn func() error) error {
    for i := 0; i < 3; i++ {
        err := fn()
        if err == nil {
            return nil
        }
        if !isDeadlockError(err) {
            return err
        }
        time.Sleep(time.Duration(i+1) * 50 * time.Millisecond)
    }
    return ErrDeadlockRetryExhausted
}
```

</details>

<details>
<summary><strong>热点更新问题</strong></summary>

> 热点更新本质是大量请求并发修改同一行，导致行锁排队、TPS 降低、超时放大。

```sql
UPDATE account
SET balance = balance - 100, version = version + 1
WHERE id = ? AND version = ? AND balance >= 100;
```

</details>

<details>
<summary><strong>分库分表与迁移</strong></summary>

> 分库分表不是为了显得架构高级，而是单表数据量、单机写入、索引维护成本都到瓶颈后才做。

```text
老库写入 -> 增量同步到新库 -> 历史数据回填 -> 对账校验 -> 灰度切读 -> 灰度切写 -> 下线老链路
```

</details>

## 高频追问

<details>
<summary><strong>为什么支付流水表不能 `SELECT *`？</strong></summary>

> 流水表字段多、行数大，`SELECT *` 导致回表次数增多、Buffer Pool 污染。正确做法是只查需要的列，建立覆盖索引，在索引层完成查询。

```sql
-- 反例：全列扫描，触发回表
SELECT * FROM payment_flow WHERE merchant_id = ? AND created_at > ?;

-- 正例：覆盖索引，无需回表
SELECT order_id, amount, status FROM payment_flow
WHERE merchant_id = ? AND created_at > ?;
```

</details>

<details>
<summary><strong>深分页如何优化？</strong></summary>

> `OFFSET 100000, 20` 实际要扫描前 100020 行再丢弃，性能极差。核心思路是游标分页替代 OFFSET。

```sql
SELECT * FROM payment_flow ORDER BY id LIMIT 100000, 20;
SELECT * FROM payment_flow WHERE id > #{lastMaxId} ORDER BY id LIMIT 20;
```

</details>

<details>
<summary><strong>如何缩短锁持有时间？</strong></summary>

> 事务越长，行锁持有越久，并发冲突越严重。核心原则是把锁操作放在事务最后，事务越短越好。

```go
tx.Begin()
tx.Exec("SELECT ... FOR UPDATE")
callChannel(ctx)
tx.Exec("UPDATE ...")
tx.Commit()
```

</details>

<details>
<summary><strong>如何避免热点账户导致行锁竞争？</strong></summary>

> 热点账户并发更新同一行，行锁排队导致吞吐骤降。从轻到重依次是乐观锁、排队合并、子账户拆分。

| 方案 | 适用场景 | 核心思路 |
| --- | --- | --- |
| 乐观锁 | 中低并发 | `WHERE version = ?` 冲突重试 |
| 内存排队合并 | 高并发 | 攒批 10ms，多笔合并为一次 UPDATE |
| 子账户拆分 | 极高并发 | 拆 N 个影子账户分散写入，查询时 SUM |

</details>

---

## 继续阅读

- [返回高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [下一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [案例总览](./index.md)
