import type { GlobalToken } from 'antdv-next'
import { defineStore } from 'pinia'

const lightTokens: Partial<GlobalToken> = {
  colorPrimary: '#22c55e',
  colorPrimaryBg: 'rgba(34, 197, 94, 0.08)',
  colorPrimaryBgHover: 'rgba(34, 197, 94, 0.15)',
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  colorInfo: '#3b82f6',
  colorLink: '#22c55e',
  borderRadius: 8
}

const darkTokens: Partial<GlobalToken> = {
  colorPrimary: '#4ade80',
  colorPrimaryBg: 'rgba(74, 222, 128, 0.1)',
  colorPrimaryBgHover: 'rgba(74, 222, 128, 0.18)',
  colorSuccess: '#4ade80',
  colorWarning: '#fbbf24',
  colorError: '#f87171',
  colorInfo: '#60a5fa',
  colorLink: '#4ade80',
  borderRadius: 8
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarOpen: false,
    sidebarCollapsed: false,
    isDark: false
  }),
  getters: {
    themeTokens(): Partial<GlobalToken> {
      return this.isDark ? darkTokens : lightTokens
    }
  },
  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    closeSidebar() {
      this.sidebarOpen = false
    },
    openSidebar() {
      this.sidebarOpen = true
    },
    setSidebarCollapsed(val: boolean) {
      this.sidebarCollapsed = val
    },
    toggleSidebarCollapsed() {
      this.setSidebarCollapsed(!this.sidebarCollapsed)
    },
    async setTheme(t: 'light' | 'dark') {
      try {
        this.isDark = t === 'dark'
      } catch (e) {
        console.error('设置主题失败:', e)
      }
    },
    toggleDark() {
      const newTheme = this.isDark ? 'light' : 'dark'
      this.setTheme(newTheme)
    }
  },
  persist: {
    storage: localStorage
  }
})
