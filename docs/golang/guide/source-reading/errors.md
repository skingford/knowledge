---
title: errors 包源码精读
description: 精读 errors.New/Is/As/Unwrap/Join 实现，理解 Go 错误链设计哲学与最佳实践。
---

# errors 包：错误处理源码精读

> 核心源码：`src/errors/errors.go`、`src/errors/wrap.go`（共约 200 行）
>
> 图例参考：复用 [错误处理设计](../01-error-handling-design.md) 里的错误链图，先把 sentinel error、包装链、`Is/As` 的分层处理关系看清，再回头读 `wrap.go`。

## 包结构图

```
errors 包结构
══════════════════════════════════════════════════════════════════

  errors/
  ├── errors.go  → New()、errorString
  └── wrap.go    → Unwrap()、Is()、As()、Join()

  相关包：
  ├── fmt.Errorf("%w", err)  ← 标准包装方式（产生 wrapError）
  └── fmt.Errorf("%w %w", e1, e2) ← Go 1.20+，多错误包装

  error 接口：
  type error interface {
      Error() string
  }

  可选扩展接口（errors 包识别）：
  ├── interface{ Unwrap() error }      ← 单包装链
  ├── interface{ Unwrap() []error }    ← 多错误树（Join/fmt.Errorf多%w）
  └── interface{ Is(error) bool }      ← 自定义 Is 语义
  └── interface{ As(any) bool }        ← 自定义 As 语义

══════════════════════════════════════════════════════════════════
```

---

## 一、errors.New

::: details 点击展开代码：一、errors.New
```go
// src/errors/errors.go
type errorString struct {
    s string
}

func (e *errorString) Error() string { return e.s }

// New 返回指针（而非值），确保每次调用创建不同的错误
// 这使得 errors.Is 的比较是指针比较（地址相等性）
func New(text string) error {
    return &errorString{text}
}
```
:::

```
为什么 New 返回指针？
══════════════════════════════════════════════════════

  err1 := errors.New("not found")
  err2 := errors.New("not found")

  err1 == err2 → false（不同指针）

  ✅ 这保证了 sentinel error 的唯一性：
  var ErrNotFound = errors.New("not found")
  // 所有人共享同一个 &errorString 地址，Is 比较准确

══════════════════════════════════════════════════════
```

---

## 二、错误包装链

<GoLanguageDiagram kind="error-chain" />

```
错误树结构
══════════════════════════════════════════════════════════════════

  单链包装（Unwrap() error）：
      wrapError("operation failed: not found")
              │  Unwrap()
              ▼
      errorString("not found")  ← sentinel error

  多错误树（Unwrap() []error，Go 1.20+）：
      joinError
      ├── Unwrap() → [err1, err2, err3]
      └── Is/As 对子树进行深度优先遍历

  构造方式：
  ├── fmt.Errorf("msg: %w", err)          → 单链
  ├── fmt.Errorf("a:%w b:%w", e1, e2)    → 多错误（Go 1.20+）
  └── errors.Join(e1, e2, e3)             → 多错误（Go 1.20+）

══════════════════════════════════════════════════════════════════
```

---

## 三、errors.Is（深度匹配）

::: details 点击展开代码：三、errors.Is（深度匹配）
```go
// src/errors/wrap.go - 核心逻辑简化版
func Is(err, target error) bool {
    for {
        // 1. 直接比较（或自定义 Is 方法）
        if err == target { return true }
        if x, ok := err.(interface{ Is(error) bool }); ok && x.Is(target) {
            return true
        }
        // 2. 展开包装链继续比较
        switch x := err.(type) {
        case interface{ Unwrap() error }:
            err = x.Unwrap()      // 单链向下
        case interface{ Unwrap() []error }:
            for _, e := range x.Unwrap() {
                if Is(e, target) { return true } // 树形 DFS
            }
            return false
        default:
            return false
        }
    }
}
```
:::

```
Is 遍历示意
══════════════════════════════════════════════════════

  err = fmt.Errorf("level2: %w",
            fmt.Errorf("level1: %w", io.EOF))

  errors.Is(err, io.EOF)
       │
       ├─ err == io.EOF?     No（wrapError）
       ├─ err.Unwrap()       → level1 wrapError
       ├─ level1 == io.EOF?  No
       ├─ level1.Unwrap()    → io.EOF
       └─ io.EOF == io.EOF?  ✅ Yes → return true

══════════════════════════════════════════════════════
```

---

## 四、errors.As（类型提取）

::: details 点击展开代码：四、errors.As（类型提取）
```go
// 简化版
func As(err error, target any) bool {
    targetType := reflect.TypeOf(target).Elem()
    for err != nil {
        // 类型可赋值则提取
        if reflect.TypeOf(err).AssignableTo(targetType) {
            reflect.ValueOf(target).Elem().Set(reflect.ValueOf(err))
            return true
        }
        // 自定义 As 方法
        if x, ok := err.(interface{ As(any) bool }); ok && x.As(target) {
            return true
        }
        // 展开继续
        err = Unwrap(err)
    }
    return false
}
```
:::

---

## 五、errors.Join（Go 1.20+）

::: details 点击展开代码：五、errors.Join（Go 1.20+）
```go
// errors.Join 返回包含多个错误的聚合错误
// 任意一个 nil 被自动过滤
func Join(errs ...error) error {
    n := 0
    for _, err := range errs {
        if err != nil { n++ }
    }
    if n == 0 { return nil }
    e := &joinError{errs: make([]error, 0, n)}
    for _, err := range errs {
        if err != nil { e.errs = append(e.errs, err) }
    }
    return e
}

type joinError struct{ errs []error }
func (e *joinError) Error() string { /* 用 \n 连接所有错误信息 */ }
func (e *joinError) Unwrap() []error { return e.errs }
```
:::

---

## 六、代码示例

### sentinel error + 包装

::: details 点击展开代码：sentinel error + 包装
```go
// 定义 sentinel error（包级变量，全局唯一）
var (
    ErrNotFound   = errors.New("not found")
    ErrPermission = errors.New("permission denied")
)

// 包装：添加上下文信息
func findUser(id int) (*User, error) {
    user, err := db.Query(id)
    if err != nil {
        // %w 保留原始 error 以便 Is/As 检查
        return nil, fmt.Errorf("findUser(%d): %w", id, ErrNotFound)
    }
    return user, nil
}

// 调用方：精确匹配
err := findUser(42)
if errors.Is(err, ErrNotFound) {
    // 即使 err 被多层包装也能正确识别
    fmt.Println("user not found")
}
```
:::

### 自定义错误类型 + As

::: details 点击展开代码：自定义错误类型 + As
```go
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: %s - %s", e.Field, e.Message)
}

func validate(age int) error {
    if age < 0 {
        return fmt.Errorf("invalid input: %w",
            &ValidationError{Field: "age", Message: "must be non-negative"})
    }
    return nil
}

// 提取具体类型
err := validate(-1)
var ve *ValidationError
if errors.As(err, &ve) {
    fmt.Printf("field=%s, msg=%s\n", ve.Field, ve.Message)
}
```
:::

### 聚合多个错误

::: details 点击展开代码：聚合多个错误
```go
func validateAll(name string, age int) error {
    var errs []error

    if name == "" {
        errs = append(errs, &ValidationError{"name", "cannot be empty"})
    }
    if age < 0 || age > 150 {
        errs = append(errs, &ValidationError{"age", "out of range"})
    }

    return errors.Join(errs...) // 全部错误一起返回，nil 自动过滤
}

err := validateAll("", -1)
if err != nil {
    fmt.Println(err) // "validation error: name - cannot be empty\n
                     //  validation error: age - out of range"
}
```
:::

### 自定义 Is（让错误族匹配）

::: details 点击展开代码：自定义 Is（让错误族匹配）
```go
type HTTPError struct {
    Code    int
    Message string
}

func (e *HTTPError) Error() string { return fmt.Sprintf("HTTP %d: %s", e.Code, e.Message) }

// 自定义 Is：任何 4xx 错误都等同于 ErrClientError
var ErrClientError = errors.New("client error")

func (e *HTTPError) Is(target error) bool {
    return target == ErrClientError && e.Code >= 400 && e.Code < 500
}

err := &HTTPError{Code: 404, Message: "not found"}
fmt.Println(errors.Is(err, ErrClientError)) // true
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| errors.Is vs == 直接比较？ | Is 会遍历整个 Unwrap 链；直接 == 只比较顶层 |
| errors.As 的作用？ | 从错误链中提取特定类型的错误（类型断言 + 遍历） |
| fmt.Errorf("%w") 和 %v 的区别？ | %w 保留原始 error（Unwrap 可取回）；%v 只保留字符串 |
| sentinel error 为什么用指针？ | 指针比较是地址比较，保证全局唯一性 |
| errors.Join 什么时候用？ | 批量操作需要聚合多个错误一起返回时 |
| 如何让自定义错误支持 Is 匹配？ | 实现 `Is(error) bool` 方法 |
