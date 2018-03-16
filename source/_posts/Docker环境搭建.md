---
title: Docker环境搭建
date: 2018-03-16 11:39:27
tags: 
 - Docker
 - Vagrant
---

## Vagrant方式

一般我们使用`docker`是在`linux`环境中，所以这里使用虚拟机的方式来安装搭建`docker`环境，同时在实验练习的时候，其安装的一些镜像、插件不会影响到本机环境，只需在结束的时候删除整个虚拟机即可。

而`Vagrant`是一个虚拟机管理软件，它可以帮我们快速安装配置和管理虚拟机。

### 安装使用

1. 首先需要依赖安装`VirtualBox`或者`VMWare`

2. 官网下载符合版本的Vagrant，[链接](https://www.vagrantup.com/downloads.html)

3. 在官网上搜索需要的`box`系统镜像文件，[链接](https://app.vagrantup.com/boxes/search)

4. 手动下载镜像文件，在搜索到的镜像页面中，选择版本，在该链接后拼接`/providers/virtualbox.box`就是下载地址，以centos7为例，下载地址就是：
https://app.vagrantup.com/centos/boxes/7/versions/1802.01/providers/virtualbox.box

5. 新建一个空文件夹, 在终端命令行执行命令：
```
vagrant box add centos /path/to/centos.box
vagrant init centos
# vagrant up 成功后会在virtualbox上创建一个centos的虚拟机
vagrant up
```

### 常用命令

```
vagrant ssh // ssh
vagrant halt // 关机
vagrant status // 查看状态
vagrant destory // 删除虚拟机
```

### 安装docker

首先`vagrant ssh`进入虚拟机。

根据官方文档， 依次执行以下命令：
<!-- more -->
```
sudo yum update -y

# Uninstall older versions of Docker, along with associated dependencies.
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine

# Install required packages.
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

# Set up the stable repository. 
# http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo may faster in China
sudo yum-config-manager \
    --add-repo \
    http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# Install the latest version of Docker CE
sudo yum install -y docker-ce

# Start docker
sudo systemctl start docker
```

除了以上方式，还可以用Vagrant的Shell Script功能：

在`vagrant init`后会生成一个`Vagrantfile`文件，可以配置一些虚拟机相关的参数，其中有一个Shell：

```
  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y apache2
  # SHELL
```

简单来说就是将上面的一些安装命令写在`Vagrantfile`的`SHELL`中， 这样每次安装`up`的时候就会自动安装`docker`

## docker machine

docker machine 是一个能自动在虚拟机上安装docker engine的工具。

### 安装

Docker for Mac、Docker for Windows 自带 docker-machine 二进制包，安装之后即可使用。

也可以单独下载安装，[文档](https://docs.docker.com/machine/install-machine/#install-machine-directly)

### 使用

1. 创建一台 Docker 主机，命名为 test
    ```
    docker-machine create test
    ```

    在创建时也可以指定`driver`，如`virtualbox`，`xhyve`等。

    ```
    docker-machine create -d virtualbox test
    ```

    同时可以跟一些配置参数， 如: `--engine-registry-mirror https://registry.docker-cn.com` 配置 Docker 的仓库镜像；更多参数请使用 `docker-machine create --driver virtualbox --help` 命令查看。

2. 查看主机
    ```
    docker-machine ls
    ```

3. 设置当前docker engine为目标主机
执行`docker-machine env test`，输出如下：

    ```
    export DOCKER_TLS_VERIFY="1"
    export DOCKER_HOST="tcp://192.168.99.100:2376"
    export DOCKER_CERT_PATH="/Users/lichfaker/.docker/machine/machines/test"
    export DOCKER_MACHINE_NAME="test"
    # Run this command to configure your shell:
    # eval $(docker-machine env test)
    ```

    执行`eval $(docker-machine env test)`后，当前的`docker engine`就是`test`主机的，可以通过`docker version`查看验证。

    如果想要取消设置，`docker-machine env --unset`后根据提示操作即可。

4. 登录到主机
    ```
    docker-machine ssh test
    ```

5. 管理远程主机
    * AWS： [https://docs.docker.com/machine/drivers/aws/](https://docs.docker.com/machine/drivers/aws/)
    * Aliyun: [https://github.com/AliyunContainerService/docker-machine-driver-aliyunecs](https://github.com/AliyunContainerService/docker-machine-driver-aliyunecs)

## 参考
[docker文档](https://docs.docker.com)
[Vagrant文档](https://www.vagrantup.com/docs/)