---
title: "MySQL 实战 45 讲：13. 为什么表数据删掉一半，表文件大小不变？"
description: "极客时间《MySQL 实战 45 讲》第 13 讲笔记整理"
---

# 13. 为什么表数据删掉一半，表文件大小不变？

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

那么今天，我就和你聊聊数据库表的空间回收，看看如何解决这个问题。

这里，我们还是针对MySQL中应用最广泛的InnoDB引擎展开讨论。一个InnoDB表包含两部分，即：表结构定义和数据。在MySQL 8.0版本以前，表结构是存在以.frm为后缀的文件里。而MySQL 8.0版本，则已经允许把表结构定义放在系统数据表中了。因为表结构定义占用的空间很小，所以我们今天主要讨论的是表数据。

接下来，我会先和你说明为什么简单地删除表数据达不到表空间回收的效果，然后再和你介绍正确回收空间的方法。

## 先看结论：为什么 DELETE 不会让表文件变小

如果你只想先抓住核心结论，可以先记住一句话：

**`DELETE` 释放的是“表内部可复用空间”，不是“立刻把 `.ibd` 文件缩小”。**

这件事可以从四层来理解。

### 1. 记录删除不是“橡皮擦式抹掉”，而是先变成不可见

在工程里，很多人会把这类状态类比成 **Tombstone（墓碑标记）**。放到 InnoDB 的语境里，更准确的说法是：

- 行记录先被标记为删除，或者说对后续事务变成“不可见”；
- 与这条记录相关的旧版本还要等 MVCC / purge 流程后续清理；
- 这个位置未来可以被复用，但这不等于磁盘文件会马上缩小。

也就是说，`DELETE` 更像是在数据上“画一个叉”，告诉存储引擎“这里以后可以再利用”，而不是立刻把后面的数据整体往前搬。

这背后的原因很现实：如果每删一行都要触发大规模物理搬移，那高并发场景下 I/O 和锁竞争都会非常夸张，数据库几乎没法正常工作。

### 2. 数据库按页管理空间，删几行不等于能回收整个页

InnoDB 管理空间的基本单位是 **页（page）**，默认大小通常是 **16KB**。

- 删除一行，只是让这一行所在页里出现“空洞”；
- 只要这个页里还有其他有效记录，这个页就必须继续留在表空间文件里；
- 即使某个页的数据都删空了，它通常也只是变成“可复用页”，供后续插入继续使用，而不是马上归还给操作系统。

所以，应用层看到的是“数据少了很多”，但存储层看到的是“文件里有不少空洞页和稀疏页可以复用”，这两件事不是一回事。

### 3. 文件大小通常只增不减，效果上可以理解成“高水位没有自动回退”

很多关系型数据库里都可以用 **高水位线（High Water Mark, HWM）** 这个比喻来理解空间问题。

- 写入数据时，文件不断向后扩展；
- 删除数据后，页内空间可能空出来了，但文件尾部不会自动回退；
- 操作系统看到的仍然是“这块磁盘空间已经分配给数据库文件了”。

严格来说，`HWM` 这个术语在 Oracle 等系统里更常见；但拿它来理解 InnoDB 的 `.ibd` 文件为什么不会随着 `DELETE` 自动变小，是很有帮助的。

所以，从结果上看，你可以把它理解成：

- `DELETE` 让表内部的空闲空间变多；
- 但并不会自动把表空间文件 `truncate` 回去。

### 4. 真想回收磁盘空间，通常要靠“重建”而不是“删除”

如果你只是删掉少量历史数据，那些空间通常会在后续写入时被复用，不一定值得专门做收缩。

但如果你做的是这类操作：

- 批量删掉 70% ~ 90% 历史数据；
- 归档后表明显变稀疏；
- `.ibd` 文件已经大到影响磁盘容量管理；

这时就要考虑真正的空间回收动作了。

| 方法 | MySQL 常用命令 | 原理 | 适用场景 |
| --- | --- | --- | --- |
| 重建表 | `ALTER TABLE t ENGINE=InnoDB;` | 新建紧凑的数据布局，把有效数据重写进去，再替换旧表文件 | 想去掉空洞并收缩表空间 |
| 碎片整理 | `OPTIMIZE TABLE t;` | 对 InnoDB 来说本质上接近 `recreate + analyze` | 表碎片明显，顺手也想更新统计信息 |
| 清空表 | `TRUNCATE TABLE t;` | 直接重置表，相当于快速丢弃原数据文件并重建 | 整张表都不要了 |
| 导出再导入 | `mysqldump` / `mydumper` + restore | 逻辑重排数据，让数据重新紧凑落盘 | 大规模归档、迁移、重建窗口可控时 |

所以，数据库之所以不在 `DELETE` 后立刻释放空间，本质上是在用“文件不立刻缩小”换“删除路径更高效、更可控”。

## 参数innodb_file_per_table

表数据既可以存在共享表空间里，也可以是单独的文件。这个行为是由参数innodb_file_per_table控制的：

  1. 这个参数设置为OFF表示的是，表的数据放在系统共享表空间，也就是跟数据字典放在一起；

  2. 这个参数设置为ON表示的是，每个InnoDB表数据存储在一个以 .ibd为后缀的文件中。


从MySQL 5.6.6版本开始，它的默认值就是ON了。

我建议你不论使用MySQL的哪个版本，都将这个值设置为ON。因为，一个表单独存储为一个文件更容易管理，而且在你不需要这个表的时候，通过drop table命令，系统就会直接删除这个文件。而如果是放在共享表空间中，即使表删掉了，空间也是不会回收的。

所以，**将innodb_file_per_table设置为ON，是推荐做法，我们接下来的讨论都是基于这个设置展开的。**

我们在删除整个表的时候，可以使用drop table命令回收表空间。但是，我们遇到的更多的删除数据的场景是删除某些行，这时就遇到了我们文章开头的问题：表中的数据被删除了，但是表空间却没有被回收。

我们要彻底搞明白这个问题的话，就要从数据删除流程说起了。

## 数据删除流程

我们先再来看一下InnoDB中一个索引的示意图。在前面[第4](<https://time.geekbang.org/column/article/69236>)和[第5](<https://time.geekbang.org/column/article/69636>)篇文章中，我和你介绍索引时曾经提到过，InnoDB里的数据都是用B+树的结构组织的。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:560px;width:100%;">
<div style="text-align:center;font-size:14px;font-weight:600;color:var(--d-text);margin-bottom:12px;">图1 B+树索引示意图</div>
<svg viewBox="0 0 560 320" style="width:100%;height:auto;">
<!-- Root node -->
<rect x="210" y="10" width="140" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="280" y="33" text-anchor="middle" font-size="13" font-family="system-ui,sans-serif" fill="var(--d-text)">300 | 600</text>
<!-- Internal nodes -->
<rect x="80" y="80" width="120" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="140" y="103" text-anchor="middle" font-size="13" font-family="system-ui,sans-serif" fill="var(--d-text)">100 | 200</text>
<rect x="360" y="80" width="120" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="420" y="103" text-anchor="middle" font-size="13" font-family="system-ui,sans-serif" fill="var(--d-text)">700 | 900</text>
<!-- Lines from root to internal -->
<line x1="250" y1="46" x2="140" y2="80" stroke="var(--d-border)" stroke-width="1.2"/>
<line x1="310" y1="46" x2="420" y2="80" stroke="var(--d-border)" stroke-width="1.2"/>
<!-- Leaf nodes (data pages) -->
<rect x="10" y="170" width="130" height="100" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="75" y="189" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">Page A</text>
<text x="75" y="208" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R1 (ID=100)</text>
<text x="75" y="224" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R2 (ID=200)</text>
<text x="75" y="240" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R3 (ID=300)</text>
<text x="75" y="256" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text-muted)" text-decoration="line-through">R4 (ID=400) ✕</text>
<rect x="215" y="170" width="130" height="100" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="280" y="189" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">Page B</text>
<text x="280" y="208" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R5 (ID=500)</text>
<text x="280" y="224" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R6 (ID=600)</text>
<rect x="420" y="170" width="130" height="100" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="485" y="189" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">Page C</text>
<text x="485" y="208" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R7 (ID=700)</text>
<text x="485" y="224" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R8 (ID=900)</text>
<!-- Lines from internal to leaf -->
<line x1="110" y1="116" x2="75" y2="170" stroke="var(--d-border)" stroke-width="1.2"/>
<line x1="170" y1="116" x2="280" y2="170" stroke="var(--d-border)" stroke-width="1.2"/>
<line x1="390" y1="116" x2="485" y2="170" stroke="var(--d-border)" stroke-width="1.2"/>
<!-- Leaf links -->
<line x1="140" y1="230" x2="215" y2="230" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3"/>
<line x1="345" y1="230" x2="420" y2="230" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3"/>
<!-- Label -->
<text x="280" y="305" text-anchor="middle" font-size="12" font-family="system-ui,sans-serif" fill="var(--d-text-sub)">叶子节点 = 数据页（Data Pages）</text>
<text x="75" y="284" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-orange)">R4 已标记删除，空间未回收</text>
</svg>
</div>
</div>


假设，我们要删掉R4这个记录，InnoDB引擎只会把R4这个记录标记为删除。如果之后要再插入一个ID在300和600之间的记录时，可能会复用这个位置。但是，磁盘文件的大小并不会缩小。

现在，你已经知道了InnoDB的数据是按页存储的，那么如果我们删掉了一个数据页上的所有记录，会怎么样？

答案是，整个数据页就可以被复用了。

但是，**数据页的复用跟记录的复用是不同的。**

记录的复用，只限于符合范围条件的数据。比如上面的这个例子，R4这条记录被删除后，如果插入一个ID是400的行，可以直接复用这个空间。但如果插入的是一个ID是800的行，就不能复用这个位置了。

而当整个页从B+树里面摘掉以后，可以复用到任何位置。以图1为例，如果将数据页page A上的所有记录删除以后，page A会被标记为可复用。这时候如果要插入一条ID=50的记录需要使用新页的时候，page A是可以被复用的。

如果相邻的两个数据页利用率都很小，系统就会把这两个页上的数据合到其中一个页上，另外一个数据页就被标记为可复用。

进一步地，如果我们用delete命令把整个表的数据删除呢？结果就是，所有的数据页都会被标记为可复用。但是磁盘上，文件不会变小。

你现在知道了，delete命令其实只是把记录的位置，或者数据页标记为了“可复用”，但磁盘文件的大小是不会变的。也就是说，通过delete命令是不能回收表空间的。这些可以复用，而没有被使用的空间，看起来就像是“空洞”。

实际上，**不止是删除数据会造成空洞，插入数据也会。**

如果数据是按照索引递增顺序插入的，那么索引是紧凑的。但如果数据是随机插入的，就可能造成索引的数据页分裂。

假设图1中page A已经满了，这时我要再插入一行数据，会怎样呢？

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:560px;width:100%;">
<div style="text-align:center;font-size:14px;font-weight:600;color:var(--d-text);margin-bottom:12px;">图2 插入数据导致页分裂</div>
<svg viewBox="0 0 560 340" style="width:100%;height:auto;">
<!-- Before: Page A full -->
<text x="130" y="18" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-text-sub)">Before: Page A (已满)</text>
<rect x="30" y="26" width="200" height="120" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="130" y="50" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R1 (ID=100)</text>
<text x="130" y="68" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R3 (ID=300)</text>
<text x="130" y="86" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R4 (ID=500)</text>
<text x="130" y="104" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R5 (ID=600)</text>
<text x="130" y="136" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-muted)">页已满，无法插入</text>
<!-- Insert arrow -->
<text x="280" y="55" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-orange)">插入 ID=550</text>
<line x1="280" y1="62" x2="280" y2="90" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#arrowOrange2)"/>
<text x="280" y="108" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-orange)">触发页分裂 ↓</text>
<defs><marker id="arrowOrange2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker></defs>
<!-- After state -->
<text x="280" y="160" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-text-sub)">After: 页分裂</text>
<!-- Page A after split -->
<rect x="30" y="172" width="200" height="140" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="130" y="192" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">Page A</text>
<text x="130" y="212" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R1 (ID=100)</text>
<text x="130" y="230" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R3 (ID=300)</text>
<text x="130" y="248" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R4 (ID=500)</text>
<!-- Hole -->
<rect x="55" y="258" width="150" height="22" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="4,3"/>
<text x="130" y="274" text-anchor="middle" font-size="11" font-weight="500" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">空洞 (Hole)</text>
<text x="130" y="304" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-muted)">末尾空间未利用</text>
<!-- Page B after split -->
<rect x="330" y="172" width="200" height="120" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
<text x="430" y="192" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-green)">Page B (新页)</text>
<text x="430" y="216" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R4_new (ID=550)</text>
<text x="430" y="236" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text)">R5 (ID=600)</text>
<!-- Arrow between pages -->
<line x1="230" y1="232" x2="330" y2="232" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#arrowGray2)"/>
<defs><marker id="arrowGray2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-border)"/></marker></defs>
</svg>
</div>
</div>


可以看到，由于page A满了，再插入一个ID是550的数据时，就不得不再申请一个新的页面page B来保存数据了。页分裂完成后，page A的末尾就留下了空洞（注意：实际上，可能不止1个记录的位置是空洞）。

另外，更新索引上的值，可以理解为删除一个旧的值，再插入一个新值。不难理解，这也是会造成空洞的。

也就是说，经过大量增删改的表，都是可能是存在空洞的。所以，如果能够把这些空洞去掉，就能达到收缩表空间的目的。

而重建表，就可以达到这样的目的。

## 重建表

试想一下，如果你现在有一个表A，需要做空间收缩，为了把表中存在的空洞去掉，你可以怎么做呢？

你可以新建一个与表A结构相同的表B，然后按照主键ID递增的顺序，把数据一行一行地从表A里读出来再插入到表B中。

由于表B是新建的表，所以表A主键索引上的空洞，在表B中就都不存在了。显然地，表B的主键索引更紧凑，数据页的利用率也更高。如果我们把表B作为临时表，数据从表A导入表B的操作完成后，用表B替换A，从效果上看，就起到了收缩表A空间的作用。

这里，你可以使用alter table A engine=InnoDB命令来重建表。在MySQL 5.5版本之前，这个命令的执行流程跟我们前面描述的差不多，区别只是这个临时表B不需要你自己创建，MySQL会自动完成转存数据、交换表名、删除旧表的操作。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:560px;width:100%;">
<div style="text-align:center;font-size:14px;font-weight:600;color:var(--d-text);margin-bottom:12px;">图3 改锁表DDL（MySQL 5.5 之前的 DDL 流程）</div>
<svg viewBox="0 0 560 220" style="width:100%;height:auto;">
<defs>
<marker id="arrowBlue3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue)"/></marker>
<marker id="arrowGreen3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)"/></marker>
</defs>
<!-- Lock icon -->
<rect x="0" y="0" width="560" height="220" rx="8" fill="none" stroke="var(--d-warn-border)" stroke-width="1.5" stroke-dasharray="6,4"/>
<text x="280" y="20" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">🔒 整个过程表被锁定，不允许 DML 操作</text>
<!-- Table A -->
<rect x="30" y="50" width="140" height="130" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="100" y="72" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">Table A (原表)</text>
<text x="100" y="94" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行</text>
<text x="100" y="110" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行</text>
<rect x="55" y="120" width="90" height="18" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="3,2"/>
<text x="100" y="134" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">空洞</text>
<text x="100" y="156" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行</text>
<rect x="55" y="160" width="90" height="14" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="3,2"/>
<text x="100" y="172" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">空洞</text>
<!-- Arrow 1 -->
<line x1="170" y1="105" x2="220" y2="105" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#arrowBlue3)"/>
<text x="195" y="98" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-blue)">逐行</text>
<text x="195" y="120" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-blue)">拷贝</text>
<!-- tmp_table -->
<rect x="220" y="50" width="140" height="130" rx="5" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
<text x="290" y="72" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-cur-text)">tmp_table</text>
<text x="290" y="90" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-sub)">(Server 层临时表)</text>
<text x="290" y="112" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行 (紧凑)</text>
<text x="290" y="128" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行 (紧凑)</text>
<text x="290" y="144" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行 (紧凑)</text>
<text x="290" y="166" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-green)">无空洞 ✓</text>
<!-- Arrow 2 -->
<line x1="360" y1="105" x2="410" y2="105" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#arrowGreen3)"/>
<text x="385" y="98" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-green)">交换</text>
<text x="385" y="120" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-green)">表名</text>
<!-- Result -->
<rect x="410" y="50" width="130" height="130" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
<text x="475" y="72" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-green)">Table A (新)</text>
<text x="475" y="94" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行 (紧凑)</text>
<text x="475" y="110" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行 (紧凑)</text>
<text x="475" y="126" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据行 (紧凑)</text>
<text x="475" y="150" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-green)">空间已回收 ✓</text>
<!-- Bottom note -->
<text x="280" y="208" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text-muted)">整个过程需要锁表，耗时较长</text>
</svg>
</div>
</div>


显然，花时间最多的步骤是往临时表插入数据的过程，如果在这个过程中，有新的数据要写入到表A的话，就会造成数据丢失。因此，在整个DDL过程中，表A中不能有更新。也就是说，这个DDL不是Online的。

而在**MySQL 5.6版本开始引入的Online DDL，对这个操作流程做了优化。**

我给你简单描述一下引入了Online DDL之后，重建表的流程：

  1. 建立一个临时文件，扫描表A主键的所有数据页；

  2. 用数据页中表A的记录生成B+树，存储到临时文件中；

  3. 生成临时文件的过程中，将所有对A的操作记录在一个日志文件（row log）中，对应的是图中state2的状态；

  4. 临时文件生成后，将日志文件中的操作应用到临时文件，得到一个逻辑数据上与表A相同的数据文件，对应的就是图中state3的状态；

  5. 用临时文件替换表A的数据文件。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:560px;width:100%;">
<div style="text-align:center;font-size:14px;font-weight:600;color:var(--d-text);margin-bottom:12px;">图4 Online DDL（MySQL 5.6+ Online DDL 流程）</div>
<svg viewBox="0 0 560 360" style="width:100%;height:auto;">
<defs>
<marker id="arrowB4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue)"/></marker>
<marker id="arrowG4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)"/></marker>
</defs>
<!-- State 1 -->
<rect x="10" y="10" width="160" height="70" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="90" y="30" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">State 1: 获取锁</text>
<text x="90" y="48" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">获取 MDL 写锁</text>
<text x="90" y="64" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">→ 降级为 MDL 读锁</text>
<line x1="170" y1="45" x2="200" y2="45" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arrowB4)"/>
<!-- State 2 -->
<rect x="200" y="10" width="165" height="70" rx="5" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
<text x="282" y="30" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-cur-text)">State 2: 拷贝数据</text>
<text x="282" y="48" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">扫描 Table A → tmp_file</text>
<text x="282" y="64" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">记录变更到 row log</text>
<line x1="365" y1="45" x2="395" y2="45" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arrowB4)"/>
<!-- State 3 -->
<rect x="395" y="10" width="155" height="70" rx="5" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
<text x="472" y="30" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-cur-text)">State 3: 应用日志</text>
<text x="472" y="48" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">将 row log 应用</text>
<text x="472" y="64" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">到 tmp_file</text>
<!-- DML allowed indicator -->
<rect x="200" y="90" width="350" height="24" rx="4" fill="var(--d-green)" opacity="0.12"/>
<text x="375" y="107" text-anchor="middle" font-size="11" font-weight="500" font-family="system-ui,sans-serif" fill="var(--d-green)">✓ State 2 ~ 3 期间允许 DML 操作（增删改）</text>
<!-- Detailed flow below -->
<!-- Table A -->
<rect x="20" y="140" width="140" height="110" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="90" y="162" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">Table A</text>
<text x="90" y="180" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">数据页 + 空洞</text>
<text x="90" y="196" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">主键索引</text>
<rect x="45" y="205" width="90" height="16" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="3,2"/>
<text x="90" y="217" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">空洞</text>
<text x="90" y="242" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-muted)">(InnoDB 引擎内部)</text>
<!-- Arrow to tmp_file -->
<line x1="160" y1="190" x2="210" y2="190" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arrowB4)"/>
<text x="185" y="183" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-blue)">扫描</text>
<!-- tmp_file -->
<rect x="210" y="140" width="140" height="110" rx="5" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
<text x="280" y="162" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-cur-text)">tmp_file</text>
<text x="280" y="180" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">(InnoDB 内部临时文件)</text>
<text x="280" y="196" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">紧凑 B+ 树</text>
<text x="280" y="216" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-green)">无空洞 ✓</text>
<!-- Row log -->
<rect x="400" y="140" width="140" height="70" rx="5" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.5"/>
<text x="470" y="162" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-engine-text)">Row Log</text>
<text x="470" y="180" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">记录拷贝期间</text>
<text x="470" y="196" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text)">的 DML 操作</text>
<!-- Arrow from row log to tmp_file -->
<line x1="400" y1="195" x2="350" y2="205" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#arrowG4)"/>
<text x="385" y="218" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="var(--d-green)">回放</text>
<!-- State 4 -->
<rect x="130" y="280" width="300" height="40" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
<text x="280" y="305" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-blue)">State 4: 用 tmp_file 替换 Table A 的数据文件</text>
<line x1="280" y1="250" x2="280" y2="280" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arrowB4)"/>
<!-- Bottom label -->
<text x="280" y="345" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="var(--d-text-muted)">整个过程在 InnoDB 内部完成 = inplace</text>
</svg>
</div>
</div>


可以看到，与图3过程的不同之处在于，由于日志文件记录和重放操作这个功能的存在，这个方案在重建表的过程中，允许对表A做增删改操作。这也就是Online DDL名字的来源。

我记得有同学在第6篇讲表锁的文章[《全局锁和表锁 ：给表加个字段怎么索这么多阻碍？》](<https://time.geekbang.org/column/article/69862>)的评论区留言说，DDL之前是要拿MDL写锁的，这样还能叫Online DDL吗？

确实，图4的流程中，alter语句在启动的时候需要获取MDL写锁，但是这个写锁在真正拷贝数据之前就退化成读锁了。

为什么要退化呢？为了实现Online，MDL读锁不会阻塞增删改操作。

那为什么不干脆直接解锁呢？为了保护自己，禁止其他线程对这个表同时做DDL。

而对于一个大表来说，Online DDL最耗时的过程就是拷贝数据到临时表的过程，这个步骤的执行期间可以接受增删改操作。所以，相对于整个DDL过程来说，锁的时间非常短。对业务来说，就可以认为是Online的。

需要补充说明的是，上述的这些重建方法都会扫描原表数据和构建临时文件。对于很大的表来说，这个操作是很消耗IO和CPU资源的。因此，如果是线上服务，你要很小心地控制操作时间。如果想要比较安全的操作的话，我推荐你使用GitHub开源的gh-ost来做。

## Online 和 inplace

说到Online，我还要再和你澄清一下它和另一个跟DDL有关的、容易混淆的概念inplace的区别。

你可能注意到了，在图3中，我们把表A中的数据导出来的存放位置叫作tmp_table。这是一个临时表，是在server层创建的。

在图4中，根据表A重建出来的数据是放在“tmp_file”里的，这个临时文件是InnoDB在内部创建出来的。整个DDL过程都在InnoDB内部完成。对于server层来说，没有把数据挪动到临时表，是一个“原地”操作，这就是“inplace”名称的来源。

所以，我现在问你，如果你有一个1TB的表，现在磁盘间是1.2TB，能不能做一个inplace的DDL呢？

答案是不能。因为，tmp_file也是要占用临时空间的。

我们重建表的这个语句alter table t engine=`InnoDB`，其实隐含的意思是：

```sql
alter table t engine=innodb,ALGORITHM=inplace;
```


跟inplace对应的就是拷贝表的方式了，用法是：

```sql
alter table t engine=innodb,ALGORITHM=copy;
```


当你使用ALGORITHM=copy的时候，表示的是强制拷贝表，对应的流程就是图3的操作过程。

但我这样说你可能会觉得，inplace跟Online是不是就是一个意思？

其实不是的，只是在重建表这个逻辑中刚好是这样而已。

比如，如果我要给InnoDB表的一个字段加全文索引，写法是：

```sql
alter table t add FULLTEXT(field_name);
```


这个过程是inplace的，但会阻塞增删改操作，是非Online的。

如果说这两个逻辑之间的关系是什么的话，可以概括为：

  1. DDL过程如果是Online的，就一定是inplace的；

  2. 反过来未必，也就是说inplace的DDL，有可能不是Online的。截止到MySQL 8.0，添加全文索引（FULLTEXT index）和空间索引(SPATIAL index)就属于这种情况。


最后，我们再延伸一下。

在第10篇文章[《MySQL为什么有时候会选错索引》](<https://time.geekbang.org/column/article/71173>)的评论区中，有同学问到使用optimize table、analyze table和alter table这三种方式重建表的区别。这里，我顺便再简单和你解释一下。

- 从MySQL 5.6版本开始，alter table t engine = `InnoDB`（也就是recreate）默认的就是上面图4的流程了；
- analyze table t 其实不是重建表，只是对表的索引信息做重新统计，没有修改数据，这个过程中加了MDL读锁；
- optimize table t 等于recreate+analyze。


## 小结

今天这篇文章，我和你讨论了数据库中收缩表空间的方法。

现在你已经知道了，如果要收缩一个表，只是delete掉表里面不用的数据的话，表文件的大小是不会变的，你还要通过alter table命令重建表，才能达到表文件变小的目的。我跟你介绍了重建表的两种实现方式，Online DDL的方式是可以考虑在业务低峰期使用的，而MySQL 5.5及之前的版本，这个命令是会阻塞DML的，这个你需要特别小心。

最后，又到了我们的课后问题时间。

假设现在有人碰到了一个“想要收缩表空间，结果适得其反”的情况，看上去是这样的：

  1. 一个表t文件大小为1TB；

  2. 对这个表执行 alter table t engine=`InnoDB`；

  3. 发现执行完成后，空间不仅没变小，还稍微大了一点儿，比如变成了1.01TB。


你觉得可能是什么原因呢 ？

你可以把你觉得可能的原因写在留言区里，我会在下一篇文章的末尾把大家描述的合理的原因都列出来，以后其他同学就不用掉到这样的坑里了。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

## 上期问题时间

在上期文章最后，我留给你的问题是，如果一个高配的机器，redo log设置太小，会发生什么情况。

每次事务提交都要写redo log，如果设置太小，很快就会被写满，也就是下面这个图的状态，这个“环”将很快被写满，write pos一直追着CP。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:560px;width:100%;">
<div style="text-align:center;font-size:14px;font-weight:600;color:var(--d-text);margin-bottom:12px;">Redo Log 环形缓冲区（设置过小时）</div>
<svg viewBox="0 0 360 320" style="width:100%;height:auto;">
<defs>
<marker id="arrowRedo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker>
</defs>
<!-- Outer ring -->
<circle cx="180" cy="150" r="100" fill="none" stroke="var(--d-border)" stroke-width="18" opacity="0.15"/>
<!-- Used portion (almost full circle) - from checkpoint to write_pos -->
<circle cx="180" cy="150" r="100" fill="none" stroke="var(--d-orange)" stroke-width="18" opacity="0.3"
  stroke-dasharray="596 628" stroke-dashoffset="0" transform="rotate(-85 180 150)"/>
<!-- Small free gap -->
<circle cx="180" cy="150" r="100" fill="none" stroke="var(--d-green)" stroke-width="18" opacity="0.25"
  stroke-dasharray="32 628" stroke-dashoffset="0" transform="rotate(-85 180 150)"/>
<!-- write_pos marker -->
<circle cx="180" cy="50" r="8" fill="var(--d-orange)" stroke="var(--d-bg)" stroke-width="2"/>
<text x="180" y="30" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-orange)">write pos</text>
<!-- checkpoint marker (very close to write_pos) -->
<circle cx="160" cy="52" r="8" fill="var(--d-green)" stroke="var(--d-bg)" stroke-width="2"/>
<text x="110" y="38" text-anchor="middle" font-size="11" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-green)">checkpoint</text>
<!-- Arrow showing direction -->
<path d="M 275 120 A 100 100 0 0 1 260 190" fill="none" stroke="var(--d-text-muted)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#arrowRedo)"/>
<text x="300" y="160" text-anchor="start" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-muted)">写入方向</text>
<!-- Center labels -->
<text x="180" y="135" text-anchor="middle" font-size="12" font-weight="600" font-family="system-ui,sans-serif" fill="var(--d-text)">Redo Log</text>
<text x="180" y="155" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-sub)">ib_logfile_0</text>
<text x="180" y="172" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-text-sub)">ib_logfile_1</text>
<!-- Warning annotation -->
<rect x="60" y="270" width="240" height="40" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
<text x="180" y="288" text-anchor="middle" font-size="11" font-weight="500" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">write pos 追上 checkpoint</text>
<text x="180" y="304" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="var(--d-warn-text)">必须停下来刷脏页，导致性能下跌</text>
</svg>
</div>
</div>


这时，你看到的现象就是**磁盘压力很小，但是数据库出现间歇性的性能下跌。**

评论区留言点赞板：

> @某、人 给了一个形象的描述，而且提到了，在这种情况下，连change buffer的优化也失效了。因为checkpoint一直要往前推，这个操作就会触发merge操作，然后又进一步地触发刷脏页操作；  
>  有几个同学提到了内存淘汰脏页，对应的redo log的操作，这个我们会在后面的文章中展开，大家可以先看一下 @melon 同学的描述了解一下；  
>  @算不出流源 提到了“动态平衡”，其实只要出现了这种“平衡”，意味着本应该后台的操作，就已经影响了业务应用，属于有损失的平衡。
