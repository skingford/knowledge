---
title: 缓存一致性与分库分表
description: Cache Aside Pattern、延迟双删、基于消息队列的最终一致性，以及分库分表路由策略、Snowflake ID、跨分片查询。
head:
  - - meta
    - name: keywords
      content: 缓存一致性,Cache Aside,延迟双删,分库分表,Snowflake,分片路由,跨分片查询
---

# 缓存一致性与分库分表

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

<GoDataCacheDiagram kind="cache-aside" />

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
		// 延迟双删通常需要在原请求结束后继续执行，因此不要直接复用可能已取消的请求 ctx。
		base := context.WithoutCancel(ctx) // Go 1.21+
		bgCtx, cancel := context.WithTimeout(base, 3*time.Second)
		defer cancel()
		if err := rdb.Del(bgCtx, key).Err(); err != nil {
			log.Printf("double delete failed for %s: %v", key, err)
		}
	}()

	return nil
}
```

<GoDataCacheDiagram kind="double-delete" />

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

<GoDataCacheDiagram kind="mq-invalidation" />

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

<GoDataCacheDiagram kind="sharding-route" />

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

<GoDataCacheDiagram kind="snowflake-id" />

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

<GoDataCacheDiagram kind="cross-shard-query" />

**讲解重点：**

1. **分片键的选择决定了系统的查询能力**：分片键应选择最常用的查询条件（如 `user_id`）。按分片键查询只需访问一个分片，跨分片查询需要扇出到所有分片再合并，成本很高。所以分片前要想清楚业务的查询模式。
2. **分布式 ID 不能用自增 ID**：多个分片的自增 ID 会冲突。Snowflake 算法是最常用的方案，生成的 ID 全局唯一且趋势递增（对 B+ 树索引友好）。需要注意时钟回拨问题。
3. **分库分表是最后手段**：它带来的复杂性（路由、跨分片 JOIN、分布式事务、数据迁移）远超收益。优先考虑读写分离、索引优化、归档冷数据等方案。如果确实要分，建议使用成熟的中间件（如 ShardingSphere、Vitess）而不是自研。
