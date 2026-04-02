import { ref } from 'vue'
import { loadAmap, loadAmapPlugins, parseLngLatFromUnknown } from '@/utils/amap'
import type { AMapDriving, LngLatTuple } from '@/utils/amap'

export interface DriverRouteOption {
  id: string
  distance: number
  duration: number
  points: LngLatTuple[]
  polyline: string
}

export function useDriverRoutePlan() {
  const routeOptions = ref<DriverRouteOption[]>([])
  const planning = ref(false)
  const planError = ref<string | null>(null)

  async function planRoutes(start: LngLatTuple, end: LngLatTuple) {
    planning.value = true
    planError.value = null
    routeOptions.value = []
    try {
      const amap = await loadAmap()
      await loadAmapPlugins(amap, ['AMap.Driving'])
      const driving = new amap.Driving({ strategy: 10, extensions: 'all' })
      const options = await searchDrivingRoutes(driving, start, end)
      routeOptions.value = options
      if (options.length === 0) {
        planError.value = '暂无可用路线'
      }
    } catch (error) {
      planError.value = error instanceof Error ? error.message : '路径规划失败'
      routeOptions.value = []
    } finally {
      planning.value = false
    }
  }

  function clearRoutes() {
    routeOptions.value = []
    planError.value = null
  }

  return {
    routeOptions,
    planning,
    planError,
    planRoutes,
    clearRoutes,
  }
}

async function searchDrivingRoutes(
  driving: AMapDriving,
  start: LngLatTuple,
  end: LngLatTuple,
): Promise<DriverRouteOption[]> {
  const result = await runDrivingSearch(driving, start, end)
  return parseDrivingRoutes(result)
}

function runDrivingSearch(
  driving: AMapDriving,
  start: LngLatTuple,
  end: LngLatTuple,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    driving.search(start, end, { strategy: 10, extensions: 'all' }, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || '路径规划失败'))
        return
      }
      resolve(result)
    })
  })
}

function parseDrivingRoutes(result: unknown): DriverRouteOption[] {
  if (!isRecord(result)) return []
  const routes = Array.isArray(result.routes) ? result.routes : []
  if (routes.length === 0) return []

  const options: DriverRouteOption[] = []
  routes.forEach((route, index) => {
    if (!isRecord(route)) return
    const points = parseRoutePoints(route)
    if (points.length < 2) return
    const distance = resolveNumber(route.distance) ?? 0
    const duration = resolveNumber(route.time) ?? 0
    options.push({
      id: `route-${index + 1}`,
      distance,
      duration,
      points,
      polyline: formatPolyline(points),
    })
  })

  return options
}

function parseRoutePoints(route: Record<string, unknown>): LngLatTuple[] {
  const steps = Array.isArray(route.steps) ? route.steps : []
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

function formatPolyline(points: LngLatTuple[]): string {
  return points.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';')
}

function extractAmapErrorMessage(result: unknown): string | null {
  if (!isRecord(result)) return null
  const info = result.info
  if (typeof info === 'string' && info.trim()) return info.trim()
  const message = result.message
  if (typeof message === 'string' && message.trim()) return message.trim()
  return null
}

function resolveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
