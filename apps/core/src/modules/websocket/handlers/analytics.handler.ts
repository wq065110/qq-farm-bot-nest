import type { AccountManagerService } from '../../../game/account-manager.service'
import type { WsRouter } from '../ws-router'
import { requireAccountId } from '../ws-guards'

export interface AnalyticsHandlerDeps {
  manager: AccountManagerService
}

export function registerAnalyticsRoutes(router: WsRouter, deps: AnalyticsHandlerDeps): void {
  const { manager } = deps

  router.register('analytics.query', (client, data) => {
    requireAccountId(client)
    const sortBy = String(data?.sortBy ?? data?.sort ?? '')
    return manager.getAnalytics(sortBy)
  })
}
