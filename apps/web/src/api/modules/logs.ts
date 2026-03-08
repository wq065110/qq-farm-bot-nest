import { socket } from '../services/socket'

export interface LogQueryOptions {
  module?: string
  event?: string
  keyword?: string
  isWarn?: string
  limit?: number
}

export function query(opts?: LogQueryOptions): Promise<any[]> {
  return socket.get('/logs', opts)
}

export function onLogNew(handler: (data: any) => void): void {
  socket.on('log:new', handler)
}
