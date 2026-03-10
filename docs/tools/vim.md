# Vim 实用方案

覆盖模式切换、高频操作、配置优化和插件推荐，面向日常开发场景。

## 模式与基础操作

### 模式切换

| 模式 | 进入方式 | 用途 |
|------|---------|------|
| Normal | `Esc` / `Ctrl-[` | 导航、删除、复制、命令 |
| Insert | `i` `a` `o` `I` `A` `O` | 输入文本 |
| Visual | `v`（字符）/ `V`（行）/ `Ctrl-v`（块） | 选择文本 |
| Command | `:` | 执行命令（保存、退出、替换等） |

常用进入 Insert 模式的方式：

| 按键 | 行为 |
|------|------|
| `i` | 光标前插入 |
| `a` | 光标后插入 |
| `I` | 行首插入 |
| `A` | 行尾插入 |
| `o` | 下方新建行插入 |
| `O` | 上方新建行插入 |

### 光标移动

```vim
" 基础移动
h j k l              " 左 下 上 右

" 单词级
w                     " 下一个单词开头
b                     " 上一个单词开头
e                     " 当前单词末尾

" 行级
0                     " 行首
^                     " 行首非空字符
$                     " 行尾

" 文件级
gg                    " 文件开头
G                     " 文件末尾
:42                   " 跳到第 42 行

" 段落/块级
{                     " 上一段落
}                     " 下一段落
%                     " 匹配括号跳转
```

### 编辑操作

```vim
" 删除
x                     " 删除光标下字符
dd                    " 删除整行
dw                    " 删除到下一个单词
d$  /  D              " 删除到行尾
diw                   " 删除整个单词（不含空格）
daw                   " 删除整个单词（含空格）
di"                   " 删除引号内内容
di{                   " 删除花括号内内容

" 修改（删除并进入 Insert）
ciw                   " 修改整个单词
ci"                   " 修改引号内内容
cc                    " 修改整行
C                     " 修改到行尾

" 复制与粘贴
yy                    " 复制整行
yw                    " 复制到下一个单词
p                     " 在光标后粘贴
P                     " 在光标前粘贴

" 撤销与重做
u                     " 撤销
Ctrl-r                " 重做

" 其他
.                     " 重复上一次操作
~                     " 切换大小写
>>                    " 当前行缩进
<<                    " 当前行取消缩进
J                     " 合并下一行到当前行
```

::: tip 操作符 + 动作
Vim 的核心是 `操作符 + 动作` 的组合模式：`d`（删除）+ `iw`（内部单词）= 删除整个单词。掌握 `d` `c` `y` `v` 四个操作符和常用动作，就能组合出大量操作。
:::

## 搜索与替换

```vim
" 搜索
/keyword              " 向下搜索
?keyword              " 向上搜索
n                     " 下一个匹配
N                     " 上一个匹配
*                     " 搜索光标下的单词

" 替换
:s/old/new/           " 替换当前行第一个匹配
:s/old/new/g          " 替换当前行所有匹配
:%s/old/new/g         " 替换全文所有匹配
:%s/old/new/gc        " 替换全文，逐个确认

" 取消搜索高亮
:noh
```

## 多文件与窗口操作

### 分屏

```vim
:sp file.go           " 水平分屏打开文件
:vsp file.go          " 垂直分屏打开文件

Ctrl-w h/j/k/l        " 切换到 左/下/上/右 窗口
Ctrl-w =              " 等分所有窗口
Ctrl-w _              " 最大化当前窗口（垂直）
Ctrl-w |              " 最大化当前窗口（水平）
Ctrl-w q              " 关闭当前窗口
```

### Buffer 管理

```vim
:e file.go            " 打开文件到新 buffer
:ls                   " 查看所有 buffer
:bn                   " 下一个 buffer
:bp                   " 上一个 buffer
:bd                   " 关闭当前 buffer
:b 3                  " 跳到第 3 个 buffer
```

### Tab 管理

```vim
:tabnew file.go       " 新 tab 打开文件
gt                    " 下一个 tab
gT                    " 上一个 tab
:tabclose             " 关闭当前 tab
```

## .vimrc 配置推荐

以下配置可直接复制到 `~/.vimrc`：

```vim
" === 基础设置 ===
set nocompatible          " 关闭 vi 兼容模式
set encoding=utf-8        " 编码
set fileencodings=utf-8,gbk
syntax on                 " 语法高亮
filetype plugin indent on " 文件类型检测

" === 显示 ===
set number                " 显示行号
set relativenumber        " 相对行号
set cursorline            " 高亮当前行
set showmatch             " 匹配括号高亮
set laststatus=2          " 始终显示状态栏
set scrolloff=5           " 光标距顶/底保持 5 行

" === 缩进 ===
set tabstop=4             " Tab 宽度
set shiftwidth=4          " 自动缩进宽度
set expandtab             " Tab 转空格
set autoindent            " 自动缩进
set smartindent           " 智能缩进

" === 搜索 ===
set hlsearch              " 搜索高亮
set incsearch             " 增量搜索
set ignorecase            " 忽略大小写
set smartcase             " 有大写时精确匹配

" === 其他 ===
set clipboard=unnamedplus " 系统剪贴板
set mouse=a               " 启用鼠标
set wildmenu              " 命令行补全菜单
set wrap                  " 自动换行
set backspace=indent,eol,start
```

## 实用插件推荐

推荐使用 [vim-plug](https://github.com/junegunn/vim-plug) 管理插件：

```vim
" 安装 vim-plug 后在 .vimrc 中添加
call plug#begin('~/.vim/plugged')

Plug 'preservim/nerdtree'          " 文件树
Plug 'junegunn/fzf.vim'            " 模糊搜索
Plug 'tpope/vim-surround'          " 快速修改包围符号
Plug 'tpope/vim-commentary'        " 快速注释 gcc
Plug 'airblade/vim-gitgutter'      " Git 变更标记
Plug 'vim-airline/vim-airline'     " 状态栏美化
Plug 'morhetz/gruvbox'             " 配色主题

call plug#end()
```

| 插件 | 用途 | 常用操作 |
|------|------|---------|
| NERDTree | 文件树浏览 | `:NERDTreeToggle` 打开/关闭 |
| fzf.vim | 模糊文件搜索 | `:Files` 搜索文件，`:Rg` 搜索内容 |
| vim-surround | 修改包围符号 | `cs"'` 将双引号改为单引号 |
| vim-commentary | 注释 | `gcc` 注释当前行，`gc` + 动作 |
| vim-gitgutter | Git diff 标记 | 左侧显示增删改标记 |

安装插件：打开 Vim 执行 `:PlugInstall`。

## Vim 与 IDE 集成

### VS Code — Vim 扩展

安装 `vscodevim.vim` 扩展后，在 `settings.json` 中配置：

```json
{
  "vim.leader": "<space>",
  "vim.hlsearch": true,
  "vim.useSystemClipboard": true,
  "vim.handleKeys": {
    "<C-a>": false,
    "<C-c>": false,
    "<C-v>": false,
    "<C-x>": false,
    "<C-f>": false
  }
}
```

### JetBrains — IdeaVim

安装 IdeaVim 插件后，创建 `~/.ideavimrc`：

```vim
set ideajoin                " 智能合并行
set surround                " 启用 surround 模拟
set commentary              " 启用 commentary 模拟
set number relativenumber
set incsearch hlsearch
set ignorecase smartcase
set clipboard=unnamedplus

let mapleader=" "
nmap <leader>e :action ActivateProjectToolWindow<CR>
nmap <leader>r :action RenameElement<CR>
nmap <leader>f :action GotoFile<CR>
nmap <leader>g :action FindInPath<CR>
```

## 常用快捷键速查表

| 操作 | Normal 模式 | Visual 模式 | Insert 模式 |
|------|------------|------------|------------|
| 保存 | `:w` | — | — |
| 退出 | `:q` | — | — |
| 保存并退出 | `:wq` / `ZZ` | — | — |
| 强制退出 | `:q!` | — | — |
| 删除行 | `dd` | `d` | — |
| 复制行 | `yy` | `y` | — |
| 粘贴 | `p` | `p` | `Ctrl-r "` |
| 撤销 | `u` | — | — |
| 全选 | `ggVG` | — | — |
| 缩进 | `>>` | `>` | `Ctrl-t` |
| 取消缩进 | `<<` | `<` | `Ctrl-d` |
| 注释（需插件） | `gcc` | `gc` | — |
