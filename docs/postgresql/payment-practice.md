---
title: PostgreSQL 支付场景追问
description: PostgreSQL 在支付场景下的典型追问：长事务问题、流水表分区、CopyFrom 使用时机、复制延迟监控。
---

# PostgreSQL 支付场景追问

建议先用追问表快速过一遍：

| 追问 | 本质 | 常见答案方向 |
| --- | --- | --- |
| 为什么 PostgreSQL 长事务问题很重 | 老版本回收被拖住 | MVCC + VACUUM |
| 流水表为什么适合分区 | 单表太大、归档困难 | 时间分区 + 热冷分离 |
| 什么时候用 `CopyFrom` | 批量回填、归档导入 | 高吞吐离线写入 |
| 如何看复制延迟 | 主从同步滞后 | WAL lag、监控、只读流量控制 |

## 为什么 PostgreSQL 长事务问题很重

<details>
<summary><strong>为什么 PostgreSQL 长事务问题很重？</strong></summary>

> 因为 PostgreSQL 的 MVCC 需要保留旧版本给老事务看。如果事务长时间不结束，旧版本就回收不了，表膨胀和 VACUUM 压力都会放大。

支付场景里最典型的问题是：

- 长时间跑报表
- 对账任务事务范围过大
- 连接没正确提交/回滚，事务一直挂着

</details>

## 流水表为什么适合分区

<details>
<summary><strong>流水表为什么适合分区？</strong></summary>

> 流水表天然按时间增长，查询也常常带时间范围条件，所以非常适合做时间分区。这样可以降低单分区索引体积，也方便归档和清理。

</details>

## 什么时候用 `CopyFrom`

<details>
<summary><strong>什么时候用 `CopyFrom`？</strong></summary>

> 当场景是批量导入、历史回填、离线迁移、流水归档时，`CopyFrom` 往往比逐条 `INSERT` 快得多。实时主交易链路不一定适合它，但离线链路非常适合。

</details>

## 如何看复制延迟

<details>
<summary><strong>如何看复制延迟？</strong></summary>

> 核心是看主从 WAL 差距和回放延迟。延迟高时，读流量不要盲目打到从库，否则容易读到过旧数据，影响订单与账务查询一致性。

</details>

---

## 继续阅读

- [核心概念与高频考点](./core-concepts.md)
- [高可用集群整理](./ha-cluster.md)
- [返回 PostgreSQL 专题总览](./index.md)
