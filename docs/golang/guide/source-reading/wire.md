---
title: wire 依赖注入源码精读
description: 精读 Google wire 的编译期依赖注入实现，掌握 Provider/Injector/ProviderSet 模式、构建标签分离、接口绑定与生产级依赖注入最佳实践。
---

# wire：编译期依赖注入源码精读

> 核心包：`github.com/google/wire`（代码生成工具）

## 包结构图

```
wire 体系
══════════════════════════════════════════════════════════════════

  核心概念：
  ┌──────────────────────────────────────────────────────────┐
  │  Provider   ← 普通函数，描述"如何创建某个类型"            │
  │  Injector   ← 带 //go:build wireinject 的函数（入口）    │
  │  ProviderSet← 一组 Provider 的集合（可复用）             │
  │  Binding    ← 接口 → 具体类型的绑定（wire.Bind）         │
  └──────────────────────────────────────────────────────────┘

  工作原理（编译期，非运行时反射）：
  ┌─────────────────────────────────────────────────────────┐
  │  1. 开发者写 wire.go（Injector + wire.Build 声明）       │
  │  2. 运行 wire 命令 → 分析依赖图 → 生成 wire_gen.go      │
  │  3. 编译时只包含 wire_gen.go（wire.go 被 build tag 排除）│
  │  4. 运行时：直接调用生成的函数，无反射，无运行时开销      │
  └─────────────────────────────────────────────────────────┘

  wire vs 手工依赖注入 vs 运行时 DI（dig）：
  ┌──────────────┬──────────┬──────────┬──────────┐
  │              │ 手工 DI  │  wire    │   dig    │
  ├──────────────┼──────────┼──────────┼──────────┤
  │ 错误检测时机  │ 运行时   │ 编译期   │ 运行时   │
  │ 性能         │ 最好     │ 最好     │ 有反射   │
  │ 代码可读性   │ 冗长     │ 声明式   │ 声明式   │
  │ 循环依赖检测  │ 无       │ 编译期   │ 运行时   │
  └──────────────┴──────────┴──────────┴──────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、完整工程结构

```
myapp/
├── cmd/
│   └── main.go           ← 调用 InitializeApp()
├── internal/
│   ├── config/
│   │   └── config.go     ← Config Provider
│   ├── database/
│   │   └── db.go         ← *sql.DB Provider
│   ├── repository/
│   │   └── user_repo.go  ← UserRepository Provider
│   ├── service/
│   │   └── user_service.go ← UserService Provider
│   └── handler/
│       └── user_handler.go ← UserHandler Provider
├── wire.go               ← Injector（带 wireinject build tag）
└── wire_gen.go           ← wire 自动生成（提交到 git）
```

---

## 二、代码示例

### Provider：描述如何创建依赖

```go
// internal/config/config.go
package config

type Config struct {
    DatabaseDSN string
    ServerPort  int
    LogLevel    string
}

// Provider 函数：普通 Go 函数，返回依赖类型
// wire 通过返回值类型识别它能提供什么
func NewConfig() (*Config, error) {
    return &Config{
        DatabaseDSN: os.Getenv("DATABASE_URL"),
        ServerPort:  8080,
        LogLevel:    "info",
    }, nil
}
```

```go
// internal/database/db.go
package database

import (
    "database/sql"
    _ "github.com/lib/pq"
    "myapp/internal/config"
)

// Provider：接收 *config.Config，返回 *sql.DB
// wire 自动推断：需要 Config → 调用 NewConfig
func NewDB(cfg *config.Config) (*sql.DB, error) {
    db, err := sql.Open("postgres", cfg.DatabaseDSN)
    if err != nil {
        return nil, fmt.Errorf("open db: %w", err)
    }
    db.SetMaxOpenConns(20)
    db.SetMaxIdleConns(5)
    return db, nil
}
```

```go
// internal/repository/user_repo.go
package repository

// 接口（wire.Bind 用于接口绑定）
type UserRepository interface {
    GetByID(ctx context.Context, id int64) (*User, error)
    Create(ctx context.Context, user *User) error
}

// 具体实现
type PostgresUserRepo struct {
    db *sql.DB
}

// Provider：返回 *PostgresUserRepo（具体类型）
func NewPostgresUserRepo(db *sql.DB) *PostgresUserRepo {
    return &PostgresUserRepo{db: db}
}

func (r *PostgresUserRepo) GetByID(ctx context.Context, id int64) (*User, error) {
    // ...
}
```

```go
// internal/service/user_service.go
package service

type UserService struct {
    repo   repository.UserRepository
    logger *zap.Logger
}

// Provider：依赖接口（UserRepository）+ Logger
func NewUserService(repo repository.UserRepository, logger *zap.Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}
```

### ProviderSet：组合可复用的 Provider 集合

```go
// internal/database/provider.go
package database

import "github.com/google/wire"

// DatabaseSet：封装数据库相关的所有 Provider
var DatabaseSet = wire.NewSet(
    NewDB,          // 提供 *sql.DB
    NewRedisClient, // 提供 *redis.Client
)
```

```go
// internal/repository/provider.go
package repository

import "github.com/google/wire"

// RepositorySet：仓储层的所有 Provider + 接口绑定
var RepositorySet = wire.NewSet(
    NewPostgresUserRepo,
    // 绑定：告诉 wire "UserRepository 接口 由 *PostgresUserRepo 实现"
    wire.Bind(new(UserRepository), new(*PostgresUserRepo)),
)
```

```go
// internal/service/provider.go
package service

import "github.com/google/wire"

var ServiceSet = wire.NewSet(
    NewUserService,
    NewOrderService,
    NewNotificationService,
)
```

### wire.go：Injector 声明（入口）

```go
//go:build wireinject
// +build wireinject

// wire.go 文件：带有 wireinject build tag，
// 正式编译时被完全忽略，只有 wire 命令会读取它

package main

import (
    "github.com/google/wire"
    "myapp/internal/config"
    "myapp/internal/database"
    "myapp/internal/repository"
    "myapp/internal/service"
    "myapp/internal/handler"
)

// InitializeApp：Injector 函数
// - 签名：入参是"外部提供的值"，返回值是"最终需要的类型"
// - wire.Build 列出所有 ProviderSet / Provider
// - 函数体只有 wire.Build + panic（wire 会替换实现）
func InitializeApp() (*App, error) {
    wire.Build(
        config.NewConfig,       // 单个 Provider
        database.DatabaseSet,   // ProviderSet
        repository.RepositorySet,
        service.ServiceSet,
        handler.HandlerSet,
        NewApp,                 // 最终组装 App
    )
    return nil, nil // wire 生成代码后会替换此行
}
```

### wire_gen.go：wire 生成的代码

```go
// wire_gen.go（由 wire 命令自动生成，不要手工修改）
// Code generated by Wire. DO NOT EDIT.

//go:generate go run github.com/google/wire/cmd/wire
//go:build !wireinject

package main

func InitializeApp() (*App, error) {
    // wire 分析依赖图后生成的顺序初始化代码
    cfg, err := config.NewConfig()
    if err != nil {
        return nil, err
    }
    db, err := database.NewDB(cfg)
    if err != nil {
        return nil, err
    }
    redisClient, err := database.NewRedisClient(cfg)
    if err != nil {
        return nil, err
    }
    postgresUserRepo := repository.NewPostgresUserRepo(db)
    userService := service.NewUserService(postgresUserRepo, zapLogger)
    userHandler := handler.NewUserHandler(userService)
    app := NewApp(cfg, userHandler)
    return app, nil
}
```

### 带清理函数的 Provider

```go
// Provider 返回清理函数（wire 自动生成 cleanup 调用链）
func NewDB(cfg *config.Config) (*sql.DB, func(), error) {
    db, err := sql.Open("postgres", cfg.DatabaseDSN)
    if err != nil {
        return nil, nil, err
    }

    // 清理函数：wire 生成的代码会在合适时机调用
    cleanup := func() {
        db.Close()
    }

    return db, cleanup, nil
}

// Injector 接收清理函数
func InitializeApp() (*App, func(), error) {
    wire.Build(
        config.NewConfig,
        NewDB, // 返回 cleanup func
        // ...
    )
    return nil, nil, nil
}

// main.go：使用清理函数
func main() {
    app, cleanup, err := InitializeApp()
    if err != nil {
        log.Fatal(err)
    }
    defer cleanup() // 程序退出时调用所有清理函数（按逆序）

    app.Run()
}
```

### 值绑定与接口绑定

```go
// wire.go（wireinject）

// 场景 1：注入外部已有的值（不由 wire 创建）
func InitializeAppWithLogger(logger *zap.Logger) (*App, error) {
    wire.Build(
        // wire.Value：直接注入一个具体值
        wire.Value(logger),
        // ...
        config.NewConfig,
        database.DatabaseSet,
    )
    return nil, nil
}

// 场景 2：接口 → 多个实现（通过 wire.Bind）
// ProviderSet 中声明绑定
var NotificationSet = wire.NewSet(
    NewEmailSender,   // 提供 *EmailSender
    // 开发环境绑定（可在不同 wire.go 中切换）
    wire.Bind(new(Sender), new(*EmailSender)),
)

// 场景 3：结构体字段注入（wire.Struct）
// 当 App 结构体的字段需要 wire 填充
type App struct {
    Config  *config.Config
    Handler *handler.UserHandler
    Logger  *zap.Logger
}

var AppSet = wire.NewSet(
    // wire.Struct：注入结构体所有导出字段
    wire.Struct(new(App), "*"),
)
```

### 生成与日常工作流

```go
// wire_gen.go 头部注释（用于 go generate）
//go:generate go run github.com/google/wire/cmd/wire

// 日常工作流：
// 1. 添加新的 Provider 函数
// 2. 在对应 ProviderSet 中注册
// 3. 运行：go generate ./...（或 wire ./...）
// 4. wire_gen.go 自动更新
// 5. 提交 wire_gen.go 到 git（正式构建不依赖 wire 工具）
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| wire 和 dig 的核心区别？ | wire：编译期代码生成（零运行时开销，错误在编译期暴露）；dig：运行时反射（灵活但有性能开销，错误在运行时暴露）；wire 适合静态依赖关系，dig 适合插件化/动态组合 |
| `//go:build wireinject` 的作用？ | 使 `wire.go` 在正常 `go build` 时被忽略（只有 wire 工具能读取）；`wire_gen.go` 有 `!wireinject` 标签确保两者不冲突 |
| Provider 函数有什么约定？ | 返回值：`(T, error)` 或 `(T, func(), error)`（func() 是清理函数）；入参是依赖项（wire 自动推断）；wire 根据返回类型构建依赖图 |
| `wire.Bind` 解决什么问题？ | 接口绑定：当代码依赖接口 `UserRepository`，但 Provider 返回 `*PostgresUserRepo` 时，需要 `wire.Bind` 告知 wire 两者的关系；也用于替换实现（测试时注入 mock） |
| 循环依赖怎么处理？ | wire 在代码生成阶段（`wire ./...`）检测循环依赖并报错（非运行时），强制设计上消除循环依赖；解法：提取公共依赖到第三个包，或引入事件/接口解耦 |
| `wire_gen.go` 要提交到 git 吗？ | 推荐提交：CI 构建不需要安装 wire 工具；代码审查可见依赖关系变化；dev 环境修改 Provider 后运行 `go generate` 更新 |
