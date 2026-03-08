import type { SocketWithMeta } from './ws-router'
import process from 'node:process'
import { Injectable, Logger } from '@nestjs/common'
import { createEvent } from '@qq-farm/shared'
import { AccountManagerService } from '../../game/account-manager.service'
import { StoreService } from '../../store/store.service'
import { RealtimePushService } from './realtime-push.service'

@Injectable()
export class WsTopicsService {
  private logger = new Logger(WsTopicsService.name)

  constructor(
    private manager: AccountManagerService,
    private store: StoreService
  ) {}

  async handleSubscribe(
    client: SocketWithMeta,
    data: Record<string, unknown>
  ): Promise<{ accountId: string, uptime: number, version: string }> {
    const incoming = String(data?.accountId ?? '').trim()
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
      version: pkg.version as string
    }

    this.emitToClient(client, 'accounts.update', this.manager.getAccounts())

    if (resolved) {
      const s = this.manager.getStatus(resolved)
      if (s)
        this.emitToClient(client, 'status.connection', { connected: s.connection?.connected, accountName: s.accountName })
    }

    const contextChanged = prevAccountId !== resolved || topics.length > 0
    if (resolved && topics.length > 0 && contextChanged)
      this.pushTopicsInitialData(client)

    return subscribeResult
  }

  handleUnsubscribe(client: SocketWithMeta, data: Record<string, unknown>): null {
    const topics: string[] = Array.isArray(data?.topics) ? data.topics : []
    const accountId = client.data.accountId ?? ''
    for (const t of topics) {
      if (accountId)
        client.leave(RealtimePushService.roomForTopic(accountId, t))
    }
    if (topics.length > 0) {
      const current = client.data.topics ?? new Set<string>()
      for (const t of topics)
        current.delete(t)
    }
    return null
  }

  private emitToClient(client: SocketWithMeta, route: string, data: unknown): void {
    client.emit('message', createEvent(route, data))
  }

  private pushTopicsInitialData(client: SocketWithMeta): void {
    const accountId = client.data.accountId ?? ''
    const topics = client.data.topics ?? new Set<string>()

    if (accountId && topics.has('strategy')) {
      this.emitToClient(client, 'strategy.update', {
        intervals: this.store.getIntervals(accountId),
        plantingStrategy: this.store.getPlantingStrategy(accountId),
        preferredSeedId: this.store.getPreferredSeed(accountId),
        friendQuietHours: this.store.getFriendQuietHours(accountId),
        stealCropBlacklist: this.store.getStealCropBlacklist(accountId),
        friendBlacklist: this.store.getFriendBlacklist(accountId),
        automation: this.store.getAutomation(accountId)
      })
    }
    if (topics.has('panel')) {
      this.emitToClient(client, 'panel.update', {
        ui: this.store.getUI(),
        offlineReminder: this.store.getOfflineReminder()
      })
    }

    const runner = this.manager.getRunner(accountId)
    if (!runner)
      return

    if (topics.has('status')) {
      const s = this.manager.getStatus(accountId)
      if (s) {
        if (s.status)
          this.emitToClient(client, 'status.profile', s.status)
        this.emitToClient(client, 'status.session', {
          bootAt: s.bootAt,
          sessionExpGained: s.sessionExpGained,
          sessionGoldGained: s.sessionGoldGained,
          sessionCouponGained: s.sessionCouponGained,
          lastExpGain: s.lastExpGain,
          lastGoldGain: s.lastGoldGain,
          levelProgress: s.levelProgress
        })
        if (s.operations)
          this.emitToClient(client, 'status.operations', s.operations)
        this.emitToClient(client, 'status.schedule', {
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
        this.emitToClient(client, 'lands.update', lands)
      if (bag != null)
        this.emitToClient(client, 'bag.update', bag)
      if (dailyGifts != null)
        this.emitToClient(client, 'dailyGifts.update', dailyGifts)
      if (friends != null)
        this.emitToClient(client, 'friends.update', friends)
      if (seeds != null)
        this.emitToClient(client, 'seeds.update', seeds)
    }).catch(err => this.logger.error('pushTopicsInitialData failed:', err))
  }
}
