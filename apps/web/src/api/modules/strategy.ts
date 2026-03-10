import { socket } from '../services/socket'

export function save(data: Record<string, unknown>): Promise<void> {
  return socket.request('strategy.update', data)
}

export function query(): Promise<Record<string, unknown>> {
  return socket.request('strategy.query')
}
