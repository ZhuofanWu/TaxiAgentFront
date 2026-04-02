<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NSelect, NText } from 'naive-ui'
import type { PoiItem } from '@/composables/useAmapPoiSearch'

interface Props {
  address: string
  loading: boolean
  homePoi: PoiItem | null
  workPoi: PoiItem | null
  otherPois: PoiItem[]
  selectedOtherId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'update:selectedOtherId', value: string | null): void
  (e: 'select-poi', value: PoiItem | null): void
}>()

const otherOptions = computed(() =>
  props.otherPois.map((poi) => ({ label: poi.name, value: poi.id })),
)

function handleCommonSelect(poi: PoiItem | null) {
  emit('update:selectedOtherId', null)
  emit('select-poi', poi)
}

function handleOtherSelect(value: string | null) {
  emit('update:selectedOtherId', value)
  const poi = value ? (props.otherPois.find((item) => item.id === value) ?? null) : null
  emit('select-poi', poi)
}
</script>

<template>
  <div class="pickup-step">
    <div class="pickup-info">
      <div class="label">当前上车点</div>
      <NText class="address" depth="2">{{ address }}</NText>
    </div>
    <div class="common-block">
      <div class="block-title">兴趣点选择</div>
      <div class="common-grid">
        <button class="common-item" type="button" @click="handleCommonSelect(props.homePoi)">
          <div class="item-label">家</div>
          <NText class="item-address" depth="3">
            {{ props.homePoi?.address || '暂无记录，稍后可在地址管理中添加' }}
          </NText>
        </button>
        <button class="common-item" type="button" @click="handleCommonSelect(props.workPoi)">
          <div class="item-label">公司</div>
          <NText class="item-address" depth="3">
            {{ props.workPoi?.address || '暂无记录，稍后可在地址管理中添加' }}
          </NText>
        </button>
        <div class="other-select">
          <div class="item-label">其他常用</div>
          <NSelect
            :value="props.selectedOtherId"
            :options="otherOptions"
            placeholder="选择其他兴趣点"
            @update:value="handleOtherSelect"
          />
        </div>
      </div>
    </div>
    <div class="pickup-tip">拖动左侧地图微调上车点，确认后进入下一步。</div>
    <NButton type="primary" :loading="loading" @click="emit('confirm')">确认这里上车</NButton>
  </div>
</template>

<style scoped>
.pickup-step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pickup-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 0.85rem;
  color: #64748b;
}

.address {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.pickup-tip {
  font-size: 0.85rem;
  color: #94a3b8;
}

.common-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-title {
  font-size: 0.85rem;
  color: #64748b;
}

.common-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.common-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  text-align: left;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.common-item:hover {
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.item-label {
  font-weight: 600;
  color: #0f172a;
}

.item-address {
  font-size: 0.85rem;
}

.other-select {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: span 2;
}

@media (max-width: 640px) {
  .common-grid {
    grid-template-columns: 1fr;
  }

  .other-select {
    grid-column: span 1;
  }
}
</style>
