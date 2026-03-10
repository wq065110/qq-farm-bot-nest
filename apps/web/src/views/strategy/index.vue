<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useAccountRefresh } from '@/composables/useAccountRefresh'
import { useAccountStore, useFarmStore, useStrategyStore } from '@/stores'
import message from '@/utils/message'
import AccountInfoCard from './components/AccountInfoCard.vue'
import StrategyAutomationCard from './components/StrategyAutomationCard.vue'
import StrategyIntervalsCard from './components/StrategyIntervalsCard.vue'
import StrategyPlantingCard from './components/StrategyPlantingCard.vue'

const strategyStore = useStrategyStore()
const accountStore = useAccountStore()
const farmStore = useFarmStore()

const { currentAccountId, currentAccount } = storeToRefs(accountStore)

const saving = ref(false)

const currentAccountName = computed(() => {
  const acc = currentAccount.value
  return acc ? String(acc.name || acc.nick || acc.uin || '') || null : null
})
const currentAccountUin = computed(() => currentAccount.value?.uin ?? undefined)
const currentAccountAvatar = computed(() => currentAccount.value?.avatar ?? undefined)

async function saveAccountSettings(): Promise<void> {
  if (!currentAccountId.value)
    return
  saving.value = true
  try {
    const res = await strategyStore.saveSettings(currentAccountId.value)
    if (res.ok)
      message.success('账号设置已保存')
    else
      message.error(`保存失败: ${res.error}`)
  } finally {
    saving.value = false
  }
}

function initPageData() {
  strategyStore.querySettings()
  farmStore.querySeeds(currentAccountId.value)
}

useAccountRefresh(initPageData)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-2 items-center justify-between">
      <div class="font-bold flex gap-2 items-center a-color-text">
        <div class="i-streamline-emojis-clipboard text-lg" />
        <span class="text-lg">策略设置</span>
      </div>
      <a-button
        v-if="currentAccountId"
        type="primary"
        size="small"
        :loading="saving"
        @click="saveAccountSettings"
      >
        保存账号设置
      </a-button>
    </div>

    <AccountInfoCard
      :account-id="currentAccountId"
      :account-name="currentAccountName"
      :account-uin="currentAccountUin"
      :account-avatar="currentAccountAvatar"
    />

    <template v-if="currentAccountId">
      <StrategyPlantingCard />
      <StrategyIntervalsCard />
      <StrategyAutomationCard />
    </template>
  </div>
</template>
