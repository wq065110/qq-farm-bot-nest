import type { AccountManagerService } from '../../../game/account-manager.service'
import type { StoreService } from '../../../store/store.service'
import type { WsRouter } from '../ws-router'

export interface StrategyHandlerDeps {
  store: StoreService
  manager: AccountManagerService
}

export function registerStrategyRoutes(router: WsRouter, deps: StrategyHandlerDeps): void {
  const { store, manager } = deps

  router.register('strategy.save', (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const result = store.applyConfigSnapshot((data || {}) as Record<string, unknown>, accountId)
    manager.broadcastConfig(accountId)
    manager.notifyStrategyUpdate(accountId)
    return result
  })
}
