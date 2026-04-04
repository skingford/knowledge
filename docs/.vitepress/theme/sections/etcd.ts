import type { SectionConfig } from './types'

export const etcdSection: SectionConfig = {
    key: 'etcd',
    base: '/etcd/',
    navText: 'etcd',
    overviewDescription:
      '系统整理 etcd 必须掌握的核心知识，涵盖 Raft、多数派、MVCC revision、Lease/Watch、Txn/CAS、读一致性与生产运维边界。',
    landing: {
      eyebrow: 'etcd',
      title: 'etcd 专题',
      intro:
        '把 etcd 从“知道能做注册中心”提升到“理解一致性存储系统”的层面，先抓必须掌握的知识点，再延伸到服务发现、配置中心和高可用场景。',
      primary: { title: '专题总览', href: '/etcd/', description: '从总览页开始，先建立统一框架。' },
      secondary: { title: 'RPC、注册发现与配置', href: '/golang/guide/08-rpc-discovery-config', description: '看 Go 场景中的 etcd 落地。' },
      scope: [
        'Raft 与多数派',
        'MVCC 与 revision',
        'Lease / TTL / KeepAlive',
        'Watch 与 compaction',
        'Txn / CAS / 分布式锁',
        '线性一致性读写',
        '备份恢复与运维边界',
      ],
      docs: [
        { title: '专题总览', href: '/etcd/', description: '先建立 etcd 的定位、核心机制和必须掌握知识点。' },
        { title: 'RPC、注册发现与配置', href: '/golang/guide/08-rpc-discovery-config', description: '看 etcd 在服务注册发现和配置中心里的 Go 实战。' },
        { title: 'PostgreSQL 高可用集群整理', href: '/postgresql/ha-cluster', description: '看 etcd 在 Patroni + HAProxy 方案中的角色。' },
      ],
      order: [
        '专题总览',
        'RPC、注册发现与配置',
        'PostgreSQL 高可用集群整理',
      ],
    },
    sidebar: [
      {
        text: '核心入口',
        items: [
          { text: '专题总览', link: '/etcd/' },
        ],
      },
    ],
  }
