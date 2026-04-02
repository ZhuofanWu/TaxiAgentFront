import { loadAmap, loadAmapPlugins, parseLngLatFromUnknown } from '@/utils/amap'
import type { AMapStatic, LngLatTuple } from '@/utils/amap'

export interface GeocodePoint {
  lng: number
  lat: number
  formattedAddress?: string
}

export function useAmapGeocoder() {
  async function reverseGeocode(lng: number, lat: number): Promise<string> {
    const AMap = await loadAmap()
    await loadAmapPlugins(AMap, ['AMap.Geocoder'])
    return reverseGeocodeWith(AMap, [lng, lat])
  }

  async function geocodeAddress(address: string): Promise<GeocodePoint> {
    const trimmed = address.trim()
    if (!trimmed) throw new Error('地址不能为空')
    const AMap = await loadAmap()
    await loadAmapPlugins(AMap, ['AMap.Geocoder'])
    return geocodeWith(AMap, trimmed)
  }

  return {
    reverseGeocode,
    geocodeAddress,
  }
}

async function reverseGeocodeWith(AMap: AMapStatic, lnglat: LngLatTuple): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: 'base',
    })

    geocoder.getAddress(lnglat, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || '逆地理解析失败'))
        return
      }

      const address = parseFormattedAddress(result)
      if (!address) {
        reject(new Error('逆地理解析失败'))
        return
      }

      resolve(address)
    })
  })
}

async function geocodeWith(AMap: AMapStatic, address: string): Promise<GeocodePoint> {
  return new Promise<GeocodePoint>((resolve, reject) => {
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: 'all',
    })

    geocoder.getLocation(address, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || '地理编码失败'))
        return
      }

      const parsed = parseGeocodeResult(result)
      if (!parsed) {
        reject(new Error('地理编码失败'))
        return
      }

      resolve(parsed)
    })
  })
}

function parseFormattedAddress(result: unknown): string | null {
  if (!isRecord(result)) return null
  if (!isRecord(result.regeocode)) return null

  const raw = result.regeocode.formattedAddress
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return null
}

function parseGeocodeResult(result: unknown): GeocodePoint | null {
  if (!isRecord(result)) return null
  if (!Array.isArray(result.geocodes) || result.geocodes.length === 0) return null
  const first = result.geocodes[0]
  if (!isRecord(first)) return null
  const location = parseLngLatFromUnknown(first.location)
  if (!location) return null
  const formattedAddress =
    typeof first.formattedAddress === 'string' ? first.formattedAddress : undefined
  return { ...location, formattedAddress }
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
