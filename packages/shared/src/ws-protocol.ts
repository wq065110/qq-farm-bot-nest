export const WS_PROTOCOL_VERSION = 1

export interface WsMessage<T = unknown> {
  v: number
  id?: string
  type: 'req' | 'res' | 'event'
  route: string
  code?: number
  msg?: string
  data?: T
  ts?: number
}

export function createRequest<T = unknown>(
  route: string,
  data?: T,
  id?: string,
): WsMessage<T> {
  return {
    v: WS_PROTOCOL_VERSION,
    id: id ?? crypto.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'req',
    route,
    data,
  }
}

export function createResponse<T = unknown>(
  id: string,
  route: string,
  code: number,
  data?: T,
  msg?: string,
): WsMessage<T> {
  return {
    v: WS_PROTOCOL_VERSION,
    id,
    type: 'res',
    route,
    code,
    msg,
    data,
    ts: Math.floor(Date.now() / 1000),
  }
}

export function createEvent<T = unknown>(
  route: string,
  data?: T,
): WsMessage<T> {
  return {
    v: WS_PROTOCOL_VERSION,
    type: 'event',
    route,
    data,
    ts: Math.floor(Date.now() / 1000),
  }
}
