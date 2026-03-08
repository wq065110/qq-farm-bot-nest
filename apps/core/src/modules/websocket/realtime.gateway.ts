import type { WsMessage } from '@qq-farm/shared'
import type { SocketWithMeta } from './ws-router'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { createEvent } from '@qq-farm/shared'
import { Server } from 'socket.io'
import { AccountManagerService } from '../../game/account-manager.service'
import { StoreService } from '../../store/store.service'
import { AccountService } from '../account/account.service'
import { registerAccountRoutes } from './handlers/account.handler'
import { registerAnalyticsRoutes } from './handlers/analytics.handler'
import { registerFarmRoutes } from './handlers/farm.handler'
import { registerFriendRoutes } from './handlers/friend.handler'
import { registerLogsRoutes } from './handlers/logs.handler'
import { registerPanelRoutes } from './handlers/panel.handler'
import { registerStrategyRoutes } from './handlers/strategy.handler'
import { registerShopRoutes } from './handlers/shop.handler'
import { registerTopicsRoutes } from './handlers/topics.handler'
import { registerWarehouseRoutes } from './handlers/warehouse.handler'
import { RealtimePushService } from './realtime-push.service'
import { WsRouter } from './ws-router'
import { WsTopicsService } from './ws-topics.service'

@WebSocketGateway({ cors: true })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private logger = new Logger(RealtimeGateway.name)

  constructor(
    private jwtService: JwtService,
    private manager: AccountManagerService,
    private store: StoreService,
    private accountService: AccountService,
    private pushService: RealtimePushService,
    private router: WsRouter,
    private topicsService: WsTopicsService
  ) {
    registerAccountRoutes(this.router, { accountService: this.accountService, manager: this.manager })
    registerFarmRoutes(this.router, { manager: this.manager })
    registerFriendRoutes(this.router, { manager: this.manager, store: this.store })
    registerStrategyRoutes(this.router, { store: this.store, manager: this.manager })
    registerPanelRoutes(this.router, { store: this.store, manager: this.manager })
    registerLogsRoutes(this.router, { manager: this.manager })
    registerAnalyticsRoutes(this.router, { manager: this.manager })
    registerWarehouseRoutes(this.router, { manager: this.manager })
    registerShopRoutes(this.router, { manager: this.manager })
    registerTopicsRoutes(this.router, this.topicsService)
  }

  afterInit(server: Server): void {
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token
      if (!token) {
        next(new Error('Authentication required'))
        return
      }
      try {
        this.jwtService.verify(token as string)
        next()
      } catch {
        next(new Error('Invalid token'))
      }
    })
    this.pushService.setServer(server)
    this.manager.setRealtimeCallbacks({
      onStatusEvent: (accountId, event, data) => {
        const route = `status.${event}`
        if (event === 'connection')
          this.pushService.emitToAccount(accountId, route, data)
        else
          this.pushService.emitToTopic(accountId, 'status', route, data)
      },
      onLog: (entry) => {
        const id = String(entry?.accountId ?? '').trim()
        if (id)
          this.pushService.emitToTopic(id, 'logs', 'log.new', entry)
      },
      onAccountsUpdate: data => this.pushService.broadcast('accounts.update', data),
      onLandsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'lands', 'lands.update', data),
      onBagUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'bag', 'bag.update', data),
      onDailyGiftsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'daily-gifts', 'dailyGifts.update', data),
      onFriendsUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'friends', 'friends.update', data),
      onStrategyUpdate: (accountId, data) => this.pushService.emitToTopic(accountId, 'strategy', 'strategy.update', data),
      onPanelUpdate: (data) => this.pushService.broadcast('panel.update', data)
    })
    this.logger.log('WebSocket server (Socket.IO) started')
  }

  handleConnection(client: SocketWithMeta): void {
    client.data.accountId = ''
    client.data.topics = new Set<string>()
    client.emit('message', createEvent('system.ready', { ok: true, ts: Date.now() }))
  }

  handleDisconnect(): void {}

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: SocketWithMeta,
    @MessageBody() payload: WsMessage
  ): Promise<void> {
    if (!payload || payload.type !== 'req' || !payload.route) {
      return
    }
    const id = payload.id ?? ''
    const route = payload.route
    const data = (payload.data ?? {}) as Record<string, unknown>
    const response = await this.router.dispatch(id, route, client, data)
    client.emit('message', response)
  }
}
