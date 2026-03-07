import { defineStore } from 'pinia'
import { farmApi } from '@/api'

export interface Land {
  id: number
  plantName?: string
  phaseName?: string
  seedImage?: string
  status: string
  matureInSec: number
  needWater?: boolean
  needWeed?: boolean
  needBug?: boolean
  [key: string]: any
}

const useFarmStoreDef = defineStore('farm', {
  state: () => ({
    lands: [] as Land[],
    seeds: [] as any[],
    summary: {} as any
  }),
  actions: {
    async operate(accountId: string, opType: string) {
      if (!accountId)
        return
      await farmApi.operate(opType)
    },
    setLandsFromRealtime(res: any) {
      if (!res)
        return
      const nowSec = Math.floor(Date.now() / 1000)
      this.lands = (res.lands || []).map((l: any) => ({
        ...l,
        matureAt: (l.matureInSec ?? 0) > 0 ? nowSec + l.matureInSec : 0
      }))
      this.summary = res.summary || {}
    },
    setSeedsFromRealtime(list: any[]) {
      this.seeds = Array.isArray(list) ? list : []
    }
  },
  persist: {
    storage: sessionStorage
  }
})

let farmListenersRegistered = false
export function useFarmStore() {
  const store = useFarmStoreDef()
  if (!farmListenersRegistered) {
    farmListenersRegistered = true
    farmApi.onLandsUpdate((data: any) => {
      if (data != null)
        store.setLandsFromRealtime(data)
    })
    farmApi.onSeedsUpdate((data: any) => {
      if (data != null)
        store.setSeedsFromRealtime(Array.isArray(data) ? data : [])
    })
  }
  return store
}
