import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '@/game/account-manager.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class FarmHandler {
  constructor(
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('seeds.query')
  querySeeds(
    @WsAccount() accountId: string
  ): unknown {
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.getSeeds()
  }

  @WsRoute('bagSeeds.query')
  queryBagSeeds(
    @WsAccount() accountId: string
  ): unknown {
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.getBagSeeds()
  }

  @WsRoute('farm.execute')
  async operate(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.doFarmOp(data?.opType as string)
  }

  @WsRoute('farm.singleLandOp')
  async singleLandOp(
    @WsAccount() accountId: string,
    @WsBody() data: Record<string, unknown>
  ): Promise<unknown> {
    const runner = this.manager.getRunnerOrThrow(accountId)
    return runner.doSingleLandOp({
      action: String(data?.action ?? '').trim().toLowerCase(),
      landId: Number(data?.landId) || 0,
      seedId: Number(data?.seedId) || 0
    })
  }
}
