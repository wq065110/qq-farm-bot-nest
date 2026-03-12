<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { usePanelStore } from '@/stores'

defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
  regen: []
}>()

const panelStore = usePanelStore()
const { settings } = storeToRefs(panelStore)

const visible = ref(false)
const maskedValue = computed(() => (visible.value ? settings.value.remoteLoginKey : '•'.repeat(Math.min(24, settings.value.remoteLoginKey.length || 0))))

function toggleVisible() {
  visible.value = !visible.value
}

function handleSave() {
  emit('save')
}

function handleRegen() {
  emit('regen')
}
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4', header: '!min-h-11 !px-4' }">
    <template #title>
      <div class="flex gap-2 items-center justify-between">
        <div class="font-bold flex gap-2 items-center">
          <div class="i-carbon-key" />
          远程账户登陆密钥
        </div>
        <a-button type="primary" size="small" :loading="saving" @click="handleSave">
          保存密钥
        </a-button>
      </div>
    </template>

    <a-form layout="vertical">
      <a-form-item label="密钥">
        <a-input
          v-model:value="settings.remoteLoginKey"
          :type="visible ? 'text' : 'password'"
          placeholder="用于远程账户登录接口校验"
          autocomplete="off"
        >
          <template #suffix>
            <a-tooltip :title="visible ? '隐藏' : '显示'">
              <a-button type="text" size="small" @click="toggleVisible">
                <div :class="visible ? 'i-carbon-view-off' : 'i-carbon-view'" />
              </a-button>
            </a-tooltip>
          </template>
        </a-input>
        <div class="mt-1 a-color-text-tertiary text-xs">
          调用远程账户登录接口时，请在请求头携带 <code>X-Remote-Login-Key</code>。
        </div>
      </a-form-item>

      <div class="flex gap-2 items-center justify-between">
        <div class="a-color-text-tertiary text-xs">
          当前：<span class="font-mono">{{ maskedValue || '（空）' }}</span>
        </div>
        <a-button size="small" @click="handleRegen">
          生成新密钥
        </a-button>
      </div>
    </a-form>
  </a-card>
</template>
