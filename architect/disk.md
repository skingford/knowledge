# 磁盘清理

## 目录

```bash
# 先找 哪个目录占空间最大
sudo du -h --max-depth=1 / | sort -hr

sudo du -ah / | sort -rh | head -20

sudo du -h --max-depth=1 /var | sort -hr

sudo du -sh /var/log/*
```

```bash
# journal 日志
sudo journalctl --vacuum-time=1d

# suricata 
sudo du -ah /var/log/suricata | sort -hr | head -20

sudo rm /var/log/suricata/*.backup

sudo rm /var/log/suricata/*.gz

# 停用
sudo systemctl stop suricata
sudo systemctl disable suricata
sudo rm -rf /var/log/suricata/*

# go
go clean -cache -modcache -testcache
sudo -u ubuntu go clean -cache -modcache -testcache
sudo -u motern go clean -cache -modcache -testcache
```

## 运维神器

```bash
sudo apt install ncdu
sudo ncdu /
```

## pm2

```bash
# 生成系统启动时自动加载 PM2 的脚本
pm2 startup

# 将当前进程列表写入 dump 文件
pm2 save

# 从保存的 dump 文件中恢复
pm2 resurrect
```

## su

```bash
su - ubuntu
su - motern
```
