import { defineStore } from 'pinia'
import { friendApi, settingsApi } from '@/api'

function buildPlantSummaryFromDetail(lands: any[], summary: any): Record<string, number> {
  const stealNumFromSummary = Array.isArray(summary?.stealable) ? summary.stealable.length : null
  const dryNumFromSummary = Array.isArray(summary?.needWater) ? summary.needWater.length : null
  const weedNumFromSummary = Array.isArray(summary?.needWeed) ? summary.needWeed.length : null
  const insectNumFromSummary = Array.isArray(summary?.needBug) ? summary.needBug.length : null

  let stealNum = stealNumFromSummary
  let dryNum = dryNumFromSummary
  let weedNum = weedNumFromSummary
  let insectNum = insectNumFromSummary

  if (stealNum === null || dryNum === null || weedNum === null || insectNum === null) {
    stealNum = 0
    dryNum = 0
    weedNum = 0
    insectNum = 0
    for (const land of (Array.isArray(lands) ? lands : [])) {
      if (!land || !land.unlocked)
        continue
      if (land.status === 'stealable')
        stealNum!++
      if (land.needWater)
        dryNum!++
      if (land.needWeed)
        weedNum!++
      if (land.needBug)
        insectNum!++
    }
  }

  return {
    stealNum: Number(stealNum) || 0,
    dryNum: Number(dryNum) || 0,
    weedNum: Number(weedNum) || 0,
    insectNum: Number(insectNum) || 0
  }
}

const useFriendStoreDef = defineStore('friend', {
  state: () => ({
    friends: [] as any[],
    friendLands: {} as Record<string, any[]>,
    friendLandsLoading: {} as Record<string, boolean>,
    blacklist: [] as number[]
  }),
  actions: {
    syncFriendPlantSummary(friendId: string, lands: any[], summary: any) {
      const key = String(friendId)
      const idx = this.friends.findIndex(f => String(f?.gid || '') === key)
      if (idx < 0)
        return
      const nextPlant = buildPlantSummaryFromDetail(lands, summary)
      this.friends[idx] = {
        ...this.friends[idx],
        plant: nextPlant
      }
    },
    async toggleBlacklist(accountId: string, gid: number) {
      if (!accountId || !gid)
        return
      const res = await friendApi.toggleBlacklist(gid)
      this.blacklist = res || []
    },
    async fetchFriendLands(accountId: string, friendId: string) {
      if (!accountId || !friendId)
        return
      this.friendLandsLoading = { ...this.friendLandsLoading, [friendId]: true }
      try {
        const res = await friendApi.getLands(Number(friendId))
        const rawLands = res?.lands || []
        const nowSec = Math.floor(Date.now() / 1000)
        const lands = rawLands.map((l: any) => ({
          ...l,
          matureAt: nowSec + (l.matureInSec ?? 0)
        }))
        const summary = res?.summary ?? null
        this.friendLands = { ...this.friendLands, [friendId]: lands }
        this.syncFriendPlantSummary(friendId, lands, summary)
      } finally {
        this.friendLandsLoading = { ...this.friendLandsLoading, [friendId]: false }
      }
    },
    async operate(accountId: string, friendId: string, opType: string) {
      if (!accountId || !friendId)
        return
      await friendApi.operate(Number(friendId), opType)
    },
    setFriendsFromRealtime(list: any[]) {
      this.friends = Array.isArray(list) ? list : []
    },
    setBlacklistFromRealtime(list: number[] | any[]) {
      this.blacklist = Array.isArray(list) ? list.map((x: any) => Number(x)).filter(n => !Number.isNaN(n)) : []
    }
  },
  persist: {
    storage: sessionStorage
  }
})

let friendListenersRegistered = false
export function useFriendStore() {
  const store = useFriendStoreDef()
  if (!friendListenersRegistered) {
    friendListenersRegistered = true
    friendApi.onFriendsUpdate((data: any) => {
      if (data != null)
        store.setFriendsFromRealtime(Array.isArray(data) ? data : [])
    })
    settingsApi.onSettingsUpdate((data: any) => {
      if (data != null) {
        if (Array.isArray(data.friendBlacklist))
          store.setBlacklistFromRealtime(data.friendBlacklist)
        else if (Array.isArray(data.stealCropBlacklist))
          store.setBlacklistFromRealtime(data.stealCropBlacklist)
      }
    })
  }
  return store
}
