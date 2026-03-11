<script setup lang="ts">
import type { InteractActionMeta, InteractFilterKey, InteractRecord } from '../constants'
import { computed } from 'vue'
import { formatInteractTime } from '@/utils/formatInteractTime'
import {
  INTERACT_ACTION_META,
  INTERACT_FILTER_OPTIONS,
  INTERACT_FILTER_TO_ACTION_TYPE,
  VISIBLE_INTERACT_RECORDS_LIMIT
} from '../constants'

const props = withDefaults(
  defineProps<{
    records: InteractRecord[]
    loading?: boolean
    error?: string
    collapsed?: boolean
    filter?: InteractFilterKey
  }>(),
  { loading: false, error: '', collapsed: true, filter: 'all' }
)

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  'update:filter': [value: InteractFilterKey]
  'refresh': []
}>()

const DEFAULT_ACTION_META: InteractActionMeta = {
  color: 'default',
  icon: 'i-streamline-emojis-seedling',
  bgClass: 'a-color-text-tertiary'
}

const filteredRecords = computed(() => {
  if (props.filter === 'all')
    return props.records
  const actionType = INTERACT_FILTER_TO_ACTION_TYPE[props.filter] ?? 0
  return props.records.filter(r => Number(r.actionType) === actionType)
})

const visibleRecords = computed(() => filteredRecords.value.slice(0, VISIBLE_INTERACT_RECORDS_LIMIT))

function getActionMeta(actionType: number): InteractActionMeta {
  return INTERACT_ACTION_META[actionType] ?? DEFAULT_ACTION_META
}

function toggleCollapsed(): void {
  emit('update:collapsed', !props.collapsed)
  if (props.collapsed)
    emit('refresh')
}

function onRefresh(): void {
  emit('refresh')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div
      class="px-4 py-3 flex shrink-0 flex-col gap-3 cursor-pointer lg:flex-row lg:items-center lg:justify-between hover:a-bg-layout"
      @click="toggleCollapsed"
    >
      <div class="flex gap-3 items-center">
        <div
          class="flex h-10 w-10 items-center justify-center a-color-primary a-bg-primary-bg rounded-xl shadow-sm"
        >
          <div class="i-streamline-emojis-delivery-truck text-2xl" />
        </div>
        <div class="flex flex-col gap-0.5">
          <div class="flex gap-2 items-center">
            <div
              class="transition-transform duration-200 a-color-text-tertiary text-base"
              :class="collapsed ? 'i-carbon-chevron-right' : 'i-carbon-chevron-down'"
            />
            <h3 class="font-semibold a-color-text text-base">
              最近访客
            </h3>
            <a-tag size="small" color="orange" class="px-2 rounded-full flex gap-1 items-center">
              <div class="i-streamline-emojis-footprints text-xs" />
              {{ records.length }}
            </a-tag>
          </div>
          <p class="a-color-text-tertiary text-xs">
            <span>最近来你农场玩的小伙伴</span>
            <span>（仅展示最近 {{ visibleRecords.length }} 条）</span>
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 items-center" @click.stop>
        <div class="a-bg-fill-quaternary px-1 py-1 rounded-full flex gap-1">
          <button
            v-for="opt in INTERACT_FILTER_OPTIONS"
            :key="opt.key"
            type="button"
            class="px-2 py-1 rounded-full flex gap-1 cursor-pointer transition-colors duration-200 items-center text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            :class="filter === opt.key
              ? 'a-bg-container font-medium shadow-sm a-color-text'
              : 'a-color-text-tertiary hover:a-color-text'"
            :aria-pressed="filter === opt.key"
            @click="emit('update:filter', opt.key)"
          >
            <div :class="opt.icon" class="text-sm" />
            {{ opt.label }}
          </button>
        </div>
        <a-button
          size="small"
          type="text"
          :loading="loading"
          aria-label="刷新访客记录"
          class="flex items-center"
          @click="onRefresh"
        >
          <template #icon>
            <div class="i-streamline-emojis-rocket" />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <!-- Body -->
    <div v-show="!collapsed" class="border-t border-solid flex-1 min-h-0 overflow-y-auto a-border-t-border-sec">
      <a-spin :spinning="loading">
        <div
          v-if="visibleRecords.length === 0"
          class="py-12 flex flex-col gap-2 items-center a-color-text-tertiary"
        >
          <div class="i-streamline-emojis-desert text-3xl" />
          <span class="text-sm">最近还没有人来你农场玩～</span>
        </div>

        <div v-else class="a-divide-border-sec">
          <div
            v-for="(record, idx) in visibleRecords"
            :key="record.key"
            class="px-4 py-3 flex gap-3 items-center hover:a-bg-layout"
            :class="[idx > 0 ? 'border-t border-t-solid a-border-t-border-sec' : '']"
          >
            <!-- Action icon -->
            <QqAvatar
              :src="record.avatarUrl"
              :size="38"
              ring
              custom-class="shadow-sm"
              :custom-style="{ '--un-ring-color': 'var(--ant-color-bg-container)' }"
            />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap gap-1.5 items-center">
                <span class="font-semibold max-w-full truncate a-color-text text-sm">
                  {{ record.nick || `GID:${record.visitorGid}` }}
                </span>
                <i class="text-sm" :class="getActionMeta(record.actionType).icon" />
                <span
                  v-if="record.level"
                  class="text-[10px] font-medium px-1 py-px inline-flex items-center a-color-primary a-bg-primary-bg rounded"
                >
                  Lv.{{ record.level }}
                </span>
              </div>
              <div class="mt-0.5 line-clamp-2 a-color-text-tertiary text-xs">
                {{ record.actionDetail || record.actionLabel }}
              </div>
            </div>

            <!-- Time -->
            <div class="text-[11px] text-right shrink-0 a-color-text-tertiary">
              {{ formatInteractTime(record.serverTimeMs) }}
            </div>
          </div>
        </div>
      </a-spin>
    </div>
  </div>
</template>
