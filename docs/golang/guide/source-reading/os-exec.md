---
title: os/exec 源码精读
description: 精读 os/exec 的进程创建与 I/O 管道机制，掌握命令执行、流式处理、超时控制与安全实践。
---

# os/exec：命令执行源码精读

> 核心源码：`src/os/exec/exec.go`、`src/os/exec/lp_unix.go`
>
> 图例参考：
> - `GoEngineeringDiagram`：`exec-cmd-lifecycle`
> - `GoNetworkDiagram`：`io-pipe-stream`

## 包结构图

```
os/exec 核心结构
══════════════════════════════════════════════════════════════════

  exec.Cmd
  ├── Path      string          ← 可执行文件绝对路径
  ├── Args      []string        ← 参数列表（含 argv[0]）
  ├── Env       []string        ← 环境变量（nil=继承父进程）
  ├── Dir       string          ← 工作目录（""=继承）
  │
  ├── Stdin     io.Reader       ← 标准输入（nil=os.DevNull）
  ├── Stdout    io.Writer       ← 标准输出（nil=丢弃）
  ├── Stderr    io.Writer       ← 标准错误（nil=丢弃）
  │
  ├── StdinPipe()  → io.WriteCloser    ← 获取管道写端
  ├── StdoutPipe() → io.ReadCloser     ← 获取管道读端
  └── StderrPipe() → io.ReadCloser

  生命周期：
  exec.Command("cmd", "args...") ← 构建（查找 PATH）
         │
         ├── cmd.Run()           ← Start + Wait（阻塞）
         ├── cmd.Output()        ← Run + 捕获 stdout
         ├── cmd.CombinedOutput()← Run + 捕获 stdout+stderr
         │
         ├── cmd.Start()         ← 启动（非阻塞）
         └── cmd.Wait()          ← 等待结束 + 资源回收

  路径查找：
  exec.LookPath("git")  ← 在 PATH 中查找可执行文件
  → 返回绝对路径或 error

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/os/exec/exec.go（简化）
type Cmd struct {
    Path string
    Args []string
    Env  []string
    Dir  string

    Stdin  io.Reader
    Stdout io.Writer
    Stderr io.Writer

    Process   *os.Process     // Start 后填充
    ProcessState *os.ProcessState // Wait 后填充

    ctx             context.Context
    lookPathErr     error
    finished        bool
    closeAfterStart []io.Closer
    closeAfterWait  []io.Closer
    goroutine       []func() error // I/O 复制 goroutine
    waitDone        chan struct{}
    err             error
}

func (c *Cmd) Start() error {
    // 1. 参数验证
    // 2. 构建 os.ProcAttr（Env、Dir、Files）
    // 3. os.StartProcess → fork+exec
    // 4. 启动 I/O 复制 goroutine（Stdin/Stdout/Stderr 管道）
    c.Process, err = os.StartProcess(c.Path, c.argv(), &os.ProcAttr{
        Dir:   c.Dir,
        Env:   c.envv(),
        Files: c.childFiles, // fd 0,1,2 的重定向
    })
    return err
}

func (c *Cmd) Wait() error {
    // 1. os.Process.Wait()（阻塞直到子进程退出）
    // 2. 等待所有 I/O goroutine 完成
    // 3. 关闭管道
    // 4. 检查退出状态 → ExitError
    state, err := c.Process.Wait()
    c.ProcessState = state
    // ...
    return err
}
```
:::

<GoEngineeringDiagram kind="exec-cmd-lifecycle" />

---

## 二、代码示例

### 基础命令执行

::: details 点击展开代码：基础命令执行
```go
// 最简单：直接获取输出
out, err := exec.Command("git", "log", "--oneline", "-5").Output()
if err != nil {
    log.Fatal(err)
}
fmt.Println(string(out))

// 捕获 stdout + stderr
out, err = exec.Command("go", "build", "./...").CombinedOutput()
if err != nil {
    // 获取退出码
    var exitErr *exec.ExitError
    if errors.As(err, &exitErr) {
        fmt.Printf("退出码: %d\n", exitErr.ExitCode())
        fmt.Printf("stderr: %s\n", exitErr.Stderr)
    }
}

// 检查命令是否存在
path, err := exec.LookPath("ffmpeg")
if errors.Is(err, exec.ErrNotFound) {
    log.Fatal("ffmpeg 未安装")
}
```
:::

### 超时控制（context）

::: details 点击展开代码：超时控制（context）
```go
// context.WithTimeout 取消时向子进程发送 SIGKILL（默认）
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

cmd := exec.CommandContext(ctx, "ffmpeg",
    "-i", "input.mp4",
    "-c:v", "libx264",
    "output.mp4",
)
cmd.Stdout = os.Stdout
cmd.Stderr = os.Stderr

if err := cmd.Run(); err != nil {
    if ctx.Err() == context.DeadlineExceeded {
        log.Println("转码超时")
    }
}

// Go 1.20+：超时时发送 SIGTERM，再等待 KillDelay 后发 SIGKILL
cmd = exec.CommandContext(ctx, "long-running-task")
cmd.WaitDelay = 5 * time.Second // 等待 5s 后强制 kill
```
:::

### 流式管道（大输出场景）

<GoNetworkDiagram kind="io-pipe-stream" />

::: details 点击展开代码：流式管道（大输出场景）
```go
// 流式读取输出（避免全部加载到内存）
cmd := exec.Command("kubectl", "logs", "-f", "my-pod")
stdout, err := cmd.StdoutPipe()
if err != nil {
    log.Fatal(err)
}

if err := cmd.Start(); err != nil {
    log.Fatal(err)
}

// 流式处理每一行
scanner := bufio.NewScanner(stdout)
for scanner.Scan() {
    line := scanner.Text()
    if strings.Contains(line, "ERROR") {
        alert(line) // 实时告警
    }
}

if err := cmd.Wait(); err != nil {
    log.Printf("命令退出: %v", err)
}
```
:::

### 管道链（多命令串联）

::: details 点击展开代码：管道链（多命令串联）
```go
// 等价于：ps aux | grep go | wc -l
func pipeCommands() (string, error) {
    ps := exec.Command("ps", "aux")
    grep := exec.Command("grep", "go")
    wc := exec.Command("wc", "-l")

    // 连接管道
    var err error
    grep.Stdin, err = ps.StdoutPipe()
    if err != nil {
        return "", err
    }
    wc.Stdin, err = grep.StdoutPipe()
    if err != nil {
        return "", err
    }

    var buf bytes.Buffer
    wc.Stdout = &buf

    // 按顺序启动
    if err := wc.Start(); err != nil {
        return "", err
    }
    if err := grep.Start(); err != nil {
        return "", err
    }
    if err := ps.Run(); err != nil {
        return "", err
    }
    if err := grep.Wait(); err != nil {
        return "", err
    }
    if err := wc.Wait(); err != nil {
        return "", err
    }
    return strings.TrimSpace(buf.String()), nil
}
```
:::

### 向进程发送输入

::: details 点击展开代码：向进程发送输入
```go
// 通过 StdinPipe 发送数据
cmd := exec.Command("python3", "-c", "import sys; print(sys.stdin.read().upper())")
stdin, err := cmd.StdinPipe()
if err != nil {
    log.Fatal(err)
}

var out bytes.Buffer
cmd.Stdout = &out

if err := cmd.Start(); err != nil {
    log.Fatal(err)
}

// 写入并关闭（关闭 = EOF）
io.WriteString(stdin, "hello world")
stdin.Close() // ← 必须关闭，否则子进程阻塞等待更多输入

if err := cmd.Wait(); err != nil {
    log.Fatal(err)
}
fmt.Println(out.String()) // HELLO WORLD
```
:::

### 安全执行（防止命令注入）

::: details 点击展开代码：安全执行（防止命令注入）
```go
// ❌ 危险：使用 shell，用户输入可注入
userInput := "foo; rm -rf /"
exec.Command("sh", "-c", "echo "+userInput).Run() // ← 危险！

// ✅ 安全：直接传参数，不经过 shell
exec.Command("echo", userInput).Run() // ← 安全，userInput 作为字面参数

// ✅ 白名单校验
allowedCommands := map[string]bool{"ls": true, "ps": true, "df": true}
func safeExec(name string, args ...string) ([]byte, error) {
    if !allowedCommands[name] {
        return nil, fmt.Errorf("不允许的命令: %s", name)
    }
    // 参数校验（不含特殊字符）
    for _, arg := range args {
        if strings.ContainsAny(arg, ";&|`$(){}") {
            return nil, fmt.Errorf("非法参数: %s", arg)
        }
    }
    return exec.Command(name, args...).Output()
}
```
:::

### 设置环境变量

::: details 点击展开代码：设置环境变量
```go
// 继承父进程环境并追加
cmd := exec.Command("go", "test", "./...")
cmd.Env = append(os.Environ(),
    "CGO_ENABLED=0",
    "GOOS=linux",
    "GOARCH=amd64",
)
cmd.Dir = "/path/to/project"

// 最小环境（容器/沙箱）
cmd.Env = []string{
    "PATH=/usr/local/bin:/usr/bin:/bin",
    "HOME=/tmp",
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| cmd.Run 和 cmd.Start+Wait 的区别？ | Run = Start + Wait；Start 非阻塞适合需要同时处理 I/O 的场景 |
| StdoutPipe 和直接设置 Stdout 的区别？ | StdoutPipe 返回读端供调用者流式消费；设置 Stdout 让 exec 自动复制到指定 Writer |
| 为什么 StdinPipe 用完要 Close？ | 不 Close 子进程收不到 EOF，会永久阻塞等待更多输入 |
| CommandContext 超时后子进程一定被杀掉吗？ | 默认发 SIGKILL 立即终止；Go 1.20+ 可用 WaitDelay 先 SIGTERM |
| 如何防止命令注入？ | 不拼接 shell 命令；直接传参数给 exec.Command；对参数做白名单/字符校验 |
| ExitError 包含什么信息？ | ExitCode()（退出码）、Stderr（stderr 内容）、ProcessState（资源使用统计）|
