import { onBeforeUnmount, onMounted } from 'vue'
import { socket } from '@/api'

type Handler = (data: unknown) => void
interface EventItem { name: string, handler: Handler, once?: boolean }

let consumerId = 0

export function useWs(initialTopic?: string) {
  const id = `ws-${++consumerId}`
  const topics = new Set<string>()
  const eventNames = new Set<string>()
  const eventItems: EventItem[] = []

  if (initialTopic)
    topics.add(initialTopic)

  function requireTopicForEvent(event: string): void {
    const prefix = event.split('.')[0]
    if (!prefix || !topics.has(prefix)) {
      throw new Error(`[useWs] event "${event}" requires .sub("${prefix}") to be declared first`)
    }
  }

  onMounted(() => {
    socket.registerTopics(id, topics, eventNames)
    eventItems.forEach((e) => {
      if (e.once)
        socket.once(e.name, e.handler)
      else
        socket.on(e.name, e.handler)
    })
  })

  onBeforeUnmount(() => {
    socket.unregisterTopics(id)
    eventItems.forEach(e => socket.off(e.name, e.handler))
  })

  const builder = {
    sub(name: string) {
      topics.add(name)
      return builder
    },
    on(event: string, handler: Handler) {
      requireTopicForEvent(event)
      eventNames.add(event)
      eventItems.push({ name: event, handler })
      return builder
    },
    once(event: string, handler: Handler) {
      requireTopicForEvent(event)
      eventNames.add(event)
      eventItems.push({ name: event, handler, once: true })
      return builder
    }
  }

  return builder
}
