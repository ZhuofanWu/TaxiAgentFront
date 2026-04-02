import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserLocation } from '@/types/user'
import { getUserLocation, saveUserLocation } from '@/api/user'
import {
  loadAmap,
  loadAmapPlugins,
  normalizeLngLatTuple,
  parseLngLatFromUnknown,
} from '@/utils/amap'
import type { AMapStatic, LngLatTuple } from '@/utils/amap'

export const useUserLocationStore = defineStore('userLocation', () => {
  const location = ref<UserLocation | null>(null)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  async function fetchSavedLocation(): Promise<UserLocation | null> {
    try {
      const data = await getUserLocation()
      return data
    } catch (e: unknown) {
      if (isLocationNotFoundError(e)) return null
      throw e
    }
  }

  async function ensureLocation(): Promise<UserLocation | null> {
    if (loading.value) return location.value
    loading.value = true
    lastError.value = null

    try {
      const saved = await fetchSavedLocation()
      if (saved) {
        location.value = saved
        return saved
      }

      const current = await locateByAmapGeolocation()
      await saveUserLocation(current)
      location.value = current
      return current
    } catch (e: unknown) {
      lastError.value = toErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function refreshLocation(): Promise<UserLocation | null> {
    if (loading.value) return location.value
    loading.value = true
    lastError.value = null

    try {
      const current = await locateByAmapGeolocation()
      await saveUserLocation(current)
      location.value = current
      return current
    } catch (e: unknown) {
      lastError.value = toErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function setLocationByPoint(lng: number, lat: number): Promise<UserLocation | null> {
    if (loading.value) return location.value
    loading.value = true
    lastError.value = null

    try {
      const AMap = await loadAmap()
      const address = await reverseGeocode(AMap, normalizeLngLatTuple(lng, lat))
      const next: UserLocation = {
        latitude: formatCoord(lat),
        longitude: formatCoord(lng),
        address,
      }
      await saveUserLocation(next)
      location.value = next
      return next
    } catch (e: unknown) {
      lastError.value = toErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    location,
    loading,
    lastError,
    fetchSavedLocation,
    ensureLocation,
    refreshLocation,
    setLocationByPoint,
  }
})

async function locateByAmapGeolocation(): Promise<UserLocation> {
  const AMap = await loadAmap()
  await loadAmapPlugins(AMap, ['AMap.Geolocation', 'AMap.Geocoder'])

  const { lng, lat, formattedAddress } = await getCurrentPosition(AMap)
  const address = formattedAddress?.trim()
    ? formattedAddress.trim()
    : await reverseGeocode(AMap, [lng, lat])

  return {
    latitude: formatCoord(lat),
    longitude: formatCoord(lng),
    address,
  }
}

function getCurrentPosition(
  AMap: AMapStatic,
): Promise<{ lng: number; lat: number; formattedAddress?: string }> {
  return new Promise((resolve, reject) => {
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })

    geolocation.getCurrentPosition((status, result) => {
      if (status === 'complete') {
        const parsed = parseGeolocationResult(result)
        if (!parsed) {
          reject(new Error('Unable to parse geolocation result'))
          return
        }
        resolve(parsed)
        return
      }

      const msg = extractAmapErrorMessage(result) || 'Geolocation failed'
      reject(new Error(msg))
    })
  })
}

function parseGeolocationResult(
  result: unknown,
): { lng: number; lat: number; formattedAddress?: string } | null {
  if (!isRecord(result)) return null
  const position = parseLngLatFromUnknown(result.position)
  if (!position) return null

  const formattedAddress =
    typeof result.formattedAddress === 'string' ? result.formattedAddress : undefined
  return { ...position, formattedAddress }
}

async function reverseGeocode(AMap: AMapStatic, lnglat: LngLatTuple): Promise<string> {
  await loadAmapPlugins(AMap, ['AMap.Geocoder'])
  return new Promise<string>((resolve, reject) => {
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: 'base',
    })

    geocoder.getAddress(lnglat, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || 'Reverse geocode failed'))
        return
      }

      const address = parseFormattedAddress(result)
      if (!address) {
        reject(new Error('Reverse geocode failed'))
        return
      }

      resolve(address)
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

function extractAmapErrorMessage(result: unknown): string | null {
  if (!isRecord(result)) return null
  const info = result.info
  if (typeof info === 'string' && info.trim()) return info.trim()
  const message = result.message
  if (typeof message === 'string' && message.trim()) return message.trim()
  return null
}

function isLocationNotFoundError(e: unknown): boolean {
  const msg = toErrorMessage(e)
  return msg.includes('用户定位数据不存在')
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message || 'Unknown error'
  if (typeof e === 'string') return e
  return 'Unknown error'
}

function formatCoord(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  return value.toFixed(6)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
