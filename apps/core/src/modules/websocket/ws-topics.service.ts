import type { SocketWithMeta } from './ws-router'
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
  ): Promise<{ accountId: string }> {
    const incoming = String(data?.accountId ?? '').trim()
    const topics: string[] = Array.isArray(data?.topics) ? data.topics : []
    const eventsList = (Array.isArray(data?.events) ? data.events : []).filter((e: unknown) => typeof e === 'string') as string[]
    const resolved = incoming && incoming !== 'all' ? this.manager.resolveAccountId(incoming) : ''
    const topicsSet = new Set(topics.filter((t: unknown) => t && typeof t === 'string') as string[])
    const eventsSet = new Set(eventsList.filter((e: unknown) => e && typeof e === 'string') as string[])

    client.data.accountId = resolved
    const prevTopics = client.data.topics ?? new Set<string>()
    const prevEvents = client.data.events ?? new Set<string>()
    client.data.topics = new Set([...prevTopics, ...topicsSet])
    client.data.events = new Set([...prevEvents, ...eventsSet])

    if (!client.rooms.has(RealtimePushService.ROOM_ALL))
      client.join(RealtimePushService.ROOM_ALL)
    const broadcastOnlyEvents = new Set(['accounts.update', 'panel.update'])
    if (resolved) {
      for (const event of eventsSet) {
        if (!broadcastOnlyEvents.has(event))
          client.join(RealtimePushService.roomForEvent(resolved, event))
      }
    }

    const subscribeResult = { accountId: resolved || 'all' }

    const ev = eventsSet
    if (ev.has('accounts.update'))
      this.emitToClient(client, 'accounts.update', this.manager.getAccounts())

    if (resolved && ev.has('status.connection')) {
      const s = this.manager.getStatus(resolved)
      this.emitToClient(client, 'status.connection', {
        connected: s?.connection?.connected ?? false,
        accountName: s?.accountName ?? ''
      })
    }

    if (resolved && eventsSet.size > 0)
      this.pushTopicsInitialDataForEvents(client, eventsSet)

    return subscribeResult
  }

  handleUnsubscribe(client: SocketWithMeta, data: Record<string, unknown>): null {
    const topics: string[] = Array.isArray(data?.topics) ? data.topics : []
    const eventsList: string[] = (Array.isArray(data?.events) ? data.events : []).filter((e: unknown) => typeof e === 'string') as string[]
    const accountId = client.data.accountId ?? ''
    for (const event of eventsList) {
      if (accountId)
        client.leave(RealtimePushService.roomForEvent(accountId, event))
    }
    const currentTopics = client.data.topics ?? new Set<string>()
    const currentEvents = client.data.events ?? new Set<string>()
    for (const t of topics)
      currentTopics.delete(t)
    for (const e of eventsList)
      currentEvents.delete(e)
    return null
  }

  private emitToClient(client: SocketWithMeta, route: string, data: unknown): void {
    client.emit('message', createEvent(route, data))
  }

  private pushTopicsInitialDataForEvents(client: SocketWithMeta, events: Set<string>): void {
    const accountId = client.data.accountId ?? ''

    if (accountId && events.has('strategy.update')) {
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
    if (events.has('panel.update')) {
      this.emitToClient(client, 'panel.update', {
        ui: this.store.getUI(),
        offlineReminder: this.store.getOfflineReminder()
      })
    }

    const runner = this.manager.getRunner(accountId)
    if (!runner)
      return

    if (events.has('status.profile') || events.has('status.session') || events.has('status.operations') || events.has('status.schedule')) {
      const s = this.manager.getStatus(accountId)
      if (s) {
        if (events.has('status.profile') && s.status)
          this.emitToClient(client, 'status.profile', s.status)
        if (events.has('status.session')) {
          this.emitToClient(client, 'status.session', {
            bootAt: s.bootAt,
            sessionExpGained: s.sessionExpGained,
            sessionGoldGained: s.sessionGoldGained,
            sessionCouponGained: s.sessionCouponGained,
            lastExpGain: s.lastExpGain,
            lastGoldGain: s.lastGoldGain,
            levelProgress: s.levelProgress
          })
        }
        if (events.has('status.operations') && s.operations)
          this.emitToClient(client, 'status.operations', s.operations)
        if (events.has('status.schedule')) {
          this.emitToClient(client, 'status.schedule', {
            nextFarmRunAt: s.nextChecks?.nextFarmRunAt,
            nextFriendRunAt: s.nextChecks?.nextFriendRunAt,
            configRevision: s.configRevision
          })
        }
      }
    }

    const needLands = events.has('lands.update')
    const needBag = events.has('bag.update')
    const needDailyGifts = events.has('daily-gifts.update')
    const needFriends = events.has('friends.update')
    const needSeeds = events.has('seeds.update')
    Promise.all([
      needLands ? runner.getLands() : Promise.resolve(null),
      needBag ? runner.getBag() : Promise.resolve(null),
      needDailyGifts ? runner.getDailyGiftOverview() : Promise.resolve(null),
      needFriends ? runner.getFriends() : Promise.resolve(null),
      needSeeds ? runner.getSeeds() : Promise.resolve(null)
    ]).then(([lands, bag, dailyGifts, friends, seeds]) => {
      if (lands != null)
        this.emitToClient(client, 'lands.update', lands)
      if (bag != null)
        this.emitToClient(client, 'bag.update', bag)
      if (dailyGifts != null)
        this.emitToClient(client, 'daily-gifts.update', dailyGifts)
      if (friends != null)
        this.emitToClient(client, 'friends.update', friends)
      if (seeds != null)
        this.emitToClient(client, 'seeds.update', seeds)
    }).catch(err => this.logger.error('pushTopicsInitialDataForEvents failed:', err))
  }
}
