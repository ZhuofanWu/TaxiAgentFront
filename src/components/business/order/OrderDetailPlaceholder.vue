<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NText } from 'naive-ui'

const route = useRoute()
const orderId = computed(() => (route.query.orderId ? String(route.query.orderId) : ''))
</script>

<template>
  <div class="order-detail-page">
    <div class="page-header">
      <div>
        <h1>订单详情</h1>
        <NText depth="3">订单详情功能开发中...</NText>
      </div>
    </div>

    <NCard class="detail-card">
      <div class="detail-row">
        <span class="label">订单号</span>
        <span class="value">{{ orderId || '暂无' }}</span>
      </div>
    </NCard>
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

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.35rem;
}

.detail-card {
  max-width: 420px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.label {
  font-size: 0.875rem;
  color: #64748b;
}

.value {
  font-weight: 600;
  color: #0f172a;
}
</style>
