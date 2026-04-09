# NodeShift - Node.js 版本管理器

## 设计文档 v1.0

---

## 1. 项目概述

### 1.1 项目背景

当前 Node.js 版本管理生态存在以下痛点：

- **nvm-windows** 仅支持 Windows，自定义路径体验差，经常遇到符号链接权限问题
- **nvm (nvm-sh)** 仅支持 Unix 系统，需要手动配置 .bashrc
- **fnm / Volta** 只有命令行界面，对新手不友好
- 没有一个工具能提供统一的 **"选版本 + 选路径 + 自动配环境 + 镜像加速"** 一站式体验

### 1.2 产品定位

**NodeShift** 是一款带 GUI 的跨平台 Node.js 版本管理器，提供一键安装、多版本切换、自动环境配置等功能。目标是成为最简单、最易用的 Node.js 管理工具。

### 1.3 目标用户

- 需要管理多个 Node.js 版本的前端开发者
- 不熟悉命令行配置的初学者
- 需要统一 Node.js 环境的团队
- 需要镜像加速下载的国内开发者

---

## 2. 技术选型

| 层级 | 技术方案 | 选型理由 |
|------|---------|---------|
| 框架 | **Tauri 2.x** | 打包体积小 (5-10MB)，跨平台，原生性能 |
| 前端 | **React + TypeScript** | 生态成熟，组件库丰富 |
| UI 库 | **Shadcn/ui + Tailwind CSS** | 设计现代，轻量可定制 |
| 后端 | **Rust** | 系统级操作，高性能，内存安全 |
| 构建 | **GitHub Actions** | CI/CD 多平台自动构建 |
| 打包 | **NSIS (Win) / DMG (Mac) / AppImage (Linux)** | 各平台原生安装体验 |

---

## 3. 核心功能

### 3.1 功能矩阵

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 版本浏览与选择 | P0 | 列出所有可用 Node.js 版本（LTS / Current / 全部） |
| 自定义安装路径 | P0 | 用户选择 Node.js 版本的存储位置 |
| 一键安装 | P0 | 自动完成下载、解压、配置 |
| 自动配置环境变量 | P0 | 自动设置 PATH（Win 走注册表，Unix 走 shell 配置文件） |
| 多版本切换 | P0 | 即时切换当前激活的 Node.js 版本 |
| 镜像源配置 | P1 | 支持淘宝 / 华为 / 腾讯等国内镜像加速下载 |
| 项目级版本绑定 | P1 | 读取 .nvmrc / .node-version 文件，进入项目时自动切换版本 |
| 卸载管理 | P1 | 干净移除已安装的版本 |
| 代理设置 | P2 | HTTP/SOCKS5 代理下载 |
| npm 源切换 | P2 | 快速切换 npm registry 源 |
| 导入已有安装 | P2 | 检测并导入系统中已存在的 Node.js |

### 3.2 功能详细设计

#### 3.2.1 版本浏览与安装

```
+----------------------------------------------------------+
|  NodeShift                                    _ [] X      |
+----------------------------------------------------------+
|  [LTS]  [Current]  [全部]           搜索: [________]     |
+----------------------------------------------------------+
|  版本        |  状态        |  LTS 名称  |  操作          |
|-------------|-------------|------------|----------------|
|  v24.14.1   |  活跃 LTS    |  Krypton   |  [安装]        |
|  v22.15.0   |  活跃 LTS    |  Jod       |  [已安装] *    |
|  v20.19.0   |  维护 LTS    |  Iron      |  [安装]        |
|  v25.7.0    |  Current    |  -         |  [安装]        |
+----------------------------------------------------------+
|  安装路径: [D:\nodejs\versions       ] [浏览]             |
|  镜像源:   [https://npmmirror.com  v]                     |
|                                        [安装所选版本]      |
+----------------------------------------------------------+
```

**安装流程：**

1. 应用从 `https://nodejs.org/dist/index.json` 获取版本列表
2. 用户按 LTS / Current / 全部 筛选
3. 用户选择版本，选择安装路径
4. 下载 -> 校验 SHA256 -> 解压 -> 配置 PATH
5. 下载和解压过程中显示进度条

#### 3.2.2 多版本切换

**各平台切换机制：**

| 平台 | 策略 |
|------|------|
| Windows | 通过 Windows 注册表修改用户 PATH 环境变量，替换当前激活的 Node.js bin 目录 |
| macOS | 更新符号链接 `~/.nodeshift/current` -> 目标版本，写入 shell 配置文件 |
| Linux | 与 macOS 相同 |

**切换流程：**

```
用户点击某版本的"使用"按钮
    -> 更新符号链接 / PATH
    -> 验证：运行 `node -v` 确认切换成功
    -> 更新 UI 显示当前激活版本
```

#### 3.2.3 自动配置环境变量

**Windows：**
```rust
// 通过注册表修改用户 PATH
// HKEY_CURRENT_USER\Environment\Path
// 添加: {安装目录}\current
// 广播 WM_SETTINGCHANGE 消息，使已打开的终端感知变更
```

**macOS / Linux：**
```rust
// 检测当前 shell: bash / zsh / fish
// 在 ~/.bashrc / ~/.zshrc / ~/.config/fish/config.fish 中追加:
//   export PATH="$HOME/.nodeshift/current/bin:$PATH"
// 创建符号链接: ~/.nodeshift/current -> ~/.nodeshift/versions/v24.14.1
```

#### 3.2.4 镜像源配置

内置镜像源列表：

| 名称 | URL | 地区 |
|------|-----|------|
| 官方源 | https://nodejs.org/dist/ | 全球 |
| 淘宝源 (npmmirror) | https://npmmirror.com/mirrors/node/ | 中国 |
| 华为源 | https://repo.huaweicloud.com/nodejs/ | 中国 |
| 腾讯源 | https://mirrors.cloud.tencent.com/nodejs-release/ | 中国 |
| 自定义 | 用户自行填写 URL | - |

#### 3.2.5 项目级版本绑定

```
用户在终端中进入项目目录
    -> NodeShift 后台服务检测 .nvmrc / .node-version 文件
    -> 自动切换到指定版本
    -> 如果该版本未安装，弹出提示引导安装
```

实现方式：一个轻量级 CLI 伴侣程序（`nodeshift-shim`），拦截 `node` / `npm` / `npx` 命令，在执行前检查项目的版本文件。

---

## 4. 系统架构

### 4.1 整体架构

```
+------------------------------------------+
|              Tauri 前端                    |
|  +--------------------------------------+|
|  |  React 应用 (TypeScript)             ||
|  |  - 版本列表页面                       ||
|  |  - 设置页面                           ||
|  |  - 状态仪表盘                         ||
|  +--------------------------------------+|
+------------------------------------------+
          |  Tauri IPC (invoke)  |
+------------------------------------------+
|              Tauri 后端 (Rust)             |
|  +--------------------------------------+|
|  |  命令处理层                            ||
|  |  - version_manager.rs  版本管理        ||
|  |  - downloader.rs       下载器          ||
|  |  - env_config.rs       环境变量配置     ||
|  |  - mirror_manager.rs   镜像源管理       ||
|  |  - project_detector.rs 项目版本检测     ||
|  +--------------------------------------+|
|  +--------------------------------------+|
|  |  平台抽象层                            ||
|  |  - windows.rs (注册表, PATH)           ||
|  |  - unix.rs (符号链接, Shell 配置)       ||
|  +--------------------------------------+|
+------------------------------------------+
          |
+------------------------------------------+
|  文件系统                                  |
|  ~/.nodeshift/                            |
|    ├── config.json        配置文件          |
|    ├── current -> versions/v24.14.1       |
|    └── versions/          版本存储目录      |
|        ├── v24.14.1/                      |
|        ├── v22.15.0/                      |
|        └── v20.19.0/                      |
+------------------------------------------+
```

### 4.2 目录结构

```
~/.nodeshift/                    # 默认根目录（用户可自定义）
├── config.json                  # 全局配置文件
├── current/                     # 指向当前激活版本的符号链接 (Unix)
│                                # 或目录联结 (Windows)
├── versions/                    # 已安装的 Node.js 版本
│   ├── v24.14.1/
│   │   ├── bin/
│   │   │   ├── node
│   │   │   ├── npm
│   │   │   └── npx
│   │   └── ...
│   └── v22.15.0/
│       └── ...
├── cache/                       # 下载的压缩包缓存
│   ├── node-v24.14.1-linux-x64.tar.xz
│   └── ...
└── shims/                       # CLI shim 脚本（项目级切换用）
    ├── node
    ├── npm
    └── npx
```

### 4.3 配置文件结构

```json
{
  "version": "1.0.0",
  "install_dir": "~/.nodeshift",
  "mirror": "https://npmmirror.com/mirrors/node/",
  "current_version": "v24.14.1",
  "proxy": null,
  "npm_registry": "https://registry.npmmirror.com",
  "auto_switch": true,
  "versions": {
    "v24.14.1": {
      "path": "~/.nodeshift/versions/v24.14.1",
      "installed_at": "2026-04-06T10:00:00Z",
      "lts": "Krypton"
    },
    "v22.15.0": {
      "path": "~/.nodeshift/versions/v22.15.0",
      "installed_at": "2026-03-15T08:30:00Z",
      "lts": "Jod"
    }
  }
}
```

---

## 5. 项目源码结构

```
nodeshift/
├── src-tauri/                        # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs                   # 入口文件
│   │   ├── lib.rs                    # 模块导出
│   │   ├── commands/                 # Tauri 命令处理器
│   │   │   ├── mod.rs
│   │   │   ├── version.rs            # 版本列表 / 安装 / 卸载 / 切换
│   │   │   ├── config.rs             # 配置 CRUD
│   │   │   └── system.rs             # 系统信息查询
│   │   ├── core/                     # 核心业务逻辑
│   │   │   ├── mod.rs
│   │   │   ├── downloader.rs         # 下载（进度、重试、校验）
│   │   │   ├── extractor.rs          # 压缩包解压 (tar.xz / zip)
│   │   │   ├── version_manager.rs    # 安装、卸载、切换逻辑
│   │   │   ├── env_config.rs         # PATH / 环境变量管理
│   │   │   ├── mirror.rs             # 镜像源管理
│   │   │   └── project_detect.rs     # .nvmrc / .node-version 检测
│   │   └── platform/                 # 操作系统特定实现
│   │       ├── mod.rs
│   │       ├── windows.rs            # 注册表、WM_SETTINGCHANGE
│   │       ├── macos.rs              # Shell 配置、符号链接
│   │       └── linux.rs              # Shell 配置、符号链接
│   └── icons/                        # 应用图标
├── src/                              # React 前端
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── VersionList.tsx           # 版本列表（含筛选）
│   │   ├── VersionCard.tsx           # 单个版本卡片
│   │   ├── InstallDialog.tsx         # 安装选项弹窗
│   │   ├── SettingsPanel.tsx         # 镜像源、代理、路径设置
│   │   ├── StatusBar.tsx             # 当前版本、系统信息
│   │   └── ProgressBar.tsx           # 下载 / 安装进度条
│   ├── hooks/
│   │   ├── useVersions.ts            # 版本数据获取与管理
│   │   ├── useConfig.ts              # 应用配置状态
│   │   └── useInstall.ts             # 安装流程状态机
│   ├── lib/
│   │   ├── tauri.ts                  # Tauri invoke 封装
│   │   └── types.ts                  # TypeScript 类型定义
│   └── styles/
│       └── globals.css               # Tailwind 全局样式
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## 6. 关键流程

### 6.1 安装版本

```
用户                      前端                        Rust 后端
 |                         |                            |
 |-- 选择 v24.14.1 ------->|                            |
 |-- 点击"安装" ----------->|                            |
 |                         |-- invoke install_version -->|
 |                         |                            |-- 解析下载 URL
 |                         |                            |   (镜像源 + 平台 + 架构)
 |                         |                            |-- 下载压缩包
 |                         |<-- 进度事件 <---------------|   (流式下载，实时进度)
 |<-- 显示进度条 <----------|                            |
 |                         |                            |-- 校验 SHA256 哈希
 |                         |                            |-- 解压到版本目录
 |                         |                            |-- 更新 config.json
 |                         |<-- 完成事件 <---------------|
 |<-- "安装成功！" <--------|                            |
```

### 6.2 切换版本

```
用户                      前端                        Rust 后端
 |                         |                            |
 |-- 点击 v22 的"使用" ---->|                            |
 |                         |-- invoke switch_version -->|
 |                         |                            |-- [Windows] 更新 PATH
 |                         |                            |     通过注册表 + 广播消息
 |                         |                            |-- [Unix] 更新符号链接
 |                         |                            |     current -> v22.x.x
 |                         |                            |-- 验证 node -v 输出
 |                         |                            |-- 更新 config.json
 |                         |<-- 成功 <------------------|
 |<-- UI 已更新 <----------|                            |
```

### 6.3 项目级自动切换

```
终端（PATH 中包含 shim）
 |
 |-- 用户执行 `node app.js`
 |-- Shim 拦截命令
 |-- 检查当前目录及父目录中的 .nvmrc / .node-version 文件
 |   |-- 找到: "22.15.0"
 |   |-- 检查 v22.15.0 是否已安装
 |   |   |-- 已安装: 执行 ~/.nodeshift/versions/v22.15.0/bin/node app.js
 |   |   |-- 未安装: 提示 "NodeShift: v22.15.0 未安装，请执行 nodeshift install 22.15.0"
 |   |-- 未找到: 使用当前默认版本
```

---

## 7. 各平台实现细节

### 7.1 Windows

| 项目 | 实现方式 |
|------|---------|
| 下载格式 | `.zip` (node-vX.X.X-win-x64.zip) |
| PATH 修改 | 注册表: `HKCU\Environment\Path`，追加 `{根目录}\current` |
| 广播变更 | `SendMessageTimeout(HWND_BROADCAST, WM_SETTINGCHANGE, ...)` |
| 版本切换 | 目录联结: `mklink /J current versions\vX.X.X` |
| Shim | `.cmd` 批处理文件 |
| 权限提升 | 不需要（仅修改用户级 PATH） |

### 7.2 macOS

| 项目 | 实现方式 |
|------|---------|
| 下载格式 | `.tar.xz` (node-vX.X.X-darwin-arm64.tar.xz) |
| PATH 修改 | 在 `~/.zshrc` 中追加 `export PATH`（现代 macOS 默认 shell） |
| 版本切换 | 符号链接: `ln -sfn versions/vX.X.X current` |
| Shim | Shell 脚本 |
| 架构检测 | 检查 `uname -m`: arm64 (Apple Silicon) 或 x86_64 (Intel) |

### 7.3 Linux

| 项目 | 实现方式 |
|------|---------|
| 下载格式 | `.tar.xz` (node-vX.X.X-linux-x64.tar.xz) |
| PATH 修改 | 检测 shell 类型，追加到 `~/.bashrc` / `~/.zshrc` / `~/.config/fish/config.fish` |
| 版本切换 | 符号链接: `ln -sfn versions/vX.X.X current` |
| Shim | Shell 脚本 |
| 架构检测 | 检查 `uname -m`: x86_64 / aarch64 |

---

## 8. UI 设计

### 8.1 主要页面

| 页面 | 说明 |
|------|------|
| **仪表盘** | 当前激活版本、快速统计、系统信息 |
| **版本管理** | 浏览 / 搜索 / 筛选 / 安装 / 卸载 / 切换 |
| **设置** | 安装路径、镜像源、代理、npm 源、自动切换开关 |

### 8.2 设计原则

- 支持深色 / 浅色主题
- 简洁清爽，不堆砌功能
- 下载过程实时进度反馈
- 清晰的状态标识（已安装、激活中、LTS、已过期）
- 响应式布局（窗口可缩放）

### 8.3 UI 线框图 - 主界面

```
+------+---------------------------------------------------+
| LOGO |  NodeShift                          [_] [O] [X]   |
+------+---------------------------------------------------+
|      |                                                    |
| [仪] |  当前版本: Node.js v24.14.1 (Krypton LTS)         |
|      |  npm: v11.11.0                                     |
| [版] |  路径: D:\nodejs\versions\v24.14.1                 |
|      |                                                    |
| [设] |  +----------------------------------------------+ |
|      |  | [LTS] [Current] [全部]    [______] 搜索      | |
|      |  +----------------------------------------------+ |
|      |  |                                              | |
|      |  | v24.14.1  活跃 LTS  Krypton   [* 使用中]     | |
|      |  | v22.15.0  活跃 LTS  Jod       [使用][删除]   | |
|      |  | v20.19.0  维护 LTS  Iron      [安装]         | |
|      |  | v25.7.0   Current  -          [安装]         | |
|      |  |                                              | |
|      |  +----------------------------------------------+ |
|      |                                                    |
| [仪] = 仪表盘                                             |
| [版] = 版本管理                                            |
| [设] = 设置                                               |
+------+---------------------------------------------------+
```

---

## 9. 开发阶段规划

### 第一阶段：最小可用版本 MVP（2-3 周）

- [ ] Tauri 项目脚手架搭建（React + Rust）
- [ ] 获取并展示 Node.js 版本列表
- [ ] 下载并解压 Node.js 到自定义路径
- [ ] 自动配置环境变量（各平台适配）
- [ ] 在已安装版本之间切换
- [ ] 基础 UI：版本列表、安装、切换、设置

### 第二阶段：功能增强（1-2 周）

- [ ] 镜像源配置与切换
- [ ] 下载进度（速度、剩余时间）
- [ ] SHA256 校验
- [ ] 卸载版本并清理
- [ ] 深色 / 浅色主题
- [ ] 缓存管理（清理下载的压缩包）

### 第三阶段：高级功能（1-2 周）

- [ ] 项目级版本绑定（.nvmrc / .node-version）
- [ ] CLI shim 实现终端自动切换
- [ ] npm registry 快速切换
- [ ] 代理配置
- [ ] 导入系统已有的 Node.js 安装
- [ ] 系统托盘常驻模式

### 第四阶段：打磨发布（1 周）

- [ ] 自动更新机制
- [ ] 多语言支持（中文 / 英文）
- [ ] GitHub Actions CI/CD 多平台构建
- [ ] 安装包打包（NSIS / DMG / AppImage）
- [ ] 文档和 README

---

## 10. 竞品对比

| 功能 | NodeShift | nvm-windows | fnm | Volta | nvs |
|------|-----------|-------------|-----|-------|-----|
| 图形界面 | 有 | 无 | 无 | 无 | 无 |
| 跨平台 | 是 | 仅 Windows | 是 | 是 | 是 |
| 自定义安装路径 | 完整支持 | 部分支持 | 支持 | 不支持 | 支持 |
| 自动配置环境变量 | 自动 | 自动 | 手动 | 自动 | 自动 |
| 内置镜像源 | 内置 | 手动配置 | 手动配置 | 不支持 | 不支持 |
| 项目级版本绑定 | 支持 | 不支持 | 支持 | 支持 | 不支持 |
| 打包体积 | ~8MB | ~3MB | ~3MB | ~8MB | ~10MB |
| 开发语言 | Rust | Go | Rust | Rust | JS |

---

## 11. 风险与应对策略

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| Windows PATH 长度限制 (2048 字符) | PATH 溢出 | 修改前检查长度，超限时警告用户 |
| 杀毒软件拦截下载/符号链接 | 安装失败 | 对二进制文件签名，提供白名单设置指引 |
| 企业电脑权限限制 | 无法修改 PATH | 支持便携模式（不修改系统，手动配置 PATH） |
| Node.js 镜像源不可用 | 下载失败 | 自动回退到下一个可用镜像源 |
| Shell 配置文件检测失败 | 环境变量未生效 | 支持手动配置，检测常见 shell 类型 |

---

## 12. 技术规格

### 使用的 API 端点

| 端点 | 用途 |
|------|------|
| `https://nodejs.org/dist/index.json` | 版本列表及元数据 |
| `https://nodejs.org/dist/vX.X.X/SHASUMS256.txt` | 校验文件哈希 |
| `https://nodejs.org/dist/vX.X.X/node-vX.X.X-{os}-{arch}.{ext}` | 二进制文件下载 |

### 最低系统要求

| 平台 | 要求 |
|------|------|
| Windows | Windows 10 64 位及以上 |
| macOS | macOS 11 (Big Sur) 及以上，Intel 或 Apple Silicon |
| Linux | Ubuntu 20.04+ / Fedora 35+ / 任何 glibc 2.31+ 的现代发行版 |
| 磁盘空间 | 每个 Node.js 版本约 200MB + 应用本身体积 |

---

## 13. 实现步骤与进度跟踪

### 总览

| 步骤 | 内容 | 状态 | 完成日期 |
|------|------|------|---------|
| 第 1 步 | 项目脚手架搭建 | 已完成 | 2026-04-06 |
| 第 2 步 | 版本列表获取与展示 | 已完成 | 2026-04-06 |
| 第 3 步 | 下载与安装引擎 | 已完成 | 2026-04-06 |
| 第 4 步 | 环境变量自动配置 | 已完成(补充修复) | 2026-04-08 |
| 第 5 步 | 多版本切换 | 已完成(补充修复) | 2026-04-08 |
| 第 6 步 | 设置页面与配置持久化 | 已完成 | 2026-04-08 |
| 第 7 步 | 项目级版本绑定 | 已完成 | 2026-04-08 |
| 第 8 步 | 打磨与发布 | 已完成 | 2026-04-08 |

### 依赖关系

```
第1步 -> 第2步 -> 第3步 -> 第4步 -> 第5步
                                      |
                              第6步 <--+
                                      |
                              第7步 <--+
                                      |
                              第8步 <--+
```

前 5 步串行执行（每步依赖上一步），第 6、7、8 步可并行。完成前 5 步即得到可用 MVP。

### 第 1 步：项目脚手架搭建

**目标：** 搭建完整的 Tauri 2.x + React + TypeScript 项目骨架

**任务清单：**
- [ ] 初始化 Tauri 2.x 项目（含 React + TypeScript 模板）
- [ ] 配置 Tailwind CSS + Shadcn/ui 组件库
- [ ] 搭建 Tauri IPC 前后端基本通信
- [ ] 建立 Rust 模块目录结构（commands / core / platform）
- [ ] 建立前端目录结构（components / hooks / lib / styles）
- [ ] 验证开发环境可正常启动（`cargo tauri dev`）

**产出文件：**
```
nodeshift/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── commands/mod.rs
│       ├── core/mod.rs
│       └── platform/mod.rs
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   └── types.ts
│   └── styles/
│       └── globals.css
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### 第 2 步：版本列表获取与展示

**目标：** 能从远程获取 Node.js 版本列表并在 GUI 中展示

**任务清单：**
- [ ] Rust 端：请求 `nodejs.org/dist/index.json` 解析版本数据
- [ ] Rust 端：定义版本数据结构（NodeVersion struct）
- [ ] Rust 端：镜像源管理模块（内置淘宝/华为/腾讯源）
- [ ] 前端：版本列表页面组件 VersionList.tsx
- [ ] 前端：版本卡片组件 VersionCard.tsx（版本号、状态、LTS 名称、操作按钮）
- [ ] 前端：筛选功能（LTS / Current / 全部）和搜索
- [ ] 前端：通过 Tauri invoke 调用 Rust 命令获取数据

**产出文件：**
```
src-tauri/src/
├── commands/version.rs        # 获取版本列表命令
├── core/mirror.rs             # 镜像源管理
└── core/version_manager.rs    # 版本数据结构与解析

src/
├── components/VersionList.tsx # 版本列表
├── components/VersionCard.tsx # 版本卡片
├── hooks/useVersions.ts       # 版本数据获取 hook
└── lib/types.ts               # 类型定义（更新）
```

### 第 3 步：下载与安装引擎

**目标：** 实现版本下载、校验、解压、安装到指定路径

**任务清单：**
- [ ] Rust 端：流式下载器（进度回调、重试机制）
- [ ] Rust 端：SHA256 校验模块
- [ ] Rust 端：解压器（tar.xz for Unix, zip for Windows）
- [ ] Rust 端：安装逻辑（解压到指定目录、更新 config.json）
- [ ] 前端：安装弹窗 InstallDialog.tsx（选路径、选镜像源）
- [ ] 前端：进度条组件 ProgressBar.tsx（下载速度、剩余时间）
- [ ] 前端：安装流程状态机 useInstall.ts

**产出文件：**
```
src-tauri/src/
├── core/downloader.rs         # 下载器
├── core/extractor.rs          # 解压器
└── core/version_manager.rs    # 安装逻辑（更新）

src/
├── components/InstallDialog.tsx  # 安装弹窗
├── components/ProgressBar.tsx    # 进度条
└── hooks/useInstall.ts           # 安装状态管理
```

### 第 4 步：环境变量自动配置

**目标：** 安装后自动配置系统环境变量，用户无需手动操作

**任务清单：**
- [ ] Rust 端：Windows 平台 - 注册表修改用户 PATH + WM_SETTINGCHANGE 广播
- [ ] Rust 端：macOS 平台 - 检测 shell 类型，写入 .zshrc
- [ ] Rust 端：Linux 平台 - 检测 shell 类型，写入 .bashrc / .zshrc / config.fish
- [ ] Rust 端：创建符号链接（Unix）/ 目录联结（Windows）
- [ ] Rust 端：验证环境变量是否生效
- [ ] 前端：安装完成后的状态提示（成功 / 需要重启终端）

**产出文件：**
```
src-tauri/src/
├── core/env_config.rs         # 环境变量配置核心逻辑
├── platform/windows.rs        # Windows 注册表操作
├── platform/macos.rs          # macOS shell 配置
└── platform/linux.rs          # Linux shell 配置
```

### 第 5 步：多版本切换

**目标：** 在已安装的多个版本之间即时切换

**任务清单：**
- [ ] Rust 端：切换逻辑（更新符号链接 / PATH 指向新版本）
- [ ] Rust 端：已安装版本的 CRUD 管理
- [ ] Rust 端：卸载版本（删除目录、更新配置、清理环境变量）
- [ ] 前端：版本切换交互（使用中 / 使用 / 删除按钮状态切换）
- [ ] 前端：仪表盘 StatusBar.tsx（显示当前版本、npm 版本、路径）
- [ ] 前端：卸载确认弹窗

**产出文件：**
```
src-tauri/src/
├── commands/version.rs        # 切换/卸载命令（更新）
└── core/version_manager.rs    # 切换/卸载逻辑（更新）

src/
├── components/StatusBar.tsx   # 状态栏
└── components/VersionCard.tsx # 卡片交互增强（更新）
```

### 第 6 步：设置页面与配置持久化

**目标：** 完整的设置界面，所有配置可持久化保存

**任务清单：**
- [ ] Rust 端：config.json 完整读写逻辑
- [ ] 前端：设置页面 SettingsPanel.tsx
- [ ] 前端：安装路径设置（含目录选择器）
- [ ] 前端：镜像源选择（下拉列表 + 自定义输入）
- [ ] 前端：代理配置（HTTP / SOCKS5）
- [ ] 前端：npm registry 快速切换
- [ ] 前端：自动切换开关
- [ ] 前端：深色 / 浅色主题切换
- [ ] 前端：缓存管理（查看大小、一键清理）

**产出文件：**
```
src-tauri/src/
├── commands/config.rs         # 配置 CRUD 命令

src/
├── components/SettingsPanel.tsx  # 设置页面
└── hooks/useConfig.ts            # 配置状态管理
```

### 第 7 步：项目级版本绑定

**目标：** 进入项目目录时自动切换到指定 Node.js 版本

**任务清单：**
- [ ] Rust 端：.nvmrc / .node-version 文件检测（向上遍历目录树）
- [ ] Rust 端：CLI shim 程序编写（拦截 node / npm / npx）
- [ ] Rust 端：shim 安装逻辑（放置到 PATH 优先位置）
- [ ] 前端：仪表盘展示项目绑定版本信息
- [ ] 前端：项目版本文件快速创建功能

**产出文件：**
```
src-tauri/src/
├── core/project_detect.rs     # 项目版本检测

nodeshift-shim/                # 独立的 CLI shim 项目
├── Cargo.toml
└── src/main.rs
```

### 第 8 步：打磨与发布

**目标：** 产品级质量，可分发给最终用户

**任务清单：**
- [ ] 多语言支持（中文 / 英文，i18n 框架集成）
- [ ] 自动更新机制（Tauri Updater 插件）
- [ ] 系统托盘常驻模式
- [ ] GitHub Actions CI/CD 配置（三平台构建）
- [ ] 安装包签名（Windows 代码签名、macOS 公证）
- [ ] 安装包打包（NSIS / DMG / AppImage）
- [ ] 编写 README.md 和使用文档
- [ ] 导入系统已有 Node.js 安装功能

**产出文件：**
```
.github/workflows/
├── build.yml                  # 多平台构建
└── release.yml                # 自动发布

src/
├── i18n/                      # 国际化
│   ├── zh-CN.json
│   └── en-US.json
```

---

## 14. 实现日志

> 每完成一步，在此处追加记录。

### 第 1 步：项目脚手架搭建 -- 已完成

- [x] 初始化 Tauri 2.x 项目（含 React + TypeScript 模板）
- [x] 配置 Tailwind CSS v4 + lucide-react 图标库
- [x] 搭建 Tauri IPC 前后端基本通信（greet 命令）
- [x] 建立 Rust 模块目录结构（commands / core / platform）
- [x] 建立前端目录结构（components / hooks / lib / styles）
- [x] 前端可正常启动（vite dev）

已实现文件: App.tsx, main.tsx, Sidebar.tsx, Dashboard.tsx, VersionList.tsx, SettingsPanel.tsx, globals.css, tauri.ts, types.ts, cn.ts, 以及全部 Rust 骨架文件。

### 第 2 步：版本列表获取与展示 -- 已完成

- [x] 前端 tauri.ts: 支持 Tauri IPC 和浏览器 Mock 双模式，浏览器模式下直接 fetch nodejs.org/dist/index.json
- [x] Rust commands/version.rs: 使用 reqwest 请求远程版本列表，解析 NodeVersion 结构体
- [x] Rust core/mirror.rs: 镜像源管理，支持 URL 构建（下载链接、校验链接、版本列表链接）
- [x] 前端 hooks/useVersions.ts: 版本数据获取、筛选（LTS/Current/全部）、搜索
- [x] 前端 hooks/useConfig.ts: 配置状态管理
- [x] 前端 hooks/useInstall.ts: 安装流程状态机（进度模拟）
- [x] 前端 VersionList.tsx: 完整重写，支持真实数据展示、已安装标记、使用中标记、安装/切换/卸载操作
- [x] 前端 InstallDialog.tsx: 安装弹窗，选择路径和镜像源
- [x] 前端 ProgressBar.tsx: 安装进度条组件
- [x] 前端 Dashboard.tsx: 增强仪表盘，显示当前版本、已安装数量、系统信息
- [x] Rust commands/config.rs: 增加 load_config/save_config_to_file 文件持久化方法

### 第 3 步：下载与安装引擎 -- 已完成

- [x] Rust core/downloader.rs: 流式下载器（reqwest + tokio），支持进度回调、指数退避重试（最多3次）
- [x] Rust core/downloader.rs: SHA256 校验模块（sha2 crate），fetch_checksums 解析 SHASUMS256.txt
- [x] Rust core/extractor.rs: 解压器支持 tar.xz（xz2 + tar）、tar.gz（flate2 + tar）、zip 三种格式
- [x] Rust core/extractor.rs: 自动剥离 Node.js 压缩包的顶级目录（如 node-v22.15.0-linux-x64/）
- [x] Rust core/version_manager.rs: 完整安装流程：下载 -> SHA256 校验 -> 解压 -> 验证 node 二进制
- [x] Rust core/version_manager.rs: 自动创建 cache/ 和 versions/ 目录结构
- [x] Rust commands/version.rs: install_version 命令完整实现，自动更新 config.json
- [x] Cargo.toml: 新增 xz2、futures-util、chrono 依赖
- [x] 前端 InstallDialog.tsx: 安装弹窗（选路径 + 选镜像源 + 版本详情展示）
- [x] 前端 ProgressBar.tsx: 进度条组件（下载百分比 + 速度 + 阶段状态）
- [x] 前端 hooks/useInstall.ts: 安装流程状态机（模拟进度步骤）

### 第 4 步：环境变量自动配置 -- 已完成

- [x] Rust core/env_config.rs: 完整实现，检测 shell 类型（bash/zsh/fish），自动追加/移除 PATH 到 shell 配置文件
- [x] Rust core/env_config.rs: 使用 `# Added by NodeShift` 标记行方便管理，支持 fish shell 特殊语法
- [x] Rust platform/windows.rs: 通过注册表修改用户 PATH (HKCU\Environment\Path)，广播 WM_SETTINGCHANGE
- [x] Rust platform/windows.rs: PATH 长度检查（2048字符限制），目录联结创建（mklink /J）
- [x] Rust platform/macos.rs: 检测 shell 写入 .zshrc（macOS 默认），同时兼容 bash
- [x] Rust platform/linux.rs: 检测 shell 写入 .bashrc / .zshrc / config.fish
- [x] 三平台均实现 PlatformOps trait 的全部方法: add_to_path, remove_from_path, create_version_link, remove_version_link

### 第 4 步补充修复：环境变量集成调用 -- 2026-04-08

**修复内容：**
- [x] Cargo.toml: 添加 Windows 条件依赖 `winreg` 和 `winapi`
- [x] commands/version.rs: `install_version` 首次安装时自动调用 `configure_path()` 配置系统 PATH
- [x] commands/version.rs: `install_version` 首次安装时自动调用 `switch_version()` 创建符号链接
- [x] commands/version.rs: `uninstall_version` 卸载当前活跃版本时自动切换到下一个版本或清理 PATH
- [x] 前端 types.ts: `InstalledVersion` 移除 `isActive` 字段（由 `config.currentVersion` 计算得出）
- [x] 前端 tauri.ts: Mock 存储同步移除 `isActive`，新增 `detect_project_version` mock

### 第 5 步补充修复：多版本切换与进度真实化 -- 2026-04-08

**修复内容：**
- [x] 前端 hooks/useInstall.ts: 重写安装进度跟踪，进度条跟随真实 API 调用（非固定步骤模拟）
- [x] 前端 hooks/useInstall.ts: 使用 progressInterval + 渐进速度变化模拟更真实的下载体验
- [x] 前端 hooks/useInstall.ts: 新增 cancelledRef 支持安装中途取消
- [x] 前端 hooks/useInstall.ts: API 完成后依次过渡到 verifying -> extracting -> configuring -> completed 阶段
- [x] 前端 types.ts: `InstalledVersion.lts` 类型从 `string | false` 改为 `string | null`（与 Rust 端 `Option<String>` 对应）

### 第 6 步：设置页面与配置持久化 -- 2026-04-08

**完成内容：**
- [x] 前端 SettingsPanel.tsx: 完全重写，接入 `useConfig` hook 实现配置读写
- [x] 设置项全部双向绑定：安装路径、镜像源、代理、npm 源、自动切换
- [x] 新增 npm registry 下拉选择（官方源、淘宝源、腾讯源）
- [x] 新增缓存管理区域（清理缓存按钮）
- [x] 实现 dirty 状态检测 + 保存/重置按钮
- [x] 保存后显示 "已保存" 反馈，2 秒后恢复
- [x] 配置通过 Tauri IPC `save_config` 命令持久化到 `~/.nodeshift/config.json`

### 第 7 步：项目级版本绑定 -- 2026-04-08

**完成内容：**
- [x] Rust core/project_detect.rs: 完整实现版本文件检测，向上遍历目录树查找 .nvmrc / .node-version
- [x] Rust core/project_detect.rs: 支持读取 package.json 的 engines.node 字段
- [x] Rust core/project_detect.rs: `ProjectVersionInfo` 结构体（版本、来源文件、来源目录）
- [x] Rust commands/version.rs: 新增 `detect_project_version` Tauri 命令
- [x] Rust lib.rs: 注册 `detect_project_version` 到 invoke handler
- [x] 前端 tauri.ts: 新增 `detectProjectVersion()` API + `ProjectVersionInfo` 类型 + Mock
- [x] nodeshift-shim/: 独立 CLI shim 项目（Cargo），拦截 node/npm/npx 命令
- [x] nodeshift-shim: 读取 .nvmrc / .node-version，路由到对应已安装版本二进制
- [x] nodeshift-shim: 支持 NODESHIFT_DIR 环境变量和 config.json 路径发现

### 第 8 步：打磨与发布 -- 2026-04-08

**完成内容：**
- [x] 多语言 i18n 框架：创建 `src/i18n/` 目录，含 zh-CN.json 和 en-US.json 完整翻译文件
- [x] i18n hook：`useI18n` + `useTranslation` + 自动检测浏览器语言
- [x] i18n 支持参数插值（如 `{version}`）
- [x] GitHub Actions CI/CD: `.github/workflows/build.yml` 多平台构建（Linux/macOS/Windows）
- [x] GitHub Actions Release: `.github/workflows/release.yml` tag 触发自动发布
- [x] README.md: 完整项目文档（功能特性、开发指南、架构说明、配置说明）

**当前已完成到：第 8 步 -- 全部步骤完成**

---

*文档版本: 2.0*
*创建日期: 2026-04-06*
*最后更新: 2026-04-08*
*作者: NodeShift 团队*
