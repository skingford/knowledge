---
title: Raft 共识算法详解
description: 从 Leader Election、Log Replication 到 Safety，完整拆解 Raft 共识协议的设计动机、核心机制与工程实现。
---

# Raft 共识算法详解

## 适合人群

- 需要理解 etcd、Consul、TiKV 等系统底层共识机制的后端工程师
- 准备系统设计面试，需要讲清楚分布式一致性的候选人
- 希望从 Paxos 转到更易理解的共识算法的学习者

## 学习目标

- 理解分布式共识要解决的核心问题（Safety + Liveness）
- 能完整讲清 Raft 的三个子问题：Leader Election、Log Replication、Safety
- 能画出选举和日志复制的时序图
- 理解 Raft 与 Paxos 的本质区别和工程取舍
- 知道 etcd/raft、HashiCorp Raft 等主流实现的设计选择

## 快速导航

- [为什么需要共识算法](#为什么需要共识算法)
- [Raft 概览](#raft-概览)
- [Leader Election 选举机制](#leader-election-选举机制)
- [Log Replication 日志复制](#log-replication-日志复制)
- [Safety 安全性保证](#safety-安全性保证)
- [成员变更](#成员变更)
- [日志压缩与快照](#日志压缩与快照)
- [Raft vs Paxos](#raft-vs-paxos)
- [工程实现参考](#工程实现参考)
- [高频问题](#高频问题)

---

## 为什么需要共识算法

在分布式系统中，多个节点需要对同一份数据达成一致。如果没有共识算法：

- **单点故障**：只有一个节点存数据，挂了就丢了
- **脑裂**：多个节点各自接受写入，数据出现冲突
- **顺序不一致**：不同节点看到的操作顺序不同，状态发散

共识算法的目标是：在部分节点故障的情况下，保证所有存活节点对一系列操作的顺序达成一致（Replicated State Machine）。

**核心约束**：

| 属性 | 含义 |
|------|------|
| **Safety** | 不会返回错误的结果——任何已提交的日志条目不会被覆盖或丢失 |
| **Liveness** | 只要多数派节点存活且能通信，系统最终能取得进展 |

## Raft 概览

Raft 由 Diego Ongaro 和 John Ousterhout 在 2014 年提出（论文：*In Search of an Understandable Consensus Algorithm*），核心设计目标是**可理解性**。

Raft 把共识问题拆成三个相对独立的子问题：

```
┌─────────────────────────────────────────────┐
│              Raft 共识协议                    │
├───────────────┬──────────────┬──────────────┤
│ Leader        │ Log          │ Safety       │
│ Election      │ Replication  │              │
│ 谁来当 Leader  │ 怎么同步日志   │ 怎么保证正确  │
└───────────────┴──────────────┴──────────────┘
```

### 节点角色

每个节点在任意时刻处于三种角色之一：

| 角色 | 职责 |
|------|------|
| **Leader** | 接受客户端请求，管理日志复制，同一时刻最多一个 Leader |
| **Follower** | 被动响应 Leader 和 Candidate 的请求，不主动发起操作 |
| **Candidate** | 选举过渡态，Follower 超时后转为 Candidate 发起投票 |

### Term（任期）

Raft 将时间划分为连续递增的 **Term**（任期），每个 Term 最多有一个 Leader：

```
Term 1        Term 2        Term 3        Term 4
┌──────────┐  ┌──────────┐  ┌─────┐       ┌──────────┐
│ 选举 │正常 │  │ 选举 │正常 │  │选举失败│       │ 选举 │正常 │
│     │运行  │  │     │运行  │  │(无 Leader)│  │     │运行  │
└──────────┘  └──────────┘  └─────┘       └──────────┘
```

Term 是 Raft 的逻辑时钟：
- 每个 RPC 都携带发送方的 Term
- 如果收到更大的 Term，立刻更新自己的 Term 并转为 Follower
- 如果收到更小的 Term，拒绝该请求

---

## Leader Election 选举机制

### 触发条件

Follower 在 **election timeout**（通常 150–300ms 随机）内没收到 Leader 的心跳，就认为 Leader 失联，转为 Candidate 发起选举。

### 选举流程

```
Follower                  Candidate                    其他节点
   │                          │                           │
   │  election timeout 到期    │                           │
   │─────────────────────────>│                           │
   │                          │ 1. currentTerm++          │
   │                          │ 2. 投票给自己              │
   │                          │ 3. 重置 election timer     │
   │                          │                           │
   │                          │── RequestVote RPC ───────>│
   │                          │                           │
   │                          │<── 投票响应（同意/拒绝）───│
   │                          │                           │
   │                          │ 收到多数派投票             │
   │                          │ => 成为 Leader             │
   │                          │                           │
   │                          │── 发送心跳(空 AppendEntries)│
   │                          │                           │
```

### RequestVote RPC

```
RequestVote 请求:
  term          - Candidate 的当前 Term
  candidateId   - Candidate 的 ID
  lastLogIndex  - Candidate 最后一条日志的索引
  lastLogTerm   - Candidate 最后一条日志的 Term

RequestVote 响应:
  term          - 接收方的当前 Term（让 Candidate 发现更新的 Term）
  voteGranted   - 是否同意投票
```

### 投票规则

一个节点在同一个 Term 内**最多投一票**（first-come-first-served），且只有在以下条件都满足时才投赞成票：

1. Candidate 的 Term >= 自己的 currentTerm
2. 自己在该 Term 还没投过票（或已经投给了该 Candidate）
3. Candidate 的日志至少和自己一样新（**Election Restriction**，详见 Safety 章节）

### 随机超时避免活锁

如果多个 Follower 同时超时、同时发起选举，可能谁都拿不到多数票（split vote）。Raft 用**随机化 election timeout** 解决：

- 每个节点的 timeout 在 `[T, 2T]` 范围内随机选取
- 大多数情况下只有一个节点最先超时并赢得选举
- 如果还是 split vote，各 Candidate 再次随机等待后重试

### 选举的三种结果

| 结果 | 处理 |
|------|------|
| 赢得多数派投票 | 成为 Leader，立刻发送心跳确立领导地位 |
| 收到合法 Leader 的心跳 | 退回 Follower |
| 超时无人胜出 | Term++，发起新一轮选举 |

---

## Log Replication 日志复制

Leader 选出后，所有客户端写请求都由 Leader 处理，流程如下：

### 复制流程

```
Client          Leader              Follower A        Follower B
  │                │                     │                 │
  │── 写请求 ─────>│                     │                 │
  │                │                     │                 │
  │                │ 1. 追加到本地日志     │                 │
  │                │                     │                 │
  │                │── AppendEntries ──>│                 │
  │                │── AppendEntries ────────────────────>│
  │                │                     │                 │
  │                │<── 成功 ───────────│                 │
  │                │<── 成功 ──────────────────────────── │
  │                │                     │                 │
  │                │ 2. 多数派确认        │                 │
  │                │    => commit        │                 │
  │                │ 3. 应用到状态机      │                 │
  │                │                     │                 │
  │<── 响应 ───── │                     │                 │
  │                │                     │                 │
  │                │ 4. 下次心跳通知      │                 │
  │                │    Follower commit  │                 │
```

### 日志结构

每条日志条目包含：

```
┌───────┬──────┬─────────┐
│ Index │ Term │ Command │
├───────┼──────┼─────────┤
│   1   │  1   │  x=1    │
│   2   │  1   │  y=2    │
│   3   │  2   │  x=3    │
│   4   │  3   │  z=1    │
└───────┴──────┴─────────┘
```

- **Index**：日志的位置序号，全局递增
- **Term**：写入该条目时 Leader 的任期号
- **Command**：要应用到状态机的操作

### AppendEntries RPC

```
AppendEntries 请求:
  term           - Leader 的当前 Term
  leaderId       - Leader 的 ID
  prevLogIndex   - 紧接新条目之前的日志索引
  prevLogTerm    - prevLogIndex 处日志的 Term
  entries[]      - 要追加的日志条目（心跳时为空）
  leaderCommit   - Leader 已提交的最高日志索引

AppendEntries 响应:
  term           - 接收方的 currentTerm
  success        - 如果 Follower 的 prevLogIndex/prevLogTerm 匹配则为 true
```

### 一致性检查（Log Matching Property）

Leader 在每次 AppendEntries 中附带 `prevLogIndex` 和 `prevLogTerm`，Follower 检查：

- 如果自己在 `prevLogIndex` 位置有一条 Term 为 `prevLogTerm` 的日志 => 匹配，接受新条目
- 如果不匹配 => 拒绝，Leader 将 `nextIndex` 回退一步后重试

这个机制保证了 **Log Matching Property**：如果两个节点在某个位置的日志 Index 和 Term 相同，那么从头到该位置的所有日志都相同。

### Commit 规则

Leader 维护一个 `commitIndex`，当一条日志被复制到**多数派**节点后：

1. Leader 更新 `commitIndex`
2. Leader 将已提交的日志应用到自己的状态机
3. 后续的 AppendEntries（包括心跳）携带 `leaderCommit`，通知 Follower 更新各自的 `commitIndex`
4. Follower 应用已提交的日志到自己的状态机

---

## Safety 安全性保证

仅靠选举和日志复制还不够安全。Raft 通过以下约束保证不会丢失已提交的数据。

### Election Restriction（选举限制）

Candidate 发起 RequestVote 时必须携带自己最后一条日志的 `(lastLogTerm, lastLogIndex)`。投票节点比较规则：

1. 先比 `lastLogTerm`，Term 大的更新
2. Term 相同时比 `lastLogIndex`，Index 大的更新

只有日志**至少和投票者一样新**的 Candidate 才能获得投票。这保证了当选的 Leader 一定包含所有已提交的日志。

**为什么这很重要**：如果没有这个限制，一个缺少已提交日志的节点也可能当选 Leader，然后用自己不完整的日志覆盖其他节点，导致已提交的数据丢失。

### Leader Completeness Property

由 Election Restriction 可以推导出：**任何 Term 的 Leader 都包含所有在之前 Term 中已提交的日志条目。**

这是 Raft Safety 的核心定理。

### 当前 Term 提交规则

Leader 只能通过当前 Term 的日志复制来推进 commitIndex，**不能直接提交之前 Term 的日志**（即使已经复制到多数派）。

原因用一个经典场景说明：

```
场景：5 个节点 S1-S5

时间点 (a): S1 是 Term 2 的 Leader，Index 2 的日志(Term 2)复制到了 S1、S2
时间点 (b): S1 宕机，S5 当选 Term 3 Leader（S3、S4、S5 投票），在 Index 2 写入 Term 3 的日志
时间点 (c): S5 宕机，S1 恢复成为 Term 4 Leader，将 Index 2 的 Term 2 日志复制到 S3（多数派）

问题：如果此时 S1 直接提交 Index 2（Term 2）的日志，然后 S1 宕机——
      S5 有可能重新当选（日志 Term 3 > Term 2），并用 Term 3 的日志覆盖 Index 2
      => 已提交的数据被覆盖！

解法：S1 不能直接提交 Term 2 的旧日志，而是等 Term 4 的新日志复制到多数派后，
      间接地把 Term 2 的日志一起提交
```

---

## 成员变更

集群需要增删节点时（比如从 3 节点扩到 5 节点），如果直接切换配置，可能出现两个不相交的多数派同时选出 Leader。

### 单步变更（Single Server Change）

Raft 论文最终推荐的简单方案：**每次只增加或移除一个节点**。

- Leader 将新配置作为一条特殊日志条目写入并复制
- 一旦该日志被提交，新配置生效
- 每次只变更一个节点，可以证明新旧配置的多数派一定有交集，不会出现双 Leader

### Joint Consensus（联合共识）

论文最初提出的更通用方案，支持一次变更多个节点：

1. Leader 先写入一条过渡配置 `C_old,new`
2. 在过渡阶段，任何决策都需要同时获得旧配置多数派**和**新配置多数派的同意
3. `C_old,new` 提交后，Leader 再写入最终配置 `C_new`
4. `C_new` 提交后，变更完成

实际工程中（etcd、HashiCorp Raft）通常采用**单步变更**，更简单也更不容易出错。

---

## 日志压缩与快照

日志会无限增长。Raft 用 **Snapshot（快照）** 来压缩已提交的日志：

```
┌─────────────────────────────────────────────┐
│         Snapshot          │  Active Log     │
│                           │                 │
│ lastIncludedIndex = 5     │ Index 6, 7, 8   │
│ lastIncludedTerm  = 3     │                 │
│ State Machine Snapshot    │                 │
└───────────────────────────┴─────────────────┘
```

- 每个节点独立决定何时做快照（通常按日志大小阈值）
- 快照包含：状态机的完整状态 + `lastIncludedIndex` + `lastIncludedTerm`
- 快照之前的日志可以安全丢弃

### InstallSnapshot RPC

当 Follower 落后太多（Leader 已经丢弃了它需要的旧日志），Leader 通过 `InstallSnapshot` 直接发送快照：

1. Follower 收到快照后，丢弃自己所有旧日志
2. 用快照恢复状态机
3. 从快照之后的日志继续追赶

---

## Raft vs Paxos

| 维度 | Raft | Paxos |
|------|------|-------|
| **设计目标** | 可理解性优先 | 理论最优 |
| **Leader** | 强 Leader，所有写入经过 Leader | 可以无 Leader（Multi-Paxos 通常也选 Leader） |
| **日志顺序** | 日志严格连续，不允许空洞 | 允许日志空洞，乱序提交 |
| **学习曲线** | 论文即实现，工程落地清晰 | 论文到实现之间有巨大鸿沟 |
| **选举** | 随机超时 + 日志比较 | Paxos 本身不定义选举 |
| **工程实现** | etcd/raft、HashiCorp Raft | 少见纯 Paxos 实现，多为变体 |
| **性能** | 正常路径 1 RTT 提交 | 正常路径 1 RTT（Multi-Paxos） |

**选 Raft 的理由**：可理解、可实现、可调试。大多数场景下 Raft 的性能与 Paxos 相当，但出问题时 Raft 的行为更可预测。

---

## 工程实现参考

### etcd/raft（Go）

- 地址：`go.etcd.io/raft`
- 特点：**库而非框架**——只实现核心状态机，网络和存储由调用方提供
- 使用者：etcd、TiKV、CockroachDB
- 关键设计：
  - 不做 IO，所有操作通过 `Ready()` channel 返回给调用方执行
  - 支持 PreVote 防止网络分区节点扰乱集群
  - 支持 Learner 角色（只接收日志、不参与投票）

### HashiCorp Raft（Go）

- 地址：`github.com/hashicorp/raft`
- 特点：**开箱即用的框架**——内置网络层和存储层
- 使用者：Consul、Nomad、Vault
- 关键设计：
  - 内置 BoltDB 做日志存储
  - 内置 TCP 传输层
  - 单步成员变更

### 对比

| 维度 | etcd/raft | HashiCorp Raft |
|------|-----------|----------------|
| 抽象层级 | 纯状态机库 | 完整框架 |
| IO 处理 | 调用方控制 | 内置 |
| 灵活性 | 高（可定制网络/存储） | 中（可替换存储后端） |
| 上手成本 | 高（需要自己对接 IO） | 低（开箱即用） |

---

## 高频问题

### Q1：Raft 最少需要几个节点？

**3 个节点**是最低要求（容忍 1 个节点故障）。通用公式：`2F+1` 个节点可容忍 `F` 个故障。生产环境通常用 3 或 5 个节点。

### Q2：Leader 宕机后多久能恢复服务？

取决于 election timeout 设置。典型配置 150–300ms 随机超时 + 一轮投票的网络延迟，通常在 **几百毫秒到 1 秒**内完成切换。

### Q3：网络分区时会发生什么？

- 多数派一侧可以正常选举和提交
- 少数派一侧的 Leader（如果有）无法提交新日志（拿不到多数派确认）
- 分区恢复后，少数派节点发现更大的 Term，自动退为 Follower 并追赶日志

### Q4：Raft 能保证线性一致性读吗？

默认不能。Leader 可能已经被废黜但自己不知道（stale read）。解决方案：

1. **ReadIndex**：Leader 先确认自己仍是 Leader（发一轮心跳确认多数派），再返回读结果
2. **Lease Read**：Leader 在 election timeout 时间窗口内假设自己仍是 Leader（依赖时钟准确性）
3. **所有读走 Raft 日志**：最安全但性能最差

etcd 默认使用 ReadIndex。

### Q5：为什么 etcd 建议奇数节点？

偶数节点并不能提高容错能力：4 个节点和 3 个节点一样只能容忍 1 个故障（都需要 3 个节点存活构成多数派）。多一个节点只增加了通信开销，没有提高可用性。

### Q6：Raft 的性能瓶颈在哪？

- **Leader 单点写入**：所有写入经过 Leader，写吞吐受单节点限制
- **日志持久化**：每次提交都需要 fsync 落盘
- **网络 RTT**：提交延迟至少 1 RTT（Leader -> 多数派 Follower -> Leader 确认）

优化手段：批量写（batching）、pipeline、异步 apply、Multi-Raft（按 range 分片，每个分片独立 Raft 组）。

---

## 推荐资料

- [Raft 论文原文 (Extended Version)](https://raft.github.io/raft.pdf) - 必读，论文本身就是最好的教程
- [Raft 可视化](https://raft.github.io/) - 交互式动画演示选举和日志复制过程
- [etcd/raft 源码](https://github.com/etcd-io/raft) - 工业级 Raft 实现，适合读源码学习
- [Students' Guide to Raft](https://thesquareplanet.com/blog/students-guide-to-raft/) - MIT 6.824 课程的 Raft 实现指南
