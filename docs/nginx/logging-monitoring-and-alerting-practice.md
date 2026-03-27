---
title: Nginx 日志、监控与告警实战
description: 系统整理 Nginx 的日志格式、访问日志分析、stub_status、基础监控指标、Prometheus / Grafana 告警思路与值班排障顺序。
---

# Nginx 日志、监控与告警实战

> Nginx 真正进入生产后，最重要的能力不只是“会配”，而是“出问题时能不能第一时间看懂日志、识别趋势、收到正确告警”。这页重点补齐日志、指标和告警主线。

## 1. 为什么要把日志和监控单独当成一条主线

因为 Nginx 很多时候是流量入口。

这意味着：

- 请求量变化，最先在 Nginx 看到
- 502、504、499 这类问题，通常先在 Nginx 暴露
- 上游慢、证书异常、流量异常，往往都能从 Nginx 的日志和指标先发现

一句话：

> Nginx 不只是代理层，它还是最前线的流量观测点。

## 2. 先回答：日志和指标分别解决什么问题

### 日志

适合回答：

- 某一次请求发生了什么
- 请求路径、状态码、耗时、来源 IP 是什么
- 失败请求落到了哪个上游

### 指标

适合回答：

- 现在整体流量大不大
- 5xx 是否在升高
- 活跃连接数是不是异常
- 某时间段错误率和延迟有没有抬头

最稳的理解：

> 日志偏单次事件追查，指标偏整体趋势判断。

## 3. access log 里最值得保留哪些字段

如果 access log 太简陋，到了线上基本只看得出一个状态码，排障很吃亏。

推荐至少保留：

- 客户端 IP
- Host
- 请求方法和 URI
- 状态码
- 响应体大小
- Referer / User-Agent
- 总请求耗时 `request_time`
- 上游耗时 `upstream_response_time`
- 上游地址 `upstream_addr`
- 上游状态码 `upstream_status`

## 4. 一份更适合生产排障的 `log_format`

```nginx
log_format main_ext
  '$remote_addr - $host [$time_local] '
  '"$request" $status $body_bytes_sent '
  '"$http_referer" "$http_user_agent" '
  'rt=$request_time '
  'ua="$upstream_addr" ustatus="$upstream_status" '
  'urt="$upstream_response_time" '
  'xff="$http_x_forwarded_for"';

access_log /var/log/nginx/access.log main_ext;
error_log  /var/log/nginx/error.log warn;
```

这份格式最实用的价值是：

- 可以同时看客户端视角和上游视角
- 502/504 时更容易知道失败落在哪个上游
- 能粗看是不是应用慢，还是入口前就出问题了

## 5. `request_time` 和 `upstream_response_time` 怎么一起看

这是排查慢请求时最有用的一组字段。

### `request_time`

表示：

- Nginx 从收到请求到响应结束的总耗时

### `upstream_response_time`

表示：

- 上游处理并返回响应头的耗时

一个很实用的判断：

- `request_time` 高，`upstream_response_time` 也高：更像上游慢
- `request_time` 高，`upstream_response_time` 很低或为空：更像客户端慢读、静态资源问题、Nginx 本地处理或链路其他环节问题

## 6. `error_log` 应该怎么设级别

常见级别从低到高大致是：

- `debug`
- `info`
- `notice`
- `warn`
- `error`
- `crit`

生产环境通常建议：

```nginx
error_log /var/log/nginx/error.log warn;
```

原因：

- `info` 往往太吵
- `debug` 只适合临时专项排查
- `warn` 往往能在噪音和有效信息之间取得平衡

## 7. 访问日志最常见的分析角度

### 看 5xx

```bash
rg ' 5[0-9]{2} ' /var/log/nginx/access.log | tail -n 50
```

### 看最慢请求

```bash
awk '{print $0}' /var/log/nginx/access.log | rg 'rt='
```

### 看某个上游是否经常报错

```bash
rg 'ustatus="502"|ustatus="504"' /var/log/nginx/access.log
```

### 看某个接口是否抖动

```bash
rg '"/api/orders' /var/log/nginx/access.log
```

这里的重点不是死记某个命令，而是养成“按状态码、按路径、按耗时、按上游”四个维度切日志的习惯。

## 8. `stub_status` 是什么

`stub_status` 是 Nginx 内置的一个轻量状态页，适合看非常基础的连接指标。

示例配置：

```nginx
server {
  listen 127.0.0.1:8081;

  location /nginx_status {
    stub_status;
    allow 127.0.0.1;
    deny all;
  }
}
```

常见输出里会有：

- Active connections
- accepts
- handled
- requests
- Reading
- Writing
- Waiting

这能帮助你快速判断：

- 连接数是不是突然飙高
- 当前更多是在读、在写，还是处于 keepalive 等待

## 9. `stub_status` 适合做什么，不适合做什么

### 适合

- 看连接数和请求总量
- 做最基础的入口健康观察
- 作为 Prometheus 抓取的简单数据源

### 不适合

- 直接看每个接口的耗时分布
- 直接判断哪一个 upstream 最慢
- 代替日志分析

一句话：

> `stub_status` 适合看整体连接状态，不适合替代请求级分析。

## 10. 基础监控至少盯哪些指标

如果你给 Nginx 建一套最小监控盘，建议先盯这些：

- QPS / 请求总量
- 2xx、4xx、5xx 数量和比例
- 活跃连接数
- 499 数量
- 502 / 504 数量
- 平均请求耗时和高分位耗时
- reload 失败或证书异常事件

为什么 499 要单独看：

- 它常常意味着调用方超时、前置代理超时或用户中断
- 499 上升不一定是 Nginx 故障，但通常说明链路体验在变差

## 11. 告警不要只按“有 5xx 就报警”

如果规则太粗，值班体验会很差。

更稳的思路是：

- 5xx 比例持续超过阈值再报警
- 502 和 504 分开统计
- 活跃连接异常升高单独报警
- 证书有效期临近单独报警
- reload 失败单独报警

一个很实用的分层：

- P1：入口整体不可用、5xx 飙高、证书过期
- P2：部分接口错误率持续升高、连接数异常
- P3：4xx 波动、单点慢请求增多、非关键站点告警

## 12. Prometheus / Grafana 一般怎么接

最常见的思路是：

1. Nginx 暴露基础状态页或由 exporter 采集
2. Prometheus 定时抓取
3. Grafana 做面板
4. Alertmanager 或其他告警通道发通知

这里不强依赖某个具体产品名，关键是理解链路：

> Nginx 产生日志和基础状态，观测系统负责采集、聚合、展示和报警。

## 13. 日志和指标要一起看，不要只信一边

一个常见误区是：

- 面板红了，只盯指标
- 某个请求炸了，只盯日志

更稳的顺序通常是：

1. 先看面板，判断是不是整体性问题
2. 再看 access log，确认是哪些请求受影响
3. 再看 error log，确认失败原因
4. 再回到上游应用和依赖系统

## 14. 一条通用值班判断顺序

### 第一步：看是不是整体流量异常

- QPS 是否突增或突降
- 活跃连接是否异常

### 第二步：看错误类型

- 4xx 是入口规则变化，还是恶意流量增加
- 5xx 是 Nginx 配置问题，还是上游服务问题
- 499 是不是客户端超时大量上升

### 第三步：看耗时

- 总耗时升高
- 上游耗时升高
- 某一个路径明显变慢

### 第四步：回查日志

- access log 看范围
- error log 看原因

## 15. 一份偏生产的日志配置示例

```nginx
log_format main_ext
  '$remote_addr - $host [$time_local] '
  '"$request" $status $body_bytes_sent '
  '"$http_referer" "$http_user_agent" '
  'rt=$request_time '
  'ua="$upstream_addr" ustatus="$upstream_status" '
  'urt="$upstream_response_time" '
  'xff="$http_x_forwarded_for"';

access_log /var/log/nginx/access.log main_ext;
error_log  /var/log/nginx/error.log warn;

server {
  listen 127.0.0.1:8081;

  location /nginx_status {
    stub_status;
    allow 127.0.0.1;
    deny all;
  }
}
```

## 16. 最常见的坑

- access log 字段太少，出问题时根本无法定位上游和耗时
- 只保留日志，不做基础指标和告警
- `stub_status` 暴露到公网
- error log 级别开得太高或太低，导致没信号或全是噪音
- 只盯 5xx，不盯 499 和延迟

尤其要记住这一点：

> `stub_status` 一定要限制来源，不要直接对公网裸露。

## 17. 学完这页后你应该形成的稳定口径

- access log 用来追请求，指标用来判趋势
- `request_time` 和 `upstream_response_time` 要配合看
- 最小监控盘至少要有连接数、QPS、5xx、499、延迟
- `stub_status` 适合基础连接监控，不替代日志分析
- 值班时先看整体，再看日志，再回上游

## 关联资料

- [Nginx 专题总览](./index.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [Nginx 限流、黑白名单与基础安全防护实战](./rate-limit-allowlist-and-security-hardening.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
