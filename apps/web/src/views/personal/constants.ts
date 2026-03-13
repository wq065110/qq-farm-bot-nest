export type FarmOpType = 'harvest' | 'clear' | 'plant' | 'upgrade' | 'all'

export type SingleLandAction = 'remove' | 'plant' | 'organic_fertilize'

export const SINGLE_LAND_ACTION_LABELS: Record<SingleLandAction, string> = {
  remove: '铲除',
  plant: '种植',
  organic_fertilize: '施有机肥'
}

export const LAND_LEVEL_NAMES: Record<number, string> = {
  1: '黄土地',
  2: '红土地',
  3: '黑土地',
  4: '金土地'
}

export const LAND_STATUS_NAMES: Record<string, string> = {
  harvestable: '可收获',
  growing: '生长中',
  empty: '空地',
  dead: '枯萎',
  locked: '未解锁'
}

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

export interface MutantTypeInfo {
  name: string
  effect: string
  color: string
}

export const MUTANT_TYPES: Record<number, MutantTypeInfo> = {
  1: { name: '冰冻', effect: '售价×3', color: 'cyan' },
  2: { name: '爱心', effect: '数量×3', color: 'magenta' },
  3: { name: '黄金', effect: '产出黄金果实', color: 'gold' },
  4: { name: '湿润', effect: '数量×2', color: 'blue' },
  5: { name: '暗化', effect: '售价×2', color: 'purple' }
}

export function getMutantInfo(id: number): MutantTypeInfo {
  return MUTANT_TYPES[id] ?? { name: `变异#${id}`, effect: '', color: 'default' }
}
