import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOngoingOrderIds, getOrderDetail } from '@/api/order'
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
  hint: string
  tagType: TagType
}

const STATUS_MAP: Record<number, StatusInfo> = {
  10: { label: '待接单', hint: '已下单，等待司机接单', tagType: 'info' },
  20: { label: '已接单', hint: '司机正在前往上车点', tagType: 'warning' },
  30: { label: '已到达', hint: '司机已到达上车点', tagType: 'warning' },
  40: { label: '行程中', hint: '行程进行中，请注意安全', tagType: 'info' },
  50: { label: '待支付', hint: '行程结束，请尽快完成支付', tagType: 'warning' },
  60: { label: '已完成', hint: '订单已完成，感谢您的出行', tagType: 'success' },
  90: { label: '已取消', hint: '订单已取消', tagType: 'error' },
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

export function useCurrentOrderView() {
  const route = useRoute()
  const router = useRouter()

  const listLoading = ref(false)
  const detailLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const ongoingOrderIds = ref<string[]>([])
  const orderDetail = ref<RideOrderDetail | null>(null)

  const orderId = computed(() => {
    const param = route.params.orderId
    return typeof param === 'string' && param.trim() ? param.trim() : null
  })

  const isListing = computed(() => !orderId.value)

  const statusInfo = computed<StatusInfo>(() => {
    if (!orderDetail.value) return { label: '未知状态', hint: '订单信息加载中', tagType: 'default' }
    const status = resolveStatusCode(orderDetail.value.orderStatus)
    return (
      STATUS_MAP[status] ?? {
        label: '未知状态',
        hint: '订单状态未知',
        tagType: 'default',
      }
    )
  })

  const statusLabel = computed(() => statusInfo.value.label)
  const statusHint = computed(() => statusInfo.value.hint)
  const statusTagType = computed<TagType>(() => statusInfo.value.tagType)

  const pickupPoint = computed<RidePoint | null>(() => buildRidePoint(orderDetail.value, 'start'))
  const dropoffPoint = computed<RidePoint | null>(() => buildRidePoint(orderDetail.value, 'end'))

  const routePoints = computed<LngLatTuple[]>(() => {
    if (!orderDetail.value) return []
    const candidate = orderDetail.value.realRoute || orderDetail.value.estRoute || ''
    return parseRouteLine(candidate)
  })

  const routeStyle = computed<RouteStyle>(() => {
    if (!orderDetail.value) return 'preview'
    const status = resolveStatusCode(orderDetail.value.orderStatus)
    return status >= 40 ? 'traffic' : 'preview'
  })

  const detailSections = computed<OrderSection[]>(() => {
    if (!orderDetail.value) return []
    return buildSections(orderDetail.value)
  })

  watch(
    orderId,
    async (value) => {
      errorMessage.value = null
      if (!value) {
        orderDetail.value = null
        await loadOngoingOrders()
        return
      }
      ongoingOrderIds.value = []
      await loadOrderDetail(value)
    },
    { immediate: true },
  )

  async function loadOngoingOrders() {
    listLoading.value = true
    try {
      const ids = await getOngoingOrderIds()
      ongoingOrderIds.value = ids
      if (ids.length === 1) {
        await router.replace(`/user/orders/current/${ids[0]}`)
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '加载订单列表失败'
    } finally {
      listLoading.value = false
    }
  }

  async function loadOrderDetail(id: string) {
    detailLoading.value = true
    try {
      orderDetail.value = await getOrderDetail(id)
    } catch (error) {
      orderDetail.value = null
      errorMessage.value = error instanceof Error ? error.message : '加载订单详情失败'
    } finally {
      detailLoading.value = false
    }
  }

  function handleSelectOrder(id: string) {
    router.push(`/user/orders/current/${id}`)
  }

  function handleBackToList() {
    router.push('/user/orders/current')
  }

  function refresh() {
    if (orderId.value) {
      void loadOrderDetail(orderId.value)
      return
    }
    void loadOngoingOrders()
  }

  return {
    orderId,
    isListing,
    listLoading,
    detailLoading,
    errorMessage,
    ongoingOrderIds,
    orderDetail,
    statusLabel,
    statusHint,
    statusTagType,
    pickupPoint,
    dropoffPoint,
    routePoints,
    routeStyle,
    detailSections,
    handleSelectOrder,
    handleBackToList,
    refresh,
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
  const baseItems: OrderSectionItem[] = [
    { label: '起点', value: order.startAddress ?? '-' },
    { label: '终点', value: order.endAddress ?? '-' },
    { label: '车型', value: resolveVehicleType(order.vehicleType) },
    { label: '是否预约', value: resolveBooleanFlag(order.isReservation) ? '预约' : '即时' },
    { label: '是否加急', value: resolveBooleanFlag(order.isExpedited) ? '加急' : '普通' },
    { label: '创建时间', value: formatDateTime(order.createTime) },
  ]

  if (order.driverId) {
    baseItems.push({ label: '司机编号', value: order.driverId })
  }
  if (order.safetyCode) {
    baseItems.push({ label: '安全码', value: order.safetyCode })
  }

  sections.push({ title: '行程信息', items: baseItems })

  const metricsItems: OrderSectionItem[] = [
    { label: '预计里程', value: formatDistance(order.estDistance) },
    { label: '预计费用', value: formatPrice(order.estPrice) },
  ]

  const status = resolveStatusCode(order.orderStatus)

  if (status >= 40) {
    metricsItems.push({ label: '实际里程', value: formatDistance(order.realDistance) })
  }
  if (status >= 50) {
    metricsItems.push({ label: '实际费用', value: formatPrice(order.realPrice) })
  }

  sections.push({ title: '行程指标', items: metricsItems })

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
      { label: '更新时间', value: formatDateTime(order.updateTime) },
    ]
    sections.push({ title: '取消信息', items: cancelItems })
  } else {
    sections.push({
      title: '更新时间',
      items: [{ label: '最新状态时间', value: formatDateTime(order.updateTime) }],
    })
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
