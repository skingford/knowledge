---
title: Etcdctl 常用命令与实验手册
description: 系统整理 etcdctl 的连接模板、KV / Watch / Lease / Txn 常用命令、endpoint / member / snapshot 运维命令，以及适合自测的实验步骤。
---

# Etcdctl 常用命令与实验手册

理解 etcd 的最好方式之一，不只是看概念，而是亲手跑几遍 `etcdctl`。这页不是把命令全列一遍，而是整理一条最常用的实操主线：

- 怎么连到 etcd
- 怎么看 Key、前缀、revision 和 Watch
- 怎么做 Lease、Txn、CAS 小实验
- 怎么看 endpoint 状态、member 信息和 snapshot
- 哪些命令适合实验环境，哪些命令到生产要格外谨慎

## 快速导航

- [先准备一套连接模板](#先准备一套连接模板)
- [基础 KV 命令](#基础-kv-命令)
- [Watch 与 revision 小实验](#watch-与-revision-小实验)
- [Lease 与 TTL 小实验](#lease-与-ttl-小实验)
- [Txn 与 CAS 小实验](#txn-与-cas-小实验)
- [endpoint、member 与集群状态命令](#endpointmember-与集群状态命令)
- [snapshot、compact、defrag 命令边界](#snapshotcompactdefrag-命令边界)
- [一套适合自测的实验顺序](#一套适合自测的实验顺序)
- [常见误区](#常见误区)

## 先准备一套连接模板

`etcdctl` 的高频问题，往往不是命令本身，而是根本没连对集群。

### 1. 最基础的环境变量

```bash
export ETCDCTL_API=3
export ETCDCTL_ENDPOINTS="https://127.0.0.1:2379"
export ETCDCTL_CACERT="/path/to/ca.crt"
export ETCDCTL_CERT="/path/to/client.crt"
export ETCDCTL_KEY="/path/to/client.key"
```

如果是启用了 TLS 的集群，后面大多数命令都需要这一组环境变量。

### 2. 直接在命令行里显式写参数

```bash
ETCDCTL_API=3 etcdctl \
  --endpoints="https://127.0.0.1:2379" \
  --cacert="/path/to/ca.crt" \
  --cert="/path/to/client.crt" \
  --key="/path/to/client.key" \
  endpoint health
```

这种方式适合：

- 临时执行一次命令
- 写进脚本或 SOP
- 避免依赖当前 shell 环境

### 3. K8s 控制面机器上的常见证书路径

如果是 kubeadm 默认栈里自带的 etcd，经常会看到类似下面的路径：

```bash
ETCDCTL_API=3 etcdctl \
  --endpoints="https://127.0.0.1:2379" \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  endpoint health
```

这类路径是不是可用，取决于你的部署方式，不要机械照抄到所有环境。

### 4. 先验证连接是否真的通

```bash
etcdctl endpoint health
etcdctl endpoint status --write-out=table
```

如果这两步都不通，先别急着跑后面的命令，优先回头检查：

- endpoints 是否正确
- TLS 证书是否匹配
- 当前节点是否真的能访问 etcd

## 基础 KV 命令

### 1. 写入和读取

```bash
# 写入
etcdctl put /demo/name "etcd"

# 读取单个 key
etcdctl get /demo/name

# 删除
etcdctl del /demo/name
```

### 2. 按前缀查看

```bash
etcdctl put /demo/app/a "v1"
etcdctl put /demo/app/b "v2"

etcdctl get /demo/app --prefix
```

这类命令适合查看：

- 服务注册前缀
- 配置中心前缀
- 某一类资源的命名空间

### 3. 查看元数据而不只看值

```bash
etcdctl get /demo/app/a -w=json
```

重点不是输出格式本身，而是你要开始关注：

- `create_revision`
- `mod_revision`
- `version`

因为这些字段后面直接关系到 Watch、CAS 和幂等更新。

## Watch 与 revision 小实验

Watch 最适合用一个两窗口实验来理解。

### 窗口 A：启动 Watch

```bash
etcdctl watch /demo/watch
```

### 窗口 B：执行变更

```bash
etcdctl put /demo/watch "v1"
etcdctl put /demo/watch "v2"
etcdctl del /demo/watch
```

这时你会在窗口 A 看到顺序事件流。

### 再做一步：Watch 一个前缀

```bash
etcdctl watch /demo/prefix --prefix
```

然后在另一个窗口里写：

```bash
etcdctl put /demo/prefix/a "1"
etcdctl put /demo/prefix/b "2"
etcdctl del /demo/prefix/a
```

### 这个实验要观察什么

- Watch 收到的是**事件顺序**
- 前缀 Watch 很适合模拟服务发现和配置推送
- 你看到的不是“某个回调函数”，而是一条基于 revision 的变更流

## Lease 与 TTL 小实验

etcd 的很多关键能力，本质上都绕不开 Lease。

### 1. 申请一个 10 秒 TTL 的 Lease

```bash
etcdctl lease grant 10
```

你会得到一个 Lease ID，记成 `<lease-id>`。

### 2. 把 Key 绑定到 Lease

```bash
etcdctl put /demo/lease "alive" --lease=<lease-id>
```

### 3. 看 Lease 详情

```bash
etcdctl lease timetolive <lease-id> --keys
```

这个命令非常适合理解：

- TTL 还剩多久
- 哪些 Key 绑在这个 Lease 上

### 4. 做一次 KeepAlive 观察

```bash
etcdctl lease keep-alive <lease-id>
```

此时再开一个窗口执行：

```bash
etcdctl get /demo/lease
```

停止 KeepAlive 后，等 TTL 到期，再读这个 Key，通常就会发现它已经自动消失。

### 这个实验能帮你理解什么

- 服务注册为什么必须绑 Lease
- KeepAlive 停止后为什么实例会被自动摘除
- “临时 Key”真正依赖的不是路径，而是 Lease 生命周期

## Txn 与 CAS 小实验

etcd 的事务高频用法不是复杂业务事务，而是 Compare-And-Swap。

### 1. 先准备一个 Key

```bash
etcdctl put /demo/txn "v1"
etcdctl get /demo/txn -w=json
```

记住它当前的 `mod_revision`，假设是 `25`。

### 2. 做条件更新

```bash
etcdctl txn <<'EOF'
cmp
mod("/demo/txn") = "25"
then
put /demo/txn "v2"
else
get /demo/txn
EOF
```

如果 `mod_revision` 还是 25，就会成功更新；如果中途被别人改过，就会走 `else` 分支。

### 3. 做一个“仅当不存在才创建”的小实验

```bash
etcdctl txn <<'EOF'
cmp
version("/demo/lock") = "0"
then
put /demo/lock "owner-a"
else
get /demo/lock
EOF
```

这正是很多锁和选主场景的基础模式。

### 这个实验最该记住什么

- etcd 的事务核心在 **compare**
- `mod_revision` 适合防覆盖更新
- `version == 0` 常用来判断“是否首次创建”

## endpoint、member 与集群状态命令

这些命令更偏“看集群本身”，不是看业务 Key。

### endpoint health

```bash
etcdctl endpoint health
```

适合回答：

- endpoint 当前能否响应请求
- 客户端和集群当前是否基本连通

### endpoint status

```bash
etcdctl endpoint status --write-out=table
```

高频关注点：

- 当前节点是否为 Leader
- Raft term / index
- 数据库大小

如果多个 endpoint 的状态差异很大，通常值得继续看网络、磁盘或节点健康。

### endpoint hashkv

```bash
etcdctl endpoint hashkv --write-out=table
```

这个命令常用于比较多个节点在某个 revision 上的 KV 哈希是否一致，适合排查：

- 数据是否可能不一致
- 恢复或同步后是否已经收敛

### member list

```bash
etcdctl member list -w=table
```

适合快速确认：

- 集群成员有哪些
- peer / client 地址是什么
- 某个坏节点是否还在成员列表里

### member add / remove

```bash
# 示例：删除旧成员
etcdctl member remove <member-id>

# 示例：新增成员
etcdctl member add <name> --peer-urls=https://10.0.0.5:2380
```

这一组命令在生产里一定要谨慎，因为它改的是**集群成员关系本身**。做之前先确认：

- 当前还有 quorum
- 你删掉的不是误判的临时异常节点
- 新节点的 peer 配置和证书已经准备好

## snapshot、compact、defrag 命令边界

这一组命令和运维关系最紧，适合专门记住边界。

### snapshot save

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d).db
```

更稳妥的写法通常是带上完整连接参数。

### 保存完别忘了做 status

```bash
etcdctl snapshot status /backup/etcd-20260421.db --write-out=table
```

这一步能帮助你确认：

- 文件是否真的可读
- snapshot 基本信息是否正常

### compact

```bash
etcdctl compact <revision>
```

这个命令会清理某个 revision 之前的历史版本。适合记住两点：

- 它影响的是旧 revision 历史
- 旧 Watch 如果还想从被清掉的位置继续追，会遇到 compacted

### defrag

```bash
etcdctl defrag
```

或者对指定 endpoint：

```bash
etcdctl --endpoints="https://127.0.0.1:2379" defrag
```

它做的是底层空间整理，不是历史版本逻辑清理。

### 这一组命令最该注意什么

- `snapshot` 适合备份与恢复准备
- `compact` 影响历史版本可见性
- `defrag` 影响空间回收与 IO

在生产执行前，最好先结合 [Etcd 运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md) 一起看。

## 一套适合自测的实验顺序

如果你本地已经有一个可用的 etcd，可以按下面顺序跑一遍。

### 第 1 组：KV 与前缀

```bash
etcdctl put /lab/user/a "A"
etcdctl put /lab/user/b "B"
etcdctl get /lab/user --prefix
```

目标：

- 熟悉 Key 前缀组织方式
- 观察 etcd 更像“元数据树”而不是普通 map

### 第 2 组：revision 观察

```bash
etcdctl get /lab/user/a -w=json
etcdctl put /lab/user/a "A2"
etcdctl get /lab/user/a -w=json
```

目标：

- 观察 `mod_revision` 和 `version` 的变化

### 第 3 组：Watch

窗口 A：

```bash
etcdctl watch /lab/user --prefix
```

窗口 B：

```bash
etcdctl put /lab/user/c "C"
etcdctl del /lab/user/b
```

目标：

- 体验前缀 Watch 的事件流

### 第 4 组：Lease

```bash
etcdctl lease grant 5
etcdctl put /lab/ephemeral "tmp" --lease=<lease-id>
etcdctl lease timetolive <lease-id> --keys
```

目标：

- 观察 TTL 倒计时与自动删除

### 第 5 组：Txn / CAS

```bash
etcdctl put /lab/cas "v1"
etcdctl get /lab/cas -w=json
```

然后按前面的 `txn` 模板做一次基于 `mod_revision` 的条件更新。

目标：

- 把“乐观锁”从概念变成手感

### 第 6 组：endpoint / snapshot

```bash
etcdctl endpoint status --write-out=table
etcdctl snapshot save /tmp/etcd-lab.db
etcdctl snapshot status /tmp/etcd-lab.db --write-out=table
```

目标：

- 把业务数据操作和集群状态操作分开理解

## 常见误区

### 1. 用错 API 版本

如果没设 `ETCDCTL_API=3`，很多命令行为可能和你预期不一致。现在大多数学习和生产语境都默认按 v3 理解。

### 2. 只看 Key 值，不看 revision 元数据

这样很容易把 etcd 误解成普通 KV，而看不见它最关键的版本语义。

### 3. 直接在生产上做试验

尤其是：

- `member remove`
- `member add`
- `compact`
- `defrag`

这些都不适合拿线上集群“边看边试”。

### 4. 把 Watch 当消息队列消费

`etcdctl watch` 很适合做观察和理解，不适合让你误以为 etcd 能替代 MQ。

## 小结

这页最重要的不是记住所有命令，而是把它们分成四层：

- 数据层：`put/get/del`
- 生命周期层：`lease`
- 一致性层：`txn/watch/revision`
- 运维层：`endpoint/member/snapshot/compact/defrag`

如果这四层已经顺了，再回头看 [Etcd 核心机制：Raft、Revision、Lease 与 Watch](./technical-guide.md) 和 [Etcd 场景与模式：注册发现、配置中心、选主与分布式锁](./scenarios-patterns.md)，会更容易把命令和原理真正对上。准备自己搭一套环境时，再看 [Etcd 单机 / 3 节点部署与 TLS 证书实战](./deployment-and-tls-practice.md)；准备面试或复盘时，再看 [Etcd 必备问题与自检清单](./essential-questions.md)。
