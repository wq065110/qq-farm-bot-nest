<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { analyticsApi } from '@/api'
import { useWsTopics } from '@/composables/useWsTopics'
import { useAccountStore, useFarmStore, useStrategyStore } from '@/stores'
import message from '@/utils/message'
import AccountInfoCard from './components/AccountInfoCard.vue'
import { ANALYTICS_SORT_BY_MAP, FERTILIZER_OPTIONS, PLANTING_STRATEGY_OPTIONS } from './constants'

const strategyStore = useStrategyStore()
const accountStore = useAccountStore()
const farmStore = useFarmStore()

const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { seeds } = storeToRefs(farmStore)
const { settings } = storeToRefs(strategyStore)

const saving = ref(false)
const strategyPreviewLabel = ref<string | null>(null)

const currentAccountName = computed(() => {
  const acc = currentAccount.value
  return acc ? String(acc.name || acc.nick || acc.uin || '') || null : null
})

const currentAccountUin = computed(() => {
  const uin = currentAccount.value?.uin
  return uin ?? undefined
})

const currentAccountAvatar = computed(() => currentAccount.value?.avatar ?? undefined)

const preferredSeedOptions = computed(() => {
  const options = [{ label: '自动选择', value: 0 }]
  if (seeds.value) {
    options.push(
      ...seeds.value.map((seed: any) => ({
        label: `${seed.requiredLevel}级 ${seed.name} (${seed.price}金)`,
        value: seed.seedId,
        disabled: seed.locked || seed.soldOut
      }))
    )
  }
  return options
})

const stealBlacklistOptions = computed(() => {
  if (!seeds.value || seeds.value.length === 0)
    return []
  return seeds.value.map((seed: any) => ({
    label: `${seed.requiredLevel}级 ${seed.name}`,
    value: seed.seedId
  }))
})

watchEffect(async () => {
  const strategy = settings.value.plantingStrategy
  if (strategy === 'preferred') {
    strategyPreviewLabel.value = null
    return
  }
  if (!seeds.value || seeds.value.length === 0) {
    strategyPreviewLabel.value = null
    return
  }
  const available = seeds.value.filter((s: any) => !s.locked && !s.soldOut)
  if (available.length === 0) {
    strategyPreviewLabel.value = '暂无可用种子'
    return
  }
  if (strategy === 'level') {
    const best = available.toSorted((a: any, b: any) => b.requiredLevel - a.requiredLevel)[0]
    strategyPreviewLabel.value = best ? `${best.requiredLevel}级 ${best.name}` : null
    return
  }
  const sortBy = ANALYTICS_SORT_BY_MAP[strategy]
  if (sortBy && currentAccountId.value) {
    try {
      const res = await analyticsApi.get(sortBy)
      const rankings: any[] = Array.isArray(res) ? res : []
      const availableIds = new Set(available.map((s: any) => s.seedId))
      const match = rankings.find((r: any) => availableIds.has(Number(r.seedId)))
      if (match) {
        const seed = available.find((s: any) => s.seedId === Number(match.seedId))
        strategyPreviewLabel.value = seed ? `${seed.requiredLevel}级 ${seed.name}` : null
      } else {
        strategyPreviewLabel.value = '暂无匹配种子'
      }
    } catch {
      strategyPreviewLabel.value = null
    }
  }
})

async function saveAccountSettings() {
  if (!currentAccountId.value)
    return
  saving.value = true
  try {
    const res = await strategyStore.saveSettings(currentAccountId.value)
    if (res.ok) {
      message.success('账号设置已保存')
    } else {
      message.error(`保存失败: ${res.error}`)
    }
  } finally {
    saving.value = false
  }
}

useWsTopics(['strategy', 'seeds'])
</script>

<template>
  <div class="flex flex-col gap-3 h-full">
    <div class="flex flex-wrap gap-2 items-center justify-between">
      <div class="font-bold flex gap-2 items-center a-color-text">
        <div class="i-twemoji-chart-increasing text-lg" aria-hidden="true" />
        策略设置
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
      <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4' }">
        <div class="font-bold mb-3 flex gap-2 items-center a-color-text">
          <div class="i-twemoji-seedling" aria-hidden="true" />
          种植策略
        </div>
        <div class="gap-x-3 grid grid-cols-1 md:grid-cols-2">
          <a-form layout="vertical">
            <a-form-item label="种植策略">
              <a-select v-model:value="settings.plantingStrategy" :options="PLANTING_STRATEGY_OPTIONS" />
            </a-form-item>
          </a-form>
          <a-form v-if="settings.plantingStrategy === 'preferred'" layout="vertical">
            <a-form-item label="优先种子">
              <a-select v-model:value="settings.preferredSeedId" :options="preferredSeedOptions" />
            </a-form-item>
          </a-form>
          <a-form v-else layout="vertical">
            <a-form-item label="策略预览">
              <a-input :value="strategyPreviewLabel ?? '加载中...'" disabled />
            </a-form-item>
          </a-form>
          <a-form layout="vertical">
            <a-form-item label="施肥策略">
              <a-select v-model:value="settings.automation.fertilizer" :options="FERTILIZER_OPTIONS" />
            </a-form-item>
          </a-form>
          <a-form layout="vertical">
            <a-form-item label="偷取作物黑名单">
              <a-select
                v-model:value="settings.stealCropBlacklist"
                mode="multiple"
                :options="stealBlacklistOptions"
                placeholder="选择不偷取的作物..."
                allow-clear
                :max-tag-count="5"
              />
            </a-form-item>
          </a-form>
        </div>
      </a-card>

      <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4' }">
        <div class="font-bold mb-3 flex gap-2 items-center a-color-text">
          <div class="i-twemoji-stopwatch" aria-hidden="true" />
          巡查间隔
        </div>
        <div class="gap-x-3 grid grid-cols-2 lg:grid-cols-4">
          <a-form layout="vertical">
            <a-form-item label="农场最小(秒)">
              <a-input-number v-model:value="settings.intervals.farmMin" :min="1" style="width: 100%" />
            </a-form-item>
          </a-form>
          <a-form layout="vertical">
            <a-form-item label="农场最大(秒)">
              <a-input-number v-model:value="settings.intervals.farmMax" :min="1" style="width: 100%" />
            </a-form-item>
          </a-form>
          <a-form layout="vertical">
            <a-form-item label="好友最小(秒)">
              <a-input-number v-model:value="settings.intervals.friendMin" :min="1" style="width: 100%" />
            </a-form-item>
          </a-form>
          <a-form layout="vertical">
            <a-form-item label="好友最大(秒)">
              <a-input-number v-model:value="settings.intervals.friendMax" :min="1" style="width: 100%" />
            </a-form-item>
          </a-form>
        </div>
        <div class="mt-3 flex flex-wrap gap-4 items-center">
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.friendQuietHours.enabled" size="small" />
            <span>好友静默时段</span>
          </label>
          <div class="flex gap-2 items-center">
            <a-input
              v-model:value="settings.friendQuietHours.start"
              type="time"
              class="w-28"
              :disabled="!settings.friendQuietHours.enabled"
            />
            <span class="a-color-text-tertiary">—</span>
            <a-input
              v-model:value="settings.friendQuietHours.end"
              type="time"
              class="w-28"
              :disabled="!settings.friendQuietHours.enabled"
            />
          </div>
        </div>
      </a-card>

      <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4' }">
        <div class="font-bold mb-3 flex gap-2 items-center a-color-text">
          <div class="i-twemoji-gear" aria-hidden="true" />
          自动化开关
        </div>
        <div class="gap-4 grid grid-cols-2 lg:grid-cols-5 md:grid-cols-4">
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.farm" size="small" />
            <span>自动种植收获</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.task" size="small" />
            <span>自动做任务</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.sell" size="small" />
            <span>自动卖果实</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.friend" size="small" />
            <span>自动好友互动</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.farm_push" size="small" />
            <span>推送触发巡田</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.land_upgrade" size="small" />
            <span>自动升级土地</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.email" size="small" />
            <span>自动领取邮件</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.free_gifts" size="small" />
            <span>自动商城礼包</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.share_reward" size="small" />
            <span>自动分享奖励</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.vip_gift" size="small" />
            <span>自动VIP礼包</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.month_card" size="small" />
            <span>自动月卡奖励</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.open_server_gift" size="small" />
            <span>自动开服红包</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.fertilizer_gift" size="small" />
            <span>自动填充化肥</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.fertilizer_buy" size="small" />
            <span>自动购买化肥</span>
          </label>
        </div>
        <div v-if="settings.automation.friend" class="mt-2 py-2 flex flex-wrap gap-6">
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.friend_steal" size="small" />
            <span>偷菜</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.friend_help" size="small" />
            <span>帮忙</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.friend_bad" size="small" />
            <span>捣乱</span>
          </label>
          <label class="flex gap-2 cursor-pointer items-center">
            <a-switch v-model:checked="settings.automation.friend_help_exp_limit" size="small" />
            <span>经验上限停帮</span>
          </label>
        </div>
      </a-card>
    </template>
  </div>
</template>
