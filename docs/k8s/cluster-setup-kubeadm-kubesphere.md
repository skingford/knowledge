---
title: 从零搭建生产级 K8s 集群全栈操作手册
description: 完整的生产级 K8s 集群搭建操作手册，覆盖核心组件和运维增强组件，所有命令可直接复制执行。
---

# 从零搭建生产级 K8s 集群

### 核心组件

| 层级 | 组件 |
| --- | --- |
| 集群搭建 | kubeadm |
| 容器运行时 | containerd |
| 网络插件 | Calico |
| 可视化面板 | KubeSphere |
| 包管理 | Helm |
| Ingress | Nginx Ingress Controller |

### 运维增强组件

| 层级 | 组件 |
| --- | --- |
| 监控告警 | Prometheus + Grafana + Alertmanager |
| 日志 | Loki + Promtail |
| 分布式存储 | Longhorn |
| 证书管理 | cert-manager |
| 镜像仓库 | Harbor |
| 备份恢复 | Velero |

本文分两个阶段：**第一步到第十步** 搭建核心组件，**第十一步到第十六步** 部署运维增强组件。每一步验证通过再进下一步。

如果你在内网离线环境，参考 [内网离线集群搭建操作指南](./offline-cluster-setup-guide.md) 提前准备离线资源，再回到本文的操作步骤。

---

## 环境规划

### 机器清单

| 角色 | 主机名 | IP（示例） | 最低配置 | 推荐配置 |
| --- | --- | --- | --- | --- |
| Master 1 | master-1 | 10.0.0.11 | 4C8G | 8C16G |
| Master 2 | master-2 | 10.0.0.12 | 4C8G | 8C16G |
| Master 3 | master-3 | 10.0.0.13 | 4C8G | 8C16G |
| Worker 1 | worker-1 | 10.0.0.21 | 4C8G | 按业务定 |
| Worker 2 | worker-2 | 10.0.0.22 | 4C8G | 按业务定 |
| VIP | — | 10.0.0.100 | — | keepalived 虚拟 IP |

> KubeSphere 全功能安装至少需要 **8C16G** 的 Master 节点。如果 Master 配置不够，可以让 KubeSphere 组件调度到 Worker 上。
>
> 如果只搭单 Master，跳过 master-2/3、VIP、keepalived/haproxy 相关步骤。

### 版本约定

```
OS:          Ubuntu 22.04 LTS（CentOS 7/Rocky 9 也可，部分命令需微调）
K8s:         1.30.4
containerd:  1.7.x（通过 apt/yum 安装）
Calico:      3.28.x
KubeSphere:  4.1.2
Helm:        3.16.x
Ingress:     ingress-nginx 1.11.x
```

### 网段规划

```
节点网络:    10.0.0.0/24（已有的物理/VPC 网段）
Pod CIDR:    192.168.0.0/16（Calico 默认）
Service CIDR: 10.96.0.0/12（K8s 默认）
```

---

## 第一步：所有节点系统初始化

> 以下操作在**每台机器**上执行（master + worker）。

### 1.1 设置主机名和 hosts

```bash
# 每台设置对应主机名
hostnamectl set-hostname master-1   # 在 master-1 上执行
# hostnamectl set-hostname master-2 # 在 master-2 上执行
# ...以此类推

# 所有机器写 hosts
cat >> /etc/hosts << 'EOF'
10.0.0.11 master-1
10.0.0.12 master-2
10.0.0.13 master-3
10.0.0.21 worker-1
10.0.0.22 worker-2
10.0.0.100 k8s-vip
EOF
```

### 1.2 关闭 swap

```bash
swapoff -a
sed -i '/swap/s/^/#/' /etc/fstab

# 验证
free -h
# Swap 行应该全是 0
```

### 1.3 关闭防火墙（或开放所需端口）

```bash
# Ubuntu
systemctl stop ufw && systemctl disable ufw

# CentOS/Rocky
# systemctl stop firewalld && systemctl disable firewalld
# 或者按需开放端口（6443, 2379-2380, 10250-10252, 30000-32767）
```

### 1.4 加载内核模块

```bash
cat > /etc/modules-load.d/k8s.conf << 'EOF'
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# 验证
lsmod | grep -E "overlay|br_netfilter"
```

### 1.5 设置内核参数

```bash
cat > /etc/sysctl.d/k8s.conf << 'EOF'
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
net.ipv4.conf.all.rp_filter         = 0
EOF

sysctl --system
```

### 1.6 时间同步

```bash
# Ubuntu
apt update && apt install -y chrony
systemctl enable --now chrony

# 验证
chronyc tracking
timedatectl
```

---

## 第二步：安装 containerd

> 所有节点执行。

### 2.1 安装

```bash
# 添加 Docker 官方仓库（containerd 在这里分发）
apt install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt update
apt install -y containerd.io

# CentOS/Rocky:
# yum install -y yum-utils
# yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# yum install -y containerd.io
```

### 2.2 配置

```bash
# 生成默认配置
containerd config default > /etc/containerd/config.toml

# 启用 SystemdCgroup（K8s 必需）
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# 如果需要换国内镜像加速（可选）
# sed -i 's|registry.k8s.io/pause:3.8|registry.aliyuncs.com/google_containers/pause:3.9|' /etc/containerd/config.toml

# 重启
systemctl restart containerd
systemctl enable containerd

# 验证
systemctl status containerd
```

### 2.3 安装 crictl

```bash
CRICTL_VERSION="1.30.1"
curl -L https://github.com/kubernetes-sigs/cri-tools/releases/download/v${CRICTL_VERSION}/crictl-v${CRICTL_VERSION}-linux-amd64.tar.gz | tar xz -C /usr/local/bin

cat > /etc/crictl.yaml << 'EOF'
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
EOF

# 验证
crictl version
```

---

## 第三步：安装 kubeadm / kubelet / kubectl

> 所有节点执行。

```bash
# 添加 K8s 官方仓库
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" > /etc/apt/sources.list.d/kubernetes.list

apt update
apt install -y kubelet=1.30.4-* kubeadm=1.30.4-* kubectl=1.30.4-*

# 锁定版本，防止自动升级
apt-mark hold kubelet kubeadm kubectl

# CentOS/Rocky:
# cat > /etc/yum.repos.d/kubernetes.repo << 'EOF'
# [kubernetes]
# name=Kubernetes
# baseurl=https://pkgs.k8s.io/core:/stable:/v1.30/rpm/
# enabled=1
# gpgcheck=1
# gpgkey=https://pkgs.k8s.io/core:/stable:/v1.30/rpm/repodata/repomd.xml.key
# EOF
# yum install -y kubelet-1.30.4 kubeadm-1.30.4 kubectl-1.30.4
# yum versionlock kubelet kubeadm kubectl

# 启用 kubelet（会反复重启直到 init 完成，正常现象）
systemctl enable kubelet
```

---

## 第四步：搭建高可用负载均衡（多 Master）

> 在 **master-1 / master-2 / master-3** 三台上执行。单 Master 跳过此步。

### 4.1 安装 haproxy + keepalived

```bash
apt install -y haproxy keepalived
```

### 4.2 配置 haproxy（三台相同）

```bash
cat > /etc/haproxy/haproxy.cfg << 'EOF'
global
    log /dev/log local0
    maxconn 4096
    daemon

defaults
    log     global
    mode    tcp
    option  tcplog
    timeout connect 5s
    timeout client  50s
    timeout server  50s

frontend k8s-apiserver
    bind *:8443
    default_backend k8s-apiserver-backend

backend k8s-apiserver-backend
    option tcp-check
    balance roundrobin
    server master-1 10.0.0.11:6443 check fall 3 rise 2 inter 3s
    server master-2 10.0.0.12:6443 check fall 3 rise 2 inter 3s
    server master-3 10.0.0.13:6443 check fall 3 rise 2 inter 3s
EOF

systemctl restart haproxy
systemctl enable haproxy
```

### 4.3 配置 keepalived

**master-1（MASTER）：**

```bash
cat > /etc/keepalived/keepalived.conf << 'EOF'
global_defs {
    router_id K8S_MASTER_1
}

vrrp_script check_haproxy {
    script "/bin/bash -c 'if [ $(ss -tnlp | grep 8443 | wc -l) -eq 0 ]; then exit 1; fi'"
    interval 3
    weight -2
    fall 3
    rise 2
}

vrrp_instance K8S_VIP {
    state MASTER
    interface eth0               # ← 改为实际网卡名（ip addr 查看）
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass K8SHA
    }
    virtual_ipaddress {
        10.0.0.100/24
    }
    track_script {
        check_haproxy
    }
}
EOF

systemctl restart keepalived
systemctl enable keepalived
```

**master-2（BACKUP，priority 99）：**

```bash
# 同上，修改：
#   router_id K8S_MASTER_2
#   state BACKUP
#   priority 99
```

**master-3（BACKUP，priority 98）：**

```bash
# 同上，修改：
#   router_id K8S_MASTER_3
#   state BACKUP
#   priority 98
```

### 4.4 验证 VIP

```bash
# 在 master-1 上
ip addr show eth0 | grep 10.0.0.100
# 应该能看到 VIP

# 从其他机器 ping
ping 10.0.0.100
```

---

## 第五步：kubeadm 初始化控制面

> 在 **master-1** 上执行。

### 5.1 创建 kubeadm 配置文件

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
controlPlaneEndpoint: "10.0.0.100:8443"     # 单 Master 改为 "10.0.0.11:6443"
networking:
  podSubnet: "192.168.0.0/16"               # Calico 默认 CIDR
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
    - "127.0.0.1"
  extraArgs:
    authorization-mode: "Node,RBAC"
controllerManager:
  extraArgs:
    bind-address: "0.0.0.0"                 # KubeSphere 监控需要
scheduler:
  extraArgs:
    bind-address: "0.0.0.0"                 # KubeSphere 监控需要
etcd:
  local:
    dataDir: /var/lib/etcd
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
containerRuntimeEndpoint: unix:///run/containerd/containerd.sock
EOF
```

### 5.2 预检

```bash
kubeadm init phase preflight --config /etc/kubernetes/kubeadm-config.yaml
```

如果有错误，逐一修复后再继续。常见问题：

- `[ERROR Swap]`：swap 没关
- `[ERROR FileContent--proc-sys-net-bridge-bridge-nf-call-iptables]`：内核参数没加载
- `[ERROR CRI]`：containerd 没启动或 socket 路径不对

### 5.3 初始化

```bash
kubeadm init --config /etc/kubernetes/kubeadm-config.yaml --upload-certs | tee /root/kubeadm-init.log
```

**务必保存输出中的两条 join 命令**（control-plane 和 worker 各一条）。

### 5.4 配置 kubectl

```bash
mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 验证
kubectl get nodes
# master-1 应该显示 NotReady（还没装 CNI）

# 启用 kubectl 自动补全
echo 'source <(kubectl completion bash)' >> ~/.bashrc
echo 'alias k=kubectl' >> ~/.bashrc
echo 'complete -o default -F __start_kubectl k' >> ~/.bashrc
source ~/.bashrc
```

---

## 第六步：加入其他 Master 和 Worker 节点

### 6.1 加入 Master 2 和 Master 3

在 master-2 和 master-3 上执行 init 输出的 **control-plane join** 命令：

```bash
# 示例（用实际输出替换）
kubeadm join 10.0.0.100:8443 --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --control-plane --certificate-key <cert-key> \
  --cri-socket unix:///run/containerd/containerd.sock

# 加入后配置 kubectl
mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config
```

### 6.2 加入 Worker 节点

在所有 worker 上执行 init 输出的 **worker join** 命令：

```bash
kubeadm join 10.0.0.100:8443 --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --cri-socket unix:///run/containerd/containerd.sock
```

### 6.3 如果 token 过期

```bash
# 在 master-1 上重新生成
kubeadm token create --print-join-command

# 如果需要 certificate-key（加入 control-plane）
kubeadm init phase upload-certs --upload-certs
```

### 6.4 验证

```bash
kubectl get nodes
# 所有节点出现，状态 NotReady（正常，还没装 CNI）
```

---

## 第七步：部署 Calico 网络插件

> 在 master-1 上执行。

```bash
# 下载 Calico manifest
curl -O https://raw.githubusercontent.com/projectcalico/calico/v3.28.1/manifests/calico.yaml

# 确认 CIDR（默认 192.168.0.0/16，和 kubeadm 配置一致就不用改）
grep -A1 'CALICO_IPV4POOL_CIDR' calico.yaml

# 部署
kubectl apply -f calico.yaml

# 等待所有 Calico Pod 就绪
kubectl get pods -n kube-system -l k8s-app=calico-node -w
# 等所有节点的 calico-node 都变成 1/1 Running

# 验证节点变为 Ready
kubectl get nodes
# 所有节点应该变为 Ready
```

**如果某个节点的 calico-node 一直不 Ready：**

```bash
# 查看日志
kubectl logs -n kube-system -l k8s-app=calico-node --tail=50

# 常见原因：
# 1. 节点间 BGP 端口（179）被防火墙拦截
# 2. 节点间 IP-in-IP（协议号 4）被拦截
# 3. Pod CIDR 和节点网段冲突
```

---

## 第八步：安装 Helm

> 在 master-1（或运维机）上执行。

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 验证
helm version

# 添加常用仓库
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```

---

## 第九步：部署 Nginx Ingress Controller

> 在 master-1 上执行。

### 9.1 Helm 安装

```bash
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.kind=DaemonSet \
  --set controller.hostNetwork=true \
  --set controller.dnsPolicy=ClusterFirstWithHostNet \
  --set controller.nodeSelector."node-role\.kubernetes\.io/control-plane"="" \
  --set controller.tolerations[0].key=node-role.kubernetes.io/control-plane \
  --set controller.tolerations[0].effect=NoSchedule \
  --set controller.service.type=ClusterIP \
  --set controller.metrics.enabled=true \
  --set controller.admissionWebhooks.enabled=true
```

> 这里用 **DaemonSet + hostNetwork** 模式，Ingress Controller 直接监听 Master 节点的 80/443 端口，不依赖 LoadBalancer。
>
> 如果你有云厂商 LB，改用 `--set controller.service.type=LoadBalancer` 并去掉 hostNetwork 相关配置。
>
> 如果想让 Ingress 跑在 Worker 上，修改 `nodeSelector` 和 `tolerations`。

### 9.2 验证

```bash
# 等待 Pod 就绪
kubectl get pods -n ingress-nginx -w

# 测试 Ingress Controller 端口
curl -I http://10.0.0.11
# 应返回 404（Nginx 默认后端），说明 Ingress Controller 已正常监听
```

### 9.3 创建测试 Ingress 验证端到端

```bash
# 部署测试应用
kubectl create deployment demo --image=nginx --port=80
kubectl expose deployment demo --port=80

# 创建 Ingress
cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-ingress
spec:
  ingressClassName: nginx
  rules:
    - host: demo.internal
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo
                port:
                  number: 80
EOF

# 测试
curl -H "Host: demo.internal" http://10.0.0.11
# 应返回 Nginx 欢迎页

# 清理
kubectl delete ingress demo-ingress
kubectl delete svc demo
kubectl delete deployment demo
```

---

## 第十步：安装 KubeSphere

> 在 master-1 上执行。KubeSphere 是最后安装的，因为它依赖集群基础设施就绪。

### 10.1 前置检查

```bash
# 确认集群状态
kubectl get nodes          # 全部 Ready
kubectl get pods -A        # 无 CrashLoop 或 Pending
helm version               # Helm 已安装
```

### 10.2 安装 KubeSphere Core（v4.1.2）

```bash
# 安装 KubeSphere Core
helm upgrade --install -n kubesphere-system --create-namespace ks-core \
  https://charts.kubesphere.io/main/ks-core-1.1.3.tgz \
  --set global.nodePort=30880 \
  --debug --wait
```

### 10.3 等待安装完成

```bash
# 查看安装进度
kubectl get pods -n kubesphere-system -w

# 等待所有 Pod Running
kubectl get pods -n kubesphere-system
# ks-apiserver, ks-console, ks-controller-manager 都应该是 Running
```

### 10.4 获取登录信息

```bash
# 默认管理员账号
# 用户名: admin
# 密码: 通过以下命令获取
kubectl get secret -n kubesphere-system kubesphere-secret -o jsonpath='{.data.password}' | base64 -d && echo
```

### 10.5 访问 KubeSphere 控制台

```bash
# 方式 1：NodePort 访问（默认）
# 浏览器打开 http://<任意节点IP>:30880
# 例如 http://10.0.0.11:30880

# 方式 2：通过 Ingress 访问
cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ks-console
  namespace: kubesphere-system
spec:
  ingressClassName: nginx
  rules:
    - host: ks.internal
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ks-console
                port:
                  number: 80
EOF
# 在 hosts 里加 10.0.0.11 ks.internal，浏览器访问 http://ks.internal
```

### 10.6 启用 KubeSphere 扩展组件（按需）

登录 KubeSphere 控制台后，进入 **扩展市场**，可按需安装：

| 组件 | 功能 | 资源消耗 |
| --- | --- | --- |
| **WhizardTelemetry 监控** | Prometheus + Grafana 监控 | 中 |
| **WhizardTelemetry 日志** | 日志采集与查询 | 中 |
| **WhizardTelemetry 告警** | 告警规则与通知 | 低 |
| **DevOps** | CI/CD 流水线（内建 Jenkins） | 高 |
| **服务网格** | Istio 集成 | 高 |
| **应用商店** | Helm Chart 可视化管理 | 低 |
| **网关** | Ingress 网关管理 | 低 |

> 建议先只装**监控 + 日志 + 告警**，其他按需再加。每个组件都有资源开销，小集群不要全开。

---

## 第十一步：部署 Prometheus + Grafana + Alertmanager（监控告警）

使用 kube-prometheus-stack Helm Chart，一次部署 Prometheus、Grafana、Alertmanager 和全套 K8s 监控规则。

### 11.1 安装

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

cat > /tmp/prometheus-values.yaml << 'EOF'
# Grafana
grafana:
  enabled: true
  adminPassword: "admin123"         # ← 生产环境改强密码
  persistence:
    enabled: true
    size: 10Gi
  ingress:
    enabled: true
    ingressClassName: nginx
    hosts:
      - grafana.internal              # ← 改为你的域名
  sidecar:
    dashboards:
      enabled: true
      searchNamespace: ALL

# Prometheus
prometheus:
  prometheusSpec:
    retention: 15d
    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        memory: 4Gi
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    # 采集所有 namespace 的 ServiceMonitor
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false

# Alertmanager
alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 5Gi
  # 告警通知配置（按需修改）
  config:
    global:
      resolve_timeout: 5m
    route:
      receiver: "default"
      group_by: ["alertname", "namespace"]
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
    receivers:
      - name: "default"
        # webhook_configs:
        #   - url: "https://your-webhook-url"  # 飞书/钉钉/Slack webhook

# Node Exporter
nodeExporter:
  enabled: true

# kube-state-metrics
kubeStateMetrics:
  enabled: true

# 抓取 etcd 指标（kubeadm 部署的 etcd）
kubeEtcd:
  enabled: true
  endpoints:
    - 10.0.0.11
    - 10.0.0.12
    - 10.0.0.13
  service:
    enabled: true
    port: 2381
    targetPort: 2381
EOF

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f /tmp/prometheus-values.yaml \
  --version 62.7.0
```

### 11.2 验证

```bash
# 等待所有 Pod 就绪
kubectl get pods -n monitoring -w

# 验证 Prometheus targets
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090 &
# 浏览器访问 http://localhost:9090/targets ，确认所有 target 是 UP

# 访问 Grafana
# 如果配了 Ingress: http://grafana.internal
# 否则: kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
# 账号 admin / admin123

# 验证内建仪表盘
# Grafana → Dashboards → 应该能看到 K8s 相关的预置 Dashboard
```

### 11.3 常用告警规则验证

安装后自带 ~100 条告警规则，覆盖：

| 类别 | 示例规则 |
| --- | --- |
| 节点 | NodeNotReady、NodeMemoryHighUtilization |
| Pod | KubePodCrashLooping、KubePodNotReady |
| 持久卷 | KubePersistentVolumeFillingUp |
| API Server | KubeAPIErrorBudgetBurn |
| etcd | etcdHighNumberOfFailedGRPCRequests |

```bash
# 查看当前告警
kubectl port-forward -n monitoring svc/kube-prometheus-stack-alertmanager 9093:9093 &
# 浏览器访问 http://localhost:9093
```

---

## 第十二步：部署 Loki + Promtail（日志）

### 12.1 安装 Loki（日志后端）

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

cat > /tmp/loki-values.yaml << 'EOF'
loki:
  auth_enabled: false
  commonConfig:
    replication_factor: 1
  storage:
    type: filesystem
  schemaConfig:
    configs:
      - from: "2024-01-01"
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: index_
          period: 24h

deploymentMode: SingleBinary

singleBinary:
  replicas: 1
  persistence:
    enabled: true
    size: 50Gi
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      memory: 1Gi

# 关闭不需要的组件
backend:
  replicas: 0
read:
  replicas: 0
write:
  replicas: 0

gateway:
  enabled: false

chunksCache:
  enabled: false
resultsCache:
  enabled: false
EOF

helm install loki grafana/loki \
  --namespace monitoring \
  -f /tmp/loki-values.yaml \
  --version 6.16.0
```

### 12.2 安装 Promtail（日志采集 Agent）

```bash
cat > /tmp/promtail-values.yaml << 'EOF'
config:
  clients:
    - url: http://loki.monitoring.svc.cluster.local:3100/loki/api/v1/push
  snippets:
    pipelineStages:
      - cri: {}
    extraRelabelConfigs:
      - action: replace
        sourceLabels:
          - __meta_kubernetes_pod_node_name
        targetLabel: node

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    memory: 128Mi

tolerations:
  - effect: NoSchedule
    operator: Exists
EOF

helm install promtail grafana/promtail \
  --namespace monitoring \
  -f /tmp/promtail-values.yaml \
  --version 6.16.6
```

### 12.3 在 Grafana 中添加 Loki 数据源

```bash
# 如果用 kube-prometheus-stack 的 Grafana，手动添加 Loki 数据源
# Grafana → Configuration → Data Sources → Add data source → Loki
# URL: http://loki.monitoring.svc.cluster.local:3100

# 或者通过配置自动添加
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasource-loki
  namespace: monitoring
  labels:
    grafana_datasource: "1"
data:
  loki-datasource.yaml: |
    apiVersion: 1
    datasources:
      - name: Loki
        type: loki
        access: proxy
        url: http://loki.monitoring.svc.cluster.local:3100
        isDefault: false
EOF

# 重启 Grafana 使数据源生效
kubectl rollout restart deployment kube-prometheus-stack-grafana -n monitoring
```

### 12.4 验证

```bash
# 确认 Promtail 在每个节点运行
kubectl get pods -n monitoring -l app.kubernetes.io/name=promtail -o wide

# 在 Grafana → Explore → 选 Loki 数据源
# 查询: {namespace="kube-system"}
# 应该能看到系统组件日志
```

---

## 第十三步：部署 Longhorn（分布式存储）

Longhorn 提供跨节点的高可用分布式块存储，替代单节点的 local-path。

### 13.1 前置要求

```bash
# 所有 Worker 节点安装 open-iscsi
apt install -y open-iscsi
systemctl enable --now iscsid

# 确认每个 Worker 至少有一块独立数据盘（推荐）
# 或使用根分区空间（/var/lib/longhorn/）
```

### 13.2 安装

```bash
helm repo add longhorn https://charts.longhorn.io
helm repo update

cat > /tmp/longhorn-values.yaml << 'EOF'
defaultSettings:
  defaultReplicaCount: 2                    # 副本数，至少 2 才有高可用
  defaultDataPath: /var/lib/longhorn        # 数据存储路径
  storageOverProvisioningPercentage: 200
  storageMinimalAvailablePercentage: 15
  createDefaultDiskLabeledNodes: true
  backupTarget: ""                          # 后续配 Velero 时可改为 S3/NFS

persistence:
  defaultClass: true                        # 设为默认 StorageClass
  defaultClassReplicaCount: 2

ingress:
  enabled: true
  ingressClassName: nginx
  host: longhorn.internal                   # ← 改为你的域名

longhornUI:
  replicas: 1
EOF

helm install longhorn longhorn/longhorn \
  --namespace longhorn-system --create-namespace \
  -f /tmp/longhorn-values.yaml \
  --version 1.7.2
```

### 13.3 验证

```bash
# 等待所有组件就绪（可能需要 2-3 分钟）
kubectl get pods -n longhorn-system -w

# 验证 StorageClass
kubectl get sc
# 应显示 longhorn (default)

# 创建测试 PVC
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-longhorn
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: longhorn
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: test-longhorn-pod
spec:
  containers:
    - name: test
      image: busybox:1.36
      command: ["sh", "-c", "echo longhorn-ok > /data/test.txt && cat /data/test.txt && sleep 30"]
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: test-longhorn
  restartPolicy: Never
EOF

sleep 20
kubectl logs test-longhorn-pod
# 应输出 longhorn-ok

kubectl delete pod test-longhorn-pod
kubectl delete pvc test-longhorn

# 访问 Longhorn UI
# http://longhorn.internal 或 kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80
```

### 13.4 移除之前的 local-path-provisioner（可选）

如果 Longhorn 已设为默认 StorageClass，可以移除之前的 local-path：

```bash
kubectl delete -f /tmp/local-path-provisioner.yaml
```

---

## 第十四步：部署 cert-manager（证书管理）

cert-manager 自动申请和续期 TLS 证书，支持 Let's Encrypt 和自签 CA。

### 14.1 安装

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true \
  --set resources.requests.cpu=50m \
  --set resources.requests.memory=64Mi \
  --version v1.16.1
```

### 14.2 创建 ClusterIssuer

**方案 A：Let's Encrypt（有公网域名时）**

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com        # ← 改为你的邮箱
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

**方案 B：自签 CA（内网环境）**

```bash
# 创建自签 CA
cat <<'EOF' | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: internal-ca
  namespace: cert-manager
spec:
  isCA: true
  commonName: internal-ca
  secretName: internal-ca-secret
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: selfsigned-issuer
    kind: ClusterIssuer
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: internal-ca-issuer
spec:
  ca:
    secretName: internal-ca-secret
EOF
```

### 14.3 使用示例

在 Ingress 上自动申请证书：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"   # 或 internal-ca-issuer
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - my-app.example.com
      secretName: my-app-tls
  rules:
    - host: my-app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

### 14.4 验证

```bash
kubectl get pods -n cert-manager
kubectl get clusterissuer
kubectl get certificate -A
```

---

## 第十五步：部署 Harbor（私有镜像仓库）

### 15.1 安装

```bash
helm repo add harbor https://helm.goharbor.io
helm repo update

cat > /tmp/harbor-values.yaml << 'EOF'
expose:
  type: ingress
  ingress:
    hosts:
      core: harbor.internal           # ← 改为你的域名
    className: nginx
    annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: "0"        # 不限制镜像上传大小
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: harbor-tls
      # 如果用 cert-manager 自动签发，加 annotation:
      # cert-manager.io/cluster-issuer: internal-ca-issuer

externalURL: https://harbor.internal

harborAdminPassword: "Harbor12345"    # ← 改为强密码

persistence:
  enabled: true
  persistentVolumeClaim:
    registry:
      size: 100Gi
    database:
      size: 5Gi
    redis:
      size: 1Gi
    trivy:
      size: 5Gi

database:
  type: internal

redis:
  type: internal

trivy:
  enabled: true                       # 镜像漏洞扫描
EOF

helm install harbor harbor/harbor \
  --namespace harbor --create-namespace \
  -f /tmp/harbor-values.yaml \
  --version 1.16.0
```

### 15.2 验证

```bash
# 等待所有组件就绪
kubectl get pods -n harbor -w

# 访问 Harbor
# https://harbor.internal
# 账号: admin / Harbor12345

# 测试 push 镜像（需要先配置 Docker/containerd 信任 Harbor 证书）
docker login harbor.internal -u admin -p Harbor12345
docker tag nginx:latest harbor.internal/library/nginx:latest
docker push harbor.internal/library/nginx:latest
```

### 15.3 配置集群节点使用 Harbor

```bash
# 在每个 K8s 节点上，配置 containerd 信任 Harbor
# 如果用 cert-manager 签发的证书，需要把 CA 证书分发到节点
# 参考"内网离线集群搭建操作指南"中的证书分发步骤

# 创建 imagePullSecret（让 K8s Pod 能拉 Harbor 私有镜像）
kubectl create secret docker-registry harbor-pull-secret \
  --docker-server=harbor.internal \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  -n default

# 可以设置为 ServiceAccount 默认 pull secret
kubectl patch serviceaccount default -n default \
  -p '{"imagePullSecrets": [{"name": "harbor-pull-secret"}]}'
```

---

## 第十六步：部署 Velero（备份恢复）

Velero 负责 K8s 资源定义 + 持久卷数据的备份恢复。

### 16.1 安装 Velero CLI

```bash
VELERO_VERSION="1.14.1"
curl -L https://github.com/vmware-tanzu/velero/releases/download/v${VELERO_VERSION}/velero-v${VELERO_VERSION}-linux-amd64.tar.gz | tar xz
install -m 755 velero-v${VELERO_VERSION}-linux-amd64/velero /usr/local/bin/
```

### 16.2 配置备份存储（以 MinIO 为例）

如果没有 S3/OSS，可以先部署一个 MinIO 作为对象存储后端：

```bash
# 部署 MinIO
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: velero
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: velero
spec:
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
        - name: minio
          image: minio/minio:latest
          command: ["minio", "server", "/data", "--console-address", ":9001"]
          env:
            - name: MINIO_ROOT_USER
              value: "minioadmin"
            - name: MINIO_ROOT_PASSWORD
              value: "minioadmin123"
          ports:
            - containerPort: 9000
            - containerPort: 9001
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: minio-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-pvc
  namespace: velero
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: velero
spec:
  ports:
    - port: 9000
      name: api
    - port: 9001
      name: console
  selector:
    app: minio
EOF

# 等待 MinIO 就绪
kubectl get pods -n velero -w
```

### 16.3 创建 MinIO bucket

```bash
# 在 MinIO 中创建 velero bucket
kubectl port-forward -n velero svc/minio 9000:9000 &
# 用 mc CLI 或浏览器 http://localhost:9001 创建名为 "velero" 的 bucket

# 或用 mc CLI
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc && chmod +x /usr/local/bin/mc
mc alias set myminio http://localhost:9000 minioadmin minioadmin123
mc mb myminio/velero
```

### 16.4 安装 Velero Server

```bash
# 创建凭证文件
cat > /tmp/velero-credentials << 'EOF'
[default]
aws_access_key_id = minioadmin
aws_secret_access_key = minioadmin123
EOF

velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.10.1 \
  --bucket velero \
  --secret-file /tmp/velero-credentials \
  --backup-location-config region=minio,s3ForcePathStyle=true,s3Url=http://minio.velero.svc.cluster.local:9000 \
  --use-volume-snapshots=false \
  --namespace velero
```

> 如果使用云厂商 S3/OSS，把 `s3Url` 和凭证替换为实际值即可。
>
> Longhorn 有自己的 snapshot 能力，也可以配合 Velero CSI 插件做卷级备份。

### 16.5 配置定时备份

```bash
# 每天凌晨 2 点全量备份，保留 7 天
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 168h \
  --include-namespaces '*' \
  --exclude-namespaces velero

# 查看备份计划
velero schedule get

# 手动触发一次备份
velero backup create manual-backup-$(date +%Y%m%d)

# 查看备份状态
velero backup get
velero backup describe manual-backup-$(date +%Y%m%d)
```

### 16.6 恢复测试

```bash
# 模拟灾难：删除一个 namespace
kubectl create namespace restore-test
kubectl create deployment test-app --image=nginx --replicas=2 -n restore-test
sleep 10

# 备份这个 namespace
velero backup create test-backup --include-namespaces restore-test --wait

# 删除
kubectl delete namespace restore-test

# 恢复
velero restore create --from-backup test-backup --wait

# 验证
kubectl get pods -n restore-test
# test-app 应该恢复
kubectl delete namespace restore-test
```

---

## 第十七步：全面验证

```bash
echo "========== 1. 节点状态 =========="
kubectl get nodes -o wide

echo "========== 2. 系统组件 =========="
kubectl get pods -n kube-system

echo "========== 3. KubeSphere =========="
kubectl get pods -n kubesphere-system

echo "========== 4. Ingress Controller =========="
kubectl get pods -n ingress-nginx

echo "========== 5. 监控 =========="
kubectl get pods -n monitoring

echo "========== 6. Longhorn =========="
kubectl get pods -n longhorn-system | head -10

echo "========== 7. cert-manager =========="
kubectl get pods -n cert-manager
kubectl get clusterissuer

echo "========== 8. Harbor =========="
kubectl get pods -n harbor

echo "========== 9. Velero =========="
velero backup get

echo "========== 10. DNS 测试 =========="
kubectl run test-dns --rm -it --restart=Never --image=busybox:1.36 -- nslookup kubernetes.default.svc.cluster.local

echo "========== 11. 跨节点 Pod 通信 =========="
kubectl create deployment test-calico --image=nginx --replicas=3
sleep 10
kubectl get pods -o wide -l app=test-calico
kubectl delete deployment test-calico

echo "========== 12. KubeSphere 控制台 =========="
echo "访问地址: http://10.0.0.11:30880"
echo "用户名: admin"
echo -n "密码: "
kubectl get secret -n kubesphere-system kubesphere-secret -o jsonpath='{.data.password}' | base64 -d && echo
```

### 验证通过标准

| 检查项 | 预期 |
| --- | --- |
| 所有节点 Ready | `kubectl get nodes` 全 Ready |
| kube-system Pod 全部 Running | 无 Pending / CrashLoop |
| Calico Pod 全部 1/1 Running | 每个节点一个 calico-node |
| ingress-nginx Pod Running | DaemonSet 在 Master 节点运行 |
| KubeSphere Pod 全部 Running | ks-apiserver, ks-console, ks-controller-manager |
| monitoring Pod 全部 Running | Prometheus, Grafana, Alertmanager, Loki, Promtail |
| longhorn-system Pod 全部 Running | manager, driver, UI |
| cert-manager Pod 全部 Running | 3 个组件 + ClusterIssuer 就绪 |
| harbor Pod 全部 Running | core, registry, database, redis, trivy |
| Velero 备份正常 | `velero backup get` 显示 Completed |
| DNS 解析正常 | nslookup 返回 ClusterIP |
| 跨节点通信正常 | 不同节点的 Pod 能互 ping |
| KubeSphere 控制台可访问 | 浏览器能打开并登录 |

---

## 常见问题排查

### Q1：kubeadm init 报错 `[ERROR CRI]`

```bash
# 确认 containerd 在运行
systemctl status containerd

# 确认 socket 存在
ls -la /run/containerd/containerd.sock

# 确认配置正确
containerd config dump | grep SystemdCgroup
# 应该是 true
```

### Q2：节点一直 NotReady

```bash
# 检查 kubelet 日志
journalctl -u kubelet -f --no-pager | tail -50

# 最常见原因：Calico 没部署或没就绪
kubectl get pods -n kube-system -l k8s-app=calico-node
```

### Q3：KubeSphere 安装卡住

```bash
# 查看 Pod 状态
kubectl get pods -n kubesphere-system

# 查看事件
kubectl get events -n kubesphere-system --sort-by='.lastTimestamp'

# 查看日志
kubectl logs -n kubesphere-system deploy/ks-controller-manager --tail=100
```

### Q4：Ingress 不生效（访问返回 404/502）

```bash
# 确认 Ingress Controller 在运行
kubectl get pods -n ingress-nginx

# 确认 Ingress 资源创建成功
kubectl get ingress -A

# 确认 ingressClassName 匹配
kubectl get ingressclass

# 查看 Ingress Controller 日志
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50
```

### Q5：Pod 之间网络不通

```bash
# 查看 Calico 状态
kubectl get pods -n kube-system -l k8s-app=calico-node -o wide

# 在节点上检查 Calico
calicoctl node status  # 需要安装 calicoctl

# 检查 BGP 对等
# 如果节点间有防火墙，需要放行 BGP（TCP 179）和 IP-in-IP（协议 4）
```

---

## 日常运维速查

### 证书续期

```bash
# 查看证书到期时间
kubeadm certs check-expiration

# 续期（在每台 Master 上执行）
kubeadm certs renew all
systemctl restart kubelet

# 更新 kubeconfig
cp /etc/kubernetes/admin.conf $HOME/.kube/config
```

### etcd 备份

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# 验证
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-$(date +%Y%m%d).db --write-out=table
```

### 新增 Worker

```bash
# Master 上生成 join 命令
kubeadm token create --print-join-command

# 新节点完成第一步到第三步后，执行 join 命令
```

---

## 最终架构图

```
                        ┌─────────────┐
                        │  用户/浏览器  │
                        └──────┬──────┘
                               │
                    ┌──────────┴──────────┐
                    │   VIP 10.0.0.100    │
                    │   (keepalived)       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
       │  master-1    │ │  master-2    │ │  master-3    │
       │  haproxy     │ │  haproxy     │ │  haproxy     │
       │  apiserver   │ │  apiserver   │ │  apiserver   │
       │  etcd        │ │  etcd        │ │  etcd        │
       │  scheduler   │ │  scheduler   │ │  scheduler   │
       │  ctrl-mgr    │ │  ctrl-mgr    │ │  ctrl-mgr    │
       │  nginx-ingr  │ │  nginx-ingr  │ │  nginx-ingr  │
       └──────────────┘ └──────────────┘ └──────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │  Calico 网络
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────┴──────┐ ┌──────┴──────┐        ...
       │  worker-1    │ │  worker-2    │
       │  业务 Pod    │ │  业务 Pod    │
       │  KubeSphere  │ │  KubeSphere  │
       │  Longhorn    │ │  Longhorn    │
       └──────────────┘ └──────────────┘

┌──────────────────────────────────────────────────────┐
│                    平台服务                            │
│                                                      │
│  KubeSphere :30880    Grafana :grafana.internal       │
│  Harbor     :harbor.internal                          │
│  Longhorn   :longhorn.internal                        │
│                                                      │
│  Prometheus → Alertmanager → Webhook 告警             │
│  Loki + Promtail → Grafana 日志查询                   │
│  cert-manager → 自动 TLS 证书                         │
│  Velero → MinIO → 定时备份 + 灾难恢复                 │
└──────────────────────────────────────────────────────┘
```

> 搭建 K8s 集群最重要的一条经验：**按顺序来，每一步验证通过再进下一步。** 核心层（containerd → kubeadm → Calico → Ingress → KubeSphere）先跑通，增强层（监控 → 日志 → 存储 → 证书 → 仓库 → 备份）再逐个叠加。跳步只会制造更难排查的问题。

## 关联阅读

- [核心概念与对象模型](./core-concepts.md)
- [kubectl 排障速查](./kubectl-troubleshooting-cheatsheet.md)
- [实战部署指南](./production-deployment-guide.md)
- [内网离线集群搭建操作指南](./offline-cluster-setup-guide.md)
- [管理面板与可视化工具实战](./dashboard-and-management-ui.md)
- [控制面主线实战](./control-plane-mainline.md)
- [节点执行链路实战](./node-execution-chain.md)
- [Helm 与包管理实战](./helm-and-package-management.md)
- [Ingress Controller 与 Gateway Controller 实现链路](./ingress-and-gateway-controller-chain.md)
- [可观测性与监控实战](./observability-and-monitoring.md)
- [认证、授权与隔离链路实战](./authn-authz-and-isolation.md)
- [存储与数据链路实战](./storage-and-data-lifecycle.md)
