---
title: 死锁检测与回滚重试
description: InnoDB 死锁本质、排查手段（SHOW ENGINE INNODB STATUS）、根因治理与幂等回滚重试代码。
---

# 死锁检测与回滚重试

> 死锁本质是两个或多个事务互相等待对方持有的资源，形成循环依赖。InnoDB 有内置的死锁检测机制，一旦发现死锁，会自动选代价最小的事务回滚。

**答题顺序**：死锁本质 → 排查手段 → 根因分析 → 治理方案 → 重试代码

---

## 死锁循环等待示意图

```
事务 A                              事务 B
──────────────────────────────────────────────────────────────
① 锁定 order_id = 100              ① 锁定 order_id = 200
② 等待 order_id = 200  ──────►   阻塞（order_id=200 被 B 持有）
   阻塞（order_id=100 被 A 持有）◄── ② 等待 order_id = 100
                      ╔══════════╗
                      ║   死锁   ║  InnoDB 选代价小的事务回滚
                      ╚══════════╝
```

支付系统里常见死锁场景：

- 两个事务以不同顺序更新同一组订单行（A 先锁订单再锁流水，B 相反）
- 缺少索引导致 gap lock 覆盖范围扩大，互相阻塞
- 长事务 + 跨多张表锁资源，形成持有链

---

## 排查手段：SHOW ENGINE INNODB STATUS

```sql
SHOW ENGINE INNODB STATUS\G
```

输出中找 `LATEST DETECTED DEADLOCK` 段落，关键字段解读：

```
------------------------
LATEST DETECTED DEADLOCK
------------------------
*** (1) TRANSACTION:
TRANSACTION 421, ACTIVE 0 sec starting index read
MySQL thread id 12, query id 1001
UPDATE payment_order SET status=2 WHERE order_id=100  ← 事务 1 执行的 SQL

*** (1) HOLDS THE LOCK(S):     ← 事务 1 当前持有的锁
RECORD LOCKS index PRIMARY of table `payment_order`
Record lock, heap no 5 ...

*** (1) WAITING FOR THIS LOCK: ← 事务 1 等待的锁（被事务 2 持有）
RECORD LOCKS index PRIMARY of table `payment_order`
Record lock, heap no 8 ...

*** (2) TRANSACTION:           ← 事务 2 同样结构
...

*** WE ROLL BACK TRANSACTION (2)  ← InnoDB 选择回滚事务 2
```

排查时重点关注：`HOLDS THE LOCK(S)` 和 `WAITING FOR THIS LOCK` 是否形成环形依赖。

---

## 根因与治理

| 根因 | 治理方案 |
| --- | --- |
| 多事务更新顺序不一致 | 统一加锁顺序（如按 order_id 升序更新） |
| 缺索引导致 gap lock 范围扩大 | 补索引，缩小 gap lock 覆盖范围 |
| 长事务持锁时间过长 | 拆分大事务，缩短事务时长 |
| 并发竞争同一批行 | 引入乐观锁或队列化处理 |

---

## 回滚重试（仅限幂等操作）

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

> **重要**：死锁重试只能用于幂等操作。扣款等资金动作如果没做好幂等，重试本身可能带来资损。建议扣款操作先用唯一流水号做幂等校验，再做重试。

---

## 继续阅读

- [大事务拆分](./transaction-and-optimization.md#大事务拆分)
- [热点账户更新](./hot-account-update.md)
- [返回 MySQL 专题总览](./index.md)
