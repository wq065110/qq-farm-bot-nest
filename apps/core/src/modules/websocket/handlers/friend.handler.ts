import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '../../../game/account-manager.service'
import { StoreService } from '../../../store/store.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'
import { requireNumber, requireString } from '../ws-guards'

@Injectable()
export class FriendHandler {
  constructor(
    private readonly manager: AccountManagerService,
    private readonly store: StoreService
  ) {}

  @WsRoute('friend.lands')
  async lands(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const gid = Number(data?.gid ?? data?.friendId)
    if (!gid)
      throw new Error('缺少好友 gid')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.getFriendLands(gid)
  }

  @WsRoute('friend.operate')
  async operate(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const gid = requireNumber(data, 'gid', '缺少 gid 或 opType')
    const opType = requireString(data, 'opType', '缺少 gid 或 opType')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.doFriendOp(gid, opType)
  }

  @WsRoute('friend.blacklistToggle')
  blacklistToggle(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): unknown {
    const gid = requireNumber(data, 'gid', '缺少 gid')
    const current = this.store.getFriendBlacklist(accountId)
    const next = current.includes(gid) ? current.filter(g => g !== gid) : [...current, gid]
    const saved = this.store.setFriendBlacklist(accountId, next)
    this.manager.broadcastConfig(accountId)
    this.manager.notifyStrategyUpdate(accountId)
    return saved
  }

  @WsRoute('friend.interactRecords')
  async interactRecords(
    @WsAccount() accountId: string
  ): Promise<unknown> {
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.getInteractRecords()
  }
}
