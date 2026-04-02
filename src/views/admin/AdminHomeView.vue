<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NGrid, NGi, NCard, NStatistic, NText, NSpin } from 'naive-ui'
import { getTicketStatistics } from '@/api/ticket'
import type { TicketDataVO } from '@/types/ticket'

// 统计数据
const stats = ref<TTicketStats>({
  pendingCount: 0,
  processingCount: 0,
  todayCount: 0,
  completedCount: 0,
})

// 原始API数据
const ticketData = ref<TicketDataVO | null>(null)
const loading = ref(true)

// 兼容类型定义
interface TTicketStats {
  pendingCount: number
  processingCount: number
  todayCount: number
  completedCount: number
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    ticketData.value = await getTicketStatistics()
    // 字段映射：API返回的字段名 -> 组件使用的字段名
    stats.value = {
      pendingCount: ticketData.value?.pendingAssignCount ?? 0,
      processingCount: ticketData.value?.processingCount ?? 0,
      todayCount: ticketData.value?.todayCreatedCount ?? 0,
      completedCount: ticketData.value?.todayCompletedCount ?? 0,
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 使用默认值
    stats.value = {
      pendingCount: 0,
      processingCount: 0,
      todayCount: 0,
      completedCount: 0,
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="admin-home">
    <h1>工作台</h1>

    <NSpin :show="loading">
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGi>
          <NCard>
            <NStatistic label="待分配工单">
              <template #prefix>
                <NText type="warning">{{ stats.pendingCount }}</NText>
              </template>
            </NStatistic>
          </NCard>
        </NGi>

        <NGi>
          <NCard>
            <NStatistic label="处理中工单">
              <template #prefix>
                <NText type="info">{{ stats.processingCount }}</NText>
              </template>
            </NStatistic>
          </NCard>
        </NGi>

        <NGi>
          <NCard>
            <NStatistic label="今日工单">
              <template #prefix>
                <NText type="primary">{{ stats.todayCount }}</NText>
              </template>
            </NStatistic>
          </NCard>
        </NGi>

        <NGi>
          <NCard>
            <NStatistic label="今日完成">
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
      <NCard>
        <NText>快捷操作功能开发中...</NText>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.admin-home {
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
</style>
