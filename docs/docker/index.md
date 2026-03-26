---
title: Docker 专题
description: 系统整理 Docker 必备知识，覆盖容器原理、镜像构建、镜像仓库与 Harbor、容器生命周期、网络、存储、Compose、安全与排障。
---

# Docker 专题

这个专题把 Docker 从“会跑一个容器”提升到“能解释对象模型、能写 Dockerfile、能处理网络和数据、能把镜像安全交付、能定位常见问题”的层面。重点不是堆命令，而是先建立统一框架，再按构建、运行、交付和运维逐层展开。

## 适合谁看

- 正在把后端服务、脚本任务或本地开发环境迁移到容器里的工程师
- 已经会基本命令，但对镜像层、容器网络、卷、Compose 理解还比较零散
- 需要接私有仓库、CI/CD、镜像安全扫描或 K8s 交付链路的开发和运维
- 面试里经常被追问 Docker 和虚拟机、镜像和容器、volume 和 bind mount，但回答不成体系

## 你会得到什么

- 一套关于镜像、容器、仓库、网络、卷、Compose 的统一对象模型
- 一条从 Dockerfile、多阶段构建到镜像发布的构建主线
- 一套关于 tag、digest、Harbor、版本晋级和离线分发的仓库治理基线
- 一套关于 PID 1、信号、健康检查、重启策略和优雅退出的运行模型
- 一组关于网络、持久化、服务发现、多容器协作的工程实践模板
- 一套适合单机和中小系统的 Compose 部署基线
- 一份偏生产视角的安全、资源限制、配置注入和运行清单
- 一套常见故障的排查起手式，避免每次出问题都从零试错
- 一份适合面试和阶段复盘的高频自检题清单

## 内容结构

### 一、全局认知

> 先把 Docker 到底是什么、解决什么问题、底层依赖什么机制讲清楚。

| 文档 | 覆盖内容 |
| --- | --- |
| [Docker 核心概念与对象模型](./core-concepts.md) | Docker 解决什么问题、Image / Container / Registry / Compose 是什么、容器和虚拟机差别、`namespace` / `cgroup` / 分层文件系统、`save/load` 与 `export/import` |

### 二、构建与镜像

> 这层解决“怎么把应用打成一个可维护、可复用、可发布的镜像”。

| 文档 | 覆盖内容 |
| --- | --- |
| [Dockerfile 与镜像构建实践](./dockerfile-and-image-build.md) | Dockerfile 指令、缓存命中、`.dockerignore`、多阶段构建、基础镜像选择、tag / digest、BuildKit / buildx、多架构构建 |

### 三、仓库与发布治理

> 这层解决“镜像放哪、谁能推拉、tag 和 digest 怎么定、怎么回滚和离线分发”。

| 文档 | 覆盖内容 |
| --- | --- |
| [Docker 镜像仓库、Harbor 与发布治理](./registry-and-image-governance.md) | registry / repository / tag / digest、Docker Hub 与私有仓库、Harbor、Robot Account、tag 不可变、版本晋级、离线分发、保留与清理 |

### 四、运行与数据

> 这层解决“容器为什么会活着、怎么体面退出、容器之间怎么通信，数据怎么持久化，多服务怎么一起跑”。

| 文档 | 覆盖内容 |
| --- | --- |
| [Docker 容器生命周期与运行模型](./container-lifecycle-and-runtime.md) | 容器状态、PID 1、`ENTRYPOINT` / `CMD`、`docker stop` / `docker kill`、重启策略、健康检查、OOM、优雅退出 |
| [Docker 网络、存储与 Compose 实战](./network-storage-and-compose.md) | bridge / host / none、端口映射、容器 DNS、bind mount / volume / tmpfs、Compose 结构、`depends_on`、`healthcheck`、本地联调模式 |

### 五、交付与部署

> 这层解决“怎么把 Compose 从本地联调推进到单机稳定部署”。 

| 文档 | 覆盖内容 |
| --- | --- |
| [Docker Compose 部署实践](./compose-deployment-practice.md) | 单机部署边界、目录结构、反向代理、环境变量、数据卷、发布升级、回滚、备份与运维基线 |

### 六、安全与运维

> 这层解决“怎么让容器更安全、更稳定、更容易上线和排障”。

| 文档 | 覆盖内容 |
| --- | --- |
| [Docker 安全与生产实践](./security-and-production-practice.md) | 非 root、最小权限、密钥注入、镜像治理、资源限制、日志输出、重启策略、生产基线 |
| [Docker 排障与日常运维](./troubleshooting-and-operations.md) | `logs` / `inspect` / `stats` / `events`、端口不通、容器秒退、网络失败、数据丢失、磁盘爆满、构建变慢、镜像拉取失败 |

### 七、能力自检

> 这层解决“会不会答、能不能讲清、有没有形成稳定口径”。

| 文档 | 覆盖内容 |
| --- | --- |
| [Docker 高频问题与自检清单](./interview-questions.md) | 从对象模型、镜像构建、仓库治理、生命周期、网络、存储、Compose 到安全、排障的高频问题与回答主线 |

## 推荐实践项目

### 1. 单服务容器化

目标：

- 给一个 Web 服务写出可维护的 Dockerfile
- 做到依赖缓存、多阶段构建、非 root 运行
- 能解释镜像体积和层变化来自哪里

### 2. Compose 本地开发环境

目标：

- 用 Compose 拉起 `api + postgres + redis`
- 配好具名卷、用户自定义网络和 `healthcheck`
- 能解释 `depends_on` 和真正 ready 之间的差别

### 3. 容器运行与优雅退出

目标：

- 写清楚镜像入口命令，避免容器一启动就退出
- 区分 `docker stop`、`docker kill`、`restart` 和 `healthcheck`
- 让服务在收到 `SIGTERM` 时能正确收尾

### 4. 镜像交付链路

目标：

- 完成 build、tag、push、pull、版本晋级和回滚
- 设计一套 tag 规则：语义版本 + Git SHA + 稳定发布标识
- 让生产发布最终能定位到具体 digest

## 建议阅读顺序

1. 先看 [Docker 核心概念与对象模型](./core-concepts.md)，把对象模型和底层机制搭起来
2. 再看 [Dockerfile 与镜像构建实践](./dockerfile-and-image-build.md)，把构建和发布主线讲清
3. 接着读 [Docker 镜像仓库、Harbor 与发布治理](./registry-and-image-governance.md)，把 tag、digest、私有仓库和离线分发理顺
4. 再读 [Docker 容器生命周期与运行模型](./container-lifecycle-and-runtime.md)，把 PID 1、信号、退出码和重启逻辑理顺
5. 然后读 [Docker 网络、存储与 Compose 实战](./network-storage-and-compose.md)，把运行态和多容器协作补齐
6. 再读 [Docker Compose 部署实践](./compose-deployment-practice.md)，把单机部署的目录结构、反向代理、备份和回滚串起来
7. 再读 [Docker 安全与生产实践](./security-and-production-practice.md)，补生产标准和安全边界
8. 把 [Docker 排障与日常运维](./troubleshooting-and-operations.md) 当成速查手册反复用
9. 最后用 [Docker 高频问题与自检清单](./interview-questions.md) 压缩成自己的答题口径

## 关联资料

- [容器化与云原生实践](../golang/guide/10-containerization-cloud-native.md)
- [K8s 专题](../k8s/)
- [镜像安全、镜像准入与供应链边界实战](../k8s/image-security-and-supply-chain-governance.md)
- [内网离线集群搭建操作指南](../k8s/offline-cluster-setup-guide.md)
- [ConfigMap、Secret 与配置注入边界实战](../k8s/configmap-secret-and-config-injection.md)
- [Linux 运维实战：磁盘清理与进程管理](../ops/linux-disk-cleanup.md)
