---
title: 组织架构与业务系统设计方案
description: 面向多层级组织、商户和网点场景的组织树建模方案，覆盖闭包表原理、树模型对比、权限过滤、聚合查询、组织迁移和工程化落地。
---

# 组织架构与业务系统设计方案

## 快速导航

- [目标与适用场景](#1-目标与适用场景)
- [设计原则](#2-设计原则)
- [树模型对比与选型](#3-树模型对比与选型)
- [闭包表原理详解](#4-闭包表原理详解)
- [总体架构图](#5-总体架构图)
- [核心数据模型](#6-核心数据模型)
- [CRUD 操作详解](#7-crud-操作详解)
- [查询策略](#8-查询策略)
- [性能优化](#9-性能优化)
- [缓存策略](#10-缓存策略)
- [组织变更策略](#11-组织变更策略)
- [一致性与历史口径](#12-一致性与历史口径)
- [分库分表策略](#13-分库分表策略)
- [监控与告警](#14-监控与告警)
- [API 设计建议](#15-api-设计建议)
- [从现有系统迁移](#16-从现有系统迁移)
- [风险与对策](#17-风险与对策)
- [推荐落地方案](#18-推荐落地方案)
- [延伸阅读](#19-延伸阅读)
- [结论](#20-结论)

## 1. 目标与适用场景

本文面向如下组织形态：

- 公司（Company）
- 平台（Platform）
- 合作商（Agent），支持无限层级
- 商户（Shop），可直属平台或任意合作商
- 网点（Site），归属商户

典型结构如下：

```text
Company
└── Platform
    ├── Agent A
    │   ├── Agent A-1
    │   │   ├── Agent A-1-1
    │   │   │   └── Shop S1
    │   │   │       ├── Site 001
    │   │   │       ├── Site 002
    │   │   │       └── Site 003
    │   │   └── Shop S2
    │   └── Shop S3
    └── Shop S4
        └── Site 101
```

该方案解决三个核心问题：

- 支持无限层级组织，不因层级变深导致模型失控
- 支持万级网点、千万级到亿级业务数据的高性能查询
- 在组织迁移、归属调整时，兼顾数据正确性与历史统计口径

## 2. 设计原则

### 2.1 业务表保持单一归属键

订单、设备、交易、库存等业务表尽量只保留 `site_id`，不要把 `agent_id`、`shop_id`、`platform_id` 冗余塞满所有业务表。

这样做的好处：

- 业务模型干净
- 组织关系变更时不需要批量回刷业务表
- 权限和聚合逻辑统一走组织索引层

> **例外情况**：如果存在高频查询确实需要反范式冗余某个字段（如 `shop_id`），应作为有意识的性能取舍而非默认行为，并在代码中注释说明理由。

### 2.2 组织关系与业务数据解耦

组织树负责表达"谁归谁管"，业务表负责表达"发生了什么业务"。两者通过组织索引层连接，而不是把组织层级硬编码进业务表。

### 2.3 查询性能优先于树遍历优雅

前端树形展示和后端聚合查询是两个不同问题：

- 树形展示更适合用 `parent_id` 或 `org_path`
- 海量业务聚合更适合用 `org_closure`

不要试图只用一种模型解决所有问题。

## 3. 树模型对比与选型

在关系数据库中表达树形结构，业界有四种主流模型。理解各模型的优劣，才能明白本方案为何采用"三合一"策略。

### 3.1 四种模型对比

| 维度 | 邻接表 (Adjacency List) | 物化路径 (Materialized Path) | 嵌套集 (Nested Set) | 闭包表 (Closure Table) |
| --- | --- | --- | --- | --- |
| **数据结构** | 每行存 `parent_id` | 每行存完整路径如 `/1/2/8` | 每行存 `lft` / `rgt` 区间值 | 独立表存所有祖先-后代对 |
| **查所有后代** | 递归查询 / CTE | `LIKE '/1/2/%'` | `WHERE lft BETWEEN x AND y` | `JOIN closure WHERE ancestor_id = x` |
| **查所有祖先** | 递归查询 / CTE | 拆路径字符串 | `WHERE lft < x AND rgt > x` | `JOIN closure WHERE descendant_id = x` |
| **插入节点** | O(1) | O(1) | O(n) 需重算区间 | O(d) d为节点深度 |
| **移动子树** | O(1) 改 parent_id | O(s) s为子树大小，需更新路径 | O(n) 需重算全表区间 | O(s × d) 需重建闭包关系 |
| **删除子树** | 递归删除 | O(s) 删子树节点 | O(n) 需重算区间 | O(s × d) 删闭包行 |
| **存储开销** | 最小（仅 parent_id） | 中等（路径字符串） | 最小（两个整数列） | 最大（所有祖先-后代对） |
| **查询性能** | 差（需递归） | 中等（LIKE 无法高效利用索引的中缀） | 好（范围查询） | 最好（直接 JOIN） |
| **写入性能** | 最好 | 好 | 差（频繁重算） | 中等 |
| **适用场景** | 浅层树、写多读少 | 读多写少、展示型场景 | 静态树或极少变更 | 动态深层树 + 高性能聚合 |

### 3.2 本方案的组合策略

单一模型各有局限，本方案组合使用三种模型，各取所长：

```text
parent_id   → 邻接表模型，保证组织关系"真相"，写入最简单
org_path    → 物化路径模型，支持面包屑展示、轻量前缀筛选
org_closure → 闭包表模型，支持权限过滤、海量聚合、高性能 JOIN
```

**选型理由**：

- 嵌套集被排除，因为组织结构允许频繁调整，嵌套集的写入代价不可接受
- 纯邻接表被排除，因为需要支撑万级网点的跨层级聚合查询，递归/CTE 性能不达标
- 物化路径单独使用被排除，因为 `LIKE` 前缀匹配在大业务表上性能不稳定
- 闭包表虽有额外存储开销，但在本场景中完全可控（见[第4.3节](#43-数据膨胀量化分析)）

## 4. 闭包表原理详解

### 4.1 核心概念

闭包表（Closure Table）是一种用独立表存储树中**所有祖先-后代关系**的建模方式。核心思想是：将树的传递闭包（transitive closure）预先计算并持久化，从而将树遍历问题转化为简单的表连接问题。

闭包表的每一行表示一个祖先-后代关系：

| 字段 | 含义 |
| --- | --- |
| `ancestor_id` | 祖先节点 ID |
| `descendant_id` | 后代节点 ID |
| `depth` | 两者之间的层级距离 |

**关键规则**：每个节点都有一条**自引用行**（`ancestor_id = descendant_id`，`depth = 0`）。这条自引用行的作用是：

- 确保 `SELECT descendant_id WHERE ancestor_id = X` 的结果包含节点自身
- 简化查询逻辑，不需要 `UNION` 自身节点

### 4.2 示例推导

给定一棵简单的树：

```text
       1 (Company)
       └── 2 (Platform)
           ├── 3 (Agent)
           │   └── 4 (Shop)
           └── 5 (Shop)
```

展开为闭包表后的全部记录：

| ancestor_id | descendant_id | depth | 含义 |
| --- | --- | --- | --- |
| 1 | 1 | 0 | 自引用 |
| 2 | 2 | 0 | 自引用 |
| 3 | 3 | 0 | 自引用 |
| 4 | 4 | 0 | 自引用 |
| 5 | 5 | 0 | 自引用 |
| 1 | 2 | 1 | Company → Platform |
| 1 | 3 | 2 | Company → Agent |
| 1 | 4 | 3 | Company → Shop(4) |
| 1 | 5 | 2 | Company → Shop(5) |
| 2 | 3 | 1 | Platform → Agent |
| 2 | 4 | 2 | Platform → Shop(4) |
| 2 | 5 | 1 | Platform → Shop(5) |
| 3 | 4 | 1 | Agent → Shop(4) |

5 个节点产生了 13 行记录。规律是：每增加一个节点，闭包表增加 `(该节点的深度 + 1)` 行（包括自引用行）。

**查询示例**：

```sql
-- 查 Platform(2) 的所有后代（含自身）
SELECT descendant_id FROM org_closure WHERE ancestor_id = 2;
-- 结果: 2, 3, 4, 5

-- 查 Shop(4) 的所有祖先（含自身）
SELECT ancestor_id FROM org_closure WHERE descendant_id = 4;
-- 结果: 1, 2, 3, 4

-- 查 Platform(2) 的直接子节点
SELECT descendant_id FROM org_closure WHERE ancestor_id = 2 AND depth = 1;
-- 结果: 3, 5
```

### 4.3 数据膨胀量化分析

闭包表的主要顾虑是存储膨胀。以本方案的实际业务场景量化评估：

**理论公式**：

- 完全平衡树：n 个节点、平均深度 d → 闭包表行数约 `n × (d + 1) / 2`
- 实际树（不完全平衡）：行数 = 所有节点的深度之和 + n（自引用行）

**按本文业务场景估算**：

| 层级 | 类型 | 数量 | 深度 | 贡献闭包行 |
| --- | --- | --- | --- | --- |
| 1 | Company | 1 | 0 | 1 |
| 2 | Platform | 1 | 1 | 2 |
| 3 | Agent（含子代理） | 200 | 2~4 | ~600~1000 |
| 4 | Shop | 1,000 | 3~5 | ~4,000~5,000 |
| 5 | Site | 10,000 | 4~6 | ~50,000~60,000 |
| **合计** | | **~11,200** | | **~55,000~66,000** |

**存储估算**：

- 每行：`ancestor_id`(8B) + `descendant_id`(8B) + `depth`(4B) + `created_at`(8B) ≈ 28~40 字节
- 66,000 行 × 40 字节 ≈ **2.5 MB**
- 含索引估计总占用 **< 10 MB**

**结论**：在万级网点场景下，闭包表的数据膨胀完全可控。即使节点扩展到十万级（闭包表约百万行），也仅占几十MB，远不会成为瓶颈。

### 4.4 时间复杂度汇总

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| 查询所有后代 | O(1) 单次 JOIN | 无需递归，直接走索引 |
| 查询所有祖先 | O(1) 单次 JOIN | 同上 |
| 查询直接子节点 | O(1) 加 depth=1 条件 | |
| 插入叶子节点 | O(d) | d = 节点深度，需插入 d+1 行闭包记录 |
| 删除叶子节点 | O(d) | 删除 d+1 行闭包记录 |
| 删除子树 | O(s × d) | s = 子树节点数 |
| 移动子树 | O(s × d_old + s × d_new) | 先断旧关联，再建新关联 |

## 5. 总体架构图

```text
                       ┌───────────────────────────┐
                       │      用户 / 管理后台       │
                       └─────────────┬─────────────┘
                                     │
                                     ▼
                       ┌───────────────────────────┐
                       │   OrgService / AuthZ      │
                       │ 组织管理 + 数据权限判断     │
                       └───────┬─────────┬─────────┘
                               │         │
                 维护父子关系   │         │ 生成权限范围 / 聚合范围
                               ▼         ▼
                    ┌────────────────┐  ┌────────────────┐
                    │    org_tree    │  │  org_closure   │
                    │ parent_id      │  │ ancestor_id    │
                    │ org_path       │  │ descendant_id  │
                    │ node_type      │  │ depth          │
                    └───────┬────────┘  └────────┬───────┘
                            │                    │
                            │                    │ join
                            ▼                    ▼
                    ┌────────────────────────────────────┐
                    │   device / orders / assets ...     │
                    │            only site_id            │
                    └────────────────────────────────────┘
```

## 6. 核心数据模型

采用"三位一体"的建模方式：

- `parent_id`：表达真实父子血缘关系
- `org_path`：表达路径，便于展示和轻量过滤
- `org_closure`：表达祖先与后代的展开索引，便于高性能 Join

### 6.1 组织主表 `org_tree`

```sql
CREATE TABLE org_tree (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '组织节点 ID',
    parent_id   BIGINT UNSIGNED  NULL     COMMENT '父节点 ID，根节点为 NULL',
    node_type   VARCHAR(20)      NOT NULL COMMENT '节点类型: company/platform/agent/shop/site',
    node_name   VARCHAR(128)     NOT NULL COMMENT '节点名称',
    org_path    VARCHAR(512)     NOT NULL COMMENT '物化路径，如 /1/2/8/15',
    level       SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '节点在树中的绝对层级，根节点为 0',
    status      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=启用 2=停用 3=冻结',
    owner_id    BIGINT UNSIGNED  NULL     COMMENT '可选，负责人 ID',
    version     INT UNSIGNED     NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_org_path (org_path),
    INDEX idx_node_type (node_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织树主表';
```

**字段说明**：

| 字段 | 说明 |
| --- | --- |
| `level` | 节点在树中的**绝对层级**（Company=0, Platform=1, ...）。注意与闭包表的 `depth` 区别：`depth` 是两个节点之间的**相对距离** |
| `org_path` | 由服务端统一生成，禁止前端参与。`LIKE '/1/5/%'` 前缀匹配可走索引（需确保 `org_path` 列上有索引且查询使用左前缀） |
| `version` | 乐观锁版本号，用于并发移动时的冲突检测 |

**约束规则**：

- `parent_id + node_type` 需要有业务约束校验
- `site` 必须挂在 `shop` 下，`shop` 可挂在 `platform` 或 `agent` 下
- `agent` 可挂在 `platform` 或另一个 `agent` 下（支持无限子代理）

### 6.2 闭包表 `org_closure`

```sql
CREATE TABLE org_closure (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    ancestor_id    BIGINT UNSIGNED NOT NULL COMMENT '祖先节点 ID',
    descendant_id  BIGINT UNSIGNED NOT NULL COMMENT '后代节点 ID',
    depth          SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '相对深度，自己到自己为 0',
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，用于排查闭包重建时间和审计变更',
    PRIMARY KEY (id),
    UNIQUE INDEX uk_ancestor_descendant (ancestor_id, descendant_id),
    INDEX idx_descendant_ancestor (descendant_id, ancestor_id),
    INDEX idx_ancestor_depth (ancestor_id, depth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织闭包表 - 存储所有祖先后代关系';
```

**索引说明**：

| 索引 | 用途 |
| --- | --- |
| `uk_ancestor_descendant` | 唯一约束 + 查某节点所有后代（最高频场景） |
| `idx_descendant_ancestor` | 查某节点所有祖先（面包屑、权限校验） |
| `idx_ancestor_depth` | 按层级筛选，如只查直接子节点 `depth=1` |

### 6.3 业务表

以设备表和订单表为例：

```sql
CREATE TABLE device (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    site_id     BIGINT UNSIGNED  NOT NULL COMMENT '归属网点 ID',
    device_no   VARCHAR(64)      NOT NULL,
    status      TINYINT UNSIGNED NOT NULL,
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    site_id     BIGINT UNSIGNED  NOT NULL COMMENT '归属网点 ID',
    order_no    VARCHAR(64)      NOT NULL,
    amount      DECIMAL(18,2)    NOT NULL,
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_site_id (site_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**关键要求**：

- 只保留 `site_id`
- 所有跨组织统计都通过 `org_closure` 中转

## 7. CRUD 操作详解

### 7.1 新增节点

新增一个节点时，需要同时维护 `org_tree` 和 `org_closure`。

**步骤 1：插入 org_tree 记录**

```sql
-- 假设新增一个 Shop，挂在 Agent(id=3) 下
INSERT INTO org_tree (parent_id, node_type, node_name, org_path, level)
VALUES (3, 'shop', 'Shop S6', '/1/2/3/NEW_ID', 3);
-- org_path 和 level 由服务端根据父节点信息计算后填入
```

**步骤 2：插入 org_closure 记录**

为新节点建立与所有祖先的闭包关系，加上自引用行：

```sql
-- 假设新节点 ID 为 @new_id
-- 方法：将父节点的所有祖先行复制一份，descendant_id 指向新节点，depth + 1
INSERT INTO org_closure (ancestor_id, descendant_id, depth)
SELECT ancestor_id, @new_id, depth + 1
FROM org_closure
WHERE descendant_id = @parent_id    -- @parent_id = 3

UNION ALL

SELECT @new_id, @new_id, 0;         -- 自引用行
```

以上面的示例树为例，如果 `@parent_id = 3`（Agent），闭包表中 `descendant_id = 3` 的行有：

| ancestor_id | depth |
| --- | --- |
| 1 | 2 |
| 2 | 1 |
| 3 | 0 |

因此新插入的闭包行为：`(1, NEW, 3)`, `(2, NEW, 2)`, `(3, NEW, 1)`, `(NEW, NEW, 0)`。

### 7.2 删除叶子节点

```sql
-- 步骤 1：删除闭包表中所有涉及该节点的行
DELETE FROM org_closure WHERE descendant_id = @node_id;

-- 步骤 2：删除 org_tree 记录
DELETE FROM org_tree WHERE id = @node_id;
```

> **安全检查**：删除前应校验该节点没有子节点（`SELECT COUNT(*) FROM org_tree WHERE parent_id = @node_id`），否则应走"删除子树"流程。

### 7.3 删除子树

```sql
-- 步骤 1：找出子树的所有节点 ID
-- 注意使用临时表或子查询避免 MySQL 的 "can't specify target table" 问题
CREATE TEMPORARY TABLE tmp_subtree_ids AS
SELECT descendant_id FROM org_closure WHERE ancestor_id = @subtree_root_id;

-- 步骤 2：删除闭包表中所有涉及子树节点的行
DELETE FROM org_closure
WHERE descendant_id IN (SELECT descendant_id FROM tmp_subtree_ids);

-- 步骤 3：删除 org_tree 中的子树节点
DELETE FROM org_tree
WHERE id IN (SELECT descendant_id FROM tmp_subtree_ids);

DROP TEMPORARY TABLE tmp_subtree_ids;
```

> **业务检查**：删除子树前应检查子树下是否有活跃的业务数据（设备、未完成订单等），建议先做"软删除"（设置 status=停用），确认无业务残留后再物理删除。

### 7.4 移动子树（三步法完整 SQL）

这是闭包表中最复杂的操作。将节点 `@node_id` 从旧父节点移动到新父节点 `@new_parent_id`。

**前置校验**：

```sql
-- 检查新父节点不能是当前节点的后代（否则会形成环）
SELECT COUNT(*) FROM org_closure
WHERE ancestor_id = @node_id AND descendant_id = @new_parent_id;
-- 如果 > 0，拒绝移动
```

**第一步：断开旧祖先关联**

删除"旧祖先们"与"当前节点及其所有后代"之间的映射关系，但保留子树内部的关系。

```sql
DELETE FROM org_closure
WHERE
    -- 后代是子树内的节点
    descendant_id IN (
        SELECT descendant_id FROM (
            SELECT descendant_id FROM org_closure WHERE ancestor_id = @node_id
        ) AS subtree
    )
    -- 祖先不是子树内的节点（保留子树内部关系）
    AND ancestor_id NOT IN (
        SELECT descendant_id FROM (
            SELECT descendant_id FROM org_closure WHERE ancestor_id = @node_id
        ) AS subtree2
    );
```

**第二步：建立新祖先关联**

将"新父节点的所有祖先（含新父节点自身）"与"子树内所有节点"做笛卡尔积，建立新的闭包关系。

```sql
INSERT INTO org_closure (ancestor_id, descendant_id, depth)
SELECT
    super.ancestor_id,
    sub.descendant_id,
    super.depth + sub.depth + 1
FROM
    -- 新父节点的所有祖先（含自身）
    (SELECT ancestor_id, depth FROM org_closure WHERE descendant_id = @new_parent_id) AS super
CROSS JOIN
    -- 子树内所有节点（含子树根节点自身）
    (SELECT descendant_id, depth FROM org_closure WHERE ancestor_id = @node_id) AS sub;
```

**第三步：更新 org_tree**

```sql
-- 更新 parent_id
UPDATE org_tree SET parent_id = @new_parent_id, version = version + 1
WHERE id = @node_id AND version = @expected_version;  -- 乐观锁

-- 更新子树所有节点的 org_path 和 level
-- 通常由应用层计算后批量 UPDATE
```

> **事务建议**：如果子树较小（< 1000 节点），三步操作可以在同一事务内完成，保证强一致性。如果子树很大，建议按 [第11节](#11-组织变更策略) 的异步策略处理。

## 8. 查询策略

### 8.1 海量聚合查询

场景：代理商 `5` 需要查询其下所有网点的设备或订单。

错误做法：

- 先查出 12000 个 `site_id`
- 再拼超长 `IN (...)`

推荐做法：

```sql
SELECT d.*
FROM device d
JOIN org_closure oc
  ON oc.descendant_id = d.site_id
WHERE oc.ancestor_id = 5;
```

优势：

- 避免万级 `IN`
- 更容易命中索引
- SQL 更稳定，适合分页、聚合、统计

### 8.2 聚合统计

```sql
-- 统计某代理商下所有网点的订单总额
SELECT SUM(o.amount) AS total_amount, COUNT(*) AS order_count
FROM orders o
JOIN org_closure oc ON oc.descendant_id = o.site_id
WHERE oc.ancestor_id = 5;

-- 按商户分组统计（需要关联 org_tree 获取商户信息）
SELECT t.id AS shop_id, t.node_name AS shop_name,
       SUM(o.amount) AS total_amount, COUNT(*) AS order_count
FROM orders o
JOIN org_closure oc1 ON oc1.descendant_id = o.site_id AND oc1.ancestor_id = 5
JOIN org_closure oc2 ON oc2.descendant_id = o.site_id AND oc2.depth = 1
JOIN org_tree t ON t.id = oc2.ancestor_id AND t.node_type = 'shop'
GROUP BY t.id, t.node_name;
```

### 8.3 树形展示

场景：管理后台展示组织树。

推荐做法：

- 读取目标分支的 `org_tree`
- 用 `parent_id` 在应用层组装树

轻量筛选也可直接使用：

```sql
SELECT *
FROM org_tree
WHERE org_path LIKE '/1/5/%';
```

说明：

- `LIKE '/1/5/%'` 适合轻量读，不适合海量业务表联查
- 需确保 `org_path` 列上有索引，且查询使用左前缀匹配才能走索引
- 树形展示不要走 `org_closure` 全量回表

### 8.4 数据权限过滤

在服务层统一封装"当前用户可见组织范围"：

```text
当前用户 -> 绑定 org_id
        -> 根据 org_id 查询 org_closure
        -> 生成可访问 descendant_id 范围
        -> 自动拼接到业务 SQL / Repository 条件
```

这样业务开发只需要关注"查订单""查设备"，不需要反复手写组织过滤逻辑。

## 9. 性能优化

### 9.1 索引优化

**闭包表覆盖索引**：

如果最常见的查询模式是通过 `ancestor_id` 查 `descendant_id`，可以考虑覆盖索引避免回表：

```sql
-- 覆盖索引：查后代时无需回表
ALTER TABLE org_closure ADD INDEX idx_cover_ancestor (ancestor_id, descendant_id, depth);
```

**业务表联合索引**：

业务表上 `site_id` 需要根据查询模式设计联合索引：

```sql
-- 如果经常按时间范围 + 网点查订单
ALTER TABLE orders ADD INDEX idx_site_created (site_id, created_at);
```

### 9.2 分页查询优化

**错误做法**：先 JOIN 再 OFFSET

```sql
-- 慢：先 JOIN 产生大结果集，再跳过前 N 条
SELECT d.* FROM device d
JOIN org_closure oc ON oc.descendant_id = d.site_id
WHERE oc.ancestor_id = 5
LIMIT 20 OFFSET 10000;
```

**推荐做法**：延迟关联或游标分页

```sql
-- 方案 A：延迟关联，先在业务表内分页取 ID，再 JOIN 校验权限
SELECT d.*
FROM device d
JOIN (
    SELECT d2.id
    FROM device d2
    JOIN org_closure oc ON oc.descendant_id = d2.site_id
    WHERE oc.ancestor_id = 5
    ORDER BY d2.id
    LIMIT 20 OFFSET 10000
) AS page ON d.id = page.id;

-- 方案 B：游标分页（推荐，性能稳定不随页码增大而劣化）
SELECT d.*
FROM device d
JOIN org_closure oc ON oc.descendant_id = d.site_id
WHERE oc.ancestor_id = 5 AND d.id > @last_seen_id
ORDER BY d.id
LIMIT 20;
```

### 9.3 COUNT 优化

海量数据的 `COUNT` 可以采用预计算策略：

```sql
-- 预计算表：定时刷新各节点下的统计数据
CREATE TABLE org_stats (
    org_id      BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    device_count INT UNSIGNED NOT NULL DEFAULT 0,
    order_count  INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

通过定时任务或事件驱动增量更新，避免实时 `COUNT` 全表扫描。

### 9.4 读写分离

闭包表和组织树的特点是**读多写少**（组织结构变更频率远低于业务查询），适合读写分离：

- 写操作走主库：组织变更（低频）
- 读操作走从库：权限校验、聚合查询（高频）
- 注意从库延迟：组织变更后短时间内的查询可能走旧数据，对于关键操作（如刚移动后的权限校验）应显式走主库

## 10. 缓存策略

组织树和闭包表是典型的"读多写少"数据，适合做较长时间的缓存。

### 10.1 缓存设计

| 缓存项 | 缓存 Key 格式 | 数据结构 | TTL |
| --- | --- | --- | --- |
| 某节点的所有后代 ID | `org:descendants:{org_id}` | Redis Set | 24h + 事件失效 |
| 某节点的祖先链 | `org:ancestors:{org_id}` | Redis List | 24h + 事件失效 |
| 完整组织树 | `org:tree:full` | Redis String (JSON) | 1h + 事件失效 |
| 节点基本信息 | `org:node:{org_id}` | Redis Hash | 24h + 事件失效 |

### 10.2 缓存失效策略

**事件驱动失效**（推荐，优于 TTL 过期）：

```text
组织变更事件 (OrgNodeMovedEvent / OrgNodeCreatedEvent / OrgNodeDeletedEvent)
    │
    ├── 计算受影响的 ancestor_id 列表
    │   （移动操作：旧祖先链 + 新祖先链上的所有节点）
    │
    ├── 批量删除 org:descendants:{受影响的ancestor_id}
    ├── 批量删除 org:ancestors:{子树中所有节点}
    └── 删除 org:tree:full
```

### 10.3 多级缓存

对于超高频访问场景，可以采用本地缓存 + Redis 的多级缓存：

- **L1 本地缓存**（进程内，如 Caffeine / Guava Cache）：组织树结构、当前用户的数据权限范围。TTL 短（5-10分钟），容量小
- **L2 Redis 缓存**：闭包关系、节点信息。TTL 长（24h），事件驱动失效
- **L3 数据库**：兜底

### 10.4 缓存预热

系统启动或闭包表重建后，批量预热高频节点的缓存：

- Platform 和一级 Agent 的后代列表（覆盖 80% 的权限查询）
- 完整组织树（前端展示的高频调用）

## 11. 组织变更策略

组织变更是低频操作，但复杂度高。建议采用"同步改主链路，异步刷索引"的模式。

### 11.1 变更流程图

```text
管理员发起移动节点
        │
        ▼
前置校验（环路检测、版本号校验）
        │
        ▼
同步更新 org_tree.parent_id
同步更新 org_tree.org_path
        │
        ▼
发送 OrgNodeMovedEvent
        │
        ▼
异步 Worker 重建 org_closure
        │
        ├── 删除旧祖先关系
        ├── 插入新祖先关系
        └── 校验 depth / 一致性
        ▼
缓存失效 / 权限刷新 / 审计记录
```

### 11.2 一致性窗口期

异步重建闭包表期间存在一个一致性窗口期，在此期间闭包表可能与 `org_tree` 不一致。需要根据业务场景选择处理策略：

| 策略 | 适用场景 | 说明 |
| --- | --- | --- |
| **容忍窗口期** | 大部分管理后台场景 | 窗口期内查询可能返回旧归属数据，通常几秒到几分钟，业务可接受 |
| **同步更新** | 子树较小（< 500节点） | 将闭包表更新纳入同一事务，保证强一致性 |
| **版本号机制** | 对一致性要求高 | 闭包表增加 `rebuild_version` 字段，查询时校验版本号，版本不匹配时降级为实时计算 |

**推荐**：小子树同步更新，大子树异步更新 + 容忍短暂窗口期。

### 11.3 并发控制

**并发移动同一节点**：

使用乐观锁（`org_tree.version` 字段）防止并发冲突：

```sql
UPDATE org_tree
SET parent_id = @new_parent_id, org_path = @new_path,
    level = @new_level, version = version + 1
WHERE id = @node_id AND version = @expected_version;
-- 影响行数为 0 表示版本冲突，需要重试或返回错误
```

**异步 Worker 幂等性**：

- 重建闭包表的 Worker 应设计为幂等操作：先删再插，而非增量修改
- 使用分布式锁（如 Redis `SETNX`）保证同一时刻只有一个 Worker 在处理同一个子树的重建
- 事件消息应包含 `version` 字段，Worker 开始前校验版本号是否匹配，避免处理过时事件

**分布式锁示例**：

```text
lock_key = "org:rebuild:{node_id}"
lock_ttl = 30s（根据预估重建时间设置）

if (acquireLock(lock_key, lock_ttl)) {
    try {
        rebuildClosure(node_id)
    } finally {
        releaseLock(lock_key)
    }
} else {
    // 已有 Worker 在处理，跳过或延迟重试
}
```

## 12. 一致性与历史口径

### 12.1 为什么不能只改 `parent_id`

如果只改 `parent_id`，而不维护 `org_path` 和 `org_closure`，会出现：

- 树展示正确，但聚合统计错误
- 权限范围旧数据残留
- 同一个用户在不同接口看到的数据口径不一致

### 12.2 历史统计口径如何处理

需要先明确业务规则：

- 如果"统计看当前归属"，则直接按当前 `org_closure` 查询
- 如果"统计看历史归属"，则订单类业务表要增加归档维度，例如 `settle_org_id` 或按日快照

推荐方案：

- 实时查询口径：走当前组织关系
- 财务结算、绩效报表：走结算快照或日报宽表

不要试图用一套实时组织树同时满足所有历史报表诉求。

## 13. 分库分表策略

### 13.1 组织表是否需要分表

**通常不需要**。`org_tree` 和 `org_closure` 属于元数据表：

- `org_tree` 行数 = 组织节点数（万级），单表完全承受
- `org_closure` 行数 = 数万到数十万（见[第4.3节](#43-数据膨胀量化分析)），单表完全承受
- **阈值建议**：节点数 < 50万 + 闭包行 < 500万时，无需分表

建议将组织相关表部署在**独立的组织服务库**中，与业务库物理隔离。

### 13.2 业务表的分库分表

业务表（订单、设备、交易）才是需要分表的对象。分表后与闭包表的 JOIN 策略需要调整：

**分片键选择**：

| 分片键 | 优势 | 劣势 |
| --- | --- | --- |
| `site_id` | 同一网点的数据在同一分片，便于闭包表 JOIN | 热点网点可能导致数据倾斜 |
| `order_id` / 自增ID | 数据分布均匀 | 跨分片聚合成本高 |
| 时间 | 天然适合按时间范围查询 | 热点集中在最新分片 |

### 13.3 跨库 JOIN 的替代方案

当业务表分库后，无法直接与 `org_closure` 做跨库 JOIN。替代方案：

```text
方案 A: 应用层两阶段查询
    1. 查询 org_closure 获取 site_id 列表
    2. 将 site_id 列表传入业务库查询（IN 查询或临时表）
    适用：site_id 列表较小（< 1000）

方案 B: 聚合中间表 / 数据仓库
    1. 将组织关系同步到数据仓库（如 ClickHouse）
    2. 业务数据同步到同一数据仓库
    3. 在数据仓库中做聚合 JOIN
    适用：报表类查询，可接受分钟级延迟

方案 C: 业务表冗余 org_path
    1. 业务表增加 org_path 字段（反范式）
    2. 使用 LIKE 前缀匹配替代 JOIN
    适用：分片内查询，对一致性要求不高
```

## 14. 监控与告警

### 14.1 一致性监控

建议每日离峰执行一致性检查：

```sql
-- 检查 1：闭包表是否有缺失的关系
-- 基于 org_tree 的 parent_id 链推导出应有的闭包行，与实际闭包表对比
WITH RECURSIVE expected_closure AS (
    SELECT id AS ancestor_id, id AS descendant_id, 0 AS depth
    FROM org_tree
    UNION ALL
    SELECT ec.ancestor_id, t.id, ec.depth + 1
    FROM expected_closure ec
    JOIN org_tree t ON t.parent_id = ec.descendant_id
)
SELECT ec.ancestor_id, ec.descendant_id
FROM expected_closure ec
LEFT JOIN org_closure oc ON oc.ancestor_id = ec.ancestor_id
    AND oc.descendant_id = ec.descendant_id
WHERE oc.ancestor_id IS NULL;
-- 结果不为空表示有缺失的闭包行

-- 检查 2：闭包表是否有多余的关系（可能是旧数据残留）
SELECT oc.ancestor_id, oc.descendant_id
FROM org_closure oc
LEFT JOIN org_tree ta ON ta.id = oc.ancestor_id
LEFT JOIN org_tree td ON td.id = oc.descendant_id
WHERE ta.id IS NULL OR td.id IS NULL;

-- 检查 3：org_path 是否与 parent_id 一致
-- 由应用层遍历校验，对比 org_path 中编码的路径与实际 parent_id 链
```

### 14.2 性能监控

| 监控项 | 告警阈值建议 | 说明 |
| --- | --- | --- |
| 闭包表总行数 | 突增 >20%（日环比） | 可能是异常批量操作或BUG |
| 闭包表 JOIN 查询 P99 延迟 | > 200ms | 检查索引是否失效 |
| 闭包重建任务执行时间 | > 60s | 大子树移动或系统压力 |
| 闭包重建任务失败率 | > 0 | 立即告警排查 |

### 14.3 业务监控

```sql
-- 孤儿节点检测：业务表中 site_id 不在 org_tree 中
SELECT DISTINCT d.site_id
FROM device d
LEFT JOIN org_tree t ON t.id = d.site_id
WHERE t.id IS NULL;

-- 组织变更频率监控
SELECT DATE(updated_at) AS dt, COUNT(*) AS changes
FROM org_tree
WHERE updated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(updated_at)
ORDER BY dt;
```

## 15. API 设计建议

### 15.1 核心接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/orgs` | 创建节点（需传 parent_id, node_type, node_name） |
| `PUT` | `/orgs/:id` | 更新节点信息 |
| `PUT` | `/orgs/:id/move` | 移动节点（需传 new_parent_id），返回异步任务 ID |
| `DELETE` | `/orgs/:id` | 删除节点（需校验无子节点和活跃业务数据） |
| `GET` | `/orgs/:id/subtree` | 获取子树（支持 `depth` 参数限制层级） |
| `GET` | `/orgs/:id/ancestors` | 获取祖先链（面包屑用） |
| `GET` | `/orgs/:id/descendants` | 获取所有后代（支持 `node_type` 过滤） |
| `GET` | `/orgs/:id/scope` | 获取数据权限范围（所有可见 site_id） |

### 15.2 设计要点

- **移动操作异步化**：`PUT /orgs/:id/move` 返回 `202 Accepted` + 任务 ID，前端轮询 `GET /tasks/:taskId` 或通过 WebSocket 通知完成状态
- **树形懒加载**：`GET /orgs/:id/subtree?depth=1` 只返回直接子节点，前端按需展开
- **乐观锁**：更新和移动接口应接受 `version` 参数，服务端校验版本号一致后才执行变更
- **批量操作**：提供批量创建和批量移动接口，减少网络往返

### 15.3 响应示例

```json
// POST /orgs 创建节点
{
  "id": 42,
  "parent_id": 3,
  "node_type": "shop",
  "node_name": "Shop S6",
  "org_path": "/1/2/3/42",
  "level": 3,
  "version": 1
}

// PUT /orgs/42/move 移动节点（异步）
{
  "task_id": "move-20240301-001",
  "status": "processing",
  "message": "节点移动任务已提交"
}
```

## 16. 从现有系统迁移

### 16.1 迁移场景

| 场景 | 说明 |
| --- | --- |
| **A: 从纯邻接表迁移** | 现有系统只有 `parent_id`，需要生成 `org_path` 和 `org_closure` |
| **B: 从冗余字段迁移** | 业务表中存在 `agent_id / shop_id` 等冗余字段，需要清理 |
| **C: 从扁平组织迁移** | 现有系统没有多层级概念，需要重新建模 |

### 16.2 全量生成闭包数据（SQL 模板）

基于现有 `parent_id` 关系，用递归 CTE 一次性生成全量闭包数据：

```sql
-- 适用于 MySQL 8.0+ / PostgreSQL
INSERT INTO org_closure (ancestor_id, descendant_id, depth)
WITH RECURSIVE closure AS (
    -- 基础情况：每个节点的自引用行
    SELECT id AS ancestor_id, id AS descendant_id, 0 AS depth
    FROM org_tree

    UNION ALL

    -- 递归：沿 parent_id 链向上，每一级都建立一条闭包行
    SELECT c.ancestor_id, t.id AS descendant_id, c.depth + 1
    FROM closure c
    JOIN org_tree t ON t.parent_id = c.descendant_id
    WHERE c.ancestor_id = c.ancestor_id  -- 保持祖先不变，后代沿树向下展开
)
SELECT ancestor_id, descendant_id, depth FROM closure;
```

> **注意**：上面的 CTE 对于大型树可能需要调整 `max_recursion_depth`（MySQL 默认 1000）。如果节点数超过万级，建议分批处理或使用应用层递归生成。

### 16.3 迁移步骤

```text
Phase 1: 准备
  ├── 梳理现有组织数据和业务表的组织字段使用
  ├── 创建 org_closure 表
  └── 编写并测试全量闭包数据生成脚本

Phase 2: 双写
  ├── 新增/变更操作同时维护旧字段和闭包表
  ├── 新旧查询结果对比验证
  └── 持续 1-2 周确认无差异

Phase 3: 切换
  ├── 业务查询切换到闭包表 JOIN 模式
  ├── 旧查询逻辑标记为 @Deprecated
  └── 监控新查询的性能和正确性

Phase 4: 清理
  ├── 移除业务表中的冗余组织字段
  ├── 移除旧查询代码
  └── 更新文档和 API 说明
```

**回滚方案**：Phase 3 阶段保留旧字段和旧查询逻辑至少 1 个月，出现问题可通过配置开关快速回退到旧模式。

## 17. 风险与对策

### 17.1 闭包表数据膨胀

现象：节点越多，闭包表记录越多。

结论：在本业务场景下完全可控。万级节点 → 闭包表 ~6万行 / ~3MB（详见[第4.3节](#43-数据膨胀量化分析)）。闭包表是窄表，只要索引设计合理，百万级记录也不会成为瓶颈。

### 17.2 节点迁移导致长事务

对策：

- 迁移主流程只改 `org_tree`（同步，毫秒级）
- `org_closure` 通过异步任务分批重建
- 大分支迁移时按后代批次处理（每批 500 节点），避免锁表
- 设置合理的事务超时和重试机制

### 17.3 开发同学误用组织字段

对策：

- Repository 层统一封装组织过滤能力
- 禁止业务表额外新增 `agent_id/shop_id` 一类冗余字段
- 用代码扫描或评审规则约束
- 提供 `@OrgScope` 注解或 AOP 拦截器自动附加组织条件

### 17.4 缓存与数据库不一致

对策：

- 组织变更事件驱动缓存失效，而非依赖 TTL
- 关键操作（如移动后的权限校验）显式走主库 + 跳过缓存
- 定时巡检缓存与数据库的一致性

## 18. 推荐落地方案

### 18.1 最终职责分工

```text
parent_id  -> 保证组织关系真实正确
org_path   -> 支持路径展示、面包屑、轻量筛选
org_closure-> 支持权限过滤、海量业务聚合、高性能 Join
```

### 18.2 推荐工程实现

| 模块 | 职责 |
| --- | --- |
| `OrgService` | 维护组织节点增删改移，负责 org_tree 的 CRUD |
| `OrgQueryService` | 提供树查询、面包屑、可见范围查询 |
| `OrgClosureWorker` | 异步重建闭包表，支持幂等和分批处理 |
| `AuthScopeInterceptor` | 统一附加组织数据权限（AOP / 拦截器） |
| `ConsistencyChecker` | 定时校验 org_tree 与 org_closure 一致性 |
| `OrgCacheManager` | 管理多级缓存的读写和失效 |
| `OrgEventPublisher` | 发布组织变更事件，驱动缓存失效和闭包重建 |

### 18.3 技术栈建议

| 组件 | 推荐选型 | 说明 |
| --- | --- | --- |
| 数据库 | MySQL 8.0+ / PostgreSQL | 支持 CTE 递归查询 |
| 缓存 | Redis 6+ | Set/Hash 结构存储组织关系 |
| 消息队列 | RabbitMQ / Kafka | 组织变更事件发布 |
| 分布式锁 | Redis / ZooKeeper | 并发变更控制 |
| 定时任务 | XXL-JOB / Quartz | 一致性校验、统计预计算 |

## 19. 延伸阅读

- **Bill Karwin《SQL Antipatterns》** 第 3 章"Naive Trees"，系统对比了邻接表、物化路径、嵌套集和闭包表四种模型
- **Dirk de Kok "Models for Hierarchical Data"** -- 闭包表的深入讲解与性能基准测试
- **MySQL 官方文档 - CTE (WITH RECURSIVE)** -- 递归查询语法参考
- **Martin Fowler "Patterns of Enterprise Application Architecture"** -- 组织建模与数据权限的架构模式

## 20. 结论

这套方案的核心不是"只选一种树模型"，而是分工明确地组合使用：

- `org_tree` 负责真相
- `org_path` 负责可读性
- `org_closure` 负责性能

如果系统目标是支撑万级网点、千万级设备或订单查询，并且组织结构允许频繁调整，那么这是一套可维护、可扩展、可审计的标准方案。
