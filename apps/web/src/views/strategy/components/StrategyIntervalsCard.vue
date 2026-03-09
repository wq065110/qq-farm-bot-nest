<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStrategyStore } from '@/stores'

const strategyStore = useStrategyStore()
const { settings } = storeToRefs(strategyStore)
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4', header: '!min-h-11 !px-4' }">
    <template #title>
      <div class="font-bold flex gap-2 items-center">
        <div class="i-streamline-emojis-watch" aria-hidden="true" />
        巡查间隔
      </div>
    </template>
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
</template>
