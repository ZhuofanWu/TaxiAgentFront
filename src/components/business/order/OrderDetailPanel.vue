<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NInput,
  NSpin,
  NTag,
  NText,
} from 'naive-ui'
import CurrentOrderMap from '@/components/business/order/CurrentOrderMap.vue'
import { useOrderDetailView } from '@/composables/useOrderDetailView'

const {
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
} = useOrderDetailView()
</script>

<template>
  <div class="order-detail-page">
    <div class="page-header">
      <div>
        <div class="page-title">订单详情</div>
        <NText depth="3">输入订单号查看行程与费用信息。</NText>
      </div>
      <div class="query-bar">
        <NInput
          v-model:value="orderIdInput"
          placeholder="请输入订单号"
          clearable
          class="order-input"
          @keyup.enter="handleDisplay"
        />
        <NButton type="primary" :loading="loading" @click="handleDisplay">显示</NButton>
      </div>
    </div>

    <NAlert v-if="errorMessage" type="error" :bordered="false" class="error-alert">
      {{ errorMessage }}
    </NAlert>

    <div class="content-grid">
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
        <NSpin :show="loading">
          <template v-if="orderDetail">
            <NCard class="status-card">
              <div class="status-row">
                <div>
                  <div class="status-title">订单状态</div>
                  <div class="status-value">{{ statusLabel }}</div>
                </div>
                <NTag :type="statusTagType" size="large">{{ statusLabel }}</NTag>
              </div>
              <div class="status-meta">
                <span>订单号：{{ orderDetail.orderId }}</span>
                <span>乘客：{{ orderDetail.userId || '-' }}</span>
              </div>
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
          </template>
          <NCard v-else class="empty-card">
            <NEmpty description="暂无订单详情">
              <template #extra>
                <NText depth="3">请输入订单号后点击显示</NText>
              </template>
            </NEmpty>
          </NCard>
        </NSpin>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail-page {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.query-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-input {
  width: 260px;
}

.error-alert {
  border-radius: 12px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 1.5rem;
  align-items: start;
  flex: 1;
  min-height: 0;
}

.map-column {
  position: sticky;
  top: 16px;
  min-height: 520px;
}

.detail-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.status-card {
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  border-radius: 18px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.status-meta {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #64748b;
}

.section-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.empty-card {
  border-radius: 16px;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .map-column {
    position: relative;
    min-height: 360px;
  }
}

@media (max-width: 720px) {
  .query-bar {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .order-input {
    width: 100%;
  }
}
</style>
