<script setup lang="ts">
import { BRAND_PLUS, BRAND_TITLE } from '../constants'

defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div
    class="brand-header border-b border-b-solid flex shrink-0 h-12 items-center a-border-b-border-sec"
    :class="collapsed ? 'justify-center px-2' : 'gap-2 px-4'"
  >
    <div class="brand-icon flex items-center justify-center relative">
      <img src="/icon.ico" alt="" class="shrink-0 h-8 w-8">
    </div>
    <template v-if="!collapsed">
      <span class="brand-title tracking-wide font-bold font-serif whitespace-nowrap text-lg">{{ BRAND_TITLE }}</span>
      <span class="brand-plus">{{ BRAND_PLUS }}</span>
      <span class="brand-sparkle i-streamline-emojis-sparkles" />
    </template>
  </div>
</template>

<style scoped>
.brand-icon {
  isolation: isolate;
}

.brand-leaf {
  position: absolute;
  right: -4px;
  bottom: -2px;
  font-size: 14px;
  z-index: 1;
  animation: leaf-sway 3s ease-in-out infinite;
  transform-origin: bottom center;
}

@keyframes leaf-sway {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
}

.brand-title {
  background: linear-gradient(
    135deg,
    var(--ant-color-primary-active) 0%,
    var(--ant-color-primary) 50%,
    var(--ant-color-primary-active) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-plus {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  height: 16px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  border-radius: 9px;
  background: var(--ant-green-7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #fff;
  animation: badge-bounce 3s ease-in-out infinite;
}

@keyframes badge-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-2px);
  }
  60% {
    transform: translateY(0);
  }
}

.brand-sparkle {
  font-size: 16px;
  animation: sparkle-pulse 2.4s ease-in-out infinite;
}

@keyframes sparkle-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.85) rotate(-10deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.15) rotate(10deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-sparkle,
  .brand-leaf,
  .brand-plus {
    animation: none;
  }

  .brand-sparkle {
    opacity: 0.7;
  }

  .brand-leaf {
    transform: rotate(0);
  }
}

:deep(.dark) .brand-title,
.dark .brand-title {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #6ee7b7 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.dark) .brand-plus,
.dark .brand-plus {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #6ee7b7 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(74, 222, 128, 0.3);
  color: #052e16;
}
</style>
