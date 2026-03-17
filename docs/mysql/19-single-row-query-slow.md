---
title: "MySQL 实战 45 讲：19. 为什么我只查一行的语句，也执行这么慢？"
description: "极客时间《MySQL 实战 45 讲》第 19 讲笔记整理"
---

# 19. 为什么我只查一行的语句，也执行这么慢？

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

一般情况下，如果我跟你说查询性能优化，你首先会想到一些复杂的语句，想到查询需要返回大量的数据。但有些情况下，“查一行”，也会执行得特别慢。今天，我就跟你聊聊这个有趣的话题，看看什么情况下，会出现这个现象。

需要说明的是，如果MySQL数据库本身就有很大的压力，导致数据库服务器CPU占用率很高或ioutil（IO利用率）很高，这种情况下所有语句的执行都有可能变慢，不属于我们今天的讨论范围。

为了便于描述，我还是构造一个表，基于这个表来说明今天的问题。这个表有两个字段id和c，并且我在里面插入了10万行记录。

```sql
mysql> CREATE TABLE `t` (
  `id` int(11) NOT NULL,
  `c` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

delimiter ;;
create procedure idata()
begin
  declare i int;
  set i=1;
  while(i<=100000)do
    insert into t values(i,i)
    set i=i+1;
  end while;
end;;
delimiter ;

call idata();
```


接下来，我会用几个不同的场景来举例，有些是前面的文章中我们已经介绍过的知识点，你看看能不能一眼看穿，来检验一下吧。

## 第一类：查询长时间不返回

如图1所示，在表t执行下面的SQL语句：

```sql
mysql> select * from t where id=1;
```


查询结果长时间不返回。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 1 — 查询长时间不返回</div>
<pre style="margin:0;white-space:pre-wrap;">mysql> <span style="color:var(--d-blue);font-weight:bold;">select * from t where id=1;</span>
<span style="color:var(--d-orange);font-weight:bold;">— 长时间无响应，光标一直闪烁等待 …</span></pre>
</div>
</div>


一般碰到这种情况的话，大概率是表t被锁住了。接下来分析原因的时候，一般都是首先执行一下show processlist命令，看看当前语句处于什么状态。

然后我们再针对每种状态，去分析它们产生的原因、如何复现，以及如何处理。

## 等MDL锁

如图2所示，就是使用show processlist命令查看Waiting for table metadata lock的示意图。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 2 — Waiting for table metadata lock</div>
<pre style="margin:0;white-space:pre-wrap;">mysql> <span style="color:var(--d-blue);">show processlist;</span>
+----+---------+---------+------+---------+------+------------------------------+----------------------------------+
| Id | User    | Host    | db   | Command | Time | State                        | Info                             |
+----+---------+---------+------+---------+------+------------------------------+----------------------------------+
|  4 | root    | ...     | test | Sleep   |  120 |                              | NULL                             |
|  5 | root    | ...     | test | Query   |   98 | <span style="color:var(--d-orange);font-weight:bold;">Waiting for table metadata lock</span> | select * from t where id=1       |
+----+---------+---------+------+---------+------+------------------------------+----------------------------------+</pre>
</div>
</div>


出现**这个状态表示的是，现在有一个线程正在表t上请求或者持有MDL写锁，把select语句堵住了。**

在第6篇文章[《全局锁和表锁 ：给表加个字段怎么有这么多阻碍？》](<https://time.geekbang.org/column/article/69862>)中，我给你介绍过一种复现方法。但需要说明的是，那个复现过程是基于MySQL 5.6版本的。而MySQL 5.7版本修改了MDL的加锁策略，所以就不能复现这个场景了。

不过，在MySQL 5.7版本下复现这个场景，也很容易。如图3所示，我给出了简单的复现步骤。  

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:13px;color:var(--d-text);max-width:580px;width:100%;overflow-x:auto;">
  <div style="text-align:center;font-weight:bold;margin-bottom:12px;font-size:15px;">图 3 — MySQL 5.7 中复现 Waiting for table metadata lock</div>
  <table style="width:100%;border-collapse:collapse;text-align:center;">
    <thead>
      <tr style="background:var(--d-th-bg);">
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:50%;color:var(--d-th-text);">Session A</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:50%;color:var(--d-th-text);">Session B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">lock table t write;</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
      <tr style="background:var(--d-stripe);">
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">select * from t where id=1;<br><span style="color:var(--d-orange);font-weight:bold;">(blocked)</span></td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:8px;font-size:12px;color:var(--d-text-sub);text-align:center;">
    Session A 持有 MDL 写锁，Session B 需要 MDL 读锁 → 被阻塞
  </div>
</div>
</div>


session A 通过lock table命令持有表t的MDL写锁，而session B的查询需要获取MDL读锁。所以，session B进入等待状态。

这类问题的处理方式，就是找到谁持有MDL写锁，然后把它kill掉。

但是，由于在show processlist的结果里面，session A的Command列是“Sleep”，导致查找起来很不方便。不过有了performance_schema和sys系统库以后，就方便多了。（MySQL启动时需要设置performance_schema=on)

通过查询sys.schema_table_lock_waits这张表，我们就可以直接找出造成阻塞的process id，把这个连接用kill 命令断开即可。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 4 — 通过 sys.schema_table_lock_waits 查获加表锁的线程</div>
<pre style="margin:0;white-space:pre-wrap;">
mysql> <span style="color:var(--d-blue);">select blocking_pid</span>
    <span style="color:var(--d-blue);">from sys.schema_table_lock_waits\G</span>
*************************** 1. row ***************************
blocking_pid: <span style="color:var(--d-orange);font-weight:bold;">4</span>
1 row in set

mysql> <span style="color:var(--d-orange);font-weight:bold;">kill 4;</span>
</pre>
</div>
</div>


## 等flush

接下来，我给你举另外一种查询被堵住的情况。

我在表t上，执行下面的SQL语句：

```sql
mysql> select * from information_schema.processlist where id=1;
```


这里，我先卖个关子。

你可以看一下图5。我查出来这个线程的状态是Waiting for table flush，你可以设想一下这是什么原因。  

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 5 — Waiting for table flush</div>
<pre style="margin:0;white-space:pre-wrap;">mysql> <span style="color:var(--d-blue);">select * from information_schema.processlist where id=1;</span>
+----+------+-------+------+---------+------+-------------------------+-------+
| Id | User | Host  | db   | Command | Time | State                   | Info  |
+----+------+-------+------+---------+------+-------------------------+-------+
|  1 | root | ...   | test | Query   |   45 | <span style="color:var(--d-orange);font-weight:bold;">Waiting for table flush</span> | ...   |
+----+------+-------+------+---------+------+-------------------------+-------+</pre>
</div>
</div>


这个状态表示的是，现在有一个线程正要对表t做flush操作。MySQL里面对表做flush操作的用法，一般有以下两个：

```sql
flush tables t with read lock;

flush tables with read lock;
```


这两个flush语句，如果指定表t的话，代表的是只关闭表t；如果没有指定具体的表名，则表示关闭MySQL里所有打开的表。

但是正常这两个语句执行起来都很快，除非它们也被别的线程堵住了。

所以，出现Waiting for table flush状态的可能情况是：有一个flush tables命令被别的语句堵住了，然后它又堵住了我们的select语句。

现在，我们一起来复现一下这种情况，**复现步骤** 如图6所示：

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:13px;color:var(--d-text);max-width:580px;width:100%;overflow-x:auto;">
  <div style="text-align:center;font-weight:bold;margin-bottom:12px;font-size:15px;">图 6 — 复现 Waiting for table flush 的步骤</div>
  <table style="width:100%;border-collapse:collapse;text-align:center;">
    <thead>
      <tr style="background:var(--d-th-bg);">
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:12%;color:var(--d-th-text);">时刻</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:30%;color:var(--d-th-text);">Session A</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:30%;color:var(--d-th-text);">Session B</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:28%;color:var(--d-th-text);">Session C</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T1</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">select sleep(1) from t;<br><span style="color:var(--d-text-sub);">（10 万行，执行 10 万秒）</span></td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
      <tr style="background:var(--d-stripe);">
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T2</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">flush tables t;<br><span style="color:var(--d-orange);font-weight:bold;">(blocked — 等 A 关闭表)</span></td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T3</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">select * from t where id=1;<br><span style="color:var(--d-orange);font-weight:bold;">(blocked — 等 flush 完成)</span></td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:8px;font-size:12px;color:var(--d-text-sub);text-align:center;">
    A 长查询打开表 → B flush 等 A → C 查询等 B → 三级阻塞链
  </div>
</div>
</div>


在session A中，我故意每行都调用一次sleep(1)，这样这个语句默认要执行10万秒，在这期间表t一直是被session A“打开”着。然后，session B的flush tables t命令再要去关闭表t，就需要等session A的查询结束。这样，session C要再次查询的话，就会被flush 命令堵住了。

图7是这个复现步骤的show processlist结果。这个例子的排查也很简单，你看到这个show processlist的结果，肯定就知道应该怎么做了。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 7 — show processlist 查看 flush 阻塞现场</div>
<pre style="margin:0;white-space:pre-wrap;">mysql> <span style="color:var(--d-blue);">show processlist;</span>
+----+------+-------+------+---------+-------+-------------------------+-------------------------------+
| Id | User | Host  | db   | Command | Time  | State                   | Info                          |
+----+------+-------+------+---------+-------+-------------------------+-------------------------------+
|  4 | root | ...   | test | Query   | 12052 | User sleep              | select sleep(1) from t        |
|  5 | root | ...   | test | Query   |    98 | <span style="color:var(--d-orange);font-weight:bold;">Waiting for table flush</span> | flush tables t                |
|  6 | root | ...   | test | Query   |    92 | <span style="color:var(--d-orange);font-weight:bold;">Waiting for table flush</span> | select * from t where id=1    |
+----+------+-------+------+---------+-------+-------------------------+-------------------------------+</pre>
</div>
</div>


## 等行锁

现在，经过了表级锁的考验，我们的select 语句终于来到引擎里了。

```sql
mysql> select * from t where id=1 lock in share mode; 
```


上面这条语句的用法你也很熟悉了，我们在第8篇[《事务到底是隔离的还是不隔离的？》](<https://time.geekbang.org/column/article/70562>)文章介绍当前读时提到过。

由于访问id=1这个记录时要加读锁，如果这时候已经有一个事务在这行记录上持有一个写锁，我们的select语句就会被堵住。

复现步骤和现场如下：

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:13px;color:var(--d-text);max-width:580px;width:100%;overflow-x:auto;">
  <div style="text-align:center;font-weight:bold;margin-bottom:12px;font-size:15px;">图 8 — 行锁复现步骤</div>
  <table style="width:100%;border-collapse:collapse;text-align:center;">
    <thead>
      <tr style="background:var(--d-th-bg);">
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:15%;color:var(--d-th-text);">时刻</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:42%;color:var(--d-th-text);">Session A</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:43%;color:var(--d-th-text);">Session B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T1</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">begin;<br>update t set c=c+1 where id=1;</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
      <tr style="background:var(--d-stripe);">
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T2</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">select * from t where id=1<br>lock in share mode;<br><span style="color:var(--d-orange);font-weight:bold;">(blocked — 等待行锁)</span></td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:8px;font-size:12px;color:var(--d-text-sub);text-align:center;">
    Session A 持有 id=1 的写锁且未提交 → Session B 的加锁读被阻塞
  </div>
</div>
</div>

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 9 — show processlist 行锁等待现场</div>
<pre style="margin:0;white-space:pre-wrap;">mysql> <span style="color:var(--d-blue);">show processlist;</span>
+----+------+-------+------+---------+------+------------------------------+--------------------------------------------+
| Id | User | Host  | db   | Command | Time | State                        | Info                                       |
+----+------+-------+------+---------+------+------------------------------+--------------------------------------------+
|  4 | root | ...   | test | Sleep   |  180 |                              | NULL                                       |
|  5 | root | ...   | test | Query   |   68 | <span style="color:var(--d-orange);font-weight:bold;">Sending data</span>                 | select * from t where id=1 lock in share.. |
+----+------+-------+------+---------+------+------------------------------+--------------------------------------------+</pre>
</div>
</div>


显然，session A启动了事务，占有写锁，还不提交，是导致session B被堵住的原因。

这个问题并不难分析，但问题是怎么查出是谁占着这个写锁。如果你用的是MySQL 5.7版本，可以通过sys.innodb_lock_waits 表查到。

查询方法是：

```sql
mysql> select * from t sys.innodb_lock_waits where locked_table=`'test'.'t'`\G
```

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 10 — 通过 sys.innodb_lock_waits 查到阻塞源</div>
<pre style="margin:0;white-space:pre-wrap;">mysql> <span style="color:var(--d-blue);">select * from sys.innodb_lock_waits
       where locked_table='`test`.`t`'\G</span>
*************************** 1. row ***************************
                wait_started: 2019-01-14 18:25:30
                    wait_age: 00:01:08
               wait_age_secs: 68
                locked_table: `test`.`t`
                locked_index: PRIMARY
                 locked_type: RECORD
              waiting_trx_id: 281479652498456
         waiting_trx_started: 2019-01-14 18:25:30
             waiting_trx_age: 00:01:08
     waiting_query: select * from t where id=1 lock in share mode
              waiting_lock_id: 281479652498456:54:4:2
            waiting_lock_mode: S
              blocking_trx_id: 281479652498448
                 blocking_pid: <span style="color:var(--d-orange);font-weight:bold;">4</span>
              blocking_query: NULL
            blocking_lock_id: 281479652498448:54:4:2
           blocking_lock_mode: X
         sql_kill_blocking_query: <span style="color:var(--d-text-muted);">KILL QUERY 4</span>
    sql_kill_blocking_connection: <span style="color:var(--d-orange);font-weight:bold;">KILL 4</span></pre>
</div>
</div>


可以看到，这个信息很全，4号线程是造成堵塞的罪魁祸首。而干掉这个罪魁祸首的方式，就是KILL QUERY 4或KILL 4。

不过，这里不应该显示“KILL QUERY 4”。这个命令表示停止4号线程当前正在执行的语句，而这个方法其实是没有用的。因为占有行锁的是update语句，这个语句已经是之前执行完成了的，现在执行KILL QUERY，无法让这个事务去掉id=1上的行锁。

实际上，KILL 4才有效，也就是说直接断开这个连接。这里隐含的一个逻辑就是，连接被断开的时候，会自动回滚这个连接里面正在执行的线程，也就释放了id=1上的行锁。

## 第二类：查询慢

经过了重重封“锁”，我们再来看看一些查询慢的例子。

先来看一条你一定知道原因的SQL语句：

```sql
mysql> select * from t where c=50000 limit 1;
```


由于字段c上没有索引，这个语句只能走id主键顺序扫描，因此需要扫描5万行。

作为确认，你可以看一下慢查询日志。注意，这里为了把所有语句记录到slow log里，我在连接后先执行了 set `long_query_time`=0，将慢查询日志的时间阈值设置为0。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 11 — 全表扫描 5 万行的 slow log</div>
<pre style="margin:0;white-space:pre-wrap;"><span style="color:var(--d-text-muted);"># Query_time: <span style="color:var(--d-orange);font-weight:bold;">0.011500</span>  Lock_time: 0.000100  Rows_sent: 1  Rows_examined: <span style="color:var(--d-orange);font-weight:bold;">50000</span></span>
SET timestamp=1551007510;
select * from t where c=50000 limit 1;</pre>
</div>
</div>


Rows_examined显示扫描了50000行。你可能会说，不是很慢呀，11.5毫秒就返回了，我们线上一般都配置超过1秒才算慢查询。但你要记住：**坏查询不一定是慢查询** 。我们这个例子里面只有10万行记录，数据量大起来的话，执行时间就线性涨上去了。

扫描行数多，所以执行慢，这个很好理解。

但是接下来，我们再看一个只扫描一行，但是执行很慢的语句。

如图12所示，是这个例子的slow log。可以看到，执行的语句是

```sql
mysql> select * from t where id=1；
```


虽然扫描行数是1，但执行时间却长达800毫秒。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 12 — 扫描一行却执行得很慢</div>
<pre style="margin:0;white-space:pre-wrap;"><span style="color:var(--d-text-muted);"># Query_time: <span style="color:var(--d-orange);font-weight:bold;">0.800000</span>  Lock_time: 0.000000  Rows_sent: 1  Rows_examined: <span style="color:var(--d-green);font-weight:bold;">1</span></span>
SET timestamp=1551007580;
select * from t where id=1;</pre>
</div>
</div>


是不是有点奇怪呢，这些时间都花在哪里了？

如果我把这个slow log的截图再往下拉一点，你可以看到下一个语句，select * from t where id=1 lock in share mode，执行时扫描行数也是1行，执行时间是0.2毫秒。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 13 — 加上 lock in share mode 的 slow log</div>
<pre style="margin:0;white-space:pre-wrap;"><span style="color:var(--d-text-muted);"># Query_time: <span style="color:var(--d-green);font-weight:bold;">0.000200</span>  Lock_time: 0.000100  Rows_sent: 1  Rows_examined: 1</span>
SET timestamp=1551007590;
select * from t where id=1 <span style="color:var(--d-blue);font-weight:bold;">lock in share mode</span>;</pre>
<div style="margin-top:8px;font-size:12px;color:var(--d-text-sub);">加锁读（当前读）反而更快 — 只需 0.2ms，而一致性读需要 800ms</div>
</div>
</div>


看上去是不是更奇怪了？按理说lock in share mode还要加锁，时间应该更长才对啊。

可能有的同学已经有答案了。如果你还没有答案的话，我再给你一个提示信息，图14是这两个语句的执行输出结果。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:'Courier New',monospace;font-size:13px;background:var(--d-bg-alt);border:1px solid var(--d-border);border-radius:6px;padding:16px;max-width:580px;width:100%;overflow-x:auto;color:var(--d-text);">
<div style="font-weight:bold;color:var(--d-blue);margin-bottom:8px;">图 14 — 两个语句的输出结果对比</div>
<pre style="margin:0;white-space:pre-wrap;">
mysql> <span style="color:var(--d-blue);">select * from t where id=1;</span>
+----+------+
| id | c    |
+----+------+
|  1 | <span style="color:var(--d-orange);font-weight:bold;">   1</span> |
+----+------+

mysql> <span style="color:var(--d-blue);">select * from t where id=1 lock in share mode;</span>
+----+---------+
| id | c       |
+----+---------+
|  1 | <span style="color:var(--d-green);font-weight:bold;">1000001</span> |
+----+---------+
</pre>
<div style="margin-top:8px;font-size:12px;color:var(--d-text-sub);">一致性读返回 c=1（事务启动时的快照），当前读返回 c=1000001（最新值）</div>
</div>
</div>


第一个语句的查询结果里c=1，带lock in share mode的语句返回的是c=1000001。看到这里应该有更多的同学知道原因了。如果你还是没有头绪的话，也别着急。我先跟你说明一下复现步骤，再分析原因。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:13px;color:var(--d-text);max-width:580px;width:100%;overflow-x:auto;">
  <div style="text-align:center;font-weight:bold;margin-bottom:12px;font-size:15px;">图 15 — 复现步骤</div>
  <table style="width:100%;border-collapse:collapse;text-align:center;">
    <thead>
      <tr style="background:var(--d-th-bg);">
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:15%;color:var(--d-th-text);">时刻</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:42%;color:var(--d-th-text);">Session A</th>
        <th style="padding:8px 10px;border:1px solid var(--d-th-border);width:43%;color:var(--d-th-text);">Session B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T1</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">start transaction with<br>consistent snapshot;</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
      <tr style="background:var(--d-stripe);">
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T2</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">update t set c=c+1 where id=1;<br><span style="color:var(--d-text-sub);">（自动提交，执行 100 万次）</span></td>
      </tr>
      <tr>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T3</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">select * from t where id=1;<br><span style="color:var(--d-orange);font-weight:bold;">耗时 800ms — 一致性读回溯 100 万版本</span></td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
      <tr style="background:var(--d-stripe);">
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-weight:bold;color:var(--d-blue);">T4</td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);font-family:'Courier New',monospace;font-size:12px;">select * from t where id=1<br>lock in share mode;<br><span style="color:var(--d-green);font-weight:bold;">耗时 0.2ms — 当前读直接返回</span></td>
        <td style="padding:6px 10px;border:1px solid var(--d-border);color:var(--d-text-dim);">—</td>
      </tr>
    </tbody>
  </table>
</div>
</div>


你看到了，session A先用start transaction with consistent snapshot命令启动了一个事务，之后session B才开始执行update 语句。

session B执行完100万次update语句后，id=1这一行处于什么状态呢？你可以从图16中找到答案。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:13px;color:var(--d-text);max-width:580px;width:100%;overflow-x:auto;">
  <div style="text-align:center;font-weight:bold;margin-bottom:16px;font-size:15px;">图 16 — id=1 的数据状态（MVCC undo log 版本链）</div>
  <svg viewBox="0 0 520 320" style="width:100%;max-width:520px;display:block;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
    <!-- Current version -->
    <rect x="180" y="10" width="160" height="48" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="260" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-blue)">当前版本（最新）</text>
    <text x="260" y="46" text-anchor="middle" font-size="12" font-family="'Courier New',monospace" fill="var(--d-text)">c = 1000001</text>
    <!-- Arrow 1 -->
    <line x1="260" y1="58" x2="260" y2="80" stroke="var(--d-border)" stroke-width="1.5" marker-end="url(#arrowDown)"/>
    <text x="280" y="73" font-size="10" fill="var(--d-text-muted)">undo: c-1</text>
    <!-- Version N-1 -->
    <rect x="180" y="80" width="160" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="260" y="105" text-anchor="middle" font-size="12" font-family="'Courier New',monospace" fill="var(--d-text)">c = 1000000</text>
    <!-- Arrow 2 -->
    <line x1="260" y1="120" x2="260" y2="142" stroke="var(--d-border)" stroke-width="1.5" marker-end="url(#arrowDown)"/>
    <text x="280" y="135" font-size="10" fill="var(--d-text-muted)">undo: c-1</text>
    <!-- Version N-2 -->
    <rect x="180" y="142" width="160" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="260" y="167" text-anchor="middle" font-size="12" font-family="'Courier New',monospace" fill="var(--d-text)">c = 999999</text>
    <!-- Dots -->
    <text x="260" y="200" text-anchor="middle" font-size="16" fill="var(--d-text-muted)">. . .</text>
    <text x="260" y="216" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">共 100 万个 undo log 版本</text>
    <!-- Arrow to bottom -->
    <line x1="260" y1="224" x2="260" y2="246" stroke="var(--d-border)" stroke-width="1.5" marker-end="url(#arrowDown)"/>
    <text x="280" y="239" font-size="10" fill="var(--d-text-muted)">undo: c-1</text>
    <!-- Original version -->
    <rect x="180" y="246" width="160" height="48" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5"/>
    <text x="260" y="266" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">Session A 可见版本</text>
    <text x="260" y="282" text-anchor="middle" font-size="12" font-family="'Courier New',monospace" fill="var(--d-text)">c = 1</text>
    <!-- Labels on right -->
    <text x="355" y="38" font-size="11" fill="var(--d-green)" font-weight="bold">lock in share mode</text>
    <text x="355" y="52" font-size="10" fill="var(--d-text-sub)">直接读取 → 0.2ms</text>
    <text x="355" y="274" font-size="11" fill="var(--d-orange)" font-weight="bold">一致性读</text>
    <text x="355" y="288" font-size="10" fill="var(--d-text-sub)">回溯 100 万版本 → 800ms</text>
    <!-- Arrow marker -->
    <defs>
      <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,0 L5,10 L10,0" fill="var(--d-border)"/>
      </marker>
    </defs>
  </svg>
</div>
</div>


session B更新完100万次，生成了100万个回滚日志(`undo log`)。

带lock in share mode的SQL语句，是当前读，因此会直接读到1000001这个结果，所以速度很快；而select * from t where id=1这个语句，是一致性读，因此需要从1000001开始，依次执行undo log，执行了100万次以后，才将1这个结果返回。

注意，undo log里记录的其实是“把2改成1”，“把3改成2”这样的操作逻辑，画成减1的目的是方便你看图。

## 小结

今天我给你举了在一个简单的表上，执行“查一行”，可能会出现的被锁住和执行慢的例子。这其中涉及到了表锁、行锁和一致性读的概念。

在实际使用中，碰到的场景会更复杂。但大同小异，你可以按照我在文章中介绍的定位方法，来定位并解决问题。

最后，我给你留一个问题吧。

我们在举例加锁读的时候，用的是这个语句，select * from t where id=1 lock in share mode。由于id上有索引，所以可以直接定位到id=1这一行，因此读锁也是只加在了这一行上。

但如果是下面的SQL语句，

```sql
begin;
select * from t where c=5 for update;
commit;
```


这个语句序列是怎么加锁的呢？加的锁又是什么时候释放呢？

你可以把你的观点和验证方法写在留言区里，我会在下一篇文章的末尾给出我的参考答案。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

## 上期问题时间

在上一篇文章最后，我留给你的问题是，希望你可以分享一下之前碰到过的、与文章中类似的场景。

@封建的风 提到一个有趣的场景，值得一说。我把他的问题重写一下，表结构如下：

```sql
mysql> CREATE TABLE `table_a` (
  `id` int(11) NOT NULL,
  `b` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `b` (`b`)
) ENGINE=InnoDB;
```


假设现在表里面，有100万行数据，其中有10万行数据的b的值是’1234567890’， 假设现在执行语句是这么写的:

```sql
mysql> select * from table_a where b='1234567890abcd';
```


这时候，MySQL会怎么执行呢？

最理想的情况是，MySQL看到字段b定义的是varchar(10)，那肯定返回空呀。可惜，MySQL并没有这么做。

那要不，就是把’1234567890abcd’拿到索引里面去做匹配，肯定也没能够快速判断出索引树b上并没有这个值，也很快就能返回空结果。

但实际上，MySQL也不是这么做的。

这条SQL语句的执行很慢，流程是这样的：

  1. 在传给引擎执行的时候，做了字符截断。因为引擎里面这个行只定义了长度是10，所以只截了前10个字节，就是’1234567890’进去做匹配；

  2. 这样满足条件的数据有10万行；

  3. 因为是select *， 所以要做10万次回表；

  4. 但是每次回表以后查出整行，到server层一判断，b的值都不是’1234567890abcd’;

  5. 返回结果是空。


这个例子，是我们文章内容的一个很好的补充。虽然执行过程中可能经过函数操作，但是最终在拿到结果后，server层还是要做一轮判断的。

评论区留言点赞板：

> @赖阿甘 提到了等号顺序问题，时间上MySQL优化器执行过程中，where 条件部分， a=b和 b=a的写法是一样的。  
>  @沙漠里的骆驼 提到了一个常见的问题。相同的模板语句，但是匹配行数不同，语句执行时间相差很大。这种情况，在语句里面有order by这样的操作时会更明显。  
>  @Justin 回答了我们正文中的问题，如果id 的类型是整数，传入的参数类型是字符串的时候，可以用上索引。
