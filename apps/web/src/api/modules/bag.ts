import { socket } from '../services/socket'

export function onBagUpdate(handler: (data: any) => void): void {
  socket.on('bag.update', handler)
}
