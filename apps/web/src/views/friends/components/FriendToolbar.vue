<script setup lang="ts">
defineProps<{
  friendCount: number
  blacklistedCount: number
}>()

const searchQuery = defineModel<string>('searchQuery', { required: true })
</script>

<template>
  <div
    class="px-4 py-2.5 border-b border-b-solid flex flex-wrap gap-2 items-center justify-between a-border-b-border-sec"
  >
    <div class="flex gap-1.5 items-center a-color-text-tertiary text-xs">
      <span class="text-[10px] px-1.5 py-px a-color-primary a-bg-primary-bg rounded">{{ friendCount }} 好友</span>
      <span v-if="blacklistedCount" class="a-bg-fill-secondary text-[10px] px-1.5 py-px a-color-text-secondary rounded">
        {{ blacklistedCount }} 屏蔽
      </span>
    </div>
    <a-input v-model:value="searchQuery" placeholder="搜索好友..." allow-clear class="!w-48">
      <template #prefix>
        <div class="i-twemoji-magnifying-glass-tilted-left" />
      </template>
    </a-input>
  </div>
</template>
