---
title: CGO 基础源码精读
description: 精读 CGO 的 C/Go 互操作机制，掌握类型映射、内存安全规则、指针传递规则、性能代价与静态库集成最佳实践。
---

# CGO：C/Go 互操作源码精读

> 核心文档：`cmd/cgo/doc.go`、runtime CGO 桥接：`src/runtime/cgocall.go`

## 包结构图

```
CGO 互操作体系
══════════════════════════════════════════════════════════════════

  CGO 调用流程：
  Go 代码 → cgo 工具 → C 桥接函数 → C 代码
  ├── Go → C：entersyscall() → CGO 调用 → exitsyscall()
  │    （goroutine 切换到专用 OS 线程，解锁调度器）
  └── C → Go：需要回调，通过 //export 声明

  类型映射：
  ┌──────────────┬──────────────────────────────────┐
  │ C 类型        │ CGO 类型                          │
  ├──────────────┼──────────────────────────────────┤
  │ int          │ C.int                            │
  │ long         │ C.long                           │
  │ char*        │ *C.char                          │
  │ void*        │ unsafe.Pointer                   │
  │ size_t       │ C.size_t                         │
  │ struct Foo   │ C.struct_Foo                     │
  └──────────────┴──────────────────────────────────┘

  CGO 性能代价：
  ├── 每次 CGO 调用约 40~80ns 额外开销（线程切换）
  ├── GC 无法管理 C 内存（需手动 C.free）
  └── 禁止在 goroutine 之间传递 C 指针

  指针传递规则（CGO 规则 - 必须遵守）：
  ├── Go 可以传指针到 C（指向的 Go 内存不含 Go 指针）
  ├── C 不能持有 Go 指针超过调用返回时间
  └── 违反规则：运行时 panic "cgo argument has Go pointer to Go pointer"

══════════════════════════════════════════════════════════════════
```

---

## 一、核心示例

```go
// CGO 启用：import "C" 前的注释块即为 C 代码
package main

/*
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// C 函数定义
int add(int a, int b) {
    return a + b;
}

char* greet(const char* name) {
    char* result = malloc(100);
    snprintf(result, 100, "Hello, %s!", name);
    return result;  // 调用者负责 free
}
*/
import "C"   // ← 不能有其他 import 合并到这行

import (
    "fmt"
    "unsafe"
)

func main() {
    // 调用 C 函数
    sum := C.add(C.int(3), C.int(4))
    fmt.Println("3 + 4 =", int(sum))

    // 字符串传递：Go string → C char*
    name := C.CString("World") // 分配 C 内存
    defer C.free(unsafe.Pointer(name)) // ⚠️ 必须手动释放

    result := C.greet(name)
    defer C.free(unsafe.Pointer(result)) // ⚠️ 释放 C 返回的内存
    fmt.Println(C.GoString(result))       // C char* → Go string
}
```

---

## 二、代码示例

### 字符串与字节切片互转

```go
/*
#include <string.h>

int count_char(const char* s, char c) {
    int count = 0;
    while (*s) {
        if (*s++ == c) count++;
    }
    return count;
}

// 处理二进制数据（[]byte）
void xor_bytes(unsigned char* data, int len, unsigned char key) {
    for (int i = 0; i < len; i++) {
        data[i] ^= key;
    }
}
*/
import "C"
import "unsafe"

// Go string → C（临时，跨越 CGO 边界后失效）
func countChar(s string, c byte) int {
    cs := C.CString(s)
    defer C.free(unsafe.Pointer(cs))
    return int(C.count_char(cs, C.char(c)))
}

// []byte 直接传 C 操作（零拷贝，但有 CGO 指针规则限制）
func xorBytes(data []byte, key byte) {
    if len(data) == 0 {
        return
    }
    // unsafe.Pointer(&data[0]) 将 []byte 头指针传给 C
    // ⚠️ data 不能含 Go 指针（[]byte 满足条件）
    C.xor_bytes((*C.uchar)(unsafe.Pointer(&data[0])),
        C.int(len(data)),
        C.uchar(key),
    )
}
```

### 调用 C 共享库（SQLite 示例）

```go
// 文件：sqlite.go
package main

/*
#cgo LDFLAGS: -lsqlite3
#cgo pkg-config: sqlite3

#include <sqlite3.h>
#include <stdlib.h>

// 包装 sqlite3 API 以便 CGO 调用
static int go_sqlite3_open(const char* filename, sqlite3** db) {
    return sqlite3_open(filename, db);
}

typedef void (*sqlite3_callback)(void*, int, char**, char**);
*/
import "C"
import (
    "fmt"
    "unsafe"
)

type SQLiteDB struct {
    db *C.sqlite3
}

func OpenSQLite(filename string) (*SQLiteDB, error) {
    cfilename := C.CString(filename)
    defer C.free(unsafe.Pointer(cfilename))

    var db *C.sqlite3
    rc := C.sqlite3_open(cfilename, &db)
    if rc != C.SQLITE_OK {
        errmsg := C.GoString(C.sqlite3_errmsg(db))
        C.sqlite3_close(db)
        return nil, fmt.Errorf("sqlite3_open: %s", errmsg)
    }
    return &SQLiteDB{db: db}, nil
}

func (s *SQLiteDB) Exec(query string) error {
    cquery := C.CString(query)
    defer C.free(unsafe.Pointer(cquery))

    var errmsg *C.char
    rc := C.sqlite3_exec(s.db, cquery, nil, nil, &errmsg)
    if rc != C.SQLITE_OK {
        err := fmt.Errorf("sqlite3_exec: %s", C.GoString(errmsg))
        C.sqlite3_free(unsafe.Pointer(errmsg))
        return err
    }
    return nil
}

func (s *SQLiteDB) Close() {
    C.sqlite3_close(s.db)
}
```

### C 回调 Go 函数（//export）

```go
// 文件：callback.go
package main

/*
#include <stdlib.h>

// 声明 Go 回调（在 callback_export.go 中用 //export 定义）
extern int goCallback(int value);

// C 函数调用 Go 回调
int process_array(int* arr, int len) {
    int total = 0;
    for (int i = 0; i < len; i++) {
        total += goCallback(arr[i]);
    }
    return total;
}
*/
import "C"
import "unsafe"

//export goCallback
func goCallback(value C.int) C.int {
    // ⚠️ 此函数不能访问 Go 的栈变量（通过闭包传递全局状态）
    return value * value // 返回平方
}

func processArray(nums []int) int {
    if len(nums) == 0 {
        return 0
    }
    cArr := make([]C.int, len(nums))
    for i, v := range nums {
        cArr[i] = C.int(v)
    }
    result := C.process_array((*C.int)(unsafe.Pointer(&cArr[0])), C.int(len(cArr)))
    return int(result)
}
```

### 集成静态库（.a 文件）

```go
// 文件：mylib.go
package mylib

/*
#cgo CFLAGS: -I${SRCDIR}/include
#cgo LDFLAGS: -L${SRCDIR}/lib -lmylib -lm

#include "mylib.h"
*/
import "C"

// ${SRCDIR} 是包含当前 .go 文件的目录
// 目录结构：
// mylib/
// ├── mylib.go         ← 这个文件
// ├── include/
// │   └── mylib.h
// └── lib/
//     └── libmylib.a   ← 预编译静态库

func Compute(x float64) float64 {
    return float64(C.compute(C.double(x)))
}
```

### CGO 性能测试与优化

```go
// 批量调用比循环单次调用更高效（减少 CGO 开销次数）

/*
#include <string.h>

// 批量处理：一次 CGO 调用处理多个数据
void batch_process(double* in, double* out, int n) {
    for (int i = 0; i < n; i++) {
        out[i] = in[i] * in[i] + 2 * in[i] + 1; // (x+1)²
    }
}
*/
import "C"
import "unsafe"

// ❌ 慢：N 次 CGO 调用
func slowProcess(data []float64) []float64 {
    result := make([]float64, len(data))
    for i, v := range data {
        result[i] = float64(C.compute_one(C.double(v)))
    }
    return result
}

// ✅ 快：1 次 CGO 调用（批量）
func fastProcess(data []float64) []float64 {
    if len(data) == 0 {
        return nil
    }
    result := make([]float64, len(data))
    C.batch_process(
        (*C.double)(unsafe.Pointer(&data[0])),
        (*C.double)(unsafe.Pointer(&result[0])),
        C.int(len(data)),
    )
    return result
}

// CGO 禁用（纯 Go 构建）：使用 build tag
//go:build !cgo

func fastProcess(data []float64) []float64 {
    result := make([]float64, len(data))
    for i, v := range data {
        result[i] = (v + 1) * (v + 1)
    }
    return result
}
```

### 资源管理（Finalizer + CGO 内存）

```go
/*
#include <stdlib.h>

typedef struct {
    int* data;
    int  len;
} Buffer;

Buffer* new_buffer(int len) {
    Buffer* b = malloc(sizeof(Buffer));
    b->data = calloc(len, sizeof(int));
    b->len = len;
    return b;
}

void free_buffer(Buffer* b) {
    if (b) {
        free(b->data);
        free(b);
    }
}
*/
import "C"
import (
    "runtime"
    "unsafe"
)

type Buffer struct {
    cb *C.Buffer
}

func NewBuffer(n int) *Buffer {
    b := &Buffer{cb: C.new_buffer(C.int(n))}
    // 注册 Finalizer 防止 C 内存泄漏
    runtime.SetFinalizer(b, func(b *Buffer) {
        C.free_buffer(b.cb)
    })
    return b
}

func (b *Buffer) Set(i, v int) {
    (*(*[]C.int)(unsafe.Pointer(&struct {
        ptr *C.int
        len int
        cap int
    }{b.cb.data, int(b.cb.len), int(b.cb.len)}))[i] = C.int(v)
}

func (b *Buffer) Close() {
    C.free_buffer(b.cb)
    b.cb = nil
    runtime.SetFinalizer(b, nil) // 取消 Finalizer
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| CGO 调用的性能代价是多少？ | 每次调用约 40~80ns（不含实际 C 代码执行时间）；来源：goroutine 切换到专用 OS 线程、栈调整、GC 检查点 |
| `C.CString` 为什么必须 `C.free`？ | `C.CString` 在 C 堆上分配内存（`malloc`），Go GC 无法感知；不 free 必然内存泄漏 |
| CGO 指针传递规则核心是什么？ | Go 指针可传给 C，但 C 不能持有超过调用返回；传给 C 的 Go 内存不能包含 Go 指针（含 slice/string/map header） |
| `//export` 有什么限制？ | 不能在使用了 `//export` 的包中定义 C 函数（import "C" 前的注释中不能有函数定义）；需分两个文件 |
| 如何在不支持 CGO 的环境构建？ | `CGO_ENABLED=0 go build` 完全禁用 CGO；用 `//go:build !cgo` 提供纯 Go 实现 fallback |
| CGO 和 goroutine 的关系？ | CGO 调用期间 goroutine 绑定到专用 OS 线程（`runtime.LockOSThread` 语义）；调用期间 GC 不能移动该 goroutine 的栈 |
