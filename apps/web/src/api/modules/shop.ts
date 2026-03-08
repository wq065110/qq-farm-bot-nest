import { socket } from '../services/socket'

export function buy(goodsId: number, count: number, price: number): Promise<any> {
  return socket.request('shop.buy', { goodsId, count, price })
}
