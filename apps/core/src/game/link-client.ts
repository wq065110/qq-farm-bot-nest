import type { UserState } from '@qq-farm/shared'
import type { TcpEvent, TcpResponse } from '@qq-farm/shared/node'
import type { IGameTransport } from './interfaces/game-transport.interface'
import type { LinkAccountMeta, LinkConnectionInfo, LinkEventName, LinkUserState } from './types'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import net from 'node:net'
import { Logger } from '@nestjs/common'
import { createEmptyUserState } from '@qq-farm/shared'
import { encodeRequestFrame, FrameDecoder } from '@qq-farm/shared/node'

type TcpInbound = TcpResponse | TcpEvent

export interface LinkClientOptions {
  host?: string
  port?: number
  reconnectInterval?: number
}

/**
 * TCP 客户端：与 apps/link 进程通信。
 * 实现 IGameTransport 接口，与 link 进程通信完成游戏协议交互。
 */
export class LinkClient extends EventEmitter {
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS = 15_000
  private static readonly CONNECT_TIMEOUT_MS = 30_000

  private readonly logger = new Logger('LinkClient')
  private socket: net.Socket | null = null
  private readonly decoder = new FrameDecoder<TcpInbound>()
  private pending = new Map<string, PendingRequest>()
  private ridCounter = 0
  private _connected = false
  private _destroyed = false
  private readonly host: string
  private readonly port: number
  private readonly reconnectInterval: number

  constructor(options: LinkClientOptions = {}) {
    super()
    this.host = options.host || '127.0.0.1'
    this.port = options.port || 9800
    this.reconnectInterval = options.reconnectInterval || 3000
  }

  get connected(): boolean { return this._connected }

  /** 连接到 link 进程 */
  connect(): Promise<void> {
    if (this._destroyed)
      return Promise.reject(new Error('LinkClient 已销毁'))
    if (this._connected)
      return Promise.resolve()

    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
        this._connected = true
        this.logger.log(`已连接到 Link ${this.host}:${this.port}`)
        this.emit('connected')
        resolve()
      })

      this.socket.on('data', (chunk: Buffer) => {
        const messages = this.decoder.feed(chunk)
        for (const msg of messages)
          this.handleMessage(msg)
      })

      this.socket.on('close', () => {
        this._connected = false
        this.decoder.reset()
        this.rejectAllPending('连接断开')
        this.emit('disconnected')
        if (!this._destroyed) {
          setTimeout(() => this.connect().catch(() => {}), this.reconnectInterval)
        }
      })

      this.socket.on('error', (err) => {
        if (!this._connected)
          reject(err)
        this.logger.warn(`TCP 连接错误: ${err.message}`)
      })
    })
  }

  destroy() {
    this._destroyed = true
    this._connected = false
    this.rejectAllPending('客户端已销毁')
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.destroy()
      this.socket = null
    }
    this.removeAllListeners()
  }

  private handleMessage(msg: TcpInbound) {
    if (msg.type === 'response' && msg.rid) {
      const p = this.pending.get(msg.rid)
      if (p) {
        this.pending.delete(msg.rid)
        clearTimeout(p.timer)
        if (msg.ok)
          p.resolve(msg)
        else
          p.reject(new Error(msg.error || '未知错误'))
      }
      return
    }

    if (msg.type === 'event') {
      this.emit('link_event', {
        accountId: msg.accountId,
        event: msg.event as LinkEventName,
        data: msg.data
      })
    }
  }

  private sendRequest(data: Record<string, unknown>, timeout = LinkClient.DEFAULT_REQUEST_TIMEOUT_MS): Promise<TcpResponse> {
    return new Promise((resolve, reject) => {
      if (!this._connected || !this.socket) {
        reject(new Error('未连接到 Link'))
        return
      }
      const rid = String(++this.ridCounter)
      data.rid = rid
      const frame = encodeRequestFrame(data)

      const timer = setTimeout(() => {
        this.pending.delete(rid)
        reject(new Error(`Link 请求超时: ${data.type}`))
      }, timeout)

      this.pending.set(rid, { resolve, reject, timer })
      this.socket.write(frame)
    })
  }

  private rejectAllPending(reason: string) {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer)
      p.reject(new Error(reason))
    }
    this.pending.clear()
  }

  // ========== High-level API ==========

  async connectAccount(accountId: string, code: string, platform: string, clientConfig?: object): Promise<LinkUserState | undefined> {
    const res = await this.sendRequest({ type: 'connect', accountId, code, platform, clientConfig }, LinkClient.CONNECT_TIMEOUT_MS)
    return res.userState as LinkUserState | undefined
  }

  async rebindAccount(fromAccountId: string, toAccountId: string): Promise<void> {
    await this.sendRequest({ type: 'rebind', fromAccountId, toAccountId })
  }

  async disconnectAccount(accountId: string): Promise<void> {
    await this.sendRequest({ type: 'disconnect', accountId })
  }

  async getAccountStatus(accountId: string): Promise<LinkAccountMeta | undefined> {
    const res = await this.sendRequest({ type: 'status', accountId })
    return res.meta as LinkAccountMeta | undefined
  }

  async listConnections(): Promise<LinkConnectionInfo[]> {
    const res = await this.sendRequest({ type: 'list' })
    return (res.meta || []) as LinkConnectionInfo[]
  }

  /** 为指定账号调用游戏服务方法（供 AccountTransport 使用） */
  async invokeForAccount(accountId: string, serviceName: string, methodName: string, params: Record<string, unknown>, timeout = 10000): Promise<TcpResponse> {
    return this.sendRequest({
      type: 'invoke',
      accountId,
      service: serviceName,
      method: methodName,
      params: params ?? {}
    }, timeout)
  }

  // ========== IGameTransport per-account adapter ==========

  createTransport(accountId: string, getState?: () => UserState): IGameTransport {
    return new AccountTransport(accountId, this, getState)
  }
}

interface PendingRequest {
  resolve: (value: any) => void
  reject: (reason: any) => void
  timer: ReturnType<typeof setTimeout>
}

/**
 * 为单个账号提供 IGameTransport 接口，内部通过 LinkClient 发送 TCP 请求。
 * 继承 EventEmitter 以支持 Workers 的事件订阅（landsChanged / sell 等）。
 *
 * userState 通过 getter 引用 AccountRunner 的状态对象，无需手动同步。
 */
class AccountTransport extends EventEmitter implements IGameTransport {
  private readonly fallbackState: UserState = createEmptyUserState()

  constructor(
    private readonly accountId: string,
    private readonly linkClient: LinkClient,
    private readonly getState?: () => UserState
  ) {
    super()
  }

  get userState(): UserState {
    return this.getState?.() ?? this.fallbackState
  }

  async invoke<T = unknown>(serviceName: string, methodName: string, params: Record<string, unknown>, timeout = 10000): Promise<{ data: T, meta?: any }> {
    const res = await this.linkClient.invokeForAccount(this.accountId, serviceName, methodName, params, timeout)
    return { data: (res.data ?? null) as T, meta: res.meta }
  }

  isConnected(): boolean {
    return this.linkClient.connected
  }
}
