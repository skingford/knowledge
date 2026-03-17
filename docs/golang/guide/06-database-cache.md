---
title: 数据库与缓存
description: Go 数据库与缓存专题，收纳 database/sql 与连接池这类 Go 集成能力，并关联 MySQL 与 Redis 实践。
search: false
---

# 数据库与缓存

## Go 与数据库集成

与 Go 强绑定的数据库访问能力保留在本专题，例如 `database/sql` 的连接池配置、`Rows` 生命周期、资源释放和监控方式。

| 主题 | 链接 |
| --- | --- |
| database/sql 与连接池 | [查看](./06-database-sql-and-connection.md) |
| database/sql：连接池与事务（源码精读） | [查看](./source-reading/database-sql.md) |

## MySQL 部分

MySQL 本体相关内容仍然在独立的 [MySQL 专题](/mysql/) 中维护，涵盖以下主题：

| 主题 | 链接 |
| --- | --- |
| 事务处理 | [查看](/mysql/transaction-and-optimization) |
| SQL 优化 | [查看](/mysql/sql-optimization) |
| ORM 使用经验（GORM） | [查看](/mysql/orm-gorm) |
| B+ 树索引与最左前缀 | [查看](/mysql/index-design) |
| 大事务拆分 | [查看](/mysql/transaction-and-optimization#大事务拆分) |
| 死锁检测与回滚重试 | [查看](/mysql/deadlock-and-retry) |
| 热点账户更新 | [查看](/mysql/hot-account-update) |
| 分库分表与迁移 | [查看](/mysql/sharding-and-migration) |

---

## 快速导航

- [6. Redis 在 Go 中的实践](#_6-redis-在-go-中的实践)
- [7. 缓存穿透、击穿、雪崩](#_7-缓存穿透、击穿、雪崩)
- [8. 缓存一致性](#_8-缓存一致性)
- [9. 分库分表后的处理方式](#_9-分库分表后的处理方式)

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
