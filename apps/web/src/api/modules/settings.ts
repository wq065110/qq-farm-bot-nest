import { socket } from '../services/socket'

export function save(data: any): Promise<any> {
  return socket.post('/settings', data)
}

export function saveTheme(theme: string): Promise<any> {
  return socket.post('/settings/theme', { theme })
}

export function saveOfflineReminder(data: any): Promise<any> {
  return socket.post('/settings/offline-reminder', data)
}

export function onSettingsUpdate(handler: (data: any) => void): void {
  socket.on('settings:update', handler)
}
