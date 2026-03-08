import { defineStore } from 'pinia'
import { strategyApi } from '@/api'
import { AUTOMATION_DEFAULTS, DEFAULT_FRIEND_QUIET_HOURS, DEFAULT_INTERVALS } from '../constants'

export interface AutomationConfig {
  farm: boolean
  farm_push: boolean
  land_upgrade: boolean
  friend: boolean
  friend_help_exp_limit: boolean
  friend_steal: boolean
  friend_help: boolean
  friend_bad: boolean
  task: boolean
  email: boolean
  fertilizer_gift: boolean
  fertilizer_buy: boolean
  free_gifts: boolean
  share_reward: boolean
  vip_gift: boolean
  month_card: boolean
  open_server_gift: boolean
  sell: boolean
  fertilizer: string
}

export interface IntervalsConfig {
  farm: number
  friend: number
  farmMin: number
  farmMax: number
  friendMin: number
  friendMax: number
}

export interface FriendQuietHoursConfig {
  enabled: boolean
  start: string
  end: string
}

export interface StrategyState {
  plantingStrategy: string
  preferredSeedId: number
  intervals: IntervalsConfig
  friendQuietHours: FriendQuietHoursConfig
  stealCropBlacklist: number[]
  automation: AutomationConfig
}

const STRATEGY_UPDATE_KEYS = ['intervals', 'plantingStrategy', 'preferredSeedId', 'friendQuietHours', 'stealCropBlacklist', 'automation'] as const

function initialStrategy(): StrategyState {
  return {
    plantingStrategy: 'preferred',
    preferredSeedId: 0,
    intervals: { ...DEFAULT_INTERVALS },
    friendQuietHours: { ...DEFAULT_FRIEND_QUIET_HOURS },
    stealCropBlacklist: [],
    automation: { ...AUTOMATION_DEFAULTS }
  }
}

export const useStrategyStore = defineStore('strategy', {
  state: () => ({
    settings: initialStrategy()
  }),
  actions: {
    applyStrategyUpdate(data: unknown): void {
      if (data == null || typeof data !== 'object')
        return
      const payload = data as Record<string, unknown>
      for (const k of STRATEGY_UPDATE_KEYS) {
        if (payload[k] !== undefined)
          (this.settings as Record<string, unknown>)[k] = payload[k]
      }
    },
    async saveSettings(accountId: string): Promise<{ ok: boolean, error?: string }> {
      if (!accountId)
        return { ok: false, error: '未选择账号' }
      const s = this.settings
      try {
        await strategyApi.save({
          plantingStrategy: s.plantingStrategy,
          preferredSeedId: s.preferredSeedId,
          intervals: s.intervals,
          friendQuietHours: s.friendQuietHours,
          stealCropBlacklist: s.stealCropBlacklist,
          automation: s.automation
        })
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e.message || '保存失败' }
      }
    }
  },
  persist: {
    storage: sessionStorage
  }
})
