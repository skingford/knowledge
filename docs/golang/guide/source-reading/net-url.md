---
title: net/url 源码精读
description: 精读 net/url 包的 URL 解析结构、Query 编解码原理与路径规范化，理解 Go Web 开发中 URL 处理的底层机制。
---

# net/url：URL 解析源码精读

> 核心源码：`src/net/url/url.go`（约 1300 行）

## 包结构图

```
net/url 包全景
══════════════════════════════════════════════════════════════════

  核心类型
  ├── url.URL        ← URL 的结构化表示
  ├── url.Values     ← Query 参数（map[string][]string）
  └── url.Error      ← 解析错误（含 Op/URL/Err）

  解析函数
  ├── url.Parse(rawURL)          ← 解析绝对/相对 URL
  ├── url.ParseRequestURI(raw)   ← 严格解析（必须是绝对 URI）
  └── url.PathEscape / QueryEscape ← 编码函数

  编解码工具
  ├── url.QueryEscape(s)         ← 编码 Query 值（空格→+）
  ├── url.QueryUnescape(s)       ← 解码（+→空格）
  ├── url.PathEscape(s)          ← 编码路径段（空格→%20）
  └── url.PathUnescape(s)        ← 解码路径

══════════════════════════════════════════════════════════════════
```

---

## 一、URL 结构

```go
// src/net/url/url.go
type URL struct {
    Scheme      string    // "https"
    Opaque      string    // 不透明 URI（如 "mailto:user@example.com"）
    User        *Userinfo // username:password
    Host        string    // "example.com:443"（含端口）
    Path        string    // "/search"（已解码）
    RawPath     string    // 原始路径（含编码，Path 被修改时使用）
    OmitHost    bool      // 省略 host（"///"）
    ForceQuery  bool      // 强制加 "?"（即使 RawQuery 为空）
    RawQuery    string    // "q=go+lang"（未解码）
    Fragment    string    // "section1"（已解码，不传给服务器）
    RawFragment string    // 原始 fragment
}

type Userinfo struct {
    username    string
    password    string
    passwordSet bool
}
```

```
URL 各组成部分对照
══════════════════════════════════════════════════════════════════

  https://alice:secret@example.com:8080/search?q=go#results

  Scheme   = "https"
  User     = Userinfo{username:"alice", password:"secret"}
  Host     = "example.com:8080"
  Path     = "/search"
  RawQuery = "q=go"
  Fragment = "results"

  Hostname() = "example.com"（去掉端口）
  Port()     = "8080"

══════════════════════════════════════════════════════════════════
```

---

## 二、解析流程

```
url.Parse("https://example.com/path?q=go#frag") 流程
══════════════════════════════════════════════════════════════════

  parse(rawURL, viaRequest=false)
       │
       ├── 去除 Fragment（#后的部分）
       │
       ├── 提取 Scheme（查找第一个 "://"）
       │       "https" → url.Scheme
       │
       ├── 分割 Authority（// 后到第一个 /? 之前）
       │       "example.com" → parseAuthority()
       │             ├── 提取 Userinfo（@ 前）
       │             └── 提取 Host（含端口）
       │
       ├── 提取 RawQuery（? 后到 # 前）
       │
       ├── 解析 Path
       │       ├── 调用 unescape(path, encodePath)
       │       ├── 规范化（去除 ./ 和 ../）
       │       └── 验证合法性
       │
       └── 返回 *URL

══════════════════════════════════════════════════════════════════
```

---

## 三、url.Values 与 Query 编解码

```go
// Values 本质是 map[string][]string（支持同名多值）
type Values map[string][]string

// 解析 Query 字符串
func ParseQuery(query string) (Values, error)

// 编码回 Query 字符串（key 排序，确定性输出）
func (v Values) Encode() string
```

```
Query 编码规则（RFC 3986 + application/x-www-form-urlencoded）
══════════════════════════════════════════════════════════════════

  QueryEscape（表单编码）：
  ├── 空格 → "+"（HTML 表单传统）
  ├── 特殊字符 → %XX
  └── 字母数字和 -_.~ → 不编码

  PathEscape（路径编码）：
  ├── 空格 → "%20"（RFC 3986 路径规范）
  ├── "/" → "%2F"（路径分隔符需转义）
  └── 字母数字和 -_.~!$&'()*+,;=:@ → 不编码（路径允许字符）

  示例：
  url.QueryEscape("hello world")  = "hello+world"
  url.PathEscape("hello world")   = "hello%20world"
  url.QueryEscape("a=1&b=2")      = "a%3D1%26b%3D2"

══════════════════════════════════════════════════════════════════
```

---

## 四、URL 构建与修改

```go
// url.URL.String() 重新组装 URL
func (u *URL) String() string {
    var buf strings.Builder
    if u.Scheme != "" {
        buf.WriteString(u.Scheme)
        buf.WriteByte(':')
    }
    if u.Opaque != "" {
        buf.WriteString(u.Opaque)
    } else {
        if u.Scheme != "" || u.Host != "" || u.User != nil {
            buf.WriteString("//")
            if ui := u.User; ui != nil {
                buf.WriteString(ui.String())
                buf.WriteByte('@')
            }
            if h := u.Host; h != "" {
                buf.WriteString(escape(h, encodeHost))
            }
        }
        // ... Path, Query, Fragment
    }
    return buf.String()
}
```

---

## 五、代码示例

### URL 解析与访问

```go
u, err := url.Parse("https://alice:secret@example.com:8443/api/v1/users?page=2&limit=10#section")
if err != nil {
    log.Fatal(err)
}

fmt.Println(u.Scheme)          // https
fmt.Println(u.Host)            // example.com:8443
fmt.Println(u.Hostname())      // example.com
fmt.Println(u.Port())          // 8443
fmt.Println(u.Path)            // /api/v1/users
fmt.Println(u.RawQuery)        // page=2&limit=10
fmt.Println(u.Fragment)        // section

// 用户信息
fmt.Println(u.User.Username()) // alice
pw, _ := u.User.Password()
fmt.Println(pw)                // secret
```

### Query 参数操作

```go
// 解析 Query
u, _ := url.Parse("https://api.example.com/search?q=golang&page=1&tag=web&tag=api")
q := u.Query() // url.Values（解析 RawQuery）

fmt.Println(q.Get("q"))        // "golang"（取第一个值）
fmt.Println(q.Get("page"))     // "1"
fmt.Println(q["tag"])          // ["web", "api"]（同名多值）

// 修改 Query 并重新生成 URL
q.Set("page", "2")
q.Add("tag", "tutorial")
q.Del("q")
u.RawQuery = q.Encode()        // "page=2&tag=api&tag=tutorial&tag=web"
fmt.Println(u.String())
```

### URL 构建（安全拼接）

```go
// ❌ 字符串拼接（参数未编码，可能注入）
baseURL := "https://api.example.com/search?q=" + userInput

// ✅ 使用 url.Values 安全编码
func buildSearchURL(query string, page, limit int) string {
    u := &url.URL{
        Scheme: "https",
        Host:   "api.example.com",
        Path:   "/search",
    }
    q := url.Values{}
    q.Set("q", query)
    q.Set("page", strconv.Itoa(page))
    q.Set("limit", strconv.Itoa(limit))
    u.RawQuery = q.Encode()
    return u.String()
}

// buildSearchURL("golang & go", 2, 20)
// → "https://api.example.com/search?limit=20&page=2&q=golang+%26+go"
```

### 相对 URL 解析（ResolveReference）

```go
// 相对 URL 解析（浏览器导航逻辑）
base, _ := url.Parse("https://example.com/docs/guide/")
rel, _ := url.Parse("../api/reference#section2")

resolved := base.ResolveReference(rel)
fmt.Println(resolved) // https://example.com/docs/api/reference#section2
```

### 路径规范化

```go
// url.URL 自动规范化路径（处理 ./ 和 ../）
u, _ := url.Parse("https://example.com/a/b/../c/./d")
fmt.Println(u.Path) // /a/c/d（已规范化）

// 路径编码/解码
path := url.PathEscape("/user name/profile") // "%2Fuser%20name%2Fprofile"
decoded, _ := url.PathUnescape(path)          // "/user name/profile"
```

### 提取并验证 URL（安全场景）

```go
// 验证用户提供的 URL（防止 SSRF）
func validateURL(rawURL string) (*url.URL, error) {
    u, err := url.ParseRequestURI(rawURL) // 严格模式，必须是绝对 URI
    if err != nil {
        return nil, fmt.Errorf("invalid URL: %w", err)
    }
    // 只允许 https
    if u.Scheme != "https" {
        return nil, fmt.Errorf("only https URLs allowed, got %q", u.Scheme)
    }
    // 防止 SSRF：禁止私有地址
    if isPrivateHost(u.Hostname()) {
        return nil, fmt.Errorf("private hosts not allowed")
    }
    return u, nil
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| url.Parse 和 ParseRequestURI 的区别？ | Parse 接受相对 URL；ParseRequestURI 要求绝对 URI（必须有 Scheme），常用于服务端校验 |
| QueryEscape 和 PathEscape 的区别？ | QueryEscape 空格→+（表单传统）；PathEscape 空格→%20（路径规范），/ 也被编码 |
| url.Values 如何处理同名参数？ | map[string][]string；Get() 取第一个，["key"] 取全部，Add() 追加 |
| url.URL.String() 一定可以重现原始 URL 吗？ | 不一定：Path 被规范化（./ ../去除）；Query 参数可能重新排序 |
| RawPath 和 Path 有什么区别？ | Path 是解码后的路径；若编码有歧义（如路径段含 %2F），保留 RawPath 原始形式 |
| 如何防止 URL 拼接导致的注入？ | 参数必须通过 url.Values.Set() 后 Encode()，不直接字符串拼接 |
