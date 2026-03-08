import type { AccountManagerService } from '../../../game/account-manager.service'
import type { StoreService } from '../../../store/store.service'
import type { WsRouter } from '../ws-router'

export interface PanelHandlerDeps {
  store: StoreService
  manager: AccountManagerService
}

export function registerPanelRoutes(router: WsRouter, deps: PanelHandlerDeps): void {
  const { store, manager } = deps

  router.register('panel.theme', (_client, data) => {
    const result = store.setUITheme(data?.theme as string)
    manager.notifyPanelUpdate()
    return result
  })

  router.register('panel.offlineReminder', (_client, data) => {
    const result = store.setOfflineReminder((data || {}) as Record<string, unknown>)
    manager.notifyPanelUpdate()
    return result
  })
}
