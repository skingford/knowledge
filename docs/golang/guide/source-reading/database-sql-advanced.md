---
title: database/sql 高级事务源码精读
description: 精读 database/sql 的高级用法，掌握 Savepoint 嵌套事务、批量插入优化、Prepared Statement 缓存、RETURNING 子句与连接池调优最佳实践。
---

# database/sql 高级事务：源码精读

> 核心源码：`src/database/sql/sql.go`、`src/database/sql/convert.go`
>
> 图例参考：继续复用 [数据库与缓存](../06-database-cache.md) 的预编译语句和连接池指标图例，先抓“批量执行 / 连接轮换 / 池内排队”这条主线，再看 Savepoint 和事务封装细节。

这篇是 `database/sql` 的进阶补充页，不再重复连接池和基础扫描模型。

更适合你在下面这些问题出现时再看：

- 事务函数如何封装得更稳
- Savepoint 怎么落地
- 批量插入和 COPY 怎么选
- Prepared Statement 缓存和连接池如何配合

如果你还没建立 `database/sql` 的基础心智模型，先看：

- 基础总览：[database/sql 源码精读](./database-sql.md)

## 包结构图

<GoDataCacheDiagram kind="prepared-statement" />

```
database/sql 高级体系
══════════════════════════════════════════════════════════════════

  sql.DB（连接池管理器）
  ├── SetMaxOpenConns(n)      ← 最大打开连接数（默认无限）
  ├── SetMaxIdleConns(n)      ← 最大空闲连接数（默认 2）
  ├── SetConnMaxLifetime(d)   ← 连接最大存活时间
  ├── SetConnMaxIdleTime(d)   ← 连接最大空闲时间
  └── Stats() DBStats         ← 连接池监控指标

  sql.Tx（事务）
  ├── Exec/Query/Prepare      ← 同 DB，在事务内执行
  ├── Commit() / Rollback()  ← 提交/回滚
  └── Savepoint（SAVEPOINT）  ← 嵌套事务点（需手动 Exec）

  批量插入策略：
  ├── 逐条 INSERT           → 最慢（N 次 RTT）
  ├── 多值 INSERT           → 中等（1 次 RTT，VALUES 行数有限）
  ├── COPY（PostgreSQL）    → 最快（流式批量写入）
  └── 预编译 + 批量执行     → 平衡（减少解析开销）

  Prepared Statement 生命周期：
  DB.Prepare() → stmt.Exec()/Query() × N → stmt.Close()
  ├── 连接级缓存：语句在特定连接上编译
  ├── 自动重新 Prepare：连接轮换时透明处理
  └── 并发安全：stmt 可被多个 goroutine 复用

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/database/sql/sql.go（简化）

// BeginTx 带选项的事务开始
func (db *DB) BeginTx(ctx context.Context, opts *TxOptions) (*Tx, error) {
    // 从连接池获取连接
    // 在连接上执行 BEGIN [ISOLATION LEVEL ...]
    // 返回绑定该连接的 Tx 对象
}

// Savepoint（Go 标准库不直接支持，需手动 Exec）
// tx.ExecContext(ctx, "SAVEPOINT sp1")
// tx.ExecContext(ctx, "ROLLBACK TO SAVEPOINT sp1")
// tx.ExecContext(ctx, "RELEASE SAVEPOINT sp1")

// Stmt.ExecContext 核心：
// 1. 从池中获取持有该 stmt 的连接（或重新 Prepare）
// 2. 发送 Execute 命令
// 3. 释放连接回池
```

---

## 二、代码示例

### 事务基础：正确使用 defer

```go
import (
    "context"
    "database/sql"
    "fmt"
)

// txFunc 是一个事务辅助函数：自动 commit/rollback
func withTx(ctx context.Context, db *sql.DB, fn func(*sql.Tx) error) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }

    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p) // 重新抛出 panic
        }
    }()

    if err := fn(tx); err != nil {
        if rbErr := tx.Rollback(); rbErr != nil {
            return fmt.Errorf("tx error: %v, rollback error: %w", err, rbErr)
        }
        return err
    }

    return tx.Commit()
}

// 使用
func transferMoney(ctx context.Context, db *sql.DB, fromID, toID int64, amount float64) error {
    return withTx(ctx, db, func(tx *sql.Tx) error {
        // 扣款（SELECT FOR UPDATE 避免并发问题）
        var balance float64
        err := tx.QueryRowContext(ctx,
            "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE",
            fromID,
        ).Scan(&balance)
        if err != nil {
            return fmt.Errorf("lock account: %w", err)
        }

        if balance < amount {
            return fmt.Errorf("insufficient balance: %.2f < %.2f", balance, amount)
        }

        _, err = tx.ExecContext(ctx,
            "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
            amount, fromID,
        )
        if err != nil {
            return fmt.Errorf("deduct: %w", err)
        }

        _, err = tx.ExecContext(ctx,
            "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
            amount, toID,
        )
        if err != nil {
            return fmt.Errorf("credit: %w", err)
        }

        return nil
    })
}
```

### Savepoint：嵌套事务（PostgreSQL）

```go
// Savepoint 实现部分可回滚的事务
func processOrdersWithSavepoint(ctx context.Context, db *sql.DB, orders []Order) error {
    return withTx(ctx, db, func(tx *sql.Tx) error {
        var failed []int

        for i, order := range orders {
            sp := fmt.Sprintf("sp_%d", i)

            // 设置 Savepoint
            if _, err := tx.ExecContext(ctx, "SAVEPOINT "+sp); err != nil {
                return fmt.Errorf("savepoint: %w", err)
            }

            err := insertOrder(ctx, tx, order)
            if err != nil {
                // 回滚到 Savepoint（不影响整个事务）
                if _, rbErr := tx.ExecContext(ctx, "ROLLBACK TO SAVEPOINT "+sp); rbErr != nil {
                    return fmt.Errorf("rollback savepoint: %w", rbErr)
                }
                failed = append(failed, i)
                continue
            }

            // 释放 Savepoint（可选，清理资源）
            tx.ExecContext(ctx, "RELEASE SAVEPOINT "+sp)
        }

        if len(failed) > 0 {
            // 记录失败项，但整体事务仍然提交
            log.Printf("Failed orders: %v (will be retried)", failed)
        }

        return nil // 成功订单全部提交
    })
}

func insertOrder(ctx context.Context, tx *sql.Tx, order Order) error {
    _, err := tx.ExecContext(ctx,
        "INSERT INTO orders (user_id, product_id, amount) VALUES ($1, $2, $3)",
        order.UserID, order.ProductID, order.Amount,
    )
    return err
}
```

### 批量插入优化

```go
// 方式一：多值 INSERT（适合 < 1000 行）
func bulkInsertMultiValue(ctx context.Context, db *sql.DB, users []User) error {
    if len(users) == 0 {
        return nil
    }

    // 构建 INSERT ... VALUES ($1,$2), ($3,$4), ...
    valueStrings := make([]string, 0, len(users))
    valueArgs := make([]any, 0, len(users)*2)

    for i, user := range users {
        valueStrings = append(valueStrings,
            fmt.Sprintf("($%d, $%d)", i*2+1, i*2+2))
        valueArgs = append(valueArgs, user.Name, user.Email)
    }

    query := "INSERT INTO users (name, email) VALUES " +
        strings.Join(valueStrings, ",")

    _, err := db.ExecContext(ctx, query, valueArgs...)
    return err
}

// 方式二：Prepared Statement 批量（适合超大数据集，分批执行）
func bulkInsertPrepared(ctx context.Context, db *sql.DB, users []User) error {
    const batchSize = 500

    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // 预编译只执行一次
    stmt, err := tx.PrepareContext(ctx,
        "INSERT INTO users (name, email) VALUES ($1, $2)")
    if err != nil {
        return fmt.Errorf("prepare: %w", err)
    }
    defer stmt.Close()

    for i, user := range users {
        if _, err := stmt.ExecContext(ctx, user.Name, user.Email); err != nil {
            return fmt.Errorf("insert user[%d]: %w", i, err)
        }

        // 分批提交（避免事务过大导致锁积压）
        if (i+1)%batchSize == 0 {
            if err := tx.Commit(); err != nil {
                return err
            }
            tx, err = db.BeginTx(ctx, nil)
            if err != nil {
                return err
            }
            stmt, err = tx.PrepareContext(ctx,
                "INSERT INTO users (name, email) VALUES ($1, $2)")
            if err != nil {
                return err
            }
        }
    }

    return tx.Commit()
}

// 方式三：PostgreSQL COPY（最高性能，适合百万级数据）
func bulkInsertCopy(ctx context.Context, db *sql.DB, users []User) error {
    // 需要 pq 驱动的 CopyIn 支持
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // pq.CopyIn 生成 COPY FROM STDIN 语句
    stmt, err := tx.PrepareContext(ctx,
        pq.CopyIn("users", "name", "email"))
    if err != nil {
        return err
    }
    defer stmt.Close()

    for _, user := range users {
        if _, err := stmt.ExecContext(ctx, user.Name, user.Email); err != nil {
            return err
        }
    }

    // 发送 EOF（刷新 COPY 流）
    if _, err := stmt.ExecContext(ctx); err != nil {
        return err
    }

    return tx.Commit()
}
```

### RETURNING 子句（PostgreSQL）

```go
// INSERT ... RETURNING：插入并立即获取数据库生成的值
func createUserReturning(ctx context.Context, db *sql.DB, name, email string) (*User, error) {
    user := &User{}
    err := db.QueryRowContext(ctx,
        `INSERT INTO users (name, email, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id, name, email, created_at`,
        name, email,
    ).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
    if err != nil {
        return nil, fmt.Errorf("create user: %w", err)
    }
    return user, nil
}

// UPDATE ... RETURNING：更新并返回更新后的行
func updateAndReturn(ctx context.Context, db *sql.DB, id int64, newName string) (*User, error) {
    user := &User{}
    err := db.QueryRowContext(ctx,
        `UPDATE users SET name = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, name, email, updated_at`,
        newName, id,
    ).Scan(&user.ID, &user.Name, &user.Email, &user.UpdatedAt)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, fmt.Errorf("user %d not found", id)
    }
    return user, err
}

// UPSERT（INSERT ON CONFLICT DO UPDATE）
func upsertUser(ctx context.Context, db *sql.DB, user User) (int64, error) {
    var id int64
    err := db.QueryRowContext(ctx,
        `INSERT INTO users (email, name)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               updated_at = NOW()
         RETURNING id`,
        user.Email, user.Name,
    ).Scan(&id)
    return id, err
}
```

### Prepared Statement 缓存与复用

```go
// 全局 Prepared Statement 缓存（服务启动时初始化）
type StmtCache struct {
    db    *sql.DB
    stmts map[string]*sql.Stmt
    mu    sync.RWMutex
}

func NewStmtCache(db *sql.DB) *StmtCache {
    return &StmtCache{
        db:    db,
        stmts: make(map[string]*sql.Stmt),
    }
}

func (c *StmtCache) Prepare(ctx context.Context, name, query string) error {
    stmt, err := c.db.PrepareContext(ctx, query)
    if err != nil {
        return fmt.Errorf("prepare %s: %w", name, err)
    }
    c.mu.Lock()
    c.stmts[name] = stmt
    c.mu.Unlock()
    return nil
}

func (c *StmtCache) Get(name string) (*sql.Stmt, bool) {
    c.mu.RLock()
    stmt, ok := c.stmts[name]
    c.mu.RUnlock()
    return stmt, ok
}

func (c *StmtCache) Close() {
    c.mu.Lock()
    for _, stmt := range c.stmts {
        stmt.Close()
    }
    c.mu.Unlock()
}

// 初始化常用语句
func initStatements(ctx context.Context, cache *StmtCache) error {
    stmts := map[string]string{
        "getUserByID":    "SELECT id, name, email FROM users WHERE id = $1",
        "getUserByEmail": "SELECT id, name, email FROM users WHERE email = $1",
        "updateUserName": "UPDATE users SET name = $1 WHERE id = $2",
        "deleteUser":     "DELETE FROM users WHERE id = $1",
    }
    for name, query := range stmts {
        if err := cache.Prepare(ctx, name, query); err != nil {
            return err
        }
    }
    return nil
}

// 高并发使用
func getUser(ctx context.Context, cache *StmtCache, id int64) (*User, error) {
    stmt, ok := cache.Get("getUserByID")
    if !ok {
        return nil, errors.New("stmt not found")
    }

    user := &User{}
    err := stmt.QueryRowContext(ctx, id).Scan(&user.ID, &user.Name, &user.Email)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, nil
    }
    return user, err
}
```

### 连接池调优与监控

<GoDataCacheDiagram kind="sql-pool-stats" />

```go
func configurePool(db *sql.DB) {
    // 最大打开连接数（= 数据库 max_connections × 0.8）
    db.SetMaxOpenConns(80)

    // 最大空闲连接（≤ MaxOpenConns，避免频繁创建/销毁）
    db.SetMaxIdleConns(20)

    // 连接最大存活时间（避免使用过期连接）
    db.SetConnMaxLifetime(30 * time.Minute)

    // 连接最大空闲时间（释放长期空闲连接）
    db.SetConnMaxIdleTime(5 * time.Minute)
}

// 连接池监控（Prometheus 指标上报）
func monitorPool(db *sql.DB, dbName string) {
    go func() {
        ticker := time.NewTicker(15 * time.Second)
        for range ticker.C {
            stats := db.Stats()
            dbOpenConns.WithLabelValues(dbName).Set(float64(stats.OpenConnections))
            dbIdleConns.WithLabelValues(dbName).Set(float64(stats.Idle))
            dbInUseConns.WithLabelValues(dbName).Set(float64(stats.InUse))
            dbWaitCount.WithLabelValues(dbName).Set(float64(stats.WaitCount))
            dbWaitDuration.WithLabelValues(dbName).Set(stats.WaitDuration.Seconds())
        }
    }()
}

// db.Stats() 字段说明：
// OpenConnections: 当前打开连接总数（InUse + Idle）
// InUse:          正在执行查询的连接数
// Idle:           空闲连接数
// WaitCount:      等待连接的请求总数
// WaitDuration:   等待连接的总时间（WaitCount × 平均等待时间）
// MaxIdleClosed:  因超过 MaxIdle 而关闭的连接数
// MaxLifetimeClosed: 因超过 MaxLifetime 而关闭的连接数
```

### 行扫描辅助（避免样板代码）

```go
// 泛型行扫描（Go 1.18+）
func scanRows[T any](rows *sql.Rows, scan func(*sql.Rows) (T, error)) ([]T, error) {
    defer rows.Close()

    var result []T
    for rows.Next() {
        item, err := scan(rows)
        if err != nil {
            return nil, err
        }
        result = append(result, item)
    }
    return result, rows.Err()
}

// 使用
func listUsers(ctx context.Context, db *sql.DB) ([]User, error) {
    rows, err := db.QueryContext(ctx,
        "SELECT id, name, email FROM users WHERE deleted_at IS NULL")
    if err != nil {
        return nil, err
    }

    return scanRows(rows, func(r *sql.Rows) (User, error) {
        var u User
        return u, r.Scan(&u.ID, &u.Name, &u.Email)
    })
}

// NULL 值处理（使用 sql.Null* 类型）
type UserProfile struct {
    ID       int64
    Name     string
    Bio      sql.NullString  // 可能为 NULL
    Avatar   sql.NullString  // 可能为 NULL
    LoginAt  sql.NullTime    // 可能为 NULL
}

func scanProfile(row *sql.Row, p *UserProfile) error {
    return row.Scan(&p.ID, &p.Name, &p.Bio, &p.Avatar, &p.LoginAt)
}

// 安全访问 NullString
func bioOrDefault(bio sql.NullString, def string) string {
    if bio.Valid {
        return bio.String
    }
    return def
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `sql.DB` 是连接还是连接池？ | `sql.DB` 是连接池，并发安全；不要在 goroutine 间传递 `sql.Tx`（事务绑定单连接） |
| `SetMaxOpenConns` 设为多少合适？ | 一般 = PostgreSQL `max_connections × 0.7~0.8`；太小导致 WaitDuration 升高；太大超过数据库上限报错 |
| 为什么 `Prepared Statement` 并发安全？ | `sql.Stmt` 内部维护多个底层连接的 statement 句柄；切换连接时透明 re-prepare；可被多个 goroutine 同时 Exec |
| `rows.Close()` 为什么要 defer？ | 不 Close 的 rows 持有连接不归还；即使遍历完 `rows.Next()` 返回 false，也必须调用 Close 以触发连接归还 |
| Savepoint 和嵌套事务的区别？ | SQL 标准没有嵌套事务；Savepoint 是部分回滚点，不提交子事务；PostgreSQL/MySQL/SQLite 均支持 SAVEPOINT |
| 批量插入最优策略？ | 行数 < 100：多值 VALUES；行数 100~10000：事务 + Prepared Statement 分批；行数 > 10000：PostgreSQL COPY 协议（pgx driver） |
