<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NGrid, NGi, NCard, NStatistic, NText, NSpin, NIcon } from 'naive-ui'
import { AddOutline, TicketOutline, FlashOutline, CarOutline } from '@vicons/ionicons5'
import { getMyTicketPage } from '@/api/ticket'
import type { TicketVO } from '@/types/ticket'

const router = useRouter()

// 统计数据
const stats = ref({
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
})

const loading = ref(true)

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    const res = await getMyTicketPage({ current: 1, size: 100 })
    const tickets = res.records || []
    stats.value = {
      pendingCount: tickets.filter((t: TicketVO) => t.ticketStatus === 0 || t.ticketStatus === 1)
        .length,
      processingCount: tickets.filter((t: TicketVO) => t.ticketStatus === 1).length,
      completedCount: tickets.filter((t: TicketVO) => t.ticketStatus === 3).length,
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    stats.value = { pendingCount: 0, processingCount: 0, completedCount: 0 }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="driver-home">
    <h1>欢迎回来</h1>

    <NSpin :show="loading">
      <NGrid :cols="3" :x-gap="16" :y-gap="16">
        <NGi>
          <NCard>
            <NStatistic label="进行中工单">
              <template #prefix>
                <NText type="warning">{{ stats.pendingCount }}</NText>
              </template>
            </NStatistic>
          </NCard>
        </NGi>

        <NGi>
          <NCard>
            <NStatistic label="处理中">
              <template #prefix>
                <NText type="info">{{ stats.processingCount }}</NText>
              </template>
            </NStatistic>
          </NCard>
        </NGi>

        <NGi>
          <NCard>
            <NStatistic label="已完成">
              <template #prefix>
                <NText type="success">{{ stats.completedCount }}</NText>
              </template>
            </NStatistic>
          </NCard>
        </NGi>
      </NGrid>
    </NSpin>

    <div class="quick-actions">
      <h2>快捷操作</h2>
      <NGrid :cols="2" :x-gap="16" :y-gap="16">
        <NGi>
          <NCard hoverable @click="router.push('/driver/create-ticket')">
            <div class="action-card">
              <NIcon size="32" color="#18a058">
                <AddOutline />
              </NIcon>
              <span>新建工单</span>
            </div>
          </NCard>
        </NGi>

        <NGi>
          <NCard hoverable @click="router.push('/driver/my-tickets')">
            <div class="action-card">
              <NIcon size="32" color="#2080f0">
                <TicketOutline />
              </NIcon>
              <span>我的工单</span>
            </div>
          </NCard>
        </NGi>

        <NGi>
          <NCard hoverable @click="router.push('/driver/orders/pool')">
            <div class="action-card">
              <NIcon size="32" color="#f97316">
                <FlashOutline />
              </NIcon>
              <span>去抢单</span>
            </div>
          </NCard>
        </NGi>

        <NGi>
          <NCard hoverable @click="router.push('/driver/orders/current')">
            <div class="action-card">
              <NIcon size="32" color="#0ea5e9">
                <CarOutline />
              </NIcon>
              <span>当前订单</span>
            </div>
          </NCard>
        </NGi>
      </NGrid>
    </div>
  </div>
</template>

<style scoped>
.driver-home {
  padding: 1.5rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 2rem 0 1rem;
}

.quick-actions {
  margin-top: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.action-card span {
  font-size: 1rem;
  color: #334155;
}
</style>
