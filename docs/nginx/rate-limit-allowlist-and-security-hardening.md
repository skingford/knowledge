---
title: Nginx 限流、黑白名单与基础安全防护实战
description: 系统整理 Nginx 的限流、连接限制、黑白名单、Basic Auth、方法限制、请求体限制与入口层基础安全加固实践。
---

# Nginx 限流、黑白名单与基础安全防护实战

> Nginx 做不了完整安全平台，但入口层很多最基础、最有效、成本最低的防护动作，恰恰应该先在这里完成。这页重点讲限流、黑白名单、后台保护和基础加固。

## 1. 先回答：Nginx 适合做哪些安全动作

### 适合

- 基础请求限流
- 连接数限制
- 后台入口黑白名单
- Basic Auth 保护内页
- 上传体积和请求方法限制
- 隐藏版本、关闭目录浏览、限制敏感路径

### 不适合

- 替代完整 WAF
- 替代业务鉴权系统
- 做复杂风控策略引擎
- 单独对抗大规模 DDoS

一句话：

> Nginx 适合做入口层的第一道基础防线，不适合被当成全能安全平台。

## 2. 做限流前先把真实客户端 IP 处理对

这是最容易被忽略的前置条件。

如果 Nginx 前面还有 LB、CDN、反向代理，而你没有先处理真实 IP，那么：

- 限流可能全部打在前置代理 IP 上
- 黑白名单会失真
- 审计也会失真

最基本的配置思路：

```nginx
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

原则只有一个：

- 只信任你明确控制的上一跳代理

## 3. `limit_req` 和 `limit_conn` 分别管什么

### `limit_req`

控制的是：

- 单位时间内请求速率

适合：

- 登录接口
- 短信验证码接口
- 高频轮询接口
- 容易被刷的公开 API

### `limit_conn`

控制的是：

- 同一来源的并发连接数

适合：

- 防止单来源占满连接
- WebSocket、长连接类场景做基础兜底

一句话区分：

- `limit_req` 控频率
- `limit_conn` 控并发

## 4. 一份最常见的接口限流配置

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
  location /api/ {
    limit_req zone=api_limit burst=40 nodelay;
    limit_conn conn_limit 50;
    limit_req_status 429;
    proxy_pass http://app_backend;
  }
}
```

这里几个参数的理解很关键：

- `rate=20r/s`：稳态速率
- `burst=40`：允许一定突发
- `nodelay`：突发内不排队，直接放行
- `limit_req_status 429`：超限时返回更明确的状态码

## 5. 登录、验证码这类接口为什么要单独限流

因为这些接口天然更容易被刷：

- 登录：撞库、爆破
- 验证码：短信轰炸、资源滥用
- 搜索：低成本高频打点

所以更稳的做法是：

- 普通 API 一套限流
- 登录、验证码、回调入口再单独更严一套

示例：

```nginx
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

location /api/login {
  limit_req zone=login_limit burst=10 nodelay;
  proxy_pass http://app_backend;
}
```

## 6. 黑白名单最常见的做法

### 白名单放行

```nginx
location /admin/ {
  allow 10.0.0.0/8;
  allow 192.168.1.0/24;
  deny all;
  proxy_pass http://app_backend;
}
```

### 单 IP 封禁

```nginx
deny 203.0.113.10;
```

最实用的经验是：

- 对后台、内部接口、状态页优先做白名单
- 黑名单更适合临时封禁已知恶意来源

## 7. Basic Auth 适合放在哪些地方

Basic Auth 不是现代业务登录系统的替代品，但很适合保护：

- 内部后台入口
- 临时预发环境
- 调试页面
- 只给少量同事使用的管理页

示例：

```nginx
location /internal/ {
  auth_basic "Restricted";
  auth_basic_user_file /etc/nginx/.htpasswd;
  proxy_pass http://app_backend;
}
```

最好把它理解成：

> Basic Auth 适合做轻量入口保护，不适合替代正式业务鉴权。

## 8. 白名单和 Basic Auth 可以组合使用

这在内部系统里很常见：

```nginx
location /ops/ {
  allow 10.0.0.0/8;
  deny all;

  auth_basic "Ops Only";
  auth_basic_user_file /etc/nginx/.htpasswd;

  proxy_pass http://app_backend;
}
```

这样做的好处：

- 先用网络边界筛掉大部分无关来源
- 再用账号口令做第二层保护

## 9. 请求方法和上传体积也属于入口层防护

### 限制方法

```nginx
location /api/public-upload {
  limit_except POST {
    deny all;
  }

  proxy_pass http://app_backend;
}
```

### 限制上传体积

```nginx
client_max_body_size 20m;
```

这些配置的价值在于：

- 减少不必要攻击面
- 避免大体积异常请求拖垮入口

## 10. 敏感路径要显式收口

一些目录和文件，不应该被默认暴露：

- `.git`
- `.env`
- 备份文件
- 临时脚本目录
- 私有配置文件

示例：

```nginx
location ~ /\.(git|env) {
  deny all;
}

location ~* \.(sql|bak|tar|gz)$ {
  deny all;
}
```

如果要更保守，也可以：

- 只对白名单静态目录开放
- 其他路径全部交给应用显式处理

## 11. 目录浏览一般不该开

```nginx
autoindex off;
```

如果没有明确的下载目录场景，目录浏览通常应该保持关闭。

## 12. 一份偏生产的安全基线片段

```nginx
server_tokens off;
client_max_body_size 20m;

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
  listen 443 ssl http2;
  server_name example.com;

  location /api/login {
    limit_req zone=login_limit burst=10 nodelay;
    limit_req_status 429;
    proxy_pass http://app_backend;
  }

  location /api/ {
    limit_req zone=api_limit burst=40 nodelay;
    limit_conn conn_limit 50;
    proxy_pass http://app_backend;
  }

  location /admin/ {
    allow 10.0.0.0/8;
    deny all;
    auth_basic "Admin Only";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://app_backend;
  }

  location ~ /\.(git|env) {
    deny all;
  }
}
```

## 13. 告警和日志要怎么配合看

安全防护不是只靠配置，还要能观察效果。

建议至少关注：

- 429 是否持续升高
- 403 是否异常升高
- 某个后台路径是否频繁被扫
- 某来源 IP 是否在短时间内大量触发限流

也就是说：

- 配置负责挡
- 日志和告警负责告诉你“是不是有人在持续撞”

## 14. 最常见的误区

### 误区 1：限流阈值一刀切

不同接口的风险和流量特征不同，不应该都用一套。

### 误区 2：没处理真实 IP 就开始限流

结果常常是把 CDN 或 LB 限了，不是把用户限了。

### 误区 3：只靠 Nginx 做所有安全

入口层只能挡一部分问题，业务鉴权、验证码、风控、审计仍要在应用层完成。

### 误区 4：把后台只做 Basic Auth，不做白名单

这样暴露面还是太大。

## 15. 一条最实用的上线顺序

1. 先把真实 IP 处理对
2. 再给登录、验证码等高风险接口单独限流
3. 再给后台入口加白名单
4. 再补 Basic Auth 和敏感路径封禁
5. 最后根据日志和告警持续调阈值

## 16. 学完这页后你应该形成的稳定口径

- Nginx 适合做入口层基础防护，不替代 WAF 和业务鉴权
- 限流前先把真实 IP 信任边界处理对
- `limit_req` 管速率，`limit_conn` 管并发
- 后台入口优先白名单，再叠加 Basic Auth
- 429、403、敏感路径扫描都应该进入日志和告警视角

## 关联资料

- [Nginx 专题总览](./index.md)
- [HTTPS、性能优化与安全基线](./https-performance-and-security.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
