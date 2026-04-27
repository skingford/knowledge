---
title: 网络排障与常用命令
description: 按 DNS、连通性、端口监听、HTTP、TLS 和抓包分层整理网络排障顺序，并汇总常用命令的典型用法。
---

<script setup>
import InlineSvg from '@docs-components/common/InlineSvg.vue'
</script>

# 网络排障与常用命令

<InlineSvg src="/images/network/troubleshooting-flowchart.svg" alt="网络排障决策流程" />

## 适合谁看

- 线上接口超时、域名异常、TLS 报错时，不知道第一步该查什么的人
- 平时会用 `ping`、`curl`、`dig`，但还没有形成固定排障顺序的人
- 希望把命令行工具和真实故障定位过程结合起来的人

## 学习目标

- 建立一套分层排障顺序，减少“瞎试命令”
- 知道常见网络命令分别适合查什么问题
- 遇到 DNS、TCP、HTTP、TLS 问题时，知道先取哪些证据

## 快速导航

- [先看错误关键字，别急着全链路乱查](#先看错误关键字别急着全链路乱查)
- [先确定问题发生在哪一层](#先确定问题发生在哪一层)
- [DNS 问题怎么查](#dns-问题怎么查)
- [连通性和路由问题怎么查](#连通性和路由问题怎么查)
- [端口和连接状态怎么查](#端口和连接状态怎么查)
- [HTTP 和 HTTPS 问题怎么查](#http-和-https-问题怎么查)
- [什么时候该抓包](#什么时候该抓包)
- [一套通用排障顺序](#一套通用排障顺序)

## 先看错误关键字，别急着全链路乱查

很多排障时间，其实不是浪费在不会命令，而是浪费在第一步方向错了。

可以先把错误文案粗分一轮：

| 错误 / 现象 | 更可能卡在哪 | 第一轮建议 |
| --- | --- | --- |
| `no such host` | DNS | `dig`、`nslookup` |
| `connection refused` | 端口没监听或被 RST | `ss -ltn`、`lsof -i` |
| `i/o timeout` | 网络不可达、对端太慢、代理超时 | `ping`、`traceroute`、`curl -v` |
| `connection reset by peer` | 对端主动断开 | 服务日志、代理超时、协议不匹配 |
| `tls: handshake failure` | TLS 协商失败 | `openssl s_client`、TLS 配置 |
| `x509: certificate signed by unknown authority` | 证书链 / 信任库问题 | 证书链、根 CA、客户端环境 |
| `502` | 网关拿到的是坏响应或上游连不上 | 网关日志、上游监听、协议匹配 |
| `504` | 上游超时没返回 | 上游耗时、依赖、超时配置 |

如果第一眼就能把问题压缩到一层，后面的命令量会少很多。

## 先确定问题发生在哪一层

排障时最怕的是：

- 命令用得很多
- 但没有问题分层

建议先把问题拆成下面几类：

| 现象 | 优先怀疑 |
| --- | --- |
| 域名解析失败 | DNS |
| IP 不通 / 丢包高 | 路由、ACL、安全组、网络质量 |
| 能通但端口不通 | 防火墙、监听、LB、服务未启动 |
| TCP 能连上但 HTTP 超时 | 网关、应用、下游依赖 |
| 出现大量 `TIME_WAIT` / `CLOSE_WAIT` | 连接复用、连接泄漏、关闭流程 |
| HTTP 正常但 HTTPS 异常 | TLS 版本、证书链、SNI |

## DNS 问题怎么查

最常用：

```bash
dig example.com
nslookup example.com
```

最关键是确认：

- 解析到哪个 IP
- TTL 是多少
- 本地和线上解析结果是否一致
- 是否存在 CNAME 跳转

如果怀疑递归 DNS 有问题，可以指定解析器：

```bash
dig @8.8.8.8 example.com
```

## 连通性和路由问题怎么查

### ping

适合快速判断：

- 基本 ICMP 连通性
- 延迟大概情况
- 是否有明显丢包

```bash
ping example.com
```

但要注意：

- ping 不通不一定代表 TCP 不通
- 某些环境会禁 ICMP

### traceroute / mtr

适合看：

- 路由经过哪些跳点
- 哪一段延迟明显升高
- 是否在某个中间节点开始丢包

```bash
traceroute example.com
mtr example.com
```

## 端口和连接状态怎么查

### ss

这是排查监听和连接状态最常用的命令之一：

```bash
ss -ltn
ss -tanp | head
ss -s
```

重点关注：

- 目标端口是否在监听
- `ESTAB`、`TIME-WAIT`、`CLOSE-WAIT` 是否异常偏多
- 是否存在连接堆积

::: tip 看到 `TIME-WAIT` 和 `CLOSE-WAIT` 时怎么快速判断
- `TIME-WAIT` 多：先怀疑短连接多、连接没复用好
- `CLOSE-WAIT` 多：先怀疑应用没及时关闭连接

如果你总是看到这些状态却很难讲清含义，可以配合读 [Socket、端口与连接状态](./socket-and-connection-state.md)。
:::

### lsof

如果要看哪个进程占用端口：

```bash
lsof -i :443
```

## HTTP 和 HTTPS 问题怎么查

### curl

`curl -v` 非常适合排：

- HTTP 状态码
- Header
- 重定向
- TLS 协商过程的一部分

```bash
curl -v https://example.com/health
curl -I https://example.com
```

如果要看某个域名是否被错误解析，也可以临时指定 Host 和目标 IP：

```bash
curl -v --resolve example.com:443:1.2.3.4 https://example.com
```

如果问题已经明显落在代理、上游转发或 `502` / `504` 这层，建议继续看 [代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md)。

### openssl

当你怀疑 HTTPS 证书链、SNI、TLS 版本时，`openssl s_client` 很有用：

```bash
openssl s_client -connect example.com:443 -servername example.com
```

重点看：

- 返回的证书链是否完整
- 证书域名是否匹配
- 是否握手成功

如果问题更偏证书、mTLS 或 `x509` 错误，建议继续看 [TLS、证书与 mTLS](./tls-and-certificates.md)。

## 什么时候该抓包

如果前面的层面都看不清，或者你怀疑：

- TCP 重传很多
- 握手流程不完整
- RST / FIN 异常
- 某些包根本没有到达

就该考虑抓包。

### tcpdump

```bash
tcpdump -i any host example.com and port 443
```

抓包时优先问自己：

- 我要验证什么现象
- 我要看哪条连接
- 我要抓客户端、服务端还是中间代理节点

如果你想把抓包从“会敲一条 `tcpdump` 命令”升级成“能看懂三次握手、RST、重传和 TLS Alert”，建议继续看 [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md)。

## 一套通用排障顺序

一个很实用的顺序是：

1. 先确认域名能不能正确解析
2. 再确认目标 IP 是否连得通
3. 再看端口有没有监听、LB 有没有健康摘除
4. 再看 HTTP / HTTPS 响应和错误码
5. 还不清楚时再抓包确认 TCP / TLS 细节

这个顺序的价值在于：

- 先用成本低的手段缩小范围
- 把复杂抓包留到最后
- 避免一开始就陷进细节

## 高频自检题

- 为什么 `ping` 不通不能直接等于“服务不可用”
- 为什么 `curl -v` 常常比浏览器报错更适合第一时间定位问题
- 为什么要先查监听和连接状态，再查代码逻辑
- 为什么很多 TLS 问题需要带上 `-servername` 才能看清真相

## 延伸阅读

- 想先建整体框架和协议链路：读 [网络必备知识](./essential-knowledge.md)
- 想补端口、Socket 和连接状态：读 [Socket、端口与连接状态](./socket-and-connection-state.md)
- 想专门补 TLS、证书、SNI 和 mTLS：读 [TLS、证书与 mTLS](./tls-and-certificates.md)
- 想补代理、反向代理、网关和 `502` / `504`：读 [代理、反向代理、网关与隧道](./proxy-gateway-and-tunnel.md)
- 想补入口设施链路：读 [DNS、CDN 与负载均衡](./dns-cdn-and-load-balancing.md)
- 想把抓包真正练起来：读 [抓包、tcpdump 与 Wireshark](./packet-capture-and-tcpdump.md)
