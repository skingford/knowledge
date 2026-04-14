---
title: cobra + viper CLI 工具源码精读
description: 精读 cobra 命令框架与 viper 配置管理，掌握子命令设计、Flag 绑定、配置文件加载、环境变量映射与生产级 CLI 工具最佳实践。
---

# cobra + viper：CLI 工具源码精读

> 核心包：`github.com/spf13/cobra`、`github.com/spf13/viper`
>
> 图例参考：
> - `GoEngineeringDiagram`：`cobra-viper-flow`、`config-priority`

## 包结构图

```
cobra + viper 体系
══════════════════════════════════════════════════════════════════

  cobra 命令树：
  rootCmd
  ├── serveCmd        ← myapp serve --port 8080
  ├── migrateCmd      ← myapp migrate up/down
  │    ├── upCmd
  │    └── downCmd
  └── configCmd       ← myapp config set/get
       ├── setCmd
       └── getCmd

  cobra 执行流程：
  Execute() → 解析 os.Args → 匹配命令 → PersistentPreRunE →
  PreRunE → RunE → PostRunE → PersistentPostRunE

  viper 配置优先级（高 → 低）：
  1. 显式 Set()          ← 代码中强制覆盖
  2. flag（cobra 绑定）   ← 命令行参数
  3. 环境变量             ← MY_APP_PORT
  4. 配置文件             ← config.yaml
  5. 默认值               ← viper.SetDefault()

  配置文件支持格式：
  YAML / TOML / JSON / HCL / INI / .env

══════════════════════════════════════════════════════════════════
```

<GoEngineeringDiagram kind="cobra-viper-flow" />

---

## 一、完整 CLI 工程结构

```
myapp/
├── cmd/
│   ├── root.go       ← rootCmd + viper 初始化
│   ├── serve.go      ← serve 子命令
│   ├── migrate.go    ← migrate 子命令
│   └── version.go    ← version 子命令
├── internal/
│   └── config/
│       └── config.go ← 配置结构体
└── main.go           ← cobra.Execute()
```

---

## 二、代码示例

### root.go：根命令 + viper 初始化

<GoEngineeringDiagram kind="config-priority" />

::: details 点击展开代码：root.go：根命令 + viper 初始化
```go
// cmd/root.go
package cmd

import (
    "fmt"
    "os"

    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

var cfgFile string

var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "myapp - 一个生产级 CLI 工具",
    Long: `myapp 是一个示例 CLI 工具，展示 cobra + viper 的最佳实践。

完整文档：https://github.com/example/myapp`,
    // SilenceUsage：RunE 返回错误时不打印 Usage（只打印错误）
    SilenceUsage: true,
    // PersistentPreRunE：所有子命令执行前运行（初始化配置、日志等）
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return initConfig()
    },
}

func Execute() {
    if err := rootCmd.Execute(); err != nil {
        os.Exit(1)
    }
}

func init() {
    // 持久化 flag（所有子命令可用）
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "",
        "配置文件路径（默认 $HOME/.myapp.yaml）")
    rootCmd.PersistentFlags().String("log-level", "info",
        "日志级别（debug/info/warn/error）")
    rootCmd.PersistentFlags().Bool("verbose", false, "详细输出")

    // 绑定 flag 到 viper
    viper.BindPFlag("log.level", rootCmd.PersistentFlags().Lookup("log-level"))
    viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
}

func initConfig() error {
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        home, _ := os.UserHomeDir()
        viper.AddConfigPath(home)
        viper.AddConfigPath(".")    // 当前目录
        viper.SetConfigName(".myapp")
        viper.SetConfigType("yaml")
    }

    // 环境变量：MYAPP_LOG_LEVEL → log.level
    viper.SetEnvPrefix("MYAPP")
    viper.AutomaticEnv()
    // 将 . 替换为 _ 以匹配环境变量（log.level → LOG_LEVEL）
    viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

    // 默认值
    viper.SetDefault("server.port", 8080)
    viper.SetDefault("server.host", "0.0.0.0")
    viper.SetDefault("database.max_conns", 20)
    viper.SetDefault("log.level", "info")

    if err := viper.ReadInConfig(); err != nil {
        // 配置文件不存在是允许的（使用默认值和环境变量）
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return fmt.Errorf("read config: %w", err)
        }
    } else {
        fmt.Fprintln(os.Stderr, "Using config:", viper.ConfigFileUsed())
    }

    return nil
}
```
:::

### serve.go：服务启动子命令

::: details 点击展开代码：serve.go：服务启动子命令
```go
// cmd/serve.go
package cmd

import (
    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

var serveCmd = &cobra.Command{
    Use:   "serve",
    Short: "启动 HTTP 服务器",
    Example: `  myapp serve
  myapp serve --port 9090
  myapp serve --port 9090 --host localhost`,
    RunE: func(cmd *cobra.Command, args []string) error {
        cfg := &ServerConfig{
            Host:    viper.GetString("server.host"),
            Port:    viper.GetInt("server.port"),
            Timeout: viper.GetDuration("server.timeout"),
        }
        return runServer(cmd.Context(), cfg)
    },
}

func init() {
    rootCmd.AddCommand(serveCmd)

    // 局部 flag（只有 serve 子命令可用）
    serveCmd.Flags().Int("port", 0,
        "监听端口（覆盖配置文件，默认 8080）")
    serveCmd.Flags().String("host", "",
        "监听地址（覆盖配置文件）")
    serveCmd.Flags().Duration("timeout", 0,
        "请求超时（如 30s、1m）")

    // 绑定局部 flag 到 viper
    viper.BindPFlag("server.port", serveCmd.Flags().Lookup("port"))
    viper.BindPFlag("server.host", serveCmd.Flags().Lookup("host"))
    viper.BindPFlag("server.timeout", serveCmd.Flags().Lookup("timeout"))
}

type ServerConfig struct {
    Host    string
    Port    int
    Timeout time.Duration
}

func runServer(ctx context.Context, cfg *ServerConfig) error {
    addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
    fmt.Printf("Starting server on %s\n", addr)
    // ... 启动 HTTP 服务器
    return nil
}
```
:::

### 配置文件结构（config.go）

::: details 点击展开代码：配置文件结构（config.go）
```go
// internal/config/config.go
package config

import "github.com/spf13/viper"

// Config 统一配置结构体（从 viper 反序列化）
type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Log      LogConfig      `mapstructure:"log"`
}

type ServerConfig struct {
    Host    string        `mapstructure:"host"`
    Port    int           `mapstructure:"port"`
    Timeout time.Duration `mapstructure:"timeout"`
}

type DatabaseConfig struct {
    DSN      string `mapstructure:"dsn"`
    MaxConns int    `mapstructure:"max_conns"`
}

type LogConfig struct {
    Level  string `mapstructure:"level"`
    Format string `mapstructure:"format"` // json / text
}

// Load 从 viper 反序列化配置（类型安全）
func Load() (*Config, error) {
    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, fmt.Errorf("unmarshal config: %w", err)
    }

    // 验证必填项
    if cfg.Database.DSN == "" {
        return nil, fmt.Errorf("database.dsn is required")
    }
    return &cfg, nil
}
```
:::

::: details 点击展开代码：配置文件结构（config.go）
```yaml
# $HOME/.myapp.yaml（示例配置文件）
server:
  host: "0.0.0.0"
  port: 8080
  timeout: 30s

database:
  dsn: "postgres://user:pass@localhost/mydb?sslmode=disable"
  max_conns: 20

log:
  level: "info"
  format: "json"
```
:::

### migrate.go：带子命令的命令组

<GoEngineeringDiagram kind="cobra-viper-flow" />

::: details 点击展开代码：migrate.go：带子命令的命令组
```go
// cmd/migrate.go
package cmd

var migrateCmd = &cobra.Command{
    Use:   "migrate",
    Short: "数据库迁移管理",
}

var migrateUpCmd = &cobra.Command{
    Use:   "up [步数]",
    Short: "执行待执行的迁移",
    Args:  cobra.MaximumNArgs(1), // 最多 1 个参数
    RunE: func(cmd *cobra.Command, args []string) error {
        steps := -1 // -1 = 全部
        if len(args) > 0 {
            var err error
            steps, err = strconv.Atoi(args[0])
            if err != nil {
                return fmt.Errorf("invalid steps: %s", args[0])
            }
        }

        db := connectDB()
        return runMigrations(db, steps)
    },
}

var migrateDownCmd = &cobra.Command{
    Use:     "down <步数>",
    Short:   "回滚迁移",
    Args:    cobra.ExactArgs(1), // 必须指定步数
    RunE: func(cmd *cobra.Command, args []string) error {
        steps, _ := strconv.Atoi(args[0])
        db := connectDB()
        return rollbackMigrations(db, steps)
    },
}

func init() {
    rootCmd.AddCommand(migrateCmd)
    migrateCmd.AddCommand(migrateUpCmd, migrateDownCmd)

    // 迁移目录 flag
    migrateCmd.PersistentFlags().String("dir", "migrations",
        "迁移文件目录")
    viper.BindPFlag("migrate.dir",
        migrateCmd.PersistentFlags().Lookup("dir"))
}
```
:::

### 交互式确认 + 进度条

::: details 点击展开代码：交互式确认 + 进度条
```go
// 危险操作前要求用户确认
func confirmAction(cmd *cobra.Command, action string) error {
    force, _ := cmd.Flags().GetBool("force")
    if force {
        return nil
    }

    fmt.Printf("⚠️  即将执行: %s\n确认? [y/N]: ", action)
    var response string
    fmt.Scanln(&response)

    if strings.ToLower(response) != "y" {
        return fmt.Errorf("操作已取消")
    }
    return nil
}

// 注册 --force flag
var deleteCmd = &cobra.Command{
    Use:  "delete <id>",
    Args: cobra.ExactArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        if err := confirmAction(cmd, "删除数据 ID="+args[0]); err != nil {
            return err
        }
        return deleteData(args[0])
    },
}

func init() {
    deleteCmd.Flags().Bool("force", false, "跳过确认直接执行")
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| viper 配置优先级是什么？ | 从高到低：`Set()` > flag > 环境变量 > 配置文件 > `SetDefault()`；同一个 key 多个来源时取最高优先级 |
| `PersistentFlags` 和 `Flags` 的区别？ | `PersistentFlags`：该命令及所有子命令可用；`Flags`：只有该命令本身可用；一般全局配置（--config, --log-level）用 Persistent |
| `cobra.ExactArgs(1)` 等验证器的作用？ | 内置参数验证：`ExactArgs(n)` 精确 n 个；`MinimumNArgs(n)` 最少；`MaximumNArgs(n)` 最多；`NoArgs` 禁止参数；验证失败自动打印 Usage |
| 如何从 viper 获取类型安全的配置？ | 用 `viper.Unmarshal(&cfg)` 反序列化到结构体（需 `mapstructure` 标签）；比逐个 `viper.GetString()` 更安全，可统一验证 |
| `SilenceUsage: true` 的作用？ | `RunE` 返回 error 时默认会打印命令的 Usage（帮助文档）；设置后只打印错误信息，不打印 Usage（减少噪音）|
| 如何为 CLI 添加自动补全？ | `rootCmd.GenBashCompletionFile("myapp.sh")` / `GenZshCompletion`；或添加 `completion` 子命令：`cobra completion bash > ~/.bash_completion` |
