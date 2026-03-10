<script setup lang="ts">
import { theme } from 'antdv-next'
import zhCN from 'antdv-next/locale/zh_CN'
import { storeToRefs } from 'pinia'
import { computed, watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const { isDark, themeTokens } = storeToRefs(appStore)

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
})

const themeConfig = computed(() => ({
  algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: { ...themeTokens.value }
}))
</script>

<template>
  <a-config-provider :theme="themeConfig" :locale="zhCN">
    <a-app>
      <RouterView />
    </a-app>
  </a-config-provider>
</template>
