---
title: 限流算法详解：漏桶、令牌桶与工程选型
description: 从固定窗口、滑动窗口到漏桶和令牌桶，完整拆解四种主流限流算法的原理、差异与工程选型依据。
---

<script setup>
import InlineSvg from '@docs-components/InlineSvg.vue'
</script>

# 限流算法详解：漏桶、令牌桶与工程选型

## 适合人群

- 知道"限流"这个词，但说不清漏桶和令牌桶到底有什么区别的后端工程师
- 准备系统设计面试，需要讲清楚限流算法选型的候选人
- 正在做网关、API Gateway 或高并发接口保护，要选限流方案的开发者
- 已经用过 Nginx `limit_req` 或 Guava `RateLimiter`，但还没理解底层算法的人

## 学习目标

- 理解限流要解决的核心问题：保护服务不被流量打穿
- 能讲清四种主流限流算法（固定窗口、滑动窗口、漏桶、令牌桶）的原理和差异
- 知道漏桶和令牌桶各自适合什么场景，能做出工程选型判断
- 能画出漏桶和令牌桶的核心流程图
- 了解 Nginx、Guava、Redis + Lua 等常见限流实现的算法选择

## 快速导航

- [先说结论](#先说结论)
- [为什么需要限流](#为什么需要限流)
- [固定窗口计数器](#固定窗口计数器-fixed-window-counter)
- [滑动窗口](#滑动窗口-sliding-window)
- [漏桶算法](#漏桶算法-leaky-bucket)
- [令牌桶算法](#令牌桶算法-token-bucket)
- [漏桶 vs 令牌桶：到底选哪个](#漏桶-vs-令牌桶到底选哪个)
- [工程落地参考](#工程落地参考)
- [高频问题](#高频问题)
- [推荐资料](#推荐资料)

---

## 先说结论

| 算法 | 核心思想 | 能否应对突发 | 输出特征 | 实现复杂度 | 典型实现 |
|------|---------|------------|---------|-----------|---------|
| **固定窗口** | 每个时间窗口内计数 | 有临界突发问题 | 窗口内均匀 | 低 | Redis INCR + EXPIRE |
| **滑动窗口** | 按请求时间戳滑动计数 | 解决临界突发 | 较平滑 | 中 | Redis Sorted Set |
| **漏桶** | 恒定速率流出 | 不允许突发 | 严格匀速 | 中 | Nginx limit_req |
| **令牌桶** | 匀速放令牌，按需消耗 | **允许突发** | 平均匀速，短期可突发 | 中 | Guava RateLimiter |

一句话选型建议：

> 需要严格平滑输出（流量整形）→ **漏桶**；需要在控制平均速率的同时允许短暂突发 → **令牌桶**。大多数 API 限流场景选令牌桶更合适。

---

## 为什么需要限流

不限流会发生什么？

1. **服务雪崩**：一个慢接口堆积请求，占满线程池 / 连接池，拖垮整个服务
2. **资源耗尽**：CPU、内存、数据库连接同时打满，正常请求也得不到响应
3. **级联故障**：上游服务被打垮后，下游服务因为超时重试加倍放大流量
4. **不公平**：少数大客户或爬虫占用绝大多数资源，其他用户体验下降

限流的本质是：

> 在系统容量有限的前提下，主动控制请求的通过速率，保证服务在可控范围内稳定运行。

### 限流在架构中的位置

```
客户端 → CDN / WAF → 网关限流 → 路由层限流 → 服务内限流 → 下游保护
              ↑          ↑            ↑             ↑
           DDoS 防护   全局配额      接口级限流    并发/排队控制
```

限流不是一个单点操作，而是分布在不同层级。不同层选择的算法也不同——网关层通常用漏桶做流量整形，应用层更多用令牌桶控制 API 调用速率。

---

## 固定窗口计数器 (Fixed Window Counter)

### 原理

把时间切分成固定大小的窗口（例如每秒一个窗口），每个窗口内维护一个计数器。每来一个请求，计数器 +1，超过阈值就拒绝。

```
时间轴：
|-------- 窗口 1 --------|-------- 窗口 2 --------|
  0s                    1s                       2s

窗口 1 限流阈值：100 次
  第 1~100 个请求 → 放行
  第 101 个请求   → 拒绝

窗口 2 计数器重置为 0，重新开始
```

### 实现思路

```python
# Redis 实现（伪代码）
def is_allowed(key, limit, window_seconds):
    current = redis.incr(key)
    if current == 1:
        redis.expire(key, window_seconds)
    return current <= limit
```

### 问题：临界突发

固定窗口最大的问题是**窗口边界处的突发**：

```
窗口 1 尾部 (0.9s ~ 1.0s)：涌入 100 个请求 → 放行
窗口 2 头部 (1.0s ~ 1.1s)：涌入 100 个请求 → 放行

实际 0.2s 内通过了 200 个请求，超过预期速率 2 倍
```

这就是为什么很多场景不用固定窗口，或者把它当作粗粒度的第一道防线。

---

## 滑动窗口 (Sliding Window)

### 滑动窗口计数器

不再按固定边界切分，而是从当前时刻往回看一个窗口的时间。

做法是把大窗口切成若干小窗口（sub-window），用加权计算来近似滑动效果：

```
当前时刻在窗口 2 的 30% 处

有效请求数 ≈ 窗口 1 计数 × 70% + 窗口 2 计数 × 100%
```

这样大幅缓解了临界突发问题，且实现成本比完整滑动日志低。

### 滑动窗口日志

更精确的做法是记录每个请求的时间戳（通常用 Redis Sorted Set），每次请求时：

1. 移除窗口之外的旧时间戳
2. 计算当前窗口内的请求数
3. 判断是否超过阈值

```python
# Redis Sorted Set 实现（伪代码）
def is_allowed(key, limit, window_seconds):
    now = current_timestamp_ms()
    window_start = now - window_seconds * 1000

    # 移除过期记录
    redis.zremrangebyscore(key, 0, window_start)
    # 当前窗口内请求数
    count = redis.zcard(key)

    if count < limit:
        redis.zadd(key, now, request_id)
        redis.expire(key, window_seconds)
        return True
    return False
```

**优点**：精确，无临界突发问题。

**缺点**：内存占用高——每个请求都要存一条记录。如果限流阈值是 10000 req/s，就要存 10000 条时间戳。

---

## 漏桶算法 (Leaky Bucket)

漏桶是限流算法中**流量整形（Traffic Shaping）** 能力最强的算法。

### 核心思想

把系统想象成一个桶：

1. **请求流入桶中**（不管到达速率多快）
2. **桶以恒定速率流出请求**（处理速率固定）
3. **桶满则溢出**——新请求被丢弃或返回限流响应

<InlineSvg src="/algorithm/leaky-bucket.svg" alt="漏桶算法示意图" />

### 关键参数

| 参数 | 含义 |
|------|------|
| **rate (r)** | 流出速率——桶每秒处理多少个请求 |
| **capacity (C)** | 桶的容量——最多缓冲多少个等待中的请求 |

### 伪代码实现

```python
class LeakyBucket:
    def __init__(self, rate, capacity):
        self.rate = rate          # 每秒流出请求数
        self.capacity = capacity  # 桶容量
        self.water = 0            # 当前桶中的水量
        self.last_time = now()    # 上次漏水时间

    def allow(self):
        current = now()
        elapsed = current - self.last_time
        self.last_time = current

        # 按时间流出水
        self.water = max(0, self.water - elapsed * self.rate)

        if self.water < self.capacity:
            self.water += 1
            return True   # 放行
        return False      # 桶满，拒绝
```

### 优点

- **输出严格匀速**：无论输入多么不规则，输出永远是平滑的
- **实现简单**：只需要维护两个变量（water + last_time）
- **天然防突发**：即使桶是空的，也不能一次性处理大量请求

### 缺点

- **不允许突发**：即使系统当前完全空闲，也不能处理超过 rate 的请求——这在很多场景下不合理
- **请求排队延迟**：请求进入桶后需要排队等待流出，增加了延迟
- **对突发流量不友好**：合法的短暂流量高峰也会被限流

### 适用场景

- 需要**严格平滑**输出的场景：网络流量整形、消息队列消费速率控制
- 保护下游服务不被**任何**突发流量冲击
- 典型实现：**Nginx `limit_req`** 模块

---

## 令牌桶算法 (Token Bucket)

令牌桶是工程中**最常用**的限流算法，因为它在控制平均速率的同时允许一定程度的突发。

### 核心思想

1. **系统以固定速率向桶中放入令牌**
2. **桶有最大容量**，满了之后新令牌被丢弃
3. **每个请求到达时需要消耗一个令牌**——有令牌就放行，没有就拒绝（或排队等待）

<InlineSvg src="/algorithm/token-bucket.svg" alt="令牌桶算法示意图" />

### 关键参数

| 参数 | 含义 |
|------|------|
| **rate (r)** | 令牌生成速率——每秒放入多少个令牌 |
| **burst (B)** | 桶容量——最多积攒多少个令牌，决定了允许的最大突发量 |

### 伪代码实现

```python
class TokenBucket:
    def __init__(self, rate, burst):
        self.rate = rate          # 每秒生成令牌数
        self.burst = burst        # 桶容量（最大突发量）
        self.tokens = burst       # 当前令牌数（初始满桶）
        self.last_time = now()    # 上次补充令牌时间

    def allow(self):
        current = now()
        elapsed = current - self.last_time
        self.last_time = current

        # 补充令牌（不超过桶容量）
        self.tokens = min(self.burst, self.tokens + elapsed * self.rate)

        if self.tokens >= 1:
            self.tokens -= 1
            return True   # 放行
        return False      # 无令牌，拒绝
```

### 关键行为：允许突发

令牌桶最重要的特性是**允许突发**：

```
假设 rate = 100/s，burst = 200

场景：系统空闲了 2 秒，桶中积攒了 200 个令牌

此时突然来了 200 个请求 → 全部放行（消耗 200 个令牌）
之后令牌耗尽，回到 100/s 的速率

长期来看，平均速率不超过 100/s
短期来看，允许最多 200 的瞬时突发
```

这个特性非常适合 API 限流——正常用户偶尔会有短暂的请求高峰（比如页面初始化时并发请求多个接口），不应该被限流拒绝。

### 优点

- **允许突发**：对合法的流量尖峰友好
- **长期速率可控**：无论短期怎么突发，长期平均速率不超过 rate
- **配置灵活**：通过 rate 和 burst 两个参数可以精细控制行为
- **实现简洁**：和漏桶一样只需要两个变量

### 缺点

- **不能严格平滑输出**：允许突发意味着下游可能在短时间内收到大量请求
- **burst 参数需要调优**：设大了起不到限流效果，设小了对正常用户不友好

### 适用场景

- **API 限流**：限制用户/客户端的调用频率，同时允许合理突发
- **分布式限流**：结合 Redis 实现全局令牌桶
- 典型实现：**Guava RateLimiter**、AWS / Google Cloud API Gateway

---

## 漏桶 vs 令牌桶：到底选哪个

### 核心差异对比

| 维度 | 漏桶 (Leaky Bucket) | 令牌桶 (Token Bucket) |
|------|---------------------|----------------------|
| **输出模式** | 严格匀速 | 平均匀速，允许短暂突发 |
| **突发处理** | 不允许，多余请求排队或丢弃 | 允许，桶中有令牌就放行 |
| **流量整形** | 强——输出完全平滑 | 弱——允许短期波动 |
| **空闲后的行为** | 空闲再忙，输出还是匀速 | 空闲时积攒令牌，忙时可突发消耗 |
| **请求延迟** | 可能有排队延迟 | 有令牌就立即通过，无排队 |
| **配置参数** | rate + capacity | rate + burst |
| **典型实现** | Nginx limit_req | Guava RateLimiter |
| **适合场景** | 流量整形、保护脆弱下游 | API 限流、允许合理突发 |

### 选型决策

```
需求是什么？
│
├─ 需要输出严格匀速（保护下游、网络整形）
│  → 漏桶
│
├─ 需要控制平均速率，但允许短暂突发
│  → 令牌桶
│
├─ 只需要粗粒度的频率控制
│  → 固定窗口 / 滑动窗口就够了
│
└─ 不确定
   → 大多数情况选令牌桶——它在限流和用户体验之间平衡最好
```

> 一个容易记住的类比：漏桶像水龙头——无论水管里压力多大，出水速度不变；令牌桶像游乐场门票——攒了票可以一次性进很多人，但长期来看入场速度有上限。

---

## 工程落地参考

### Nginx limit_req（漏桶）

Nginx 的 `limit_req` 模块底层就是漏桶算法：

```nginx
# 定义限流区域：10MB 共享内存，每秒 10 个请求
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location /api/ {
        # burst=20 表示桶容量为 20
        # nodelay 表示突发请求不排队，直接处理
        limit_req zone=api burst=20 nodelay;
    }
}
```

注意 `nodelay` 参数：加了之后突发请求会立即处理（类似令牌桶行为），不加则排队等待（纯漏桶行为）。

### Guava RateLimiter（令牌桶）

Google Guava 的 `RateLimiter` 是令牌桶的经典实现：

```java
// 每秒生成 10 个令牌
RateLimiter limiter = RateLimiter.create(10.0);

// 阻塞等待直到获取令牌
limiter.acquire();
doWork();

// 非阻塞：尝试获取，失败立即返回
if (limiter.tryAcquire()) {
    doWork();
} else {
    reject();
}
```

Guava 还提供了 `SmoothWarmingUp` 模式，在系统冷启动时逐渐增加放行速率，避免冷系统被突发流量冲垮。

### Redis + Lua 分布式限流（令牌桶）

单机限流用本地变量就够了，分布式场景需要 Redis：

```lua
-- Redis Lua 脚本：令牌桶
local key = KEYS[1]
local rate = tonumber(ARGV[1])       -- 每秒令牌数
local burst = tonumber(ARGV[2])      -- 桶容量
local now = tonumber(ARGV[3])        -- 当前时间戳（毫秒）
local requested = tonumber(ARGV[4])  -- 请求的令牌数

local data = redis.call('hmget', key, 'tokens', 'last_time')
local tokens = tonumber(data[1]) or burst
local last_time = tonumber(data[2]) or now

-- 计算新增令牌
local elapsed = (now - last_time) / 1000
local new_tokens = math.min(burst, tokens + elapsed * rate)

if new_tokens >= requested then
    new_tokens = new_tokens - requested
    redis.call('hmset', key, 'tokens', new_tokens, 'last_time', now)
    redis.call('expire', key, math.ceil(burst / rate) + 1)
    return 1  -- 允许
else
    redis.call('hmset', key, 'tokens', new_tokens, 'last_time', now)
    redis.call('expire', key, math.ceil(burst / rate) + 1)
    return 0  -- 拒绝
end
```

### API Gateway 层限流

主流 API Gateway 的限流算法选择：

| 网关 | 默认算法 | 说明 |
|------|---------|------|
| Nginx | 漏桶 | `limit_req` 模块 |
| Kong | 固定窗口 / 滑动窗口 | Rate Limiting 插件 |
| AWS API Gateway | 令牌桶 | 按 account/stage 配置 |
| Google Cloud Endpoints | 令牌桶 | 按 API key 限流 |
| Envoy | 令牌桶 | 本地/全局限流 |

---

## 高频问题

### Q1：漏桶和令牌桶能组合使用吗？

可以。一个常见模式是：

- **令牌桶**放在 API Gateway 层，控制每个用户的平均请求速率，允许合理突发
- **漏桶**放在下游服务入口，严格控制对数据库或第三方 API 的请求速率

这样既保证了用户体验，又保护了脆弱的下游资源。

### Q2：分布式限流用哪种算法？

最常用的是**滑动窗口**（Redis Sorted Set）和**令牌桶**（Redis Hash + Lua）。

滑动窗口实现简单，适合配额型限流（如每天 1000 次 API 调用）。令牌桶更适合速率型限流（如每秒 100 次请求）。

### Q3：令牌桶的 burst 应该设多大？

经验法则：

- **burst = rate × 可接受突发持续时间**
- 例如 rate = 100/s，允许 2 秒突发 → burst = 200
- burst 太大等于没限流，太小会误杀正常突发请求
- 上线后根据 P99 延迟和错误率调优

### Q4：漏桶的 `nodelay` 模式和令牌桶有什么区别？

Nginx `limit_req` 加了 `nodelay` 后行为接近令牌桶：突发请求立即处理，不排队。但它的计数方式仍然是漏桶——总容量和恢复速率的计算逻辑不同。

核心区别：令牌桶"攒令牌"的概念更直观，`nodelay` 漏桶是"允许突发但仍然以漏桶方式恢复容量"。

### Q5：为什么不直接用固定窗口？

对于粗粒度限流（如每天 1000 次 API 调用、每分钟 60 次），固定窗口完全够用。

但对于细粒度的秒级限流，固定窗口的临界突发问题会导致实际通过量短时间内翻倍，可能打垮下游服务。这时候应该用滑动窗口、漏桶或令牌桶。

### Q6：限流应该返回什么 HTTP 状态码？

标准做法是返回 **429 Too Many Requests**，并在响应头中包含限流信息：

```
HTTP/1.1 429 Too Many Requests
Retry-After: 1
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1620000060
```

---

## 推荐资料

- [Token bucket - Wikipedia](https://en.wikipedia.org/wiki/Token_bucket) - 令牌桶算法的详细描述和变体
- [Leaky bucket - Wikipedia](https://en.wikipedia.org/wiki/Leaky_bucket) - 漏桶算法及其作为 meter 和 queue 的两种解释
- [Guava RateLimiter 源码](https://github.com/google/guava/blob/master/guava/src/com/google/common/util/concurrent/RateLimiter.java) - 工业级令牌桶实现
- [Nginx limit_req 文档](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html) - 漏桶在 Nginx 中的应用
- [System Design - Rate Limiting (ByteByteGo)](https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter) - 系统设计面试角度的限流算法讲解
- [Stripe 的 API 限流实践](https://stripe.com/blog/rate-limiters) - Stripe 如何组合使用不同限流策略
