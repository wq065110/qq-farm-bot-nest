import type { AccountManagerService } from '../../../game/account-manager.service'
import type { WsRouter } from '../ws-router'

export interface ShopHandlerDeps {
  manager: AccountManagerService
}

export function registerShopRoutes(router: WsRouter, deps: ShopHandlerDeps): void {
  const { manager } = deps

  router.register('shop.buy', async (client, data) => {
    const accountId = client.data.accountId ?? ''
    if (!accountId)
      throw new Error('未选择账号')
    const goodsId = Number(data?.goodsId)
    const count = Number(data?.count ?? 1)
    const price = Number(data?.price)
    if (!goodsId || count < 1 || price == null || price < 0)
      throw new Error('缺少 goodsId、count 或 price')
    const runner = manager.getRunnerOrThrow(accountId)
    return runner.buySeed(goodsId, count, price)
  })
}
