---
title: 大事务拆分
description: 大事务的来源、危害与拆分原则，附支付系统中的正反例代码对比和批量分段提交示例。
---

# 大事务拆分

> 大事务的问题不只是慢：长时间持锁会堵塞后续请求、Undo/Redo 日志膨胀、主从复制延迟放大、回滚成本极高。支付系统高峰期最怕大事务叠加热点行，两者叠加会直接把后续请求全部堵死。

**答题顺序**：识别来源 → 说明危害 → 给出拆分原则 → 正反例对比

---

## 大事务的四类来源

| 来源 | 典型场景 | 问题 |
| --- | --- | --- |
| 批量更新未分段 | 一次性更新 10 万条订单状态 | 事务持续时间过长 |
| 循环逐笔处理 | `for` 循环内逐条 `INSERT` 未分批提交 | N 条 SQL 在同一个事务里 |
| 事务内 RPC/HTTP 调用 | 事务未提交时调用三方支付渠道 | 网络耗时直接拉长事务 |
| 事务内复杂计算 | 事务内算对账差值、生成报表 | CPU 时间占用事务时长 |

---

## 拆分原则

核心只有一条：**事务里只保留必要的本地原子操作，其他全部移出事务**。

- 网络调用（RPC、HTTP）放到事务外，拿到结果再开事务写库
- 批量操作按 500~1000 条分段提交，每段一个独立事务
- 非核心逻辑（日志、通知、统计更新）通过消息队列异步化

---

## 正反例对比

```go
// ❌ 反例：事务内做了渠道 RPC，持锁时间 = 本地操作 + 网络耗时
func payBad(ctx context.Context, orderID string) error {
    tx.Begin()
    tx.Exec("UPDATE payment_order SET status = 'PAYING' WHERE order_id = ?", orderID)
    callChannelAPI(ctx)   // 可能耗时 200ms+，此时行锁一直被持有
    tx.Exec("INSERT INTO payment_flow(order_id, status) VALUES(?, ?)", orderID, "PAYING")
    return tx.Commit()
}

// ✅ 正例：先做网络调用，拿到结果后再开事务写库
func payGood(ctx context.Context, orderID string) error {
    // 1. 事务外先调渠道，只拿到结果
    result, err := callChannelAPI(ctx)
    if err != nil {
        return err
    }
    // 2. 拿到结果后，在极短事务内写库
    tx.Begin()
    tx.Exec("UPDATE payment_order SET status = ? WHERE order_id = ?", result.Status, orderID)
    tx.Exec("INSERT INTO payment_flow(order_id, status) VALUES(?, ?)", orderID, result.Status)
    return tx.Commit()
}
```

## 批量分段提交示例（Go）

```go
// 每 500 条提交一次，避免大事务
func batchUpdateStatus(ctx context.Context, db *sql.DB, orderIDs []string) error {
    const batchSize = 500
    for i := 0; i < len(orderIDs); i += batchSize {
        end := i + batchSize
        if end > len(orderIDs) {
            end = len(orderIDs)
        }
        batch := orderIDs[i:end]
        tx, _ := db.BeginTx(ctx, nil)
        for _, id := range batch {
            tx.ExecContext(ctx, "UPDATE payment_order SET status='CLOSED' WHERE order_id=?", id)
        }
        if err := tx.Commit(); err != nil {
            tx.Rollback()
            return err
        }
    }
    return nil
}
```

> 拆分事务的本质是缩短持锁时间窗，让锁释放更快、并发通过率更高。支付系统里高峰期最怕大事务加热点行叠加，一旦叠加就是后续请求的全面堵塞。

---

## 继续阅读

- [B+ 树索引与最左前缀](./index-design.md)
- [死锁检测与回滚重试](./deadlock-and-retry.md)
- [返回 MySQL 专题总览](./index.md)
