---
title: 高并发支付系统专题整理：Redis 篇
description: 聚焦支付系统里的 Redis 高频考点，覆盖缓存穿透/击穿/雪崩、分布式锁、Lua 原子性、滑动窗口与幂等控制。
---

# 高并发支付系统专题整理：Redis 篇

- [返回高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [MySQL 篇](./high-concurrency-payment-mysql.md)
- [Kafka 篇](./high-concurrency-payment-kafka.md)

## 适合谁看

- 对缓存治理和并发控制的边界还不够清晰
- 经常混淆穿透、击穿、雪崩、锁安全性这些概念
- 想把 Redis 在支付系统里的典型用法答得更工程化

## 你会得到什么

- 一套缓存问题的快速区分框架
- 分布式锁、Lua、滑动窗口这些高频点的面试表达
- 面向支付场景的幂等与重复请求治理思路

## 建议复习顺序

1. 先看缓存穿透、击穿、雪崩，建立问题分类
2. 再看分布式锁和 Lua，补并发控制
3. 最后看滑动窗口、幂等控制，串到真实业务链路

## 对应资料导航

- [go-redis：客户端与分布式锁](/golang/guide/source-reading/go-redis)
- [net/http 限流与熔断](/golang/guide/source-reading/net-http-ratelimit)


## 缓存穿透、击穿、雪崩

> 这三个问题本质上都是缓存没兜住，请求直接打到下游。区别在于：穿透是查不存在的数据，击穿是热点 Key 恰好过期，雪崩是大量 Key 同时失效。

建议先用表格快速区分：

| 问题 | 本质 | 典型现象 | 核心治理 |
| --- | --- | --- | --- |
| 缓存穿透 | 查询根本不存在的数据 | 请求绕过缓存，持续打空 DB | 布隆过滤器、缓存空值、参数校验 |
| 缓存击穿 | 热点 Key 在高并发下刚好过期 | 瞬时大量请求同时回源 | 热点 Key 永不过期、异步刷新、互斥锁 |
| 缓存雪崩 | 大量 Key 同时失效或缓存服务异常 | 下游在短时间内被整体流量压垮 | TTL 随机化、多级缓存、限流降级、高可用 |


### **缓存穿透**

> 缓存穿透是指查询一个根本不存在的数据。由于缓存中没有，请求会直接穿透到数据库；数据库也没有这个数据，因此无法回填缓存。结果就是，后续同样的请求还会继续打到数据库。

<details>
<summary><strong>缓存穿透详解</strong></summary>

它的风险在于：

- 每次对不存在数据的请求都会直接给 DB 施压
- 恶意攻击者如果持续构造随机不存在的 ID，请求会绕过缓存直接打穿数据库
- 业务侧如果参数校验不严，也会把大量非法请求直接透传到下游

缓存穿透常见场景：

- 恶意攻击：利用爬虫不断随机生成不存在的 ID 发起请求
- 业务逻辑漏洞：代码层面对参数校验不严，导致非法请求透传

核心解决方案：

1. 布隆过滤器 (Bloom Filter) —— 首选方案
布隆过滤器是一种空间效率极高的概率型数据结构。它在请求到达缓存之前，先判断该数据是否存在。

原理：将所有可能存在的数据通过多个 Hash 函数映射到一个位图（BitMap）中。

效果：如果布隆过滤器说数据“不存在”，那它一定不存在；如果说“存在”，则有极小的概率是误判（数据其实不存在）。

优点：内存占用极低，能有效拦截大部分非法请求。

2. 缓存空对象 (Cache Null Object)
如果数据库查询不到结果，仍然将这个“空结果”存入 Redis，并设置一个较短的过期时间（例如 1~5 分钟）。

原理：后续相同的请求会命中缓存中的“空值”，不再查询数据库。

缺点：

如果不存在的 Key 很多，会浪费大量 Redis 内存。

即便设置了过期时间，在过期时间内数据可能在 DB 中被新增，导致缓存不一致。

3. 参数合法性校验
这是最基础的一道防线。在 Controller 层或网关层对请求参数进行严格校验。

方法：判断 ID 是否符合规范（如是否为正整数、长度是否达标）、用户是否具有访问权限等。

总结建议：

在生产环境中，最稳健的做法是 “参数校验 + 布隆过滤器”。将布隆过滤器部署在 Redis 之前，既能保护数据库，又能避免 Redis 被大量垃圾 Key 占满内存。
</details>

### **缓存击穿**

> 缓存击穿是指一个极其热点的 Key，比如热搜、秒杀商品、商户核心配置，在缓存过期的那一秒钟，同时有海量请求涌入。由于缓存失效，这些请求会并发查询数据库并尝试回写缓存，数据库瞬间承受巨大的并发压力。

<details>
<summary><strong>缓存击穿详解</strong></summary>

> 虽然名字和缓存穿透很像，但它的成因完全不同。如果说缓存穿透是由于数据不存在导致防护被绕过，那么缓存击穿就是由于数据太火热，在失效瞬间被瞬时流量冲垮。

常见特点：

- 通常只发生在少数热点 Key 上
- 请求的数据是真实存在的，不是非法请求
- 问题集中爆发在过期瞬间
- 高峰期很容易把单个下游查询打爆

核心治理思路只有两个：要么不让热点 Key 真的过期，要么不让海量请求同时钻进数据库。

常见解决方案：

1. 设置热点数据永不过期
2. 使用互斥锁控制只有一个线程回源
3. 压力过高时做熔断和降级

具体展开可以这样讲：

- 物理不过期：直接不给热点 Key 设置 TTL
- 逻辑不过期：缓存值里带一个逻辑过期时间，快到期时由后台异步线程刷新
- 互斥锁：缓存失效后先抢锁，第一个拿到锁的线程负责查 DB 和回填缓存，其他线程短暂休眠后重试
- 熔断降级：如果数据库压力过高，直接返回默认值、兜底页或稍后重试

互斥锁的避坑点要明确：

> 锁一定要设置过期时间。否则拿到锁的机器在查 DB 过程中宕机，这个热点 Key 就可能长期不可访问。

</details>

### **缓存雪崩**
> 缓存雪崩是指大量缓存 Key 在同一时间集中失效，或者 Redis 整体不可用，导致海量请求在短时间内全部压向数据库或下游服务。

<details>
<summary><strong>缓存雪崩详解</strong></summary>

常见原因：

- 批量缓存统一 TTL，到点一起过期
- Redis 节点故障、网络抖动、集群不可用
- 大促前预热不充分，热点数据集中回源

核心方案：

1. TTL 加随机值
2. 多级缓存
3. 限流、降级、熔断
4. Redis 高可用部署

```text
穿透：请求不存在的数据 -> DB 被持续打空
击穿：热点 Key 过期 -> 瞬时并发回源
雪崩：大量 Key 同时失效 -> 整体流量压垮下游
```

> 支付语境下可以补一句：商户配置、风控规则、订单查询这类热点数据一旦发生击穿或雪崩，核心交易链路的 RT 和成功率会被直接放大。

</details>

## 分布式锁安全性

> Redis 锁不是加了就安全，它解决的是并发协调问题，不解决最终数据正确性问题。最终一致性必须靠数据库唯一索引、乐观锁或状态机兜底。

<details>
<summary><strong>分布式锁安全性详解</strong></summary>

重点风险：

- 锁过期：业务没执行完，锁先失效
- 误删锁：A 的锁过期后被 B 拿到，A 执行完把 B 的锁删掉
- 主从切换导致锁丢失
- 锁续期失败

标准答法：

1. 加锁用唯一 value，解锁时校验 value 再删除
2. 锁只做削峰和串行化，最终一致性靠数据库约束兜底
3. 对资金类动作优先保证幂等，不把 Redis 锁当成唯一防线

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
```

> 一句话收口：Redis 锁解决少做冲突，数据库约束解决绝不做错。

</details>

<details>
<summary><strong>Lua 脚本原子性怎么答？</strong></summary>

> Redis 单线程执行命令，Lua 脚本在执行期间不会被其他命令插入，所以非常适合把读、判断、写合并成一个原子操作。

典型使用场景：

- 校验库存后扣减
- 判断锁 value 后释放锁
- 限流时窗口计数和过期时间一起设置

和事务的区别要说清楚：

- Redis Lua 保证的是脚本执行原子性，不是数据库那种可回滚事务
- 脚本里已经执行成功的命令，不会因为后续报错自动回滚

```lua
local current = redis.call("GET", KEYS[1])
if not current then
  current = 0
else
  current = tonumber(current)
end

if current + tonumber(ARGV[1]) > tonumber(ARGV[2]) then
  return 0
end

redis.call("INCRBY", KEYS[1], ARGV[1])
redis.call("EXPIRE", KEYS[1], ARGV[3])
return 1
```

</details>

<details>
<summary><strong>滑动窗口统计怎么答？</strong></summary>

> 标准做法是 Redis ZSET。score 用时间戳，member 用唯一事件 ID；每次请求先删窗口外数据，再写入当前事件，最后统计窗口内元素数量。

回答时按这个顺序最稳：

1. 为什么用 ZSET：天然按时间排序，适合窗口裁剪
2. 关键步骤：删旧数据、写新数据、统计数量、设置过期
3. 典型场景：用户支付频次、接口限流、风控频控

```go
func Allow(ctx context.Context, rdb *redis.Client, key string, now int64, limit int64) (bool, error) {
    min := "0"
    max := strconv.FormatInt(now-60, 10)

    pipe := rdb.TxPipeline()
    pipe.ZRemRangeByScore(ctx, key, min, max)
    pipe.ZAdd(ctx, key, redis.Z{
        Score:  float64(now),
        Member: fmt.Sprintf("%d-%s", now, uuid.NewString()),
    })
    count := pipe.ZCard(ctx, key)
    pipe.Expire(ctx, key, 2*time.Minute)
    if _, err := pipe.Exec(ctx); err != nil {
        return false, err
    }
    return count.Val() <= limit, nil
}
```

</details>

## 支付语境下的典型问题

<details>
<summary><strong>如何防止重复支付？</strong></summary>

> 多层防线组合：前端按钮防抖 -> 网关层用 RequestID + Redis `SET NX EX` 拦截 -> 数据库订单表唯一索引兜底。

```go
func (g *Gateway) CheckDuplicate(ctx context.Context, requestID string) (bool, error) {
    ok, err := g.redis.SetNX(ctx, "pay:req:"+requestID, "1", 10*time.Minute).Result()
    if err != nil {
        return false, err
    }
    return !ok, nil
}
```

</details>

<details>
<summary><strong>如何实现请求级幂等？</strong></summary>

> 以 `BusinessID` 作为幂等键，Redis 记录处理结果。首次请求正常处理并缓存结果，重复请求直接返回缓存结果。

```go
func (s *PaymentService) Pay(ctx context.Context, req *PayReq) (*PayResp, error) {
    key := fmt.Sprintf("idem:%s:%s", req.OrderID, req.Action)
    if cached, err := s.redis.Get(ctx, key).Result(); err == nil {
        return Unmarshal[PayResp](cached), nil
    }

    resp, err := s.doPay(ctx, req)
    if err != nil {
        return nil, err
    }

    s.redis.Set(ctx, key, Marshal(resp), 24*time.Hour)
    return resp, nil
}
```

</details>

<details>
<summary><strong>Redis 锁失效后如何避免并发扣款？</strong></summary>

> Redis 分布式锁有续期失败、主从切换等风险，不能作为资金安全的唯一保障。正确做法是 Redis 锁挡大部分并发，数据库乐观锁或唯一索引做最终兜底。

```go
func (s *PaymentService) Deduct(ctx context.Context, orderID string, amount int64) error {
    lock := s.redis.SetNX(ctx, "lock:deduct:"+orderID, "1", 5*time.Second)
    if !lock.Val() {
        return ErrDuplicateDeduct
    }
    defer s.redis.Del(ctx, "lock:deduct:"+orderID)

    result := s.db.Exec(
        "UPDATE account SET balance = balance - ? WHERE id = ? AND balance >= ?",
        amount, accountID, amount,
    )
    if result.RowsAffected == 0 {
        return ErrInsufficientBalance
    }
    return nil
}
```

</details>

---

## 继续阅读

- [上一篇：MySQL 篇](./high-concurrency-payment-mysql.md)
- [返回高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [下一篇：Kafka 篇](./high-concurrency-payment-kafka.md)
- [案例总览](./index.md)
