import type { Server } from 'socket.io'
import { Injectable } from '@nestjs/common'
import { createEvent } from '@qq-farm/shared'

const ROOM_ALL = 'all'

function roomAccount(accountId: string): string {
  return `account:${accountId}`
}

function roomTopic(accountId: string, topic: string): string {
  return `account:${accountId}:${topic}`
}

@Injectable()
export class RealtimePushService {
  private server: Server | null = null

  setServer(server: Server): void {
    this.server = server
  }

  broadcast(route: string, data: unknown): void {
    if (!this.server)
      return
    this.server.to(ROOM_ALL).emit('message', createEvent(route, data))
  }

  emitToAccount(accountId: string, route: string, data: unknown): void {
    const id = String(accountId || '').trim()
    if (!id || !this.server)
      return
    const room = roomAccount(id)
    this.server.to(room).emit('message', createEvent(route, data))
  }

  emitToTopic(accountId: string, topic: string, route: string, data: unknown): void {
    const id = String(accountId || '').trim()
    if (!id || !topic || !this.server)
      return
    const room = roomTopic(id, topic)
    this.server.to(room).emit('message', createEvent(route, data))
  }

  static roomForAccount(accountId: string): string {
    return `account:${accountId}`
  }

  static roomForTopic(accountId: string, topic: string): string {
    return `account:${accountId}:${topic}`
  }

  static readonly ROOM_ALL = ROOM_ALL
}
