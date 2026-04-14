---
title: net/http/cookiejar 源码精读
description: 精读 net/http/cookiejar 的 Cookie 管理实现，掌握 Cookie 存储策略、域名匹配规则、Public Suffix List 与爬虫实践。
---

# net/http/cookiejar：Cookie 管理源码精读

> 核心源码：`src/net/http/cookiejar/jar.go`、`src/net/http/cookiejar/punycode.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`cookiejar-flow`

## 包结构图

```
net/http/cookiejar 体系
══════════════════════════════════════════════════════════════════

  CookieJar（接口）：
  ├── SetCookies(u *url.URL, cookies []*http.Cookie)
  └── Cookies(u *url.URL) []*http.Cookie

  Jar（内置实现）：
  ├── mu      sync.Mutex
  ├── psList  PublicSuffixList  ← 公共后缀列表（防止跨站 Cookie）
  └── entries map[string]map[string]entry
       key: eTLD+1（如 "example.com"）
       inner key: id = scheme + domain + path + name

  entry（单个 Cookie 存储单元）：
  ├── Name, Value  string
  ├── Domain       string   ← ".example.com" 或 "sub.example.com"
  ├── Path         string
  ├── Secure       bool     ← 仅 HTTPS 发送
  ├── HttpOnly     bool
  ├── Persistent   bool     ← 有 Expires/MaxAge 则为持久 Cookie
  ├── Expires      time.Time
  └── Creation     time.Time

  Cookie 匹配规则（发送时过滤）：
  ├── 域名匹配：.example.com 匹配 sub.example.com
  ├── 路径匹配：/api 匹配 /api/v1 （前缀匹配）
  ├── Secure：HTTPS 才发送
  └── 未过期：Expires > now

  Public Suffix List 作用：
  ├── 防止 .com 级别 Cookie（攻击面太大）
  └── golang.org/x/net/publicsuffix 提供实现

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="cookiejar-flow" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/net/http/cookiejar/jar.go（简化）
type Jar struct {
    mu      sync.Mutex
    psList  PublicSuffixList
    entries map[string]map[string]entry // eTLD+1 → id → entry
}

// Cookies：为请求 URL 选取匹配的 Cookie
func (j *Jar) Cookies(u *url.URL) (cookies []*http.Cookie) {
    j.mu.Lock()
    defer j.mu.Unlock()

    key := jarKey(u.Host, j.psList) // 提取 eTLD+1
    submap := j.entries[key]

    now := time.Now()
    for id, e := range submap {
        if !e.shouldSend(now, u.Scheme, u.Host, u.Path) {
            continue // 过滤不匹配的 Cookie
        }
        e.LastAccess = now
        submap[id] = e
        cookies = append(cookies, &http.Cookie{Name: e.Name, Value: e.Value})
    }

    // 按路径长度降序排序（更具体的路径优先）
    sort.Slice(cookies, ...)
    return cookies
}

// SetCookies：处理响应 Set-Cookie Header，存储 Cookie
func (j *Jar) SetCookies(u *url.URL, cookies []*http.Cookie) {
    // 验证 Cookie 域名合法性（不能跨 eTLD+1 设置）
    // 存储到 j.entries[key][id]
}
```
:::

---

## 二、代码示例

### 基础使用：带 Cookie 的 HTTP 客户端

::: details 点击展开代码：基础使用：带 Cookie 的 HTTP 客户端
```go
import (
    "net/http"
    "net/http/cookiejar"
    "golang.org/x/net/publicsuffix"
)

func newClientWithCookies() *http.Client {
    // 使用公共后缀列表（推荐，防止跨站 Cookie 攻击）
    jar, err := cookiejar.New(&cookiejar.Options{
        PublicSuffixList: publicsuffix.List,
    })
    if err != nil {
        panic(err)
    }

    return &http.Client{
        Jar: jar,
        // Cookie 会在请求间自动传递
    }
}

// 模拟登录并保持会话
func loginAndRequest(loginURL, apiURL string) error {
    client := newClientWithCookies()

    // 登录（服务器设置 Set-Cookie: session=xxx）
    resp, err := client.PostForm(loginURL, url.Values{
        "username": {"alice"},
        "password": {"secret"},
    })
    if err != nil {
        return err
    }
    resp.Body.Close()

    // 后续请求自动携带 session Cookie
    resp2, err := client.Get(apiURL)
    if err != nil {
        return err
    }
    defer resp2.Body.Close()

    body, _ := io.ReadAll(resp2.Body)
    fmt.Println(string(body))
    return nil
}
```
:::

### 手动管理 Cookie（自定义 Jar）

::: details 点击展开代码：手动管理 Cookie（自定义 Jar）
```go
// 查看当前 Jar 中存储的 Cookie
func inspectCookies(jar http.CookieJar, targetURL string) {
    u, _ := url.Parse(targetURL)
    cookies := jar.Cookies(u)
    fmt.Printf("URL: %s\n", targetURL)
    for _, c := range cookies {
        fmt.Printf("  %s=%s\n", c.Name, c.Value)
    }
}

// 手动注入 Cookie（模拟已登录状态）
func injectCookie(jar http.CookieJar, targetURL, name, value string) {
    u, _ := url.Parse(targetURL)
    jar.SetCookies(u, []*http.Cookie{
        {
            Name:  name,
            Value: value,
            Path:  "/",
        },
    })
}

// 使用
jar, _ := cookiejar.New(nil)
client := &http.Client{Jar: jar}
injectCookie(jar, "https://example.com", "session", "pre-existing-token")
resp, _ := client.Get("https://example.com/api/profile") // 自动携带 Cookie
```
:::

### Cookie 持久化（跨进程保存）

::: details 点击展开代码：Cookie 持久化（跨进程保存）
```go
// cookiejar 自身不提供持久化，需自己实现
type PersistentJar struct {
    *cookiejar.Jar
    path string
    mu   sync.Mutex
}

func NewPersistentJar(path string) (*PersistentJar, error) {
    jar, err := cookiejar.New(&cookiejar.Options{
        PublicSuffixList: publicsuffix.List,
    })
    if err != nil {
        return nil, err
    }

    pj := &PersistentJar{Jar: jar, path: path}

    // 从文件恢复
    if data, err := os.ReadFile(path); err == nil {
        var cookies []*savedCookie
        if json.Unmarshal(data, &cookies) == nil {
            for _, c := range cookies {
                u, _ := url.Parse(c.URL)
                jar.SetCookies(u, []*http.Cookie{c.Cookie})
            }
        }
    }

    return pj, nil
}

type savedCookie struct {
    URL    string
    Cookie *http.Cookie
}

func (pj *PersistentJar) Save(targetURL string) error {
    pj.mu.Lock()
    defer pj.mu.Unlock()

    u, _ := url.Parse(targetURL)
    cookies := pj.Cookies(u)

    var saved []*savedCookie
    for _, c := range cookies {
        saved = append(saved, &savedCookie{URL: targetURL, Cookie: c})
    }

    data, err := json.MarshalIndent(saved, "", "  ")
    if err != nil {
        return err
    }
    return os.WriteFile(pj.path, data, 0600)
}
```
:::

### 爬虫：多域名 Cookie 管理

::: details 点击展开代码：爬虫：多域名 Cookie 管理
```go
// 爬虫场景：需要维护多个网站的独立会话
type Spider struct {
    clients map[string]*http.Client // domain → client
    mu      sync.Mutex
}

func NewSpider() *Spider {
    return &Spider{clients: make(map[string]*http.Client)}
}

func (s *Spider) ClientFor(domain string) *http.Client {
    s.mu.Lock()
    defer s.mu.Unlock()

    if client, ok := s.clients[domain]; ok {
        return client
    }

    jar, _ := cookiejar.New(&cookiejar.Options{
        PublicSuffixList: publicsuffix.List,
    })

    client := &http.Client{
        Jar: jar,
        Timeout: 30 * time.Second,
        CheckRedirect: func(req *http.Request, via []*http.Request) error {
            // 跨域重定向时不携带原始 Cookie
            if len(via) > 0 && req.URL.Host != via[0].URL.Host {
                req.Header.Del("Cookie")
            }
            return nil
        },
    }

    s.clients[domain] = client
    return client
}

// 使用
spider := NewSpider()
client := spider.ClientFor("example.com")
client.Get("https://example.com/login")
// 每个域名独立的 Cookie 存储
```
:::

### Public Suffix List 的作用

::: details 点击展开代码：Public Suffix List 的作用
```go
// 演示：为什么需要 Public Suffix List
func demonstratePSL() {
    // 没有 PSL：攻击者可以在 .com 级别设置 Cookie，影响所有 .com 网站
    // ❌ 危险：Set-Cookie: session=evil; Domain=.com
    //    → 访问 bank.com 时也会发送这个 Cookie

    // ✅ 有 PSL：cookiejar 拒绝在 eTLD（.com）级别设置 Cookie
    // eTLD+1 = "example.com"（在这个级别才允许设置 Cookie）

    // 检查 eTLD+1
    etldPlus1, _ := publicsuffix.EffectiveTLDPlusOne("sub.example.com")
    fmt.Println(etldPlus1) // "example.com"

    etldPlus1, _ = publicsuffix.EffectiveTLDPlusOne("sub.example.co.uk")
    fmt.Println(etldPlus1) // "example.co.uk"（.co.uk 是 eTLD）
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| cookiejar 为什么需要 Public Suffix List？ | 防止攻击者在 `.com` 等顶级域设置 Cookie 影响所有子域；PSL 定义了"有效顶级域+1"（eTLD+1）作为 Cookie 设置的最高层级 |
| Cookie 的 Domain 字段 `.example.com` vs `example.com`？ | 前者（带点）匹配所有子域（sub.example.com）；后者只精确匹配该主机；cookiejar 内部统一规范化 |
| cookiejar 本身是否持久化？ | 不持久化，仅在内存中。需要自己实现序列化逻辑（JSON + 文件）或用第三方库 |
| Secure Cookie 在 HTTP 下会发送吗？ | 不会。cookiejar 在 `shouldSend` 中检查 Scheme，`http://` 下过滤掉 Secure Cookie |
| 多 goroutine 共享同一个 `*http.Client` 安全吗？ | 安全。`http.Client`、`cookiejar.Jar` 内部都用 Mutex 保护并发访问 |
| 如何为不同网站维护独立 Cookie？ | 为每个域名创建独立的 `*http.Client`（含独立 Jar）；同一 Client 的 Jar 会自动按域名分组管理 |
