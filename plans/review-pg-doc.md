# 审查完善 tmp/pg.md 文档计划

## 需求重述

对 `tmp/pg.md`（PostgreSQL 高可用集群整理）进行全面审查和完善，使其符合本项目的文档规范，内容质量达到可正式发布的水准。

## 当前文档评估

### 优点
- 内容覆盖面广：从方案选型到部署、WAL 机制、同步策略、故障恢复一路贯通
- 结构清晰，由浅入深，共 24 个章节
- ASCII 架构图直观
- 配置示例完整可用
- 运维命令和故障场景分析实用

### 需要改进的问题

| # | 类别 | 问题 | 严重度 |
|---|------|------|--------|
| 1 | 规范 | 缺少 YAML frontmatter（title、description） | 高 |
| 2 | 规范 | 缺少"适合人群"、"学习目标"、"快速导航"标准开头段 | 高 |
| 3 | 位置 | 文件在 `tmp/` 目录，需移到正式文档目录 | 高 |
| 4 | 安全 | 配置示例中出现明文密码（admin_password、rep_password、postgres_password），缺少安全警告 | 中 |
| 5 | 内容 | etcd 安装方式用 `apt install etcd` 在生产中版本不可控，建议补充版本固定建议 | 低 |
| 6 | 内容 | Patroni 安装用 `pip3 install` 全局安装，未提 virtualenv 或系统包方式 | 低 |
| 7 | 内容 | `apt-key add` 已废弃（Ubuntu 22.04+），应改用 `/usr/share/keyrings/` 方式 | 中 |
| 8 | 内容 | HAProxy 健康检查端点 `/primary` 和 `/replica` 说明不足，未解释 Patroni REST API | 低 |
| 9 | 结构 | 第四节（部署示例）到第七节（HAProxy 配置）中间断裂——第四节标题说"部署示例"但只到安装步骤，第五~七节才是真正配置 | 中 |
| 10 | 内容 | systemd 服务中 `Restart=no` 在生产环境不合适，通常应设为 `on-failure` | 中 |
| 11 | 内容 | 缺少 PgBouncer 连接池的配置示例（第二节提到了但后续没有展开） | 低 |
| 12 | 内容 | 缺少 TLS/SSL 加密传输相关配置（etcd 和 PG 之间、PG 主从之间） | 低 |
| 13 | 导航 | 需要注册到 content-data.ts 的 sidebar 和 landing | 高 |

## 文档归属分析

PostgreSQL 高可用集群主题兼具**架构设计**和**运维实操**特性。建议放入 `docs/architecture/` 目录，理由：
- 方案选型、RPO/RTO 设计属于架构决策范畴
- 与已有的"高并发系统设计清单"、"分布式事务方案对比"同属基础设施架构
- 部署和运维部分作为落地配套，保留在同一文档内即可

文件路径：`docs/architecture/postgresql-ha-cluster.md`

## 实施计划

### Phase 1：补充文档规范结构

1. 添加 YAML frontmatter
```yaml
---
title: PostgreSQL 高可用集群整理
description: PostgreSQL 高可用方案选型、Patroni + etcd + HAProxy 部署、WAL 流复制机制、同步策略与故障恢复速查。
---
```

2. 在正文开头添加标准段：
   - **适合人群**：需要搭建 PG 高可用的后端工程师、DBA、SRE
   - **学习目标**：3~4 条核心目标
   - **快速导航**：各大章节锚点链接

### Phase 2：内容修正与完善

1. **安全警告**：在密码出现的配置示例前加 `> ⚠️ 示例密码仅供演示，生产环境务必使用环境变量或密钥管理服务。`
2. **apt-key 废弃问题**：更新 PostgreSQL 仓库密钥导入命令为 signed-by 方式
3. **systemd Restart 策略**：将 `Restart=no` 改为 `Restart=on-failure`，并添加 `RestartSec=5s`
4. **章节结构调整**：将四~七节合并为一个大的"三节点 Patroni 集群部署"章节，内含 etcd、Patroni、HAProxy 三个子步骤，消除断裂感
5. **etcd 安装建议**：补充版本固定或使用官方二进制安装的简要说明
6. **Patroni REST API 说明**：补充 `/primary`、`/replica` 端点的简要解释

### Phase 3：文件迁移与导航注册

1. 将文件从 `tmp/pg.md` 移动到 `docs/architecture/postgresql-ha-cluster.md`
2. 在 `content-data.ts` 中：
   - 架构 sidebar 添加链接
   - 架构 landing docs 添加条目

### Phase 4：验证

1. 运行 `npm run docs:dev` 确认页面正常渲染
2. 检查快速导航锚点是否全部可用
3. 检查侧边栏链接是否正确

## 风险评估

- **低风险**：文档内容变更是纯增量修改，不影响已有文档
- **低风险**：content-data.ts 修改只是添加条目，不改变已有结构
- **需注意**：`tmp/pg.md` 原文件是否需要保留——建议迁移后删除 tmp 中的版本

## 预估复杂度：中等
- 内容修正与完善：主要工作量
- 导航注册：少量代码改动
