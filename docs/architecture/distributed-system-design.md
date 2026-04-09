---
title: 分布式系统设计详解
description: 从 CAP、Paxos、时钟回拨、幂等、TCC、事务消息到 TrueTime、LSM-Tree、MVCC 与 Raft，系统梳理分布式系统设计的核心难题和生产级解法。
---

# 分布式系统设计详解

## 适合人群

- 正在搭建分布式系统设计主线的后端工程师
- 准备系统设计、架构评审或高级面试的人
- 想把 ID、幂等、锁、事务、共识和补偿串成一套完整框架的人

## 学习目标

- 理解分布式系统里最常见的几个核心矛盾
- 知道数据唯一性、并发互斥和跨服务一致性分别该用什么手段
- 理解一致性模型、事务消息和 Raft 在整体架构中的位置
- 理解 Paxos、LSM-Tree、MVCC、TrueTime 等底层机制为什么会影响上层架构
- 能根据业务场景在一致性、可用性、性能和复杂度之间做取舍

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [一、先看分布式系统真正难在哪里](#一先看分布式系统真正难在哪里)
- [二、数据分布唯一性与防重](#二数据分布唯一性与防重)
- [三、分布式事务与回滚](#三分布式事务与回滚)
- [四、一致性模型全景](#四一致性模型全景)
- [五、分布式存储与数据库内核原理](#五分布式存储与数据库内核原理)
- [六、Raft 协议深入](#六raft-协议深入)
- [七、生产级架构模式与实践](#七生产级架构模式与实践)
- [八、系统设计时的回答框架与决策树](#八系统设计时的回答框架与决策树)
- [相关阅读](#相关阅读)

<script setup>
import InlineSvg from '@docs-components/InlineSvg.vue'
</script>

## 架构全景图

<InlineSvg src="/architecture/distributed-system-design-diagram.svg" alt="分布式系统设计全景架构图" />

## 一、先看分布式系统真正难在哪里

分布式系统真正难的，通常不是“某个组件怎么用”，而是下面这些现实同时存在：

- 节点会宕机，网络会抖动，调用结果经常处于“不确定到底成没成功”的状态
- 请求会超时和重试，同一笔业务很容易被执行多次
- 服务、数据库、消息系统各自独立部署，无法天然共享一个本地事务
- 时钟并不可靠，不同机器上的时间不一定完全一致

### 1. CAP 应该怎么落到工程里理解

CAP 不是一句“只能三选二”就结束了，真正对工程有用的理解是：

- `P` 几乎无法放弃，因为线上系统一定会面对网络分区和节点失联
- 真正要取舍的，通常是在分区发生时更偏向 `C` 还是更偏向 `A`
- 多数互联网业务入口链路更偏 `BASE / 最终一致性`，通过幂等、补偿、对账把结果收敛回来
- 但少数高价值链路仍会在局部追求更强的一致性，比如余额、账务、配置元数据

也就是说，现实系统通常不是“整站永久选 AP”或“整站永久选 CP”，而是：

- `用户入口和高可用链路` 更偏可用性
- `核心账务和状态收口链路` 更偏一致性

### 2. 为什么一致性问题总会放大

一旦系统拆成多个节点，下面这些问题就会同时出现：

- `唯一性`：同一笔业务怎么拿到稳定不冲突的主键
- `幂等`：重试、重复回调、重复消费时怎么保证结果不被反复改写
- `互斥`：并发修改同一资源时，怎么防止超卖和重复处理
- `事务`：跨服务、跨库、跨消息系统时怎么最终收敛

这也是为什么分布式系统设计里，最常一起出现的几个关键词总是：

- `分布式 ID`
- `幂等`
- `状态机`
- `分布式锁`
- `补偿`
- `对账`

### 3. 共识协议的本质：FLP 与 Paxos

很多人是先学 Raft，再回头看 Paxos。工程上这条路径没问题，但如果想真正理解共识边界，最好还是知道两个底层事实：

- `FLP` 告诉你为什么共识不可能在完全异步且允许故障的世界里既绝对安全又绝对保证终止
- `Paxos` 告诉你为什么多数派、提案号和“不覆盖已被接受的值”会成为共识协议的核心约束

需要先澄清一点：

- `Raft` 不是从 `Basic Paxos` 逐行简化出来的版本
- 但它和 `Multi-Paxos` 解决的是同一类问题，正常路径和工程取舍高度相似

#### FLP 不可能定理意味着什么

FLP 的核心结论可以概括为：

> 在异步网络中，只要允许一个节点崩溃，就不存在一个既保证安全又保证总能终止的确定性共识算法。

它对工程的真正意义是：

- 共识协议一定更优先保证 `Safety`
- `Liveness` 往往依赖超时、随机化或故障恢复假设

也就是说，共识协议面对的根本矛盾不是“能不能达成一致”，而是：

- `不会决定错`
- 和
- `最终能决定`

这两个目标无法在最弱假设下同时无条件成立。

#### Basic Paxos 的两阶段

Basic Paxos 有三个角色：

- `Proposer`：提出值
- `Acceptor`：接受提案
- `Learner`：学习最终结果

第一阶段是 `Prepare / Promise`：

- Proposer 选择提案号 `n`
- 向多数派 Acceptor 发送 `Prepare(n)`
- Acceptor 若发现 `n` 大于自己见过的提案号，就承诺不再接受更小的提案，并返回自己已接受过的最高编号提案

第二阶段是 `Accept / Accepted`：

- Proposer 收到多数派 Promise 后
- 如果返回结果里已经存在某个值，就必须选择“提案号最高的那个已接受值”
- 如果没有任何已接受值，才可以自由提自己的值
- 然后发送 `Accept(n, v)` 给多数派

最关键的不变量在这里：

- `Phase 2` 不能随便换值
- 必须继承已被更高优先级历史提案保护过的值

否则就可能覆盖一个已经被多数派接受、但 Learner 还没来得及完全学到的值。

#### Paxos 为什么容易活锁

如果同时有多个 Proposer 并发竞争，就可能出现这种循环：

```text
Proposer A: Prepare(1) -> 多数派承诺
Proposer B: Prepare(2) -> 多数派承诺，A 失效
Proposer A: Accept(1)  -> 被拒绝
Proposer A: Prepare(3) -> 多数派承诺，B 失效
Proposer B: Accept(2)  -> 被拒绝
... 重复竞争
```

这就是为什么工程实现里通常会引入：

- `稳定 Leader`
- `租约 / 心跳`
- `随机超时`

本质上，`Multi-Paxos` 和 `Raft` 都是在想办法让“绝大多数提案只由一个 Leader 连续发起”。

## 二、数据分布唯一性与防重

如果没有稳定的业务主键、防重屏障和可控的数据分布策略，后面的事务编排、缓存路由和补偿恢复都会失去抓手。

### 1. 分布式 ID 生成

单机自增 ID 在多节点下天然会冲突，所以分布式系统必须先解决“唯一标识从哪里来”。

#### Snowflake

经典雪花算法的位分布大致如下：

```text
| 1 bit 符号位 | 41 bit 时间戳 | 10 bit 机器 ID | 12 bit 序列号 |
```

特点：

- 每毫秒每节点最多可生成 `4096` 个不重复 ID
- 趋势递增，适合作为数据库主键
- 生成速度快，不依赖数据库

风险：

- 强依赖时钟，必须处理 `时钟回拨`
- 机器 ID 分配不能重复

常见工程做法：

- 用 `NTP` 保持时间同步
- 在本地检测到时间回拨时，进入短暂等待或切换备用序列
- 把机器 ID 统一放到配置中心、ZooKeeper 或数据库里分配

常见变种：

- `Leaf-Snowflake`
- `百度 uid-generator`

#### 时钟回拨要处理到什么程度

Snowflake 最大的生产风险，不是吞吐，而是 `时钟回拨` 导致 ID 重复。

一个更接近生产实践的写法大致如下：

::: details 点击查看代码：Snowflake 时钟回拨处理
```go
type SnowflakeGenerator struct {
	mu            sync.Mutex
	lastTimestamp int64
	sequence      int64
	machineID     int64
	epoch         int64
}

const maxBackwardMS = 5

func (g *SnowflakeGenerator) NextID() (int64, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	current := time.Now().UnixMilli()

	if current < g.lastTimestamp {
		offset := g.lastTimestamp - current
		if offset <= maxBackwardMS {
			time.Sleep(time.Duration(offset<<1) * time.Millisecond)
			current = time.Now().UnixMilli()
			if current < g.lastTimestamp {
				return 0, errors.New("clock moved backwards")
			}
		} else {
			g.switchToBackupEpoch()
			current = time.Now().UnixMilli()
		}
	}

	if current == g.lastTimestamp {
		g.sequence = (g.sequence + 1) & 0xFFF
		if g.sequence == 0 {
			current = g.waitNextMillis(g.lastTimestamp)
		}
	} else {
		g.sequence = 0
	}

	g.lastTimestamp = current
	return ((current - g.epoch) << 22) | (g.machineID << 12) | g.sequence, nil
}
```
:::

真正生产可用时，通常不会只靠一段代码兜底，而是把保护做成多层：

- `NTP / Chrony` 使用平滑校时，避免大幅时间跳变
- 启动时从 Redis 或 DB 读取最近一次最大时间戳，如果本机时间更小则拒绝启动
- 运行时持续监控时间偏移和回拨次数，超过阈值直接熔断 ID 服务
- 多机房给不同 `DC` 预留不同机器 ID 段，降低跨机房冲突面
- 极端情况下用 `备用 epoch 位`、切换备用机器号段或直接报警停发

这类设计的核心原则是：

- 小回拨可以等
- 大回拨不能硬扛，必须告警和熔断

#### 数据库号段模式

如果更在意稳定性而不是极致低延迟，号段模式是另一条常见路线。

```sql
UPDATE id_alloc
SET max_id = max_id + step,
    version = version + 1
WHERE biz_tag = 'order'
  AND version = #{oldVersion};
```

做法是：

- 服务一次性从数据库申请一整段号码
- 本地缓存这一段 ID，按需发号
- 快用完时提前异步预取下一段

工程上常见优化：

- `双 Buffer` 预加载，避免号段切换时阻塞业务
- 不同业务分别维护 `biz_tag`

典型实现：

- `Leaf-Segment`

#### UUID / ULID

- `UUID v4`：随机性强，但完全无序，拿来做聚簇索引主键会导致 B+ 树页分裂频繁
- `ULID`：时间戳前缀 + 随机部分，整体更有序，索引友好度比 UUID 更高

更适合什么场景：

- 只要唯一即可，不强调趋势递增：可以选 `UUID / ULID`
- 既要高性能又要相对有序：优先考虑 `Snowflake`
- 想把复杂度压到数据库侧统一治理：考虑 `号段模式`

### 2. 幂等性设计

在分布式环境里，重试不是异常，而是常态。

需要幂等的典型场景包括：

- 用户重复点击提交
- 客户端超时后自动重试
- MQ 至少一次投递带来的重复消费
- 第三方支付或 Webhook 的重复回调

真正的幂等，不是“每次都返回一样的报文”，而是：

> 同一业务请求执行一次和执行多次，系统最终状态相同。

#### Token 机制

常见做法：

1. 客户端先申请一个 `idempotent_token`
2. 服务端把 token 写入 Redis，并设置短 TTL，比如 `5 分钟`
3. 提交业务请求时携带 token
4. 服务端用原子操作消费 token，消费成功才允许执行业务

适合：

- 下单
- 表单提交
- 防止用户重复点击

#### 唯一索引去重

如果业务本身就有天然唯一键，最稳妥的办法通常是直接让数据库兜底。

```sql
CREATE UNIQUE INDEX uk_order_no ON orders(order_no);
```

重复写入时：

- 数据库直接抛 `DuplicateKey`
- 业务层捕获后返回“已存在”或查回既有结果

适合：

- 订单号
- 支付流水号
- 业务幂等号

#### 状态机防重

对于状态流转类业务，最强的屏障往往不是锁，而是 `条件更新 + 状态机`。

```sql
UPDATE orders
SET status = '已支付'
WHERE id = ?
  AND status = '支付中';
```

如果 `affected_rows = 0`，通常说明：

- 已经被其他请求处理过
- 当前状态不允许继续前进

这种方式非常适合：

- 订单支付回调
- 退款状态推进
- 审批流状态修改

#### 消费幂等

消息消费场景里，通常需要把 `message_id` 或 `business_id` 作为幂等键：

- 处理前检查是否已消费
- 处理成功后记录消费完成标记
- 重复消息直接返回成功

最常见的误区是：

- 只在 MQ 层假设“不会重复”
- 却没有在业务层做最终幂等屏障

### 3. 分布式锁

分布式锁的目标是做 `互斥`，但它不应该替代：

- 唯一索引
- 数据库条件更新
- 业务状态机

更稳妥的理解是：

- `能不用锁就不用锁`
- `能用状态机和条件更新解决，就不要先上分布式锁`

#### Redis 锁

Redis 锁最常见的基本形式如下：

```text
SET lock:resource_id <uuid> NX PX 30000
```

释放时需要用 Lua 脚本保证原子性：

```lua
if redis.call("get", key) == uuid then
    return redis.call("del", key)
end
return 0
```

适合：

- 防止重复提交
- 短临界区互斥
- 性能优先的场景

注意点：

- value 必须是唯一值，避免误删他人锁
- 业务执行时间可能超过过期时间时，需要续约机制
- Redis 锁更适合“工程互斥”，不适合拿来替代真正的强一致事务

#### Redis 锁真正难的是租约过期后的脑裂

很多争议其实不在“能不能加锁成功”，而在“锁过期后，旧持有者会不会继续写”。

经典危险场景如下：

```text
Client A 获锁，TTL = 10s
Client A 触发 GC STW，暂停 15s
锁自动过期
Client B 获锁并开始写入
Client A GC 恢复后继续执行，以为自己仍然持锁
```

这时即使你的解锁逻辑是安全的，也已经发生了 `逻辑脑裂`。

所以真正要问的不是：

- 锁有没有拿到

而是：

- 旧持有者即使“自以为有锁”，下游是否还能拒绝它的过期写入

#### Fencing Token 才能把脑裂问题收到底

比较稳妥的解法是 `Fencing Token`：

1. 获锁时，锁服务返回一个单调递增的 token
2. 每次写入都携带这个 token
3. 存储层拒绝小于等于当前 token 的写入

示意代码如下：

::: details 点击查看代码：Fencing Token 校验
```go
func (s *Store) Write(key, value string, fencingToken int64) error {
	current, _ := s.tokenStore.LoadOrStore(key, int64(0))
	if fencingToken <= current.(int64) {
		return errors.New("fencing check failed: stale token")
	}
	s.tokenStore.Store(key, fencingToken)
	s.dataStore.Store(key, value)
	return nil
}
```
:::

这里最关键的一点是：

- `锁服务返回 token` 不够
- `存储层愿意校验 token` 才算真正闭环

如果下游存储根本不参与比较，那么即使使用了 RedLock 或续约机制，也仍然无法彻底解决 GC、网络暂停或长尾卡顿带来的旧写入问题。

很多资料会提到 `RedLock`。它适合讨论高可用锁，但如果业务是资金级、账务级或对锁语义要求极高，通常更推荐把关键正确性放回数据库条件更新、状态机或 ZooKeeper / etcd 这类一致性组件上。

#### ZooKeeper 临时顺序节点

典型结构如下：

```text
/locks/order_lock/
  ├── node-0000000001  <- 持锁者
  ├── node-0000000002  <- 监听前一个节点
  └── node-0000000003
```

特点：

- 天然公平锁
- 会话断开后临时节点自动删除
- 更适合需要明确锁语义的场景

缺点：

- 性能通常低于 Redis
- 引入的基础设施成本更高

一个常见选型经验是：

- `防重和轻量互斥`：优先 Redis
- `公平性、明确租约语义、更强一致预期`：优先 ZooKeeper / etcd

### 4. 一致性哈希的工程细节

一致性哈希解决的是：

- 节点增减时，尽量少迁移数据
- 分布式缓存或分片场景下，把 key 稳定路由到节点

但基础版一致性哈希很快就会遇到两个问题：

- 节点少时，环上分布很不均匀
- 单节点故障时，压力容易集中转移到某一个后继节点

#### 虚节点为什么几乎是标配

工程上通常不会让一个物理节点只占一个点，而是给它分配很多虚节点：

- 每个物理节点映射成 `150 ~ 200` 个虚节点
- 这样负载更容易在全环上均匀分散
- 某个物理节点下线后，它负责的流量会被很多节点共同接管

```text
物理节点 A -> A#1, A#2, A#3, ...
物理节点 B -> B#1, B#2, B#3, ...
物理节点 C -> C#1, C#2, C#3, ...
```

这样做的收益是：

- 数据倾斜更小
- 节点故障时扩散更均匀

#### 热点 key 不会被一致性哈希自动解决

一致性哈希只能解决“平均分布”，解决不了“某个 key 特别热”。

典型做法是先识别热 key，再做局部打散：

::: details 点击查看代码：热点 Key 探测
```go
type HotKeyDetector struct {
	counter sync.Map // map[string]*atomic.Int64
}

const hotThreshold = 1000

func (d *HotKeyDetector) IsHot(key string) bool {
	val, _ := d.counter.LoadOrStore(key, &atomic.Int64{})
	cnt := val.(*atomic.Int64)
	cnt.Add(1)
	return cnt.Load() > hotThreshold
}
```
:::

一旦识别为热 key，可以做：

- 本地缓存兜底
- 多副本缓存
- key 加随机后缀打散

例如：

```go
shardedKey := fmt.Sprintf("%s#%d", hotKey, rand.IntN(16))
```

当然，打散后的代价也很明确：

- 读路径需要聚合
- 删除和失效逻辑更复杂
- 强一致更新会更难做

## 三、分布式事务与回滚

跨服务、跨库、跨消息系统时，最难的问题不再是“单条 SQL 能不能回滚”，而是：

- 某一步成功、下一步失败了怎么办
- 回滚消息丢了怎么办
- 补偿被重复执行怎么办

### 1. 2PC

两阶段提交的基本思路是先让所有参与者 `Prepare`，全部同意后再统一 `Commit`。

```text
协调者                参与者 A                参与者 B
  |---- Prepare ----->|                        |
  |---- Prepare ----------------------------->|
  |<--- Vote: Yes ----|                        |
  |<--- Vote: Yes ----------------------------|
  |---- Commit ------>|                        |
  |---- Commit ------------------------------>|
```

优点：

- 思路直接
- 对“统一提交或统一回滚”的表达最强

缺点：

- 协调者单点故障会导致参与者阻塞
- 网络分区下提交消息丢失，恢复很麻烦
- 资源锁持有时间长，吞吐差

适合：

- 参与方少
- 链路短
- 对强一致要求非常高
- 能接受较低性能

现实里的判断通常是：

- `2PC 是保守方案`
- `不是互联网微服务的默认方案`

### 2. TCC

TCC 会把一个业务动作拆成三个阶段：

- `Try`：预留资源，比如冻结库存、冻结余额
- `Confirm`：真正提交，比如扣减库存、扣减余额、生成订单
- `Cancel`：释放预留资源

库存服务的示意代码如下：

::: details 点击查看代码：TCC 库存三阶段
```go
// Try：冻结库存
func (s *InventoryService) TryReserve(txID string, productID, qty int) error {
	return s.inventoryDAO.Freeze(txID, productID, qty)
}

// Confirm：真正扣减
func (s *InventoryService) Confirm(txID string) error {
	return s.inventoryDAO.DeductFrozen(txID)
}

// Cancel：释放冻结
func (s *InventoryService) Cancel(txID string) error {
	return s.inventoryDAO.Unfreeze(txID)
}
```
:::

TCC 的优势是：

- 业务控制力很强
- 每一步语义明确
- 适合资金、库存这类强业务约束场景

但代价也很明显：

- 对业务侵入重
- 开发和测试成本高
- Confirm / Cancel 都必须可重试、可幂等

最关键的三个坑是：

- `空回滚`：Try 没执行，Cancel 却到了，Cancel 也必须返回成功
- `悬挂`：Cancel 先执行，后续 Try 不能再落地
- `幂等`：Confirm / Cancel 都可能重复调用

所以 TCC 不是“比本地事务复杂一点”，而是：

- 需要你把业务动作显式拆开
- 需要你自己承担回滚语义设计

#### TCC 的三大异常要先落成状态机

TCC 最稳的做法，通常不是直接写三个接口，而是先设计一张 `tx_record` 状态表。

```text
INIT --Try--> TRYING --Confirm--> CONFIRMED
  |               |
  |               +--Cancel-----> CANCELLED
  |
  +--Cancel---------------------> CANCELLED
```

几种高频异常分别对应：

- `空回滚`：INIT 状态直接收到 Cancel，记录 CANCELLED 并返回成功
- `悬挂`：已经 CANCELLED 后又收到 Try，直接拒绝执行
- `幂等`：同一个 txId 重复到达，按当前状态短路返回

Try 和 Cancel 的示意写法如下：

::: details 点击查看代码：TCC 防悬挂与空回滚
```go
// TryDeductStock 在事务中执行
func (s *InventoryService) TryDeductStock(ctx context.Context, txID string, productID, qty int) error {
	return s.db.WithTx(ctx, func(tx *sql.Tx) error {
		record, err := s.txRecordDAO.SelectByTxID(tx, txID)
		if err != nil {
			return err
		}

		if record != nil && record.Status == StatusCancelled {
			return nil // 悬挂：已经 Cancel 过，拒绝 Try
		}
		if record != nil && record.Status == StatusTrying {
			return nil // 幂等：重复 Try，直接返回
		}

		affected, err := s.inventoryDAO.Freeze(tx, productID, qty)
		if err != nil {
			return err
		}
		if affected == 0 {
			return ErrInsufficientStock
		}

		return s.txRecordDAO.Insert(tx, &TxRecord{TxID: txID, Status: StatusTrying, ProductID: productID, Qty: qty})
	})
}

// CancelDeductStock 在事务中执行
func (s *InventoryService) CancelDeductStock(ctx context.Context, txID string) error {
	return s.db.WithTx(ctx, func(tx *sql.Tx) error {
		record, err := s.txRecordDAO.SelectByTxID(tx, txID)
		if err != nil {
			return err
		}

		if record == nil {
			// 空回滚：Try 未到达，记录 CANCELLED 防悬挂
			return s.txRecordDAO.Insert(tx, &TxRecord{TxID: txID, Status: StatusCancelled})
		}
		if record.Status == StatusCancelled {
			return nil // 幂等
		}

		if err := s.inventoryDAO.Unfreeze(tx, record.ProductID, record.Qty); err != nil {
			return err
		}
		return s.txRecordDAO.UpdateStatus(tx, txID, StatusCancelled)
	})
}
```
:::

Confirm 也遵循同一原则：

- 已经 `CONFIRMED` 就直接返回
- 已经 `CANCELLED` 就拒绝继续推进
- 真正扣减前后都必须带状态校验

### 3. Saga

Saga 更适合微服务里的 `长事务流程`。

它的思路不是全局锁住资源，而是：

- 把大事务拆成多个本地事务
- 某一步失败后，逆序执行补偿事务

典型链路如下：

```text
T1(下单) -> T2(扣库存) -> T3(扣余额) -> T4(通知物流)
                                      |
                                      v
C4(取消通知) <- C3(退余额) <- C2(还库存) <- C1(取消订单)
```

常见有两种实现方式：

| 方式 | 控制方式 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 编排式 Orchestration | 中央协调器驱动流程 | 流程清晰，监控和排障更容易 | 协调器可能成为瓶颈 | 跨多个服务的复杂流程 |
| 协同式 Choreography | 各服务监听事件自行推进 | 去中心化，耦合更低 | 事件链路容易分散，追踪困难 | 步骤较少的事件驱动流程 |

Saga 的关键不是“有补偿”这么简单，而是补偿本身必须满足：

- `幂等`
- `可重试`
- `有足够上下文`
- `最终能成功，失败时有人接手`

#### Saga 最难的不是补偿，而是补偿失败

补偿事务本身也可能失败，这是 Saga 最容易被低估的地方。

常见收口策略有三类：

- `无限重试 + 退避`：适合补偿理论上最终一定能成功的场景
- `人工介入队列`：适合补偿可能永久失败的场景
- `向前恢复`：适合“继续完成再额外补偿”比回滚更现实的场景

例如物流已揽件时，继续履约再做补偿，往往比强行回滚更合理。

编排器的核心逻辑通常类似这样：

::: details 点击查看代码：Saga 编排器核心逻辑
```go
type SagaOrchestrator struct {
	manualQueue ManualInterventionQueue
}

func (o *SagaOrchestrator) Execute(saga *SagaDefinition, ctx *SagaContext) error {
	var completed []SagaStep

	for _, step := range saga.Steps {
		if err := retryWithBackoff(func() error { return step.Execute(ctx) }, 3); err != nil {
			o.compensate(reverse(completed), ctx)
			return fmt.Errorf("saga failed: %w", err)
		}
		completed = append(completed, step)
	}
	return nil
}

func (o *SagaOrchestrator) compensate(steps []SagaStep, ctx *SagaContext) {
	for _, step := range steps {
		if err := retryWithBackoff(func() error { return step.Compensate(ctx) }, math.MaxInt); err != nil {
			o.manualQueue.Send(&ManualTask{Step: step, Ctx: ctx, Err: err})
		}
	}
}
```
:::

这里最重要的不是代码形式，而是两个约束：

- 补偿动作必须幂等
- 补偿失败绝不能静默丢失，必须进人工处理队列

### 4. 本地消息表 / Outbox

如果业务核心是“本地事实写成功后，把事件可靠发给下游”，那么本地消息表通常是最实用的最终一致性方案之一。

标准流程是：

1. 在同一个本地事务里，同时写业务表和消息表
2. 后台任务扫描 `PENDING` 消息并发送到 MQ
3. 消费方处理成功后回写完成状态
4. 超时未完成的消息继续重试

示意如下：

```sql
INSERT INTO orders (...);
INSERT INTO local_messages(biz_id, topic, status) VALUES (..., ..., 'PENDING');
```

它的优势是：

- 不需要全局锁
- 与主业务事务边界清晰
- 非常适合异步解耦场景

它的前提是：

- 消费方必须幂等
- 必须有重试和死信兜底
- 最好有对账任务做最终收口

如果团队已经有成熟的 MQ 事务消息能力，也可以把它理解为同一类问题的另一种实现方式，本质目标都是：

- `让本地事实和下游传播尽量一致`

#### Outbox 可以从“扫表版”升级到 “CDC 版”

传统本地消息表是：

- 业务写表
- 定时任务扫 `PENDING`
- 再发 MQ

再往前走一步，可以把发送职责交给 `CDC`：

```text
┌──────────────────────────────────┐
│           业务数据库              │
│  ┌──────────┐  ┌──────────────┐ │
│  │ orders   │  │ outbox_events│ │
│  └──────────┘  └──────────────┘ │
│      同一个本地事务内提交         │
└──────────────────────────────────┘
               |
               v
        Debezium / Flink CDC
               |
               v
             Kafka
               |
               v
            下游服务
```

这种方式的优势是：

- 业务代码不用自己负责发送 MQ
- 可以减少扫表任务的压力
- 更适合一份业务事实分发到多个下游

但要注意：

- 这不等于天然拥有端到端 `exactly-once`
- 真正落地时，仍应按 `at-least-once + 幂等消费` 设计业务

### 5. 事务消息

RocketMQ 事务消息，本质上是把“消息暂存”和“本地事务结果回查”交给 Broker 帮你做。

典型流程如下：

1. Producer 先发送 `Half Message`，消息此时对消费者不可见
2. Producer 执行本地事务
3. 本地事务成功则 `Commit`，失败则 `Rollback`
4. 如果 Producer 宕机没来得及确认，Broker 会主动回查事务状态

```text
Producer --half message--> RocketMQ
Producer --local tx-----> DB
Producer --commit/rollback--> RocketMQ
RocketMQ --check tx status--> Producer
```

示意代码如下：

::: details 点击查看代码：事务消息 Producer
```go
type OrderTxListener struct {
	orderService *OrderService
	orderDAO     *OrderDAO
}

// ExecuteLocalTransaction 半消息发送成功后执行本地事务
func (l *OrderTxListener) ExecuteLocalTransaction(msg *primitive.Message, arg interface{}) primitive.LocalTransactionState {
	dto := arg.(*OrderDTO)
	if err := l.orderService.CreateOrder(dto); err != nil {
		return primitive.RollbackMessageState
	}
	return primitive.CommitMessageState
}

// CheckLocalTransaction Broker 回查本地事务状态
func (l *OrderTxListener) CheckLocalTransaction(msg *primitive.MessageExt) primitive.LocalTransactionState {
	orderID := msg.GetProperty("orderId")
	order, _ := l.orderDAO.SelectByID(orderID)
	if order != nil {
		return primitive.CommitMessageState
	}
	return primitive.RollbackMessageState
}
```
:::

它和 Outbox 解决的是同一类问题：

- 本地事务成功了，消息也最终要能发出去

区别在于：

- `Outbox` 把中间状态存在业务库
- `事务消息` 把中间状态和回查能力放在 MQ Broker

### 6. 为什么 TCC 能保证最终一致

如果想更严格地理解 TCC，可以把它看成一组状态不变量。

设全局事务 `G` 涉及的参与者集合为 `T = {t1, t2, ..., tn}`，每个参与者只允许处于以下状态之一：

- `TRYING`
- `CONFIRMED`
- `CANCELLED`

安全性要求可以写成：

- 如果 `G` 最终是 `CONFIRMED`，那么所有参与者最终都必须是 `CONFIRMED`
- 如果 `G` 最终是 `CANCELLED`，那么所有参与者最终都必须是 `CANCELLED`
- 不允许出现部分 Confirm、部分 Cancel 的终态混合

TCC 能满足这个目标，依赖三个前提：

- 协调器在发 Confirm / Cancel 前，先把全局决定持久化
- 参与者的 Confirm / Cancel 是幂等的
- 协调器和参与者都会无限重试，直到达到终态

如果协调器在“记录全局决定”之前宕机：

- 参与者都还停留在 `TRYING`
- 超时机制会驱动它们进入 Cancel
- 所以全局仍然会收敛到一致的回滚态

也就是说，TCC 的最终一致性不是“运气好会一致”，而是：

- `持久化全局决定`
- `参与者终态幂等`
- `无限重试`

这三个条件共同保证出来的。

### 7. 基于 Event Sourcing 的事务设计

还有一条完全不同的设计路线，是把“当前状态”退化成“事件序列的投影”。

传统表设计是直接存当前状态：

- `orders.status`
- `orders.amount`
- `orders.updated_at`

而 `Event Sourcing` 存的是不可变事件流：

- `OrderCreated`
- `PaymentInitiated`
- `PaymentConfirmed`
- `OrderCancelled`

当前状态由事件回放得到：

```text
[OrderCreated{id:1, amount:100}]
[PaymentInitiated{id:1, paymentId:p1}]
[PaymentConfirmed{id:1, paymentId:p1}]
[OrderShipped{id:1, trackingNo:T123}]
```

这条路线的最大特点是：

- 回滚不再是“修改旧行”
- 而是追加新的补偿事件

例如支付失败时，不是改旧状态，而是追加：

- `PaymentFailed`
- `OrderCancelled`

核心接口大致如下：

::: details 点击查看代码：Event Sourcing 核心接口与回放
```go
type EventStore interface {
	Append(streamID string, events []Event, expectedVersion int64) error
	Load(streamID string, fromVersion int64) ([]Event, error)
}
```

聚合根的重建过程通常是纯回放：

```go
type Order struct {
	Status  OrderStatus
	Version int64
}

func RebuildOrder(events []Event) *Order {
	order := &Order{}
	for _, e := range events {
		order.Apply(e)
		order.Version++
	}
	return order
}
```
:::

如果再和 `CQRS` 结合，整体结构就会变成：

```text
Client -> Command Side -> EventStore
Client -> Query Side   <- Projection <- EventStore
```

这类设计的优势是：

- 天然审计日志
- 可回放、可时间旅行
- 写侧模型和读侧模型可以分别优化

但代价也很高：

- 建模门槛高
- 投影延迟带来最终一致读
- 事件版本演进和兼容性处理复杂

### 8. 方案选型对比

可以先用下面这张表快速判断：

| 方案 | 一致性倾向 | 性能 | 复杂度 | 更适合什么 |
| --- | --- | --- | --- | --- |
| 2PC / XA | 强一致 | 低 | 中 | 参与方少、链路短、必须统一提交 |
| TCC | 强业务一致 | 中 | 高 | 资金、库存、支付冻结这类核心交易 |
| Saga | 最终一致 | 高 | 中到高 | 微服务长流程、订单编排、履约流程 |
| 本地消息表 / Outbox | 最终一致 | 高 | 中 | 异步解耦、领域事件传播、通知链路 |
| 事务消息 | 最终一致 | 高 | 中 | 已有成熟 MQ 体系、希望 Broker 负责回查 |
| Event Sourcing | 最终一致 | 中 | 高 | 审计要求高、聚合建模清晰、愿意接受更高复杂度 |

更口语一点的经验法则是：

- `单库单服务`：先用本地事务，不要过早分布式化
- `资金和库存`：优先考虑 TCC 或强状态机控制
- `长流程编排`：优先 Saga
- `异步传播`：优先事务消息或 Outbox
- `2PC`：只有在强一致收益明显大于阻塞成本时再考虑

## 四、一致性模型全景

讨论 CAP 和分布式事务时，最好把“一致性”拆得更细，否则很容易把不同层次的保证混成一句话。

从强到弱，大致可以这样理解：

| 模型 | 核心保证 | 典型代价 | 更适合什么 |
| --- | --- | --- | --- |
| 强一致性 / Linearizability | 所有节点都像在看同一个全局实时顺序 | 延迟高、协调成本高 | 元数据、共识系统、核心控制面 |
| 顺序一致性 / Sequential Consistency | 所有进程看到同一顺序，但不要求严格按真实时间生效 | 比线性一致更宽松 | 顺序敏感但不追求实时可见的场景 |
| 因果一致性 / Causal Consistency | 有因果关系的写入顺序必须保持 | 需要传播因果上下文 | 社交、协作、会话类场景 |
| 读己之写 / Read-your-writes | 自己刚写的数据，自己后续读一定能看到 | 需要会话路由或版本感知 | 用户体验的最低常见要求 |
| 最终一致性 / Eventual Consistency | 允许短暂不一致，但最终会收敛 | 中间态复杂、补偿和对账成本高 | 大多数互联网业务链路 |

这里有两个经常被混淆的点：

- `读己之写` 更像会话保证，不是全局一致性模型
- `最终一致` 不是“不管一致性”，而是把正确性延后到补偿、重试和对账去收口

### 1. 线性一致性的代价：TrueTime 与 HLC

如果业务真的要求跨机房、跨节点的强顺序一致，就会撞上“全局时间并不存在”这个物理事实。

#### TrueTime 的核心思路

Google Spanner 不是“拿到了绝对精确时间”，而是拿到了一个时间区间：

```text
TT.now() = [earliest, latest]
```

如果当前误差上界是 `ε`，那么：

- `earliest = t - ε`
- `latest = t + ε`

事务提交时，Spanner 会：

1. 记录提交时间 `s = TT.now().latest`
2. 等到未来某一刻满足 `TT.now().earliest > s`
3. 再对外宣布事务提交成功

这个 `commit wait` 的代价通常就是额外的几毫秒到十几毫秒延迟。

它换来的收益是：

- 外部一致性
- 全局可比较时间戳
- 后发生事务一定带更大的提交时间

#### 没有 TrueTime 时怎么办

大多数团队没有 GPS + 原子钟，所以现实里更常见的是 `HLC`，也就是混合逻辑时钟。

::: details 点击查看代码：混合逻辑时钟 (HLC)
```go
type HLC struct {
	mu sync.Mutex
	l  int64 // 物理时间部分
	c  int64 // 逻辑计数部分
}

func (h *HLC) Now() (l, c int64) {
	h.mu.Lock()
	defer h.mu.Unlock()

	pt := time.Now().UnixMilli()
	if pt > h.l {
		h.l = pt
		h.c = 0
	} else {
		h.c++
	}
	return h.l, h.c
}

func (h *HLC) Update(msgL, msgC int64) (l, c int64) {
	h.mu.Lock()
	defer h.mu.Unlock()

	pt := time.Now().UnixMilli()
	newL := max(h.l, msgL, pt)

	switch {
	case newL == h.l && newL == msgL:
		h.c = max(h.c, msgC) + 1
	case newL == h.l:
		h.c++
	case newL == msgL:
		h.c = msgC + 1
	default:
		h.c = 0
	}
	h.l = newL
	return h.l, h.c
}
```
:::

它的价值在于：

- 保留因果顺序
- 又尽量贴近物理时间

所以比纯逻辑时钟更适合：

- TTL
- 过期判断
- 近实时排序

### 2. 向量时钟与版本冲突

如果系统允许多副本并发写入，就不能只关心“谁最新”，还要判断“两个版本是不是并发冲突”。

向量时钟的本质就是记录每个副本看过的版本进度：

```text
{ NodeA: 3, NodeB: 2, NodeC: 1 }
```

例如：

- `V1 = {A:3, B:2}`
- `V2 = {A:3, B:3}`，则 `V2` 明显包含并超越 `V1`
- `V3 = {A:4, B:2}`
- `V4 = {A:3, B:3}`，则 `V3` 和 `V4` 互相都不能支配对方，说明它们是并发冲突

冲突后的常见处理策略有三种：

- `Last Write Wins`：简单，但可能丢数据
- `客户端合并`：返回多个版本，让业务层决定怎么合并
- `CRDT`：通过数据结构本身支持自动合并

购物车是经典例子：

```go
v3 := Cart{Items: []string{"牛奶", "面包"}}
v4 := Cart{Items: []string{"牛奶", "鸡蛋"}}
merged := union(v3.Items, v4.Items)
```

这种“取并集”的好处是：

- 不丢商品

坏处是：

- 已删除的商品可能复活

所以实际工程里通常还要配合：

- `Tombstone`
- 删除版本号
- 合并窗口控制

### 3. CRDT：无需协调的最终一致

有一类场景不想加锁，也不想做事务协调，这时可以考虑 `CRDT`。

下面是一个最简单的 `G-Counter`：

::: details 点击查看代码：G-Counter CRDT
```go
type GCounter struct {
	nodeID string
	counts map[string]int64
}

func NewGCounter(nodeID string) *GCounter {
	return &GCounter{nodeID: nodeID, counts: make(map[string]int64)}
}

func (g *GCounter) Increment() {
	g.counts[g.nodeID]++
}

func (g *GCounter) Value() int64 {
	var total int64
	for _, c := range g.counts {
		total += c
	}
	return total
}

func (g *GCounter) Merge(other *GCounter) {
	for node, count := range other.counts {
		if count > g.counts[node] {
			g.counts[node] = count
		}
	}
}
```
:::

它的特点是：

- 每个节点只增自己的计数
- 合并时逐节点取最大值
- 合并顺序无关，不需要协调器

适合：

- 点赞数
- 在线人数近似统计
- 多节点局部累加再汇总的场景

不适合：

- 余额
- 库存上限
- 需要全局约束和扣减不越界的业务

## 五、分布式存储与数据库内核原理

真正的大规模分布式系统，最终都绕不开底层存储结构和数据库并发控制。

### 1. LSM-Tree vs B+Tree

很多分布式 KV 系统选择 `LSM-Tree`，核心原因不是“它更高级”，而是：

- 写路径更适合顺序追加
- 更贴合 SSD / 日志型写入模型

#### B+Tree 的问题

B+Tree 对随机更新很友好，但在高写入分布式场景里会遇到：

- 磁盘随机 IO 压力大
- 页分裂和页回收复杂
- SSD 写放大明显

#### LSM-Tree 的写入路径

LSM-Tree 一般采用：

- `WAL` 保证持久性
- `MemTable` 做内存有序写
- flush 成 `SSTable`
- 后台 `Compaction`

```text
Write -> WAL -> MemTable -> L0 SSTable -> L1 -> L2 -> ... -> Ln
```

这种结构的核心收益是：

- 写入大多变成顺序写
- 磁盘上文件不可变，恢复和复制更简单

代价则是：

- 读放大
- 写放大
- 空间放大

#### Compaction 策略决定了读写取舍

常见策略可以粗略理解为：

| 策略 | 特点 | 更适合什么 |
| --- | --- | --- |
| Size-Tiered | 写放大小，但读放大和空间放大更明显 | 写多读少 |
| Leveled | 每层更规整，读放大小，但写放大更高 | 读多写少 |
| FIFO | 旧文件直接淘汰 | TTL 明确的时序数据 |

#### Bloom Filter 为什么几乎是标配

因为一次查询可能要看很多 SSTable，所以通常会给每个 SSTable 配一个 Bloom Filter：

- 如果 Bloom Filter 说“不存在”，那就一定不存在
- 如果说“可能存在”，才值得真正去读文件

这能显著减少：

- 不必要的磁盘查找
- 高层级文件的负面查询成本

### 2. MVCC 的深层实现

单机数据库和分布式数据库，MVCC 的实现方式相似，但落地形式不同。

#### PostgreSQL / InnoDB 这类单机 MVCC

一条记录通常隐含多个版本信息。

以 PostgreSQL 风格理解，可以抽象成：

```sql
xmin = 创建此版本的事务 ID
xmax = 删除此版本的事务 ID
```

事务开始时拿到一个快照，之后根据：

- 当前事务 ID
- 已提交事务集合
- 活跃事务集合

来决定某个版本是否可见。

这也是为什么：

- 更新不会原地覆盖旧版本
- 旧版本可以被回滚链或 undo 信息重新构造

#### 分布式 MVCC

TiDB、CockroachDB 这类分布式数据库更常见的做法是：

- 同一个 key 存多个时间戳版本

```text
key@ts1 -> value1
key@ts2 -> value2
key@ts3 -> tombstone
```

读取时：

- 找到 `<= 读时间戳` 的最新版本

写入时：

- 追加一个更高时间戳的新版本

后台再通过：

- GC safe point
- 版本清理

来回收太旧的历史版本。

这类设计非常适合：

- 快照读
- 历史读
- 分布式事务的时间点一致性

#### Percolator 风格的分布式事务

像 TiDB 这类系统里，分布式事务通常不是直接套业务层 TCC，而是走 `Percolator` 一类模型：

- 选一个 `Primary Key` 作为事务协调锚点
- 先 `Prewrite`：写锁和未提交数据
- 再 `Commit`：提交主键并清理锁

它的关键点在于：

- 如果事务过程中崩溃，其他节点可以通过检查 Primary Key 状态判断事务该提交还是回滚
- 所以恢复逻辑不需要猜，而是能沿着主键状态继续推进

这也是底层分布式数据库和上层微服务事务的差异之一：

- 上层更关心业务语义和补偿
- 下层更关心多版本存储、锁状态和崩溃恢复

### 3. 分布式死锁检测

本地数据库死锁检测通常依赖 `wait-for graph`。

但一旦锁等待跨节点，问题就变成：

- 单节点看不到完整依赖链

典型解法有三类：

| 方案 | 思路 | 优点 | 问题 |
| --- | --- | --- | --- |
| 超时回滚 | 等太久就放弃 | 最简单 | 容易误杀正常慢事务 |
| 全局 wait-for graph | 各节点上报依赖，中心统一找环 | 判断准确 | 需要中心协调者 |
| 边缘检测 | 沿等待链分布式探测 | 不依赖单中心 | 实现复杂 |

实际工程里，像 TiDB 这一类系统更偏向：

- 各存储节点维护本地等待边
- 汇总给中心组件或专门死锁检测器
- 一旦发现环路，回滚代价更小的事务

如果不想依赖强中心，也可以用边缘检测思路：

- 每个节点沿等待链继续向前探测
- 如果探测消息最终回到起点，就说明形成了环路

这种方案的好处是：

- 不需要全局单点图构建器

但代价是：

- 实现复杂度更高
- 故障和重试时更难排障

所以分布式死锁检测和本地死锁最大的区别就在于：

- 不是“会不会有环”
- 而是“谁能看见完整的环”

## 六、Raft 协议深入

Raft 更适合解决“多副本如何对同一份日志顺序达成一致”，而不是直接解决业务事务。

etcd、TiKV、Consul 这类系统大量使用它，是因为它特别适合：

- 配置元数据
- 集群成员信息
- 调度和控制面的状态复制

工程上通常会把它和 `Multi-Paxos` 放在一起理解：

- 目标相同，都是多数派共识
- 路径相近，正常写入都更倾向单 Leader 驱动
- 但 Raft 的规则和状态机显式得多，可读性更强

### 1. Leader 选举

Raft 里所有节点初始通常都是 `Follower`。

```text
Follower 超过 election timeout 没收到心跳
    -> 转为 Candidate
    -> term++
    -> 向其他节点拉票

拿到多数票
    -> 成为 Leader
    -> 周期性发送心跳

收到更高 term 的消息
    -> 立刻退回 Follower
```

为了解决 `Split Vote`，Raft 会把 election timeout 做随机化，比如 `150ms ~ 300ms`：

- 大概率只有一个节点先超时
- 即使这一轮分票，下一轮重新随机后也会快速收敛

### 2. 日志复制与回滚

Leader 收到写请求后的标准路径通常是：

1. 先追加到本地日志，状态还是 `uncommitted`
2. 并行发 `AppendEntries` 给 Follower
3. 收到超过半数确认后，把日志标记为 `committed`
4. 应用到状态机，再返回客户端成功

```text
Leader:
  append local log
  -> replicate to followers
  -> majority ack
  -> commit
  -> apply state machine
  -> reply client
```

如果 Leader 切换后某个 Follower 有脏日志，就要回滚并覆盖：

```text
Leader log:   [1,2,3,4,5]
Follower A:   [1,2,3]
Follower B:   [1,2,x,y]
```

处理方式是：

- Leader 用 `nextIndex[]` 逐步回退
- 找到双方最后一个共同前缀
- 从分叉点之后强制用 Leader 日志覆盖

Raft 的关键安全性保证之一是：

- 已经 `committed` 的日志不会被覆盖

### 3. 网络分区脑裂与未提交日志

网络分区时，最常见的误解是：

- “旧 Leader 还活着，所以还能继续成功写入”

真正情况是：

- 少数派分区里的旧 Leader 也许还能接受请求
- 但它拿不到多数派确认，就无法把新日志提交为 committed

例如：

```text
分区 A: 旧 Leader + 1 个 Follower
分区 B: 3 个节点，多数派
```

这时多数派一侧会选出新 Leader，而旧 Leader 那一侧：

- 可以把日志先写到本地
- 但永远拿不到多数派确认
- 所以客户端最终应该看到超时或失败

网络恢复后：

- 旧 Leader 收到更高 term
- 退回 Follower
- 未提交日志被新 Leader 日志覆盖

这也是 Raft 的一个核心边界：

- 它保证数据安全
- 但不保证少数派旧 Leader 上的“表面成功写入”能真正生效

### 4. ReadIndex 与线性一致性读

Raft 的写入经多数派确认后可以保证线性一致，但读取如果处理不好，仍可能读到旧数据。

问题场景是：

- 旧 Leader 被网络隔离
- 它自己还不知道自己已经失去领导地位
- 如果它直接本地读，就可能返回过期结果

比较常见的解法是 `ReadIndex`：

1. Leader 先确认自己仍被多数派承认
2. 记录当前 commitIndex
3. 等待本地 applyIndex 追上 commitIndex
4. 再返回读结果

伪代码可以理解成：

```go
func (r *raft) ReadIndex(ctx context.Context) {
    r.sendHeartbeatToMajority()
    r.waitApplied(r.commitIndex)
    // now safe to serve linearizable reads
}
```

这说明一件很重要的事：

- “Leader 本地读”不天然等于“线性一致读”
- 线性一致读本质上仍然需要和多数派发生一次确认关系

### 5. Raft 应该用在什么地方

比较稳妥的理解是：

- `Raft` 解决的是副本状态复制和共识
- `TCC / Saga / Outbox` 解决的是业务跨服务一致性

所以 Raft 更适合：

- 配置中心
- 元数据管理
- 分布式锁服务本身
- 调度系统控制面

而不适合直接拿来替代：

- 订单事务
- 支付补偿
- 库存冻结编排

## 七、生产级架构模式与实践

真正能落地的分布式系统，通常不是“选对一个模式”就结束，而是把模式、幂等、观测和兜底一起建起来。

### 1. 幂等必须做分层设计

最好不要把幂等只押在单一点上，而是分层布防：

| 层次 | 常见做法 | 作用 |
| --- | --- | --- |
| 网关层 | `X-Idempotency-Key`、请求去重 | 防重复提交和重放 |
| 服务层 | 状态机、唯一业务键、幂等表 | 防止重复推进业务状态 |
| 存储层 | `INSERT IGNORE`、`ON CONFLICT DO NOTHING` | 用数据库兜底防重 |
| 消息层 | 消费记录表、唯一消息 ID | 防止重复消费导致脏数据 |

这也是为什么成熟系统里，幂等从来不是单点方案，而是：

- `请求级`
- `业务级`
- `写入级`
- `消费级`

### 2. 可观测性必须贯穿事务全链路

每一笔分布式事务都建议同时具备：

- `TraceID`：跨服务全链路追踪
- `SpanID`：单次调用粒度
- `TxID / BizID`：业务事务标识

重点监控指标通常包括：

- 正向成功率
- 补偿后成功率
- 补偿触发率
- 空回滚 / 悬挂发生率
- 人工干预队列积压量

如果没有这些指标，问题通常不会消失，只会变成：

- 线上已经不一致
- 但没人能快速定位到底卡在哪一环

### 3. 优先避免分布式事务

最好的分布式事务方案，往往是：

- 先通过领域拆分把强一致需求收敛到单服务内
- 让大多数跨服务动作退化为异步事件传播

这也是架构设计里最值钱的一步：

- 不是选 TCC 还是 Saga
- 而是先判断能不能不走分布式事务

### 4. 补偿优于回滚

在跨服务场景里，很多动作一旦对外可见，就很难像本地事务一样完全回到“未发生”状态。

所以设计时更应该先问：

- 正向执行到一半失败后，怎么补回来
- 补偿失败后，怎么继续重试
- 最后实在收不回来时，谁来接管

而不是只问：

- 能不能像单库事务那样直接回滚

### 5. 自动恢复之外，一定要有人工兜底

比较稳妥的收口方式通常是：

- 自动重试 `N` 次
- 超过阈值进入 `死信队列` 或 `人工审核队列`
- 人工补单、人工退单、人工对账

分布式系统最大的风险之一，不是失败本身，而是：

- 失败了却没人知道
- 卡住了却没有收口动作

### 6. 对账是最终保险丝

即使前面已经有：

- 状态机
- MQ
- 补偿任务
- 重试机制

仍然建议保留：

- 账务对账
- 库存对账
- 订单与支付结果对账

因为线上系统永远存在极端故障、漏消息、人工误操作和边界条件。

### 7. 混沌工程与一致性验证

分布式系统设计如果只停留在纸面方案，通常不够。

真正稳的系统，最终都要靠故障注入去验证：

- 网络延迟
- 丢包
- 节点宕机
- 时钟漂移
- 磁盘打满
- 长时间 GC 停顿

可以把 Chaos Engineering 的目标简单理解为：

- 主动制造你最害怕的故障
- 看系统是否仍满足你宣称的语义

而在一致性验证里，最典型的代表就是 `Jepsen`：

1. 构建集群
2. 注入网络分区、节点宕机、时钟漂移等故障
3. 并发执行读写操作
4. 检查整个历史是否满足线性一致性或其他目标模型

这类工具最重要的价值不是“自动找 Bug”，而是逼你回答：

- 你的系统到底承诺了什么一致性级别
- 在故障场景下这个承诺是否仍然成立

Jepsen 这类测试之所以重要，是因为它历史上确实发现过很多“纸面正确、故障下失效”的实现问题，比如：

- 脑裂期间接受写入，恢复后丢数据
- 领导者切换期间读到旧值
- 特定分区条件下事务违反线性一致性

## 八、系统设计时的回答框架与决策树

如果面试或评审里让你设计一个分布式业务链路，可以按这个顺序回答：

1. 先定义一致性等级：哪些必须强一致，哪些允许最终一致
2. 再定义全局业务主键：订单号、支付流水号、事务号从哪里生成
3. 再定义幂等屏障：唯一索引、状态机、消费幂等分别落在哪里
4. 再定义互斥手段：能否用条件更新解决，是否真的需要分布式锁
5. 最后选择事务模型：本地事务、TCC、Saga、事务消息还是 Outbox
6. 补上恢复闭环：重试、补偿、对账、告警和人工兜底怎么做

如果能把这六步讲顺，大多数分布式系统设计题就不会只停留在“罗列组件”。

也可以直接用下面这棵决策树来压缩回答：

```text
需要跨服务写入？
    |
    +-- 否 -> 单服务本地事务
    |
    +-- 是 -> 能否重新设计避免跨服务？
              |
              +-- 能 -> 合并服务 / 重新划分领域边界
              |
              +-- 不能 -> 是否必须强业务一致？
                        |
                        +-- 是 -> 优先 TCC
                        |
                        +-- 否 -> 是同步长流程还是异步传播？
                                  |
                                  +-- 同步长流程 -> Saga 编排
                                  +-- 异步解耦 -> 事务消息 / Outbox
                                  +-- 简单通知 -> 本地消息表
```

这类问题里最核心的一句工程哲学仍然是：

> 分布式事务是不得已的选择，最好的分布式事务是不需要分布式事务。

## 相关阅读

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [电商交易平台生产级架构深度设计](/architecture/ecommerce-transaction-platform-production-architecture)
- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [交易系统一致性设计总览](/architecture/transaction-system-consistency-overview)
- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
- [Raft 共识算法详解](/algorithm/raft)
- [事务消息：如何实现一个完整的事务消息模块](/kafka/30-transaction-messages)
- [订单状态机设计实战](/architecture/order-state-machine-design)
- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
