<script setup lang="ts">
import { NButton, NText } from 'naive-ui'

interface SummaryItem {
  label: string
  value: string
}

interface Props {
  items: SummaryItem[]
  priceText: string
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'select-coupon'): void
}>()
</script>

<template>
  <div class="summary-step">
    <div class="summary-list">
      <div v-for="item in items" :key="item.label" class="summary-row">
        <span class="summary-label">{{ item.label }}</span>
        <NText class="summary-value" depth="2">{{ item.value }}</NText>
      </div>
    </div>
    <div class="summary-price">
      <span class="price-label">预估一口价</span>
      <span class="price-value">{{ priceText }}</span>
    </div>
    <button class="coupon-row" type="button" @click="emit('select-coupon')">
      <span>选择优惠券</span>
      <span class="coupon-status">暂无可用</span>
    </button>
    <NButton type="primary" size="large" :loading="loading" @click="emit('submit')">
      呼叫车辆
    </NButton>
  </div>
</template>

<style scoped>
.summary-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-list {
  display: grid;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.summary-label {
  font-size: 0.85rem;
  color: #64748b;
}

.summary-value {
  text-align: right;
  max-width: 60%;
}

.summary-price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(191, 219, 254, 0.6), rgba(255, 255, 255, 0.9));
}

.price-label {
  color: #1e3a8a;
  font-weight: 600;
}

.price-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
}

.coupon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed #cbd5f5;
  background: #fff;
  color: #1e293b;
}

.coupon-status {
  font-size: 0.85rem;
  color: #94a3b8;
}
</style>
