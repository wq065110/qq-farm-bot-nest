<script setup lang="ts">
import { ref } from 'vue'
import { useWs } from '@/composables/useWs'
import { usePanelStore } from '@/stores'
import message from '@/utils/message'
import OfflineReminderCard from './components/OfflineReminderCard.vue'
import PasswordCard from './components/PasswordCard.vue'

const panelStore = usePanelStore()

const passwordSaving = ref(false)
const offlineSaving = ref(false)

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
    const res = await panelStore.changeAdminPassword(passwordForm.value.old, passwordForm.value.new)

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
    const res = await panelStore.saveOfflineConfig()

    if (res.ok) {
      message.success('下线提醒设置已保存')
    } else {
      message.error(`保存失败: ${res.error || '未知错误'}`)
    }
  } finally {
    offlineSaving.value = false
  }
}

useWs()
  .topic('panel')
  .on('panel.update', panelStore.applyPanelUpdate)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="font-bold flex gap-2 items-center a-color-text">
      <div class="i-streamline-emojis-nut-and-bolt text-lg"  />
      <span class="text-lg">面板设置</span>
    </div>
    <div class="flex shrink-0 flex-col gap-3">
      <PasswordCard
        v-model:password-form="passwordForm"
        :saving="passwordSaving"
        @submit="handleChangePassword"
      />
      <OfflineReminderCard
        :saving="offlineSaving"
        @save="handleSaveOffline"
      />
    </div>
  </div>
</template>
