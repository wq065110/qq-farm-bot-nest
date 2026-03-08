import { socket } from '../services/socket'

export function save(data: any): Promise<any> {
  return socket.request('settings.save', data)
}

export function saveTheme(theme: string): Promise<any> {
  return socket.request('settings.theme', { theme })
}

export function saveOfflineReminder(data: any): Promise<any> {
  return socket.request('settings.offlineReminder', data)
}

export function onSettingsUpdate(handler: (data: any) => void): void {
  socket.on('settings.update', handler)
}
