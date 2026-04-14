---
title: database/sql 与连接池
description: Go 标准库 database/sql 的核心用法、Prepared Statements、连接池参数配置与监控，以 MySQL 驱动为例说明生产实践。
search: false
---

# database/sql 与连接池

这篇现在归到 Go 专题，而不是 MySQL 专题。原因很简单：`database/sql` 是 Go 标准库，连接池、`Rows` 生命周期、`Stmt` 复用、`Stats()` 监控这些核心心智模型，本质上是 Go 工程能力，不是 MySQL 方言能力。

文中的示例仍然用 MySQL 驱动（`github.com/go-sql-driver/mysql`）说明，因为这是最常见的生产组合，但大部分结论同样适用于其他关系型数据库驱动。

## 1. 基础用法：Open、Query、Exec、Scan

::: details 点击展开代码：1. 基础用法：Open、Query、Exec、Scan
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
	if err := rows.Err(); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("total users: %d\n", len(users))
}
```
:::

<GoDataCacheDiagram kind="dbsql-lifecycle" />

## 2. Prepared Statements

::: details 点击展开代码：2. Prepared Statements
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
:::

<GoDataCacheDiagram kind="prepared-statement" />

**讲解重点：**

1. **`sql.Open` 不建立连接**：它只是初始化连接池对象，真正的连接在第一次使用时建立。调用 `db.Ping()` 可以提前验证连接可用性。
2. **`rows.Close()` 必须调用**：`Query` 返回的 `Rows` 对象持有数据库连接，不关闭会导致连接泄漏，最终耗尽连接池。推荐用 `defer rows.Close()` 紧跟在错误检查之后。
3. **参数化查询防 SQL 注入**：永远使用占位符传参，不要拼接字符串。`Prepare` 适合同一条 SQL 反复执行的场景，单次执行直接用 `db.Query/Exec` 即可。

---

## 3. database/sql 连接池

`database/sql` 内置了连接池管理，但默认配置往往不适合生产环境。合理设置连接池参数能避免连接泄漏、排队和超时等问题。

### 连接池参数配置

::: details 点击展开代码：连接池参数配置
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
	db.SetMaxOpenConns(100)

	// 最大空闲连接数：连接池中保持的空闲连接数
	db.SetMaxIdleConns(25)

	// 连接最大存活时间：建议比服务端 wait_timeout 更短
	db.SetConnMaxLifetime(5 * time.Minute)

	// 空闲连接最大存活时间（Go 1.15+）
	db.SetConnMaxIdleTime(3 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	return db
}
```
:::

### 连接池监控

::: details 点击展开代码：连接池监控
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
			if stats.WaitCount > 0 {
				log.Printf("WARNING: connections are waiting, consider increasing MaxOpenConns")
			}
		}
	}
}

func dbStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats := db.Stats()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"max_open":             stats.MaxOpenConnections,
			"open":                 stats.OpenConnections,
			"in_use":               stats.InUse,
			"idle":                 stats.Idle,
			"wait_count":           stats.WaitCount,
			"wait_duration_ms":     stats.WaitDuration.Milliseconds(),
			"max_idle_closed":      stats.MaxIdleClosed,
			"max_lifetime_closed":  stats.MaxLifetimeClosed,
		})
	}
}
```
:::

<GoDataCacheDiagram kind="sql-pool-stats" />

**讲解重点：**

1. **MaxOpenConns 是硬上限**：超过后新请求会阻塞等待可用连接。`db.Stats().WaitCount > 0` 说明出现了排队，需要关注。
2. **ConnMaxLifetime 必须设置**：如果不设置，连接可能在数据库端超时被关闭，但 Go 侧还以为连接可用，最终触发 `broken pipe` 或 `invalid connection`。
3. **监控 Stats 是排查问题的关键**：`InUse` 持续高位说明查询慢或连接未释放；`WaitCount` 增长说明并发超过连接池容量。

## 继续阅读

- [数据库与缓存](./06-database-cache.md)
- [database/sql：连接池与事务（源码精读）](./source-reading/database-sql.md)
- [database/sql：高级事务与批量插入（源码精读）](./source-reading/database-sql-advanced.md)
- [事务处理](/mysql/transaction-and-optimization)
- [SQL 优化](/mysql/sql-optimization)
- [ORM 使用经验（GORM）](/mysql/orm-gorm)
