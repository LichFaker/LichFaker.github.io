---
title: Golang规范
date: 2018-04-04 16:39:26
tags: Golang
---

## 1. 命名

### 1.1 文件命名
文件命名一律采用小写，不用驼峰式，尽量见名思义，看见文件名就可以知道这个文件下的大概内容。
其中测试文件以`_test.go`结尾，除测试文件外，命名不出现`_`。

例子：`stringutil.go`， `stringutil_test.go`

### 1.2 package
包名用小写,使用短命名,尽量和标准库不要冲突。
包名统一使用单数形式。

### 1.3 变量
变量命名一般采用驼峰式，当遇到特有名词（缩写或简称，如DNS）的时候，特有名词根据是否私有全部大写或小写。

例子： `apiClient`、`URLString`

### 1.4 常量
同变量规则，力求语义表达完整清楚，不要嫌名字长。
如果模块复杂，为避免混淆，可按功能统一定义在`package`下的一个文件中。

### 1.5 接口
单个函数的接口名以 `er` 为后缀

```
type Reader interface {
    Read(p []byte) (n int, err error)
}
```

两个函数的接口名综合两个函数名，如:

```
type WriteFlusher interface {
    Write([]byte) (int, error)
    Flush() error
}
```

三个以上函数的接口名类似于结构体名，如:

```
type Car interface {
    Start() 
    Stop()
    Drive()
}
```
<!-- more -->
### 1.6 结构体
结构体名应该是名词或名词短语，如`Account`,`Book`，避免使用`Manager`这样的。
如果该数据结构需要序列化，如`json`， 则首字母大写， 包括里面的字段。

### 1.7 方法
方法名应该是动词或动词短语，采用驼峰式。将功能及必要的参数体现在名字中， 不要嫌长， 如`updateById`，`getUserInfo`.

如果是结构体方法，那么 `Receiver` 的名称应该缩写，一般使用一个或者两个字符作为 `Receiver` 的名称。如果 `Receiver` 是指针， 那么统一使用`p`。 如：

```
func (f foo) method() {
	...
}
```

```
func (p *foo) method() {
	...
}
```

对于`Receiver`命名应该统一， 要么都使用值， 要么都用指针。

## 2. 注释

每个包都应该有一个包注释，位于 package 之前。如果同一个包有多个文件，只需要在一个文件中编写即可；如果你想在每个文件中的头部加上注释，需要在版权注释和 Package前面加一个空行，否则版权注释会作为Package的注释。如：

```
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

Package net provides a portable interface for network I/O, including
TCP/IP, UDP, domain name resolution, and Unix domain sockets.
package net
```

每个以大写字母开头（即可以导出）的方法应该有注释，且以该函数名开头。如：

```
// Get 会响应对应路由转发过来的 get 请求
func (c *Controller) Get() {
    ...
}
```

注释应该用一个完整的句子，注释的第一个单词应该是要注释的指示符，以便在 `godoc` 中容易查找。

注释应该以一个句点 `.` 结束。