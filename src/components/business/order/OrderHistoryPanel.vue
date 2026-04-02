<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NDataTable, NPagination, NSelect, NTag, NText } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useOrderHistory, type OrderHistoryItem } from '@/composables/useOrderHistory'

interface Props {
  title?: string
  detailPath: string
  showComplaint?: boolean
  ticketPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '历史订单',
  showComplaint: false,
})

const router = useRouter()
const {
  orders,
  total,
  pageCount,
  loading,
  page,
  pageSize,
  pageSizes,
  statusOptions,
  selectedStatuses,
  checkedRowKeys,
  handleSearch,
  handlePageChange,
  handlePageSizeChange,
  handleCheckedRowKeysChange,
} = useOrderHistory()

const paginationPageSizes = pageSizes.map((size) => ({
  label: `${size} / 页`,
  value: size,
}))
const paginationGotoLabel = () => '跳转到'

const statusLabelMap: Record<number, string> = {
  10: '待接单',
  20: '已接单',
  30: '已到达',
  40: '行程中',
  50: '待支付',
  60: '已完成',
  90: '已取消',
}

const statusTypeMap: Record<number, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  10: 'warning',
  20: 'info',
  30: 'info',
  40: 'info',
  50: 'warning',
  60: 'success',
  90: 'error',
}

function handleViewDetail(orderId: string) {
  router.push({ path: props.detailPath, query: { orderId } })
}

function handleComplaint(orderId: string) {
  if (!props.ticketPath) return
  router.push({ path: props.ticketPath, query: { orderId } })
}

const columns = computed<DataTableColumns<OrderHistoryItem>>(() => [
  {
    type: 'selection',
  },
  {
    title: '订单号',
    key: 'orderId',
    width: 140,
  },
  {
    title: '起止地址',
    key: 'route',
    minWidth: 260,
    render(row) {
      return h('div', { class: 'address-cell' }, [
        h('div', { class: 'address-line' }, row.startAddress),
        h('div', { class: 'address-line end' }, row.endAddress),
      ])
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render(row) {
      const label = row.statusName || (row.status ? statusLabelMap[row.status] : '') || '-'
      const type = row.status ? statusTypeMap[row.status] || 'default' : 'default'
      return h(NTag, { size: 'small', type }, { default: () => label })
    },
  },
  {
    title: '距离',
    key: 'distance',
    width: 100,
    render(row) {
      if (row.distance === null) return '-'
      return `${row.distance.toFixed(1)} km`
    },
  },
  {
    title: '价格',
    key: 'price',
    width: 100,
    render(row) {
      if (row.price === null) return '-'
      return `¥${row.price.toFixed(2)}`
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
    width: props.showComplaint ? 180 : 110,
    render(row) {
      const actions = [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => handleViewDetail(row.orderId),
          },
          { default: () => '查看详情' },
        ),
      ]

      if (props.showComplaint) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'warning',
              secondary: true,
              onClick: () => handleComplaint(row.orderId),
            },
            { default: () => '投诉' },
          ),
        )
      }

      return h('div', { class: 'action-buttons' }, actions)
    },
  },
])
</script>

<template>
  <div class="order-history-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ title }}</div>
        <NText depth="3">查看各端的历史行程记录与费用概览。</NText>
      </div>
      <div class="summary">共 {{ total }} 条记录</div>
    </div>

    <NCard class="filter-card">
      <div class="filter-row">
        <div class="pagination-box">
          <span class="label">分页</span>
          <NPagination
            :page="page"
            :page-size="pageSize"
            :page-sizes="paginationPageSizes"
            :page-count="pageCount"
            :total="total"
            :goto="paginationGotoLabel"
            show-quick-jumper
            show-size-picker
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </div>
        <div class="filter-actions">
          <NSelect
            v-model:value="selectedStatuses"
            :options="statusOptions"
            multiple
            clearable
            placeholder="选择订单状态"
            style="min-width: 220px"
          />
          <NButton type="primary" @click="handleSearch">搜索</NButton>
        </div>
      </div>
    </NCard>

    <NCard class="table-card">
      <NDataTable
        :columns="columns"
        :data="orders"
        :loading="loading"
        :bordered="false"
        :pagination="false"
        :row-key="(row: OrderHistoryItem) => row.orderId"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
      />
    </NCard>

    <div class="pagination-footer">
      <NPagination
        :page="page"
        :page-size="pageSize"
        :page-sizes="paginationPageSizes"
        :page-count="pageCount"
        :total="total"
        :goto="paginationGotoLabel"
        show-quick-jumper
        show-size-picker
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-history-page {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.summary {
  font-size: 0.875rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
}

.filter-card {
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pagination-box .label {
  font-size: 0.875rem;
  color: #64748b;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: nowrap;
}

.order-history-page :deep(.n-pagination-quick-jumper)::after {
  content: '页';
  margin-left: 0.35rem;
}

.table-card {
  flex: 1;
}

.address-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.address-line {
  color: #475569;
  font-size: 0.85rem;
}

.address-line.end {
  color: #0f172a;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-actions {
    flex-wrap: wrap;
  }

  .pagination-footer {
    justify-content: flex-start;
  }
}
</style>
