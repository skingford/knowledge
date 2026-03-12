---
title: go/ast + go/parser 源码精读
description: 精读 go/ast 与 go/parser 的 Go 源码解析实现，掌握 AST 节点遍历、代码分析工具开发与代码生成实践。
---

# go/ast + go/parser：源码解析与 AST 精读

> 核心源码：`src/go/ast/ast.go`、`src/go/parser/parser.go`、`src/go/token/token.go`

## 包结构图

```
Go AST 工具链
══════════════════════════════════════════════════════════════════

  源码 → go/scanner → Token 流 → go/parser → AST → go/ast

  三个核心包：
  ├── go/token  ← Token 类型、FileSet（位置信息管理）
  ├── go/parser ← 将源码解析为 AST
  └── go/ast    ← AST 节点定义 + 遍历工具

  AST 主要节点类型：
  File（整个文件）
  └── Decls []Decl（顶层声明）
       ├── GenDecl（import/const/type/var）
       │    └── Specs []Spec
       │         ├── ImportSpec  ← import "fmt"
       │         ├── ValueSpec   ← const/var
       │         └── TypeSpec    ← type Foo struct{...}
       └── FuncDecl（函数/方法声明）
            ├── Name *Ident       ← 函数名
            ├── Type *FuncType    ← 参数和返回值
            └── Body *BlockStmt  ← 函数体

  语句（Stmt）：
  ├── AssignStmt  ← x := 1
  ├── IfStmt      ← if x > 0 {}
  ├── ForStmt     ← for i := 0; ...
  ├── RangeStmt   ← for k, v := range m {}
  └── ReturnStmt  ← return x, err

  表达式（Expr）：
  ├── Ident       ← 标识符（变量名、函数名）
  ├── BasicLit    ← 字面量（42, "hello", true）
  ├── CallExpr    ← 函数调用
  ├── SelectorExpr ← 字段访问（x.Y）
  └── BinaryExpr  ← 二元运算（a + b）

  遍历工具：
  └── ast.Inspect(node, fn) ← 深度优先遍历所有节点

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// go/token：位置信息
type FileSet struct {
    mutex sync.RWMutex
    base  int        // 下一个 File 的起始 offset
    files []*File    // 所有文件
}
// Position = {Filename, Offset, Line, Column}

// go/parser：递归下降解析器
// parser.ParseFile → ast.File
// 内部：tokenizer 提供 Token 流，parser 递归构建 AST

// go/ast：节点接口
type Node interface {
    Pos() token.Pos  // 起始位置
    End() token.Pos  // 结束位置
}
type Expr interface { Node; exprNode() } // 表达式
type Stmt interface { Node; stmtNode() } // 语句
type Decl interface { Node; declNode() } // 声明
```

---

## 二、代码示例

### 解析 Go 文件并打印 AST

```go
import (
    "go/parser"
    "go/token"
    "go/ast"
    "fmt"
)

func parseAndPrint() {
    src := `
package main

import "fmt"

func add(a, b int) int {
    return a + b
}

func main() {
    fmt.Println(add(1, 2))
}
`
    fset := token.NewFileSet()
    f, err := parser.ParseFile(fset, "example.go", src, parser.AllErrors)
    if err != nil {
        panic(err)
    }

    // 打印 AST 结构
    ast.Print(fset, f)
}
```

### 提取所有函数名

```go
// ast.Inspect：深度优先遍历，返回 false 停止对该子树的遍历
func extractFunctions(src string) []string {
    fset := token.NewFileSet()
    f, _ := parser.ParseFile(fset, "", src, 0)

    var functions []string
    ast.Inspect(f, func(n ast.Node) bool {
        if fn, ok := n.(*ast.FuncDecl); ok {
            functions = append(functions, fn.Name.Name)
        }
        return true // 继续遍历子节点
    })
    return functions
}
```

### 静态分析：检测 error 未处理

```go
// 检测函数调用结果中 error 未被检查的情况
func checkErrorHandling(src string) []string {
    fset := token.NewFileSet()
    f, _ := parser.ParseFile(fset, "", src, 0)

    var warnings []string
    ast.Inspect(f, func(n ast.Node) bool {
        // 查找赋值语句：_ = someFunc()
        assign, ok := n.(*ast.AssignStmt)
        if !ok {
            return true
        }

        for i, lhs := range assign.Lhs {
            ident, ok := lhs.(*ast.Ident)
            if !ok {
                continue
            }
            if ident.Name == "_" && i == len(assign.Lhs)-1 {
                // 最后一个返回值用 _ 接收（可能忽略了 error）
                pos := fset.Position(assign.Pos())
                warnings = append(warnings, fmt.Sprintf(
                    "%s:%d: 可能忽略了 error 返回值",
                    pos.Filename, pos.Line,
                ))
            }
        }
        return true
    })
    return warnings
}
```

### 代码生成：自动生成 String() 方法

```go
// 解析结构体，自动生成 String() 方法
func generateStringer(src string) string {
    fset := token.NewFileSet()
    f, _ := parser.ParseFile(fset, "", src, 0)

    var result strings.Builder

    ast.Inspect(f, func(n ast.Node) bool {
        typeSpec, ok := n.(*ast.TypeSpec)
        if !ok {
            return true
        }

        structType, ok := typeSpec.Type.(*ast.StructType)
        if !ok {
            return true
        }

        name := typeSpec.Name.Name
        result.WriteString(fmt.Sprintf("func (s %s) String() string {\n", name))
        result.WriteString("\treturn fmt.Sprintf(\"")

        var fields []string
        var args []string
        for _, field := range structType.Fields.List {
            for _, fieldName := range field.Names {
                fields = append(fields, fieldName.Name+"=%v")
                args = append(args, "s."+fieldName.Name)
            }
        }

        result.WriteString(name + "{" + strings.Join(fields, ", ") + "}")
        result.WriteString("\", " + strings.Join(args, ", ") + ")\n}\n\n")
        return true
    })

    return result.String()
}

// 输入：type User struct { Name string; Age int }
// 输出：func (s User) String() string {
//           return fmt.Sprintf("User{Name=%v, Age=%v}", s.Name, s.Age)
//       }
```

### 遍历整个目录的 Go 包

```go
// 解析整个目录的所有 Go 文件
func analyzePackage(dir string) {
    fset := token.NewFileSet()

    // ParseDir 返回 map[包名]*ast.Package
    pkgs, err := parser.ParseDir(fset, dir, nil, parser.ParseComments)
    if err != nil {
        log.Fatal(err)
    }

    for pkgName, pkg := range pkgs {
        fmt.Printf("包: %s\n", pkgName)

        for fileName, file := range pkg.Files {
            fmt.Printf("  文件: %s\n", fileName)

            // 统计每个文件的函数数量
            funcCount := 0
            ast.Inspect(file, func(n ast.Node) bool {
                if _, ok := n.(*ast.FuncDecl); ok {
                    funcCount++
                }
                return true
            })
            fmt.Printf("    函数数量: %d\n", funcCount)
        }
    }
}
```

### ast.Walk vs ast.Inspect

```go
// ast.Visitor 接口：更灵活的遍历控制
type FuncCollector struct {
    funcs []*ast.FuncDecl
}

func (c *FuncCollector) Visit(node ast.Node) ast.Visitor {
    if fn, ok := node.(*ast.FuncDecl); ok {
        c.funcs = append(c.funcs, fn)
        // 返回 nil：不再遍历函数内部（若只需顶层函数）
        return nil
    }
    // 返回 c：继续遍历子节点
    return c
}

func collectFunctions(f *ast.File) []*ast.FuncDecl {
    c := &FuncCollector{}
    ast.Walk(c, f)
    return c.funcs
}

// ast.Inspect 是 ast.Walk 的简化版本（回调函数形式）
// ast.Walk 用 Visitor 接口，可在进入/退出节点时做不同处理
```

### 读取注释（文档生成）

```go
// 提取带有特定注释标记的函数（类似 go generate 的标记机制）
func extractDocFunctions(src string) {
    fset := token.NewFileSet()
    f, _ := parser.ParseFile(fset, "", src, parser.ParseComments)

    for _, decl := range f.Decls {
        fn, ok := decl.(*ast.FuncDecl)
        if !ok || fn.Doc == nil {
            continue
        }

        for _, comment := range fn.Doc.List {
            if strings.Contains(comment.Text, "@api") {
                fmt.Printf("API 函数: %s\n", fn.Name.Name)
                fmt.Printf("  文档: %s\n", fn.Doc.Text())
            }
        }
    }
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `go/ast` 和 `go/types` 的区别？ | `go/ast` 是语法树（结构），不包含类型信息；`go/types` 在 AST 基础上做类型检查，提供符号表和类型信息 |
| `ast.Inspect` 返回 `false` 意味着什么？ | 停止对当前节点**子树**的遍历（不再递归访问子节点），但不影响对兄弟节点的遍历 |
| `token.FileSet` 为什么不直接用行号？ | 多文件项目中行号会重复；FileSet 将所有文件的位置压入一个全局偏移空间，通过 offset 唯一标识任意文件的任意位置 |
| `parser.ParseComments` 标志的作用？ | 默认不解析注释（跳过）；加此标志后注释被收集到 `ast.CommentGroup`，可用于文档生成工具 |
| `go generate` 的工作原理？ | `//go:generate cmd` 是普通注释；`go generate` 命令用 `go/parser` 扫描文件，找到此注释并执行 `cmd` |
| 哪些 Go 工具基于 go/ast 实现？ | `gofmt`（代码格式化）、`go vet`（静态检查）、`gopls`（语言服务器）、`stringer`（枚举生成）、`mockgen` |
