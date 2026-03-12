---
title: io/fs 源码精读
description: 精读 io/fs 的文件系统抽象接口，理解 FS/ReadDirFS/StatFS 的设计哲学与 embed.FS、os.DirFS、testing/fstest 的统一模型。
---

# io/fs：文件系统抽象源码精读

> 核心源码：`src/io/fs/fs.go`、`src/io/fs/readdir.go`、`src/io/fs/walk.go`（Go 1.16+）

## 包结构图

```
io/fs 接口体系
══════════════════════════════════════════════════════════════════

  io/fs.FS（最小接口）
  └── Open(name string) (File, error)

  扩展接口（按需实现）：
  ├── ReadDirFS   → ReadDir(name string) ([]DirEntry, error)
  ├── ReadFileFS  → ReadFile(name string) ([]byte, error)
  ├── StatFS      → Stat(name string) (FileInfo, error)
  ├── GlobFS      → Glob(pattern string) ([]string, error)
  └── SubFS       → Sub(dir string) (FS, error)

  标准实现对比：
  ┌──────────────────┬─────────────────────────────────────────┐
  │ 实现             │ 说明                                    │
  ├──────────────────┼─────────────────────────────────────────┤
  │ embed.FS         │ 编译时嵌入，只读，实现 ReadDirFS        │
  │ os.DirFS(dir)    │ 真实文件系统，实现全部接口              │
  │ fstest.MapFS     │ 内存 FS，用于测试                       │
  └──────────────────┴─────────────────────────────────────────┘

  辅助函数（接受 FS 接口）：
  ├── fs.ReadFile(fsys, name)    ← 读文件内容
  ├── fs.ReadDir(fsys, name)     ← 读目录项
  ├── fs.Stat(fsys, name)        ← 获取文件信息
  ├── fs.Glob(fsys, pattern)     ← glob 匹配
  ├── fs.WalkDir(fsys, root, fn) ← 递归遍历
  └── fs.Sub(fsys, dir)          ← 子目录视图

══════════════════════════════════════════════════════════════════
```

---

## 一、核心接口定义

```go
// src/io/fs/fs.go

// 最小接口：只需要 Open
type FS interface {
    Open(name string) (File, error)
}

// File 接口（Open 返回值）
type File interface {
    Stat() (FileInfo, error)
    Read([]byte) (int, error)
    Close() error
}

// DirEntry：ReadDir 返回（比 FileInfo 更轻量，延迟 stat）
type DirEntry interface {
    Name() string               // 文件名（不含路径）
    IsDir() bool
    Type() FileMode             // 只含类型位
    Info() (FileInfo, error)    // 懒加载完整信息
}

// 路径规则（重要！）：
// - 必须是 UTF-8，不能含 \
// - 路径分隔符始终是 /（即使 Windows）
// - 不能以 / 开头或结尾
// - 不能含 . 或 .. 组件
// - "" 不合法，根目录用 "."
```

---

## 二、WalkDir 实现

```go
// src/io/fs/walk.go
func WalkDir(fsys FS, root string, fn WalkDirFunc) error {
    info, err := Stat(fsys, root)
    if err != nil {
        err = fn(root, nil, err)
    } else {
        err = walkDir(fsys, root, &statDirEntry{info}, fn)
    }
    if err == SkipDir || err == SkipAll {
        return nil
    }
    return err
}

// WalkDirFunc 签名
type WalkDirFunc func(path string, d DirEntry, err error) error

// 特殊返回值：
// fs.SkipDir  ← 跳过当前目录（对文件则跳过剩余同级）
// fs.SkipAll  ← 跳过全部剩余项（Go 1.20+）
```

---

## 三、代码示例

### 统一接口：embed / os / 测试互换

```go
// 定义接受 fs.FS 的函数（可测试、可嵌入、可真实文件系统）
func loadConfig(fsys fs.FS) (*Config, error) {
    data, err := fs.ReadFile(fsys, "config/app.yaml")
    if err != nil {
        return nil, err
    }
    var cfg Config
    return &cfg, yaml.Unmarshal(data, &cfg)
}

// 生产：真实文件系统
cfg, _ := loadConfig(os.DirFS("."))

// 嵌入文件：
//go:embed config
var embedFS embed.FS
cfg, _ = loadConfig(embedFS)

// 测试：内存文件系统（无需临时文件）
testFS := fstest.MapFS{
    "config/app.yaml": &fstest.MapFile{
        Data: []byte("env: test\nport: 8080"),
    },
}
cfg, _ = loadConfig(testFS)
```

### 遍历并过滤文件

```go
func findMarkdown(fsys fs.FS) ([]string, error) {
    var files []string
    err := fs.WalkDir(fsys, ".", func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }
        // 跳过隐藏目录
        if d.IsDir() && strings.HasPrefix(d.Name(), ".") {
            return fs.SkipDir
        }
        if !d.IsDir() && filepath.Ext(path) == ".md" {
            files = append(files, path)
        }
        return nil
    })
    return files, err
}

// 与 embed 结合：编译时打包文档
//go:embed docs
var docsFS embed.FS

func main() {
    mdFiles, _ := findMarkdown(docsFS)
    for _, f := range mdFiles {
        content, _ := fs.ReadFile(docsFS, f)
        fmt.Printf("=== %s ===\n%s\n", f, content)
    }
}
```

### Sub：子目录视图

```go
//go:embed static
var staticFS embed.FS

// Sub 返回只包含子目录的 FS 视图
subFS, err := fs.Sub(staticFS, "static")
if err != nil {
    log.Fatal(err)
}

// 直接用于 http.FileServer（不暴露父目录）
http.Handle("/static/", http.StripPrefix("/static/",
    http.FileServer(http.FS(subFS)),
))
```

### 自定义 FS 实现（加密文件系统示例）

```go
// 实现 fs.FS 包装真实文件系统，读取时解密
type EncryptedFS struct {
    base fs.FS
    key  []byte
}

func (e *EncryptedFS) Open(name string) (fs.File, error) {
    f, err := e.base.Open(name)
    if err != nil {
        return nil, err
    }
    return &decryptFile{File: f, key: e.key}, nil
}

type decryptFile struct {
    fs.File
    key []byte
    buf []byte  // 解密后的数据
    pos int
}

func (d *decryptFile) Read(p []byte) (int, error) {
    if d.buf == nil {
        // 懒加载：首次读取时解密全部内容
        enc, err := io.ReadAll(d.File)
        if err != nil {
            return 0, err
        }
        d.buf, err = decrypt(d.key, enc)
        if err != nil {
            return 0, err
        }
    }
    n := copy(p, d.buf[d.pos:])
    d.pos += n
    if d.pos >= len(d.buf) {
        return n, io.EOF
    }
    return n, nil
}
```

### fstest.MapFS 单元测试

```go
func TestParseTemplates(t *testing.T) {
    // 完全内存 FS，无需 testdata 目录
    fsys := fstest.MapFS{
        "templates/index.html": {
            Data: []byte(`<h1>{{.Title}}</h1>`),
        },
        "templates/about.html": {
            Data: []byte(`<p>{{.Content}}</p>`),
        },
    }

    // 验证 FS 合法性（路径、内容）
    if err := fstest.TestFS(fsys, "templates/index.html", "templates/about.html"); err != nil {
        t.Fatal(err)
    }

    tmpl, err := template.ParseFS(fsys, "templates/*.html")
    if err != nil {
        t.Fatal(err)
    }
    // ... 继续测试模板渲染
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| io/fs.FS 的最小接口是什么？ | 只有 `Open(name string) (File, error)`；其他能力通过额外接口可选实现 |
| DirEntry 和 FileInfo 的区别？ | DirEntry 是轻量接口（ReadDir 返回）；FileInfo 含完整 stat 信息。DirEntry.Info() 懒加载 FileInfo |
| 为什么 fs.FS 路径不能以 / 开头？ | 设计为可移植虚拟路径；根目录用 "."；避免与 OS 绝对路径混淆 |
| embed.FS 实现了哪些 FS 接口？ | FS + ReadDirFS + ReadFileFS；不实现 WriteFS（只读）|
| fstest.TestFS 的作用？ | 验证自定义 FS 实现的正确性（路径规范化、Open 行为、Stat 一致性）|
| os.DirFS 和直接用 os.Open 的区别？ | os.DirFS 返回 fs.FS，路径相对于 dir，可与 fs 包函数组合；os.Open 是绝对/相对于 CWD |
