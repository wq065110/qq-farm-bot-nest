import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { AuthModule } from '../auth/auth.module'
import { RealtimePushService } from './realtime-push.service'
import { RealtimeGateway } from './realtime.gateway'
import { WsRouter } from './ws-router'
import { WsTopicsService } from './ws-topics.service'

@Module({
  imports: [AuthModule, AccountModule],
  providers: [WsRouter, WsTopicsService, RealtimePushService, RealtimeGateway],
  exports: [RealtimePushService]
})
export class RealtimeModule {}
