---
title: Nginx 灰度发布、蓝绿切换与维护页切流实战
description: 系统整理 Nginx 在灰度发布、蓝绿切换、维护页切流与快速回滚中的实践，覆盖 split_clients、upstream 切换、维护页开关与可逆发布原则。
---

# Nginx 灰度发布、蓝绿切换与维护页切流实战

> Nginx 不只是反向代理，还常常是发布切流的第一道操作面。真正重要的不是“会不会切”，而是“能不能小步切、能不能快速回滚、能不能在异常时把伤害面收住”。

## 1. 先回答：Nginx 适合做哪类发布切流

### 适合

- 单机或少量机器入口
- 同一入口后面挂多个应用版本
- 需要临时灰度、蓝绿切换、维护页兜底
- 希望通过配置和 reload 完成可逆切换

### 不适合

- 大规模多集群统一灰度治理
- 很复杂的用户分群、实验平台、流量编排
- 强依赖服务网格、动态发现和跨集群策略联动的场景

一句话：

> Nginx 适合做入口层可逆切流，不适合替代完整发布平台。

## 2. 发布切流最重要的不是技巧，而是原则

至少要记住这 4 条：

- 小流量先试，不要一把全切
- 每一步都可逆，不做一次性不可回滚动作
- 切流前就准备好指标和日志观察面
- 维护页不是失败，而是控制伤害面的兜底动作

如果没有这四条，再花的配置也不稳。

## 3. 最常见的 3 种切流思路

### 1. Host 级切流

例如：

- `canary.example.com` 指向新版本
- `www.example.com` 继续指向稳定版本

特点：

- 最简单
- 最直观
- 最适合先验证新版本是否稳定

### 2. Header / Cookie 定向灰度

例如：

- 只有带特定 Header 的请求进新版本
- 指定测试账号或内部同事带特定 Cookie 进新版本

特点：

- 很适合内部灰度
- 便于精确控制样本

### 3. 百分比灰度

例如：

- 5% 流量进 canary
- 95% 继续走稳定版本

特点：

- 更接近真实线上
- 但更依赖真实 IP、日志和监控质量

## 4. 一条最稳的灰度主线

推荐顺序通常是：

1. 先用独立域名或 Header 做内部灰度
2. 确认日志、错误率、耗时都正常
3. 再做小比例切流
4. 指标稳定后再扩大比例
5. 异常时立刻切回稳定版本

这比一上来做随机百分比灰度稳得多。

## 5. 独立 canary 域名是最低风险起手式

```nginx
upstream app_stable {
  server 10.0.0.11:8080;
}

upstream app_canary {
  server 10.0.0.21:8080;
}

server {
  listen 443 ssl http2;
  server_name www.example.com;

  location / {
    proxy_pass http://app_stable;
  }
}

server {
  listen 443 ssl http2;
  server_name canary.example.com;

  location / {
    proxy_pass http://app_canary;
  }
}
```

这个方式的优点非常明显：

- 不影响主站流量
- 可控性强
- 回滚几乎不需要切主流量

## 6. Header / Cookie 定向灰度怎么做

这是内部验证最常见的做法。

```nginx
upstream app_stable {
  server 10.0.0.11:8080;
}

upstream app_canary {
  server 10.0.0.21:8080;
}

map $http_x_release_channel $release_backend {
  default app_stable;
  canary app_canary;
}

server {
  listen 443 ssl http2;
  server_name www.example.com;

  location / {
    proxy_pass http://$release_backend;
  }
}
```

这样做适合：

- 内部测试同事
- 指定客户端
- 人工验证链路

最重要的注意点：

- 先把 Header 约定清楚
- 只在小范围验证，不要把它当长期正式流量策略

## 7. 百分比灰度最常见的写法

Nginx 原生常用 `split_clients` 做简单分流。

```nginx
upstream app_stable {
  server 10.0.0.11:8080;
}

upstream app_canary {
  server 10.0.0.21:8080;
}

split_clients "${remote_addr}${http_user_agent}" $release_slot {
  5% canary;
  *  stable;
}

map $release_slot $release_backend {
  default app_stable;
  canary app_canary;
}

server {
  listen 443 ssl http2;
  server_name www.example.com;

  location / {
    proxy_pass http://$release_backend;
  }
}
```

这个方案最适合：

- 无状态接口
- 入口层简单比例灰度
- 不要求复杂用户画像和会话粘性

## 8. 百分比灰度前必须先确认什么

### 真实客户端 IP 是否可信

如果前面还有 CDN / LB，而你没处理真实 IP：

- 分流可能严重偏斜
- 日志统计会失真

### 会话和状态是否外置

如果用户状态绑在单机：

- 分流后体验可能不一致
- 回滚和扩容都会变麻烦

### 观察面是否准备好

至少要能看：

- 5xx 比例
- 502 / 504 数量
- 请求耗时
- canary 与 stable 的日志差异

## 9. 蓝绿切换更适合“整组切换”

蓝绿发布更像：

- 一整组旧版本 `blue`
- 一整组新版本 `green`
- 验证通过后，把主流量整体切过去

一种很常见的做法是：

```nginx
upstream app_blue {
  server 10.0.0.11:8080;
  server 10.0.0.12:8080;
}

upstream app_green {
  server 10.0.0.21:8080;
  server 10.0.0.22:8080;
}

server {
  listen 443 ssl http2;
  server_name www.example.com;

  location / {
    proxy_pass http://app_blue;
  }
}
```

切换时把 `app_blue` 改成 `app_green`，然后 `nginx -t && nginx -s reload`。

这个方式的特点是：

- 逻辑最简单
- 回滚最快
- 适合整站切换

## 10. 蓝绿切换时最重要的是“旧环境不要急着删”

真正稳的顺序是：

1. 新环境先完整验收
2. 主流量切到新环境
3. 观察一段时间
4. 旧环境保留，作为快速回滚点
5. 指标稳定后再回收旧环境

如果流量刚切完就把旧环境删掉，回滚成本会明显变高。

## 11. 维护页不是“无奈之举”，而是故障收口手段

维护页最适合这些场景：

- 发版窗口短暂封流
- 数据迁移期间不允许写流量
- 上游整体异常，需要快速止血
- 回滚前需要先稳住用户入口

一个基础配置：

```nginx
server {
  listen 443 ssl http2;
  server_name www.example.com;

  location / {
    if (-f /etc/nginx/maintenance/on) {
      return 503;
    }

    proxy_pass http://app_stable;
  }

  error_page 503 @maintenance;

  location @maintenance {
    root /srv/www/maintenance;
    try_files /maintenance.html =503;
    add_header Retry-After 120 always;
  }
}
```

这个思路的关键是：

- 用一个非常简单的开关文件控制入口态
- 不用临时大改主配置

## 12. 维护页也可以做“部分放行”

例如：

- 管理员仍可进后台
- 健康检查路径仍然可访问
- 某些内网来源继续通过

示例思路：

```nginx
location = /healthz {
  access_log off;
  return 200;
}
```

或者把后台入口白名单单独放开。

## 13. 切流时最该盯哪些信号

灰度和蓝绿都一样，至少盯这几类：

- 5xx 比例
- 502 / 504 数量
- 请求耗时和高分位延迟
- 业务关键接口成功率
- 错误日志是否明显增加

如果有 canary：

- canary 和 stable 要分开看

## 14. 回滚动作一定要事先写清楚

不要等出问题时临场想。

至少要提前准备：

- 回滚到哪个 upstream 组
- 需要恢复哪些配置文件
- reload 命令是什么
- 回滚后验证哪些 URL

可以把回滚动作压缩成这条：

1. 切回稳定 upstream
2. `nginx -t`
3. `nginx -s reload`
4. 冒烟验证
5. 看日志和监控

## 15. 最常见的误区

### 误区 1：一上来就做百分比灰度

更稳的是先用独立域名或 Header 做内部验证。

### 误区 2：灰度时不看日志和指标

没有观察面，就不能叫灰度，只能叫碰运气。

### 误区 3：切流动作不可逆

如果一改就是整套不可回退，那就不是安全发布。

### 误区 4：维护页上线靠临时手改

更好的方式是提前准备好配置和页面，出事时只开关。

## 16. 一条最实用的发布顺序

1. 先准备 stable / canary 或 blue / green
2. 先做内部验证
3. 再做小流量切入
4. 观察指标和日志
5. 稳定后扩大流量或整组切换
6. 异常时立刻切回并用维护页兜底

## 17. 学完这页后你应该形成的稳定口径

- Nginx 适合做入口层可逆切流
- Host / Header 灰度通常比直接百分比分流更稳
- 百分比灰度前必须先处理真实 IP 和观察面
- 蓝绿切换的关键是旧环境保留和快速回滚
- 维护页是切流治理和故障收口的一部分，不只是静态页

## 关联资料

- [Nginx 专题总览](./index.md)
- [上游、负载均衡与失败处理](./upstream-load-balancing-and-failure-handling.md)
- [Nginx 多环境配置治理、配置拆分与变更发布实战](./multi-environment-config-governance-and-change-release.md)
- [Nginx 与 OpenResty、Lua 扩展边界和适用场景实战](./openresty-lua-extension-boundaries-and-use-cases.md)
- [常见场景与配置模板](./common-scenarios-and-config-templates.md)
- [Nginx + Docker Compose 部署实战](./docker-compose-deployment-practice.md)
- [排障与日常运维](./troubleshooting-and-operations.md)
