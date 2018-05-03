---
title: Docker去sudo
date: 2018-05-03 09:45:32
tags: tips
---

在`linux`上每次执行`docker`命令，都得加`sudo`权限。为方便使用，将普通用户加入`docker用户组`即可解决上述问题。

操作：

1. 查看创建用户组：

    ```
    sudo cat /etc/group | grep docker
    ```

    如果不存在该用户组，则创建：

    ```
    sudo groupadd docker
    ```

2. 添加用户到用户组

    ```
    sudo gpasswd -a ${USER} docker
    ```

3. 修改权限。 若不执行则会： `connect: permission denied`

    ```
    sudo chmod a+rw /var/run/docker.sock
    ```

4. 重启 `docker` 服务

    ```
    sudo systemctl restart docker
    ```
