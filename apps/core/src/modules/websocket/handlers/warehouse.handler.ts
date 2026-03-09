import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '../../../game/account-manager.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class WarehouseHandler {
  constructor(
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('warehouse.sell')
  async sell(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const itemId = Number(data?.itemId ?? data?.id)
    const count = Number(data?.count ?? 1)
    if (!itemId || count < 1)
      throw new Error('缺少 itemId 或 count')
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.sellItem(itemId, count)
  }
}
