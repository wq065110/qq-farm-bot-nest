<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePanelStore } from '@/stores'

defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
}>()

function handleSave() {
  emit('save')
}

const panelStore = usePanelStore()
const { settings } = storeToRefs(panelStore)
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4', header: '!min-h-11 !px-4' }">
    <template #title>
      <div class="flex gap-2 items-center justify-between">
        <div class="font-bold flex gap-2 items-center">
          <div class="i-streamline-emojis-electric-plug" />
          运行时连接配置
        </div>
        <a-button type="primary" size="small" :loading="saving" @click="handleSave">
          保存连接配置
        </a-button>
      </div>
    </template>

    <a-form layout="vertical">
      <!-- 服务器 & 客户端 -->
      <div class="gap-x-3 grid grid-cols-1 md:grid-cols-3">
        <a-form-item label="游戏服务器地址">
          <a-input
            v-model:value="settings.runtimeClient.serverUrl"
            placeholder="如 wss://gate-obt.nqf.qq.com/prod/ws…"
            autocomplete="off"
            :spellcheck="false"
          />
        </a-form-item>
        <a-form-item label="客户端版本">
          <a-input
            v-model:value="settings.runtimeClient.clientVersion"
            placeholder="如 1.7.0.5_20260306…"
            autocomplete="off"
            :spellcheck="false"
          />
        </a-form-item>
        <a-form-item label="操作系统">
          <a-select
            v-model:value="settings.runtimeClient.os"
            :options="[
              { label: 'iOS', value: 'iOS' },
              { label: 'Android', value: 'Android' },
              { label: '其他', value: 'Other' }
            ]"
          />
        </a-form-item>
      </div>

      <!-- 设备信息 -->
      <div class="gap-x-3 grid grid-cols-1 md:grid-cols-2">
        <a-form-item label="系统版本">
          <a-input
            v-model:value="settings.runtimeClient.deviceInfo.sysSoftware"
            placeholder="如 iOS 26.2.1…"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item label="网络类型">
          <a-input
            v-model:value="settings.runtimeClient.deviceInfo.network"
            placeholder="如 wifi…"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item label="内存 (MB)">
          <a-input
            v-model:value="settings.runtimeClient.deviceInfo.memory"
            placeholder="如 7672…"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item label="设备标识">
          <a-input
            v-model:value="settings.runtimeClient.deviceInfo.deviceId"
            placeholder="如 iPhone X…"
            autocomplete="off"
          />
        </a-form-item>
      </div>

      <div class="mt-2 a-color-text-tertiary text-xs">
        保存后，运行中的账号会自动重连以使用新的连接参数。
      </div>
    </a-form>
  </a-card>
</template>
