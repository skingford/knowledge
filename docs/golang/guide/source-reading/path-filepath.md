---
title: path/filepath 源码精读
description: 精读 path/filepath 的跨平台路径处理、WalkDir 实现与符号链接行为，理解 Go 文件系统操作的核心机制。
---

# path/filepath：路径处理源码精读

> 核心源码：`src/path/filepath/path.go`、`src/path/filepath/match.go`、`src/path/filepath/path_unix.go`

## 包结构图

```
path vs path/filepath 对比
══════════════════════════════════════════════════════════════════

  path 包（纯字符串，始终用 /）
  ├── path.Join / Split / Dir / Base / Ext / Clean
  └── 适合：URL 路径、虚拟路径、embed.FS 路径

  path/filepath 包（操作系统感知）
  ├── filepath.Join       ← 拼接路径（自动用 OS 分隔符）
  ├── filepath.Split      ← 分割目录和文件名
  ├── filepath.Dir / Base / Ext / Clean
  ├── filepath.Abs        ← 转绝对路径
  ├── filepath.Rel        ← 计算相对路径
  ├── filepath.EvalSymlinks ← 解析符号链接（真实路径）
  ├── filepath.Match      ← Shell 风格 glob 匹配
  ├── filepath.Glob       ← 文件系统 glob 查找
  ├── filepath.WalkDir    ← 目录树遍历（Go 1.16+）
  └── filepath.Walk       ← 旧版遍历（较慢，已不推荐）

  OS 适配
  ├── filepath.Separator  ← '/' (Unix) 或 '\\' (Windows)
  ├── filepath.ListSeparator ← ':' (Unix) 或 ';' (Windows，PATH 分隔）
  └── filepath.ToSlash / FromSlash ← 斜杠 ↔ 反斜杠互转

══════════════════════════════════════════════════════════════════
```

---

## 一、路径规范化（Clean）

```go
// src/path/filepath/path.go
// Clean 做以下处理（不访问文件系统）：
// 1. 多个斜杠 → 单个斜杠（// → /）
// 2. 消除 .（当前目录引用）
// 3. 消除 ..（向上一级，注意不能超出根目录）
// 4. 消除末尾斜杠（/ 除外）

examples := [][2]string{
    {"a//b", "a/b"},
    {"a/./b", "a/b"},
    {"a/b/../c", "a/c"},
    {"/../a", "/a"},    // .. 不能超出根目录
    {"", "."},          // 空字符串规范化为当前目录
}
```

---

## 二、WalkDir 实现

```go
// src/path/filepath/path.go（Go 1.16+）
func WalkDir(root string, fn fs.WalkDirFunc) error {
    info, err := os.Lstat(root) // Lstat：不跟随符号链接
    if err != nil {
        err = fn(root, nil, err)
    } else {
        err = walkDir(root, fs.FileInfoToDirEntry(info), fn)
    }
    return err
}

func walkDir(path string, d fs.DirEntry, walkDirFn fs.WalkDirFunc) error {
    // 1. 先调用 fn（进入目录前）
    if err := walkDirFn(path, d, nil); err != nil || !d.IsDir() {
        return err
    }
    // 2. 读取目录项（已排序）
    dirs, err := os.ReadDir(path)
    if err != nil {
        return walkDirFn(path, d, err) // 读取失败，让 fn 决定是否继续
    }
    // 3. 递归每个子项
    for _, d1 := range dirs {
        path1 := Join(path, d1.Name())
        if err := walkDir(path1, d1, walkDirFn); err != nil {
            if err == SkipDir { break }
            return err
        }
    }
    return nil
}
```

```
WalkDir vs Walk 的关键区别
══════════════════════════════════════════════════════════════════

  Walk（旧，Go 1.0）                WalkDir（新，Go 1.16+）
  ─────────────────────────────────────────────────────────────
  fn 参数：path, FileInfo, error    fn 参数：path, DirEntry, error
  每个文件调用 os.Lstat             DirEntry 延迟获取 FileInfo（懒加载）
  → 大目录时 stat 系统调用过多      → 显著减少系统调用
  → 已不推荐使用                    → 推荐使用

  性能差异（10万文件目录）：
  ├── Walk：~2x 系统调用（每项 Lstat）
  └── WalkDir：~1x 系统调用（ReadDir 已含基础信息）

══════════════════════════════════════════════════════════════════
```

---

## 三、符号链接行为

```
filepath 对符号链接的处理
══════════════════════════════════════════════════════════════════

  os.Stat(path)          → 跟随链接，返回目标文件信息
  os.Lstat(path)         → 不跟随链接，返回链接自身信息
  filepath.EvalSymlinks  → 解析所有链接，返回真实路径

  WalkDir / Walk：
  └── 使用 Lstat（不跟随符号链接）
      → 符号链接目录不会被递归进入
      → 避免循环引用无限循环

  若要跟随符号链接的目录：
  fn := func(path string, d fs.DirEntry, err error) error {
      if d.Type()&fs.ModeSymlink != 0 {
          // 手动解析并递归
          real, err := filepath.EvalSymlinks(path)
          ...
      }
      ...
  }

══════════════════════════════════════════════════════════════════
```

---

## 四、代码示例

### 路径操作基础

```go
// 拼接（自动处理 OS 分隔符）
p := filepath.Join("/var", "log", "app", "server.log")
// Unix: /var/log/app/server.log
// Windows: \var\log\app\server.log

// 分割
dir, file := filepath.Split("/var/log/server.log")
// dir="/var/log/", file="server.log"

fmt.Println(filepath.Dir("/var/log/server.log"))  // /var/log
fmt.Println(filepath.Base("/var/log/server.log")) // server.log
fmt.Println(filepath.Ext("/var/log/server.log"))  // .log

// 转绝对路径
abs, _ := filepath.Abs("./config.yaml")
// → /home/user/project/config.yaml

// 计算相对路径
rel, _ := filepath.Rel("/var/log", "/var/log/app/server.log")
// → app/server.log
```

### 目录遍历（收集指定类型文件）

```go
func findFiles(root, ext string) ([]string, error) {
    var files []string
    err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err // 传递错误给 WalkDir
        }
        // 跳过隐藏目录
        if d.IsDir() && strings.HasPrefix(d.Name(), ".") {
            return filepath.SkipDir // 不进入该目录
        }
        if !d.IsDir() && filepath.Ext(path) == ext {
            files = append(files, path)
        }
        return nil
    })
    return files, err
}

// 查找所有 .go 文件（跳过 vendor 和测试）
goFiles, _ := findFiles(".", ".go")
```

### Glob 匹配

```go
// filepath.Glob：在文件系统中查找匹配的文件
matches, err := filepath.Glob("/etc/*.conf")
// matches = ["/etc/hosts.conf", "/etc/resolv.conf", ...]

// 注意：不支持 **（双星号跨目录匹配）
// 需要跨目录匹配时用 WalkDir + Match

// filepath.Match：纯字符串模式匹配（不访问文件系统）
matched, _ := filepath.Match("*.go", "main.go")     // true
matched, _ = filepath.Match("src/*.go", "main.go")  // false（不跨目录）
```

### 跨平台路径转换

```go
// Unix → Windows 路径转换
unixPath := "/home/user/config.yaml"
winPath := filepath.FromSlash(unixPath)
// Windows: \home\user\config.yaml

// 标准化到斜杠（跨平台传递路径时）
osPath := `C:\Users\Alice\file.txt`
slashPath := filepath.ToSlash(osPath)
// → C:/Users/Alice/file.txt

// 判断是否绝对路径
fmt.Println(filepath.IsAbs("/var/log"))  // true
fmt.Println(filepath.IsAbs("./log"))     // false
```

### 安全路径检查（防路径穿越）

```go
// 防止路径穿越攻击（../../../etc/passwd）
func safePath(base, userInput string) (string, error) {
    // 1. 规范化基础目录和用户输入
    abs, err := filepath.Abs(filepath.Join(base, userInput))
    if err != nil {
        return "", err
    }

    // 2. 确保结果在基础目录内
    cleanBase, _ := filepath.Abs(base)
    if !strings.HasPrefix(abs, cleanBase+string(filepath.Separator)) {
        return "", fmt.Errorf("path traversal detected: %s", userInput)
    }
    return abs, nil
}

// safePath("/var/www", "../../etc/passwd")
// → error: path traversal detected
```

### 临时文件清理

```go
func withTempDir(fn func(dir string) error) error {
    dir, err := os.MkdirTemp("", "work-*")
    if err != nil {
        return err
    }
    defer os.RemoveAll(dir) // 递归删除临时目录（filepath 底层）
    return fn(dir)
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| path 和 path/filepath 的区别？ | path 始终用 /，适合 URL/虚拟路径；filepath 用 OS 分隔符，适合文件系统操作 |
| WalkDir 为什么比 Walk 快？ | WalkDir 用 DirEntry（ReadDir 已含基础信息）；Walk 对每个文件额外调用 Lstat |
| WalkDir 会跟随符号链接吗？ | 不会（内部用 Lstat）；需手动处理 ModeSymlink 类型的 DirEntry |
| SkipDir 的作用？ | fn 返回 SkipDir 时，WalkDir 跳过该目录的所有内容（但不报错）|
| 如何防路径穿越攻击？ | Abs + Join 后检查结果是否以 base + Separator 开头 |
| filepath.Glob 支持 ** 吗？ | 不支持；跨目录匹配需用 WalkDir + Match 组合 |
