import type { AccountManagerService } from '../../../game/account-manager.service'
import type { WsRouter } from '../ws-router'
import { requireAccountId } from '../ws-guards'

export interface WarehouseHandlerDeps {
  manager: AccountManagerService
}

export function registerWarehouseRoutes(router: WsRouter, deps: WarehouseHandlerDeps): void {
  const { manager } = deps

  router.register('warehouse.sell', async (client, data) => {
    const accountId = requireAccountId(client)
    const itemId = Number(data?.itemId ?? data?.id)
    const count = Number(data?.count ?? 1)
    if (!itemId || count < 1)
      throw new Error('缺少 itemId 或 count')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.sellItem(itemId, count)
  })
}
