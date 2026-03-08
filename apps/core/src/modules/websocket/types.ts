import type { Socket } from 'socket.io'

export type WsMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface SocketRequestPayload {
  method: WsMethod
  url: string
  data?: unknown
}

export interface SocketResponsePayload {
  data?: unknown
  error?: string
}

export interface SocketPushMessage {
  event: string
  data: unknown
}

export interface ClientMeta {
  accountId: string
  topics: Set<string>
}

export interface SocketWithMeta extends Socket {
  data: Socket['data'] & {
    accountId?: string
    topics?: Set<string>
  }
}

export type RequestHandler = (
  client: SocketWithMeta,
  data: Record<string, unknown>
) => unknown | Promise<unknown>
