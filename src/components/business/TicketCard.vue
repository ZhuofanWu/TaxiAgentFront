<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NText } from 'naive-ui'
import type { TicketVO } from '@/types/ticket'

const props = defineProps<{
  ticket: TicketVO
}>()

const emit = defineEmits<{
  click: [ticket: TicketVO]
}>()

// 工单类型标签类型 - 只有安全问题为红色
const typeTagType = computed(() => {
  const map: Record<number, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
    4: 'error',      // 安全问题 - 红色
  }
  return map[props.ticket.ticketType] || 'default'
})

// 优先级配置 - 只有特急为红色
const priorityTagType = computed(() => {
  const map: Record<number, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
    3: 'error',      // 特急 - 红色
  }
  return map[props.ticket.priority] || 'default'
})

// 格式化时间
function formatTime(time: string) {
  if (!time) return '-'
  const date = new Date(time)
  if (isNaN(date.getTime())) return '-'

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1小时显示分钟
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
  }

  // 小于24小时显示小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }

  // 超过24小时显示日期
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<template>
  <NCard
    class="ticket-card"
    hoverable
    @click="emit('click', ticket)"
  >
    <div class="card-content">
      <div class="card-header">
        <NTag :type="typeTagType" size="small" round>
          {{ ticket.ticketTypeDesc }}
        </NTag>
        <NTag
          :type="priorityTagType"
          size="small"
          round
          bordered
        >
          {{ ticket.priorityDesc }}
        </NTag>
      </div>

      <div class="card-title">
        {{ ticket.title }}
      </div>

      <div class="card-footer">
        <NText depth="3">
          {{ formatTime(ticket.createdAt) }}
        </NText>
        <NText depth="3">
          {{ ticket.ticketStatusDesc }}
        </NText>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.ticket-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.ticket-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  gap: 0.5rem;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
}
</style>
