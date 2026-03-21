---
title: "MySQL 实战 45 讲：05. 深入浅出索引（下）"
description: "极客时间《MySQL 实战 45 讲》第 05 讲笔记整理"
---

# 05. 深入浅出索引（下）

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

在开始这篇文章之前，我们先来看一下这个问题：

在下面这个表T中，如果我执行 select * from T where k between 3 and 5，需要执行几次树的搜索操作，会扫描多少行？

下面是这个表的初始化语句。

```sql
mysql> create table T (
ID int primary key,
k int NOT NULL DEFAULT 0, 
s varchar(16) NOT NULL DEFAULT '',
index k(k))
engine=InnoDB;

insert into T values(100,1, 'aa'),(200,2,'bb'),(300,3,'cc'),(500,5,'ee'),(600,6,'ff'),(700,7,'gg');
```

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg viewBox="0 0 560 340" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;" xmlns="http://www.w3.org/2000/svg">
  <!-- Title -->
  <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">图1 InnoDB的索引组织结构</text>

  <!-- ===== Left: Primary Key Index ===== -->
  <text x="130" y="42" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue)">主键索引（Primary Key）</text>

  <!-- Root node -->
  <rect x="95" y="50" width="70" height="26" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="130" y="67" text-anchor="middle" font-size="10" fill="var(--d-text)">300</text>

  <!-- Level 2 nodes -->
  <rect x="40" y="100" width="70" height="26" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="75" y="117" text-anchor="middle" font-size="10" fill="var(--d-text)">100 200</text>
  <rect x="150" y="100" width="70" height="26" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="185" y="117" text-anchor="middle" font-size="10" fill="var(--d-text)">500 600</text>

  <!-- Lines root -> L2 -->
  <line x1="115" y1="76" x2="75" y2="100" stroke="var(--d-border)" stroke-width="1"/>
  <line x1="145" y1="76" x2="185" y2="100" stroke="var(--d-border)" stroke-width="1"/>

  <!-- Leaf nodes (primary key) -->
  <rect x="2" y="155" width="42" height="44" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="23" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">ID=100</text>
  <text x="23" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">R1,k=1</text>
  <text x="23" y="193" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">aa</text>

  <rect x="48" y="155" width="42" height="44" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="69" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">ID=200</text>
  <text x="69" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">R2,k=2</text>
  <text x="69" y="193" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">bb</text>

  <rect x="94" y="155" width="42" height="44" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="115" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">ID=300</text>
  <text x="115" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">R3,k=3</text>
  <text x="115" y="193" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">cc</text>

  <rect x="140" y="155" width="42" height="44" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="161" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">ID=500</text>
  <text x="161" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">R4,k=5</text>
  <text x="161" y="193" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">ee</text>

  <rect x="186" y="155" width="42" height="44" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="207" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">ID=600</text>
  <text x="207" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">R5,k=6</text>
  <text x="207" y="193" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">ff</text>

  <rect x="232" y="155" width="42" height="44" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="253" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">ID=700</text>
  <text x="253" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">R6,k=7</text>
  <text x="253" y="193" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">gg</text>

  <!-- Lines L2 -> leaves -->
  <line x1="58" y1="126" x2="23" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="75" y1="126" x2="69" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="92" y1="126" x2="115" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="168" y1="126" x2="161" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="185" y1="126" x2="207" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="202" y1="126" x2="253" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>

  <!-- Leaf arrows (linked list) -->
  <line x1="44" y1="177" x2="48" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7" marker-end="url(#arrowSmall)"/>
  <line x1="90" y1="177" x2="94" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7"/>
  <line x1="136" y1="177" x2="140" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7"/>
  <line x1="182" y1="177" x2="186" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7"/>
  <line x1="228" y1="177" x2="232" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7"/>

  <!-- ===== Right: Secondary Index k ===== -->
  <text x="420" y="42" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-indigo)">非主键索引（索引 k）</text>

  <!-- Root -->
  <rect x="385" y="50" width="70" height="26" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-indigo)" stroke-width="1.2"/>
  <text x="420" y="67" text-anchor="middle" font-size="10" fill="var(--d-text)">3</text>

  <!-- Level 2 -->
  <rect x="330" y="100" width="70" height="26" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-indigo)" stroke-width="1.2"/>
  <text x="365" y="117" text-anchor="middle" font-size="10" fill="var(--d-text)">1  2</text>
  <rect x="440" y="100" width="70" height="26" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-indigo)" stroke-width="1.2"/>
  <text x="475" y="117" text-anchor="middle" font-size="10" fill="var(--d-text)">5  6</text>

  <line x1="405" y1="76" x2="365" y2="100" stroke="var(--d-border)" stroke-width="1"/>
  <line x1="435" y1="76" x2="475" y2="100" stroke="var(--d-border)" stroke-width="1"/>

  <!-- Leaf nodes (secondary index) -->
  <rect x="298" y="155" width="38" height="38" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="317" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-indigo)">k=1</text>
  <text x="317" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">ID=100</text>

  <rect x="340" y="155" width="38" height="38" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="359" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-indigo)">k=2</text>
  <text x="359" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">ID=200</text>

  <rect x="382" y="155" width="38" height="38" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="401" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-indigo)">k=3</text>
  <text x="401" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">ID=300</text>

  <rect x="424" y="155" width="38" height="38" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="443" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-indigo)">k=5</text>
  <text x="443" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">ID=500</text>

  <rect x="466" y="155" width="38" height="38" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="485" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-indigo)">k=6</text>
  <text x="485" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">ID=600</text>

  <rect x="508" y="155" width="38" height="38" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="527" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-indigo)">k=7</text>
  <text x="527" y="182" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">ID=700</text>

  <!-- Lines L2 -> leaves -->
  <line x1="348" y1="126" x2="317" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="365" y1="126" x2="359" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="382" y1="126" x2="401" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="458" y1="126" x2="443" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="475" y1="126" x2="485" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="492" y1="126" x2="527" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>

  <!-- 回表 arrow -->
  <defs>
    <marker id="arrowOrange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/>
    </marker>
    <marker id="arrowSmall" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)"/>
    </marker>
  </defs>

  <!-- 回表 curved arrow from secondary index to primary index -->
  <path d="M 401 199 C 401 260, 280 280, 130 260 C 100 255, 115 210, 115 199" stroke="var(--d-orange)" stroke-width="1.5" fill="none" stroke-dasharray="5,3" marker-end="url(#arrowOrange)"/>
  <text x="280" y="285" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-orange)">回表查询</text>

  <!-- Labels at bottom -->
  <text x="130" y="220" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">叶子节点存储整行数据</text>
  <text x="420" y="220" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">叶子节点存储主键值</text>

  <!-- Separator line -->
  <line x1="280" y1="38" x2="280" y2="230" stroke="var(--d-border-dash)" stroke-width="0.8" stroke-dasharray="4,3"/>
</svg>
</div>


现在，我们一起来看看这条SQL查询语句的执行流程：

  1. 在k索引树上找到k=3的记录，取得 ID = 300；

  2. 再到ID索引树查到ID=300对应的R3；

  3. 在k索引树取下一个值k=5，取得ID=500；

  4. 再回到ID索引树查到ID=500对应的R4；

  5. 在k索引树取下一个值k=6，不满足条件，循环结束。


在这个过程中，**回到主键索引树搜索的过程，我们称为回表** 。可以看到，这个查询过程读了k索引树的3条记录（步骤1、3和5），回表了两次（步骤2和4）。

在这个例子中，由于查询结果所需要的数据只在主键索引上有，所以不得不回表。那么，有没有可能经过索引优化，避免回表过程呢？

## 覆盖索引

如果执行的语句是select ID from T where k between 3 and 5，这时只需要查ID的值，而ID的值已经在k索引树上了，因此可以直接提供查询结果，不需要回表。也就是说，在这个查询里面，索引k已经“覆盖了”我们的查询需求，我们称为覆盖索引。

**由于覆盖索引可以减少树的搜索次数，显著提升查询性能，所以使用覆盖索引是一个常用的性能优化手段。**

需要注意的是，在引擎内部使用覆盖索引在索引k上其实读了三个记录，R3~R5（对应的索引k上的记录项），但是对于MySQL的Server层来说，它就是找引擎拿到了两条记录，因此MySQL认为扫描行数是2。

> 备注：关于如何查看扫描行数的问题，我将会在第16文章《如何正确地显示随机消息？》中，和你详细讨论。

基于上面覆盖索引的说明，我们来讨论一个问题：**在一个市民信息表上，是否有必要将身份证号和名字建立联合索引？**

假设这个市民表的定义是这样的：

```sql
CREATE TABLE `tuser` (
  `id` int(11) NOT NULL,
  `id_card` varchar(32) DEFAULT NULL,
  `name` varchar(32) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `ismale` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_card` (`id_card`),
  KEY `name_age` (`name`,`age`)
) ENGINE=InnoDB
```


我们知道，身份证号是市民的唯一标识。也就是说，如果有根据身份证号查询市民信息的需求，我们只要在身份证号字段上建立索引就够了。而再建立一个（身份证号、姓名）的联合索引，是不是浪费空间？

如果现在有一个高频请求，要根据市民的身份证号查询他的姓名，这个联合索引就有意义了。它可以在这个高频请求上用到覆盖索引，不再需要回表查整行记录，减少语句的执行时间。

当然，索引字段的维护总是有代价的。因此，在建立冗余索引来支持覆盖索引时就需要权衡考虑了。这正是业务DBA，或者称为业务数据架构师的工作。

## 最左前缀原则

看到这里你一定有一个疑问，如果为每一种查询都设计一个索引，索引是不是太多了。如果我现在要按照市民的身份证号去查他的家庭地址呢？虽然这个查询需求在业务中出现的概率不高，但总不能让它走全表扫描吧？反过来说，单独为一个不频繁的请求创建一个（身份证号，地址）的索引又感觉有点浪费。应该怎么做呢？

这里，我先和你说结论吧。**B+树这种索引结构，可以利用索引的“最左前缀”，来定位记录。**

为了直观地说明这个概念，我们用（name，age）这个联合索引来分析。

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg viewBox="0 0 560 300" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-border)"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">图2 （name，age）联合索引示意图</text>

  <!-- Root node -->
  <rect x="230" y="36" width="100" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="280" y="54" text-anchor="middle" font-size="10" fill="var(--d-text)">（张三, 10）</text>

  <!-- Level 2 -->
  <rect x="100" y="90" width="100" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="150" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">（张六, 30）</text>
  <rect x="360" y="90" width="100" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="410" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">（李四, 20）</text>

  <!-- Lines root -> L2 -->
  <line x1="255" y1="64" x2="170" y2="90" stroke="var(--d-border)" stroke-width="1"/>
  <line x1="305" y1="64" x2="390" y2="90" stroke="var(--d-border)" stroke-width="1"/>

  <!-- Leaf nodes -->
  <rect x="18" y="155" width="92" height="52" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="64" y="172" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">张六, 30</text>
  <text x="64" y="186" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">ID1</text>
  <line x1="18" y1="195" x2="110" y2="195" stroke="var(--d-border)" stroke-width="0.5" stroke-dasharray="2,2"/>
  <text x="64" y="204" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">sorted: 张&lt;张三</text>

  <rect x="120" y="155" width="92" height="52" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="166" y="172" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-cur-text)">张三, 10</text>
  <text x="166" y="186" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">ID3</text>
  <line x1="120" y1="195" x2="212" y2="195" stroke="var(--d-border)" stroke-width="0.5" stroke-dasharray="2,2"/>
  <text x="166" y="204" text-anchor="middle" font-size="7" fill="var(--d-green)">name同→按age排</text>

  <rect x="222" y="155" width="92" height="52" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="268" y="172" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-cur-text)">张三, 20</text>
  <text x="268" y="186" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">ID4</text>
  <line x1="222" y1="195" x2="314" y2="195" stroke="var(--d-border)" stroke-width="0.5" stroke-dasharray="2,2"/>
  <text x="268" y="204" text-anchor="middle" font-size="7" fill="var(--d-green)">name同→按age排</text>

  <rect x="324" y="155" width="92" height="52" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="370" y="172" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">李四, 20</text>
  <text x="370" y="186" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">ID2</text>
  <line x1="324" y1="195" x2="416" y2="195" stroke="var(--d-border)" stroke-width="0.5" stroke-dasharray="2,2"/>
  <text x="370" y="204" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">李 &gt; 张</text>

  <rect x="426" y="155" width="92" height="52" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="472" y="172" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">王五, 25</text>
  <text x="472" y="186" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">ID5</text>
  <line x1="426" y1="195" x2="518" y2="195" stroke="var(--d-border)" stroke-width="0.5" stroke-dasharray="2,2"/>
  <text x="472" y="204" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">王 &gt; 李</text>

  <!-- Lines L2 -> leaves -->
  <line x1="125" y1="118" x2="64" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="150" y1="118" x2="166" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="175" y1="118" x2="268" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="385" y1="118" x2="370" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>
  <line x1="435" y1="118" x2="472" y2="155" stroke="var(--d-border)" stroke-width="0.8"/>

  <!-- Linked list arrows -->
  <line x1="110" y1="177" x2="120" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7" marker-end="url(#arrow2)"/>
  <line x1="212" y1="177" x2="222" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7" marker-end="url(#arrow2)"/>
  <line x1="314" y1="177" x2="324" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7" marker-end="url(#arrow2)"/>
  <line x1="416" y1="177" x2="426" y2="177" stroke="var(--d-text-muted)" stroke-width="0.7" marker-end="url(#arrow2)"/>

  <!-- Highlight bracket for "张%" prefix -->
  <path d="M 22 215 L 22 222 L 310 222 L 310 215" stroke="var(--d-orange)" stroke-width="1.5" fill="none"/>
  <text x="166" y="238" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-orange)">WHERE name LIKE '张%' 可利用索引定位</text>

  <!-- Sort explanation -->
  <text x="280" y="260" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">排序规则：先按 name 排序，name 相同时按 age 排序</text>
  <text x="280" y="276" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">叶子节点间通过链表顺序连接</text>
</svg>
</div>


可以看到，索引项是按照索引定义里面出现的字段顺序排序的。

当你的逻辑需求是查到所有名字是“张三”的人时，可以快速定位到ID4，然后向后遍历得到所有需要的结果。

如果你要查的是所有名字第一个字是“张”的人，你的SQL语句的条件是"where name like ‘张%’"。这时，你也能够用上这个索引，查找到第一个符合条件的记录是ID3，然后向后遍历，直到不满足条件为止。

可以看到，不只是索引的全部定义，只要满足最左前缀，就可以利用索引来加速检索。这个最左前缀可以是联合索引的最左N个字段，也可以是字符串索引的最左M个字符。

基于上面对最左前缀索引的说明，我们来讨论一个问题：**在建立联合索引的时候，如何安排索引内的字段顺序。**

这里我们的评估标准是，索引的复用能力。因为可以支持最左前缀，所以当已经有了(a,b)这个联合索引后，一般就不需要单独在a上建立索引了。因此，**第一原则是，如果通过调整顺序，可以少维护一个索引，那么这个顺序往往就是需要优先考虑采用的。**

所以现在你知道了，这段开头的问题里，我们要为高频请求创建(身份证号，姓名）这个联合索引，并用这个索引支持“根据身份证号查询地址”的需求。

那么，如果既有联合查询，又有基于a、b各自的查询呢？查询条件里面只有b的语句，是无法使用(a,b)这个联合索引的，这时候你不得不维护另外一个索引，也就是说你需要同时维护(a,b)、(b) 这两个索引。

这时候，我们要**考虑的原则就是空间** 了。比如上面这个市民表的情况，name字段是比age字段大的 ，那我就建议你创建一个（name,age)的联合索引和一个(age)的单字段索引。

## 索引下推

上一段我们说到满足最左前缀原则的时候，最左前缀可以用于在索引中定位记录。这时，你可能要问，那些不符合最左前缀的部分，会怎么样呢？

我们还是以市民表的联合索引（name, age）为例。如果现在有一个需求：检索出表中“名字第一个字是张，而且年龄是10岁的所有男孩”。那么，SQL语句是这么写的：

```sql
mysql> select * from tuser where name like '张%' and age=10 and ismale=1;
```


你已经知道了前缀索引规则，所以这个语句在搜索索引树的时候，只能用 “张”，找到第一个满足条件的记录ID3。当然，这还不错，总比全表扫描要好。

然后呢？

当然是判断其他条件是否满足。

在MySQL 5.6之前，只能从ID3开始一个个回表。到主键索引上找出数据行，再对比字段值。

而MySQL 5.6 引入的索引下推优化（index condition pushdown)， 可以在索引遍历过程中，对索引中包含的字段先做判断，直接过滤掉不满足条件的记录，减少回表次数。

图3和图4，是这两个过程的执行流程图。

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg viewBox="0 0 560 340" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">图3 无索引下推执行流程</text>
  <text x="280" y="34" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">MySQL 5.6 之前：不检查 age，全部回表</text>

  <!-- Left: (name,age) index -->
  <rect x="20" y="50" width="200" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="120" y="66" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">(name, age) 索引</text>

  <!-- Index entries - show name only, age is ignored -->
  <rect x="30" y="86" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="40" y="100" font-size="9" fill="var(--d-text)">张三, <tspan fill="var(--d-text-dim)" text-decoration="line-through">10</tspan></text>
  <text x="155" y="100" font-size="8" fill="var(--d-text-sub)">→ ID3</text>
  <text x="40" y="114" font-size="7" fill="var(--d-text-muted)">age 未检查</text>

  <rect x="30" y="126" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="40" y="140" font-size="9" fill="var(--d-text)">张三, <tspan fill="var(--d-text-dim)" text-decoration="line-through">20</tspan></text>
  <text x="155" y="140" font-size="8" fill="var(--d-text-sub)">→ ID4</text>
  <text x="40" y="154" font-size="7" fill="var(--d-text-muted)">age 未检查</text>

  <rect x="30" y="166" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="40" y="180" font-size="9" fill="var(--d-text)">张六, <tspan fill="var(--d-text-dim)" text-decoration="line-through">30</tspan></text>
  <text x="155" y="180" font-size="8" fill="var(--d-text-sub)">→ ID8</text>
  <text x="40" y="194" font-size="7" fill="var(--d-text-muted)">age 未检查</text>

  <rect x="30" y="206" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1"/>
  <text x="40" y="220" font-size="9" fill="var(--d-text)">张七, <tspan fill="var(--d-text-dim)" text-decoration="line-through">18</tspan></text>
  <text x="155" y="220" font-size="8" fill="var(--d-text-sub)">→ ID9</text>
  <text x="40" y="234" font-size="7" fill="var(--d-text-muted)">age 未检查</text>

  <!-- Right: Primary key index -->
  <rect x="340" y="50" width="200" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-indigo)" stroke-width="1.2"/>
  <text x="440" y="66" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-indigo)">主键索引（回表）</text>

  <!-- Primary key results -->
  <rect x="350" y="86" width="180" height="30" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="360" y="105" font-size="9" fill="var(--d-text)">ID3: 张三, 10, male → 匹配 ✓</text>

  <rect x="350" y="126" width="180" height="30" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="360" y="145" font-size="9" fill="var(--d-text)">ID4: 张三, 20, male → 不匹配</text>

  <rect x="350" y="166" width="180" height="30" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="360" y="185" font-size="9" fill="var(--d-text)">ID8: 张六, 30, female → 不匹配</text>

  <rect x="350" y="206" width="180" height="30" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="360" y="225" font-size="9" fill="var(--d-text)">ID9: 张七, 18, male → 不匹配</text>

  <!-- 4 dashed arrows: all go to 回表 -->
  <line x1="210" y1="100" x2="348" y2="100" stroke="var(--d-orange)" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#arrow3)"/>
  <line x1="210" y1="140" x2="348" y2="140" stroke="var(--d-orange)" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#arrow3)"/>
  <line x1="210" y1="180" x2="348" y2="180" stroke="var(--d-orange)" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#arrow3)"/>
  <line x1="210" y1="220" x2="348" y2="220" stroke="var(--d-orange)" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#arrow3)"/>

  <!-- Summary -->
  <rect x="120" y="265" width="320" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.2"/>
  <text x="280" y="284" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-orange)">回表 4 次</text>
  <text x="280" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">所有 name LIKE '张%' 的记录都需要回表后再判断 age</text>
</svg>
</div>

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg viewBox="0 0 560 340" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">图4 索引下推执行流程</text>
  <text x="280" y="34" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">MySQL 5.6+：在索引中先检查 age=10，过滤后再回表</text>

  <!-- Left: (name,age) index -->
  <rect x="20" y="50" width="200" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="120" y="66" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">(name, age) 索引</text>

  <!-- Index entry 1: age=10, PASS -->
  <rect x="30" y="86" width="180" height="34" rx="3" fill="var(--d-cur-bg)" stroke="var(--d-green)" stroke-width="1.2"/>
  <text x="40" y="100" font-size="9" fill="var(--d-text)">张三, <tspan font-weight="bold" fill="var(--d-green)">10</tspan></text>
  <text x="155" y="100" font-size="8" fill="var(--d-text-sub)">→ ID3</text>
  <text x="40" y="114" font-size="7" font-weight="600" fill="var(--d-green)">age=10 ✓ 需要回表</text>

  <!-- Index entry 2: age=20, FILTERED OUT -->
  <rect x="30" y="126" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" opacity="0.6"/>
  <text x="40" y="140" font-size="9" fill="var(--d-text-dim)">张三, <tspan font-weight="bold">20</tspan></text>
  <text x="155" y="140" font-size="8" fill="var(--d-text-dim)">→ ID4</text>
  <text x="40" y="154" font-size="7" font-weight="600" fill="var(--d-orange)">age≠10 ✗ 跳过</text>

  <!-- Index entry 3: age=30, FILTERED OUT -->
  <rect x="30" y="166" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" opacity="0.6"/>
  <text x="40" y="180" font-size="9" fill="var(--d-text-dim)">张六, <tspan font-weight="bold">30</tspan></text>
  <text x="155" y="180" font-size="8" fill="var(--d-text-dim)">→ ID8</text>
  <text x="40" y="194" font-size="7" font-weight="600" fill="var(--d-orange)">age≠10 ✗ 跳过</text>

  <!-- Index entry 4: age=18, FILTERED OUT -->
  <rect x="30" y="206" width="180" height="34" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" opacity="0.6"/>
  <text x="40" y="220" font-size="9" fill="var(--d-text-dim)">张七, <tspan font-weight="bold">18</tspan></text>
  <text x="155" y="220" font-size="8" fill="var(--d-text-dim)">→ ID9</text>
  <text x="40" y="234" font-size="7" font-weight="600" fill="var(--d-orange)">age≠10 ✗ 跳过</text>

  <!-- Right: Primary key index -->
  <rect x="340" y="50" width="200" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-indigo)" stroke-width="1.2"/>
  <text x="440" y="66" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-indigo)">主键索引（回表）</text>

  <!-- Only 1 primary key result -->
  <rect x="350" y="86" width="180" height="30" rx="3" fill="var(--d-cur-bg)" stroke="var(--d-green)" stroke-width="1.2"/>
  <text x="360" y="105" font-size="9" fill="var(--d-text)">ID3: 张三, 10, male → 匹配 ✓</text>

  <!-- X marks on filtered rows (no arrow) -->
  <text x="278" y="144" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--d-orange)">✗</text>
  <text x="278" y="184" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--d-orange)">✗</text>
  <text x="278" y="224" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--d-orange)">✗</text>

  <!-- Only 1 dashed arrow for 回表 -->
  <line x1="210" y1="100" x2="348" y2="100" stroke="var(--d-green)" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#arrow4)"/>

  <!-- Summary -->
  <rect x="120" y="265" width="320" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.2"/>
  <text x="280" y="284" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-green)">回表仅 1 次（减少 75%）</text>
  <text x="280" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">索引下推：在索引内部先判断 age=10，不满足直接跳过</text>
</svg>
</div>


在图3和4这两个图里面，每一个虚线箭头表示回表一次。

图3中，在(name,age)索引里面我特意去掉了age的值，这个过程InnoDB并不会去看age的值，只是按顺序把“name第一个字是’张’”的记录一条条取出来回表。因此，需要回表4次。

图4跟图3的区别是，InnoDB在(name,age)索引内部就判断了age是否等于10，对于不等于10的记录，直接判断并跳过。在我们的这个例子中，只需要对ID4、ID5这两条记录回表取数据判断，就只需要回表2次。

## 小结

今天这篇文章，我和你继续讨论了数据库索引的概念，包括了覆盖索引、前缀索引、索引下推。你可以看到，在满足语句需求的情况下， 尽量少地访问资源是数据库设计的重要原则之一。我们在使用数据库的时候，尤其是在设计表结构时，也要以减少资源消耗作为目标。

接下来我给你留下一个问题吧。

实际上主键索引也是可以使用多个字段的。DBA小吕在入职新公司的时候，就发现自己接手维护的库里面，有这么一个表，表结构定义类似这样的：

```sql
CREATE TABLE `geek` (
  `a` int(11) NOT NULL,
  `b` int(11) NOT NULL,
  `c` int(11) NOT NULL,
  `d` int(11) NOT NULL,
  PRIMARY KEY (`a`,`b`),
  KEY `c` (`c`),
  KEY `ca` (`c`,`a`),
  KEY `cb` (`c`,`b`)
) ENGINE=InnoDB;
```


公司的同事告诉他说，由于历史原因，这个表需要a、b做联合主键，这个小吕理解了。

但是，学过本章内容的小吕又纳闷了，既然主键包含了a、b这两个字段，那意味着单独在字段c上创建一个索引，就已经包含了三个字段了呀，为什么要创建“ca”“cb”这两个索引？

同事告诉他，是因为他们的业务里面有这样的两种语句：

```sql
select * from geek where c=N order by a limit 1;
select * from geek where c=N order by b limit 1;
```


我给你的问题是，这位同事的解释对吗，为了这两个查询模式，这两个索引是否都是必须的？为什么呢？

你可以把你的思考和观点写在留言区里，我会在下一篇文章的末尾和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

### 联合主键下的索引冗余

这个表结构定义在语法上没有问题，但从 InnoDB 的索引组织方式看，确实存在比较典型的索引冗余问题。

InnoDB 的二级索引叶子节点会自动带上主键值。这里主键是 `(a, b)`，所以这几个索引在物理组织上可以近似理解为：

| 索引名称 | 你定义的列 | InnoDB 实际组织顺序 | 结论 |
| --- | --- | --- | --- |
| PRIMARY | `(a, b)` | `(a, b)` | 正常 |
| `c` | `(c)` | `(c, a, b)` | 正常 |
| `ca` | `(c, a)` | `(c, a, b)` | 冗余，和 `c` 重复 |
| `cb` | `(c, b)` | `(c, b, a)` | 不冗余，是否保留取决于查询模式 |

为了把这个差异看得更直观，我们用一组具体数据看一下这三个索引叶子项的实际排列顺序：

<MySQLIndexRedundancyDiagram />

#### 为什么 `KEY cb(c, b)` 最终是 `(c, b, a)`，而不是 `(c, b, a, b)`

这里还有一个很容易被忽略的细节：InnoDB 在处理二级索引时，并不是把“二级索引列 + 完整主键列”机械地直接拼起来，而是会避免重复存储已经出现过的主键列。

你可以把它近似理解成这样两条规则：

- 二级索引叶子节点里，必须带上足够的聚簇索引键，才能定位到完整数据行；
- 如果二级索引定义里已经包含了某些主键列，这些列就不会再被重复追加一次。

所以，对于这个表：

- 主键是 `(a, b)`；
- 索引 `KEY cb(c, b)` 里，用户显式定义的列是 `(c, b)`；
- 这时候 InnoDB 只需要再把“还没出现的主键列”补上，也就是 `a`。

因此最终顺序是 `(c, b, a)`，而不是 `(c, b, a, b)`。

如果真的按 `(c, b, a, b)` 存，最后那个 `b` 就完全是冗余的。因为对 InnoDB 来说，前面的 `(c, b, a)` 已经足以唯一确定这一条记录，再多存一个 `b` 既不能提升排序能力，也不能提升查找能力，反而只会浪费索引空间和 Buffer Pool。

也就是说，`KEY ca (c, a)` 基本是多此一举的。因为 `KEY c (c)` 实际上已经按 `(c, a, b)` 排序了，它天然就能支持下面这类语句：

- `where c = ?`
- `where c = ? and a = ?`
- `where c = ? order by a limit 1`

因此，如果只是为了 `select * from geek where c=N order by a limit 1` 这个查询建索引，那么保留 `KEY c (c)` 就够了，`KEY ca (c, a)` 可以删掉。

但 `KEY cb (c, b)` 不能简单视为冗余。原因在于：`KEY c (c)` 在 `c` 相同的记录内部，顺序其实是按主键 `(a, b)` 排的，而不是按 `b` 排的。所以对于下面这条语句：

```sql
select * from geek where c=N order by b limit 1;
```

如果没有 `KEY cb (c, b)`，MySQL 往往无法直接利用索引顺序拿到“`b` 最小的那一行”，可能需要扫描更多记录，甚至额外排序；而有了 `cb`，索引顺序就是 `(c, b, a)`，这条语句才能真正做到高效。

所以，这个例子的更准确结论是：

- `ca` 可以删除，它和 `c` 重复；
- `cb` 是否保留，要看你是否真的存在高频的 `where c = ? order by b limit 1` 查询；
- 如果这类查询存在，`cb` 应该保留；如果不存在，那它才可能是额外负担。

### 补充一个冷知识

上面一直在说“二级索引会自动带上主键”，但更准确的说法其实是：二级索引叶子节点里会带上 InnoDB 选定的**聚簇索引键**。

如果你的表没有显式定义主键，InnoDB 会按下面的顺序选择聚簇索引键：

- 优先使用第一个 `UNIQUE NOT NULL` 索引；
- 如果连这样的索引也没有，就自动生成一个 6 字节的隐藏 RowID。

也就是说，在这两种情况下，二级索引里实际挂上的内容分别会变成：

- `KEY(c)` 存的是 `(c, 唯一非空索引列...)`；
- 或者 `KEY(c)` 存的是 `(c, RowID)`。

所以，“主键列已经免费送给你了”这句话，在工程上可以理解为：**聚簇索引键已经免费跟在二级索引后面了**。例如，如果 `id` 就是主键，或者它正好是 InnoDB 选中的聚簇索引键，那么你需要 `(c, id)` 这种组合时，通常 `KEY(c)` 就已经够用了，不必再额外建一个 `(c, id)`。

索引不是越多越好。每多一个索引，就会多一份磁盘占用、多一份 Buffer Pool 压力，也会让 `INSERT`、`UPDATE`、`DELETE` 的维护成本更高。因此在 InnoDB 里设计联合索引时，一定要把“二级索引会自动带上主键”这个特性一起考虑进去。

## 上期问题时间

上期的问题是，通过两个alter 语句重建索引k，以及通过两个alter语句重建主键索引是否合理。

在评论区，有同学问到为什么要重建索引。我们文章里面有提到，索引可能因为删除，或者页分裂等原因，导致数据页有空洞，重建索引的过程会创建一个新的索引，把数据按顺序插入，这样页面的利用率最高，也就是索引更紧凑、更省空间。

这道题目，我给你的“参考答案”是：

重建索引k的做法是合理的，可以达到省空间的目的。但是，重建主键的过程不合理。不论是删除主键还是创建主键，都会将整个表重建。所以连着执行这两个语句的话，第一个语句就白做了。这两个语句，你可以用这个语句代替 ： alter table T engine=`InnoDB`。在专栏的第12篇文章《为什么表数据删掉一半，表文件大小不变？》中，我会和你分析这条语句的执行流程。

评论区留言中， @壹笙☞漂泊 做了很详细的笔记，@高枕 帮同学解答了问题，@约书亚 提了一个很不错的面试问题。在这里，我要和你们道一声感谢。

PS：如果你在面试中，曾有过被MySQL相关问题难住的经历，也可以把这个问题发到评论区，我们一起来讨论。如果解答这个问题，需要的篇幅会很长的话，我可以放到答疑文章展开。
