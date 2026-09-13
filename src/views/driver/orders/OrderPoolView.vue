<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NEmpty, NPagination, NSpin, NText, useDialog, useMessage } from 'naive-ui'
import DriverOrderPoolCard from '@/components/business/order/DriverOrderPoolCard.vue'
import { acceptDriverOrder, getDriverOrderPoolPage } from '@/api/order'
import { useDriverLocationStore } from '@/stores/driverLocation'
import type { DriverOrderPoolItem } from '@/types/order'

const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const driverLocation = useDriverLocationStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const orders = ref<DriverOrderPoolItem[]>([])
const page = ref(1)
const size = ref(8)
const total = ref(0)

// 后端在司机未上线时直接返回空池，这里据此把"附近确实没单"与"没上线"两种情况区分开
const showOfflineHint = computed(() => !driverLocation.online)

onMounted(async () => {
  await syncLocation()
  await fetchOrders()
})

/** 同步司机在线状态：可能是在「当前位置」页开过上线，也可能是刷新后恢复 */
async function syncLocation() {
  await driverLocation.syncStatus()
}

async function fetchOrders() {
  loading.value = true
  errorMessage.value = null
  try {
    const result = await getDriverOrderPoolPage({ page: page.value, size: size.value })
    orders.value = result.records
    total.value = result.total
  } catch (error) {
    orders.value = []
    total.value = 0
    errorMessage.value = error instanceof Error ? error.message : '加载订单池失败'
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  await syncLocation()
  await fetchOrders()
  if (!errorMessage.value) message.success('已刷新')
}

function handlePageChange(nextPage: number) {
  page.value = nextPage
  fetchOrders()
}

function goToLocation() {
  router.push('/driver/location')
}

function handleClaim(order: DriverOrderPoolItem) {
  dialog.warning({
    title: '认领订单',
    content: `确认认领订单 ${order.orderId}？`,
    positiveText: '认领',
    negativeText: '取消',
    onPositiveClick: () => claimOrder(order),
  })
}

async function claimOrder(order: DriverOrderPoolItem): Promise<boolean | void> {
  // 用司机在「当前位置」页设置好并已上报的坐标，不再每次现取浏览器定位
  const location = driverLocation.location
  if (!location) {
    message.error('尚未设置当前位置，请先到「当前位置」页设置并上线')
    return false
  }
  try {
    await acceptDriverOrder({
      orderId: order.orderId,
      currentLat: location.lat,
      currentLng: location.lng,
    })
    message.success('认领成功')
    router.push('/driver/orders/current')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '认领失败')
    return false
  }
}
</script>

<template>
  <div class="order-pool-page">
    <div class="page-header">
      <div>
        <div class="page-title">附近订单</div>
        <NText depth="3">离您最近的订单优先，共 {{ total }} 单</NText>
      </div>
      <div class="header-actions">
        <NButton size="small" secondary @click="handleRefresh">刷新</NButton>
      </div>
    </div>

    <NText v-if="errorMessage" depth="3" class="error-text">
      {{ errorMessage }}
    </NText>

    <NSpin :show="loading">
      <div class="card-grid">
        <DriverOrderPoolCard
          v-for="order in orders"
          :key="order.orderId"
          :order="order"
          @claim="handleClaim"
        />
        <div v-if="!loading && orders.length === 0" class="empty-state">
          <NEmpty
            :description="showOfflineHint ? '请先上线后再查看附近订单' : '附近暂无可认领订单'"
          >
            <template #extra>
              <NButton v-if="showOfflineHint" type="primary" secondary @click="goToLocation">
                去上线
              </NButton>
              <NButton v-else type="primary" secondary @click="handleRefresh">刷新看看</NButton>
            </template>
          </NEmpty>
        </div>
      </div>
    </NSpin>

    <div v-if="total > size" class="pagination-wrapper">
      <NPagination
        v-model:page="page"
        :page-size="size"
        :item-count="total"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-pool-page {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-text {
  color: #ef4444;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 48px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .order-pool-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
