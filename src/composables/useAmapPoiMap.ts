import { onBeforeUnmount, ref, type Ref } from 'vue'
import { loadAmap, loadAmapPlugins, parseLngLatFromUnknown } from '@/utils/amap'
import type {
  AMapGeocoder,
  AMapMap,
  AMapMarker,
  AMapPlaceSearch,
  AMapStatic,
  LngLatTuple,
} from '@/utils/amap'

export interface PoiMarkerItem {
  id: number
  position: LngLatTuple
}

export interface PoiSearchResult {
  id: string
  name: string
  address: string
  location: LngLatTuple
}

export interface UseAmapPoiMapOptions {
  onMarkerClick?: (id: number) => void
  onCenterChange?: (payload: { lng: number; lat: number; address?: string }) => void
  onGeocodeError?: (message: string) => void
}

export function useAmapPoiMap(
  mapEl: Ref<HTMLDivElement | null>,
  options: UseAmapPoiMapOptions = {},
) {
  const mapBooting = ref(true)
  const geocoding = ref(false)
  const editMode = ref(false)

  let AMap: AMapStatic | null = null
  let map: AMapMap | null = null
  let geocoder: AMapGeocoder | null = null
  let placeSearch: AMapPlaceSearch | null = null
  let dragEndHandler: ((e: unknown) => void) | null = null

  const markers = new Map<number, AMapMarker>()
  const markerPositions = new Map<number, LngLatTuple>()
  const markerClickHandlers = new Map<number, (e: unknown) => void>()
  let activePoiId: number | null = null

  const defaultIcon = createMarkerIcon('#3b82f6', 30, 40)
  const activeIcon = createMarkerIcon('#f97316', 36, 48)

  async function bootstrapMap(initialCenter?: LngLatTuple | null) {
    mapBooting.value = true
    try {
      AMap = await loadAmap()
      await loadAmapPlugins(AMap, ['AMap.Geocoder', 'AMap.PlaceSearch'])
      if (!mapEl.value) return

      const fallback: LngLatTuple = [116.397428, 39.90923]
      const center = initialCenter ?? fallback

      map = new AMap.Map(mapEl.value, {
        zoom: 13,
        center,
      })

      geocoder = new AMap.Geocoder({ radius: 1000, extensions: 'base' })
      placeSearch = new AMap.PlaceSearch({ pageSize: 8, pageIndex: 1, extensions: 'base' })

      bindDragHandler()
    } finally {
      mapBooting.value = false
    }
  }

  function setMarkers(items: PoiMarkerItem[]) {
    if (!AMap || !map) return
    const amap = AMap
    const mapInstance = map
    clearMarkers()

    items.forEach((item) => {
      const marker = new amap.Marker({
        position: item.position,
        icon: defaultIcon,
        anchor: 'bottom-center',
      })
      if (!editMode.value) {
        marker.setMap(mapInstance)
      }
      const handler = () => options.onMarkerClick?.(item.id)
      marker.on?.('click', handler)
      markers.set(item.id, marker)
      markerPositions.set(item.id, item.position)
      markerClickHandlers.set(item.id, handler)
    })

    refreshActiveMarker()
  }

  function setActivePoi(id: number | null) {
    activePoiId = id
    refreshActiveMarker()
    if (!map || id == null) return
    const position = markerPositions.get(id)
    if (!position) return
    map.setCenter(position)
    map.setZoom(16)
  }

  function setEditMode(enabled: boolean) {
    editMode.value = enabled
    markers.forEach((marker) => {
      marker.setMap(enabled ? null : map)
    })
  }

  function setCenter(center: LngLatTuple, zoom = 16) {
    if (!map) return
    map.setCenter(center)
    map.setZoom(zoom)
  }

  function getCenter(): LngLatTuple | null {
    if (!map) return null
    const parsed = parseLngLatFromUnknown(map.getCenter())
    if (!parsed) return null
    return [parsed.lng, parsed.lat]
  }

  async function reverseGeocode(center: LngLatTuple): Promise<string> {
    if (!AMap) throw new Error('地图尚未初始化')
    if (!geocoder) {
      geocoder = new AMap.Geocoder({ radius: 1000, extensions: 'base' })
    }

    return new Promise<string>((resolve, reject) => {
      geocoder?.getAddress(center, (status, result) => {
        if (status !== 'complete') {
          reject(new Error(extractAmapErrorMessage(result) || '解析地址失败'))
          return
        }
        const address = parseFormattedAddress(result)
        if (!address) {
          reject(new Error('解析地址失败'))
          return
        }
        resolve(address)
      })
    })
  }

  async function searchPlaces(keyword: string): Promise<PoiSearchResult[]> {
    if (!AMap) throw new Error('地图尚未初始化')
    if (!placeSearch) {
      placeSearch = new AMap.PlaceSearch({ pageSize: 8, pageIndex: 1, extensions: 'base' })
    }

    return new Promise<PoiSearchResult[]>((resolve) => {
      placeSearch?.search(keyword, (status, result) => {
        if (status !== 'complete') {
          resolve([])
          return
        }
        resolve(parseSearchResult(result))
      })
    })
  }

  function destroy() {
    clearMarkers()
    if (map && dragEndHandler) {
      map.off('dragend', dragEndHandler)
    }
    map?.destroy()
    map = null
    AMap = null
    geocoder = null
    placeSearch = null
    dragEndHandler = null
  }

  function bindDragHandler() {
    if (!map || dragEndHandler) return
    dragEndHandler = async () => {
      if (!editMode.value) return
      const center = getCenter()
      if (!center) return
      geocoding.value = true
      let address: string | undefined
      try {
        address = await reverseGeocode(center)
      } catch (e: unknown) {
        options.onGeocodeError?.(toErrorMessage(e))
      } finally {
        geocoding.value = false
      }
      options.onCenterChange?.({ lng: center[0], lat: center[1], address })
    }
    map.on('dragend', dragEndHandler)
  }

  function refreshActiveMarker() {
    markers.forEach((marker, id) => {
      const active = id === activePoiId
      marker.setIcon?.(active ? activeIcon : defaultIcon)
      marker.setzIndex?.(active ? 200 : 100)
    })
  }

  function clearMarkers() {
    markers.forEach((marker, id) => {
      marker.setMap(null)
      const handler = markerClickHandlers.get(id)
      if (handler) {
        marker.off?.('click', handler)
      }
    })
    markers.clear()
    markerPositions.clear()
    markerClickHandlers.clear()
  }

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    mapBooting,
    geocoding,
    editMode,
    bootstrapMap,
    setMarkers,
    setActivePoi,
    setEditMode,
    setCenter,
    getCenter,
    reverseGeocode,
    searchPlaces,
    destroy,
  }
}

function parseSearchResult(result: unknown): PoiSearchResult[] {
  if (!isRecord(result)) return []
  const list = result.poiList
  if (!isRecord(list) || !Array.isArray(list.pois)) return []
  return list.pois.flatMap((poi, index) => {
    if (!isRecord(poi)) return []
    const name = typeof poi.name === 'string' && poi.name.trim() ? poi.name.trim() : '未命名地点'
    const addressRaw = typeof poi.address === 'string' ? poi.address.trim() : ''
    const district = typeof poi.district === 'string' ? poi.district.trim() : ''
    const location = parseLngLatFromUnknown(poi.location)
    if (!location) return []
    const address = formatAddress(district, addressRaw) || name
    const id = typeof poi.id === 'string' && poi.id.trim() ? poi.id.trim() : `${name}-${index}`
    return [
      {
        id,
        name,
        address,
        location: [location.lng, location.lat],
      },
    ]
  })
}

function createMarkerIcon(color: string, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 30 40"><path fill="${color}" d="M15 0C8.4 0 3 5.4 3 12c0 9.1 11.2 26.5 11.6 27.2.2.4.6.8 1.4.8s1.2-.4 1.4-.8C15.8 38.5 27 21.1 27 12 27 5.4 21.6 0 15 0z"/><circle cx="15" cy="12" r="5" fill="#ffffff"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function parseFormattedAddress(result: unknown): string | null {
  if (!isRecord(result)) return null
  if (!isRecord(result.regeocode)) return null
  const raw = result.regeocode.formattedAddress
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return null
}

function extractAmapErrorMessage(result: unknown): string | null {
  if (!isRecord(result)) return null
  const info = result.info
  if (typeof info === 'string' && info.trim()) return info.trim()
  const message = result.message
  if (typeof message === 'string' && message.trim()) return message.trim()
  return null
}

function formatAddress(district: string, address: string): string {
  const parts = [district, address].filter((item) => item.trim())
  return parts.join('')
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message || 'Unknown error'
  if (typeof e === 'string') return e
  return 'Unknown error'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
