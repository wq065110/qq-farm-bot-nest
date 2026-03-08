import type { AccountManagerService } from '../../../game/account-manager.service'
import type { StoreService } from '../../../store/store.service'
import type { WsRouter } from '../ws-router'

export interface SettingsHandlerDeps {
  store: StoreService
  manager: AccountManagerService
}

export function registerSettingsRoutes(router: WsRouter, deps: SettingsHandlerDeps): void {
  const { store, manager } = deps

  router.register('settings.save', (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const result = store.applyConfigSnapshot((data || {}) as Record<string, unknown>, accountId)
    manager.broadcastConfig(accountId)
    manager.notifySettingsUpdate(accountId)
    return result
  })

  router.register('settings.theme', (_client, data) => {
    return store.setUITheme(data?.theme as string)
  })

  router.register('settings.offlineReminder', (_client, data) => {
    store.setOfflineReminder((data || {}) as Record<string, unknown>)
    return null
  })
}
