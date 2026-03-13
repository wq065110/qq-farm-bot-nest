<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue'
import { OP_META } from '../constants'

defineProps<{
  operations: Record<string, number>
}>()

function getOpName(key: string | number): string {
  return OP_META[String(key)]?.label || String(key)
}

function getOpIcon(key: string | number): string {
  return OP_META[String(key)]?.icon || 'i-streamline-emojis-seedling'
}
</script>

<template>
  <a-card
    variant="borderless"
    class="flex-1 min-h-0"
    :classes="{ body: '!p-4 !h-full !flex !flex-col !overflow-hidden' }"
  >
    <div class="mb-3 flex gap-2 items-center a-color-text">
      <div class="i-streamline-emojis-bar-chart text-lg" />
      今日统计
    </div>
    <div v-if="operations && Object.keys(operations).length" class="gap-2 grid grid-cols-2 min-h-20 overflow-y-auto">
      <div
        v-for="(val, key) in operations"
        :key="key"
        class="px-2.5 py-2 flex items-center justify-between a-bg-layout rounded-lg"
      >
        <div class="flex gap-1.5 items-center">
          <div :class="getOpIcon(key)" />
          <span class="a-color-text-secondary text-sm">{{ getOpName(key) }}</span>
        </div>
        <span class="font-bold a-color-text">{{ val }}</span>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center">
      <EmptyState icon="i-streamline-emojis-bar-chart text-3xl" description="今日暂无统计数据" />
    </div>
  </a-card>
</template>
