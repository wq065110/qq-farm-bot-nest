export type FarmOpType = 'harvest' | 'clear' | 'plant' | 'upgrade' | 'all'

export const FARM_OPERATIONS: Array<{ type: FarmOpType, label: string, icon: string }> = [
  { type: 'harvest', label: '收获', icon: 'i-streamline-emojis-cooked-rice' },
  { type: 'clear', label: '除草', icon: 'i-streamline-emojis-herb' },
  { type: 'plant', label: '种植', icon: 'i-streamline-emojis-seedling' },
  { type: 'upgrade', label: '升级', icon: 'i-streamline-emojis-construction' },
  { type: 'all', label: '全收', icon: 'i-streamline-emojis-sparkles' }
]

export const FARM_OP_CONFIRM_MESSAGES: Record<FarmOpType, string> = {
  harvest: '确定要收获所有成熟作物吗？',
  clear: '确定要一键除草/除虫吗？',
  plant: '确定要一键种植吗？',
  upgrade: '确定要升级所有可升级的土地吗？',
  all: '确定要一键全收吗？'
}

export const FARM_OP_LABELS: Record<FarmOpType, string> = FARM_OPERATIONS.reduce((acc, cur) => {
  acc[cur.type] = cur.label
  return acc
}, {} as Record<FarmOpType, string>)
