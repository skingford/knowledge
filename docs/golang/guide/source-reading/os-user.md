---
title: os/user 源码精读
description: 精读 os/user 的用户与组信息查询实现，掌握 CGO 与纯 Go 两种后端的选择机制、用户缓存与跨平台差异。
---

# os/user：用户信息查询源码精读

> 核心源码：`src/os/user/user.go`、`src/os/user/lookup_unix.go`

## 包结构图

```
os/user 查询体系
══════════════════════════════════════════════════════════════════

  User 结构体：
  ├── Uid      string  ← 用户 ID（Linux: "1000", Windows: SID）
  ├── Gid      string  ← 主组 ID
  ├── Username string  ← 登录名（"alice"）
  ├── Name     string  ← 显示名（"Alice Smith"）
  └── HomeDir  string  ← 家目录（"/home/alice"）

  Group 结构体：
  ├── Gid  string  ← 组 ID
  └── Name string  ← 组名

  查询函数：
  ├── user.Current()           ← 当前用户
  ├── user.Lookup(username)    ← 按用户名查询
  ├── user.LookupId(uid)       ← 按 UID 查询
  ├── user.LookupGroup(name)   ← 按组名查询
  ├── user.LookupGroupId(gid)  ← 按 GID 查询
  └── u.GroupIds()             ← 用户所属的所有组 ID

  后端实现选择（Unix）：
  ┌────────────────────────────────────────────────┐
  │  CGO 可用 + !osusergo 标签                      │
  │  → libc 的 getpwnam/getgrgid（支持 LDAP/NIS）  │
  ├────────────────────────────────────────────────┤
  │  CGO 不可用 或 osusergo 标签                    │
  │  → 纯 Go 解析 /etc/passwd 和 /etc/group         │
  └────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/os/user/user.go
type User struct {
    Uid      string // "501"（Unix）或 SID（Windows）
    Gid      string // 主组 ID
    Username string // "alice"
    Name     string // "Alice Smith"（来自 GECOS 字段）
    HomeDir  string // "/home/alice"
}

// Unix 纯 Go 实现（解析 /etc/passwd）
// 格式：username:password:uid:gid:gecos:home:shell
// alice:x:1000:1000:Alice Smith:/home/alice:/bin/bash
func lookupUnix(uid int, username string, lookupByName bool) (*User, error) {
    // 打开 /etc/passwd 逐行解析
    f, _ := os.Open("/etc/passwd")
    defer f.Close()
    // ... 解析每行，匹配 uid 或 username
}

// CGO 实现通过 libc
// #include <pwd.h>
// struct passwd *getpwnam(const char *name);
// struct passwd *getpwuid(uid_t uid);
```

---

## 二、代码示例

### 基础用户信息查询

```go
import (
    "fmt"
    "os/user"
)

func currentUserInfo() {
    // 当前运行用户
    u, err := user.Current()
    if err != nil {
        panic(err)
    }

    fmt.Printf("用户名:   %s\n", u.Username)
    fmt.Printf("UID:     %s\n", u.Uid)
    fmt.Printf("GID:     %s\n", u.Gid)
    fmt.Printf("显示名:  %s\n", u.Name)
    fmt.Printf("家目录:  %s\n", u.HomeDir)

    // 获取用户所属所有组
    groups, err := u.GroupIds()
    if err != nil {
        panic(err)
    }
    fmt.Printf("所属组 ID: %v\n", groups)

    // 解析每个组名
    for _, gid := range groups {
        g, _ := user.LookupGroupId(gid)
        if g != nil {
            fmt.Printf("  组 %s: %s\n", gid, g.Name)
        }
    }
}
```

### 权限检查

```go
// 检查当前进程是否以 root 运行
func isRoot() bool {
    u, err := user.Current()
    if err != nil {
        return false
    }
    return u.Uid == "0"
}

// 检查当前用户是否属于特定组
func isInGroup(groupName string) (bool, error) {
    u, err := user.Current()
    if err != nil {
        return false, err
    }

    g, err := user.LookupGroup(groupName)
    if err != nil {
        // 组不存在
        if _, ok := err.(user.UnknownGroupError); ok {
            return false, nil
        }
        return false, err
    }

    gids, err := u.GroupIds()
    if err != nil {
        return false, err
    }

    for _, gid := range gids {
        if gid == g.Gid {
            return true, nil
        }
    }
    return false, nil
}

// 使用
func requireDockerGroup() error {
    inGroup, err := isInGroup("docker")
    if err != nil {
        return err
    }
    if !inGroup {
        return fmt.Errorf("当前用户不在 docker 组，请运行：sudo usermod -aG docker $USER")
    }
    return nil
}
```

### 文件权限检查（结合 os.Stat）

```go
// 检查当前用户对文件的访问权限
func checkFileAccess(path string) {
    info, err := os.Stat(path)
    if err != nil {
        fmt.Printf("文件不存在: %v\n", err)
        return
    }

    mode := info.Mode()
    u, _ := user.Current()

    // 获取文件所有者
    stat := info.Sys().(*syscall.Stat_t)
    fileUID := fmt.Sprintf("%d", stat.Uid)
    fileGID := fmt.Sprintf("%d", stat.Gid)

    isOwner := u.Uid == fileUID
    inGroup := func() bool {
        gids, _ := u.GroupIds()
        for _, gid := range gids {
            if gid == fileGID {
                return true
            }
        }
        return false
    }()

    var perms string
    switch {
    case isOwner:
        perms = mode.String()[1:4] // 所有者权限（rwx）
    case inGroup:
        perms = mode.String()[4:7] // 组权限
    default:
        perms = mode.String()[7:10] // 其他用户权限
    }

    fmt.Printf("文件: %s\n", path)
    fmt.Printf("当前用户权限: %s（%s）\n", perms, map[bool]string{true: "所有者", false: map[bool]string{true: "组成员", false: "其他用户"}[inGroup]}[isOwner])
}
```

### 跨平台：用户家目录查找

```go
// 查找指定用户的家目录（跨平台）
func getUserHome(username string) (string, error) {
    // 优先使用环境变量（当前用户）
    if username == "" {
        if home := os.Getenv("HOME"); home != "" {
            return home, nil
        }
    }

    // 通过 os/user 查询
    var u *user.User
    var err error
    if username == "" {
        u, err = user.Current()
    } else {
        u, err = user.Lookup(username)
    }
    if err != nil {
        return "", err
    }
    return u.HomeDir, nil
}

// 展开 ~ 路径
func ExpandTilde(path string) (string, error) {
    if !strings.HasPrefix(path, "~") {
        return path, nil
    }

    home, err := getUserHome("")
    if err != nil {
        return "", err
    }

    if path == "~" {
        return home, nil
    }
    return filepath.Join(home, path[2:]), nil
}
```

### 构建标签控制后端

```go
// 强制使用纯 Go 实现（不依赖 CGO），适合静态编译
// go build -tags osusergo .

// 或在环境变量中指定
// CGO_ENABLED=0 go build .

// 验证使用哪个后端
func checkBackend() {
    u, _ := user.Current()
    // CGO 后端可查询 LDAP/NIS 用户
    // 纯 Go 只能查询 /etc/passwd
    fmt.Printf("当前用户: %+v\n", u)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| os/user 为什么有 CGO 和纯 Go 两种实现？ | Unix 系统的用户可来自多个来源（LDAP、NIS、本地文件）；libc 的 NSS 模块统一处理这些来源，纯 Go 只能解析 `/etc/passwd` |
| 容器中 `user.Current()` 有何注意？ | 容器中进程可能以非 root UID 运行但 `/etc/passwd` 里没有对应条目；CGO 实现可能报错，纯 Go 也会 `UnknownUserIdError` |
| `CGO_ENABLED=0` 时用户查询有何限制？ | 只能查询 `/etc/passwd` 和 `/etc/group` 中的本地用户/组；LDAP/AD 集成用户无法查询 |
| `User.Name` 和 `User.Username` 的区别？ | Username 是登录名（系统唯一）；Name 是 GECOS 显示名（可含空格，如"Alice Smith"）|
| 如何判断进程是否有 root 权限？ | `user.Current()` 返回 UID；或直接 `os.Getuid() == 0`（不需要 os/user，不受 CGO 影响）|
| `u.GroupIds()` 为什么可能很慢？ | Unix 实现需要遍历 `/etc/group` 查找包含该用户的所有组；CGO 实现调用 `getgrouplist`；频繁调用应缓存结果 |
