import type { AccountManagerService } from '../../../game/account-manager.service'
import type { WsRouter } from '../ws-router'

export interface AnalyticsHandlerDeps {
  manager: AccountManagerService
}

export function registerAnalyticsRoutes(router: WsRouter, deps: AnalyticsHandlerDeps): void {
  const { manager } = deps

  router.register('analytics.query', (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const sortBy = String(data?.sortBy ?? data?.sort ?? '')
    return manager.getAnalytics(sortBy)
  })
}
