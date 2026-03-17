---
title: 事务处理与 SQL 优化
description: Go 中的事务处理模式、隔离级别选择、EXPLAIN 分析、批量操作与游标分页等 SQL 优化实践。
---

# 事务处理与 SQL 优化

## 1. 事务处理

事务保证一组数据库操作的原子性。Go 中通过 `db.Begin()` 或 `db.BeginTx()` 开启事务，拿到 `*sql.Tx` 对象后在其上执行操作，最终 `Commit` 或 `Rollback`。

### 基础事务与 defer Rollback 模式

```go
func transferMoney(db *sql.DB, fromID, toID int64, amount float64) error {
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
import (
	"context"
	"database/sql"
	"fmt"
)

func transferMoneyWithCtx(ctx context.Context, db *sql.DB, fromID, toID int64, amount float64) error {
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
	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
		amount, fromID, amount,
	)
	if err != nil {
		return fmt.Errorf("deduct: %w", err)
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

**讲解重点：**

1. **defer Rollback 模式**：无论函数中途 return 还是 panic，`defer tx.Rollback()` 都能保证事务被回滚。如果已经 `Commit` 成功，后续的 `Rollback` 调用是无操作（no-op），不会报错。
2. **Context 关联事务**：使用 `BeginTx` + `ExecContext/QueryContext` 可以让事务感知超时和取消。当 context 被取消时，正在执行的 SQL 会被中断，避免长事务占用连接。
3. **隔离级别的选择**：MySQL 默认是 `REPEATABLE READ`。对于读多写少的报表查询，可以用 `ReadOnly: true` 优化。对于需要避免幻读的场景才考虑更高隔离级别。

---

## 2. SQL 优化

SQL 优化的核心是减少数据库的工作量：让查询走索引、减少扫描行数、避免不必要的全表查询。在 Go 中还需关注查询模式对连接池的影响。

### EXPLAIN 分析与索引使用

```go
package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
)

// 开发阶段辅助函数：打印 EXPLAIN 结果
func explainQuery(db *sql.DB, query string, args ...interface{}) {
	rows, err := db.Query("EXPLAIN "+query, args...)
	if err != nil {
		log.Printf("EXPLAIN error: %v", err)
		return
	}
	defer rows.Close()

	cols, _ := rows.Columns()
	fmt.Println(strings.Join(cols, "\t"))

	values := make([]sql.RawBytes, len(cols))
	scanArgs := make([]interface{}, len(cols))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	for rows.Next() {
		if err := rows.Scan(scanArgs...); err != nil {
			log.Printf("scan error: %v", err)
			continue
		}
		row := make([]string, len(cols))
		for i, v := range values {
			if v == nil {
				row[i] = "NULL"
			} else {
				row[i] = string(v)
			}
		}
		fmt.Println(strings.Join(row, "\t"))
	}
}

// 示例：对比有索引和无索引的查询
func main() {
	db, _ := sql.Open("mysql", "user:password@tcp(127.0.0.1:3306)/mydb")
	defer db.Close()

	// 全表扫描：type=ALL，性能差
	explainQuery(db, "SELECT * FROM orders WHERE YEAR(created_at) = ?", 2024)

	// 走索引：在 created_at 上有索引时 type=range
	explainQuery(db, "SELECT * FROM orders WHERE created_at >= ? AND created_at < ?",
		"2024-01-01", "2025-01-01")
}
```

### Go 中的查询优化模式

```go
// 1. 避免 SELECT *，只查需要的列
// Bad: 查出所有列，浪费带宽和内存
rows, err := db.Query("SELECT * FROM users WHERE status = ?", "active")

// Good: 只查需要的列
rows, err := db.Query("SELECT id, name, email FROM users WHERE status = ?", "active")

// 2. 批量操作代替循环单条
// Bad: N 次网络往返
for _, id := range ids {
    db.Exec("UPDATE users SET status = ? WHERE id = ?", "inactive", id)
}

// Good: 一次批量更新
func batchUpdateStatus(db *sql.DB, ids []int64, status string) error {
	if len(ids) == 0 {
		return nil
	}
	placeholders := make([]string, len(ids))
	args := make([]interface{}, 0, len(ids)+1)
	args = append(args, status)
	for i, id := range ids {
		placeholders[i] = "?"
		args = append(args, id)
	}
	query := fmt.Sprintf(
		"UPDATE users SET status = ? WHERE id IN (%s)",
		strings.Join(placeholders, ","),
	)
	_, err := db.Exec(query, args...)
	return err
}

// 3. 分页查询避免大 OFFSET
// Bad: OFFSET 越大越慢，数据库要扫描并丢弃前面的行
db.Query("SELECT id, name FROM users ORDER BY id LIMIT ? OFFSET ?", 20, 100000)

// Good: 基于游标分页，利用索引
func listUsersAfter(db *sql.DB, lastID int64, limit int) ([]User, error) {
	rows, err := db.Query(
		"SELECT id, name, email FROM users WHERE id > ? ORDER BY id LIMIT ?",
		lastID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
```

**讲解重点：**

1. **索引失效的常见原因**：对列使用函数（`YEAR(created_at)`）、隐式类型转换（字符串列传数字）、`LIKE '%xxx'` 前缀模糊匹配、`OR` 条件中部分列无索引，这些都会导致索引失效，退化为全表扫描。
2. **批量操作减少网络往返**：循环单条 INSERT/UPDATE 每次都有一次网络往返和一次事务开销。合并成批量操作或使用事务包裹可以大幅提升吞吐。
3. **游标分页替代 OFFSET 分页**：`OFFSET 100000` 意味着数据库要先扫描跳过 10 万行，越往后越慢。基于上一页最后一条记录的 ID（或时间戳）做游标分页，性能稳定不退化。

---

## 继续阅读

- [database/sql 与连接池](/golang/guide/06-database-sql-and-connection)
- [ORM 使用经验（GORM）](./orm-gorm.md)
- [大事务拆分](./large-transaction-splitting.md)
- [返回 MySQL 专题总览](./index.md)
