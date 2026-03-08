import api from '../services/request'
import { socket } from '../services/socket'

export function createQR(): Promise<any> {
  return api.post('/api/qr/create')
}

export function checkQR(code: string): Promise<any> {
  return api.post('/api/qr/check', { code })
}

export function start(id: string): Promise<any> {
  return socket.post('/account/start', { id })
}

export function stop(id: string): Promise<any> {
  return socket.post('/account/stop', { id })
}

export function create(data: any): Promise<any> {
  return socket.post('/account', data)
}

export function remove(id: string): Promise<any> {
  return socket.delete('/account', { id })
}

export function remark(uin: string | number, name: string): Promise<any> {
  return socket.post('/account/remark', { uin, name })
}

export function onAccountsUpdate(handler: (data: any) => void): void {
  socket.on('accounts:update', handler)
}
