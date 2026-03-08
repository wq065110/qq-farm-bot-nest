import api from '../services/request'
import { socket } from '../services/socket'

export function createQR(): Promise<any> {
  return api.post('/api/qr/create')
}

export function checkQR(code: string): Promise<any> {
  return api.post('/api/qr/check', { code })
}

export function start(id: string): Promise<any> {
  return socket.request('account.start', { id })
}

export function stop(id: string): Promise<any> {
  return socket.request('account.stop', { id })
}

export function create(data: any): Promise<any> {
  return socket.request('account.create', data)
}

export function remove(id: string): Promise<any> {
  return socket.request('account.delete', { id })
}

export function remark(uin: string | number, name: string): Promise<any> {
  return socket.request('account.remark', { uin, name })
}
