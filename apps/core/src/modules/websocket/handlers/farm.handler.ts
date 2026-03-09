import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '../../../game/account-manager.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class FarmHandler {
  constructor(
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('farm.operate')
  async operate(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.doFarmOp(data?.opType as string)
  }
}
