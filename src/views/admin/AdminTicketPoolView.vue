<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NSplit, NButton, useMessage } from 'naive-ui'
import TicketCard from '@/components/business/TicketCard.vue'
import { useTicketStore } from '@/stores/ticket'
import type { TicketVO } from '@/types/ticket'

const router = useRouter()
const message = useMessage()
const ticketStore = useTicketStore()

// 加载数据
onMounted(async () => {
  await ticketStore.refreshAll()
})

// 点击工单卡片
function handleTicketClick(ticket: TicketVO) {
  router.push(`/admin/tickets/${ticket.ticketId}`)
}

// 刷新列表
async function handleRefresh() {
  await ticketStore.refreshAll()
  message.success('已刷新')
}
</script>

<template>
  <div class="admin-ticket-pool">
    <div class="page-header">
      <h1>工单管理</h1>
      <NButton @click="handleRefresh">
        刷新
      </NButton>
    </div>

    <NSplit
      class="ticket-split"
      :default-size="0.5"
      :min="0.3"
      :max="0.7"
      preset="column"
    >
      <template #1>
        <div class="pool-section">
          <div class="section-header">
            <h2>待分配工单</h2>
            <NText depth="3">
              {{ ticketStore.unassignedPagination.total }} 个
            </NText>
          </div>

          <div class="ticket-grid">
            <TicketCard
              v-for="ticket in ticketStore.unassignedTickets"
              :key="ticket.ticketId"
              :ticket="ticket"
              @click="handleTicketClick"
            />
            <div v-if="ticketStore.unassignedTickets.length === 0" class="empty-state">
              <NText depth="3">暂无待分配工单</NText>
            </div>
          </div>
        </div>
      </template>

      <template #2>
        <div class="pool-section">
          <div class="section-header">
            <h2>已分配工单</h2>
            <NText depth="3">
              {{ ticketStore.assignedPagination.total }} 个
            </NText>
          </div>

          <div class="ticket-grid">
            <TicketCard
              v-for="ticket in ticketStore.assignedTickets"
              :key="ticket.ticketId"
              :ticket="ticket"
              @click="handleTicketClick"
            />
            <div v-if="ticketStore.assignedTickets.length === 0" class="empty-state">
              <NText depth="3">暂无已分配工单</NText>
            </div>
          </div>
        </div>
      </template>
    </NSplit>
  </div>
</template>

<style scoped>
.admin-ticket-pool {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.ticket-split {
  flex: 1;
  overflow: hidden;
}

.pool-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.section-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.ticket-grid {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}
</style>
