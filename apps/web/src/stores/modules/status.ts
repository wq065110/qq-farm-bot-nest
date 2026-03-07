import { defineStore } from 'pinia'
import { logsApi, statusApi, ws } from '@/api'
import { LOGS_MAX_LENGTH } from '../constants'

interface DailyGift {
  key: string
  label: string
  enabled?: boolean
  doneToday: boolean
  lastAt?: number
  completedCount?: number
  totalCount?: number
  tasks?: any[]
}

interface DailyGiftsResponse {
  date: string
  growth: DailyGift
  gifts: DailyGift[]
}

const CHINA_TZ = 'Asia/Shanghai'

function formatTimeChina(ts: number): string {
  return new Date(ts).toLocaleString('sv-SE', { timeZone: CHINA_TZ })
}

function normalizeLogEntry(input: any): Record<string, any> {
  const entry = (input && typeof input === 'object') ? { ...input } : {}
  const createdAt = Number(entry.createdAt) || Number(entry.ts) || Date.parse(String(entry.time || '')) || Date.now()
  return {
    ...entry,
    createdAt,
    time: entry.time || formatTimeChina(createdAt)
  }
}

function normalizeStatusPayload(input: any): Record<string, any> {
  return (input && typeof input === 'object') ? { ...input } : {}
}

const useStatusStoreDef = defineStore('status', {
  state: () => ({
    status: null as any,
    logs: [] as any[],
    logFilterActive: false,
    dailyGifts: null as DailyGiftsResponse | null
  }),
  getters: {
    realtimeConnected() {
      return ws.connected
    },
    subscribedResolvedAccountId() {
      return ws.subscribedAccountId
    }
  },
  actions: {
    pushRealtimeLog(entry: any) {
      if (this.logFilterActive)
        return
      const next = normalizeLogEntry(entry)
      this.logs.push(next)
      if (this.logs.length > LOGS_MAX_LENGTH)
        this.logs = this.logs.slice(-LOGS_MAX_LENGTH)
    },
    setLogs(list: any[]) {
      this.logs = Array.isArray(list) ? list.map((item: any) => normalizeLogEntry(item)) : []
    },
    setLogFilterActive(active: boolean) {
      this.logFilterActive = !!active
    },
    ensureStatusObject() {
      if (this.status == null || typeof this.status !== 'object')
        this.status = {}
    },
    applyStatusUpdate(data: any) {
      if (data && typeof data === 'object' && data.status)
        this.status = normalizeStatusPayload(data.status)
      else
        this.status = null
    },
    applyStatusConnection(data: any) {
      this.ensureStatusObject()
      this.status!.connection = { connected: !!data?.connected }
      if (data?.wsError != null)
        (this.status as any).wsError = data.wsError
    },
    applyStatusProfile(data: any) {
      this.ensureStatusObject()
      this.status!.status = data
    },
    applyStatusSession(data: any) {
      this.ensureStatusObject()
      const s = this.status!
      if (data?.bootAt !== undefined)
        s.bootAt = data.bootAt
      if (data?.uptime !== undefined)
        s.uptime = data.uptime
      if (data?.sessionExpGained !== undefined)
        s.sessionExpGained = data.sessionExpGained
      if (data?.sessionGoldGained !== undefined)
        s.sessionGoldGained = data.sessionGoldGained
      if (data?.sessionCouponGained !== undefined)
        s.sessionCouponGained = data.sessionCouponGained
      if (data?.lastExpGain !== undefined)
        s.lastExpGain = data.lastExpGain
      if (data?.lastGoldGain !== undefined)
        s.lastGoldGain = data.lastGoldGain
      if (data?.levelProgress !== undefined)
        s.levelProgress = data.levelProgress
    },
    applyStatusOperations(data: any) {
      this.ensureStatusObject()
      this.status!.operations = data
    },
    applyStatusSchedule(data: any) {
      this.ensureStatusObject()
      const s = this.status!
      s.nextChecks = {
        farmRemainSec: data?.farmRemainSec ?? 0,
        friendRemainSec: data?.friendRemainSec ?? 0
      }
      if (data?.configRevision !== undefined)
        s.configRevision = data.configRevision
    },
    applyDailyGifts(data: any) {
      if (data != null)
        this.dailyGifts = data
    }
  },
  persist: {
    storage: sessionStorage
  }
})

let statusListenersRegistered = false
export function useStatusStore() {
  const store = useStatusStoreDef()
  if (!statusListenersRegistered) {
    statusListenersRegistered = true
    statusApi.onStatusUpdate((data: any) => store.applyStatusUpdate(data))
    statusApi.onStatusConnection((data: any) => store.applyStatusConnection(data))
    statusApi.onStatusProfile((data: any) => store.applyStatusProfile(data))
    statusApi.onStatusSession((data: any) => store.applyStatusSession(data))
    statusApi.onStatusOperations((data: any) => store.applyStatusOperations(data))
    statusApi.onStatusSchedule((data: any) => store.applyStatusSchedule(data))
    logsApi.onLogNew((data: any) => store.pushRealtimeLog(data))
    statusApi.onDailyGiftsUpdate((data: any) => store.applyDailyGifts(data))
  }
  return store
}
