import type { AccountManagerService } from '../../../game/account-manager.service'
import type { StoreService } from '../../../store/store.service'
import type { WsRouter } from '../ws-router'
import { requireAccountId, requireNumber, requireString } from '../ws-guards'

export interface FriendHandlerDeps {
  manager: AccountManagerService
  store: StoreService
}

export function registerFriendRoutes(router: WsRouter, deps: FriendHandlerDeps): void {
  const { manager, store } = deps

  router.register('friend.lands', async (client, data) => {
    const accountId = requireAccountId(client)
    const gid = Number(data?.gid ?? data?.friendId)
    if (!gid)
      throw new Error('缺少好友 gid')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.getFriendLands(gid)
  })

  router.register('friend.operate', async (client, data) => {
    const accountId = requireAccountId(client)
    const gid = requireNumber(data as Record<string, unknown>, 'gid', '缺少 gid 或 opType')
    const opType = requireString(data as Record<string, unknown>, 'opType', '缺少 gid 或 opType')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.doFriendOp(gid, opType)
  })

  router.register('friend.blacklistToggle', (client, data) => {
    const accountId = requireAccountId(client)
    const gid = requireNumber(data as Record<string, unknown>, 'gid', '缺少 gid')
    const current = store.getFriendBlacklist(accountId)
    const next = current.includes(gid) ? current.filter(g => g !== gid) : [...current, gid]
    const saved = store.setFriendBlacklist(accountId, next)
    manager.broadcastConfig(accountId)
    manager.notifyStrategyUpdate(accountId)
    return saved
  })

  router.register('friend.interactRecords', async (client) => {
    const accountId = requireAccountId(client)
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.getInteractRecords()
  })
}
