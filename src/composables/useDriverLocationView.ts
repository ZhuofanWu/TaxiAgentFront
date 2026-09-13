import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useDriverLocationStore } from '@/stores/driverLocation'
import { useAmapLocationMap } from '@/composables/useAmapLocationMap'
import { loadAmap, loadAmapPlugins, normalizeLngLatTuple } from '@/utils/amap'
import type { AMapStatic, LngLatTuple } from '@/utils/amap'

/** 未设置位置时的地图初始中心（天安门），与顾客端保持一致的兜底 */
const DEFAULT_CENTER: LngLatTuple = [116.397428, 39.90923]

/**
 * 司机"当前位置"页面逻辑
 *
 * 页面本身只做绑定：地图选点、逆地理编码取地址、上线/离线开关都收在这里。
 */
export function useDriverLocationView(mapEl: Ref<HTMLDivElement | null>) {
  const message = useMessage()
  const store = useDriverLocationStore()

  const address = ref('')
  const geocoding = ref(false)

  const { mapBooting, pickMode, bootstrapMap, syncMarker, togglePickMode, disablePickMode } =
    useAmapLocationMap(mapEl, {
      fallbackCenter: DEFAULT_CENTER,
      onPick: async (lng, lat) => {
        // 已在线时这一步会顺带立即上报，不必等下一个心跳
        await store.setLocation(lng, lat)
        disablePickMode()
        message.success(store.online ? '位置已更新并上报' : '位置已设置，打开上线开关后生效')
        await resolveAddress(lng, lat)
      },
    })

  const showSpinner = computed(() => store.loading || mapBooting.value)

  const displayAddress = computed(() => {
    if (geocoding.value) return '解析中...'
    if (address.value) return address.value
    if (store.hasLocation) return '已设置位置（解析地址失败）'
    return '尚未设置位置'
  })

  const onlineText = computed(() =>
    store.online ? '在线，正在接收附近订单' : '离线，不参与附近订单匹配',
  )

  async function resolveAddress(lng: number, lat: number): Promise<void> {
    geocoding.value = true
    try {
      const AMap = await loadAmap()
      address.value = await reverseGeocode(AMap, normalizeLngLatTuple(lng, lat))
    } catch {
      // 地址只是展示信息，解析失败不影响位置本身
      address.value = ''
    } finally {
      geocoding.value = false
    }
  }

  async function handleToggleOnline(next: boolean): Promise<void> {
    if (next) {
      const ok = await store.goOnline()
      if (ok) {
        message.success('已上线，正在接收附近订单')
      } else {
        message.error(store.lastError ?? '上线失败')
      }
      return
    }
    await store.goOffline()
    message.success('已下线')
  }

  function handleTogglePickMode(): void {
    if (!togglePickMode()) {
      message.error('地图尚未就绪')
    }
  }

  onMounted(async () => {
    // 先恢复后端状态：页面刷新后开关与标记要与服务端一致
    await store.syncStatus()

    // 未设置过位置时必须传 null：bootstrapMap 只要收到非空中心就会顺手插一个标记，
    // 传兜底中心会让地图上凭空出现一个并不存在的"当前位置"。
    const center = store.location
      ? normalizeLngLatTuple(store.location.lng, store.location.lat)
      : null
    try {
      await bootstrapMap(center)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '地图初始化失败')
    }

    if (store.location) {
      await resolveAddress(store.location.lng, store.location.lat)
    }
  })

  watch(
    () => store.location,
    (loc) => {
      if (!loc) return
      syncMarker(normalizeLngLatTuple(loc.lng, loc.lat))
    },
    { immediate: true },
  )

  return {
    store,
    pickMode,
    showSpinner,
    displayAddress,
    onlineText,
    handleToggleOnline,
    handleTogglePickMode,
  }
}

function reverseGeocode(AMap: AMapStatic, lnglat: LngLatTuple): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    void loadAmapPlugins(AMap, ['AMap.Geocoder']).then(() => {
      const geocoder = new AMap.Geocoder({ radius: 1000, extensions: 'base' })
      geocoder.getAddress(lnglat, (status, result) => {
        if (status !== 'complete') {
          reject(new Error('逆地理编码失败'))
          return
        }
        const parsed = parseFormattedAddress(result)
        if (!parsed) {
          reject(new Error('逆地理编码失败'))
          return
        }
        resolve(parsed)
      })
    })
  })
}

function parseFormattedAddress(result: unknown): string | null {
  if (!isRecord(result) || !isRecord(result.regeocode)) return null
  const raw = result.regeocode.formattedAddress
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
