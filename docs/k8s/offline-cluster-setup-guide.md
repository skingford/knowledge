---
title: 内网离线集群搭建操作指南
description: 面向无法访问公网的内网环境，从零搭建生产可用 K8s 集群的完整操作指南，包含所有命令和配置文件，可直接复制执行。
---

# 内网离线集群搭建操作指南

这篇是一份完整的操作手册，面向的场景是：

- 服务器在内网，无法访问公网
- 不能用云托管 K8s，需要自己从零搭建
- 需要私有镜像仓库、离线安装包、自签证书
- 搭完要能跑业务，不是玩具集群

全文所有命令可以直接复制执行。基于 **Ubuntu 22.04 + K8s 1.30 + containerd + Calico** 这条主线，如果你用 CentOS/Rocky Linux 或其他版本，系统初始化部分需要微调。

## 环境规划

### 机器角色

| 角色 | 主机名 | IP（示例） | 配置 |
| --- | --- | --- | --- |
| 跳板机（有网，用于下载） | jump | 10.0.0.1 | 任意，需要公网访问 |
| 私有仓库 | harbor | 10.0.0.10 | 2C4G + 100G 磁盘 |
| Master 1 | master-1 | 10.0.0.11 | 4C8G |
| Master 2（高可用） | master-2 | 10.0.0.12 | 4C8G |
| Master 3（高可用） | master-3 | 10.0.0.13 | 4C8G |
| Worker 1 | worker-1 | 10.0.0.21 | 按业务需求 |
| Worker 2 | worker-2 | 10.0.0.22 | 按业务需求 |
| VIP（高可用） | — | 10.0.0.100 | keepalived 虚拟 IP |

> 如果只搭单 Master，跳过 master-2/3 和 VIP 相关步骤即可。

### 版本约定

```
K8s:         1.30.x
containerd:  1.7.x
Calico:      3.28.x
Harbor:      2.11.x
etcd:        内建（kubeadm 管理）
OS:          Ubuntu 22.04 LTS
```

---

## 第一步：在跳板机上准备离线资源

> 以下操作在**有公网访问的跳板机**上执行，下载完后通过 U 盘/SCP 传到内网。

### 1.1 下载 K8s 组件包

```bash
# 定义版本
K8S_VERSION="1.30.4"
CONTAINERD_VERSION="1.7.22"
RUNC_VERSION="1.1.14"
CNI_PLUGINS_VERSION="1.5.1"
CRICTL_VERSION="1.30.1"
CALICO_VERSION="3.28.1"
HELM_VERSION="3.16.1"

# 创建下载目录
mkdir -p /opt/k8s-offline/{bins,images,configs,harbor,charts}
cd /opt/k8s-offline

# 下载 containerd
wget https://github.com/containerd/containerd/releases/download/v${CONTAINERD_VERSION}/containerd-${CONTAINERD_VERSION}-linux-amd64.tar.gz -O bins/containerd.tar.gz

# 下载 runc
wget https://github.com/opencontainers/runc/releases/download/v${RUNC_VERSION}/runc.amd64 -O bins/runc.amd64

# 下载 CNI 插件
wget https://github.com/containernetworking/plugins/releases/download/v${CNI_PLUGINS_VERSION}/cni-plugins-linux-amd64-v${CNI_PLUGINS_VERSION}.tgz -O bins/cni-plugins.tgz

# 下载 crictl
wget https://github.com/kubernetes-sigs/cri-tools/releases/download/v${CRICTL_VERSION}/crictl-v${CRICTL_VERSION}-linux-amd64.tar.gz -O bins/crictl.tar.gz

# 下载 kubeadm、kubelet、kubectl
for comp in kubeadm kubelet kubectl; do
  wget https://dl.k8s.io/release/v${K8S_VERSION}/bin/linux/amd64/${comp} -O bins/${comp}
done

# 下载 Helm
wget https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz -O bins/helm.tar.gz

# 下载 kubelet systemd 配置
wget https://raw.githubusercontent.com/kubernetes/release/master/cmd/krel/templates/latest/kubelet/kubelet.service -O configs/kubelet.service
wget https://raw.githubusercontent.com/kubernetes/release/master/cmd/krel/templates/latest/kubeadm/10-kubeadm.conf -O configs/10-kubeadm.conf
```

### 1.2 下载 K8s 核心镜像

```bash
# 查看 kubeadm 需要的镜像列表
chmod +x bins/kubeadm
./bins/kubeadm config images list --kubernetes-version=v${K8S_VERSION}

# 拉取并保存为 tar
IMAGES=$(./bins/kubeadm config images list --kubernetes-version=v${K8S_VERSION})
for img in $IMAGES; do
  docker pull $img
done

# 额外拉取 Calico 镜像
CALICO_IMAGES=(
  "docker.io/calico/cni:v${CALICO_VERSION}"
  "docker.io/calico/node:v${CALICO_VERSION}"
  "docker.io/calico/kube-controllers:v${CALICO_VERSION}"
)
for img in "${CALICO_IMAGES[@]}"; do
  docker pull $img
done

# 保存所有镜像为 tar 包
docker save $(./bins/kubeadm config images list --kubernetes-version=v${K8S_VERSION}) -o images/k8s-core.tar
docker save ${CALICO_IMAGES[@]} -o images/calico.tar
```

### 1.3 下载其他组件镜像

```bash
# ingress-nginx
INGRESS_IMAGES=(
  "registry.k8s.io/ingress-nginx/controller:v1.11.2"
  "registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.4.3"
)
for img in "${INGRESS_IMAGES[@]}"; do
  docker pull $img
done
docker save ${INGRESS_IMAGES[@]} -o images/ingress-nginx.tar

# metrics-server
docker pull registry.k8s.io/metrics-server/metrics-server:v0.7.2
docker save registry.k8s.io/metrics-server/metrics-server:v0.7.2 -o images/metrics-server.tar

# local-path-provisioner（本地存储）
docker pull rancher/local-path-provisioner:v0.0.28
docker save rancher/local-path-provisioner:v0.0.28 -o images/local-path-provisioner.tar
```

### 1.4 下载 Calico 离线 manifest

```bash
wget https://raw.githubusercontent.com/projectcalico/calico/v${CALICO_VERSION}/manifests/calico.yaml -O configs/calico.yaml
```

### 1.5 下载 Harbor 离线安装包

```bash
wget https://github.com/goharbor/harbor/releases/download/v2.11.1/harbor-offline-installer-v2.11.1.tgz -O harbor/harbor-offline.tgz
```

### 1.6 下载高可用组件（可选）

```bash
# 如果搭建 3 Master 高可用
apt download keepalived haproxy
# 或者用 docker 保存
docker pull haproxy:2.9
docker save haproxy:2.9 -o images/haproxy.tar
```

### 1.7 打包传输到内网

```bash
cd /opt
tar czf k8s-offline.tar.gz k8s-offline/
# scp 或 U 盘传到内网所有机器的 /opt/ 目录
```

---

## 第二步：所有节点系统初始化

> 以下操作在**每一台内网机器**（master + worker + harbor）上执行。

### 2.1 设置主机名和 hosts

```bash
# 每台机器设置对应主机名
hostnamectl set-hostname master-1  # 在 master-1 上
hostnamectl set-hostname worker-1  # 在 worker-1 上
# ...以此类推

# 所有机器加 hosts（或用内网 DNS）
cat >> /etc/hosts << 'EOF'
10.0.0.10  harbor harbor.internal
10.0.0.11  master-1
10.0.0.12  master-2
10.0.0.13  master-3
10.0.0.21  worker-1
10.0.0.22  worker-2
10.0.0.100 k8s-vip
EOF
```

### 2.2 关闭 swap 和防火墙

```bash
# 关闭 swap
swapoff -a
sed -i '/swap/d' /etc/fstab

# 关闭防火墙（内网环境）
systemctl stop ufw && systemctl disable ufw
# CentOS/Rocky: systemctl stop firewalld && systemctl disable firewalld
```

### 2.3 加载内核模块和参数

```bash
# 加载必要模块
cat > /etc/modules-load.d/k8s.conf << 'EOF'
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# 设置内核参数
cat > /etc/sysctl.d/k8s.conf << 'EOF'
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sysctl --system
```

### 2.4 安装 containerd

```bash
cd /opt/k8s-offline

# 安装 containerd
tar xzf bins/containerd.tar.gz -C /usr/local

# 安装 runc
install -m 755 bins/runc.amd64 /usr/local/sbin/runc

# 安装 CNI 插件
mkdir -p /opt/cni/bin
tar xzf bins/cni-plugins.tgz -C /opt/cni/bin

# 安装 crictl
tar xzf bins/crictl.tar.gz -C /usr/local/bin

# 生成 containerd 默认配置
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

# 修改配置：使用 systemd cgroup 驱动
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# 修改配置：指向私有仓库（sandbox 镜像用私有仓库地址）
sed -i 's|sandbox_image = "registry.k8s.io/pause:.*"|sandbox_image = "harbor.internal/k8s/pause:3.9"|' /etc/containerd/config.toml

# 配置私有仓库信任（自签证书）
mkdir -p /etc/containerd/certs.d/harbor.internal
cat > /etc/containerd/certs.d/harbor.internal/hosts.toml << 'EOF'
server = "https://harbor.internal"

[host."https://harbor.internal"]
  capabilities = ["pull", "resolve", "push"]
  skip_verify = false
  ca = "/etc/ssl/certs/harbor-ca.crt"
EOF

# 创建 systemd 服务
cat > /etc/systemd/system/containerd.service << 'EOF'
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd
Type=notify
Delegate=yes
KillMode=process
Restart=always
RestartSec=5
LimitNPROC=infinity
LimitCORE=infinity
LimitNOFILE=infinity
TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now containerd

# 验证
crictl --runtime-endpoint unix:///run/containerd/containerd.sock version
```

### 2.5 安装 kubelet / kubeadm / kubectl

```bash
cd /opt/k8s-offline

# 安装二进制
install -m 755 bins/kubeadm /usr/local/bin/kubeadm
install -m 755 bins/kubelet /usr/local/bin/kubelet
install -m 755 bins/kubectl /usr/local/bin/kubectl

# 安装 kubelet systemd 服务
sed 's|/usr/bin|/usr/local/bin|g' configs/kubelet.service > /etc/systemd/system/kubelet.service

mkdir -p /etc/systemd/system/kubelet.service.d
sed 's|/usr/bin|/usr/local/bin|g' configs/10-kubeadm.conf > /etc/systemd/system/kubelet.service.d/10-kubeadm.conf

systemctl daemon-reload
systemctl enable kubelet
# kubelet 会反复重启直到 kubeadm init 完成，这是正常的

# 安装 Helm（master 节点和运维机）
tar xzf bins/helm.tar.gz -C /tmp
install -m 755 /tmp/linux-amd64/helm /usr/local/bin/helm
```

### 2.6 配置 crictl

```bash
cat > /etc/crictl.yaml << 'EOF'
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
EOF
```

---

## 第三步：搭建私有镜像仓库（Harbor）

> 在 **harbor（10.0.0.10）** 机器上执行。

### 3.1 安装 Docker（Harbor 依赖）

```bash
# Harbor 运行依赖 docker-compose，先装 Docker
# 如果内网也没有 Docker，需要提前在跳板机下载 docker 离线包
# 这里假设已经有 Docker 或通过离线包安装

# 验证
docker version
docker compose version
```

### 3.2 生成自签证书

```bash
mkdir -p /etc/harbor/ssl
cd /etc/harbor/ssl

# 生成 CA 私钥和证书
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Internal/CN=Internal CA" \
  -key ca.key -out ca.crt

# 生成 Harbor 服务端私钥
openssl genrsa -out harbor.key 4096

# 生成 CSR
openssl req -sha512 -new \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Internal/CN=harbor.internal" \
  -key harbor.key -out harbor.csr

# 生成扩展配置
cat > v3.ext << 'EOF'
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harbor.internal
DNS.2=harbor
IP.1=10.0.0.10
EOF

# 签发证书
openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr -out harbor.crt

echo "证书生成完成"
ls -la /etc/harbor/ssl/
```

### 3.3 分发 CA 证书到所有节点

```bash
# 在每台 K8s 节点上执行（或批量 scp）
# 把 ca.crt 复制到所有节点
scp /etc/harbor/ssl/ca.crt root@master-1:/etc/ssl/certs/harbor-ca.crt
scp /etc/harbor/ssl/ca.crt root@master-2:/etc/ssl/certs/harbor-ca.crt
scp /etc/harbor/ssl/ca.crt root@master-3:/etc/ssl/certs/harbor-ca.crt
scp /etc/harbor/ssl/ca.crt root@worker-1:/etc/ssl/certs/harbor-ca.crt
scp /etc/harbor/ssl/ca.crt root@worker-2:/etc/ssl/certs/harbor-ca.crt

# 在每台节点上更新证书信任
# Ubuntu:
update-ca-certificates
# CentOS/Rocky:
# update-ca-trust
```

### 3.4 安装 Harbor

```bash
cd /opt/k8s-offline/harbor
tar xzf harbor-offline.tgz
cd harbor

# 复制并编辑配置
cp harbor.yml.tmpl harbor.yml
```

编辑 `harbor.yml`，关键修改项：

```yaml
# harbor.yml 关键配置
hostname: harbor.internal

https:
  port: 443
  certificate: /etc/harbor/ssl/harbor.crt
  private_key: /etc/harbor/ssl/harbor.key

harbor_admin_password: Harbor12345    # 修改为强密码

data_volume: /data/harbor
```

```bash
# 执行安装
./install.sh

# 验证
docker compose ps
curl -k https://harbor.internal/api/v2.0/health
```

### 3.5 创建项目并导入镜像

```bash
# 登录 Harbor
docker login harbor.internal -u admin -p Harbor12345

# 在 Harbor Web UI 或 API 创建项目
curl -k -u admin:Harbor12345 -X POST \
  https://harbor.internal/api/v2.0/projects \
  -H "Content-Type: application/json" \
  -d '{"project_name":"k8s","public":true}'

curl -k -u admin:Harbor12345 -X POST \
  https://harbor.internal/api/v2.0/projects \
  -H "Content-Type: application/json" \
  -d '{"project_name":"calico","public":true}'

curl -k -u admin:Harbor12345 -X POST \
  https://harbor.internal/api/v2.0/projects \
  -H "Content-Type: application/json" \
  -d '{"project_name":"infra","public":true}'

# 导入 K8s 核心镜像
docker load -i /opt/k8s-offline/images/k8s-core.tar

# 重新 tag 并 push 到 Harbor
# 以 pause 为例，其他镜像同理
for img in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'registry.k8s.io'); do
  new_tag="harbor.internal/k8s/$(echo $img | sed 's|registry.k8s.io/||')"
  docker tag $img $new_tag
  docker push $new_tag
  echo "Pushed: $new_tag"
done

# 导入 Calico 镜像
docker load -i /opt/k8s-offline/images/calico.tar
for img in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'calico/'); do
  new_tag="harbor.internal/calico/$(echo $img | sed 's|docker.io/calico/||' | sed 's|calico/||')"
  docker tag $img $new_tag
  docker push $new_tag
  echo "Pushed: $new_tag"
done

# 导入其他镜像
docker load -i /opt/k8s-offline/images/ingress-nginx.tar
docker load -i /opt/k8s-offline/images/metrics-server.tar
docker load -i /opt/k8s-offline/images/local-path-provisioner.tar

# 逐个 tag + push（按实际镜像名操作）
```

### 3.6 验证镜像可拉取

```bash
# 在任意 K8s 节点上验证
crictl pull harbor.internal/k8s/pause:3.9
```

---

## 第四步：初始化控制面

### 方案 A：单 Master（简单方案）

> 在 **master-1（10.0.0.11）** 上执行。

```bash
# 创建 kubeadm 配置文件
cat > /etc/kubernetes/kubeadm-config.yaml << 'EOF'
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: "1.30.4"
imageRepository: harbor.internal/k8s
networking:
  podSubnet: "192.168.0.0/16"
  serviceSubnet: "10.96.0.0/12"
  dnsDomain: "cluster.local"
apiServer:
  certSANs:
    - "master-1"
    - "10.0.0.11"
    - "127.0.0.1"
controllerManager:
  extraArgs:
    bind-address: "0.0.0.0"
scheduler:
  extraArgs:
    bind-address: "0.0.0.0"
etcd:
  local:
    dataDir: /var/lib/etcd
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
containerRuntimeEndpoint: unix:///run/containerd/containerd.sock
EOF

# 预检
kubeadm init --config /etc/kubernetes/kubeadm-config.yaml --dry-run

# 正式初始化
kubeadm init --config /etc/kubernetes/kubeadm-config.yaml --upload-certs

# 配置 kubectl
mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 验证
kubectl get nodes
# 此时 master-1 状态为 NotReady（因为还没装 CNI）
```

**记下输出中的 `kubeadm join` 命令，后面 worker 加入时要用。**

### 方案 B：3 Master 高可用

#### B.1 搭建负载均衡（在 master-1/2/3 上）

```bash
# 安装 keepalived 和 haproxy
# 如果离线，用提前下载的 deb/rpm 包安装
apt install -y keepalived haproxy  # 或离线安装

# --- haproxy 配置（三台 master 相同）---
cat > /etc/haproxy/haproxy.cfg << 'EOF'
global
  log /dev/log local0
  maxconn 4096

defaults
  log     global
  mode    tcp
  timeout connect 5s
  timeout client  30s
  timeout server  30s

frontend k8s-apiserver
  bind *:8443
  default_backend k8s-apiserver-backend

backend k8s-apiserver-backend
  option tcp-check
  balance roundrobin
  server master-1 10.0.0.11:6443 check fall 3 rise 2
  server master-2 10.0.0.12:6443 check fall 3 rise 2
  server master-3 10.0.0.13:6443 check fall 3 rise 2
EOF

systemctl enable --now haproxy
```

```bash
# --- keepalived 配置（master-1 为 MASTER，其他为 BACKUP）---

# master-1 上：
cat > /etc/keepalived/keepalived.conf << 'EOF'
vrrp_instance K8S_VIP {
    state MASTER
    interface eth0            # 改为实际网卡名
    virtual_router_id 51
    priority 100              # master-2 设 99，master-3 设 98
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA
    }
    virtual_ipaddress {
        10.0.0.100/24         # VIP
    }
}
EOF

systemctl enable --now keepalived

# 验证 VIP
ip addr show eth0 | grep 10.0.0.100
```

#### B.2 初始化第一个 Master

```bash
cat > /etc/kubernetes/kubeadm-config.yaml << 'EOF'
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: "1.30.4"
imageRepository: harbor.internal/k8s
controlPlaneEndpoint: "10.0.0.100:8443"
networking:
  podSubnet: "192.168.0.0/16"
  serviceSubnet: "10.96.0.0/12"
  dnsDomain: "cluster.local"
apiServer:
  certSANs:
    - "k8s-vip"
    - "master-1"
    - "master-2"
    - "master-3"
    - "10.0.0.100"
    - "10.0.0.11"
    - "10.0.0.12"
    - "10.0.0.13"
controllerManager:
  extraArgs:
    bind-address: "0.0.0.0"
scheduler:
  extraArgs:
    bind-address: "0.0.0.0"
etcd:
  local:
    dataDir: /var/lib/etcd
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
containerRuntimeEndpoint: unix:///run/containerd/containerd.sock
EOF

kubeadm init --config /etc/kubernetes/kubeadm-config.yaml --upload-certs

mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config
```

**记下输出中两条 join 命令（control-plane 和 worker 各一条）。**

#### B.3 加入另外两个 Master

在 master-2 和 master-3 上执行 kubeadm init 输出的 **control-plane join** 命令：

```bash
# 示例（用实际输出替换 token 和 hash）
kubeadm join 10.0.0.100:8443 --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --control-plane --certificate-key <cert-key> \
  --cri-socket unix:///run/containerd/containerd.sock
```

---

## 第五步：加入 Worker 节点

> 在每台 **worker** 节点上执行。

```bash
# 使用 kubeadm init 输出的 worker join 命令
kubeadm join 10.0.0.100:8443 --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --cri-socket unix:///run/containerd/containerd.sock
```

如果 token 过期（24 小时有效），在 master 上重新生成：

```bash
kubeadm token create --print-join-command
```

验证：

```bash
# 在 master 上
kubectl get nodes
# 所有节点应该出现，状态 NotReady（还没装 CNI）
```

---

## 第六步：部署 CNI 网络插件（Calico）

> 在 **master-1** 上执行。

### 6.1 修改 Calico manifest 中的镜像地址

```bash
cd /opt/k8s-offline/configs

# 替换镜像地址为私有仓库
sed -i 's|docker.io/calico/cni:|harbor.internal/calico/cni:|g' calico.yaml
sed -i 's|docker.io/calico/node:|harbor.internal/calico/node:|g' calico.yaml
sed -i 's|docker.io/calico/kube-controllers:|harbor.internal/calico/kube-controllers:|g' calico.yaml

# 确认 CIDR 与 kubeadm 配置一致（默认 192.168.0.0/16）
grep -A1 'CALICO_IPV4POOL_CIDR' calico.yaml
```

### 6.2 部署

```bash
kubectl apply -f calico.yaml

# 等待 Calico Pod 就绪
kubectl get pods -n kube-system -l k8s-app=calico-node -w
# 等所有节点的 calico-node 变为 Running

# 验证节点变为 Ready
kubectl get nodes
# 所有节点应该变为 Ready 状态
```

---

## 第七步：部署核心组件

### 7.1 Metrics Server

```bash
# 在 master-1 上创建 manifest
cat > /tmp/metrics-server.yaml << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:aggregated-metrics-reader
rules:
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: metrics-server:system:auth-delegator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
  - kind: ServiceAccount
    name: metrics-server
    namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:metrics-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
  - kind: ServiceAccount
    name: metrics-server
    namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:metrics-server
rules:
  - apiGroups: [""]
    resources: ["nodes/metrics", "pods", "nodes", "namespaces", "configmaps"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: metrics-server-auth-reader
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: extension-apiserver-authentication-reader
subjects:
  - kind: ServiceAccount
    name: metrics-server
    namespace: kube-system
---
apiVersion: v1
kind: Service
metadata:
  name: metrics-server
  namespace: kube-system
spec:
  ports:
    - port: 443
      protocol: TCP
      targetPort: 4443
  selector:
    k8s-app: metrics-server
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      serviceAccountName: metrics-server
      containers:
        - name: metrics-server
          image: harbor.internal/infra/metrics-server:v0.7.2
          args:
            - --cert-dir=/tmp
            - --secure-port=4443
            - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
            - --kubelet-use-node-status-port
            - --metric-resolution=15s
            - --kubelet-insecure-tls
          ports:
            - containerPort: 4443
              protocol: TCP
          resources:
            requests:
              cpu: 100m
              memory: 200Mi
---
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  name: v1beta1.metrics.k8s.io
spec:
  service:
    name: metrics-server
    namespace: kube-system
  group: metrics.k8s.io
  version: v1beta1
  insecureSkipTLSVerify: true
  groupPriorityMinimum: 100
  versionPriority: 100
EOF

kubectl apply -f /tmp/metrics-server.yaml

# 等待就绪后验证
kubectl top nodes
```

### 7.2 本地存储 StorageClass（local-path-provisioner）

```bash
cat > /tmp/local-path-provisioner.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: local-path-storage
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: local-path-provisioner-service-account
  namespace: local-path-storage
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: local-path-provisioner-role
rules:
  - apiGroups: [""]
    resources: ["nodes", "persistentvolumeclaims", "configmaps", "pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "patch", "update", "delete"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "patch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: local-path-provisioner-bind
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: local-path-provisioner-role
subjects:
  - kind: ServiceAccount
    name: local-path-provisioner-service-account
    namespace: local-path-storage
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: local-path-provisioner
  namespace: local-path-storage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: local-path-provisioner
  template:
    metadata:
      labels:
        app: local-path-provisioner
    spec:
      serviceAccountName: local-path-provisioner-service-account
      containers:
        - name: local-path-provisioner
          image: harbor.internal/infra/local-path-provisioner:v0.0.28
          command:
            - local-path-provisioner
            - --debug
            - start
            - --config
            - /etc/config/config.json
          volumeMounts:
            - name: config-volume
              mountPath: /etc/config/
          env:
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
      volumes:
        - name: config-volume
          configMap:
            name: local-path-config
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-path-config
  namespace: local-path-storage
data:
  config.json: |-
    {
      "nodePathMap": [
        {
          "node": "DEFAULT_PATH_FOR_NON_LISTED_NODES",
          "paths": ["/opt/local-path-provisioner"]
        }
      ]
    }
  helperPod.yaml: |-
    apiVersion: v1
    kind: Pod
    metadata:
      name: helper-pod
    spec:
      containers:
      - name: helper-pod
        image: harbor.internal/k8s/pause:3.9
EOF

kubectl apply -f /tmp/local-path-provisioner.yaml

# 验证
kubectl get sc
# 应显示 local-path (default)
```

---

## 第八步：集群验证

### 8.1 逐步验证清单

```bash
echo "=== 1. 节点状态 ==="
kubectl get nodes -o wide

echo "=== 2. 系统 Pod ==="
kubectl get pods -n kube-system

echo "=== 3. CoreDNS ==="
kubectl get pods -n kube-system -l k8s-app=kube-dns

echo "=== 4. DNS 解析 ==="
kubectl run test-dns --rm -it --restart=Never --image=harbor.internal/infra/busybox:latest -- nslookup kubernetes.default.svc.cluster.local

echo "=== 5. Pod 调度 ==="
kubectl run test-pod --rm -it --restart=Never --image=harbor.internal/infra/busybox:latest -- echo "Pod scheduling works"

echo "=== 6. 跨节点通信 ==="
# 创建两个 Pod 在不同节点
kubectl create deployment test-deploy --image=harbor.internal/k8s/pause:3.9 --replicas=3
kubectl get pods -o wide
# 确认分布在不同节点
kubectl delete deployment test-deploy

echo "=== 7. Metrics ==="
kubectl top nodes

echo "=== 8. 存储 ==="
cat <<'TESTPVC' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-pvc
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: test-storage
spec:
  containers:
    - name: test
      image: harbor.internal/infra/busybox:latest
      command: ["sh", "-c", "echo hello > /data/test.txt && cat /data/test.txt && sleep 10"]
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: test-pvc
  restartPolicy: Never
TESTPVC

sleep 15
kubectl logs test-storage
# 应输出 hello
kubectl delete pod test-storage
kubectl delete pvc test-pvc
```

### 8.2 验证通过标准

| 检查项 | 预期结果 |
| --- | --- |
| 所有节点 Ready | `kubectl get nodes` 全部 Ready |
| 系统 Pod 全部 Running | `kube-system` 无 CrashLoop / Pending |
| DNS 解析正常 | nslookup kubernetes 返回 ClusterIP |
| 跨节点 Pod 通信正常 | 不同节点的 Pod 能互通 |
| kubectl top 有数据 | Metrics Server 正常 |
| PVC 能创建和挂载 | StorageClass 动态供给正常 |

---

## 第九步：日常运维

### 9.1 证书续期

kubeadm 签发的证书默认 1 年有效，需要定期续期：

```bash
# 查看证书过期时间
kubeadm certs check-expiration

# 续期所有证书
kubeadm certs renew all

# 重启控制面组件
systemctl restart kubelet
# 或者重启 static pod（删除 /etc/kubernetes/manifests/ 下的文件再放回）

# 更新 kubeconfig
cp /etc/kubernetes/admin.conf $HOME/.kube/config
```

建议设置 cron 定时提醒：

```bash
# 每月 1 号检查证书
echo '0 9 1 * * root kubeadm certs check-expiration >> /var/log/k8s-cert-check.log' >> /etc/crontab
```

### 9.2 新增 Worker 节点

```bash
# 1. 新节点完成系统初始化（第二步全部操作）
# 2. 在 master 上生成新的 join 命令
kubeadm token create --print-join-command

# 3. 在新节点执行 join 命令
kubeadm join 10.0.0.100:8443 --token <new-token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --cri-socket unix:///run/containerd/containerd.sock

# 4. 验证
kubectl get nodes
```

### 9.3 集群版本升级（离线方式）

```bash
# 1. 在跳板机下载新版本二进制（同第一步）
# 2. 传到内网

# 3. 先升级 master（逐台）
# 在 master-1 上：
install -m 755 /opt/k8s-offline/bins/kubeadm /usr/local/bin/kubeadm
kubeadm upgrade plan
kubeadm upgrade apply v1.31.0 --config /etc/kubernetes/kubeadm-config.yaml

install -m 755 /opt/k8s-offline/bins/kubelet /usr/local/bin/kubelet
install -m 755 /opt/k8s-offline/bins/kubectl /usr/local/bin/kubectl
systemctl daemon-reload
systemctl restart kubelet

# 4. 再升级 worker（逐台 cordon + drain + 升级 + uncordon）
kubectl cordon worker-1
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data

# 在 worker-1 上：
install -m 755 /opt/k8s-offline/bins/kubeadm /usr/local/bin/kubeadm
kubeadm upgrade node
install -m 755 /opt/k8s-offline/bins/kubelet /usr/local/bin/kubelet
systemctl daemon-reload
systemctl restart kubelet

# 回到 master：
kubectl uncordon worker-1
```

### 9.4 etcd 备份与恢复

```bash
# 备份
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# 验证备份
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-$(date +%Y%m%d).db --write-out=table

# 定时备份 cron
echo '0 2 * * * root ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +\%Y\%m\%d).db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key && find /backup -name "etcd-*.db" -mtime +7 -delete' >> /etc/crontab
```

---

## 常见离线环境踩坑

**坑 1：sandbox 镜像拉不到导致所有 Pod 起不来**

containerd 的 `sandbox_image` 默认指向 `registry.k8s.io/pause:3.9`，内网拉不到。必须在 `config.toml` 里改成私有仓库地址。

**坑 2：自签证书不受信任**

containerd 和 kubelet 都需要信任 Harbor 的 CA 证书。如果忘了分发 CA 或忘了 `update-ca-certificates`，拉镜像会报 `x509: certificate signed by unknown authority`。

**坑 3：CoreDNS 启动失败因为镜像地址不对**

kubeadm 会自动创建 CoreDNS Deployment，镜像地址取决于 `imageRepository` 配置。如果配错了，CoreDNS 起不来，集群内 DNS 全部失败。

**坑 4：Calico 镜像地址没全部替换**

calico.yaml 里有多处镜像引用，漏改一处就会导致对应 Pod 起不来。用 `grep -n 'image:' calico.yaml` 确认全部替换。

**坑 5：kubeadm join 的 token 过期**

token 默认 24 小时有效。如果离线准备耗时较长，join 时 token 已经过期，需要在 master 上 `kubeadm token create` 重新生成。

**坑 6：时间不同步导致证书校验失败**

内网没有 NTP 服务器，各节点时间不一致会导致 TLS 证书校验失败。搭建前先确保所有节点时间同步（内网搭 chrony 或手动同步）。

```bash
# 检查时间
date
timedatectl

# 手动同步（或配置内网 NTP）
timedatectl set-ntp false
timedatectl set-time '2026-03-25 10:00:00'
```

> 内网搭 K8s 最核心的一条原则：**所有"从外面拉"的依赖，都要提前在有网环境下载好、导入私有仓库、替换 manifest 里的镜像地址。漏一个组件就会卡在那里。**

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md)
- [实战部署指南](./production-deployment-guide.md)
- [控制面主线实战](./control-plane-mainline.md)
- [节点执行链路实战](./node-execution-chain.md)
- [节点心跳、Lease 与失联驱逐边界实战](./node-heartbeat-lease-and-failure-eviction.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [Helm 与包管理实战](./helm-and-package-management.md)
- [可观测性与监控实战](./observability-and-monitoring.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [Secret 安全、etcd 加密与外部 Secret 管理边界实战](./secret-security-and-external-secret-management.md)
