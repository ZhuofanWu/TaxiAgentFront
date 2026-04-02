<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NTag } from 'naive-ui'

interface Props {
  step: number
  title: string
  isActive: boolean
  isCompleted: boolean
  hint?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{ (e: 'edit'): void }>()

const statusText = computed(() => {
  if (props.isActive) return '进行中'
  if (props.isCompleted) return '已完成'
  return '待完成'
})

const statusType = computed(() => {
  if (props.isActive) return 'success'
  if (props.isCompleted) return 'default'
  return 'warning'
})

const statusClass = computed(() => ({
  active: props.isActive,
  completed: props.isCompleted,
  pending: !props.isActive && !props.isCompleted,
}))
</script>

<template>
  <div class="step-item" :class="statusClass">
    <div class="step-head">
      <div class="step-index">{{ step }}</div>
      <div class="step-title">
        <div class="title">{{ title }}</div>
        <div v-if="hint" class="hint">{{ hint }}</div>
      </div>
      <div class="step-actions">
        <NTag size="small" :type="statusType" :bordered="false">{{ statusText }}</NTag>
        <NButton v-if="isCompleted && !isActive" text size="tiny" @click="emit('edit')">
          编辑
        </NButton>
      </div>
    </div>

    <div class="step-body" :class="{ open: isActive }">
      <div class="body-inner">
        <slot />
      </div>
    </div>

    <div class="step-summary" :class="{ open: isCompleted && !isActive }">
      <div class="summary-inner">
        <slot name="summary" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.step-item.active {
  border-color: #60a5fa;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.12);
}

.step-item.pending {
  opacity: 0.8;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.4), rgba(255, 255, 255, 0.8));
}

.step-index {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #1d4ed8;
  background: rgba(191, 219, 254, 0.6);
}

.step-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title .title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.step-title .hint {
  font-size: 0.825rem;
  color: #64748b;
}

.step-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-body,
.step-summary {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
}

.step-body.open,
.step-summary.open {
  max-height: 700px;
  opacity: 1;
}

.body-inner,
.summary-inner {
  padding: 16px 18px 18px;
}

.step-summary {
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .step-head {
    padding: 14px 16px;
  }

  .body-inner,
  .summary-inner {
    padding: 14px 16px 16px;
  }
}
</style>
