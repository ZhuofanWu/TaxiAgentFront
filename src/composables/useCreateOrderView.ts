import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAmapGeocoder } from '@/composables/useAmapGeocoder'
import { createOrder, estimateOrderPrice } from '@/api/order'
import { getUserPoiOrder } from '@/api/poi'
import { useUserLocationStore } from '@/stores/userLocation'
import { useOrderDraftStore } from '@/stores/orderDraft'
import type { RidePoint, VehicleType, VehicleTypeValue } from '@/types/order'
import type { UserPoi, UserPoiOrder } from '@/types/user'
import type { LngLatTuple } from '@/utils/amap'
import type { PoiItem } from '@/composables/useAmapPoiSearch'

const VEHICLE_META = [
  { type: 'economy', title: '快车', subtitle: '性价比首选', eta: '7分钟' },
  { type: 'comfort', title: '优享', subtitle: '更舒适座舱', eta: '5分钟' },
  { type: 'luxury', title: '专车', subtitle: '专属司机服务', eta: '3分钟' },
] as const

const VEHICLE_VALUE_MAP: Record<VehicleType, VehicleTypeValue> = {
  economy: 1,
  comfort: 2,
  luxury: 3,
}

interface OrderMapApi {
  getCenter: () => LngLatTuple | null
  planRoute: (start: LngLatTuple, end: LngLatTuple, style: 'preview' | 'traffic') => Promise<void>
  clearRoute: () => void
  searchPlace: (keyword: string) => Promise<PoiItem[]>
  clearPlaceSearch: () => void
}

export function useCreateOrderView() {
  const router = useRouter()
  const message = useMessage()
  const locationStore = useUserLocationStore()
  const orderStore = useOrderDraftStore()
  const { reverseGeocode } = useAmapGeocoder()

  const mapRef = ref<OrderMapApi | null>(null)
  const destinationQuery = ref('')
  const confirmPickupLoading = ref(false)
  const searchLoading = ref(false)
  const confirmDestinationLoading = ref(false)
  const estimateLoading = ref(false)
  const submitLoading = ref(false)
  const poiResults = ref<PoiItem[]>([])
  const selectedPoi = ref<PoiItem | null>(null)
  const hasSearched = ref(false)
  const pickupDragTimer = ref<number | null>(null)
  const suppressPickupMoveEnd = ref(false)
  const pendingPickupCenter = ref<LngLatTuple | null>(null)
  const suppressSearchReset = ref(false)
  const commonPoiLoading = ref(false)
  const commonPoiData = ref<UserPoiOrder | null>(null)
  const pickupSelectedOtherId = ref<string | null>(null)
  const selectedOtherId = ref<string | null>(null)

  const stepRefs = ref<Record<number, HTMLElement | null>>({})

  const homePoi = computed(() => toPoiItem(commonPoiData.value?.home))
  const workPoi = computed(() => toPoiItem(commonPoiData.value?.work))
  const otherPois = computed(() => {
    const items = commonPoiData.value?.other ?? []
    return items.flatMap((poi) => {
      const parsed = toPoiItem(poi)
      return parsed ? [parsed] : []
    })
  })

  const activeStep = computed(() => orderStore.draft.currentStep)

  const pickupPoint = computed<RidePoint | null>(() => {
    const { lat, lng, address } = orderStore.draft.pickup
    if (lat == null || lng == null) return null
    return { lat, lng, address }
  })

  const pickupDisplay = computed(() => {
    if (locationStore.loading && !orderStore.draft.pickup.address) return '获取位置中...'
    return orderStore.draft.pickup.address || '暂无定位'
  })

  const dropoffDisplay = computed(() => orderStore.draft.dropoff?.address || '未选择')

  const selectedVehicleLabel = computed(() => {
    if (!orderStore.draft.vehicleType) return '未选择'
    const meta = VEHICLE_META.find((item) => item.type === orderStore.draft.vehicleType)
    return meta?.title ?? '未选择'
  })

  const vehicleOptions = computed(() => {
    const prices = orderStore.vehicleEstimatePrices
    return VEHICLE_META.map((item) => {
      const price = prices?.[item.type] ?? null
      const priceText = price != null ? `¥${price.toFixed(2)}` : '待估价'
      return {
        ...item,
        priceText,
      }
    })
  })

  const summaryItems = computed(() => {
    const scheduled = orderStore.draft.options.isScheduled
      ? formatDateTime(orderStore.draft.options.scheduledTime)
      : '即时出发'
    const urgent = orderStore.draft.options.isUrgent ? '已开启' : '未开启'
    return [
      { label: '起点', value: pickupDisplay.value },
      { label: '终点', value: dropoffDisplay.value },
      { label: '车型', value: selectedVehicleLabel.value },
      { label: '预约', value: scheduled },
      { label: '加急', value: urgent },
    ]
  })

  const finalPriceText = computed(() => {
    if (!orderStore.estimatedTotalPrice) return '待估价'
    return `¥${orderStore.estimatedTotalPrice.toFixed(2)}`
  })

  const urgentFeeValue = computed(() => orderStore.urgentFee)

  const canSubmit = computed(() => {
    const pickup = orderStore.draft.pickup
    return (
      pickup.isConfirmed &&
      Boolean(orderStore.draft.dropoff) &&
      Boolean(orderStore.draft.vehicleType)
    )
  })

  const selectedPoiId = computed(() => selectedPoi.value?.id ?? null)

  watch(
    () => orderStore.draft.currentStep,
    async (step) => {
      await nextTick()
      const el = stepRefs.value[step]
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
  )

  watch(destinationQuery, () => {
    if (suppressSearchReset.value) {
      suppressSearchReset.value = false
      return
    }
    if (!hasSearched.value) return
    hasSearched.value = false
    poiResults.value = []
    selectedPoi.value = null
    mapRef.value?.clearPlaceSearch()
  })

  onMounted(async () => {
    orderStore.resetDraft()
    await Promise.all([initPickup(), loadCommonPois()])
  })

  async function initPickup() {
    const loc = await locationStore.ensureLocation()
    if (!loc) {
      if (locationStore.lastError) message.warning(locationStore.lastError)
      return
    }
    const lat = Number(loc.latitude)
    const lng = Number(loc.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    orderStore.setPickup({ lat, lng, address: loc.address })
  }

  async function handleConfirmPickup() {
    if (confirmPickupLoading.value) return
    confirmPickupLoading.value = true

    try {
      const center = mapRef.value?.getCenter()
      const fallback = pickupPoint.value
      if (!center && !fallback) {
        message.warning('请先获取定位')
        return
      }

      const lng = center ? center[0] : fallback!.lng
      const lat = center ? center[1] : fallback!.lat
      let address = orderStore.draft.pickup.address

      if (center) {
        try {
          address = await reverseGeocode(lng, lat)
        } catch {
          address = address || '定位点'
        }
      }

      orderStore.confirmPickup({ lat, lng, address })
      orderStore.setCurrentStep(2)
    } finally {
      confirmPickupLoading.value = false
    }
  }

  async function handleDestinationConfirm() {
    if (!pickupPoint.value) {
      message.warning('请先确认上车点')
      return
    }
    if (!selectedPoi.value) {
      message.warning('请选择目的地')
      return
    }
    confirmDestinationLoading.value = true

    try {
      const dropoff: RidePoint = {
        lat: selectedPoi.value.lat,
        lng: selectedPoi.value.lng,
        address: buildPoiAddress(selectedPoi.value),
      }
      orderStore.setDropoff(dropoff)
      await fetchEstimate(dropoff)
      const start: LngLatTuple = [pickupPoint.value.lng, pickupPoint.value.lat]
      const end: LngLatTuple = [dropoff.lng, dropoff.lat]
      await mapRef.value?.planRoute(start, end, 'preview')
      orderStore.setCurrentStep(3)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '目的地解析失败')
    } finally {
      confirmDestinationLoading.value = false
    }
  }

  async function handlePoiSearch() {
    if (!destinationQuery.value.trim()) {
      message.warning('请输入目的地关键词')
      return
    }
    if (!mapRef.value) {
      message.warning('地图未加载完成')
      return
    }
    searchLoading.value = true
    hasSearched.value = true
    selectedPoi.value = null
    poiResults.value = []

    try {
      poiResults.value = await mapRef.value.searchPlace(destinationQuery.value)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '搜索失败')
    } finally {
      searchLoading.value = false
    }
  }

  async function handleSelectCommonPoi(poi: PoiItem | null) {
    if (!poi) {
      message.info('暂无常用地址，可前往地址管理添加')
      return
    }
    applyCommonPoiSelection(poi)
  }

  async function handleSelectPickupPoi(poi: PoiItem | null) {
    if (!poi) {
      message.info('暂无常用地址，可前往地址管理添加')
      return
    }
    if (pickupDragTimer.value) {
      window.clearTimeout(pickupDragTimer.value)
      pickupDragTimer.value = null
    }
    pendingPickupCenter.value = [poi.lng, poi.lat]
    suppressPickupMoveEnd.value = true
    const address = poi.address || poi.name
    orderStore.setPickup({ lat: poi.lat, lng: poi.lng, address })
  }

  function handleSelectPoi(item: PoiItem) {
    selectedOtherId.value = null
    applyPoiSelection(item)
  }

  function applyPoiSelection(item: PoiItem) {
    selectedPoi.value = item
    suppressSearchReset.value = true
    destinationQuery.value = item.name
  }

  function applyCommonPoiSelection(item: PoiItem) {
    selectedPoi.value = item
    suppressSearchReset.value = true
    destinationQuery.value = item.address || item.name
    hasSearched.value = false
    poiResults.value = []
    mapRef.value?.clearPlaceSearch()
  }

  function handleVehicleSelect(type: VehicleType) {
    orderStore.setVehicleType(type)
    orderStore.setCurrentStep(4)
  }

  function handleOptionsNext() {
    orderStore.setCurrentStep(5)
  }

  function handleEditStep(step: 1 | 2 | 3 | 4) {
    orderStore.reopenStep(step)
  }

  async function handleMapMoveEnd(center: LngLatTuple) {
    if (activeStep.value !== 1) return
    if (suppressPickupMoveEnd.value) {
      if (pendingPickupCenter.value && isSameLngLat(center, pendingPickupCenter.value)) {
        suppressPickupMoveEnd.value = false
        pendingPickupCenter.value = null
        return
      }
      suppressPickupMoveEnd.value = false
      pendingPickupCenter.value = null
    }
    pickupSelectedOtherId.value = null
    if (pickupDragTimer.value) {
      window.clearTimeout(pickupDragTimer.value)
    }

    pickupDragTimer.value = window.setTimeout(async () => {
      try {
        const address = await reverseGeocode(center[0], center[1])
        orderStore.setPickup({ lat: center[1], lng: center[0], address }, false)
      } catch {
        orderStore.setPickup(
          { lat: center[1], lng: center[0], address: pickupDisplay.value },
          false,
        )
      }
    }, 300)
  }

  async function fetchEstimate(dropoff: RidePoint) {
    if (!pickupPoint.value) return
    estimateLoading.value = true

    try {
      const estimate = await estimateOrderPrice({
        startLat: pickupPoint.value.lat,
        startLng: pickupPoint.value.lng,
        endLat: dropoff.lat,
        endLng: dropoff.lng,
        vehicleType: 1,
        isExpedited: 0,
      })
      orderStore.setPriceEstimate(estimate)
    } catch (e: unknown) {
      orderStore.setPriceEstimate(null)
      message.error(e instanceof Error ? e.message : '估价失败')
    } finally {
      estimateLoading.value = false
    }
  }

  async function handleSubmitOrder() {
    if (!canSubmit.value) {
      message.warning('请完成所有必填步骤')
      return
    }
    if (!pickupPoint.value || !orderStore.draft.dropoff || !orderStore.draft.vehicleType) return

    submitLoading.value = true

    try {
      const isExpedited: 0 | 1 = orderStore.draft.options.isUrgent ? 1 : 0
      const payload = {
        startAddress: pickupPoint.value.address,
        startLat: pickupPoint.value.lat,
        startLng: pickupPoint.value.lng,
        endAddress: orderStore.draft.dropoff.address,
        endLat: orderStore.draft.dropoff.lat,
        endLng: orderStore.draft.dropoff.lng,
        vehicleType: VEHICLE_VALUE_MAP[orderStore.draft.vehicleType],
        isExpedited,
        remark: buildRemark(),
      }

      const orderId = await createOrder(payload)
      message.success('已成功呼叫车辆')
      await router.push({
        name: 'user-orders-current-detail',
        params: { id: orderId },
      })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '下单失败')
    } finally {
      submitLoading.value = false
    }
  }

  function handleSelectCoupon() {
    message.info('暂无可用优惠券')
  }

  function buildRemark(): string | undefined {
    if (!orderStore.draft.options.isScheduled || !orderStore.draft.options.scheduledTime) return
    return `预约时间：${formatDateTime(orderStore.draft.options.scheduledTime)}`
  }

  function buildPoiAddress(item: PoiItem): string {
    if (!item.address) return item.name
    return `${item.name} ${item.address}`.trim()
  }

  async function loadCommonPois() {
    commonPoiLoading.value = true
    try {
      commonPoiData.value = await getUserPoiOrder()
    } catch (e: unknown) {
      message.warning(e instanceof Error ? e.message : '获取常用地址失败')
      commonPoiData.value = null
    } finally {
      commonPoiLoading.value = false
    }
  }

  return {
    mapRef,
    destinationQuery,
    confirmPickupLoading,
    searchLoading,
    confirmDestinationLoading,
    estimateLoading,
    submitLoading,
    poiResults,
    selectedPoi,
    selectedPoiId,
    hasSearched,
    stepRefs,
    homePoi,
    workPoi,
    otherPois,
    selectedOtherId,
    pickupSelectedOtherId,
    commonPoiLoading,
    activeStep,
    pickupPoint,
    pickupDisplay,
    dropoffDisplay,
    selectedVehicleLabel,
    vehicleOptions,
    summaryItems,
    finalPriceText,
    urgentFeeValue,
    orderStore,
    handleConfirmPickup,
    handleDestinationConfirm,
    handlePoiSearch,
    handleSelectCommonPoi,
    handleSelectPickupPoi,
    handleSelectPoi,
    handleVehicleSelect,
    handleOptionsNext,
    handleEditStep,
    handleMapMoveEnd,
    handleSubmitOrder,
    handleSelectCoupon,
    formatDateTime,
  }
}

function toPoiItem(poi?: UserPoi | null): PoiItem | null {
  if (!poi) return null
  const lng = Number(poi.longitude)
  const lat = Number(poi.latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  const name = poi.poiName?.trim() || poi.poiTag?.trim()
  if (!name) return null
  return {
    id: String(poi.id),
    name,
    address: poi.poiAddress?.trim() || '',
    lng,
    lat,
  }
}

function formatDateTime(date: Date | null): string {
  if (!date) return '未选择'
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${mm}`
}

function isSameLngLat(a: LngLatTuple, b: LngLatTuple, epsilon = 1e-6): boolean {
  return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon
}
