import { parseLngLatFromUnknown, type LngLatTuple } from '@/utils/amap'

export function parseRouteLine(input?: string | null): LngLatTuple[] {
  if (!input) return []
  const trimmed = input.trim()
  if (!trimmed) return []
  const segments = trimmed.split(';')
  const points: LngLatTuple[] = []
  segments.forEach((segment) => {
    const parsed = parseLngLatFromUnknown(segment)
    if (parsed) points.push([parsed.lng, parsed.lat])
  })
  return points
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const normalized = value.replace('T', ' ')
  return normalized.length > 19 ? normalized.slice(0, 19) : normalized
}

export function formatDistance(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `${parsed.toFixed(1)} km`
}

export function formatPrice(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `¥${parsed.toFixed(2)}`
}

export function formatDistanceMeters(value: number): string {
  if (!Number.isFinite(value)) return '-'
  if (value < 1000) return `${Math.round(value)} m`
  return `${(value / 1000).toFixed(1)} km`
}

export function formatDurationSeconds(value: number): string {
  if (!Number.isFinite(value)) return '-'
  if (value < 60) return `${Math.round(value)} s`
  if (value < 3600) return `${Math.round(value / 60)} min`
  return `${(value / 3600).toFixed(1)} h`
}

export function formatIsoLocal(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  const second = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

export function resolveStatusCode(value: number | string | null | undefined): number {
  const parsed = resolveNumber(value)
  return parsed ?? 0
}

export function resolveNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}
