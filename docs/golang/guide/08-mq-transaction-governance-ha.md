---
title: 消息队列、事务、治理与高可用
description: Go 分布式系统进阶专题，涵盖 Kafka、Saga、Outbox、服务治理和高可用设计。
search: false
---

# 微服务与分布式：消息队列、事务、治理与高可用

[返回总览](./08-microservices-distributed)

## 快速导航

- [9. 消息队列](#_9-消息队列)
- [10. 分布式事务](#_10-分布式事务)
- [11. 服务治理](#_11-服务治理)
- [12. 高可用设计](#_12-高可用设计)

## 9. 消息队列

消息队列实现服务间的异步通信和解耦，是分布式系统的核心基础设施。

### 9.1 Kafka 生产者模式

```go
package mq

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "time"

    "github.com/segmentio/kafka-go"
)

// KafkaProducer Kafka 生产者
type KafkaProducer struct {
    writer *kafka.Writer
}

func NewKafkaProducer(brokers []string, topic string) *KafkaProducer {
    writer := &kafka.Writer{
        Addr:         kafka.TCP(brokers...),
        Topic:        topic,
        Balancer:     &kafka.LeastBytes{}, // 负载均衡策略
        BatchSize:    100,                 // 批量发送
        BatchTimeout: 10 * time.Millisecond,
        RequiredAcks: kafka.RequireAll,    // 所有副本确认（最高可靠性）
        Async:        false,               // 同步写入
    }

    return &KafkaProducer{writer: writer}
}

// OrderEvent 订单事件
type OrderEvent struct {
    EventID   string    `json:"event_id"`
    OrderID   string    `json:"order_id"`
    UserID    string    `json:"user_id"`
    Action    string    `json:"action"` // created, paid, shipped
    Amount    float64   `json:"amount"`
    Timestamp time.Time `json:"timestamp"`
}

// Publish 发布消息
func (p *KafkaProducer) Publish(ctx context.Context, event OrderEvent) error {
    data, err := json.Marshal(event)
    if err != nil {
        return fmt.Errorf("marshal event: %w", err)
    }

    msg := kafka.Message{
        // Key 保证同一订单的消息发到同一分区（保序）
        Key:   []byte(event.OrderID),
        Value: data,
        Headers: []kafka.Header{
            {Key: "event_type", Value: []byte(event.Action)},
        },
    }

    if err := p.writer.WriteMessages(ctx, msg); err != nil {
        return fmt.Errorf("write message: %w", err)
    }

    log.Printf("published event: %s for order: %s", event.Action, event.OrderID)
    return nil
}

func (p *KafkaProducer) Close() error {
    return p.writer.Close()
}
```

<GoMicroserviceDiagram kind="kafka-producer" />

### 9.2 Kafka 消费者模式

```go
package mq

import (
    "context"
    "encoding/json"
    "errors"
    "log"
    "time"

    "github.com/segmentio/kafka-go"
)

// KafkaConsumer Kafka 消费者
type KafkaConsumer struct {
    reader *kafka.Reader
}

func NewKafkaConsumer(brokers []string, topic, groupID string) *KafkaConsumer {
    reader := kafka.NewReader(kafka.ReaderConfig{
        Brokers:        brokers,
        Topic:          topic,
        GroupID:        groupID,           // 消费者组
        MinBytes:       10e3,              // 10KB
        MaxBytes:       10e6,              // 10MB
        MaxWait:        1 * time.Second,
        CommitInterval: 1 * time.Second,   // 自动提交间隔
        StartOffset:    kafka.LastOffset,  // 从最新开始
    })

    return &KafkaConsumer{reader: reader}
}

// MessageHandler 消息处理函数
type MessageHandler func(ctx context.Context, event OrderEvent) error

// Consume 消费消息（at-least-once 语义）
func (c *KafkaConsumer) Consume(ctx context.Context, handler MessageHandler) error {
    for {
        // 读取消息
        msg, err := c.reader.ReadMessage(ctx)
        if err != nil {
            if errors.Is(err, context.Canceled) {
                return nil
            }
            log.Printf("read message error: %v", err)
            continue
        }

        // 反序列化
        var event OrderEvent
        if err := json.Unmarshal(msg.Value, &event); err != nil {
            log.Printf("unmarshal error (offset=%d): %v", msg.Offset, err)
            continue // 跳过无法解析的消息，避免阻塞
        }

        // 处理消息
        if err := handler(ctx, event); err != nil {
            log.Printf("handle event error (eventID=%s): %v", event.EventID, err)
            // at-least-once：处理失败不提交 offset，下次会重新消费
            // 实际生产中应结合死信队列和重试次数限制
            continue
        }

        log.Printf("processed event: %s offset: %d", event.EventID, msg.Offset)
    }
}

func (c *KafkaConsumer) Close() error {
    return c.reader.Close()
}
```

<GoMicroserviceDiagram kind="kafka-consumer" />

### 9.3 使用示例

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    brokers := []string{"localhost:9092"}
    topic := "order-events"

    // 生产者
    producer := NewKafkaProducer(brokers, topic)
    defer producer.Close()

    event := OrderEvent{
        EventID:   "evt_001",
        OrderID:   "ord_123",
        UserID:    "user_456",
        Action:    "created",
        Amount:    299.99,
        Timestamp: time.Now(),
    }
    producer.Publish(ctx, event)

    // 消费者
    consumer := NewKafkaConsumer(brokers, topic, "order-processor")
    defer consumer.Close()

    // 消费处理
    consumer.Consume(ctx, func(ctx context.Context, event OrderEvent) error {
        log.Printf("Processing order %s: action=%s, amount=%.2f",
            event.OrderID, event.Action, event.Amount)

        switch event.Action {
        case "created":
            return notifyWarehouse(ctx, event)
        case "paid":
            return updateInventory(ctx, event)
        default:
            return nil
        }
    })
}
```

### 讲解重点

- **分区与消息顺序**：Kafka 只保证分区内有序。用 Message Key（如订单 ID）将同一实体的消息路由到同一分区，确保该实体的事件按序处理。
- **at-least-once 语义**：消费者先处理再提交 offset，可能重复消费（处理成功但提交失败时）。因此消费端必须做幂等处理（结合第 7 节）。
- **死信队列**：对于多次处理失败的消息，应转入死信队列（DLQ）人工介入，避免毒消息（Poison Message）无限阻塞消费进度。

---

## 10. 分布式事务

分布式事务解决跨服务数据一致性问题，核心思路是放弃强一致性，追求最终一致性。

### 10.1 Saga 模式

```go
package saga

import (
    "context"
    "fmt"
    "log"
)

// Step Saga 中的每一步
type Step struct {
    Name       string
    Action     func(ctx context.Context) error // 正向操作
    Compensate func(ctx context.Context) error // 补偿操作（回滚）
}

// Saga 编排器
type Saga struct {
    steps []Step
}

func NewSaga() *Saga {
    return &Saga{}
}

func (s *Saga) AddStep(step Step) *Saga {
    s.steps = append(s.steps, step)
    return s
}

// Execute 按顺序执行所有步骤，失败时反向补偿
func (s *Saga) Execute(ctx context.Context) error {
    executed := make([]int, 0, len(s.steps))

    for i, step := range s.steps {
        log.Printf("[Saga] executing step %d: %s", i, step.Name)

        if err := step.Action(ctx); err != nil {
            log.Printf("[Saga] step %d failed: %v, starting compensation", i, err)
            // 反向补偿已执行的步骤
            s.compensate(ctx, executed)
            return fmt.Errorf("saga failed at step '%s': %w", step.Name, err)
        }

        executed = append(executed, i)
    }

    log.Println("[Saga] all steps completed successfully")
    return nil
}

// compensate 反向补偿
func (s *Saga) compensate(ctx context.Context, executed []int) {
    // 从最后一个已执行步骤开始反向补偿
    for i := len(executed) - 1; i >= 0; i-- {
        stepIdx := executed[i]
        step := s.steps[stepIdx]

        log.Printf("[Saga] compensating step %d: %s", stepIdx, step.Name)

        if err := step.Compensate(ctx); err != nil {
            // 补偿失败需要告警 + 人工介入
            log.Printf("[Saga] CRITICAL: compensation failed for step '%s': %v", step.Name, err)
        }
    }
}
```

### 10.2 Saga 使用示例（订单流程）

```go
func CreateOrderSaga(ctx context.Context, order Order) error {
    saga := NewSaga()

    // 步骤1：创建订单
    saga.AddStep(Step{
        Name: "CreateOrder",
        Action: func(ctx context.Context) error {
            return orderService.Create(ctx, order)
        },
        Compensate: func(ctx context.Context) error {
            return orderService.Cancel(ctx, order.ID)
        },
    })

    // 步骤2：扣减库存
    saga.AddStep(Step{
        Name: "DeductInventory",
        Action: func(ctx context.Context) error {
            return inventoryService.Deduct(ctx, order.Items)
        },
        Compensate: func(ctx context.Context) error {
            return inventoryService.Restore(ctx, order.Items)
        },
    })

    // 步骤3：扣减余额
    saga.AddStep(Step{
        Name: "DeductBalance",
        Action: func(ctx context.Context) error {
            return paymentService.Deduct(ctx, order.UserID, order.TotalAmount)
        },
        Compensate: func(ctx context.Context) error {
            return paymentService.Refund(ctx, order.UserID, order.TotalAmount)
        },
    })

    // 步骤4：发送通知
    saga.AddStep(Step{
        Name: "SendNotification",
        Action: func(ctx context.Context) error {
            return notificationService.Send(ctx, order.UserID, "Order created")
        },
        Compensate: func(ctx context.Context) error {
            return nil // 通知不需要补偿
        },
    })

    return saga.Execute(ctx)
}
```

<GoMicroserviceDiagram kind="saga-compensation" />

### 10.3 基于消息的最终一致性

```go
package transaction

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "time"
)

// OutboxMessage 事务消息表（Outbox Pattern）
type OutboxMessage struct {
    ID        int64
    Topic     string
    Key       string
    Payload   []byte
    Status    string // pending, published
    CreatedAt time.Time
}

// TransactionalOutbox 事务性发件箱
type TransactionalOutbox struct {
    db *sql.DB
}

/*
 建表 SQL:
 CREATE TABLE outbox_messages (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     topic VARCHAR(128) NOT NULL,
     msg_key VARCHAR(128),
     payload BLOB NOT NULL,
     status VARCHAR(16) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_status (status)
 );
*/

// ExecuteWithOutbox 在同一个数据库事务中完成业务操作和消息写入
func (o *TransactionalOutbox) ExecuteWithOutbox(
    ctx context.Context,
    bizFn func(tx *sql.Tx) error,
    topic, key string,
    payload interface{},
) error {
    tx, err := o.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // 执行业务逻辑
    if err := bizFn(tx); err != nil {
        return fmt.Errorf("business logic: %w", err)
    }

    // 写入 outbox 表（同一个事务）
    data, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("marshal payload: %w", err)
    }

    _, err = tx.ExecContext(ctx,
        `INSERT INTO outbox_messages (topic, msg_key, payload) VALUES (?, ?, ?)`,
        topic, key, data,
    )
    if err != nil {
        return fmt.Errorf("insert outbox: %w", err)
    }

    return tx.Commit()
}

// PublishPendingMessages 定时轮询发布待发送消息
func (o *TransactionalOutbox) PublishPendingMessages(ctx context.Context, publisher MessagePublisher) {
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            o.publishBatch(ctx, publisher)
        }
    }
}

func (o *TransactionalOutbox) publishBatch(ctx context.Context, publisher MessagePublisher) {
    rows, err := o.db.QueryContext(ctx,
        `SELECT id, topic, msg_key, payload FROM outbox_messages
         WHERE status = 'pending' ORDER BY id LIMIT 100`)
    if err != nil {
        log.Printf("query outbox: %v", err)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var msg OutboxMessage
        if err := rows.Scan(&msg.ID, &msg.Topic, &msg.Key, &msg.Payload); err != nil {
            continue
        }

        if err := publisher.Publish(ctx, msg.Topic, msg.Key, msg.Payload); err != nil {
            log.Printf("publish message %d failed: %v", msg.ID, err)
            continue
        }

        // 标记已发布
        o.db.ExecContext(ctx,
            `UPDATE outbox_messages SET status = 'published' WHERE id = ?`, msg.ID)
    }
}

type MessagePublisher interface {
    Publish(ctx context.Context, topic, key string, payload []byte) error
}
```

<GoMicroserviceDiagram kind="outbox-pattern" />

### 讲解重点

- **Saga 的两种编排方式**：编排式（Orchestration，有中央协调者）和协作式（Choreography，事件驱动无中心）。上面实现的是编排式，适合流程清晰的场景。
- **补偿操作必须幂等**：补偿可能被重复执行（如补偿过程中系统崩溃后重试），因此每个 Compensate 函数本身也要做幂等处理。
- **Outbox 模式解决"写库+发消息"原子性**：业务数据和消息在同一个数据库事务中写入，再由后台任务异步发布消息到 MQ，保证不会出现"写库成功但消息丢失"。

---

## 11. 服务治理

服务治理涵盖服务的全生命周期管理，包括负载均衡、健康检查、优雅启停和流量管理。

### 11.1 自定义负载均衡

```go
package lb

import (
    "math/rand"
    "sync"
    "sync/atomic"
)

// Balancer 负载均衡器接口
type Balancer interface {
    Pick(endpoints []string) string
}

// RoundRobin 轮询
type RoundRobin struct {
    counter atomic.Uint64
}

func (rr *RoundRobin) Pick(endpoints []string) string {
    if len(endpoints) == 0 {
        return ""
    }
    idx := rr.counter.Add(1) - 1
    return endpoints[idx%uint64(len(endpoints))]
}

// WeightedRoundRobin 加权轮询
type WeightedEndpoint struct {
    Addr   string
    Weight int
}

type WeightedRoundRobin struct {
    mu       sync.Mutex
    current  int
    gcd      int
    maxW     int
    endpoints []WeightedEndpoint
}

func NewWeightedRoundRobin(endpoints []WeightedEndpoint) *WeightedRoundRobin {
    wrr := &WeightedRoundRobin{
        endpoints: endpoints,
        current:   -1,
    }

    // 计算权重的最大公约数
    wrr.gcd = endpoints[0].Weight
    wrr.maxW = endpoints[0].Weight
    for _, ep := range endpoints[1:] {
        wrr.gcd = gcd(wrr.gcd, ep.Weight)
        if ep.Weight > wrr.maxW {
            wrr.maxW = ep.Weight
        }
    }
    return wrr
}

func gcd(a, b int) int {
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

// RandomBalancer 随机
type RandomBalancer struct{}

func (r *RandomBalancer) Pick(endpoints []string) string {
    if len(endpoints) == 0 {
        return ""
    }
    return endpoints[rand.Intn(len(endpoints))]
}
```

<GoMicroserviceDiagram kind="load-balancing" />

### 11.2 健康检查

```go
package health

import (
    "context"
    "encoding/json"
    "net/http"
    "sync"
    "time"
)

type Status string

const (
    StatusUp   Status = "UP"
    StatusDown Status = "DOWN"
)

// Checker 健康检查接口
type Checker interface {
    Name() string
    Check(ctx context.Context) error
}

// HealthEndpoint 健康检查端点
type HealthEndpoint struct {
    mu       sync.RWMutex
    checkers []Checker
}

func NewHealthEndpoint() *HealthEndpoint {
    return &HealthEndpoint{}
}

func (h *HealthEndpoint) Register(checker Checker) {
    h.mu.Lock()
    defer h.mu.Unlock()
    h.checkers = append(h.checkers, checker)
}

type HealthResponse struct {
    Status  Status                    `json:"status"`
    Details map[string]ComponentHealth `json:"details"`
}

type ComponentHealth struct {
    Status  Status `json:"status"`
    Message string `json:"message,omitempty"`
}

func (h *HealthEndpoint) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    h.mu.RLock()
    checkers := h.checkers
    h.mu.RUnlock()

    resp := HealthResponse{
        Status:  StatusUp,
        Details: make(map[string]ComponentHealth),
    }

    for _, checker := range checkers {
        err := checker.Check(ctx)
        if err != nil {
            resp.Status = StatusDown
            resp.Details[checker.Name()] = ComponentHealth{
                Status:  StatusDown,
                Message: err.Error(),
            }
        } else {
            resp.Details[checker.Name()] = ComponentHealth{Status: StatusUp}
        }
    }

    w.Header().Set("Content-Type", "application/json")
    if resp.Status == StatusDown {
        w.WriteHeader(http.StatusServiceUnavailable)
    }
    json.NewEncoder(w).Encode(resp)
}

// 示例：数据库健康检查
type DBChecker struct {
    db interface{ PingContext(ctx context.Context) error }
}

func (c *DBChecker) Name() string { return "database" }
func (c *DBChecker) Check(ctx context.Context) error {
    return c.db.PingContext(ctx)
}

// 示例：Redis 健康检查
type RedisChecker struct {
    rdb interface{ Ping(ctx context.Context) error }
}

func (c *RedisChecker) Name() string { return "redis" }
func (c *RedisChecker) Check(ctx context.Context) error {
    return c.rdb.Ping(ctx)
}
```

<GoMicroserviceDiagram kind="health-check" />

### 11.3 优雅启停

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type Application struct {
    httpServer *http.Server
    grpcServer interface{ GracefulStop() }

    // 启动和关闭的钩子
    onStart []func(ctx context.Context) error
    onStop  []func(ctx context.Context) error
}

func (app *Application) RegisterOnStart(fn func(ctx context.Context) error) {
    app.onStart = append(app.onStart, fn)
}

func (app *Application) RegisterOnStop(fn func(ctx context.Context) error) {
    app.onStop = append(app.onStop, fn)
}

func (app *Application) Run() error {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // ========== 启动阶段 ==========

    // 执行启动钩子（注册服务、预热缓存等）
    for _, fn := range app.onStart {
        if err := fn(ctx); err != nil {
            return err
        }
    }

    // 启动 HTTP 服务器
    go func() {
        log.Println("HTTP server starting on :8080")
        if err := app.httpServer.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("HTTP server error: %v", err)
        }
    }()

    // ========== 等待退出信号 ==========

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    sig := <-quit
    log.Printf("received signal: %v, shutting down...", sig)

    // ========== 优雅关闭 ==========

    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer shutdownCancel()

    var wg sync.WaitGroup

    // 1. 先从注册中心注销（停止接收新流量）
    // 2. 等待一段时间让负载均衡器感知（给上游时间）
    time.Sleep(5 * time.Second)

    // 3. 停止 HTTP 服务器（等待正在处理的请求完成）
    wg.Add(1)
    go func() {
        defer wg.Done()
        if err := app.httpServer.Shutdown(shutdownCtx); err != nil {
            log.Printf("HTTP shutdown error: %v", err)
        }
        log.Println("HTTP server stopped")
    }()

    // 4. 停止 gRPC 服务器
    wg.Add(1)
    go func() {
        defer wg.Done()
        if app.grpcServer != nil {
            app.grpcServer.GracefulStop()
        }
        log.Println("gRPC server stopped")
    }()

    wg.Wait()

    // 5. 执行关闭钩子（关闭数据库连接、刷新缓冲区等）
    for _, fn := range app.onStop {
        if err := fn(shutdownCtx); err != nil {
            log.Printf("stop hook error: %v", err)
        }
    }

    log.Println("application stopped gracefully")
    return nil
}
```

<GoMicroserviceDiagram kind="graceful-shutdown" />

### 讲解重点

- **优雅关闭的顺序很重要**：先从注册中心注销 -> 等待流量切走 -> 停止接收新请求 -> 等待处理中的请求完成 -> 关闭资源连接。顺序反了会导致请求失败。
- **健康检查分层**：Liveness（存活检查，进程是否活着）和 Readiness（就绪检查，是否能处理请求）要分开。K8s 据此决定重启还是暂停流量。
- **负载均衡策略选择**：轮询适合实例性能均等；加权轮询适合混合部署；一致性哈希适合有状态场景（如缓存亲和性）。

---

## 12. 高可用设计

高可用设计的目标是让系统在部分组件故障时仍能正常提供服务。

### 12.1 冗余与故障转移

```go
package ha

import (
    "context"
    "errors"
    "log"
    "sync"
    "time"
)

// MultiEndpointClient 多节点客户端，支持自动故障转移
type MultiEndpointClient struct {
    mu        sync.RWMutex
    endpoints []Endpoint
    primary   int
}

type Endpoint struct {
    Addr    string
    Healthy bool
    Weight  int
    Zone    string // 可用区
}

func NewMultiEndpointClient(endpoints []Endpoint) *MultiEndpointClient {
    return &MultiEndpointClient{
        endpoints: endpoints,
        primary:   0,
    }
}

// Execute 带故障转移的执行
func (c *MultiEndpointClient) Execute(ctx context.Context, fn func(addr string) error) error {
    c.mu.RLock()
    endpoints := make([]Endpoint, len(c.endpoints))
    copy(endpoints, c.endpoints)
    primary := c.primary
    c.mu.RUnlock()

    // 先尝试主节点
    if endpoints[primary].Healthy {
        if err := fn(endpoints[primary].Addr); err == nil {
            return nil
        }
        // 主节点失败，标记不健康
        c.markUnhealthy(primary)
    }

    // 尝试其他节点（故障转移）
    for i, ep := range endpoints {
        if i == primary || !ep.Healthy {
            continue
        }

        log.Printf("failover: trying %s (zone: %s)", ep.Addr, ep.Zone)

        if err := fn(ep.Addr); err == nil {
            c.mu.Lock()
            c.primary = i // 切换主节点
            c.mu.Unlock()
            return nil
        }

        c.markUnhealthy(i)
    }

    return errors.New("all endpoints unavailable")
}

func (c *MultiEndpointClient) markUnhealthy(idx int) {
    c.mu.Lock()
    c.endpoints[idx].Healthy = false
    c.mu.Unlock()
}

// HealthProbe 后台健康探测，恢复不健康的节点
func (c *MultiEndpointClient) HealthProbe(ctx context.Context, probe func(addr string) error) {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            c.mu.Lock()
            for i := range c.endpoints {
                if !c.endpoints[i].Healthy {
                    if err := probe(c.endpoints[i].Addr); err == nil {
                        log.Printf("endpoint recovered: %s", c.endpoints[i].Addr)
                        c.endpoints[i].Healthy = true
                    }
                }
            }
            c.mu.Unlock()
        }
    }
}
```

### 12.2 多可用区部署策略

```go
package ha

import (
    "math/rand"
    "sort"
)

// ZoneAwareBalancer 可用区感知的负载均衡
type ZoneAwareBalancer struct {
    localZone string
}

func NewZoneAwareBalancer(localZone string) *ZoneAwareBalancer {
    return &ZoneAwareBalancer{localZone: localZone}
}

// Pick 优先选择本区节点，本区不可用时跨区
func (b *ZoneAwareBalancer) Pick(endpoints []Endpoint) *Endpoint {
    healthy := make([]Endpoint, 0)
    for _, ep := range endpoints {
        if ep.Healthy {
            healthy = append(healthy, ep)
        }
    }

    if len(healthy) == 0 {
        return nil
    }

    // 优先选择本可用区的节点
    var localEps, remoteEps []Endpoint
    for _, ep := range healthy {
        if ep.Zone == b.localZone {
            localEps = append(localEps, ep)
        } else {
            remoteEps = append(remoteEps, ep)
        }
    }

    // 本区有可用节点则随机选择
    if len(localEps) > 0 {
        ep := localEps[rand.Intn(len(localEps))]
        return &ep
    }

    // 本区无可用节点，跨区访问
    if len(remoteEps) > 0 {
        ep := remoteEps[rand.Intn(len(remoteEps))]
        return &ep
    }

    return nil
}
```

<GoMicroserviceDiagram kind="zone-failover" />

### 12.3 高可用设计清单

```go
package ha

/*
高可用架构设计清单（代码之外的关键实践）

1. 冗余设计
   - 服务至少 2 个实例，跨可用区部署
   - 数据库主从复制，Redis Sentinel/Cluster
   - 负载均衡器本身也要冗余（DNS 多 A 记录 / 双活 LB）

2. 故障隔离
   - 核心链路与非核心链路隔离（不同集群/连接池）
   - 按租户或业务线隔离资源（Bulkhead 舱壁模式）
   - 数据库读写分离，读请求走从库

3. 容错机制
   - 超时：每个 RPC/HTTP 调用都要设置超时
   - 重试：参考第 8 节，带退避和重试预算
   - 熔断：参考第 6 节，快速失败保护上游
   - 降级：核心功能不可降级，非核心功能可降级
   - 限流：入口限流 + 下游限流双重保护

4. 可观测性
   - 日志：结构化日志 + 请求 ID 关联
   - 指标：QPS、延迟（P99）、错误率、饱和度
   - 追踪：参考第 5 节，全链路追踪
   - 告警：基于 SLO（如 99.9% 可用性）触发告警

5. 容灾策略
   - 定期演练故障场景（Chaos Engineering）
   - 数据定期备份 + 恢复演练
   - 多活架构：同城双活 > 两地三中心 > 异地多活
   - Runbook：常见故障的标准处理流程

6. 发布安全
   - 灰度发布 / 金丝雀发布
   - 快速回滚能力（版本 < 5 分钟回滚）
   - Feature Flag 控制新功能灰度范围
*/
```

### 12.4 Bulkhead 舱壁隔离模式

```go
package ha

import (
    "context"
    "errors"
    "time"
)

var ErrBulkheadFull = errors.New("bulkhead: max concurrent requests reached")

// Bulkhead 舱壁隔离器，限制对某个下游的并发调用数
type Bulkhead struct {
    sem     chan struct{}
    timeout time.Duration
}

func NewBulkhead(maxConcurrent int, timeout time.Duration) *Bulkhead {
    return &Bulkhead{
        sem:     make(chan struct{}, maxConcurrent),
        timeout: timeout,
    }
}

func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
    // 尝试获取信号量
    select {
    case b.sem <- struct{}{}:
        defer func() { <-b.sem }()
        return fn()
    case <-time.After(b.timeout):
        return ErrBulkheadFull
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

### 使用示例

```go
func main() {
    // 对支付服务的调用限制并发 20
    paymentBulkhead := NewBulkhead(20, 2*time.Second)

    // 对推荐服务的调用限制并发 50
    recommendBulkhead := NewBulkhead(50, 1*time.Second)

    // 支付服务故障时，不会影响推荐服务的调用
    err := paymentBulkhead.Execute(ctx, func() error {
        return callPaymentService(ctx, order)
    })
    if errors.Is(err, ErrBulkheadFull) {
        log.Println("payment service overloaded, try later")
    }
}
```

<GoMicroserviceDiagram kind="bulkhead-isolation" />

### 讲解重点

- **冗余是高可用的基础**：没有冗余就没有高可用。但冗余不只是"多部署几个实例"，还要跨故障域（机架、可用区、地域）分布。
- **舱壁隔离防止级联故障**：为每个下游服务分配独立的资源池（连接数、goroutine 数），某个下游慢或挂掉时不会把调用方的全部资源耗尽。
- **故障演练比设计更重要**：再好的高可用设计，不经过实际演练都是纸上谈兵。Netflix 的 Chaos Monkey 就是这一理念的实践，定期随机杀进程来验证容错能力。
