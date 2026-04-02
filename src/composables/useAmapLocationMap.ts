import { onBeforeUnmount, ref, type Ref } from 'vue'
import { loadAmap, parseLngLatFromUnknown } from '@/utils/amap'
import type { AMapMap, AMapMarker, AMapStatic, LngLatTuple } from '@/utils/amap'

export interface UseAmapLocationMapOptions {
  fallbackCenter?: LngLatTuple
  onPick?: (lng: number, lat: number) => void | Promise<void>
}

export function useAmapLocationMap(
  mapEl: Ref<HTMLDivElement | null>,
  options: UseAmapLocationMapOptions = {},
) {
  const mapBooting = ref(true)
  const pickMode = ref(false)

  let AMap: AMapStatic | null = null
  let map: AMapMap | null = null
  let marker: AMapMarker | null = null
  let mapClickHandler: ((e: unknown) => void) | null = null

  async function bootstrapMap(initialCenter?: LngLatTuple | null) {
    mapBooting.value = true
    try {
      AMap = await loadAmap()
      if (!mapEl.value) return

      const fallback: LngLatTuple = options.fallbackCenter ?? [116.397428, 39.90923]
      const center = initialCenter ?? fallback

      map = new AMap.Map(mapEl.value, {
        zoom: 13,
        center,
      })

      if (initialCenter) {
        marker = new AMap.Marker({ position: initialCenter, anchor: 'bottom-center' })
        marker.setMap(map)
      }
    } finally {
      mapBooting.value = false
    }
  }

  function syncMarker(center: LngLatTuple) {
    if (!map || !AMap) return

    if (!marker) {
      marker = new AMap.Marker({ position: center, anchor: 'bottom-center' })
      marker.setMap(map)
    } else {
      marker.setPosition(center)
    }

    map.setCenter(center)
    map.setZoom(16)
  }

  function enablePickMode(): boolean {
    if (!map) return false
    pickMode.value = true

    if (mapClickHandler) return true
    mapClickHandler = async (e: unknown) => {
      const lnglat = parseMapClickLngLat(e)
      if (!lnglat) return
      await options.onPick?.(lnglat.lng, lnglat.lat)
    }
    map.on('click', mapClickHandler)
    return true
  }

  function disablePickMode() {
    pickMode.value = false
    if (!map || !mapClickHandler) return
    map.off('click', mapClickHandler)
    mapClickHandler = null
  }

  function togglePickMode(): boolean {
    if (pickMode.value) {
      disablePickMode()
      return true
    }
    return enablePickMode()
  }

  function destroy() {
    disablePickMode()
    map?.destroy()
    map = null
    marker = null
    AMap = null
  }

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    mapBooting,
    pickMode,
    bootstrapMap,
    syncMarker,
    enablePickMode,
    disablePickMode,
    togglePickMode,
    destroy,
  }
}

function parseMapClickLngLat(e: unknown): { lng: number; lat: number } | null {
  if (!isRecord(e)) return null
  return parseLngLatFromUnknown(e.lnglat)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
