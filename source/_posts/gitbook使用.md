---
title: gitbook使用
date: 2018-01-16 20:14:09
tags: 
 - Gitbook
 - Node
---
## gitbook踩坑记
### Easy的开始
今天在`Gitbook`上看中了一本《GO语言圣经》，由于在线看速度比较慢不太方便，于是便想下载源码自行编译查看学习。

操作步骤也比较的简单：

1. 安装Node环境
<!-- more -->
    ```
    # 详情参考 https://nodejs.org/en/download/package-manager/
    # brew 安装
    brew install node
    # 或者通过nvm管理
    nvm install node
    ```
2. 安装gitbook-cli
    ```
    npm install -g gitbook-cli
    # or cnpm
    cnpm install -g gitbook-cli
    ```
3. 进入gitbook目录文件夹，依次执行`gitbook install`，`gitbook build`

### 一堆错误
由于`Node`环境之前一直都有，版本是`v8.3.0`，所以我直接执行了第二步，成功安装了`gitbook-cli`

#### Cannot find module 'internal/fs'
执行`gitbook install`后，提示在安装`2.6.7`版本，然后输出了一堆信息，但是最后安装失败了，错误如下：
    ```
    Error: Cannot find module 'internal/fs'
     at Function.Module._resolveFilename (module.js:485:15)
     at Function.Module._load (module.js:437:25)
     at Module.require (module.js:513:17)
     at require (internal/module.js:11:18)
     at evalmachine.<anonymous>:40:20
     at Object.<anonymous> (..../graceful-fs/fs.js:11:1)
     ...
    ```

有了明确的错误，就直接`Google`了，[查看Issue](https://github.com/nodejs/node/issues/13361)很多都说重新安装就好了，我也不清楚到底怎么回事，好像之前OSX有升级过，可能部分库受到了影响吧，所以还是老老实实的重装了。

#### Cannot find module 'internal/util/types'
重装`Node`后，还是出现了错误，（没仔细看，印象中好像一样），第一反应是有缓存， 于是把`.gitbook`目录删除了，再次安装，出现新的错误如下：
    ```
    Error loading version latest: Error: Cannot find module 'internal/util/types'
    at Function.Module._resolveFilename (module.js:555:15)
    at Function.Module._load (module.js:482:25)
    at Module.require (module.js:604:17)
    at require (internal/module.js:11:18)
    at evalmachine.<anonymous>:31:26
    at Object.<anonymous> (/Users/lichfaker/.gitbook/versions/2.6.7/node_modules/graceful-fs/fs.js:11:1)
    at Module._compile (module.js:660:30)
    at Object.Module._extensions..js (module.js:671:10)
    at Module.load (module.js:573:32)
    at tryModuleLoad (module.js:513:12)
    ```

>针对这个问题主要是`graceful-fs`跟`node`的版本不兼容导致的，要么将`node`降级到6以下，要么升级`graceful-fs`

怎么可能这么坑呢？抱着试一试的态度，我尝试查看获取最新版的`gitbook`，一顿命令操作发现，最新稳定的版本是`3.2.3`，而每次执行`gitbook install` 默认安装的版本是`2.6.7`。正常来说不可能放着最新的版本不用而使用较旧的版本，除非是哪个地方指定了具体使用的版本。

最后在书的源码目录下面的`book.json`中找到了罪魁祸首,将其版本改成`3.2.3`成功解决问题：

```
{
	"gitbook": "2.x",
	"title": "Go语言圣经",
	"description": "<The Go Programming Language>中文版",
	"language": "zh-hans",
	"structure": {
		"readme": "preface.md"
	},
	"plugins": [
		"katex",
		"-search"
	]
}
```

## Gitbook 使用
安装这个东西，折腾了近2个小时，中间还走过一些弯路，再小再简单的东西，如果不去了解就盲目的使用，也可能会引发一些意想不到的问题，所以决定好好的了解下`gitbook`

### 基本使用
#### 基本命令
* 使用 `gitbook init` 初始化书籍目录
* 使用 `gitbook build` 编译书籍
* 使用 `gitbook serve` 编译并预览书籍
* 使用 `gitbook pdf` 导出pdf，需要依赖 `ebook-convert` (同 `mobi` , `epub` )

#### 简介
书本的第一页内容是从文件 `README.md` 中提取的。如果这个文件名没有出现在 `SUMMARY` 中，那么它会被添加为章节的第一个条目，文件 `SUMMARY.md` 来定义书本的章节和子章节的结构。

GitBook会读取 `.gitignore`，`.bookignore`，`.ignore` 文件来获取忽略的文件和目录的列表。
这些文件的格式，遵循和 `.gitignore` 同样的约定

#### 配置
所有的配置都以JSON格式存储在名为 `book.json` 的文件中。

```
    {
    // gitbook 版本
    "gitbook": ">=3.0.0",

    // 作者
    "author": "LichFaker", 

    // 图书标题和描述 (默认从README抽取)
    "title": "Hello World",
    "description": "测试一下",

    // 产生的书籍的类型
    // 注意: 它会覆盖命令行传入的参数
    // 不建议在此文件中配置
    "generator": "site", 

    // 指定语言为中文
    "language": "zh-hans", 

    // 输出文件夹
    // 注意: 它会覆盖命令行传入的参数
    // 不建议在此文件中配置
    "output": null,

    // 模版中的链接 (null: default, false: remove, string: new value)
    "links": {
    	// Custom links at top of sidebar
    	"sidebar": {
    	    "Custom link name": "https://customlink.com"
    	},
        // Sharing links
        "sharing": {
            "google": null,
            "facebook": null,
            "twitter": null,
            "weibo": null,
            "all": null
        }
    },

    // PDF 参数
    "pdf": {
        // Add toc at the end of the file
        "toc": true,
        // Add page numbers to the bottom of every page
        "pageNumbers": false,
        // Font size for the fiel content
        "fontSize": 12,
        // Paper size for the pdf
        // Choices are [u’a0’, u’a1’, u’a2’, u’a3’, u’a4’, u’a5’, u’a6’, u’b0’, u’b1’, u’b2’, u’b3’, u’b4’, u’b5’, u’b6’, u’legal’, u’letter’]
        "paperSize": "a4",
        // Margin (in pts)
        // Note: 72 pts equals 1 inch
        "margin": {
            "right": 62,
            "left": 62,
            "top": 36,
            "bottom": 36
        }
    }, 

    "plugins": [
        "disqus",
        "theme-gestalt", 
        "-theme-default", 
        "styles-sass-fix", 
        "multipart", 
        "toggle-chapters"
    ], 
    "pluginsConfig": {
        "theme-gestalt": {
            "logo": "/core-scrapy/assets/logo.png", 
            "favicon": "/core-scrapy/assets/favicon.png", 
            "excludeDefaultStyles": true
        }, 
        "disqus": {
            "shortName": "yidao620cgithubio"
        }
    }, 

    // 自定义样式
    "styles": {
        "website": "./styles/website.scss"
    }, 
    "variables": { }
}
```

参考：

https://toolchain.gitbook.com/