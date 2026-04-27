import type { SectionConfig } from './types'

export const networkSection: SectionConfig = {
  key: 'network',
  base: '/network/',
  navText: '网络',
  overviewDescription:
    '系统整理网络必须掌握的核心知识，覆盖分层模型、IP/路由、Socket/TCP、HTTP/HTTPS、TLS、DNS/CDN、负载均衡与常见排障方法。',
  landing: {
    eyebrow: 'Network',
    title: '网络专题',
    intro:
      '把网络从”会背三次握手”提升到”能解释一次请求怎么经过 DNS、TCP、TLS、HTTP、CDN、负载均衡，并能按层定位问题”的层面，先建立全局链路，再补协议细节和排障动作。',
    primary: { title: 'Go 后端学习清单', href: '/network/learning-checklist', description: '先按 Go 后端和实战排障主线定学习顺序。' },
    secondary: { title: '网络必备知识', href: '/network/essential-knowledge', description: '再用一篇总览文把分层模型、请求链路和知识地图搭起来。' },
    scope: [
      'OSI / TCP/IP 分层模型',
      'IP、路由与 NAT',
      '端口、Socket 与连接状态',
      'TCP / UDP 与可靠传输',
      'HTTP/1.1、HTTP/2、HTTP/3',
      'HTTPS / TLS 握手与证书',
      '代理、网关与流量入口',
      'DNS 解析与缓存',
      'CDN、反向代理与负载均衡',
      '网络排障命令与抓包思路',
    ],
    docs: [
      { title: 'Go 后端学习清单', href: '/network/learning-checklist', description: '按 Go 后端和实战场景排一条可打勾推进的网络学习主线。' },
      { title: '网络必备知识', href: '/network/essential-knowledge', description: '从分层模型到一次完整请求链路，建立网络知识全景图。' },
      { title: 'IP 与路由', href: '/network/ip-and-routing', description: 'IP 寻路、默认网关、ARP、ICMP、MTU、NAT 和 TTL。' },
      { title: 'Socket、端口与连接状态', href: '/network/socket-and-connection-state', description: '监听、连接生命周期、TIME_WAIT、CLOSE_WAIT 和常见建连错误。' },
      { title: 'TCP 与 UDP', href: '/network/tcp-and-udp', description: 'TCP/UDP 对比、三次握手、四次挥手、滑动窗口与拥塞控制。' },
      { title: 'HTTP 与 HTTPS', href: '/network/http-and-https', description: 'HTTP 版本演进、TLS 握手与 HTTPS 排障。' },
      { title: 'TLS、证书与 mTLS', href: '/network/tls-and-certificates', description: '证书链、SNI、ALPN、mTLS 与常见握手错误。' },
      { title: '代理、反向代理、网关与隧道', href: '/network/proxy-gateway-and-tunnel', description: '正向代理、反向代理、网关、CONNECT、Upgrade 与 502/504。' },
      { title: 'DNS、CDN 与负载均衡', href: '/network/dns-cdn-and-load-balancing', description: '域名解析、边缘缓存、回源和 L4/L7 负载均衡。' },
      { title: 'NAT、防火墙、内网穿透与 VPN', href: '/network/nat-firewall-and-vpn', description: '地址转换、访问控制、内外网打通和远程接入。' },
      { title: '网络排障与常用命令', href: '/network/troubleshooting-and-commands', description: 'ping、traceroute、dig、curl、ss、tcpdump 的使用场景和排查顺序。' },
      { title: '抓包、tcpdump 与 Wireshark', href: '/network/packet-capture-and-tcpdump', description: '三次握手、RST、重传、TLS 握手与抓包过滤思路。' },
    ],
    order: [
      'Go 后端学习清单',
      '网络必备知识',
      'IP 与路由',
      'Socket、端口与连接状态',
      'TCP 与 UDP',
      'HTTP 与 HTTPS',
      'TLS、证书与 mTLS',
      '代理、反向代理、网关与隧道',
      'DNS、CDN 与负载均衡',
      'NAT、防火墙、内网穿透与 VPN',
      '网络排障与常用命令',
      '抓包、tcpdump 与 Wireshark',
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
      text: '基础与传输',
      collapsed: true,
      items: [
        { text: 'IP / 路由', link: '/network/ip-and-routing' },
        { text: 'Socket / 连接状态', link: '/network/socket-and-connection-state' },
        { text: 'TCP / UDP', link: '/network/tcp-and-udp' },
      ],
    },
    {
      text: '应用与信任链路',
      collapsed: true,
      items: [
        { text: 'HTTP / HTTPS', link: '/network/http-and-https' },
        { text: 'TLS / 证书 / mTLS', link: '/network/tls-and-certificates' },
        { text: '代理 / 网关 / 隧道', link: '/network/proxy-gateway-and-tunnel' },
        { text: 'DNS / CDN / LB', link: '/network/dns-cdn-and-load-balancing' },
        { text: 'NAT / 防火墙 / VPN', link: '/network/nat-firewall-and-vpn' },
      ],
    },
    {
      text: '排障实践',
      collapsed: true,
      items: [
        { text: '排障与命令', link: '/network/troubleshooting-and-commands' },
        { text: '抓包 / tcpdump / Wireshark', link: '/network/packet-capture-and-tcpdump' },
      ],
    },
  ],
}
