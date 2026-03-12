---
title: go/format 源码精读
description: 精读 go/format 的代码格式化实现，掌握 gofmt 规范化、AST 往返、代码生成工具的格式化最佳实践。
---

# go/format：代码格式化源码精读

> 核心源码：`src/go/format/format.go`、`src/go/printer/printer.go`

## 包结构图

```
Go 代码格式化工具链
══════════════════════════════════════════════════════════════════

  go/format（用户 API）
  ├── format.Source(src []byte) ([]byte, error)
  │    └── 格式化完整 Go 源文件（等价于 gofmt）
  └── format.Node(dst io.Writer, fset *token.FileSet, node any) error
       └── 格式化单个 AST 节点（片段格式化）

  内部调用链：
  go/format → go/printer.Fprint → 将 AST 节点输出为格式化文本

  go/printer（核心实现）：
  ├── 控制缩进（Tab 字符，gofmt 标准）
  ├── 行长度超过阈值时自动换行
  ├── 注释关联到 AST 节点（保持注释位置）
  └── 空白行保留（最多 2 个连续空行）

  使用场景：
  ├── 代码生成工具（生成后自动格式化）
  ├── 语言服务器（gopls 实时格式化）
  ├── CI/CD 检查（格式不符合则拒绝合并）
  └── 编辑器插件（保存时自动 gofmt）

  相关工具：
  ├── gofmt    ← 命令行格式化（go/format 封装）
  ├── goimports ← gofmt + 自动 import 管理
  └── gofumpt  ← 更严格的 gofmt 超集

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/go/format/format.go（简化）
func Source(src []byte) ([]byte, error) {
    fset := token.NewFileSet()

    // 1. 解析为 AST（允许不完整的源文件）
    file, err := parser.ParseFile(fset, "", src,
        parser.ParseComments)  // 保留注释
    if err != nil {
        return nil, err
    }

    // 2. AST → 格式化文本
    var buf bytes.Buffer
    if err := printer.Fprint(&buf, fset, file); err != nil {
        return nil, err
    }
    return buf.Bytes(), nil
}

// Node 格式化单个节点（不需要完整文件）
func Node(dst io.Writer, fset *token.FileSet, node any) error {
    return printer.Fprint(dst, fset, node)
}

// go/printer.Fprint：AST 到文本的核心转换
// 遍历 AST 节点，按节点类型输出对应的 Go 语法
// 特殊处理：注释、分号插入、括号、缩进
```

---

## 二、代码示例

### 格式化 Go 源码

```go
import (
    "go/format"
    "fmt"
)

func formatSource() {
    // 未格式化的 Go 代码（缩进错误、空格不规范）
    ugly := []byte(`
package main
import "fmt"
func main() {
fmt.Println( "Hello" )
    x:=1+2
    if x>0{
fmt.Println(x)
}}
`)

    pretty, err := format.Source(ugly)
    if err != nil {
        panic(err)
    }
    fmt.Println(string(pretty))
    // 输出：
    // package main
    //
    // import "fmt"
    //
    // func main() {
    //     fmt.Println("Hello")
    //     x := 1 + 2
    //     if x > 0 {
    //         fmt.Println(x)
    //     }
    // }
}
```

### 代码生成：生成结构体并格式化

```go
import (
    "go/ast"
    "go/format"
    "go/token"
    "bytes"
)

// 动态生成 Go 代码（AST 构建方式）
func generateStruct(pkgName, typeName string, fields map[string]string) ([]byte, error) {
    fset := token.NewFileSet()

    // 构建 AST
    fieldList := make([]*ast.Field, 0, len(fields))
    for name, typ := range fields {
        fieldList = append(fieldList, &ast.Field{
            Names: []*ast.Ident{{Name: name}},
            Type:  &ast.Ident{Name: typ},
        })
    }

    file := &ast.File{
        Name: &ast.Ident{Name: pkgName},
        Decls: []ast.Decl{
            &ast.GenDecl{
                Tok: token.TYPE,
                Specs: []ast.Spec{
                    &ast.TypeSpec{
                        Name: &ast.Ident{Name: typeName},
                        Type: &ast.StructType{
                            Fields: &ast.FieldList{List: fieldList},
                        },
                    },
                },
            },
        },
    }

    // AST → 格式化代码
    var buf bytes.Buffer
    if err := format.Node(&buf, fset, file); err != nil {
        return nil, err
    }
    return buf.Bytes(), nil
}

// 输出：
// package models
//
// type User struct {
//     Name  string
//     Age   int
//     Email string
// }
```

### 文本模板 + 格式化（代码生成最常见模式）

```go
import (
    "go/format"
    "bytes"
    "text/template"
)

// 用模板生成代码，再用 go/format 格式化（比手写 AST 简单）
const enumTemplate = `
package {{.Package}}

type {{.TypeName}} int

const (
{{- range $i, $v := .Values}}
    {{$v}} {{if eq $i 0}}{{$.TypeName}} = iota{{end}}
{{- end}}
)

func (e {{.TypeName}}) String() string {
    names := []string{ {{range .Values}}"{{.}}",{{end}} }
    if int(e) < len(names) {
        return names[e]
    }
    return "Unknown"
}
`

type EnumDef struct {
    Package  string
    TypeName string
    Values   []string
}

func generateEnum(def EnumDef) ([]byte, error) {
    tmpl, err := template.New("enum").Parse(enumTemplate)
    if err != nil {
        return nil, err
    }

    var buf bytes.Buffer
    if err := tmpl.Execute(&buf, def); err != nil {
        return nil, err
    }

    // 关键：格式化生成的代码（模板输出通常缩进不规范）
    return format.Source(buf.Bytes())
}

// 使用
code, _ := generateEnum(EnumDef{
    Package:  "status",
    TypeName: "Status",
    Values:   []string{"Pending", "Active", "Inactive"},
})
os.WriteFile("status_gen.go", code, 0644)
```

### CI 格式检查

```go
// 检查文件是否符合 gofmt 格式（CI 流水线中常用）
func checkFormat(filePath string) error {
    src, err := os.ReadFile(filePath)
    if err != nil {
        return err
    }

    formatted, err := format.Source(src)
    if err != nil {
        return fmt.Errorf("语法错误: %w", err)
    }

    if !bytes.Equal(src, formatted) {
        return fmt.Errorf("文件 %s 未按 gofmt 格式化，请运行 gofmt -w %s", filePath, filePath)
    }
    return nil
}

// 批量检查目录
func checkDirFormat(dir string) []string {
    var unformatted []string
    filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
        if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") {
            return err
        }
        if err := checkFormat(path); err != nil {
            unformatted = append(unformatted, path)
        }
        return nil
    })
    return unformatted
}
```

### 格式化代码片段（不完整文件）

```go
// 格式化函数体片段（非完整文件）
func formatFragment(stmts string) (string, error) {
    // 包裹成完整文件后格式化，再提取内容
    src := fmt.Sprintf("package p\nfunc _(){\n%s\n}", stmts)
    formatted, err := format.Source([]byte(src))
    if err != nil {
        return "", err
    }

    // 去掉包装的外层
    result := string(formatted)
    start := strings.Index(result, "func _()") + len("func _(){\n")
    end := strings.LastIndex(result, "\n}")
    if start < 0 || end < 0 {
        return result, nil
    }

    // 去除多余缩进
    lines := strings.Split(result[start:end], "\n")
    for i, line := range lines {
        lines[i] = strings.TrimPrefix(line, "\t")
    }
    return strings.Join(lines, "\n"), nil
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `go/format` 和 `go/printer` 的区别？ | `go/format` 是用户 API（封装了 parse + print）；`go/printer` 是底层实现（只做 AST → 文本），直接操作 AST 节点时用 printer |
| `format.Source` 如何保留注释？ | 解析时传 `parser.ParseComments`，注释被关联到 AST 节点；`printer` 按注释原始位置插入到输出中 |
| 代码生成为什么要格式化？ | 模板生成的代码缩进往往不规范；格式化后代码可读性好，且符合 gofmt 规范，不会触发 CI 格式检查失败 |
| `format.Node` 和 `format.Source` 的区别？ | Source 处理完整 Go 文件（`[]byte` 输入）；Node 格式化单个 AST 节点（适合只格式化部分代码）|
| gofmt 格式化规则中最重要的几点？ | Tab 缩进（非空格）、运算符两侧空格、大括号不换行（K&R 风格）、import 分组（标准库/第三方）|
| 为什么 Go 社区强制使用 gofmt？ | 消除代码风格争议；统一格式便于 diff 和 code review；机器生成代码和人写代码格式一致 |
