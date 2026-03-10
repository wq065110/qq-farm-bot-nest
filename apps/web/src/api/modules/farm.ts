import { socket } from '../services/socket'

export function operate(opType: string): Promise<any> {
  return socket.request('farm.execute', { opType })
}

export function querySeeds(): Promise<any[]> {
  return socket.request('seeds.query')
}

export function queryBagSeeds(): Promise<any[]> {
  return socket.request('bagSeeds.query')
}
