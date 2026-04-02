import { onBeforeUnmount, ref, type Ref } from 'vue'
import { loadAmap, loadAmapPlugins, parseLngLatFromUnknown } from '@/utils/amap'
import type {
  AMapDriving,
  AMapMap,
  AMapMarker,
  AMapPlaceSearch,
  AMapPolyline,
  AMapStatic,
  LngLatTuple,
} from '@/utils/amap'
import type { PoiItem } from '@/composables/useAmapPoiSearch'

export type RouteStyle = 'preview' | 'traffic' | 'estimated'

export interface RideOrderMapOptions {
  onMoveEnd?: (center: LngLatTuple) => void
}

export function useRideOrderMap(
  mapEl: Ref<HTMLDivElement | null>,
  options: RideOrderMapOptions = {},
) {
  const mapBooting = ref(true)
  const mapError = ref<string | null>(null)

  const routeLineBaseOptions = {
    strokeOpacity: 1,
    lineJoin: 'round',
    lineCap: 'round',
    isOutline: true,
    outlineColor: '#ffffff',
    borderWeight: 1,
    showDir: true,
  }

  let AMap: AMapStatic | null = null
  let map: AMapMap | null = null
  let pickupMarker: AMapMarker | null = null
  let dropoffMarker: AMapMarker | null = null
  let routeLine: AMapPolyline | null = null
  let driving: AMapDriving | null = null
  let drivingDisplay: AMapDriving | null = null
  let moveEndHandler: (() => void) | null = null
  let placeSearch: AMapPlaceSearch | null = null
  let placeSearchPanel: HTMLElement | null = null
  let placeSearchSelectHandler: ((event: unknown) => void) | null = null
  let placeSearchSelectCallback: ((item: PoiItem) => void) | null = null

  const pickupIcon = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png'
  const dropoffIcon = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'

  async function bootstrapMap(initialCenter?: LngLatTuple | null) {
    mapBooting.value = true
    mapError.value = null

    try {
      AMap = await loadAmap()
      if (!mapEl.value) return

      const fallback: LngLatTuple = [116.397428, 39.90923]
      const center = initialCenter ?? fallback

      map = new AMap.Map(mapEl.value, {
        zoom: 16,
        center,
      })

      if (options.onMoveEnd) {
        moveEndHandler = () => {
          if (!map) return
          const center = map.getCenter()
          const parsed = parseLngLatFromUnknown(center)
          if (!parsed) return
          options.onMoveEnd?.([parsed.lng, parsed.lat])
        }
        map.on('moveend', moveEndHandler)
      }
    } catch (e: unknown) {
      mapError.value = e instanceof Error ? e.message : '地图初始化失败'
    } finally {
      mapBooting.value = false
    }
  }

  function setPickupPoint(point: LngLatTuple) {
    if (!map || !AMap) return

    if (!pickupMarker) {
      pickupMarker = new AMap.Marker({ position: point, icon: pickupIcon, anchor: 'bottom-center' })
      pickupMarker.setMap(map)
    } else {
      pickupMarker.setPosition(point)
    }

    map.setCenter(point)
  }

  function setDropoffPoint(point: LngLatTuple) {
    if (!map || !AMap) return

    if (!dropoffMarker) {
      dropoffMarker = new AMap.Marker({
        position: point,
        icon: dropoffIcon,
        anchor: 'bottom-center',
      })
      dropoffMarker.setMap(map)
    } else {
      dropoffMarker.setPosition(point)
    }
  }

  function setRoute(points: LngLatTuple[], style: RouteStyle) {
    if (!map || !AMap) return
    if (points.length < 2) return

    const { strokeColor, strokeWeight } = resolveRouteStyle(style)

    if (!routeLine) {
      routeLine = new AMap.Polyline({
        path: points,
        strokeColor,
        strokeWeight,
        ...routeLineBaseOptions,
      })
      routeLine.setMap(map)
    } else {
      routeLine.setPath(points)
      routeLine.setOptions({ strokeColor, strokeWeight, ...routeLineBaseOptions })
    }
  }

  function fitToPoints() {
    if (!map) return
    map.setFitView([pickupMarker, dropoffMarker, routeLine])
  }

  function clearRoute() {
    routeLine?.setMap(null)
    routeLine = null
  }

  async function planDrivingRoutes(start: LngLatTuple, end: LngLatTuple, strategy = 10) {
    if (!map) return
    if (!AMap) {
      AMap = await loadAmap()
    }
    await loadAmapPlugins(AMap, ['AMap.Driving'])

    if (!drivingDisplay) {
      drivingDisplay = new AMap.Driving({
        map,
        strategy,
        extensions: 'all',
        autoFitView: true,
        showTraffic: true,
      })
    }

    clearRoute()
    await runDrivingSearch(drivingDisplay, start, end, strategy)
    if (drivingDisplay.setRouteIndex) {
      drivingDisplay.setRouteIndex(0)
    }
  }

  function setDrivingRouteIndex(index: number) {
    if (!drivingDisplay?.setRouteIndex) return
    drivingDisplay.setRouteIndex(index)
  }

  function clearDrivingRoutes() {
    drivingDisplay?.clear?.()
  }

  function setRouteStyle(style: RouteStyle) {
    if (!routeLine) return
    const { strokeColor, strokeWeight } = resolveRouteStyle(style)
    routeLine.setOptions({ strokeColor, strokeWeight, ...routeLineBaseOptions })
  }

  function getCenter(): LngLatTuple | null {
    if (!map) return null
    const center = map.getCenter()
    const parsed = parseLngLatFromUnknown(center)
    if (!parsed) return null
    return [parsed.lng, parsed.lat]
  }

  function destroy() {
    if (map && moveEndHandler) {
      map.off('moveend', moveEndHandler)
    }
    map?.destroy()
    map = null
    pickupMarker = null
    dropoffMarker = null
    routeLine = null
    AMap = null
    driving = null
    drivingDisplay = null
    moveEndHandler = null
    placeSearch = null
    placeSearchPanel = null
    placeSearchSelectHandler = null
    placeSearchSelectCallback = null
  }

  async function planRoute(start: LngLatTuple, end: LngLatTuple, style: RouteStyle) {
    if (!map) return
    if (!AMap) {
      AMap = await loadAmap()
    }
    await loadAmapPlugins(AMap, ['AMap.Driving'])

    if (!driving) {
      driving = new AMap.Driving({})
    }

    const points = await searchDrivingRoute(driving, start, end)
    if (points.length < 2) {
      throw new Error('路径规划失败')
    }
    setRoute(points, style)
    fitToPoints()
  }

  async function searchPlace(
    keyword: string,
    panel: HTMLElement,
    onSelect?: (item: PoiItem) => void,
  ): Promise<PoiItem[]> {
    const trimmed = keyword.trim()
    if (!trimmed) return []
    if (!map) return []
    if (!AMap) {
      AMap = await loadAmap()
    }
    await loadAmapPlugins(AMap, ['AMap.PlaceSearch'])
    placeSearchSelectCallback = onSelect ?? null

    if (!placeSearch || placeSearchPanel !== panel) {
      placeSearchPanel = panel
      placeSearch = new AMap.PlaceSearch({
        pageSize: 8,
        pageIndex: 1,
        extensions: 'base',
        map,
        panel,
        autoFitView: true,
      })
      if (!placeSearchSelectHandler) {
        placeSearchSelectHandler = (event) => {
          const selected = parsePlaceSearchSelected(event)
          if (!selected || !placeSearchSelectCallback) return
          placeSearchSelectCallback(selected)
        }
      }
      placeSearch.on?.('selectChanged', placeSearchSelectHandler)
      placeSearch.on?.('markerClick', placeSearchSelectHandler)
      placeSearch.on?.('listElementClick', placeSearchSelectHandler)
    }

    if (!placeSearch) return []
    placeSearch.clear?.()
    const result = await runPlaceSearch(placeSearch, trimmed)
    return parsePoiList(result)
  }

  function clearPlaceSearch() {
    placeSearch?.clear?.()
    if (placeSearchPanel) {
      placeSearchPanel.innerHTML = ''
    }
  }

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    mapBooting,
    mapError,
    bootstrapMap,
    setPickupPoint,
    setDropoffPoint,
    setRoute,
    setRouteStyle,
    fitToPoints,
    planRoute,
    clearRoute,
    planDrivingRoutes,
    setDrivingRouteIndex,
    clearDrivingRoutes,
    getCenter,
    searchPlace,
    clearPlaceSearch,
    destroy,
  }
}

function resolveRouteStyle(style: RouteStyle): { strokeColor: string; strokeWeight: number } {
  if (style === 'traffic') {
    return { strokeColor: '#f97316', strokeWeight: 7 }
  }
  if (style === 'estimated') {
    return { strokeColor: '#22c55e', strokeWeight: 6 }
  }
  return { strokeColor: '#2563eb', strokeWeight: 6 }
}

function runDrivingSearch(
  driving: AMapDriving,
  start: LngLatTuple,
  end: LngLatTuple,
  strategy: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    driving.search(start, end, { strategy, extensions: 'all' }, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || '路径规划失败'))
        return
      }
      resolve()
    })
  })
}

async function searchDrivingRoute(
  driving: AMapDriving,
  start: LngLatTuple,
  end: LngLatTuple,
): Promise<LngLatTuple[]> {
  return new Promise<LngLatTuple[]>((resolve, reject) => {
    driving.search(start, end, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || '路径规划失败'))
        return
      }

      resolve(parseDrivingResult(result))
    })
  })
}

function parseDrivingResult(result: unknown): LngLatTuple[] {
  if (!isRecord(result)) return []
  const routes = Array.isArray(result.routes) ? result.routes : []
  if (routes.length === 0) return []
  const first = routes[0]
  if (!isRecord(first)) return []
  const steps = Array.isArray(first.steps) ? first.steps : []

  const points: LngLatTuple[] = []
  steps.forEach((step) => {
    if (!isRecord(step)) return
    if (Array.isArray(step.path)) {
      step.path.forEach((item) => {
        const parsed = parseLngLatFromUnknown(item)
        if (parsed) points.push([parsed.lng, parsed.lat])
      })
      return
    }

    if (typeof step.polyline === 'string') {
      parsePolyline(step.polyline).forEach((item) => points.push(item))
    }
  })

  return points
}

function parsePolyline(polyline: string): LngLatTuple[] {
  const segments = polyline.split(';')
  const points: LngLatTuple[] = []
  segments.forEach((segment) => {
    const parsed = parseLngLatFromUnknown(segment)
    if (parsed) points.push([parsed.lng, parsed.lat])
  })
  return points
}

function runPlaceSearch(searcher: AMapPlaceSearch, keyword: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    searcher.search(keyword, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || 'POI搜索失败'))
        return
      }
      resolve(result)
    })
  })
}

function parsePlaceSearchSelected(event: unknown): PoiItem | null {
  if (!isRecord(event)) return null
  const selected = event.selected
  if (isRecord(selected) && selected.data) {
    return parsePoiItem(selected.data, 0)
  }
  if (event.data) {
    return parsePoiItem(event.data, 0)
  }
  if (event.poi) {
    return parsePoiItem(event.poi, 0)
  }
  return null
}

function parsePoiList(result: unknown): PoiItem[] {
  if (!isRecord(result)) return []
  if (!isRecord(result.poiList)) return []
  const pois = result.poiList.pois
  if (!Array.isArray(pois)) return []

  const items: PoiItem[] = []
  pois.forEach((poi, index) => {
    const parsed = parsePoiItem(poi, index)
    if (parsed) items.push(parsed)
  })
  return items
}

function parsePoiItem(input: unknown, index: number): PoiItem | null {
  if (!isRecord(input)) return null
  const name = toText(input.name)
  const address = buildAddress(input)
  const location = parseLngLatFromUnknown(input.location)
  if (!name || !location) return null
  const id = toText(input.id) || `${name}-${index}`
  return {
    id,
    name,
    address,
    lng: location.lng,
    lat: location.lat,
  }
}

function buildAddress(input: Record<string, unknown>): string {
  const address = toText(input.address)
  if (address) return address
  const district = toText(input.district)
  if (district) return district
  const city = toText(input.cityname)
  return city || ''
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function extractAmapErrorMessage(result: unknown): string | null {
  if (!isRecord(result)) return null
  const info = result.info
  if (typeof info === 'string' && info.trim()) return info.trim()
  const message = result.message
  if (typeof message === 'string' && message.trim()) return message.trim()
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
