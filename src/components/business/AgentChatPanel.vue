<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { NButton, NCard, NInput, NText } from 'naive-ui'
import { useAgentChat } from '@/composables/useAgentChat'
import type { AgentConfirmPayloadValue } from '@/types/agentChat'

const {
  chatId,
  messages,
  confirmPayload,
  hasRestorable,
  statusText,
  isStreaming,
  receivedEvents,
  isTransitioning,
  inputDisabled,
  initialize,
  sendPrompt,
  sendResume,
  restorePreviousChat,
  startNewChat,
} = useAgentChat()

const messageInput = ref('')
const messageListEl = ref<HTMLDivElement | null>(null)
const showRejectInput = ref(false)
const rejectReason = ref('')

const shortChatId = computed(() => (chatId.value ? `${chatId.value.slice(0, 8)}...` : '-'))
const sendDisabled = computed(() => inputDisabled.value || !messageInput.value.trim())
const confirmDisabled = computed(() => isStreaming.value || isTransitioning.value)

const fieldNameMap: Record<string, string> = {
  VEHICLE_TYPE: '车型',
  IS_RESERVATION: '是否预约',
  IS_EXPEDITED: '是否加急',
  SCHEDULED_TIME: '预约时间',
  EST_TIME: '预计时间',
  START_ADDRESS: '起点地址',
  START_LAT: '起点纬度',
  START_LNG: '起点经度',
  END_ADDRESS: '终点地址',
  END_LAT: '终点纬度',
  END_LNG: '终点经度',
  EST_PRICE: '预估价格',
  EST_DISTANCE_KM: '预估距离',
}

const vehicleTypeMap: Record<string, string> = {
  '1': '快车',
  '2': '优享',
  '3': '专车',
}

const boolMap: Record<string, string> = {
  '0': '否',
  '1': '是',
}

function formatConfirmValue(key: string, value: AgentConfirmPayloadValue) {
  const raw = value === null ? '' : String(value)
  if (key === 'VEHICLE_TYPE') return vehicleTypeMap[raw] || raw
  if (key === 'IS_RESERVATION' || key === 'IS_EXPEDITED') return boolMap[raw] || raw
  if (key === 'EST_PRICE') return raw ? `¥${raw}` : ''
  if (key === 'EST_DISTANCE_KM') return raw ? `${raw} km` : ''
  if (key === 'EST_TIME') {
    const seconds = Number(raw)
    if (!Number.isFinite(seconds) || seconds <= 0) return raw
    const minutes = Math.max(1, Math.round(seconds / 60))
    return `${minutes}分钟`
  }
  return raw
}

const confirmRows = computed(() => {
  if (!confirmPayload.value) return [] as Array<{ label: string; value: string }>
  const knownKeys = [
    'START_ADDRESS',
    'END_ADDRESS',
    'VEHICLE_TYPE',
    'IS_RESERVATION',
    'SCHEDULED_TIME',
    'IS_EXPEDITED',
    'EST_TIME',
    'EST_DISTANCE_KM',
    'EST_PRICE',
  ]

  const keys: string[] = []
  knownKeys.forEach((key) => {
    if (key in confirmPayload.value!) keys.push(key)
  })
  Object.keys(confirmPayload.value).forEach((key) => {
    if (!knownKeys.includes(key)) keys.push(key)
  })

  return keys.map((key) => ({
    label: fieldNameMap[key] || key,
    value: formatConfirmValue(key, confirmPayload.value?.[key] ?? null),
  }))
})

function scrollToBottom() {
  if (!messageListEl.value) return
  messageListEl.value.scrollTop = messageListEl.value.scrollHeight
}

async function handleSend() {
  const content = messageInput.value.trim()
  if (!content || sendDisabled.value) return
  messageInput.value = ''
  await sendPrompt(content)
}

async function handleConfirm() {
  if (confirmDisabled.value) return
  showRejectInput.value = false
  rejectReason.value = ''
  await sendResume('用户已确认，请继续执行')
}

async function handleSubmitReject() {
  const reason = rejectReason.value.trim()
  if (!reason || confirmDisabled.value) return
  showRejectInput.value = false
  rejectReason.value = ''
  await sendResume(`用户不满意，修改意见：${reason}`)
}

async function handleRestore() {
  await restorePreviousChat()
  showRejectInput.value = false
  rejectReason.value = ''
}

async function handleNewChat() {
  await startNewChat()
  showRejectInput.value = false
  rejectReason.value = ''
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void handleSend()
  }
}

watch(messages, () => void nextTick(scrollToBottom), { deep: true })
watch(confirmPayload, () => {
  showRejectInput.value = false
  rejectReason.value = ''
  void nextTick(scrollToBottom)
})

onMounted(() => {
  void initialize()
})
</script>

<template>
  <NCard class="agent-chat-card" :content-style="{ padding: '0' }">
    <template #header>
      <div class="chat-header">
        <div class="chat-title-group">
          <div class="chat-title">智能体对话</div>
          <NText depth="3" class="chat-meta">对话ID：{{ shortChatId }}</NText>
        </div>
        <NButton size="small" :loading="isTransitioning" @click="handleNewChat"> 新对话 </NButton>
      </div>
    </template>

    <div class="chat-body">
      <div ref="messageListEl" class="chat-messages">
        <div v-if="hasRestorable" class="restore-wrap">
          <NButton
            size="small"
            type="warning"
            ghost
            :loading="isTransitioning"
            @click="handleRestore"
          >
            恢复之前对话
          </NButton>
        </div>

        <div v-for="item in messages" :key="item.id" class="message-row" :class="`is-${item.role}`">
          <div class="message-bubble">{{ item.content }}</div>
        </div>

        <div v-if="confirmPayload" class="confirm-card">
          <div class="confirm-title">请确认信息</div>
          <table class="confirm-table">
            <tbody>
              <tr v-for="row in confirmRows" :key="row.label">
                <th>{{ row.label }}</th>
                <td>{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
          <div class="confirm-actions">
            <NButton type="primary" :disabled="confirmDisabled" @click="handleConfirm">
              确认
            </NButton>
            <NButton :disabled="confirmDisabled" @click="showRejectInput = true">
              需要修改
            </NButton>
          </div>
          <div v-if="showRejectInput" class="reject-area">
            <NInput
              v-model:value="rejectReason"
              type="textarea"
              placeholder="请告诉我需要修改什么..."
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
            <NButton type="primary" :disabled="confirmDisabled" @click="handleSubmitReject">
              提交
            </NButton>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <NInput
          v-model:value="messageInput"
          type="textarea"
          placeholder="请输入指令..."
          :autosize="{ minRows: 1, maxRows: 4 }"
          :disabled="inputDisabled"
          @keydown="handleInputKeydown"
        />
        <NButton type="primary" :disabled="sendDisabled" @click="handleSend"> 发送 </NButton>
      </div>

      <div class="status-bar">
        <div class="status-indicator">
          <span class="status-dot" :class="{ streaming: isStreaming }" />
          <span>{{ statusText }}</span>
        </div>
        <span v-if="receivedEvents">{{ receivedEvents }} 条事件</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped src="./AgentChatPanel.css"></style>
