# Linux 用户管理与权限实战

覆盖用户切换、文件权限（chmod）、归属管理（chown）、umask、用户目录管理等日常运维高频操作。

## 用户切换与身份管理

### su 切换用户

```bash
# 切换到指定用户（加载完整环境，包括 PATH、HOME 等）
su - ubuntu
su - motern

# 仅切换用户，不加载目标用户环境（不推荐）
su ubuntu
```

`su -` 与 `su` 的区别：加 `-` 会执行目标用户的登录脚本（`.bash_profile` / `.bashrc`），等同于完整登录。

### sudo 提权

```bash
# 以 root 身份执行单条命令
sudo command

# 以其他用户身份执行命令
sudo -u ubuntu whoami
sudo -u motern bash -c 'echo $HOME'

# 打开 root shell（谨慎使用）
sudo -i

# 编辑 sudoers（安全方式，语法检查）
sudo visudo
```

sudoers 常用配置示例：

```bash
# 允许 deploy 用户免密执行 systemctl
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl

# 允许 ops 组的所有用户免密 sudo
%ops ALL=(ALL) NOPASSWD: ALL
```

### 查看用户信息

```bash
# 当前用户名
whoami

# 当前用户的 UID、GID 及所属组
id

# 查看指定用户的 UID 和组信息
id ubuntu

# 查看某用户所属的所有组
groups ubuntu
```

## 文件权限管理（chmod）

### 权限基础：rwx 与数字表示

| 权限 | 字母 | 数字 | 含义 |
|------|------|------|------|
| 读   | r    | 4    | 查看文件内容 / 列出目录内容 |
| 写   | w    | 2    | 修改文件 / 在目录中创建删除文件 |
| 执行 | x    | 1    | 执行文件 / 进入目录 |

权限分三段：**所有者（u）** / **所属组（g）** / **其他人（o）**

```
-rwxr-xr-- 1 ubuntu ops 4096 Mar 10 10:00 deploy.sh
 ^^^            所有者: rwx = 7
    ^^^         所属组: r-x = 5
       ^^^      其他人: r-- = 4
```

### chmod 常用操作

**数字模式**（推荐日常使用）：

```bash
chmod 755 deploy.sh     # 所有者 rwx，组和其他 r-x（脚本/可执行文件）
chmod 644 config.yml    # 所有者 rw-，组和其他 r--（配置文件）
chmod 600 id_rsa        # 仅所有者 rw-（私钥、敏感文件）
chmod 700 .ssh          # 仅所有者 rwx（SSH 目录）
chmod 777 tmp_dir       # 所有人完全权限（谨慎使用，一般仅 /tmp）
chmod 400 backup.key    # 仅所有者只读（证书、密钥备份）
```

常见权限数字速查：

| 数字 | 权限 | 典型用途 |
|------|------|----------|
| `755` | `rwxr-xr-x` | 可执行文件、脚本、目录 |
| `644` | `rw-r--r--` | 普通文件、配置、HTML/CSS |
| `600` | `rw-------` | 私钥、.env、敏感配置 |
| `700` | `rwx------` | ~/.ssh 目录、私有目录 |
| `750` | `rwxr-x---` | 组内可访问的应用目录 |
| `640` | `rw-r-----` | 组内可读的配置文件 |
| `400` | `r--------` | 只读密钥、证书 |

**符号模式**（适合精确增减权限）：

```bash
chmod +x deploy.sh      # 给所有人加执行权限（等同于 a+x，最常用）
chmod u+x script.sh     # 仅给所有者加执行权限
chmod g-w file.txt      # 去掉组的写权限
chmod o= file.txt       # 清空其他人的所有权限
chmod a+r readme.md     # 给所有人加读权限
chmod ug+rw,o-rwx data  # 组合写法
chmod -x script.sh      # 移除所有人的执行权限
```

### 常见场景速查

**下载的脚本无法执行：**

```bash
chmod +x install.sh     # 加执行权限
./install.sh            # 然后就能运行了
```

**SSH 连接报 "Permissions are too open"：**

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa          # 私钥必须 600
chmod 644 ~/.ssh/id_rsa.pub      # 公钥 644
chmod 644 ~/.ssh/authorized_keys
chmod 644 ~/.ssh/config
```

**部署 Web 站点后 403 Forbidden：**

```bash
# 目录需要 x 权限才能进入，文件不需要
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;
sudo chown -R www-data:www-data /var/www/html
```

**Git 拉取后脚本丢失执行权限：**

```bash
# 批量给 .sh 文件加执行权限
find . -name "*.sh" -exec chmod +x {} \;

# 让 Git 记住文件的执行权限变更
git update-index --chmod=+x deploy.sh
```

**数据库/应用敏感配置文件：**

```bash
chmod 600 .env                    # 仅所有者可读写
chmod 640 /etc/myapp/config.yml   # 所有者读写，组内可读
```

**日志目录权限（应用需要写入）：**

```bash
sudo mkdir -p /var/log/myapp
sudo chown appuser:appuser /var/log/myapp
chmod 755 /var/log/myapp
```

**递归修改**：

```bash
# 递归修改目录及其所有内容
chmod -R 755 /var/www/html

# 推荐做法：目录和文件分开设置
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
```

### 特殊权限位

| 权限 | 数字 | 作用 |
|------|------|------|
| SUID | 4000 | 可执行文件以**文件所有者**身份运行（如 `/usr/bin/passwd`） |
| SGID | 2000 | 目录下新建文件自动继承**目录的所属组** |
| Sticky Bit | 1000 | 目录中只有文件所有者才能删除自己的文件（如 `/tmp`） |

```bash
# 设置 SUID
chmod 4755 myapp

# 设置 SGID（共享目录常用）
chmod 2775 /shared/project

# 设置 Sticky Bit
chmod 1777 /tmp

# 查看特殊权限（ls 输出中的 s/S/t/T）
ls -la /usr/bin/passwd    # -rwsr-xr-x  （s 表示 SUID）
ls -la /tmp               # drwxrwxrwt  （t 表示 Sticky Bit）
```

## 文件归属管理（chown / chgrp）

### chown 修改所有者和组

```bash
# 同时修改所有者和组
chown ubuntu:ops deploy.sh

# 仅修改所有者
chown ubuntu deploy.sh

# 仅修改组
chown :ops deploy.sh

# 递归修改（整个目录树）
chown -R www-data:www-data /var/www/html
```

### chgrp 修改所属组

```bash
# 修改文件所属组
chgrp ops deploy.sh

# 递归修改
chgrp -R ops /shared/project
```

### 典型场景

```bash
# 场景 1：部署后修正 Web 目录归属
sudo chown -R www-data:www-data /var/www/mysite
sudo find /var/www/mysite -type d -exec chmod 755 {} \;
sudo find /var/www/mysite -type f -exec chmod 644 {} \;

# 场景 2：多用户共享目录（SGID 保证新文件继承组）
sudo mkdir -p /shared/project
sudo chown :devteam /shared/project
sudo chmod 2775 /shared/project

# 场景 3：应用数据目录
sudo chown -R appuser:appuser /opt/myapp/data
sudo chmod 750 /opt/myapp/data
```

## 默认权限控制（umask）

### umask 原理

新建文件/目录时，系统用默认权限减去 umask 值：

- 文件默认 `666`，目录默认 `777`
- umask `022` → 文件 `644`，目录 `755`
- umask `027` → 文件 `640`，目录 `750`
- umask `077` → 文件 `600`，目录 `700`

| umask | 文件权限 | 目录权限 | 适用场景 |
|-------|----------|----------|----------|
| 022   | 644      | 755      | 默认值，适合大多数场景 |
| 027   | 640      | 750      | 组内可读，其他人无权限 |
| 077   | 600      | 700      | 仅所有者可访问，安全敏感场景 |

### 查看与设置

```bash
# 查看当前 umask
umask

# 以符号形式查看
umask -S

# 临时设置
umask 027

# 持久化（添加到对应文件）
echo "umask 027" >> ~/.bashrc          # 当前用户
echo "umask 027" >> /etc/profile       # 所有用户（需 root）
```

## 用户与组管理

### 创建 / 删除用户

```bash
# 创建用户（-m 创建主目录，-s 指定 Shell）
sudo useradd -m -s /bin/bash deploy

# 设置密码
sudo passwd deploy

# 创建系统用户（无登录 Shell，适合服务账号）
sudo useradd -r -s /usr/sbin/nologin appuser

# 删除用户（-r 同时删除主目录和邮件）
sudo userdel -r deploy
```

### 创建 / 删除组

```bash
# 创建组
sudo groupadd devteam

# 删除组
sudo groupdel devteam
```

### 用户组操作

```bash
# 将用户追加到组（-a 追加，不会移除已有组）
sudo usermod -aG devteam deploy
sudo usermod -aG docker deploy    # 让用户免 sudo 使用 Docker

# 从组中移除用户
sudo gpasswd -d deploy devteam

# 切换当前会话的活跃组
newgrp devteam
```

::: warning 注意
`usermod -G`（不带 `-a`）会**覆盖**用户的所有附加组，务必带上 `-a` 参数追加。
:::

## 用户目录管理

### 修改用户主目录

```bash
# 修改主目录并迁移文件（-m 移动原目录内容）
sudo usermod -d /new/home/deploy -m deploy

# 仅修改记录，不迁移文件
sudo usermod -d /new/home/deploy deploy
```

### 修改默认 Shell

```bash
# 管理员修改
sudo usermod -s /bin/zsh deploy

# 用户自己修改
chsh -s /bin/bash

# 查看系统可用 Shell
cat /etc/shells
```

### /etc/passwd 与 /etc/shadow

`/etc/passwd` 每行格式：

```
username:x:UID:GID:comment:home_dir:shell
deploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash
```

| 字段 | 含义 |
|------|------|
| `username` | 用户名 |
| `x` | 密码占位（实际存在 /etc/shadow） |
| `UID` | 用户 ID（0=root，1000+ 普通用户） |
| `GID` | 主组 ID |
| `comment` | 注释 / 全名 |
| `home_dir` | 主目录路径 |
| `shell` | 登录 Shell |

### /etc/skel 模板目录

新用户主目录的默认文件来源：

```bash
# 查看模板内容
ls -la /etc/skel

# 添加自定义模板（新用户创建时自动复制）
sudo cp .bashrc_custom /etc/skel/.bashrc
sudo cp .vimrc /etc/skel/.vimrc
```

## 实用排查命令速查

```bash
# 查看文件权限和归属
ls -la /path/to/file

# 查看文件详细元数据（权限、inode、时间戳等）
stat /path/to/file

# 查找系统中所有 SUID 文件（安全审计）
sudo find / -perm -4000 -type f 2>/dev/null

# 查找某用户拥有的所有文件
sudo find / -user deploy -type f 2>/dev/null

# 查找无主文件（所有者已被删除）
sudo find / -nouser -o -nogroup 2>/dev/null

# ACL 扩展权限（精细到单个用户/组）
getfacl /shared/project
setfacl -m u:deploy:rwx /shared/project
setfacl -m g:devteam:rx /shared/project
```
