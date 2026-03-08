import { socket } from '../services/socket'

export function get(sortBy?: string): Promise<any[]> {
  return socket.get('/analytics', { sortBy })
}
