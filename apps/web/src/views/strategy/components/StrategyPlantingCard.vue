<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { analyticsApi } from '@/api'
import { useAccountStore, useFarmStore, useStrategyStore } from '@/stores'
import { ANALYTICS_SORT_BY_MAP, FERTILIZER_LAND_TYPE_OPTIONS, FERTILIZER_OPTIONS, PLANTING_STRATEGY_OPTIONS, PREFERRED_SEED_AUTO_OPTION } from '../constants'

const strategyStore = useStrategyStore()
const accountStore = useAccountStore()
const farmStore = useFarmStore()

const { currentAccountId } = storeToRefs(accountStore)
const { settings } = storeToRefs(strategyStore)
const seeds = computed(() => farmStore.seeds ?? [])

const strategyPreviewLabel = ref<string | null>(null)

const preferredSeedOptions = computed(() => {
  const options: any[] = [PREFERRED_SEED_AUTO_OPTION]
  const list = seeds.value
  if (list?.length) {
    for (const seed of list) {
      options.push({
        label: `${seed.requiredLevel}级 ${seed.name} (${seed.price ?? 0}金)`,
        value: seed.seedId,
        image: seed.image,
        disabled: seed.locked || seed.soldOut
      })
    }
  }
  return options
})

const stealBlacklistOptions = computed(() => {
  const list = seeds.value
  if (!list?.length)
    return []
  return list.map((seed: any) => ({
    label: `${seed.requiredLevel}级 ${seed.name} (${seed.price ?? 0}金)`,
    value: seed.seedId,
    image: seed.image
  }))
})

watchEffect(async () => {
  const strategy = settings.value.plantingStrategy
  if (strategy === 'preferred') {
    strategyPreviewLabel.value = null
    return
  }
  const list = seeds.value
  if (!list?.length) {
    strategyPreviewLabel.value = null
    return
  }
  const available = list.filter((s: { locked?: boolean, soldOut?: boolean }) => !s.locked && !s.soldOut)
  if (available.length === 0) {
    strategyPreviewLabel.value = '暂无可用种子'
    return
  }
  if (strategy === 'level') {
    const best = available.toSorted((a: { requiredLevel: number }, b: { requiredLevel: number }) => b.requiredLevel - a.requiredLevel)[0]
    strategyPreviewLabel.value = best ? `${best.requiredLevel}级 ${best.name}` : null
    return
  }
  const sortBy = ANALYTICS_SORT_BY_MAP[strategy]
  if (!sortBy || !currentAccountId.value) {
    strategyPreviewLabel.value = null
    return
  }
  try {
    const res = await analyticsApi.get(sortBy)
    const rankings = Array.isArray(res) ? res : []
    const availableIds = new Set(available.map((s: { seedId: number }) => s.seedId))
    const match = rankings.find((r: { seedId?: unknown }) => availableIds.has(Number(r.seedId)))
    if (match) {
      const seed = available.find((s: { seedId: number }) => s.seedId === Number(match.seedId))
      strategyPreviewLabel.value = seed ? `${seed.requiredLevel}级 ${seed.name}` : null
    } else {
      strategyPreviewLabel.value = '暂无匹配种子'
    }
  } catch {
    strategyPreviewLabel.value = null
  }
})

function filterOption(input: string, option: { label?: string }) {
  return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
}
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4', header: '!min-h-11 !px-4' }">
    <template #title>
      <div class="font-bold flex gap-2 items-center">
        <div class="i-streamline-emojis-seedling" />
        种植策略
      </div>
    </template>
    <div class="gap-x-3 grid grid-cols-1 md:grid-cols-2">
      <a-form layout="vertical">
        <a-form-item label="种植策略">
          <a-select v-model:value="settings.plantingStrategy" :options="PLANTING_STRATEGY_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form v-if="settings.plantingStrategy === 'preferred'" layout="vertical">
        <a-form-item label="优先种子">
          <a-select v-model:value="settings.preferredSeedId" show-search :filter-option="filterOption" :options="preferredSeedOptions">
            <template #labelRender="{ label }">
              <span>{{ label }}</span>
            </template>
            <template #optionRender="{ option }">
              <div class="flex gap-1 items-center">
                <a-avatar v-if="option.data.image" :src="option.data.image" :size="24" :class="{ 'opacity-50': option.data.disabled }" />
                <a-avatar v-else :size="24" class="bg-transparent">
                  <i class="i-streamline-emojis-clinking-beer-mugs flex text-lg" />
                </a-avatar>
                <span>{{ option.label }}</span>
              </div>
            </template>
          </a-select>
        </a-form-item>
      </a-form>
      <a-form v-else layout="vertical">
        <a-form-item label="策略预览">
          <a-input :value="strategyPreviewLabel ?? '加载中...'" disabled />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="施肥范围">
          <a-checkbox-group v-model:value="settings.fertilizerLandTypes" :options="FERTILIZER_LAND_TYPE_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="施肥策略">
          <a-select v-model:value="settings.fertilizer" :options="FERTILIZER_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="多季补肥">
          <a-switch v-model:checked="settings.fertilizerMultiSeason" />
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
          >
            <template #labelRender="{ label }">
              <span>{{ label }}</span>
            </template>
            <template #optionRender="{ option }">
              <div class="flex gap-1 items-center">
                <a-avatar v-if="option.data.image" :src="option.data.image" :size="24" :class="{ 'opacity-50': option.data.disabled }" />
                <span>{{ option.label }}</span>
              </div>
            </template>
          </a-select>
        </a-form-item>
      </a-form>
    </div>
  </a-card>
</template>
