# Core 接口文档

## 概述

- **HTTP**：所有 REST 接口统一前缀 `/api`，认证相关接口统一在 `/api/auth/` 下。需鉴权的接口在请求头携带 `Authorization: Bearer <token>`。
- **WebSocket**：基于 Socket.IO，连接时通过 `handshake.auth.token` 携带 JWT 鉴权。客户端统一监听 `message` 事件收发包。
- **默认端口**：`3000`（可通过环境变量 `ADMIN_PORT` 修改）。

---

## HTTP 接口

### 认证（`/api/auth/*`）

| 方法 | 路径 | 鉴权 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/auth/login` | 公开 | `{ password: string }` | `{ access_token: string }` |
| GET | `/api/auth/validate` | 需要 | — | 校验结果 |
| POST | `/api/auth/change-password` | 需要 | `{ oldPassword: string, newPassword: string }` | `null` |
| POST | `/api/auth/logout` | 需要 | — | `null` |

### 扫码登录

| 方法 | 路径 | 鉴权 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/qr/create` | 公开 | — | 小程序登录码数据 |
| POST | `/api/qr/check` | 公开 | `{ code: string }` | 见下方说明 |

`/api/qr/check` 响应：

| status | 字段 | 说明 |
|--------|------|------|
| `OK` | `{ status, code, uin, avatar, nickname }` | 扫码成功，返回登录 code 与用户信息 |
| `Used` | `{ status: 'Used' }` | 二维码已被使用 |
| `Wait` | `{ status: 'Wait' }` | 等待扫码 |
| `Error` | `{ status: 'Error', error }` | 出错 |

---

## WebSocket 协议

### 消息格式

所有消息通过 Socket.IO 的 `message` 事件收发，数据为 JSON 对象。字段已精简至最短。

**请求（客户端 → 服务端）**

```json
{
  "v": 1,
  "id": "唯一请求 ID",
  "r": "路由名",
  "d": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `v` | number | 协议版本，固定 `1` |
| `id` | string | 请求 ID，用于匹配响应 |
| `r` | string | 路由名 |
| `d` | any | 请求数据（可选） |

**响应（服务端 → 客户端）**

```json
{
  "v": 1,
  "id": "对应请求的 ID",
  "c": 0,
  "d": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `v` | number | 协议版本 |
| `id` | string | 对应请求的 ID |
| `c` | number | 状态码，`0` 表示成功 |
| `d` | any | 响应数据；失败时为 `{ message: "错误信息" }` |

| code | 含义 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 路由不存在 |
| 500 | 服务端内部错误 |

**推送事件（服务端 → 客户端）**

```json
{
  "v": 1,
  "e": "事件路由名",
  "d": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `v` | number | 协议版本 |
| `e` | string | 事件路由名 |
| `d` | any | 推送数据 |

### 连接生命周期

1. 客户端连接时携带 `handshake.auth.token`（JWT），鉴权失败会断开。
2. 连接成功后服务端推送 `system.ready` 事件。
3. 客户端通过 `topics.sub` 订阅感兴趣的事件，订阅后会收到一次初始数据推送。
4. 后续变更通过服务端推送事件实时下发。

---

### 请求路由

#### 账号管理

| route | data | 说明 |
|-------|------|------|
| `accounts.start` | `{ id: string }` | 启动账号 |
| `accounts.stop` | `{ id: string }` | 停止账号 |
| `accounts.upsert` | `{ code, platform, nick?, ... }` | 创建或更新账号 |
| `accounts.delete` | `{ id: string }` | 删除账号 |
| `accounts.remark` | `{ id: string, remark?: string }` | 修改账号备注 |

#### 订阅管理

| route | data | 说明 |
|-------|------|------|
| `topics.sub` | `{ accountId?: string, topics?: string[], events?: string[] }` | 订阅事件，订阅后推送初始数据 |
| `topics.unsub` | `{ topics?: string[], events?: string[] }` | 取消订阅 |

`events` 可选值见下方「推送事件」一节。`accountId` 为空或 `"all"` 时仅订阅全局事件。

#### 农场操作

| route | data | 说明 |
|-------|------|------|
| `farm.execute` | `{ opType: string }` | 执行农场操作，需已选账号 |

`opType` 可选值：`all`（全部）、`clear`（除草/除虫/浇水）、`harvest`（收获）、`plant`（种植）、`upgrade`（升级土地）。

| route | data | 说明 |
|-------|------|------|
| `seeds.query` | — | 查询可用种子列表，需已选账号 |

#### 好友操作

| route | data | 说明 |
|-------|------|------|
| `friends.lands` | `{ gid: number }` | 查看好友农场详情 |
| `friends.execute` | `{ gid: number, opType: string }` | 对好友农场执行操作 |
| `friends.toggleBlacklist` | `{ gid: number }` | 切换好友黑名单状态 |

`friends.execute` 的 `opType` 可选值：`steal`（偷菜）、`water`（浇水）、`weed`（除草）、`bug`（除虫）、`bad`（捣乱）。

#### 策略配置

| route | data | 说明 |
|-------|------|------|
| `strategy.update` | 配置快照对象 | 保存策略配置，需已选账号 |
| `strategy.query` | — | 查询当前策略配置，需已选账号 |

配置快照包含：`automation`、`plantingStrategy`、`preferredSeedId`、`intervals`、`friendQuietHours`、`friendBlacklist`、`stealCropBlacklist`（均为可选字段，只传需修改的部分）。

#### 面板设置

| route | data | 说明 |
|-------|------|------|
| `panel.query` | — | 查询面板设置 |
| `panel.updateTheme` | `{ theme: string }` | 设置 UI 主题 |
| `panel.updateOfflineReminder` | `{ enabled?, channel?, ... }` | 设置离线提醒 |

#### 日志查询

| route | data | 说明 |
|-------|------|------|
| `logs.query` | `{ module?, event?, keyword?, isWarn?, limit? }` | 查询账号日志，需已选账号 |

| 字段 | 类型 | 说明 |
|------|------|------|
| `module` | string | 按模块过滤（如 `farm`、`friend`、`system`） |
| `event` | string | 按事件过滤 |
| `keyword` | string | 关键词搜索 |
| `isWarn` | `"warn"` \| `"info"` | 按日志级别过滤 |
| `limit` | number | 返回条数，默认 50 |

#### 数据分析

| route | data | 说明 |
|-------|------|------|
| `analytics.query` | `{ sortBy?: string }` | 查询分析数据，需已选账号 |

#### 仓库

| route | data | 说明 |
|-------|------|------|
| `warehouse.sell` | `{ itemId: number, count?: number }` | 出售物品，count 默认 1 |

#### 商店

| route | data | 说明 |
|-------|------|------|
| `shop.buy` | `{ goodsId: number, count?: number, price: number }` | 购买种子，count 默认 1 |

---

### 推送事件

客户端通过 `topics.sub` 的 `events` 数组订阅以下事件。订阅后会立即推送一次当前数据，后续有变更时实时推送。

#### 全局事件（broadcastOnly）

不绑定特定账号，全局广播。

| route | 推送内容 |
|-------|---------|
| `system.ready` | `{ uptime, version, ts }` — 连接就绪时自动推送，无需订阅 |
| `accounts.update` | `{ accounts, nextId }` — 账号列表变更 |

#### 账号状态事件

需在 `topics.sub` 中指定 `accountId`。

| route | 推送内容 |
|-------|---------|
| `accounts.connection` | `{ connected, accountName }` — 连接状态 |
| `accounts.profile` | 账号资料（等级、金币、经验等） |
| `accounts.session` | `{ bootAt, sessionExpGained, sessionGoldGained, sessionCouponGained, lastExpGain, lastGoldGain, levelProgress }` — 本次会话统计 |
| `accounts.operations` | 操作统计数据 |
| `accounts.schedule` | `{ nextFarmRunAt, nextFriendRunAt, configRevision }` — 调度信息 |

#### 数据事件

需在 `topics.sub` 中指定 `accountId`。

| route | 推送内容 |
|-------|---------|
| `lands.update` | 土地列表数据 |
| `bag.update` | 背包数据 |
| `dailyGifts.update` | 每日礼物概览 |
| `friends.update` | 好友列表 |
| `logs.append` | 单条日志条目 — 新日志产生时推送，需订阅 |
