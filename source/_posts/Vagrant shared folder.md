---
title: Vagrant shared folder
date: 2018-05-24 14:00:58
tags: vagrant
---

## Problem

```
Vagrant was unable to mount VirtualBox shared folders. This is usually
because the filesystem "vboxsf" is not available. This filesystem is
made available via the VirtualBox Guest Additions and kernel module.
Please verify that these guest additions are properly installed in the
guest. This is not a bug in Vagrant and is usually caused by a faulty
Vagrant box. For context, the command attempted was:

mount -t vboxsf -o uid=1000,gid=1000 vagrant_data /vagrant_data

The error output from the command was:

/sbin/mount.vboxsf: mounting failed with the error: No such device
```

View the log at `/var/log/vboxadd-install.log`:

```
Error: unable to find the sources of your current Linux kernel.
```

<!-- more -->

### Useless solutions

1. upgrade or reinstall Linux kernel

    sudo yum install gcc kernel-devel kernel-headers

    Loaded plugins: fastestmirror
    Loading mirror speeds from cached hostfile
    * base: mirrors.163.com
    * extras: mirrors.163.com
    * updates: mirrors.163.com
    Package gcc-4.8.5-28.el7_5.1.x86_64 already installed and latest version
    Package kernel-devel-3.10.0-862.3.2.el7.x86_64 already installed and latest version
    Package kernel-headers-3.10.0-862.3.2.el7.x86_64 already installed and latest version
    Nothing to do


2. upgrade && downgrade virtualbox

3. reinstall vagrant

### Final solution

1. just remove the directory `~/.vagrant.d`

2. vagrant reload


My environment：

* Vagrant 2.1.1
* Virtualbox 5.1.36
* OSX 10.13.2

## vagrant up crashes with vboxsf

Vagrant was unable to mount VirtualBox shared folders. This is usually
because the filesystem "vboxsf" is not available. This filesystem is
made available via the VirtualBox Guest Additions and kernel module.
Please verify that these guest additions are properly installed in the
guest. This is not a bug in Vagrant and is usually caused by a faulty
Vagrant box. For context, the command attempted was:

mount -t vboxsf -o uid=1000,gid=1000 home_vagrant_labs /home/vagrant/labs

The error output from the command was:

mount: unknown filesystem type 'vboxsf'

### solution

vagrant plugin install vagrant-vbguest