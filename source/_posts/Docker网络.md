---
title: Docker网络
date: 2018-04-04 12:26:31
tags: Docker
---

## Linux NameSpace

### 简介

Linux Namespace是Linux提供的一种内核级别环境隔离的方法,用来让运行在同一个操作系统上的进程互相不会干扰。

目前 linux 内核主要实现了以下几种不同的资源 namespace：

| 分类 | 系统调用参数 | 隔离的内容 |
| :--------:   | :-----:   | :----: |
| Mount | CLONE_NEWNS | Mount points (since Linux 2.4.19) |
| UTS | CLONE_NEWUTS | Hostname and NIS domain name (since Linux 2.6.19) |
| IPC | CLONE_NEWIPC | System V IPC, POSIX message queues (since Linux 2.6.19) |
| PID | CLONE_NEWPID | Process IDs (since Linux 2.6.24) |
| Network | CLONE_NEWNET | routing tables, firewall rules, the /proc/net and /sys/class/net directory trees, sockets, etc (since Linux 2.6.24)|
| User | CLONE_NEWUSER | User and group IDs (started in Linux 2.6.23 and completed in Linux 3.8) |
| Cgroup | CLONE_NEWCGROUP | Cgroup root directory (since Linux 4.6)|

这里主要分析Linux的`Network Namespace`：`Network namespace` 是实现网络虚拟化的重要功能，它能创建多个隔离的网络空间，它们有独自的网络栈信息。不管是虚拟机还是容器，运行的时候仿佛自己就在独立的网络中。

一个物理网络设备只能出现在最多一个网络 `Namespace` 中，不同网络 `Namespace` 之间可以通过创建 veth pair 提供类似管道的通信。

<!-- more -->

### 创建

默认情况下，是没有`Namespace`的， 可通过命令`sudo ip netns list`验证， 输出为空。

创建 `Network Namespace` 也很简单， 通过命令 `sudo ip netns add` 即可

```
[vagrant@localhost ~]$ sudo ip netns add test1
[vagrant@localhost ~]$ sudo ip netns add test2
[vagrant@localhost ~]$ sudo ip netns list
test2
test1
[vagrant@localhost ~]$ sudo ip netns exec test1 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
[vagrant@localhost ~]$ sudo ip netns exec test2 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
[vagrant@localhost ~]$
```

上述操作创建了两个`Network Namespace`： test1和test2，同时在相应的 `Namespace` 下，查看 `ip a`均得到一个本地的`lo`口，并且是 DOWN 的。 

可通过命令`ip netns exec test1 ip link set dev lo up` 开启:

```
[vagrant@localhost ~]$ sudo ip netns exec test1 ip link set dev lo up
[vagrant@localhost ~]$ sudo ip netns exec test1 ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
    valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
    valid_lft forever preferred_lft forever
```

### Namespace 之间通信

linux 提供了 `veth pair` 来连接两个网络，`veth pair` 无法单独存在，删除其中一个，另一个也会自动消失。

我们可以将 `Namespace` 想像成电脑的网口， `veth pair` 想象成网线， 只要用网线将两个网口连接， 那么他们之间就可以通信了。 具体操作如下：

1. 创建一对 `veth pair`

    ```
    [vagrant@localhost ~]$ sudo ip link add veth-test1 type veth peer name veth-test2
    [vagrant@localhost ~]$ sudo ip link
    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT qlen 1
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT qlen 1000
        link/ether 52:54:00:da:a7:10 brd ff:ff:ff:ff:ff:ff
    3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT qlen 1000
        link/ether 08:00:27:7f:67:79 brd ff:ff:ff:ff:ff:ff
    4: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFAULT
        link/ether 02:42:fa:d8:87:9c brd ff:ff:ff:ff:ff:ff
    9: veth-test2@veth-test1: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
        link/ether f2:8e:3f:90:a6:86 brd ff:ff:ff:ff:ff:ff
    10: veth-test1@veth-test2: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
        link/ether ae:74:c3:98:21:a9 brd ff:ff:ff:ff:ff:ff
    ```

2. 添加 `veth` 到 `Namespace`

    ```
    [vagrant@localhost ~]$ sudo ip link set veth-test1 netns test1
    [vagrant@localhost ~]$ sudo ip netns exec test1 ip a
    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
        inet 127.0.0.1/8 scope host lo
        valid_lft forever preferred_lft forever
        inet6 ::1/128 scope host
        valid_lft forever preferred_lft forever
    10: veth-test1@if9: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN qlen 1000
        link/ether ae:74:c3:98:21:a9 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    [vagrant@localhost ~]$ ip link
    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT qlen 1
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT qlen 1000
        link/ether 52:54:00:da:a7:10 brd ff:ff:ff:ff:ff:ff
    3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT qlen 1000
        link/ether 08:00:27:7f:67:79 brd ff:ff:ff:ff:ff:ff
    4: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DEFAULT
        link/ether 02:42:fa:d8:87:9c brd ff:ff:ff:ff:ff:ff
    9: veth-test2@if10: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
        link/ether f2:8e:3f:90:a6:86 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    ```

    可以看到，veth-test1 已经添加到了 test1 下，test1 下多了一个网络接口 veth-test1@if9 ；用同样的方式添加veth-test2到 test2 下。

3. 分配ip地址

    ```
    [vagrant@localhost ~]$ sudo ip netns exec test1 ip addr add 177.60.1.100/24 dev veth-test1
    [vagrant@localhost ~]$ sudo ip netns exec test2 ip addr add 177.60.1.101/24 dev veth-test2
    [vagrant@localhost ~]$ sudo ip netns exec test1 ip a
    1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
        inet 127.0.0.1/8 scope host lo
        valid_lft forever preferred_lft forever
        inet6 ::1/128 scope host
        valid_lft forever preferred_lft forever
    10: veth-test1@if9: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN qlen 1000
        link/ether ae:74:c3:98:21:a9 brd ff:ff:ff:ff:ff:ff link-netnsid 1
        inet 177.60.1.100/24 scope global veth-test1
        valid_lft forever preferred_lft forever
    [vagrant@localhost ~]$ sudo ip netns exec test2 ip a
    1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN qlen 1
        link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    9: veth-test2@if10: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN qlen 1000
        link/ether f2:8e:3f:90:a6:86 brd ff:ff:ff:ff:ff:ff link-netnsid 0
        inet 177.60.1.101/24 scope global veth-test2
        valid_lft forever preferred_lft forever
    ```

    可以看到ip地址已经添加成功了， 但是接口的状态还是 DOWN 的， 接下来我们只要将接口 UP ，那么test1 和 test2 之间就可以通信了：

    ```
    [vagrant@localhost ~]$ sudo ip netns exec test1 ip link set dev veth-test1 up
    [vagrant@localhost ~]$ sudo ip netns exec test2 ip link set dev veth-test2 up
    [vagrant@localhost ~]$ sudo ip netns exec test1 ping 177.60.1.101
    PING 177.60.1.101 (177.60.1.101) 56(84) bytes of data.
    64 bytes from 177.60.1.101: icmp_seq=1 ttl=64 time=0.060 ms
    64 bytes from 177.60.1.101: icmp_seq=2 ttl=64 time=0.039 ms
    64 bytes from 177.60.1.101: icmp_seq=3 ttl=64 time=0.040 ms
    64 bytes from 177.60.1.101: icmp_seq=4 ttl=64 time=0.054 ms
    ^C
    --- 177.60.1.101 ping statistics ---
    4 packets transmitted, 4 received, 0% packet loss, time 3001ms
    rtt min/avg/max/mdev = 0.039/0.048/0.060/0.010 ms
    ```

### Bridge

前面已经实现了两个 `Namespace` 之间的通信，多个 `Namespace` 的通信可以通过 `bridge` 实现， 可以将其想象成交换机。 具体实现如下:

```
# 创建一个bridge 并启用
[vagrant@localhost ~]$ sudo ip link add bridge-test type bridge
[vagrant@localhost ~]$ sudo ip link set dev bridge-test up
# 创建一对veth pair
[vagrant@localhost ~]$ sudo ip link add v1 type veth peer name v11
# 分别添加到 bridge 和 test1
[vagrant@localhost ~]$ sudo ip link set dev v1 master bridge-test
[vagrant@localhost ~]$ sudo ip link set v11 netns test1
# 为v11添加地址 10.0.0.10
sudo ip netns exec test1 ip addr add 10.0.0.10/24 dev v11
# 启用v1 及 v11
[vagrant@localhost ~]$ sudo ip link set dev v1 up
[vagrant@localhost ~]$ sudo ip netns exec test1 ip link set dev v11 up
# test2 同理
# 创建一对veth pair
[vagrant@localhost ~]$ sudo ip link add v2 type veth peer name v22
# 分别添加到 bridge 和 test2
[vagrant@localhost ~]$ sudo ip link set dev v2 master bridge-test
[vagrant@localhost ~]$ sudo ip link set v22 netns test2
# 为v22添加地址 10.0.0.11
sudo ip netns exec test1 ip addr add 10.0.0.11/24 dev v22
# 启用v2 及 v22
[vagrant@localhost ~]$ sudo ip link set dev v2 up
[vagrant@localhost ~]$ sudo ip netns exec test2 ip link set dev v22 up
# ping 验证
[vagrant@localhost ~]$ sudo ip netns exec test1 ping 10.0.0.11
PING 10.0.0.11 (10.0.0.11) 56(84) bytes of data.
64 bytes from 10.0.0.11: icmp_seq=1 ttl=64 time=0.060 ms
64 bytes from 10.0.0.11: icmp_seq=2 ttl=64 time=0.082 ms
64 bytes from 10.0.0.11: icmp_seq=3 ttl=64 time=0.050 ms
64 bytes from 10.0.0.11: icmp_seq=4 ttl=64 time=0.052 ms
^C
--- 10.0.0.11 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3003ms
rtt min/avg/max/mdev = 0.050/0.061/0.082/0.012 ms
```

## Docker bridge

`Docker Daemon` 会创建出一个名为 `docker0` 的虚拟网桥 ，用来连接宿主机与容器，或者连接不同的容器。

当容器创建的时候， `Docker Daemon` 在宿主机上创建了两个虚拟网络接口 veth0 和 veth1，分别添加到docker0和对应的容器上， 从而实现容器间的通信。 其原理大致与 `Linux` 下的 `bridge` 相同。

`Docker` 中创建容器默认的 `network` 是 `docker0`, 也可以创建自己的`bridge`

```
[vagrant@localhost ~]$ sudo docker network create -d bridge my-docker-bridge
e3c0e8a86be9be336227e6479dc4d84599b613aa98722d19ae1ed635dd7170a1
``` 

指定容器的 `network` 为自定义的 `bridge`：

* 创建时指定： `docker run --name test1 --network my-docker-bridge busybox`
* `docker network connect my-docker-bridge test1`

**区别：** 自定义的 `bridge上` 的容器可以通过容器name访问（相当于做了DNS，互相`docker link`），而默认的`bridge` 则需额外指定。

## host && none

docker 中除了 bridge 还有 host 和 none 的网络。

host：跟宿主机共享一个 `Namespace` ； 

none：不创建网络