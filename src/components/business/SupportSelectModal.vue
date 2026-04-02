<script setup lang="ts">
import { ref, watch, h } from 'vue'
import { NModal, NInput, NButton, NDataTable, useMessage } from 'naive-ui'
import type { SupportUserVO } from '@/types/user'
import { getSupportUsers } from '@/api/user'

const props = defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
  select: [user: SupportUserVO]
}>()

const message = useMessage()

// 搜索关键词
const keyword = ref('')

// 加载状态
const loading = ref(false)

// 客服列表
const supportUsers = ref<SupportUserVO[]>([])

// 分页
interface PaginationState {
  current: number
  pageSize: number
  total: number
}
const pagination = ref<PaginationState>({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 表格列配置
const columns = [
  {
    title: '用户ID',
    key: 'userId',
    width: 100,
  },
  {
    title: '用户名',
    key: 'userName',
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render(row: SupportUserVO) {
      return h(NButton, {
        type: 'primary',
        size: 'small',
        onClick: () => emit('select', row),
      }, { default: () => '分配' })
    },
  },
]

// 加载客服列表
async function fetchSupportUsers(page = 1) {
  loading.value = true
  try {
    const result = await getSupportUsers({
      current: page,
      size: pagination.value.pageSize ?? 10,
      keyword: keyword.value || undefined,
    })
    supportUsers.value = result.records
    pagination.value = {
      ...pagination.value,
      current: result.current,
      pageSize: result.size,
      total: result.total,
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : '获取客服列表失败'
    message.error(err)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  if (pagination.value.current !== 1) {
    pagination.value.current = 1
  }
  fetchSupportUsers(1)
}

// 分页变化
function handlePageChange(page: number) {
  pagination.value.current = page
  fetchSupportUsers(page)
}

// 监听弹窗显示
watch(() => props.show, (val) => {
  if (val) {
    fetchSupportUsers(1)
  }
})

// 关闭弹窗
function handleClose() {
  emit('close')
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title || '分配工单'"
    style="width: 500px; max-width: 90vw;"
    @close="handleClose"
  >
    <div class="support-select-modal">
      <div class="search-row">
        <NInput
          v-model:value="keyword"
          placeholder="搜索用户名"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">
          搜索
        </NButton>
      </div>

      <NDataTable
        :columns="columns"
        :data="supportUsers"
        :loading="loading"
        :pagination="{ page: pagination.current, pageSize: pagination.pageSize, 'onUpdate:page': handlePageChange }"
        :bordered="false"
        size="small"
      />
    </div>
  </NModal>
</template>

<style scoped>
.support-select-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-row {
  display: flex;
  gap: 0.75rem;
}

.search-row > :first-child {
  flex: 1;
}
</style>
