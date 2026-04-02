export type LngLatTuple = [number, number]

export type AMapMarkerAnchor =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'top-left'
  | 'top-center'
  | 'top-right'

export interface AMapMap {
  on(event: string, handler: (e: unknown) => void): void
  off(event: string, handler: (e: unknown) => void): void
  setCenter(center: LngLatTuple): void
  setZoom(zoom: number): void
  setFitView(overlays?: Array<unknown>, animate?: boolean, options?: { padding?: number[] }): void
  getCenter(): unknown
  destroy(): void
}

export interface AMapMarker {
  setPosition(position: LngLatTuple): void
  setMap(map: AMapMap | null): void
  setIcon?: (icon: string) => void
  setzIndex?: (zIndex: number) => void
  on?: (event: string, handler: (e: unknown) => void) => void
  off?: (event: string, handler: (e: unknown) => void) => void
}

export interface AMapPolyline {
  setPath(path: LngLatTuple[]): void
  setOptions(options: {
    strokeColor?: string
    strokeWeight?: number
    strokeOpacity?: number
    lineJoin?: string
    lineCap?: string
    isOutline?: boolean
    outlineColor?: string
    borderWeight?: number
    showDir?: boolean
  }): void
  setMap(map: AMapMap | null): void
}

export interface AMapDriving {
  search(start: LngLatTuple, end: LngLatTuple, cb: (status: string, result: unknown) => void): void
  search(
    start: LngLatTuple,
    end: LngLatTuple,
    options: Record<string, unknown>,
    cb: (status: string, result: unknown) => void,
  ): void
  setRouteIndex?: (index: number) => void
  clear?: () => void
}

export interface AMapPlaceSearch {
  search(keyword: string, cb: (status: string, result: unknown) => void): void
  clear?: () => void
  on?: (event: string, handler: (event: unknown) => void) => void
}

export interface AMapGeocoder {
  getAddress(lnglat: LngLatTuple, cb: (status: string, result: unknown) => void): void
  getLocation(address: string, cb: (status: string, result: unknown) => void): void
}

export interface AMapGeolocation {
  getCurrentPosition(cb: (status: string, result: unknown) => void): void
}

export interface AMapStatic {
  Map: new (
    container: HTMLElement,
    options?: {
      zoom?: number
      center?: LngLatTuple
    },
  ) => AMapMap
  Marker: new (options: {
    position: LngLatTuple
    icon?: string
    anchor?: AMapMarkerAnchor
  }) => AMapMarker
  Polyline: new (options: {
    path: LngLatTuple[]
    strokeColor?: string
    strokeWeight?: number
    strokeOpacity?: number
    lineJoin?: string
    lineCap?: string
    isOutline?: boolean
    outlineColor?: string
    borderWeight?: number
    showDir?: boolean
  }) => AMapPolyline
  Driving: new (options?: {
    policy?: number
    strategy?: number
    map?: AMapMap
    autoFitView?: boolean
    showTraffic?: boolean
    extensions?: string
    hideMarkers?: boolean
  }) => AMapDriving
  PlaceSearch: new (options?: {
    pageSize?: number
    pageIndex?: number
    city?: string
    extensions?: string
    map?: AMapMap
    panel?: HTMLElement | string
    autoFitView?: boolean
  }) => AMapPlaceSearch
  Geocoder: new (options?: { radius?: number; extensions?: string }) => AMapGeocoder
  Geolocation: new (options?: Record<string, unknown>) => AMapGeolocation
  plugin: (plugins: string | string[], cb: () => void) => void
}

let amapPromise: Promise<AMapStatic> | null = null

export function loadAmap(): Promise<AMapStatic> {
  if (amapPromise) return amapPromise

  amapPromise = new Promise<AMapStatic>((resolve, reject) => {
    const key = getEnvString('VITE_AMAP_KEY')
    const securityJsCode = getEnvString('VITE_AMAP_SAFE_SECRET')
    if (!key || !securityJsCode) {
      reject(new Error('Missing AMap env vars: VITE_AMAP_KEY / VITE_AMAP_SAFE_SECRET'))
      return
    }

    const w = window as Window & {
      AMap?: unknown
      _AMapSecurityConfig?: {
        securityJsCode: string
      }
    }

    if (w.AMap) {
      resolve(w.AMap as AMapStatic)
      return
    }

    w._AMapSecurityConfig = { securityJsCode }

    const scriptId = 'amap-jsapi-2'
    const existing = document.getElementById(scriptId)
    if (existing) {
      existing.addEventListener('load', () => {
        const amap = (w.AMap ?? null) as AMapStatic | null
        if (!amap) {
          reject(new Error('AMap loaded but window.AMap is missing'))
          return
        }
        resolve(amap)
      })
      existing.addEventListener('error', () => reject(new Error('Failed to load AMap JSAPI')))
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.Geolocation,AMap.Geocoder`
    script.onload = () => {
      const amap = (w.AMap ?? null) as AMapStatic | null
      if (!amap) {
        reject(new Error('AMap loaded but window.AMap is missing'))
        return
      }
      resolve(amap)
    }
    script.onerror = () => reject(new Error('Failed to load AMap JSAPI'))
    document.head.appendChild(script)
  })

  return amapPromise
}

export function loadAmapPlugins(AMap: AMapStatic, plugins: string[]): Promise<void> {
  return new Promise<void>((resolve) => {
    AMap.plugin(plugins, () => resolve())
  })
}

export function normalizeLngLatTuple(lng: number, lat: number): LngLatTuple {
  return [lng, lat]
}

export function parseLngLatFromUnknown(input: unknown): { lng: number; lat: number } | null {
  if (typeof input === 'string' && input.includes(',')) {
    const [lngRaw, latRaw] = input.split(',').map((value) => value.trim())
    const lng = toFiniteNumber(lngRaw)
    const lat = toFiniteNumber(latRaw)
    if (lng == null || lat == null) return null
    return { lng, lat }
  }

  if (Array.isArray(input) && input.length >= 2) {
    const lng = toFiniteNumber(input[0])
    const lat = toFiniteNumber(input[1])
    if (lng == null || lat == null) return null
    return { lng, lat }
  }

  if (!isRecord(input)) return null

  const lng = toFiniteNumber(input.lng) ?? toFiniteNumber(callMaybeNumber(input.getLng))
  const lat = toFiniteNumber(input.lat) ?? toFiniteNumber(callMaybeNumber(input.getLat))

  if (lng == null || lat == null) return null
  return { lng, lat }
}

export function getEnvString(key: 'VITE_AMAP_KEY' | 'VITE_AMAP_SAFE_SECRET'): string | undefined {
  const raw = import.meta.env[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function callMaybeNumber(fn: unknown): unknown {
  if (typeof fn !== 'function') return undefined
  try {
    return (fn as () => unknown)()
  } catch {
    return undefined
  }
}
