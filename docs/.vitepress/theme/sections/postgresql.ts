import type { SectionConfig } from './types'

export const postgresqlSection: SectionConfig = {
    key: 'postgresql',
    base: '/postgresql/',
    navText: 'PostgreSQL',
    overviewDescription:
      '系统整理 PostgreSQL 核心知识，涵盖 MVCC、索引、锁与事务、批量写入、分区表、高可用集群部署与故障恢复。',
    landing: {
      eyebrow: 'PostgreSQL',
      title: 'PostgreSQL 专题',
      intro:
        '把散落在支付系统案例和架构文档中的 PostgreSQL 相关内容统一收敛，方便按主题查阅和持续更新。',
      primary: { title: '专题总览', href: '/postgresql/', description: '从总览页开始，按主题查阅。' },
      secondary: { title: '高可用集群', href: '/postgresql/ha-cluster', description: '从 Patroni + etcd + HAProxy 开始。' },
      scope: [
        'MVCC 与可见性',
        '索引与查询计划',
        '锁与事务',
        '批量写入与分区表',
        '高可用集群部署',
        'WAL 流复制与故障恢复',
      ],
      docs: [
        { title: '核心概念与高频考点', href: '/postgresql/core-concepts', description: 'MVCC、索引类型、锁与事务、批量写入、分区表、高可用与复制。' },
        { title: '支付场景追问', href: '/postgresql/payment-practice', description: '长事务问题、流水表分区、CopyFrom 使用时机、复制延迟监控。' },
        { title: '高可用集群整理', href: '/postgresql/ha-cluster', description: 'Patroni + etcd + HAProxy 部署、WAL 流复制、同步策略、故障恢复。' },
      ],
      order: [
        '核心概念与高频考点',
        '支付场景追问',
        '高可用集群整理',
      ],
    },
    sidebar: [
      {
        text: 'PostgreSQL 专题',
        items: [
          { text: '专题总览', link: '/postgresql/' },
          { text: '核心概念与高频考点', link: '/postgresql/core-concepts' },
          { text: '支付场景追问', link: '/postgresql/payment-practice' },
          { text: '高可用集群整理', link: '/postgresql/ha-cluster' },
        ],
      },
    ],
  }
