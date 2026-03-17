---
title: database/sql 源码精读
description: 精读 database/sql 的连接池、事务、预编译语句实现，掌握连接生命周期、扫描映射与高并发 DB 最佳实践。
---

# database/sql：数据库抽象层源码精读

> 核心源码：`src/database/sql/sql.go`、`src/database/sql/convert.go`

这篇是 `database/sql` 的基础总览页，重点讲连接池、事务边界、`Stmt`/`Rows` 生命周期和扫描转换链。

如果你已经熟悉这些基础，想看更偏生产实践的主题，可以继续看：

- 高级事务、Savepoint、批量写入、Prepared Statement 缓存：[database/sql 高级事务源码精读](./database-sql-advanced.md)

建议顺序是：

1. 先看这页，建立连接池和事务模型
2. 再看 `database-sql-advanced`，补批量写入和复杂事务策略

## 包结构图

```
database/sql 体系
══════════════════════════════════════════════════════════════════

  连接池（核心）
  DB
  ├── freeConn []*driverConn     ← 空闲连接池（LIFO 顺序）
  ├── numOpen  int               ← 当前打开的连接总数
  ├── maxOpen  int               ← 最大连接数（0=无限）
  ├── maxIdle  int               ← 最大空闲连接数（默认2）
  ├── maxLifetime time.Duration  ← 连接最大存活时间
  └── maxIdleTime time.Duration  ← 空闲连接最大存活时间

  连接获取路径：
  Query()/Exec() → db.conn(ctx) →
    ①有空闲连接 → 取出复用
    ②连接数 < maxOpen → 新建连接
    ③连接数 = maxOpen → 排队等待（connRequests map）

  核心类型：
  ├── *DB           ← 连接池（goroutine 安全，全局共享）
  ├── *Tx           ← 事务（绑定单一连接，不可跨 goroutine）
  ├── *Stmt         ← 预编译语句（每个连接有对应的 driver.Stmt）
  ├── *Rows         ← 结果集游标（Next()/Scan()）
  └── *Row          ← 单行结果（Scan 后自动关闭）

  驱动注册机制：
  sql.Register("mysql", &MySQLDriver{})  ← init() 中注册
  db := sql.Open("mysql", dsn)           ← 延迟连接（Ping 触发）

  Scan 类型转换链：
  driver.Value → convertAssign() → Go 类型
  ├── string/[]byte → string/int/float64/bool（strconv）
  ├── int64 → int/int32/int8...
  └── 实现 sql.Scanner 接口 → 自定义扫描

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/database/sql/sql.go（简化）

// 连接获取：优先复用空闲连接
func (db *DB) conn(ctx context.Context, strategy connReuseStrategy) (*driverConn, error) {
    db.mu.Lock()

    // ① 检查空闲连接
    numFree := len(db.freeConn)
    if strategy == cachedOrNewConn && numFree > 0 {
        conn := db.freeConn[0]
        copy(db.freeConn, db.freeConn[1:])
        db.freeConn = db.freeConn[:numFree-1]
        db.mu.Unlock()
        return conn, nil
    }

    // ② 可以新建连接
    if db.maxOpen == 0 || db.numOpen < db.maxOpen {
        db.numOpen++
        db.mu.Unlock()
        ci, _ := db.driver.Open(db.dsn)
        _ = ci
        return nil, nil // 简化
    }

    // ③ 连接池满，排队等待
    req := make(chan connRequest, 1)
    reqKey := db.nextRequestKeyLocked()
    db.connRequests[reqKey] = req
    db.mu.Unlock()

    select {
    case <-ctx.Done():
        db.mu.Lock()
        delete(db.connRequests, reqKey)
        db.mu.Unlock()
        return nil, ctx.Err()
    case ret := <-req:
        return ret.conn, ret.err
    }
}

// 连接归还：放回空闲池或直接转交等待者
func (db *DB) putConn(dc *driverConn, err error) {
    db.mu.Lock()
    // 有等待者则直接转交
    if len(db.connRequests) > 0 {
        for key, req := range db.connRequests {
            delete(db.connRequests, key)
            req <- connRequest{conn: dc}
            db.mu.Unlock()
            return
        }
    }
    // 放回空闲池（LIFO：最近使用的连接放最前）
    db.freeConn = append(db.freeConn, dc)
    db.mu.Unlock()
}
```

---

## 二、代码示例

### 基础查询与扫描

```go
import (
    "database/sql"
    _ "github.com/go-sql-driver/mysql" // 注册驱动（仅副作用）
)

type User struct {
    ID    int
    Name  string
    Email string
}

func getUser(db *sql.DB, id int) (*User, error) {
    var u User
    err := db.QueryRow(
        "SELECT id, name, email FROM users WHERE id = ?", id,
    ).Scan(&u.ID, &u.Name, &u.Email)

    if err == sql.ErrNoRows {
        return nil, nil // 未找到，不是错误
    }
    if err != nil {
        return nil, err
    }
    return &u, nil
}

func listUsers(db *sql.DB) ([]User, error) {
    rows, err := db.Query("SELECT id, name, email FROM users ORDER BY id")
    if err != nil {
        return nil, err
    }
    defer rows.Close() // ⚠️ 必须关闭，否则连接不归还连接池

    var users []User
    for rows.Next() {
        var u User
        if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
            return nil, err
        }
        users = append(users, u)
    }
    return users, rows.Err() // ⚠️ 检查迭代中的错误
}
```

### 连接池配置（生产最佳实践）

```go
func newDB(dsn string) (*sql.DB, error) {
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, err
    }

    db.SetMaxOpenConns(25)                  // 最大连接数
    db.SetMaxIdleConns(10)                  // 最大空闲连接（≤ MaxOpen）
    db.SetConnMaxLifetime(5 * time.Minute)  // 防止 DB 服务端主动断开
    db.SetConnMaxIdleTime(1 * time.Minute)  // 快速回收长时间空闲连接

    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    if err := db.PingContext(ctx); err != nil {
        return nil, fmt.Errorf("db ping 失败: %w", err)
    }
    return db, nil
}
```

### 事务：正确的 defer 模式

```go
func transfer(db *sql.DB, fromID, toID int, amount float64) error {
    tx, err := db.BeginTx(context.Background(), &sql.TxOptions{
        Isolation: sql.LevelSerializable,
    })
    if err != nil {
        return err
    }
    // ⚠️ 先 defer Rollback：已 Commit 后调用 Rollback 是空操作
    defer tx.Rollback()

    if _, err := tx.Exec(
        "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
        amount, fromID, amount,
    ); err != nil {
        return fmt.Errorf("扣减失败: %w", err)
    }

    if _, err := tx.Exec(
        "UPDATE accounts SET balance = balance + ? WHERE id = ?",
        amount, toID,
    ); err != nil {
        return fmt.Errorf("增加失败: %w", err)
    }

    return tx.Commit()
}
```

### 预编译语句（批量写入性能优化）

```go
func bulkInsertTx(db *sql.DB, users []User) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()

    stmt, err := tx.Prepare("INSERT INTO users(name, email) VALUES(?, ?)")
    if err != nil {
        return err
    }
    defer stmt.Close()

    for _, u := range users {
        if _, err := stmt.Exec(u.Name, u.Email); err != nil {
            return err
        }
    }
    return tx.Commit()
}
```

### 自定义 Scanner（JSON 列扫描）

```go
// 场景：MySQL JSON 列扫描为 Go struct
type JSONField[T any] struct{ Val T }

func (j *JSONField[T]) Scan(value any) error {
    if value == nil {
        return nil
    }
    b, ok := value.([]byte)
    if !ok {
        return fmt.Errorf("expected []byte, got %T", value)
    }
    return json.Unmarshal(b, &j.Val)
}

func (j JSONField[T]) Value() (driver.Value, error) {
    return json.Marshal(j.Val)
}

// 使用
type UserMeta struct {
    Tags     []string          `json:"tags"`
    Settings map[string]string `json:"settings"`
}

var meta JSONField[UserMeta]
err := db.QueryRow("SELECT meta FROM users WHERE id = ?", 1).Scan(&meta)
fmt.Println(meta.Val.Tags)
```

### 连接池监控

```go
// DB 健康检查（K8s Readiness Probe）
func healthCheck(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ctx, cancel := context.WithTimeout(r.Context(), 1*time.Second)
        defer cancel()

        if err := db.PingContext(ctx); err != nil {
            http.Error(w, "db unhealthy", http.StatusServiceUnavailable)
            return
        }
        stats := db.Stats()
        fmt.Fprintf(w, "ok open=%d idle=%d inUse=%d waitCount=%d",
            stats.OpenConnections,
            stats.Idle,
            stats.InUse,
            stats.WaitCount,
        )
    }
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `sql.Open` 会立即建立连接吗？ | 不会，仅验证参数格式；首次 `Query`/`Ping` 时才真正建立连接 |
| 为什么 `rows.Close()` 必须调用？ | Rows 持有底层连接；Close 将连接归还连接池，否则连接泄漏导致池耗尽 |
| `SetMaxOpenConns` 和 `SetMaxIdleConns` 的关系？ | MaxIdle ≤ MaxOpen；空闲连接超过 MaxIdle 时多余的被关闭；建议 MaxIdle ≈ MaxOpen/2 |
| 连接池满时 `Query` 会怎样？ | 进入 `connRequests` 等待队列；Context 超时则返回 `ctx.Err()`（DeadlineExceeded） |
| `Stmt` 在连接池中如何工作？ | Stmt 对每个实际使用的连接各维护一份 `driver.Stmt`；连接数多时内存开销成倍增加 |
| 事务 `defer tx.Rollback()` 为什么安全？ | 已 Commit 的事务调用 Rollback 返回 `sql.ErrTxDone`（可忽略），相当于空操作 |
