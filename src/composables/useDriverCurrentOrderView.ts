import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  arriveDriverOrder,
  finishDriverOrder,
  getDriverCurrentOrder,
  startDriverOrder,
} from '@/api/order'
import { useDriverRoutePlan } from '@/composables/useDriverRoutePlan'
import type { DriverRouteOption } from '@/composables/useDriverRoutePlan'
import type { RideOrderDetail, RidePoint, VehicleTypeValue } from '@/types/order'
import type { LngLatTuple } from '@/utils/amap'
import {
  formatDateTime,
  formatDistance,
  formatDistanceMeters,
  formatDurationSeconds,
  formatIsoLocal,
  formatPrice,
  parseRouteLine,
  resolveNumber,
  resolveStatusCode,
} from '@/utils/orderFormat'

type TagType = 'success' | 'warning' | 'info' | 'error' | 'default'

const STATUS_MAP: Record<number, { label: string; hint: string; tagType: TagType }> = {
  10: { label: '待接单', hint: '等待司机接单', tagType: 'info' },
  20: { label: '已接单', hint: '正在前往乘客起点', tagType: 'warning' },
  30: { label: '已到达', hint: '已到达乘客起点', tagType: 'warning' },
  40: { label: '行程中', hint: '行程进行中', tagType: 'info' },
  50: { label: '待支付', hint: '行程结束，等待乘客支付', tagType: 'warning' },
  60: { label: '已完成', hint: '订单已完成', tagType: 'success' },
  90: { label: '已取消', hint: '订单已取消', tagType: 'error' },
}

const VEHICLE_LABELS: Record<VehicleTypeValue, string> = {
  1: '快车',
  2: '优享',
  3: '专车',
}

const NEXT_STEP_HINT: Record<number, string> = {
  20: '到达乘客起点',
  30: '开始行程',
  40: '结束行程',
}

export function useDriverCurrentOrderView() {
  const router = useRouter()
  const message = useMessage()

  const loading = ref(false)
  const actionLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const orderDetail = ref<RideOrderDetail | null>(null)

  const { routeOptions, planning, planError, planRoutes, clearRoutes } = useDriverRoutePlan()
  const selectedRouteId = ref<string | null>(null)

  const statusCode = computed(() => resolveStatusCode(orderDetail.value?.orderStatus))

  const statusInfo = computed(() => {
    if (!orderDetail.value) {
      return { label: '暂无订单', hint: '当前没有进行中的订单', tagType: 'default' as TagType }
    }
    return (
      STATUS_MAP[statusCode.value] ??
      ({ label: '未知状态', hint: '订单状态未知', tagType: 'default' } as const)
    )
  })

  const statusLabel = computed(() => statusInfo.value.label)
  const statusHint = computed(() => statusInfo.value.hint)
  const statusTagType = computed<TagType>(() => statusInfo.value.tagType)

  const pickupPoint = computed<RidePoint | null>(() => buildRidePoint(orderDetail.value, 'start'))
  const dropoffPoint = computed<RidePoint | null>(() => buildRidePoint(orderDetail.value, 'end'))

  const selectedRoute = computed(
    () => routeOptions.value.find((option) => option.id === selectedRouteId.value) || null,
  )

  const selectedRouteIndex = computed(() => {
    if (!selectedRouteId.value) return null
    const index = routeOptions.value.findIndex((option) => option.id === selectedRouteId.value)
    return index >= 0 ? index : null
  })

  const mapRoutePoints = computed<LngLatTuple[]>(() => {
    if (!orderDetail.value) return []
    if (statusCode.value === 40) {
      return selectedRoute.value?.points ?? []
    }
    if (statusCode.value > 40) {
      const realRoute = parseRouteLine(orderDetail.value.realRoute)
      if (realRoute.length > 1) return realRoute
      return selectedRoute.value?.points ?? []
    }
    return parseRouteLine(orderDetail.value.estRoute)
  })

  const routeStyle = computed(() => (statusCode.value >= 40 ? 'traffic' : 'preview'))
  const showRouteOptions = computed(() => statusCode.value === 40)

  const detailItems = computed(() => {
    if (!orderDetail.value) return []
    return [
      { label: '订单号', value: orderDetail.value.orderId },
      { label: '起点', value: orderDetail.value.startAddress ?? '-' },
      { label: '终点', value: orderDetail.value.endAddress ?? '-' },
      { label: '车型', value: resolveVehicleType(orderDetail.value.vehicleType) },
      { label: '预计里程', value: formatDistance(orderDetail.value.estDistance) },
      { label: '预计费用', value: formatPrice(orderDetail.value.estPrice) },
      { label: '创建时间', value: formatDateTime(orderDetail.value.createTime) },
    ]
  })

  const nextStepHint = computed(() => NEXT_STEP_HINT[statusCode.value] ?? '')
  const nextStepVisible = computed(() => [20, 30, 40].includes(statusCode.value))
  const nextStepDisabled = computed(() => {
    if (!nextStepVisible.value) return true
    if (actionLoading.value) return true
    if (statusCode.value === 40 && !selectedRoute.value) return true
    return false
  })

  watch(
    () => orderDetail.value?.orderId,
    () => {
      selectedRouteId.value = null
      clearRoutes()
    },
  )

  watch(
    () => [statusCode.value, pickupPoint.value, dropoffPoint.value],
    async () => {
      if (!showRouteOptions.value) {
        clearRoutes()
        selectedRouteId.value = null
        return
      }
      if (routeOptions.value.length > 0 || planning.value) return
      if (!pickupPoint.value || !dropoffPoint.value) return
      await planRoutes(
        [pickupPoint.value.lng, pickupPoint.value.lat],
        [dropoffPoint.value.lng, dropoffPoint.value.lat],
      )
    },
    { deep: true },
  )

  watch(
    () => routeOptions.value,
    (options) => {
      if (!showRouteOptions.value) return
      if (selectedRouteId.value || options.length === 0) return
      const [first] = options
      if (!first) return
      selectedRouteId.value = first.id
    },
    { deep: true },
  )

  async function refresh() {
    loading.value = true
    errorMessage.value = null
    try {
      orderDetail.value = await getDriverCurrentOrder()
    } catch (error) {
      orderDetail.value = null
      errorMessage.value = error instanceof Error ? error.message : '加载当前订单失败'
    } finally {
      loading.value = false
    }
  }

  function goToPool() {
    router.push('/driver/orders/pool')
  }

  async function handleNextStep() {
    if (!orderDetail.value || actionLoading.value) return
    const status = statusCode.value
    actionLoading.value = true
    try {
      if (status === 20) {
        await arriveDriverOrder(orderDetail.value.orderId)
        message.success('已标记到达')
      } else if (status === 30) {
        await startDriverOrder(orderDetail.value.orderId)
        message.success('行程已开始')
      } else if (status === 40) {
        const route = selectedRoute.value
        if (!route) {
          message.warning('请选择路线方案')
          return
        }
        await finishWithRoute(orderDetail.value, route)
        message.success('订单已结束')
      }
      await refresh()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '状态更新失败')
    } finally {
      actionLoading.value = false
    }
  }

  async function handleSelectRoute(optionId: string) {
    if (actionLoading.value) return
    selectedRouteId.value = optionId
  }

  async function handleRefresh() {
    await refresh()
    if (!errorMessage.value) message.success('已刷新')
  }

  async function handleReplan() {
    if (!pickupPoint.value || !dropoffPoint.value) return
    await planRoutes(
      [pickupPoint.value.lng, pickupPoint.value.lat],
      [dropoffPoint.value.lng, dropoffPoint.value.lat],
    )
  }

  return {
    loading,
    actionLoading,
    errorMessage,
    orderDetail,
    statusLabel,
    statusHint,
    statusTagType,
    pickupPoint,
    dropoffPoint,
    mapRoutePoints,
    routeStyle,
    detailItems,
    routeOptions,
    planning,
    planError,
    selectedRouteId,
    selectedRouteIndex,
    showRouteOptions,
    nextStepHint,
    nextStepVisible,
    nextStepDisabled,
    refresh,
    handleRefresh,
    handleNextStep,
    handleSelectRoute,
    handleReplan,
    goToPool,
    formatDistanceMeters,
    formatDurationSeconds,
  }
}

async function finishWithRoute(order: RideOrderDetail, route: DriverRouteOption) {
  const endPoint = resolveEndPoint(order, route)
  if (!endPoint) {
    throw new Error('无法获取终点信息')
  }
  const arriveTime = resolveArriveTime(order, route.duration)
  await finishDriverOrder({
    orderId: order.orderId,
    endLat: endPoint.lat,
    endLng: endPoint.lng,
    endAddress: endPoint.address,
    realPolyline: route.polyline,
    arriveTime,
  })
}

function resolveEndPoint(order: RideOrderDetail, route: DriverRouteOption) {
  const lastPoint = route.points.length > 0 ? route.points[route.points.length - 1] : null
  const lat = resolveNumber(order.endLat) ?? lastPoint?.[1]
  const lng = resolveNumber(order.endLng) ?? lastPoint?.[0]
  if (lat == null || lng == null) return null
  return { lat, lng, address: order.endAddress ?? '' }
}

function resolveArriveTime(order: RideOrderDetail, duration: number): string {
  const start = resolveStartTime(order) ?? new Date()
  const arrive = new Date(start.getTime() + Math.max(duration, 0) * 1000)
  return formatIsoLocal(arrive)
}

function resolveStartTime(order: RideOrderDetail): Date | null {
  const raw = order.updateTime || order.createTime
  if (!raw) return null
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

function resolveVehicleType(value: VehicleTypeValue | number | string): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '未知车型'
  return VEHICLE_LABELS[parsed as VehicleTypeValue] ?? '未知车型'
}
