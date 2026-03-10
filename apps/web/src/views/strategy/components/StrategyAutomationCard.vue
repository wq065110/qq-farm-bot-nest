<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStrategyStore } from '@/stores'

const strategyStore = useStrategyStore()
const { settings } = storeToRefs(strategyStore)
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4', header: '!min-h-11 !px-4' }">
    <template #title>
      <div class="font-bold flex gap-2 items-center">
        <div class="i-streamline-emojis-dashing-away" />
        自动化开关
      </div>
    </template>
    <div class="gap-4 grid grid-cols-2 lg:grid-cols-5 md:grid-cols-4">
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.farm" size="small" />
        <span>自动种植收获</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.task" size="small" />
        <span>自动做任务</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.sell" size="small" />
        <span>自动卖果实</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.friend" size="small" />
        <span>自动好友互动</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.farm_push" size="small" />
        <span>推送触发巡田</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.land_upgrade" size="small" />
        <span>自动升级土地</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.email" size="small" />
        <span>自动领取邮件</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.free_gifts" size="small" />
        <span>自动商城礼包</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.share_reward" size="small" />
        <span>自动分享奖励</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.vip_gift" size="small" />
        <span>自动VIP礼包</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.month_card" size="small" />
        <span>自动月卡奖励</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.open_server_gift" size="small" />
        <span>自动开服红包</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.fertilizer_gift" size="small" />
        <span>自动填充化肥</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.fertilizer_buy" size="small" />
        <span>自动购买化肥</span>
      </label>
    </div>
    <div v-if="settings.automation.friend" class="mt-2 py-2 flex flex-wrap gap-6">
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.friend_steal" size="small" />
        <span>偷菜</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.friend_help" size="small" />
        <span>帮忙</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.friend_bad" size="small" />
        <span>捣乱</span>
      </label>
      <label class="flex gap-2 cursor-pointer items-center">
        <a-switch v-model:checked="settings.automation.friend_help_exp_limit" size="small" />
        <span>经验上限停帮</span>
      </label>
    </div>
  </a-card>
</template>
