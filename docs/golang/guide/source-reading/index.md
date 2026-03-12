---
title: Go 源码精读总览
description: 以专家视角精炼剖析 Go 标准库核心包，配 text 图例与可运行示例，适合进阶学习与面试备战。
---

# Go 源码精读总览

> 源码路径：`$GOROOT/src/`（版本：v1.26.1）

## 包全景图

```
Go 标准库核心包关系图
══════════════════════════════════════════════════════════════════

  ┌─────────────────────────── 运行时基础 ────────────────────────┐
  │                                                              │
  │   runtime/proc.go     ← GMP 调度器                          │
  │   runtime/malloc.go   ← 内存分配（mcache/mcentral/mheap）   │
  │   runtime/mgc.go      ← 三色标记 GC                         │
  │   runtime/chan.go     ← Channel 底层实现                     │
  │   runtime/map.go      ← map hmap 实现                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↑ 被上层包间接依赖
  ┌─────────────────────────── 同步原语 ──────────────────────────┐
  │                                                              │
  │   sync.Mutex / RWMutex    ← 互斥锁、读写锁                  │
  │   sync.WaitGroup          ← goroutine 同步屏障               │
  │   sync.Once               ← 单次初始化                       │
  │   sync.Map                ← 并发安全 map                     │
  │   sync/atomic             ← 原子操作（CAS、Load、Store）     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓ 被所有业务层依赖
  ┌─────────────────────────── 上下文传播 ────────────────────────┐
  │                                                              │
  │   context.Context         ← 接口定义（4个方法）              │
  │   context.cancelCtx       ← 取消树节点                       │
  │   context.timerCtx        ← deadline/timeout 实现            │
  │   context.valueCtx        ← 键值对传播                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── I/O 体系 ──────────────────────────┐
  │                                                              │
  │   io.Reader / io.Writer   ← 核心接口                         │
  │   bufio.Reader/Writer     ← 缓冲 I/O                         │
  │   io.Pipe                 ← 同步管道                         │
  │   os.File                 ← 文件操作                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 网络层 ────────────────────────────┐
  │                                                              │
  │   net.Conn                ← 网络连接接口                     │
  │   net/http.Server         ← HTTP 服务端                      │
  │   net/http.Transport      ← HTTP 客户端连接池                │
  │   net/http.ServeMux       ← 路由多路复用                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 序列化 ────────────────────────────┐
  │                                                              │
  │   encoding/json           ← JSON 编解码（反射驱动）          │
  │   encoding/xml            ← XML 编解码                       │
  │   encoding/gob            ← Go 原生序列化                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 反射 ──────────────────────────────┐
  │                                                              │
  │   reflect.Type            ← 类型描述（rtype）                │
  │   reflect.Value           ← 值描述                           │
  │   reflect.Kind            ← 基础类型枚举                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  ┌─────────────────────────── 工程实践 ──────────────────────────┐
  │                                                              │
  │   unsafe                  ← 内存布局与零拷贝操作             │
  │   log/slog（Go 1.21+）    ← 结构化日志（Handler 接口设计）  │
  │   os / os/exec            ← 文件系统与进程管理               │
  │   testing                 ← 表驱动/Benchmark/Fuzz 框架       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 底层原理与性能 ────────────────────┐
  │                                                              │
  │   net                     ← TCP/UDP + netpoller 集成         │
  │   sort / slices           ← pdqsort（Go 1.19+）泛型排序      │
  │   strconv                 ← Ryu 算法 + AppendXxx 零分配      │
  │   fmt                     ← 反射格式化 + sync.Pool 复用      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 扩展专题 ──────────────────────────┐
  │                                                              │
  │   bufio                   ← Scanner/SplitFunc 缓冲 I/O       │
  │   regexp                  ← Thompson NFA 线性时间保证         │
  │   crypto/tls              ← TLS 1.3 握手 + 证书验证链        │
  │   math/rand/v2            ← ChaCha8/PCG 随机数生成器         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 工具链与调优 ──────────────────────┐
  │                                                              │
  │   embed                   ← //go:embed 编译时资源嵌入        │
  │   flag                    ← FlagSet 子命令模式               │
  │   net/url                 ← URL 结构化解析 + 安全拼接        │
  │   runtime/pprof           ← CPU/Heap/Goroutine 性能剖析      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 底层基础与编码 ────────────────────┐
  │                                                              │
  │   encoding/binary         ← 字节序（Big/LittleEndian）+ Varint│
  │   compress/gzip           ← DEFLATE（LZ77+Huffman）流式压缩  │
  │   path/filepath           ← WalkDir + 跨平台路径处理         │
  │   unicode/utf8            ← rune/byte 模型 + DecodeRune      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 工程工具与数据结构 ─────────────────┐
  │                                                              │
  │   text/template           ← Parse/Execute + FuncMap 模板引擎 │
  │   os/signal               ← 信号分发 + NotifyContext 优雅关闭 │
  │   container/heap          ← 接口驱动堆 + 优先队列实现         │
  │   time                    ← 双时钟模型 + 参考时间格式化       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 系统能力与调试 ────────────────────┐
  │                                                              │
  │   io/fs                   ← FS 接口 + embed/os/fstest 统一   │
  │   os/exec                 ← 进程创建 + 管道 + 命令注入防护   │
  │   encoding/xml            ← 标签驱动 + 命名空间 + Token 流   │
  │   runtime/debug           ← GC 控制 + 栈追踪 + 构建信息      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 安全、测试与现代特性 ──────────────┐
  │                                                              │
  │   crypto/hmac             ← SHA256 + HMAC + 常数时间比较     │
  │   net/http/httptest       ← ResponseRecorder + 测试服务器    │
  │   maps/cmp/slices         ← Go 1.21+ 泛型工具包              │
  │   archive/zip             ← ZIP 中央目录 + Zip Slip 防护     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 数据、安全与基础结构 ──────────────┐
  │                                                              │
  │   encoding/csv            ← 流式读写 + ReuseRecord + BOM     │
  │   crypto/rand             ← CSPRNG + UUID v4 + Token 生成   │
  │   expvar                  ← /debug/vars 运行时指标暴露       │
  │   container/list          ← 哨兵节点双链表 + LRU 缓存        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 序列化、性能与加密 ─────────────────┐
  │                                                              │
  │   encoding/gob            ← 自描述流式二进制编码             │
  │   sync.Pool               ← per-P 本地池 + victim cache      │
  │   crypto/aes              ← AES-GCM AEAD + Nonce + 密钥派生  │
  │   net/http/httptrace      ← DNS/TCP/TLS 钩子 + TTFB 观测    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 追踪、算术与基础工具 ───────────────┐
  │                                                              │
  │   runtime/trace           ← goroutine 调度时间线 + GC 停顿   │
  │   math/big                ← Karatsuba 乘法 + 密码学模幂运算  │
  │   encoding/base64         ← 四种编码器 + JWT + 流式处理      │
  │   log                     ← Mutex 保护 + Fatal/Panic 行为    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 网络、校验与系统元数据 ─────────────┐
  │                                                              │
  │   net/smtp                ← SMTP 握手 + STARTTLS + MIME      │
  │   hash/crc32              ← slicing-by-8 + SSE4.2 硬件加速  │
  │   os/user                 ← CGO/纯 Go 双后端 + NSS 查询      │
  │   debug/buildinfo         ← VCS 信息嵌入 + 二进制版本审计    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 日志、上传、会话与并发 ─────────────┐
  │                                                              │
  │   log/slog                ← Handler 接口 + WithAttrs + 动态 Level │
  │   mime/multipart          ← 流式解析 + 文件上传安全验证       │
  │   net/http/cookiejar      ← PSL 防护 + Cookie 持久化 + 爬虫  │
  │   sync.Cond               ← Wait/Signal/Broadcast + 生产消费 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 工具链、位运算与经典协议 ───────────┐
  │                                                              │
  │   go/ast + go/parser      ← AST 遍历 + 代码分析 + 代码生成   │
  │   math/bits               ← POPCNT/BSR 指令 + 128位算术      │
  │   archive/tar             ← 512字节块格式 + 安全解压 + Docker │
  │   net/rpc                 ← gob 序列化 + 并发调用 vs gRPC    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── IO 高级模式与代码工具 ─────────────┐
  │                                                              │
  │   io 高级组合             ← TeeReader/Pipe/SectionReader     │
  │   text/tabwriter          ← 弹性制表符对齐 + kubectl风格输出  │
  │   go/format               ← AST往返格式化 + 代码生成最佳实践  │
  │   bufio 高级模式          ← 自定义SplitFunc + Peek协议嗅探    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 数据库、安全与模板 ────────────────┐
  │                                                              │
  │   database/sql            ← 连接池LIFO + 事务defer模式       │
  │   crypto/tls              ← TLS握手 + mTLS + 证书热更新      │
  │   encoding/binary         ← 字节序 + 协议帧解析 + varint     │
  │   html/template           ← 上下文感知转义 + XSS防护         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 代理、压缩与系统集成 ──────────────┐
  │                                                              │
  │   net/http/httputil       ← ReverseProxy + DumpRequest调试   │
  │   compress/gzip           ← DEFLATE封装 + Pool复用 + HTTP压缩 │
  │   unicode/utf8            ← rune解码 + 安全截断 + 编码校验    │
  │   os/signal               ← 优雅关闭 + SIGHUP重载 + K8s终止  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
              ↓
  ┌─────────────────────────── 底层、安全与现代特性 ──────────────┐
  │                                                              │
  │   runtime/pprof           ← CPU/堆/goroutine Profile采集     │
  │   crypto/x509             ← 证书链验证 + 自签名CA + CSR流程  │
  │   net/netip               ← 零分配IP地址 + 可作map key       │
  │   unsafe                  ← 指针转换规则 + 零拷贝 + 内存布局  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

## 精读索引

| 包 | 文档 | 核心价值 | 难度 |
|---|---|---|---|
| `errors` | [错误链](./errors) | 工程化错误处理 | ★★☆☆☆ |
| `strings`/`bytes` | [字符串处理](./strings-bytes) | 性能与惯用法 | ★★☆☆☆ |
| `sync` | [同步原语](./sync-primitives) | 并发编程基础 | ★★★☆☆ |
| `sync/atomic` | [原子操作](./sync-atomic) | 无锁编程底层 | ★★★☆☆ |
| `context` | [上下文传播](./context) | 服务治理基础 | ★★★☆☆ |
| `channel`（runtime） | [Channel 底层](./channel) | 理解 goroutine 通信 | ★★★★☆ |
| `map`（runtime） | [Map Swiss Table](./map) | 理解哈希表实现 | ★★★★☆ |
| `goroutine`（runtime） | [Goroutine 生命周期](./goroutine) | 理解调度与栈 | ★★★★☆ |
| `time`（runtime） | [定时器实现](./timer) | Timer/Ticker 原理 | ★★★☆☆ |
| `io` | [I/O 接口体系](./io-interfaces) | 理解接口设计哲学 | ★★☆☆☆ |
| `net/http` | [HTTP 实现](./net-http) | 服务端原理 | ★★★★☆ |
| `encoding/json` | [JSON 编解码](./encoding-json) | 序列化性能优化 | ★★★☆☆ |
| `database/sql` | [连接池实现](./database-sql) | 数据库连接管理 | ★★★☆☆ |
| `reflect` | [反射原理](./reflect) | 元编程基础 | ★★★★☆ |
| `runtime`（调度器） | [GMP 调度器](./runtime-scheduler) | 理解 goroutine 本质 | ★★★★★ |
| `runtime`（GC） | [垃圾回收器](./runtime-gc) | 理解 Stop-The-World | ★★★★★ |
| `runtime`（内存） | [内存分配](./runtime-memory) | 理解 GC 压力来源 | ★★★★☆ |
| `unsafe` | [内存操作](./unsafe) | 零拷贝与内存布局 | ★★★☆☆ |
| `log/slog` | [结构化日志](./log-slog) | 现代日志设计模式 | ★★★☆☆ |
| `os` | [文件与进程](./os) | 系统接口与跨平台 | ★★☆☆☆ |
| `testing` | [测试框架](./testing) | 表驱动/Fuzz/Bench | ★★★☆☆ |
| `net` | [TCP/UDP 底层](./net) | netpoller 集成原理 | ★★★★☆ |
| `sort`/`slices` | [排序算法](./sort) | pdqsort 实现原理 | ★★★☆☆ |
| `strconv` | [字符串转换](./strconv) | Ryu 算法与零分配 | ★★☆☆☆ |
| `fmt` | [格式化 I/O](./fmt) | 反射驱动与 Pool | ★★★☆☆ |
| `bufio` | [缓冲 I/O](./bufio) | Scanner/SplitFunc 机制 | ★★☆☆☆ |
| `regexp` | [正则引擎](./regexp) | Thompson NFA 线性保证 | ★★★☆☆ |
| `crypto/tls` | [TLS 实现](./crypto-tls) | TLS 1.3 握手与证书链 | ★★★★☆ |
| `math/rand/v2` | [随机数生成](./math-rand) | ChaCha8/PCG 生成器 | ★★☆☆☆ |
| `embed` | [静态资源嵌入](./embed) | //go:embed 编译时机制 | ★★☆☆☆ |
| `flag` | [命令行解析](./flag) | FlagSet 子命令模式 | ★★☆☆☆ |
| `net/url` | [URL 解析](./net-url) | Query 编解码与安全拼接 | ★★☆☆☆ |
| `runtime/pprof` | [性能剖析](./runtime-pprof) | CPU/Heap/Goroutine 采样 | ★★★☆☆ |
| `encoding/binary` | [二进制编解码](./encoding-binary) | 字节序与 Varint 变长编码 | ★★★☆☆ |
| `compress/gzip` | [流式压缩](./compress-gzip) | DEFLATE 算法与 HTTP 压缩 | ★★★☆☆ |
| `path/filepath` | [路径处理](./path-filepath) | WalkDir vs Walk 性能差异 | ★★☆☆☆ |
| `unicode/utf8` | [字符编码](./unicode-utf8) | rune/byte 内存模型与 DecodeRune | ★★★☆☆ |
| `text/template` | [模板引擎](./text-template) | Parse/Execute 与 FuncMap 设计 | ★★★☆☆ |
| `os/signal` | [信号处理](./os-signal) | 优雅关闭与 NotifyContext | ★★☆☆☆ |
| `container/heap` | [优先队列](./container-heap) | 接口驱动堆 + heap.Fix 场景 | ★★★☆☆ |
| `time` | [时间处理](./time-pkg) | 双时钟模型与格式化参考时间 | ★★☆☆☆ |
| `io/fs` | [文件系统抽象](./io-fs) | FS 接口 + embed/os/fstest 统一模型 | ★★★☆☆ |
| `os/exec` | [命令执行](./os-exec) | 进程创建与 I/O 管道 + 命令注入防护 | ★★★☆☆ |
| `encoding/xml` | [XML 编解码](./encoding-xml) | 标签驱动 + Token 流式解析 | ★★★☆☆ |
| `runtime/debug` | [调试工具](./runtime-debug) | GC 控制 + 栈追踪 + 构建信息 | ★★★☆☆ |
| `crypto/hmac` | [哈希与消息认证](./crypto-hmac) | SHA256 + HMAC 常数时间比较 | ★★★☆☆ |
| `net/http/httptest` | [HTTP 测试工具](./net-http-test) | ResponseRecorder + 测试服务器 | ★★☆☆☆ |
| `maps`/`cmp`/`slices` | [泛型工具包](./maps-cmp) | Go 1.21+ 标准泛型操作 | ★★☆☆☆ |
| `archive/zip` | [ZIP 归档](./archive-zip) | 中央目录 + Zip Slip 防护 | ★★★☆☆ |
| `encoding/csv` | [CSV 处理](./encoding-csv) | 流式读写 + ReuseRecord + BOM | ★★☆☆☆ |
| `crypto/rand` | [密码学随机数](./crypto-rand) | CSPRNG + UUID + Token 生成 | ★★☆☆☆ |
| `expvar` | [可导出变量](./expvar) | /debug/vars + 运行时指标暴露 | ★★☆☆☆ |
| `container/list` | [双向链表](./container-list) | 哨兵节点 + LRU 缓存实现 | ★★★☆☆ |
| `encoding/gob` | [Go 原生序列化](./encoding-gob) | 自描述流式编码 + 接口注册 | ★★★☆☆ |
| `sync.Pool` | [对象池](./sync-pool) | per-P 本地池 + victim cache | ★★★★☆ |
| `crypto/aes` | [对称加密](./crypto-aes) | AES-GCM AEAD + 密钥派生 | ★★★☆☆ |
| `net/http/httptrace` | [请求追踪](./net-http-trace) | DNS/TCP/TLS 各阶段钩子 + TTFB | ★★★☆☆ |
| `runtime/trace` | [执行追踪](./runtime-trace) | goroutine 调度时间线 + GC 停顿分析 | ★★★☆☆ |
| `math/big` | [任意精度算术](./math-big) | Karatsuba 乘法 + 密码学模幂运算 | ★★★★☆ |
| `encoding/base64` | [Base64 编码](./encoding-base64) | 四种编码器 + JWT + 流式编解码 | ★★☆☆☆ |
| `log` | [标准日志库](./log-pkg) | Mutex 保护 + Fatal/Panic 行为差异 | ★★☆☆☆ |
| `net/smtp` | [邮件发送](./net-smtp) | SMTP 握手 + STARTTLS + MIME 多部分 | ★★★☆☆ |
| `hash/crc32` | [校验和](./hash-crc32) | slicing-by-8 + SSE4.2 硬件加速 | ★★★☆☆ |
| `os/user` | [用户信息](./os-user) | CGO/纯 Go 双后端 + NSS 查询 | ★★☆☆☆ |
| `debug/buildinfo` | [构建信息](./debug-buildinfo) | VCS 信息嵌入 + 二进制审计 | ★★★☆☆ |
| `log/slog` | [结构化日志（深度）](./log-slog-deep) | Handler 接口 + WithAttrs + 动态 Level | ★★★☆☆ |
| `mime/multipart` | [文件上传](./mime-multipart) | 流式解析 + 安全验证 + MIME 构建 | ★★★☆☆ |
| `net/http/cookiejar` | [Cookie 管理](./net-cookiejar) | Public Suffix List + 持久化 + 爬虫 | ★★★☆☆ |
| `sync.Cond` | [条件变量](./sync-cond) | Wait/Signal/Broadcast + for 循环惯用法 | ★★★☆☆ |
| `go/ast`+`go/parser` | [AST 源码解析](./go-ast) | 节点遍历 + 代码分析 + 代码生成 | ★★★★☆ |
| `math/bits` | [位操作](./math-bits) | POPCNT/BSR 指令映射 + 128位算术 | ★★★☆☆ |
| `archive/tar` | [TAR 归档](./archive-tar) | 512字节块格式 + 安全解压 + Docker 层 | ★★★☆☆ |
| `net/rpc` | [远程过程调用](./net-rpc) | gob 编解码 + 序列号并发 + vs gRPC | ★★★☆☆ |
| `io`（高级） | [高级组合模式](./io-advanced) | TeeReader/Pipe/SectionReader/MultiWriter | ★★★☆☆ |
| `text/tabwriter` | [列对齐输出](./text-tabwriter) | 弹性制表符 + kubectl 风格 + 分段 Flush | ★★☆☆☆ |
| `go/format` | [代码格式化](./go-format) | AST 往返 + 代码生成格式化 + CI 检查 | ★★★☆☆ |
| `bufio`（高级） | [高级缓冲 IO](./bufio-advanced) | 自定义 SplitFunc + Peek 嗅探 + 协议解析 | ★★★☆☆ |
| `database/sql` | [连接池与事务](./database-sql) | LIFO 连接池 + defer Rollback + 自定义 Scanner | ★★★★☆ |
| `crypto/tls` | [TLS 握手与证书](./crypto-tls) | TLS 1.3 握手 + mTLS + 证书热更新 | ★★★★☆ |
| `encoding/binary` | [字节序与协议帧](./encoding-binary) | BigEndian/LittleEndian + 协议解析 + varint | ★★★☆☆ |
| `html/template` | [安全模板引擎](./html-template) | 上下文感知转义 + XSS 防护 + 模板继承 | ★★★☆☆ |
| `net/http/httputil` | [反向代理](./net-httputil) | ReverseProxy + 负载均衡 + DumpRequest 调试 | ★★★★☆ |
| `compress/gzip` | [流式压缩](./compress-gzip) | DEFLATE 封装 + Pool 复用 + HTTP 响应压缩 | ★★★☆☆ |
| `unicode/utf8` | [字符编码](./unicode-utf8) | rune 解码 + 安全截断 + 编码校验修复 | ★★★☆☆ |
| `os/signal` | [信号处理](./os-signal) | 优雅关闭 + SIGHUP 热重载 + K8s 终止流程 | ★★★☆☆ |
| `runtime/pprof` | [性能剖析](./runtime-pprof) | CPU/堆/goroutine Profile + 火焰图 + 持续剖析 | ★★★★☆ |
| `crypto/x509` | [证书与 PKI](./crypto-x509) | 证书链验证 + 自签名 CA + CSR 流程 | ★★★★☆ |
| `net/netip` | [现代 IP 地址](./net-netip) | 零分配 + 可作 map key + CIDR 路由表 | ★★★☆☆ |
| `unsafe` | [底层指针操作](./unsafe-pkg) | 6 条转换规则 + 零拷贝转换 + 内存布局优化 | ★★★★☆ |
| `encoding/hex` | [十六进制编解码](./encoding-hex) | lookup table + 流式编解码 + HMAC 常量时间比较 | ★★☆☆☆ |
| `crypto/rsa` | [RSA 非对称加密](./crypto-rsa) | OAEP/PSS + 混合加密 + RS256 JWT | ★★★★☆ |
| `slices/maps/cmp` | [泛型标准库](./slices-maps-cmp) | pdqsort + BinarySearch + cmp.Or (Go 1.21+) | ★★★☆☆ |
| `runtime/metrics` | [运行时指标](./runtime-metrics) | 无 STW 采集 + Float64Histogram + Prometheus 集成 | ★★★★☆ |

## 阅读建议

```
建议顺序（由浅入深）

① errors → strings/bytes           （语言基础）
       ↓
② sync → sync/atomic → context     （并发与同步）
       ↓
③ channel → map → goroutine → timer（语言核心机制）
       ↓
④ io → net/http → encoding/json → database/sql  （服务端开发）
       ↓
⑤ reflect                          （框架底层：json/ORM）
       ↓
⑥ runtime（调度 → 内存 → GC）      （深入底层，巩固全局观）
       ↓
⑦ unsafe → log/slog → os → testing （工程实践扩展）
       ↓
⑧ net → sort/slices → strconv → fmt （底层原理与性能）
       ↓
⑨ bufio → regexp → crypto/tls → math/rand （扩展专题）
       ↓
⑩ embed → flag → net/url → runtime/pprof   （工具链与调优）
       ↓
⑪ encoding/binary → compress/gzip → path/filepath → unicode/utf8  （底层基础与编码）
       ↓
⑫ text/template → os/signal → container/heap → time  （工程工具与数据结构）
       ↓
⑬ io/fs → os/exec → encoding/xml → runtime/debug  （系统能力与调试）
       ↓
⑭ crypto/hmac → net/http/httptest → maps/cmp/slices → archive/zip  （安全、测试与现代特性）
       ↓
⑮ encoding/csv → crypto/rand → expvar → container/list  （数据、安全与基础结构）
       ↓
⑯ encoding/gob → sync.Pool → crypto/aes → net/http/httptrace  （序列化、性能与加密）
       ↓
⑰ runtime/trace → math/big → encoding/base64 → log  （追踪、算术与基础工具）
       ↓
⑱ net/smtp → hash/crc32 → os/user → debug/buildinfo  （网络、校验与系统元数据）
       ↓
⑲ log/slog → mime/multipart → net/http/cookiejar → sync.Cond  （日志、上传、会话与并发）
       ↓
⑳ go/ast+go/parser → math/bits → archive/tar → net/rpc  （工具链、位运算与经典协议）
       ↓
㉑ io 高级 → text/tabwriter → go/format → bufio 高级   （IO 高级模式与代码工具）
       ↓
㉒ database/sql → crypto/tls → encoding/binary → html/template  （数据库、安全与模板）
       ↓
㉓ net/http/httputil → compress/gzip → unicode/utf8 → os/signal  （代理、压缩与系统集成）
       ↓
㉔ runtime/pprof → crypto/x509 → net/netip → unsafe  （底层、安全与现代特性）
       ↓
㉕ encoding/hex → crypto/rsa → slices/maps/cmp → runtime/metrics  （加密、泛型与可观测性）
```

## 源码查阅工具

```bash
# 在线查阅（推荐，支持跳转）
https://cs.opensource.google/go/go

# 查看函数定义位置
go doc -src sync.Mutex

# 查看包所有符号
go doc sync
```
