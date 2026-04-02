<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NInput, NSelect, NText } from 'naive-ui'
import type { PoiItem } from '@/composables/useAmapPoiSearch'

interface Props {
  searchText: string
  searchLoading: boolean
  confirmLoading: boolean
  homePoi: PoiItem | null
  workPoi: PoiItem | null
  otherPois: PoiItem[]
  selectedOtherId: string | null
  results: PoiItem[]
  selectedId: string | null
  hasSearched: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:searchText', value: string): void
  (e: 'update:selectedOtherId', value: string | null): void
  (e: 'search'): void
  (e: 'confirm'): void
  (e: 'select-poi', value: PoiItem | null): void
}>()

const otherOptions = computed(() =>
  props.otherPois.map((poi) => ({ label: poi.name, value: poi.id })),
)

function handleInput(value: string) {
  emit('update:searchText', value)
}

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
  <div class="destination-step">
    <div class="search-row">
      <NInput :value="props.searchText" placeholder="输入目的地地址" @update:value="handleInput" />
      <NButton type="primary" :loading="props.searchLoading" @click="emit('search')">
        搜索
      </NButton>
    </div>
    <div class="result-panel">
      <div v-if="props.results.length" class="result-hint">
        搜索结果已展示在地图上，点击卡片可自动填入目的地。
      </div>
      <div v-else-if="props.hasSearched" class="result-empty">暂无搜索结果</div>
    </div>
    <div class="common-block">
      <div class="block-title">常用地址</div>
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
            placeholder="选择其他常用地址"
            @update:value="handleOtherSelect"
          />
        </div>
      </div>
    </div>
    <div class="confirm-row">
      <NButton type="primary" size="large" :loading="props.confirmLoading" @click="emit('confirm')">
        确认目的地
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.destination-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.result-panel {
  display: grid;
  gap: 8px;
}

.result-hint {
  font-size: 0.85rem;
  color: #475569;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fafc;
}

.result-empty {
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

.confirm-row {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .search-row {
    grid-template-columns: 1fr;
  }

  .common-grid {
    grid-template-columns: 1fr;
  }

  .other-select {
    grid-column: span 1;
  }

  .confirm-row {
    justify-content: stretch;
  }

  .confirm-row :deep(.n-button) {
    width: 100%;
  }
}
</style>
