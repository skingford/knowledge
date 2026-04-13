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

<PostgreSQLHaDiagram kind="patroni-overview" />

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

::: warning 注意
宕机节点在恢复并重新加入之前，不参与实时投票；但 quorum 的计算基数不会因为它掉线就临时缩小。
:::

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

::: danger 警告
示例中的密码仅供演示，生产环境务必使用环境变量或密钥管理服务（如 HashiCorp Vault）管理密码。
:::

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
      use_pg_rewind: true // [!code highlight]
      use_slots: true // [!code highlight]
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

<PostgreSQLHaDiagram kind="patronictl-list-output" />

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

> 上面的 `192.168.1.11` 只是示例。生产环境里，业务不应该直接依赖“当前主库 IP”，而应该连到一个稳定入口，再由代理、VIP 或云 LB 把流量导到新的主库。

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

#### 业务如何找到新主库，处理 IP 变化

最核心的原则只有一句：

::: tip 建议
业务方尽量连”稳定入口”，不要把当前主库 IP 写死在配置里。
:::

常见方案可以这样选：

| 方案 | 切换速度 | 实现难度 | 适用场景 |
| --- | --- | --- | --- |
| VIP 漂移 | 快（通常 `1~3s`） | 中 | 物理机、自建机房、同子网 |
| HAProxy 代理 | 快（取决于健康检查，通常 `1~3s`，调优后可更低） | 高 | 大型分布式架构、跨机房、需要读写分离 |
| 多 IP / 多 Host 配置 | 依赖客户端重试 | 低 | 简单的 Python / Go / C 客户端 |
| 云负载均衡 | 快（取决于云厂商健康检查） | 低 | 阿里云 / AWS / GCP 等云环境 |

这里的“切换速度”说的是入口切到新主的大致时间，业务真实感知到的恢复时间通常还要再加上：

- Patroni 检测故障和完成提升的时间
- 代理或 LB 健康检查摘除旧主、接入新主的时间
- 客户端断线重连和重试的时间

##### 1. VIP 漂移

典型做法是 `Keepalived + HAProxy`：

- 业务连接固定 VIP
- 当前活跃代理节点持有这个 VIP
- 代理节点故障后，VIP 漂移到备用节点

优点：

- 对业务最透明，连接串几乎不用改
- 同子网环境里非常实用

限制：

- 一般要求在同一个二层网络或同子网
- 跨机房、跨可用区时不如代理或云 LB 灵活

##### 2. HAProxy 代理

典型做法是让业务始终连接固定的代理入口：

- `pg_write` 只转发到 Patroni 判定的主库
- `pg_read` 只转发到健康从库
- Patroni 切主后，HAProxy 通过健康检查自动把流量切到新主

优点：

- 最容易做读写分离
- 不要求业务理解当前谁是主库
- 可以结合 `lag`、会话摘除、连接耗尽保护等策略

限制：

- 需要额外维护代理层
- 真正切换速度强依赖健康检查参数，不能简单理解成永远 `<1s`

##### 3. 多 IP / 多 Host 配置

这类方案不额外引入代理，而是让客户端自己知道多个候选地址：

- 连接失败后按顺序重试下一个节点
- 或者由应用侧先探测主库，再重连

优点：

- 结构简单
- 很适合内部工具、轻量服务或脚本任务

限制：

- 一般要依赖客户端库的 failover 能力或应用层重试逻辑
- 很难优雅做统一读写分离
- 切换体验通常不如代理和 LB 平滑

如果客户端支持多 host 连接串，可以做成类似这样：

```bash
postgresql://admin:admin_password@192.168.1.11,192.168.1.12,192.168.1.13/mydb?target_session_attrs=read-write
```

这类写法的重点是：**尽量让客户端只接受可写节点，避免误连到只读副本。**

##### 4. 云负载均衡

在云环境里，通常最省心的是直接使用内网 `SLB / NLB` 一类负载均衡：

- 业务固定连接云 LB 地址
- LB 根据健康检查把流量转给当前主库或读副本
- Patroni 切主后，由健康检查自动摘除旧主、接入新主

优点：

- 基础设施能力成熟
- 省去自建 VIP 漂移和部分代理运维成本

限制：

- 要理解云厂商健康检查和连接保持行为
- 某些云 LB 更适合四层转发，不一定天然理解主从角色

##### 怎么选

- 自建机房且同子网：优先 `Keepalived + HAProxy`
- 云环境：优先云 LB，简单直接
- 需要读写分离、灰度规则、延迟控制：优先 `HAProxy`
- 业务规模小、客户端可控：多 host 重试也可以先用起来

无论选哪种方案，都尽量让业务访问：

- 一个固定 VIP
- 一个固定代理地址
- 或一个固定域名 / LB 地址

而不是直接访问“此刻的主库机器 IP”。

还有一个很重要但常被忽略的事实：

::: warning 注意
不管你用 VIP、HAProxy 还是云 LB，切主时旧 TCP 连接大概率都会中断。
:::

所以业务侧仍然应该具备：

- 自动重连
- 幂等或可重试写入设计
- 对短暂只读错误、连接断开的容忍能力

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

::: tip 建议
1. 不要使用明文密码，改用环境变量或密钥管理服务。
2. 使用 pgBackRest 或 WAL-G 做全量备份 + 增量归档。
3. 建立监控：复制延迟、WAL 积压、磁盘占用、切换事件。
4. HAProxy 建议双机部署，再配 Keepalived 提供 VIP。
5. 通过防火墙只开放必要端口：`5432`、`8008`、`2379`、`2380`、`5000`、`5001`。
:::

---

## 七、WAL 是什么

PostgreSQL 的核心复制机制基于 WAL（Write-Ahead Log）。

任何数据修改都遵循：

1. 先写 WAL
2. 再写数据文件

WAL 可以理解为一串按顺序追加的变更记录，例如：

<PostgreSQLHaDiagram kind="wal-example-log" />

主从同步的本质就是：

> 主库持续把 WAL 发送给从库，从库持续回放 WAL。

### LSN 是什么，为什么它能判断副本新旧

LSN（Log Sequence Number）可以理解为 **WAL 日志流中的位置坐标**。

它通常写成 `0/16B4A2F8` 这种形式，本质上表示某条 WAL 记录所在的位置。随着主库不断产生新的 WAL，LSN 会持续向前推进。

可以先用一个直观理解：

- LSN 越大，说明看到的 WAL 越新
- 从库回放到的 LSN 越靠后，说明它追得越快
- 两个副本比较“谁更新”，本质上就是比较它们各自已经接收、落盘或回放到哪个 LSN

例如：

<PostgreSQLHaDiagram kind="lsn-compare" />

这时通常可以判断：

- node2 已经追平主库
- node3 还落后一点

在故障切换场景里，**更靠后的 LSN 通常意味着更小的数据丢失风险**。

不过在 `Patroni + etcd` 架构里，这并不是说 “node2 会像投票人一样因为 node3 的 LSN 落后就拒绝投票”。更准确地说是：

- Patroni 通过 DCS 判断谁有资格尝试接管
- 运维或系统会优先选择数据更新、更接近主库的副本
- 延迟过大的副本可以通过 `maximum_lag_on_failover` 等配置排除出候选集

实践里常用这些 SQL 观察 LSN：

```sql
-- 主库当前 WAL 位置
SELECT pg_current_wal_lsn();

-- 从库最近回放到的位置
SELECT pg_last_wal_replay_lsn();
```

## 八、两种复制模式

### 1. 异步复制

<PostgreSQLHaDiagram kind="async-replication" />

特点：

- 优点：主库写入延迟低
- 缺点：主库崩溃时，最近尚未传输给从库的 WAL 可能丢失
- 一般 `RPO > 0`

### 2. 同步复制

<PostgreSQLHaDiagram kind="sync-replication" />

特点：

- 优点：数据安全更高
- 缺点：写入延迟受网络和从库确认速度影响
- 可以逼近 `RPO = 0`

示例配置：

```ini
synchronous_commit = on // [!code highlight]
synchronous_standby_names = 'ANY 1 (node2, node3)' // [!code highlight]
```

表示：

- 主库同时把 WAL 发给 node2、node3
- 任意 1 个从库先确认，主库就可以返回成功

这类配置在三节点里非常常见，因为它比“两节点强同步”更不容易被单个副本拖死。

::: warning 注意
`ANY 1` 不等于任何故障组合下都绝对零丢失。
:::

如果主库返回成功后，那个已经确认的同步副本也随后一起故障，而另一个副本还没追上，那么故障切换到落后的副本时，最近一小段事务仍可能丢失。这个边界场景见后面的“最坏情况分析”。

## 九、流复制完整流程

<PostgreSQLHaDiagram kind="streaming-flow" />

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

<PostgreSQLHaDiagram kind="replication-status-output" />

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

<PostgreSQLHaDiagram kind="multi-standby-streams" />

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

<PostgreSQLHaDiagram kind="commit-visibility" />

只有看到 `COMMIT`，从库才会让事务结果对外可见。

### 三节点下一次写入到底怎么同步

一个很容易混淆的点是：**三节点不代表数据会先写到 etcd，再由 etcd 分发给两个从库。**

真正的数据同步链路仍然是 PostgreSQL 主库直接把 WAL 发给各个从库；`Patroni + etcd` 负责的是控制面，比如健康检查、leader 锁和故障切换。

一次典型写入大致是这样发生的：

1. 客户端把事务写到主库。
2. 主库先把事务变更写入本地 WAL。
3. 主库上的多个 `WAL Sender` 并发把同一段 WAL 发送给 node2、node3。
4. 从库上的 `WAL Receiver` 接收 WAL，写入本地 `pg_wal`，然后由回放进程按顺序应用。
5. 主库是否现在就向客户端返回成功，取决于同步策略：
   - 异步复制：主库本地写完 WAL 就可以先返回
   - `ANY 1`：任意 1 个从库确认后返回
   - `ANY 2`：2 个从库都确认后返回

可以把它理解成：

<PostgreSQLHaDiagram kind="three-node-write-path" />

所以即使是三节点，本质上仍然是“单主 + 多从”的 WAL 流复制，只是主库同时维护了多个副本通道。

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

### 为什么三节点不一定更快，但更容易兼顾性能和可用性

“三节点更快”这个说法不够准确。

更准确的说法是：**三节点让你更容易在数据安全、写入延迟和故障容忍之间找到平衡。**

对比一下：

- 2 节点强同步：主库只能等那 1 个从库，那个从库一抖动，写入就容易被拖慢
- 3 节点 `ANY 1`：主库同时发给 2 个从库，先收到谁的确认就先返回，对单个副本故障更不敏感
- 3 节点 `ANY 2`：安全性最高，但延迟和抖动风险也最高

所以三节点的优势通常不是“绝对延迟更低”，而是：

- **单个副本慢了，主库不一定跟着卡死**
- **还能保留至少一个同步确认副本**
- **主库故障时，更容易挑出一个数据足够新的副本接管**

这也是为什么生产里常把下面这组配置当作常见折中：

```ini
synchronous_commit = on
synchronous_standby_names = 'ANY 1 (node2, node3)'
```

它表达的不是“必须两个从库都同步完成”，而是“至少有一个副本确认落盘后，事务才算提交成功”。

## 十六、慢从库或故障从库怎么处理

### 1. 从库只是暂时落后

这是最常见的情况：

<PostgreSQLHaDiagram kind="replica-lagging" />

这并不一定是故障。

只要：

- WAL 还保留着
- 从库还在运行

那么 node3 就会持续接收 WAL 并最终追上。

### 2. 从库真的宕机了

例如 node3 完全停机：

<PostgreSQLHaDiagram kind="replica-down-any1" />

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

<PostgreSQLHaDiagram kind="worst-case-failover" />

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

<PostgreSQLHaDiagram kind="recovery-wal-available" />

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

<PostgreSQLHaDiagram kind="recovery-wal-missing" />

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

::: tip 建议
1. 监控复制延迟，不要只看 Patroni 状态。
2. 监控复制槽占用和 WAL 堆积，避免主库磁盘被撑满。
3. 对关键业务使用主库读，避免读到延迟副本。
4. 明确你的目标是"绝不丢数据"还是"高可用优先"，再选择 `ANY 1` 或 `ANY 2`。
5. 定期演练故障切换、旧主恢复和从库重建。
:::

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
