---
title: Docker Compose 部署实践
description: 系统整理 Docker Compose 单机部署实践，覆盖目录结构、服务编排、反向代理、环境变量、数据卷、发布升级、回滚、备份与运维边界。
---

# Docker Compose 部署实践

> Compose 最适合解决的是“单机上把几个相互依赖的服务稳定跑起来”。它不是 Kubernetes 的缩水版，也不是所有生产场景的默认答案，但对中小型系统、内网系统、测试环境和单机交付很实用。

## 1. 先回答：Compose 适合什么，不适合什么

### 适合

- 单机部署内部系统
- 测试环境、预发环境
- 中小规模 Web 服务加数据库、缓存、反向代理的组合
- 需要把部署方式写成声明式配置，而不是一堆手工命令

### 不适合

- 多节点调度
- 自动扩缩容
- 复杂发布治理
- 多机高可用编排

一个稳定说法是：

> Compose 更像单机应用编排和交付清单，解决的是“一台机器上几组容器怎么一起稳定运行”；Kubernetes 解决的是“很多机器上很多服务怎么持续治理”。

## 2. 推荐的目录结构

一个单机部署目录，至少建议有这些内容：

```text
deploy/
├── compose.yml
├── .env
├── nginx/
│   └── default.conf
├── backups/
├── scripts/
│   ├── deploy.sh
│   ├── backup.sh
│   └── rollback.sh
└── data/
```

关键点：

- `compose.yml` 只管服务编排
- `.env` 只放环境变量，不进 Git
- 反向代理配置单独放
- 备份和部署脚本单独放，避免每次手敲

## 3. 一个常见的部署拓扑

典型组合：

- `nginx`：统一入口，处理 HTTPS、反向代理、静态资源
- `api`：业务服务
- `worker`：异步任务
- `postgres`：数据库
- `redis`：缓存或任务队列

这类组合最典型的价值是：

- 服务依赖关系清楚
- 数据目录可以单独挂卷
- 发布、升级、回滚可以脚本化

## 4. Compose 文件怎么写更稳

```yaml
services:
  nginx:
    image: nginx:1.27
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - nginx-cache:/var/cache/nginx
    depends_on:
      api:
        condition: service_started
    restart: unless-stopped
    networks:
      - edge
      - app

  api:
    image: registry.example.com/team/api:1.4.2
    env_file:
      - .env
    volumes:
      - app-data:/app/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app

  worker:
    image: registry.example.com/team/api:1.4.2
    command: ["./worker"]
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped
    networks:
      - app

  redis:
    image: redis:7
    volumes:
      - redisdata:/data
    restart: unless-stopped
    networks:
      - app

volumes:
  app-data:
  pgdata:
  redisdata:
  nginx-cache:

networks:
  edge:
  app:
```

这个示例里最重要的点：

- 反向代理和业务服务分网络，外部入口与内部服务边界更清楚
- 业务镜像固定版本，不用 `latest`
- 数据库和缓存都用具名卷持久化
- 依赖顺序配合 `healthcheck`
- `restart` 策略显式写出

## 5. 环境变量和配置怎么放

### 原则

- 代码默认值只放安全默认项
- 环境差异通过 `.env` 或外部注入控制
- 密钥不写死在 `compose.yml`

`.env` 常见内容：

```bash
APP_ENV=production
APP_PORT=8080
POSTGRES_PASSWORD=replace-me
REDIS_URL=redis://redis:6379/0
JWT_SECRET=replace-me
```

必须记住：

- `.env` 不要提交到 Git
- 如果机器上有更合适的秘密管理方式，优先走外部管理
- 配置文件挂载最好用只读

## 6. 数据卷、备份和恢复不能最后才想

### 哪些数据必须独立持久化

- 数据库数据目录
- Redis 持久化目录
- 上传文件目录
- 需要跨重启保留的业务文件

### 最基本的备份策略

- 数据库定时逻辑备份或物理备份
- 关键卷目录有快照或离机副本
- 备份脚本和恢复脚本都要演练

一个最基础的 PostgreSQL 备份例子：

```bash
docker compose exec -T postgres pg_dump -U app app > backups/app-$(date +%F-%H%M%S).sql
```

### 结论

- 持久化不是“挂个 volume 就完了”
- 没有恢复演练的备份，价值非常有限

## 7. 发布、升级和回滚怎么做

### 最小发布流程

1. 拉新镜像
2. 校验配置
3. 执行 `docker compose up -d`
4. 检查健康状态和日志
5. 保留旧镜像和上一个稳定 tag

常见命令：

```bash
docker compose pull
docker compose config
docker compose up -d
docker compose ps
docker compose logs -f api
```

发布前再确认两件事：

- 部署机已经登录对应私有仓库，必要时先执行 `docker login`
- 关键版本如果要收紧漂移风险，可以直接把 `image` 固定到 digest

### 回滚思路

- 不要只保留一个漂移的 tag
- 回滚本质上是把镜像版本切回上一个稳定 tag，再重新 `up -d`

可以这样理解：

> Compose 回滚不像 K8s 有 Deployment revision，核心仍然是“你有没有保留清晰的镜像版本和可重复的部署脚本”。

## 8. 反向代理和 HTTPS 一般怎么配

单机部署里，最常见的外层就是 Nginx 或 Caddy。

建议职责分离：

- 反向代理处理 80/443、TLS、静态资源、压缩和基础限流
- 业务服务只关心自身监听端口和健康检查

这样做的好处：

- 证书续期和业务容器解耦
- 多服务统一从一个入口暴露
- 日志与访问控制集中治理

## 9. 监控、日志和日常运维要留出口

最少要能做到：

- `docker compose ps` 能快速看到状态
- `docker compose logs -f` 能定位服务日志
- 磁盘占用可查
- 卷和镜像清理有边界

高频命令：

```bash
docker compose ps
docker compose logs -f
docker stats
docker system df
```

## 10. Compose 部署最常见的坑

- 把 Compose 当成多节点高可用平台
- 以为 `depends_on` 就等于数据库真的可用
- 把密码直接写进 `compose.yml`
- 升级前不做备份
- 用 `latest` 发布，导致无法精确回滚
- `docker compose down -v` 把生产卷一起删掉

## 11. 一个最小可用的单机部署清单

- 镜像版本固定，不用 `latest`
- 业务、代理、数据库、缓存职责分清
- 数据目录已挂卷
- `.env` 不进仓库
- 发布前能 `docker compose config` 校验
- 发布后有健康检查和日志确认
- 有备份和回滚路径
- 明确知道 Compose 不是多机编排方案

## 关联资料

- [Docker 专题总览](./index.md)
- [Docker 容器生命周期与运行模型](./container-lifecycle-and-runtime.md)
- [Docker 镜像仓库、Harbor 与发布治理](./registry-and-image-governance.md)
- [Docker 网络、存储与 Compose 实战](./network-storage-and-compose.md)
- [Docker 安全与生产实践](./security-and-production-practice.md)
- [Docker 排障与日常运维](./troubleshooting-and-operations.md)
- [Linux 运维实战：磁盘清理与进程管理](../ops/linux-disk-cleanup.md)
