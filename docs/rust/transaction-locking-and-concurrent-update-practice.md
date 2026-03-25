---
title: Rust 事务、锁与并发更新实践
description: 从事务边界、隔离级别、条件更新、乐观锁、SELECT FOR UPDATE 到死锁和锁超时排障，整理 Rust 服务里的数据库写路径主线。
search: false
---

# Rust 事务、锁与并发更新实践

很多 Rust 服务一旦进入真实业务，很快就会碰到一类非常容易“功能看起来对，线上却出事”的问题：

- 两个请求同时扣库存，结果超卖
- 两个管理员同时改配置，后写覆盖前写
- worker 重试时把同一状态推进了两次
- 一个事务明明提交成功了，但业务结果还是不一致
- 数据库开始出现锁等待、死锁和慢事务

这些问题的共同点是：

**数据库写路径的并发控制边界没有被设计清楚。**

这页补的就是 Rust 服务里的事务、锁与并发更新主线。

## 先分清：事务、隔离级别、锁、幂等不是一回事

这几个词经常一起出现，但职责不同。

### 事务 transaction

回答的是：

- 这一组数据库写入要不要一起成功或一起失败

### 隔离级别 isolation

回答的是：

- 并发事务之间彼此能看到什么
- 某类并发异常有没有被数据库拦住

### 锁 locking

回答的是：

- 多个并发操作同时碰同一批数据时，谁先做、谁等待、谁失败

### 幂等 idempotency

回答的是：

- 同一业务意图重复执行时，副作用能不能被收住

一个务实原则通常是：

- 事务负责原子提交
- 锁负责并发协调
- 隔离级别负责可见性和冲突模型
- 幂等负责重复执行的业务结果可控

不要指望只靠其中一个概念，把所有并发写问题一次解决。

如果你想把重试、状态推进和 Outbox 一起理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 事务不是越大越稳

很多团队第一次处理一致性问题时，很容易下意识认为：

- “那我把更多逻辑包进一个大事务里就好了”

这通常会带来新的问题：

- 锁持有时间更长
- 冲突概率更高
- 吞吐下降
- 死锁更容易出现
- 事务里夹外部 RPC 后，失败语义会变得很难解释

更稳的原则通常是：

- 事务里只放本地数据库状态变更
- 事务越短越好
- 外部 HTTP、MQ、对象存储、文件 I/O 不要夹在事务里

一个很实用的判断标准是：

**如果这一步无法被数据库回滚，就不要轻易把它塞进数据库事务。**

## “事务提交成功”不等于“并发更新一定正确”

这是很多人最容易误解的一点。

例如一个常见坏味道：

1. 查库存是 `10`
2. 应用层判断够扣
3. 扣减 `3`
4. 另一个并发请求也做了同样流程

如果两边都只是：

- 先查
- 再在应用层计算
- 再写回

那即使两个事务都提交成功，结果仍然可能错误。

这类问题通常叫：

- lost update
- check-then-act race

Rust 本身不会自动替你挡住这种数据库并发写问题。

真正更稳的关键通常是：

- 把约束写进 SQL
- 用条件更新、版本号或显式锁把竞争收住

## 优先考虑单语句原子更新和条件更新

很多写路径其实并不需要先查一遍再决定要不要写。

更稳的做法通常是：

- 让 SQL 直接表达前置条件

例如库存扣减：

```sql
UPDATE inventory
SET available = available - $1
WHERE sku_id = $2
  AND available >= $1
```

在 Rust / `sqlx` 里更像：

```rust
pub async fn reserve_inventory(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    sku_id: i64,
    qty: i32,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        UPDATE inventory
        SET available = available - $1
        WHERE sku_id = $2
          AND available >= $1
        "#,
        qty,
        sku_id,
    )
    .execute(&mut **tx)
    .await?;

    Ok(result.rows_affected() == 1)
}
```

这里最重要的不是 API，而是语义：

- `rows_affected == 1`：本次扣减成功
- `rows_affected == 0`：库存不足，或已经被并发请求抢先更新

这种写法通常比：

- 先 `SELECT`
- 再在应用层判断
- 再 `UPDATE`

稳得多。

## 乐观锁适合“有冲突，但不是一直高冲突”的场景

乐观锁最常见的做法是：

- 表里加 `version`
- 更新时带上旧版本条件
- 成功后把版本号加一

例如：

```sql
UPDATE documents
SET title = $1,
    content = $2,
    version = version + 1
WHERE id = $3
  AND version = $4
```

它更适合的场景通常是：

- 表单编辑保存
- 配置更新
- 管理后台修改资源
- 冲突不是极高频，但不能默默覆盖前一个人的修改

它的核心价值是：

- 不阻塞别人先读
- 提交时明确检测“我基于的旧状态是不是已经变了”

这比“最后一次写入覆盖前一次写入”更稳。

如果乐观锁命中失败，常见处理通常是：

- 返回冲突错误
- 提示前端刷新后重试
- 或把最新状态返回给调用方重新确认

## 悲观锁适合“必须先占住再做”的场景

有些操作更像：

- 先锁住一行或几行
- 再在事务里继续处理

这时常见做法就是：

- `SELECT ... FOR UPDATE`

更适合的场景通常包括：

- 账户转账要先锁住两边账户行
- 后台任务从数据库任务表里 claim 工作项
- 某个资源必须串行推进状态

一个典型示意：

```sql
SELECT id, status
FROM jobs
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1
```

这类写法常用于：

- 多个 worker 并发从任务表里取任务
- 避免多个 worker 抢到同一行

但要注意：

- 锁住以后事务必须尽快提交
- 不能锁住以后还去调外部 RPC
- 锁顺序不一致时很容易死锁

一个务实原则通常是：

- 乐观锁更适合编辑冲突检测
- 悲观锁更适合必须串行占用资源的场景

## 隔离级别要围绕并发异常理解，不要只背名字

很多人会背：

- `READ COMMITTED`
- `REPEATABLE READ`
- `SERIALIZABLE`

但真正更重要的是：

- 你要防哪类异常
- 防这个异常值不值得付额外代价

更务实的理解通常是：

### 默认隔离级别

很多系统会先用数据库默认值。

这通常足够承接：

- 普通查询
- 大部分简单写路径

但前提是：

- 关键写操作已经用条件更新、版本号或显式锁表达清楚

### 更强隔离级别

适合：

- 业务上必须更强保证
- 冲突检测希望更多交给数据库

代价通常是：

- 吞吐下降
- 冲突回滚和重试增多

一个很实用的原则是：

**先把业务约束写进 SQL，再考虑是否需要更强隔离级别，而不是反过来指望隔离级别替你补业务条件。**

## 锁顺序、锁等待和死锁要提前当成设计问题

锁问题很多时候不是数据库“突然抽风”，而是写路径本身没有统一顺序。

最常见的死锁来源通常是：

1. 事务 A 先锁账户 1，再锁账户 2
2. 事务 B 先锁账户 2，再锁账户 1

这时就很容易互相等待。

更稳的做法通常是：

- 对同类资源统一加锁顺序
- 例如总是按主键从小到大锁

除此之外，还应该注意：

- 长事务会放大锁等待
- 批量更新更容易扩大锁范围
- 重试如果没有退避，会把冲突进一步放大

很值得观测的信号包括：

- 锁等待时间
- 死锁错误数
- 事务时长
- 行冲突重试次数

如果你想把 timeout、限流和过载保护单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## service 层决定并发控制策略，repo 层负责把 SQL 落准

Rust 服务里很稳的一种分工是：

- route：只处理 HTTP 输入输出
- service：决定事务边界和并发控制策略
- repo：负责执行 SQL

例如：

```rust
pub async fn transfer(
    pool: &sqlx::PgPool,
    from_id: i64,
    to_id: i64,
    amount: i64,
) -> Result<(), TransferError> {
    let mut tx = pool.begin().await?;

    let (first, second) = if from_id < to_id {
        (from_id, to_id)
    } else {
        (to_id, from_id)
    };

    repo::lock_account(&mut tx, first).await?;
    repo::lock_account(&mut tx, second).await?;

    if !repo::debit(&mut tx, from_id, amount).await? {
        return Err(TransferError::InsufficientBalance);
    }

    repo::credit(&mut tx, to_id, amount).await?;
    tx.commit().await?;
    Ok(())
}
```

这里最重要的不是示例本身，而是几个边界：

- service 决定事务开始和提交
- service 决定锁顺序
- repo 不擅自决定业务并发策略

这样测试和排障都会清楚很多。

## 怎么选：条件更新、乐观锁、悲观锁、串行化

可以先用这套务实判断：

### 单资源计数、额度、库存扣减

优先考虑：

- 单语句原子更新
- 条件更新

### 管理后台编辑、配置修改、协作文档

优先考虑：

- 乐观锁
- `version` 字段

### 任务 claim、资金划转、必须串行处理的资源

优先考虑：

- 显式事务
- `FOR UPDATE`
- 统一锁顺序

### 极少数必须让数据库替你做最强冲突检测的场景

再考虑：

- 更强隔离级别
- 失败重试

真正要避免的是：

- 什么都先查再写
- 什么都开大事务
- 什么都上最强隔离级别

## 测试重点不是“能成功写一次”，而是“并发写十次还正确”

事务和锁相关测试，很容易只写出：

- 单线程 happy path

这远远不够。

更值得覆盖的通常是：

### 1. 并发集成测试

例如：

- 两个 Tokio task 同时扣同一库存
- 两个请求同时更新同一配置
- 多个 worker 同时 claim 任务

### 2. 冲突路径测试

验证：

- 乐观锁失败是否映射成预期错误
- `rows_affected == 0` 是否被正确解释
- 锁等待或死锁后的重试策略是否合理

### 3. 事务边界测试

验证：

- 失败时是否真正回滚
- 外部副作用有没有被错误放进事务

如果你想把替身、异步测试和边界隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 常见误区

### 误区 1：先查再写就够了

并发下这通常是最典型的竞争条件来源。

### 误区 2：用了事务就不用考虑锁

事务只说明一起提交，不说明并发冲突一定按你想的方式被处理。

### 误区 3：事务里夹外部 RPC 更安全

这通常只会把锁持有时间、超时和失败语义一起放大。

### 误区 4：把乐观锁和悲观锁混着用，但没有明确理由

最后很容易得到一个既慢又难解释的系统。

### 误区 5：死锁是数据库偶发问题，不是应用设计问题

很多死锁本质上都是锁顺序和事务边界不一致导致的。

### 误区 6：多实例服务里还想靠进程内 `Mutex` 守数据库一致性

这只能保护单进程内存，保护不了数据库全局并发写。

## 推荐回查入口

- 数据访问主线：[SQLx 数据库访问实践](./sqlx-database-practice.md)
- 幂等与状态推进：[Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)
- 后台任务主线：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 消息驱动主线：[Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)
- 列表查询边界：[Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)
- 删除与恢复并发语义：[Rust 软删除、恢复与删除语义实践](./soft-delete-restore-and-deletion-semantics-practice.md)
- 服务落地模板：[Axum + SQLx 服务落地模板](./axum-sqlx-service-template.md)
- 性能排障：[Rust 性能分析与 Profiling 指南](./performance-and-profiling-guide.md)

## 自检

你至少应该能回答：

1. 为什么事务提交成功并不自动意味着并发更新结果正确？
2. 为什么很多库存、额度、状态推进场景更适合条件更新，而不是先查再写？
3. 乐观锁和 `SELECT ... FOR UPDATE` 分别更适合什么场景？
4. 为什么更强隔离级别不能替代业务条件和锁顺序设计？
5. 为什么事务、锁和并发更新的测试重点必须放在并发冲突路径，而不只是单线程成功路径？

这些问题理顺后，Rust 服务里的数据库写路径才会从“能写成功”进入“并发下也能写对”的状态。
