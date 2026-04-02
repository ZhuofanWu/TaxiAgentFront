<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NDataTable,
  NButton,
  NSelect,
  NInput,
  NDatePicker,
  NPagination,
  NTag,
  NSpace,
  useMessage,
} from 'naive-ui'
import { getTicketPage } from '@/api/ticket'
import { useAuthStore } from '@/stores/auth'
import type { TicketVO, TicketQueryParams } from '@/types/ticket'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const myHandlerId = computed<string | undefined>(() => {
  const id = authStore.currentUserId ?? authStore.userInfo?.userId
  if (id == null || String(id).trim() === '') return undefined
  return String(id).trim()
})

// 查询参数
const queryParams = ref<TicketQueryParams>({
  status: undefined,
  keyword: '',
  current: 1,
  size: 10,
})

// 表格数据
const tickets = ref<TicketVO[]>([])
const loading = ref(false)
const total = ref(0)

// 状态选项
const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '待分配', value: 0 },
  { label: '处理中', value: 1 },
  { label: '待确认', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已关闭', value: 4 },
]

// 加载数据
async function fetchData() {
  if (myHandlerId.value == null) {
    tickets.value = []
    total.value = 0
    message.warning('未获取到当前处理人ID，请重新登录后重试')
    return
  }

  loading.value = true
  try {
    const params = {
      ...queryParams.value,
      handlerId: myHandlerId.value,
    }
    const res = await getTicketPage(params)
    tickets.value = res.records
    total.value = res.total
  } catch (error) {
    message.error('加载工单失败')
  } finally {
    loading.value = false
  }
}

// 查询
function handleSearch() {
  queryParams.value.current = 1
  fetchData()
}

// 分页变化
function handlePageChange(page: number) {
  queryParams.value.current = page
  fetchData()
}

// 查看详情
function handleViewDetail(ticket: TicketVO) {
  router.push(`/admin/tickets/${ticket.ticketId}`)
}

// 表格列配置
const columns = [
  {
    title: '工单ID',
    key: 'ticketId',
    width: 180,
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
  },
  {
    title: '类型',
    key: 'ticketTypeDesc',
    width: 100,
  },
  {
    title: '优先级',
    key: 'priorityDesc',
    width: 80,
  },
  {
    title: '状态',
    key: 'ticketStatusDesc',
    width: 100,
    render(row: TicketVO) {
      const typeMap: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
        0: 'warning',
        1: 'info',
        2: 'default',
        3: 'success',
        4: 'error',
      }
      return h(
        NTag,
        { type: typeMap[row.ticketStatus] || 'default', size: 'small' },
        { default: () => row.ticketStatusDesc }
      )
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row: TicketVO) {
      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              { size: 'small', type: 'primary', quaternary: true, onClick: () => handleViewDetail(row) },
              { default: () => '查看' }
            ),
          ],
        }
      )
    },
  },
]

watch(myHandlerId, () => {
  fetchData()
}, { immediate: true })
</script>

<template>
  <div class="admin-my-tickets">
    <div class="page-header">
      <h1>我的工单</h1>
    </div>

    <!-- 查询控件 -->
    <NCard class="search-card">
      <div class="search-form">
        <div class="search-item">
          <span class="label">工单状态</span>
          <NSelect
            v-model:value="queryParams.status"
            :options="statusOptions"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
            @update:value="handleSearch"
          />
        </div>
        <div class="search-item">
          <span class="label">关键词</span>
          <NInput
            v-model:value="queryParams.keyword"
            placeholder="搜索标题、工单ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </div>
        <NButton type="primary" @click="handleSearch">
          查询
        </NButton>
      </div>
    </NCard>

    <!-- 表格 -->
    <NCard class="table-card">
      <NDataTable
        :columns="columns"
        :data="tickets"
        :loading="loading"
        :row-key="(row: TicketVO) => row.ticketId"
        :bordered="false"
        size="small"
      />
    </NCard>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <NPagination
        v-model:page="queryParams.current"
        :page-count="Math.ceil(total / queryParams.size)"
        :total="total"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-my-tickets {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.search-card {
  flex-shrink: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-item .label {
  font-size: 0.875rem;
  color: #64748b;
  white-space: nowrap;
}

.table-card {
  flex: 1;
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
