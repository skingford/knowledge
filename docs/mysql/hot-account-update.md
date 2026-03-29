---
title: 热点账户更新
description: 热点更新的现象与根因分析，从乐观锁到子账户拆分的分层治理方案。
---

# 热点账户更新

> 热点更新本质是大量请求并发修改同一行，导致行锁排队、TPS 降低、接口超时放大。在支付系统里最典型的是热点账户（大商户余额、直播间打赏账户、平台总账、库存型额度账户）。

**答题顺序**：现象 → 根因 → 分层治理方案（从轻到重）

现象通常不是 CPU 高，而是锁等待高、接口 RT 明显抖动；根因是同一行被频繁更新，事务持锁时间稍长就形成排队。

---

## 分层治理思路

<div style="display:flex;justify-content:center;padding:18px 0;">
<div style="font-family:system-ui,sans-serif;max-width:860px;width:100%;">
<svg viewBox="0 0 860 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">热点账户更新的分层治理路径</text>

  <rect x="20" y="52" width="120" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2"/>
  <text x="80" y="74" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">热点强度</text>
  <rect x="160" y="52" width="220" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2"/>
  <text x="270" y="74" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">方案</text>
  <rect x="400" y="52" width="440" height="34" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2"/>
  <text x="620" y="74" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">适用场景</text>

  <rect x="20" y="96" width="120" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
  <text x="80" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">低并发</text>
  <rect x="160" y="96" width="220" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
  <text x="270" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">乐观锁 + CAS 重试</text>
  <rect x="400" y="96" width="440" height="34" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="420" y="118" font-size="10" fill="var(--d-text)">版本号检测，冲突后快速重试</text>

  <rect x="20" y="140" width="120" height="34" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="80" y="162" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">中并发</text>
  <rect x="160" y="140" width="220" height="34" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="270" y="162" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">事务后段锁</text>
  <rect x="400" y="140" width="440" height="34" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="420" y="162" font-size="10" fill="var(--d-text)">把余额更新放到事务最后一步，缩短持锁时间</text>

  <rect x="20" y="184" width="120" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="80" y="206" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">高并发</text>
  <rect x="160" y="184" width="220" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="270" y="206" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">内存队列合并更新</text>
  <rect x="400" y="184" width="440" height="34" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="420" y="206" font-size="10" fill="var(--d-text)">10ms 窗口攒批，把 N 笔写请求合并成一次 UPDATE</text>

  <rect x="20" y="228" width="120" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="80" y="250" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">极高并发</text>
  <rect x="160" y="228" width="220" height="34" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="270" y="250" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">子账户拆分</text>
  <rect x="400" y="228" width="440" height="34" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="420" y="250" font-size="10" fill="var(--d-text)">把一行拆成 N 行分散写入，查询时再 SUM 汇总</text>
</svg>
</div>
</div>

---

## 子账户拆分示意图

<div style="display:flex;justify-content:center;padding:18px 0;">
<div style="font-family:system-ui,sans-serif;max-width:900px;width:100%;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="hot-sub-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
    </marker>
  </defs>

  <text x="450" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">子账户拆分：把单热点行改成多行分散写入</text>

  <text x="170" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">拆分前</text>
  <rect x="40" y="66" width="260" height="150" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5"/>
  <rect x="60" y="88" width="220" height="32" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="170" y="109" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">account</text>
  <rect x="60" y="130" width="220" height="28" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="170" y="149" text-anchor="middle" font-size="10" fill="var(--d-text)">id = 1001</text>
  <rect x="60" y="166" width="220" height="28" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="170" y="185" text-anchor="middle" font-size="10" fill="var(--d-text)">balance = 100 万</text>
  <text x="170" y="238" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">大量并发写同一行</text>
  <text x="170" y="255" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">行锁严重排队</text>

  <line x1="320" y1="142" x2="420" y2="142" stroke="var(--d-blue-border)" stroke-width="2" marker-end="url(#hot-sub-arrow)"/>
  <text x="370" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">拆成 N 个子账户</text>

  <text x="655" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">拆分后（N = 4）</text>

  <rect x="470" y="70" width="130" height="64" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="535" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">sub_0</text>
  <text x="535" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">balance</text>

  <rect x="620" y="70" width="130" height="64" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="685" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">sub_1</text>
  <text x="685" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">balance</text>

  <rect x="470" y="152" width="130" height="64" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="535" y="176" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">sub_2</text>
  <text x="535" y="196" text-anchor="middle" font-size="10" fill="var(--d-text)">balance</text>

  <rect x="620" y="152" width="130" height="64" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="685" y="176" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">sub_3</text>
  <text x="685" y="196" text-anchor="middle" font-size="10" fill="var(--d-text)">balance</text>

  <rect x="470" y="244" width="280" height="36" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3"/>
  <text x="610" y="266" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">写入时随机选择一个 `sub_index`，把单点写压力打散</text>

  <line x1="610" y1="280" x2="610" y2="312" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#hot-sub-arrow)"/>
  <rect x="500" y="312" width="220" height="32" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="610" y="333" text-anchor="middle" font-size="10" fill="var(--d-text)">查询总余额：`SELECT SUM(balance) ...`</text>
</svg>
</div>
</div>

---

## 代码示例

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

---

## 继续阅读

- [死锁检测与回滚重试](./deadlock-and-retry.md)
- [分库分表与迁移](./sharding-and-migration.md)
- [返回 MySQL 专题总览](./index.md)
