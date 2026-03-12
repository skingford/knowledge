---
title: text/template 源码精读
description: 精读 text/template 的模板解析与执行机制，理解 Action、Pipeline、FuncMap 的设计哲学与 html/template 的安全转义。
---

# text/template：模板引擎源码精读

> 核心源码：`src/text/template/parse/`、`src/text/template/exec.go`、`src/text/template/funcs.go`

## 包结构图

```
text/template 与 html/template 关系
══════════════════════════════════════════════════════════════════

  text/template（通用模板，无转义）
  ├── Template       ← 已解析模板集合（支持多模板互引）
  ├── Parse          ← 词法 + 语法分析 → AST
  ├── Execute        ← AST 遍历 + 数据绑定 → 输出
  └── FuncMap        ← 自定义函数注入

  html/template（HTML 安全，推荐 Web 使用）
  └── 嵌套 text/template，对输出自动做上下文感知转义：
      ├── HTML 文本内容  → html.EscapeString
      ├── HTML 属性值   → 额外处理引号
      ├── URL 参数      → url.QueryEscape
      └── JS 字符串     → json.Marshal 风格转义

  解析流程：
  模板字符串
       │
       ▼
  Lexer（词法）─── 识别 {{、}}、文字、字段、管道...
       │
       ▼
  Parser（语法）── 构建 AST（ActionNode/TextNode/RangeNode...）
       │
       ▼
  Template.Tree   ← 保存 AST
       │
  Execute(w, data)
       │
       ▼
  state.walk(value, node) ← 递归遍历 AST，数据绑定输出

══════════════════════════════════════════════════════════════════
```

---

## 一、核心数据结构

```go
// src/text/template/template.go
type Template struct {
    name string
    *parse.Tree                   // AST
    *common                       // 共享模板集合（关联模板）
    leftDelim  string             // 左定界符，默认 {{
    rightDelim string             // 右定界符，默认 }}
}

type common struct {
    tmpl   map[string]*Template   // 同名模板集合
    muTmpl sync.RWMutex
    option option
    muFuncs sync.RWMutex
    parseFuncs FuncMap            // 解析阶段注册
    execFuncs  map[string]reflect.Value // 执行阶段调用
}

// 执行状态（每次 Execute 创建一个）
type state struct {
    tmpl *Template
    wr   io.Writer
    node parse.Node  // 当前节点（用于错误报告）
    vars []variable  // 变量栈（{{$x := ...}}）
    depth int        // 递归深度（防止无限模板调用）
}
```

---

## 二、Action 语法速查

```
Action 完整语法表
══════════════════════════════════════════════════════════════════

  {{.}}              当前数据（dot）
  {{.Field}}         字段访问（struct field / map key）
  {{.Method arg}}    方法调用（必须返回 1 或 2 个值，第2个为 error）
  {{$x}}             变量引用
  {{$x := expr}}     变量声明/赋值

  控制结构：
  ├── {{if pipeline}} ... {{else if}} ... {{else}} ... {{end}}
  ├── {{range pipeline}} ... {{else}} ... {{end}}
  │       range 可遍历：array/slice/map/channel
  │       {{range $k, $v := .}}  绑定 key/index 和 value
  ├── {{with pipeline}} ... {{else}} ... {{end}}
  │       with：pipeline 非零时执行，dot 变为 pipeline 值
  └── {{template "name" pipeline}}  调用子模板，传入新 dot

  模板定义：
  ├── {{define "name"}} ... {{end}}
  └── {{block "name" pipeline}} ... {{end}}
      block = define + 立即调用（可被子模板覆盖）

  管道（Pipeline）：
  value | func1 | func2 arg    ← 前一个输出作为后一个最后一个参数
  "hello" | upper | printf "%s!" → "HELLO!"

══════════════════════════════════════════════════════════════════
```

---

## 三、执行核心（eval 机制）

```go
// src/text/template/exec.go（简化）
func (s *state) evalCall(dot, fun reflect.Value, node parse.Node,
    name string, args []parse.Node, final reflect.Value) reflect.Value {

    // 构建参数列表
    numIn := fun.Type().NumIn()
    argv := make([]reflect.Value, numIn)
    // ... 参数类型适配 ...

    // 调用函数（通过反射）
    result := fun.Call(argv)

    // 如果函数返回 error，检查错误
    if len(result) == 2 && !result[1].IsNil() {
        s.at(node)
        s.errorf("error calling %s: %v", name, result[1].Interface())
    }
    return result[0]
}

// range 节点执行
func (s *state) walkRange(dot reflect.Value, r *parse.RangeNode) {
    val, _ := indirect(s.evalPipeline(dot, r.Pipe))
    switch val.Kind() {
    case reflect.Slice, reflect.Array:
        for i := 0; i < val.Len(); i++ {
            // 设置 $index, $value 变量，递归 walk
        }
    case reflect.Map:
        // 对 map key 排序（保证输出稳定）
        keys := sortKeys(val.MapKeys())
        for _, key := range keys { /* ... */ }
    }
}
```

---

## 四、代码示例

### 基础模板渲染

```go
package main

import (
    "os"
    "text/template"
)

type Person struct {
    Name string
    Age  int
    Tags []string
}

const tmplStr = `姓名: {{.Name}}
年龄: {{.Age}}
标签:
{{- range .Tags}}
  - {{.}}
{{- end}}
{{if gt .Age 18}}成年人{{else}}未成年人{{end}}`

func main() {
    tmpl := template.Must(template.New("person").Parse(tmplStr))
    p := Person{Name: "Alice", Age: 25, Tags: []string{"Go", "后端", "微服务"}}
    tmpl.Execute(os.Stdout, p)
}
// 输出:
// 姓名: Alice
// 年龄: 25
// 标签:
//   - Go
//   - 后端
//   - 微服务
// 成年人
```

### 自定义函数（FuncMap）

```go
funcMap := template.FuncMap{
    "upper":    strings.ToUpper,
    "truncate": func(s string, n int) string {
        if len([]rune(s)) <= n {
            return s
        }
        return string([]rune(s)[:n]) + "..."
    },
    "formatTime": func(t time.Time) string {
        return t.Format("2006-01-02")
    },
    "dict": func(values ...any) map[string]any {
        m := make(map[string]any, len(values)/2)
        for i := 0; i < len(values); i += 2 {
            m[values[i].(string)] = values[i+1]
        }
        return m
    },
}

tmpl := template.Must(
    template.New("").Funcs(funcMap).Parse(
        `{{.Title | upper}} - {{.Body | truncate 20}}`,
    ),
)
```

### 多模板定义（define + template）

```go
const layout = `
{{define "base"}}
<!DOCTYPE html>
<html>
<head><title>{{block "title" .}}默认标题{{end}}</title></head>
<body>
  {{template "content" .}}
</body>
</html>
{{end}}

{{define "content"}}
<h1>{{.Title}}</h1>
<p>{{.Body}}</p>
{{end}}
`

// ParseFiles 加载多个文件模板
tmpl, err := template.New("").ParseFiles("layout.html", "page.html")
tmpl.ExecuteTemplate(w, "base", data)
```

### html/template（Web 安全）

```go
import "html/template"

// ✅ 自动转义，防止 XSS
tmpl := template.Must(template.New("safe").Parse(
    `<p>{{.UserInput}}</p>`,
))
// UserInput = "<script>alert('xss')</script>"
// 输出: <p>&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;</p>

// ✅ 信任安全 HTML（显式标记）
type SafeData struct {
    HTML template.HTML // 不被转义
}
data := SafeData{HTML: template.HTML("<b>安全内容</b>")}

// ⚠️ 绝对不要：template.HTML(userInput) ← XSS 漏洞！
```

### 模板缓存（生产级写法）

```go
type TemplateCache map[string]*template.Template

func NewTemplateCache(dir string) (TemplateCache, error) {
    cache := TemplateCache{}

    pages, err := filepath.Glob(filepath.Join(dir, "*.page.html"))
    if err != nil {
        return nil, err
    }

    for _, page := range pages {
        name := filepath.Base(page)
        // 1. 新建模板，注册 FuncMap
        ts, err := template.New(name).Funcs(funcMap).ParseFiles(page)
        if err != nil {
            return nil, err
        }
        // 2. 加入 layout 和 partial
        ts, err = ts.ParseGlob(filepath.Join(dir, "*.layout.html"))
        if err != nil {
            return nil, err
        }
        cache[name] = ts
    }
    return cache, nil
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| text/template 和 html/template 的区别？ | html/template 在 text/template 基础上增加上下文感知自动转义，防止 XSS |
| template.Must 的作用？ | 包装 Parse 结果，解析失败时 panic；适合包级别初始化（init/var 全局变量） |
| range map 的输出顺序是否稳定？ | 稳定！执行时对 map key 排序，保证输出确定性（与 Go map 迭代不同） |
| Pipeline 的参数传递规则？ | 管道前一个值作为下一个函数的**最后一个**参数注入 |
| block 和 define 的区别？ | block = define + 立即调用；子模板可 define 同名 block 来覆盖（模板继承模式）|
| 如何安全地在并发中执行模板？ | Template 解析后不可变，多个 goroutine 并发 Execute 是安全的；仅 Parse/Funcs 需要加锁 |
