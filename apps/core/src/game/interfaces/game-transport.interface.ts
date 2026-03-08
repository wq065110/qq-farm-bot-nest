export interface UserState {
  gid: number
  name: string
  level: number
  gold: number
  exp: number
  coupon: number
  avatarUrl: string
  openId: string
}

/**
 * Workers 依赖的传输层抽象接口。
 * LinkClient 的 AccountTransport 实现此接口，通过 TCP 与 link 进程通信。
 * 仅暴露语义 invoke，proto 编解码由 link 负责。
 */
export interface IGameTransport {
  /** 当前用户状态（只读引用） */
  readonly userState: UserState

  /** 语义调用：由 link 负责 proto 编解码，仅传 service/method/params，返回解码后的 data */
  invoke: <T = unknown>(
    serviceName: string,
    methodName: string,
    params: Record<string, unknown>,
    timeout?: number
  ) => Promise<{ data: T, meta?: any }>

  /** 当前是否已连接 */
  isConnected: () => boolean

  /** 注册事件监听 */
  on: (event: string, listener: (...args: any[]) => void) => any
  /** 移除事件监听 */
  removeListener: (event: string, listener: (...args: any[]) => void) => any
  /** 触发事件 */
  emit: (event: string, ...args: any[]) => boolean
}
