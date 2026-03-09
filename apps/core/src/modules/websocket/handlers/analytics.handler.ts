import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '@/game/account-manager.service'
import { WsAccount } from '../decorators/ws-account.decorator'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class AnalyticsHandler {
  constructor(
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('analytics.query')
  query(
    @WsAccount() _accountId: string,
    @WsBody() data: Record<string, unknown>
  ): unknown {
    const sortBy = String(data?.sortBy ?? data?.sort ?? '')
    return this.manager.getAnalytics(sortBy)
  }
}
