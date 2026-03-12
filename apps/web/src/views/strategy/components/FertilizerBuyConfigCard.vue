<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStrategyStore } from '@/stores'
import { FERTILIZER_BUY_MODE_OPTIONS, FERTILIZER_BUY_TYPE_OPTIONS } from '../constants'

const strategyStore = useStrategyStore()
const { settings } = storeToRefs(strategyStore)
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4 pt-2', header: '!min-h-8 !px-4' }">
    <template #title>
      <div class="font-bold flex gap-2 items-center">
        <div class="i-streamline-emojis-cactus-2" />
        购买化肥配置
      </div>
    </template>
    <div class="gap-x-3 grid grid-cols-1 md:grid-cols-2">
      <a-form layout="vertical">
        <a-form-item label="购买化肥类型">
          <a-select v-model:value="settings.fertilizerBuy.type" :options="FERTILIZER_BUY_TYPE_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="购买模式">
          <a-select v-model:value="settings.fertilizerBuy.mode" :options="FERTILIZER_BUY_MODE_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="单日最大购买轮次 (1-10)">
          <a-input-number v-model:value="settings.fertilizerBuy.max" :min="1" :max="10" style="width: 100%" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="容器阈值">
          <a-input-number
            v-model:value="settings.fertilizerBuy.threshold"
            :min="0"
            style="width: 100%"
            placeholder="0 表示容器空了再买"
          />
        </a-form-item>
      </a-form>
    </div>
    <div class="mt-1 space-y-1 a-color-text-tertiary text-xs">
      <p>· 阈值为 0 表示化肥容器为空时再购买。</p>
      <p>· 无限购买模式下同时勾选两种化肥会自动降级为仅一种类型。</p>
    </div>
  </a-card>
</template>
