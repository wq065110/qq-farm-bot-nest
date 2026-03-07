import { defineStore } from 'pinia'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    list: [] as any[],
    strategyPanelCollapsed: false
  }),
  actions: {
    setStrategyPanelCollapsed(value: boolean) {
      this.strategyPanelCollapsed = value
    },
    toggleStrategyPanelCollapsed() {
      this.strategyPanelCollapsed = !this.strategyPanelCollapsed
    }
  },
  persist: {
    storage: sessionStorage
  }
})
