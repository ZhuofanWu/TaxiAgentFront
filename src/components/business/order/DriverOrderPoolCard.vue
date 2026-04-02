<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NText } from 'naive-ui'
import type { DriverOrderPoolItem } from '@/types/order'

const props = defineProps<{ order: DriverOrderPoolItem }>()
const emit = defineEmits<{ (event: 'claim', order: DriverOrderPoolItem): void }>()

const distanceText = computed(() => formatDistance(props.order.estDistance))
const priceText = computed(() => formatPrice(props.order.estPrice))

function handleClick() {
  emit('claim', props.order)
}

function formatDistance(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `${parsed.toFixed(1)} km`
}

function formatPrice(value: number | string | null | undefined): string {
  const parsed = resolveNumber(value)
  if (parsed == null) return '-'
  return `¥${parsed.toFixed(2)}`
}

function resolveNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}
</script>

<template>
  <NCard class="order-card" hoverable @click="handleClick">
    <div class="card-header">
      <div class="order-id">订单号 {{ order.orderId }}</div>
      <NTag type="warning" size="small" round>待接单</NTag>
    </div>
    <div class="route-section">
      <div class="route-item">
        <span class="route-label">起点</span>
        <span class="route-value">{{ order.startAddress || '-' }}</span>
      </div>
      <div class="route-divider"></div>
      <div class="route-item">
        <span class="route-label">终点</span>
        <span class="route-value">{{ order.endAddress || '-' }}</span>
      </div>
    </div>
    <div class="metrics">
      <div class="metric">
        <span class="metric-label">里程</span>
        <span class="metric-value">{{ distanceText }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">预估价格</span>
        <span class="metric-value">{{ priceText }}</span>
      </div>
      <NText depth="3" class="action-tip">点击卡片认领</NText>
    </div>
  </NCard>
</template>

<style scoped>
.order-card {
  border-radius: 16px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.order-id {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.95rem;
}

.route-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.route-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-label {
  font-size: 0.75rem;
  color: #64748b;
}

.route-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
}

.route-divider {
  height: 1px;
  background: #e2e8f0;
}

.metrics {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: center;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.action-tip {
  grid-column: 1 / -1;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .metrics {
    grid-template-columns: 1fr;
  }
}
</style>
