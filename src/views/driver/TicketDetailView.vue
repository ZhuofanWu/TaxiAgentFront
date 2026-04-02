<script setup lang="ts">
import { onMounted, ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NTag,
  NText,
  NSplit,
  NInput,
  NIcon,
  NModal,
  NSelect,
  NRate,
  useMessage,
} from 'naive-ui'
import ChatMessage from '@/components/business/ChatMessage.vue'
import { getTicketDetail } from '@/api/ticket'
import {
  appendTicketMessage,
  cancelTicket,
  escalateTicketByUser,
  feedbackTicket,
} from '@/api/ticket'
import { SenderRole } from '@/types/ticket'
import type { TicketDetailVO, TicketChatVO } from '@/types/ticket'

const BackIcon = {
  render: () =>
    h('svg', { viewBox: '0 0 512 512', fill: 'currentColor', style: 'width: 1em; height: 1em;' }, [
      h('path', {
        d: 'M177.9 273.1L96 359.2l-9.8-86.1H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h54.3l9.8-86.1 81.9 86.1c12.4 12.4 12.4 32.5 0 44.9z',
      }),
    ]),
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const ticketId = route.params.id as string

// 工单详情
const ticket = ref<TicketDetailVO | null>(null)
const chatHistory = ref<TicketChatVO[]>([])
const loading = ref(true)

// 回复相关
const replyContent = ref('')
const replyLoading = ref(false)

// 加急相关
const showEscalateModal = ref(false)
const escalateLoading = ref(false)
const escalateForm = ref({ targetLevel: 2, reason: '' })

// 结单评价相关
const showFeedbackModal = ref(false)
const feedbackLoading = ref(false)
const feedbackForm = ref({ satisfied: true, rating: 5, feedbackContent: '' })

onMounted(async () => {
  try {
    loading.value = true
    ticket.value = await getTicketDetail(ticketId)
    chatHistory.value = ticket.value?.chatHistory || []
  } catch (error) {
    message.error('获取工单详情失败')
    router.push('/driver/my-tickets')
  } finally {
    loading.value = false
  }
})

// 是否可以加急（仅安全问题类型）
const canEscalate = computed(() => {
  if (!ticket.value) return false
  return (
    ticket.value.ticketType === 4 &&
    ticket.value.ticketStatus !== 3 &&
    ticket.value.ticketStatus !== 4
  )
})

// 是否待确认状态
const isPendingConfirm = computed(() => {
  return ticket.value?.ticketStatus === 2
})

// 是否已关闭
const isClosed = computed(() => {
  return ticket.value?.ticketStatus === 4
})

// 优先级标签颜色
const priorityTagType = computed(() => {
  const map: Record<number, 'default' | 'warning' | 'error'> = {
    3: 'error',
  }
  return map[ticket.value?.priority || 0] || 'default'
})

// 加急选项
const escalateOptions = computed(() => {
  const current = ticket.value?.priority || 1
  const options: Array<{ label: string; value: number }> = []
  if (current < 2) options.push({ label: '紧急 (2)', value: 2 })
  if (current < 3) options.push({ label: '特急 (3)', value: 3 })
  return options
})

// 默认加急级别
const defaultEscalateLevel = computed(() => {
  const current = ticket.value?.priority || 1
  return current < 3 ? current + 1 : 3
})

function goBack() {
  router.push('/driver/my-tickets')
}

// 回复
async function handleReply() {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  replyLoading.value = true
  try {
    await appendTicketMessage({ ticketId, content: replyContent.value })
    message.success('回复成功')
    replyContent.value = ''
    // 刷新详情
    ticket.value = await getTicketDetail(ticketId)
    chatHistory.value = ticket.value?.chatHistory || []
  } catch (error) {
    message.error('回复失败')
  } finally {
    replyLoading.value = false
  }
}

// 打开加急弹窗
function openEscalateModal() {
  escalateForm.value = { targetLevel: defaultEscalateLevel.value, reason: '' }
  showEscalateModal.value = true
}

// 确认加急
async function handleEscalate() {
  if (!escalateForm.value.reason.trim()) {
    message.warning('请输入加急理由')
    return
  }

  escalateLoading.value = true
  try {
    await escalateTicketByUser({
      ticketId,
      targetLevel: escalateForm.value.targetLevel,
      reason: escalateForm.value.reason,
    })
    message.success('加急成功')
    showEscalateModal.value = false
    // 刷新详情
    ticket.value = await getTicketDetail(ticketId)
  } catch (error) {
    message.error('加急失败')
  } finally {
    escalateLoading.value = false
  }
}

// 关闭工单
async function handleClose() {
  try {
    await cancelTicket(ticketId)
    message.success('工单已关闭')
    // 刷新详情
    ticket.value = await getTicketDetail(ticketId)
  } catch (error) {
    message.error('关闭失败')
  }
}

// 打开结单评价弹窗
function openFeedbackModal() {
  feedbackForm.value = { satisfied: true, rating: 5, feedbackContent: '' }
  showFeedbackModal.value = true
}

// 确认结单评价
async function handleFeedback() {
  feedbackLoading.value = true
  try {
    await feedbackTicket({
      ticketId,
      satisfied: feedbackForm.value.satisfied,
      rating: feedbackForm.value.rating,
      feedbackContent: feedbackForm.value.feedbackContent,
    })
    message.success('评价成功，工单已结单')
    showFeedbackModal.value = false
    // 刷新详情
    ticket.value = await getTicketDetail(ticketId)
  } catch (error) {
    message.error('评价失败')
  } finally {
    feedbackLoading.value = false
  }
}
</script>

<template>
  <div class="ticket-detail-page">
    <div class="detail-header">
      <NButton @click="goBack">
        <template #icon>
          <NIcon><BackIcon /></NIcon>
        </template>
        返回我的工单
      </NButton>
    </div>

    <NSplit class="detail-split" :default-size="0.5" :min="0.4" :max="0.7" preset="column">
      <template #1>
        <div class="info-section">
          <div class="section-header">
            <h2>工单信息</h2>
          </div>

          <div v-if="ticket" class="info-content">
            <!-- 操作按钮 -->
            <NCard size="small" class="action-card">
              <div class="action-buttons">
                <NButton
                  v-if="canEscalate"
                  type="error"
                  @click="openEscalateModal"
                  :disabled="isClosed"
                >
                  加急
                </NButton>
                <NButton v-if="isPendingConfirm" type="success" @click="openFeedbackModal">
                  结单评价
                </NButton>
                <NButton
                  v-else-if="!isClosed && ticket.ticketStatus !== 3"
                  type="warning"
                  @click="handleClose"
                >
                  关闭工单
                </NButton>
                <NTag v-else type="info" size="small">已关闭</NTag>
              </div>
            </NCard>

            <NCard title="基本信息" size="small">
              <div class="info-grid">
                <div class="info-item">
                  <NText depth="3">工单ID</NText>
                  <NText>{{ ticket.ticketId }}</NText>
                </div>
                <div class="info-item">
                  <NText depth="3">类型</NText>
                  <NTag size="small">{{ ticket.ticketTypeDesc }}</NTag>
                </div>
                <div class="info-item">
                  <NText depth="3">订单ID</NText>
                  <NText>{{ ticket.orderId || '-' }}</NText>
                </div>
                <div class="info-item">
                  <NText depth="3">状态</NText>
                  <NTag size="small">{{ ticket.ticketStatusDesc }}</NTag>
                </div>
                <div class="info-item">
                  <NText depth="3">优先级</NText>
                  <NTag :type="priorityTagType" size="small" round>
                    {{ ticket.priorityDesc }}
                  </NTag>
                </div>
                <div class="info-item">
                  <NText depth="3">创建时间</NText>
                  <NText>{{ ticket.createdAt }}</NText>
                </div>
              </div>
            </NCard>

            <NCard title="问题描述" size="small" class="info-card">
              <div class="ticket-title">
                {{ ticket.title }}
              </div>
              <div class="ticket-content">
                {{ ticket.content }}
              </div>
            </NCard>
          </div>
        </div>
      </template>

      <template #2>
        <div class="chat-section">
          <div class="section-header">
            <h2>对话记录</h2>
          </div>

          <div class="chat-messages">
            <template v-if="chatHistory.length > 0">
              <ChatMessage
                v-for="msg in chatHistory"
                :key="msg.id"
                :message="msg"
                :own-roles="[SenderRole.DRIVER]"
              />
            </template>
            <div v-else class="empty-chat">
              <NText depth="3">暂无对话记录</NText>
            </div>
          </div>

          <div class="reply-input">
            <NInput
              v-model:value="replyContent"
              type="textarea"
              placeholder="输入回复内容..."
              :autosize="{ minRows: 2, maxRows: 4 }"
              :disabled="isClosed"
              @keyup.ctrl.enter="handleReply"
            />
            <div class="reply-actions">
              <NText depth="3" size="small"> Ctrl + Enter 发送 </NText>
              <NButton
                type="primary"
                :loading="replyLoading"
                :disabled="isClosed"
                @click="handleReply"
              >
                发送
              </NButton>
            </div>
          </div>
        </div>
      </template>
    </NSplit>

    <!-- 加急弹窗 -->
    <NModal v-model:show="showEscalateModal" preset="card" title="加急工单" style="width: 400px">
      <div class="escalate-form">
        <div class="form-item">
          <NText>目标级别</NText>
          <NSelect v-model:value="escalateForm.targetLevel" :options="escalateOptions" />
        </div>
        <div class="form-item">
          <NText>加急理由</NText>
          <NInput
            v-model:value="escalateForm.reason"
            type="textarea"
            placeholder="请输入加急理由"
          />
        </div>
      </div>
      <template #action>
        <NButton @click="showEscalateModal = false">取消</NButton>
        <NButton type="error" :loading="escalateLoading" @click="handleEscalate">
          确认加急
        </NButton>
      </template>
    </NModal>

    <!-- 结单评价弹窗 -->
    <NModal v-model:show="showFeedbackModal" preset="card" title="工单评价" style="width: 450px">
      <div class="feedback-form">
        <div class="form-item">
          <NText>服务是否满意？</NText>
          <NRadioGroup v-model:value="feedbackForm.satisfied">
            <NButton-group>
              <NButton
                :type="feedbackForm.satisfied ? 'success' : 'default'"
                @click="feedbackForm.satisfied = true"
              >
                满意
              </NButton>
              <NButton
                :type="!feedbackForm.satisfied ? 'warning' : 'default'"
                @click="feedbackForm.satisfied = false"
              >
                不满意
              </NButton>
            </NButton-group>
          </NRadioGroup>
        </div>
        <div class="form-item">
          <NText>评分</NText>
          <NRate v-model:value="feedbackForm.rating" />
        </div>
        <div class="form-item">
          <NText>评价内容（可选）</NText>
          <NInput
            v-model:value="feedbackForm.feedbackContent"
            type="textarea"
            placeholder="请输入您的评价"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </div>
      </div>
      <template #action>
        <NButton @click="showFeedbackModal = false">取消</NButton>
        <NButton type="primary" :loading="feedbackLoading" @click="handleFeedback">
          提交评价
        </NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.ticket-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.detail-split {
  flex: 1;
  overflow: hidden;
}

.info-section,
.chat-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.section-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.info-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ticket-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.ticket-content {
  color: #475569;
  line-height: 1.6;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-start;
}

.escalate-form,
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-section {
  border-left: 1px solid #e2e8f0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem;
}

.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.reply-input {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}
</style>
