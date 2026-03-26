---
title: Docker 镜像仓库、Harbor 与发布治理
description: 系统整理 Docker 镜像仓库、Harbor 与发布治理，覆盖 registry / repository / tag / digest、推拉流程、私有仓库、版本策略、离线分发与日常治理。
---

# Docker 镜像仓库、Harbor 与发布治理

> 会 `docker build` 还不够。团队真正容易翻车的地方，通常在镜像放哪、谁能推拉、tag 怎么定、生产拉的是不是那份扫过的镜像，以及内网环境到底怎么分发。

## 1. 先把对象模型说清

| 概念 | 作用 | 例子 |
| --- | --- | --- |
| Registry | 提供镜像存储和分发的服务 | `docker.io`、`ghcr.io`、`registry.example.com` |
| Repository | Registry 里的某个镜像命名空间 | `backend/api` |
| Tag | 人类可读的版本别名 | `1.4.2`、`main-3f2a1c` |
| Digest | 镜像内容哈希，指向固定内容 | `sha256:...` |
| Manifest | 描述镜像层、配置和平台信息的元数据 | 单架构 manifest、多架构 manifest list |

一个完整的镜像引用，常见有两种写法：

- `registry.example.com/backend/api:1.4.2`
- `registry.example.com/backend/api@sha256:...`

必须记住：

- tag 好读，但可以漂移
- digest 不好读，但能稳定指向同一份内容
- 生产交付里，真正回答“到底部署的是哪一份镜像”的，通常不是 tag，而是 digest

## 2. 公有仓库、私有仓库和 Harbor 分别解决什么

| 方案 | 优点 | 风险或限制 | 适合场景 |
| --- | --- | --- | --- |
| Docker Hub / GHCR 等公有仓库 | 开箱即用，生态丰富 | 对内网、权限、配额、治理能力控制有限 | 开源项目、个人实验、小团队初期 |
| 自建 Registry | 轻量、可控、部署简单 | 只有“存和取”，治理能力比较基础 | 内部最小可用仓库 |
| Harbor | 除了存取，还带项目隔离、Robot Account、扫描、复制、保留策略、GC | 维护成本更高 | 团队级或生产级镜像治理 |

一个稳定说法是：

> Harbor 不是一种新的镜像格式，而是在私有仓库基础上，把权限、扫描、复制、保留和发布治理补齐。

## 3. 一条最基本的镜像发布主线

```bash
docker login registry.example.com

docker build -t api:1.4.2 .
docker tag api:1.4.2 registry.example.com/backend/api:1.4.2
docker push registry.example.com/backend/api:1.4.2

docker pull registry.example.com/backend/api:1.4.2
docker inspect --format='{{index .RepoDigests 0}}' registry.example.com/backend/api:1.4.2
```

这条主线的重点不是命令本身，而是：

- 本地构建出的镜像，要重新打上完整仓库地址再推送
- pull 回来时，tag 只是入口，真正可用于强确定性部署的是 digest
- CI/CD 最终需要沉淀出“这次发布对应哪个 digest”

## 4. tag、digest 和版本命名要怎么管

### 为什么不能只靠 `latest`

- `latest` 不表达真实版本
- 回滚时无法确认到底回哪一版
- 不同环境可能出现同名不同内容

### 一套更稳的 tag 规则

至少建议同时具备两类 tag：

- 语义版本：`1.4.2`
- 构建来源：`main-3f2a1c`

如果流程再严谨一点，可以再加：

- 发布标记：`prod-20260326-3f2a1c`
- 长期维护线：`1.4`

推荐原则：

- 可读 tag 给人看
- digest 给系统锁定
- 发布 tag 尽量不可变
- 回滚记录最终要能落到具体 digest

### Compose 或生产部署里怎么写更稳

对关键版本，可以直接引用 digest：

```yaml
services:
  api:
    image: registry.example.com/backend/api@sha256:0123456789abcdef...
```

标准口径：

> tag 负责表达版本语义，digest 负责表达内容确定性。越接近正式发布，越应该往不可变引用收口。

## 5. Harbor 上最值得落地的治理动作

很多团队装了 Harbor，但只把它当“公司版 Docker Hub”来用，治理价值其实没吃满。

至少值得落地下面这些动作：

| 动作 | 为什么重要 |
| --- | --- |
| 按团队或系统拆 Project | 避免所有镜像堆在一个平面里，权限和配额难管 |
| CI 使用 Robot Account | 不要把管理员账号塞进流水线 |
| 生产 tag 开启不可变策略 | 防止同一个发布 tag 被重新覆盖 |
| 开启漏洞扫描 | 让基础镜像和依赖更新纳入治理 |
| 配保留策略与垃圾回收 | 否则仓库会越堆越大 |
| 跨环境复制或同步 | 内外网、多机房或多地域更容易做分发 |

必须记住：

- Harbor 的治理重点是项目、权限、策略和分发，不只是 Web UI
- CI 账号和运行时拉取账号最好分开
- 删除 tag 不等于立刻回收底层存储，通常还需要垃圾回收

## 6. 发布和版本晋级怎么做更稳

一个更稳的主线是：

1. 流水线只构建一次，产出带 Git SHA 的镜像
2. 对这份镜像做测试、扫描、必要时做签名或 attestation
3. 确认通过后，再补语义版本 tag 或发布 tag
4. 部署时优先记录 digest，而不是只记一个可变 tag
5. 回滚时回到上一个稳定 digest 或不可变发布 tag

为什么强调“build once”：

- 同一版代码在 dev、test、prod 分别重建，最终内容可能并不完全一样
- 如果测试通过的是 A，生产重新 build 出来的是 B，发布链路就断了

更稳的原则是：

> 同一份产物在不同环境里做的是晋级，不是重建。你移动的是引用，不是重新造一份“看起来一样”的镜像。

## 7. 内网和离线环境怎么分发

短期离线分发，最常见的是 `save / load`：

```bash
docker pull registry.example.com/backend/api:1.4.2
docker save registry.example.com/backend/api:1.4.2 -o api-1.4.2.tar

docker load -i api-1.4.2.tar
docker tag registry.example.com/backend/api:1.4.2 harbor.internal/backend/api:1.4.2
docker push harbor.internal/backend/api:1.4.2
```

适合场景：

- 一次性把镜像送进内网
- 无法直接访问公网 registry
- 临时交付给测试或隔离环境

不适合长期依赖的方式：

- 每次上线都靠手工拷 tar 包
- 没有校验、没有命名规范、没有回滚记录

更长期的方案通常是：

- 在内网部署 Harbor 或私有 registry
- 外网先拉取并校验，再同步到内网仓库
- 内网所有机器统一从内部仓库拉取

必须区分：

- `docker save/load` 迁的是镜像
- `docker export/import` 更像容器文件系统快照

## 8. 仓库凭证和供应链边界怎么守

仓库账号和 token 本身就是高敏感信息。

至少要做到：

- 不把 registry 密码写进 Dockerfile
- 不把仓库凭证明文写进 `compose.yml`
- CI 凭证走 Secret 管理
- 运行节点只拿最小化的拉取权限
- 仓库访问走 TLS，证书链明确可管理

还要知道：

- `docker login` 的信息通常会进入 `~/.docker/config.json`
- 更稳的做法是使用 credential helper 或 CI 的临时凭证
- “用了私有仓库”不等于“供应链安全就解决了”

生产里常见还会继续做：

- 漏洞扫描
- SBOM 产出
- 镜像签名
- 准入校验

## 9. 日常清理和运维别等磁盘打满再做

仓库治理除了发布，还包括回收。

至少要有下面这些意识：

- 哪些 tag 是长期保留的
- 哪些分支构建只保留最近 N 份
- 删除镜像后是否需要执行垃圾回收
- 是否要按项目做容量配额

高频故障现象通常有这些：

- `pull access denied`
- `manifest unknown`
- `x509: certificate signed by unknown authority`
- 多架构场景下的 `no matching manifest`

第一批排查点：

- 镜像名、tag 或 digest 是否写对
- 当前机器是否已登录对应仓库
- Harbor / registry 证书是否被节点信任
- 基础镜像或目标镜像是否支持当前架构

## 10. 最常见的反模式

- 所有环境都只用 `latest`
- CI 直接用管理员账号推镜像
- 生产只记 tag，不记 digest
- 外网和内网环境长期靠人工传 tar 包
- 删除 tag 后以为磁盘会自动回收
- 测试通过的是一个 tag，生产却重新 build 另一份内容

## 11. 一个最小可用的仓库治理清单

- 仓库命名规则统一
- tag 策略能表达版本和构建来源
- 关键发布可落到不可变 tag 或 digest
- 推送权限和拉取权限分离
- 仓库凭证走 Secret 管理
- 已配置扫描、保留策略或清理流程
- 内网环境有稳定的同步或离线分发路径
- 回滚时能明确定位到上一份稳定镜像

## 关联资料

- [Docker 专题总览](./index.md)
- [Dockerfile 与镜像构建实践](./dockerfile-and-image-build.md)
- [Docker Compose 部署实践](./compose-deployment-practice.md)
- [Docker 安全与生产实践](./security-and-production-practice.md)
- [镜像安全、镜像准入与供应链边界实战](../k8s/image-security-and-supply-chain-governance.md)
- [内网离线集群搭建操作指南](../k8s/offline-cluster-setup-guide.md)
