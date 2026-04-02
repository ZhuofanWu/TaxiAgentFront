<script setup lang="ts">
import { onMounted } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSpin,
  NTag,
  NText,
} from 'naive-ui'
import CurrentOrderMap from '@/components/business/order/CurrentOrderMap.vue'
import { useDriverCurrentOrderView } from '@/composables/useDriverCurrentOrderView'

const {
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
} = useDriverCurrentOrderView()

onMounted(() => {
  refresh()
})
</script>

<template>
  <div class="current-order-page">
    <div class="page-header">
      <div>
        <div class="page-title">当前订单</div>
        <NText depth="3">查看已认领订单的实时信息</NText>
      </div>
      <div class="header-actions">
        <NButton size="small" secondary @click="handleRefresh">刷新</NButton>
      </div>
    </div>

    <NAlert v-if="errorMessage" type="error" :bordered="false">
      {{ errorMessage }}
    </NAlert>

    <NSpin :show="loading">
      <div v-if="!orderDetail" class="empty-state">
        <NEmpty description="暂无当前订单">
          <template #extra>
            <NButton type="primary" secondary @click="goToPool">去订单池认领</NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else class="content-grid">
        <div class="map-column">
          <div class="map-panel">
            <CurrentOrderMap
              :pickup="pickupPoint"
              :dropoff="dropoffPoint"
              :route="mapRoutePoints"
              :route-style="routeStyle"
              :status-text="statusLabel"
              :driving-mode="showRouteOptions"
              :driving-selection-index="selectedRouteIndex"
              :driving-strategy="10"
            />
          </div>

          <NCard v-if="showRouteOptions" class="route-card">
            <div class="section-title">路线方案</div>
            <NText depth="3">请选择路线并结束订单</NText>
            <NSpin :show="planning" class="route-spin">
              <div v-if="planError" class="route-error">
                <div>{{ planError }}</div>
                <NButton size="small" tertiary @click="handleReplan">重新规划</NButton>
              </div>
              <div v-else class="route-list">
                <div
                  v-for="(option, index) in routeOptions"
                  :key="option.id"
                  class="route-option"
                  :class="{ active: option.id === selectedRouteId }"
                  role="button"
                  tabindex="0"
                  @click="handleSelectRoute(option.id)"
                  @keyup.enter="handleSelectRoute(option.id)"
                >
                  <div class="route-meta">
                    <div class="route-name">方案 {{ index + 1 }}</div>
                    <NText depth="3">
                      {{ formatDistanceMeters(option.distance) }} ·
                      {{ formatDurationSeconds(option.duration) }}
                    </NText>
                  </div>
                  <NTag v-if="option.id === selectedRouteId" type="info" size="small"> 已选 </NTag>
                </div>
                <div v-if="!planning && routeOptions.length === 0" class="route-empty">
                  <NEmpty description="暂无可用路线">
                    <template #extra>
                      <NButton size="small" secondary @click="handleReplan">重新规划</NButton>
                    </template>
                  </NEmpty>
                </div>
              </div>
            </NSpin>
          </NCard>
        </div>

        <div class="detail-column">
          <NCard class="status-card" size="large">
            <div class="status-row">
              <div>
                <div class="status-title">订单状态</div>
                <div class="status-value">{{ statusLabel }}</div>
              </div>
              <NTag :type="statusTagType" size="large">{{ statusLabel }}</NTag>
            </div>
            <div class="status-hint">{{ statusHint }}</div>
            <div class="status-meta">
              <span>订单号：{{ orderDetail.orderId }}</span>
              <span>司机：{{ orderDetail.driverId || '本人' }}</span>
            </div>
            <div v-if="nextStepVisible" class="status-actions">
              <NButton
                type="primary"
                :disabled="nextStepDisabled"
                :loading="actionLoading"
                @click="handleNextStep"
              >
                下一步 →
              </NButton>
              <NText v-if="nextStepHint" depth="3">下一步：{{ nextStepHint }}</NText>
            </div>
          </NCard>

          <NCard>
            <div class="section-title">行程信息</div>
            <NDescriptions :column="1" size="small" label-placement="left">
              <NDescriptionsItem v-for="item in detailItems" :key="item.label" :label="item.label">
                {{ item.value }}
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.current-order-page {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  padding: 48px 0;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.9fr);
  gap: 24px;
  align-items: start;
}

.map-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-panel {
  height: clamp(360px, 60vh, 620px);
}

.detail-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  border-radius: 18px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.status-title {
  font-size: 0.9rem;
  color: #64748b;
}

.status-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.status-hint {
  margin-top: 8px;
  color: #475569;
}

.status-meta {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: #64748b;
}

.status-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #0f172a;
}

.route-card {
  border-radius: 16px;
}

.route-spin {
  margin-top: 12px;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
}

.route-option.active {
  border-color: #60a5fa;
  background: #eff6ff;
}

.route-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-name {
  font-weight: 600;
  color: #0f172a;
}

.route-empty {
  padding: 16px 0;
}

.route-error {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #ef4444;
}

@media (max-width: 720px) {
  .current-order-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .map-panel {
    height: 360px;
  }
}
</style>
