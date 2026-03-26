---
title: Dockerfile 与镜像构建实践
description: 系统整理 Dockerfile 与镜像构建实践，覆盖指令语义、缓存命中、.dockerignore、多阶段构建、基础镜像选择、tag 与 digest、BuildKit 与多架构构建。
---

# Dockerfile 与镜像构建实践

> Docker 真正拉开工程差距的地方，不在 `docker run`，而在镜像能不能稳定构建、体积能不能控住、发布能不能回滚、缓存能不能命中。

## 构建主线总览

| 问题 | 核心矛盾 | 首先要答什么 |
| --- | --- | --- |
| Dockerfile 要怎么设计 | 能构建不代表可维护 | 分层、缓存、最小化、非 root |
| 为什么构建这么慢 | 每次都重下依赖、重跑大步骤 | 缓存层失效和上下文过大 |
| 多阶段构建解决什么问题 | 工具链和运行环境混在一起 | 编译阶段与运行阶段分离 |
| `ENTRYPOINT` 和 `CMD` 区别是什么 | 容易写对，但不一定讲得清 | 主命令 vs 默认参数 |
| `ARG` 和 `ENV` 区别是什么 | 都像“变量”，但生命周期不同 | 构建时参数 vs 运行时环境 |
| tag 和 digest 怎么用 | `latest` 好记但不稳定 | tag 可读，digest 可确定 |

## 1. 一份靠谱 Dockerfile 至少要做到这些事

- 基础镜像明确，不滥用 `latest`
- 依赖安装层和源码变更层拆开，让缓存能命中
- `.dockerignore` 控制构建上下文体积
- 构建工具链不进入最终运行镜像
- 运行时使用非 root 用户
- 配置和密钥走运行时注入，不写死进镜像

## 2. 常用 Dockerfile 指令怎么理解

| 指令 | 作用 | 高频追问 |
| --- | --- | --- |
| `FROM` | 指定基础镜像 | 为什么要 pin 版本甚至 digest |
| `WORKDIR` | 设置工作目录 | 避免全程使用长路径 |
| `COPY` | 复制文件到镜像 | 为什么通常优先于 `ADD` |
| `RUN` | 构建阶段执行命令 | 会生成镜像层 |
| `ARG` | 构建时变量 | 为什么它不等于运行时环境变量 |
| `ENV` | 默认环境变量 | 为什么不适合存密钥 |
| `EXPOSE` | 声明容器监听端口 | 只是元数据，不自动对外开放 |
| `ENTRYPOINT` | 固定入口命令 | 更适合定义主程序 |
| `CMD` | 默认参数或默认命令 | 更容易被 `docker run` 覆盖 |
| `USER` | 指定运行用户 | 为什么生产应避免 root |
| `HEALTHCHECK` | 定义健康检查 | 适合平台探测，不要做重型检查 |

### `COPY` 和 `ADD` 的边界

通常优先使用 `COPY`，因为它更直接、更可控。

只有在你明确需要下面这些行为时，再考虑 `ADD`：

- 自动解压本地压缩包
- 从 URL 拉远程文件

但工程上通常仍建议把这些动作显式写进 `RUN`，可读性和可控性更高。

## 3. `ENTRYPOINT`、`CMD`、`ARG`、`ENV` 最容易答错

### `ENTRYPOINT` 和 `CMD`

可以这样记：

- `ENTRYPOINT` 更像“主程序”
- `CMD` 更像“默认参数”

示例：

```dockerfile
ENTRYPOINT ["python", "app.py"]
CMD ["--port", "8080"]
```

这时执行：

```bash
docker run myapp --port 9090
```

实际效果相当于：

```bash
python app.py --port 9090
```

### `ARG` 和 `ENV`

| 项目 | `ARG` | `ENV` |
| --- | --- | --- |
| 主要作用阶段 | 构建时 | 运行时 |
| 是否适合传版本参数 | 适合 | 一般不是首选 |
| 是否适合存密钥 | 不适合 | 也不适合写死在镜像里 |

一句话结论：

> `ARG` 更像构建参数，`ENV` 更像运行默认值。两者都不该被拿来硬编码敏感信息。

## 4. 缓存为什么总是失效

Docker 构建缓存按层生效，所以指令顺序很重要。

最经典的优化方式，是把“变得慢、但改动少”的内容放前面，把“改动频繁”的内容放后面。

以 Go 项目为例：

```dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /out/app ./cmd/server
```

这段写法的关键不是 Go，而是：

- 先复制依赖清单
- 先下载依赖
- 最后再复制源码

这样做的结果是：

- 改代码，不会导致依赖下载层失效
- 依赖不变时，构建速度会明显更快

## 5. `.dockerignore` 不是可有可无

如果不控制构建上下文，下面这些东西可能都被带进构建过程：

- `.git`
- 本地日志
- `node_modules`
- 临时文件
- 测试产物
- `.env`

一个常见示例：

```txt
.git
.DS_Store
node_modules
dist
tmp
coverage
.env
*.log
```

必须记住：

- 构建上下文越大，传给 daemon 的内容越多
- 不必要的大目录会拖慢构建
- `.env`、密钥、证书这类文件进上下文本身就有风险

## 6. 多阶段构建为什么重要

多阶段构建解决的核心问题是：

- 编译工具链和运行环境分离
- 最终镜像尽量小
- 攻击面更小
- 发布制品更纯净

### 示例：多阶段构建

```dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /out/app ./cmd/server

FROM gcr.io/distroless/static-debian12

WORKDIR /app
COPY --from=builder /out/app /app/app

USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/app"]
```

这个例子至少表达了 5 个点：

- 编译工具链只存在于 builder 阶段
- 最终镜像只保留可执行文件
- 运行时用户不是 root
- Dockerfile 的缓存层仍然能工作
- 发布制品更接近“单一职责”

## 7. 基础镜像怎么选

| 镜像类型 | 优点 | 风险或代价 | 适合场景 |
| --- | --- | --- | --- |
| `alpine` | 体积小，带包管理器 | 某些依赖兼容性需注意 | 需要轻量又要一定可调试性 |
| `distroless` | 更小、更干净、攻击面低 | 没有常规 shell 和工具 | 生产默认选择常见 |
| `scratch` | 最小化到极致 | 完全没有系统工具 | 静态编译二进制程序 |
| 语言官方基础镜像 | 上手快 | 体积通常偏大 | 构建阶段或开发环境 |

标准口径：

> 构建阶段可以用语言官方镜像，运行阶段最好切到更小、更干净的镜像，比如 distroless 或 scratch。重点不是“越小越好”，而是“足够小且可维护”。

## 8. tag、digest 与镜像发布

### 为什么不能只用 `latest`

- `latest` 不表达真实版本
- 回滚时很难确认到底回的是哪一版
- 多环境部署时容易出现“名字一样，内容不一样”

更稳的做法：

- 语义版本：`1.4.2`
- Git 提交：`main-3f2a1c`
- 必要时直接用 digest：`@sha256:...`

### tag 和 digest 的区别

| 项目 | tag | digest |
| --- | --- | --- |
| 可读性 | 高 | 低 |
| 是否稳定指向同一内容 | 不一定 | 一定 |
| 适合场景 | 日常发布、人工识别 | 强确定性部署、锁定镜像 |

这里先把构建语义讲清，但要注意：

- 这页解决的是“镜像怎么构建出来”
- 私有仓库、Harbor、tag 不可变、Robot Account 和离线分发，属于仓库治理问题

## 9. BuildKit、buildx 和多架构构建

现在很多环境同时存在 `amd64` 和 `arm64`，至少要知道：

- `buildx` 支持多平台构建
- BuildKit 改善缓存体验和构建性能
- 多架构镜像要确认基础镜像本身也支持对应平台

一个典型命令是：

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t registry.example.com/team/app:1.0 --push .
```

## 10. 最常见的反模式

- 一上来就 `COPY . .`
- 把构建工具链直接带进最终生产镜像
- 用 root 用户运行服务
- 把 `.env`、证书、密钥直接打进镜像
- 构建用 `latest`，部署也用 `latest`
- 把调试工具、测试文件、源码仓库元数据一起带进生产制品

## 11. 最小可用构建清单

- Dockerfile 分层清楚
- `.dockerignore` 已配置
- 依赖层能缓存
- 运行镜像非 root
- 密钥不进镜像
- tag 策略可回滚
- 需要多平台时已验证 buildx 和基础镜像支持情况

## 关联资料

- [Docker 专题总览](./index.md)
- [Docker 核心概念与对象模型](./core-concepts.md)
- [Docker 镜像仓库、Harbor 与发布治理](./registry-and-image-governance.md)
- [Docker 网络、存储与 Compose 实战](./network-storage-and-compose.md)
- [容器化与云原生实践](../golang/guide/10-containerization-cloud-native.md)
- [镜像安全、镜像准入与供应链边界实战](../k8s/image-security-and-supply-chain-governance.md)
