export const WS_PROTOCOL_VERSION = 1

export interface WsRequest<T = unknown> {
  v: number
  id?: string
  r: string
  d?: T
}

export interface WsResponse<T = unknown> {
  v: number
  id: string
  c: number
  d?: T
}

export interface WsEvent<T = unknown> {
  v: number
  e: string
  d?: T
}

export type WsMessage<T = unknown> = WsRequest<T> | WsResponse<T> | WsEvent<T>

export function createRequest<T = unknown>(
  route: string,
  data?: T,
  id?: string,
): WsRequest<T> {
  return {
    v: WS_PROTOCOL_VERSION,
    id: id ?? crypto.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    r: route,
    d: data,
  }
}

export function createResponse<T = unknown>(
  id: string,
  code: number,
  data?: T,
  msg?: string,
): WsResponse<T> {
  if (code !== 0 && msg) {
    return {
      v: WS_PROTOCOL_VERSION,
      id,
      c: code,
      d: { message: msg } as unknown as T,
    }
  }
  return {
    v: WS_PROTOCOL_VERSION,
    id,
    c: code,
    d: data,
  }
}

export function createEvent<T = unknown>(
  route: string,
  data?: T,
): WsEvent<T> {
  return {
    v: WS_PROTOCOL_VERSION,
    e: route,
    d: data,
  }
}
