<script setup lang="ts">
import { NButton, NSpin, NText } from 'naive-ui'
import type { VehicleType } from '@/types/order'

interface VehicleOption {
  type: VehicleType
  title: string
  subtitle: string
  eta: string
  priceText: string
}

interface Props {
  options: VehicleOption[]
  selectedType: VehicleType | null
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{ (e: 'select', value: VehicleType): void }>()
</script>

<template>
  <div class="vehicle-step">
    <NSpin :show="loading">
      <div class="vehicle-list">
        <button
          v-for="option in options"
          :key="option.type"
          class="vehicle-card"
          :class="{ active: selectedType === option.type }"
          type="button"
          @click="emit('select', option.type)"
        >
          <div class="vehicle-info">
            <div class="vehicle-title">{{ option.title }}</div>
            <NText class="vehicle-sub" depth="3">{{ option.subtitle }}</NText>
          </div>
          <div class="vehicle-meta">
            <div class="vehicle-price">{{ option.priceText }}</div>
            <div class="vehicle-eta">约 {{ option.eta }} 到达</div>
          </div>
        </button>
      </div>
    </NSpin>
    <div class="vehicle-hint">
      <NText depth="3">快车价来自实时估价，优享/专车按倍率计算。</NText>
    </div>
    <div class="vehicle-actions">
      <NButton size="small" tertiary>查看计价规则</NButton>
    </div>
  </div>
</template>

<style scoped>
.vehicle-step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-list {
  display: grid;
  gap: 12px;
}

.vehicle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
  text-align: left;
}

.vehicle-card:hover {
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.vehicle-card.active {
  border-color: #3b82f6;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.15);
}

.vehicle-title {
  font-weight: 600;
  color: #0f172a;
}

.vehicle-sub {
  font-size: 0.85rem;
}

.vehicle-meta {
  text-align: right;
}

.vehicle-price {
  font-weight: 600;
  color: #0f172a;
}

.vehicle-eta {
  font-size: 0.8rem;
  color: #64748b;
}

.vehicle-hint {
  font-size: 0.85rem;
}

.vehicle-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
