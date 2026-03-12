import { socket } from '../services/socket'

export function saveTheme(theme: string): Promise<unknown> {
  return socket.request('panel.updateTheme', { theme })
}

export function saveOfflineReminder(data: Record<string, unknown>): Promise<unknown> {
  return socket.request('panel.updateOfflineReminder', data)
}

export function saveRemoteLoginKey(key: string): Promise<unknown> {
  return socket.request('panel.updateRemoteLoginKey', { key })
}

export function query(): Promise<Record<string, unknown>> {
  return socket.request('panel.query')
}
