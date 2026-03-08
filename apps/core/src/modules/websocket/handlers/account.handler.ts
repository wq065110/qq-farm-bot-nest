import type { AccountManagerService } from '../../../game/account-manager.service'
import type { AccountService } from '../../account/account.service'
import type { WsRouter } from '../ws-router'

export interface AccountHandlerDeps {
  accountService: AccountService
  manager: AccountManagerService
}

export function registerAccountRoutes(router: WsRouter, deps: AccountHandlerDeps): void {
  const { accountService, manager } = deps

  router.register('account.start', async (_client, data) => {
    const id = String(data?.id ?? '').trim()
    if (!id)
      throw new Error('缺少账号 id')
    await accountService.startAccount(id)
    manager.notifyAccountsUpdate()
    return null
  })

  router.register('account.stop', async (_client, data) => {
    const id = String(data?.id ?? '').trim()
    if (!id)
      throw new Error('缺少账号 id')
    const resolved = manager.resolveAccountId(id) || id
    accountService.stopAccount(resolved)
    manager.notifyAccountsUpdate()
    return null
  })

  router.register('account.create', async (_client, data) => {
    const result = await accountService.createOrUpdateAccount((data || {}) as Record<string, unknown>)
    manager.notifyAccountsUpdate()
    return result
  })

  router.register('account.delete', async (_client, data) => {
    const id = String(data?.id ?? '').trim()
    if (!id)
      throw new Error('缺少账号 id')
    const result = await accountService.deleteAccount(id)
    manager.notifyAccountsUpdate()
    return result
  })

  router.register('account.remark', async (_client, data) => {
    const result = await accountService.updateRemark((data || {}) as Record<string, unknown>)
    manager.notifyAccountsUpdate()
    return result
  })
}
