---
title: Nginx 与 CDN、对象存储和大文件分发协同实战
description: 系统讲清 Nginx 在 CDN、对象存储、签名下载、大文件分发与真实 IP 回源链路里的职责边界与落地方案。
---

# Nginx 与 CDN、对象存储和大文件分发协同实战

> Nginx 进了生产后，很快就会遇到一个问题：是不是所有静态资源、下载流量和大文件都该经过应用，再经过 Nginx？大多数时候答案是否定的。真正要掌握的是：哪些内容适合 CDN 缓存，哪些内容应该让对象存储直接承接，哪些内容需要 Nginx 继续做统一入口、鉴权和回源控制。

## 1. 先把 CDN、Nginx、对象存储的职责拆开

| 组件 | 最擅长处理什么 | 不应该硬扛什么 | 典型用法 |
| --- | --- | --- | --- |
| CDN | 公共静态资源分发、边缘缓存、跨地域就近访问 | 个性化动态响应、复杂鉴权 | JS/CSS/图片、公共下载链接、热点内容加速 |
| Nginx | 统一入口、反向代理、缓存控制、真实 IP 处理、限流与转发 | 长期保存海量文件、应用层业务鉴权逻辑 | API 入口、源站、下载网关、回源控制 |
| 对象存储 | 海量文件存储、高可用、低运维成本 | 复杂站点入口逻辑、细粒度反向代理规则 | 图片、附件、安装包、视频、归档文件 |

一个最稳的判断是：

> 公共内容优先考虑 CDN，海量文件优先考虑对象存储，Nginx 负责把入口、回源和安全边界收住。

## 2. 最常见的三条分发链路

### 公共静态资源

推荐链路：

```text
前端构建产物 -> 对象存储或 Nginx 源站 -> CDN -> 浏览器
```

适合内容：

- 带 hash 的 JS/CSS
- 图片、字体、图标
- 公共下载页上的静态素材

关键点：

- 文件名带版本指纹
- `Cache-Control` 明确可长缓存
- CDN 和源站缓存策略不要互相打架

### 私有下载

推荐链路：

```text
用户请求 -> 应用鉴权 -> 签名 URL 或内部跳转 -> 对象存储 / Nginx 下载位置
```

适合内容：

- 用户私有附件
- 报表导出
- 需要权限校验的安装包或合同文件

关键点：

- 不要让应用进程长期流式搬运大文件
- 优先返回签名 URL，或让 Nginx 接管最终文件输出

### 动态 API / HTML

推荐链路：

```text
用户请求 -> CDN(按规则绕过或短缓存) -> Nginx -> 应用
```

适合内容：

- API
- HTML 入口页
- 登录态页面

关键点：

- 这类流量通常不做激进 CDN 缓存
- Nginx 负责反向代理、真实 IP、限流、日志与回源控制

## 3. 公共静态资源应该怎么和 CDN 协同

如果你已经有 CDN，最稳的做法通常不是让浏览器直接打 Nginx，而是：

- 浏览器先命中 CDN
- CDN 未命中时，再回源到 Nginx 或对象存储
- 源站只负责提供正确内容和正确缓存头

一份适合做源站的 Nginx 配置：

```nginx
server {
  listen 443 ssl http2;
  server_name origin.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  sendfile on;
  etag on;

  location /assets/ {
    alias /srv/www/assets/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }

  location = /index.html {
    root /srv/www/app;
    add_header Cache-Control "no-cache";
  }
}
```

这里真正重要的是：

- CDN 缓不缓存，首先取决于源站响应头怎么表达
- 带 hash 的资源适合 CDN 和浏览器双重长缓存
- HTML 不要和静态资源一刀切

## 4. 对象存储更适合承接什么流量

如果文件有下面这些特征，优先考虑对象存储通常更稳：

- 文件量大、总容量大
- 上传下载频繁
- 不希望把文件和应用实例绑死在本地磁盘
- 需要多机共享、跨可用区或跨地域分发

典型场景：

- 用户头像、图片、音视频
- 附件、导出文件、归档文件
- 安装包、升级包、数据包

对大多数团队来说，一个非常实用的落地方式是：

- 上传走对象存储
- 公共读流量走 CDN
- 私有下载走签名 URL
- Nginx 只保留入口、鉴权和特殊场景的下载网关能力

## 5. 私有下载不要让应用自己扛字节搬运

很多系统会犯一个共同的错：

- 应用先做鉴权
- 然后应用自己把几百 MB、几 GB 的文件一边读一边写给用户

这样的问题是：

- 应用实例被下载流量长时间占住
- 内存、带宽、连接和 worker 更容易被拖满
- 下载中断、续传、超时问题都堆到业务进程上

更稳的两类方案是：

### 方案一：返回对象存储签名 URL

适合：

- 文件已经在对象存储里
- 用户拿到短时有效链接后可直接下载

优点：

- 应用和 Nginx 都不用长期搬运文件
- 更适合海量附件和跨地域下载

### 方案二：应用鉴权后，交给 Nginx 输出本地文件

适合：

- 文件就在本地磁盘或共享挂载里
- 需要内部路径隔离

典型做法是 `X-Accel-Redirect`：

```nginx
location /protected-files/ {
  internal;
  alias /data/private-files/;
  sendfile on;
  tcp_nopush on;
}
```

应用鉴权通过后，返回类似下面的内部跳转头：

```text
X-Accel-Redirect: /protected-files/report-2026.pdf
```

这样权限判断还在应用，真正文件输出交给 Nginx。

## 6. 大文件分发时要特别确认什么

大文件分发最容易出问题的，不是“能不能下载”，而是“能不能稳定下载、续传、回源不过载”。

至少要检查这些点：

- 下载链路是否支持 `Range` 请求
- 是否允许断点续传
- 源站是不是每次都被全量回源打穿
- 文件是否被错误地让应用进程中转
- CDN、LB、Nginx 的超时是否足够覆盖真实下载时长

如果你必须让 Nginx 直接提供大文件，最小基线通常是：

```nginx
server {
  listen 80;
  server_name download.example.com;

  sendfile on;
  tcp_nopush on;

  location /files/ {
    alias /data/downloads/;
    expires 1h;
  }
}
```

然后至少要做一次真实验证：

```bash
curl -v -r 0-1023 http://download.example.com/files/big.iso -o /dev/null
```

这一步不是为了看速度，而是为了确认 `Range` 链路没有被中间层搞坏。

## 7. 前面有 CDN 时，真实 IP 和限流边界要先处理

一旦 CDN 在前面，Nginx 不再是第一跳，这时如果你不先处理真实 IP：

- 日志记录到的可能是 CDN 回源节点
- 限流限到的是 CDN，不是用户
- 安全审计和黑白名单都会失真

最小基线配置：

```nginx
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

最重要的原则只有一个：

> 只信任你明确控制、明确知道地址段的上一跳 CDN / LB，不要无条件相信任意 `X-Forwarded-For`。

## 8. 最常见的协同误区

### 误区一：所有文件都先回应用，再让应用返回

结果：

- 应用进程被下载流量拖垮
- 本来适合边缘缓存或对象存储的流量，全堆在业务层

### 误区二：把 HTML、登录页也当 CDN 静态资源一样长缓存

结果：

- 发布后用户一直拿旧入口
- 登录态页面和公共页缓存边界混乱

### 误区三：前面加了 CDN，却没处理真实 IP

结果：

- 限流、封禁、审计全部偏掉

### 误区四：大文件能下载，但没验证续传和回源压力

结果：

- 小文件没事，大文件和弱网一来问题全暴露

## 9. 观测和排障怎么做

排这类问题时，先别只盯 Nginx 配置，先把链路拆出来：

```text
客户端 -> CDN -> Nginx -> 应用 / 对象存储 / 本地文件
```

最实用的检查顺序：

1. 先确认当前流量到底应该由 CDN、Nginx 还是对象存储承接
2. 再看回源链路里真实 IP、Host、协议头有没有传对
3. 再看大文件是否支持 `Range` 和断点续传
4. 再看下载是不是被应用中转，导致上游过载
5. 最后再查缓存头、回源状态和错误日志

## 10. 学完这页至少要形成的稳定判断

- 公共静态资源优先考虑 CDN，海量文件优先考虑对象存储
- Nginx 更适合作为统一入口、源站、下载网关和回源控制层
- 私有大文件优先考虑签名 URL 或 `X-Accel-Redirect`，不要让应用自己长时间搬运字节
- 前面一旦有 CDN / LB，真实 IP 和限流边界必须先校准
- 大文件分发上线前，一定要真实验证 `Range` 和断点续传

## 关联资料

- [Nginx 专题总览](./index.md)
- [Nginx 缓存、回源与静态资源加速实战](./cache-origin-and-static-acceleration-practice.md)
- [Nginx Ingress、K8s 网关映射与配置迁移实战](./ingress-k8s-gateway-mapping-and-config-migration.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [Nginx 日志、监控与告警实战](./logging-monitoring-and-alerting-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
