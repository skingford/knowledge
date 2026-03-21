---
title: reflect 包源码精读
description: 精读 reflect.Type/Value 实现，理解反射的底层机制与性能边界。
---

# reflect 包：反射原理源码精读

> 核心源码：`src/reflect/type.go`、`src/reflect/value.go`
>
> 图例参考：复用 [接口、反射与泛型](../01-interface-reflect-generics.md) 里的可设置性图，先把 `ValueOf`、指针解引用、`CanSet` 这条主线看清，再回头读 `value.go` 的 flag 语义。

## 包结构图

```
reflect 包结构
══════════════════════════════════════════════════════════════════

  类型系统
  ├── Type（接口）← reflect.TypeOf() 返回
  │   └── *rtype（实现）← 每种类型在编译期唯一生成
  │       ├── kind  uint8    ← 基础类型（Int/String/Struct/...）
  │       ├── size  uintptr  ← 类型占用字节数
  │       └── str   *string  ← 类型名称
  │
  └── Value（结构体）← reflect.ValueOf() 返回
      ├── typ  *rtype         ← 指向类型信息
      ├── ptr  unsafe.Pointer ← 指向实际数据
      └── flag uintptr        ← Kind + 可寻址/只读标记

  Kind 枚举（27种）
  Invalid, Bool, Int, Int8...Int64, Uint...Uint64,
  Float32, Float64, Complex64, Complex128,
  Array, Chan, Func, Interface, Map, Pointer,
  Slice, String, Struct, UnsafePointer

══════════════════════════════════════════════════════════════════
```

---

## 一、接口的内存布局

```
理解反射的前提：接口的内存模型
══════════════════════════════════════════════════════

  interface{} / any 的底层表示：
  ┌───────────────────────────────────────────────┐
  │  iface / eface                                │
  │  ┌─────────────┬─────────────────────────┐   │
  │  │ type *rtype │ data unsafe.Pointer      │   │
  │  └─────────────┴─────────────────────────┘   │
  │       ↑                    ↑                  │
  │  类型元数据               指向实际值           │
  └───────────────────────────────────────────────┘

  reflect.ValueOf(v interface{}) Value
  └── 从 eface.type 获取 *rtype
  └── 从 eface.data 获取数据指针

  关键：反射不是魔法，只是对接口内部两个指针的操作

══════════════════════════════════════════════════════
```

---

## 二、Type vs Value

<GoLanguageDiagram kind="reflect-settable" />

```
Type 和 Value 职责分工
══════════════════════════════════════════════════════

  reflect.Type（描述"是什么类型"）
  ├── Kind()           → 基础类型枚举
  ├── Name()           → 类型名（"User"）
  ├── PkgPath()        → 包路径
  ├── NumField()       → struct 字段数
  ├── Field(i)         → 第 i 个字段的 StructField
  ├── NumMethod()      → 方法数
  └── Implements(i)    → 是否实现接口

  reflect.Value（描述"值是多少/如何操作"）
  ├── Kind()           → 同 Type.Kind()
  ├── Int/Float/String()   → 读取基础值
  ├── SetInt/SetFloat()    → 设置基础值（需可寻址）
  ├── Field(i)         → struct 第 i 个字段的 Value
  ├── MapIndex(key)    → map 取值
  ├── Index(i)         → slice/array 取元素
  ├── Call(args)       → 调用函数
  └── Elem()           → 解引用指针/接口

══════════════════════════════════════════════════════
```

---

## 三、代码示例

### 类型检查与遍历结构体

```go
func printStruct(v any) {
    t := reflect.TypeOf(v)
    val := reflect.ValueOf(v)

    // 处理指针
    if t.Kind() == reflect.Pointer {
        t = t.Elem()
        val = val.Elem()
    }

    if t.Kind() != reflect.Struct {
        fmt.Println("not a struct")
        return
    }

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        value := val.Field(i)

        // 跳过未导出字段
        if !field.IsExported() {
            continue
        }

        tag := field.Tag.Get("json")
        fmt.Printf("field: %s, tag: %s, value: %v\n",
            field.Name, tag, value.Interface())
    }
}

type User struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

// 输出：
// field: Name, tag: name, value: Alice
// field: Age,  tag: age,  value: 30
```

### 通用 setter（reflect 实现）

```go
func setField(obj any, fieldName string, value any) error {
    v := reflect.ValueOf(obj)
    if v.Kind() != reflect.Pointer || v.Elem().Kind() != reflect.Struct {
        return errors.New("obj must be a pointer to struct")
    }

    field := v.Elem().FieldByName(fieldName)
    if !field.IsValid() {
        return fmt.Errorf("field %s not found", fieldName)
    }
    if !field.CanSet() {
        return fmt.Errorf("field %s is not settable", fieldName)
    }

    newVal := reflect.ValueOf(value)
    if field.Type() != newVal.Type() {
        return fmt.Errorf("type mismatch")
    }

    field.Set(newVal)
    return nil
}
```

### 函数动态调用

```go
func callFunc(fn any, args ...any) []any {
    v := reflect.ValueOf(fn)

    in := make([]reflect.Value, len(args))
    for i, arg := range args {
        in[i] = reflect.ValueOf(arg)
    }

    results := v.Call(in)

    out := make([]any, len(results))
    for i, r := range results {
        out[i] = r.Interface()
    }
    return out
}

// 使用
add := func(a, b int) int { return a + b }
result := callFunc(add, 3, 4)
fmt.Println(result[0]) // 7
```

---

## 四、反射性能

```
反射 vs 直接调用 性能对比
══════════════════════════════════════════════════════

  操作                    相对开销
  ─────────────────────────────────────
  直接字段访问             1x（基准）
  reflect.ValueOf()        ~5-10x
  Value.Field()            ~5-10x
  Value.Interface()        ~10-20x（涉及逃逸）
  Value.Call()             ~50-100x

  性能瓶颈原因：
  ├── 每次操作需要 kind 检查和 flag 验证
  ├── Interface() 导致堆分配（逃逸）
  └── 失去编译器优化机会

  优化方案：
  ├── 缓存 reflect.Type 和字段索引（一次反射，多次使用）
  ├── 使用代码生成替代运行时反射（easyjson、protobuf）
  └── unsafe.Pointer + 偏移量直接操作内存（极端场景）

══════════════════════════════════════════════════════
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| reflect.TypeOf 和 ValueOf 区别？ | TypeOf 获取类型元信息（编译时），ValueOf 获取值和操作句柄 |
| 为什么修改值需要传指针？ | 反射操作的是接口内部拷贝，需传指针才能修改原始值 |
| CanSet() 为 false 的情况？ | 未导出字段、非指针传入的 struct 字段 |
| reflect 能访问未导出字段吗？ | 不能（CanSet=false），但 unsafe 包可以绕过 |
| 反射的核心开销是什么？ | 类型检查、内存逃逸、失去内联优化 |
| json 包用反射的场景？ | Marshal/Unmarshal 通过反射遍历 struct 字段和读取 tag |
