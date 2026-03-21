---
title: pgx PostgreSQL 驱动源码精读
description: 精读 jackc/pgx 的 PostgreSQL 原生驱动实现，掌握连接池管理、批量操作、监听/通知、CopyFrom 高性能写入与生产级 PostgreSQL 最佳实践。
---

# pgx：PostgreSQL 原生驱动源码精读

> 核心包：`github.com/jackc/pgx/v5`、`github.com/jackc/pgx/v5/pgxpool`
>
> 图例参考：这里补了 pgx 原生能力图，把连接池、`Batch`、`CopyFrom` 和 `LISTEN/NOTIFY` 放到一张图里，先抓住它和 `database/sql` 的关注点差异，再回头看源码细节。

## 包结构图

<GoDataCacheDiagram kind="pgx-driver-flow" />

```
pgx v5 体系
══════════════════════════════════════════════════════════════════

  pgx vs database/sql：
  ┌──────────────────┬────────────────────────────────────────┐
  │ 特性              │ pgx v5                                 │
  ├──────────────────┼────────────────────────────────────────┤
  │ 连接池            │ pgxpool（专为 pgx 设计，自带健康检查）  │
  │ 批量操作          │ pgx.Batch（单次往返多条语句）            │
  │ COPY 协议         │ pgx.CopyFrom（最快批量写入）            │
  │ LISTEN/NOTIFY    │ pgx.WaitForNotification（PostgreSQL 事件）│
  │ 大对象            │ pgx.LargeObjects                      │
  │ 自定义类型        │ pgtype（直接映射 PostgreSQL 类型）      │
  │ 游标              │ pgx.Rows.CommandTag                   │
  └──────────────────┴────────────────────────────────────────┘

  pgxpool 连接池生命周期：
  New → Acquire → [查询/事务] → Release → 归还池
  ├── MaxConns：最大连接数
  ├── MinConns：保持最小连接（预热）
  ├── MaxConnLifetime：连接最大存活时间
  ├── MaxConnIdleTime：连接最大空闲时间
  └── HealthCheckPeriod：空闲连接健康检查间隔

══════════════════════════════════════════════════════════════════
```

---

## 一、核心示例

```go
// pgx v5 直接使用（不经过 database/sql）
import (
    "context"
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

// pgxpool：推荐生产使用（并发安全，自动重连）
func newPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
    cfg, err := pgxpool.ParseConfig(dsn)
    if err != nil {
        return nil, err
    }

    cfg.MaxConns = 30
    cfg.MinConns = 5
    cfg.MaxConnLifetime = 30 * time.Minute
    cfg.MaxConnIdleTime = 5 * time.Minute
    cfg.HealthCheckPeriod = 1 * time.Minute

    // 连接初始化钩子（设置 search_path、时区等）
    cfg.AfterConnect = func(ctx context.Context, c *pgx.Conn) error {
        _, err := c.Exec(ctx, "SET search_path TO public, app")
        return err
    }

    return pgxpool.NewWithConfig(ctx, cfg)
}
```

---

## 二、代码示例

### 基础查询与结果扫描

```go
// 查询单行
func getUser(ctx context.Context, pool *pgxpool.Pool, id int64) (*User, error) {
    // pgx.CollectOneRow：类型安全扫描（Go 1.18+ 泛型）
    row, err := pool.QueryRow(ctx,
        "SELECT id, name, email, created_at FROM users WHERE id = $1", id)
    if err != nil {
        return nil, err
    }

    // pgx v5 推荐：pgx.RowToStructByName（按字段名映射）
    user, err := pgx.RowToStructByName[User](row)
    if errors.Is(err, pgx.ErrNoRows) {
        return nil, nil
    }
    return &user, err
}

// 查询多行（使用 pgx.CollectRows）
func listUsers(ctx context.Context, pool *pgxpool.Pool, limit int) ([]User, error) {
    rows, err := pool.Query(ctx,
        "SELECT id, name, email FROM users ORDER BY id LIMIT $1", limit)
    if err != nil {
        return nil, err
    }
    // pgx.CollectRows：自动 rows.Close() 和错误处理
    return pgx.CollectRows(rows, pgx.RowToStructByName[User])
}

// User 结构体（字段名需与列名匹配，或用 db 标签）
type User struct {
    ID        int64     `db:"id"`
    Name      string    `db:"name"`
    Email     string    `db:"email"`
    CreatedAt time.Time `db:"created_at"`
}
```

### pgx.Batch：单次往返执行多条语句

```go
// 场景：创建用户同时插入审计日志（2 条 INSERT，1 次网络往返）
func createUserWithAudit(ctx context.Context, pool *pgxpool.Pool, user User) (int64, error) {
    batch := &pgx.Batch{}

    // 批量添加语句
    batch.Queue(
        "INSERT INTO users(name, email) VALUES($1, $2) RETURNING id",
        user.Name, user.Email,
    )
    batch.Queue(
        "INSERT INTO audit_log(action, table_name, created_at) VALUES($1, $2, NOW())",
        "INSERT", "users",
    )

    // 发送批量请求（单次网络往返）
    results := pool.SendBatch(ctx, batch)
    defer results.Close()

    // 按顺序读取结果
    var userID int64
    if err := results.QueryRow().Scan(&userID); err != nil {
        return 0, fmt.Errorf("insert user: %w", err)
    }
    if _, err := results.Exec(); err != nil {
        return 0, fmt.Errorf("insert audit: %w", err)
    }

    return userID, nil
}

// 批量更新（100 条 UPDATE，1 次往返）
func batchUpdateStatus(ctx context.Context, pool *pgxpool.Pool, ids []int64, status string) error {
    batch := &pgx.Batch{}
    for _, id := range ids {
        batch.Queue("UPDATE orders SET status=$1 WHERE id=$2", status, id)
    }

    results := pool.SendBatch(ctx, batch)
    defer results.Close()

    for range ids {
        if _, err := results.Exec(); err != nil {
            return err
        }
    }
    return nil
}
```

### CopyFrom：超高性能批量写入

```go
// CopyFrom 使用 PostgreSQL COPY 协议（最快写入方式）
// 性能：通常比 INSERT 快 5-10x

func bulkInsertUsers(ctx context.Context, pool *pgxpool.Pool, users []User) error {
    rows := make([][]interface{}, len(users))
    for i, u := range users {
        rows[i] = []interface{}{u.Name, u.Email, time.Now()}
    }

    // CopyFrom 使用 COPY FROM STDIN 协议
    copyCount, err := pool.CopyFrom(
        ctx,
        pgx.Identifier{"users"},              // 表名
        []string{"name", "email", "created_at"}, // 列名
        pgx.CopyFromRows(rows),                // 数据源
    )
    if err != nil {
        return fmt.Errorf("copy: %w", err)
    }
    log.Printf("Inserted %d rows", copyCount)
    return nil
}

// 自定义 CopyFromSource（流式读取，避免全量加载内存）
type UserCopySource struct {
    users  []User
    pos    int
    err    error
}

func (s *UserCopySource) Next() bool {
    s.pos++
    return s.pos <= len(s.users)
}

func (s *UserCopySource) Values() ([]any, error) {
    u := s.users[s.pos-1]
    return []any{u.Name, u.Email, time.Now()}, nil
}

func (s *UserCopySource) Err() error { return s.err }

func streamInsert(ctx context.Context, pool *pgxpool.Pool, users []User) error {
    _, err := pool.CopyFrom(ctx,
        pgx.Identifier{"users"},
        []string{"name", "email", "created_at"},
        &UserCopySource{users: users},
    )
    return err
}
```

### LISTEN / NOTIFY（PostgreSQL 事件推送）

```go
// PostgreSQL LISTEN/NOTIFY：类似轻量级消息队列
// 适合：缓存失效通知、实时事件、跨进程通信

// 发布事件（任意 SQL 客户端）
func publishEvent(ctx context.Context, pool *pgxpool.Pool, channel, payload string) error {
    _, err := pool.Exec(ctx,
        "SELECT pg_notify($1, $2)", channel, payload)
    return err
}

// 监听事件（需要专用连接，不能用连接池）
func listenForEvents(ctx context.Context, dsn string, channel string, handler func(string)) error {
    conn, err := pgx.Connect(ctx, dsn)
    if err != nil {
        return err
    }
    defer conn.Close(ctx)

    _, err = conn.Exec(ctx, "LISTEN "+channel)
    if err != nil {
        return err
    }

    log.Printf("Listening on channel: %s", channel)

    for {
        // 阻塞等待通知（可被 ctx 取消）
        notification, err := conn.WaitForNotification(ctx)
        if err != nil {
            if ctx.Err() != nil {
                return nil // 正常关闭
            }
            return fmt.Errorf("wait notification: %w", err)
        }
        handler(notification.Payload)
    }
}

// 实际使用：缓存失效
func setupCacheInvalidation(ctx context.Context, dsn string, cache Cache) {
    go func() {
        for {
            err := listenForEvents(ctx, dsn, "cache_invalidate",
                func(payload string) {
                    // payload = "users:123"
                    cache.Delete(payload)
                    log.Printf("Cache invalidated: %s", payload)
                },
            )
            if err != nil && ctx.Err() == nil {
                log.Printf("LISTEN error (reconnecting): %v", err)
                time.Sleep(5 * time.Second)
            } else {
                return
            }
        }
    }()
}
```

### 事务与 Savepoint

```go
// pgx 事务（类型安全，无需 defer rollback 样板）
func transferWithTx(ctx context.Context, pool *pgxpool.Pool, from, to, amount int64) error {
    return pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
        // BeginFunc：自动 commit/rollback（类似 withTx 辅助函数）

        // 锁定账户（FOR UPDATE）
        var balance int64
        err := tx.QueryRow(ctx,
            "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE", from,
        ).Scan(&balance)
        if err != nil {
            return fmt.Errorf("lock account: %w", err)
        }
        if balance < amount {
            return fmt.Errorf("insufficient balance")
        }

        _, err = tx.Exec(ctx,
            "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
        if err != nil {
            return err
        }

        _, err = tx.Exec(ctx,
            "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
        return err
    })
}

// Savepoint（pgx 原生支持）
func processWithSavepoint(ctx context.Context, pool *pgxpool.Pool) error {
    return pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
        for i := 0; i < 10; i++ {
            // pgx 的 Savepoint/RollbackToSavepoint 是类型安全的
            sp, err := tx.Begin(ctx) // 创建 Savepoint（子事务）
            if err != nil {
                return err
            }

            if err := insertItem(ctx, sp, i); err != nil {
                sp.Rollback(ctx) // 回滚到 Savepoint
                log.Printf("item %d failed, skipped", i)
                continue
            }
            sp.Commit(ctx) // 提交 Savepoint
        }
        return nil
    })
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| pgx 相比 `database/sql` + `lib/pq` 的优势？ | 更好的 PostgreSQL 类型支持（数组/JSONB/自定义类型）；CopyFrom 协议支持；LISTEN/NOTIFY；pgx.Batch 减少往返；更完善的错误信息（PostgreSQL 错误码） |
| `pgxpool` 和 `database/sql` 连接池的区别？ | pgxpool 专为 pgx 设计：AfterConnect 钩子（每个连接初始化）；健康检查发现并替换死连接；MaxConnLifetime/MinConns 控制更精细 |
| `CopyFrom` 为什么比 `INSERT` 快？ | 使用 PostgreSQL COPY 二进制协议（非标准 SQL）；绕过查询解析/规划；批量传输数据减少往返；无需每行一个事务提交 |
| `pgx.Batch` 和循环 `Exec` 的区别？ | `Batch` 将多条语句打包成一个网络请求（单次往返）；循环 `Exec` 每条语句一次往返；高延迟网络下 Batch 性能提升显著 |
| LISTEN/NOTIFY 和 Redis Pub/Sub 的区别？ | PostgreSQL LISTEN/NOTIFY 与数据库事务一致（NOTIFY 在事务提交后才发出）；无持久化（接收者下线会丢消息）；适合轻量通知；Redis Pub/Sub 吞吐更高 |
| `pgx.CollectRows` 和手动 `rows.Close()` 的区别？ | `CollectRows` 自动处理 Close、错误传播和 `rows.Err()` 检查；手动处理容易漏掉 `rows.Err()`；推荐优先用 `CollectRows` |
