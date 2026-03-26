---
title: Docker 排障与日常运维
description: 系统整理 Docker 排障与日常运维方法，覆盖容器秒退、端口不通、网络失败、数据丢失、磁盘爆满、构建变慢、镜像拉取失败与清理命令。
---

# Docker 排障与日常运维

> Docker 排障不要上来就猜。先看容器状态、日志、网络、挂载和资源，再决定往应用、镜像还是宿主机方向继续钻。

## 1. 先会用这些命令

| 命令 | 主要用途 |
| --- | --- |
| `docker ps -a` | 看容器当前和历史状态 |
| `docker logs -f <container>` | 看启动报错和运行日志 |
| `docker inspect <container>` | 看环境变量、挂载、网络、退出码 |
| `docker exec -it <container> sh` | 进容器看现场 |
| `docker stats` | 看 CPU / 内存实时占用 |
| `docker events` | 看创建、停止、重启事件流 |
| `docker system df` | 看磁盘被谁吃掉 |
| `docker image history <image>` | 看镜像层组成 |
| `docker network inspect <network>` | 看网络成员和配置 |

## 2. 容器一启动就退出，先看什么

第一批判断点：

- 主进程是不是直接结束了
- 启动命令是不是写错了
- 配置、环境变量、文件路径是不是缺失
- 程序是不是因为权限、端口占用、依赖连接失败而直接崩了

排查顺序：

```bash
docker ps -a
docker logs <container>
docker inspect <container>
```

重点看：

- `State.ExitCode`
- `State.Error`
- `Config.Cmd`
- `Config.Entrypoint`

## 3. 端口映射后访问不到，先分清是哪一层不通

### 先看 4 个问题

1. 应用是否真的启动成功
2. 应用监听的是不是 `0.0.0.0`
3. 宿主机端口是否真的映射出去
4. 宿主机防火墙或安全组是否拦截

常用命令：

```bash
docker port api
docker logs api
docker inspect api
ss -lntp
curl -v http://127.0.0.1:8080/health
```

一个非常高频的坑是：

- 应用只监听 `127.0.0.1`
- 结果容器内部能访问，宿主机转发进来却不通

## 4. 容器之间互相访问失败，先看网络和服务名

第一批判断点：

- 是否在同一个用户自定义网络里
- 服务名或容器名是否写对
- 应用监听端口是否正确
- 目标服务是否真的 ready

排查命令：

```bash
docker network ls
docker network inspect myapp_default
docker exec -it api sh
```

进容器后再做：

- `ping` 或 `nslookup` 服务名
- `curl` 目标服务健康检查地址

## 5. 数据丢了，先看是不是写在了容器层

这是 Docker 非常典型的误区。

优先检查：

- 有没有挂 volume 或 bind mount
- 数据路径是不是写到了容器可写层
- 执行 `docker compose down -v` 或 `docker system prune --volumes` 时有没有误删

常用命令：

```bash
docker inspect postgres
docker volume ls
docker volume inspect pgdata
```

## 6. 磁盘爆满时，先分清是镜像、卷还是构建缓存

### 第一批命令

```bash
docker system df
docker image ls
docker volume ls
docker builder prune
```

### 常见空间黑洞

- 长期未使用的镜像
- 停止但未删除的容器
- 孤立卷
- BuildKit 构建缓存
- 本地日志和导出 tar 包

### 清理命令

```bash
docker image prune -f
docker container prune -f
docker builder prune -f
docker system prune -f
docker system prune --volumes -f
```

必须强调：

- `docker system prune --volumes` 很危险
- 执行前一定确认卷里没有业务数据

## 7. 构建突然变慢，优先看缓存有没有失效

高频原因：

- `COPY . .` 太早，导致任何源码变动都让后面大层失效
- `.dockerignore` 没配好，构建上下文太大
- 依赖下载和源码复制没有分层
- 基础镜像过大，且频繁拉取

排查建议：

```bash
docker build --progress=plain -t app:test .
```

重点观察：

- 哪一层开始不走缓存
- 是否反复重新下载依赖
- 构建上下文大小是否异常

## 8. 镜像拉取失败，先看名字、权限和网络

第一批判断点：

- 镜像地址和 tag 是否正确
- 是否登录了私有仓库
- 仓库证书和网络是否正常
- 平台架构是否匹配

常见现象：

- `pull access denied`
- `manifest unknown`
- `x509: certificate signed by unknown authority`
- `no matching manifest for linux/arm64`

## 9. 权限问题通常不是应用 bug

高频场景：

- 挂载目录后容器里写不进去
- 宿主机上出现 root 拥有的脏文件
- 非 root 容器启动时读不到配置文件

优先看：

- 容器运行用户是谁
- 宿主机目录权限是否允许
- 挂载路径是否正确

## 10. 优雅退出和信号处理别忽略

如果容器 stop 时应用没有正确处理 `SIGTERM`，会出现：

- 请求直接中断
- 文件或缓冲没有正确落盘
- 连接没有正确释放

排查这类问题时，先区分：

- 是 Docker stop 太快
- 还是应用没有实现优雅关闭

如果你想把 PID 1、信号转发、`docker stop` / `docker kill`、退出码和重启循环系统理一遍，单独看：

- [Docker 容器生命周期与运行模型](./container-lifecycle-and-runtime.md)

## 11. 一个通用排障顺序

1. 先看 `docker ps -a`，确认容器到底是没起、起了又退，还是一直在跑
2. 再看 `docker logs`，确认是应用报错、配置缺失，还是依赖不可达
3. 再看 `docker inspect`，把命令、环境变量、网络、挂载和退出码对齐
4. 如果是网络问题，再看 `docker network inspect` 和端口监听
5. 如果是数据问题，再看 volume 和挂载路径
6. 如果是磁盘或构建问题，再看 `docker system df` 和构建缓存

## 12. 日常运维最常用命令

```bash
docker ps
docker ps -a
docker logs -f app
docker exec -it app sh
docker inspect app
docker stats
docker system df
docker compose ps
docker compose logs -f
```

## 关联资料

- [Docker 专题总览](./index.md)
- [Docker 容器生命周期与运行模型](./container-lifecycle-and-runtime.md)
- [Docker 网络、存储与 Compose 实战](./network-storage-and-compose.md)
- [Docker Compose 部署实践](./compose-deployment-practice.md)
- [Docker 安全与生产实践](./security-and-production-practice.md)
- [Linux 运维实战：磁盘清理与进程管理](../ops/linux-disk-cleanup.md)
