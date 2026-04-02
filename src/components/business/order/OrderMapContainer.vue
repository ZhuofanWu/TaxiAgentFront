<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NCard, NSpin, NText } from 'naive-ui'
import { useRideOrderMap } from '@/composables/useRideOrderMap'
import type { PoiItem } from '@/composables/useAmapPoiSearch'
import type { RidePoint } from '@/types/order'
import type { LngLatTuple } from '@/utils/amap'

interface Props {
  pickup: RidePoint | null
  dropoff: RidePoint | null
  activeStep: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'move-end', center: LngLatTuple): void
  (e: 'place-select', value: PoiItem): void
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const placeSearchPanel = ref<HTMLDivElement | null>(null)

const {
  mapBooting,
  mapError,
  bootstrapMap,
  setPickupPoint,
  setDropoffPoint,
  setRoute,
  getCenter,
  planRoute,
  planDrivingRoutes,
  clearRoute,
  clearDrivingRoutes,
  fitToPoints,
  searchPlace,
  clearPlaceSearch,
} = useRideOrderMap(mapEl, {
  onMoveEnd: (center) => {
    if (props.activeStep !== 1) return
    emit('move-end', center)
  },
})

const overlayTitle = computed(() => {
  if (props.activeStep === 1) return '确认上车点'
  if (props.activeStep === 2) return '选择目的地'
  if (props.activeStep === 3) return '查看行程路线'
  return '订单路线预览'
})

const overlaySubtitle = computed(() => {
  if (props.activeStep === 1) return '拖动地图对准定位点'
  if (props.activeStep === 2) return '选定目的地后自动规划视野'
  if (props.activeStep === 3) return '路况颜色用于展示拥堵情况'
  return '保持对路线和车辆位置的关注'
})

defineExpose({
  getCenter,
  planRoute: planRouteOnMap,
  clearRoute,
  searchPlace: searchOnMap,
  clearPlaceSearch,
})

onMounted(async () => {
  const initial: LngLatTuple | null = props.pickup ? [props.pickup.lng, props.pickup.lat] : null
  await bootstrapMap(initial)
  if (props.pickup) {
    setPickupPoint(toTuple(props.pickup))
  }
  if (props.dropoff) {
    setDropoffPoint(toTuple(props.dropoff))
  }
  if (props.pickup && props.dropoff) {
    await planRouteOnMap(toTuple(props.pickup), toTuple(props.dropoff), resolveStyle())
  }
})

watch(
  () => props.pickup,
  (pickup) => {
    if (!pickup) return
    setPickupPoint(toTuple(pickup))
  },
  { deep: true },
)

watch(
  () => props.dropoff,
  (dropoff) => {
    if (!dropoff) {
      clearRoute()
      clearDrivingRoutes()
      return
    }
    setDropoffPoint(toTuple(dropoff))
  },
  { deep: true },
)

watch(
  () => props.activeStep,
  (step) => {
    if ((step === 2 || step === 3) && props.pickup && props.dropoff) {
      void planRouteOnMap(toTuple(props.pickup), toTuple(props.dropoff), resolveStyle())
    }
    if (step !== 2) {
      clearPlaceSearch()
    }
  },
)

async function searchOnMap(keyword: string) {
  if (!placeSearchPanel.value) return []
  return searchPlace(keyword, placeSearchPanel.value, (item) => emit('place-select', item))
}

function resolveStyle() {
  return props.activeStep >= 3 ? 'traffic' : 'preview'
}

async function planRouteOnMap(start: LngLatTuple, end: LngLatTuple, style: 'preview' | 'traffic') {
  try {
    clearDrivingRoutes()
    if (style === 'traffic') {
      await planDrivingRoutes(start, end)
      return
    }
    await planRoute(start, end, style)
  } catch {
    clearDrivingRoutes()
    setRoute([start, end], style)
    fitToPoints()
  }
}

function toTuple(point: RidePoint): LngLatTuple {
  return [point.lng, point.lat]
}
</script>

<template>
  <NCard class="map-card" :content-style="{ padding: 0 }">
    <NSpin :show="mapBooting">
      <div class="map-shell">
        <div ref="mapEl" class="map-canvas" />
        <div class="map-overlay">
          <div class="overlay-title">{{ overlayTitle }}</div>
          <NText class="overlay-sub" depth="3">{{ overlaySubtitle }}</NText>
        </div>
        <div v-show="activeStep === 2" ref="placeSearchPanel" class="place-panel" />
        <div v-if="activeStep === 1" class="center-crosshair" />
        <div v-if="mapError" class="map-error">
          <div class="error-title">地图加载失败</div>
          <div class="error-text">{{ mapError }}</div>
        </div>
      </div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.map-card {
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
}

.map-shell {
  position: relative;
  height: 100%;
  min-height: 520px;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
}

.map-canvas {
  position: absolute;
  inset: 0;
}

.map-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.place-panel {
  position: absolute;
  top: 72px;
  right: 16px;
  width: 280px;
  max-height: calc(100% - 96px);
  overflow: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  padding: 6px;
  pointer-events: auto;
}

.place-panel :deep(*) {
  box-sizing: border-box;
}

.place-panel :deep(.amap_lib_placeSearch) {
  font-size: 0.85rem;
  color: #0f172a;
}

.overlay-title {
  font-weight: 600;
  color: #0f172a;
}

.overlay-sub {
  font-size: 0.8rem;
}

.center-crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26px;
  height: 26px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.center-crosshair::before,
.center-crosshair::after {
  content: '';
  position: absolute;
  background: rgba(15, 23, 42, 0.7);
}

.center-crosshair::before {
  width: 2px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.center-crosshair::after {
  height: 2px;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
}

.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(248, 250, 252, 0.9);
  text-align: center;
  padding: 16px;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
}

.error-text {
  font-size: 0.85rem;
  color: #64748b;
}

@media (max-width: 900px) {
  .map-shell {
    min-height: 360px;
  }

  .place-panel {
    left: 12px;
    right: 12px;
    width: auto;
    top: auto;
    bottom: 12px;
    max-height: 45%;
  }
}
</style>
