import { socket } from '../services/socket'

export function save(data: Record<string, unknown>): Promise<void> {
  return socket.request('strategy.save', data) as Promise<void>
}
