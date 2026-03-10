import { defineStore } from 'pinia'
import { authApi, panelApi } from '@/api'
import { DEFAULT_OFFLINE_REMINDER } from '../constants'

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

export interface PanelState {
  ui: UIConfig
  offlineReminder: OfflineReminderConfig
}

function initialPanel(): PanelState {
  return {
    ui: {},
    offlineReminder: { ...DEFAULT_OFFLINE_REMINDER }
  }
}

export const usePanelStore = defineStore('panel', {
  state: () => ({
    settings: initialPanel()
  }),
  actions: {
    applyPanelUpdate(data: any) {
      if (data != null) {
        if (data.ui !== undefined)
          this.settings.ui = { ...this.settings.ui, ...data.ui }
        if (data.offlineReminder !== undefined)
          this.settings.offlineReminder = { ...this.settings.offlineReminder, ...data.offlineReminder }
      }
    },
    async querySettings(): Promise<{ ok: boolean, error?: string }> {
      try {
        const data = await panelApi.query()
        this.applyPanelUpdate(data)
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e?.message || '加载失败' }
      }
    },
    async saveOfflineConfig(): Promise<{ ok: boolean, error?: string }> {
      try {
        await panelApi.saveOfflineReminder(this.settings.offlineReminder)
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
