---
title: Docker镜像和容器
date: 2018-03-20 13:29:38
tags: Docker
---

## 简介

Docker 是一个开源工具，可以将应用打包成一个标准格式的镜像文件，并且以容器的方式运行。

镜像特点：
* 文件和`meta data`的集合(root filesystem)
* image是分层的，每一层可以添加修改删除文件，成为一个新的image
* 不同的image可以共享相同的layer
* 本身是只读的

容器特点：
* 轻量： 在同一台宿主机上的容器共享系统Kernel，这使得他们可以快速启动。
* 安全：容器之间相互隔离，确保容器内应用不受外部环境影响。

## 镜像

`Docker`的镜像实际上由一层一层的文件系统组成，这种层级的文件系统被称为`UnionFS`。镜像可以基于`Dockerfile`构建，`Dockerfile`是一个描述文件，里面包含若干条命令，每条命令都会对基础文件系统创建新的层次结构; 也可以从`docker hub`上pull一个别人上传好的镜像。
<!-- more -->
### Dockerfile

#### FROM

`FROM scratch` 构建基础镜像；一般情况下使用官方仓库存储的镜像作为基础镜像。

#### LABEL

类似注释，如记录许可信息，作者信息或其他信息。

#### RUN

```
RUN <command>
```

RUN指令将在当前image之上的新层中执行任何命令，并提交结果。生成的已提交image将用于Dockerfile中的下一步。

每次执行RUN指令都将新开一层，所以我们应尽可能合并RUN指令， 最小化层数。

#### CMD 

```
CMD ["executable","param1","param2"]
```

在`Dockerfile`中只能有一个`CMD`指令。如果您列出多个`CMD`，则只有最后一个`CMD`将生效。

**注意**： CMD 能够被 docker run 后面跟的命令行参数替换。

#### ENTRYPOINT

`ENTRYPOINT` 指令可让容器以应用程序或者服务的形式运行。

`ENTRYPOINT` 看上去与 `CMD` 很像，它们都可以指定要执行的命令及其参数。不同的地方在于 `ENTRYPOINT` 不会被忽略，一定会被执行，即使运行 docker run 时指定了其他命令。

#### EXPOSE

```
EXPOSE <port> [<port>...]
```

`EXPOSE` 指令是声明运行时容器提供服务端口，这只是一个声明，在运行时并不会因为这个声明应用就会开启这个端口的服务。

要将 `EXPOSE` 和在运行时使用 -p <宿主端口>:<容器端口> 区分开来。-p，是映射宿主端口和容器端口，换句话说，就是将容器的对应端口服务公开给外界访问，而 `EXPOSE` 仅仅是声明容器打算使用什么端口而已，并不会自动在宿主进行端口映射。

#### AND && COPY

```
ADD <src> <dest>
ADD URL
COPY <src> <dest>
```

* `COPY`: 只支持将本地文件复制到容器中
* `ADD`: 除了拷贝的作用，还支持添加远程URL连接以及自动解压压缩文件

> 对于不需要自动提取功能的其他项目（文件，目录），您应该始终使用 COPY。

#### WORKDIR

```
WORKDIR <工作目录路径>
```

使用 `WORKDIR` 指令可以来指定工作目录（或者称为当前目录），以后各层的当前目录就被改为指定的目录，如该目录不存在，`WORKDIR` 会帮你建立目录。

#### VOLUME

```
VOLUME ["<路径1>", "<路径2>"...]
# or
VOLUME <路径>
```

定义匿名卷: 容器运行时应该尽量保持容器存储层不发生写操作，对于数据库类需要保存动态数据的应用，其数据库文件应该保存于卷(volume)中；在 `Dockerfile` 中，我们可以事先指定某些目录挂载为匿名卷，这样在运行时如果用户不指定挂载，其应用也可以正常运行，不会向容器存储层写入大量数据。

### .dockerignore

构建镜像时，`Docker`需要先准备`context` ，将所有需要的文件收集到进程中。默认的`context`包含`Dockerfile`目录中的所有文件，但是实际上，我们可能并不需要类似.git，build等内容。 

`.dockerignore` 的作用和语法类似于 `.gitignore`，可以忽略一些不需要的文件，这样可以有效加快镜像构建时间，同时减少`Docker`镜像的大小。

### 常用命令

```
// 查看镜像
docker image ls 
docker images
// 拉取镜像
docker pull debian
// 交互式运行镜像
docker run -it debian
// 删除镜像
docker rmi [image ID]
// 删除所有镜像
docker rmi $(docker images -q)
```

## 容器

容器的实质是进程，但与直接在宿主执行的进程不同，容器进程运行于属于自己的独立的 命名空间。因此容器可以拥有自己的 root 文件系统、自己的网络配置、自己的进程空间，甚至自己的用户 ID 空间。容器内的进程是运行在一个隔离的环境里，使用起来，就好像是在一个独立于宿主的系统下操作一样。这种特性使得容器封装的应用比直接在宿主运行更加安全。

每一个容器运行时，是以镜像为基础层，在其上创建一个当前容器的存储层，我们可以称这个为容器运行时读写而准备的存储层为容器存储层。容器存储层的生存周期和容器一样，容器消亡时，容器存储层也随之消亡。因此，**任何保存于容器存储层的信息都会随容器删除而丢失**。

### 常用命令

```
// 创建并运行容器
docker run
// 启动已存在容器
docker container start
// 查看容器
docker container ls -a
docker ps -a
// 进入容器
docker exec 
docker attach
// 导出容器
docker export
// 导入容器
docker import
// 删除容器
docker container rm
docker rm
// 删除所有容器
docker rm $(docker ps -a -q)
```
