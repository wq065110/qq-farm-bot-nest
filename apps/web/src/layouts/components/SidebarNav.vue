<script setup lang="ts">
defineProps<{
  items: { key: string, icon: string, label: string }[]
  collapsed?: boolean
  activeKey: string
}>()

const emit = defineEmits<{
  menuClick: [path: string]
}>()
</script>

<template>
  <nav
    class="px-3 pb-3 flex-1 min-h-0 overflow-y-auto space-y-1.5"
    :class="collapsed ? 'px-2' : ''"
  >
    <div
      v-for="item in items"
      :key="item.key"
      class="group flex cursor-pointer transition-all duration-150 items-center rounded-lg"
      :class="[
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
        activeKey === item.key
          ? 'a-bg-primary-bg a-color-primary'
          : 'hover:a-bg-layout a-color-text-secondary'
      ]"
      @click="emit('menuClick', item.key)"
    >
      <div class="shrink-0 transition-all duration-350 text-lg group-hover:scale-115" :class="item.icon" />
      <span v-if="!collapsed" class="text-[14px] truncate">{{ item.label }}</span>
    </div>
  </nav>
</template>
