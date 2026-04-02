import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getOrderDetail } from '@/api/order'
import type { RideOrderDetail, RidePoint, VehicleTypeValue } from '@/types/order'
import { parseLngLatFromUnknown, type LngLatTuple } from '@/utils/amap'
import type { RouteStyle } from '@/composables/useRideOrderMap'

type TagType = 'success' | 'warning' | 'info' | 'error' | 'default'

interface OrderSectionItem {
  label: string
  value: string
}

interface OrderSection {
  title: string
  items: OrderSectionItem[]
}

interface StatusInfo {
  label: string
  tagType: TagType
}

const STATUS_MAP: Record<number, StatusInfo> = {
  10: { label: '待接单', tagType: 'warning' },
  20: { label: '已接单', tagType: 'info' },
  30: { label: '已到达', tagType: 'info' },
  40: { label: '行程中', tagType: 'info' },
  50: { label: '待支付', tagType: 'warning' },
  60: { label: '已完成', tagType: 'success' },
  90: { label: '已取消', tagType: 'error' },
}

const VEHICLE_LABELS: Record<VehicleTypeValue, string> = {
  1: '快车',
  2: '优享',
  3: '专车',
}

const CANCEL_ROLE_MAP: Record<number, string> = {
  1: '乘客取消',
  2: '司机取消',
  3: '系统取消',
}

export function useOrderDetailView() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()

  const orderIdInput = ref('')
  const orderDetail = ref<RideOrderDetail | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const statusInfo = computed<StatusInfo>(() => {
    if (!orderDetail.value) return { label: '未知状态', tagType: 'default' }
    const status = resolveStatusCode(orderDetail.value.orderStatus)
    return STATUS_MAP[status] ?? { label: '未知状态', tagType: 'default' }
  })

  const statusLabel = computed(() => statusInfo.value.label)
  const statusTagType = computed<TagType>(() => statusInfo.value.tagType)

  const pickupPoint = computed<RidePoint | null>(() => buildRidePoint(orderDetail.value, 'start'))
  const dropoffPoint = computed<RidePoint | null>(() => buildRidePoint(orderDetail.value, 'end'))

  const hasRealRoute = computed(() => Boolean(orderDetail.value?.realRoute?.trim()))
  const hasEstimatedRoute = computed(() => Boolean(orderDetail.value?.estRoute?.trim()))

  const routePoints = computed<LngLatTuple[]>(() => {
    if (!orderDetail.value) return []
    const routeLine = orderDetail.value.realRoute || orderDetail.value.estRoute || ''
    return parseRouteLine(routeLine)
  })

  const routeStyle = computed<RouteStyle>(() => {
    if (!orderDetail.value) return 'preview'
    if (hasRealRoute.value) {
      const status = resolveStatusCode(orderDetail.value.orderStatus)
      return status >= 40 ? 'traffic' : 'preview'
    }
    if (hasEstimatedRoute.value) {
      return 'estimated'
    }
    return 'preview'
  })

  const detailSections = computed<OrderSection[]>(() => {
    if (!orderDetail.value) return []
    return buildSections(orderDetail.value)
  })

  async function fetchOrderDetail(orderId: string) {
    loading.value = true
    errorMessage.value = null
    try {
      orderDetail.value = await getOrderDetail(orderId)
    } catch (error) {
      orderDetail.value = null
      errorMessage.value = error instanceof Error ? error.message : '加载订单详情失败'
    } finally {
      loading.value = false
    }
  }

  function handleDisplay() {
    const trimmed = orderIdInput.value.trim()
    if (!trimmed) {
      message.warning('请输入订单号')
      return
    }
    const currentQuery = typeof route.query.orderId === 'string' ? route.query.orderId : ''
    if (currentQuery !== trimmed) {
      router.replace({ path: route.path, query: { ...route.query, orderId: trimmed } })
      return
    }
    void fetchOrderDetail(trimmed)
  }

  watch(
    () => route.query.orderId,
    (value) => {
      if (typeof value !== 'string' || !value.trim()) return
      orderIdInput.value = value.trim()
      void fetchOrderDetail(orderIdInput.value)
    },
    { immediate: true },
  )

  return {
    orderIdInput,
    orderDetail,
    loading,
    errorMessage,
    statusLabel,
    statusTagType,
    pickupPoint,
    dropoffPoint,
    routePoints,
    routeStyle,
    detailSections,
    handleDisplay,
  }
}

function buildRidePoint(order: RideOrderDetail | null, type: 'start' | 'end'): RidePoint | null {
  if (!order) return null
  const lat = type === 'start' ? order.startLat : order.endLat
  const lng = type === 'start' ? order.startLng : order.endLng
  const parsedLat = resolveNumber(lat)
  const parsedLng = resolveNumber(lng)
  if (parsedLat == null || parsedLng == null) return null
  const address = type === 'start' ? order.startAddress : order.endAddress
  return {
    lat: parsedLat,
    lng: parsedLng,
    address: address ?? '',
  }
}

function parseRouteLine(input: string): LngLatTuple[] {
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

function buildSections(order: RideOrderDetail): OrderSection[] {
  const sections: OrderSection[] = []
  const status = resolveStatusCode(order.orderStatus)

  const baseItems: OrderSectionItem[] = [
    { label: '订单号', value: order.orderId },
    { label: '订单状态', value: STATUS_MAP[status]?.label ?? '未知状态' },
    { label: '用户编号', value: order.userId ?? '-' },
    { label: '司机编号', value: order.driverId ?? '-' },
    { label: '创建时间', value: formatDateTime(order.createTime) },
  ]
  sections.push({ title: '订单信息', items: baseItems })

  const tripItems: OrderSectionItem[] = [
    { label: '起点', value: order.startAddress ?? '-' },
    { label: '终点', value: order.endAddress ?? '-' },
    { label: '车型', value: resolveVehicleType(order.vehicleType) },
    { label: '是否预约', value: resolveBooleanFlag(order.isReservation) ? '预约' : '即时' },
    { label: '是否加急', value: resolveBooleanFlag(order.isExpedited) ? '加急' : '普通' },
  ]
  if (order.safetyCode) {
    tripItems.push({ label: '安全码', value: order.safetyCode })
  }
  sections.push({ title: '行程信息', items: tripItems })

  const metricItems: OrderSectionItem[] = [
    { label: '预计里程', value: formatDistance(order.estDistance) },
    { label: '实际里程', value: formatDistance(order.realDistance) },
    { label: '预计费用', value: formatPrice(order.estPrice) },
    { label: '实际费用', value: formatPrice(order.realPrice) },
    { label: '更新时间', value: formatDateTime(order.updateTime) },
  ]
  sections.push({ title: '行程指标', items: metricItems })

  if (status === 50 || status === 60) {
    const priceItems: OrderSectionItem[] = [
      { label: '基础费', value: formatPrice(order.priceBase) },
      { label: '里程费', value: formatPrice(order.priceDistance) },
      { label: '时长费', value: formatPrice(order.priceTime) },
      { label: '加急费', value: formatPrice(order.priceExpedited) },
      { label: '倍率', value: formatMultiplier(order.priceRadio) },
    ]
    sections.push({ title: '费用明细', items: priceItems })
  }

  if (status === 90) {
    const cancelItems: OrderSectionItem[] = [
      { label: '取消方', value: resolveCancelRole(order.cancelRole) },
      { label: '取消原因', value: order.cancelReason ?? '-' },
    ]
    sections.push({ title: '取消信息', items: cancelItems })
  }

  return sections
}

function resolveVehicleType(value: VehicleTypeValue | number | string): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '未知车型'
  return VEHICLE_LABELS[parsed as VehicleTypeValue] ?? '未知车型'
}

function resolveCancelRole(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return CANCEL_ROLE_MAP[parsed] ?? '未知'
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const normalized = value.replace('T', ' ')
  return normalized.length > 19 ? normalized.slice(0, 19) : normalized
}

function formatDistance(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `${parsed.toFixed(1)} km`
}

function formatPrice(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `¥${parsed.toFixed(2)}`
}

function formatMultiplier(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `${parsed.toFixed(2)}x`
}

function resolveStatusCode(value: number | string): number {
  const parsed = resolveNumber(value)
  return parsed ?? 0
}

function resolveBooleanFlag(value: number | string): boolean {
  const parsed = resolveNumber(value)
  return parsed === 1
}

function resolveNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}
