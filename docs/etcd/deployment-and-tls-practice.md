---
title: Etcd 单机 / 3 节点部署与 TLS 证书实战
description: 面向 Linux 服务器整理 etcd 的单机与 3 节点部署、TLS 自签证书、配置文件、systemd 服务、验证命令与上线检查顺序。
---

# Etcd 单机 / 3 节点部署与 TLS 证书实战

理解 etcd 到了后面，迟早要过部署这道坎。很多人能把 Raft、Lease、Watch 讲清楚，但一到真正落机器就容易混：

- `listen-client-urls` 和 `advertise-client-urls` 到底怎么区分
- 单机和 3 节点到底哪些配置一样，哪些不能照抄
- 证书到底要准备几份，SAN 该怎么写
- systemd 怎么配更稳
- 为什么集群明明都起了，却健康检查不通过

这页就专门把这些动作串成一套实操主线。

## 快速导航

- [先立住部署目标](#先立住部署目标)
- [目录和角色规划](#目录和角色规划)
- [安装与系统准备](#安装与系统准备)
- [单机最小可用部署](#单机最小可用部署)
- [3 节点集群配置骨架](#3-节点集群配置骨架)
- [TLS 证书规划与生成](#tls-证书规划与生成)
- [systemd 服务配置](#systemd-服务配置)
- [上线验证顺序](#上线验证顺序)
- [常见部署坑](#常见部署坑)

## 先立住部署目标

先把“为什么部署成这样”说清楚，比一上来抄配置更重要。

### 1. 单机适合什么

- 本地实验
- 开发环境
- 学习 `etcdctl`、Lease、Watch、Txn
- 非关键场景的小型控制面

单机的价值是**理解配置骨架和命令手感**，不是高可用。

### 2. 3 节点适合什么

- 生产最常见的最小高可用方案
- 服务注册发现
- 配置中心
- Leader 选举
- 中小规模基础设施控制面

3 节点是 etcd 最常见的起点，因为它能容忍 1 个节点故障，又不会像 5 节点那样增加更多同步成本。

### 3. 为什么本页默认直接按 TLS 思路讲

因为只跑明文 HTTP 的 etcd，实验没问题，生产不稳。

从官方文档的思路看，etcd 的 TLS 分两层：

- client-to-server：客户端到 etcd
- peer-to-peer：etcd 节点之间

所以这页默认把 TLS 当成标准做法，只在需要时补一句“实验环境怎么简化”。

## 目录和角色规划

一个比较稳的 Linux 目录布局可以长这样：

```text
/usr/local/bin/etcd
/usr/local/bin/etcdctl
/etc/etcd/
└── etcd.yaml
/var/lib/etcd/
/etc/ssl/etcd/
├── ca.crt
├── ca.key
├── client.crt
├── client.key
├── etcd-1.crt
├── etcd-1.key
├── etcd-2.crt
├── etcd-2.key
├── etcd-3.crt
└── etcd-3.key
```

建议这样分：

- `/usr/local/bin` 放二进制
- `/etc/etcd` 放配置
- `/var/lib/etcd` 放数据目录
- `/etc/ssl/etcd` 放证书和私钥

私钥目录一定要控权限，不要图省事直接全员可读。

## 安装与系统准备

### 1. 创建运行用户与目录

```bash
sudo useradd --system --home /var/lib/etcd --shell /usr/sbin/nologin etcd

sudo mkdir -p /etc/etcd /var/lib/etcd /etc/ssl/etcd
sudo chown -R etcd:etcd /var/lib/etcd
sudo chown -R root:etcd /etc/ssl/etcd
sudo chmod 750 /etc/ssl/etcd
```

### 2. 放置二进制

```bash
sudo install -m 0755 etcd /usr/local/bin/etcd
sudo install -m 0755 etcdctl /usr/local/bin/etcdctl
```

### 3. 基础系统要求

- 时钟同步要正常
- 磁盘延迟不能太差
- 节点之间 2379 / 2380 端口要互通
- 主机名和 `/etc/hosts` 要先整理清楚

如果是多机部署，先把主机名和 IP 关系确定下来，再生成证书。

## 单机最小可用部署

单机最适合先把 etcd 的核心配置项看顺。

假设本机信息如下：

- 节点名：`etcd-1`
- IP：`10.0.0.11`

### 1. 单机配置文件

`/etc/etcd/etcd.yaml`

```yaml
name: etcd-1
data-dir: /var/lib/etcd

listen-client-urls: https://10.0.0.11:2379,https://127.0.0.1:2379
advertise-client-urls: https://10.0.0.11:2379

listen-peer-urls: https://10.0.0.11:2380
initial-advertise-peer-urls: https://10.0.0.11:2380

initial-cluster: etcd-1=https://10.0.0.11:2380
initial-cluster-state: new
initial-cluster-token: etcd-lab-single

cert-file: /etc/ssl/etcd/etcd-1.crt
key-file: /etc/ssl/etcd/etcd-1.key
trusted-ca-file: /etc/ssl/etcd/ca.crt
client-cert-auth: true

peer-cert-file: /etc/ssl/etcd/etcd-1.crt
peer-key-file: /etc/ssl/etcd/etcd-1.key
peer-trusted-ca-file: /etc/ssl/etcd/ca.crt
peer-client-cert-auth: true
```

### 2. 这几个参数最容易混

- `listen-client-urls`：本节点真正监听哪些客户端地址
- `advertise-client-urls`：本节点对外告诉客户端“请用这些地址来访问我”
- `listen-peer-urls`：本节点监听其他 etcd 节点的地址
- `initial-advertise-peer-urls`：本节点告诉其他成员“请用这些地址连我”

一个最常见的坑就是：

- 监听写对了
- 但 advertise 写成了 `127.0.0.1`

这样本机看着没问题，远端客户端和其他节点却连不上。

## 3 节点集群配置骨架

先约定一组固定节点：

| 节点名 | IP | client URL | peer URL |
| --- | --- | --- | --- |
| `etcd-1` | `10.0.0.11` | `https://10.0.0.11:2379` | `https://10.0.0.11:2380` |
| `etcd-2` | `10.0.0.12` | `https://10.0.0.12:2379` | `https://10.0.0.12:2380` |
| `etcd-3` | `10.0.0.13` | `https://10.0.0.13:2379` | `https://10.0.0.13:2380` |

### 1. 三节点共享的 `initial-cluster`

```text
etcd-1=https://10.0.0.11:2380,etcd-2=https://10.0.0.12:2380,etcd-3=https://10.0.0.13:2380
```

三台机器第一次启动时，这个值必须一致。

### 2. `etcd-1` 配置示例

`/etc/etcd/etcd.yaml`

```yaml
name: etcd-1
data-dir: /var/lib/etcd

listen-client-urls: https://10.0.0.11:2379,https://127.0.0.1:2379
advertise-client-urls: https://10.0.0.11:2379

listen-peer-urls: https://10.0.0.11:2380
initial-advertise-peer-urls: https://10.0.0.11:2380

initial-cluster: etcd-1=https://10.0.0.11:2380,etcd-2=https://10.0.0.12:2380,etcd-3=https://10.0.0.13:2380
initial-cluster-state: new
initial-cluster-token: etcd-prod-3n-01

cert-file: /etc/ssl/etcd/etcd-1.crt
key-file: /etc/ssl/etcd/etcd-1.key
trusted-ca-file: /etc/ssl/etcd/ca.crt
client-cert-auth: true

peer-cert-file: /etc/ssl/etcd/etcd-1.crt
peer-key-file: /etc/ssl/etcd/etcd-1.key
peer-trusted-ca-file: /etc/ssl/etcd/ca.crt
peer-client-cert-auth: true
```

### 3. `etcd-2` 和 `etcd-3` 改哪些

只改这几类字段：

- `name`
- 本机 `listen-*`
- 本机 `advertise-*`
- 本机证书路径

不要把整份配置复制过去以后，只改一半。

### 4. 为什么 `initial-cluster-token` 要单独写

官方文档明确建议：测试环境反复创建集群时，最好给每个新集群一个独立的 token。这样能降低不同集群间 cluster ID 混淆的风险。

所以一个很实用的习惯是：

- 正式环境用固定 token
- 临时实验环境每次新建都换一个 token

## TLS 证书规划与生成

从官方 TLS 文档的语义看，etcd 至少要区分两类证书用途：

- server / client 通信证书
- peer / peer 通信证书

在中小团队自管集群里，常见做法是每个 etcd 节点用一份成员证书，同时承担：

- 对客户端提供 TLS 服务
- 对其他成员做 peer TLS

再额外准备一份 `client.crt/client.key` 给 `etcdctl` 或自动化脚本使用。

### 1. 生成 CA

```bash
cd /etc/ssl/etcd

openssl genrsa -out ca.key 4096
openssl req -x509 -new -key ca.key -sha256 -days 3650 \
  -subj "/CN=etcd-ca" \
  -out ca.crt
```

### 2. 为 `etcd-1` 生成带 SAN 的证书

`/etc/ssl/etcd/etcd-1-openssl.cnf`

```ini
[ req ]
default_bits = 4096
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[ req_distinguished_name ]
CN = etcd-1

[ v3_req ]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = etcd-1
IP.1 = 10.0.0.11
IP.2 = 127.0.0.1
```

```bash
openssl genrsa -out etcd-1.key 4096
openssl req -new -key etcd-1.key -out etcd-1.csr -config etcd-1-openssl.cnf
openssl x509 -req -in etcd-1.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out etcd-1.crt -days 3650 -sha256 \
  -extensions v3_req -extfile etcd-1-openssl.cnf
```

### 3. `etcd-2` / `etcd-3` 怎么生成

方法一样，只替换：

- `CN`
- `DNS.*`
- `IP.*`

最重要的是把本节点会被访问到的地址都写进 SAN。常见要包含：

- 节点主机名
- 节点 IP
- 如果本机常用 `127.0.0.1:2379` 做管理，也要包含 `127.0.0.1`

### 4. 生成客户端证书

`/etc/ssl/etcd/client-openssl.cnf`

```ini
[ req ]
default_bits = 4096
distinguished_name = req_distinguished_name
prompt = no

[ req_distinguished_name ]
CN = etcd-client
```

`/etc/ssl/etcd/client-ext.cnf`

```ini
extendedKeyUsage = clientAuth
```

```bash
openssl genrsa -out client.key 4096
openssl req -new -key client.key -out client.csr -config client-openssl.cnf
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out client.crt -days 3650 -sha256 \
  -extfile client-ext.cnf
```

### 5. 证书权限

```bash
chown root:etcd /etc/ssl/etcd/*.key /etc/ssl/etcd/*.crt
chmod 640 /etc/ssl/etcd/*.key
chmod 644 /etc/ssl/etcd/*.crt
```

### 6. 实验环境能不能偷懒

可以，但要知道代价。

官方文档里也提供了：

- `--auto-tls`
- `--peer-auto-tls`

这种自动生成证书的方式。它适合快速实验“加密链路”，但不适合把它当成长期生产做法，因为你通常还需要更明确的认证和证书治理。

## systemd 服务配置

`/etc/systemd/system/etcd.service`

```ini
[Unit]
Description=etcd key-value store
Documentation=https://etcd.io/docs/
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
User=etcd
ExecStart=/usr/local/bin/etcd --config-file=/etc/etcd/etcd.yaml
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable etcd
sudo systemctl start etcd
sudo systemctl status etcd --no-pager
```

## 上线验证顺序

部署完不要一上来就只看“进程是不是活着”，更稳的顺序通常是下面这样。

### 1. 先看 systemd

```bash
sudo systemctl status etcd --no-pager
journalctl -u etcd -n 100 --no-pager
```

先确认：

- 配置文件能不能被读到
- 端口是否正常监听
- TLS 证书和 key 是否匹配

### 2. 再做 endpoint 健康检查

```bash
export ETCDCTL_API=3

etcdctl \
  --endpoints="https://10.0.0.11:2379,https://10.0.0.12:2379,https://10.0.0.13:2379" \
  --cacert=/etc/ssl/etcd/ca.crt \
  --cert=/etc/ssl/etcd/client.crt \
  --key=/etc/ssl/etcd/client.key \
  endpoint health
```

### 3. 再看 endpoint status

```bash
etcdctl \
  --endpoints="https://10.0.0.11:2379,https://10.0.0.12:2379,https://10.0.0.13:2379" \
  --cacert=/etc/ssl/etcd/ca.crt \
  --cert=/etc/ssl/etcd/client.crt \
  --key=/etc/ssl/etcd/client.key \
  endpoint status --write-out=table
```

重点看：

- 是否已经选出 Leader
- 三个节点是否都能正常响应
- 数据库大小和 term 是否大体合理

### 4. 再看成员列表

```bash
etcdctl \
  --endpoints="https://10.0.0.11:2379" \
  --cacert=/etc/ssl/etcd/ca.crt \
  --cert=/etc/ssl/etcd/client.crt \
  --key=/etc/ssl/etcd/client.key \
  member list -w=table
```

### 5. 最后做一次读写烟囱测试

```bash
etcdctl \
  --endpoints="https://10.0.0.11:2379" \
  --cacert=/etc/ssl/etcd/ca.crt \
  --cert=/etc/ssl/etcd/client.crt \
  --key=/etc/ssl/etcd/client.key \
  put /healthcheck/hello world

etcdctl \
  --endpoints="https://10.0.0.11:2379" \
  --cacert=/etc/ssl/etcd/ca.crt \
  --cert=/etc/ssl/etcd/client.crt \
  --key=/etc/ssl/etcd/client.key \
  get /healthcheck/hello
```

## 常见部署坑

### 1. `advertise-client-urls` 写成了 localhost

表现：

- 本机能连
- 远端客户端连不上

原因：

- advertise 是告诉别人“怎么访问我”，不是只对本机生效

### 2. 证书 SAN 不包含真实访问地址

表现：

- TLS 握手失败
- 报证书主机名或 IP 不匹配

原因：

- 生成证书时只写了 CN，没把 IP / DNS 写进 SAN

### 3. 三台机器用了相同的 `name`

表现：

- 集群启动异常
- 成员关系混乱

原因：

- 每个成员名必须唯一

### 4. 旧 `data-dir` 没清，新的 `initial-cluster` 又改了

表现：

- 看起来像“配置没问题但就是起不来”

原因：

- etcd 会把已有数据目录里的成员身份和 cluster 信息带进来

所以实验环境反复重建时，要明确你是在：

- 重启原集群
- 还是创建一个新逻辑集群

这两种动作不能混。

### 5. 节点之间 2380 不通

表现：

- 进程都在
- 但选不出稳定 Leader
- `endpoint health` 或 `endpoint status` 不正常

原因：

- peer 端口被防火墙、ACL 或安全组挡住了

### 6. 只看进程，不看健康检查

表现：

- `systemctl status etcd` 显示 active
- 但客户端还是写不进去

原因：

- 进程活着不等于已经形成 quorum，也不等于 TLS 和 cluster 配置都正确

## 建议怎么用这页

- 如果你是第一次部署 etcd：先从单机配置跑通，再上 3 节点
- 如果你已经有 etcd 集群，但总分不清 URL 和证书：重点看配置骨架和 TLS 章节
- 如果你在搭测试环境：可以先用单机 + `etcdctl` 手册建立手感
- 如果你在做正式环境：这页和 [Etcd 运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md) 最好一起看
- 如果你想把环境真正拿来练故障：继续看 [Etcd 故障场景演练与排障实验手册](./failure-drills-and-troubleshooting-lab.md)

## 关联资料

- [Etcd 专题总览](./index.md)
- [Etcdctl 常用命令与实验手册](./etcdctl-commands-and-lab.md)
- [Etcd 运维与排障：快照恢复、空间治理与故障处理](./operations-troubleshooting.md)
- [Etcd 必备问题与自检清单](./essential-questions.md)
- [K8s 控制面主线实战](/k8s/control-plane-mainline)
- [从零搭建生产级 K8s 集群全栈操作手册](/k8s/cluster-setup-kubeadm-kubesphere)
- [内网离线集群搭建操作指南](/k8s/offline-cluster-setup-guide)
