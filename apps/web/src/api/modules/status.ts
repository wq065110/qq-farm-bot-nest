import { socket } from '../services/socket'

export function onStatusUpdate(handler: (data: any) => void): void {
  socket.on('status.update', handler)
}

export function onStatusConnection(handler: (data: any) => void): void {
  socket.on('status.connection', handler)
}

export function onStatusProfile(handler: (data: any) => void): void {
  socket.on('status.profile', handler)
}

export function onStatusSession(handler: (data: any) => void): void {
  socket.on('status.session', handler)
}

export function onStatusOperations(handler: (data: any) => void): void {
  socket.on('status.operations', handler)
}

export function onStatusSchedule(handler: (data: any) => void): void {
  socket.on('status.schedule', handler)
}

export function onDailyGiftsUpdate(handler: (data: any) => void): void {
  socket.on('dailyGifts.update', handler)
}
