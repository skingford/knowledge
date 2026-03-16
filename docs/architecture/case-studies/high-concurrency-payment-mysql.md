---
title: 高并发支付系统专题整理：MySQL 篇
description: 聚焦支付系统里的 MySQL 高频考点，覆盖索引、事务、死锁、热点更新、分库分表与高频追问。
---

# 高并发支付系统专题整理：MySQL 篇

适合把支付场景里的 MySQL 高频考点单独拉出来复习。答题时建议始终按**原理 → 支付场景问题 → 落地方案**的顺序组织。

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [下一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [延伸：Kafka 篇](./high-concurrency-payment-kafka.md)

## 适合谁看

- 对索引、事务、锁机制理解还不够扎实
- 面试里经常答不清大事务、死锁、热点更新
- 想把支付场景下的数据库问题和真实治理方案串起来

## 你会得到什么

- 一套围绕支付链路的 MySQL 高频题答题框架
- 从索引设计到事务治理的系统复习路径
- 面向高并发场景的热点更新与分库分表思路

## 建议复习顺序

1. 先看索引与事务，补基本盘
2. 再看死锁、热点更新，补高并发问题处理
3. 最后看分库分表与迁移，补架构演进视角

## 对应资料导航

- [MySQL 实战 45 讲：专题概览](/architecture/mysql45/) — 系统学习 MySQL 原理与实战
- [database/sql：连接池与事务](/golang/guide/source-reading/database-sql)
- [database/sql：高级事务与批量插入](/golang/guide/source-reading/database-sql-advanced)

## MySQL 高频考点

> 这几个问题可以按"索引 → 事务 → 并发锁 → 扩容迁移"的顺序来准备，先把单库单表问题讲清，再讲演进方案。

建议先用总览表快速定位各考点：

| 题目 | 核心矛盾 | 典型后果 | 首先要答什么 |
| --- | --- | --- | --- |
| B+ 树与最左前缀 | 索引设计不合理 | 查询慢、扫描多 | 索引结构 + 命中规则 |
| 大事务拆分 | 事务范围过大 | 锁持有长、回滚成本高 | 事务缩短原则 |
| 死锁检测与回滚重试 | 并发锁顺序冲突 | 回滚、超时、RT 抖动 | 排查手段 + 治理 |
| 热点更新 | 同一行并发修改（大商户账户、直播间余额） | 行锁排队、TPS 下降 | 分层治理方案 |
| 分库分表与迁移 | 单表/单库到瓶颈 | 查询、DDL、扩容复杂 | 为什么拆 + 怎么迁 |

### **B+ 树索引和最左前缀匹配**

<details>
<summary><strong>B+ 树索引和最左前缀匹配</strong></summary>

> MySQL InnoDB 的主键索引和二级索引底层都是 B+ 树。B+ 树适合磁盘场景，因为高度低、范围查询稳定，叶子节点有序，天然支持区间扫描。支付系统里大量查询都是按商户、订单号、时间范围过滤，这正是 B+ 树擅长的场景。

#### B+ 树结构

**B+ 树示意图（3 层，千万级数据典型高度）**

```
                        ┌───────────────┐
                        │  根节点（非叶）  │
                        │   [30 | 60]   │
                        └───┬───┬───┬───┘
                            │   │   │
              ┌─────────────┘   │   └─────────────┐
              ▼                 ▼                  ▼
         ┌─────────┐      ┌─────────┐        ┌─────────┐
         │ [10|20] │      │ [40|50] │        │ [70|80] │  ← 中间节点（只存索引键+页指针）
         └──┬──┬───┘      └──┬──┬───┘        └──┬──┬───┘
            │  │             │  │               │  │
   ┌────────┘  └──┐  ┌───────┘  └───┐  ┌───────┘  └───┐
   ▼              ▼  ▼              ▼  ▼              ▼
┌──────┐      ┌──────┐          ┌──────┐          ┌──────┐
│  10  │ ←──► │  20  │ ←──► ... │  60  │ ←──► ... │  80  │  ← 叶子节点（双向链表，存完整数据）
│ 数据 │      │ 数据 │          │ 数据 │          │ 数据 │
└──────┘      └──────┘          └──────┘          └──────┘
```

B+ 树三个关键特征：

| 特征 | 含义 | 对查询的价值 |
| --- | --- | --- |
| 非叶子节点只存索引键和页指针 | 单页容纳更多索引项 | 树更矮（3~4 层支撑千万级数据），IO 次数少 |
| 叶子节点存全量数据 | 聚簇索引存整行，二级索引存主键值 | 所有实际数据访问最终落在叶子节点 |
| 叶子节点双向链表有序连接 | 叶子节点按 key 有序排列 | 范围查询、排序、顺序扫描效率高且稳定 |

**为什么不用二叉树或普通 B 树？**

| 结构 | 问题 | 不如 B+ 树的原因 |
| --- | --- | --- |
| 二叉树 | 树高容易很高 | 每次查询走更多层，磁盘 IO 成本高 |
| B 树 | 非叶子节点也存数据 | 单页能放的索引更少，树更高，范围查询也不如 B+ 树稳定 |
| B+ 树 | 非叶子节点只存索引 | 高度低、范围查询快，专为磁盘场景设计 |

> 核心结论：**高性能 MySQL 的核心是让查询尽可能在内存中结束，让磁盘操作尽可能顺序化**。B+ 树的矮胖结构和有序叶子节点正好满足这两点。

---

#### 聚簇索引与二级索引（回表原理）

```
聚簇索引（主键索引）                        二级索引（如 name 字段）
叶子节点                                   叶子节点
┌────────────────────────────┐          ┌────────────────────────┐
│ id=1 | name=张三 | amt=100 │          │ name=李四 | id=2       │
│ id=2 | name=李四 | amt=200 │          │ name=王五 | id=3       │
│ id=3 | name=王五 | amt=300 │          │ name=张三 | id=1       │
└────────────────────────────┘          └────────────────────────┘
        ↑ 完整行数据                              ↑ 只有索引字段 + 主键
                                                  ↓ 需要回主键索引取完整行
                                                （这就是"回表"）
```

| 概念 | 含义 | 性能影响 |
| --- | --- | --- |
| 回表 | 先通过二级索引拿到主键，再回主键索引树查完整行 | 多一次 IO |
| 覆盖索引 | 查询字段都包含在索引里，直接返回，无需回表 | 性能最优 |

```sql
-- 需要回表（SELECT * 包含了索引外的字段）
SELECT * FROM payment_order WHERE merchant_id = ?;

-- 覆盖索引（order_id、status 都在联合索引里，无需回表）
SELECT order_id, status FROM payment_order WHERE merchant_id = ?;
```

> 优化 SQL 时，除了"能不能走索引"，还要追问一句"走了索引之后要不要回表"。

---

#### 最左前缀匹配规则

假设创建了联合索引 `INDEX(merchant_id, created_at, status)`，可以把它理解为一本电话簿：先按 `merchant_id` 排序，相同再按 `created_at`，相同再按 `status`。

**命中规则示意**

```
联合索引：INDEX(merchant_id, created_at, status)

查询条件                                              命中情况
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHERE merchant_id = 1001                              ✅ 命中第 1 列
WHERE merchant_id = 1001 AND created_at > X           ✅ 命中前 2 列
WHERE merchant_id = 1001 AND created_at > X
      AND status = 1                                  ✅ 命中前 2 列（status 利用率弱）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHERE created_at > X                                  ❌ 跳过最左列，全表扫描
WHERE merchant_id = 1001 AND status = 1               ⚠️  只有 merchant_id 有效，status 断层
WHERE created_at > X AND status = 1                   ❌ 缺少最左列，索引不生效
```

| 规则 | 含义 | 原因 |
| --- | --- | --- |
| 必须从最左列开始 | 缺少最左列，索引通常不生效 | 整棵树按最左列全局有序 |
| 不能跳过中间列 | 跳过后，后续列利用率明显下降 | 跳过列后的列不是全局有序的 |
| 范围查询会减弱后续列命中 | 某列做范围扫描后，后续列利用率下降 | 范围内部有序，但跨范围后续列不保证有序 |

> 联合索引的有序性是层层展开的，不满足前一层，后一层的顺序性就无法独立利用。

---

#### EXPLAIN 执行计划自检

`EXPLAIN` 里最重要的三个字段：

**`type`（扫描类型）**

| type | 说明 | 判断 |
| --- | --- | --- |
| `system` / `const` | 主键或唯一索引命中，返回一行 | 非常好 |
| `eq_ref` | 多表关联时命中主键或唯一索引 | 很好 |
| `ref` | 普通索引或联合索引前缀 | 一般不错 |
| `range` | 索引范围扫描（`BETWEEN`、`>`、`IN`） | 常见且可接受 |
| `index` | 全索引扫描 | 可能是覆盖索引，也可能过滤性不足 |
| `ALL` | 全表扫描 | 需要重点优化 |

**`key` 和 `key_len`**

- `key`：实际选择的索引名；`NULL` 意味着没走索引
- `key_len`：实际使用的索引长度；可判断联合索引命中了几列（不是越大越好）

**`Extra`**

- `Using index`：覆盖索引，无需回表
- `Using index condition`：索引下推（ICP）生效
- `Using filesort`：需要额外排序，关注排序字段和索引设计
- `Using temporary`：使用了临时表，常见于 `GROUP BY`、`DISTINCT` 设计不合理

---

#### 索引失效的六大场景

| 场景 | 典型写法 | 为什么失效 |
| --- | --- | --- |
| 函数或计算操作 | `WHERE YEAR(created_at) = 2026` | B+ 树存原始值，不是计算后的值 |
| 左模糊匹配 | `WHERE name LIKE '%张'` | 无法利用前缀有序性 |
| 隐式类型转换 | 字段是字符串，却传数字比较 | MySQL 对列做转换，索引失效 |
| `OR` 含无索引列 | `WHERE a=1 OR b=2`，`b` 无索引 | 整体可能退化为全表扫描 |
| `!=` / `<>` | `WHERE status <> 1` | 优化器可能认为全表扫描更快 |
| `IS NULL` / `IS NOT NULL` | 取决于数据分布 | NULL 占比高时效果不稳定 |

> 索引失效很多时候不是"数据库不聪明"，而是 SQL 写法破坏了索引本身的有序性或可筛选性。

---

#### 索引下推（ICP，MySQL 5.6+）

联合索引 `(name, age)`，查询 `WHERE name LIKE '张%' AND age = 20`：

- **无 ICP**：先用 `name LIKE '张%'` 找出大量主键，全部回表后再过滤 `age = 20`
- **有 ICP**：在索引树遍历阶段就把 `age = 20` 先过滤掉，大幅减少回表次数

`EXPLAIN` 里看到 `Using index condition` 就是 ICP 生效。

---

#### 索引设计黄金法则

- **区分度优先**：高区分度字段放联合索引左边
- **覆盖索引优先**：查询字段尽量包含在联合索引里，减少回表
- **禁止对索引列做函数操作**：`WHERE YEAR(created_at)=2026` 会让索引失效
- **自增主键优先**：减少 B+ 树页分裂，保证插入顺序性
- **控制索引数量**：单表索引不宜超过 5~6 个，`INSERT/UPDATE/DELETE` 都要维护 B+ 树

每次看慢 SQL，先问自己三个问题：

1. `WHERE` 条件命中最左前缀了吗？
2. `SELECT` 字段能不能做成覆盖索引，减少回表？
3. SQL 里有没有函数、计算、类型转换导致索引失效？

**支付场景索引示例**

```sql
CREATE INDEX idx_mch_time_status
ON payment_order (merchant_id, created_at, status);

-- ✅ 命中前两列（merchant_id + created_at），status 作为 ICP 过滤
SELECT order_id, status
FROM payment_order
WHERE merchant_id = ? AND created_at >= ?;

-- ❌ 跳过 merchant_id，索引失效，退化全表扫描
SELECT order_id, status
FROM payment_order
WHERE created_at >= ? AND status = ?;
```

</details>

### **大事务拆分**

<details>
<summary><strong>大事务拆分</strong></summary>

> 大事务的问题不只是慢：长时间持锁会堵塞后续请求、Undo/Redo 日志膨胀、主从复制延迟放大、回滚成本极高。支付系统高峰期最怕大事务叠加热点行，两者叠加会直接把后续请求全部堵死。

**答题顺序**：识别来源 → 说明危害 → 给出拆分原则 → 正反例对比

---

**大事务的四类来源**

| 来源 | 典型场景 | 问题 |
| --- | --- | --- |
| 批量更新未分段 | 一次性更新 10 万条订单状态 | 事务持续时间过长 |
| 循环逐笔处理 | `for` 循环内逐条 `INSERT` 未分批提交 | N 条 SQL 在同一个事务里 |
| 事务内 RPC/HTTP 调用 | 事务未提交时调用三方支付渠道 | 网络耗时直接拉长事务 |
| 事务内复杂计算 | 事务内算对账差值、生成报表 | CPU 时间占用事务时长 |

---

**拆分原则**

核心只有一条：**事务里只保留必要的本地原子操作，其他全部移出事务**。

- 网络调用（RPC、HTTP）放到事务外，拿到结果再开事务写库
- 批量操作按 500~1000 条分段提交，每段一个独立事务
- 非核心逻辑（日志、通知、统计更新）通过消息队列异步化

---

**正反例对比**

```go
// ❌ 反例：事务内做了渠道 RPC，持锁时间 = 本地操作 + 网络耗时
func payBad(ctx context.Context, orderID string) error {
    tx.Begin()
    tx.Exec("UPDATE payment_order SET status = 'PAYING' WHERE order_id = ?", orderID)
    callChannelAPI(ctx)   // 可能耗时 200ms+，此时行锁一直被持有
    tx.Exec("INSERT INTO payment_flow(order_id, status) VALUES(?, ?)", orderID, "PAYING")
    return tx.Commit()
}

// ✅ 正例：先做网络调用，拿到结果后再开事务写库
func payGood(ctx context.Context, orderID string) error {
    // 1. 事务外先调渠道，只拿到结果
    result, err := callChannelAPI(ctx)
    if err != nil {
        return err
    }
    // 2. 拿到结果后，在极短事务内写库
    tx.Begin()
    tx.Exec("UPDATE payment_order SET status = ? WHERE order_id = ?", result.Status, orderID)
    tx.Exec("INSERT INTO payment_flow(order_id, status) VALUES(?, ?)", orderID, result.Status)
    return tx.Commit()
}
```

**批量分段提交示例（Go）**

```go
// 每 500 条提交一次，避免大事务
func batchUpdateStatus(ctx context.Context, db *sql.DB, orderIDs []string) error {
    const batchSize = 500
    for i := 0; i < len(orderIDs); i += batchSize {
        end := i + batchSize
        if end > len(orderIDs) {
            end = len(orderIDs)
        }
        batch := orderIDs[i:end]
        tx, _ := db.BeginTx(ctx, nil)
        for _, id := range batch {
            tx.ExecContext(ctx, "UPDATE payment_order SET status='CLOSED' WHERE order_id=?", id)
        }
        if err := tx.Commit(); err != nil {
            tx.Rollback()
            return err
        }
    }
    return nil
}
```

> 拆分事务的本质是缩短持锁时间窗，让锁释放更快、并发通过率更高。支付系统里高峰期最怕大事务加热点行叠加，一旦叠加就是后续请求的全面堵塞。

</details>

### **死锁检测与回滚重试**

<details>
<summary><strong>死锁检测与回滚重试</strong></summary>

> 死锁本质是两个或多个事务互相等待对方持有的资源，形成循环依赖。InnoDB 有内置的死锁检测机制，一旦发现死锁，会自动选代价最小的事务回滚。

**答题顺序**：死锁本质 → 排查手段 → 根因分析 → 治理方案 → 重试代码

---

**死锁循环等待示意图**

```
事务 A                              事务 B
──────────────────────────────────────────────────────────────
① 锁定 order_id = 100              ① 锁定 order_id = 200
② 等待 order_id = 200  ──────►   阻塞（order_id=200 被 B 持有）
   阻塞（order_id=100 被 A 持有）◄── ② 等待 order_id = 100
                      ╔══════════╗
                      ║   死锁   ║  InnoDB 选代价小的事务回滚
                      ╚══════════╝
```

支付系统里常见死锁场景：

- 两个事务以不同顺序更新同一组订单行（A 先锁订单再锁流水，B 相反）
- 缺少索引导致 gap lock 覆盖范围扩大，互相阻塞
- 长事务 + 跨多张表锁资源，形成持有链

---

**排查手段：SHOW ENGINE INNODB STATUS**

```sql
SHOW ENGINE INNODB STATUS\G
```

输出中找 `LATEST DETECTED DEADLOCK` 段落，关键字段解读：

```
------------------------
LATEST DETECTED DEADLOCK
------------------------
*** (1) TRANSACTION:
TRANSACTION 421, ACTIVE 0 sec starting index read
MySQL thread id 12, query id 1001
UPDATE payment_order SET status=2 WHERE order_id=100  ← 事务 1 执行的 SQL

*** (1) HOLDS THE LOCK(S):     ← 事务 1 当前持有的锁
RECORD LOCKS index PRIMARY of table `payment_order`
Record lock, heap no 5 ...

*** (1) WAITING FOR THIS LOCK: ← 事务 1 等待的锁（被事务 2 持有）
RECORD LOCKS index PRIMARY of table `payment_order`
Record lock, heap no 8 ...

*** (2) TRANSACTION:           ← 事务 2 同样结构
...

*** WE ROLL BACK TRANSACTION (2)  ← InnoDB 选择回滚事务 2
```

排查时重点关注：`HOLDS THE LOCK(S)` 和 `WAITING FOR THIS LOCK` 是否形成环形依赖。

---

**根因与治理**

| 根因 | 治理方案 |
| --- | --- |
| 多事务更新顺序不一致 | 统一加锁顺序（如按 order_id 升序更新） |
| 缺索引导致 gap lock 范围扩大 | 补索引，缩小 gap lock 覆盖范围 |
| 长事务持锁时间过长 | 拆分大事务，缩短事务时长 |
| 并发竞争同一批行 | 引入乐观锁或队列化处理 |

---

**回滚重试（仅限幂等操作）**

```go
func withDeadlockRetry(fn func() error) error {
    for i := 0; i < 3; i++ {
        err := fn()
        if err == nil {
            return nil
        }
        if !isDeadlockError(err) {
            return err
        }
        time.Sleep(time.Duration(i+1) * 50 * time.Millisecond)
    }
    return ErrDeadlockRetryExhausted
}
```

> **重要**：死锁重试只能用于幂等操作。扣款等资金动作如果没做好幂等，重试本身可能带来资损。建议扣款操作先用唯一流水号做幂等校验，再做重试。

</details>

### **热点更新问题**

<details>
<summary><strong>热点更新问题</strong></summary>

> 热点更新本质是大量请求并发修改同一行，导致行锁排队、TPS 降低、接口超时放大。在支付系统里最典型的是热点账户（大商户余额、直播间打赏账户、平台总账、库存型额度账户）。

**答题顺序**：现象 → 根因 → 分层治理方案（从轻到重）

现象通常不是 CPU 高，而是锁等待高、接口 RT 明显抖动；根因是同一行被频繁更新，事务持锁时间稍长就形成排队。

---

**分层治理思路**

```
热点强度    方案                适用场景
─────────────────────────────────────────────────────────────────
低并发    乐观锁 + CAS 重试     版本号检测，冲突重试
中并发    事务后段锁            把余额更新放到事务最后一步
高并发    内存队列合并更新      10ms 窗口合并 N 笔为一次 UPDATE
极高并发  子账户拆分            一行 → N 行，查询时 SUM 汇总
```

---

**子账户拆分示意图**

```
拆分前                               拆分后（N=4 个子账户）
┌──────────────────────────┐         ┌──────────┐  ┌──────────┐
│ account                  │         │  sub_0   │  │  sub_1   │
│ id      = 1001           │  ────►  │ balance  │  │ balance  │
│ balance = 100 万          │         └──────────┘  └──────────┘
│ 高并发写 → 行锁严重排队    │         ┌──────────┐  ┌──────────┐
└──────────────────────────┘         │  sub_2   │  │  sub_3   │
                                     │ balance  │  │ balance  │
                                     └──────────┘  └──────────┘
                                           │
                                    写入时随机选一个 sub_index
                                    查询时 SELECT SUM(balance)
```

---

**代码示例**

```sql
-- 乐观锁（中低并发）
UPDATE account
SET balance = balance - 100, version = version + 1
WHERE id = ? AND version = ? AND balance >= 100;

-- 子账户写入（极高并发，随机分散到 N 个子账户）
UPDATE account_sub
SET balance = balance - 100
WHERE parent_id = ? AND sub_index = #{random(0, N)} AND balance >= 100;

-- 查询总余额（聚合子账户）
SELECT SUM(balance) FROM account_sub WHERE parent_id = ?;
```

> 支付系统里先保证流水真实落库，再考虑余额的实时呈现；热点治理的目标不是每一笔都强实时，而是先把资金正确性和系统吞吐守住。

</details>

### **分库分表与迁移**

<details>
<summary><strong>分库分表与迁移</strong></summary>

> 分库分表不是为了显得架构高级，而是单表数据量、单机写入、索引维护成本都到瓶颈后才做。支付系统里通常是订单表、流水表最先触顶，因为写多、查多、保留周期还长。

**答题框架**：为什么拆 → 怎么拆 → 拆后代价 → 怎么迁

---

**拆分策略**

| 维度 | 说明 | 代价 |
| --- | --- | --- |
| 垂直拆库（按业务） | 订单库/账户库/风控库分离 | 跨库事务退化为分布式事务 |
| 水平分表（按行） | 按 merchant_id hash 或时间分片 | 跨分片查询、分页、排序更复杂 |
| 分片键选择 | 优先选高区分度、查询频率最高的字段 | 分片键不能修改，需提前规划 |

```
交易订单表：按 merchant_id hash 分库分表
支付流水表：按月分表 + 商户维度分库
历史归档表：冷数据下沉到归档库或对象存储
```

---

**数据迁移流程**

```
┌──────────┐  写入   ┌─────────────┐  增量同步   ┌──────────┐
│  老库    │ ──────► │ CDC / 双写  │ ──────────► │  新库    │
└──────────┘         └─────────────┘             └──────────┘
                                                       │
                          历史数据批量回填 ──────────────┘
                                                       │
                                        ┌──────────────▼──────────────┐
                                        │         对账校验              │
                                        │  行数 / 金额 / 状态 / 账务    │
                                        └──────────────┬──────────────┘
                                                       │
                                          灰度读新库（5% → 50% → 100%）
                                                       │
                                          灰度写新库（5% → 50% → 100%）
                                                       │
                                          全量切换 → 下线老链路
```

**迁移核心原则**：业务不停、资金不乱、随时可回滚。

1. 先做双写或 CDC，同步增量数据
2. 迁移历史存量数据（批量回填，断点续传）
3. 多维度对账校验（行数、金额、状态、账务结果）
4. 先灰度读，再灰度写，最后全量切换
5. 切流失败立即回滚，保留老链路直到完全验证

> 追问风险点时，回答三件事：**幂等补偿**（避免重复迁移）、**防止重复写入**（迁移任务需要断点续传）、**切流失败可回滚**（开关控制读写流量）。

</details>

## 高频追问

> 这组追问更偏落地细节，适合在讲完主方案后补一句，体现你不只懂原理，也考虑到了真实 SQL 和事务成本。

| 追问 | 本质 | 常见答案方向 |
| --- | --- | --- |
| 为什么不能 `SELECT *` | 回表和缓存污染 | 覆盖索引 |
| 深分页如何优化 | OFFSET 扫描成本高 | 游标分页、延迟关联 |
| 如何缩短锁持有时间 | 事务中混入耗时操作 | 把锁操作放到事务后段 |
| 如何避免热点账户行锁竞争 | 同一行并发写入 | 乐观锁、排队合并、子账户拆分 |

### **为什么支付流水表不能 `SELECT *`**

<details>
<summary><strong>为什么支付流水表不能 `SELECT *`？</strong></summary>

> 流水表字段多、行数大，`SELECT *` 导致回表次数增多、Buffer Pool 污染（大量不需要的冷数据被加载进内存）。正确做法是只查需要的列，建立覆盖索引，在索引层完成查询。

```sql
-- ❌ 反例：全列扫描，触发回表，污染 Buffer Pool
SELECT * FROM payment_flow WHERE merchant_id = ? AND created_at > ?;

-- ✅ 正例：覆盖索引，无需回表
SELECT order_id, amount, status FROM payment_flow
WHERE merchant_id = ? AND created_at > ?;
```

</details>

### **深分页如何优化**

<details>
<summary><strong>深分页如何优化？</strong></summary>

> `OFFSET 100000, 20` 实际要扫描前 100020 行再丢弃，性能极差。核心思路是用游标分页替代 OFFSET。

```sql
-- ❌ 反例：深分页，扫描大量无用行
SELECT * FROM payment_flow ORDER BY id LIMIT 100000, 20;

-- ✅ 正例：游标分页，从上次最大 id 开始
SELECT * FROM payment_flow WHERE id > #{lastMaxId} ORDER BY id LIMIT 20;
```

必须跳页时用延迟关联：

```sql
-- ✅ 延迟关联：先在索引上定位 ID，再回表取数据
SELECT f.* FROM payment_flow f
INNER JOIN (SELECT id FROM payment_flow ORDER BY id LIMIT 100000, 20) t
ON f.id = t.id;
```

</details>

### **如何缩短锁持有时间**

<details>
<summary><strong>如何缩短锁持有时间？</strong></summary>

> 事务越长，行锁持有越久，并发冲突越严重。核心原则：把锁操作（UPDATE/SELECT FOR UPDATE）放在事务最后，事务越短越好。

```go
// ❌ 反例：SELECT FOR UPDATE 之后做了耗时操作，锁一直被持有
tx.Begin()
tx.Exec("SELECT ... FOR UPDATE")
callChannel(ctx)      // 耗时 200ms，锁被持有 200ms+
tx.Exec("UPDATE ...")
tx.Commit()

// ✅ 正例：把耗时操作移到事务外，事务只做最后的写操作
result := callChannel(ctx)   // 事务外先做
tx.Begin()
tx.Exec("UPDATE ... WHERE ... AND status = 'INIT'")   // 短事务写入
tx.Commit()
```

</details>

### **如何避免热点账户导致行锁竞争**

<details>
<summary><strong>如何避免热点账户导致行锁竞争？</strong></summary>

> 热点账户并发更新同一行，行锁排队导致吞吐骤降。从轻到重依次是乐观锁、排队合并、子账户拆分。

| 方案 | 适用场景 | 核心思路 |
| --- | --- | --- |
| 乐观锁 | 中低并发 | `WHERE version = ?` 冲突重试 |
| 内存排队合并 | 高并发 | 攒批 10ms，多笔合并为一次 UPDATE |
| 子账户拆分 | 极高并发 | 拆 N 个影子账户分散写入，查询时 SUM |

```sql
-- 乐观锁
UPDATE account SET balance = balance - 100, version = version + 1
WHERE id = ? AND version = ? AND balance >= 100;

-- 子账户写入
UPDATE account_sub SET balance = balance - 100
WHERE parent_id = ? AND sub_index = #{random(0, N)} AND balance >= 100;

-- 查询总余额
SELECT SUM(balance) FROM account_sub WHERE parent_id = ?;
```

</details>

---

## 继续阅读

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [下一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [案例总览](./index.md)
