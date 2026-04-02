<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NCard, NSpin, NText } from 'naive-ui'
import { useRideOrderMap, type RouteStyle } from '@/composables/useRideOrderMap'
import type { RidePoint } from '@/types/order'
import type { LngLatTuple } from '@/utils/amap'

interface Props {
  pickup: RidePoint | null
  dropoff: RidePoint | null
  route: LngLatTuple[]
  routeStyle: RouteStyle
  statusText?: string
  drivingMode?: boolean
  drivingSelectionIndex?: number | null
  drivingStrategy?: number
}

const props = defineProps<Props>()

const mapEl = ref<HTMLDivElement | null>(null)

const {
  mapBooting,
  mapError,
  bootstrapMap,
  setPickupPoint,
  setDropoffPoint,
  setRoute,
  setRouteStyle,
  clearRoute,
  planDrivingRoutes,
  setDrivingRouteIndex,
  clearDrivingRoutes,
  fitToPoints,
} = useRideOrderMap(mapEl)

const hasRoute = computed(() => props.route && props.route.length >= 2)
const mapReady = computed(() => !mapBooting.value && !mapError.value)
const isDrivingMode = computed(() => props.drivingMode === true)
const drivingStrategy = computed(() => props.drivingStrategy ?? 10)

onMounted(async () => {
  const initial = resolveInitialCenter()
  await bootstrapMap(initial)
  applyMarkers()
  if (isDrivingMode.value) {
    await applyDrivingRoutes()
  } else {
    applyRoute()
  }
})

watch(
  () => [mapReady.value, props.pickup, props.dropoff, isDrivingMode.value],
  async () => {
    if (!mapReady.value) return
    applyMarkers()
    if (isDrivingMode.value) {
      await applyDrivingRoutes()
    }
  },
  { deep: true },
)

watch(
  () => [mapReady.value, props.route, props.routeStyle, isDrivingMode.value],
  () => {
    if (!mapReady.value) return
    if (isDrivingMode.value) return
    applyRoute()
  },
  { deep: true },
)

watch(
  () => [mapReady.value, isDrivingMode.value, props.drivingSelectionIndex],
  () => {
    if (!mapReady.value || !isDrivingMode.value) return
    const index = props.drivingSelectionIndex
    if (index == null) return
    setDrivingRouteIndex(index)
  },
  { deep: true },
)

watch(
  () => [mapReady.value, isDrivingMode.value],
  () => {
    if (!mapReady.value) return
    if (isDrivingMode.value) return
    clearDrivingRoutes()
  },
  { deep: true },
)

function resolveInitialCenter(): LngLatTuple | null {
  if (props.pickup) return [props.pickup.lng, props.pickup.lat]
  if (props.dropoff) return [props.dropoff.lng, props.dropoff.lat]
  return null
}

function applyMarkers() {
  if (props.pickup) setPickupPoint([props.pickup.lng, props.pickup.lat])
  if (props.dropoff) setDropoffPoint([props.dropoff.lng, props.dropoff.lat])
}

function applyRoute() {
  if (!hasRoute.value) {
    clearRoute()
    return
  }
  setRoute(props.route, props.routeStyle)
  setRouteStyle(props.routeStyle)
  fitToPoints()
}

async function applyDrivingRoutes() {
  clearRoute()
  clearDrivingRoutes()
  if (!props.pickup || !props.dropoff) return
  await planDrivingRoutes(
    [props.pickup.lng, props.pickup.lat],
    [props.dropoff.lng, props.dropoff.lat],
    drivingStrategy.value,
  )
}
</script>

<template>
  <NCard class="map-card" :content-style="{ padding: 0 }">
    <NSpin :show="mapBooting">
      <div class="map-shell">
        <div ref="mapEl" class="map-canvas" />
        <div class="map-overlay">
          <div class="overlay-title">行程地图</div>
          <NText class="overlay-sub" depth="3">{{ statusText || '当前订单路线' }}</NText>
        </div>
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
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.overlay-title {
  font-weight: 600;
  color: #0f172a;
}

.overlay-sub {
  font-size: 0.8rem;
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
}
</style>
