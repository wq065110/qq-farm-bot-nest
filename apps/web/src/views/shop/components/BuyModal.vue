<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface SeedPayload {
  seedId: number
  goodsId: number
  name: string
  price: number
  requiredLevel?: number
  image?: string
  locked: boolean
  soldOut: boolean
}

const props = defineProps<{
  open: boolean
  seed: SeedPayload | null
  loading: boolean
  imageError: boolean
}>()

const emit = defineEmits<{
  confirm: [count: number]
  cancel: []
  imageError: []
}>()

const count = ref(1)

const totalPrice = computed(() => {
  if (!props.seed)
    return 0
  return props.seed.price * count.value
})

watch(() => props.open, (open) => {
  if (open)
    count.value = 1
})

function handleConfirm(): void {
  emit('confirm', count.value)
}

function handleCancel(): void {
  emit('cancel')
}

function handleImageError(): void {
  emit('imageError')
}
</script>

<template>
  <a-modal
    :open="open"
    title="确认购买"
    :width="400"
    centered
    :mask-closable="!loading"
    :ok-loading="loading"
    ok-text="确认购买"
    cancel-text="取消"
    :ok-button-props="{ disabled: loading }"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div v-if="seed" class="flex flex-col gap-4">
      <div class="flex gap-3 items-center">
        <div class="flex shrink-0 h-16 w-16 items-center justify-center overflow-hidden a-bg-layout rounded-lg">
          <img
            v-if="seed.image && !imageError"
            :src="seed.image"
            width="48"
            height="48"
            class="h-12 w-12 object-contain"
            loading="lazy"
            :alt="seed.name || '种子'"
            @error="handleImageError"
          >
          <span v-else class="font-bold a-color-text-tertiary text-lg">{{ (seed.name || '种').slice(0, 1) }}</span>
        </div>
        <div class="flex flex-1 flex-col gap-3 min-w-0 items-start">
          <h3 class="font-medium flex-1 min-w-0 truncate a-color-text" :title="seed.name || `种子${seed.seedId}`">
            {{ seed.name || `种子${seed.seedId}` }}
          </h3>
          <span v-if="(seed.requiredLevel ?? 0) > 0" class="inline-flex gap-2 items-center">
            <span class="i-streamline-emojis-seedling"  />
            <span>Lv.{{ seed.requiredLevel ?? 0 }}</span>
          </span>
        </div>
      </div>

      <div class="px-3 py-3 space-y-2 a-bg-primary-bg rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="a-color-text-secondary">单价</span>
          <span class="flex gap-1 items-center a-color-warning">
            <span class="i-streamline-emojis-credit-card text-sm"  />
            {{ seed.price ?? 0 }} 金币
          </span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="a-color-text-secondary">数量</span>
          <a-input-number
            v-model:value="count"
            :min="1"
            :precision="0"
            size="small"
            class="w-24"
            aria-label="购买数量"
          />
        </div>
        <a-divider size="small" />
        <div class="pt-1 flex items-center justify-between text-sm">
          <span class="a-color-text-secondary">总计</span>
          <span class="font-bold flex gap-1 items-center a-color-warning">
            <span class="i-streamline-emojis-credit-card text-sm"  />
            {{ totalPrice }} 金币
          </span>
        </div>
      </div>
    </div>
  </a-modal>
</template>
