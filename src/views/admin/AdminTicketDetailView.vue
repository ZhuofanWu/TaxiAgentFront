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
  useMessage,
} from 'naive-ui'
import ChatMessage from '@/components/business/ChatMessage.vue'
import SupportSelectModal from '@/components/business/SupportSelectModal.vue'
import { useTicketStore } from '@/stores/ticket'
import { useAuthStore } from '@/stores/auth'
import { replyTicket } from '@/api/ticket'

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
const ticketStore = useTicketStore()
const authStore = useAuthStore()

const ticketId = route.params.id as string
const replyContent = ref('')
const replyLoading = ref(false)
const showAssignModal = ref(false)
const showEscalateModal = ref(false)
const showRejectModal = ref(false)
const showTransferModal = ref(false)
const escalateLoading = ref(false)
const rejectLoading = ref(false)
const transferLoading = ref(false)
const escalateForm = ref({ targetLevel: 2, reason: '' })
const rejectForm = ref({ reason: '' })
const transferForm = ref({ reason: '' })

// 聊天记录 - 直接从currentTicket获取
const chatHistory = computed(() => ticketStore.currentTicket?.chatHistory || [])

onMounted(async () => {
  try {
    await ticketStore.fetchTicketDetail(ticketId)
  } catch (error) {
    message.error('获取工单详情失败')
    router.push('/admin/tickets')
  }
})

const isAssigned = computed(() => !!ticketStore.currentTicket?.handlerId)

const isHandledByCurrentUser = computed(() => {
  const handlerId = ticketStore.currentTicket?.handlerId
  const currentUserId = authStore.userInfo?.userId
  return handlerId && currentUserId && String(handlerId) === currentUserId
})

const canTakeOver = computed(() => isAssigned.value && !isHandledByCurrentUser.value)

const typeTagType = computed(() => {
  const map: Record<number, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
    4: 'error',
  }
  return map[ticketStore.currentTicket?.ticketType || 0] || 'default'
})

const priorityTagType = computed(() => {
  const map: Record<number, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
    3: 'error',
  }
  return map[ticketStore.currentTicket?.priority || 0] || 'default'
})

const canEscalate = computed(() => {
  const priority = ticketStore.currentTicket?.priority
  return priority && priority < 3
})

const canConfirm = computed(() => {
  const status = ticketStore.currentTicket?.ticketStatus
  return status === 1
})

const escalateOptions = computed(() => {
  const current = ticketStore.currentTicket?.priority || 1
  const options: Array<{ label: string; value: number }> = []
  if (current < 2) options.push({ label: '紧急 (2)', value: 2 })
  if (current < 3) options.push({ label: '特急 (3)', value: 3 })
  return options
})

const defaultEscalateLevel = computed(() => {
  const current = ticketStore.currentTicket?.priority || 1
  return current < 3 ? current + 1 : 3
})

function goBack() {
  router.push('/admin/tickets')
}

async function handleClaim() {
  try {
    await ticketStore.claim(ticketId)
    message.success('认领成功')
  } catch (error) {
    message.error('认领失败')
  }
}

async function handleTakeOver() {
  try {
    await ticketStore.takeOver(ticketId)
    message.success('接管成功')
  } catch (error) {
    message.error('接管失败')
  }
}

function openAssignModal() {
  showAssignModal.value = true
}

async function handleSelectSupport(user: { userId: number | string }) {
  try {
    if (isAssigned.value) {
      await ticketStore.reassign(ticketId, String(user.userId))
      message.success('再分配成功')
    } else {
      await ticketStore.assign(ticketId, String(user.userId))
      message.success('分配成功')
    }
    showAssignModal.value = false
  } catch (error) {
    message.error(isAssigned.value ? '再分配失败' : '分配失败')
  }
}

async function handleReply() {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  replyLoading.value = true
  try {
    await replyTicket(ticketId, replyContent.value)
    message.success('回复成功')
    replyContent.value = ''
    await ticketStore.fetchTicketDetail(ticketId)
  } catch (error) {
    message.error('回复失败')
  } finally {
    replyLoading.value = false
  }
}

function openEscalateModal() {
  escalateForm.value = { targetLevel: defaultEscalateLevel.value, reason: '' }
  showEscalateModal.value = true
}

async function handleEscalate() {
  if (!escalateForm.value.reason.trim()) {
    message.warning('请输入加急理由')
    return
  }
  escalateLoading.value = true
  try {
    await ticketStore.escalate(ticketId, escalateForm.value.targetLevel, escalateForm.value.reason)
    message.success('加急成功')
    showEscalateModal.value = false
  } catch (error) {
    message.error('加急失败')
  } finally {
    escalateLoading.value = false
  }
}

function openRejectModal() {
  rejectForm.value = { reason: '' }
  showRejectModal.value = true
}

async function handleReject() {
  if (!rejectForm.value.reason.trim()) {
    message.warning('请输入驳回理由')
    return
  }
  rejectLoading.value = true
  try {
    await ticketStore.reject(ticketId, rejectForm.value.reason)
    message.success('驳回成功')
    showRejectModal.value = false
  } catch (error) {
    message.error('驳回失败')
  } finally {
    rejectLoading.value = false
  }
}

function openTransferModal() {
  transferForm.value = { reason: '' }
  showTransferModal.value = true
}

async function handleTransferConfirm() {
  if (!transferForm.value.reason.trim()) {
    message.warning('请输入转交理由')
    return
  }
  transferLoading.value = true
  try {
    await ticketStore.transfer(ticketId, transferForm.value.reason)
    message.success('转交成功')
    showTransferModal.value = false
  } catch (error) {
    message.error('转交失败')
  } finally {
    transferLoading.value = false
  }
}

async function handleConfirm() {
  try {
    await ticketStore.resolve(ticketId, '提交用户确认')
    message.success('已提交用户确认')
  } catch (error) {
    message.error('操作失败')
  }
}
</script>

<template>
  <div class="admin-ticket-detail">
    <div class="detail-header">
      <NButton @click="goBack">
        <template #icon>
          <NIcon><BackIcon /></NIcon>
        </template>
        返回工单池
      </NButton>
    </div>

    <NSplit class="detail-split" :default-size="0.5" :min="0.4" :max="0.7" preset="column">
      <template #1>
        <div class="info-section">
          <div class="section-header">
            <h2>工单信息</h2>
          </div>

          <div v-if="ticketStore.currentTicket" class="info-content">
            <!-- 操作按钮 -->
            <NCard size="small" class="action-card">
              <div class="action-buttons">
                <template v-if="!isAssigned">
                  <NButton type="primary" @click="openAssignModal"> 分配 </NButton>
                  <NButton type="warning" @click="handleClaim"> 认领 </NButton>
                </template>
                <template v-else-if="isHandledByCurrentUser">
                  <NButton type="info" @click="openAssignModal"> 再分配 </NButton>
                </template>
                <template v-else>
                  <NButton type="info" @click="openAssignModal"> 再分配 </NButton>
                  <NButton type="warning" @click="handleTakeOver"> 接管 </NButton>
                </template>
                <NButton v-if="canEscalate" type="error" @click="openEscalateModal"> 加急 </NButton>
                <NButton type="warning" @click="openTransferModal"> 转交 </NButton>
                <NButton type="error" @click="openRejectModal"> 驳回 </NButton>
                <NButton v-if="canConfirm" type="success" @click="handleConfirm">
                  提交确认
                </NButton>
              </div>
            </NCard>

            <NCard title="基本信息" size="small">
              <div class="info-grid">
                <div class="info-item">
                  <NText depth="3">工单ID</NText>
                  <NText>{{ ticketStore.currentTicket.ticketId }}</NText>
                </div>
                <div class="info-item">
                  <NText depth="3">发起人</NText>
                  <NText>{{ ticketStore.currentTicket.userTypeDesc }}</NText>
                </div>
                <div class="info-item">
                  <NText depth="3">订单ID</NText>
                  <NText>{{ ticketStore.currentTicket.orderId || '-' }}</NText>
                </div>
                <div class="info-item">
                  <NText depth="3">类型</NText>
                  <NTag :type="typeTagType" size="small" round>
                    {{ ticketStore.currentTicket.ticketTypeDesc }}
                  </NTag>
                </div>
                <div class="info-item">
                  <NText depth="3">状态</NText>
                  <NTag size="small">{{ ticketStore.currentTicket.ticketStatusDesc }}</NTag>
                </div>
                <div class="info-item">
                  <NText depth="3">优先级</NText>
                  <NTag :type="priorityTagType" size="small" round>
                    {{ ticketStore.currentTicket.priorityDesc }}
                  </NTag>
                </div>
              </div>
            </NCard>

            <NCard title="问题描述" size="small" class="info-card">
              <div class="ticket-title">
                {{ ticketStore.currentTicket.title }}
              </div>
              <div class="ticket-content">
                {{ ticketStore.currentTicket.content }}
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
              <ChatMessage v-for="msg in chatHistory" :key="msg.id" :message="msg" />
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
              @keyup.ctrl.enter="handleReply"
            />
            <div class="reply-actions">
              <NText depth="3" size="small"> Ctrl + Enter 发送 </NText>
              <NButton type="primary" :loading="replyLoading" @click="handleReply"> 发送 </NButton>
            </div>
          </div>
        </div>
      </template>
    </NSplit>

    <SupportSelectModal
      :show="showAssignModal"
      title="分配工单"
      @close="showAssignModal = false"
      @select="handleSelectSupport"
    />

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

    <NModal v-model:show="showRejectModal" preset="card" title="驳回工单" style="width: 400px">
      <div class="escalate-form">
        <div class="form-item">
          <NText>驳回理由</NText>
          <NInput v-model:value="rejectForm.reason" type="textarea" placeholder="请输入驳回理由" />
        </div>
      </div>
      <template #action>
        <NButton @click="showRejectModal = false">取消</NButton>
        <NButton type="error" :loading="rejectLoading" @click="handleReject"> 确认驳回 </NButton>
      </template>
    </NModal>

    <NModal v-model:show="showTransferModal" preset="card" title="转交工单" style="width: 400px">
      <div class="escalate-form">
        <div class="form-item">
          <NText>转交理由</NText>
          <NInput
            v-model:value="transferForm.reason"
            type="textarea"
            placeholder="请输入转交理由"
          />
        </div>
      </div>
      <template #action>
        <NButton @click="showTransferModal = false">取消</NButton>
        <NButton type="warning" :loading="transferLoading" @click="handleTransferConfirm">
          确认转交
        </NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.admin-ticket-detail {
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

.action-card {
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-start;
}

.escalate-form {
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
