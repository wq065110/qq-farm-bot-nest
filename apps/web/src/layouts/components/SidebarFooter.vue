<script setup lang="ts">
import type { Ref } from 'vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

defineProps<{
  collapsed?: boolean
  uptime: string
  formattedTime: Ref<string> | string
  version: string
  serverVersion: string
  connectionStatus: { text: string, badge: 'error' | 'default' | 'processing' }
}>()
</script>

<template>
  <div class="px-3 py-3 border-t border-t-solid a-border-t-border-sec">
    <template v-if="collapsed">
      <div class="flex flex-col gap-2.5 items-center">
        <a-badge :status="connectionStatus.badge" />
        <ThemeToggle />
      </div>
    </template>
    <template v-else>
      <div class="flex items-center justify-between">
        <div class="flex gap-1.5 items-center a-color-text-tertiary text-sm">
          <div class="i-streamline-emojis-watch" />
          {{ uptime }}
        </div>
        <ThemeToggle />
      </div>
      <div class="font-mono mt-1.5 flex items-center justify-between a-color-text-tertiary text-xs">
        <span>{{ formattedTime }}</span>
      </div>
      <div class="font-mono mt-0.5 flex items-center justify-between a-color-text-tertiary text-xs">
        <span>Web v{{ version }}</span>
        <span v-if="serverVersion">Core v{{ serverVersion }}</span>
      </div>
    </template>
  </div>
</template>
