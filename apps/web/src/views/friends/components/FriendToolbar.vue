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
    <div class="flex gap-2 items-center a-color-text-tertiary text-sm">
      <span class="px-2 py-0.5 a-color-primary a-bg-primary-bg rounded-md">{{ friendCount }} 好友</span>
      <span v-if="blacklistedCount" class="a-bg-fill-secondary px-2 py-0.5 a-color-text-secondary rounded-md">
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
