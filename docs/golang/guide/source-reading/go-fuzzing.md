---
title: Go Fuzzing（Go 1.18+）源码精读
description: 精读 Go 1.18 内置模糊测试实现，掌握 testing.F、种子语料库、覆盖率引导变异与生产级 fuzz 测试最佳实践。
---

# Go Fuzzing（Go 1.18+）：内置模糊测试源码精读

> 核心：`testing.F`、`go test -fuzz`（Go 1.18+）
>
> 图例参考：
> - `GoEngineeringDiagram`：`fuzz-lifecycle`

## 包结构图

```
Go Fuzzing 体系
══════════════════════════════════════════════════════════════════

  模糊测试 vs 单元测试：
  ┌─────────────────┬──────────────┬──────────────────────────────┐
  │ 特性            │ 单元测试      │ 模糊测试                      │
  ├─────────────────┼──────────────┼──────────────────────────────┤
  │ 输入来源        │ 手写固定输入  │ 自动生成（基于语料库变异）    │
  │ 覆盖目标        │ 已知边界条件  │ 发现未知边界（崩溃/panic）   │
  │ 运行时间        │ 秒级          │ 持续运行（直到找到 bug）     │
  │ 种子            │ 不需要        │ 初始语料库（可选）           │
  └─────────────────┴──────────────┴──────────────────────────────┘

  Go Fuzzing 工作原理：
  1. f.Add(seed...)     ← 注册种子语料库（初始输入）
  2. f.Fuzz(func(t,v)) ← 定义模糊函数
  3. go test -fuzz=Fuzz ← 启动引擎
  4. 引擎变异输入 → 运行 Fuzz 函数 → 收集覆盖率
  5. 新覆盖路径 → 加入语料库（corpus/）
  6. 发现 panic/错误 → 保存失败用例到 testdata/fuzz/

  语料库目录结构：
  testdata/fuzz/FuzzXxx/    ← 发现的失败/有价值的用例
  ├── a1b2c3d4              ← 每个文件是一个语料库条目
  └── deadbeef

  支持的 fuzz 参数类型：
  string、[]byte、int/uint（各种大小）、float32/64、bool、rune

══════════════════════════════════════════════════════════════════
```

<GoEngineeringDiagram kind="fuzz-lifecycle" />

---

## 一、基础：第一个 Fuzz 测试

<GoEngineeringDiagram kind="fuzz-lifecycle" />

```go
// fuzz_test.go
package mypackage

import (
    "testing"
    "unicode/utf8"
)

// 目标：验证 Reverse 函数的 UTF-8 安全性
func Reverse(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

// FuzzReverse：模糊测试 Reverse 函数
func FuzzReverse(f *testing.F) {
    // 1. 注册种子语料库（已知有趣的输入）
    f.Add("")
    f.Add("hello")
    f.Add("Hello, 世界")
    f.Add("a\xc5\xc5") // 无效 UTF-8

    // 2. Fuzz 函数：引擎会自动变异 s 并调用
    f.Fuzz(func(t *testing.T, s string) {
        // 断言：逆转两次应恢复原始字符串
        doubled := Reverse(Reverse(s))
        if s != doubled {
            t.Errorf("Reverse(Reverse(%q)) = %q, want %q", s, doubled, s)
        }

        // 断言：输出应是有效 UTF-8
        if !utf8.ValidString(doubled) {
            t.Errorf("Reverse(%q) 产生无效 UTF-8: %q", s, doubled)
        }
    })
}
```

```bash
# 单元测试模式（仅用种子语料库，不生成新输入）
go test -run FuzzReverse

# 模糊测试模式（持续运行，生成新输入）
go test -fuzz=FuzzReverse

# 限制运行时间
go test -fuzz=FuzzReverse -fuzztime=60s

# 限制并发数
go test -fuzz=FuzzReverse -parallel=4

# 仅运行保存的语料库（CI 模式）
go test -run=FuzzReverse/testdata
```

---

## 二、代码示例

### 解析器 Fuzz：URL / JSON 解析安全

```go
// 场景：确保自定义解析器在任意输入下不 panic
func FuzzParseMyProtocol(f *testing.F) {
    // 种子：合法的协议帧
    f.Add([]byte{0x01, 0x00, 0x00, 0x04, 'h', 'e', 'l', 'l'}) // 合法帧
    f.Add([]byte{})                                               // 空输入
    f.Add([]byte{0xFF, 0xFF, 0xFF, 0xFF})                       // 超大长度

    f.Fuzz(func(t *testing.T, data []byte) {
        // 要求：任意输入都不应 panic，只返回 error
        defer func() {
            if r := recover(); r != nil {
                t.Errorf("ParseFrame(%x) panicked: %v", data, r)
            }
        }()

        frame, err := ParseFrame(data)
        if err != nil {
            return // 返回错误是可接受的
        }

        // 额外断言：成功解析的帧重新序列化后应一致
        serialized := frame.Serialize()
        frame2, err := ParseFrame(serialized)
        if err != nil {
            t.Errorf("重新序列化后无法解析: %v", err)
        }
        if !frame.Equal(frame2) {
            t.Errorf("序列化往返失败")
        }
    })
}

// Fuzz HTTP 路由解析
func FuzzParseURL(f *testing.F) {
    f.Add("https://example.com/path?q=1#anchor")
    f.Add("http://user:pass@host:8080/p")
    f.Add("://invalid")
    f.Add(string(make([]byte, 10000))) // 超长 URL

    f.Fuzz(func(t *testing.T, rawURL string) {
        u, err := url.Parse(rawURL)
        if err != nil {
            return
        }
        // 往返测试：解析后重新序列化应一致
        reparsed, err := url.Parse(u.String())
        if err != nil {
            t.Errorf("url.Parse(%q).String() 产生无效 URL", rawURL)
        }
        if u.String() != reparsed.String() {
            t.Errorf("往返不一致: %q -> %q -> %q",
                rawURL, u.String(), reparsed.String())
        }
    })
}
```

### JSON 编解码 Fuzz（往返测试）

```go
type User struct {
    Name  string `json:"name"`
    Age   int    `json:"age"`
    Email string `json:"email"`
}

// FuzzJSONRoundtrip：验证 JSON 编解码往返一致性
func FuzzJSONRoundtrip(f *testing.F) {
    f.Add(`{"name":"Alice","age":30,"email":"a@b.com"}`)
    f.Add(`{}`)
    f.Add(`{"name":"","age":-1}`)

    f.Fuzz(func(t *testing.T, data string) {
        var u1 User
        if err := json.Unmarshal([]byte(data), &u1); err != nil {
            return // 无效 JSON，跳过
        }

        // 编码 → 解码 → 再编码
        b1, err := json.Marshal(u1)
        if err != nil {
            t.Fatalf("Marshal 失败: %v", err)
        }

        var u2 User
        if err := json.Unmarshal(b1, &u2); err != nil {
            t.Fatalf("二次 Unmarshal 失败: %v", err)
        }

        b2, err := json.Marshal(u2)
        if err != nil {
            t.Fatalf("二次 Marshal 失败: %v", err)
        }

        // 两次编码结果应相同（幂等性）
        if string(b1) != string(b2) {
            t.Errorf("JSON 往返不幂等:\n  b1=%s\n  b2=%s", b1, b2)
        }
    })
}
```

### 多参数 Fuzz + 自定义断言

```go
// 场景：验证加密函数的正确性
func FuzzEncryptDecrypt(f *testing.F) {
    key := make([]byte, 32)
    rand.Read(key)

    f.Add([]byte("hello world"), key)
    f.Add([]byte{}, key)
    f.Add(make([]byte, 1024), key)

    f.Fuzz(func(t *testing.T, plaintext, key []byte) {
        // key 长度必须是 16/24/32，Fuzz 可能生成其他长度
        if len(key) != 32 {
            t.Skip() // 跳过无效 key（不算失败）
        }

        ciphertext, err := encrypt(key, plaintext)
        if err != nil {
            t.Skip() // 加密失败是允许的
        }

        decrypted, err := decrypt(key, ciphertext)
        if err != nil {
            t.Errorf("解密失败: %v", err)
            return
        }

        if !bytes.Equal(plaintext, decrypted) {
            t.Errorf("加解密往返失败: 原文=%x 解密=%x", plaintext, decrypted)
        }
    })
}
```

### 语料库管理最佳实践

<GoEngineeringDiagram kind="fuzz-lifecycle" />

```go
// 1. 提交有价值的种子到 testdata/fuzz/
// 手动创建种子文件格式：
// testdata/fuzz/FuzzXxx/seed001
// 内容：go test fuzz v1
//       string("interesting-input")

// 2. 将 testdata/fuzz/ 加入版本控制
// .gitignore 不要忽略 testdata/fuzz/

// 3. CI 中只运行已保存的语料库
// go test -run=FuzzXxx/testdata/fuzz/FuzzXxx

// 4. 持续 Fuzz（后台 CI job）
// go test -fuzz=FuzzXxx -fuzztime=1h ./...

// 5. 发现失败用例后调试
// go test -run=FuzzXxx/testdata/fuzz/FuzzXxx/a1b2c3 -v
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Go Fuzzing 和随机测试（random testing）有什么区别？ | 随机测试每次从头生成随机输入；模糊测试是覆盖率引导的（coverage-guided）：新覆盖路径的输入被保存并作为变异基础，能更快发现深层 bug |
| `f.Add()` 种子的作用是什么？ | 提供初始语料库（starting corpus）；引擎以这些输入为基础做变异（翻转 bit、截断、拼接）；种子质量影响引擎发现 bug 的速度 |
| `go test -run FuzzXxx` 和 `-fuzz FuzzXxx` 的区别？ | `-run` 只用种子语料库运行一次（确定性，适合 CI）；`-fuzz` 启动引擎持续生成新输入（不确定性，适合安全审计/长期运行）|
| 发现的失败用例保存在哪里？如何复现？ | 保存到 `testdata/fuzz/FuzzXxx/<hash>` 文件；复现：`go test -run=FuzzXxx/<hash>` |
| 什么函数适合做 Fuzz 测试？ | 解析函数（JSON/XML/URL/协议）、加解密往返、序列化/反序列化、压缩解压、正则匹配；凡是接受外部输入的都应考虑 |
| 如何在 Fuzz 中跳过无效输入（不算失败）？ | 调用 `t.Skip()`（跳过该条目，不记录为失败）；区别于 `t.Error` / `t.Fatal`（记录为失败并保存语料库）|
