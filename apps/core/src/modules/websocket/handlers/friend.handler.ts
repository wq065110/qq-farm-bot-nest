import type { AccountManagerService } from '../../../game/account-manager.service'
import type { StoreService } from '../../../store/store.service'
import type { WsRouter } from '../ws-router'

export interface FriendHandlerDeps {
  manager: AccountManagerService
  store: StoreService
}

export function registerFriendRoutes(router: WsRouter, deps: FriendHandlerDeps): void {
  const { manager, store } = deps

  router.register('friend.lands', async (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const gid = Number(data?.gid ?? data?.friendId)
    if (!gid)
      throw new Error('缺少好友 gid')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.getFriendLands(gid)
  })

  router.register('friend.operate', async (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const gid = Number(data?.gid)
    const opType = String(data?.opType || '')
    if (!gid || !opType)
      throw new Error('缺少 gid 或 opType')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.doFriendOp(gid, opType)
  })

  router.register('friend.blacklistToggle', (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const gid = Number(data?.gid)
    if (!gid)
      throw new Error('缺少 gid')
    const current = store.getFriendBlacklist(accountId)
    const next = current.includes(gid) ? current.filter(g => g !== gid) : [...current, gid]
    const saved = store.setFriendBlacklist(accountId, next)
    manager.broadcastConfig(accountId)
    manager.notifySettingsUpdate(accountId)
    return saved
  })
}
