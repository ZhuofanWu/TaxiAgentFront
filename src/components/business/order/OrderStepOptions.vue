<script setup lang="ts">
import { NButton, NDatePicker, NSwitch, NText } from 'naive-ui'

interface Props {
  isScheduled: boolean
  scheduledTime: Date | null
  isUrgent: boolean
  urgentFee: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:isScheduled', value: boolean): void
  (e: 'update:scheduledTime', value: Date | null): void
  (e: 'update:isUrgent', value: boolean): void
  (e: 'next'): void
}>()

function handleScheduleToggle(value: boolean) {
  emit('update:isScheduled', value)
  if (!value) emit('update:scheduledTime', null)
}

function handleDateChange(value: number | null) {
  emit('update:scheduledTime', value ? new Date(value) : null)
}

function toTimestamp(date: Date | null): number | null {
  return date ? date.getTime() : null
}

function isDateDisabled(timestamp: number): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return timestamp < today.getTime()
}
</script>

<template>
  <div class="options-step">
    <div class="option-row">
      <div class="option-info">
        <div class="option-title">是否预约</div>
        <NText depth="3">提前锁定用车时间，避免高峰排队。</NText>
      </div>
      <NSwitch :value="props.isScheduled" @update:value="handleScheduleToggle" />
    </div>
    <div v-if="props.isScheduled" class="option-extra">
      <NDatePicker
        type="datetime"
        :value="toTimestamp(props.scheduledTime)"
        :is-date-disabled="isDateDisabled"
        @update:value="handleDateChange"
      />
    </div>

    <div class="option-row">
      <div class="option-info">
        <div class="option-title">是否加急</div>
        <NText depth="3">加急费用为总价的 20% + 5 元。</NText>
      </div>
      <NSwitch :value="props.isUrgent" @update:value="emit('update:isUrgent', $event)" />
    </div>
    <div v-if="props.isUrgent" class="option-extra">
      <NText depth="3">预计加急费：¥{{ props.urgentFee.toFixed(2) }}</NText>
    </div>

    <div class="option-actions">
      <NButton type="primary" @click="emit('next')">下一步</NButton>
    </div>
  </div>
</template>

<style scoped>
.options-step {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-title {
  font-weight: 600;
  color: #0f172a;
}

.option-extra {
  margin-left: 8px;
}

.option-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
