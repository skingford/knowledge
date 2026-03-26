---
title: PostgreSQL 高可用集群整理
description: PostgreSQL 高可用方案选型、Patroni + etcd + HAProxy 部署、WAL 流复制机制、同步策略与故障恢复速查。
---

# PostgreSQL 高可用集群整理

## 适合人群

- 需要搭建或维护 PostgreSQL 高可用集群的后端工程师和 DBA
- 希望理解 WAL 流复制和同步策略原理的开发者
- 准备做数据库高可用方案选型或能力自检的技术负责人

## 学习目标

- 了解 PostgreSQL 常见高可用方案及其适用场景
- 掌握 Patroni + etcd + HAProxy 方案的部署和配置流程
- 理解 WAL 流复制机制、同步级别和确认策略的差异
- 能够处理从库恢复、旧主回收等常见故障场景

## 快速导航

- [一、常见高可用方案](#一常见高可用方案)
- [二、Patroni 方案推荐架构](#二patroni-方案推荐架构)
- [三、节点数量建议](#三节点数量建议)
- [四、三节点 Patroni 集群部署](#四三节点-patroni-集群部署)
- [五、常用运维命令](#五常用运维命令)
- [六、生产环境建议](#六生产环境建议)
- [七、WAL 是什么](#七wal-是什么)
- [八、两种复制模式](#八两种复制模式)
- [九、流复制完整流程](#九流复制完整流程)
- [十、复制槽](#十复制槽)
- [十一、如何监控复制延迟](#十一如何监控复制延迟)
- [十二、pg_rewind 的作用](#十二pg_rewind-的作用)
- [十三、同步级别对比](#十三同步级别对比)
- [十四、为什么主库可以同时同步多个从库](#十四为什么主库可以同时同步多个从库)
- [十五、同步确认策略](#十五同步确认策略)
- [十六、慢从库或故障从库怎么处理](#十六慢从库或故障从库怎么处理)
- [十七、最坏情况分析](#十七最坏情况分析)
- [十八、从库恢复时的两种情况](#十八从库恢复时的两种情况)
- [十九、恢复与一致性总结](#十九恢复与一致性总结)
- [二十、生产运维建议](#二十生产运维建议)
- [二十一、核心结论](#二十一核心结论)

---

## 一、常见高可用方案

### 1. 流复制 + 自动故障转移

这是 PostgreSQL 最主流的高可用方案：

- 主从流复制（Streaming Replication）
- 配合 Patroni 或 repmgr 做自动故障转移
- 适合大多数单主多从场景

### 2. Patroni + etcd + HAProxy

这是目前最常见、也最推荐的生产部署方案：

- Patroni 负责 PostgreSQL 实例生命周期管理和主从切换
- etcd / Consul / ZooKeeper 负责分布式一致性存储和 leader 选举
- HAProxy 或 PgBouncer 负责连接代理、读写分离和健康检查
- 典型部署是 `3 节点 etcd + 2~3 个 PG 节点`

### 3. Citus

适合需要水平扩展的分布式 PostgreSQL 场景：

- 不只是高可用，而是面向分片和横向扩容
- 更适合数据量和写入规模继续增长的业务

### 4. Pgpool-II

可以同时做连接池、负载均衡和故障切换：

- 功能较全
- 配置复杂度较高
- 运维成本通常比 Patroni 方案更高

## 二、Patroni 方案推荐架构

```text
Client
  ↓
HAProxy / VIP
  ↓
写请求 -> 主库
读请求 -> 从库

┌────────────┐  ┌────────────┐  ┌────────────┐
│ PG Node1   │  │ PG Node2   │  │ PG Node3   │
│ PostgreSQL │  │ PostgreSQL │  │ PostgreSQL │
│ Patroni    │  │ Patroni    │  │ Patroni    │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      └──────────┬────┴──────────┬────┘
                 ↓               ↓
              etcd 集群（3 节点）
```

### 核心设计要点

- **RPO / RTO**
  - 同步复制配合 `synchronous_commit=on` 可以逼近 `RPO=0`
  - 异步复制性能更好，但主库故障时可能丢少量最近提交的数据
- **脑裂防护**
  - 依赖 etcd 多数派选举
  - Patroni 拿不到 leader 锁时会自动降级
- **连接管理**
  - PgBouncer 适合做连接池
  - HAProxy 适合做健康检查和读写路由
- **备份恢复**
  - 推荐 pgBackRest 或 WAL-G
  - 需要持续归档 WAL + 周期性基础备份
- **监控**
  - `pg_stat_statements`
  - `postgres_exporter` / `pg_exporter`
  - Prometheus + Grafana

## 三、节点数量建议

### PostgreSQL 节点

生产环境建议至少 3 台 PostgreSQL 节点：

- `1 主 + 2 从`
- 主库故障时需要多数派决策和可靠切换
- 2 台节点很难优雅处理仲裁和脑裂问题

#### 为什么高可用集群通常至少需要 3 台

这里的关键不是“PostgreSQL 软件必须三台才能启动”，而是高可用系统必须解决“谁说了算”的问题。

在 `Patroni + etcd` 架构里，真正执行多数派仲裁的是 `etcd` 这类分布式一致性存储；PostgreSQL 实例本身不直接互相投票，而是由 Patroni 根据 DCS（Distributed Configuration Store）的 leader 锁决定谁能成为主库。

如果只有 2 台机器，遇到网络分区时会出现一个经典难题：

- node1 认为 node2 挂了
- node2 认为 node1 挂了
- 系统无法判断到底是“对方真的宕机”还是“只是网络断了”

这时会出现两个都不理想的结果：

- **激进接管**：两边都认为自己应该升主，导致双主写入，也就是脑裂
- **保守不接管**：剩下那台虽然还活着，但只有 `50%` 选票，无法获得多数派，集群无法自动切换

当集群有 3 台机器时，法定人数（quorum）就是 `⌊3/2⌋ + 1 = 2`：

- 挂 1 台或断 1 台网，剩下 2 台仍然可以形成多数派
- 被隔离的那 1 台拿不到 leader 锁，会自动降级或拒绝写入
- 整个系统始终只允许一个真正的主库对外服务

这里还有一个很容易混淆的点：在 `Patroni + etcd` 架构里，并不是 `B` 和 `C` 两个 PostgreSQL 节点彼此“各投一票”来决定谁升主。

实际过程更像这样：

- `B` 和 `C` 都去尝试获取 `etcd` 中的 leader key
- `etcd` 作为仲裁者，依靠自身的多数派和线性一致性写入保证“同一时刻只能有一个成功”
- 抢到 leader 锁的节点才允许被 Patroni 提升为主库
- 没抢到锁的节点继续保持从库，哪怕它本地也认为原主已经失联

所以对 PostgreSQL 层来说，通常不会出现“B 一票、C 一票，然后两边都能写”的情况；真正防止双主的是 `etcd` 的原子锁和 quorum。

如果再往下一层看，`etcd` 自己内部确实要靠 Raft 处理 leader 选举，Raft 在极端情况下也可能短暂出现平票，但它会靠随机超时和新一轮 term 重新选举；在 `etcd` 没恢复多数派之前，Patroni 也拿不到有效 leader 锁，因此依旧不会安全升主。

还要注意一个容易误解的点：**宕机节点在恢复并重新加入之前，不参与实时投票；但 quorum 的计算基数不会因为它掉线就临时缩小。**

也就是说：

- 3 节点集群的多数派永远是 `2`
- 即使挂了 1 台，剩下的节点也必须凑够 `2` 票才能完成主库切换
- 不能把“现在只剩 2 台在线”理解成“1 票就算过半”

否则一旦是网络分区而不是彻底宕机，两个分区都可能把自己当成“唯一存活的一方”，最终引发脑裂。

不同节点数量的容错能力可以粗略理解为：

| 节点总数 | 可容忍故障数 | 说明 |
| --- | --- | --- |
| 1 | 0 | 单点故障，挂了就不可用 |
| 2 | 0 | 无法安全自动切换，容易卡在仲裁或脑裂问题上 |
| 3 | 1 | 性价比最高，坏 1 台后仍可保持多数派 |
| 4 | 1 | 容错性和 3 台一样，成本更高 |
| 5 | 2 | 可以容忍 2 台故障，但资源和运维成本更高 |

所以在工程实践里，大家常说的“PostgreSQL 高可用至少 3 台”，本质上说的是：**至少要有 3 个仲裁点，系统才能在故障时继续满足多数派原则。**

### etcd 节点

etcd 也建议至少 3 节点：

- etcd 依赖多数派工作
- 3 节点可以容忍 1 个节点故障

### HAProxy 节点

HAProxy 建议至少 2 台：

- 配合 Keepalived 提供 VIP
- 避免代理层成为单点

### 最小可用生产形态

常见的最小生产高可用形态：

- 3 台服务器
- 每台运行 `PostgreSQL + Patroni + etcd`
- 前面再挂 1~2 台 HAProxy

如果预算很紧：

- 可以做 `2 台 PG + 外部仲裁节点`
- 但不建议作为正式生产方案

## 四、三节点 Patroni 集群部署

以下示例以 Ubuntu 22.04 为例，PostgreSQL 16。

> 示例中的密码仅供演示，生产环境务必使用环境变量或密钥管理服务（如 HashiCorp Vault）管理密码。

### 4.1 环境规划

| 节点 | IP | 角色 |
| --- | --- | --- |
| node1 | 192.168.1.11 | PostgreSQL + Patroni + etcd + HAProxy |
| node2 | 192.168.1.12 | PostgreSQL + Patroni + etcd |
| node3 | 192.168.1.13 | PostgreSQL + Patroni + etcd |

### 4.2 三台机器通用初始化

#### 配置 hosts

```bash
cat >> /etc/hosts << 'EOF'
192.168.1.11 node1
192.168.1.12 node2
192.168.1.13 node3
EOF
```

#### 安装 PostgreSQL 16

```bash
sudo apt update
sudo apt install -y curl ca-certificates

# 导入仓库签名密钥（apt-key 已废弃，使用 signed-by 方式）
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] \
  http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  | sudo tee /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt install -y postgresql-16

# 停掉默认实例，后续由 Patroni 接管
sudo systemctl stop postgresql
sudo systemctl disable postgresql
```

#### 安装 etcd

```bash
# apt 安装简单但版本不可控，生产环境建议指定版本
# 方式一：apt 安装（版本随发行版）
sudo apt install -y etcd

# 方式二：官方二进制安装（推荐，可精确控制版本）
# ETCD_VER=v3.5.12
# curl -fsSL https://github.com/etcd-io/etcd/releases/download/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz \
#   | sudo tar xz -C /usr/local/bin --strip-components=1 etcd-${ETCD_VER}-linux-amd64/etcd etcd-${ETCD_VER}-linux-amd64/etcdctl
```

#### 安装 Patroni

```bash
sudo apt install -y python3-pip python3-psycopg2
sudo pip3 install patroni[etcd]
```

#### 安装 HAProxy

只需要在入口节点安装即可，也可以三台都装：

```bash
sudo apt install -y haproxy
```

### 4.3 配置 etcd

三台都需要配置 `/etc/default/etcd`，每台机器替换自己的节点名和 IP。

#### node1 示例

```bash
cat > /etc/default/etcd << 'EOF'
ETCD_NAME="node1"
ETCD_DATA_DIR="/var/lib/etcd"
ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:2379"
ETCD_LISTEN_PEER_URLS="http://0.0.0.0:2380"
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.1.11:2379"
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://192.168.1.11:2380"
ETCD_INITIAL_CLUSTER="node1=http://192.168.1.11:2380,node2=http://192.168.1.12:2380,node3=http://192.168.1.13:2380"
ETCD_INITIAL_CLUSTER_STATE="new"
ETCD_INITIAL_CLUSTER_TOKEN="pg-cluster"
EOF
```

#### node2 / node3

分别替换：

- `ETCD_NAME`
- `ETCD_ADVERTISE_CLIENT_URLS`
- `ETCD_INITIAL_ADVERTISE_PEER_URLS`

#### 启动并验证 etcd

```bash
sudo systemctl restart etcd
sudo systemctl enable etcd

etcdctl member list
```

### 4.4 配置 Patroni

三台都创建 `/etc/patroni/config.yml`。

#### node1 配置示例

node2、node3 只需要替换节点名和 IP。

```yaml
scope: pg-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.11:8008

etcd:
  hosts: 192.168.1.11:2379,192.168.1.12:2379,192.168.1.13:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true
      use_slots: true
      parameters:
        wal_level: replica
        hot_standby: "on"
        max_wal_senders: 10
        max_replication_slots: 10
        wal_log_hints: "on"

  initdb:
    - encoding: UTF8
    - data-checksums

  pg_hba:
    - host replication replicator 192.168.1.0/24 md5
    - host all all 0.0.0.0/0 md5

  users:
    admin:
      password: admin_password    # 生产环境请替换
      options:
        - createrole
        - createdb
    replicator:
      password: rep_password      # 生产环境请替换
      options:
        - replication

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.11:5432
  data_dir: /var/lib/postgresql/16/main
  bin_dir: /usr/lib/postgresql/16/bin
  pgpass: /tmp/pgpass0

  authentication:
    replication:
      username: replicator
      password: rep_password      # 生产环境请替换
    superuser:
      username: postgres
      password: postgres_password # 生产环境请替换

  parameters:
    shared_buffers: "1GB"
    work_mem: "16MB"
    max_connections: 200

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
```

#### 创建 systemd 服务

```bash
sudo mkdir -p /etc/patroni

cat > /etc/systemd/system/patroni.service << 'EOF'
[Unit]
Description=Patroni PostgreSQL Cluster
After=syslog.target network.target etcd.service

[Service]
Type=simple
User=postgres
Group=postgres
ExecStart=/usr/local/bin/patroni /etc/patroni/config.yml
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=process
TimeoutSec=30
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
```

#### 修正目录权限

```bash
sudo chown -R postgres:postgres /var/lib/postgresql/16
sudo chown -R postgres:postgres /etc/patroni
```

#### 启动顺序

先启动 node1，待初始化完成后再启动 node2、node3：

```bash
sudo systemctl daemon-reload
sudo systemctl start patroni
sudo systemctl enable patroni
```

#### 验证集群状态

```bash
patronictl -c /etc/patroni/config.yml list
```

预期输出类似：

```text
+--------+---------------+---------+----+-----------+
| Member | Host          | Role    | TL | State     |
+--------+---------------+---------+----+-----------+
| node1  | 192.168.1.11  | Leader  |  1 | running   |
| node2  | 192.168.1.12  | Replica |  1 | streaming |
| node3  | 192.168.1.13  | Replica |  1 | streaming |
+--------+---------------+---------+----+-----------+
```

### 4.5 配置 HAProxy

以下示例部署在 node1。

HAProxy 通过 Patroni 的 REST API（监听在 8008 端口）做健康检查：

- `GET /primary`：只有当前主库返回 200
- `GET /replica`：只有健康的从库返回 200
- `GET /replica?lag=100KB`：只有延迟低于 100KB 的从库返回 200

编辑 `/etc/haproxy/haproxy.cfg`：

```ini
global
    maxconn 1000

defaults
    mode tcp
    timeout connect 5s
    timeout client 30m
    timeout server 30m

listen pg_write
    bind *:5000
    option httpchk GET /primary
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server node1 192.168.1.11:5432 maxconn 300 check port 8008
    server node2 192.168.1.12:5432 maxconn 300 check port 8008
    server node3 192.168.1.13:5432 maxconn 300 check port 8008

listen pg_read
    bind *:5001
    balance roundrobin
    option httpchk GET /replica
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server node1 192.168.1.11:5432 maxconn 300 check port 8008
    server node2 192.168.1.12:5432 maxconn 300 check port 8008
    server node3 192.168.1.13:5432 maxconn 300 check port 8008

listen stats
    bind *:7000
    mode http
    stats enable
    stats uri /
```

启动 HAProxy：

```bash
sudo systemctl restart haproxy
sudo systemctl enable haproxy
```

#### 使用方式

| 用途 | 连接地址 |
| --- | --- |
| 写入口 | `192.168.1.11:5000` |
| 读入口 | `192.168.1.11:5001` |
| 状态页 | `http://192.168.1.11:7000` |

示例连接串：

```bash
# 写
postgresql://admin:admin_password@192.168.1.11:5000/mydb

# 读
postgresql://admin:admin_password@192.168.1.11:5001/mydb
```

## 五、常用运维命令

```bash
# 查看集群状态
patronictl -c /etc/patroni/config.yml list

# 手动切主
patronictl -c /etc/patroni/config.yml switchover

# 故障转移
patronictl -c /etc/patroni/config.yml failover

# 重载配置
patronictl -c /etc/patroni/config.yml reload pg-cluster

# 重新初始化某个落后或损坏的节点
patronictl -c /etc/patroni/config.yml reinit pg-cluster node3
```

## 六、生产环境建议

1. 不要使用明文密码，改用环境变量或密钥管理服务。
2. 使用 pgBackRest 或 WAL-G 做全量备份 + 增量归档。
3. 建立监控：复制延迟、WAL 积压、磁盘占用、切换事件。
4. HAProxy 建议双机部署，再配 Keepalived 提供 VIP。
5. 通过防火墙只开放必要端口：`5432`、`8008`、`2379`、`2380`、`5000`、`5001`。

---

## 七、WAL 是什么

PostgreSQL 的核心复制机制基于 WAL（Write-Ahead Log）。

任何数据修改都遵循：

1. 先写 WAL
2. 再写数据文件

WAL 可以理解为一串按顺序追加的变更记录，例如：

```text
LSN 0/3000028: INSERT into users (id=1, name='张三')
LSN 0/3000060: UPDATE orders SET status='paid' WHERE id=100
LSN 0/3000098: DELETE FROM logs WHERE id < 1000
```

主从同步的本质就是：

> 主库持续把 WAL 发送给从库，从库持续回放 WAL。

## 八、两种复制模式

### 1. 异步复制

```text
主库写入 -> 生成 WAL -> 先返回客户端成功
                    ↓
               后台持续传输
                    ↓
               从库接收并回放 WAL
```

特点：

- 优点：主库写入延迟低
- 缺点：主库崩溃时，最近尚未传输给从库的 WAL 可能丢失
- 一般 `RPO > 0`

### 2. 同步复制

```text
主库写入 -> 生成 WAL -> 等从库确认 -> 再返回客户端成功
                    ↓
               从库接收并回放 WAL
```

特点：

- 优点：数据安全更高
- 缺点：写入延迟受网络和从库确认速度影响
- 可以逼近 `RPO = 0`

示例配置：

```ini
synchronous_commit = on
synchronous_standby_names = 'ANY 1 (node2, node3)'
```

表示：

- 主库同时把 WAL 发给 node2、node3
- 任意 1 个从库先确认，主库就可以返回成功

## 九、流复制完整流程

```text
主库（Primary）
  ① 客户端提交写请求
  ② WAL 写入 WAL Buffer
  ③ fsync 到 pg_wal/
  ④ WAL Sender 通过 TCP 持续发送 WAL
              ↓
从库（Standby）
  ⑤ WAL Receiver 接收 WAL
  ⑥ 写入本地 pg_wal/
  ⑦ Startup 进程回放 WAL
  ⑧ 如果 hot_standby=on，则从库可读
```

### 关键进程

| 进程 | 所在位置 | 作用 |
| --- | --- | --- |
| WAL Sender | 主库 | 向每个从库持续发送 WAL |
| WAL Receiver | 从库 | 接收 WAL 并写入本地 |
| Startup | 从库 | 持续回放 WAL，推进数据状态 |

## 十、复制槽

复制槽（Replication Slot）的作用是：

> 防止主库把从库还没接收的 WAL 提前清理掉。

示例：

```sql
SELECT pg_create_physical_replication_slot('node2_slot');
```

Patroni 开启：

```yaml
use_slots: true
```

这样 Patroni 会自动管理复制槽，通常不需要手工维护。

### 没有复制槽的风险

- 从库断开较久
- 主库回收了旧 WAL
- 从库恢复后发现缺日志
- 最终只能重新做基础备份

## 十一、如何监控复制延迟

### 在主库查看复制状态

```sql
SELECT
    client_addr,
    state,
    sync_state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;
```

示例结果：

```text
 client_addr   |   state   | sync_state | replay_lag_bytes
---------------+-----------+------------+------------------
 192.168.1.12  | streaming | sync       |                0
 192.168.1.13  | streaming | async      |             1024
```

### 在从库查看回放延迟

```sql
SELECT now() - pg_last_xact_replay_timestamp() AS replay_delay;
```

## 十二、pg_rewind 的作用

故障切换后，旧主库不能直接拿来当从库，因为时间线（Timeline）已经分叉。

这时可以用 `pg_rewind` 快速把旧主库追到新主库的时间线：

```bash
pg_rewind \
  --target-pgdata=/var/lib/postgresql/16/main \
  --source-server="host=192.168.1.12 user=postgres"
```

Patroni 配置：

```yaml
use_pg_rewind: true
```

开启后 Patroni 会自动处理大部分旧主回收场景。

## 十三、同步级别对比

| synchronous_commit | 主库等待什么 | 数据安全 | 性能 |
| --- | --- | --- | --- |
| `off` | 不等 | 最低 | 最快 |
| `local` | 本地 fsync | 主库不丢 | 快 |
| `remote_write` | 从库写入 OS 缓存 | 较高 | 中等 |
| `on` | 从库 WAL 落盘 | 高 | 较慢 |
| `remote_apply` | 从库回放完成 | 最高 | 最慢 |

一个常见生产折中是：

```ini
synchronous_commit = on
synchronous_standby_names = 'ANY 1 (node2, node3)'
```

它通常能在安全和性能之间取得比较好的平衡。

## 十四、为什么主库可以同时同步多个从库

核心点：

> 主库不是轮流给 node2、node3 发 WAL，而是同时给每个从库建立独立发送流。

示意图：

```text
主库 WAL 流
  ├── WAL Sender 1 -> node2
  └── WAL Sender 2 -> node3
```

每个从库都有：

- 独立 TCP 连接
- 独立 WAL 接收位置
- 独立确认进度

### 为什么不会乱序

因为 WAL 本身具备这些特性：

1. **WAL 按 LSN 严格递增**
2. **事务 WAL 是完整记录的**
3. **从库没看到 COMMIT 前，不会暴露事务结果**

例如：

```text
LSN 100: BEGIN
LSN 101: INSERT ...
LSN 102: UPDATE ...
LSN 103: COMMIT
```

只有看到 `COMMIT`，从库才会让事务结果对外可见。

## 十五、同步确认策略

### 1. `ANY 1`

```ini
synchronous_standby_names = 'ANY 1 (node2, node3)'
```

含义：

- 主库同时向 node2、node3 发送 WAL
- 任意 1 个先确认即可返回成功
- 另一个稍后追上也没关系

适合：

- 大多数生产业务
- 兼顾写入性能和数据安全

### 2. `FIRST 1`

```ini
synchronous_standby_names = 'FIRST 1 (node2, node3)'
```

含义：

- 固定优先等待 node2
- node2 不可用时再等 node3

适合：

- 明确存在主同步从优先级的场景

### 3. `ANY 2`

```ini
synchronous_standby_names = 'ANY 2 (node2, node3)'
```

含义：

- 两个从库都确认，主库才返回成功

特点：

- 数据最安全
- 写入延迟最高
- 任一从库变慢都会拖慢主库

## 十六、慢从库或故障从库怎么处理

### 1. 从库只是暂时落后

这是最常见的情况：

```text
主库:  [1] [2] [3] [4] [5] [6]
node2: [1] [2] [3] [4] [5] [6]
node3: [1] [2] [3] [4]
```

这并不一定是故障。

只要：

- WAL 还保留着
- 从库还在运行

那么 node3 就会持续接收 WAL 并最终追上。

### 2. 从库真的宕机了

例如 node3 完全停机：

```text
主库:  [1] [2] [3] [4] [5] [6]
node2: [1] [2] [3] [4] [5] [6]
node3: [1] [2] [3]
```

如果使用 `ANY 1`：

- 主库写入不会受影响
- node2 仍然能提供同步确认
- node3 恢复后继续追 WAL

### 3. 最应该担心的是"读到落后的从库"

例如：

1. 客户端写入主库
2. node2 已确认，主库返回成功
3. node3 还没追上
4. 客户端如果立刻读 node3，可能读到旧数据

### 解决方法

#### 方法一：HAProxy 自动摘除异常从库

```ini
option httpchk GET /replica
http-check expect status 200
default-server inter 3s fall 3 rise 2
```

从库挂掉或状态异常时，自动从读池摘除。

#### 方法二：限制最大允许延迟

Patroni 侧可配置：

```yaml
bootstrap:
  dcs:
    maximum_lag_on_failover: 1048576
```

表示：

- 延迟超过 1MB 的副本不参与故障切换

HAProxy 侧也可以结合 Patroni REST API 做更细的延迟检查，例如：

```ini
option httpchk GET /replica?lag=100KB
```

#### 方法三：应用层控制读写路径

- 刚写完立刻读、资金类关键读：走主库
- 普通查询、报表、搜索：走从库

## 十七、最坏情况分析

如果出现下面这种情况：

```text
node1（主库）挂了
node2（唯一同步从库）也挂了
node3（异步从库）只追到较早位置
```

那么 Patroni 可能提升 node3 为主，但最近一小段 WAL 可能丢失。

### 如何避免

可以改成：

```ini
synchronous_standby_names = 'ANY 2 (node2, node3)'
```

这样两个从库都确认后才返回。

代价是：

- 任一从库异常都会影响写入
- 可用性下降，安全性提高

## 十八、从库恢复时的两种情况

### 情况一：WAL 还在

这是最理想的情况。

```text
node3 挂之前: [1] [2] [3] [4]
主库现在:     [1] [2] [3] [4] [5] [6] [7] [8]
```

node3 恢复后：

- WAL Receiver 自动重连
- 从断开的 LSN 位置继续追
- 最终自动追平

依赖条件：

- 复制槽还在
- 主库还保留着所需 WAL

### 情况二：WAL 已被清理

如果从库离线过久，而运维又删除了对应复制槽释放磁盘：

```sql
SELECT pg_drop_replication_slot('node3');
```

那么主库可能已经删掉旧 WAL。

此时 node3 恢复时会发现：

```text
我要从 LSN 5 开始接收
但主库上对应 WAL 已不存在
```

这种情况下无法自动追平，需要重新做基础备份。

### 手工重做基础备份

```bash
sudo systemctl stop patroni

sudo rm -rf /var/lib/postgresql/16/main/*

sudo -u postgres pg_basebackup \
  -h 192.168.1.11 \
  -U replicator \
  -D /var/lib/postgresql/16/main \
  -X stream \
  -P \
  -R

sudo systemctl start patroni
```

### 使用 Patroni 重新初始化

更推荐的方式是：

```bash
patronictl -c /etc/patroni/config.yml reinit pg-cluster node3
```

Patroni 会自动做：

- 清理旧数据
- 重新执行 `pg_basebackup`
- 接管恢复流程

## 十九、恢复与一致性总结

| 场景 | 是否自动恢复 | 说明 |
| --- | --- | --- |
| 挂几分钟到几小时 | 是 | 复制槽保留 WAL，可自动追平 |
| 挂较久但复制槽还在 | 是 | 能追平，但要关注主库 WAL 堆积 |
| 挂太久且复制槽被删 | 否 | WAL 已清理，需要重新初始化 |

## 二十、生产运维建议

1. 监控复制延迟，不要只看 Patroni 状态。
2. 监控复制槽占用和 WAL 堆积，避免主库磁盘被撑满。
3. 对关键业务使用主库读，避免读到延迟副本。
4. 明确你的目标是"绝不丢数据"还是"高可用优先"，再选择 `ANY 1` 或 `ANY 2`。
5. 定期演练故障切换、旧主恢复和从库重建。

## 二十一、核心结论

如果只记住几件事，建议记住下面这些：

- PostgreSQL 高可用最常见方案是 `Patroni + etcd + HAProxy`
- WAL 流复制是主从同步的核心机制
- 复制槽决定了从库掉线后是否还能自动追平
- `ANY 1` 往往是生产环境里安全和性能的平衡点
- 真正容易踩坑的不是复制本身，而是读到延迟副本、WAL 堆积和恢复流程不熟

---

## 继续阅读

- [核心概念与高频考点](./core-concepts.md)
- [支付场景追问](./payment-practice.md)
- [返回 PostgreSQL 专题总览](./index.md)
