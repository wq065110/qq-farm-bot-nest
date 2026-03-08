import { defineStore } from 'pinia'
import { bagApi } from '@/api'
import { BAG_DASHBOARD_ITEM_IDS, BAG_HIDDEN_ITEM_IDS } from '../constants'

const useBagStoreDef = defineStore('bag', {
  state: () => ({
    allItems: [] as any[]
  }),
  getters: {
    items(): any[] {
      return this.allItems.filter((it: any) => !BAG_HIDDEN_ITEM_IDS.has(Number(it.id || 0)))
    },
    dashboardItems(): any[] {
      return this.allItems.filter((it: any) => BAG_DASHBOARD_ITEM_IDS.has(Number(it.id || 0)))
    }
  },
  actions: {
    setBagFromRealtime(res: any) {
      if (res && Array.isArray(res.items))
        this.allItems = res.items
    }
  },
  persist: {
    storage: sessionStorage
  }
})

export function useBagStore() {
  const store = useBagStoreDef()
  bagApi.onBagUpdate(store.setBagFromRealtime)
  return store
}
