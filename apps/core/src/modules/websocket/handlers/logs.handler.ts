import type { AccountManagerService } from '../../../game/account-manager.service'
import type { WsRouter } from '../ws-router'
import { requireAccountId } from '../ws-guards'

export interface LogsHandlerDeps {
  manager: AccountManagerService
}

export function registerLogsRoutes(router: WsRouter, deps: LogsHandlerDeps): void {
  const { manager } = deps

  router.register('logs.query', (client, data) => {
    const accountId = requireAccountId(client)
    return manager.getLogs(accountId, {
      module: data?.module as string | undefined,
      event: data?.event as string | undefined,
      keyword: data?.keyword as string | undefined,
      isWarn: data?.isWarn === 'warn' ? true : data?.isWarn === 'info' ? false : undefined,
      limit: (data?.limit as number) || 50
    })
  })
}
