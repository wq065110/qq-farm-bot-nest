import type { WsRouter } from '../ws-router'
import type { WsTopicsService } from '../ws-topics.service'

export function registerTopicsRoutes(router: WsRouter, topicsService: WsTopicsService): void {
  router.register('topic.sub', (client, data) =>
    topicsService.handleSubscribe(client, data as Record<string, unknown>))

  router.register('topic.unsub', (client, data) =>
    topicsService.handleUnsubscribe(client, data as Record<string, unknown>))
}
