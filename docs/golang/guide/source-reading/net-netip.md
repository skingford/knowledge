---
title: net/netip 源码精读
description: 精读 net/netip 的现代 IP 地址实现，掌握 Addr/AddrPort/Prefix 的零分配设计、IPv4/IPv6 统一处理与高性能路由表最佳实践。
---

# net/netip：现代 IP 地址处理源码精读

> 核心源码：`src/net/netip/netip.go`（Go 1.18 引入）

## 包结构图

```
net/netip 体系（Go 1.18+）
══════════════════════════════════════════════════════════════════

  核心类型（值类型，可比较，零分配）：
  ┌──────────────────────────────────────────────────────────┐
  │  Addr                      AddrPort             Prefix  │
  │  ├── IPv4: 4字节           Addr + uint16 Port   Addr +  │
  │  ├── IPv6: 16字节          （合并存储）          bits   │
  │  └── IPv4-in-IPv6映射      可作 map key          CIDR   │
  │                                                          │
  │  内部存储（Addr）：                                       │
  │  addr128{hi, lo uint64}   ← 无指针，栈分配              │
  │  z    *intern.Value       ← Zone（IPv6 link-local）      │
  └──────────────────────────────────────────────────────────┘

  vs 旧 net.IP：
  ┌──────────────┬──────────────────────┬────────────────────┐
  │              │ net.IP（旧）          │ net/netip（新）    │
  ├──────────────┼──────────────────────┼────────────────────┤
  │ 类型         │ []byte（引用类型）   │ 值类型（struct）   │
  │ 可作 map key │ ❌                   │ ✅                 │
  │ 可比较（==） │ ❌                   │ ✅                 │
  │ 内存分配     │ 每次分配堆内存       │ 零分配（栈上）     │
  │ nil 安全     │ nil 有歧义           │ Zero value 有效    │
  └──────────────┴──────────────────────┴────────────────────┘

  主要 API：
  ├── netip.ParseAddr("192.168.1.1")
  ├── netip.ParseAddrPort("192.168.1.1:8080")
  ├── netip.ParsePrefix("10.0.0.0/8")
  ├── netip.AddrFrom4([4]byte)  / AddrFrom16([16]byte)
  ├── addr.Is4() / Is6() / IsLoopback() / IsPrivate()
  ├── prefix.Contains(addr)
  └── addr.Unmap()  ← IPv4-in-IPv6 → 纯 IPv4

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/net/netip/netip.go（简化）

// Addr 内部表示：128位整数 + zone 指针
type Addr struct {
    // 统一用 128 位表示：
    // IPv4:         0:0:0:0:0:ffff:aabb:ccdd（IPv4-in-IPv6 映射）
    // IPv6:         完整 128 位
    // IPv4-mapped:  ::ffff:x.x.x.x
    addr uint128      // {hi, lo uint64}
    z    *intern.Value // IPv6 zone（link-local 用）
}

// Is4：判断是否是纯 IPv4 地址
func (ip Addr) Is4() bool {
    return ip.z == z4 // z4 是 IPv4 的特殊标记
}

// Prefix.Contains：CIDR 包含检查（位运算，极快）
func (p Prefix) Contains(ip Addr) bool {
    pp := p.Addr()
    if ip.Is4() != pp.Is4() {
        ip = ip.Unmap() // 统一为相同类型
    }
    bits := p.Bits()
    // 将两个地址的高 bits 位对齐比较
    return ip.WithZone("") == pp.WithZone("") ||
        // 高 bits 位相同即认为在同一子网
        ip.addr.shiftRight(128-bits) == pp.addr.shiftRight(128-bits)
}
```

---

## 二、代码示例

### 基础解析与操作

```go
import "net/netip"

func basicOps() {
    // 解析 IP 地址
    addr, err := netip.ParseAddr("192.168.1.100")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(addr.Is4())        // true
    fmt.Println(addr.Is6())        // false
    fmt.Println(addr.IsPrivate())  // true（RFC 1918）
    fmt.Println(addr.IsLoopback()) // false
    fmt.Println(addr.String())     // "192.168.1.100"

    // IPv6
    addr6, _ := netip.ParseAddr("::1")
    fmt.Println(addr6.IsLoopback()) // true
    fmt.Println(addr6.Is6())        // true

    // IPv4-mapped IPv6
    mapped, _ := netip.ParseAddr("::ffff:192.168.1.1")
    fmt.Println(mapped.Is4In6())   // true
    fmt.Println(mapped.Unmap())    // 192.168.1.1（转为纯 IPv4）
}
```

### 作为 Map Key（零分配路由表）

```go
// ✅ Addr 可直接用作 map key（net.IP 不行）
type RouteTable struct {
    rules map[netip.Prefix]string // CIDR → 路由策略
}

func NewRouteTable() *RouteTable {
    rt := &RouteTable{rules: make(map[netip.Prefix]string)}
    // 配置路由规则
    rt.rules[netip.MustParsePrefix("10.0.0.0/8")]     = "intranet"
    rt.rules[netip.MustParsePrefix("172.16.0.0/12")]  = "intranet"
    rt.rules[netip.MustParsePrefix("192.168.0.0/16")] = "intranet"
    rt.rules[netip.MustParsePrefix("0.0.0.0/0")]      = "internet"
    return rt
}

func (rt *RouteTable) Classify(ip netip.Addr) string {
    for prefix, policy := range rt.rules {
        if prefix.Contains(ip) {
            return policy
        }
    }
    return "unknown"
}

// 用 Addr 去重（利用可比较性）
func deduplicateIPs(addrs []netip.Addr) []netip.Addr {
    seen := make(map[netip.Addr]struct{})
    var result []netip.Addr
    for _, a := range addrs {
        if _, ok := seen[a]; !ok {
            seen[a] = struct{}{}
            result = append(result, a)
        }
    }
    return result
}
```

### CIDR 操作

```go
func cidrOps() {
    prefix, _ := netip.ParsePrefix("192.168.1.0/24")

    fmt.Println(prefix.Addr())      // 192.168.1.0（网络地址）
    fmt.Println(prefix.Bits())      // 24（掩码位数）
    fmt.Println(prefix.Masked())    // 192.168.1.0/24（规范化）

    // 包含检查
    ip, _ := netip.ParseAddr("192.168.1.100")
    fmt.Println(prefix.Contains(ip)) // true

    ip2, _ := netip.ParseAddr("192.168.2.1")
    fmt.Println(prefix.Contains(ip2)) // false

    // 遍历子网所有地址（小心大子网！）
    addr := prefix.Addr()
    for prefix.Contains(addr) {
        fmt.Println(addr)
        addr = addr.Next() // 下一个 IP 地址
    }
}
```

### AddrPort（地址+端口）

```go
// AddrPort 合并 IP 和端口（替代 net.TCPAddr 中的字符串解析）
func addrPortOps() {
    // 解析 "host:port"
    ap, err := netip.ParseAddrPort("10.0.0.1:8080")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(ap.Addr()) // 10.0.0.1
    fmt.Println(ap.Port()) // 8080
    fmt.Println(ap)        // 10.0.0.1:8080

    // IPv6 地址端口
    ap6, _ := netip.ParseAddrPort("[::1]:443")
    fmt.Println(ap6) // [::1]:443

    // 从组件构建
    addr, _ := netip.ParseAddr("127.0.0.1")
    ap2 := netip.AddrPortFrom(addr, 9090)
    fmt.Println(ap2) // 127.0.0.1:9090
}
```

### 与旧 net.IP 互转

```go
import (
    "net"
    "net/netip"
)

// net.IP → netip.Addr
func netIPToAddr(ip net.IP) (netip.Addr, bool) {
    if ip4 := ip.To4(); ip4 != nil {
        return netip.AddrFrom4([4]byte(ip4)), true
    }
    if ip6 := ip.To16(); ip6 != nil {
        return netip.AddrFrom16([16]byte(ip6)), true
    }
    return netip.Addr{}, false
}

// netip.Addr → net.IP
func addrToNetIP(addr netip.Addr) net.IP {
    if addr.Is4() {
        b := addr.As4()
        return net.IP(b[:])
    }
    b := addr.As16()
    return net.IP(b[:])
}

// 从 net.Conn 获取客户端 IP（推荐方式）
func clientIP(conn net.Conn) netip.Addr {
    addr := conn.RemoteAddr().String()
    ap, err := netip.ParseAddrPort(addr)
    if err != nil {
        return netip.Addr{}
    }
    return ap.Addr().Unmap() // 统一为纯 IPv4（如果是 IPv4-in-IPv6）
}
```

### HTTP 请求 IP 提取

```go
// 从 HTTP 请求获取真实客户端 IP（处理代理）
func realClientIP(r *http.Request) netip.Addr {
    // 优先取 X-Real-IP（Nginx 代理设置）
    if xri := r.Header.Get("X-Real-IP"); xri != "" {
        if addr, err := netip.ParseAddr(xri); err == nil {
            return addr
        }
    }

    // 其次取 X-Forwarded-For 最左侧 IP
    if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
        parts := strings.Split(xff, ",")
        if addr, err := netip.ParseAddr(strings.TrimSpace(parts[0])); err == nil {
            return addr
        }
    }

    // 最后取 RemoteAddr
    ap, err := netip.ParseAddrPort(r.RemoteAddr)
    if err != nil {
        return netip.Addr{}
    }
    return ap.Addr().Unmap()
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `net/netip.Addr` 相比 `net.IP` 的核心优势？ | 值类型（可作 map key、可用 == 比较）；零分配（无堆内存分配）；Zero value 有效（`net.IP` 的 nil 有歧义） |
| IPv4-in-IPv6 是什么？何时需要 `Unmap()`？ | `::ffff:x.x.x.x` 格式，IPv6 栈接受 IPv4 连接时产生；`Unmap()` 转为纯 IPv4，确保 IPv4/IPv6 一致性处理 |
| `Prefix.Contains()` 的实现原理？ | 将地址右移 `(128-bits)` 位比较高位是否相同；纯位运算，O(1) 时间复杂度 |
| 什么时候应该从 `net.IP` 迁移到 `net/netip`？ | 新代码：直接用 `netip`；需要作 map key 或频繁比较 IP 时；性能敏感的路由/防火墙场景（零分配） |
| `AddrPort` 和 `net.TCPAddr` 的区别？ | `AddrPort` 是值类型，可作 map key，解析更快；`net.TCPAddr` 含 string Zone 字段（引用类型），解析需字符串操作 |
| `addr.Next()` 的边界行为？ | 当 addr 是 `255.255.255.255`（IPv4 最大值）时，返回 `Addr{}`（Zero value），`IsValid()` 返回 false |
