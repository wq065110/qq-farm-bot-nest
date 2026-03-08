import type { WsMessage } from '@qq-farm/shared'
import type { Socket } from 'socket.io-client'
import { createRequest } from '@qq-farm/shared'
import { io } from 'socket.io-client'
import { ref } from 'vue'

const REQUEST_TIMEOUT_MS = 30_000

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timer: ReturnType<typeof setTimeout>
}

interface QueuedRequest {
  route: string
  data: unknown
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}

type EventHandler = (data: unknown) => void

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class SocketClient {
  readonly connected = ref(false)
  readonly subscribedAccountId = ref('')
  readonly currentAccountId = ref('')
  readonly serverUptime = ref(0)
  readonly serverVersion = ref('')
  readonly uptimeReceivedAt = ref(0)

  private socket: Socket | null = null
  private listeners = new Map<string, Set<EventHandler>>()
  private token = ''
  private currentTopics: string[] = []
  private pendingRequests = new Map<string, PendingRequest>()
  private queue: QueuedRequest[] = []
  private intentionalClose = false

  connect(token: string, accountId: string): void {
    const id = String(accountId || '').trim()
    if (!token)
      return

    this.token = token
    this.currentAccountId.value = id
    this.intentionalClose = false

    if (this.socket) {
      this.cleanupSocket()
    }

    this.createSocket()
  }

  disconnect(): void {
    this.intentionalClose = true

    for (const item of this.queue.splice(0))
      item.reject(new Error('WebSocket 已断开'))
    for (const [, pr] of this.pendingRequests) {
      clearTimeout(pr.timer)
      pr.reject(new Error('WebSocket 已断开'))
    }
    this.pendingRequests.clear()

    this.cleanupSocket()
    this.resetState()
  }

  request<T = unknown>(route: string, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.intentionalClose) {
        reject(new Error('WebSocket 已断开'))
        return
      }
      if (!this.socket?.connected) {
        this.queue.push({
          route,
          data,
          resolve: resolve as (v: unknown) => void,
          reject
        })
        return
      }
      this.sendRequest(route, data, resolve as (v: unknown) => void, reject)
    })
  }

  async subscribe(accountId: string, topics?: string[]): Promise<unknown> {
    this.currentAccountId.value = String(accountId || '').trim()
    if (topics != null)
      this.currentTopics = Array.isArray(topics) ? topics : []
    if (!this.socket?.connected)
      return Promise.resolve(null)
    const data = await this.request<{ accountId?: string, uptime?: number, version?: string }>('topic.subscribe', {
      accountId: this.currentAccountId.value,
      topics: this.currentTopics
    })
    this.handleSubscribed(data)
    return data
  }

  unsubscribe(topics: string[]): Promise<unknown> {
    return this.request('topic.unsubscribe', { topics })
  }

  on(route: string, handler: EventHandler): void {
    let set = this.listeners.get(route)
    if (!set) {
      set = new Set()
      this.listeners.set(route, set)
    }
    set.add(handler)
  }

  off(route: string, handler: EventHandler): void {
    const set = this.listeners.get(route)
    if (!set)
      return
    set.delete(handler)
    if (set.size === 0)
      this.listeners.delete(route)
  }

  private sendRequest(
    route: string,
    data: unknown,
    resolve: (value: unknown) => void,
    reject: (reason: unknown) => void
  ): void {
    if (!this.socket?.connected) {
      reject(new Error('WebSocket 未连接'))
      return
    }
    const id = generateId()
    const timer = setTimeout(() => {
      if (this.pendingRequests.delete(id)) {
        reject(new Error('请求超时'))
      }
    }, REQUEST_TIMEOUT_MS)

    this.pendingRequests.set(id, { resolve, reject, timer })
    const msg = createRequest(route, data, id)
    this.socket.emit('message', msg)
  }

  private handleMessage(payload: WsMessage): void {
    if (!payload || typeof payload !== 'object')
      return

    if (payload.type === 'res') {
      const id = payload.id
      if (id) {
        const pr = this.pendingRequests.get(id)
        if (pr) {
          clearTimeout(pr.timer)
          this.pendingRequests.delete(id)
          const code = payload.code ?? 0
          if (code === 0)
            pr.resolve(payload.data)
          else
            pr.reject(new Error(payload.msg ?? '请求失败'))
        }
      }
      return
    }

    if (payload.type === 'event' && payload.route) {
      const set = this.listeners.get(payload.route)
      if (set) {
        for (const fn of set)
          fn(payload.data)
      }
    }
  }

  private flushQueue(): void {
    const items = this.queue.splice(0)
    for (const item of items)
      this.sendRequest(item.route, item.data, item.resolve, item.reject)
  }

  private createSocket(): void {
    this.socket = io({
      auth: { token: this.token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5
    })

    this.socket.on('message', (payload: WsMessage) => {
      this.handleMessage(payload)
    })

    this.socket.on('connect', () => {
      this.connected.value = true

      if (this.currentAccountId.value || this.currentTopics.length > 0)
        this.subscribe(this.currentAccountId.value, this.currentTopics).catch(() => {})

      this.flushQueue()
    })

    this.socket.on('disconnect', () => {
      this.connected.value = false
      this.subscribedAccountId.value = ''
      this.serverUptime.value = 0
      this.serverVersion.value = ''
      this.uptimeReceivedAt.value = 0

      for (const item of this.queue.splice(0))
        item.reject(new Error('WebSocket 连接断开'))
      for (const [, pr] of this.pendingRequests) {
        clearTimeout(pr.timer)
        pr.reject(new Error('WebSocket 连接断开'))
      }
      this.pendingRequests.clear()
    })

    this.socket.on('connect_error', (err: Error) => {
      this.connected.value = false
      if (this.intentionalClose)
        return
      for (const item of this.queue.splice(0))
        item.reject(err)
      for (const [, pr] of this.pendingRequests) {
        clearTimeout(pr.timer)
        pr.reject(err)
      }
      this.pendingRequests.clear()
    })
  }

  private handleSubscribed(data: unknown): void {
    if (!data || typeof data !== 'object' || !('accountId' in data))
      return
    const id = (data as { accountId?: string }).accountId === 'all' ? '' : String((data as { accountId?: string }).accountId ?? '').trim()
    this.subscribedAccountId.value = id
    const d = data as { uptime?: number, version?: string }
    if (typeof d.uptime === 'number') {
      this.serverUptime.value = d.uptime
      this.uptimeReceivedAt.value = Date.now()
    }
    if (d.version != null)
      this.serverVersion.value = String(d.version)
  }

  private cleanupSocket(): void {
    if (!this.socket)
      return
    this.socket.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
  }

  private resetState(): void {
    this.connected.value = false
    this.subscribedAccountId.value = ''
    this.currentAccountId.value = ''
    this.serverUptime.value = 0
    this.serverVersion.value = ''
    this.uptimeReceivedAt.value = 0
  }
}

export const socket = new SocketClient()
