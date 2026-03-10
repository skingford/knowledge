# 数据库与缓存

## 适合人群

- 正在使用 Go 开发后端服务，需要和 MySQL、Redis 打交道的工程师
- 想系统掌握数据库连接池、事务、缓存一致性等生产级实践的开发者
- 准备技术面试，需要理清缓存穿透/击穿/雪崩、分库分表等高频话题的人
- 希望从"能用"提升到"用好"数据库和缓存的 Go 后端工程师

## 学习目标

- 掌握 `database/sql` 标准库的核心用法与注意事项
- 理解 MySQL 连接池参数调优与监控
- 熟练使用事务处理并理解隔离级别
- 掌握 SQL 优化的常见手段与 Go 中的最佳实践
- 了解 ORM（GORM）的使用场景与陷阱
- 熟练使用 go-redis 操作 Redis
- 深入理解缓存穿透、击穿、雪崩的原因与解决方案
- 掌握缓存一致性的主流策略
- 理解分库分表后的数据路由与分布式 ID 生成

## 快速导航

- [1. database/sql 使用](#_1-database-sql-使用)
- [2. MySQL 连接池](#_2-mysql-连接池)
- [3. 事务处理](#_3-事务处理)
- [4. SQL 优化](#_4-sql-优化)
- [5. ORM 使用经验](#_5-orm-使用经验)
- [6. Redis 在 Go 中的实践](#_6-redis-在-go-中的实践)
- [7. 缓存穿透、击穿、雪崩](#_7-缓存穿透、击穿、雪崩)
- [8. 缓存一致性](#_8-缓存一致性)
- [9. 分库分表后的处理方式](#_9-分库分表后的处理方式)

---

## 1. database/sql 使用

`database/sql` 是 Go 标准库中操作关系型数据库的统一接口。它本身不包含数据库驱动，需要搭配具体驱动（如 `github.com/go-sql-driver/mysql`）使用。核心要点是理解连接的生命周期、资源的及时释放、以及参数化查询防注入。

### 基础用法：Open、Query、Exec、Scan

```go
package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

type User struct {
	ID    int64
	Name  string
	Email string
}

func main() {
	// Open 不会立即建立连接，只是初始化连接池
	db, err := sql.Open("mysql", "user:password@tcp(127.0.0.1:3306)/mydb?parseTime=true")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Ping 才会真正建立连接，用于验证数据库是否可达
	if err := db.Ping(); err != nil {
		log.Fatal("database unreachable:", err)
	}

	// Exec：用于 INSERT/UPDATE/DELETE 等不返回行的操作
	result, err := db.Exec(
		"INSERT INTO users (name, email) VALUES (?, ?)",
		"张三", "zhangsan@example.com",
	)
	if err != nil {
		log.Fatal(err)
	}
	lastID, _ := result.LastInsertId()
	affected, _ := result.RowsAffected()
	fmt.Printf("inserted id=%d, affected=%d\n", lastID, affected)

	// QueryRow：查询单行
	var user User
	err = db.QueryRow("SELECT id, name, email FROM users WHERE id = ?", lastID).
		Scan(&user.ID, &user.Name, &user.Email)
	if err == sql.ErrNoRows {
		fmt.Println("user not found")
		return
	}
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("user: %+v\n", user)

	// Query：查询多行，必须关闭 Rows
	rows, err := db.Query("SELECT id, name, email FROM users WHERE id > ?", 0)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close() // 关键：必须关闭，否则连接泄漏

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			log.Fatal(err)
		}
		users = append(users, u)
	}
	// 检查迭代过程中是否出错
	if err := rows.Err(); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("total users: %d\n", len(users))
}
```

### Prepared Statements

```go
func batchInsertUsers(db *sql.DB, names []string) error {
	// Prepare 会在数据库端预编译 SQL，适合同一语句反复执行的场景
	stmt, err := db.Prepare("INSERT INTO users (name, email) VALUES (?, ?)")
	if err != nil {
		return fmt.Errorf("prepare failed: %w", err)
	}
	defer stmt.Close()

	for _, name := range names {
		email := name + "@example.com"
		if _, err := stmt.Exec(name, email); err != nil {
			return fmt.Errorf("exec failed for %s: %w", name, err)
		}
	}
	return nil
}
```

**讲解重点：**

1. **`sql.Open` 不建立连接**：它只是初始化连接池对象，真正的连接在第一次使用时建立。调用 `db.Ping()` 可以提前验证连接可用性。
2. **`rows.Close()` 必须调用**：`Query` 返回的 `Rows` 对象持有数据库连接，不关闭会导致连接泄漏，最终耗尽连接池。推荐用 `defer rows.Close()` 紧跟在错误检查之后。
3. **参数化查询防 SQL 注入**：永远使用 `?` 占位符传参，不要拼接字符串。`Prepare` 适合同一条 SQL 反复执行的场景，单次执行直接用 `db.Query/Exec` 即可。

---

## 2. MySQL 连接池

`database/sql` 内置了连接池管理，但默认配置往往不适合生产环境。合理设置连接池参数能避免连接泄漏、超时等问题。

### 连接池参数配置

```go
package main

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func initDB() *sql.DB {
	db, err := sql.Open("mysql", "user:password@tcp(127.0.0.1:3306)/mydb?parseTime=true")
	if err != nil {
		log.Fatal(err)
	}

	// 最大打开连接数：限制同时与数据库建立的连接总数
	// 设置过小会导致请求排队，过大会给数据库带来压力
	db.SetMaxOpenConns(100)

	// 最大空闲连接数：连接池中保持的空闲连接数
	// 建议设为 MaxOpenConns 的 25%~50%
	db.SetMaxIdleConns(25)

	// 连接最大存活时间：超过这个时间的连接会被关闭并回收
	// 建议比 MySQL 的 wait_timeout（默认 8h）短
	db.SetConnMaxLifetime(5 * time.Minute)

	// 连接最大空闲时间（Go 1.15+）：空闲超过这个时间的连接会被关闭
	db.SetConnMaxIdleTime(3 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	return db
}
```

### 连接池监控

```go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// 定期采集连接池指标，上报到监控系统
func monitorDBPool(ctx context.Context, db *sql.DB) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			stats := db.Stats()
			log.Printf(
				"db pool: open=%d inuse=%d idle=%d wait_count=%d wait_duration=%s",
				stats.OpenConnections,
				stats.InUse,
				stats.Idle,
				stats.WaitCount,
				stats.WaitDuration,
			)
			// 关键指标告警
			if stats.WaitCount > 0 {
				log.Printf("WARNING: connections are waiting, consider increasing MaxOpenConns")
			}
		}
	}
}

// 提供 HTTP 端点暴露连接池状态
func dbStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats := db.Stats()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"max_open":         stats.MaxOpenConnections,
			"open":             stats.OpenConnections,
			"in_use":           stats.InUse,
			"idle":             stats.Idle,
			"wait_count":       stats.WaitCount,
			"wait_duration_ms": stats.WaitDuration.Milliseconds(),
			"max_idle_closed":  stats.MaxIdleClosed,
			"max_lifetime_closed": stats.MaxLifetimeClosed,
		})
	}
}
```

**讲解重点：**

1. **MaxOpenConns 是硬上限**：超过后新请求会阻塞等待可用连接。`db.Stats().WaitCount > 0` 说明出现了排队，需要关注。
2. **ConnMaxLifetime 必须设置**：如果不设置，连接可能在 MySQL 端超时被关闭，但 Go 侧不知道，导致 `broken pipe` 或 `invalid connection` 错误。建议设为比 MySQL `wait_timeout` 短的值。
3. **监控 Stats 是排查问题的关键**：`InUse` 持续高位说明查询慢或连接未释放；`WaitCount` 增长说明并发超过连接池容量。生产环境务必接入监控。

---

## 3. 事务处理

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

## 4. SQL 优化

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

## 5. ORM 使用经验

GORM 是 Go 中最流行的 ORM 框架。它提供了便捷的 CRUD、关联查询、迁移等功能，但也容易引入性能陷阱。关键是理解它生成的 SQL，知道什么时候该用 ORM、什么时候该用原生 SQL。

### GORM 基础用法

```go
package main

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"size:100;not null"`
	Email     string `gorm:"size:200;uniqueIndex"`
	Age       int
	CreatedAt time.Time
	UpdatedAt time.Time
}

func main() {
	dsn := "user:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		// 开发阶段开启日志，可以看到生成的 SQL
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal(err)
	}

	// 自动建表/迁移
	db.AutoMigrate(&User{})

	// Create
	user := User{Name: "张三", Email: "zhangsan@example.com", Age: 28}
	if err := db.Create(&user).Error; err != nil {
		log.Fatal(err)
	}
	fmt.Printf("created user id=%d\n", user.ID)

	// Read
	var found User
	if err := db.First(&found, user.ID).Error; err != nil {
		log.Fatal(err)
	}

	// Update
	db.Model(&found).Update("Age", 29)

	// Delete（软删除需要模型嵌入 gorm.DeletedAt）
	db.Delete(&User{}, user.ID)

	// 条件查询
	var users []User
	db.Where("age > ? AND name LIKE ?", 20, "%张%").
		Order("created_at DESC").
		Limit(10).
		Find(&users)
}
```

### 避免 N+1 查询问题

```go
type Order struct {
	ID     uint
	UserID uint
	User   User  `gorm:"foreignKey:UserID"` // 关联
	Total  float64
	Items  []OrderItem `gorm:"foreignKey:OrderID"`
}

type OrderItem struct {
	ID        uint
	OrderID   uint
	ProductID uint
	Qty       int
	Price     float64
}

// Bad: N+1 问题 — 查 10 个订单，每个订单再查一次 User，共 11 次查询
func getOrdersBad(db *gorm.DB) []Order {
	var orders []Order
	db.Find(&orders) // SELECT * FROM orders
	for i := range orders {
		db.First(&orders[i].User, orders[i].UserID) // 每个订单一次查询
	}
	return orders
}

// Good: 使用 Preload 预加载，GORM 会合并成 2 次查询
func getOrdersGood(db *gorm.DB) ([]Order, error) {
	var orders []Order
	err := db.Preload("User").Preload("Items").
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)).
		Find(&orders).Error
	// SELECT * FROM orders WHERE created_at > ?
	// SELECT * FROM users WHERE id IN (1,2,3,...)
	// SELECT * FROM order_items WHERE order_id IN (1,2,3,...)
	return orders, err
}
```

### 什么时候用原生 SQL

```go
// 复杂聚合查询、多表 JOIN、性能敏感的场景，建议直接用原生 SQL
type SalesReport struct {
	ProductName string
	TotalQty    int
	TotalAmount float64
}

func getSalesReport(db *gorm.DB) ([]SalesReport, error) {
	var reports []SalesReport
	err := db.Raw(`
		SELECT p.name AS product_name,
		       SUM(oi.qty) AS total_qty,
		       SUM(oi.qty * oi.price) AS total_amount
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		JOIN orders o ON o.id = oi.order_id
		WHERE o.created_at >= ?
		GROUP BY p.id, p.name
		ORDER BY total_amount DESC
		LIMIT 20
	`, time.Now().AddDate(0, -1, 0)).Scan(&reports).Error
	return reports, err
}
```

**讲解重点：**

1. **ORM 适合简单 CRUD，复杂查询用原生 SQL**：ORM 的价值在于减少样板代码，但复杂 JOIN、子查询、窗口函数等场景下，ORM 生成的 SQL 往往不够优化，且可读性差。建议团队约定：简单 CRUD 用 ORM，复杂查询用 `db.Raw()`。
2. **N+1 问题是 ORM 最常见的性能陷阱**：每访问一个关联字段就触发一次查询，10 条主记录就变成 11 次查询。GORM 的 `Preload` 和 `Joins` 可以解决，但需要开发者主动使用。开发阶段开启 SQL 日志可以及早发现。
3. **AutoMigrate 不适合生产环境**：它只会添加列、创建索引，不会删除列或修改列类型。生产环境应使用专门的数据库迁移工具（如 golang-migrate、goose），配合版本管理和 code review。

---

## 6. Redis 在 Go 中的实践

`go-redis`（`github.com/redis/go-redis/v9`）是 Go 中最主流的 Redis 客户端。它支持连接池、Pipeline、Pub/Sub、Lua 脚本等功能，API 设计符合 Go 的惯用风格。

### 基础操作

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:         "localhost:6379",
		Password:     "",
		DB:           0,
		PoolSize:     100,           // 连接池大小
		MinIdleConns: 10,            // 最小空闲连接
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})
	defer rdb.Close()

	// Ping
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal("redis connect failed:", err)
	}

	// String 操作
	err := rdb.Set(ctx, "user:1:name", "张三", 10*time.Minute).Err()
	if err != nil {
		log.Fatal(err)
	}

	name, err := rdb.Get(ctx, "user:1:name").Result()
	if err == redis.Nil {
		fmt.Println("key does not exist")
	} else if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("name:", name)
	}

	// Hash 操作：适合存储对象
	rdb.HSet(ctx, "user:1", map[string]interface{}{
		"name":  "张三",
		"email": "zhangsan@example.com",
		"age":   28,
	})
	fields, err := rdb.HGetAll(ctx, "user:1").Result()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("user fields: %v\n", fields)

	// Sorted Set：适合排行榜
	rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 100, Member: "player1"})
	rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 200, Member: "player2"})
	rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 150, Member: "player3"})

	// 获取 Top 3（分数从高到低）
	topPlayers, err := rdb.ZRevRangeWithScores(ctx, "leaderboard", 0, 2).Result()
	if err != nil {
		log.Fatal(err)
	}
	for _, z := range topPlayers {
		fmt.Printf("player=%s score=%.0f\n", z.Member, z.Score)
	}
}
```

### Pipeline 批量操作

```go
// Pipeline 将多个命令打包发送，减少网络往返
func getUsersBatch(ctx context.Context, rdb *redis.Client, userIDs []int64) (map[int64]string, error) {
	pipe := rdb.Pipeline()

	cmds := make(map[int64]*redis.StringCmd, len(userIDs))
	for _, id := range userIDs {
		key := fmt.Sprintf("user:%d:name", id)
		cmds[id] = pipe.Get(ctx, key)
	}

	// 一次性发送所有命令
	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("pipeline exec: %w", err)
	}

	result := make(map[int64]string, len(userIDs))
	for id, cmd := range cmds {
		name, err := cmd.Result()
		if err == redis.Nil {
			continue // key 不存在，跳过
		}
		if err != nil {
			return nil, fmt.Errorf("get user %d: %w", id, err)
		}
		result[id] = name
	}
	return result, nil
}
```

### Pub/Sub 发布订阅

```go
func startSubscriber(ctx context.Context, rdb *redis.Client) {
	sub := rdb.Subscribe(ctx, "notifications", "alerts")
	defer sub.Close()

	ch := sub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			fmt.Printf("channel=%s payload=%s\n", msg.Channel, msg.Payload)
		}
	}
}

func publishMessage(ctx context.Context, rdb *redis.Client) error {
	return rdb.Publish(ctx, "notifications", "new order created").Err()
}
```

**讲解重点：**

1. **Pipeline 大幅减少延迟**：10 个独立命令意味着 10 次网络往返，Pipeline 合并成 1 次往返。批量读取、批量写入场景务必使用 Pipeline。
2. **区分 `redis.Nil` 和其他错误**：`redis.Nil` 表示 key 不存在，这是正常业务情况，不应当作错误处理。其他错误（网络超时、连接断开等）才需要告警。
3. **连接池参数要匹配业务并发**：`PoolSize` 默认为 `runtime.GOMAXPROCS * 10`，高并发场景需要根据 QPS 和命令耗时来计算。`MinIdleConns` 可以避免冷启动时的连接建立延迟。

---

## 7. 缓存穿透、击穿、雪崩

这三个问题是使用缓存时最常见的异常场景，面试高频考点，也是生产环境中必须防范的问题。

### 缓存穿透

**定义**：查询一个数据库中根本不存在的数据，每次请求都直接打到数据库，缓存形同虚设。

**典型场景**：恶意请求大量不存在的 ID。

```go
// 解法 1：缓存空值
func getUser(ctx context.Context, rdb *redis.Client, db *sql.DB, userID int64) (*User, error) {
	key := fmt.Sprintf("user:%d", userID)

	// 查缓存
	data, err := rdb.Get(ctx, key).Result()
	if err == nil {
		if data == "" {
			// 缓存了空值，说明数据库中也不存在
			return nil, nil
		}
		var user User
		json.Unmarshal([]byte(data), &user)
		return &user, nil
	}
	if err != redis.Nil {
		return nil, err
	}

	// 查数据库
	var user User
	err = db.QueryRowContext(ctx,
		"SELECT id, name, email FROM users WHERE id = ?", userID,
	).Scan(&user.ID, &user.Name, &user.Email)

	if err == sql.ErrNoRows {
		// 数据库也不存在，缓存空值，设置较短的过期时间
		rdb.Set(ctx, key, "", 5*time.Minute)
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// 缓存数据
	jsonData, _ := json.Marshal(user)
	rdb.Set(ctx, key, jsonData, 30*time.Minute)
	return &user, nil
}

// 解法 2：布隆过滤器（请求到达前先判断 key 是否可能存在）
// 使用 redisbloom 模块或自行实现
func getUserWithBloom(ctx context.Context, rdb *redis.Client, db *sql.DB, userID int64) (*User, error) {
	key := fmt.Sprintf("user:%d", userID)

	// 先查布隆过滤器，如果判定不存在则直接返回
	exists, err := rdb.Do(ctx, "BF.EXISTS", "user_bloom", userID).Bool()
	if err != nil {
		// 布隆过滤器不可用时降级，允许查库
		log.Printf("bloom filter error: %v, falling back", err)
	} else if !exists {
		return nil, nil // 一定不存在
	}

	// 布隆过滤器说可能存在，走正常缓存->数据库流程
	// ... 同上述逻辑
	return getUser(ctx, rdb, db, userID)
}
```

### 缓存击穿

**定义**：某个热点 key 过期的瞬间，大量并发请求同时打到数据库。

**典型场景**：首页热门商品的缓存突然过期。

```go
import "golang.org/x/sync/singleflight"

var sfGroup singleflight.Group

// 使用 singleflight 防止缓存击穿
func getHotProduct(ctx context.Context, rdb *redis.Client, db *sql.DB, productID int64) (*Product, error) {
	key := fmt.Sprintf("product:%d", productID)

	// 查缓存
	data, err := rdb.Get(ctx, key).Result()
	if err == nil {
		var product Product
		json.Unmarshal([]byte(data), &product)
		return &product, nil
	}
	if err != redis.Nil {
		return nil, err
	}

	// 缓存未命中，使用 singleflight 确保同一 key 只有一个请求查库
	v, err, _ := sfGroup.Do(key, func() (interface{}, error) {
		var product Product
		err := db.QueryRowContext(ctx,
			"SELECT id, name, price FROM products WHERE id = ?", productID,
		).Scan(&product.ID, &product.Name, &product.Price)
		if err != nil {
			return nil, err
		}

		// 回填缓存
		jsonData, _ := json.Marshal(product)
		rdb.Set(ctx, key, jsonData, 30*time.Minute)
		return &product, nil
	})
	if err != nil {
		return nil, err
	}
	product := v.(*Product)
	return product, nil
}
```

### 缓存雪崩

**定义**：大量 key 在同一时间过期，或 Redis 整体不可用，所有请求涌向数据库。

```go
import "math/rand"

// 解法 1：TTL 加随机偏移，避免大量 key 同时过期
func cacheWithJitter(ctx context.Context, rdb *redis.Client, key string, data []byte, baseTTL time.Duration) error {
	// 在基准 TTL 上加 0~20% 的随机偏移
	jitter := time.Duration(rand.Int63n(int64(baseTTL) / 5))
	ttl := baseTTL + jitter
	return rdb.Set(ctx, key, data, ttl).Err()
}

// 解法 2：多级缓存 + 降级
type CacheManager struct {
	rdb        *redis.Client
	db         *sql.DB
	localCache sync.Map // 本地内存缓存作为兜底
}

func (cm *CacheManager) Get(ctx context.Context, key string) (string, error) {
	// 第一级：本地缓存
	if v, ok := cm.localCache.Load(key); ok {
		return v.(string), nil
	}

	// 第二级：Redis
	val, err := cm.rdb.Get(ctx, key).Result()
	if err == nil {
		cm.localCache.Store(key, val)
		return val, nil
	}
	if err != redis.Nil {
		// Redis 不可用，降级到数据库
		log.Printf("redis error: %v, falling back to db", err)
	}

	// 第三级：数据库
	val, err = cm.loadFromDB(ctx, key)
	if err != nil {
		return "", err
	}

	// 异步回填 Redis（不阻塞主流程）
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		cacheWithJitter(bgCtx, cm.rdb, key, []byte(val), 30*time.Minute)
	}()

	cm.localCache.Store(key, val)
	return val, nil
}
```

**讲解重点：**

1. **穿透的本质是查不存在的数据**：缓存空值是最简单的方案，但要设置较短的 TTL 避免占用内存。布隆过滤器可以在请求入口提前过滤，但有一定误判率（会把不存在的判断为可能存在）。
2. **击穿用 singleflight 解决最优雅**：`singleflight.Group` 保证同一个 key 在同一时刻只有一个请求真正去查数据库，其他请求等待并共享结果。比分布式锁更轻量，适合单机场景。
3. **雪崩的预防重在分散过期时间**：TTL 加随机偏移（jitter）是最简单有效的手段。更进一步可以做多级缓存（本地缓存 + Redis + 数据库），即使 Redis 不可用也能降级。

---

## 8. 缓存一致性

缓存一致性是指缓存中的数据和数据库中的数据保持同步。由于缓存和数据库是两个独立的存储系统，无法做到强一致性，工程上追求的是最终一致性。

### Cache Aside Pattern（旁路缓存，最常用）

```go
// 读流程：先查缓存 -> 缓存未命中则查数据库 -> 回填缓存
func getUser(ctx context.Context, rdb *redis.Client, db *sql.DB, userID int64) (*User, error) {
	key := fmt.Sprintf("user:%d", userID)

	// 1. 查缓存
	data, err := rdb.Get(ctx, key).Result()
	if err == nil {
		var user User
		json.Unmarshal([]byte(data), &user)
		return &user, nil
	}
	if err != redis.Nil {
		return nil, err
	}

	// 2. 缓存未命中，查数据库
	var user User
	err = db.QueryRowContext(ctx,
		"SELECT id, name, email FROM users WHERE id = ?", userID,
	).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return nil, err
	}

	// 3. 回填缓存
	jsonData, _ := json.Marshal(user)
	rdb.Set(ctx, key, jsonData, 30*time.Minute)
	return &user, nil
}

// 写流程：先更新数据库 -> 再删除缓存（不是更新缓存！）
func updateUser(ctx context.Context, rdb *redis.Client, db *sql.DB, user *User) error {
	// 1. 先更新数据库
	_, err := db.ExecContext(ctx,
		"UPDATE users SET name = ?, email = ? WHERE id = ?",
		user.Name, user.Email, user.ID,
	)
	if err != nil {
		return err
	}

	// 2. 再删除缓存（让下次读取时重新加载）
	key := fmt.Sprintf("user:%d", user.ID)
	if err := rdb.Del(ctx, key).Err(); err != nil {
		// 删除失败：记录日志并通过延迟双删或消息队列补偿
		log.Printf("WARNING: failed to delete cache %s: %v", key, err)
	}
	return nil
}
```

### 延迟双删：进一步降低不一致窗口

```go
func updateUserWithDoubleDelete(ctx context.Context, rdb *redis.Client, db *sql.DB, user *User) error {
	key := fmt.Sprintf("user:%d", user.ID)

	// 1. 先删除缓存
	rdb.Del(ctx, key)

	// 2. 更新数据库
	_, err := db.ExecContext(ctx,
		"UPDATE users SET name = ?, email = ? WHERE id = ?",
		user.Name, user.Email, user.ID,
	)
	if err != nil {
		return err
	}

	// 3. 延迟再删一次缓存（覆盖在步骤 1 和 2 之间被其他读请求回填的旧数据）
	go func() {
		time.Sleep(500 * time.Millisecond) // 延迟时间 > 一次读请求的耗时
		bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := rdb.Del(bgCtx, key).Err(); err != nil {
			log.Printf("double delete failed for %s: %v", key, err)
		}
	}()

	return nil
}
```

### 基于消息队列的最终一致性

```go
// 通过监听数据库 binlog 或业务事件来异步更新缓存
// 这是大规模系统中最可靠的方案

type CacheInvalidator struct {
	rdb *redis.Client
}

// 消费数据库变更事件（可来自 Canal、Debezium 等 CDC 工具）
func (ci *CacheInvalidator) HandleDBChange(ctx context.Context, event DBChangeEvent) error {
	var keys []string

	switch event.Table {
	case "users":
		keys = append(keys, fmt.Sprintf("user:%d", event.PrimaryKey))
		keys = append(keys, fmt.Sprintf("user:list:page:*")) // 相关列表缓存
	case "products":
		keys = append(keys, fmt.Sprintf("product:%d", event.PrimaryKey))
		keys = append(keys, fmt.Sprintf("product:category:%d", event.Data["category_id"]))
	}

	if len(keys) > 0 {
		pipe := ci.rdb.Pipeline()
		for _, key := range keys {
			pipe.Del(ctx, key)
		}
		if _, err := pipe.Exec(ctx); err != nil {
			return fmt.Errorf("invalidate cache: %w", err)
		}
	}
	return nil
}

type DBChangeEvent struct {
	Table      string
	Action     string // insert, update, delete
	PrimaryKey int64
	Data       map[string]interface{}
}
```

**讲解重点：**

1. **写操作删除缓存而不是更新缓存**：更新缓存在并发场景下容易出现数据覆盖（两个写请求，后写入数据库的先更新了缓存）。删除缓存让下次读取时重新加载，天然避免了这个问题。
2. **"先更新数据库，再删除缓存" 是推荐顺序**：如果先删缓存再更新数据库，在删缓存和更新数据库之间有请求读到旧数据并回填缓存，就会导致长时间不一致。先更新数据库再删缓存的不一致窗口更短。
3. **强一致性需要分布式事务，大多数场景最终一致性足够**：Cache Aside + TTL 过期 可以保证最终一致。对一致性要求更高的场景可以加延迟双删或基于 binlog 的异步失效。真正需要强一致的数据（如余额）不应该走缓存。

---

## 9. 分库分表后的处理方式

当单表数据量达到千万级别或单库写入瓶颈时，需要考虑分库分表。分库分表会引入数据路由、跨分片查询、分布式 ID 等新的复杂性。

### 分片路由策略

```go
package sharding

import (
	"database/sql"
	"fmt"
	"hash/crc32"
)

// ShardRouter 分片路由器
type ShardRouter struct {
	dbCount    int      // 数据库数量
	tableCount int      // 每个库中的表数量
	dbs        []*sql.DB
}

func NewShardRouter(dsns []string, tableCount int) (*ShardRouter, error) {
	dbs := make([]*sql.DB, len(dsns))
	for i, dsn := range dsns {
		db, err := sql.Open("mysql", dsn)
		if err != nil {
			return nil, fmt.Errorf("open db %d: %w", i, err)
		}
		dbs[i] = db
	}
	return &ShardRouter{
		dbCount:    len(dsns),
		tableCount: tableCount,
		dbs:        dbs,
	}, nil
}

// 策略 1：哈希取模（最常用，数据分布均匀）
func (sr *ShardRouter) HashRoute(userID int64) (db *sql.DB, tableName string) {
	// 先定位到哪个库
	dbIndex := int(userID) % sr.dbCount
	// 再定位到哪张表
	tableIndex := int(userID) % (sr.dbCount * sr.tableCount) / sr.dbCount
	return sr.dbs[dbIndex], fmt.Sprintf("orders_%04d", tableIndex)
}

// 策略 2：范围分片（按时间或 ID 范围）
func (sr *ShardRouter) RangeRoute(orderID int64) (db *sql.DB, tableName string) {
	// 每 1000 万一个分片
	shardIndex := int(orderID / 10_000_000)
	dbIndex := shardIndex % sr.dbCount
	return sr.dbs[dbIndex], fmt.Sprintf("orders_%04d", shardIndex)
}

// 策略 3：一致性哈希（扩容时迁移数据量最小）
func (sr *ShardRouter) ConsistentHashRoute(key string) (db *sql.DB, tableName string) {
	hash := crc32.ChecksumIEEE([]byte(key))
	dbIndex := int(hash) % sr.dbCount
	tableIndex := int(hash) % sr.tableCount
	return sr.dbs[dbIndex], fmt.Sprintf("orders_%04d", tableIndex)
}
```

### 分布式 ID 生成

```go
package idgen

import (
	"fmt"
	"sync"
	"time"
)

// Snowflake 算法：生成全局唯一、趋势递增的 ID
// 结构：1bit 符号位 + 41bit 时间戳 + 10bit 机器 ID + 12bit 序列号
type Snowflake struct {
	mu        sync.Mutex
	epoch     int64 // 起始时间戳（毫秒）
	machineID int64 // 机器 ID (0~1023)
	sequence  int64 // 序列号 (0~4095)
	lastTime  int64
}

func NewSnowflake(machineID int64) (*Snowflake, error) {
	if machineID < 0 || machineID > 1023 {
		return nil, fmt.Errorf("machine ID must be between 0 and 1023")
	}
	return &Snowflake{
		epoch:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC).UnixMilli(),
		machineID: machineID,
	}, nil
}

func (s *Snowflake) Generate() (int64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UnixMilli() - s.epoch

	if now == s.lastTime {
		s.sequence = (s.sequence + 1) & 0xFFF // 12 bit mask
		if s.sequence == 0 {
			// 当前毫秒序列号耗尽，等待下一毫秒
			for now <= s.lastTime {
				now = time.Now().UnixMilli() - s.epoch
			}
		}
	} else {
		s.sequence = 0
	}

	if now < s.lastTime {
		return 0, fmt.Errorf("clock moved backwards, refusing to generate ID")
	}

	s.lastTime = now

	id := (now << 22) | (s.machineID << 12) | s.sequence
	return id, nil
}

// 从 ID 中解析出时间（用于调试和排查）
func (s *Snowflake) ParseTime(id int64) time.Time {
	ms := (id >> 22) + s.epoch
	return time.UnixMilli(ms)
}
```

### 跨分片查询

```go
package sharding

import (
	"context"
	"fmt"
	"sort"
	"sync"
)

type Order struct {
	ID        int64
	UserID    int64
	Total     float64
	CreatedAt time.Time
}

// 跨分片查询：并行查所有分片，合并结果
func (sr *ShardRouter) QueryAllShards(ctx context.Context, query string, args ...interface{}) ([]Order, error) {
	type shardResult struct {
		orders []Order
		err    error
	}

	results := make([]shardResult, sr.dbCount*sr.tableCount)
	var wg sync.WaitGroup

	for dbIdx := 0; dbIdx < sr.dbCount; dbIdx++ {
		for tblIdx := 0; tblIdx < sr.tableCount; tblIdx++ {
			idx := dbIdx*sr.tableCount + tblIdx
			wg.Add(1)
			go func(db *sql.DB, tableName string, i int) {
				defer wg.Done()

				fullQuery := fmt.Sprintf(query, tableName)
				rows, err := db.QueryContext(ctx, fullQuery, args...)
				if err != nil {
					results[i] = shardResult{err: err}
					return
				}
				defer rows.Close()

				var orders []Order
				for rows.Next() {
					var o Order
					if err := rows.Scan(&o.ID, &o.UserID, &o.Total, &o.CreatedAt); err != nil {
						results[i] = shardResult{err: err}
						return
					}
					orders = append(orders, o)
				}
				results[i] = shardResult{orders: orders, err: rows.Err()}
			}(sr.dbs[dbIdx], fmt.Sprintf("orders_%04d", tblIdx), idx)
		}
	}

	wg.Wait()

	// 合并结果
	var allOrders []Order
	for _, r := range results {
		if r.err != nil {
			return nil, fmt.Errorf("shard query error: %w", r.err)
		}
		allOrders = append(allOrders, r.orders...)
	}

	// 跨分片排序
	sort.Slice(allOrders, func(i, j int) bool {
		return allOrders[i].CreatedAt.After(allOrders[j].CreatedAt)
	})

	return allOrders, nil
}

// 按分片键路由的单分片查询（性能最优）
func (sr *ShardRouter) QueryByUserID(ctx context.Context, userID int64) ([]Order, error) {
	db, tableName := sr.HashRoute(userID)

	rows, err := db.QueryContext(ctx,
		fmt.Sprintf("SELECT id, user_id, total, created_at FROM %s WHERE user_id = ? ORDER BY created_at DESC", tableName),
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.Total, &o.CreatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, rows.Err()
}
```

**讲解重点：**

1. **分片键的选择决定了系统的查询能力**：分片键应选择最常用的查询条件（如 `user_id`）。按分片键查询只需访问一个分片，跨分片查询需要扇出到所有分片再合并，成本很高。所以分片前要想清楚业务的查询模式。
2. **分布式 ID 不能用自增 ID**：多个分片的自增 ID 会冲突。Snowflake 算法是最常用的方案，生成的 ID 全局唯一且趋势递增（对 B+ 树索引友好）。需要注意时钟回拨问题。
3. **分库分表是最后手段**：它带来的复杂性（路由、跨分片 JOIN、分布式事务、数据迁移）远超收益。优先考虑读写分离、索引优化、归档冷数据等方案。如果确实要分，建议使用成熟的中间件（如 ShardingSphere、Vitess）而不是自研。
