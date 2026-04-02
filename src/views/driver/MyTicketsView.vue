<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NDataTable,
  NTag,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NPagination,
  useMessage,
  NText,
} from 'naive-ui'
import { getMyTicketPage } from '@/api/ticket'
import type { TicketVO, TicketStatus, TicketType } from '@/types/ticket'

const router = useRouter()
const message = useMessage()

// 筛选条件
const searchKeyword = ref('')
const searchStatus = ref<number>(-1)
const searchType = ref<number>(-1)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表格数据
const loading = ref(false)
const tickets = ref<TicketVO[]>([])

// 状态选项
const statusOptions = [
  { label: '全部状态', value: -1 },
  { label: '待分配', value: 0 },
  { label: '处理中', value: 1 },
  { label: '待确认', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已关闭', value: 4 },
]

// 类型选项
const typeOptions = [
  { label: '全部类型', value: -1 },
  { label: '物品遗失', value: 1 },
  { label: '费用争议', value: 2 },
  { label: '服务投诉', value: 3 },
  { label: '安全问题', value: 4 },
  { label: '其他', value: 5 },
]

// 表格列配置
const columns = [
  {
    title: '工单ID',
    key: 'ticketId',
    width: 140,
  },
  {
    title: '类型',
    key: 'ticketTypeDesc',
    width: 100,
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '优先级',
    key: 'priorityDesc',
    width: 80,
    render(row: TicketVO) {
      const typeMap: Record<number, 'default' | 'warning' | 'error'> = {
        1: 'default',
        2: 'warning',
        3: 'error',
      }
      return h(NTag, { type: typeMap[row.priority] || 'default', size: 'small' }, { default: () => row.priorityDesc })
    },
  },
  {
    title: '状态',
    key: 'ticketStatusDesc',
    width: 100,
    render(row: TicketVO) {
      const typeMap: Record<number, 'default' | 'warning' | 'success' | 'info'> = {
        0: 'warning',
        1: 'info',
        2: 'success',
        3: 'success',
        4: 'default',
      }
      return h(NTag, { type: typeMap[row.ticketStatus] || 'default', size: 'small' }, { default: () => row.ticketStatusDesc })
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
      return h(NButton, { size: 'small', onClick: () => viewDetail(row.ticketId) }, { default: () => '查看' })
    },
  },
]

import { h } from 'vue'

function viewDetail(ticketId: string) {
  router.push(`/driver/tickets/${ticketId}`)
}

async function fetchTickets() {
  loading.value = true
  try {
    const res = await getMyTicketPage({
      keyword: searchKeyword.value || undefined,
      status: searchStatus.value === -1 ? undefined : searchStatus.value,
      type: searchType.value === -1 ? undefined : searchType.value,
      current: currentPage.value,
      size: pageSize.value,
    })
    tickets.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    message.error('获取工单列表失败')
    tickets.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchTickets()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchTickets()
}

onMounted(() => {
  fetchTickets()
})
</script>

<template>
  <div class="my-tickets-page">
    <h1>我的工单</h1>

    <NCard class="filter-card">
      <div class="filter-row">
        <NInput
          v-model:value="searchKeyword"
          placeholder="搜索工单标题..."
          clearable
          style="width: 250px"
          @keyup.enter="handleSearch"
        />
        <NSelect
          v-model:value="searchStatus"
          :options="statusOptions"
          placeholder="状态筛选"
          clearable
          style="width: 150px"
          @update:value="handleSearch"
        />
        <NSelect
          v-model:value="searchType"
          :options="typeOptions"
          placeholder="类型筛选"
          clearable
          style="width: 150px"
          @update:value="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">
          搜索
        </NButton>
      </div>
    </NCard>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="tickets"
        :loading="loading"
        :bordered="false"
        :pagination="false"
      />

      <div v-if="total > 0" class="pagination">
        <NPagination
          v-model:page="currentPage"
          :page-size="pageSize"
          :total="total"
          @update:page="handlePageChange"
        />
      </div>

      <div v-if="!loading && tickets.length === 0" class="empty">
        <NText depth="3">暂无工单</NText>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.my-tickets-page {
  padding: 1.5rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.filter-card {
  margin-bottom: 1rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}
</style>
