import { socket } from '../services/socket'

export function operate(opType: string): Promise<any> {
  return socket.request('farm.operate', { opType })
}

export function onLandsUpdate(handler: (data: any) => void): void {
  socket.on('lands.update', handler)
}

export function onSeedsUpdate(handler: (data: any) => void): void {
  socket.on('seeds.update', handler)
}
