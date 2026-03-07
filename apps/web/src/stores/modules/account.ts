import { defineStore } from 'pinia'
import { accountApi } from '@/api'
import { useAnalyticsStore } from './analytics'
import { useBagStore } from './bag'
import { useFarmStore } from './farm'
import { useFriendStore } from './friend'
import { useSettingStore } from './setting'
import { useStatusStore } from './status'

export interface Account {
  id: string
  name: string
  nick?: string
  uin?: number | string
  platform?: string
  running?: boolean
  avatar?: string
  connected?: boolean
}

const useAccountStoreDef = defineStore('account', {
  state: () => ({
    accounts: [] as Account[],
    currentAccountId: ''
  }),
  getters: {
    currentAccount(): Account | undefined {
      return this.accounts.find(a => String(a.uin) === this.currentAccountId)
    }
  },
  actions: {
    resetAllDataStores() {
      useStatusStore().$reset()
      useBagStore().$reset()
      useFarmStore().$reset()
      useFriendStore().$reset()
      useSettingStore().$reset()
      useAnalyticsStore().$reset()
    },
    selectAccount(id: string) {
      if (id !== this.currentAccountId) {
        this.resetAllDataStores()
        this.currentAccountId = id
      }
    },
    setCurrentAccount(acc: Account) {
      this.selectAccount(String(acc.uin))
    },
    async startAccount(uin: string) {
      if (!uin)
        throw new Error('账号标识为空，无法启动')
      await accountApi.start(uin)
    },
    async stopAccount(uin: string) {
      if (!uin)
        throw new Error('账号标识为空，无法停止')
      await accountApi.stop(uin)
    },
    async deleteAccount(ref: string) {
      if (!ref)
        throw new Error('账号标识为空，无法删除')
      await accountApi.remove(ref)
      if (this.currentAccountId === ref) {
        this.currentAccountId = ''
        this.resetAllDataStores()
      }
    },
    async addAccount(payload: any) {
      const res = await accountApi.create(payload)
      if (res?.accounts && Array.isArray(res.accounts))
        this.accounts = res.accounts as Account[]
    },
    async updateAccount(uin: string, payload: any) {
      const res = await accountApi.create({ ...payload, uin })
      if (res?.accounts && Array.isArray(res.accounts))
        this.accounts = res.accounts as Account[]
    },
    setAccountsFromRealtime(data: any) {
      if (data?.accounts && Array.isArray(data.accounts))
        this.accounts = data.accounts as Account[]
      if (!this.currentAccountId && this.accounts.length > 0)
        this.currentAccountId = String(this.accounts[0].uin ?? this.accounts[0].id ?? '')
    }
  },
  persist: {
    storage: sessionStorage
  }
})

let accountListenersRegistered = false
export function useAccountStore() {
  const store = useAccountStoreDef()
  if (!accountListenersRegistered) {
    accountListenersRegistered = true
    accountApi.onAccountsUpdate((data: any) => {
      const payload = data && typeof data === 'object' ? data : {}
      store.setAccountsFromRealtime(payload)
    })
  }
  return store
}
