<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useStrategyStore } from '@/stores'
import FertilizerBuyConfigCard from './FertilizerBuyConfigCard.vue'

const strategyStore = useStrategyStore()
const { settings } = storeToRefs(strategyStore)

watch(
  () => settings.value.automation.farm_manage,
  (enabled) => {
    settings.value.automation.farm_water = enabled
    settings.value.automation.farm_weed = enabled
    settings.value.automation.farm_bug = enabled
  }
)
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4', header: '!min-h-11 !px-4' }">
    <template #title>
      <div class="font-bold flex gap-2 items-center">
        <div class="i-streamline-emojis-dashing-away" />
        自动化开关
      </div>
    </template>

    <div class="space-y-5">
      <!-- 种植与农场 -->
      <fieldset>
        <legend class="tracking-wide font-medium mb-2 op-50 uppercase text-xs">
          种植 & 农场
        </legend>

        <div>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.farm_manage" size="small" />
            <span>农场管理</span>
          </label>
          <div class="mt-3 gap-x-6 gap-y-3 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch
                v-model:checked="settings.automation.farm_water"
                size="small"
                :disabled="!settings.automation.farm_manage"
              />
              <span :class="{ 'op-40': !settings.automation.farm_manage }">自动浇水</span>
            </label>
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch
                v-model:checked="settings.automation.farm_weed"
                size="small"
                :disabled="!settings.automation.farm_manage"
              />
              <span :class="{ 'op-40': !settings.automation.farm_manage }">自动除草</span>
            </label>
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch
                v-model:checked="settings.automation.farm_bug"
                size="small"
                :disabled="!settings.automation.farm_manage"
              />
              <span :class="{ 'op-40': !settings.automation.farm_manage }">自动杀虫</span>
            </label>
          </div>
          <div class="mt-3 gap-x-6 gap-y-3 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch v-model:checked="settings.automation.farm" size="small" />
              <span>自动种植收获</span>
            </label>
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch v-model:checked="settings.automation.farm_push" size="small" />
              <span>推送触发巡田</span>
            </label>
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch v-model:checked="settings.automation.land_upgrade" size="small" />
              <span>自动升级土地</span>
            </label>
            <label class="flex gap-2 cursor-pointer select-none items-center">
              <a-switch v-model:checked="settings.automation.sell" size="small" />
              <span>自动卖果实</span>
            </label>
          </div>
        </div>
      </fieldset>

      <!-- 化肥 -->
      <fieldset>
        <legend class="tracking-wide font-medium mb-2 op-50 uppercase text-xs">
          化肥
        </legend>
        <div class="gap-x-6 gap-y-3 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.fertilizer_gift" size="small" />
            <span>自动填充化肥</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.fertilizer_buy" size="small" />
            <span>自动购买化肥</span>
          </label>
        </div>
        <div v-if="settings.automation.fertilizer_buy" class="mt-3">
          <FertilizerBuyConfigCard />
        </div>
      </fieldset>

      <!-- 好友互动 -->
      <fieldset>
        <legend class="tracking-wide font-medium mb-2 op-50 uppercase text-xs">
          好友互动
        </legend>
        <label class="flex gap-2 cursor-pointer select-none items-center">
          <a-switch v-model:checked="settings.automation.friend" size="small" />
          <span>自动好友互动</span>
        </label>
        <div v-if="settings.automation.friend" class="mt-3 gap-x-6 gap-y-3 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.friend_steal" size="small" />
            <span>偷菜</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.friend_help" size="small" />
            <span>帮忙</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.friend_bad" size="small" />
            <span>捣乱</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.friend_help_exp_limit" size="small" />
            <span>经验上限停帮</span>
          </label>
        </div>
      </fieldset>

      <!-- 每日任务 & 奖励 -->
      <fieldset>
        <legend class="tracking-wide font-medium mb-2 op-50 uppercase text-xs">
          每日任务 & 奖励
        </legend>
        <div class="gap-x-6 gap-y-3 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.task" size="small" />
            <span>自动做任务</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.email" size="small" />
            <span>自动领取邮件</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.free_gifts" size="small" />
            <span>自动商城礼包</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.share_reward" size="small" />
            <span>自动分享奖励</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.vip_gift" size="small" />
            <span>自动VIP礼包</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.month_card" size="small" />
            <span>自动月卡奖励</span>
          </label>
          <label class="flex gap-2 cursor-pointer select-none items-center">
            <a-switch v-model:checked="settings.automation.open_server_gift" size="small" />
            <span>自动开服红包</span>
          </label>
        </div>
      </fieldset>
    </div>
  </a-card>
</template>
