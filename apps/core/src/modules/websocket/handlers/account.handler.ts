import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '@/game/account-manager.service'
import { AccountService } from '@/modules/account/account.service'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'
import { requireString } from '../ws-guards'

@Injectable()
export class AccountHandler {
  constructor(
    private readonly accountService: AccountService,
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('account.start')
  async start(@WsBody() data: Record<string, unknown>): Promise<null> {
    const id = requireString(data, 'id', '缺少账号 id')
    await this.accountService.startAccount(id)
    this.manager.notifyAccountsUpdate()
    return null
  }

  @WsRoute('account.stop')
  async stop(@WsBody() data: Record<string, unknown>): Promise<null> {
    const id = requireString(data, 'id', '缺少账号 id')
    const resolved = this.manager.resolveAccountId(id) || id
    this.accountService.stopAccount(resolved)
    this.manager.notifyAccountsUpdate()
    return null
  }

  @WsRoute('account.create')
  async create(@WsBody() data: Record<string, unknown>): Promise<unknown> {
    const result = await this.accountService.createOrUpdateAccount(data || {})
    this.manager.notifyAccountsUpdate()
    return result
  }

  @WsRoute('account.delete')
  async delete(@WsBody() data: Record<string, unknown>): Promise<unknown> {
    const id = requireString(data, 'id', '缺少账号 id')
    const result = await this.accountService.deleteAccount(id)
    this.manager.notifyAccountsUpdate()
    return result
  }

  @WsRoute('account.remark')
  async remark(@WsBody() data: Record<string, unknown>): Promise<unknown> {
    const result = await this.accountService.updateRemark(data || {})
    this.manager.notifyAccountsUpdate()
    return result
  }
}
