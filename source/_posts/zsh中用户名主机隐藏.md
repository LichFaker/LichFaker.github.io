---
title: zsh中用户名主机隐藏
date: 2018-03-16 09:45:36
tags: 
 - zsh
 - tips
---

最近终端用的有点多，每次敲命令前看一长串`lichfaker@LichFakerdeMacBook-Pro`很不爽，有时命令稍微长点就会换行，于是就想着将它隐藏掉。

## ~~修改bashrc~~
网上搜了一圈，基本都是修改`etc/bashrc`文件中的`PS1`:

```
PS1= '\W \u\$ '
```

实践后发现并没有生效， 后知后觉： bashrc修改的应该是bash中的显示， 而我用的是`oh-my-zsh`。

## 修改Zsh主题
以`ZSH_THEME="agnoster"`为例

```
cd ~/.oh-my-zsh/themes
vi agnoster.zsh-theme
```

其中有这么一段代码:
<!-- more -->
```
# Context: user@hostname (who am I and where am I)
prompt_context() {
  if [[ "$USER" != "$DEFAULT_USER" || -n "$SSH_CLIENT" ]]; then
    prompt_segment black default "%(!.%{%F{yellow}%}.)$USER@%m"
  fi
}

## Main prompt
build_prompt() {
  RETVAL=$?
  prompt_status
  prompt_virtualenv
  prompt_context
  prompt_dir
  prompt_git
  prompt_bzr
  prompt_hg
  prompt_end
}
```

* 修改`prompt_context()`
* 注释 `prompt_context`

## 修改zshrc

上述直接修改主题的方式并不太友好，因为主题文件可能会随着`oh_my_zsh`的更新而有所改变。

在[ZSH Agnoster Theme showing machine name](https://stackoverflow.com/questions/28491458/zsh-agnoster-theme-showing-machine-name)上找到了一种更好的方式：

> Overriding the function prompt_context or build_prompt on Agnoster theme will rescue. Putting below snippets at the very end of the ~/.zshrc for example.

```
# redefine prompt_context for hiding user@hostname
prompt_context () { }
```