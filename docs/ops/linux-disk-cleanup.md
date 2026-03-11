---
title: Linux 运维实战：磁盘清理与进程管理
description: Linux 运维实战指南，覆盖磁盘空间排查、日志清理、进程管理与常见系统维护操作。
---

# Linux 运维实战：磁盘清理与进程管理

日常运维中最常遇到的场景：磁盘告警、日志膨胀、进程管理。本文将零散命令整理为结构化操作指南。

## 磁盘空间排查

### du 命令定位大目录

```bash
# 查看根目录下各一级目录占用
sudo du -h --max-depth=1 / | sort -hr

# 查看全盘最大的 20 个文件/目录
sudo du -ah / | sort -rh | head -20

# 逐级深入排查（以 /var 为例）
sudo du -h --max-depth=1 /var | sort -hr

# 查看具体日志目录
sudo du -sh /var/log/*
```

### ncdu 交互式排查

`ncdu` 是磁盘分析利器，支持交互式浏览和删除。

```bash
# 安装
sudo apt install ncdu    # Debian/Ubuntu
sudo yum install ncdu    # CentOS/RHEL

# 扫描根目录（耗时取决于磁盘大小）
sudo ncdu /

# 扫描指定目录
sudo ncdu /var/log
```

操作提示：方向键浏览，`d` 删除，`q` 退出。

## 日志清理

### systemd journal 日志

```bash
# 查看 journal 占用
journalctl --disk-usage

# 只保留最近 1 天的日志
sudo journalctl --vacuum-time=1d

# 只保留最近 500M
sudo journalctl --vacuum-size=500M
```

持久化配置 `/etc/systemd/journald.conf`：

```ini
[Journal]
SystemMaxUse=500M
MaxRetentionSec=7day
```

修改后重启：`sudo systemctl restart systemd-journald`

### 应用日志清理

```bash
# 查看特定应用日志占用（以 suricata 为例）
sudo du -ah /var/log/suricata | sort -hr | head -20

# 清理备份和压缩日志
sudo rm /var/log/suricata/*.backup
sudo rm /var/log/suricata/*.gz

# 如果不再需要该服务，停用并清理
sudo systemctl stop suricata
sudo systemctl disable suricata
sudo rm -rf /var/log/suricata/*
```

### logrotate 配置

为自定义应用配置日志轮转，避免手动清理：

```bash
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
```

手动测试：`sudo logrotate -d /etc/logrotate.d/myapp`（dry-run）

## 缓存清理

### Go 缓存

```bash
# 清理当前用户的 Go 缓存
go clean -cache -modcache -testcache

# 清理其他用户的 Go 缓存
sudo -u ubuntu go clean -cache -modcache -testcache
sudo -u motern go clean -cache -modcache -testcache
```

### Node.js 缓存

```bash
# npm
npm cache clean --force

# yarn
yarn cache clean

# pnpm
pnpm store prune
```

### Docker 清理

```bash
# 查看 Docker 磁盘占用
docker system df

# 清理未使用的镜像、容器、网络
docker system prune -f

# 包括未使用的卷（谨慎）
docker system prune --volumes -f

# 清理悬空镜像
docker image prune -f
```

### 系统包管理器缓存

```bash
# Debian/Ubuntu
sudo apt clean
sudo apt autoremove -y

# CentOS/RHEL
sudo yum clean all
```

## PM2 进程管理

### 基本操作

```bash
# 启动应用
pm2 start app.js --name myapp

# 查看进程列表
pm2 list

# 查看详细信息
pm2 show myapp

# 重启 / 停止 / 删除
pm2 restart myapp
pm2 stop myapp
pm2 delete myapp
```

### 持久化与恢复

```bash
# 生成系统启动时自动加载 PM2 的脚本
pm2 startup

# 将当前进程列表写入 dump 文件
pm2 save

# 从保存的 dump 文件中恢复
pm2 resurrect
```

### 日志管理

```bash
# 查看日志
pm2 logs myapp

# 清空所有日志
pm2 flush

# 安装日志轮转模块
pm2 install pm2-logrotate

# 配置轮转参数
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

> 用户管理与权限相关内容已独立为 [Linux 用户管理与权限实战](./linux-user-permissions.md)。

## 常用运维工具推荐

| 工具 | 用途 | 安装 |
|------|------|------|
| `ncdu` | 交互式磁盘分析 | `apt install ncdu` |
| `htop` | 交互式进程查看 | `apt install htop` |
| `iotop` | 磁盘 I/O 监控 | `apt install iotop` |
| `duf` | 磁盘使用概览（df 替代） | `apt install duf` |
| `tldr` | 命令速查（man 简化版） | `npm install -g tldr` |
| `lazydocker` | Docker TUI 管理 | Go 安装 |
| `btop` | 系统资源综合监控 | `apt install btop` |
