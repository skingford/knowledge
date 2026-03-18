---
title: "MySQL 实战 45 讲：09. 普通索引和唯一索引，应该怎么选择？"
description: "极客时间《MySQL 实战 45 讲》第 09 讲笔记整理"
---

# 09. 普通索引和唯一索引，应该怎么选择？

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

用户名是 @某、人 的同学，对文章的知识点做了梳理，然后提了关于事务可见性的问题，就是先启动但是后提交的事务，对数据可见性的影响。@夏日雨同学也提到了这个问题，我在置顶评论中回复了，今天的文章末尾也会再展开说明。@Justin和@倪大人两位同学提了两个好问题。

对于能够引发更深一步思考的问题，我会在回复的内容中写上“好问题”三个字，方便你搜索，你也可以去看看他们的留言。

非常感谢大家很细致地看文章，并且留下了那么多和很高质量的留言。知道文章有给大家带来一些新理解，对我来说是一个很好的鼓励。同时，也让其他认真看评论区的同学，有机会发现一些自己还没有意识到的、但可能还不清晰的知识点，这也在总体上提高了整个专栏的质量。再次谢谢你们。

好了，现在就回到我们今天的正文内容。

在前面的基础篇文章中，我给你介绍过索引的基本概念，相信你已经了解了唯一索引和普通索引的区别。今天我们就继续来谈谈，在不同的业务场景下，应该选择普通索引，还是唯一索引？

假设你在维护一个市民系统，每个人都有一个唯一的身份证号，而且业务代码已经保证了不会写入两个重复的身份证号。如果市民系统需要按照身份证号查姓名，就会执行类似这样的SQL语句：

```sql
select name from CUser where id_card = 'xxxxxxxyyyyyyzzzzz';
```


所以，你一定会考虑在id_card字段上建索引。

由于身份证号字段比较大，我不建议你把身份证号当做主键，那么现在你有两个选择，要么给id_card字段创建唯一索引，要么创建一个普通索引。如果业务代码已经保证了不会写入重复的身份证号，那么这两个选择逻辑上都是正确的。

现在我要问你的是，从性能的角度考虑，你选择唯一索引还是普通索引呢？选择的依据是什么呢？

简单起见，我们还是用第4篇文章[《深入浅出索引（上）》](<https://time.geekbang.org/column/article/69236>)中的例子来说明，假设字段 k 上的值都不重复。

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg class="diagram-mysql-09-index-structure" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="var(--d-text-muted)"/></marker></defs>
  <!-- Title -->
  <text x="280" y="18" class="title" text-anchor="middle">图1 InnoDB的索引组织结构</text>
  <!-- Left: Primary Key Index -->
  <text x="130" y="42" class="label">主键索引 (ID)</text>
  <!-- Root -->
  <rect x="90" y="50" width="80" height="24" rx="4" class="node"/>
  <text x="130" y="65" class="txt">300</text>
  <!-- Level 2 -->
  <rect x="40" y="100" width="60" height="24" rx="4" class="node"/>
  <text x="70" y="115" class="txt">100, 200</text>
  <rect x="160" y="100" width="60" height="24" rx="4" class="node"/>
  <text x="190" y="115" class="txt">500, 600</text>
  <line x1="110" y1="74" x2="70" y2="100" class="arrow"/>
  <line x1="150" y1="74" x2="190" y2="100" class="arrow"/>
  <!-- Leaf nodes -->
  <rect x="5" y="155" width="50" height="44" rx="4" class="leaf"/>
  <text x="30" y="170" class="stxt">R1</text>
  <text x="30" y="182" class="stxt">ID=100</text>
  <text x="30" y="193" class="stxt">k=1</text>
  <rect x="60" y="155" width="50" height="44" rx="4" class="leaf"/>
  <text x="85" y="170" class="stxt">R2</text>
  <text x="85" y="182" class="stxt">ID=200</text>
  <text x="85" y="193" class="stxt">k=2</text>
  <rect x="115" y="155" width="50" height="44" rx="4" class="leaf"/>
  <text x="140" y="170" class="stxt">R3</text>
  <text x="140" y="182" class="stxt">ID=300</text>
  <text x="140" y="193" class="stxt">k=3</text>
  <rect x="170" y="155" width="50" height="44" rx="4" class="cur"/>
  <text x="195" y="170" class="stxt">R4</text>
  <text x="195" y="182" class="stxt">ID=500</text>
  <text x="195" y="193" class="stxt">k=5</text>
  <rect x="225" y="155" width="50" height="44" rx="4" class="leaf"/>
  <text x="250" y="170" class="stxt">R5</text>
  <text x="250" y="182" class="stxt">ID=600</text>
  <text x="250" y="193" class="stxt">k=6</text>
  <line x1="55" y1="124" x2="30" y2="155" class="arrow"/>
  <line x1="70" y1="124" x2="85" y2="155" class="arrow"/>
  <line x1="85" y1="124" x2="140" y2="155" class="arrow"/>
  <line x1="180" y1="124" x2="195" y2="155" class="arrow"/>
  <line x1="200" y1="124" x2="250" y2="155" class="arrow"/>
  <!-- Leaf chain arrows -->
  <line x1="55" y1="177" x2="60" y2="177" class="arrow" style="marker-end:none"/>
  <line x1="110" y1="177" x2="115" y2="177" class="arrow" style="marker-end:none"/>
  <line x1="165" y1="177" x2="170" y2="177" class="arrow" style="marker-end:none"/>
  <line x1="220" y1="177" x2="225" y2="177" class="arrow" style="marker-end:none"/>
  <!-- Right: Secondary Index on k -->
  <text x="420" y="42" class="label">非主键索引 (k)</text>
  <!-- Root -->
  <rect x="380" y="50" width="80" height="24" rx="4" class="node"/>
  <text x="420" y="65" class="txt">3</text>
  <!-- Level 2 -->
  <rect x="330" y="100" width="60" height="24" rx="4" class="node"/>
  <text x="360" y="115" class="txt">1, 2</text>
  <rect x="450" y="100" width="60" height="24" rx="4" class="node"/>
  <text x="480" y="115" class="txt">5, 6</text>
  <line x1="400" y1="74" x2="360" y2="100" class="arrow"/>
  <line x1="440" y1="74" x2="480" y2="100" class="arrow"/>
  <!-- Leaf nodes with (k, ID) pairs -->
  <rect x="300" y="155" width="40" height="38" rx="4" class="leaf"/>
  <text x="320" y="170" class="stxt">(1,100)</text>
  <rect x="345" y="155" width="40" height="38" rx="4" class="leaf"/>
  <text x="365" y="170" class="stxt">(2,200)</text>
  <rect x="390" y="155" width="40" height="38" rx="4" class="leaf"/>
  <text x="410" y="170" class="stxt">(3,300)</text>
  <rect x="435" y="155" width="40" height="38" rx="4" class="cur"/>
  <text x="455" y="170" class="stxt">(5,500)</text>
  <rect x="480" y="155" width="40" height="38" rx="4" class="leaf"/>
  <text x="500" y="170" class="stxt">(6,600)</text>
  <line x1="345" y1="124" x2="320" y2="155" class="arrow"/>
  <line x1="360" y1="124" x2="365" y2="155" class="arrow"/>
  <line x1="375" y1="124" x2="410" y2="155" class="arrow"/>
  <line x1="470" y1="124" x2="455" y2="155" class="arrow"/>
  <line x1="490" y1="124" x2="500" y2="155" class="arrow"/>
  <!-- Leaf chain -->
  <line x1="340" y1="174" x2="345" y2="174" class="arrow" style="marker-end:none"/>
  <line x1="385" y1="174" x2="390" y2="174" class="arrow" style="marker-end:none"/>
  <line x1="430" y1="174" x2="435" y2="174" class="arrow" style="marker-end:none"/>
  <line x1="475" y1="174" x2="480" y2="174" class="arrow" style="marker-end:none"/>
  <!-- Annotation -->
  <text x="130" y="225" class="stxt" style="fill:var(--d-text-muted)">叶子节点存储完整行数据</text>
  <text x="420" y="225" class="stxt" style="fill:var(--d-text-muted)">叶子节点存储 (k值, 主键ID)</text>
  <!-- Back-query arrow -->
  <path d="M455,195 C455,260 195,260 195,200" class="arrow" style="stroke:var(--d-orange);stroke-dasharray:4,3"/>
  <text x="325" y="275" class="stxt" style="fill:var(--d-orange)">回表查询：通过ID找完整行</text>
</svg>
</div>


接下来，我们就从这两种索引对查询语句和更新语句的性能影响来进行分析。

## 查询过程

假设，执行查询的语句是 select id from T where k=5。这个查询语句在索引树上查找的过程，先是通过B+树从树根开始，按层搜索到叶子节点，也就是图中右下角的这个数据页，然后可以认为数据页内部通过二分法来定位记录。

- 对于普通索引来说，查找到满足条件的第一个记录(5,500)后，需要查找下一个记录，直到碰到第一个不满足k=5条件的记录。
- 对于唯一索引来说，由于索引定义了唯一性，查找到第一个满足条件的记录后，就会停止继续检索。


那么，这个不同带来的性能差距会有多少呢？答案是，微乎其微。

你知道的，InnoDB的数据是按数据页为单位来读写的。也就是说，当需要读一条记录的时候，并不是将这个记录本身从磁盘读出来，而是以页为单位，将其整体读入内存。在InnoDB中，每个数据页的大小默认是16KB。

因为引擎是按页读写的，所以说，当找到k=5的记录的时候，它所在的数据页就都在内存里了。那么，对于普通索引来说，要多做的那一次“查找和判断下一条记录”的操作，就只需要一次指针寻找和一次计算。

当然，如果k=5这个记录刚好是这个数据页的最后一个记录，那么要取下一个记录，必须读取下一个数据页，这个操作会稍微复杂一些。

但是，我们之前计算过，对于整型字段，一个数据页可以放近千个key，因此出现这种情况的概率会很低。所以，我们计算平均性能差异时，仍可以认为这个操作成本对于现在的CPU来说可以忽略不计。

## 更新过程

为了说明普通索引和唯一索引对更新语句性能的影响这个问题，我需要先跟你介绍一下change buffer。

当需要更新一个数据页时，如果数据页在内存中就直接更新，而如果这个数据页还没有在内存中的话，在不影响数据一致性的前提下，InooDB会将这些更新操作缓存在change buffer中，这样就不需要从磁盘中读入这个数据页了。在下次查询需要访问这个数据页的时候，将数据页读入内存，然后执行change buffer中与这个页有关的操作。通过这种方式就能保证这个数据逻辑的正确性。

需要说明的是，虽然名字叫作change buffer，实际上它是可以持久化的数据。也就是说，change buffer在内存中有拷贝，也会被写入到磁盘上。

将change buffer中的操作应用到原数据页，得到最新结果的过程称为merge。除了访问这个数据页会触发merge外，系统有后台线程会定期merge。在数据库正常关闭（shutdown）的过程中，也会执行merge操作。

显然，如果能够将更新操作先记录在change buffer，减少读磁盘，语句的执行速度会得到明显的提升。而且，数据读入内存是需要占用buffer pool的，所以这种方式还能够避免占用内存，提高内存利用率。

那么，**什么条件下可以使用change buffer呢？**

对于唯一索引来说，所有的更新操作都要先判断这个操作是否违反唯一性约束。比如，要插入(4,400)这个记录，就要先判断现在表中是否已经存在k=4的记录，而这必须要将数据页读入内存才能判断。如果都已经读入到内存了，那直接更新内存会更快，就没必要使用change buffer了。

因此，唯一索引的更新就不能使用change buffer，实际上也只有普通索引可以使用。

change buffer用的是buffer pool里的内存，因此不能无限增大。change buffer的大小，可以通过参数innodb_change_buffer_max_size来动态设置。这个参数设置为50的时候，表示change buffer的大小最多只能占用buffer pool的50%。

现在，你已经理解了change buffer的机制，那么我们再一起来看看**如果要在这张表中插入一个新记录(4,400)的话，InnoDB的处理流程是怎样的。**

第一种情况是，**这个记录要更新的目标页在内存中** 。这时，InnoDB的处理流程如下：

- 对于唯一索引来说，找到3和5之间的位置，判断到没有冲突，插入这个值，语句执行结束；
- 对于普通索引来说，找到3和5之间的位置，插入这个值，语句执行结束。


这样看来，普通索引和唯一索引对更新语句性能影响的差别，只是一个判断，只会耗费微小的CPU时间。

但，这不是我们关注的重点。

第二种情况是，**这个记录要更新的目标页不在内存中** 。这时，InnoDB的处理流程如下：

- 对于唯一索引来说，需要将数据页读入内存，判断到没有冲突，插入这个值，语句执行结束；
- 对于普通索引来说，则是将更新记录在change buffer，语句执行就结束了。


将数据从磁盘读入内存涉及随机IO的访问，是数据库里面成本最高的操作之一。change buffer因为减少了随机磁盘访问，所以对更新性能的提升是会很明显的。

之前我就碰到过一件事儿，有个DBA的同学跟我反馈说，他负责的某个业务的库内存命中率突然从99%降低到了75%，整个系统处于阻塞状态，更新语句全部堵住。而探究其原因后，我发现这个业务有大量插入数据的操作，而他在前一天把其中的某个普通索引改成了唯一索引。

## change buffer的使用场景

通过上面的分析，你已经清楚了使用change buffer对更新过程的加速作用，也清楚了change buffer只限于用在普通索引的场景下，而不适用于唯一索引。那么，现在有一个问题就是：普通索引的所有场景，使用change buffer都可以起到加速作用吗？

因为merge的时候是真正进行数据更新的时刻，而change buffer的主要目的就是将记录的变更动作缓存下来，所以在一个数据页做merge之前，change buffer记录的变更越多（也就是这个页面上要更新的次数越多），收益就越大。

因此，对于写多读少的业务来说，页面在写完以后马上被访问到的概率比较小，此时change buffer的使用效果最好。这种业务模型常见的就是账单类、日志类的系统。

反过来，假设一个业务的更新模式是写入之后马上会做查询，那么即使满足了条件，将更新先记录在change buffer，但之后由于马上要访问这个数据页，会立即触发merge过程。这样随机访问IO的次数不会减少，反而增加了change buffer的维护代价。所以，对于这种业务模式来说，change buffer反而起到了副作用。

## 索引选择和实践

回到我们文章开头的问题，普通索引和唯一索引应该怎么选择。其实，这两类索引在查询能力上是没差别的，主要考虑的是对更新性能的影响。所以，我建议你尽量选择普通索引。

如果所有的更新后面，都马上伴随着对这个记录的查询，那么你应该关闭change buffer。而在其他情况下，change buffer都能提升更新性能。

在实际使用中，你会发现，普通索引和change buffer的配合使用，对于数据量大的表的更新优化还是很明显的。

特别地，在使用机械硬盘时，change buffer这个机制的收效是非常显著的。所以，当你有一个类似“历史数据”的库，并且出于成本考虑用的是机械硬盘时，那你应该特别关注这些表里的索引，尽量使用普通索引，然后把change buffer 尽量开大，以确保这个“历史数据”表的数据写入速度。

## change buffer 和 redo log

理解了change buffer的原理，你可能会联想到我在前面文章中和你介绍过的redo log和WAL。

在前面文章的评论中，我发现有同学混淆了redo log和change buffer。`WAL` 提升性能的核心机制，也的确是尽量减少随机读写，这两个概念确实容易混淆。所以，这里我把它们放到了同一个流程里来说明，便于你区分这两个概念。

> 备注：这里，你可以再回顾下第2篇文章[《日志系统：一条SQL更新语句是如何执行的？》](<https://time.geekbang.org/column/article/68633>)中的相关内容。

现在，我们要在表上执行这个插入语句：

```sql
mysql> insert into t(id,k) values(id1,k1),(id2,k2);
```


这里，我们假设当前k索引树的状态，查找到位置后，k1所在的数据页在内存(`InnoDB` `buffer pool`)中，k2所在的数据页不在内存中。如图2所示是带change buffer的更新状态图。

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg class="diagram-mysql-09-unique-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 370" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah2" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><path d="M0,0 L7,2.5 L0,5" fill="var(--d-text-muted)"/></marker></defs>
  <text x="280" y="18" class="t2">图2 带change buffer的更新过程</text>
  <!-- Memory region -->
  <rect x="10" y="30" width="240" height="180" class="box2" style="fill:var(--d-bg-alt)"/>
  <text x="130" y="48" class="lbl2">内存 (Memory)</text>
  <!-- Buffer Pool -->
  <rect x="20" y="58" width="100" height="60" class="inner2"/>
  <text x="70" y="74" class="st2">Buffer Pool</text>
  <text x="70" y="90" class="st2s">Page 1</text>
  <text x="70" y="102" class="st2s" style="fill:var(--d-green)">(内存中)</text>
  <!-- Change Buffer -->
  <rect x="135" y="58" width="105" height="60" class="cb2"/>
  <text x="187" y="74" class="st2">Change Buffer</text>
  <text x="187" y="90" class="st2s">"插入 Page 2"</text>
  <text x="187" y="102" class="st2s" style="fill:var(--d-orange)">(记录变更)</text>
  <!-- Disk region -->
  <rect x="280" y="30" width="270" height="280" class="box2" style="fill:var(--d-bg)"/>
  <text x="415" y="48" class="lbl2">磁盘 (Disk)</text>
  <!-- Data tablespace -->
  <rect x="295" y="58" width="110" height="70" class="disk2"/>
  <text x="350" y="76" class="st2">数据表空间</text>
  <text x="350" y="90" class="st2s">(t.ibd)</text>
  <rect x="305" y="98" width="40" height="22" rx="3" style="fill:var(--d-blue-bg);stroke:var(--d-blue-border);stroke-width:0.8"/>
  <text x="325" y="113" class="st2s">Page 1</text>
  <rect x="355" y="98" width="40" height="22" rx="3" style="fill:var(--d-bg-alt);stroke:var(--d-border);stroke-width:0.8"/>
  <text x="375" y="113" class="st2s">Page 2</text>
  <!-- System tablespace -->
  <rect x="420" y="58" width="120" height="70" class="disk2"/>
  <text x="480" y="76" class="st2">系统表空间</text>
  <text x="480" y="92" class="st2s">(ibdata1)</text>
  <text x="480" y="108" class="st2s">change buffer</text>
  <text x="480" y="120" class="st2s">持久化数据</text>
  <!-- Redo log -->
  <rect x="310" y="150" width="220" height="50" class="disk2" style="fill:var(--d-cur-bg);stroke:var(--d-cur-border)"/>
  <text x="420" y="172" class="st2">Redo Log (ib_log_fileX)</text>
  <text x="420" y="186" class="st2s">顺序写入</text>
  <!-- Arrow 1: Update Page 1 in memory -->
  <circle cx="38" cy="140" r="10" fill="var(--d-blue)" opacity="0.15" stroke="var(--d-blue)" stroke-width="1"/>
  <text x="38" y="144" class="num" style="fill:var(--d-blue)">1</text>
  <line x1="50" y1="140" x2="70" y2="118" class="arr2" style="stroke:var(--d-blue)"/>
  <text x="30" y="165" class="st2s" style="fill:var(--d-blue)">更新Page 1</text>
  <!-- Arrow 2: Record in change buffer -->
  <circle cx="187" cy="140" r="10" fill="var(--d-orange)" opacity="0.15" stroke="var(--d-orange)" stroke-width="1"/>
  <text x="187" y="144" class="num" style="fill:var(--d-orange)">2</text>
  <line x1="187" y1="130" x2="187" y2="118" class="arr2" style="stroke:var(--d-orange)"/>
  <text x="187" y="165" class="st2s" style="fill:var(--d-orange)">记录变更</text>
  <!-- Arrow 3: Redo log for Page 1 -->
  <circle cx="100" cy="195" r="10" fill="var(--d-green)" opacity="0.15" stroke="var(--d-green)" stroke-width="1"/>
  <text x="100" y="199" class="num" style="fill:var(--d-green)">3</text>
  <path d="M112,195 L300,178" class="arr2" style="stroke:var(--d-green)"/>
  <!-- Arrow 4: Redo log for change buffer -->
  <circle cx="155" cy="195" r="10" fill="var(--d-green)" opacity="0.15" stroke="var(--d-green)" stroke-width="1"/>
  <text x="155" y="199" class="num" style="fill:var(--d-green)">4</text>
  <path d="M167,195 L310,183" class="arr2" style="stroke:var(--d-green)"/>
  <!-- Dashed: background flush to disk -->
  <path d="M70,118 Q70,240 325,240 Q325,230 325,120" class="dash2" style="stroke:var(--d-text-muted)"/>
  <text x="195" y="252" class="st2s" style="fill:var(--d-text-muted)">后台刷盘</text>
  <path d="M210,118 Q240,260 480,260 Q480,245 480,130" class="dash2" style="stroke:var(--d-text-muted)"/>
  <text x="370" y="275" class="st2s" style="fill:var(--d-text-muted)">后台刷盘</text>
  <!-- Legend -->
  <text x="280" y="340" class="st2s" style="fill:var(--d-text-muted)">实线箭头：事务执行步骤 | 虚线箭头：后台操作（不影响响应时间）</text>
</svg>
</div>


分析这条更新语句，你会发现它涉及了四个部分：内存、`redo log`（ib_log_fileX）、 数据表空间（t.ibd）、系统表空间（ibdata1）。

这条更新语句做了如下的操作（按照图中的数字顺序）：

  1. Page 1在内存中，直接更新内存；

  2. Page 2没有在内存中，就在内存的change buffer区域，记录下“我要往Page 2插入一行”这个信息

  3. 将上述两个动作记入redo log中（图中3和4）。


做完上面这些，事务就可以完成了。所以，你会看到，执行这条更新语句的成本很低，就是写了两处内存，然后写了一处磁盘（两次操作合在一起写了一次磁盘），而且还是顺序写的。

同时，图中的两个虚线箭头，是后台操作，不影响更新的响应时间。

那在这之后的读请求，要怎么处理呢？

比如，我们现在要执行 select * from t where k in (k1, k2)。这里，我画了这两个读请求的流程图。

如果读语句发生在更新语句后不久，内存中的数据都还在，那么此时的这两个读操作就与系统表空间（ibdata1）和 `redo log`（ib_log_fileX）无关了。所以，我在图中就没画出这两部分。

<div style="display:flex;justify-content:center;padding:20px 0;">
<svg class="diagram-mysql-09-change-buffer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 320" style="max-width:560px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah3" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><path d="M0,0 L7,2.5 L0,5" fill="var(--d-text-muted)"/></marker></defs>
  <text x="280" y="18" class="t3">图3 带change buffer的读过程</text>
  <!-- Memory -->
  <rect x="30" y="35" width="300" height="180" class="box3"/>
  <text x="180" y="53" class="lbl3">内存 (Memory)</text>
  <!-- Buffer Pool: Page 1 -->
  <rect x="45" y="63" width="110" height="55" class="inner3"/>
  <text x="100" y="80" class="st3">Buffer Pool</text>
  <text x="100" y="94" class="st3s">Page 1</text>
  <text x="100" y="106" class="st3s" style="fill:var(--d-green)">已在内存中 ✓</text>
  <!-- Change Buffer -->
  <rect x="175" y="63" width="140" height="55" class="cb3"/>
  <text x="245" y="80" class="st3">Change Buffer</text>
  <text x="245" y="94" class="st3s">Page 2 的变更记录</text>
  <!-- Page 2 merging area -->
  <rect x="100" y="135" width="170" height="55" rx="4" style="fill:var(--d-bg);stroke:var(--d-orange);stroke-width:1.2;stroke-dasharray:4,2"/>
  <text x="185" y="153" class="st3" style="fill:var(--d-orange)">Page 2 (merge 合并中)</text>
  <text x="185" y="168" class="st3s">磁盘数据 + change buffer</text>
  <text x="185" y="181" class="st3s" style="fill:var(--d-green)">→ 生成正确版本</text>
  <!-- Disk -->
  <rect x="380" y="35" width="160" height="100" class="box3" style="fill:var(--d-bg)"/>
  <text x="460" y="53" class="lbl3">磁盘 (Disk)</text>
  <rect x="395" y="63" width="130" height="55" class="disk3"/>
  <text x="460" y="80" class="st3">数据表空间</text>
  <text x="460" y="94" class="st3s">(t.ibd)</text>
  <text x="460" y="108" class="st3s">Page 2</text>
  <!-- Step 1: Read Page 1 from memory -->
  <circle cx="48" cy="148" r="10" fill="var(--d-blue)" opacity="0.15" stroke="var(--d-blue)" stroke-width="1"/>
  <text x="48" y="152" class="n3" style="fill:var(--d-blue)">1</text>
  <path d="M48,138 L75,118" class="a3" style="stroke:var(--d-blue)"/>
  <text x="48" y="172" class="st3s" style="fill:var(--d-blue)">直接读取</text>
  <text x="48" y="184" class="st3s" style="fill:var(--d-blue)">返回结果</text>
  <!-- Step 2: Read Page 2 from disk -->
  <circle cx="370" cy="155" r="10" fill="var(--d-orange)" opacity="0.15" stroke="var(--d-orange)" stroke-width="1"/>
  <text x="370" y="159" class="n3" style="fill:var(--d-orange)">2</text>
  <path d="M395,100 L380,145" class="a3" style="stroke:var(--d-orange)"/>
  <text x="425" y="157" class="st3s" style="fill:var(--d-orange)">从磁盘读入</text>
  <!-- Step 3: Apply change buffer -->
  <circle cx="295" cy="133" r="10" fill="var(--d-orange)" opacity="0.15" stroke="var(--d-orange)" stroke-width="1"/>
  <text x="295" y="137" class="n3" style="fill:var(--d-orange)">3</text>
  <path d="M270,118 L270,135" class="a3" style="stroke:var(--d-orange)"/>
  <text x="295" y="120" class="st3s" style="fill:var(--d-orange)">merge</text>
  <!-- Step 4: Return result -->
  <circle cx="78" cy="205" r="10" fill="var(--d-green)" opacity="0.15" stroke="var(--d-green)" stroke-width="1"/>
  <text x="78" y="209" class="n3" style="fill:var(--d-green)">4</text>
  <path d="M100,190 L88,200" class="a3" style="stroke:var(--d-green)"/>
  <text x="120" y="215" class="st3s" style="fill:var(--d-green)">返回合并后的正确结果</text>
  <!-- Legend -->
  <text x="280" y="260" class="st3s" style="fill:var(--d-text-muted)">① Page 1 已在内存，直接返回 → ② Page 2 从磁盘读入</text>
  <text x="280" y="275" class="st3s" style="fill:var(--d-text-muted)">③ 应用 change buffer 合并 → ④ 返回正确结果</text>
</svg>
</div>


从图中可以看到：

  1. 读Page 1的时候，直接从内存返回。有几位同学在前面文章的评论中问到，WAL之后如果读数据，是不是一定要读盘，是不是一定要从redo log里面把数据更新以后才可以返回？其实是不用的。你可以看一下图3的这个状态，虽然磁盘上还是之前的数据，但是这里直接从内存返回结果，结果是正确的。

  2. 要读Page 2的时候，需要把Page 2从磁盘读入内存中，然后应用change buffer里面的操作日志，生成一个正确的版本并返回结果。


可以看到，直到需要读Page 2的时候，这个数据页才会被读入内存。

所以，如果要简单地对比这两个机制在提升更新性能上的收益的话，**`redo log` 主要节省的是随机写磁盘的IO消耗（转成顺序写），而change buffer主要节省的则是随机读磁盘的IO消耗。**

## 小结

今天，我从普通索引和唯一索引的选择开始，和你分享了数据的查询和更新过程，然后说明了change buffer的机制以及应用场景，最后讲到了索引选择的实践。

由于唯一索引用不上change buffer的优化机制，因此如果业务可以接受，从性能角度出发我建议你优先考虑非唯一索引。

最后，又到了思考题时间。

通过图2你可以看到，change buffer一开始是写内存的，那么如果这个时候机器掉电重启，会不会导致change buffer丢失呢？change buffer丢失可不是小事儿，再从磁盘读入数据可就没有了merge过程，就等于是数据丢失了。会不会出现这种情况呢？

你可以把你的思考和观点写在留言区里，我会在下一篇文章的末尾和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

**补充：**  
评论区大家对“是否使用唯一索引”有比较多的讨论，主要是纠结在“业务可能无法确保”的情况。这里，我再说明一下：

- 首先，业务正确性优先。咱们这篇文章的前提是“业务代码已经保证不会写入重复数据”的情况下，讨论性能问题。如果业务不能保证，或者业务就是要求数据库来做约束，那么没得选，必须创建唯一索引。这种情况下，本篇文章的意义在于，如果碰上了大量插入数据慢、内存命中率低的时候，可以给你多提供一个排查思路。
- 然后，在一些“归档库”的场景，你是可以考虑使用唯一索引的。比如，线上数据只需要保留半年，然后历史数据保存在归档库。这时候，归档数据已经是确保没有唯一键冲突了。要提高归档效率，可以考虑把表里面的唯一索引改成普通索引。


## 上期问题时间

上期的问题是：如何构造一个“数据无法修改”的场景。评论区里已经有不少同学给出了正确答案，这里我再描述一下。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="max-width:560px;width:100%;font-family:system-ui,sans-serif;">
<div style="text-align:center;font-size:13px;font-weight:700;color:var(--d-text);margin-bottom:10px;">构造"数据无法修改"的场景</div>
<table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid var(--d-th-border);">
<thead>
<tr>
<th style="background:var(--d-th-bg);color:var(--d-th-text);border:1px solid var(--d-th-border);padding:8px 10px;text-align:center;width:15%;">时刻</th>
<th style="background:var(--d-th-bg);color:var(--d-th-text);border:1px solid var(--d-th-border);padding:8px 10px;text-align:center;width:42%;">Session A</th>
<th style="background:var(--d-th-bg);color:var(--d-th-text);border:1px solid var(--d-th-border);padding:8px 10px;text-align:center;width:42%;">Session B</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T1</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-blue-bg);color:var(--d-text);font-size:11px;">start transaction with consistent snapshot;</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
</tr>
<tr style="background:var(--d-stripe);">
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T2</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-cur-bg);color:var(--d-text);font-size:11px;">update t set c=c+1 where id=1;<br><span style="color:var(--d-green);font-size:10px;">(自动提交)</span></td>
</tr>
<tr>
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T3</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-blue-bg);color:var(--d-text);font-size:11px;">select * from t where id=1;<br><span style="color:var(--d-orange);font-size:10px;">→ 看到旧值（一致性读）</span></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
</tr>
<tr style="background:var(--d-stripe);">
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T4</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-blue-bg);color:var(--d-text);font-size:11px;">select * from t where id=1;<br><span style="color:var(--d-orange);font-size:10px;">→ 仍然看到旧值</span></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
</tr>
</tbody>
</table>
</div>
</div>


其实，还有另外一种场景，同学们在留言区都还没有提到。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="max-width:560px;width:100%;font-family:system-ui,sans-serif;">
<div style="text-align:center;font-size:13px;font-weight:700;color:var(--d-text);margin-bottom:10px;">活跃事务的可见性判断（Session B' 先启动后提交）</div>
<table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid var(--d-th-border);">
<thead>
<tr>
<th style="background:var(--d-th-bg);color:var(--d-th-text);border:1px solid var(--d-th-border);padding:8px 10px;text-align:center;width:15%;">时刻</th>
<th style="background:var(--d-th-bg);color:var(--d-th-text);border:1px solid var(--d-th-border);padding:8px 10px;text-align:center;width:42%;">Session A</th>
<th style="background:var(--d-th-bg);color:var(--d-th-text);border:1px solid var(--d-th-border);padding:8px 10px;text-align:center;width:42%;">Session B'</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T1</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-cur-bg);color:var(--d-text);font-size:11px;">start transaction with consistent snapshot;</td>
</tr>
<tr style="background:var(--d-stripe);">
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T2</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-cur-bg);color:var(--d-text);font-size:11px;">update t set c=c+1 where id=1;<br><span style="color:var(--d-orange);font-size:10px;">（未提交）</span></td>
</tr>
<tr>
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T3</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-blue-bg);color:var(--d-text);font-size:11px;">start transaction with consistent snapshot;<br><span style="color:var(--d-text-muted);font-size:10px;">（此时 B' 是活跃事务）</span></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
</tr>
<tr style="background:var(--d-stripe);">
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T4</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-cur-bg);color:var(--d-text);font-size:11px;">commit;<br><span style="color:var(--d-green);font-size:10px;">（提交）</span></td>
</tr>
<tr>
<td style="border:1px solid var(--d-border);padding:6px 10px;text-align:center;color:var(--d-text-sub);">T5</td>
<td style="border:1px solid var(--d-border);padding:6px 10px;background:var(--d-blue-bg);color:var(--d-text);font-size:11px;">select * from t where id=1;<br><span style="color:var(--d-orange);font-size:10px;">→ 看到旧值（B' 在 A 视图创建时是活跃的，属于"版本未提交，不可见"）</span></td>
<td style="border:1px solid var(--d-border);padding:6px 10px;color:var(--d-text-muted);text-align:center;"></td>
</tr>
</tbody>
</table>
</div>
</div>


这个操作序列跑出来，session A看的内容也是能够复现我截图的效果的。这个session B’启动的事务比A要早，其实是上期我们描述事务版本的可见性规则时留的彩蛋，因为规则里还有一个“活跃事务的判断”，我是准备留到这里再补充的。

当我试图在这里讲述完整规则的时候，发现第8篇文章[《事务到底是隔离的还是不隔离的？》](<https://time.geekbang.org/column/article/70562>)中的解释引入了太多的概念，以致于分析起来非常复杂。

因此，我重写了第8篇，这样我们人工去判断可见性的时候，才会更方便。【看到这里，我建议你能够再重新打开第8篇文章并认真学习一次。如果学习的过程中，有任何问题，也欢迎你给我留言】

用新的方式来分析session B’的更新为什么对session A不可见就是：在session A视图数组创建的瞬间，session B’是活跃的，属于“版本未提交，不可见”这种情况。

业务中如果要绕过这类问题，@约书亚提供了一个“乐观锁”的解法，大家可以去上一篇的留言区看一下。

评论区留言点赞板：

> @某、人、@夏日雨、@周巘、@李金刚 等同学提了一个很好的问题，就是我们今天答案的session B’ 的情况；  
>  @justin 提到了提交和未提交版本的区别对待，@倪大人 提到了读提交和当前读的区别，都是经过了思考后提出的好问题，大家可以去留言区看看。
