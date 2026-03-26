---
title: Docker 网络、存储与 Compose 实战
description: 系统整理 Docker 网络、存储与 Compose 实战，覆盖 bridge、host、端口映射、bind mount、volume、tmpfs、服务发现与多容器联调。
---

# Docker 网络、存储与 Compose 实战

> Docker 的很多线上问题，不是“镜像没构建出来”，而是“端口为什么不通”“数据为什么丢了”“两个容器为什么互相找不到”“Compose 启动顺序为什么不对”。

## 1. 网络这部分最少要讲清什么

| 题目 | 核心矛盾 | 首先要答什么 |
| --- | --- | --- |
| 端口映射是什么 | 宿主机和容器端口不是一回事 | `-p 宿主机:容器` |
| 容器怎么互相访问 | 对外访问和容器间访问常被混掉 | 同网络 + 服务名解析 |
| 默认 bridge 和用户自定义 bridge 差别 | 都叫 bridge，但体验不一样 | 用户自定义网络自带更好的服务发现 |
| `host` 模式值不值得用 | 性能和隔离在拉扯 | 共享宿主机网络，隔离弱 |

## 2. 最常见的网络模式

| 模式 | 适合场景 | 关键特点 |
| --- | --- | --- |
| 默认 `bridge` | 单容器实验 | 能端口映射，但多容器体验一般 |
| 用户自定义 `bridge` | 多容器应用 | 自带容器名 DNS 解析，最常用 |
| `host` | 极少数强依赖宿主机网络的场景 | 不做端口映射，直接共享宿主机网络 |
| `none` | 强隔离或特殊调试 | 基本不提供网络能力 |

### 标准结论

- 多容器应用通常优先使用**用户自定义 bridge**
- `host` 模式不是默认优化选项，而是明确知道代价后才用
- 端口映射解决的是宿主机访问容器，不是容器之间的服务发现

## 3. 端口映射和容器通信不要混

```bash
docker run -d --name web -p 8080:80 nginx:1.27
```

这条命令的含义是：

- 容器里应用监听 `80`
- 宿主机开放 `8080`
- 访问宿主机 `8080`，再转发到容器 `80`

它不表示：

- 另一个容器会自动通过 `8080` 访问它
- 容器之间会天然知道彼此名字

容器之间如果要互相访问，关键前提是：

- 在同一个用户自定义网络里
- 使用服务名或容器名做解析

## 4. 多容器服务发现要怎么理解

如果两个容器都在同一个用户自定义网络里，常见做法是直接用服务名通信。

例如：

- `api` 容器访问 `postgres:5432`
- `worker` 容器访问 `redis:6379`

这也是为什么 Compose 环境里更推荐让服务共用一个网络，而不是到处写宿主机 IP。

### 访问宿主机怎么办

在 Docker Desktop 上，容器访问宿主机常用：

```text
host.docker.internal
```

在 Linux 环境里，如果要提供类似体验，常见做法是：

```bash
--add-host=host.docker.internal:host-gateway
```

## 5. 网络排障第一批命令

```bash
docker ps
docker port api
docker inspect api
docker network ls
docker network inspect myapp_default
ss -lntp
curl -v http://127.0.0.1:8080/health
```

如果是容器间互访问题，优先看：

- 两个容器是否真的在同一网络
- 服务名是不是写对了
- 应用监听的是不是 `0.0.0.0` 而不是 `127.0.0.1`

## 6. 数据这部分，先把三种挂载分清

| 方式 | 数据放哪 | 适合场景 | 风险点 |
| --- | --- | --- | --- |
| `bind mount` | 宿主机指定目录 | 本地开发、挂配置、直接看代码文件 | 强依赖宿主机路径和权限 |
| `volume` | Docker 管理目录 | 数据库存储、正式环境持久化 | 需要单独管理备份和清理 |
| `tmpfs` | 内存 | 临时敏感数据、高速缓存 | 容器退出即消失 |

### 最重要的结论

- 本地开发热更新，常用 `bind mount`
- 正式持久化数据，优先考虑 `volume`
- 不要把数据库数据随手写进容器可写层
- `docker rm` 后，卷不一定会自动删除

## 7. `bind mount` 和 `volume` 怎么选

### 适合用 `bind mount` 的场景

- 本地开发挂源码
- 挂宿主机已有配置文件
- 临时排障时需要直接看宿主机目录

### 适合用 `volume` 的场景

- PostgreSQL、MySQL、Redis 这类服务数据目录
- 想让 Docker 帮你管理存储位置
- 想把容器生命周期和数据生命周期解耦

标准口径：

> `bind mount` 更贴近宿主机文件系统，适合开发；`volume` 更贴近 Docker 的持久化模型，适合正式数据。

## 8. 挂载最常见的权限坑

- 容器里的 UID/GID 和宿主机目录所有者不一致
- root 容器把文件写成 root，宿主机普通用户后续难处理
- 团队成员在不同系统上开发，路径和权限模型不完全一致

如果你在 Linux 上遇到“容器里能看见目录但不能写”，优先看：

- 挂载路径是否对
- 宿主机目录权限是否允许
- 容器运行用户是谁

## 9. Compose 适合什么，不适合什么

适合：

- 本地开发环境
- 集成测试环境
- 单机上的简单部署
- 把多容器依赖写成声明式配置

不适合：

- 代替 Kubernetes 做大规模编排
- 多节点调度、自动伸缩、复杂发布治理
- 多机高可用集群管理

## 10. Compose 最小结构怎么写

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - appnet

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: change-me
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - appnet

  redis:
    image: redis:7
    networks:
      - appnet

volumes:
  pgdata:

networks:
  appnet:
```

### 这份 Compose 至少要看懂 5 个点

- `services` 是运行单元
- `networks` 让服务名之间能直接互相访问
- `volumes` 负责持久化数据库数据
- `depends_on` 表达依赖关系，不自动等所有服务真正 ready
- `healthcheck` 能把“启动了”和“可用”拉开

## 11. Compose 常用命令

```bash
docker compose up -d
docker compose up --build -d
docker compose logs -f api
docker compose exec api sh
docker compose ps
docker compose config
docker compose down
docker compose down -v
```

必须注意：

- 现在优先使用 `docker compose`，不是旧的 `docker-compose`
- `docker compose down -v` 会把卷一起删掉，数据库数据可能直接没了

## 12. Compose 最容易踩的坑

- 把 Compose 当成生产集群编排平台
- 以为 `depends_on` 就等于数据库已经 ready
- 开发和生产共用一份 Compose 文件，还带着源码挂载和调试参数
- 把密钥和固定密码直接写进 `compose.yml`

## 13. 运行态最少要守住的规则

- 服务之间尽量走同一用户自定义网络
- 本地开发挂源码，正式数据挂 volume
- 数据库容器不要把数据写进容器层
- Compose 里的依赖顺序要配合 `healthcheck`
- 不要把“能启动”误判成“已经可用”

## 关联资料

- [Docker 专题总览](./index.md)
- [Docker 核心概念与对象模型](./core-concepts.md)
- [Docker 容器生命周期与运行模型](./container-lifecycle-and-runtime.md)
- [Docker 安全与生产实践](./security-and-production-practice.md)
- [容器化与云原生实践](../golang/guide/10-containerization-cloud-native.md)
- [ConfigMap、Secret 与配置注入边界实战](../k8s/configmap-secret-and-config-injection.md)
