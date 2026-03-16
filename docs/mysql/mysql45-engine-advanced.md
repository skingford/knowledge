---
title: "MySQL 实战 45 讲：引擎与进阶"
description: "极客时间《MySQL 实战 45 讲》—— 引擎与进阶章节笔记整理"
---

# MySQL 实战 45 讲：引擎与进阶

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

## 38. 都说 InnoDB 好，那还要不要使用 Memory 引擎？

<!-- image:  -->

我在上一篇文章末尾留给你的问题是：两个group by 语句都用了order by null，为什么使用内存临时表得到的语句结果里，0这个值在最后一行；而使用磁盘临时表得到的结果里，0这个值在第一行？

今天我们就来看看，出现这个问题的原因吧。

# 内存表的数据组织结构

为了便于分析，我来把这个问题简化一下，假设有以下的两张表t1 和 t2，其中表t1使用Memory 引擎， 表t2使用InnoDB引擎。
    
    
    create table t1(id int primary key, c int) engine=Memory;
    create table t2(id int primary key, c int) engine=innodb;
    insert into t1 values(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(0,0);
    insert into t2 values(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(0,0);
    

然后，我分别执行select * from t1和select * from t2。

<!-- image:  -->

图1 两个查询结果-0的位置

可以看到，内存表t1的返回结果里面0在最后一行，而InnoDB表t2的返回结果里0在第一行。

出现这个区别的原因，要从这两个引擎的主键索引的组织方式说起。

表t2用的是InnoDB引擎，它的主键索引id的组织方式，你已经很熟悉了：InnoDB表的数据就放在主键索引树上，主键索引是B+树。所以表t2的数据组织方式如下图所示：

<!-- image:  -->

图2 表t2的数据组织

主键索引上的值是有序存储的。在执行select *的时候，就会按照叶子节点从左到右扫描，所以得到的结果里，0就出现在第一行。

与InnoDB引擎不同，Memory引擎的数据和索引是分开的。我们来看一下表t1中的数据内容。

<!-- image:  -->

图3 表t1 的数据组织

可以看到，内存表的数据部分以数组的方式单独存放，而主键id索引里，存的是每个数据的位置。主键id是hash索引，可以看到索引上的key并不是有序的。

在内存表t1中，当我执行select *的时候，走的是全表扫描，也就是顺序扫描这个数组。因此，0就是最后一个被读到，并放入结果集的数据。

可见，InnoDB和Memory引擎的数据组织方式是不同的：

  * InnoDB引擎把数据放在主键索引上，其他索引上保存的是主键id。这种方式，我们称之为**索引组织表** （Index Organizied Table）。
  * 而Memory引擎采用的是把数据单独存放，索引上保存数据位置的数据组织形式，我们称之为**堆组织表** （Heap Organizied Table）。


从中我们可以看出，这两个引擎的一些典型不同：

  1. InnoDB表的数据总是有序存放的，而内存表的数据就是按照写入顺序存放的；

  2. 当数据文件有空洞的时候，InnoDB表在插入新数据的时候，为了保证数据有序性，只能在固定的位置写入新值，而内存表找到空位就可以插入新值；

  3. 数据位置发生变化的时候，InnoDB表只需要修改主键索引，而内存表需要修改所有索引；

  4. InnoDB表用主键索引查询时需要走一次索引查找，用普通索引查询的时候，需要走两次索引查找。而内存表没有这个区别，所有索引的“地位”都是相同的。

  5. InnoDB支持变长数据类型，不同记录的长度可能不同；内存表不支持Blob 和 Text字段，并且即使定义了varchar(N)，实际也当作char(N)，也就是固定长度字符串来存储，因此内存表的每行数据长度相同。


由于内存表的这些特性，每个数据行被删除以后，空出的这个位置都可以被接下来要插入的数据复用。比如，如果要在表t1中执行：
    
    
    delete from t1 where id=5;
    insert into t1 values(10,10);
    select * from t1;
    

就会看到返回结果里，id=10这一行出现在id=4之后，也就是原来id=5这行数据的位置。

需要指出的是，表t1的这个主键索引是哈希索引，因此如果执行范围查询，比如
    
    
    select * from t1 where id<5;
    

是用不上主键索引的，需要走全表扫描。你可以借此再回顾下[第4篇文章](<https://time.geekbang.org/column/article/69236>)的内容。那如果要让内存表支持范围扫描，应该怎么办呢 ？

# hash索引和B-Tree索引

实际上，内存表也是支B-Tree索引的。在id列上创建一个B-Tree索引，SQL语句可以这么写：
    
    
    alter table t1 add index a_btree_index using btree (id);
    

这时，表t1的数据组织形式就变成了这样：

<!-- image:  -->

图4 表t1的数据组织--增加B-Tree索引

新增的这个B-Tree索引你看着就眼熟了，这跟InnoDB的b+树索引组织形式类似。

作为对比，你可以看一下这下面这两个语句的输出：

<!-- image:  -->

图5 使用B-Tree和hash索引查询返回结果对比

可以看到，执行select * from t1 where id<5的时候，优化器会选择B-Tree索引，所以返回结果是0到4。 使用force index强行使用主键id这个索引，id=0这一行就在结果集的最末尾了。

其实，一般在我们的印象中，内存表的优势是速度快，其中的一个原因就是Memory引擎支持hash索引。当然，更重要的原因是，内存表的所有数据都保存在内存，而内存的读写速度总是比磁盘快。

但是，接下来我要跟你说明，为什么我不建议你在生产环境上使用内存表。这里的原因主要包括两个方面：

  1. 锁粒度问题；

  2. 数据持久化问题。


# 内存表的锁

我们先来说说内存表的锁粒度问题。

内存表不支持行锁，只支持表锁。因此，一张表只要有更新，就会堵住其他所有在这个表上的读写操作。

需要注意的是，这里的表锁跟之前我们介绍过的MDL锁不同，但都是表级的锁。接下来，我通过下面这个场景，跟你模拟一下内存表的表级锁。

<!-- image:  -->

图6 内存表的表锁--复现步骤

在这个执行序列里，session A的update语句要执行50秒，在这个语句执行期间session B的查询会进入锁等待状态。session C的show processlist 结果输出如下：

<!-- image:  -->

图7 内存表的表锁--结果

跟行锁比起来，表锁对并发访问的支持不够好。所以，内存表的锁粒度问题，决定了它在处理并发事务的时候，性能也不会太好。

# 数据持久性问题

接下来，我们再看看数据持久性的问题。

数据放在内存中，是内存表的优势，但也是一个劣势。因为，数据库重启的时候，所有的内存表都会被清空。

你可能会说，如果数据库异常重启，内存表被清空也就清空了，不会有什么问题啊。但是，在高可用架构下，内存表的这个特点简直可以当做bug来看待了。为什么这么说呢？

**我们先看看M-S架构下，使用内存表存在的问题。**

<!-- image:  -->

图8 M-S基本架构

我们来看一下下面这个时序：

  1. 业务正常访问主库；

  2. 备库硬件升级，备库重启，内存表t1内容被清空；

  3. 备库重启后，客户端发送一条update语句，修改表t1的数据行，这时备库应用线程就会报错“找不到要更新的行”。


这样就会导致主备同步停止。当然，如果这时候发生主备切换的话，客户端会看到，表t1的数据“丢失”了。

在图8中这种有proxy的架构里，大家默认主备切换的逻辑是由数据库系统自己维护的。这样对客户端来说，就是“网络断开，重连之后，发现内存表数据丢失了”。

你可能说这还好啊，毕竟主备发生切换，连接会断开，业务端能够感知到异常。

但是，接下来内存表的这个特性就会让使用现象显得更“诡异”了。由于MySQL知道重启之后，内存表的数据会丢失。所以，担心主库重启之后，出现主备不一致，MySQL在实现上做了这样一件事儿：在数据库重启之后，往binlog里面写入一行DELETE FROM t1。

**如果你使用是如图9所示的双M结构的话：**

<!-- image:  -->

图9 双M结构

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
    
    
    create temporary table temp_t(id int primary key, a int, b int, index(b))engine=innodb;
    insert into temp_t select * from t2 where b>=1 and b<=2000;
    select * from t1 join temp_t on (t1.b=temp_t.b);
    

了解了内存表的特性，你就知道了， 其实这里使用内存临时表的效果更好，原因有三个：

  1. 相比于InnoDB表，使用内存表不需要写磁盘，往表temp_t的写数据的速度更快；

  2. 索引b使用hash索引，查找的速度比B-Tree索引快；

  3. 临时表数据只有2000行，占用的内存有限。


因此，你可以对[第35篇文章](<https://time.geekbang.org/column/article/80147>)的语句序列做一个改写，将临时表t1改成内存临时表，并且在字段b上创建一个hash索引。
    
    
    create temporary table temp_t(id int primary key, a int, b int, index (b))engine=memory;
    insert into temp_t select * from t2 where b>=1 and b<=2000;
    select * from t1 join temp_t on (t1.b=temp_t.b);
    

<!-- image:  -->

图10 使用内存临时表的执行效果

可以看到，不论是导入数据的时间，还是执行join的时间，使用内存临时表的速度都比使用InnoDB临时表要更快一些。

# 小结

今天这篇文章，我从“要不要使用内存表”这个问题展开，和你介绍了Memory引擎的几个特性。

可以看到，由于重启会丢数据，如果一个备库重启，会导致主备同步线程停止；如果主库跟这个备库是双M架构，还可能导致主库的内存表数据被删掉。

因此，在生产上，我不建议你使用普通内存表。

如果你是DBA，可以在建表的审核系统中增加这类规则，要求业务改用InnoDB表。我们在文中也分析了，其实InnoDB表性能还不错，而且数据安全也有保障。而内存表由于不支持行锁，更新语句会阻塞查询，性能也未必就如想象中那么好。

基于内存表的特性，我们还分析了它的一个适用场景，就是内存临时表。内存表支持hash索引，这个特性利用起来，对复杂查询的加速效果还是很不错的。

最后，我给你留一个问题吧。

假设你刚刚接手的一个数据库上，真的发现了一个内存表。备库重启之后肯定是会导致备库的内存表数据被清空，进而导致主备同步停止。这时，最好的做法是将它修改成InnoDB引擎表。

假设当时的业务场景暂时不允许你修改引擎，你可以加上什么自动化逻辑，来避免主备同步停止呢？

你可以把你的思考和分析写在评论区，我会在下一篇文章的末尾跟你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

今天文章的正文内容，已经回答了我们上期的问题，这里就不再赘述了。

评论区留言点赞板：

> @老杨同志、@poppy、@长杰 这三位同学给出了正确答案，春节期间还持续保持跟进学习，给你们点赞。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

Long

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

  * <!-- image:  -->

放

[__ 1](<javascript:;>)

老师新年快乐！过年都不忘给我们传授知识！ 

2019-02-08

__ 作者回复

新年快乐🤝

2019-02-08

  * <!-- image:  -->

于家鹏

[__ 1](<javascript:;>)

新年好！  
课后作业：在备库配置跳过该内存表的主从同步。  
  
有一个问题一直困扰着我：SSD以及云主机的广泛运用，像Innodb这种使用WAL技术似乎并不能发挥最大性能（我的理解：基于SSD的WAL更多的只是起到队列一样削峰填谷的作用）。对于一些数据量不是特别大，但读写频繁的应用（比如点赞、积分），有没有更好的引擎推荐。 

2019-02-08

__ 作者回复

即使是SSD，顺序写也比随机写快些的。 不过确实没有机械盘那么明显。  


2019-02-08

  * <!-- image:  -->

长杰

[__ 0](<javascript:;>)

内存表一般数据量不大，并且更新不频繁，可以写一个定时任务，定期检测内存表的数据，如果数据不空，就将它持久化到一个innodb同结构的表中，如果为空，就反向将数据写到内存表中，这些操作可设置为不写入binlog。 

2019-02-09

  * <!-- image:  -->

往事随风，顺其自然

[__ 0](<javascript:;>)

为什么memory 引擎中数据按照数组单独存储，0索引对应的数据怎么放到数组的最后 

2019-02-09

__ 作者回复

这就是堆组织表的数据存放方式

2019-02-09

  * <!-- image:  -->

HuaMax

[__ 0](<javascript:;>)

课后题。是不是可以加上创建表的操作，并且是innodb 类型的？ 

2019-02-09

  * <!-- image:  -->

老杨同志

[__ 0](<javascript:;>)

安装之前学的知识，把主库delete语句的gtid，设置到从库中，就可以跳过这条语句了吧。  
但是主备不一致是不是要也处理一下，将主库的内存表数据备份一下。然后delete数据，重新插入。  
等备件执行者两个语句后，主备应该都有数据了 

2019-02-08

__ 作者回复

题目里说的是 “备库重启”哈

2019-02-09

---

## 39. 自增主键为什么不是连续的？

<!-- image:  -->

在[第4篇文章](<https://time.geekbang.org/column/article/69236>)中，我们提到过自增主键，由于自增主键可以让主键索引尽量地保持递增顺序插入，避免了页分裂，因此索引更紧凑。

之前我见过有的业务设计依赖于自增主键的连续性，也就是说，这个设计假设自增主键是连续的。但实际上，这样的假设是错的，因为自增主键不能保证连续递增。

今天这篇文章，我们就来说说这个问题，看看什么情况下自增主键会出现 “空洞”？

为了便于说明，我们创建一个表t，其中id是自增主键字段、c是唯一索引。
    
    
    CREATE TABLE `t` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `c` int(11) DEFAULT NULL,
      `d` int(11) DEFAULT NULL,
      PRIMARY KEY (`id`),
      UNIQUE KEY `c` (`c`)
    ) ENGINE=InnoDB;
    

# 自增值保存在哪儿？

在这个空表t里面执行insert into t values(null, 1, 1);插入一行数据，再执行show create table命令，就可以看到如下图所示的结果：

<!-- image:  -->

图1 自动生成的AUTO_INCREMENT值

可以看到，表定义里面出现了一个AUTO_INCREMENT=2，表示下一次插入数据时，如果需要自动生成自增值，会生成id=2。

其实，这个输出结果容易引起这样的误解：自增值是保存在表结构定义里的。实际上，**表的结构定义存放在后缀名为.frm的文件中，但是并不会保存自增值。**

不同的引擎对于自增值的保存策略不同。

  * MyISAM引擎的自增值保存在数据文件中。
  * InnoDB引擎的自增值，其实是保存在了内存里，并且到了MySQL 8.0版本后，才有了“自增值持久化”的能力，也就是才实现了“如果发生重启，表的自增值可以恢复为MySQL重启前的值”，具体情况是： 
    * 在MySQL 5.7及之前的版本，自增值保存在内存里，并没有持久化。每次重启后，第一次打开表的时候，都会去找自增值的最大值max(id)，然后将max(id)+1作为这个表当前的自增值。﻿  
举例来说，如果一个表当前数据行里最大的id是10，AUTO_INCREMENT=11。这时候，我们删除id=10的行，AUTO_INCREMENT还是11。但如果马上重启实例，重启后这个表的AUTO_INCREMENT就会变成10。﻿  
也就是说，MySQL重启可能会修改一个表的AUTO_INCREMENT的值。
    * 在MySQL 8.0版本，将自增值的变更记录在了redo log中，重启的时候依靠redo log恢复重启之前的值。


理解了MySQL对自增值的保存策略以后，我们再看看自增值修改机制。

# 自增值修改机制

在MySQL里面，如果字段id被定义为AUTO_INCREMENT，在插入一行数据的时候，自增值的行为如下：

  1. 如果插入数据时id字段指定为0、null 或未指定值，那么就把这个表当前的 AUTO_INCREMENT值填到自增字段；

  2. 如果插入数据时id字段指定了具体的值，就直接使用语句里指定的值。


根据要插入的值和当前自增值的大小关系，自增值的变更结果也会有所不同。假设，某次要插入的值是X，当前的自增值是Y。

  1. 如果X
  2. 如果X≥Y，就需要把当前自增值修改为新的自增值。


**新的自增值生成算法是** ：从auto_increment_offset开始，以auto_increment_increment为步长，持续叠加，直到找到第一个大于X的值，作为新的自增值。

其中，auto_increment_offset 和 auto_increment_increment是两个系统参数，分别用来表示自增的初始值和步长，默认值都是1。

> 备注：在一些场景下，使用的就不全是默认值。比如，双M的主备结构里要求双写的时候，我们就可能会设置成auto_increment_increment=2，让一个库的自增id都是奇数，另一个库的自增id都是偶数，避免两个库生成的主键发生冲突。

当auto_increment_offset和auto_increment_increment都是1的时候，新的自增值生成逻辑很简单，就是：

  1. 如果准备插入的值>=当前自增值，新的自增值就是“准备插入的值+1”；

  2. 否则，自增值不变。


这就引入了我们文章开头提到的问题，在这两个参数都设置为1的时候，自增主键id却不能保证是连续的，这是什么原因呢？

# 自增值的修改时机

要回答这个问题，我们就要看一下自增值的修改时机。

假设，表t里面已经有了(1,1,1)这条记录，这时我再执行一条插入数据命令：
    
    
    insert into t values(null, 1, 1); 
    

这个语句的执行流程就是：

  1. 执行器调用InnoDB引擎接口写入一行，传入的这一行的值是(0,1,1);

  2. InnoDB发现用户没有指定自增id的值，获取表t当前的自增值2；

  3. 将传入的行的值改成(2,1,1);

  4. 将表的自增值改成3；

  5. 继续执行插入数据操作，由于已经存在c=1的记录，所以报Duplicate key error，语句返回。


对应的执行流程图如下：

<!-- image:  -->

图2 insert(null, 1,1)唯一键冲突

可以看到，这个表的自增值改成3，是在真正执行插入数据的操作之前。这个语句真正执行的时候，因为碰到唯一键c冲突，所以id=2这一行并没有插入成功，但也没有将自增值再改回去。

所以，在这之后，再插入新的数据行时，拿到的自增id就是3。也就是说，出现了自增主键不连续的情况。

如图3所示就是完整的演示结果。

<!-- image:  -->

图3 一个自增主键id不连续的复现步骤

可以看到，这个操作序列复现了一个自增主键id不连续的现场(没有id=2的行）。可见，**唯一键冲突是导致自增主键id不连续的第一种原因。**

同样地，事务**回滚也会产生类似的现象，这就是第二种原因。**

下面这个语句序列就可以构造不连续的自增id，你可以自己验证一下。
    
    
    insert into t values(null,1,1);
    begin;
    insert into t values(null,2,2);
    rollback;
    insert into t values(null,2,2);
    //插入的行是(3,2,2)
    

你可能会问，为什么在出现唯一键冲突或者回滚的时候，MySQL没有把表t的自增值改回去呢？如果把表t的当前自增值从3改回2，再插入新数据的时候，不就可以生成id=2的一行数据了吗？

其实，MySQL这么设计是为了提升性能。接下来，我就跟你分析一下这个设计思路，看看**自增值为什么不能回退。**

假设有两个并行执行的事务，在申请自增值的时候，为了避免两个事务申请到相同的自增id，肯定要加锁，然后顺序申请。

  1. 假设事务A申请到了id=2， 事务B申请到id=3，那么这时候表t的自增值是4，之后继续执行。

  2. 事务B正确提交了，但事务A出现了唯一键冲突。

  3. 如果允许事务A把自增id回退，也就是把表t的当前自增值改回2，那么就会出现这样的情况：表里面已经有id=3的行，而当前的自增id值是2。

  4. 接下来，继续执行的其他事务就会申请到id=2，然后再申请到id=3。这时，就会出现插入语句报错“主键冲突”。


而为了解决这个主键冲突，有两种方法：

  1. 每次申请id之前，先判断表里面是否已经存在这个id。如果存在，就跳过这个id。但是，这个方法的成本很高。因为，本来申请id是一个很快的操作，现在还要再去主键索引树上判断id是否存在。

  2. 把自增id的锁范围扩大，必须等到一个事务执行完成并提交，下一个事务才能再申请自增id。这个方法的问题，就是锁的粒度太大，系统并发能力大大下降。


可见，这两个方法都会导致性能问题。造成这些麻烦的罪魁祸首，就是我们假设的这个“允许自增id回退”的前提导致的。

因此，InnoDB放弃了这个设计，语句执行失败也不回退自增id。也正是因为这样，所以才只保证了自增id是递增的，但不保证是连续的。

# 自增锁的优化

可以看到，自增id锁并不是一个事务锁，而是每次申请完就马上释放，以便允许别的事务再申请。其实，在MySQL 5.1版本之前，并不是这样的。

接下来，我会先给你介绍下自增锁设计的历史，这样有助于你分析接下来的一个问题。

在MySQL 5.0版本的时候，自增锁的范围是语句级别。也就是说，如果一个语句申请了一个表自增锁，这个锁会等语句执行结束以后才释放。显然，这样设计会影响并发度。

MySQL 5.1.22版本引入了一个新策略，新增参数innodb_autoinc_lock_mode，默认值是1。

  1. 这个参数的值被设置为0时，表示采用之前MySQL 5.0版本的策略，即语句执行结束后才释放锁；

  2. 这个参数的值被设置为1时：

     * 普通insert语句，自增锁在申请之后就马上释放；
     * 类似insert … select这样的批量插入数据的语句，自增锁还是要等语句结束后才被释放；
  3. 这个参数的值被设置为2时，所有的申请自增主键的动作都是申请后就释放锁。


你一定有两个疑问：**为什么默认设置下，insert … select 要使用语句级的锁？为什么这个参数的默认值不是2？**

答案是，这么设计还是为了数据的一致性。

我们一起来看一下这个场景：

<!-- image:  -->

图4 批量插入数据的自增锁

在这个例子里，我往表t1中插入了4行数据，然后创建了一个相同结构的表t2，然后两个session同时执行向表t2中插入数据的操作。

你可以设想一下，如果session B是申请了自增值以后马上就释放自增锁，那么就可能出现这样的情况：

  * session B先插入了两个记录，(1,1,1)、(2,2,2)；
  * 然后，session A来申请自增id得到id=3，插入了（3,5,5)；
  * 之后，session B继续执行，插入两条记录(4,3,3)、 (5,4,4)。


你可能会说，这也没关系吧，毕竟session B的语义本身就没有要求表t2的所有行的数据都跟session A相同。

是的，从数据逻辑上看是对的。但是，如果我们现在的binlog_format=statement，你可以设想下，binlog会怎么记录呢？

由于两个session是同时执行插入数据命令的，所以binlog里面对表t2的更新日志只有两种情况：要么先记session A的，要么先记session B的。

但不论是哪一种，这个binlog拿去从库执行，或者用来恢复临时实例，备库和临时实例里面，session B这个语句执行出来，生成的结果里面，id都是连续的。这时，这个库就发生了数据不一致。

你可以分析一下，出现这个问题的原因是什么？

其实，这是因为原库session B的insert语句，生成的id不连续。这个不连续的id，用statement格式的binlog来串行执行，是执行不出来的。

而要解决这个问题，有两种思路：

  1. 一种思路是，让原库的批量插入数据语句，固定生成连续的id值。所以，自增锁直到语句执行结束才释放，就是为了达到这个目的。

  2. 另一种思路是，在binlog里面把插入数据的操作都如实记录进来，到备库执行的时候，不再依赖于自增主键去生成。这种情况，其实就是innodb_autoinc_lock_mode设置为2，同时binlog_format设置为row。


因此，**在生产上，尤其是有insert … select这种批量插入数据的场景时，从并发插入数据性能的角度考虑，我建议你这样设置：innodb_autoinc_lock_mode=2 ，并且 binlog_format=row**.这样做，既能提升并发性，又不会出现数据一致性问题。

需要注意的是，我这里说的**批量插入数据，包含的语句类型是insert … select、replace … select和load data语句。**

但是，在普通的insert语句里面包含多个value值的情况下，即使innodb_autoinc_lock_mode设置为1，也不会等语句执行完成才释放锁。因为这类语句在申请自增id的时候，是可以精确计算出需要多少个id的，然后一次性申请，申请完成后锁就可以释放了。

也就是说，批量插入数据的语句，之所以需要这么设置，是因为“不知道要预先申请多少个id”。

既然预先不知道要申请多少个自增id，那么一种直接的想法就是需要一个时申请一个。但如果一个select … insert语句要插入10万行数据，按照这个逻辑的话就要申请10万次。显然，这种申请自增id的策略，在大批量插入数据的情况下，不但速度慢，还会影响并发插入的性能。

因此，对于批量插入数据的语句，MySQL有一个批量申请自增id的策略：

  1. 语句执行过程中，第一次申请自增id，会分配1个；

  2. 1个用完以后，这个语句第二次申请自增id，会分配2个；

  3. 2个用完以后，还是这个语句，第三次申请自增id，会分配4个；

  4. 依此类推，同一个语句去申请自增id，每次申请到的自增id个数都是上一次的两倍。


举个例子，我们一起看看下面的这个语句序列：
    
    
    insert into t values(null, 1,1);
    insert into t values(null, 2,2);
    insert into t values(null, 3,3);
    insert into t values(null, 4,4);
    create table t2 like t;
    insert into t2(c,d) select c,d from t;
    insert into t2 values(null, 5,5);
    

insert…select，实际上往表t2中插入了4行数据。但是，这四行数据是分三次申请的自增id，第一次申请到了id=1，第二次被分配了id=2和id=3， 第三次被分配到id=4到id=7。

由于这条语句实际只用上了4个id，所以id=5到id=7就被浪费掉了。之后，再执行insert into t2 values(null, 5,5)，实际上插入的数据就是（8,5,5)。

**这是主键id出现自增id不连续的第三种原因。**

# 小结

今天，我们从“自增主键为什么会出现不连续的值”这个问题开始，首先讨论了自增值的存储。

在MyISAM引擎里面，自增值是被写在数据文件上的。而在InnoDB中，自增值是被记录在内存的。MySQL直到8.0版本，才给InnoDB表的自增值加上了持久化的能力，确保重启前后一个表的自增值不变。

然后，我和你分享了在一个语句执行过程中，自增值改变的时机，分析了为什么MySQL在事务回滚的时候不能回收自增id。

MySQL 5.1.22版本开始引入的参数innodb_autoinc_lock_mode，控制了自增值申请时的锁范围。从并发性能的角度考虑，我建议你将其设置为2，同时将binlog_format设置为row。我在前面的文章中其实多次提到，binlog_format设置为row，是很有必要的。今天的例子给这个结论多了一个理由。

最后，我给你留一个思考题吧。

在最后一个例子中，执行insert into t2(c,d) select c,d from t;这个语句的时候，如果隔离级别是可重复读（repeatable read），binlog_format=statement。这个语句会对表t的所有记录和间隙加锁。

你觉得为什么需要这么做呢？

你可以把你的思考和分析写在评论区，我会在下一篇文章和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

上期的问题是，如果你维护的MySQL系统里有内存表，怎么避免内存表突然丢数据，然后导致主备同步停止的情况。

我们假设的是主库暂时不能修改引擎，那么就把备库的内存表引擎先都改成InnoDB。对于每个内存表，执行
    
    
    set sql_log_bin=off;
    alter table tbl_name engine=innodb;
    

这样就能避免备库重启的时候，数据丢失的问题。

由于主库重启后，会往binlog里面写“delete from tbl_name”，这个命令传到备库，备库的同名的表数据也会被清空。

因此，就不会出现主备同步停止的问题。

如果由于主库异常重启，触发了HA，这时候我们之前修改过引擎的备库变成了主库。而原来的主库变成了新备库，在新备库上把所有的内存表（这时候表里没数据）都改成InnoDB表。

所以，如果我们不能直接修改主库上的表引擎，可以配置一个自动巡检的工具，在备库上发现内存表就把引擎改了。

同时，跟业务开发同学约定好建表规则，避免创建新的内存表。

评论区留言点赞板：

> 大家在春节期间还坚持看专栏，并且深入地思考和回复，给大家点赞。  
>  @长杰 同学提到的将数据保存到InnoDB表用来持久化，也是一个方法。不过，我还是建议釜底抽薪，直接修改备库的内存表的引擎。  
>  @老杨同志 提到的是主库异常重启的场景，这时候是不会报主备不一致的，因为主库重启的时候写了delete from tbl_name，主备的内存表都清空了。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

长杰

[__ 6](<javascript:;>)

在最后一个例子中，执行 insert into t2(c,d) select c,d from t; 这个语句的时候，如果隔离级别是可重复读（repeatable read），binlog_format=statement。这个语句会对表 t 的所有记录和间隙加锁。  
你觉得为什么需要这么做呢？  
假如原库不对t表所有记录和间隙加锁，如果有其他事物新增数据并先与这个批量操作提交，由于事物的隔离级别是可重复读，t2是看不到新增的数据的。但是记录的binlog是statement格式，备库或基于binlog恢复的临时库，t2会看到新增的数据，出现数据不一致的情况。 

2019-02-11

__ 作者回复

👍 这是一个典型的场景

2019-02-11

  * <!-- image:  -->

aliang

[__ 1](<javascript:;>)

老师，我们这边有的开发不喜欢用mysql自带的主键自增功能，而是在程序中控制主键（时间+业务+机器+序列，bigint类型，实际长度有17位，其中序列保存在内存中，每次递增，主键值不连续）。理由是  
（1）通过这样的主键可以直接定位数据，减少索引（2）如果自增，必须先存数据得到主键才可继续下面的程序，如果自己计算主键，可以在入库前进行异步处理  
（3）a表要insert得到主键，然后处理b表，然后根据条件还要update a表。如果程序自己控制，就不用先insert a表，数据可以在内存中，直到最后一次提交。（对于a表，本来是insert+update，最后只是一条insert，少一次数据库操作）  
我想请问的是：  
（1）针对理由1，是否可以用组合索引替代？  
（2）针对理由2，是否mysql自身的主键自增分配逻辑就已经能实现了？  
（3）针对理由3，主键更长意味着更大的索引（主键索引和普通索引），你觉得怎样做会更好呢 

2019-02-12

__ 作者回复

“（时间+业务+机器+序列，bigint类型，实际长度有17位，其中序列保存在内存中，每次递增，主键值不连续）。” ----bigint就是8位，这个你需要确定一下。如果是8位的还好，如果是17位的字符串，就比较耗费空间；  
  
（1）如果“序列”是递增的，还是不能直接用来体现业务逻辑吧？ 创建有业务意义的字段索引估计还是省不了的 ？  
（2）mysql确实做不到“插入之前就先算好接下来的id是多少”，一般都是insert执行完成后，再执行select last_insert_id  
(3) 先insert a再update b再update a，确实看上去比较奇怪，不过感觉这个逻辑应该是可以优化的，不应该作为“主键选择”的一个依据。你可否脱敏一下，把模拟的表结构和业务逻辑说下，看看是不是可以优化的。  
  
总之，按照你说的“时间+业务+机器+序列”这种模式，有点像用uuid，主要的问题还是，如果这个表的索引多，占用的空间比较大

2019-02-12

  * <!-- image:  -->

进阶的码农

[__ 0](<javascript:;>)

上期问题解答，有点疑问  
set sql_log_bin=off;  
alter table tbl_name engine=innodb;  
  
为什么备库需要执行set sql_log_bin=off这一句  
把表的引擎改成innodb不就能解决重启后内存表被删除的问题吗？  


2019-03-12

  * <!-- image:  -->

进阶的码农

[__ 0](<javascript:;>)

课后题  
在最后一个例子中，执行 insert into t2(c,d) select c,d from t; 这个语句的时候，如果隔离级别是可重复读（repeatable read），binlog_format=statement会加记录锁和间隙锁。啥我的binlog_format=row也加锁了 

2019-03-12

  * <!-- image:  -->

hetiu

[__ 0](<javascript:;>)

老师，请问下innodb_autoinc_lock_mode配置是库级别的还是实例级别的？ 

2019-03-05

__ 作者回复

全局的

2019-03-06

  * <!-- image:  -->

二十四桥仍在

[__ 0](<javascript:;>)

UUID生成主键 

2019-03-05

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/JKKWS6TzhncvAA0p0NDiaATPIvMicSM76vNAg9IG1ibibcJYPAiaicYjZfq4gAV8GRtcTpOibfRD8vzqHBtL0ibmhwQsbg/132)

唐名之

[__ 0](<javascript:;>)

老师，如果我业务场景必须需要一个带有序自增值，设业务为表A，另外添加一张表记录自增为表B，表B包含3个字段（自增主键，表A唯一键，自增列）；伪代码如下；这样能实现吗？或者有其他什么好的方案？  
begin；  
insert into A values（字段1, 唯一键）；  
insert into B value (表A唯一键，自增列)；  
commit； 

2019-02-25

__ 作者回复

这样思路上是ok的，  
  
不过表b怎么有两个自增列？一个表只能有一个自增列。  


2019-02-25

  * <!-- image:  -->

AstonPutting

[__ 0](<javascript:;>)

老师，innodb_autoinc_lock_mode = 2，binlog_format = statement 不也会出现数据不一致的问题吗？不是很理解 binlog_format = statement 的情况下，1 与 2 的区别。 

2019-02-21

__ 作者回复

innodb_autoinc_lock_mode = 2的时候就要binlog_format = row才好

2019-02-21

  * <!-- image:  -->

Ryoma

[__ 0](<javascript:;>)

在8.0.3版本后，innodb_autoinc_lock_mode默认值已是2，在binlog_format默认值为row的前提下，想来也是为了增加并发。   
  
https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_autoinc_lock_mode 

2019-02-14

__ 作者回复

👍 大势所趋😆

2019-02-16

  * <!-- image:  -->

帽子掉了

[__ 0](<javascript:;>)

老师您好，我有一个时序问题，想请教一下。  
从这篇文章的介绍来看，获取自增id和写binlog是有先后顺序的。  
那么在binlog为statement的情况下。  
语句A先获取id=1，然后B获取id=2，接着B提交，写binlog，再A写binlog。  
这个时候如果binlog重放，是不是会发生B的id为1，而A的id为2的不一致的情况？ 

2019-02-13

__ 作者回复

好问题，不会  
因为binlog在记录这种带自增值的语句之前，会在前面多一句，用于指定“接下来这个语句要需要的 自增ID值是多少”，而这个值，是在主库上这一行插入成功后对应的自增值，所以是一致的

2019-02-14

  * <!-- image:  -->

郭烊千玺

[__ 0](<javascript:;>)

请教老师个额外话题 select concat(truncate(sum(data_length)/1024/1024,2),'MB') as data_size,  
concat(truncate(sum(max_data_length)/1024/1024,2),'MB') as max_data_size,  
concat(truncate(sum(data_free)/1024/1024,2),'MB') as data_free,  
concat(truncate(sum(index_length)/1024/1024,2),'MB') as index_size  
from information_schema.tables where TABLE_SCHEMA = 'databasename'; 网上广为流传的这个统计的表大小的方法准确吗 mysql内部是怎么统计的？并且data_free这个mydql内部又是怎么统计的 是采样8个页来评估整表吗 并且实验总感觉这样统计不准啊 到底靠谱吗 求赐教求赐教啊 困惑好久了 

2019-02-12

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Nr8o80t7TVwlXk7eoFYQpknWiayM5NbWKSf4DicTmYxGSoKoUwNurxjvDflgpZu6I9ChWdNr14gbABgq1ibP2cvWg/132)

悟空

[__ 0](<javascript:;>)

赶上了进度，把春节期间的补回来了 

2019-02-12

__ 作者回复

👍

2019-02-12

  * <!-- image:  -->

we

[__ 0](<javascript:;>)

insert into t values(null,1,1);  
begin;  
insert into t values(null,2,2);  
rolllack;  
insert into t values(null,2,2);  
// 插入的行是 (3,2,2)  
  
老师 里面是 rollback 吧 

2019-02-12

__ 作者回复

是的，我手残了。。  
  
多谢指出，发起勘误了哈  


2019-02-12

  * <!-- image:  -->

牛在天上飞

[__ 0](<javascript:;>)

老师，请问产生大量的event事件会对mysql服务器有什么影响？主要是哪几个方面的影响？ 

2019-02-12

__ 作者回复

也没啥，主要就是不好管理。。  
毕竟event是写在MySQL里的，写程序的同学不一定会记得。  
比较建议将这类逻辑写在应用程序里面

2019-02-12

  * <!-- image:  -->

aliang

[__ 0](<javascript:;>)

老师，执行SELECT `ID`, `USER`, `HOST`, `DB`, `COMMAND`, `TIME`, `STATE`, LEFT(`INFO`, 51200) AS `Info` FROM `information_schema`.`PROCESSLIST`;后不时有COMMAND为killed但info为null的进程，请问是怎么回事呢 

2019-02-11

__ 作者回复

就表示还在“killed”状态，看一下32篇哈

2019-02-11

  * <!-- image:  -->

陈华应

[__ 0](<javascript:;>)

防止insert语句执行过程中，原表有新增数据，进而导致的插入新表的数据比原表少 

2019-02-11

__ 作者回复

确实是考虑并发 , 不过并不会有这个现象哦，因为一个语句执行期间还是有一致性视图的。  
  
把binlog加进去考虑下哈  


2019-02-11

---

## 40. insert 语句的锁为什么这么多？

<!-- image:  -->

在上一篇文章中，我提到MySQL对自增主键锁做了优化，尽量在申请到自增id以后，就释放自增锁。

因此，insert语句是一个很轻量的操作。不过，这个结论对于“普通的insert语句”才有效。也就是说，还有些insert语句是属于“特殊情况”的，在执行过程中需要给其他资源加锁，或者无法在申请到自增id以后就立马释放自增锁。

那么，今天这篇文章，我们就一起来聊聊这个话题。

# insert … select 语句

我们先从昨天的问题说起吧。表t和t2的表结构、初始化数据语句如下，今天的例子我们还是针对这两个表展开。
    
    
    CREATE TABLE `t` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `c` int(11) DEFAULT NULL,
      `d` int(11) DEFAULT NULL,
      PRIMARY KEY (`id`),
      UNIQUE KEY `c` (`c`)
    ) ENGINE=InnoDB;
    
    insert into t values(null, 1,1);
    insert into t values(null, 2,2);
    insert into t values(null, 3,3);
    insert into t values(null, 4,4);
    
    create table t2 like t
    

现在，我们一起来看看为什么在可重复读隔离级别下，binlog_format=statement时执行：
    
    
    insert into t2(c,d) select c,d from t;
    

这个语句时，需要对表t的所有行和间隙加锁呢？

其实，这个问题我们需要考虑的还是日志和数据的一致性。我们看下这个执行序列：

<!-- image:  -->

图1 并发insert场景

实际的执行效果是，如果session B先执行，由于这个语句对表t主键索引加了(-∞,1]这个next-key lock，会在语句执行完成后，才允许session A的insert语句执行。

但如果没有锁的话，就可能出现session B的insert语句先执行，但是后写入binlog的情况。于是，在binlog_format=statement的情况下，binlog里面就记录了这样的语句序列：
    
    
    insert into t values(-1,-1,-1);
    insert into t2(c,d) select c,d from t;
    

这个语句到了备库执行，就会把id=-1这一行也写到表t2中，出现主备不一致。

# insert 循环写入

当然了，执行insert … select 的时候，对目标表也不是锁全表，而是只锁住需要访问的资源。

如果现在有这么一个需求：要往表t2中插入一行数据，这一行的c值是表t中c值的最大值加1。

此时，我们可以这么写这条SQL语句 ：
    
    
    insert into t2(c,d)  (select c+1, d from t force index(c) order by c desc limit 1);
    

这个语句的加锁范围，就是表t索引c上的(3,4]和(4,supremum]这两个next-key lock，以及主键索引上id=4这一行。

它的执行流程也比较简单，从表t中按照索引c倒序，扫描第一行，拿到结果写入到表t2中。

因此整条语句的扫描行数是1。

这个语句执行的慢查询日志（slow log），如下图所示：

<!-- image:  -->

图2 慢查询日志--将数据插入表t2

通过这个慢查询日志，我们看到Rows_examined=1，正好验证了执行这条语句的扫描行数为1。

那么，如果我们是要把这样的一行数据插入到表t中的话：
    
    
    insert into t(c,d)  (select c+1, d from t force index(c) order by c desc limit 1);
    

语句的执行流程是怎样的？扫描行数又是多少呢？

这时候，我们再看慢查询日志就会发现不对了。

<!-- image:  -->

图3 慢查询日志--将数据插入表t

可以看到，这时候的Rows_examined的值是5。

我在前面的文章中提到过，希望你都能够学会用explain的结果来“脑补”整条语句的执行过程。今天，我们就来一起试试。

如图4所示就是这条语句的explain结果。

<!-- image:  -->

图4 explain结果

从Extra字段可以看到“Using temporary”字样，表示这个语句用到了临时表。也就是说，执行过程中，需要把表t的内容读出来，写入临时表。

图中rows显示的是1，我们不妨先对这个语句的执行流程做一个猜测：如果说是把子查询的结果读出来（扫描1行），写入临时表，然后再从临时表读出来（扫描1行），写回表t中。那么，这个语句的扫描行数就应该是2，而不是5。

所以，这个猜测不对。实际上，Explain结果里的rows=1是因为受到了limit 1 的影响。

从另一个角度考虑的话，我们可以看看InnoDB扫描了多少行。如图5所示，是在执行这个语句前后查看Innodb_rows_read的结果。

<!-- image:  -->

图5 查看 Innodb_rows_read变化

可以看到，这个语句执行前后，Innodb_rows_read的值增加了4。因为默认临时表是使用Memory引擎的，所以这4行查的都是表t，也就是说对表t做了全表扫描。

这样，我们就把整个执行过程理清楚了：

  1. 创建临时表，表里有两个字段c和d。

  2. 按照索引c扫描表t，依次取c=4、3、2、1，然后回表，读到c和d的值写入临时表。这时，Rows_examined=4。

  3. 由于语义里面有limit 1，所以只取了临时表的第一行，再插入到表t中。这时，Rows_examined的值加1，变成了5。


也就是说，这个语句会导致在表t上做全表扫描，并且会给索引c上的所有间隙都加上共享的next-key lock。所以，这个语句执行期间，其他事务不能在这个表上插入数据。

至于这个语句的执行为什么需要临时表，原因是这类一边遍历数据，一边更新数据的情况，如果读出来的数据直接写回原表，就可能在遍历过程中，读到刚刚插入的记录，新插入的记录如果参与计算逻辑，就跟语义不符。

由于实现上这个语句没有在子查询中就直接使用limit 1，从而导致了这个语句的执行需要遍历整个表t。它的优化方法也比较简单，就是用前面介绍的方法，先insert into到临时表temp_t，这样就只需要扫描一行；然后再从表temp_t里面取出这行数据插入表t1。

当然，由于这个语句涉及的数据量很小，你可以考虑使用内存临时表来做这个优化。使用内存临时表优化时，语句序列的写法如下：
    
    
    create temporary table temp_t(c int,d int) engine=memory;
    insert into temp_t  (select c+1, d from t force index(c) order by c desc limit 1);
    insert into t select * from temp_t;
    drop table temp_t;
    

# insert 唯一键冲突

前面的两个例子是使用insert … select的情况，接下来我要介绍的这个例子就是最常见的insert语句出现唯一键冲突的情况。

对于有唯一键的表，插入数据时出现唯一键冲突也是常见的情况了。我先给你举一个简单的唯一键冲突的例子。

<!-- image:  -->

图6 唯一键冲突加锁

这个例子也是在可重复读（repeatable read）隔离级别下执行的。可以看到，session B要执行的insert语句进入了锁等待状态。

也就是说，session A执行的insert语句，发生唯一键冲突的时候，并不只是简单地报错返回，还在冲突的索引上加了锁。我们前面说过，一个next-key lock就是由它右边界的值定义的。这时候，session A持有索引c上的(5,10]共享next-key lock（读锁）。

至于为什么要加这个读锁，其实我也没有找到合理的解释。从作用上来看，这样做可以避免这一行被别的事务删掉。

这里[官方文档](<https://dev.mysql.com/doc/refman/8.0/en/innodb-locks-set.html>)有一个描述错误，认为如果冲突的是主键索引，就加记录锁，唯一索引才加next-key lock。但实际上，这两类索引冲突加的都是next-key lock。

> 备注：这个bug，是我在写这篇文章查阅文档时发现的，已经[发给官方](<https://bugs.mysql.com/bug.php?id=93806>)并被verified了。

有同学在前面文章的评论区问到，在有多个唯一索引的表中并发插入数据时，会出现死锁。但是，由于他没有提供复现方法或者现场，我也无法做分析。所以，我建议你在评论区发问题的时候，尽量同时附上复现方法，或者现场信息，这样我才好和你一起分析问题。

这里，我就先和你分享一个经典的死锁场景，如果你还遇到过其他唯一键冲突导致的死锁场景，也欢迎给我留言。

<!-- image:  -->

图7 唯一键冲突--死锁

在session A执行rollback语句回滚的时候，session C几乎同时发现死锁并返回。

这个死锁产生的逻辑是这样的：

  1. 在T1时刻，启动session A，并执行insert语句，此时在索引c的c=5上加了记录锁。注意，这个索引是唯一索引，因此退化为记录锁（如果你的印象模糊了，可以回顾下[第21篇文章](<https://time.geekbang.org/column/article/75659>)介绍的加锁规则）。

  2. 在T2时刻，session B要执行相同的insert语句，发现了唯一键冲突，加上读锁；同样地，session C也在索引c上，c=5这一个记录上，加了读锁。

  3. T3时刻，session A回滚。这时候，session B和session C都试图继续执行插入操作，都要加上写锁。两个session都要等待对方的行锁，所以就出现了死锁。


这个流程的状态变化图如下所示。

<!-- image:  -->

图8 状态变化图--死锁

# insert into … on duplicate key update

上面这个例子是主键冲突后直接报错，如果是改写成
    
    
    insert into t values(11,10,10) on duplicate key update d=100; 
    

的话，就会给索引c上(5,10] 加一个排他的next-key lock（写锁）。

**insert into … on duplicate key update 这个语义的逻辑是，插入一行数据，如果碰到唯一键约束，就执行后面的更新语句。**

注意，如果有多个列违反了唯一性约束，就会按照索引的顺序，修改跟第一个索引冲突的行。

现在表t里面已经有了(1,1,1)和(2,2,2)这两行，我们再来看看下面这个语句执行的效果：

<!-- image:  -->

图9 两个唯一键同时冲突

可以看到，主键id是先判断的，MySQL认为这个语句跟id=2这一行冲突，所以修改的是id=2的行。

需要注意的是，执行这条语句的affected rows返回的是2，很容易造成误解。实际上，真正更新的只有一行，只是在代码实现上，insert和update都认为自己成功了，update计数加了1， insert计数也加了1。

# 小结

今天这篇文章，我和你介绍了几种特殊情况下的insert语句。

insert … select 是很常见的在两个表之间拷贝数据的方法。你需要注意，在可重复读隔离级别下，这个语句会给select的表里扫描到的记录和间隙加读锁。

而如果insert和select的对象是同一个表，则有可能会造成循环写入。这种情况下，我们需要引入用户临时表来做优化。

insert 语句如果出现唯一键冲突，会在冲突的唯一值上加共享的next-key lock(S锁)。因此，碰到由于唯一键约束导致报错后，要尽快提交或回滚事务，避免加锁时间过长。

最后，我给你留一个问题吧。

你平时在两个表之间拷贝数据用的是什么方法，有什么注意事项吗？在你的应用场景里，这个方法，相较于其他方法的优势是什么呢？

你可以把你的经验和分析写在评论区，我会在下一篇文章的末尾选取有趣的评论来和你一起分析。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

我们已经在文章中回答了上期问题。

有同学提到，如果在insert … select 执行期间有其他线程操作原表，会导致逻辑错误。其实，这是不会的，如果不加锁，就是快照读。

一条语句执行期间，它的一致性视图是不会修改的，所以即使有其他事务修改了原表的数据，也不会影响这条语句看到的数据。

评论区留言点赞板：

> @长杰 同学回答得非常准确。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

huolang

[__ 8](<javascript:;>)

老师，死锁的例子，关于sessionA拿到的c=5的记录锁，sessionB和sessionC发现唯一键冲突会加上读锁我有几个疑惑：  
1\. sessionA拿到的c=5的记录锁是写锁吗？  
2\. 为什么sessionB和sessionC发现唯一键冲突会加上读锁？  
3\. 如果sessionA拿到c=5的记录所是写锁，那为什么sessionB和sessionC还能加c=5的读锁，写锁和读锁不应该是互斥的吗？  
4\. sessionA还没有提交，为什么sessionB和sessionC能发现唯一键冲突？ 

2019-02-13

__ 作者回复

1\. 是的  
2\. 这个我觉得是为了防止这个记录再被删除（不过这个理由不是很硬，我还没有找到其他解释  
3\. 互斥的，所以这两个语句都在等待。注意next-key lock是由间隙锁和记录锁组成的哦， 间隙锁加成功了的。好问题。  
4\. 还没有提交，但是这个记录已经作为最新记录写进去了，复习一下08篇哈

2019-02-14

  * <!-- image:  -->

老杨同志

[__ 4](<javascript:;>)

课后问题：  
我用的最多还是insert into select 。如果数量比较大，会加上limit 100,000这种。并且看看后面的select条件是否走索引。缺点是会锁select的表。方法二：导出成excel，然后拼sql 成 insert into values(),(),()的形式。方法3，写类似淘宝调动的定时任务，任务的逻辑是查询100条记录，然后多个线程分到几个任务执行，比如是个线程，每个线程10条记录，插入后，在查询新的100条记录处理。  


2019-02-13

__ 作者回复

👍

2019-02-14

  * <!-- image:  -->

sonic

[__ 3](<javascript:;>)

你好，  
我想问下文章中关于为什么需要创建临时表有这一句话：  
如果读出来的数据直接写回原表，就可能在遍历过程中，读到刚刚插入的记录，新插入的记录如果参与计算逻辑，就跟语义不符。  
  
我的疑问是：既然隔离级别是可重复读，照理来说新插入的的记录应该不会参与计算逻辑呀。 

2019-02-14

__ 作者回复

可重复读隔离级别下，事务是可以看到自己刚刚修改的数据的 ，好问题

2019-02-16

  * <!-- image:  -->

滔滔

[__ 2](<javascript:;>)

老师，之前提到的一个有趣的问题"A、B两个用户，如果互相喜欢，则成为好友。设计上是有两张表，一个是like表，一个是friend表，like表有user_id、liker_id两个字段，我设置为复合唯一索引即uk_user_id_liker_id。语句执行顺序是这样的：  
以A喜欢B为例：  
1、先查询对方有没有喜欢自己（B有没有喜欢A）  
select * from like where user_id = B and liker_id = A  
2、如果有，则成为好友  
insert into friend  
3、没有，则只是喜欢关系  
insert into like"，这个问题中如果把select语句改成"当前读"，则当出现A,B两个人同时喜欢对方的情况下，是不是会出现由于"当前读"加的gap锁导致后面insert语句阻塞，从而发生死锁？ 

2019-02-13

__ 作者回复

好问题  
  
这种情况下一般是造成锁等待，不会造成死锁吧 😆

2019-02-14

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJCscgdVibmoPyRLRaicvk6rjTJxePZ6VFHvGjUQvtfhCS6kO4OZ1AVibbhNGKlWZmpEFf2yA6ptsqHw/132)

夹心面包

[__ 2](<javascript:;>)

  
1 关于insert造成死锁的情况,我之前做过测试,事务1并非只有insert,delete和update都可能造成死锁问题,核心还是插入唯一值冲突导致的.我们线上的处理办法是 1 去掉唯一值检测 2减少重复值的插入 3降低并发线程数量  
2 关于数据拷贝大表我建议采用pt-archiver,这个工具能自动控制频率和速度,效果很不错,提议在低峰期进行数据操作 

2019-02-13

__ 作者回复

👍，这两点都是很有用的建议

2019-02-13

  * <!-- image:  -->

王伯轩

[__ 1](<javascript:;>)

老师你好,去年双11碰到了dbcrash掉的情况.至今没有找到答案,心里渗得慌.老师帮忙分析下.   
我是一个开发,关于db的知识更多是在应用和基本原理上面,实在是找不到原因. 我也搜了一些资料 感觉像是mysql的bug,不过在其buglist中没有找到完全一致的，当然也可能是我们业务也许导致库的压力大的原因.   
应用端看到的现象是db没有响应，应用需要访问db的线程全部僵死.db表现是hang住 , 当时的诊断日志如下，表面表现为一直获取不到latch锁（被一个insert线程持有不释放） https://note.youdao.com/ynoteshare1/index.html?id=1771445db3ff1e08cbdd8328ea6765a7&type;=note#/ 隔离级别是rr  
  
同样的crash双11当天后面又出现了一次（哭死）,  
都是重启数据库解决的,  
  
后面应用层面做了一样优化,没有再crash过，优化主要如下：  
1.减小读压力，去除一些不必要的查询，  
2.优化前，有并发事务写和查询同一条数据记录，即事务a执行insert 尚未提交，事务b就来查询（快照读），优化后保证查询时insert事务已经提交 

2019-02-19

__ 作者回复

这就是压力太大了。。 一般伴随着ioutil很大，语句执行特别慢，别的语句就被堵着等锁，等超时就自己crash

2019-02-19

  * <!-- image:  -->

phpzheng-好客旅游网

[__ 1](<javascript:;>)

循环插入数据，然后拿着刚刚插入的主键id，更新数据。请问怎么提高这个情况的效率 

2019-02-15

__ 作者回复

insert以后  
select last_insert_id,  
再update，  
只能这么做啦  
  
如果要快一些，可能可以考虑减少交互，比如写成存储过程

2019-02-16

  * <!-- image:  -->

伟仔_Hoo

[__ 0](<javascript:;>)

老师，看到您的回复，当select c+1, d from t force index(c) order by c desc limit 1;这条语句单独执行是会在c索引上加(4,sup] 这个next key lock, 于是我进行了尝试  
sessionA:   
begin;  
select c+1, d from t3 force index(c) order by c desc limit 1;  
sessionB:  
insert into t3 values(5, 5, 5);  
结果是，sessionB插入成功，是不是我哪里理解错了？我的版本是5.7.23 

2019-03-15

__ 作者回复

session A的select语句没有加 for update 或者 lock in share mode ?

2019-03-16

  * <!-- image:  -->

猫小妖的尾巴

[__ 0](<javascript:;>)

老师，我们的业务中有用到insert …on duplicate key update导致死锁的情况，表是有唯一索引，DBA那边的解释是有唯一索引的insert需要两把锁，事务1先申请X锁成功, 然后申请S锁, 但是事务2正在申请X锁, 与事务1的S锁冲突, 系统决定回滚事务2，然后我就改成先查询存在直接update不存在再用原来的逻辑，不过我感觉还是不太明白，你可以解释一下吗  


2019-03-10

  * <!-- image:  -->

涵涵妈 lilian

[__ 0](<javascript:;>)

老师，能帮忙看下这个死锁记录吗？对于duplicate key插入有什么阻止的好方法？LATEST DETECTED DEADLOCK  
\------------------------  
190222 8:37:45  
*** (1) TRANSACTION:  
TRANSACTION 16FEC1AE, ACTIVE 0 sec inserting  
mysql tables in use 1, locked 1  
LOCK WAIT 6 lock struct(s), heap size 1248, 3 row lock(s)  
MySQL thread id 169973, OS thread handle 0x2ba0fa040700, query id 41915315 10.45.133.181 W59FFHKU  
INSERT INTO resource (  
Id  
, Name  
, Date  
, User  
) VALUES (99127, 'RS_2098185e367d11e9878202a98a7af318', '', 'JR')  
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:  
RECORD LOCKS space id 78 page no 71 n bits 160 index `PRIMARY` of table `resource` trx id 16FEC1AE lock_mode X insert intention waiting  
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0  
0: len 8; hex 73757072656d756d; asc supremum;;  
*** (2) TRANSACTION:  
TRANSACTION 16FEC1AF, ACTIVE 0 sec inserting  
mysql tables in use 1, locked 1  
6 lock struct(s), heap size 1248, 3 row lock(s)  
MySQL thread id 169996, OS thread handle 0x2ba0ffec2700, query id 41915317 10.45.133.181 W59FFHKU  
INSERT INTO resource (  
Id  
, Name  
, Date  
, User  
) VALUES (99125, 'RS_2098b778367d11e9878202a98a7af318', '', 'JR')  
*** (2) HOLDS THE LOCK(S):  
RECORD LOCKS space id 78 page no 71 n bits 160 index `PRIMARY` of table `resource` trx id 16FEC1AF lock mode S  
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0  
0: len 8; hex 73757072656d756d; asc supremum;;  
*** (2) WAITING FOR THIS LOCK TO BE GRANTED:  
RECORD LOCKS space id 78 page no 71 n bits 160 index `PRIMARY` of table `resource` trx id 16FEC1AF lock_mode X insert intention waiting  
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0  
0: len 8; hex 73757072656d756d; asc supremum;;  
*** WE ROLL BACK TRANSACTION (2) 

2019-03-10

  * <!-- image:  -->

涵涵妈 lilian

[__ 0](<javascript:;>)

老师，重复主键插入冲突是否推荐insert ignore方法？ 

2019-03-09

__ 作者回复

这个取决于业务需求，如果是明确会存在这样的情况，并且可以忽略，是可以这么用的

2019-03-09

  * <!-- image:  -->

轻松的鱼

[__ 0](<javascript:;>)

老师好，想请教一下死锁的例子中：  
1\. 在 session A rollback 前，session B/C 都因为唯一性冲突申请了 S Next-key lock，但是被 session A 的 X but not gap lock 阻塞；  
2\. 在 session A rollbak 后，session B/C 顺利获得 S Next-key lock，并且都要继续进行插入，这时候我认为是因为插入意向锁（LOCK_INSERT_INTENTION）导致的死锁，因为插入意向锁会被 gap lock 阻塞，造成了相互等待。还没有进入到记录 X lock。  
不知道我分析的对不对？ 

2019-03-06

  * <!-- image:  -->

张永志

[__ 0](<javascript:;>)

对主键插入加读锁的个人理解，两个会话insert同样记录，在没有提交情况下，insert主键加读锁是为了避免第一个会话回滚后，第二个会话可以正常执行；第一个会话提交后，第二个会话再报错。 

2019-02-28

__ 作者回复

是为了实现这个目的，是吧😀

2019-02-28

  * <!-- image:  -->

Mr.Strive.Z.H.L

[__ 0](<javascript:;>)

老师您好：  
关于文中的锁描述有所疑惑。  
  
文中出现过 共享的next-key锁 和 排他的next-key锁。  
  
我们知道next-key是由 gap lock 和 行锁组成的。  
  
我一直以来的认知是 gap lock都是s锁，没有x锁。  
而行锁有s锁和x锁。  
比如 select………lock in share mode，行锁是s  
锁。  
比如select………for update，行锁就是x锁。  
但是gap lock 始终是s锁。  
  
文中直接描述next-key lock是排他的，总让我认为gap lock和行锁都是x锁。  
  
不知道我理解得对不对？ 

2019-02-27

__ 作者回复

是这样的，gap lock是无所谓S还是X的。  
但是record lock 有。  
  
Gap lock + 排他的record 就称作 排他的next-key lock 吧😄  
  


2019-02-27

  * <!-- image:  -->

滔滔

[__ 0](<javascript:;>)

老师，select c+1, d from t force index(c) order by c desc limit 1;这条语句如果单独执行，是会对表t进行全表加锁，还是只加(3,4],(4,sup]这两个next key锁。还有一个问题，这里为什么要加force index(c)，不加会是怎样的效果呢？🤔 

2019-02-24

__ 作者回复

(4,sup]  
  
以防优化器不走索引，影响我们结论（比如数据量比较小的时候）

2019-02-25

  * <!-- image:  -->

发条橙子 。

[__ 0](<javascript:;>)

老师，年后过来狂补课程了哈哈 ， 看到老师的bug留言已经被fix掉准备在最新版本发布了呢。   
  
这里我有一个疑问， 我之前以为只有更新的时候才会加锁， 参考前面的文章，innodb要先扫描表中数据，被扫描到的行要加锁 。  
  
或者我们执行 select 的时候手动加上 排他锁 或者 共享锁，也会锁住。  
  
这里老师讲到如果索引唯一键冲突， innodb为了做处理加了 next_key lock（S） 这个可以理解。  
  
insert .. select 也是因为有 select 索引会加锁 也可以理解  
  
问题 ：  
  
图7那个死锁的案例， session A 的时候 只是执行了 insert 语句，执行 insert的时候也没有select之类的，为什么也会在索引c上加个锁， 是什么时候加的呢 ？？？ 是 insert 语句有索引的话都会给索引加锁么？？  
  


2019-02-23

__ 作者回复

不是都会，是在要写入的时候，发现有主键冲突，才会加上这个next-key lock的锁

2019-02-23

  * <!-- image:  -->

滔滔

[__ 0](<javascript:;>)

老师，有个问题insert into … on duplicate key update语句在发生冲突的时候是先加next key读锁，然后在执行后面的update语句时再给冲突记录加上写锁，从而把之前加的next key读锁变成了写锁，是这样的吗？ 

2019-02-21

__ 作者回复

不是，发现冲突直接加的就是写锁

2019-02-24

  * <!-- image:  -->

王伯轩

[__ 0](<javascript:;>)

内存锁 大大计划讲下么,实际中碰到内存锁被持有后一直不释放导致db直接crash掉 

2019-02-18

__ 作者回复

这个系列里没讲到了  
  
这种我碰到比较多的是io压力特别大，导致有的事务执行不下去，但是占着锁  
  
然后其他事务就拿不到锁，有一个600计时，超过就crash了

2019-02-18

  * <!-- image:  -->

信信

[__ 0](<javascript:;>)

老师好，文中提到：insert into t2(c,d) (select c+1, d from t force index(c) order by c desc limit 1)的加锁范围是表 t 索引 c 上的 (4,supremum] 这个 next-key lock 和主键索引上 id=4 这一行。  
可是如果我把表t的id为3这行先删除，再执行这个insert...select，那么别的会话执行insert into t values(3,3,3)会被阻塞，这说明4之前也是有间隙锁的？  
另外，select c+1, d from t force index(c) order by c desc limit 1 for update 是不是不能用作等值查询那样分析？因为如果算等值查询，根据优化1是没有间隙锁的。 

2019-02-17

__ 作者回复

你说的对，这里其实是“向左扫描”，加锁范围应该是(3,4] 和 (4, supremum]。  
👍  


2019-02-17

  * <!-- image:  -->

Justin

[__ 0](<javascript:;>)

插入意向锁的gal lock和next key lock中的 gaplock互斥吗？ 

2019-02-15

__ 作者回复

额，  
这里我们要澄清一下哈  
只有一个gap lock，就是 next key lock = gap lock + record lock；  
  
我们说一个insert语句如果要插入一个间隙，而这个间隙上有gap lock的话，insert语句会被堵住，这个被堵住的效果，实现机制上是用插入意向锁和gap lock相互作用来实现的。  
gap lock并不属于插入意向锁的一部分 ，就没有“插入意向锁的gal lock”这个概念哈

2019-02-16

---

## 41. 怎么最快地复制一张表？

<!-- image:  -->

我在上一篇文章最后，给你留下的问题是怎么在两张表中拷贝数据。如果可以控制对源表的扫描行数和加锁范围很小的话，我们简单地使用insert … select 语句即可实现。

当然，为了避免对源表加读锁，更稳妥的方案是先将数据写到外部文本文件，然后再写回目标表。这时，有两种常用的方法。接下来的内容，我会和你详细展开一下这两种方法。

为了便于说明，我还是先创建一个表db1.t，并插入1000行数据，同时创建一个相同结构的表db2.t。
    
    
    create database db1;
    use db1;
    
    create table t(id int primary key, a int, b int, index(a))engine=innodb;
    delimiter ;;
      create procedure idata()
      begin
        declare i int;
        set i=1;
        while(i<=1000)do
          insert into t values(i,i,i);
          set i=i+1;
        end while;
      end;;
    delimiter ;
    call idata();
    
    create database db2;
    create table db2.t like db1.t
    

假设，我们要把db1.t里面a>900的数据行导出来，插入到db2.t中。

# mysqldump方法

一种方法是，使用mysqldump命令将数据导出成一组INSERT语句。你可以使用下面的命令：
    
    
    mysqldump -h$host -P$port -u$user --add-locks=0 --no-create-info --single-transaction  --set-gtid-purged=OFF db1 t --where="a>900" --result-file=/client_tmp/t.sql
    

把结果输出到临时文件。

这条命令中，主要参数含义如下：

  1. –single-transaction的作用是，在导出数据的时候不需要对表db1.t加表锁，而是使用START TRANSACTION WITH CONSISTENT SNAPSHOT的方法；

  2. –add-locks设置为0，表示在输出的文件结果里，不增加" LOCK TABLES `t` WRITE;" ；

  3. –no-create-info的意思是，不需要导出表结构；

  4. –set-gtid-purged=off表示的是，不输出跟GTID相关的信息；

  5. –result-file指定了输出文件的路径，其中client表示生成的文件是在客户端机器上的。


通过这条mysqldump命令生成的t.sql文件中就包含了如图1所示的INSERT语句。

<!-- image:  -->

图1 mysqldump输出文件的部分结果

可以看到，一条INSERT语句里面会包含多个value对，这是为了后续用这个文件来写入数据的时候，执行速度可以更快。

如果你希望生成的文件中一条INSERT语句只插入一行数据的话，可以在执行mysqldump命令时，加上参数–skip-extended-insert。

然后，你可以通过下面这条命令，将这些INSERT语句放到db2库里去执行。
    
    
    mysql -h127.0.0.1 -P13000  -uroot db2 -e "source /client_tmp/t.sql"
    

需要说明的是，source并不是一条SQL语句，而是一个客户端命令。mysql客户端执行这个命令的流程是这样的：

  1. 打开文件，默认以分号为结尾读取一条条的SQL语句；

  2. 将SQL语句发送到服务端执行。


也就是说，服务端执行的并不是这个“source t.sql"语句，而是INSERT语句。所以，不论是在慢查询日志（slow log），还是在binlog，记录的都是这些要被真正执行的INSERT语句。

# 导出CSV文件

另一种方法是直接将结果导出成.csv文件。MySQL提供了下面的语法，用来将查询结果导出到服务端本地目录：
    
    
    select * from db1.t where a>900 into outfile '/server_tmp/t.csv';
    

我们在使用这条语句时，需要注意如下几点。

  1. 这条语句会将结果保存在服务端。如果你执行命令的客户端和MySQL服务端不在同一个机器上，客户端机器的临时目录下是不会生成t.csv文件的。

  2. into outfile指定了文件的生成位置（/server_tmp/），这个位置必须受参数secure_file_priv的限制。参数secure_file_priv的可选值和作用分别是：

     * 如果设置为empty，表示不限制文件生成的位置，这是不安全的设置；
     * 如果设置为一个表示路径的字符串，就要求生成的文件只能放在这个指定的目录，或者它的子目录；
     * 如果设置为NULL，就表示禁止在这个MySQL实例上执行select … into outfile 操作。
  3. 这条命令不会帮你覆盖文件，因此你需要确保/server_tmp/t.csv这个文件不存在，否则执行语句时就会因为有同名文件的存在而报错。

  4. 这条命令生成的文本文件中，原则上一个数据行对应文本文件的一行。但是，如果字段中包含换行符，在生成的文本中也会有换行符。不过类似换行符、制表符这类符号，前面都会跟上“\”这个转义符，这样就可以跟字段之间、数据行之间的分隔符区分开。


得到.csv导出文件后，你就可以用下面的load data命令将数据导入到目标表db2.t中。
    
    
    load data infile '/server_tmp/t.csv' into table db2.t;
    

这条语句的执行流程如下所示。

  1. 打开文件/server_tmp/t.csv，以制表符(\t)作为字段间的分隔符，以换行符（\n）作为记录之间的分隔符，进行数据读取；

  2. 启动事务。

  3. 判断每一行的字段数与表db2.t是否相同：

     * 若不相同，则直接报错，事务回滚；
     * 若相同，则构造成一行，调用InnoDB引擎接口，写入到表中。
  4. 重复步骤3，直到/server_tmp/t.csv整个文件读入完成，提交事务。


你可能有一个疑问，**如果binlog_format=statement，这个load语句记录到binlog里以后，怎么在备库重放呢？**

由于/server_tmp/t.csv文件只保存在主库所在的主机上，如果只是把这条语句原文写到binlog中，在备库执行的时候，备库的本地机器上没有这个文件，就会导致主备同步停止。

所以，这条语句执行的完整流程，其实是下面这样的。

  1. 主库执行完成后，将/server_tmp/t.csv文件的内容直接写到binlog文件中。

  2. 往binlog文件中写入语句load data local infile ‘/tmp/SQL_LOAD_MB-1-0’ INTO TABLE `db2`.`t`。

  3. 把这个binlog日志传到备库。

  4. 备库的apply线程在执行这个事务日志时：  
a. 先将binlog中t.csv文件的内容读出来，写入到本地临时目录/tmp/SQL_LOAD_MB-1-0 中；  
b. 再执行load data语句，往备库的db2.t表中插入跟主库相同的数据。


执行流程如图2所示：

<!-- image:  -->

图2 load data的同步流程

注意，这里备库执行的load data语句里面，多了一个“local”。它的意思是“将执行这条命令的客户端所在机器的本地文件/tmp/SQL_LOAD_MB-1-0的内容，加载到目标表db2.t中”。

也就是说，**load data命令有两种用法** ：

  1. 不加“local”，是读取服务端的文件，这个文件必须在secure_file_priv指定的目录或子目录下；

  2. 加上“local”，读取的是客户端的文件，只要mysql客户端有访问这个文件的权限即可。这时候，MySQL客户端会先把本地文件传给服务端，然后执行上述的load data流程。


另外需要注意的是，**select …into outfile方法不会生成表结构文件** , 所以我们导数据时还需要单独的命令得到表结构定义。mysqldump提供了一个–tab参数，可以同时导出表结构定义文件和csv数据文件。这条命令的使用方法如下：
    
    
    mysqldump -h$host -P$port -u$user ---single-transaction  --set-gtid-purged=OFF db1 t --where="a>900" --tab=$secure_file_priv
    

这条命令会在$secure_file_priv定义的目录下，创建一个t.sql文件保存建表语句，同时创建一个t.txt文件保存CSV数据。

# 物理拷贝方法

前面我们提到的mysqldump方法和导出CSV文件的方法，都是逻辑导数据的方法，也就是将数据从表db1.t中读出来，生成文本，然后再写入目标表db2.t中。

你可能会问，有物理导数据的方法吗？比如，直接把db1.t表的.frm文件和.ibd文件拷贝到db2目录下，是否可行呢？

答案是不行的。

因为，一个InnoDB表，除了包含这两个物理文件外，还需要在数据字典中注册。直接拷贝这两个文件的话，因为数据字典中没有db2.t这个表，系统是不会识别和接受它们的。

不过，在MySQL 5.6版本引入了**可传输表空间**(transportable tablespace)的方法，可以通过导出+导入表空间的方式，实现物理拷贝表的功能。

假设我们现在的目标是在db1库下，复制一个跟表t相同的表r，具体的执行步骤如下：

  1. 执行 create table r like t，创建一个相同表结构的空表；

  2. 执行alter table r discard tablespace，这时候r.ibd文件会被删除；

  3. 执行flush table t for export，这时候db1目录下会生成一个t.cfg文件；

  4. 在db1目录下执行cp t.cfg r.cfg; cp t.ibd r.ibd；这两个命令（这里需要注意的是，拷贝得到的两个文件，MySQL进程要有读写权限）；

  5. 执行unlock tables，这时候t.cfg文件会被删除；

  6. 执行alter table r import tablespace，将这个r.ibd文件作为表r的新的表空间，由于这个文件的数据内容和t.ibd是相同的，所以表r中就有了和表t相同的数据。


至此，拷贝表数据的操作就完成了。这个流程的执行过程图如下：

<!-- image:  -->

图3 物理拷贝表

关于拷贝表的这个流程，有以下几个注意点：

  1. 在第3步执行完flsuh table命令之后，db1.t整个表处于只读状态，直到执行unlock tables命令后才释放读锁；

  2. 在执行import tablespace的时候，为了让文件里的表空间id和数据字典中的一致，会修改r.ibd的表空间id。而这个表空间id存在于每一个数据页中。因此，如果是一个很大的文件（比如TB级别），每个数据页都需要修改，所以你会看到这个import语句的执行是需要一些时间的。当然，如果是相比于逻辑导入的方法，import语句的耗时是非常短的。


# 小结

今天这篇文章，我和你介绍了三种将一个表的数据导入到另外一个表中的方法。

我们来对比一下这三种方法的优缺点。

  1. 物理拷贝的方式速度最快，尤其对于大表拷贝来说是最快的方法。如果出现误删表的情况，用备份恢复出误删之前的临时库，然后再把临时库中的表拷贝到生产库上，是恢复数据最快的方法。但是，这种方法的使用也有一定的局限性：

     * 必须是全表拷贝，不能只拷贝部分数据；
     * 需要到服务器上拷贝数据，在用户无法登录数据库主机的场景下无法使用；
     * 由于是通过拷贝物理文件实现的，源表和目标表都是使用InnoDB引擎时才能使用。
  2. 用mysqldump生成包含INSERT语句文件的方法，可以在where参数增加过滤条件，来实现只导出部分数据。这个方式的不足之一是，不能使用join这种比较复杂的where条件写法。

  3. 用select … into outfile的方法是最灵活的，支持所有的SQL写法。但，这个方法的缺点之一就是，每次只能导出一张表的数据，而且表结构也需要另外的语句单独备份。


后两种方式都是逻辑备份方式，是可以跨引擎使用的。

最后，我给你留下一个思考题吧。

我们前面介绍binlog_format=statement的时候，binlog记录的load data命令是带local的。既然这条命令是发送到备库去执行的，那么备库执行的时候也是本地执行，为什么需要这个local呢？如果写到binlog中的命令不带local，又会出现什么问题呢？

你可以把你的分析写在评论区，我会在下一篇文章的末尾和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

我在上篇文章最后给你留下的思考题，已经在今天这篇文章的正文部分做了回答。

上篇文章的评论区有几个非常好的留言，我在这里和你分享一下。

@huolang 同学提了一个问题：如果sessionA拿到c=5的记录锁是写锁，那为什么sessionB和sessionC还能加c=5的读锁呢？

这是因为next-key lock是先加间隙锁，再加记录锁的。加间隙锁成功了，加记录锁就会被堵住。如果你对这个过程有疑问的话，可以再复习一下[第30篇文章](<https://time.geekbang.org/column/article/78427>)中的相关内容。

@一大只 同学做了一个实验，验证了主键冲突以后，insert语句加间隙锁的效果。比我在上篇文章正文中提的那个回滚导致死锁的例子更直观，体现了他对这个知识点非常好的理解和思考，很赞。

@roaming 同学验证了在MySQL 8.0版本中，已经能够用临时表处理insert … select写入原表的语句了。

@老杨同志 的回答提到了我们本文中说到的几个方法。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

poppy

[__ 4](<javascript:;>)

关于思考题，我理解是备库的同步线程其实相当于备库的一个客户端，由于备库的会把binlog中t.csv的内容写到/tmp/SQL_LOAD_MB-1-0中，如果load data命令不加'local'表示读取服务端的文件，文件必须在secure_file_priv指定的目录或子目录，此时可能找不到该文件，主备同步执行会失败。而加上local的话，表示读取客户端的文件，既然备份线程都能在该目录下创建临时文件/tmp/SQL_LOAD_MB-1-0,必然也有权限访问，把该文件传给服务端执行。 

2019-02-15

__ 作者回复

👍这是其中一个原因

2019-02-16

  * <!-- image:  -->

☆appleう

[__ 3](<javascript:;>)

通知对方更新数据的意思是: 针对事务内的3个操作:插入和更新两个都是本地操作，第三个操作是远程调用，这里远程调用其实是想把本地操作的那两条通知对方(对方:远程调用)，让对方把数据更新，这样双方(我和远程调用方)的数据达到一致，如果对方操作失败，事务的前两个操作也会回滚，主要是想保证双方数据的一致性，因为远程调用可能会出现网络延迟超时等因素，极端情况会导致事务10s左右才能处理完毕，想问的是这样耗时的事务会带来哪些影响呢？  
  
设计的初衷是想这三个操作能原子执行，只要有不成功就可以回滚，保证两方数据的一致性  
  
耗时长的远程调用不放在事务中执行，会出现我这面数据完成了，而对方那面由于网络等问题，并没有更新，这样两方的数据就出现不一致了  
  
  
  


2019-02-15

__ 作者回复

嗯 了解了  
  
这种设计我觉得就是会对并发性有比较大的影响。  
一般如果网络状态不好的，会建议把这个更新操作放到消息队列。  
就是说  
1\. 先本地提交事务。  
2\. 把通知这个动作放到消息队列，失败了可以重试；  
3\. 远端接收事件要设置成可重入的，就是即使同一个消息收到两次，也跟收到一次是相同的效果。  
2 和3 配合起来保证最终一致性。  
  
这种设计我见到得比较多，你评估下是否符合你们业务的需求哈

2019-02-15

  * <!-- image:  -->

undifined

[__ 3](<javascript:;>)

老师，用物理导入的方式执行 alter table r import tablespace 时 提示ERROR 1812 (HY000): Tablespace is missing for table `db1`.`r`. 此时 db1/ 下面的文件有 db.opt r.cfg r.frm r.ibd t.frm t.ibd；这个该怎么处理  
  
执行步骤：  
  
mysql> create table r like t;  
Query OK, 0 rows affected (0.01 sec)  
  
mysql> alter table r discard tablespace;  
Query OK, 0 rows affected (0.01 sec)  
  
mysql> flush table t for export;  
Query OK, 0 rows affected (0.00 sec)  
  
cp t.cfg r.cfg  
cp t.ibd r.ibd  
  
mysql> unlock tables;  
Query OK, 0 rows affected (0.01 sec)  
  
mysql> alter table r import tablespace;  
ERROR 1812 (HY000): Tablespace is missing for table `db1`.`r`.  
  


2019-02-15

__ 作者回复

应该就是评论区其他同学帮忙回复的权限问题了吧？

2019-02-15

  * <!-- image:  -->

lionetes

[__ 2](<javascript:;>)

mysql> select * from t;  
+----+------+  
| id | name |  
+----+------+  
| 1 | Bob |  
| 2 | Mary |  
| 3 | Jane |  
| 4 | Lisa |  
| 5 | Mary |  
| 6 | Jane |  
| 7 | Lisa |  
+----+------+  
7 rows in set (0.00 sec)  
  
mysql> create table tt like t;  
Query OK, 0 rows affected (0.03 sec)  
  
mysql> alter table tt discard tablespace;  
Query OK, 0 rows affected (0.01 sec)  
  
mysql> flush table t for export;  
Query OK, 0 rows affected (0.01 sec)  
  
mysql> unlock tables;  
Query OK, 0 rows affected (0.00 sec)  
  
mysql> alter table tt import tablespace;  
Query OK, 0 rows affected (0.03 sec)  
  
mysql> show tables;  
+----------------+  
| Tables_in_test |  
+----------------+  
| t |  
| t2 |  
| tt |  
+----------------+  
3 rows in set (0.00 sec)  
  
mysql> select * from t;  
+----+------+  
| id | name |  
+----+------+  
| 1 | Bob |  
| 2 | Mary |  
| 3 | Jane |  
| 4 | Lisa |  
| 5 | Mary |  
| 6 | Jane |  
| 7 | Lisa |  
+----+------+  
7 rows in set (0.00 sec)  
  
mysql> select * from tt;  
+----+------+  
| id | name |  
+----+------+  
| 1 | Bob |  
| 2 | Mary |  
| 3 | Jane |  
| 4 | Lisa |  
| 5 | Mary |  
| 6 | Jane |  
| 7 | Lisa |  
+----+------+  
7 rows in set (0.00 sec)  
  
  
  
ll 后 查看 tt.cfg 文件没有自动删除 5.7mysql  
  
-rw-r-----. 1 mysql mysql 380 2月 15 09:51 tt.cfg  
-rw-r-----. 1 mysql mysql 8586 2月 15 09:49 tt.frm  
-rw-r-----. 1 mysql mysql 98304 2月 15 09:51 tt.ibd  


2019-02-15

__ 作者回复

你说得对，👍细致  
  
import动作 不会自动删除cfg文件，我图改一下  


2019-02-15

  * <!-- image:  -->

☆appleう

[__ 2](<javascript:;>)

老师，我想问一个关于事务的问题，一个事务中有3个操作，插入一条数据(本地操作),更新一条数据(本地操作)，然后远程调用，通知对方更新上面数据(如果远程调用失败会重试，最多3次，如果遇到网络等问题，远程调用时间会达到5s,极端情况3次会达到15s)，那么极端情况事务将长达5-15s，这样会带来什么影响吗？ 

2019-02-15

__ 作者回复

“通知对方更新上面数据” 是啥概念，如果你这个事务没提交，其他线程也看不到前两个操作的结果的。  
  
设计上不建议留这么长的事务哈，最好是可以先把事务提交了，再去做耗时的操作。

2019-02-15

  * <!-- image:  -->

AstonPutting

[__ 1](<javascript:;>)

老师，mysqlpump能否在平时代替mysqldump的使用？ 

2019-02-22

__ 作者回复

我觉得是 

2019-02-23

  * <!-- image:  -->

PengfeiWang

[__ 1](<javascript:;>)

老师，您好：  
文中“–add-locks 设置为 0，表示在输出的文件结果里，不增加" LOCK TABLES t WRITE;" 是否是笔误，--add-locks应该是在insert语句前后添加锁，我的理解此处应该是--skip-add-locks，不知道是否是这样？  


2019-02-18

__ 作者回复

嗯嗯，命令中写错了，是--add-locks=0，  
效果上跟--skip-add-locks是一样的哈  
👍细致

2019-02-19

  * <!-- image:  -->

长杰

[__ 1](<javascript:;>)

课后题答案  
不加“local”，是读取服务端的文件，这个文件必须在 secure_file_priv 指定的目录或子目录下；而备库的apply线程执行时先讲csv内容读出生成tmp目录下的临时文件，这个目录容易受secure_file_priv的影响，如果备库改参数设置为Null或指定的目录，可能导致load操作失败，加local则不受这个影响。 

2019-02-17

__ 作者回复

👍

2019-02-18

  * <!-- image:  -->

尘封

[__ 1](<javascript:;>)

老师mysqldump导出的文件里，单条sql里的value值有什么限制吗默认情况下，假如一个表有几百万，那mysql会分为多少个sql导出？  
问题：因为从库可能没有load的权限，所以local 

2019-02-15

__ 作者回复

好问题，  
  
会控制单行不会超过参数net_buffer_length，这个参数是可以通过--net_buffer_length 传给mysqldump 工具的

2019-02-28

  * <!-- image:  -->

佳

[__ 0](<javascript:;>)

老师好，这个/tmp/SQL_LOAD_MB-1-0 是应该在主库上面，还是备库上面？为啥我执行完是在主库上面出现了这个文件呢？  


2019-03-14

__ 作者回复

就是在MySQL的运行进程所在的主机上

2019-03-16

  * <!-- image:  -->

xxj123go

[__ 0](<javascript:;>)

传输表空间方式对主从同步会有影响么 

2019-03-12

__ 作者回复

你可以看下执行以后，进不进binlog 😆

2019-03-13

  * <!-- image:  -->

王显伟

[__ 0](<javascript:;>)

第一位留言的朋友报错我也复现了，原因是用root复制的文件，没有修改属组导致的 

2019-02-16

__ 作者回复

👍

2019-02-17

  * <!-- image:  -->

夜空中最亮的星（华仔）

[__ 0](<javascript:;>)

学习完老师的课都想做dba了 

2019-02-15

  * <!-- image:  -->

undifined

[__ 0](<javascript:;>)

老师 错误信息的截屏 https://www.dropbox.com/s/8wyet4bt9yfjsau/mysqlerror.png?dl=0  
  
MySQL 5.7，Mac 上的 Docker 容器里面跑的，版本是 5.7.17 

2019-02-15

__ 作者回复

额，打不开。。  
  
可否发个微博贴图😅

2019-02-16

  * <!-- image:  -->

晨思暮语

[__ 0](<javascript:;>)

不好意思，第一条留言中，实验三的最后一天语句还是少了，在这里贴一下，  
mysql> select * from t where id=1;  
+----+------+  
| id | a |  
+----+------+  
| 1 | 3 |  
+----+------+  
1 row in set (0.00 sec) 

2019-02-15

  * <!-- image:  -->

晨思暮语

[__ 0](<javascript:;>)

老师好，由于字数限制，分两条：  
我用的是percona数据库，问题是第15章中的思考题。  
根据我做的实验，结论应该是：  
MySQL 调用了 InnoDB 引擎提供的“修改为 (1,2)”这个接口，但是引擎发现值与原来相同，不更新，直接返回  
一直没有想明白，老师再帮忙看看，谢谢！ 

2019-02-15

__ 作者回复

我两个留言连在一起看没看明白你对哪个步骤的哪个结果有疑虑，  
可以写在现象里面（用注释即可）哈

2019-02-16

  * <!-- image:  -->

晨思暮语

[__ 0](<javascript:;>)

  
mysql> select version();  
+------------+  
| version() |  
+------------+  
| 5.7.22-log |  
+------------+  
  
实验1:  
SESSION A:  
mysql> begin;  
Query OK, 0 rows affected (0.00 sec)  
  
mysql> select * from t where id=1;  
+----+------+  
| id | a |  
+----+------+  
| 1 | 2 |  
+----+------+  
1 row in set (0.00 sec)  
  
SESSION B:  
mysql> update t set a=3 where id=1;  
Query OK, 1 row affected (0.01 sec)  
Rows matched: 1 Changed: 1 Warnings: 0  
  
SESSION A:  
mysql> update t set a=3 where id=1;  
Query OK, 0 rows affected (0.00 sec)  
Rows matched: 1 Changed: 0 Warnings: 0  
  
mysql> select * from t where id=1;  
+----+------+  
| id | a |  
+----+------+  
| 1 | 2 |  
+----+------+  
1 row in set (0.00 sec)  
  
实验2:  
SESSION A:  
mysql> begin;  
Query OK, 0 rows affected (0.00 sec)  
  
mysql> select * from t where id=1;  
+----+------+  
| id | a |  
+----+------+  
| 1 | 2 |  
+----+------+  
1 row in set (0.00 sec)  
SESSION B:  
mysql> update t set a=3 where id=1;  
Query OK, 1 row affected (0.00 sec)  
Rows matched: 1 Changed: 1 Warnings: 0  
  
SESSION A:  
mysql> update t set a=3 where id=1;  
BLOCKED  
SESSION B:  
mysql> commit;  
Query OK, 0 rows affected (0.00 sec)  
  
SESSION A:UPDATE  
mysql> update t set a=3 where id=1;  
Query OK, 0 rows affected (5.43 sec)  
Rows matched: 1 Changed: 0 Warnings: 0  
mysql>   
mysql> select * from t where id=1;  
+----+------+  
| id | a |  
+----+------+  
| 1 | 2 |  
+----+------+  
1 row in set (0.00 sec)  
  
实验3:  
SESSION A:  
mysql> begin;  
Query OK, 0 rows affected (0.00 sec)  
  
mysql> select * from t where id=1;  
+----+------+  
| id | a |  
+----+------+  
| 1 | 2 |  
+----+------+  
1 row in set (0.00 sec)  
  
SESSION B:  
mysql> begin;  
Query OK, 0 rows affected (0.00 sec)  
  
mysql> update t set a=3 where id=1;  
Query OK, 1 row affected (0.00 sec)  
Rows matched: 1 Changed: 1 Warnings: 0  
SESSION A:  
mysql> update t set a=3 where id=1;  
blocked  
SESSION B:  
mysql> rollback;  
Query OK, 0 rows affected (0.00 sec)  
  
SESSION A:UPDATE  
mysql> update t set a=3 where id=1;  
Query OK, 1 row affected (5.21 sec)  
Rows matched: 1 C 

2019-02-15

  * <!-- image:  -->

库淘淘

[__ 0](<javascript:;>)

如果不加local 如secure_file_priv 设置为null 或者路径 可能就不能成功,这样加了之后可以保证执行成功率不受参数secure_file_priv影响。 还有发现物理拷贝文件后，权限所属用户还得改下，不然import tablespace 会报错找不到文件，老师是不是应该补充上去，不然容易踩坑。 

2019-02-15

__ 作者回复

嗯嗯，有同学已经踩了，  
我加个说明进去，多谢提醒

2019-02-15

  * <!-- image:  -->

lionetes

[__ 0](<javascript:;>)

@undifined 看下是否是 权限问题引起的 cp 完后 是不是mysql 权限 

2019-02-15

__ 作者回复

👍 经验丰富  
  
如果进程用mysql用户启动，命令行是在root账号下，确实会出现这种情况

2019-02-15

  * <!-- image:  -->

Ryoma

[__ 0](<javascript:;>)

问老师一个主题无关的问题：现有数据库中有个表字段为text类型，但是目前发现text中的数据有点不太对。  
请问在MySQL中有没有办法确认在插入时是否发生截断数据的情况么？（因为该字段被修改过，我现在不方便恢复当时的现场） 

2019-02-15

__ 作者回复

看那个语句的binlog （是row吧？） 😆

2019-02-15

---

## 42. grant 之后要跟着 flush privileges 吗？

<!-- image:  -->

在MySQL里面，grant语句是用来给用户赋权的。不知道你有没有见过一些操作文档里面提到，grant之后要马上跟着执行一个flush privileges命令，才能使赋权语句生效。我最开始使用MySQL的时候，就是照着一个操作文档的说明按照这个顺序操作的。

那么，grant之后真的需要执行flush privileges吗？如果没有执行这个flush命令的话，赋权语句真的不能生效吗？

接下来，我就先和你介绍一下grant语句和flush privileges语句分别做了什么事情，然后再一起来分析这个问题。

为了便于说明，我先创建一个用户：
    
    
    create user 'ua'@'%' identified by 'pa';
    

这条语句的逻辑是创建一个用户’ua’@’%’，密码是pa。注意，在MySQL里面，用户名(user)+地址(host)才表示一个用户，因此 ua@ip1 和 ua@ip2代表的是两个不同的用户。

这条命令做了两个动作：

  1. 磁盘上，往mysql.user表里插入一行，由于没有指定权限，所以这行数据上所有表示权限的字段的值都是N；

  2. 内存里，往数组acl_users里插入一个acl_user对象，这个对象的access字段值为0。


图1就是这个时刻用户ua在user表中的状态。

<!-- image:  -->

图1 mysql.user 数据行

在MySQL中，用户权限是有不同的范围的。接下来，我就按照用户权限范围从大到小的顺序依次和你说明。

# 全局权限

全局权限，作用于整个MySQL实例，这些权限信息保存在mysql库的user表里。如果我要给用户ua赋一个最高权限的话，语句是这么写的：
    
    
    grant all privileges on *.* to 'ua'@'%' with grant option;
    

这个grant命令做了两个动作：

  1. 磁盘上，将mysql.user表里，用户’ua’@’%'这一行的所有表示权限的字段的值都修改为‘Y’；

  2. 内存里，从数组acl_users中找到这个用户对应的对象，将access值（权限位）修改为二进制的“全1”。


在这个grant命令执行完成后，如果有新的客户端使用用户名ua登录成功，MySQL会为新连接维护一个线程对象，然后从acl_users数组里查到这个用户的权限，并将权限值拷贝到这个线程对象中。之后在这个连接中执行的语句，所有关于全局权限的判断，都直接使用线程对象内部保存的权限位。

基于上面的分析我们可以知道：

  1. grant 命令对于全局权限，同时更新了磁盘和内存。命令完成后即时生效，接下来新创建的连接会使用新的权限。

  2. 对于一个已经存在的连接，它的全局权限不受grant命令的影响。


需要说明的是，**一般在生产环境上要合理控制用户权限的范围** 。我们上面用到的这个grant语句就是一个典型的错误示范。如果一个用户有所有权限，一般就不应该设置为所有IP地址都可以访问。

如果要回收上面的grant语句赋予的权限，你可以使用下面这条命令：
    
    
    revoke all privileges on *.* from 'ua'@'%';
    

这条revoke命令的用法与grant类似，做了如下两个动作：

  1. 磁盘上，将mysql.user表里，用户’ua’@’%'这一行的所有表示权限的字段的值都修改为“N”；

  2. 内存里，从数组acl_users中找到这个用户对应的对象，将access的值修改为0。


# db权限

除了全局权限，MySQL也支持库级别的权限定义。如果要让用户ua拥有库db1的所有权限，可以执行下面这条命令：
    
    
    grant all privileges on db1.* to 'ua'@'%' with grant option;
    

基于库的权限记录保存在mysql.db表中，在内存里则保存在数组acl_dbs中。这条grant命令做了如下两个动作：

  1. 磁盘上，往mysql.db表中插入了一行记录，所有权限位字段设置为“Y”；

  2. 内存里，增加一个对象到数组acl_dbs中，这个对象的权限位为“全1”。


图2就是这个时刻用户ua在db表中的状态。

<!-- image:  -->

图2 mysql.db 数据行

每次需要判断一个用户对一个数据库读写权限的时候，都需要遍历一次acl_dbs数组，根据user、host和db找到匹配的对象，然后根据对象的权限位来判断。

也就是说，grant修改db权限的时候，是同时对磁盘和内存生效的。

grant操作对于已经存在的连接的影响，在全局权限和基于db的权限效果是不同的。接下来，我们做一个对照试验来分别看一下。

<!-- image:  -->

图3 权限操作效果

需要说明的是，图中set global sync_binlog这个操作是需要super权限的。

可以看到，虽然用户ua的super权限在T3时刻已经通过revoke语句回收了，但是在T4时刻执行set global的时候，权限验证还是通过了。这是因为super是全局权限，这个权限信息在线程对象中，而revoke操作影响不到这个线程对象。

而在T5时刻去掉ua对db1库的所有权限后，在T6时刻session B再操作db1库的表，就会报错“权限不足”。这是因为acl_dbs是一个全局数组，所有线程判断db权限都用这个数组，这样revoke操作马上就会影响到session B。

这里在代码实现上有一个特别的逻辑，如果当前会话已经处于某一个db里面，之前use这个库的时候拿到的库权限会保存在会话变量中。

你可以看到在T6时刻，session C和session B对表t的操作逻辑是一样的。但是session B报错，而session C可以执行成功。这是因为session C在T2 时刻执行的use db1，拿到了这个库的权限，在切换出db1库之前，session C对这个库就一直有权限。

# 表权限和列权限

除了db级别的权限外，MySQL支持更细粒度的表权限和列权限。其中，表权限定义存放在表mysql.tables_priv中，列权限定义存放在表mysql.columns_priv中。这两类权限，组合起来存放在内存的hash结构column_priv_hash中。

这两类权限的赋权命令如下：
    
    
    create table db1.t1(id int, a int);
    
    grant all privileges on db1.t1 to 'ua'@'%' with grant option;
    GRANT SELECT(id), INSERT (id,a) ON mydb.mytbl TO 'ua'@'%' with grant option;
    

跟db权限类似，这两个权限每次grant的时候都会修改数据表，也会同步修改内存中的hash结构。因此，对这两类权限的操作，也会马上影响到已经存在的连接。

看到这里，你一定会问，看来grant语句都是即时生效的，那这么看应该就不需要执行flush privileges语句了呀。

答案也确实是这样的。

flush privileges命令会清空acl_users数组，然后从mysql.user表中读取数据重新加载，重新构造一个acl_users数组。也就是说，以数据表中的数据为准，会将全局权限内存数组重新加载一遍。

同样地，对于db权限、表权限和列权限，MySQL也做了这样的处理。

也就是说，如果内存的权限数据和磁盘数据表相同的话，不需要执行flush privileges。而如果我们都是用grant/revoke语句来执行的话，内存和数据表本来就是保持同步更新的。

**因此，正常情况下，grant命令之后，没有必要跟着执行flush privileges命令。**

# flush privileges使用场景

那么，flush privileges是在什么时候使用呢？显然，当数据表中的权限数据跟内存中的权限数据不一致的时候，flush privileges语句可以用来重建内存数据，达到一致状态。

这种不一致往往是由不规范的操作导致的，比如直接用DML语句操作系统权限表。我们来看一下下面这个场景：

<!-- image:  -->

图4 使用flush privileges

可以看到，T3时刻虽然已经用delete语句删除了用户ua，但是在T4时刻，仍然可以用ua连接成功。原因就是，这时候内存中acl_users数组中还有这个用户，因此系统判断时认为用户还正常存在。

在T5时刻执行过flush命令后，内存更新，T6时刻再要用ua来登录的话，就会报错“无法访问”了。

直接操作系统表是不规范的操作，这个不一致状态也会导致一些更“诡异”的现象发生。比如，前面这个通过delete语句删除用户的例子，就会出现下面的情况：

<!-- image:  -->

图5 不规范权限操作导致的异常

可以看到，由于在T3时刻直接删除了数据表的记录，而内存的数据还存在。这就导致了：

  1. T4时刻给用户ua赋权限失败，因为mysql.user表中找不到这行记录；

  2. 而T5时刻要重新创建这个用户也不行，因为在做内存判断的时候，会认为这个用户还存在。


# 小结

今天这篇文章，我和你介绍了MySQL用户权限在数据表和内存中的存在形式，以及grant和revoke命令的执行逻辑。

grant语句会同时修改数据表和内存，判断权限的时候使用的是内存数据。因此，规范地使用grant和revoke语句，是不需要随后加上flush privileges语句的。

flush privileges语句本身会用数据表的数据重建一份内存权限数据，所以在权限数据可能存在不一致的情况下再使用。而这种不一致往往是由于直接用DML语句操作系统权限表导致的，所以我们尽量不要使用这类语句。

另外，在使用grant语句赋权时，你可能还会看到这样的写法：
    
    
    grant super on *.* to 'ua'@'%' identified by 'pa';
    

这条命令加了identified by ‘密码’， 语句的逻辑里面除了赋权外，还包含了：

  1. 如果用户’ua’@’%'不存在，就创建这个用户，密码是pa；

  2. 如果用户ua已经存在，就将密码修改成pa。


这也是一种不建议的写法，因为这种写法很容易就会不慎把密码给改了。

“grant之后随手加flush privileges”，我自己是这么使用了两三年之后，在看代码的时候才发现其实并不需要这样做，那已经是2011年的事情了。

去年我看到一位小伙伴这么操作的时候，指出这个问题时，他也觉得很神奇。因为，他和我一样看的第一份文档就是这么写的，自己也一直是这么用的。

所以，今天的课后问题是，请你也来说一说，在使用数据库或者写代码的过程中，有没有遇到过类似的场景：误用了很长时间以后，由于一个契机发现“啊，原来我错了这么久”？

你可以把你的经历写在留言区，我会在下一篇文章的末尾选取有趣的评论和你分享。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

上期的问题是，MySQL解析statement格式的binlog的时候，对于load data命令，解析出来为什么用的是load data local。

这样做的一个原因是，为了确保备库应用binlog正常。因为备库可能配置了secure_file_priv=null，所以如果不用local的话，可能会导入失败，造成主备同步延迟。

另一种应用场景是使用mysqlbinlog工具解析binlog文件，并应用到目标库的情况。你可以使用下面这条命令 ：
    
    
    mysqlbinlog $binlog_file | mysql -h$host -P$port -u$user -p$pwd
    

把日志直接解析出来发给目标库执行。增加local，就能让这个方法支持非本地的$host。

评论区留言点赞板：

> @poppy 、@库淘淘 两位同学提到了第一个场景；  
>  @王显伟 @lionetes 两位同学帮忙回答了 @undifined 同学的疑问，拷贝出来的文件要确保MySQL进程可以读。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

undifined

[__ 7](<javascript:;>)

权限的作用范围和修改策略总结：  
http://ww1.sinaimg.cn/large/d1885ed1ly1g0ab2twmjaj21gs0js78u.jpg 

2019-02-18

__ 作者回复

👍，优秀

2019-02-18

  * <!-- image:  -->

夜空中最亮的星（华仔）

[__ 3](<javascript:;>)

通过老师的讲解 flush privileges 这回彻底懂了，高兴😃 

2019-02-18

__ 作者回复

👍

2019-02-19

  * <!-- image:  -->

way

[__ 1](<javascript:;>)

写个比较小的点：在命令行查询数据需要行转列的时候习惯加个\G ; 比如slave slave stauts \G ; 后来发现 ; 是多余的。列几个常用的  
\G 行转列并发送给 mysql server  
\g 等同于 ;  
\\! 执行系统命令  
\q exit  
\c 清除当前SQL（不执行）  
\s mysql status 信息  
其他参考 \h 

2019-02-20

__ 作者回复

👍  
  
我最开始使用MySQL的时候，就是不自然的在\G后面加分号  
而且还看到报错，好紧张😆

2019-02-20

  * <!-- image:  -->

XD

[__ 1](<javascript:;>)

老师，我刚说的是acl_db，是在db切换的时候，从acl_dbs拷贝到线程内部的？类似acl_user。  
  
session a  
drop user 'test'@'%';  
create user 'test'@'%' identified by '123456';  
grant SELECT,UPDATE on gt.* to 'test'@'%';  
  
session b 使用test登录  
use gt;  
  
session a  
revoke SELECT,UPDATE on gt.* from 'test'@'%';  
  
session b  
show databases; //只能看到information_schema库  
use gt; // Access denied for user 'test'@'%' to database 'gt'  
show tables; //可以看到gt库中所有的表  
select/update //操作都正常 

2019-02-18

__ 作者回复

你说的对，我刚翻代码确认了下，确实是特别对“当前db”有一个放过的逻辑。  
  
多谢指正。我勘误下。

2019-02-19

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJCscgdVibmoPyRLRaicvk6rjTJxePZ6VFHvGjUQvtfhCS6kO4OZ1AVibbhNGKlWZmpEFf2yA6ptsqHw/132)

夹心面包

[__ 1](<javascript:;>)

我在此分享一个授权库的小技巧, 如果需要授权多个库,库名还有规律,比如 db_201701 db_201702  
可以采用正则匹配写一条 grant on db______,每一个_代表一个字符.这样避免了多次授权,简化了过程。我们线上已经采用 

2019-02-18

__ 作者回复

是的，MySQL还支持 % 赋权，%表示匹配任意字符串，  
比如  
grant all privileges on `db%`.* to ... 表示所有以db为前缀的库。  
  
不过。。。我比较不建议这么用😅

2019-02-19

  * <!-- image:  -->

萤火虫

[__ 0](<javascript:;>)

坚持到最后 为老师打call 

2019-02-20

__ 作者回复

👍  
是真爱

2019-02-20

  * <!-- image:  -->

wljs

[__ 0](<javascript:;>)

老师我想问个问题 我们公司一个订单表有110个字段 想拆分成两个表 第一个表放经常查的字段 第二个表放不常查的 现在程序端不想改sql，数据库端来实现 当查询字段中 第一个表不存在 就去关联第二个表查出数据 db能实现不？ 

2019-02-19

  * <!-- image:  -->

舜

[__ 0](<javascript:;>)

老师，介绍完了order by后能不能继续介绍下group by的原理？等了好久了，一直想继续在order by基础上理解下group by，在使用过程中两者在索引利用上很相近，性能考虑也类似 

2019-02-19

__ 作者回复

37篇讲了group by的，你看下  
  
还有问再提出来😆

2019-02-19

  * <!-- image:  -->

旭东

[__ 0](<javascript:;>)

老师请教一个问题：MySQL 表设计时列表顺序对MySQL性能的影响大吗？对表的列顺序有什么建议吗？ 

2019-02-18

__ 作者回复

没有影响  
  
建议就是每次如果要加列都加到最后一列😆

2019-02-19

  * <!-- image:  -->

XD

[__ 0](<javascript:;>)

老师，实际测试了下。  
两个会话ab，登陆账号都为user。a中给user授予db1的select、update权限，b切换到db1，可以正常增改。然后a中回收该用户的db权限，b会话中的用户还是可以进行增改操作的。  
我发现用户的db权限好像是在切换数据库的时候刷新的，只要不切换，grant操作并不会产生作用，所以acl_db是否也是维护在线程内部的呢？  
  
以及，权限检验应该是在优化器的语义分析里进行的吧？ 

2019-02-18

__ 作者回复

acl_dbs是全局数组  
  
把你使用sql语句，和语句序列发一下哦  
  
类似按照时间顺序  
session a：  
xxx  
xxx  
session b:  
xxxx  
session a:  
xxxx  
这样

2019-02-18

  * <!-- image:  -->

发芽的紫菜

[__ 0](<javascript:;>)

老师，联合索引的数据结构是怎么样的？到底是怎么存的？看了前面索引两章，还是不太懂，留言里老师说会在后面章节会讲到，但我也没看到，所以来此问一下？老师能否画图讲解一下 

2019-02-18

__ 作者回复

联合索引就是两个字段拼起来作索引  
  
比如一个索引如果定义为(f1,f2),  
在数据上，就是f1的值之后跟着f2的值。  
查找的时候，比如执行 where f1=M and f2=N, 也是把M,N拼起来，去索引树查找

2019-02-18

  * <!-- image:  -->

晨思暮语

[__ 0](<javascript:;>)

丁老师,您好：  
关于上一章我留言的疑问,我重新整理了下。就是第十五章中老师留的思考题。  
我模拟了老师的实验,结果有点出入,请老师帮忙看看，谢谢！  
基础环境:  
mysql> select version();  
+------------+  
| version() |  
+------------+  
| 5.7.22-log |  
+------------+  
1 row in set (0.00 sec)  
  
mysql> show variables like '%tx%';  
+---------------+-----------------+  
| Variable_name | Value |  
+---------------+-----------------+  
| tx_isolation | REPEATABLE-READ |  
| tx_read_only | OFF |  
+---------------+-----------------+  
2 rows in set (0.00 sec)  
模拟实验:  
session A:   
mysql> begin;   
mysql> select * from t;   
+----+------+   
| id | a |   
+----+------+   
| 1 | 2 |   
+----+------+   
1 row in set (0.00 sec)   
  
session B:   
mysql> update t set a=3 where id=1;   
Query OK, 1 row affected (0.00 sec)   
Rows matched: 1 Changed: 1 Warnings: 0   
  
SESSION A:   
mysql> update t set a=3 where id=1;   
Query OK, 0 rows affected (0.00 sec)   
Rows matched: 1 Changed: 0 Warnings: 0   
/*老师的实验显示为：1 rows affected*/   
mysql> select * from t where id=1;   
+----+------+   
| id | a |   
+----+------+   
| 1 | 2 |   
+----+------+   
1 row in set (0.00 sec)   
/*老师实验的查询结果为：1,3 */ 

2019-02-18

__ 作者回复

这个跟binlog_format有关。  
  
如果binlog_format=row, 那么最后session A的select查到的是2；  
如果binlog_format=statement, 那么最后session A的select查到的是3；  
  
我们在文章里面有做了说明了，这个逻辑是依赖于“MySQL在执行update语句的时候，有没有把字段c也读进来”，  


2019-02-26

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJAibnPX9jW8kqLcIfibjic8GbkQkEUYyFKJkc39hZhibVlNrqwTjdLozkqibI2IwACd5YzofYickNxFnZg/132)

Sinyo

[__ 0](<javascript:;>)

查一张大表，order_key字段值对应的最小createtime；  
以前一直用方法一查数，后来同事说可以优化成方法二，查询效率比方法一高了几倍；  
mysql特有的group by功能，没有group by的字段默认取查到的第一条记录；  
  
方法一：  
select distinct order_key  
,createtime  
from (select order_key  
,min(createtime) createtime  
from aaa  
group by order_key) a  
join aaa b  
on a.order_key = b.order_key  
and a.createtime = b.createtime  
  
方法二：  
select order_key  
,createtime  
from (select order_key  
,createtime  
FROM aaa  
order by createtime  
) a  
group by order_key 

2019-02-18

__ 作者回复

👍  
  
  
这第二个写法跟：  
select order_key ,createtime FROM aaa force index(createtime) group by order_key  
的逻辑语义相同吗？  


2019-02-18

  * <!-- image:  -->

Leon📷

[__ 0](<javascript:;>)

老师我使用delte删除用户，再创建用户都是失败，但是使用drop就可以了  
mysql> create user 'ua'@'%' identified by 'L1234567890c-';  
ERROR 1396 (HY000): Operation CREATE USER failed for 'ua'@'%'  
mysql> drop user 'ua'@'%';  
Query OK, 0 rows affected (0.00 sec)  
  
mysql> create user 'ua'@'%' identified by 'L1234567890c-';  
Query OK, 0 rows affected (0.01 sec)  
是不是drop才会同时从内存和磁盘删除用户信息，但是delete只是从磁盘删除 

2019-02-18

__ 作者回复

对，drop是同时操作磁盘和内存，  
delete就是我们说的不规范操作

2019-02-18

  * <!-- image:  -->

爸爸回来了

[__ 0](<javascript:;>)

众所周知，sql是不区分大小写的。然而，涉及插件的变量却不是这样；上次在配置一个插件的参数的时候，苦思良久……最后发现了这个问题。难受😭 

2019-02-18

__ 作者回复

😆你说的是参数的名字，还是参数的值？  


2019-02-18

---

## 43. 要不要使用分区表？

<!-- image:  -->

我经常被问到这样一个问题：分区表有什么问题，为什么公司规范不让使用分区表呢？今天，我们就来聊聊分区表的使用行为，然后再一起回答这个问题。

# 分区表是什么？

为了说明分区表的组织形式，我先创建一个表t：
    
    
    CREATE TABLE `t` (
      `ftime` datetime NOT NULL,
      `c` int(11) DEFAULT NULL,
      KEY (`ftime`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    PARTITION BY RANGE (YEAR(ftime))
    (PARTITION p_2017 VALUES LESS THAN (2017) ENGINE = InnoDB,
     PARTITION p_2018 VALUES LESS THAN (2018) ENGINE = InnoDB,
     PARTITION p_2019 VALUES LESS THAN (2019) ENGINE = InnoDB,
    PARTITION p_others VALUES LESS THAN MAXVALUE ENGINE = InnoDB);
    insert into t values('2017-4-1',1),('2018-4-1',1);
    

<!-- image:  -->

图1 表t的磁盘文件

我在表t中初始化插入了两行记录，按照定义的分区规则，这两行记录分别落在p_2018和p_2019这两个分区上。

可以看到，这个表包含了一个.frm文件和4个.ibd文件，每个分区对应一个.ibd文件。也就是说：

  * 对于引擎层来说，这是4个表；
  * 对于Server层来说，这是1个表。


你可能会觉得这两句都是废话。其实不然，这两句话非常重要，可以帮我们理解分区表的执行逻辑。

# 分区表的引擎层行为

我先给你举个在分区表加间隙锁的例子，目的是说明对于InnoDB来说，这是4个表。

<!-- image:  -->

图2 分区表间隙锁示例

这里顺便复习一下，我在[第21篇文章](<https://time.geekbang.org/column/article/75659>)和你介绍的间隙锁加锁规则。

我们初始化表t的时候，只插入了两行数据， ftime的值分别是，‘2017-4-1’ 和’2018-4-1’ 。session A的select语句对索引ftime上这两个记录之间的间隙加了锁。如果是一个普通表的话，那么T1时刻，在表t的ftime索引上，间隙和加锁状态应该是图3这样的。

<!-- image:  -->

图3 普通表的加锁范围

也就是说，‘2017-4-1’ 和’2018-4-1’ 这两个记录之间的间隙是会被锁住的。那么，sesion B的两条插入语句应该都要进入锁等待状态。

但是，从上面的实验效果可以看出，session B的第一个insert语句是可以执行成功的。这是因为，对于引擎来说，p_2018和p_2019是两个不同的表，也就是说2017-4-1的下一个记录并不是2018-4-1，而是p_2018分区的supremum。所以T1时刻，在表t的ftime索引上，间隙和加锁的状态其实是图4这样的：

<!-- image:  -->

图4 分区表t的加锁范围

由于分区表的规则，session A的select语句其实只操作了分区p_2018，因此加锁范围就是图4中深绿色的部分。

所以，session B要写入一行ftime是2018-2-1的时候是可以成功的，而要写入2017-12-1这个记录，就要等session A的间隙锁。

图5就是这时候的show engine innodb status的部分结果。

<!-- image:  -->

图5 session B被锁住信息

看完InnoDB引擎的例子，我们再来一个MyISAM分区表的例子。

我首先用alter table t engine=myisam，把表t改成MyISAM表；然后，我再用下面这个例子说明，对于MyISAM引擎来说，这是4个表。

<!-- image:  -->

图6 用MyISAM表锁验证

在session A里面，我用sleep(100)将这条语句的执行时间设置为100秒。由于MyISAM引擎只支持表锁，所以这条update语句会锁住整个表t上的读。

但我们看到的结果是，session B的第一条查询语句是可以正常执行的，第二条语句才进入锁等待状态。

这正是因为MyISAM的表锁是在引擎层实现的，session A加的表锁，其实是锁在分区p_2018上。因此，只会堵住在这个分区上执行的查询，落到其他分区的查询是不受影响的。

看到这里，你可能会说，分区表看来还不错嘛，为什么不让用呢？我们使用分区表的一个重要原因就是单表过大。那么，如果不使用分区表的话，我们就是要使用手动分表的方式。

接下来，我们一起看看手动分表和分区表有什么区别。

比如，按照年份来划分，我们就分别创建普通表t_2017、t_2018、t_2019等等。手工分表的逻辑，也是找到需要更新的所有分表，然后依次执行更新。在性能上，这和分区表并没有实质的差别。

分区表和手工分表，一个是由server层来决定使用哪个分区，一个是由应用层代码来决定使用哪个分表。因此，从引擎层看，这两种方式也是没有差别的。

其实这两个方案的区别，主要是在server层上。从server层看，我们就不得不提到分区表一个被广为诟病的问题：打开表的行为。

# 分区策略

每当第一次访问一个分区表的时候，MySQL需要把所有的分区都访问一遍。**一个典型的报错情况** 是这样的：如果一个分区表的分区很多，比如超过了1000个，而MySQL启动的时候，open_files_limit参数使用的是默认值1024，那么就会在访问这个表的时候，由于需要打开所有的文件，导致打开表文件的个数超过了上限而报错。

下图就是我创建的一个包含了很多分区的表t_myisam，执行一条插入语句后报错的情况。

<!-- image:  -->

图 7 insert 语句报错

可以看到，这条insert语句，明显只需要访问一个分区，但语句却无法执行。

这时，你一定从表名猜到了，这个表我用的是MyISAM引擎。是的，因为使用InnoDB引擎的话，并不会出现这个问题。

MyISAM分区表使用的分区策略，我们称为**通用分区策略** （generic partitioning），每次访问分区都由server层控制。通用分区策略，是MySQL一开始支持分区表的时候就存在的代码，在文件管理、表管理的实现上很粗糙，因此有比较严重的性能问题。

从MySQL 5.7.9开始，InnoDB引擎引入了**本地分区策略** （native partitioning）。这个策略是在InnoDB内部自己管理打开分区的行为。

MySQL从5.7.17开始，将MyISAM分区表标记为即将弃用(deprecated)，意思是“从这个版本开始不建议这么使用，请使用替代方案。在将来的版本中会废弃这个功能”。

从MySQL 8.0版本开始，就不允许创建MyISAM分区表了，只允许创建已经实现了本地分区策略的引擎。目前来看，只有InnoDB和NDB这两个引擎支持了本地分区策略。

接下来，我们再看一下分区表在server层的行为。

# 分区表的server层行为

如果从server层看的话，一个分区表就只是一个表。

这句话是什么意思呢？接下来，我就用下面这个例子来和你说明。如图8和图9所示，分别是这个例子的操作序列和执行结果图。

<!-- image:  -->

图8 分区表的MDL锁

<!-- image:  -->

图9 show processlist结果

可以看到，虽然session B只需要操作p_2107这个分区，但是由于session A持有整个表t的MDL锁，就导致了session B的alter语句被堵住。

这也是DBA同学经常说的，分区表，在做DDL的时候，影响会更大。如果你使用的是普通分表，那么当你在truncate一个分表的时候，肯定不会跟另外一个分表上的查询语句，出现MDL锁冲突。

到这里我们小结一下：

  1. MySQL在第一次打开分区表的时候，需要访问所有的分区；

  2. 在server层，认为这是同一张表，因此所有分区共用同一个MDL锁；

  3. 在引擎层，认为这是不同的表，因此MDL锁之后的执行过程，会根据分区表规则，只访问必要的分区。


而关于“必要的分区”的判断，就是根据SQL语句中的where条件，结合分区规则来实现的。比如我们上面的例子中，where ftime=‘2018-4-1’，根据分区规则year函数算出来的值是2018，那么就会落在p_2019这个分区。

但是，如果这个where 条件改成 where ftime>=‘2018-4-1’，虽然查询结果相同，但是这时候根据where条件，就要访问p_2019和p_others这两个分区。

如果查询语句的where条件中没有分区key，那就只能访问所有分区了。当然，这并不是分区表的问题。即使是使用业务分表的方式，where条件中没有使用分表的key，也必须访问所有的分表。

我们已经理解了分区表的概念，那么什么场景下适合使用分区表呢？

# 分区表的应用场景

分区表的一个显而易见的优势是对业务透明，相对于用户分表来说，使用分区表的业务代码更简洁。还有，分区表可以很方便的清理历史数据。

如果一项业务跑的时间足够长，往往就会有根据时间删除历史数据的需求。这时候，按照时间分区的分区表，就可以直接通过alter table t drop partition …这个语法删掉分区，从而删掉过期的历史数据。

这个alter table t drop partition …操作是直接删除分区文件，效果跟drop普通表类似。与使用delete语句删除数据相比，优势是速度快、对系统影响小。

# 小结

这篇文章，我主要和你介绍的是server层和引擎层对分区表的处理方式。我希望通过这些介绍，你能够对是否选择使用分区表，有更清晰的想法。

需要注意的是，我是以范围分区（range）为例和你介绍的。实际上，MySQL还支持hash分区、list分区等分区方法。你可以在需要用到的时候，再翻翻[手册](<https://dev.mysql.com/doc/refman/8.0/en/partitioning-types.html>)。

实际使用时，分区表跟用户分表比起来，有两个绕不开的问题：一个是第一次访问的时候需要访问所有分区，另一个是共用MDL锁。

因此，如果要使用分区表，就不要创建太多的分区。我见过一个用户做了按天分区策略，然后预先创建了10年的分区。这种情况下，访问分区表的性能自然是不好的。这里有两个问题需要注意：

  1. 分区并不是越细越好。实际上，单表或者单分区的数据一千万行，只要没有特别大的索引，对于现在的硬件能力来说都已经是小表了。

  2. 分区也不要提前预留太多，在使用之前预先创建即可。比如，如果是按月分区，每年年底时再把下一年度的12个新分区创建上即可。对于没有数据的历史分区，要及时的drop掉。


至于分区表的其他问题，比如查询需要跨多个分区取数据，查询性能就会比较慢，基本上就不是分区表本身的问题，而是数据量的问题或者说是使用方式的问题了。

当然，如果你的团队已经维护了成熟的分库分表中间件，用业务分表，对业务开发同学没有额外的复杂性，对DBA也更直观，自然是更好的。

最后，我给你留下一个思考题吧。

我们举例的表中没有用到自增主键，假设现在要创建一个自增字段id。MySQL要求分区表中的主键必须包含分区字段。如果要在表t的基础上做修改，你会怎么定义这个表的主键呢？为什么这么定义呢？

你可以把你的结论和分析写在留言区，我会在下一篇文章的末尾和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

上篇文章后面还不够多，可能很多同学还没来记得看吧，我们就等后续有更多留言的时候，再补充本期的“上期问题时间”吧。

@夹心面包 提到了在grant的时候是支持通配符的："_"表示一个任意字符，“%”表示任意字符串。这个技巧在一个分库分表方案里面，同一个分库上有多个db的时候，是挺方便的。不过我个人认为，权限赋值的时候，控制的精确性还是要优先考虑的。

<!-- image:  -->

##  精选留言

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJCscgdVibmoPyRLRaicvk6rjTJxePZ6VFHvGjUQvtfhCS6kO4OZ1AVibbhNGKlWZmpEFf2yA6ptsqHw/132)

夹心面包

[__ 5](<javascript:;>)

我说下我的感想  
1 经典的利用分区表的场景  
1 zabbix历史数据表的改造,利用存储过程创建和改造  
2 后台数据的分析汇总,比如日志数据,便于清理  
这两种场景我们都在执行,我们对于分区表在业务采用的是hash 用户ID方式,不过大规模应用分区表的公司我还没遇到过  
2 分区表需要注意的几点  
总结下  
1 由于分区表都很大,DDL耗时是非常严重的,必须考虑这个问题  
2 分区表不能建立太多的分区,我曾被分享一个因为分区表分区过多导致的主从延迟问题  
3 分区表的规则和分区需要预先设置好,否则后来进行修改也很麻烦  


2019-02-20

__ 作者回复

👍 非常好  


2019-02-20

  * <!-- image:  -->

aliang

[__ 2](<javascript:;>)

老师，mysql还有一个参数是innodb_open_files，资料上说作用是限制Innodb能打开的表的数量。它和open_files_limit之间有什么关系吗？ 

2019-02-21

__ 作者回复

好问题。  
  
在InnoDB引擎打开文件超过 innodb_open_files这个值的时候，就会关掉一些之前打开的文件。  
  
其实我们文章中 ，InnoDB分区表使用了本地分区策略以后，即使分区个数大于open_files_limit ，打开InnoDB分区表也不会报“打开文件过多”这个错误，就是innodb_open_files这个参数发挥的作用。  


2019-02-21

  * <!-- image:  -->

怀刚

[__ 1](<javascript:;>)

请教下采用”先做备库、切换、再做备库”DDL方式不支持AFTER COLUMN是因为BINLOG原因吗？  
以上DDL方式会存在影响“有损”的吧？“无损”有哪些方案呢？如果备库承载读请求但又不能接受“长时间”延时 

2019-03-09

__ 作者回复

1\. 对，binlog对原因  
2\. 如果延迟算损失，确实是有损的。备库上的读流量要先切换到主库（也就是为什么需要在低峰期做做个操作）

2019-03-09

  * <!-- image:  -->

权恒星

[__ 1](<javascript:;>)

这个只适合单机吧？集群没法即使用innodb引擎，又支持分区表吧，只能使用中间件了。之前调研了一下，官方只有ndb cluster才支持分区表？ 

2019-02-20

__ 作者回复

对这篇文章讲的是单机上的单表多分区

2019-02-20

  * <!-- image:  -->

One day

[__ 1](<javascript:;>)

这次竟然只需要再读两次就能读懂，之前接触过mycat和sharding-jdbc实现分区,老师能否谈谈这方面的呢 

2019-02-20

__ 作者回复

赞两次 😆  
  
这个就是我们文章说的“分库分表中间件”  
不过看到不少公司都会要在这基础上做点定制化

2019-02-20

  * <!-- image:  -->

于欣磊

[__ 0](<javascript:;>)

阿里云的DRDS就是分库分表的中间件典型代表。自己实现了一个层Server访问层在这一层进行分库分表（对透明），然后MySQL只是相当于存储层。一些Join、负载Order by/Group by都在DRDS中间件这层完成，简单的逻辑插叙计算完对应的分库分表后下推给MySQL https://www.aliyun.com/product/drds 

2019-02-25

  * <!-- image:  -->

☞

[__ 0](<javascript:;>)

老师确认下，5.7.9之后的innodb分区表，是访问第一个表时不会去打开所有的分区表了吗？ 

2019-02-25

__ 作者回复

第一次访问的时候，要打开所有分区的  
  


2019-02-25

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/NjF5F2UZEbd3iclteRmVL6aRlW9wv9GHOte3QFjF4cUvb5hWeNZBPmaNrlJJbSUdqTMF6MmI10icMLuDQOsb6ERA/132)

启程

[__ 0](<javascript:;>)

老师，你好，请教你个分区表多条件查询建索引的问题；  
表A,  
列a,b,c,d,e,f,g,h (其中b是datetime，a是uuid,其余是varchar)  
主键索引，(b,a),按月分区  
查询情况1：  
where b>=? and b<=? order by b desc limit 500;  
查询情况2:  
where b>=? and b<=? and c in(?) order by b desc limit 500;  
查询情况3：  
where b>=? and b<=? and d in(?) and e in(?) order by b desc limit 500;  
查询情况4：  
where b>=? and b<=? and c in(?) and d in(?) and e in(?) order by b desc limit 500;  
自己尝试建过不少索引，效果不是很好，请问老师，我要怎么建索引？？？ 

2019-02-25

__ 作者回复

这个还是得看不同的语句的执行次数哈  
  
如果从语句类型上看，可以考虑加上(b,c)、(b,d)这两个联合索引

2019-02-26

  * <!-- image:  -->

NICK

[__ 0](<javascript:;>)

老师，如果用户分区，业务要做分页过滤查询怎么做才好？ 

2019-02-25

__ 作者回复

分区表的用法跟普通表，在sql语句上是相同的。

2019-02-25

  * <!-- image:  -->

锋芒

[__ 0](<javascript:;>)

老师，请问什么情况会出现间隙锁？能否专题讲一下锁呢？ 

2019-02-23

__ 作者回复

20、21两篇看下

2019-02-23

  * <!-- image:  -->

daka

[__ 0](<javascript:;>)

本期提到了ndb，了解了下，这个存储引擎高可用及读写可扩展性功能都是自带，感觉是不错，为什么很少见人使用呢？生产不可靠？ 

2019-02-21

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/MSV5CclX2Zct7U0F7bVwd0Zg4y6AK1qf8GVic5W3tCNaLhL6wTqD7CUnWxarW4DiaVbVic1G3gpZ3ud0ELWhuxnrg/132)

helloworld.xs

[__ 0](<javascript:;>)

请教个问题，一般mysql会有查询缓存，但是update操作也有缓存机制吗？使用mysql console第一次执行一个update SQL耗时明显比后面执行相同update SQL要慢，这是为什么？ 

2019-02-21

__ 作者回复

update的话，主要应该第一次执行的时候，数据都读入到了

2019-02-21

  * <!-- image:  -->

万勇

[__ 0](<javascript:;>)

老师，请问add column after column_name跟add column不指定位置，这两种性能上有区别吗？我们在add column 指定after column_name的情况很多。 

2019-02-21

__ 作者回复

仅仅看性能，是没什么差别的  
  
但是建议尽量不要加after column_name，  
也就是说尽量加到最后一列。  
  
因为其实没差别，但是加在最后有以下两个好处：  
1\. 开始有一些分支支持快速加列，就是说如果你加在最后一列，是瞬间就能完成，而加了after column_name，就用不上这些优化（以后潜在的好处）  
  
2\. 我们在前面的文章有提到过，如果怕对线上业务造成影响，有时候是通过“先做备库、切换、再做备库”这种方式来执行ddl的，那么使用after column_name的时候用不上这种方式。  
  
实际上列的数据是不应该有影响的，还是要形成好习惯😆

2019-02-21

  * <!-- image:  -->

Q

[__ 0](<javascript:;>)

老师 请问下 网站开发数据库表是myisam和innodb混合引擎 考虑管理比较麻烦 想统一成innodb 请问是否影响数据库或带来什么隐患吗？ 网站是网上商城购物类型的 

2019-02-20

__ 作者回复

应该统一成innodb  
网上商城购物类型更要用InnoDB，因为MyISAM并不是crash-safe的。  
  
测试环境改完回归下

2019-02-21

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJCscgdVibmoPyRLRaicvk6rjTJxePZ6VFHvGjUQvtfhCS6kO4OZ1AVibbhNGKlWZmpEFf2yA6ptsqHw/132)

夹心面包

[__ 0](<javascript:;>)

  
我觉得老师的问题可以提炼为 Mysql复合主键中自增长字段设置问题  
复合索引可以包含一个auto_increment,但是auto_increment列必须是第一列。这样插入的话,只需要指定非自增长的列  
语法 alter table test1 change column id id int auto_increment; 

2019-02-20

__ 作者回复

“但是auto_increment列必须是第一列” 可以不是哦

2019-02-20

  * <!-- image:  -->

undifined

[__ 0](<javascript:;>)

老师，有两个问题  
1\. 图三的间隙锁，根据“索引上的等值查询，向右遍历时且最后一个值不满足等值条件的时候，next-key lock 退化为间隙锁”，不应该是 (-∞,2017-4-1],(2017-4-1,2018-4-1)吗，图4左边的也应该是 (-∞,2017-4-1],(2017-4-1, supernum)，是不是图画错了  
2\. 现有的一个表，一千万行的数据， InnoDB 引擎，如果以月份分区，即使有 MDL 锁和初次访问时会查询所有分区，但是综合来看，分区表的查询性能还是要比不分区好，这样理解对吗  
  
思考题的答案   
ALTER TABLE t  
ADD COLUMN (id INT AUTO_INCREMENT ),  
ADD PRIMARY KEY (id, ftime);  
  
麻烦老师解答一下，谢谢老师 

2019-02-20

__ 作者回复

1\. 我们语句里面是 where ftime='2017-5-1' 哈，不是“4-1”  
2\. “分区表的查询性能还是要比不分区好，这样理解对吗”，其实还是要看表的索引情况。  
当然一定存在一个数量级N，把这N行分到10个分区表，比把这N行放到一个大表里面，效率高

2019-02-20

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/fJ5BEicRVnXAwCxkIYhJZ0woiaQ38ibUYkYH125bzL2Y2ib1YS9b7Q9S5qia2Cia9UWzUoDBGeWJibB7p9xSnib7iaU8kzw/132)

千木

[__ 0](<javascript:;>)

老师您好，你在文章里面有说通用分区规则会打开所有引擎文件导致不可用，而本地分区规则应该是只打开单个引擎文件，那你不建议创建太多分区的原因是什么呢？如果是本地分区规则，照例说是不会影响的吧，叨扰了 

2019-02-20

__ 作者回复

“本地分区规则应该是只打开单个引擎文件”，并不是哈，我在文章末尾说了，也会打开所有文件的，只是说本地分区规则有优化，比如如果文件数过多，就会淘汰之前打开的文件句柄（暂时关掉）。  
  
所以分区太多，还是会有影响的  


2019-02-20

  * <!-- image:  -->

郭江伟

[__ 0](<javascript:;>)

此时主键包含自增列+分区键，原因为对innodb来说分区等于单独的表，自增字段每个分区可以插入相同的值，如果主键只有自增列无法完全保证唯一性。  
测试表如下：  
mysql> show create table t\G  
Table: t  
Create Table: CREATE TABLE `t` (  
`id` int(11) NOT NULL AUTO_INCREMENT,  
`ftime` datetime NOT NULL,  
`c` int(11) DEFAULT NULL,  
PRIMARY KEY (`id`,`ftime`),  
KEY `ftime` (`ftime`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  
/*!50100 PARTITION BY RANGE (YEAR(ftime))  
(PARTITION p_2017 VALUES LESS THAN (2017) ENGINE = InnoDB,  
PARTITION p_2018 VALUES LESS THAN (2018) ENGINE = InnoDB,  
PARTITION p_2019 VALUES LESS THAN (2019) ENGINE = InnoDB,  
PARTITION p_others VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */  
1 row in set (0.00 sec)  
mysql> insert into t values(1,'2017-4-1',1),(1,'2018-4-1',1);  
Query OK, 2 rows affected (0.02 sec)  
mysql> select * from t;  
+----+---------------------+------+  
| id | ftime | c |  
+----+---------------------+------+  
| 1 | 2017-04-01 00:00:00 | 1 |  
| 1 | 2018-04-01 00:00:00 | 1 |  
+----+---------------------+------+  
2 rows in set (0.00 sec)  
  
mysql> insert into t values(null,'2017-5-1',1),(null,'2018-5-1',1);  
Query OK, 2 rows affected (0.02 sec)  
  
mysql> select * from t;  
+----+---------------------+------+  
| id | ftime | c |  
+----+---------------------+------+  
| 1 | 2017-04-01 00:00:00 | 1 |  
| 2 | 2017-05-01 00:00:00 | 1 |  
| 1 | 2018-04-01 00:00:00 | 1 |  
| 3 | 2018-05-01 00:00:00 | 1 |  
+----+---------------------+------+  
4 rows in set (0.00 sec) 

2019-02-20

__ 作者回复

👍

2019-02-24

  * <!-- image:  -->

wljs

[__ 0](<javascript:;>)

  
老师我想问个问题 我们公司一个订单表有110个字段 想拆分成两个表 第一个表放经常查的字段 第二个表放不常查的 现在程序端不想改sql，数据库端来实现 当查询字段中 第一个表不存在 就去关联第二个表查出数据 db能实现不 

2019-02-20

__ 作者回复

用view可能可以实现部分你的需求，但是强烈不建议这么做。  
业务不想修改，就好好跟他们说，毕竟这样分（常查和不常查的垂直拆分）是合理的，对读写性能都有明显的提升的。

2019-02-20

---

## 44. 答疑文章（三）：说一说这些好问题

<!-- image:  -->

这是我们专栏的最后一篇答疑文章，今天我们来说说一些好问题。

在我看来，能够帮我们扩展一个逻辑的边界的问题，就是好问题。因为通过解决这样的问题，能够加深我们对这个逻辑的理解，或者帮我们关联到另外一个知识点，进而可以帮助我们建立起自己的知识网络。

在工作中会问好问题，是一个很重要的能力。

经过这段时间的学习，从评论区的问题我可以感觉出来，紧跟课程学习的同学，对SQL语句执行性能的感觉越来越好了，提出的问题也越来越细致和精准了。

接下来，我们就一起看看同学们在评论区提到的这些好问题。在和你一起分析这些问题的时候，我会指出它们具体是在哪篇文章出现的。同时，在回答这些问题的过程中，我会假设你已经掌握了这篇文章涉及的知识。当然，如果你印象模糊了，也可以跳回文章再复习一次。

# join的写法

在第35篇文章[《join语句怎么优化？》](<https://time.geekbang.org/column/article/80147>)中，我在介绍join执行顺序的时候，用的都是straight_join。@郭健 同学在文后提出了两个问题：

  1. 如果用left join的话，左边的表一定是驱动表吗？

  2. 如果两个表的join包含多个条件的等值匹配，是都要写到on里面呢，还是只把一个条件写到on里面，其他条件写到where部分？


为了同时回答这两个问题，我来构造两个表a和b：
    
    
    create table a(f1 int, f2 int, index(f1))engine=innodb;
    create table b(f1 int, f2 int)engine=innodb;
    insert into a values(1,1),(2,2),(3,3),(4,4),(5,5),(6,6);
    insert into b values(3,3),(4,4),(5,5),(6,6),(7,7),(8,8);
    

表a和b都有两个字段f1和f2，不同的是表a的字段f1上有索引。然后，我往两个表中都插入了6条记录，其中在表a和b中同时存在的数据有4行。

@郭健 同学提到的第二个问题，其实就是下面这两种写法的区别：
    
    
    select * from a left join b on(a.f1=b.f1) and (a.f2=b.f2); /*Q1*/
    select * from a left join b on(a.f1=b.f1) where (a.f2=b.f2);/*Q2*/
    

我把这两条语句分别记为Q1和Q2。

首先，需要说明的是，这两个left join语句的语义逻辑并不相同。我们先来看一下它们的执行结果。

<!-- image:  -->

图1 两个join的查询结果

可以看到：

  * 语句Q1返回的数据集是6行，表a中即使没有满足匹配条件的记录，查询结果中也会返回一行，并将表b的各个字段值填成NULL。
  * 语句Q2返回的是4行。从逻辑上可以这么理解，最后的两行，由于表b中没有匹配的字段，结果集里面b.f2的值是空，不满足where 部分的条件判断，因此不能作为结果集的一部分。


接下来，我们看看实际执行这两条语句时，MySQL是怎么做的。

我们先一起看看语句Q1的explain结果：

<!-- image:  -->

图2 Q1的explain结果

可以看到，这个结果符合我们的预期：

  * 驱动表是表a，被驱动表是表b；
  * 由于表b的f1字段上没有索引，所以使用的是Block Nexted Loop Join（简称BNL） 算法。


看到BNL算法，你就应该知道这条语句的执行流程其实是这样的：

  1. 把表a的内容读入join_buffer 中。因为是select * ，所以字段f1和f2都被放入join_buffer了。

  2. 顺序扫描表b，对于每一行数据，判断join条件（也就是a.f1=b.f1 and a.f2=b.f2)是否满足，满足条件的记录, 作为结果集的一行返回。如果语句中有where子句，需要先判断where部分满足条件后，再返回。

  3. 表b扫描完成后，对于没有被匹配的表a的行（在这个例子中就是(1,1)、(2,2)这两行），把剩余字段补上NULL，再放入结果集中。


对应的流程图如下：

<!-- image:  -->

图3 left join -BNL算法

可以看到，这条语句确实是以表a为驱动表，而且从执行效果看，也和使用straight_join是一样的。

你可能会想，语句Q2的查询结果里面少了最后两行数据，是不是就是把上面流程中的步骤3去掉呢？我们还是先看一下语句Q2的expain结果吧。

<!-- image:  -->

图4 Q2的explain结果

这里先和你说一句题外话，专栏马上就结束了，我也和你一起根据explain结果“脑补”了很多次一条语句的执行流程了，所以我希望你已经具备了这个能力。今天，我们再一起分析一次SQL语句的explain结果。

可以看到，这条语句是以表b为驱动表的。而如果一条join语句的Extra字段什么都没写的话，就表示使用的是Index Nested-Loop Join（简称NLJ）算法。

因此，语句Q2的执行流程是这样的：顺序扫描表b，每一行用b.f1到表a中去查，匹配到记录后判断a.f2=b.f2是否满足，满足条件的话就作为结果集的一部分返回。

那么，**为什么语句Q1和Q2这两个查询的执行流程会差距这么大呢？** 其实，这是因为优化器基于Q2这个查询的语义做了优化。

为了理解这个问题，我需要再和你交代一个背景知识点：在MySQL里，NULL跟任何值执行等值判断和不等值判断的结果，都是NULL。这里包括， select NULL = NULL 的结果，也是返回NULL。

因此，语句Q2里面where a.f2=b.f2就表示，查询结果里面不会包含b.f2是NULL的行，这样这个left join的语义就是“找到这两个表里面，f1、f2对应相同的行。对于表a中存在，而表b中匹配不到的行，就放弃”。

这样，这条语句虽然用的是left join，但是语义跟join是一致的。

因此，优化器就把这条语句的left join改写成了join，然后因为表a的f1上有索引，就把表b作为驱动表，这样就可以用上NLJ 算法。在执行explain之后，你再执行show warnings，就能看到这个改写的结果，如图5所示。

<!-- image:  -->

图5 Q2的改写结果

这个例子说明，即使我们在SQL语句中写成left join，执行过程还是有可能不是从左到右连接的。也就是说，**使用left join时，左边的表不一定是驱动表。**

这样看来，**如果需要left join的语义，就不能把被驱动表的字段放在where条件里面做等值判断或不等值判断，必须都写在on里面。** 那如果是join语句呢？

这时候，我们再看看这两条语句：
    
    
    select * from a join b on(a.f1=b.f1) and (a.f2=b.f2); /*Q3*/
    select * from a join b on(a.f1=b.f1) where (a.f2=b.f2);/*Q4*/
    

我们再使用一次看explain 和 show warnings的方法，看看优化器是怎么做的。

<!-- image:  -->

图6 join语句改写

可以看到，这两条语句都被改写成：
    
    
    select * from a join b where (a.f1=b.f1) and (a.f2=b.f2);
    

执行计划自然也是一模一样的。

也就是说，在这种情况下，join将判断条件是否全部放在on部分就没有区别了。

# Simple Nested Loop Join 的性能问题

我们知道，join语句使用不同的算法，对语句的性能影响会很大。在第34篇文章[《到底可不可以使用join？》](<https://time.geekbang.org/column/article/79700>)的评论区中，@书策稠浊 和 @朝夕心 两位同学提了一个很不错的问题。

我们在文中说到，虽然BNL算法和Simple Nested Loop Join 算法都是要判断M*N次（M和N分别是join的两个表的行数），但是Simple Nested Loop Join 算法的每轮判断都要走全表扫描，因此性能上BNL算法执行起来会快很多。

为了便于说明，我还是先为你简单描述一下这两个算法。

BNL算法的执行逻辑是：

  1. 首先，将驱动表的数据全部读入内存join_buffer中，这里join_buffer是无序数组；

  2. 然后，顺序遍历被驱动表的所有行，每一行数据都跟join_buffer中的数据进行匹配，匹配成功则作为结果集的一部分返回。


Simple Nested Loop Join算法的执行逻辑是：顺序取出驱动表中的每一行数据，到被驱动表去做全表扫描匹配，匹配成功则作为结果集的一部分返回。

这两位同学的疑问是，Simple Nested Loop Join算法，其实也是把数据读到内存里，然后按照匹配条件进行判断，为什么性能差距会这么大呢？

解释这个问题，需要用到MySQL中索引结构和Buffer Pool的相关知识点：

  1. 在对被驱动表做全表扫描的时候，如果数据没有在Buffer Pool中，就需要等待这部分数据从磁盘读入；  
从磁盘读入数据到内存中，会影响正常业务的Buffer Pool命中率，而且这个算法天然会对被驱动表的数据做多次访问，更容易将这些数据页放到Buffer Pool的头部（请参考[第35篇文章](<https://time.geekbang.org/column/article/80147>)中的相关内容)；

  2. 即使被驱动表数据都在内存中，每次查找“下一个记录的操作”，都是类似指针操作。而join_buffer中是数组，遍历的成本更低。


所以说，BNL算法的性能会更好。

# distinct 和 group by的性能

在第37篇文章[《什么时候会使用内部临时表？》](<https://time.geekbang.org/column/article/80477>)中，@老杨同志 提了一个好问题：如果只需要去重，不需要执行聚合函数，distinct 和group by哪种效率高一些呢？

我来展开一下他的问题：如果表t的字段a上没有索引，那么下面这两条语句：
    
    
    select a from t group by a order by null;
    select distinct a from t;
    

的性能是不是相同的?

首先需要说明的是，这种group by的写法，并不是SQL标准的写法。标准的group by语句，是需要在select部分加一个聚合函数，比如：
    
    
    select a,count(*) from t group by a order by null;
    

这条语句的逻辑是：按照字段a分组，计算每组的a出现的次数。在这个结果里，由于做的是聚合计算，相同的a只出现一次。

> 备注：这里你可以顺便复习一下[第37篇文章](<https://time.geekbang.org/column/article/80477>)中关于group by的相关内容。

没有了count(*)以后，也就是不再需要执行“计算总数”的逻辑时，第一条语句的逻辑就变成是：按照字段a做分组，相同的a的值只返回一行。而这就是distinct的语义，所以不需要执行聚合函数时，distinct 和group by这两条语句的语义和执行流程是相同的，因此执行性能也相同。

这两条语句的执行流程是下面这样的。

  1. 创建一个临时表，临时表有一个字段a，并且在这个字段a上创建一个唯一索引；

  2. 遍历表t，依次取数据插入临时表中：

     * 如果发现唯一键冲突，就跳过；
     * 否则插入成功；
  3. 遍历完成后，将临时表作为结果集返回给客户端。


# 备库自增主键问题

除了性能问题，大家对细节的追问也很到位。在第39篇文章[《自增主键为什么不是连续的？》](<https://time.geekbang.org/column/article/80531>)评论区，@帽子掉了 同学问到：在binlog_format=statement时，语句A先获取id=1，然后语句B获取id=2；接着语句B提交，写binlog，然后语句A再写binlog。这时候，如果binlog重放，是不是会发生语句B的id为1，而语句A的id为2的不一致情况呢？

首先，这个问题默认了“自增id的生成顺序，和binlog的写入顺序可能是不同的”，这个理解是正确的。

其次，这个问题限定在statement格式下，也是对的。因为row格式的binlog就没有这个问题了，Write row event里面直接写了每一行的所有字段的值。

而至于为什么不会发生不一致的情况，我们来看一下下面的这个例子。
    
    
    create table t(id int auto_increment primary key);
    insert into t values(null);
    

<!-- image:  -->

图7 insert 语句的binlog

可以看到，在insert语句之前，还有一句SET INSERT_ID=1。这条命令的意思是，这个线程里下一次需要用到自增值的时候，不论当前表的自增值是多少，固定用1这个值。

这个SET INSERT_ID语句是固定跟在insert语句之前的，比如@帽子掉了同学提到的场景，主库上语句A的id是1，语句B的id是2，但是写入binlog的顺序先B后A，那么binlog就变成：
    
    
    SET INSERT_ID=2;
    语句B；
    SET INSERT_ID=1;
    语句A；
    

你看，在备库上语句B用到的INSERT_ID依然是2，跟主库相同。

因此，即使两个INSERT语句在主备库的执行顺序不同，自增主键字段的值也不会不一致。

# 小结

今天这篇答疑文章，我选了4个好问题和你分享，并做了分析。在我看来，能够提出好问题，首先表示这些同学理解了我们文章的内容，进而又做了深入思考。有你们在认真的阅读和思考，对我来说是鼓励，也是动力。

说实话，短短的三篇答疑文章无法全部展开同学们在评论区留下的高质量问题，之后有的同学还会二刷，也会有新的同学加入，大家想到新的问题就请给我留言吧，我会继续关注评论区，和你在评论区交流。

老规矩，答疑文章也是要有课后思考题的。

在[第8篇文章](<https://time.geekbang.org/column/article/70562>)的评论区， @XD同学提到一个问题：他查看了一下innodb_trx，发现这个事务的trx_id是一个很大的数（281479535353408），而且似乎在同一个session中启动的会话得到的trx_id是保持不变的。当执行任何加写锁的语句后，trx_id都会变成一个很小的数字（118378）。

你可以通过实验验证一下，然后分析看看，事务id的分配规则是什么，以及MySQL为什么要这么设计呢？

你可以把你的结论和分析写在留言区，我会在下一篇文章和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

# 上期问题时间

上期的问题是，怎么给分区表t创建自增主键。由于MySQL要求主键包含所有的分区字段，所以肯定是要创建联合主键的。

这时候就有两种可选：一种是(ftime, id)，另一种是(id, ftime)。

如果从利用率上来看，应该使用(ftime, id)这种模式。因为用ftime做分区key，说明大多数语句都是包含ftime的，使用这种模式，可以利用前缀索引的规则，减少一个索引。

这时的建表语句是：
    
    
    CREATE TABLE `t` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `ftime` datetime NOT NULL,
      `c` int(11) DEFAULT NULL,
      PRIMARY KEY (`ftime`,`id`)
    ) ENGINE=MyISAM DEFAULT CHARSET=latin1
    PARTITION BY RANGE (YEAR(ftime))
    (PARTITION p_2017 VALUES LESS THAN (2017) ENGINE = MyISAM,
     PARTITION p_2018 VALUES LESS THAN (2018) ENGINE = MyISAM,
     PARTITION p_2019 VALUES LESS THAN (2019) ENGINE = MyISAM,
     PARTITION p_others VALUES LESS THAN MAXVALUE ENGINE = MyISAM);
    

当然，我的建议是你要尽量使用InnoDB引擎。InnoDB表要求至少有一个索引，以自增字段作为第一个字段，所以需要加一个id的单独索引。
    
    
    CREATE TABLE `t` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `ftime` datetime NOT NULL,
      `c` int(11) DEFAULT NULL,
      PRIMARY KEY (`ftime`,`id`),
      KEY `id` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    PARTITION BY RANGE (YEAR(ftime))
    (PARTITION p_2017 VALUES LESS THAN (2017) ENGINE = InnoDB,
     PARTITION p_2018 VALUES LESS THAN (2018) ENGINE = InnoDB,
     PARTITION p_2019 VALUES LESS THAN (2019) ENGINE = InnoDB,
     PARTITION p_others VALUES LESS THAN MAXVALUE ENGINE = InnoDB);
    

当然把字段反过来，创建成：
    
    
      PRIMARY KEY (`id`,`ftime`),
      KEY `id` (`ftime`)
    

也是可以的。

评论区留言点赞板：

> @夹心面包 、@郭江伟 同学提到了最后一种方案。

> @aliang 同学提了一个好问题，关于open_files_limit和innodb_open_files的关系，我在回复中做了说明，大家可以看一下。

> @万勇 提了一个好问题，实际上对于现在官方的版本，将字段加在中间还是最后，在性能上是没差别的。但是，我建议大家养成习惯（如果你是DBA就帮业务开发同学养成习惯），将字段加在最后面，因为这样还是比较方便操作的。这个问题，我也在评论的答复中做了说明，你可以看一下。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

永恒记忆

[__ 2](<javascript:;>)

老师，看评论包括您的回复说“ left join 后加上 where 的话， 肯定会被优化器优化成 join where 的形式， 那是否下次写 left join ..where 的时候， 不如直接写成 join .. where”，这个也是分情况的吧比如还是文章中的2张表，select * from a left join b on(a.f1=b.f1) where (a.f2=2);/*Q5*/和select * from a join b on(a.f1=b.f1) where (a.f2=2);/*Q6*/ 这个left join和join的语意和返回结果都不一样，怎么能直接写成join呢，如果是where b.f2=xx 的where条件可以直接写成join因为根据结果是不需要left的。 

2019-02-25

__ 作者回复

嗯 我的意思是，如果where条件里面，用到了b.f2的判断，干脆就直接写成join，不需要left join了  
  
  
如果业务逻辑需要left join， 就要把条件都放到on里面  
  
业务逻辑正确性还是优先的

2019-02-25

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83eop9WylZJicLQxlvXukXUgPp39zJHyyReK5s1C9VhA6rric7GiarbfQMuWhdCCDdxdfL610Hc4cNkn9Q/132)

还一棵树

[__ 1](<javascript:;>)

看到 BNL 算法，你就应该知道这条语句的执行流程其实是这样  
文章中的流程是写错了？还是我理解的有问题  
1、如果是a表数据放入join buffer，根据b的每一条记录去判断是否在a中 如果在则保留记录  
这个更像是b left join a。 而不是a left join b  
2、如果按照这个流程，比如a里面有2行重复的数据， 如果拿b的数据在a中判断，存在则保留，那结果集只有一条数据， 而按照a left join b 会出现2条结果的 

2019-02-26

__ 作者回复

  
“如果按照这个流程，比如a里面有2行重复的数据， 如果拿b的数据在a中判断，存在则保留，那结果集只有一条数据，”  
  
不会呀，你看它是这样的：  
假设join buffer中有两个行1  
  
然后被驱动表取出一个1，  
跟join buffer中第一个1比较，发现满足条件，放到结果集；  
跟join buffer中第二个1比较，发现满足条件，放到结果集；  
  
是得到两行的

2019-03-01

  * <!-- image:  -->

宝玉

[__ 1](<javascript:;>)

老师，BNl算法，如果where条件中有驱动表的过滤条件，也不会在join时候全部载入内存吧？ 

2019-02-25

__ 作者回复

对，驱动表现过滤，然后进join buffer  


2019-02-25

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/fJ5BEicRVnXAwCxkIYhJZ0woiaQ38ibUYkYH125bzL2Y2ib1YS9b7Q9S5qia2Cia9UWzUoDBGeWJibB7p9xSnib7iaU8kzw/132)

千木

[__ 1](<javascript:;>)

老师您好，join使用join_buffer和内存区别那个问题的第一点解释我还是有些纳闷，你说由于从磁盘拿数据到内存里面会导致等等的性能问题我能够理解，但是说即使使用nbl算法也会涉及到从磁盘拿数据到内存吧，所以这点导致两种算法执行差异貌似不太合理，您觉得呢？ 

2019-02-23

__ 作者回复

BNL算法拿的数据是确定的只会拿一次（遍历一遍）  
而simple nested loop join是会遍历多次的

2019-02-24

  * <!-- image:  -->

白永伟

[__ 1](<javascript:;>)

老师，关于备库自增id我有一个问题。既然binlog不管是statement模式还是row模式，里面的insert语句跟着的自增id都是固定的。那假如发生主备切换，备库变成主库后，客户端往新主库里插入数据时，自增id的起始值是多少，有没有可能跟已有的记录id冲突？尤其是备库还没有处理完同步过来的binlog就开始接受客户端请求时。如果要求备库必须处理完binlog才能接受客户端请求，那么怎么保证主备切换的过程中，不影响用户使用。谢谢。 

2019-02-22

__ 作者回复

“自增id的起始值是多少，有没有可能跟已有的记录id冲突？”   
如果没有主备延迟就不会出现；  
  
“尤其是备库还没有处理完同步过来的binlog就开始接受客户端请求时。” ， 对，这种情况就会。  
  
“如果要求备库必须处理完binlog才能接受客户端请求，那么怎么保证主备切换的过程中，不影响用户使用” 一般都是有这个要求的。要尽量减少影响，就是控制主备延迟。  
  


2019-02-24

  * <!-- image:  -->

Chris

[__ 0](<javascript:;>)

这两天在线上遇到一个比较诡异的事情，突然有几分钟连不上MySQL，通过error日志和监控的processlist显示，MySQL把很多链接都kill掉了，但处于sleep状态和show status的语句没有kill，看监控的资源使用情况不是很高，只是innodb rows read指标特别高，现在完全是没头绪了 

2019-03-15

__ 作者回复

看看是不是有什么外部工具在工作

2019-03-16

  * <!-- image:  -->

长杰

[__ 0](<javascript:;>)

select * from a left join b on(a.f1=b.f1) where (a.f2=b.f2);  
老师，这个语句是否可以理解为:先按照on后面的条件关联，获取结果集，然后对结果集用where条件进行二次过滤？  


2019-03-02

__ 作者回复

要看索引哈  
如果b上的索引只有f1 是的，  
如果b上的索引是(f1,f2)，就两个一起关联了  
【咱们文中说了，这个语句会被转成普通join哦】

2019-03-02

  * <!-- image:  -->

长杰

[__ 0](<javascript:;>)

把表 a 的内容读入 join_buffer 中。因为是 select * ，所以字段 f1 和 f2 都被放入 join_buffer 了。  
  
顺序扫描表 b，对于每一行数据，判断 join 条件（也就是 a.f1=b.f1 and a.f2=b.f2) 是否满足，满足条件的记录, 作为结果集的一行返回。如果语句中有 where 子句，需要先判断 where 部分满足条件后，再返回。  
  
表 b 扫描完成后，对于没有被匹配的表 a 的行（在这个例子中就是 (1,1)、(2,2) 这两行），把剩余字段补上 NULL，再放入结果集中。  
  
是否可以理解为:假如有where条件的情况下，对与满足on条件的行，再去过滤where条件，满足就返回；对于不满足on条件的行，b字段补Null后返回，不需要再过滤where条件 

2019-03-02

__ 作者回复

不是，如果有where,并且where里面有用到b.f1或b.f2, 那就要求结果集里面没有这些null的行。  
  
就是说where a.f2=b.f2的意思是  
Where (a.f2 is not null) and (b.f2 is not null) and (a.f2 =b.f2)

2019-03-02

  * <!-- image:  -->

梦康

[__ 0](<javascript:;>)

😂留言的人太多，辛苦老实答疑了。虽然我的问题没能被翻牌子 

2019-02-25

__ 作者回复

不好意思，确实你的问题比较难一些  
  
最近在做收尾的工作，后面一定会把问题都清理掉的哈。  
  
你的问题质量高，是我喜欢回答的问题类型😆

2019-02-25

  * <!-- image:  -->

PYH

[__ 0](<javascript:;>)

你好 我想问一下mysql能实现oracle的拉链表么。如果能前提条件是什么？ 

2019-02-24

  * <!-- image:  -->

龙文

[__ 0](<javascript:;>)

明白了 谢谢老师！ 

2019-02-24

__ 作者回复

👍

2019-02-24

  * <!-- image:  -->

滔滔

[__ 0](<javascript:;>)

老师您好，想请问下在innodb引擎rr隔离级别下，单独的一条update语句是不是默认就是一个事务(在执行update前不输入begin)，而单独的一条select语句是不是不会开启一个事务，哪怕是"当前读"也不会开启一个事务，更进一步，是不是对表的增删改操作默认都会开启一个事务？🤔 

2019-02-24

__ 作者回复

1\. 单独一个update，会启动一个事务  
2\. 单独一个select，也会启动一个事务  
3\. innodb表，增删改查都会启动一个事务

2019-02-24

  * <!-- image:  -->

发条橙子 。

[__ 0](<javascript:;>)

啧啧， 原来我写的 left join 一直都不是标准的，每次后面都会加上 where ， 还一直以为左面是驱动表 。既然实际上 left join 后加上 where 的话， 肯定会被优化器优化成 join where 的形式， 那是否下次写 left join ..where 的时候， 不如直接写成 join .. where ，省去优化器自己去优化，这样是不是稍稍快些 

2019-02-23

__ 作者回复

是的  
  
如果原来就有where，说明原来其实也不用left join 😆  


2019-02-23

  * <!-- image:  -->

龙文

[__ 0](<javascript:;>)

老师你好，我在第21讲求助了一个死锁问题，当时你回复说后面会解答，不过我浏览了下后续文章没找到解答，所以再次求助下。ps:用的阿里云的rds,提了工单没效果啊  
作者回复: 有的，你看一下第40篇 “insert 唯一键冲突”这一段  
  
ps:我已经离开阿里云挺久的了 😆  
  
\---------------------------------------------  
谢谢老师,我看了第40篇,还是有地方不太明白,再打扰下  
mysql 版本5.6  
隔离级别为rc  
CREATE TABLE `uk_test` (  
`id` bigint(20) NOT NULL AUTO_INCREMENT,  
`a` int(11) NOT NULL,  
`b` int(11) NOT NULL,  
`c` int(11) NOT NULL,  
PRIMARY KEY (`id`),  
UNIQUE KEY `uk_a_b` (`a`,`b`) USING BTREE  
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4  
表中数据：  
+----+---+---+---+  
| id | a | b | c |  
+----+---+---+---+  
| 1 | 1 | 1 | 2 |  
| 6 | 1 | 2 | 1 |  
+----+---+---+---+  
sql:执行顺序  
session1:begin;  
session2:begin;  
session1:select * from uk_test where a = 1 and b = 1 for update;  
session2:select * from uk_test where a = 1 and b = 1 for update;  
session1:insert into uk_test (a,b,c) values(1,1,2) on duplicate key update c = 2;  
session2:ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction  
  
我的疑问是:  
1.rc隔离级别下对唯一键的insert也会加next-key lock吗？  
  
2.死锁日志显示  
session 1已经成功加上行锁(lock_mode X locks rec but not gap),  
  
session 2在等待同一个行锁(lock_mode X locks rec but not gap waiting),  
  
session1这时因为等待lock_mode X waiting而死锁。  
这里的lock_mode X waiting是指next-key lock吗？  
如果是的话，没想明白这里怎么形成资源循环等待了？  
我的猜测是session1 这时持有行锁，要next-key lock 所以要去加gap锁。session 2持有gap锁在等行锁。但如果是这样为什么session2 在rc下select for update，且记录存在时会加gap锁?还有gap锁加锁不是不互斥吗？  


2019-02-23

__ 作者回复

1\. 会  
2\. 你这里  
session 1 成功加锁一个record lock；  
  
session 2执行的是一个select 语句，而且a=1 and b=1就只锁一行（a，b上有联合唯一索引），这里就是要申请一个记录行锁(but not gap waiting)。  
这里虽然没有加锁成功，但是已经加入了锁队列（只是这个锁是处于等待状态）  
\---这时候队列里面有两个锁对象了  
  
然后session 1 再insert失败的时候，就要加next-key lock，（注意这个锁对象跟第一个锁对象不同）。  
然后死锁检测看到，2号锁在等1号锁；3号要等2号，而3和1又是同一个session，就认为是死锁了。

2019-02-24

  * <!-- image:  -->

龙文

[__ 0](<javascript:;>)

老师你好，我在第21讲求助了一个死锁问题，当时你回复说后面会解答，不过我浏览了下后续文章没找到解答，所以再次求助下。ps:用的阿里云的rds,提了工单没效果啊 

2019-02-23

__ 作者回复

有的，你看一下第40篇 “insert 唯一键冲突”这一段  
  
ps:我已经离开阿里云挺久的了 😆

2019-02-23

  * <!-- image:  -->

夜空中最亮的星（华仔）

[__ 0](<javascript:;>)

订阅了好几个专栏 mysql这个是最优先看的，别的专栏可以跟不上 这个必须跟上，老师计划出第二季吗？ 

2019-02-22

  * <!-- image:  -->

夜空中最亮的星（华仔）

[__ 0](<javascript:;>)

这么快就要结束，好快啊 

2019-02-22

__ 作者回复

跟进得很快啊大家😆

2019-02-22

  * <!-- image:  -->

一大只😴

[__ 0](<javascript:;>)

老师好，我做了下课后题的实验，不清楚为啥设计，下面记录了我看到的现象，不一定对哈。  
使用start transaction with consistent snapshot;  
同一个session的开启快照事务后的trx_id很大并且一致，如果关闭这个session，开启另一个session使用snapshot，初始值的trx_id也是与之前的session一致的。  
  
如果再打开第二个session使用snapshot，第一次查询trx表，会发现第一个session还是很大只，第二个打开的trx_id会很小，但这个很小的trx_id是第一个打开的session的最小trx_id+1。这时，如果commit；再start snapshot，那么将会出现一个比第一个session还要大一点的trx_id，我开了几个session，第一次是+24，随后都是加12，如下图：  
+---------------------+-----------------+  
| trx_mysql_thread_id | trx_id |  
+---------------------+-----------------+  
| 14672 | 421259275839776 |  
| 14661 | 421259275838864 |  
| 14645 | 421259275837952 |  
| 14587 | 421259275837040 |  
| 14578 | 421259275835216 |  
+---------------------+-----------------+  
  
只有一个session打开snapshot情况下，trx_id在commit后会增加，但在事务内不会看到trx_id增加,使用select,select lock in share mode不会导致trx_id增加。  
  
一个ddl操作应该是 trx_id+18  
  
不在事务内的dml操作：  
delete 1条 trx_id+2   
delete 多条 trx_id+6  
insert 1条 trx_id+1  
insert values (),()...多条trx_id+5  
update 1条 trx_id+2  
update 多条 trx_id+6  
  
snapshot事务内的dml操作：  
事务内先select * from tb for update;再delete from tb where id=xxx;这样的delete trx_id+1  
如果是事务内直接delete from tb where id=xxx;或delete from tb;这样的delete trx_id+6  
  
事务内update 1条 trx_id+2，如果先select * fom tb for update;再update 1条，有时候是trx_id+2，有时候是trx_id+5  
事务内update 多条 trx_id+6  


2019-02-22

__ 作者回复

很好的验证  
下一篇文章会讲到哈

2019-02-23

  * <!-- image:  -->

万勇

[__ 0](<javascript:;>)

感谢老师上一期的解答，还请教一个分区表的问题，分区表创建的聚集索引是分区本地维护的吧，但是主键索引要保证全局唯一性。那分区和主键索引之间是不是要建立一种关系？另外分区表如果我们创建普通索引，按道理可以分区创建的，分区维护自己的普通索引，各分区之间互不影响。 

2019-02-22

__ 作者回复

就是我这篇末尾建议的几种建表方法,就是建立联系了

2019-02-22

  * <!-- image:  -->

克劳德

[__ 0](<javascript:;>)

老师好，如果group by用作数据去重，根据文章中描述的，流程2会遍历表依次插入进临时表。  
我理解的遍历表是通过扫描主键索引来做的，因此同一组的记录只会留下主键值最小的那个，是否正确？  
能否通过扫描其他索引，来达到去重后的记录不按照主键值来决定？  


2019-02-22

__ 作者回复

1.对,就是扫描这个索引的过程中,第一个碰到的值  
2\. 可以,你用force index试试

2019-02-22

---

## 45. 自增 id 用完怎么办？

<!-- image:  -->

MySQL里有很多自增的id，每个自增id都是定义了初始值，然后不停地往上加步长。虽然自然数是没有上限的，但是在计算机里，只要定义了表示这个数的字节长度，那它就有上限。比如，无符号整型(unsigned int)是4个字节，上限就是232-1。

既然自增id有上限，就有可能被用完。但是，自增id用完了会怎么样呢？

今天这篇文章，我们就来看看MySQL里面的几种自增id，一起分析一下它们的值达到上限以后，会出现什么情况。

# 表定义自增值id

说到自增id，你第一个想到的应该就是表结构定义里的自增字段，也就是我在第39篇文章[《自增主键为什么不是连续的？》](<https://time.geekbang.org/column/article/80531>)中和你介绍过的自增主键id。

表定义的自增值达到上限后的逻辑是：再申请下一个id时，得到的值保持不变。

我们可以通过下面这个语句序列验证一下：
    
    
    create table t(id int unsigned auto_increment primary key) auto_increment=4294967295;
    insert into t values(null);
    //成功插入一行 4294967295
    show create table t;
    /* CREATE TABLE `t` (
      `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4294967295;
    */
    
    insert into t values(null);
    //Duplicate entry '4294967295' for key 'PRIMARY'
    

可以看到，第一个insert语句插入数据成功后，这个表的AUTO_INCREMENT没有改变（还是4294967295），就导致了第二个insert语句又拿到相同的自增id值，再试图执行插入语句，报主键冲突错误。

232-1（4294967295）不是一个特别大的数，对于一个频繁插入删除数据的表来说，是可能会被用完的。因此在建表的时候你需要考察你的表是否有可能达到这个上限，如果有可能，就应该创建成8个字节的bigint unsigned。

# InnoDB系统自增row_id

如果你创建的InnoDB表没有指定主键，那么InnoDB会给你创建一个不可见的，长度为6个字节的row_id。InnoDB维护了一个全局的dict_sys.row_id值，所有无主键的InnoDB表，每插入一行数据，都将当前的dict_sys.row_id值作为要插入数据的row_id，然后把dict_sys.row_id的值加1。

实际上，在代码实现时row_id是一个长度为8字节的无符号长整型(bigint unsigned)。但是，InnoDB在设计时，给row_id留的只是6个字节的长度，这样写到数据表中时只放了最后6个字节，所以row_id能写到数据表中的值，就有两个特征：

  1. row_id写入表中的值范围，是从0到248-1；

  2. 当dict_sys.row_id=248时，如果再有插入数据的行为要来申请row_id，拿到以后再取最后6个字节的话就是0。


也就是说，写入表的row_id是从0开始到248-1。达到上限后，下一个值就是0，然后继续循环。

当然，248-1这个值本身已经很大了，但是如果一个MySQL实例跑得足够久的话，还是可能达到这个上限的。在InnoDB逻辑里，申请到row_id=N后，就将这行数据写入表中；如果表中已经存在row_id=N的行，新写入的行就会覆盖原有的行。

要验证这个结论的话，你可以通过gdb修改系统的自增row_id来实现。注意，用gdb改变量这个操作是为了便于我们复现问题，只能在测试环境使用。

<!-- image:  -->

图1 row_id用完的验证序列

<!-- image:  -->

图2 row_id用完的效果验证

可以看到，在我用gdb将dict_sys.row_id设置为248之后，再插入的a=2的行会出现在表t的第一行，因为这个值的row_id=0。之后再插入的a=3的行，由于row_id=1，就覆盖了之前a=1的行，因为a=1这一行的row_id也是1。

从这个角度看，我们还是应该在InnoDB表中主动创建自增主键。因为，表自增id到达上限后，再插入数据时报主键冲突错误，是更能被接受的。

毕竟覆盖数据，就意味着数据丢失，影响的是数据可靠性；报主键冲突，是插入失败，影响的是可用性。而一般情况下，可靠性优先于可用性。

# Xid

在第15篇文章[《答疑文章（一）：日志和索引相关问题》](<https://time.geekbang.org/column/article/73161>)中，我和你介绍redo log和binlog相配合的时候，提到了它们有一个共同的字段叫作Xid。它在MySQL中是用来对应事务的。

那么，Xid在MySQL内部是怎么生成的呢？

MySQL内部维护了一个全局变量global_query_id，每次执行语句的时候将它赋值给Query_id，然后给这个变量加1。如果当前语句是这个事务执行的第一条语句，那么MySQL还会同时把Query_id赋值给这个事务的Xid。

而global_query_id是一个纯内存变量，重启之后就清零了。所以你就知道了，在同一个数据库实例中，不同事务的Xid也是有可能相同的。

但是MySQL重启之后会重新生成新的binlog文件，这就保证了，同一个binlog文件里，Xid一定是惟一的。

虽然MySQL重启不会导致同一个binlog里面出现两个相同的Xid，但是如果global_query_id达到上限后，就会继续从0开始计数。从理论上讲，还是就会出现同一个binlog里面出现相同Xid的场景。

因为global_query_id定义的长度是8个字节，这个自增值的上限是264-1。要出现这种情况，必须是下面这样的过程：

  1. 执行一个事务，假设Xid是A；

  2. 接下来执行264次查询语句，让global_query_id回到A；

  3. 再启动一个事务，这个事务的Xid也是A。


不过，264这个值太大了，大到你可以认为这个可能性只会存在于理论上。

# Innodb trx_id

Xid和InnoDB的trx_id是两个容易混淆的概念。

Xid是由server层维护的。InnoDB内部使用Xid，就是为了能够在InnoDB事务和server之间做关联。但是，InnoDB自己的trx_id，是另外维护的。

其实，你应该非常熟悉这个trx_id。它就是在我们在第8篇文章[《事务到底是隔离的还是不隔离的？》](<https://time.geekbang.org/column/article/70562>)中讲事务可见性时，用到的事务id（transaction id）。

InnoDB内部维护了一个max_trx_id全局变量，每次需要申请一个新的trx_id时，就获得max_trx_id的当前值，然后并将max_trx_id加1。

InnoDB数据可见性的核心思想是：每一行数据都记录了更新它的trx_id，当一个事务读到一行数据的时候，判断这个数据是否可见的方法，就是通过事务的一致性视图与这行数据的trx_id做对比。

对于正在执行的事务，你可以从information_schema.innodb_trx表中看到事务的trx_id。

我在上一篇文章的末尾留给你的思考题，就是关于从innodb_trx表里面查到的trx_id的。现在，我们一起来看一个事务现场：

<!-- image:  -->

图3 事务的trx_id

session B里，我从innodb_trx表里查出的这两个字段，第二个字段trx_mysql_thread_id就是线程id。显示线程id，是为了说明这两次查询看到的事务对应的线程id都是5，也就是session A所在的线程。

可以看到，T2时刻显示的trx_id是一个很大的数；T4时刻显示的trx_id是1289，看上去是一个比较正常的数字。这是什么原因呢？

实际上，在T1时刻，session A还没有涉及到更新，是一个只读事务。而对于只读事务，InnoDB并不会分配trx_id。也就是说：

  1. 在T1时刻，trx_id的值其实就是0。而这个很大的数，只是显示用的。一会儿我会再和你说说这个数据的生成逻辑。

  2. 直到session A 在T3时刻执行insert语句的时候，InnoDB才真正分配了trx_id。所以，T4时刻，session B查到的这个trx_id的值就是1289。


需要注意的是，除了显而易见的修改类语句外，如果在select 语句后面加上for update，这个事务也不是只读事务。

在上一篇文章的评论区，有同学提出，实验的时候发现不止加1。这是因为：

  1. update 和 delete语句除了事务本身，还涉及到标记删除旧数据，也就是要把数据放到purge队列里等待后续物理删除，这个操作也会把max_trx_id+1， 因此在一个事务中至少加2；

  2. InnoDB的后台操作，比如表的索引信息统计这类操作，也是会启动内部事务的，因此你可能看到，trx_id值并不是按照加1递增的。


那么，**T2时刻查到的这个很大的数字是怎么来的呢？**

其实，这个数字是每次查询的时候由系统临时计算出来的。它的算法是：把当前事务的trx变量的指针地址转成整数，再加上248。使用这个算法，就可以保证以下两点：

  1. 因为同一个只读事务在执行期间，它的指针地址是不会变的，所以不论是在 innodb_trx还是在innodb_locks表里，同一个只读事务查出来的trx_id就会是一样的。

  2. 如果有并行的多个只读事务，每个事务的trx变量的指针地址肯定不同。这样，不同的并发只读事务，查出来的trx_id就是不同的。


那么，**为什么还要再加上2 48呢？**

在显示值里面加上248，目的是要保证只读事务显示的trx_id值比较大，正常情况下就会区别于读写事务的id。但是，trx_id跟row_id的逻辑类似，定义长度也是8个字节。因此，在理论上还是可能出现一个读写事务与一个只读事务显示的trx_id相同的情况。不过这个概率很低，并且也没有什么实质危害，可以不管它。

另一个问题是，**只读事务不分配trx_id，有什么好处呢？**

  * 一个好处是，这样做可以减小事务视图里面活跃事务数组的大小。因为当前正在运行的只读事务，是不影响数据的可见性判断的。所以，在创建事务的一致性视图时，InnoDB就只需要拷贝读写事务的trx_id。
  * 另一个好处是，可以减少trx_id的申请次数。在InnoDB里，即使你只是执行一个普通的select语句，在执行过程中，也是要对应一个只读事务的。所以只读事务优化后，普通的查询语句不需要申请trx_id，就大大减少了并发事务申请trx_id的锁冲突。


由于只读事务不分配trx_id，一个自然而然的结果就是trx_id的增加速度变慢了。

但是，max_trx_id会持久化存储，重启也不会重置为0，那么从理论上讲，只要一个MySQL服务跑得足够久，就可能出现max_trx_id达到248-1的上限，然后从0开始的情况。

当达到这个状态后，MySQL就会持续出现一个脏读的bug，我们来复现一下这个bug。

首先我们需要把当前的max_trx_id先修改成248-1。注意：这个case里使用的是可重复读隔离级别。具体的操作流程如下：

<!-- image:  -->

图 4 复现脏读

由于我们已经把系统的max_trx_id设置成了248-1，所以在session A启动的事务TA的低水位就是248-1。

在T2时刻，session B执行第一条update语句的事务id就是248-1，而第二条update语句的事务id就是0了，这条update语句执行后生成的数据版本上的trx_id就是0。

在T3时刻，session A执行select语句的时候，判断可见性发现，c=3这个数据版本的trx_id，小于事务TA的低水位，因此认为这个数据可见。

但，这个是脏读。

由于低水位值会持续增加，而事务id从0开始计数，就导致了系统在这个时刻之后，所有的查询都会出现脏读的。

并且，MySQL重启时max_trx_id也不会清0，也就是说重启MySQL，这个bug仍然存在。

那么，**这个bug也是只存在于理论上吗？**

假设一个MySQL实例的TPS是每秒50万，持续这个压力的话，在17.8年后，就会出现这个情况。如果TPS更高，这个年限自然也就更短了。但是，从MySQL的真正开始流行到现在，恐怕都还没有实例跑到过这个上限。不过，这个bug是只要MySQL实例服务时间够长，就会必然出现的。

当然，这个例子更现实的意义是，可以加深我们对低水位和数据可见性的理解。你也可以借此机会再回顾下第8篇文章[《事务到底是隔离的还是不隔离的？》](<https://time.geekbang.org/column/article/70562>)中的相关内容。

# thread_id

接下来，我们再看看线程id（thread_id）。其实，线程id才是MySQL中最常见的一种自增id。平时我们在查各种现场的时候，show processlist里面的第一列，就是thread_id。

thread_id的逻辑很好理解：系统保存了一个全局变量thread_id_counter，每新建一个连接，就将thread_id_counter赋值给这个新连接的线程变量。

thread_id_counter定义的大小是4个字节，因此达到232-1后，它就会重置为0，然后继续增加。但是，你不会在show processlist里看到两个相同的thread_id。

这，是因为MySQL设计了一个唯一数组的逻辑，给新线程分配thread_id的时候，逻辑代码是这样的：
    
    
    do {
      new_id= thread_id_counter++;
    } while (!thread_ids.insert_unique(new_id).second);
    

这个代码逻辑简单而且实现优雅，相信你一看就能明白。

# 小结

今天这篇文章，我给你介绍了MySQL不同的自增id达到上限以后的行为。数据库系统作为一个可能需要7*24小时全年无休的服务，考虑这些边界是非常有必要的。

每种自增id有各自的应用场景，在达到上限后的表现也不同：

  1. 表的自增id达到上限后，再申请时它的值就不会改变，进而导致继续插入数据时报主键冲突的错误。

  2. row_id达到上限后，则会归0再重新递增，如果出现相同的row_id，后写的数据会覆盖之前的数据。

  3. Xid只需要不在同一个binlog文件中出现重复值即可。虽然理论上会出现重复值，但是概率极小，可以忽略不计。

  4. InnoDB的max_trx_id 递增值每次MySQL重启都会被保存起来，所以我们文章中提到的脏读的例子就是一个必现的bug，好在留给我们的时间还很充裕。

  5. thread_id是我们使用中最常见的，而且也是处理得最好的一个自增id逻辑了。


当然，在MySQL里还有别的自增id，比如table_id、binlog文件序号等，就留给你去验证和探索了。

不同的自增id有不同的上限值，上限值的大小取决于声明的类型长度。而我们专栏声明的上限id就是45，所以今天这篇文章也是我们的最后一篇技术文章了。

既然没有下一个id了，课后也就没有思考题了。今天，我们换一个轻松的话题，请你来说说，读完专栏以后有什么感想吧。

这个“感想”，既可以是你读完专栏前后对某一些知识点的理解发生的变化，也可以是你积累的学习专栏文章的好方法，当然也可以是吐槽或者对未来的期望。

欢迎你给我留言，我们在评论区见，也欢迎你把这篇文章分享给更多的朋友一起阅读。

<!-- image:  -->

##  精选留言

  * <!-- image:  -->

Continue

[__ 12](<javascript:;>)

跟着学了三个多月，受益匪浅，学到了很多新的知识和其中的原理！ 

2019-02-25

__ 作者回复

早🤝

2019-02-25

  * <!-- image:  -->

克劳德

[__ 7](<javascript:;>)

本人服务端工程师，在学习这门课之前数据库一直是我的短板，曾听朋友说MySQL或数据库中涉及了很多方面的知识点，每一个拿出来展开讲几乎都能出一本书了，对数据库是越来越忌惮，同时也因为工作上并没有过多接触，水平便一直停留在编写简单SQL层面。  
在面试中被问到数据库问题，只能无奈的说这块不太清楚，也曾在网上自学过，但网上的文章知识点比较零散，很多都是给出一些结论性的观点，由于不了解其内部原理，记忆很难深刻。  
老实说，当初报这门课的时候就像买技术书籍一样，我相信大家都有这样的体会，以为买到了就等于学到了，所以有一段时间没有点开看过，以至于后面开始学的时候都是在追赶老师和大家的进度，唯一遗憾的地方就是没能跟老师及时留言互动。  
这门课虽然是文字授课，但字里行间给我的感觉就是很亲切很舒服，为什么呢，因为老师可以把晦涩的知识变得通俗易懂，有时我在思考，如果让我来讲一个自己擅长的领域是否也能做到这一点，如果要做到的话需要什么样的知识储备呢。  
最后真要感谢老师的这门课，让我从心里不再惧怕数据库问题，不管是工作还是面试中信心倍增，现在时不时都敢和我们DBA“切磋切磋“了，哈哈。  
祝好~ 

2019-02-25

__ 作者回复

👍“切磋切磋“  
  
留言不会“过时”哈，在对应的章节下面提出相关的问题，我会持续关注评论区  


2019-02-25

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/1hp9kzzuLUVHzmmddIPIO2OgUWr1ibJRr8cMoB7K0fwx8Vmn34L8yN2NoYUtgNicfPGaXKF02pQ2huXd59r2I0kw/132)

三胖

[__ 3](<javascript:;>)

老师，我才学了四分之一的课程，但是这门课已经更新完了，我是直接跑到最后一节技术篇来留言的！很想知道，后来者比如我在学到后面的课程时遇到问题留言，老师还会看会回复吗？（老师的课程超值！！） 

2019-02-25

__ 作者回复

会看的  
  
后台系统是按照留言时间显示的  
而且我在这事情上有强迫症，一定会让“未处理问题”变成0的😆  
  
只是说如果是其他同学评论区问过的问题，我可能就不会重复回复了

2019-02-25

  * <!-- image:  -->

某、人

[__ 2](<javascript:;>)

很遗憾没能坚持到最后,但是也很庆幸能遇到这么好的专栏。以前了解mysql都是一些零散的知识点,通过学习完专栏,不论是mysql整体架构还是基础的知识点,都有了更深的认识。以后就把老师的文档当官方文档查,出现问题先来看看专栏。  
感触特别深的是,老师对于提到的每一个问题,都会严谨又认真的去回答,尽量帮助每一位同学都能有所收获。要做到这一点，是特别耗费精力的。  
感谢老师的传道授业解惑,希望以后有机会能当面向老师请教问题。期待老师下一部杰作 

2019-02-26

__ 作者回复

刚过完年都是很忙的， 找时间补上哈，等你的评论区留言^_^

2019-02-26

  * <!-- image:  -->

夜空中最亮的星（华仔）

[__ 2](<javascript:;>)

不知道是最后一篇，否则的话就慢些读完了；  
我是一名运维，公司也没有DBA，所以MySQL库也归我收拾；  
读了老师的专栏，操作起数据库来，心情更好了；  
老师的课，让我有了想看完《高性能MySQL》的兴趣；  
听了老师的课，开发都来问我数据库的问题了，高兴；  
老师你会有返场吗？我猜会 😄  
可否透漏下接下来的安排，会有续集吗？进阶吗？  
不想这一别就是一生。  
您的从未谋面的学生。 

2019-02-25

__ 作者回复

谢谢你  
  
“开发都来问我数据库的问题了”，当年我也是这么开始“入坑”，加油

2019-02-25

  * <!-- image:  -->

极客时间

[__ 2](<javascript:;>)

通過這個專欄的系統學習，梳理很多知識點、擴展了我對MySQL的認識及以後使用。感謝老師的諄諄教導！ 

2019-02-25

  * <!-- image:  -->

NoDBA

[__ 1](<javascript:;>)

低版本thread_id超过2^32-1后，在general log显示是负数，高版本貌似没有这个问题，是否高版本的thread_id是8字节呢？ 

2019-02-27

__ 作者回复

主要不是定义的问题，而是打印的时候代码问题，按照这个代码输出的：  
"%5ld ", (long) thread_id  
  
是个bug， 超过2^31就变成负数了，  
新版本改了  
  
好问题😆

2019-02-28

  * <!-- image:  -->

kun

[__ 1](<javascript:;>)

感觉戛然而止哈 没学够，后面还会再回顾，老师辛苦！ 

2019-02-26

  * <!-- image:  -->

亮

[__ 1](<javascript:;>)

老师，sql 的where里 < 10001 和 <= 10000有什么区别吗？ 

2019-02-25

__ 作者回复

这要看你关注的是什么  
你这么问，应该这个字段是整型吧？  
  
从查询结果可能是一样的，  
不过锁的范围不同，你可以看下21篇

2019-02-25

  * <!-- image:  -->

IceGeek17

[__ 1](<javascript:;>)

感谢老师，课程受益匪浅，  
课程结束后，如果有问题，是继续在这里的评论区提问，还是会有另外一条答疑通道？  
  
另外，在第35篇我提了几个问题，老师还没有回答，我这里再贴一下，老师看一下  
问题一：  
对于BKA算法的流程理解，用文中的例子，先把t1表（小表）中查询需要的字段放入join_buffer, 然后把join_buffer里的字段值批量传给t2表，先根据索引a查到id，然后得到一批主键id，再根据主键id排序，然后再根据排完序的id去主键索引查数据（这里用到MRR）  
理解是否正确？  
这里对于主键id排序是在哪里做的，是在join_buffer里，还是另外再开辟一块临时内存？如果在join_buffer里，那join_buffer里的每行内容是不是：t2.id + t1查询必须的字段，并且join_buffer里是根据id排序的？  
  
问题二：  
虽然MySQL官方没有支持hash join，但是之前看到文章说，MariaDB已经支持hash join，能不能后续在答疑文章中简单总结下mariaDB支持的join算法  
  
问题三：  
在实际项目中，一个比较困惑的问题，看到过这样的类似写法：  
select xxx from t1 join t2 on t1.id = t2.id for update （目的是获取几个表上最新的数据，并且加上锁，防止数据被更新）  
这里有几个问题：  
1) 像这样 join + for update，表上的加锁规则是怎么样的？是不是在需要join的两个表上根据具体的查询执行过程都加上锁？  
2）像这样 join + for update 的用法是否合理？碰到这样的场景，应该怎么去做？  
  
问题四：  
看过阿里输出的开发手册里，强调 “最多不超过三表join”，实际项目中，给我感觉很难做到所有业务都不超过三表join，那这里的问题就是，有什么相关的经验方法，可以尽量降低参与join的数据表？  
比如，在数据表里添加冗余字段，可以降低参与join的数据表数量，还有什么其他好的方法？  


2019-02-25

__ 作者回复

就在我们评论区，提跟文章相关的内容，会继续关注。  
  
问题一、前面的过程理解正确，MRR过程用的是read_rnd_buffer   
  
问题二、其实我们文中最后那个过程，你把他设想成在MySQL内部执行。。  
  
问题三、这种复杂的语句，你要把我们两部分知识点连起来看。一个原则：for update的话，执行语句过程中扫到的间隙和记录都要加锁。 当然最好是不这么做，拆成两个语句会好些。  
  
问题四、还是我文中的建议，如果都用NLJ或BKA算法的join其实还好，所以看看explain。  
降低join表数量的方法，基本上行就是冗余字段和拆成多个语句这两个方向了

2019-02-25

  * <!-- image:  -->

Leon📷

[__ 1](<javascript:;>)

跟着老师终于学到了最后，每天的地铁时间无比充实，我对mysql的基本原理和工作流程大致有了初步的了解，而不是以前的增删查改，打算以后抽时间再二刷三刷，等全部搞懂后，再去看看高性能mysql这本书，如果时间允许，打算再去自己参照教程实现一个简易的DB，课程虽然结束了，仍然感觉意犹未尽，希望老师拉一个倍洽群，大家一起在里面讨论和学习 

2019-02-25

__ 作者回复

👍   
评论区一直会开放  
  
大家到对应的文章去提相关问题 🤝  
二刷三刷我也一直在哦😆

2019-02-25

  * <!-- image:  -->

Dkey

[__ 1](<javascript:;>)

当前系统并无其他事务存在时，启动一个只读事务时（意味没有事务id），它的低高水位是怎么样的老师。 

2019-02-25

__ 作者回复

假设当前没有其他事务存在，假设当前的max_trx_id=N,  
这时候启动一个只读事务，它的高低水位就都是N。

2019-02-25

  * <!-- image:  -->

shawn

[__ 1](<javascript:;>)

受益匪浅，最后几讲还想了解下null值如何建立索引，由于null直接不能比较和排序，MySQL能区分出每一个null值吗 

2019-02-25

__ 作者回复

可以，因为普通索引上都有主键值对吧，  
  
所以其实是 (null, id1), (null, id2) ....

2019-02-25

  * <!-- image:  -->

亢星东

[__ 0](<javascript:;>)

id是有上限的，这个的id上限是45，这个结局可以，讲的不错，学到很多 

2019-03-13

  * <!-- image:  -->

Bamboo

[__ 0](<javascript:;>)

今天终于读完了，从对MySQL只停留在CRUD操作的水平，慢慢开始对MySQL底层的机制有了一些认识，在遇到问题时，会首先从底层原理去分析，并结合explain来验证自己的分析，一次很nice的学习之旅。感谢大神老师这么认真负责，节假日都不休息，哈哈！ 

2019-03-12

__ 作者回复

👍

2019-03-13

  * <!-- image:  -->

ArtistLu

[__ 0](<javascript:;>)

相遇恨晚😆，安慰下自己，种树的最好时机是十年前，其次是现在！！！谢谢老师 

2019-03-08

__ 作者回复

🤝

2019-03-09

  * <!-- image:  -->

fighting

[__ 0](<javascript:;>)

已经二刷了，准备三刷四刷 

2019-03-07

__ 作者回复

👍🏿🤝

2019-03-09

  * <!-- image:  -->

沙漠里的骆驼

[__ 0](<javascript:;>)

讲的非常好，是我遇到课程讲授最好的了。今天刚和池老师说，希望可以有线下的课程，比如完成一个数据库的完整设计，从最上层的sql语法解析器到底层的文件调度系统。在集中的时间里面比如1个月或者2个月，线下组织大家一起，每个人都完成一个tiny_db的工程。我想这是最好的成长了。不知道老师是否也有这方面的想法？  
不管如何，真的很感谢老师。如此娓娓道来，所谓的如沐春风便是如此吧。 

2019-03-06

__ 作者回复

谢谢你。  
后面只要还是在评论区继续和大家交流😄

2019-03-07

  * ![](http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIVus1GUCwicLqJSfgWuHON9FymBWicPOecH8rIxMh8J2WrX2N6Dd1MqgIqq0TR956YZ9Lwb3Qf4xBw/132)

芬

[__ 0](<javascript:;>)

学习到了很多平时没有关注到的小细节，很赞！当然 师傅领进门 修行靠个人。剩下的就是自己好好消化应用了，谢谢老师 

2019-02-28

  * <!-- image:  -->

封建的风

[__ 0](<javascript:;>)

之前很多知识点有点粗浅，尤其在行版本可见性，redo log&bin; log关系，加锁的原理章节，深入浅出，受益匪浅。感谢老师精品专栏，后期再二刷 

2019-02-27

---

## 结束语：点线网面，一起构建 MySQL 知识网络

<!-- image:  -->

时光流逝，这是专栏的最后一篇文章。回顾整个过程，**如果用一个词来描述，就是“没料到”** ：

我没料到文章这么难写，似乎每一篇文章都要用尽所学；

我没料到评论这么精彩，以致于我花在评论区的时间并不比正文少；

我没料到收获这么大，每一次被评论区的提问问到盲点，都会带着久违的兴奋去分析代码。

**如果让我自己评价这个专栏：**

我最满意的部分，是每一篇文章都带上了实践案例，也尽量讲清楚了原理；

我最得意的段落，是在讲事务隔离级别的时候，把文章重写到第三遍，终于能够写上“到这里，我们把一致性读、当前读和行锁就串起来了”；

我最开心的时候，是看到评论区有同学在回答课后思考题时，准确地用上了之前文章介绍的知识点。因为我理解的构建知识网络，就是这么从点到线，从线到网，从网到面的过程，很欣喜能跟大家一起走过这个过程。

当然，我更看重的还是你的评价。所以，当我看到你们在评论区和知乎说“好”的时候，就只会更细致地设计文章内容和课后思考题。

同时，我知道专栏的订阅用户中，有刚刚接触MySQL的新人，也有使用MySQL多年的同学。所以，我始终都在告诫自己，要尽量让大家都能有所收获。

在我的理解里，介绍数据库的文章需要有操作性，每一个操作有相应的原理，每一个原理背后又有它的原理，这是一个链条。能够讲清楚链条中的一个环节，就可能是一篇好文章。但是，每一层都有不同的受众。所以，我给这45篇文章定的目标就是：讲清楚操作和第一层的原理，并适当触及第二层原理。希望这样的设计不会让你觉得太浅。

有同学在问MySQL的学习路径，我在这里就和你谈谈我的理解。

## 1\. 路径千万条，实践第一条

如果你问一个DBA“理解得最深刻的知识点”，他很可能告诉你是他踩得最深的那个坑。由此，“实践”的重要性可见一斑。

以前我带新人的时候，第一步就是要求他们手动搭建一套主备复制结构。并且，平时碰到问题的时候，我要求要动手复现。

从专栏评论区的留言可以看出来，有不少同学在跟着专栏中的案例做实验，我觉得这是个非常好的习惯，希望你能继续坚持下去。在阅读其他技术文章、图书的时候，也是同样的道理。如果你觉得自己理解了一个知识点，也一定要尝试设计一个例子来验证它。

同时，在设计案例的时候，我建议你也设计一个对照的反例，从而达到知识融汇贯通的目的。就像我在写这个专栏的过程中，就感觉自己也涨了不少知识，主要就得益于给文章设计案例的过程。

## 2\. 原理说不清，双手白费劲

不论是先实践再搞清楚原理去解释，还是先明白原理再通过实践去验证，都不失为一种好的学习方法，因人而异。但是，怎么证明自己是不是真的把原理弄清楚了呢？答案是说出来、写出来。

如果有人请教你某个知识点，那真是太好了，一定要跟他讲明白。不要觉得这是在浪费时间。因为这样做，一来可以帮你验证自己确实搞懂了这个知识点；二来可以提升自己的技术表达能力，毕竟你终究要面临和这样的三类人讲清楚原理的情况，即：老板、晋升答辩的评委、新工作的面试官。

我在带新人的时候，如果这一届的新人不止一个，就会让他们组成学习小组，并定期给他们出一个已经有确定答案的问题。大家分头去研究，之后在小组内进行讨论。如果你能碰到愿意跟你结成学习小组的同学，一定要好好珍惜。

而“写出来”又是一个更高的境界。因为，你在写的过程中，就会发现这个“明白”很可能只是一个假象。所以，在专栏下面写下自己对本章知识点的理解，也是一个不错的夯实学习成果的方法。

## 3\. 知识没体系，转身就忘记

把知识点“写下来”，还有一个好处，就是你会发现这个知识点的关联知识点。深究下去，点就连成线，然后再跟别的线找交叉。

比如，我们专栏里面讲到对临时表的操作不记录日志，然后你就可以给自己一个问题，这会不会导致备库同步出错？再比如，了解了临时表在不同的binlog格式下的行为，再追问一句，如果创建表的时候是statement格式，之后再修改为row格式（或者反之），会怎么样呢？

把这些都搞明白以后，你就能够把临时表、日志格式、同步机制，甚至于事务机制都连起来了。

相信你和我一样，在学习过程中最喜欢的就是这种交叉的瞬间。交叉多了，就形成了网络。而有了网络以后，吸收新知识的速度就很快了。

比如，如果你对事务隔离级别弄得很清楚了，在看到第45篇文章讲的max_trx_id超限会导致持续脏读的时候，相信你理解起来就很容易了。

## 4\. 手册补全面，案例扫盲点

有同学还问我，要不要一开始就看手册？我的建议是不要。看手册的时机，应该是你的知识网络构建得差不多的时候。

那你可能会问，什么时候算是差不多呢？其实，这没有一个固定的标准。但是，有一些基本实践可以帮你去做一个检验。

  * 能否解释清楚错误日志（error log）、慢查询日志（slow log）中每一行的意思？
  * 能否快速评估出一个表结构或者一条SQL语句，设计得是否合理？
  * 能否通过explain的结果，来“脑补”整个执行过程（我们已经在专栏中练习几次了）？
  * 到网络上找MySQL的实践建议，对于每一条做一次分析： 
    * 如果觉得不合理，能否给出自己的意见？
    * 如果觉得合理，能否给出自己的解释？


那，怎么判断自己的意见或者解释对不对呢？最快速、有效的途径，就是找有经验的人讨论。比如说，留言到我们专栏的相关文章的评论区，就是一个可行的方法。

这些实践做完后，你就应该对自己比较有信心了。这时候，你可以再去看手册，把知识网络中的盲点补全，进而形成面。而补全的方法就是前两点了，理论加实践。

我希望这45篇文章，可以在你构建MySQL知识体系的过程中，起到一个加速器的作用。

我特意安排在最后一篇文章，和你介绍MySQL里各种自增id达到定义的上限以后的不同行为。“45”就是我们这个专栏的id上限，而这一篇结束语，便是超过上限后的第一个值。这是一个未定义的值，由你来定义：

  * 有的同学可能会像表定义的自增id一样，就让它定格在这里；
  * 有的同学可能会像row_id一样，二刷，然后用新的、更全面的理解去替代之前的理解；
  * 也许最多的情况是会像thread_id一样，将已经彻底掌握的文章标记起来，专门刷那些之前看过、但是已经印象模糊的文章。


不论是哪一种策略，只要这45篇文章中，有那么几个知识点，像Xid或者InnoDB trx_id一样，持久化到了你的知识网络里，你和我在这里花费的时间，就是“极客”的时间，就值了。

这是专栏的最后一篇文章的最后一句话，江湖再见。

[<!-- image:  -->](<http://lixbr66veiw63rtj.mikecrm.com/7IfMxSe>)