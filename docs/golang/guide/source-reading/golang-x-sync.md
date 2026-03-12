---
title: golang.org/x/sync 源码精读
description: 精读 Go 准标准库 x/sync 的 errgroup、singleflight、semaphore 实现，掌握并发错误处理、防重复请求与并发限流最佳实践。
---

# golang.org/x/sync：并发工具包源码精读

> 核心源码：`golang.org/x/sync/errgroup`、`singleflight`、`semaphore`

## 包结构图

```
golang.org/x/sync 体系
══════════════════════════════════════════════════════════════════

  errgroup.Group（并发任务 + 错误聚合）
  ├── Go(func() error)        ← 启动一个并发任务
  ├── Wait() error            ← 等待所有任务，返回第一个错误
  ├── WithContext(ctx)        ← 任意一个任务出错自动 cancel ctx
  └── SetLimit(n)             ← 限制并发数（Go 1.21+）

  singleflight.Group（防重复请求，Cache Stampede 防护）
  ├── Do(key, fn)             ← 相同 key 并发时只执行一次 fn
  ├── DoChan(key, fn)         ← 异步版本（返回 channel）
  └── Forget(key)             ← 主动移除 key（强制下次重新执行）

  semaphore.Weighted（加权信号量）
  ├── Acquire(ctx, n)         ← 获取 n 个权重（阻塞）
  ├── TryAcquire(n)           ← 非阻塞尝试获取
  └── Release(n)              ← 释放 n 个权重

  场景对比：
  ┌──────────────────┬───────────────────────────────────────────┐
  │ errgroup         │ fan-out 并发、API 聚合、并行 IO           │
  │ singleflight     │ 缓存穿透防护、DB 查询去重、热点资源请求   │
  │ semaphore        │ 限制 goroutine 数、连接池、CPU 密集任务   │
  └──────────────────┴───────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// errgroup（简化）
type Group struct {
    cancel  func(error)  // WithContext 时的 cancel
    wg      sync.WaitGroup
    sem     chan token    // SetLimit 时的信号量
    errOnce sync.Once
    err     error        // 只保存第一个错误
}

func (g *Group) Go(f func() error) {
    if g.sem != nil {
        g.sem <- token{} // 获取信号量（限制并发）
    }
    g.wg.Add(1)
    go func() {
        defer g.wg.Done()
        if g.sem != nil {
            defer func() { <-g.sem }()
        }
        if err := f(); err != nil {
            g.errOnce.Do(func() {
                g.err = err
                if g.cancel != nil {
                    g.cancel(err) // 通知其他 goroutine 取消
                }
            })
        }
    }()
}

// singleflight（简化）
type call struct {
    wg  sync.WaitGroup
    val any    // 共享结果
    err error
    dups int   // 重复请求计数
}

type Group struct {
    mu sync.Mutex
    m  map[string]*call
}

func (g *Group) Do(key string, fn func() (any, error)) (any, error, bool) {
    g.mu.Lock()
    if c, ok := g.m[key]; ok {
        // 已有相同 key 的请求在飞行中，等待其结果
        c.dups++
        g.mu.Unlock()
        c.wg.Wait()
        return c.val, c.err, true // shared=true
    }
    c := new(call)
    c.wg.Add(1)
    g.m[key] = c
    g.mu.Unlock()

    c.val, c.err = fn()
    c.wg.Done()

    g.mu.Lock()
    delete(g.m, key)
    g.mu.Unlock()

    return c.val, c.err, false // shared=false（第一个请求）
}
```

---

## 二、代码示例

### errgroup：并行 API 聚合

```go
import "golang.org/x/sync/errgroup"

type PageData struct {
    User    *User
    Orders  []Order
    Reviews []Review
}

// 并行查询三个数据源，任一失败立即取消其他
func fetchPageData(ctx context.Context, userID int) (*PageData, error) {
    g, ctx := errgroup.WithContext(ctx)
    data := &PageData{}

    g.Go(func() error {
        user, err := fetchUser(ctx, userID)
        if err != nil {
            return fmt.Errorf("fetch user: %w", err)
        }
        data.User = user
        return nil
    })

    g.Go(func() error {
        orders, err := fetchOrders(ctx, userID)
        if err != nil {
            return fmt.Errorf("fetch orders: %w", err)
        }
        data.Orders = orders
        return nil
    })

    g.Go(func() error {
        reviews, err := fetchReviews(ctx, userID)
        if err != nil {
            return fmt.Errorf("fetch reviews: %w", err)
        }
        data.Reviews = reviews
        return nil
    })

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return data, nil
}
```

### errgroup + SetLimit：限制并发下载

```go
// 批量下载文件，最多同时 5 个并发（Go 1.21+）
func downloadFiles(ctx context.Context, urls []string, dir string) error {
    g, ctx := errgroup.WithContext(ctx)
    g.SetLimit(5) // 最多 5 个并发

    for _, url := range urls {
        url := url // Go 1.22+ 不需要此行，1.21 及以下需要
        g.Go(func() error {
            return downloadFile(ctx, url, dir)
        })
    }

    return g.Wait()
}

// Go 1.22+ 循环变量语义修复，直接用：
func downloadFilesV2(ctx context.Context, urls []string, dir string) error {
    g, ctx := errgroup.WithContext(ctx)
    g.SetLimit(5)
    for _, url := range urls {
        g.Go(func() error {
            return downloadFile(ctx, url, dir)
        })
    }
    return g.Wait()
}
```

### singleflight：防缓存击穿

```go
import "golang.org/x/sync/singleflight"

type UserService struct {
    db    *sql.DB
    cache *redis.Client
    sf    singleflight.Group
}

// GetUser：防止缓存过期瞬间大量请求同时打 DB
func (s *UserService) GetUser(ctx context.Context, id int) (*User, error) {
    // 先查缓存
    if user, err := s.cache.Get(ctx, fmt.Sprintf("user:%d", id)); err == nil {
        return user, nil
    }

    key := fmt.Sprintf("db:user:%d", id)

    // singleflight：相同 key 的并发请求只执行一次 DB 查询
    v, err, shared := s.sf.Do(key, func() (any, error) {
        user, err := s.db.QueryUser(ctx, id)
        if err != nil {
            return nil, err
        }
        // 写入缓存（只执行一次）
        s.cache.Set(ctx, fmt.Sprintf("user:%d", id), user, 5*time.Minute)
        return user, nil
    })

    if err != nil {
        return nil, err
    }
    if shared {
        log.Printf("singleflight: user %d request was deduplicated", id)
    }
    return v.(*User), nil
}

// Forget 场景：数据更新后主动失效，强制下次重新查询
func (s *UserService) UpdateUser(ctx context.Context, user *User) error {
    if err := s.db.UpdateUser(ctx, user); err != nil {
        return err
    }
    // 删除缓存 + 移除 singleflight key，保证下次请求重新加载
    s.cache.Del(ctx, fmt.Sprintf("user:%d", user.ID))
    s.sf.Forget(fmt.Sprintf("db:user:%d", user.ID))
    return nil
}
```

### semaphore：限制 CPU 密集任务并发

```go
import "golang.org/x/sync/semaphore"

// 图片压缩服务：限制同时处理的图片数（防 OOM）
type ImageProcessor struct {
    sem *semaphore.Weighted
}

func NewImageProcessor(maxConcurrent int64) *ImageProcessor {
    return &ImageProcessor{
        sem: semaphore.NewWeighted(maxConcurrent),
    }
}

func (p *ImageProcessor) ProcessBatch(ctx context.Context, images []string) error {
    g, ctx := errgroup.WithContext(ctx)

    for _, img := range images {
        img := img
        // 获取信号量（权重为 1）
        if err := p.sem.Acquire(ctx, 1); err != nil {
            return err // ctx 取消
        }

        g.Go(func() error {
            defer p.sem.Release(1)
            return compressImage(img)
        })
    }
    return g.Wait()
}

// 加权信号量：大文件用更多权重
func (p *ImageProcessor) ProcessWeighted(ctx context.Context, file string, sizeMB int) error {
    weight := int64(sizeMB/10 + 1) // 文件越大占用越多"槽位"
    if err := p.sem.Acquire(ctx, weight); err != nil {
        return err
    }
    defer p.sem.Release(weight)
    return processLargeFile(file)
}
```

### Pipeline：errgroup 实现并发 Pipeline

```go
// Pipeline 模式：生产者 → 转换 → 消费者（并发流水线）
func pipeline(ctx context.Context, inputs []string) error {
    g, ctx := errgroup.WithContext(ctx)

    // Stage 1：生产（发送到 channel）
    ch := make(chan string, 10)
    g.Go(func() error {
        defer close(ch)
        for _, s := range inputs {
            select {
            case ch <- s:
            case <-ctx.Done():
                return ctx.Err()
            }
        }
        return nil
    })

    // Stage 2：并发消费（3 个 worker）
    const workers = 3
    for i := 0; i < workers; i++ {
        g.Go(func() error {
            for s := range ch {
                if err := process(s); err != nil {
                    return err // 触发 ctx cancel，生产者也会退出
                }
            }
            return nil
        })
    }

    return g.Wait()
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `errgroup.WithContext` 取消是如何传播的？ | 任意 `g.Go` 的函数返回非 nil 错误时，`cancel(err)` 被调用，ctx 进入 Done 状态；其他 goroutine 通过 `ctx.Done()` 感知并提前退出 |
| `singleflight.Do` 返回的第三个值 `shared` 有什么用？ | true 表示此结果来自等待另一个相同 key 的请求（而非自己发起查询），可用于监控日志，统计缓存击穿防护率 |
| singleflight 会不会放大错误影响？ | 是！一次查询失败，所有等待该 key 的请求都返回同一个错误；可用 `Forget(key)` 在错误后立即清除，让下次请求重新尝试 |
| `semaphore.Weighted` 比 `chan struct{}` 好在哪里？ | 支持 `ctx` 取消（Acquire 可被 cancel），支持加权获取（`Acquire(ctx, n)`）；`chan struct{}` 无法取消且每次只能获取 1 个槽位 |
| `errgroup.SetLimit(n)` 和手写信号量的区别？ | SetLimit 内置在 errgroup 中，与 `Go()` 方法协作（等待槽位空闲后才启动 goroutine）；语义更清晰，不需要手动管理 sem |
| 什么情况下用 errgroup 而不是普通 goroutine+WaitGroup？ | 需要错误聚合、需要 ctx 取消传播、需要限制并发数时用 errgroup；简单 fire-and-forget 或无错误返回时用 WaitGroup 即可 |
