import { socket } from '../services/socket'

export function getLands(gid: number): Promise<{ lands?: any[], summary?: any }> {
  return socket.get('/friend/lands', { gid })
}

export function operate(gid: number, opType: string): Promise<any> {
  return socket.post('/friend/operate', { gid, opType })
}

export function toggleBlacklist(gid: number): Promise<number[]> {
  return socket.post('/friend/blacklist/toggle', { gid })
}

export function onFriendsUpdate(handler: (data: any) => void): void {
  socket.on('friends:update', handler)
}
