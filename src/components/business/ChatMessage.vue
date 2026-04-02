<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NAvatar, NText } from 'naive-ui'
import type { TicketChatVO } from '@/types/ticket'
import { SenderRole } from '@/types/ticket'

const props = withDefaults(
  defineProps<{
    message: TicketChatVO
    ownRoles?: SenderRole[]
  }>(),
  {
    ownRoles: () => [SenderRole.SUPPORT],
  },
)

// 发送者配置
const defaultConfig = { name: '系统', color: '#64748b', bgColor: '#f1f5f9' }
const senderConfig = computed(() => {
  const map: Record<number, { name: string; color: string; bgColor: string }> = {
    [SenderRole.SYSTEM]: defaultConfig,
    [SenderRole.PASSENGER]: { name: '乘客', color: '#3b82f6', bgColor: '#eff6ff' },
    [SenderRole.DRIVER]: { name: '司机', color: '#22c55e', bgColor: '#f0fdf4' },
    [SenderRole.SUPPORT]: { name: '客服', color: '#f59e0b', bgColor: '#fffbeb' },
  }
  return map[props.message.senderRole] || defaultConfig
})

const isOwn = computed(() => props.ownRoles.includes(props.message.senderRole))

function formatTime(time: string) {
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time

  const now = new Date()
  const todayKey = getDateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = getDateKey(yesterday)
  const targetKey = getDateKey(date)
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`

  if (targetKey === todayKey) return `今天 ${timePart}`
  if (targetKey === yesterdayKey) return `昨天 ${timePart}`
  return `${formatDate(date)} ${timePart}`
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function pad2(value: number) {
  return value.toString().padStart(2, '0')
}

// 获取首字符作为头像
function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}
</script>

<template>
  <div class="chat-message" :class="{ 'is-own': isOwn }">
    <div class="message-avatar">
      <NAvatar round size="small" :style="{ backgroundColor: senderConfig.bgColor }">
        <span :style="{ color: senderConfig.color }">
          {{ getInitial(senderConfig.name) }}
        </span>
      </NAvatar>
    </div>

    <div class="message-content">
      <div class="message-header">
        <NText depth="2" size="small">{{ message.senderRoleDesc }}</NText>
        <NText depth="3" size="small">{{ formatTime(message.createdAt) }}</NText>
      </div>
      <NCard size="small" :bordered="false" class="message-bubble">
        <NText>{{ message.content }}</NText>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
}

.chat-message.is-own {
  flex-direction: row-reverse;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.message-bubble {
  background: #f8fafc;
  border-radius: 0.75rem;
  border-top-left-radius: 0.25rem;
}

.is-own .message-bubble {
  background: #eff6ff;
  border-radius: 0.75rem;
  border-top-right-radius: 0.25rem;
  border-top-left-radius: 0.75rem;
}
</style>
