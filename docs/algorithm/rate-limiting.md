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
- [Sentinel 无锁滑动窗口（LeapArray 源码拆解）](#sentinel-无锁滑动窗口leaparray-源码拆解)
- [多维度限流：Redis + Lua 令牌桶原子性优化](#多维度限流redis--lua-令牌桶原子性优化)
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

滑动窗口是对固定窗口的改进，核心目的是**消除窗口边界处的突发问题**。它有两种实现方式：滑动窗口计数器（近似但高效）和滑动窗口日志（精确但耗内存）。

### 滑动窗口计数器 (Sliding Window Counter)

滑动窗口计数器是工程中**使用最广泛**的限流算法之一——Cloudflare、Kong、Sentinel 等都采用了这个思路。它在固定窗口的基础上，用加权计算来近似滑动效果，以极低的内存开销解决了临界突发问题。

#### 核心思想

不再只看当前窗口的计数，而是**结合上一个窗口的计数，按时间比例加权**：

1. 维护两个计数器：当前窗口（counter_curr）和上一个窗口（counter_prev）
2. 请求到达时，计算当前时刻在当前窗口中的位置比例
3. 用加权公式估算"最近一个完整窗口"内的请求总数
4. 如果估算值超过阈值，拒绝请求

<InlineSvg src="/algorithm/sliding-window.svg" alt="滑动窗口计数器示意图" />

#### 加权公式

```
有效请求数 = counter_prev × (1 - 当前窗口已过比例) + counter_curr
```

用一个具体例子来理解：

```
配置：窗口大小 = 1s，限流阈值 = 100 req/s

时间轴：
|---- 窗口 1 (0s~1s) ----|---- 窗口 2 (1s~2s) ----|
     counter_prev = 84         counter_curr = 36

当前时刻：1.4s（处于窗口 2 的 40% 位置）

计算：
  当前窗口已过比例 = 0.4
  上一窗口权重 = 1 - 0.4 = 0.6

  有效请求数 = 84 × 0.6 + 36 = 50.4 + 36 = 86.4

  86.4 < 100 → 放行
```

**为什么这能解决临界突发？**

回到固定窗口的问题场景：窗口 1 尾部 100 个请求 + 窗口 2 头部 100 个请求。

用滑动窗口计数器重新计算：

```
窗口 1 尾部 (0.9s)：counter_prev 已达 100
窗口 2 头部 (1.05s)：counter_curr = 5

有效请求数 = 100 × (1 - 0.05) + 5 = 95 + 5 = 100

→ 已达阈值，后续请求被拒绝
```

窗口边界处不再有 2 倍突发的漏洞。

#### 关键参数

| 参数 | 含义 |
|------|------|
| **window** | 窗口大小（如 1 秒、1 分钟） |
| **limit** | 窗口内允许的最大请求数 |

#### 伪代码实现

```python
class SlidingWindowCounter:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window = window_seconds
        self.prev_count = 0       # 上一窗口计数
        self.curr_count = 0       # 当前窗口计数
        self.curr_window_start = 0  # 当前窗口起始时间

    def allow(self):
        now = current_timestamp()
        window_start = now - (now % self.window)

        # 窗口翻转
        if window_start != self.curr_window_start:
            self.prev_count = self.curr_count
            self.curr_count = 0
            self.curr_window_start = window_start

        # 当前窗口已过比例
        elapsed_ratio = (now - window_start) / self.window

        # 加权估算
        estimated = self.prev_count * (1 - elapsed_ratio) + self.curr_count

        if estimated < self.limit:
            self.curr_count += 1
            return True
        return False
```

Redis 分布式实现只需要两个 key：

```python
# Redis 实现（伪代码）
def is_allowed(user_id, limit, window_seconds):
    now = current_timestamp()
    curr_window = now // window_seconds
    prev_window = curr_window - 1

    curr_key = f"rate:{user_id}:{curr_window}"
    prev_key = f"rate:{user_id}:{prev_window}"

    curr_count = int(redis.get(curr_key) or 0)
    prev_count = int(redis.get(prev_key) or 0)

    elapsed_ratio = (now % window_seconds) / window_seconds
    estimated = prev_count * (1 - elapsed_ratio) + curr_count

    if estimated < limit:
        pipe = redis.pipeline()
        pipe.incr(curr_key)
        pipe.expire(curr_key, window_seconds * 2)
        pipe.execute()
        return True
    return False
```

#### 优点

- **解决临界突发**：加权计算消除了固定窗口边界处的 2 倍突发问题
- **内存极低**：只需要 2 个计数器（当前窗口 + 上一个窗口），与限流阈值大小无关
- **实现简单**：Redis INCR + EXPIRE 即可，分布式友好
- **精度可调**：子窗口越细精度越高，可以在精度与内存之间权衡

#### 缺点

- **近似而非精确**：加权计算是对请求在窗口内均匀分布的假设，极端情况下仍有误差
- **不做流量整形**：只是"计数拒绝"，不控制请求的输出节奏（和漏桶不同）
- **窗口翻转时的竞态**：分布式环境下窗口翻转瞬间需要原子操作

#### 适用场景

- **API 配额限流**：如每分钟 60 次、每小时 1000 次
- **分布式限流**：多实例共享 Redis 计数器
- **对精度要求不极端苛刻的场景**（绝大多数业务限流）
- 典型实现：**Cloudflare** 全球限流、**Kong** Rate Limiting 插件、**Alibaba Sentinel**

### 滑动窗口日志 (Sliding Window Log)

如果需要**精确**的滑动窗口，可以记录每个请求的时间戳。

#### 核心思想

用一个有序集合记录所有请求的到达时间。每次新请求到达时：

1. 移除窗口之外的旧时间戳
2. 计算当前窗口内的请求数
3. 判断是否超过阈值

#### 伪代码实现

```python
# Redis Sorted Set 实现
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

#### 优点

- **绝对精确**：每个请求都有时间戳，无近似误差
- **没有临界突发**：真正的滑动窗口，任意连续 N 秒内都不超过阈值

#### 缺点

- **内存占用高**：每个请求存一条时间戳。阈值 10000 req/s = 每用户 10000 条记录
- **写放大**：每次请求都要 ZADD + ZREMRANGEBYSCORE + ZCARD，Redis 操作多
- **不适合高阈值场景**：当限流阈值很大时，内存和计算成本线性增长

#### 适用场景

- **低阈值、高精度**场景：如每分钟 5 次短信验证码、每小时 10 次登录尝试
- 对精确度要求极高的计费型限流

### 滑动窗口计数器 vs 滑动窗口日志

| 维度 | 滑动窗口计数器 | 滑动窗口日志 |
|------|--------------|------------|
| **精度** | 近似（假设均匀分布） | 精确 |
| **内存** | O(1)——2 个计数器 | O(N)——N = 阈值 |
| **Redis 操作** | GET + INCR | ZADD + ZREM + ZCARD |
| **适合阈值** | 高（万级 req/s） | 低（百级以下） |
| **实现复杂度** | 低 | 中 |
| **典型场景** | API 限流、网关 | 短信验证码、登录限制 |

> 一句话总结：大多数限流场景用**滑动窗口计数器**就够了——精度足够、内存极低、实现简单。只有需要精确到每一个请求的低阈值场景才需要滑动窗口日志。

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

### Sentinel 无锁滑动窗口（LeapArray 源码拆解）

前面讲的滑动窗口计数器用伪代码很好理解，但到了**每秒数十万请求**的场景，一个朴素的实现会遇到两个瓶颈：

1. **锁竞争**：多线程并发更新同一个计数器，加锁会成为瓶颈
2. **内存分配**：每到新窗口就创建新对象，频繁 GC

Alibaba Sentinel 的 **LeapArray** 是目前开源社区中滑动窗口最优雅的工程实现之一。它通过三个设计解决了上述问题。

#### 核心设计

<InlineSvg src="/algorithm/sentinel-leaparray.svg" alt="Sentinel LeapArray 无锁滑动窗口结构" />

**数据结构层级**：

```
LeapArray<MetricBucket>
  └─ AtomicReferenceArray<WindowWrap<MetricBucket>>   // 环形数组
       └─ WindowWrap
            ├─ windowStart: long          // 窗口起始时间
            ├─ windowLength: long         // 窗口长度
            └─ value: MetricBucket        // 统计数据
                 └─ LongAdder[] counters  // 每个事件类型一个计数器
                      ├─ PASS
                      ├─ BLOCK
                      ├─ EXCEPTION
                      ├─ SUCCESS
                      ├─ RT
                      └─ OCCUPIED_PASS
```

**关键参数**：

| 参数 | 含义 | 默认值 |
|------|------|--------|
| `sampleCount` | 环形数组大小（滑动窗口被分成几个桶） | 2 |
| `intervalInMs` | 滑动窗口总时长 | 1000ms |
| `windowLengthInMs` | 每个桶的时长 = interval / sampleCount | 500ms |

#### 索引计算

```java
// 时间 → 数组索引（取模实现环形复用）
int idx = (int)((timeMillis / windowLengthInMs) % array.length());

// 时间 → 窗口起始时间（对齐到桶边界）
long windowStart = timeMillis - timeMillis % windowLengthInMs;
```

例如 `time=1050ms, windowLength=250ms, sampleCount=4`：
- `idx = (1050/250) % 4 = 4 % 4 = 0`
- `windowStart = 1050 - 1050 % 250 = 1050 - 50 = 1000`

#### CAS 三分支：几乎无锁的关键

`currentWindow(timeMillis)` 方法的 `while(true)` 循环有三个分支：

```java
// 简化后的核心逻辑
WindowWrap<MetricBucket> currentWindow(long timeMillis) {
    int idx = calculateTimeIdx(timeMillis);
    long windowStart = calculateWindowStart(timeMillis);

    while (true) {
        WindowWrap<MetricBucket> old = array.get(idx);

        // 分支 1：槽位为 null → CAS 创建（纯无锁）
        if (old == null) {
            WindowWrap<MetricBucket> window = new WindowWrap<>(
                windowLengthInMs, windowStart, new MetricBucket());
            if (array.compareAndSet(idx, null, window)) {
                return window;   // CAS 成功
            }
            Thread.yield();      // CAS 失败，让出 CPU 重试
        }
        // 分支 2：窗口时间匹配 → 直接返回（零开销热路径）
        else if (old.windowStart() == windowStart) {
            return old;          // 99%+ 的请求走这条路
        }
        // 分支 3：窗口已过期 → tryLock 重置（极少触发）
        else if (old.windowStart() < windowStart) {
            if (updateLock.tryLock()) {
                try {
                    old.resetTo(windowStart);
                    old.value().reset();  // 清零所有 LongAdder
                    return old;
                } finally {
                    updateLock.unlock();
                }
            }
            Thread.yield();      // 没抢到锁，让出 CPU 重试
        }
    }
}
```

**为什么几乎无锁？**

| 分支 | 触发频率 | 锁 | 说明 |
|------|---------|-----|------|
| 分支 2：当前窗口 | **99%+** | 无 | 绝大多数请求直接返回，零开销 |
| 分支 1：首次创建 | 极少（启动时） | CAS | 纯 CAS，无阻塞 |
| 分支 3：窗口过期 | 极少（每 windowLength 一次） | tryLock | 非阻塞，失败 yield 重试 |

再加上每个 `MetricBucket` 内部用 **LongAdder**（而不是 `AtomicLong`）做计数——LongAdder 在高并发写入时通过分段（striped cells）减少 CAS 冲突，写吞吐远高于 AtomicLong。

**设计精髓总结**：

> 环形数组避免 GC（对象复用）+ LongAdder 避免写竞争（分段计数）+ CAS / tryLock 避免全局锁 = 高并发下几乎无锁的滑动窗口。

### 多维度限流：Redis + Lua 令牌桶原子性优化

实际业务中，一个请求往往需要**同时通过多个维度的限流检查**：

```
请求到达
  ├─ IP 限流：每个 IP 每秒 50 次
  ├─ 用户限流：每个用户每秒 20 次
  ├─ 接口限流：/api/order 全局每秒 1000 次
  └─ AppID 限流：每个第三方应用每秒 100 次

只要任一维度超限 → 拒绝
```

如果每个维度单独调一次 Redis，存在两个问题：

1. **非原子**：检查和扣减之间可能有并发穿透
2. **多次 RT**：4 个维度 = 4 次 Redis 调用 = 4 倍网络延迟

#### Key 设计模式

```
rate:{dimension}:{identifier}

示例：
  rate:ip:203.0.113.42          → IP 维度
  rate:user:uid_12345           → 用户维度
  rate:api:/api/order           → 接口维度
  rate:app:app_67890            → 第三方应用维度
```

每个 key 是一个 Hash，存储令牌桶状态：

```
HGETALL rate:user:uid_12345
  → tokens: "18.5"
  → last_time: "1710000000123"
```

#### 单次 Lua 调用检查多个维度

核心优化：**一个 Lua 脚本同时检查所有维度**，原子执行，单次 RT。

```lua
-- 多维度令牌桶限流 Lua 脚本
-- KEYS: 各维度的 key
-- ARGV: rate1, burst1, rate2, burst2, ..., now

local now = tonumber(ARGV[#ARGV])
local num_dimensions = #KEYS

for i = 1, num_dimensions do
    local key = KEYS[i]
    local rate = tonumber(ARGV[(i - 1) * 2 + 1])
    local burst = tonumber(ARGV[(i - 1) * 2 + 2])

    local data = redis.call('hmget', key, 'tokens', 'last_time')
    local tokens = tonumber(data[1]) or burst
    local last_time = tonumber(data[2]) or now

    -- 补充令牌
    local elapsed = (now - last_time) / 1000
    local new_tokens = math.min(burst, tokens + elapsed * rate)

    if new_tokens < 1 then
        -- 任一维度超限 → 立即拒绝（不扣减任何维度）
        return 0
    end
end

-- 所有维度都通过 → 统一扣减
for i = 1, num_dimensions do
    local key = KEYS[i]
    local rate = tonumber(ARGV[(i - 1) * 2 + 1])
    local burst = tonumber(ARGV[(i - 1) * 2 + 2])

    local data = redis.call('hmget', key, 'tokens', 'last_time')
    local tokens = tonumber(data[1]) or burst
    local last_time = tonumber(data[2]) or now

    local elapsed = (now - last_time) / 1000
    local new_tokens = math.min(burst, tokens + elapsed * rate) - 1

    redis.call('hmset', key, 'tokens', new_tokens, 'last_time', now)
    redis.call('expire', key, math.ceil(burst / rate) + 1)
end

return 1  -- 所有维度通过
```

**关键设计点**：

- **先检查后扣减**：两轮循环确保要么全部通过并扣减，要么全部不扣减——避免"IP 扣了但用户没扣"的不一致
- **单次 RT**：一个 Lua 脚本完成所有维度检查，网络开销 = 1 次往返
- **自动过期**：每个 key 设置 `burst/rate + 1` 秒的 TTL，不活跃的限流 key 自动清除

#### Pipeline vs 单脚本的取舍

| 方式 | 原子性 | 网络开销 | 适用场景 |
|------|-------|---------|---------|
| **单 Lua 脚本多 key** | 原子（同节点） | 1 次 RT | 所有 key 在同一 Redis 节点 |
| **Pipeline 多命令** | 非原子 | 1 次 RT（批量） | key 分布在不同节点，不需要严格原子 |
| **逐个调用** | 非原子 | N 次 RT | 不推荐 |

> **注意**：Lua 脚本要求所有 KEYS 在同一个 Redis 节点上。如果使用 Redis Cluster，需要用 Hash Tag（如 `rate:{uid_12345}:ip`）确保同一用户的所有维度 key 落在同一个 slot。

#### 内存控制策略

多维度限流的 key 数量可能很大（每个 IP × 每个接口 = 笛卡尔积），需要注意内存：

- **TTL 必设**：不活跃的 key 及时过期（`burst/rate + buffer`）
- **key 粒度取舍**：不是每个维度都需要最细粒度，IP 限流通常不需要按接口拆分
- **监控 key 数量**：定期检查 `DBSIZE` 和内存用量，防止限流 key 爆炸
- **考虑本地缓存**：高频维度（如全局接口限流）可以用本地令牌桶 + Redis 定期同步，减少 Redis 压力

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
- [Sentinel LeapArray 源码](https://github.com/alibaba/Sentinel/blob/master/sentinel-core/src/main/java/com/alibaba/csp/sentinel/slots/statistic/base/LeapArray.java) - 无锁滑动窗口的工业级实现
- [Cloudflare: How we built rate limiting](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/) - Cloudflare 滑动窗口计数器的工程实践
