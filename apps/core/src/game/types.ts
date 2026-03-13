/** 游戏日志条目（appendLog 的参数和回调数据） */
export interface GameLogEntry {
  msg: string
  tag?: string
  meta?: Record<string, string>
  isWarn?: boolean
}

/** 持久化后的日志条目（含账号信息和时间戳） */
export interface PersistedLogEntry extends GameLogEntry {
  accountId: string
  accountName: string
  createdAt: number
  _searchText: string
}

/** 账号操作日志条目 */
export interface AccountLogEntry {
  action: string
  msg: string
  accountId: string
  accountName: string
  createdAt: number
  reason?: string
}

/** 连接状态事件数据 */
export interface ConnectionEventData {
  connected: boolean
  accountName: string
  wsError?: { code: number, message: string, at: number } | null
}

/** 用户资料事件数据 */
export interface ProfileEventData {
  name: string
  level: number
  gold: number
  exp: number
  coupon: number
  platform: string
  avatarUrl: string
  openId: string
}

/** 创建/更新账号的请求参数 */
export interface CreateAccountPayload {
  id?: string
  uin?: string
  qq?: string
  name?: string
  nick?: string
  platform?: string
  code?: string
  avatar?: string
  loginType?: string
  skipAutoStart?: boolean
}

/** 账号列表项（getAccounts 返回值的单项） */
export interface AccountListItem {
  id: string
  uin: string
  qq: string
  name: string
  nick: string
  platform: string
  avatar: string
  running: boolean
  connected: boolean
  wsError: { code: number, message: string, at: number } | null
  createdAt: number
  updatedAt: number
}

/** Link 侧返回的用户状态（connectAccount / getAccountStatus） */
export interface LinkUserState {
  gid?: number
  name?: string
  level?: number
  gold?: number
  exp?: number
  coupon?: number
  avatarUrl?: string
  openId?: string
  platform?: string
  [key: string]: unknown
}

/** Link 连接列表项（listConnections 返回值的单项） */
export interface LinkConnectionInfo {
  accountId: string
  connected?: boolean
  [key: string]: unknown
}

/** Link 账号状态（getAccountStatus 返回值） */
export interface LinkAccountMeta {
  connected: boolean
  userState?: LinkUserState
  [key: string]: unknown
}

/** 调度事件数据 */
export interface ScheduleEventData {
  farmRemainSec: number
  friendRemainSec: number
  configRevision: number
}

/** 会话事件数据 */
export interface SessionEventData {
  bootAt: number
  sessionExpGained: number
  sessionGoldGained: number
  sessionCouponGained: number
  lastExpGain: number
  lastGoldGain: number
  levelProgress: unknown
}

/** 操作统计事件数据 */
export interface OperationsEventData {
  [key: string]: number
}

/** 状态事件数据联合类型 */
export type StatusEventData = ConnectionEventData | ProfileEventData | SessionEventData | OperationsEventData | ScheduleEventData

/** Link 事件回调数据（来自 link 进程的事件通知，结构不固定） */
export interface LinkEventPayload {
  [key: string]: unknown
}
