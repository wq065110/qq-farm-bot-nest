import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '@/game/account-manager.service'
import { StoreService } from '@/store/store.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class StrategyHandler {
  constructor(
    private readonly store: StoreService,
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('strategy.query')
  query(
    @WsAccount() accountId: string
  ): unknown {
    const cfg = this.store.getAccountConfig(accountId)
    return {
      intervals: cfg.intervals,
      plantingStrategy: cfg.plantingStrategy,
      preferredSeedId: cfg.preferredSeedId,
      bagSeedPriority: cfg.bagSeedPriority,
      friendQuietHours: cfg.friendQuietHours,
      stealCropBlacklist: cfg.stealCropBlacklist,
      friendBlacklist: cfg.friendBlacklist,
      automation: cfg.automation,
      fertilizer: cfg.fertilizer,
      fertilizerLandTypes: cfg.fertilizerLandTypes,
      fertilizerMultiSeason: cfg.fertilizerMultiSeason,
      fertilizerBuy: cfg.fertilizerBuy
    }
  }

  @WsRoute('strategy.update')
  save(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): unknown {
    const result = this.store.applyConfigSnapshot(data || {}, accountId)
    this.manager.broadcastConfig(accountId)
    this.manager.notifyStrategyUpdate(accountId)
    return result
  }
}
