import { socket } from '../services/socket'

export function operate(opType: string): Promise<any> {
  return socket.request('farm.operate', { opType })
}
