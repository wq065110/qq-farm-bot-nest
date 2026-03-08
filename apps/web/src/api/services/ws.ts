import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { ref } from 'vue'

interface QueuedRequest {
  method: string
  url: string
  data: unknown
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}

type EventHandler = (data: unknown) => void

export class WSClient {
  readonly connected = ref(false)
  readonly subscribedAccountId = ref('')
  readonly currentAccountId = ref('')
  readonly serverUptime = ref(0)
  readonly serverVersion = ref('')
  readonly uptimeReceivedAt = ref(0)

  private socket: Socket | null = null
  private listeners = new Map<string, Set<EventHandler>>()
  private listenerWrappers = new Map<string, (data: unknown) => void>()
  private token = ''
  private currentTopics: string[] = []
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

    this.cleanupSocket()
    this.resetState()
  }

  async subscribe(accountId: string, topics?: string[]): Promise<unknown> {
    this.currentAccountId.value = String(accountId || '').trim()
    if (topics != null)
      this.currentTopics = Array.isArray(topics) ? topics : []
    if (!this.socket?.connected)
      return Promise.resolve(null)
    const data = await this.post('/subscribe', {
      accountId: this.currentAccountId.value,
      topics: this.currentTopics
    })
    this.handleSubscribed(data)
    return data
  }

  get<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.emitRequest<T>('GET', url, data)
  }

  post<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.emitRequest<T>('POST', url, data)
  }

  put<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.emitRequest<T>('PUT', url, data)
  }

  delete<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.emitRequest<T>('DELETE', url, data)
  }

  on(event: string, handler: EventHandler): void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(handler)
    if (!this.listenerWrappers.has(event)) {
      const wrapper = (data: unknown) => this.listeners.get(event)?.forEach(fn => fn(data))
      this.listenerWrappers.set(event, wrapper)
      this.socket?.on(event, wrapper)
    }
  }

  off(event: string, handler: EventHandler): void {
    const set = this.listeners.get(event)
    if (!set)
      return
    set.delete(handler)
    if (set.size === 0) {
      const wrapper = this.listenerWrappers.get(event)
      if (wrapper)
        this.socket?.off(event, wrapper)
      this.listenerWrappers.delete(event)
      this.listeners.delete(event)
    }
  }

  // ==================== Internal ====================

  private request<T = unknown>(method: string, url: string, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.intentionalClose) {
        reject(new Error('WebSocket 已断开'))
        return
      }
      if (!this.socket?.connected) {
        this.queue.push({ method, url, data, resolve: resolve as (v: unknown) => void, reject })
        return
      }
      this.emitRequestWithCallback(method, url, data, resolve as (v: unknown) => void, reject)
    })
  }

  private emitRequest<T = unknown>(method: string, url: string, data?: unknown): Promise<T> {
    return this.request<T>(method, url, data)
  }

  private emitRequestWithCallback(
    method: string,
    url: string,
    data: unknown,
    resolve: (value: unknown) => void,
    reject: (reason: unknown) => void
  ): void {
    if (!this.socket?.connected) {
      reject(new Error('WebSocket 未连接'))
      return
    }
    this.socket.emit('request', { method, url, data }, (response: { data?: unknown, error?: string }) => {
      if (response?.error)
        reject(new Error(response.error))
      else
        resolve(response?.data)
    })
  }

  private flushQueue(): void {
    const items = this.queue.splice(0)
    for (const item of items)
      this.emitRequestWithCallback(item.method, item.url, item.data, item.resolve, item.reject)
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

    this.socket.on('connect', () => {
      this.connected.value = true
      for (const [event, wrapper] of this.listenerWrappers)
        this.socket!.on(event, wrapper as (data: unknown) => void)

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
    })

    this.socket.on('connect_error', (err: Error) => {
      this.connected.value = false
      if (this.intentionalClose)
        return
      for (const item of this.queue.splice(0))
        item.reject(err)
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

export const ws = new WSClient()
