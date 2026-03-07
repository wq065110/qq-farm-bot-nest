<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface ItemPayload {
  id: number
  name: string
  count: number
  image?: string
  price?: number
  category?: string
}

const props = defineProps<{
  open: boolean
  item: ItemPayload | null
  loading: boolean
  imageError: boolean
}>()

const emit = defineEmits<{
  confirm: [count: number]
  cancel: []
  imageError: []
}>()

const count = ref(1)

const totalGold = computed(() => {
  if (!props.item || (props.item.price ?? 0) <= 0)
    return 0
  return (props.item.price ?? 0) * count.value
})

watch(() => props.open, (open) => {
  if (open && props.item)
    count.value = 1
})

watch(() => props.item, (item) => {
  if (item)
    count.value = Math.max(1, Math.min(count.value, item.count))
}, { immediate: true })

function handleConfirm(): void {
  emit('confirm', count.value)
}

function handleCancel(): void {
  emit('cancel')
}

function handleImageError(): void {
  emit('imageError')
}

function setMax(): void {
  if (props.item && props.item.count > 0)
    count.value = props.item.count
}
</script>

<template>
  <a-modal
    :open="open"
    title="确认售卖"
    :width="400"
    centered
    :mask-closable="!loading"
    :ok-loading="loading"
    ok-text="确认售卖"
    cancel-text="取消"
    :ok-button-props="{ disabled: loading }"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div v-if="item" class="flex flex-col gap-4">
      <div class="flex gap-3 items-center">
        <div class="flex shrink-0 h-16 w-16 items-center justify-center overflow-hidden a-bg-layout rounded-lg">
          <img
            v-if="item.image && !imageError"
            :src="item.image"
            width="48"
            height="48"
            class="h-12 w-12 object-contain"
            loading="lazy"
            :alt="item.name || '物品'"
            @error="handleImageError"
          >
          <span v-else class="font-bold a-color-text-tertiary text-lg">{{ (item.name || '物').slice(0, 1) }}</span>
        </div>
        <div class="flex flex-1 flex-col gap-1 min-w-0 items-start">
          <h3 class="font-medium flex-1 min-w-0 truncate a-color-text" :title="item.name || `物品${item.id}`">
            {{ item.name || `物品${item.id}` }}
          </h3>
          <span class="a-color-text-secondary text-sm">当前持有 · {{ item.count }} 个</span>
        </div>
      </div>

      <div class="px-3 py-3 space-y-2 a-bg-primary-bg rounded-lg">
        <div v-if="(item.price ?? 0) > 0" class="flex items-center justify-between text-sm">
          <span class="a-color-text-secondary">单价</span>
          <span class="flex gap-1 items-center a-color-warning">
            <span class="i-twemoji-coin text-sm" aria-hidden="true" />
            {{ item.price ?? 0 }} 金币
          </span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="a-color-text-secondary">售卖数量</span>
          <div class="flex gap-2 items-center">
            <a-input-number
              v-model:value="count"
              :min="1"
              :max="item.count"
              :precision="0"
              size="small"
              class="w-24"
              aria-label="售卖数量"
            />
            <a-button
              size="small"
              aria-label="设为最大数量"
              @click="setMax"
            >
              MAX
            </a-button>
          </div>
        </div>
        <template v-if="totalGold > 0">
          <a-divider size="small" />
          <div class="pt-1 flex items-center justify-between text-sm">
            <span class="a-color-text-secondary">预计获得</span>
            <span class="font-bold flex gap-1 items-center a-color-warning">
              <span class="i-twemoji-coin text-sm" aria-hidden="true" />
              {{ totalGold }} 金币
            </span>
          </div>
        </template>
      </div>
    </div>
  </a-modal>
</template>
