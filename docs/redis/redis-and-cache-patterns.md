---
title: Redis 实践与缓存穿透/击穿/雪崩
description: 聚焦 go-redis 客户端实践、Pipeline、Pub/Sub，以及缓存穿透、击穿、雪崩的解决方案。
head:
  - - meta
    - name: keywords
      content: Go Redis,go-redis,Pipeline,缓存穿透,缓存击穿,缓存雪崩,singleflight,布隆过滤器
---

# Redis 实践与缓存穿透/击穿/雪崩

## Redis 在 Go 中的实践

`go-redis`（`github.com/redis/go-redis/v9`）是 Go 中最主流的 Redis 客户端。它支持连接池、Pipeline、Pub/Sub、Lua 脚本等功能，API 设计符合 Go 的惯用风格。

### 基础操作

::: details 点击展开基础操作示例

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

:::

<GoDataCacheDiagram kind="redis-client-types" />

### Pipeline 批量操作

::: details 点击展开 Pipeline 示例

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

:::

<GoDataCacheDiagram kind="redis-pipeline" />

### Pub/Sub 发布订阅

::: details 点击展开 Pub/Sub 示例

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

:::

<GoDataCacheDiagram kind="redis-pubsub" />

**讲解重点：**

1. **Pipeline 大幅减少延迟**：10 个独立命令意味着 10 次网络往返，Pipeline 合并成 1 次往返。批量读取、批量写入场景务必使用 Pipeline。
2. **区分 `redis.Nil` 和其他错误**：`redis.Nil` 表示 key 不存在，这是正常业务情况，不应当作错误处理。其他错误（网络超时、连接断开等）才需要告警。
3. **连接池参数要匹配业务并发**：`PoolSize` 默认为 `runtime.GOMAXPROCS * 10`，高并发场景需要根据 QPS 和命令耗时来计算。`MinIdleConns` 可以避免冷启动时的连接建立延迟。

---

## 缓存穿透、击穿、雪崩

这三个问题是使用缓存时最常见的异常场景，面试高频考点，也是生产环境中必须防范的问题。

### 缓存穿透

**定义**：查询一个数据库中根本不存在的数据，每次请求都直接打到数据库，缓存形同虚设。

**典型场景**：恶意请求大量不存在的 ID。

::: details 点击展开缓存穿透示例

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

:::

<GoDataCacheDiagram kind="cache-penetration" />

布隆过滤器在缓存穿透里的价值，不是“替代缓存”，而是**在回源数据库之前先做一次极便宜的存在性判断**：

- 如果判定“不存在”，那就一定不存在，可以直接拦截请求
- 如果判定“可能存在”，再继续走缓存和数据库查询链路
- 代价是会有少量假阳性，但不会出现假阴性

<GoDataCacheDiagram kind="cache-penetration-bloom" />

再往工程化一点看，缓存穿透通常不是非此即彼，而是**先用空值缓存兜住普通 miss，再按无效流量规模决定是否前置布隆过滤器**：

<GoDataCacheDiagram kind="cache-penetration-compare" />

### 缓存击穿

**定义**：某个热点 key 过期的瞬间，大量并发请求同时打到数据库。

**典型场景**：首页热门商品的缓存突然过期。

::: details 点击展开缓存击穿示例

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

:::

<GoDataCacheDiagram kind="cache-breakdown" />

### 缓存雪崩

**定义**：大量 key 在同一时间过期，或 Redis 整体不可用，所有请求涌向数据库。

::: details 点击展开缓存雪崩示例

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

:::

<GoDataCacheDiagram kind="cache-avalanche" />

**讲解重点：**

1. **穿透的本质是查不存在的数据**：缓存空值是最简单的方案，但要设置较短的 TTL 避免占用内存。布隆过滤器可以在请求入口提前过滤，但有一定误判率（会把不存在的判断为可能存在）。
2. **击穿用 singleflight 解决最优雅**：`singleflight.Group` 保证同一个 key 在同一时刻只有一个请求真正去查数据库，其他请求等待并共享结果。比分布式锁更轻量，适合单机场景。
3. **雪崩的预防重在分散过期时间**：TTL 加随机偏移（jitter）是最简单有效的手段。更进一步可以做多级缓存（本地缓存 + Redis + 数据库），即使 Redis 不可用也能降级。
