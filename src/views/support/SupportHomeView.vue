<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NStatistic,
  NGrid,
  NGridItem,
  NIcon,
  NSpin,
} from 'naive-ui'
import { useTicketStore } from '@/stores/ticket'

const ticketStore = useTicketStore()
const loading = ref(true)

onMounted(async () => {
  await ticketStore.refreshAll()
  loading.value = false
})
</script>

<template>
  <div class="support-home">
    <div class="page-header">
      <h1>客服工作台</h1>
    </div>

    <NSpin :show="loading">
      <NGrid :cols="3" :x-gap="16" :y-gap="16" class="stats-grid">
        <NGridItem>
          <NCard class="stat-card">
            <NStatistic
              label="待分配工单"
              :value="ticketStore.unassignedPagination.total"
            >
              <template #prefix>
                <NIcon class="stat-icon unassigned">
                  <svg viewBox="0 0 512 512" fill="currentColor">
                    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-38.2 40.6c-4.3 4.5-10.6 7-17 7s-12.7-2.5-17-7l-38.2-40.6L6.9 453.2c-9.1 3.8-19.1 1-28-1.6s-16.5-14-16-23l64-416c1.5-12.1 3.4-24.2 13.5-31.2s19.1-7.6 31.2-1.5l352 208c5.9 3.5 10.5 8.6 13.5 14.5s3.8 12.3 1.5 18.5l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-352-208c-9.1-3.8-19.1-1-28 1.6z"/>
                  </svg>
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>

        <NGridItem>
          <NCard class="stat-card">
            <NStatistic
              label="已分配工单"
              :value="ticketStore.assignedPagination.total"
            >
              <template #prefix>
                <NIcon class="stat-icon assigned">
                  <svg viewBox="0 0 512 512" fill="currentColor">
                    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-38.2 40.6c-4.3 4.5-10.6 7-17 7s-12.7-2.5-17-7l-38.2-40.6L6.9 453.2c-9.1 3.8-19.1 1-28-1.6s-16.5-14-16-23l64-416c1.5-12.1 3.4-24.2 13.5-31.2s19.1-7.6 31.2-1.5l352 208c5.9 3.5 10.5 8.6 13.5 14.5s3.8 12.3 1.5 18.5l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-352-208c-9.1-3.8-19.1-1-28 1.6z"/>
                  </svg>
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>

        <NGridItem>
          <NCard class="stat-card">
            <NStatistic
              label="总工单数"
              :value="ticketStore.unassignedPagination.total + ticketStore.assignedPagination.total"
            >
              <template #prefix>
                <NIcon class="stat-icon total">
                  <svg viewBox="0 0 512 512" fill="currentColor">
                    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-38.2 40.6c-4.3 4.5-10.6 7-17 7s-12.7-2.5-17-7l-38.2-40.6L6.9 453.2c-9.1 3.8-19.1 1-28-1.6s-16.5-14-16-23l64-416c1.5-12.1 3.4-24.2 13.5-31.2s19.1-7.6 31.2-1.5l352 208c5.9 3.5 10.5 8.6 13.5 14.5s3.8 12.3 1.5 18.5l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6l-352-208c-9.1-3.8-19.1-1-28 1.6z"/>
                  </svg>
                </NIcon>
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <NCard class="welcome-card">
        <div class="welcome-content">
          <h2>欢迎使用客服工作台</h2>
          <p>您可以点击左侧导航栏的"工单处理"开始处理工单。</p>
        </div>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.support-home {
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

.stats-grid {
  flex-shrink: 0;
}

.stat-card {
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-icon.unassigned {
  color: #f59e0b;
}

.stat-icon.assigned {
  color: #3b82f6;
}

.stat-icon.total {
  color: #10b981;
}

.welcome-card {
  flex: 1;
  border-radius: 8px;
}

.welcome-content {
  text-align: center;
  padding: 2rem;
}

.welcome-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.welcome-content p {
  color: #64748b;
  margin: 0;
}
</style>
