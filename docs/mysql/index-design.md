---
title: B+ 树索引与最左前缀
description: MySQL InnoDB B+ 树索引结构、聚簇索引与回表、最左前缀匹配规则、EXPLAIN 执行计划、索引失效场景与设计法则。
---

# B+ 树索引与最左前缀

> MySQL InnoDB 的主键索引和二级索引底层都是 B+ 树。B+ 树适合磁盘场景，因为高度低、范围查询稳定，叶子节点有序，天然支持区间扫描。支付系统里大量查询都是按商户、订单号、时间范围过滤，这正是 B+ 树擅长的场景。

## B+ 树结构

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

## 聚簇索引与二级索引（回表原理）

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

## 最左前缀匹配规则

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

### WHERE 条件顺序会影响索引吗

不会。`WHERE` 里的条件书写顺序通常**不影响** MySQL 是否使用联合索引，优化器会自己分析谓词并选择执行计划。

假设有索引：

```sql
INDEX idx_user_status_time (user_id, status, create_time)
```

下面两种写法，对优化器来说是等价的：

```sql
SELECT ...
FROM orders
WHERE user_id = ? AND status = ?
ORDER BY create_time DESC;

SELECT ...
FROM orders
WHERE status = ? AND user_id = ?
ORDER BY create_time DESC;
```

只要 `user_id`、`status` 都是等值条件，且命中了联合索引的最左前缀，`ORDER BY create_time DESC` 也有机会直接利用索引顺序，避免额外排序。

真正影响索引利用率的，不是 `WHERE` 条件的书写顺序，而是下面这些情况：

| 场景 | 示例 | 影响 |
| --- | --- | --- |
| 缺少最左列 | `WHERE status = ? ORDER BY create_time DESC` | 跳过 `user_id`，联合索引通常无法按预期命中 |
| 跳过中间列 | `WHERE user_id = ? AND create_time > ? AND status = ?` | `status` 被隔开，后续列利用率下降 |
| 中间列是范围查询 | `WHERE user_id = ? AND status > ? ORDER BY create_time DESC` | `status` 范围扫描后，`create_time` 的顺序优势通常无法继续利用 |
| 对索引列做函数/计算 | `WHERE DATE(create_time) = ?` | 破坏索引有序性，容易退化为扫描 |

一句话记忆：

- `WHERE` 条件写在前还是写在后，不重要
- 联合索引列有没有从左到右连续命中，很重要
- 一旦中间出现范围查询，后续列通常就很难继续同时服务过滤和排序

---

## EXPLAIN 执行计划自检

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

## 索引失效的六大场景

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

## 索引下推（ICP，MySQL 5.6+）

联合索引 `(name, age)`，查询 `WHERE name LIKE '张%' AND age = 20`：

- **无 ICP**：先用 `name LIKE '张%'` 找出大量主键，全部回表后再过滤 `age = 20`
- **有 ICP**：在索引树遍历阶段就把 `age = 20` 先过滤掉，大幅减少回表次数

`EXPLAIN` 里看到 `Using index condition` 就是 ICP 生效。

---

## 索引设计黄金法则

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

---

## 继续阅读

- [大事务拆分](./transaction-and-optimization.md#大事务拆分)
- [死锁检测与回滚重试](./deadlock-and-retry.md)
- [返回 MySQL 专题总览](./index.md)
