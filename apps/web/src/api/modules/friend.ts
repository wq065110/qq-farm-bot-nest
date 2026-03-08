import { socket } from '../services/socket'

export function getLands(gid: number): Promise<{ lands?: any[], summary?: any }> {
  return socket.request('friend.lands', { gid })
}

export function operate(gid: number, opType: string): Promise<any> {
  return socket.request('friend.operate', { gid, opType })
}

export function toggleBlacklist(gid: number): Promise<number[]> {
  return socket.request('friend.blacklistToggle', { gid })
}

export function onFriendsUpdate(handler: (data: any) => void): void {
  socket.on('friends.update', handler)
}
