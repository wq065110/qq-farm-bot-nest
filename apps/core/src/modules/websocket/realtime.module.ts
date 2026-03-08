import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { AuthModule } from '../auth/auth.module'
import { RealtimePushService } from './realtime-push.service'
import { RealtimeGateway } from './realtime.gateway'

@Module({
  imports: [AuthModule, AccountModule],
  providers: [RealtimeGateway, RealtimePushService],
  exports: [RealtimePushService]
})
export class RealtimeModule {}
