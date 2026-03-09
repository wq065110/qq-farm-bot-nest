import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '@/game/account-manager.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class ShopHandler {
  constructor(
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('shop.buy')
  async buy(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const goodsId = Number(data?.goodsId)
    const count = Number(data?.count ?? 1)
    const price = Number(data?.price)
    if (!goodsId || count < 1 || price == null || price < 0)
      throw new Error('缺少 goodsId、count 或 price')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.buySeed(goodsId, count, price)
  }
}
