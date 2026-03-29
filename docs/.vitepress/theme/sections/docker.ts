import type { SectionConfig } from './types'

export const dockerSection: SectionConfig = {
    key: 'docker',
    base: '/docker/',
    navText: 'Docker',
    overviewDescription:
      '系统整理 Docker 必备知识，涵盖容器原理、镜像构建、私有仓库与 Harbor、容器生命周期、网络、存储、Compose、安全与排障。',
    landing: {
      eyebrow: 'Docker',
      title: 'Docker 专题',
      intro:
        '把 Docker 从“会 run 一个容器”提升到“能解释镜像、仓库、Harbor、PID 1、信号、网络、数据卷、Compose 和生产交付边界”的层面，先建立统一对象模型，再进入构建、发布与排障。',
      primary: { title: '专题总览', href: '/docker/', description: '从总览页开始，先建立完整框架。' },
      secondary: { title: '核心概念与对象模型', href: '/docker/core-concepts', description: '先把 Docker 的对象模型、隔离机制和分层文件系统讲清。' },
      scope: [
        '容器与虚拟机差异',
        '镜像层与 copy-on-write',
        'Dockerfile 与多阶段构建',
        '私有仓库、Harbor、tag 与 digest 治理',
        'PID 1、信号、重启策略与优雅退出',
        '网络、卷与持久化',
        'Compose 多容器协作与单机部署',
        '版本晋级、离线分发与回滚',
        '安全、资源限制与排障',
        '高频问题与自检口径',
      ],
      docs: [
        { title: 'Docker 核心概念与对象模型', href: '/docker/core-concepts', description: '先把 Docker 解决什么问题、镜像和容器关系、隔离机制与分层文件系统讲清。' },
        { title: 'Dockerfile 与镜像构建实践', href: '/docker/dockerfile-and-image-build', description: '系统整理 Dockerfile 指令、缓存命中、多阶段构建、基础镜像选择与镜像发布策略。' },
        { title: 'Docker 镜像仓库、Harbor 与发布治理', href: '/docker/registry-and-image-governance', description: '把 registry / repository / tag / digest、Harbor、版本晋级、离线分发和仓库治理讲成一条线。' },
        { title: 'Docker 容器生命周期与运行模型', href: '/docker/container-lifecycle-and-runtime', description: '把容器状态、PID 1、ENTRYPOINT / CMD、stop / kill、重启策略、健康检查和 OOM 串成一条线。' },
        { title: 'Docker 网络、存储与 Compose 实战', href: '/docker/network-storage-and-compose', description: '把网络模式、端口映射、volume 与 bind mount、Compose 多容器联调收成一页。' },
        { title: 'Docker Compose 部署实践', href: '/docker/compose-deployment-practice', description: '把 Compose 从本地联调推进到单机稳定部署，补目录结构、反向代理、备份、发布和回滚。' },
        { title: 'Docker 安全与生产实践', href: '/docker/security-and-production-practice', description: '聚焦非 root、最小权限、密钥注入、镜像治理、资源限制和生产基线。' },
        { title: 'Docker 排障与日常运维', href: '/docker/troubleshooting-and-operations', description: '系统整理容器秒退、端口不通、磁盘爆满、构建变慢和镜像拉取失败的排障路径。' },
        { title: 'Docker 高频问题与自检清单', href: '/docker/interview-questions', description: '按由浅入深整理对象模型、镜像构建、仓库治理、生命周期、Compose、安全与排障的高频问题与答题口径。' },
      ],
      order: [
        'Docker 核心概念与对象模型',
        'Dockerfile 与镜像构建实践',
        'Docker 镜像仓库、Harbor 与发布治理',
        'Docker 容器生命周期与运行模型',
        'Docker 网络、存储与 Compose 实战',
        'Docker Compose 部署实践',
        'Docker 安全与生产实践',
        'Docker 排障与日常运维',
        'Docker 高频问题与自检清单',
      ],
    },
    sidebar: [
      {
        text: '全局认知',
        items: [
          { text: '专题总览', link: '/docker/' },
          { text: '核心概念', link: '/docker/core-concepts' },
        ],
      },
      {
        text: '构建与镜像',
        collapsed: true,
        items: [
          { text: 'Dockerfile 与构建', link: '/docker/dockerfile-and-image-build' },
        ],
      },
      {
        text: '仓库与发布',
        collapsed: true,
        items: [
          { text: '镜像仓库、Harbor 与发布治理', link: '/docker/registry-and-image-governance' },
        ],
      },
      {
        text: '运行与数据',
        collapsed: true,
        items: [
          { text: '容器生命周期与运行模型', link: '/docker/container-lifecycle-and-runtime' },
          { text: '网络、存储与 Compose', link: '/docker/network-storage-and-compose' },
        ],
      },
      {
        text: '交付与部署',
        collapsed: true,
        items: [
          { text: 'Compose 部署实践', link: '/docker/compose-deployment-practice' },
        ],
      },
      {
        text: '安全与运维',
        collapsed: true,
        items: [
          { text: '安全与生产实践', link: '/docker/security-and-production-practice' },
          { text: '排障与日常运维', link: '/docker/troubleshooting-and-operations' },
        ],
      },
      {
        text: '能力自检',
        collapsed: true,
        items: [
          { text: '高频问题', link: '/docker/interview-questions' },
        ],
      },
    ],
  }
