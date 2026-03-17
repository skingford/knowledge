---
title: 事务处理
description: Go 中的事务处理模式、隔离级别选择、悲观锁与乐观锁、大事务拆分与长事务治理等生产实践。
---

# 事务处理

> 事务保证一组数据库操作的原子性、一致性、隔离性和持久性（ACID）。本文从 Go 代码视角出发，覆盖基础事务模式、读写一致性陷阱、悲观锁与乐观锁选型、长事务治理和大事务拆分，是 MySQL 专题中最核心的一篇。

本文假设你已经了解 `database/sql` 的基本用法和连接池概念。如果需要补充这方面的背景，请先阅读 [database/sql 与连接池](/golang/guide/06-database-sql-and-connection)。

SQL 优化相关内容已拆分到独立页面：[SQL 优化](./sql-optimization.md)。

## 基础事务模式

事务保证一组数据库操作的原子性。Go 中通过 `db.Begin()` 或 `db.BeginTx()` 开启事务，拿到 `*sql.Tx` 对象后在其上执行操作，最终 `Commit` 或 `Rollback`。

### 基础事务与 defer Rollback 模式

```go
// amount 用 int64 表示最小金额单位（如：分），避免 float64 的浮点精度问题
func transferMoney(db *sql.DB, fromID, toID, amount int64) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	// 关键模式：defer Rollback，Commit 之后 Rollback 是 no-op
	defer tx.Rollback()

	// 扣款
	result, err := tx.Exec(
		"UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
		amount, fromID, amount,
	)
	if err != nil {
		return fmt.Errorf("deduct from %d: %w", fromID, err)
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("insufficient balance for account %d", fromID)
	}

	// 收款
	if _, err := tx.Exec(
		"UPDATE accounts SET balance = balance + ? WHERE id = ?",
		amount, toID,
	); err != nil {
		return fmt.Errorf("credit to %d: %w", toID, err)
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}
```

### Context 感知事务与隔离级别

```go
func transferMoneyWithCtx(ctx context.Context, db *sql.DB, fromID, toID, amount int64) error {
	// BeginTx 支持传入 context 和事务选项
	tx, err := db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelRepeatableRead, // 设置隔离级别
		ReadOnly:  false,
	})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	// 使用 ExecContext 关联 context，超时或取消时自动中断
	result, err := tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
		amount, fromID, amount,
	)
	if err != nil {
		return fmt.Errorf("deduct: %w", err)
	}
	// 与第一个示例保持一致：检查 RowsAffected
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("insufficient balance for account %d", fromID)
	}

	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance + ? WHERE id = ?",
		amount, toID,
	)
	if err != nil {
		return fmt.Errorf("credit: %w", err)
	}

	return tx.Commit()
}
```

### 封装通用事务执行器

```go
// WithTx 封装事务的开启、提交、回滚逻辑，业务方只需关注操作本身
func WithTx(ctx context.Context, db *sql.DB, fn func(tx *sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}

// 使用示例
func createOrderWithItems(ctx context.Context, db *sql.DB, order Order, items []OrderItem) error {
	return WithTx(ctx, db, func(tx *sql.Tx) error {
		result, err := tx.ExecContext(ctx,
			"INSERT INTO orders (user_id, total) VALUES (?, ?)",
			order.UserID, order.Total,
		)
		if err != nil {
			return err
		}
		orderID, _ := result.LastInsertId()

		for _, item := range items {
			_, err := tx.ExecContext(ctx,
				"INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)",
				orderID, item.ProductID, item.Qty, item.Price,
			)
			if err != nil {
				return err
			}
		}
		return nil
	})
}
```

在生产环境中，`fn(tx)` 内部可能 panic。虽然 `defer tx.Rollback()` 能兜底，但 panic 会直接传播到调用方。如果你希望将 panic 转换为 error 或做日志记录，可以使用增强版：

```go
// WithTxSafe 在 WithTx 基础上增加 panic recovery
func WithTxSafe(ctx context.Context, db *sql.DB, fn func(tx *sql.Tx) error) (err error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p) // 重新抛出，保留堆栈；如需转 error 可改为 err = fmt.Errorf(...)
		} else if err != nil {
			_ = tx.Rollback()
		}
	}()

	if err = fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}
```

### Commit 失败后数据到底有没有写入

一个容易忽略的问题：**Commit 返回错误不等于事务一定没提交。** 在网络抖动场景下，MySQL 侧可能已经成功执行了 `COMMIT`，但 Go 侧因为连接超时或 TCP 断开而收到了 error。

这对支付系统尤其关键：

- 你不能仅靠 `tx.Commit()` 的返回值来判断"钱扣没扣"
- 对于资金操作，应该通过**唯一流水号 + 幂等表**做幂等设计，让操作可安全重试
- 收到 Commit 错误后，正确做法通常是查询实际状态（如流水号是否已存在），而不是简单重试

```go
if err := tx.Commit(); err != nil {
	// 不要直接 return err 就完事
	// 查询实际状态来确认事务是否已提交
	exists, queryErr := checkFlowExists(ctx, db, flowID)
	if queryErr != nil {
		return fmt.Errorf("commit failed and status unknown: commit=%w, query=%v", err, queryErr)
	}
	if exists {
		return nil // 事务实际上已提交成功
	}
	return fmt.Errorf("commit tx: %w", err)
}
```

### Savepoint：部分回滚

MySQL 支持 `SAVEPOINT` 和 `ROLLBACK TO SAVEPOINT`。Go 的 `database/sql` 没有原生 API，但可以通过 `tx.Exec` 实现。适用于复杂业务中部分子操作失败但不想整体回滚的场景：

```go
func createOrderWithOptionalGift(ctx context.Context, tx *sql.Tx, order Order) error {
	// 主订单创建（必须成功）
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO orders (user_id, total) VALUES (?, ?)",
		order.UserID, order.Total,
	); err != nil {
		return err
	}

	// 赠品发放（允许失败）
	if _, err := tx.ExecContext(ctx, "SAVEPOINT gift"); err != nil {
		return err
	}
	if err := issueGift(ctx, tx, order.UserID); err != nil {
		// 赠品失败，回滚到保存点，主订单不受影响
		if _, rbErr := tx.ExecContext(ctx, "ROLLBACK TO SAVEPOINT gift"); rbErr != nil {
			return rbErr
		}
		log.Printf("gift issue failed, skipped: %v", err)
	}

	return nil // 由外层 WithTx 负责 Commit
}
```

**讲解重点：**

1. **defer Rollback 模式**：无论函数中途 return 还是 panic，`defer tx.Rollback()` 都能保证事务被回滚。如果已经 `Commit` 成功，后续的 `Rollback` 调用是无操作（no-op），不会报错。
2. **Context 关联事务**：使用 `BeginTx` + `ExecContext/QueryContext` 可以让事务感知超时和取消。当 context 被取消时，正在执行的 SQL 会被中断，避免长事务占用连接。
3. **隔离级别的选择**：MySQL 默认是 `REPEATABLE READ`。对于读多写少的报表查询，可以用 `ReadOnly: true` 优化。对于需要避免幻读的场景才考虑更高隔离级别。详见下方 [隔离级别选择指南](#隔离级别选择指南)。

---

## 事务边界与读写一致性

**如果查询结果会影响后续写入决策，那么这次查询也必须放进同一个事务边界里。** `COMMIT` 只能提交 `BEGIN/START TRANSACTION` 之后执行的语句，不能把之前那次 `SELECT` "补进事务"。

典型反例：

```go
func deductBalanceWrong(ctx context.Context, db *sql.DB, userID, amount int64) error {
	var balance int64
	if err := db.QueryRowContext(ctx,
		"SELECT balance FROM accounts WHERE id = ?",
		userID,
	).Scan(&balance); err != nil {
		return err
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if balance < amount {
		return errors.New("insufficient balance")
	}

	if _, err := tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - ? WHERE id = ?",
		amount, userID,
	); err != nil {
		return err
	}

	return tx.Commit()
}
```

这段代码的问题不在 `Commit`，而在于 `SELECT` 和 `BEGIN` 之间存在并发窗口：

1. 你查到的 `balance` 是事务外快照，不受后续事务保护。
2. 在这段空档里，其他事务可能已经修改了余额、库存或状态。
3. 你的事务即使最终成功提交，也只能保证"这次 UPDATE 写进去了"，不能保证"写入依据仍然成立"。

在业务上，这类问题通常表现为：

- 余额扣减基于旧余额，出现超扣
- 库存校验基于旧库存，出现超卖
- 状态流转基于旧状态，出现重复处理或脏覆盖

更稳的做法是把"读-判定-写"放进一个事务里；如果后续写入依赖当前值，还应使用**当前读**而不是普通快照读：

```go
func deductBalanceSafely(ctx context.Context, db *sql.DB, userID, amount int64) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var balance int64
	if err := tx.QueryRowContext(ctx,
		"SELECT balance FROM accounts WHERE id = ? FOR UPDATE",
		userID,
	).Scan(&balance); err != nil {
		return err
	}

	if balance < amount {
		return errors.New("insufficient balance")
	}

	if _, err := tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - ? WHERE id = ?",
		amount, userID,
	); err != nil {
		return err
	}

	return tx.Commit()
}
```

这里有两个关键点：

1. `SELECT ... FOR UPDATE` 把读取和加锁放在事务内，避免别人同时改这行。
2. 事务提交前锁不会释放，因此读到的前提条件和后续更新属于同一个原子操作。

还要补一句：**不是所有查询都必须放进事务。** 如果查询只是为了展示页面、打印日志、做非关键预检查，那么放事务外通常没问题。真正必须放进去的是那些会决定后续写不写、怎么写、写多少的查询。

对于单行余额扣减、库存扣减这类场景，如果条件简单，往往可以进一步收敛成一条原子 SQL，比"先查再改"更稳：

```sql
UPDATE accounts
SET balance = balance - ?
WHERE id = ? AND balance >= ?;
```

这种写法的好处是把校验和更新合并为一次执行，直接通过 `RowsAffected()` 判断是否扣减成功，既减少一次网络往返，也缩小了锁持有时间。

---

## 悲观锁与乐观锁

当业务是典型的"先读状态，再决定是否更新"时，本质问题不是 `COMMIT`，而是**如何保证读到的前提在写入时仍然成立**。MySQL 里常见有两种解法：

| 方案 | 核心做法 | 优点 | 代价 | 适用场景 |
| --- | --- | --- | --- | --- |
| 悲观锁 | 事务内 `SELECT ... FOR UPDATE` 后再 `UPDATE` | 逻辑直观，强约束 | 持锁时间更长，冲突时会等待 | 冲突概率高、必须串行化的余额/库存操作 |
| 乐观锁 | 读取 `version`，`UPDATE ... WHERE version = ?` 做 CAS 校验 | 并发更高，不必长时间持锁 | 冲突时要重试，代码复杂一些 | 冲突概率中低、可接受重试的场景 |

### 为什么 `FOR UPDATE` 属于悲观锁

悲观锁的思路是：**先假设并发冲突很可能发生，因此在读取时就把后续要改的数据先锁住。** 在 InnoDB 中，`SELECT ... FOR UPDATE` 属于加锁读，会对命中的记录加排他锁；如果是范围查询，还可能连带加上 gap lock 或 next-key lock。关于 gap lock 的详细机制，参见 [20. 幻读是什么，幻读有什么问题？](./20-phantom-read.md) 和 [21. 为什么我只改一行的语句，锁这么多？](./21-single-row-update-many-locks.md)。

可以把它理解成一句更口语的话：**"总有刁民想改朕的数据，我查的时候必须先锁死，谁也别动。"**

它为什么叫"悲观"：

- 它预设别人很可能会来改这行，所以先锁住再说
- 从查询开始到事务结束，这段时间内其他事务的更新会被阻塞
- 其他事务如果也想对同一批记录执行 `FOR UPDATE` / `LOCK IN SHARE MODE` / `UPDATE` / `DELETE`，通常都要等待当前事务释放锁

如果按面试答题的顺序，也可以这么说：

- **核心思想**：总觉得别人会来抢，所以先锁再处理。
- **锁定机制**：执行 `SELECT ... FOR UPDATE` 时，命中的记录会被加排他锁（X 锁）。
- **排他性**：在当前事务 `COMMIT` 或 `ROLLBACK` 之前，其他事务不能修改这些记录，也不能对同一批记录再加冲突的加锁读。
- **适用场景**：更适合写竞争激烈、失败代价高、必须保证后续修改前提绝对不变的场景。

但这里要注意一个细节：**`FOR UPDATE` 主要阻塞的是写操作和其他加锁读，不是所有普通 `SELECT`。** 在 InnoDB 的 MVCC 下，普通一致性读通常仍然可以读到快照版本，只是看不到你尚未提交的修改。

### 悲观锁：把读和写都放进同一个事务

悲观锁适合"宁可排队，也不能并发写错"的场景。关键点有两个：**同一个 `*sql.Tx` 对象**，以及**在事务里做当前读**。

```go
func updateBalanceWithPessimisticLock(ctx context.Context, db *sql.DB, userID, amount int64) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var balance int64
	if err := tx.QueryRowContext(ctx,
		"SELECT balance FROM accounts WHERE id = ? FOR UPDATE",
		userID,
	).Scan(&balance); err != nil {
		return err
	}

	if balance < amount {
		return errors.New("insufficient balance")
	}

	if _, err := tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - ? WHERE id = ?",
		amount, userID,
	); err != nil {
		return err
	}

	return tx.Commit()
}
```

这种方式的优点是容易理解：先锁行，再校验，再更新。缺点也很直接：如果事务里混入 RPC、日志、复杂计算，锁会被持有更久，吞吐会明显下降。因此悲观锁事务一定要短，耗时操作都应放在事务外。

### 乐观锁：用版本号做 CAS 校验

乐观锁不是"完全不要事务"，而是**不显式开启覆盖整个读改写过程的长事务**。真正提交更新时，仍然依赖 `UPDATE` 这条语句自己的原子性。它的核心思想是：读取时不锁，更新时校验"我看到的版本还是不是最新版本"。

同样也可以按固定四步来描述：

- **核心思想**：我觉得大概率没人跟我抢，先查了再说，最后更新时我再对一下版本号。
- **锁定机制**：数据库层面通常不先加锁，而是在更新时做条件校验。
- **实现方式**：表里常见会有 `version`、`updated_at` 或其他可比较的状态字段。
- **更新逻辑**：典型写法是 `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`；如果 `RowsAffected() == 0`，就说明在你提交前别人已经改过了。

```go
func updateBalanceWithOptimisticLock(ctx context.Context, db *sql.DB, userID, amount int64) error {
	const maxRetry = 3

	for i := 0; i < maxRetry; i++ {
		var balance, version int64
		if err := db.QueryRowContext(ctx,
			"SELECT balance, version FROM accounts WHERE id = ?",
			userID,
		).Scan(&balance, &version); err != nil {
			return err
		}

		if balance < amount {
			return errors.New("insufficient balance")
		}

		result, err := db.ExecContext(ctx, `
			UPDATE accounts
			SET balance = balance - ?, version = version + 1
			WHERE id = ? AND version = ? AND balance >= ?
		`, amount, userID, version, amount)
		if err != nil {
			return err
		}

		affected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if affected == 1 {
			return nil
		}
		// 版本冲突，重试。生产环境应加退避和 jitter，完整模板见下方"优雅重试模板"。
	}

	return errors.New("conflict detected, please retry")
}
```

这里要注意两个细节：

1. `WHERE version = ?` 是并发校验，防止别人先一步改了这行。
2. `AND balance >= ?` 是业务校验，防止余额在并发扣减后已经不满足条件。

如果 `RowsAffected() == 0`，通常有两种可能：一是版本冲突，二是余额已经不足。简单业务可以统一返回"请重试"；如果要区分原因，就需要重新查询最新状态再决定提示语。

### 乐观锁什么时候会变成"灾难"

真正危险的，不是"偶尔冲突"，而是**绝大多数请求从一开始就注定会失败**。

例如 1000 个人同时抢最后 1 件商品，如果你用的是"查版本 -> `UPDATE ... WHERE version = ?` -> 失败就重试"的朴素乐观锁模型，典型过程会变成：

1. 第一轮里 1 个人成功，999 个人失败。
2. 这 999 个人几乎同时再次查询、再次更新、再次失败。
3. 如果继续重试，应用 CPU、数据库 QPS 和连接池都会被这些"注定失败的请求"反复消耗。

这时候问题已经不是"锁冲突"，而是**重试风暴**：

- 每次失败通常至少多出一次 `SELECT` 和一次 `UPDATE`
- 大量 goroutine 在用户态反复读、算、睡眠、重试，CPU 会被白白烧掉
- 数据库承受的往往不是有效写入，而是一堆失败的版本校验请求
- 真正该成功的流量，反而会被这些重试噪音拖慢

所以可以把经验记成一句话：

- **低频冲突场景**，如修改个人资料、审核订单、后台配置编辑，乐观锁很好用。
- **高频冲突且大部分请求注定失败的场景**，如抢票、秒杀、最后几件库存争抢，不要把乐观锁重试当主方案。

这类高冲突场景更常见的解法是：

- 先做限流、排队、令牌发放或 Redis 预扣，把无效竞争挡在数据库外
- 数据库侧尽量收敛成单条原子 `UPDATE ... WHERE stock >= ?`
- 只有在并发规模可控、且必须串行化少量关键更新时，才考虑短事务悲观锁

也就是说，**乐观锁不是不能用于高并发，而是不能用于"失败本来就是大概率事件"的高并发。**

### 什么时候该放弃 `version`

`version` 很好用，但它不是默认答案。下面几类情况，通常该考虑换方案：

- **冲突极高**：如果 90% 以上的请求都会撞版本，应用会在"查询最新版本 -> 更新失败 -> 再查一次"这个循环里白白消耗 CPU 和数据库 QPS。此时继续堆重试，收益通常很差。
- **要求绝对精确**：像银行核心扣款、清结算记账这类场景，通常不会只靠 `version` 一层兜底，而是会叠加悲观锁、唯一流水号、幂等表或账务约束一起保证正确性。
- **只是简单增减**：如果业务只是库存加减、余额扣减、计数器变化，而且判断条件可以压成一条 SQL，往往没必要显式维护 `version` 字段。

典型例子：

```sql
UPDATE products
SET stock = stock - 1
WHERE id = ? AND stock >= 1;
```

这种写法可以理解成一种**无显式 `version` 字段的乐观并发控制**：

- 它没有先查再改，而是把校验条件和更新动作合成一次原子执行
- 成功与否直接看 `RowsAffected()`
- 没有额外版本查询，也就少了一次往返和一次重试成本

所以选型顺序通常可以这么想：

1. 能压成单条原子 SQL，就先别上 `version`
2. 不能压成单条 SQL，但冲突低且允许重试，再考虑 `version`
3. 冲突很高、失败代价很大，或者业务必须严格串行化，再考虑短事务悲观锁或更上层的削峰方案

### Go 里的"优雅重试"模板

下面这个模板适合"可以重试，但不能无限重试"的业务。重点不是把重试写出来，而是把**退出条件、错误处理和退避**写完整：

```go
func updateWithRetry(ctx context.Context, db *sql.DB, id int64, newVal string) error {
	const maxRetry = 3
	const baseDelay = 10 * time.Millisecond

	for i := 0; i < maxRetry; i++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		var version int64
		if err := db.QueryRowContext(
			ctx,
			"SELECT version FROM my_table WHERE id = ?",
			id,
		).Scan(&version); err != nil {
			return fmt.Errorf("query version: %w", err)
		}

		result, err := db.ExecContext(
			ctx,
			"UPDATE my_table SET val = ?, version = version + 1 WHERE id = ? AND version = ?",
			newVal, id, version,
		)
		if err != nil {
			return fmt.Errorf("update with version: %w", err)
		}

		affected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("rows affected: %w", err)
		}
		if affected == 1 {
			return nil
		}

		if i == maxRetry-1 {
			break
		}

		// 生产环境通常还会叠加 jitter，避免失败请求再次同频碰撞。
		delay := time.Duration(i+1) * baseDelay
		timer := time.NewTimer(delay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return ctx.Err()
		case <-timer.C:
		}
	}

	return errors.New("conflict after retries")
}
```

这个模板的边界也要说清楚：

- 它适合"重试几次大概率能成功"的场景
- 它不适合"重试多少次都大概率失败"的场景
- 如果失败本来就是系统设计的一部分，就该优先做削峰和准入控制，而不是让应用层自己自旋

### Go 里两种方案的表现差异

| 维度 | 乐观锁：`version` / 时间戳 + 重试 | 悲观锁：`FOR UPDATE` |
| --- | --- | --- |
| 冲突处理时机 | 更新时再校验，不一致就失败或重试 | 查询时先加锁，后续冲突直接排队等待 |
| 等待感受 | 更像 CPU 在不停转: 读、算、重试 | 更像线程在等锁: 阻塞、挂起、超时 |
| 系统吞吐量 | 通常更高。读阶段基本不互斥，普通查询不容易被拖住 | 通常更低。冲突一高，想改同一批数据的请求会排队 |
| 连接占用 | 通常更短。多数时间不持有长事务连接，只在查询和更新时占用 | 通常更长。从加锁读开始到事务提交前，连接都会被占着 |
| 失败方式 | 版本冲突导致 `RowsAffected() == 0`，需要重试或返回失败 | 可能出现锁等待、超时、死锁 |
| 代码复杂度 | 需要版本字段、CAS 条件和重试逻辑 | 事务边界更直观，但要控制事务足够短 |
| 适用场景 | 读多写少、冲突频率低，且业务能接受失败后重试 | 冲突高、失败代价大、必须串行化更新的场景 |
| 典型 Go 写法 | `db.QueryRow(...)` + `db.Exec(UPDATE ... WHERE version = ?)` | `tx.QueryRow(... FOR UPDATE)` + `tx.Exec(...)` |

这里补两句容易被说错的话：

- **`FOR UPDATE` 不是"一个人看，全村排队"**。在 InnoDB 的 MVCC 下，普通一致性读通常还能读快照；真正排队的主要是其他写操作和加锁读。
- **秒杀也不是悲观锁的标准适用场景**。如果是高峰洪流直接打到 MySQL，单靠 `FOR UPDATE` 往往扛不住；更常见的是限流、预扣、队列和原子扣减一起上，数据库负责最终一致性。

### 分布式锁和间隙锁，不是这一层的同类选项

除了悲观锁、乐观锁，复杂系统里你还会碰到**分布式锁**和 **gap lock（间隙锁）**。但它们和前两者不在同一个抽象层面，不能简单并列成"第三种、第四种锁策略"。

**分布式锁**解决的是**跨进程、跨实例、跨服务**的协调问题。典型做法是 Redis `SET NX EX`、ZooKeeper 临时节点等。它适合控制"同一时刻只能有一个 worker 处理某个全局任务"这类场景，比如同一个订单只能被一个消费者执行，同一个定时任务只能有一个节点跑。

但要注意：

- 如果你的冲突对象只是 MySQL 里同一行数据，优先用数据库自己的事务、唯一约束、原子 `UPDATE` 或行锁
- Redis/ZooKeeper 锁不能替代数据库提交时的一致性校验，它更像外围限流和串行化手段
- 对资金、库存这类强一致业务，分布式锁最好只做"第一道门"，最终仍要由数据库条件更新、唯一索引或事务兜底

**gap lock（间隙锁）**则完全不同。它不是应用层主动设计的一种业务锁，而是 InnoDB 在 `REPEATABLE READ` 下为了防止幻读，对索引区间自动加的锁。它锁的不是一行记录，而是记录之间的索引区间，所以常见表现是：

- `SELECT ... FOR UPDATE` 的范围查询会把一段区间锁住
- 其他事务即使插入的是"不存在的新值"，只要落在这个区间里，也可能被阻塞
- 它常常是线上 `INSERT` 被莫名阻塞、死锁日志里出现 `gap before rec`、`next-key lock` 的根因

关于 gap lock 和 next-key lock 的详细分析，参见 [20. 幻读是什么，幻读有什么问题？](./20-phantom-read.md) 和 [21. 为什么我只改一行的语句，锁这么多？](./21-single-row-update-many-locks.md)。

所以，**悲观锁/乐观锁**是你做业务并发控制时主动选择的策略；**分布式锁**是跨节点协调手段；**gap lock** 是 MySQL/InnoDB 的内部加锁行为，更多用于解释和诊断。

### 怎么选

- 冲突高、失败代价大：优先悲观锁
- 冲突低、追求吞吐：优先乐观锁
- 只是单行数值扣减：优先考虑单条原子 `UPDATE ... WHERE balance >= ?`

本质上，这三种做法都在解决同一个问题：**不要让事务外读取到的旧前提，决定事务内的新写入。**

如果你的业务涉及热点账户（如平台结算户），悲观锁和乐观锁都可能不够用，需要更专门的策略。参见 [热点账户更新](./hot-account-update.md)。

### 场景建议

- 高频库存扣减、余额扣减：不要默认走"先查再 `FOR UPDATE` 再更新"。如果规则可以压缩成单条条件更新，优先用原子 `UPDATE ... WHERE stock >= ?`。只有当业务判断必须依赖多步读取、且冲突确实很高时，再考虑短事务 + `FOR UPDATE`。
- 秒杀这类极高并发场景：乐观锁很容易退化成重试风暴，单靠 MySQL 悲观锁也通常扛不住峰值。实战里常常会叠加预扣库存、请求排队、消息队列、令牌桶或 Redis 侧限流。数据库负责最终一致性，不负责吞掉全部流量洪峰。
- 用户资料修改、配置更新、后台表单编辑：更适合乐观锁，因为冲突概率低，失败后提示用户"数据已变更，请刷新后重试"通常是可以接受的。
- 跨服务串行化任务：可以加分布式锁，但别把它当成最终一致性的唯一保障。

---

## 长事务治理

这是事务设计里最常见的矛盾：**一致性要求你把关键的读改写放进同一个事务，性能又要求事务尽量短。** 解决思路不是把事务拆没，而是把真正需要原子性的那一小段留下，其余都移出去。

长事务的典型危害包括：

- 锁持有时间长，后续请求更容易排队、超时
- Undo 日志和旧版本保留时间变长，回滚和清理成本上升
- 死锁概率上升，问题排查更复杂
- 主从复制、备库回放和在线变更更容易被拖慢

核心原则可以概括成六个字：**快进快出，拆分逻辑。**

### 1. 严格区分计算逻辑和数据库 IO

最有效的办法通常不是"换一种锁"，而是**把事务内的非数据库工作全部清出去**。事务里最忌讳两类操作：

- 网络请求：RPC、HTTP、调用支付渠道、发短信、查远程服务
- 耗时计算：复杂聚合、报表计算、批量对象拼装、大量 JSON 编解码

错误写法通常是这样：

```text
BEGIN
SELECT ... FOR UPDATE
调用外部接口（2s）
UPDATE ...
COMMIT
```

更稳的写法是：

```text
事务外先准备数据/做计算/调用只读接口
BEGIN
SELECT ... FOR UPDATE   -- 如果确实需要加锁读
UPDATE / INSERT
COMMIT
```

黄金法则：**事务内尽量不要出现任何网络请求，也不要做明显耗时的 CPU 计算。**

### 2. 能用乐观锁，就不要把锁持有到整个读改写周期

如果业务冲突不高，又不想从查询那一刻起就锁行，那么可以用前面讲的 `version` 方案。这样做的本质是把大事务缩成了"最后一次条件更新"。

也就是说，不是所有"读-改-写"都必须真的包一个很长的数据库事务：

- 悲观锁：把读和写放进同一个短事务，靠 `FOR UPDATE` 保证前提不变
- 乐观锁：读取放到事务外，提交时靠 `WHERE version = ?` 保证前提没被人改掉

前提是你能接受版本冲突后的失败或重试。

### 3. 能压缩成原子 SQL，就不要手写读改写循环

如果业务只是简单的余额扣减、库存扣减、计数器增加，最优先考虑的通常不是事务包代码，而是**把逻辑压缩成一条条件更新语句**：

```sql
UPDATE items
SET stock = stock - 1
WHERE id = 101 AND stock >= 1;
```

在自动提交模式下，这条语句本身就是一个独立事务。它把"读-改-写"合并成一步，执行时间和锁持有时间都远小于"先 `SELECT` 再 `UPDATE`"。

### 4. 大事务按批次拆成小事务

如果你要修改 10000 行，不要天然认为"必须一个事务一次搞完"。很多批处理任务、归档任务、状态修复任务更适合分段提交：

- 每 100~500 条一批
- 每批一个事务
- 成功一批提交一批

代价是失去"全量 10000 条要么全成要么全不成"的原子性，但换来的是：

- 锁占用时间显著缩短
- 回滚成本可控
- 线上并发影响更小

如果业务确实要求全有或全无，那就要重新评估是否应该走离线窗口、异步任务或业务补偿，而不是强行把超大事务顶在线上主链路里。

### 5. 跨服务长链路，改成本地事务 + 异步补偿

像"下单 -> 扣库存 -> 扣余额 -> 发优惠券 -> 推物流"这种跨多个服务的链路，不应该追求一个跨系统大事务。更稳的模式通常是：

1. 本地事务先完成最核心、最可控的那一步
2. 通过 Outbox 或 MQ 异步通知下游
3. 下游失败时做补偿、重试或人工兜底

这类问题本质上已经不是"怎么把 MySQL 事务写短"了，而是"怎么做最终一致性"。数据库事务负责本地原子性，消息和补偿负责跨服务收敛。

### 6. 用 `context` 给事务一个上限，但别把它当主方案

在 Go 里可以给事务设置超时时间，避免事务因为慢 SQL、锁等待或程序异常挂太久：

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

tx, err := db.BeginTx(ctx, nil)
if err != nil {
	return err
}
defer tx.Rollback()
```

`database/sql` 会把这个 `ctx` 绑定到事务生命周期上；如果上下文提前取消，后续操作会报错，事务也会被回滚。但要注意：**超时控制是最后一道保险，不是替代事务优化的方案。** 真正决定事务长短的，仍然是你有没有把网络调用、复杂逻辑和超大批量操作放进事务里。

### 实用对照

| 手段 | 核心目标 | 何时优先考虑 |
| --- | --- | --- |
| 原子 SQL | 消除显式读改写循环 | 加减库存、扣余额、状态机简单流转 |
| 乐观锁 | 缩短加锁时长 | 冲突不高、允许重试 |
| 逻辑外置 | 减少事务内非 IO 耗时 | 几乎所有事务都适用 |
| 分批提交 | 控制事务规模 | 批量修复、归档、迁移 |
| 本地事务 + MQ/补偿 | 避免跨服务大事务 | 下单、履约、清结算链路 |
| `context` 超时 | 给事务设置兜底上限 | 防慢 SQL、防锁等待失控 |

---

## 隔离级别选择指南

MySQL 的隔离级别直接影响事务的可见性和加锁范围。Go 中通过 `sql.TxOptions.Isolation` 设置。

### 四种隔离级别速览

| 隔离级别 | Go 常量 | 脏读 | 不可重复读 | 幻读 | 说明 |
| --- | --- | --- | --- | --- | --- |
| READ UNCOMMITTED | `sql.LevelReadUncommitted` | 可能 | 可能 | 可能 | 几乎不用 |
| READ COMMITTED | `sql.LevelReadCommitted` | 不会 | 可能 | 可能 | 阿里规范推荐，减少 gap lock |
| REPEATABLE READ | `sql.LevelRepeatableRead` | 不会 | 不会 | InnoDB 通过 MVCC 基本避免 | MySQL 默认 |
| SERIALIZABLE | `sql.LevelSerializable` | 不会 | 不会 | 不会 | 性能最差，极少使用 |

### MySQL 默认 REPEATABLE READ 的行为特点

- **快照读**（普通 `SELECT`）：基于 MVCC，事务内多次读取看到的是同一个一致性快照
- **当前读**（`SELECT ... FOR UPDATE`、`UPDATE`、`DELETE`）：读取最新提交版本，并加锁
- 会产生 gap lock 和 next-key lock 来防止幻读，这也是死锁的常见来源

### 何时降到 READ COMMITTED

- **避免 gap lock 导致的死锁**：RC 下不会产生 gap lock，`INSERT` 被阻塞的概率大幅降低
- **阿里等大厂的线上规范**通常推荐 RC，因为 gap lock 在高并发写场景容易引发非预期死锁
- 代价是可能出现不可重复读和幻读，但大多数 OLTP 业务可以接受

```go
tx, err := db.BeginTx(ctx, &sql.TxOptions{
	Isolation: sql.LevelReadCommitted,
})
```

### 何时用 ReadOnly

对于报表查询、数据导出等只读事务，设置 `ReadOnly: true` 可以让 MySQL 跳过某些内部开销：

```go
tx, err := db.BeginTx(ctx, &sql.TxOptions{
	ReadOnly: true,
})
```

如需深入理解 MVCC 与隔离级别原理，参见 [03. 事务隔离：为什么你改了我还看不见？](./03-transaction-isolation.md) 和 [08. 事务到底是隔离的还是不隔离的？](./08-transaction-isolation-detail.md)。

---

## 事务相关的监控与排查

上面讲了很多事务优化原则，但"怎么发现长事务"同样重要。

### 查找活跃的长事务

```sql
-- 查找活跃时间超过 60 秒的事务
SELECT trx_id, trx_state, trx_started,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS duration_sec,
       trx_mysql_thread_id, trx_query
FROM information_schema.innodb_trx
WHERE TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 60
ORDER BY trx_started;
```

### 查看锁等待和死锁信息

```sql
-- 查看当前锁等待
SELECT * FROM performance_schema.data_lock_waits;

-- 查看最近的死锁信息
SHOW ENGINE INNODB STATUS\G
-- 在输出中找 LATEST DETECTED DEADLOCK 段落
```

### Go 侧监控：连接池状态

`database/sql` 提供了 `db.Stats()` 方法，可以定期采集关键指标：

```go
stats := db.Stats()
// 关注以下指标：
// stats.InUse        — 正在使用的连接数，持续高位可能有长事务
// stats.WaitCount    — 等待连接的累计次数
// stats.WaitDuration — 等待连接的累计时间
// stats.MaxIdleClosed — 因超过 MaxIdleConns 被关闭的连接数
```

如果 `InUse` 持续接近 `MaxOpenConns`，很可能有事务没有及时提交或回滚。

### 给 WithTx 加耗时埋点

```go
func WithTxObserved(ctx context.Context, db *sql.DB, fn func(tx *sql.Tx) error) error {
	start := time.Now()
	err := WithTx(ctx, db, fn)
	duration := time.Since(start)

	if duration > 500*time.Millisecond {
		log.Printf("[SLOW_TX] duration=%v err=%v", duration, err)
	}
	// 也可以上报到 Prometheus/OpenTelemetry
	return err
}
```

---

## 大事务拆分

上面的长事务治理原则，真正落到业务里，通常就是**把大事务拆小，只保留必要的本地原子操作**。这类问题在支付、批处理、归档和状态修复任务里最常见。

> 大事务的问题不只是慢：长时间持锁会堵塞后续请求、Undo/Redo 日志膨胀、主从复制延迟放大、回滚成本极高。高峰期一旦和热点行叠加，后续请求会被整片堵住。

### 大事务的四类来源

| 来源 | 典型场景 | 问题 |
| --- | --- | --- |
| 批量更新未分段 | 一次性更新 10 万条订单状态 | 事务持续时间过长 |
| 循环逐笔处理 | `for` 循环内逐条 `INSERT` 未分批提交 | N 条 SQL 落在同一个事务里 |
| 事务内 RPC/HTTP 调用 | 事务未提交时调用三方支付渠道 | 网络耗时直接拉长事务 |
| 事务内复杂计算 | 事务内算对账差值、生成报表 | CPU 时间直接占用事务时长 |

### 拆分原则

核心只有一条：**事务里只保留必要的本地原子操作，其他全部移出事务。**

- 网络调用（RPC、HTTP）放到事务外，拿到结果再开事务写库
- 批量操作按 500~1000 条分段提交，每段一个独立事务
- 非核心逻辑（日志、通知、统计更新）通过消息队列异步化

### 正反例对比

```go
// ❌ 反例：事务内做了渠道 RPC，持锁时间 = 本地操作 + 网络耗时
// （省略错误处理以突出结构差异）
func payBad(ctx context.Context, db *sql.DB, orderID string) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx,
		"UPDATE payment_order SET status = 'PAYING' WHERE order_id = ?", orderID)
	if err != nil {
		return err
	}
	callChannelAPI(ctx) // 可能耗时 200ms+，此时行锁一直被持有
	_, err = tx.ExecContext(ctx,
		"INSERT INTO payment_flow(order_id, status) VALUES(?, ?)", orderID, "PAYING")
	if err != nil {
		return err
	}
	return tx.Commit()
}

// ✅ 正例：先做网络调用，拿到结果后再开事务写库
func payGood(ctx context.Context, db *sql.DB, orderID string) error {
	// 1. 事务外先调渠道，只拿到结果
	result, err := callChannelAPI(ctx)
	if err != nil {
		return fmt.Errorf("call channel: %w", err)
	}

	// 2. 拿到结果后，在极短事务内写库
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		"UPDATE payment_order SET status = ? WHERE order_id = ?",
		result.Status, orderID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO payment_flow(order_id, status) VALUES(?, ?)",
		orderID, result.Status); err != nil {
		return err
	}
	return tx.Commit()
}
```

### 批量分段提交示例

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
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}

		for _, id := range batch {
			if _, err := tx.ExecContext(ctx, "UPDATE payment_order SET status='CLOSED' WHERE order_id=?", id); err != nil {
				tx.Rollback()
				return err
			}
		}

		if err := tx.Commit(); err != nil {
			tx.Rollback()
			return err
		}
	}

	return nil
}
```

拆分事务的本质，是缩短持锁时间窗，让锁更快释放、并发通过率更高。对支付系统来说，最危险的不是单次 SQL 慢，而是**大事务和热点行同时出现**。

---

## 继续阅读

- [database/sql 与连接池](/golang/guide/06-database-sql-and-connection)
- [SQL 优化](./sql-optimization.md)
- [ORM 使用经验（GORM）](./orm-gorm.md)
- [事务隔离：为什么你改了我还看不见？](./03-transaction-isolation.md)
- [热点账户更新](./hot-account-update.md)
- [死锁检测与回滚重试](./deadlock-and-retry.md)
- [返回 MySQL 专题总览](./index.md)
