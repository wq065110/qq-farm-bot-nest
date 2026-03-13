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

export function singleLandOperate(payload: {
  action: string
  landId: number
  seedId?: number
}): Promise<any> {
  return socket.request('farm.singleLandOp', {
    action: payload.action,
    landId: payload.landId,
    seedId: payload.seedId ?? 0
  })
}
