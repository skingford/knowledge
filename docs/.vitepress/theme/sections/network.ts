import type { SectionConfig } from './types'

export const networkSection: SectionConfig = {
  key: 'network',
  base: '/network/',
  navText: '网络',
  overviewDescription:
    '系统整理网络必须掌握的核心知识，覆盖分层模型、TCP/IP、HTTP/HTTPS、DNS、CDN、负载均衡与常见排障方法。',
  landing: {
    eyebrow: 'Network',
    title: '网络专题',
    intro:
      '把网络从“会背三次握手”提升到“能解释一次请求怎么经过 DNS、TCP、TLS、HTTP、CDN、负载均衡，并能按层定位问题”的层面，先建立全局链路，再补协议细节和排障动作。',
    primary: { title: 'Go 后端学习清单', href: '/network/learning-checklist', description: '先按 Go 后端和实战排障主线定学习顺序。' },
    secondary: { title: '网络必备知识', href: '/network/essential-knowledge', description: '再用一篇总览文把协议、链路和排障框架搭起来。' },
    scope: [
      'OSI / TCP/IP 分层模型',
      'IP、路由与 NAT',
      'TCP / UDP 与可靠传输',
      'HTTP/1.1、HTTP/2、HTTP/3',
      'HTTPS / TLS 握手与证书',
      'DNS 解析与缓存',
      'CDN、反向代理与负载均衡',
      '网络排障命令与抓包思路',
    ],
    docs: [
      { title: 'Go 后端学习清单', href: '/network/learning-checklist', description: '按 Go 后端和实战场景排一条可打勾推进的网络学习主线。' },
      { title: '网络必备知识', href: '/network/essential-knowledge', description: '从分层模型、IP、TCP、HTTP/HTTPS、DNS/CDN/负载均衡到排障方法与高频自检题，建立网络知识总地图。' },
      { title: 'DNS、CDN 与负载均衡', href: '/network/dns-cdn-and-load-balancing', description: '把域名解析、边缘缓存、回源和 L4/L7 负载均衡串成同一条访问链路。' },
      { title: 'NAT、防火墙、内网穿透与 VPN', href: '/network/nat-firewall-and-vpn', description: '把地址转换、访问控制、内外网打通和远程接入放回同一条网络访问路径里理解。' },
      { title: '网络排障与常用命令', href: '/network/troubleshooting-and-commands', description: '整理 ping、traceroute、dig、curl、ss、tcpdump 等命令的使用场景和排查顺序。' },
    ],
    order: [
      'Go 后端学习清单',
      '网络必备知识',
      'DNS、CDN 与负载均衡',
      'NAT、防火墙、内网穿透与 VPN',
      '网络排障与常用命令',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/network/' },
        { text: '学习清单', link: '/network/learning-checklist' },
        { text: '必备知识', link: '/network/essential-knowledge' },
      ],
    },
    {
      text: '基础设施链路',
      collapsed: true,
      items: [
        { text: 'DNS / CDN / LB', link: '/network/dns-cdn-and-load-balancing' },
        { text: 'NAT / 防火墙 / VPN', link: '/network/nat-firewall-and-vpn' },
      ],
    },
    {
      text: '排障实践',
      collapsed: true,
      items: [
        { text: '排障与命令', link: '/network/troubleshooting-and-commands' },
      ],
    },
  ],
}
