import { Injectable } from '@nestjs/common'
import { AccountManagerService } from '@/game/account-manager.service'
import { StoreService } from '@/store/store.service'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'

@Injectable()
export class PanelHandler {
  constructor(
    private readonly store: StoreService,
    private readonly manager: AccountManagerService
  ) {}

  @WsRoute('panel.theme')
  theme(@WsBody() data: Record<string, unknown>): unknown {
    const result = this.store.setUITheme(data?.theme as string)
    this.manager.notifyPanelUpdate()
    return result
  }

  @WsRoute('panel.offlineReminder')
  offlineReminder(@WsBody() data: Record<string, unknown>): unknown {
    const result = this.store.setOfflineReminder(data || {})
    this.manager.notifyPanelUpdate()
    return result
  }
}
