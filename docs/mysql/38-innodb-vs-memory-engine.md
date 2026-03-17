---
title: "MySQL 实战 45 讲：38. 都说 InnoDB 好，那还要不要使用 Memory 引擎？"
description: "极客时间《MySQL 实战 45 讲》第 38 讲笔记整理"
---

# 38. 都说 InnoDB 好，那还要不要使用 Memory 引擎？

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

我在上一篇文章末尾留给你的问题是：两个group by 语句都用了order by null，为什么使用内存临时表得到的语句结果里，0这个值在最后一行；而使用磁盘临时表得到的结果里，0这个值在第一行？

今天我们就来看看，出现这个问题的原因吧。

## 内存表的数据组织结构

为了便于分析，我来把这个问题简化一下，假设有以下的两张表t1 和 t2，其中表t1使用Memory 引擎， 表t2使用InnoDB引擎。

```sql
create table t1(id int primary key, c int) engine=Memory;
create table t2(id int primary key, c int) engine=innodb;
insert into t1 values(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(0,0);
insert into t2 values(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(0,0);
```


然后，我分别执行select * from t1和select * from t2。

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 200" style="max-width:520px;width:100%;font-family:monospace">
  <rect width="520" height="200" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <!-- t1 Memory -->
  <text x="130" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">select * from t1</text>
  <rect x="30" y="38" width="200" height="26" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="80" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">id</text>
  <text x="180" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">c</text>
  <g font-size="11" fill="var(--d-text)">
    <text x="80" y="78" text-anchor="middle">1</text><text x="180" y="78" text-anchor="middle">1</text>
    <text x="80" y="93" text-anchor="middle">2</text><text x="180" y="93" text-anchor="middle">2</text>
    <text x="80" y="108" text-anchor="middle">...</text><text x="180" y="108" text-anchor="middle">...</text>
    <text x="80" y="123" text-anchor="middle">9</text><text x="180" y="123" text-anchor="middle">9</text>
    <rect x="30" y="128" width="200" height="18" rx="2" fill="var(--d-orange)" opacity="0.15"/>
    <text x="80" y="141" text-anchor="middle" font-weight="bold" fill="var(--d-orange)">0</text>
    <text x="180" y="141" text-anchor="middle" font-weight="bold" fill="var(--d-orange)">0</text>
  </g>
  <text x="130" y="165" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">0 在最后一行</text>
  <!-- t2 InnoDB -->
  <text x="390" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">select * from t2</text>
  <rect x="290" y="38" width="200" height="26" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="340" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">id</text>
  <text x="440" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">c</text>
  <g font-size="11" fill="var(--d-text)">
    <rect x="290" y="62" width="200" height="18" rx="2" fill="var(--d-green)" opacity="0.15"/>
    <text x="340" y="76" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text>
    <text x="440" y="76" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text>
    <text x="340" y="93" text-anchor="middle">1</text><text x="440" y="93" text-anchor="middle">1</text>
    <text x="340" y="108" text-anchor="middle">2</text><text x="440" y="108" text-anchor="middle">2</text>
    <text x="340" y="123" text-anchor="middle">...</text><text x="440" y="123" text-anchor="middle">...</text>
    <text x="340" y="141" text-anchor="middle">9</text><text x="440" y="141" text-anchor="middle">9</text>
  </g>
  <text x="390" y="165" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">0 在第一行</text>
  <text x="260" y="188" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 1  两个查询结果 — 0 的位置不同</text>
</svg>
</div>


可以看到，内存表t1的返回结果里面0在最后一行，而InnoDB表t2的返回结果里0在第一行。

出现这个区别的原因，要从这两个引擎的主键索引的组织方式说起。

表t2用的是InnoDB引擎，它的主键索引id的组织方式，你已经很熟悉了：InnoDB表的数据就放在主键索引树上，主键索引是B+树。所以表t2的数据组织方式如下图所示：

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 260" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="260" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">InnoDB — B+ 树主键索引（表 t2）</text>
  <!-- Root node -->
  <rect x="240" y="40" width="100" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="290" y="60" text-anchor="middle" font-size="12" fill="var(--d-blue)">5</text>
  <!-- Left child -->
  <rect x="100" y="100" width="160" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="180" y="120" text-anchor="middle" font-size="12" fill="var(--d-blue)">1 | 3</text>
  <!-- Right child -->
  <rect x="320" y="100" width="160" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="400" y="120" text-anchor="middle" font-size="12" fill="var(--d-blue)">5 | 7</text>
  <!-- Lines root to children -->
  <line x1="265" y1="70" x2="180" y2="100" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <line x1="315" y1="70" x2="400" y2="100" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <!-- Leaf nodes -->
  <g font-size="10" fill="var(--d-text)">
    <rect x="20" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="60" y="176" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text><text x="60" y="196" text-anchor="middle">(0,0)</text>
    <rect x="110" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="150" y="176" text-anchor="middle" font-weight="bold">1</text><text x="150" y="196" text-anchor="middle">(1,1)</text>
    <rect x="200" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="240" y="176" text-anchor="middle" font-weight="bold">2</text><text x="240" y="196" text-anchor="middle">(2,2)</text>
    <text x="290" y="186" text-anchor="middle" fill="var(--d-text-muted)">…</text>
    <rect x="310" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="350" y="176" text-anchor="middle" font-weight="bold">8</text><text x="350" y="196" text-anchor="middle">(8,8)</text>
    <rect x="400" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="440" y="176" text-anchor="middle" font-weight="bold">9</text><text x="440" y="196" text-anchor="middle">(9,9)</text>
  </g>
  <!-- Leaf links -->
  <line x1="100" y1="182" x2="110" y2="182" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="190" y1="182" x2="200" y2="182" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="390" y1="182" x2="400" y2="182" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,2"/>
  <!-- Lines to leaves -->
  <line x1="140" y1="130" x2="60" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="165" y1="130" x2="150" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="195" y1="130" x2="240" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="365" y1="130" x2="350" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="435" y1="130" x2="440" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="290" y="230" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">叶子节点按主键有序存储，数据就在主键索引上</text>
  <text x="290" y="250" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 2  InnoDB B+ 树数据组织</text>
</svg>
</div>


主键索引上的值是有序存储的。在执行select *的时候，就会按照叶子节点从左到右扫描，所以得到的结果里，0就出现在第一行。

与InnoDB引擎不同，Memory引擎的数据和索引是分开的。我们来看一下表t1中的数据内容。

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 280" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="280" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Memory — 数据数组 + Hash 索引（表 t1）</text>
  <!-- Data array -->
  <text x="60" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">数据数组</text>
  <g font-size="11">
    <rect x="20" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="45" y="80" text-anchor="middle" fill="var(--d-engine-text)">1,1</text>
    <rect x="75" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="100" y="80" text-anchor="middle" fill="var(--d-engine-text)">2,2</text>
    <rect x="130" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="155" y="80" text-anchor="middle" fill="var(--d-engine-text)">3,3</text>
    <rect x="185" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="210" y="80" text-anchor="middle" fill="var(--d-engine-text)">4,4</text>
    <rect x="240" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="265" y="80" text-anchor="middle" fill="var(--d-engine-text)">5,5</text>
    <rect x="295" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="320" y="80" text-anchor="middle" fill="var(--d-engine-text)">6,6</text>
    <rect x="350" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="375" y="80" text-anchor="middle" fill="var(--d-engine-text)">7,7</text>
    <rect x="405" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="430" y="80" text-anchor="middle" fill="var(--d-engine-text)">8,8</text>
    <rect x="460" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="485" y="80" text-anchor="middle" fill="var(--d-engine-text)">9,9</text>
    <rect x="515" y="64" width="50" height="24" rx="3" fill="var(--d-orange)" opacity="0.2" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="540" y="80" text-anchor="middle" fill="var(--d-orange)" font-weight="bold">0,0</text>
  </g>
  <g font-size="9" fill="var(--d-text-muted)">
    <text x="45" y="102" text-anchor="middle">pos0</text>
    <text x="100" y="102" text-anchor="middle">pos1</text>
    <text x="155" y="102" text-anchor="middle">pos2</text>
    <text x="540" y="102" text-anchor="middle">pos9</text>
  </g>
  <!-- Hash Index -->
  <text x="290" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">主键 Hash 索引</text>
  <g font-size="10">
    <rect x="60" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="105" y="156" text-anchor="middle" fill="var(--d-blue)">hash(1)→pos0</text>
    <rect x="160" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="205" y="156" text-anchor="middle" fill="var(--d-blue)">hash(3)→pos2</text>
    <rect x="260" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="305" y="156" text-anchor="middle" fill="var(--d-blue)">hash(5)→pos4</text>
    <rect x="360" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="405" y="156" text-anchor="middle" fill="var(--d-blue)">hash(0)→pos9</text>
  </g>
  <text x="290" y="185" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">… hash 桶无序 — key 不按大小排列 …</text>
  <!-- Arrows -->
  <line x1="105" y1="164" x2="45" y2="88" stroke="var(--d-blue-border)" stroke-width="1" marker-end="url(#ah3)"/>
  <line x1="205" y1="164" x2="155" y2="88" stroke="var(--d-blue-border)" stroke-width="1" marker-end="url(#ah3)"/>
  <line x1="305" y1="164" x2="265" y2="88" stroke="var(--d-blue-border)" stroke-width="1" marker-end="url(#ah3)"/>
  <line x1="405" y1="164" x2="540" y2="88" stroke="var(--d-orange)" stroke-width="1.2" marker-end="url(#ah3o)"/>
  <defs>
    <marker id="ah3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
    <marker id="ah3o" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-orange)" stroke-width="1"/></marker>
  </defs>
  <!-- Note -->
  <rect x="80" y="200" width="420" height="44" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
  <text x="290" y="218" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">数据按写入顺序存放 → select * 顺序扫描数组</text>
  <text x="290" y="234" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">id=0 最后写入 → 在数组末尾(pos9) → 结果集最后一行</text>
  <text x="290" y="268" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 3  Memory 引擎数据组织（hash 索引 + 数据数组）</text>
</svg>
</div>


可以看到，内存表的数据部分以数组的方式单独存放，而主键id索引里，存的是每个数据的位置。主键id是hash索引，可以看到索引上的key并不是有序的。

在内存表t1中，当我执行select *的时候，走的是全表扫描，也就是顺序扫描这个数组。因此，0就是最后一个被读到，并放入结果集的数据。

可见，InnoDB和Memory引擎的数据组织方式是不同的：

- InnoDB引擎把数据放在主键索引上，其他索引上保存的是主键id。这种方式，我们称之为**索引组织表** （Index Organizied Table）。
- 而Memory引擎采用的是把数据单独存放，索引上保存数据位置的数据组织形式，我们称之为**堆组织表** （Heap Organizied Table）。


从中我们可以看出，这两个引擎的一些典型不同：

  1. InnoDB表的数据总是有序存放的，而内存表的数据就是按照写入顺序存放的；

  2. 当数据文件有空洞的时候，InnoDB表在插入新数据的时候，为了保证数据有序性，只能在固定的位置写入新值，而内存表找到空位就可以插入新值；

  3. 数据位置发生变化的时候，InnoDB表只需要修改主键索引，而内存表需要修改所有索引；

  4. InnoDB表用主键索引查询时需要走一次索引查找，用普通索引查询的时候，需要走两次索引查找。而内存表没有这个区别，所有索引的“地位”都是相同的。

  5. InnoDB支持变长数据类型，不同记录的长度可能不同；内存表不支持Blob 和 Text字段，并且即使定义了varchar(N)，实际也当作char(N)，也就是固定长度字符串来存储，因此内存表的每行数据长度相同。


由于内存表的这些特性，每个数据行被删除以后，空出的这个位置都可以被接下来要插入的数据复用。比如，如果要在表t1中执行：

```sql
delete from t1 where id=5;
insert into t1 values(10,10);
select * from t1;
```


就会看到返回结果里，id=10这一行出现在id=4之后，也就是原来id=5这行数据的位置。

需要指出的是，表t1的这个主键索引是哈希索引，因此如果执行范围查询，比如

```sql
select * from t1 where id<5;
```


是用不上主键索引的，需要走全表扫描。你可以借此再回顾下[第4篇文章](<https://time.geekbang.org/column/article/69236>)的内容。那如果要让内存表支持范围扫描，应该怎么办呢 ？

## hash索引和B-Tree索引

实际上，内存表也是支B-Tree索引的。在id列上创建一个B-Tree索引，SQL语句可以这么写：

```sql
alter table t1 add index a_btree_index using btree (id);
```


这时，表t1的数据组织形式就变成了这样：

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 300" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="300" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Memory 引擎 — 增加 B-Tree 索引后</text>
  <!-- Data array at top -->
  <text x="290" y="46" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">数据数组（按写入顺序）</text>
  <g font-size="10">
    <rect x="30" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="52" y="69" text-anchor="middle" fill="var(--d-engine-text)">1,1</text>
    <rect x="78" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="100" y="69" text-anchor="middle" fill="var(--d-engine-text)">2,2</text>
    <rect x="126" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="148" y="69" text-anchor="middle" fill="var(--d-engine-text)">3,3</text>
    <rect x="174" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="196" y="69" text-anchor="middle" fill="var(--d-engine-text)">4,4</text>
    <text x="232" y="69" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">…</text>
    <rect x="248" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="270" y="69" text-anchor="middle" fill="var(--d-engine-text)">9,9</text>
    <rect x="296" y="54" width="44" height="22" rx="3" fill="var(--d-orange)" opacity="0.2" stroke="var(--d-orange)" stroke-width="1.2"/>
    <text x="318" y="69" text-anchor="middle" fill="var(--d-orange)" font-weight="bold">0,0</text>
  </g>
  <!-- Hash index (left) -->
  <text x="150" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">Hash 索引（主键 id）</text>
  <g font-size="9">
    <rect x="40" y="113" width="80" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="80" y="127" text-anchor="middle" fill="var(--d-blue)">hash(0)→pos9</text>
    <rect x="130" y="113" width="80" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="170" y="127" text-anchor="middle" fill="var(--d-blue)">hash(1)→pos0</text>
    <text x="230" y="127" text-anchor="middle" fill="var(--d-text-muted)">…</text>
  </g>
  <!-- B-Tree index (right) -->
  <text x="430" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">B-Tree 索引（id）</text>
  <!-- B-Tree root -->
  <rect x="395" y="115" width="70" height="24" rx="5" fill="var(--d-green)" opacity="0.18" stroke="var(--d-green)" stroke-width="1.2"/>
  <text x="430" y="131" text-anchor="middle" font-size="11" fill="var(--d-green)" font-weight="bold">5</text>
  <!-- B-Tree left -->
  <rect x="355" y="158" width="60" height="22" rx="4" fill="var(--d-green)" opacity="0.12" stroke="var(--d-green)" stroke-width="1"/>
  <text x="385" y="173" text-anchor="middle" font-size="10" fill="var(--d-text)">0 1 2 3 4</text>
  <!-- B-Tree right -->
  <rect x="435" y="158" width="60" height="22" rx="4" fill="var(--d-green)" opacity="0.12" stroke="var(--d-green)" stroke-width="1"/>
  <text x="465" y="173" text-anchor="middle" font-size="10" fill="var(--d-text)">5 6 7 8 9</text>
  <line x1="415" y1="139" x2="385" y2="158" stroke="var(--d-green)" stroke-width="1"/>
  <line x1="445" y1="139" x2="465" y2="158" stroke="var(--d-green)" stroke-width="1"/>
  <!-- Arrows from B-Tree leaves to data array -->
  <line x1="365" y1="180" x2="318" y2="76" stroke="var(--d-green)" stroke-width="0.8" stroke-dasharray="3,2"/>
  <line x1="375" y1="180" x2="52" y2="76" stroke="var(--d-green)" stroke-width="0.8" stroke-dasharray="3,2"/>
  <text x="290" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">B-Tree 叶子节点有序 → 范围查询走 B-Tree 索引</text>
  <text x="290" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">叶子存的仍然是数据在数组中的位置（pos）</text>
  <!-- Summary box -->
  <rect x="80" y="240" width="420" height="30" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="290" y="260" text-anchor="middle" font-size="11" fill="var(--d-deep-blue)">同一份数据可同时拥有 Hash 和 B-Tree 两种索引</text>
  <text x="290" y="290" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 4  Memory 引擎增加 B-Tree 索引后的数据组织</text>
</svg>
</div>


新增的这个B-Tree索引你看着就眼熟了，这跟InnoDB的b+树索引组织形式类似。

作为对比，你可以看一下这下面这两个语句的输出：

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 220" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="220" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">B-Tree 索引 vs Hash 索引查询对比</text>
  <!-- Left: B-Tree -->
  <rect x="20" y="36" width="260" height="140" rx="6" fill="var(--d-bg)" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="150" y="54" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">select * from t1 where id&lt;5</text>
  <text x="150" y="70" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优化器选择 B-Tree 索引</text>
  <rect x="40" y="78" width="220" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="100" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">id</text>
  <text x="200" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">c</text>
  <g font-size="10" fill="var(--d-text)">
    <text x="100" y="112" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text><text x="200" y="112" text-anchor="middle">0</text>
    <text x="100" y="127" text-anchor="middle">1</text><text x="200" y="127" text-anchor="middle">1</text>
    <text x="100" y="142" text-anchor="middle">2</text><text x="200" y="142" text-anchor="middle">2</text>
    <text x="100" y="157" text-anchor="middle">3</text><text x="200" y="157" text-anchor="middle">3</text>
    <text x="100" y="172" text-anchor="middle">4</text><text x="200" y="172" text-anchor="middle">4</text>
  </g>
  <!-- Right: Hash -->
  <rect x="300" y="36" width="260" height="140" rx="6" fill="var(--d-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="430" y="54" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">select * from t1 force index(PRIMARY)</text>
  <text x="430" y="70" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">强制使用 Hash 主键索引 → 全表扫描</text>
  <rect x="320" y="78" width="220" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="380" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">id</text>
  <text x="480" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">c</text>
  <g font-size="10" fill="var(--d-text)">
    <text x="380" y="112" text-anchor="middle">1</text><text x="480" y="112" text-anchor="middle">1</text>
    <text x="380" y="127" text-anchor="middle">2</text><text x="480" y="127" text-anchor="middle">2</text>
    <text x="380" y="142" text-anchor="middle">3</text><text x="480" y="142" text-anchor="middle">3</text>
    <text x="380" y="157" text-anchor="middle">4</text><text x="480" y="157" text-anchor="middle">4</text>
    <text x="380" y="172" text-anchor="middle" font-weight="bold" fill="var(--d-orange)">0</text><text x="480" y="172" text-anchor="middle">0</text>
  </g>
  <!-- Annotation -->
  <text x="150" y="196" text-anchor="middle" font-size="10" fill="var(--d-green)">有序返回 0-4</text>
  <text x="430" y="196" text-anchor="middle" font-size="10" fill="var(--d-orange)">0 在最后（写入顺序）</text>
  <text x="290" y="214" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 5  B-Tree 索引 vs Hash 索引查询结果对比</text>
</svg>
</div>


可以看到，执行select * from t1 where id<5的时候，优化器会选择B-Tree索引，所以返回结果是0到4。 使用force index强行使用主键id这个索引，id=0这一行就在结果集的最末尾了。

其实，一般在我们的印象中，内存表的优势是速度快，其中的一个原因就是Memory引擎支持hash索引。当然，更重要的原因是，内存表的所有数据都保存在内存，而内存的读写速度总是比磁盘快。

但是，接下来我要跟你说明，为什么我不建议你在生产环境上使用内存表。这里的原因主要包括两个方面：

  1. 锁粒度问题；

  2. 数据持久化问题。


## 内存表的锁

我们先来说说内存表的锁粒度问题。

内存表不支持行锁，只支持表锁。因此，一张表只要有更新，就会堵住其他所有在这个表上的读写操作。

需要注意的是，这里的表锁跟之前我们介绍过的MDL锁不同，但都是表级的锁。接下来，我通过下面这个场景，跟你模拟一下内存表的表级锁。

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 200" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="200" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">内存表的表锁 — 复现步骤</text>
  <!-- Header -->
  <rect x="20" y="34" width="80" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="60" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">时刻</text>
  <rect x="105" y="34" width="150" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="180" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">session A</text>
  <rect x="260" y="34" width="150" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="335" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">session B</text>
  <rect x="415" y="34" width="150" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
  <text x="490" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">session C</text>
  <!-- T1 -->
  <text x="60" y="80" text-anchor="middle" font-size="11" fill="var(--d-text)">T1</text>
  <rect x="105" y="65" width="150" height="24" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="180" y="81" text-anchor="middle" font-size="9" fill="var(--d-blue)">update t1 set id=</text>
  <text x="180" y="91" text-anchor="middle" font-size="9" fill="var(--d-blue)">sleep(50)...</text>
  <!-- T2 -->
  <text x="60" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">T2</text>
  <rect x="260" y="100" width="150" height="24" rx="3" fill="var(--d-orange)" opacity="0.18" stroke="var(--d-orange)" stroke-width="1.2"/>
  <text x="335" y="116" text-anchor="middle" font-size="9" fill="var(--d-orange)">select * from t1</text>
  <text x="335" y="134" text-anchor="middle" font-size="9" fill="var(--d-orange)">(Blocked - 锁等待)</text>
  <!-- T3 -->
  <text x="60" y="156" text-anchor="middle" font-size="11" fill="var(--d-text)">T3</text>
  <rect x="415" y="142" width="150" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
  <text x="490" y="158" text-anchor="middle" font-size="9" fill="var(--d-engine-text)">show processlist</text>
  <text x="290" y="190" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 6  内存表的表锁 — 复现步骤</text>
</svg>
</div>


在这个执行序列里，session A的update语句要执行50秒，在这个语句执行期间session B的查询会进入锁等待状态。session C的show processlist 结果输出如下：

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 130" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="130" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">show processlist 输出</text>
  <rect x="20" y="34" width="540" height="70" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <g font-size="10" fill="var(--d-text)" font-family="monospace">
    <text x="30" y="50">Id  Command  State              Info</text>
    <text x="30" y="66" fill="var(--d-blue)">1   Query    User sleep         update t1 set id=sleep(50)</text>
    <text x="30" y="82" fill="var(--d-orange)">2   Query    <tspan font-weight="bold">Waiting for table</tspan>  select * from t1</text>
    <text x="30" y="98" fill="var(--d-text-sub)">3   Query    init               show processlist</text>
  </g>
  <text x="290" y="122" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 7  session C 的 show processlist 结果</text>
</svg>
</div>


跟行锁比起来，表锁对并发访问的支持不够好。所以，内存表的锁粒度问题，决定了它在处理并发事务的时候，性能也不会太好。

## 数据持久性问题

接下来，我们再看看数据持久性的问题。

数据放在内存中，是内存表的优势，但也是一个劣势。因为，数据库重启的时候，所有的内存表都会被清空。

你可能会说，如果数据库异常重启，内存表被清空也就清空了，不会有什么问题啊。但是，在高可用架构下，内存表的这个特点简直可以当做bug来看待了。为什么这么说呢？

**我们先看看M-S架构下，使用内存表存在的问题。**

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" style="max-width:480px;width:100%;font-family:monospace">
  <rect width="480" height="160" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">M-S 基本架构</text>
  <!-- Client -->
  <rect x="20" y="55" width="80" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="60" y="79" text-anchor="middle" font-size="12" fill="var(--d-blue)">客户端</text>
  <!-- Proxy -->
  <rect x="140" y="55" width="80" height="40" rx="6" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.5"/>
  <text x="180" y="79" text-anchor="middle" font-size="12" fill="var(--d-engine-text)">Proxy</text>
  <!-- Master -->
  <rect x="270" y="35" width="90" height="36" rx="6" fill="var(--d-green)" opacity="0.18" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="315" y="57" text-anchor="middle" font-size="12" fill="var(--d-green)" font-weight="bold">主库 M</text>
  <!-- Slave -->
  <rect x="270" y="85" width="90" height="36" rx="6" fill="var(--d-orange)" opacity="0.18" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="315" y="107" text-anchor="middle" font-size="12" fill="var(--d-orange)" font-weight="bold">备库 S</text>
  <!-- Arrows -->
  <line x1="100" y1="75" x2="138" y2="75" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a8)"/>
  <line x1="220" y1="65" x2="268" y2="53" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a8)"/>
  <line x1="220" y1="85" x2="268" y2="97" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a8)"/>
  <line x1="360" y1="63" x2="395" y2="80" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a8b)"/>
  <line x1="395" y1="80" x2="360" y2="97" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a8b)"/>
  <text x="430" y="84" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">binlog</text>
  <defs>
    <marker id="a8" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-text-sub)" stroke-width="1"/></marker>
    <marker id="a8b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
  </defs>
  <text x="240" y="150" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 8  M-S 基本架构（含 Proxy）</text>
</svg>
</div>


我们来看一下下面这个时序：

  1. 业务正常访问主库；

  2. 备库硬件升级，备库重启，内存表t1内容被清空；

  3. 备库重启后，客户端发送一条update语句，修改表t1的数据行，这时备库应用线程就会报错“找不到要更新的行”。


这样就会导致主备同步停止。当然，如果这时候发生主备切换的话，客户端会看到，表t1的数据“丢失”了。

在图8中这种有proxy的架构里，大家默认主备切换的逻辑是由数据库系统自己维护的。这样对客户端来说，就是“网络断开，重连之后，发现内存表数据丢失了”。

你可能说这还好啊，毕竟主备发生切换，连接会断开，业务端能够感知到异常。

但是，接下来内存表的这个特性就会让使用现象显得更“诡异”了。由于MySQL知道重启之后，内存表的数据会丢失。所以，担心主库重启之后，出现主备不一致，MySQL在实现上做了这样一件事儿：在数据库重启之后，往binlog里面写入一行DELETE FROM t1。

**如果你使用是如图9所示的双M结构的话：**

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" style="max-width:480px;width:100%;font-family:monospace">
  <rect width="480" height="160" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">双 M 结构</text>
  <!-- Client -->
  <rect x="20" y="55" width="80" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="60" y="79" text-anchor="middle" font-size="12" fill="var(--d-blue)">客户端</text>
  <!-- Proxy -->
  <rect x="140" y="55" width="80" height="40" rx="6" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.5"/>
  <text x="180" y="79" text-anchor="middle" font-size="12" fill="var(--d-engine-text)">Proxy</text>
  <!-- M1 -->
  <rect x="270" y="35" width="90" height="36" rx="6" fill="var(--d-green)" opacity="0.18" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="315" y="57" text-anchor="middle" font-size="12" fill="var(--d-green)" font-weight="bold">M1</text>
  <!-- M2 -->
  <rect x="270" y="85" width="90" height="36" rx="6" fill="var(--d-orange)" opacity="0.18" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="315" y="107" text-anchor="middle" font-size="12" fill="var(--d-orange)" font-weight="bold">M2</text>
  <!-- Arrows -->
  <line x1="100" y1="75" x2="138" y2="75" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a9)"/>
  <line x1="220" y1="65" x2="268" y2="53" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a9)"/>
  <line x1="220" y1="85" x2="268" y2="97" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a9)"/>
  <!-- Dual binlog arrows -->
  <path d="M370,53 Q420,53 420,78 Q420,97 370,97" fill="none" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a9b)"/>
  <path d="M370,103 Q440,103 440,78 Q440,53 370,53" fill="none" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a9c)"/>
  <text x="455" y="64" text-anchor="start" font-size="9" fill="var(--d-text-muted)">binlog</text>
  <text x="455" y="100" text-anchor="start" font-size="9" fill="var(--d-text-muted)">binlog</text>
  <defs>
    <marker id="a9" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-text-sub)" stroke-width="1"/></marker>
    <marker id="a9b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
    <marker id="a9c" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
  </defs>
  <text x="240" y="150" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 9  双 M 结构 — 互为主备</text>
</svg>
</div>


在备库重启的时候，备库binlog里的delete语句就会传到主库，然后把主库内存表的内容删除。这样你在使用的时候就会发现，主库的内存表数据突然被清空了。

基于上面的分析，你可以看到，内存表并不适合在生产环境上作为普通数据表使用。

有同学会说，但是内存表执行速度快呀。这个问题，其实你可以这么分析：

  1. 如果你的表更新量大，那么并发度是一个很重要的参考指标，InnoDB支持行锁，并发度比内存表好；

  2. 能放到内存表的数据量都不大。如果你考虑的是读的性能，一个读QPS很高并且数据量不大的表，即使是使用InnoDB，数据也是都会缓存在InnoDB Buffer Pool里的。因此，使用InnoDB表的读性能也不会差。


所以，**我建议你把普通内存表都用InnoDB表来代替。** 但是，有一个场景却是例外的。

这个场景就是，我们在第35和36篇说到的用户临时表。在数据量可控，不会耗费过多内存的情况下，你可以考虑使用内存表。

内存临时表刚好可以无视内存表的两个不足，主要是下面的三个原因：

  1. 临时表不会被其他线程访问，没有并发性的问题；

  2. 临时表重启后也是需要删除的，清空数据这个问题不存在；

  3. 备库的临时表也不会影响主库的用户线程。


现在，我们回过头再看一下第35篇join语句优化的例子，当时我建议的是创建一个InnoDB临时表，使用的语句序列是：

```sql
create temporary table temp_t(id int primary key, a int, b int, index(b))engine=innodb;
insert into temp_t select * from t2 where b>=1 and b<=2000;
select * from t1 join temp_t on (t1.b=temp_t.b);
```


了解了内存表的特性，你就知道了， 其实这里使用内存临时表的效果更好，原因有三个：

  1. 相比于InnoDB表，使用内存表不需要写磁盘，往表temp_t的写数据的速度更快；

  2. 索引b使用hash索引，查找的速度比B-Tree索引快；

  3. 临时表数据只有2000行，占用的内存有限。


因此，你可以对[第35篇文章](<https://time.geekbang.org/column/article/80147>)的语句序列做一个改写，将临时表t1改成内存临时表，并且在字段b上创建一个hash索引。

```sql
create temporary table temp_t(id int primary key, a int, b int, index (b))engine=memory;
insert into temp_t select * from t2 where b>=1 and b<=2000;
select * from t1 join temp_t on (t1.b=temp_t.b);
```

<div style="text-align:center;margin:1.5em 0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 160" style="max-width:580px;width:100%;font-family:monospace">
  <rect width="580" height="160" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">使用内存临时表的执行效果</text>
  <rect x="30" y="36" width="520" height="90" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <g font-size="10" fill="var(--d-text)" font-family="monospace">
    <text x="40" y="54" fill="var(--d-text-muted)">mysql&gt;</text>
    <text x="95" y="54">create temporary table temp_t(...) engine=<tspan fill="var(--d-green)" font-weight="bold">memory</tspan>;</text>
    <text x="40" y="72" fill="var(--d-text-muted)">mysql&gt;</text>
    <text x="95" y="72">insert into temp_t select ... from t2 where b&gt;=1 and b&lt;=2000;</text>
    <text x="40" y="90" fill="var(--d-text-muted)">mysql&gt;</text>
    <text x="95" y="90">select * from t1 join temp_t on (t1.b=temp_t.b);</text>
    <text x="40" y="112" fill="var(--d-blue)">-- 导入速度更快（无需写磁盘）</text>
    <text x="40" y="124" fill="var(--d-blue)">-- hash 索引查找更快，join 性能更优</text>
  </g>
  <text x="290" y="152" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 10  使用内存临时表优化 join 查询</text>
</svg>
</div>


可以看到，不论是导入数据的时间，还是执行join的时间，使用内存临时表的速度都比使用InnoDB临时表要更快一些。

## 小结

今天这篇文章，我从“要不要使用内存表”这个问题展开，和你介绍了Memory引擎的几个特性。

可以看到，由于重启会丢数据，如果一个备库重启，会导致主备同步线程停止；如果主库跟这个备库是双M架构，还可能导致主库的内存表数据被删掉。

因此，在生产上，我不建议你使用普通内存表。

如果你是DBA，可以在建表的审核系统中增加这类规则，要求业务改用InnoDB表。我们在文中也分析了，其实InnoDB表性能还不错，而且数据安全也有保障。而内存表由于不支持行锁，更新语句会阻塞查询，性能也未必就如想象中那么好。

基于内存表的特性，我们还分析了它的一个适用场景，就是内存临时表。内存表支持hash索引，这个特性利用起来，对复杂查询的加速效果还是很不错的。

最后，我给你留一个问题吧。

假设你刚刚接手的一个数据库上，真的发现了一个内存表。备库重启之后肯定是会导致备库的内存表数据被清空，进而导致主备同步停止。这时，最好的做法是将它修改成InnoDB引擎表。

假设当时的业务场景暂时不允许你修改引擎，你可以加上什么自动化逻辑，来避免主备同步停止呢？

你可以把你的思考和分析写在评论区，我会在下一篇文章的末尾跟你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

## 上期问题时间

今天文章的正文内容，已经回答了我们上期的问题，这里就不再赘述了。

评论区留言点赞板：

> @老杨同志、@poppy、@长杰 这三位同学给出了正确答案，春节期间还持续保持跟进学习，给你们点赞。

##  精选留言


[__ 2](<javascript:;>)

老师新年好 :-)  
刚好遇到一个问题。   
  
本来准备更新到，一个查询是怎么运行的里面的，看到这篇更新文章，就写在这吧，希望老师帮忙解答。  
  
关于这个系统memory引擎表：information_schema.tables  
相关信息如下  
（1）Verison: MySQL 5.6.26  
（2）数据量table_schema = abc的有接近4W的表，整个实例有接近10W的表。（默认innodb引擎）  
（3）mysql.user和mysql.db的数据量都是100-200的行数，MyISAM引擎。  
（4）默认事务隔离级别RC  
  
  
在运行查询语句1的时候：select * from information_schema.tables where table_schema = 'abc';  
状态一直是check permission，opening tables，其他线程需要打开的表在opend tables里面被刷掉的，会显示在opening tables，可能需要小几秒后基本恢复正常。  
  
但是如果在运行查询语句2：select count(1) from information_schema.tables where table_schema = 'abc'; 这个时候语句2本身在profiling看长期处于check permission状态，其他线程就会出现阻塞现象，大部分卡在了opening tables，小部分closing tables。我测试下了，当个表查询的时候check permission大概也就是0.0005s左右的时间，4W个表理论良好状态应该是几十秒的事情。  
但是语句1可能需要5-10分钟，语句2需要5分钟。  
  
3个问题，请老师抽空看下：  
（1）information_schema.tables的组成方式，是我每次查询的时候从数据字典以及data目录下的文件中实时去读的吗？  
（2）语句1和语句2在运行的时候的过程分别是怎样的，特别是语句2。  
（3）语句2为什么会出现大量阻塞其他事务，其他事务都卡在opening tables的状态。  
  
  
PS: 最后根据audit log分析来看，语句实际上是MySQL的一个客户端Toad发起的，当使用Toad的object explorer的界面来查询表，或者设置connection的时候指定的的default schema是大域的时候就会run这个语句：（table_schema改成了abc，其他都是原样）  
SELECT COUNT(1) FROM information_schema.tables WHERE table_schema = 'abc' AND table_type != 'VIEW';  
  
  
再次感谢！ 

2019-02-08



[__ 1](<javascript:;>)

老师新年快乐！过年都不忘给我们传授知识！ 

2019-02-08

__ 作者回复

新年快乐🤝

2019-02-08



[__ 1](<javascript:;>)

新年好！  
课后作业：在备库配置跳过该内存表的主从同步。  
  
有一个问题一直困扰着我：SSD以及云主机的广泛运用，像Innodb这种使用WAL技术似乎并不能发挥最大性能（我的理解：基于SSD的WAL更多的只是起到队列一样削峰填谷的作用）。对于一些数据量不是特别大，但读写频繁的应用（比如点赞、积分），有没有更好的引擎推荐。 

2019-02-08

__ 作者回复

即使是SSD，顺序写也比随机写快些的。 不过确实没有机械盘那么明显。  


2019-02-08



[__ 0](<javascript:;>)

内存表一般数据量不大，并且更新不频繁，可以写一个定时任务，定期检测内存表的数据，如果数据不空，就将它持久化到一个innodb同结构的表中，如果为空，就反向将数据写到内存表中，这些操作可设置为不写入binlog。 

2019-02-09



[__ 0](<javascript:;>)

为什么memory 引擎中数据按照数组单独存储，0索引对应的数据怎么放到数组的最后 

2019-02-09

__ 作者回复

这就是堆组织表的数据存放方式

2019-02-09



[__ 0](<javascript:;>)

课后题。是不是可以加上创建表的操作，并且是innodb 类型的？ 

2019-02-09



[__ 0](<javascript:;>)

安装之前学的知识，把主库delete语句的gtid，设置到从库中，就可以跳过这条语句了吧。  
但是主备不一致是不是要也处理一下，将主库的内存表数据备份一下。然后delete数据，重新插入。  
等备件执行者两个语句后，主备应该都有数据了 

2019-02-08

__ 作者回复

题目里说的是 “备库重启”哈

2019-02-09