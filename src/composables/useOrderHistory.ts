import { computed, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { getOrderPage } from '@/api/order'
import type { OrderPageRecord } from '@/types/order'

export interface OrderHistoryItem {
  orderId: string
  startAddress: string
  endAddress: string
  distance: number | null
  price: number | null
  createdAt: string
  status: number | null
  statusName?: string | null
}

const STATUS_OPTIONS = [
  { label: '待接单', value: 10 },
  { label: '已接单', value: 20 },
  { label: '已到达', value: 30 },
  { label: '行程中', value: 40 },
  { label: '待支付', value: 50 },
  { label: '已完成', value: 60 },
  { label: '已取消', value: 90 },
]

const PAGE_SIZES = [10, 20, 30, 50]

export function useOrderHistory() {
  const message = useMessage()
  const orders = ref<OrderHistoryItem[]>([])
  const selectedStatuses = ref<number[]>([])
  const appliedStatuses = ref<number[]>([])
  const page = ref(1)
  const pageSize = ref(PAGE_SIZES[0] ?? 10)
  const checkedRowKeys = ref<Array<string | number>>([])
  const total = ref(0)
  const loading = ref(false)

  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  async function fetchOrders() {
    loading.value = true
    try {
      const res = await getOrderPage({
        page: page.value,
        size: pageSize.value,
        statusList: appliedStatuses.value.length > 0 ? appliedStatuses.value : undefined,
      })
      orders.value = (res.records || []).map((record) => normalizeRecord(record))
      total.value = res.total || 0
    } catch (error) {
      message.error('获取订单列表失败')
      orders.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    appliedStatuses.value = [...selectedStatuses.value]
    page.value = 1
    void fetchOrders()
  }

  function handlePageChange(value: number) {
    page.value = value
    void fetchOrders()
  }

  function handlePageSizeChange(value: number) {
    pageSize.value = value
    page.value = 1
    void fetchOrders()
  }

  function handleCheckedRowKeysChange(keys: Array<string | number>) {
    checkedRowKeys.value = keys
  }

  onMounted(() => {
    void fetchOrders()
  })

  return {
    orders: computed(() => orders.value),
    total,
    pageCount,
    loading,
    page,
    pageSize,
    pageSizes: PAGE_SIZES,
    statusOptions: STATUS_OPTIONS,
    selectedStatuses,
    checkedRowKeys,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleCheckedRowKeysChange,
  }
}

function normalizeRecord(record: OrderPageRecord): OrderHistoryItem {
  const distance = resolveNumber(record.realDistance ?? record.estDistance ?? record.distance)
  const price = resolveNumber(record.totalPrice ?? record.realPrice ?? record.estPrice)

  return {
    orderId: record.orderId,
    startAddress: record.startAddress?.trim() || '-',
    endAddress: record.endAddress?.trim() || '-',
    distance,
    price,
    createdAt: record.createTime || '-',
    status: resolveStatus(record.orderStatus ?? record.status),
    statusName: record.statusName ?? null,
  }
}

function resolveNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : null
}

function resolveStatus(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : null
}
