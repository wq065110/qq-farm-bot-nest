<script setup lang="ts">
import { SORT_ICONS, SORT_OPTIONS } from '../constants'

defineProps<{
  totalCount: number
}>()
const sortKey = defineModel<string>('sortKey', { required: true })
const searchQuery = defineModel<string>('searchQuery', { required: true })
</script>

<template>
  <div
    class="px-4 py-2.5 border-b border-b-solid flex flex-wrap gap-2 items-center justify-between a-border-b-border-sec"
  >
    <div class="flex gap-3 items-center">
      <div class="p-0.5 flex gap-1 items-center a-bg-layout rounded-lg">
        <a-button
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          type="text"
          class="px-2.5 py-1 transition-all text-sm rounded-md"
          :class="
            sortKey === opt.value
              ? 'a-bg-container a-color-primary font-semibold shadow-sm a-bg-primary-bg hover:!a-bg-primary-bg hover:!a-color-primary'
              : 'a-color-text-secondary'
          "
          @click="sortKey = opt.value"
        >
          <div :class="SORT_ICONS[opt.value]" />
          <span class="hidden sm:inline">{{ opt.label }}</span>
        </a-button>
      </div>
    </div>

    <div class="flex gap-3 items-center">
      <a-input v-model:value="searchQuery" placeholder="搜索作物..." allow-clear class="w-35 md:w-48">
        <template #prefix>
          <div class="i-streamline-emojis-magnifying-glass-tilted-left text-sm" />
        </template>
      </a-input>
    </div>
  </div>
</template>
