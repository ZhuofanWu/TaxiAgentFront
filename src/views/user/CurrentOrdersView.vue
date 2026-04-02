<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NList,
  NListItem,
  NSpin,
  NTag,
  NText,
} from 'naive-ui'
import CurrentOrderMap from '@/components/business/order/CurrentOrderMap.vue'
import UserCurrentOrderActions from '@/components/business/order/UserCurrentOrderActions.vue'
import { useCurrentOrderView } from '@/composables/useCurrentOrderView'

const {
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
} = useCurrentOrderView()
</script>

<template>
  <div class="current-order-page">
    <div class="page-header">
      <div>
        <div class="page-title">当前订单</div>
        <NText depth="3">实时查看行程状态与费用详情。</NText>
      </div>
      <div class="header-actions">
        <NButton size="small" secondary @click="refresh">刷新</NButton>
        <NButton v-if="!isListing" size="small" tertiary @click="handleBackToList">
          查看其它订单
        </NButton>
      </div>
    </div>

    <NAlert v-if="errorMessage" type="error" :bordered="false" class="status-alert">
      {{ errorMessage }}
    </NAlert>

    <div v-if="isListing" class="select-wrapper">
      <NCard v-if="listLoading" class="select-card">
        <NSpin size="large">
          <div class="loading-text">正在查询您的进行中订单...</div>
        </NSpin>
      </NCard>

      <NCard v-else-if="ongoingOrderIds.length > 1" class="select-card">
        <div class="select-title">查询到您有多个行程中订单，请问您查看哪个订单？</div>
        <NList bordered>
          <NListItem v-for="id in ongoingOrderIds" :key="id">
            <div class="list-item">
              <div class="order-id">{{ id }}</div>
              <NButton text type="primary" @click="handleSelectOrder(id)">查看订单</NButton>
            </div>
          </NListItem>
        </NList>
      </NCard>

      <NCard v-else class="select-card">
        <NEmpty description="暂无进行中订单">
          <template #extra>
            <NButton type="primary" secondary @click="refresh">刷新看看</NButton>
          </template>
        </NEmpty>
      </NCard>
    </div>

    <NSpin v-else :show="detailLoading" class="detail-spin">
      <div class="order-grid">
        <div class="map-column">
          <CurrentOrderMap
            :pickup="pickupPoint"
            :dropoff="dropoffPoint"
            :route="routePoints"
            :route-style="routeStyle"
            :status-text="statusLabel"
          />
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
              <span>订单号：{{ orderDetail?.orderId || '-' }}</span>
              <span>司机：{{ orderDetail?.driverId || '待分配' }}</span>
            </div>
            <UserCurrentOrderActions v-if="orderDetail" :order="orderDetail" @refresh="refresh" />
          </NCard>

          <NCard v-for="section in detailSections" :key="section.title">
            <div class="section-title">{{ section.title }}</div>
            <NDescriptions :column="1" size="small" label-placement="left">
              <NDescriptionsItem
                v-for="item in section.items"
                :key="item.label"
                :label="item.label"
              >
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

.status-alert {
  border-radius: 12px;
}

.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.select-card {
  border-radius: 16px;
}

.select-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #0f172a;
}

.loading-text {
  color: #64748b;
  padding: 8px 0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.order-id {
  font-weight: 600;
  color: #1e293b;
}

.order-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 24px;
  align-items: start;
  height: 100%;
}

.map-column {
  position: sticky;
  top: 16px;
  height: calc(100vh - 160px);
  min-height: 520px;
}

.detail-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
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

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #0f172a;
}

@media (max-width: 1100px) {
  .order-grid {
    grid-template-columns: 1fr;
  }

  .map-column {
    position: relative;
    height: auto;
    min-height: 360px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .status-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
