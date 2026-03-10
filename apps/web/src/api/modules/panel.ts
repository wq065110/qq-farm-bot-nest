import { socket } from '../services/socket'

export function saveTheme(theme: string): Promise<unknown> {
  return socket.request('panel.setTheme', { theme })
}

export function saveOfflineReminder(data: Record<string, unknown>): Promise<unknown> {
  return socket.request('panel.offlineReminder', data)
}
