import { socket } from '../services/socket'

export function sell(itemId: number, count: number): Promise<any> {
  return socket.post('/warehouse/sell', { itemId, count })
}
