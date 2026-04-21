---
title: Etcd 故障场景演练与排障实验手册
description: 面向实验环境整理 etcd 的单节点故障、Leader 切换、网络分区、quorum 丢失、NOSPACE 告警、Watch compacted、成员替换与快照恢复演练。
---

# Etcd 故障场景演练与排障实验手册

真正会用 etcd，不只是会讲原理，也不只是会敲 `etcdctl`，而是遇到故障时脑子里有一条固定排查链路。

这页专门做两件事：

- 把最值得演练的 etcd 故障场景按“触发方式 -> 观察点 -> 正确结论”串起来
- 把“值班时应该先看什么”落成一套能反复练的实验路径

这页默认场景是：

- 你已经有一套实验用的单机或 3 节点 etcd
- 你可以安全地停服务、改防火墙或清理数据目录
- 你不会拿生产集群做第一次演练

## 快速导航

- [演练前先立住 5 条原则](#演练前先立住-5-条原则)
- [统一观测面：先把这些命令备好](#统一观测面先把这些命令备好)
- [演练 1：停掉一个 Follower](#演练-1停掉一个-follower)
- [演练 2：停掉当前 Leader](#演练-2停掉当前-leader)
- [演练 3：隔离单节点 peer 网络](#演练-3隔离单节点-peer-网络)
- [演练 4：故意打掉 quorum](#演练-4故意打掉-quorum)
- [演练 5：制造 NOSPACE 告警](#演练-5制造-nospace-告警)
- [演练 6：复现 Watch 遇到 compacted](#演练-6复现-watch-遇到-compacted)
- [演练 7：成员替换与重新加入](#演练-7成员替换与重新加入)
- [演练 8：快照恢复演练](#演练-8快照恢复演练)
- [最短排障顺序](#最短排障顺序)

## 演练前先立住 5 条原则

### 1. 生产和实验环境严格分开

下面这些动作都不适合第一次就在生产上做：

- 停 Leader
- 停多个节点
- 改 peer 网络
- 手动 compact / defrag / alarm disarm
- snapshot restore

### 2. 每次只改一个变量

最容易把演练做乱的方式，就是一次同时改：

- systemd
- 防火墙
- 配置文件
- 证书

一次只制造一种故障，现象才可解释。

### 3. 每次演练前都先做基线记录

开始前先留一份基线：

```bash
etcdctl --cluster endpoint status --write-out=table
etcdctl --cluster endpoint health
etcdctl member list -w=table
```

如果这三步一开始就不稳，先别演练。

### 4. 先定义“预期现象”，再动手

比如：

- 单节点故障时，剩余多数派应该还能写
- Leader 故障时，应该经历一次短暂选主
- quorum 丢失时，写入和成员变更都应该受影响

只有先知道正确现象，演练才不会变成瞎猜。

### 5. 每次演练结束都要恢复到干净状态

至少确认：

- 三个节点都回来了
- endpoint health 重新正常
- endpoint hashkv 没漂
- 告警都清掉了

## 统一观测面：先把这些命令备好

从官方状态检查文档看，最核心的三组命令就是：

- `endpoint status`
- `endpoint health`
- `endpoint hashkv`

这三组命令足够覆盖大部分演练观察面。

### 1. 一组通用环境变量

```bash
export ETCDCTL_API=3
export ENDPOINTS="https://10.0.0.11:2379,https://10.0.0.12:2379,https://10.0.0.13:2379"
export CACERT="/etc/ssl/etcd/ca.crt"
export CERT="/etc/ssl/etcd/client.crt"
export KEY="/etc/ssl/etcd/client.key"
```

### 2. 基线状态

```bash
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" \
  endpoint status --write-out=table

etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" \
  endpoint health

etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" \
  endpoint hashkv --write-out=table

etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" \
  member list -w=table
```

### 3. 节点侧日志

```bash
journalctl -u etcd -f
```

演练过程中，命令行现象和日志现象最好一起看。

## 演练 1：停掉一个 Follower

这是最适合先做的第一组实验。

### 目标

- 确认 3 节点集群在丢 1 个非 Leader 节点时仍然能工作
- 观察剩余两节点仍能组成多数派
- 练习“单节点挂了，但不是 quorum 问题”这类判断

### 触发方式

先用 `endpoint status` 找当前哪个不是 Leader，再到目标节点执行：

```bash
sudo systemctl stop etcd
```

### 观察什么

```bash
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" endpoint health
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" endpoint status --write-out=table
```

### 正确现象

- 挂掉的那个 endpoint 不健康
- 剩余两个节点仍能写入
- Leader 不一定变化
- `member list` 里成员还在，只是其中一个节点当前不可用

### 正确结论

这类故障的本质不是“集群坏了”，而是“单节点不可用，但多数派仍在”。

### 恢复

```bash
sudo systemctl start etcd
```

恢复后再看：

```bash
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" endpoint health
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" endpoint hashkv --write-out=table
```

## 演练 2：停掉当前 Leader

这组实验最适合用来感受“短暂抖动但不该长期不可用”。

### 目标

- 观察 Leader 故障后的重新选举
- 感受写入在选举窗口内的短暂中断
- 练习“Leader 挂了”和“失去 quorum”不是一回事

### 触发方式

先看谁是 Leader：

```bash
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" \
  endpoint status --write-out=table
```

然后在 Leader 所在节点执行：

```bash
sudo systemctl stop etcd
```

### 观察什么

- `endpoint status` 的 `IS LEADER`
- 写请求是否有短暂失败
- 新 Leader 是否很快选出

### 一个最小写入探针

```bash
while true; do
  date +%s | etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" put /drill/leader/probe -
  sleep 1
done
```

### 正确现象

- 会经历一次短暂 leader 切换
- 官方 runtime reconfiguration 文档提到，移除 Leader 时集群会在重新选主期间短暂不可用，持续时间通常是 election timeout 加上一轮投票过程
- 只要剩余两个节点还能互通，选完主后应恢复正常写入

### 正确结论

Leader 故障的关键不是“有没有切主”，而是“切主后有没有稳定恢复写入”。

## 演练 3：隔离单节点 peer 网络

这组实验比单纯停服务更接近真实网络故障。

### 目标

- 观察“进程活着，但 peer 通讯坏了”时的现象
- 理解 client 端口和 peer 端口不是一回事
- 练习“单节点网络隔离”和“整集群不可用”的区别

### 触发方式

在目标节点上阻断 2380 peer 通讯。实验方式很多，这里只写成思路：

- 阻断该节点到其他节点的 2380
- 或阻断其他节点到该节点的 2380

### 观察什么

- 该节点日志里是否出现 raft peer 通讯异常
- `endpoint health` 是否有节点变差
- 其余两节点是否还能稳定写入

### 正确现象

- 如果只隔离了一个节点，另外两个节点仍构成多数派
- 多数派一侧仍然能继续推进
- 被隔离节点会落后，恢复后再追赶日志

### 正确结论

进程活着不等于节点健康；peer 网络坏掉，本质上还是 quorum 问题。

## 演练 4：故意打掉 quorum

这组实验一定只在实验环境做。

### 目标

- 真正感受“多数派没了”以后，etcd 为什么会停摆
- 练习把“机器活着”和“集群还能推进”分开理解

### 触发方式

在 3 节点集群里停掉两个节点：

```bash
sudo systemctl stop etcd
```

在两台节点上各执行一次。

### 观察什么

- 写请求是否失败
- `endpoint health` 是否大量异常
- `member add/remove` 这类成员变更是否还能执行

### 正确现象

- 集群失去 quorum 后，不能继续正常接受更新
- 成员变更本质上也是写操作，所以同样受影响
- 这正是为什么官方运行时重配置文档明确强调：成员变更前必须先保证多数派可用，而且变更要串行进行

### 恢复方式

优先恢复原有多数派成员。  
如果原成员真的永久损坏并导致多数派不可恢复，就要进入快照恢复流程，而不是在原地硬改配置。

## 演练 5：制造 NOSPACE 告警

这组实验最能帮你真正理解 `mvcc: database space exceeded`。

### 重要前提

只在单独的实验实例上做。  
官方维护文档给出的做法，就是把 backend quota 调得很小，再用循环写满它。

### 触发方式

用单独实例启动一个很小的 quota，例如：

```bash
etcd --quota-backend-bytes=$((16*1024*1024))
```

然后用类似官方文档里的方式填满：

```bash
while [ 1 ]; do
  dd if=/dev/urandom bs=1024 count=1024 2>/dev/null | \
    ETCDCTL_API=3 etcdctl put key -
done
```

### 观察什么

```bash
etcdctl alarm list
etcdctl endpoint status --write-out=table
```

### 正确现象

- 会看到 `mvcc: database space exceeded`
- 官方维护文档说明：超过 quota 后，会触发 cluster-wide `NOSPACE` alarm，进入只接受 key read 和 delete 的维护模式

### 官方建议的恢复顺序

```bash
# 取当前 revision
rev=$(etcdctl endpoint status --write-out=json | egrep -o '"revision":[0-9]*' | egrep -o '[0-9].*')

# 先 compact
etcdctl compact "$rev"

# 再 defrag
etcdctl defrag

# 最后 disarm
etcdctl alarm disarm
```

### 这里最容易忽略的坑

官方维护文档还特别提醒了一点：

- `Put/Txn/LeaseGrant` 可能返回 `ErrGRPCNoSpace`
- 但这次写入仍有可能已经在 backend 成功

所以这类事故处理时，不能只看“客户端报错了没有”，还要回头核对实际状态。

## 演练 6：复现 Watch 遇到 compacted

这组实验能把 Watch 的“可续追”边界真正看清。

### 目标

- 观察 Watch 在历史窗口内是可续追的
- 理解为什么 compact 之后旧 revision 会追不上

### 触发思路

1. 先写一批 key，记住当前 revision
2. 对 key 做更多更新
3. 手动 compact 到更高 revision
4. 再从一个过旧 revision 开 Watch

### 示例命令

```bash
etcdctl put /drill/watch/a 1
etcdctl put /drill/watch/a 2
etcdctl put /drill/watch/a 3
```

然后从旧 revision 开 Watch：

```bash
etcdctl watch /drill/watch --prefix --rev=<old-revision>
```

### 正确现象

- 只要 revision 还在历史窗口内，Watch 可以续追
- 官方 API guarantees 文档说明，broken watch 可以从最后已知 revision 后继续追，只要这个 revision 仍在历史窗口里
- 但一旦 revision 已被 compact 掉，就会遇到 compacted

### 正确结论

Watch 不是“永远可回放”，而是“在历史窗口内可恢复”。

## 演练 7：成员替换与重新加入

这组实验最适合放在“单节点永久损坏”的语境里演练。

### 目标

- 练习正确的 member remove / add 流程
- 理解“替换节点”不是直接改配置文件
- 观察新成员 catch up 的过程

### 正确原则

官方 runtime reconfiguration 文档强调：

- 成员变更前，多数派必须可用
- 变更要串行做
- add 新成员是两步：先 `member add`，再按新集群配置启动该成员

### 一个更稳的演练方式

如果版本支持 learner，官方也建议优先把新成员先加成 learner，再等它追平后 promote。

大致顺序：

1. 记录当前 `member list`
2. 移除坏成员
3. `member add --learner` 新成员
4. 用打印出来的新 `initial-cluster` 配置启动新节点
5. 观察新节点追平
6. `member promote`

### 正确现象

- 新成员不是“进程起来就算成功”
- 真正成功的标准是：
  - endpoint health 正常
  - hashkv 不漂
  - learner 已追平并被提升

## 演练 8：快照恢复演练

这组实验最值得定期做，因为很多团队平时会备份，但从不真正 restore。

### 目标

- 把 snapshot save / status / restore 串成闭环
- 理解“restore 会生成一个新逻辑集群”
- 理解为什么 Kubernetes / Watch 消费者场景下要考虑 revision bump

### 第一步：做 snapshot

```bash
etcdctl --endpoints="$ENDPOINTS" --cacert="$CACERT" --cert="$CERT" --key="$KEY" \
  snapshot save snapshot.db

etcdutl snapshot status snapshot.db -w table
```

### 第二步：恢复到新 data-dir

```bash
etcdutl snapshot restore snapshot.db --data-dir output-dir
```

### 这里最关键的结论

官方灾备文档明确写了：

- restore 会覆盖 member ID 和 cluster ID
- 成员会失去原身份
- 所以 restore 之后必须启动成一个**新的逻辑集群**

### Kubernetes / Watch 消费者为什么要更谨慎

官方 v3.5 灾备文档特别提醒：

- 如果恢复到旧 revision，Kubernetes informer 或其他本地缓存型 Watch 消费者可能不会正确刷新
- 在已知有 Watch 消费者、本地缓存或 Kubernetes 场景下，官方建议 restore 时使用 revision bump

### 这组实验最该学到什么

- 备份不等于可恢复
- restore 不是“拷回旧目录”
- 真正可靠的是“snapshot + 恢复演练 + 启动新逻辑集群”的闭环

## 最短排障顺序

如果线上真的报 etcd 故障，建议先按下面顺序走。

### 第 1 步：先看是不是 quorum 问题

- 还有几个节点在线
- 在线节点彼此是否互通
- 还能不能形成多数派

### 第 2 步：再看当前 Leader 和状态面

```bash
etcdctl --cluster endpoint status --write-out=table
etcdctl --cluster endpoint health
```

### 第 3 步：再看成员和一致性

```bash
etcdctl member list -w=table
etcdctl --cluster endpoint hashkv --write-out=table
```

### 第 4 步：再看日志、磁盘、网络

- `journalctl -u etcd`
- 磁盘 fsync / IO 延迟
- 2379 / 2380 连通性

### 第 5 步：最后看空间和恢复动作

- 有没有 `NOSPACE`
- 是否需要 compact / defrag / disarm
- 是否已经进入快照恢复语境

## 关联资料

- [Etcd 专题总览](./index.md)
- [Etcdctl 常用命令与实验手册](./etcdctl-commands-and-lab.md)
- [Etcd 单机 / 3 节点部署与 TLS 证书实战](./deployment-and-tls-practice.md)
- [Etcd 运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md)
- [Etcd 必备问题与自检清单](./essential-questions.md)
- [Etcd 源码阅读入口与实现链路](./source-reading-guide.md)
