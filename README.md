# QQ 农场多账号挂机 + Web 面板

QQ / 微信农场自动化挂机工具，支持多账号管理、Web 控制面板、实时日志与数据分析。

采用三应用微服务架构：**Link**（游戏 WebSocket 长连接）、**Core**（业务逻辑 + Web API）、**Web**（前端面板），通过 TCP Socket 通信，Link 独立运行以保证连接不随 Core 重启而断开。

后端基于 NestJS + SQLite（Drizzle ORM）+ Socket.io + Protobuf，前端基于 Vue 3 + Ant Design Vue + Pinia + UnoCSS，使用 pnpm + Turborepo 管理 monorepo。

## 技术栈

**后端（Core + Link）**

[<img src="https://skillicons.dev/icons?i=nodejs" height="48" title="Node.js 20+" />](https://nodejs.org/)
[<img src="https://skillicons.dev/icons?i=nestjs" height="48" title="NestJS 11" />](https://nestjs.com/)
[<img src="https://skillicons.dev/icons?i=sqlite" height="48" title="SQLite + Drizzle ORM" />](https://www.sqlite.org/)
[<img src="https://skillicons.dev/icons?i=aiscript" height="48" title="Socket.io 4" />](https://socket.io/)

**前端（Web）**

[<img src="https://skillicons.dev/icons?i=vue" height="48" title="Vue 3" />](https://vuejs.org/)
[<img src="https://skillicons.dev/icons?i=vite" height="48" title="Vite 7" />](https://vitejs.dev/)
[<img src="https://skillicons.dev/icons?i=ts" height="48" title="TypeScript 5" />](https://www.typescriptlang.org/)
[<img src="https://cdn.simpleicons.org/pinia/FFD859" height="48" title="Pinia 3" />](https://pinia.vuejs.org/)
[<img src="https://skillicons.dev/icons?i=windicss" height="48" title="UnoCSS" />](https://unocss.dev/)
[<img src="https://cdn.simpleicons.org/antdesign/0170FE" height="48" title="Ant Design Vue" />](https://antdv.com/)

**部署**

[<img src="https://skillicons.dev/icons?i=docker" height="48" title="Docker Compose" />](https://docs.docker.com/compose/)
[<img src="https://skillicons.dev/icons?i=pnpm" height="48" title="pnpm 10" />](https://pnpm.io/)

---

## 功能特性

### 多账号管理

- 账号新增、编辑、删除、启动、停止
- 扫码登录（QQ）与手动输入 Code
- QQ / 微信双平台支持
- 游戏头像、昵称、UIN 自动同步
- 账号被踢下线自动删除
- 账号连续离线超时自动删除
- 账号离线推送通知（支持 Bark、自定义 Webhook 等）

### 自动化能力

**种植 & 农场**
- 自动收获、种植、浇水、除草、杀虫、铲除、土地升级
- 推送触发巡田：收到游戏推送时立即检查农场
- 多种种植策略：指定种子、按等级最高、按数据分析排序（经验/利润效率）、背包种子优先级（拖拽排序）

**施肥**
- 施肥范围可选（自家/好友/全部）
- 施肥策略：普通肥 / 有机肥 / 不施肥
- 多季补肥：自动为多季作物补施化肥
- 自动填充化肥、自动购买化肥（支持配置购买类型/上限）

**仓库 & 出售**
- 收获后自动出售果实
- 面板手动售卖：有价物品可选数量/MAX，成功提示含获得金币

**好友互动**
- 自动偷菜 / 帮忙 / 捣乱 / 黑名单（微信平台）
- 偷取作物黑名单：跳过指定作物
- 经验上限停帮：好友帮忙达经验上限后自动停止
- 静默时段：指定时间段内不执行好友操作

**每日任务 & 奖励**
- 自动做任务并领取奖励
- 自动领取邮箱奖励
- 自动领取商城免费礼包
- 自动领取分享奖励
- 自动领取 VIP 每日礼包
- 自动领取月卡奖励
- 自动领取开服红包

**巡查间隔**
- 可自定义农场/好友巡查的最小/最大间隔（秒）

### 连接架构

- **Link** 独立进程维持游戏 WebSocket 长连接
- **Core** 通过 TCP Socket 与 Link 通信，重启 Core 不断开游戏连接
- Link 自动重连，无需手动干预

### Web 面板

**页面导航**：概览 / 我的农场 / 好友列表 / 数据分析 / 我的仓库 / 种子商店 / 账号管理 / 策略设置 / 面板设置

- **概览**：经验进度与速率、升级预估时间、资产统计（金币/点券/本次收入）、物品概览（化肥/图鉴）、巡查倒计时、操作统计、实时日志流
- **我的农场**：土地状态可视化、农场操作、每日礼包面板、成长任务面板、背包物品展示
- **好友列表**：好友农场状态、互动操作面板、巡查倒计时实时展示
- **数据分析**：支持按经验效率 / 普通肥经验效率 / 净利润效率 / 普通肥净利润效率 / 等级要求排序、策略推荐面板
- **我的仓库**：物品列表、有价物品手动售卖（数量/MAX）、搜索
- **种子商店**：种子列表、按名称搜索、购买与数量选择
- **账号管理**：多账号增删改查、扫码登录
- **策略设置**：种植策略、施肥策略、自动化开关、每日任务开关、巡查间隔、好友静默时段（按账号独立配置）
- **面板设置**：管理密码修改、远程登陆密钥管理、运行时连接配置（游戏服务器/客户端版本/设备信息）、离线提醒配置

**其他特性**
- 实时日志，支持按账号、模块、事件、级别、关键词筛选
- 深色 / 浅色主题切换
- Socket.io 实时推送，数据即时更新

---

## 环境要求

- Node.js 20+，pnpm（推荐通过 `corepack enable` 启用）

## 安装与启动（源码方式）

### Windows

```powershell
# 1. 安装 Node.js 20+（https://nodejs.org/）并启用 pnpm
node -v
corepack enable
pnpm -v

# 2. 安装依赖并构建
cd D:\Projects\qq-farm-bot-nest
pnpm install
pnpm build

# 3. 先启动 Link（游戏连接进程），再启动 Core（业务 + Web）
pnpm dev:link   # 终端 1
pnpm dev:core   # 终端 2

# （可选）设置管理密码后启动
$env:ADMIN_PASSWORD="你的强密码"
pnpm dev:core
```

### Linux（Ubuntu/Debian）

```bash
# 1. 安装 Node.js 20+
sudo apt update && sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable

# 2. 安装依赖并构建
cd /path/to/qq-farm-bot-nest
pnpm install
pnpm build

# 3. 先启动 Link，再启动 Core
pnpm dev:link   # 终端 1
pnpm dev:core   # 终端 2

# （可选）设置管理密码后启动
ADMIN_PASSWORD='你的强密码' pnpm dev:core
```

> **注意**：Link 和 Core 需要分别在两个终端中运行。Link 维持游戏 WebSocket 长连接，Core 重启不会断开已建立的游戏连接。

启动后访问面板：

- 本机：`http://localhost:3000`
- 局域网：`http://<你的IP>:3000`

---

## Docker 部署

项目包含两个服务：**Link**（游戏连接进程）和 **Core**（业务引擎 + Web 面板），通过 Docker Compose 统一编排。

```bash
# 构建并后台启动（Link + Core）
docker compose up -d --build

# 查看日志
docker compose logs -f

# 仅查看某个服务日志
docker compose logs -f core
docker compose logs -f link

# 停止并移除容器
docker compose down
```

### 服务说明

| 服务 | 容器名 | 端口 | 说明 |
| ---- | ------ | ---- | ---- |
| `link` | link | 9800（内部） | 游戏 WebSocket 长连接进程，Core 通过 TCP 连接 |
| `core` | core | 3000（对外） | 业务逻辑 + Web API + 前端面板 |

Core 通过环境变量 `LINK_HOST` 和 `LINK_PORT` 连接 Link 服务，在 Docker Compose 网络中已自动配置。

### 数据持久化

`docker-compose.yml` 已将数据目录挂载：

| 宿主机路径 | 容器内路径       |
| ---------- | ---------------- |
| `./data`   | `/app/core/data` |

账号与配置数据保存在 `./data/` 下的 SQLite 数据库（`farm.db`）中。

### 设置管理密码

在 `docker-compose.yml` 的 `environment` 中配置：

```yaml
environment:
  ADMIN_PASSWORD: 你的强密码
```

修改后执行 `docker compose up -d` 重启生效。

---

## 常用脚本

| 命令                   | 说明                                         |
| ---------------------- | -------------------------------------------- |
| `pnpm build`           | 构建所有应用（web + core + link）             |
| `pnpm dev`             | 同时启动所有开发服务                          |
| `pnpm dev:core`        | 仅启动 Core（业务逻辑 + Web API）             |
| `pnpm dev:web`         | 仅启动 Web 前端开发服务器                     |
| `pnpm dev:link`        | 仅启动 Link（游戏 WebSocket 连接进程）        |
| `pnpm start`           | 生产模式启动 Core                             |
| `pnpm start:link`      | 生产模式启动 Link                             |
| `pnpm lint`            | 执行 ESLint 检查                              |

---

## 登录与安全

- 面板首次访问需要登录
- 默认管理密码：`admin`
- 使用 JWT 进行身份验证
- 支持远程登陆密钥（`X-Remote-Login-Key` 请求头校验）
- **建议部署后立即修改为强密码**

---

## 架构概览

```
┌──────────┐  TCP Socket  ┌──────────┐  HTTP / WS  ┌──────────┐
│   Link   │◄────────────►│   Core   │◄───────────►│   Web    │
│(游戏连接) │              │(业务引擎) │             │ (前端面板)│
└────┬─────┘              └──────────┘              └──────────┘
     │ WebSocket (Protobuf)
     ▼
  游戏服务器
```

- **Link**：独立 NestJS 进程，维持各账号的游戏 WebSocket 长连接，通过 Protobuf 编解码游戏协议
- **Core**：NestJS 主服务，包含业务逻辑（农场、好友、仓库、任务、每日奖励、邀请、统计等 Worker）、Web API、Socket.io 推送
- **Web**：Vue 3 SPA，通过 HTTP API 和 Socket.io 与 Core 交互

## 项目结构

```
qq-farm-bot-nest/
├── apps/
│   ├── link/              # 游戏连接进程（NestJS + WebSocket + Protobuf）
│   │   └── src/
│   │       ├── link/      # TCP Server、连接管理、Proto 加载、协议处理
│   │       └── assets/    # Protobuf 协议文件（.proto）、WASM 加密模块
│   ├── core/              # 业务后端（NestJS + SQLite + 机器人引擎）
│   │   └── src/
│   │       ├── modules/   # API 控制器与服务
│   │       │   ├── auth/        # JWT 认证
│   │       │   ├── account/     # 账号管理
│   │       │   ├── qr/          # 扫码登录
│   │       │   └── websocket/   # Socket.io 实时推送（路由、Handler、话题订阅）
│   │       ├── game/      # 游戏逻辑
│   │       │   ├── services/    # Worker 模块
│   │       │   │   ├── farm.worker.ts           # 农场巡查（种植/收获/浇水/除草/杀虫）
│   │       │   │   ├── friend.worker.ts         # 好友互动（偷菜/帮忙/捣乱）
│   │       │   │   ├── warehouse.worker.ts      # 仓库管理（自动出售）
│   │       │   │   ├── task.worker.ts           # 任务检查与领取
│   │       │   │   ├── daily-rewards.worker.ts  # 每日奖励（邮件/月卡/VIP/分享/礼包/化肥购买）
│   │       │   │   ├── invite.worker.ts         # 邀请
│   │       │   │   ├── push.worker.ts           # 推送通知
│   │       │   │   ├── stats.worker.ts          # 运行时统计
│   │       │   │   ├── analytics.worker.ts      # 数据分析
│   │       │   │   └── qrlogin.worker.ts        # 扫码登录流程
│   │       │   ├── account-runner.ts    # 单账号运行器
│   │       │   ├── account-manager.service.ts   # 多账号管理
│   │       │   ├── link-client.ts       # Link TCP 客户端
│   │       │   └── game-config.service.ts       # 游戏配置加载
│   │       ├── database/  # Drizzle ORM Schema
│   │       ├── store/     # 账号与配置存储（SQLite）
│   │       ├── config/    # 应用配置
│   │       └── common/    # 守卫、拦截器、装饰器、异常过滤器
│   └── web/               # 前端面板（Vue 3 + Vite + Ant Design Vue）
│       └── src/
│           ├── api/       # API 客户端（HTTP + Socket.io）
│           ├── components/# 公共组件
│           ├── composables/# 组合式函数（WebSocket、倒计时、刷新等）
│           ├── stores/    # Pinia 状态管理
│           ├── layouts/   # 布局、侧边栏、账号面板
│           ├── views/     # 页面视图
│           │   ├── dashboard/   # 概览（日志/经验/资产/巡查/操作统计）
│           │   ├── personal/    # 我的农场（土地/背包/礼包/成长任务）
│           │   ├── friends/     # 好友列表
│           │   ├── analytics/   # 数据分析
│           │   ├── warehouse/   # 我的仓库
│           │   ├── shop/        # 种子商店
│           │   ├── accounts/    # 账号管理
│           │   ├── strategy/    # 策略设置（种植/施肥/自动化/间隔）
│           │   ├── panel/       # 面板设置（密码/密钥/连接/通知）
│           │   └── login/       # 登录页
│           ├── router/    # 路由配置
│           ├── styles/    # 全局样式
│           └── utils/     # 工具函数
├── packages/
│   └── shared/            # Core + Link 共享常量与类型（@qq-farm/shared）
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 特别感谢

- 核心功能：[linguo2625469/qq-farm-bot](https://github.com/linguo2625469/qq-farm-bot)
- 部分功能：[QianChenJun/qq-farm-bot](https://github.com/QianChenJun/qq-farm-bot)
- 扫码登录：[lkeme/QRLib](https://github.com/lkeme/QRLib)
- 推送通知：[imaegoo/pushoo](https://github.com/imaegoo/pushoo)

## 免责声明

本项目仅供学习与研究用途。使用本工具可能违反游戏服务条款，由此产生的一切后果由使用者自行承担。
