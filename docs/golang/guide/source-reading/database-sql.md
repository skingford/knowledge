---
title: database/sql 源码精读
description: 精读 database/sql 连接池（sql.DB）实现，理解连接生命周期、驱动接口与生产调优参数。
---

# database/sql：连接池源码精读

> 核心源码：`src/database/sql/sql.go`（约 3200 行）

## 包结构图

```
database/sql 架构分层
══════════════════════════════════════════════════════════════════

  应用层
  ├── sql.DB          ← 连接池（核心，线程安全，可复用）
  ├── sql.Tx          ← 事务（绑定单个连接）
  ├── sql.Stmt        ← 预编译语句（可跨连接复用）
  ├── sql.Rows        ← 查询结果集（持有连接直到 Close）
  └── sql.Row         ← 单行结果（Rows 的封装）

  驱动接口层（driver 包）
  ├── driver.Driver   ← Open(dsn) (*Conn, error)
  ├── driver.Conn     ← Prepare / Begin / Close
  ├── driver.Stmt     ← 预编译语句
  └── driver.Rows     ← 结果集迭代

  驱动实现层（第三方）
  ├── github.com/go-sql-driver/mysql
  ├── github.com/lib/pq（PostgreSQL）
  └── modernc.org/sqlite（SQLite，纯 Go）

══════════════════════════════════════════════════════════════════
```

---

## 一、sql.DB 连接池结构

```go
// src/database/sql/sql.go:514
type DB struct {
    connector  driver.Connector  // 创建新连接的工厂

    mu           sync.Mutex
    freeConn     []*driverConn  // 空闲连接池（按归还时间排序）
    connRequests connRequestSet  // 等待连接的请求队列
    numOpen      int            // 已开启的连接数（含使用中+空闲）

    maxIdleCount int           // 最大空闲连接数（默认 2）
    maxOpen      int           // 最大总连接数（默认 0=无限）
    maxLifetime  time.Duration // 连接最大复用时长（默认 0=永久）
    maxIdleTime  time.Duration // 连接最大空闲时长（默认 0=永久）

    openerCh  chan struct{}    // 触发创建新连接的信号
    cleanerCh chan struct{}    // 触发清理过期连接的信号
}
```

---

## 二、连接生命周期

```
连接获取流程（DB.conn）
══════════════════════════════════════════════════════════════════

  QueryContext / ExecContext / BeginTx
       │
       ▼
  db.conn(ctx, strategy)
       │
       ├─ 优先从 freeConn 取空闲连接（LIFO，最近使用的最先复用）
       │       ├── 连接超出 maxLifetime → 关闭，取下一个
       │       └── 连接有效 → 返回（O(1)，无需新建）
       │
       ├─ numOpen >= maxOpen（且 maxOpen > 0）
       │       └── 构造 connRequest 挂入等待队列
       │               → gopark() 等待被唤醒
       │               → ctx 超时 → 从队列撤出 → 返回超时错误
       │
       └─ 允许新建连接
               ├── numOpen++（先占位，防止并发超限）
               ├── 异步 connectionOpener() 调用 connector.Connect()
               └── 连接建立后注入等待队列或直接使用

  连接归还（DB.putConn）
       │
       ├─ 有等待请求 → 直接传给第一个等待者（短路复用）
       ├─ 空闲连接数 < maxIdle → 加入 freeConn
       └─ 超出 maxIdle 或超过 maxLifetime → Close()

══════════════════════════════════════════════════════════════════
```

---

## 三、driverConn：连接包装

```
┌──────────────────────────────────────────────────────────────┐
│                      driverConn                              │
│                                                              │
│  db         *DB          ← 归属的连接池                      │
│  ci         driver.Conn  ← 底层驱动连接                     │
│  createdAt  time.Time    ← 创建时间（用于 maxLifetime 检查） │
│  returnedAt time.Time    ← 最后归还时间（用于 maxIdleTime）  │
│  inUse      bool         ← 是否正在使用                     │
│  needReset  bool         ← 下次使用前需重置 session          │
│  openStmt   map[*driverStmt]bool ← 当前连接上的预编译语句   │
│  sync.Mutex              ← 保护对 ci 的调用（串行化）       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

连接归还时的检查：
├── err != nil → 可能连接坏了 → 调用 driver.ErrBadConn 检测
├── 超出 maxLifetime → 直接 Close
├── 超出 maxIdleTime → 直接 Close
└── 空闲池已满（> maxIdle）→ Close
```

---

## 四、关键参数调优

```
生产环境推荐配置
══════════════════════════════════════════════════════════════════

  db.SetMaxOpenConns(N)     // 最大总连接（含使用中+空闲）
  db.SetMaxIdleConns(N)     // 最大空闲连接（默认 2，偏小）
  db.SetConnMaxLifetime(d)  // 连接最大复用时长
  db.SetConnMaxIdleTime(d)  // 连接最大空闲时长

  推荐值（以 MySQL 为例）：
  ┌────────────────────────────────────────────────────────┐
  │  参数               推荐值            说明             │
  ├────────────────────────────────────────────────────────┤
  │  MaxOpenConns       25~100           ≤ DB 最大连接数   │
  │  MaxIdleConns       10~25            ≈ MaxOpen * 0.4   │
  │  ConnMaxLifetime    30min~1h         低于 DB wait_timeout│
  │  ConnMaxIdleTime    10~30min         防止空闲连接被服务器关│
  └────────────────────────────────────────────────────────┘

  ⚠️ 常见陷阱：
  ├── MaxIdleConns 默认 2 → 高并发时连接频繁新建/关闭
  ├── ConnMaxLifetime 未设 → DB 端超时后 Go 端仍持有死连接
  └── MaxOpenConns 未设   → 无限新建，可能打爆 DB

══════════════════════════════════════════════════════════════════
```

---

## 五、Rows 必须 Close 的原因

```
sql.Rows 持有连接直到 Close
══════════════════════════════════════════════════════

  rows, err := db.QueryContext(ctx, sql)
       │
       ▼
  rows 内部持有一个 driverConn
  （连接未归还池，numOpen 中计入）
       │
  rows.Next() 迭代...
       │
  rows.Close() / rows.Next() 返回 false
       ↓
  连接归还 freeConn（或关闭）

  ⚠️ 若忘记 Close：
  ├── 连接泄漏 → numOpen 只增不减
  ├── 最终 numOpen >= maxOpen → 所有新查询阻塞
  └── 表现：请求超时、DB 连接数满

══════════════════════════════════════════════════════
```

---

## 六、代码示例

### 初始化连接池（推荐配置）

```go
func newDB(dsn string) (*sql.DB, error) {
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, err
    }

    db.SetMaxOpenConns(50)
    db.SetMaxIdleConns(20)
    db.SetConnMaxLifetime(30 * time.Minute)
    db.SetConnMaxIdleTime(10 * time.Minute)

    // 验证连接可用
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := db.PingContext(ctx); err != nil {
        return nil, fmt.Errorf("db ping: %w", err)
    }
    return db, nil
}
```

### 查询：正确关闭 Rows

```go
func getUsers(ctx context.Context, db *sql.DB) ([]*User, error) {
    rows, err := db.QueryContext(ctx,
        "SELECT id, name, email FROM users WHERE active = ?", true)
    if err != nil {
        return nil, err
    }
    defer rows.Close() // ← 必须，确保连接归还

    var users []*User
    for rows.Next() {
        u := &User{}
        if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
            return nil, err
        }
        users = append(users, u)
    }
    // rows.Err() 检查迭代中的错误（区别于查询错误）
    return users, rows.Err()
}
```

### 事务：使用 defer 保证回滚

```go
func transfer(ctx context.Context, db *sql.DB, from, to int64, amount float64) error {
    tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
    if err != nil {
        return err
    }
    // defer 保证：提交失败时回滚，panic 时也回滚
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        }
    }()

    if _, err = tx.ExecContext(ctx,
        "UPDATE accounts SET balance = balance - ? WHERE id = ?", amount, from); err != nil {
        tx.Rollback()
        return fmt.Errorf("debit: %w", err)
    }

    if _, err = tx.ExecContext(ctx,
        "UPDATE accounts SET balance = balance + ? WHERE id = ?", amount, to); err != nil {
        tx.Rollback()
        return fmt.Errorf("credit: %w", err)
    }

    return tx.Commit()
}
```

### 预编译语句（批量操作复用）

```go
func batchInsert(ctx context.Context, db *sql.DB, users []*User) error {
    stmt, err := db.PrepareContext(ctx,
        "INSERT INTO users(name, email) VALUES(?, ?)")
    if err != nil {
        return err
    }
    defer stmt.Close() // Stmt 也占用连接资源，必须 Close

    for _, u := range users {
        if _, err := stmt.ExecContext(ctx, u.Name, u.Email); err != nil {
            return err
        }
    }
    return nil
}
```

### 连接池监控

```go
func printDBStats(db *sql.DB) {
    s := db.Stats()
    fmt.Printf("OpenConnections : %d\n", s.OpenConnections)
    fmt.Printf("InUse           : %d\n", s.InUse)
    fmt.Printf("Idle            : %d\n", s.Idle)
    fmt.Printf("WaitCount       : %d\n", s.WaitCount)      // 等待连接的请求数
    fmt.Printf("WaitDuration    : %v\n", s.WaitDuration)   // 累计等待时长
    fmt.Printf("MaxIdleClosed   : %d\n", s.MaxIdleClosed)  // 因超 maxIdle 关闭数
    fmt.Printf("MaxLifetimeClosed:%d\n", s.MaxLifetimeClosed) // 因超生命周期关闭数
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| sql.Open 会建立连接吗？ | 不会，只验证参数；第一次 Query/Ping 才真正建连 |
| MaxIdleConns 默认值？ | 2，生产环境应调大（如 MaxOpen 的 40%） |
| Rows 不 Close 会怎样？ | 连接泄漏，numOpen 递增直到请求全部阻塞 |
| Tx 绑定的是哪个连接？ | 事务开始时从池取一个连接，整个事务独占，Commit/Rollback 后归还 |
| Stmt 和普通查询区别？ | Stmt 在 DB 端预编译，重复执行省去解析开销；适合批量操作 |
| 如何检测连接池瓶颈？ | db.Stats().WaitCount 增加或 WaitDuration 高说明池不够用 |
