import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDriverLocation, reportDriverLocation, setDriverOffline } from '@/api/order'

/**
 * 心跳间隔
 *
 * 后端的心跳有效期为 60 秒，这里每 20 秒重发一次，可容忍连续两次丢包；
 * 司机关掉页面后最迟 60 秒就会从在线池里消失。
 */
const HEARTBEAT_INTERVAL_MS = 20000

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message || '未知错误'
  if (typeof e === 'string') return e
  return '未知错误'
}

/**
 * 司机在线位置
 *
 * 心跳刻意放在 store 而不是组件里：司机在司机端内切换页面时组件会被卸载，
 * 若定时器挂在组件上，切一次页面就掉线了。
 */
export const useDriverLocationStore = defineStore('driverLocation', () => {
  const online = ref(false)
  const location = ref<{ lng: number; lat: number } | null>(null)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  const hasLocation = computed(() => location.value !== null)

  /** 从后端恢复在线状态与位置（页面刷新 / 重新进入时调用） */
  async function syncStatus(): Promise<void> {
    try {
      const status = await getDriverLocation()
      applyStatus(status)
      if (status.online) {
        startHeartbeat()
      }
    } catch (e: unknown) {
      lastError.value = toErrorMessage(e)
    }
  }

  /** 设置当前位置；若已在线则立即上报一次，无需等下一个心跳 */
  async function setLocation(lng: number, lat: number): Promise<void> {
    location.value = { lng, lat }
    if (online.value) {
      await reportOnce()
    }
  }

  /** 上线：上报一次并启动心跳 */
  async function goOnline(): Promise<boolean> {
    if (!location.value) {
      lastError.value = '请先在地图上设置当前位置'
      return false
    }
    loading.value = true
    try {
      const ok = await reportOnce()
      if (ok) {
        online.value = true
        startHeartbeat()
      }
      return ok
    } finally {
      loading.value = false
    }
  }

  /** 离线：停掉心跳并通知后端立即摘除，不必等心跳过期 */
  async function goOffline(): Promise<boolean> {
    stopHeartbeat()
    loading.value = true
    try {
      await setDriverOffline()
      online.value = false
      lastError.value = null
      return true
    } catch (e: unknown) {
      // 请求失败也要把本地状态切到离线：后端最迟 60 秒后自然过期，
      // 若这里保留"在线"，界面会显示一个不存在的在线状态。
      online.value = false
      lastError.value = toErrorMessage(e)
      return false
    } finally {
      loading.value = false
    }
  }

  /** 单次上报（心跳的实体） */
  async function reportOnce(): Promise<boolean> {
    if (!location.value) return false
    try {
      await reportDriverLocation({ lng: location.value.lng, lat: location.value.lat })
      lastError.value = null
      return true
    } catch (e: unknown) {
      // 心跳失败不自动下线：一次网络抖动不该让司机掉出在线池，
      // 真正的兜底是后端的心跳有效期。
      lastError.value = toErrorMessage(e)
      return false
    }
  }

  function startHeartbeat(): void {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      void reportOnce()
    }, HEARTBEAT_INTERVAL_MS)
  }

  function stopHeartbeat(): void {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function applyStatus(status: { online: boolean; lng?: number | null; lat?: number | null }): void {
    online.value = status.online
    if (status.online && status.lng != null && status.lat != null) {
      location.value = { lng: status.lng, lat: status.lat }
    }
  }

  return {
    online,
    location,
    loading,
    lastError,
    hasLocation,
    syncStatus,
    setLocation,
    goOnline,
    goOffline,
    stopHeartbeat,
  }
})
