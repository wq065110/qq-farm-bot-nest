import { message as antdMessage } from 'antdv-next'

const recentKeys = new Set<string>()

function show(type: 'success' | 'error' | 'warning' | 'info', content: string, duration?: number) {
  const dedup = `${type}:${content}`
  if (recentKeys.has(dedup))
    return
  recentKeys.add(dedup)
  setTimeout(() => recentKeys.delete(dedup), 2000)

  antdMessage[type](content, duration)
}

const message = {
  success: (msg: string, duration = 3) => show('success', msg, duration),
  error: (msg: string, duration = 5) => show('error', msg, duration),
  warning: (msg: string, duration = 4) => show('warning', msg, duration),
  info: (msg: string, duration = 3) => show('info', msg, duration)
}

export default message
