import { defineStore } from 'pinia'
import { authApi, settingsApi } from '@/api'
import { AUTOMATION_DEFAULTS, DEFAULT_FRIEND_QUIET_HOURS, DEFAULT_INTERVALS, DEFAULT_OFFLINE_REMINDER } from '../constants'

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

export interface OfflineReminderConfig {
  channel: string
  reloginUrlMode: string
  endpoint: string
  token: string
  title: string
  msg: string
  offlineDeleteSec: number
}

export interface UIConfig {
  theme?: string
}

export interface SettingsState {
  plantingStrategy: string
  preferredSeedId: number
  intervals: IntervalsConfig
  friendQuietHours: FriendQuietHoursConfig
  stealCropBlacklist: number[]
  automation: AutomationConfig
  ui: UIConfig
  offlineReminder: OfflineReminderConfig
}

function initialSettings(): SettingsState {
  return {
    plantingStrategy: 'preferred',
    preferredSeedId: 0,
    intervals: { ...DEFAULT_INTERVALS },
    friendQuietHours: { ...DEFAULT_FRIEND_QUIET_HOURS },
    stealCropBlacklist: [],
    automation: { ...AUTOMATION_DEFAULTS },
    ui: {},
    offlineReminder: { ...DEFAULT_OFFLINE_REMINDER }
  }
}

const useSettingStoreDef = defineStore('setting', {
  state: () => ({
    settings: initialSettings()
  }),
  actions: {
    applySettingsUpdate(data: any) {
      if (data != null)
        Object.assign(this.settings, data)
    },
    async saveSettings(accountId: string): Promise<{ ok: boolean, error?: string }> {
      if (!accountId)
        return { ok: false, error: '未选择账号' }
      const s = this.settings
      try {
        await settingsApi.save({
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
    },
    async saveOfflineConfig(): Promise<{ ok: boolean, error?: string }> {
      try {
        await settingsApi.saveOfflineReminder(this.settings.offlineReminder)
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e.message || '保存失败' }
      }
    },
    async changeAdminPassword(oldPassword: string, newPassword: string): Promise<{ ok: boolean, error?: string }> {
      try {
        await authApi.changePassword(oldPassword, newPassword)
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e.message || '修改失败' }
      }
    }
  },
  persist: {
    storage: sessionStorage
  }
})

let settingListenersRegistered = false
export function useSettingStore() {
  const store = useSettingStoreDef()
  if (!settingListenersRegistered) {
    settingListenersRegistered = true
    settingsApi.onSettingsUpdate((data: any) => {
      if (data != null)
        store.applySettingsUpdate(data)
    })
  }
  return store
}
