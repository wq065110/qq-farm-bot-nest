import type { WsMessage } from '@qq-farm/shared'
import type { Socket } from 'socket.io'
import { createResponse } from '@qq-farm/shared'

export interface SocketWithMeta extends Socket {
  data: Socket['data'] & {
    accountId?: string
    topics?: Set<string>
  }
}

export type RequestHandler = (
  client: SocketWithMeta,
  data: Record<string, unknown>,
) => unknown | Promise<unknown>

export const WS_CODE_SUCCESS = 0
export const WS_CODE_BAD_REQUEST = 400
export const WS_CODE_UNAUTHORIZED = 401
export const WS_CODE_FORBIDDEN = 403
export const WS_CODE_NOT_FOUND = 404
export const WS_CODE_INTERNAL = 500

export class WsRouter {
  private handlers = new Map<string, RequestHandler>()

  register(route: string, handler: RequestHandler): void {
    this.handlers.set(route, handler)
  }

  has(route: string): boolean {
    return this.handlers.has(route)
  }

  async dispatch(
    id: string,
    route: string,
    client: SocketWithMeta,
    data: Record<string, unknown>
  ): Promise<WsMessage> {
    const handler = this.handlers.get(route)
    if (!handler)
      return createResponse(id, route, WS_CODE_NOT_FOUND, undefined, `Unknown route: ${route}`)
    try {
      const result = await handler(client, data ?? {})
      return createResponse(id, route, WS_CODE_SUCCESS, result ?? null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '操作失败'
      return createResponse(id, route, WS_CODE_INTERNAL, undefined, msg)
    }
  }
}
