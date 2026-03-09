export interface InteractRecord {
  key: string
  serverTimeSec?: number
  serverTimeMs: number
  actionType: number
  actionLabel: string
  actionDetail?: string
  visitorGid: number
  nick: string
  avatarUrl: string
  cropId?: number
  cropName?: string
  cropCount?: number
  times?: number
  level?: number
  landId?: number
}

export const OP_BUTTONS = [
  { type: 'steal', label: '偷取', icon: 'i-streamline-emojis-detective-1' },
  { type: 'water', label: '浇水', icon: 'i-streamline-emojis-droplet' },
  { type: 'weed', label: '除草', icon: 'i-streamline-emojis-herb' },
  { type: 'bug', label: '除虫', icon: 'i-streamline-emojis-bug' },
  { type: 'bad', label: '捣乱', icon: 'i-streamline-emojis-smiling-face-with-horns' }
]

export type InteractFilterKey = 'all' | 'steal' | 'help' | 'bad'

export interface InteractFilterOption {
  key: InteractFilterKey
  label: string
  icon: string
}

export const INTERACT_FILTER_OPTIONS: InteractFilterOption[] = [
  { key: 'all', label: '全部', icon: 'i-streamline-emojis-file-folder' },
  { key: 'steal', label: '偷菜', icon: 'i-streamline-emojis-detective-1' },
  { key: 'help', label: '帮忙', icon: 'i-streamline-emojis-clapping-hands-1' },
  { key: 'bad', label: '捣乱', icon: 'i-streamline-emojis-smiling-face-with-horns' }
]

export interface InteractActionMeta {
  color: 'blue' | 'green' | 'red' | 'default'
  icon: string
  bgClass: string
}

export const INTERACT_ACTION_META: Record<number, InteractActionMeta> = {
  1: { color: 'blue', icon: 'i-streamline-emojis-detective-1', bgClass: 'bg-blue-50 text-blue-500' },
  2: { color: 'green', icon: 'i-streamline-emojis-clapping-hands-1', bgClass: 'bg-green-50 text-green-500' },
  3: { color: 'red', icon: 'i-streamline-emojis-smiling-face-with-horns', bgClass: 'bg-red-50 text-red-500' }
}

export const VISIBLE_INTERACT_RECORDS_LIMIT = 30

export const INTERACT_FILTER_TO_ACTION_TYPE: Record<InteractFilterKey, number | 0> = {
  all: 0,
  steal: 1,
  help: 2,
  bad: 3
}
