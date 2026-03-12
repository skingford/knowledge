---
title: go/analysis 自定义 Linter 源码精读
description: 精读 golang.org/x/tools/go/analysis 框架，掌握 Analyzer 结构、Pass API、AST 遍历、类型信息集成与自定义 lint 规则编写最佳实践。
---

# go/analysis：自定义 Linter 源码精读

> 核心源码：`golang.org/x/tools/go/analysis`、`go/ast`、`go/types`

## 包结构图

```
go/analysis 框架体系
══════════════════════════════════════════════════════════════════

  核心结构：
  analysis.Analyzer
  ├── Name    string           ← linter 名称（如 "nilerr"）
  ├── Doc     string           ← 描述文档
  ├── Run     func(*Pass) (interface{}, error)  ← 分析函数
  ├── Requires []*Analyzer    ← 依赖的前置分析器
  └── ResultType reflect.Type ← 传递给后续分析器的结果类型

  analysis.Pass（分析上下文）：
  ├── Fset    *token.FileSet   ← 位置信息
  ├── Files   []*ast.File      ← 当前包的所有 AST 文件
  ├── Pkg     *types.Package   ← 类型信息
  ├── TypesInfo *types.Info    ← 表达式→类型映射
  ├── Report(d Diagnostic)    ← 报告问题
  ├── Reportf(pos, msg, args) ← 格式化报告
  └── ResultOf map[*Analyzer]interface{} ← 前置结果

  运行方式：
  ├── singlechecker.Main(analyzer)   ← 独立工具
  ├── multichecker.Main(analyzers...)← 多 analyzer 聚合
  └── analysistest.Run(t, dir, a)    ← 测试

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// analysis/analysis.go（简化）
type Pass struct {
    Fset         *token.FileSet
    Files        []*ast.File
    Pkg          *types.Package
    TypesInfo    *types.Info
    ResultOf     map[*Analyzer]interface{}
    // Report 方法：记录问题位置和消息
    Report       func(Diagnostic)
}

// Analyzer 是无状态的（可并发运行多个包）
// Run 函数每次调用对应一个 Go 包
type Analyzer struct {
    Name     string
    Doc      string
    Run      func(*Pass) (interface{}, error)
    Requires []*Analyzer
}
```

---

## 二、代码示例

### 入门：检测 fmt.Println 使用

```go
package main

import (
    "go/ast"
    "golang.org/x/tools/go/analysis"
    "golang.org/x/tools/go/analysis/singlechecker"
)

var Analyzer = &analysis.Analyzer{
    Name: "nofmtprintln",
    Doc:  "禁止在生产代码中使用 fmt.Println（应使用结构化日志）",
    Run:  run,
}

func run(pass *analysis.Pass) (interface{}, error) {
    for _, file := range pass.Files {
        ast.Inspect(file, func(n ast.Node) bool {
            // 查找函数调用表达式
            call, ok := n.(*ast.CallExpr)
            if !ok {
                return true
            }

            // 检查是否是 fmt.Println
            sel, ok := call.Fun.(*ast.SelectorExpr)
            if !ok {
                return true
            }

            ident, ok := sel.X.(*ast.Ident)
            if !ok {
                return true
            }

            if ident.Name == "fmt" && sel.Sel.Name == "Println" {
                pass.Reportf(call.Pos(),
                    "禁止使用 fmt.Println，请使用 log/slog 替代")
            }

            return true
        })
    }
    return nil, nil
}

func main() {
    singlechecker.Main(Analyzer)
}

// 运行：go vet -vettool=$(which nofmtprintln) ./...
```

### 实用：检测错误未检查（errcheck 简化版）

```go
var ErrCheckAnalyzer = &analysis.Analyzer{
    Name: "errcheck",
    Doc:  "检测被忽略的 error 返回值",
    Run:  runErrCheck,
}

func runErrCheck(pass *analysis.Pass) (interface{}, error) {
    // 获取 error 接口类型
    errorType := types.Universe.Lookup("error").Type()

    for _, file := range pass.Files {
        ast.Inspect(file, func(n ast.Node) bool {
            // 表达式语句（丢弃了返回值）
            exprStmt, ok := n.(*ast.ExprStmt)
            if !ok {
                return true
            }

            call, ok := exprStmt.X.(*ast.CallExpr)
            if !ok {
                return true
            }

            // 获取函数调用的返回类型
            tv, ok := pass.TypesInfo.Types[call]
            if !ok {
                return true
            }

            // 检查返回类型是否含 error
            results := getResults(tv.Type)
            for _, t := range results {
                if types.Implements(t, errorType.Underlying().(*types.Interface)) {
                    pass.Reportf(call.Pos(), "error 返回值被忽略")
                    break
                }
            }

            return true
        })
    }
    return nil, nil
}

func getResults(t types.Type) []types.Type {
    tuple, ok := t.(*types.Tuple)
    if !ok {
        return nil
    }
    results := make([]types.Type, tuple.Len())
    for i := 0; i < tuple.Len(); i++ {
        results[i] = tuple.At(i).Type()
    }
    return results
}
```

### 进阶：检测 context.Background() 在请求处理函数中的使用

```go
// 规则：HTTP handler 中不应使用 context.Background()，
// 应该用 r.Context() 传递请求上下文（携带 deadline/cancel/trace）
var NoContextBGInHandler = &analysis.Analyzer{
    Name: "nocontextbg",
    Doc:  "HTTP handler 中禁止使用 context.Background()，应使用 r.Context()",
    Run:  runNoContextBG,
}

func runNoContextBG(pass *analysis.Pass) (interface{}, error) {
    for _, file := range pass.Files {
        ast.Inspect(file, func(n ast.Node) bool {
            // 查找函数声明
            funcDecl, ok := n.(*ast.FuncDecl)
            if !ok || funcDecl.Body == nil {
                return true
            }

            // 检查是否是 HTTP handler 签名：func(w http.ResponseWriter, r *http.Request)
            if !isHTTPHandler(pass, funcDecl) {
                return true
            }

            // 在函数体内查找 context.Background() 调用
            ast.Inspect(funcDecl.Body, func(inner ast.Node) bool {
                call, ok := inner.(*ast.CallExpr)
                if !ok {
                    return true
                }

                if isContextBackground(call) {
                    pass.Reportf(call.Pos(),
                        "HTTP handler 中使用了 context.Background()，"+
                            "请改用 r.Context() 以传递请求的 deadline 和 trace")
                }
                return true
            })

            return true
        })
    }
    return nil, nil
}

func isHTTPHandler(pass *analysis.Pass, fn *ast.FuncDecl) bool {
    if fn.Type.Params == nil || len(fn.Type.Params.List) != 2 {
        return false
    }

    // 检查第二个参数类型是否是 *http.Request
    param := fn.Type.Params.List[1]
    star, ok := param.Type.(*ast.StarExpr)
    if !ok {
        return false
    }
    sel, ok := star.X.(*ast.SelectorExpr)
    if !ok {
        return false
    }
    ident, ok := sel.X.(*ast.Ident)
    return ok && ident.Name == "http" && sel.Sel.Name == "Request"
}

func isContextBackground(call *ast.CallExpr) bool {
    sel, ok := call.Fun.(*ast.SelectorExpr)
    if !ok {
        return false
    }
    ident, ok := sel.X.(*ast.Ident)
    return ok && ident.Name == "context" && sel.Sel.Name == "Background"
}
```

### 带 Fix 建议的 Analyzer（自动修复）

```go
// 检测 errors.New(fmt.Sprintf(...)) 并建议改为 fmt.Errorf(...)
var ErrorsNewFmtAnalyzer = &analysis.Analyzer{
    Name: "errorfmt",
    Doc:  "errors.New(fmt.Sprintf(...)) 应改为 fmt.Errorf(...)",
    Run:  runErrorsFmt,
}

func runErrorsFmt(pass *analysis.Pass) (interface{}, error) {
    for _, file := range pass.Files {
        ast.Inspect(file, func(n ast.Node) bool {
            call, ok := n.(*ast.CallExpr)
            if !ok {
                return true
            }

            // 匹配 errors.New(...)
            if !isFuncCall(call, "errors", "New") {
                return true
            }

            if len(call.Args) != 1 {
                return true
            }

            // 检查参数是否是 fmt.Sprintf(...)
            inner, ok := call.Args[0].(*ast.CallExpr)
            if !ok || !isFuncCall(inner, "fmt", "Sprintf") {
                return true
            }

            // 构建修复建议
            fset := pass.Fset
            innerArgs := inner.Args // Sprintf 的参数

            // 生成修复文本：fmt.Errorf(args...)
            var argsText []string
            for _, arg := range innerArgs {
                argsText = append(argsText,
                    formatNode(fset, arg))
            }
            fixText := "fmt.Errorf(" + strings.Join(argsText, ", ") + ")"

            pass.Report(analysis.Diagnostic{
                Pos:     call.Pos(),
                End:     call.End(),
                Message: "使用 fmt.Errorf 替代 errors.New(fmt.Sprintf(...))",
                SuggestedFixes: []analysis.SuggestedFix{
                    {
                        Message: "替换为 fmt.Errorf",
                        TextEdits: []analysis.TextEdit{
                            {
                                Pos:     call.Pos(),
                                End:     call.End(),
                                NewText: []byte(fixText),
                            },
                        },
                    },
                },
            })

            return true
        })
    }
    return nil, nil
}

func isFuncCall(call *ast.CallExpr, pkg, fn string) bool {
    sel, ok := call.Fun.(*ast.SelectorExpr)
    if !ok {
        return false
    }
    ident, ok := sel.X.(*ast.Ident)
    return ok && ident.Name == pkg && sel.Sel.Name == fn
}

func formatNode(fset *token.FileSet, node ast.Node) string {
    var buf bytes.Buffer
    format.Node(&buf, fset, node)
    return buf.String()
}
```

### 测试 Analyzer

```go
// analyzer_test.go
package errorfmt_test

import (
    "testing"
    "golang.org/x/tools/go/analysis/analysistest"
)

func TestErrorsFmtAnalyzer(t *testing.T) {
    // 测试数据在 testdata/src/ 目录下
    testdata := analysistest.TestData()
    analysistest.Run(t, testdata, ErrorsNewFmtAnalyzer, "basic")
}
```

```go
// testdata/src/basic/basic.go
package basic

import (
    "errors"
    "fmt"
)

func bad() error {
    return errors.New(fmt.Sprintf("user %d not found", 42)) // want `使用 fmt.Errorf 替代`
}

func good() error {
    return fmt.Errorf("user %d not found", 42) // OK
}
```

### 组合多个 Analyzer（生产 linter 工具）

```go
// cmd/mylinter/main.go
package main

import (
    "golang.org/x/tools/go/analysis/multichecker"

    "myorg/linters/errorfmt"
    "myorg/linters/nocontextbg"
    "myorg/linters/nofmtprintln"
)

func main() {
    multichecker.Main(
        errorfmt.Analyzer,
        nocontextbg.Analyzer,
        nofmtprintln.Analyzer,
    )
}

// 构建并运行：
// go build -o mylinter ./cmd/mylinter
// go vet -vettool=./mylinter ./...
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `go/analysis` 和直接操作 AST 的区别？ | `go/analysis` 提供标准化框架：自动处理依赖关系、缓存、并发执行；直接操作 AST 需自己处理 FileSet 和类型信息加载 |
| `Pass.TypesInfo` 有什么用？ | 提供类型信息（`Types`、`Defs`、`Uses`、`Implicits`）；通过 `pass.TypesInfo.Types[expr].Type` 获取任意表达式的类型，用于类型检查规则 |
| Analyzer 为什么设计为无状态？ | 支持并发分析多个包（每个包一个 Pass 实例）；状态通过 `ResultOf` 在 Analyzer 间传递；无全局状态避免竞态 |
| `SuggestedFix` 如何实现自动修复？ | 提供 `TextEdit`（位置 + 替换文本）；`gopls` 和 `go fix -fix=<name>` 可应用这些 Fix；`analysistest.RunWithSuggestedFixes` 测试修复结果 |
| 如何将自定义 Analyzer 集成到 CI？ | 编译为独立二进制 → `go vet -vettool=./mylinter ./...`；或集成到 `golangci-lint` 的自定义 linter 插件（需特定版本支持）|
| `ast.Inspect` 和 `ast.Walk` 的区别？ | `ast.Inspect` 回调返回 `false` 可跳过子树（性能好，按需裁剪）；`ast.Walk` 总是遍历全树；大多数 linter 用 `ast.Inspect` |
