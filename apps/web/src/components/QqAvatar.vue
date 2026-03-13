<script setup lang="ts">
import { computed } from 'vue'
import { getPlatformIcon } from '@/utils/platform'

const props = withDefaults(
  defineProps<{
    uin?: string | number
    src?: string
    size?: number
    ring?: boolean
    platform?: string
  }>(),
  {
    size: 36,
    ring: false
  }
)

const emit = defineEmits<{ error: [] }>()

function handleAvatarError(): boolean {
  emit('error')
  return true
}

const avatarSrc = computed(() => {
  if (props.src)
    return props.src
  const u = String(props.uin ?? '').trim()
  return u ? `https://q1.qlogo.cn/g?b=qq&nk=${u}&s=100` : undefined
})

const iconClass = computed(() => getPlatformIcon(props.platform))
</script>

<template>
  <div class="relative">
    <a-avatar
      :size="size"
      :src="avatarSrc"
      :class="[props.ring ? 'shadow-md' : '']"
      @error="handleAvatarError"
    >
      <template #icon>
        <div class="i-streamline-emojis-man-farmer-1" :class="size >= 40 ? 'text-xl' : ''" />
      </template>
    </a-avatar>

    <div
      v-if="iconClass && platform"
      class="p-0.5 flex scale-80 items-center justify-center absolute bg-primary-bg rounded-md -bottom-0 -right-0.5"
      :style="{ transform: `scale(${(size || 36) / 36})`, transformOrigin: 'bottom right' }"
    >
      <i
        class="text-primary text-sm"
        :class="iconClass"
      />
    </div>
  </div>
</template>
