---
title: os 包源码精读
description: 精读 os.File、os.Process 与标准流的底层实现，理解 Go 跨平台文件与进程操作的内部机制。
---

# os：文件与进程源码精读

> 核心源码：`src/os/file.go`、`src/os/exec.go`、`src/os/proc.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`netpoller-flow`、`walkdir-flow`
> - `GoEngineeringDiagram`：`os-file-open`

## 包结构图

```
os 包架构分层
══════════════════════════════════════════════════════════════════

  文件操作层
  ├── os.File          ← 核心类型（fd 包装 + 方法集）
  ├── os.Open/Create/OpenFile  ← 文件打开
  ├── os.Stat/Lstat    ← 文件元信息
  ├── os.ReadFile/WriteFile    ← 便利 API（Go 1.16+）
  ├── os.MkdirAll/RemoveAll   ← 目录操作
  └── os.Rename/Symlink/Link  ← 文件系统操作

  进程操作层
  ├── os.StartProcess  ← 低级进程启动
  ├── os.Process       ← 进程句柄（Wait/Signal/Kill）
  ├── os.FindProcess   ← 通过 PID 找进程
  └── os.Getpid/Getenv/Hostname  ← 系统信息

  标准流
  ├── os.Stdin   = NewFile(0, "/dev/stdin")
  ├── os.Stdout  = NewFile(1, "/dev/stdout")
  └── os.Stderr  = NewFile(2, "/dev/stderr")

  底层平台适配（内部包）
  ├── internal/poll.FD   ← 非阻塞 I/O + 网络轮询集成
  └── syscall.Open/Read/Write ← 系统调用

══════════════════════════════════════════════════════════════════
```

---

## 一、os.File 结构

```go
// src/os/file.go
type File struct {
    *file // 指针，确保 File 可安全赋值
}

// src/os/file_unix.go（Unix 实现）
type file struct {
    pfd         poll.FD      // 核心：非阻塞 fd + netpoller 集成
    name        string       // 文件路径（调试用）
    dirinfo     *dirInfo     // 目录迭代状态（ReadDir 用）
    nonblock    bool         // 是否非阻塞模式
    stdoutOrErr bool         // stdout/stderr 特殊处理
    appendMode  bool         // O_APPEND 模式
}

// poll.FD（src/internal/poll/fd_unix.go）
type FD struct {
    fdmu    fdMutex    // fd 读写并发保护
    Sysfd   int        // 实际的系统文件描述符
    pd      pollDesc   // 与 netpoller(epoll/kqueue) 的集成
    csema   uint32     // close 信号量
    isFile  bool       // 区分文件 fd 和 socket fd
    IsBlocking uint32  // 是否阻塞
}
```

```
File → poll.FD → netpoller 关系
══════════════════════════════════════════════════════════════════

  os.File
  └── file.pfd (poll.FD)
         ├── Sysfd：实际 fd 号（如 3）
         └── pd (pollDesc)
                └── 注册到 runtime netpoller (epoll/kqueue)
                      ← Read/Write 阻塞时 goroutine 挂起
                      ← I/O 就绪时 netpoller 唤醒 goroutine

  这就是为什么 Go 的文件/网络 I/O 不会阻塞系统线程（M）：
  底层是 goroutine 级别的异步 I/O + netpoller 唤醒机制

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="netpoller-flow" />

---

## 二、文件打开流程

```
os.Open / os.OpenFile 流程
══════════════════════════════════════════════════════════════════

  os.Open(name)
   = os.OpenFile(name, O_RDONLY, 0)
       │
       ▼
  openFileNolog(name, flag, perm)
       │
       ├── syscall.Open(name, flag|O_CLOEXEC, perm)
       │       → 返回 fd（int）
       │
       ├── newFile(fd, name, kindOpenFile)
       │       ├── poll.FD.Init(sysfd, pollable)
       │       └── 注册 finalizer（防止 fd 泄漏）
       │               runtime.SetFinalizer(f, (*File).Close)
       │
       └── 返回 *os.File

  ⚠️ finalizer 是最后防线，不可替代 defer f.Close()：
     finalizer 触发时机不确定（依赖 GC），fd 可能长时间不释放

══════════════════════════════════════════════════════════════════
```

<GoEngineeringDiagram kind="os-file-open" />

---

## 三、FileInfo 与 os.Stat

```go
// os.Stat 返回 fs.FileInfo 接口
type FileInfo interface {
    Name() string       // 文件名（不含路径）
    Size() int64        // 文件大小（字节）
    Mode() FileMode     // 权限位
    ModTime() time.Time // 最后修改时间
    IsDir() bool        // 是否目录
    Sys() any           // 底层数据（*syscall.Stat_t on Unix）
}

// 通过 Sys() 获取 Unix 特有字段
func getInode(path string) (uint64, error) {
    info, err := os.Stat(path)
    if err != nil {
        return 0, err
    }
    stat := info.Sys().(*syscall.Stat_t)
    return stat.Ino, nil // inode 号
}
```

---

## 四、进程操作

```go
// src/os/exec.go
type Process struct {
    Pid    int
    handle uintptr  // Windows: HANDLE; Unix: pid（等价）
    isdone atomic.Bool
    sigMu  sync.RWMutex
}

// 等待子进程退出
func (p *Process) Wait() (*ProcessState, error)

// ProcessState 包含退出信息
type ProcessState struct {
    pid    int
    status syscall.WaitStatus // 退出码、信号等
    rusage *syscall.Rusage    // 资源使用量
}
```

```
os.StartProcess vs exec.Command
══════════════════════════════════════════════════════════════════

  os.StartProcess（低级）
  ├── 直接映射 fork+exec 系统调用
  ├── 手动管理 stdin/stdout/stderr 的 fd
  └── 适合：需要精细控制 fd、环境变量、工作目录的场景

  exec.Command（高级封装，推荐）
  ├── 内部调用 os.StartProcess
  ├── 自动处理 PATH 查找（exec.LookPath）
  ├── 便捷方法：Output/Run/CombinedOutput
  └── 适合：大多数子进程调用场景

══════════════════════════════════════════════════════════════════
```

---

## 五、代码示例

### 文件读写（推荐方式）

```go
// 读取整个文件（Go 1.16+，内部用 bytes.Buffer 或 os.File.Read）
data, err := os.ReadFile("config.json")
if err != nil {
    return fmt.Errorf("read config: %w", err)
}

// 写入文件（原子写：先写临时文件，再 Rename）
func writeAtomic(path string, data []byte) error {
    tmpPath := path + ".tmp"
    if err := os.WriteFile(tmpPath, data, 0644); err != nil {
        return err
    }
    return os.Rename(tmpPath, path) // Rename 在同一文件系统上是原子操作
}
```

### 高效追加写入

```go
func appendLog(path, line string) error {
    f, err := os.OpenFile(path,
        os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    if err != nil {
        return err
    }
    defer f.Close()

    _, err = fmt.Fprintln(f, line)
    return err
}
```

### 目录遍历（Go 1.16+ WalkDir）

<GoNetworkDiagram kind="walkdir-flow" />

```go
import "io/fs"

func findGoFiles(root string) ([]string, error) {
    var files []string
    err := fs.WalkDir(os.DirFS(root), ".", func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }
        if !d.IsDir() && strings.HasSuffix(path, ".go") {
            files = append(files, filepath.Join(root, path))
        }
        return nil
    })
    return files, err
}
```

### 进程操作

```go
import "os/exec"

// 运行命令并获取输出
func gitLog(repoPath string) (string, error) {
    cmd := exec.Command("git", "log", "--oneline", "-10")
    cmd.Dir = repoPath
    out, err := cmd.Output() // 等价于 Run() + 读取 stdout
    return string(out), err
}

// 流式输出（适合长时间运行的命令）
func runWithOutput(name string, args ...string) error {
    cmd := exec.Command(name, args...)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    return cmd.Run()
}

// 超时控制
func runWithTimeout(ctx context.Context, timeout time.Duration, cmd string, args ...string) error {
    ctx, cancel := context.WithTimeout(ctx, timeout)
    defer cancel()

    c := exec.CommandContext(ctx, cmd, args...)
    if err := c.Run(); err != nil {
        if ctx.Err() == context.DeadlineExceeded {
            return fmt.Errorf("command timed out after %v", timeout)
        }
        return err
    }
    return nil
}
```

### 临时文件与目录

```go
// 创建临时文件（用完自动清理）
func processWithTemp(data []byte) error {
    f, err := os.CreateTemp("", "process-*.json")
    if err != nil {
        return err
    }
    defer os.Remove(f.Name()) // 确保清理
    defer f.Close()

    if _, err := f.Write(data); err != nil {
        return err
    }
    f.Close() // 先关闭让其他进程可读

    return externalProcess(f.Name())
}

// 创建临时目录
func workInTempDir(fn func(dir string) error) error {
    dir, err := os.MkdirTemp("", "work-*")
    if err != nil {
        return err
    }
    defer os.RemoveAll(dir) // 递归删除临时目录
    return fn(dir)
}
```

### 文件权限与信息

```go
// 检查文件是否存在
func fileExists(path string) bool {
    _, err := os.Stat(path)
    return !errors.Is(err, os.ErrNotExist)
}

// 修改权限
if err := os.Chmod("script.sh", 0755); err != nil {
    return err
}

// 获取文件大小
info, err := os.Stat("data.csv")
if err == nil {
    fmt.Printf("size: %d bytes (%.2f MB)\n",
        info.Size(), float64(info.Size())/1024/1024)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| os.File.Read 为什么不会阻塞系统线程？ | poll.FD 集成 netpoller，I/O 阻塞时挂起 goroutine（非 M），epoll/kqueue 就绪后唤醒 |
| os.Open 和 os.OpenFile 的区别？ | Open 是 OpenFile(name, O_RDONLY, 0) 的简写；OpenFile 可指定 flag 和权限 |
| 忘记 Close 会发生什么？ | fd 泄漏（finalizer 是备用，触发时机不确定）；/proc/self/fd 中 fd 数增加；最终超出进程 fd 上限 |
| 原子写文件的惯用法？ | 先写临时文件，再 os.Rename（同一文件系统上 rename 是原子系统调用） |
| os.ErrNotExist 的正确判断方式？ | errors.Is(err, os.ErrNotExist)，不要字符串匹配；os.IsNotExist 已被 errors.Is 替代 |
| exec.Command 和 os.StartProcess 的区别？ | exec.Command 是高级封装（PATH 查找、便捷 IO 绑定）；StartProcess 是低级 fork+exec 直接映射 |
