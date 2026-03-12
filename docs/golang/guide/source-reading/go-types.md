---
title: go/types 源码精读
description: 精读 Go go/types 类型检查器实现，掌握类型推断、作用域分析、静态分析工具构建与 linter 开发最佳实践。
---

# go/types：类型检查器源码精读

> 核心源码：`src/go/types/checker.go`、`src/go/types/typexpr.go`、`src/go/types/scope.go`

## 包结构图

```
go/types 体系
══════════════════════════════════════════════════════════════════

  核心类型体系：
  Type（接口）
  ├── Basic      int/string/bool 等基础类型
  ├── Array      [N]T
  ├── Slice      []T
  ├── Map        map[K]V
  ├── Chan       chan T
  ├── Pointer    *T
  ├── Struct     struct{...}
  ├── Interface  interface{...}
  ├── Signature  func(params) results（函数签名）
  ├── Named      type Foo struct{}（命名类型）
  └── TypeParam  T any（泛型类型参数，Go 1.18+）

  Object（符号体系）：
  ├── Var      变量/参数/返回值
  ├── Func     函数/方法
  ├── TypeName 类型名
  ├── Const    常量
  ├── PkgName  import 的包名
  └── Builtin  内置函数（len/cap/make...）

  关键结构：
  ├── Package     ← 包（含 Scope）
  ├── Scope       ← 作用域（链表结构，子→父）
  ├── Info        ← 类型信息汇总（Types/Defs/Uses/Selections）
  └── Checker     ← 类型检查核心引擎

  工具链位置：
  源文件 → go/parser(AST) → go/types(类型检查) → go/ssa(SSA) → 分析
  ↑                         ↑
  go/scanner               go/importer（加载依赖包类型信息）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/go/types/checker.go（简化）
type Checker struct {
    conf *Config    // 检查配置（Go 版本、importer 等）
    pkg  *Package   // 正在检查的包
    info *Info      // 收集类型信息的容器
    // 内部状态：作用域栈、待处理的对象队列等
}

// Config：类型检查配置
type Config struct {
    GoVersion string           // 目标 Go 版本（"go1.21"）
    Importer  Importer         // 加载依赖包（go/importer.Default()）
    Error     func(err error)  // 错误回调（默认 panic）
}

// Info：收集所有类型信息（分析工具的数据来源）
type Info struct {
    Types      map[ast.Expr]TypeAndValue // 表达式 → 类型+值
    Defs       map[*ast.Ident]Object     // 定义（声明点）
    Uses       map[*ast.Ident]Object     // 使用（引用点）
    Implicits  map[ast.Node]Object       // 隐式对象
    Selections map[*ast.SelectorExpr]*Selection // x.f 选择
    Scopes     map[ast.Node]*Scope       // 节点 → 作用域
}

// Check：对 AST 文件集做类型检查
func (conf *Config) Check(path string, fset *token.FileSet,
    files []*ast.File, info *Info) (*Package, error) {
    check := NewChecker(conf, fset, nil, info)
    return check.Files(files)
}
```

---

## 二、代码示例

### 基础：类型检查一个文件

```go
import (
    "go/ast"
    "go/importer"
    "go/parser"
    "go/token"
    "go/types"
    "fmt"
)

func typeCheck(src string) (*types.Package, *types.Info, error) {
    fset := token.NewFileSet()

    // 1. 解析 AST
    file, err := parser.ParseFile(fset, "example.go", src, 0)
    if err != nil {
        return nil, nil, err
    }

    // 2. 类型检查
    info := &types.Info{
        Types: make(map[ast.Expr]types.TypeAndValue),
        Defs:  make(map[*ast.Ident]types.Object),
        Uses:  make(map[*ast.Ident]types.Object),
    }

    conf := &types.Config{
        Importer: importer.Default(), // 使用当前工具链加载标准库
    }

    pkg, err := conf.Check("example", fset, []*ast.File{file}, info)
    if err != nil {
        return nil, nil, err
    }
    return pkg, info, nil
}

func main() {
    src := `
package example

import "fmt"

func add(a, b int) int {
    return a + b
}

func main() {
    result := add(1, 2)
    fmt.Println(result)
}
`
    pkg, info, err := typeCheck(src)
    if err != nil {
        panic(err)
    }

    fmt.Println("包名:", pkg.Name())

    // 查看所有表达式的类型
    for expr, tv := range info.Types {
        fmt.Printf("表达式类型: %T → %v\n", expr, tv.Type)
    }
}
```

### 遍历包的所有定义

```go
// 列出包中所有函数定义
func listFunctions(pkg *types.Package, info *types.Info) {
    for ident, obj := range info.Defs {
        if obj == nil {
            continue
        }
        switch v := obj.(type) {
        case *types.Func:
            sig := v.Type().(*types.Signature)
            fmt.Printf("函数 %s at %v\n", ident.Name, obj.Pos())
            fmt.Printf("  参数: %v\n", sig.Params())
            fmt.Printf("  返回: %v\n", sig.Results())

        case *types.TypeName:
            fmt.Printf("类型 %s: %v\n", ident.Name, v.Type())

        case *types.Var:
            fmt.Printf("变量 %s: %v\n", ident.Name, v.Type())
        }
    }
}

// 查找所有对某个函数的调用
func findCallsTo(info *types.Info, target *types.Func) []token.Pos {
    var positions []token.Pos
    for ident, obj := range info.Uses {
        if obj == target {
            positions = append(positions, ident.Pos())
        }
    }
    return positions
}
```

### 构建简单 linter：检测未使用的返回值错误

```go
// 场景：检测 error 返回值被忽略的函数调用
type ErrCheckLinter struct {
    fset *token.FileSet
    info *types.Info
}

func (l *ErrCheckLinter) check(n ast.Node) bool {
    // 只关注表达式语句（丢弃返回值的函数调用）
    exprStmt, ok := n.(*ast.ExprStmt)
    if !ok {
        return true
    }

    call, ok := exprStmt.X.(*ast.CallExpr)
    if !ok {
        return true
    }

    // 获取函数调用的类型
    tv, ok := l.info.Types[call]
    if !ok {
        return true
    }

    // 检查返回值中是否包含 error 类型
    tuple, ok := tv.Type.(*types.Tuple)
    if !ok {
        return true // 单一返回值或无返回值
    }

    errorType := types.Universe.Lookup("error").Type()
    for i := 0; i < tuple.Len(); i++ {
        if types.Implements(tuple.At(i).Type(), errorType.Underlying().(*types.Interface)) {
            pos := l.fset.Position(call.Pos())
            fmt.Printf("⚠️  %s: error 返回值被忽略\n", pos)
        }
    }
    return true
}

func runErrCheckLinter(src string) {
    fset := token.NewFileSet()
    file, _ := parser.ParseFile(fset, "", src, 0)

    info := &types.Info{
        Types: make(map[ast.Expr]types.TypeAndValue),
    }
    conf := &types.Config{Importer: importer.Default()}
    conf.Check("p", fset, []*ast.File{file}, info)

    linter := &ErrCheckLinter{fset: fset, info: info}
    ast.Inspect(file, linter.check)
}
```

### 类型系统查询：实现类型断言检查

```go
// 检查某个类型是否实现了某个接口
func implementsInterface(typ types.Type, iface *types.Interface) bool {
    return types.Implements(typ, iface) ||
        types.Implements(types.NewPointer(typ), iface)
}

// 获取类型的所有方法
func getMethods(typ types.Type) []*types.Func {
    if named, ok := typ.(*types.Named); ok {
        var methods []*types.Func
        for i := 0; i < named.NumMethods(); i++ {
            methods = append(methods, named.Method(i))
        }
        return methods
    }
    return nil
}

// 分析结构体字段（含嵌入字段）
func analyzeStruct(pkg *types.Package, typeName string) {
    obj := pkg.Scope().Lookup(typeName)
    if obj == nil {
        fmt.Println("类型未找到")
        return
    }

    named, ok := obj.Type().(*types.Named)
    if !ok {
        return
    }

    strct, ok := named.Underlying().(*types.Struct)
    if !ok {
        fmt.Printf("%s 不是结构体\n", typeName)
        return
    }

    for i := 0; i < strct.NumFields(); i++ {
        field := strct.Field(i)
        tag := strct.Tag(i)
        fmt.Printf("  字段 %s %v `%s` (embedded=%v)\n",
            field.Name(), field.Type(), tag, field.Anonymous())
    }
}
```

### golang.org/x/tools/go/analysis：现代分析框架

```go
// 使用 go/analysis 框架（go vet / staticcheck 底层）
import "golang.org/x/tools/go/analysis"

// 自定义分析：检测 time.Sleep 调用（防止在生产代码中误用）
var Analyzer = &analysis.Analyzer{
    Name: "nosleep",
    Doc:  "检测 time.Sleep 调用（应使用 context 超时替代）",
    Run:  run,
}

func run(pass *analysis.Pass) (interface{}, error) {
    for _, file := range pass.Files {
        ast.Inspect(file, func(n ast.Node) bool {
            call, ok := n.(*ast.CallExpr)
            if !ok {
                return true
            }

            sel, ok := call.Fun.(*ast.SelectorExpr)
            if !ok {
                return true
            }

            // 检查是否是 time.Sleep
            if sel.Sel.Name == "Sleep" {
                if pkgIdent, ok := sel.X.(*ast.Ident); ok {
                    obj := pass.TypesInfo.Uses[pkgIdent]
                    if pkgName, ok := obj.(*types.PkgName); ok {
                        if pkgName.Imported().Path() == "time" {
                            pass.Reportf(call.Pos(),
                                "避免使用 time.Sleep，考虑用 context.WithTimeout 替代")
                        }
                    }
                }
            }
            return true
        })
    }
    return nil, nil
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `go/types.Info` 中 `Defs` 和 `Uses` 的区别？ | `Defs` 记录标识符的定义点（声明）；`Uses` 记录标识符的使用点（引用）；同一个标识符在声明处出现在 Defs，在其他地方出现在 Uses |
| `go/types` 和 `go/ast` 的关系？ | `go/ast` 只做语法解析，得到 AST 树（不知道类型）；`go/types` 在 AST 之上做类型推导，填充 `Info` 中各表达式的类型信息 |
| 如何在 linter 中判断一个表达式的类型？ | 通过 `info.Types[expr].Type` 获取；需要先用 `types.Config.Check` 做完整类型检查，Info 才会被填充 |
| `golang.org/x/tools/go/analysis` 框架有什么优势？ | 标准化分析器接口（与 go vet/staticcheck 兼容）；自动处理 import 图加载、缓存、并行；支持 fact（分析结果传递到依赖包）|
| `types.Implements(T, iface)` 为什么有时需要传指针类型？ | Go 方法集规则：指针类型拥有值类型的所有方法；若接口方法在指针接收者上定义，只有 `*T` 实现接口，需用 `types.NewPointer(T)` 检查 |
| 构建 linter 的主流技术栈？ | `go/parser` + `go/types` + `golang.org/x/tools/go/analysis`（基础分析）；`go/ssa`（SSA 数据流分析，如 staticcheck）；`go/callgraph`（调用图）|
