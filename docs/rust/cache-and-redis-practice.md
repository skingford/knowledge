---
title: Rust 缓存与 Redis 实践
description: 从进程内缓存、Redis 客户端、TTL、缓存一致性到缓存穿透/击穿/雪崩，整理 Rust 服务里的缓存与 Redis 工程主线。
search: false
---

# Rust 缓存与 Redis 实践

Rust 服务进入真实业务后，数据库和外部 API 往往很快就会碰到另一条主线：

- 热点读流量很高
- 某些下游很慢
- 同一个对象被反复查
- 单实例扩上去以后，数据库还是先扛不住

这时候缓存就会出现。

但缓存真正难的通常不是“调个 Redis API”，而是：

- 什么数据值得缓存
- 进程内缓存和 Redis 怎么分工
- TTL 怎么设
- 更新时先改库还是先改缓存
- 热点 key、击穿、雪崩怎么防
- Rust 里共享状态、序列化和 async 连接边界怎么收

这页补的就是 Rust 服务里的缓存与 Redis 主线。

## 先分清：缓存解决的是延迟和吞吐，不是数据建模

缓存通常在换三件事：

- 用空间换时间
- 用复杂度换吞吐
- 用一致性成本换更低延迟

所以更稳的思路不是“哪里慢就先加缓存”，而是先回答：

1. 这个数据是不是明显读多写少？
2. 不一致能容忍多久？
3. 丢缓存后能不能从数据库或下游重建？
4. 这个热点是真的长期热点，还是某段代码重复查自己制造出来的？

如果这些问题说不清，缓存大概率会先把系统复杂度抬上去。

## 先做架构判断：本地缓存、Redis 还是两级缓存

| 方案 | 更适合什么场景 | 主要代价 |
| --- | --- | --- |
| 进程内缓存 | 单实例热点数据、只读配置、短 TTL 派生结果 | 多实例之间不共享，重启即失效 |
| Redis | 多实例共享缓存、跨服务共享状态、需要统一失效 | 多一跳网络、序列化成本、运维成本 |
| 两级缓存 | 极热点读、希望把 Redis 压力再降一层 | 一致性和排障复杂度更高 |

可以先记一个务实结论：

- 单实例或低并发工具：先别急着上 Redis
- 多实例服务共享读热点：优先考虑 Redis
- 极热点路径：再考虑本地缓存 + Redis 两级缓存

不要把“两级缓存”当默认答案。它只在热点足够热时才值得。

## 默认优先用 cache-aside，不要一开始就追复杂模式

大多数业务服务，默认先掌握 cache-aside 就够了。

### 读路径

1. 先查缓存
2. miss 后查数据库或下游
3. 回填缓存
4. 返回结果

### 写路径

更稳的默认策略通常是：

1. 先写数据库
2. 再删除缓存

原因很直接：

- 直接双写数据库和缓存，很容易出现写入顺序竞态
- “更新缓存”比“删除缓存”更容易带上旧值覆盖新值

所以第一版通常优先：

- 读用 cache-aside
- 写用“写库后删缓存”

除非你已经把缓存封在很稳定的基础设施层里，否则不要急着上 write-through、write-behind 这类更复杂模式。

## Key、TTL 和数据形态要先收口

缓存最常出问题的地方，不是 API，而是 key 和数据边界。

### Key 设计

至少做到：

- 带业务前缀，例如 `user:profile:{user_id}`
- 带环境或租户维度时显式编码
- 不把原始 SQL、超长 JSON 直接塞进 key
- key 构造逻辑集中到一个模块，不要到处手拼字符串

如果你想把 tenant context、租户内唯一约束、缓存 key 和对象 key 一起放到同一条隔离主线里理解，继续看：

- [Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)

### TTL 设计

TTL 不应该靠拍脑袋。

先回答：

- 数据多久允许过期
- 写后最晚多久要看到新值
- 失效时能承受多大回源流量

几个务实建议：

- 热 key TTL 不要完全一样，适当加随机抖动
- 负缓存要比正常缓存 TTL 更短
- 没有明确失效策略时，不要随手设成超长 TTL
- 如果缓存只是数据库投影，TTL 应该服从业务可接受的不一致窗口

### 数据形态

缓存里更适合放：

- 已经脱离借用生命周期的拥有型数据
- 稳定、可序列化的读模型
- 比数据库实体更贴近读取场景的 view model

不要把带引用的对象、临时借用或过于巨大的聚合对象硬塞进缓存。

如果 DTO、读模型和序列化边界你还没完全理顺，可以继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- [Serde 与数据序列化实践](./serde-and-data-serialization.md)

## Rust 里本地缓存不要默认从 `Mutex<HashMap<...>>` 开始

小 demo 里用 `HashMap` 加锁没问题，但到了服务热路径，常见问题会立刻出现：

- 锁竞争
- 锁跨 `await`
- 容量没有边界
- 过期策略全靠手写

在读多写少、需要并发安全和 TTL 的场景里，更稳的进程内缓存通常是专门的 cache 结构，例如 `moka::future::Cache` 这种 futures-aware 并发缓存。

一个最小示意：

```rust
use std::{sync::Arc, time::Duration};

use moka::future::Cache;

#[derive(Debug)]
pub struct UserView {
    pub user_id: i64,
    pub display_name: String,
}

#[derive(Clone)]
pub struct UserLocalCache {
    inner: Cache<i64, Arc<UserView>>,
}

impl UserLocalCache {
    pub fn new() -> Self {
        let inner = Cache::builder()
            .max_capacity(10_000)
            .time_to_live(Duration::from_secs(60))
            .build();

        Self { inner }
    }

    pub async fn get_or_load<F, E>(&self, user_id: i64, loader: F) -> Result<Arc<UserView>, Arc<E>>
    where
        F: std::future::Future<Output = Result<Arc<UserView>, E>>,
        E: Send + Sync + 'static,
    {
        self.inner.try_get_with(user_id, loader).await
    }
}
```

这个方向的价值在于：

- 缓存值是拥有所有权的 `Arc<T>`
- 容量和 TTL 有明确边界
- 同一个 miss key 的并发加载可以合并，减少回源放大

如果只是想缓存一个计算结果，而不是构建完整缓存系统，本地缓存往往已经够用。

## Redis 在 Rust 里更适合作为“共享缓存边界”，不是散落的命令集合

更稳的做法通常是：

- 启动时初始化 Redis client 或连接管理器
- 封成缓存网关或 repository 风格的基础设施层
- 业务层只调用语义化方法

不要把 `GET`、`SETEX`、`DEL` 散落到 handler 和 service 各处。

一个更接近工程代码的示意：

```rust
use std::time::Duration;

use redis::{aio::ConnectionManager, AsyncCommands};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserCacheValue {
    pub user_id: i64,
    pub display_name: String,
}

#[derive(Clone)]
pub struct UserRedisCache {
    conn: ConnectionManager,
    ttl: Duration,
}

impl UserRedisCache {
    pub fn key(user_id: i64) -> String {
        format!("user:profile:{user_id}")
    }

    pub async fn get(&self, user_id: i64) -> anyhow::Result<Option<UserCacheValue>> {
        let key = Self::key(user_id);
        let mut conn = self.conn.clone();
        let raw: Option<String> = conn.get(key).await?;

        raw.map(|value| serde_json::from_str(&value))
            .transpose()
            .map_err(Into::into)
    }

    pub async fn set(&self, value: &UserCacheValue) -> anyhow::Result<()> {
        let key = Self::key(value.user_id);
        let mut conn = self.conn.clone();
        let payload = serde_json::to_string(value)?;

        conn.set_ex(key, payload, self.ttl.as_secs()).await?;
        Ok(())
    }

    pub async fn invalidate(&self, user_id: i64) -> anyhow::Result<()> {
        let key = Self::key(user_id);
        let mut conn = self.conn.clone();
        conn.del(key).await?;
        Ok(())
    }
}
```

这里更重要的是边界，不是某个命令本身：

- key 生成收口
- 序列化格式收口
- TTL 收口
- 失效策略收口

## Redis 连接复用要设计清楚

在 async Rust 里，Redis 连接不是“每次请求临时 new 一个”。

更稳的原则通常是：

- 初始化长期复用的 client / multiplexed connection / connection manager
- 请求路径只拿可并发复用的连接句柄
- 不在热路径反复创建客户端和重新建连

如果你需要自动重连和统一连接管理，`ConnectionManager` 这种封装通常比到处自己维护连接状态更稳。

## 两级缓存的默认顺序

如果真的需要两级缓存，读路径通常是：

1. 先查本地缓存
2. miss 再查 Redis
3. Redis miss 再查数据库
4. 回填 Redis
5. 再回填本地缓存

如果你想把按批扫描、checkpoint、限速执行和历史回填主线单独理顺，继续看：

- [Rust 批处理、回填与历史数据修复实践](./batch-processing-backfill-and-historical-repair-practice.md)

写路径则通常仍然优先：

1. 写数据库
2. 删除 Redis
3. 删除本地缓存

不要在多实例环境里只删本地缓存，不删共享缓存，否则其他实例仍然会继续读到旧值。

## 缓存击穿、穿透、雪崩要会用工程语言解释

### 缓存穿透

指的是：

- 请求反复查根本不存在的数据
- 缓存里没有
- 数据库里也没有
- 每次都回源

常见应对：

- 先做参数校验
- 对不存在结果做短 TTL 负缓存
- 只有在无效 key 流量极大时再考虑布隆过滤器

### 缓存击穿

指的是：

- 热 key 正好过期
- 大量并发同时 miss
- 一起打到数据库或下游

常见应对：

- 单 key 并发合并
- 热 key 预热
- 后台刷新
- 允许短时间返回旧值

### 缓存雪崩

指的是：

- 大量 key 在相近时间一起失效
- 整体回源流量瞬间放大

常见应对：

- TTL 加随机抖动
- 分批预热
- 限流和降级
- 本地缓存兜底

## 不要把“分布式锁重建缓存”当第一反应

很多人一想到击穿，就立刻想上 Redis 分布式锁。

但更稳的优先级通常是：

1. 单实例内先做单 key 请求合并
2. 再看是否允许短时间 stale 读
3. 再看是否需要后台刷新
4. 最后才评估分布式锁

原因很简单：

- 分布式锁引入额外失败模式
- 锁超时、锁续期、持锁崩溃都会增加复杂度
- 绝大多数热点缓存问题，先用本地合并和 TTL 策略就能解决大半

## 后台刷新适合什么，不适合什么

后台刷新适合：

- 热点只读配置
- 首页聚合视图
- 可接受秒级陈旧的派生数据

后台刷新不适合：

- 强一致写后立刻可见的数据
- 读取量不高但更新频繁的数据
- 你根本没有监控刷新失败的场景

如果你想把周期刷新、定时任务和关闭协同单独理顺，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- [Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)
- [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)

## 观测要直接回答“缓存到底有没有帮到系统”

缓存相关指标至少应该有：

- hit / miss 次数
- 命中率
- 回源耗时
- Redis 请求耗时
- 序列化失败次数
- 热 key 或单 key 错误放大情况

trace / log 字段建议至少包括：

- `cache.system`：`memory` 或 `redis`
- `cache.keyspace`：例如 `user_profile`
- `cache.hit`：是否命中
- `cache.op`：`get` / `set` / `del`

不要把完整 key 或用户敏感信息直接当高基数字段打进 metrics。

如果你想把 metrics、OTLP exporter 和 tracing 协同单独理顺，继续看：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- [Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)

## 测试不要只测“能 set/get”，要测边界

缓存相关测试更值得覆盖的是：

### 单元测试

- key 构造是否稳定
- TTL 选择是否符合策略
- miss 时是否按预期回源
- 写后是否触发失效

### 集成测试

- 接真实 Redis 验证序列化和失效
- 验证回源失败时不会写入脏缓存
- 验证并发 miss 时不会把下游打穿

### 压测或回归测试

- 热 key 过期瞬间是否出现明显尖峰
- Redis 故障时系统是否有降级路径
- 本地缓存大小是否可控

如果你想把 fake、stub、mock 和依赖隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 一组很实用的落地原则

1. 第一版优先 cache-aside，不要默认上复杂写策略。
2. 缓存值优先用拥有所有权的读模型，不要缓存借用引用。
3. key、TTL 和序列化逻辑必须集中，不要散落各层。
4. 本地缓存优先选有容量和 TTL 边界的结构，不要裸 `Mutex<HashMap<...>>`。
5. Redis 连接要长期复用，不要在热路径反复建连。
6. 热 key 防护先做请求合并和 TTL 策略，再考虑分布式锁。
7. 观测必须能区分命中、回源、失败和序列化问题。

## 自检问题

你至少应该能回答：

1. 什么数据适合进程内缓存，什么数据更适合 Redis？
2. 为什么默认写路径更常见的是“写库后删缓存”？
3. 两级缓存的读写顺序通常怎么设计？
4. 为什么缓存值应该尽量是拥有所有权的读模型？
5. 缓存穿透、击穿、雪崩分别是什么，最务实的第一手应对是什么？
6. 为什么不要把 `Mutex<HashMap<...>>` 直接当生产缓存方案？
7. Redis 故障时，系统应该有哪些最起码的降级和观测信号？

把这些问题讲清楚，你才算真正把 Rust 服务里的缓存边界收住了，而不只是“会调 Redis”。
