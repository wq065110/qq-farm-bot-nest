import type { SocketWithMeta } from '../ws-router.service'
import { Injectable } from '@nestjs/common'
import { WsBody } from '../decorators/ws-body.decorator'
import { WsRoute } from '../decorators/ws-route.decorator'
import { WsTopicsService } from '../ws-topics.service'

@Injectable()
export class TopicsHandler {
  constructor(
    private readonly topicsService: WsTopicsService
  ) {}

  @WsRoute('topic.sub')
  subscribe(
    client: SocketWithMeta,
    @WsBody() data: Record<string, unknown>
  ): Promise<{ accountId: string }> {
    return this.topicsService.handleSubscribe(client, data)
  }

  @WsRoute('topic.unsub')
  unsubscribe(
    client: SocketWithMeta,
    @WsBody() data: Record<string, unknown>
  ): null {
    return this.topicsService.handleUnsubscribe(client, data)
  }
}
