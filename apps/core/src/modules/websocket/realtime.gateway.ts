import type { RequestHandler, SocketRequestPayload, SocketWithMeta } from './types'
import process from 'node:process'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { AccountManagerService } from '../../game/account-manager.service'
import { StoreService } from '../../store/store.service'
import { AccountService } from '../account/account.service'
import { RealtimePushService } from './realtime-push.service'

@WebSocketGateway({ cors: true })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private logger = new Logger('RealtimeGateway')
  private routes = new Map<string, RequestHandler>()

  constructor(
    private jwtService: JwtService,
    private manager: AccountManagerService,
    private store: StoreService,
    private accountService: AccountService,
    private pushService: RealtimePushService
  ) {
    this.registerRoutes()
  }

  afterInit(server: Server): void {
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token
      if (!token) {
        next(new Error('Authentication required'))
        return
      }
      try {
        this.jwtService.verify(token as string)
        next()
      } catch {
        next(new Error('Invalid token'))
      }
    })
    this.pushService.setServer(server)
    this.manager.setRealtimeCallbacks({
      onStatusEvent: (accountId, event, data) => {
        if (event === 'connection')
          this.pushService.emitToAccount(accountId, 'status:connection', data)
        else
          this.pushService.emitToTopic(accountId, 'status', `status:${event}`, data)
      },
      onLog: (entry) => {
        const id = String(entry?.accountId || '').trim()
        if (id)
          this.pushService.emitToTopic(id, 'logs', 'log:new', entry)
      },
      onAccountsUpdate: data => this.pushService.broadcast('accounts:update', data),
      onLandsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'lands', 'lands:update', data),
      onBagUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'bag', 'bag:update', data),
      onDailyGiftsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'daily-gifts', 'daily-gifts:update', data),
      onFriendsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'friends', 'friends:update', data),
      onSettingsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'settings', 'settings:update', data)
    })
    this.logger.log('WebSocket server (Socket.IO) started')
  }

  handleConnection(client: SocketWithMeta): void {
    client.data.accountId = ''
    client.data.topics = new Set<string>()
    client.emit('ready', { ok: true, ts: Date.now() })
  }

  handleDisconnect(): void {}

  @SubscribeMessage('request')
  async handleRequest(
    @ConnectedSocket() client: SocketWithMeta,
    @MessageBody() payload: SocketRequestPayload
  ): Promise<{ data?: unknown, error?: string }> {
    const key = `${payload.method} ${payload.url}`
    const handler = this.routes.get(key)
    if (!handler)
      return { error: `Unknown route: ${key}` }
    try {
      const result = await handler(client, (payload.data ?? {}) as Record<string, unknown>)
      return { data: result ?? null }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '操作失败'
      return { error: message }
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: SocketWithMeta,
    @MessageBody() data: { accountId?: string, topics?: string[] }
  ): Promise<{ accountId: string, uptime: number, version: string }> {
    const incoming = String(data?.accountId || '').trim()
    const topics: string[] = Array.isArray(data?.topics) ? data.topics : []
    const resolved = incoming && incoming !== 'all' ? this.manager.resolveAccountId(incoming) : ''
    const prevAccountId = client.data.accountId ?? ''

    client.data.accountId = resolved
    client.data.topics = new Set(topics.filter((t: unknown) => t && typeof t === 'string') as string[])

    const rooms = client.rooms
    for (const r of rooms) {
      if (r !== client.id && (r.startsWith('account:') || r === RealtimePushService.ROOM_ALL))
        client.leave(r)
    }
    client.join(RealtimePushService.ROOM_ALL)
    if (resolved) {
      client.join(RealtimePushService.roomForAccount(resolved))
      for (const t of client.data.topics ?? [])
        client.join(RealtimePushService.roomForTopic(resolved, t))
    }

    const pkg = require('../../../package.json')
    const subscribeResult = {
      accountId: resolved || 'all',
      uptime: process.uptime(),
      version: pkg.version
    }

    client.emit('accounts:update', this.manager.getAccounts())

    if (resolved) {
      const s = this.manager.getStatus(resolved)
      if (s)
        client.emit('status:connection', { connected: s.connection?.connected, accountName: s.accountName })
    }

    const contextChanged = prevAccountId !== resolved || topics.length > 0
    if (resolved && topics.length > 0 && contextChanged)
      this.pushTopicsInitialData(client)

    return subscribeResult
  }

  private registerRoutes(): void {
    this.route('POST', '/subscribe', (client, data) => this.handleSubscribe(client, data as { accountId?: string, topics?: string[] }))
    this.route('POST', '/account/start', (_client, data) => this.handleAccountStart(data))
    this.route('POST', '/account/stop', (_client, data) => this.handleAccountStop(data))
    this.route('POST', '/account', (_client, data) => this.handleAccountCreate(data))
    this.route('DELETE', '/account', (_client, data) => this.handleAccountDelete(data))
    this.route('POST', '/account/remark', (_client, data) => this.handleAccountRemark(data))
    this.route('POST', '/farm/operate', (client, data) => this.handleFarmOperate(client, data))
    this.route('GET', '/friend/lands', (client, data) => this.handleFriendLands(client, data))
    this.route('POST', '/friend/operate', (client, data) => this.handleFriendOperate(client, data))
    this.route('POST', '/friend/blacklist/toggle', (client, data) => this.handleFriendToggleBlacklist(client, data))
    this.route('POST', '/settings', (client, data) => this.handleSettingsSave(client, data))
    this.route('POST', '/settings/theme', (_client, data) => this.handleSettingsTheme(data))
    this.route('POST', '/settings/offline-reminder', (_client, data) => this.handleSettingsOfflineReminder(data))
    this.route('GET', '/logs', (client, data) => this.handleLogsQuery(client, data))
    this.route('GET', '/analytics', (client, data) => this.handleAnalyticsGet(client, data))
    this.route('POST', '/warehouse/sell', (client, data) => this.handleWarehouseSell(client, data))
    this.route('POST', '/shop/buy', (client, data) => this.handleShopBuy(client, data))
  }

  private route(method: string, url: string, handler: RequestHandler): void {
    this.routes.set(`${method} ${url}`, handler)
  }

  private async handleAccountStart(data: Record<string, unknown>): Promise<null> {
    const id = String(data?.id ?? '').trim()
    if (!id)
      throw new Error('缺少账号 id')
    await this.accountService.startAccount(id)
    this.manager.notifyAccountsUpdate()
    return null
  }

  private async handleAccountStop(data: Record<string, unknown>): Promise<null> {
    const id = String(data?.id ?? '').trim()
    if (!id)
      throw new Error('缺少账号 id')
    const resolved = this.manager.resolveAccountId(id) || id
    this.accountService.stopAccount(resolved)
    this.manager.notifyAccountsUpdate()
    return null
  }

  private async handleAccountCreate(data: Record<string, unknown>): Promise<unknown> {
    const result = await this.accountService.createOrUpdateAccount((data || {}) as Record<string, unknown>)
    this.manager.notifyAccountsUpdate()
    return result
  }

  private async handleAccountDelete(data: Record<string, unknown>): Promise<unknown> {
    const id = String(data?.id ?? '').trim()
    if (!id)
      throw new Error('缺少账号 id')
    const result = await this.accountService.deleteAccount(id)
    this.manager.notifyAccountsUpdate()
    return result
  }

  private async handleAccountRemark(data: Record<string, unknown>): Promise<unknown> {
    const result = await this.accountService.updateRemark((data || {}) as Record<string, unknown>)
    this.manager.notifyAccountsUpdate()
    return result
  }

  private async handleFarmOperate(client: SocketWithMeta, data: Record<string, unknown>): Promise<unknown> {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.doFarmOp(data?.opType as string)
  }

  private async handleFriendLands(client: SocketWithMeta, data: Record<string, unknown>): Promise<unknown> {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const gid = Number(data?.gid ?? data?.friendId)
    if (!gid)
      throw new Error('缺少好友 gid')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.getFriendLands(gid)
  }

  private async handleFriendOperate(client: SocketWithMeta, data: Record<string, unknown>): Promise<unknown> {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const gid = Number(data?.gid)
    const opType = String(data?.opType || '')
    if (!gid || !opType)
      throw new Error('缺少 gid 或 opType')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.doFriendOp(gid, opType)
  }

  private handleFriendToggleBlacklist(client: SocketWithMeta, data: Record<string, unknown>): unknown {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const gid = Number(data?.gid)
    if (!gid)
      throw new Error('缺少 gid')
    const current = this.store.getFriendBlacklist(accountId)
    const next = current.includes(gid) ? current.filter(g => g !== gid) : [...current, gid]
    const saved = this.store.setFriendBlacklist(accountId, next)
    this.manager.broadcastConfig(accountId)
    this.manager.notifySettingsUpdate(accountId)
    return saved
  }

  private handleSettingsSave(client: SocketWithMeta, data: Record<string, unknown>): unknown {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const result = this.store.applyConfigSnapshot((data || {}) as Record<string, unknown>, accountId)
    this.manager.broadcastConfig(accountId)
    this.manager.notifySettingsUpdate(accountId)
    return result
  }

  private handleSettingsTheme(data: Record<string, unknown>): unknown {
    return this.store.setUITheme(data?.theme as string)
  }

  private handleSettingsOfflineReminder(data: Record<string, unknown>): null {
    this.store.setOfflineReminder((data || {}) as Record<string, unknown>)
    return null
  }

  private handleLogsQuery(client: SocketWithMeta, data: Record<string, unknown>): unknown {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    return this.manager.getLogs(accountId, {
      module: data?.module as string | undefined,
      event: data?.event as string | undefined,
      keyword: data?.keyword as string | undefined,
      isWarn: data?.isWarn === 'warn' ? true : data?.isWarn === 'info' ? false : undefined,
      limit: (data?.limit as number) || 50
    })
  }

  private handleAnalyticsGet(client: SocketWithMeta, data: Record<string, unknown>): unknown {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const sortBy = String(data?.sortBy ?? data?.sort ?? '')
    return this.manager.getAnalytics(sortBy)
  }

  private async handleWarehouseSell(client: SocketWithMeta, data: Record<string, unknown>): Promise<unknown> {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const itemId = Number(data?.itemId ?? data?.id)
    const count = Number(data?.count ?? 1)
    if (!itemId || count < 1)
      throw new Error('缺少 itemId 或 count')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.sellItem(itemId, count)
  }

  private async handleShopBuy(client: SocketWithMeta, data: Record<string, unknown>): Promise<unknown> {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const goodsId = Number(data?.goodsId)
    const count = Number(data?.count ?? 1)
    const price = Number(data?.price)
    if (!goodsId || count < 1 || price == null || price < 0)
      throw new Error('缺少 goodsId、count 或 price')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.buySeed(goodsId, count, price)
  }

  private pushTopicsInitialData(client: SocketWithMeta): void {
    const accountId = client.data.accountId ?? ''
    const topics = client.data.topics ?? new Set<string>()

    if (accountId && topics.has('settings')) {
      const settingsData = {
        intervals: this.store.getIntervals(accountId),
        plantingStrategy: this.store.getPlantingStrategy(accountId),
        preferredSeedId: this.store.getPreferredSeed(accountId),
        friendQuietHours: this.store.getFriendQuietHours(accountId),
        stealCropBlacklist: this.store.getStealCropBlacklist(accountId),
        friendBlacklist: this.store.getFriendBlacklist(accountId),
        automation: this.store.getAutomation(accountId),
        ui: this.store.getUI(),
        offlineReminder: this.store.getOfflineReminder()
      }
      client.emit('settings:update', settingsData)
    }

    const runner = this.manager.getRunner(accountId)
    if (!runner)
      return

    if (topics.has('status')) {
      const s = this.manager.getStatus(accountId)
      if (s) {
        if (s.status)
          client.emit('status:profile', s.status)
        client.emit('status:session', {
          bootAt: s.bootAt,
          sessionExpGained: s.sessionExpGained,
          sessionGoldGained: s.sessionGoldGained,
          sessionCouponGained: s.sessionCouponGained,
          lastExpGain: s.lastExpGain,
          lastGoldGain: s.lastGoldGain,
          levelProgress: s.levelProgress
        })
        if (s.operations)
          client.emit('status:operations', s.operations)
        client.emit('status:schedule', {
          nextFarmRunAt: s.nextChecks?.nextFarmRunAt,
          nextFriendRunAt: s.nextChecks?.nextFriendRunAt,
          configRevision: s.configRevision
        })
      }
    }

    Promise.all([
      topics.has('lands') ? runner.getLands() : Promise.resolve(null),
      topics.has('bag') ? runner.getBag() : Promise.resolve(null),
      topics.has('daily-gifts') ? runner.getDailyGiftOverview() : Promise.resolve(null),
      topics.has('friends') ? runner.getFriends() : Promise.resolve(null),
      topics.has('seeds') ? runner.getSeeds() : Promise.resolve(null)
    ]).then(([lands, bag, dailyGifts, friends, seeds]) => {
      if (lands != null)
        client.emit('lands:update', lands)
      if (bag != null)
        client.emit('bag:update', bag)
      if (dailyGifts != null)
        client.emit('daily-gifts:update', dailyGifts)
      if (friends != null)
        client.emit('friends:update', friends)
      if (seeds != null)
        client.emit('seeds:update', seeds)
    }).catch(err => this.logger.error('pushTopicsInitialData failed:', err))
  }
}
