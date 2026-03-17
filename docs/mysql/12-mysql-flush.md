---
title: "MySQL 实战 45 讲：12. 为什么我的 MySQL 会“抖”一下？"
description: "极客时间《MySQL 实战 45 讲》第 12 讲笔记整理"
---

# 12. 为什么我的 MySQL 会“抖”一下？

> 本文整理自极客时间《MySQL 实战 45 讲》（林晓斌/丁奇），仅用于个人学习笔记。

平时的工作中，不知道你有没有遇到过这样的场景，一条SQL语句，正常执行的时候特别快，但是有时也不知道怎么回事，它就会变得特别慢，并且这样的场景很难复现，它不只随机，而且持续时间还很短。

看上去，这就像是数据库“抖”了一下。今天，我们就一起来看一看这是什么原因。

## 你的SQL语句为什么变“慢”了

在前面第2篇文章[《日志系统：一条SQL更新语句是如何执行的？》](<https://time.geekbang.org/column/article/68633>)中，我为你介绍了WAL机制。现在你知道了，InnoDB在处理更新语句的时候，只做了写日志这一个磁盘操作。这个日志叫作redo log（重做日志），也就是《孔乙己》里咸亨酒店掌柜用来记账的粉板，在更新内存写完redo log后，就返回给客户端，本次更新成功。

做下类比的话，掌柜记账的账本是数据文件，记账用的粉板是日志文件（`redo log`），掌柜的记忆就是内存。

掌柜总要找时间把账本更新一下，这对应的就是把内存里的数据写入磁盘的过程，术语就是flush。在这个flush操作执行之前，孔乙己的赊账总额，其实跟掌柜手中账本里面的记录是不一致的。因为孔乙己今天的赊账金额还只在粉板上，而账本里的记录是老的，还没把今天的赊账算进去。

**当内存数据页跟磁盘数据页内容不一致的时候，我们称这个内存页为“脏页”。内存数据写入到磁盘后，内存和磁盘上的数据页的内容就一致了，称为“干净页”** 。

不论是脏页还是干净页，都在内存中。在这个例子里，内存对应的就是掌柜的记忆。

接下来，我们用一个示意图来展示一下“孔乙己赊账”的整个操作过程。假设原来孔乙己欠账10文，这次又要赊9文。

<div style=”display:flex;justify-content:center;padding:20px 0;”>
<div style=”font-family:system-ui,sans-serif;font-size:14px;color:var(--d-text);max-width:500px;width:100%;”>
  <!-- 标题 -->
  <div style=”text-align:center;font-weight:bold;margin-bottom:16px;font-size:15px;color:var(--d-text);”>图1 “孔乙己赊账”更新和flush过程</div>
  <svg viewBox=”0 0 500 300” style=”width:100%;height:auto;”>
    <!-- 背景区域：粉板（内存/redo log） -->
    <rect x=”20” y=”40” width=”180” height=”220” rx=”10” style=”fill:var(--d-blue-bg);stroke:var(--d-blue-border);stroke-width:1.5”/>
    <text x=”110” y=”30” text-anchor=”middle” style=”font-size:14px;font-weight:bold;fill:var(--d-blue);”>粉板（redo log）</text>
    <text x=”110” y=”55” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>顺序写 · 速度快</text>
    <!-- 粉板内容 -->
    <rect x=”40” y=”70” width=”140” height=”30” rx=”4” style=”fill:var(--d-bg);stroke:var(--d-border);stroke-width:1”/>
    <text x=”110” y=”90” text-anchor=”middle” style=”font-size:12px;fill:var(--d-text);”>孔乙己：欠10文</text>
    <rect x=”40” y=”110” width=”140” height=”30” rx=”4” style=”fill:var(--d-bg);stroke:var(--d-orange);stroke-width:1.5”/>
    <text x=”110” y=”130” text-anchor=”middle” style=”font-size:12px;fill:var(--d-orange);font-weight:bold;”>+ 赊账 9文</text>
    <text x=”110” y=”165” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>① 先写日志（WAL）</text>
    <!-- 返回客户端 -->
    <rect x=”40” y=”180” width=”140” height=”28” rx=”4” style=”fill:var(--d-green);opacity:0.15;stroke:var(--d-green);stroke-width:1”/>
    <text x=”110” y=”199” text-anchor=”middle” style=”font-size:12px;fill:var(--d-green);font-weight:bold;”>✓ 返回更新成功</text>
    <text x=”110” y=”230” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>内存数据页已更新</text>
    <text x=”110” y=”248” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>（此时为”脏页”）</text>
    <!-- 中间：flush 箭头 -->
    <defs>
      <marker id=”arrowF1” markerWidth=”8” markerHeight=”6” refX=”8” refY=”3” orient=”auto”>
        <path d=”M0,0 L8,3 L0,6” style=”fill:var(--d-orange)”/>
      </marker>
    </defs>
    <line x1=”210” y1=”150” x2=”290” y2=”150” style=”stroke:var(--d-orange);stroke-width:2;stroke-dasharray:6,3” marker-end=”url(#arrowF1)”/>
    <text x=”250” y=”140” text-anchor=”middle” style=”font-size:12px;fill:var(--d-orange);font-weight:bold;”>flush</text>
    <text x=”250” y=”170” text-anchor=”middle” style=”font-size:10px;fill:var(--d-text-muted);”>② 空闲时刷盘</text>
    <!-- 账本（磁盘/数据文件） -->
    <rect x=”300” y=”40” width=”180” height=”220” rx=”10” style=”fill:var(--d-bg-alt);stroke:var(--d-border);stroke-width:1.5”/>
    <text x=”390” y=”30” text-anchor=”middle” style=”font-size:14px;font-weight:bold;fill:var(--d-text);”>账本（数据文件）</text>
    <text x=”390” y=”55” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>随机写 · 速度慢</text>
    <!-- 账本内容：flush前 -->
    <rect x=”320” y=”75” width=”140” height=”30” rx=”4” style=”fill:var(--d-bg);stroke:var(--d-border);stroke-width:1”/>
    <text x=”390” y=”95” text-anchor=”middle” style=”font-size:12px;fill:var(--d-text-sub);”>孔乙己：欠10文</text>
    <text x=”390” y=”120” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>flush 前（旧值）</text>
    <!-- 账本内容：flush后 -->
    <text x=”390” y=”155” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-dim);”>▼ flush 后</text>
    <rect x=”320” y=”165” width=”140” height=”30” rx=”4” style=”fill:var(--d-bg);stroke:var(--d-green);stroke-width:1.5”/>
    <text x=”390” y=”185” text-anchor=”middle” style=”font-size:12px;fill:var(--d-green);font-weight:bold;”>孔乙己：欠19文</text>
    <text x=”390” y=”215” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>内存 = 磁盘</text>
    <text x=”390” y=”233” text-anchor=”middle” style=”font-size:11px;fill:var(--d-text-muted);”>（变为”干净页”）</text>
  </svg>
</div>
</div>


回到文章开头的问题，你不难想象，平时执行很快的更新操作，其实就是在写内存和日志，而MySQL偶尔“抖”一下的那个瞬间，可能就是在刷脏页（flush）。

那么，什么情况会引发数据库的flush过程呢？

我们还是继续用咸亨酒店掌柜的这个例子，想一想：掌柜在什么情况下会把粉板上的赊账记录改到账本上？

- 第一种场景是，粉板满了，记不下了。这时候如果再有人来赊账，掌柜就只得放下手里的活儿，将粉板上的记录擦掉一些，留出空位以便继续记账。当然在擦掉之前，他必须先将正确的账目记录到账本中才行。  
这个场景，对应的就是InnoDB的redo log写满了。这时候系统会停止所有更新操作，把checkpoint往前推进，redo log留出空间可以继续写。我在第二讲画了一个redo log的示意图，这里我改成环形，便于大家理解。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:14px;color:var(--d-text);max-width:500px;width:100%;">
  <!-- 标题 -->
  <div style="text-align:center;font-weight:bold;margin-bottom:16px;font-size:15px;color:var(--d-text);">图2 redo log 状态图</div>
  <div style="position:relative;width:300px;height:300px;margin:0 auto;">
    <svg viewBox="0 0 300 300" style="width:100%;height:100%;">
      <!-- 圆环背景 -->
      <circle cx="150" cy="150" r="110" fill="none" style="stroke:var(--d-svg-ring)" stroke-width="30"/>
      <!-- file 0 (右上) -->
      <path d="M 150 40 A 110 110 0 0 1 260 150" fill="none" style="stroke:var(--d-blue-bg)" stroke-width="28"/>
      <!-- file 1 (右下) -->
      <path d="M 260 150 A 110 110 0 0 1 150 260" fill="none" style="stroke:var(--d-blue-border)" stroke-width="28" opacity="0.5"/>
      <!-- file 2 (左下) -->
      <path d="M 150 260 A 110 110 0 0 1 40 150" fill="none" style="stroke:var(--d-blue-bg)" stroke-width="28"/>
      <!-- file 3 (左上) -->
      <path d="M 40 150 A 110 110 0 0 1 150 40" fill="none" style="stroke:var(--d-blue-border)" stroke-width="28" opacity="0.5"/>
      <!-- 已写入待落盘区域：checkpoint(CP) → write_pos 顺时针 -->
      <!-- CP 在左上约 135°位置，write_pos 在右下约 315°位置 -->
      <!-- CP ≈ (72, 88), write_pos ≈ (228, 212) -->
      <path d="M 72 88 A 110 110 0 1 1 228 212" fill="none" style="stroke:var(--d-svg-pending)" stroke-width="28" opacity="0.6"/>
      <!-- 分隔线（4个文件边界） -->
      <line x1="150" y1="26" x2="150" y2="54" style="stroke:var(--d-svg-line)" stroke-width="1.5"/>
      <line x1="274" y1="150" x2="246" y2="150" style="stroke:var(--d-svg-line)" stroke-width="1.5"/>
      <line x1="150" y1="274" x2="150" y2="246" style="stroke:var(--d-svg-line)" stroke-width="1.5"/>
      <line x1="26" y1="150" x2="54" y2="150" style="stroke:var(--d-svg-line)" stroke-width="1.5"/>
      <!-- write pos 标记点 -->
      <circle cx="228" cy="212" r="7" style="fill:var(--d-orange)"/>
      <!-- checkpoint (CP) 标记点 -->
      <circle cx="72" cy="88" r="7" style="fill:var(--d-blue)"/>
      <!-- checkpoint' (CP') 标记点 - 推进后的位置 -->
      <circle cx="55" cy="195" r="6" style="fill:var(--d-green)"/>
      <!-- 顺时针方向箭头 -->
      <path d="M 215 60 L 225 45 L 230 65" fill="none" style="stroke:var(--d-text-muted)" stroke-width="1.5"/>
      <!-- 标注文字 -->
      <text x="248" y="225" style="font-size:11px;font-weight:bold;fill:var(--d-orange);">write pos</text>
      <text x="20" y="78" style="font-size:11px;font-weight:bold;fill:var(--d-blue);">CP</text>
      <text x="10" y="205" style="font-size:11px;font-weight:bold;fill:var(--d-green);">CP'</text>
    </svg>
    <!-- 文件标签 -->
    <div style="position:absolute;top:55px;right:18px;font-size:11px;color:var(--d-blue);">ib_logfile_0</div>
    <div style="position:absolute;bottom:55px;right:18px;font-size:11px;color:var(--d-deep-blue);">ib_logfile_1</div>
    <div style="position:absolute;bottom:55px;left:18px;font-size:11px;color:var(--d-blue);">ib_logfile_2</div>
    <div style="position:absolute;top:55px;left:18px;font-size:11px;color:var(--d-deep-blue);">ib_logfile_3</div>
    <!-- 中心文字 -->
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
      <div style="font-weight:bold;font-size:13px;color:var(--d-text);">redo log</div>
      <div style="font-size:11px;color:var(--d-text-muted);">循环写入</div>
    </div>
  </div>
  <!-- 图例 -->
  <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:12px;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:4px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--d-orange);"></span>
      <span style="color:var(--d-orange);font-weight:bold;">write pos</span>
      <span style="color:var(--d-text-muted);">写入位置</span>
    </div>
    <div style="display:flex;align-items:center;gap:4px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--d-blue);"></span>
      <span style="color:var(--d-blue);font-weight:bold;">CP</span>
      <span style="color:var(--d-text-muted);">checkpoint</span>
    </div>
    <div style="display:flex;align-items:center;gap:4px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--d-green);"></span>
      <span style="color:var(--d-green);font-weight:bold;">CP'</span>
      <span style="color:var(--d-text-muted);">推进后</span>
    </div>
  </div>
  <div style="text-align:center;margin-top:8px;font-size:12px;color:var(--d-text-muted);">
    <span style="display:inline-block;width:14px;height:8px;background:var(--d-svg-pending);opacity:0.6;border-radius:2px;vertical-align:middle;"></span>
    CP → write pos（顺时针）：已写入待落盘 ｜ 其余：可写入空间
  </div>
  <div style="text-align:center;margin-top:4px;font-size:12px;color:var(--d-text-muted);">
    CP → CP' 之间的脏页须先 flush 到磁盘，才能释放 redo log 空间
  </div>
</div>
</div>


checkpoint可不是随便往前修改一下位置就可以的。比如图2中，把checkpoint位置从CP推进到CP’，就需要将两个点之间的日志（浅绿色部分），对应的所有脏页都flush到磁盘上。之后，图中从write pos到CP’之间就是可以再写入的redo log的区域。

- 第二种场景是，这一天生意太好，要记住的事情太多，掌柜发现自己快记不住了，赶紧找出账本把孔乙己这笔账先加进去。  
这种场景，对应的就是系统内存不足。当需要新的内存页，而内存不够用的时候，就要淘汰一些数据页，空出内存给别的数据页使用。如果淘汰的是“脏页”，就要先将脏页写到磁盘。  
你一定会说，这时候难道不能直接把内存淘汰掉，下次需要请求的时候，从磁盘读入数据页，然后拿redo log出来应用不就行了？这里其实是从性能考虑的。如果刷脏页一定会写盘，就保证了每个数据页有两种状态：

```
* 一种是内存里存在，内存里就肯定是正确的结果，直接返回；
* 另一种是内存里没有数据，就可以肯定数据文件上是正确的结果，读入内存后返回。  
```

这样的效率最高。
- 第三种场景是，生意不忙的时候，或者打烊之后。这时候柜台没事，掌柜闲着也是闲着，不如更新账本。  
这种场景，对应的就是MySQL认为系统“空闲”的时候。当然，MySQL“这家酒店”的生意好起来可是会很快就能把粉板记满的，所以“掌柜”要合理地安排时间，即使是“生意好”的时候，也要见缝插针地找时间，只要有机会就刷一点“脏页”。

- 第四种场景是，年底了咸亨酒店要关门几天，需要把账结清一下。这时候掌柜要把所有账都记到账本上，这样过完年重新开张的时候，就能就着账本明确账目情况了。  
这种场景，对应的就是MySQL正常关闭的情况。这时候，MySQL会把内存的脏页都flush到磁盘上，这样下次MySQL启动的时候，就可以直接从磁盘上读数据，启动速度会很快。


接下来，**你可以分析一下上面四种场景对性能的影响。**

其中，第三种情况是属于MySQL空闲时的操作，这时系统没什么压力，而第四种场景是数据库本来就要关闭了。这两种情况下，你不会太关注“性能”问题。所以这里，我们主要来分析一下前两种场景下的性能问题。

第一种是“redo log写满了，要flush脏页”，这种情况是InnoDB要尽量避免的。因为出现这种情况的时候，整个系统就不能再接受更新了，所有的更新都必须堵住。如果你从监控上看，这时候更新数会跌为0。

第二种是“内存不够用了，要先将脏页写到磁盘”，这种情况其实是常态。**InnoDB用缓冲池（`buffer pool`）管理内存，缓冲池中的内存页有三种状态：**

- 第一种是，还没有使用的；
- 第二种是，使用了并且是干净页；
- 第三种是，使用了并且是脏页。


InnoDB的策略是尽量使用内存，因此对于一个长时间运行的库来说，未被使用的页面很少。

而当要读入的数据页没有在内存的时候，就必须到缓冲池中申请一个数据页。这时候只能把最久不使用的数据页从内存中淘汰掉：如果要淘汰的是一个干净页，就直接释放出来复用；但如果是脏页呢，就必须将脏页先刷到磁盘，变成干净页后才能复用。

所以，刷脏页虽然是常态，但是出现以下这两种情况，都是会明显影响性能的：

  1. 一个查询要淘汰的脏页个数太多，会导致查询的响应时间明显变长；

  2. 日志写满，更新全部堵住，写性能跌为0，这种情况对敏感业务来说，是不能接受的。


所以，InnoDB需要有控制脏页比例的机制，来尽量避免上面的这两种情况。

## InnoDB刷脏页的控制策略

接下来，我就来和你说说InnoDB脏页的控制策略，以及和这些策略相关的参数。

首先，你要正确地告诉InnoDB所在主机的IO能力，这样InnoDB才能知道需要全力刷脏页的时候，可以刷多快。

这就要用到innodb_io_capacity这个参数了，它会告诉InnoDB你的磁盘能力。这个值我建议你设置成磁盘的IOPS。磁盘的IOPS可以通过fio这个工具来测试，下面的语句是我用来测试磁盘随机读写的命令：
    
    
     fio -filename=$filename -direct=1 -iodepth 1 -thread -rw=randrw -ioengine=psync -bs=16k -size=500M -numjobs=10 -runtime=10 -group_reporting -name=mytest 
    

其实，因为没能正确地设置innodb_io_capacity参数，而导致的性能问题也比比皆是。之前，就曾有其他公司的开发负责人找我看一个库的性能问题，说MySQL的写入速度很慢，TPS很低，但是数据库主机的IO压力并不大。经过一番排查，发现罪魁祸首就是这个参数的设置出了问题。

他的主机磁盘用的是SSD，但是innodb_io_capacity的值设置的是300。于是，InnoDB认为这个系统的能力就这么差，所以刷脏页刷得特别慢，甚至比脏页生成的速度还慢，这样就造成了脏页累积，影响了查询和更新性能。

虽然我们现在已经定义了“全力刷脏页”的行为，但平时总不能一直是全力刷吧？毕竟磁盘能力不能只用来刷脏页，还需要服务用户请求。所以接下来，我们就一起看看InnoDB怎么控制引擎按照“全力”的百分比来刷脏页。

根据我前面提到的知识点，试想一下，**如果你来设计策略控制刷脏页的速度，会参考哪些因素呢？**

这个问题可以这么想，如果刷太慢，会出现什么情况？首先是内存脏页太多，其次是redo log写满。

所以，InnoDB的刷盘速度就是要参考这两个因素：一个是脏页比例，一个是redo log写盘速度。

InnoDB会根据这两个因素先单独算出两个数字。

参数innodb_max_dirty_pages_pct是脏页比例上限，默认值是75%。InnoDB会根据当前的脏页比例（假设为M），算出一个范围在0到100之间的数字，计算这个数字的伪代码类似这样：

```
F1(M)
{
  if M>=innodb_max_dirty_pages_pct then
      return 100;
  return 100*M/innodb_max_dirty_pages_pct;
}
```


InnoDB每次写入的日志都有一个序号，当前写入的序号跟checkpoint对应的序号之间的差值，我们假设为N。InnoDB会根据这个N算出一个范围在0到100之间的数字，这个计算公式可以记为F2(N)。F2(N)算法比较复杂，你只要知道N越大，算出来的值越大就好了。

然后，**根据上述算得的F1(M)和F2(N)两个值，取其中较大的值记为R，之后引擎就可以按照innodb_io_capacity定义的能力乘以R%来控制刷脏页的速度。**

上述的计算流程比较抽象，不容易理解，所以我画了一个简单的流程图。图中的F1、F2就是上面我们通过脏页比例和redo log写入速度算出来的两个值。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;font-size:14px;color:var(--d-text);max-width:500px;width:100%;">
  <!-- 标题 -->
  <div style="text-align:center;font-weight:bold;margin-bottom:16px;font-size:15px;color:var(--d-text);">图3 InnoDB 刷脏页速度策略</div>
  <svg viewBox="0 0 460 260" style="width:100%;height:auto;">
    <defs>
      <marker id="arrowF3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6" style="fill:var(--d-text-sub)"/>
      </marker>
    </defs>
    <!-- 输入因素1：脏页比例 -->
    <rect x="10" y="20" width="150" height="60" rx="8" style="fill:var(--d-blue-bg);stroke:var(--d-blue-border);stroke-width:1.5"/>
    <text x="85" y="42" text-anchor="middle" style="font-size:12px;font-weight:bold;fill:var(--d-blue);">脏页比例 M</text>
    <text x="85" y="60" text-anchor="middle" style="font-size:10px;fill:var(--d-text-muted);">innodb_max_dirty_pages_pct</text>
    <!-- 输入因素2：redo log 写入量 -->
    <rect x="10" y="120" width="150" height="60" rx="8" style="fill:var(--d-blue-bg);stroke:var(--d-blue-border);stroke-width:1.5"/>
    <text x="85" y="142" text-anchor="middle" style="font-size:12px;font-weight:bold;fill:var(--d-blue);">redo log 写入量 N</text>
    <text x="85" y="160" text-anchor="middle" style="font-size:10px;fill:var(--d-text-muted);">sequence差值(LSN)</text>
    <!-- 箭头：因素1 → F1(M) -->
    <line x1="160" y1="50" x2="195" y2="50" style="stroke:var(--d-text-sub);stroke-width:1.5" marker-end="url(#arrowF3)"/>
    <!-- 箭头：因素2 → F2(N) -->
    <line x1="160" y1="150" x2="195" y2="150" style="stroke:var(--d-text-sub);stroke-width:1.5" marker-end="url(#arrowF3)"/>
    <!-- F1(M) 计算框 -->
    <rect x="200" y="28" width="80" height="44" rx="6" style="fill:var(--d-bg-alt);stroke:var(--d-border);stroke-width:1.5"/>
    <text x="240" y="55" text-anchor="middle" style="font-size:13px;font-weight:bold;fill:var(--d-orange);">F1(M)</text>
    <!-- F2(N) 计算框 -->
    <rect x="200" y="128" width="80" height="44" rx="6" style="fill:var(--d-bg-alt);stroke:var(--d-border);stroke-width:1.5"/>
    <text x="240" y="155" text-anchor="middle" style="font-size:13px;font-weight:bold;fill:var(--d-orange);">F2(N)</text>
    <!-- 箭头：F1 → max -->
    <line x1="280" y1="50" x2="310" y2="95" style="stroke:var(--d-text-sub);stroke-width:1.5" marker-end="url(#arrowF3)"/>
    <!-- 箭头：F2 → max -->
    <line x1="280" y1="150" x2="310" y2="105" style="stroke:var(--d-text-sub);stroke-width:1.5" marker-end="url(#arrowF3)"/>
    <!-- max 合并框 -->
    <rect x="315" y="78" width="60" height="44" rx="22" style="fill:var(--d-orange);opacity:0.15;stroke:var(--d-orange);stroke-width:1.5"/>
    <text x="345" y="105" text-anchor="middle" style="font-size:13px;font-weight:bold;fill:var(--d-orange);">R=max</text>
    <!-- 箭头：max → 输出 -->
    <line x1="375" y1="100" x2="395" y2="100" style="stroke:var(--d-text-sub);stroke-width:1.5" marker-end="url(#arrowF3)"/>
    <!-- 输出：实际刷盘速度 -->
    <rect x="400" y="20" width="55" height="160" rx="8" style="fill:var(--d-green);opacity:0.12;stroke:var(--d-green);stroke-width:1.5"/>
    <text x="427" y="75" text-anchor="middle" style="font-size:11px;fill:var(--d-text-sub);font-weight:bold;" transform="rotate(90,427,75)">实际刷盘速度</text>
    <text x="427" y="145" text-anchor="middle" style="font-size:10px;fill:var(--d-green);font-weight:bold;" transform="rotate(90,427,145)">io_capacity × R%</text>
    <!-- 底部说明 -->
    <text x="230" y="215" text-anchor="middle" style="font-size:12px;fill:var(--d-text-sub);">R = max( F1(M), F2(N) )</text>
    <text x="230" y="235" text-anchor="middle" style="font-size:11px;fill:var(--d-text-muted);">刷脏页速度 = innodb_io_capacity × R%</text>
    <text x="230" y="253" text-anchor="middle" style="font-size:11px;fill:var(--d-text-muted);">取两者中较大的值，确保不会落后太多</text>
  </svg>
</div>
</div>


现在你知道了，InnoDB会在后台刷脏页，而刷脏页的过程是要将内存页写入磁盘。所以，无论是你的查询语句在需要内存的时候可能要求淘汰一个脏页，还是由于刷脏页的逻辑会占用IO资源并可能影响到了你的更新语句，都可能是造成你从业务端感知到MySQL“抖”了一下的原因。

要尽量避免这种情况，你就要合理地设置innodb_io_capacity的值，并且**平时要多关注脏页比例，不要让它经常接近75%** 。

其中，脏页比例是通过Innodb_buffer_pool_pages_dirty/Innodb_buffer_pool_pages_total得到的，具体的命令参考下面的代码：

```sql
mysql> select VARIABLE_VALUE into @a from global_status where VARIABLE_NAME = 'Innodb_buffer_pool_pages_dirty';
select VARIABLE_VALUE into @b from global_status where VARIABLE_NAME = 'Innodb_buffer_pool_pages_total';
select @a/@b;
```


接下来，我们再看一个有趣的策略。

一旦一个查询请求需要在执行过程中先flush掉一个脏页时，这个查询就可能要比平时慢了。而MySQL中的一个机制，可能让你的查询会更慢：在准备刷一个脏页的时候，如果这个数据页旁边的数据页刚好是脏页，就会把这个“邻居”也带着一起刷掉；而且这个把“邻居”拖下水的逻辑还可以继续蔓延，也就是对于每个邻居数据页，如果跟它相邻的数据页也还是脏页的话，也会被放到一起刷。

在InnoDB中，`innodb_flush_neighbors` 参数就是用来控制这个行为的，值为1的时候会有上述的“连坐”机制，值为0时表示不找邻居，自己刷自己的。

找“邻居”这个优化在机械硬盘时代是很有意义的，可以减少很多随机IO。机械硬盘的随机IOPS一般只有几百，相同的逻辑操作减少随机IO就意味着系统性能的大幅度提升。

而如果使用的是SSD这类IOPS比较高的设备的话，我就建议你把innodb_flush_neighbors的值设置成0。因为这时候IOPS往往不是瓶颈，而“只刷自己”，就能更快地执行完必要的刷脏页操作，减少SQL语句响应时间。

在MySQL 8.0中，innodb_flush_neighbors参数的默认值已经是0了。

## 小结

今天这篇文章，我延续第2篇中介绍的WAL的概念，和你解释了这个机制后续需要的刷脏页操作和执行时机。利用WAL技术，数据库将随机写转换成了顺序写，大大提升了数据库的性能。

但是，由此也带来了内存脏页的问题。脏页会被后台线程自动flush，也会由于数据页淘汰而触发flush，而刷脏页的过程由于会占用资源，可能会让你的更新和查询语句的响应时间长一些。在文章里，我也给你介绍了控制刷脏页的方法和对应的监控方式。

文章最后，我给你留下一个思考题吧。

一个内存配置为128GB、innodb_io_capacity设置为20000的大规格实例，正常会建议你将redo log设置成4个1GB的文件。

但如果你在配置的时候不慎将redo log设置成了1个100M的文件，会发生什么情况呢？又为什么会出现这样的情况呢？

你可以把你的分析结论写在留言区里，我会在下一篇文章的末尾和你讨论这个问题。感谢你的收听，也欢迎你把这篇文章分享给更多的朋友一起阅读。

## 上期问题时间

上期我留给你的问题是，给一个学号字段创建索引，有哪些方法。

由于这个学号的规则，无论是正向还是反向的前缀索引，重复度都比较高。因为维护的只是一个学校的，因此前面6位（其中，前三位是所在城市编号、第四到第六位是学校编号）其实是固定的，邮箱后缀都是@gamil.com，因此可以只存入学年份加顺序编号，它们的长度是9位。

而其实在此基础上，可以用数字类型来存这9位数字。比如201100001，这样只需要占4个字节。其实这个就是一种hash，只是它用了最简单的转换规则：字符串转数字的规则，而刚好我们设定的这个背景，可以保证这个转换后结果的唯一性。

评论区中，也有其他一些很不错的见解。

评论用户@封建的风 说，一个学校的总人数这种数据量，50年才100万学生，这个表肯定是小表。为了业务简单，直接存原来的字符串。这个答复里面包含了“优化成本和收益”的思想，我觉得值得at出来。

@小潘 同学提了另外一个极致的方向。如果碰到表数据量特别大的场景，通过这种方式的收益是很不错的。

**评论区留言点赞板：**

> @lttzzlll ，提到了用整型存“四位年份+五位编号”的方法；  
>  由于整个学号的值超过了int上限，@老杨同志 也提到了用8个字节的bigint来存的方法。
