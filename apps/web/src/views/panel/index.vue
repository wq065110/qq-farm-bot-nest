<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePanelStore } from '@/stores'
import message from '@/utils/message'
import OfflineReminderCard from './components/OfflineReminderCard.vue'
import PasswordCard from './components/PasswordCard.vue'
import RemoteLoginKeyCard from './components/RemoteLoginKeyCard.vue'
import RuntimeClientCard from './components/RuntimeClientCard.vue'

const panelStore = usePanelStore()
const { querySettings, changeAdminPassword, saveOfflineConfig, saveRemoteLoginKey, saveRuntimeClientConfig } = panelStore

const passwordSaving = ref(false)
const offlineSaving = ref(false)
const remoteSaving = ref(false)
const runtimeSaving = ref(false)

const passwordForm = ref({
  old: '',
  new: '',
  confirm: ''
})

async function handleChangePassword() {
  if (!passwordForm.value.old || !passwordForm.value.new) {
    message.error('请填写完整')
    return
  }
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    message.error('两次密码输入不一致')
    return
  }
  if (passwordForm.value.new.length < 4) {
    message.error('密码长度至少4位')
    return
  }

  passwordSaving.value = true
  try {
    const res = await changeAdminPassword(passwordForm.value.old, passwordForm.value.new)

    if (res.ok) {
      message.success('密码修改成功')
      passwordForm.value = { old: '', new: '', confirm: '' }
    } else {
      message.error(`修改失败: ${res.error || '未知错误'}`)
    }
  } finally {
    passwordSaving.value = false
  }
}

async function handleSaveOffline() {
  offlineSaving.value = true
  try {
    const res = await saveOfflineConfig()

    if (res.ok) {
      message.success('下线提醒设置已保存')
    } else {
      message.error(`保存失败: ${res.error || '未知错误'}`)
    }
  } finally {
    offlineSaving.value = false
  }
}

async function handleSaveRemoteKey() {
  remoteSaving.value = true
  try {
    const res = await saveRemoteLoginKey()
    if (res.ok)
      message.success('远程登陆密钥已保存')
    else
      message.error(`保存失败: ${res.error || '未知错误'}`)
  } finally {
    remoteSaving.value = false
  }
}

async function handleSaveRuntimeClient() {
  runtimeSaving.value = true
  try {
    const res = await saveRuntimeClientConfig()
    if (res.ok)
      message.success('运行时连接配置已保存，运行中账号将自动重连生效')
    else
      message.error(`保存失败: ${res.error || '未知错误'}`)
  } finally {
    runtimeSaving.value = false
  }
}

function handleRegenRemoteKey() {
  // 生成一个新的随机值（前端展示用），最终以保存为准
  panelStore.settings.remoteLoginKey = (globalThis.crypto?.randomUUID?.() || String(Date.now()))
}

onMounted(() => {
  querySettings()
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="font-bold flex gap-2 items-center a-color-text">
      <div class="i-streamline-emojis-woman-mechanic-2 text-lg" />
      <span class="text-pretty text-lg">面板设置</span>
    </div>

    <div class="flex flex-col gap-3">
      <!-- 安全 & 认证 -->
      <PasswordCard
        v-model:password-form="passwordForm"
        :saving="passwordSaving"
        @submit="handleChangePassword"
      />
      <RemoteLoginKeyCard
        :saving="remoteSaving"
        @save="handleSaveRemoteKey"
        @regen="handleRegenRemoteKey"
      />

      <!-- 连接配置 -->
      <RuntimeClientCard
        :saving="runtimeSaving"
        @save="handleSaveRuntimeClient"
      />

      <!-- 通知 -->
      <OfflineReminderCard
        :saving="offlineSaving"
        @save="handleSaveOffline"
      />
    </div>
  </div>
</template>
