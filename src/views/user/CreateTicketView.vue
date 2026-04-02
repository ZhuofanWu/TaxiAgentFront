<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NRadioGroup,
  NRadio,
  useMessage,
} from 'naive-ui'
import { createTicket } from '@/api/ticket'
import type { TicketType, TicketPriority } from '@/types/ticket'

const router = useRouter()
const route = useRoute()
const message = useMessage()

// 表单数据
const formData = ref({
  orderId: '',
  ticketType: null as number | null,
  priority: 1,
  title: '',
  content: '',
})

// 工单类型选项
const ticketTypeOptions = [
  { label: '物品遗失', value: 1 },
  { label: '费用争议', value: 2 },
  { label: '服务投诉', value: 3 },
  { label: '安全问题', value: 4 },
  { label: '其他', value: 5 },
]

// 优先级选项
const priorityOptions = [
  { label: '普通', value: 1 },
  { label: '紧急', value: 2 },
  { label: '特急', value: 3 },
]

// 是否为安全问题（仅安全问题可选择紧急/特急）
const isSecurityIssue = computed(() => formData.value.ticketType === 4)

// 动态优先级选项
const availablePriorityOptions = computed(() => {
  if (isSecurityIssue.value) {
    return priorityOptions
  }
  return priorityOptions.filter((opt) => opt.value === 1)
})

const loading = ref(false)

// 预设订单ID（如果有）
if (route.query.orderId) {
  formData.value.orderId = String(route.query.orderId)
}

async function handleSubmit() {
  if (!formData.value.ticketType) {
    message.warning('请选择工单类型')
    return
  }
  if (!formData.value.title.trim()) {
    message.warning('请输入问题标题')
    return
  }
  if (!formData.value.content.trim()) {
    message.warning('请输入问题描述')
    return
  }

  loading.value = true
  try {
    const orderId = formData.value.orderId.trim()
    const ticketId = await createTicket({
      orderId: orderId || undefined,
      ticketType: formData.value.ticketType,
      priority: formData.value.priority,
      title: formData.value.title.trim(),
      content: formData.value.content.trim(),
    })
    message.success('工单创建成功')
    // 根据当前路径跳转到对应的工单详情
    const basePath = route.path.startsWith('/driver') ? '/driver' : '/user'
    router.push(`${basePath}/tickets/${ticketId}`)
  } catch (error) {
    message.error('创建工单失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-ticket-page">
    <h1>新建工单</h1>

    <NCard>
      <NForm :model="formData" label-placement="top">
        <NFormItem label="工单标题" required>
          <NInput
            v-model:value="formData.title"
            placeholder="简要描述您的问题"
            :maxlength="120"
            show-count
          />
        </NFormItem>

        <NFormItem label="关联订单（可选）">
          <NInput
            v-model:value="formData.orderId"
            placeholder="请输入订单ID"
            clearable
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="工单类型" required>
          <NRadioGroup v-model:value="formData.ticketType">
            <div class="type-options">
              <NRadio v-for="opt in ticketTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </div>
          </NRadioGroup>
        </NFormItem>

        <NFormItem label="优先级">
          <NSelect
            v-model:value="formData.priority"
            :options="availablePriorityOptions"
            :disabled="!isSecurityIssue"
            style="width: 200px"
          />
        </NFormItem>

        <NFormItem label="问题描述" required>
          <NInput
            v-model:value="formData.content"
            type="textarea"
            placeholder="详细描述您遇到的问题"
            :autosize="{ minRows: 4, maxRows: 8 }"
            :maxlength="1500"
            show-count
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" :loading="loading" @click="handleSubmit"> 提交工单 </NButton>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.create-ticket-page {
  padding: 1.5rem;
  max-width: 800px;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
