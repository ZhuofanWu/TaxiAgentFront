import { loadAmap, loadAmapPlugins, parseLngLatFromUnknown } from '@/utils/amap'
import type { AMapStatic } from '@/utils/amap'

export interface PoiItem {
  id: string
  name: string
  address: string
  lng: number
  lat: number
}

export function useAmapPoiSearch() {
  async function searchPoi(keyword: string): Promise<PoiItem[]> {
    const trimmed = keyword.trim()
    if (!trimmed) return []
    const AMap = await loadAmap()
    await loadAmapPlugins(AMap, ['AMap.PlaceSearch'])
    return searchWith(AMap, trimmed)
  }

  return {
    searchPoi,
  }
}

async function searchWith(AMap: AMapStatic, keyword: string): Promise<PoiItem[]> {
  return new Promise<PoiItem[]>((resolve, reject) => {
    const searcher = new AMap.PlaceSearch({
      pageSize: 8,
      pageIndex: 1,
      extensions: 'base',
    })

    searcher.search(keyword, (status, result) => {
      if (status !== 'complete') {
        reject(new Error(extractAmapErrorMessage(result) || 'POI搜索失败'))
        return
      }

      resolve(parsePoiList(result))
    })
  })
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

function extractAmapErrorMessage(result: unknown): string | null {
  if (!isRecord(result)) return null
  const info = result.info
  if (typeof info === 'string' && info.trim()) return info.trim()
  const message = result.message
  if (typeof message === 'string' && message.trim()) return message.trim()
  return null
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
