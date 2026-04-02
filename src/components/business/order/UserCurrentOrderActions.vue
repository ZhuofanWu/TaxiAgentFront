<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NInput, NSelect, NText, useDialog, useMessage } from 'naive-ui'
import { cancelOrder, payOrder } from '@/api/order'
import type { PayChannel, RideOrderDetail } from '@/types/order'

interface Props {
  order: RideOrderDetail
}

const props = defineProps<Props>()
const emit = defineEmits<{ (event: 'refresh'): void }>()

const router = useRouter()
const dialog = useDialog()
const message = useMessage()

type ActionType = 'pay' | 'cancel'

const activeAction = ref<ActionType | null>(null)
const cancelReason = ref('')
const payForm = ref({
  payChannel: 1 as PayChannel,
  tradeNo: '',
})

const payChannelOptions = [
  { label: '微信支付', value: 1 },
  { label: '支付宝', value: 2 },
  { label: '银行卡', value: 3 },
]

const statusCode = computed(() => resolveNumber(props.order.orderStatus) ?? 0)
const canPay = computed(() => statusCode.value === 50)
const canCancel = computed(() => statusCode.value > 0 && statusCode.value < 40)
const isActionBusy = computed(() => activeAction.value !== null)

const cancelHint = computed(() => {
  if (canCancel.value) return ''
  if (statusCode.value >= 40 && statusCode.value < 90) return '行程已开始，无法取消'
  if (statusCode.value === 90) return '订单已取消'
  if (statusCode.value === 60) return '订单已完成'
  return '订单暂不支持取消'
})

function handleComplaint() {
  router.push({
    path: '/user/create-ticket',
    query: { orderId: props.order.orderId },
  })
}

function handlePay() {
  if (!canPay.value) {
    message.warning('当前订单暂不可支付')
    return
  }
  payForm.value = {
    payChannel: 1,
    tradeNo: buildTradeNo(),
  }
  dialog.info({
    title: '订单支付',
    content: () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          },
        },
        [
          h('div', null, [
            h(
              'div',
              { style: { color: '#64748b', fontSize: '12px', marginBottom: '6px' } },
              '支付渠道',
            ),
            h(NSelect, {
              value: payForm.value.payChannel,
              options: payChannelOptions,
              placeholder: '请选择支付渠道',
              onUpdateValue: (value: PayChannel) => {
                payForm.value.payChannel = value
              },
            }),
          ]),
          h('div', null, [
            h(
              'div',
              { style: { color: '#64748b', fontSize: '12px', marginBottom: '6px' } },
              '交易流水号',
            ),
            h(NInput, {
              value: payForm.value.tradeNo,
              placeholder: '请输入交易流水号',
              onUpdateValue: (value: string) => {
                payForm.value.tradeNo = value
              },
            }),
          ]),
        ],
      ),
    positiveText: '确认支付',
    negativeText: '取消',
    onPositiveClick: async () => {
      const tradeNo = payForm.value.tradeNo.trim()
      if (!tradeNo) {
        message.warning('请输入交易流水号')
        return false
      }
      return runAction('pay', async () => {
        try {
          const success = await payOrder(props.order.orderId, {
            payChannel: payForm.value.payChannel,
            tradeNo,
          })
          if (!success) {
            message.error('支付失败，请稍后重试')
            return false
          }
          message.success('支付成功')
          emit('refresh')
          return true
        } catch (error) {
          message.error(error instanceof Error ? error.message : '支付失败')
          return false
        }
      })
    },
  })
}

function handleCancel() {
  if (!canCancel.value) {
    message.warning('行程已开始，无法取消')
    return
  }
  cancelReason.value = ''
  dialog.warning({
    title: '取消订单',
    content: () =>
      h(NInput, {
        type: 'textarea',
        value: cancelReason.value,
        placeholder: '请输入取消原因',
        autosize: { minRows: 3, maxRows: 5 },
        onUpdateValue: (value: string) => {
          cancelReason.value = value
        },
      }),
    positiveText: '确认取消',
    negativeText: '暂不取消',
    onPositiveClick: async () => {
      const reason = cancelReason.value.trim()
      if (!reason) {
        message.warning('请输入取消原因')
        return false
      }
      return runAction('cancel', async () => {
        try {
          const result = await cancelOrder(props.order.orderId, {
            cancelRole: 1,
            cancelReason: reason,
          })
          if (!result.success) {
            message.error('取消失败，请稍后重试')
            return false
          }
          message.success('订单已取消')
          emit('refresh')
          if (result.penalty && result.penalty > 0) {
            dialog.warning({
              title: '违约金提示',
              content: `本次取消产生违约金 ¥${result.penalty.toFixed(2)}`,
              positiveText: '知道了',
            })
          }
          return true
        } catch (error) {
          message.error(error instanceof Error ? error.message : '取消失败')
          return false
        }
      })
    },
  })
}

async function runAction(type: ActionType, action: () => Promise<boolean>): Promise<boolean> {
  activeAction.value = type
  try {
    return await action()
  } finally {
    activeAction.value = null
  }
}

function buildTradeNo(): string {
  return `TX${Date.now()}`
}

function resolveNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}
</script>

<template>
  <div class="action-panel">
    <div class="action-buttons">
      <NButton
        v-if="canPay"
        type="primary"
        :loading="activeAction === 'pay'"
        :disabled="isActionBusy && activeAction !== 'pay'"
        @click="handlePay"
      >
        支付
      </NButton>
      <NButton
        secondary
        :loading="activeAction === 'cancel'"
        :disabled="!canCancel || (isActionBusy && activeAction !== 'cancel')"
        @click="handleCancel"
      >
        取消
      </NButton>
      <NButton tertiary :disabled="isActionBusy" @click="handleComplaint">投诉</NButton>
    </div>
    <NText v-if="cancelHint" depth="3">{{ cancelHint }}</NText>
  </div>
</template>

<style scoped>
.action-panel {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
