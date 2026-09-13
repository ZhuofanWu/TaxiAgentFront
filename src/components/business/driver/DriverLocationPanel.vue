<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NSpin, NText, NSwitch } from 'naive-ui'
import { useDriverLocationView } from '@/composables/useDriverLocationView'

const mapEl = ref<HTMLDivElement | null>(null)

const {
  store,
  pickMode,
  showSpinner,
  displayAddress,
  onlineText,
  handleToggleOnline,
  handleTogglePickMode,
} = useDriverLocationView(mapEl)
</script>

<template>
  <div class="driver-location">
    <div class="option-row">
      <div class="option-info">
        <div class="option-title">上线接单</div>
        <NText depth="3">{{ onlineText }}</NText>
      </div>
      <NSwitch :value="store.online" :loading="store.loading" @update:value="handleToggleOnline" />
    </div>

    <NText v-if="store.lastError" class="error-text">{{ store.lastError }}</NText>

    <NCard class="loc-card" :content-style="{ padding: 0 }">
      <template #header>
        <div class="loc-bar">
          <div class="loc-text">
            <span>当前位置：</span>
            <NText class="loc-address">{{ displayAddress }}</NText>
          </div>
          <div class="loc-actions">
            <NButton
              size="small"
              :type="pickMode ? 'warning' : 'default'"
              @click="handleTogglePickMode"
            >
              {{ pickMode ? '取消选点' : '设置位置' }}
            </NButton>
            <span class="loc-hint">在地图上点一个点作为当前位置</span>
          </div>
        </div>
      </template>

      <NSpin :show="showSpinner">
        <div class="map-wrap" :class="{ picking: pickMode }">
          <div ref="mapEl" class="map" />
          <div v-if="pickMode" class="pick-tip">点击地图选点</div>
        </div>
      </NSpin>
    </NCard>
  </div>
</template>

<style scoped src="./DriverLocationPanel.css"></style>
