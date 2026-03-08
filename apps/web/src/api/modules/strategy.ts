import { socket } from '../services/socket'

export function save(data: Record<string, unknown>): Promise<unknown> {
  return socket.request('strategy.save', data)
}

export function onStrategyUpdate(handler: (data: unknown) => void): void {
  socket.on('strategy.update', handler)
}
