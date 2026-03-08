import { Global, Module } from '@nestjs/common'
import { AccountManagerService } from './account-manager.service'
import { GameConfigService } from './game-config.service'
import { GameLogService } from './game-log.service'
import { GamePushService } from './game-push.service'
import { QRLoginService } from './services/qrlogin.worker'

@Global()
@Module({
  providers: [GameConfigService, GameLogService, GamePushService, AccountManagerService, QRLoginService],
  exports: [GameConfigService, GameLogService, AccountManagerService, QRLoginService]
})
export class GameModule {}
