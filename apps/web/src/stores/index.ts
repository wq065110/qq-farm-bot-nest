import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export { type Account, useAccountStore } from './modules/account'
export { useAnalyticsStore } from './modules/analytics'
export { useAppStore } from './modules/app'
export { useBagStore } from './modules/bag'
export { type Land, useFarmStore } from './modules/farm'
export { useFriendStore } from './modules/friend'
export { type OfflineReminderConfig, type UIConfig, usePanelStore } from './modules/panel'
export { useStatusStore } from './modules/status'
export { type AutomationConfig, type FriendQuietHoursConfig, type IntervalsConfig, useStrategyStore } from './modules/strategy'
export { useUserStore } from './modules/user'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
