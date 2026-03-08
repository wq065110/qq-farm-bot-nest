import type { AccountManagerService } from '../../../game/account-manager.service'
import type { WsRouter } from '../ws-router'

export interface FarmHandlerDeps {
  manager: AccountManagerService
}

export function registerFarmRoutes(router: WsRouter, deps: FarmHandlerDeps): void {
  const { manager } = deps

  router.register('farm.operate', async (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.doFarmOp(data?.opType as string)
  })
}
