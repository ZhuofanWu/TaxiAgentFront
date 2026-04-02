<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NCard, NSpin, NText, useMessage } from 'naive-ui'
import { useUserLocationStore } from '@/stores/userLocation'
import { useAmapLocationMap } from '@/composables/useAmapLocationMap'
import type { LngLatTuple } from '@/utils/amap'
import type { UserLocation } from '@/types/user'

const message = useMessage()
const locationStore = useUserLocationStore()

const mapEl = ref<HTMLDivElement | null>(null)

const displayAddress = computed(() => {
  if (locationStore.loading && !locationStore.location) return '定位中...'
  return locationStore.location?.address || '暂无定位'
})

function parseLngLatFromLocation(loc: UserLocation): LngLatTuple | null {
  const lng = Number(loc.longitude)
  const lat = Number(loc.latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

const { mapBooting, pickMode, bootstrapMap, syncMarker, togglePickMode, disablePickMode } =
  useAmapLocationMap(mapEl, {
    onPick: async (lng, lat) => {
      const saved = await locationStore.setLocationByPoint(lng, lat)
      if (saved) {
        message.success('位置已保存')
        disablePickMode()
      } else if (locationStore.lastError) {
        message.error(locationStore.lastError)
      }
    },
  })

const showSpinner = computed(() => locationStore.loading || mapBooting.value)

async function ensureUserLocation() {
  const loc = await locationStore.ensureLocation()
  if (!loc && locationStore.lastError) {
    message.warning(locationStore.lastError)
  }
}

async function handleRefresh() {
  const loc = await locationStore.refreshLocation()
  if (loc) {
    message.success('定位已更新')
    disablePickMode()
  } else if (locationStore.lastError) {
    message.error(locationStore.lastError)
  }
}

function handleTogglePickMode() {
  const ok = togglePickMode()
  if (!ok) {
    message.error('地图尚未就绪')
  }
}

onMounted(async () => {
  const initialCenter = locationStore.location
    ? parseLngLatFromLocation(locationStore.location)
    : null
  try {
    await bootstrapMap(initialCenter)
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : '地图初始化失败')
  }
  await ensureUserLocation()
})

watch(
  () => locationStore.location,
  (loc) => {
    if (!loc) return
    const center = parseLngLatFromLocation(loc)
    if (!center) return
    syncMarker(center)
  },
  { immediate: true },
)
</script>

<template>
  <NCard class="loc-card" :content-style="{ padding: 0 }">
    <template #header>
      <div class="loc-bar">
        <div class="loc-text">
          <span>您的当前位置：</span>
          <NText class="loc-address">{{ displayAddress }}</NText>
        </div>
        <div class="loc-actions">
          <NButton size="small" :loading="locationStore.loading" @click="handleRefresh">
            重新获取位置
          </NButton>
          <NButton
            size="small"
            :type="pickMode ? 'warning' : 'default'"
            @click="handleTogglePickMode"
          >
            {{ pickMode ? '取消设定' : '设定自己位置' }}
          </NButton>
          <span class="loc-hint">（在地图上点一个点并保存）</span>
        </div>
      </div>
    </template>

    <NSpin :show="showSpinner">
      <div class="map-wrap" :class="{ picking: pickMode }">
        <div ref="mapEl" class="map" />
        <div v-if="pickMode" class="pick-tip">点击地图选点并自动保存</div>
      </div>
    </NSpin>
  </NCard>
</template>

<style scoped src="./UserLocationSection.css"></style>
