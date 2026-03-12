---
title: go-redis 客户端源码精读
description: 精读 go-redis/v9 的 Redis 客户端实现，掌握连接池调优、Pipeline/事务、发布订阅、分布式锁、缓存模式与生产级 Redis 集成最佳实践。
---

# go-redis：Redis 客户端源码精读

> 核心包：`github.com/redis/go-redis/v9`

## 包结构图

```
go-redis v9 体系
══════════════════════════════════════════════════════════════════

  客户端类型：
  ├── redis.NewClient()        ← 单节点
  ├── redis.NewClusterClient() ← Redis Cluster（自动分片）
  ├── redis.NewSentinelClient()← Sentinel（自动主从切换）
  └── redis.NewRing()          ← 一致性哈希分片（客户端分片）

  连接池参数（UniversalOptions）：
  ├── PoolSize     = GOMAXPROCS × 10（默认）
  ├── MinIdleConns = 保持最小空闲连接
  ├── MaxIdleConns = 最大空闲连接数
  ├── PoolTimeout  = 等待连接超时
  └── ConnMaxLifetime / ConnMaxIdleTime

  核心操作模式：
  ├── 单命令：SET/GET/INCR/EXPIRE 等
  ├── Pipeline：批量命令（减少网络往返）
  ├── TxPipeline：Pipeline + MULTI/EXEC（原子批量）
  ├── Watch + TxPipeline：乐观锁（CAS 模式）
  └── PubSub：发布订阅

══════════════════════════════════════════════════════════════════
```

---

## 一、核心示例

```go
import (
    "context"
    "github.com/redis/go-redis/v9"
)

// 创建客户端（生产配置）
func newRedisClient() *redis.Client {
    return redis.NewClient(&redis.Options{
        Addr:     "localhost:6379",
        Password: "",
        DB:       0,

        // 连接池
        PoolSize:        10 * runtime.GOMAXPROCS(0),
        MinIdleConns:    5,
        MaxIdleConns:    10,
        ConnMaxLifetime: 30 * time.Minute,
        ConnMaxIdleTime: 5 * time.Minute,
        PoolTimeout:     4 * time.Second,

        // 超时
        DialTimeout:  5 * time.Second,
        ReadTimeout:  3 * time.Second,
        WriteTimeout: 3 * time.Second,
    })
}
```

---

## 二、代码示例

### 基础操作与错误处理

```go
func basicOps(ctx context.Context, rdb *redis.Client) {
    // SET with TTL
    err := rdb.Set(ctx, "user:1:name", "Alice", 10*time.Minute).Err()
    if err != nil {
        log.Fatal(err)
    }

    // GET（区分 key 不存在和真实错误）
    val, err := rdb.Get(ctx, "user:1:name").Result()
    if errors.Is(err, redis.Nil) {
        fmt.Println("key 不存在")
    } else if err != nil {
        log.Fatal("redis error:", err)
    } else {
        fmt.Println("name:", val)
    }

    // 原子计数器
    rdb.Incr(ctx, "page:views")
    views, _ := rdb.IncrBy(ctx, "page:views", 100).Result()
    fmt.Println("views:", views)

    // Hash 操作（存储结构化数据）
    rdb.HSet(ctx, "user:1", map[string]interface{}{
        "name":  "Alice",
        "email": "alice@example.com",
        "age":   30,
    })
    user := rdb.HGetAll(ctx, "user:1").Val()
    fmt.Println("user:", user)

    // Set（去重集合）
    rdb.SAdd(ctx, "online:users", "user:1", "user:2", "user:3")
    count, _ := rdb.SCard(ctx, "online:users").Result()
    fmt.Println("online:", count)

    // Sorted Set（排行榜）
    rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 1500, Member: "alice"})
    rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 2000, Member: "bob"})
    top3, _ := rdb.ZRevRangeWithScores(ctx, "leaderboard", 0, 2).Result()
    fmt.Println("top3:", top3)
}
```

### Pipeline：减少网络往返

```go
// Pipeline：批量发送多个命令，一次网络往返（非原子）
func pipelineExample(ctx context.Context, rdb *redis.Client, userIDs []int64) ([]string, error) {
    pipe := rdb.Pipeline()

    cmds := make([]*redis.StringCmd, len(userIDs))
    for i, id := range userIDs {
        cmds[i] = pipe.Get(ctx, fmt.Sprintf("user:%d:name", id))
    }

    // 一次网络往返执行所有命令
    _, err := pipe.Exec(ctx)
    if err != nil && !errors.Is(err, redis.Nil) {
        return nil, err
    }

    names := make([]string, len(userIDs))
    for i, cmd := range cmds {
        val, err := cmd.Result()
        if errors.Is(err, redis.Nil) {
            names[i] = "unknown"
        } else if err != nil {
            names[i] = "error"
        } else {
            names[i] = val
        }
    }
    return names, nil
}

// Pipelined：更简洁的写法
func pipelinedExample(ctx context.Context, rdb *redis.Client) error {
    _, err := rdb.Pipelined(ctx, func(pipe redis.Pipeliner) error {
        pipe.Set(ctx, "key1", "val1", time.Hour)
        pipe.Set(ctx, "key2", "val2", time.Hour)
        pipe.Set(ctx, "key3", "val3", time.Hour)
        return nil
    })
    return err
}
```

### 分布式锁（Redlock 简化版）

```go
// 基于 Redis SET NX PX 的简单分布式锁
type RedisLock struct {
    client  *redis.Client
    key     string
    value   string // 唯一值，防止误删他人的锁
    ttl     time.Duration
}

func NewRedisLock(client *redis.Client, key string, ttl time.Duration) *RedisLock {
    return &RedisLock{
        client: client,
        key:    "lock:" + key,
        value:  uuid.New().String(), // 每次加锁唯一值
        ttl:    ttl,
    }
}

// TryLock：尝试加锁（非阻塞）
func (l *RedisLock) TryLock(ctx context.Context) (bool, error) {
    // SET key value NX PX ttl（原子操作）
    ok, err := l.client.SetNX(ctx, l.key, l.value, l.ttl).Result()
    return ok, err
}

// Lock：带重试的加锁（阻塞）
func (l *RedisLock) Lock(ctx context.Context) error {
    for {
        ok, err := l.TryLock(ctx)
        if err != nil {
            return err
        }
        if ok {
            return nil
        }
        select {
        case <-ctx.Done():
            return fmt.Errorf("lock timeout: %w", ctx.Err())
        case <-time.After(50 * time.Millisecond):
            // 等待重试
        }
    }
}

// Unlock：安全解锁（Lua 脚本保证原子性：检查 value 再删除）
var unlockScript = redis.NewScript(`
    if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
    else
        return 0
    end
`)

func (l *RedisLock) Unlock(ctx context.Context) error {
    return unlockScript.Run(ctx, l.client, []string{l.key}, l.value).Err()
}

// 使用
func doWithLock(ctx context.Context, rdb *redis.Client) error {
    lock := NewRedisLock(rdb, "order:process", 30*time.Second)

    lockCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    if err := lock.Lock(lockCtx); err != nil {
        return fmt.Errorf("acquire lock: %w", err)
    }
    defer lock.Unlock(ctx)

    // 临界区：安全执行，不会有并发
    return processOrder(ctx)
}
```

### Watch + TxPipeline（乐观锁）

```go
// 场景：库存扣减（CAS 模式：先读，CAS 写，冲突重试）
func decreaseStock(ctx context.Context, rdb *redis.Client, productID string, qty int) error {
    key := "stock:" + productID

    // 最多重试 3 次（乐观并发冲突）
    for attempt := 0; attempt < 3; attempt++ {
        err := rdb.Watch(ctx, func(tx *redis.Tx) error {
            // 读取当前库存（Watch 监视 key）
            stock, err := tx.Get(ctx, key).Int()
            if errors.Is(err, redis.Nil) {
                return fmt.Errorf("product not found")
            }
            if err != nil {
                return err
            }
            if stock < qty {
                return fmt.Errorf("insufficient stock: %d < %d", stock, qty)
            }

            // 在 MULTI/EXEC 中原子更新（若 key 被修改则 EXEC 失败）
            _, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
                pipe.DecrBy(ctx, key, int64(qty))
                return nil
            })
            return err
        }, key) // 监视的 key

        if err == nil {
            return nil // 成功
        }
        if errors.Is(err, redis.TxFailedErr) {
            continue // 乐观锁冲突，重试
        }
        return err // 其他错误，不重试
    }
    return fmt.Errorf("too many conflicts, please retry")
}
```

### 发布订阅（Pub/Sub）

```go
// 发布消息
func publishEvent(ctx context.Context, rdb *redis.Client, channel, msg string) error {
    return rdb.Publish(ctx, channel, msg).Err()
}

// 订阅消息（持久运行）
func subscribeEvents(ctx context.Context, rdb *redis.Client, channels ...string) {
    sub := rdb.Subscribe(ctx, channels...)
    defer sub.Close()

    ch := sub.Channel() // 接收消息的 Go channel

    for {
        select {
        case msg, ok := <-ch:
            if !ok {
                return // 订阅关闭
            }
            fmt.Printf("channel=%s payload=%s\n", msg.Channel, msg.Payload)
            // 处理消息
            handleEvent(msg.Channel, msg.Payload)

        case <-ctx.Done():
            return
        }
    }
}

// 带重连的订阅（生产推荐）
func robustSubscribe(ctx context.Context, rdb *redis.Client, channel string, handler func(string)) {
    for {
        if err := doSubscribe(ctx, rdb, channel, handler); err != nil {
            if ctx.Err() != nil {
                return
            }
            log.Printf("Subscribe error (reconnecting): %v", err)
            time.Sleep(5 * time.Second)
        }
    }
}

func doSubscribe(ctx context.Context, rdb *redis.Client, channel string, handler func(string)) error {
    sub := rdb.Subscribe(ctx, channel)
    defer sub.Close()

    // 确认订阅成功
    if _, err := sub.Receive(ctx); err != nil {
        return err
    }

    for msg := range sub.Channel() {
        handler(msg.Payload)
    }
    return nil
}
```

### 缓存模式（Cache-Aside + 防缓存击穿）

```go
// Cache-Aside + singleflight 防缓存击穿
type UserCache struct {
    rdb   *redis.Client
    db    *sql.DB
    group singleflight.Group
}

func (c *UserCache) GetUser(ctx context.Context, userID int64) (*User, error) {
    key := fmt.Sprintf("user:%d", userID)

    // 1. 读缓存
    data, err := c.rdb.Get(ctx, key).Bytes()
    if err == nil {
        var user User
        json.Unmarshal(data, &user)
        return &user, nil
    }
    if !errors.Is(err, redis.Nil) {
        return nil, err // Redis 真实错误
    }

    // 2. 缓存未命中：singleflight 防止并发击穿
    val, err, _ := c.group.Do(key, func() (interface{}, error) {
        // 查数据库
        user, err := queryUserFromDB(ctx, c.db, userID)
        if err != nil {
            return nil, err
        }

        // 写缓存（设置随机 TTL 防雪崩：5~10 分钟）
        ttl := 5*time.Minute + time.Duration(rand.Int63n(int64(5*time.Minute)))
        data, _ := json.Marshal(user)
        c.rdb.Set(ctx, key, data, ttl)

        return user, nil
    })

    if err != nil {
        return nil, err
    }
    return val.(*User), nil
}

// 缓存穿透防护：空值缓存（查询不存在的 key）
func (c *UserCache) GetUserWithNullCache(ctx context.Context, userID int64) (*User, error) {
    key := fmt.Sprintf("user:%d", userID)
    nullKey := "null:" + key

    // 检查空值缓存（防止频繁查询不存在的数据）
    if exists, _ := c.rdb.Exists(ctx, nullKey).Result(); exists > 0 {
        return nil, nil // 已知不存在
    }

    data, err := c.rdb.Get(ctx, key).Bytes()
    if err == nil {
        var user User
        json.Unmarshal(data, &user)
        return &user, nil
    }

    user, err := queryUserFromDB(ctx, c.db, userID)
    if err != nil {
        return nil, err
    }
    if user == nil {
        // 缓存空值（短 TTL 防止长期占用）
        c.rdb.Set(ctx, nullKey, "1", 1*time.Minute)
        return nil, nil
    }

    data, _ = json.Marshal(user)
    c.rdb.Set(ctx, key, data, 10*time.Minute)
    return user, nil
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Pipeline 和 TxPipeline 的区别？ | Pipeline：批量命令一次往返，非原子（中途失败不回滚）；TxPipeline：MULTI/EXEC 包裹，所有命令原子执行；Watch 监视 key 被改则 EXEC 失败（乐观锁） |
| 分布式锁 Unlock 为什么用 Lua 脚本？ | 需要"先检查 value 再删除"两步原子执行；若不用 Lua：A 的锁超时→B 获取锁→A 执行 DEL 删了 B 的锁；Lua 确保 GET + DEL 原子 |
| 缓存击穿、穿透、雪崩的区别和解法？ | 击穿：热点 key 过期大量请求打 DB → singleflight/互斥锁；穿透：查不存在的 key → 空值缓存/布隆过滤器；雪崩：大量 key 同时过期 → 随机 TTL |
| `Watch` 失败返回 `TxFailedErr` 时如何处理？ | 说明 Watch 监视的 key 在 MULTI/EXEC 之间被修改（乐观锁冲突）；应重新读取数据重试；重试次数要有上限 |
| go-redis v9 vs v8 的主要变化？ | v9 所有方法第一个参数必须是 `context.Context`（v8 某些方法可选）；更严格的 ctx 传播；`redis.Nil` 错误判断方式不变 |
| Redis Cluster 客户端和单节点的代码差异？ | `redis.NewClusterClient` 替代 `NewClient`；Cluster 自动计算 key 的 slot 并路由到正确节点；Pipeline 在 Cluster 中按 slot 分组批量发送 |
