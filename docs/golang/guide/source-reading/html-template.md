---
title: html/template 源码精读
description: 精读 html/template 的自动 XSS 防护机制，掌握上下文感知转义、模板继承、与 text/template 的区别及安全渲染最佳实践。
---

# html/template：安全模板引擎源码精读

> 核心源码：`src/html/template/template.go`、`src/html/template/escape.go`

## 包结构图

```
html/template 体系
══════════════════════════════════════════════════════════════════

  核心安全特性：上下文感知自动转义（Context-Aware Auto-Escaping）
  输出上下文    → 转义策略
  ──────────    ──────────
  HTML 内容  → < → &lt;  > → &gt;  & → &amp;
  HTML 属性  → " → &#34;  ' → &#39;（防属性注入）
  URL 参数   → 特殊字符 URL 编码（过滤 javascript: 协议）
  JS 字符串  → 换行/引号/反斜杠转义（防 JS 注入）
  CSS 属性   → expression/url() 等危险值过滤

  与 text/template 的关系：
  html/template 包装了 text/template，相同 API，但：
  - 所有 . 输出自动按上下文转义
  - URL 类型：template.URL 可跳过 URL 转义
  - JS 类型：template.JS 可跳过 JS 转义（谨慎使用）
  - 安全类型：template.HTML/JS/URL/CSS/Attr（标记为已安全）

  模板组织：
  - template.New(name).Parse(text)   单模板
  - template.ParseFiles(files...)    从文件加载
  - template.ParseGlob("*.html")     通配符加载
  - define/block/template 指令       模板复用与继承

  函数注册：
  template.FuncMap{"funcName": func(...) ...}

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/html/template/escape.go（简化）

// 上下文感知转义：在解析模板时静态分析每个输出点的上下文
// 并插入对应的转义函数

// 例：模板 `<a href="MYURL">MYNAME</a>`
// 被自动改写为：
// `<a href="MYURL | urlfilter | urlescaper">MYNAME | htmlescaper</a>`

// 转义函数映射（按上下文）：
var escapeMap = map[state][]string{
    stateText: {"_html_template_htmlescaper"},   // HTML 内容
    stateAttr: {"_html_template_attrescaper"},   // HTML 属性值
    stateURL:  {"_html_template_urlescaper"},    // URL 上下文
    stateJS:   {"_html_template_jsvalescaper"},  // JS 上下文
    stateCSS:  {"_html_template_cssvalescaper"}, // CSS 上下文
}
```

---

## 二、代码示例

### 基础：自动 XSS 防护

```go
import (
    "html/template"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    // 攻击者输入：包含 XSS payload
    // userInput = "<script>alert('xss')</script>"
    userInput := r.URL.Query().Get("name")

    const tmplText = `
        <html><body>
        <h1>Hello, {{.}}!</h1>
        </body></html>
    `
    tmpl := template.Must(template.New("").Parse(tmplText))

    // 自动转义：<script> → &lt;script&gt;（无 XSS 风险）
    tmpl.Execute(w, userInput)
}
```

### 上下文感知转义演示

```go
// 不同 HTML 上下文的转义策略不同
const multiContextTmpl = `
<html>
  <body>
    <!-- HTML 内容上下文：html 转义 -->
    <p>{{.Content}}</p>

    <!-- HTML 属性上下文：属性转义 -->
    <div class="{{.ClassName}}">

    <!-- URL 上下文：URL 编码 + 协议过滤 -->
    <a href="/search?q={{.Query}}">搜索</a>

    <!-- JS 上下文：JS 字符串转义 -->
    <script>var name = "{{.JSVar}}";</script>
  </body>
</html>
`

data := struct {
    Content   string
    ClassName string
    Query     string
    JSVar     string
}{
    // 输出: &lt;b&gt;bold&lt;/b&gt; &amp; &#34;quoted&#34;
    Content:   "<b>bold</b> & \"quoted\"",
    // 输出: btn&#34; onclick&#61;&#34;evil()
    ClassName: `btn" onclick="evil()`,
    // 输出: hello%20world%20%26%20more
    Query:     "hello world & more",
    // 输出: he said \x22hi\x22\nbye
    JSVar:     `he said "hi"\nbye`,
}

tmpl := template.Must(template.New("").Parse(multiContextTmpl))
tmpl.Execute(os.Stdout, data)
```

### 模板继承（base layout + 页面填充）

```go
// base.html：基础布局模板
// 使用 define/block 实现继承
const baseHTML = `
{{- define "base" -}}
<!DOCTYPE html>
<html>
<head><title>{{block "title" .}}默认标题{{end}}</title></head>
<body>
  <nav>{{template "nav" .}}</nav>
  <main>{{block "content" .}}{{end}}</main>
  <footer>{{template "footer" .}}</footer>
</body>
</html>
{{- end -}}
{{- define "nav" -}}<a href="/">首页</a>{{- end -}}
{{- define "footer" -}}© 2024 My Site{{- end -}}
`

// page.html：子模板覆盖 block
const pageHTML = `
{{- template "base" . -}}
{{- define "title" -}}用户列表{{- end -}}
{{- define "content" -}}
<h1>用户列表</h1>
<ul>
{{- range .Users}}
  <li>{{.Name}} - {{.Email}}</li>
{{- end}}
</ul>
{{- end -}}
`

func renderPage(w io.Writer, users []User) error {
    tmpl := template.New("base")
    template.Must(tmpl.Parse(baseHTML))
    template.Must(tmpl.Parse(pageHTML))
    return tmpl.ExecuteTemplate(w, "base", map[string]any{"Users": users})
}
```

### 自定义模板函数

```go
var funcMap = template.FuncMap{
    "formatTime": func(t time.Time) string {
        return t.Format("2006-01-02 15:04")
    },
    "truncate": func(s string, n int) string {
        r := []rune(s)
        if len(r) <= n {
            return s
        }
        return string(r[:n]) + "..."
    },
    // ⚠️ safeHTML：仅用于已确认安全的内容（如经 sanitize 处理的富文本）
    "safeHTML": func(s string) template.HTML {
        return template.HTML(s)
    },
}

const articleTmpl = `
<p>发布于 {{formatTime .CreatedAt}}</p>
<p>{{truncate .Content 100}}</p>
<div>{{safeHTML .SanitizedBody}}</div>
`

tmpl := template.Must(template.New("").Funcs(funcMap).Parse(articleTmpl))
```

### 从 embed 加载模板（单二进制部署）

```go
//go:embed templates/*.html
var templateFS embed.FS

// 全局模板（仅解析一次，避免重复开销）
var tmpl = func() *template.Template {
    t := template.New("").Funcs(funcMap)
    return template.Must(t.ParseFS(templateFS, "templates/*.html"))
}()

func renderHandler(w http.ResponseWriter, r *http.Request) {
    data := map[string]any{
        "Title": "首页",
        "User":  currentUser(r),
    }
    if err := tmpl.ExecuteTemplate(w, "index.html", data); err != nil {
        log.Printf("模板渲染失败: %v", err)
        http.Error(w, "Internal Server Error", 500)
    }
}
```

### 安全类型：标记已经过处理的内容

```go
// template.HTML：告知引擎此内容已安全，跳过 HTML 转义
// ⚠️ 仅在确认内容来自可信来源时使用
func renderRichText(w io.Writer, sanitizedHTML string) error {
    const tmplText = `<div class="content">{{.Body}}</div>`
    tmpl := template.Must(template.New("").Parse(tmplText))

    return tmpl.Execute(w, struct {
        Body template.HTML // 标记为安全，不会被转义
    }{
        Body: template.HTML(sanitizedHTML),
    })
}

// template.URL：跳过 URL 过滤（用于已验证的动态 URL）
func renderLink(w io.Writer, trustedURL string) error {
    const tmplText = `<a href="{{.}}">链接</a>`
    tmpl := template.Must(template.New("").Parse(tmplText))
    return tmpl.Execute(w, template.URL(trustedURL))
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `html/template` 和 `text/template` 的核心区别？ | html/template 在解析时静态分析上下文，自动插入对应转义函数；text/template 不做任何转义，直接输出原始文本 |
| 上下文感知转义如何工作？ | 模板解析时用状态机追踪每个输出点所在的 HTML 上下文（内容/属性/URL/JS/CSS），为每个输出点选择正确的转义函数 |
| `template.HTML` 类型什么时候安全使用？ | 仅当内容来自可信来源或经过严格 sanitize 处理后；直接将用户输入转为 `template.HTML` 会导致 XSS |
| `javascript:` 注入如何防护？ | URL 上下文的输出经过 `_html_template_urlfilter` 过滤，检测并过滤 `javascript:`/`vbscript:` 协议前缀 |
| 模板继承用 `block` 还是 `template`？ | `block "name"` 定义可覆盖区域（有默认值）；子模板用 `define "name"` 覆盖；`template "name"` 是纯引用（无默认值） |
| 为什么模板应该全局解析一次？ | `template.ParseFiles` 读取文件并解析 AST，有 IO 和 CPU 开销；生产中应在启动时解析并全局复用 |
