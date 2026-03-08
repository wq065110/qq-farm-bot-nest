import { Module } from '@nestjs/common'
import { ConnectionManagerService } from './connection-manager.service'
import { GameInvokeService } from './game-invoke.service'
import { ProtoLoaderService } from './proto-loader.service'
import { TcpServerService } from './tcp-server.service'

@Module({
  providers: [
    ProtoLoaderService,
    GameInvokeService,
    ConnectionManagerService,
    TcpServerService
  ]
})
export class LinkModule {}
