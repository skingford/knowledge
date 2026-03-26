---
title: Docker 容器生命周期与运行模型
description: 系统整理 Docker 容器生命周期与运行模型，覆盖容器状态、PID 1、ENTRYPOINT / CMD、stop / kill、重启策略、健康检查、OOM 与优雅退出。
---

# Docker 容器生命周期与运行模型

> 很多人会 `docker run -d`，但一到“为什么容器一启动就退出”“为什么 stop 后请求直接断了”“为什么健康检查过了服务还是不可用”就开始混。真正需要补齐的是容器到底靠谁活着、怎么退出、谁来收信号、谁负责重启。

## 1. 先回答：容器为什么会活着，为什么会退出

| 问题 | 核心矛盾 | 先答什么 |
| --- | --- | --- |
| 容器为什么能一直运行 | 很多人把容器当成“轻量虚拟机” | 容器是否存活，取决于主进程是否还活着 |
| 为什么容器一启动就退出 | 镜像在，容器却没了 | 主进程执行完就退出，容器通常也随之结束 |
| `docker stop` 和 `docker kill` 有什么区别 | 都能停，但代价不同 | 前者先给信号，后者更强硬 |
| 健康检查和重启策略解决什么 | 经常被当成同一件事 | 一个回答“健康不健康”，一个回答“挂了要不要拉起” |

先记住一句话：

> 容器不是靠“后台守护模式”活着，而是靠 PID 1 对应的主进程活着。主进程退了，容器通常就退了。

## 2. 容器状态主线

Docker 里最常见的状态可以先按下面理解：

| 状态 | 含义 | 高频场景 |
| --- | --- | --- |
| `created` | 容器对象已创建，但主进程还没真正跑起来 | `docker create` 后未启动 |
| `running` | 主进程正在运行 | 正常服务中 |
| `paused` | 进程被冻结，不继续执行 | 调试或特殊暂停 |
| `restarting` | 在重启策略作用下反复拉起 | 崩溃重启、配置错误 |
| `exited` | 主进程已退出 | 任务执行完成、启动失败、被停止 |
| `dead` | 容器进入异常不可用状态 | 少见，多数是异常收尾问题 |

最常用的观察命令：

```bash
docker ps
docker ps -a
docker inspect app
docker events
```

重点看：

- `State.Status`
- `State.Running`
- `State.ExitCode`
- `State.OOMKilled`
- `State.FinishedAt`

## 3. PID 1 才是容器生命周期的核心

在容器里，最关键的不是“有没有进程”，而是“谁是 PID 1”。

为什么 PID 1 特别重要：

- 它决定容器是否继续存活
- 它是默认接收终止信号的主对象
- 它还可能承担回收子进程的责任

一个典型例子：

```bash
docker run --name one-shot alpine:3.22 echo hello
```

这类容器很快就退出，不是 Docker 有问题，而是：

- `echo hello` 执行完了
- 主进程结束了
- 容器生命周期自然结束

必须记住：

- 容器不是“里面随便跑几个后台进程就行”
- 如果入口脚本自己没把前台主进程顶上来，容器也可能提前结束
- 如果应用不善于做 PID 1，信号转发和子进程回收都可能出问题

### `--init` 为什么有时很有用

有些应用本身不擅长当 PID 1，这时可以考虑：

```bash
docker run --init myapp:1.0
```

它的价值通常在于：

- 更好地转发信号
- 回收僵尸子进程

## 4. `ENTRYPOINT` 和 `CMD` 会直接影响运行模型

容器启动时，真正执行什么命令，取决于镜像里的 `ENTRYPOINT` 和 `CMD`。

一个更稳的写法是 exec form：

```dockerfile
ENTRYPOINT ["/app/server"]
CMD ["--port", "8080"]
```

为什么更推荐这种形式：

- 参数边界更清楚
- 信号更容易直接发给主进程
- 不容易被额外 shell 包一层

相比之下，下面这种 shell form 更容易埋坑：

```dockerfile
ENTRYPOINT /app/server --port 8080
```

高频问题在于：

- shell 可能变成 PID 1
- 信号不一定准确转发给真正业务进程

### 入口脚本最容易出错的地方

如果你确实需要脚本做启动前准备，最后要记得把主进程 `exec` 出去：

```sh
#!/bin/sh
set -eu

./migrate.sh
exec /app/server "$@"
```

如果忘了 `exec`，常见后果是：

- shell 留在 PID 1
- 主进程拿不到预期信号
- 停止和重启行为变得不稳定

## 5. `run`、`start`、`stop`、`kill`、`restart`、`rm` 怎么串起来

| 命令 | 作用 | 典型误区 |
| --- | --- | --- |
| `docker run` | 创建并启动一个新容器 | 以为只是“启动” |
| `docker start` | 启动一个已存在的停止容器 | 以为会重新创建容器 |
| `docker stop` | 请求容器优雅停止 | 以为和 `kill` 没区别 |
| `docker kill` | 强制发信号终止容器 | 默认更粗暴，不适合正常发布 |
| `docker restart` | stop 再 start | 以为能修复所有崩溃根因 |
| `docker rm` | 删除容器对象 | 不等于自动删除卷数据 |

一条常见操作主线：

```bash
docker run -d --name app myapp:1.0
docker logs -f app
docker stop app
docker start app
docker rm -f app
```

## 6. `docker stop` 和 `docker kill` 最大的差别在信号

默认可以这样理解：

- `docker stop`：先发 `SIGTERM`，给应用一个优雅退出窗口；超时后再发 `SIGKILL`
- `docker kill`：默认直接发更强硬的终止信号

这就是为什么正式发布、滚动重启或人工维护时，通常优先 `stop`。

### 为什么优雅退出重要

如果应用没有正确处理终止信号，常见后果是：

- 正在处理的请求直接中断
- 数据或缓冲没有及时落盘
- 数据库连接、消息消费、文件句柄没有收干净

Compose 场景里，也可以显式控制宽限时间：

```yaml
services:
  api:
    stop_grace_period: 30s
```

标准口径：

> `docker stop` 解决的是“尽量体面地停”，不是“保证服务一定没损失”。真正能不能体面退出，还取决于应用本身是否实现了信号处理。

## 7. 重启策略和健康检查不要混成一回事

### 重启策略回答的是：挂了以后要不要拉起来

常见策略：

- `no`
- `on-failure`
- `unless-stopped`
- `always`

最容易答错的点：

- 重启策略不能替代根因修复
- `always` 不等于服务就健康
- 只是“进程活着”也不等于业务已经可用

### 健康检查回答的是：它现在看起来健康吗

健康检查适合回答：

- 基本 HTTP 健康端点是否可达
- 进程是否仍然正常工作

不适合默认每次都做：

- 重型 SQL
- 全链路依赖探测
- 高频外部调用

Compose 里 `depends_on` 配合 `healthcheck` 时，要理解它只是把“已启动”和“基础可用”拉开，不是完整的业务 ready 证明。

## 8. 退出码、OOM 和重启循环要会看

容器退出时，至少要会先看三个点：

- `ExitCode`
- `OOMKilled`
- 是否进入 `restarting`

高频判断思路：

| 现象 | 常见解释 |
| --- | --- |
| `ExitCode=0` | 主进程正常结束，常见于一次性任务或命令执行完 |
| `ExitCode=1` | 应用自己报错退出 |
| `ExitCode=137` | 常见于被强制杀掉或 OOM 后终止 |
| `ExitCode=143` | 常见于收到终止信号后退出 |

排查命令：

```bash
docker inspect app
docker logs app
docker stats
```

必须警惕：

- 重启循环不等于“自动恢复成功”
- 很多时候只是配置错误被无限重试
- OOM 问题如果不加资源边界和应用侧优化，重启只会反复放大故障

## 9. 前台、后台和“伪存活”容器要分清

`-d` 只是让容器以 detached 模式运行，不改变生命周期规则。

也就是说：

- `docker run -d app:1.0` 不是“让容器永久后台托管”
- 它只是让客户端不挂在前台
- 主进程一旦退出，容器照样结束

这也是为什么下面这些写法通常是反模式：

```bash
tail -f /dev/null
sleep infinity
```

它们的问题不是“完全不能用”，而是：

- 把容器变成了空壳
- 掩盖真正的入口命令问题
- 排障时很难判断业务到底是不是正常运行

## 10. 生命周期问题的第一批排查命令

```bash
docker ps -a
docker logs app
docker inspect app
docker top app
docker exec -it app sh
docker wait app
docker events
```

优先看这些线索：

- 谁是入口命令
- 它是不是前台主进程
- 收到 stop 后有没有及时退出
- 是应用崩溃、信号问题、OOM，还是重启策略在遮住症状

## 11. 最常见的反模式

- 把容器当成轻量虚拟机，靠手工进容器修问题
- 用 shell form `ENTRYPOINT`，让真正业务进程拿不到信号
- 启动脚本最后不 `exec`
- 用 `tail -f /dev/null` 硬撑容器存活
- 没有优雅退出逻辑，却以为 `docker stop` 足够安全
- 把 `healthcheck` 做成重型链路探测
- 用重启策略掩盖配置错误或 OOM 根因

## 12. 一个最小可用的生命周期清单

- 知道容器靠 PID 1 存活
- `ENTRYPOINT` / `CMD` 关系清楚
- 入口脚本最终会 `exec` 主进程
- 应用能处理终止信号
- 重启策略按场景显式配置
- 健康检查只做轻量、稳定的检查
- 出现退出时能先看 `ExitCode`、`OOMKilled` 和日志

## 关联资料

- [Docker 专题总览](./index.md)
- [Docker 核心概念与对象模型](./core-concepts.md)
- [Dockerfile 与镜像构建实践](./dockerfile-and-image-build.md)
- [Docker 网络、存储与 Compose 实战](./network-storage-and-compose.md)
- [Docker Compose 部署实践](./compose-deployment-practice.md)
- [Docker 安全与生产实践](./security-and-production-practice.md)
- [Docker 排障与日常运维](./troubleshooting-and-operations.md)
