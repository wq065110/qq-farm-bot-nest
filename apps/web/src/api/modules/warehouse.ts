import { socket } from '../services/socket'

export function sell(itemId: number, count: number): Promise<any> {
  return socket.request('warehouse.sell', { itemId, count })
}
